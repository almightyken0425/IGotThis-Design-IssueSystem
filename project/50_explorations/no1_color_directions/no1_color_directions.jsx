// ─────────────────────────────────────────────────────────────
// Exploration · Color Directions — 主色方向選型（已定案）
//
// 主題：IGotThis 工單系統的主色方向選型。每個候選各自完整成一組
// 可比較的提案：主色十階 ramp + semantic 四色 + 情境 vignette
//（工單列表 row / 看板卡 / 按鈕 / 選取態），在真實情境比較而非只看色票。
//
// 決策狀態：已定案，選用 L · Pine Paper 深林紙感，其餘十一案標「未採用」。
// L 的主色十階、暖中性十一階、UI 角色安排與 semantic 已回寫進
// 10_foundations/no1_atomic_tokens.jsx，成為 PRIMARY_PINE 與 PALETTE.sand。
// 本頁自此為決策紀錄：保留十二案並列的比較現場，供日後回看選型理由與落選原因。
// 本檔仍完全隔離、色階常數檔內自建，不反向依賴 Foundations 的主色 token。
//
// 候選一覽：
//   A Indigo 靛藍          — 原 v1 基線，冷靜專業
//   B Blue 經典藍          — 企業工具感，沉穩保守
//   C Teal 青綠            — 清爽現代工具感
//   D Violet 紫羅蘭        — 創意感較強
//   E Green 森林綠         — 生產力與完成感
//   F Graphite Amber 暖石墨 × 琥珀 — 暖中性差異化，主色以琥珀點綴
//   G Deep Teal 深青        — 使用者提色 #118C8C，種子落 600
//   H Steel Teal 鋼青       — 使用者提色 #519CAB，種子落 400
//   I Petrol 墨青           — 使用者提色 #114C5A，種子落 700
//   J Royal Lemon 皇藍 × 檸黃 — 使用者提色 #2A428C + #FFEF4D，雙 ramp
//   K Ultramarine Paper 群青紙感 — 使用者提色 #014BAA + 底色 #F8F3F0，含自訂底色
//   L Pine Paper 深林紙感        — 使用者提色 #004643 + 底色 #F0EDE5，含自訂底色
//
// 中性底兩種形態：A–J 的 vignette 中性色引用既有 TOKENS（中性灰白底），
// 只換主色與 semantic；K–L 另帶使用者指定的暖白紙感底色，vignette 的
// 畫布底 / 紙面 / border / 三階文字全改吃候選自帶的暖中性階。字體與
// 間距兩者一律引用既有 TYPE_STYLES 與 SPACING。
// ─────────────────────────────────────────────────────────────

