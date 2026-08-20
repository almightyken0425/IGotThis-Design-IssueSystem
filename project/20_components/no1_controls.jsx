// ─────────────────────────────────────────────────────────────
// Controls · 基礎控件組
//
// IGotThis 工單系統的八件基礎控件：Button / IconButton / Select /
// TextInput / Checkbox / Badge / Avatar / Chip。
//
// 消費畫面：
//   - ListScreen 檢視工具列 — Select（排序依據、分組依據）、
//     IconButton（欄位顯示設定入口）、TextInput（搜尋）、Chip（已套用篩選）
//   - ListScreen 工單表格 — Checkbox（列多選）、Badge（Status 欄）、
//     Avatar（Assignee 欄）
//   - 後續的看板、開發順序表等畫面共用同一組控件
//
// 三條硬規：
//   1. 一切視覺值引用 token。尺寸走 10_foundations/component_tokens/
//      no1_control_tokens.jsx，色彩走傳入的 theme 物件。本檔無 hex、無 raw number
//   2. 每個元件吃 theme 參數（預設 DEFAULT_THEME），light / dark 都能用。
//      不引用 THEME_LIGHT，也不讀 canvas 快照 TOKENS
//   3. 狀態齊備。互動元件備妥預設 / hover / focus / disabled；Select 另備 open、
//      Button 另備 loading、Checkbox 另備 checked 與 indeterminate
//
// focus 表達：可聚焦控件靜置外框吃 theme.border.input（3:1 必要邊界），
// 取得焦點時外加一圈 theme.state.focus.ring。ring 用 boxShadow 疊在外框外側，
// 不改變 layout 尺寸。canvas 以 onFocus / onBlur 追蹤，非 CSS :focus-visible，
// 故滑鼠點擊也會顯示 ring——這是 sandbox 便於檢視的取捨，impl 端請用 :focus-visible。
//
// ControlGlyph 為 canvas 自製 SVG，只承載本組控件所需的少量 UI glyph。
// 圖示庫成形後移出本檔、改由共用 icon 檔提供，元件呼叫端不變。
// ─────────────────────────────────────────────────────────────

// loading spinner 的旋轉 keyframes。inline style 表達不了 keyframes，
// 載入時注入一次；id 去重避免重複載入時堆疊。
(function injectControlKeyframes() {
  if (document.getElementById('igt-control-keyframes')) return;
  const el = document.createElement('style');
  el.id = 'igt-control-keyframes';
  el.textContent = '@keyframes igt-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(el);
})();

// TYPE_STYLES 的一條 → React inline style。lineHeight 一律絕對 px。
function textStyle(t) {
  return {
    fontSize:      t.size,
    fontWeight:    t.weight,
    lineHeight:    `${t.lineHeight}px`,
    letterSpacing: t.letterSpacing,
  };
}

// ─── ControlGlyph ─── canvas 視覺 mock，stroke 型 24 格線稿
// name 為語意名；size 吃 ICON_SIZE 階梯，color 由呼叫端給 token 色。
const CONTROL_GLYPH_PATHS = {
  'chevron-down':  'M6 9.5 12 15.5 18 9.5',
  'chevron-up':    'M6 14.5 12 8.5 18 14.5',
  'chevron-right': 'M9.5 6 15.5 12 9.5 18',
  'x':             'M6.5 6.5 17.5 17.5 M17.5 6.5 6.5 17.5',
  'check':         'M5 12.5 9.5 17 19 7.5',
  'minus':         'M6 12H18',
  'plus':          'M12 6V18 M6 12H18',
  'search':        'M10.5 4.5A6 6 0 1 0 10.5 16.5A6 6 0 1 0 10.5 4.5 M15 15 19.5 19.5',
  'columns':       'M4 5H20V19H4Z M10 5V19 M15 5V19',
  'sort':          'M4 6.5H18 M4 12H13 M4 17.5H8',
  'filter':        'M4 5H20L13.5 12.5V18.5L10.5 20V12.5Z',
  'dots':          'M6 12H6.01 M12 12H12.01 M18 12H18.01',
};

function ControlGlyph({ name, size = ICON_SIZE.md, color, strokeWidth = CONTROL_SHARED_TOKENS.GLYPH_STROKE.base }) {
  const d = CONTROL_GLYPH_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      <path d={d}/>
    </svg>
  );
}

