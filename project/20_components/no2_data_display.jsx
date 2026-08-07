// ─────────────────────────────────────────────────────────────
// Components · 資料展示組
//
// 角色：把工單資料攤成可掃描的表格與看板，含無資料與權限過濾兩種提示。
// 消費畫面：
//   - ListScreen（spec no2_screens/no1_list_screen.md）
//       DataTable + TableCell 系列 + FilterNotice + EmptyState
//   - KanbanScreen（spec no2_screens/no2_kanban_screen.md）
//       KanbanColumn + KanbanCard + FilterNotice + EmptyState
//
// 共同約定：
//   - 每個元件吃 theme 物件參數（THEME_LIGHT 或 THEME_DARK），不寫死主題
//   - 一切視覺值取自 DATA_DISPLAY_TOKENS 與 DATA_DISPLAY_COLORS，本檔不寫 hex、不寫裸數字
//   - 狀態齊備：預設 / hover / focus / selected / disabled，看板卡另有拖曳與載入態
//   - focus 一律「outline 吃 state.focus.ring + 元件外框轉 border.input」，
//     後者是 atomic 層指定的必要邊界色，兩主題都過 3:1
//   - Badge 與 Avatar 若已由基礎元件組（window.Badge / window.Avatar）提供則直接沿用，
//     未載入時走本檔的等價 fallback，兩者視覺參數同源
// ─────────────────────────────────────────────────────────────

// ─── 內部工具（DD_ 前綴避免與其他元件組的全域名稱相撞）───────

function DD_type(style, extra) {
  return {
    fontSize: style.size,
    fontWeight: style.weight,
    lineHeight: `${style.lineHeight}px`,
    letterSpacing: style.letterSpacing,
    ...(extra || {}),
  };
}

function DD_hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)).join(',');
}

// elevation 三階轉 CSS box-shadow；陰影色讀 theme.shadow.color（sand 暖深階）。
function DD_shadow(shadowColor, level) {
  if (!level || (level.offsetY === 0 && level.blur === 0)) return 'none';
  return `0 ${level.offsetY}px ${level.blur}px 0 rgba(${DD_hexToRgb(shadowColor)},${level.opacity})`;
}

// focus 視覺單一出口：outline 走 focus ring、外框轉必要邊界色。
function DD_focusStyle(colors, width, offset) {
  return {
    outline: `${width}px solid ${colors.focusRing}`,
    outlineOffset: offset,
    borderColor: colors.focusBorder,
  };
}

function DD_ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('dd-data-display-keyframes')) return;
  const el = document.createElement('style');
  el.id = 'dd-data-display-keyframes';
  el.textContent = '@keyframes ddSpin { to { transform: rotate(360deg) } }';
  document.head.appendChild(el);
}

function DD_initials(name) {
  const s = String(name || '').trim();
  if (!s) return '?';
  // 中日文取末一字（姓名慣例）、拉丁字母取首字母。
  return /[㐀-鿿]/.test(s) ? s.slice(-1) : s.slice(0, 1).toUpperCase();
}

// canvas 自製 glyph，尺寸吃 ICON_SIZE、色吃 currentColor 之外的傳入色。
function DD_Glyph({ name, size, color, style }) {
  const p = {
    width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
    stroke: color, strokeWidth: DATA_DISPLAY_TOKENS.GLYPH_STROKE,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    style, 'aria-hidden': true,
  };
  switch (name) {
    case 'sort-asc':  return <svg {...p}><path d="M8 12.5V3.5M4.5 7L8 3.5 11.5 7"/></svg>;
    case 'sort-desc': return <svg {...p}><path d="M8 3.5v9M4.5 9l3.5 3.5L11.5 9"/></svg>;
    case 'sort-none': return <svg {...p}><path d="M5 6.5L8 3.5l3 3M5 9.5l3 3 3-3"/></svg>;
    case 'funnel':    return <svg {...p}><path d="M2.5 3.5h11L9.3 8.4v4.1l-2.6 1.2V8.4z"/></svg>;
    case 'inbox':     return <svg {...p}><path d="M2.5 9.5h3l1 2h3l1-2h3M2.5 9.5l1.6-6h7.8l1.6 6v3h-11z"/></svg>;
    case 'clock':     return <svg {...p}><circle cx="8" cy="8" r="5.5"/><path d="M8 5v3.2l2 1.3"/></svg>;
    case 'plus':      return <svg {...p}><path d="M8 3.5v9M3.5 8h9"/></svg>;
    default:          return null;
  }
}

