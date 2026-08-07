// ─────────────────────────────────────────────────────────────
// 甘特與導航組 · Gantt & Nav components
//
// 消費畫面：DevOrderScreen（開發順序表）。左欄主題單清單拖拉排序、
// 右欄甘特圖依日曆天檢視各層級工單排程，兩欄逐列對齊。
// 對側 spec：no3_product_specs/no1_issue_system/no2_screens/no3_dev_order_screen.md
//
// 元件與角色：
//   GanttHeader    甘特標頭。月份帶 + 日期刻度帶，左側留出與清單欄同寬的 gutter
//   GanttTimeline  時間軸背景。日格線、週線、月分隔線、假日格底、列分隔線
//   GanttBar       工單長條。層級縮排、工期數字、超期偏離；空列亦由本元件承載
//   SortableRow    可拖拉的主題單列。拖曳把手、拖曳中態、原位殘影、放置指示線
//   SectionDivider 已排序區與未排序區的分隔。區塊標題 + 計數
//   LevelSwitcher  顯示層級切換器。分段控制形式
//   Toolbar        畫面工具列容器。左中右三區
//
// 共同約定：
//   - 一切視覺值走 GANTT_TOKENS（尺寸 / 節奏）與 resolveGanttColors(theme)（色彩），
//     元件不寫死 hex 與數字、不讀 THEME_LIGHT / THEME_DARK，兩主題同一份程式碼
//   - theme 為必填 prop，density 三檔（compact / base / relaxed）左右欄必須同值
//   - focus 外框一律吃 colors.focusRing（= theme.border.input，兩主題保 3:1）
//   - 日資料形狀：{ key, dayNumber, weekdayLabel, monthLabel, isHoliday, isMonthStart, isWeekStart, isToday }
// ─────────────────────────────────────────────────────────────

// ─── 內部小工具（不 export，前綴 gantt 避免與其他元件檔撞名）───

function ganttDensityOf(density) {
  return GANTT_TOKENS.DENSITY[density] || GANTT_TOKENS.DENSITY[GANTT_TOKENS.DEFAULT_DENSITY];
}

function ganttType(style) {
  return {
    fontSize: style.size,
    fontWeight: style.weight,
    lineHeight: `${style.lineHeight}px`,
    letterSpacing: style.letterSpacing,
  };
}

function ganttShadow(theme, level) {
  const e = theme.shadow.elevation[level];
  if (!e || e.opacity === 0) return 'none';
  const n = parseInt(theme.shadow.color.slice(1), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  return `0 ${e.offsetY}px ${e.blur}px rgba(${rgb},${e.opacity})`;
}

function ganttFocusStyle(colors, focused) {
  return focused
    ? {
        outline: `${GANTT_TOKENS.FOCUS_RING_WIDTH}px solid ${colors.focusRing}`,
        outlineOffset: GANTT_TOKENS.FOCUS_RING_OFFSET,
      }
    : { outline: 'none' };
}

// 把日陣列切成月份區段，供月份帶算寬與畫分隔。
function ganttMonthSegments(days) {
  const segments = [];
  days.forEach((day, index) => {
    const last = segments[segments.length - 1];
    if (!last || last.label !== day.monthLabel) {
      segments.push({ label: day.monthLabel, startIndex: index, span: 1 });
    } else {
      last.span += 1;
    }
  });
  return segments;
}

// 拖曳把手的六點 grip。canvas 自製 SVG，非 impl 元件對應。
function GanttGrip({ size, color }) {
  const dots = [[5, 4], [11, 4], [5, 8], [11, 8], [5, 12], [11, 12]];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {dots.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.3" fill={color} />
      ))}
    </svg>
  );
}