// ─── ControlSpinner ─── Button loading 態的轉圈；不對外 export
// 以 conic 邊框做圈：三邊透明、一邊上色，轉起來即讀作進度未知的等待。
function ControlSpinner({ size, color }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: RADIUS.full,
      border: `${BUTTON_TOKENS.SPINNER_STROKE}px solid ${color}`,
      borderRightColor: 'transparent',
      borderTopColor: 'transparent',
      animation: `igt-spin ${BUTTON_TOKENS.SPINNER_MS}ms linear infinite`,
      boxSizing: 'border-box',
    }}/>
  );
}

// ─── Button ─── 文字動作鈕
// props:
//   variant  'primary' | 'secondary' | 'ghost'（預設 secondary，工具列常態）
//   size     'md' | 'sm'（預設 md）
//   iconLeft / iconRight  ControlGlyph 的 name
//   loading  轉圈取代 iconLeft，label 留在原位、寬度不跳動
//   disabled 依 variant 分流：實心降 opacity、有框退框、無框只換字色
//   fullWidth 撐滿容器寬
function Button({
  label, variant = 'secondary', size = 'md',
  iconLeft, iconRight, loading = false, disabled = false,
  fullWidth = false, onClick, theme = DEFAULT_THEME, style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const c    = BUTTON_TOKENS.COLORS_BY_VARIANT(theme)[variant];
  const off  = disabled || loading;
  const live = hover && !off;

  const fg = disabled && !c.useOpacityWhenDisabled
    ? theme.state.disabled.fg
    : (live ? c.fgHover : c.fg);
  const border = disabled && !c.useOpacityWhenDisabled && c.border !== 'transparent'
    ? theme.border.base                       // 有框態失效：必要邊界退回裝飾線
    : (live ? c.borderHover : c.border);

  return (
    <button
      onClick={off ? undefined : onClick}
      disabled={off}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: BUTTON_TOKENS.GAP,
        height: BUTTON_TOKENS.HEIGHT[size],
        width: fullWidth ? '100%' : undefined,
        padding: `0 ${BUTTON_TOKENS.PADDING_H[size]}px`,
        borderRadius: BUTTON_TOKENS.RADIUS,
        border: `${BUTTON_TOKENS.BORDER_WIDTH}px solid ${border}`,
        background: live ? c.bgHover : c.bg,
        color: fg,
        opacity: disabled && c.useOpacityWhenDisabled ? theme.state.disabled.opacity : 1,
        cursor: disabled ? 'not-allowed' : (loading ? 'progress' : 'pointer'),
        fontFamily: FONT_FAMILY.base,
        ...textStyle(BUTTON_TOKENS.TEXT[size]),
        whiteSpace: 'nowrap',
        outline: 'none',
        boxShadow: focus && !off ? controlFocusRing(theme) : 'none',
        transition: `background ${BUTTON_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}, color ${BUTTON_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}`,
        ...style,
      }}
    >
      {loading
        ? <ControlSpinner size={BUTTON_TOKENS.ICON[size]} color={fg}/>
        : iconLeft && <ControlGlyph name={iconLeft} size={BUTTON_TOKENS.ICON[size]} color={fg}/>}
      {label}
      {iconRight && <ControlGlyph name={iconRight} size={BUTTON_TOKENS.ICON[size]} color={fg}/>}
    </button>
  );
}

