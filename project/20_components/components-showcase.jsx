// ─────────────────────────────────────────────────────────────
// Components Showcase · 元件視覺化（純展示，不含 token 表）
//
// 三個 section，各自為 Foundations > Components group 底下一個 leaf：
//   - ComponentsControlsSection      Button / IconButton / Select / TextInput /
//                                    Checkbox / Badge / Avatar / Chip
//   - ComponentsDataDisplaySection   DataTable / TableCell 系列 / KanbanColumn /
//                                    KanbanCard / EmptyState / FilterNotice
//   - ComponentsGanttNavSection      GanttHeader / GanttTimeline / GanttBar /
//                                    SortableRow / SectionDivider / LevelSwitcher / Toolbar
//
// 本檔只承載「元件實境 demo」。元件級 token 表在
// Foundations > Component Tokens 對應 leaf 內，兩邊不重複。
//
// 三條硬規（與元件檔同源）：
//   1. 所有卡片皆為 live JSX，讀 20_components/ 的元件即時 render，不畫靜態圖
//   2. 每個元件家族都出 light 與 dark 兩張卡；dark 卡直接畫在 THEME_DARK.bg.base 上，
//      不靠 canvas 白底掩護。兩主題共用同一份 demo 資料與同一段 JSX
//   3. 本檔不寫 hex、不寫裸數字。展示用的版面值一律引用 SPACING / RADIUS /
//      TYPE_STYLES / CONTROL_HEIGHT 等 atomic 階梯
//
// 靜態展示不到的狀態：hover 與 focus 由元件自身的 React state 驅動，
// 需滑鼠移入或 Tab 聚焦才顯現。各卡片以說明標註哪些狀態要手動觸發，
// 其餘可靜態控制的狀態（disabled / loading / checked / indeterminate /
// selected / dragging / ghost / drop indicator / open）全數並排渲染。
// ─────────────────────────────────────────────────────────────

// ─── 展示層小工具（SC_ 前綴避免與元件檔的同名 helper 相撞）───────

// TYPE_STYLES 的一條 → React inline style。
function SC_type(t) {
  return {
    fontSize:      t.size,
    fontWeight:    t.weight,
    lineHeight:    `${t.lineHeight}px`,
    letterSpacing: t.letterSpacing,
  };
}

// 卡片外殼。背景直接吃 theme.bg.base，dark 卡才真的畫在暗底上。
function CompFrame({ theme = DEFAULT_THEME, children, style }) {
  return (
    <div style={{
      width: '100%',
      minHeight: '100%',
      padding: SPACING.lg,
      background: theme.bg.base,
      color: theme.text.primary,
      fontFamily: FONT_FAMILY.base,
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.lg,
      ...(style || {}),
    }}>{children}</div>
  );
}

// 卡片頂端的一句說明。
function CompLabel({ theme = DEFAULT_THEME, children }) {
  return (
    <div style={{
      ...SC_type(TYPE_STYLES.caption),
      color: theme.text.tertiary,
    }}>{children}</div>
  );
}

// 一組示例的小標。
function CompGroup({ theme = DEFAULT_THEME, title, note, children, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm, ...(style || {}) }}>
      <div style={{ ...SC_type(TYPE_STYLES.overline), color: theme.text.secondary, textTransform: 'uppercase' }}>
        {title}
      </div>
      {note && (
        <div style={{ ...SC_type(TYPE_STYLES.caption), color: theme.text.tertiary }}>{note}</div>
      )}
      {children}
    </div>
  );
}

// 橫向並排一列示例；wrap 讓窄卡片自動換行。
function CompRow({ children, gap = SPACING.md, align = 'center', style }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: align, gap,
      ...(style || {}),
    }}>{children}</div>
  );
}

// 單一示例 + 底下的狀態名。
function CompCell({ theme = DEFAULT_THEME, caption, children, width }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs, width, minWidth: 0 }}>
      <div>{children}</div>
      {caption && (
        <div style={{ ...SC_type(TYPE_STYLES.caption), color: theme.text.tertiary, whiteSpace: 'nowrap' }}>
          {caption}
        </div>
      )}
    </div>
  );
}

// ─── 共用 demo 資料 ───────────────────────────────────────────

const SC_SORT_OPTIONS = [
  { value: 'key',      label: '編號' },
  { value: 'updated',  label: '更新時間' },
  { value: 'due',      label: '到期日' },
  { value: 'priority', label: '優先度' },
];

const SC_GROUP_OPTIONS = [
  { value: 'none',     label: '不分組' },
  { value: 'status',   label: '狀態' },
  { value: 'assignee', label: '負責人' },
];

const SC_LEVELS = [
  { id: 'epic',  label: '主題' },
  { id: 'story', label: '需求' },
  { id: 'task',  label: '工項' },
];

// ─────────────────────────────────────────────────────────────
// Section 1 · Controls
// ─────────────────────────────────────────────────────────────

// Select 自帶開合狀態，示範需要受控 value。
function SCSelectDemo({ theme, prefix, options, initial, size, disabled }) {
  const [v, setV] = React.useState(initial);
  return <Select theme={theme} prefix={prefix} options={options} value={v} onChange={setV} size={size} disabled={disabled} />;
}

function SCTextInputDemo({ theme, initial, placeholder, leadingIcon, size, disabled }) {
  const [v, setV] = React.useState(initial || '');
  return (
    <TextInput theme={theme} value={v} onChange={setV} placeholder={placeholder}
      leadingIcon={leadingIcon} size={size} disabled={disabled} />
  );
}

function SCCheckboxDemo({ theme, initial, indeterminate, label, size, disabled }) {
  const [v, setV] = React.useState(!!initial);
  return (
    <Checkbox theme={theme} checked={v} indeterminate={indeterminate} onChange={setV}
      label={label} size={size} disabled={disabled} />
  );
}

// Button 三 variant × 兩 size × 可靜態呈現的狀態。
function SCButtonBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        variant 三種 × size 兩種。hover 與 focus 需滑鼠移入 / Tab 聚焦才顯現；
        disabled 依 variant 分流——primary 保主色底降 opacity、secondary 外框由 input 退回 base、ghost 只換字色。
      </CompLabel>

      <CompGroup theme={theme} title="Variant · size md">
        <CompRow>
          <CompCell theme={theme} caption="primary"><Button theme={theme} variant="primary" label="建立工單" /></CompCell>
          <CompCell theme={theme} caption="secondary"><Button theme={theme} variant="secondary" label="套用篩選" /></CompCell>
          <CompCell theme={theme} caption="ghost"><Button theme={theme} variant="ghost" label="清除" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Variant · size sm" note="表格列內與工具列次要動作用，高度收到 CONTROL_HEIGHT.sm">
        <CompRow>
          <CompCell theme={theme} caption="primary · sm"><Button theme={theme} variant="primary" size="sm" label="指派" /></CompCell>
          <CompCell theme={theme} caption="secondary · sm"><Button theme={theme} variant="secondary" size="sm" label="更多" /></CompCell>
          <CompCell theme={theme} caption="ghost · sm"><Button theme={theme} variant="ghost" size="sm" label="取消" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="圖示組合">
        <CompRow>
          <CompCell theme={theme} caption="iconLeft"><Button theme={theme} variant="secondary" iconLeft="filter" label="篩選" /></CompCell>
          <CompCell theme={theme} caption="iconRight"><Button theme={theme} variant="secondary" iconRight="chevron-down" label="檢視" /></CompCell>
          <CompCell theme={theme} caption="兩側皆有"><Button theme={theme} variant="ghost" iconLeft="sort" iconRight="chevron-down" label="排序" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Loading" note="轉圈取代 iconLeft，label 留在原位、按鈕寬度不跳動">
        <CompRow>
          <CompCell theme={theme} caption="primary · loading"><Button theme={theme} variant="primary" iconLeft="plus" label="建立工單" loading /></CompCell>
          <CompCell theme={theme} caption="secondary · loading"><Button theme={theme} variant="secondary" iconLeft="filter" label="篩選" loading /></CompCell>
          <CompCell theme={theme} caption="ghost · loading"><Button theme={theme} variant="ghost" label="清除" loading /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Disabled" note="三態分流：實心降 opacity、有框退框、無框只換字色">
        <CompRow>
          <CompCell theme={theme} caption="primary · disabled"><Button theme={theme} variant="primary" label="建立工單" disabled /></CompCell>
          <CompCell theme={theme} caption="secondary · disabled"><Button theme={theme} variant="secondary" label="套用篩選" disabled /></CompCell>
          <CompCell theme={theme} caption="ghost · disabled"><Button theme={theme} variant="ghost" label="清除" disabled /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="fullWidth" note="撐滿容器寬，空狀態與側欄動作區用">
        <div style={{ maxWidth: SPACING['4xl'] * 6 }}>
          <Button theme={theme} variant="primary" iconLeft="plus" label="建立第一張工單" fullWidth />
        </div>
      </CompGroup>
    </CompFrame>
  );
}

function SCIconButtonBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        方形圖示鈕，色盤與 Button 共用。無 label，故一律帶 title 作 tooltip 與無障礙名稱。
        active 供 toggle 型入口用（面板展開中），視覺走 state.selected。
      </CompLabel>

      <CompGroup theme={theme} title="Size · sm / md / lg" note="表格列內 sm、工具列 md、頁面級動作 lg">
        <CompRow>
          <CompCell theme={theme} caption="sm 24"><IconButton theme={theme} icon="dots" title="更多" size="sm" /></CompCell>
          <CompCell theme={theme} caption="md 28"><IconButton theme={theme} icon="columns" title="欄位顯示設定" size="md" /></CompCell>
          <CompCell theme={theme} caption="lg 32"><IconButton theme={theme} icon="plus" title="建立工單" size="lg" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Variant">
        <CompRow>
          <CompCell theme={theme} caption="ghost（預設）"><IconButton theme={theme} icon="search" title="搜尋" variant="ghost" /></CompCell>
          <CompCell theme={theme} caption="secondary"><IconButton theme={theme} icon="search" title="搜尋" variant="secondary" /></CompCell>
          <CompCell theme={theme} caption="primary"><IconButton theme={theme} icon="plus" title="建立" variant="primary" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="State" note="active 為 toggle 開啟中；disabled 只換字色（ghost 無框）">
        <CompRow>
          <CompCell theme={theme} caption="default"><IconButton theme={theme} icon="columns" title="欄位顯示設定" /></CompCell>
          <CompCell theme={theme} caption="active"><IconButton theme={theme} icon="columns" title="欄位顯示設定" active /></CompCell>
          <CompCell theme={theme} caption="disabled"><IconButton theme={theme} icon="columns" title="欄位顯示設定" disabled /></CompCell>
          <CompCell theme={theme} caption="secondary · disabled"><IconButton theme={theme} icon="columns" title="欄位顯示設定" variant="secondary" disabled /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Glyph 全集" note="ControlGlyph 目前承載的 UI glyph；圖示庫成形後移出元件檔">
        <CompRow gap={SPACING.sm}>
          {Object.keys(CONTROL_GLYPH_PATHS).map((n) => (
            <CompCell key={n} theme={theme} caption={n}>
              <IconButton theme={theme} icon={n} title={n} variant="secondary" />
            </CompCell>
          ))}
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCSelectBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        排序依據與分組依據用。點 trigger 展開 level2 浮層 menu；選中列以 trailing check 表達，
        點外面或 Escape 收合。open 時 trigger 外框轉 focus ring 色。
      </CompLabel>

      <CompGroup theme={theme} title="帶前綴 · size md" note="prefix 渲染成「排序:」，色階比值低一階">
        <CompRow>
          <SCSelectDemo theme={theme} prefix="排序" options={SC_SORT_OPTIONS} initial="updated" />
          <SCSelectDemo theme={theme} prefix="分組" options={SC_GROUP_OPTIONS} initial="status" />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="size sm">
        <CompRow>
          <SCSelectDemo theme={theme} prefix="排序" options={SC_SORT_OPTIONS} initial="key" size="sm" />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Placeholder 與 disabled" note="value 找不到對應 option 時顯示 placeholder，色走 text.tertiary">
        <CompRow>
          <CompCell theme={theme} caption="未選">
            <Select theme={theme} options={SC_SORT_OPTIONS} value={undefined} placeholder="選擇排序依據" onChange={() => {}} />
          </CompCell>
          <CompCell theme={theme} caption="disabled">
            <Select theme={theme} prefix="排序" options={SC_SORT_OPTIONS} value="updated" disabled onChange={() => {}} />
          </CompCell>
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCTextInputBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        搜尋與篩選用。leadingIcon 常給 search；有值且非 disabled 時右側出現清除鈕。
        focus 時外框轉 focus ring 色並外加一圈 ring，需 Tab 或點入才顯現。
      </CompLabel>

      <CompGroup theme={theme} title="size md">
        <CompRow>
          <CompCell theme={theme} caption="空值 + leadingIcon">
            <SCTextInputDemo theme={theme} placeholder="搜尋工單" leadingIcon="search" />
          </CompCell>
          <CompCell theme={theme} caption="有值 · 顯示清除鈕">
            <SCTextInputDemo theme={theme} initial="登入流程" leadingIcon="search" />
          </CompCell>
          <CompCell theme={theme} caption="無 leadingIcon">
            <SCTextInputDemo theme={theme} placeholder="輸入標籤" />
          </CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="size sm">
        <CompRow>
          <CompCell theme={theme} caption="sm · 空值">
            <SCTextInputDemo theme={theme} placeholder="搜尋" leadingIcon="search" size="sm" />
          </CompCell>
          <CompCell theme={theme} caption="sm · 有值">
            <SCTextInputDemo theme={theme} initial="IGT-1" leadingIcon="search" size="sm" />
          </CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Disabled" note="底色換 surface_dim、外框退回 border.base、清除鈕不出現">
        <CompRow>
          <TextInput theme={theme} value="唯讀條件" leadingIcon="search" disabled onChange={() => {}} />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="fullWidth">
        <div style={{ maxWidth: SPACING['4xl'] * 8 }}>
          <SCTextInputDemo theme={theme} placeholder="搜尋工單標題、編號或負責人" leadingIcon="search" />
        </div>
      </CompGroup>
    </CompFrame>
  );
}

function SCCheckboxBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        表格列多選與欄位顯示設定用。indeterminate 供「全選」表頭的部分選取態。
        整條 label + box 同屬一個 hit target，高度吃 CONTROL_HEIGHT。
      </CompLabel>

      <CompGroup theme={theme} title="State · size md">
        <CompRow gap={SPACING.lg}>
          <SCCheckboxDemo theme={theme} label="未勾" />
          <SCCheckboxDemo theme={theme} initial label="已勾" />
          <Checkbox theme={theme} indeterminate label="部分選取" onChange={() => {}} />
          <Checkbox theme={theme} label="未勾 · disabled" disabled onChange={() => {}} />
          <Checkbox theme={theme} checked label="已勾 · disabled" disabled onChange={() => {}} />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="State · size sm" note="表格列內用，box 收到 ICON_SIZE.sm">
        <CompRow gap={SPACING.lg}>
          <SCCheckboxDemo theme={theme} size="sm" label="未勾" />
          <SCCheckboxDemo theme={theme} size="sm" initial label="已勾" />
          <Checkbox theme={theme} size="sm" indeterminate label="部分選取" onChange={() => {}} />
          <Checkbox theme={theme} size="sm" checked label="已勾 · disabled" disabled onChange={() => {}} />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="無 label" note="表格列首的多選格用，只留 box">
        <CompRow gap={SPACING.md}>
          <SCCheckboxDemo theme={theme} />
          <SCCheckboxDemo theme={theme} initial />
          <Checkbox theme={theme} indeterminate onChange={() => {}} />
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCBadgeBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        Status 欄與權限過濾標示用。文字一律走該 tone 的 status.&lt;name&gt;_fg，
        圓點才吃 status.&lt;name&gt; 基準色——基準色壓在自家淡底上不過 AA，
        圓點是非文字元素才可以用。dot 預設開，色相之外多一層形狀線索。
      </CompLabel>

      <CompGroup theme={theme} title="Tone 全集 · dot 開" note={BADGE_TOKENS.TONES.join(' / ')}>
        <CompRow gap={SPACING.sm}>
          <Badge theme={theme} tone="success" label="已完成" />
          <Badge theme={theme} tone="warning" label="待審核" />
          <Badge theme={theme} tone="error"   label="已阻塞" />
          <Badge theme={theme} tone="info"    label="進行中" />
          <Badge theme={theme} tone="neutral" label="待處理" />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Tone 全集 · dot 關" note="看板卡橫向窄，狀態不再放圓點（KANBAN.CARD_BADGE_DOT = false）">
        <CompRow gap={SPACING.sm}>
          <Badge theme={theme} tone="success" label="已完成" dot={false} />
          <Badge theme={theme} tone="warning" label="待審核" dot={false} />
          <Badge theme={theme} tone="error"   label="已阻塞" dot={false} />
          <Badge theme={theme} tone="info"    label="進行中" dot={false} />
          <Badge theme={theme} tone="neutral" label="待處理" dot={false} />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="未知 tone 退回 neutral" note="tone 傳不存在的值時 fallback，不炸也不留空白">
        <CompRow gap={SPACING.sm}>
          <Badge theme={theme} tone="unknown-tone" label="未定義 tone" />
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCAvatarBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        Assignee 欄用。無圖時取姓名字首：中日文取末一字（姓氏在前、辨識度在後段），
        拉丁字母取首字母、有空白取前兩段。primary tone 直接吃 state.selected 那組色，
        兩主題都是現成過 AA 的配對；外圈 hairline 讓頭像疊在同色底上仍有邊。
      </CompLabel>

      <CompGroup theme={theme} title="Tone × size">
        <CompRow gap={SPACING.lg}>
          <CompCell theme={theme} caption="primary · md"><Avatar theme={theme} name="陳彥廷" /></CompCell>
          <CompCell theme={theme} caption="primary · sm"><Avatar theme={theme} name="陳彥廷" size="sm" /></CompCell>
          <CompCell theme={theme} caption="neutral · md"><Avatar theme={theme} name="陳彥廷" tone="neutral" /></CompCell>
          <CompCell theme={theme} caption="neutral · sm"><Avatar theme={theme} name="陳彥廷" tone="neutral" size="sm" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="字首取法" note="avatarInitials 的三條分支">
        <CompRow gap={SPACING.lg}>
          <CompCell theme={theme} caption="中文 → 末一字"><Avatar theme={theme} name="林郁婷" /></CompCell>
          <CompCell theme={theme} caption="日文 → 末一字"><Avatar theme={theme} name="佐藤健" /></CompCell>
          <CompCell theme={theme} caption="拉丁單字 → 首字母"><Avatar theme={theme} name="ken" /></CompCell>
          <CompCell theme={theme} caption="拉丁雙字 → 前兩段"><Avatar theme={theme} name="Ada Lovelace" /></CompCell>
          <CompCell theme={theme} caption="空值 → 空頭像"><Avatar theme={theme} name="" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="群組疊放" note="表格 Watcher 欄的多人情境">
        <CompRow gap={0}>
          {['陳彥廷', '林郁婷', '佐藤健', 'Ada Lovelace'].map((n, i) => (
            <span key={n} style={{ marginLeft: i === 0 ? 0 : -SPACING.sm }}>
              <Avatar theme={theme} name={n} size="sm" tone={i % 2 === 0 ? 'primary' : 'neutral'} />
            </span>
          ))}
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCChipBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        工具列下方顯示已套用的篩選條件。走 sm 檔高度，與 Select 同排時矮一階，
        讀作「已套用的條件」而非「可操作的控件」。onRemove 給了才出現移除鈕，
        不給就是純唯讀標籤；onClick 給了才可點、才吃 hover 與 focus ring。
      </CompLabel>

      <CompGroup theme={theme} title="Base" note="底走 surface_dim、外框是裝飾線（chip 非必要邊界，底色差已足以辨識）">
        <CompRow gap={SPACING.sm}>
          <CompCell theme={theme} caption="label + value + remove">
            <Chip theme={theme} label="狀態" value="進行中" onRemove={() => {}} />
          </CompCell>
          <CompCell theme={theme} caption="無 label">
            <Chip theme={theme} value="本週到期" onRemove={() => {}} />
          </CompCell>
          <CompCell theme={theme} caption="唯讀（無 onRemove）">
            <Chip theme={theme} label="專案" value="IGotThis" />
          </CompCell>
          <CompCell theme={theme} caption="可點（有 onClick）">
            <Chip theme={theme} label="負責人" value="陳彥廷" onClick={() => {}} onRemove={() => {}} />
          </CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Selected" note="進行中 / 被聚焦的條件，整組色換 state.selected">
        <CompRow gap={SPACING.sm}>
          <Chip theme={theme} label="狀態" value="進行中" selected onRemove={() => {}} />
          <Chip theme={theme} value="本週到期" selected onRemove={() => {}} />
          <Chip theme={theme} label="專案" value="IGotThis" selected />
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="工具列實境" note="Select 與 Chip 同排的高度落差：md 28 對 sm 24">
        <CompRow gap={SPACING.sm}>
          <SCSelectDemo theme={theme} prefix="排序" options={SC_SORT_OPTIONS} initial="updated" />
          <Chip theme={theme} label="狀態" value="進行中" onRemove={() => {}} />
          <Chip theme={theme} label="負責人" value="陳彥廷" onRemove={() => {}} />
          <Chip theme={theme} label="到期" value="本週" selected onRemove={() => {}} />
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function ComponentsControlsSection() {
  return (
    <DCSection
      id="comp-controls"
      title="Components · Controls"
      subtitle="八件基礎控件：Button / IconButton / Select / TextInput / Checkbox / Badge / Avatar / Chip。消費畫面為 ListScreen 的檢視工具列與工單表格，後續看板與開發順序表共用同一組。對應 token 表見 Foundations > Component Tokens > Control Tokens。每個家族都出 light 與 dark 兩張卡，dark 直接畫在 THEME_DARK.bg.base 上。"
    >
      <DCFamily id="ctl-buttons" title="Buttons" subtitle="文字動作鈕與方形圖示鈕。兩者色盤共用 BUTTON_TOKENS.COLORS_BY_VARIANT，工具列上文字鈕與圖示鈕視覺同族。">
        <DCArtboard id="ctl-button-light" label="Button · THEME_LIGHT (live)" width={520} height="auto">
          <SCButtonBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-button-dark" label="Button · THEME_DARK (live)" width={520} height="auto">
          <SCButtonBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ctl-icon-button-light" label="IconButton · THEME_LIGHT (live)" width={520} height="auto">
          <SCIconButtonBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-icon-button-dark" label="IconButton · THEME_DARK (live)" width={520} height="auto">
          <SCIconButtonBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="ctl-inputs" title="Inputs" subtitle="Select / TextInput / Checkbox 三件可聚焦控件。靜置外框一律吃 theme.border.input（1.4.11 的 3:1 必要邊界），focus 時另加一圈 state.focus.ring 疊在外框之外、不撐開 layout。">
        <DCArtboard id="ctl-select-light" label="Select · THEME_LIGHT (live · 點開試)" width={460} height="auto">
          <SCSelectBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-select-dark" label="Select · THEME_DARK (live · 點開試)" width={460} height="auto">
          <SCSelectBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ctl-text-input-light" label="TextInput · THEME_LIGHT (live)" width={520} height="auto">
          <SCTextInputBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-text-input-dark" label="TextInput · THEME_DARK (live)" width={520} height="auto">
          <SCTextInputBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ctl-checkbox-light" label="Checkbox · THEME_LIGHT (live)" width={560} height="auto">
          <SCCheckboxBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-checkbox-dark" label="Checkbox · THEME_DARK (live)" width={560} height="auto">
          <SCCheckboxBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="ctl-tags" title="Tags & Identity" subtitle="Badge / Avatar / Chip 三件表格內元素。高度都壓在 ROW_HEIGHT.base(36) 內仍有上下留白。">
        <DCArtboard id="ctl-badge-light" label="Badge · THEME_LIGHT (live)" width={460} height="auto">
          <SCBadgeBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-badge-dark" label="Badge · THEME_DARK (live)" width={460} height="auto">
          <SCBadgeBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ctl-avatar-light" label="Avatar · THEME_LIGHT (live)" width={520} height="auto">
          <SCAvatarBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-avatar-dark" label="Avatar · THEME_DARK (live)" width={520} height="auto">
          <SCAvatarBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ctl-chip-light" label="Chip · THEME_LIGHT (live)" width={560} height="auto">
          <SCChipBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ctl-chip-dark" label="Chip · THEME_DARK (live)" width={560} height="auto">
          <SCChipBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 2 · Data Display
// ─────────────────────────────────────────────────────────────

// 欄寬全走 SPACING 階梯的倍數，不寫裸數字；
// 標題欄用 minmax 吃剩餘空間，下界比 TABLE.COLUMN_MIN_WIDTH 再寬一級以容兩行標題。
const SC_TABLE_COLUMNS = [
  { key: 'key',      label: '編號',   type: 'key',    width: SPACING['4xl'] * 2, sortable: true },
  { key: 'title',    label: '標題',   type: 'text',   width: `minmax(${SPACING['4xl'] * 4}px, 1.6fr)`, sortable: true },
  { key: 'status',   label: '狀態',   type: 'status', width: SPACING['3xl'] * 3 },
  { key: 'assignee', label: '負責人', type: 'user',   width: SPACING['4xl'] * 3 },
  { key: 'due',      label: '到期日', type: 'date',   width: SPACING['3xl'] * 3, sortable: true },
  { key: 'points',   label: '點數',   type: 'number', width: SPACING.xl * 3, align: 'right', sortable: true },
];

const SC_TABLE_ROWS = [
  { id: 'r1', cells: {
    key: 'IGT-101', title: '列表畫面 · 檢視工具列', status: { label: '進行中', tone: 'info' },
    assignee: { name: '陳彥廷' }, due: { label: '2026/08/12', tone: 'soon' }, points: 5 } },
  { id: 'r2', cells: {
    key: 'IGT-102', title: '工單表格 · 欄位顯示設定與排序', status: { label: '待審核', tone: 'warning' },
    assignee: { name: '林郁婷' }, due: { label: '2026/08/04', tone: 'overdue' }, points: 8 } },
  { id: 'r3', cells: {
    key: 'IGT-103', title: '看板拖放狀態流轉', status: { label: '已完成', tone: 'success' },
    assignee: { name: 'Ada Lovelace' }, due: { label: '2026/07/30' }, points: 13 } },
  { id: 'r4', cells: {
    key: 'IGT-104', title: '權限過濾標示列', status: { label: '已阻塞', tone: 'error' },
    assignee: { name: '佐藤健' }, due: { label: '2026/08/20' }, points: 3 } },
  { id: 'r5', cells: {
    key: 'IGT-105', title: '開發順序表 · 甘特檢視', status: { label: '待處理' },
    assignee: null, due: null, points: null } },
  { id: 'r6', disabled: true, cells: {
    key: 'IGT-106', title: '無讀取權的工單（disabled row）', status: { label: '待處理' },
    assignee: { name: '陳彥廷' }, due: { label: '2026/09/01' }, points: 2 } },
];

const SC_KANBAN_CARDS = {
  todo: [
    { issueKey: 'IGT-105', title: '開發順序表 · 甘特檢視', assignee: { name: '陳彥廷' }, status: { label: '待處理' }, due: { label: '09/01' } },
    { issueKey: 'IGT-107', title: '工單詳情頁的關聯區塊', status: { label: '待處理' } },
  ],
  doing: [
    { issueKey: 'IGT-101', title: '列表畫面 · 檢視工具列與已套用篩選標籤列', assignee: { name: '林郁婷' }, status: { label: '進行中', tone: 'info' }, due: { label: '08/12', tone: 'soon' } },
    { issueKey: 'IGT-102', title: '工單表格 · 欄位顯示設定與排序', assignee: { name: 'Ada Lovelace' }, status: { label: '待審核', tone: 'warning' }, due: { label: '08/04', tone: 'overdue' } },
  ],
  done: [
    { issueKey: 'IGT-103', title: '看板拖放狀態流轉', assignee: { name: '佐藤健' }, status: { label: '已完成', tone: 'success' }, due: { label: '07/30' } },
  ],
};

function SCTableDemo({ theme, density = 'base', zebra = false, groupBy, rows = SC_TABLE_ROWS, maxHeight, columns = SC_TABLE_COLUMNS, initialSelected = [] }) {
  const [sort, setSort] = React.useState({ key: 'due', direction: 'asc' });
  const [selected, setSelected] = React.useState(initialSelected);
  const toggle = (row) => setSelected((prev) =>
    prev.indexOf(row.id) === -1 ? [...prev, row.id] : prev.filter((id) => id !== row.id));
  return (
    <DataTable
      theme={theme} columns={columns} rows={rows} density={density} zebra={zebra}
      groupBy={groupBy} sort={sort} onSortChange={setSort}
      selectedIds={selected} onRowSelect={toggle} maxHeight={maxHeight}
    />
  );
}

function SCTableBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        六型欄位並陳：key（mono + primary.main）、text、status（Badge）、user（Avatar + 名稱）、
        date（逾期吃 status.error_fg、將到期吃 status.warning_fg）、number（右對齊 + tabular-nums）。
        點標題列切排序、點列切選取；hover 需滑鼠移入。末列為 disabled row。
      </CompLabel>
      <CompGroup theme={theme} title="Density base · 預設" note="ROW_HEIGHT.base 36，欄距 SPACING.md">
        <SCTableDemo theme={theme} initialSelected={['r1']} />
      </CompGroup>
      <CompGroup theme={theme} title="Zebra" note="斑馬紋吃 bg.surface_dim（4% 疊層，疊在 surface 上不改色相）">
        <SCTableDemo theme={theme} zebra />
      </CompGroup>
    </CompFrame>
  );
}

function SCTableDensityBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        density 三檔對應 ROW_HEIGHT 的 compact 32 / base 36 / relaxed 44。
        compact 另把欄距收到 SPACING.sm 換掃描密度，base 與 relaxed 用 SPACING.md。
      </CompLabel>
      <CompGroup theme={theme} title="compact 32">
        <SCTableDemo theme={theme} density="compact" rows={SC_TABLE_ROWS.slice(0, 4)} />
      </CompGroup>
      <CompGroup theme={theme} title="base 36">
        <SCTableDemo theme={theme} density="base" rows={SC_TABLE_ROWS.slice(0, 4)} />
      </CompGroup>
      <CompGroup theme={theme} title="relaxed 44">
        <SCTableDemo theme={theme} density="relaxed" rows={SC_TABLE_ROWS.slice(0, 4)} />
      </CompGroup>
    </CompFrame>
  );
}

function SCTableVariantBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        分組、捲動與空狀態三個變體。分組依首次出現順序聚集、不重排群內工單列；
        指定 maxHeight 後標題列 sticky；rows 為空時走預設 EmptyState，也可用 emptyState prop 覆寫。
      </CompLabel>
      <CompGroup theme={theme} title="groupBy = status" note="分組列高 CONTROL_HEIGHT.md 28，比工單列矮一階；工單列縮排 GROUP_INDENT">
        <SCTableDemo theme={theme} groupBy="status" />
      </CompGroup>
      <CompGroup theme={theme} title="maxHeight · 標題列 sticky" note="內容超過即內捲，捲動時標題列固定">
        <SCTableDemo theme={theme} maxHeight={ROW_HEIGHT.base * 4} />
      </CompGroup>
      <CompGroup theme={theme} title="rows = [] · 預設空狀態">
        <SCTableDemo theme={theme} rows={[]} />
      </CompGroup>
    </CompFrame>
  );
}

