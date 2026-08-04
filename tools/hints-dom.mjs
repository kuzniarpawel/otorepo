/* OTOREPO — wyrocznia EKRANÓW I AKCJI HINTS/HINTS+ (Blok 12). jsdom, realny graf modułów.
 *
 * ═══ DLACZEGO OSOBNO OD hints:check ═══
 * Wszystkie trzy kryteria odbioru Bloku 12 są zdaniami o TYM, CO ROBI APLIKACJA:
 *   1. „nie można przejść do HINTS bez potwierdzenia obrazu klinicznego lub świadomego pominięcia
 *      kwalifikacji" — to zachowanie SIEDMIU dróg wejścia, nie własność modelu;
 *   2. „«nie można ocenić» nie jest traktowane jak wynik prawidłowy" — to także WYGLĄD: opcja musi
 *      dać się odróżnić od odpowiedzi, zanim ktokolwiek przeczyta napis;
 *   3. „wynik zawiera wyraźne ostrzeżenie przy cechach centralnych" — „wyraźne" znaczy: NAD
 *      wnioskiem, a nie w stopce, i na osobnym ekranie wyniku.
 * Model może być bezbłędny, a akcja i tak zrobi swoje — Blok 10 zmierzył to trzy razy, a w tym
 * bloku złoty wzorzec złapał przełącznik w bramce wejścia.
 *
 * ZMIERZONE PRZED ZMIANĄ: 7 z 7 dróg wejścia do modułu wchodziło przy PUSTEJ kwalifikacji.
 * Sekcja A jest tym pomiarem zamienionym w stałą bramkę.
 *
 * Każda bramka ma KONTROLĘ CZUŁOŚCI — stan bliźniaczy z odwrotnym wynikiem.
 * Uruchomienie: npm run hints:dom
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
const POTRZEBNE = ['state', 'render', 'goHintsKwal', 'ustawPrzeszkolenieHints', 'pomijajKwalifikacje',
  'cofnijPominiecie', 'zacznijBadanieHints', 'otworzSymulatorHints', 'otworzLaboratorium',
  'ustawSkladowaHints', 'ustawPowodNiewiarHints', 'goHintsKrok', 'dalejHints', 'wsteczHints',
  'pokazWynikHints', 'wrocDoBadaniaHints', 'wyczyscBadanieHints',
  'setMode', 'openHints', 'openHintsCustom', 'goArea', 'setTriage', 'toggleTriageFlaga', 'syncShell'];
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
const tekst = () => app().replace(/<[^>]*>/g, ' ');

// KAZDE nowe pole stanu MUSI tu trafic — inaczej przypadki przechodza przez KOLEJNOSC blokow,
// a nie przez kod aplikacji (pulapka zamknela ZR4/ZR5 w Bloku 9 i TC3 w Bloku 10).
function czysty() {
  st.mode = 'treat'; st.screen = 'start'; st.area = 'start';
  st.triage = {}; st.triageStep = null;
  st.hintsBadanie = {}; st.hintsPowodNiewiar = null; st.hintsPominiecie = null;
  st.hintsPrzeszkolenie = null; st.hintsKrok = null; st.hintsBlad = null;
  st.hintsCustom = null; st.hintsScenario = 'neuritisR';
  st.plan = null; st.testKey = null; st.canal = null; st.maneuverKey = null;
  st.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  A('render')();
}
// Kwalifikacja POTWIERDZONA droga uzytkownika (odpowiedzi, nie wstrzykniety stan).
function potwierdz() {
  A('setTriage')('przebieg', 'ciagle'); A('setTriage')('oczoplas', 'obecny'); A('toggleTriageFlaga')('brak');
  A('ustawPrzeszkolenieHints')('tak');
}
const W_MODULE = () => st.screen === 'hints' || st.screen === 'hintsBad' || st.screen === 'hintsWyn';

/* ═══════════ A. KRYTERIUM ODBIORU NR 1 — SIEDEM DRÓG WEJŚCIA ═══════════
   Każda droga, którą do modułu da się dziś wejść, przy PUSTEJ kwalifikacji ma wylądować na ekranie
   kwalifikacji — nigdy w badaniu i nigdy w symulatorze. Lista jest wyliczona z pomiaru, a nie
   wymyślona: to dokładnie te siedem wywołań, które przed zmianą wchodziły do środka. */
