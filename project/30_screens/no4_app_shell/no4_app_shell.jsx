// ─────────────────────────────────────────────────────────────
// AppShell · 應用外殼
//
// 角色：三個工作檢視共用的外框。左側直欄由上而下四段——品牌、當前檢視、
// 畫面形態導覽、帳號；右側是內容區，掛當前形態的畫面。
//
// 存在理由：檢視選擇是跨畫面的狀態，不屬於任一畫面。放進外殼後，
// 切換畫面形態不會丟失當前檢視，選檢視也不必在三個畫面各做一次。
//
// 對側 spec：no3_product_specs/no1_issue_system/no2_screens/no4_app_shell.md
//   佈局五段（品牌 / 當前檢視 / 畫面形態導覽 / 帳號 / 內容）與互動全條逐條對位，
//   含新增檢視表單展開 / 收合、日曆選用、帳號預設日曆設定。
//   當前檢視不隨畫面形態變動，規則本體在 ViewLogic / selectCurrentView；
//   日曆解析規則在 ViewLogic / resolveViewCalendar，本畫面只負責選用與設定入口。
//
// 消費元件：
//   20_components/no1_controls.jsx — Select（檢視選擇 / 新增檢視表單三層與日曆 / 帳號預設日曆）、
//     TextInput（新增檢視表單的檢視名稱）、Button（新增檢視 / 建立 / 取消 / 主題 / 登出）
//   20_components/no2_data_display.jsx — EmptyState（無檢視時的內容區）
//   導覽項與新增檢視表單不抽元件：只有外殼用得到，抽出去會是只有一個消費端的空殼層。
//
// Variants：
//   default   — 三張檢視、當前為開發總表、形態停在清單表格
//   empty     — 名下無任何檢視，選擇器收起、內容區出 EmptyState
//   dev-order — 當前形態切到開發順序表，示意選取態隨形態走、檢視不變
//   add-view  — 新增檢視表單展開，示意檢視名稱、資料來源三層、日曆選用與建立 / 取消
//
// 兩條硬規（與元件檔同源）：
//   1. 一切視覺值引用 token。幾何走 APP_SHELL_TOKENS（其值全數由 SPACING /
//      RADIUS / TYPE_STYLES / CONTROL_HEIGHT / BORDER_WIDTH / MOTION 階梯組出），
//      色彩走傳入的 theme 物件。本檔無 hex、無未標註的裸數字
//   2. 畫面吃 theme 參數（預設 DEFAULT_THEME），THEME_LIGHT 與 THEME_DARK 同一份
//      JSX 都能渲染；畫面自身不讀 theme.id、不做主題分支
// ─────────────────────────────────────────────────────────────

// ─── Screen 級 token ─────────────────────────────────────────
const APP_SHELL_TOKENS = {
  BASE_WIDTH:  1280,                       // (literal: 桌面瀏覽器基準寬，與其餘畫面同寬)
  BASE_HEIGHT: 720,                        // (literal: 外殼要看滿版比例，故給定高)

  SIDEBAR_WIDTH:        SPACING['3xl'] * 5,  // 200
  SIDEBAR_PADDING:      SPACING.md,          // 12
  SIDEBAR_GAP:          SPACING.lg,          // 16
  SIDEBAR_BORDER_WIDTH: BORDER_WIDTH.hairline,

  BRAND_TYPE:      TYPE_STYLES.sectionTitle,
  BRAND_META_TYPE: TYPE_STYLES.caption,
  BRAND_GAP:       SPACING['2xs'],           // 4

  GROUP_TYPE:    TYPE_STYLES.overline,
  GROUP_GAP:     SPACING.sm,                 // 8，區標題與其內容的距離
  SECTION_GAP:   SPACING['2xs'],             // 4，同區內各列的距離

  NAV_ITEM_HEIGHT:    CONTROL_HEIGHT.lg,     // 32
  NAV_ITEM_PADDING_X: SPACING.sm,            // 8
  NAV_ITEM_GAP:       SPACING.sm,            // 8
  NAV_ITEM_RADIUS:    RADIUS.sm,
  NAV_ITEM_TYPE:      TYPE_STYLES.bodySm,
  /** 選取態的左側指示條，與表格選取列同一個語彙。 */
  NAV_ACCENT_WIDTH:  BORDER_WIDTH.focus,
  NAV_ACCENT_HEIGHT: SPACING.lg,             // 16

  CONTENT_PADDING: SPACING.xl,               // 24
  /** 內容區佔位條，示意畫面掛載處，非實際畫面內容。 */
  PLACEHOLDER_RADIUS:     RADIUS.md,
  PLACEHOLDER_BORDER:     BORDER_WIDTH.hairline,
  PLACEHOLDER_LABEL_TYPE: TYPE_STYLES.caption,

  /** 新增檢視表單：行內展開於當前檢視區，子區塊底比照 toolbar 用 surface_dim。 */
  ADD_FORM_GAP:     SPACING.xs,               // 4，表單內欄位間距
  ADD_FORM_PADDING: SPACING.sm,               // 8
  ADD_FORM_RADIUS:  RADIUS.sm,

  TRANSITION_MS:     MOTION.duration.instant,
  TRANSITION_EASING: MOTION.easing.standard,
};