function SCTableCellBoard({ theme }) {
  const cellRow = (label, node) => (
    <div key={label} style={{
      display: 'grid', gridTemplateColumns: `${SPACING['4xl'] * 3}px 1fr`, alignItems: 'center',
      height: ROW_HEIGHT.base,
      borderTop: `${BORDER_WIDTH.hairline}px solid ${theme.divider.hairline}`,
    }}>
      <span style={{ ...SC_type(TYPE_STYLES.caption), color: theme.text.tertiary, paddingLeft: SPACING.sm }}>{label}</span>
      {node}
    </div>
  );
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        TableCell 系列單獨檢視。各格都吃 theme 與 density；編號與數字統一 NUMERIC_FONT_VARIANT。
        muted 走 text.tertiary、disabled 走 state.disabled.fg。空值一律落 — 破折號。
      </CompLabel>
      <div style={{
        background: theme.bg.surface,
        border: `${BORDER_WIDTH.hairline}px solid ${theme.border.base}`,
        borderRadius: RADIUS.lg, overflow: 'hidden', color: theme.text.primary,
      }}>
        {[
          cellRow('TableTextCell',            <TableTextCell   theme={theme} value="列表畫面 · 檢視工具列" />),
          cellRow('TableTextCell · muted',    <TableTextCell   theme={theme} value="次要說明文字" muted />),
          cellRow('TableTextCell · disabled', <TableTextCell   theme={theme} value="無讀取權" disabled />),
          cellRow('TableKeyCell',             <TableKeyCell    theme={theme} value="IGT-101" onClick={() => {}} />),
          cellRow('TableStatusCell · info',   <TableStatusCell theme={theme} status={{ label: '進行中', tone: 'info' }} />),
          cellRow('TableStatusCell · 無 tone',<TableStatusCell theme={theme} status={{ label: '待處理' }} />),
          cellRow('TableUserCell',            <TableUserCell   theme={theme} user={{ name: '陳彥廷' }} />),
          cellRow('TableUserCell · 空',       <TableUserCell   theme={theme} user={null} />),
          cellRow('TableDateCell',            <TableDateCell   theme={theme} date={{ label: '2026/09/01' }} />),
          cellRow('TableDateCell · soon',     <TableDateCell   theme={theme} date={{ label: '2026/08/12', tone: 'soon' }} />),
          cellRow('TableDateCell · overdue',  <TableDateCell   theme={theme} date={{ label: '2026/08/04', tone: 'overdue' }} />),
          cellRow('TableNumberCell',          <TableNumberCell theme={theme} value={13} />),
          cellRow('TableNumberCell · 空',     <TableNumberCell theme={theme} value={null} />),
        ]}
      </div>
    </CompFrame>
  );
}

function SCKanbanBoard({ theme }) {
  const card = (props, extra) => <KanbanCard key={props.issueKey + (extra ? JSON.stringify(extra) : '')} theme={theme} {...props} {...(extra || {})} />;
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        一欄對應一個流程狀態，欄數由 Status 決定、結案原因不開欄。
        欄底比卡片暗一階（surface_dim 對 surface），卡片才浮得起來。
        第四欄為拖放目標態：底換 state.selected.bg、外框轉虛線 focus 色。
      </CompLabel>
      <CompRow gap={DATA_DISPLAY_TOKENS.KANBAN.COLUMN_GAP} align="flex-start">
        <KanbanColumn theme={theme} title="待處理" count={SC_KANBAN_CARDS.todo.length}>
          {SC_KANBAN_CARDS.todo.map((c) => card(c))}
        </KanbanColumn>
        <KanbanColumn theme={theme} title="進行中" count={SC_KANBAN_CARDS.doing.length}>
          {SC_KANBAN_CARDS.doing.map((c) => card(c))}
        </KanbanColumn>
        <KanbanColumn theme={theme} title="已完成" count={SC_KANBAN_CARDS.done.length}>
          {SC_KANBAN_CARDS.done.map((c) => card(c))}
        </KanbanColumn>
        <KanbanColumn theme={theme} title="已取消" count={0} isDropTarget>
          <EmptyState theme={theme} compact icon="inbox" title="拖到此欄" description="放開即套用狀態" />
        </KanbanColumn>
      </CompRow>
    </CompFrame>
  );
}

