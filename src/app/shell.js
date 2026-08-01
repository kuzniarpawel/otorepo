// shell.js — powłoka aplikacji (Blok 1: fundament responsywny; Blok 3 dołoży nawigację).
//
// ZASADA NACZELNA: powłoka OTACZA #app i nigdy nie wchodzi do środka.
//   • tools/snapshot.mjs (domOracle) zrzuca WYŁĄCZNIE #app.innerHTML, więc rodzeństwo #app,
//     jego rodzice, jego WŁASNE atrybuty oraz cały CSS są poza zasięgiem złotego wzorca.
//     Dzięki temu cała powłoka powstaje bez rebaseline 91 przypiętych ekranów.
//   • Precedens w kodzie: #langbar był już „statyczną powłoką POZA #app".
//
// ZAKAZ ABSOLUTNY: żadna funkcja tego modułu nie wywołuje render().
//   render() ekranu manewru przechodzi przez setupGuideAnim, które zeruje licznik pozycji.
//   Przerysowanie w reakcji na zmianę szerokości okna kasowałoby trwające odliczanie —
//   dokładnie to, czego zabrania kryterium odbioru Bloku 1 („zmiana szerokości nie może
//   resetować przypadku, kroku ani timera"). Zamiast przerysowywać, dostrajamy to, co
//   naprawdę zależy od szerokości: wysokość kart odwracanych i bufor WebGL paneli 3D.
//
// Moduł jest LIŚCIEM: importuje tylko state.js i i18n.js — zero cyklu z render/actions.
// Zależności idące w drugą stronę (sizeFlip, resizeMounted3D) są WSTRZYKIWANE przez main.js.
import { state } from './state.js';
import { t } from '../i18n.js';
import { AREAS, barAreas, areaById } from './nav-model.js';

const $ = (sel) => (typeof document !== 'undefined' ? document.querySelector(sel) : null);

// Akcje aplikacji WSTRZYKIWANE z main.js (setMode, openHintsCustom, render, setLang…).
// Import actions.js wprost zrobiłby z powłoki węzeł w grafie renderowania; tak zostaje liściem.
let A = {};

/* ============ Montaż ============ */

// Uzupełnia dwujęzyczne napisy statycznego szkieletu z index.html.
// Markup powłoki jest w HTML (nie generujemy go z JS), żeby istniał już przy pierwszym malowaniu —
// ale teksty muszą przejść przez t(), bo inaczej zamroziłyby język na polskim.
export function mountShell() {
  try {
    const set = (sel, txt) => { const el = $(sel); if (el) el.textContent = txt; };
    const attr = (sel, name, val) => { const el = $(sel); if (el) el.setAttribute(name, val); };

    set('#skiplink', t('Przejdź do treści', 'Skip to content'));
    set('#brandSub', t('interaktywny atlas diagnostyki przedsionkowej',
                       'interactive atlas of vestibular diagnostics'));
    attr('#btnSettings', 'aria-label', t('Ustawienia', 'Settings'));
    attr('#btnSettings', 'title', t('Ustawienia', 'Settings'));
    attr('#mainscroll', 'aria-label', t('Treść aplikacji', 'Application content'));
  } catch { /* powłoka nie ma prawa wywalić aplikacji */ }
}

/* ============ Nawigacja (Blok 3) ============ */

// Mapowanie obszaru na REALNY stan aplikacji. Żaden obszar nie prowadzi donikąd: „Nauka" ma
// uczciwą, dwujęzyczną zaślepkę zamiast pustego ekranu udającego moduł, którego jeszcze nie ma.
function applyArea(id) {
  state.area = id;
  // WYJŚCIE Z EKRANU MANEWRU. Sama zmiana trybu nie wystarcza: state.screen zostawał na 'guide',
  // więc po zmianie obszaru (a nawet po potwierdzeniu „Przerwij i wyjdź") użytkownik nadal
  // patrzył na kartę manewru. Odtwarzamy kontrakt przycisku „Wróć": zatrzymaj odliczanie i
  // ZWOLNIJ BLOKADĘ EKRANU — inaczej ekran nie gaśnie po opuszczeniu repozycji.
  if (state.screen === 'guide') {
    state.running = false;
    A.releaseWake && A.releaseWake();
    state.screen = 'setup';
  }
  const stub = $('#stubview'), app = $('#app');
  const naNauke = id === 'learn';
  if (stub) stub.hidden = !naNauke;
  if (app) app.hidden = naNauke;
  if (naNauke) { A.render && A.render(); syncShell(); return; }
  if (id === 'start') A.setMode && A.setMode('treat');
  else if (id === 'diag') A.setMode && A.setMode('diag');
  else if (id === 'lab') { A.setMode && A.setMode('hints'); A.openHintsCustom && A.openHintsCustom(); }
  syncShell();
}

