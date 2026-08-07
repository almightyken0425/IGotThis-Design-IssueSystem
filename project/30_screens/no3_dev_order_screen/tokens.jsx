// ─────────────────────────────────────────────────────────────
// DEV_ORDER_SCREEN_TOKENS · 開發順序表畫面的 composition 參數
//
// 只承載本畫面獨有的組裝值：畫面框尺寸、雙欄骨架、圖例列、拖曳浮起層。
// 可重用的元件參數一律留在 10_foundations/component_tokens/no3_gantt_tokens.jsx
// 的 GANTT_TOKENS 與 no1_control_tokens.jsx，本檔不重新定義、只引用。
//
// 值一律引用 atomic 階梯（SPACING / RADIUS / BORDER_WIDTH / CONTROL_HEIGHT）
// 或 GANTT_TOKENS；離開階梯的值標 `// (literal: 原因)`。
// ─────────────────────────────────────────────────────────────

const DEV_ORDER_SCREEN_TOKENS = {
  // ─── 畫面框 ───
  FRAME_WIDTH:            1280,  // (literal: 桌面瀏覽器基準寬，非階梯值)
  FRAME_MIN_HEIGHT:       800,   // (literal: 桌面瀏覽器基準高，非階梯值)
  BODY_PADDING:           SPACING.lg,
  BODY_GAP:               SPACING.md,

  // ─── 雙欄板 ───
  // 兩欄對齊的唯一開關：density 一個值同時決定左欄列高與右欄列高、日格寬。
  // 左右欄任一處若各自指定 rowHeight，兩欄就會錯開，故本畫面只傳 density。
  DENSITY:                GANTT_TOKENS.DEFAULT_DENSITY,
  LIST_COLUMN_WIDTH:      GANTT_TOKENS.LIST_COLUMN_WIDTH,
  BOARD_RADIUS:           RADIUS.lg,
  BOARD_BORDER_WIDTH:     BORDER_WIDTH.hairline,

  // 排程視窗天數。八週 ≈ 兩個月，1280 寬放不下整段，超出部分由板內橫向捲軸承接。
  TIMELINE_DAY_COUNT:     56,    // (literal: 八週的日數，非視覺值)
  TIMELINE_TODAY_INDEX:   14,    // (literal: 示例資料的今日落點，非視覺值)

  // ─── 標頭左 gutter（主題單欄的欄名 + 日曆說明）───
  HEADER_LEADING_GAP:     SPACING['2xs'],

  // ─── 底部圖例列 ───
  LEGEND_MIN_HEIGHT:      CONTROL_HEIGHT.lg,
  LEGEND_PADDING_H:       SPACING.md,
  LEGEND_GAP:             SPACING.lg,
  LEGEND_ITEM_GAP:        SPACING.xs,
  LEGEND_SWATCH_WIDTH:    SPACING.lg,
  LEGEND_SWATCH_HEIGHT:   SPACING.md,
  LEGEND_SWATCH_RADIUS:   RADIUS.sm,
  LEGEND_BAR_HEIGHT:      SPACING.sm,
  LEGEND_RULE_WIDTH:      SPACING.xl,

  // ─── 拖曳中浮起的列 ───
  DRAG_OVERLAY_INSET_H:   SPACING.md,
  DRAG_OVERLAY_Z:         5,     // (literal: 疊在同欄列之上，仍低於 canvas 的 focus overlay)

  // ─── 空狀態 ───
  EMPTY_MIN_HEIGHT:       SPACING['4xl'] * 6,   // 288

  // ─── 工具列內的次要說明文字 ───
  TOOLBAR_META_GAP:       SPACING.xs,
};

Object.assign(window, { DEV_ORDER_SCREEN_TOKENS });
