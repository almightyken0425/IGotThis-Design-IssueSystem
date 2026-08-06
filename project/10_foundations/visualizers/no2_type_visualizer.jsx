// ─────────────────────────────────────────────────────────────
// Foundations > Atomic > Type · 字體系統視覺化
//
// 卡片：TYPE_STYLES 樣張 / size 階梯 / 字重 / tabular-nums 對照。
// 所有數值讀 no2_typography.jsx 的活 token 即時繪製。
// ─────────────────────────────────────────────────────────────

function TypeStylesCard() {
  const entries = Object.entries(TYPE_STYLES);
  return (
    <FoundCard>
      <FoundLabel>TYPE_STYLES · 語意階梯樣張</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        基準 body 14/20，緊湊行高換資訊密度。code 條目搭配 FONT_FAMILY.mono。
      </div>
      {entries.map(([k, s]) => (
        <div key={k} style={{ padding: '8px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
            <code style={{ fontSize: 10, color: TOKENS.p600, width: 90, flexShrink: 0 }}>{k}</code>
            <code style={{ fontSize: 9.5, color: TOKENS.ink3, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>
              {s.size}/{s.lineHeight} · w{s.weight} · ls {s.letterSpacing}
            </code>
          </div>
          <div style={{
            fontSize: s.size, fontWeight: s.weight,
            lineHeight: `${s.lineHeight}px`, letterSpacing: s.letterSpacing,
            fontFamily: k === 'code' ? FONT_FAMILY.mono : FONT_FAMILY.base,
            textTransform: k === 'overline' ? 'uppercase' : 'none',
            color: TOKENS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {k === 'code' ? 'IGT-1024 · fix(auth): token refresh' : '修復登入頁 token 過期後的無限轉圈'}
          </div>
        </div>
      ))}
    </FoundCard>
  );
}

function SizeLadderCard() {
  return (
    <FoundCard>
      <FoundLabel>TYPOGRAPHY.size · 底層階梯</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        10 → 24 緊湊八階，base = 14。大字級只留 page 級標題，不進列表。
      </div>
      {Object.entries(TYPOGRAPHY.size).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '6px 0', borderTop: `1px solid ${TOKENS.hairline}` }}>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 40 }}>{k}</code>
          <code style={{ fontSize: 11, color: TOKENS.ink3, width: 40, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v}px</code>
          <div style={{ fontSize: v, color: TOKENS.ink, whiteSpace: 'nowrap' }}>工單 Issue {v}</div>
        </div>
      ))}
    </FoundCard>
  );
}

function WeightCard() {
  return (
    <FoundCard>
      <FoundLabel>TYPOGRAPHY.weight · 字重</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        啟用 {TYPOGRAPHY_WEIGHT_ENABLED.join(' / ')} 三檔；bold 保留給 kbd 與危險操作確認。
      </div>
      {Object.entries(TYPOGRAPHY.weight).map(([k, v]) => {
        const enabled = TYPOGRAPHY_WEIGHT_ENABLED.includes(k);
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '7px 0', borderTop: `1px solid ${TOKENS.hairline}`, opacity: enabled ? 1 : 0.4 }}>
            <code style={{ fontSize: 11, color: TOKENS.ink3, width: 70 }}>{k}</code>
            <code style={{ fontSize: 11, color: TOKENS.ink3, width: 34, fontVariantNumeric: NUMERIC_FONT_VARIANT }}>{v}</code>
            <div style={{ fontSize: 15, fontWeight: v, color: TOKENS.ink, flex: 1 }}>指派給我的工單 Assigned issues</div>
            {!enabled && <code style={{ fontSize: 9.5, color: TOKENS.ink3 }}>保留</code>}
          </div>
        );
      })}
    </FoundCard>
  );
}

function TabularNumsCard() {
  const rows = [
    ['IGT-8', '2026-08-06 09:41', '117'],
    ['IGT-64', '2026-08-05 18:03', '3'],
    ['IGT-512', '2026-07-29 07:15', '1,024'],
  ];
  const table = (variant) => (
    <div style={{ flex: 1, border: `1px solid ${TOKENS.border}`, borderRadius: RADIUS.md, overflow: 'hidden' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, alignItems: 'center',
          height: ROW_HEIGHT.base, padding: `0 ${SPACING.md}px`,
          borderTop: i === 0 ? 'none' : `1px solid ${TOKENS.hairline}`,
          fontSize: TYPE_STYLES.tableCell.size, color: TOKENS.ink,
          fontVariantNumeric: variant,
        }}>
          <span style={{ width: 64, fontFamily: FONT_FAMILY.mono }}>{r[0]}</span>
          <span style={{ flex: 1, color: TOKENS.ink2 }}>{r[1]}</span>
          <span style={{ textAlign: 'right', width: 48 }}>{r[2]}</span>
        </div>
      ))}
    </div>
  );
  return (
    <FoundCard>
      <FoundLabel>NUMERIC_FONT_VARIANT · 表格數字等寬</FoundLabel>
      <div style={{ fontSize: 11, color: TOKENS.ink3, marginBottom: 12 }}>
        左 normal、右 tabular-nums。時間戳與計數欄靠 tabular 對齊，掃描不跳動。
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <SectionMini>normal</SectionMini>
          {table('normal')}
        </div>
        <div style={{ flex: 1 }}>
          <SectionMini>{NUMERIC_FONT_VARIANT}</SectionMini>
          {table(NUMERIC_FONT_VARIANT)}
        </div>
      </div>
      <SectionMini style={{ marginTop: 16 }}>font_family</SectionMini>
      <div style={{ fontSize: 10, color: TOKENS.ink2, lineHeight: 1.6 }}>
        <code style={{ display: 'block' }}>base: {FONT_FAMILY.base}</code>
        <code style={{ display: 'block', marginTop: 4 }}>mono: {FONT_FAMILY.mono}</code>
      </div>
    </FoundCard>
  );
}

function FoundationsAtomicTypeSection() {
  return (
    <DCSection
      id="found-atomic-type"
      title="Atomic · Type"
      subtitle="system font stack、基準 14px、資訊密度導向的緊湊階梯。TYPE_STYLES 為語意層、TYPOGRAPHY 為底層數值；表格數字統一 tabular-nums。讀 no2_typography.jsx 即時繪製。"
    >
      <DCFamily id="type-styles" title="Type Styles" subtitle="語意階梯樣張與底層 size 階梯。">
        <DCArtboard id="type-styles-live" label="TYPE_STYLES · 語意樣張 (live)" width={520} height={680}>
          <TypeStylesCard/>
        </DCArtboard>
        <DCArtboard id="size-ladder-live" label="TYPOGRAPHY.size · 八階 (live)" width={460} height={520}>
          <SizeLadderCard/>
        </DCArtboard>
      </DCFamily>

      <DCFamily id="type-weight-numeric" title="Weight & Numerals" subtitle="字重啟用集合與表格數字等寬對照。">
        <DCArtboard id="weight-live" label="TYPOGRAPHY.weight (live)" width={520} height={360}>
          <WeightCard/>
        </DCArtboard>
        <DCArtboard id="tabular-live" label="tabular-nums 對照 (live)" width={560} height={420}>
          <TabularNumsCard/>
        </DCArtboard>
      </DCFamily>
    </DCSection>
  );
}

Object.assign(window, {
  TypeStylesCard, SizeLadderCard, WeightCard, TabularNumsCard,
  FoundationsAtomicTypeSection,
});
