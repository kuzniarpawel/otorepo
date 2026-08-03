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
const POTRZEBNE = ['state', 'render', 'startManeuver', 'setGuideSide', 'openTest', 'setDixObs', 'pickCanal', 'pickSize', 'goStep', 'zakonczSerie', 'setVariant', 'syncShell', 'setLangUI', 'openMan'];
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

/* ═══════════ G. SYGNAŁY BEZPIECZEŃSTWA NIE ZNIKAJĄ NA EKRANIE MANEWRU ═══════════
   Reguła `@media (orientation:landscape) and (max-height:520px){ .shell[data-focusmode] .flowbar
   { display:none } }` ukrywała CAŁY pasek — a w nim mieszkają #flowalert i #flowflag. Zapalała się
   dokładnie przy `data-focusmode`, czyli na ekranie manewru. jsdom nie liczy kaskady, więc bramką
   jest SAMA REGUŁA: żaden selektor ukrywający nie ma prawa obejmować kontenera, w którym siedzą
   sygnały bezpieczeństwa. */
{
  const css = readFileSync(resolve(ROOT, 'src/styles/flow.css'), 'utf8');
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  const ukrywaPasek = /\.shell\[data-focusmode\]\s*\.flowbar\s*\{[^}]*display:\s*none/.test(css);
  T('BE1/pasek-nie-znika', !ukrywaPasek,
    'tryb skupienia nie może ukrywać kontenera, w którym siedzi ostrzeżenie i czerwona flaga');
  T('BE2/lista-krokow-moze-zniknac', /\.shell\[data-focusmode\]\s*\.flownav\s*\{[^}]*display:\s*none/.test(css),
    'budżet pionu ma być odzyskany na MAPIE PROCESU — inaczej naprawa jest tylko kosmetyczna');
  T('BE3/alert-w-pasku', /id="flowalert"/.test(html) && /id="flowbar"/.test(html),
    'oba elementy dalej istnieją w powłoce');
}
// Czerwona flaga z kwalifikacji wstępnej JEST w drzewie na ekranie manewru.
czysty();
st.flow.triage = { complete: true, kategoria: 'x', sciezka: null, pewnosc: 'wysoka', czerwona: true };
A('startManeuver')('epley');
A('syncShell')();
T('BE4/czerwona-flaga-na-manewrze', /Czerwona flaga/i.test(win.document.querySelector('#flowbar').innerHTML),
  'czerwona flaga musi być w drzewie także przy screen=guide');
// KONTROLA CZUŁOŚCI: bez czerwonej flagi napisu nie ma.
czysty(); A('startManeuver')('epley'); A('syncShell')();
T('BE5/czulosc', !/Czerwona flaga/i.test(win.document.querySelector('#flowbar').innerHTML), 'bez flagi brak napisu');

/* ═══════════ H. ZGODNOŚĆ MANEWRU DZIAŁA TAKŻE BEZ PRÓBY ═══════════
   Tryb ekspercki nie ma `testKey`, więc dotąd jedyny detektor rozjazdu manewru z wejściami był
   w nim wyłączony. Sprawdzamy SKUTEK NA EKRANIE (pasek), nie samą wartość z modelu. */
czysty();
st.canal = 'horizontal'; st.variant = 'cupulo';
A('openMan')('gufoniGeo');                          // pierwszym rzutem jest APOgeotropowy
A('syncShell')();
T('ZG1/rozjazd-bez-proby', /wymaga ponownego przeliczenia|nie odpowiada bieżącej/i.test(win.document.querySelector('#flowbar').innerHTML),
  'manewr niezgodny z DEKLAROWANYM kanałem i mechanizmem musi zapalić pasek także bez próby');
czysty();
st.canal = 'horizontal'; st.variant = 'cupulo';
A('openMan')('gufoniApo');                          // manewr pierwszego rzutu
A('syncShell')();
T('ZG2/czulosc-zgodny', !/wymaga ponownego przeliczenia/i.test(win.document.querySelector('#flowbar').innerHTML),
  'manewr pierwszego rzutu nie ma prawa alarmować');

/* ═══════════ I. KROK „INTERPRETACJA" NIE UDAJE WYKONANEGO ═══════════ */
czysty();
st.canal = 'posterior';
A('openMan')('epley');
A('syncShell')();
const mapa = () => [...win.document.querySelectorAll('#flowsteps .flowstep')].map(li => li.className);
T('IN1/pominiety', /flowstep--skipped/.test(mapa()[3]), 'bez próby krok Interpretacja jest „pominięty"');
A('setVariant')('cupulo');
A('syncShell')();
T('IN2/nadal-pominiety', /flowstep--skipped/.test(mapa()[3]),
  'dotknięcie mechanizmu bez próby nie ma prawa zamienić „pominięty" w „zakończony"');
// KONTROLA CZUŁOŚCI: przy istniejącej próbie ten sam gest MUSI oznaczyć krok jako zrobiony.
czysty(); st.mode = 'diag'; A('openTest')('dix'); A('setVariant')('cupulo'); A('syncShell')();
T('IN3/czulosc-z-proba', !/flowstep--skipped/.test(mapa()[3]), 'przy istniejącej próbie mechanizm liczy się jako interpretacja');

/* ═══════════ J. KONWERSJA KANAŁOWA PO WYKONANYM MANEWRZE ═══════════ */
czysty();
st.canal = 'posterior';
A('startManeuver')('epley');
A('zakonczSerie')();                                 // manewr WYKONANY
A('pickCanal')('horizontal');                        // kontrolny roll pokazał kanał poziomy
A('syncShell')();
T('KO1/sygnal', /konwersj/i.test(win.document.querySelector('#flowalert').innerHTML),
  'wykonany manewr + inny kanał = wskazanie do NOWEGO manewru, nie cisza');
// KONTROLA CZUŁOŚCI: ten sam kanał = cisza.
czysty(); st.canal = 'posterior'; A('startManeuver')('epley'); A('zakonczSerie')(); A('syncShell')();
T('KO2/czulosc-ten-sam-kanal', win.document.querySelector('#flowalert').hidden, 'bez zmiany kanału pasek milczy');

/* ═══════════ K. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 40;
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
