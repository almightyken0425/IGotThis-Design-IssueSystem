// ─────────────────────────────────────────────────────────────
// App shell · 設計工作台 router
//
// 頂部 4 個 tab：#intro / #foundations / #screens / #explorations
//
// Foundations、Screens 與 Explorations 皆分 group（hash 三段式：
// #<view>/<group>/<topic>）：group 與各 group 的 leaf 清單以下方
// FOUNDATIONS_GROUPS / SCREEN_GROUPS / EXPLORATION_GROUPS 常數為唯一真相。
//
// Screens 的一個 leaf = 一個畫面 = 一個 Section component。畫面的 variant
// 不佔 leaf：由該畫面自身的 section 以 family 並陳，或由畫面內建的切換件
// （LevelSwitcher、Select、排序標題列）現場切。
//
// 機制沿用 SuSuGiGi design canvas 的 router。該 repo 的 Screens 走
// SCREEN_META + ScreenFrame 的裝置殼二層路由，是因為記帳 App 為 iOS 手機殼、
// 需要 NavBar 與 modal / push 呈現；本 repo 為桌面瀏覽器工具、無裝置殼，
// 故 Screens 直接沿用與 Foundations 同一套 group / topic 結構，不引入 SCREEN_META。
// ─────────────────────────────────────────────────────────────

const VIEW_TABS = [
  { id: 'intro',        label: 'Intro' },
  { id: 'foundations',  label: 'Foundations',  hasSubs: true },
  { id: 'screens',      label: 'Screens',      hasSubs: true },
  { id: 'explorations', label: 'Explorations', hasSubs: true },
];
const VALID_VIEWS = VIEW_TABS.map(t => t.id);

// Foundations groups — Foundations TOC 單一真相，group / leaf 清單以本常數為準。
// hash 路徑：#foundations/<group>/<topic>。每個 topic 對應單一 Section component。
const FOUNDATIONS_GROUPS = [
  {
    id: 'atomic', label: 'Atomic',
    topics: [
      { id: 'colors', label: 'Colors', render: () => <FoundationsAtomicColorsSection/> },
      { id: 'type',   label: 'Type',   render: () => <FoundationsAtomicTypeSection/> },
      { id: 'layout', label: 'Layout', render: () => <FoundationsAtomicLayoutSection/> },
    ],
  },
  {
    id: 'components', label: 'Components',
    topics: [
      { id: 'controls',     label: 'Controls',     render: () => <ComponentsControlsSection/> },
      { id: 'data-display', label: 'Data Display', render: () => <ComponentsDataDisplaySection/> },
      { id: 'gantt-nav',    label: 'Gantt & Nav',  render: () => <ComponentsGanttNavSection/> },
    ],
  },
];

// SCREEN_GROUPS — Screens TOC 單一真相。一個 topic 對應一個畫面的 Section
// component，實體檔在 30_screens/ 各 noN_<name>_screen/ 子目錄。
// 邊界狀態（空 / 拖曳中 / 權限濾除 / 層級切換）不在此列：那是畫面自身
// section 內的 family 與 artboard，或畫面內建切換件的職責。
const SCREEN_GROUPS = [
  {
    id: 'work-views', label: 'Work Views',
    topics: [
      { id: 'list',      label: 'List · 清單表格',   render: () => <ScreenListSection/> },
      { id: 'kanban',    label: 'Kanban · 工單看板', render: () => <ScreenKanbanSection/> },
      { id: 'dev-order', label: 'Dev Order · 開發順序表', render: () => <ScreenDevOrderSection/> },
    ],
  },
];

// EXPLORATION_GROUPS — 多版本提案主題；每 group 一個主題、topic 為探索軸。
// 決策狀態標註在各 artboard label；選定後回寫 Foundations，探索檔本身不動 token 檔。
const EXPLORATION_GROUPS = [
  {
    id: 'color-directions', label: 'Color Directions',
    topics: [
      { id: 'candidates', label: 'Axis · 主色候選', render: () => <ExplorationColorDirectionsSection/> },
    ],
  },
];

// 依 view 取 group 清單；無 group 結構的 view 回 null。
const groupsFor = (view) =>
  view === 'foundations'  ? FOUNDATIONS_GROUPS :
  view === 'screens'      ? SCREEN_GROUPS :
  view === 'explorations' ? EXPLORATION_GROUPS :
  null;

// 找 group / topic 的 helper。沒命中時回該清單第一組第一 leaf。
function resolveGroupedRoute(groups, rawGroup, rawTopic) {
  const group = groups.find(g => g.id === rawGroup);
  if (!group) {
    const fallback = groups[0];
    return { group: fallback.id, topic: fallback.topics[0].id };
  }
  const topic = group.topics.find(t => t.id === rawTopic);
  return { group: group.id, topic: topic ? topic.id : group.topics[0].id };
}

const defaultSubFor = (view) => {
  const groups = groupsFor(view);
  if (groups) {
    const g = groups[0];
    return { group: g.id, topic: g.topics[0].id };
  }
  return null;
};

function parseRoute() {
  const h = window.location.hash.replace('#', '');
  if (!h) return { view: 'intro', group: null, topic: null };
  const parts = h.split('/');
  const view = parts[0];
  if (!VALID_VIEWS.includes(view)) return { view: 'intro', group: null, topic: null };
  const groups = groupsFor(view);
  if (groups) {
    const f = resolveGroupedRoute(groups, parts[1], parts[2]);
    return { view, group: f.group, topic: f.topic };
  }
  return { view, group: null, topic: null };
}

