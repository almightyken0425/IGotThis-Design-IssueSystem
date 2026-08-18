// ─────────────────────────────────────────────────────────────
// IssueDetailScreen · 私有 sub-section 與示例資料
//
// 本檔只服務 no5_issue_detail_screen.jsx，不對其他畫面開放。分兩段：
// 欄位配方 / 工單 / 關聯 / 異動歷史的示例資料，以及本畫面私有的複合元件。
// 元件庫（20_components/）目前沒有時間軸列表、詳情面板這類形狀，
// 故留在畫面私有層級。
//
// 命名前綴 IssueDetail（元件）與 issueDetail（helper 函式），
// 避免與其他畫面 / 元件檔的全域名稱相撞。
// ─────────────────────────────────────────────────────────────

// TYPE_STYLES 的一條 → React inline style。
function issueDetailType(style) {
  return {
    fontSize: style.size,
    fontWeight: style.weight,
    lineHeight: `${style.lineHeight}px`,
    letterSpacing: style.letterSpacing,
  };
}

// 任意欄位值 → 可讀文字；null/undefined/空字串統一顯示「(無)」，
// 對齊 Spec 線框圖異動歷史列的空值表示法（"Assignee (無) → 成員甲"）。
function issueDetailDisplayValue(value) {
  if (value === null || value === undefined || value === '') return '(無)';
  return String(value);
}

// ─── 欄位配方（fixture）───────────────────────────────────────
// 型別配方的單值欄位定義。label 直接對齊 Spec 線框圖使用的英文欄位名
// （Title / Status / Resolution / Assignee / StoryPoint），Reporter 與
// CreatedAt 補齊「全部單值欄位」不只五個的情境，也讓 readonly-heavy
// variant 有足夠筆數對比。
//
// Status 不吃這裡的 readonly——畫面本體的 renderField 內，Status 一律走
// Select + changeIssueStatus，不受欄位定義的 readonly 影響，對應 Spec
// 「編輯 Status」自成一段、不併入「編輯一般欄位值」的 readonly 分支。
const ISSUE_DETAIL_FIELD_DEFS_DEFAULT = [
  { name: 'title',      label: 'Title',      readonly: false },
  { name: 'status',     label: 'Status',     readonly: false },
  { name: 'resolution', label: 'Resolution', readonly: true },
  { name: 'assignee',   label: 'Assignee',   readonly: false },
  { name: 'point',      label: 'StoryPoint', readonly: false },
  { name: 'reporter',   label: 'Reporter',   readonly: true },
  { name: 'createdAt',  label: 'CreatedAt',  readonly: true },
];

// readonly-heavy 型別配方：僅 Title 仍可編輯（Status 除外，恆為控件），
// 其餘全數 readonly。示意「整合同步進來的工單型別」——欄位由外部系統
// 寫入，本地僅能唯讀檢視與轉換狀態。
const ISSUE_DETAIL_FIELD_DEFS_READONLY_HEAVY = ISSUE_DETAIL_FIELD_DEFS_DEFAULT.map((def) => (
  def.name === 'title' || def.name === 'status' ? def : { ...def, readonly: true }
));

// Status 選項集合，沿用 ListScreen（LIST_SCREEN_STATUS）的狀態標籤——
// 同一組流程狀態語彙，不另創一套命名。isTerminal 標記終止狀態，
// 決定選取時是否轉入結案原因流程。
const ISSUE_DETAIL_STATUS_OPTIONS = [
  { value: '待處理', label: '待處理', isTerminal: false },
  { value: '處理中', label: '處理中', isTerminal: false },
  { value: '審查中', label: '審查中', isTerminal: false },
  { value: '已阻塞', label: '已阻塞', isTerminal: false },
  { value: '已完成', label: '已完成', isTerminal: true },
  { value: '已封存', label: '已封存', isTerminal: true },
];

// getResolutionOptions 的產出。與 KanbanScreen 的 KANBAN_SCREEN_RESOLUTIONS
// 同一組值——兩畫面同吃一支 Logic，選項語彙本就該一致。
const ISSUE_DETAIL_RESOLUTIONS = [
  { id: 'done',      label: '已完成',   tone: 'success' },
  { id: 'wontfix',   label: '不做',     tone: 'neutral' },
  { id: 'duplicate', label: '重複',     tone: 'neutral' },
  { id: 'cantrepro', label: '無法重現', tone: 'warning' },
];

