// ─────────────────────────────────────────────────────────────
// KanbanScreen · 看板畫面
//
// 角色：依 Status 分欄呈現工單，拖曳卡片完成狀態轉換。桌面瀏覽器畫面，
// 寬度基準 1280。欄集合不隨結案原因增加——結案原因是拖入終止欄時的一次選擇，
// 不開欄。
//
// 對側 spec：no3_product_specs/no1_issue_system/no2_screens/no2_kanban_screen.md
// 引用的 Logic：applyViewFilter、buildKanbanColumns、filterViewByPermission、
//               getResolutionOptions、changeIssueStatus
//               （皆為 no3_logics/no4_workflow_logic.md 與 no7_view_logic.md）
//
// 消費元件：
//   20_components/no3_gantt_nav.jsx — Toolbar（工具列容器，左中右三區）
//   20_components/no1_controls.jsx  — Select（資料來源）、TextInput（搜尋）、
//                                     Button（篩選入口、結案原因的取消與確認）、Chip（已套用篩選）
//   20_components/no2_data_display.jsx — KanbanColumn、KanbanCard、FilterNotice、EmptyState
//
// 本檔自定義的區域性小元件（既有元件組無對應、且只服務本畫面）：
//   KanbanDropSlot        目標欄的放置指示槽。虛線框 + 落點說明
//   KanbanDragOverlay     拖曳中被抬起的卡片。錨在目標欄上、負偏移做出「浮在欄間」
//   KanbanResolutionPrompt 拖入終止欄後的結案原因選擇浮層
//
// 硬規（與元件檔同源）：
//   - 一切視覺值走 KANBAN_SCREEN_TOKENS 與既有 token 階梯，本檔無 hex、無裸數字；
//     視覺校準例外標 // (literal: <原因>)
//   - 元件一律吃 theme 參數，THEME_LIGHT 與 THEME_DARK 同一份程式碼都能渲染
//
// Variants（variant prop）：
//   default     四欄正常資料。資料來源含開發與缺陷兩型別，同名狀態已合欄
//   dragging    拖曳中。來源欄留殘影、目標欄轉放置態並出現放置指示槽
//   resolution  拖入終止欄。結案原因選擇浮層 + 另一張卡的狀態寫入載入態
//   empty       五欄。資料來源多納入規格型別，多出的「待審查」欄無卡片
// ─────────────────────────────────────────────────────────────

