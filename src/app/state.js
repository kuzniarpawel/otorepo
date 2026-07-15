// Stan aplikacji (jeden mutowalny obiekt; bez importów).
import { NeuroVOR } from '../engine/neuro-vor.js';
import { HINTS_PRESETS } from './actions.js';


/* ============ Stan ============ */
const state={
  mode:"treat", screen:"setup",
  side:"P", canal:null, maneuverKey:null, testKey:null, variant:"canalo", dixObs:"post", dixRep:0,   // dixRep = numer powtórzenia prowokacji Dix-Hallpike (męczliwość oczopląsu)
  diagCentral:false,   // przełącznik karty klasyfikacji: false=obwodowy (BPPV, klasyfikacja Bárány) · true=ośrodkowy (CPN)
  size:"medium",                                   // rozmiar/gęstość złogu otoconiów (small|medium|big) → dynamika + holdy + animacja
  plan:null, step:0,
  total:0, elapsedMs:0, running:false,
  _manKey:null, _manSim:null,
  autoAdvance:false, sound:true, autostart:false,
  // HINTS / różnicowanie (etap: silnik NeuroVOR)
  hintsScenario:"neuritisR", hintsSide:"P", hintsFix:false, hintsGaze:0,   // scenariusz(engine key) · ucho zajęte neuronitis(L/P) · fiksacja · spojrzenie(-1/0/+1)
  hintsComp:0, hintsRecovery:false, hintsHitSide:null,       // kompensacja ośrodkowa c(0..1) · regeneracja (Bechterew) · ostatnio pchnięte ucho — etap 6
  // „Matematyczny pacjent" (etap 7 / faza UI). hintsCustom = pełny obiekt makePatient (null → tryb scenariuszowy).
  hintsCustom:null, hintsAdvanced:false, hintsQuiz:false, hintsQuizReveal:false,
  hintsNerveEar:"P", hintsNerveBranch:"superior", hintsNerveSev:0.6,   // szybki selektor wypadnięcia gałęzi nerwu
  hintsPreset:null,                                // aktywny preset/tryb (klucz HINTS_PRESETS lub "neuritis") — podświetlenie + dynamiczna ramka
  hintsPlane:"HC", hintsHitCanal:"horizontal",     // vHIT: wybrana płaszczyzna (HC/RALP/LARP) · kanał ostatniego pchnięcia
  hintsSCDS:null,                                  // SCDS: ostatni bodziec (obiekt pressureStimulus) lub null
  view3d:false,                                    // karta „Ułożenie": 3D (WebGL) vs SVG. Literał=false (golden bez WebGL); Etap 5: main.js ustawia true na boot gdy webglAvailable()
};

export { state };