// ─── IconButton ─── 方形圖示鈕
// 工具列的欄位顯示設定入口、表格 row 的行內動作用。
// 無 label，故一律帶 title 作 tooltip 與無障礙名稱。
// active 供 toggle 型入口用（面板展開中），視覺走 state.selected。
function IconButton({
  icon, title, variant = 'ghost', size = 'md',
  active = false, disabled = false, onClick,
  theme = DEFAULT_THEME, style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const c    = ICON_BUTTON_TOKENS.COLORS_BY_VARIANT(theme)[variant];
  const live = hover && !disabled;

  const fg =
    disabled ? theme.state.disabled.fg :
    active   ? theme.state.selected.fg :
    live     ? c.fgHover : c.fg;
  const bg =
    active ? theme.state.selected.bg :
    live   ? c.bgHover : c.bg;
  const border =
    active ? theme.state.selected.border :
    disabled && c.border !== 'transparent' ? theme.border.base :
    live   ? c.borderHover : c.border;

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width:  ICON_BUTTON_TOKENS.SIZE[size],
        height: ICON_BUTTON_TOKENS.SIZE[size],
        padding: 0,
        borderRadius: ICON_BUTTON_TOKENS.RADIUS,
        border: `${ICON_BUTTON_TOKENS.BORDER_WIDTH}px solid ${border}`,
        background: bg,
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        boxShadow: focus && !disabled ? controlFocusRing(theme) : 'none',
        transition: `background ${ICON_BUTTON_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}`,
        ...style,
      }}
    >
      <ControlGlyph name={icon} size={ICON_BUTTON_TOKENS.ICON[size]} color={fg}/>
    </button>
  );
}

