// Boot aplikacji: pacjent z linku (U7) + pierwszy render + uchwyt harnessu snapshotu.
import { Vestibular } from './engine/vestibular.js';
import { Scene3D } from './engine/scene3d.js';
import { NeuroVOR } from './engine/neuro-vor.js';
import { MANEUVERS, CANALS, stepGravity, stepHeadQ, composeHead, TORSO_Q, bodyJoints, poseSpec, gravArrowFor, DIAG, CANAL_OF, maneuverTimeline, actTimeline, sessionSim, sessionPreview, readhesion, SESSION_REST, SIT_SEG, ldtPhases, nullScan, nullYawOf, engineXi, provokeQ, HC_TILT_DEG, HC_FLEX_DEG, MECHS_BY_PHENO, mechOf, variantOfMech, persistentOf, SHORT_PHI0, rollShortPhases, ENS_GRID, ensembleSim, maneuverSim, PRIORS, mulberry32, randomPatient, TEST_OF_CANAL, examPhaseNys, examAnswerKey, recommend, baranyClassify, nysFromGeom, TEVS_REST, tevsDemoSim, JAM_DEMO, jamDemo } from './pose/maneuvers.js';
import { spvTrace, xiVis } from './engine/spv-bridge.js';   // D8/V22: XI_VIS leniwie (cykl modułów) — seam dostaje LICZBĘ jak dotąd
import { state } from './app/state.js';
import { render, webglAvailable, sizeFlip } from './render/svg-screens.js';
import { goHintsKwal, ustawPrzeszkolenieHints, pomijajKwalifikacje, cofnijPominiecie, zacznijBadanieHints, otworzSymulatorHints, otworzLaboratorium, ustawSkladowaHints, ustawPowodNiewiarHints, goHintsKrok, dalejHints, wsteczHints, pokazWynikHints, wrocDoBadaniaHints, wyczyscBadanieHints, biezacyKrok, goKontrola, wrocDoManewru, ustawWynikKontroli, ustawPowodKontroli, kontrolaAkcja, kontrolaAlternatywa, powtorzManewrKontroli, pytajOZakonczeniu, zakonczSesje, openHints, setHintsFix, setHintsGaze, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, loadHintsFromHash, openTest, setDixObs, setVariant, toggleDiagCentral, openTriage, setTriage, toggleTriageFlaga, resetTriage, pickCanal, pickSide, openMan, goStep, pickSize, zakonczSerie, ustawTrybCzasu, zmienManewr, potwierdzPrzerwe, goObs, setObsPole, oznaczObsPole, setObsGrupa, wyczyscObs, przyjmijObs, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, genPlan, setGuideSide, setDiagSide, startManeuver, syncLangBar, setMode, setLangUI, goNauka, otworzPrzypadek, wrocDoBiblioteki, ustawFiltrNauki, goEtapNauki, odpowiedzNauki, wskazowkaNauki, zakonczPrzypadek, wyczyscPostepNauki, wczytajPostepNauki, wczytajSesjeOpisu, usunWszystkieSesjeOpisu, goOpis, przelaczSekcjeOpisu, edytujOpis, ustawEdycjeOpisu, wrocDoWyliczonego, kopiujOpis, eksportujOpis, zapiszSesjeOpisu, przywrocSesjeOpisu, usunSesjeOpisu, ustawTolerancjeKontroli, goLab, otworzEksperymentLab, wrocDoEksperymentow, ustawStanowiskoLab, przelaczPorownanieLab, ustawParametrLab, resetLab, opisParametruLab, setMechanism, setBltScenario, syncSessionBar, toggleSessionMode, resetSession, sessionProvoke, seedSessionFromScenario, sessionManeuver, sessionRest, toggleEnsembleMode, examStart, newExamPatient, examReveal, examEnd, toggleExamMode } from './app/actions.js';
import { initLang } from './i18n.js';
import { releaseWake } from './runtime/registry.js';
import { flowDeps } from './app/flow-deps.js';
import { mountShell, syncShell, initShellObservers, mountNav, mountFlow, mountAktualizacja, syncAktualizacja, goArea, goFlowStep, setReducedMotion } from './app/shell.js';
import { zarejestrujSW } from './runtime/pwa.js';
/* Listy pól modułów (jeden pisarz) na powierzchni testowej. Obie były dotąd „kontraktem w
   komentarzu": mówiły, że wyrocznia MA je czytać, a nie czytała ich żadna — i to jest dokładnie
   powód, dla którego zakończenie sesji latami omijało pola badania HINTS. Teraz fu:dom czyta te
   listy WPROST, więc pole dołożone w przyszłym bloku wchodzi pod bramkę samo. */
