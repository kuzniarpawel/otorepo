/* OTOREPO — model przebiegu klinicznego (Blok 5).
 *
 * Dokument użytkownika: „Zamiana zbioru funkcji w jasny proces: Wywiad → Próba → Oczopląs →
 * Interpretacja → Manewr → Kontrola", z kryterium odbioru, które jest tu najważniejsze:
 *
 *     „Zmiana wcześniejszej odpowiedzi nie pozostawia NIEWIDOCZNIE nieaktualnej interpretacji."
 *
 * To kryterium bezpieczeństwa, nie kosmetyka. Dziś aplikacja pozwala wybrać Epleya z rekomendacji
 * dla (Dix-Hallpike · kanalolitiaza · prawa), wrócić, odwrócić kartę mechanizmu na kupulolitiazę —
 * i dalej trzymać Epleya, choć zalecany jest wtedy Semont. Nic tego nie sygnalizuje.
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * ZERO importów, zero DOM, zero `state` z modułu — stan wchodzi ARGUMENTEM. Dzięki temu
 * tools/flow-check.mjs importuje go w gołym Node (wzorzec tools/bridge-check.mjs), a wyrocznia
 * maszyny stanów o znaczeniu klinicznym nie zależy od jsdom ani od kolejności ładowania modułów.
 * Import samego state.js też jest zakazany: state.js importuje NeuroVOR i HINTS_PRESETS z
 * actions.js, więc wciągnąłby do czystej bramki cały graf renderera.
 * Funkcje, które potrzebują wiedzy klinicznej z maneuvers.js (recommend/CANAL_OF/DIAG), dostają
 * ją WSTRZYKNIĘCIEM — wzorzec „inject-for-purity" z toru VOG.
 *
 * Napisy trzymamy jako SUROWE pary pl/en — wywołanie t() na poziomie modułu zamroziłoby język,
 * bo moduły ładują się przed initLang() (ta sama pułapka co w nav-model.js).
 */

/* ============ Kroki ============ */

// `screen`/`mode` = dokąd prowadzi krok; `anchor` = selektor karty, do której przewijamy.
// Kroki 2-4 dzielą dziś jeden ekran (renderDiag) — rozdzielą je Bloki 7-9.
// `pending:true` = funkcji jeszcze nie ma; `pendingGdy` = jest, ale nie przy każdej próbie.
export const FLOW_STEPS = [
  // Blok 6: krok przestał być zaślepką. Kwalifikacja wstępna wg taksonomii czas-i-wyzwalacze
  // (GRACE-3, engine_doc [H24]) — wybiera ŚCIEŻKĘ badania, nie stawia rozpoznania.
  { id: 'history',   pl: 'Wywiad',        en: 'History',
    plDesc: 'czas trwania, wyzwalacz, czerwone flagi', enDesc: 'time course, trigger, red flags',
    mode: 'diag', screen: 'triage' },

  { id: 'test',      pl: 'Próba',         en: 'Test',
    plDesc: 'wybór i wykonanie testu pozycyjnego', enDesc: 'choose and perform the positional test',
    mode: 'diag', screen: 'diag', anchor: () => '[data-flow-anchor="test"]',
    // Bez wybranej próby ekran testu nie ma z czego się zbudować (renderDiag czyta DIAG[testKey]
    // i zaraz potem D.canal — przy null to TypeError PRZED przypisaniem innerHTML, czyli zawis
    // bez śladu na ekranie). Kierujemy wtedy na ekran WYBORU próby.
    wymaga: s => !!s.testKey, zamiast: { screen: 'setup', mode: 'diag' } },

  // Karta wprowadzania obserwacji (.obsrow, svg-screens.js:1106) renderuje się WYŁĄCZNIE dla
  // Dix-Hallpike'a. Przy pozostałych próbach nie ma dziś czego wpisać — pełny formularz
  // obserwacji dla wszystkich prób to Blok 8.
  /* Blok 8 dał temu krokowi WŁASNY EKRAN i pełny formularz dla WSZYSTKICH czterech prób,
     więc `pendingGdy` znika: nie ma już próby, przy której nie da się nic wpisać. Cel to
     `screen:'obs'`, a nie kotwica na ekranie próby — rozdzielenie jest fizyczne, bo dopóki
     formularz obserwacji sąsiaduje z animacją oczopląsu PRZEWIDYWANEGO, „zgodność" mierzy
     tylko to, czy ktoś dobrze przepisał to, co widzi na ekranie. */
  { id: 'nystagmus', pl: 'Oczopląs',      en: 'Nystagmus',
    plDesc: 'co widać w próbie', enDesc: 'what the test shows',
    mode: 'diag', screen: 'obs', anchor: () => null,
    wymaga: s => !!s.testKey, zamiast: { screen: 'setup', mode: 'diag' } },

  { id: 'interpret', pl: 'Interpretacja', en: 'Interpretation',
    plDesc: 'kanał, strona, mechanizm', enDesc: 'canal, side, mechanism',
    mode: 'diag', screen: 'diag', anchor: () => '[data-flow-anchor="interpret"]',
    wymaga: s => !!s.testKey, zamiast: { screen: 'setup', mode: 'diag' } },

  // Ekran przewodnika istnieje dopiero, gdy jest plan. Bez niego celujemy w ekran wyboru
  // kanału/manewru, który jest odporny na pusty stan.
  { id: 'maneuver',  pl: 'Manewr',        en: 'Maneuver',
    plDesc: 'repozycja złogu', enDesc: 'debris repositioning',
    mode: 'treat', screen: 'guide',
    wymaga: s => !!(s.plan && s.maneuverKey), zamiast: { screen: 'setup', mode: 'treat' } },

  { id: 'followup',  pl: 'Kontrola',      en: 'Follow-up',
    plDesc: 'próba kontrolna po repozycji', enDesc: 'control test after repositioning',
    pending: true },
];

export const FLOW_IDS = FLOW_STEPS.map(s => s.id);
export function flowStep(id) { return FLOW_STEPS.find(s => s.id === id) || null; }

// Czy krok jest niedostępny W TYM STANIE: albo go jeszcze nie ma w narzędziu (`pending`),
// albo istnieje tylko przy części prób (`pendingGdy`).
export function stepPending(s, id) {
  const st = flowStep(id);
  if (!st) return false;
  if (st.pending) return true;
  return typeof st.pendingGdy === 'function' ? !!st.pendingGdy(s) : false;
}

// Dokąd naprawdę prowadzi dotknięcie kroku. NIGDY nie zwraca ekranu, którego stan nie udźwignie.
export function stepTarget(s, id) {
  const st = flowStep(id);
  if (!st || stepPending(s, id)) return null;
  const pelny = typeof st.wymaga !== 'function' || st.wymaga(s);
  const cel = pelny ? { screen: st.screen, mode: st.mode } : { ...st.zamiast };
  return { screen: cel.screen, mode: cel.mode, anchor: pelny && st.anchor ? st.anchor(s) : null, pelny };
}

/* ============ Statusy ============
   Pięć nazw pochodzi wprost z dokumentu; dwie dołożone, każda z powodem:
     pending — kroku jeszcze NIE MA. Bez tego trzeba by go ukryć (stepper kłamałby, że proces ma
               cztery kroki) albo udawać, że działa.
     stale   — nośnik kryterium odbioru nr 2. „Niewiarygodny" znaczy co innego: obserwacja BYŁA
               zrobiona, ale nie da się na niej polegać. Tutaj wniosek jest poprawny — tyle że
               dla NIEAKTUALNYCH wejść. */
export const FLOW_STATUS = {
  todo:       { pl: 'niewykonany',        en: 'not done',          glif: '' },
  active:     { pl: 'aktywny',            en: 'active',            glif: '▸' },
  done:       { pl: 'zakończony',         en: 'done',              glif: '✓' },
  unreliable: { pl: 'niewiarygodny',      en: 'unreliable',        glif: '?' },
  skipped:    { pl: 'pominięty',          en: 'skipped',           glif: '–' },
  pending:    { pl: 'w przygotowaniu',    en: 'in preparation',    glif: '⋯' },
  stale:      { pl: 'wymaga ponownego przeliczenia', en: 'needs recalculation', glif: '⟳' },
};

