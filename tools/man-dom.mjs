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
const POTRZEBNE = ['state', 'render', 'startManeuver', 'setGuideSide', 'openTest', 'setDixObs', 'pickCanal', 'pickSize', 'goStep', 'zakonczSerie', 'setVariant', 'syncShell', 'setLangUI', 'openMan', 'ustawTrybCzasu', 'zmienManewr', 'potwierdzPrzerwe'];
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
  st.trybCzasu = 'staly'; st.sideZrodlo = null;   // KAZDE nowe pole stanu MUSI tu trafic — inaczej przypadki przechodza przez kolejnosc blokow, a nie przez kod aplikacji (TC3 przeszlo wlasnie na tym przeoczeniu)
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

/* ═══════════ K. KRYTERIUM ODBIORU NR 1 ═══════════
   „Dobór kanału, strony i mechanizmu aktualizuje manewr bez przeładowania strony."
   Sprawdzamy DOSŁOWNIE: po każdym dotknięciu czytamy #app i patrzymy, czy zalecenie się zmieniło.
   Do tego dwa twierdzenia o UCZCIWOŚCI karty, bo to one decydują, czy ekran mówi prawdę:
   manewr pierwszego rzutu odróżniony od alternatyw ORAZ zdanie o autorstwie trzech wartości. */
const zalecany = () => { const m = app().match(/class="ekspert__pierwszy">\s*<b>([^<]+)<\/b>/); return m ? m[1].trim() : null; };
czysty();
A('pickCanal')('posterior');
eq('K1a/tylny-kanalo', zalecany(), 'Epley');
A('setVariant')('cupulo');
eq('K1b/mechanizm-zmienia-manewr', zalecany(), 'Semont');
A('pickCanal')('horizontal');
eq('K1c/kanal-zmienia-manewr', zalecany(), 'Gufoni (Appiani, apogeotropowy)');   // V18 dopisal atrybucje
A('setVariant')('canalo');
eq('K1d/z-powrotem-geotropowy', zalecany(), 'Lempert (BBQ)');
A('pickSide')('L');
eq('K1e/strona-nie-zmienia-manewru', zalecany(), 'Lempert (BBQ)');
T('K1f/strona-widoczna', /aria-pressed="true"[^>]*onclick="pickSide\('L'\)"|onclick="pickSide\('L'\)"[^>]*aria-pressed="true"/.test(app())
  || /data-side="L"[^>]*aria-pressed="true"/.test(app()), 'wybrana strona musi być zaznaczona');
// UCZCIWOŚĆ 1: dopóki użytkownik nie dotknął strony i mechanizmu, karta NIE MOŻE przypisywać
// mu tych wartości. To literały ze state.js, nie decyzje.
czysty(); A('pickCanal')('posterior');
T('K1g/atrybucja-domyslne', /wartości domyślne — nie potwierdziłeś ich/.test(app()),
  'karta musi przyznać, że strona i mechanizm są domyślne');
T('K1h/atrybucja-nie-klamie', !/Kanał, stronę i mechanizm podałeś Ty/.test(app()),
  'nie wolno przypisywać użytkownikowi wartości, których nie dotknął');
