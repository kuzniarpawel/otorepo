/* OTOREPO — wyrocznia EKRANÓW ATLASU I ROZDZIELENIA ŚCIEŻEK (E6). jsdom, PRAWDZIWY graf modułów.
 *
 * Ta wyrocznia bada trzy twierdzenia, których żadna bramka modelu nie umie zobaczyć, bo wszystkie
 * są twierdzeniami o TYM, CO ROBI APLIKACJA:
 *
 *   K1 — ROZŁĄCZNOŚĆ ZAKRESÓW. Decyzja użytkownika 2026-08-22 mówi, że ścieżka ostra pozostaje
 *        OGÓLNA, a jednostki szczegółowe mieszkają osobno. Zdanie „wejście do atlasu niczego nie
 *        zmienia w toczącym się badaniu" jest sprawdzalne WYŁĄCZNIE odciskiem stanu: bierzemy
 *        `triage`, `obs`, `flow`, `hintsBadanie` i `kontrole` przed wejściem i po wyjściu i żądamy
 *        bit w bit tego samego. Bez tego byłaby to deklaracja w komentarzu.
 *
 *   K2 — ATLAS NIE JEST DROGĄ DO HINTS. W tym projekcie powstało już SIEDEM wejść omijających
 *        kwalifikację, scalonych dopiero w Bloku 12 w jedną bramkę `wolnoBadac`. Nowy obszar to
 *        naturalna okazja na ósme. Wyrocznia skanuje DOM obu ekranów atlasu w poszukiwaniu
 *        czegokolwiek, co uruchamia badanie albo symulator.
 *
 *   K3 — WARIANT A: OKNO HINTS PRZESTAŁO BYĆ KWESTIONARIUSZEM. Do tego etapu `renderHintsKwal`
 *        renderował cały kwestionariusz kwalifikacji, więc ekran nazwany „HINTS / HINTS+" w połowie
 *        przypadków kończył się zdaniem, że HINTS nie ma tu zastosowania. Sprawdzamy, że pytań tam
 *        już nie ma, że jest karta kroku 1 — i że gałąź „odradzana" ma WYJŚCIE DO PRZODU inne niż
 *        pominięcie bramki.
 *
 * Uruchomienie: npm run atlas:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';
import { ATLAS, ATLAS_KLUCZE, jednostki, ramowe, stanowiska } from '../src/app/atlas-model.js';
import { AREAS, barAreas } from '../src/app/nav-model.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

/* ── Boot w jsdom: bundel esbuild jako klasyczny <script>, jak w wyroczniach Bloków 9-16. ── */
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
const POTRZEBNE = ['state', 'render', 'goArea', 'goAtlas', 'otworzWpisAtlasu', 'wrocZWpisuAtlasu',
  'ustawZespolAtlasu', 'ustawZakresAtlasu', 'ustawSzukajAtlasu', 'wyczyscFiltryAtlasu',
  'openTriage', 'setTriage', 'toggleTriageFlaga', 'resetTriage', 'goHintsKwal', 'syncShell'];
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

const czysty = () => {
  H.resetTriage();
  st.atlasWpis = null; st.atlasZespol = null; st.atlasZakres = null; st.atlasSzukaj = ''; st.atlasSkad = null;
  st.hintsPominiecie = null; st.hintsPrzeszkolenie = null; st.hintsBlad = null; st.hintsBadanie = {};
};

/* Pusty atlas nie jest "zielona wyrocznia na pustym zbiorze" — jest stanem, w ktorym ta bramka
   NIE MA CZEGO sprawdzac, i ma to powiedziec wprost. Bez tego padala na ATLAS[0] ze stosem
   o 'nazwaPl', czyli komunikatem o skladni zamiast o tresci. */
if (!ATLAS.length) { console.error('✗ ATLAS pusty — wyrocznia nie ma czego sprawdzac'); process.exit(1); }

T('A0/uchwyt', !!H.goAtlas && !!H.otworzWpisAtlasu, 'atlas musi być sterowalny z testu — inaczej nie pilnuje go żadna wyrocznia');