/* ============ Odcisk wejść decyzyjnych ============
   Wejścia, które REALNIE wyznaczają zalecany manewr i klasyfikację — sprawdzone w kodzie:
     recommend(testKey, variant)                            → maneuvers.js:548
     diagClassifyCard(effCanal, variant, effSide, antMode)   → svg-screens.js:1129
       gdzie effCanal/effSide/antMode wyprowadzają się z (testKey, side, dixObs)
     diagCentral                                            → „repozycja niewskazana"

   CELOWO POZA ODCISKIEM:
     dixRep — zmienia wyłącznie amplitudę na pasku męczliwości, nie zmienia zalecenia. Wciągnięcie
              go dawałoby alarm przy KAŻDYM „Powtórz prowokację", czyli dokładnie wtedy, gdy
              klinicysta pracuje zgodnie z protokołem. Ostrzeżenie, które krzyczy bez powodu,
              przestaje być czytane.
     size   — zmienia czasy utrzymania pozycji; pickSize sam przebudowuje plan (actions.js:204).
     lang   — nie jest wejściem klinicznym. */
export function decisionInputs(s) {
  const testKey = s.testKey || null;
  return {
    testKey,
    variant: s.variant || null,
    // dixObs ma znaczenie WYŁĄCZNIE w Dix-Hallpike (antMode liczony tylko dla 'dix',
    // svg-screens.js:1041). Przy innych próbach pole trzyma wartość zresetowaną przez openTest,
    // więc porównywanie go wprost dawałoby fałszywe alarmy przy zmianie próby tam i z powrotem.
    dixObs: testKey === 'dix' ? (s.dixObs || 'post') : null,
    side: s.side || null,
    central: !!s.diagCentral,
  };
}

export function sameInputs(a, b) {
  if (!a || !b) return false;
  return a.testKey === b.testKey && a.variant === b.variant && a.dixObs === b.dixObs
      && a.side === b.side && a.central === b.central;
}

// Czy w chwili zapisu odcisku dane pole było w ogóle ustalone. Wejście „Znam kanał i stronę"
// zapisuje odcisk z samych literałów ze state.js — pola, których użytkownik nigdy nie dotknął,
// nie mogą później generować dryfu („zmieniono próbę: null → dix" nie jest zdaniem klinicznym).
function bylUstalony(was, pole) { return was[pole] !== null && was[pole] !== undefined; }

// Świeży rekord kroku „Manewr". `viaInterpret` rozróżnia dwie drogi dojścia: z rekomendacji na
// ekranie testu (kroki 2-4 zrobione) albo wprost z listy kanałów (interpretacji NIE BYŁO).
// `planSide` to strona, dla której plan naprawdę zbudowano — państwo `state.side` zmienia się
// także wewnątrz manewru (setGuideSide), więc jedno pole nie udźwignie obu ról.
export function noteManeuver(s, key, viaInterpret, planSide) {
  return {
    key, viaInterpret: !!viaInterpret,
    planSide: planSide || s.side || null,
    canal: s.canal || null,
    consumed: false,
    // Ustawiane, gdy NAWIGACJA (a nie użytkownik) wyczyściła sygnał ostrzegawczy — patrz
    // maneuverDrift. Odróżnienie jest istotne: samo porównanie pól nie widzi różnicy między
    // „klinicysta świadomie cofnął flagę" a „wybór próby cofnął ją za niego".
    zatarte: false,
    inputs: decisionInputs(s),
  };
}

/* Manewry KONWERSJI: ich sensem jest zamiana postaci kupulolitycznej w kanalolityczną, więc
   zmiana wariantu PO nich jest dowodem skuteczności, a nie unieważnieniem wniosku. Aplikacja
   sama do tego instruuje (maneuvers.js:155, :562; svg-screens.js:946/948). Bez tej listy
   prawidłowo przeprowadzony protokół zapalałby „wymaga ponownego przeliczenia". */