// ─── GanttHeader ─────────────────────────────────────────────
// 月份帶在上、日期刻度帶在下。leading 為左側 gutter 內容（畫面用來放日曆名稱），
// 寬度與主題單清單欄同值，讓標頭橫跨兩欄仍對齊。
// 日格窄到讀不出字時逐級降載：先收星期字母、再收日號，只留刻度線與假日底。
function GanttHeader({
  theme,
  days,
  density = GANTT_TOKENS.DEFAULT_DENSITY,
  leading = null,
  leadingWidth = GANTT_TOKENS.LIST_COLUMN_WIDTH,
  style,
}) {
  const colors = resolveGanttColors(theme);
  const d = ganttDensityOf(density);
  const dayWidth = d.dayWidth;
  const segments = ganttMonthSegments(days);
  const showDayNumber = dayWidth >= GANTT_TOKENS.DAY_LABEL_MIN_CELL_WIDTH;
  const showWeekday = dayWidth >= GANTT_TOKENS.WEEKDAY_LABEL_MIN_CELL_WIDTH;

  return (
    <div
      style={{
        display: 'flex',
        background: colors.headerBg,
        borderBottom: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.sectionLine}`,
        fontFamily: FONT_FAMILY.base,
        ...(style || {}),
      }}
    >
      {/* 左 gutter：日曆名稱等說明文字 */}
      <div
        style={{
          width: leadingWidth,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-end',
          padding: `0 ${GANTT_TOKENS.HEADER_LEADING_PADDING_H}px`,
          paddingBottom: GANTT_TOKENS.HEADER_LEADING_PADDING_BOTTOM,
          borderRight: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.monthLine}`,
          ...ganttType(TYPE_STYLES.caption),
          color: colors.textSecondary,
        }}
      >
        {leading}
      </div>

      <div style={{ position: 'relative', width: days.length * dayWidth, flexShrink: 0 }}>
        {/* 月份帶 */}
        <div style={{ display: 'flex', height: GANTT_TOKENS.HEADER_MONTH_BAND_HEIGHT }}>
          {segments.map((segment, i) => (
            <div
              key={segment.label}
              style={{
                width: segment.span * dayWidth,
                display: 'flex',
                alignItems: 'center',
                padding: `0 ${GANTT_TOKENS.HEADER_MONTH_LABEL_PADDING_H}px`,
                borderLeft: i === 0
                  ? 'none'
                  : `${GANTT_TOKENS.MONTH_SEPARATOR_WIDTH}px solid ${colors.monthLine}`,
                ...ganttType(TYPE_STYLES.label),
                color: colors.textPrimary,
                fontVariantNumeric: NUMERIC_FONT_VARIANT,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {segment.label}
            </div>
          ))}
        </div>

        {/* 日期刻度帶 */}
        <div
          style={{
            display: 'flex',
            height: GANTT_TOKENS.HEADER_DAY_BAND_HEIGHT,
            borderTop: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.dayLine}`,
          }}
        >
          {days.map((day, i) => (
            <div
              key={day.key}
              style={{
                width: dayWidth,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0,
                background: day.isHoliday ? colors.holidayCell : 'transparent',
                borderLeft: i === 0
                  ? 'none'
                  : `${day.isMonthStart ? GANTT_TOKENS.MONTH_SEPARATOR_WIDTH : GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${
                      day.isMonthStart ? colors.monthLine : day.isWeekStart ? colors.weekLine : colors.dayLine
                    }`,
              }}
            >
              {showDayNumber && (
                <span
                  style={{
                    // 日號一律 secondary，假日不再降一階。降階版（tertiary）疊在
                    // 「header dim + 假日 tint」雙層底上只剩 4.10–4.54:1，落在 AA 之下，
                    // 且分數隨消費端墊什麼底浮動。假日的視覺區隔交給格底 tint 獨撐——
                    // 與本組「假日只用底色成塊」的定案一致。secondary 在同一底上 5.97–9.19。
                    ...ganttType(TYPE_STYLES.caption),
                    color: colors.textSecondary,
                    fontWeight: day.isToday ? TYPOGRAPHY.weight.semibold : TYPE_STYLES.caption.weight,
                    fontVariantNumeric: NUMERIC_FONT_VARIANT,
                  }}
                >
                  {day.dayNumber}
                </span>
              )}
              {showWeekday && (
                // 同日號一律 secondary。星期字母是整個標頭最小的字（2xs 10px），
                // 小字更需要對比而非更少——tertiary 疊在 dark 的假日底上只剩 4.20:1。
                // 日期帶內的層級改由字級承載：日號 11、星期字母 10，月份帶則走
                // textPrimary + label(12/medium)，三段仍有清楚階梯。
                <span style={{ ...ganttType(TYPE_STYLES.caption), fontSize: TYPOGRAPHY.size['2xs'], color: colors.textSecondary }}>
                  {day.weekdayLabel}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── GanttTimeline ───────────────────────────────────────────
// 只畫背景：假日格底、日 / 週 / 月三級縱線、列分隔橫線。
// 假日視覺在此定案——只用底色成塊，不加邊框、不加斜紋，讓長條與偏離斜紋獨佔圖樣語彙。
// children 疊在背景之上，由畫面丟入逐列的 GanttBar。
function GanttTimeline({
  theme,
  days,
  rows = 1,
  density = GANTT_TOKENS.DEFAULT_DENSITY,
  rowHeight,
  children,
  style,
}) {
  const colors = resolveGanttColors(theme);
  const d = ganttDensityOf(density);
  const dayWidth = d.dayWidth;
  const rh = rowHeight || d.rowHeight;
  const width = days.length * dayWidth;
  const height = rows * rh;

  return (
    <div
      style={{
        position: 'relative',
        width,
        minHeight: height,
        background: colors.timelineBg,
        fontFamily: FONT_FAMILY.base,
        ...(style || {}),
      }}
    >
      {/* 假日格底 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {days.map((day, i) =>
          day.isHoliday ? (
            <div
              key={day.key}
              style={{
                position: 'absolute',
                left: i * dayWidth,
                top: 0,
                bottom: 0,
                width: dayWidth,
                background: colors.holidayCell,
              }}
            />
          ) : null
        )}
      </div>

      {/* 縱線：月 > 週 > 日 三級 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {days.map((day, i) =>
          i === 0 ? null : (
            <div
              key={day.key}
              style={{
                position: 'absolute',
                left: i * dayWidth,
                top: 0,
                bottom: 0,
                width: day.isMonthStart ? GANTT_TOKENS.MONTH_SEPARATOR_WIDTH : GANTT_TOKENS.GRID_LINE_WIDTH,
                background: day.isMonthStart ? colors.monthLine : day.isWeekStart ? colors.weekLine : colors.dayLine,
              }}
            />
          )
        )}
      </div>

      {/* 橫線：與左欄列高同步 */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={r}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: (r + 1) * rh - GANTT_TOKENS.ROW_LINE_WIDTH,
              height: GANTT_TOKENS.ROW_LINE_WIDTH,
              background: colors.rowLine,
            }}
          />
        ))}
      </div>

      <div style={{ position: 'relative', width, minHeight: height }}>{children}</div>
    </div>
  );
}

// ─── GanttBar ────────────────────────────────────────────────
// 一列一顆。startIndex / span 對應 StartTime 與 EndTime 落在 days 上的索引與天數。
//
// 層級縮排的取法：水平起訖絕不動，動了日期就對不上刻度。改用兩件事表達深度——
// 長條每深一層薄一階（BAR_LEVEL_HEIGHT_STEP），工期標籤在長條內左縮一階（BAR_LEVEL_INDENT）。
//
// 超期偏離：overrunSpan > 0 時在主段尾端接一截 error 斜紋段，並掛 +N 標。
// 空列：empty 為真時不畫長條，改畫虛線與「尚未拆到該層深度」提示。
// 缺 StartTime 或 EndTime 由畫面端判斷後不渲染本元件，元件本身不猜。
function GanttBar({
  theme,
  days,
  startIndex = 0,
  span = 1,
  overrunSpan = 0,
  rowIndex = 0,
  level = 0,
  durationLabel,
  density = GANTT_TOKENS.DEFAULT_DENSITY,
  rowHeight,
  empty = false,
  emptyLabel = '尚未拆到該層深度',
  disabled = false,
  selected = false,
  onActivate,
  style,
}) {
  const colors = resolveGanttColors(theme);
  const d = ganttDensityOf(density);
  const dayWidth = d.dayWidth;
  const rh = rowHeight || d.rowHeight;
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);

  const top = rowIndex * rh;

  if (empty) {
    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top,
          height: rh,
          width: (days ? days.length : span) * dayWidth,
          display: 'flex',
          alignItems: 'center',
          padding: `0 ${GANTT_TOKENS.EMPTY_ROW_PADDING_H}px`,
          gap: GANTT_TOKENS.ROW_GAP,
          pointerEvents: 'none',
          ...(style || {}),
        }}
      >
        <span style={{ ...ganttType(TYPE_STYLES.caption), color: colors.textTertiary, whiteSpace: 'nowrap' }}>
          {emptyLabel}
        </span>
        <span
          style={{
            flex: 1,
            borderTop: `${GANTT_TOKENS.EMPTY_ROW_RULE_WIDTH}px dashed ${colors.emptyRowRule}`,
          }}
        />
      </div>
    );
  }

  const barHeight = Math.max(
    d.barHeight - level * GANTT_TOKENS.BAR_LEVEL_HEIGHT_STEP,
    GANTT_TOKENS.BAR_HEIGHT_MIN
  );
  const left = startIndex * dayWidth + GANTT_TOKENS.BAR_INSET_H;
  const mainWidth = Math.max(span * dayWidth - GANTT_TOKENS.BAR_INSET_H * 2, GANTT_TOKENS.BAR_MIN_WIDTH);
  const overrunWidth = overrunSpan > 0
    ? Math.max(overrunSpan * dayWidth, GANTT_TOKENS.OVERRUN_MIN_WIDTH)
    : 0;
  const totalWidth = mainWidth + overrunWidth;
  const labelInside = mainWidth >= GANTT_TOKENS.BAR_LABEL_INSIDE_MIN_WIDTH;
  const stripe = GANTT_TOKENS.OVERRUN_STRIPE_WIDTH;

  return (
    <div
      role={onActivate ? 'button' : 'img'}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label={durationLabel}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => !disabled && setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => !disabled && onActivate && onActivate()}
      style={{
        position: 'absolute',
        left,
        top: top + (rh - barHeight) / 2,
        height: barHeight,
        display: 'flex',
        alignItems: 'stretch',
        cursor: disabled ? 'default' : onActivate ? 'pointer' : 'default',
        opacity: disabled ? colors.disabledOpacity : 1,
        borderRadius: GANTT_TOKENS.BAR_RADIUS,
        boxShadow: hovered && !disabled ? ganttShadow(theme, GANTT_TOKENS.BAR_HOVER_ELEVATION) : 'none',
        transition: `box-shadow ${GANTT_TOKENS.BAR_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}, background ${GANTT_TOKENS.BAR_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}`,
        ...ganttFocusStyle(colors, focused && !disabled),
        ...(style || {}),
      }}
    >
      {/* 主段 */}
      <div
        style={{
          width: mainWidth,
          background: hovered && !disabled ? colors.barFillHover : colors.barFill,
          borderRadius: overrunWidth
            ? `${GANTT_TOKENS.BAR_RADIUS}px 0 0 ${GANTT_TOKENS.BAR_RADIUS}px`
            : GANTT_TOKENS.BAR_RADIUS,
          border: selected ? `${GANTT_TOKENS.BAR_SELECTED_BORDER_WIDTH}px solid ${colors.barBorder}` : 'none',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: GANTT_TOKENS.BAR_LABEL_PADDING_H + level * GANTT_TOKENS.BAR_LEVEL_INDENT,
          paddingRight: GANTT_TOKENS.BAR_LABEL_PADDING_H,
          overflow: 'hidden',
        }}
      >
        {labelInside && durationLabel && (
          <span
            style={{
              ...ganttType(TYPE_STYLES.caption),
              color: colors.barLabelOn,
              fontVariantNumeric: NUMERIC_FONT_VARIANT,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {durationLabel}
          </span>
        )}
      </div>

      {/* 超期偏離段 */}
      {overrunWidth > 0 && (
        <div
          style={{
            width: overrunWidth,
            borderRadius: `0 ${GANTT_TOKENS.BAR_RADIUS}px ${GANTT_TOKENS.BAR_RADIUS}px 0`,
            background: `repeating-linear-gradient(${GANTT_TOKENS.OVERRUN_STRIPE_ANGLE}, ${colors.overrun} 0 ${stripe}px, ${colors.overrunTrack} ${stripe}px ${stripe * 2}px)`,
          }}
        />
      )}

      {/* 外掛標籤：長條太窄放不下工期字時，或需要標超期天數時 */}
      {(!labelInside || overrunSpan > 0) && (
        <span
          style={{
            position: 'absolute',
            left: totalWidth + GANTT_TOKENS.OVERRUN_LABEL_GAP,
            top: 0,
            height: barHeight,
            display: 'flex',
            alignItems: 'center',
            gap: GANTT_TOKENS.OVERRUN_LABEL_GAP,
            ...ganttType(TYPE_STYLES.caption),
            color: colors.barLabelOutside,
            fontVariantNumeric: NUMERIC_FONT_VARIANT,
            whiteSpace: 'nowrap',
          }}
        >
          {!labelInside && durationLabel}
          {overrunSpan > 0 && (
            <span style={{ color: colors.overrunLabel, fontWeight: TYPOGRAPHY.weight.medium }}>
              {`超期 +${overrunSpan}`}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

// ─── SortableRow ─────────────────────────────────────────────
// 主題單列。列高與同 density 的甘特列一致，兩欄才對得齊。
// 狀態：預設 / hover / focus / dragging（拖起本體）/ ghost（原位殘影）/ selected / disabled。
// dropIndicator 取 'none' | 'above' | 'below'，線首帶圓頭指出插入點。
function SortableRow({
  theme,
  title,
  meta,
  density = GANTT_TOKENS.DEFAULT_DENSITY,
  rowHeight,
  dragging = false,
  ghost = false,
  dropIndicator = 'none',
  selected = false,
  disabled = false,
  onHandlePointerDown,
  onActivate,
  style,
}) {
  const colors = resolveGanttColors(theme);
  const d = ganttDensityOf(density);
  const rh = rowHeight || d.rowHeight;
  const [hovered, setHovered] = React.useState(false);
  const [focused, setFocused] = React.useState(false);
  const [handleHovered, setHandleHovered] = React.useState(false);

  const background = disabled
    ? colors.rowBg
    : selected
      ? colors.rowBgSelected
      : hovered || dragging
        ? colors.rowBgHover
        : colors.rowBg;

  const indicator = (position) => (
    <div
      style={{
        position: 'absolute',
        left: GANTT_TOKENS.DROP_INDICATOR_INSET,
        right: GANTT_TOKENS.DROP_INDICATOR_INSET,
        [position]: -GANTT_TOKENS.DROP_INDICATOR_WIDTH / 2,
        height: GANTT_TOKENS.DROP_INDICATOR_WIDTH,
        background: colors.dropIndicator,
        borderRadius: GANTT_TOKENS.DROP_INDICATOR_RADIUS,
        pointerEvents: 'none',
        transition: `opacity ${GANTT_TOKENS.DROP_INDICATOR_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -GANTT_TOKENS.DROP_INDICATOR_CAP_SIZE / 2,
          top: (GANTT_TOKENS.DROP_INDICATOR_WIDTH - GANTT_TOKENS.DROP_INDICATOR_CAP_SIZE) / 2,
          width: GANTT_TOKENS.DROP_INDICATOR_CAP_SIZE,
          height: GANTT_TOKENS.DROP_INDICATOR_CAP_SIZE,
          borderRadius: GANTT_TOKENS.DROP_INDICATOR_RADIUS,
          background: colors.dropIndicator,
        }}
      />
    </div>
  );

  return (
    <div
      role="listitem"
      aria-grabbed={dragging || undefined}
      aria-disabled={disabled || undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => !disabled && setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => !disabled && onActivate && onActivate()}
      tabIndex={disabled ? -1 : 0}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: GANTT_TOKENS.ROW_GAP,
        height: rh,
        padding: `0 ${GANTT_TOKENS.ROW_PADDING_H}px`,
        background,
        borderBottom: `${GANTT_TOKENS.ROW_LINE_WIDTH}px solid ${colors.rowLine}`,
        borderRadius: dragging ? GANTT_TOKENS.DRAG_ROW_RADIUS : 0,
        boxShadow: dragging ? ganttShadow(theme, GANTT_TOKENS.DRAG_ROW_ELEVATION) : 'none',
        transform: dragging ? `scale(${GANTT_TOKENS.DRAG_ROW_SCALE})` : 'none',
        opacity: ghost ? GANTT_TOKENS.DRAG_GHOST_OPACITY : 1,
        cursor: disabled ? 'default' : onActivate ? 'pointer' : 'default',
        fontFamily: FONT_FAMILY.base,
        transition: `background ${GANTT_TOKENS.ROW_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}, box-shadow ${GANTT_TOKENS.ROW_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}, transform ${GANTT_TOKENS.ROW_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}`,
        ...ganttFocusStyle(colors, focused && !disabled),
        ...(style || {}),
      }}
    >
      {/* 拖曳把手 */}
      <span
        role="button"
        aria-label="拖曳排序"
        tabIndex={disabled ? -1 : 0}
        onPointerDown={disabled ? undefined : onHandlePointerDown}
        onMouseEnter={() => !disabled && setHandleHovered(true)}
        onMouseLeave={() => setHandleHovered(false)}
        style={{
          width: GANTT_TOKENS.DRAG_HANDLE_WIDTH,
          height: GANTT_TOKENS.DRAG_HANDLE_WIDTH,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: GANTT_TOKENS.DRAG_HANDLE_RADIUS,
          cursor: disabled ? 'not-allowed' : dragging ? 'grabbing' : 'grab',
          opacity: disabled ? colors.disabledOpacity : 1,
        }}
      >
        <GanttGrip
          size={GANTT_TOKENS.DRAG_HANDLE_ICON_SIZE}
          color={disabled ? colors.textDisabled : handleHovered || dragging ? colors.handleActive : colors.handle}
        />
      </span>

      {/* 標題 */}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          ...ganttType(TYPE_STYLES.tableCell),
          color: disabled ? colors.textDisabled : selected ? colors.textSelected : colors.textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </span>

      {/* 次要資訊（工單編號、計數等）*/}
      {meta && (
        <span
          style={{
            flexShrink: 0,
            ...ganttType(TYPE_STYLES.caption),
            color: disabled ? colors.textDisabled : colors.textTertiary,
            fontVariantNumeric: NUMERIC_FONT_VARIANT,
          }}
        >
          {meta}
        </span>
      )}

      {dropIndicator === 'above' && indicator('top')}
      {dropIndicator === 'below' && indicator('bottom')}
    </div>
  );
}