// ─── 畫面組成參數 ─────────────────────────────────────────────
// 只承載「本畫面怎麼組」的值；元件內部尺寸留在 DATA_DISPLAY_TOKENS。
const KANBAN_SCREEN_TOKENS = {
  CANVAS_WIDTH:            1280,                       // (literal: 桌面瀏覽器基準寬)
  CANVAS_MIN_HEIGHT:       720,                        // (literal: 桌面基準高，配 1280 寬)

  PADDING_X:               SPACING.xl,                 // 24
  PADDING_BOTTOM:          SPACING.lg,                 // 16
  FILTER_BAR_PADDING_Y:    SPACING.sm,
  FILTER_BAR_GAP:          SPACING.sm,
  NOTICE_MARGIN_BOTTOM:    SPACING.sm,

  VIEW_TITLE_TYPE:         TYPE_STYLES.bodyMedium,     // 檢視名稱
  META_TYPE:               TYPE_STYLES.caption,        // 合欄說明等附註
  SEARCH_WIDTH:            SPACING.xl * 14,            // 336，搜尋框在工具列中段的定寬

  BOARD_GAP:               DATA_DISPLAY_TOKENS.KANBAN.COLUMN_GAP,
  COLUMN_BODY_MAX_HEIGHT:  SPACING['4xl'] * 10,        // 480，欄內捲動，板面高度不被最長欄撐爆

  // 放置指示槽：高度取一張兩行標題卡的視覺高，落點才不會在放開時位移。
  DROP_SLOT_HEIGHT:        SPACING['4xl'] + SPACING.xl,  // 72
  DROP_SLOT_RADIUS:        DATA_DISPLAY_TOKENS.KANBAN.CARD_RADIUS,
  DROP_SLOT_BORDER_WIDTH:  BORDER_WIDTH.focus,
  DROP_SLOT_TYPE:          TYPE_STYLES.caption,

  // 拖曳中卡片：錨在目標欄容器上，以負偏移浮到來源欄與目標欄之間。
  DRAG_OVERLAY_LEFT:       -SPACING['4xl'],            // -48
  DRAG_OVERLAY_TOP:        SPACING['3xl'],             // 40
  DRAG_OVERLAY_WIDTH:      DATA_DISPLAY_TOKENS.KANBAN.COLUMN_WIDTH - SPACING.xl * 2,  // 240

  // 結案原因浮層：比欄寬左右各外擴一階，讀作蓋在欄上的面板而非欄內內容。
  PROMPT_TOP:              DATA_DISPLAY_TOKENS.KANBAN.COLUMN_HEADER_HEIGHT + SPACING.md,
  PROMPT_SIDE_OVERHANG:    SPACING.md,
  PROMPT_PADDING:          SPACING.md,
  PROMPT_GAP:              SPACING.sm,
  PROMPT_RADIUS:           RADIUS.lg,
  PROMPT_BORDER_WIDTH:     BORDER_WIDTH.hairline,
  PROMPT_ELEVATION:        SHADOW.level3,
  PROMPT_TITLE_TYPE:       TYPE_STYLES.bodyMedium,
  PROMPT_SUBTITLE_TYPE:    TYPE_STYLES.caption,
  PROMPT_HINT_TYPE:        TYPE_STYLES.caption,
  PROMPT_OPTION_HEIGHT:    CONTROL_HEIGHT.lg,          // 32
  PROMPT_OPTION_PADDING_X: SPACING.sm,
  PROMPT_OPTION_GAP:       SPACING.sm,
  PROMPT_OPTION_RADIUS:    RADIUS.sm,
  PROMPT_OPTION_TYPE:      TYPE_STYLES.bodySm,
  PROMPT_RADIO_SIZE:       ICON_SIZE.md,               // 16
  PROMPT_RADIO_DOT_SIZE:   SPACING.sm,                 // 8
  PROMPT_RADIO_BORDER:     BORDER_WIDTH.hairline,
  PROMPT_DIVIDER_WIDTH:    BORDER_WIDTH.hairline,
  PROMPT_FOOTER_GAP:       SPACING.sm,
  PROMPT_FOOTER_MARGIN_TOP: SPACING.xs,

  SCRIM_OPACITY:           0.32,                       // (literal: 浮層開啟時板面的壓暗程度)
  Z_SCRIM:                 1,                          // (literal: 疊層序，以下三鍵成組)
  Z_ANCHOR_COLUMN:         2,                          // (literal: 承載浮層的欄要蓋過 scrim)
  Z_DRAG_OVERLAY:          3,                          // (literal: 抬起的卡片永遠在最上層)

  TRANSITION_MS:           MOTION.duration.fast,
  TRANSITION_EASING:       MOTION.easing.standard,
};

// ─── 內部工具（KS_ 前綴避免與元件組的同名 helper 相撞）────────

function KS_type(style, extra) {
  return {
    fontSize: style.size,
    fontWeight: style.weight,
    lineHeight: `${style.lineHeight}px`,
    letterSpacing: style.letterSpacing,
    ...(extra || {}),
  };
}

function KS_hexToRgba(hex, alpha) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

function KS_shadow(shadowColor, level) {
  if (!level || (level.offsetY === 0 && level.blur === 0)) return 'none';
  return `0 ${level.offsetY}px ${level.blur}px 0 ${KS_hexToRgba(shadowColor, level.opacity)}`;
}