export const KONWERSJE = { gufoniApo: { z: 'cupulo', na: 'canalo' }, bascule: { z: 'cupulo', na: 'canalo' } };


/* Czy trzymany manewr wynika z NIEAKTUALNYCH wejść? Zwraca listę RÓŻNIC (nie samo true/false) —
   komunikat „coś się zmieniło" jest bezużyteczny, klinicysta musi wiedzieć CO i CO Z TEGO WYNIKA. */
export function maneuverDrift(s) {
  const m = s.flow && s.flow.maneuver;
  if (!m || !m.inputs) return [];
  // Manewr WYKONANY przestaje być wnioskiem oczekującym. Nowa interpretacja otwiera nowy odcisk;
  // bez tego każdy prawidłowy test kontrolny po repozycji zapalałby alarm nad zakończoną serią.
  if (m.consumed) return [];
  const now = decisionInputs(s), was = m.inputs, out = [];

  if (bylUstalony(was, 'central') && was.central !== now.central) {
    out.push(now.central
      ? { pole: 'central', pl: 'przełączono na obraz OŚRODKOWY (CPN) — repozycja jest wtedy przeciwwskazana',
          en: 'switched to the CENTRAL picture (CPN) — repositioning is then contraindicated', waga: 'krytyczna' }
      : { pole: 'central', pl: 'wrócono do obrazu obwodowego (BPPV)',
          en: 'returned to the peripheral picture (BPPV)', waga: 'zwykla' });
  }
  if (bylUstalony(was, 'testKey') && was.testKey !== now.testKey)
    out.push({ pole: 'testKey', pl: 'zmieniono próbę — inna próba wskazuje inny kanał',
               en: 'the test was changed — a different test points to a different canal', waga: 'krytyczna' });

  // Konwersja: oczekiwane przejście wariantu po manewrze konwertującym to POSTĘP, nie dryf.
  const konw = KONWERSJE[m.key];
  const konwersjaOczekiwana = !!konw && was.variant === konw.z && now.variant === konw.na;
  if (bylUstalony(was, 'variant') && was.variant !== now.variant && !konwersjaOczekiwana)
    out.push({ pole: 'variant', pl: 'zmieniono mechanizm (kanalolitiaza ↔ kupulolitiaza) — zalecany manewr jest inny',
               en: 'the mechanism was changed (canalithiasis ↔ cupulolithiasis) — the recommended maneuver differs', waga: 'krytyczna' });

  /* dixObs porównujemy TYLKO w obrębie tej samej próby: przy zmianie testu pole jest
     normalizowane do null, więc raportowanie go dokładałoby drugi, nieprawdziwy powód.

     PORÓWNUJEMY WNIOSEK, NIE SUROWĄ WARTOŚĆ (Blok 8). Od chwili, gdy wybór próby przestał
     wpisywać domyślne `dixObs='post'` (pusty opis nie ma prawa nieść odpowiedzi), surowe
     porównanie zapalałoby alarm KRYTYCZNY ze zdaniem „to zmienia wskazany kanał" na przejściu
     null → 'post', czyli przy opisaniu TYPOWEGO oczopląsu, który niczego nie zmienia:
     kanał tylny → Epley w obu stanach. To jest to samo zmęczenie alarmowe, przez które
     `dixRep` nie wszedł do odcisku.

     Straż `bylUstalony` MUSI TU ZNIKNĄĆ, i to jest defekt ważniejszy od powyższego, znaleziony
     przypadkiem testowym DR-B: przy `was.dixObs === null` straż wyciszała porównanie CAŁKOWICIE,
     więc opisanie DOWNBEATU po wybraniu manewru nie zapalałoby ŻADNEGO alarmu — a to jest
     przejście od kanału tylnego do przedniego, czyli zmiana i kanału, i strony, i manewru.
     Warunek `now.testKey === 'dix'` sam wyklucza drogę „Znam kanał i stronę" (tam `testKey`
     jest null, więc równość prób nie zachodzi). */
  const wnWas = was.dixObs === 'ant', wnNow = now.dixObs === 'ant';
  if (was.testKey === now.testKey && now.testKey === 'dix' && wnWas !== wnNow)
    out.push({ pole: 'dixObs', pl: 'zmieniono zaobserwowany oczopląs — to zmienia wskazany kanał',
               en: 'the observed nystagmus was changed — this changes the indicated canal', waga: 'krytyczna' });

  if (bylUstalony(was, 'side') && was.side !== now.side)
    out.push({ pole: 'side', pl: 'zmieniono stronę',
               en: 'the side was changed', waga: 'krytyczna' });

  /* SYGNAŁ ZATARTY PRZEZ NAWIGACJĘ. Samo porównanie pól ma tu ślepą plamkę: wybór innej próby
     zeruje diagCentral i dixObs (actions.js), więc po ciągu „Epley → oznacz CPN → inna próba →
     z powrotem ta sama próba" WSZYSTKIE pola odcisku wracają do wartości sprzed decyzji i
     aplikacja meldowałaby „wniosek zgodny" u pacjenta oznaczonego jako podejrzany o przyczynę
     OŚRODKOWĄ. Flaga jest ustawiana wyłącznie wtedy, gdy nawigacja skasowała sygnał
     ostrzegawczy — NIE przy zwykłym odwracaniu karty mechanizmu tam i z powrotem, bo ta karta
     jest z założenia narzędziem porównawczym i alarm po każdym jej obejrzeniu byłby szumem. */
  if (!out.length && m.zatarte)
    out.push({ pole: 'zatarte', pl: 'zmiana próby wyczyściła wcześniejszy sygnał ostrzegawczy (obraz ośrodkowy albo downbeat) — oceń go ponownie',
               en: 'changing the test cleared an earlier warning signal (central picture or downbeat) — assess it again', waga: 'krytyczna' });

  return out;
}