// ─── Select ─── 下拉選單
// 排序依據、分組依據用。trigger + level2 浮層 menu，self-contained 開合狀態。
// props:
//   prefix     行內前綴，如「排序」；渲染成「排序:」與值同行、色階低一階
//   options    [{ value, label }]
//   value      受控選中值；找不到對應 option 時顯示 placeholder
//   onChange   (value) => void
//   fullWidth  撐滿容器寬度；窄欄表單直向堆疊多個 Select 時用，比照 Button / TextInput 同名 prop
function Select({
  prefix, options = [], value, placeholder = '請選擇', onChange,
  size = 'md', disabled = false, fullWidth = false, theme = DEFAULT_THEME, style = {},
}) {
  const [open, setOpen]   = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const wrapRef = React.useRef(null);

  // 點外面或按 Escape 收合。open 才掛 listener，收合時解除。
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey  = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);
  const live     = (hover || open) && !disabled;
  const fg       = disabled ? theme.state.disabled.fg : theme.text.primary;
  const border   = disabled ? theme.border.base
                 : (open ? theme.state.focus.ring : theme.border.input);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative', display: 'inline-flex',
        width: fullWidth ? '100%' : undefined,
        ...style,
      }}
    >
      <button
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: SELECT_TOKENS.GAP,
          height: SELECT_TOKENS.HEIGHT[size],
          width: fullWidth ? '100%' : undefined,
          padding: `0 ${SELECT_TOKENS.PADDING_RIGHT}px 0 ${SELECT_TOKENS.PADDING_LEFT}px`,
          position: 'relative',
          borderRadius: SELECT_TOKENS.RADIUS,
          border: `${SELECT_TOKENS.BORDER_WIDTH}px solid ${border}`,
          background: live ? theme.bg.surface_hover : theme.bg.surface,
          color: fg,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: FONT_FAMILY.base,
          ...textStyle(SELECT_TOKENS.TEXT[size]),
          whiteSpace: 'nowrap',
          outline: 'none',
          boxShadow: focus && !disabled ? controlFocusRing(theme) : 'none',
          transition: `background ${SELECT_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}`,
        }}
      >
        {prefix && (
          <span style={{
            ...textStyle(SELECT_TOKENS.PREFIX_TEXT),
            color: disabled ? theme.state.disabled.fg : theme.text.tertiary,
          }}>
            {prefix}:
          </span>
        )}
        <span style={{ color: selected ? fg : theme.text.tertiary }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{
          position: 'absolute', top: 0, bottom: 0, right: SELECT_TOKENS.PADDING_LEFT,
          display: 'flex', alignItems: 'center',
        }}>
          <ControlGlyph
            name={open ? 'chevron-up' : 'chevron-down'}
            size={SELECT_TOKENS.CHEVRON_SIZE}
            color={disabled ? theme.state.disabled.fg : theme.text.tertiary}
          />
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: '100%', left: 0, zIndex: 50,
            marginTop: SELECT_TOKENS.MENU.OFFSET,
            width: fullWidth ? '100%' : undefined,
            minWidth: SELECT_TOKENS.MENU.MIN_WIDTH,
            maxHeight: SELECT_TOKENS.MENU.MAX_HEIGHT,
            overflowY: 'auto',
            padding: SELECT_TOKENS.MENU.PADDING,
            borderRadius: SELECT_TOKENS.MENU.RADIUS,
            border: `${SELECT_TOKENS.BORDER_WIDTH}px solid ${theme.border.base}`,
            background: theme.bg.surface,
            boxShadow: controlShadow(theme, SELECT_TOKENS.MENU.ELEVATION),
            fontFamily: FONT_FAMILY.base,
          }}
        >
          {options.map(o => (
            <SelectOption
              key={o.value}
              option={o}
              selected={o.value === value}
              theme={theme}
              onPick={() => { onChange && onChange(o.value); setOpen(false); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Select 的單列選項；hover 與選中兩態分開，選中列以 trailing check 表達。
function SelectOption({ option, selected, theme, onPick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={onPick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: SELECT_TOKENS.GAP,
        height: SELECT_TOKENS.MENU.ITEM_HEIGHT,
        padding: `0 ${SELECT_TOKENS.MENU.ITEM_PADDING_H}px`,
        borderRadius: SELECT_TOKENS.MENU.ITEM_RADIUS,
        background: selected ? theme.state.selected.bg : (hover ? theme.state.hover.bg : 'transparent'),
        color: selected ? theme.state.selected.fg : theme.text.primary,
        ...textStyle(SELECT_TOKENS.MENU.ITEM_TEXT),
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{option.label}</span>
      {selected && (
        <ControlGlyph name="check" size={SELECT_TOKENS.MENU.CHECK_SIZE} color={theme.state.selected.fg} strokeWidth={CONTROL_SHARED_TOKENS.GLYPH_STROKE.mark}/>
      )}
    </div>
  );
}

// ─── TextInput ─── 文字輸入
// 搜尋與篩選用。leadingIcon 常給 'search'；有值時右側出現清除鈕。
function TextInput({
  value = '', placeholder = '', leadingIcon, onChange, onClear,
  size = 'md', disabled = false, clearable = true,
  fullWidth = false, theme = DEFAULT_THEME, style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const showClear = clearable && !!value && !disabled;
  const border = disabled ? theme.border.base
               : (focus ? theme.state.focus.ring : theme.border.input);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: TEXT_INPUT_TOKENS.GAP,
        height: TEXT_INPUT_TOKENS.HEIGHT[size],
        width: fullWidth ? '100%' : undefined,
        padding: `0 ${TEXT_INPUT_TOKENS.PADDING_H}px`,
        borderRadius: TEXT_INPUT_TOKENS.RADIUS,
        border: `${TEXT_INPUT_TOKENS.BORDER_WIDTH}px solid ${border}`,
        background: disabled ? theme.bg.surface_dim
                  : (hover && !focus ? theme.bg.surface_hover : theme.bg.surface),
        boxShadow: focus && !disabled ? controlFocusRing(theme) : 'none',
        transition: `background ${TEXT_INPUT_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}`,
        ...style,
      }}
    >
      {leadingIcon && (
        <ControlGlyph
          name={leadingIcon}
          size={TEXT_INPUT_TOKENS.LEADING_ICON[size]}
          color={disabled ? theme.state.disabled.fg : theme.text.tertiary}
        />
      )}
      <input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, minWidth: 0,
          border: 'none', background: 'transparent', outline: 'none', padding: 0,
          fontFamily: FONT_FAMILY.base,
          ...textStyle(TEXT_INPUT_TOKENS.TEXT[size]),
          color: disabled ? theme.state.disabled.fg : theme.text.primary,
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {showClear && (
        <ClearButton theme={theme} onClick={() => { onClear ? onClear() : onChange && onChange(''); }}/>
      )}
    </div>
  );
}

// TextInput 的清除鈕；圓形點擊區、hover 才浮出底色。
function ClearButton({ theme, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      title="清除"
      aria-label="清除"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: TEXT_INPUT_TOKENS.CLEAR_HIT, height: TEXT_INPUT_TOKENS.CLEAR_HIT,
        flexShrink: 0, padding: 0,
        borderRadius: RADIUS.full, border: 'none',
        background: hover ? theme.state.hover.bg : 'transparent',
        cursor: 'pointer', outline: 'none',
      }}
    >
      <ControlGlyph
        name="x"
        size={TEXT_INPUT_TOKENS.CLEAR_ICON_SIZE}
        color={hover ? theme.text.primary : theme.text.tertiary}
        strokeWidth={CONTROL_SHARED_TOKENS.GLYPH_STROKE.bold}
      />
    </button>
  );
}

// ─── Checkbox ─── 多選
// 表格列多選與欄位顯示設定的顯示 / 隱藏開關用。
// indeterminate 供「全選」表頭的部分選取態。
function Checkbox({
  checked = false, indeterminate = false, label,
  size = 'md', disabled = false, onChange,
  theme = DEFAULT_THEME, style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const c    = CHECKBOX_TOKENS.COLORS(theme);
  const on   = checked || indeterminate;
  const live = hover && !disabled;

  // 已勾的 disabled 走整體降 opacity（見 token 檔 disabled 三態分流），底色不另換。
  const boxBg     = on ? c.bgChecked : c.bg;
  const boxBorder = disabled ? c.disabledBorder
                  : (on ? c.borderChecked : (live ? c.borderHover : c.border));

  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: CHECKBOX_TOKENS.GAP,
        height: CHECKBOX_TOKENS.HIT_HEIGHT[size],
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && on ? theme.state.disabled.opacity : 1,
        userSelect: 'none',
        ...style,
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.checked)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0,
        }}
      />
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: CHECKBOX_TOKENS.BOX[size], height: CHECKBOX_TOKENS.BOX[size],
        flexShrink: 0,
        borderRadius: CHECKBOX_TOKENS.RADIUS,
        border: `${CHECKBOX_TOKENS.BORDER_WIDTH}px solid ${boxBorder}`,
        background: boxBg,
        boxShadow: focus && !disabled ? controlFocusRing(theme) : 'none',
        transition: `background ${CHECKBOX_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}`,
      }}>
        {on && (
          <ControlGlyph
            name={indeterminate ? 'minus' : 'check'}
            size={CHECKBOX_TOKENS.BOX[size]}
            color={c.mark}
            strokeWidth={CHECKBOX_TOKENS.MARK_STROKE}
          />
        )}
      </span>
      {label && (
        <span style={{
          fontFamily: FONT_FAMILY.base,
          ...textStyle(CHECKBOX_TOKENS.LABEL_TEXT[size]),
          color: disabled ? c.disabledFg : c.labelFg,
        }}>
          {label}
        </span>
      )}
    </label>
  );
}