// ─── 擬真資料 ─────────────────────────────────────────────────
// 各工單型別的流程狀態清單，順序即 WorkflowStates.sortOrder。
// isTerminal 只掛在終止狀態上，看板據此判斷拖入時要不要問結案原因。
const KANBAN_SCREEN_TYPES = {
  dev:  { id: 'dev',  label: '開發', states: ['待處理', '處理中', '待驗收', '已關閉'] },
  bug:  { id: 'bug',  label: '缺陷', states: ['待處理', '處理中', '已關閉'] },
  spec: { id: 'spec', label: '規格', states: ['待處理', '待審查', '處理中', '已關閉'] },
};
const KANBAN_SCREEN_TERMINAL_STATE = '已關閉';

// getResolutionOptions 的產出。結案原因隨型別各一份，本畫面示意用開發型別那份。
const KANBAN_SCREEN_RESOLUTIONS = [
  { id: 'done',      label: '已完成', tone: 'success' },
  { id: 'wontfix',   label: '不做',   tone: 'neutral' },
  { id: 'duplicate', label: '重複',   tone: 'neutral' },
  { id: 'cantrepro', label: '無法重現', tone: 'warning' },
];

// applyViewFilter 過後的工單。status 對應欄、resolution 只有終止狀態的工單才有。
const KANBAN_SCREEN_ISSUES = [
  { key: 'DEV-241', type: 'dev',  status: '待處理', title: '看板拖曳釋放後的狀態寫入', assignee: '陳彥廷', due: { label: '08/12', tone: 'soon' } },
  { key: 'BUG-88',  type: 'bug',  status: '待處理', title: '篩選條件清空後工具列仍殘留 chip', assignee: '林珮瑜', due: { label: '08/08', tone: 'overdue' } },
  { key: 'DEV-247', type: 'dev',  status: '待處理', title: '檢視欄位顯示設定的持久化', assignee: '黃俊翔', due: { label: '08/21' } },
  { key: 'SPEC-31', type: 'spec', status: '待處理', title: '工單集分享對象的權限矩陣', assignee: '蘇曉萱', due: { label: '08/19' } },

  { key: 'DEV-238', type: 'dev',  status: '處理中', title: '結案原因選單接 getResolutionOptions', assignee: '陳彥廷', due: { label: '08/09', tone: 'soon' } },
  { key: 'BUG-91',  type: 'bug',  status: '處理中', title: '權限濾除筆數與實際被濾工單不符', assignee: '林珮瑜', due: { label: '08/07', tone: 'overdue' } },
  { key: 'DEV-244', type: 'dev',  status: '處理中', title: '甘特列高與主題單列高不對齊', assignee: '黃俊翔', due: { label: '08/15' } },
  { key: 'SPEC-27', type: 'spec', status: '處理中', title: '日曆與工作日定義的欄位邊界', assignee: '蘇曉萱', due: { label: '08/14' } },

  { key: 'DEV-233', type: 'dev',  status: '待驗收', title: '工單編號流水序跨型別重複', assignee: '陳彥廷', due: { label: '08/11', tone: 'soon' } },
  { key: 'DEV-229', type: 'dev',  status: '待驗收', title: '狀態轉換禁止原因的回傳承載格式', assignee: '黃俊翔', due: { label: '08/18' } },

  { key: 'DEV-225', type: 'dev',  status: '已關閉', title: '看板欄集合改由型別狀態聯集產出', assignee: '陳彥廷', resolution: 'done' },
  { key: 'BUG-84',  type: 'bug',  status: '已關閉', title: '深色主題下 badge 文字對比不足', assignee: '林珮瑜', resolution: 'done' },
  { key: 'DEV-218', type: 'dev',  status: '已關閉', title: '看板依結案原因分欄', assignee: '黃俊翔', resolution: 'wontfix' },
  { key: 'BUG-79',  type: 'bug',  status: '已關閉', title: '拖曳把手在 Safari 無反應', assignee: '蘇曉萱', resolution: 'duplicate' },
];

