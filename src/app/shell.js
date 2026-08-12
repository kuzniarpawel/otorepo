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
import {
  FLOW_STEPS, FLOW_STATUS, flowStep, flowStatuses, activeStepId, nextStepId,
  stepTarget, stepSummary, flowVisible, flowSignature,
} from './flow-model.js';
import { decyzjaAktualizacji, TEKSTY_AKTUALIZACJI, komunikatSieci } from './pwa-model.js';

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

/* DO KTÓREGO OBSZARU NALEŻY EKRAN. Ekrany spoza tej mapy należą do Diagnostyki (to jest też
   zachowanie `render()`, gdzie gałąź domyślna rysuje `renderDiag`).

   PO CO TA MAPA. Blok 3 miał tu jeden warunek — „każdy inny obszar MUSI opuścić EKRAN STARTOWY" —
   i wtedy to wystarczało, bo innych ekranów-obszarów nie było. Blok 13 dołożył ekrany Nauki,
   Blok 14 ekrany Laboratorium, i żaden nie rozszerzył warunku. Skutek ZMIERZONY: z biblioteki
   Nauki dotknięcie „Diagnostyka" ustawiało `area='diag'` i `mode='diag'`, ale `screen` zostawał
   na `naukaBib`, więc `render()` rysował dalej Naukę — przycisk wyglądał na zepsuty, choć stan
   się zmieniał. To samo z `labLista`.

   Mapa zamiast kolejnego `if`: dopisanie obszaru wymaga wpisu tutaj, a bramka K w pwa-dom.mjs
   sprawdza KAŻDY ekran z dyspozytora `render()`, więc przeoczenie jest widoczne od razu. */
export const OBSZAR_EKRANU = {
  start: 'start',
  naukaBib: 'learn', naukaLekcja: 'learn',
  labLista: 'lab', labEksp: 'lab',
};
export const obszarEkranu = (screen) => OBSZAR_EKRANU[screen] || 'diag';

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
  /* Blok 13: „Nauka" przestała być zaślepką. Zaślepka (`#stubview`) zostaje w powłoce jako
     bezpiecznik — pokazujemy ją tylko wtedy, gdy tryb nauki nie został podpięty (np. starszy
     bundel bez tej akcji). Wcześniej ten obszar CHOWAŁ `#app`, więc cały moduł nauki był
     niewidoczny dla złotego wzorca, który czyta wyłącznie `#app.innerHTML`. */
  const stub = $('#stubview'), app = $('#app');
  const naNauke = id === 'learn';
  const braknauki = naNauke && !A.goNauka;
  if (stub) stub.hidden = !braknauki;
  if (app) app.hidden = braknauki;
  if (braknauki) { A.render && A.render(); syncShell(); return; }
  if (naNauke) { A.goNauka(); syncShell(); return; }
  // „Start" to ekran oparty na CELU (Blok 4), nie skrót do modułu repozycji.
  if (id === 'start') { state.screen = 'start'; A.render && A.render(); }
  else {
    /* Każdy obszar MUSI opuścić ekran NALEŻĄCY DO INNEGO OBSZARU. `setMode` zmienia wyłącznie
       tryb, a `render()` dyspozytuje po `state.screen` — więc bez tego dotknięcie wygląda na
       nieskuteczne, choć stan się zmienia. Warunek celowo NIE rusza ekranów tego samego obszaru:
       ponowne dotknięcie „Diagnostyka" w trakcie badania nie ma prawa cofnąć użytkownika
       z „Kontroli" czy „Oczopląsu" na początek. */
    if (obszarEkranu(state.screen) !== id) state.screen = 'setup';
    if (id === 'diag') A.setMode && A.setMode('diag');
    /* Blok 12 (kryterium odbioru nr 1): „Laboratorium" też nie wchodzi wprost do matematycznego
       pacjenta. Klik w nazwę obszaru jest aktem świadomym, ale NIE jest świadomym pominięciem
       kwalifikacji — użytkownik nie dowiedziałby się, że jakaś istnieje. Prowadzimy więc na ekran
       kwalifikacji, gdzie „nie badam pacjenta, chcę zobaczyć wzorce na modelu" to jedno dotknięcie
       i zostaje zapisane w wyniku. Drzwi do modułu są JEDNE. */
    /* Blok 14: obszar „Laboratorium" przestal byc skrotem do matematycznego pacjenta i stal sie
       STANOWISKIEM FIZJOLOGICZNYM. Gwarancja Bloku 12 nie oslabla, tylko sie wzmocnila: z tego
       obszaru nie da sie juz wejsc do modulu HINTS W OGOLE, a nie tylko „nie da sie bez
       kwalifikacji". Matematyczny pacjent zostal tam, gdzie byl — za kwalifikacja. */
    else if (id === 'lab') { A.goLab ? A.goLab() : (A.goHintsKwal && A.goHintsKwal()); }
  }
  syncShell();
}