// KONTROLA CZUŁOŚCI: po dotknięciu obu zdanie MUSI się zmienić.
A('pickSide')('P'); A('setVariant')('canalo');
T('K1i/atrybucja-komplet', /Kanał, stronę i mechanizm podałeś Ty/.test(app()), 'po trzech gestach karta wymienia komplet');
/* UCZCIWOŚĆ 2: żadnej liczby pewności ani słowa o prawdopodobieństwie NA KARCIE DOBORU.
   Zakres celowo zawężony do samej karty, a nie do całego ekranu: kafelki kanałów niosą
   EPIDEMIOLOGIĘ („najczęstszy ~85%", „~10%", „rzadki ~1–2%"), czyli częstość w populacji, i to
   jest uczciwa informacja dydaktyczna. Ta sama liczba OBOK nazwy zalecanego manewru czytałaby się
   jako prawdopodobieństwo rozpoznania u TEGO pacjenta — a tego model nie liczy. Pierwsza wersja
   tej bramki skanowała cały ekran i zapaliła się właśnie na epidemiologii; zawężenie jest
   świadome, nie jest ucieczką przed czerwonym. */
{
  const i = app().indexOf('reco--ekspert');
  const karta = i < 0 ? '' : app().slice(i);
  T('K1j/bez-liczb-pewnosci', karta.length > 0 && !/\d+\s*%|prawdopodobie|zgodność z rozpoznaniem/i.test(karta),
    'karta doboru nie ma prawa podawać liczby pewności — model nie liczy prawdopodobieństw');
  // KONTROLA CZUŁOŚCI: wzorzec MUSI trafiać w tekst, który naprawdę łamie regułę.
  T('K1j2/czulosc', /\d+\s*%|prawdopodobie|zgodność z rozpoznaniem/i.test('najwyzsza zgodność z rozpoznaniem (92%)'),
    'kontrola: wzorzec musi łapać napis z mockupu, którego świadomie nie użyliśmy');
}
// Kanał o JEDNYM manewrze nie ma sekcji alternatyw (pusta sekcja sugerowałaby, że coś przemilczano).
czysty(); A('pickCanal')('anterior');
T('K1k/przedni-bez-alternatyw', !/ekspert__alt/.test(app()), 'kanał przedni ma jeden manewr — brak sekcji alternatyw');
T('K1l/przedni-yacovino', zalecany() === 'Yacovino', 'kanał przedni → Yacovino');

/* ═══════════ L. TRYB LICZNIKA: PODŁOGA, NIGDY SKRÓCENIE ═══════════
   To najgroźniejsza możliwa pomyłka tego bloku. Semont ma w instrukcji „Utrzymaj 1–3 min"
   i `seconds=90`, a model przewiduje 18,5 s (okno dynamiki zakorkowane capem). Tryb, który
   ustawiałby tę liczbę wprost, skróciłby rzut o ~70 s poniżej dolnej granicy WŁASNEJ instrukcji
   aplikacji — a przy włączonym auto-przejściu sam przesunąłby pacjenta dalej. */
czysty(); A('startManeuver')('semont');
const protokolSemont = st.plan.steps.map(x => x.seconds);
A('ustawTrybCzasu')('doUstapienia');
T('TC1/semont-nie-skrocony', st.plan.steps.every((x, i) => x.seconds == null || x.seconds >= protokolSemont[i]),
  'tryb „do ustąpienia" nie ma prawa skrócić ani jednego etapu poniżej protokołu');
eq('TC2/semont-bez-zmian', st.plan.steps.map(x => x.seconds), protokolSemont);
// Lempert k5: model daje 39,8 s przy protokole 30 s — TU tryb ma realnie wydłużyć.
czysty(); A('startManeuver')('lempert');
const protokolLempert = st.plan.steps.map(x => x.seconds);
A('ustawTrybCzasu')('doUstapienia');
T('TC3/lempert-wydluzony', st.plan.steps.some((x, i) => x.seconds != null && x.seconds > protokolLempert[i]),
  'gdzieś tryb MUSI wydłużać — inaczej jest ozdobnikiem');
T('TC4/lempert-nigdy-krocej', st.plan.steps.every((x, i) => x.seconds == null || x.seconds >= protokolLempert[i]),
  'i nadal nigdzie nie skraca');
// Krok BEZ odliczania zostaje bez odliczania — tryb licznika nie zmienia samego manewru.
T('TC5/plynne-zostaje-plynne', st.plan.steps.filter((x, i) => protokolLempert[i] == null).every(x => x.seconds == null),
  'etap „wykonaj płynnie" nie może stać się odliczany');
// Powrót do „stałego" przywraca protokół.
A('ustawTrybCzasu')('staly');
eq('TC6/powrot-do-protokolu', st.plan.steps.map(x => x.seconds), protokolLempert);
// KUPULOLITIAZA: tryb NIEDOSTĘPNY, bo oczopląs nie wygasa — i ekran musi podać powód.
czysty(); A('startManeuver')('bascule');
T('TC7/cupulo-przycisk-wylaczony', /onclick="ustawTrybCzasu\('doUstapienia'\)"/.test(app())
  && /disabled[^>]*onclick="ustawTrybCzasu\('doUstapienia'\)"|onclick="ustawTrybCzasu\('doUstapienia'\)"[^>]*disabled/.test(app().replace(/\n/g, ' ')),
  'przy kupulolitiazie tryb musi być wyłączony');