// buildKanbanColumns 的看板端讀法。
// 依 spec：多型別時取各型別狀態清單的聯集、同名狀態合併為同一欄、重複狀態取最先
// 出現的位置。新狀態的插入位置 spec 未明寫，此處採「插在第一個已存在的後繼狀態之前」，
// 保序合併——否則規格型別的「待審查」會被推到「已關閉」之後、終止欄不在末位。
function KS_buildKanbanColumns(typeIds) {
  const order = [];
  typeIds.forEach((typeId) => {
    const states = KANBAN_SCREEN_TYPES[typeId].states;
    states.forEach((state, index) => {
      if (order.includes(state)) return;
      const successor = states.slice(index + 1).find((s) => order.includes(s));
      const at = successor ? order.indexOf(successor) : order.length;
      order.splice(at, 0, state);
    });
  });
  return order.map((label) => ({
    id: label,
    label,
    isTerminal: label === KANBAN_SCREEN_TERMINAL_STATE,
  }));
}

const KANBAN_SCREEN_VARIANTS = ['default', 'dragging', 'resolution', 'empty'];

// 各 variant 的資料來源與進行中的操作。sourceTypes 決定欄集合，
// 其餘欄位描述「此刻畫面上有什麼操作正在發生」。
const KANBAN_SCREEN_VARIANT_CONFIG = {
  default: {
    sourceId: 'quarter',
    sourceTypes: ['dev', 'bug'],
    filteredCount: 3,
  },
  dragging: {
    sourceId: 'quarter',
    sourceTypes: ['dev', 'bug'],
    filteredCount: 3,
    dragIssueKey: 'DEV-238',        // 來源欄留殘影的那張
    dropColumnId: '待驗收',
  },
  resolution: {
    sourceId: 'quarter',
    sourceTypes: ['dev', 'bug'],
    filteredCount: 3,
    dragIssueKey: 'DEV-233',        // 已放開、等結案原因，取消則留在原欄
    dropColumnId: '已關閉',
    loadingIssueKey: 'DEV-244',     // 另一張已確認、changeIssueStatus 寫入中
  },
  empty: {
    sourceId: 'all',
    sourceTypes: ['dev', 'bug', 'spec'],
    filteredCount: 0,               // 無被濾工單 → 權限過濾標示整區不顯示
  },
};

// 工具列的資料來源選項。檢視的 sourceMgmtIds 選什麼，就決定涉及哪些工單型別，
// 型別集合再決定欄集合——本畫面「換資料來源會換欄數」的因果鏈起點。
const KANBAN_SCREEN_SOURCES = [
  { value: 'quarter', label: '本季開發（開發 + 缺陷）' },
  { value: 'all',     label: '全產品（開發 + 缺陷 + 規格）' },
  { value: 'mine',    label: '我追蹤的工單' },
];

// ─── KanbanDropSlot · 放置指示槽 ──────────────────────────────
// 目標欄內的落點。虛線框吃 state.selected.border，與 KanbanColumn 的 dropTarget
// 邊框同色，兩者讀作同一組「這裡可以放」的訊號。
function KanbanDropSlot({ theme, label }) {
  const K = KANBAN_SCREEN_TOKENS;
  const c = DATA_DISPLAY_COLORS.KANBAN(theme);
  return (
    <div
      role="presentation"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: K.DROP_SLOT_HEIGHT, flexShrink: 0,
        border: `${K.DROP_SLOT_BORDER_WIDTH}px dashed ${c.dropTargetBorder}`,
        borderRadius: K.DROP_SLOT_RADIUS,
        background: 'transparent',
        color: theme.state.selected.fg,
        fontFamily: FONT_FAMILY.base,
        ...KS_type(K.DROP_SLOT_TYPE),
      }}
    >
      {label}
    </div>
  );
}

