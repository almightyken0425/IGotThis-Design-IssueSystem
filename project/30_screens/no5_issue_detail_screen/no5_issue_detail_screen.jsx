// ─────────────────────────────────────────────────────────────
// IssueDetailScreen · 工單詳情頁
//
// 畫面角色：檢視與編輯單張工單的完整欄位、關聯、異動歷史。
// List／Kanban／DevOrder 三畫面的工單列點擊會導覽至此；點擊本身屬 impl
// 接線層級行為，本畫面只定義詳情頁自身的視覺與互動，不含導覽線。
//
// 對側 spec：no3_product_specs/no1_issue_system/no2_screens/no5_issue_detail_screen.md
//   標頭 / 欄位區 / 關聯區 / 異動歷史區四段落，與編輯一般欄位值 / 編輯
//   Status / 返回三條互動逐條對位。
//
// 消費元件：
//   20_components/no3_gantt_nav.jsx — Toolbar（標頭容器，僅用 left 區）
//   20_components/no1_controls.jsx  — Button（返回、結案原因面板的取消/確認）、
//                                     Select（Status 控件）、
//                                     TextInput（一般欄位的可編輯輸入，經
//                                       IssueDetailEditableField 組裝）、
//                                     IconButton（可編輯欄位的確認鈕）、
//                                     Badge（結案原因選項的 tone 標示）
//   20_components/no2_data_display.jsx — EmptyState（關聯區 / 異動歷史區的
//                                     空狀態，皆用 compact、不帶 action——
//                                     本畫面關聯讀取為主，不提供建立入口）
//
// 本畫面自定義的私有元件全在 no2_subsections.jsx：
//   IssueDetailSectionPanel   欄位/關聯/異動歷史三區共用外框
//   IssueDetailFieldRow       欄位區一列：定寬 label + 值/控件
//   IssueDetailReadOnlyValue / IssueDetailEditableField  欄位值唯讀/可編輯兩態
//   IssueDetailResolutionPanel  Status 轉終止狀態的結案原因面板（行內，
//                               緊接 Status 列往下長，非浮層）
//   IssueDetailRelationGroup    關聯區一個分組（標題 + mono 工單編號清單）
//   IssueDetailChangeLogRow     異動歷史一列
// 都是「把既有元件補成本畫面形狀」的組裝件，元件庫目前沒有時間軸列表、
// 詳情面板這類形狀，故留在畫面私有層級，不進 20_components/。
//
// Variants：
//   default         欄位混合唯讀與可編輯、關聯含母子鏈與其他型別分組、
//                   異動歷史五筆新到舊排列
//   resolution      Status 選到終止狀態，結案原因面板行內浮出（live，
//                   可操作）；面板保留一次曾遭拒的已選項與禁止原因，
//                   示意 Spec「操作失敗：顯示禁止原因提示」
//   readonly-heavy  整合同步型別，僅 Title 與 Status 可動，其餘欄位唯讀，
//                   關聯與異動歷史維持正常內容以聚焦欄位區的唯讀樣式對比
//   empty           關聯與異動歷史皆無記錄，兩區各自換空狀態
//
// 兩條硬規（與元件檔同源）：
//   1. 一切視覺值引用 token。幾何走 ISSUE_DETAIL_SCREEN_TOKENS（其值全數由
//      SPACING / RADIUS / BORDER_WIDTH / CONTROL_HEIGHT / ICON_SIZE / TYPE_STYLES
//      階梯組出），色彩走傳入的 theme 物件。本檔無 hex、無未標註的裸數字
//   2. 畫面吃 theme 參數（預設 DEFAULT_THEME），THEME_LIGHT 與 THEME_DARK 同一份
//      JSX 都能渲染；畫面自身不讀 theme.id、不做主題分支
// ─────────────────────────────────────────────────────────────

// variant → 資料與狀態。畫面本體只讀本表，不在 JSX 內散落 variant 判斷。
const ISSUE_DETAIL_VARIANTS = {
  default: {
    label: '預設',
    issueKey: ISSUE_DETAIL_ISSUE_KEY,
    fieldDefs: ISSUE_DETAIL_FIELD_DEFS_DEFAULT,
    fieldValues: ISSUE_DETAIL_FIELD_VALUES_DEFAULT,
    relations: ISSUE_DETAIL_RELATIONS_DEFAULT,
    changelog: ISSUE_DETAIL_CHANGELOG_DEFAULT,
  },
  resolution: {
    label: 'Status 轉終止狀態 · 結案原因選擇中',
    issueKey: ISSUE_DETAIL_ISSUE_KEY,
    fieldDefs: ISSUE_DETAIL_FIELD_DEFS_DEFAULT,
    fieldValues: ISSUE_DETAIL_FIELD_VALUES_DEFAULT,
    relations: ISSUE_DETAIL_RELATIONS_DEFAULT,
    changelog: ISSUE_DETAIL_CHANGELOG_DEFAULT,
    // 示意「曾送出一次遭拒」：面板保留上次已選項與禁止原因，可重選或取消。
    resolutionDemo: { targetLabel: '已封存', picked: 'wontfix', errorMessage: '此轉換被禁止：仍有未完成的子工單。' },
  },
  'readonly-heavy': {
    label: '多數欄位唯讀',
    issueKey: 'IGT-1028',
    fieldDefs: ISSUE_DETAIL_FIELD_DEFS_READONLY_HEAVY,
    fieldValues: {
      title: '開發順序表的甘特超期標示', status: '已完成', resolution: '已完成',
      assignee: '王世昌', point: 3, reporter: '王世昌', createdAt: '2026-07-10',
    },
    relations: ISSUE_DETAIL_RELATIONS_DEFAULT,
    changelog: ISSUE_DETAIL_CHANGELOG_DEFAULT,
  },
  empty: {
    label: '無關聯 · 無異動歷史',
    issueKey: 'IGT-1041',
    fieldDefs: ISSUE_DETAIL_FIELD_DEFS_DEFAULT,
    fieldValues: {
      title: 'CSV 匯入的欄位對應精靈', status: '待處理', resolution: null,
      assignee: '林巧薇', point: 5, reporter: '林巧薇', createdAt: '2026-08-01',
    },
    relations: ISSUE_DETAIL_RELATIONS_EMPTY,
    changelog: [],
  },
};

// 供 canvas router 生成 artboard 用；順序即建議的並陳順序。
const ISSUE_DETAIL_SCREEN_VARIANTS = ['default', 'resolution', 'readonly-heavy', 'empty'];