/* ZGODNOŚĆ MANEWRU Z WEJŚCIAMI — drugi, niezależny człon. Sam dryf mierzy tylko, czy wejścia się
   RUSZYŁY; nie łapie sytuacji, w której wejścia stoją, a manewr do nich nie pasuje (Roll →
   apogeotropowy → zakładka Repozycja → Epley: żadne pole odcisku się nie zmienia, a stepper
   pokazywałby „Interpretacja: kanał poziomy" i „Manewr: Epley (kanał tylny)" oba na zielono).
   Wiedza kliniczna WSTRZYKIWANA, bo moduł jest bezimportowy.
   deps = { recommend(testKey,variant) → {primary,alts}, canalOf(maneuverKey) → kanał,
            testCanal(testKey) → kanał próby } */
export function maneuverAgreement(s, deps) {
  const m = s.flow && s.flow.maneuver;
  if (!m || !deps || typeof deps.recommend !== 'function') return null;
  if (m.consumed) return { zgodnosc: 'consumed' };
  if (s.diagCentral) return { zgodnosc: 'przeciwwskazany' };
  if (!s.testKey) return { zgodnosc: 'nieznana' };            // droga „Znam kanał i stronę" — nie ma z czym porównać

  const antMode = s.testKey === 'dix' && s.dixObs === 'ant';
  // antMode omija recommend() także w aplikacji (svg-screens.js:1133) — downbeat kieruje na
  // kanał przedni ucha przeciwnego, a tam jedynym manewrem jest Yacovino.
  const rec = antMode ? { primary: 'yacovino', alts: [] } : deps.recommend(s.testKey, s.variant);
  if (!rec) return { zgodnosc: 'nieznana' };

  if (m.key === rec.primary) return { zgodnosc: 'pierwszy', primary: rec.primary };
  if ((rec.alts || []).includes(m.key)) return { zgodnosc: 'alternatywa', primary: rec.primary };

  const kanalManewru = typeof deps.canalOf === 'function' ? deps.canalOf(m.key) : null;
  const kanalWejsc = antMode ? 'anterior'
    : (typeof deps.testCanal === 'function' ? deps.testCanal(s.testKey) : null);
  return { zgodnosc: 'rozjazd', primary: rec.primary, kanalManewru, kanalWejsc };
}

