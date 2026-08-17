/* OTOREPO — wyrocznia EKRANÓW LABORATORIUM (Blok 14). jsdom, PRAWDZIWY graf modułów.
 *
 * Kryterium odbioru nr 1 („Laboratorium nie jest potrzebne do zakończenia podstawowej
 * diagnostyki") mierzymy DWOMA niezależnymi sposobami, bo ręczna lista ekranów zawsze się
 * zestarzeje:
 *   1. pełny przebieg kliniczny wywiad → kontrola przechodzi bez wejścia do Laboratorium,
 *   2. cały eksperyment — otwarcie, suwaki, drugie stanowisko, porównanie, reset — nie zmienia
 *      ANI JEDNEGO pola opisującego pacjenta ANI JEDNEGO pola symulatora HINTS.
 * Drugi pomiar jest mocniejszy od listy ekranów: nie da się go obejść, dokładając nową kontrolkę.
 *
 * Uruchomienie: npm run lab:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';
import { EKSPERYMENTY, PARAMETRY, POLA_ZAKAZANE_W_LAB, STANOWISKO_IDS } from '../src/app/lab-model.js';
import { POLA_LAB } from '../src/app/lab-state.js';

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
vc.on('jsdomError', e => errs.push(String((e && (e.detail && e.detail.message || e.message)) || e)));
const dom = new JSDOM(readFileSync(resolve(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8777/', virtualConsole: vc });
const win = dom.window;
win.requestAnimationFrame = () => 0; win.cancelAnimationFrame = () => {};
{ const s = win.document.createElement('script'); s.textContent = outputFiles[0].text; win.document.body.appendChild(s); }

const H = win.__OTOREPO_TEST__;
const POTRZEBNE = ['state', 'render', 'goArea', 'goLab', 'otworzEksperymentLab', 'wrocDoEksperymentow',
  'ustawStanowiskoLab', 'przelaczPorownanieLab', 'ustawParametrLab', 'resetLab', 'opisParametruLab',
  'openTriage', 'setTriage', 'toggleTriageFlaga', 'openTest', 'setDiagSide', 'goObs', 'setObsPole',
  'setDixObs', 'goInterpret', 'startManeuver', 'goKontrola', 'ustawWynikKontroli'];
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

/* ═══════════ A. OBSZAR „LABORATORIUM" MA WŁASNY EKRAN ═══════════ */
{
  H.goArea('lab');
  eq('A1/obszar', st.area, 'lab');
  eq('A2/ekran', st.screen, 'labLista');
  T('A3/lista', /data-llista/.test(app()), 'lista eksperymentów musi być na ekranie');
  const kafle = (app().match(/data-leks="/g) || []).length;
  eq('A4/wszystkie-eksperymenty', kafle, EKSPERYMENTY.length);
  // A5: obszar Laboratorium NIE wchodzi do modułu HINTS — gwarancja Bloku 12 wzmocniona.
  T('A5/nie-hints', !['hints', 'hintsKwal', 'hintsBad', 'hintsWyn'].includes(st.screen),
    `obszar Laboratorium wszedl do modulu HINTS (screen=${st.screen})`);
}

/* ═══════════ B. KRYTERIUM ODBIORU NR 2 — JEDNOSTKA I ZAKRES NA EKRANIE ═══════════ */
{
  H.otworzEksperymentLab('jednostronny');
  eq('B1/ekran', st.screen, 'labEksp');
  T('B2/panel-parametrow', /data-lparams/.test(app()), 'panel parametrów musi być stale widoczny');
  const e = EKSPERYMENTY.find(x => x.id === 'jednostronny');
  for (const k of e.parametry) T(`B3/suwak/${k}`, app().includes(`data-lparam="${k}"`), `brak parametru ${k} na ekranie`);
  // Opis jest ZWINIĘTY, dopóki nikt o niego nie poprosi — ale MUSI dać się rozwinąć.
  T('B4/opis-zwiniety', !/data-lopis=/.test(app()), 'opis parametru nie ma być rozwinięty domyślnie');
  H.opisParametruLab('gainR');
  T('B5/opis-rozwiniety', /data-lopis="gainR"/.test(app()), 'dotknięcie nazwy musi rozwinąć opis');
  T('B6/jednostka', /data-ljedn/.test(app()), 'opis musi zawierać jednostkę');
  T('B7/zakres', /data-lzakres/.test(app()), 'opis musi zawierać zakres');
  T('B8/granica', /data-lgranica="1"/.test(app()), 'parametr ze zmierzoną granicą modelu musi ją pokazać');
  H.opisParametruLab('gainR');
  T('B9/opis-zwija', !/data-lopis="gainR"/.test(app()), 'ponowne dotknięcie musi zwinąć opis');
}

/* ═══════════ C. KRYTERIUM ODBIORU NR 3 — POMIAR SKUTKU NA EKRANIE ═══════════ */
{
  H.otworzEksperymentLab('jednostronny');
  T('C1/pusty-na-starcie', /data-lskutek="0"/.test(app()), 'przed pierwszą zmianą nie ma czego mierzyć');
  H.ustawParametrLab('gainR', '0.3');
  T('C2/pomiar-jest', /data-lskutek="1"/.test(app()), 'po zmianie parametru musi pojawić się pomiar');
  T('C3/obserwabla', /data-lobs="vhit"/.test(app()), 'zmiana wzmocnienia musi wskazać vHIT jako zmienione badanie');
  /* C4: zdania opisu zmieniamy tam, gdzie NAPRAWDĘ się zmieniają. Pierwsza wersja żądała tego
     po zmianie wzmocnienia w scenariuszu neuronitis — a tam vHIT był patologiczny JUŻ PRZED
     zmianą, więc zdanie zostawało to samo. Bramka mierzyła moje oczekiwanie, nie model. */
  H.otworzEksperymentLab('trzecieOkno');
  H.ustawParametrLab('dehiscence', 'P');
  T('C4/zdania', /Pojawiło się w opisie|Zniknęło z opisu/.test(app()), 'pomiar musi pokazać zmianę zdań opisu badania');
  // C5: brak skutku jest NAZWANY, a nie przemilczany.
  H.otworzEksperymentLab('trzecieOkno');
  H.ustawParametrLab('otrTorsion', '10');
  const bezSkutku = /data-lbezskutku="1"/.test(app());
  if (bezSkutku) T('C5/brak-skutku-nazwany', /nie zmieniło się nic/.test(app()), 'brak skutku musi być nazwany wprost');
  else T('C5/skutek-jest', /data-lskutek="1"/.test(app()), 'pomiar musi istnieć');
  // C6: reset kasuje pomiar i wraca do referencji.
  H.otworzEksperymentLab('jednostronny');
  H.ustawParametrLab('gainR', '0.3');
  T('C6a/odchylenie-widoczne', /data-lodch="gainR"/.test(app()), 'odchylenie od referencji musi być wypisane');
  H.resetLab();
  T('C6b/po-resecie-brak', /data-lodch-brak="1"/.test(app()), 'po resecie stanowisko stoi na referencji');
  T('C6c/pomiar-skasowany', /data-lskutek="0"/.test(app()), 'reset kasuje pomiar ostatniej zmiany');
}

/* ═══════════ D. LABORATORIUM NIE JEST KARTĄ ROZPOZNANIA ═══════════
   `clinicalReadout` liczy `verdict` i `localization`. W ścieżce klinicznej mają sens; tutaj są
   echem wejścia, bo patologię ustawia użytkownik. Ekran nie ma prawa ich pokazać. */
{
  H.otworzEksperymentLab('osrodkowy');
  H.ustawParametrLab('fixationGain', '0');
  const h = app();
  for (const pole of POLA_ZAKAZANE_W_LAB) T(`D1/bez-${pole}`, !h.includes(`data-lobs="${pole}"`), `pole ${pole} nie ma prawa być pokazane`);
  T('D2/bez-werdyktu-slownie', !/Rozpoznanie:|Diagnosis:|Werdykt:|Verdict:/.test(h), 'ekran nie ma prawa nazywać wyniku rozpoznaniem');
  T('D3/mowi-czym-jest', /nie rozpoznanie|not a diagnosis/.test(h), 'ekran musi powiedzieć, że to opis badania, a nie rozpoznanie');
}

/* ═══════════ E. DWA STANOWISKA I PORÓWNANIE ═══════════ */
{
  H.otworzEksperymentLab('dysocjacja');
  for (const id of STANOWISKO_IDS) T(`E1/stanowisko/${id}`, app().includes(`data-lstan="${id}"`), `brak stanowiska ${id}`);
  eq('E2/domyslne', st.labStanowisko, 'A');
  H.ustawParametrLab('caloricGainR', '0.2');
  const aPo = JSON.stringify(st.labA), bPrzed = JSON.stringify(st.labB);
  H.ustawStanowiskoLab('B');
  H.ustawParametrLab('gainR', '0.3');
  T('E3/A-nietkniete', JSON.stringify(st.labA) === aPo, 'zmiana na stanowisku B ruszyła stanowisko A');
  T('E4/B-zmienione', JSON.stringify(st.labB) !== bPrzed, 'zmiana na stanowisku B nie zapisała się');
  H.przelaczPorownanieLab();
  T('E5/porownanie', /data-lpor="1"/.test(app()), 'porównanie musi się pokazać');
  T('E6/dwa-obrazy', (app().match(/data-lobraz=/g) || []).length === 2, 'porównanie pokazuje obrazy obu stanowisk');
}

/* ═══════════ F. KRYTERIUM ODBIORU NR 1 — DWA POMIARY ═══════════ */
{
  const POLA_PACJENTA = ['side', 'canal', 'maneuverKey', 'testKey', 'variant', 'dixObs', 'dixRep',
    'diagCentral', 'size', 'plan', 'step', 'total', 'elapsedMs', 'running', 'zegar', 'ukryteOd', 'luka',
    'trybCzasu', 'sideZrodlo', 'variantZrodlo', 'obs', 'obsOdciski', 'obsGrupa', 'triage', 'triageStep',
    'kontrole', 'kontrolaPowod', 'decisionSeq', 'flow'];
  const POLA_SYMULATORA = ['hintsCustom', 'hintsScenario', 'hintsSide', 'hintsFix', 'hintsGaze', 'hintsComp',
    'hintsRecovery', 'hintsHitSide', 'hintsAdvanced', 'hintsPreset', 'hintsPlane', 'hintsHitCanal', 'hintsSCDS',
    'hintsBadanie', 'hintsPominiecie', 'hintsPrzeszkolenie'];
  const odcisk = (pola) => JSON.stringify(pola.map(k => [k, st[k]]));

  // Pacjent i symulator w stanie NIEZEROWYM — inaczej test przechodziłby przez przypadek.
  H.goArea('diag'); H.openTest('dix'); H.setDiagSide('L'); H.setVariant('cupulo');
  H.goObs(); H.setObsPole('pion#jedyna', 'm1'); H.setObsPole('torsja#jedyna', 'm1');
  H.setTriage('przebieg', 'napadowe');
  H.openHintsCustom && H.openHintsCustom();
  const przedP = odcisk(POLA_PACJENTA), przedS = odcisk(POLA_SYMULATORA);
  T('F1/stan-niezerowy', /"variant","cupulo"/.test(przedP), 'kontrola: pacjent musi mieć niezerowy stan');

  // CAŁY eksperyment: otwarcie, suwaki, drugie stanowisko, porównanie, reset, opis parametru.
  H.goArea('lab');
  H.otworzEksperymentLab('nerw');
  H.ustawParametrLab('tonePcR', '0');
  H.ustawParametrLab('sacculeR', '0');
  H.opisParametruLab('sacculeR');
  H.ustawStanowiskoLab('B');
  H.ustawParametrLab('caloricGainR', '0.2');
  H.przelaczPorownanieLab();
  H.resetLab();
  H.wrocDoEksperymentow();
  T('F2/pacjent-nietkniety', odcisk(POLA_PACJENTA) === przedP, 'eksperyment ZMIENIŁ stan pacjenta');
  T('F3/symulator-nietkniety', odcisk(POLA_SYMULATORA) === przedS, 'eksperyment ZMIENIŁ stan symulatora HINTS');

  // F4: pełny przebieg kliniczny domyka się BEZ wejścia do Laboratorium.
  st.obs = {}; st.triage = {}; st.kontrole = []; st.canal = null; st.decisionSeq = 0;
  st.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  st.labEksperyment = null; st.labA = null; st.labB = null;
  const kroki = [];
  H.openTriage(); H.setTriage('przebieg', 'napadowe'); H.setTriage('wyzwalacz', 'pozycyjny'); H.toggleTriageFlaga('brak'); kroki.push('wywiad');
  H.openTest('dix'); H.setDiagSide('P'); kroki.push('proba');
  H.goObs(); H.setObsPole('pion#jedyna', 'p1'); H.setObsPole('torsja#jedyna', 'p1'); H.setObsPole('poziom#jedyna', 'zero');
  H.setObsPole('latencja', '1-5s'); H.setObsPole('czasTrwania', 'ponizej1min'); H.setObsPole('meczliwosc', 'slabnie'); kroki.push('oczoplas');
  H.setDixObs('post'); H.goInterpret(); kroki.push('interpretacja');
  H.startManeuver('epley'); kroki.push('manewr');
  H.goKontrola(); H.ustawWynikKontroli('ustapienie'); kroki.push('kontrola');
  eq('F4a/pelny-przebieg', kroki.length, 6);
  T('F4b/lab-nietkniete', st.labEksperyment == null && st.labA == null && st.labB == null,
    'podstawowa diagnostyka dotknęła stanu Laboratorium');
  T('F4c/kontrola-zapisana', (st.kontrole || []).length >= 1, 'kontrola musi się zapisać — inaczej przebieg nie jest domknięty');
}

/* ═══════════ G. POLA STANU I JĘZYK ═══════════ */
{
  T('G1/pola-lab', POLA_LAB.every(k => k in st), `stan nie ma pól Laboratorium: ${POLA_LAB.filter(k => !(k in st)).join(',')}`);
  T('G2/pola-rozlaczne', !POLA_LAB.some(k => k.startsWith('hints')), 'pola Laboratorium nie mogą być polami symulatora');
  H.goArea('lab');
  const pl = app();
  st.lang = 'en'; H.render();
  const en = app();
  T('G3/inny-jezyk', pl !== en, 'przełączenie języka musi zmienić treść');
  T('G4/en-bez-polskiego', !/Laboratorium neurootologiczne|Parametry|Odchylenia/.test(en), 'ekran EN nie ma prawa nieść polskich napisów');
  st.lang = 'pl'; H.render();
  // G5: ani jednego pola tekstowego — ta sama zasada, co w Blokach 12 i 13.
  H.otworzEksperymentLab('otolity');
  T('G5/bez-pol-tekstowych', !/<input(?![^>]*type=["']range)|<textarea|contenteditable/i.test(app()),
    'w Laboratorium nie ma prawa istnieć pole tekstowe (suwak zakresu jest dozwolony)');
}

/* ═══════════ H. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 47;
if (bledy.length) {
  console.error(`✗ lab:dom — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ lab:dom — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  process.exit(1);
}
console.log(`✓ lab:dom — ${ok} przypadkow, ekrany i akcje Laboratorium zgodne.`);