// ─── Badge ─── 狀態標籤
// Status 欄與權限過濾標示等處用。tone 吃 semantic 四色與 neutral 中性色；
// 文字一律走該 tone 的 _fg，圓點才吃基準色。
// dot 預設開：色彩之外多一層形狀線索，色覺障礙者不靠色相也能分辨。
function Badge({ label, tone = 'neutral', dot = true, theme = DEFAULT_THEME, style = {} }) {
  const c = BADGE_TOKENS.COLORS_BY_TONE(theme)[tone] || BADGE_TOKENS.COLORS_BY_TONE(theme).neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: BADGE_TOKENS.GAP,
      height: BADGE_TOKENS.HEIGHT,
      padding: `0 ${BADGE_TOKENS.PADDING_H}px`,
      borderRadius: BADGE_TOKENS.RADIUS,
      background: c.bg,
      color: c.fg,
      fontFamily: FONT_FAMILY.base,
      ...textStyle(BADGE_TOKENS.TEXT),
      whiteSpace: 'nowrap',
      ...style,
    }}>
      {dot && (
        <span style={{
          width: BADGE_TOKENS.DOT_SIZE, height: BADGE_TOKENS.DOT_SIZE,
          borderRadius: RADIUS.full, background: c.dot, flexShrink: 0,
        }}/>
      )}
      {label}
    </span>
  );
}

// ─── Avatar ─── 負責人頭像
// Assignee 欄用。無圖時取姓名字首：中日文取末一字（姓氏在前、辨識度在後段），
// 拉丁字母取首字母、有空白則取前兩段首字母。
function avatarInitials(name) {
  const s = String(name || '').trim();
  if (!s) return '';
  const parts = s.split(/\s+/);
  if (parts.length > 1 && /^[A-Za-z]/.test(s)) {
    return parts.slice(0, AVATAR_TOKENS.INITIAL_MAX).map(p => p[0]).join('').toUpperCase();
  }
  if (/^[A-Za-z]/.test(s)) return s.slice(0, 1).toUpperCase();
  return s.slice(-1);
}

