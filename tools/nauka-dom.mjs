/* OTOREPO — wyrocznia EKRANÓW TRYBU NAUKI (Blok 13). jsdom, PRAWDZIWY graf modułów.
 *
 * Wszystkie trzy kryteria odbioru, które ta wyrocznia bada, są twierdzeniami o TYM, CO ROBI
 * APLIKACJA, a nie o modelu:
 *   K1 — odpowiedź nie istnieje w `#app` przed decyzją (nie jest ukryta CSS-em — jej NIE MA);
 *   K2 — postęp przeżywa zamknięcie karty (zapis do pamięci przeglądarki i odczyt na boocie);
 *   K5 — rozwiązanie CAŁEGO przypadku nie zmienia ANI JEDNEGO pola opisującego pacjenta.
 * K3 (brak poziomego przewijania) wymaga silnika układu, którego jsdom nie ma — mierzymy go
 * w przeglądarce i zapisujemy pomiar w dokumentacji bloku.
 *
 * Uruchomienie: npm run nauka:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';
import { BIBLIOTEKA, ETAP_IDS, ETAPY_PYTAJACE, przypadek, opcjeEtapu, werdyktyEtapu, kluczPrzypadku } from '../src/app/nauka-model.js';
import { naukaDeps } from '../src/app/nauka-deps.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

/* ── Boot aplikacji w jsdom: bundel esbuild wstrzyknięty jako klasyczny <script>, dokładnie tak
   samo jak w wyroczniach Bloków 9-12. Import ESM w realm Node nie zadziała, bo `navigator`
   jest tam getterem — a i tak badalibyśmy wtedy INNY graf niż ten, który ładuje przeglądarka. ── */