// ─── KanbanDragOverlay · 抬起中的卡片 ─────────────────────────
// 錨在目標欄容器上、以負偏移浮到欄間。卡片本體仍是 KanbanCard，
// 抬起的陰影、放大與傾角由 KanbanCard 的 dragging 態負責。
function KanbanDragOverlay({ theme, issue }) {
  const K = KANBAN_SCREEN_TOKENS;
  return (
    <div
      style={{
        position: 'absolute',
        left: K.DRAG_OVERLAY_LEFT, top: K.DRAG_OVERLAY_TOP,
        width: K.DRAG_OVERLAY_WIDTH,
        zIndex: K.Z_DRAG_OVERLAY,
        pointerEvents: 'none',
      }}
    >
      <KanbanCard
        theme={theme}
        issueKey={issue.key}
        title={issue.title}
        assignee={issue.assignee}
        due={issue.due}
        dragging
        draggable={false}
      />
    </div>
  );
}

// ─── KanbanResolutionPrompt · 結案原因選擇 ────────────────────
// 拖入終止欄釋放後出現。選項資料由 getResolutionOptions 產出。
// 未選任何原因時「確認結案」停用——對應 validateStatusTransition 的
// 「目標狀態為終止狀態且結案原因未提供則禁止」，把禁止原因擋在送出之前。
// 取消則卡片留在原欄，浮層收起、不呼叫 changeIssueStatus。
function KanbanResolutionPrompt({ theme, issue, targetLabel, options = [], onCancel, onConfirm }) {
  const K = KANBAN_SCREEN_TOKENS;
  const [picked, setPicked] = React.useState(null);
  const [hovered, setHovered] = React.useState(null);

  return (
    <div
      role="dialog"
      aria-label="選擇結案原因"
      style={{
        position: 'absolute',
        top: K.PROMPT_TOP,
        left: -K.PROMPT_SIDE_OVERHANG,
        right: -K.PROMPT_SIDE_OVERHANG,
        display: 'flex', flexDirection: 'column', gap: K.PROMPT_GAP,
        padding: K.PROMPT_PADDING,
        background: theme.bg.surface,
        border: `${K.PROMPT_BORDER_WIDTH}px solid ${theme.border.base}`,
        borderRadius: K.PROMPT_RADIUS,
        boxShadow: KS_shadow(theme.shadow.color, K.PROMPT_ELEVATION),
        fontFamily: FONT_FAMILY.base,
      }}
    >
      <div style={{ ...KS_type(K.PROMPT_TITLE_TYPE), color: theme.text.primary }}>
        選擇結案原因
      </div>
      <div style={{ ...KS_type(K.PROMPT_SUBTITLE_TYPE), color: theme.text.secondary }}>
        <span style={{ fontFamily: FONT_FAMILY.mono, fontVariantNumeric: NUMERIC_FONT_VARIANT, color: theme.primary.main }}>
          {issue.key}
        </span>
        {` 拖入 ${targetLabel}`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {options.map((option) => {
          const active = picked === option.id;
          const live = hovered === option.id && !active;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setPicked(option.id)}
              onMouseEnter={() => setHovered(option.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: K.PROMPT_OPTION_GAP,
                height: K.PROMPT_OPTION_HEIGHT,
                padding: `0 ${K.PROMPT_OPTION_PADDING_X}px`,
                border: 'none', borderRadius: K.PROMPT_OPTION_RADIUS,
                background: active ? theme.state.selected.bg : live ? theme.state.hover.bg : 'transparent',
                color: active ? theme.state.selected.fg : theme.text.primary,
                cursor: 'pointer', textAlign: 'left',
                fontFamily: FONT_FAMILY.base,
                ...KS_type(K.PROMPT_OPTION_TYPE),
                transition: `background ${K.TRANSITION_MS}ms ${K.TRANSITION_EASING}`,
              }}
            >
              <span style={{
                width: K.PROMPT_RADIO_SIZE, height: K.PROMPT_RADIO_SIZE, flexShrink: 0,
                borderRadius: RADIUS.full,
                border: `${K.PROMPT_RADIO_BORDER}px solid ${active ? theme.state.selected.border : theme.border.input}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && (
                  <span style={{
                    width: K.PROMPT_RADIO_DOT_SIZE, height: K.PROMPT_RADIO_DOT_SIZE,
                    borderRadius: RADIUS.full, background: theme.state.selected.border,
                  }} />
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>{option.label}</span>
              <Badge theme={theme} tone={option.tone} label="Resolution" dot={false} />
            </button>
          );
        })}
      </div>

      <div style={{
        ...KS_type(K.PROMPT_HINT_TYPE),
        color: picked ? theme.text.tertiary : theme.status.warning_fg,
        borderTop: `${K.PROMPT_DIVIDER_WIDTH}px solid ${theme.divider.base}`,
        paddingTop: K.PROMPT_GAP,
      }}>
        {picked ? '確認後寫入 Resolution 與 Status，卡片移至目標欄。' : '終止狀態必填結案原因，未選不得送出。'}
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: K.PROMPT_FOOTER_GAP,
        marginTop: K.PROMPT_FOOTER_MARGIN_TOP,
      }}>
        <Button theme={theme} variant="ghost" size="sm" label="取消" onClick={onCancel} />
        <Button
          theme={theme} variant="primary" size="sm" label="確認結案"
          disabled={!picked}
          onClick={() => onConfirm && onConfirm(picked)}
        />
      </div>
    </div>
  );
}

// ─── KanbanScreen · 畫面本體 ──────────────────────────────────
function KanbanScreen({ theme = DEFAULT_THEME, variant = 'default' }) {
  const K = KANBAN_SCREEN_TOKENS;
  const KC = DATA_DISPLAY_TOKENS.KANBAN;
  const config = KANBAN_SCREEN_VARIANT_CONFIG[variant] || KANBAN_SCREEN_VARIANT_CONFIG.default;

  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState(config.sourceId);
  const [chips, setChips] = React.useState([
    { id: 'assignee', label: '負責人', value: '我' },
    { id: 'priority', label: '優先序', value: '高' },
  ]);
  const [promptOpen, setPromptOpen] = React.useState(true);

  // 欄集合與欄序由 buildKanbanColumns 產出；資料來源涉及的型別是唯一輸入。
  const columns = KS_buildKanbanColumns(config.sourceTypes);
  const issues = KANBAN_SCREEN_ISSUES.filter((issue) => config.sourceTypes.includes(issue.type));
  const dragIssue = config.dragIssueKey
    ? issues.find((issue) => issue.key === config.dragIssueKey)
    : null;
  const showPrompt = variant === 'resolution' && promptOpen && dragIssue;

  const resolutionOf = (issue) => KANBAN_SCREEN_RESOLUTIONS.find((r) => r.id === issue.resolution);

  const renderCard = (issue) => {
    const resolution = resolutionOf(issue);
    return (
      <KanbanCard
        key={issue.key}
        theme={theme}
        issueKey={issue.key}
        title={issue.title}
        assignee={issue.assignee}
        due={resolution ? undefined : issue.due}
        // 終止欄的卡片改掛結案原因：Status 已由欄承載，卡上再標一次沒有資訊量，
        // Resolution 才是這一欄真正要看的狀態資訊。
        status={resolution ? { label: resolution.label, tone: resolution.tone } : undefined}
        ghost={dragIssue ? issue.key === dragIssue.key : false}
        loading={config.loadingIssueKey === issue.key}
      />
    );
  };

  return (
    <div style={{
      width: K.CANVAS_WIDTH, minHeight: K.CANVAS_MIN_HEIGHT,
      display: 'flex', flexDirection: 'column',
      background: theme.bg.base, color: theme.text.primary,
      fontFamily: FONT_FAMILY.base,
    }}>
      {/* 工具列：資料來源與篩選 */}
      <Toolbar
        theme={theme}
        left={
          <React.Fragment>
            <span style={{ ...KS_type(K.VIEW_TITLE_TYPE), color: theme.text.primary, whiteSpace: 'nowrap' }}>
              工單看板
            </span>
            <Select
              theme={theme}
              prefix="資料來源"
              options={KANBAN_SCREEN_SOURCES}
              value={source}
              onChange={setSource}
            />
          </React.Fragment>
        }
        center={
          <TextInput
            theme={theme}
            leadingIcon="search"
            placeholder="搜尋工單編號或標題"
            value={search}
            onChange={setSearch}
            style={{ width: K.SEARCH_WIDTH }}
          />
        }
        right={<Button theme={theme} variant="ghost" iconLeft="filter" label="篩選條件" />}
      />

      {/* 已套用篩選 + 合欄說明 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: K.FILTER_BAR_GAP, flexWrap: 'wrap',
        padding: `${K.FILTER_BAR_PADDING_Y}px ${K.PADDING_X}px`,
      }}>
        {chips.map((chip) => (
          <Chip
            key={chip.id}
            theme={theme}
            label={chip.label}
            value={chip.value}
            onRemove={() => setChips((prev) => prev.filter((c) => c.id !== chip.id))}
          />
        ))}
        <span style={{ marginLeft: 'auto', ...KS_type(K.META_TYPE), color: theme.text.tertiary }}>
          {`資料來源含 ${config.sourceTypes.length} 種型別，同名狀態合為同一欄 · 共 ${columns.length} 欄`}
        </span>
      </div>

      {/* 權限過濾標示：被濾筆數為 0 時 FilterNotice 自身不渲染 */}
      <div style={{ padding: `0 ${K.PADDING_X}px`, marginBottom: config.filteredCount ? K.NOTICE_MARGIN_BOTTOM : 0 }}>
        <FilterNotice theme={theme} count={config.filteredCount} reason="無讀取權" />
      </div>

      {/* 看板欄區：依 Status 分欄，欄數不隨結案原因增加 */}
      <div style={{
        position: 'relative', flex: 1,
        display: 'flex', alignItems: 'flex-start', gap: K.BOARD_GAP,
        padding: `0 ${K.PADDING_X}px ${K.PADDING_BOTTOM}px`,
        overflowX: 'auto',
      }}>
        {showPrompt && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: K.Z_SCRIM,
            background: KS_hexToRgba(theme.shadow.color, K.SCRIM_OPACITY),
          }} />
        )}

        {columns.map((column) => {
          const cards = issues.filter((issue) => issue.status === column.id);
          const isDropTarget = config.dropColumnId === column.id;
          const isPromptAnchor = showPrompt && isDropTarget;
          return (
            <div
              key={column.id}
              style={{
                position: 'relative', flexShrink: 0,
                zIndex: isPromptAnchor ? K.Z_ANCHOR_COLUMN : undefined,
              }}
            >
              <KanbanColumn
                theme={theme}
                title={column.label}
                count={cards.length}
                isDropTarget={isDropTarget}
                maxHeight={K.COLUMN_BODY_MAX_HEIGHT}
              >
                {isDropTarget && (
                  <KanbanDropSlot
                    theme={theme}
                    label={showPrompt ? '等待結案原因' : `放到「${column.label}」`}
                  />
                )}
                {cards.length === 0 && !isDropTarget ? (
                  <EmptyState
                    theme={theme}
                    compact
                    title="這一欄沒有工單"
                    description="拖曳其他欄的卡片進來，或調整篩選條件。"
                  />
                ) : (
                  cards.map(renderCard)
                )}
              </KanbanColumn>

              {/* 拖曳中：抬起的卡片浮在來源欄與目標欄之間 */}
              {variant === 'dragging' && isDropTarget && dragIssue && (
                <KanbanDragOverlay theme={theme} issue={dragIssue} />
              )}

              {/* 拖入終止欄：結案原因選擇 */}
              {isPromptAnchor && (
                <KanbanResolutionPrompt
                  theme={theme}
                  issue={dragIssue}
                  targetLabel={column.label}
                  options={KANBAN_SCREEN_RESOLUTIONS}
                  onCancel={() => setPromptOpen(false)}
                  onConfirm={() => setPromptOpen(false)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Canvas section · Screens > KanbanScreen
// 四個 variant × 兩主題共八張 artboard，皆為 live JSX。
// variant 不另佔 TOC leaf：同一 section 內以 family 分群並陳，
// 拖曳態與結案原因浮層在卡上直接可點。
// dark 卡直接畫在 THEME_DARK.bg.base 上，不靠 canvas 白底掩護。
// ─────────────────────────────────────────────────────────────
function ScreenKanbanSection() {
  const W = KANBAN_SCREEN_TOKENS.CANVAS_WIDTH;
  return (
    <DCSection
      id="screen-kanban"
      title="KanbanScreen · 工單看板"
      subtitle="對側 spec：no2_screens/no2_kanban_screen.md。欄集合由資料來源涉及的型別聯集產出，同名狀態合欄；結案原因不開欄，只在拖入終止欄時問一次。"
    >
      <DCFamily
        id="ks-standard" title="Default"
        subtitle="開發 + 缺陷兩型別，四欄。終止欄的卡片改掛結案原因，Status 已由欄承載。工具列可切資料來源、篩選 chip 可移除。"
      >
        <DCArtboard id="ks-default-light" label="default · THEME_LIGHT (live)" width={W} height="auto">
          <KanbanScreen variant="default" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ks-default-dark" label="default · THEME_DARK (live)" width={W} height="auto">
          <KanbanScreen variant="default" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="ks-drag" title="Drag & Drop"
        subtitle="dragging 為拖曳中：來源欄留殘影、目標欄轉放置態並出現放置指示槽。resolution 為拖入終止欄後的結案原因浮層，未選原因時確認鈕停用；另一張卡示意 changeIssueStatus 寫入中的載入態。"
      >
        <DCArtboard id="ks-dragging-light" label="dragging · THEME_LIGHT (live)" width={W} height="auto">
          <KanbanScreen variant="dragging" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ks-dragging-dark" label="dragging · THEME_DARK (live)" width={W} height="auto">
          <KanbanScreen variant="dragging" theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="ks-resolution-light" label="resolution · THEME_LIGHT (live · 可選原因)" width={W} height="auto">
          <KanbanScreen variant="resolution" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ks-resolution-dark" label="resolution · THEME_DARK (live · 可選原因)" width={W} height="auto">
          <KanbanScreen variant="resolution" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="ks-boundary" title="Boundary"
        subtitle="資料來源多納入規格型別，欄集合由四欄長成五欄；多出的「待審查」欄無卡片，欄內走 compact 空狀態。無被濾工單，權限過濾標示整區不顯示。"
      >
        <DCArtboard id="ks-empty-light" label="empty · THEME_LIGHT (live)" width={W} height="auto">
          <KanbanScreen variant="empty" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="ks-empty-dark" label="empty · THEME_DARK (live)" width={W} height="auto">
          <KanbanScreen variant="empty" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  KanbanScreen, ScreenKanbanSection,
  KanbanDropSlot, KanbanDragOverlay, KanbanResolutionPrompt,
  KANBAN_SCREEN_TOKENS, KANBAN_SCREEN_TYPES, KANBAN_SCREEN_ISSUES,
  KANBAN_SCREEN_RESOLUTIONS, KANBAN_SCREEN_SOURCES,
  KANBAN_SCREEN_VARIANTS, KANBAN_SCREEN_VARIANT_CONFIG,
});