/* ═══════════ A. OBSZAR I LISTA ═══════════ */
{
  czysty();
  H.goArea('atlas');
  eq('A1/obszar', st.area, 'atlas');
  eq('A2/ekran', st.screen, 'atlasLista');
  T('A3/app-widoczny', !win.document.getElementById('app').hidden, '#app nie ma prawa być schowany — złoty wzorzec czyta tylko jego');
  T('A4/lista-jest', /data-atllista/.test(app()), 'lista wpisów musi się wyrenderować');
  const kafle = (app().match(/data-atlwpis="/g) || []).length;
  eq('A5/wszystkie-wpisy', kafle, ATLAS.length);
  T('A6/rozklad-zakresu', /data-atlzakres/.test(app()),
    'karta rozkładu zakresu musi stać — to ona pokazuje, ile jednostek silnik modeluje, a ile stoi tu tylko do czytania');
}

/* ═══════════ B. NAWIGACJA — SZÓSTY OBSZAR, ALE NIE NA PASKU TELEFONU ═══════════
   Pasek telefonu ma cztery pozycje. Wciągnięcie tam atlasu wypchnęłoby Profil, czyli jedyne
   wejście do ustawień — ten dokładny błąd już raz popełniono, gdy pasek brał pierwsze cztery
   pozycje listy. Dlatego liczby stoją tu jawnie, a nie „ile wyjdzie". */
{
  eq('B1/szesc-obszarow', AREAS.length, 6);
  T('B2/atlas-w-szynie', AREAS.some(a => a.id === 'atlas' && a.bar === 'rail'), 'atlas musi być w szynie, nie na pasku');
  eq('B3/pasek-cztery', barAreas().length, 4);
  T('B4/profil-na-pasku', barAreas().some(a => a.id === 'profile'), 'Profil wypadł z paska telefonu — to jedyne wejście do ustawień');
  T('B5/dwujezyczny', AREAS.every(a => a.pl && a.en && a.plDesc && a.enDesc), 'każdy obszar ma nieść oba języki');
}

/* ═══════════ C. FILTRY I WYSZUKIWANIE ═══════════ */
{
  czysty(); H.goAtlas();
  const wszystkie = (app().match(/data-atlwpis="/g) || []).length;
  H.ustawZespolAtlasu('CVS');
  const poCVS = (app().match(/data-atlwpis="/g) || []).length;
  T('C1/filtr-zawezajacy', poCVS > 0 && poCVS < wszystkie, `filtr CVS dał ${poCVS} z ${wszystkie} — filtr, który niczego nie zawęża, nie jest filtrem`);
  H.ustawZespolAtlasu('CVS');   // ponowne dotknięcie ZDEJMUJE
  eq('C2/filtr-toggle', (app().match(/data-atlwpis="/g) || []).length, wszystkie);

  H.ustawZakresAtlasu('poza-zakresem');
  const pozaZ = (app().match(/data-atlwpis="/g) || []).length;
  T('C3/filtr-zakresu', pozaZ > 0 && pozaZ < wszystkie, `filtr zakresu dał ${pozaZ} z ${wszystkie}`);
  H.wyczyscFiltryAtlasu();
  eq('C4/wyczysc', (app().match(/data-atlwpis="/g) || []).length, wszystkie);

  H.ustawSzukajAtlasu(ATLAS[0].nazwaPl.slice(0, 6));
  T('C5/szukanie-trafia', new RegExp(`data-atlwpis="${ATLAS[0].klucz}"`).test(app()), 'wyszukiwanie po fragmencie nazwy nie trafia we własny wpis');
  H.ustawSzukajAtlasu('zzzznieistniejąca');
  T('C6/pusto-mowi-ze-to-filtr', /data-atlpusto/.test(app()),
    'przy pustym wyniku ekran musi powiedzieć, że to FILTR, a nie że atlas jest pusty — to dwa różne zdania, z których jedno jest nieprawdą');
  H.wyczyscFiltryAtlasu();
}

/* ═══════════ D. KARTA WPISU ═══════════ */
{
  for (const w of ATLAS) {
    czysty(); H.otworzWpisAtlasu(w.klucz);
    const html = app();
    T(`D1/${w.klucz}-widok`, new RegExp(`data-atlwpiswidok="${w.klucz}"`).test(html), 'karta wpisu się nie wyrenderowała');
    T(`D2/${w.klucz}-granice`, /data-atlgranice/.test(html), 'karta bez sekcji GRANIC ŹRÓDŁA — to pole odróżnia atlas od podręcznika');
    T(`D3/${w.klucz}-zrodlo`, html.includes(w.zrodlo), `karta nie niesie rodowodu „${w.zrodlo}"`);
  }
}

/* ═══════════ E. K1 — ROZŁĄCZNOŚĆ ZAKRESÓW (ODCISK STANU) ═══════════
   Najważniejsze twierdzenie tej wyroczni. Zakładamy toczące się badanie — komplet odpowiedzi
   kwalifikacji plus rekord obserwacji — przechodzimy CAŁY atlas i żądamy, żeby nie drgnęło nic. */
{
  /* Stan zakładamy PRAWDZIWĄ DROGĄ, a nie przypisaniem do `st.flow`. Pierwsza wersja tej sekcji
     nadpisywała `st.flow` po wypełnieniu kwalifikacji i tym samym KASOWAŁA `flow.triage`, które
     `syncTriage` tam zapisuje — a potem ogłaszała „atlas zmienił stan badania", gdy powrót
     z wpisu odtwarzał ten podobiekt. Fałszywy alarm zbudowany przez samą fiksturę: dokładnie ta
     klasa błędu, którą złoty wzorzec złapał przy D-CZAS. Wstrzykiwany zostaje tylko `obs`
     i `kontrole`, których żadna akcja tej ścieżki nie tworzy. */
  czysty();
  H.openTriage();
  for (const [k, v] of Object.entries({ przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'obecny' })) H.setTriage(k, v);
  H.toggleTriageFlaga('brak');
  st.obs = { dix: { proba: 'dix', kierunek: 'geotropowy' } };
  st.kontrole = [{ manewr: 'epley' }];
  st.hintsBadanie = { hit: 'sakadaP' };

  const POLA = ['triage', 'obs', 'flow', 'kontrole', 'hintsBadanie', 'decisionSeq', 'canal', 'side', 'variant', 'mechanism'];
  const odcisk = () => JSON.stringify(POLA.map(p => [p, st[p]]));
  const przed = odcisk();

  /* PRZEGLĄDANIE ATLASU — wejście z listy (`skad` puste), otwarcie każdego wpisu, filtry,
     wyszukiwanie. To jest czynność, o której mówi decyzja użytkownika: „atlas jest osobnym
     zakresem". Powrót Z WPISU OTWARTEGO Z KWALIFIKACJI jest czynnością KWALIFIKACJI (woła
     `openTriage`), więc bada go osobno E3 — mieszanie obu w jednym twierdzeniu dawało właśnie
     ten fałszywy alarm. */
  H.goAtlas();
  for (const kl of ATLAS_KLUCZE) { H.otworzWpisAtlasu(kl); H.wrocZWpisuAtlasu(); }
  H.ustawZespolAtlasu('EVS'); H.ustawZakresAtlasu('modelowana'); H.ustawSzukajAtlasu('mig');
  H.wyczyscFiltryAtlasu();
  H.goAtlas();

  T('E1/atlas-nie-rusza-badania', odcisk() === przed,
    `przeglądanie atlasu zmieniło stan badania.\n    przed: ${przed}\n    po   : ${odcisk()}`);

  /* E3 — POWRÓT DO KWALIFIKACJI. Wolno mu odświeżyć `flow.triage` (bo to robi `openTriage`,
     czyli akcja kwalifikacji), ale NIE WOLNO ruszyć odpowiedzi ani rekordów klinicznych. */
  const bezFlow = () => JSON.stringify(POLA.filter(p => p !== 'flow').map(p => [p, st[p]]));
  const przedPowrotem = bezFlow();
  H.otworzWpisAtlasu('pppd', 'triage');
  H.wrocZWpisuAtlasu();
  T('E3/powrot-nie-rusza-odpowiedzi', bezFlow() === przedPowrotem,
    `powrót z atlasu do kwalifikacji zmienił odpowiedzi albo rekordy kliniczne.\n    przed: ${przedPowrotem}\n    po   : ${bezFlow()}`);
  T('E4/powrot-laduje-w-kwalifikacji', st.screen === 'triage',
    `powrót z wpisu otwartego z kwalifikacji wylądował na ekranie „${st.screen}" zamiast na kwalifikacji`);

  // Kontrola czułości: odcisk MUSI umieć zobaczyć zmianę, inaczej E1 jest zawsze zielone.
  const kopia = odcisk();
  H.setTriage('przebieg', 'napadowe');
  T('E2/odcisk-czuly', odcisk() !== kopia, 'odcisk nie widzi zmiany kwalifikacji — E1 byłoby wtedy twierdzeniem pustym');
}

/* ═══════════ F. K2 — ATLAS NIE JEST DROGĄ DO HINTS ═══════════ */
{
  const ZAKAZANE = ['zacznijBadanieHints', 'otworzSymulatorHints', 'openHints', 'openHintsCustom',
    'pomijajKwalifikacje', 'triageGo', 'startManeuver', 'openMan'];
  const znalezione = [];
  czysty(); H.goAtlas();
  for (const z of ZAKAZANE) if (app().includes(z)) znalezione.push(`lista→${z}`);
  for (const w of ATLAS) {
    czysty(); H.otworzWpisAtlasu(w.klucz);
    for (const z of ZAKAZANE) if (app().includes(z)) znalezione.push(`${w.klucz}→${z}`);
  }
  T('F1/bez-wejscia-do-badania', !znalezione.length,
    `atlas wystawia drogę do badania albo manewru: ${znalezione.slice(0, 5).join(' · ')} — bramka wolnoBadac ma zostać jedynymi drzwiami`);
  // Tryb też nie ma prawa się przestawić.
  czysty(); H.goAtlas(); H.otworzWpisAtlasu(ATLAS_KLUCZE[0]);
  eq('F2/tryb-zostaje-atlasem', st.mode, 'atlas');
}

/* ═══════════ G. LINKI Z KWALIFIKACJI ═══════════ */
{
  const scenariusz = (odp, flagi) => {
    czysty(); H.openTriage();
    for (const [k, v] of Object.entries(odp)) H.setTriage(k, v);
    for (const f of (flagi || [])) H.toggleTriageFlaga(f);
    H.render();
    return app();
  };
  const sEVS = scenariusz({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'samoistny' }, ['brak']);
  T('G1/sEVS-linkuje', /data-atllink/.test(sEVS), 'węzeł napadów samoistnych nadal kończy się ślepo — to był cały powód tego etapu');
  T('G2/sEVS-migrena', /data-atllinkklucz="migrenaPrzedsionkowa"/.test(sEVS), 'brak linku do migreny przedsionkowej przy napadach samoistnych');

  const CVS = scenariusz({ przebieg: 'przewlekle', odkiedy: 'dluzej' }, ['brak']);
  T('G3/CVS-linkuje', /data-atllink/.test(CVS), 'węzeł przewlekły nie prowadzi do atlasu');
  T('G4/CVS-pppd', /data-atllinkklucz="pppd"/.test(CVS), 'brak linku do PPPD przy zespole przewlekłym');

  /* CZERWONA FLAGA BEZ ATLASU — decyzja użytkownika. Przy fladze celem jest DZIAŁANIE; materiał
     do czytania rozcieńcza pilność. To samo twierdzenie stoi w modelu (IN11), tutaj sprawdzamy,
     że ekran go nie obchodzi własnym literałem. */
  const czerwona = scenariusz({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'tak' }, ['ataksja']);
  T('G5/czerwona-bez-atlasu', !/data-atllink/.test(czerwona),
    'przy czerwonej fladze ekran wystawia link do atlasu — przy fladze celem jest działanie, nie czytanie');

  // D-ORTO: uwaga o zawrocie ortostatycznym ma od tego etapu dokąd prowadzić.
  const orto = scenariusz({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'nie' }, ['brak']);
  T('G6/ortostaza-linkuje', /data-atllinkklucz="ortostatyczny"/.test(orto),
    'gałąź ortostatyczna nazywa [H52] Kim 2019 od etapu D-ORTO, ale nie prowadzi do wpisu');
}

/* ═══════════ H. K3 — WARIANT A: OKNO HINTS JEST OKNEM HINTS ═══════════ */
{
  czysty(); H.goHintsKwal(); H.render();
  const pusty = app();
  T('H1/bez-kwestionariusza', !/class="card tq /.test(pusty),
    'okno HINTS nadal renderuje kwestionariusz kwalifikacji — wariant A polega dokładnie na tym, że go tu nie ma');
  T('H2/karta-kroku1', /data-hqkrok1/.test(pusty), 'brak karty kroku 1 — użytkownik nie ma jak wrócić do kwalifikacji');
  T('H3/krok1-prowadzi', /openTriage\(\)/.test(pusty), 'karta kroku 1 nie prowadzi do ekranu kwalifikacji');
  T('H3b/okno-nazywa-sie-badaniem', pusty.includes('HINTS / HINTS+ — badanie'),
    'okno nadal nazywa sie „kwalifikacja", choc kwalifikacja z niego wyszla — to byla polowa pytania o uklad tego okna');
  T('H4/przeszkolenie-zostaje', /hqprzesz/.test(pusty),
    'pytanie o przeszkolenie zniknęło — dotyczy BADAJĄCEGO, więc jego miejsce jest właśnie tutaj, w kroku 2');

  // Werdykt „odradzana": trzecie wyjście, które NIE jest pominięciem bramki.
  czysty(); H.openTriage();
  for (const [k, v] of Object.entries({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'samoistny' })) H.setTriage(k, v);
  H.toggleTriageFlaga('brak');
  H.goHintsKwal(); H.render();
  const odradzana = app();
  T('H5/odradzana-status', /data-hq-status="odradzana"/.test(odradzana), `status kwalifikacji nie jest „odradzana"`);
  T('H6/trzecie-wyjscie', /data-atllink/.test(odradzana),
    'gałąź odradzająca nie ma wyjścia do przodu innego niż pominięcie bramki — a to właśnie ta asymetria pchała ku obejściu');
  T('H7/pominiecie-nadal-jest', /pomijajKwalifikacje/.test(odradzana),
    'karta świadomego pominięcia zniknęła — miała zostać, ma tylko przestać być JEDYNYM wyjściem');

  // Obraz potwierdzony: badanie się otwiera, karta kroku 1 pokazuje werdykt.
  czysty(); H.openTriage();
  for (const [k, v] of Object.entries({ przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'obecny' })) H.setTriage(k, v);
  H.toggleTriageFlaga('brak');
  H.goHintsKwal(); H.render();
  const potw = app();
  T('H8/potwierdzona', /data-hq-status="potwierdzona"/.test(potw), 'obraz zgodny z AVS nie daje statusu „potwierdzona"');
  T('H9/wejscie-do-badania', /zacznijBadanieHints/.test(potw), 'przy potwierdzonym obrazie nie ma wejścia do badania');
  T('H10/krok1-niesie-werdykt', /data-hqkrok1="AVS"/.test(potw),
    'karta kroku 1 nie pokazuje kategorii kwalifikacji — bez tego użytkownik nie wie, na czym stoi wejście');
  T('H11/potwierdzona-bez-atlasu', !/data-atllink/.test(potw),
    'przy potwierdzonym HINTS okno wystawia link do atlasu — wtedy jest szumem, bo ścieżka jest');
}

/* ═══════════ WYNIK ═══════════ */
console.log('OTOREPO — wyrocznia atlasu i rozdzielenia ścieżek (E6)');
console.log(`wpisów        : ${ATLAS.length} (${jednostki().length} jednostek + ${ramowe().length} ramowych + ${stanowiska().length} stanowisko)`);
console.log(`przypadki     : ${ok + bledy.length}`);
if (bledy.length) {
  console.error(`\n✗ ${bledy.length} BŁĘDÓW:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
console.log(`✓ atlas:dom — bez zastrzeżeń (${ok} przypadków)`);