const WEJSCIA = [
  ['zakladka-HINTS', () => A('setMode')('hints')],
  ['openHints-neuritis', () => A('openHints')('neuritisR')],
  ['openHints-udar', () => A('openHints')('strokeCentral')],
  ['openHintsCustom', () => A('openHintsCustom')()],
  ['symulator-z-kwalifikacji', () => A('otworzSymulatorHints')()],
  ['laboratorium-z-kwalifikacji', () => A('otworzLaboratorium')()],
];
for (const [nazwa, akcja] of WEJSCIA) {
  czysty(); akcja();
  T(`A/${nazwa}`, !W_MODULE(), `wejscie ${nazwa} weszlo do modulu przy pustej kwalifikacji (screen=${st.screen})`);
  eq(`A/${nazwa}/laduje-na-kwalifikacji`, st.screen, 'hintsKwal');
}
/* SIÓDME WEJŚCIE ZMIENIŁO ZNACZENIE W BLOKU 14, I DLATEGO ZMIENIŁA SIĘ TU BRAMKA, A NIE POMIAR.
   Do Bloku 13 obszar „Laboratorium" BYŁ matematycznym pacjentem, więc `goArea('lab')` było jednym
   z siedmiu wejść do modułu HINTS i musiało lądować na kwalifikacji. Blok 14 rozdzielił te dwie
   rzeczy: Laboratorium jest stanowiskiem fizjologicznym, które NIE POKAZUJE werdyktu HINTS ani
   lokalizacji, a matematyczny pacjent został tam, gdzie był — za kwalifikacją, pod przyciskiem
   na jej ekranie. Gwarancja Bloku 12 nie osłabła, tylko wzmocniła się: z tego obszaru nie da się
   już wejść do modułu W OGÓLE, a nie tylko „nie da się wejść bez kwalifikacji". */
{
  czysty(); A('goArea')('lab');
  T('A/obszar-laboratorium-nie-jest-hints', !W_MODULE(),
    `obszar Laboratorium wszedl do modulu HINTS (screen=${st.screen})`);
  T('A/obszar-laboratorium-ma-swoj-ekran', st.screen === 'labLista' || st.screen === 'labEksp',
    `obszar Laboratorium powinien miec wlasny ekran, jest screen=${st.screen}`);
}
// Kwalifikacja wstepna Bloku 6 tez prowadzi na ekran kwalifikacji HINTS, a nie do symulatora.
czysty(); A('setTriage')('przebieg', 'ciagle'); A('setTriage')('oczoplas', 'obecny'); A('toggleTriageFlaga')('brak');
win.triageGo('hints');
eq('A/triageGo-AVS', st.screen, 'hintsKwal');
// KONTROLA CZULOSCI: obraz BPPV nie otwiera nawet ekranu kwalifikacji HINTS.
czysty(); A('setTriage')('przebieg', 'napadowe'); A('setTriage')('wyzwalacz', 'pozycyjny'); A('toggleTriageFlaga')('brak');
win.triageGo('hints');
T('A/triageGo-BPPV-zatrzymana', st.screen !== 'hintsKwal', 'kwalifikacja BPPV nie ma prawa prowadzic do HINTS');
// Kafelki ekranu startowego wolaja bramke, a nie skrot do symulatora.
czysty(); A('goArea')('start');
T('A/kafelek-2', /goHintsKwal\(\)/.test(app()), 'kafelek „ciagle zawroty" musi prowadzic do kwalifikacji');
eq('A/brak-skrotu-do-symulatora', /startGo\('hints'\)/.test(app()), false);