/* ============ Wiarygodność ============
   Aplikacja mówi wprost w czterech miejscach, że przy czystym downbeacie i w deep head-hangu
   strony NIE DA SIĘ ustalić oczopląsem (svg-screens.js:1114, :1139; maneuvers.js:556, :575).
   Meldowanie wtedy „Oczopląs: zakończony · Interpretacja: zakończona" przeczy karcie, nad którą
   pasek wisi — stąd status „niewiarygodny" zamiast „zakończony". */
export function lateralizacjaNiepewna(s) {
  if (!s.testKey) return false;
  if (s.testKey === 'headhang') return true;
  return s.testKey === 'dix' && s.dixObs === 'ant';
}

/* ============ Krok aktywny ============ */

// Wyprowadzany z ekranu i trybu, a nie trzymany osobno. Osobne pole rozjeżdżałoby się przy każdej
// nawigacji, która je pomija (zakładki trybów wewnątrz #app, „Rozpocznij: Epley", przycisk „Wróć").
export function activeStepId(s) {
  if (s.screen === 'triage') return 'history';
  if (s.screen === 'obs') return 'nystagmus';        // własny ekran kroku „Oczopląs" (Blok 8)
  if (s.screen === 'guide') return 'maneuver';
  if (s.screen === 'diag') {
    // Na ekranie testu współistnieją dziś trzy kroki. Bierzemy najdalszy, który użytkownik
    // naprawdę zaczął — inaczej pasek stałby na „Próba" przez cały czas pracy.
    const f = s.flow || {};
    if (f.interpretSeen) return 'interpret';
    if (f.obsSeen && !stepPending(s, 'nystagmus')) return 'nystagmus';
    return 'test';
  }
  if (s.screen === 'setup') return s.mode === 'treat' ? 'maneuver' : 'test';
  return null;                       // start / hints — przebieg kliniczny nie jest wtedy aktywny
}

/* WIDOCZNOŚĆ PASKA. Osobna, jawna bramka — activeStepId NIE wystarczy, bo dla screen='setup'
   zwraca 'test' także przy mode='hints' i na zaślepce „Nauka" (applyArea zostawia wtedy
   screen='setup', mode='diag'). Pasek nad zaślepką „Moduł w przygotowaniu" nie tylko zajmuje
   miejsce — on KŁAMIE („Krok 2 z 6 — Próba"). Nad HINTS sugerowałby, że różnicowanie ostrego
   zespołu przedsionkowego jest etapem ścieżki BPPV, czyli odwrotnie niż GRACE-3. */
export function flowVisible(s) {
  if (!s) return false;
  if (s.area && s.area !== 'diag') return false;          // learn / lab / profile / start
  if (s.mode === 'hints') return false;
  if (s.screen === 'start' || s.screen === 'hints') return false;
  return s.screen === 'setup' || s.screen === 'diag' || s.screen === 'obs' || s.screen === 'guide' || s.screen === 'triage';
}

/* PODPIS STANU dla powłoki. Obserwator mutacji #app (shell.js) odświeża chrom tylko wtedy, gdy
   podpis się zmienił — a jego dotychczasowa wersja `screen|mode|step|side|area` NIE ZAWIERAŁA
   ani jednego pola, na którym stoi wykrywanie nieaktualności. Skutek: klinicysta przełączał na
   „Ośrodkowy — CPN", #app się przerysowywał, a pasek nie drgnął. Podpis musi objąć WSZYSTKO, co
   pasek pokazuje; wyrocznia pilnuje, że każde z tych pól faktycznie go zmienia. */