// Przejście do obszaru. STRAŻNIK: pojedyncze dotknięcie nawigacji NIE MOŻE przerwać trwającego
// manewru — repozycja jest procedurą wykonywaną na pacjencie, a nie widokiem, z którego się
// wychodzi bez konsekwencji. Sprawdzenie jest SYNCHRONICZNE, przed jakąkolwiek zmianą stanu.
export function goArea(id) {
  try {
    if (id === 'profile') { openSheet(); return; }
    if (state.screen === 'guide' && state.running) { askLeave(() => applyArea(id)); return; }
    applyArea(id);
  } catch { /* powłoka nie ma prawa wywalić aplikacji */ }
}

/* Cel strażnika jest FUNKCJĄ, nie napisem. Wcześniej `_leaveTarget` był nietypowanym stringiem
   konsumowanym wyłącznie przez applyArea — po dołożeniu kroków przebiegu (Blok 5) wpadłoby tam
   `applyArea('nystagmus')`, które nie trafia w żaden warunek: ustawia state.area na nieistniejący
   obszar, zatrzymuje licznik, zwalnia blokadę ekranu, przestawia screen z 'guide' na 'setup'
   i NIE woła render() — w DOM zostaje karta manewru z zatrzymanym licznikiem, a cel przejścia
   ginie. Zbiory identyfikatorów obszarów i kroków są rozłączne, więc rozpoznanie „po nazwie"
   nie było możliwe. */
let _leaveAkcja = null;
function askLeave(akcja) {
  _leaveAkcja = akcja;
  const d = $('#leaveDlg');
  if (!d) { akcja(); _leaveAkcja = null; return; }         // brak dialogu → nie blokuj użytkownika
  // <dialog> bez showModal (starszy WebView) → atrybut open jako degradacja
  if (typeof d.showModal === 'function') { try { d.showModal(); } catch { d.setAttribute('open', ''); } }
  else d.setAttribute('open', '');
}
function closeLeave(potwierdzone) {
  const d = $('#leaveDlg');
  if (d) { if (typeof d.close === 'function') { try { d.close(); } catch { d.removeAttribute('open'); } } else d.removeAttribute('open'); }
  const akcja = _leaveAkcja;
  _leaveAkcja = null;
  if (potwierdzone && akcja) { state.running = false; akcja(); }
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
  // Liczba zapisow i etykieta kasowania odbijaja STAN, a nie chwile zbudowania arkusza.
  const ile = s.querySelector('[data-sesje-ile]');
  if (ile) ile.textContent = String((state.opisSesje || []).length);
  const del = s.querySelector('[data-sesje-usun]');
  /* „Usuń" przez ń — literal bez ogonka wjezdzal tu po KAZDYM przerysowaniu arkusza (syncSheet),
     wiec poprawny napis z linii 226 zyl tylko do pierwszego odswiezenia. */
  if (del) { del.removeAttribute('data-potwierdz'); del.textContent = t('Usuń wszystkie', 'Delete all'); }
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

    buildSheet();
  } catch { /* jw. */ }
}

/* Arkusz ustawień POWSTAJE OD NOWA przy zmianie języka, a nie tylko na boocie. Wcześniej cały
   panel (nagłówki, przełączniki, noty) był składany raz, w mountNav, więc po przełączeniu języka
   ustawienia zostawały w starym — i to przy komplecie zielonych wyroczni, bo arkusz leży poza
   #app. Ten sam błąd, który onLangChange naprawił kiedyś dla nawigacji i paska przebiegu; Blok 16
   dokłada tu dwa zdania (o offline i o skrótach), więc zamrożony język przestał być drobiazgiem. */