import { POLA_HINTS } from './app/hints-state.js';
import { POLA_PREFERENCJI } from './app/followup-state.js';
import { aktualizacjaCzeka, zerujAktualizacje, schowajAktualizacje, wdrozAktualizacjeTeraz, obsluzKlawisz } from './app/actions.js';
/* E6: akcje atlasu — osobny wiersz importu, zeby diff niosl jedna rzecz naraz. */
import { goAtlas, otworzWpisAtlasu, wrocZWpisuAtlasu, ustawZespolAtlasu, ustawZakresAtlasu, ustawSzukajAtlasu, wyczyscFiltryAtlasu } from './app/actions.js';

// Etap 5: 3D jest DOMYŚLNYM rendererem karty „Ułożenie" tam, gdzie WebGL działa.
// Ustawiane raz na boot (NIE w literale state.js) — jsdom/harness bez WebGL → view3d=false → SVG → golden bez zmian.
if(webglAvailable()) state.view3d = true;
// i18n: język startowy wg wyboru użytkownika (localStorage) / locale przeglądarki → EN domyślnie, PL dla polskiego locale.
initLang();
// Blok 13 (kryterium odbioru nr 2): postep nauki z pamieci przegladarki wczytujemy RAZ, na boocie
// i POZA renderem. Gdyby ekran czytal localStorage sam, zloty wzorzec przestalby byc deterministyczny.
wczytajPostepNauki();
// Blok 15: zapisane sesje — ta sama zasada i ten sam powod. Pamiec czytamy RAZ, poza renderem.
wczytajSesjeOpisu();
syncLangBar();   // odbij wykryty język na pasku #langbar (statyczna powłoka, poza #app)
syncSessionBar();   // etykieta toggle'a sesji (V10/D1) w języku UI — powłoka poza #app, golden nietknięte
/* U7: pacjent z linku (hash #p=…) na starcie → tryb HINTS „Własny" (dane tylko lokalnie).
   Blok 12 (kryterium odbioru nr 1): link ląduje na ekranie KWALIFIKACJI z wczytanym pacjentem, a nie
   wprost w symulatorze. To jest najważniejsze z siedmiu wejść, które kiedyś bramkę omijały: udostępniony
   odnośnik potrafi posadzić klinicystę od razu przed werdyktem „wzorzec obwodowy — uspokajający",
   policzonym dla PARAMETRÓW Z LINKU, a nie dla pacjenta, który przed nim siedzi. */