// Przejście do obszaru. STRAŻNIK: pojedyncze dotknięcie nawigacji NIE MOŻE przerwać trwającego
// manewru — repozycja jest procedurą wykonywaną na pacjencie, a nie widokiem, z którego się
// wychodzi bez konsekwencji. Sprawdzenie jest SYNCHRONICZNE, przed jakąkolwiek zmianą stanu.
export function goArea(id) {
  try {
    if (id === 'profile') { openSheet(); return; }
    if (state.screen === 'guide' && state.running) { askLeave(id); return; }
    applyArea(id);
  } catch { /* powłoka nie ma prawa wywalić aplikacji */ }
}

let _leaveTarget = null;
function askLeave(id) {
  _leaveTarget = id;
  const d = $('#leaveDlg');
  if (!d) { applyArea(id); return; }                      // brak dialogu → nie blokuj użytkownika
  // <dialog> bez showModal (starszy WebView) → atrybut open jako degradacja
  if (typeof d.showModal === 'function') { try { d.showModal(); } catch { d.setAttribute('open', ''); } }
  else d.setAttribute('open', '');
}
function closeLeave(potwierdzone) {
  const d = $('#leaveDlg');
  if (d) { if (typeof d.close === 'function') { try { d.close(); } catch { d.removeAttribute('open'); } } else d.removeAttribute('open'); }
  if (potwierdzone && _leaveTarget) { state.running = false; applyArea(_leaveTarget); }
  _leaveTarget = null;
}

/* ---- Arkusz ustawień (obszar „Profil") ---- */
function openSheet() { const s = $('#sheet'); if (s) { s.hidden = false; syncSheet(); const f = s.querySelector('button'); if (f) f.focus(); } }
function closeSheet() { const s = $('#sheet'); if (s) s.hidden = true; }
function syncSheet() {
  const s = $('#sheet'); if (!s) return;
  s.querySelectorAll('[data-lang-set]').forEach(b =>
    b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === state.lang)));
  const m = s.querySelector('[data-motion-toggle]');
  if (m) m.setAttribute('aria-checked', String(!!state.reducedMotion));
}

// Ograniczenie ruchu: własny przełącznik NIEZALEŻNY od ustawienia systemowego (klinicysta może
// chcieć zatrzymać ozdobniki na konkretnym urządzeniu, nie zmieniając preferencji całego systemu).
export function setReducedMotion(on) {
  state.reducedMotion = !!on;
  try { document.documentElement.setAttribute('data-motion', on ? 'reduce' : ''); } catch {}
  syncSheet();
}

/* ---- Budowa list nawigacji ---- */
function navItemHTML(a, wSzynie) {
  return `<li><button type="button" class="navitem" data-area="${a.id}" aria-current="false">
      <span class="navitem__icon">${a.ico}</span>
      <span class="navitem__label">${t(a.pl, a.en)}</span>
      ${wSzynie ? `<span class="navitem__desc">${t(a.plDesc, a.enDesc)}</span>` : ''}
    </button></li>`;
}