export function flowSignature(s) {
  if (!s) return '';
  const f = s.flow || {}, m = f.maneuver || null;
  return [
    s.screen, s.mode, s.area, s.step, s.side, s.lang,
    s.testKey, s.variant, s.dixObs, s.diagCentral ? 1 : 0, s.decisionSeq | 0,
    s.canal, s.maneuverKey, s.stepMapOpen ? 1 : 0,
    f.testSeen ? 1 : 0, f.obsSeen ? 1 : 0, f.interpretSeen ? 1 : 0,
    f.triage ? `${f.triage.complete ? 1 : 0}:${f.triage.kategoria}:${f.triage.sciezka}:${f.triage.pewnosc}` : '-',
    s.triageStep || '',
    m ? `${m.key}:${m.planSide}:${m.viaInterpret ? 1 : 0}:${m.consumed ? 1 : 0}:${m.inputs ? m.inputs.seq : ''}` : '-',
  ].join('|');
}

/* ============ Statusy kroków ============
   Reguła nadrzędna: status opisuje to, co użytkownik ZROBIŁ, a nie to, co aplikacja ma w stanie.
   `state.testKey` bywa ustawione bez otwarcia ekranu testu, więc samo jego istnienie NIE znaczy
   „krok zakończony". */
export function flowStatuses(s, deps) {
  const f = s.flow || {};
  const akt = activeStepId(s);
  const drift = maneuverDrift(s);
  const zgoda = maneuverAgreement(s, deps);
  const m = f.maneuver || null;
  const niepewna = lateralizacjaNiepewna(s);
  const out = [];

  for (const st of FLOW_STEPS) {
    let status = 'todo', powodPl = '', powodEn = '';
    const wPrzygotowaniu = stepPending(s, st.id);

    if (wPrzygotowaniu) {
      status = 'pending';
      if (st.id === 'history') {
        powodPl = 'Moduł wywiadu i kwalifikacji jest w przygotowaniu. Czerwone flagi oceniaj samodzielnie przed manewrem.';
        powodEn = 'The history and triage module is in preparation. Assess red flags yourself before any maneuver.';
      } else if (st.id === 'followup') {
        powodPl = 'Moduł kontroli po repozycji jest w przygotowaniu. Powtórz próbę ręcznie, wracając do kroku „Próba”.';
        powodEn = 'The post-repositioning control module is in preparation. Repeat the test manually via the "Test" step.';
      } else {
        // Jedyny dziś przypadek: obserwację wpisuje się wyłącznie w Dix-Hallpike'u.
        powodPl = 'Wprowadzanie zaobserwowanego oczopląsu istnieje na razie tylko dla manewru Dix–Hallpike’a. Przy tej próbie aplikacja pokazuje wzorzec PRZEWIDYWANY przez model — porównaj go z tym, co widzisz u pacjenta.';
        powodEn = 'Entering the observed nystagmus currently exists only for the Dix–Hallpike. For this test the app shows the pattern PREDICTED by the model — compare it with what you see in the patient.';
      }
    } else if (st.id === 'history') {
      // Wynik kwalifikacji jest STRESZCZANY do stanu przez flow-state.syncTriage — model zostaje
      // bezimportowy, a wyrocznia flow:check nie musi znać kwestionariusza.
      const tr = f.triage;
      if (tr && tr.complete) {
        status = 'done';
        if (tr.czerwona) {
          powodPl = 'Kwalifikacja wykazała czerwoną flagę — przed manewrem potrzebna pilna ocena.';
          powodEn = 'Triage found a red flag — urgent evaluation is needed before any maneuver.';
        } else if (tr.pewnosc === 'niska') {
          status = 'unreliable';
          powodPl = 'Kwalifikacja niepełna — ścieżka wybrana na podstawie niepewnych odpowiedzi.';
          powodEn = 'Triage incomplete — the pathway was chosen from uncertain answers.';
        }
      }
    } else if (st.id === 'test') {
      if (f.testSeen) status = 'done';
    } else if (st.id === 'nystagmus') {
      if (f.obsSeen) status = niepewna ? 'unreliable' : 'done';
      if (status === 'unreliable') {
        powodPl = 'Przy czystym downbeacie strony nie da się ustalić oczopląsem — lateralizacja pozostaje niepewna.';
        powodEn = 'With a pure downbeat the side cannot be established from the nystagmus — lateralization remains uncertain.';
      }
    } else if (st.id === 'interpret') {
      if (f.interpretSeen) {
        status = niepewna ? 'unreliable' : 'done';
        if (status === 'unreliable') {
          powodPl = 'Kanał przedni: strona wynika z kontekstu i reakcji na manewr, nie z kierunku oczopląsu.';
          powodEn = 'Anterior canal: the side follows from context and response to the maneuver, not from the nystagmus direction.';
        }
      } else if (m && !m.viaInterpret) {
        // Wejście „Znam kanał i stronę" prowadzi prosto do manewru — dokument przewiduje status
        // „pominięty Z UZASADNIENIEM".
        status = 'skipped';
        powodPl = 'Manewr wybrano bezpośrednio z listy kanałów — kanał i strona pochodzą od Ciebie, nie z interpretacji próby.';
        powodEn = 'The maneuver was chosen directly from the canal list — canal and side come from you, not from an interpretation of the test.';
      }
    } else if (st.id === 'maneuver') {
      if (m) {
        if (drift.length) status = 'stale';
        else if (zgoda && zgoda.zgodnosc === 'przeciwwskazany') {
          status = 'stale';
          powodPl = 'Obraz oznaczono jako ośrodkowy (CPN) — repozycji nie wykonuj przed oceną neurologiczną.';
          powodEn = 'The picture is marked as central (CPN) — do not perform repositioning before a neurological evaluation.';
        } else if (zgoda && zgoda.zgodnosc === 'rozjazd') {
          status = 'stale';
          powodPl = 'Wybrany manewr nie odpowiada bieżącej interpretacji.';
          powodEn = 'The chosen maneuver does not match the current interpretation.';
        } else if (zgoda && zgoda.zgodnosc === 'alternatywa') {
          status = 'done';
          powodPl = 'Manewr dopuszczalny, ale pierwszym rzutem jest teraz inny.';
          powodEn = 'The maneuver is acceptable, but a different one is now first-line.';
        } else status = 'done';
      }
    }

    if (status === 'todo' && st.id === akt) status = 'active';
    // „Aktywny" nie kasuje ostrzeżenia: krok w trakcie, ale oparty na nieaktualnych wejściach,
    // musi dalej krzyczeć. Kolejność jest tu istotna i dlatego jest osobnym warunkiem.
    else if (st.id === akt && status === 'done') status = 'active';

    out.push({
      id: st.id, status, pending: wPrzygotowaniu,
      active: st.id === akt,
      osiagalny: !wPrzygotowaniu,
      powodPl, powodEn,
      drift: st.id === 'maneuver' ? drift : [],
      zgodnosc: st.id === 'maneuver' && zgoda ? zgoda.zgodnosc : null,
    });
  }
  return out;
}

