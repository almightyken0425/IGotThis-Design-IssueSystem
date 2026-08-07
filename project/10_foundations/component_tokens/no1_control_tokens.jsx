// ─────────────────────────────────────────────────────────────
// Control tokens · 基礎控件組的元件級 token
//
// 消費端：20_components/no1_controls.jsx 的 Button / IconButton / Select /
// TextInput / Checkbox / Badge / Avatar / Chip 八件控件。
// 這八件由 ListScreen 的檢視工具列與工單表格直接消費（排序依據、分組依據、
// 欄位顯示設定、狀態欄、負責人欄、篩選標籤）。
//
// 規範（沿用 SuSuGiGi component_tokens 慣例）：
//   - 所有值引用 atomic 層（SPACING / RADIUS / TYPE_STYLES / ICON_SIZE /
//     CONTROL_HEIGHT / ROW_HEIGHT / BORDER_WIDTH / MOTION），不寫 raw number
//   - 離開階梯的視覺校準值以 `// (literal: <原因>)` 標記
//   - 色彩一律不落在本檔的靜態值上：色彩隨主題變動，改由 COLORS_* 解析函式
//     吃 theme 物件即時求值。本檔因此完全沒有 hex
//   - 檔尾統一 Object.assign(window, { ... })
//
// 尺寸取值原則：桌面高密度工具，控件走 CONTROL_HEIGHT 的 sm(24) / md(28) 兩檔，
// 表格內元素（Badge / Avatar / Chip）壓在 ROW_HEIGHT.base(36) 內仍有上下留白。
//
// 邊界與 focus 的分工（對齊 no1_atomic_tokens.jsx 的 border 三鍵註解）：
//   - 可聚焦控件（Button secondary / Select / TextInput / Checkbox）的靜置外框
//     一律吃 theme.border.input——這是 1.4.11 要求 3:1 的必要邊界
//   - focus 時另加一圈 ring，吃 theme.state.focus.ring 與 ringWidth，疊在外框之外
//   - theme.border.base / strong 只做裝飾線，不得拿來當控件外框
//
// disabled 表達（三態分流，不一律套 opacity）：
//   - 實心（primary Button、已勾 Checkbox）→ 保留主色底、整體降 state.disabled.opacity
//   - 有框（secondary Button、Select、TextInput）→ 外框由 input 退回 border.base、
//     文字換 state.disabled.fg，底色不動
//   - 無框（ghost Button / IconButton）→ 只換文字為 state.disabled.fg
// ─────────────────────────────────────────────────────────────

// ─── 共用：跨控件一致的節奏與 focus ring ───
const CONTROL_SHARED_TOKENS = {
  RADIUS:            RADIUS.sm,                    // 4，所有方形控件共用
  BORDER_WIDTH:      BORDER_WIDTH.hairline,        // 1
  FOCUS_RING_WIDTH:  BORDER_WIDTH.focus,           // 2（theme.state.focus.ringWidth 的階梯來源）
  TRANSITION_MS:     MOTION.duration.fast,         // 150
  TRANSITION_EASING: MOTION.easing.standard,
  ICON_TEXT_GAP:     SPACING.xs,                   // 4，圖示與文字的貼齊間距

  // canvas 自製 stroke 型 glyph 的筆畫寬三檔。不吃 BORDER_WIDTH 階梯——
  // 那條量的是邊框，1px 邊框放進 24 格線稿會細到在 12–16px 尺寸下斷掉。
  // 消費端只讀本表，不在 JSX 內寫字面值。
  GLYPH_STROKE: {
    base: 1.75,                  // (literal: 24 格線稿的預設筆畫，視覺校準)
    bold: BORDER_WIDTH.focus,    // 2，清除鈕與移除鈕的 x 在 12px 下加粗補可見度
    mark: 2.2,                   // (literal: 選中勾在 12px 下仍要讀得出，比 bold 再加一點)
  },
};

// hex + alpha → rgba 字串。theme.shadow.color 為 hex，elevation 只給 opacity，
// 兩者要在消費端合成才成為可用的 boxShadow。
function withAlpha(hex, alpha) {
  const raw  = String(hex).replace('#', '');
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// 依 theme 與 elevation 階名求 boxShadow；level0 回 'none'。
function controlShadow(theme, levelKey) {
  const lv = theme.shadow.elevation[levelKey];
  if (!lv || lv.opacity === 0) return 'none';
  return `0 ${lv.offsetY}px ${lv.blur}px ${withAlpha(theme.shadow.color, lv.opacity)}`;
}

// focus ring 的 boxShadow 片段；與 controlShadow 併用時以逗號串接。
function controlFocusRing(theme) {
  return `0 0 0 ${theme.state.focus.ringWidth}px ${theme.state.focus.ring}`;
}

// ─── BUTTON_TOKENS ───
// variant 三種 × size 兩種。IconButton 共用同一組 variant 色盤，故色盤解析函式
// 掛在本 token 上、由 ICON_BUTTON_TOKENS 引用，不複寫第二份。
const BUTTON_TOKENS = {
  HEIGHT:         { md: CONTROL_HEIGHT.md, sm: CONTROL_HEIGHT.sm },   // 28 / 24
  PADDING_H:      { md: SPACING.md,        sm: SPACING.sm },          // 12 / 8
  GAP:            CONTROL_SHARED_TOKENS.ICON_TEXT_GAP,                // 4
  RADIUS:         CONTROL_SHARED_TOKENS.RADIUS,                       // 4
  BORDER_WIDTH:   CONTROL_SHARED_TOKENS.BORDER_WIDTH,                 // 1
  TEXT:           { md: TYPE_STYLES.bodyMedium, sm: TYPE_STYLES.label },  // 14/20 medium、12/16 medium
  ICON:           { md: ICON_SIZE.md,      sm: ICON_SIZE.sm },        // 16 / 14
  SPINNER_STROKE: BORDER_WIDTH.focus,                                 // 2，loading 圈線寬
  SPINNER_MS:     MOTION.duration.slow * 2,                           // 640，一圈轉速
  TRANSITION_MS:  CONTROL_SHARED_TOKENS.TRANSITION_MS,

  // 狀態色映射。回 { bg, bgHover, fg, fgHover, border, borderHover, useOpacityWhenDisabled }。
  // primary 的 hover 走「同色系推一階」而非疊透明度：light 主色是 pine[800]（亮度 14%），
  // 往深推到 900 白字仍 14:1；dark 主色是 pine[400] 亮色，往亮推到 300、深墨字仍過 AA。
  COLORS_BY_VARIANT: (theme) => {
    const dark = theme.id === 'dark';
    return {
      primary: {
        bg:          theme.primary.main,
        bgHover:     dark ? theme.primary[300] : theme.primary[900],
        fg:          theme.primary.on_main,
        fgHover:     theme.primary.on_main,
        border:      'transparent',
        borderHover: 'transparent',
        useOpacityWhenDisabled: true,
      },
      secondary: {
        bg:          theme.bg.surface,
        bgHover:     theme.bg.surface_hover,
        fg:          theme.text.primary,
        fgHover:     theme.text.primary,
        border:      theme.border.input,          // 必要邊界，過 3:1
        borderHover: theme.border.input,
        useOpacityWhenDisabled: false,
      },
      ghost: {
        bg:          'transparent',
        bgHover:     theme.state.hover.bg,
        fg:          theme.text.secondary,
        fgHover:     theme.text.primary,          // hover 時前景加重一階補償無底無框
        border:      'transparent',
        borderHover: 'transparent',
        useOpacityWhenDisabled: false,
      },
    };
  },
};

// ─── ICON_BUTTON_TOKENS ───
// 方形圖示按鈕。工具列（欄位顯示設定入口）預設 md；表格 row 內用 sm、
// 頁面級動作用 lg。色盤與 Button 共用，確保工具列上文字鈕與圖示鈕視覺同族。
const ICON_BUTTON_TOKENS = {
  SIZE:              { sm: CONTROL_HEIGHT.sm, md: CONTROL_HEIGHT.md, lg: CONTROL_HEIGHT.lg },  // 24 / 28 / 32
  ICON:              { sm: ICON_SIZE.sm,      md: ICON_SIZE.md,      lg: ICON_SIZE.lg },       // 14 / 16 / 20
  RADIUS:            CONTROL_SHARED_TOKENS.RADIUS,
  BORDER_WIDTH:      CONTROL_SHARED_TOKENS.BORDER_WIDTH,
  TRANSITION_MS:     CONTROL_SHARED_TOKENS.TRANSITION_MS,
  COLORS_BY_VARIANT: BUTTON_TOKENS.COLORS_BY_VARIANT,
};

// ─── SELECT_TOKENS ───
// 排序依據、分組依據用。trigger 為 button、展開的 menu 為 level2 浮層。
const SELECT_TOKENS = {
  HEIGHT:        { md: CONTROL_HEIGHT.md, sm: CONTROL_HEIGHT.sm },
  PADDING_LEFT:  SPACING.sm,                                       // 8
  // 右內距要塞下 chevron：文字右緣 8 + chevron 12 + 貼齊 4 = 24
  PADDING_RIGHT: SPACING.sm + ICON_SIZE.xs + SPACING.xs,           // 24
  GAP:           CONTROL_SHARED_TOKENS.ICON_TEXT_GAP,
  RADIUS:        CONTROL_SHARED_TOKENS.RADIUS,
  BORDER_WIDTH:  CONTROL_SHARED_TOKENS.BORDER_WIDTH,
  TEXT:          { md: TYPE_STYLES.bodySm, sm: TYPE_STYLES.label },   // 13/18、12/16
  PREFIX_TEXT:   TYPE_STYLES.label,                                   // 「排序:」等前綴
  CHEVRON_SIZE:  ICON_SIZE.xs,                                        // 12
  TRANSITION_MS: CONTROL_SHARED_TOKENS.TRANSITION_MS,

  MENU: {
    OFFSET:         SPACING.xs,        // 4，menu 與 trigger 的垂直間隙
    PADDING:        SPACING.xs,        // 4，menu 內圈留白
    RADIUS:         RADIUS.md,         // 6，卡片內子區塊階
    ELEVATION:      'level2',          // dropdown / popover 階
    MIN_WIDTH:      160,               // (literal: 下拉最小寬，依最長欄位名「開發順序」加 chevron 校準)
    MAX_HEIGHT:     ROW_HEIGHT.relaxed * 6,   // 264，超過即內捲
    ITEM_HEIGHT:    CONTROL_HEIGHT.md,        // 28
    ITEM_PADDING_H: SPACING.sm,               // 8
    ITEM_RADIUS:    CONTROL_SHARED_TOKENS.RADIUS,
    ITEM_TEXT:      TYPE_STYLES.bodySm,
    CHECK_SIZE:     ICON_SIZE.xs,             // 12，選中列的勾
  },
};

// ─── TEXT_INPUT_TOKENS ───
// 搜尋與篩選用。leadingIcon 給搜尋放大鏡、trailing 給清除鈕。
const TEXT_INPUT_TOKENS = {
  HEIGHT:          { md: CONTROL_HEIGHT.md, sm: CONTROL_HEIGHT.sm },
  PADDING_H:       SPACING.sm,                                     // 8
  GAP:             CONTROL_SHARED_TOKENS.ICON_TEXT_GAP,
  RADIUS:          CONTROL_SHARED_TOKENS.RADIUS,
  BORDER_WIDTH:    CONTROL_SHARED_TOKENS.BORDER_WIDTH,
  TEXT:            { md: TYPE_STYLES.bodySm, sm: TYPE_STYLES.label },
  LEADING_ICON:    { md: ICON_SIZE.md,       sm: ICON_SIZE.sm },   // 16 / 14
  CLEAR_ICON_SIZE: ICON_SIZE.xs,                                   // 12
  CLEAR_HIT:       ICON_SIZE.md,                                   // 16，清除鈕圓形點擊區
  TRANSITION_MS:   CONTROL_SHARED_TOKENS.TRANSITION_MS,
};

// ─── CHECKBOX_TOKENS ───
// 表格多選用。box 邊長借 ICON_SIZE 階梯（16 / 14），與同列的圖示對齊在同一光學尺寸。
// HIT_HEIGHT 為整條可點區高度，讓 label 與 box 同屬一個 hit target。
const CHECKBOX_TOKENS = {
  BOX:           { md: ICON_SIZE.md, sm: ICON_SIZE.sm },           // 16 / 14
  HIT_HEIGHT:    { md: CONTROL_HEIGHT.md, sm: CONTROL_HEIGHT.sm }, // 28 / 24
  RADIUS:        CONTROL_SHARED_TOKENS.RADIUS,
  BORDER_WIDTH:  CONTROL_SHARED_TOKENS.BORDER_WIDTH,
  MARK_STROKE:   BORDER_WIDTH.focus,                               // 2，勾與橫槓線寬
  GAP:           SPACING.sm,                                       // 8，box 與 label 間距
  LABEL_TEXT:    { md: TYPE_STYLES.bodySm, sm: TYPE_STYLES.label },
  TRANSITION_MS: CONTROL_SHARED_TOKENS.TRANSITION_MS,

  // 未勾時外框吃 border.input（必要邊界）；已勾時整格填主色、勾用 on_main。
  COLORS: (theme) => ({
    bg:            theme.bg.surface,
    border:        theme.border.input,
    borderHover:   theme.state.focus.ring,      // hover 時邊框轉主色，暗示可點
    bgChecked:     theme.primary.main,
    borderChecked: theme.primary.main,
    mark:          theme.primary.on_main,
    labelFg:       theme.text.primary,
    disabledFg:    theme.state.disabled.fg,
    disabledBorder: theme.border.base,
  }),
};

// ─── BADGE_TOKENS ───
// 狀態標籤。高度不另立階梯，由 label 行高 16 + 上下各 2 的行內微調湊 20，
// 壓在 ROW_HEIGHT.compact(32) 內仍有 6 的上下留白。
const BADGE_TOKENS = {
  HEIGHT:     TYPE_STYLES.label.lineHeight + SPACING.xs,   // 20
  PADDING_H:  SPACING.sm,                                  // 8
  RADIUS:     RADIUS.full,                                 // pill
  TEXT:       TYPE_STYLES.label,                           // 12/16 medium
  GAP:        CONTROL_SHARED_TOKENS.ICON_TEXT_GAP,         // 4
  DOT_SIZE:   SPACING.sm - SPACING['2xs'],                 // 6，圓點直徑
  TONES:      ['success', 'warning', 'error', 'info', 'neutral'],

  // semantic 四色一律「_bg 當底、_fg 當文字」——基準色壓在自家淡底上不過 AA，
  // 這條在 no1_atomic_tokens.jsx 的 status 註解已有實測數字。
  //
  // 圓點與文字同吃 _fg。原本圓點吃 status.<name> 基準色，理由是「圓點是非文字元素、
  // 只要過 1.4.11 的 3:1」——但那組 3.03–4.59 的實測是量基準色對「紙面」，
  // 而圓點實際坐在 badge 自家的 _bg 上。改量正確底色後 light 的 success 只有 2.76、
  // warning 2.67，兩色不到 3:1；圓點本來就是為色覺障礙者補的形狀線索，
  // 看不清就失去存在理由。改吃 _fg 後 light 五色 5.97–7.55、dark 4.82–9.14 全數過 AA，
  // 且 dark 本來 _fg 與基準色就同值，等於把 light 對齊 dark 已在跑的行為。
  // 色彩身份改由 badge 的 _bg 淡底承載，不靠圓點。
  // neutral 走中性：surface_dim 淡底 + text.secondary，雙主題都在 7:1 以上。
  COLORS_BY_TONE: (theme) => ({
    success: { bg: theme.status.success_bg, fg: theme.status.success_fg, dot: theme.status.success_fg },
    warning: { bg: theme.status.warning_bg, fg: theme.status.warning_fg, dot: theme.status.warning_fg },
    error:   { bg: theme.status.error_bg,   fg: theme.status.error_fg,   dot: theme.status.error_fg   },
    info:    { bg: theme.status.info_bg,    fg: theme.status.info_fg,    dot: theme.status.info_fg    },
    neutral: { bg: theme.bg.surface_dim,    fg: theme.text.secondary,    dot: theme.text.secondary    },
  }),
};

// ─── AVATAR_TOKENS ───
// 負責人頭像。無圖時取姓名字首。
const AVATAR_TOKENS = {
  SIZE:         { md: CONTROL_HEIGHT.md, sm: CONTROL_HEIGHT.sm },  // 28 / 24
  RADIUS:       RADIUS.full,
  TEXT:         { md: TYPE_STYLES.label, sm: TYPE_STYLES.caption }, // 12 / 11
  BORDER_WIDTH: CONTROL_SHARED_TOKENS.BORDER_WIDTH,
  INITIAL_MAX:  2,     // (literal: 字首取字數上限，非視覺值)
  TONES:        ['primary', 'neutral'],

  // primary 直接吃 state.selected 那組——light 是 pine[50] 底配 pine[800] 字（10.02:1）、
  // dark 是 pine 疊 16% 底配 pine[300] 字（6.90:1），兩主題都是現成過 AA 的配對。
  // 外圈 hairline 讓頭像疊在同色底上仍有邊。
  COLORS_BY_TONE: (theme) => ({
    primary: { bg: theme.state.selected.bg,  fg: theme.state.selected.fg, border: theme.divider.hairline },
    neutral: { bg: theme.bg.surface_dim,     fg: theme.text.secondary,    border: theme.divider.hairline },
  }),
};

// ─── CHIP_TOKENS ───
// 可移除的篩選標籤。走 sm 檔高度，與工具列上的 Select 同排時矮一階、
// 讀作「已套用的條件」而非「可操作的控件」。
const CHIP_TOKENS = {
  HEIGHT:               CONTROL_HEIGHT.sm,                   // 24
  PADDING_LEFT:         SPACING.sm,                          // 8
  PADDING_RIGHT:        SPACING.sm,                          // 8，無移除鈕時
  PADDING_RIGHT_REMOVE: SPACING.xs,                          // 4，有移除鈕時右側收窄
  GAP:                  CONTROL_SHARED_TOKENS.ICON_TEXT_GAP, // 4
  RADIUS:               RADIUS.full,
  BORDER_WIDTH:         CONTROL_SHARED_TOKENS.BORDER_WIDTH,
  TEXT:                 TYPE_STYLES.label,                   // 12/16 medium
  LABEL_TEXT:           TYPE_STYLES.caption,                 // 11，「Status:」等欄位名前綴
  REMOVE_ICON_SIZE:     ICON_SIZE.xs,                        // 12
  REMOVE_HIT:           ICON_SIZE.md,                        // 16，圓形點擊區
  TRANSITION_MS:        CONTROL_SHARED_TOKENS.TRANSITION_MS,

  COLORS: (theme) => ({
    base: {
      bg:      theme.bg.surface_dim,
      bgHover: theme.bg.surface_hover,
      fg:      theme.text.primary,
      labelFg: theme.text.tertiary,
      border:  theme.border.base,          // 裝飾線；chip 非必要邊界，底色差已足以辨識
      removeFg:      theme.text.tertiary,
      removeFgHover: theme.text.primary,
      removeBgHover: theme.state.hover.bg,
    },
    selected: {
      bg:      theme.state.selected.bg,
      bgHover: theme.state.selected.bg,
      fg:      theme.state.selected.fg,
      labelFg: theme.state.selected.fg,
      border:  theme.state.selected.border,
      removeFg:      theme.state.selected.fg,
      removeFgHover: theme.state.selected.fg,
      removeBgHover: theme.state.hover.bg,
    },
  }),
};

Object.assign(window, {
  CONTROL_SHARED_TOKENS, withAlpha, controlShadow, controlFocusRing,
  BUTTON_TOKENS, ICON_BUTTON_TOKENS, SELECT_TOKENS, TEXT_INPUT_TOKENS,
  CHECKBOX_TOKENS, BADGE_TOKENS, AVATAR_TOKENS, CHIP_TOKENS,
});
