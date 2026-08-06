
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Artboards are reorderable (grip-drag), labels/titles are inline-editable,
// and any artboard can be opened in a fullscreen focus overlay (←/→/Esc).
// State persists to a .design-canvas.state.json sidecar via the host
// bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = [
    '.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}',
    '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}',
    '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}',
    '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}',
    '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
    '.dc-card{transition:box-shadow .15s,transform .15s}',
    '.dc-card *{scrollbar-width:none}',
    '.dc-card *::-webkit-scrollbar{display:none}',
    '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px}',
    '.dc-grip{cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s}',
    '.dc-grip:hover{background:rgba(0,0,0,.08)}',
    '.dc-grip:active{cursor:grabbing}',
    '.dc-labeltext{cursor:pointer;border-radius:4px;padding:3px 6px;display:flex;align-items:center;transition:background .12s}',
    '.dc-labeltext:hover{background:rgba(0,0,0,.05)}',
    '.dc-expand{position:absolute;bottom:100%;right:0;margin-bottom:5px;z-index:2;opacity:0;transition:opacity .12s,background .12s;',
    '  width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;',
    '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center}',
    '.dc-expand:hover{background:rgba(0,0,0,.06);color:#2a251f}',
    '[data-dc-slot]:hover .dc-expand{opacity:1}',
  ].join('\n');
  document.head.appendChild(s);
}

const DCCtx = React.createContext(null);

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, focused
// artboard). Order/titles/labels persist to a .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';

function DesignCanvas({ children, minScale, maxScale, style, resetKey }) {
  const [state, setState] = React.useState({ sections: {}, focus: null });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);

  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((saved) => {
        if (off || !saved || !saved.sections) return;
        skipNextWrite.current = true;
        setState((s) => ({ ...s, sections: saved.sections }));
      })
      .catch(() => {})
      .finally(() => { didRead.current = true; if (!off) setReady(true); });
    const t = setTimeout(() => { if (!off) setReady(true); }, 150);
    return () => { off = true; clearTimeout(t); };
  }, []);

  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) { skipNextWrite.current = false; return; }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({ sections: state.sections })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Supports two layouts:
  //   1) DCSection > DCArtboard (legacy flat)
  //   2) DCSection > DCFamily > DCArtboard (grouped)
  // A section can use one mode or the other, not both. Wrapping artboards in
  // other elements opts out of focus/reorder.
  const registry = {};     // slotId -> { sectionId, familyId, artboard }
  const sectionMeta = {};  // sectionId -> { title, subtitle, slotIds[], families[]|null }
  const sectionOrder = [];
  React.Children.forEach(children, (sec) => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const secChildren = React.Children.toArray(sec.props.children);
    const familyNodes = secChildren.filter((c) => c && c.type === DCFamily);

    if (familyNodes.length > 0) {
      const flatSlotIds = [];
      const familyList = [];
      familyNodes.forEach((fam) => {
        const fid = fam.props.id;
        if (!fid) return;
        const famArtboards = React.Children.toArray(fam.props.children).filter((c) => c && c.type === DCArtboard);
        const famSrcIds = [];
        famArtboards.forEach((ab) => {
          const aid = ab.props.id ?? ab.props.label;
          if (!aid) return;
          registry[`${sid}/${aid}`] = { sectionId: sid, familyId: fid, artboard: ab };
          famSrcIds.push(aid);
        });
        const famPersisted = (persisted.families || {})[fid] || {};
        const famKept = (famPersisted.order || []).filter((k) => famSrcIds.includes(k));
        const famOrdered = [...famKept, ...famSrcIds.filter((k) => !famKept.includes(k))];
        familyList.push({
          id: fid,
          title: famPersisted.title ?? fam.props.title,
          subtitle: fam.props.subtitle,
          slotIds: famOrdered,
        });
        flatSlotIds.push(...famOrdered);
      });
      sectionMeta[sid] = {
        title: persisted.title ?? sec.props.title,
        subtitle: sec.props.subtitle,
        slotIds: flatSlotIds,
        families: familyList,
      };
    } else {
      const srcIds = [];
      secChildren.forEach((ab) => {
        if (!ab || ab.type !== DCArtboard) return;
        const aid = ab.props.id ?? ab.props.label;
        if (!aid) return;
        registry[`${sid}/${aid}`] = { sectionId: sid, familyId: null, artboard: ab };
        srcIds.push(aid);
      });
      const kept = (persisted.order || []).filter((k) => srcIds.includes(k));
      sectionMeta[sid] = {
        title: persisted.title ?? sec.props.title,
        subtitle: sec.props.subtitle,
        slotIds: [...kept, ...srcIds.filter((k) => !kept.includes(k))],
        families: null,
      };
    }
  });

  const api = React.useMemo(() => ({
    state,
    section: (id) => state.sections[id] || {},
    patchSection: (id, p) => setState((s) => ({
      ...s,
      sections: { ...s.sections, [id]: { ...s.sections[id], ...(typeof p === 'function' ? p(s.sections[id] || {}) : p) } },
    })),
    setFocus: (slotId) => setState((s) => ({ ...s, focus: slotId })),
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') api.setFocus(null); };
    const onPd = (e) => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);

  return (
    <DCCtx.Provider value={api}>
      <DCViewport minScale={minScale} maxScale={maxScale} style={style} resetKey={resetKey}>{ready && children}</DCViewport>
      {state.focus && registry[state.focus] && (
        <DCFocusOverlay entry={registry[state.focus]} sectionMeta={sectionMeta} sectionOrder={sectionOrder} />
      )}
    </DCCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (modifier-gated, no time / no spatial heuristics):
//   trackpad two-finger scroll  → pan
//   trackpad pinch              → ignored (no jitter)
//   mouse wheel                 → vertical pan
//   mouse wheel + shift         → horizontal pan
//   any wheel/pinch + Ctrl(Win)/Cmd(Mac) held → zoom (cursor as anchor)
//   middle-drag / primary-drag-on-bg → pan
//
// Why a real-keyboard tracker (not e.ctrlKey): browsers synthesize
// ctrlKey=true on every wheel event during trackpad pinch, even when no
// key is held. Reading e.ctrlKey turns every pinch into a zoom — exactly
// the misfire we're trying to avoid. We track Control/Meta via
// keydown/keyup and treat synthesized ctrlKey on wheel as a signal to
// drop the event (so pinching without holding the zoom key does nothing,
// instead of producing tiny vertical pan jitter).
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({ children, minScale = 0.1, maxScale = 8, style = {}, resetKey }) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({ x: 0, y: 0, scale: 1 });

  const apply = React.useCallback(() => {
    const { x, y, scale } = tf.current;
    const el = worldRef.current;
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  }, []);

  // route 切換時把 viewport 拉回原點，避免前一個 sub-tab 累積的 pan/zoom
  // 把新內容推離可視範圍（小 sub-tab 內容塞不下大偏移）。
  // useLayoutEffect 而非 useEffect：必須在 paint 前同步寫入 transform，
  // 否則新 children 的第一幀會用舊 transform 畫，當 pan 偏移到 10 萬級時
  // 新內容會被推到螢幕外，視覺感受為「卡在原位」。
  // 同時 reset vp 的 native scrollLeft/scrollTop：autoFocus 之類的元素會
  // 觸發瀏覽器 scrollIntoView，overflow:hidden 擋不住程式化 scroll，
  // 留著會讓後續 transform 計算錨點偏掉。
  React.useLayoutEffect(() => {
    tf.current = { x: 0, y: 0, scale: 1 };
    apply();
    if (vpRef.current) {
      vpRef.current.scrollLeft = 0;
      vpRef.current.scrollTop = 0;
    }
  }, [resetKey, apply]);

  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || '');
    const zoomKeyName = isMac ? 'Meta' : 'Control';
    let zoomKeyDown = false;
    const onKeyDown = (e) => { if (e.key === zoomKeyName) zoomKeyDown = true; };
    const onKeyUp = (e) => { if (e.key === zoomKeyName) zoomKeyDown = false; };
    const onBlur = () => { zoomKeyDown = false; };

    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left, py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if (zoomKeyDown) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
        return;
      }
      // Synthesized ctrlKey without real zoom key = trackpad pinch w/o intent → swallow
      if (e.ctrlKey) return;
      // Shift+wheel on a mouse: browsers sometimes auto-swap deltaY→deltaX, sometimes don't
      const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
      const dy = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
      tf.current.x -= dx;
      tf.current.y -= dy;
      apply();
    };

    // Safari fires native gesture* events for trackpad pinch with a smooth
    // e.scale. We honor them only when the real zoom key is held; without
    // it, swallow so the pinch is a no-op. isGesturing also gates the
    // concurrent ctrlKey wheel stream Safari emits during the same pinch.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = (e) => {
      e.preventDefault();
      if (!zoomKeyDown) return;
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = (e) => {
      e.preventDefault();
      if (!isGesturing) return;
      zoomAt(e.clientX, e.clientY, (gsBase * e.scale) / tf.current.scale);
    };
    const onGestureEnd = (e) => { e.preventDefault(); isGesturing = false; };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = (e) => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || (e.button === 0 && onBg))) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // capture phase: we must intercept wheels BEFORE inner overflow:auto
    // descendants (artboard scroll containers) form a scroll-latch. Without
    // capture, Chrome briefly holds the latched inner element on direction
    // reversal even when we preventDefault on bubble — feels like a 100-200ms
    // stall every time the wheel direction flips.
    vp.addEventListener('wheel', onWheel, { passive: false, capture: true });
    vp.addEventListener('gesturestart', onGestureStart, { passive: false, capture: true });
    vp.addEventListener('gesturechange', onGestureChange, { passive: false, capture: true });
    vp.addEventListener('gestureend', onGestureEnd, { passive: false, capture: true });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      vp.removeEventListener('wheel', onWheel, { capture: true });
      vp.removeEventListener('gesturestart', onGestureStart, { capture: true });
      vp.removeEventListener('gesturechange', onGestureChange, { capture: true });
      vp.removeEventListener('gestureend', onGestureEnd, { capture: true });
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [apply, minScale, maxScale]);

  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return (
    <div
      ref={vpRef}
      className="design-canvas"
      style={{
        height: '100vh', width: '100vw',
        background: DC.bg,
        overflow: 'hidden',
        overscrollBehavior: 'none',
        touchAction: 'none',
        position: 'relative',
        fontFamily: DC.font,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        ref={worldRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          transformOrigin: '0 0',
          willChange: 'transform',
          width: 'max-content', minWidth: '100%',
          minHeight: '100%',
          padding: '60px 60px 80px 260px',
        }}
      >
        <div style={{ position: 'absolute', inset: -6000, backgroundImage: gridSvg, backgroundSize: '120px 120px', pointerEvents: 'none', zIndex: -1 }} />
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + (families | flat artboards) in persisted order
//
// Two modes (mutually exclusive per section, detected by child shape):
//   1) DCSection > DCArtboard          legacy flat mode
//   2) DCSection > DCFamily > DCArtboard  grouped mode
//
// direction="row" / "column" applies only to flat mode (artboard arrangement
// within the section). In family mode the section always stacks families
// vertically; each family carries its own direction.
//
// Flat mode legacy notes:
//   direction="row"（預設）：artboards 水平擺，grip 可拖拉重排（X 軸）。
//     Screens / Explorations tab 用這個 — 同主題不同 variants 並陳對比。
//   direction="column"：artboards 垂直堆，grip 停用（順序固定）。
//     舊 Foundations tab 用過；新版改用 family 模式。
// ─────────────────────────────────────────────────────────────
function DCSection({ id, title, subtitle, children, gap = 48, direction = 'row' }) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(children);
  const families = all.filter((c) => c && c.type === DCFamily);
  const artboards = all.filter((c) => c && c.type === DCArtboard);
  const rest = all.filter((c) => !(c && c.type === DCArtboard) && !(c && c.type === DCFamily));
  const sec = (ctx && sid && ctx.section(sid)) || {};
  const isFamilyMode = families.length > 0;

  // Flat-mode order (legacy)
  const srcOrder = artboards.map((a) => a.props.id ?? a.props.label);
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter((k) => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter((k) => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map((a) => [a.props.id ?? a.props.label, a]));
  const isCol = direction === 'column';

  return (
    <div data-dc-section={sid} style={{ marginBottom: 80, position: 'relative' }}>
      <div style={{ padding: '0 60px 56px' }}>
        <DCEditable tag="div" value={sec.title ?? title}
          onChange={(v) => ctx && sid && ctx.patchSection(sid, { title: v })}
          style={{ fontSize: 28, fontWeight: 600, color: DC.title, letterSpacing: -0.4, marginBottom: 6, display: 'inline-block' }} />
        {subtitle && <div style={{ fontSize: 16, color: DC.subtitle }}>{subtitle}</div>}
      </div>
      {isFamilyMode ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 64, padding: '0 60px',
          alignItems: 'flex-start',
          width: 'fit-content',
        }}>
          {families.map((fam) => (
            <DCFamilyFrame key={fam.props.id} sectionId={sid} family={fam} sec={sec} ctx={ctx} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: isCol ? 'column' : 'row',
          gap, padding: '0 60px',
          alignItems: 'flex-start',
          width: isCol ? 'fit-content' : 'max-content',
        }}>
          {order.map((k) => (
            <DCArtboardFrame key={k} sectionId={sid} familyId={null} artboard={byId[k]} order={order}
              label={(sec.labels || {})[k] ?? byId[k].props.label}
              draggable={!isCol}
              onRename={(v) => ctx && ctx.patchSection(sid, (x) => ({ labels: { ...x.labels, [k]: v } }))}
              onReorder={(next) => ctx && ctx.patchSection(sid, { order: next })}
              onFocus={() => ctx && ctx.setFocus(`${sid}/${k}`)} />
          ))}
        </div>
      )}
      {rest}
    </div>
  );
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection or DCFamily.
function DCArtboard() { return null; }

// ─────────────────────────────────────────────────────────────
// DCFamily — sub-group within a Section. Holds a labeled batch of artboards
// that share a theme (e.g. "Header Buttons" inside "Navigation").
//
// direction="row"（預設）：family 內 artboard 水平並排，同類變體一眼比較。
// direction="column"：family 內 artboard 垂直堆，文件流場景用。
//
// Focus overlay 鍵盤行為：← / → 在同 family 內 cycle；shift + ← / → 跨 family；
// ↑ / ↓ 跨 section。
// ─────────────────────────────────────────────────────────────
function DCFamily() { return null; }

function DCFamilyFrame({ sectionId, family, sec, ctx }) {
  const { id: fid, title, subtitle, direction = 'row', gap = 32, children } = family.props;
  const artboards = React.Children.toArray(children).filter((c) => c && c.type === DCArtboard);
  const srcOrder = artboards.map((a) => a.props.id ?? a.props.label);
  const famState = ((sec.families || {})[fid]) || {};

  const order = React.useMemo(() => {
    const kept = (famState.order || []).filter((k) => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter((k) => !kept.includes(k))];
  }, [famState.order, srcOrder.join('|')]);

  const byId = Object.fromEntries(artboards.map((a) => [a.props.id ?? a.props.label, a]));
  const isCol = direction === 'column';

  return (
    <div data-dc-family={fid} style={{ position: 'relative' }}>
      <div style={{ marginBottom: 24 }}>
        <DCEditable tag="div" value={famState.title ?? title}
          onChange={(v) => ctx && ctx.patchSection(sectionId, (x) => ({
            families: { ...(x.families || {}), [fid]: { ...((x.families || {})[fid]), title: v } },
          }))}
          style={{ fontSize: 19, fontWeight: 600, color: DC.title, letterSpacing: -0.2, marginBottom: 4, display: 'inline-block' }} />
        {subtitle && <div style={{ fontSize: 13, color: DC.subtitle, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: isCol ? 'column' : 'row',
        gap, alignItems: 'flex-start',
        width: isCol ? 'fit-content' : 'max-content',
      }}>
        {order.map((k) => (
          <DCArtboardFrame key={k} sectionId={sectionId} familyId={fid} artboard={byId[k]} order={order}
            label={(sec.labels || {})[k] ?? byId[k].props.label}
            draggable={!isCol}
            onRename={(v) => ctx && ctx.patchSection(sectionId, (x) => ({ labels: { ...x.labels, [k]: v } }))}
            onReorder={(next) => ctx && ctx.patchSection(sectionId, (x) => ({
              families: { ...(x.families || {}), [fid]: { ...((x.families || {})[fid]), order: next } },
            }))}
            onFocus={() => ctx && ctx.setFocus(`${sectionId}/${k}`)} />
        ))}
      </div>
    </div>
  );
}

function DCArtboardFrame({ sectionId, familyId, artboard, label, order, draggable = true, onRename, onReorder, onFocus }) {
  const { id: rawId, label: rawLabel, width = 260, height = 480, children, style = {} } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  // 'auto' = let CSS size the card to its content (used by token tables
  // whose row count varies). minWidth keeps the frame from collapsing.
  const isAutoW = width === 'auto';
  const isAutoH = height === 'auto';

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop. Drag scope is the family (if present) or the section,
  // so artboards never cross family boundaries via drag.
  const onGripDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const scopeSel = familyId
      ? `[data-dc-family="${familyId}"]`
      : `[data-dc-section="${sectionId}"]`;
    const peers = Array.from(document.querySelectorAll(`${scopeSel} [data-dc-slot]`))
      .filter((el) => order.includes(el.dataset.dcSlot));
    const homes = peers.map((el) => ({ el, id: el.dataset.dcSlot, x: el.getBoundingClientRect().left }));
    const slotXs = homes.map((h) => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');

    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };

    const move = (ev) => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0, best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) { best = d; nearest = i; }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter((k) => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };

    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) { h.el.style.transition = 'none'; h.el.style.transform = ''; }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };

  return (
    <div ref={ref} data-dc-slot={id} style={{ position: 'relative', flexShrink: 0 }}>
      <div className="dc-labelrow" style={{ position: 'absolute', bottom: '100%', left: -4, marginBottom: 4, color: DC.label }}>
        {draggable && (
          <div className="dc-grip" onPointerDown={onGripDown} title="Drag to reorder">
            <svg width="9" height="13" viewBox="0 0 9 13" fill="currentColor"><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="2" cy="6.5" r="1.1"/><circle cx="7" cy="6.5" r="1.1"/><circle cx="2" cy="11" r="1.1"/><circle cx="7" cy="11" r="1.1"/></svg>
          </div>
        )}
        <div className="dc-labeltext" onClick={onFocus} title="Click to focus">
          <DCEditable value={label} onChange={onRename} onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 15, fontWeight: 500, color: DC.label, lineHeight: 1 }} />
        </div>
      </div>
      <button className="dc-expand" onClick={onFocus} onPointerDown={(e) => e.stopPropagation()} title="Focus">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"/></svg>
      </button>
      <div className="dc-card"
        style={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)', overflow: 'hidden',
          width: isAutoW ? 'fit-content' : width,
          minWidth: isAutoW ? 260 : undefined,
          height: isAutoH ? 'auto' : height,
          background: '#fff', ...style }}>
        {children || <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13, fontFamily: DC.font }}>{id}</div>}
      </div>
    </div>
  );
}

// Inline rename — commits on blur or Enter.
function DCEditable({ value, onChange, style, tag = 'span', onClick }) {
  const T = tag;
  return (
    <T className="dc-editable" contentEditable suppressContentEditableWarning
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => onChange && onChange(e.currentTarget.textContent)}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
      style={style}>{value}</T>
  );
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({ entry, sectionMeta, sectionOrder }) {
  const ctx = React.useContext(DCCtx);
  const { sectionId, familyId, artboard } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const aid = artboard.props.id ?? artboard.props.label;
  const secIdx = sectionOrder.indexOf(sectionId);

  // Family-aware peer list: in family mode, dots + ← / → cycle the current
  // family; shift + ← / → jumps families. In flat mode, peers is the section's
  // slotIds and shift falls back to section nav.
  const currentFamily = meta.families ? meta.families.find((f) => f.slotIds.includes(aid)) : null;
  const peers = currentFamily ? currentFamily.slotIds : meta.slotIds;
  const idx = peers.indexOf(aid);

  const go = (d) => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goFamily = (d) => {
    if (!meta.families || meta.families.length === 0) { goSection(d); return; }
    const fi = meta.families.findIndex((f) => f.slotIds.includes(aid));
    if (fi < 0) return;
    const nf = meta.families[(fi + d + meta.families.length) % meta.families.length];
    if (nf && nf.slotIds.length > 0) ctx.setFocus(`${sectionId}/${nf.slotIds[0]}`);
  };
  const goSection = (d) => {
    const ns = sectionOrder[(secIdx + d + sectionOrder.length) % sectionOrder.length];
    const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
    if (first) ctx.setFocus(`${ns}/${first}`);
  };

  React.useEffect(() => {
    const k = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); e.shiftKey ? goFamily(-1) : go(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); e.shiftKey ? goFamily(1) : go(1); }
      if (e.key === 'ArrowUp') { e.preventDefault(); goSection(-1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); goSection(1); }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });

  const { width = 260, height = 480, children } = artboard.props;
  const isAutoW = width === 'auto';
  const isAutoH = height === 'auto';
  const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => { const r = () => setVp({ w: window.innerWidth, h: window.innerHeight }); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  // Auto-sized artboards skip the zoom-to-fit math (no fixed dims to scale to).
  const scale = (isAutoW || isAutoH) ? 1 : Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));

  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({ dir, onClick }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ position: 'absolute', top: '50%', [dir]: 28, transform: 'translateY(-50%)',
        border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.9)',
        width: 44, height: 44, borderRadius: 22, fontSize: 18, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.18)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d={dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'} /></svg>
    </button>
  );

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(
    <div onClick={() => ctx.setFocus(null)}
      onWheel={(e) => e.preventDefault()}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(24,20,16,.6)', backdropFilter: 'blur(14px)',
        fontFamily: DC.font, color: '#fff' }}>

      {/* top bar: section dropdown (left) · close (right) */}
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'flex-start', padding: '16px 20px 0', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setDd((o) => !o)}
            style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', padding: '6px 8px',
              borderRadius: 6, textAlign: 'left', fontFamily: 'inherit' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>{meta.title}</span>
              {currentFamily && <span style={{ fontSize: 14, opacity: .6 }}>· {currentFamily.title}</span>}
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ opacity: .7 }}><path d="M2 4l3.5 3.5L9 4"/></svg>
            </span>
            {meta.subtitle && <span style={{ display: 'block', fontSize: 13, opacity: .6, fontWeight: 400, marginTop: 2 }}>{meta.subtitle}</span>}
          </button>
          {ddOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#2a251f', borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,.4)', padding: 4, minWidth: 200, zIndex: 10 }}>
              {sectionOrder.map((sid) => (
                <button key={sid} onClick={() => { setDd(false); const f = sectionMeta[sid].slotIds[0]; if (f) ctx.setFocus(`${sid}/${f}`); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent', color: '#fff',
                    padding: '8px 12px', borderRadius: 5, fontSize: 14, fontWeight: sid === sectionId ? 600 : 400, fontFamily: 'inherit' }}>
                  {sectionMeta[sid].title}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => ctx.setFocus(null)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,.7)', width: 32, height: 32,
            borderRadius: 16, fontSize: 20, cursor: 'pointer', lineHeight: 1, transition: 'background .12s' }}>×</button>
      </div>

      {/* card centered, label + index below — only the card itself stops
          propagation so any backdrop click (including the margins around
          the card) exits focus */}
      <div
        style={{ position: 'absolute', top: 64, bottom: 56, left: 100, right: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: isAutoW ? 'auto' : width * scale,
          height: isAutoH ? 'auto' : height * scale,
          position: 'relative',
        }}>
          <div style={{
            width: isAutoW ? 'fit-content' : width,
            minWidth: isAutoW ? 260 : undefined,
            height: isAutoH ? 'auto' : height,
            transform: (isAutoW || isAutoH) ? undefined : `scale(${scale})`,
            transformOrigin: 'top left',
            background: '#fff', borderRadius: 2, overflow: 'hidden',
            boxShadow: '0 20px 80px rgba(0,0,0,.4)' }}>
            {children || <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>{aid}</div>}
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()} style={{ fontSize: 14, fontWeight: 500, opacity: .85, textAlign: 'center' }}>
          {(sec.labels || {})[aid] ?? artboard.props.label}
          <span style={{ opacity: .5, marginLeft: 10, fontVariantNumeric: 'tabular-nums' }}>{idx + 1} / {peers.length}</span>
        </div>
      </div>

      <Arrow dir="left" onClick={() => go(-1)} />
      <Arrow dir="right" onClick={() => go(1)} />

      {/* dots */}
      <div onClick={(e) => e.stopPropagation()}
        style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
        {peers.map((p, i) => (
          <button key={p} onClick={() => ctx.setFocus(`${sectionId}/${p}`)}
            style={{ border: 'none', padding: 0, cursor: 'pointer', width: 6, height: 6, borderRadius: 3,
              background: i === idx ? '#fff' : 'rgba(255,255,255,.3)' }} />
        ))}
      </div>
    </div>,
    document.body,
  );
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({ children, top, left, right, bottom, rotate = -2, width = 180 }) {
  return (
    <div style={{
      position: 'absolute', top, left, right, bottom, width,
      background: DC.postitBg, padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14, lineHeight: 1.4, color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5,
    }}>{children}</div>
  );
}

Object.assign(window, { DesignCanvas, DCSection, DCFamily, DCArtboard, DCPostIt });

