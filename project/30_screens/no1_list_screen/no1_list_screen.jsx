// ─────────────────────────────────────────────────────────────
// ListScreen · 清單表格畫面
//
// 角色：工單系統的主檢視。一列一張工單攤在表格上，工具列承載
// 資料來源、篩選、排序依據、分組依據與欄位顯示設定五個入口；
// 被權限濾除的工單以標示列交代筆數與原因，不靜默消失。
//
// 對側 spec：no3_product_specs/no1_issue_system/no2_screens/no1_list_screen.md
//   佈局三段（檢視工具列 / 權限過濾標示 / 工單表格）與互動三條
//   （選擇排序依據 / 選擇分組依據 / 調整欄位顯示設定）逐條對位。
//
// 消費元件：
//   20_components/no3_gantt_nav.jsx — Toolbar（工具列容器，左右兩區）
//   20_components/no1_controls.jsx  — Select（資料來源 / 排序 / 分組）、
//                                     Button（篩選）、IconButton（欄位顯示設定）、
//                                     Chip（已套用的篩選條件）
//   20_components/no2_data_display.jsx — DataTable（欄位標題列 + 工單列 + 分組列）、
//                                     FilterNotice（權限過濾標示）、EmptyState（無工單）
//   Badge / Avatar 由 DataTable 的 status 與 user 兩型儲存格內部取用，本檔不直接呼叫。
//
// Variants：
//   default  — 11 筆工單、不分組，排序依到期日
//   empty    — 篩選條件套下去後無工單，表格區改出 EmptyState
//   filtered — 6 筆可見 + 權限濾除 5 筆的標示列
//   grouped  — 依狀態分組展開，分組標題列吃狀態欄的值
//
// 兩條硬規（與元件檔同源）：
//   1. 一切視覺值引用 token。幾何走 LIST_SCREEN_TOKENS（其值全數由 SPACING /
//      RADIUS / TYPE_STYLES / CONTROL_HEIGHT / ICON_SIZE 階梯組出），色彩走傳入的
//      theme 物件。本檔無 hex、無未標註的裸數字
//   2. 畫面吃 theme 參數（預設 DEFAULT_THEME），THEME_LIGHT 與 THEME_DARK 同一份
//      JSX 都能渲染；畫面自身不讀 theme.id、不做主題分支
//
// 排序在本檔實作：DataTable 只負責標題列的排序指示與回呼，實際重排工單列
// 屬畫面職責（spec 互動「工單列依該欄位的值重新排列」）。排序與分組皆為
// 當次瀏覽狀態，存在 React state、不寫回檢視設定。
// ─────────────────────────────────────────────────────────────

// ─── Screen 級 token ─────────────────────────────────────────
// 欄寬對應檢視的 columnConfig，此處給的是設計基準值；
// 標題欄不給寬、由 DataTable 吃 COLUMN_MIN_WIDTH 的 1fr 撐滿剩餘空間。
const LIST_SCREEN_TOKENS = {
  BASE_WIDTH:             1280,                    // (literal: 桌面瀏覽器基準寬，artboard 同寬)
  CONTENT_PADDING_X:      SPACING.xl,              // 24
  CONTENT_PADDING_Y:      SPACING.lg,              // 16
  SECTION_GAP:            SPACING.md,              // 12，工具列下三段的垂直間距
  VIEW_TITLE_TYPE:        TYPE_STYLES.sectionTitle,
  VIEW_META_TYPE:         TYPE_STYLES.caption,
  TOOLBAR_DIVIDER_HEIGHT: ICON_SIZE.lg,            // 20，檢視名稱與資料來源之間的細分隔
  TOOLBAR_DIVIDER_WIDTH:  BORDER_WIDTH.hairline,
  CHIP_BAR_GAP:           SPACING.sm,              // 8
  CHIP_BAR_MIN_HEIGHT:    CONTROL_HEIGHT.sm,       // 24，條件列空著也不塌陷
  TABLE_DENSITY:          'base',
  COLUMN_WIDTH: {
    key:      SPACING.xl * 5,                      // 120，容得下 mono 的 IGT-1042
    status:   SPACING.lg * 7,                      // 112，四字狀態 badge 加排序指示
    assignee: SPACING.xl * 6,                      // 144，avatar 24 加三字姓名
    point:    SPACING['3xl'] * 2,                  // 80，右對齊數字欄下界
    due:      SPACING.lg * 7,                      // 112
  },
};

// ─── 檢視設定與資料（擬真 fixture）──────────────────────────
// sourceMgmtIds / filterConfig / columnConfig 三組在 impl 端來自檢視實體，
// canvas 以固定值代替，形狀對齊 spec 對這三者的引用方式。

const LIST_SCREEN_SOURCES = [
  { value: 'all', label: '全部來源' },
  { value: 'igt', label: 'IGotThis 工單系統' },
  { value: 'ssg', label: 'SuSuGiGi 記帳 App' },
];

// 狀態值集合。tone 決定 Badge 色彩身份，sortKey 給排序與分組一個流程順序，
// 不讓「已完成」排在「待處理」前面（字典序會）。
const LIST_SCREEN_STATUS = {
  todo:     { label: '待處理', tone: 'neutral', sortKey: 1 },
  doing:    { label: '處理中', tone: 'info',    sortKey: 2 },
  review:   { label: '審查中', tone: 'warning', sortKey: 3 },
  blocked:  { label: '已阻塞', tone: 'error',   sortKey: 4 },
  done:     { label: '已完成', tone: 'success', sortKey: 5 },
  archived: { label: '已封存', tone: 'neutral', sortKey: 6 },
};

// 到期日：label 給人看、sortKey 給排序、tone 交給日期格決定要不要轉逾期色。
const LS_due = (label, sortKey, tone) => ({ label, sortKey, tone });

const LIST_SCREEN_ROWS = [
  { id: 'IGT-1042', restricted: false, cells: {
    key: 'IGT-1042', title: '匯率換算在跨月結轉時取到舊值',
    status: LIST_SCREEN_STATUS.doing, assignee: '陳彥廷', point: 3,
    due: LS_due('08/07', '2026-08-07', 'soon') } },
  { id: 'IGT-1041', restricted: false, cells: {
    key: 'IGT-1041', title: 'CSV 匯入的欄位對應精靈',
    status: LIST_SCREEN_STATUS.todo, assignee: '林巧薇', point: 5,
    due: LS_due('08/14', '2026-08-14') } },
  { id: 'IGT-1038', restricted: false, cells: {
    key: 'IGT-1038', title: '工單編號產生器支援多前綴',
    status: LIST_SCREEN_STATUS.review, assignee: '王世昌', point: 2,
    due: LS_due('08/03', '2026-08-03', 'overdue') } },
  { id: 'IGT-1035', restricted: false, cells: {
    key: 'IGT-1035', title: '看板欄拖曳後狀態未同步回工單',
    status: LIST_SCREEN_STATUS.doing, assignee: '陳彥廷', point: 2,
    due: LS_due('08/11', '2026-08-11') } },
  { id: 'IGT-1030', restricted: true, cells: {
    key: 'IGT-1030', title: '權限矩陣改為以角色繼承',
    status: LIST_SCREEN_STATUS.todo, assignee: '黃佩瑜', point: 8,
    due: LS_due('08/28', '2026-08-28') } },
  { id: 'IGT-1028', restricted: true, cells: {
    key: 'IGT-1028', title: '開發順序表的甘特超期標示',
    status: LIST_SCREEN_STATUS.done, assignee: '王世昌', point: 3,
    due: LS_due('07/31', '2026-07-31') } },
  { id: 'IGT-1024', restricted: false, cells: {
    key: 'IGT-1024', title: '工單附件上傳逾時後無重試入口',
    status: LIST_SCREEN_STATUS.blocked, assignee: '林巧薇', point: 1,
    due: LS_due('08/05', '2026-08-05', 'overdue') } },
  { id: 'IGT-1019', restricted: false, cells: {
    key: 'IGT-1019', title: '檢視的欄位顯示設定未持久化',
    status: LIST_SCREEN_STATUS.review, assignee: '蘇玠丞', point: 2,
    due: LS_due('08/12', '2026-08-12') } },
  { id: 'IGT-1015', restricted: true, cells: {
    key: 'IGT-1015', title: '日曆設定支援自訂假日',
    status: LIST_SCREEN_STATUS.todo, assignee: '黃佩瑜', point: 5,
    due: LS_due('09/04', '2026-09-04') } },
  { id: 'IGT-1009', restricted: true, cells: {
    key: 'IGT-1009', title: '彙總計算在禁環檢查後重算',
    status: LIST_SCREEN_STATUS.done, assignee: '蘇玠丞', point: 8,
    due: LS_due('07/24', '2026-07-24') } },
  { id: 'IGT-1003', restricted: true, cells: {
    key: 'IGT-1003', title: '建立工單時帶入預設負責人',
    status: LIST_SCREEN_STATUS.archived, assignee: '', point: 1,
    due: null } },
];