const { outputFiles } = await esbuild({
  entryPoints: [resolve(ROOT, 'src/main.js')], bundle: true, format: 'iife',
  write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
});
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String((e && (e.detail && e.detail.message || e.message)) || e)));
const dom = new JSDOM(readFileSync(resolve(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8777/', virtualConsole: vc });
const win = dom.window;
win.requestAnimationFrame = () => 0;
win.cancelAnimationFrame = () => {};
{ const s = win.document.createElement('script'); s.textContent = outputFiles[0].text; win.document.body.appendChild(s); }

const H = win.__OTOREPO_TEST__;
const POTRZEBNE = ['state', 'render', 'goArea', 'goNauka', 'otworzPrzypadek', 'wrocDoBiblioteki',
  'ustawFiltrNauki', 'goEtapNauki', 'odpowiedzNauki', 'wskazowkaNauki', 'zakonczPrzypadek',
  'wyczyscPostepNauki', 'openTest', 'setDiagSide', 'setVariant', 'goObs', 'setObsPole', 'setTriage'];
const brak = POTRZEBNE.filter(n => !H || typeof H[n] === 'undefined');
if (errs.length || brak.length) {
  console.error('✗ BLAD LADOWANIA — wyrocznia niewazna.');
  if (errs.length) console.error('  loadErrors   :', errs.slice(0, 5));
  if (brak.length) console.error('  brak uchwytu :', brak);
  process.exit(1);
}
const app = () => win.document.getElementById('app').innerHTML;
const st = H.state;
st.lang = 'pl';

T('A0/uchwyt', !!H.goNauka && !!H.otworzPrzypadek && !!H.odpowiedzNauki,
  'tryb nauki musi być sterowalny z testu — inaczej nie jest przypięty żadną wyrocznią');

/* ═══════════ A. OBSZAR „NAUKA" PRZESTAŁ BYĆ ZAŚLEPKĄ ═══════════ */
{
  H.goArea('learn');
  eq('A1/obszar', st.area, 'learn');
  eq('A2/ekran', st.screen, 'naukaBib');
  T('A3/app-widoczny', !win.document.getElementById('app').hidden, '#app nie ma prawa być schowany — złoty wzorzec czyta tylko jego');
  T('A4/stub-schowany', win.document.getElementById('stubview').hidden, 'zaślepka ma zniknąć');
  T('A5/lista-jest', /data-nlista/.test(app()), 'biblioteka musi wypisać listę przypadków');
  const kafle = (app().match(/data-nprz="/g) || []).length;
  eq('A6/wszystkie-przypadki', kafle, BIBLIOTEKA.length);
  T('A7/postep-widoczny', /data-npostep/.test(app()), 'karta postępu musi być na ekranie');
  // A8: filtr zawęża listę i jest odwracalny.
  H.ustawFiltrNauki('rodzaj', 'osrodkowy');
  const poFiltrze = (app().match(/data-nprz="/g) || []).length;
  T('A8a/filtr-zawezal', poFiltrze < BIBLIOTEKA.length && poFiltrze > 0, `filtr dał ${poFiltrze} przypadków`);
  H.ustawFiltrNauki('rodzaj', 'osrodkowy');
  eq('A8b/filtr-odwracalny', (app().match(/data-nprz="/g) || []).length, BIBLIOTEKA.length);
}

/* ═══════════ B. KRYTERIUM ODBIORU NR 1 — ODPOWIEDZI NIE MA W DOM PRZED DECYZJĄ ═══════════
   Nie „jest ukryta". NIE MA JEJ. Sprawdzamy to dwoma niezależnymi pomiarami: brakiem karty
   informacji zwrotnej ORAZ nieobecnością NAPISU poprawnej odpowiedzi w całym `#app`. */
{
  const p = przypadek('pc-p-klasyk');
  H.otworzPrzypadek(p.id);
  eq('B1/ekran-lekcji', st.screen, 'naukaLekcja');
  eq('B2/etap-startowy', st.naukaEtap, 'opis');
  T('B3/opis-bez-pytania', !/data-netap=/.test(app()), 'etap „opis" nie zadaje pytania');

  // Zapis obserwacji ZASŁONIĘTY, dopóki nie padło przewidywanie.
  T('B4/zaslona', /data-nzaslona="1"/.test(app()), 'zapis obserwacji musi być zasłonięty przed przewidywaniem');
  T('B5/brak-zapisu', !/Zapis obserwacji<\/h4>\s*<table/.test(app()), 'tabela zapisu nie ma prawa istnieć przed przewidywaniem');

  H.goEtapNauki('przewidywanie');
  T('B6/pytanie-jest', /data-netap="przewidywanie"/.test(app()), 'etap przewidywania musi zadać pytanie');
  T('B7/brak-feedbacku', !/id="naukaFeedback"/.test(app()), 'informacja zwrotna nie ma prawa istnieć przed decyzją');
  T('B8/brak-werdyktu', !/data-nwerdykt=/.test(app()), 'werdyktu nie ma prawa być w DOM przed decyzją');

  // Wskazówka ODSŁANIA, ale nie odpowiada.
  H.wskazowkaNauki('przewidywanie');
  T('B9/wskazowka-jest', /data-nwskazowka="1"/.test(app()), 'wskazówka musi się pokazać');
  T('B10/wskazowka-bez-werdyktu', !/data-nwerdykt=/.test(app()), 'wskazówka nie ma prawa odsłonić werdyktu');
  T('B11/wskazowka-bez-zapisu', /data-nzaslona="1"/.test(app()), 'wskazówka nie ma prawa odsłonić zapisu obserwacji');

  // Dopiero decyzja.
  const d = naukaDeps(p);
  const k = kluczPrzypadku(p, d);
  H.odpowiedzNauki('przewidywanie', k.obserwowany);
  T('B12/feedback-po-decyzji', /id="naukaFeedback"/.test(app()), 'po decyzji informacja zwrotna musi się pojawić');
  T('B13/werdykt-trafna', /data-nwerdykt="trafna"/.test(app()), 'poprawne przewidywanie musi dać werdykt trafny');
  T('B14/zapis-odsloniety', !/data-nzaslona="1"/.test(app()) && /nzapis__t/.test(app()), 'po przewidywaniu zapis obserwacji musi się odsłonić');
}

/* ═══════════ C. ODPOWIEDŹ RAZ UDZIELONA JEST ZAMROŻONA ═══════════
   Bez tego „decyzja przed odsłonięciem odpowiedzi" byłaby fikcją: wystarczyłoby kliknąć
   cokolwiek, przeczytać werdykt i poprawić. */
{
  const p = przypadek('pc-p-klasyk');
  H.otworzPrzypadek(p.id);
  H.goEtapNauki('przewidywanie');
  const d = naukaDeps(p), k = kluczPrzypadku(p, d);
  const zle = opcjeEtapu('przewidywanie', p, d).find(o => werdyktyEtapu('przewidywanie', p, d, k)[o.v].werdykt === 'bledna');
  H.odpowiedzNauki('przewidywanie', zle.v);
  eq('C1/pierwsza-przyjeta', st.naukaOdp.przewidywanie, zle.v);
  T('C2/werdykt-bledny', /data-nwerdykt="bledna"/.test(app()), 'błędna odpowiedź musi dać werdykt błędny');
  H.odpowiedzNauki('przewidywanie', k.obserwowany);
  eq('C3/nie-podmieniona', st.naukaOdp.przewidywanie, zle.v);
  T('C4/odmowa-widoczna', /nodmowa/.test(app()), 'odmowa musi być widoczna — ekran ma powiedzieć, że nie przyjął');
  T('C5/opcje-zablokowane', /class="nopcja[^"]*" aria-pressed="[^"]*" disabled/.test(app()) || /disabled aria-disabled="true"/.test(app()),
    'po odpowiedzi opcje muszą być zablokowane');
}

/* ═══════════ D. SZEŚĆ ETAPÓW, TRZY BLOKI WYJAŚNIENIA ═══════════ */
{
  const p = przypadek('hc-geo-p');
  H.otworzPrzypadek(p.id);
  const os = (app().match(/class="netap[ "]/g) || []).length;
  eq('D1/os-szesc-etapow', os, ETAP_IDS.length);
  // Nie da się przeskoczyć do etapu, którego poprzednik nie ma odpowiedzi.
  H.goEtapNauki('manewr');
  T('D2/bez-przeskoku', st.naukaEtap !== 'manewr', 'nie wolno przeskoczyć do etapu bez odpowiedzi na wcześniejsze');
  const d = naukaDeps(p), k = kluczPrzypadku(p, d);
  H.goEtapNauki('przewidywanie'); H.odpowiedzNauki('przewidywanie', k.obserwowany);
  // Trzy bloki wyjaśnienia: Dlaczego / Pułapka / Co dalej.
  const det = (app().match(/class="ndet"/g) || []).length + (app().match(/class="ndet" open/g) || []).length;
  T('D3/trzy-bloki', det >= 3, `oczekiwano trzech bloków wyjaśnienia, jest ${det}`);
  T('D4/dlaczego', /Dlaczego|Why/.test(app()), 'blok „Dlaczego" musi istnieć');
  T('D5/pulapka', /Pułapka|The trap/.test(app()), 'blok „Pułapka" musi istnieć');
  T('D6/co-dalej', /Co dalej|What next/.test(app()), 'blok „Co dalej" musi istnieć');
}

/* ═══════════ E. KRYTERIUM ODBIORU NR 4 NA EKRANIE ═══════════ */
{
  const p = przypadek('pc-bez-dynamiki');
  H.otworzPrzypadek(p.id);
  const d = naukaDeps(p), k = kluczPrzypadku(p, d);
  H.goEtapNauki('przewidywanie'); H.odpowiedzNauki('przewidywanie', k.obserwowany);
  H.goEtapNauki('rozpoznanie'); H.odpowiedzNauki('rozpoznanie', 'posterior:P');
  H.goEtapNauki('mechanizm'); H.odpowiedzNauki('mechanizm', 'canalo');
  T('E1/niejednoznacznosc-nazwana', /data-nniejedn="1"/.test(app()),
    'przy etapie, na którym model nie zna jedynej odpowiedzi, ekran MUSI to powiedzieć');
  T('E2/dopuszczalna-nie-bledna', /data-nwerdykt="dopuszczalna"/.test(app()),
    'obronna odpowiedź nie ma prawa dostać werdyktu błędnego');
}

/* ═══════════ F. WYNIK PRZYPADKU I ZAPIS POSTĘPU (kryterium odbioru nr 2) ═══════════ */
{
  win.localStorage.clear();
  H.wyczyscPostepNauki();
  const p = przypadek('pc-p-klasyk');
  H.otworzPrzypadek(p.id);
  const d = naukaDeps(p), k = kluczPrzypadku(p, d);
  const dobre = { przewidywanie: k.obserwowany, rozpoznanie: 'posterior:P', mechanizm: 'canalo', manewr: 'epley', kontrola: 'zakonczSesje' };
  for (const e of ETAPY_PYTAJACE) { H.goEtapNauki(e); H.odpowiedzNauki(e, dobre[e]); }
  T('F1/wynik-na-ekranie', /data-nocena="rozwiazany"/.test(app()), 'po komplecie odpowiedzi ekran musi pokazać wynik przypadku');
  T('F2/wynik-nie-liczba', !/\d+\s*%/.test(app()), 'wynik przypadku nie ma prawa być procentem');
  H.zakonczPrzypadek();
  eq('F3/powrot-do-biblioteki', st.screen, 'naukaBib');
  eq('F4/postep-w-stanie', st.naukaPostep['pc-p-klasyk'].ocena, 'rozwiazany');
  /* Zapis PRZEŻYWA zamknięcie karty. Czytamy PRAWDZIWE bajty zapisane przez aplikację w jej
     własnym realm — `wczytajPostep()` zaimportowane w Node widzi INNY `localStorage`, więc
     badałoby swój własny zapis zamiast zapisu aplikacji. */
  const surowe = win.localStorage.getItem('otorepo_nauka_postep') || '';
  const zPamieci = JSON.parse(surowe || '{}');
  eq('F5/postep-w-pamieci', ((zPamieci.wpisy || {})['pc-p-klasyk'] || {}).ocena, 'rozwiazany');
  T('F6/pamiec-bez-pacjenta', !/pacjent|patient|imie|name/i.test(surowe),
    'zapis postępu nie ma prawa nieść czegokolwiek o pacjencie');
  T('F7/pamiec-bez-zegara', !/\d{13}|\d{4}-\d{2}-\d{2}/.test(surowe),
    'zapis postępu nie ma prawa nieść zegara');
  // Uszkodzona pamięć nie wywraca aplikacji — sprawdzamy ŚCIEŻKĄ BOOTU, nie kopią czytnika.
  win.localStorage.setItem('otorepo_nauka_postep', '{to nie jest JSON');
  H.wczytajPostepNauki();
  eq('F8/uszkodzona-pamiec', Object.keys(st.naukaPostep).length, 0);
  win.localStorage.setItem('otorepo_nauka_postep', JSON.stringify({ wersja: 999, wpisy: { x: {} } }));
  H.wczytajPostepNauki();
  eq('F9/zla-wersja', Object.keys(st.naukaPostep).length, 0);
  // Kasowanie postępu działa i jest widoczne.
  win.localStorage.clear(); H.wyczyscPostepNauki();
  eq('F10/postep-skasowany', Object.keys(st.naukaPostep).length, 0);
}

/* ═══════════ G. ROZDZIAŁ TORÓW — LEKCJA NIE DOTYKA PACJENTA (K5) ═══════════
   Odcisk WSZYSTKICH pól opisujących pacjenta, wzięty przed lekcją i po niej. Obejmuje
   `decisionSeq` i `obsOdciski`, bo to właśnie te dwa pola cicho psuje każda mitygacja typu
   „zapisz stan, uruchom lekcję, przywróć". */
{
  /* `mode`, `screen` i `area` to NAWIGACJA, nie dane pacjenta: zmienia je KAŻDE przejście między
     obszarami, także te sprzed Bloku 13. Odcisk obejmuje wyłącznie pola opisujące PACJENTA
     i jego sesję — łącznie z `decisionSeq` i `obsOdciski`, bo to właśnie te dwa pola cicho
     psuje każda mitygacja typu „zapisz stan, uruchom lekcję, przywróć". */
  const POLA_PACJENTA = ['side', 'canal', 'maneuverKey', 'testKey', 'variant', 'dixObs', 'dixRep',
    'diagCentral', 'size', 'plan', 'step', 'total', 'elapsedMs', 'running', 'zegar', 'ukryteOd', 'luka',
    'trybCzasu', 'sideZrodlo', 'variantZrodlo', 'obs', 'obsOdciski', 'obsGrupa', 'triage', 'triageStep',
    'kontrole', 'kontrolaPowod', 'decisionSeq', 'flow', 'hintsBadanie', 'hintsPominiecie', 'hintsPrzeszkolenie'];
  const odcisk = () => JSON.stringify(POLA_PACJENTA.map(k => [k, st[k]]));

  // Ustawiamy pacjenta w stan NIEZEROWY — inaczej test przechodziłby przez przypadek.
  H.goArea('diag');
  H.openTest('dix'); H.setDiagSide('L'); H.setVariant('cupulo');
  H.goObs(); H.setObsPole('pion#jedyna', 'm1'); H.setObsPole('torsja#jedyna', 'm1');
  H.setTriage('przebieg', 'napadowe'); H.setTriage('wyzwalacz', 'pozycyjny');
  const przed = odcisk();
  T('G1/pacjent-niezerowy', /"variant","cupulo"/.test(przed) && /"side","L"/.test(przed),
    'kontrola: pacjent musi mieć niezerowy stan, inaczej test niczego nie dowodzi');

  // Cała lekcja: inny kanał, inna strona, inny mechanizm niż u pacjenta.
  H.goArea('learn');
  const p = przypadek('hc-apo-p');
  H.otworzPrzypadek(p.id);
  const d = naukaDeps(p), k = kluczPrzypadku(p, d);
  const odp = { przewidywanie: k.obserwowany, rozpoznanie: 'horizontal:P', mechanizm: 'cupulo', manewr: 'gufoniApo', kontrola: 'ponownaInterpretacja' };
  for (const e of ETAPY_PYTAJACE) { H.goEtapNauki(e); H.odpowiedzNauki(e, odp[e]); }
  H.wskazowkaNauki('manewr');
  H.zakonczPrzypadek();
  const po = odcisk();
  T('G2/pacjent-nietkniety', przed === po, 'rozwiązanie przypadku ZMIENIŁO stan pacjenta');
  // G3: kierunek odwrotny — sesja pacjenta nie ma prawa zmienić treści lekcji.
  const kluczWLekcji = JSON.stringify(kluczPrzypadku(p, naukaDeps(p)));
  st.side = 'P'; st.variant = 'canalo'; st.diagCentral = true;
  eq('G3/lekcja-odporna', JSON.stringify(kluczPrzypadku(p, naukaDeps(p))), kluczWLekcji);
  st.diagCentral = false;
}

/* ═══════════ H. JĘZYK ═══════════ */
{
  H.goArea('learn');
  const pl = app();
  st.lang = 'en'; H.render();
  const en = app();
  T('H1/inny-jezyk', pl !== en, 'przełączenie języka musi zmienić treść ekranu nauki');
  T('H2/en-bez-polskiego', !/Poziom|Rodzaj|Postęp/.test(en), 'ekran EN nie ma prawa nieść polskich napisów');
  T('H3/pl-po-polsku', /Postęp|Poziom/.test(pl), 'ekran PL musi być po polsku');
  st.lang = 'pl'; H.render();
  // H4: ani jednego pola tekstowego w całym torze nauki — wpisanie danych pacjenta ma być
  // strukturalnie niemożliwe, tak samo jak w Bloku 12.
  const p = przypadek('downbeat-staly');
  H.otworzPrzypadek(p.id);
  let pola = 0;
  for (const e of ['opis', ...ETAPY_PYTAJACE]) { H.goEtapNauki(e); pola += (app().match(/<input|<textarea|contenteditable/gi) || []).length; }
  eq('H4/bez-pol-tekstowych', pola, 0);
}

/* ═══════════ I. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 54;
if (bledy.length) {
  console.error(`✗ nauka:dom — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ nauka:dom — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  process.exit(1);
}
console.log(`✓ nauka:dom — ${ok} przypadkow, ekrany i akcje nauki zgodne.`);