function buildSheet() {
  try {
    const s = $('#sheet');
    if (!s) return;
    {
      s.innerHTML = `<div class="card sheet__panel" role="dialog" aria-modal="true" aria-label="${t('Ustawienia', 'Settings')}">
          <h2>${t('Profil i ustawienia', 'Profile and settings')}</h2>
          <div class="switchrow"><span>${t('Język', 'Language')}</span>
            <div class="pillseg"><button type="button" data-lang-set="pl" aria-pressed="false">PL</button><button type="button" data-lang-set="en" aria-pressed="false">EN</button></div></div>
          <div class="switchrow"><span>${t('Ogranicz animacje', 'Reduce motion')}</span>
            <button type="button" class="toggle" role="switch" data-motion-toggle aria-checked="false" aria-label="${t('Ogranicz animacje', 'Reduce motion')}"></button></div>
          ${/* BLOK 15, KRYTERIUM ODBIORU NR 3: „użytkownik może usunąć wszystkie zapisane sesje
                z ustawień". Miejsce nie jest kosmetyką — kasowanie danych ma być tam, gdzie się go
                szuka, a nie na ekranie, do którego trzeba wejść przez zakończoną sesję. Liczba
                zapisów stoi przy przycisku, bo „usuń wszystko" bez powiedzenia ILE jest gestem
                w ciemno. */''}
          <div class="switchrow"><span>${t('Zapisane sesje', 'Saved sessions')} <b data-sesje-ile>${(state.opisSesje || []).length}</b></span>
            <button type="button" class="sesjeusun" data-sesje-usun>${t('Usuń wszystkie', 'Delete all')}</button></div>
          <p class="note" data-sesje-nota>${t('Zapisy leżą wyłącznie w pamięci tej przeglądarki i niosą same identyfikatory ze słowników aplikacji. Usunięcie jest nieodwracalne.',
                                              'The records live only in this browser and carry nothing but identifiers from the app dictionaries. Deletion cannot be undone.')}</p>
          ${/* BLOK 16: „aplikacja informuje, które treści wymagają połączenia". Zdanie jest
                FUNKCJĄ listy funkcji sieciowych z pwa-model.js, a nie obietnicą przepisaną
                z dokumentu — gdy ktoś doda pierwsze wywołanie sieci, zmieni się samo (a bramka
                w wyroczni pilnuje, żeby lista nie kłamała). */''}
          <p class="note" data-siec>${t(komunikatSieci().pl, komunikatSieci().en)}</p>
          <p class="note" data-skroty>${t('Klawiatura na ekranie manewru: spacja — pauza i wznowienie licznika, strzałki ← → — poprzedni i następny etap. Skrót nie działa, gdy kursor stoi w polu tekstowym albo fokus jest na przycisku.',
                                          'Keyboard on the maneuver screen: space — pause and resume the timer, arrows ← → — previous and next step. The shortcut stands down when the caret is in a text field or a control has focus.')}</p>
          <p class="note">${t('Narzędzie dydaktyczne dla personelu medycznego. Nie zastępuje badania ani decyzji klinicysty.',
                              'An educational tool for medical staff. It does not replace examination or clinician judgment.')}</p>
          <button type="button" class="cta" data-sheet-close>${t('Zamknij', 'Close')}</button>
        </div>`;
      s.querySelectorAll('[data-lang-set]').forEach(b =>
        b.addEventListener('click', () => { A.setLangUI && A.setLangUI(b.getAttribute('data-lang-set')); }));
      const mt = s.querySelector('[data-motion-toggle]');
      if (mt) mt.addEventListener('click', () => setReducedMotion(!state.reducedMotion));
      const del = s.querySelector('[data-sesje-usun]');
      if (del) del.addEventListener('click', () => {
        /* Kasowanie jest NIEODWRACALNE, wiec idzie przez potwierdzenie w dwoch krokach — ten sam
           gest, co przy zakonczeniu sesji. Bez tego jedno dotkniecie sasiadujace z przelacznikiem
           jezyka kasuje caly dorobek. */
        if (del.getAttribute('data-potwierdz') !== '1') {
          del.setAttribute('data-potwierdz', '1');
          del.textContent = t('Na pewno usunąć?', 'Really delete?');
          return;
        }
        if (A.usunWszystkieSesjeOpisu) A.usunWszystkieSesjeOpisu();
        del.removeAttribute('data-potwierdz');
        syncSheet();
      });
      s.querySelector('[data-sheet-close]').addEventListener('click', closeSheet);
    }
  } catch { /* jw. */ }
}

/* ============ Pasek nowej wersji (Blok 16) ============
   Komunikat o aktualizacji jest CHROMEM i leży POZA #shell — dokładnie jak #sheet i #flowmap.
   Powód jest mierzalny: warstwa `shell` złotego wzorca zrzuca #shell.outerHTML, więc element
   wstawiony do środka zmieniłby WSZYSTKIE 20 przypiętych stanów powłoki, choć nic w nich nie
   zaszło. Tutaj warstwa dopisuje go tylko wtedy, gdy jest widoczny (jak mapę kroków).

   Pasek nie jest oknem modalnym i nigdy nim nie będzie: aktualizacja aplikacji nie ma prawa
   zabrać ekranu klinicyście, który trzyma pacjenta w pozycji. Cała decyzja — czy pokazać, czy
   wolno wdrożyć, co napisać — pochodzi z czystego pwa-model.js. */
