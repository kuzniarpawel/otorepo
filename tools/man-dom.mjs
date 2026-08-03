/* OTOREPO — wyrocznia EKRANU I AKCJI MANEWRU (Blok 10). jsdom, realny graf modułów.
 *
 * ═══ DLACZEGO OSOBNO OD man:check ═══
 * `man:check` bada CZYSTY model w gołym Node. Ale defekty, które ten blok naprawia, NIE SĄ
 * defektami modelu — wszystkie zmierzono na realnym grafie akcji: `pickCanal` wybierał manewr za
 * użytkownika, `setGuideSide` podmieniał manewr, przycisk strony bywał martwy, a jedno dotknięcie
 * ostatniego etapu wyciszało alarmy do końca sesji. Model może być bezbłędny, a akcja i tak
 * zrobi swoje. Dlatego tu sterujemy aplikacją PRAWDZIWYMI akcjami i czytamy PRAWDZIWY stan.
 *
 * Każda bramka ma KONTROLĘ CZUŁOŚCI — stan bliźniaczy z odwrotnym wynikiem.
 * Uruchomienie: npm run man:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const { outputFiles } = await esbuild({
  entryPoints: [resolve(ROOT, 'src/main.js')], bundle: true, format: 'iife',
  write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
});
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String(e && (e.detail?.message || e.message) || e)));
const dom = new JSDOM(readFileSync(resolve(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8777/', virtualConsole: vc });
const win = dom.window;
{ const s = win.document.createElement('script'); s.textContent = outputFiles[0].text; win.document.body.appendChild(s); }
win.requestAnimationFrame = () => 0;
win.cancelAnimationFrame = () => {};

const h = win.__OTOREPO_TEST__;
const A = (n) => (h && h[n]) || win[n];
const POTRZEBNE = ['state', 'render', 'startManeuver', 'setGuideSide', 'openTest', 'setDixObs', 'pickCanal', 'pickSize', 'goStep', 'zakonczSerie', 'setVariant', 'syncShell', 'setLangUI'];
const brak = POTRZEBNE.filter(n => typeof A(n) === 'undefined');
if (errs.length || brak.length) {
  console.error('✗ BLAD LADOWANIA — wyrocznia niewazna.');
  if (errs.length) console.error('  loadErrors   :', errs.slice(0, 5));
  if (brak.length) console.error('  brak uchwytu :', brak);
  process.exit(1);
}
const st = A('state');
st.lang = 'pl';
const app = () => win.document.querySelector('#app').innerHTML;
// Stan wyjściowy dla każdej sekcji — bez tego przypadki przechodzą przez kolejność bloków,
// a nie przez kod aplikacji (ta pułapka zamknęła ZR4/ZR5 w Bloku 9).
function czysty() {
  st.mode = 'treat'; st.screen = 'setup'; st.area = 'diag';
  st.side = 'P'; st.canal = null; st.maneuverKey = null; st.testKey = null;
  st.variant = 'canalo'; st.variantZrodlo = null; st.dixObs = null; st.dixRep = 0;
  st.diagCentral = false; st.size = 'medium'; st.plan = null; st.step = 0;
  st.running = false; st.elapsedMs = 0; st.total = 0; st.autoAdvance = false;
  st.obs = {}; st.obsOdciski = {}; st.decisionSeq = 0;
  st.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  A('render')();
}

/* ═══════════ A. WYBÓR KANAŁU NIE WYBIERA MANEWRU ZA UŻYTKOWNIKA ═══════════
   Zmierzone: kanał przedni ma JEDEN manewr, więc dotknięcie kafelka kanału uzbrajało Yacovino,
   a `state.plan` zostawał poprzedni. Krok „Manewr" prowadził wtedy do przewodnika (`wymaga:
   plan && maneuverKey` — oba niepuste, tylko niezgodne) i rysował manewr porzuconego kanału. */
czysty();
A('startManeuver')('lempert');
eq('KA1/plan-lempert', st.plan.key, 'lempert');
A('pickCanal')('anterior');
eq('KA2/bez-auto-manewru', st.maneuverKey, null);
eq('KA3/plan-porzucony', st.plan, null);
eq('KA4/odcisk-nietkniety', st.flow.maneuver.key, 'lempert');
// KONTROLA CZUŁOŚCI: kanał ZGODNY z planem nie ma prawa go skasować.
czysty(); A('startManeuver')('lempert'); A('pickCanal')('horizontal');
T('KA5/czulosc-ten-sam-kanal', !!st.plan && st.plan.key === 'lempert', 'plan tego samego kanału musi przeżyć');
eq('KA6/manewr-zostaje', st.maneuverKey, 'lempert');

/* ═══════════ B. PIGUŁKA STRONY NIE PODMIENIA MANEWRU ═══════════ */
czysty(); A('startManeuver')('lempert');
const przedKroki = st.plan.steps.length;
st.maneuverKey = 'yacovino';                       // symulacja rozjazdu, który dotąd powstawał sam
A('setGuideSide')('L');
eq('ST1/plan-nadal-lempert', st.plan.key, 'lempert');
eq('ST2/liczba-krokow', st.plan.steps.length, przedKroki);
eq('ST3/manewr-wrocil-do-planu', st.maneuverKey, 'lempert');
eq('ST4/strona-przebudowana', st.plan.side, 'L');
eq('ST5/stan-zgodny-z-planem', st.side, st.plan.side);

/* ═══════════ C. MARTWY PRZYCISK STRONY ═══════════
   Zmierzone: przy `state.side='L'` i `plan.side='P'` pigułka pokazywała P (czyta plan), a klik
   w L nie robił nic, bo straż `if(state.side===s) return` widziała równość. Manewru nie dało się
   przełączyć na drugie ucho. */