const A = APP_SHELL_TOKENS;

// ─── 擬真 fixture ────────────────────────────────────────────
// impl 端檢視清單來自當前帳號名下的檢視，canvas 以固定值代替。

const APP_SHELL_VIEWS = [
  { value: 'dev-all', label: '開發總表' },
  { value: 'igt',     label: 'IGotThis 工單' },
  { value: 'ssg',     label: 'SuSuGiGi 記帳' },
];

// 畫面形態三項，與 SCREEN_GROUPS 的 Work Views 對應。
const APP_SHELL_MODES = [
  { id: 'list',      label: '工單清單' },
  { id: 'kanban',    label: '工單看板' },
  { id: 'dev-order', label: '開發順序表' },
];

const APP_SHELL_ACCOUNT = '成員甲';

// 新增檢視表單：資料來源三層與日曆選用的假清單，canvas 示意逐層收窄用。
// impl 端清單來自容器樹與日曆定義查詢，canvas 以固定值代替。
const APP_SHELL_TEAMS    = [{ value: 'team-core', label: 'Core' }, { value: 'team-growth', label: 'Growth' }];
const APP_SHELL_PRODUCTS = [{ value: 'prod-igt', label: 'IGotThis' }, { value: 'prod-ssg', label: 'SuSuGiGi' }];
const APP_SHELL_MGMTS    = [{ value: 'mgmt-web', label: 'Web' }, { value: 'mgmt-ios', label: 'iOS' }];
const APP_SHELL_CALENDARS = [{ value: 'tw', label: '台灣' }, { value: 'us', label: '美國' }];
const APP_SHELL_DEFAULT_CALENDAR = 'tw';

const APP_SHELL_VARIANTS = {
  default:     { views: APP_SHELL_VIEWS, currentView: 'dev-all', mode: 'list' },
  empty:       { views: [],              currentView: null,      mode: 'list' },
  'dev-order': { views: APP_SHELL_VIEWS, currentView: 'dev-all', mode: 'dev-order' },
  'add-view':  { views: APP_SHELL_VIEWS, currentView: 'dev-all', mode: 'list', addFormOpen: true },
};

// ─── 內部工具（AS_ 前綴避免與其他畫面 / 元件檔的全域名稱相撞）───

function AS_type(t) {
  return {
    fontSize:      t.size,
    fontWeight:    t.weight,
    lineHeight:    `${t.lineHeight}px`,
    letterSpacing: t.letterSpacing,
  };
}

// ─── 導覽項 ──────────────────────────────────────────────────

function AppShellNavItem({ theme, label, active, onClick }) {
  const [hover, setHover] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: A.NAV_ITEM_GAP,
        height: A.NAV_ITEM_HEIGHT,
        padding: `0 ${A.NAV_ITEM_PADDING_X}px`,
        border: 'none',
        borderRadius: A.NAV_ITEM_RADIUS,
        cursor: 'pointer',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        background: active
          ? theme.state.selected.bg
          : hover
            ? theme.state.hover.bg
            : 'transparent',
        color: active ? theme.state.selected.fg : theme.text.secondary,
        fontFamily: FONT_FAMILY.base,
        ...AS_type(A.NAV_ITEM_TYPE),
        fontWeight: active ? TYPE_STYLES.bodyMedium.weight : A.NAV_ITEM_TYPE.weight,
        transition: `background ${A.TRANSITION_MS}ms ${A.TRANSITION_EASING}`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: A.NAV_ACCENT_WIDTH,
          height: A.NAV_ACCENT_HEIGHT,
          flexShrink: 0,
          borderRadius: RADIUS.full,
          background: active ? theme.state.selected.border : 'transparent',
        }}
      />
      {label}
    </button>
  );
}

// ─── 區標題 ──────────────────────────────────────────────────

function AppShellGroupLabel({ theme, children }) {
  return (
    <span
      style={{
        fontFamily: FONT_FAMILY.base,
        ...AS_type(A.GROUP_TYPE),
        color: theme.text.tertiary,
        padding: `0 ${A.NAV_ITEM_PADDING_X}px`,
      }}
    >
      {children}
    </span>
  );
}

// ─── 新增檢視表單 ────────────────────────────────────────────
// 行內展開於「當前檢視」區塊內，取代新增檢視入口。
// 對側 spec：no4_app_shell.md「新增檢視表單」——檢視名稱、資料來源的組織範圍
// （Team/Product/Mgmt 逐層選擇，選到哪層即該層為範圍）、日曆選用（留白跟隨帳號預設）。