export function mountAktualizacja(deps = {}) {
  A = { ...A, ...deps };
  try {
    const u = $('#updbar');
    if (!u) return;
    u.innerHTML = `<div class="updbar__box">
        <p class="updbar__t" data-upd-tytul></p>
        <p class="updbar__c" data-upd-tresc></p>
        <div class="updbar__row">
          <button type="button" class="opt updbar__ok" data-upd-teraz hidden></button>
          <button type="button" class="opt updbar__nie" data-upd-pozniej hidden></button>
        </div>
      </div>`;
    const teraz = u.querySelector('[data-upd-teraz]');
    if (teraz) teraz.addEventListener('click', () => { A.wdrozAktualizacjeTeraz && A.wdrozAktualizacjeTeraz(); });
    const pozniej = u.querySelector('[data-upd-pozniej]');
    if (pozniej) pozniej.addEventListener('click', () => { A.schowajAktualizacje && A.schowajAktualizacje(); });
    syncAktualizacja();
  } catch { /* powłoka nie ma prawa wywalić aplikacji */ }
}

export function syncAktualizacja() {
  try {
    const u = $('#updbar');
    if (!u) return;
    const d = decyzjaAktualizacji(state);
    u.hidden = !d.pokaz;
    // Atrybuty niosą POWÓD, a nie wygląd: dzięki nim wyrocznia widzi, że pasek wie o blokadzie,
    // nawet gdy tekst brzmi łagodnie.
    u.setAttribute('data-blokada', d.blokada || '');
    u.setAttribute('data-ostrzezenie', d.ostrzezenie || '');
    if (!d.pokaz) return;
    const set = (sel, txt) => { const el = u.querySelector(sel); if (el) el.textContent = txt; };
    set('[data-upd-tytul]', d.tytul ? t(d.tytul.pl, d.tytul.en) : '');
    set('[data-upd-tresc]', d.tresc ? t(d.tresc.pl, d.tresc.en) : '');
    const teraz = u.querySelector('[data-upd-teraz]');
    if (teraz) { teraz.hidden = !d.przycisk; if (d.przycisk) teraz.textContent = t(d.przycisk.pl, d.przycisk.en); }
    const pozniej = u.querySelector('[data-upd-pozniej]');
    if (pozniej) { pozniej.hidden = !d.schowaj; pozniej.textContent = t(TEKSTY_AKTUALIZACJI.schowaj.pl, TEKSTY_AKTUALIZACJI.schowaj.en); }
  } catch { /* jw. */ }
}

// Powierzchnia globalna dla handlerów inline (onclick="goArea('diag')") — ten sam wzorzec, co
// w actions.js i maneuvers.js. Bez tego karty trybu na ekranie startowym rzucały ReferenceError
// i klikanie ich nie robiło NIC (klik nie zgłasza błędu widocznego dla użytkownika).
if (typeof window !== 'undefined') Object.assign(window, { goArea, setReducedMotion, goFlowStep });
// Ta sama zasada, co przy __otoLangChange: actions.js NIE importuje powłoki (ma zostać liściem),
// więc odświeżenie paska idzie przez guardowany uchwyt globalny.
if (typeof window !== 'undefined') window.__otoAktualizacja = syncAktualizacja;

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

/* ============ Pasek przebiegu klinicznego (Blok 5) ============
   Dokument: „Pełny sześciostopniowy stepper stale widoczny u góry" (komputer) / „Stepper skrócony
   do «Krok 2 z 6 — Próba» z możliwością rozwinięcia pełnej mapy" (telefon). To CHROM, więc leży
   poza #app i nie rusza złotego wzorca.

   Wiedza kliniczna (recommend/CANAL_OF/DIAG) jest WSTRZYKIWANA z main.js: flow-model.js jest
   celowo bezimportowy, a powłoka ma zostać liściem grafu renderowania. */
let FD = {};

// Przewijanie do kotwicy WEWNĄTRZ #app. Świadomie bez scrollIntoView i bez window.scrollTo:
// w jsdom (tools/snapshot.mjs) scrollIntoView nie istnieje (TypeError), a window.scrollTo NIE
// rzuca — emituje jsdomError, którego try/catch nie rozbraja, a snapshot.mjs kończy wtedy
// exit(1). Przypisanie scrollTop jsdom przyjmuje bez błędu.
// Kompensacja przyklejonego nagłówka jest MIERZONA: .ghead ma ~92 px i po zwykłym przewinięciu
// zasłaniałby prawie całą kotwicę (zmierzone: 92,5 ze 128,75 px karty obserwacji).
function scrollToAnchor(sel) {
  if (!sel || typeof document === 'undefined') return;
  const sc = $('#mainscroll');
  const el = document.querySelector(`#app ${sel}`);
  if (!sc || !el || typeof el.getBoundingClientRect !== 'function') return;
  try {
    const gh = document.querySelector('#app .ghead');
    const off = gh ? gh.getBoundingClientRect().height : 0;
    sc.scrollTop = sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top - off - 12;
  } catch { }
  // Fokus przenosimy ZAWSZE: bez tego czytnik ekranu zostaje tam, gdzie był, i użytkownik
  // niewidomy nie dowie się, że w ogóle coś się stało. preventScroll, bo pozycję już ustawiliśmy.
  try { if (typeof el.focus === 'function') el.focus({ preventScroll: true }); } catch { }
}