if(/[#&]p=/.test(location.hash) && loadHintsFromHash()){ state.mode="hints"; state.screen="hintsKwal"; state.hintsQuiz=false; state.hintsQuizReveal=false; }
// Powłoka (Blok 1) — dwujęzyczne napisy szkieletu i odbicie stanu. PRZED render(), żeby chrom
// był kompletny już przy pierwszym malowaniu. Sam markup powłoki siedzi w index.html.
mountShell();
// Nawigacja (Blok 3). Akcje wstrzykiwane, żeby shell.js pozostał liściem grafu importów.
mountNav({ setMode, openHintsCustom, goHintsKwal, goNauka, goLab, goAtlas, setLangUI, render, releaseWake, usunWszystkieSesjeOpisu });
// Pasek przebiegu klinicznego (Blok 5). Wiedza kliniczna WSTRZYKIWANA: src/app/flow-model.js jest
// celowo bezimportowy (wyrocznia tools/flow-check.mjs importuje go w gołym Node), a powłoka ma
// zostać liściem grafu renderowania. Dzięki wstrzyknięciu zgodność wybranego manewru z bieżącą
// interpretacją liczy PRAWDZIWY silnik, a nie kopia reguł, która mogłaby się z nim rozjechać.
// Zestaw zależności mieszka w src/app/flow-deps.js, bo czyta go TAKŻE karta „ostatnia sesja"
// na ekranie startowym — dwie kopie dawałyby dwa różne stany tego samego przebiegu.
mountFlow(flowDeps());
// Preferencja ograniczenia ruchu z systemu — ZA DETEKCJĄ (jsdom nie ma matchMedia; niezłapany
// wyjątek w ciele modułu = biały ekran, dlatego snapshot.mjs ma teraz twarde exit(1)).
try {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) setReducedMotion(true);
} catch { /* brak matchMedia → zostaje domyślne false */ }
/* Blok 16 — PWA. Pasek nowej wersji montujemy PRZED rejestracją workera: gdyby worker zdążył
   zgłosić czekającą wersję do pustego paska, komunikat przepadłby do najbliższego syncShell. */
mountAktualizacja({ wdrozAktualizacjeTeraz, schowajAktualizacje });
zarejestrujSW(aktualizacjaCzeka);
/* Skróty klawiaturowe (dokument, kolumna „Komputer"). Nasłuch jest GLOBALNY, ale decyzja należy
   do czystego pwa-model.skrot — i domyślnie brzmi „nie": spacja na przycisku ma go wcisnąć,
   a strzałka w suwaku fazy ma przestawić fazę, nie etap manewru. */
try { document.addEventListener('keydown', obsluzKlawisz); } catch { /* brak DOM → brak skrótów */ }
syncShell();
render();
// Obserwatory PO pierwszym renderze — przed nim nie ma czego mierzyć. W try/catch, bo awaria
// powłoki nie ma prawa zabrać ze sobą aplikacji klinicznej.
try {
  initShellObservers({
    sizeFlip,
    // three-patient.js jest ładowany LENIWIE (import() w svg-screens.js) — statyczny import
    // wciągnąłby całe three.js do głównego bundla i do precache PWA. Bramkujemy obecnością
    // kontenera: brak paneli 3D → nie dotykamy modułu w ogóle.
    resizeMounted3D: () => {
      if (!document.querySelector('[data-three3d]')) return;
      import('./render/three-patient.js').then(m => m.resizeMounted3D()).catch(() => {});
    },
  });
} catch (e) { /* brak obserwatorów = zachowanie sprzed Bloku 1, aplikacja działa dalej */ }



window.__OTOREPO_TEST__ = { goAtlas, otworzWpisAtlasu, wrocZWpisuAtlasu, ustawZespolAtlasu, ustawZakresAtlasu, ustawSzukajAtlasu, wyczyscFiltryAtlasu, POLA_HINTS, POLA_PREFERENCJI, aktualizacjaCzeka, zerujAktualizacje, schowajAktualizacje, wdrozAktualizacjeTeraz, obsluzKlawisz, syncAktualizacja, goOpis, przelaczSekcjeOpisu, edytujOpis, ustawEdycjeOpisu, wrocDoWyliczonego, kopiujOpis, eksportujOpis, zapiszSesjeOpisu, przywrocSesjeOpisu, usunSesjeOpisu, usunWszystkieSesjeOpisu, wczytajSesjeOpisu, ustawTolerancjeKontroli, goLab, otworzEksperymentLab, wrocDoEksperymentow, ustawStanowiskoLab, przelaczPorownanieLab, ustawParametrLab, resetLab, opisParametruLab, goNauka, otworzPrzypadek, wrocDoBiblioteki, ustawFiltrNauki, goEtapNauki, odpowiedzNauki, wskazowkaNauki, zakonczPrzypadek, wyczyscPostepNauki, wczytajPostepNauki, goHintsKwal, ustawPrzeszkolenieHints, pomijajKwalifikacje, cofnijPominiecie, zacznijBadanieHints, otworzSymulatorHints, otworzLaboratorium, ustawSkladowaHints, ustawPowodNiewiarHints, goHintsKrok, dalejHints, wsteczHints, pokazWynikHints, wrocDoBadaniaHints, wyczyscBadanieHints, biezacyKrok, goKontrola, wrocDoManewru, ustawWynikKontroli, ustawPowodKontroli, kontrolaAkcja, kontrolaAlternatywa, powtorzManewrKontroli, pytajOZakonczeniu, zakonczSesje, potwierdzPrzerwe, ustawTrybCzasu, zmienManewr, pickCanal, pickSide, openMan, goStep, pickSize, zakonczSerie, Vestibular, NeuroVOR, Scene3D, composeHead, stepHeadQ, stepGravity, bodyJoints, poseSpec, gravArrowFor, genPlan, MANEUVERS, CANALS, DIAG, CANAL_OF, HINTS_PRESETS, TORSO_Q, state, render, startManeuver, setGuideSide, openTest, setDiagSide, setDixObs, setVariant, openHints, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsFix, setHintsGaze, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, goArea, setReducedMotion, setMode, syncShell, goFlowStep, toggleDiagCentral, openTriage, setTriage, toggleTriageFlaga, resetTriage, goObs, setObsPole, oznaczObsPole, setObsGrupa, wyczyscObs, przyjmijObs, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, setMechanism, setBltScenario, maneuverTimeline, actTimeline, sessionSim, sessionPreview, readhesion, SESSION_REST, SIT_SEG, ldtPhases, nullScan, nullYawOf, engineXi, provokeQ, HC_TILT_DEG, HC_FLEX_DEG, spvTrace, XI_VIS: xiVis(), MECHS_BY_PHENO, mechOf, variantOfMech, persistentOf, SHORT_PHI0, rollShortPhases, ENS_GRID, ensembleSim, maneuverSim, toggleEnsembleMode, toggleSessionMode, resetSession, sessionProvoke, seedSessionFromScenario, sessionManeuver, sessionRest, PRIORS, mulberry32, randomPatient, TEST_OF_CANAL, examPhaseNys, examAnswerKey, recommend, baranyClassify, nysFromGeom, examStart, newExamPatient, examReveal, examEnd, toggleExamMode, TEVS_REST, tevsDemoSim, JAM_DEMO, jamDemo };