// ─── 工單本體（fixture）────────────────────────────────────────
// 沿用 ListScreen 的 IGT-1042（同一張工單，銜接「從清單點進本畫面」的敘事）。
const ISSUE_DETAIL_ISSUE_KEY = 'IGT-1042';

const ISSUE_DETAIL_FIELD_VALUES_DEFAULT = {
  title: '匯率換算在跨月結轉時取到舊值',
  status: '處理中',
  resolution: null,
  assignee: '陳彥廷',
  point: 3,
  reporter: '林巧薇',
  createdAt: '2026-06-02',
};

// ─── 關聯（fixture）────────────────────────────────────────────
// 母子鏈拆「上層」「子工單」兩組；其餘型別沿用 Spec 線框圖的 Before / RelatedTo。
const ISSUE_DETAIL_RELATIONS_DEFAULT = {
  parents:  [{ id: 'p1', key: 'IGT-1030' }],
  children: [{ id: 'c1', key: 'IGT-1043' }, { id: 'c2', key: 'IGT-1044' }],
  otherGroups: [
    { id: 'before',    typeName: 'Before',    items: [{ id: 'b1', key: 'IGT-1035' }] },
    { id: 'relatedTo', typeName: 'RelatedTo', items: [{ id: 'r1', key: 'IGT-1019' }, { id: 'r2', key: 'IGT-1038' }] },
  ],
};

const ISSUE_DETAIL_RELATIONS_EMPTY = { parents: [], children: [], otherGroups: [] };

// ─── 異動歷史（fixture）─────────────────────────────────────────
// 依時間新到舊排序，欄位標籤對齊 ISSUE_DETAIL_FIELD_DEFS_DEFAULT 的 label。
const ISSUE_DETAIL_CHANGELOG_DEFAULT = [
  { id: 'cl5', time: '2026-08-14 10:22', fieldLabel: 'Status',     oldValue: '待處理', newValue: '處理中', actor: '成員甲' },
  { id: 'cl4', time: '2026-08-13 09:05', fieldLabel: 'Assignee',   oldValue: null,     newValue: '成員甲', actor: '成員乙' },
  { id: 'cl3', time: '2026-08-11 16:40', fieldLabel: 'StoryPoint', oldValue: 2,        newValue: 3,        actor: '成員甲' },
  { id: 'cl2', time: '2026-08-09 11:15', fieldLabel: 'Status',     oldValue: '審查中', newValue: '待處理', actor: '成員乙' },
  { id: 'cl1', time: '2026-08-06 14:02', fieldLabel: 'Status',     oldValue: '待處理', newValue: '審查中', actor: '成員甲' },
];

// ─── IssueDetailSectionPanel ─── 區塊容器 ───────────────────────
// 欄位區／關聯區／異動歷史區共用外框：標題 + 內容堆疊。
function IssueDetailSectionPanel({ theme, title, children }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: T.PANEL_GAP, minWidth: 0,
      padding: T.PANEL_PADDING,
      background: theme.bg.surface,
      border: `${T.PANEL_BORDER_WIDTH}px solid ${theme.border.base}`,
      borderRadius: T.PANEL_RADIUS,
    }}>
      <span style={{ ...issueDetailType(T.PANEL_TITLE_TYPE), color: theme.text.secondary }}>{title}</span>
      {children}
    </div>
  );
}

// ─── IssueDetailFieldRow ─── 欄位區一列 ─────────────────────────
// 定寬 label 左欄 + 值/控件右欄；唯讀與可編輯共用同一列殼，
// FIELD_ROW_MIN_HEIGHT 讓兩態切換時列高不跳動。
function IssueDetailFieldRow({ theme, label, children }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: T.FIELD_ROW_GAP, minHeight: T.FIELD_ROW_MIN_HEIGHT }}>
      <span style={{
        width: T.FIELD_LABEL_WIDTH, flexShrink: 0,
        ...issueDetailType(TYPE_STYLES.label), color: theme.text.secondary,
      }}>
        {label}
      </span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: T.FIELD_CONFIRM_GAP }}>
        {children}
      </div>
    </div>
  );
}

// ─── IssueDetailReadOnlyValue ─── 唯讀欄位值：純文字，超長截斷 ───
function IssueDetailReadOnlyValue({ theme, text }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  return (
    <span title={text} style={{
      ...issueDetailType(T.FIELD_VALUE_TYPE), color: theme.text.primary,
      minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}

// ─── IssueDetailEditableField ─── 可編輯欄位的文字輸入 ───────────
// 草稿與已提交值分離：有變更才浮出確認鈕，按下或 Enter 才算使用者確認、
// 才呼叫 onCommit。值型別轉換（StoryPoint 轉數字等）交呼叫端在
// onCommit 內處理，本元件只管字串草稿與「何時算使用者確認了」。
function IssueDetailEditableField({ theme, value, placeholder, disabled = false, onCommit }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  const [draft, setDraft] = React.useState(value);
  // 外部值變動（如提交成功後父層更新）時重置草稿，避免殘留上一版未提交的字。
  React.useEffect(() => { setDraft(value); }, [value]);

  const dirty = draft !== value;
  const commit = () => { if (dirty && !disabled) onCommit && onCommit(draft); };

  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: T.FIELD_CONFIRM_GAP, flex: 1, minWidth: 0 }}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
    >
      <TextInput
        theme={theme} value={draft} placeholder={placeholder} disabled={disabled}
        onChange={setDraft} fullWidth style={{ flex: 1 }}
      />
      {dirty && !disabled && (
        <IconButton theme={theme} icon="check" title="儲存" size="sm" onClick={commit} />
      )}
    </div>
  );
}

