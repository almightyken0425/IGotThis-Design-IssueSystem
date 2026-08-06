// ─────────────────────────────────────────────────────────────
// Foundations > Atomic > Layout · 版面原語視覺化
//
// 卡片：SPACING / RADIUS / SHADOW / BORDER_WIDTH / MOTION /
// ICON_SIZE / CONTROL_HEIGHT + ROW_HEIGHT 密度示範。
// 所有數值讀 no3_layout_tokens.jsx 的活 token 即時繪製。
// ─────────────────────────────────────────────────────────────

function SpacingCard() {
  return (
    <FoundCard>
      <FoundLabel>SPACING · 4px 網格</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        高密度介面預設 sm / md 級距；2xs=2 只做行內微調，不當元件間留白。
      </div>
      {Object.entries(SPACING).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 40 }}>{k}</code>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 40, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v}px</code>
          <div style={{ height: 12, background: TOKENS.p500, width: v, borderRadius: 2 }}/>
        </div>
      ))}
    </FoundCard>
  );
}

function RadiusCard() {
  return (
    <FoundCard>
      <FoundLabel>RADIUS · 小巧三階 + full</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        sm 4 控件 / md 6 卡片內子區塊 / lg 8 卡片與 modal；full 只給 pill badge 與 avatar。
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', paddingTop: 8 }}>
        {Object.entries(RADIUS).map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56,
              borderRadius: v,
              background: TOKENS.p50, border: `1.5px solid ${TOKENS.p500}`,
            }}/>
            <code style={{ fontSize: 11, color: TOKENS.ink2, display: 'block', marginTop: 6 }}>{k}</code>
            <code style={{ fontSize: 11, color: TOKENS.ink3, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v === 9999 ? 'full' : `${v}px`}</code>
          </div>
        ))}
      </div>
    </FoundCard>
  );
}

function ShadowCard() {
  // 陰影色讀 theme.shadow.color（sand 暖深階）即時轉 rgb，不寫死數值。
  const shadowRgb = (hex) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(',');
  const rgb = shadowRgb(THEME_LIGHT.shadow.color);
  const composeShadow = (s) => s.offsetY === 0 && s.blur === 0
    ? 'none'
    : `0 ${s.offsetY}px ${s.blur}px 0 rgba(${rgb},${s.opacity})`;
  return (
    <FoundCard style={{ background: THEME_LIGHT.bg.base }}>
      <FoundLabel>SHADOW · elevation 三階</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        level0 無 / level1 卡片 / level2 dropdown · popover / level3 modal。
        color = theme.shadow.color，階梯只控 offsetY / blur / opacity。
      </div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: '16px 8px 24px' }}>
        {Object.entries(SHADOW).map(([k, s]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: RADIUS.lg,
              background: TOKENS.surface,
              border: `1px solid ${TOKENS.hairline}`,
              boxShadow: composeShadow(s),
            }}/>
            <code style={{ fontSize: 11, color: TOKENS.ink2, display: 'block', marginTop: 8 }}>{k}</code>
            <code style={{ fontSize: 9.5, color: TOKENS.ink3, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>
              y{s.offsetY} blur{s.blur} α{s.opacity}
            </code>
          </div>
        ))}
      </div>
    </FoundCard>
  );
}

function BorderMotionCard() {
  return (
    <FoundCard>
      <FoundLabel>BORDER_WIDTH + MOTION</FoundLabel>
      <SectionMini>border_width</SectionMini>
      {Object.entries(BORDER_WIDTH).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 70 }}>{k}</code>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 34, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v}px</code>
          <div style={{ flex: 1, height: 24, borderRadius: RADIUS.sm, border: `${v}px solid ${TOKENS.p500}` }}/>
        </div>
      ))}
      <SectionMini style={{ marginTop: 16 }}>duration (ms)</SectionMini>
      {Object.entries(MOTION.duration).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '5px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 70 }}>{k}</code>
          <code style={{ fontSize: 11, color: TOKENS.ink3, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v}ms</code>
        </div>
      ))}
      <SectionMini style={{ marginTop: 16 }}>easing</SectionMini>
      {Object.entries(MOTION.easing).map(([k, v]) => (
        <div key={k} style={{ padding: '5px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
          <code style={{ fontSize: 11, color: TOKENS.ink3 }}>{k}</code>
          <code style={{ fontSize: 10, color: TOKENS.ink2, display: 'block', marginTop: 2 }}>{v}</code>
        </div>
      ))}
    </FoundCard>
  );
}