// columnConfig：顯示哪幾欄、欄的先後、欄寬。欄標題顯示欄位定義的 label。
const LIST_SCREEN_COLUMNS = [
  { key: 'key',      label: '編號',    type: 'key',    width: LIST_SCREEN_TOKENS.COLUMN_WIDTH.key,      sortable: true },
  { key: 'title',    label: '標題',    type: 'text',   sortable: true },
  { key: 'status',   label: '狀態',    type: 'status', width: LIST_SCREEN_TOKENS.COLUMN_WIDTH.status,   sortable: true },
  { key: 'assignee', label: '負責人',  type: 'user',   width: LIST_SCREEN_TOKENS.COLUMN_WIDTH.assignee, sortable: true },
  { key: 'point',    label: '點數',    type: 'number', width: LIST_SCREEN_TOKENS.COLUMN_WIDTH.point,    sortable: true, align: 'right' },
  { key: 'due',      label: '到期日',  type: 'date',   width: LIST_SCREEN_TOKENS.COLUMN_WIDTH.due,      sortable: true },
];

// 排序依據與分組依據皆為「任一欄位皆可選」，故選項由 columnConfig 推導，
// 不另維護一份清單；分組另多一條「不分組」。
const LIST_SCREEN_SORT_OPTIONS = LIST_SCREEN_COLUMNS.map((c) => ({ value: c.key, label: c.label }));
const LIST_SCREEN_GROUP_OPTIONS = [{ value: 'none', label: '不分組' }, ...LIST_SCREEN_SORT_OPTIONS];

// 已套用的篩選條件（filterConfig 的視覺投影）。canvas 內為唯讀標籤：
// 條件本身要改走「篩選」入口，spec 的互動清單沒有「在條件列上直接移除」。
const LIST_SCREEN_FILTERS = {
  base:  [{ label: '狀態', value: '未結案' }, { label: '日曆', value: '2026 Q3' }],
  empty: [{ label: '狀態', value: '已完成' }, { label: '負責人', value: '黃佩瑜' }],
};

// 各 variant 的起始狀態。rows 已是 applyViewFilter 與 filterViewByPermission
// 的產出（畫面不自己算篩選與權限），filteredCount 為被權限濾掉的筆數。
const LIST_SCREEN_VARIANTS = {
  default: {
    viewName: '本季進行中', rows: LIST_SCREEN_ROWS,
    filters: LIST_SCREEN_FILTERS.base, filteredCount: 0,
    sort: { key: 'due', direction: 'asc' }, groupBy: 'none',
  },
  empty: {
    viewName: '我的已完成', rows: [],
    filters: LIST_SCREEN_FILTERS.empty, filteredCount: 0,
    sort: { key: 'due', direction: 'asc' }, groupBy: 'none',
  },
  filtered: {
    viewName: '本季進行中', rows: LIST_SCREEN_ROWS.filter((r) => !r.restricted),
    filters: LIST_SCREEN_FILTERS.base,
    filteredCount: LIST_SCREEN_ROWS.filter((r) => r.restricted).length,
    sort: { key: 'due', direction: 'asc' }, groupBy: 'none',
  },
  grouped: {
    viewName: '本季進行中', rows: LIST_SCREEN_ROWS,
    filters: LIST_SCREEN_FILTERS.base, filteredCount: 0,
    sort: { key: 'status', direction: 'asc' }, groupBy: 'status',
  },
};

// ─── 內部工具（LS_ 前綴避免與其他畫面 / 元件檔的全域名稱相撞）───

function LS_type(t) {
  return {
    fontSize:      t.size,
    fontWeight:    t.weight,
    lineHeight:    `${t.lineHeight}px`,
    letterSpacing: t.letterSpacing,
  };
}

// 儲存格值 → 可比較的純量。物件型的格（status / due）優先吃 sortKey，
// 沒有就退回 label；空值一律回 null，由 LS_sortRows 恆置底。
function LS_sortValue(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'object') return raw.sortKey !== undefined ? raw.sortKey : (raw.label || null);
  return raw;
}

function LS_compare(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'zh-Hant');
}