/* ═══════════ B. DWOJE DRZWI I TYLKO DWOJE ═══════════ */
czysty(); A('goHintsKwal')();
A('zacznijBadanieHints')();
eq('B1/bez-kwalifikacji-nie-wpuszcza', st.screen, 'hintsKwal');
T('B2/odmowa-jest-widoczna', /Nie wpuszczono do badania/.test(tekst()), 'odmowa nie moze byc cicha — ekran ma ja nazwac');
T('B3/odmowa-podaje-powod', /Bez odpowiedzi o przebiegu/.test(tekst()), 'odmowa musi powiedziec, czego brakuje');
// DRZWI 1: potwierdzony obraz kliniczny.
czysty(); A('goHintsKwal')(); potwierdz();
T('B4/potwierdzona-widoczna', /Obraz kliniczny potwierdzony/.test(tekst()), 'ekran musi powiedziec, ze obraz jest potwierdzony');
A('zacznijBadanieHints')();
eq('B5/potwierdzona-wpuszcza', st.screen, 'hintsBad');
// DRZWI 2: swiadome pominiecie z powodem.
czysty(); A('goHintsKwal')(); A('pomijajKwalifikacje')('nauka');
eq('B6/pominiecie-zapisane', st.hintsPominiecie, 'nauka');
A('zacznijBadanieHints')();
eq('B7/pominiecie-wpuszcza', st.screen, 'hintsBad');
// IDEMPOTENCJA: powtorne dotkniecie tego samego powodu NIE odbiera dostepu (zlapane przez golden).
czysty(); A('goHintsKwal')(); A('pomijajKwalifikacje')('nauka'); A('pomijajKwalifikacje')('nauka');
eq('B8/pominiecie-idempotentne', st.hintsPominiecie, 'nauka');
A('zacznijBadanieHints')();
eq('B8b/i-nadal-wpuszcza', st.screen, 'hintsBad');
// Cofniecie ma WLASNA akcje i naprawde zamyka drzwi.
czysty(); A('goHintsKwal')(); A('pomijajKwalifikacje')('nauka'); A('cofnijPominiecie')();
eq('B9/cofniecie-czysci', st.hintsPominiecie, null);
A('zacznijBadanieHints')();
eq('B9b/i-zamyka-drzwi', st.screen, 'hintsKwal');
// Powod spoza slownika NIE jest pominieciem.
czysty(); A('goHintsKwal')(); A('pomijajKwalifikacje')('cokolwiek');
eq('B10/powod-spoza-slownika', st.hintsPominiecie, null);
A('zacznijBadanieHints')();
eq('B10b/nie-wpuszcza', st.screen, 'hintsKwal');
// Symulator tez stoi za brama — i przechodzi, gdy brama otwarta.
czysty(); A('goHintsKwal')(); A('pomijajKwalifikacje')('symulacja'); A('otworzSymulatorHints')();
eq('B11/symulator-za-brama', st.screen, 'hints');
czysty(); A('goHintsKwal')(); A('pomijajKwalifikacje')('symulacja'); A('otworzLaboratorium')();
eq('B12/laboratorium-za-brama', st.screen, 'hints');
T('B12b/matematyczny-pacjent-wczytany', !!st.hintsCustom, 'laboratorium musi wejsc z matematycznym pacjentem');
// Czerwona flaga: kwalifikacja odradza i NIE wpuszcza bez swiadomego pominiecia.
czysty(); A('goHintsKwal')();
A('setTriage')('przebieg', 'ciagle'); A('setTriage')('oczoplas', 'obecny'); A('toggleTriageFlaga')('ataksja');
T('B13/czerwona-flaga-widoczna', /⚠/.test(app()) && /odradza/i.test(tekst()), 'czerwona flaga musi byc widoczna na karcie kwalifikacji');
A('zacznijBadanieHints')();
eq('B13b/czerwona-flaga-nie-wpuszcza', st.screen, 'hintsKwal');
// Pytanie o przeszkolenie jest na ekranie kwalifikacji, a nie schowane w wyniku.
czysty(); A('goHintsKwal')();
T('B14/pyta-o-przeszkolenie', /przeszkolenie w wykonywaniu HINTS/.test(tekst()), 'kwalifikacja musi zapytac o przeszkolenie badajacego');
T('B14b/cytuje-powod', /GRACE-3/.test(tekst()), 'pytanie o przeszkolenie musi powiedziec, skad sie bierze');

/* ═══════════ C. BADANIE KROK PO KROKU ═══════════ */
czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')();
eq('C1/pierwsza-skladowa', A('biezacyKrok')(), 'hit');
/* „Jedna skladowa naraz" mierzymy liczba KART PYTANIA, a nie obecnoscia nazwy: nazwy wszystkich
   szesciu skladowych stoja na osi u gory i w tabeli — i tak ma byc. Pierwsza wersja tej bramki
   szukala napisu i zapalala sie na wlasnej osi; ten sam blad, co skanowanie po slowie zamiast po
   strukturze (CZ9 w Bloku 11, wzorzec „lew…" w Bloku 10). */
