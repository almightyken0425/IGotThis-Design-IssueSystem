// ─────────────────────────────────────────────────────────────
// DevOrderScreen · 開發順序表
//
// 畫面角色：以主題單拖拉排序分配優先順序，並以甘特圖檢視各層級的工單排程。
// 首欄是主題單清單（已排序區在前、未排序區在後），次欄是甘特圖，兩欄逐列對齊。
//
// 對側 spec：no3_product_specs/no1_issue_system/no2_screens/no3_dev_order_screen.md
//
// 消費元件：
//   20_components/no3_gantt_nav.jsx
//     Toolbar        工具列容器，左中右三區
//     LevelSwitcher  顯示層級切換器（主題 / 需求 / 工項）
//     GanttHeader    月份帶 + 日期刻度帶，左 gutter 與清單欄同寬
//     GanttTimeline  時間軸背景：日 / 週 / 月格線、假日格、列分隔線
//     GanttBar       工單長條、工期數字、超期偏離段；空列亦由本元件承載
//     SortableRow    主題單列，含拖曳把手、拖曳中態、原位殘影、放置指示線
//     SectionDivider 已排序區與未排序區的分隔，含區塊標題與計數
//   20_components/no1_controls.jsx
//     Select         資料來源切換
//     Chip           日曆選用指示
//     IconButton     更多動作入口
//   20_components/no2_data_display.jsx
//     FilterNotice   權限過濾標示，無被濾工單時本元件自行不渲染
//     EmptyState     檢視內無主題單時的空狀態
//
// 本畫面自定義的區域性小元件全在 no2_subsections.jsx：
//   DevOrderSectionBand / DevOrderRowBand / DevOrderHeaderLeading /
//   DevOrderDragRow / DevOrderLegend
// 都是「把既有元件補成橫跨兩欄的一條帶」的組裝件，不承載新的視覺語彙。
//
// Variants：
//   default   第一層（主題）。已排序 6 筆、未排序 3 筆，權限濾除 3 筆
//   level2    切到第二層（需求）。IGT-4 與 IGT-6 於此層無內容，顯示為空列
//   dragging  拖拉排序中。未排序的 IGT-7 被抬起、原位留殘影、
//             已排序第三列上緣出現放置指示線、已排序區分隔提亮為可放置區界
//   unsorted  未排序區堆積。已排序只剩 2 筆、未排序 7 筆，且無被濾工單
//   empty     檢視內沒有任何主題單
//
// 尺寸：桌面瀏覽器 1280 寬為基準。八週的排程視窗在 1280 下放不完，
// 板內橫向捲軸承接其餘天數；左右兩欄同在捲動容器內，捲動時仍逐列對齊。
// ─────────────────────────────────────────────────────────────

// variant → 資料與狀態。畫面本體只讀本表，不在 JSX 內散落 variant 判斷。
const DEV_ORDER_VARIANTS = {
  default: {
    label: '第一層 · 主題',
    level: 'epic',
    sortedIds:   ['IGT-1', 'IGT-2', 'IGT-3', 'IGT-4', 'IGT-5', 'IGT-6'],
    unsortedIds: ['IGT-7', 'IGT-8', 'IGT-9'],
    selectedId:  'IGT-5',
    filteredCount: 3,
  },
  level2: {
    label: '第二層 · 需求（含空列）',
    level: 'story',
    sortedIds:   ['IGT-1', 'IGT-2', 'IGT-3', 'IGT-4', 'IGT-5', 'IGT-6'],
    unsortedIds: ['IGT-7', 'IGT-8', 'IGT-9'],
    selectedId:  'IGT-5',
    filteredCount: 3,
  },
  dragging: {
    label: '拖拉排序中',
    level: 'epic',
    sortedIds:   ['IGT-1', 'IGT-2', 'IGT-3', 'IGT-4', 'IGT-5', 'IGT-6'],
    unsortedIds: ['IGT-7', 'IGT-8', 'IGT-9'],
    filteredCount: 3,
    // 未排序的 IGT-7 正被拖往已排序區第三列之前。
    drag: { issueId: 'IGT-7', dropRowIndex: 2 },
  },
  unsorted: {
    label: '未排序區堆積',
    level: 'epic',
    sortedIds:   ['IGT-1', 'IGT-2'],
    unsortedIds: ['IGT-3', 'IGT-4', 'IGT-5', 'IGT-6', 'IGT-7', 'IGT-8', 'IGT-9'],
    filteredCount: 0,
  },
  empty: {
    label: '無主題單',
    level: 'epic',
    sortedIds: [],
    unsortedIds: [],
    filteredCount: 0,
    empty: true,
  },
};