function IssueDetailScreen({ variant = 'default', theme = DEFAULT_THEME }) {
  const T = ISSUE_DETAIL_SCREEN_TOKENS;
  const config = ISSUE_DETAIL_VARIANTS[variant] || ISSUE_DETAIL_VARIANTS.default;

  const [fieldValues, setFieldValues] = React.useState(config.fieldValues);
  const [resolutionTarget, setResolutionTarget] = React.useState(config.resolutionDemo ? config.resolutionDemo.targetLabel : null);
  const [picked, setPicked] = React.useState(config.resolutionDemo ? config.resolutionDemo.picked : null);
  const [resolutionError, setResolutionError] = React.useState(config.resolutionDemo ? config.resolutionDemo.errorMessage : undefined);

  const commitField = (name, nextValue) => {
    setFieldValues((v) => ({ ...v, [name]: nextValue }));
  };

  // 選到非終止狀態：直接寫入。選到終止狀態：不動 fieldValues，改開結案原因面板——
  // 對應 Spec「IF 取消選擇：Status 維持原值」，未確認前本就不該碰真正的值。
  const onStatusChange = (nextValue) => {
    const opt = ISSUE_DETAIL_STATUS_OPTIONS.find((o) => o.value === nextValue);
    if (!opt) return;
    if (opt.isTerminal) {
      setResolutionTarget(nextValue);
      setPicked(null);
      setResolutionError(undefined);
      return;
    }
    setResolutionTarget(null);
    commitField('status', nextValue);
  };

  const onResolutionConfirm = (resolutionId) => {
    if (!resolutionTarget) return;
    const opt = ISSUE_DETAIL_RESOLUTIONS.find((r) => r.id === resolutionId);
    setFieldValues((v) => ({ ...v, status: resolutionTarget, resolution: opt ? opt.label : resolutionId }));
    setResolutionTarget(null);
    setPicked(null);
    setResolutionError(undefined);
  };

  const onResolutionCancel = () => {
    setResolutionTarget(null);
    setPicked(null);
    setResolutionError(undefined);
  };

  // 面板開啟中，Select 顯示的是「正等待確認的目標」而非已提交值；
  // 取消後 resolutionTarget 歸零，落回真正的已提交狀態，值從未被動過。
  const displayedStatus = resolutionTarget || fieldValues.status;

  function renderField(def) {
    const raw = fieldValues[def.name];

    if (def.name === 'status') {
      return (
        <Select
          theme={theme} options={ISSUE_DETAIL_STATUS_OPTIONS}
          value={displayedStatus} onChange={onStatusChange}
        />
      );
    }

    if (def.name === 'resolution') {
      // Resolution 只隨一次真正的 Status 轉換一併寫入，本畫面不給獨立輸入框；
      // 空值顯示對齊 Spec 線框圖的「尚未結案」而非泛用的「(無)」。
      return <IssueDetailReadOnlyValue theme={theme} text={raw ? String(raw) : '尚未結案'} />;
    }

    if (def.readonly) {
      return <IssueDetailReadOnlyValue theme={theme} text={issueDetailDisplayValue(raw)} />;
    }

    return (
      <IssueDetailEditableField
        theme={theme}
        value={raw === null || raw === undefined ? '' : String(raw)}
        onCommit={(text) => {
          if (def.name === 'point') {
            const trimmed = text.trim();
            if (trimmed === '') { commitField('point', null); return; }
            const parsed = Number(trimmed);
            if (Number.isFinite(parsed)) commitField('point', parsed);
            return;
          }
          commitField(def.name, text);
        }}
      />
    );
  }

  const rel = config.relations;
  const hasParentChild = rel.parents.length > 0 || rel.children.length > 0;
  const relationsEmpty = !hasParentChild && rel.otherGroups.length === 0;

  return (
    <div style={{
      width: '100%', minHeight: '100%',
      display: 'flex', flexDirection: 'column',
      background: theme.bg.base, color: theme.text.primary, fontFamily: FONT_FAMILY.base,
    }}>
      <Toolbar
        theme={theme}
        left={
          <div style={{ display: 'flex', alignItems: 'center', gap: T.HEADER_GAP }}>
            <Button theme={theme} variant="ghost" label="返回" onClick={() => {}} />
            <span style={{
              ...issueDetailType(T.HEADER_KEY_TYPE), color: theme.text.primary,
              fontFamily: FONT_FAMILY.mono, fontVariantNumeric: NUMERIC_FONT_VARIANT,
            }}>
              {config.issueKey}
            </span>
          </div>
        }
      />

      <div style={{
        display: 'flex', flexDirection: 'column', gap: T.SECTION_GAP,
        padding: `${T.CONTENT_PADDING_Y}px ${T.CONTENT_PADDING_X}px`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: T.BODY_COLUMNS, gap: T.BODY_GAP, alignItems: 'start' }}>
          {/* 欄位區 */}
          <IssueDetailSectionPanel theme={theme} title="欄位">
            {config.fieldDefs.map((def) => (
              <React.Fragment key={def.name}>
                <IssueDetailFieldRow theme={theme} label={def.label}>
                  {renderField(def)}
                </IssueDetailFieldRow>
                {def.name === 'status' && resolutionTarget && (
                  <div style={{ paddingLeft: T.FIELD_LABEL_WIDTH + T.FIELD_ROW_GAP }}>
                    <IssueDetailResolutionPanel
                      theme={theme}
                      targetLabel={resolutionTarget}
                      options={ISSUE_DETAIL_RESOLUTIONS}
                      picked={picked}
                      errorMessage={resolutionError}
                      onPick={(id) => { setPicked(id); setResolutionError(undefined); }}
                      onCancel={onResolutionCancel}
                      onConfirm={onResolutionConfirm}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </IssueDetailSectionPanel>

          {/* 關聯區 */}
          <IssueDetailSectionPanel theme={theme} title="關聯">
            {relationsEmpty ? (
              <EmptyState theme={theme} compact title="尚無關聯" description="這張工單目前沒有任何關聯。" />
            ) : (
              <React.Fragment>
                {hasParentChild && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: T.GROUP_GAP }}>
                    <span style={{ ...issueDetailType(T.GROUP_TITLE_TYPE), color: theme.text.tertiary }}>母子鏈</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: T.GROUP_STACK_GAP, paddingLeft: T.RELATION_NEST_INDENT }}>
                      <IssueDetailRelationGroup theme={theme} title="上層" items={rel.parents} />
                      <IssueDetailRelationGroup theme={theme} title="子工單" items={rel.children} />
                    </div>
                  </div>
                )}
                {rel.otherGroups.map((g) => (
                  <IssueDetailRelationGroup key={g.id} theme={theme} title={g.typeName} items={g.items} />
                ))}
              </React.Fragment>
            )}
          </IssueDetailSectionPanel>
        </div>

        {/* 異動歷史區 */}
        <IssueDetailSectionPanel theme={theme} title="異動歷史">
          {config.changelog.length === 0 ? (
            <EmptyState theme={theme} compact title="尚無異動記錄" description="這張工單目前沒有任何欄位異動。" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {config.changelog.map((entry) => (
                <IssueDetailChangeLogRow key={entry.id} theme={theme} entry={entry} />
              ))}
            </div>
          )}
        </IssueDetailSectionPanel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Canvas section · Screens > IssueDetailScreen
// 四個 variant × 兩主題共八張 artboard，皆為 live JSX。
// ─────────────────────────────────────────────────────────────
function ScreenIssueDetailSection() {
  const W = ISSUE_DETAIL_SCREEN_TOKENS.FRAME_WIDTH;
  return (
    <DCSection
      id="screen-issue-detail"
      title="IssueDetailScreen · 工單詳情頁"
      subtitle="對側 spec：no2_screens/no5_issue_detail_screen.md。標頭 + 欄位區/關聯區並排 + 異動歷史區；欄位依 readonly 唯讀顯示或可編輯，Status 一律走 changeIssueStatus。"
    >
      <DCFamily
        id="idd-default" title="Default"
        subtitle="欄位混合唯讀與可編輯、關聯含母子鏈與其他型別分組、異動歷史五筆新到舊排列。"
      >
        <DCArtboard id="idd-default-light" label="default · THEME_LIGHT (live)" width={W} height="auto">
          <IssueDetailScreen variant="default" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="idd-default-dark" label="default · THEME_DARK (live)" width={W} height="auto">
          <IssueDetailScreen variant="default" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="idd-resolution" title="Status Transition"
        subtitle="選到終止狀態後，結案原因面板緊接 Status 列行內浮出（live，可操作）。此卡示意曾送出一次遭拒：面板保留已選項與禁止原因，可重選或取消。"
      >
        <DCArtboard id="idd-resolution-light" label="resolution · THEME_LIGHT (live · 可操作)" width={W} height="auto">
          <IssueDetailScreen variant="resolution" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="idd-resolution-dark" label="resolution · THEME_DARK (live · 可操作)" width={W} height="auto">
          <IssueDetailScreen variant="resolution" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>

      <DCFamily
        id="idd-boundary" title="Boundary"
        subtitle="readonly-heavy 為整合同步型別，僅 Title 與 Status 可動，其餘唯讀。empty 為無關聯無異動歷史，兩區各自換空狀態。"
      >
        <DCArtboard id="idd-readonly-heavy-light" label="readonly-heavy · THEME_LIGHT (live)" width={W} height="auto">
          <IssueDetailScreen variant="readonly-heavy" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="idd-readonly-heavy-dark" label="readonly-heavy · THEME_DARK (live)" width={W} height="auto">
          <IssueDetailScreen variant="readonly-heavy" theme={THEME_DARK} />
        </DCArtboard>
        <DCArtboard id="idd-empty-light" label="empty · THEME_LIGHT (live)" width={W} height="auto">
          <IssueDetailScreen variant="empty" theme={THEME_LIGHT} />
        </DCArtboard>
        <DCArtboard id="idd-empty-dark" label="empty · THEME_DARK (live)" width={W} height="auto">
          <IssueDetailScreen variant="empty" theme={THEME_DARK} />
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  ISSUE_DETAIL_VARIANTS, ISSUE_DETAIL_SCREEN_VARIANTS,
  IssueDetailScreen, ScreenIssueDetailSection,
});
