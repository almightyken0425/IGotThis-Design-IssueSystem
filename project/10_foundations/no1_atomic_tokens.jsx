// ─────────────────────────────────────────────────────────────
// Atomic tokens · 色彩 / 主題 / 陰影
//
// IGotThis 工單系統的最底層色彩原料。impl 的 theme 檔對齊此檔的 export 名稱。
// 桌面瀏覽器工具：中性色走 sand 暖階、主色 pine 十階、semantic 四色。
// 光暗雙主題共用 PALETTE 與 SHADOW_ELEVATION，light 為預設。
//
// 色彩方向由 Explorations 的 color-directions 主題定案，採 L · Pine Paper
// 深林紙感：主色種子 #004643 落 pine 800、底色種子 #F0EDE5 落 sand 100。
// 決策紀錄留在 50_explorations/no1_color_directions/。
// ─────────────────────────────────────────────────────────────

const PALETTE = {
  // sand 暖中性階：色相全程鎖 43° 暖米，飽和度中段最低降到 12–15%、
  // 最深的文字階回升到 19–21%，避免深階退回中性灰、暖調斷掉。
  // 0 為抬起的紙面（取代冷系的純白）、100 為畫布底、950 與 1000 供暗主題與陰影。
  sand: {
    0: '#FBF9F4', 50: '#F6F4EF', 100: '#F0EDE5', 200: '#E5E1D7', 300: '#D3CEC0',
    400: '#9F9783', 500: '#89816C', 600: '#6B6452', 700: '#514C3D', 800: '#393428',
    900: '#252118', 950: '#17140E', 1000: '#0A0806',
  },
  // semantic 四色的基準值（light theme 的 status 主色；dark theme 在 THEME_DARK 內提亮）。
  // 這四色只承載「色彩身份」，badge 文字另走 status.<name>_fg 深階，見 THEME_LIGHT.status 註解。
  semantic: {
    success: '#16A34A', warning: '#D97706', error: '#DC2626', info: '#0284C7',
  },
};

// 主色 pine 十階，種子 #004643 落 800、色相鎖 177°。
// main 取值由各 theme 決定（light 取 800 保 AA 對比、dark 取 400 提亮）。
// 800 亮度僅 14%，直接承按鈕、對白字 10.73:1；50–400 淺階刻意拉開飽和與亮度差，
// 讓 50 選取底不糊、700 承 key 與選取邊線不糊成黑。
const PRIMARY_PINE = {
  50: '#F0F9F8', 100: '#DFF1F0', 200: '#C0E3E1', 300: '#98CDCB', 400: '#65B3B1',
  500: '#359794', 600: '#1F7A77', 700: '#0B605D', 800: '#004643', 900: '#002E2C',
};

// SHADOW_ELEVATION 為雙主題共享的陰影三階（offsetY / blur / opacity，color 由 theme.shadow.color 引用）。
// level0 為「無陰影」placeholder。桌面工具陰影節制：level1 卡片、level2 dropdown / popover、level3 modal。
// 陰影色改吃 sand 深階而非中性黑，疊透明度後仍保暖調、不在紙面上壓出灰霧。
const SHADOW_ELEVATION = {
  level0: { offsetY: 0, blur: 0,  opacity: 0    },
  level1: { offsetY: 1, blur: 2,  opacity: 0.06 },
  level2: { offsetY: 4, blur: 12, opacity: 0.10 },
  level3: { offsetY: 12, blur: 32, opacity: 0.18 },
};

const THEME_LIGHT = {
  id: 'light',
  name: 'Light（預設）',
  bg: {
    base:          PALETTE.sand[100],         // app 底：工作區外框、page 背景（紙感畫布底 #F0EDE5）
    surface:       PALETTE.sand[0],           // 卡片 / 表格 / panel 底（抬起的紙面 #FBF9F4）
    surface_hover: PALETTE.sand[50],          // row hover 底
    surface_dim:   'rgba(37,33,24,0.04)',     // 比 surface 淡一階的子區塊底（toolbar、table header），暖墨疊透明度
  },
  // 三階文字全數承 1.4.3 的 4.5:1——placeholder、時間戳、meta 都算文字，沒有「非正文」豁免。
  // tertiary 原取 sand[400]（對紙面僅 2.76:1、對畫布底 2.48:1）下探到 sand[600]，
  // secondary 同步推深到 sand[700] 保三階層次；L* 12.9 / 32.4 / 42.5，階距 19.5 與 10.1。
  text: {
    primary:   PALETTE.sand[900],             // 對紙面 15.24:1、對畫布底 13.71:1
    secondary: PALETTE.sand[700],             // 對紙面 8.14:1、對畫布底 7.32:1
    tertiary:  PALETTE.sand[600],             // meta 資訊、placeholder、時間戳；對紙面 5.59:1、對畫布底 5.03:1
  },
  // border 三鍵依「是不是必要 UI 元件邊界」分流，1.4.11 的 3:1 只約束 input。
  // base 與 strong 為裝飾性分隔：base 承卡片外框與表格細線、strong 承需要更重一階的分區邊與
  // hover 態容器邊；兩者拿掉後元件靠底色差仍可辨識，屬 1.4.11 免除範圍，對紙面 1.24 / 1.49:1 不視為缺陷。
  // input 承必要邊界：輸入框、select、textarea、checkbox 等可聚焦控件外框，拿掉後控件邊界就消失。
  // 取 sand[500]——sand[300] 只有 1.49、sand[400] 只有 2.76，sand[500] 是首個過關階。
  // 消費端不得以 strong 代 input；strong 只是更重的裝飾線、不保證 3:1。
  border: {
    base:   PALETTE.sand[200],                // 裝飾性：卡片外框、表格細線；對紙面 1.24:1
    strong: PALETTE.sand[300],                // 裝飾性加重：分區邊、hover 態容器邊；對紙面 1.49:1
    input:  PALETTE.sand[500],                // 必要邊界：對紙面 3.68:1、對畫布底 3.31:1，兩底都過 3:1
  },
  divider: {
    base:     PALETTE.sand[200],
    hairline: 'rgba(37,33,24,0.08)',          // 表格 row 分隔等最細分隔線，暖墨疊透明度
  },
  // on_main 為疊在 primary.main 上的前景色（按鈕文字與圖示）。
  // 消費端一律讀此鍵、不 hardcode 白字——dark 的 main 取 pine[400] 是亮色，白字只有 2.43:1。
  primary: { main: PRIMARY_PINE[800], on_main: '#FFFFFF', ...PRIMARY_PINE },  // 白字對 pine[800] 10.73:1
  // status 三件套：<name> 為色彩身份（圖示、圓點、邊線），<name>_bg 為 badge 與 callout 淡底，
  // <name>_fg 為疊在 _bg 上的文字色。
  // 為何拆出 _fg：暖紙底把 badge 淡底一併推暖，semantic 基準色壓在自家淡底上只剩
  // 2.67–3.83:1，四色全數落在 AA 4.5:1 之下（success 2.76、warning 2.67、info 3.36、error 3.83）。
  // 修法不動 semantic 基準值、改兩件事——_bg 由冷白淡底換成同色 12% 疊在紙面 sand[0] 上的暖淡底，
  // _fg 換成同色系深兩階的文字色。實測 _fg 對 _bg：success 5.97、warning 5.94、error 6.58、info 6.20，四色全過 AA。
  // badge 文字只吃 _fg；semantic 基準色留給圓點與圖示等非文字元素（對紙面 3.03–4.59:1，過 1.4.11 的 3:1）。
  status: {
    success:    PALETTE.semantic.success,
    success_bg: '#E0EFE0',
    success_fg: '#166534',
    warning:    PALETTE.semantic.warning,
    warning_bg: '#F7E9D7',
    warning_fg: '#92400E',
    error:      PALETTE.semantic.error,
    error_bg:   '#F7E0DB',
    error_fg:   '#991B1B',
    info:       PALETTE.semantic.info,
    info_bg:    '#DDEBEF',
    info_fg:    '#075985',
  },
  state: {
    hover:    { bg: PALETTE.sand[50] },
    // 選取態：50 淡底 + 800 文字（10.02:1）+ 700 邊線，邊線比 main 淺一階、在紙面上不糊成黑。
    selected: { bg: PRIMARY_PINE[50], fg: PRIMARY_PINE[800], border: PRIMARY_PINE[700] },
    // 停用元件不受 1.4.3 與 1.4.11 約束，故 disabled.fg 留在 sand[400]（對紙面 2.76:1）。
    disabled: { fg: PALETTE.sand[400], opacity: 0.45 },
    focus:    { ring: PRIMARY_PINE[700], ringWidth: 2 },
  },
  shadow: { color: PALETTE.sand[900], elevation: SHADOW_ELEVATION },
};

const THEME_DARK = {
  id: 'dark',
  name: 'Dark',
  bg: {
    base:          PALETTE.sand[950],
    surface:       PALETTE.sand[900],
    surface_hover: PALETTE.sand[800],
    surface_dim:   'rgba(251,249,244,0.04)',  // 暖白疊透明度，抬起子區塊
  },
  // 三階與 light 同規：全數過 1.4.3 的 4.5:1，且對 surface 與對 base 兩底都要過。
  // tertiary 原取 sand[500]（對 surface 僅 4.14:1）提亮到 sand[400]，
  // secondary 同步提亮到 sand[300]；L* 93.8 / 82.8 / 62.6，階距 11.0 與 20.2，與 light 鏡像。
  text: {
    primary:   PALETTE.sand[100],             // 對 surface 13.71:1、對 base 15.71:1
    secondary: PALETTE.sand[300],             // 對 surface 10.20:1、對 base 11.69:1
    tertiary:  PALETTE.sand[400],             // 對 surface 5.52:1、對 base 6.33:1
  },
  // 用途分流同 THEME_LIGHT.border 註解：base / strong 裝飾、input 承必要邊界過 3:1。
  // 暗底往回數 sand[600] 對 surface 只有 2.73:1 差臨門一腳，sand[500] 才是首個過關階。
  border: {
    base:   PALETTE.sand[800],                // 裝飾性：對 surface 1.30:1
    strong: PALETTE.sand[700],                // 裝飾性加重：對 surface 1.87:1
    input:  PALETTE.sand[500],                // 必要邊界：對 surface 4.14:1、對 base 4.74:1
  },
  divider: {
    base:     PALETTE.sand[800],
    hairline: 'rgba(159,151,131,0.14)',       // sand[400] 疊透明度，暗底細線不轉冷灰
  },
  // 暗底主色改取 400（#65B3B1）：對 surface 6.60:1、對 base 7.56:1。
  // 實測 500 只有 4.59 / 5.26，貼著 AA 下限、圖示與細線容易糊，故取 400。
  // on_main 改吃 sand[1000] 深墨：pine[400] 是亮色，白字只有 2.43:1、深墨 8.22:1。
  primary: { main: PRIMARY_PINE[400], on_main: PALETTE.sand[1000], ...PRIMARY_PINE },
  // 暗主題的 semantic 前景整體提亮一階、_bg 改為同色 12% 疊在 surface 上的暖深淡底。
  // _fg 與提亮後的 <name> 同值，讓 badge 消費端在雙主題吃同一組鍵；
  // 實測 _fg 對 _bg：success 7.15、warning 7.33、error 4.82、info 6.03，四色全過 AA。
  status: {
    success:    '#4ADE80',
    success_bg: '#293824',
    success_fg: '#4ADE80',
    warning:    '#FBBF24',
    warning_bg: '#3F3419',
    warning_fg: '#FBBF24',
    error:      '#F87171',
    error_bg:   '#3E2B23',
    error_fg:   '#F87171',
    info:       '#38BDF8',
    info_bg:    '#273433',
    info_fg:    '#38BDF8',
  },
  state: {
    hover:    { bg: PALETTE.sand[800] },
    // 選取底為 pine 400 疊 16%（合成後 #2F3830），fg 取 300 對合成底 6.90:1。
    selected: { bg: 'rgba(101,179,177,0.16)', fg: PRIMARY_PINE[300], border: PRIMARY_PINE[400] },
    // 同 THEME_LIGHT：停用元件不受 1.4.3 與 1.4.11 約束（對 surface 2.73:1）。
    disabled: { fg: PALETTE.sand[600], opacity: 0.45 },
    focus:    { ring: PRIMARY_PINE[400], ringWidth: 2 },
  },
  shadow: { color: PALETTE.sand[1000], elevation: SHADOW_ELEVATION },
};

const THEMES = { light: THEME_LIGHT, dark: THEME_DARK };
const DEFAULT_THEME_ID = 'light';
const DEFAULT_THEME = THEMES[DEFAULT_THEME_ID];

// ─── Canvas 渲染快照 ─────────────────────────────────────────
// TOKENS 只給 canvas 卡片與 workbench chrome 消費，impl 不對齊此物件。
// 固定取 THEME_LIGHT 快照；卡片內要展示 dark theme 時直接讀 THEME_DARK。
// pNNN 鍵名即 ramp 階位，換色系後鍵名不變、取值換 pine。
const TOKENS = {
  ink:      THEME_LIGHT.text.primary,
  ink2:     THEME_LIGHT.text.secondary,
  ink3:     THEME_LIGHT.text.tertiary,
  surface:  THEME_LIGHT.bg.surface,
  surface2: THEME_LIGHT.bg.surface_hover,
  border:   THEME_LIGHT.border.base,
  divider:  THEME_LIGHT.divider.base,
  hairline: THEME_LIGHT.divider.hairline,
  p50:  PRIMARY_PINE[50],
  p100: PRIMARY_PINE[100],
  p500: PRIMARY_PINE[500],
  p600: PRIMARY_PINE[600],
};

Object.assign(window, {
  PALETTE, PRIMARY_PINE, SHADOW_ELEVATION,
  THEME_LIGHT, THEME_DARK, THEMES, DEFAULT_THEME, DEFAULT_THEME_ID,
  TOKENS,
});