// 供 canvas router 生成 artboard 用；順序即建議的並陳順序，
// 每個 id 的中文標籤取自 DEV_ORDER_VARIANTS[id].label。
const DEV_ORDER_SCREEN_VARIANTS = ['default', 'level2', 'dragging', 'unsorted', 'empty'];

function DevOrderScreen({ variant = 'default', theme = DEFAULT_THEME }) {
  const T = DEV_ORDER_SCREEN_TOKENS;
  const colors = resolveGanttColors(theme);
  const config = DEV_ORDER_VARIANTS[variant] || DEV_ORDER_VARIANTS.default;
  const density = T.DENSITY;
  const days = DEV_ORDER_DAYS;
  const listWidth = T.LIST_COLUMN_WIDTH;

  const [level, setLevel] = React.useState(config.level);
  const [source, setSource] = React.useState(DEV_ORDER_SOURCES[0].value);

  // 主題單清單恆定不變，切換層級只換甘特圖內容——故清單在此組一次，
  // level 只往下傳給 DevOrderRowBand 決定畫哪一層的長條。
  const decorate = (issue) => ({
    ...issue,
    selected: issue.id === config.selectedId,
    ghost: !!(config.drag && config.drag.issueId === issue.id),
  });
  const sortedRows = devOrderIssues(config.sortedIds).map(decorate).map((row, i) => (
    config.drag && i === config.drag.dropRowIndex ? { ...row, dropIndicator: 'above' } : row
  ));
  const unsortedRows = devOrderIssues(config.unsortedIds).map(decorate);
  const dragIssue = config.drag ? DEV_ORDER_ISSUE_BY_ID[config.drag.issueId] : null;

  const board = (
    <div style={{
      border: `${T.BOARD_BORDER_WIDTH}px solid ${colors.controlBorder}`,
      borderRadius: T.BOARD_RADIUS,
      overflow: 'hidden',
      background: colors.timelineBg,
    }}>
      {/* 橫向捲動容器包住標頭與兩欄本體，三者共用同一個捲動偏移才不會錯位 */}
      <div style={{ overflowX: 'auto' }}>
        <div style={{ width: 'max-content' }}>
          <GanttHeader
            theme={theme} days={days} density={density}
            leadingWidth={listWidth}
            leading={<DevOrderHeaderLeading theme={theme} calendarName={DEV_ORDER_CALENDAR_NAME} />}
          />

          <DevOrderSectionBand
            theme={theme} days={days} density={density} listWidth={listWidth}
            title="已排序" count={sortedRows.length}
            active={!!config.drag}
            hint={config.drag ? '放開即插入此區' : undefined}
          />
          <DevOrderRowBand
            theme={theme} days={days} density={density} listWidth={listWidth}
            rows={sortedRows} levelId={level}
            dragOverlay={dragIssue ? (
              <DevOrderDragRow
                theme={theme} density={density}
                issue={dragIssue} rowIndex={config.drag.dropRowIndex}
              />
            ) : null}
          />

          <DevOrderSectionBand
            theme={theme} days={days} density={density} listWidth={listWidth}
            title="未排序" count={unsortedRows.length} hint="拖入上方即排序"
          />
          {/* 未排序的主題單尚未排入順序，甘特側只留格線與假日底 */}
          <DevOrderRowBand
            theme={theme} days={days} density={density} listWidth={listWidth}
            rows={unsortedRows} levelId={level} showBars={false}
          />
        </div>
      </div>

      <DevOrderLegend theme={theme} calendarName={DEV_ORDER_CALENDAR_NAME} />
    </div>
  );

  const empty = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: T.EMPTY_MIN_HEIGHT,
      border: `${T.BOARD_BORDER_WIDTH}px solid ${colors.controlBorder}`,
      borderRadius: T.BOARD_RADIUS,
      background: colors.rowBg,
    }}>
      <EmptyState
        theme={theme}
        title="此檢視沒有主題單"
        description="換一個資料來源，或先在清單畫面建立主題單。"
        action={{ label: '新增主題單', icon: 'plus', onClick: () => {} }}
      />
    </div>
  );

  return (
    <div style={{
      width: '100%', minHeight: T.FRAME_MIN_HEIGHT,
      display: 'flex', flexDirection: 'column',
      background: theme.bg.base,
      color: theme.text.primary,
      fontFamily: FONT_FAMILY.base,
    }}>
      <Toolbar
        theme={theme}
        left={
          <React.Fragment>
            <Select
              theme={theme} size="sm" prefix="資料來源"
              options={DEV_ORDER_SOURCES} value={source} onChange={setSource}
            />
            <span style={{
              ...devOrderType(TYPE_STYLES.caption),
              color: colors.textTertiary,
              fontVariantNumeric: NUMERIC_FONT_VARIANT,
              whiteSpace: 'nowrap',
            }}>
              {devOrderRangeLabel(days)}
            </span>
          </React.Fragment>
        }
        center={
          <LevelSwitcher theme={theme} levels={DEV_ORDER_LEVELS} value={level} onChange={setLevel} />
        }
        right={
          <React.Fragment>
            <Chip theme={theme} label="日曆" value={DEV_ORDER_CALENDAR_NAME} onClick={() => {}} />
            <IconButton theme={theme} icon="dots" title="更多動作" />
          </React.Fragment>
        }
      />

      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: T.BODY_GAP,
        padding: T.BODY_PADDING,
      }}>
        {/* 權限過濾標示：count 為 0 時 FilterNotice 自行不渲染，對應 spec 的不顯示本區 */}
        <FilterNotice theme={theme} count={config.filteredCount} reason="無讀取權的專案" />
        {config.empty ? empty : board}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Canvas section · Screens > DevOrderScreen
