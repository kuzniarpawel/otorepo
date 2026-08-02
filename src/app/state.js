// Stan aplikacji (jeden mutowalny obiekt; bez importów).
import { NeuroVOR } from '../engine/neuro-vor.js';
import { HINTS_PRESETS } from './actions.js';


/* ============ Stan ============ */
const state={
  mode:"treat", screen:"start",   // Blok 4: wejsciem jest ekran oparty na CELU, nie wybor modulu. Golden bez zmian: domOracle ustawia screen jawnie dla kazdego scenariusza (snapshot.mjs:305).
  side:"P", canal:null, maneuverKey:null, testKey:null, variant:"canalo", dixObs:null, dixRep:0,   // dixRep = numer powtórzenia prowokacji Dix-Hallpike (męczliwość oczopląsu)
  diagCentral:false,   // przełącznik karty klasyfikacji: false=obwodowy (BPPV, klasyfikacja Bárány) · true=ośrodkowy (CPN)
  diagPhaseFace:0,     // odsłonięta faza karty pozycji (Bow&Lean/Roll): 0=przód/bow · 1=tył/lean. W STANIE, by przetrwać re-render (np. przełącznik 3D nie przewraca karty)
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
  lang:"en",                                       // język UI: 'en' (domyślny) | 'pl'. Literał=EN; main.js initLang() ustawia wg locale/wyboru na boot. t(pl,en) w src/i18n.js czyta to pole (golden przypina 'pl' w snapshot.mjs)
  // --- Powłoka aplikacji (Blok 1/3). Pola czytane WYŁĄCZNIE przez src/app/shell.js; żadna
  //     wyrocznia nie serializuje obiektu state, więc dokładanie pól jest golden-neutralne.
  area:"start",                                    // aktywny obszar powłoki: start|diag|learn|lab|profile (Blok 3 wypełnia nawigację)
  reducedMotion:false,                             // ograniczenie ruchu: preferencja systemowa LUB własny przełącznik (Blok 2)
  stepMapOpen:false,                               // telefon: czy rozwinięta pełna mapa 6 kroków (stepper skrócony do „Krok X z 6")
  // --- Przebieg kliniczny (Blok 5). Czytane przez src/app/flow-model.js (czysty), zapisywane
  //     wyłącznie przez src/app/flow-state.js. Żadna wyrocznia nie serializuje obiektu state,
  //     więc dokładanie pól jest golden-neutralne.
  triage:{},                                       // Blok 6: odpowiedzi kwalifikacji wstępnej {przebieg, wyzwalacz, oczoplas, flagi[]}. Czyta je src/app/triage-model.js (czysty)
  triageStep:null,                                 // telefon: pytanie pokazywane w danej chwili (null = po kolei wg nextQuestionId)
  decisionSeq:0,                                 // MONOTONICZNY licznik świadomych decyzji interpretacyjnych (mechanizm/oczopląs/CPN). Rośnie tylko przy realnej zmianie wartości; nawigacja go NIE cofa — dzięki temu ciche przywrócenie diagCentral=false przez openTest nie gasi ostrzeżenia
  flow:{ testSeen:false, obsSeen:false, interpretSeen:false, maneuver:null },   // co użytkownik naprawdę zrobił + odcisk wejść z chwili wyboru manewru
};

export { state };