czysty(); A('startManeuver')('epley');
st.side = 'L';                                     // rozjazd wprowadzony ręcznie
A('setGuideSide')('L');
eq('MP1/plan-doganial-stan', st.plan.side, 'L');
T('MP2/zgodnosc', st.side === st.plan.side, 'po kliknięciu strony stan i plan muszą się zgadzać');
// KONTROLA CZUŁOŚCI: gdy oba już się zgadzają, akcja NIE przebudowuje planu (bez restartu kroku).
czysty(); A('startManeuver')('epley'); A('goStep')(2);
const planId = st.plan;
A('setGuideSide')('P');
T('MP3/czulosc-bez-zmiany', st.plan === planId && st.step === 2, 'zgodna strona nie może restartować manewru');

/* ═══════════ D. RĘCZNIE USTAWIONY CZAS UTRZYMANIA POZYCJI ═══════════
   `setStepSeconds` zapisuje w żywym planie parametr KLINICZNY. Przebudowa planu gubiła go bez
   ostrzeżenia — a Blok 10 dokłada kolejne drogi przebudowy. */
czysty(); A('startManeuver')('epley');
st.plan.steps[1].seconds = 120;
A('setGuideSide')('L');
eq('CZ1/czas-przezyl-strone', st.plan.steps[1].seconds, 120);
eq('CZ2/reszta-fabryczna', st.plan.steps[2].seconds, 30);
A('setLangUI')('en'); A('setLangUI')('pl');
eq('CZ3/czas-przezyl-jezyk', st.plan.steps[1].seconds, 120);
// Rozmiar złogu ŚWIADOMIE nadpisuje: zmienia zalecany czas utrzymania, więc trzymanie starej
// wartości znaczyłoby, że aplikacja przyjmuje wybór rozmiaru i zaraz go ignoruje.
st.screen = 'guide'; A('pickSize')('small');
eq('CZ4/rozmiar-nadpisuje', st.plan.steps[1].seconds, 45);

/* ═══════════ E. „WYKONANY" TO NIE „OBEJRZANY" ═══════════ */
czysty(); A('startManeuver')('epley');
const n = st.plan.steps.length;
A('goStep')(n - 1);                                // JEDEN skok na ostatni etap
eq('WY1/skok-nie-wykonuje', st.flow.maneuver.consumed, false);
/* Skutek widoczny dla użytkownika, a nie tylko flaga w stanie: po skoku po osi zmiana mechanizmu
   MUSI zapalić pasek ostrzegawczy. Dotąd jedno dotknięcie ostatniego etapu wyciszało go na stałe. */
A('setVariant')('cupulo');
A('syncShell')();
T('WY2/alarm-po-skoku', /wymaga ponownego przeliczenia/i.test(win.document.querySelector('#flowalert').innerHTML),
  'po SKOKU na ostatni etap zmiana mechanizmu musi dalej zapalać alarm');
czysty(); A('startManeuver')('epley');
for (let i = 1; i < n; i++) A('goStep')(i);        // krok po kroku
eq('WY3/sekwencja-wykonuje', st.flow.maneuver.consumed, true);
czysty(); A('startManeuver')('epley');
A('zakonczSerie')();
eq('WY4/jawne-zakonczenie', st.flow.maneuver.consumed, true);
// KONTROLA CZUŁOŚCI: cofnięcie na ostatni etap z etapu PRZED nim to dojście sekwencyjne.
czysty(); A('startManeuver')('epley'); A('goStep')(n - 2); A('goStep')(n - 1);
eq('WY5/czulosc-sekwencja', st.flow.maneuver.consumed, true);

/* ═══════════ F. KARTA NAZYWA TĘ SAMĄ STRONĘ, DLA KTÓREJ POWSTAJE PLAN ═══════════
   Downbeat w Dix-Hallpike'u wskazuje kanał PRZEDNI ucha PRZECIWNEGO. Karta pisała „Leczenie dla
   strony lewa", a `startManeuver` budował plan ze `state.side`, czyli dla prawego. */
czysty();
st.mode = 'diag'; st.side = 'P';
A('openTest')('dix'); A('setDixObs')('ant');
const html = app();
const m = html.match(/Leczenie dla strony\s*<b>([^<]+)<\/b>/);
T('SD1/karta-nazywa-strone', !!m, 'karta leczenia musi nazwać stronę');
const nazwana = m && m[1].trim() === 'lewa' ? 'L' : 'P';
const przycisk = html.match(/startManeuver\('yacovino','([LP])'\)/);
T('SD2/przycisk-niesie-strone', !!przycisk, 'przycisk rozpoczęcia musi nieść stronę jawnie');
eq('SD3/przycisk-zgodny-z-napisem', przycisk && przycisk[1], nazwana);
A('startManeuver')('yacovino', przycisk[1]);
eq('SD4/plan-dla-nazwanej-strony', st.plan.side, nazwana);
// KONTROLA CZUŁOŚCI: bez downbeatu strona karty = strona badana, więc plan też.
czysty(); st.mode = 'diag'; st.side = 'P';
A('openTest')('dix'); A('setDixObs')('post');
const html2 = app();
const p2 = html2.match(/startManeuver\('epley','([LP])'\)/);
T('SD5/czulosc-bez-downbeatu', !!p2 && p2[1] === 'P', 'bez downbeatu strona karty to strona badana');

/* ═══════════ G. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 28;
if (bledy.length) {
  console.error(`✗ man:dom — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ man:dom — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  process.exit(1);
}
console.log(`✓ man:dom — ${ok} przypadkow, akcje manewru zgodne.`);