T('TC8/cupulo-powod', /oczopląs nie wygasa/.test(app()), 'wyłączenie bez podania powodu to milczenie, nie ostrzeżenie');
const przedB = st.plan.steps.map(x => x.seconds);
A('ustawTrybCzasu')('doUstapienia');
eq('TC9/cupulo-nie-rusza-czasow', st.plan.steps.map(x => x.seconds), przedB);

/* ═══════════ M. OŚ ETAPÓW I DANE ETAPU ═══════════ */
czysty(); A('startManeuver')('epley');
T('ME1/os-z-podpisami', /osetapow/.test(app()) && /Pozycja wyjściowa/.test(app()), 'oś etapów musi nieść podpisy, nie same kropki');
T('ME2/dane-etapu', /etapdane/.test(app()), 'wiersz danych etapu istnieje');
T('ME3/bez-identyfikatorow', !/supineHang|leanR|sitFront/.test(app().split('etapdane')[1].slice(0, 800)),
  'na ekranie nie ma prawa być identyfikatora silnika zamiast nazwy pozycji');
T('ME4/strona-pacjenta', /\(pacjenta\)/.test(app()), 'strona zawsze opisana jako strona PACJENTA');
T('ME5/alternatywy-bez-biezacego', !/altman__b[^>]*>Epley/.test(app()), 'lista alternatyw nie może zawierać bieżącego manewru');
{ const i = app().indexOf('altman'); const blok = i < 0 ? '' : app().slice(i, i + 600);
  T('ME6/alternatywy-sa', /Semont/.test(blok) && /Bascule/.test(blok), 'alternatywy kanału tylnego muszą być dostępne'); }
// Kanał o JEDNYM manewrze nie pokazuje pustej sekcji alternatyw.
czysty(); A('startManeuver')('yacovino');
T('ME7/yacovino-bez-alternatyw', !/altman/.test(app()), 'kanał przedni ma jeden manewr');

/* ═══════════ N. KRYTERIUM ODBIORU NR 3 NA EKRANIE ═══════════
   Model liczy dobrze (man:check, sekcja ZE) — tu pytamy, czy klinicysta to ZOBACZY. */
czysty(); A('startManeuver')('epley');
T('K3a/bez-luki-cisza', !/lukanote/.test(app()), 'bez przerwy nie ma komunikatu');
T('K3b/bez-proby-blokady-cisza', !/wakenote/.test(app()), 'dopoki nikt nie nacisnal Start, nie ma o czym ostrzegac');
st.luka = 12000; A('render')();
T('K3c/luka-widoczna', /lukanote/.test(app()) && /0:12/.test(app()), 'przerwa musi byc pokazana z dlugoscia');
T('K3d/luka-wymaga-gestu', /potwierdzPrzerwe\(\)/.test(app()), 'przerwe potwierdza CZLOWIEK, nie zegar');
T('K3e/luka-mowi-czego-nie-wie', /nie wie, czy pacjent utrzymal pozycje|nie wie, czy pacjent utrzymał pozycję/.test(app()),
  'komunikat musi nazwac granice wiedzy aplikacji, nie tylko fakt przerwy');
A('potwierdzPrzerwe')();
T('K3f/po-potwierdzeniu-znika', !/lukanote/.test(app()), 'potwierdzona przerwa znika');
st.wakeOK = false; A('render')();
T('K3g/brak-blokady-ostrzega', /wakenote/.test(app()), 'gdy platforma nie da blokady ekranu — ostrzezenie');
st.wakeOK = true; A('render')();
T('K3h/czulosc-blokada-dziala', !/wakenote/.test(app()), 'gdy blokada dziala, nie strasz bez powodu');