// 空值不隨升降序翻面：未指派、無到期日永遠沉在最後，換序時不會冒到頂端。
function LS_sortRows(rows, sort) {
  if (!sort || !sort.key) return rows;
  const dir = sort.direction === 'desc' ? -1 : 1;
  return rows.slice().sort((ra, rb) => {
    const va = LS_sortValue(ra.cells[sort.key]);
    const vb = LS_sortValue(rb.cells[sort.key]);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return LS_compare(va, vb) * dir;
  });
}

// ─── LS_ViewTitle ─── 工具列最左的檢視名稱 + 筆數
// 區域性小元件：工具列左區要「名稱在上、筆數在下」的兩行塊，
// 現有元件組沒有對應件，且只有本畫面用得到，故留在畫面檔內。
function LS_ViewTitle({ theme, name, count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <span style={{ ...LS_type(LIST_SCREEN_TOKENS.VIEW_TITLE_TYPE), color: theme.text.primary, whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <span style={{
        ...LS_type(LIST_SCREEN_TOKENS.VIEW_META_TYPE),
        color: theme.text.tertiary,
        fontVariantNumeric: NUMERIC_FONT_VARIANT,
        whiteSpace: 'nowrap',
      }}>
        {`${count} 筆工單`}
      </span>
    </div>
  );
}

// 工具列內的細直線，分開「檢視身份」與「資料來源」兩件事。
function LS_ToolbarDivider({ theme }) {
  return (
    <span style={{
      width: LIST_SCREEN_TOKENS.TOOLBAR_DIVIDER_WIDTH,
      height: LIST_SCREEN_TOKENS.TOOLBAR_DIVIDER_HEIGHT,
      background: theme.divider.base,
      flexShrink: 0,
    }} />
  );
}

// ─── LS_FilterChipBar ─── 已套用篩選條件列
// 區域性小元件：Chip 是單顆標籤，成列排放與「共 N 條」的說明沒有現成容器。
// 條件為空時不渲染本列。
function LS_FilterChipBar({ theme, filters = [] }) {
  if (filters.length === 0) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: LIST_SCREEN_TOKENS.CHIP_BAR_GAP,
      minHeight: LIST_SCREEN_TOKENS.CHIP_BAR_MIN_HEIGHT,
    }}>
      <span style={{ ...LS_type(LIST_SCREEN_TOKENS.VIEW_META_TYPE), color: theme.text.tertiary, whiteSpace: 'nowrap' }}>
        已套用篩選
      </span>
      {filters.map((f) => (
        <Chip key={`${f.label}-${f.value}`} theme={theme} label={f.label} value={f.value} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ListScreen · 畫面主元件
//
// props:
//   variant  'default' | 'empty' | 'filtered' | 'grouped'
//   theme    THEME_LIGHT | THEME_DARK（預設 DEFAULT_THEME）
// ─────────────────────────────────────────────────────────────
function ListScreen({ variant = 'default', theme = DEFAULT_THEME }) {
  const T = LIST_SCREEN_TOKENS;
  const config = LIST_SCREEN_VARIANTS[variant] || LIST_SCREEN_VARIANTS.default;

  // 當次瀏覽狀態：排序依據、分組依據、資料來源、選取列與欄位設定面板開合。
  // 四者都不持久化，換 variant 等同換一次瀏覽。
  const [sort, setSort] = React.useState(config.sort);
  const [groupBy, setGroupBy] = React.useState(config.groupBy);
  const [source, setSource] = React.useState('all');
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [columnPanelOpen, setColumnPanelOpen] = React.useState(false);

  const rows = React.useMemo(() => LS_sortRows(config.rows, sort), [config.rows, sort]);

  const toolbarLeft = (
    <React.Fragment>
      <LS_ViewTitle theme={theme} name={config.viewName} count={config.rows.length} />
      <LS_ToolbarDivider theme={theme} />
      <Select
        theme={theme} prefix="資料來源" options={LIST_SCREEN_SOURCES}
        value={source} onChange={setSource}
      />
    </React.Fragment>
  );

  const toolbarRight = (
    <React.Fragment>
      <Button theme={theme} variant="secondary" iconLeft="filter" label="篩選" />
      <Select
        theme={theme} prefix="排序" options={LIST_SCREEN_SORT_OPTIONS}
        value={sort.key}
        onChange={(key) => setSort({ key, direction: 'asc' })}
      />
      <Select
        theme={theme} prefix="分組" options={LIST_SCREEN_GROUP_OPTIONS}
        value={groupBy} onChange={setGroupBy}
      />
      <IconButton
        theme={theme} icon="columns" title="欄位顯示設定"
        active={columnPanelOpen} onClick={() => setColumnPanelOpen((o) => !o)}
      />
    </React.Fragment>
  );

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      background: theme.bg.base,
      color: theme.text.primary,
      fontFamily: FONT_FAMILY.base,
    }}>
      {/* 檢視工具列 */}
      <Toolbar theme={theme} left={toolbarLeft} right={toolbarRight} />

      <div style={{
        display: 'flex', flexDirection: 'column', gap: T.SECTION_GAP,
        padding: `${T.CONTENT_PADDING_Y}px ${T.CONTENT_PADDING_X}px`,
      }}>
        <LS_FilterChipBar theme={theme} filters={config.filters} />

        {/* 權限過濾標示：count 為 0 時 FilterNotice 自身不渲染 */}
        <FilterNotice theme={theme} count={config.filteredCount} reason="無讀取權" tone="info" />

        {/* 工單表格 */}
        <DataTable
          theme={theme}
          columns={LIST_SCREEN_COLUMNS}
          rows={rows}
          density={T.TABLE_DENSITY}
          sort={sort}
          onSortChange={setSort}
          groupBy={groupBy === 'none' ? undefined : groupBy}
          selectedIds={selectedIds}
          onRowSelect={(row) => setSelectedIds((ids) => (ids.indexOf(row.id) === -1 ? [row.id] : []))}
          emptyState={
            <EmptyState
              theme={theme}
              title="沒有符合條件的工單"
              description="這個檢視的篩選條件目前沒有命中任何工單。放寬條件、換個資料來源，或直接建立一張。"
              action={{ label: '建立工單', icon: 'plus' }}
            />
          }
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Canvas section · Screens > ListScreen
// 四個 variant × 兩主題共八張 artboard，皆為 live JSX。
// dark 卡直接畫在 THEME_DARK.bg.base 上，不靠 canvas 白底掩護。
// ─────────────────────────────────────────────────────────────
function ScreenListSection() {
  const W = LIST_SCREEN_TOKENS.BASE_WIDTH;
  return (
    <DCSection
      id="screen-list"
      title="ListScreen · 清單表格"
      subtitle="對側 spec：no2_screens/no1_list_screen.md。工具列五個入口、權限過濾標示、工單表格三段；排序與分組為當次瀏覽狀態。"
    >
      <DCFamily
        id="ls-standard" title="Default"
        subtitle="11 筆工單、不分組，依到期日升冪。點欄位標題可換排序依據、點列可選取。"
      >
        <DCArtboard id="ls-default-light" label="default · THEME_LIGHT (live)" width={W} height="auto">
          <ListScreen variant="default" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ls-default-dark" label="default · THEME_DARK (live)" width={W} height="auto">
          <ListScreen variant="default" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="ls-grouped" title="Grouped"
        subtitle="分組依據選狀態。分組標題列顯示狀態欄的值與該組筆數，工單列縮排一階；組序跟著狀態的流程順序、不是字典序。"
      >
        <DCArtboard id="ls-grouped-light" label="grouped · THEME_LIGHT (live)" width={W} height="auto">
          <ListScreen variant="grouped" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ls-grouped-dark" label="grouped · THEME_DARK (live)" width={W} height="auto">
          <ListScreen variant="grouped" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="ls-boundary" title="Boundary"
        subtitle="empty 為條件命中零筆，表格區換成 EmptyState；filtered 為權限濾除 5 筆，標示列補上筆數與原因。"
      >
        <DCArtboard id="ls-empty-light" label="empty · THEME_LIGHT (live)" width={W} height="auto">
          <ListScreen variant="empty" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ls-empty-dark" label="empty · THEME_DARK (live)" width={W} height="auto">
          <ListScreen variant="empty" theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ls-filtered-light" label="filtered · THEME_LIGHT (live)" width={W} height="auto">
          <ListScreen variant="filtered" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ls-filtered-dark" label="filtered · THEME_DARK (live)" width={W} height="auto">
          <ListScreen variant="filtered" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  LIST_SCREEN_TOKENS,
  LIST_SCREEN_SOURCES, LIST_SCREEN_STATUS, LIST_SCREEN_ROWS,
  LIST_SCREEN_COLUMNS, LIST_SCREEN_SORT_OPTIONS, LIST_SCREEN_GROUP_OPTIONS,
  LIST_SCREEN_FILTERS, LIST_SCREEN_VARIANTS,
  ListScreen, ScreenListSection,
});
