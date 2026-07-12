// Boot aplikacji: pacjent z linku (U7) + pierwszy render + uchwyt harnessu snapshotu.
import { Vestibular } from './engine/vestibular.js';
import { Scene3D } from './engine/scene3d.js';
import { NeuroVOR } from './engine/neuro-vor.js';
import { MANEUVERS, CANALS, stepGravity, stepHeadQ, composeHead, TORSO_Q, bodyJoints, poseSpec, gravArrowFor, DIAG, CANAL_OF } from './pose/maneuvers.js';
import { state } from './app/state.js';
import { render, webglAvailable } from './render/svg-screens.js';
import { openHints, setHintsFix, setHintsGaze, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, loadHintsFromHash, openTest, setDixObs, setVariant, genPlan, setGuideSide, setDiagSide, startManeuver } from './app/actions.js';

// Etap 5: 3D jest DOMYŚLNYM rendererem karty „Ułożenie" tam, gdzie WebGL działa.
// Ustawiane raz na boot (NIE w literale state.js) — jsdom/harness bez WebGL → view3d=false → SVG → golden bez zmian.
if(webglAvailable()) state.view3d = true;
// U7: pacjent z linku (hash #p=…) na starcie → tryb HINTS „Własny" (dane tylko lokalnie).
if(/[#&]p=/.test(location.hash) && loadHintsFromHash()){ state.mode="hints"; state.screen="hints"; state.hintsQuiz=false; state.hintsQuizReveal=false; }
render();



window.__OTOREPO_TEST__ = { Vestibular, NeuroVOR, Scene3D, composeHead, stepHeadQ, stepGravity, bodyJoints, poseSpec, gravArrowFor, genPlan, MANEUVERS, CANALS, DIAG, CANAL_OF, HINTS_PRESETS, TORSO_Q, state, render, startManeuver, setGuideSide, openTest, setDiagSide, setDixObs, setVariant, openHints, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsFix, setHintsGaze, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev };
