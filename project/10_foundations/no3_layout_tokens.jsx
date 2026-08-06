// ─────────────────────────────────────────────────────────────
// Layout tokens · 間距 / 圓角 / 陰影 alias / 邊框 / 動畫 / icon 尺寸 / 控件與 row 高度
//
// 跨元件共用的版面原語階梯。未來的元件層 token 必須引用此檔，不各自 hardcode。
// SHADOW 為 SHADOW_ELEVATION 的 alias；主來源在 no1_atomic_tokens.jsx。
// ─────────────────────────────────────────────────────────────

// 4px 網格。語意命名階梯，桌面高密度介面預設用 sm / md 級距。
// 最小階 2xs=2 專供行內微調（badge 內距、icon 與文字的貼齊補位），不視為元件間留白。
const SPACING = {
  '2xs': 2,
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
};

// 圓角小巧三階：sm 4 控件 / md 6 卡片內子區塊 / lg 8 卡片與 modal。
// full 只給 pill 形 badge 與 avatar。
const RADIUS = {
  none: 0,
  sm:   4,
  md:   6,
  lg:   8,
  full: 9999,
};

// SHADOW 為 SHADOW_ELEVATION 的向後相容 alias；視覺化與 canvas 讀此名。
const SHADOW = SHADOW_ELEVATION;

// 邊框寬度。hairline 為一切分隔與外框的預設；focus 只給 focus ring。
const BORDER_WIDTH = {
  hairline: 1,
  focus:    2,
};

// 動畫 duration 與 easing。桌面工具動畫節制、偏快，hover 反饋走 instant。
const MOTION = {
  duration: {
    instant: 80,
    fast:    150,
    base:    220,
    slow:    320,
  },
  easing: {
    standard:   'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },
};

// Icon 尺寸階梯。桌面密度比行動端小一號：列表與按鈕內 icon 預設 md 16。
const ICON_SIZE = {
  xs: 12,   // 行內 chevron / 排序箭頭
  sm: 14,   // 表格 row 內 status icon
  md: 16,   // 按鈕 / 列表標準 icon
  lg: 20,   // toolbar / nav icon
  xl: 24,   // 空狀態與強調區 icon
};

// 控件高度三階。滑鼠精度高於觸控，桌面控件不受 44pt 下界拘束。
const CONTROL_HEIGHT = {
  sm: 24,   // 行內 filter chip、表格內小按鈕
  md: 28,   // 預設按鈕 / input / select
  lg: 32,   // 頁面主要動作按鈕、搜尋框
};

// 工單表格 row 高度三檔。compact 為高密度掃描模式，base 為預設。
const ROW_HEIGHT = {
  compact: 32,
  base:    36,
  relaxed: 44,
};

Object.assign(window, {
  SPACING, RADIUS, SHADOW, BORDER_WIDTH, MOTION, ICON_SIZE, CONTROL_HEIGHT, ROW_HEIGHT,
});