// 五個 variant × 兩主題共十張 artboard，皆為 live JSX。
// variant 不另佔 TOC leaf：同一 section 內以 family 分群並陳；
// 顯示層級由畫面自身的 LevelSwitcher 現場切換，不為層級開 artboard。
// artboard 寬取 FRAME_WIDTH，甘特超出的天數由板內橫向捲軸承接。
// ─────────────────────────────────────────────────────────────
function ScreenDevOrderSection() {
  const W = DEV_ORDER_SCREEN_TOKENS.FRAME_WIDTH;
  return (
    <DCSection
      id="screen-dev-order"
      title="DevOrderScreen · 開發順序表"
      subtitle="對側 spec：no2_screens/no3_dev_order_screen.md。左欄主題單拖拉排序、右欄甘特排程，兩欄只吃同一個 density，列高同源故逐列對齊。"
    >
      <DCFamily
        id="do-levels" title="Levels"
        subtitle="default 為第一層主題。level2 切到需求層，IGT-4 與 IGT-6 於此層無內容、顯示為空列。兩張都可用工具列中段的 LevelSwitcher 現場換層。"
      >
        <DCArtboard id="do-default-light" label="default · THEME_LIGHT (live · 可切層級)" width={W} height="auto">
          <DevOrderScreen variant="default" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="do-default-dark" label="default · THEME_DARK (live · 可切層級)" width={W} height="auto">
          <DevOrderScreen variant="default" theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="do-level2-light" label="level2 · THEME_LIGHT (live)" width={W} height="auto">
          <DevOrderScreen variant="level2" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="do-level2-dark" label="level2 · THEME_DARK (live)" width={W} height="auto">
          <DevOrderScreen variant="level2" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="do-drag" title="Dragging"
        subtitle="未排序的 IGT-7 被抬起：原位留殘影、已排序第三列上緣出現放置指示線、已排序區的分隔提亮為可放置區界。"
      >
        <DCArtboard id="do-dragging-light" label="dragging · THEME_LIGHT (live)" width={W} height="auto">
          <DevOrderScreen variant="dragging" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="do-dragging-dark" label="dragging · THEME_DARK (live)" width={W} height="auto">
          <DevOrderScreen variant="dragging" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="do-boundary" title="Boundary"
        subtitle="unsorted 為未排序區堆積，已排序只剩 2 筆且無被濾工單、權限過濾標示不顯示。empty 為檢視內沒有任何主題單，整塊板換成空狀態。"
      >
        <DCArtboard id="do-unsorted-light" label="unsorted · THEME_LIGHT (live)" width={W} height="auto">
          <DevOrderScreen variant="unsorted" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="do-unsorted-dark" label="unsorted · THEME_DARK (live)" width={W} height="auto">
          <DevOrderScreen variant="unsorted" theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="do-empty-light" label="empty · THEME_LIGHT (live)" width={W} height="auto">
          <DevOrderScreen variant="empty" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="do-empty-dark" label="empty · THEME_DARK (live)" width={W} height="auto">
          <DevOrderScreen variant="empty" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  DevOrderScreen, ScreenDevOrderSection,
  DEV_ORDER_VARIANTS, DEV_ORDER_SCREEN_VARIANTS,
});
