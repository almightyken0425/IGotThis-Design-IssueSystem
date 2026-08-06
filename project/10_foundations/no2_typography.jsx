// ─────────────────────────────────────────────────────────────
// Typography · 字體系統
//
// System font stack、基準 14px、資訊密度導向的緊湊階梯。
// TYPOGRAPHY 為底層數值階梯（size 與 weight），TYPE_STYLES 為語意層；
// 元件實際使用時優先採 TYPE_STYLES，少數情境才回退底層數值。
// 表格與計數等即時變動數字統一引用 NUMERIC_FONT_VARIANT。
// ─────────────────────────────────────────────────────────────

// 桌面瀏覽器 system font stack。UI 一律 base；issue key、程式碼片段、diff 走 mono。
const FONT_FAMILY = {
  base: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', 'Cascadia Code', 'Segoe UI Mono', Menlo, Consolas, monospace",
};

const TYPOGRAPHY = {
  // 底層 size 階梯（px）。base 14 為工單列表與表單的預設字級，
  // 階距收窄（10–24）換取高資訊密度；大字級只留 page 級標題用。
  size: { '2xs': 10, xs: 11, sm: 12, base: 14, lg: 16, xl: 18, '2xl': 20, '3xl': 24 },

  // 字重清單。本設計標準啟用 regular / medium / semibold 三檔；
  // bold 保留給極少數強調（如 kbd、危險操作確認），不進常規階梯。
  weight: {
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,  // 保留
  },
};

// 本標準目前啟用的字重集合（驗證與文件用）。
const TYPOGRAPHY_WEIGHT_ENABLED = ['regular', 'medium', 'semibold'];

// 語意層。每條含 { size, weight, lineHeight, letterSpacing }，lineHeight 為絕對 px。
// 緊湊階梯：body 14/20、表格 13/18，行高壓在 1.4 上下換密度。
const TYPE_STYLES = {
  pageTitle:    { size: 20, weight: TYPOGRAPHY.weight.semibold, lineHeight: 28, letterSpacing: -0.2 },
  sectionTitle: { size: 16, weight: TYPOGRAPHY.weight.semibold, lineHeight: 24, letterSpacing: -0.1 },
  cardTitle:    { size: 14, weight: TYPOGRAPHY.weight.semibold, lineHeight: 20, letterSpacing:  0 },
  body:         { size: 14, weight: TYPOGRAPHY.weight.regular,  lineHeight: 20, letterSpacing:  0 },
  bodyMedium:   { size: 14, weight: TYPOGRAPHY.weight.medium,   lineHeight: 20, letterSpacing:  0 },
  bodySm:       { size: 13, weight: TYPOGRAPHY.weight.regular,  lineHeight: 18, letterSpacing:  0 },
  label:        { size: 12, weight: TYPOGRAPHY.weight.medium,   lineHeight: 16, letterSpacing:  0 },
  caption:      { size: 11, weight: TYPOGRAPHY.weight.regular,  lineHeight: 16, letterSpacing:  0.1 },
  overline:     { size: 11, weight: TYPOGRAPHY.weight.medium,   lineHeight: 16, letterSpacing:  0.6 },  // 全大寫欄位標 / group 標
  tableCell:    { size: 13, weight: TYPOGRAPHY.weight.regular,  lineHeight: 18, letterSpacing:  0 },
  code:         { size: 13, weight: TYPOGRAPHY.weight.regular,  lineHeight: 18, letterSpacing:  0 },    // 搭配 FONT_FAMILY.mono
};

// LINE_HEIGHT 三檔比例供自由排版時引用；TYPE_STYLES 內已內建絕對 lineHeight。
const LINE_HEIGHT = { tight: 1.25, base: 1.45, relaxed: 1.6 };

// LETTER_SPACING 三檔（px）供自由排版時引用。
const LETTER_SPACING = { tight: -0.2, normal: 0, wide: 0.6 };

// 數字等寬字形 token。表格數字、issue 計數、時間欄統一引用此值，
// 避免逐處 hardcode 字面值造成遺漏（對應 CSS font-variant-numeric: tabular-nums）。
const NUMERIC_FONT_VARIANT = 'tabular-nums';

Object.assign(window, {
  FONT_FAMILY, TYPOGRAPHY, TYPOGRAPHY_WEIGHT_ENABLED, TYPE_STYLES,
  LINE_HEIGHT, LETTER_SPACING, NUMERIC_FONT_VARIANT,
});