// ─── 候選色階常數（檔內自建，不動 Foundations） ──────────────
const CD_INDIGO = { 50: '#EEF2FF', 100: '#E0E7FF', 200: '#C7D2FE', 300: '#A5B4FC', 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3', 900: '#312E81' };
const CD_BLUE   = { 50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A' };
const CD_TEAL   = { 50: '#F0FDFA', 100: '#CCFBF1', 200: '#99F6E4', 300: '#5EEAD4', 400: '#2DD4BF', 500: '#14B8A6', 600: '#0D9488', 700: '#0F766E', 800: '#115E59', 900: '#134E4A' };
const CD_VIOLET = { 50: '#F5F3FF', 100: '#EDE9FE', 200: '#DDD6FE', 300: '#C4B5FD', 400: '#A78BFA', 500: '#8B5CF6', 600: '#7C3AED', 700: '#6D28D9', 800: '#5B21B6', 900: '#4C1D95' };
const CD_GREEN  = { 50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 300: '#6EE7B7', 400: '#34D399', 500: '#10B981', 600: '#059669', 700: '#047857', 800: '#065F46', 900: '#064E3B' };
const CD_STONE  = { 50: '#FAFAF9', 100: '#F5F5F4', 200: '#E7E5E4', 300: '#D6D3D1', 400: '#A8A29E', 500: '#78716C', 600: '#57534E', 700: '#44403C', 800: '#292524', 900: '#1C1917' };
const CD_AMBER  = { 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 300: '#FCD34D', 400: '#FBBF24', 500: '#F59E0B', 600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F' };

// 使用者提色四組（G–J）。種子 hex 原樣入階、往淺往深手寫補階，色相鎖定不飄。
const CD_DTEAL  = { 50: '#EFFAFA', 100: '#D5F2F2', 200: '#ABE4E4', 300: '#79D0D0', 400: '#45B5B5', 500: '#1CA0A0', 600: '#118C8C', 700: '#0E7373', 800: '#0C5C5C', 900: '#0A4A4A' }; // 種子 #118C8C 落 600
const CD_STEEL  = { 50: '#F2F8FA', 100: '#E2EFF3', 200: '#C5DFE6', 300: '#9DC5D0', 400: '#519CAB', 500: '#3F8B9B', 600: '#337484', 700: '#2A5F6C', 800: '#224D58', 900: '#1B3E47' }; // 種子 #519CAB 落 400
const CD_PETROL = { 50: '#EFF7F9', 100: '#D9ECF1', 200: '#B0D9E3', 300: '#7FBFCE', 400: '#4EA0B5', 500: '#2F8398', 600: '#1D6577', 700: '#114C5A', 800: '#0D3C47', 900: '#0A2F38' }; // 種子 #114C5A 落 700，淺階拉開
const CD_ROYAL  = { 50: '#EFF2FA', 100: '#DDE4F5', 200: '#BCC9EB', 300: '#93A6DC', 400: '#6A82C9', 500: '#4A63B0', 600: '#37519E', 700: '#2A428C', 800: '#223471', 900: '#1B2A5B' }; // 種子 #2A428C 落 700
const CD_LEMON  = { 50: '#FFFCE5', 100: '#FFF9C2', 200: '#FFF58A', 300: '#FFEF4D', 400: '#F2DE1C', 500: '#D9C40E', 600: '#B3A00B', 700: '#8C7D09', 800: '#6B5F08', 900: '#524907' }; // 種子 #FFEF4D 落 300

// 使用者提色兩組（K–L）。同樣種子原樣入階、手寫補階鎖色相；這兩組另配自訂底色（見暖中性紙感階）。
const CD_ULTRA  = { 50: '#EBF3FF', 100: '#D6E8FF', 200: '#ADD1FF', 300: '#7EB4FC', 400: '#4993F3', 500: '#0668EE', 600: '#0259CA', 700: '#014BAA', 800: '#013C88', 900: '#022F6A' }; // 種子 #014BAA 落 700，色相鎖 214°
const CD_PINE   = { 50: '#F0F9F8', 100: '#DFF1F0', 200: '#C0E3E1', 300: '#98CDCB', 400: '#65B3B1', 500: '#359794', 600: '#1F7A77', 700: '#0B605D', 800: '#004643', 900: '#002E2C' }; // 種子 #004643 落 800，色相鎖 177°

// semantic 基準值同 PALETTE.semantic（light theme）；個別候選為避色而覆蓋時附 note。
const CD_SEMANTIC_BASE = { success: '#16A34A', warning: '#D97706', error: '#DC2626', info: '#0284C7' };

// ─── 暖中性紙感階（K–L 專屬底色） ────────────────────────────
// 由底色種子往深手寫推導的暖中性十一階。色相全程鎖在種子色相、飽和度
// 不歸零——中段最低降到 12–15%、最深的文字階回升到 19–21%，避免深階
// 退回中性灰、暖調斷掉。
// 階位配置：種子落 100（等同 THEME_LIGHT.bg.base 的畫布底角色），0 與 50
// 往淺補出抬起的紙面與次級面，200 以深依序承 border / 三階文字。
const CD_PAPER_ROSE = { 0: '#FDFAF8', 50: '#FBF7F5', 100: '#F8F3F0', 200: '#EFE6E1', 300: '#E0D4CC', 400: '#A8958A', 500: '#948175', 600: '#746358', 700: '#584A41', 800: '#3E332C', 900: '#2B221D' }; // 種子 #F8F3F0 落 100，色相鎖 22° 暖粉
const CD_PAPER_SAND = { 0: '#FBF9F4', 50: '#F6F4EF', 100: '#F0EDE5', 200: '#E5E1D7', 300: '#D3CEC0', 400: '#9F9783', 500: '#89816C', 600: '#6B6452', 700: '#514C3D', 800: '#393428', 900: '#252118' }; // 種子 #F0EDE5 落 100，色相鎖 43° 暖米

// 暖階 → vignette 消費的中性角色。角色配置逐項鏡射 THEME_LIGHT：
// canvas ← bg.base、surface ← bg.surface、border ← border.base、
// ink/ink2/ink3 ← text.primary/secondary/tertiary。hairline 與卡片陰影
// 改用該候選最深文字階的 rgb 疊透明度，連細線與陰影都保住暖調。
function cdNeutralFromPaper(p, inkRgb) {
  return {
    canvas: p[100], surface: p[0], surface2: p[50],
    border: p[200], borderStrong: p[300], hairline: `rgba(${inkRgb},0.08)`,
    ink: p[900], ink2: p[600], ink3: p[400], shadowRgb: inkRgb,
  };
}

// A–J 的中性灰白底。原本讀全域 TOKENS，定案回寫後 TOKENS 已換成暖紙感，
// 再讀活值會讓 A–J 的比較現場整組被追溯改底、決策紀錄失真。
// 故凍結為選型當下的 slate 取值：逐鍵鏡射舊 TOKENS，與使用者實際比較時所見一致。
// 有 c.neutral 的候選（K–L）走自帶暖階，其餘落回本組。
const CD_NEUTRAL_SLATE_FROZEN = {
  canvas: '#FFFFFF', surface: '#FFFFFF', surface2: '#F8FAFC',
  border: '#E2E8F0', borderStrong: '#CBD5E1', hairline: 'rgba(15,23,42,0.08)',
  ink: '#0F172A', ink2: '#475569', ink3: '#94A3B8', shadowRgb: '2,6,23',
};

function cdNeutral(c) {
  return c.neutral || CD_NEUTRAL_SLATE_FROZEN;
}

// vignette 消費的 UI 角色色。一般候選由 ramp 統一推導；F 例外手排（石墨承按鈕、琥珀承點綴）。
function cdUiFromRamp(ramp) {
  return {
    keyFg: ramp[600],
    badgeBg: ramp[100], badgeFg: ramp[700],
    primaryBtnBg: ramp[600], primaryBtnFg: '#FFFFFF',
    selectedBg: ramp[50], selectedBorder: ramp[600], selectedFg: ramp[700],
    avatarBg: ramp[500],
  };
}

const CD_CANDIDATES = [
  {
    id: 'a-indigo', code: 'A', name: 'Indigo 靛藍', status: '未採用 · 原 v1 基線',
    tag: '現行 v1 基線，冷靜專業',
    ramp: CD_INDIGO, semantic: { ...CD_SEMANTIC_BASE },
    ui: cdUiFromRamp(CD_INDIGO),
    note: 'v1 初稿的主色，本頁作對照基線。定案改用 L 後，Foundations 的 PRIMARY_INDIGO 已由 PRIMARY_PINE 取代，本 ramp 只留在本頁作歷史對照。',
  },
  {
    id: 'b-blue', code: 'B', name: 'Blue 經典藍', status: '未採用',
    tag: '企業工具感，沉穩保守',
    ramp: CD_BLUE, semantic: { ...CD_SEMANTIC_BASE, info: '#0891B2' },
    ui: cdUiFromRamp(CD_BLUE),
    note: 'info 由 sky 改 cyan #0891B2，避免與主色藍系相撞。',
  },
  {
    id: 'c-teal', code: 'C', name: 'Teal 青綠', status: '未採用',
    tag: '清爽現代工具感',
    ramp: CD_TEAL, semantic: { ...CD_SEMANTIC_BASE },
    ui: cdUiFromRamp(CD_TEAL),
    note: null,
  },
  {
    id: 'd-violet', code: 'D', name: 'Violet 紫羅蘭', status: '未採用',
    tag: '創意感較強',
    ramp: CD_VIOLET, semantic: { ...CD_SEMANTIC_BASE },
    ui: cdUiFromRamp(CD_VIOLET),
    note: null,
  },
  {
    id: 'e-green', code: 'E', name: 'Green 森林綠', status: '未採用',
    tag: '生產力與完成感',
    ramp: CD_GREEN, semantic: { ...CD_SEMANTIC_BASE },
    ui: cdUiFromRamp(CD_GREEN),
    note: 'success #16A34A 與主色同為綠系；選定本案需另議 success 的區辨對策。',
  },
  {
    id: 'f-graphite-amber', code: 'F', name: 'Graphite Amber 暖石墨 × 琥珀', status: '未採用',
    tag: '暖中性差異化，主色以琥珀點綴',
    ramp: CD_STONE, accentRamp: CD_AMBER,
    rampTitle: '主 RAMP 十階（暖石墨）', accentRampTitle: '點綴 RAMP 十階（琥珀）',
    semantic: { ...CD_SEMANTIC_BASE, warning: '#EA580C' },
    ui: {
      keyFg: CD_AMBER[700],
      badgeBg: CD_AMBER[100], badgeFg: CD_AMBER[800],
      primaryBtnBg: CD_STONE[800], primaryBtnFg: '#FFFFFF',
      selectedBg: CD_AMBER[50], selectedBorder: CD_AMBER[600], selectedFg: CD_AMBER[800],
      avatarBg: CD_AMBER[500],
    },
    note: '主 ramp 為暖石墨、按鈕承石墨；琥珀為點綴 ramp 承 key / badge / 選取態。warning 由 amber 改 orange #EA580C 避免與點綴色相撞。',
  },
  {
    id: 'g-deep-teal', code: 'G', name: 'Deep Teal 深青', status: '未採用 · 使用者提色',
    tag: '飽和深青，沉穩中帶清爽', seed: '#118C8C',
    ramp: CD_DTEAL, semantic: { ...CD_SEMANTIC_BASE },
    ui: cdUiFromRamp(CD_DTEAL),
    note: '種子 #118C8C 落 600、直接承按鈕與選取邊線；上下手寫補階、色相鎖 180° 不飄。info sky 與主色相距足夠，semantic 沿用基準（同 C 前例）。',
  },
  {
    id: 'h-steel-teal', code: 'H', name: 'Steel Teal 鋼青', status: '未採用 · 使用者提色',
    tag: '低飽和鋼青，霧感內斂', seed: '#519CAB',
    ramp: CD_STEEL, semantic: { ...CD_SEMANTIC_BASE, info: '#2563EB' },
    ui: cdUiFromRamp(CD_STEEL),
    note: '種子 #519CAB 落 400，往深補 500–900 承按鈕與文字。info 由 sky 改 blue #2563EB——主色即偏 sky 的青，照 B 前例反向避撞。',
  },
  {
    id: 'i-petrol', code: 'I', name: 'Petrol 墨青', status: '未採用 · 使用者提色',
    tag: '極深墨青，硬派專業', seed: '#114C5A',
    ramp: CD_PETROL, semantic: { ...CD_SEMANTIC_BASE, info: '#2563EB' },
    ui: cdUiFromRamp(CD_PETROL),
    note: '種子 #114C5A 落 700；50–400 淺階刻意拉開，讓 600 按鈕保住白字對比、50 選取底不糊。info 由 sky 改 blue #2563EB，照 B 前例反向避撞。',
  },
  {
    id: 'j-royal-lemon', code: 'J', name: 'Royal Lemon 皇藍 × 檸黃', status: '未採用 · 使用者提色',
    tag: '皇藍承主結構，檸黃高亮點綴', seed: '#2A428C + #FFEF4D',
    ramp: CD_ROYAL, accentRamp: CD_LEMON,
    rampTitle: '主 RAMP 十階（皇藍）', accentRampTitle: '點綴 RAMP 十階（檸黃）',
    semantic: { ...CD_SEMANTIC_BASE, info: '#0891B2', warning: '#EA580C' },
    ui: {
      keyFg: CD_LEMON[800],
      badgeBg: CD_LEMON[300], badgeFg: CD_LEMON[900],
      primaryBtnBg: CD_ROYAL[700], primaryBtnFg: '#FFFFFF',
      selectedBg: CD_ROYAL[50], selectedBorder: CD_ROYAL[600], selectedFg: CD_ROYAL[700],
      avatarBg: CD_ROYAL[500],
    },
    note: '照 F 雙 ramp 模式：皇藍種子 #2A428C 落 700 承按鈕與選取態；檸黃種子 #FFEF4D 落 300 承 key / badge / highlight。檸黃亮度極高，badge 文字用 900 深字、key 文字用 800 保對比。info 由 sky 改 cyan #0891B2 避開主色藍系（B 前例）；warning 由 amber 改 orange #EA580C 避開檸黃點綴（F 前例）。',
  },
  {
    id: 'k-ultramarine-paper', code: 'K', name: 'Ultramarine Paper 群青紙感', status: '未採用 · 使用者提色',
    tag: '深飽和群青配暖粉紙底，冷主色壓在暖底上', seed: '#014BAA + 底色 #F8F3F0',
    ramp: CD_ULTRA, semantic: { ...CD_SEMANTIC_BASE, info: '#0891B2' },
    ui: cdUiFromRamp(CD_ULTRA),
    neutral: cdNeutralFromPaper(CD_PAPER_ROSE, '43,34,29'),
    paperRamp: CD_PAPER_ROSE, paperSeed: '#F8F3F0',
    note: '本頁第一組含自訂底色的候選。主色種子 #014BAA 落 700，往淺補 50–600、往深補 800–900，色相鎖 214° 不飄；600 #0259CA 承按鈕、對白字 6.4:1。底色種子 #F8F3F0 落暖中性階 100 作畫布底，紙面 #FDFAF8、border #EFE6E1、三階文字 #2B221D / #746358 / #A8958A 全由同色相往深推，深階留 15–19% 飽和不退回中性灰。三階文字對紙面 15.1 / 5.6 / 2.8:1。info 由 sky 改 cyan #0891B2，避免與主色藍系相撞（B 前例）。',
  },
  {
    id: 'l-pine-paper', code: 'L', name: 'Pine Paper 深林紙感', status: '已選用 · 設計標準',
    tag: '極深墨綠青配暖米紙底，沉靜自然', seed: '#004643 + 底色 #F0EDE5',
    ramp: CD_PINE, semantic: { ...CD_SEMANTIC_BASE },
    ui: {
      keyFg: CD_PINE[700],
      badgeBg: CD_PINE[100], badgeFg: CD_PINE[800],
      primaryBtnBg: CD_PINE[800], primaryBtnFg: '#FFFFFF',
      selectedBg: CD_PINE[50], selectedBorder: CD_PINE[700], selectedFg: CD_PINE[800],
      avatarBg: CD_PINE[600],
    },
    neutral: cdNeutralFromPaper(CD_PAPER_SAND, '37,33,24'),
    paperRamp: CD_PAPER_SAND, paperSeed: '#F0EDE5',
    note: '含自訂底色，與 K 同一形態。主色種子 #004643 落 800、亮度僅 14%，照 F 前例由 800 直接承按鈕（對白字 10.7:1）；50–400 淺階刻意拉開飽和與亮度差，讓 50 選取底不糊、700 #0B605D 承 key 與選取邊線不糊成黑、600 承頭像。底色種子 #F0EDE5 落暖中性階 100 作畫布底，紙面 #FBF9F4、border #E5E1D7、三階文字 #252118 / #6B6452 / #9F9783 同色相往深推，對紙面 15.2 / 5.6 / 2.8:1。主色屬青綠而非綠，success 與 info 的色距同 C / G 前例足夠，semantic 全數沿用基準。定案回寫時追加一項本頁未解的修正：badge 的 semantic 前景壓在暖紙底推暖過的淡底上只剩 3.07–4.41:1、四色全數不足 AA，Foundations 另立 status.<name>_fg 深階承 badge 文字，見 no1_atomic_tokens.jsx 的 status 註解。',
  },
];

// ─── 視覺化元件 ──────────────────────────────────────────────

// ramp 條：色塊 + 階數 + hex。主色 ramp 走預設十階；暖中性階多帶一個 0（抬起的紙面）故傳 steps。
// n 為候選的中性角色組（K–L 為暖階、其餘為 TOKENS 鏡射）。
function CDRamp({ ramp, title, n, steps: stepsProp }) {
  const steps = stepsProp || [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const first = steps[0], last = steps[steps.length - 1];
  return (
    <div style={{ marginBottom: SPACING.md }}>
      <SectionMini style={{ color: n.ink3 }}>{title}</SectionMini>
      <div style={{ display: 'flex', gap: 2 }}>
        {steps.map(s => (
          <div key={s} style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              height: 34, background: ramp[s],
              borderRadius: s === first ? '4px 0 0 4px' : s === last ? '0 4px 4px 0' : 0,
              border: `1px solid ${n.hairline}`,
            }}/>
            <div style={{ fontSize: 8.5, color: n.ink2, textAlign: 'center', marginTop: 3, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{s}</div>
            <div style={{ fontSize: 7, color: n.ink3, textAlign: 'center', fontFamily: FONT_FAMILY.mono, whiteSpace: 'nowrap' }}>{ramp[s]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// semantic 四色一列。
function CDSemanticRow({ semantic, n }) {
  const items = [
    ['success', semantic.success], ['warning', semantic.warning],
    ['error', semantic.error], ['info', semantic.info],
  ];
  return (
    <div style={{ marginBottom: SPACING.lg }}>
      <SectionMini style={{ color: n.ink3 }}>SEMANTIC 四色</SectionMini>
      <div style={{ display: 'flex', gap: SPACING.sm }}>
        {items.map(([name, hex]) => (
          <div key={name} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: RADIUS.sm, background: hex, border: `1px solid ${n.hairline}`, flexShrink: 0 }}/>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9.5, fontWeight: 500, color: n.ink }}>{name}</div>
              <div style={{ fontSize: 8, color: n.ink3, fontFamily: FONT_FAMILY.mono }}>{hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 假頭像：候選 500 底 + 白字縮寫。
function CDAvatar({ bg, initial, size = 20 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: RADIUS.full, background: bg,
      color: '#fff', fontSize: size * 0.45, fontWeight: TYPOGRAPHY.weight.semibold,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{initial}</div>
  );
}

function CDBadge({ bg, fg, children }) {
  return (
    <span style={{
      background: bg, color: fg,
      fontSize: TYPOGRAPHY.size.xs, fontWeight: TYPOGRAPHY.weight.medium, lineHeight: '16px',
      padding: `${SPACING['2xs']}px ${SPACING.sm}px`, borderRadius: RADIUS.full,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>{children}</span>
  );
}

// 工單列表 row。selected 時吃候選選取態（tint 底 + 左緣 2px 主色線）。
function CDIssueRow({ c, issueKey, title, badge, initial, selected, last }) {
  const n = cdNeutral(c);
  return (
    <div style={{
      height: ROW_HEIGHT.base,
      display: 'flex', alignItems: 'center', gap: SPACING.md,
      padding: `0 ${SPACING.md}px`,
      background: selected ? c.ui.selectedBg : n.surface,
      boxShadow: selected ? `inset ${BORDER_WIDTH.focus}px 0 0 ${c.ui.selectedBorder}` : 'none',
      borderBottom: last ? 'none' : `1px solid ${n.hairline}`,
    }}>
      <span style={{
        fontFamily: FONT_FAMILY.mono, fontSize: TYPOGRAPHY.size.sm,
        fontWeight: TYPOGRAPHY.weight.medium, color: c.ui.keyFg,
        fontVariantNumeric: NUMERIC_FONT_VARIANT, flexShrink: 0,
      }}>{issueKey}</span>
      <span style={{
        fontSize: TYPE_STYLES.tableCell.size, lineHeight: `${TYPE_STYLES.tableCell.lineHeight}px`,
        color: selected ? c.ui.selectedFg : n.ink,
        fontWeight: selected ? TYPOGRAPHY.weight.medium : TYPOGRAPHY.weight.regular,
        flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{title}</span>
      {badge}
      <CDAvatar bg={c.ui.avatarBg} initial={initial}/>
    </div>
  );
}

// 看板卡：surface 卡 + key / 優先級 / 負責人。
function CDKanbanCard({ c }) {
  const n = cdNeutral(c);
  return (
    <div style={{
      width: 190, background: n.surface,
      border: `1px solid ${n.border}`, borderRadius: RADIUS.md,
      padding: SPACING.md,
      boxShadow: `0 ${SHADOW.level1.offsetY}px ${SHADOW.level1.blur}px rgba(${n.shadowRgb},${SHADOW.level1.opacity})`,
    }}>
      <div style={{
        fontSize: TYPE_STYLES.bodySm.size, lineHeight: `${TYPE_STYLES.bodySm.lineHeight}px`,
        fontWeight: TYPOGRAPHY.weight.medium, color: n.ink, marginBottom: SPACING.sm,
      }}>修正看板拖曳後排序不儲存</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm }}>
        <span style={{
          fontFamily: FONT_FAMILY.mono, fontSize: TYPOGRAPHY.size.xs,
          color: c.ui.keyFg, fontVariantNumeric: NUMERIC_FONT_VARIANT,
        }}>IGT-131</span>
        <CDBadge bg={c.semantic.warning + '1F'} fg={c.semantic.warning}>高</CDBadge>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <CDAvatar bg={c.ui.avatarBg} initial="K" size={18}/>
        <span style={{ fontSize: TYPOGRAPHY.size['2xs'], color: n.ink3 }}>8 月 12 日到期</span>
      </div>
    </div>
  );
}

// 按鈕列：primary / secondary / 文字連結。
function CDButtons({ c }) {
  const n = cdNeutral(c);
  const btnBase = {
    height: CONTROL_HEIGHT.md, borderRadius: RADIUS.sm,
    padding: `0 ${SPACING.md}px`, fontSize: TYPE_STYLES.bodySm.size,
    fontWeight: TYPOGRAPHY.weight.medium, fontFamily: FONT_FAMILY.base,
    display: 'inline-flex', alignItems: 'center', cursor: 'pointer',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
      <button style={{ ...btnBase, background: c.ui.primaryBtnBg, color: c.ui.primaryBtnFg, border: 'none' }}>新增工單</button>
      <button style={{ ...btnBase, background: n.surface, color: n.ink, border: `1px solid ${n.borderStrong}` }}>篩選</button>
      <span style={{ fontSize: TYPE_STYLES.bodySm.size, fontWeight: TYPOGRAPHY.weight.medium, color: c.ui.keyFg, marginLeft: SPACING.xs }}>查看全部</span>
    </div>
  );
}

// 單一候選 artboard 主體。
function CDArtboardBody({ c }) {
  const n = cdNeutral(c);
  return (
    <div style={{
      padding: '20px 20px 16px', background: n.canvas,
      fontFamily: FONT_FAMILY.base, color: n.ink,
    }}>
      {/* 候選標頭：代號 / 名稱 / 決策狀態 / 定位一句 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs }}>
        <div style={{
          width: 24, height: 24, borderRadius: RADIUS.md, background: c.ui.primaryBtnBg,
          color: '#fff', fontSize: 13, fontWeight: TYPOGRAPHY.weight.semibold,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{c.code}</div>
        <div style={{
          fontSize: TYPE_STYLES.cardTitle.size, fontWeight: TYPE_STYLES.cardTitle.weight,
          lineHeight: `${TYPE_STYLES.cardTitle.lineHeight}px`, flex: 1,
        }}>{c.name}</div>
        <span style={{
          fontSize: TYPOGRAPHY.size['2xs'], fontWeight: TYPOGRAPHY.weight.medium,
          color: n.ink2, border: `1px solid ${n.border}`,
          borderRadius: RADIUS.full, padding: `1px ${SPACING.sm}px`, whiteSpace: 'nowrap',
        }}>{c.status}</span>
      </div>
      <div style={{
        fontSize: TYPE_STYLES.caption.size, lineHeight: `${TYPE_STYLES.caption.lineHeight}px`,
        color: n.ink2, marginBottom: SPACING.lg,
      }}>{c.tag}</div>

      {/* 1 · 主色 ramp + semantic 四色。含自訂底色的候選（K–L）多一列暖中性階。 */}
      <CDRamp ramp={c.ramp} title={c.rampTitle || '主色 RAMP 十階'} n={n}/>
      {c.accentRamp && <CDRamp ramp={c.accentRamp} title={c.accentRampTitle || '點綴 RAMP 十階'} n={n}/>}
      {c.paperRamp && (
        <CDRamp ramp={c.paperRamp} n={n}
          steps={[0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900]}
          title={`暖中性階十一階 · 自訂底色種子 ${c.paperSeed} 落 100`}/>
      )}
      <CDSemanticRow semantic={c.semantic} n={n}/>

      {/* 2 · 情境 vignette */}
      <SectionMini style={{ color: n.ink3 }}>
        情境 VIGNETTE · 工單列表（一般 / 選取態）{c.paperSeed ? ' · 含自訂底色' : ''}
      </SectionMini>
      <div style={{
        border: `1px solid ${n.border}`, borderRadius: RADIUS.md,
        overflow: 'hidden', marginBottom: SPACING.lg,
      }}>
        <CDIssueRow c={c} issueKey="IGT-128" title="登入頁在窄視窗跑版" initial="W"
          badge={<CDBadge bg={c.ui.badgeBg} fg={c.ui.badgeFg}>進行中</CDBadge>}/>
        <CDIssueRow c={c} issueKey="IGT-127" title="匯出 CSV 缺少狀態欄" initial="K" selected
          badge={<CDBadge bg={c.semantic.success + '1F'} fg={c.semantic.success}>已解決</CDBadge>}/>
        <CDIssueRow c={c} issueKey="IGT-125" title="通知信範本改版" initial="J" last
          badge={<CDBadge bg={c.semantic.error + '1F'} fg={c.semantic.error}>已封鎖</CDBadge>}/>
      </div>

      <div style={{ display: 'flex', gap: SPACING.lg, alignItems: 'flex-start', marginBottom: SPACING.lg }}>
        <div>
          <SectionMini style={{ color: n.ink3 }}>看板卡</SectionMini>
          <CDKanbanCard c={c}/>
        </div>
        <div style={{ flex: 1 }}>
          <SectionMini style={{ color: n.ink3 }}>按鈕</SectionMini>
          <CDButtons c={c}/>
        </div>
      </div>

      {c.note && (
        <div style={{
          fontSize: TYPE_STYLES.caption.size, lineHeight: `${TYPE_STYLES.caption.lineHeight}px`,
          color: n.ink3, borderTop: `1px solid ${n.hairline}`, paddingTop: SPACING.sm,
        }}>註：{c.note}</div>
      )}
    </div>
  );
}

// ─── Section 入口（app.jsx EXPLORATION_GROUPS 掛載點） ───────
function ExplorationColorDirectionsSection() {
  return (
    <DCSection
      id="color-directions"
      title="Color Directions · 主色方向選型（已定案 L）"
      subtitle="決策已定案：選用 L · Pine Paper 深林紙感，主色種子 #004643、底色種子 #F0EDE5，其餘十一案標「未採用」。L 的主色十階、暖中性十一階與 UI 角色安排已回寫 Foundations，成為 PRIMARY_PINE 與 PALETTE.sand。本頁自此為決策紀錄，保留十二案並列的比較現場供回看選型理由：每案含主色十階 ramp + semantic 四色 + 情境 vignette（工單列表 row / 看板卡 / 按鈕 / 選取態）。A 為原 v1 基線、G–L 為使用者提色；A–J 一律中性灰白底、只換主色，K–L 另帶暖白紙感底色，vignette 中性色改吃自帶暖階、label 標「含自訂底色」。本檔色階常數檔內自建，不反向依賴 Foundations 的主色 token。"
    >
      {CD_CANDIDATES.map(c => (
        <DCArtboard key={c.id} id={c.id} width={460} height="auto"
          label={`${c.code} · ${c.name}${c.seed ? ` · 種子 ${c.seed}` : ''} — ${c.status}${c.paperSeed ? ' · 含自訂底色' : ''}`}>
          <CDArtboardBody c={c}/>
        </DCArtboard>
      ))}
    </DCSection>
  );
}

Object.assign(window, { ExplorationColorDirectionsSection });