function AppShellAddViewForm({ theme, onCancel, onCreate }) {
  const [name, setName] = React.useState('');
  const [teamId, setTeamId] = React.useState(undefined);
  const [productId, setProductId] = React.useState(undefined);
  const [mgmtId, setMgmtId] = React.useState(undefined);
  const [calendarName, setCalendarName] = React.useState(undefined);

  // 換上層選擇時下層失效，比照容器樹「僅屬一個上層」的嚴格歸屬。
  const onTeamChange = (id) => { setTeamId(id); setProductId(undefined); setMgmtId(undefined); };
  const onProductChange = (id) => { setProductId(id); setMgmtId(undefined); };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: A.ADD_FORM_GAP,
        padding: A.ADD_FORM_PADDING,
        borderRadius: A.ADD_FORM_RADIUS,
        background: theme.bg.surface_dim,
      }}
    >
      <TextInput theme={theme} size="sm" placeholder="檢視名稱" value={name} onChange={setName} fullWidth />
      <Select
        theme={theme} size="sm" prefix="Team" options={APP_SHELL_TEAMS}
        value={teamId} onChange={onTeamChange} fullWidth
      />
      <Select
        theme={theme} size="sm" prefix="Product" options={APP_SHELL_PRODUCTS}
        value={productId} onChange={onProductChange} disabled={teamId === undefined} fullWidth
      />
      <Select
        theme={theme} size="sm" prefix="Mgmt" options={APP_SHELL_MGMTS}
        value={mgmtId} onChange={setMgmtId} disabled={productId === undefined} fullWidth
      />
      <Select
        theme={theme} size="sm" prefix="日曆" options={APP_SHELL_CALENDARS}
        value={calendarName} placeholder="跟隨帳號預設" onChange={setCalendarName} fullWidth
      />
      <div style={{ display: 'flex', gap: A.ADD_FORM_GAP }}>
        <Button theme={theme} variant="primary" size="sm" label="建立" onClick={onCreate} />
        <Button theme={theme} variant="ghost" size="sm" label="取消" onClick={onCancel} />
      </div>
    </div>
  );
}

// ─── 畫面 ────────────────────────────────────────────────────

function AppShell({ variant = 'default', theme = DEFAULT_THEME }) {
  const preset = APP_SHELL_VARIANTS[variant] ?? APP_SHELL_VARIANTS.default;
  const [currentView, setCurrentView] = React.useState(preset.currentView);
  const [mode, setMode] = React.useState(preset.mode);
  const [showAddForm, setShowAddForm] = React.useState(preset.addFormOpen ?? false);
  const [defaultCalendar, setDefaultCalendar] = React.useState(APP_SHELL_DEFAULT_CALENDAR);

  const hasViews = preset.views.length > 0;
  const currentLabel = preset.views.find((v) => v.value === currentView)?.label ?? '';
  const currentMode = APP_SHELL_MODES.find((m) => m.id === mode) ?? APP_SHELL_MODES[0];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        width: A.BASE_WIDTH,
        height: A.BASE_HEIGHT,
        background: theme.bg.base,
        color: theme.text.primary,
        fontFamily: FONT_FAMILY.base,
      }}
    >
      <aside
        style={{
          width: A.SIDEBAR_WIDTH,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: A.SIDEBAR_GAP,
          padding: A.SIDEBAR_PADDING,
          background: theme.bg.surface,
          borderRight: `${A.SIDEBAR_BORDER_WIDTH}px solid ${theme.border.base}`,
        }}
      >
        {/* 品牌 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: A.BRAND_GAP, minWidth: 0 }}>
          <span
            style={{ ...AS_type(A.BRAND_TYPE), color: theme.text.primary }}
          >
            IGotThis
          </span>
          <span
            style={{ ...AS_type(A.BRAND_META_TYPE), color: theme.text.tertiary }}
          >
            工單系統
          </span>
        </div>

        {/* 當前檢視 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: A.GROUP_GAP }}>
          <AppShellGroupLabel theme={theme}>當前檢視</AppShellGroupLabel>
          {hasViews ? (
            <Select
              theme={theme}
              size="sm"
              options={preset.views}
              value={currentView}
              onChange={setCurrentView}
            />
          ) : (
            <span
              style={{
                ...AS_type(A.BRAND_META_TYPE),
                color: theme.text.tertiary,
                padding: `0 ${A.NAV_ITEM_PADDING_X}px`,
              }}
            >
              尚無檢視
            </span>
          )}
          {showAddForm ? (
            <AppShellAddViewForm
              theme={theme}
              onCancel={() => setShowAddForm(false)}
              onCreate={() => setShowAddForm(false)}
            />
          ) : (
            <Button
              theme={theme} variant="secondary" size="sm" fullWidth label="新增檢視"
              onClick={() => setShowAddForm(true)}
            />
          )}
        </div>

        {/* 畫面形態導覽 */}
        <nav
          aria-label="畫面形態"
          style={{ display: 'flex', flexDirection: 'column', gap: A.SECTION_GAP, flex: 1 }}
        >
          <AppShellGroupLabel theme={theme}>畫面</AppShellGroupLabel>
          {APP_SHELL_MODES.map((item) => (
            <AppShellNavItem
              key={item.id}
              theme={theme}
              label={item.label}
              active={item.id === mode}
              onClick={() => setMode(item.id)}
            />
          ))}
        </nav>

        {/* 帳號 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: A.SECTION_GAP }}>
          <span
            style={{
              ...AS_type(A.BRAND_META_TYPE),
              color: theme.text.tertiary,
              padding: `0 ${A.NAV_ITEM_PADDING_X}px`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {APP_SHELL_ACCOUNT}
          </span>
          <Select
            theme={theme} size="sm" prefix="日曆" options={APP_SHELL_CALENDARS}
            value={defaultCalendar} placeholder="未設定" onChange={setDefaultCalendar} fullWidth
          />
          <Button theme={theme} variant="secondary" size="sm" fullWidth label="型別定義" />
          <Button theme={theme} variant="secondary" size="sm" fullWidth label="切換主題" />
          <Button theme={theme} variant="ghost" size="sm" fullWidth label="登出" />
        </div>
      </aside>

      {/* 內容區 */}
      <main style={{ flex: 1, minWidth: 0, padding: A.CONTENT_PADDING, overflow: 'hidden' }}>
        {hasViews ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: A.PLACEHOLDER_RADIUS,
              border: `${A.PLACEHOLDER_BORDER}px dashed ${theme.border.base}`,
              color: theme.text.tertiary,
              ...AS_type(A.PLACEHOLDER_LABEL_TYPE),
            }}
          >
            {currentLabel} · {currentMode.label}
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <EmptyState
              theme={theme}
              title="尚無檢視"
              description="先新增一張檢視，選定資料來源後開始看工單。"
            />
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────