function Avatar({ name, tone = 'primary', size = 'md', theme = DEFAULT_THEME, style = {} }) {
  const c = AVATAR_TOKENS.COLORS_BY_TONE(theme)[tone] || AVATAR_TOKENS.COLORS_BY_TONE(theme).primary;
  return (
    <span
      title={name}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: AVATAR_TOKENS.SIZE[size], height: AVATAR_TOKENS.SIZE[size],
        flexShrink: 0,
        borderRadius: AVATAR_TOKENS.RADIUS,
        border: `${AVATAR_TOKENS.BORDER_WIDTH}px solid ${c.border}`,
        background: c.bg,
        color: c.fg,
        fontFamily: FONT_FAMILY.base,
        ...textStyle(AVATAR_TOKENS.TEXT[size]),
        userSelect: 'none',
        ...style,
      }}
    >
      {avatarInitials(name)}
    </span>
  );
}

// ─── Chip ─── 可移除的篩選標籤
// 工具列下方顯示已套用的篩選條件。
// props:
//   label     欄位名前綴，如「Status」；渲染成「Status:」色階低一階
//   value     條件值
//   selected  進行中 / 被聚焦的條件，走 state.selected
//   onRemove  給了才出現移除鈕；不給就是純唯讀標籤
function Chip({
  label, value, selected = false, onRemove, onClick,
  theme = DEFAULT_THEME, style = {},
}) {
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const [removeHover, setRemoveHover] = React.useState(false);
  const c = CHIP_TOKENS.COLORS(theme)[selected ? 'selected' : 'base'];
  const clickable = !!onClick;

  return (
    <span
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      tabIndex={clickable ? 0 : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: CHIP_TOKENS.GAP,
        height: CHIP_TOKENS.HEIGHT,
        paddingLeft: CHIP_TOKENS.PADDING_LEFT,
        paddingRight: onRemove ? CHIP_TOKENS.PADDING_RIGHT_REMOVE : CHIP_TOKENS.PADDING_RIGHT,
        borderRadius: CHIP_TOKENS.RADIUS,
        border: `${CHIP_TOKENS.BORDER_WIDTH}px solid ${c.border}`,
        background: hover && clickable ? c.bgHover : c.bg,
        color: c.fg,
        fontFamily: FONT_FAMILY.base,
        ...textStyle(CHIP_TOKENS.TEXT),
        whiteSpace: 'nowrap',
        cursor: clickable ? 'pointer' : 'default',
        outline: 'none',
        boxShadow: focus && clickable ? controlFocusRing(theme) : 'none',
        transition: `background ${CHIP_TOKENS.TRANSITION_MS}ms ${CONTROL_SHARED_TOKENS.TRANSITION_EASING}`,
        ...style,
      }}
    >
      {label && (
        <span style={{ ...textStyle(CHIP_TOKENS.LABEL_TEXT), color: c.labelFg }}>{label}:</span>
      )}
      {value}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="移除條件"
          aria-label="移除條件"
          onMouseEnter={() => setRemoveHover(true)}
          onMouseLeave={() => setRemoveHover(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: CHIP_TOKENS.REMOVE_HIT, height: CHIP_TOKENS.REMOVE_HIT,
            flexShrink: 0, padding: 0,
            borderRadius: RADIUS.full, border: 'none',
            background: removeHover ? c.removeBgHover : 'transparent',
            cursor: 'pointer', outline: 'none',
          }}
        >
          <ControlGlyph
            name="x"
            size={CHIP_TOKENS.REMOVE_ICON_SIZE}
            color={removeHover ? c.removeFgHover : c.removeFg}
            strokeWidth={CONTROL_SHARED_TOKENS.GLYPH_STROKE.bold}
          />
        </button>
      )}
    </span>
  );
}

Object.assign(window, {
  ControlGlyph, CONTROL_GLYPH_PATHS,
  Button, IconButton, Select, TextInput, Checkbox, Badge, Avatar, Chip,
  avatarInitials,
});