// Badge / Avatar 接口：基礎元件組（20_components/no1_controls.jsx）載入時直接用它們，
// props 依 Badge({ label, tone, dot, theme }) 與 Avatar({ name, size, tone, theme }) 的真名。
// 未載入時走 fallback，幾何鏡射 BADGE_TOKENS / AVATAR_TOKENS，視覺結果一致。
function DD_BadgeSlot({ theme, tone, label, height, radius, paddingX, typeStyle, dot, neutralBg, neutralFg }) {
  const External = typeof window !== 'undefined' ? window.Badge : null;
  if (External) return <External theme={theme} tone={tone || 'neutral'} label={label} dot={dot} style={{ minWidth: 0, overflow: 'hidden' }} />;
  const known = tone && theme.status[`${tone}_bg`];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', maxWidth: '100%',
      height, padding: `0 ${paddingX}px`, borderRadius: radius,
      background: known ? theme.status[`${tone}_bg`] : neutralBg,
      color: known ? theme.status[`${tone}_fg`] : neutralFg,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      ...DD_type(typeStyle),
    }}>{label}</span>
  );
}

function DD_AvatarSlot({ theme, user, sizeKey, size, bg, fg, typeStyle }) {
  const External = typeof window !== 'undefined' ? window.Avatar : null;
  const name = typeof user === 'string' ? user : (user && user.name) || '';
  if (External) return <External theme={theme} name={name} size={sizeKey} tone="primary" />;
  return (
    <span
      title={name}
      style={{
        width: size, height: size, borderRadius: RADIUS.full, flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: bg, color: fg,
        ...DD_type(typeStyle, { lineHeight: `${size}px`, fontWeight: TYPOGRAPHY.weight.medium }),
      }}
    >{DD_initials(name)}</span>
  );
}

// ─────────────────────────────────────────────────────────────
// TableCell 系列
// 各格都吃 theme 與 density；編號與數字統一 NUMERIC_FONT_VARIANT。
// ─────────────────────────────────────────────────────────────

function TableCell({ theme, density = 'base', align = 'left', muted = false, disabled = false, style, children }) {
  const T = DATA_DISPLAY_TOKENS.TABLE;
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  const justify = align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';
  return (
    <div
      role="cell"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: justify,
        gap: T.CELL_INNER_GAP, minWidth: 0, height: '100%',
        padding: `0 ${T.CELL_PADDING_X_BY_DENSITY[density]}px`,
        color: disabled ? c.disabledFg : muted ? c.rowMutedFg : 'inherit',
        fontFamily: FONT_FAMILY.base,
        ...DD_type(T.CELL_TYPE),
        ...(style || {}),
      }}
    >{children}</div>
  );
}