function SCKanbanCardBoard({ theme }) {
  const base = {
    issueKey: 'IGT-102', title: '工單表格 · 欄位顯示設定與排序',
    assignee: { name: '林郁婷' }, status: { label: '待審核', tone: 'warning' },
    due: { label: '08/04', tone: 'overdue' },
  };
  const cell = (caption, extra) => (
    <CompCell key={caption} theme={theme} caption={caption} width={DATA_DISPLAY_TOKENS.KANBAN.COLUMN_WIDTH}>
      <KanbanCard theme={theme} {...base} {...extra} />
    </CompCell>
  );
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        卡片狀態全集。hover 需滑鼠移入（外框轉 border.strong）、focus 需 Tab（outline 走 focus ring）。
        dragging 抬起走 level3 陰影 + 微幅放大傾斜；ghost 是原位殘影；
        loading 為狀態轉換進行中，壓暗 + spinner、期間不可再拖。
      </CompLabel>
      <CompRow gap={SPACING.lg} align="flex-start">
        {cell('default', {})}
        {cell('selected', { selected: true })}
        {cell('dragging', { dragging: true })}
        {cell('ghost（原位殘影）', { ghost: true })}
        {cell('loading（狀態轉換中）', { loading: true })}
        {cell('disabled', { disabled: true })}
      </CompRow>
      <CompGroup theme={theme} title="內容變體" note="標題最多兩行、超出截斷；assignee / due 可缺；無 meta 時整行不渲染">
        <CompRow gap={SPACING.lg} align="flex-start">
          <CompCell theme={theme} caption="標題兩行 + 全 meta" width={DATA_DISPLAY_TOKENS.KANBAN.COLUMN_WIDTH}>
            <KanbanCard theme={theme} {...base} />
          </CompCell>
          <CompCell theme={theme} caption="無 assignee" width={DATA_DISPLAY_TOKENS.KANBAN.COLUMN_WIDTH}>
            <KanbanCard theme={theme} issueKey="IGT-107" title="工單詳情頁的關聯區塊" status={{ label: '待處理' }} due={{ label: '09/12' }} />
          </CompCell>
          <CompCell theme={theme} caption="無 meta 整行" width={DATA_DISPLAY_TOKENS.KANBAN.COLUMN_WIDTH}>
            <KanbanCard theme={theme} issueKey="IGT-108" title="只有編號與標題" status={{ label: '已完成', tone: 'success' }} />
          </CompCell>
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCFeedbackBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        EmptyState 兩檔尺寸：一般供表格與整頁、compact 供看板欄內。
        FilterNotice 由 filterViewByPermission 產出，count 為 0 時整個元件不渲染。
      </CompLabel>

      <CompGroup theme={theme} title="EmptyState · 一般">
        <div style={{ background: theme.bg.surface, border: `${BORDER_WIDTH.hairline}px solid ${theme.border.base}`, borderRadius: RADIUS.lg }}>
          <EmptyState theme={theme} title="沒有符合條件的工單" description="調整篩選條件或改選其他檢視。" />
        </div>
      </CompGroup>

      <CompGroup theme={theme} title="EmptyState · 帶 action">
        <CompRow gap={SPACING.md} align="stretch">
          <div style={{ flex: 1, minWidth: 0, background: theme.bg.surface, border: `${BORDER_WIDTH.hairline}px solid ${theme.border.base}`, borderRadius: RADIUS.lg }}>
            <EmptyState theme={theme} title="尚無工單" description="建立第一張工單開始追蹤。"
              action={{ label: '建立工單', icon: 'plus', onClick: () => {} }} />
          </div>
          <div style={{ flex: 1, minWidth: 0, background: theme.bg.surface, border: `${BORDER_WIDTH.hairline}px solid ${theme.border.base}`, borderRadius: RADIUS.lg }}>
            <EmptyState theme={theme} title="尚無工單" description="無建立權限時 action 停用。"
              action={{ label: '建立工單', icon: 'plus', disabled: true }} />
          </div>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="EmptyState · compact" note="看板欄內用，icon box 與字級各降一階">
        <div style={{ width: DATA_DISPLAY_TOKENS.KANBAN.COLUMN_WIDTH, background: theme.bg.surface_dim, borderRadius: RADIUS.lg }}>
          <EmptyState theme={theme} compact title="此欄沒有工單" description="拖入卡片即套用狀態。" />
        </div>
      </CompGroup>

      <CompGroup theme={theme} title="FilterNotice" note="左側色條吃該 tone 的基準色、底吃 _bg、字吃 _fg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          <FilterNotice theme={theme} count={3} reason="無讀取權" tone="info" />
          <FilterNotice theme={theme} count={12} reason="專案已封存" tone="warning" />
          <FilterNotice theme={theme} count={0} reason="count 為 0 · 本列不渲染" />
        </div>
      </CompGroup>
    </CompFrame>
  );
}