// Następny SENSOWNY krok — dokument: „użytkownik zawsze widzi bieżący krok i możliwy następny".
// Kroki `pending` przeskakujemy: wskazywanie jako „następny" czegoś, czego nie da się otworzyć,
// byłoby ślepą uliczką.
export function nextStepId(s, deps) {
  const st = flowStatuses(s, deps);
  const akt = activeStepId(s);
  const i = FLOW_IDS.indexOf(akt);
  // Nieaktualny manewr wyprzedza wszystko: następnym krokiem jest naprawa, nie posuwanie się dalej.
  const man = st.find(x => x.id === 'maneuver');
  if (man && man.status === 'stale' && akt !== 'interpret' && !stepPending(s, 'interpret')) return 'interpret';
  if (i < 0) return 'test';
  for (let j = i + 1; j < FLOW_IDS.length; j++) if (!st[j].pending) return st[j].id;
  return null;
}

// Czy krok da się w ogóle otworzyć.
export function stepReachable(s, id) {
  if (!flowStep(id)) return false;
  return !stepPending(s, id);
}

// Zwięzły podpis paska na telefonie: „Krok 2 z 6 — Próba".
export function stepSummary(s, lang) {
  const akt = activeStepId(s);
  const i = FLOW_IDS.indexOf(akt);
  const st = flowStep(akt);
  if (i < 0 || !st) return null;
  return { nr: i + 1, total: FLOW_IDS.length, label: lang === 'pl' ? st.pl : st.en, id: akt };
}
