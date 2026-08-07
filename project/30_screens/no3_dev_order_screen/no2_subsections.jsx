// ─────────────────────────────────────────────────────────────
// DevOrderScreen · 私有 sub-section 與示例資料
//
// 本檔只服務 no3_dev_order_screen.jsx，不對其他畫面開放。
// 分三段：日曆與主題單示例資料 / 兩欄對齊的帶狀骨架 / 圖例與浮起列。
//
// 兩欄對齊的機制全部收在本檔的兩個帶狀元件：
//   DevOrderRowBand     一段連續的主題單列。左欄堆 SortableRow、右欄一座 GanttTimeline，
//                       兩邊都只吃同一個 density，列高與列數同源，逐列必然對齊
//   DevOrderSectionBand 區塊分隔帶。左欄 SectionDivider、右欄鏡射同高同邊線的填充帶，
//                       分隔本身也橫跨兩欄，不會把右欄的列往上推
//
// 主題單的層級內容以三態表達，對應 spec 的兩個分支：
//   null  該層級無內容      → 空列（虛線 + 尚未拆到該層深度）
//   []    有內容但未排程    → 不畫長條（缺 StartTime 或 EndTime）
//   [...] 有內容且已排程    → 依 start / span 畫長條
// ─────────────────────────────────────────────────────────────

// TYPE_STYLES 的一條 → React inline style。前綴 devOrder 避免與其他畫面撞名。
function devOrderType(style) {
  return {
    fontSize: style.size,
    fontWeight: style.weight,
    lineHeight: `${style.lineHeight}px`,
    letterSpacing: style.letterSpacing,
  };
}

// ─── 日曆示例資料 ─────────────────────────────────────────────
// 日資料形狀依 no3_gantt_nav.jsx 的約定：
// { key, dayNumber, weekdayLabel, monthLabel, isHoliday, isMonthStart, isWeekStart, isToday }

const DEV_ORDER_WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const DEV_ORDER_CALENDAR_NAME = '台灣行事曆 2026';

// 週末之外的假日。有這幾天，假日格才讀得出「由日曆決定」而不只是週末。
const DEV_ORDER_EXTRA_HOLIDAYS = ['2026-9-25', '2026-10-9', '2026-10-10'];

const DEV_ORDER_TIMELINE_START = { year: 2026, month: 8, day: 24 };  // 週一起算