T('C2/jedna-karta-pytania', (app().match(/class="card hxkarta"/g) || []).length === 1, 'na ekranie ma byc DOKLADNIE jedna karta pytania');
T('C2b/jeden-zestaw-odpowiedzi', (app().match(/class="hxopcje"/g) || []).length === 1, 'na ekranie ma byc jeden zestaw duzych wyborow');
T('C2c/to-ta-wlasciwa', /data-hxel="hit"/.test(app()), 'karta pytania musi dotyczyc biezacej skladowej');
T('C3/instrukcja', /Poproś pacjenta o patrzenie na Twój nos/.test(tekst()), 'kazdy element ma krotka instrukcje (wprost z dokumentu)');
T('C4/znaczenie', /Co to znaczy/.test(tekst()) && /Impulse Normal/.test(tekst()), 'kazdy element ma wyjasnienie znaczenia');
T('C5/pulapka', /Czego ten element NIE mówi/.test(tekst()), 'element musi powiedziec, czego NIE rozstrzyga');
T('C6/os-skladowych', (app().match(/onclick="goHintsKrok\(/g) || []).length === 6, 'os szesciu skladowych musi byc widoczna');
T('C7/postep-nazwany', /składowa 1 z 6/.test(tekst()), 'ekran musi powiedziec, gdzie uzytkownik jest');
// AUTOMATYCZNE PRZEJSCIE tylko przy PIERWSZEJ odpowiedzi.
A('ustawSkladowaHints')('hit', 'sakadaP');
eq('C8/pierwsza-odpowiedz-przesuwa', A('biezacyKrok')(), 'oczoplas');
A('goHintsKrok')('hit'); A('ustawSkladowaHints')('hit', 'sakadaL');
eq('C9/poprawka-nie-przesuwa', A('biezacyKrok')(), 'hit');
// Ponowne dotkniecie tej samej odpowiedzi ja ZDEJMUJE — i to nie jest „nie mozna ocenic".
A('ustawSkladowaHints')('hit', 'sakadaL');
eq('C10/cofniecie-odpowiedzi', st.hintsBadanie.hit, undefined);
T('C10b/to-nie-jest-nieocenione', st.hintsBadanie.hit !== 'nieocenione', 'cofniecie odpowiedzi nie moze ustawiac „nie mozna ocenic"');
// Powod niewiarygodnosci pojawia sie TYLKO przy odpowiedzi „niewiarygodne".
czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')(); A('goHintsKrok')('wiarygodnosc');
T('C11/bez-powodu-gdy-nie-trzeba', !/Powód/.test(tekst()), 'lista powodow nie ma prawa wisiec, gdy badanie nie jest niewiarygodne');
A('ustawSkladowaHints')('wiarygodnosc', 'niewiarygodne'); A('goHintsKrok')('wiarygodnosc');
T('C12/powod-po-zaznaczeniu', /brak możliwości zniesienia fiksacji/.test(tekst()), 'po zaznaczeniu niewiarygodnosci ekran pyta o powod');
A('ustawPowodNiewiarHints')('brakZniesieniaFiksacji');
eq('C12b/powod-zapisany', st.hintsPowodNiewiar, 'brakZniesieniaFiksacji');
A('ustawSkladowaHints')('wiarygodnosc', 'wiarygodne');
eq('C13/zmiana-czysci-powod', st.hintsPowodNiewiar, null);

/* ═══════════ D. KRYTERIUM ODBIORU NR 2 — „NIE MOŻNA OCENIĆ" NA EKRANIE ═══════════ */
{
  czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')();
  const SKLADOWE = ['hit', 'oczoplas', 'skew', 'sluch', 'chod', 'wiarygodnosc'];
  let brakOpcji = [], brakKlasy = [];
  for (const id of SKLADOWE) {
    A('goHintsKrok')(id);
    if (!/Nie można ocenić/.test(tekst())) brakOpcji.push(id);
    if (!/class="hxopcja hxopcja--nieocen"/.test(app())) brakKlasy.push(id);
  }
  T('D1/opcja-przy-kazdej-skladowej', !brakOpcji.length, `skladowe bez jawnego „nie mozna ocenic": ${brakOpcji}`);
  T('D2/wlasny-wyglad', !brakKlasy.length, `skladowe, w ktorych „nie mozna ocenic" wyglada jak odpowiedz: ${brakKlasy}`);
}
// Nieoceniona skladowa trzonu NIE daje wyniku uspokajajacego — i ekran to pisze.
czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')();
for (const [k, v] of Object.entries({ hit: 'sakadaP', oczoplas: 'jednokierunkowy', skew: 'nieocenione', sluch: 'symetryczny', chod: 'chodziBezPodparcia', wiarygodnosc: 'wiarygodne' })) A('ustawSkladowaHints')(k, v);
A('pokazWynikHints')();
T('D3/nieocenione-nie-uspokaja', /data-hw-wniosek="niepelne"/.test(app()), 'jedna nieoceniona skladowa trzonu musi wykluczyc wynik obwodowy');
T('D4/i-mowi-to-wprost', /Brak oceny NIE jest wynikiem prawidłowym/.test(tekst()), 'ekran musi powiedziec, ze brak oceny nie jest wynikiem prawidlowym');
T('D5/nieocenione-wymienione', /Nie oceniono/.test(tekst()) && /Test naprzemiennego zasłaniania/.test(tekst()),
  'nieoceniona skladowa musi byc wymieniona z nazwy, a nie przemilczana');
// KONTROLA CZULOSCI: ta sama sciezka z ocenionym skew daje wynik obwodowy.
czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')();
for (const [k, v] of Object.entries({ hit: 'sakadaP', oczoplas: 'jednokierunkowy', skew: 'brakOdchylenia', sluch: 'symetryczny', chod: 'chodziBezPodparcia', wiarygodnosc: 'wiarygodne' })) A('ustawSkladowaHints')(k, v);
A('pokazWynikHints')();
T('D6/czulosc-pelny-trzon', /data-hw-wniosek="obwodowy"/.test(app()), 'kontrola: komplet obwodowy musi dac wynik obwodowy');
T('D7/i-nie-jest-wykluczeniem', /nie rozpoznanie i nie wykluczenie udaru/.test(tekst()),
  'wynik obwodowy musi jawnie odmowic bycia wykluczeniem udaru');

/* ═══════════ E. KRYTERIUM ODBIORU NR 3 — OSTRZEŻENIE ═══════════ */
const zAlarmem = (podmiana) => {
  czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')();
  const pelny = { hit: 'sakadaP', oczoplas: 'jednokierunkowy', skew: 'brakOdchylenia', sluch: 'symetryczny', chod: 'chodziBezPodparcia', wiarygodnosc: 'wiarygodne', ...podmiana };
  for (const [k, v] of Object.entries(pelny)) A('ustawSkladowaHints')(k, v);
  A('pokazWynikHints')();
};
zAlarmem({ skew: 'obecne' });
T('E1/ostrzezenie-jest', /data-hw-ostrzezenie="1"/.test(app()), 'cecha alarmowa musi dac ostrzezenie na ekranie');
T('E2/ostrzezenie-nad-wnioskiem', app().indexOf('data-hw-ostrzezenie') < app().indexOf('data-hw-wniosek'),
  '„wyrazne" znaczy NAD wnioskiem, a nie w stopce');
T('E3/rola-alert', /role="alert"/.test(app()), 'ostrzezenie musi byc oznaczone dla czytnika ekranu');
T('E4/wymienia-ceche', /Test naprzemiennego zasłaniania/.test(tekst()), 'ostrzezenie musi nazwac ceche, ktora je wywolala');
T('E5/mowi-o-MRI', /MRI/.test(tekst()) && /dyfuzją/.test(tekst()), 'ostrzezenie musi wskazac wlasciwe badanie obrazowe');
T('E6/odradza-tomografie', /tomografia komputerowa NIE nadaje/i.test(tekst()), 'ostrzezenie musi odradzic tomografie');
zAlarmem({ hit: 'brakSakady' });
T('E7/alarm-HIT', /data-hw-ostrzezenie="1"/.test(app()), 'prawidlowy HIT przy oczoplasie to cecha alarmowa');
zAlarmem({ chod: 'nieStoiBezPodparcia' });
T('E8/alarm-chod', /data-hw-ostrzezenie="1"/.test(app()), 'niemoznosc chodzenia bez podparcia to cecha alarmowa');
zAlarmem({ sluch: 'nowyJednostronny' });
T('E9/alarm-sluch', /data-hw-ostrzezenie="1"/.test(app()), 'nowy jednostronny niedoslych to cecha alarmowa (HINTS+)');
zAlarmem({ oczoplas: 'zmiennyKierunkowo' });
T('E10/alarm-oczoplas', /data-hw-ostrzezenie="1"/.test(app()), 'oczoplas zmienny kierunkowo to cecha alarmowa');
// SPRZEZENIE: prawidlowy HIT BEZ oczoplasu NIE jest alarmem — i ekran mowi dlaczego.
zAlarmem({ hit: 'brakSakady', oczoplas: 'bezOczoplasu' });
T('E11/HIT-bez-oczoplasu-nie-alarmuje', !/data-hw-ostrzezenie="1"/.test(app()), 'prawidlowy HIT bez oczoplasu nie jest cecha alarmowa');
T('E12/i-podaje-powod', /tylko przy obecnym oczopląsie samoistnym/.test(tekst()), 'ekran musi powiedziec, dlaczego ta obserwacja nic nie znaczy');
T('E13/wniosek-nieinformatywny', /data-hw-wniosek="nieinformatywne"/.test(app()), 'brak oczoplasu znaczy, ze HINTS nie ma tu zastosowania');
// KONTROLA CZULOSCI: bez cech alarmowych ostrzezenia NIE MA.
zAlarmem({});
T('E14/czulosc-bez-alarmu', !/data-hw-ostrzezenie="1"/.test(app()), 'kontrola: bez cech alarmowych ostrzezenia byc nie moze');
T('E15/ale-nie-uspokaja', /To NIE jest wykluczenie przyczyny ośrodkowej/.test(tekst()),
  'pusta lista cech alarmowych nie ma prawa czytac sie jako wykluczenie');
// ASYMETRIA: niewiarygodnosc nie kasuje alarmu, ale odbiera uspokojenie.
zAlarmem({ skew: 'obecne', wiarygodnosc: 'niewiarygodne' });
T('E16/alarm-przezywa-niewiarygodnosc', /data-hw-wniosek="alarm"/.test(app()), 'badanie niewiarygodne nie kasuje cechy alarmowej');
T('E17/zastrzezenie-widoczne', /Zastrzeżenia do tego wyniku/.test(tekst()), 'zastrzezenia musza byc wymienione');

/* ═══════════ F. WYNIK JEST OSOBNYM EKRANEM ═══════════
   Dokument (telefon): „Podsumowanie jest oddzielnym ekranem, aby nie mieszać go z wykonywaniem
   testu". Bramka czyta to dosłownie: na ekranie wyniku nie ma ANI JEDNEGO przycisku odpowiedzi. */
zAlarmem({});
eq('F1/osobny-ekran', st.screen, 'hintsWyn');
T('F2/bez-przyciskow-odpowiedzi', !/class="hxopcja/.test(app()), 'ekran wyniku nie miesza sie z wykonywaniem testu');
T('F3/bez-osi-skladowych', !/onclick="goHintsKrok\(/.test(app()), 'os skladowych nalezy do ekranu badania');
T('F4/powrot-do-badania', /wrocDoBadaniaHints\(\)/.test(app()), 'z wyniku musi byc droga powrotna do badania');
A('wrocDoBadaniaHints')();
eq('F5/powrot-dziala', st.screen, 'hintsBad');
A('pokazWynikHints')(); A('wyczyscBadanieHints')();
eq('F6/wyczyszczenie-wraca-do-badania', st.screen, 'hintsBad');
eq('F6b/i-czysci-odpowiedzi', Object.keys(st.hintsBadanie).length, 0);
// Wynik bez zadnej odpowiedzi mowi wprost, ze badania nie wykonano.
czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')(); A('pokazWynikHints')();
T('F7/niewykonane-nazwane', /data-hw-wniosek="niewykonane"/.test(app()), 'brak odpowiedzi musi byc nazwany, a nie pokazany jako wynik');

/* ═══════════ G. TABELA I DYNAMICZNE PODSUMOWANIE (uklad „komputer") ═══════════ */
czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')();
T('G1/tabela-skladowych', /class="hxtab"/.test(app()), 'ekran badania ma tabele wszystkich skladowych');
T('G2/szesc-wierszy', (app().match(/<tr class="hxw--/g) || []).length === 6, 'tabela ma wiersz na kazda skladowa');
T('G3/dynamiczne-podsumowanie', /class="hxdyn/.test(app()), 'tabela ma dynamiczne podsumowanie');
T('G4/postep-w-podsumowaniu', /Zaznaczono 0 z 6 składowych/.test(tekst()), 'podsumowanie mowi, ile zaznaczono');
A('ustawSkladowaHints')('hit', 'sakadaP');
T('G5/podsumowanie-nadaza', /Zaznaczono 1 z 6 składowych/.test(tekst()), 'podsumowanie musi nadazac za odpowiedziami');
T('G6/rola-w-tabeli', /wspiera obwód/.test(tekst()), 'tabela mowi, jaka role gra zaznaczona odpowiedz');
T('G7/trzon-oznaczony', (app().match(/class="hxtrzon"/g) || []).length === 3, 'trzy skladowe wlasciwego HINTS musza byc oznaczone');

/* ═══════════ H. PASEK PRZEBIEGU I POLA TEKSTOWE ═══════════
   Pasek szesciu krokow opisuje sciezke BPPV. Nad HINTS mowilby, ze uzytkownik jest w srodku
   innego badania — ta sama zasada, ktora Blok 5 zapisal dla ekranu symulatora. */
const EKRANY = [
  ['hintsKwal', () => { czysty(); A('goHintsKwal')(); }],
  ['hintsBad', () => { czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')(); }],
  ['hintsWyn', () => { czysty(); A('goHintsKwal')(); potwierdz(); A('zacznijBadanieHints')(); A('pokazWynikHints')(); }],
];
{
  const WZORZEC_POLA = /<\s*(?:input|textarea)|contenteditable|type\s*=\s*["']text/i;
  let zPaskiem = [], zPolami = [], zlyTryb = [];
  for (const [nazwa, idz] of EKRANY) {
    idz(); A('syncShell')();
    const flow = win.document.getElementById('flowbar');
    if (flow && !flow.hidden) zPaskiem.push(nazwa);
    if (WZORZEC_POLA.test(app())) zPolami.push(nazwa);
    if (st.mode !== 'hints') zlyTryb.push(nazwa);
  }
  T('H1/bez-paska-przebiegu', !zPaskiem.length, `pasek przebiegu BPPV pokazal sie nad HINTS: ${zPaskiem}`);
  T('H2/bez-pol-tekstowych', !zPolami.length, `ekran HINTS z polem tekstowym: ${zPolami}`);
  T('H3/tryb-hints', !zlyTryb.length, `ekran HINTS w zlym trybie (pasek przebiegu bramkuje po mode): ${zlyTryb}`);
  // KONTROLA CZULOSCI: nad sciezka BPPV pasek MUSI byc widoczny.
  czysty(); A('openTest')('dix'); A('syncShell')();
  const flow = win.document.getElementById('flowbar');
  T('H4/czulosc-pasek-nad-BPPV', !!flow && !flow.hidden, 'kontrola: nad sciezka BPPV pasek przebiegu musi byc widoczny');
  T('H5/czulosc-wzorzec-pol', WZORZEC_POLA.test('<input type="text">'), 'kontrola: wzorzec pola tekstowego musi trafiac');
}

/* ═══════════ I. JĘZYK ═══════════
   Napisy MUSZA isc przez t(): twardy polski na ekranie zostawal po polsku po przelaczeniu na EN.
   Ta klasa wycieku wystapila w projekcie przy przelaczniku 3D i przy karcie kontroli. */
{
  st.lang = 'en';
  let poPolsku = [];
  for (const [nazwa, idz] of EKRANY) {
    idz();
    if (/Nie można ocenić|Rozpocznij badanie|Czego ten element/.test(tekst())) poPolsku.push(nazwa);
  }
  T('I1/EN-bez-polskich-napisow', !poPolsku.length, `ekran z twardym polskim napisem: ${poPolsku}`);
  EKRANY[1][1]();
  T('I2/EN-instrukcja', /Ask the patient to look at your nose/.test(tekst()), 'instrukcja musi byc przetlumaczona');
  EKRANY[0][1]();
  T('I3/EN-kwalifikacja', /HINTS \/ HINTS\+ — qualification/.test(tekst()), 'naglowek kwalifikacji musi byc przetlumaczony');
  st.lang = 'pl';
}

/* ═══════════ J. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 102;
if (bledy.length) {
  console.error(`✗ hints:dom — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ hints:dom — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli to swiadoma zmiana zakresu, popraw OCZEKIWANE. Jesli nie — ktorys przypadek zniknal.');
  process.exit(1);
}
console.log(`✓ hints:dom — ${ok} przypadkow, ekrany i akcje HINTS zgodne.`);