// ─── SectionDivider ──────────────────────────────────────────
// 已排序區與未排序區的分隔。標題 + 計數；未排序區可帶 hint 說明收錄規則。
// 拖曳跨區時 active 為真，整條分隔提亮，指出這是可放置的區界。
function SectionDivider({
  theme,
  title,
  count,
  countLabel,
  hint,
  active = false,
  style,
}) {
  const colors = resolveGanttColors(theme);
  return (
    <div
      role="separator"
      aria-label={typeof count === 'number' ? `${title} ${count}` : title}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: GANTT_TOKENS.ROW_GAP,
        height: GANTT_TOKENS.SECTION_DIVIDER_HEIGHT,
        padding: `0 ${GANTT_TOKENS.SECTION_DIVIDER_PADDING_H}px`,
        background: colors.sectionBg,
        borderTop: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${active ? colors.dropIndicator : colors.sectionLine}`,
        borderBottom: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${active ? colors.dropIndicator : colors.sectionLine}`,
        fontFamily: FONT_FAMILY.base,
        transition: `border-color ${GANTT_TOKENS.ROW_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}`,
        ...(style || {}),
      }}
    >
      <span
        style={{
          ...ganttType(TYPE_STYLES.overline),
          color: colors.textSecondary,
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>

      {typeof count === 'number' && (
        <span
          style={{
            height: GANTT_TOKENS.SECTION_COUNT_HEIGHT,
            padding: `0 ${GANTT_TOKENS.SECTION_COUNT_PADDING_H}px`,
            borderRadius: GANTT_TOKENS.SECTION_COUNT_RADIUS,
            border: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.controlBorder}`,
            display: 'inline-flex',
            alignItems: 'center',
            ...ganttType(TYPE_STYLES.caption),
            color: colors.textSecondary,
            fontVariantNumeric: NUMERIC_FONT_VARIANT,
            whiteSpace: 'nowrap',
          }}
        >
          {countLabel || count}
        </span>
      )}

      {hint && (
        <span
          style={{
            ...ganttType(TYPE_STYLES.caption),
            color: colors.textTertiary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}

// ─── LevelSwitcher ───────────────────────────────────────────
// 顯示層級切換器，形式定案為分段控制（segmented control）。
// 選定理由：層級是少數且固定的有序集合，切換頻繁且要能一眼看出「現在在哪一層、
// 還有哪幾層」。下拉選單會把兄弟層藏起來、每次切換多一次點擊；分段控制把整條
// 層級軸攤平在工具列上，一次點擊直達，也順帶當作深度的視覺尺規。
// 層級多到攤不下時（levels 超過 maxInline）改走 overflow，由畫面端決定，元件不自作主張。
function LevelSwitcher({
  theme,
  levels = [],
  value,
  onChange,
  disabled = false,
  ariaLabel = '顯示層級',
  style,
}) {
  const colors = resolveGanttColors(theme);
  const [hoveredId, setHoveredId] = React.useState(null);
  const [focusedId, setFocusedId] = React.useState(null);

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: GANTT_TOKENS.LEVEL_SWITCHER_PADDING,
        height: GANTT_TOKENS.LEVEL_SWITCHER_HEIGHT,
        padding: GANTT_TOKENS.LEVEL_SWITCHER_PADDING,
        borderRadius: GANTT_TOKENS.LEVEL_SWITCHER_RADIUS,
        border: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.controlBorder}`,
        background: colors.headerBg,
        opacity: disabled ? colors.disabledOpacity : 1,
        fontFamily: FONT_FAMILY.base,
        ...(style || {}),
      }}
    >
      {levels.map((level) => {
        const isSelected = level.id === value;
        const isDisabled = disabled || level.disabled;
        const isHovered = hoveredId === level.id && !isDisabled;
        return (
          <button
            key={level.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-disabled={isDisabled || undefined}
            disabled={isDisabled}
            onMouseEnter={() => setHoveredId(level.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setFocusedId(level.id)}
            onBlur={() => setFocusedId(null)}
            onClick={() => !isDisabled && onChange && onChange(level.id)}
            style={{
              height: GANTT_TOKENS.LEVEL_SWITCHER_HEIGHT - GANTT_TOKENS.LEVEL_SWITCHER_PADDING * 2,
              minWidth: GANTT_TOKENS.LEVEL_SWITCHER_ITEM_MIN_WIDTH,
              padding: `0 ${GANTT_TOKENS.LEVEL_SWITCHER_ITEM_PADDING_H}px`,
              border: 'none',
              borderRadius: GANTT_TOKENS.LEVEL_SWITCHER_ITEM_RADIUS,
              background: isSelected ? colors.rowBgSelected : isHovered ? colors.rowBgHover : 'transparent',
              ...ganttType(TYPE_STYLES.label),
              color: isDisabled
                ? colors.textDisabled
                : isSelected
                  ? colors.textSelected
                  : colors.textSecondary,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              transition: `background ${GANTT_TOKENS.SWITCHER_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}, color ${GANTT_TOKENS.SWITCHER_TRANSITION_MS}ms ${GANTT_TOKENS.EASING}`,
              ...ganttFocusStyle(colors, focusedId === level.id && !isDisabled),
            }}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────
// 畫面工具列容器。左中右三區：left 貼左、right 貼右、center 佔滿剩餘空間並置中。
// 三區都可為空；center 溢出時內縮，不擠壓左右兩區。
function Toolbar({ theme, left, center, right, style }) {
  const colors = resolveGanttColors(theme);
  const slot = (extra) => ({
    display: 'flex',
    alignItems: 'center',
    gap: GANTT_TOKENS.TOOLBAR_GAP,
    minWidth: 0,
    ...extra,
  });

  return (
    <div
      role="toolbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: GANTT_TOKENS.TOOLBAR_GAP,
        height: GANTT_TOKENS.TOOLBAR_HEIGHT,
        padding: `0 ${GANTT_TOKENS.TOOLBAR_PADDING_H}px`,
        background: colors.rowBg,
        borderBottom: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.sectionLine}`,
        fontFamily: FONT_FAMILY.base,
        color: colors.textPrimary,
        ...(style || {}),
      }}
    >
      <div style={slot({ flexShrink: 0 })}>{left}</div>
      <div style={slot({ flex: 1, justifyContent: 'center', overflow: 'hidden' })}>{center}</div>
      <div style={slot({ flexShrink: 0, justifyContent: 'flex-end' })}>{right}</div>
    </div>
  );
}

Object.assign(window, {
  GanttHeader, GanttTimeline, GanttBar,
  SortableRow, SectionDivider, LevelSwitcher, Toolbar,
});