function devOrderBuildDays(start, count, todayIndex) {
  const out = [];
  const cursor = new Date(start.year, start.month - 1, start.day);
  for (let i = 0; i < count; i += 1) {
    const weekday = cursor.getDay();
    const key = `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`;
    out.push({
      key,
      dayNumber: cursor.getDate(),
      weekdayLabel: DEV_ORDER_WEEKDAY_LABELS[weekday],
      monthLabel: `${cursor.getFullYear()} 年 ${cursor.getMonth() + 1} 月`,
      isHoliday: weekday === 0 || weekday === 6 || DEV_ORDER_EXTRA_HOLIDAYS.indexOf(key) !== -1,
      isMonthStart: cursor.getDate() === 1,
      isWeekStart: weekday === 1,
      isToday: i === todayIndex,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

const DEV_ORDER_DAYS = devOrderBuildDays(
  DEV_ORDER_TIMELINE_START,
  DEV_ORDER_SCREEN_TOKENS.TIMELINE_DAY_COUNT,
  DEV_ORDER_SCREEN_TOKENS.TIMELINE_TODAY_INDEX
);

// 工期 = 起訖區間內的非假日天數。畫面端不自訂演算法，
// 只是把 computeIssueDuration 的「依日曆扣假日」結果以示例資料重現。
function devOrderWorkdays(days, start, span) {
  let count = 0;
  for (let i = start; i < start + span && i < days.length; i += 1) {
    if (!days[i].isHoliday) count += 1;
  }
  return count;
}

// 工期數字。單位與所用日曆由板底圖例統一標明，長條內只放數字與單位。
function devOrderDurationLabel(days, bar) {
  return `${devOrderWorkdays(days, bar.start, bar.span)} 天`;
}

// 時間軸區間說明。1280 寬放不下整段，工具列以此告知整段跨度。
function devOrderRangeLabel(days) {
  if (days.length === 0) return '';
  const first = days[0];
  const last = days[days.length - 1];
  const monthOf = (day) => day.monthLabel.replace(/^\d+\s*年\s*/, '').replace(/\s*月$/, '');
  return `${monthOf(first)}/${first.dayNumber} – ${monthOf(last)}/${last.dayNumber} · ${days.length} 天`;
}

// ─── 主題單示例資料 ───────────────────────────────────────────
// levels 的鍵對應 LevelSwitcher 的 id；值的三態見檔頭。

const DEV_ORDER_LEVELS = [
  { id: 'epic',  label: '主題' },
  { id: 'story', label: '需求' },
  { id: 'task',  label: '工項' },
];

// GanttBar 的 level 縮排階：主題 0、需求 1、工項 2。
const DEV_ORDER_LEVEL_DEPTH = { epic: 0, story: 1, task: 2 };

const DEV_ORDER_SOURCES = [
  { value: 'wave1', label: 'Wave 1 開發池' },
  { value: 'all',   label: '全部主題單' },
  { value: 'mine',  label: '我負責的' },
];

const DEV_ORDER_ISSUES = [
  {
    id: 'IGT-1', key: 'IGT-1', title: '資料模型骨架',
    levels: {
      epic:  [{ start: 0, span: 12 }],
      story: [{ start: 0, span: 5 }, { start: 5, span: 7 }],
      task:  [{ start: 0, span: 2 }, { start: 2, span: 3 }, { start: 6, span: 4 }, { start: 10, span: 2 }],
    },
  },
  {
    id: 'IGT-2', key: 'IGT-2', title: '編號與狀態流程',
    levels: {
      epic:  [{ start: 8, span: 10, overrun: 3 }],
      story: [{ start: 8, span: 4 }, { start: 12, span: 6, overrun: 3 }],
      task:  null,
    },
  },
  {
    id: 'IGT-3', key: 'IGT-3', title: '清單表格畫面',
    levels: {
      epic:  [{ start: 14, span: 14 }],
      story: [{ start: 14, span: 6 }, { start: 20, span: 8 }],
      task:  [{ start: 14, span: 3 }, { start: 17, span: 3 }, { start: 21, span: 4 }, { start: 25, span: 3 }],
    },
  },
  {
    id: 'IGT-4', key: 'IGT-4', title: '看板畫面',
    levels: {
      epic:  [{ start: 26, span: 12 }],
      story: null,
      task:  null,
    },
  },
  {
    id: 'IGT-5', key: 'IGT-5', title: '開發順序表',
    levels: {
      epic:  [{ start: 34, span: 16 }],
      story: [{ start: 34, span: 8 }, { start: 42, span: 8 }],
      task:  [{ start: 34, span: 4 }, { start: 38, span: 4 }],
    },
  },
  {
    id: 'IGT-6', key: 'IGT-6', title: '權限與日曆設定',
    // 已排入順序、但起訖未定：三層都不畫長條，也不是空列。
    levels: { epic: [], story: null, task: null },
  },
  { id: 'IGT-7', key: 'IGT-7', title: '通知與訂閱',     levels: { epic: [], story: null, task: null } },
  { id: 'IGT-8', key: 'IGT-8', title: '報表匯出',       levels: { epic: [], story: null, task: null } },
  { id: 'IGT-9', key: 'IGT-9', title: '外部整合 Webhook', levels: { epic: [], story: null, task: null } },
];

const DEV_ORDER_ISSUE_BY_ID = Object.fromEntries(DEV_ORDER_ISSUES.map((issue) => [issue.id, issue]));

function devOrderIssues(ids) {
  return ids.map((id) => DEV_ORDER_ISSUE_BY_ID[id]).filter(Boolean);
}

// ─── 標頭左 gutter ────────────────────────────────────────────
// GanttHeader 的 leading 內容。寬度與主題單清單欄同值，標頭才橫跨兩欄仍對齊。
function DevOrderHeaderLeading({ theme, calendarName }) {
  const colors = resolveGanttColors(theme);
  const T = DEV_ORDER_SCREEN_TOKENS;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.HEADER_LEADING_GAP, minWidth: 0 }}>
      <span style={{ ...devOrderType(TYPE_STYLES.overline), color: colors.textSecondary, whiteSpace: 'nowrap' }}>
        主題單
      </span>
      <span style={{
        ...devOrderType(TYPE_STYLES.caption), color: colors.textTertiary,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        天數依 {calendarName}
      </span>
    </div>
  );
}

// ─── 區塊分隔帶 ───────────────────────────────────────────────
// 左欄放 SectionDivider，右欄鏡射一條同高同邊線的填充帶。
// 兩側都吃 GANTT_TOKENS.SECTION_DIVIDER_HEIGHT 與同一組邊線色，
// 分隔才真的橫跨兩欄、右欄的列也不會被推移半格。
function DevOrderSectionBand({ theme, days, density, listWidth, title, count, countLabel, hint, active = false }) {
  const colors = resolveGanttColors(theme);
  const dayWidth = GANTT_TOKENS.DENSITY[density].dayWidth;
  const line = active ? colors.dropIndicator : colors.sectionLine;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <div style={{
        width: listWidth, flexShrink: 0,
        borderRight: `${GANTT_TOKENS.MONTH_SEPARATOR_WIDTH}px solid ${colors.monthLine}`,
      }}>
        <SectionDivider
          theme={theme} title={title} count={count} countLabel={countLabel} hint={hint} active={active}
        />
      </div>
      <div
        aria-hidden="true"
        style={{
          width: days.length * dayWidth, flexShrink: 0, boxSizing: 'border-box',
          height: GANTT_TOKENS.SECTION_DIVIDER_HEIGHT,
          background: colors.sectionBg,
          borderTop: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${line}`,
          borderBottom: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${line}`,
          transition: `border-color ${GANTT_TOKENS.ROW_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}`,
        }}
      />
    </div>
  );
}

// ─── 主題單列帶 ───────────────────────────────────────────────
// 一段連續的列。左欄一列一顆 SortableRow、右欄一座 GanttTimeline 承 rows 列，
// 兩邊只傳 density、不各自指定 rowHeight，列高同源。
//
// rows 的每筆帶 { id, key, title, levels, selected, ghost, dropIndicator }。
// showBars 為假時右欄只留格線與假日底（未排序區的列不排程，照 spec 線框圖留白）。
function DevOrderRowBand({
  theme, days, density, listWidth, rows, levelId, showBars = true, dragOverlay = null,
}) {
  const colors = resolveGanttColors(theme);
  const depth = DEV_ORDER_LEVEL_DEPTH[levelId] || 0;

  const barsOf = (row, rowIndex) => {
    const bars = row.levels ? row.levels[levelId] : null;
    // 該層級無內容 → 空列。
    if (!bars) {
      return (
        <GanttBar
          key={`${row.id}-empty`} theme={theme} days={days} density={density}
          rowIndex={rowIndex} empty
        />
      );
    }
    // 有內容但缺 StartTime 或 EndTime → 不畫長條，列留白。
    return bars.map((bar, i) => (
      <GanttBar
        key={`${row.id}-${i}`} theme={theme} days={days} density={density}
        rowIndex={rowIndex} level={depth}
        startIndex={bar.start} span={bar.span} overrunSpan={bar.overrun || 0}
        durationLabel={devOrderDurationLabel(days, bar)}
        selected={row.selected}
        onActivate={() => {}}
      />
    ));
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <div style={{
        position: 'relative', width: listWidth, flexShrink: 0,
        borderRight: `${GANTT_TOKENS.MONTH_SEPARATOR_WIDTH}px solid ${colors.monthLine}`,
      }}>
        {rows.map((row) => (
          <SortableRow
            key={row.id} theme={theme} density={density}
            title={row.title} meta={row.key}
            selected={row.selected} ghost={row.ghost}
            dropIndicator={row.dropIndicator || 'none'}
            onHandlePointerDown={() => {}}
            onActivate={() => {}}
          />
        ))}
        {dragOverlay}
      </div>
      <GanttTimeline theme={theme} days={days} rows={rows.length} density={density}>
        {showBars ? rows.map((row, i) => barsOf(row, i)) : null}
      </GanttTimeline>
    </div>
  );
}

// ─── 拖曳中浮起的列 ───────────────────────────────────────────
// 放置指示線由 SortableRow 的 dropIndicator 畫在目標列上，本元件只負責
// 跟著游標抬起的那一列。定位錨在插入點上緣往上半列，讀作「正插進這兩列之間」。
function DevOrderDragRow({ theme, density, issue, rowIndex }) {
  const T = DEV_ORDER_SCREEN_TOKENS;
  const rowHeight = GANTT_TOKENS.DENSITY[density].rowHeight;
  return (
    <div style={{
      position: 'absolute',
      left: T.DRAG_OVERLAY_INSET_H, right: T.DRAG_OVERLAY_INSET_H,
      top: rowIndex * rowHeight - rowHeight / 2,
      zIndex: T.DRAG_OVERLAY_Z,
      pointerEvents: 'none',
    }}>
      <SortableRow theme={theme} density={density} title={issue.title} meta={issue.key} dragging />
    </div>
  );
}

// ─── 板底圖例 ─────────────────────────────────────────────────
// 假日格、工期單位與所用日曆、空列三件事在此一次講清楚。
// 工期數字擠不下「單位 + 日曆」，故長條內只放數字，日曆歸屬由本列統一標明。
function DevOrderLegend({ theme, calendarName }) {
  const colors = resolveGanttColors(theme);
  const T = DEV_ORDER_SCREEN_TOKENS;

  const item = (mark, text) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: T.LEGEND_ITEM_GAP, whiteSpace: 'nowrap' }}>
      {mark}
      {text}
    </span>
  );

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: T.LEGEND_GAP, minHeight: T.LEGEND_MIN_HEIGHT,
      padding: `0 ${T.LEGEND_PADDING_H}px`,
      background: colors.headerBg,
      borderTop: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.sectionLine}`,
      ...devOrderType(TYPE_STYLES.caption),
      color: colors.textTertiary,
      fontFamily: FONT_FAMILY.base,
    }}>
      {item(
        <span style={{
          width: T.LEGEND_SWATCH_WIDTH, height: T.LEGEND_SWATCH_HEIGHT,
          background: colors.holidayCell,
          border: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.dayLine}`,
          borderRadius: T.LEGEND_SWATCH_RADIUS, flexShrink: 0,
        }} />,
        `假日格 · ${calendarName}`
      )}
      {item(
        <span style={{
          width: T.LEGEND_SWATCH_WIDTH, height: T.LEGEND_BAR_HEIGHT,
          background: colors.barFill, borderRadius: GANTT_TOKENS.BAR_RADIUS, flexShrink: 0,
        }} />,
        `工單長條，數字為工期天數，依 ${calendarName} 扣除假日`
      )}
      {item(
        <span style={{
          width: T.LEGEND_RULE_WIDTH, flexShrink: 0,
          borderTop: `${GANTT_TOKENS.EMPTY_ROW_RULE_WIDTH}px dashed ${colors.emptyRowRule}`,
        }} />,
        '虛線列：該主題單尚未拆到目前層級'
      )}
    </div>
  );
}

Object.assign(window, {
  devOrderType, devOrderBuildDays, devOrderWorkdays, devOrderDurationLabel, devOrderRangeLabel, devOrderIssues,
  DEV_ORDER_WEEKDAY_LABELS, DEV_ORDER_CALENDAR_NAME, DEV_ORDER_EXTRA_HOLIDAYS,
  DEV_ORDER_TIMELINE_START, DEV_ORDER_DAYS,
  DEV_ORDER_LEVELS, DEV_ORDER_LEVEL_DEPTH, DEV_ORDER_SOURCES,
  DEV_ORDER_ISSUES, DEV_ORDER_ISSUE_BY_ID,
  DevOrderHeaderLeading, DevOrderSectionBand, DevOrderRowBand, DevOrderDragRow, DevOrderLegend,
});
