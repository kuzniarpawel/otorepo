// Boot aplikacji: pacjent z linku (U7) + pierwszy render + uchwyt harnessu snapshotu.
import { Vestibular } from './engine/vestibular.js';
import { Scene3D } from './engine/scene3d.js';
import { NeuroVOR } from './engine/neuro-vor.js';
import { MANEUVERS, CANALS, stepGravity, stepHeadQ, composeHead, TORSO_Q, bodyJoints, poseSpec, gravArrowFor, DIAG, CANAL_OF, recommend } from './pose/maneuvers.js';
import { state } from './app/state.js';
import { render, webglAvailable, sizeFlip } from './render/svg-screens.js';
import { openHints, setHintsFix, setHintsGaze, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, loadHintsFromHash, openTest, setDixObs, setVariant, toggleDiagCentral, openTriage, setTriage, toggleTriageFlaga, resetTriage, pickCanal, pickSide, openMan, goStep, pickSize, zakonczSerie, ustawTrybCzasu, zmienManewr, goObs, setObsPole, oznaczObsPole, setObsGrupa, wyczyscObs, przyjmijObs, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, genPlan, setGuideSide, setDiagSide, startManeuver, syncLangBar, setMode, setLangUI } from './app/actions.js';
import { initLang } from './i18n.js';
import { releaseWake } from './runtime/registry.js';
import { probaKanalu, sygnalKonwersji } from './app/man-model.js';
import { manDeps } from './app/man-deps.js';
import { mountShell, syncShell, initShellObservers, mountNav, mountFlow, goArea, goFlowStep, setReducedMotion } from './app/shell.js';

// Etap 5: 3D jest DOMYŚLNYM rendererem karty „Ułożenie" tam, gdzie WebGL działa.
// Ustawiane raz na boot (NIE w literale state.js) — jsdom/harness bez WebGL → view3d=false → SVG → golden bez zmian.
if(webglAvailable()) state.view3d = true;
// i18n: język startowy wg wyboru użytkownika (localStorage) / locale przeglądarki → EN domyślnie, PL dla polskiego locale.
initLang();
syncLangBar();   // odbij wykryty język na pasku #langbar (statyczna powłoka, poza #app)
// U7: pacjent z linku (hash #p=…) na starcie → tryb HINTS „Własny" (dane tylko lokalnie).
if(/[#&]p=/.test(location.hash) && loadHintsFromHash()){ state.mode="hints"; state.screen="hints"; state.hintsQuiz=false; state.hintsQuizReveal=false; }
// Powłoka (Blok 1) — dwujęzyczne napisy szkieletu i odbicie stanu. PRZED render(), żeby chrom
// był kompletny już przy pierwszym malowaniu. Sam markup powłoki siedzi w index.html.
mountShell();
// Nawigacja (Blok 3). Akcje wstrzykiwane, żeby shell.js pozostał liściem grafu importów.
mountNav({ setMode, openHintsCustom, setLangUI, render, releaseWake });
// Pasek przebiegu klinicznego (Blok 5). Wiedza kliniczna WSTRZYKIWANA: src/app/flow-model.js jest
// celowo bezimportowy (wyrocznia tools/flow-check.mjs importuje go w gołym Node), a powłoka ma
// zostać liściem grafu renderowania. Dzięki wstrzyknięciu zgodność wybranego manewru z bieżącą
// interpretacją liczy PRAWDZIWY silnik, a nie kopia reguł, która mogłaby się z nim rozjechać.
// probaKanalu: most kanal->proba dla sciezki BEZ proby (tryb ekspercki). Bez niego
// maneuverAgreement degraduje do 'nieznana', czyli do stanu sprzed Bloku 10.
mountFlow({ recommend, canalOf: k => CANAL_OF[k] || null, testCanal: k => (DIAG[k] || {}).canal || null,
            probaKanalu: (kanal) => probaKanalu(kanal, manDeps()),
            konwersja: (s) => sygnalKonwersji(s, manDeps()) });
// Preferencja ograniczenia ruchu z systemu — ZA DETEKCJĄ (jsdom nie ma matchMedia; niezłapany
// wyjątek w ciele modułu = biały ekran, dlatego snapshot.mjs ma teraz twarde exit(1)).
try {
  if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) setReducedMotion(true);
} catch { /* brak matchMedia → zostaje domyślne false */ }
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



window.__OTOREPO_TEST__ = { ustawTrybCzasu, zmienManewr, pickCanal, pickSide, openMan, goStep, pickSize, zakonczSerie, Vestibular, NeuroVOR, Scene3D, composeHead, stepHeadQ, stepGravity, bodyJoints, poseSpec, gravArrowFor, genPlan, MANEUVERS, CANALS, DIAG, CANAL_OF, HINTS_PRESETS, TORSO_Q, state, render, startManeuver, setGuideSide, openTest, setDiagSide, setDixObs, setVariant, openHints, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsFix, setHintsGaze, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, goArea, setReducedMotion, setMode, syncShell, goFlowStep, toggleDiagCentral, openTriage, setTriage, toggleTriageFlaga, resetTriage, goObs, setObsPole, oznaczObsPole, setObsGrupa, wyczyscObs, przyjmijObs, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby };
