// ─────────────────────────────────────────────────────────────
// Foundations > Atomic > Colors · 顏色系統視覺化
//
// 卡片：Pine palette / Sand neutrals / Semantic light + dark /
// Surfaces light + dark / Text & Border / States / Badge demo。
// 所有色彩讀 no1_atomic_tokens.jsx 的活 token 即時繪製。
// ─────────────────────────────────────────────────────────────

function PinePaletteCard() {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  return (
    <FoundCard>
      <FoundLabel>PRIMARY_PINE · 主色十階</FoundLabel>
      <div style={{ fontSize: 12, color: TOKENS.ink2, marginBottom: 10 }}>
        種子 #004643 落 800、色相鎖 177°。light theme main = pine[800]、dark theme main = pine[400]，同一階梯雙主題共用。
        800 亮度僅 14%，直接承主要按鈕；700 承 key 文字與選取邊線、600 承頭像底。
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {shades.map(s => <Swatch key={s} hex={PRIMARY_PINE[s]} name={`pine ${s}`}/>)}
      </div>
      <SectionMini style={{ marginTop: 16 }}>main + on_main 對照</SectionMini>
      <Swatch hex={THEME_LIGHT.primary.main}    name="THEME_LIGHT.primary.main"    note="pine[800] · 對 on_main 10.73:1"/>
      <Swatch hex={THEME_LIGHT.primary.on_main} name="THEME_LIGHT.primary.on_main" note="白字"/>
      <Swatch hex={THEME_DARK.primary.main}     name="THEME_DARK.primary.main"     note="pine[400] · 對暗 surface 6.60:1"/>
      <Swatch hex={THEME_DARK.primary.on_main}  name="THEME_DARK.primary.on_main"  note="sand[1000] 深墨 · 對 main 8.22:1，白字只有 2.43"/>
    </FoundCard>
  );
}

function SandNeutralsCard() {
  const shades = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000];
  return (
    <FoundCard>
      <FoundLabel>PALETTE.sand · 暖中性階</FoundLabel>
      <div style={{ fontSize: 12, color: TOKENS.ink2, marginBottom: 10 }}>
        紙感底色種子 #F0EDE5 落 100、色相鎖 43° 暖米。色相全程不飄，飽和度中段最低降到
        12–15%、最深的文字階回升到 19–21%，深階不退回中性灰。
        雙主題共用；light 取 0 作紙面、100 作畫布底，dark 取 900 與 950 作底。
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {shades.map(s => <Swatch key={s} hex={PALETTE.sand[s]} name={`sand[${s}]`}/>)}
      </div>
      <SectionMini style={{ marginTop: 16 }}>紙感底與邊線 · light</SectionMini>
      <Swatch hex={PALETTE.sand[100]} name="畫布底 bg.base"    note="sand[100] 即底色種子"/>
      <Swatch hex={PALETTE.sand[0]}   name="紙面 bg.surface"   note="sand[0] 抬起一階、非純白"/>
      <Swatch hex={PALETTE.sand[200]} name="邊線 border.base"  note="sand[200] · 裝飾性、無對比要求"/>
      <Swatch hex={PALETTE.sand[500]} name="邊線 border.input" note="sand[500] · 必要邊界、對紙面 3.68:1"/>
    </FoundCard>
  );
}

// theme 卡片：dark theme 傳 dark=true，整卡換成該 theme 的 surface 底與文字色。
// badge demo 吃 _bg 淡底 + _fg 文字色；_fg 為與 _bg 配對的深階，不是 status 基準色。
function SemanticCard({ theme, dark }) {
  const ink  = theme.text.primary;
  const ink2 = theme.text.secondary;
  const hairline = theme.divider.hairline;
  const items = ['success', 'warning', 'error', 'info'];
  return (
    <FoundCard style={dark ? { background: theme.bg.surface } : null}>
      <FoundLabel style={dark ? { color: theme.primary.main } : null}>{theme.name} · status 四色</FoundLabel>
      {items.map(k => (
        <Swatch key={k} hex={theme.status[k]} name={`status.${k}`} ink={ink} ink2={ink2} hairline={hairline}/>
      ))}
      <SectionMini style={{ marginTop: 14, color: dark ? theme.text.tertiary : undefined }}>badge demo · _bg 底 + _fg 文字</SectionMini>
      <div style={{ fontSize: 11, color: ink2, margin: '4px 0 2px' }}>
        暖紙底把淡底一併推暖，基準色壓在自家淡底上不足 AA，故 badge 文字改吃 _fg 深階。
        實測 _fg 對 _bg：{dark ? '7.15 / 7.33 / 4.82 / 6.03' : '5.97 / 5.94 / 6.58 / 6.20'}，四色全過 4.5:1。
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 6 }}>
        {items.map(k => (
          <span key={k} style={{
            display: 'inline-flex', alignItems: 'center', height: 20,
            padding: '0 8px', borderRadius: RADIUS.full,
            background: theme.status[`${k}_bg`], color: theme.status[`${k}_fg`],
            fontSize: 11, fontWeight: 500,
          }}>{k}</span>
        ))}
      </div>
    </FoundCard>
  );
}

function SurfacesCard({ theme, dark }) {
  const ink  = theme.text.primary;
  const ink2 = theme.text.secondary;
  const hairline = theme.divider.hairline;
  return (
    <FoundCard style={dark ? { background: theme.bg.base } : { background: THEME_LIGHT.bg.base }}>
      <FoundLabel style={dark ? { color: theme.primary.main } : null}>{theme.name} · bg 四層</FoundLabel>
      <div style={{ fontSize: 11, color: ink2, marginBottom: 12 }}>
        base 為 app 底（本卡背景即是）；surface 卡片底；surface_hover row hover；surface_dim 子區塊微暗底。
        全數由 sand 暖階供給——light 的紙面比畫布底亮一階、不是純白；dark 由 sand 深階往下推，不轉冷灰。
      </div>
      <Swatch hex={theme.bg.base}          name="bg.base"          ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.bg.surface}       name="bg.surface"       ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.bg.surface_hover} name="bg.surface_hover" ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.bg.surface_dim}   name="bg.surface_dim"   ink={ink} ink2={ink2} hairline={hairline}/>
      <SectionMini style={{ marginTop: 14, color: dark ? theme.text.tertiary : undefined }}>text / border / divider</SectionMini>
      <Swatch hex={theme.text.primary}     name="text.primary"     ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.text.secondary}   name="text.secondary"   ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.text.tertiary}    name="text.tertiary"    ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.border.base}      name="border.base"      ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.border.strong}    name="border.strong"    ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.border.input}     name="border.input"     ink={ink} ink2={ink2} hairline={hairline}/>
      <Swatch hex={theme.divider.hairline} name="divider.hairline" ink={ink} ink2={ink2} hairline={hairline}/>
      <div style={{ fontSize: 11, color: ink2, marginTop: 10, lineHeight: 1.55 }}>
        三階文字對 surface：{dark ? '13.71 / 10.20 / 5.52' : '15.24 / 8.14 / 5.59'}:1、
        對 base：{dark ? '15.71 / 11.69 / 6.33' : '13.71 / 7.32 / 5.03'}:1。
        三階全過 1.4.3 的 4.5:1——placeholder 與時間戳都算文字，第三階不再是免除區。
        <br/>
        border 依用途分流：base 與 strong 是裝飾性分隔（卡片外框、表格細線、分區重邊），
        無 1.4.11 對比要求；border.input 承必要邊界（輸入框與可聚焦控件外框），
        對 surface {dark ? '4.14' : '3.68'}:1、對 base {dark ? '4.74' : '3.31'}:1，兩底都過 3:1。
      </div>
    </FoundCard>
  );
}

function StatesCard({ theme }) {
  const box = {
    height: CONTROL_HEIGHT.lg, padding: '0 14px', borderRadius: RADIUS.sm,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
  };
  return (
    <FoundCard>
      <FoundLabel>theme.state · 互動狀態</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        桌面工具以 hover 為第一反饋；selected bg/fg/border 三件套；disabled fg + opacity；focus 走 ring。
      </div>

      <SectionMini>hover · row 底色換 state.hover.bg</SectionMini>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0 16px' }}>
        <div style={{ ...box, background: theme.bg.surface, color: theme.text.primary, border: `1px solid ${theme.border.base}` }}>normal</div>
        <div style={{ ...box, background: theme.state.hover.bg, color: theme.text.primary, border: `1px solid ${theme.border.base}` }}>hover</div>
      </div>

      <SectionMini>selected · bg / fg / border</SectionMini>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0 16px' }}>
        <div style={{ ...box, background: theme.bg.surface, color: theme.text.primary, border: `1px solid ${theme.border.base}` }}>normal</div>
        <div style={{ ...box, background: theme.state.selected.bg, color: theme.state.selected.fg, border: `1px solid ${theme.state.selected.border}` }}>selected</div>
      </div>

      <SectionMini>disabled · fg + opacity {theme.state.disabled.opacity}</SectionMini>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0 16px' }}>
        <div style={{ ...box, background: theme.primary.main, color: theme.primary.on_main }}>normal</div>
        <div style={{ ...box, background: theme.primary.main, color: theme.primary.on_main, opacity: theme.state.disabled.opacity }}>disabled</div>
        <div style={{ ...box, color: theme.state.disabled.fg, border: `1px solid ${theme.border.base}` }}>fg only</div>
      </div>

      <SectionMini>focus · ring {theme.state.focus.ring} × {theme.state.focus.ringWidth}px</SectionMini>
      <div style={{ fontSize: 11, color: TOKENS.ink3, margin: '2px 0 4px' }}>
        可聚焦控件外框吃 border.input（非 strong）——它是必要 UI 元件邊界、要過 3:1。
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0' }}>
        <div style={{ ...box, background: theme.bg.surface, color: theme.text.primary, border: `1px solid ${theme.border.input}` }}>normal</div>
        <div style={{ ...box, background: theme.bg.surface, color: theme.text.primary, border: `1px solid ${theme.border.input}`, boxShadow: `0 0 0 ${theme.state.focus.ringWidth}px ${theme.state.focus.ring}` }}>focus</div>
      </div>
    </FoundCard>
  );
}

function FoundationsAtomicColorsSection() {
  return (
    <DCSection
      id="found-atomic-colors"
      title="Atomic · Colors"
      subtitle="sand 暖中性階 + pine 主色十階 + semantic 四色。色彩方向為 Explorations 定案的 L · Pine Paper 深林紙感——主色種子 #004643、底色種子 #F0EDE5，畫布與紙面全走暖白紙感、不用冷灰白。光暗雙主題結構都建、light 為預設。所有色彩讀 no1_atomic_tokens.jsx 的 PALETTE / THEMES 即時繪製。"
    >
      <DCFamily id="colors-palettes" title="Palettes" subtitle="主色 pine 十階與 sand 暖中性階，雙主題共用原料。sand 承畫布底、紙面、邊線與三階文字，色相與主色同屬暖偏青的自然調。">
        <DCArtboard id="palette-pine" label="PRIMARY_PINE · 50 → 900 (live)" width={420} height={600}>
          <PinePaletteCard/>
        </DCArtboard>
        <DCArtboard id="palette-sand" label="PALETTE.sand · 0 → 1000 (live)" width={420} height={760}>
          <SandNeutralsCard/>
        </DCArtboard>
      </DCFamily>

      <DCFamily id="colors-themes" title="Themes · Light vs Dark" subtitle="同一組 export 名稱、兩份取值。light 為預設、底為暖白紙感；dark 由 sand 深階往下推、同樣保暖調。dark 卡片直接畫在自身 bg 上驗可讀性。">
        <DCArtboard id="surfaces-light" label="Surfaces · THEME_LIGHT (live)" width={420} height={820}>
          <SurfacesCard theme={THEME_LIGHT}/>
        </DCArtboard>
        <DCArtboard id="surfaces-dark" label="Surfaces · THEME_DARK (live)" width={420} height={820}>
          <SurfacesCard theme={THEME_DARK} dark/>
        </DCArtboard>
      </DCFamily>

      <DCFamily id="colors-semantic" title="Semantic" subtitle="success / warning / error / info 四色，各配 _bg 暖淡底與 _fg 深階文字色供 badge 與 callout。基準四色不因換底色而變，只有 badge 的底與字為了在暖紙底上過 AA 而重訂。">
        <DCArtboard id="semantic-light" label="Status · THEME_LIGHT (live)" width={420} height={440}>
          <SemanticCard theme={THEME_LIGHT}/>
        </DCArtboard>
        <DCArtboard id="semantic-dark" label="Status · THEME_DARK (live)" width={420} height={440}>
          <SemanticCard theme={THEME_DARK} dark/>
        </DCArtboard>
      </DCFamily>

      <DCFamily id="colors-interaction" title="Interaction States" subtitle="hover / selected / disabled / focus 四態，桌面滑鼠互動優先。">
        <DCArtboard id="states-light" label="State · THEME_LIGHT (live)" width={520} height={520}>
          <StatesCard theme={THEME_LIGHT}/>
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  PinePaletteCard, SandNeutralsCard, SemanticCard, SurfacesCard, StatesCard,
  FoundationsAtomicColorsSection,
});
