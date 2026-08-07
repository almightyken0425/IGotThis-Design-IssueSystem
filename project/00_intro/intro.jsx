// ─────────────────────────────────────────────────────────────
// Intro · 設計工作台使用說明
// 這個 tab 不是設計稿，是這份檔案的「目錄 + 操作手冊」。
//
// 本檔承載的核心模型：
//   本 repo 是 IGotThis no1_issue_system 的 Module Design git，
//   擔任設計標準的仲裁端。觸發可來自任一端（impl / Design / Spec），
//   但 token / 元件 / 畫面的最終決議寫進這份 Design git，
//   再由 spec 與 impl 跟隨。觸發雙向，決議上游。
// ─────────────────────────────────────────────────────────────

function IntroSection() {
  return (
    <DCSection id="intro" title="IGotThis · 設計工作台" subtitle="工單管理系統的設計標準權威來源。本分頁是它的使用說明書。">

      {/* 1. 這份檔案在幹嘛 ─────────────────────────────────────── */}
      <DCArtboard id="purpose" label="這份檔案在幹嘛" width={520} height={620}>
        <IntroCard>
          <IntroTag>用途</IntroTag>
          <IntroTitle>IGotThis 工單系統的設計工作台</IntroTitle>
          <IntroBody>
            <p>這是一份「<b>會持續迭代</b>」的設計檔案，不是某個版本的快照。產品是<b>桌面瀏覽器的工單管理系統</b>：高資訊密度、專業工具感。</p>
            <p>它替你保留三種現場：</p>
            <ol>
              <li><b>設計基礎</b> — Foundations 分頁，token 標準值與元件庫</li>
              <li><b>正式設計稿</b> — Screens 分頁，對齊 spec / impl 的畫面樣貌</li>
              <li><b>探索素材</b> — Explorations 分頁，多版本提案並陳</li>
            </ol>
            <p>這份檔案位於 IGotThis 產品的 <code>no4_product_designs/no1_issue_system/</code>，是該 module 的 <b>Module Design git</b>，並擔任<b>設計標準的仲裁端</b>：所有 token / 元件 / 畫面的決議寫在這裡，spec 與 impl 跟著對齊。</p>
            <p style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.6 }}>
              設計方向：中性色 sand 暖階、主色 pine 十階、semantic 四色，色彩方向由 Explorations 的 color-directions 主題定案為 Pine Paper 深林紙感；system font 基準 14px 緊湊階梯；4px 網格、圓角 4·6·8、elevation 三階；光暗雙主題、light 預設。
            </p>
          </IntroBody>
        </IntroCard>
      </DCArtboard>

      {/* 2. tab 導覽 ───────────────────────────────────────────── */}
      <DCArtboard id="tabs" label="分頁地圖" width={520} height={680}>
        <IntroCard>
          <IntroTag>分頁地圖</IntroTag>
          <IntroTitle>4 個頂層分頁</IntroTitle>
          <IntroBody>
            <TabRow no="00" name="Intro" q="這份檔案是什麼？怎麼用？" dir="00_intro/"/>
            <TabRow no="10" name="Foundations" q="顏色、字體、間距、圓角、陰影與元件的標準值是什麼？" dir="10_foundations/ + 20_components/"/>
            <TabRow no="30" name="Screens" q="這個畫面長什麼樣？邊界狀態怎麼呈現？" dir="30_screens/"/>
            <TabRow no="50" name="Explorations" q="這個決策有哪幾個候選？選了哪個、為什麼？" dir="50_explorations/"/>
            <p style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.6, marginTop: 16 }}>
              Foundations 分 <b>Atomic</b>（Colors / Type / Layout）與 <b>Components</b>（Controls / Data Display / Gantt &amp; Nav）兩個 group。Screens 一個 leaf 對應一個畫面，畫面的 variant 不佔 leaf——邊界狀態並陳在該畫面的 section 內，層級與排序這類切換走畫面自身的控件。
            </p>
            <p style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.6, marginTop: 8 }}>
              group 與 leaf 清單以 <code>90_workbench/app.jsx</code> 的 <code>FOUNDATIONS_GROUPS</code> / <code>SCREEN_GROUPS</code> / <code>EXPLORATION_GROUPS</code> 三個常數為唯一真相，本卡不重複列表。
            </p>
          </IntroBody>
        </IntroCard>
      </DCArtboard>

      {/* 3. 與 spec / impl 的配對關係 ──────────────────────────── */}
      <DCArtboard id="pairing" label="與 spec / impl 的配對關係" width={520} height={640}>
        <IntroCard>
          <IntroTag>仲裁模型</IntroTag>
          <IntroTitle>Design 仲裁、spec 與 impl 跟進</IntroTitle>
          <IntroBody>
            <p><b>三件套：</b>本 Design git 與同 module 的 Spec git、Impl git 並列。</p>
            <ul>
              <li><b>Spec git</b> — <code>no3_product_specs/no1_issue_system/</code>，行為規格</li>
              <li><b>Design git</b> — 本 repo，視覺與互動標準</li>
              <li><b>Impl git</b> — <code>no5_product_development/no1_issue_system/</code>，實作（repo 待建）</li>
            </ul>
            <p style={{ marginTop: 12 }}><b>觸發可來自任一端：</b>impl 發現字太小、Design 探索想換配色、Spec 邏輯需要新狀態，都可以發起變動訊號。</p>
            <p style={{ marginTop: 12 }}><b>但決議寫進本 repo：</b></p>
            <ul>
              <li>token 最終值寫在 <code>10_foundations/</code> 三個 noN 檔</li>
              <li>impl 的 theme 檔照 export 名稱逐名對齊（PALETTE / PRIMARY_PINE / THEMES / TYPE_STYLES / SPACING …）</li>
              <li>data model 與 logic 的仲裁端在 Spec git，不經 Design</li>
            </ul>
            <hr style={{ border: 'none', borderTop: `1px dashed ${TOKENS.divider}`, margin: '16px 0' }}/>
            <p style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.6 }}>
              完整配對表與 sub_mapping 由 <code>decision_framework_router</code> skill 的 <code>products_registry.md</code> 維護。
            </p>
          </IntroBody>
        </IntroCard>
      </DCArtboard>

      {/* 4. 畫布操作 ───────────────────────────────────────────── */}
      <DCArtboard id="canvas-controls" label="畫布操作" width={520} height={620}>
        <IntroCard>
          <IntroTag>操作</IntroTag>
          <IntroTitle>這個畫布像 Figma 一樣可以平移、縮放、重排</IntroTitle>
          <IntroBody>
            <KeyRow keys="二指滑動" do="平移畫布"/>
            <KeyRow keys="Ctrl+滾輪 / 二指捏合" do="縮放畫布"/>
            <KeyRow keys="左鍵 drag 畫布空白處" do="平移（中鍵 drag 亦可）"/>
            <KeyRow keys="點 artboard 左上「六點」grip + drag" do="重排同一 family 內的 artboards"/>
            <KeyRow keys="點 artboard label / 右上箭頭" do="進入 focus mode 大畫面"/>
            <KeyRow keys="focus mode 內 ← / →" do="同 family 前後；shift+←→ 跨 family；↑↓ 跨 section"/>
            <KeyRow keys="Esc / 點背景" do="退出 focus mode"/>
            <hr style={{ border: 'none', borderTop: `1px dashed ${TOKENS.divider}`, margin: '16px 0' }}/>
            <p style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.6 }}>artboard 順序、自訂標題、rename 會自動存到 <code>.design-canvas.state.json</code>，下次打開就是上次排好的樣子。</p>
          </IntroBody>
        </IntroCard>
      </DCArtboard>

      {/* 5. 目錄結構速查 ───────────────────────────────────────── */}
      <DCArtboard id="file-map" label="目錄結構速查" width={520} height={720}>
        <IntroCard>
          <IntroTag>檔案系統</IntroTag>
          <IntroTitle>數字前綴 = 顯示順序 = 概念順序</IntroTitle>
          <IntroBody>
            <pre style={fileTreeStyle}>{`project/
├── IGotThis.html                  主入口（瀏覽器直接打開）
├── 00_intro/intro.jsx             這個分頁的內容
├── 10_foundations/                設計標準權威
│   ├── no1_atomic_tokens.jsx      PALETTE / PRIMARY_PINE / THEMES / SHADOW_ELEVATION
│   ├── no2_typography.jsx         FONT_FAMILY / TYPOGRAPHY / TYPE_STYLES
│   ├── no3_layout_tokens.jsx      SPACING / RADIUS / MOTION / ICON_SIZE / ROW_HEIGHT
│   ├── component_tokens/          元件專屬參數，no1-no3 對應 20_components 三檔
│   └── visualizers/               Foundations 視覺化卡片
│       ├── no0_shared_card_kit    共用 UI primitives
│       └── no1-no3                colors / type / layout，一 leaf 一檔
├── 20_components/                 元件實作 + showcase
│   ├── no1_controls.jsx           Button / Select / TextInput / Badge / Avatar / Chip
│   ├── no2_data_display.jsx       DataTable / KanbanColumn / KanbanCard / EmptyState
│   ├── no3_gantt_nav.jsx          Gantt 三件 / SortableRow / LevelSwitcher / Toolbar
│   └── components-showcase.jsx    Foundations > Components 三個 leaf 的 section
├── 30_screens/                    一畫面一子目錄，畫面本體 + 自己的 canvas section
│   ├── no1_list_screen/           ListScreen + ScreenListSection
│   ├── no2_kanban_screen/         KanbanScreen + ScreenKanbanSection
│   └── no3_dev_order_screen/      tokens → subsections → 畫面，三檔嚴格依序載入
├── 50_explorations/               多版本提案，決策前隔離
└── 90_workbench/
    ├── app.jsx                    router + SideTOC + 三組 GROUPS 常數
    └── design-canvas.jsx          DesignCanvas / DCSection / DCFamily / DCArtboard`}</pre>
            <p style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.6, marginTop: 12 }}>
              數字前綴保證檔案系統顯示順序與概念順序一致。新增分頁挑空著的 10 倍數段落。
            </p>
          </IntroBody>
        </IntroCard>
      </DCArtboard>

    </DCSection>
  );
}

// ─── 小元件 ───────────────────────────────────────────────────
function IntroCard({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%', padding: '36px 36px',
      background: TOKENS.surface,
      fontFamily: FONT_FAMILY.base,
      color: TOKENS.ink, overflow: 'auto',
    }}>{children}</div>
  );
}
function IntroTag({ children }) {
  return <div style={{
    fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: TOKENS.p600,
    textTransform: 'uppercase', marginBottom: 8,
  }}>{children}</div>;
}
function IntroTitle({ children }) {
  return <h2 style={{
    fontSize: 22, fontWeight: 600, margin: '0 0 20px',
    color: TOKENS.ink, letterSpacing: -0.3,
  }}>{children}</h2>;
}
function IntroBody({ children }) {
  return <div style={{ fontSize: 14, lineHeight: 1.6, color: TOKENS.ink }}>{children}</div>;
}

function TabRow({ no, name, q, dir }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '10px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: TOKENS.ink3, fontVariantNumeric: NUMERIC_FONT_VARIANT, width: 22 }}>{no}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: TOKENS.ink, width: 110 }}>{name}</div>
      <div style={{ flex: 1, fontSize: 13, color: TOKENS.ink2, lineHeight: 1.5 }}>
        {q}
        <code style={{ display: 'block', marginTop: 2, fontSize: 11, color: TOKENS.ink3 }}>{dir}</code>
      </div>
    </div>
  );
}

function KeyRow({ keys, do: doStr }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
      <code style={{
        padding: '3px 8px', borderRadius: 5,
        background: TOKENS.surface2, color: TOKENS.ink,
        fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      }}>{keys}</code>
      <div style={{ flex: 1, fontSize: 13, color: TOKENS.ink2, lineHeight: 1.5 }}>{doStr}</div>
    </div>
  );
}

const fileTreeStyle = {
  fontFamily: FONT_FAMILY.mono,
  fontSize: 11.5, lineHeight: 1.55, color: TOKENS.ink,
  background: TOKENS.surface2, padding: '14px 16px', borderRadius: 8,
  margin: 0, whiteSpace: 'pre',
};

Object.assign(window, { IntroSection });