function ScreenAppShellSection() {
  const W = A.BASE_WIDTH;

  return (
    <DCSection
      id="app-shell"
      title="AppShell · 應用外殼"
      subtitle="側邊四段：品牌、當前檢視、畫面形態導覽、帳號。檢視選擇在外殼、不在畫面。"
      direction="column"
    >
      <DCFamily
        id="as-default"
        title="default"
        subtitle="三張檢視、當前為開發總表。切換左側畫面形態不改變當前檢視。"
        direction="column"
      >
        <DCArtboard id="as-default-light" label="default · THEME_LIGHT (live)" width={W} height="auto">
          <AppShell variant="default" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="as-default-dark" label="default · THEME_DARK (live)" width={W} height="auto">
          <AppShell variant="default" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="as-dev-order"
        title="dev-order"
        subtitle="形態停在開發順序表。選取態隨形態走，當前檢視恆定。"
        direction="column"
      >
        <DCArtboard id="as-dev-order-light" label="dev-order · THEME_LIGHT (live)" width={W} height="auto">
          <AppShell variant="dev-order" theme={THEME_LIGHT} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="as-empty"
        title="empty"
        subtitle="名下無檢視。選擇器收起、內容區出空狀態，不自動建檢視。"
        direction="column"
      >
        <DCArtboard id="as-empty-light" label="empty · THEME_LIGHT (live)" width={W} height="auto">
          <AppShell variant="empty" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="as-empty-dark" label="empty · THEME_DARK (live)" width={W} height="auto">
          <AppShell variant="empty" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="as-add-view"
        title="add-view"
        subtitle="新增檢視表單展開：檢視名稱、資料來源三層（Team/Product/Mgmt 逐層收窄）、日曆選用，留白跟隨帳號預設。"
        direction="column"
      >
        <DCArtboard id="as-add-view-light" label="add-view · THEME_LIGHT (live)" width={W} height="auto">
          <AppShell variant="add-view" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="as-add-view-dark" label="add-view · THEME_DARK (live)" width={W} height="auto">
          <AppShell variant="add-view" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  APP_SHELL_TOKENS,
  APP_SHELL_VIEWS, APP_SHELL_MODES, APP_SHELL_ACCOUNT, APP_SHELL_VARIANTS,
  APP_SHELL_TEAMS, APP_SHELL_PRODUCTS, APP_SHELL_MGMTS,
  APP_SHELL_CALENDARS, APP_SHELL_DEFAULT_CALENDAR,
  AppShell, AppShellAddViewForm, ScreenAppShellSection,
});