const wPozniej = (fn) => { try { if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fn); else fn(); } catch { } };

/* Przejście do kroku przebiegu. Trzy rzeczy, których nie wolno pominąć:
   1) ten sam strażnik trwającego manewru, co w goArea (repozycja to procedura na pacjencie);
   2) BRAMKA DANYCH — stepTarget nigdy nie zwraca ekranu, którego stan nie udźwignie. renderDiag
      czyta DIAG[state.testKey].canal, renderGuide czyta plan.steps[step]; przy pustym stanie
      leci TypeError PRZED przypisaniem innerHTML, więc ekran nie drgnie, a każdy kolejny render()
      rzuca to samo — aplikacja zablokowana do przeładowania, i to bez śladu w konsoli, bo powłoka
      ma puste catch;
   3) wyjście z zaślepki „Nauka" — tam #app jest fizycznie hidden, więc samo ustawienie screen
      nic by nie dało. */
export function goFlowStep(id) {
  try {
    const cel = stepTarget(state, id);
    if (!cel) return;                                     // krok w przygotowaniu — nie udajemy nawigacji
    const idz = () => {
      if (state.area !== 'diag') applyArea('diag');
      if (state.screen === 'guide') { state.running = false; A.releaseWake && A.releaseWake(); }
      state.mode = cel.mode;
      state.screen = cel.screen;
      state.stepMapOpen = false;
      closeFlowMap();
      A.render && A.render();
      syncShell();
      if (cel.anchor) wPozniej(() => scrollToAnchor(cel.anchor));
    };
    if (state.screen === 'guide' && state.running) { askLeave(idz); return; }
    idz();
  } catch { /* powłoka nie ma prawa wywalić aplikacji */ }
}

function statusLabel(k) { const d = FLOW_STATUS[k] || {}; return t(d.pl || '', d.en || ''); }

// Jeden krok. Status niesiony GLIFEM i słowem w dostępnej nazwie, nie samym kolorem — ta sama
// zasada, co w a11y.css („STAN NIGDY SAMYM KOLOREM"). aria-disabled, NIGDY disabled: krok
// niedostępny ma zostać fokusowalny, żeby dało się przeczytać powód.
function flowStepHTML(st, sr, i) {
  const def = flowStep(st.id) || {};
  const nazwa = t(def.pl, def.en);
  const nieklikalny = !st.osiagalny;
  const glif = (FLOW_STATUS[st.status] || {}).glif || '';
  return `<li class="flowstep flowstep--${st.status}">
      <button type="button" class="flowstep__btn" data-flow-step="${st.id}"
              ${st.active ? 'aria-current="step"' : ''} ${nieklikalny ? 'aria-disabled="true"' : ''}
              title="${st.powodPl || st.powodEn ? t(st.powodPl, st.powodEn) : nazwa}">
        <span class="flowstep__n" aria-hidden="true">${glif || (i + 1)}</span>
        <span class="flowstep__txt">
          <b class="flowstep__name">${nazwa}</b>
          <span class="flowstep__st">${statusLabel(st.status)}</span>
        </span>
      </button></li>`;
}

// Pełna mapa (nakładka na telefonie): to samo źródło statusów + uzasadnienia, których na pasku
// nie ma gdzie pokazać.
function flowMapHTML(lista) {
  const nast = nextStepId(state, FD);
  return `<div class="card sheet__panel" role="dialog" aria-modal="true" aria-label="${t('Przebieg badania', 'Examination flow')}">
      <h2>${t('Przebieg badania', 'Examination flow')}</h2>
      <ol class="flowmap__list">${lista.map((st, i) => {
        const def = flowStep(st.id) || {};
        const powod = st.powodPl || st.powodEn ? `<span class="flowmap__why">${t(st.powodPl, st.powodEn)}</span>` : '';
        const glif = (FLOW_STATUS[st.status] || {}).glif || '';
        return `<li class="flowmap__row flowstep--${st.status}">
          <button type="button" class="flowmap__btn" data-flow-step="${st.id}"
                  ${st.active ? 'aria-current="step"' : ''} ${st.osiagalny ? '' : 'aria-disabled="true"'}>
            <span class="flowstep__n" aria-hidden="true">${glif || (i + 1)}</span>
            <span class="flowmap__txt">
              <b>${t(def.pl, def.en)}</b>
              <span class="flowmap__st">${statusLabel(st.status)}${st.id === nast ? ` · ${t('następny krok', 'next step')}` : ''}</span>
              <span class="flowmap__desc">${t(def.plDesc, def.enDesc)}</span>
              ${powod}
            </span></button></li>`;
      }).join('')}</ol>
      <button type="button" class="cta" data-flowmap-close>${t('Zamknij', 'Close')}</button>
    </div>`;
}

