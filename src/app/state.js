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
  // --- Blok 12: BADANIE HINTS/HINTS+ Z KWALIFIKACJA. Czyta je src/app/hints-model.js (czysty),
  //     pisze WYLACZNIE src/app/hints-state.js. Osobne od pol symulatora wyzej i to jest cala
  //     roznica miedzy tymi dwoma torami: wyzej mieszka model fizjologii, tutaj obserwacja klinicysty.
  hintsBadanie:{},          // odpowiedzi per skladowa: {hit, oczoplas, skew, sluch, chod, wiarygodnosc}
  hintsPowodNiewiar:null,   // powod niewiarygodnosci badania (slownik zamkniety Bloku 12)
  hintsPominiecie:null,     // SWIADOME pominiecie kwalifikacji — powod ze slownika; null = nie pominieto
  hintsPrzeszkolenie:null,  // deklaracja badajacego: 'tak' | 'nie' | null (GRACE-3: HINTS bez przeszkolenia bywa mylacy)
  hintsKrok:null,           // telefon: skladowa pokazywana w tej chwili (null = pierwsza nieodpowiedziana)
  hintsBlad:null,           // powod ODMOWY wejscia przez bramke — ekran musi powiedziec, ze nie wpuscil i dlaczego
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
  triage:{},
                                                 // Blok 6: odpowiedzi kwalifikacji wstępnej {przebieg, wyzwalacz, oczoplas, flagi[]}. Czyta je src/app/triage-model.js (czysty)
  // Blok 8: rekordy obserwacji KLUCZOWANE PRÓBĄ (obs.dix, obs.roll, …) — zapis kliniczny nie
  // znika przez sam akt nawigacji między próbami. Pisze do nich WYŁĄCZNIE src/app/obs-state.js.
  zegar:null, ukryteOd:null, luka:0, wakeOK:null,   // Blok 10 (kryterium 3): zegar SCIENNY utrzymania pozycji (hold-clock.js), moment ukrycia ekranu, dlugosc niepotwierdzonej przerwy, wynik FAKTYCZNEJ proby blokady ekranu (null = jeszcze nie probowano)
  trybCzasu:"staly",   // Blok 10: tryb licznika pozycji — "staly" (czas protokolarny) | "doUstapienia" (protokol PODNIESIONY do przewidywanego czasu oczoplasu + zapas; nigdy skrocony)
  sideZrodlo:null,     // Blok 10: czy STRONA jest deklaracja uzytkownika, czy literalem "P" ze stanu poczatkowego. Symetryczne do variantZrodlo — bez tego karta doboru w trybie eksperckim pisalaby "strone podales Ty" nad wartoscia, ktorej nikt nie dotknal
  variantZrodlo:null,   // Blok 9: SKAD sie wzial state.variant — "wyprowadzony" (z opisu obserwacji) | "nadpisany" (recznie) | null (hipoteza modelu: ostatnia wartosc, bo animacja musi cos rysowac). Bez tego pola trzy rozne sytuacje wygladaly identycznie
  obs:{}, obsGrupa:null, obsPorownanie:false,                         // obsGrupa: rozwinięta grupa pytań na telefonie (czytana przez renderObs)
  obsOdciski:{},       // Blok 9: odcisk opisu per próba (pola wagi 3, bez kwarantannowanych). Liczy go obs-state.js przy KAŻDEJ mutacji rekordu; czyta decisionInputs — dzięki temu skasowanie opisu po wyborze manewru zapala „wymaga ponownego przeliczenia"
  triageStep:null,                                 // telefon: pytanie pokazywane w danej chwili (null = po kolei wg nextQuestionId)
  // Blok 11: KONTROLA PO MANEWRZE. `kontrole` to historia serii (jeden wpis na manewr, indeks
  // trzyma flow.maneuver.kontrolaIdx); pisze do niej WYLACZNIE src/app/followup-state.js, i tylko
  // przez straznika danych. Wpis nie niesie zegara — patrz followup-model.wpisKontroli.
  kontrole:[], kontrolaPowod:null, zakonczeniePyta:false, kontrolaBlad:null,   // wynik kontroli per manewr · powod niewiarygodnosci (slownik Bloku 8) · dwustopniowe potwierdzenie zakonczenia sesji · powod ODMOWY zapisu przez straznika danych (ekran musi powiedziec, ze nie zapisal)
  decisionSeq:0,                                 // MONOTONICZNY licznik świadomych decyzji interpretacyjnych (mechanizm/oczopląs/CPN). Rośnie tylko przy realnej zmianie wartości; nawigacja go NIE cofa — dzięki temu ciche przywrócenie diagCentral=false przez openTest nie gasi ostrzeżenia
  flow:{ testSeen:false, obsSeen:false, interpretSeen:false, maneuver:null },   // co użytkownik naprawdę zrobił + odcisk wejść z chwili wyboru manewru
};

export { state };