export function mountNav(deps = {}) {
  A = { ...A, ...deps };
  try {
    const rail = $('#railnav > ul'), bar = $('#bottomnav > ul');
    if (rail) { rail.innerHTML = AREAS.map(a => navItemHTML(a, true)).join(''); $('#railnav').hidden = false; }
    if (bar) { bar.innerHTML = barAreas().map(a => navItemHTML(a, false)).join(''); $('#bottomnav').hidden = false; }
    document.querySelectorAll('.navitem').forEach(b =>
      b.addEventListener('click', () => goArea(b.getAttribute('data-area'))));

    // Zaślepka „Nauka" — treść dwujęzyczna, bez udawania działającego modułu.
    const stub = $('#stubview');
    if (stub) stub.innerHTML = `<div class="card stub">
        <h2>${t('Nauka', 'Learn')}</h2>
        <p>${t('Moduł przypadków prowadzonych i quizów jest w przygotowaniu. Do tego czasu skorzystaj z Diagnostyki (testy pozycyjne, interpretacja oczopląsu) albo z Laboratorium (matematyczny pacjent).',
               'The guided-case and quiz module is in preparation. In the meantime use Diagnostics (positional tests, nystagmus interpretation) or the Laboratory (mathematical patient).')}</p>
      </div>`;

    // Dialog wyjścia z manewru
    const d = $('#leaveDlg');
    if (d) {
      d.innerHTML = `<form method="dialog" class="card">
          <h2>${t('Przerwać manewr?', 'Interrupt the maneuver?')}</h2>
          <p>${t('Odliczanie pozycji trwa. Wyjście przerwie bieżący etap repozycji.',
                 'The position timer is running. Leaving will interrupt the current repositioning stage.')}</p>
          <div class="dlgrow">
            <button type="button" data-leave="no" class="opt">${t('Zostań', 'Stay')}</button>
            <button type="button" data-leave="yes" class="opt">${t('Przerwij i wyjdź', 'Interrupt and leave')}</button>
          </div></form>`;
      d.querySelector('[data-leave="no"]').addEventListener('click', () => closeLeave(false));
      d.querySelector('[data-leave="yes"]').addEventListener('click', () => closeLeave(true));
      d.addEventListener('cancel', (e) => { e.preventDefault(); closeLeave(false); });
    }

    // Arkusz ustawień
    const s = $('#sheet');
    if (s) {
      s.innerHTML = `<div class="card sheet__panel" role="dialog" aria-modal="true" aria-label="${t('Ustawienia', 'Settings')}">
          <h2>${t('Profil i ustawienia', 'Profile and settings')}</h2>
          <div class="switchrow"><span>${t('Język', 'Language')}</span>
            <div class="pillseg"><button type="button" data-lang-set="pl" aria-pressed="false">PL</button><button type="button" data-lang-set="en" aria-pressed="false">EN</button></div></div>
          <div class="switchrow"><span>${t('Ogranicz animacje', 'Reduce motion')}</span>
            <button type="button" class="toggle" role="switch" data-motion-toggle aria-checked="false" aria-label="${t('Ogranicz animacje', 'Reduce motion')}"></button></div>
          <p class="note">${t('Narzędzie dydaktyczne dla personelu medycznego. Nie zastępuje badania ani decyzji klinicysty.',
                              'An educational tool for medical staff. It does not replace examination or clinician judgment.')}</p>
          <button type="button" class="cta" data-sheet-close>${t('Zamknij', 'Close')}</button>
        </div>`;
      s.querySelectorAll('[data-lang-set]').forEach(b =>
        b.addEventListener('click', () => { A.setLangUI && A.setLangUI(b.getAttribute('data-lang-set')); rebuildNavLabels(); syncSheet(); }));
      const mt = s.querySelector('[data-motion-toggle]');
      if (mt) mt.addEventListener('click', () => setReducedMotion(!state.reducedMotion));
      s.querySelector('[data-sheet-close]').addEventListener('click', closeSheet);
    }
  } catch { /* jw. */ }
}

// Po zmianie języka etykiety muszą się przebudować — inaczej nawigacja zostaje w starym języku.
function rebuildNavLabels() {
  try {
    document.querySelectorAll('.navitem').forEach(b => {
      const a = areaById(b.getAttribute('data-area'));
      const l = b.querySelector('.navitem__label'); if (l) l.textContent = t(a.pl, a.en);
      const d = b.querySelector('.navitem__desc'); if (d) d.textContent = t(a.plDesc, a.enDesc);
    });
  } catch {}
}

/* ============ Synchronizacja stanu → powłoka ============ */

// Odbija stan na atrybutach powłoki (CSS i późniejsza nawigacja czytają je selektorami).
// Null-safe i w try/catch — wzorzec jak syncLangBar w actions.js. NIE woła render().
// Obszar WYPROWADZANY ze stanu, nie trzymany niezależnie: użytkownik może przełączyć tryb
// zakładkami wewnątrz #app, a wtedy podświetlenie w nawigacji musi za tym nadążyć. Jedyny
// obszar, którego nie da się odczytać ze stanu, to „Nauka" (nie ma własnego trybu) — stąd
// jawne pierwszeństwo state.area, gdy zaślepka jest widoczna.
function areaZeStanu() {
  if (state.area === 'learn') return 'learn';
  if (state.mode === 'hints') return state.hintsCustom ? 'lab' : 'diag';
  if (state.mode === 'diag') return 'diag';
  return 'start';
}

export function syncShell() {
  try {
    const shell = $('#shell');
    if (!shell) return;
    const area = areaZeStanu();
    state.area = area;
    shell.setAttribute('data-area', area);
    shell.setAttribute('data-screen', state.screen || '');
    shell.setAttribute('data-mode', state.mode || '');
    // Ekran manewru = tryb skupienia: powłoka wycisza chrom, żeby przypadkowe dotknięcie
    // nie przerwało repozycji (właściwy strażnik siedzi w goArea).
    shell.toggleAttribute('data-focusmode', state.screen === 'guide');
    document.querySelectorAll('.navitem').forEach(b => {
      const akt = b.getAttribute('data-area') === area;
      b.setAttribute('aria-current', akt ? 'page' : 'false');
      b.classList.toggle('is-active', akt);
    });
  } catch { /* jw. */ }
}

/* ============ Obserwatory ============ */

let _observersOn = false;
let _lastInline = null;
let _rafPending = 0;

// Reakcja na zmianę SZEROKOŚCI treści. Deps wstrzykiwane, żeby moduł został liściem.
function handleInlineResize(deps) {
  const el = $('#mainscroll');
  if (!el) return;
  const w = el.clientWidth;
  // Bramka WYŁĄCZNIE na oś inline: wysokość zmienia się przy każdym przewinięciu, chowaniu paska
  // adresu i po każdym renderze — reagowanie na nią oznaczałoby ciągłe przeliczanie bez powodu.
  if (w === _lastInline) return;
  _lastInline = w;
  try {
    // Karty odwracane mają wysokość liczoną z JS (warstwy .face są absolutne) — bez tego
    // po zwężeniu okna zostaje pusta przestrzeń, a po poszerzeniu treść jest przycięta.
    if (typeof deps.sizeFlip === 'function') {
      for (const id of ['flip', 'phaseflip', 'mechflip']) deps.sizeFlip(id);
    }
    // Bufor WebGL jest zamrożony na szerokości z chwili montażu → po zmianie okna obraz rozmyty.
    if (typeof deps.resizeMounted3D === 'function') deps.resizeMounted3D();
  } catch { /* jw. */ }
}

// Podpina obserwatory. WOŁAĆ PO render() — przed pierwszym renderem nie ma czego mierzyć.
// Każde API przeglądarki za detekcją: jsdom (tools/snapshot.mjs) nie zna ResizeObserver,
// a niezłapany ReferenceError w ciele modułu = biały ekran (dlatego snapshot.mjs ma teraz
// twarde exit(1) na loadErrors — ta funkcja jest głównym kandydatem na taki błąd).
export function initShellObservers(deps = {}) {
  if (_observersOn) return;
  try {
    const main = $('#mainscroll');
    const app = $('#app');
    if (main && typeof ResizeObserver === 'function') {
      _lastInline = main.clientWidth;
      new ResizeObserver(() => {
        if (_rafPending) return;                       // zbij serię zdarzeń do jednej klatki
        _rafPending = requestAnimationFrame(() => { _rafPending = 0; handleInlineResize(deps); });
      }).observe(main);
      _observersOn = true;
    }
    // Powłoka musi nadążać za ekranem, ale aplikacja nie ma żadnego zdarzenia „przerysowano".
    // Zamiast dopisywać syncShell() do kilkunastu miejsc (goStep, setGuideSide, pickSize,
    // backToSetup…) i zapominać o kolejnych — obserwujemy podmianę treści #app.
    if (app && typeof MutationObserver === 'function') {
      let last = '';
      new MutationObserver(() => {
        const sig = `${state.screen}|${state.mode}|${state.step}|${state.side}|${state.area}`;
        if (sig === last) return;                      // ta sama sygnatura → nic do odbicia
        last = sig;
        syncShell();
      }).observe(app, { childList: true });
    }
  } catch { /* jw. — brak obserwatorów degraduje płynnie do zachowania sprzed Bloku 1 */ }
}