// ─── IssueDetailResolutionPanel ─── Status 轉終止狀態的結案原因面板 ─
// 行內面板（非浮層）：Status 在本畫面是欄位列而非看板卡，不需要蓋版式
// 浮層。選項視覺語彙沿用 KanbanScreen 的 KanbanResolutionPrompt（radio +
// tone Badge）——兩畫面同吃 getResolutionOptions，語彙理當一致；差異只在
// 本面板貼著欄位列往下長，不做絕對定位覆蓋。
//
// picked 為 null 時「確認結案」停用，對應 validateStatusTransition 的
// 「終止狀態且結案原因未提供則禁止」。errorMessage 給了時取代 hint 顯示，
// 示意 Spec「操作失敗：顯示禁止原因提示」；此時 picked 可能仍保留使用者
// 上次的選擇，讓使用者看得到自己選了什麼、以便重選或直接取消。
function IssueDetailResolutionPanel({
  theme, targetLabel, options = [], picked = null, submitting = false,
  errorMessage, onPick, onCancel, onConfirm,
}) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  const [hoveredId, setHoveredId] = React.useState(null);

  return (
    <div
      role="dialog"
      aria-label="選擇結案原因"
      style={{
        display: 'flex', flexDirection: 'column', gap: T.RESOLUTION_PANEL_GAP,
        padding: T.RESOLUTION_PANEL_PADDING,
        background: theme.bg.surface_dim,
        border: `${T.RESOLUTION_PANEL_BORDER_WIDTH}px solid ${theme.border.base}`,
        borderRadius: T.RESOLUTION_PANEL_RADIUS,
        fontFamily: FONT_FAMILY.base,
      }}
    >
      <span style={{ ...issueDetailType(T.RESOLUTION_PROMPT_TYPE), color: theme.text.secondary }}>
        {`轉為「${targetLabel}」須選擇結案原因`}
      </span>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {options.map((option) => {
          const active = picked === option.id;
          const live = hoveredId === option.id && !active;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={submitting}
              onClick={() => onPick && onPick(option.id)}
              onMouseEnter={() => setHoveredId(option.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: T.RESOLUTION_OPTION_GAP,
                height: T.RESOLUTION_OPTION_HEIGHT,
                padding: `0 ${T.RESOLUTION_OPTION_PADDING_X}px`,
                border: 'none', borderRadius: T.RESOLUTION_OPTION_RADIUS,
                background: active ? theme.state.selected.bg : live ? theme.state.hover.bg : 'transparent',
                color: active ? theme.state.selected.fg : theme.text.primary,
                cursor: submitting ? 'not-allowed' : 'pointer', textAlign: 'left',
                fontFamily: FONT_FAMILY.base,
                ...issueDetailType(T.RESOLUTION_OPTION_TYPE),
              }}
            >
              <span style={{
                width: T.RESOLUTION_RADIO_SIZE, height: T.RESOLUTION_RADIO_SIZE, flexShrink: 0,
                borderRadius: RADIUS.full,
                border: `${T.RESOLUTION_RADIO_BORDER}px solid ${active ? theme.state.selected.border : theme.border.input}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {active && (
                  <span style={{
                    width: T.RESOLUTION_RADIO_DOT_SIZE, height: T.RESOLUTION_RADIO_DOT_SIZE,
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
        ...issueDetailType(T.RESOLUTION_HINT_TYPE),
        color: errorMessage ? theme.status.error_fg : picked ? theme.text.tertiary : theme.status.warning_fg,
      }}>
        {errorMessage || (picked ? '確認後寫入 Resolution 與 Status。' : '終止狀態必填結案原因，未選不得確認。')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: T.RESOLUTION_FOOTER_GAP }}>
        <Button theme={theme} variant="ghost" size="sm" label="取消" disabled={submitting} onClick={onCancel} />
        <Button
          theme={theme} variant="primary" size="sm" label="確認結案"
          loading={submitting} disabled={!picked}
          onClick={() => picked && onConfirm && onConfirm(picked)}
        />
      </div>
    </div>
  );
}

// ─── IssueDetailRelationGroup ─── 關聯區一個分組 ─────────────────
// 標題 + 對側工單編號清單；items 為空時不畫，是否整體空狀態交呼叫端決定。
function IssueDetailRelationGroup({ theme, title, items = [] }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  if (items.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: T.GROUP_GAP, minWidth: 0 }}>
      <span style={{ ...issueDetailType(T.GROUP_TITLE_TYPE), color: theme.text.tertiary }}>{title}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: T.RELATION_ITEM_GAP }}>
        {items.map((item) => (
          <span key={item.id} style={{
            ...issueDetailType(T.RELATION_ITEM_TYPE),
            fontFamily: FONT_FAMILY.mono, fontVariantNumeric: NUMERIC_FONT_VARIANT,
            color: theme.primary.main,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.key}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── IssueDetailChangeLogRow ─── 異動歷史一列 ────────────────────
// 時間 / 欄位標籤 / 舊值→新值 / 執行者，四欄定寬對齊 Spec 線框圖排法。
function IssueDetailChangeLogRow({ theme, entry }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: T.CHANGELOG_ROW_GAP,
      padding: `${T.CHANGELOG_ROW_PADDING_Y}px 0`,
      borderTop: `${T.CHANGELOG_DIVIDER_WIDTH}px solid ${theme.divider.base}`,
    }}>
      <span style={{
        width: T.CHANGELOG_TIME_WIDTH, flexShrink: 0,
        ...issueDetailType(T.CHANGELOG_META_TYPE), color: theme.text.tertiary,
        fontVariantNumeric: NUMERIC_FONT_VARIANT,
      }}>
        {entry.time}
      </span>
      <span style={{
        width: T.CHANGELOG_FIELD_WIDTH, flexShrink: 0,
        ...issueDetailType(T.CHANGELOG_TYPE), color: theme.text.secondary,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {entry.fieldLabel}
      </span>
      <span style={{ flex: 1, minWidth: 0, ...issueDetailType(T.CHANGELOG_TYPE), color: theme.text.primary }}>
        {`${issueDetailDisplayValue(entry.oldValue)} → ${issueDetailDisplayValue(entry.newValue)}`}
      </span>
      <span style={{
        flexShrink: 0, ...issueDetailType(T.CHANGELOG_META_TYPE), color: theme.text.tertiary,
        fontFamily: FONT_FAMILY.mono,
      }}>
        {entry.actor}
      </span>
    </div>
  );
}

Object.assign(window, {
  issueDetailType, issueDetailDisplayValue,
  ISSUE_DETAIL_FIELD_DEFS_DEFAULT, ISSUE_DETAIL_FIELD_DEFS_READONLY_HEAVY,
  ISSUE_DETAIL_STATUS_OPTIONS, ISSUE_DETAIL_RESOLUTIONS,
  ISSUE_DETAIL_ISSUE_KEY, ISSUE_DETAIL_FIELD_VALUES_DEFAULT,
  ISSUE_DETAIL_RELATIONS_DEFAULT, ISSUE_DETAIL_RELATIONS_EMPTY,
  ISSUE_DETAIL_CHANGELOG_DEFAULT,
  IssueDetailSectionPanel, IssueDetailFieldRow,
  IssueDetailReadOnlyValue, IssueDetailEditableField,
  IssueDetailResolutionPanel, IssueDetailRelationGroup, IssueDetailChangeLogRow,
});