function openFlowMap() {
  const m = $('#flowmap'); if (!m) return;
  state.stepMapOpen = true;
  m.hidden = false;
  const f = m.querySelector('button'); if (f) { try { f.focus(); } catch { } }
}
function closeFlowMap() {
  const m = $('#flowmap'); if (m) m.hidden = true;
  state.stepMapOpen = false;
  const s = $('#flowsum'); if (s) s.setAttribute('aria-expanded', 'false');
}

export function mountFlow(deps = {}) {
  FD = { ...FD, ...deps };
  try {
    const nav = $('#flownav');
    if (nav) nav.setAttribute('aria-label', t('Przebieg badania', 'Examination flow'));
    // Delegacja zdarzeń: lista jest przebudowywana przy każdej zmianie stanu, więc podpinanie
    // handlerów do pojedynczych przycisków wymagałoby powtarzania tego po każdym renderze.
    const klik = (e) => {
      const b = e.target && e.target.closest ? e.target.closest('[data-flow-step]') : null;
      if (b) {
        if (b.getAttribute('aria-disabled') === 'true') { openFlowMap(); return; }   // pokaż POWÓD zamiast milczeć
        goFlowStep(b.getAttribute('data-flow-step')); return;
      }
      if (e.target && e.target.closest && e.target.closest('[data-flowmap-close]')) closeFlowMap();
    };
    const bar = $('#flowbar'), map = $('#flowmap');
    if (bar) bar.addEventListener('click', klik);
    if (map) {
      map.addEventListener('click', (e) => { if (e.target === map) { closeFlowMap(); return; } klik(e); });
    }
    syncFlow();
  } catch { /* jw. */ }
}