function DD_Truncate({ children, title }) {
  return (
    <span title={title} style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// 文字格
function TableTextCell({ theme, density, align, muted, disabled, value }) {
  return (
    <TableCell theme={theme} density={density} align={align} muted={muted} disabled={disabled}>
      <DD_Truncate title={typeof value === 'string' ? value : undefined}>{value}</DD_Truncate>
    </TableCell>
  );
}

// 編號格：mono + tabular-nums，色走 primary.main（雙主題都過 AA）
function TableKeyCell({ theme, density, align, disabled, value, onClick }) {
  const T = DATA_DISPLAY_TOKENS.TABLE;
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  return (
    <TableCell theme={theme} density={density} align={align} disabled={disabled}>
      <DD_Truncate title={value}>
        <span
          onClick={disabled ? undefined : onClick}
          style={{
            fontFamily: FONT_FAMILY.mono,
            fontVariantNumeric: NUMERIC_FONT_VARIANT,
            color: disabled ? c.disabledFg : c.keyFg,
            cursor: onClick && !disabled ? 'pointer' : 'inherit',
            ...DD_type(T.KEY_TYPE, { fontWeight: T.KEY_WEIGHT }),
          }}
        >{value}</span>
      </DD_Truncate>
    </TableCell>
  );
}

// 狀態格：放 Badge
function TableStatusCell({ theme, density, align, disabled, status }) {
  const T = DATA_DISPLAY_TOKENS.TABLE;
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  const label = typeof status === 'string' ? status : (status && status.label) || '';
  const tone = typeof status === 'object' && status ? status.tone : undefined;
  return (
    <TableCell theme={theme} density={density} align={align} disabled={disabled}>
      <DD_BadgeSlot
        theme={theme} tone={tone} label={label} dot={T.BADGE_DOT}
        height={T.BADGE_HEIGHT} radius={T.BADGE_RADIUS} paddingX={T.BADGE_PADDING_X}
        typeStyle={T.BADGE_TYPE} neutralBg={c.neutralBadgeBg} neutralFg={c.neutralBadgeFg}
      />
    </TableCell>
  );
}

// 使用者格：放 Avatar + 名稱
function TableUserCell({ theme, density, align, disabled, user, showName = true }) {
  const T = DATA_DISPLAY_TOKENS.TABLE;
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  const name = typeof user === 'string' ? user : (user && user.name) || '';
  if (!name) return <TableCell theme={theme} density={density} align={align} muted disabled={disabled}>—</TableCell>;
  return (
    <TableCell theme={theme} density={density} align={align} disabled={disabled}>
      <DD_AvatarSlot theme={theme} user={user} sizeKey={T.AVATAR_SIZE_KEY} size={T.AVATAR_SIZE}
        bg={c.avatarBg} fg={c.avatarFg} typeStyle={T.AVATAR_TYPE} />
      {showName && <DD_Truncate title={name}>{name}</DD_Truncate>}
    </TableCell>
  );
}

// 日期格：tabular-nums，逾期與將到期各自吃 status 的 _fg 深階
function TableDateCell({ theme, density, align, disabled, date }) {
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  const label = typeof date === 'string' ? date : (date && date.label) || '';
  const tone = typeof date === 'object' && date ? date.tone : undefined;
  const fg = disabled ? c.disabledFg
    : tone === 'overdue' ? c.overdueFg
    : tone === 'soon' ? c.dueSoonFg
    : undefined;
  return (
    <TableCell theme={theme} density={density} align={align} disabled={disabled}
      style={{ fontVariantNumeric: NUMERIC_FONT_VARIANT, color: fg }}>
      <DD_Truncate title={label}>{label || '—'}</DD_Truncate>
    </TableCell>
  );
}

// 數字格：預設右對齊 + tabular-nums
function TableNumberCell({ theme, density, align = 'right', disabled, value }) {
  return (
    <TableCell theme={theme} density={density} align={align} disabled={disabled}
      style={{ fontVariantNumeric: NUMERIC_FONT_VARIANT }}>
      <DD_Truncate>{value === null || value === undefined || value === '' ? '—' : value}</DD_Truncate>
    </TableCell>
  );
}

// 欄位標題格：可排序時是 button，含 hover / focus / 排序指示
function TableHeaderCell({ theme, density = 'base', column, sort, onSortChange }) {
  const T = DATA_DISPLAY_TOKENS.TABLE;
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const active = sort && sort.key === column.key;
  const direction = active ? sort.direction : null;
  const justify = column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start';

  const base = {
    display: 'flex', alignItems: 'center', justifyContent: justify,
    gap: SPACING.xs, width: '100%', height: '100%', minWidth: 0,
    padding: `0 ${T.CELL_PADDING_X_BY_DENSITY[density]}px`,
    border: `${T.OUTER_BORDER_WIDTH}px solid transparent`,
    background: hover && column.sortable ? c.headerHoverBg : 'transparent',
    color: active ? c.headerActiveFg : c.headerFg,
    fontFamily: FONT_FAMILY.base,
    textAlign: 'left',
    cursor: column.sortable ? 'pointer' : 'default',
    transition: `background ${T.TRANSITION_MS}ms ${T.TRANSITION_EASING}`,
    ...DD_type(T.HEADER_TYPE),
    ...(focus ? DD_focusStyle(c, T.FOCUS_RING_WIDTH, T.FOCUS_RING_OFFSET) : null),
  };

  const indicator = active
    ? <DD_Glyph name={direction === 'desc' ? 'sort-desc' : 'sort-asc'} size={T.SORT_ICON_SIZE} color={c.headerActiveFg} />
    : column.sortable && hover
      ? <DD_Glyph name="sort-none" size={T.SORT_ICON_SIZE} color={c.rowMutedFg} />
      : <span style={{ width: T.SORT_ICON_SIZE, flexShrink: 0 }} />;

  const content = (
    <React.Fragment>
      <DD_Truncate title={column.label}>{column.label}</DD_Truncate>
      {indicator}
    </React.Fragment>
  );

  if (!column.sortable) {
    return <div role="columnheader" style={base}>{content}</div>;
  }
  return (
    <button
      type="button"
      role="columnheader"
      aria-sort={active ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'}
      onClick={() => onSortChange && onSortChange({
        key: column.key,
        direction: active && direction === 'asc' ? 'desc' : 'asc',
      })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={base}
    >{content}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// DataTable · 工單表格
//
// props:
//   theme       主題物件
//   columns     [{ key, label, width, align, type, sortable, muted, render }]
//                 width 為數字（px）或 CSS 字串，省略時吃 COLUMN_MIN_WIDTH 的 1fr
//                 type: text | key | status | user | date | number
//   rows        [{ id, cells: { <columnKey>: value }, disabled }]
//   density     compact | base | relaxed（對應 ROW_HEIGHT 三檔）
//   zebra       斑馬紋開關，預設關
//   sort        { key, direction }；onSortChange 回傳同形物件
//   groupBy     欄 key，指定後改分組呈現
//   selectedIds 選取列 id 陣列；onRowSelect(row, event)
//   maxHeight   指定後標題列 sticky、內容捲動
//   emptyState  無資料時的節點，省略時走預設 EmptyState
// ─────────────────────────────────────────────────────────────
function DataTable({
  theme, columns = [], rows = [], density = 'base', zebra = false,
  sort, onSortChange, groupBy, selectedIds = [], onRowSelect, onRowActivate,
  maxHeight, emptyState,
}) {
  const T = DATA_DISPLAY_TOKENS.TABLE;
  const c = DATA_DISPLAY_COLORS.TABLE(theme);
  const [hoveredId, setHoveredId] = React.useState(null);
  const [focusedId, setFocusedId] = React.useState(null);

  const rowHeight = T.ROW_HEIGHT_BY_DENSITY[density] || T.ROW_HEIGHT_BY_DENSITY.base;
  const template = columns.map((col) => (
    typeof col.width === 'number' ? `${col.width}px`
      : col.width || `minmax(${T.COLUMN_MIN_WIDTH}px, 1fr)`
  )).join(' ');

  // 分組：依首次出現順序聚集，不重排群內工單列。
  const groupColumn = groupBy ? columns.find((col) => col.key === groupBy) : null;
  const groups = React.useMemo(() => {
    if (!groupBy) return null;
    const order = [];
    const bucket = new Map();
    rows.forEach((row) => {
      const raw = row.cells ? row.cells[groupBy] : undefined;
      const label = typeof raw === 'object' && raw ? (raw.label || '') : (raw === undefined || raw === '' ? '未指定' : String(raw));
      if (!bucket.has(label)) { bucket.set(label, []); order.push(label); }
      bucket.get(label).push(row);
    });
    return order.map((label) => ({ label, items: bucket.get(label) }));
  }, [rows, groupBy]);

  const isSelected = (row) => selectedIds.indexOf(row.id) !== -1;

  const renderRow = (row, index, indented) => {
    const selected = isSelected(row);
    const hovered = hoveredId === row.id && !row.disabled;
    const focused = focusedId === row.id;
    const striped = zebra && index % 2 === 1;
    const bg = selected ? c.selectedBg : hovered ? c.hoverBg : striped ? c.zebraBg : 'transparent';

    return (
      <div
        key={row.id}
        role="row"
        aria-selected={selected}
        tabIndex={row.disabled ? -1 : 0}
        onMouseEnter={() => setHoveredId(row.id)}
        onMouseLeave={() => setHoveredId(null)}
        onFocus={() => setFocusedId(row.id)}
        onBlur={() => setFocusedId(null)}
        onClick={(e) => !row.disabled && onRowSelect && onRowSelect(row, e)}
        onDoubleClick={(e) => !row.disabled && onRowActivate && onRowActivate(row, e)}
        onKeyDown={(e) => {
          if (row.disabled) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowSelect && onRowSelect(row, e); }
        }}
        style={{
          display: 'grid', gridTemplateColumns: template, alignItems: 'center',
          height: rowHeight, background: bg,
          color: row.disabled ? c.disabledFg : selected ? c.selectedFg : c.rowFg,
          opacity: row.disabled ? c.disabledOpacity : 1,
          borderTop: `${T.ROW_DIVIDER_WIDTH}px solid ${c.rowDivider}`,
          border: `${T.OUTER_BORDER_WIDTH}px solid transparent`,
          borderTopColor: c.rowDivider,
          boxShadow: selected ? `inset ${T.SELECTED_ACCENT_WIDTH}px 0 0 0 ${c.selectedAccent}` : 'none',
          paddingLeft: indented ? T.GROUP_INDENT : 0,
          cursor: row.disabled ? 'default' : onRowSelect ? 'pointer' : 'default',
          transition: `background ${T.TRANSITION_MS}ms ${T.TRANSITION_EASING}`,
          ...(focused ? DD_focusStyle(c, T.FOCUS_RING_WIDTH, T.FOCUS_RING_OFFSET) : null),
        }}
      >
        {columns.map((col) => (
          <React.Fragment key={col.key}>
            {DD_renderCell({ theme, column: col, row, density, disabled: row.disabled })}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderGroupRow = (group) => (
    <div
      key={`group-${group.label}`}
      role="row"
      style={{
        display: 'flex', alignItems: 'center', gap: SPACING.sm,
        height: T.GROUP_ROW_HEIGHT,
        padding: `0 ${T.CELL_PADDING_X_BY_DENSITY[density]}px`,
        background: c.groupBg, color: c.groupFg,
        borderTop: `${T.ROW_DIVIDER_WIDTH}px solid ${c.headerDivider}`,
        fontFamily: FONT_FAMILY.base,
        ...DD_type(T.GROUP_TYPE),
      }}
    >
      <DD_Truncate>{groupColumn ? `${groupColumn.label}: ${group.label}` : group.label}</DD_Truncate>
      <span style={{
        color: c.rowMutedFg, fontVariantNumeric: NUMERIC_FONT_VARIANT,
        ...DD_type(T.META_TYPE, { fontWeight: T.GROUP_COUNT_WEIGHT, letterSpacing: 0 }),
      }}>{group.items.length}</span>
    </div>
  );

  let body;
  if (rows.length === 0) {
    body = emptyState !== undefined ? emptyState
      : <EmptyState theme={theme} title="沒有符合條件的工單" description="調整篩選條件或改選其他檢視。" />;
  } else if (groups) {
    body = groups.map((group) => (
      <React.Fragment key={group.label}>
        {renderGroupRow(group)}
        {group.items.map((row, i) => renderRow(row, i, true))}
      </React.Fragment>
    ));
  } else {
    body = rows.map((row, i) => renderRow(row, i, false));
  }

  return (
    <div
      role="table"
      style={{
        width: '100%', background: c.surface,
        border: `${T.OUTER_BORDER_WIDTH}px solid ${c.outerBorder}`,
        borderRadius: T.RADIUS, overflow: 'hidden',
        fontFamily: FONT_FAMILY.base, color: c.rowFg,
      }}
    >
      <div style={{ maxHeight, overflow: maxHeight ? 'auto' : 'visible' }}>
        {/* 欄位標題列 */}
        <div
          role="row"
          style={{
            display: 'grid', gridTemplateColumns: template, alignItems: 'center',
            height: T.HEADER_HEIGHT, background: c.headerBg,
            borderBottom: `${T.HEADER_DIVIDER_WIDTH}px solid ${c.headerDivider}`,
            position: maxHeight ? 'sticky' : 'static', top: 0, zIndex: 1,
          }}
        >
          {columns.map((col) => (
            <TableHeaderCell key={col.key} theme={theme} density={density} column={col} sort={sort} onSortChange={onSortChange} />
          ))}
        </div>
        {body}
      </div>
    </div>
  );
}

// column.type 到 TableCell 系列的預設對應；column.render 存在時優先。
function DD_renderCell({ theme, column, row, density, disabled }) {
  const value = row.cells ? row.cells[column.key] : undefined;
  if (column.render) return column.render(value, row, { theme, density });
  const shared = { theme, density, align: column.align, disabled };
  switch (column.type) {
    case 'key':    return <TableKeyCell {...shared} value={value} onClick={column.onClick} />;
    case 'status': return <TableStatusCell {...shared} status={value} />;
    case 'user':   return <TableUserCell {...shared} user={value} />;
    case 'date':   return <TableDateCell {...shared} date={value} />;
    case 'number': return <TableNumberCell {...shared} align={column.align || 'right'} value={value} />;
    default:       return <TableTextCell {...shared} value={value} muted={column.muted} />;
  }
}

// ─────────────────────────────────────────────────────────────
// KanbanColumn · 看板欄
//
// props: theme / title / count / isDropTarget / maxHeight / footer / children
// 一欄對應一個流程狀態；欄數由 Status 決定，結案原因不開欄。
// ─────────────────────────────────────────────────────────────
function KanbanColumn({ theme, title, count, isDropTarget = false, maxHeight, children, footer, onDragOver, onDrop }) {
  const K = DATA_DISPLAY_TOKENS.KANBAN;
  const c = DATA_DISPLAY_COLORS.KANBAN(theme);
  const shown = count === undefined ? React.Children.count(children) : count;

  return (
    <section
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        width: K.COLUMN_WIDTH, minWidth: K.COLUMN_MIN_WIDTH, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: isDropTarget ? c.dropTargetBg : c.columnBg,
        border: `${isDropTarget ? K.DROP_TARGET_BORDER_WIDTH : K.COLUMN_BORDER_WIDTH}px ${isDropTarget ? 'dashed' : 'solid'} ${isDropTarget ? c.dropTargetBorder : c.columnBorder}`,
        borderRadius: K.COLUMN_RADIUS, padding: K.COLUMN_PADDING,
        fontFamily: FONT_FAMILY.base,
        transition: `background ${K.TRANSITION_MS}ms ${K.TRANSITION_EASING}, border-color ${K.TRANSITION_MS}ms ${K.TRANSITION_EASING}`,
      }}
    >
      {/* 欄標題 + 卡片數 */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: K.COLUMN_HEADER_GAP,
        height: K.COLUMN_HEADER_HEIGHT, padding: `0 ${K.COLUMN_HEADER_PADDING_X}px`,
        color: c.columnHeaderFg, ...DD_type(K.COLUMN_HEADER_TYPE),
      }}>
        <DD_Truncate title={title}>{title}</DD_Truncate>
        <span style={{
          marginLeft: 'auto', flexShrink: 0,
          minWidth: K.COLUMN_COUNT_MIN_WIDTH, padding: `0 ${K.COLUMN_COUNT_PADDING_X}px`,
          borderRadius: K.COLUMN_COUNT_RADIUS, background: c.countBg, color: c.countFg,
          textAlign: 'center', fontVariantNumeric: NUMERIC_FONT_VARIANT,
          ...DD_type(K.COLUMN_COUNT_TYPE, { letterSpacing: 0 }),
        }}>{shown}</span>
      </header>

      {/* 捲動區 */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: K.COLUMN_BODY_GAP,
        minHeight: K.COLUMN_BODY_MIN_HEIGHT, maxHeight, overflowY: maxHeight ? 'auto' : 'visible',
        padding: `${K.COLUMN_PADDING}px 0 0`,
      }}>
        {children}
      </div>

      {footer}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// KanbanCard · 看板卡
//
// props: theme / issueKey / title / assignee / status {label,tone} /
//        due {label,tone} / dragging / ghost / loading / selected / disabled
// 拖曳態：抬起走 level3 陰影 + 微幅放大傾斜；原位殘影走 ghost。
// 載入態：狀態轉換進行中，壓暗 + spinner，期間不可再拖。
// ─────────────────────────────────────────────────────────────
function KanbanCard({
  theme, issueKey, title, assignee, status, due,
  dragging = false, ghost = false, loading = false, selected = false, disabled = false,
  onClick, onDragStart, onDragEnd, draggable = true,
}) {
  const K = DATA_DISPLAY_TOKENS.KANBAN;
  const c = DATA_DISPLAY_COLORS.KANBAN(theme);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  DD_ensureKeyframes();

  const interactive = !disabled && !loading;
  const borderColor = selected || dragging ? c.cardSelectedBorder
    : hover && interactive ? c.cardHoverBorder
    : c.cardBorder;
  const dueTone = due && due.tone === 'overdue' ? c.overdueFg : due && due.tone === 'soon' ? c.dueSoonFg : c.cardMetaFg;

  return (
    <article
      draggable={draggable && interactive}
      tabIndex={interactive ? 0 : -1}
      aria-disabled={disabled || undefined}
      aria-busy={loading || undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      onClick={interactive ? onClick : undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(e); }
      }}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', gap: K.CARD_ROW_GAP,
        padding: `${K.CARD_PADDING_Y}px ${K.CARD_PADDING_X}px`,
        background: c.cardBg,
        border: `${K.CARD_BORDER_WIDTH}px solid ${borderColor}`,
        borderRadius: K.CARD_RADIUS,
        boxShadow: DD_shadow(c.shadowColor, dragging ? K.CARD_DRAG_ELEVATION : K.CARD_ELEVATION),
        transform: dragging ? `scale(${K.CARD_DRAG_SCALE}) rotate(${K.CARD_DRAG_TILT})` : 'none',
        opacity: ghost ? K.CARD_GHOST_OPACITY : loading ? K.CARD_LOADING_OPACITY : disabled ? c.disabledOpacity : 1,
        color: disabled ? c.disabledFg : c.cardTitleFg,
        cursor: !interactive ? 'default' : dragging ? 'grabbing' : draggable ? 'grab' : 'pointer',
        transition: `box-shadow ${K.TRANSITION_MS}ms ${K.TRANSITION_EASING}, border-color ${K.TRANSITION_MS}ms ${K.TRANSITION_EASING}, transform ${K.TRANSITION_MS}ms ${K.TRANSITION_EASING}`,
        fontFamily: FONT_FAMILY.base,
        ...(focus ? DD_focusStyle(c, K.CARD_FOCUS_RING_WIDTH, K.CARD_FOCUS_RING_OFFSET) : null),
      }}
    >
      {/* 編號 + 狀態 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, minWidth: 0 }}>
        <span style={{
          fontFamily: FONT_FAMILY.mono, fontVariantNumeric: NUMERIC_FONT_VARIANT,
          color: disabled ? c.disabledFg : c.cardKeyFg, flexShrink: 0,
          ...DD_type(K.CARD_KEY_TYPE, { fontWeight: TYPOGRAPHY.weight.medium }),
        }}>{issueKey}</span>
        {status && (
          <span style={{ marginLeft: 'auto', minWidth: 0 }}>
            <DD_BadgeSlot
              theme={theme}
              tone={typeof status === 'object' ? status.tone : undefined}
              label={typeof status === 'string' ? status : status.label}
              dot={K.CARD_BADGE_DOT}
              height={K.CARD_BADGE_HEIGHT} radius={K.CARD_BADGE_RADIUS} paddingX={K.CARD_BADGE_PADDING_X}
              typeStyle={K.CARD_BADGE_TYPE} neutralBg={c.neutralBadgeBg} neutralFg={c.neutralBadgeFg}
            />
          </span>
        )}
      </div>

      {/* 標題，最多兩行 */}
      <div
        title={title}
        style={{
          display: '-webkit-box', WebkitLineClamp: K.CARD_TITLE_MAX_LINES, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', color: disabled ? c.disabledFg : c.cardTitleFg,
          ...DD_type(K.CARD_TITLE_TYPE),
        }}
      >{title}</div>

      {/* 負責人 + 到期 */}
      {(assignee || due || loading) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, minWidth: 0, ...DD_type(K.CARD_META_TYPE) }}>
          {assignee && (
            <React.Fragment>
              <DD_AvatarSlot theme={theme} user={assignee} sizeKey={K.CARD_AVATAR_SIZE_KEY} size={K.CARD_AVATAR_SIZE}
                bg={c.avatarBg} fg={c.avatarFg} typeStyle={K.CARD_META_TYPE} />
              <DD_Truncate title={typeof assignee === 'string' ? assignee : assignee.name}>
                <span style={{ color: disabled ? c.disabledFg : c.cardMetaFg }}>
                  {typeof assignee === 'string' ? assignee : assignee.name}
                </span>
              </DD_Truncate>
            </React.Fragment>
          )}
          {due && (
            <span style={{
              marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: SPACING['2xs'],
              color: disabled ? c.disabledFg : dueTone, fontVariantNumeric: NUMERIC_FONT_VARIANT,
            }}>
              <DD_Glyph name="clock" size={K.CARD_META_ICON_SIZE} color={disabled ? c.disabledFg : dueTone} />
              {typeof due === 'string' ? due : due.label}
            </span>
          )}
          {loading && (
            <span style={{
              marginLeft: assignee || due ? SPACING.xs : 'auto', flexShrink: 0,
              width: K.CARD_SPINNER_SIZE, height: K.CARD_SPINNER_SIZE, borderRadius: RADIUS.full,
              border: `${K.CARD_SPINNER_TRACK_WIDTH}px solid ${c.spinnerTrack}`, borderTopColor: c.spinnerHead,
              animation: `ddSpin ${K.CARD_SPINNER_DURATION_MS}ms linear infinite`,
            }} />
          )}
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// EmptyState · 無資料空狀態
//
// props: theme / icon / title / description / action {label,onClick,disabled} / compact
// compact 供看板欄內使用，其餘走表格與整頁尺寸。
// ─────────────────────────────────────────────────────────────
function EmptyState({ theme, icon = 'inbox', title, description, action, compact = false }) {
  const E = DATA_DISPLAY_TOKENS.EMPTY_STATE;
  const c = DATA_DISPLAY_COLORS.EMPTY_STATE(theme);
  const [hover, setHover] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const box = compact ? E.ICON_BOX_COMPACT : E.ICON_BOX;
  const glyph = compact ? E.ICON_GLYPH_SIZE_COMPACT : E.ICON_GLYPH_SIZE;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      gap: E.GAP, padding: `${compact ? E.PADDING_Y_COMPACT : E.PADDING_Y}px ${E.PADDING_X}px`,
      fontFamily: FONT_FAMILY.base,
    }}>
      <div style={{
        width: box, height: box, borderRadius: E.ICON_RADIUS, background: c.iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.iconFg,
      }}>
        {typeof icon === 'string' ? <DD_Glyph name={icon} size={glyph} color={c.iconFg} /> : icon}
      </div>

      {title && (
        <div style={{ color: c.titleFg, maxWidth: E.MAX_WIDTH, ...DD_type(compact ? E.TITLE_TYPE_COMPACT : E.TITLE_TYPE, { fontWeight: TYPOGRAPHY.weight.medium }) }}>
          {title}
        </div>
      )}
      {description && (
        <div style={{ color: c.descFg, maxWidth: E.MAX_WIDTH, ...DD_type(E.DESC_TYPE) }}>
          {description}
        </div>
      )}

      {action && (
        <button
          type="button"
          disabled={action.disabled}
          onClick={action.onClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            marginTop: E.ACTION_MARGIN_TOP, height: E.ACTION_HEIGHT,
            padding: `0 ${E.ACTION_PADDING_X}px`, borderRadius: E.ACTION_RADIUS,
            display: 'inline-flex', alignItems: 'center', gap: SPACING.xs,
            background: action.disabled ? 'transparent' : hover ? c.actionHoverBg : c.actionBg,
            color: action.disabled ? c.disabledFg : c.actionFg,
            border: `${E.ACTION_BORDER_WIDTH}px solid ${action.disabled ? c.actionBorder : 'transparent'}`,
            opacity: action.disabled ? c.disabledOpacity : 1,
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            fontFamily: FONT_FAMILY.base,
            transition: `background ${MOTION.duration.instant}ms ${MOTION.easing.standard}`,
            ...DD_type(E.ACTION_TYPE),
            ...(focus && !action.disabled ? DD_focusStyle(c, E.FOCUS_RING_WIDTH, E.FOCUS_RING_OFFSET) : null),
          }}
        >
          {action.icon && <DD_Glyph name={action.icon} size={ICON_SIZE.sm} color={action.disabled ? c.disabledFg : c.actionFg} />}
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FilterNotice · 權限過濾標示列
//
// props: theme / count / reason / tone（info 預設 / warning）
// 資料由 filterViewByPermission 產出；count 為 0 時本元件不渲染，
// 對應 spec 的「無被濾工單則不顯示本區」。
// ─────────────────────────────────────────────────────────────
function FilterNotice({ theme, count = 0, reason = '無讀取權', tone = 'info', unit = '筆' }) {
  const F = DATA_DISPLAY_TOKENS.FILTER_NOTICE;
  const palette = DATA_DISPLAY_COLORS.FILTER_NOTICE(theme);
  const c = palette[tone] || palette.info;
  if (!count) return null;

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'center', gap: F.GAP,
        minHeight: F.MIN_HEIGHT, padding: `${F.PADDING_Y}px ${F.PADDING_X}px`,
        background: c.bg, color: c.fg, borderRadius: F.RADIUS,
        borderLeft: `${F.ACCENT_WIDTH}px solid ${c.accent}`,
        fontFamily: FONT_FAMILY.base, ...DD_type(F.TEXT_TYPE),
      }}
    >
      <DD_Glyph name="funnel" size={F.ICON_SIZE} color={c.fg} style={{ flexShrink: 0 }} />
      <span>
        權限濾除
        <span style={{ fontVariantNumeric: NUMERIC_FONT_VARIANT, fontWeight: F.COUNT_WEIGHT, margin: `0 ${SPACING['2xs']}px` }}>{count}</span>
        {unit}
      </span>
      <span style={{ color: c.fg, opacity: 1, ...DD_type(F.REASON_TYPE) }}>· {reason}</span>
    </div>
  );
}

Object.assign(window, {
  DataTable,
  TableCell, TableHeaderCell, TableTextCell, TableKeyCell,
  TableStatusCell, TableUserCell, TableDateCell, TableNumberCell,
  KanbanColumn, KanbanCard,
  EmptyState, FilterNotice,
});
