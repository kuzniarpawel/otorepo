// Boot aplikacji: pacjent z linku (U7) + pierwszy render + uchwyt harnessu snapshotu.
import { Vestibular } from './engine/vestibular.js';
import { Scene3D } from './engine/scene3d.js';
import { NeuroVOR } from './engine/neuro-vor.js';
import { MANEUVERS, CANALS, stepGravity, stepHeadQ, composeHead, TORSO_Q, bodyJoints, poseSpec, gravArrowFor, DIAG, CANAL_OF, maneuverTimeline, actTimeline, sessionSim, readhesion, SESSION_REST, SIT_SEG, ldtPhases, nullScan, nullYawOf, engineXi, provokeQ, MECHS_BY_PHENO, mechOf, variantOfMech, persistentOf, SHORT_PHI0, rollShortPhases, ENS_GRID, ensembleSim, maneuverSim } from './pose/maneuvers.js';
import { spvTrace, XI_VIS } from './engine/spv-bridge.js';
import { state } from './app/state.js';
import { render, webglAvailable } from './render/svg-screens.js';
import { openHints, setHintsFix, setHintsGaze, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, loadHintsFromHash, openTest, setDixObs, setVariant, setMechanism, setBltScenario, genPlan, setGuideSide, setDiagSide, startManeuver, syncLangBar, syncSessionBar, toggleSessionMode, resetSession, sessionProvoke, seedSessionFromScenario, sessionManeuver, sessionRest, toggleEnsembleMode } from './app/actions.js';
import { initLang } from './i18n.js';

// Etap 5: 3D jest DOMYŚLNYM rendererem karty „Ułożenie" tam, gdzie WebGL działa.
// Ustawiane raz na boot (NIE w literale state.js) — jsdom/harness bez WebGL → view3d=false → SVG → golden bez zmian.
if(webglAvailable()) state.view3d = true;
// i18n: język startowy wg wyboru użytkownika (localStorage) / locale przeglądarki → EN domyślnie, PL dla polskiego locale.
initLang();
syncLangBar();   // odbij wykryty język na pasku #langbar (statyczna powłoka, poza #app)
syncSessionBar();   // etykieta toggle'a sesji (V10/D1) w języku UI — powłoka poza #app, golden nietknięte
// U7: pacjent z linku (hash #p=…) na starcie → tryb HINTS „Własny" (dane tylko lokalnie).
if(/[#&]p=/.test(location.hash) && loadHintsFromHash()){ state.mode="hints"; state.screen="hints"; state.hintsQuiz=false; state.hintsQuizReveal=false; }
render();



window.__OTOREPO_TEST__ = { Vestibular, NeuroVOR, Scene3D, composeHead, stepHeadQ, stepGravity, bodyJoints, poseSpec, gravArrowFor, genPlan, MANEUVERS, CANALS, DIAG, CANAL_OF, HINTS_PRESETS, TORSO_Q, state, render, startManeuver, setGuideSide, openTest, setDiagSide, setDixObs, setVariant, setMechanism, setBltScenario, maneuverTimeline, actTimeline, sessionSim, readhesion, SESSION_REST, SIT_SEG, ldtPhases, nullScan, nullYawOf, engineXi, provokeQ, spvTrace, XI_VIS, MECHS_BY_PHENO, mechOf, variantOfMech, persistentOf, SHORT_PHI0, rollShortPhases, ENS_GRID, ensembleSim, maneuverSim, toggleEnsembleMode, toggleSessionMode, resetSession, sessionProvoke, seedSessionFromScenario, sessionManeuver, sessionRest, openHints, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsFix, setHintsGaze, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev };
