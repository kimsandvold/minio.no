/**
 * Spillmenyen – felles «Bytt spill»-ark for alle håndverkerspillene.
 *
 * Bruk i et spill:
 *   <script src="/underholdning/lib/spillmeny.js"></script>   (i <head>, uten defer)
 *   <button data-spillmeny aria-label="Bytt spill">…</button> (åpner arket)
 *   <a href="/underholdning" data-spillmeny>Flere spill</a>   (åpner arket i stedet for å navigere)
 *
 * Spillet kan fortelle om en runde pågår, så arket pauser den og advarer før man bytter:
 *   SpillMeny.register({ busy: () => state === 'playing', pause: () => pauseGame() })
 *
 * Listen må holdes i takt med src/data/spill.ts.
 */
(() => {
    'use strict';
    if (window.SpillMeny) return;

    const SPILL = [
        { href: '/underholdning/tool-ved.html', tittel: 'Vedhoggeren', meta: 'Treffsikkerhet · 75 sek', bilde: '/images/underholdning/ved.webp' },
        { href: '/underholdning/tool-dreiemester.html', tittel: 'Dreiemester', meta: 'Presisjon · 2 min', bilde: '/images/underholdning/dreiemester.webp' },
        { href: '/underholdning/tool-terrasse.html', tittel: 'Terrassemester', meta: 'Logikk · 3 min', bilde: '/images/underholdning/terrasse.webp' },
        { href: '/underholdning/tool-stack.html', tittel: 'Stabelmester', meta: 'Presisjon · 2 min', bilde: '/images/underholdning/stack.webp' },
        { href: '/underholdning/tool-nails.html', tittel: "Spiker'n", meta: 'Timing · 3 min', bilde: '/images/underholdning/nails.webp' },
        { href: '/underholdning/tool-saw.html', tittel: 'Sag Rytme', meta: 'Rytme · 3 min', bilde: '/images/underholdning/saw.webp' },
        { href: '/underholdning/tool-game.html', tittel: 'Finn Verktøyet', meta: 'Reaksjon · 30 sek', bilde: '/images/underholdning/game.webp' },
        { href: '/underholdning/tool-maze.html', tittel: 'Verktøyjakt', meta: 'Labyrint · 5 min', bilde: '/images/underholdning/maze.webp' },
        { href: '/underholdning/tool-quiz.html', tittel: 'Verktøy Quiz', meta: 'Kunnskap · 3 min', bilde: '/images/underholdning/quiz.webp' },
        { href: '/underholdning/tool-kursmester.html', tittel: 'Kursmester', meta: 'Fagkunnskap · 1–3 min', bilde: '/images/underholdning/kursmester.webp' },
    ];

    const here = location.pathname.replace(/\/+$/, '');
    let hooks = { busy: () => false, pause: () => {} };
    let root = null, sheet = null, note = null, lastFocus = null, isOpen = false, pushed = false;

    const CSS = `
.sm-root{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;
  font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,"Helvetica Neue",Arial,sans-serif;
  -webkit-font-smoothing:antialiased;visibility:hidden;pointer-events:none}
.sm-root.sm-open{visibility:visible;pointer-events:auto}
.sm-dim{position:absolute;inset:0;background:rgba(8,6,5,.62);opacity:0;transition:opacity .28s ease;
  backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}
.sm-open .sm-dim{opacity:1}
.sm-sheet{position:relative;width:100%;max-width:480px;max-height:min(88vh,760px);display:flex;flex-direction:column;
  background:#1c1916;color:#f6f0e9;border:1px solid rgba(255,255,255,.09);border-bottom:0;border-radius:22px 22px 0 0;
  box-shadow:0 -24px 60px rgba(0,0,0,.55);transform:translateY(104%);transition:transform .34s cubic-bezier(.22,1,.36,1);
  padding-bottom:env(safe-area-inset-bottom);overscroll-behavior:contain;touch-action:pan-y}
.sm-open .sm-sheet{transform:none}
.sm-sheet.sm-drag{transition:none}
.sm-sheet:focus{outline:none}
.sm-grip{flex:none;display:grid;place-items:center;height:22px;cursor:grab;touch-action:none}
.sm-grip::before{content:"";width:38px;height:4px;border-radius:4px;background:rgba(255,255,255,.22)}
.sm-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 18px 10px 20px;touch-action:none}
.sm-head h2{margin:0;font-size:20px;font-weight:650;letter-spacing:-.02em}
.sm-x{flex:none;width:38px;height:38px;display:grid;place-items:center;border-radius:12px;border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.05);color:#d8cfc5;cursor:pointer;padding:0}
.sm-x:hover{color:#fff;border-color:rgba(255,255,255,.2)}
.sm-x svg{width:18px;height:18px}
.sm-note{flex:none;margin:0 16px 10px;padding:10px 12px;border-radius:12px;background:rgba(224,137,95,.12);
  border:1px solid rgba(224,137,95,.3);color:#f2c3a8;font-size:13px;line-height:1.4}
.sm-note[hidden]{display:none}
.sm-list{list-style:none;margin:0;padding:2px 12px 8px;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;flex:1 1 auto;min-height:0}
.sm-list li{margin:0}
.sm-item{display:flex;align-items:center;gap:14px;padding:8px 10px 8px 8px;border-radius:16px;color:inherit;text-decoration:none;
  border:1px solid transparent;transition:background .15s ease,border-color .15s ease;-webkit-tap-highlight-color:transparent}
.sm-item:hover,.sm-item:focus-visible{background:rgba(255,255,255,.05);outline:none;border-color:rgba(255,255,255,.08)}
.sm-item:active{background:rgba(255,255,255,.08)}
.sm-thumb{flex:none;width:52px;height:52px;border-radius:13px;overflow:hidden;background:#2a2622;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.sm-thumb img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 42%}
.sm-txt{flex:1;min-width:0}
.sm-t{display:block;font-size:16px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sm-m{display:block;margin-top:2px;font-size:13px;color:#a99e92}
.sm-go{flex:none;color:#7d736a}
.sm-go svg{width:18px;height:18px;display:block}
.sm-item[aria-current]{background:rgba(224,137,95,.1);border-color:rgba(224,137,95,.35)}
.sm-now{flex:none;font-size:11px;font-weight:650;letter-spacing:.06em;text-transform:uppercase;color:#e0895f}
.sm-foot{flex:none;padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,.07)}
.sm-all{display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border-radius:14px;
  background:#e0895f;color:#1c1916;font-weight:650;font-size:15px;text-decoration:none}
.sm-all:hover{background:#ea9b74}
.sm-all svg{width:16px;height:16px}
@media (min-width:700px) and (min-height:560px){
  .sm-root{align-items:center}
  .sm-sheet{border-radius:22px;border-bottom:1px solid rgba(255,255,255,.09);transform:translateY(24px) scale(.97);opacity:0;
    transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .2s ease;padding-bottom:0}
  .sm-open .sm-sheet{transform:none;opacity:1}
  .sm-grip{height:14px}
  .sm-grip::before{display:none}
}
@media (prefers-reduced-motion:reduce){.sm-sheet,.sm-dim{transition:none!important}}
.sm-knapp{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:36px;padding:0 12px 0 10px;flex:none;
  border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;cursor:pointer;
  font:600 14px/1 ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,sans-serif;letter-spacing:-.01em;
  -webkit-tap-highlight-color:transparent;transition:background .15s ease,border-color .15s ease}
.sm-knapp:hover{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.24)}
.sm-knapp:active{transform:scale(.97)}
.sm-knapp:focus-visible{outline:2px solid #e0895f;outline-offset:2px}
.sm-knapp svg{width:16px;height:16px;display:block;flex:none}
.header-home svg{width:18px;height:18px;display:block}
`;

    const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    const ICON_GO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    const ICON_ALL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

    function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

    // Stilene legges inn med en gang, så knappene i spillene er ferdig stylet ved første tegning.
    const style = document.createElement('style');
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);

    function build() {

        root = document.createElement('div');
        root.className = 'sm-root';
        root.setAttribute('aria-hidden', 'true');
        root.innerHTML = `
<div class="sm-dim" data-sm-close></div>
<div class="sm-sheet" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="smTitle">
  <div class="sm-grip" aria-hidden="true"></div>
  <div class="sm-head"><h2 id="smTitle">Bytt spill</h2><button type="button" class="sm-x" data-sm-close aria-label="Lukk">${ICON_X}</button></div>
  <p class="sm-note" hidden>Runden er satt på pause. Bytter du spill, går den tapt.</p>
  <ul class="sm-list">${SPILL.map((s) => {
      const cur = s.href === here;
      return `<li><a class="sm-item" href="${s.href}"${cur ? ' aria-current="page" data-sm-close' : ''}>
<span class="sm-thumb"><img src="${s.bilde}" alt="" width="52" height="52" loading="lazy" decoding="async"></span>
<span class="sm-txt"><span class="sm-t">${esc(s.tittel)}</span><span class="sm-m">${esc(s.meta)}</span></span>
${cur ? '<span class="sm-now">Spiller nå</span>' : `<span class="sm-go">${ICON_GO}</span>`}</a></li>`;
  }).join('')}</ul>
  <div class="sm-foot"><a class="sm-all" href="/underholdning">Alle spill og rabattkoden ${ICON_ALL}</a></div>
</div>`;
        document.body.appendChild(root);
        sheet = root.querySelector('.sm-sheet');
        note = root.querySelector('.sm-note');

        // Spillene lytter på document/window – ikke la trykk og taster i arket nå dem.
        ['pointerdown', 'pointerup', 'pointermove', 'mousedown', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'click', 'keydown', 'keyup', 'wheel']
            .forEach((t) => root.addEventListener(t, (e) => e.stopPropagation(), { passive: true }));

        root.addEventListener('click', (e) => {
            const c = e.target.closest('[data-sm-close]');
            if (c) { e.preventDefault(); close(); return; }
            const a = e.target.closest('a.sm-item, a.sm-all');
            if (!a) return;
            try { if (typeof gtag === 'function') gtag('event', 'select_content', { content_type: 'spillmeny', item_id: a.getAttribute('href') }); } catch (err) { /* ignore */ }
            // Erstatt arkets historikkinnslag, så «tilbake» i neste spill går rett til dette spillet.
            if (pushed && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
                e.preventDefault();
                pushed = false;
                location.replace(a.href);
            }
        });
        root.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') { e.preventDefault(); close(); return; }
            if (e.key === 'Tab') trapTab(e);
        });

        // Dra ned for å lukke (grip og topp).
        let y0 = null, dy = 0;
        const start = (e) => { if (!isOpen) return; y0 = e.clientY; dy = 0; sheet.classList.add('sm-drag'); e.target.setPointerCapture?.(e.pointerId); };
        const move = (e) => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); sheet.style.transform = `translateY(${dy}px)`; };
        const end = () => {
            if (y0 === null) return;
            y0 = null; sheet.classList.remove('sm-drag'); sheet.style.transform = '';
            if (dy > Math.min(140, sheet.offsetHeight * 0.25)) close();
        };
        [root.querySelector('.sm-grip'), root.querySelector('.sm-head')].forEach((el) => {
            el.addEventListener('pointerdown', (e) => { if (!e.target.closest('button')) start(e); });
            el.addEventListener('pointermove', move);
            el.addEventListener('pointerup', end);
            el.addEventListener('pointercancel', end);
        });

        window.addEventListener('popstate', () => { if (isOpen) { pushed = false; close(); } });
    }

    function trapTab(e) {
        const f = [...sheet.querySelectorAll('a[href],button')].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function open() {
        if (!root) build();
        if (isOpen) return;
        let busy = false;
        try { busy = !!hooks.busy(); } catch (e) { /* ignore */ }
        if (busy) { try { hooks.pause(); } catch (e) { /* ignore */ } }
        note.hidden = !busy;
        isOpen = true;
        lastFocus = document.activeElement;
        root.setAttribute('aria-hidden', 'false');
        void root.offsetHeight;
        root.classList.add('sm-open');
        try { history.pushState({ spillmeny: 1 }, ''); pushed = true; } catch (e) { pushed = false; }
        const cur = sheet.querySelector('[aria-current]');
        requestAnimationFrame(() => {
            if (cur) cur.scrollIntoView({ block: 'nearest' });
            sheet.focus({ preventScroll: true });
        });
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        root.classList.remove('sm-open');
        root.setAttribute('aria-hidden', 'true');
        if (pushed) { pushed = false; try { history.back(); } catch (e) { /* ignore */ } }
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }

    // Alle [data-spillmeny] åpner arket – også de som legges til senere.
    document.addEventListener('click', (e) => {
        const t = e.target.closest && e.target.closest('[data-spillmeny]');
        if (!t) return;
        e.preventDefault();
        e.stopPropagation();
        open();
    }, true);

    // Ved tilbake fra bfcache: sørg for at arket er lukket.
    window.addEventListener('pageshow', (e) => { if (e.persisted && isOpen) { pushed = false; close(); } });

    window.SpillMeny = {
        open,
        close,
        register(h) { hooks = Object.assign({ busy: () => false, pause: () => {} }, h || {}); },
        get isOpen() { return isOpen; },
        SPILL,
    };
})();