function ComponentsDataDisplaySection() {
  return (
    <DCSection
      id="comp-data-display"
      title="Components · Data Display"
      subtitle="把工單資料攤成可掃描的表格與看板，含無資料與權限過濾兩種提示。消費畫面為 ListScreen（DataTable + TableCell 系列 + FilterNotice + EmptyState）與 KanbanScreen（KanbanColumn + KanbanCard）。對應 token 表見 Foundations > Component Tokens > Data Display Tokens。Badge 與 Avatar 由基礎控件組提供，未載入時走等價 fallback。"
    >
      <DCFamily id="dd-table" title="Data Table" subtitle="工單表格。density 三檔、可排序標題列、選取列左側指示條、分組與 sticky 標題列。">
        <DCArtboard id="dd-table-light" label="DataTable · THEME_LIGHT (live · 點標題排序、點列選取)" width={860} height="auto">
          <SCTableBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-table-dark" label="DataTable · THEME_DARK (live)" width={860} height="auto">
          <SCTableBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="dd-table-density-light" label="Density 三檔 · THEME_LIGHT (live)" width={860} height="auto">
          <SCTableDensityBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-table-density-dark" label="Density 三檔 · THEME_DARK (live)" width={860} height="auto">
          <SCTableDensityBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="dd-table-variant-light" label="分組 / 捲動 / 空狀態 · THEME_LIGHT (live)" width={860} height="auto">
          <SCTableVariantBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-table-variant-dark" label="分組 / 捲動 / 空狀態 · THEME_DARK (live)" width={860} height="auto">
          <SCTableVariantBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="dd-cells" title="Table Cells" subtitle="六型儲存格單獨檢視。column.type 決定預設對應，column.render 存在時優先。">
        <DCArtboard id="dd-cells-light" label="TableCell 系列 · THEME_LIGHT (live)" width={560} height="auto">
          <SCTableCellBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-cells-dark" label="TableCell 系列 · THEME_DARK (live)" width={560} height="auto">
          <SCTableCellBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="dd-kanban" title="Kanban" subtitle="看板欄與看板卡。欄寬 288 容得下 mono 編號加兩行標題；卡片狀態含拖曳與載入。">
        <DCArtboard id="dd-kanban-light" label="KanbanColumn · THEME_LIGHT (live)" width={1300} height="auto">
          <SCKanbanBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-kanban-dark" label="KanbanColumn · THEME_DARK (live)" width={1300} height="auto">
          <SCKanbanBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="dd-kanban-card-light" label="KanbanCard 狀態全集 · THEME_LIGHT (live)" width={1000} height="auto">
          <SCKanbanCardBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-kanban-card-dark" label="KanbanCard 狀態全集 · THEME_DARK (live)" width={1000} height="auto">
          <SCKanbanCardBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="dd-feedback" title="Empty & Notice" subtitle="無資料與權限過濾兩種提示。EmptyState 的 action 走 primary 實心鈕，FilterNotice 走 info / warning 兩 tone。">
        <DCArtboard id="dd-feedback-light" label="EmptyState / FilterNotice · THEME_LIGHT (live)" width={620} height="auto">
          <SCFeedbackBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="dd-feedback-dark" label="EmptyState / FilterNotice · THEME_DARK (live)" width={620} height="auto">
          <SCFeedbackBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 3 · Gantt & Nav
// ─────────────────────────────────────────────────────────────

const SC_WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

// 產生 GanttHeader / GanttTimeline 要的日資料。
// 形狀依元件檔約定：{ key, dayNumber, weekdayLabel, monthLabel, isHoliday,
// isMonthStart, isWeekStart, isToday }。週六日視為假日，週一為週起點。
function SC_buildDays(year, month, day, count, todayIndex) {
  const out = [];
  const cursor = new Date(year, month - 1, day);
  for (let i = 0; i < count; i += 1) {
    const w = cursor.getDay();
    out.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth() + 1}-${cursor.getDate()}`,
      dayNumber: cursor.getDate(),
      weekdayLabel: SC_WEEKDAY[w],
      monthLabel: `${cursor.getFullYear()} 年 ${cursor.getMonth() + 1} 月`,
      isHoliday: w === 0 || w === 6,
      isMonthStart: cursor.getDate() === 1,
      isWeekStart: w === 1,
      isToday: i === todayIndex,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

// 2026/08/24（週一）起 21 天，含 09/01 的月界。
const SC_DAYS = SC_buildDays(2026, 8, 24, 21, 3);

const SC_GANTT_ROWS = [
  { id: 'g1', title: '工單系統 · 列表畫面', meta: 'IGT-101', level: 0, start: 0,  span: 6, overrun: 0, duration: '6 天' },
  { id: 'g2', title: '檢視工具列',         meta: 'IGT-102', level: 1, start: 1,  span: 4, overrun: 0, duration: '4 天' },
  { id: 'g3', title: '工單表格',           meta: 'IGT-103', level: 1, start: 3,  span: 5, overrun: 2, duration: '5 天' },
  { id: 'g4', title: '看板畫面',           meta: 'IGT-110', level: 0, start: 9,  span: 7, overrun: 0, duration: '7 天' },
  { id: 'g5', title: '拖放狀態流轉',       meta: 'IGT-111', level: 2, start: 11, span: 2, overrun: 0, duration: '2 天' },
  { id: 'g6', title: '開發順序表',         meta: 'IGT-120', level: 0, empty: true },
];

// 左欄清單 + 右欄甘特，兩欄逐列對齊：共用同一個 density 與 rowHeight。
function SCGanttBoard({ theme, density = 'base' }) {
  const colors = resolveGanttColors(theme);
  const dims = GANTT_TOKENS.DENSITY[density];
  const listWidth = density === 'compact'
    ? GANTT_TOKENS.LIST_COLUMN_MIN_WIDTH
    : GANTT_TOKENS.LIST_COLUMN_WIDTH;

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column',
      border: `${BORDER_WIDTH.hairline}px solid ${colors.controlBorder}`,
      borderRadius: RADIUS.lg, overflow: 'hidden',
      background: colors.timelineBg,
    }}>
      <GanttHeader theme={theme} days={SC_DAYS} density={density}
        leading="2026 W35 – W37" leadingWidth={listWidth} />
      <div style={{ display: 'flex' }}>
        <div style={{
          width: listWidth, flexShrink: 0,
          borderRight: `${GANTT_TOKENS.MONTH_SEPARATOR_WIDTH}px solid ${colors.monthLine}`,
        }}>
          {SC_GANTT_ROWS.map((r, i) => (
            <SortableRow key={r.id} theme={theme} density={density}
              title={r.title} meta={r.meta} selected={i === 2} />
          ))}
        </div>
        <GanttTimeline theme={theme} days={SC_DAYS} rows={SC_GANTT_ROWS.length} density={density}>
          {SC_GANTT_ROWS.map((r, i) => (
            <GanttBar key={r.id} theme={theme} days={SC_DAYS} density={density}
              rowIndex={i} level={r.level} empty={r.empty}
              startIndex={r.start} span={r.span} overrunSpan={r.overrun}
              durationLabel={r.duration} selected={i === 2} onActivate={() => {}} />
          ))}
        </GanttTimeline>
      </div>
      <div style={{
        ...SC_type(TYPE_STYLES.caption), color: colors.textTertiary,
        padding: `${SPACING.xs}px ${SPACING.sm}px`,
        borderTop: `${GANTT_TOKENS.GRID_LINE_WIDTH}px solid ${colors.sectionLine}`,
        background: colors.headerBg,
      }}>
        density {density} · 列高 {dims.rowHeight} · 日格寬 {dims.dayWidth} · 長條高 {dims.barHeight}
      </div>
    </div>
  );
}

function SCGanttSection({ theme }) {
  return (
    <CompFrame theme={theme} style={{ display: 'block' }}>
      <CompLabel theme={theme}>
        左欄主題單清單、右欄甘特圖，兩欄共用同一個 density 值才逐列對齊。
        層級不動水平起訖（動了日期就對不上刻度），改用兩件事表達深度——長條每深一層薄一階、
        工期標籤在長條內左縮一階。IGT-103 帶超期偏離段（error 斜紋 + 「超期 +2」外掛標）；
        IGT-120 為空列，畫虛線與「尚未拆到該層深度」。第三列為 selected 態。
      </CompLabel>
      <div style={{ marginTop: SPACING.lg }}>
        <SCGanttBoard theme={theme} density="base" />
      </div>
    </CompFrame>
  );
}

function SCGanttDensitySection({ theme }) {
  return (
    <CompFrame theme={theme} style={{ display: 'block' }}>
      <CompLabel theme={theme}>
        密度三檔。日格寬窄到 DAY_LABEL_MIN_CELL_WIDTH 以下就只留星期字母、
        再窄則連日號都收，只剩刻度線與假日底。compact 的清單欄同步收到 LIST_COLUMN_MIN_WIDTH。
      </CompLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl, marginTop: SPACING.lg }}>
        <SCGanttBoard theme={theme} density="compact" />
        <SCGanttBoard theme={theme} density="relaxed" />
      </div>
    </CompFrame>
  );
}

function SCSortableRowBoard({ theme }) {
  const colors = resolveGanttColors(theme);
  const wrap = (caption, node) => (
    <div key={caption} style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
      <span style={{ ...SC_type(TYPE_STYLES.caption), color: theme.text.tertiary }}>{caption}</span>
      <div style={{
        width: GANTT_TOKENS.LIST_COLUMN_WIDTH,
        border: `${BORDER_WIDTH.hairline}px solid ${colors.controlBorder}`,
        borderRadius: RADIUS.md, background: colors.rowBg,
        padding: `${SPACING.sm}px 0`,
      }}>{node}</div>
    </div>
  );
  const row = (extra) => (
    <SortableRow theme={theme} title="工單表格 · 欄位設定" meta="IGT-103" onActivate={() => {}} {...extra} />
  );
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        主題單列。列高與同 density 的甘特列一致，兩欄才對得齊。
        hover 需滑鼠移入（底轉 state.hover.bg）、focus 需 Tab（outline 走 border.input）。
        dropIndicator 線首帶圓頭指出插入點，取 none / above / below。
      </CompLabel>
      <CompRow gap={SPACING.lg} align="flex-start">
        {wrap('default', row({}))}
        {wrap('selected', row({ selected: true }))}
        {wrap('dragging（抬起本體）', row({ dragging: true }))}
        {wrap('ghost（原位殘影）', row({ ghost: true }))}
        {wrap('disabled', row({ disabled: true }))}
        {wrap('dropIndicator above', row({ dropIndicator: 'above' }))}
        {wrap('dropIndicator below', row({ dropIndicator: 'below' }))}
        {wrap('無 meta', <SortableRow theme={theme} title="只有標題的主題單" onActivate={() => {}} />)}
      </CompRow>
      <CompGroup theme={theme} title="density 三檔" note="列高分別為 32 / 36 / 44，與甘特列同步">
        <CompRow gap={SPACING.lg} align="flex-start">
          {wrap('compact 32', row({ density: 'compact' }))}
          {wrap('base 36', row({ density: 'base' }))}
          {wrap('relaxed 44', row({ density: 'relaxed' }))}
        </CompRow>
      </CompGroup>
    </CompFrame>
  );
}

function SCSectionDividerBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        已排序區與未排序區的分隔。標題 + 計數；未排序區可帶 hint 說明收錄規則。
        拖曳跨區時 active 為真，上下兩條邊轉主色，指出這是可放置的區界。
      </CompLabel>
      <div style={{ width: GANTT_TOKENS.LIST_COLUMN_WIDTH * 2, display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
        <CompGroup theme={theme} title="標題 + 計數">
          <SectionDivider theme={theme} title="已排序" count={12} />
        </CompGroup>
        <CompGroup theme={theme} title="自訂計數文字">
          <SectionDivider theme={theme} title="已排序" count={12} countLabel="12 / 20" />
        </CompGroup>
        <CompGroup theme={theme} title="帶 hint">
          <SectionDivider theme={theme} title="未排序" count={8} hint="新建立且尚未排入順序的主題單" />
        </CompGroup>
        <CompGroup theme={theme} title="active（拖曳跨區中）">
          <SectionDivider theme={theme} title="未排序" count={8} hint="放開即移入本區" active />
        </CompGroup>
        <CompGroup theme={theme} title="無計數">
          <SectionDivider theme={theme} title="封存" />
        </CompGroup>
      </div>
    </CompFrame>
  );
}

function SCLevelSwitcherDemo({ theme, initial, disabled }) {
  const [v, setV] = React.useState(initial);
  return <LevelSwitcher theme={theme} levels={SC_LEVELS} value={v} onChange={setV} disabled={disabled} />;
}

function SCNavBoard({ theme }) {
  return (
    <CompFrame theme={theme}>
      <CompLabel theme={theme}>
        LevelSwitcher 形式定案為分段控制：層級是少數且固定的有序集合，攤平在工具列上一次點擊直達，
        也順帶當作深度的視覺尺規。Toolbar 為左中右三區容器，三區都可為空、center 溢出時內縮。
      </CompLabel>

      <CompGroup theme={theme} title="LevelSwitcher · 選中位置">
        <CompRow gap={SPACING.lg}>
          <CompCell theme={theme} caption="選中 主題"><SCLevelSwitcherDemo theme={theme} initial="epic" /></CompCell>
          <CompCell theme={theme} caption="選中 需求"><SCLevelSwitcherDemo theme={theme} initial="story" /></CompCell>
          <CompCell theme={theme} caption="選中 工項"><SCLevelSwitcherDemo theme={theme} initial="task" /></CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="LevelSwitcher · 停用">
        <CompRow gap={SPACING.lg}>
          <CompCell theme={theme} caption="整組 disabled">
            <LevelSwitcher theme={theme} levels={SC_LEVELS} value="story" disabled onChange={() => {}} />
          </CompCell>
          <CompCell theme={theme} caption="單顆 disabled">
            <LevelSwitcher theme={theme} value="epic" onChange={() => {}}
              levels={[SC_LEVELS[0], SC_LEVELS[1], { ...SC_LEVELS[2], disabled: true }]} />
          </CompCell>
        </CompRow>
      </CompGroup>

      <CompGroup theme={theme} title="Toolbar · 三區齊全" note="DevOrderScreen 的實境組合">
        <div style={{ border: `${BORDER_WIDTH.hairline}px solid ${resolveGanttColors(theme).controlBorder}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
          <Toolbar theme={theme}
            left={<React.Fragment>
              <Button theme={theme} variant="primary" size="sm" iconLeft="plus" label="新增主題單" />
              <SCSelectDemo theme={theme} prefix="排序" options={SC_SORT_OPTIONS} initial="key" size="sm" />
            </React.Fragment>}
            center={<SCLevelSwitcherDemo theme={theme} initial="story" />}
            right={<React.Fragment>
              <SCTextInputDemo theme={theme} placeholder="搜尋主題單" leadingIcon="search" size="sm" />
              <IconButton theme={theme} icon="columns" title="欄位顯示設定" size="md" />
            </React.Fragment>} />
        </div>
      </CompGroup>

      <CompGroup theme={theme} title="Toolbar · 缺區" note="三區都可為空，剩餘空間由 center 吃掉">
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          <div style={{ border: `${BORDER_WIDTH.hairline}px solid ${resolveGanttColors(theme).controlBorder}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
            <Toolbar theme={theme} left={<Button theme={theme} variant="ghost" size="sm" iconLeft="chevron-right" label="返回" />} />
          </div>
          <div style={{ border: `${BORDER_WIDTH.hairline}px solid ${resolveGanttColors(theme).controlBorder}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
            <Toolbar theme={theme} center={<SCLevelSwitcherDemo theme={theme} initial="task" />} />
          </div>
          <div style={{ border: `${BORDER_WIDTH.hairline}px solid ${resolveGanttColors(theme).controlBorder}`, borderRadius: RADIUS.lg, overflow: 'hidden' }}>
            <Toolbar theme={theme} right={<IconButton theme={theme} icon="dots" title="更多" />} />
          </div>
        </div>
      </CompGroup>
    </CompFrame>
  );
}

function ComponentsGanttNavSection() {
  return (
    <DCSection
      id="comp-gantt-nav"
      title="Components · Gantt & Nav"
      subtitle="甘特與導航組，服務 DevOrderScreen（開發順序表）。左欄主題單清單拖拉排序、右欄甘特圖依日曆天檢視各層級工單排程，兩欄逐列對齊。對應 token 表見 Foundations > Component Tokens > Gantt Tokens。假日視覺在此定案——只用底色成塊，不加邊框、不加斜紋，讓長條與偏離斜紋獨佔圖樣語彙。"
    >
      <DCFamily id="gn-gantt" title="Gantt" subtitle="GanttHeader + GanttTimeline + GanttBar 三件合成的甘特檢視。示範資料為 2026/08/24 起 21 天，含 09/01 月界與週末假日。">
        <DCArtboard id="gn-gantt-light" label="甘特檢視 · THEME_LIGHT (live)" width={920} height="auto">
          <SCGanttSection theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="gn-gantt-dark" label="甘特檢視 · THEME_DARK (live)" width={920} height="auto">
          <SCGanttSection theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="gn-gantt-density-light" label="密度 compact / relaxed · THEME_LIGHT (live)" width={1140} height="auto">
          <SCGanttDensitySection theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="gn-gantt-density-dark" label="密度 compact / relaxed · THEME_DARK (live)" width={1140} height="auto">
          <SCGanttDensitySection theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="gn-rows" title="Rows & Sections" subtitle="SortableRow 與 SectionDivider。拖曳相關狀態（dragging / ghost / drop indicator）以靜態 prop 並排呈現，不需真的拖。">
        <DCArtboard id="gn-sortable-light" label="SortableRow 狀態全集 · THEME_LIGHT (live)" width={1120} height="auto">
          <SCSortableRowBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="gn-sortable-dark" label="SortableRow 狀態全集 · THEME_DARK (live)" width={1120} height="auto">
          <SCSortableRowBoard theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="gn-divider-light" label="SectionDivider · THEME_LIGHT (live)" width={560} height="auto">
          <SCSectionDividerBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="gn-divider-dark" label="SectionDivider · THEME_DARK (live)" width={560} height="auto">
          <SCSectionDividerBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily id="gn-nav" title="Navigation" subtitle="LevelSwitcher 與 Toolbar。Toolbar 的實境卡片同時吃基礎控件組的 Button / Select / TextInput / IconButton，驗兩組元件並置的高度與色階是否成立。">
        <DCArtboard id="gn-nav-light" label="LevelSwitcher / Toolbar · THEME_LIGHT (live)" width={760} height="auto">
          <SCNavBoard theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="gn-nav-dark" label="LevelSwitcher / Toolbar · THEME_DARK (live)" width={760} height="auto">
          <SCNavBoard theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  ComponentsControlsSection,
  ComponentsDataDisplaySection,
  ComponentsGanttNavSection,
  CompFrame, CompLabel, CompGroup, CompRow, CompCell,
});