/* Przebudowa paska. Wołana z syncShell, czyli po każdej zmianie podpisu stanu. */
export function syncFlow() {
  try {
    const bar = $('#flowbar'); if (!bar) return;
    const widoczny = flowVisible(state);
    bar.hidden = !widoczny;
    if (!widoczny) {
      closeFlowMap();
      // Czyścimy treść, a nie tylko chowamy. Pasek ukryty z zawartością poprzedniego badania
      // trzyma w DOM cudzy przebieg („Manewr: Semont — zakończony") razem z ostrzeżeniem, które
      // odżyje w chwili powrotu do ścieżki klinicznej, zanim cokolwiek je przeliczy.
      const ol0 = $('#flowsteps'); if (ol0) ol0.innerHTML = '';
      const s0 = $('#flowsum'); if (s0) s0.remove();
      const a0 = $('#flowalert'); if (a0) { a0.hidden = true; a0.innerHTML = ''; }
      const f0 = $('#flowflag'); if (f0) f0.remove();
      return;
    }

    const lista = flowStatuses(state, FD);
    const ol = $('#flowsteps');
    if (ol) {
      // Zapamiętanie fokusu: lista jest przebudowywana w całości, a bez tego dotknięcie kroku
      // klawiaturą gubiłoby fokus na <body> i nawigacja Tab zaczynałaby od początku strony.
      const akt = document.activeElement;
      const fokusKrok = akt && akt.getAttribute ? akt.getAttribute('data-flow-step') : null;
      const sum = stepSummary(state, state.lang);
      ol.innerHTML = lista.map((st, i) => flowStepHTML(st, sum, i)).join('');
      // Skrót na telefon — ten sam DOM, o widoczności decyduje CSS (jedno źródło statusów).
      const podpis = sum
        ? `${t('Krok', 'Step')} ${sum.nr} ${t('z', 'of')} ${sum.total} — ${sum.label}`
        : t('Przebieg badania', 'Examination flow');
      let s = $('#flowsum');
      if (!s) {
        s = document.createElement('button');
        s.type = 'button'; s.className = 'flowsum'; s.id = 'flowsum';
        s.setAttribute('aria-controls', 'flowmap');
        s.addEventListener('click', () => { if (state.stepMapOpen) closeFlowMap(); else { openFlowMap(); s.setAttribute('aria-expanded', 'true'); } });
        const nav = $('#flownav'); if (nav) nav.insertBefore(s, nav.firstChild);
      }
      s.setAttribute('aria-expanded', String(!!state.stepMapOpen));
      s.innerHTML = `<span class="flowsum__txt">${podpis}</span><span class="flowsum__more" aria-hidden="true">▾</span>`;
      s.setAttribute('aria-label', `${podpis} — ${t('pokaż pełną mapę kroków', 'show the full step map')}`);
      if (fokusKrok) { const znowu = ol.querySelector(`[data-flow-step="${fokusKrok}"]`); if (znowu) { try { znowu.focus(); } catch { } } }
    }

    // Pasek ostrzeżenia. To jedyne miejsce, w którym kryterium odbioru nr 2 dociera do ekranu.
    const man = lista.find(x => x.id === 'maneuver');
    const al = $('#flowalert');
    if (al) {
      const powody = man && man.status === 'stale'
        ? (man.drift.length ? man.drift.map(d => t(d.pl, d.en)) : [t(man.powodPl, man.powodEn)])
        : [];
      if (powody.length) {
        const m = state.flow && state.flow.maneuver;
        al.hidden = false;
        al.className = 'flowalert';
        al.innerHTML = `<b class="flowalert__ttl">⟳ ${t('Wniosek wymaga ponownego przeliczenia', 'The conclusion needs recalculation')}</b>
          <span class="flowalert__txt">${t('Wybrany manewr', 'The chosen maneuver')}${m ? ` (${m.key})` : ''}: ${powody.join('; ')}.</span>
          <button type="button" class="flowalert__go" data-flow-step="interpret">${t('Wróć do interpretacji', 'Back to interpretation')}</button>`;
      } else {
        /* SYGNAŁ KONWERSJI KANAŁOWEJ (Blok 10). `consumed` słusznie gasi zdanie „wniosek jest
           nieaktualny" — manewr się wydarzył i przeszłości nie unieważnia nic. Ale połykał też
           DRUGIE zdanie: „bieżące wejścia wskazują INNY KANAŁ niż wykonany manewr". To jest
           podręcznikowa konwersja PC→HC po Epleyu, czyli wskazanie do NOWEGO manewru, a nie zarzut
           wobec starego. Krok „Kontrola" jest w przygotowaniu (Blok 11), więc dziś nie ma innego
           miejsca, które by to zauważyło. Ton jest INFORMACYJNY, nie alarmowy — stąd osobna klasa.
           Liczy to man-model.sygnalKonwersji, WSTRZYKNIĘTY (powłoka zostaje liściem grafu). */
        const kon = typeof FD.konwersja === 'function' ? FD.konwersja(state) : null;
        if (kon) {
          al.hidden = false;
          al.className = 'flowalert flowalert--info';
          al.innerHTML = `<b class="flowalert__ttl">↻ ${t('Konwersja kanałowa?', 'Canal conversion?')}</b>
            <span class="flowalert__txt">${t(kon.pl, kon.en)}</span>`;
        } else { al.hidden = true; al.className = 'flowalert'; al.innerHTML = ''; }
      }
    }

    /* Czerwona flaga z kwalifikacji wstępnej JEDZIE Z UŻYTKOWNIKIEM przez cały przebieg.
       Dokument (Blok 6): „Czerwone flagi są widoczne PRZED przejściem do manewru lub HINTS".
       Karta wyniku zostaje na ekranie Wywiadu, więc gdyby sygnał kończył się razem z nią,
       kryterium byłoby spełnione tylko dopóki użytkownik nie kliknie dalej — czyli dokładnie
       do momentu, w którym zaczyna mieć znaczenie. */
    const tr = state.flow && state.flow.triage;
    let fl = $('#flowflag');
    if (tr && tr.complete && tr.czerwona) {
      if (!fl) {
        fl = document.createElement('div');
        fl.id = 'flowflag'; fl.className = 'flowflag'; fl.setAttribute('role', 'status');
        bar.appendChild(fl);
      }
      fl.innerHTML = `<b>⚠ ${t('Czerwona flaga', 'Red flag')}</b><span>${t(
        'Kwalifikacja wstępna wykazała objaw wymagający pilnej oceny. Nie wykonuj repozycji przed jej przeprowadzeniem.',
        'The initial triage found a feature requiring urgent evaluation. Do not perform repositioning before it is done.')}</span>`;
    } else if (fl) fl.remove();
    // Mapa przebudowuje się tylko wtedy, gdy jest otwarta — inaczej niepotrzebnie pracujemy.
    const map = $('#flowmap');
    if (map && !map.hidden) map.innerHTML = flowMapHTML(lista);
  } catch { /* jw. */ }
}

// Po zmianie języka etykiety kroków muszą się przebudować — patrz rebuildNavLabels.
export function rebuildFlowLabels() { syncFlow(); }

/* ============ Synchronizacja stanu → powłoka ============ */