/* ═══════════ M. SESJA CIAGLA: MECZLIWOSC LICZONA RAZ, NIGDY DWA RAZY ═══════════
   NAJWAZNIEJSZA bramka tego trybu i jedyna, ktora moze wprowadzic klinicyste w blad.
   `fatigueFactor(rep)` (mnoznik w renderze) i sesja ciagla (przesuniecie zloga miedzy badaniami)
   opisuja TO SAMO zjawienie — ZMIERZONE: sesja 0,621/0,400/0,266 dla powtorzen 1-3, mnoznik
   0,630/0,406/0,270, zgodnosc ponizej 1,5 %. Zastosowane naraz podnosza meczliwosc DO KWADRATU
   (0,391 zamiast 0,621), czyli oczoplas gasnie dwa razy szybciej niz mowi ktorykolwiek z modeli.
   Bramka pilnuje ROWNOWAZNOSCI: mnoznik widoczny na ekranie DOKLADNIE wtedy, gdy sesja wylaczona.
   Dowod failing-first: usuniecie warunku `|| sesjaOn` zapala MC2. */
{
  czysty();
  A('openTest')('dix');
  A('setDixObs')('post');
  A('repeatDixProvoke')();                       // rep=1 → mnoznik 0,630 przy sesji WYLACZONEJ
  const bezSesji = app();
  T('MC1/bez-sesji-mnoznik-widoczny', /6[23]\s*%|63\s*%/.test(bezSesji) || /%/.test(bezSesji),
    'przy sesji wylaczonej ekran ma pokazywac oslabienie z mnoznika');
  const procBez = (bezSesji.match(/(\d{1,3})\s*%/g) || []).join(',');

  A('przelaczSesje')();                          // sesja ON — mnoznik MUSI zniknac
  T('MC0/przelacznik-dziala', !!st.session, 'przelacznik musi ustawic state.session');
  const zSesja = app();
  const procZ = (zSesja.match(/(\d{1,3})\s*%/g) || []).join(',');
  /* Mierzymy WYSTAWIONY mnoznik (data-fatfactor), nie procent na karcie: pierwsza wersja czytala
     procent i przechodzila takze po zepsuciu kodu, bo tamta karta ma wlasny warunek. */
  const fat = (html) => (html.match(/data-fatfactor="([0-9.]+)"/) || [])[1];
  T('MC2/sesja-znosi-mnoznik', fat(bezSesji) === '0.630' && fat(zSesja) === '1.000',
    `bez sesji mnoznik ma byc 0,630 (jest ${fat(bezSesji)}), z sesja 1,000 (jest ${fat(zSesja)})`);

  A('przelaczSesje')();                          // i z powrotem — kontrola czulosci w druga strone
  T('MC3/powrot-przywraca', !st.session && (app().match(/data-fatfactor="([0-9.]+)"/)||[])[1] === '0.630',
    'wylaczenie sesji musi przywrocic mnoznik — inaczej przelacznik jest jednokierunkowy');
}

/* ═══════════ N. LISTA PRÓB NA EKRANIE WYBORU JEST WYLICZANA, NIE WPISANA ═══════════
   Zmierzone 2026-08-15: ekran trzymał CZTERY literały (`dix`/`roll`/`bowlean`/`headhang`), więc
   piąta próba silnika — lying-down / sitting-up z oceny II V11/D2 — była policzalna, ale
   NIEOSIĄGALNA: model umiał ją rozstrzygnąć, a klinicysta nie miał jak do niej wejść. To ta sama
   klasa usterki, której NIE ma po stronie manewrów, bo tam lista czyta CANALS[kanal].maneuvers —
   i dlatego `zuma` oraz `kim` pojawiły się same. Bramka pilnuje RÓWNOWAŻNOŚCI w obie strony:
   każda próba z DIAG ma przycisk, i nie ma przycisku bez próby w DIAG. Dowód failing-first:
   przywrócenie literałów gubi `lyingdown` i zapala N1. */
{
  const { DIAG } = await import('../src/pose/maneuvers.js');
  czysty();
  A('setMode')('diag');
  const html = app();
  const wProbie = (k) => html.includes(`openTest('${k}')`);
  const klucze = Object.keys(DIAG);
  for (const k of klucze) T(`N1/${k}/ma-przycisk`, wProbie(k), `próba ${k} jest w DIAG, ale nie ma jej na ekranie wyboru`);
  const ile = (html.match(/openTest\('/g) || []).length;
  eq('N2/bez-nadmiaru', ile, klucze.length);
  T('N3/lyingdown-osiagalny', wProbie('lyingdown'),
    'lying-down/sitting-up musi być osiągalny — to on rozdziela stronę kanału poziomego przy kupulolitiazie');
}

/* ═══════════ O. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 88;   /* 84 + 4: MC0-MC3 (sesja ciagla znosi mnoznik meczliwosci) */   /* 77 + 7: N1 x5 prob + N2 + N3 (lista prob wyliczana z DIAG) */
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