function buildHash(view, payload) {
  if (groupsFor(view) && payload && payload.group && payload.topic) {
    return `${view}/${payload.group}/${payload.topic}`;
  }
  return view;
}

function TocRow({ label, active, hasChildren, expanded, level, onClick }) {
  const isTop = level === 0;
  // level 0 = top tab；level 1 = Foundations group；level 2 = Foundations leaf
  const padding =
    level === 0 ? '8px 12px' :
    level === 1 ? '6px 10px 6px 26px' :
                  '5px 10px 5px 42px';
  const fontSize =
    level === 0 ? 13.5 :
    level === 1 ? 12 :
                  11.5;
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      width: '100%', textAlign: 'left',
      border: 'none', cursor: 'pointer',
      padding,
      borderRadius: 7,
      // 選中態底色走 TOKENS.p50（pine 淡階），與 theme.state.selected.bg 同一階。
      background: active ? (isTop ? TOKENS.p600 : TOKENS.p50) : 'transparent',
      color: active ? (isTop ? '#fff' : TOKENS.p600) : '#3a3a3a',
      fontSize,
      fontWeight: active ? 600 : 500,
      fontFamily: 'inherit',
      transition: 'background 140ms, color 140ms',
      marginBottom: 2,
      lineHeight: 1.3,
    }}>
      {hasChildren && (
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ opacity: active ? 1 : 0.55, flexShrink: 0 }}>
          <path d={expanded ? 'M1.5 3l3 3 3-3' : 'M3 1.5l3 3-3 3'}/>
        </svg>
      )}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
}

function SideTOC({ route, onNavigate }) {
  const { view, group: activeGroup, topic: activeTopic } = route;
  // 每個 group 維護自身展開狀態；預設只展開選中 leaf 所屬 group。
  const [expandedGroups, setExpandedGroups] = React.useState(() => {
    const init = {};
    FOUNDATIONS_GROUPS.forEach(g => { init[g.id] = view === 'foundations' && g.id === activeGroup; });
    SCREEN_GROUPS.forEach(g => { init[g.id] = view === 'screens' && g.id === activeGroup; });
    EXPLORATION_GROUPS.forEach(g => { init[g.id] = view === 'explorations' && g.id === activeGroup; });
    return init;
  });
  React.useEffect(() => {
    if (groupsFor(view) && activeGroup) {
      setExpandedGroups(prev => prev[activeGroup] ? prev : { ...prev, [activeGroup]: true });
    }
  }, [view, activeGroup]);

  const toggleGroup = (gid) => setExpandedGroups(prev => ({ ...prev, [gid]: !prev[gid] }));

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 220, padding: '18px 12px 24px',
      background: 'rgba(255,255,255,0.94)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(0,0,0,0.06)',
      boxShadow: '1px 0 6px rgba(0,0,0,0.04)',
      zIndex: 100,
      overflowY: 'auto',
      fontFamily: FONT_FAMILY.base,
    }}>
      <div style={{
        fontSize: 16, fontWeight: 700, color: '#212121',
        padding: '0 8px 4px', letterSpacing: -0.2,
      }}>
        IGotThis
      </div>
      <div style={{
        fontSize: 11, color: '#9aa3ad', padding: '0 8px 18px',
        letterSpacing: 0.3, fontWeight: 500,
      }}>
        Design Canvas
      </div>
      {VIEW_TABS.map(t => {
        const active = view === t.id;
        return (
          <div key={t.id}>
            <TocRow
              label={t.label}
              active={active}
              hasChildren={!!t.hasSubs}
              expanded={active}
              level={0}
              onClick={() => onNavigate(t.id, null)}
            />
            {active && t.hasSubs && (groupsFor(t.id) || []).map(g => {
              const groupActive = activeGroup === g.id;
              const groupExpanded = !!expandedGroups[g.id];
              return (
                <div key={g.id}>
                  <TocRow
                    label={g.label}
                    active={false}
                    hasChildren={true}
                    expanded={groupExpanded}
                    level={1}
                    onClick={() => toggleGroup(g.id)}
                  />
                  {groupExpanded && g.topics.map(tp => (
                    <TocRow
                      key={tp.id}
                      label={tp.label}
                      active={groupActive && activeTopic === tp.id}
                      level={2}
                      onClick={() => onNavigate(t.id, { group: g.id, topic: tp.id })}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [route, setRoute] = React.useState(() => parseRoute());
  React.useEffect(() => {
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (view, payload) => {
    const finalPayload = payload ?? defaultSubFor(view);
    const next = buildHash(view, finalPayload);
    const currentPayload = groupsFor(route.view) ? { group: route.group, topic: route.topic } : null;
    const current = buildHash(route.view, currentPayload);
    if (next !== current) window.location.hash = next;
  };

  const { view, group, topic } = route;

  const groupedTopicEntry = groupsFor(view)
    ? (() => {
        const g = groupsFor(view).find(grp => grp.id === group);
        return g ? g.topics.find(tp => tp.id === topic) : null;
      })()
    : null;

  return (
    <>
      <SideTOC route={route} onNavigate={navigate}/>
      <DesignCanvas resetKey={
        groupsFor(view) ? `${view}/${group ?? ''}/${topic ?? ''}` : view
      }>
        {view === 'intro' && <IntroSection/>}
        {groupedTopicEntry && (
          <React.Fragment>{groupedTopicEntry.render()}</React.Fragment>
        )}
      </DesignCanvas>
    </>
  );
}

Object.assign(window, { FOUNDATIONS_GROUPS, SCREEN_GROUPS, EXPLORATION_GROUPS });

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