function IconSizeCard() {
  return (
    <FoundCard>
      <FoundLabel>ICON_SIZE · 五階</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 14, lineHeight: 1.5 }}>
        桌面密度比行動端小一號：列表與按鈕內 icon 預設 md 16。
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, padding: '8px 0 16px' }}>
        {Object.entries(ICON_SIZE).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: v + 8, height: v + 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TOKENS.p50, borderRadius: RADIUS.sm }}>
              <svg width={v} height={v} viewBox="0 0 16 16" fill="none" stroke={TOKENS.p600} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
            </div>
            <code style={{ fontSize: 11, color: TOKENS.ink2, marginTop: 6 }}>{k}</code>
            <code style={{ fontSize: 10, color: TOKENS.ink3, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v}px</code>
          </div>
        ))}
      </div>
    </FoundCard>
  );
}

function DensityCard() {
  const demoRow = (h, label) => (
    <div style={{ marginBottom: 14 }}>
      <SectionMini>{label} · {h}px</SectionMini>
      <div style={{ border: `1px solid ${TOKENS.border}`, borderRadius: RADIUS.md, overflow: 'hidden', marginTop: 4 }}>
        {['IGT-201 · 修復匯出 CSV 編碼', 'IGT-202 · 看板拖拉順序沒存'].map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: SPACING.md,
            height: h, padding: `0 ${SPACING.md}px`,
            borderTop: i === 0 ? 'none' : `1px solid ${TOKENS.hairline}`,
            fontSize: TYPE_STYLES.tableCell.size, color: TOKENS.ink,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', height: 18, padding: '0 7px',
              borderRadius: RADIUS.full, background: THEME_LIGHT.status.info_bg,
              color: THEME_LIGHT.status.info_fg, fontSize: 11, fontWeight: 500, flexShrink: 0,
            }}>open</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <FoundCard>
      <FoundLabel>ROW_HEIGHT + CONTROL_HEIGHT · 密度</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        表格 row 三檔密度，base 36 為預設。控件三階 24 / 28 / 32，滑鼠精度不受 44pt 觸控下界拘束。
      </div>
      {demoRow(ROW_HEIGHT.compact, 'row_height.compact')}
      {demoRow(ROW_HEIGHT.base, 'row_height.base')}
      {demoRow(ROW_HEIGHT.relaxed, 'row_height.relaxed')}
      <SectionMini style={{ marginTop: 4 }}>control_height</SectionMini>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', paddingTop: 8 }}>
        {Object.entries(CONTROL_HEIGHT).map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <button style={{
              height: v, padding: '0 12px', borderRadius: RADIUS.sm,
              border: 'none', background: THEME_LIGHT.primary.main, color: THEME_LIGHT.primary.on_main,
              fontSize: k === 'sm' ? 12 : 13, fontWeight: 500, cursor: 'pointer',
            }}>New issue</button>
            <code style={{ fontSize: 10, color: TOKENS.ink3, display: 'block', marginTop: 6, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{k} · {v}px</code>
          </div>
        ))}
      </div>
    </FoundCard>
  );
}

function FoundationsAtomicLayoutSection() {
  return (
    <DCSection
      id="found-atomic-layout"
      title="Atomic · Layout"
      subtitle="4px 網格 SPACING / 小巧 RADIUS 4·6·8 / SHADOW 三階 elevation / BORDER_WIDTH / MOTION / ICON_SIZE 五階 / CONTROL_HEIGHT 與 ROW_HEIGHT 桌面密度。讀 no3_layout_tokens.jsx 即時繪製。"
    >
      <DCFamily id="layout-spacing-radius" title="Spacing & Radius" subtitle="4px 網格間距階梯 + 小巧圓角。">
        <DCArtboard id="spacing-live" label="SPACING · 4px 網格 (live)" width={460} height={480}>
          <SpacingCard/>
        </DCArtboard>
        <DCArtboard id="radius-live" label="RADIUS · none → full (live)" width={460} height={320}>
          <RadiusCard/>
        </DCArtboard>
      </DCFamily>

      <DCFamily id="layout-effects" title="Effects" subtitle="elevation 三階陰影 + 邊框寬度 + 動畫 duration / easing。">
        <DCArtboard id="shadow-live" label="SHADOW · level0 → level3 (live)" width={520} height={340}>
          <ShadowCard/>
        </DCArtboard>
        <DCArtboard id="border-motion-live" label="BORDER_WIDTH + MOTION (live)" width={460} height={560}>
          <BorderMotionCard/>
        </DCArtboard>
      </DCFamily>

      <DCFamily id="layout-density" title="Sizing & Density" subtitle="icon 階梯 + 表格 row 三檔密度與控件高度三階。">
        <DCArtboard id="icon-size-live" label="ICON_SIZE · 五階 (live)" width={460} height={260}>
          <IconSizeCard/>
        </DCArtboard>
        <DCArtboard id="density-live" label="ROW_HEIGHT + CONTROL_HEIGHT (live)" width={520} height={640}>
          <DensityCard/>
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  SpacingCard, RadiusCard, ShadowCard, BorderMotionCard, IconSizeCard, DensityCard,
  FoundationsAtomicLayoutSection,
});