// Odbija stan na atrybutach powłoki (CSS i późniejsza nawigacja czytają je selektorami).
// Null-safe i w try/catch — wzorzec jak syncLangBar w actions.js. NIE woła render().
// Obszar WYPROWADZANY ze stanu, nie trzymany niezależnie: użytkownik może przełączyć tryb
// zakładkami wewnątrz #app, a wtedy podświetlenie w nawigacji musi za tym nadążyć. Jedyny
// obszar, którego nie da się odczytać ze stanu, to „Nauka" (nie ma własnego trybu) — stąd
// jawne pierwszeństwo state.area, gdy zaślepka jest widoczna.
function areaZeStanu() {
  if (state.area === 'learn') return 'learn';
  if (state.screen === 'start') return 'start';
  /* Blok 12: wejście z „Laboratorium" ląduje teraz na ekranie kwalifikacji, na którym matematycznego
     pacjenta jeszcze NIE MA — bez tej linii dotknięcie „Laboratorium" podświetlałoby „Diagnostykę",
     czyli nawigacja mówiłaby, że użytkownik jest gdzie indziej, niż go właśnie posłała. */
  /* Blok 14: Laboratorium ma WŁASNY tryb. Bez tej linii `syncShell` (który PRZEPISUJE `state.area`
     wynikiem tej funkcji) sprowadzał obszar do „Diagnostyki" natychmiast po wejściu — zmierzone:
     `goLab()` ustawiał area='lab', a `goArea('lab')` kończył z area='diag'. Nawigacja mówiłaby, że
     użytkownik jest w module klinicznym, stojąc na stanowisku fizjologicznym. */
  if (state.mode === 'lab') return 'lab';
  if (state.mode === 'hints' && state.area === 'lab') return 'lab';
  if (state.mode === 'hints') return state.hintsCustom ? 'lab' : 'diag';
  // Repozycja (tryb treat) NIE jest osobnym obszarem: dokument umieszcza manewry wewnątrz
  // ścieżki klinicznej („Diagnostyka — BPPV krok po kroku … i czerwone flagi"). Podświetlanie
  // przy niej „Start" sugerowałoby, że użytkownik jest na ekranie startowym, a nie w module.
  return 'diag';
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
    syncFlow();                         // pasek przebiegu odbija ten sam stan (Blok 5)
    syncAktualizacja();                 // Blok 16: treść paska nowej wersji zależy od EKRANU
  } catch { /* jw. */ }
}

// Jedno wejście dla zmiany języka. Były DWIE ścieżki i tylko jedna odświeżała powłokę: arkusz
// Profilu wołał rebuildNavLabels ręcznie, a górny pasek #langbar (onclick="setLangUI(...)"
// w index.html) nie wołał nic — po przełączeniu na EN podtytuł marki, „Przejdź do treści",
// etykiety nawigacji i cały pasek przebiegu zostawały po polsku. mountShell wypełnia napisy
// przez t() tylko RAZ, na boocie, więc musi zostać wywołane ponownie.
export function onLangChange() {
  try { mountShell(); rebuildNavLabels(); rebuildFlowLabels(); buildSheet(); syncAktualizacja(); } catch { /* jw. */ }
}
// Wystawione globalnie, a nie importowane przez actions.js: powłoka ma zostać LIŚCIEM grafu.
// actions.js woła to przez window.__otoLangChange (guard w środku), więc w gołym Node nic się
// nie dzieje i tools/bridge-check.mjs dalej importuje actions.js bez powłoki.
if (typeof window !== 'undefined') window.__otoLangChange = onLangChange;

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
    // BRAMKA MUSI OBEJMOWAĆ WSZYSTKO, CO POWŁOKA POKAZUJE. Poprzednia wersja porównywała
    // `screen|mode|step|side|area` — czyli ani jednego pola, na którym stoi wykrywanie
    // nieaktualnych wniosków (testKey, variant, dixObs, diagCentral, decisionSeq, flow.*).
    // Skutek byłby taki, że klinicysta przełącza na „Ośrodkowy — CPN", #app się przerysowuje,
    // a pasek przebiegu nie drga: kryterium odbioru Bloku 5 nigdy nie docierałoby do ekranu.
    // Podpis liczy teraz CZYSTA funkcja flowSignature, pilnowana przez tools/flow-check.mjs
    // (każde pole musi go zmieniać — dowiedzione failing-first).
    if (app && typeof MutationObserver === 'function') {
      let last = '';
      new MutationObserver(() => {
        const sig = flowSignature(state);
        if (sig === last) return;                      // ta sama sygnatura → nic do odbicia
        last = sig;
        syncShell();
      }).observe(app, { childList: true });
    }
  } catch { /* jw. — brak obserwatorów degraduje płynnie do zachowania sprzed Bloku 1 */ }
}
