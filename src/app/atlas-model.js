/* OTOREPO — MODEL ATLASU OTONEUROLOGICZNEGO (E6).
 *
 * ═══ PO CO ISTNIEJE ═══
 * Decyzja użytkownika 2026-08-22: program ma ZNAĆ wszystkie jednostki ICVD, ale ścieżka OSTRA
 * — ta, na której stoi GRACE-3 i HINTS — ma pozostać OGÓLNA. Rozpoznań się tam nie mnoży.
 * Jednostki szczegółowe mieszkają tutaj, w osobnym zakresie, do którego kwalifikacja LINKUJE,
 * zamiast kończyć się ślepo.
 *
 * To rozstrzyga D6. Poprzednie brzmienie mapy pokrycia w `engine_doc.txt` mówiło „OTOREPO jest
 * aplikacją o BPPV i ostrych zawrotach, NIE ATLASEM otoneurologii" — od tego etapu jest jednym
 * i drugim, ale w dwóch ROZŁĄCZNYCH zakresach. Rozłączność jest tu całą treścią decyzji.
 *
 * ═══ CZEGO TEN MODUŁ NIE ROBI — I DLACZEGO TO JEST WYMAGANIE, NIE SKROMNOŚĆ ═══
 * Nic nie liczy i NIE STAWIA ROZPOZNANIA. Wzorzec V28 (`vmCriteriaCard`): karta kryteriów jest
 * wyciągiem, nie kalkulatorem. Gdyby atlas orzekał, byłby najmocniejszym twierdzeniem klinicznym
 * w całej aplikacji — postawionym bez badania pacjenta, na samym akcie otwarcia zakładki.
 * Dlatego wpis mówi „kryterium A wymaga…", nigdy „jeśli pacjent ma…, to jest to X".
 *
 * Kwalifikacja wstępna linkuje tu przez POLE `atlas` w `triage-model.js`, które NIE JEST ścieżką:
 * `sciezka` zostaje kluczem trybu, bramkowanym przez `sciezkaDozwolona`, i kryterium odbioru nr 1
 * („HINTS nie jest proponowany przy napadach pozycyjnych") pozostaje nietknięte. Atlas jest
 * DESTYNACJĄ, nie drugą ścieżką — a przy czerwonej fladze nie ma go wcale, bo tam celem jest
 * działanie, a materiał do czytania rozcieńcza pilność (decyzja użytkownika 2026-08-22).
 *
 * ═══ WIĄZANIE Z KWALIFIKACJĄ IDZIE PRZEZ NAPIS, NIE PRZEZ IMPORT ═══
 * `triage-model.js` niesie KLUCZE jako gołe napisy i nie importuje tego pliku; ten plik nie wie
 * o kwalifikacji. Oba zostają liśćmi grafu, oba dają się sprawdzić w gołym Node na pełnym
 * iloczynie. Zgodność obu list pilnuje bramka (ATL7), a nie czujność — dokładnie tak jak
 * `cpn-model.js` rozwiązał rozjazd pięciu literałów czerwonych flag w D-CPN.
 *
 * ═══ PIĘĆ POL, Z KTÓRYCH DWA SĄ DYSCYPLINĄ KORPUSU, A NIE OZDOBĄ ═══
 *   `zrodlo`   — `[Hnn] Autor ROK`. Konwencja pilnowana przez `zrodla:check`. Numer może stać sam,
 *                ale jeśli towarzyszy mu oznaczenie, idzie ono ZARAZ po numerze i niesie rok.
 *   `kryteria` — PARAFRAZA. Repozytorium jest publiczne, a prace mają CC BY-NC albo — [H47],
 *                [H20], [H48] — „all rights reserved". Prozy nie przedrukowujemy. Ale PROGI
 *                LICZBOWE i STRUKTURA LOGICZNA (spójniki, liczba wymaganych punktów, operatory
 *                brzegowe) idą CO DO CYFRY: to fakty, nie ekspresja.
 *   `granice`  — CZEGO PRACA NIE MÓWI. Zasada nr 3 korpusu i pole, które odróżnia atlas od
 *                podręcznika. „Praca nie podaje progu X" jest pełnowartościową treścią kliniczną
 *                — i częściej potrzebną niż sam próg. Bramka ATL3 żąda co najmniej dwóch pozycji.
 *   `zespol`   — oś [H61] Kaski 2025: AVS (dni do tygodni) · EVS (napady, sekundy do dni) ·
 *                CVS (co najmniej 3 miesiące). To po niej linkuje kwalifikacja, więc przypisanie
 *                ma wynikać z CZASU W KRYTERIACH, nie z intuicji.
 *   `wSilniku` — REJESTR ZAKRESU. Zapis „świadomie poza zakresem" jest produktem etapu E6:
 *                odróżnia decyzję od przeoczenia. Dotąd był prozą w mapie pokrycia i ZESTARZAŁ
 *                SIĘ — mapa nazywała [H50], [H52] i [H53] nieobecnymi, gdy wszystkie trzy już
 *                weszły do `src/` (naprawione w `21bdda4`). Tutaj jest polem, które bramka
 *                LICZY, więc ten rodzaj zestarzenia przestaje być możliwy po cichu.
 *
 * Moduł CZYSTY: zero importów, zero DOM, zero `t()`, zero `new Date`/`Math.random`.
 * Napisy jako surowe pary pl/en — `t()` na poziomie modułu zamroziłoby język na tym, który był
 * aktywny w chwili importu, a moduły ładują się PRZED `initLang()`.
 *
 * Bramka: npm run atlas:check
 */

/* ═══════════ 1. OŚ ZESPOŁÓW KARDYNALNYCH — [H61] Kaski 2025 ═══════════
   Trzy zespoły z jednego zdania pracy. Ta sama oś, po której klasyfikuje kwalifikacja wstępna
   (`triage-model.js`, pytanie `przebieg`) — i to jest cały mechanizm linkowania: kwalifikacja
   ustala zespół, atlas wie, które jednostki ICVD są w tym zespole zdefiniowane.

   `wiele` i `nd` NIE SĄ workiem na wątpliwości. `wiele` znaczy, że jednostka ma w SWOICH
   kryteriach więcej niż jedno okno czasowe (np. praca definiuje postać ostrą i przewlekłą).
   `nd` jest wyłącznie dla dokumentów RAMOWYCH, które nie są jednostką chorobową. */
export const ZESPOLY = {
  AVS: {
    pl: 'ostry zespół przedsionkowy', en: 'acute vestibular syndrome',
    skrotPl: 'AVS', skrotEn: 'AVS',
    opisPl: 'choroba jednofazowa o ostrym początku, objawy trwają dni do tygodni',
    opisEn: 'a monophasic condition of acute onset, symptoms lasting days to weeks',
  },
  EVS: {
    pl: 'epizodyczny zespół przedsionkowy', en: 'episodic vestibular syndrome',
    skrotPl: 'EVS', skrotEn: 'EVS',
    opisPl: 'nawracające napady, każdy trwa sekundy do dni, między napadami wyraźnie lepiej',
    opisEn: 'recurrent attacks, each lasting seconds to days, with clear improvement between them',
  },
  CVS: {
    pl: 'przewlekły zespół przedsionkowy', en: 'chronic vestibular syndrome',
    skrotPl: 'CVS', skrotEn: 'CVS',
    opisPl: 'objawy utrzymują się co najmniej 3 miesiące',
    opisEn: 'symptoms persisting for at least 3 months',
  },
  wiele: {
    pl: 'więcej niż jeden zespół', en: 'more than one syndrome',
    skrotPl: 'wiele', skrotEn: 'multiple',
    opisPl: 'kryteria tej pracy obejmują więcej niż jedno okno czasowe',
    opisEn: 'the criteria of this paper span more than one time window',
  },
  nd: {
    pl: 'nie dotyczy', en: 'not applicable',
    skrotPl: '—', skrotEn: '—',
    opisPl: 'dokument ramowy — słownik albo klasyfikacja, nie jednostka chorobowa',
    opisEn: 'a framework document — a glossary or classification, not a disease entity',
  },
};
export const ZESPOL_IDS = Object.keys(ZESPOLY);

/* ═══════════ 2. REJESTR ZAKRESU — odpowiedź na D6, per jednostka ═══════════
   Zbiór ZAMKNIĘTY i to jest jego cała wartość. Dopóki zakres był prozą, „nie wiedzieliśmy, że
   istnieje" i „świadomie poza zakresem" wyglądały identycznie. Tutaj są trzema różnymi
   wartościami pola, które bramka policzy i zestawi z pomiarem po `src/`. */
export const STANY_SILNIKA = {
  modelowana: {
    pl: 'modelowana przez silnik', en: 'modelled by the engine',
    opisPl: 'silnik liczy fizykę albo obraz kliniczny tej jednostki',
    opisEn: 'the engine computes the physics or the clinical picture of this entity',
  },
  'kryteria-bez-modelu': {
    pl: 'kryteria bez modelu', en: 'criteria without a model',
    opisPl: 'program nazywa tę jednostkę i niesie jej kryteria, ale niczego dla niej nie liczy',
    opisEn: 'the app names this entity and carries its criteria, but computes nothing for it',
  },
  'poza-zakresem': {
    pl: 'świadomie poza zakresem silnika', en: 'deliberately outside the engine scope',
    opisPl: 'jednostka jest w atlasie do czytania; silnik jej nie modeluje i nie udaje, że modeluje',
    opisEn: 'the entity is in the atlas to be read; the engine does not model it and does not pretend to',
  },
};
export const STAN_SILNIKA_IDS = Object.keys(STANY_SILNIKA);

/* ═══════════ 2a. TYP DOKUMENTU — trzy wartości, i trzecia nie jest kosmetyką ═══════════
 * Korpus ICVD nie składa się z samych zestawów kryteriów. Są w nim trzy rodzaje dokumentów
 * i mieszanie ich zaciera rzecz, którą czytelnik MUSI wiedzieć, zanim zacznie czytać kartę:
 *
 *   `jednostka`  — praca definiuje jednostkę chorobową i podaje jej kryteria.
 *   `ramowy`     — słownik albo klasyfikacja: [H47] Bisdorff (objawy), [H51] Eggers (oczopląs),
 *                  [H61] Kaski (przegląd ICVD). Nie opisuje choroby, tylko język, którym się
 *                  o chorobach mówi.
 *   `stanowisko` — praca dotyczy DOMNIEMANEJ jednostki i JAWNIE ODMAWIA postawienia kryteriów.
 *
 * Trzecia wartość powstała na konkretnym przypadku: [H60] Seemungal 2022 o zawrotach szyjnych.
 * Pierwsza wersja treści nazwała go „ramowym", bo nie ma kryteriów rozpoznawczych — i to było
 * ZACIERANIE. Ten dokument nie jest słownikiem: dotyczy jednostki, orzeka, że brakuje dowodu na
 * mechanistyczne powiązanie zawrotu z patologią szyi, i kończy się ODMOWĄ zaproponowania kryteriów
 * do użytku klinicznego. Wciśnięcie go do „ramowy" kazałoby czytelnikowi samemu odgadnąć, czemu
 * karta nie ma kryteriów; wciśnięcie do „jednostka" zmusiłoby nas do przypisania mu zespołu
 * kardynalnego, którego źródło świadomie NIE podaje — czyli do zmyślenia.
 *
 * ZESPOŁU KARDYNALNEGO NIE MA ANI `ramowy`, ANI `stanowisko` — obie niosą `zespol: 'nd'`.
 */
export const TYPY = {
  jednostka: { pl: 'jednostka chorobowa', en: 'disease entity',
    opisPl: 'praca definiuje jednostkę i podaje jej kryteria', opisEn: 'the paper defines the entity and gives its criteria' },
  ramowy: { pl: 'dokument ramowy', en: 'framework document',
    opisPl: 'słownik albo klasyfikacja — język, nie choroba', opisEn: 'a glossary or classification — the language, not the disease' },
  stanowisko: { pl: 'stanowisko bez kryteriów', en: 'position statement without criteria',
    opisPl: 'praca dotyczy domniemanej jednostki i jawnie odmawia postawienia kryteriów rozpoznawczych',
    opisEn: 'the paper concerns a putative entity and explicitly declines to propose diagnostic criteria' },
};
export const TYP_IDS = Object.keys(TYPY);
/* Typy, które NIE opisują jednostki chorobowej — a więc nie mają zespołu kardynalnego. */
export const TYPY_BEZ_ZESPOLU = ['ramowy', 'stanowisko'];

/* ═══════════ 2b. RANGA PROGU — czym jest liczba w pracy ═══════════
 * Ten projekt przegrał już dwa razy na tym, że liczba stała bez rangi, i oba razy kosztowało to
 * etap: w E3a `GAIN_CUT {HC 0,8}` okazał się DOLNĄ GRANICĄ NORMY z noty 5 [H19], a nie kryterium,
 * choć wyglądał jak kryterium; w D-CT modalność TK stała w prozie przeglądowej, ale CEL obrazowania
 * był treścią kryterium B [H58] — i to ranga podniosła wagę zgubionej połowy zdania o piętro.
 *
 * Dlatego próg atlasu NIESIE RANGĘ, a karta pokazuje tylko dwie pierwsze:
 *   `kryterium` — liczba stoi wprost w linii kryterium;
 *   `nota`      — liczba stoi w NOCIE, do której kryterium ODSYŁA. To nie jest ranga niższa
 *                 „o połowę": kryterium bywa jakościowe i całą swoją liczbową treść deleguje
 *                 przypisem (tak robi kryterium C [H19]). Nota bywa też SPRZECZNA z własnym
 *                 kryterium — nota 4 [H49] rozciąga czas napadowicy do „many minutes", przecząc
 *                 kryterium B tej samej pracy. Wtedy karta oddaje KRYTERIUM, a sprzeczność idzie
 *                 do `granice`, bo to jest granica źródła, a nie próg.
 *   `proza`     — liczba stoi w omówieniu, epidemiologii albo dyskusji. Bywa ciekawa i NIE JEST
 *                 kryterialna; do atlasu nie wchodzi, żeby karta nie stała się zrzutem ekstrakcji.
 *                 Pełny komplet progów każdej pracy zostaje w `icvd-korpus/ekstrakcje/` — tam jest
 *                 jego miejsce i tam go zmierzono.
 */
export const RANGI = {
  kryterium: { pl: 'kryterium', en: 'criterion',
    opisPl: 'liczba stoi wprost w linii kryterium', opisEn: 'the number stands in the criterion line itself' },
  nota: { pl: 'nota do kryterium', en: 'note to a criterion',
    opisPl: 'liczba stoi w przypisie, do którego kryterium odsyła', opisEn: 'the number stands in a note the criterion refers to' },
  proza: { pl: 'omówienie', en: 'discussion',
    opisPl: 'liczba z omówienia — nie jest kryterialna', opisEn: 'a number from the discussion — not criterial' },
};
export const RANGA_IDS = Object.keys(RANGI);
/* Rangi, które karta atlasu POKAZUJE. Lista jawna, a nie „wszystko poza prozą": gdyby doszła
   czwarta ranga, milczące dopuszczenie byłoby decyzją redakcyjną podjętą przez brak decyzji. */
export const RANGI_NA_KARCIE = ['kryterium', 'nota'];

/* ═══════════ 3. WPISY ═══════════
   Osiemnaście z dziewiętnastu dokumentów konsensusu Bárány Society. Dziewiętnasty — pierwotna
   wersja kryteriów migreny przedsionkowej (Lempert 2012) — NUMERU NIE DOSTAJE (decyzja D7):
   kryteria cytujemy za [H46], bo to ich aktualny nośnik, a wersja z 2012 posłużyła jako dowód.

   Kolejność jest KLINICZNA, nie alfabetyczna ani nie numeryczna: najpierw to, co program robi
   (BPPV), potem osie, wzdłuż których klinicysta różnicuje, na końcu dokumenty ramowe. */
export const ATLAS = [
  {
    klucz: "bppv",
    zrodlo: "[H48] von Brevern 2015",
    typ: "jednostka",
    nazwaPl: "Łagodne napadowe położeniowe zawroty głowy (BPPV)",
    nazwaEn: "Benign paroxysmal positional vertigo (BPPV)",
    zespol: "EVS",
    wSilniku: "modelowana",
    wSilnikuDowod: "grep -rniE 'bppv|canalolith|cupulolith' src/ = 210 trafień w 22 plikach (pomiar kontrolny 2026-08-22; poprzednia wartość 206/20 pochodziła sprzed dopisania src/app/atlas-model.js). W tym src/pose/maneuvers.js = 22 wiersze z 'bppv' i src/engine/vestibular.js = 18 wierszy 'bppv|cupulolith|canalolith'. Silnik liczy fizykę złogu i obraz oczopląsu (moduły pozy, wektory kanałów, most SPV), a nie tylko nazywa jednostkę.",
    streszczeniePl: "BPPV to najczęstsze zaburzenie przedsionkowe: krótkie napady zawrotu wyzwalane zmianą położenia głowy względem grawitacji, którym w badaniu pozycyjnym odpowiada oczopląs o kierunku właściwym dla jednego kanału półkolistego. Mechanizmem dominującym jest kanalolitiaza (otokonia luźne w kanale), rzadszym — kupulolitiaza (otokonia przyczepione do osklepka). Klasyfikacja żąda, by pełne rozpoznanie nazywało ZARAZEM zajęty kanał i mechanizm, i daje osiem zestawów kryteriów: cztery ustalone (2.1–2.4) i cztery uznane za wyłaniające się lub kontrowersyjne (3.1–3.4). Skumulowana zapadalność życiowa sięga 10%, nawroty dotyczą około 50% chorych, a samoistne remisje występują typowo po dniach do tygodni.",
    streszczenieEn: "BPPV is the most frequent vestibular disorder: brief attacks of vertigo triggered by a change of head position relative to gravity, matched on positional testing by nystagmus whose direction belongs to one semicircular canal. The dominant mechanism is canalolithiasis (otoconia loose within the canal); cupulolithiasis (otoconia adherent to the cupula) is rarer. The classification requires that a complete diagnosis name BOTH the affected canal AND the mechanism, and it supplies eight criteria sets: four established (2.1–2.4) and four labelled emerging or controversial (3.1–3.4). Lifetime cumulative incidence reaches 10%, recurrences affect about 50% of patients, and spontaneous remissions typically occur after days to weeks.",
    synonimy: [
      { pl: "łagodny napadowy ułożeniowy zawrót głowy (benign paroxysmal positioning vertigo)", en: "benign paroxysmal positioning vertigo", odradzany: true, uwagaPl: "Termin wcześniej używany. Część autorów postulowała „positioning\" (ułożeniowy), bo objaw wyzwala sam AKT przemieszczania głowy, a nie utrzymywanie jej w pozycji. Komitet uznał to rozróżnienie za mechanistycznie sensowne, ale zachował „positional\", bo termin jest w praktyce zbyt zadomowiony. Zgodnie: [H47] Bisdorff 2009 odrzuca to rozróżnienie jako niepraktyczne i umieszcza „positioning vertigo\" oraz „positioning dizziness\" na listach terminów WYŁĄCZONYCH; [H51] Eggers 2019 podaje „positioning nystagmus\" jako termin POPRZEDNI i deklaruje, że ICVD nie rozdziela oczopląsu „positional\" i „positioning\".", uwagaEn: "A previously used term. Some authors argued for \"positioning\" on the grounds that the trigger is the ACT by which the head is moved into a new position, not the holding of one. The committee accepted the mechanistic point but kept \"positional\", the term being too entrenched in practice. Consistently: [H47] Bisdorff 2009 rejects the distinction as impractical and lists \"positioning vertigo\" and \"positioning dizziness\" among EXCLUDED terms; [H51] Eggers 2019 gives \"positioning nystagmus\" as a PREVIOUS term and states that the ICVD does not separate \"positional\" from \"positioning\" nystagmus." },
      { pl: "łagodny zawrót położeniowy (benign positional vertigo)", en: "benign positional vertigo" },
      { pl: "napadowy zawrót położeniowy (paroxysmal positional vertigo)", en: "paroxysmal positional vertigo" },
      { pl: "litiaza przedsionkowa (vestibular lithiasis)", en: "vestibular lithiasis" },
    ],
    kryteria: [
      {
        postac: "2.1 kanalolitiaza kanału tylnego (pc-BPPV)",
        nazwaPl: "2.1 Kanalolitiaza kanału tylnego (pc-BPPV)", nazwaEn: "2.1 Canalolithiasis of the posterior canal (pc-BPPV)",
        wymagane: "A, B, C i D łącznie (cztery punkty; źródło nie drukuje formuły „all of the following\" — koniunkcja wynika z formatu listy, nie ze zdania w tekście)",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego ALBO położeniowej dizziness (zawrotu niewirowego), prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo OR of positional dizziness (non-spinning), set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Czas trwania napadów < 1 min.", en: "Attack duration < 1 min." },
          { litera: "C", pl: "Oczopląs położeniowy wywołany po latencji jednej lub kilku sekund przez manewr Dixa-Hallpike'a ALBO manewr side-lying (diagnostyczny manewr Semonta); jest złożeniem oczopląsu skrętnego, w którym górny biegun gałek bije ku uchu położonemu NIŻEJ, z oczopląsem pionowym bijącym KU GÓRZE (ku czołu), i trwa typowo < 1 minuty.", en: "Positional nystagmus brought on after a latency of one or a few seconds by the Dix-Hallpike maneuver OR by the side-lying maneuver (Semont diagnostic maneuver). It is a compound movement: a torsional component whose upper ocular pole runs toward the ear lying LOWER, plus a vertical component beating UPWARD (toward the forehead). Typical duration < 1 minute." },
          { litera: "D", pl: "Nie do przypisania innemu zaburzeniu.", en: "Not attributable to another disorder." },
        ],
        przypisyPl: [
          "Formuła „nie do przypisania innemu zaburzeniu\" powtarza się identycznie we wszystkich ośmiu zestawach kryteriów i ma trzy dopuszczalne stany, połączone spójnikiem ALBO: (a) wywiad oraz badanie przedmiotowe i neurologiczne nie sugerują innego zaburzenia przedsionkowego, ALBO (b) takie zaburzenie rozważono, ale wykluczono odpowiednimi badaniami, ALBO (c) takie zaburzenie jest obecne jako stan współistniejący, który daje się wyraźnie odróżnić.",
          "Latencja między zakończeniem manewru a początkiem oczopląsu może w rzadkich przypadkach sięgać 40 sekund; czas trwania oczopląsu zwykle nie przekracza 40 sekund, zanim wygaśnie samoistnie.",
          "Intensywność oczopląsu typowo narasta szybko, a potem opada wolniej (crescendo-decrescendo). Po ustaniu początkowego oczopląsu może pojawić się oczopląs o mniejszej intensywności i odwróconym kierunku; po powrocie do siadu odwrócony oczopląs jest częsty — mniej intensywny i krótszy.",
          "Męczliwość oczopląsu i zawrotu przy powtarzanych badaniach pozycyjnych to zjawisko częste. Uwaga: dla kanału poziomego męczliwości praca w ogóle nie opisuje.",
          "Wygląd oczopląsu zależy od fiksacji i kierunku spojrzenia: przy zachowanej fiksacji oczopląs może wydawać się przeważnie skrętny (fiksacja słabiej tłumi ruchy skrętne niż pionowe); przy spojrzeniu ku uchu niżej położonemu wygląda na przeważnie skrętny, ku uchu wyżej — na przeważnie pionowy. Niezależnie od pozycji gałki w oczodole ruch oka w układzie współrzędnych głowy pozostaje w płaszczyźnie kanału tylnego.",
        ],
        przypisyEn: [
          "The \"not attributable to another disorder\" formula is repeated verbatim across all eight criteria sets and admits three states, joined by OR: (a) the history plus the physical and neurological examination point to no other vestibular disorder, OR (b) another disorder was entertained and then ruled out by appropriate investigations, OR (c) another disorder is there as a comorbidity, but one that can be told apart cleanly.",
          "Latency between completion of the maneuver and nystagmus onset may reach 40 seconds in rare cases; nystagmus duration usually does not exceed 40 seconds before it damps spontaneously.",
          "Nystagmus intensity typically rises rapidly and then declines more slowly (crescendo-decrescendo). After the initial nystagmus ceases, a lower-intensity reversed-direction nystagmus may appear; on return to sitting, reversed nystagmus of lesser intensity and shorter duration is common.",
          "Fatigability of nystagmus and vertigo on repeated positional testing is a common finding. Note: for the horizontal canal the paper describes no fatigability at all.",
          "The appearance of the nystagmus depends on fixation and gaze direction: with fixation preserved it may look predominantly torsional (fixation suppresses torsion less well than vertical movement); on gaze toward the lower ear it appears predominantly torsional, toward the upper ear predominantly vertical. Independent of orbital eye position, the eye movement in head coordinates stays in the plane of the posterior canal.",
        ],
      },
      {
        postac: "2.2 kanalolitiaza kanału poziomego (hc-BPPV)",
        nazwaPl: "2.2 Kanalolitiaza kanału poziomego (hc-BPPV)", nazwaEn: "2.2 Canalolithiasis of the horizontal canal (hc-BPPV)",
        wymagane: "A, B, C i D łącznie (cztery punkty)",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego albo położeniowej dizziness, prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo or of positional dizziness, set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Czas trwania napadów < 1 min.", en: "Attack duration < 1 min." },
          { litera: "C", pl: "Oczopląs położeniowy wywołany po krótkiej latencji ALBO bez latencji przez test supine roll, bijący poziomo KU UCHU POŁOŻONEMU NIŻEJ przy głowie obróconej w każdą ze stron (geotropowy oczopląs zmieniający kierunek), trwający < 1 min.", en: "Positional nystagmus elicited after a brief latency OR no latency by the supine roll test, beating horizontally toward the LOWERMOST ear with the head turned to either side (geotropic direction-changing nystagmus), lasting < 1 min." },
          { litera: "D", pl: "Nie do przypisania innemu zaburzeniu.", en: "Not attributable to another disorder." },
        ],
        przypisyPl: [
          "SPRZECZNOŚĆ WEWNĄTRZ ŹRÓDŁA: kryterium C mówi „< 1 min\", a nota do niego dopuszcza, by czas trwania oczopląsu udokumentowany rejestracją ruchów gałek PRZEKROCZYŁ 1 minutę — nie przekracza jednak 2 minut. Praca podaje obie liczby i nie rozstrzyga między nimi.",
          "Latencja zależy od PRZYSPIESZENIA zmiany położenia: im wyższe przyspieszenie obrotu głowy, tym krótsza latencja i wyższa intensywność oczopląsu; przy energicznych manewrach latencja wynosi typowo 1 lub 2 sekundy. Intensywność zależy też od KĄTA obrotu głowy — bywa większa przy większych obrotach w teście roll. Praca podaje kierunek obu zależności, ale NIE podaje dla nich żadnej liczby.",
          "Kierunek oczopląsu jest przeważnie poziomy, z mniejszą składową skrętną, w której górny biegun oka bije ku uchu położonemu niżej.",
          "Kanalolitiaza kanału poziomego może PRAWDOPODOBNIE dawać także oczopląs APOGEOTROPOWY — gdy otokonia leżą w przedniej części kanału, blisko osklepka. Test roll ku uchu zdrowemu zrzuca je wtedy ku osklepkowi albo na osklepek (oczopląs apogeotropowy przemijający albo długo trwający), a test roll ku uchu choremu daje oczopląs apogeotropowy przemijający. U takich chorych bywa widoczne przekształcenie oczopląsu z apogeotropowego w geotropowy w trakcie manewrów. Dla kontrastu: utrzymywanie się apogeotropii po kilku cyklach testu roll jest spodziewane przy KUPULOLITIAZIE.",
          "Znaki wskazujące stronę zajętą: intensywność oczopląsu jest zwykle SILNIEJSZA przy głowie obróconej ku uchu CHOREMU; zgięcie głowy do przodu w pozycji wyprostowanej może wywołać przemijający oczopląs bijący ku uchu CHOREMU; odchylanie się do tyłu z pozycji siedzącej — przemijający oczopląs ku uchu ZDROWEMU. Zastrzeżenie metodyczne pracy: kąt i przyspieszenie obrotów muszą być podobne po obu stronach, inaczej porównanie intensywności nie ma sensu.",
        ],
        przypisyEn: [
          "CONTRADICTION INSIDE THE SOURCE: criterion C states \"< 1 min\", while its note allows nystagmus duration documented by eye-movement recording to EXCEED 1 minute — though it does not exceed 2 minutes. The paper gives both figures and does not adjudicate between them.",
          "Latency is governed by the ACCELERATION with which the position is changed: a faster head turn buys a shorter latency and a stronger nystagmus. For brisk maneuvers the paper puts latency at typically 1 or 2 seconds. A second dependency runs on the ANGLE of head rotation — wider turns in the roll test tend to yield more intense nystagmus. Both dependencies are stated as directions only, with NO number attached to either.",
          "Nystagmus direction is predominantly horizontal, with a smaller torsional component whose upper pole beats toward the lowermost ear.",
          "Horizontal canalolithiasis may PROBABLY also produce APOGEOTROPIC nystagmus — when otoconia lie in the anterior part of the canal, close to the cupula. The roll test toward the healthy ear then drops them toward or onto the cupula (transient or long-lasting apogeotropic nystagmus), while the roll test toward the affected ear provokes transient apogeotropic nystagmus. In such patients a transformation from apogeotropic to geotropic nystagmus may be seen during the maneuvers. By contrast, persistence of apogeotropy after several cycles of the roll test is expected with CUPULOLITHIASIS.",
          "Signs pointing to the affected side: nystagmus intensity is usually STRONGER with the head turned toward the AFFECTED ear; bending the head forward while upright may evoke transient nystagmus beating toward the AFFECTED ear; leaning backward from sitting may provoke transient nystagmus toward the HEALTHY ear. Methodological caveat given by the paper: the resulting angle and acceleration of the turns must be comparable on both sides, otherwise the intensity comparison is meaningless.",
        ],
      },
      {
        postac: "2.3 kupulolitiaza kanału poziomego (hc-BPPV-cu)",
        nazwaPl: "2.3 Kupulolitiaza kanału poziomego (hc-BPPV-cu)", nazwaEn: "2.3 Cupulolithiasis of the horizontal canal (hc-BPPV-cu)",
        wymagane: "A, B i C łącznie — TRZY punkty; ta jednostka NIE MA kryterium czasu trwania napadu",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego albo położeniowej dizziness, prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo or of positional dizziness, set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Oczopląs położeniowy wywołany po krótkiej latencji albo bez latencji przez test supine roll, bijący poziomo KU UCHU POŁOŻONEMU WYŻEJ przy głowie obróconej w każdą ze stron (apogeotropowy oczopląs zmieniający kierunek), trwający > 1 minuty.", en: "Positional nystagmus that the supine roll test brings on with a brief latency or none at all; with the head turned to either side it beats horizontally toward the ear lying UPPERMOST (apogeotropic, direction-changing), and it lasts > 1 minute." },
          { litera: "C", pl: "Nie do przypisania innemu zaburzeniu — z dopiskiem swoistym: ponieważ apogeotropowy oczopląs zmieniający kierunek występuje TAKŻE jako objaw dysfunkcji ośrodkowo-przedsionkowej, wykluczenie choroby OUN jest OBOWIĄZKOWE.", en: "Not attributable to another disorder — with an entity-specific addendum: because apogeotropic direction-changing nystagmus ALSO occurs as a sign of central vestibular dysfunction, exclusion of CNS disease is MANDATORY." },
        ],
        przypisyPl: [
          "Dlaczego brakuje kryterium czasu napadu: czas trwania napadu jest zwykle krótszy niż 1 minuta, bo chorzy odruchowo wracają głową do położenia, w którym objawy ustają. Może być jednak DŁUŻSZY, jeżeli głowa pozostaje w położeniu prowokującym. Ponadto z powodu przestrzennej orientacji zajętego osklepka chorzy mogą mieć utrzymujący się zawrót albo dizziness o mniejszym nasileniu W POZYCJI WYPROSTOWANEJ.",
          "Kształt obwiedni oczopląsu jest inny niż w kanalolitiazie: intensywność narasta POWOLI przez około 30 sekund, a potem stopniowo zanika przez dłuższy okres kilku minut (nie crescendo-decrescendo).",
          "Składowa skrętna: górny biegun oka bije ku uchu położonemu WYŻEJ — odwrotnie niż w kanalolitiazie kanału poziomego.",
          "Znak strony zajętej jest ODWRÓCONY wobec kanalolitiazy: intensywność oczopląsu jest zwykle SILNIEJSZA przy głowie obróconej OD ucha chorego.",
          "Oczopląs pseudosamoistny — jedyne miejsce w pracy, gdzie pojęcie zostaje zdefiniowane: to postać oczopląsu POŁOŻENIOWEGO występująca przy głowie w pozycji wyprostowanej, przez co powierzchownie przypomina oczopląs samoistny. Odróżnia go silna zależność od położenia głowy i USTĘPOWANIE przy pochyleniu głowy o około 30° do przodu. Mechanizm podany przez autorów: kąt 30° między płaszczyzną kanału poziomego a płaszczyzną poziomą głowy w pozycji wyprostowanej ustawia bańkę wyżej niż resztę kanału. Przy tej jednostce oczopląs pseudosamoistny bije typowo ku uchu CHOREMU; zgięcie głowy o 90° do przodu może dać oczopląs ku uchu ZDROWEMU; w pozycji na plecach bywa słaby utrzymujący się oczopląs ku uchu choremu, ustępujący po lekkim obrocie głowy w tę stronę.",
        ],
        przypisyEn: [
          "Why the attack-duration criterion is absent: an attack usually runs under 1 minute, because the patient reflexively moves the head back to an attitude in which the symptoms stop. Hold the head in the provoking attitude and the attack can run LONGER. On top of that, the way the loaded cupula sits in space leaves some patients with milder vertigo or dizziness that does not stop WHILE THEY ARE UPRIGHT.",
          "The envelope of the nystagmus differs from canalolithiasis: intensity builds up SLOWLY over approximately 30 seconds and then decays gradually over a longer period of several minutes (not crescendo-decrescendo).",
          "Torsional component: the upper pole of the eye beats toward the UPPERMOST ear — the reverse of horizontal canalolithiasis.",
          "The side-localizing sign is INVERTED relative to canalolithiasis: the nystagmus usually comes out STRONGER when the head is rotated AWAY FROM the diseased ear.",
          "Pseudo-spontaneous nystagmus — the only place in the paper where the concept is defined: it is POSITIONAL nystagmus that happens to appear with the head upright, so at first glance it passes for spontaneous nystagmus. Two things separate it: it tracks head position closely, and it STOPS once the head is pitched some 30° forward. Mechanism given by the authors: with the head upright the horizontal canal lies at 30° to the earth-horizontal plane of the head, which leaves the ampulla sitting above the rest of the canal. In this entity the pseudo-spontaneous nystagmus typically beats toward the AFFECTED ear; pitching the head 90° forward may turn it toward the HEALTHY ear; supine, a weak nystagmus toward the affected ear may persist and then subside once the head is turned a little that way.",
        ],
      },
      {
        postac: "2.4 prawdopodobne BPPV, które ustąpiło samoistnie",
        nazwaPl: "2.4 Prawdopodobne BPPV, które ustąpiło samoistnie", nazwaEn: "2.4 Probable BPPV, spontaneously resolved",
        wymagane: "A, B, C i D łącznie (cztery punkty)",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego albo położeniowej dizziness, prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo or of positional dizziness, set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Czas trwania napadów < 1 min.", en: "Attack duration < 1 min." },
          { litera: "C", pl: "BRAK obserwowalnego oczopląsu ORAZ BRAK zawrotu przy JAKIMKOLWIEK manewrze pozycyjnym.", en: "NO observable nystagmus AND NO vertigo on ANY positional maneuver." },
          { litera: "D", pl: "Nie do przypisania innemu zaburzeniu.", en: "Not attributable to another disorder." },
        ],
        przypisyPl: [
          "Rozpoznanie stawia się w okresie bezobjawowym — w konsekwencji NIE da się zidentyfikować kanału, który był zajęty.",
          "Wywiad przemijającego, izolowanego, epizodycznego zawrotu położeniowego o odpowiednim czasie trwania i charakterystycznych wyzwalaczach silnie wspiera to rozpoznanie.",
          "Diagnostyka różnicowa powinna obejmować migrenę przedsionkową, która też może objawiać się epizodycznym zawrotem położeniowym. Cechy podane przez pracę (bez żadnej liczby): epizody migrenowe mają tendencję do KRÓTSZEGO czasu trwania z częstymi nawrotami, występują tendencyjnie w młodszym wieku i często towarzyszą im objawy migrenowe (ból głowy, światłowstręt, fonofobia, aura migrenowa).",
          "REGUŁA PIERWSZEŃSTWA KODOWANIA: nie koduj jako 3.4 możliwego BPPV, jeżeli chory spełnia kryteria prawdopodobnego BPPV, które ustąpiło samoistnie.",
        ],
        przypisyEn: [
          "The diagnosis is made in the symptom-free interval — consequently the canal that was affected CANNOT be identified.",
          "A history of transient, isolated, episodic positional vertigo with an appropriate episode duration and characteristic triggers strongly supports this diagnosis.",
          "The differential diagnosis should include vestibular migraine, which may likewise present with episodic positional vertigo. Features the paper offers (no figures attached to any of them): migrainous episodes run SHORTER and recur more often, they start at a younger age, and they frequently arrive with migraine symptoms alongside — headache, photophobia, phonophobia, migraine aura.",
          "CODING PRECEDENCE RULE: do not code 3.4 possible BPPV if the patient meets the criteria for probable BPPV, spontaneously resolved.",
        ],
      },
      {
        postac: "3.1 kanalolitiaza kanału przedniego (ac-BPPV)",
        nazwaPl: "3.1 Kanalolitiaza kanału przedniego (ac-BPPV) — zespół wyłaniający się / kontrowersyjny", nazwaEn: "3.1 Canalolithiasis of the anterior canal (ac-BPPV) — emerging / controversial syndrome",
        wymagane: "A, B, C i D łącznie (cztery punkty), plus podział na dwa podtypy: 3.1.1 pewna i 3.1.2 prawdopodobna",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego albo położeniowej dizziness, prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo or of positional dizziness, set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Czas trwania napadów < 1 min.", en: "Attack duration < 1 min." },
          { litera: "C", pl: "Oczopląs położeniowy wywołany NATYCHMIAST ALBO po latencji jednej lub kilku sekund przez manewr Dixa-Hallpike'a (po JEDNEJ ALBO OBU stronach) ALBO w pozycji na plecach z głową zwisającą PROSTO w dół (straight head-hanging), bijący przeważnie PIONOWO W DÓŁ i trwający < 1 min.", en: "Positional nystagmus appearing IMMEDIATELY OR after one to a few seconds of latency, provoked either by Dix-Hallpike positioning (to ONE side OR BOTH) OR by the supine STRAIGHT HEAD-HANGING position; its predominant direction is VERTICAL, BEATING DOWNWARD, and it lasts < 1 min." },
          { litera: "D", pl: "Nie do przypisania innemu zaburzeniu — z dopiskiem swoistym: ponieważ pionowy oczopląs położeniowy bijący w dół występuje także jako objaw ośrodkowej dysfunkcji przedsionkowej, wykluczenie choroby OUN jest OBOWIĄZKOWE, JEŻELI oczopląs nie ustępuje niezwłocznie po manewrach leczniczych.", en: "Not attributable to another disorder — with an entity-specific addendum: since downbeating positional nystagmus is also seen as a sign of central vestibular dysfunction, exclusion of CNS disease is MANDATORY IF the nystagmus does not settle promptly after therapeutic maneuvers." },
        ],
        przypisyPl: [
          "PODTYPY (jedyne miejsce w pracy, gdzie odpowiedź na leczenie wchodzi do DEFINICJI, a nie tylko wspiera rozpoznanie): 3.1.1 PEWNA kanalolitiaza kanału przedniego — rozpoznanie można postawić na podstawie NATYCHMIASTOWEGO ustąpienia oczopląsu położeniowego po manewrach leczniczych; 3.1.2 PRAWDOPODOBNA — można rozpoznać WYŁĄCZNIE po wykluczeniu choroby OUN, gdy oczopląs położeniowy jest OPORNY na manewry lecznicze.",
          "Latencja może w rzadkich przypadkach sięgać 30 sekund (dla kanału tylnego podano 40 sekund).",
          "Oczopląs może mieć małą składową SKRĘTNĄ, w której górny biegun oka bije KU UCHU CHOREMU. Regułą lokalizacyjną jest kierunek tej składowej, a NIE strona manewru Dixa-Hallpike'a. Zastrzeżenie pracy: małą składową skrętną łatwo przeoczyć w praktyce klinicznej, co czyni identyfikację strony zajętej NIEPEWNĄ; wykrycie może ułatwić wideookulografia albo cewki twardówkowe.",
          "Najczulszym testem diagnostycznym wydaje się pozycja straight head-hanging. W pozycji Dixa-Hallpike'a oczopląs może być silniejszy albo występować wyłącznie przy uchu chorym skierowanym do góry ALBO do dołu.",
          "Wariant rzadki — 1% do 2% chorych w dużych seriach, choć niektóre nowsze doniesienia sugerowały znacznie wyższą częstość. Wyjaśnienie anatomiczne podane przez autorów: orientacja kanału przedniego pozwala cząstkom opuścić kanał po prostu przez położenie się i ponowne usiadnięcie.",
        ],
        przypisyEn: [
          "SUBTYPES (the only place in the paper where treatment response enters a DEFINITION rather than merely supporting a diagnosis): 3.1.1 DEFINITE anterior canal canalolithiasis — the diagnosis may be made on the basis of IMMEDIATE resolution of the positional nystagmus after therapeutic maneuvers; 3.1.2 PROBABLE — may be diagnosed ONLY after exclusion of CNS disease, when the positional nystagmus is REFRACTORY to therapeutic maneuvers.",
          "Latency may reach 30 seconds in rare cases (for the posterior canal the figure given is 40 seconds).",
          "The nystagmus may carry a small TORSIONAL component whose upper pole beats TOWARD THE AFFECTED EAR. The localizing rule is the direction of that component, NOT the side of the Dix-Hallpike maneuver. Caveat stated by the paper: the small torsional component is easily missed clinically, which makes identification of the affected side UNCERTAIN; video-oculography or scleral search coils may help detect it.",
          "The most sensitive diagnostic test appears to be the straight head-hanging position. In the Dix-Hallpike position the nystagmus may be stronger, or present only, with the affected ear uppermost OR lowermost.",
          "A rare variant — 1% to 2% of patients in large case series, although some more recent reports have suggested a considerably higher incidence. Anatomical explanation offered by the authors: the orientation of the anterior canal lets particles leave it simply by lying down and sitting up again.",
        ],
      },
      {
        postac: "3.2 kupulolitiaza kanału tylnego (pc-BPPV-cu)",
        nazwaPl: "3.2 Kupulolitiaza kanału tylnego (pc-BPPV-cu) — zespół wyłaniający się / kontrowersyjny", nazwaEn: "3.2 Cupulolithiasis of the posterior canal (pc-BPPV-cu) — emerging / controversial syndrome",
        wymagane: "A, B i C łącznie — TRZY punkty; ta jednostka NIE MA kryterium czasu trwania napadu",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego albo położeniowej dizziness, prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo or of positional dizziness, set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Oczopląs położeniowy wywołany po krótkiej latencji albo bez latencji przez „połowiczny manewr Dixa-Hallpike'a\", bijący SKRĘTNIE z górnym biegunem oka ku uchu położonemu NIŻEJ ORAZ PIONOWO KU GÓRZE (ku czołu), trwający > 1 min.", en: "Positional nystagmus brought on with a brief latency or none at all by what the paper calls a \"half Dix-Hallpike maneuver\"; it beats TORSIONALLY, upper pole of the eye toward the LOWER ear, AND VERTICALLY UPWARD (toward the forehead), and it lasts > 1 min." },
          { litera: "C", pl: "Nie do przypisania innemu zaburzeniu. (Tu — inaczej niż w 2.3 i 3.1 — BRAK dopisku o obowiązkowym wykluczeniu OUN.)", en: "Not attributable to another disorder. (Here — unlike in 2.3 and 3.1 — there is NO addendum about mandatory CNS exclusion.)" },
        ],
        przypisyPl: [
          "Kierunek oczopląsu jest TAKI SAM jak w kanalolitiazie kanału tylnego (2.1). Różnicuje CZAS TRWANIA (> 1 min zamiast < 1 min) oraz POZYCJA PROWOKUJĄCA (połowiczny Dix-Hallpike zamiast pełnego).",
          "DEFINICJA MANEWRU — jedyne miejsce w pracy: „połowiczny manewr Dixa-Hallpike'a\" wykonuje się z głową obróconą o 45° ku badanej stronie i spoczywającą LEKKO UNIESIONĄ znad pozycji na plecach (około 30° zgięcia). Ta pozycja najlepiej nadaje się do ustawienia zajętego osklepka w położeniu ZIEMSKO-POZIOMYM, w którym grawitacja odchyla go MAKSYMALNIE.",
          "Czas napadu jest zwykle krótszy niż 1 minuta, bo chorzy wracają głową do położenia, w którym objawy ustają; może być dłuższy, gdy głowa pozostaje w położeniu prowokującym. W odróżnieniu od 2.3 NIE MA tu zdania o utrzymujących się objawach w pozycji wyprostowanej.",
          "Kupulolitiazę kanału tylnego opisywano rzadko. Oczopląs może zniknąć, gdy głowę odchyli się DALEJ do tyłu w pozycji Dixa-Hallpike'a.",
          "„Odwrócony manewr Dixa-Hallpike'a\" — głowa pochylona o 90° do przodu z pozycji wyprostowanej po uprzednim obróceniu o 45° ku stronie chorej — może ujawnić oczopląs bijący w kierunku PRZECIWNYM niż w manewrze połowicznym.",
        ],
        przypisyEn: [
          "The direction of the nystagmus is THE SAME as in posterior canal canalolithiasis (2.1). What separates them is DURATION (> 1 min instead of < 1 min) and the PROVOKING POSITION (half Dix-Hallpike instead of the full maneuver).",
          "MANEUVER DEFINITION — the only place in the paper where it is spelled out: in the \"half Dix-Hallpike maneuver\" the head is rotated 45° to the side under test and, rather than hanging, is left SLIGHTLY RAISED above supine, in roughly 30° of flexion. The rationale given: that geometry sets the loaded cupula EARTH-HORIZONTAL, the attitude in which gravity pulls it over MAXIMALLY.",
          "Attack duration usually stays under 1 minute, because patients move the head back to an attitude in which the symptoms stop; keep it in the provoking attitude and the attack can run longer. Unlike 2.3, no sentence here speaks of symptoms persisting while upright.",
          "Posterior canal cupulolithiasis has rarely been described. The nystagmus may disappear when the head is tilted FURTHER backward in the Dix-Hallpike position.",
          "A \"reversed Dix-Hallpike maneuver\" — from upright, the head first turned 45° to the affected side and then pitched 90° forward — may bring out a nystagmus running OPPOSITE in direction to the one seen in the half maneuver.",
        ],
      },
      {
        postac: "3.3 litiaza wielu kanałów (mc-BPPV)",
        nazwaPl: "3.3 Litiaza wielu kanałów (mc-BPPV) — zespół wyłaniający się / kontrowersyjny", nazwaEn: "3.3 Lithiasis of multiple canals (mc-BPPV) — emerging / controversial syndrome",
        wymagane: "A, B, C i D łącznie (cztery punkty), przy czym B NIE JEST WYMAGANE, gdy błędnik jest zajęty kupulolitiazą",
        punkty: [
          { litera: "A", pl: "Nawracające napady zawrotu położeniowego albo położeniowej dizziness, prowokowane położeniem się albo obracaniem się w pozycji na plecach.", en: "Recurrent attacks of positional vertigo or of positional dizziness, set off by lying down or by rolling over while supine." },
          { litera: "B", pl: "Czas trwania napadów < 1 min. — Kryterium to NIE JEST WYMAGANE, gdy błędnik jest zajęty KUPULOLITIAZĄ.", en: "Attack duration < 1 min. — Where the labyrinth carries CUPULOLITHIASIS, this criterion is NOT REQUIRED." },
          { litera: "C", pl: "Oczopląs położeniowy zgodny z kanalolitiazą WIĘCEJ NIŻ JEDNEGO kanału podczas manewru Dixa-Hallpike'a ORAZ testu supine roll.", en: "Positional nystagmus compatible with canalolithiasis of MORE THAN ONE canal during the Dix-Hallpike maneuver AND the supine roll test." },
          { litera: "D", pl: "Nie do przypisania innemu zaburzeniu.", en: "Not attributable to another disorder." },
        ],
        przypisyPl: [
          "Uwaga na spójnik w kryterium C: praca żąda manewru Dixa-Hallpike'a ORAZ testu supine roll — nie „albo\".",
          "Najczęstsza kombinacja to kanalolitiaza kanału TYLNEGO i POZIOMEGO tego samego błędnika. Może dać przemijający oczopląs położeniowy ze składową poziomą i skrętną O RÓWNEJ INTENSYWNOŚCI w manewrze Dixa-Hallpike'a. Alternatywnie w TEJ SAMEJ sesji można obserwować mieszany skrętno-pionowy oczopląs zgodny z pobudzeniem kanału tylnego w manewrze Dixa-Hallpike'a po jednej stronie ORAZ przeważnie poziomy oczopląs w teście supine roll w OBIE strony. Inne kombinacje też występują, ale są rzadsze.",
          "Litiaza wielu kanałów jest prawdopodobnie CZĘSTA — dotyczy DO 20% chorych z BPPV — i występuje prawdopodobnie najczęściej PO URAZIE GŁOWY.",
          "Nakaz kompletności badania z sekcji o rozpoznaniu ma tu bezpośrednie zastosowanie: konieczne jest wykonanie manewrów pozycyjnych ZARÓWNO dla kanałów pionowych, JAK I dla kanału poziomego u KAŻDEGO chorego z zawrotem położeniowym.",
        ],
        przypisyEn: [
          "Mind the conjunction in criterion C: the paper requires the Dix-Hallpike maneuver AND the supine roll test — not \"either\".",
          "The most common combination is canalolithiasis of the POSTERIOR and the HORIZONTAL canal of one and the same labyrinth. On Dix-Hallpike testing this can throw a transient positional nystagmus whose horizontal and torsional components are EQUALLY intense. Alternatively, within a SINGLE session one may see a mixed torsional-vertical nystagmus fitting posterior canal excitation on Dix-Hallpike testing to one side, AND a predominantly horizontal nystagmus on supine roll testing to BOTH sides. Other combinations occur, but more rarely.",
          "Multiple canal lithiasis is probably COMMON — affecting UP TO 20% of BPPV patients — and probably occurs most often AFTER HEAD TRAUMA.",
          "The completeness requirement from the diagnosis section bites directly here: in EVERY patient with positional vertigo the paper calls it essential to run positional maneuvers on the vertical canals AND on the horizontal canal — not one set or the other.",
        ],
      },
      {
        postac: "3.4 możliwe BPPV",
        nazwaPl: "3.4 Możliwe BPPV — zespół wyłaniający się / kontrowersyjny", nazwaEn: "3.4 Possible BPPV — emerging / controversial syndrome",
        wymagane: "A i B łącznie — DWA punkty",
        punkty: [
          { litera: "A", pl: "Napady zawrotu położeniowego, którym brakuje JEDNEGO z kryteriów jednostki zakodowanej powyżej. (To jedyny zestaw w całej pracy, w którym kryterium A NIE zawiera słowa „nawracające\".)", en: "Positional vertigo attacks that fall short of ONE criterion of a disorder coded above. (This is the only set in the whole paper whose criterion A does NOT carry the word \"recurrent\".)" },
          { litera: "B", pl: "Nie do przypisania innemu zaburzeniu.", en: "Not attributable to another disorder." },
        ],
        przypisyPl: [
          "Kategoria może obejmować m.in.: (i) chorych z zawrotem położeniowym BEZ obserwowalnego oczopląsu mimo rejestracji ruchów gałek ocznych ALBO z atypowym oczopląsem położeniowym, który mimo to USTĘPUJE po ułożeniu leczniczym; (ii) chorych z domniemanym zajęciem wielu kanałów, którego NIE DA SIĘ dookreślić; (iii) chorych z JEDNOCZESNYM występowaniem OBWODOWEGO i OŚRODKOWEGO oczopląsu położeniowego.",
          "REGUŁA PIERWSZEŃSTWA: nie koduj jako 3.4, jeżeli chory spełnia kryteria prawdopodobnego BPPV, które ustąpiło samoistnie (2.4).",
          "BŁĄD WEWNĘTRZNY ŹRÓDŁA, odnotowany i NIEPOPRAWIONY w treści: przy tej regule tekst pisze kod „1.4.\", podczas gdy prawdopodobne BPPV, które ustąpiło samoistnie, nosi w tej pracy numer 2.4, a 1.4 to sekcja „Rozpoznanie\". Drugi analogiczny rozjazd: sekcja o patofizjologii odsyła do „komentarza do 1.3\" przy oczopląsie pseudosamoistnym, podczas gdy komentarz o nim stoi w 2.2 i 2.3.",
        ],
        przypisyEn: [
          "The category may cover, among others: (i) patients with positional vertigo but NO observable nystagmus despite eye-movement recording, OR with atypical positional nystagmus that nevertheless RESOLVES after therapeutic positioning; (ii) patients with presumed multiple canal involvement that CANNOT be further specified; (iii) patients with SIMULTANEOUS PERIPHERAL and CENTRAL positional nystagmus.",
          "PRECEDENCE RULE: do not code 3.4 if the patient meets the criteria for probable BPPV, spontaneously resolved (2.4).",
          "AN INTERNAL ERROR OF THE SOURCE, recorded and LEFT UNCORRECTED in the content: at this rule the text prints the code \"1.4.\", whereas probable BPPV, spontaneously resolved, carries the number 2.4 in this paper, and 1.4 is the section \"Diagnosis\". A second analogous slip: the pathophysiology section refers to a \"comment to 1.3\" for pseudo-spontaneous nystagmus, while the comment on it stands in 2.2 and 2.3.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "< 1 min", wielkoscPl: "czas trwania napadu", wielkoscEn: "attack duration", kontekstPl: "kryterium B jednostek 2.1, 2.2, 2.4, 3.1, 3.3 (w 3.3 niewymagane, gdy błędnik jest zajęty kupulolitiazą). Kryterium czasu trwania napadu NIE WYSTĘPUJE W OGÓLE w trzech pozostałych zestawach: 2.3 i 3.2 (obie postacie kupulolityczne) oraz 3.4 możliwe BPPV, którego wykaz liczy tylko punkty A i B.", kontekstEn: "criterion B of 2.1, 2.2, 2.4, 3.1, 3.3 (not required in 3.3 when the labyrinth is affected by cupulolithiasis). The attack-duration criterion is ABSENT ALTOGETHER from the remaining three sets: 2.3 and 3.2 (both cupulolithiasis forms) and 3.4 possible BPPV, whose list runs to items A and B only." },
      { ranga: "kryterium", wartosc: "jedna lub kilka sekund; w rzadkich przypadkach do 40 s", wielkoscPl: "latencja oczopląsu, kanał tylny", wielkoscEn: "nystagmus latency, posterior canal", kontekstPl: "kryterium C i nota jednostki 2.1", kontekstEn: "criterion C and note of 2.1" },
      { ranga: "kryterium", wartosc: "< 1 min", wielkoscPl: "czas trwania oczopląsu — postacie kanalolityczne", wielkoscEn: "nystagmus duration — canalolithiasis forms", kontekstPl: "kryterium C w 2.1 (typowo), 2.2 i 3.1", kontekstEn: "criterion C in 2.1 (typically), 2.2 and 3.1" },
      { ranga: "nota", wartosc: "nie przekracza 40 s", wielkoscPl: "typowy czas wygaśnięcia oczopląsu, kanał tylny", wielkoscEn: "typical time to damping of nystagmus, posterior canal", kontekstPl: "nota do 2.1", kontekstEn: "note to 2.1" },
      { ranga: "nota", wartosc: "może przekroczyć 1 min, ale nie przekracza 2 min", wielkoscPl: "sufit czasu trwania oczopląsu w kanalolitiazie kanału poziomego (zapis ruchów gałek)", wielkoscEn: "ceiling on nystagmus duration in horizontal canalolithiasis (eye-movement recording)", kontekstPl: "nota do kryterium C jednostki 2.2 — rozluźnia próg z samego kryterium; źródło podaje obie liczby", kontekstEn: "note to criterion C of 2.2 — it loosens the threshold stated in the criterion itself; the source gives both figures" },
      { ranga: "kryterium", wartosc: "> 1 min", wielkoscPl: "czas trwania oczopląsu — postacie kupulolityczne", wielkoscEn: "nystagmus duration — cupulolithiasis forms", kontekstPl: "kryterium B w 2.3 i w 3.2 — to ono zastępuje brakujące kryterium czasu napadu", kontekstEn: "criterion B in 2.3 and 3.2 — it replaces the missing attack-duration criterion" },
      { ranga: "nota", wartosc: "narastanie przez ok. 30 s, następnie zanik przez kilka minut", wielkoscPl: "narastanie i zanik oczopląsu w kupulolitiazie kanału poziomego", wielkoscEn: "build-up and decay of nystagmus in horizontal cupulolithiasis", kontekstPl: "nota do kryterium B jednostki 2.3 — kształt obwiedni odróżniający od crescendo-decrescendo kanalolitiazy", kontekstEn: "note to criterion B of 2.3 — the envelope shape distinguishing it from the crescendo-decrescendo of canalolithiasis" },
      { ranga: "kryterium", wartosc: "natychmiast albo jedna lub kilka sekund; w rzadkich przypadkach do 30 s", wielkoscPl: "latencja oczopląsu, kanał przedni", wielkoscEn: "nystagmus latency, anterior canal", kontekstPl: "kryterium C i nota jednostki 3.1", kontekstEn: "criterion C and note of 3.1" },
    ],
    granicePl: [
      "Praca NIE wymaga żadnego badania instrumentalnego do rozpoznania BPPV. Okulary Frenzla, wideookulografia i cewki twardówkowe są opisane jako „pomocne\" albo „mogące ułatwić\"; napisano wprost, że w większości przypadków oczopląs widać klinicznie bez specjalnego sprzętu. Jedyne kategoryczne wymagania to: oczopląs położeniowy swoisty dla kanału dla rozpoznania PEWNEGO oraz przebadanie kanałów pionowych I poziomego u KAŻDEGO chorego z zawrotem położeniowym.",
      "Obrazowanie mózgu lub ucha NIE jest wymagane w typowych przypadkach. MRI jest zwykle wskazane tylko wtedy, gdy: (a) są objawy podmiotowe lub przedmiotowe współistniejącej dysfunkcji pnia mózgu lub móżdżku, ALBO (b) zawrót i oczopląs mają cechy atypowe, ALBO (c) nie ustępują po powtarzanych leczniczych manewrach pozycyjnych. Skrót „MRI\" ma w pracy dokładnie jedno wystąpienie; o tomografii komputerowej praca nie wspomina w ogóle (ciąg „CT\" jako całe słowo = 0) — nie wolno jej przypisać zdania „nie wykonuj CT\".",
      "Nakaz wykluczenia OUN jest w pracy sformułowany DWUKROTNIE i NIERÓWNO: bezwarunkowo przy apogeotropowym oczopląsie zmieniającym kierunek (2.3) i warunkowo — tylko przy braku niezwłocznej odpowiedzi na manewry lecznicze — przy oczopląsie bijącym w dół (3.1). W żadnym innym zestawie kryteriów takiego dopisku nie ma. Ta asymetria jest wewnętrzną niespójnością źródła, nie decyzją redakcyjną atlasu.",
      "Praca NIE ma sekcji o ośrodkowym oczopląsie położeniowym ani o zespołach do odróżnienia; nie podaje kryteriów żadnej jednostki innej niż BPPV. Materiał różnicowy jest rozproszony i sprowadza się do: reguły płaszczyzny (oczopląs BPPV zawsze bije w płaszczyźnie zajętego kanału — w przeciwieństwie do ośrodkowego), wskazania na migrenę przedsionkową i strukturalne uszkodzenia pnia i móżdżku typowo w okolicy CZWARTEJ KOMORY, oraz czerwonych flag kierunkowych: przeważnie POZIOME albo bijące W DÓŁ postacie oczopląsu położeniowego są najczęściej opisywane w ośrodkowych zespołach naśladujących.",
      "Praca NIE podaje wymaganej LICZBY napadów: kryterium A mówi tylko „nawracające napady\", bez progu liczbowego, bez okna czasowego i bez minimalnej liczby epizodów.",
      "Praca NIE mówi, że brak oczopląsu wyklucza BPPV — przeciwnie, tworzy dla takich chorych kody 2.4 (okres bezobjawowy) i 3.4 (okres objawowy, oczopląsu nie widać mimo rejestracji).",
    ],
    graniceEn: [
      "The paper does NOT require any instrumental test to diagnose BPPV. Frenzel goggles, video-oculography and search coils are described as \"helpful\" or as things that \"may enhance\" observation; it states explicitly that in most cases the nystagmus can be seen clinically without special equipment. The only categorical requirements are: canal-specific positional nystagmus for a DEFINITE diagnosis, and testing of BOTH the vertical AND the horizontal canals in EVERY patient with positional vertigo.",
      "Brain or ear imaging is NOT required in typical cases. MRI is usually indicated only when: (a) there are symptoms or signs of accompanying brainstem or cerebellar dysfunction, OR (b) the positional vertigo and nystagmus have atypical features, OR (c) they fail to resolve after repeated therapeutic positional maneuvers. The abbreviation \"MRI\" appears exactly once in the paper; computed tomography is not mentioned at all (\"CT\" as a whole word = 0) — the paper cannot be credited with a \"do not order CT\" statement.",
      "The requirement to exclude CNS disease is stated TWICE and UNEQUALLY: unconditionally for apogeotropic direction-changing nystagmus (2.3), and conditionally — only when there is no prompt response to therapeutic maneuvers — for downbeating nystagmus (3.1). No other criteria set carries such an addendum. This asymmetry is an internal inconsistency of the source, not an editorial choice of the atlas.",
      "The paper has NO section on central positional nystagmus or on syndromes to be distinguished from BPPV, and it supplies criteria for no entity other than BPPV. The differential material is scattered and amounts to: the plane rule (BPPV nystagmus always beats in the plane of the affected canal — in contrast to central positional nystagmus), a pointer to vestibular migraine and to structural brainstem and cerebellar lesions typically in the region of the FOURTH VENTRICLE, and directional red flags: predominantly HORIZONTAL or DOWNBEATING forms of positional nystagmus are the ones most often reported in central mimics.",
      "The paper gives NO required NUMBER of attacks: criterion A says only \"recurrent attacks\", with no numeric threshold, no time window and no minimum episode count.",
      "The paper does NOT say that absence of nystagmus rules out BPPV — on the contrary, it creates codes 2.4 (symptom-free interval) and 3.4 (symptomatic, nystagmus not seen despite recording) for such patients.",
    ],
  },
  {
    klucz: "auvp",
    zrodlo: "[H59] Strupp 2022",
    typ: "jednostka",
    nazwaPl: "Ostra jednostronna westybulopatia / zapalenie nerwu przedsionkowego",
    nazwaEn: "Acute unilateral vestibulopathy / vestibular neuritis",
    zespol: "AVS",
    wSilniku: "modelowana",
    wSilnikuDowod: "grep -rniE 'auvp|unilateral vestibulopathy|neuritis|neuronitis' src/ = 75 trafien w 8 plikach (src/render/svg-screens.js 24, src/engine/neuro-vor.js 22, src/app/actions.js 21, src/main.js 2, src/app/state.js 2, src/app/lab-model.js 2, src/pose/maneuvers.js 1, src/app/triage-model.js 1). To nie sa same etykiety: src/engine/neuro-vor.js w. 977 i 979 definiuja presety neuritisR/neuritisL z polem side, ktore zasilaja obliczenia gain i oczoplasu (w. 113 komentarz o gain wejsciowym 0.1 przy pelnym ubytku), a w. 1390 wystawia wnioskowanie o neuronitis nerwu DOLNEGO z wynikow vHIT RALP/LARP i kaloryki. Silnik liczy obraz tej jednostki, nie tylko ja nazywa. Punkt zaczepienia linku z kwalifikacji juz istnieje: src/app/triage-model.js w. 445 niesie atlas: ['auvp','naczyniowe'].",
    streszczeniePl: "Ostra jednostronna westybulopatia (AUVP) jest w tym dokumencie zdefiniowana jako ostry OBWODOWY zespół przedsionkowy: jednostronny ubytek obwodowej czynności przedsionkowej, któremu nie towarzyszą ostre ośrodkowe objawy ani cechy neurologiczne, ani ostre objawy audiologiczne. Obraz kliniczny buduje się z trzech elementów: utrzymującego się zawrotu o nasileniu umiarkowanym do ciężkiego, samoistnego oczopląsu o cechach obwodowych oraz obniżonej czynności VOR po stronie przeciwnej do fazy szybkiej. Komitet wyodrębnił cztery kategorie rozpoznania — pełną, „w toku”, prawdopodobną i „w wywiadzie” — różniące się oknem czasowym oraz tym, jak mocno udokumentowany jest ubytek VOR. Dokument nazywa AUVP rozpoznaniem stawianym PO wykluczeniu ostrego ośrodkowego zespołu przedsionkowego z powodu zmiany w pniu mózgu lub móżdżku.",
    streszczenieEn: "Acute unilateral vestibulopathy (AUVP) is defined here as an acute PERIPHERAL vestibular syndrome: a one-sided loss of peripheral vestibular function without accompanying acute central neurological symptoms or signs and without acute audiological symptoms. Three elements build the clinical picture — sustained vertigo of moderate to severe intensity, a spontaneous nystagmus with peripheral characteristics, and reduced VOR function on the side opposite the fast phase. The committee separated four diagnostic categories — the full form, „in evolution”, probable, and „history of” — differing in their time window and in how firmly the VOR deficit is documented. The document treats AUVP as a diagnosis reached only once an acute central vestibular syndrome — one arising from a lesion of the brainstem or the cerebellum — has been ruled out.",
    synonimy: [
      { pl: "zapalenie nerwu przedsionkowego (vestibular neuritis)", en: "vestibular neuritis" },
      { pl: "zapalenie neuronów przedsionkowych (vestibular neuronitis)", en: "vestibular neuronitis" },
      { pl: "ostra utrata czynności przedsionkowej (acute vestibular loss)", en: "acute vestibular loss" },
      { pl: "ostra niewydolność przedsionkowa (acute vestibular failure)", en: "acute vestibular failure" },
    ],
    kryteria: [
      {
        postac: "AUVP",
        nazwaPl: "Ostra jednostronna westybulopatia", nazwaEn: "Acute unilateral vestibulopathy",
        wymagane: "wszystkie A–F (tekst główny poprzedza listę zdaniem, że każde z kryteriów musi być spełnione)",
        punkty: [
          { litera: "A", pl: "Ostry LUB podostry początek utrzymującego się zawrotu wirowego ALBO niewirowego (tj. ostry zespół przedsionkowy) o nasileniu umiarkowanym do ciężkiego, z objawami trwającymi co najmniej 24 godziny.", en: "Onset that is acute OR subacute, with vertigo that persists — spinning OR non-spinning (i.e. an acute vestibular syndrome) — graded moderate to severe and present for 24 hours or longer." },
          { litera: "B", pl: "Samoistny obwodowy oczopląs przedsionkowy — o torze odpowiadającym zajętym aferentom kanałów półkolistych, na ogół poziomo-skrętny, o stałym kierunku, nasilający się po zniesieniu fiksacji wzrokowej.", en: "A spontaneous nystagmus of peripheral vestibular type: its trajectory follows whichever semicircular-canal afferents are affected (usually horizontal-torsional), it keeps a single direction, and it grows stronger once visual fixation is taken away." },
          { litera: "C", pl: "JEDNOZNACZNE dowody obniżonej czynności VOR po stronie PRZECIWNEJ do kierunku fazy szybkiej oczopląsu samoistnego.", en: "UNAMBIGUOUS evidence that VOR function is reduced on the ear OPPOSITE to the fast-phase direction of the spontaneous nystagmus." },
          { litera: "D", pl: "Brak dowodów na ostre ośrodkowe OBJAWY neurologiczne ani ostre OBJAWY audiologiczne, takie jak niedosłuch lub szumy uszne, ani inne objawy uszne, np. ból ucha.", en: "No evidence of acutely arising central neurological SYMPTOMS, nor of acute audiological SYMPTOMS (hearing loss or tinnitus), nor of any other ear symptom such as otalgia." },
          { litera: "E", pl: "Brak ostrych ośrodkowych CECH neurologicznych, to jest brak ośrodkowych cech okoruchowych ani ośrodkowych cech przedsionkowych — w szczególności BRAK skew deviation, BRAK oczopląsu wywołanego spojrzeniem, ORAZ brak ostrych cech audiologicznych.", en: "No acute central neurological SIGNS — neither ocular motor nor vestibular signs of central type; specifically NO skew deviation, NO gaze-evoked nystagmus, AND no acute audiological signs." },
          { litera: "F", pl: "Obraz nie tłumaczy się lepiej inną chorobą lub zaburzeniem.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Kryterium D dotyczy WYŁĄCZNIE objawów (symptoms), a kryterium E wyłącznie cech przedmiotowych (signs). Ten sam rozdział obowiązuje w postaci „w toku” i w prawdopodobnej, ale UWAGA: w kategorii „w wywiadzie” niosą go INNE LITERY — objawy stoją w punkcie B, a cechy w punkcie D.",
          "Nota do kryterium B stawia twardy warunek techniczny: badanie oczopląsu musi odbywać się z okularami Frenzla, urządzeniem podobnym ALBO systemem kamery wideo. Oczopląs poziomo-skrętny, który NIE jest redukowany fiksacją wzrokową, nie powinien być uznawany za pochodzenia obwodowego.",
          "Nota do kryterium C definiuje „jednoznaczne dowody” jako deficyt wykazywalny ilościowo (np. obniżony jednostronny gain VOR w vHIT albo jednostronnie obniżona odpowiedź kaloryczna), ale DOPUSZCZA także przyłóżkowy HIT — pod warunkiem, że doświadczony badający widzi sakady refiksacyjne o dużej amplitudzie, wyraźnie odrębne od uderzeń oczopląsu. Komitet jednocześnie deklaruje świadomość niskiej czułości i swoistości przyłóżkowego HIT.",
          "Nota do nasilenia: „umiarkowane” = możliwe są podstawowe czynności, np. przejście krótkiego dystansu; „ciężkie” = chory jest przykuty do łóżka. Leczenie przeciwzawrotowe i/lub steroidy mogą obniżyć nasilenie ORAZ skrócić czas trwania cech i objawów — czyli mogą zafałszować kryterium A.",
          "Nota do dolnej granicy 24 h: jeśli ostry zespół przedsionkowy CAŁKOWICIE ustępuje przed upływem 24 h, rozpoznanie AUVP jest mało prawdopodobne.",
        ],
        przypisyEn: [
          "Criterion D covers SYMPTOMS only and criterion E covers SIGNS only. The same split holds in the „in evolution” and probable forms, but NOTE: in the „history of” category it is carried by DIFFERENT LETTERS — symptoms sit in point B and signs in point D.",
          "The note to criterion B sets a hard technical condition: nystagmus must be examined with Frenzel's glasses, a comparable device, OR a video camera system. A horizontal-torsional nystagmus that is NOT reduced by visual fixation should not be regarded as peripheral vestibular in origin.",
          "The note to criterion C defines „unambiguous evidence” as a quantitatively demonstrable deficit (e.g. reduced unilateral vHIT VOR gain or a unilaterally reduced caloric response), but ALSO admits the bedside HIT — provided an experienced examiner sees large-amplitude refixation saccades clearly distinct from nystagmus beats. The committee says in the same breath that it knows how poor the bedside HIT is in both sensitivity and specificity.",
          "Note on intensity: „moderate” = basic activities such as walking a short distance remain possible; „severe” = the patient is bedbound. Antivertiginous drugs and/or steroids can reduce intensity AND shorten the duration of signs and symptoms — that is, they can distort criterion A.",
          "Note on the 24-hour floor: if the acute vestibular syndrome resolves COMPLETELY before 24 hours, an AUVP diagnosis is unlikely.",
        ],
      },
      {
        postac: "AUVP w toku",
        nazwaPl: "Ostra jednostronna westybulopatia w toku", nazwaEn: "Acute unilateral vestibulopathy in evolution",
        wymagane: "wszystkie A–F (tekst główny poprzedza listę zdaniem, że każde z kryteriów musi być spełnione)",
        punkty: [
          { litera: "A", pl: "Ostry lub podostry początek utrzymującego się zawrotu wirowego albo niewirowego (ostry zespół przedsionkowy) o nasileniu umiarkowanym do ciężkiego, z objawami CIĄGŁYMI trwającymi POWYŻEJ 3 GODZIN, ale jeszcze NIE trwającymi co najmniej 24 godzin.", en: "Onset acute or subacute, with persistent vertigo — spinning or non-spinning (the acute vestibular syndrome) — of moderate to severe intensity, the symptoms CONTINUOUS for MORE THAN 3 HOURS but NOT YET as long as 24 hours." },
          { litera: "B", pl: "Samoistny obwodowy oczopląs przedsionkowy o stałym kierunku, nasilający się po zniesieniu fiksacji wzrokowej, o torze odpowiadającym zajętym aferentom kanałów półkolistych (na ogół poziomo-skrętny).", en: "Spontaneous peripheral vestibular nystagmus, direction-fixed, enhanced by removal of visual fixation, with a trajectory matching the semicircular-canal afferents involved (generally horizontal-torsional)." },
          { litera: "C", pl: "Jak w postaci pełnej: JEDNOZNACZNE dowody obniżonej czynności VOR po stronie przeciwnej do kierunku fazy szybkiej.", en: "As in the full form: UNAMBIGUOUS evidence of reduced VOR function, on the ear opposite the fast phase." },
          { litera: "D", pl: "Jak w postaci pełnej: brak dowodów na ostre ośrodkowe objawy neurologiczne ani ostre objawy audiologiczne (niedosłuch, szumy uszne) ani inne objawy uszne, np. ból ucha.", en: "As in the full form: no evidence of acute central neurological symptoms or acute audiological symptoms (hearing loss, tinnitus) or other otologic symptoms such as otalgia." },
          { litera: "E", pl: "Brak ostrych ośrodkowych cech neurologicznych, tj. brak ośrodkowych cech okoruchowych ani przedsionkowych — w szczególności brak skew deviation, LUB oczopląsu wywołanego spojrzeniem, LUB ostrych cech audiologicznych.", en: "No acute central neurological signs, that is no central ocular motor or vestibular signs — in particular no skew deviation, OR gaze-evoked nystagmus, OR acute audiological signs." },
          { litera: "F", pl: "Obraz nie tłumaczy się lepiej inną chorobą lub zaburzeniem.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Okno czasowe tej kategorii jest domknięte z obu stron: OBJAWY CIĄGŁE POWYŻEJ 3 h ORAZ jeszcze NIE 24 h. Abstrakt doprecyzowuje, że chodzi o stan w chwili, gdy chory jest widziany.",
          "Uzasadnienie istnienia tej kategorii podane przez komitet jest trojakie: różnicowanie z innymi ostrymi OŚRODKOWYMI zespołami przedsionkowymi, rozpoczęcie swoistego leczenia oraz włączanie chorych do badań klinicznych.",
          "W kryterium E tekst główny zapisuje operator jako „brak … , LUB … , LUB …”, podczas gdy w postaci pełnej stoi „brak … , brak … , ORAZ brak …”. Pod negacją oba zapisy znaczą to samo (żadnej z trzech cech) — różnica jest redakcyjna, nie logiczna.",
          "Kryterium B tej kategorii niesie odsyłacz do noty o zależności toru oczopląsu od zajętej gałęzi nerwu, którego kryterium B postaci pełnej NIE ma — dlatego nie jest ścisłe mówienie, że punkt B jest „identyczny”.",
        ],
        przypisyEn: [
          "The time window of this category is bounded on both sides: CONTINUOUS symptoms for MORE THAN 3 h AND not yet 24 h. The abstract adds that this refers to the state at the moment the patient is seen.",
          "The committee gives three reasons for the category: differentiation from other acute CENTRAL vestibular syndromes, initiation of specific treatments, and enrolment of patients into clinical trials.",
          "In criterion E the main text writes the operator as „no … , OR … , OR …”, whereas the full form reads „no … , no … , AND no …”. Under negation the two are equivalent (none of the three signs) — the difference is editorial, not logical.",
          "Criterion B in this category carries a reference to the note linking nystagmus trajectory to the affected nerve branch, which criterion B of the full form does NOT — so calling point B „identical” is not exact.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobna ostra jednostronna westybulopatia", nazwaEn: "Probable acute unilateral vestibulopathy",
        wymagane: "A–F; UWAGA: tekst główny NIE zawiera dla tej kategorii preambuły „każde z kryteriów musi być spełnione” (zdanie to pada tylko przy postaci pełnej i przy postaci w toku)",
        punkty: [
          { litera: "A", pl: "Jak w postaci pełnej: ostry lub podostry początek utrzymującego się zawrotu wirowego albo niewirowego (ostry zespół przedsionkowy) o nasileniu umiarkowanym do ciężkiego, z objawami trwającymi co najmniej 24 godziny.", en: "As in the full form: onset acute or subacute, with persistent vertigo (spinning or non-spinning) of moderate to severe intensity — an acute vestibular syndrome — lasting 24 hours or more." },
          { litera: "B", pl: "Samoistny obwodowy oczopląs przedsionkowy o stałym kierunku, nasilający się po zniesieniu fiksacji wzrokowej, o torze odpowiadającym zajętym aferentom kanałów (na ogół poziomo-skrętny).", en: "Spontaneous peripheral vestibular nystagmus, direction-fixed, enhanced by removal of visual fixation, with a trajectory matching the canal afferents involved (generally horizontal-torsional)." },
          { litera: "C", pl: "BRAK WYRAŹNYCH DOWODÓW obniżonej czynności VOR W BADANIU PRZYŁÓŻKOWYM po stronie przeciwnej do kierunku fazy szybkiej oczopląsu samoistnego.", en: "NO CLEAR EVIDENCE, ON BEDSIDE EXAMINATION, that VOR function is reduced on the ear OPPOSITE to the fast-phase direction of the spontaneous nystagmus." },
          { litera: "D", pl: "Brak dowodów na ostre ośrodkowe objawy neurologiczne ani ostre objawy audiologiczne, takie jak niedosłuch lub szumy uszne. (W tej kategorii tekst główny NIE wymienia bólu ucha ani innych objawów usznych.)", en: "No evidence of acutely arising central neurological SYMPTOMS, nor of acute audiological ones (hearing loss or tinnitus). (In this category the main text does NOT mention otalgia or other otologic symptoms.)" },
          { litera: "E", pl: "Jak w postaci pełnej: brak ostrych ośrodkowych cech neurologicznych — brak skew deviation, brak oczopląsu wywołanego spojrzeniem, oraz brak ostrych cech audiologicznych.", en: "As in the full form: no acute central neurological signs — no skew deviation, no gaze-evoked nystagmus, and no acute audiological signs." },
          { litera: "F", pl: "Obraz nie tłumaczy się lepiej inną chorobą lub zaburzeniem.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Kryterium C tej kategorii jest POZYTYWNIE SFORMUŁOWANYM BRAKIEM DOWODU, a NIE stwierdzeniem prawidłowego VOR. Tekst główny dodatkowo zawęża je do badania PRZYŁÓŻKOWEGO — słów „w badaniu przyłóżkowym” nie ma w wersji z abstraktu.",
          "Abstrakt definiuje tę kategorię skrótowo: identyczna jak postać pełna z wyjątkiem tego, że jednostronny ubytek VOR nie jest wyraźnie stwierdzony ani udokumentowany.",
          "Kategoria istnieje po to, by nazwać sytuację, w której jednostronny obwodowy ubytek przedsionkowy pozostaje niepewny.",
        ],
        przypisyEn: [
          "Criterion C of this category is a POSITIVELY WORDED ABSENCE OF EVIDENCE, NOT a statement that the VOR is normal. The main text further narrows it to the BEDSIDE examination — the words „by bedside examination” do not appear in the abstract version.",
          "The abstract states the category compactly: identical to the full form except that the unilateral VOR deficit is not clearly found or documented.",
          "The category exists to name the situation in which a unilateral peripheral vestibular deficit remains uncertain.",
        ],
      },
      {
        postac: "AUVP w wywiadzie",
        nazwaPl: "Ostra jednostronna westybulopatia w wywiadzie", nazwaEn: "History of acute unilateral vestibulopathy",
        wymagane: "A–E (PIĘĆ punktów, nie sześć); tekst główny nie zawiera dla tej kategorii preambuły „każde z kryteriów musi być spełnione”",
        punkty: [
          { litera: "A", pl: "WYWIAD ostrego lub podostrego początku utrzymującego się zawrotu wirowego albo niewirowego trwającego co najmniej 24 godziny (tj. ostry zespół przedsionkowy) I POWOLI MALEJĄCEGO W NASILENIU W CIĄGU DNI.", en: "A HISTORY of acute or subacute onset, with vertigo (spinning or non-spinning) that persisted for 24 hours or longer — i.e. an acute vestibular syndrome — AND THEN EASED IN INTENSITY SLOWLY, OVER DAYS." },
          { litera: "B", pl: "Brak w wywiadzie równocześnie występujących ostrych ośrodkowych objawów neurologicznych ani audiologicznych, takich jak niedosłuch lub szumy uszne.", en: "No history of central neurological or audiological symptoms arising acutely at the same time — hearing loss or tinnitus, for example." },
          { litera: "C", pl: "Dowody jednostronnie obniżonej czynności VOR.", en: "Evidence of unilaterally reduced VOR function." },
          { litera: "D", pl: "Brak w wywiadzie równocześnie występujących ostrych ośrodkowych CECH neurologicznych ani audiologicznych.", en: "No history of simultaneous acute central neurological or audiological SIGNS." },
          { litera: "E", pl: "Obraz nie tłumaczy się lepiej inną chorobą lub zaburzeniem.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Ta kategoria jako JEDYNA z czterech NIE zawiera punktu o oczopląsie samoistnym i NIE stawia wymogu nasilenia objawów — dotyczy chorego badanego długo po fazie ostrej.",
          "Kryterium C w tekście głównym brzmi po prostu „dowody jednostronnie obniżonej czynności VOR”, BEZ słowa „jednoznaczne”, które abstrakt w tym miejscu dopisuje. W kategorii pełnej i „w toku” słowo „jednoznaczne” stoi w obu miejscach.",
          "Nota ograniczająca tę kategorię (nieprzywołana przy żadnym punkcie kryteriów) mówi wprost: część chorych z wywiadem zgodnym z AUVP ma prawidłowe wyniki badań przedsionkowych w chwili badania, a inne rozpoznania mogą wyglądać podobnie. Dlatego kategorii można użyć TYLKO wtedy, gdy obecna jest zmiana jednostronna i inne przyczyny jednostronnej utraty czynności uznano za mało prawdopodobne.",
          "Ta sama nota zawiera zdanie kluczowe dla interpretacji badań: proponowane kryteria jednostronnej niedoczynności przedsionkowej NIE dają ŻADNEJ informacji o momencie POWSTANIA zmiany. Przewaga kierunkowa w próbie kalorycznej lub rotacyjnej albo obecność samoistnego oczopląsu to tylko wskazówki, że początek jest niedawny — o NISKIEJ swoistości.",
        ],
        przypisyEn: [
          "This is the ONLY one of the four categories with NO point about spontaneous nystagmus and NO intensity requirement — it addresses the patient examined long after the acute phase.",
          "Criterion C in the main text reads simply „evidence of unilaterally reduced VOR function”, WITHOUT the word „unambiguous”, which the abstract adds at that point. In the full and „in evolution” categories „unambiguous” appears in both places.",
          "The note limiting this category (referenced from none of the criteria points) states plainly: some patients with a history consistent with AUVP have normal vestibular test results at the time of examination, and other diagnoses can look similar. The category may therefore be used ONLY when a unilateral lesion is present and other causes of unilateral vestibular loss have been judged unlikely.",
          "The same note carries the sentence that governs test interpretation: the proposed criteria for unilateral vestibular hypofunction give NO information about WHEN the lesion arose. A directional preponderance seen on caloric or on rotational testing, or a spontaneous vestibular nystagmus being present, are no more than hints that the onset was recent — and their specificity is LOW.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "≥ 24 h", wielkoscPl: "minimalny czas trwania objawów", wielkoscEn: "minimum symptom duration", kontekstPl: "kryterium A postaci pełnej, prawdopodobnej i „w wywiadzie”", kontekstEn: "criterion A of the full, probable and „history of” forms" },
      { ranga: "kryterium", wartosc: "> 3 h i < 24 h", wielkoscPl: "okno czasowe kategorii „w toku”", wielkoscEn: "time window of the „in evolution” category", kontekstPl: "kryterium A postaci „w toku”; objawy ciągłe powyżej 3 h, ale jeszcze nie 24 h", kontekstEn: "criterion A of the „in evolution” form; continuous symptoms beyond 3 h but not yet 24 h" },
      { ranga: "nota", wartosc: "< 24 h", wielkoscPl: "pełne ustąpienie objawów przed upływem doby", wielkoscEn: "complete resolution before one day", kontekstPl: "nota do kryterium A — przy pełnym ustąpieniu w tym czasie rozpoznanie AUVP jest mało prawdopodobne", kontekstEn: "note to criterion A — with complete resolution within this time an AUVP diagnosis is unlikely" },
      { ranga: "nota", wartosc: "< 0,7", wielkoscPl: "gain VOR w vHIT", wielkoscEn: "vHIT VOR gain", kontekstPl: "„robocze przybliżenie” z noty do kryterium C, poprzedzone zdaniem, że ogólnej zgody co do wartości odcięcia NIE MA", kontekstEn: "„working approximation” from the note to criterion C, preceded by the statement that there is NO general agreement on cut-off values" },
      { ranga: "nota", wartosc: "> 0,3", wielkoscPl: "różnica międzystronna gain w vHIT", wielkoscEn: "vHIT gain side difference", kontekstPl: "drugi składnik tego samego „roboczego przybliżenia”", kontekstEn: "second component of the same „working approximation”" },
      { ranga: "nota", wartosc: "> 25%", wielkoscPl: "różnica międzystronna w próbie kalorycznej", wielkoscEn: "caloric side difference", kontekstPl: "trzeci składnik „roboczego przybliżenia”; proza sekcji o kaloryce powtarza tę liczbę jako zwykłą definicję niedowładu przedsionkowego", kontekstEn: "third component of the „working approximation”; the caloric-testing prose repeats this figure as the usual definition of vestibular paresis" },
      { ranga: "nota", wartosc: "< 3°", wielkoscPl: "mała skew deviation", wielkoscEn: "small skew deviation", kontekstPl: "nota do kryterium E — występuje u ok. 20% chorych z AUVP i NIE powinna być używana do wykluczenia rozpoznania", kontekstEn: "note to criterion E — present in about 20% of AUVP patients and should NOT be used to exclude the diagnosis" },
      { ranga: "nota", wartosc: "> 3,3°", wielkoscPl: "wyraźna skew deviation", wielkoscEn: "prominent skew deviation", kontekstPl: "nota do kryterium E — sugeruje zmianę OŚRODKOWĄ; przy czym SD stwierdzano tylko u ok. 30% chorych z ostrym ośrodkowym zespołem przedsionkowym, więc czułość tej cechy jest bardzo niska", kontekstEn: "note to criterion E — suggests a CENTRAL lesion; SD was found in only about 30% of patients with an acute central vestibular syndrome, so the sensitivity of this sign is very low" },
    ],
    granicePl: [
      "Progi vHIT i kaloryki NIE są standardem. Nota nazywa je „roboczym przybliżeniem” i poprzedza zdaniem, że ogólnej zgody co do patologicznych wartości odcięcia dotąd NIE MA, a obliczenia zależą od sprzętu i systemu analizy; badania mają się opierać na normach pracowni lub danych producenta.",
      "OPERATOR LOGICZNY PROGÓW ROZJEŻDŻA SIĘ WEWNĄTRZ PRACY. Nota do kryterium C łączy progi zapisem „i/lub” (gain < 0,7 oraz/lub różnica gain > 0,3 i/lub różnica kaloryczna > 25%), a proza sekcji o vHIT wymaga KONIUNKCJI: gain poniżej 0,7 ORAZ różnica międzystronna powyżej 0,3. Implementując bramkę trzeba wybrać i zadeklarować wersję.",
      "SKEW DEVIATION MA W JEDNEJ PRACY TRZY BRZMIENIA: tekst główny kryterium E — „brak skew deviation” bez kwalifikatora; abstrakt — „brak WYRAŹNEJ skew deviation”; nota i komentarz — mała SD (< 3°) NIE wyklucza AUVP, a dostrzegalna SD „przeczy, ale NIE wyklucza”.",
      "HINTS NIE jest elementem kryteriów. Akronim nie pada ani razu w bloku kryteriów ani w notach — występuje wyłącznie w komentarzu różnicowym i w tabeli różnicowej.",
      "SUPRESJA FIKSACYJNA DZIAŁA TYLKO W JEDNĄ STRONĘ. Dokument mówi wprost, że niektóre oczopląsy ośrodkowe (np. w zawale pnia) także mogą być redukowane fiksacją — a więc OBECNOŚĆ supresji NIE wyklucza zmiany ośrodkowej. Rozstrzygający jest kierunek odwrotny: BRAK supresji oznacza, że oczopląs nie jest obwodowy.",
      "PEŁNEJ LISTY CZERWONYCH FLAG OŚRODKOWYCH W TEJ PRACY NIE MA. Definicję ośrodkowych cech okoruchowych sugerujących ostry ośrodkowy zespół przedsionkowy dokument deleguje do osobnego dokumentu ICVD o zawrotach naczyniopochodnych; sam podaje tylko wybraną listę w komentarzu.",
    ],
    graniceEn: [
      "The vHIT and caloric thresholds are NOT a standard. The note calls them a „working approximation” and prefaces them with the statement that there is so far NO general agreement on pathological cut-off values, that calculations depend on the equipment and analysis system used, and that investigations must rely on laboratory standards or manufacturers' data.",
      "THE LOGICAL OPERATOR ON THE THRESHOLDS DIVERGES WITHIN THE PAPER. The note to criterion C joins them with „and/or” (gain < 0.7 and/or gain side difference > 0.3 and/or caloric side difference > 25%), whereas the vHIT prose requires a CONJUNCTION: gain below 0.7 AND side difference above 0.3. Any implemented gate must pick and declare a version.",
      "SKEW DEVIATION HAS THREE WORDINGS IN ONE PAPER: the main text of criterion E — „no skew deviation”, unqualified; the abstract — „no PRONOUNCED skew deviation”; the note and commentary — a small SD (< 3°) does NOT exclude AUVP, and an observable SD „contravenes but does not rule out” the diagnosis.",
      "HINTS is NOT part of the criteria. The acronym appears nowhere in the criteria block or in the notes — only in the differential-diagnosis commentary and table.",
      "FIXATION SUPPRESSION WORKS IN ONE DIRECTION ONLY. The document states plainly that some central nystagmus (e.g. in brainstem infarction) can also be reduced by fixation — so the PRESENCE of suppression does NOT exclude a central lesion. Only the reverse holds: ABSENCE of suppression means the nystagmus is not peripheral.",
      "THE FULL LIST OF CENTRAL RED FLAGS IS NOT IN THIS PAPER. The definition of central ocular motor signs suggesting an acute central vestibular syndrome is delegated to a separate ICVD document on vascular vertigo and dizziness; this paper supplies only a selected list in commentary.",
    ],
  },
  {
    klucz: "naczyniowe",
    zrodlo: "[H58] Kim 2022",
    typ: "jednostka",
    nazwaPl: "Zawroty głowy pochodzenia naczyniowego",
    nazwaEn: "Vascular vertigo and dizziness",
    zespol: "wiele",
    wSilniku: "modelowana",
    wSilnikuDowod: "W worktree C:/Users/kuzni/OneDrive/Dokumenty/Otorepo_code/files/.claude/worktrees/atlas-otoneurologiczny: grep -rniE 'udar|stroke' src/ = 146 trafień (najwięcej w src/render/svg-screens.js = 100, src/engine/neuro-vor.js = 15, src/app/hints-model.js = 10); grep -rniE 'zawał|infarct' src/ = 36; grep -rniE 'AICA' src/ = 15; grep -rniE 'PICA' src/ = 24; grep -rnE 'strokeCentral|aicaR' src/ = 10 trafień. Silnik LICZY obraz: SCENARIOS.strokeCentral (neuro-vor.js:981) i SCENARIOS.aicaR (neuro-vor.js:1014) generują wzorzec ośrodkowy oraz pułapkę patologicznego testu pchnięcia głową przy zawale AICA z ubytkiem słuchu (neuro-vor.js:1015-1017, 1296). ALE aparat kryterialny tej pracy jest w programie NIEOBECNY, zmierzone: grep -rn 'ABCD2' src/ = 0 trafień, grep -rniE 'vacs|bow hunter' src/ = 0 trafień, grep -rniE 'naczyniow|vascular' src/ = 7 trafień (z tego 3 to świeże odsyłacze atlasowe `atlas: ['naczyniowe']` w src/app/triage-model.js, nie aparat kryterialny). Pomiar powtórzony na stanie worktree 21bdda4 z niezacommitowanymi zmianami — liczby dryfują wraz z drzewem, zerowe trafienia ABCD2 i VACS są tu jedyną nośną treścią. Czyli: modelowany jest OBRAZ ostrego przedłużonego zespołu naczyniowego, natomiast VACS, punktacja ABCD2, próg zwężenia > 50% i osie czasu (≥ 24 h / < 24 h / w ewolucji) nie mają w silniku żadnej reprezentacji.",
    streszczeniePl: "Dokument obejmuje zawroty i uczucie oszołomienia wynikające z udaru albo z przemijającego niedokrwienia, a także zespół ucisku tętnicy kręgowej. Klasyfikacja jest zbudowana na CZASIE TRWANIA objawów: postać ostra przedłużona (24 godziny lub dłużej), postać przemijająca (poniżej 24 godzin) oraz stan pośredni „w ewolucji\", gdy chory jest badany w ciągu 24 godzin od początku objawów. Zestawów kryteriów jest SZEŚĆ. Postać potwierdzona obrazowaniem istnieje dla osi ≥ 24 h oraz — jako JEDEN wspólny zestaw — dla osi < 24 h (przemijającej i w ewolucji łącznie); postaci prawdopodobne, oparte na cechach klinicznych i profilu ryzyka naczyniowego, są trzy. Szósty, odrębny zestaw opisuje zespół ucisku tętnicy kręgowej, prowokowany utrzymywaną ekscentryczną pozycją szyi.",
    streszczenieEn: "The document covers vertigo and dizziness caused by stroke or transient ischaemia, together with vertebral artery compression syndrome. The classification is built on symptom DURATION: an acute prolonged form (24 hours or more), a transient form (less than 24 hours) and an intermediate \"in evolution\" state, when the patient is assessed within 24 hours of onset. There are SIX criteria sets in all. An imaging-confirmed form exists for the ≥ 24 h axis and — as ONE shared set — for the < 24 h axis (transient and in-evolution together); the probable forms, resting on clinical features and vascular risk profile, number three. A sixth, separate set describes vertebral artery compression syndrome, provoked by a sustained eccentric neck position.",
    synonimy: [
      { pl: "niewydolność kręgowo-podstawna", en: "vertebrobasilar insufficiency", odradzany: true, uwagaPl: "Praca stwierdza wprost, że używanie tego dawnego terminu NIE JEST ZALECANE. Dodaje kontekst: klasyfikacja NINDS III oraz Komitet Wykonawczy i Komitet Redakcyjny European Stroke Organization nie uznają izolowanego zawrotu głowy za objaw przemijającego niedokrwienia w obszarze kręgowo-podstawnym.", uwagaEn: "The paper states outright that this older term is NOT RECOMMENDED. It adds the context that the NINDS III classification and the European Stroke Organization Executive and Writing Committees do not accept isolated vertigo as a symptom of vertebrobasilar TIA." },
      { pl: "zespół łucznika", en: "bow hunter's syndrome" },
      { pl: "rotacyjny zespół tętnicy kręgowej / rotacyjny zespół ucisku lub zamknięcia tętnicy kręgowej", en: "rotational VA syndrome / rotational VA compression or occlusion syndrome" },
    ],
    kryteria: [
      {
        postac: "potwierdzona (bez przymiotnika)",
        nazwaPl: "Ostry przedłużony naczyniowy zawrót / zawroty głowy", nazwaEn: "Acute prolonged vascular vertigo/dizziness",
        wymagane: "wszystkie A-C",
        punkty: [
          { litera: "A", pl: "Ostry zawrót głowy, uczucie oszołomienia lub niestabilność trwające 24 godziny lub dłużej.", en: "Vertigo, dizziness or unsteadiness of acute onset, going on for 24 hours or longer." },
          { litera: "B", pl: "Dowód obrazowy niedokrwienia lub krwotoku w mózgu ALBO w uchu wewnętrznym, ODPOWIADAJĄCY objawom podmiotowym, przedmiotowym i wynikom badań.", en: "Imaging that shows ischaemia or haemorrhage in the brain OR in the inner ear, and that MATCHES the symptoms, the signs and the test findings." },
          { litera: "C", pl: "Obrazu nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "Ostry przedłużony zespół przedsionkowy to ciągły zawrót lub oszołomienie, zaburzenie równowagi, oscylopsja oraz objawy wegetatywne (nudności, wymioty) albo nietolerancja ruchu głowy, trwające ponad 24 godziny.",
          "Wyjściowe MRI, w tym obrazy dyfuzyjne, są fałszywie ujemne u 12-50% chorych w pierwszych 48 godzinach — dlatego przy prawidłowym badaniu wyjściowym konieczna jest ocena seryjna, a znaczenie systematycznego badania klinicznego (bardziej czułego w fazie ostrej niż obrazowanie) rośnie.",
          "Kryterium B dopuszcza zmianę w UCHU WEWNĘTRZNYM: tętnica słuchowa wewnętrzna, zwykle gałąź AICA, zaopatruje błędnik, więc ostry zawrót z ubytkiem słuchu może wynikać z zawału błędnika, a bardzo rzadko z zawału nerwu VIII. Rozpoznanie ubytku słuchowo-przedsionkowego daje szansę zapobieżenia progresji do rozleglejszego zawału krążenia tylnego.",
          "Krwotok do błędnika jest bardzo rzadki; częściej wiąże się z urazem głowy albo skazą krwotoczną, daje ciężki zawrót i głęboki ubytek słuchu o niepomyślnym rokowaniu, a w MRI sygnał hiperintensywny w błędniku w sekwencji T1 lub FLAIR — który mogą jednak dawać także zaburzenia zapalne.",
        ],
        przypisyEn: [
          "The acute prolonged vestibular syndrome is made up of continuous vertigo or dizziness, imbalance, oscillopsia and vegetative features such as nausea and vomiting, or intolerance of head motion — all of it going on beyond 24 hours.",
          "Initial MRI, diffusion-weighted images included, is falsely negative in 12-50% of patients within the first 48 hours — so a normal initial study calls for serial imaging, and systematic clinical examination (more sensitive than imaging in the acute phase) gains weight.",
          "Criterion B admits a lesion in the INNER EAR: the internal auditory artery, usually a branch of AICA, supplies the labyrinth, so acute vertigo with hearing loss may arise from labyrinthine infarction and, very rarely, from infarction of the eighth nerve. Recognising audiovestibular loss offers a chance to prevent progression to a larger posterior-circulation infarct.",
          "Labyrinthine haemorrhage is very rare; it is more often linked to head trauma or a bleeding diathesis, causes severe vertigo and profound hearing loss with a poor prognosis, and shows a hyperintense labyrinthine signal on T1 or FLAIR MRI — a signal that inflammatory disorders can also produce.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobny ostry przedłużony naczyniowy zawrót / zawroty głowy", nazwaEn: "Probable acute prolonged vascular vertigo/dizziness",
        wymagane: "A ORAZ co najmniej jedno z B1-B4 ORAZ C",
        punkty: [
          { litera: "A", pl: "Ostry zawrót głowy, oszołomienie lub niestabilność trwające 24 godziny lub dłużej.", en: "Vertigo, dizziness or unsteadiness of acute onset, going on for 24 hours or longer." },
          { litera: "B1", pl: "Ogniskowe ośrodkowe objawy podmiotowe i przedmiotowe, np. niedowład połowiczy, ubytek czucia, dyzartria, dysfagia ALBO ciężka ataksja tułowia / niestabilność postawy.", en: "Focal neurological symptoms and signs of central type — hemiparesis, sensory loss, dysarthria and dysphagia among them — OR truncal ataxia / postural instability of severe degree." },
          { litera: "B2", pl: "Co najmniej jeden składnik ośrodkowego HINTS: prawidłowy test pchnięcia głową, oczopląs spojrzeniowy zmieniający kierunek, wyraźne odchylenie skośne.", en: "At least one HINTS component of the central pattern: head impulse test normal, gaze-evoked nystagmus that switches direction, or skew deviation that is pronounced." },
          { litera: "B3", pl: "Inne ośrodkowe nieprawidłowości okoruchowe, np. oczopląs typu ośrodkowego, zaburzone sakady, zaburzone wodzenie płynne.", en: "Other ocular motor abnormalities of central type — for instance central nystagmus, saccades that are impaired, smooth pursuit that is impaired." },
          { litera: "B4", pl: "Zwiększone ryzyko zdarzeń naczyniowych, np. punktacja ABCD2 równa 4 lub więcej, albo migotanie przedsionków.", en: "A raised risk of vascular events — an ABCD2 score of 4 or more, or atrial fibrillation, as examples." },
          { litera: "C", pl: "Obrazu nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "Postać prawdopodobna różni się od potwierdzonej WYŁĄCZNIE kryterium B: tam obrazowanie, tutaj co najmniej jedna z czterech cech klinicznych lub cech ryzyka. Postać prawdopodobna nie wymaga żadnego obrazowania.",
          "Ciężka ataksja tułowia ma definicję operacyjną: chory nie jest w stanie utrzymać wyprostowanej pozycji siedzącej ani stojącej bez podparcia. W badaniu z 2016 roku żaden chory z ostrą jednostronną westibulopatią jej nie wykazywał. ALE ataksja lekka do umiarkowanej NIE wyklucza zmiany ośrodkowej. Chorego zbyt objawowego, by chodzić, prosi się o siedzenie wyprostowane na noszach ze skrzyżowanymi ramionami.",
          "Metryki HINTS z pracy pochodzą z badania 101 chorych (69 udarów niedokrwiennych, 4 krwotoki, 28 bez udaru), w którym dopracowany protokół przyłóżkowy wykonywał klinicysta-ekspert: czułość do 100% (69/69; 95% CI 95-100%), swoistość 96% (24/25; 95% CI 80-100%), LR+ 25 (95% CI 3,66-170,59), LR− 0,00 (95% CI 0,00-0,11); wyjściowe obrazy dyfuzyjne były prawidłowe u 12% (8/69) chorych z udarem niedokrwiennym. Populacja: zawrót trwający ponad 24 h ORAZ jeden naczyniowy czynnik ryzyka.",
          "Spośród trzech składników HINTS poziomy test pchnięcia głową miał najwyższą łączną czułość 0,85 (95% CI 0,79-0,91) i swoistość 0,95 (95% CI 0,90-1,00) dla przyczyn ośrodkowych. Ponieważ patologiczny test pchnięcia i odchylenie skośne występują i przy zmianach obwodowych, i ośrodkowych, testy te są komplementarne.",
          "NOTA BEZPIECZEŃSTWA: HINTS może nie być wystarczająco czuły w zawale AICA, bo test pchnięcia głową jest tam przeważnie patologiczny — chory może mieć izolowany zawrót z UJEMNYM HINTS, naśladując ostrą jednostronną westibulopatię. Około 5% chorych z udarem AICA miało ostry przedłużony zawrót i niedowład kanału bez ubytku słuchu; w innym badaniu HINTS był ujemny u 5 z 17 chorych (29,4%) z zawałem AICA. Przy ujemnym HINTS praca każe dołożyć poziome potrząsanie głową, badanie słuchu pocieraniem palców oraz badanie stania i chodu.",
        ],
        przypisyEn: [
          "The probable form differs from the confirmed one SOLELY in criterion B: imaging there, at least one of four clinical or risk features here. The probable form requires no imaging at all.",
          "Severe truncal ataxia has an operational definition: the patient cannot maintain an upright sitting or standing position without support. In a 2016 study no patient with acute unilateral vestibulopathy showed it. BUT mild to moderate ataxia does NOT exclude a central lesion. A patient too symptomatic to walk is asked to sit upright on the trolley with arms crossed.",
          "The HINTS metrics come from a study of 101 patients (69 ischaemic strokes, 4 haemorrhages, 28 without stroke) in which a refined bedside protocol was performed by an expert clinician: sensitivity up to 100% (69/69; 95% CI 95-100%), specificity 96% (24/25; 95% CI 80-100%), LR+ 25 (95% CI 3.66-170.59), LR− 0.00 (95% CI 0.00-0.11); initial diffusion-weighted images were normal in 12% (8/69) of ischaemic strokes. Population: vertigo lasting more than 24 h AND one vascular risk factor.",
          "Of the three HINTS components the horizontal head impulse test had the highest pooled sensitivity of 0.85 (95% CI 0.79-0.91) and specificity of 0.95 (95% CI 0.90-1.00) for central causes. Because an abnormal head impulse test and skew deviation occur in both peripheral and central lesions, these tests are complementary.",
          "SAFETY NOTE: HINTS may not be sensitive enough in AICA infarction, because the head impulse test is mostly abnormal there — a patient may present with isolated vertigo and a NEGATIVE HINTS, mimicking acute unilateral vestibulopathy. About 5% of patients with AICA-territory stroke had acute prolonged vertigo and canal paresis without hearing loss; another study put HINTS at negative in 5 of the 17 patients (29.4%) examined with AICA infarction. When HINTS is negative, the paper advises adding horizontal head shaking, finger-rub hearing testing and examination of stance and gait.",
        ],
      },
      {
        postac: "potwierdzona (bez przymiotnika)",
        nazwaPl: "Przemijający naczyniowy zawrót / zawroty głowy ALBO ostry naczyniowy zawrót / zawroty głowy w ewolucji", nazwaEn: "Transient vascular vertigo/dizziness OR acute vascular vertigo/dizziness in evolution",
        wymagane: "wszystkie A-C",
        punkty: [
          { litera: "A", pl: "Ostry SAMOISTNY zawrót głowy, oszołomienie lub niestabilność trwające krócej niż 24 godziny.", en: "Vertigo, dizziness or unsteadiness of acute SPONTANEOUS onset, going on for less than 24 hours." },
          { litera: "B", pl: "Dowód obrazowy niedokrwienia lub krwotoku w mózgu albo w uchu wewnętrznym, odpowiadający objawom podmiotowym, przedmiotowym i wynikom badań.", en: "Imaging that shows ischaemia or haemorrhage in the brain or in the inner ear, and that matches the symptoms, the signs and the test findings." },
          { litera: "C", pl: "Obrazu nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "Kryterium A wprowadza tu słowo SAMOISTNY, którego nie ma w kryterium A postaci przedłużonej.",
          "Terminu „przemijający\" używa się, gdy chory zgłasza PRZEBYTY epizod krótszy niż 24 h; terminu „w ewolucji\" — gdy chory z ostrym zawrotem jest oceniany W CIĄGU 24 GODZIN od początku objawów.",
          "Przemijający zespół przedsionkowy często występuje w przemijającym niedokrwieniu kręgowo-podstawnym: izolowany napadowy zawrót był jedynym objawem u 21% (6/29) chorych z domniemanym rozpoznaniem, a 62% (29/42) chorych z zawrotem z tego powodu i 29% (12/42) chorych z zawałem kręgowo-podstawnym miało w wywiadzie izolowane napadowe zawroty. Epizod ma początek typowo samoistny i trwa minuty.",
          "Mimo szczegółowego badania neurootologicznego i neuroobrazowania (MRI z obrazami dyfuzyjnymi oraz obrazowanie perfuzyjne) etiologia pozostała nieznana u ponad połowy chorych z przemijającym zespołem przedsionkowym. Część przypadków może wynikać z szybkiego ustąpienia zaburzenia obwodowego — np. BPPV albo choroby Ménière'a podczas pierwszego napadu — inne z przemijającej hipoperfuzji pnia mózgu.",
          "Udar stwierdzono u 27% (23/86) chorych kierowanych na oddział ratunkowy z przemijającym zespołem przedsionkowym: zawał mózgu u 15% (13/86) i hipoperfuzja móżdżku u 12% (10/86).",
        ],
        przypisyEn: [
          "Criterion A introduces the word SPONTANEOUS, absent from criterion A of the prolonged form.",
          "\"Transient\" is used when the patient reports a PAST episode shorter than 24 h; \"in evolution\" when a patient with acute vertigo is assessed WITHIN 24 HOURS of onset.",
          "A transient vestibular syndrome occurs often in vertebrobasilar transient ischaemia: among patients carrying a presumptive diagnosis, episodic vertigo on its own was all that appeared in 21% (6/29), while a history of isolated episodic vertigo was present in 62% (29/42) of those whose vertigo came from this cause and in 29% (12/42) of those with vertebrobasilar infarction. Onset is typically spontaneous and the episode lasts minutes.",
          "Despite detailed neuro-otological examination and neuroimaging (MRI with diffusion-weighted and perfusion imaging), the aetiology remained unknown in more than half of patients with a transient vestibular syndrome. Some cases may reflect rapid resolution of a peripheral disorder — BPPV or Ménière's disease during its first attack — others transient brainstem hypoperfusion.",
          "Of patients referred with a transient vestibular syndrome to an emergency department, 27% (23/86) proved to have had a stroke. That group broke down into cerebral infarction, 15% (13/86), and cerebellar hypoperfusion, 12% (10/86).",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobny ostry naczyniowy zawrót / zawroty głowy W EWOLUCJI", nazwaEn: "Probable acute vascular vertigo/dizziness IN EVOLUTION",
        wymagane: "A ORAZ co najmniej jedno z B1-B6 ORAZ C",
        punkty: [
          { litera: "A", pl: "Ostry samoistny zawrót, oszołomienie lub niestabilność trwające PONAD 3 GODZINY, ale jeszcze nie trwające co najmniej 24 godzin w chwili badania.", en: "Acute spontaneous vertigo, dizziness or unsteadiness going on for MORE THAN 3 HOURS which, at the moment of assessment, has still not reached 24 hours." },
          { litera: "B1", pl: "Ogniskowe ośrodkowe objawy podmiotowe i przedmiotowe ALBO ciężka ataksja tułowia / niestabilność postawy.", en: "Focal neurological symptoms and signs of central type OR truncal ataxia / postural instability of severe degree." },
          { litera: "B2", pl: "Co najmniej jeden składnik ośrodkowego HINTS (prawidłowy test pchnięcia głową, oczopląs spojrzeniowy zmieniający kierunek, wyraźne odchylenie skośne).", en: "At least one HINTS component of the central pattern (head impulse tests normal, gaze-evoked nystagmus that switches direction, skew deviation that is pronounced)." },
          { litera: "B3", pl: "Inne ośrodkowe nieprawidłowości okoruchowe, np. oczopląs typu ośrodkowego, zaburzone sakady, zaburzone wodzenie płynne.", en: "Other ocular motor abnormalities of central type — for instance central nystagmus, saccades that are impaired, smooth pursuit that is impaired." },
          { litera: "B4", pl: "Nowo powstały umiarkowany do silnego ból czaszkowo-szyjny.", en: "Cranio-cervical pain of moderate to severe intensity, newly arisen." },
          { litera: "B5", pl: "Zwiększone ryzyko zdarzeń naczyniowych, np. ABCD2 ≥ 4 albo migotanie przedsionków.", en: "A raised risk of vascular events — for example ABCD2 ≥ 4, or atrial fibrillation." },
          { litera: "B6", pl: "Istotne (> 50%) zwężenie tętnicy układu kręgowo-podstawnego.", en: "Narrowing judged significant (> 50%) in an artery of the vertebrobasilar system." },
          { litera: "C", pl: "Obrazu nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "Próg dolny „ponad 3 godziny\" pojawia się w całej pracy TYLKO w tym jednym miejscu.",
          "Ból czaszkowo-szyjny: choć ból głowy jest objawem częstym, ból czaszkowo-szyjny umiarkowany do silnego jest bardzo rzadki w obwodowych zaburzeniach przedsionkowych. Nowo powstały ból tego rodzaju wraz z ostrymi objawami przedsionkowymi każe podejrzewać rozwarstwienie naczynia albo udar krążenia tylnego, w tym krwotoki — zwłaszcza gdy migrena lub migrena przedsionkowa jest mało prawdopodobna. W badaniu 86 chorych z przemijającym zespołem przedsionkowym towarzyszący ból czaszkowo-szyjny był wskazówką udaru z OR 15,2 (95% CI 2,5-93,8).",
          "Zwężenie tętnicy kręgowej: w badaniu przemijającego zespołu przedsionkowego 8 z 10 chorych z jednostronną hipoperfuzją móżdżku widoczną wyłącznie w obrazach perfuzyjnych, bez zawału w obrazach dyfuzyjnych, miało ogniskowe zwężenie albo hipoplazję odpowiadającej tętnicy kręgowej. Zwężenie lub hipoplazja tętnicy kręgowej były czynnikiem ryzyka udaru z OR 7,0 (95% CI 1,7-29,4).",
          "Odwrócenie przepływu w jednej tętnicy kręgowej często bywa bezobjawowe — z tego powodu zespół podkradania podobojczykowego NIE został włączony do tej klasyfikacji jako odrębna jednostka.",
          "Kryterium C: podłoże naczyniowe jest poważnym zmartwieniem przy NOWO POWSTAŁYM przemijającym zawrocie z naczyniowymi czynnikami ryzyka, ale u chorych, u których epizody występują od wielu miesięcy lub lat, bardziej prawdopodobne są migrena przedsionkowa albo choroba Ménière'a.",
        ],
        przypisyEn: [
          "The lower bound \"more than 3 hours\" appears in this one place only in the whole paper.",
          "Cranio-cervical pain: although headache is common, moderate to severe cranio-cervical pain is very rare in peripheral vestibular disorders. New-onset pain of this kind together with acute vestibular symptoms should raise suspicion of arterial dissection or posterior-circulation stroke including haemorrhage — particularly when migraine or vestibular migraine is unlikely. In a study of 86 patients with a transient vestibular syndrome, accompanying cranio-cervical pain indicated stroke with an OR of 15.2 (95% CI 2.5-93.8).",
          "Vertebral artery narrowing: in a study of transient vestibular syndrome, 8 of 10 patients with unilateral cerebellar hypoperfusion visible only on perfusion imaging, without infarction on diffusion-weighted images, had focal stenosis or hypoplasia of the corresponding vertebral artery. Stenosis or hypoplasia of the vertebral artery was a stroke risk factor with an OR of 7.0 (95% CI 1.7-29.4).",
          "Flow reversal in one vertebral artery is often asymptomatic — for this reason subclavian steal syndrome was NOT included in this classification as a separate entity.",
          "Criterion C: a vascular cause is a serious concern in NEW-ONSET transient vertigo with vascular risk factors, but in patients whose episodes have occurred for many months or years, vestibular migraine or Ménière's disease is more likely.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobny PRZEMIJAJĄCY naczyniowy zawrót / zawroty głowy", nazwaEn: "Probable TRANSIENT vascular vertigo/dizziness",
        wymagane: "A ORAZ co najmniej jedno z B1-B4 ORAZ C",
        punkty: [
          { litera: "A", pl: "Ostry samoistny zawrót, oszołomienie lub niestabilność trwające krócej niż 24 godziny.", en: "Acute spontaneous vertigo, dizziness or unsteadiness going on for less than 24 hours." },
          { litera: "B1", pl: "Ogniskowe ośrodkowe objawy neurologiczne ALBO ciężka niestabilność postawy W TRAKCIE NAPADU.", en: "Focal neurological symptoms of central type OR postural instability of severe degree, DURING THE ATTACK." },
          { litera: "B2", pl: "Nowo powstały umiarkowany do silnego ból czaszkowo-szyjny W TRAKCIE NAPADU.", en: "Cranio-cervical pain of moderate to severe intensity, newly arisen DURING THE ATTACK." },
          { litera: "B3", pl: "Zwiększone ryzyko zdarzeń naczyniowych, np. ABCD2 ≥ 4 albo migotanie przedsionków.", en: "A raised risk of vascular events — for example ABCD2 ≥ 4, or atrial fibrillation." },
          { litera: "B4", pl: "Istotne (> 50%) zwężenie tętnicy układu kręgowo-podstawnego.", en: "Narrowing judged significant (> 50%) in an artery of the vertebrobasilar system." },
          { litera: "C", pl: "Obrazu nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "RÓŻNICA ŁATWA DO PRZEOCZENIA: lista B ma tu CZTERY pozycje i NIE zawiera ani HINTS, ani innych nieprawidłowości okoruchowych — w postaci w ewolucji lista ma SZEŚĆ pozycji i oba te punkty zawiera. Praca nie podaje wprost uzasadnienia tej różnicy. Ponadto B1 mówi o „ciężkiej niestabilności postawy\" (bez słów „ataksja tułowia\") i dodaje warunek „w trakcie napadu\".",
          "Podstawa faktyczna, którą praca podaje osobno: przydatność diagnostyczna HINTS oraz HINTS plus i MRI była ograniczona w przemijającym zespole przedsionkowym, bo objawy podmiotowe lub przedmiotowe już ustąpiły do czasu badania u około 73% (63/86) chorych. Odsyłacz do tej noty stoi jednak przy postaci W EWOLUCJI, nie przy postaci przemijającej.",
        ],
        przypisyEn: [
          "AN EASILY MISSED DIFFERENCE: list B here has FOUR items and contains NEITHER HINTS NOR other ocular motor abnormalities — the in-evolution form has SIX items and includes both. The paper gives no explicit rationale for the difference. B1 here also speaks of \"severe postural instability\" (without the words \"truncal ataxia\") and adds the condition \"during the attack\".",
          "The factual basis the paper states separately: the diagnostic value of HINTS, HINTS plus and MRI was limited in the transient vestibular syndrome, because in about 73% (63/86) of patients the symptoms or signs had gone before the examination took place. The reference to that note, however, sits with the IN-EVOLUTION form, not with the transient one.",
        ],
      },
      {
        postac: "zespół ucisku tętnicy kręgowej (VACS)",
        nazwaPl: "Zespół ucisku tętnicy kręgowej (VACS)", nazwaEn: "Vertebral artery compression syndrome (VACS)",
        wymagane: "wszystkie A-D, przy czym C wymaga C1 ALBO C2",
        punkty: [
          { litera: "A", pl: "Zawrót głowy z szumem usznym lub bez, prowokowany UTRZYMYWANĄ EKSCENTRYCZNĄ POZYCJĄ SZYI, zwłaszcza przy wyprostowanej pozycji ciała.", en: "Vertigo, with or without tinnitus, brought on by holding the neck in a SUSTAINED ECCENTRIC POSITION, above all with the body upright." },
          { litera: "B", pl: "Obecność oczopląsu wraz z objawami podczas napadu.", en: "Nystagmus accompanying the symptoms while an attack is under way." },
          { litera: "C", pl: "Albo C1, albo C2 — PODCZAS PROWOKUJĄCEGO RUCHU GŁOWY: (C1) udokumentowanie ucisku tętnicy kręgowej przy użyciu angiografii dynamicznej; (C2) wykazanie zmniejszonego przepływu krwi w krążeniu tylnym przy użyciu przezczaszkowego Dopplera.", en: "Either C1 or C2 — DURING THE PROVOKING HEAD MOTION: (C1) dynamic angiography documenting that the vertebral artery is compressed; (C2) transcranial Doppler showing blood flow in the posterior circulation to be reduced." },
          { litera: "D", pl: "Obrazu nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "VACS jest w tej pracy JEDYNĄ jednostką bez postaci prawdopodobnej — jest tylko jeden zestaw kryteriów i wymaga on potwierdzenia instrumentalnego.",
          "Napadowy zawrót, oczopląs i omdlenie RZADKO występują wskutek mechanicznego ucisku tętnicy kręgowej wywołanego poziomym lub skośnym obrotem szyi, pochyleniem lub wyprostem. Przysłówek „rzadko\" odnosi się w oryginale do wszystkich trzech objawów, nie tylko do omdlenia. Szum uszny pojawia się kilka sekund PO początku zawrotu i oczopląsu, co sugeruje, że przedsionek jest bardziej wrażliwy na niedokrwienie niż ślimak.",
          "Oczopląs (analizy okulograficzne): początkowy jest przeważnie skierowany ku dołowi, ze składowymi poziomą i skrętną bijącymi ALBO w stronę uciśniętej tętnicy kręgowej — co wskazuje na przemijające pobudzenie błędnika — ALBO w stronę przeciwną. Chorzy mogą wykazywać samoistne odwrócenie kierunku oczopląsu albo wyraźnie osłabiony bądź nieobecny oczopląs przy powtarzaniu prowokującego obrotu szyi.",
          "Anatomia: chorzy z VACS zwykle mają jedną tętnicę kręgową hipoplastyczną lub zwężoną, albo kończącą się jako PICA, oraz przeciwstronną, dominującą tętnicę uciśniętą lub zamkniętą — najczęściej na poziomie połączenia szczytowo-obrotowego — gdy głowa jest odwrócona OD strony ucisku.",
        ],
        przypisyEn: [
          "VACS is the ONLY entity in this paper without a probable form — there is a single criteria set and it requires instrumental confirmation.",
          "Episodic vertigo, nystagmus and syncope arise RARELY from mechanical compression of the vertebral artery, brought about when the neck is rotated horizontally or diagonally, tilted or extended. In the original the adverb \"rarely\" governs all three features, not syncope alone. Tinnitus appears a few seconds AFTER vertigo and nystagmus have begun, which suggests the vestibule withstands ischaemia less well than the cochlea.",
          "Nystagmus (oculographic analyses): the initial nystagmus is mostly downbeating, with horizontal and torsional components beating EITHER toward the compressed vertebral artery — indicating transient excitation of the labyrinth — OR away from it. On repetition of the provocative neck rotation the nystagmus may reverse of its own accord, or become much weaker or vanish.",
          "Anatomy: patients with VACS usually have one hypoplastic or stenotic vertebral artery, or one terminating as PICA, while the dominant artery on the other side is compressed or occluded — most often where the atlas meets the axis — as the head turns AWAY from the side of compression.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "24 godziny lub dłużej", wielkoscPl: "czas trwania — postać ostra przedłużona", wielkoscEn: "duration — acute prolonged form", kontekstPl: "kryterium A postaci potwierdzonej i prawdopodobnej", kontekstEn: "criterion A of both the confirmed and the probable form" },
      { ranga: "nota", wartosc: "12-50% w pierwszych 48 godzinach", wielkoscPl: "fałszywie ujemne wyjściowe MRI z obrazami dyfuzyjnymi", wielkoscEn: "false-negative initial MRI with diffusion-weighted imaging", kontekstPl: "nota 2 do kryteriów ostrych przedłużonych", kontekstEn: "note 2 to the acute prolonged criteria" },
      { ranga: "kryterium", wartosc: "co najmniej jeden (z trzech)", wielkoscPl: "liczba składników ośrodkowego HINTS", wielkoscEn: "number of central HINTS components", kontekstPl: "B2 postaci prawdopodobnej przedłużonej i postaci w ewolucji; w postaci przemijającej HINTS w liście B NIE WYSTĘPUJE", kontekstEn: "B2 of the probable prolonged and the in-evolution form; HINTS does NOT appear in list B of the transient form" },
      { ranga: "nota", wartosc: "5 z 17 chorych (29,4%)", wielkoscPl: "ujemny HINTS w zawale AICA", wielkoscEn: "negative HINTS in AICA infarction", kontekstPl: "nota 5 — nota bezpieczeństwa", kontekstEn: "note 5 — safety note" },
      { ranga: "kryterium", wartosc: "4 lub więcej", wielkoscPl: "punktacja ABCD2 jako przykład zwiększonego ryzyka", wielkoscEn: "ABCD2 score as an example of increased risk", kontekstPl: "B4 postaci prawdopodobnej przedłużonej, B5 postaci w ewolucji, B3 postaci przemijającej", kontekstEn: "B4 of the probable prolonged form, B5 in evolution, B3 transient" },
      { ranga: "kryterium", wartosc: "krócej niż 24 godziny", wielkoscPl: "czas trwania — postać przemijająca", wielkoscEn: "duration — transient form", kontekstPl: "kryterium A postaci potwierdzonej i prawdopodobnej przemijającej", kontekstEn: "criterion A of the confirmed and the probable transient form" },
      { ranga: "kryterium", wartosc: "> 3 godziny, ale jeszcze nie ≥ 24 godzin w chwili badania", wielkoscPl: "czas trwania — postać w ewolucji", wielkoscEn: "duration — form in evolution", kontekstPl: "kryterium A postaci prawdopodobnej w ewolucji — jedyne miejsce w pracy z progiem 3 h", kontekstEn: "criterion A of the probable in-evolution form — the only place in the paper with a 3 h bound" },
      { ranga: "kryterium", wartosc: "> 50%", wielkoscPl: "zwężenie tętnicy układu kręgowo-podstawnego", wielkoscEn: "narrowing of a vertebrobasilar artery", kontekstPl: "B6 postaci w ewolucji, B4 postaci przemijającej", kontekstEn: "B6 in evolution, B4 transient" },
    ],
    granicePl: [
      "NAJWAŻNIEJSZA GRANICA: mimo że abstrakt zapowiada objęcie klasyfikacją izolowanego zawału i krwotoku błędnika, w tekście NIE MA dla nich zestawu kryteriów. Nagłówek „Criteria A\" występuje dokładnie sześć razy i wszystkie sześć zestawów wyliczono w tym wpisie. Reguła 30 dni pochodzi wyłącznie z abstraktu — cytowanie „kryteriów izolowanego zawału błędnika wg tej pracy, punkt A/B/C\" byłoby zmyśleniem.",
      "LISTY CZERWONYCH CECH NIE SĄ WSPÓLNE DLA WSZYSTKICH OSI CZASU. Postać prawdopodobna przedłużona ma cztery pozycje w liście B, postać w ewolucji sześć, postać przemijająca cztery — ale INNE cztery, bez HINTS i bez innych nieprawidłowości okoruchowych. Zbudowanie jednej wspólnej listy dla wszystkich osi czasu zafałszowałoby tę pracę.",
      "VACS NIE MA POSTACI PRAWDOPODOBNEJ i jest jedynym kryterium w pracy nazywającym konkretne narzędzie sprzętowe (angiografia dynamiczna albo przezczaszkowy Doppler). Kryterium D odsyła do noty 4, ale w tekście pod kryteriami VACS znajdują się tylko noty 1, 2 i 3 — treści noty 4 nie ma. Praca nie podaje też żadnej liczby częstości VACS.",
      "BRAK JAKIEGOKOLWIEK PROGU LICZBOWEGO DLA BADAŃ FUNKCJI PRZEDSIONKOWEJ: nie ma wartości odcięcia gain VOR (słowo pojawia się dwa razy, oba razy jakościowo), nie ma progów audiometrycznych ani częstotliwościowych, nie ma progu asymetrii kalorycznej ani amplitudy VEMP. Jedyne progi pomiarowe to odchylenie skośne > 3,3°, oczopląs po potrząsaniu > 50°/s, zwężenie > 50%, zmiana ≤ 10 mm i oczopląs pozycyjny napadowy < 1 min.",
      "PRACA DEPRECJONUJE CZĘŚĆ BADAŃ: próby kaloryczne są przeważnie prawidłowe i mają ograniczoną wartość w zaburzeniach ośrodkowych; nieprawidłowości VEMP nie pomagają w różnicowaniu ośrodkowe-obwodowe; subiektywna pionowa wzrokowa jest bardzo czuła (94%, n = 111 w ostrym jednostronnym zawale pnia), ale NIE różnicuje zmiany ośrodkowej od obwodowej — podobnie skręcenie gałek (83%). Tomografię zaleca wyłącznie do wykrycia krwotoku lub innych patologii.",
      "UDOKUMENTOWANIE IZOLOWANEGO ZAWAŁU BŁĘDNIKA jest wg pracy „niemal niemożliwe\" bez badania patologicznego — dotyczy to także zawału pojedynczej składowej błędnika i zawału nerwu przedsionkowo-ślimakowego. Nie ma testu potwierdzającego.",
    ],
    graniceEn: [
      "THE MOST IMPORTANT BOUNDARY: although the abstract announces that the classification covers isolated labyrinthine infarction and haemorrhage, the body of the paper contains NO criteria set for them. The heading \"Criteria A\" occurs exactly six times and all six sets are listed in this entry. The 30-day rule comes from the abstract alone — quoting \"criteria for isolated labyrinthine infarction, point A/B/C\" from this paper would be fabrication.",
      "THE LISTS OF ALARM FEATURES ARE NOT SHARED ACROSS TIME AXES. The probable prolonged form has four items in list B, the in-evolution form six, the transient form four — but DIFFERENT four, without HINTS and without other ocular motor abnormalities. Building one common list for all time axes would misrepresent this paper.",
      "VACS HAS NO PROBABLE FORM and is the only criterion in the paper naming a specific piece of equipment (dynamic angiography or transcranial Doppler). Criterion D refers to note 4, yet only notes 1, 2 and 3 appear beneath the VACS criteria — note 4's content is absent. The paper also gives no frequency figure for VACS.",
      "THERE IS NO NUMERIC THRESHOLD OF ANY KIND FOR VESTIBULAR FUNCTION TESTING: no VOR gain cutoff (the word appears twice, both times qualitatively), no audiometric or frequency thresholds, no caloric asymmetry threshold and no VEMP amplitude threshold. The only measurement thresholds are skew deviation > 3.3°, head-shaking nystagmus > 50°/s, narrowing > 50%, lesion ≤ 10 mm and paroxysmal positional nystagmus < 1 min.",
      "THE PAPER DOWNGRADES SEVERAL TESTS: caloric testing is mostly normal and of limited value in central disorders; VEMP abnormalities do not help separate central from peripheral; the subjective visual vertical is highly sensitive (94%, n = 111 in acute unilateral brainstem infarction) but does NOT distinguish central from peripheral lesions — nor does ocular torsion (83%). CT is recommended solely to detect haemorrhage or other pathology.",
      "DOCUMENTING ISOLATED LABYRINTHINE INFARCTION is, in the paper's words, nearly impossible without pathological examination — which also applies to infarction of a single labyrinthine component and to infarction of the vestibulocochlear nerve. There is no confirmatory test.",
    ],
  },
  {
    klucz: "migrenaPrzedsionkowa",
    zrodlo: "[H46] Lempert 2022",
    typ: "jednostka",
    nazwaPl: "Migrena przedsionkowa",
    nazwaEn: "Vestibular migraine",
    zespol: "EVS",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "grep -rniE 'migren' src/ = 34 trafienia w 6 plikach; grep -rniE 'vmCriteriaCard|vmInterictal|hintsVmCrit' src/ = 13 trafień (pomiar kontrolny 2026-08-22; poprzednie wartości 32/5 i 11 pochodziły sprzed dopisania src/app/atlas-model.js). Kryteria niesie karta w src/render/svg-screens.js, funkcja vmCriteriaCard w wierszach 3547–3594. Preset src/engine/neuro-vor.js:991 'vmInterictal' ma params:{} — pusty; komentarz w kodzie brzmi „Zamyka lukę s-EVS bez nowej fizyki”. src/app/triage-model.js:382 mówi wprost: „Silnik OTOREPO żadnej z tych jednostek nie modeluje”. Zero obliczeń jednostkowych.",
    streszczeniePl: "Migrena przedsionkowa to nawracające epizody objawów przedsionkowych o nasileniu umiarkowanym albo ciężkim, powiązane czasowo z migreną: rozpoznanie opiera się na wywiadzie migrenowym, na cechach migrenowych towarzyszących epizodom przedsionkowym i na wykluczeniu innych przyczyn. Dokument jest wspólną pracą Towarzystwa Bárány'ego i International Headache Society i stanowi AKTUALIZACJĘ PIŚMIENNICTWA do wersji z 2012 roku — same kryteria pozostawiono BEZ ZMIAN, nowości dopisano w komentarzach. Klasyfikacja definiuje dwie kategorie: migrenę przedsionkową i prawdopodobną migrenę przedsionkową. Migrena przedsionkowa figuruje w ANEKSIE ICHD-3; postaci prawdopodobnej w ICHD nie ma.",
    streszczenieEn: "Vestibular migraine consists of recurrent episodes of vestibular symptoms of moderate or severe intensity, temporally associated with migraine: the diagnosis rests on a migraine history, on migraine features accompanying the vestibular episodes, and on exclusion of other causes. The Bárány Society drew the document up together with the International Headache Society, and it is a LITERATURE UPDATE to the 2012 version — the criteria themselves were left UNCHANGED, and what is new sits in the comments. Two categories are defined: vestibular migraine and probable vestibular migraine. Vestibular migraine appears in the APPENDIX of ICHD-3; the probable form is not in the ICHD at all.",
    synonimy: [
      { pl: "zawroty/oszołomienie związane z migreną (migraine-associated vertigo/dizziness)", en: "migraine-associated vertigo / dizziness" },
      { pl: "westibulopatia związana z migreną (migraine-related vestibulopathy)", en: "migraine-related vestibulopathy" },
      { pl: "zawrót migrenowy (migrainous vertigo)", en: "migrainous vertigo" },
      { pl: "„pewna migrena przedsionkowa\"", en: "\"definite vestibular migraine\"", odradzany: true, uwagaPl: "To NIE jest termin tej pracy: ciąg „definite\" ma w niej 0 trafień. Jednostka nazywa się po prostu „migrena przedsionkowa\", w opozycji do „prawdopodobnej\". Etykieta „pewna\" jest naszą redakcją i tak powinna być oznaczona w interfejsie.", uwagaEn: "This is NOT the paper's term: the string \"definite\" has 0 hits in it. The entity is simply \"vestibular migraine\", opposed to \"probable\". The label \"definite\" is our editorial addition and should be marked as such in the interface." },
    ],
    kryteria: [
      {
        postac: "pewna",
        nazwaPl: "Migrena przedsionkowa (w pracy: bez kwalifikatora „pewna\")", nazwaEn: "Vestibular migraine (in the paper: without the qualifier \"definite\")",
        wymagane: "A, B, C i D łącznie — cztery punkty (źródło nie drukuje formuły „all of the following\"; koniunkcja wynika z formatu listy)",
        punkty: [
          { litera: "A", pl: "Co najmniej 5 epizodów z objawami przedsionkowymi o nasileniu umiarkowanym ALBO ciężkim, trwających od 5 minut do 72 godzin.", en: "At least 5 episodes with vestibular symptoms of moderate OR severe intensity, lasting 5 minutes to 72 hours." },
          { litera: "B", pl: "Migrena z aurą albo bez aury według ICHD-3 — obecnie ALBO w przeszłości.", en: "Migraine with or without aura according to ICHD-3 — current OR previous history." },
          { litera: "C", pl: "Jedna ALBO więcej cech migrenowych podczas co najmniej 50% epizodów przedsionkowych, spośród trzech pozycji listy: (i) ból głowy mający co najmniej DWIE z czterech cech — lokalizacja jednostronna, charakter pulsujący, nasilenie umiarkowane albo ciężkie, nasilanie się przy rutynowej aktywności fizycznej; (ii) światłowstręt ORAZ fonofobia (w źródle to JEDNA pozycja listy — oba objawy razem stanowią jedną kwalifikującą cechę); (iii) aura wzrokowa.", en: "One OR more migraine features during at least 50% of the vestibular episodes, drawn from a list of three items: (i) headache carrying at least TWO of four characteristics — one-sided; pulsating; pain of moderate or severe intensity; worsened by routine physical activity; (ii) photophobia AND phonophobia (a SINGLE list item in the source — the pair together makes one qualifying feature); (iii) visual aura." },
          { litera: "D", pl: "Obraz nie jest lepiej wyjaśniony przez inne rozpoznanie przedsionkowe albo rozpoznanie z ICHD.", en: "Not better accounted for by another vestibular or ICHD diagnosis." },
        ],
        przypisyPl: [
          "Jakie objawy przedsionkowe kwalifikują (wg Klasyfikacji Objawów Przedsionkowych Bárány Society): zawrót samoistny — wewnętrzny (fałszywe wrażenie ruchu własnego) i zewnętrzny (fałszywe wrażenie, że otoczenie wzrokowe wiruje albo płynie); zawrót pozycyjny; zawrót wywołany bodźcem wzrokowym; zawrót wywołany ruchem głowy (występujący PODCZAS ruchu); oraz dizziness wywołana ruchem głowy Z NUDNOŚCIAMI. Granica podana wprost: inne postacie dizziness nie są obecnie włączone — zawroty niezawrotowe kwalifikują TYLKO w tej jednej konfiguracji (ruch głowy + nudności).",
          "Skala nasilenia ma dwa stopnie, definiowane czynnościowo: UMIARKOWANE — objawy zakłócają codzienne czynności, ale ich nie uniemożliwiają; CIĘŻKIE — codziennych czynności nie da się kontynuować. Nie ma stopnia łagodnego jako kwalifikującego ani żadnej skali punktowej.",
          "Rozkład czasu trwania epizodów: około 30% chorych ma epizody trwające MINUTY, 30% — GODZINY, kolejne 30% — KILKA DNI, a pozostałe 10% ma napady trwające TYLKO SEKUNDY, powtarzające się przy ruchu głowy, stymulacji wzrokowej albo po zmianach pozycji głowy. Reguła zliczania dla tej ostatniej grupy: czas trwania epizodu definiuje się jako ŁĄCZNY OKRES, w którym nawracają krótkie napady — to mechanizm, który pozwala napadom sekundowym sięgnąć okna otwierającego się na 5 minutach. Na drugim krańcu: pełne dojście do siebie może zająć CZTERY TYGODNIE, ale rdzeń epizodu rzadko przekracza 72 godziny.",
          "Kryterium B odsyła do kategorii ICHD-3 o numerach 1.1 i 1.2 — praca podaje same numery, bez ich nazw.",
          "Jak liczyć cechy migrenowe: jeden objaw wystarcza w obrębie pojedynczego epizodu; różne objawy mogą wystąpić w różnych epizodach; objawy towarzyszące mogą wystąpić PRZED, W TRAKCIE albo PO objawach przedsionkowych.",
        ],
        przypisyEn: [
          "Which vestibular symptoms qualify (per the Bárány Society Classification of Vestibular Symptoms): spontaneous vertigo — internal (self-motion falsely sensed) and external (the visual surround falsely sensed as spinning or flowing); positional vertigo; visually induced vertigo; head motion-induced vertigo (occurring DURING head motion); and head motion-induced dizziness WITH NAUSEA. An explicit boundary: other forms of dizziness are not currently included — non-vertiginous dizziness qualifies ONLY in this one configuration (head motion + nausea).",
          "The intensity scale has two grades, defined functionally: MODERATE — symptoms interfere with but do not prohibit daily activities; SEVERE — daily activities cannot be continued. There is no qualifying mild grade and no point scale.",
          "Distribution of episode duration: episodes last MINUTES in about 30% of patients, HOURS in 30%, and SEVERAL DAYS in a further 30%; the last 10% get attacks of SECONDS only, brought on repeatedly by head motion, by visual stimulation, or once head position has changed. Counting rule for this last group: episode duration is taken as the TOTAL PERIOD over which the short attacks recur — the mechanism that lets seconds-long attacks reach the window that opens at 5 minutes. At the other end: full recovery may take FOUR WEEKS, but the core episode rarely exceeds 72 hours.",
          "Criterion B refers to ICHD-3 categories 1.1 and 1.2 — the paper gives the numbers only, not their names.",
          "How to count migraine features: one symptom suffices within a single episode; different symptoms may occur in different episodes; and an accompanying symptom may set in BEFORE the vestibular symptoms, DURING them, or AFTER them.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobna migrena przedsionkowa", nazwaEn: "Probable vestibular migraine",
        wymagane: "A, B i C łącznie — TRZY punkty; punkt B ma tu zupełnie inną treść niż punkt B postaci pewnej",
        punkty: [
          { litera: "A", pl: "Co najmniej 5 epizodów z objawami przedsionkowymi o nasileniu umiarkowanym albo ciężkim, trwających od 5 minut do 72 godzin. (Identyczne z kryterium A postaci pewnej.)", en: "At least 5 episodes with vestibular symptoms of moderate or severe intensity, lasting 5 minutes to 72 hours. (Identical to criterion A of the definite form.)" },
          { litera: "B", pl: "Spełnione jest TYLKO JEDNO z kryteriów B i C migreny przedsionkowej — albo wywiad migrenowy, albo cechy migrenowe podczas epizodu; dokładnie jedno z dwóch, nie oba.", en: "ONLY ONE of criteria B and C for vestibular migraine is fulfilled — either the migraine history or the migraine features during the episode; exactly one of the two, not both." },
          { litera: "C", pl: "Obraz nie jest lepiej wyjaśniony przez inne rozpoznanie przedsionkowe albo rozpoznanie z ICHD. (Odpowiada punktowi D postaci pewnej i odsyła do tej samej noty.)", en: "Not better accounted for by another vestibular or ICHD diagnosis. (Corresponds to criterion D of the definite form and refers to the same note.)" },
        ],
        przypisyPl: [
          "Postać prawdopodobna NIE jest w ICHD. Praca zaznacza, że może zostać włączona do późniejszej wersji ICHD, gdy zbierze się więcej danych; ICHD-3 zawiera w aneksie WYŁĄCZNIE migrenę przedsionkową (do celów badawczych), a klasyfikacja Bárány'ego zawiera DODATKOWO kategorię prawdopodobną.",
          "Punkt A jest w obu postaciach identyczny co do cyfry: ≥ 5 epizodów, 5 minut – 72 godziny, nasilenie umiarkowane albo ciężkie.",
        ],
        przypisyEn: [
          "The probable form is NOT in the ICHD. The paper notes it may be included in a later ICHD version once further evidence accumulates; in ICHD-3 the appendix carries ONLY vestibular migraine, and there for research purposes, whereas the probable category is an ADDITION belonging to the Bárány classification.",
          "Criterion A is identical in both forms down to the figures: ≥ 5 episodes, 5 minutes – 72 hours, moderate or severe intensity.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "co najmniej 5", wielkoscPl: "minimalna liczba epizodów", wielkoscEn: "minimum number of episodes", kontekstPl: "kryterium A OBU postaci — pewnej i prawdopodobnej", kontekstEn: "criterion A of BOTH forms — definite and probable" },
      { ranga: "kryterium", wartosc: "5 minut – 72 godziny", wielkoscPl: "czas trwania epizodu", wielkoscEn: "episode duration", kontekstPl: "kryterium A obu postaci; okno zawężone w stosunku do wcześniejszych propozycji w wyniku uzgodnień z IHS", kontekstEn: "criterion A of both forms; the window was narrowed relative to earlier proposals as a result of the agreement with the IHS" },
      { ranga: "nota", wartosc: "ok. 30% minuty / 30% godziny / 30% kilka dni / 10% tylko sekundy", wielkoscPl: "rozkład czasu trwania napadów", wielkoscEn: "distribution of attack duration", kontekstPl: "nota do kryterium A; dla grupy 10% czas epizodu liczy się jako łączny okres nawracania krótkich napadów", kontekstEn: "note to criterion A; for the 10% group, episode duration is counted as the total period over which the short attacks recur" },
      { ranga: "nota", wartosc: "cztery tygodnie", wielkoscPl: "maksymalny czas pełnego powrotu do zdrowia po epizodzie", wielkoscEn: "maximum time to full recovery after an episode", kontekstPl: "nota do kryterium A — u części chorych; rdzeń epizodu rzadko przekracza 72 godziny", kontekstEn: "note to criterion A — in some patients; the core episode rarely exceeds 72 hours" },
      { ranga: "kryterium", wartosc: "co najmniej 50%", wielkoscPl: "odsetek epizodów przedsionkowych z cechą migrenową", wielkoscEn: "proportion of vestibular episodes carrying a migraine feature", kontekstPl: "kryterium C postaci pewnej", kontekstEn: "criterion C of the definite form" },
      { ranga: "kryterium", wartosc: "co najmniej 2 z 4", wielkoscPl: "liczba cech bólu głowy wymagana wewnątrz kryterium C", wielkoscEn: "number of headache characteristics required inside criterion C", kontekstPl: "pozycja (i) listy w kryterium C postaci pewnej: jednostronny / pulsujący / umiarkowany lub ciężki / nasilany rutynową aktywnością fizyczną", kontekstEn: "item (i) of the list in criterion C of the definite form: one-sided / pulsating / moderate or severe / aggravated by routine physical activity" },
      { ranga: "nota", wartosc: "krócej niż 60 minut", wielkoscPl: "czas trwania aury wzrokowej", wielkoscEn: "duration of visual aura", kontekstPl: "nota o aurze wzrokowej w kryterium C", kontekstEn: "note on visual aura within criterion C" },
      { ranga: "kryterium", wartosc: "dokładnie jedno z dwóch", wielkoscPl: "liczba kryteriów B i C spełnionych w postaci prawdopodobnej", wielkoscEn: "number of criteria B and C fulfilled in the probable form", kontekstPl: "kryterium B postaci prawdopodobnej", kontekstEn: "criterion B of the probable form" },
    ],
    granicePl: [
      "Rozpoznanie jest w całości KLINICZNE. Praca nie wymaga ANI JEDNEGO badania instrumentalnego: vHIT = 0 trafień, VEMP = 0, HINTS = 0, gain = 0, dB = 0, Hz = 0, Dix-Hallpike = 0, obrazowanie = 0. Napisano wprost, że — tak jak w samej migrenie — NIE MA markerów biologicznych migreny przedsionkowej. Zastrzeżenie pomiarowe: ciąg „imaging” ma 0 trafień, ale „MRI” pada RAZ — wyłącznie opisowo, o wodniaku endolimfatycznym u części chorych — a w różnicowaniu z TIA praca wymienia angiografię i ultrasonografię dopplerowską. Żadne z nich nie jest wymogiem kryteriów.",
      "Praca NIE mówi, że badanie międzynapadowe jest prawidłowe — mówi coś przeciwnego w duchu: wyniki BYWAJĄ patologiczne, szczególnie w trakcie epizodu albo krótko po nim, ale są trudno dostępne, a wyniki międzynapadowe nie są dostatecznie swoiste, by służyć jako kryterium. Przypisanie tej pracy zdania „w migrenie przedsionkowej badanie międzynapadowe jest prawidłowe\" jest błędem atrybucji.",
      "Reguła instrumentalna, którą praca NAPRAWDĘ daje, działa wyłącznie ku WYKLUCZENIU: nasilone nieprawidłowości w okresie bezobjawowym — ciężki niedosłuch oraz całkowita jedno- lub obustronna utrata funkcji przedsionkowej — zwykle wskazują na INNĄ przyczynę.",
      "Praca NIE jest wytyczną leczenia i NIE zaleca żadnego leku: „treatment\" = 0, „therapy\" = 0, „prophyla*\" = 0. Wszystkie wzmianki farmakologiczne służą argumentacji diagnostycznej. Wniosek wprost: pozytywna odpowiedź na lek NIE jest uznawana za wiarygodne kryterium rozpoznania migreny przedsionkowej, bo dowody opierają się głównie na badaniach obserwacyjnych, nie randomizowanych.",
      "Czynniki prowokujące (miesiączka, stres, niedobór snu, odwodnienie, pewne pokarmy) NIE są włączone do kryteriów — powód podany wprost: ich czułość i swoistość nie zostały odpowiednio zbadane. Mogą być wskazówką, nie kryterium.",
      "REGUŁA PIERWSZEŃSTWA — gdzie naprawdę stoi: to TA praca (nie [H20] Lopez-Escamez 2015) formułuje zdanie, że gdy spełnione są kryteria choroby Ménière'a, szczególnie przy udokumentowanym audiometrycznie jednostronnym niedosłuchu, rozpoznaje się chorobę Ménière'a NAWET jeśli objawy migrenowe występują podczas napadów przedsionkowych; oraz że OBA rozpoznania stawia się TYLKO u chorych mających DWA RÓŻNE TYPY napadów. W pracy Lopez-Escameza tych zdań nie ma (ciągi „two different types\", „even if\", „takes precedence\" = 0 / 0 / 0).",
    ],
    graniceEn: [
      "The diagnosis is entirely CLINICAL. The paper requires NOT ONE instrumental test: vHIT = 0 hits, VEMP = 0, HINTS = 0, gain = 0, dB = 0, Hz = 0, Dix-Hallpike = 0, imaging = 0. It states explicitly that vestibular migraine, like migraine itself, has NO biological markers. Measurement caveat: the string \"imaging\" scores 0, yet \"MRI\" occurs ONCE — purely descriptively, on endolymphatic hydrops seen in occasional patients — and the TIA differential names angiography and Doppler ultrasound. None of these is a requirement of the criteria.",
      "The paper does NOT say that the interictal examination is normal — its message runs the other way: during an episode, or shortly after one, findings CAN be pathological; the trouble is that such acute findings are hard to obtain, and what interictal results lack is specificity, so they cannot serve as a criterion. Attributing to this paper the sentence \"in vestibular migraine the interictal examination is normal\" is an attribution error.",
      "The instrumental rule the paper DOES supply works only toward EXCLUSION: profound abnormalities in the symptom-free interval — severe hearing loss and complete unilateral or bilateral loss of vestibular function — usually point to ANOTHER cause.",
      "The paper is NOT a treatment guideline and recommends NO drug: \"treatment\" = 0, \"therapy\" = 0, \"prophyla*\" = 0. Every pharmacological mention serves a diagnostic argument. Its explicit conclusion: a positive response to medication is NOT accepted as a reliable diagnostic criterion for vestibular migraine, since the evidence rests mainly on observational rather than randomised studies.",
      "Provoking factors (menstruation, stress, sleep deprivation, dehydration, certain foods) are NOT included in the criteria — the stated reason is that their sensitivity and specificity have not been adequately studied. They may be a clue, not a criterion.",
      "THE PRECEDENCE RULE — where it actually lives: it is THIS paper (not [H20] Lopez-Escamez 2015) that makes Menière’s disease the diagnosis to record once its criteria are satisfied — audiometrically documented one-sided hearing loss above all — and does so regardless of migraine symptoms turning up inside the vestibular attacks; and it is THIS paper that reserves the pair of diagnoses for patients whose attacks come in TWO DISTINCT TYPES, one type answering to each criteria set. Neither statement is in the Lopez-Escamez paper (\"two different types\", \"even if\", \"takes precedence\" = 0 / 0 / 0).",
    ],
  },
  {
    klucz: "meniere",
    zrodlo: "[H20] Lopez-Escamez 2015",
    typ: "jednostka",
    nazwaPl: "Choroba Ménière'a",
    nazwaEn: "Menière's disease",
    zespol: "EVS",
    wSilniku: "modelowana",
    wSilnikuDowod: "grep -rniE 'meniere|ménière|hydrops' src/ = 44 trafienia w 6 plikach (pomiar kontrolny 2026-08-22; poprzednia wartość 42/3 nie zgadzała się ani co do trafień, ani co do liczby plików); grep -rn 'meniere(' src/ = 4 trafienia. Silnik ma funkcję NeuroVOR.meniere(ear, {phase}) z tablicą MENIERE_PHASE (src/engine/neuro-vor.js:151–156; sama funkcja od wiersza 157) i liczy z niej obraz: kierunek oczopląsu w fazie drażnienia vs porażenia, ubytek kaloryczny niskoczęstotliwościowy oraz DYSOCJACJĘ kaloryka↔vHIT (src/engine/neuro-vor.js:965, 1357). Presety meniereP/meniereL w src/app/actions.js:93–94, losowanie fazy w wierszu 190.",
    streszczeniePl: "Choroba Ménière'a to nawracające epizody zawrotu trwające od 20 minut do 12 godzin, którym towarzyszy udokumentowany audiometrycznie niedosłuch odbiorczy w zakresie niskich i średnich częstotliwości w jednym uchu oraz fluktuujące objawy uszne po tej samej stronie. Kryteria mają dokładnie dwie kategorie — pewną i prawdopodobną — i nie znają ani stopnia „możliwa\", ani „potwierdzona\" (te pochodzą ze skali AAO-HNS z 1995 roku, przedrukowanej w aneksie). Dokument powstał wspólnie przez pięć towarzystw i podkreśla, że nie zidentyfikowano dotąd żadnego markera biologicznego rozpoznania ani rokowania. Jedynym badaniem wymaganym przez kryteria jest audiometria tonalna z przewodnictwem kostnym; postać prawdopodobna nie wymaga żadnego badania.",
    streszczenieEn: "Menière's disease consists of recurrent vertigo episodes lasting 20 minutes to 12 hours, accompanied by audiometrically documented low- to medium-frequency sensorineural hearing loss in one ear and by fluctuating aural symptoms on the same side. The criteria have exactly two categories — definite and probable — and know neither a \"possible\" nor a \"certain\" grade (those come from the 1995 AAO-HNS scale reprinted in the appendix). The document was produced jointly by five societies and stresses that no biological marker of diagnosis or prognosis has been identified. The only investigation the criteria require is pure-tone audiometry with bone conduction; the probable form requires no investigation at all.",
    synonimy: [
      { pl: "zespół Ménière'a (Menière's syndrome)", en: "Menière's syndrome" },
      { pl: "wodniak endolimfatyczny (endolymphatic hydrops, EH)", en: "endolymphatic hydrops (EH)", odradzany: true, uwagaPl: "Termin wcześniej używany jako nazwa jednostki, ale wodniak endolimfatyczny jest znaleziskiem PATOLOGICZNYM, nie rozpoznaniem klinicznym. Praca stwierdza wprost, że sam wodniak nie tłumaczy wszystkich cech klinicznych — ani postępu niedosłuchu, ani częstości napadów zawrotu — i że MRI 3 T z gadolinem uwidacznia wodniak w 93% uszu objawowych, ale też w 65% bezobjawowych uszu przeciwnych.", uwagaEn: "Previously used as a name for the entity, but endolymphatic hydrops is a PATHOLOGICAL finding, not a clinical diagnosis. The paper states outright that hydrops alone does not explain all clinical features — neither the progression of hearing loss nor the frequency of vertigo attacks — and that 3 T MRI with gadolinium shows hydrops in 93% of symptomatic ears but also in 65% of asymptomatic contralateral ears." },
      { pl: "opóźniony wodniak (delayed hydrops)", en: "delayed hydrops", odradzany: true, uwagaPl: "Nazwa wariantu, w którym niedosłuch odbiorczy wyprzedza początek epizodów zawrotu o kilka miesięcy albo lat. Praca mówi wprost, że PREFEROWANYM terminem powinna być „opóźniona choroba Ménière'a\" (delayed MD), ponieważ wodniak endolimfatyczny jest znaleziskiem patologicznym.", uwagaEn: "The name of the variant in which sensorineural hearing loss runs ahead of the first vertigo episodes by months or by years. The paper states explicitly that the PREFERRED term should be \"delayed MD\", since endolymphatic hydrops is a pathological finding." },
    ],
    kryteria: [
      {
        postac: "pewna",
        nazwaPl: "Choroba Ménière'a — postać pewna", nazwaEn: "Definite Menière's disease",
        wymagane: "A, B, C i D łącznie — cztery punkty, bez wariantów i bez stopniowania (źródło nie drukuje formuły „all of the following\"; koniunkcja wynika z formatu listy)",
        punkty: [
          { litera: "A", pl: "Dwa lub więcej SAMOISTNYCH epizodów zawrotu, każdy trwający od 20 minut do 12 godzin.", en: "Vertigo episodes arising SPONTANEOUSLY, two or more of them, each running 20 minutes to 12 hours." },
          { litera: "B", pl: "Udokumentowany audiometrycznie niedosłuch odbiorczy w zakresie od niskich do średnich częstotliwości w JEDNYM uchu, wyznaczający ucho chore, stwierdzony przy co najmniej jednej okazji PRZED, W TRAKCIE albo PO jednym z epizodów zawrotu.", en: "Sensorineural hearing loss across the low to medium frequencies, documented by audiometry in ONE ear — which is what marks that ear as the affected one — recorded on at least one occasion, whether BEFORE, DURING or AFTER one of the vertigo episodes." },
          { litera: "C", pl: "Fluktuujące objawy uszne — słuch, szum uszny LUB uczucie pełności — w uchu chorym. (Wystarczy jeden z trzech, ale musi fluktuować i być po stronie chorej.)", en: "Aural symptoms that FLUCTUATE — hearing, tinnitus OR fullness — in the affected ear. (Any one of the three will do, but it must fluctuate and must be on the affected side.)" },
          { litera: "D", pl: "Obraz nie jest lepiej wyjaśniony przez inne rozpoznanie przedsionkowe.", en: "Not better accounted for by another vestibular diagnosis." },
        ],
        przypisyPl: [
          "Zawrót to poczucie ruchu własnego, gdy ruch własny nie zachodzi, albo poczucie zniekształconego ruchu własnego podczas skądinąd prawidłowego ruchu głowy (definicja przejęta z klasyfikacji objawów przedsionkowych). NAPADOWA DIZZINESS I NIESTABILNOŚĆ NIE SĄ kryteriami rozpoznania — mimo że chorzy mogą je zgłaszać w perspektywie długoterminowej.",
          "Większość chorych zgłasza napady całkowicie samoistne; część identyfikuje wyzwalacze dietetyczne (nadmiar sodu albo kofeiny). Część doświadcza epizodów trwających od SEKUND DO MINUT, wyzwalanych dźwiękiem o dużym natężeniu i niskiej częstotliwości (zjawisko Tullia) oraz zmianami ciśnienia — te pojawiają się raczej PÓŹNIEJ w przebiegu choroby.",
          "Czym jest czas trwania epizodu: to okres, przez który chory musi pozostawać w spoczynku i nie może się poruszać. Epizod MOŻE trwać krócej niż 20 minut albo dłużej niż 12 godzin, ale żadna z tych możliwości nie jest częsta i przy takich czasach należy rozważyć INNE rozpoznania. Krótkie epizody wyzwalane zmianami POZYCJI GŁOWY powinny nasuwać inne przyczyny, takie jak BPPV. Określenie czasu bywa trudne, bo po epizodzie mogą utrzymywać się objawy resztkowe.",
          "DEFINICJA NIEDOSŁUCHU (progi): niedosłuch NISKOczęstotliwościowy to wzrost progów tonalnych dla przewodnictwa KOSTNEGO, wyższych (gorszych) w uchu chorym niż w uchu przeciwnym o co najmniej 30 dB HL w KAŻDEJ z dwóch SĄSIADUJĄCYCH częstotliwości PONIŻEJ 2000 Hz. W przypadkach niedosłuchu niskoczęstotliwościowego OBUSTRONNEGO bezwzględne progi przewodnictwa kostnego muszą wynosić 35 dB HL LUB WIĘCEJ w każdej z dwóch sąsiadujących częstotliwości poniżej 2000 Hz.",
          "Gdy dostępnych jest wiele audiogramów, wykazanie POWROTU niedosłuchu niskoczęstotliwościowego w jakimś punkcie czasu DODATKOWO WSPIERA rozpoznanie — wspiera, nie jest wymagane.",
        ],
        przypisyEn: [
          "Vertigo, on the definition this paper imports from the classification of vestibular symptoms, is felt self-motion in the absence of any real self-motion, or self-motion felt as distorted while the head is in fact moving normally. EPISODIC DIZZINESS AND UNSTEADINESS ARE NOT criteria for the diagnosis — patients may nevertheless report them over the long run.",
          "Most patients report entirely spontaneous spells; some identify dietary triggers (excess sodium or caffeine). Some experience episodes lasting SECONDS TO MINUTES triggered by high-intensity, low-frequency sound (Tullio phenomenon) and by pressure changes — these tend to occur LATER in the disease course.",
          "What episode duration means here: the stretch of time in which the patient is forced to stay at rest and cannot move about. Episodes shorter than 20 minutes or longer than 12 hours DO occur, but the paper calls neither a common finding and asks that OTHER disorders be weighed whenever such a duration is recorded. Short episodes set off by POSITIONAL changes of the head are steered toward other causes, BPPV among them. Pinning the duration down can be hard, since symptoms may linger once the episode itself is over.",
          "HEARING LOSS DEFINITION (thresholds): LOW-frequency SNHL means a rise in pure-tone thresholds for BONE-CONDUCTED sound, the affected ear reading higher — that is, worse — than the opposite ear by at least 30 dB HL, and this at EACH of two CONTIGUOUS frequencies BELOW 2000 Hz. Where the low-frequency SNHL is BILATERAL, the rule switches to absolute bone-conduction thresholds: 35 dB HL OR MORE, again at each of two contiguous frequencies below 2000 Hz.",
          "Where several audiograms exist, showing that the low-frequency SNHL RECOVERED at some point in time counts as FURTHER SUPPORT for the diagnosis — support, not a requirement.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Choroba Ménière'a — postać prawdopodobna", nazwaEn: "Probable Menière's disease",
        wymagane: "Wszystkie wymienione punkty łącznie. UWAGA REDAKCYJNA: w źródle wykaz biegnie A → B → D — litery C w nim NIE MA, a ostatni punkt nosi mimo to literę D. Praca tego nie komentuje i nigdzie nie odsyła do „kryterium C” ani „kryterium D” postaci prawdopodobnej (ciąg „criteria D” = 0 trafień; jedyne odesłanie literowe w całej pracy to „criteria B” w nocie (4) postaci pewnej). Atlas odtwarza literację źródła wiernie; każda renumeracja na A/B/C byłaby NASZĄ redakcją.",
        punkty: [
          { litera: "A", pl: "Dwa lub więcej epizodów zawrotu ALBO dizziness, każdy trwający od 20 minut do 24 godzin. (Bez słowa „samoistnych\" — postać prawdopodobna NIE wymaga samoistności napadu.)", en: "Episodes of vertigo OR dizziness, two or more of them, each running 20 minutes to 24 hours. (The word \"spontaneous\" is absent — the probable form does NOT require the attack to be spontaneous.)" },
          { litera: "B", pl: "Fluktuujące objawy uszne — słuch, szum uszny lub uczucie pełności — w uchu chorym.", en: "Aural symptoms that FLUCTUATE — hearing, tinnitus or fullness — in the affected ear." },
          { litera: "D", pl: "Obraz nie jest lepiej wyjaśniony przez inne rozpoznanie przedsionkowe. (Litera D jest literą ŹRÓDŁA; punktu C w wykazie postaci prawdopodobnej nie ma.)", en: "Not better accounted for by another vestibular diagnosis. (The letter D is the SOURCE's letter; there is no item C in the probable-form list.)" },
        ],
        przypisyPl: [
          "Objawy fluktuujące MUSZĄ być zgłoszone PODCZAS epizodu zawrotu — to obostrzenie, którego treść kryterium C postaci pewnej nie ma tak wprost. Zwykle stwierdza się niedosłuch odbiorczy, ale w pierwszych latach choroby może być też obserwowany niedosłuch PRZEWODZENIOWY albo MIESZANY.",
          "Diagnostyka różnicowa dla postaci PRAWDOPODOBNEJ jest KRÓTSZA niż dla pewnej: obejmuje TIA, migrenę przedsionkową i inne zaburzenia przedsionkowe — NIE wymienia napadowicy przedsionkowej ani nawracającej jednostronnej westibulopatii. MRI może być konieczne, by wykluczyć schwannoma przedsionkowego albo guza worka endolimfatycznego. Sformułowanie też się różni: przy postaci pewnej stany współistniejące „nie wyjaśniają ROZPOZNANIA\", przy prawdopodobnej — „nie wyjaśniają ZESPOŁU KLINICZNEGO\". Praca nie komentuje, czy różnica jest zamierzona.",
          "SZEŚĆ różnic wobec postaci pewnej: (1) kwalifikuje zawrót ALBO dizziness, a nie sam zawrót; (2) nie wymaga samoistności; (3) górna granica czasu epizodu to 24 godziny zamiast 12 — dolna granica 20 minut jest ta sama; (4) BRAK jakiegokolwiek kryterium audiometrycznego; (5) objawy uszne muszą być zgłoszone PODCZAS epizodu; (6) krótsza lista różnicowa.",
        ],
        przypisyEn: [
          "The fluctuating symptoms MUST be reported DURING the vertigo episode — a restriction that criterion C of the definite form does not state so plainly. What is usually found is sensorineural loss, but the first years of the disease may also show a conductive or a mixed loss.",
          "The differential for the PROBABLE form is SHORTER than for the definite one: TIA, vestibular migraine and other vestibular disorders — vestibular paroxysmia and recurrent unilateral vestibulopathy are NOT on it. Here too MRI may be required to rule out a vestibular schwannoma or a tumour of the endolymphatic sac. The wording differs as well: for the definite form comorbidities \"do not explain the DIAGNOSIS\", for the probable form they \"do not explain the CLINICAL SYNDROME\". The paper does not comment on whether the difference is intentional.",
          "SIX differences from the definite form: (1) vertigo OR dizziness qualifies, not vertigo alone; (2) spontaneity is not required; (3) the upper duration bound is 24 hours instead of 12 — the lower bound of 20 minutes is the same; (4) there is NO audiometric criterion at all; (5) the aural symptoms must be reported DURING the episode; (6) the differential list is shorter.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "dwa lub więcej", wielkoscPl: "minimalna liczba epizodów", wielkoscEn: "minimum number of episodes", kontekstPl: "kryterium A obu postaci", kontekstEn: "criterion A of both forms" },
      { ranga: "kryterium", wartosc: "20 minut – 12 godzin", wielkoscPl: "czas trwania epizodu — postać pewna", wielkoscEn: "episode duration — definite form", kontekstPl: "kryterium A postaci pewnej; nota dopuszcza czasy krótsze i dłuższe, ale nazywa je niecodziennymi i każe rozważyć inne rozpoznania", kontekstEn: "criterion A of the definite form; the note allows shorter and longer durations but calls them uncommon and requires that other disorders be considered" },
      { ranga: "nota", wartosc: "co najmniej 30 dB HL, przewodnictwo kostne, w każdej z dwóch sąsiadujących częstotliwości poniżej 2000 Hz", wielkoscPl: "próg niedosłuchu niskoczęstotliwościowego — różnica międzyuszna", wielkoscEn: "low-frequency hearing loss threshold — interaural difference", kontekstPl: "nota (4) do kryterium B postaci pewnej — ucho chore gorsze od przeciwnego", kontekstEn: "note (4) to criterion B of the definite form — the affected ear worse than the contralateral one" },
      { ranga: "nota", wartosc: "bezwzględne progi przewodnictwa kostnego 35 dB HL lub więcej w każdej z dwóch sąsiadujących częstotliwości poniżej 2000 Hz", wielkoscPl: "próg niedosłuchu niskoczęstotliwościowego — przypadki obustronne", wielkoscEn: "low-frequency hearing loss threshold — bilateral cases", kontekstPl: "nota (4) do kryterium B postaci pewnej — jedyne miejsce, w którym praca obsługuje obustronność progiem liczbowym", kontekstEn: "note (4) to criterion B of the definite form — the only place where the paper handles bilaterality with a numeric threshold" },
      { ranga: "nota", wartosc: "24 godziny", wielkoscPl: "okno powiązania czasowego zmiany słyszenia z napadem", wielkoscEn: "window of temporal association between hearing change and attack", kontekstPl: "nota (6) do kryterium B postaci pewnej", kontekstEn: "note (6) to criterion B of the definite form" },
      { ranga: "nota", wartosc: "sekundy, rzadko kilka minut", wielkoscPl: "czas trwania napadu Tumarkina", wielkoscEn: "duration of a Tumarkin attack", kontekstPl: "nota (7) do postaci pewnej", kontekstEn: "note (7) to the definite form" },
      { ranga: "kryterium", wartosc: "20 minut – 24 godziny", wielkoscPl: "czas trwania epizodu — postać prawdopodobna", wielkoscEn: "episode duration — probable form", kontekstPl: "kryterium A postaci prawdopodobnej — górna granica dwukrotnie wyższa niż w postaci pewnej, dolna ta sama; złagodzenie z noty wisi WYŁĄCZNIE przy oknie postaci pewnej, granicy 24 godzin źródło nie łagodzi niczym. Skutek, którego praca nie komentuje (nazwany decyzją D-MEN, 2026-08-22): chory z audiogramem i napadami 18-godzinnymi wypada z postaci pewnej na samym czasie i ląduje tu, gdzie jego audiogram nie jest przez nic czytany — a napad dłuższy niż 24 godziny wypada poza obie postaci", kontekstEn: "criterion A of the probable form — the upper bound is twice that of the definite form, the lower bound is identical; the note's relaxation hangs SOLELY on the definite form's window, and the source softens the 24-hour bound with nothing. A consequence the paper does not comment on (named by decision D-MEN, 2026-08-22): a patient with an audiogram and 18-hour attacks falls out of the definite form on time alone and lands here, where the audiogram is read by nothing — and an attack longer than 24 hours falls outside both forms" },
    ],
    granicePl: [
      "PRÓG ISTNIEJE TYLKO DLA CZĘŚCI „NISKO\": kryterium B żąda niedosłuchu „nisko- do średnioczęstotliwościowego\", ale nota definiuje progami WYŁĄCZNIE niedosłuch niskoczęstotliwościowy. Praca NIE podaje żadnego progu liczbowego dla części średnioczęstotliwościowej — nie wolno go dopisać.",
      "Postać prawdopodobna NIE MA kryterium audiometrycznego, a mimo to jej punkt B mówi o „uchu chorym\". Praca definiuje ucho chore wyłącznie przez niedosłuch z kryterium B postaci pewnej i NIE PODAJE, jak wyznaczyć ucho chore w postaci prawdopodobnej. To luka źródła, nie miejsce do wypełnienia.",
      "NAPIĘCIE WEWNĘTRZNE, którego praca nie komentuje: nota (1) postaci pewnej mówi, że napadowa dizziness i niestabilność NIE są kryteriami rozpoznania, podczas gdy kryterium A postaci PRAWDOPODOBNEJ dopuszcza „zawrót ALBO dizziness\". Praca nie definiuje też dizziness — definiuje wyłącznie zawrót, przez odesłanie do klasyfikacji objawów.",
      "Kryteria z 2015 roku NIE ZAWIERAJĄ ANI JEDNEGO ZDANIA O OCZOPLĄSIE. Ciąg „nystagmus\" ma w pliku 2 trafienia i oba stoją POZA kryteriami (wyliczenie trwających prac ICVD we wstępie oraz przedrukowane kryteria japońskie z 1974 roku).",
      "Praca NIE wymaga ani nie wymienia żadnego testu czynności przedsionka: kaloryka = 0, vHIT = 0, head impulse = 0, VEMP = 0, posturografia = 0, elektronystagmografia = 0. Jedynym badaniem WYMAGANYM przez kryteria jest audiometria tonalna z przewodnictwem kostnym — i tylko w kryterium B postaci pewnej.",
      "MRI NIGDY nie jest kryterium rozpoznania. Jest opisane jako „może być konieczne\" do WYKLUCZENIA schwannoma przedsionkowego albo guza worka endolimfatycznego, a w komentarzu o TIA i udarze — jako narzędzie diagnostyki naczyniowej (MRI z MRA) przy klinicznie istotnej wątpliwości. MRI 3 T z gadolinem pojawia się wyłącznie jako obserwacja o ograniczonej swoistości.",
    ],
    graniceEn: [
      "THE THRESHOLD EXISTS ONLY FOR THE \"LOW\" PART: criterion B requires \"low- to medium-frequency\" hearing loss, but the note defines thresholds ONLY for low-frequency SNHL. The paper gives NO numeric threshold for the medium-frequency part — none may be supplied.",
      "The probable form HAS NO audiometric criterion, yet its item B speaks of \"the affected ear\". The paper defines the affected ear solely by the hearing loss in criterion B of the definite form and DOES NOT SAY how to determine the affected ear in the probable form. This is a gap in the source, not a slot to be filled.",
      "AN INTERNAL TENSION the paper does not comment on: note (1) of the definite form states that episodic dizziness and unsteadiness are NOT criteria for the diagnosis, while criterion A of the PROBABLE form admits \"vertigo OR dizziness\". Nor does the paper define dizziness — it defines only vertigo, by reference to the classification of vestibular symptoms.",
      "The 2015 criteria CONTAIN NOT ONE SENTENCE ABOUT NYSTAGMUS. The string \"nystagmus\" has 2 hits in the file and both stand OUTSIDE the criteria (the introduction's list of ICVD work in progress, and the reprinted Japanese 1974 criteria).",
      "The paper neither requires nor mentions any vestibular function test: caloric = 0, vHIT = 0, head impulse = 0, VEMP = 0, posturography = 0, electronystagmography = 0. The only investigation REQUIRED by the criteria is pure-tone audiometry with bone conduction — and only in criterion B of the definite form.",
      "MRI is NEVER a diagnostic criterion. It is described as something that \"may be required\" in order to rule out a vestibular schwannoma or a tumour of the endolymphatic sac, and in the TIA/stroke comment as a vascular work-up tool (MRI with MRA) once clinically meaningful doubt exists. 3 T MRI with gadolinium appears only as an observation of limited specificity.",
    ],
  },
  {
    klucz: "paroksyzmia",
    zrodlo: "[H49] Strupp 2016",
    typ: "jednostka",
    nazwaPl: "Napadowica przedsionkowa",
    nazwaEn: "Vestibular paroxysmia",
    zespol: "EVS",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "Pomiar powtórzony 2026-08-22 na worktree atlas-otoneurologiczny (HEAD 21bdda4 + niezacommitowane src/app/atlas-model.js i src/app/atlas-state.js). grep -rnoE 'napadowic|vestibular paroxysmia|H49' src/ = 7 trafień w DWÓCH plikach: src/render/svg-screens.js:3508–3515 (komentarz D6/NAPADOWICA + pozycja listy wykluczeń kryterium D karty migreny przedsionkowej, niosąca progi < 1 min / < 5 min i wzmiankę o karbamazepinie) oraz src/app/atlas-model.js:133 (komentarz o randze progu, przywołujący notę 4 [H49] jako przykład noty sprzecznej z własnym kryterium). grep -rniE 'karbamazep|carbamazep|okskarbazep|oxcarbazep' src/ = 1 trafienie (svg-screens.js:3515). grep -rniE 'napadowic|paroxysmia' src/engine/ src/pose/ = 0 trafień — żaden moduł silnika nie liczy jej fizyki ani obrazu. (Uwaga pomiarowa: szersze 'paroksyzm|paroxysm' daje 14 trafień, ale większość dotyczy PARAKSYZMU jako fazy krzywej ξ(t) w BPPV oraz zjawisk napadowych w src/engine/neuro-vor.js, nie tej jednostki. Liczby trafień w src/ są stanem chwili — atlas-model.js jest w tej gałęzi dopisywany, więc rośnie liczba trafień, nie zmienia się klasyfikacja.)",
    streszczeniePl: "Jednostka zbudowana wokół bardzo krótkich, powtarzalnych napadów zawrotu — wirowego albo niewirowego — nawracających u tego samego chorego w tej samej postaci. Zakładanym mechanizmem są wyładowania efaptyczne w proksymalnym odcinku nerwu przedsionkowo-ślimakowego, pokrytym mieliną ośrodkową; najczęściej rozważaną przyczyną drażnienia jest sąsiadujące naczynie, ale praca wylicza także guz lub torbiel, demielinizację i uraz. Kryteria z 2016 r. są w całości kliniczno-wywiadowe — jedynym elementem spoza wywiadu jest odpowiedź na karbamazepinę lub okskarbazepinę, i to tylko w postaci pewnej. Wcześniejsze, wycofane kryteria z 2008 r. zawierały MR, okulografię i próbę hiperwentylacji; obowiązujący zestaw ICVD ich nie zawiera.",
    streszczenieEn: "An entity built around very brief, repetitive attacks of vertigo — spinning or non-spinning — that recur in the same form in the same patient. The assumed mechanism is ephaptic discharge in the proximal segment of the vestibulocochlear nerve, the part covered by central myelin; a neighbouring vessel is the most frequently considered irritant, but the paper also lists tumour or cyst, demyelination and trauma. The 2016 criteria are entirely history-based — the only non-history element is a response to carbamazepine or oxcarbazepine, and only in the definite form. The earlier, superseded 2008 criteria included MRI, oculography and a hyperventilation test; the current ICVD set does not.",
    synonimy: [
      { pl: "disabling positional vertigo (obezwładniający zawrót pozycyjny)", en: "disabling positional vertigo", odradzany: true, uwagaPl: "Nazwa nadana przez Jannettę i wsp. w 1984 r. Sama praca opisuje ją jako zespół klinicznie NIEJEDNORODNY: zawroty od sekund do dni, o różnym charakterze (wirowanie, zamroczenie albo niestabilność chodu bez zawrotu) i o różnych objawach towarzyszących. Termin nie odpowiada zakresowi jednostki wyznaczonemu kryteriami z 2016 r.", uwagaEn: "The name given by Jannetta et al. in 1984. The paper itself describes it as a clinically HETEROGENEOUS syndrome: vertigo lasting seconds to days, of varying character (spinning, light-headedness, or gait instability without vertigo) and with varying accompanying symptoms. The term does not match the scope the 2016 criteria set for the entity." },
      { pl: "napadowica słuchowo-przedsionkowa (audiovestibular paroxysmia)", en: "audiovestibular paroxysmia" },
      { pl: "napadowica przedsionkowa — kryteria z 2008 r.", en: "vestibular paroxysmia — 2008 criteria", odradzany: true, uwagaPl: "Wersja historyczna, wycofana. Wymagała co najmniej pięciu napadów oraz — dla postaci pewnej — spełnienia A–E, w tym kryterium D złożonego z badań instrumentalnych (ucisk neurowaskularny w MR w sekwencji CISS z angiografią TOF, oczopląs po hiperwentylacji mierzony okulograficznie, narastanie deficytu przedsionkowego w okulografii, odpowiedź na leki przeciwpadaczkowe). Postać prawdopodobna z 2008 r. wymagała kryterium A oraz co najmniej trzech z B–E. Cytowanie „kryteriów napadowicy” z badaniami instrumentalnymi albo z regułą „N z M” odsyła do tej wersji, nie do obowiązującej.", uwagaEn: "A historical, superseded version. It required at least five attacks and — for the definite form — criteria A–E, including a criterion D made of instrumental findings (neurovascular cross-compression on MRI with CISS sequence and TOF angiography, hyperventilation-induced nystagmus measured by oculography, an increasing vestibular deficit on follow-up oculography, response to antiepileptics). The 2008 probable form required criterion A plus at least three of B–E. Citing 'the vestibular paroxysmia criteria' with instrumental tests, or with an 'N of M' rule, points at that version, not at the current one." },
    ],
    kryteria: [
      {
        postac: "pewna",
        nazwaPl: "Napadowica przedsionkowa (postać pewna)", nazwaEn: "Vestibular paroxysmia (definite form)",
        wymagane: "wszystkie A–E (koniunkcja pełna; nagłówek źródła dopisuje, że każdy punkt musi być spełniony — „each point needs to be fulfilled”)",
        punkty: [
          { litera: "A", pl: "Co najmniej dziesięć napadów samoistnego zawrotu — wirowego albo niewirowego.", en: "At least ten attacks of spontaneous vertigo — spinning or non-spinning." },
          { litera: "B", pl: "Czas trwania krótszy niż 1 minuta.", en: "Duration less than 1 minute." },
          { litera: "C", pl: "Stereotypowa fenomenologia u danego chorego — napady są do siebie podobne.", en: "Stereotyped phenomenology in the individual patient — the attacks resemble one another." },
          { litera: "D", pl: "Odpowiedź na leczenie karbamazepiną lub okskarbazepiną.", en: "Response to treatment with carbamazepine or oxcarbazepine." },
          { litera: "E", pl: "Obraz nie jest lepiej wyjaśniony innym rozpoznaniem.", en: "Not better accounted for by another diagnosis." },
        ],
        przypisyPl: [
          "Przypis 1 (do A) — liczbę napadów dobrano dlatego, że jednostka zwykle przebiega z wysoką częstością napadów. Rozrzut między chorymi jest bardzo szeroki: od 30 napadów na dobę do kilku napadów rocznie. Przebieg jest zwykle przewlekły, to jest dłuższy niż trzy miesiące, a część chorych ma setki napadów rocznie.",
          "Przypis 2 (do A, w postaci pewnej wpisany w przymiotnik „samoistny”) — większość napadów pojawia się samoistnie. U części chorych napad może wyzwolić skręt głowy w prawo lub w lewo w pozycji wyprostowanej; praca zestawia to z wyzwalaniem napadów w neuralgii nerwu trójdzielnego przez bodziec czuciowy. Wyzwalające ruchy głowy lub ciała typowo nie mają wzorca takiego jak w BPPV. U części chorych napad zawrotu i oczopląs bywają prowokowane hiperwentylacją. Przypis dodaje dwie reguły przekierowania: powtarzalne wyzwalanie utrzymanym skrętem głowy w bok kieruje ku zespołowi rotacyjnego zamknięcia tętnicy kręgowej, a wyzwalanie nagłymi zmianami ciśnienia wewnątrzczaszkowego (kichnięcie, kaszel, próba Valsalvy) albo ciśnienia w przewodzie słuchowym lub ciśnienia otoczenia — ku przetoce perilimfatycznej lub zespołowi trzeciego ruchomego okna, na przykład dehiscencji kanału górnego.",
          "Przypis 3 (do A) — typ zawrotu (wirowy albo niewirowy) i kierunek pulsji są wewnątrzosobniczo dość jednorodne. Gdy napad zdarza się w staniu lub chodzie, chorzy zwykle odczuwają niepewność.",
          "Przypis 4 (do B) — u większości chorych napady trwają od jednej sekundy do najwyżej jednej minuty; u innych czas trwania napadu albo tylko jego części bywa dłuższy, do wielu minut, albo wydłuża się w przebiegu choroby. Przy napadach krótkich przypis każe rozważyć kryzę otolitową Tumarkina, napadowe napady pniowe, przetokę perilimfatyczną i — rzadko — padaczkę z aurą przedsionkową; przy napadach dłuższych zwłaszcza migrenę przedsionkową i chorobę Ménière'a.",
          "Przypis 5 (do C) — część chorych zgłasza objawy słuchowe, na przykład jednostronny szum uszny albo przeczulicę słuchową w trakcie napadu. Z rodzaju skarg — przedsionkowych albo ślimakowych — można wnioskować o zajętym uchu i nerwie. Równoczesne objawy nerwu VII i VIII (zawrót, szum, połowiczy kurcz twarzy) wskazują na drażnienie obu nerwów w przewodzie słuchowym wewnętrznym.",
        ],
        przypisyEn: [
          "Note 1 (to A) — a high attack frequency is the norm in this disorder, and that is why the number of attacks was set where it was. Between patients the spread is very wide: at one extreme 30 attacks in a single day, at the other only a few across a whole year. Chronic course is the rule — longer than three months — and some patients suffer hundreds of attacks per year.",
          "Note 2 (to A, carried in the definite form by the adjective 'spontaneous') — most attacks arise spontaneously. In some patients an attack can be brought on by a head turn to either side while the patient is upright; the paper compares this with the sensory triggering of attacks in trigeminal neuralgia. Triggering head or body movements typically do not follow the BPPV pattern. In some patients the attack of vertigo and the nystagmus can be provoked by hyperventilation. The note adds two redirection rules: reproducible triggering by a sustained lateral head turn points towards rotational vertebral artery occlusion syndrome, and triggering by sudden intracranial pressure changes (sneezing, coughing, Valsalva) or by sudden ear-canal or ambient pressure changes points towards a perilymph fistula or towards a third-mobile-window condition of the inner ear, superior canal dehiscence among them.",
          "Note 3 (to A) — the type of vertigo (spinning or non-spinning) and the direction of pulsion are fairly uniform within one patient. If an attack occurs while standing or walking, patients usually experience unsteadiness.",
          "Note 4 (to B) — in most patients the attacks last from one second up to one minute; in others the duration of the attacks, or of some of them, may be longer, up to many minutes, or may lengthen over the course of the illness. For short attacks the note calls for considering Tumarkin's otolithic crisis, paroxysmal brainstem attacks, perilymph fistula and — rarely — epilepsy with vestibular aura; for longer attacks, particularly vestibular migraine and Menière's disease.",
          "Note 5 (to C) — some patients also describe hearing complaints during the attack, for instance one-sided tinnitus or hyperacusis. The type of complaint — vestibular or cochlear — allows inferences about the affected ear and nerve. Simultaneous seventh- and eighth-nerve symptoms (vertigo, tinnitus, hemifacial spasm) indicate irritation of both nerves in the internal acoustic meatus.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobna napadowica przedsionkowa", nazwaEn: "Probable vestibular paroxysmia",
        wymagane: "wszystkie A–E (koniunkcja pełna; nagłówek źródła również dopisuje, że każdy punkt musi być spełniony) — to NIE jest częściowe spełnianie zestawu postaci pewnej",
        punkty: [
          { litera: "A", pl: "Co najmniej pięć napadów zawrotu — wirowego albo niewirowego. Słowa „samoistny” w tym kryterium NIE MA; samoistność jest wydzielona do kryterium C i tam rozluźniona.", en: "At least five attacks of vertigo — spinning or non-spinning. The word 'spontaneous' is NOT in this criterion; spontaneity is moved out into criterion C and relaxed there." },
          { litera: "B", pl: "Czas trwania krótszy niż 5 minut.", en: "Duration less than 5 minutes." },
          { litera: "C", pl: "Występowanie samoistne ALBO prowokowane przez określone ruchy głowy.", en: "Spontaneous occurrence OR provoked by certain head movements." },
          { litera: "D", pl: "Stereotypowa fenomenologia u danego chorego.", en: "Stereotyped phenomenology in the individual patient." },
          { litera: "E", pl: "Obraz nie jest lepiej wyjaśniony innym rozpoznaniem.", en: "Not better accounted for by another diagnosis." },
        ],
        przypisyPl: [
          "Kryterium A odsyła do przypisów 1 i 3, kryterium B do przypisu 4, kryterium C do przypisu 2, kryterium D do przypisów 5 i 6 — treść przypisów jest wspólna z postacią pewną.",
          "Postać prawdopodobna NIE ZAWIERA żadnego kryterium lekowego. Przypis 7 domyka to jawnie: u chorego jeszcze nieleczonego kryterium odpowiedzi na lek nie da się zastosować i rozpoznanie ma brzmieć „prawdopodobna”.",
          "Cztery osie różnią postać prawdopodobną od pewnej, nie jedna: liczba napadów (5 zamiast 10), czas trwania (< 5 min zamiast < 1 min), samoistność (osobne kryterium C, rozluźnione do alternatywy z prowokacją ruchem głowy) oraz brak kryterium lekowego.",
        ],
        przypisyEn: [
          "Criterion A refers to notes 1 and 3, criterion B to note 4, criterion C to note 2, criterion D to notes 5 and 6 — the content of the notes is shared with the definite form.",
          "The probable form CONTAINS no drug criterion at all. Note 7 states this openly: in a patient not yet treated, the treatment-response criterion cannot be applied and the diagnosis is to read 'probable'.",
          "Four axes, not one, separate the probable form from the definite one: the number of attacks (5 instead of 10), the duration (< 5 min instead of < 1 min), spontaneity (a separate criterion C, relaxed into an alternative with head-movement provocation) and the absence of any drug criterion.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "≥ 10", wielkoscPl: "liczba napadów", wielkoscEn: "number of attacks", kontekstPl: "kryterium A postaci pewnej", kontekstEn: "criterion A, definite form" },
      { ranga: "kryterium", wartosc: "≥ 5", wielkoscPl: "liczba napadów", wielkoscEn: "number of attacks", kontekstPl: "kryterium A postaci prawdopodobnej", kontekstEn: "criterion A, probable form" },
      { ranga: "nota", wartosc: "30 napadów/dobę – kilka napadów/rok", wielkoscPl: "częstość napadów", wielkoscEn: "attack frequency", kontekstPl: "przypis 1 — rozrzut między chorymi; część chorych ma setki napadów rocznie", kontekstEn: "note 1 — the spread between patients; some patients have hundreds of attacks per year" },
      { ranga: "kryterium", wartosc: "< 1 min", wielkoscPl: "czas trwania napadu", wielkoscEn: "attack duration", kontekstPl: "kryterium B postaci pewnej — tylko górna granica, dolnej praca nie stawia", kontekstEn: "criterion B, definite form — an upper bound only; the paper sets no lower bound" },
      { ranga: "kryterium", wartosc: "< 5 min", wielkoscPl: "czas trwania napadu", wielkoscEn: "attack duration", kontekstPl: "kryterium B postaci prawdopodobnej — tylko górna granica", kontekstEn: "criterion B, probable form — an upper bound only" },
      { ranga: "nota", wartosc: "do wielu minut", wielkoscPl: "czas napadu u części chorych albo w miarę trwania choroby", wielkoscEn: "attack duration in some patients or as the illness progresses", kontekstPl: "przypis 4 — dopuszczenie wykraczające poza obraz „napadów sekundowych”", kontekstEn: "note 4 — an allowance that reaches beyond the picture of 'attacks lasting seconds'" },
      { ranga: "nota", wartosc: "200–800 mg/dobę", wielkoscPl: "dawka karbamazepiny", wielkoscEn: "carbamazepine dose", kontekstPl: "przypis 7 i sekcja o leczeniu — dawka stoi POZA kryterium D, które jest jakościowe", kontekstEn: "note 7 and the treatment section — the dose sits OUTSIDE criterion D, which is qualitative" },
      { ranga: "nota", wartosc: "300–900 mg/dobę", wielkoscPl: "dawka okskarbazepiny", wielkoscEn: "oxcarbazepine dose", kontekstPl: "przypis 7 i sekcja o leczeniu", kontekstEn: "note 7 and the treatment section" },
    ],
    granicePl: [
      "W kryteriach A–E obu postaci NIE MA żadnego badania instrumentalnego: ani MR, ani audiometrii, ani vHIT, ani próby kalorycznej, ani VEMP, ani okulografii. Praca sama uzasadnia to w metodyce — kryteria mają dać się zastosować także tam, gdzie badań laboratoryjnych nie ma.",
      "MR nie jest ani konieczne, ani wystarczające do spełnienia kryteriów. Praca stawia jednak osobny nakaz, który stoi POZA kryteriami: rezonans głowy należy wykonać po to, by WYKLUCZYĆ inne przyczyny — guz kąta mostowo-móżdżkowego, torbiel pajęczynówki, megalodolichobasilaris, plaki pniowe w stwardnieniu rozsianym, zawał pnia i inne zmiany pnia mózgu.",
      "Praca NIE stawia dolnego progu czasu trwania napadu ani okna czasowego, w którym wymaganą liczbę napadów trzeba zebrać. Obie postaci mają wyłącznie górną granicę czasu.",
      "Praca sama zalicza kryterium lekowe do obszarów niepewności: nie ma opublikowanych badań z randomizacją dotyczących leczenia, a swoistość odpowiedzi na lek dla ustalenia rozpoznania wciąż nie została wykazana. Przenoszenie kryterium D bez tego zastrzeżenia zniekształca źródło.",
      "Brak odpowiedzi na karbamazepinę NIE jest w tej pracy kryterium wykluczającym — o takim zastosowaniu praca nie mówi nic.",
      "Postaci prawdopodobnej NIE rozpoznaje się przez częściowe spełnienie zestawu postaci pewnej. Ma ona własny, pełny zestaw pięciu kryteriów, wszystkich obowiązkowych; konstrukcja „N z M” pochodzi z wycofanych kryteriów z 2008 r.",
    ],
    graniceEn: [
      "Criteria A–E of both forms contain NO instrumental test: no MRI, no audiometry, no vHIT, no caloric testing, no VEMP, no oculography. The paper justifies this in its methodology — the criteria are meant to be applicable also where laboratory testing is unavailable.",
      "MRI is neither necessary nor sufficient for fulfilling the criteria. The paper does, however, issue a separate instruction standing OUTSIDE the criteria: a cranial MRI should be performed in order to EXCLUDE other causes — a cerebellopontine angle tumour, an arachnoid cyst, megalodolichobasilaris, brainstem plaques in multiple sclerosis, brainstem infarction and other brainstem lesions.",
      "The paper sets NO lower bound on attack duration and NO time window within which the required number of attacks must accumulate. Both forms carry an upper time bound only.",
      "The paper itself files the drug criterion under areas of uncertainty: there are no published randomised trials of treatment, and the specificity of the treatment response for establishing the diagnosis has yet to be demonstrated. Carrying criterion D across without that caveat distorts the source.",
      "A failure to respond to carbamazepine is NOT an exclusion criterion in this paper — the paper says nothing about using it that way.",
      "The probable form is NOT diagnosed by partially meeting the definite-form set. It has its own complete set of five criteria, all mandatory; the 'N of M' construction comes from the superseded 2008 criteria.",
    ],
  },
  {
    klucz: "ortostatyczny",
    zrodlo: "[H52] Kim 2019",
    typ: "jednostka",
    nazwaPl: "Hemodynamiczny zawrót/oszołomienie ortostatyczne",
    nazwaEn: "Hemodynamic orthostatic dizziness/vertigo",
    zespol: "EVS",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "Pomiar powtórzony 2026-08-22 na worktree atlas-otoneurologiczny (HEAD 21bdda4 + niezacommitowane src/app/atlas-model.js i src/app/atlas-state.js). grep -rnoE 'H52|ortostatyczn|orthostatic|POTS|hipotoni' src/ = 24 trafienia w DWÓCH plikach: src/app/triage-model.js (23 trafienia — komentarz D-ORTO l. 109–132; węzeł pytania 'ortostaza' l. 135–150: „Czy objawy występują TAKŻE przy kładzeniu się albo obracaniu w łóżku?”, uruchamiany przy przebiegu napadowym i wyzwalaczu pozycyjnym albo nieznanym; nota wyniku przy odpowiedzi 'nie' l. 274–287, która dopina wpis atlasu 'ortostatyczny' i powtarza nakaz próby pozycyjnej ze źródła) oraz src/app/atlas-model.js:46. Program ma zatem WĘZEŁ DECYZYJNY z noty 1 źródła i LINK do atlasu, ale niczego hemodynamicznego nie liczy: grep -rniE 'mmHg' src/ = 1 trafienie i jest to KOMENTARZ (triage-model.js:126), grep -rniE '\\bbpm\\b|tętn[oa]|heart rate' src/ = 1 trafienie (tekst noty, l. 286). grep -rniE 'ortostat|orthostat|POTS' src/engine/ src/pose/ = 0 trafień.",
    streszczeniePl: "Jednostka obejmuje powtarzalne epizody oszołomienia, niestabilności albo zawrotu, które pojawiają się przy przechodzeniu do pozycji siedzącej lub stojącej albo trwają w pozycji pionowej i ustępują po siadzie lub położeniu się. Mechanizm jest zdefiniowany jako GLOBALNA hipoperfuzja mózgu — dlatego kryteria celowo obejmują wyłącznie dolegliwości ortostatyczne pochodzenia hemodynamicznego, a nie wszystko, co dokucza w pionie. Postać pewna wymaga udokumentowania pomiarem hipotonii ortostatycznej, zespołu tachykardii posturalnej albo omdlenia; postać prawdopodobna zastępuje ten pomiar co najmniej jednym objawem towarzyszącym z zamkniętej listy czterech. Praca odchodzi od wcześniejszej konwencji, wedle której zawrót wirowy z definicji wykluczał rozpoznanie ortostatyczne: prawdziwy zawrót w ortostazie udokumentowano u chorych ze słabą regulacją autonomiczną.",
    streszczenieEn: "The entity covers repeated episodes of dizziness, unsteadiness or vertigo that arise on moving into a sitting or standing position, or persist while upright, and subside on sitting or lying down. The mechanism is defined as GLOBAL brain hypoperfusion — which is why the criteria deliberately cover only orthostatic complaints of haemodynamic origin, not everything that troubles a patient when upright. The definite form requires documented orthostatic hypotension, postural tachycardia syndrome or syncope; the probable form replaces that measurement with at least one accompanying symptom from a closed list of four. The paper departs from the earlier convention under which spinning vertigo excluded an orthostatic diagnosis by definition: true orthostatic vertigo has been documented in patients with poor autonomic regulation.",
    synonimy: [
      { pl: "oszołomienie/zawrót postawny (postural dizziness/vertigo)", en: "postural dizziness/vertigo", odradzany: true, uwagaPl: "Praca wymienia ten termin wśród nazw używanych wcześniej i jednocześnie ODRADZA go wprost: odnosi się on do oszołomienia przy zmianach postawy i NIE oznacza automatycznie ortostatycznego, bo równie dobrze stosuje się do pozycyjnego. Używania go bez dodatkowego rozróżnienia praca wprost nie zaleca.", uwagaEn: "The paper lists this term among previously used names and at the same time DISCOURAGES it outright: it refers to dizziness during postural changes and does NOT automatically mean orthostatic, since it applies equally well to positional dizziness. Using it without further discrimination is something the paper explicitly does not recommend." },
      { pl: "zawrót/oszołomienie ortostatyczne (orthostatic dizziness/vertigo)", en: "orthostatic dizziness/vertigo" },
      { pl: "oszołomienie/zawrót autonomiczny (autonomic dizziness/vertigo)", en: "autonomic dizziness/vertigo" },
      { pl: "oszołomienie/zawrót wysiłkowy i poposiłkowy (exertional / postprandial dizziness)", en: "exertional / postprandial dizziness" },
    ],
    kryteria: [
      {
        postac: "pewna",
        nazwaPl: "Hemodynamiczny zawrót/oszołomienie ortostatyczne (postać pewna)", nazwaEn: "Hemodynamic orthostatic dizziness/vertigo (definite form)",
        wymagane: "wszystkie A–C",
        punkty: [
          { litera: "A", pl: "Pięć lub więcej epizodów oszołomienia, niestabilności albo zawrotu wywołanych wstawaniem — to jest zmianą pozycji ciała z leżącej do siedzącej lub stojącej albo z siedzącej do stojącej — ALBO obecnych w trakcie pozycji pionowej, które ustępują po siadzie lub położeniu się.", en: "Arising — a change of body posture, lying to sitting or standing, or sitting to standing — triggers dizziness, unsteadiness or vertigo; OR the symptom is present during the upright position and subsides on sitting or lying down. Five or more such episodes are required." },
          { litera: "B", pl: "Hipotonia ortostatyczna, zespół tachykardii posturalnej ALBO omdlenie, udokumentowane przy pionizacji albo w teście pochyleniowym.", en: "Documented either on standing or on head-up tilt testing: orthostatic hypotension, postural tachycardia syndrome OR syncope." },
          { litera: "C", pl: "Obraz nie jest lepiej wyjaśniony inną chorobą lub zaburzeniem.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Nota 1 (do A) — zawrót/oszołomienie ortostatyczne trzeba odróżnić od zawrotu POZYCYJNEGO, wyzwalanego zmianą położenia głowy względem grawitacji, oraz od zawrotu wywołanego ruchem głowy, bo samo wstawanie niesie ze sobą ruch głowy i może wyzwolić objaw pozycyjny. Narzędzie rozróżniające podane przez pracę: chorego, który ma objawy przy wstawaniu, należy zapytać, czy objawy występują TAKŻE przy kładzeniu się albo obracaniu w łóżku — jeśli tak, są bardziej prawdopodobnie pozycyjne niż ortostatyczne. Nota dodaje świadomą niespójność z klasyfikacją objawów: niestabilność MA BYĆ wliczana do objawów tej jednostki, mimo że w klasyfikacji objawów przedsionkowych figuruje jako objaw posturalny w trakcie pozycji pionowej, a nie objaw związany ze zmianą pozycji ciała względem grawitacji.",
          "Nota 2 (do A) — czas trwania epizodów jest ZMIENNY i praca NIE stawia go jako progu diagnostycznego. Podane zakresy są opisem: wcześniejsza propozycja kryteriów mówiła o sekundach do kilku minut; chorzy z neurogenną hipotonią ortostatyczną zwykle mogą stać tylko kilka minut i muszą usiąść lub się położyć, żeby uniknąć omdlenia; przy postaci początkowej objaw pojawia się natychmiast po wstaniu i trwa sekundy; przy zespole tachykardii posturalnej objawy trwają tak długo, jak długo chory pozostaje w pozycji pionowej.",
          "Nota 3 (do B) — pomiary ortostatyczne ciśnienia tętniczego i tętna są najważniejsze w przesiewie w kierunku dysfunkcji autonomicznej, JEDNAK wyniki testu pochyleniowego zwykle nie korelują dobrze z objawami ortostatycznymi: powtarzalność wyniku ujemnego wynosi około 95%, a dodatniego około 50%, przy czym odsetek wyników dodatnich rośnie u chorych z ciężkimi i częstymi objawami. Nota definiuje progi hipotonii ortostatycznej klasycznej, neurogennej, opóźnionej i początkowej oraz zespołu tachykardii posturalnej (patrz progi). Omdlenie wazowagalne opisano jako wywołane odruchem autonomicznym — ustaniem współczulnego napięcia naczyniowego i aktywacją nerwu błędnego — prowokowane długotrwałym staniem albo bodźcami sytuacyjnymi (nakłucie żyły, widok krwi), typowo poprzedzone bladością, potami, nudnościami, dyskomfortem brzusznym, ziewaniem, wzdychaniem i hiperwentylacją, które mogą wystąpić do 60 sekund przed utratą przytomności.",
        ],
        przypisyEn: [
          "Note 1 (to A) — orthostatic dizziness/vertigo must be distinguished from POSITIONAL vertigo, where the trigger is a change of head position relative to gravity, and from head-motion-induced vertigo, because arising itself carries head motion with it and can trigger a positional symptom. The discriminating tool the paper offers: a patient with symptoms on arising should be asked whether lying down or rolling over in bed brings them on AS WELL — an affirmative answer favours a positional rather than an orthostatic mechanism. The note adds a deliberate inconsistency with the symptom classification: unsteadiness IS to be counted among this entity's symptoms, even though the classification of vestibular symptoms lists it as a postural symptom during the upright position rather than a symptom tied to a change of body position relative to gravity.",
          "Note 2 (to A) — episode duration is VARIABLE and the paper does NOT set it as a diagnostic threshold. The ranges given are descriptive: an earlier criteria proposal spoke of seconds to a few minutes; patients with neurogenic orthostatic hypotension can usually stand for only a few minutes and must sit or lie down to avoid syncope; in the initial form the symptom appears immediately on standing and lasts seconds; in postural tachycardia syndrome the symptoms last as long as the patient remains upright.",
          "Note 3 (to B) — orthostatic measurements of blood pressure and heart rate matter most in screening for autonomic dysfunction, HOWEVER tilt-test results usually correlate poorly with orthostatic symptoms: the reproducibility of a negative result is about 95% and of a positive result about 50%, while the share of positive results rises in patients with severe and frequent symptoms. The note defines thresholds for classic, neurogenic, delayed and initial orthostatic hypotension and for postural tachycardia syndrome (see thresholds). Vasovagal syncope is described as caused by an autonomic reflex — withdrawal of sympathetic vascular tone and vagal activation — provoked by prolonged standing or by specific situational stimuli (venepuncture, the sight of blood), and typically preceded by pallor, sweating, nausea, abdominal discomfort, yawning, sighing and hyperventilation, which may occur up to 60 seconds before loss of consciousness.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobny hemodynamiczny zawrót/oszołomienie ortostatyczne", nazwaEn: "Probable hemodynamic orthostatic dizziness/vertigo",
        wymagane: "wszystkie A–C. Różnica wobec postaci pewnej sprowadza się WYŁĄCZNIE do kryterium B",
        punkty: [
          { litera: "A", pl: "Pięć lub więcej epizodów oszołomienia, niestabilności albo zawrotu wywołanych wstawaniem — to jest zmianą pozycji ciała z leżącej do siedzącej lub stojącej albo z siedzącej do stojącej — ALBO obecnych w trakcie pozycji pionowej, które ustępują po siadzie lub położeniu się. Brzmienie identyczne jak w postaci pewnej; tu jednak przy kryterium A NIE ma odsyłaczy do not 1 i 2.", en: "Arising — a change of body posture, lying to sitting or standing, or sitting to standing — triggers dizziness, unsteadiness or vertigo; OR the symptom is present during the upright position and subsides on sitting or lying down. Five or more such episodes are required. The wording is identical to the definite form; here, however, criterion A carries no references to notes 1 and 2." },
          { litera: "B", pl: "Co najmniej JEDEN z następujących objawów towarzyszących: uogólnione osłabienie albo zmęczenie; trudność w myśleniu lub koncentracji; zamazane widzenie; tachykardia albo kołatanie serca. Lista jest ZAMKNIĘTA i liczy cztery pozycje.", en: "At least ONE of the following accompanying symptoms: generalised weakness or tiredness; difficulty in thinking or concentrating; blurred vision; tachycardia or palpitations. The list is CLOSED and holds four items." },
          { litera: "C", pl: "Obraz nie jest lepiej wyjaśniony inną chorobą lub zaburzeniem.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Nota 4 (do B) — uzasadnienie istnienia postaci prawdopodobnej: kryteria mają dać się zastosować u chorych z oszołomieniem w ortostazie, ale BEZ dowodu na hipotonię ortostatyczną albo zespół tachykardii posturalnej. Nawet w dobrze zdefiniowanej grupie chorych z objawami ortostatycznymi i UDOKUMENTOWANĄ hipotonią jej powtarzalność w teście pochyleniowym jest stosunkowo niska — dlatego inne objawy pomagają w rozpoznaniu tam, gdzie pomiaru nie da się uzyskać.",
          "Nota 4, charakterystyka objawów z listy: poza oszołomieniem, niestabilnością i zawrotem najczęstsze objawy ortostatyczne to osłabienie, zaburzenia poznawcze i zamazane widzenie. Osłabienie dotyczy zwykle nóg albo ma wzorzec rozlany. Trudności poznawcze są nasilone u chorych starszych. Zamazane widzenie, a niekiedy widzenie tunelowe, to również dobrze rozpoznana skarga.",
          "Nota 4 opisuje ponadto dyskomfort głowy i szyi typu wieszaka na płaszcz — zlokalizowany w potylicy, karku i barkach, zgłaszany przez chorych z niewydolnością autonomiczną częściej niż przez kontrole. UWAGA: nie jest on jednym z czterech objawów kryterium B.",
          "Nota 4 podaje odsetki czynników nasilających objawy (patrz progi): wysiłek fizyczny lub ćwiczenia, ocieplenie środowiska, nasilenie poposiłkowe oraz nasilenie w określonych okresach cyklu miesiączkowego.",
        ],
        przypisyEn: [
          "Note 4 (to B) — the rationale for a probable form: the criteria are meant to apply to patients with dizziness on standing but WITHOUT documented orthostatic hypotension or postural tachycardia syndrome. Reproducibility on tilt testing stays relatively low even among a well-defined group whose patients have orthostatic symptoms together with DOCUMENTED hypotension — which is why other symptoms help when the measurement cannot be obtained.",
          "Note 4, on the symptoms in the list: apart from dizziness, unsteadiness and vertigo, the commonest orthostatic symptoms are weakness, cognitive difficulty and blurred vision. Weakness usually affects the legs or follows a diffuse pattern. Cognitive difficulty is more pronounced in older patients. Blurred vision, and sometimes tunnel vision, is likewise a well-recognised complaint.",
          "Note 4 also describes coat-hanger discomfort of the head and neck — localised to the occiput, neck and shoulders and reported more often by patients with autonomic failure than by controls. NOTE: it is not one of the four symptoms of criterion B.",
          "Note 4 gives percentages for factors that aggravate the symptoms (see thresholds): physical exertion or exercise, environmental warming, postprandial aggravation, and aggravation during particular parts of the menstrual cycle.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "≥ 5", wielkoscPl: "liczba epizodów", wielkoscEn: "number of episodes", kontekstPl: "kryterium A OBU postaci — pewnej i prawdopodobnej", kontekstEn: "criterion A of BOTH forms — definite and probable" },
      { ranga: "nota", wartosc: "utrzymujący się spadek: skurczowe o co najmniej 20 mmHg lub rozkurczowe o 10 mmHg, w ciągu 3 minut od pionizacji albo w teście pochyleniowym", wielkoscPl: "hipotonia ortostatyczna klasyczna — definicja z noty 3, czyli z przypisu do samego kryterium B", wielkoscEn: "classic orthostatic hypotension — definition from note 3, the note attached to criterion B itself", kontekstPl: "nota 3 do kryterium B postaci pewnej", kontekstEn: "note 3 to criterion B, definite form" },
      { ranga: "nota", wartosc: "utrzymujący się spadek: skurczowe ≥ 20 mmHg lub rozkurczowe ≥ 10 mmHg, PÓŹNIEJ niż 3 minuty po pionizacji albo teście pochyleniowym", wielkoscPl: "opóźniona hipotonia ortostatyczna", wielkoscEn: "delayed orthostatic hypotension", kontekstPl: "nota 3 — praca dodaje, że wiąże się z łagodniejszymi nieprawidłowościami funkcji adrenergicznej i jest CZĘSTĄ przyczyną oszołomienia ortostatycznego", kontekstEn: "note 3 — the paper adds that it is associated with milder adrenergic abnormalities and is a FREQUENT cause of orthostatic dizziness" },
      { ranga: "nota", wartosc: "PRZEMIJAJĄCY spadek: skurczowe > 40 mmHg lub rozkurczowe > 20 mmHg, w ciągu 15 sekund od wstania", wielkoscPl: "początkowa hipotonia ortostatyczna", wielkoscEn: "initial orthostatic hypotension", kontekstPl: "nota 3 — praca nazywa ją możliwą częstą, ale nierozpoznawaną przyczyną omdlenia", kontekstEn: "note 3 — the paper calls it a possibly common but under-recognised cause of syncope" },
      { ranga: "nota", wartosc: "utrzymujący się wzrost tętna o co najmniej 30 uderzeń/min LUB tętno 120 uderzeń/min lub więcej, w ciągu 10 minut od pionizacji albo w teście pochyleniowym, PRZY NIEOBECNOŚCI hipotonii ortostatycznej", wielkoscPl: "zespół tachykardii posturalnej", wielkoscEn: "postural tachycardia syndrome", kontekstPl: "nota 3 — warunek nieobecności hipotonii jest częścią definicji", kontekstEn: "note 3 — the absence-of-hypotension condition is part of the definition" },
      { ranga: "nota", wartosc: "40 uderzeń/min", wielkoscPl: "zespół tachykardii posturalnej — minimalny wymagany przyrost tętna w wieku 12–19 lat", wielkoscEn: "postural tachycardia syndrome — minimum required heart-rate increment for ages 12–19", kontekstPl: "nota 3 — próg podniesiony wobec dorosłych", kontekstEn: "note 3 — a threshold raised relative to adults" },
      { ranga: "nota", wartosc: "wynik ujemny około 95%, wynik dodatni około 50%", wielkoscPl: "powtarzalność testu pochyleniowego", wielkoscEn: "reproducibility of the tilt test", kontekstPl: "nota 3 — wyniki testu zwykle NIE korelują dobrze z objawami ortostatycznymi; odsetek wyników dodatnich rośnie u chorych z ciężkimi i częstymi objawami", kontekstEn: "note 3 — test results usually do NOT correlate well with orthostatic symptoms; the share of positive results rises in patients with severe and frequent symptoms" },
      { ranga: "kryterium", wartosc: "co najmniej 1", wielkoscPl: "liczba wymaganych objawów towarzyszących z zamkniętej listy czterech", wielkoscEn: "number of required accompanying symptoms from a closed list of four", kontekstPl: "kryterium B postaci prawdopodobnej", kontekstEn: "criterion B, probable form" },
    ],
    granicePl: [
      "Kryteria NIE stawiają żadnego progu czasu trwania epizodu. Nota 2 mówi wprost, że czas trwania jest zmienny; wszystkie podane zakresy (sekundy do kilku minut, sekundy w postaci początkowej, cały czas pionizacji w zespole tachykardii posturalnej) są OPISEM, nie progiem.",
      "Kryteria NIE wymagają, by objawy nie występowały przy kładzeniu się. Pytanie o kładzenie się i obracanie w łóżku stoi w NOCIE 1 jako narzędzie rozróżnienia z zawrotem pozycyjnym, a nie jako warunek wykluczający. UZUPEŁNIENIE, którego nie wolno pominąć: sekcja Terminologia dokłada osobne zastrzeżenie na poziomie samego TERMINU — jeżeli objawy zaczynają się w pozycji leżącej, nazwa „zawrót/oszołomienie ortostatyczne” nie jest właściwa. To zastrzeżenie stoi POZA kryteriami i praca go z nimi nie zszywa.",
      "Praca jest WEWNĘTRZNIE NIESPÓJNA w definicji hipotonii ortostatycznej: sekcja Terminologia używa ostrych nierówności (skurczowe > 20 mmHg i/lub rozkurczowe > 10 mmHg), a nota 3 formuły „co najmniej”. Kodując próg, trzeba wybrać jedną wersję i tę niespójność odnotować; nota 3 jest przypisem do samego kryterium B, więc ma pierwszeństwo.",
      "JEDYNY nakaz badania w całej pracy jest taki: testy pozycyjne w kierunku BPPV powinny być wykonane u chorych z zawrotem lub oszołomieniem ortostatycznym NAWET wtedy, gdy ich oszołomienie nie jest pozycyjne.",
      "Kryteria celowo obejmują WYŁĄCZNIE ortostatyczny zawrót i oszołomienie pochodzenia hemodynamicznego. Dosłownie rozumiane „oszołomienie ortostatyczne” obejmowałoby także obustronną westybulopatię, drżenie ortostatyczne, neuropatię obwodową i inne jawne lub subkliniczne zaburzenia chodu — i te przyczyny do tej jednostki NIE należą.",
      "Dyskomfort typu wieszaka na płaszcz, mimo że opisany w nocie 4 jako typowy dla niewydolności autonomicznej, NIE jest jednym z czterech objawów kryterium B postaci prawdopodobnej. Lista jest zamknięta.",
    ],
    graniceEn: [
      "The criteria set NO threshold for episode duration. Note 2 states outright that duration is variable; every range given (seconds to a few minutes, seconds in the initial form, the whole of the upright period in postural tachycardia syndrome) is DESCRIPTIVE, not a threshold.",
      "The criteria do NOT require that symptoms be absent on lying down. The question about lying down and turning over in bed sits in NOTE 1 as a tool for separating this from positional vertigo, not as an exclusion condition. A COMPLEMENT that must not be dropped: the Terminology section adds a separate caveat at the level of the TERM itself — if the symptoms begin while the patient is supine, the label 'orthostatic dizziness/vertigo' is not appropriate. That caveat stands OUTSIDE the criteria and the paper does not stitch the two together.",
      "The paper is INTERNALLY INCONSISTENT on the definition of orthostatic hypotension: the Terminology section uses strict inequalities (systolic > 20 mmHg and/or diastolic > 10 mmHg), while note 3 uses 'at least'. Anyone coding the threshold must pick one version and record the inconsistency; note 3 is the note attached to criterion B itself and therefore takes precedence.",
      "The ONLY test instruction in the whole paper is this: positional testing for BPPV should be performed in patients with orthostatic vertigo or dizziness EVEN when their dizziness is not positional.",
      "The criteria deliberately cover ONLY orthostatic vertigo and dizziness of haemodynamic origin. Read literally, 'orthostatic dizziness' would also cover bilateral vestibulopathy, orthostatic tremor, peripheral neuropathy and other overt or subclinical gait disorders — and those causes do NOT belong to this entity.",
      "Coat-hanger discomfort, although described in note 4 as typical of autonomic failure, is NOT one of the four symptoms of criterion B of the probable form. The list is closed.",
    ],
  },
  {
    klucz: "migrenaDziecieca",
    zrodlo: "[H55] van de Berg 2021",
    typ: "jednostka",
    nazwaPl: "Migrena przedsionkowa wieku dziecięcego i nawracający zawrót wieku dziecięcego",
    nazwaEn: "Vestibular migraine of childhood and recurrent vertigo of childhood",
    zespol: "EVS",
    wSilniku: "poza-zakresem",
    wSilnikuDowod: "grep -rniE '\\bdzieck|\\bdzieci\\b|dziecię|childhood|pediatr|paediatr|\\bVMC\\b|BPVC' src/ = 2 trafienia, oba FAŁSZYWIE DODATNIE: src/render/svg-screens.js:1515 i :3797 — słowo 'dziecko' w znaczeniu elementu podrzędnego w drzewie SVG. Dla kontrastu 'migren' w src/ = 34 trafienia (dorosła karta migreny przedsionkowej [H46] istnieje, m.in. src/app/actions.js:102 'vmi', src/app/state.js:38 'hintsVmCrit'), ale ŻADNE nie rozgałęzia się na wiek < 18 lat. Pomiar z 2026-08-22 na worktree atlas-otoneurologiczny; wcześniejszy zapis mówił o 32 trafieniach.",
    streszczeniePl: "Wspólny dokument komitetu klasyfikacji Bárány Society i podgrupy klasyfikacji migreny International Headache Society opisuje SPEKTRUM trzech jednostek nawracającego zawrotu u osób poniżej 18. roku życia, w którym składowa migrenowa słabnie od pewnej, przez prawdopodobną, po możliwie nieobecną: migrena przedsionkowa wieku dziecięcego, jej postać prawdopodobna oraz nawracający zawrót wieku dziecięcego. O przynależności rozstrzyga to, ile kryteriów migrenowych (wywiad migrenowy i cechy migrenowe w napadach) jest spełnionych, oraz liczba i czas trwania epizodów. Trzecia jednostka jest jawnie rezydualna: komitet sam mówi, że nie jest ona jednorodna, lecz mieszaniną wyłaniających się obrazów.",
    streszczenieEn: "A joint document of the Bárány Society classification committee and the migraine classification subgroup of the International Headache Society describes a SPECTRUM of three entities of recurrent vertigo in people under 18, in which the migraine component fades away in steps — definite, then probable, then possibly not there at all: vestibular migraine of childhood, its probable form, and recurrent vertigo of childhood. Placement depends on how many of the migraine criteria (a migraine history and migraine features during attacks) are met, together with the number and duration of episodes. The third entity is openly residual: the committee itself states it is not homogeneous but a mixture of emerging pictures.",
    synonimy: [
      { pl: "łagodny napadowy zawrót wieku dziecięcego (BPVC)", en: "benign paroxysmal vertigo of childhood (BPVC)", odradzany: true, uwagaPl: "Praca zastępuje ten termin nawracającym zawrotem wieku dziecięcego i podaje trzy powody. Po pierwsze, w ICVD określenie „napadowy” jest zarezerwowane dla napadów przedsionkowych trwających poniżej jednej minuty, co kłóci się z użyciem w BPVC. Po drugie, definicja BPVC nie wymaga żadnych cech migrenowych, a mimo to zakłada się, że jest to prekursor migreny — podczas gdy badania obserwacyjne pokazały, że migrenę rozwija zmienny odsetek dzieci, zdecydowanie nie wszystkie. Po trzecie, w przeszłości proponowano kilka różnych zestawów cech klinicznych dla BPVC, co utrudnia łączenie wyników badań.", uwagaEn: "The document replaces this term with recurrent vertigo of childhood and gives three reasons. First, in the ICVD 'paroxysmal' is reserved for vestibular spells lasting under one minute, which is at odds with its use in BPVC. Second, the BPVC definition requires no migraine features at all, yet the condition is assumed to be a migraine precursor — whereas observational studies show that a variable proportion of children, decidedly not all, go on to develop migraine. Third, several different sets of clinical features have been proposed for BPVC over the years, which hampers pooling of study results." },
      { pl: "migrena przedsionkowa u dziecka (kryteria dla dorosłych zastosowane u dziecka)", en: "vestibular migraine in a child (adult criteria applied to a child)", odradzany: true, uwagaPl: "Praca odnotowuje, że kryteria migreny przedsionkowej dla dorosłych nie zawierają ograniczenia wiekowego i MOGĄ być stosowane u dzieci, ale NIE ZOSTAŁY dla nich zwalidowane; dlatego podkomitet zbudował osobny zestaw dziecięcy. Traktowanie obu jako tego samego zaciera różnicę progu (3 zamiast 5 epizodów w postaci prawdopodobnej) i gubi trzecią jednostkę.", uwagaEn: "The document notes that adult vestibular migraine criteria contain no age limit and MAY be applied to children, but have NOT been validated in them; hence the subcommittee built a separate paediatric set. Treating the two as identical blurs the threshold difference (3 rather than 5 episodes for the probable form) and loses the third entity altogether." },
    ],
    kryteria: [
      {
        postac: "migrena przedsionkowa wieku dziecięcego (VMC)",
        nazwaPl: "Migrena przedsionkowa wieku dziecięcego — kryteria A–E", nazwaEn: "Vestibular migraine of childhood — criteria A–E",
        wymagane: "wszystkie A–E",
        punkty: [
          { litera: "A", pl: "Co najmniej PIĘĆ epizodów z objawami przedsionkowymi o nasileniu umiarkowanym lub ciężkim, trwających od pięciu minut do 72 godzin.", en: "FIVE or more episodes carrying vestibular symptoms of moderate or severe intensity, each lasting between five minutes and 72 hours." },
          { litera: "B", pl: "Migrena z aurą lub bez aury — obecnie albo w przeszłości (wywiad życiowy).", en: "Migraine with or without aura, either now or at some point in the past." },
          { litera: "C", pl: "Co najmniej POŁOWA epizodów jest skojarzona z co najmniej JEDNĄ z trzech cech migrenowych: C.1 ból głowy mający co najmniej DWIE z czterech cech (lokalizacja jednostronna; charakter pulsujący; nasilenie umiarkowane lub ciężkie; nasilanie się przy rutynowej aktywności fizycznej); C.2 światłowstręt ORAZ fonofobia (obie razem, jako jedna cecha); C.3 aura wzrokowa.", en: "HALF or more of the episodes carry at least ONE of three migraine features: C.1 a headache showing at least TWO of four characteristics (one-sided location; pulsating quality; moderate or severe pain intensity; worsened by routine physical activity); C.2 photophobia AND phonophobia, the pair counting as a single feature; C.3 visual aura." },
          { litera: "D", pl: "Wiek poniżej 18 lat.", en: "Age under 18 years." },
          { litera: "E", pl: "Nielepiej wyjaśnione przez inne zaburzenie bólu głowy, inne zaburzenie przedsionkowe ani inny stan.", en: "No other headache disorder, vestibular disorder or other condition accounts for the picture better." },
        ],
        przypisyPl: [
          "Nota o rozpoznawaniu objawów u dziecka: dzieci jeszcze bardziej niż dorośli nie zawsze potrafią precyzyjnie opisać objawy przedsionkowe. Dopuszczalną postacią zgłoszenia jest zgłaszany zawrót wirowy, zgłaszane zawroty niewirowe ALBO obserwacja rodzicielska nawracających napadów przebiegających z niestabilnością. Objawy występują spontanicznie i bez utraty przytomności; mogą im towarzyszyć nudności, wymioty i bladość.",
          "Nota o katalogu objawów przedsionkowych: liczą się zawrót spontaniczny (wewnętrzny — fałszywe wrażenie ruchu własnego, albo zewnętrzny — fałszywe wrażenie wirowania lub płynięcia otoczenia wzrokowego), zawrót pozycyjny po zmianie pozycji głowy, zawrót wywołany wzrokowo, zawrót wywołany ruchem głowy oraz dizziness wywołane ruchem głowy z nudnościami.",
          "Nota o nasileniu — skala jest DWUSTOPNIOWA: nasilenie umiarkowane oznacza, że objawy zakłócają codzienne czynności, ale ich nie uniemożliwiają; ciężkie — że uniemożliwiają ich kontynuowanie. Epizody łagodne nie liczą się do progu liczby epizodów.",
          "Komentarz o bólu jednostronnym: dzieci i młodzież częściej niż dorośli mają migrenowy ból głowy OBUSTRONNY, a ból jednostronny pojawia się zwykle dopiero w późnym okresie dojrzewania lub wczesnej dorosłości. Podkomitet mimo to zostawił tę cechę w kryteriach, uzasadniając to tak: czułość i swoistość tej cechy dla tych jednostek pozostają nieokreślone, a jej usunięcie prowadziłoby prawdopodobnie tylko do utraty czułości, bez zwiększenia swoistości.",
        ],
        przypisyEn: [
          "Note on recognising symptoms in a child: children, even more than adults, cannot always describe vestibular symptoms precisely. Acceptable forms of report are reported spinning vertigo, reported dizziness, OR parental observation of recurrent attacks with imbalance. The symptoms arise spontaneously and with consciousness preserved; nausea, vomiting and pallor may accompany them.",
          "Note on the catalogue of vestibular symptoms: what counts is spontaneous vertigo (internal — a false sensation of self-motion, or external — a false sensation of the visual surround spinning or flowing), positional vertigo after a change of head position, visually induced vertigo, vertigo induced by head motion, and head-motion-induced dizziness accompanied by nausea.",
          "Note on severity — the scale is TWO-STEP: moderate intensity means the symptoms interfere with daily activities but do not prevent them; severe means they prevent daily activities from continuing. Mild episodes do not count towards the episode threshold.",
          "Comment on one-sided pain: children and adolescents more often than adults have BILATERAL migraine headache, and one-sided pain usually appears only in late adolescence or early adulthood. The subcommittee nonetheless kept the feature in the criteria, reasoning that its sensitivity and specificity for these entities remain undetermined and that removing it would probably only cost sensitivity without gaining specificity.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobna migrena przedsionkowa wieku dziecięcego — kryteria A–D", nazwaEn: "Probable vestibular migraine of childhood — criteria A–D",
        wymagane: "wszystkie A–D",
        punkty: [
          { litera: "A", pl: "Co najmniej TRZY epizody z objawami przedsionkowymi o nasileniu umiarkowanym lub ciężkim, trwające od pięciu minut do 72 godzin.", en: "THREE or more episodes carrying vestibular symptoms of moderate or severe intensity, each lasting between five minutes and 72 hours." },
          { litera: "B", pl: "Spełnione jest DOKŁADNIE JEDNO z kryteriów B i C migreny przedsionkowej wieku dziecięcego — jedno z nich, a nie oba. UWAGA: abstrakt tej samej pracy stawia to jako dolną granicę, nie górną — epizodom ma towarzyszyć kryterium B albo C, co najmniej jedno z dwóch. Te dwa odczytania rozstrzygają inaczej przypadek dziecka, które ma 3–4 epizody i spełnia OBA kryteria; praca nie mówi, które odczytanie jest wiążące.", en: "Exactly ONE of criteria B and C of vestibular migraine of childhood is satisfied — one of them, and not both. NOTE: the abstract of the same paper phrases this as a floor rather than a ceiling — the episodes are to be accompanied by criterion B or C, at minimum one of the two. The two readings part company over a child with 3–4 episodes who satisfies BOTH criteria; the document never says which reading governs." },
          { litera: "C", pl: "Wiek poniżej 18 lat.", en: "Age under 18 years." },
          { litera: "D", pl: "Nielepiej wyjaśnione przez inne zaburzenie bólu głowy, inne zaburzenie przedsionkowe ani inny stan.", en: "No other headache disorder, vestibular disorder or other condition accounts for the picture better." },
        ],
        przypisyPl: [
          "Komentarz: minimalną liczbę epizodów dla postaci prawdopodobnej zredukowano do trzech, wobec pięciu wymaganych w prawdopodobnej migrenie przedsionkowej u dorosłych. Uzasadnienie to konsensus podkomitetu, że dzieci i rodzice zwykle szukają pomocy medycznej po mniejszej liczbie napadów.",
          "Komentarz: postać prawdopodobna może z czasem ewoluować w pełną migrenę przedsionkową wieku dziecięcego — rozdzielenie populacji wzdłuż spektrum ma właśnie ułatwiać śledzenie takich przejść.",
        ],
        przypisyEn: [
          "Comment: the minimum episode count for the probable form was reduced to three, against the five required for probable vestibular migraine in adults. The stated reason is the subcommittee's consensus that children, and their parents, tend to present for medical help after fewer attacks.",
          "Comment: the probable form may evolve over time into full vestibular migraine of childhood — separating populations along the spectrum is meant to make such transitions traceable.",
        ],
      },
      {
        postac: "nawracający zawrót wieku dziecięcego (RVC)",
        nazwaPl: "Nawracający zawrót wieku dziecięcego — kryteria A–D", nazwaEn: "Recurrent vertigo of childhood — criteria A–D",
        wymagane: "wszystkie A–D",
        punkty: [
          { litera: "A", pl: "Co najmniej TRZY epizody z objawami przedsionkowymi o nasileniu umiarkowanym lub ciężkim, trwające od 1 minuty do 72 godzin.", en: "THREE or more episodes carrying vestibular symptoms of moderate or severe intensity, each lasting between 1 minute and 72 hours." },
          { litera: "B", pl: "ŻADNE z kryteriów B i C migreny przedsionkowej wieku dziecięcego.", en: "NEITHER criterion B nor criterion C of vestibular migraine of childhood is satisfied." },
          { litera: "C", pl: "Wiek poniżej 18 lat.", en: "Age under 18 years." },
          { litera: "D", pl: "Nielepiej wyjaśnione przez inne zaburzenie bólu głowy, inne zaburzenie przedsionkowe ani inny stan.", en: "No other headache disorder, vestibular disorder or other condition accounts for the picture better." },
        ],
        przypisyPl: [
          "Komentarz o czasie trwania: minimum skrócono z pięciu minut do jednej minuty na podstawie obserwacji klinicznych członków podkomitetu, a nie danych z piśmiennictwa. Maksimum utrzymano na 72 godzinach, mimo że doświadczenie kliniczne sugeruje, iż objawy trwają zwykle znacznie krócej; w piśmiennictwie brakuje wystarczających danych o czasie trwania.",
          "Komentarz o jednorodności: podkomitet JAWNIE deklaruje, że ta jednostka nie jest jednorodna, lecz mieszaniną różnych, wyłaniających się obrazów, których dostępne dane nie pozwalają jeszcze precyzyjniej zdefiniować.",
          "Sugerowane — ale NIE zdefiniowane — podtypy, wyprowadzone z obserwacji klinicznych: postać z niektórymi cechami migrenowymi, lecz niewystarczającymi do spełnienia kryteriów wyższych jednostek; postać bez żadnych cech migrenowych, występująca przeważnie u dzieci poniżej 10. roku życia, z krótkimi napadami zawrotu poniżej pięciu minut, ustępująca samoistnie po tygodniach lub miesiącach; oraz podgrupa mogąca wiązać się z osłabieniem wergencji ocznej.",
          "Zalecany zestaw danych do zbierania w przyszłych badaniach: wiek początku i wiek ustąpienia objawów, czas trwania i rodzaj objawów, wszystkie cechy migrenowe obecne w dzieciństwie i ewentualnie później, wywiad rodzinny oraz subtelne nieprawidłowości w badaniu klinicznym, na przykład w widzeniu obuocznym. To zestaw badawczy, NIE kryteria.",
        ],
        przypisyEn: [
          "Comment on duration: the minimum was shortened from five minutes to one minute on the basis of subcommittee members' clinical observations rather than published data. The maximum was kept at 72 hours even though clinical experience suggests symptoms usually last much less; the literature lacks sufficient duration data.",
          "Comment on homogeneity: the subcommittee states OPENLY that this entity is not homogeneous but a mixture of different, emerging pictures that the available data cannot yet define more precisely.",
          "Suggested — but NOT defined — subtypes drawn from clinical observation: a form with some migraine features that fall short of the higher entities' criteria; a form with no migraine features at all, occurring predominantly in children under 10, with short vertigo attacks under five minutes, resolving spontaneously after weeks or months; and a subgroup that might relate to weakness of ocular vergence.",
          "Recommended data set for future research: age at onset and at resolution; how long the symptoms last and of what kind; every migraine feature seen in childhood and possibly later in life; the family history; and subtle findings on clinical examination — binocular vision, for instance. This is a research data set, NOT criteria.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "≥ 5 dla postaci pełnej; ≥ 3 dla postaci prawdopodobnej; ≥ 3 dla nawracającego zawrotu wieku dziecięcego", wielkoscPl: "minimalna liczba epizodów", wielkoscEn: "minimum number of episodes", kontekstPl: "kryterium A w każdym z trzech zestawów", kontekstEn: "criterion A in each of the three sets" },
      { ranga: "kryterium", wartosc: "5 minut – 72 godziny (postać pełna i prawdopodobna); 1 minuta – 72 godziny (nawracający zawrót wieku dziecięcego)", wielkoscPl: "czas trwania epizodu", wielkoscEn: "episode duration", kontekstPl: "kryterium A; dolna granica to jedyna różnica czasowa między jednostkami spektrum", kontekstEn: "criterion A; the lower bound is the only temporal difference between the entities of the spectrum" },
      { ranga: "kryterium", wartosc: "co najmniej połowa epizodów, z co najmniej jedną z trzech cech", wielkoscPl: "udział epizodów z cechą migrenową", wielkoscEn: "share of episodes carrying a migraine feature", kontekstPl: "kryterium C postaci pełnej", kontekstEn: "criterion C of the full form" },
      { ranga: "kryterium", wartosc: "co najmniej 2 z 4", wielkoscPl: "liczba cech bólu głowy wymagana w cesze C.1", wielkoscEn: "number of headache characteristics required within feature C.1", kontekstPl: "kryterium C.1 postaci pełnej", kontekstEn: "criterion C.1 of the full form" },
      { ranga: "kryterium", wartosc: "< 18 lat", wielkoscPl: "granica wieku", wielkoscEn: "age limit", kontekstPl: "twarde kryterium we wszystkich trzech zestawach; kryteria migreny przedsionkowej dla dorosłych żadnego limitu wieku nie zawierają", kontekstEn: "a hard criterion in all three sets; the adult vestibular migraine criteria contain no age limit at all" },
    ],
    granicePl: [
      "SPRZECZNOŚĆ WEWNĄTRZ PRACY, której nie wolno cicho naprawiać: sekcja kryteriów wymaga dla postaci prawdopodobnej „tylko jednego” z kryteriów B i C, a abstrakt tej samej pracy mówi o „co najmniej” kryterium B albo C. Przy dosłownym czytaniu sekcji kryteriów podział trzech jednostek NIE JEST wyczerpujący: dziecko z 3 lub 4 epizodami spełniające OBA kryteria nie mieści się w żadnej z nich. Praca nie rozstrzyga, która wersja obowiązuje.",
      "Kryteria (same sekcje kryteriów) nie zawierają ANI JEDNEGO badania instrumentalnego. Co więcej, praca WPROST usuwa wymóg obecny we wcześniejszych kryteriach BPVC — prawidłowe badanie neurologiczne, audiometrię, badanie funkcji przedsionkowej i EEG — uzasadniając to tym, że oczopląs, fluktuujący niedosłuch i niedoczynność przedsionka mogą wystąpić także w migrenie przedsionkowej. Nie wolno tej pracy przypisać zdania, że rozpoznanie wymaga prawidłowego badania międzynapadowego.",
      "Zalecenia badań, które w pracy są — dokładne badanie kliniczne równowagi i ruchów gałek ocznych wraz z testem pchnięcia głową i badaniem wergencji, a przy nieprawidłowościach dalsza ocena neurookulistyczna w celu wykluczenia wad refrakcji i patologii okoruchowych, na przykład niewydolności konwergencji — żyją WYŁĄCZNIE w komentarzu i mają status zalecenia klinicznego, nie kryterium.",
      "W cesze C.2 są wyłącznie światłowstręt i fonofobia, połączone spójnikiem „i”; osmofobia nie występuje w pracy w ogóle. W cesze C.3 dopuszczona jest WYŁĄCZNIE aura wzrokowa.",
      "Czułość i swoistość cechy „ból jednostronny” dla tych jednostek praca określa jako NIEOKREŚLONE — i mimo to zostawia tę cechę w kryteriach, świadomie wybierając czułość.",
      "Praca nie wspomina ani o chorobie lokomocyjnej, ani o zespole cyklicznych wymiotów, ani o migrenie brzusznej, ani o łagodnym napadowym kręczu szyi, ani o migrenie z aurą pnia mózgu — żaden z tych terminów nie występuje w tekście.",
    ],
    graniceEn: [
      "AN INTERNAL CONTRADICTION that must not be quietly repaired: the criteria section requires, for the probable form, 'only one' of criteria B and C, while the abstract of the same paper speaks of 'at least' criterion B or C. Read literally from the criteria section, the three-entity split is NOT exhaustive: a child with 3 or 4 episodes who meets BOTH criteria fits none of them. The document does not say which version governs.",
      "The criteria sections themselves contain NOT ONE instrumental test. More than that, the document EXPLICITLY drops the requirement present in the earlier BPVC criteria — a normal neurological examination, audiometry, vestibular function testing and EEG — reasoning that nystagmus, vestibular hypofunction and fluctuating hearing loss can occur in vestibular migraine too. It must not be credited with the sentence that diagnosis requires a normal interictal examination.",
      "The testing recommendations the document does make — a thorough clinical examination of eye movements and balance, the head impulse test and vergence testing included, and, if abnormalities appear, further neuro-ophthalmological assessment to exclude refractive errors and ocular motor pathology such as convergence insufficiency — live ONLY in the commentary and carry the status of clinical advice, not criteria.",
      "Feature C.2 contains photophobia and phonophobia only, joined by 'and'; osmophobia does not appear in the document at all. Feature C.3 admits VISUAL aura only.",
      "The sensitivity and specificity of the 'one-sided pain' feature for these entities are described as UNDETERMINED — and the feature is kept in the criteria anyway, a deliberate choice in favour of sensitivity.",
      "The document mentions neither motion sickness, nor cyclic vomiting syndrome, nor abdominal migraine, nor benign paroxysmal torticollis, nor migraine with brainstem aura — none of these terms occurs in the text.",
    ],
  },
  {
    klucz: "mdds",
    zrodlo: "[H54] Cha 2020",
    typ: "jednostka",
    nazwaPl: "Zespół choroby zejścia na ląd (MdDS)",
    nazwaEn: "Mal de débarquement syndrome (MdDS)",
    zespol: "wiele",
    wSilniku: "poza-zakresem",
    wSilnikuDowod: "grep -rniE 'mdds|debarquement|debarkacj|zejscia na lad|zejścia na ląd|rocking|bobbing' src/ = 3 trafienia. Dwa FAŁSZYWIE DODATNIE: src/pose/maneuvers.js:1625 i src/render/svg-screens.js:2428 — słowo 'rocking' w opisie manewru Bascule (bujanie bok–bok przy kupulolitiazie). Trzecie jest PRAWDZIWE, ale nie jest modelem: src/app/triage-model.js:379 wymienia klucz 'mdds' na liście atlas: ['pppd','bvp','presbywestybulopatia','mdds'] w węźle kategoria:'CVS' — to ODNOŚNIK do karty atlasu, nie odwzorowanie kryteriów. Silnik nie modeluje ani kryteriów A–E, ani osi D.0/D.1/D.2, stąd 'poza-zakresem'. UWAGA dla bramki źródła:check — ten sam węzeł przypisuje MdDS do CVS, podczas gdy pole 'zespol' tego wpisu ma wartość 'wiele'; spór jest zapisany w tym zdaniu (planowane osobne pole 'sporne' nigdy nie powstało — sprostowanie 2026-08-22, przegląd dokumentacji).",
    streszczeniePl: "MdDS to utrzymujące się wrażenie własnego kołysania, unoszenia się lub chwiania, które zaczyna się dopiero po zakończeniu długiej ekspozycji na ruch bierny — najczęściej po rejsie, locie lub podróży lądowej. Dolegliwość jest obecna stale albo przez większą część dnia, a nie napadowo. Cechą, która najmocniej oddziela ją od innych obrazów przewlekłych, jest odwrócona reakcja na ruch: ponowna ekspozycja na ruch bierny (np. jazda samochodem) objawy przejściowo wycisza. Rozpoznanie opiera się wyłącznie na wywiadzie — praca nie wskazuje żadnego badania potwierdzającego.",
    streszczenieEn: "MdDS is a persistent perception of self-motion — rocking, bobbing or swaying — that begins only after a prolonged exposure to passive motion has ended, most often a sea voyage, a flight or land travel. It is there all the time, or for most of the day, rather than in attacks. What most sharply separates it from other chronic pictures is an inverted response to motion: re-exposure to passive motion, such as driving a car, transiently damps the symptoms. The diagnosis rests on history alone — the document names no confirmatory test.",
    synonimy: [
      { pl: "mal de débarquement (jako nazwa krótkotrwałej niestabilności zaraz po zejściu na ląd)", en: "mal de débarquement (used for the short-lived unsteadiness right after landing)", odradzany: true, uwagaPl: "Praca odnotowuje, że terminu używano wcześniej także dla objawów trwających poniżej 48 godzin, i wprost oddziela ten stan niepatologiczny od zaburzenia MdDS; wskazuje przy tym na różnice demograficzne i rokownicze między nimi.", uwagaEn: "The document notes the term was previously applied to land-sickness lasting under 48 hours, and explicitly separates that non-pathological state from the disorder, pointing to demographic and prognostic differences between them." },
      { pl: "MdDS spontaniczne / atypowe / MdDS-podobne / MdDS niewyzwolone ruchem / mixed-MdDS", en: "spontaneous / aberrant / atypical MdDS, MdDS-like, non motion-triggered MdDS, mixed-MdDS", odradzany: true, uwagaPl: "To nazwy krążące w piśmiennictwie dla obrazu oscylacyjnego BEZ wyzwalacza ruchowego. Praca wylicza je, ale świadomie NIE nadaje tej grupie kryteriów ani miejsca w klasyfikacji: chorzy ci spełniają A, C i D, lecz nie spełniają B. Komitet stwierdza brak danych, by przypisać ich do MdDS, do PPPD, do obu albo do żadnej kategorii.", uwagaEn: "These labels circulate in the literature for an oscillatory picture WITHOUT a motion trigger. The document lists them but deliberately gives the group no criteria and no place in the classification: such patients meet A, C and D but fail B. The committee states there are not enough data to assign them to MdDS, to PPPD, to both, or to neither." },
      { pl: "zawrót niewirowy wewnętrzny po przedłużonej ekspozycji na ruch bierny (kod ICVD 1.2.7 „inne zawroty wyzwalane”)", en: "internal non-spinning vertigo after prolonged passive-motion exposure (ICVD code 1.2.7, 'other triggered vertigo')" },
    ],
    kryteria: [
      {
        postac: "jedyny zestaw kryteriów (praca nie wprowadza stopni pewności)",
        nazwaPl: "MdDS — kryteria A–E", nazwaEn: "MdDS — criteria A–E",
        wymagane: "wszystkie A–E (koniunkcja); punkt D dodatkowo dzieli się na określenia czasowe D.0 / D.1 / D.2, które nie są osobnymi jednostkami",
        punkty: [
          { litera: "A", pl: "Zawroty niewirowe o charakterze percepcji oscylacyjnej — kołysania przód-tył („rocking”), unoszenia i opadania („bobbing”) albo kołysania na boki („swaying”) — obecne stale albo przez większą część dnia.", en: "Non-spinning vertigo felt as an oscillation — a fore-and-aft rock, an up-and-down bob, or a side-to-side sway — there all the time, or for most of the day." },
          { litera: "B", pl: "Początek następuje w ciągu 48 godzin od ZAKOŃCZENIA ekspozycji na ruch bierny.", en: "Onset falls no later than 48 hours after the passive-motion exposure has finished." },
          { litera: "C", pl: "Objawy przejściowo zmniejszają się przy ekspozycji na ruch bierny.", en: "A return to passive motion damps the symptoms for a while." },
          { litera: "D", pl: "Objawy utrzymują się dłużej niż 48 godzin.", en: "The symptoms run on for more than 48 hours." },
          { litera: "D.0", pl: "MdDS w toku: objawy trwają nadal, ale okres obserwacji jest krótszy niż 1 miesiąc.", en: "MdDS in evolution: the symptoms have not stopped, and follow-up so far covers less than 1 month." },
          { litera: "D.1", pl: "MdDS przemijające: objawy ustępują w 1 miesiącu lub wcześniej, a okres obserwacji sięga co najmniej punktu ustąpienia.", en: "Transient MdDS: the symptoms clear at 1 month or sooner, with follow-up reaching at least that point." },
          { litera: "D.2", pl: "MdDS przetrwałe: objawy trwają dłużej niż 1 miesiąc.", en: "Persistent MdDS: the symptoms carry on beyond 1 month." },
          { litera: "E", pl: "Objawów nie tłumaczy lepiej inna choroba ani inne zaburzenie.", en: "No other disease or disorder gives a better account of the symptoms." },
        ],
        przypisyPl: [
          "Nota do A: słowo „oscylacyjny” odnosi się tu do subiektywnej percepcji ruchu, a NIE do przerywanego przebiegu w czasie — praca stawia to zastrzeżenie wprost, by nie mylić obrazu z napadowością. Percepcje bywają mieszane i mogą zmieniać kierunek w czasie; mogą się nakładać wrażenia siły grawitacyjnej działającej na ciało w dowolnym kierunku translacyjnym.",
          "Nota do B: typowe wyzwalacze to statki i łodzie, samoloty, samochody, pociągi, ale też kołyszące się budynki, łóżka wodne i sprzęt do ćwiczeń; możliwa jest ekspozycja sekwencyjna na kilka wyzwalaczy. Kluczowe cechy bodźca to charakter oscylacyjny lub okresowy ORAZ pewien minimalny czas ekspozycji, ogólnie rzędu godzin.",
          "Nota do B: praca odnotowuje brak jak dotąd jasnego doniesienia o przetrwałych oscylacyjnych zawrotach wywołanych rzeczywistością wirtualną; wcześniejsze takie doniesienia opierały się na badaniu, w którym po grze VR utrzymywało się przez mniej niż 25 minut DIZZINESS — praca zaznacza w nawiasie, że NIE był to zawrót w rozumieniu ICVD. Stwierdza, że nie spełniałoby to ani tych kryteriów, ani progu istotności klinicznej. Po locie kosmicznym przetrwałe oscylacyjne zawroty nie są typowym objawem.",
          "Nota do B: jako czynnik ryzyka wskazano stan okołomenopauzalny lub okołomiesiączkowy w czasie ekspozycji; częsty jest równoczesny stresor fizyczny lub psychologiczny w trakcie podróży.",
          "Nota do C: ulgę daje jazda samochodem albo powrót do bodźca wyzwalającego; objawy często wracają („rebound”), gdy bodziec ustaje — praca podaje przykład samochodu zatrzymującego się na światłach. Chód też może ulżyć przejściowo, ale efekt jest zmienny i zależy od tempa oraz odczuwanego rytmu wewnętrznego. U części osób położenie się nasila percepcję ruchu.",
        ],
        przypisyEn: [
          "Note to A: 'oscillatory' here refers to the subjective perception of motion, NOT to an intermittent time course — the document states this explicitly so the picture is not mistaken for paroxysmal disease. Perceptions may be mixed and may change direction over time; a sense of gravitational force acting on the body in any translational direction may be superimposed.",
          "Note to B: typical triggers are ships and boats, aircraft, cars and trains, but also swaying buildings, waterbeds and exercise equipment; sequential exposure to more than one trigger is possible. The key stimulus features are an oscillatory or periodic character AND some minimal exposure duration, generally on the order of hours.",
          "Note to B: the document records that no clear report yet exists of persistent oscillatory vertigo caused by virtual reality; earlier such claims rested on a study in which what persisted after a VR game, for under 25 minutes, was DIZZINESS — the paper marks in parentheses that this was NOT vertigo in the ICVD sense. It states that this would meet neither these criteria nor the threshold of clinical relevance. After spaceflight, persistent oscillatory vertigo is not a typical symptom.",
          "Note to B: hormonal status is named as a risk factor — being peri-menopausal, or in the peri-menstrual phase, when the exposure happens; people who develop MdDS commonly report a physical or psychological stressor running alongside the journey.",
          "Note to C: relief comes from driving in a car or from returning to the triggering stimulus; symptoms frequently rebound once the stimulus stops — the document's example is a car pausing at a traffic light. Walking can relieve the symptoms transiently too, but the effect is variable and depends on pace and on the perceived internal rhythm. In some people lying down increases the motion perception.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "w ciągu 48 h", wielkoscPl: "opóźnienie początku od końca ekspozycji na ruch bierny", wielkoscEn: "onset latency after the end of passive-motion exposure", kontekstPl: "kryterium B", kontekstEn: "criterion B" },
      { ranga: "nota", wartosc: "„rzędu godzin” — bez wartości liczbowej", wielkoscPl: "minimalny czas ekspozycji na bodziec wyzwalający", wielkoscEn: "minimal duration of exposure to the triggering stimulus", kontekstPl: "nota do kryterium B; jedyna ilościowa charakterystyka bodźca w całej pracy", kontekstEn: "note to criterion B; the only quantitative characterisation of the stimulus in the entire document" },
      { ranga: "nota", wartosc: "< 25 min", wielkoscPl: "czas trwania DIZZINESS (nie zawrotu) po grze VR w cytowanym badaniu", wielkoscEn: "duration of DIZZINESS (not vertigo) after a VR game in the cited study", kontekstPl: "nota do kryterium B — praca zaznacza w nawiasie, że chodziło o dizziness, a NIE o zawrót; stwierdza, że nie spełnia to ani jej kryteriów, ani progu istotności klinicznej", kontekstEn: "note to criterion B — the paper marks in parentheses that this was dizziness, NOT vertigo; it states this meets neither its criteria nor the threshold of clinical relevance" },
      { ranga: "kryterium", wartosc: "> 48 h", wielkoscPl: "czas trwania objawów", wielkoscEn: "symptom duration", kontekstPl: "kryterium D", kontekstEn: "criterion D" },
      { ranga: "kryterium", wartosc: "1 miesiąc (obserwacja < 1 mies. → D.0; ustąpienie ≤ 1 mies. → D.1; trwanie > 1 mies. → D.2)", wielkoscPl: "granica określeń czasowych D.0 / D.1 / D.2", wielkoscEn: "boundary for the D.0 / D.1 / D.2 designations", kontekstPl: "punkt D i nota do niego", kontekstEn: "criterion D and its note" },
    ],
    granicePl: [
      "Praca NIE wprowadza stopni pewności rozpoznania: nie ma postaci pewnej, prawdopodobnej ani możliwej (w tekście zero wystąpień słów „definite”, „probable”, „possible”). Jest jeden zestaw A–E plus trójdzielne określenie czasowe D.0/D.1/D.2 — i to nie są stopnie pewności, tylko oś czasu.",
      "Praca nie tylko nie wymaga badań instrumentalnych — ona przed nimi ostrzega: przy typowym początku wydajność badań czynności przedsionkowej i słuchowej jest bardzo niska i może wykoleić trafne rozpoznanie przez wyniki nieswoiste lub fałszywie dodatnie; podobnie niską wydajność ma dostępne klinicznie MRI i CT. Badania uzupełniające dopuszcza tylko przy cechach atypowych: współistniejącym ubytku słuchu, nieprawidłowościach okoruchowych albo deficytach neurologicznych.",
      "W kontekście rozpoznania nie pada nazwa ani jednego testu przedsionkowego (brak vHIT, próby kalorycznej, VEMP, HINTS, Dix-Hallpike'a, testu Roll, posturografii) i ani jeden próg liczbowy dla badania (brak gain, dB, Hz, °/s). Określenia „postural testing” i „gait analysis” pojawiają się WYŁĄCZNIE w sekcji kierunków przyszłych badań, jako propozycje badawcze, nie narzędzia rozpoznania. Jedynym nazwanym zjawiskiem okoruchowym jest zmieniający kierunek STATYCZNY oczopląs pozycyjny w ciemności — opisany jako NIESWOISTY, spotykany także u osób bez MdDS.",
      "BPPV pojawia się w tekście raz i wyłącznie jako przykład jednostki ICVD, której kryteria zawierają zarówno objawy podmiotowe, jak i przedmiotowe. Praca NIE omawia BPPV w różnicowaniu MdDS — mimo że około 1/3 chorych zgłasza nasilenie zawrotów przy położeniu się, co brzmi jak wywiad BPPV.",
      "Grupie z przetrwałym obrazem oscylacyjnym BEZ wyzwalacza ruchowego praca świadomie NIE nadaje kryteriów: spełnia ona A, C i D, lecz nie B, a z PPPD byłaby wykluczona, bo tam ruch ma objawy nasilać. Komitet stwierdza, że nie ma dość danych, by przypisać ją gdziekolwiek — i odnotowuje, że w samym komitecie było poparcie dla przypisania jej do MdDS, do PPPD, do obu i do żadnej kategorii.",
      "Operator progu 48 godzin trzeba czytać z tej pracy, nie z sąsiedniej: kryterium D żąda trwania DŁUŻEJ NIŻ 48 godzin (> 48 h), a [H57] Cha 2021 — streszczając MdDS w nocie do własnego kryterium C — zapisuje ten sam próg jako CO NAJMNIEJ 48 godzin (≥ 48 h). Objawy trwające dokładnie 48 godzin spełniają zapis Cha 2021, a kryterium D tej pracy NIE spełniają. Wiążący jest dokument definiujący jednostkę, czyli ten.",
    ],
    graniceEn: [
      "The document introduces NO certainty grades: there is no definite, probable or possible form (the words 'definite', 'probable' and 'possible' do not occur in the text at all). There is one set A–E plus the three-way temporal designation D.0/D.1/D.2 — and these are a time axis, not degrees of certainty.",
      "Far from requiring instrumental testing, the document warns against it: with a typical onset, testing vestibular and auditory function returns very little and can actively derail a correct diagnosis through non-specific or false-positive results; clinically available MRI and CT are likewise of low yield. Supplementary testing is allowed for atypical features only — hearing loss alongside the symptoms, ocular motor abnormalities, or neurological deficits.",
      "For diagnosis, not one vestibular test is named (no vHIT, caloric, VEMP, HINTS, Dix-Hallpike, roll test, posturography) and not one numeric test threshold appears (no gain, dB, Hz or deg/s). The labels 'postural testing' and 'gait analysis' occur ONLY in the future-directions section, as research proposals rather than diagnostic tools. The one named ocular motor phenomenon is static positional nystagmus that changes direction, observed in darkness — described as NON-SPECIFIC and also seen in people without MdDS.",
      "BPPV appears once in the text, and only as an example of an ICVD entity whose criteria include both symptoms and signs. The document does NOT discuss BPPV in the differential diagnosis of MdDS — even though about 1/3 of patients report worse vertigo on lying down, which sounds like a BPPV history.",
      "The group with a persistent oscillatory picture but NO motion trigger is deliberately left without criteria: it meets A, C and D but not B, and it would be excluded from PPPD, where motion is expected to worsen symptoms. The committee states there are not enough data to place it anywhere — and records that within the committee there was support for assigning it to MdDS, to PPPD, to both, and to neither.",
      "The 48-hour operator must be read off this paper, not off its neighbour: criterion D requires MORE THAN 48 hours (> 48 h), while [H57] Cha 2021 — summarising MdDS in the note to its own criterion C — records the same threshold as AT LEAST 48 hours (≥ 48 h). Symptoms of exactly 48 hours satisfy the Cha 2021 wording and fail criterion D here. The document that defines the entity, this one, is the binding text.",
    ],
  },
  {
    klucz: "chorobaLokomocyjna",
    zrodlo: "[H57] Cha 2021",
    typ: "jednostka",
    nazwaPl: "Choroba lokomocyjna i choroba lokomocyjna wywołana bodźcem wzrokowym (VIMS) oraz ich postaci jako zaburzenie (MSD, VIMSD)",
    nazwaEn: "Motion sickness and visually induced motion sickness (VIMS), with their disorder forms (MSD, VIMSD)",
    zespol: "EVS",
    wSilniku: "poza-zakresem",
    wSilnikuDowod: "grep -rniE 'motion sickness|choroba lokomocyjna|lokomocyjn|kinetoz|VIMS|MSSQ|sopite|cybersick' src/ = 0 trafień (żadnego pliku).",
    streszczeniePl: "Praca rozdziela dwie rzeczy, które w mowie potocznej są jednym: ostry epizod i zaburzenie. Ostry epizod choroby lokomocyjnej (bodziec = ruch fizyczny osoby) albo VIMS (bodziec = ruch wzrokowy) to prawidłowa odpowiedź fizjologiczna, którą da się wywołać u niemal każdego — objawy pojawiają się w trakcie ruchu, narastają wraz z ekspozycją i po jej ustaniu ustępują. Dopiero powtarzalne wyzwalanie tym samym bodźcem, brak habituacji i zmiana zachowania pod dyktando objawów czynią z tego zaburzenie (MSD lub VIMSD). Zestaw pięciu kategorii objawowych sięga daleko poza nudności: obejmuje termoregulację, poziom czuwania, zawroty i objawy głowowo-oczne.",
    streszczenieEn: "The document separates two things that everyday language treats as one: the acute episode and the disorder. An acute episode of motion sickness (stimulus = physical motion of the person) or of VIMS (stimulus = visual motion) is a normal physiological response that can be elicited in almost anyone — signs and symptoms appear during the motion, build as exposure is prolonged, and eventually stop once it ends. Only reliable re-triggering by the same stimulus, absence of habituation, and behaviour reshaped by the symptoms turn this into a disorder (MSD or VIMSD). The five symptom categories reach well beyond nausea: thermoregulation, arousal, dizziness and head/eye symptoms all count.",
    synonimy: [
      { pl: "kinetoza, choroba morska, choroba powietrzna, choroba samochodowa", en: "sea sickness, air sickness, car sickness" },
      { pl: "cybersickness", en: "cybersickness", odradzany: true, uwagaPl: "W tej pracy cybersickness NIE jest jednostką: słowo pada raz i wyłącznie jako określenie rodzaju badań („badania nad symulatorami lub cybersickness”). Praca nie podaje dla niego definicji ani kryteriów. Jednostką dla bodźca wzrokowego jest tu VIMS/VIMSD.", uwagaEn: "In this document cybersickness is NOT an entity: the word occurs once, only as a label for a kind of research ('simulator or cybersickness studies'). No definition and no criteria are given for it. The visual-stimulus entity here is VIMS/VIMSD." },
      { pl: "zawroty wywołane wzrokowo (VID)", en: "visually induced dizziness (VID)", odradzany: true, uwagaPl: "VID jest w pracy pojęciem rozpoznanym, ale bez zestawu kryteriów, i NIE jest tożsame z VIMS. Zawroty w VIMS są fenomenologicznie nieodróżnialne od VID, lecz różni je dynamika: VID zaczyna się natychmiast z bodźcem wzrokowym, a początek VIMS jest często opóźniony i narasta wraz z przedłużaniem ekspozycji.", uwagaEn: "VID is acknowledged in the document but given no criteria, and it is NOT the same as VIMS. The dizziness of VIMS cannot be told apart phenomenologically from VID, yet the dynamics differ: VID starts immediately with the visual stimulus, whereas VIMS onset is often delayed and builds as exposure is prolonged." },
      { pl: "zespół „sopite”", en: "sopite syndrome" },
    ],
    kryteria: [
      {
        postac: "ostry epizod — choroba lokomocyjna / VIMS",
        nazwaPl: "Ostry epizod choroby lokomocyjnej (bodziec: ruch fizyczny) albo VIMS (bodziec: ruch wzrokowy) — kryteria A–D", nazwaEn: "Acute episode of motion sickness (stimulus: physical motion) or VIMS (stimulus: visual motion) — criteria A–D",
        wymagane: "wszystkie A–D; zestaw jest jeden i ten sam dla obu jednostek, różni je wyłącznie rodzaj bodźca w punkcie A",
        punkty: [
          { litera: "A", pl: "Ruch fizyczny osoby ALBO — w VIMS — ruch wzrokowy wywołuje jeden lub więcej objawów podmiotowych i/lub przedmiotowych z co najmniej JEDNEJ z pięciu kategorii, o nasileniu WIĘKSZYM NIŻ MINIMALNE: A1 nudności i/lub zaburzenie żołądkowo-jelitowe; A2 zaburzenie termoregulacji; A3 zmiany poziomu czuwania; A4 zawroty niewirowe i/lub wirowe; A5 ból głowy i/lub zmęczenie wzroku.", en: "Physical motion of the person — or, in VIMS, visual motion — brings on one or more signs and/or symptoms drawn from at least ONE of these five categories, at a severity above minimal: A1 nausea and/or gastrointestinal disturbance; A2 thermoregulatory disruption; A3 alterations in arousal; A4 dizziness and/or vertigo; A5 headache and/or ocular strain." },
          { litera: "B", pl: "Objawy pojawiają się W TRAKCIE ruchu i narastają w miarę przedłużania ekspozycji.", en: "The signs and symptoms come on WHILE the motion is under way, and intensify the longer the exposure runs." },
          { litera: "C", pl: "Objawy ostatecznie ustępują po zaprzestaniu ruchu.", en: "Once the motion ceases, the signs and symptoms eventually settle." },
          { litera: "D", pl: "Objawów nie tłumaczy lepiej inna choroba ani inne zaburzenie.", en: "No other disease or disorder gives a better account of the signs and symptoms." },
        ],
        przypisyPl: [
          "Zawartość kategorii wg komentarza: A1 obejmuje m.in. parcie na wymioty, wymioty, odruchy wymiotne, dyskomfort i „świadomość” żołądka, zmianę wydzielania śliny i apetytu, odbijanie, parcie na stolec; A2 — pocenie i zimne poty, wilgotną lepką skórę, zaczerwienienie, uczucie gorąca, bladość; A3 — senność, zmęczenie, znużenie, trudność koncentracji; A4 — zawroty niewirowe i wirowe, a także dezorientację, uczucie omdlewania i wzrokowe złudzenia ruchu; A5 — ból głowy, uczucie pełności w głowie, zmęczenie wzroku, trudność ostrego widzenia, nieostre widzenie.",
          "Im więcej objawów, tym większa swoistość przypisania ich chorobie lokomocyjnej — ale kryterium wymaga tylko JEDNEJ kategorii.",
          "Nota do B: objaw natychmiastowy albo maksymalny już w chwili początku ruchu każe podejrzewać co innego — chorobę przedsionkową (przy ruchu fizycznym), oczną lub wzrokowo-przedsionkową (przy ruchu wzrokowym), reakcję lękową albo awersyjną reakcję warunkową. Zastrzeżenie: silny bodziec może wywołać objawy szybko u osób bardzo podatnych.",
          "Nota do C: to jedyne miejsce w pracy z twardym „musi” — początek objawów MUSI wystąpić w trakcie bodźca ruchowego i nie może rozpoczynać się dopiero po jego ustaniu. Tym praca odróżnia chorobę lokomocyjną od zespołu mal de débarquement, który zaczyna się dopiero po ustaniu ruchu i trwa co najmniej 48 godzin. (Uwaga na operator: [H54] Cha 2020, praca definiująca MdDS, stawia własne kryterium D na DŁUŻEJ NIŻ 48 godzin, > 48 h, a nie na co najmniej 48 h.)",
          "Nota do A4: objawów zawrotowych przypisywanych chorobie lokomocyjnej nie powinny tłumaczyć wyłącznie choroby przedsionkowe, zmiany ciśnienia atmosferycznego, hipotonia ortostatyczna ani zjawisko „visual cliffs”. Gdy napad zawrotów prowadzi do objawów nakładających się z chorobą lokomocyjną, uznaje się je za NASTĘPSTWO tego napadu, a nie za odrębny zespół.",
        ],
        przypisyEn: [
          "Category contents per the comments: A1 includes retching and vomiting, gastric discomfort and 'stomach awareness', changes in salivation and appetite, belching and the urge to move the bowels; A2 covers sweating and cold sweats, clammy skin, flushing, feeling hot, and pallor; A3 covers drowsiness, fatigue, weariness and difficulty concentrating; A4 covers non-spinning and spinning vertigo plus disorientation, faintness and visual motion illusions; A5 covers headache, head fullness, eyestrain, difficulty focusing and blurred vision.",
          "The more symptoms present, the greater the specificity of attributing them to motion sickness — but the criterion requires only ONE category.",
          "Note to B: a symptom that is immediate, or maximal at the very onset of motion, should raise suspicion of something else — vestibular disease (with physical motion), ocular or visuo-vestibular disease (with visual motion), an anxiety reaction, or a conditioned aversive response. Caveat: a strong stimulus can produce symptoms quickly in highly susceptible people.",
          "Note to C: this is the only 'must' in the entire document — symptom onset MUST occur during the motion stimulus and must not begin only after it has ended. That is how the document draws the line against mal de débarquement syndrome, which starts only after the motion has stopped and runs at least 48 hours. (Note the operator: [H54] Cha 2020, the paper that defines MdDS, sets its own criterion D at MORE THAN 48 hours, > 48 h, not at least 48 h.)",
          "Note to A4: dizziness attributed to motion sickness should not be explicable solely by vestibular disease, atmospheric pressure changes, postural hypotension or 'visual cliffs'. When a vertigo attack leads to symptoms overlapping with motion sickness, these count as SEQUELAE of that attack rather than a separate motion sickness syndrome.",
        ],
      },
      {
        postac: "zaburzenie — MSD / VIMSD",
        nazwaPl: "Zaburzenie w postaci choroby lokomocyjnej (MSD) albo VIMS (VIMSD) — kryteria A–E", nazwaEn: "Motion sickness disorder (MSD) or VIMS disorder (VIMSD) — criteria A–E",
        wymagane: "wszystkie A–E; zestaw jest jeden i ten sam dla MSD i VIMSD, różni je rodzaj bodźca",
        punkty: [
          { litera: "A", pl: "Co najmniej PIĘĆ epizodów choroby lokomocyjnej / VIMS wyzwolonych tym samym lub podobnym bodźcem ruchowym.", en: "FIVE or more episodes of motion sickness / VIMS, each set off by the same or a closely similar motion stimulus." },
          { litera: "B", pl: "Objawy są powtarzalnie wyzwalane tym samym lub podobnym bodźcem ruchowym.", en: "That same, or a closely similar, motion stimulus sets the signs and symptoms off reliably." },
          { litera: "C", pl: "Nasilenie objawów NIE zmniejsza się istotnie po powtarzanej ekspozycji na ten sam lub podobny bodziec.", en: "Repeated exposure to that same or similar stimulus does NOT bring any significant fall in symptom severity." },
          { litera: "D", pl: "Objawy prowadzą do JEDNEJ LUB WIĘCEJ z trzech reakcji: (a) modyfikacji aktywności w celu zmniejszenia objawów, (b) unikania bodźca ruchowego, który je wyzwala, (c) awersyjnych emocji antycypacyjnych przed ekspozycją na bodziec.", en: "The signs and symptoms produce ONE OR MORE of three responses: (a) the person alters what they do in order to blunt the sickness; (b) the person steers clear of the motion stimulus that provokes it; (c) aversive feelings build up in anticipation, before the stimulus is even met." },
          { litera: "E", pl: "Objawów nie tłumaczy lepiej inna choroba ani inne zaburzenie.", en: "No other disease or disorder gives a better account of the signs and symptoms." },
        ],
        przypisyPl: [
          "Nota do C: podatność zwykle maleje przy powtarzanych ekspozycjach, więc powtarzalne wyzwalanie choroby tym samym bodźcem oznacza NIEZDOLNOŚĆ DO HABITUACJI — i to jest cecha rdzeniowa MSD i VIMSD. Wyjątek dotyczy bodźców skrajnie silnych i rzadkich, jak lot paraboliczny czy bardzo wzburzone morze.",
          "Nota do A: podatność na jeden rodzaj bodźca może nie przewidywać reakcji na inny, dlatego chorobę lokomocyjną i VIMS rozważa się osobno dla każdego bodźca (samolot, samochód, łódź, system VR, symulator). Małe jednostki są bardziej podatne na oscylacje ośrodka, więc ktoś może chorować na małej łodzi, a nie na dużym statku; wywołanie VIMS bywa swoiste dla konkretnego wyświetlacza nagłownego lub ekranu.",
          "Nota do rozpoznań równoległych: u jednej osoby można rozpoznać MSD, VIMSD albo oba naraz.",
          "Komentarz o wieku: podatność zwykle osiąga szczyt w dzieciństwie i okresie dojrzewania, a potem maleje z wiekiem; ustalenie, czy objawy dotyczą przedziału ≤ 12 lat, czy > 12 lat, pomaga w precyzyjnym opisie stanu i w ustaleniu zmiennych rokowniczych. To komentarz, nie kryterium.",
          "Różnicowanie: u osoby dorosłej zgłaszającej NARASTAJĄCĄ podatność na ruch praca każe szukać przyczyny obniżenia progu — chorób przedsionkowych, migreny, nieprawidłowości endokrynologicznych, zaburzeń ustawienia gałek ocznych i innych chorób ośrodkowego układu nerwowego. Dyskomfort wywołany samym ruchem GŁOWY, bez biernego ruchu całego ciała, każe podejrzewać niewyrównaną asymetrię przedsionkową.",
        ],
        przypisyEn: [
          "Note to C: susceptibility usually falls with repeated exposure, so reliable re-triggering by the same stimulus indicates an INABILITY TO HABITUATE — and that is the core feature of MSD and VIMSD. The exception covers extremely strong and infrequent stimuli such as parabolic flight or very rough seas.",
          "Note to A: susceptibility to one stimulus type may not predict the response to another, so motion sickness and VIMS are considered separately for each stimulus (aircraft, car, boat, VR system, simulator). Smaller vehicles are more subject to the oscillations of their medium, so a person may be sick on a small boat but not on a large ship; VIMS provocation can be specific to a particular head-mounted display or screen.",
          "Note on parallel diagnoses: one person may be diagnosed with MSD, with VIMSD, or with both.",
          "Comment on age: susceptibility typically peaks in childhood and adolescence and declines thereafter; establishing whether the symptoms belong to the ≤ 12-year or > 12-year range aids accurate description and prognostic variables. This is commentary, not a criterion.",
          "Differential: in an adult reporting INCREASING motion susceptibility, the document directs a search for causes of a lowered threshold — vestibular disorders, migraine, endocrine abnormality, ocular misalignment, and other disorders of the central nervous system. Discomfort provoked by HEAD motion alone, without passive whole-body motion, should raise suspicion of an uncompensated vestibular asymmetry.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobne MSD / prawdopodobne VIMSD", nazwaEn: "Probable MSD / probable VIMSD",
        wymagane: "jak dla MSD/VIMSD, ale liczba epizodów wynosi od dwóch do czterech (2–4) zamiast co najmniej pięciu",
        punkty: [
          { litera: "A", pl: "Wystąpiły od dwóch do czterech epizodów (2–4) — pozostałe warunki bez zmian.", en: "Two to four episodes (2–4) have occurred — the remaining conditions are unchanged." },
        ],
        przypisyPl: [
          "To JEDYNA postać stopniowana w całej pracy i dotyczy wyłącznie zaburzenia (MSD/VIMSD). Dla ostrego epizodu żadnych stopni nie ma.",
        ],
        przypisyEn: [
          "This is the ONLY graded form in the whole document, and it applies to the disorder (MSD/VIMSD) alone. The acute episode has no grades.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "co najmniej 1 z 5, o nasileniu większym niż minimalne", wielkoscPl: "liczba kategorii objawowych wymagana do rozpoznania ostrego epizodu", wielkoscEn: "number of symptom categories required for an acute episode", kontekstPl: "kryterium A ostrego epizodu", kontekstEn: "criterion A of the acute episode" },
      { ranga: "nota", wartosc: "w ciągu 60 minut od początku innych objawów (np. nudności umiarkowanych lub ciężkich)", wielkoscPl: "okno, w którym zwykle występują wymioty przy silnym bodźcu", wielkoscEn: "window within which vomiting usually occurs with a strong stimulus", kontekstPl: "nota do kategorii A1; wymioty są rzadsze w VIMS niż przy ruchu fizycznym, częściowo dlatego, że można zamknąć oczy", kontekstEn: "note to category A1; vomiting is less common with VIMS than with physical motion, partly because the eyes can be closed" },
      { ranga: "nota", wartosc: "początek dopiero po ustaniu ruchu ORAZ trwanie co najmniej 48 godzin", wielkoscPl: "próg czasowy odróżniający MdDS (jednostkę CUDZĄ, nie tę pracę)", wielkoscEn: "time threshold distinguishing MdDS (ANOTHER document's entity, not this one)", kontekstPl: "nota do kryterium C — to jedyne zdanie i jedyna liczba, jaką ta praca podaje o MdDS; koniunkcja obu członów. ROZJAZD OPERATORA MIĘDZY PRACAMI: tutaj „co najmniej 48 godzin” (≥ 48 h), a w pracy definiującej MdDS ([H54] Cha 2020, kryterium D) „dłużej niż 48 godzin” (> 48 h). Kryteriów MdDS nie wolno brać z tej pracy.", kontekstEn: "note to criterion C — the only sentence and the only number this document gives about MdDS; both limbs are conjoined. OPERATOR MISMATCH BETWEEN PAPERS: 'at least 48 hours' (≥ 48 h) here, versus 'more than 48 hours' (> 48 h) in criterion D of the paper that defines MdDS ([H54] Cha 2020). MdDS criteria must not be taken from this document." },
      { ranga: "kryterium", wartosc: "≥ 5", wielkoscPl: "liczba epizodów wymagana do rozpoznania zaburzenia", wielkoscEn: "number of episodes required for the disorder", kontekstPl: "kryterium A dla MSD/VIMSD", kontekstEn: "criterion A for MSD/VIMSD" },
      { ranga: "nota", wartosc: "2–4", wielkoscPl: "liczba epizodów dla postaci prawdopodobnej", wielkoscEn: "number of episodes for the probable form", kontekstPl: "komentarz do kryteriów MSD/VIMSD — jedyna postać stopniowana w pracy", kontekstEn: "comment to the MSD/VIMSD criteria — the only graded form in the document" },
      { ranga: "kryterium", wartosc: "1 lub więcej z 3 (a / b / c)", wielkoscPl: "liczba reakcji behawioralnych lub emocjonalnych", wielkoscEn: "number of behavioural or emotional responses", kontekstPl: "kryterium D dla MSD/VIMSD", kontekstEn: "criterion D for MSD/VIMSD" },
    ],
    granicePl: [
      "Kryteria są w stu procentach kliniczno-wywiadowcze: praca nie stawia ŻADNEGO wymogu badania instrumentalnego dla choroby lokomocyjnej, VIMS, MSD ani VIMSD. Wprost stwierdza, że większość ustalonych testów choroby lokomocyjnej nie jest używana do rozpoznania klinicznego.",
      "Kryteria ostrego epizodu NIE zawierają żadnego progu czasu trwania objawów — nie ma „co najmniej X minut”. Jedyne progi czasowe odnoszące się do objawów lub ekspozycji to 60 minut (okno wymiotów), 48 godzin (dotyczy MdDS, nie choroby lokomocyjnej) i około 10 minut (ekspozycja laboratoryjna).",
      "Kryterium A dla MSD/VIMSD nie stawia żadnego OKNA CZASOWEGO między epizodami — mówi tylko „co najmniej pięć epizodów”, bez ram czasowych.",
      "Nie ma kryteriów dla cybersickness, dla VID ani dla MdDS — to pojęcia przywołane, nie zdefiniowane w tej pracy.",
      "Nie ma twierdzenia, że chorzy na BPPV są bardziej podatni na chorobę lokomocyjną — praca mówi, że NIE wykazują istotnej różnicy w podatności. Utrata obwodowej funkcji przedsionkowej istotnie PODNOSI próg choroby lokomocyjnej.",
      "Nie ma wskaźników czułości ani swoistości samych kryteriów i nie ma danych walidacyjnych — praca przyznaje, że pozostają krytyczne luki informacyjne i że kryteria będą ewoluować.",
    ],
    graniceEn: [
      "The criteria are entirely clinical and history-based: no instrumental test is required for motion sickness, VIMS, MSD or VIMSD. The document states outright that most of the established tests for motion sickness play no part in clinical diagnosis.",
      "The acute-episode criteria contain NO symptom-duration threshold — there is no 'at least X minutes'. The only time thresholds relating to symptoms or exposure are 60 minutes (the vomiting window), 48 hours (which concerns MdDS, not motion sickness) and about 10 minutes (laboratory exposure).",
      "Criterion A for MSD/VIMSD sets no TIME WINDOW between episodes — it says only 'at least five episodes', with no timeframe.",
      "There are no criteria for cybersickness, for VID or for MdDS — these are concepts invoked, not defined, in this document.",
      "There is no claim that BPPV patients are more susceptible to motion sickness — the document states they fail to show a significant difference in susceptibility. Losing peripheral vestibular function significantly RAISES the motion sickness threshold.",
      "No sensitivity or specificity figures and no validation data exist for the criteria themselves — the document concedes that critical information gaps remain and that the criteria will evolve.",
    ],
  },
  {
    klucz: "scds",
    zrodlo: "[H56] Ward 2021",
    typ: "jednostka",
    nazwaPl: "Zespół dehiscencji kanału półkolistego górnego (SCDS)",
    nazwaEn: "Superior semicircular canal dehiscence syndrome (SCDS)",
    zespol: "EVS",
    wSilniku: "modelowana",
    wSilnikuDowod: "W worktree C:/Users/kuzni/OneDrive/Dokumenty/Otorepo_code/files/.claude/worktrees/atlas-otoneurologiczny: grep -rniE 'scds|dehiscen' src/ = 63 trafienia w 5 plikach (src/engine/neuro-vor.js, src/app/lab-model.js, src/app/actions.js, src/app/state.js, src/render/svg-screens.js); grep -rn 'pressureStimulus' src/ = 7 trafień; grep -rn 'VEMP_SCDS' src/ = 2 trafienia; grep -rniE 'tullio|hennebert' src/ = 9 trafień; grep -rni 'vemp' src/ = 99 trafień. Silnik LICZY fizykę: parametr p.dehiscence (neuro-vor.js:92, null|'L'|'P') zasila pressureStimulus() (neuro-vor.js:297-311) wytwarzającą oczopląs na bodziec dźwięk/ciśnienie oraz boost() z VEMP_SCDS=2.0 (neuro-vor.js:866-886) podnoszącą amplitudę VEMP ipsilateralnie. Ale styk z kryteriami jest CZĘŚCIOWY i mierzalny: znak bodźca to jeden wspólny PRESSURE_EXC z valsalva:+1 (nie rozróżnia Valsalvy głośniowej, która wg 4.5 HAMUJE), oś cVEMP w silniku to amplituda, a nie próg, kryterium 2.2 (ujemne progi kostne) jest niereprezentowalne — słuch to jedna liczba 0-1 na ucho — a kryterium 3 (TK) nie istnieje jako parametr.",
    streszczeniePl: "Ubytek kości nad kanałem półkolistym górnym tworzy w błędniku dodatkowe, ruchome „trzecie okno\" (dwa pierwsze to okienko owalne i okrągłe). Zmieniona biomechanika ucha wewnętrznego tłumaczy jednocześnie objawy słuchowe (nadwrażliwość na przewodnictwo kostne, autofonia, szum pulsujący) i przedsionkowe (zawroty i oscylopsja wyzwalane dźwiękiem albo ciśnieniem, zsynchronizowane z bodźcem). Kryteria wymagają jednoczesnego spełnienia trzech warstw — objawu, znaku lub badania fizjologicznego oraz dehiscencji w tomografii — plus braku lepszego wyjaśnienia. Praca definiuje dokładnie JEDEN zestaw kryteriów: podział na postać pewną i prawdopodobną został rozważony i odrzucony.",
    streszczenieEn: "A bony defect over the superior semicircular canal creates an additional mobile \"third window\" into the labyrinth (the oval and round windows being the first two). The altered inner-ear biomechanics account at once for the auditory features (bone-conduction hyperacusis, autophony, pulsatile tinnitus) and the vestibular ones (sound- or pressure-induced vertigo and oscillopsia, time-locked to the stimulus). The criteria require three layers to coincide — a symptom, a sign or physiological test, and dehiscence on CT — plus the absence of a better explanation. The document defines exactly ONE criteria set: a definite/probable split was considered and rejected.",
    synonimy: [
      { pl: "zespół dehiscencji kanału górnego", en: "superior canal dehiscence syndrome (SCDS)" },
      { pl: "zespół trzeciego okna ruchomego", en: "third mobile window syndrome", odradzany: true, uwagaPl: "„Trzecie okno ruchome\" jest w tej pracy nazwą MECHANIZMU, nie synonimem jednostki. Praca wymienia inne przyczyny trzeciego okna, które NIE są SCDS: poszerzony wodociąg przedsionka (wzmożony VEMP tak samo jak w SCDS), dehiscencje kanału tylnego i poziomego oraz inne dehiscencje błędnika — i stwierdza, że te kryteria ich NIE obejmują. Używanie nazwy mechanizmu jako nazwy jednostki zaciera granicę kryteriów.", uwagaEn: "In this paper \"third mobile window\" names the MECHANISM, not the entity. It lists other third-window causes that are NOT SCDS: enlarged vestibular aqueduct (which enhances VEMP just as SCDS does), posterior and horizontal canal dehiscences and other labyrinthine dehiscences — and states that these criteria do NOT cover them. Using the mechanism as the entity name erases the boundary of the criteria." },
      { pl: "szum uszny synchroniczny z tętnem", en: "pulse-synchronous tinnitus" },
    ],
    kryteria: [
      {
        postac: "pewna",
        nazwaPl: "SCDS — postać jedyna („definite SCDS\")", nazwaEn: "SCDS — the only form (\"definite SCDS\")",
        wymagane: "wszystkie 1-4 (spójnik ORAZ między punktami)",
        punkty: [
          { litera: "1", pl: "Co najmniej 1 (≥ 1) z następujących OBJAWÓW, zgodnych z obecnością „trzeciego okna ruchomego\" w uchu wewnętrznym: (1.1) nadwrażliwość słuchowa na przewodnictwo kostne; (1.2) zawroty głowy i/lub oscylopsja WYWOŁANE DŹWIĘKIEM, zsynchronizowane w czasie z bodźcem; (1.3) zawroty głowy i/lub oscylopsja WYWOŁANE CIŚNIENIEM, zsynchronizowane w czasie z bodźcem; (1.4) szum uszny pulsujący.", en: "At least 1 (≥ 1) SYMPTOM from the list below, each of them a fit for a \"third mobile window\" in the inner ear: (1.1) hyperacusis to bone-conducted sound; (1.2) vertigo and/or oscillopsia SET OFF BY SOUND and running in step with the stimulus; (1.3) vertigo and/or oscillopsia SET OFF BY PRESSURE and running in step with the stimulus; (1.4) pulsatile tinnitus." },
          { litera: "2", pl: "Co najmniej 1 (≥ 1) z następujących OBJAWÓW PRZEDMIOTOWYCH lub BADAŃ wskazujących na „trzecie okno ruchome\": (2.1) oczopląs charakterystyczny dla POBUDZENIA albo HAMOWANIA zajętego kanału górnego, wywołany dźwiękiem ALBO zmianą ciśnienia w uchu środkowym ALBO zmianą ciśnienia śródczaszkowego; (2.2) UJEMNE progi przewodnictwa kostnego w niskich częstotliwościach w audiometrii tonalnej; (2.3) WZMOŻONE odpowiedzi VEMP (niskie progi cVEMP ALBO wysokie amplitudy oVEMP).", en: "At least 1 (≥ 1) SIGN or TEST FINDING from the list below, each pointing to a \"third mobile window\": (2.1) nystagmus in the pattern of EXCITATION or INHIBITION of the affected superior canal, evoked by sound OR by a change of middle-ear pressure OR by a change of intracranial pressure; (2.2) NEGATIVE bone-conduction thresholds at low frequencies on pure-tone audiometry; (2.3) ENHANCED VEMP responses — cVEMP thresholds that are low OR oVEMP amplitudes that are high." },
          { litera: "3", pl: "Tomografia komputerowa kości skroniowej o wysokiej rozdzielczości z rekonstrukcją wielopłaszczyznową, wykazująca dehiscencję kanału półkolistego górnego.", en: "High-resolution CT of the temporal bone, reconstructed in more than one plane, showing the superior semicircular canal to be dehiscent." },
          { litera: "4", pl: "Obrazu nie tłumaczy lepiej inna choroba lub inne zaburzenie przedsionkowe.", en: "No other vestibular disease or disorder explains the picture better." },
        ],
        przypisyPl: [
          "Odczyt logiczny całości: (≥ 1 objaw z czterech) ORAZ (≥ 1 znak/badanie z trzech) ORAZ (dodatnia TK) ORAZ (brak lepszego wyjaśnienia).",
          "Do 1.1: objawy obejmują słyszenie własnego głosu głośno lub zniekształconego w chorym uchu (autofonia) oraz nieprawidłowe słyszenie własnych dźwięków wewnętrznych — ruchów gałek ocznych, mrugania, przelewania w jelitach, trzeszczenia przy ruchach żuchwy lub szyi, własnych kroków.",
          "Do 1.2: nazwane wprost fenomenem Tullio. Objawy mają być wyzwalane REGULARNIE przez bodźce charakterystyczne dla danego przypadku i danego ucha; dźwięki prowokujące są zwykle głośne i o niskiej częstotliwości. „Time-locking\" oznacza, że POCZĄTEK ORAZ CZAS TRWANIA objawów są powiązane z okresem trwania bodźca.",
          "Do 1.3: źródłem ciśnienia jest próba Valsalvy (umiarkowanie silny wydech przy zamkniętej drodze oddechowej — przez zamknięcie nosa ALBO głośni, jak przy kaszlu, parciu, kichaniu) albo zmiana ciśnienia w przewodzie słuchowym zewnętrznym. Objaw może wystąpić przy przyłożeniu ciśnienia LUB przy jego zwolnieniu.",
          "Do 2.1: oczopląs obserwuje się wideookulografią albo okularami Frenzla; ruchy gałek mają być w płaszczyźnie kanału górnego i zsynchronizowane z bodźcem. Chwyt uwidaczniający: ustawienie źrenicy w płaszczyźnie kanału górnego zamienia ruch skrętny na pionowy (przykład pracy: przy ocenie ucha PRAWEGO — patrzeć w PRAWO). Bodziec dźwiękowy podaje się audiometrem osobno do każdego ucha, natężenia prowokujące bywają bardzo głośne (np. 100 dB HL), dlatego bodziec ma być KRÓTKI. Ciśnienie dodatnie i ujemne wytwarza się palcem w przewodzie słuchowym albo Valsalvą nosową (zaciśnięty nos, dmuchanie) czy głośniową (parcie jak przy podnoszeniu ciężaru).",
        ],
        przypisyEn: [
          "Logical reading of the whole: (≥ 1 of the four symptoms) AND (≥ 1 of the three signs/tests) AND (positive CT) AND (no better explanation).",
          "On 1.1: the list covers autophony — one's own voice perceived as too loud or as distorted on the affected side — and abnormal perception of one's internal body sounds: eye movements, blinking, borborygmi, crepitus on jaw or neck movement, footfalls.",
          "On 1.2: named as the Tullio phenomenon. Symptoms should be triggered REGULARLY by stimuli characteristic of the individual case and ear; provoking sounds tend to be loud and low-frequency. \"Time-locking\" means the ONSET AND DURATION of symptoms are tied to the stimulus period.",
          "On 1.3: pressure may come from a Valsalva manoeuvre (a moderately forceful attempt to breathe out while the airway is held shut — closed at the nose OR at the glottis, as in coughing, straining, sneezing) or from a change of ear-canal pressure. Symptoms may occur on application of pressure OR on its release.",
          "On 2.1: nystagmus is observed with video-oculography or Frenzel goggles; eye movements should lie in the plane of the superior canal and be time-locked to the stimulus. A useful trick: aligning the pupil with the plane of the superior canal converts a torsional movement into a vertical one (the paper's example: when assessing the RIGHT ear, ask the patient to look RIGHT). Tones are delivered by audiometer to each ear separately; provocative intensities can be very loud (e.g. 100 dB HL), so the stimulus must be BRIEF. Positive and negative pressure is generated with a finger in the ear canal, or by nasal Valsalva (pinch the nose and blow) or glottic Valsalva (bear down as if lifting something heavy).",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "≥ 1 (z czterech)", wielkoscPl: "liczba wymaganych objawów", wielkoscEn: "number of symptoms required", kontekstPl: "kryterium 1", kontekstEn: "criterion 1" },
      { ranga: "kryterium", wartosc: "≥ 1 (z trzech)", wielkoscPl: "liczba wymaganych znaków lub badań", wielkoscEn: "number of signs or tests required", kontekstPl: "kryterium 2", kontekstEn: "criterion 2" },
      { ranga: "nota", wartosc: "np. 100 dB HL (bodziec ma być krótki)", wielkoscPl: "natężenie tonu prowokującego oczopląs", wielkoscEn: "intensity of the nystagmus-provoking tone", kontekstPl: "przypis 4 do kryterium 2.1", kontekstEn: "note 4 to criterion 2.1" },
      { ranga: "nota", wartosc: "250 Hz, 500 Hz, 1000 Hz, czasem 2000 Hz", wielkoscPl: "częstotliwości różnicy progów powietrzny-kostny", wielkoscEn: "frequencies showing the air-bone difference", kontekstPl: "przypis 5 do kryterium 2.2", kontekstEn: "note 5 to criterion 2.2" },
      { ranga: "nota", wartosc: "0,2 mm lub lepsza (preferencyjnie, nie „wymagana\")", wielkoscPl: "rozdzielczość przestrzenna TK", wielkoscEn: "CT spatial resolution", kontekstPl: "przypis 7 do kryterium 3 oraz komentarz 4.9", kontekstEn: "note 7 to criterion 3 and comment 4.9" },
    ],
    granicePl: [
      "BRAK JAKIEJKOLWIEK LICZBOWEJ WARTOŚCI ODCIĘCIA DLA VEMP — ani progu cVEMP w dB, ani amplitudy oVEMP w µV. Praca odsyła do norm ustalonych dla konkretnego systemu/pracowni. Nie podaje też minimalnej wielkości rezerwy ślimakowej w dB.",
      "BRAK PROGU WIELKOŚCI DEHISCENCJI. Żadna wartość w mm nie odnosi się do rozmiaru ubytku — jedyne milimetry w pracy to rozdzielczość TK (0,2 mm), kolimacja (0,5-0,63 mm) i grubość „cienkiej\" kości (< 0,1 mm).",
      "BRAK PROGU CZASOWEGO I MINIMALNEJ LICZBY EPIZODÓW. Kryteria nie zawierają żadnego czasu trwania w sekundach, minutach ani godzinach. Ograniczenie czasowe jest wyłącznie jakościowe: objawy „time-locked\" z bodźcem, wyzwalane REGULARNIE, w stanie opisanym jako PRZEWLEKŁY.",
      "ROZPOZNANIA NIGDY NIE WOLNO OPRZEĆ NA SAMYM TK. Nawet zoptymalizowane skany dają wyniki fałszywie dodatnie: 9% skanów w ośrodku III stopnia wykazywało pozorną dehiscencję przy częstości anatomicznej 0,7% w badaniu kości skroniowych. Symetrycznie: kryterium 3 czyni TK obowiązkową, więc rozpoznania nie stawia się też BEZ TK.",
      "KRYTERIA NIE SĄ W TEJ PRACY ZWALIDOWANE. Nie podano czułości ani swoistości CAŁEGO zestawu i nie raportowano badania walidacyjnego; wartość > 80% dotyczy wyłącznie progów cVEMP.",
      "WZMOŻONY VEMP NIE JEST SWOISTY DLA SCDS — praca wprost wskazuje, że VEMP bywa wzmożony także w zespole poszerzonego wodociągu przedsionka. Reguła „wzmożony VEMP ⇒ SCDS\" jest wobec tej pracy za mocna.",
    ],
    graniceEn: [
      "NO NUMERIC VEMP CUTOFF OF ANY KIND — neither a cVEMP threshold in dB nor an oVEMP amplitude in µV. The paper defers to norms established for the particular system/laboratory. It also gives no minimum air-bone gap in dB.",
      "NO THRESHOLD FOR DEHISCENCE SIZE. No value in mm refers to the size of the defect — the only millimetres in the paper are CT resolution (0.2 mm), collimation (0.5-0.63 mm) and \"thin\" bone (< 0.1 mm).",
      "NO TIME THRESHOLD AND NO MINIMUM NUMBER OF EPISODES. The criteria contain no duration in seconds, minutes or hours. The temporal constraint is purely qualitative: symptoms time-locked to the stimulus, triggered REGULARLY, in a condition described as CHRONIC.",
      "A DIAGNOSIS MUST NEVER REST ON CT ALONE. Even optimised scans yield false positives: 9% of scans at a tertiary centre showed apparent dehiscence against an anatomical prevalence of 0.7% in a temporal-bone study. Symmetrically, criterion 3 makes CT mandatory, so the diagnosis is not made WITHOUT CT either.",
      "THE CRITERIA ARE NOT VALIDATED IN THIS PAPER. No sensitivity or specificity is reported for the WHOLE set and no validation study is presented; the > 80% figure concerns cVEMP thresholds only.",
      "ENHANCED VEMP IS NOT SPECIFIC TO SCDS — the paper states that VEMP may also be enhanced in enlarged vestibular aqueduct syndrome. The rule \"enhanced VEMP ⇒ SCDS\" is stronger than this paper allows.",
    ],
  },
  {
    klucz: "bvp",
    zrodlo: "[H19] Strupp 2017",
    typ: "jednostka",
    nazwaPl: "Obustronna westybulopatia",
    nazwaEn: "Bilateral vestibulopathy",
    zespol: "CVS",
    wSilniku: "modelowana",
    wSilnikuDowod: "grep -rniE '\\bbvp\\b|bilateral vestibulopathy|obustronna westybulopatia|BVP_CUT|BVH' src/ = 37 trafien w 5 plikach (src/engine/neuro-vor.js 24, src/app/triage-model.js 6, src/render/svg-screens.js 4, src/app/actions.js 2, src/app/lab-model.js 1); wezszy wzorzec '\\bbvp\\b|bilateral vestibulopathy|BVP_CUT' = 10 trafien. Progi sa KONSUMOWANE, nie tylko wymienione: BVP_CUT = 0.6 (neuro-vor.js w. 726) czytany w dva() w w. 731 jako 'gP < BVP_CUT && gL < BVP_CUT' (oba osobno, nie srednia); CAL_BILAT = 6 (w. 918) czytany w w. 957 jako bilateralWeak; w. 1354 wystawia lokalizacje 'obustronna westybulopatia (BVH)' z koniunkcji cal.bilateralWeak && hc.abnormal. Punkt zaczepienia linku z kwalifikacji juz stoi: src/app/triage-model.js w. 379 niesie atlas: ['pppd','bvp','presbywestybulopatia','mdds'].",
    streszczeniePl: "Obustronna westybulopatia (BVP) jest w tym dokumencie przewlekłym zespołem przedsionkowym, w którym czynność kątowego odruchu przedsionkowo-ocznego jest obustronnie obniżona lub zniesiona. Objawy są ruchowo zależne: niestabilność przy chodzeniu i staniu, zamazanie widzenia lub oscylopsja przy ruchach głowy i ciała, pogorszenie w ciemności i na nierównym podłożu — a w spoczynku, w siedzeniu lub leżeniu, objawów nie ma. Dokument traktuje BVP jako ZESPÓŁ KLINICZNY, a nie jednostkę etiologiczną: jeśli przyczyna jest znana, ma być dopisana do rozpoznania. Postacie są dwie — BVP potwierdzona pomiarem ilościowym oraz prawdopodobna BVP oparta na samym teście przyłóżkowym.",
    streszczenieEn: "Bilateral vestibulopathy (BVP) is defined here as a chronic vestibular syndrome in which angular vestibulo-ocular reflex function is bilaterally reduced or absent. The symptoms are movement-dependent: unsteadiness when walking or standing, blurred vision or oscillopsia during head and body movement, worsening in darkness and on uneven ground — and no symptoms at rest while sitting or lying down. The document treats BVP as a CLINICAL SYNDROME rather than an aetiological entity: where the cause is known it should be added to the diagnosis. There are two forms — BVP confirmed by quantitative measurement, and probable BVP based on the bedside test alone.",
    synonimy: [
      { pl: "obustronna niewydolność przedsionkowa (bilateral vestibular failure)", en: "bilateral vestibular failure" },
      { pl: "obustronny niedobór czynności przedsionkowej (bilateral vestibular deficiency)", en: "bilateral vestibular deficiency" },
      { pl: "obustronna arefleksja przedsionkowa (bilateral vestibular areflexia)", en: "bilateral vestibular areflexia" },
      { pl: "obustronna hipofunkcja przedsionkowa (bilateral vestibular hypofunction)", en: "bilateral vestibular hypofunction" },
    ],
    kryteria: [
      {
        postac: "BVP",
        nazwaPl: "Obustronna westybulopatia", nazwaEn: "Bilateral vestibulopathy",
        wymagane: "wszystkie A–D; wewnątrz A obowiązuje A1 PLUS co najmniej jedno z A2 lub A3; wewnątrz C trzy opcje instrumentalne połączone spójnikiem „i/lub” — wystarczy JEDNA",
        punkty: [
          { litera: "A", pl: "Przewlekły zespół przedsionkowy z następującymi objawami: (1) niestabilność podczas chodzenia lub stania PLUS co najmniej jedno z (2) lub (3); (2) wywołane ruchem zamazanie widzenia lub oscylopsja podczas chodzenia albo szybkich ruchów głowy lub ciała I/LUB (3) nasilenie niestabilności w ciemności i/lub na nierównym podłożu.", en: "Chronic vestibular syndrome presenting with: (1) unsteadiness on standing or walking, PLUS at least one of items (2) or (3); (2) blurred vision or oscillopsia provoked by movement — while walking, or on rapid motion of head or body — AND/OR (3) unsteadiness that gets worse in the dark and/or on uneven ground." },
          { litera: "B", pl: "Brak objawów podczas siedzenia lub leżenia w warunkach statycznych.", en: "No symptoms at rest, that is while seated or lying still." },
          { litera: "C", pl: "Obustronnie obniżona lub nieobecna czynność kątowego VOR, udokumentowana przez: obustronnie patologiczny gain poziomego kątowego VOR < 0,6 mierzony metodą video-HIT albo techniką cewki twardówkowej, I/LUB obniżoną odpowiedź kaloryczną (suma bitermicznych maksymalnych szczytowych SPV PO KAŻDEJ STRONIE OSOBNO < 6°/s), I/LUB obniżony gain poziomego kątowego VOR ≤ 0,1 przy stymulacji sinusoidalnej na fotelu obrotowym (0,1 Hz, Vmax = 50°/s) ORAZ przesunięcie fazy ≥ 15 stopni (stała czasowa ≤ 6 s) — liczby wg ERRATY z 2023 r.", en: "Angular VOR function bilaterally reduced or absent, evidenced by: horizontal angular VOR gain pathological on BOTH sides at < 0.6 on video-HIT or by scleral coil, AND/OR a diminished caloric response (bithermal maximum peak SPV summed ON EACH SIDE SEPARATELY < 6°/s), AND/OR horizontal angular VOR gain ≤ 0.1 on sinusoidal rotatory-chair stimulation (0.1 Hz, Vmax = 50°/s) AND ALSO a phase lead ≥ 15 degrees (time constant ≤ 6 s) — figures per the 2023 ERRATUM." },
          { litera: "D", pl: "Obraz nie jest lepiej wyjaśniony przez inną chorobę.", en: "Not better accounted for by another disease." },
        ],
        przypisyPl: [
          "Nota do A2: oscylopsję podczas czynnych ruchów ciała lub biernych ruchów głowy zgłasza około 30 do 40% chorych; w rzadkich przypadkach oscylopsja może występować w rytm uderzeń serca. Przy wolnych, niskoczęstotliwościowych ruchach głowy układ płynnego wodzenia potrafi ustabilizować fiksację, o ile jest widoczny cel.",
          "Nota do A3: wielu chorych zgłasza pogorszenie w ciemności i na nierównym podłożu DOPIERO PO WYRAŹNYM ZAPYTANIU; wiąże się to z większym ryzykiem upadków w ciemności, a zaburzenie równowagi jest jeszcze gorsze przy współistniejącej czuciowej polineuropatii.",
          "Nota do B podaje WYJĄTEK od bezobjawowości w spoczynku: część chorych może zgłaszać oscylopsję w pozycji siedzącej, wywołaną np. uderzeniami serca lub żuciem.",
          "Nota do C-1 (vHIT): pomiar przy biernym obrocie głowy 150°/s–300°/s. Dane normatywne na 60 zdrowych osobach: dolna granica normy (2 SD poniżej średniej) gain poziomego wynosi 0,79 przy 80 ms i 0,75 przy 60 ms, wartości skrajne normy 0,76 i 1,18 przy 80 ms oraz 0,65 i 1,17 przy 60 ms, a spadek z wiekiem 0,012 na dekadę przy 80 ms (95% CI 0,001–0,022; p = 0,028) i 0,017 na dekadę przy 60 ms (95% CI 0,006–0,029; p = 0,005). Biorąc to pod uwagę autorzy uzgodnili próg patologii 0,6 — czyli PONIŻEJ dolnej granicy normy.",
          "Nota do C-2 (kaloryka): protokół bitermiczny, 30 sekund, minimum 200 ml wody ciepłej (44°C) i zimnej (30°C), pomiar szczytowej SPV w kulminacji, odstęp 5 minut między irygacjami. Dolna granica danych normatywnych dla sumy średnich SPV na ucho waha się między pracowniami od 20 do 25°/s — dokument podaje jawnie, że źródłem tej liczby jest komunikacja osobista, nie dane opublikowane. Brak VOR na irygację wodą lodowatą również wskazuje na BVP.",
        ],
        przypisyEn: [
          "Note to A2: oscillopsia during active body movement or passive head movement is reported by about 30 to 40% of patients; rarely it can occur in time with the heartbeat. During slow, low-frequency head movements the smooth-pursuit system can stabilise fixation provided a visible target is present.",
          "Note to A3: many patients report worsening in darkness and on uneven ground ONLY WHEN EXPLICITLY ASKED; this carries a higher risk of falls in the dark, and the balance disturbance is worse still with a concomitant sensory polyneuropathy.",
          "The note to B gives an EXCEPTION to being symptom-free at rest: some patients may report oscillopsia while seated, triggered for example by the heartbeat or by chewing.",
          "Note to C-1 (vHIT): measurement during passive head rotation at 150°/s–300°/s. Normative data in 60 healthy subjects: the lower limit of normal horizontal gain — 2 SD under the mean — came to 0.79 at 80 ms and 0.75 at 60 ms; the normal band runs from 0.76 to 1.18 at 80 ms and from 0.65 to 1.17 at 60 ms; the decline with age is 0.012 per decade at 80 ms (95% CI 0.001–0.022; p = 0.028) and 0.017 per decade at 60 ms (95% CI 0.006–0.029; p = 0.005). With all that in view the authors settled on 0.6 as the pathological value — that is, BELOW the lower limit of normal.",
          "Note to C-2 (caloric testing): bithermal protocol, 30 seconds, a minimum of 200 ml of warm (44°C) and cold (30°C) water, peak SPV measured at culmination, 5 minutes between irrigations. The lower limit of normative data for the sum of mean SPV per ear varies between laboratories from 20 to 25°/s — the document states openly that this figure comes from personal communication, not published data. Absence of a VOR response to ice-water irrigation likewise indicates BVP.",
        ],
      },
      {
        postac: "prawdopodobna",
        nazwaPl: "Prawdopodobna obustronna westybulopatia", nazwaEn: "Probable bilateral vestibulopathy",
        wymagane: "wszystkie A–D; punkty A, B i D są identyczne jak w postaci potwierdzonej pomiarem — CAŁA różnica leży w punkcie C",
        punkty: [
          { litera: "A", pl: "Przewlekły zespół przedsionkowy z objawami: (1) niestabilność podczas chodzenia lub stania PLUS co najmniej jedno z (2) lub (3); (2) wywołane ruchem zamazanie widzenia lub oscylopsja I/LUB (3) nasilenie niestabilności w ciemności i/lub na nierównym podłożu.", en: "Chronic vestibular syndrome presenting with: (1) unsteadiness on standing or walking, PLUS at least one of items (2) or (3); (2) blurred vision or oscillopsia provoked by movement AND/OR (3) unsteadiness that gets worse in the dark and/or on uneven ground." },
          { litera: "B", pl: "Brak objawów podczas siedzenia lub leżenia w warunkach statycznych.", en: "No symptoms at rest, that is while seated or lying still." },
          { litera: "C", pl: "Obustronnie patologiczny PRZYŁÓŻKOWY poziomy test pchnięcia głową.", en: "Bilaterally pathological horizontal BEDSIDE head impulse test." },
          { litera: "D", pl: "Obraz nie jest lepiej wyjaśniony przez inną chorobę.", en: "Not better accounted for by another disease." },
        ],
        przypisyPl: [
          "Status tej postaci dokument podaje wprost: prawdopodobna BVP jest roboczym rozpoznaniem dla praktyki klinicznej w podstawowej opiece zdrowotnej, natomiast dla rozpoznania BVP wymagany jest ILOŚCIOWY pomiar funkcji przedsionkowej.",
          "Nota do C: chory patrzy na czubek nosa badającego; badający mocno trzyma głowę i wykonuje pchnięcia o wysokim przyspieszeniu, ale ograniczonej amplitudzie (< 15°), w płaszczyźnie poziomej, w obie strony, w kolejności pseudolosowej. Po każdym pchnięciu głowa jest utrzymana w pozycji ekscentrycznej, a oczy obserwowane pod kątem sakad nadrabiających.",
          "Ta sama nota podaje twardą granicę metody: przyłóżkowym HIT można wiarygodnie wykryć TYLKO ciężkie deficyty kątowego VOR — gain poniżej 0,4. Sakady ukryte o bardzo krótkiej latencji występują już w trakcie pchnięcia i nie są widoczne klinicznie, dając wynik fałszywie ujemny.",
        ],
        przypisyEn: [
          "The document states the status of this form plainly: „probable BVP” serves as a working diagnosis in primary-care practice, while a diagnosis of BVP proper calls for QUANTITATIVE measurement of vestibular function.",
          "Note to C: the patient fixates on the examiner's nose tip; the examiner holds the head firmly and delivers high-acceleration but limited-amplitude (< 15°) impulses in the horizontal plane, to both sides, in pseudo-random order. The head is then kept in the eccentric position after every impulse while the eyes are watched for refixation saccades.",
          "The same note gives the method's hard limit: the bedside HIT can reliably detect ONLY severe angular VOR deficits — gain below 0.4. Covert saccades with very short latency occur during the impulse itself and are not clinically visible, producing a false-negative result.",
        ],
      },
    ],
    progi: [
      { ranga: "nota", wartosc: "30–40%", wielkoscPl: "odsetek chorych zgłaszających oscylopsję", wielkoscEn: "proportion of patients reporting oscillopsia", kontekstPl: "nota do kryterium A2 — czyli oscylopsja NIE jest objawem powszechnym w tej jednostce", kontekstEn: "note to criterion A2 — that is, oscillopsia is NOT a universal symptom of this entity" },
      { ranga: "kryterium", wartosc: "< 0,6 OBUSTRONNIE", wielkoscPl: "gain poziomego kątowego VOR w video-HIT lub technice cewki twardówkowej", wielkoscEn: "horizontal angular VOR gain by video-HIT or scleral-coil technique", kontekstPl: "kryterium C postaci potwierdzonej pomiarem, opcja pierwsza; prędkość kątowa 150–300°/s", kontekstEn: "criterion C of the measurement-confirmed form, first option; angular velocity 150–300°/s" },
      { ranga: "kryterium", wartosc: "< 6°/s", wielkoscPl: "suma bitermicznych maksymalnych szczytowych SPV na każde ucho osobno", wielkoscEn: "sum of bithermal maximum peak SPV, each ear separately", kontekstPl: "kryterium C, opcja druga; protokół 30 s, minimum 200 ml, 44°C i 30°C, odstęp 5 minut", kontekstEn: "criterion C, second option; protocol 30 s, minimum 200 ml, 44°C and 30°C, 5-minute interval" },
      { ranga: "kryterium", wartosc: "≤ 0,1 przy 0,1 Hz, Vmax = 50°/s", wielkoscPl: "gain poziomego kątowego VOR na fotelu obrotowym", wielkoscEn: "horizontal angular VOR gain on the rotatory chair", kontekstPl: "kryterium C, opcja trzecia, w brzmieniu PO ERRACIE 2023 (pierwotnie < 0,1) — w LINII KRYTERIÓW połączona z przesunięciem fazy spójnikiem ORAZ", kontekstEn: "criterion C, third option, as corrected by the 2023 ERRATUM (originally < 0.1) — joined to the phase lead by AND in the CRITERIA LINE" },
      { ranga: "kryterium", wartosc: "≥ 15 stopni (stała czasowa ≤ 6 s)", wielkoscPl: "przesunięcie fazy (phase lead) na fotelu obrotowym", wielkoscEn: "phase lead on the rotatory chair", kontekstPl: "kryterium C, opcja trzecia, w brzmieniu PO ERRACIE 2023; pierwotnie stało tu > 68 stopni (stała czasowa < 5 s) — liczba bez żadnego wyprowadzenia w dokumencie, i errata potwierdziła, że była błędna", kontekstEn: "criterion C, third option, as corrected by the 2023 ERRATUM; the original read > 68 degrees (time constant < 5 s) — a figure with no derivation anywhere in the document, and the erratum confirmed it was wrong" },
      { ranga: "kryterium", wartosc: "≤ 6 s (kryterium C-3, po erracie 2023; pierwotnie < 5 s); < 10 s (wartość uznawana za nieprawidłową, w komentarzu)", wielkoscPl: "stała czasowa odpowiedzi VOR", wielkoscEn: "VOR response time constant", kontekstPl: "kryterium C-3 po erracie używa 6 s, komentarz o fotelu obrotowym stawia próg patologii na 10 s — to nie są progi konkurencyjne, ale łatwo je pomylić", kontekstEn: "criterion C-3 after the erratum uses 6 s while the rotational-testing commentary sets the pathological threshold at 10 s — not competing thresholds, but easily confused" },
      { ranga: "nota", wartosc: "< 0,15 przy 0,05–0,1 Hz, Vmax = 60°/s", wielkoscPl: "gain fotela obrotowego w wersji Z NOTY (≠ wersja z kryterium)", wielkoscEn: "rotatory-chair gain in the NOTE version (≠ the criteria version)", kontekstPl: "nota o badaniach obrotowych — sugeruje BVP; różni się od kryterium C-3 i liczbą, i zakresem częstotliwości, i prędkością", kontekstEn: "note on rotational testing — suggestive of BVP; differs from criterion C-3 in the value, the frequency range and the velocity" },
      { ranga: "nota", wartosc: "gain < 0,4", wielkoscPl: "granica wykrywalności przyłóżkowego testu pchnięcia głową", wielkoscEn: "detection limit of the bedside head impulse test", kontekstPl: "nota do kryterium C postaci prawdopodobnej — tylko poniżej tej wartości metoda wykrywa ubytek wiarygodnie; ta sama liczba pada w dokumencie trzy razy", kontekstEn: "note to criterion C of the probable form — only below this value does the method detect the deficit reliably; the same figure appears three times in the document" },
    ],
    granicePl: [
      "PRÓG FOTELA OBROTOWEGO MIAŁ W PRACY Z 2017 TRZY BRZMIENIA — ERRATA Z 2023 ZAMKNĘŁA TYLKO JEDNO. Pierwotny pełny tekst niesie wyłącznie przypis o istnieniu erraty, bez jej treści — do 2026-08-22 ten wpis ostrzegał więc, że nie wiadomo, czy któryś próg skorygowano; errata została odnaleziona i zastosowana w tym wpisie 2026-08-22. Errata (J Vestib Res 2023;33(1):87) poprawia linię kryterium C-3 na: gain ≤ 0,1 przy 0,1 Hz i 50°/s ORAZ phase lead ≥ 15 stopni (stała czasowa ≤ 6 s); pierwotnie stało tam > 68 stopni i < 5 s. NIE ZAMKNIĘTE ZOSTAJĄ DWA ROZJAZDY: (1) abstrakt łączy te wielkości spójnikiem „i/lub\" (wystarczy jedno), a linia kryteriów — spójnikiem ORAZ, i errata abstraktu nie rusza; (2) nota o badaniach obrotowych podaje wciąż inną wersję: gain < 0,15 przy 0,05–0,1 Hz i 60°/s. Errata noty nie dotyczy.",
      "PRACA NIE MÓWI, ILE MA TRWAĆ „PRZEWLEKŁY”. Kryterium A wymaga przewlekłego zespołu przedsionkowego, ale nigdzie nie podaje liczby tygodni ani miesięcy; słowa „miesiąc” i „tydzień” nie padają, a słowo „ostry” nie pada w tym dokumencie ANI RAZU. Przypisanie tej pracy progu „co najmniej 3 miesiące” byłoby zmyśleniem.",
      "PROGI SĄ ZACHOWAWCZYM KONSENSEM, NIE POMIAREM. Sekcja ograniczeń mówi wprost: proponowane wartości patologiczne dla vHIT i szczytowej SPV to zachowawczy konsens panelu, przyjęty dla zwiększenia rygoru kryteriów. Można je zatem uważać za kryteria BVP „GŁĘBOKIEJ”, podczas gdy BVP „CIĘŻKA” mogłaby być rozpoznawana przy mniej dramatycznie obniżonej funkcji — ALE dla postaci „ciężkiej” praca nie podaje żadnych liczb, nazywa ją tylko możliwością.",
      "KRYTERIUM KALORYCZNE JEST W JEDNEJ PRACY NAZWANE DWOMA RÓŻNYMI WIELKOŚCIAMI. Kryterium C-2 i abstrakt mówią o sumie MAKSYMALNYCH SZCZYTOWYCH prędkości fazy wolnej, a nota — przy danych normatywnych 20–25°/s — o sumie ŚREDNICH SPV. Dokument nie wyjaśnia, czy to ta sama wielkość.",
      "BADANIA KOMPLEMENTARNE SĄ JAWNIE POZA DEFINICJĄ. Dynamiczna ostrość wzroku, próba Romberga oraz cVEMP i oVEMP mogą być używane, ale — słowami abstraktu — nie są włączone do definicji; komentarz o VEMP powtarza, że nie są używane w rozpoznawaniu BVP.",
      "NARZĘDZIE PRZYŁÓŻKOWE LEŻY PO PRZECIWNYCH STRONACH LINII PEŁNA/PRAWDOPODOBNA WOBEC AUVP (rozstrzygnięcie D3, 2026-08-22). Ten sam przyłóżkowy HIT z sakadami, który tutaj NIGDY nie wystarcza do rozpoznania BVP (wymagany pomiar ILOŚCIOWY, a granica metody to gain poniżej 0,4), w [H59] Strupp 2022 wystarcza jako „jednoznaczny dowód\" dla postaci PEŁNEJ AUVP. Różnicę tłumaczy fenomenologia, nie sprzeczność: tam dodatnia kotwica zostaje w kryterium B (oczopląs samoistny), więc HIT wolno puścić jako nieobecny; tu — w zespole przewlekłym bez oczopląsu — kryterium C jest jedynym znakiem zestawu i musi być dodatnie. Wśród kryteriów ICVD ta praca jest jedynym przypadkiem, w którym „probable\" czyni znalezisko dodatnie warunkiem KONIECZNYM.",
    ],
    graniceEn: [
      "THE ROTATORY-CHAIR THRESHOLD HAD THREE WORDINGS IN THE 2017 PAPER — THE 2023 ERRATUM CLOSED ONLY ONE. The original full text carries only a footnote recording that an erratum exists, without its content — until 2026-08-22 this entry therefore warned that it was unknown whether any threshold had been corrected; the erratum was found and applied to this entry on 2026-08-22. The erratum (J Vestib Res 2023;33(1):87) corrects the criterion C-3 line to: gain ≤ 0.1 at 0.1 Hz and 50°/s AND a phase lead ≥ 15 degrees (time constant ≤ 6 s); the original read > 68 degrees and < 5 s. TWO DIVERGENCES REMAIN OPEN: (1) the abstract joins these quantities with „and/or\" (either suffices) while the criteria line uses AND, and the erratum does not touch the abstract; (2) the note on rotational testing still gives yet another version: gain < 0.15 at 0.05–0.1 Hz and 60°/s. The erratum does not concern the note.",
      "THE PAPER DOES NOT SAY HOW LONG „CHRONIC” MUST BE. Criterion A requires a chronic vestibular syndrome but nowhere gives a number of weeks or months; the words „month” and „week” do not appear, and the word „acute” appears in this document NOT EVEN ONCE. Attributing a „at least 3 months” threshold to this paper would be invention.",
      "THE THRESHOLDS ARE A CONSERVATIVE CONSENSUS, NOT A MEASUREMENT. The limitations section states outright that the proposed pathological values for vHIT and peak SPV are a conservative panel consensus adopted to make the criteria more stringent. They can therefore be regarded as criteria for „PROFOUND” BVP, while „SEVERE” BVP might be diagnosed with less dramatically reduced function — BUT the paper gives no figures at all for the „severe” form; it names it only as a possibility.",
      "THE CALORIC CRITERION IS NAMED WITH TWO DIFFERENT QUANTITIES IN ONE PAPER. Criterion C-2 and the abstract speak of the sum of MAXIMUM PEAK slow-phase velocities, while the note — where the 20–25°/s normative data appear — speaks of the sum of MEAN SPV. The document does not explain whether these are the same quantity.",
      "THE COMPLEMENTARY TESTS ARE EXPLICITLY OUTSIDE THE DEFINITION. Dynamic visual acuity, the Romberg test, and cVEMP and oVEMP may be used but are, in the abstract's words, not included in the definition; the VEMP commentary repeats that they are not used in diagnosing BVP.",
      "THE BEDSIDE TOOL SITS ON OPPOSITE SIDES OF THE FULL/PROBABLE LINE COMPARED WITH AUVP (resolution of D3, 2026-08-22). The same bedside HIT with saccades, which here NEVER suffices for a diagnosis of BVP (a QUANTITATIVE measurement is required, and the method's limit is a gain below 0.4), suffices in [H59] Strupp 2022 as „unambiguous evidence\" for the FULL form of AUVP. Phenomenology, not contradiction, explains the difference: there the positive anchor stays in criterion B (spontaneous nystagmus), so the HIT may be let go as absent; here — in a chronic syndrome without nystagmus — criterion C is the set's only sign and must be positive. Among the ICVD criteria this paper is the only case in which „probable\" makes a positive finding a NECESSARY condition.",
    ],
  },
  {
    klucz: "presbywestybulopatia",
    zrodlo: "[H53] Agrawal 2019",
    typ: "jednostka",
    nazwaPl: "Presbywestybulopatia",
    nazwaEn: "Presbyvestibulopathy",
    zespol: "CVS",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "grep -rniE 'presby|presbyvestibulopathy' src/ = 8 trafien w 2 plikach (src/app/triage-model.js 6 — w. 63, 379, 384, 385, 470, 471; src/engine/neuro-vor.js 2 — w. 448 i 913). Szerszy wzorzec z '\\bpvp\\b' daje 17, ale 9 nadmiarowych to LOKALNA ZMIENNA 'pvp' w src/render/svg-screens.js (fazy zloga w BPPV) — nie ta jednostka. Oba trafienia w silniku to KOMENTARZE opisujace pasmo 0,6-0,8 i pasmo 6-25 st./s; grep za jakakolwiek stala lub galezia liczaca to pasmo = 0 — silnik ma tylko BVP_CUT = 0.6 (w. 726) i GAIN_CUT.horizontal = 0.8 (w. 461) jako granice normy, bez wezla nazywajacego przedzial miedzy nimi. Trafienia w triage-model.js niosa NAZWE jednostki i kryterium wieku >= 60 lat w tekscie karty PL i EN oraz gotowy link atlas: [...,'presbywestybulopatia',...] (w. 379) — bez obliczenia.",
    streszczeniePl: "Presbywestybulopatia (PVP) jest przewlekłym zespołem przedsionkowym u osoby w wieku co najmniej 60 lat, w którym obustronny ubytek czynności przedsionkowej jest ŁAGODNY — to znaczy mieści się pomiędzy wartościami prawidłowymi a progami ustalonymi dla obustronnej westybulopatii. Nazwa jest świadomym analogiem presbyakuzji i presbyopii: chodzi o ubytek NIECAŁKOWITY. Obraz kliniczny opisują cztery objawy — niestabilność postawy, zaburzenie chodu, przewlekłe zawroty i nawracające upadki — z których do rozpoznania wymagane są co najmniej dwa. Dokument sam przyznaje, że nie da się rozstrzygnąć, w jakim stopniu za te objawy odpowiada właśnie ubytek przedsionkowy: kryteria po prostu stwierdzają współwystępowanie objawów z udokumentowaną utratą czynności.",
    streszczenieEn: "Presbyvestibulopathy (PVP) is a chronic vestibular syndrome in a person aged at least 60 in whom the bilateral vestibular deficit is MILD — that is, it falls between normal values and the thresholds established for bilateral vestibulopathy. The name is a deliberate analogue of presbycusis and presbyopia: what is meant is an INCOMPLETE loss. Four symptoms describe the clinical picture — postural imbalance, gait disturbance, chronic dizziness and recurrent falls — of which at least two are required. The document itself concedes that the extent to which the vestibular loss accounts for those symptoms cannot be determined: the criteria simply record the co-occurrence of the symptoms with documented loss of function.",
    synonimy: [
      { pl: "presbystasis", en: "presbystasis" },
      { pl: "presbyequilibrium", en: "presbyequilibrium" },
      { pl: "presbylibrium", en: "presbylibrium" },
      { pl: "presbyotoconia", en: "presbyotoconia" },
    ],
    kryteria: [
      {
        postac: "PVP",
        nazwaPl: "Presbywestybulopatia", nazwaEn: "Presbyvestibulopathy",
        wymagane: "wszystkie A–D; wewnątrz A wymagane co najmniej 2 z 4 objawów; wewnątrz B wymagane co najmniej 1 z 3 badań laboratoryjnych",
        punkty: [
          { litera: "A", pl: "Przewlekły zespół przedsionkowy trwający CO NAJMNIEJ 3 MIESIĄCE, z CO NAJMNIEJ 2 z następujących objawów: (1) niestabilność postawy lub chwianie się, (2) zaburzenie chodu, (3) przewlekłe zawroty głowy, (4) nawracające upadki.", en: "Chronic vestibular syndrome lasting 3 MONTHS OR LONGER, together with AT LEAST 2 of these four symptoms: (1) postural imbalance or unsteadiness; (2) disturbed gait; (3) dizziness that is chronic; (4) falls that recur." },
          { litera: "B", pl: "Łagodna obustronna OBWODOWA hipofunkcja przedsionkowa, udokumentowana CO NAJMNIEJ 1 z poniższych: (1) gain VOR mierzony video-HIT pomiędzy 0,6 a 0,8 OBUSTRONNIE, (2) gain VOR pomiędzy 0,1 a 0,3 przy stymulacji sinusoidalnej na fotelu obrotowym (0,1 Hz, Vmax = 50–60°/s), (3) obniżona odpowiedź kaloryczna — suma bitermicznych maksymalnych szczytowych SPV po każdej stronie pomiędzy 6 a 25°/s.", en: "Mild bilateral PERIPHERAL vestibular hypofunction, evidenced by AT LEAST 1 of these three findings: (1) on video-HIT, VOR gain between 0.6 and 0.8 on BOTH sides; (2) on sinusoidal rotatory-chair stimulation (0.1 Hz, Vmax = 50–60°/s), VOR gain between 0.1 and 0.3; (3) a diminished caloric response, the bithermal maximum peak SPV summed on each side falling between 6 and 25°/s." },
          { litera: "C", pl: "Wiek ≥ 60 lat.", en: "Age ≥ 60 years." },
          { litera: "D", pl: "Obraz nie jest lepiej wyjaśniony przez inną chorobę lub zaburzenie.", en: "Not better accounted for by another disease or disorder." },
        ],
        przypisyPl: [
          "Nota do A definiuje objawy: niestabilność postawy obejmuje zarówno statyczną (np. stanie w bezruchu), jak i dynamiczną (np. stanie wyprostowane i rzucanie piłką); zaburzenie chodu to spowolnienie i/lub niestabilność chodu; przewlekłe zawroty to objawy systematycznie obecne przy ruchu głowy, przy chodzeniu albo w pozycji pionowej; nawracające upadki to WIĘCEJ NIŻ JEDEN UPADEK W CIĄGU ROKU.",
          "Ta sama nota zawiera zastrzeżenie, którego nie wolno pominąć: PVP prawdopodobnie występuje RÓWNOCZEŚNIE z innymi ubytkami (wzrokowym, proprioceptywnym, siły kończyn dolnych, korowym, pozapiramidowym, móżdżkowym), które ŁĄCZNIE dają obserwowane objawy. Dokument stwierdza wprost, że nie można definitywnie ustalić, w jakim stopniu za objawy odpowiada PVP; kryteria po prostu stwierdzają obecność objawów wraz z udokumentowaną utratą czynności u osób starszych.",
          "Nota do B definiuje „łagodny” jako mieszczący się pomiędzy prawidłową funkcją przedsionkową a poziomem ubytku właściwym dla obustronnej westybulopatii. Ta sama nota stawia WARUNEK BADANIA: badanie przedsionkowe należy wykonywać u osoby, która NIE PRZYJĘŁA NIEDAWNO LEKU SEDATYWNEGO (np. benzodiazepiny) — leków często przepisywanych osobom starszym.",
          "Nota do B1 wyprowadza oba progi vHIT jawnie. Dolny 0,6 przejęto z kryterium obustronnej westybulopatii (gain < 0,6 obustronnie). Górny 0,8 wybrano syntezą dwóch badań: w próbie normatywnej 62 dorosłych dolna granica normy (2 SD poniżej średniej) wynosiła 0,79 przy 80 ms i 0,75 przy 60 ms, a w badaniu 243 zdrowych osób starszych gain < 0,9 wiązał się z istotnie wyższą częstością sakad kompensacyjnych. Nota domyka to zdaniem operacyjnym: progi ustawiono na ≥ 0,6 i < 0,8.",
          "Nota do B2: fotel obrotowy mierzy zakres niskich do średnich częstotliwości (około 0,05 do 0,1 Hz). Dolny próg ≥ 0,1 ponownie przejęto z odcięcia obustronnej westybulopatii; górny < 0,3 wybrano dlatego, że wartości 0,3–0,35 są w wielu pracowniach uznawane za dolny zakres normy.",
        ],
        przypisyEn: [
          "The note to A defines the symptoms: postural imbalance takes in both the static kind (standing still, for instance) and the dynamic kind (say, standing upright while throwing a ball); gait disturbance means gait that is slow and/or unsteady; chronic dizziness means symptoms systematically present on head movement, on walking or when upright; recurrent falls means MORE THAN ONE FALL IN ONE YEAR.",
          "The same note carries a caveat that must not be dropped: PVP likely occurs SIMULTANEOUSLY with other losses (visual, proprioceptive, lower-extremity strength, cortical, extrapyramidal, cerebellar) which COLLECTIVELY produce the observed symptoms. The document states outright that the extent to which PVP contributes cannot be definitively known; the criteria simply consider the presence of the symptoms alongside documented physiologic loss in older adults.",
          "The note to B defines „mild” as lying between normal vestibular function and the level of loss characteristic of bilateral vestibulopathy. The same note sets a TESTING CONDITION: vestibular testing should be performed in a person who has NOT RECENTLY TAKEN A SEDATIVE (e.g. a benzodiazepine) — drugs frequently prescribed to older adults.",
          "The note to B1 derives both vHIT thresholds explicitly. The lower bound of 0.6 is carried over from the bilateral vestibulopathy criterion (gain < 0.6 bilaterally). The upper bound of 0.8 was arrived at by synthesising two studies: a normative sample of 62 adults put the lower limit of normal — 2 SD under the mean — at 0.79 for 80 ms and 0.75 for 60 ms, while among 243 healthy older adults a gain below 0.9 went with a markedly higher rate of compensatory saccades. The note closes with the operational sentence: the thresholds are set at ≥ 0.6 and < 0.8.",
          "The note to B2: the rotatory chair measures the low to mid frequency range (about 0.05 to 0.1 Hz). The lower threshold of ≥ 0.1 is again taken from the bilateral vestibulopathy cut-off; the upper threshold of < 0.3 was chosen because many laboratories treat 0.3–0.35 as the bottom of the normal range.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "co najmniej 3 miesiące", wielkoscPl: "minimalny czas trwania przewlekłego zespołu przedsionkowego", wielkoscEn: "minimum duration of the chronic vestibular syndrome", kontekstPl: "kryterium A", kontekstEn: "criterion A" },
      { ranga: "kryterium", wartosc: "co najmniej 2 z 4", wielkoscPl: "wymagana liczba objawów z listy czterech", wielkoscEn: "number of symptoms required from the list of four", kontekstPl: "kryterium A: niestabilność postawy, zaburzenie chodu, przewlekłe zawroty, nawracające upadki", kontekstEn: "criterion A: postural imbalance, gait disturbance, chronic dizziness, recurrent falls" },
      { ranga: "nota", wartosc: "więcej niż 1 upadek w ciągu 1 roku", wielkoscPl: "definicja nawracających upadków", wielkoscEn: "definition of recurrent falls", kontekstPl: "nota do kryterium A", kontekstEn: "note to criterion A" },
      { ranga: "kryterium", wartosc: "co najmniej 1 z 3", wielkoscPl: "wymagana liczba nieprawidłowych badań laboratoryjnych", wielkoscEn: "number of abnormal laboratory tests required", kontekstPl: "kryterium B: video-HIT, fotel obrotowy, próba kaloryczna", kontekstEn: "criterion B: video-HIT, rotatory chair, caloric testing" },
      { ranga: "kryterium", wartosc: "pomiędzy 0,6 a 0,8 (wersja operacyjna z noty: ≥ 0,6 i < 0,8)", wielkoscPl: "gain VOR w video-HIT, obustronnie", wielkoscEn: "video-HIT VOR gain, bilaterally", kontekstPl: "kryterium B1; dolna krawędź przejęta z progu obustronnej westybulopatii, górna wybrana syntezą danych normatywnych", kontekstEn: "criterion B1; the lower edge taken from the bilateral vestibulopathy threshold, the upper chosen by synthesising normative data" },
      { ranga: "kryterium", wartosc: "pomiędzy 0,1 a 0,3 (wersja operacyjna z noty: ≥ 0,1 i < 0,3), przy 0,1 Hz, Vmax = 50–60°/s", wielkoscPl: "gain VOR na fotelu obrotowym", wielkoscEn: "rotatory-chair VOR gain", kontekstPl: "kryterium B2; górna krawędź wybrana dlatego, że 0,3–0,35 uchodzi w wielu pracowniach za dolny zakres normy", kontekstEn: "criterion B2; the upper edge chosen because 0.3–0.35 is regarded in many laboratories as the lower range of normal" },
      { ranga: "kryterium", wartosc: "pomiędzy 6 a 25°/s (wersja operacyjna z noty: ≥ 6°/s i < 25°/s w OBU uszach)", wielkoscPl: "suma bitermicznych maksymalnych szczytowych SPV po każdej stronie", wielkoscEn: "sum of bithermal maximum peak SPV on each side", kontekstPl: "kryterium B3; dolna krawędź przejęta z progu obustronnej westybulopatii, górna ustawiona tuż poniżej odcięcia normy licznych pracowni", kontekstEn: "criterion B3; the lower edge taken from the bilateral vestibulopathy threshold, the upper set just below the normal cut-off used by numerous laboratories" },
      { ranga: "kryterium", wartosc: "≥ 60 lat", wielkoscPl: "wiek", wielkoscEn: "age", kontekstPl: "kryterium C; wartość wzięta z odcięcia ONZ dla osób starszych, nie z danych histologicznych — te wskazują cztery różne początki degeneracji (od ok. 40., 50., 5. dekady i ok. 60. roku życia)", kontekstEn: "criterion C; the value is taken from the United Nations cut-off for older adults, not from histological data — those point to four different onsets of degeneration (from about 40, 50, the 5th decade and about 60 years)" },
    ],
    granicePl: [
      "NIERÓWNOŚCI ROZJEŻDŻAJĄ SIĘ WEWNĄTRZ DOKUMENTU. Tabela kryteriów mówi „pomiędzy” (nierozstrzygająco), abstrakt używa nierówności OSTRYCH z obu stron (< 0,8 i > 0,6; < 25°/s i > 6°/s; > 0,1 i < 0,3), a noty podają postać operacyjną z DOLNYM PROGIEM DOMKNIĘTYM (≥ 0,6 i < 0,8; ≥ 0,1; ≥ 6°/s). Przy dosłownym czytaniu abstraktu gain dokładnie 0,600 nie należy ani do obustronnej westybulopatii (< 0,6), ani do PVP (> 0,6). Wersja z not tę dziurę zamyka i to ona jest tą, którą dokument sam wyprowadza z progów obustronnej westybulopatii.",
      "KRYTERIA WYMAGAJĄ BADANIA LABORATORYJNEGO — bez vHIT, fotela obrotowego albo próby kalorycznej rozpoznania PVP postawić się nie da. W samych kryteriach A–D NIE MA ani jednego testu przyłóżkowego; słowo „przyłóżkowy” pada w całym dokumencie raz i tylko w abstrakcie.",
      "DOKUMENT PRZYZNAJE, ŻE NIE WIADOMO, CZY TE PROGI ODPOWIADAJĄ POJAWIENIU SIĘ OBJAWÓW. Dla żadnego z trzech badań nie jest znane, czy istnieją konkretne progi odpowiedzi związane z wystąpieniem objawów klinicznych; doprecyzowanie odcięć odłożono do przyszłych rewizji. Progi dobrano tak, by leżały powyżej progów obustronnej westybulopatii i poniżej dolnych wartości typowych zakresów normy.",
      "TYLKO DWA ROZPOZNANIA NIE MOGĄ WSPÓŁISTNIEĆ Z PVP: utrwalona JEDNOSTRONNA westybulopatia (bo PVP jest obustronna) oraz obustronna westybulopatia (bo tam deficyty są głębsze). Wszystkie pozostałe pozycje tabeli różnicowej mogą — słowami dokumentu — WSPÓŁISTNIEĆ z PVP; wiele z nich odróżnia się od PVP wyłącznie brakiem obustronnych deficytów w badaniach przedsionkowych.",
      "OBECNOŚĆ DEFICYTU OBWODOWEGO NIE WYKLUCZA PATOLOGII OŚRODKOWEJ. Trzy pozycje ośrodkowe tabeli różnicowej — zespół oczopląsu bijącego ku dołowi, zaburzenia pozapiramidowe i wodogłowie normotensyjne — są w niej opisane jako odróżniające się obecnością własnych cech, Z obwodowymi deficytami przedsionkowymi LUB BEZ NICH.",
      "PVP CYTUJE PRÓG KALORYCZNY OBUSTRONNEJ WESTYBULOPATII NIEDOKŁADNIE — sprawdzone w obu pełnych tekstach. Nota do B3 przypisuje [H19] Strupp 2017 próg „< 6°/s dla odpowiedzi ciepłej ORAZ zimnej w każdym uchu”, co czyta się jak warunek na POJEDYNCZĄ odpowiedź, podczas gdy oryginalne kryterium C-2 [H19] mówi o SUMIE bitermicznych maksymalnych szczytowych SPV po każdej stronie < 6°/s. Tak samo zapisany jest górny próg 25°/s. Zdanie domykające tę samą notę wraca jednak do SUMY („łączna szczytowa SPV ≥ 6°/s i < 25°/s w obu uszach”) i to ono — razem z tabelą kryteriów i abstraktem — jest wersją operacyjną.",
    ],
    graniceEn: [
      "THE INEQUALITIES DIVERGE WITHIN THE DOCUMENT. The criteria table says „between” (undecided), the abstract uses STRICT inequalities on both sides (< 0.8 and > 0.6; < 25°/s and > 6°/s; > 0.1 and < 0.3), and the notes give the operational form with a CLOSED LOWER BOUND (≥ 0.6 and < 0.8; ≥ 0.1; ≥ 6°/s). Read literally, the abstract leaves a gain of exactly 0.600 belonging neither to bilateral vestibulopathy (< 0.6) nor to PVP (> 0.6). The notes version closes that gap and is the one the document itself derives from the bilateral vestibulopathy thresholds.",
      "THE CRITERIA REQUIRE A LABORATORY TEST — without vHIT, rotatory chair or caloric testing a PVP diagnosis cannot be made. There is NOT ONE bedside test in criteria A–D; the word „bedside” occurs once in the whole document and only in the abstract.",
      "THE DOCUMENT CONCEDES THAT IT IS UNKNOWN WHETHER THESE THRESHOLDS CORRESPOND TO SYMPTOM ONSET. For none of the three tests is it known whether specific response thresholds are associated with the emergence of clinical symptoms; refining the cut-offs is deferred to future revisions. The thresholds were chosen so as to lie above the bilateral vestibulopathy thresholds and below the lower values of typical normal ranges.",
      "ONLY TWO DIAGNOSES CANNOT COEXIST WITH PVP: established UNILATERAL vestibulopathy (because PVP is bilateral) and bilateral vestibulopathy (because its deficits are deeper). All other rows of the differential table may — in the document's own words — COEXIST with PVP; many are distinguished from PVP solely by the absence of bilateral deficits on vestibular testing.",
      "THE PRESENCE OF A PERIPHERAL DEFICIT DOES NOT EXCLUDE CENTRAL PATHOLOGY. Three central rows of the differential table — downbeat nystagmus syndrome, extrapyramidal disorders and normal pressure hydrocephalus — are described as being distinguished by their own features, WITH or WITHOUT peripheral vestibular deficits.",
      "PVP QUOTES THE BILATERAL-VESTIBULOPATHY CALORIC THRESHOLD INACCURATELY — checked in both full texts. The note to B3 attributes to [H19] Strupp 2017 a threshold of „< 6°/s for both warm AND cool responses in each ear”, which reads as a condition on a SINGLE response, whereas the original [H19] criterion C-2 speaks of the SUM of bithermal maximum peak SPV on each side being < 6°/s. The upper bound of 25°/s is written the same way. The note's own closing sentence, however, returns to the SUM („a combined peak SPV of ≥ 6°/s and < 25°/s in both ears”), and that sentence — together with the criteria table and the abstract — is the operational version.",
    ],
  },
  {
    klucz: "pppd",
    zrodlo: "[H50] Staab 2017",
    typ: "jednostka",
    nazwaPl: "Przetrwały postawno-percepcyjny zawrót głowy (PPPD)",
    nazwaEn: "Persistent postural-perceptual dizziness (PPPD)",
    zespol: "CVS",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "Pomiar powtórzony 2026-08-22 na worktree atlas-otoneurologiczny (HEAD 21bdda4 + niezacommitowane src/app/atlas-model.js i src/app/atlas-state.js). grep -rnoE 'PPPD|H50|postawno-percepcyjn|postural-perceptual' src/ = 12 trafień w DWÓCH plikach: src/app/triage-model.js (11 trafień — l. 63 komentarz o braku toru CVS; l. 384–387 węzeł przewlekłego zespołu przedsionkowego, który NAZYWA jednostkę i niesie próg czasu z kryterium A oraz status nozologiczny — przewlekłe czynnościowe zaburzenie przedsionkowe, nie rozpoznanie z wykluczenia; l. 470–471 zastrzeżenie do rady „szukaj poza układem przedsionkowym”) oraz src/app/atlas-model.js:46 (komentarz rejestru zakresu). grep -rniE 'pppd' src/engine/ src/pose/ = 0 trafień — żaden moduł silnika nic dla niej nie liczy; nie ma pól na trzy czynniki kryterium B ani na próg 15/30 dni. Program niesie z pracy nazwę, próg 3 miesięcy i status nozologiczny — i nic ponadto.",
    streszczeniePl: "Jednostka opisuje utrzymujące się miesiącami zawroty niewirowe, niestabilność albo zawrót niewirujący, które nasilają się w trzech okolicznościach: w pozycji pionowej, przy ruchu czynnym lub biernym oraz przy ekspozycji na ruchome lub złożone bodźce wzrokowe. Zaburzenie jest wyzwalane przez coś, co wcześniej zaburzyło równowagę — ostry, epizodyczny albo przewlekły zespół przedsionkowy, inną chorobę neurologiczną lub ogólną, albo stres psychiczny — a potem podtrzymuje się samo, bez dalszej ekspozycji na czynnik wyzwalający. Praca klasyfikuje je jako przewlekłe CZYNNOŚCIOWE zaburzenie przedsionkowe i zaznacza wprost, że nie jest to stan strukturalny ani psychiatryczny; „czynnościowe” nie znaczy tu „psychogenne”. Nazwa jest nowa, samo zaburzenie nie — kryteria wyprowadzono z trzydziestu lat badań nad czterema wcześniejszymi opisami.",
    streszczenieEn: "The entity describes non-vertiginous dizziness, unsteadiness or non-spinning vertigo persisting for months, exacerbated in three circumstances: upright posture, active or passive motion, and exposure to moving or complex visual stimuli. The disorder is precipitated by something that has disturbed balance before — an acute, episodic or chronic vestibular syndrome, another neurological or medical illness, or psychological distress — and thereafter sustains itself without further exposure to the precipitant. The paper classifies it as a chronic FUNCTIONAL vestibular disorder and states outright that it is neither a structural nor a psychiatric condition; 'functional' here does not mean 'psychogenic'. The name is new, the disorder is not — the criteria were derived from thirty years of research on four earlier descriptions.",
    synonimy: [
      { pl: "przewlekły subiektywny zawrót głowy (chronic subjective dizziness, CSD)", en: "chronic subjective dizziness (CSD)", odradzany: true, uwagaPl: "Praca stwierdza, że PPPD w PEŁNI ZASTĘPUJE CSD, bo definicja PPPD jest lepiej udokumentowana. CSD zachowano jedynie jako termin indeksowy do odsyłania w projekcie beta ICD-11. UWAGA: jedyne wartości czułości i swoistości w całej pracy (> 85% i > 90% dla odróżnienia od choroby Ménière'a, migreny przedsionkowej albo BPPV) dotyczą definicji CSD, a NIE kryteriów PPPD.", uwagaEn: "The paper states that PPPD FULLY SUPPLANTS CSD, because the PPPD definition is better supported. CSD was retained only as an index term for cross-referencing in the ICD-11 beta draft. NOTE: the only sensitivity and specificity values in the whole paper (> 85% and > 90% for separating it from Menière's disease, vestibular migraine or BPPV) belong to the CSD definition, NOT to the PPPD criteria." },
      { pl: "fobiczny zawrót postawny (phobic postural vertigo, PPV)", en: "phobic postural vertigo (PPV)", odradzany: true, uwagaPl: "PPV zasiliło definicję PPPD, ale NIE zostało włączone jako jej podtyp — propozycja przepadła w podkomitecie zwykłą większością głosów. Konsensus co do relacji z PPPD osiągnięto dla SMD, VV i CSD, ale NIE dla PPV. Zachowane jako termin indeksowy w projekcie beta ICD-11. Częsta pomyłka: wiersz „badanie prawidłowe” w tabeli poprzedników dotyczy PPV, a nie PPPD.", uwagaEn: "PPV informed the PPPD definition but was NOT included as a subtype of it — the proposal was voted down in the subcommittee by a simple majority. Consensus on the relationship with PPPD was reached for SMD, VV and CSD, but NOT for PPV. Retained as an index term in the ICD-11 beta draft. A common slip: the 'normal examination' row in the table of predecessors belongs to PPV, not to PPPD." },
      { pl: "dyskomfort w przestrzeni i ruchu (space-motion discomfort, SMD)", en: "space-motion discomfort (SMD)", odradzany: true, uwagaPl: "Uznane za ZŁOŻONY OBJAW, a nie za samodzielną jednostkę chorobową. Zasiliło kryterium B, ale występuje także w innych sytuacjach. Zachowane jako termin indeksowy w projekcie beta ICD-11.", uwagaEn: "Regarded as a COMPLEX SYMPTOM, not a stand-alone diagnostic entity. It informed criterion B but also occurs in other situations. Retained as an index term in the ICD-11 beta draft." },
      { pl: "zawrót wzrokowy (visual vertigo, VV) — w nomenklaturze ICVD zastąpiony przez „oszołomienie wywołane wzrokowo” (visually induced dizziness, VID)", en: "visual vertigo (VV) — replaced in the ICVD nomenclature by visually induced dizziness (VID)", odradzany: true, uwagaPl: "W 2009 r. Bárány Society przyjęło w nomenklaturze objawów ICVD termin VID w miejsce VV. Ta praca świadomie używa historycznego „VV”, gdy opisuje pierwotny opis Bronsteina i wyrosłe z niego piśmiennictwo — nie jest to zalecenie terminologiczne. VV, tak jak SMD, uznano za złożony objaw, nie jednostkę; zasiliło kryterium B i zachowano je jako termin indeksowy w projekcie beta ICD-11. Baza wiedzy musi wybrać jeden termin i odnotować, że to ta sama rzecz.", uwagaEn: "In 2009 the Bárány Society adopted VID in place of VV in the ICVD symptom nomenclature. This paper deliberately uses the historical 'VV' when describing Bronstein's original account and the literature that grew from it — that is not a terminological recommendation. VV, like SMD, was regarded as a complex symptom rather than an entity; it informed criterion B and was retained as an index term in the ICD-11 beta draft. A knowledge base must pick one term and record that they name the same thing." },
    ],
    kryteria: [
      {
        postac: "pewna",
        nazwaPl: "Przetrwały postawno-percepcyjny zawrót głowy — jedyny zestaw kryteriów", nazwaEn: "Persistent postural-perceptual dizziness — the only criteria set",
        wymagane: "wszystkie A–E (źródło: wszystkie pięć kryteriów musi być spełnione, żeby postawić rozpoznanie). Jednostka ma DOKŁADNIE JEDEN zestaw kryteriów — nie ma postaci prawdopodobnej ani możliwej, nie ma podtypów",
        punkty: [
          { litera: "A", pl: "Jeden lub więcej objawów — zawroty niewirowe, niestabilność albo zawrót niewirujący — obecnych przez większość dni przez 3 miesiące lub dłużej. A.1: objawy utrzymują się przez przedłużone okresy rzędu godzin, choć ich nasilenie może falować. A.2: objawy NIE muszą być obecne w sposób ciągły przez cały dzień.", en: "The patient reports one or more symptoms — dizziness, unsteadiness or non-spinning vertigo — on most days, over 3 months or longer. A.1: each stretch of symptoms runs for prolonged, hours-long periods, though its severity may wax and wane. A.2: continuous presence across the whole day is NOT required." },
          { litera: "B", pl: "Objawy przetrwałe występują bez swoistej prowokacji, ale są nasilane przez trzy czynniki: B.1 postawę pionową, B.2 ruch czynny lub bierny — bez względu na kierunek i pozycję — ORAZ B.3 ekspozycję na ruchome bodźce wzrokowe albo złożone wzory wzrokowe. Konsensus wymaga trudności ze WSZYSTKIMI TRZEMA czynnikami, choć nie w równym nasileniu.", en: "Three factors aggravate the persistent symptoms, which arise without any specific provocation: B.1 upright posture; B.2 motion, active or passive, irrespective of direction or position; AND B.3 exposure to complex visual patterns or to moving visual stimuli. The consensus requires that ALL THREE give the patient difficulty, though not necessarily to an equal degree." },
          { litera: "C", pl: "Zaburzenie jest wyzwalane przez stany powodujące zawrót wirowy, niestabilność, zawroty niewirowe albo zaburzenia równowagi — w tym ostre, epizodyczne lub przewlekłe zespoły przedsionkowe, inne choroby neurologiczne bądź ogólne, albo stres psychiczny. C.1: gdy czynnikiem wyzwalającym jest stan ostry lub epizodyczny, objawy układają się we wzorzec kryterium A w miarę ustępowania czynnika wyzwalającego — początkowo mogą występować przerywanie, potem konsolidują się w przebieg utrwalony. C.2: gdy czynnikiem wyzwalającym jest zespół przewlekły, objawy mogą narastać powoli od początku i pogarszać się stopniowo.", en: "The disorder is set off by a condition that produces vertigo, unsteadiness, dizziness or trouble with balance — this covers vestibular syndromes of the acute, episodic or chronic kind, other neurological or general medical illness, or psychological distress. C.1: with an acute or episodic precipitant, the symptoms adopt the criterion A pattern as that precipitant resolves; intermittent at the outset, they later consolidate into a persistent course. C.2: with a chronic syndrome as the precipitant, the symptoms may come up slowly to begin with and then deteriorate step by step." },
          { litera: "D", pl: "Objawy powodują istotne cierpienie LUB upośledzenie funkcjonowania.", en: "Symptoms cause significant distress OR functional impairment." },
          { litera: "E", pl: "Objawów nie tłumaczy lepiej inna choroba lub zaburzenie.", en: "No other disease or disorder gives a better account of the symptoms." },
        ],
        przypisyPl: [
          "Przypis 1 (do A) — objawy podstawowe wedle wcześniejszego dokumentu Bárány Society o objawach przedsionkowych: zawroty niewirowe to POZARUCHOWE doznanie zaburzonej orientacji przestrzennej; niestabilność to poczucie chwiania podczas stania lub chodzenia; zawrót niewirujący to fałszywe albo zniekształcone doznania kołysania, bujania i podskakiwania siebie samego (postać wewnętrzna) albo otoczenia (postać zewnętrzna).",
          "Przypis 2 (do A) — „większość dni” znaczy: objawy muszą być obecne przez więcej niż 15 z każdych 30 dni. Większość chorych ma je codziennie albo prawie codziennie, a objawy mają tendencję do narastania w miarę upływu dnia.",
          "Przypis 3 (do A) — chwilowe zaostrzenia objawów mogą pojawiać się samoistnie albo przy ruchu, trwają zaledwie sekundy i nie występują u wszystkich chorych. Same chwilowe rozbłyski NIE spełniają kryterium A.",
          "Przypis 4 (do B) — gdy zaburzenie jest w pełni rozwinięte, objawy utrzymują się BEZ potrzeby dalszej ekspozycji na czynniki wyzwalające.",
          "Przypis 5 (do B) — trzy czynniki nasilające muszą być rozpoznawalne w wywiadzie klinicznym, choć nie muszą dokuczać w równym stopniu. Chorzy mogą tych czynników UNIKAĆ, żeby zmniejszyć zaostrzenia — takie unikanie może zostać uznane za spełnienie kryterium. Doprecyzowania: postawa pionowa to stanie lub chodzenie, a chorzy szczególnie wrażliwi podają nasilenie także przy siedzeniu bez podparcia; ruch czynny to ruch wygenerowany przez samego chorego, ruch bierny to bycie poruszanym przez pojazd albo inną istotę (jazda samochodem, winda, jazda na zwierzęciu, popychanie w tłumie); bodźce wzrokowe to duże obiekty otoczenia (przejeżdżający ruch uliczny, ruchliwe wzory podłóg i tapet, grafika na dużych ekranach) ALBO małe obiekty oglądane z bliska (książki, komputery, urządzenia mobilne).",
        ],
        przypisyEn: [
          "Note 1 (to A) — the primary symptoms follow the earlier Bárány Society document on vestibular symptoms: dizziness is a NON-MOTION sensation of disturbed spatial orientation; unsteadiness is a feeling of instability while standing or walking; non-spinning vertigo comprises false or distorted sensations of rocking, swaying and bobbing of oneself (internal form) or of the surroundings (external form).",
          "Note 2 (to A) — 'most days' is operationalised as more than 15 days out of every 30. Most of those affected have symptoms daily or nearly daily, and the symptoms tend to build up as the day goes on.",
          "Note 3 (to A) — momentary flares of symptoms may arise spontaneously or with motion, last only seconds, and do not occur in every patient. Momentary flares alone do NOT satisfy criterion A.",
          "Note 4 (to B) — once the disorder is fully established, symptoms persist WITHOUT any further exposure to the precipitating factors.",
          "Note 5 (to B) — the three exacerbating factors must be identifiable from the clinical history, though they need not trouble the patient equally. Patients may AVOID these factors to minimise unpleasant exacerbations — such avoidance may be counted as meeting the criterion. Clarifications: upright posture means standing or walking, and particularly sensitive patients also report exacerbation while sitting unsupported; active motion is motion generated by the patient, passive motion is being moved by a vehicle or another being (car travel, lifts, riding an animal, being jostled in a crowd); visual stimuli are large environmental objects (passing traffic, busy floor or wallpaper patterns, graphics on large screens) OR small objects viewed close up (books, computers, mobile devices).",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "3 miesiące lub dłużej", wielkoscPl: "czas trwania objawów", wielkoscEn: "symptom duration", kontekstPl: "kryterium A — jedyny próg czasu trwania w kryteriach", kontekstEn: "criterion A — the only duration threshold in the criteria" },
      { ranga: "nota", wartosc: "więcej niż 15 z każdych 30 dni", wielkoscPl: "operacjonalizacja „większości dni”", wielkoscEn: "operationalisation of 'most days'", kontekstPl: "przypis 2 do kryterium A — to NIE jest wymóg objawów ciągłych przez trzy miesiące", kontekstEn: "note 2 to criterion A — this is NOT a requirement of continuous symptoms for three months" },
      { ranga: "kryterium", wartosc: "przedłużone okresy rzędu godzin", wielkoscPl: "czas trwania pojedynczego okresu objawowego", wielkoscEn: "duration of a single symptomatic period", kontekstPl: "podpunkt A.1 — nasilenie może falować", kontekstEn: "sub-point A.1 — severity may wax and wane" },
      { ranga: "nota", wartosc: "zaledwie sekundy", wielkoscPl: "czas trwania chwilowego zaostrzenia (rozbłysku)", wielkoscEn: "duration of a momentary flare", kontekstPl: "przypis 3 — same rozbłyski NIE spełniają kryterium A i nie występują u wszystkich chorych", kontekstEn: "note 3 — flares alone do NOT satisfy criterion A and do not occur in every patient" },
      { ranga: "kryterium", wartosc: "wszystkie 3 z 3", wielkoscPl: "liczba wymaganych czynników nasilających", wielkoscEn: "number of required exacerbating factors", kontekstPl: "kryterium B — koniunkcja, nie alternatywa; praca zaznacza jednocześnie, że brak danych o czułości i swoistości wymogu jednego, dwóch albo trzech czynników", kontekstEn: "criterion B — a conjunction, not an alternative; the paper simultaneously notes there are no data on the sensitivity or specificity of requiring one, two or three factors" },
      { ranga: "nota", wartosc: "25–30% przypadków", wielkoscPl: "czynnik wyzwalający: obwodowe lub ośrodkowe zaburzenia przedsionkowe", wielkoscEn: "precipitant: peripheral or central vestibular disorders", kontekstPl: "przypis 6 do kryterium C", kontekstEn: "note 6 to criterion C" },
      { ranga: "nota", wartosc: "15–20%", wielkoscPl: "czynnik wyzwalający: napady migreny przedsionkowej", wielkoscEn: "precipitant: attacks of vestibular migraine", kontekstPl: "przypis 6 — praca NIE nadaje tej liście rangi ani nie nazywa migreny „drugą co do częstości”", kontekstEn: "note 6 — the paper does NOT rank this list and does not call vestibular migraine 'the second most common'" },
      { ranga: "nota", wartosc: "po 15%", wielkoscPl: "czynnik wyzwalający: napady paniki albo lęk z wyraźnym zawrotem", wielkoscEn: "precipitant: panic attacks or anxiety manifesting prominent dizziness", kontekstPl: "przypis 6 — dwie pozycje liczone osobno, każda po 15%", kontekstEn: "note 6 — two items counted separately, 15% each" },
    ],
    granicePl: [
      "Zestaw kryteriów jest DOKŁADNIE JEDEN. Podkomitet uznał, że nie ma dość danych, by zdefiniować postać prawdopodobną albo podprogową, i zalecił ostrożność wobec chorych, którzy nie spełniają wszystkich pięciu kryteriów. Każde „prawdopodobne PPPD” byłoby wymysłem ponad źródło.",
      "Rozpoznanie NIE JEST rozpoznaniem z wykluczenia — zdanie źródła w formie przeczącej brzmi wprost: „PPPD is not a diagnosis of exclusion”.",
      "Nieprawidłowy wynik badania przedmiotowego albo pracownianego NIE wyklucza tego rozpoznania. Przeciwnie: gdy wszystkie kryteria są spełnione, dodatnie wyniki wskazują na utrzymującą się obecność czynnika wyzwalającego albo innej choroby współistniejącej.",
      "Praca NIE wymaga żadnego badania instrumentalnego do rozpoznania i nie podaje ŻADNEGO progu instrumentalnego dla tej jednostki. Rozpoznanie stawia się z wywiadu odnoszącego się do kryteriów A–D, a praca stwierdza wprost, że nie ma wyników PATOGNOMONICZNYCH — ani w badaniu przedmiotowym, ani w badaniach pracownianych, ani w obrazowaniu. Wymienione w niej badania (head thrust, headshake, próba deptania, próba kaloryczna, fotel obrotowy, posturografia) służą wyłącznie kryterium E.",
      "Upadki i „prawie upadki” nigdy nie były częścią PPV ani CSD; ich obecność wskazuje na INNE zaburzenie chodu, które może współistnieć.",
      "Kryterium B wymaga WSZYSTKICH TRZECH czynników, ale praca sama przyznaje, że nie ma danych, który z nich jest konsekwentnie najbardziej dokuczliwy, ani jakie są czułość i swoistość wymagania jednego, dwóch albo trzech.",
    ],
    graniceEn: [
      "There is EXACTLY ONE criteria set. The subcommittee judged that there were not enough data to define a probable or subthreshold form, and counselled caution with patients who do not meet all five criteria. Any 'probable PPPD' would be an invention beyond the source.",
      "The diagnosis is NOT a diagnosis of exclusion — the source states it in the negative, outright: 'PPPD is not a diagnosis of exclusion'.",
      "Physical examination or laboratory testing may return an abnormal result; that does NOT rule out the diagnosis. Quite the opposite — once every criterion is met, a positive finding points to a precipitating condition that is still present, or to another co-existing illness.",
      "The paper requires NO instrumental test for the diagnosis and gives NO instrumental threshold for this entity. The diagnosis is made from a clinical history addressing criteria A–D, and the paper states outright that there are no PATHOGNOMONIC findings — on examination, on laboratory testing or on imaging. The tests it does mention (head thrust, headshake, stepping test, caloric irrigation, rotary chair, posturography) serve criterion E only.",
      "Falls and near-falls were never part of PPV or CSD; their presence points to ANOTHER gait disorder, which may co-exist.",
      "Criterion B requires ALL THREE factors, yet the paper concedes there are no data on which factor is consistently the most troublesome, nor on the sensitivity and specificity of requiring one, two or three.",
    ],
  },
  {
    klucz: "szyjne",
    zrodlo: "[H60] Seemungal 2022",
    typ: "stanowisko",
    nazwaPl: "Zawroty szyjne — stanowisko Bárány Society",
    nazwaEn: "Cervical dizziness — the Bárány Society position",
    zespol: "nd",
    wSilniku: "poza-zakresem",
    wSilnikuDowod: "Zaktualizowane w K7-D8 (2026-08-22; pomiar pierwotny sprzed wstawienia tego wpisu dawał dla nazw jednostki 0 trafień w src/ i zestarzał się przez AUTOTRAFIENIA). Kark ISTNIEJE w silniku, ale jako KINEMATYKA, nie jako jednostka: grep -rniE 'neckPitch|neckYaw|provokeNeck|stepNeck|NECK_PREFIX' src/ = 28 trafień w dwóch plikach (src/engine/vestibular.js, src/pose/maneuvers.js) — ramię od osi obrotu do błędnika zależne od kąta karku i pozy prowokacyjne manewrów, czyli geometria głowy na tułowiu, a nie hipoteza szyjnego pochodzenia zawrotów; ten licznik reprodukuje się bez zmian. Nazwy jednostki (grep -rniE 'cervical dizz|cervicogenic|zawroty szyjne|zawrotow szyjnych|zawrotów szyjnych' src/) trafiają dziś WYŁĄCZNIE w ten wpis (autotrafienia) oraz w regułę wykluczenia [H60] cytowaną w węźle tEVS kwalifikacji (K7-D8) — oba miejsca nazywają jednostkę po to, żeby ją opisać albo WYKLUCZYĆ, nie żeby ją rozpoznawać. Kontrola 'szyj' poza tym wpisem: cVEMP szyjny, człon szyjny dźwigni, pogranicze czaszkowo-szyjne, ból karku jako flaga kwalifikacji (src/app/triage-model.js) i uwaga tEVS; 'propriocep' poza wpisem: wagi kompensacyjne wNeck w neuro-vor.js — wejście kompensacyjne po uszkodzeniu przedsionka, z nazwaną granicą wobec [H60], nie mechanizm choroby.",
    streszczeniePl: "To nie jest zestaw kryteriów, lecz STANOWISKO Komitetu Nadzoru nad Klasyfikacją Bárány Society. Komitet orzeka, że w dotychczasowym piśmiennictwie BRAKUJE dowodów na mechanistyczne powiązanie złudzenia ruchu własnego z patologią szyi albo z bólem szyi — niezależnie od tego, czy chodzi o kręgi szyjne, tkanki miękkie czy korzenie nerwowe. Gdy złożony ruch głowy i szyi wyzwala wirowanie, przyczyną jest albo częsta jednostka przedsionkowa (migrena, BPPV), albo rzadziej stan ośrodkowy, w tym przy ostrym początku stany groźne. Dokument kończy się odmową zaproponowania jakichkolwiek wstępnych kryteriów rozpoznawczych do użytku klinicznego poza badaniem naukowym, a to, co niesie operacyjnie, to reguła WYKLUCZENIA jednostki oraz zestaw zaleceń do projektowania badań.",
    streszczenieEn: "This is not a criteria set but a POSITION of the Bárány Society Classification OverSight Committee. The Committee holds that in the literature published so far the evidence for a mechanistic link between an illusory sense of self-motion and neck pathology or neck pain is LACKING — whether the cervical vertebrae, soft tissues or nerve roots are concerned. When a combined head-and-neck movement triggers spinning, the cause is either a common vestibular condition (migraine, BPPV) or, less often, a central condition, including dangerous ones when the onset is acute. The document ends by declining to put forward even provisional criteria that could be applied clinically anywhere except inside a research study; what it does carry operationally is a rule for EXCLUDING the entity plus a set of recommendations for designing research.",
    synonimy: [
      { pl: "zawrót szyjny (zawroty szyjne układowe)", en: "cervical vertigo", odradzany: true, uwagaPl: "Praca wybiera „dizziness\" zamiast „vertigo\", bo złudzenie ruchu własnego nie jest w opisach tego zespołu ani powszechne, ani nawet częste, podczas gdy chorzy ZAWSZE skarżą się na co najmniej jedno z: zaburzenie równowagi, uczucie oszołomienia, dezorientację — albo na stan przedomdleniowy. Nazwa „cervical vertigo\" opisuje więc tylko mniejszość piśmiennictwa, a przyjęty termin „cervical dizziness\" tę mniejszość OBEJMUJE, choć nie wynika to z nazwy.", uwagaEn: "The paper chooses \"dizziness\" over \"vertigo\" because an illusion of self-motion is neither universal nor even common in descriptions of this syndrome, whereas patients ALWAYS report at least one of imbalance, light-headedness or disorientation — or presyncope. \"Cervical vertigo\" therefore describes only a minority of the literature, while the adopted term \"cervical dizziness\" INCLUDES that minority even though the name does not say so." },
      { pl: "zawroty szyjnopochodne", en: "cervicogenic dizziness", odradzany: true, uwagaPl: "Praca odrzuca przedrostek „-genny\", bo sugerowałby wiedzę mechanistyczną, której obecnie brak: etiologia jest niejasna, dane o mechanizmach u ludzi są nierozstrzygające, a testu diagnostycznego nie ma.", uwagaEn: "The paper rejects the \"-genic\" prefix because it would imply mechanistic knowledge that is currently absent: the aetiology is unclear, human mechanistic data are inconclusive and there is no diagnostic test." },
      { pl: "zawroty szyjne (termin przyjęty)", en: "cervical dizziness (the adopted term)" },
    ],
    kryteria: [
      {
        postac: "cechy stale opisywane w piśmiennictwie (NIE kryterium rozpoznawcze)",
        nazwaPl: "Trzy cechy, które piśmiennictwo przypisuje zawrotom związanym z szyją", nazwaEn: "Three features the literature consistently ascribes to neck-related dizziness",
        wymagane: "praca NIE łączy tych cech żadną regułą wystarczalności — to opis piśmiennictwa, nie zestaw rozpoznawczy",
        punkty: [
          { litera: "1", pl: "Sztywność i ból karku nasilają się podczas ruchów szyi.", en: "Neck stiffness and pain worsen with neck movements." },
          { litera: "2", pl: "Ruchy szyi wyzwalają PRZEMIJAJĄCE zaburzenia równowagi i/lub uczucie oszołomienia i/lub złudzenie ruchu własnego. Przypis samej pracy: badania NIE odróżniają złożonego ruchu głowy i szyi od izolowanego ruchu szyi.", en: "Moving the neck brings on TRANSIENT imbalance and/or light-headedness and/or an illusion of self-motion. The paper's own footnote: studies do NOT distinguish combined head-and-neck movement from isolated neck movement." },
          { litera: "3", pl: "Terapia ukierunkowana na szyję poprawia ból karku, sztywność karku i zawroty.", en: "Therapy aimed at the neck makes neck pain, neck stiffness and dizziness better." },
        ],
        przypisyPl: [
          "Punkt 3 jest przez samą pracę ZDYSKWALIFIKOWANY jako element definicji: odpowiedź terapeutyczna nie może być częścią żadnej proponowanej definicji do zastosowań badawczych, bo efekty odgórne (w tym oczekiwanie) potrafią u ludzi wywołać zawrót i oczopląs nawet bez jakiejkolwiek obwodowej aktywacji przedsionkowej.",
        ],
        przypisyEn: [
          "The paper itself DISQUALIFIES point 3 as part of a definition: therapeutic response cannot form part of any proposed definition for research use, because top-down effects (expectation among them) can produce vertigo and nystagmus in humans without any peripheral vestibular activation at all.",
        ],
      },
      {
        postac: "reguła wykluczenia jednostki",
        nazwaPl: "Kiedy zawroty szyjne można WYKLUCZYĆ", nazwaEn: "When cervical dizziness can be EXCLUDED",
        wymagane: "spełnienie KTÓREGOKOLWIEK z dwóch warunków wyklucza; warunek 2 sam ma budowę alternatywy",
        punkty: [
          { litera: "1", pl: "Nie ma bólu ani dyskomfortu karku.", en: "There is no neck pain or discomfort." },
          { litera: "2", pl: "Zawroty KIEDYKOLWIEK występują samoistnie (mogą wystąpić bez ruchu głowy lub szyi), ALBO zawroty są WYŁĄCZNIE POZYCYJNE (występują, gdy zmienia się orientacja głowy względem grawitacji).", en: "The dizziness EVER occurs spontaneously (it can occur without head or neck movement), OR the dizziness is EXCLUSIVELY POSITIONAL (it occurs when head orientation with respect to gravity changes)." },
        ],
        przypisyPl: [
          "To jest najtwardsza treść operacyjna całego dokumentu — reguła wykluczająca, nie rozpoznająca.",
          "Konsekwencja bezpośrednia: obraz wyłącznie pozycyjny wyklucza zawroty szyjne regułą własną tej pracy.",
        ],
        przypisyEn: [
          "This is the hardest operational content in the whole document — a rule that excludes, not one that diagnoses.",
          "A direct consequence: an exclusively positional picture excludes cervical dizziness by this paper's own rule.",
        ],
      },
      {
        postac: "kryteria badawcze — WYKLUCZENIA",
        nazwaPl: "Kryteria wykluczenia proponowane dla badań naukowych", nazwaEn: "Exclusion criteria proposed for research studies",
        wymagane: "zasada nadrzędna: projektować pod WYSOKĄ SWOISTOŚĆ, nawet kosztem NISKIEJ CZUŁOŚCI — kohorta ma być „czysta\"",
        punkty: [
          { litera: "1", pl: "Samoistne objawy przedsionkowe — wykluczenie bezwzględne, „oczywiste wykluczenie pierwszego przejścia\": zawroty bez jakiegokolwiek ruchu głowy lub szyi.", en: "Spontaneous vestibular symptoms — an absolute exclusion, the obvious first-pass exclusion: dizziness without any head or neck movement." },
          { litera: "2", pl: "BPPV — wymagany wyczerpujący wysiłek poszukiwania częstych rozpoznań przedsionkowych.", en: "BPPV — an exhaustive effort to look for common vestibular diagnoses is required." },
          { litera: "3", pl: "Migrena W JAKIEJKOLWIEK POSTACI — nie wystarczy wykluczyć samej migreny przedsionkowej; rozważne jest wykluczenie wszystkich chorych na migrenę, bo podtypy migreny są prawdopodobnie spektrum.", en: "Migraine IN ANY FORM — excluding vestibular migraine alone is not enough; excluding all migraineurs is prudent, since migraine subtypes are probably a spectrum." },
          { litera: "4", pl: "Laboratoryjnie zmierzone cechy dysfunkcji przedsionkowej obwodowej LUB ośrodkowej — przykłady podane przez pracę: obniżony gain odruchu przedsionkowo-ocznego albo objawy móżdżkowe, BEZ podania wartości progowej.", en: "Laboratory-measured features of peripheral OR central vestibular dysfunction — the paper's examples: reduced vestibulo-ocular reflex gain or cerebellar signs, WITH no threshold value given." },
          { litera: "5", pl: "Istotna hipotensja ortostatyczna — praca stanowczo doradza wykluczenie takich chorych; definicja podana: spadek ciśnienia skurczowego > 20 mmHg przy wstawaniu z pozycji leżącej.", en: "Significant postural hypotension — the paper urges strongly that such patients be excluded; the definition it gives: a fall in systolic blood pressure of > 20 mmHg on standing up from lying." },
          { litera: "6", pl: "Leki zakłócające — wymienione wprost: opiaty, beta-blokery, antagoniści kanału wapniowego, wszystkie potencjalizujące odruch trójdzielno-sercowy; leki należy udokumentować u WSZYSTKICH uczestników.", en: "Confounding medications — named explicitly: opiates, beta-blockers, calcium-channel antagonists, all of which potentiate the trigemino-cardiac reflex; medication should be documented in ALL participants." },
          { litera: "7", pl: "Uraz głowy i szyi — ze względu na wielość rozpoznań przedsionkowych po urazowym uszkodzeniu mózgu i słabą korelację cech obiektywnych z subiektywnymi.", en: "Head and neck trauma — because of the multiplicity of vestibular diagnoses after traumatic brain injury and the poor correlation of objective with subjective features." },
          { litera: "8", pl: "Do rozważenia: wyzwalane zaburzenia przewodzenia sercowego, np. przez odruch trójdzielno-sercowy albo zespół chorego węzła zatokowego — „mogłyby być przesiewane i wykluczane\".", en: "For consideration: disturbances of cardiac conduction that are themselves triggered — through the trigemino-cardiac reflex, say, or in sick sinus syndrome — which the paper says could be screened for and excluded." },
        ],
        przypisyPl: [
          "Praca dodaje uwagę o obrazowaniu: u chorych bez urazu w wywiadzie i bez deficytu w badaniu neurologicznym rola obrazowania szyi w kryteriach włączenia i wykluczenia wydaje się ograniczona, bo przeglądy systematyczne nie znalazły spójnego związku między obrazem rezonansu kręgosłupa szyjnego a bólem karku.",
        ],
        przypisyEn: [
          "The paper adds a note on imaging: in patients without a history of trauma and without a deficit on neurological examination, the role of neck imaging in inclusion and exclusion criteria appears limited, since systematic reviews have found no consistent association between cervical spine MR imaging and neck pain.",
        ],
      },
      {
        postac: "kryteria badawcze — WŁĄCZENIA",
        nazwaPl: "Kryteria włączenia proponowane dla badań naukowych", nazwaEn: "Inclusion criteria proposed for research studies",
        wymagane: "jeden warunek konieczny; pozostałe pozycje są OPCJAMI zależnymi od hipotezy badaczy",
        punkty: [
          { litera: "1", pl: "Warunek konieczny: ból karku ORAZ zawroty, OBA nasilane konsekwentnie i JEDNOCZEŚNIE przez ruchy szyi.", en: "Prerequisite: neck pain AND dizziness, with neck movements making BOTH worse, consistently and AT THE SAME TIME." },
          { litera: "2", pl: "Opcja potwierdzenia badawczego: potwierdzić, czy objawy są wyzwalane także wtedy, gdy głowa jest utrzymywana NIERUCHOMO WZGLĘDEM ZIEMI, a tułów obracany pod nieruchomą głową — bo to jest ta konfiguracja dynamiczna, w której zachodzi prawdziwy ruch szyi bez żadnego ruchu głowy.", en: "Research confirmation option: check whether the symptoms come on as well when the head is held STILL RELATIVE TO THE EARTH while the trunk is turned underneath it — that arrangement being the one in which the neck genuinely moves and the head does not." },
          { litera: "3", pl: "Opcja — marker obiektywny: pomiar oczopląsu albo wzrostu chwiania posturalnego podczas manewru prowokacyjnego, z wynikiem dodatnim zdefiniowanym A PRIORI, np. oczopląs wyzwalany widoczny w co najmniej 3 z 5 prób (przy jasnej definicji, czym jest oczopląs wyzwalany).", en: "Option — objective marker: measuring nystagmus or increased postural sway during a provocatory manoeuvre, with a positive result defined A PRIORI, e.g. a triggered nystagmus seen on at least 3 of 5 trials (with a clear definition of what counts as triggered nystagmus)." },
          { litera: "4", pl: "Opcja — propozycja proprioceptywna: nieprawidłowa propriocepcja szyjna jako kryterium włączenia, przy czym odpowiednie testy mogą dopiero wymagać opracowania i walidacji; dla badaczy powołujących się na deficyt propriocepcji jakiś jej pomiar wydaje się niezbędny.", en: "Option — proprioceptive proposal: abnormal neck proprioception as an inclusion criterion, though suitable tests may still require development and validation; for investigators invoking a proprioceptive deficit, some measure of it seems essential." },
          { litera: "5", pl: "Opcja — monitorowanie kardiologiczne: ciągłe monitorowanie serca podczas manewru prowokacyjnego, aby wykluczyć mechanizm kardiogenny; mierzyć tętno, ciśnienie tętnicze i EKG, najlepiej wszystko w trybie ciągłym.", en: "Option — cardiac monitoring: continuous cardiac monitoring during the provocatory manoeuvre to exclude a cardiogenic mechanism; measure pulse, blood pressure and ECG, ideally all continuously." },
        ],
        przypisyPl: [
          "Metodyka: zespół wielodyscyplinarny (kardiologia, neurologia, neurochirurgia, otolaryngologia, fizjoterapia — lista niewyczerpująca); badania podwójnie zaślepione, terapeutyczne kontrolowane placebo, mechanistyczne kontrolowane pozorowaną aktywnością; hipotezy a priori z punktem końcowym pierwszorzędowym (miara kliniczna) i drugorzędowym (miara laboratoryjna); wytyczne raportowania CONSORT; udział statystyka; obserwacja co najmniej 1 rok.",
        ],
        przypisyEn: [
          "Methodology: a multidisciplinary team (cardiology, neurology, neurosurgery, otolaryngology, physiotherapy — a non-exhaustive list); double-blinded studies, placebo-controlled for therapy and sham-active-controlled for mechanism; a priori hypotheses with a primary endpoint (clinical measure) and a secondary one (laboratory measure); CONSORT reporting guidance; involvement of a statistician; follow-up of at least 1 year.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "> 20 mmHg przy wstawaniu z pozycji leżącej", wielkoscPl: "spadek ciśnienia skurczowego definiujący istotną hipotensję ortostatyczną", wielkoscEn: "systolic blood pressure fall defining significant postural hypotension", kontekstPl: "kryterium wykluczenia badawczego nr 5 — jedyny twardy próg liczbowy o charakterze klinicznym w całej pracy", kontekstEn: "research exclusion criterion 5 — the only hard clinical numeric threshold in the whole paper" },
      { ranga: "kryterium", wartosc: "co najmniej 3 z 5 prób", wielkoscPl: "powtarzalność oczopląsu wyzwalanego jako wynik dodatni", wielkoscEn: "reproducibility of triggered nystagmus counted as a positive result", kontekstPl: "kryterium włączenia badawczego — PROPOZYCJA, którą badacze mają zdefiniować sami a priori, nie próg rozpoznawczy", kontekstEn: "research inclusion criterion — a PROPOSAL for investigators to define a priori, not a diagnostic threshold" },
      { ranga: "nota", wartosc: "co najmniej 1 rok", wielkoscPl: "minimalny czas obserwacji w prospektywnych badaniach interwencyjnych", wielkoscEn: "minimum follow-up in prospective interventional studies", kontekstPl: "metodyka — bo jedyne pozytywne badanie wykazało wczesną przewagę nad placebo, która nie utrzymała się po roku", kontekstEn: "methodology — because the one positive study showed an early advantage over placebo that was not sustained at one year" },
    ],
    granicePl: [
      "PRACA ODMAWIA KRYTERIÓW. Zdanie podsumowujące: przy obecnych danych nie można zalecić żadnych swoistych kryteriów rozpoznawczych zawrotów szyjnych ani żadnej swoistej terapii; Komitet wstrzymuje się od zaproponowania jakichkolwiek wstępnych kryteriów rozpoznawczych do użytku klinicznego poza badaniem naukowym.",
      "PRACA NIE ORZEKA, ŻE JEDNOSTKA NIE ISTNIEJE. Neguje DOWÓD na powiązanie mechanistyczne i mówi o „domniemanej jednostce klinicznej\" oraz o tym, że danych wysokiej jakości popierających jej istnienie jest stosunkowo mało. Jedyną rzeczą nazwaną wprost obaloną jest neurowaskularna hipoteza Barré i Lieou. Stanowisko może się zmienić wraz z nowymi dowodami.",
      "PRACA NIE WYMIENIA, NIE ZALECA I NIE OCENIA Z NAZWY ŻADNEJ BATERII TESTÓW SZYJNYCH z piśmiennictwa fizjoterapeutycznego. Konfigurację „głowa nieruchoma względem ziemi, tułów obracany pod nią\" proponuje jako OPCJONALNE potwierdzenie w badaniu naukowym, nie jako test kliniczny.",
      "BRAK JAKICHKOLWIEK DANYCH EPIDEMIOLOGICZNYCH DLA SAMEJ JEDNOSTKI. Praca stwierdza to wprost i podaje trzy powody: brak uzgodnionego rozpoznania konsensusowego, brak uzgodnionego testu diagnostycznego oraz to, że chorzy zgłaszają się w różny sposób do różnych specjalistów. Wszystkie przytoczone odsetki dotyczą TŁA (ból karku, zawroty w populacji, migrena), nie zawrotów szyjnych.",
      "ODPOWIEDŹ NA LECZENIE NIE MOŻE BYĆ CZĘŚCIĄ DEFINICJI. Uzasadnienie podane wprost: efekty odgórne potrafią u ludzi wywołać zawrót i oczopląs nawet bez jakiejkolwiek obwodowej aktywacji przedsionkowej, więc samo wykazanie wpływu interwencji na subiektywne cechy zawrotów nie dowodzi istnienia jednostki.",
      "BRAK PROGU DLA „OBNIŻONEGO GAIN\" ODRUCHU PRZEDSIONKOWO-OCZNEGO — termin pada w pracy raz, jako przykład laboratoryjnego kryterium wykluczenia, bez żadnej wartości liczbowej. Praca nie wspomina też vHIT, VEMP, prób kalorycznych, badania słuchu ani szumu usznego.",
    ],
    graniceEn: [
      "THE PAPER DECLINES TO GIVE CRITERIA. Its summary sentence: given the current data, no specific diagnostic criteria for cervical dizziness can be recommended, nor any specific therapy; the Committee holds back from putting forward even provisional criteria for use in the clinic rather than inside a research study.",
      "THE PAPER DOES NOT DECLARE THAT THE ENTITY DOES NOT EXIST. It negates the EVIDENCE for a mechanistic link and speaks of a \"putative clinical entity\" and of relatively little high-quality data supporting its existence. The only thing called discredited outright is the Barré-Lieou neurovascular hypothesis. The position may change as new evidence appears.",
      "THE PAPER NAMES, RECOMMENDS AND EVALUATES NO BATTERY OF CERVICAL TESTS from the physiotherapy literature. It proposes the \"head earth-fixed, body rotated beneath it\" configuration as an OPTIONAL confirmation within a research study, not as a clinical test.",
      "NO EPIDEMIOLOGICAL DATA WHATSOEVER FOR THE ENTITY ITSELF. The paper states this outright and gives three reasons: no agreed consensus diagnosis, no agreed diagnostic test, and patients presenting in different ways to different specialists. All the percentages quoted concern BACKGROUND (neck pain, dizziness in the population, migraine), not cervical dizziness.",
      "TREATMENT RESPONSE CANNOT BE PART OF THE DEFINITION. The reason is stated explicitly: top-down effects can produce vertigo and nystagmus in humans without any peripheral vestibular activation, so showing that an intervention affects subjective features of dizziness cannot prove that the entity exists.",
      "NO THRESHOLD FOR \"REDUCED GAIN\" OF THE VESTIBULO-OCULAR REFLEX — the term appears once, as an example of a laboratory exclusion criterion, with no numeric value. The paper also never mentions vHIT, VEMP, caloric testing, hearing assessment or tinnitus.",
    ],
  },
  {
    klucz: "slownikObjawow",
    zrodlo: "[H47] Bisdorff 2009",
    typ: "ramowy",
    nazwaPl: "ICVD-I: klasyfikacja objawów przedsionkowych",
    nazwaEn: "ICVD-I: classification of vestibular symptoms",
    zespol: "nd",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "pomiar 2026-08-22 w src/ gałęzi atlas-otoneurologiczny. `grep -rno 'H47' src/` = 2 trafienia — OBA w nowym module atlasu (src/app/atlas-model.js:34 i :230), żadne w silniku ani w kwalifikacji; źródło pozostaje niecytowane w kodzie liczbowym. Słownictwo jest natomiast obecne: `grep -rnoiE 'oscillopsia|oscylops'` = 15 (m.in. src/engine/neuro-vor.js:733, gdzie pole `oscillopsia` jest wyprowadzone z logMARLoss); `unsteadiness` = 3; `grep -rnoiE 'ortostat|orthostatic'` = 16. W src/app/triage-model.js:109-139 stoi pytanie różnicujące pozycyjny vs ortostatyczny („czy także przy kładzeniu się albo obracaniu w łóżku?”) treściowo tożsame z komentarzem 2.2.6 tej pracy — ale przypis W KODZIE wskazuje [H52] Kim 2019 (nota 1), która niesie ten sam rozróżnik; [H47] nie jest tam wymieniony. Zero pozycji słownika jako obiektu danych: `spinning|wirow` = 0, `external vertigo|zawrót zewnętrzn` = 0, `visual tilt|visual lag|movement-induced blur` = 0, `drop attack|Tumarkin` = 0. Silnik nie liczy żadnej wielkości pochodzącej z tego dokumentu.",
    streszczeniePl: "Pierwszy dokument konsensusu ICVD. Nie definiuje żadnej choroby — porządkuje SŁOWNIK objawów podmiotowych, na który powołują się wszystkie późniejsze zestawy kryteriów Bárány Society. Wyodrębnia cztery kategorie główne (zawrót wirowy i niewirowy, dizziness, objawy przedsionkowo-wzrokowe, objawy posturalne), a w nich 31 pozycji, każdą z definicją i komentarzem rozgraniczającym. Kluczowe rozstrzygnięcie konsensusu: żaden objaw przedsionkowy nie ma w pełni swoistego znaczenia topologicznego ani nozologicznego, więc definicje mają być czysto fenomenologiczne, bez odwołania do patofizjologii i bez hierarchii między terminami.",
    streszczenieEn: "The first ICVD consensus document. It defines no disease — it standardises the VOCABULARY of vestibular symptoms that every later Bárány Society criteria set refers back to. Four top-level categories (vertigo, dizziness, vestibulo-visual symptoms, postural symptoms) hold 31 entries, each with a definition and a boundary-drawing comment. The committee's pivotal position: no vestibular symptom carries fully specific topological or nosological meaning, so definitions are kept purely phenomenological — free of pathophysiological theory and free of hierarchy between terms.",
    synonimy: [
      { pl: "prawdziwy zawrót / fałszywy zawrót", en: "true vertigo / false vertigo", odradzany: true, uwagaPl: "Termin wyłączony przy kategorii 1 (vertigo) i przy 3.1 (external vertigo). Praca nie stopniuje „prawdziwości” objawu.", uwagaEn: "Excluded at category 1 (vertigo) and at 3.1 (external vertigo). The document does not grade how 'true' a symptom is." },
      { pl: "zawrót obiektywny / zawrót subiektywny", en: "objective vertigo / subjective vertigo", odradzany: true, uwagaPl: "Odrzucony jawnie w sekcji Results: nazywanie objawu „obiektywnym” jest niespójne, skoro każdy objaw czuciowy jest z definicji przeżyciem subiektywnym.", uwagaEn: "Explicitly rejected in Results: calling a symptom 'objective' is incoherent when every sensory symptom is by definition a subjective experience." },
      { pl: "zawrót rotacyjny / zawrót linearny (translacyjny)", en: "rotatory (rotational) vertigo / linear (translational) vertigo", odradzany: true, uwagaPl: "Klasyfikacja świadomie NIE rozdziela fałszywego ruchu obrotowego, liniowego i statycznego przechyłu — wszystkie trzy są zawrotem. Zamiast tego wymaga specyfikacji spinning / non-spinning.", uwagaEn: "The classification deliberately does NOT split false rotary motion, linear motion and static tilt — all three are vertigo. It requires a spinning / non-spinning specifier instead." },
      { pl: "positioning vertigo / positioning dizziness", en: "positioning vertigo / positioning dizziness", odradzany: true, uwagaPl: "Część komitetu chciała odrębnego terminu dla objawu związanego z samym AKTEM przemieszczania głowy. Rozróżnienie odrzucono jako zbyt subtelne i niepraktyczne; „positional” jest terminem zadomowionym.", uwagaEn: "Part of the committee wanted a separate term for symptoms tied to the ACT of moving the head. The distinction was rejected as too subtle and impractical; 'positional' is the established term." },
    ],
    kryteria: [
      {
        postac: "zasady konsensusu",
        nazwaPl: "Pięć zasad przyjętych przy tworzeniu słownika", nazwaEn: "The five principles adopted for the vocabulary",
        wymagane: "wszystkie pięć — zasady projektowe całej klasyfikacji, nie punkty rozpoznania",
        punkty: [
          { litera: "1", pl: "Wybrane objawy mają być dość szerokie, by pokryć spektrum objawów typowo przedsionkowych, i zarazem dość swoiste, by dało się na nich prowadzić badania naukowe.", en: "The symptoms chosen must be broad enough to cover the range typically arising from vestibular disorders, yet specific enough to support effective research." },
          { litera: "2", pl: "Żaden objaw „przedsionkowy” nie ma w pełni swoistego znaczenia topologicznego ani nozologicznego, a jego patogeneza jest prawdopodobnie niekompletnie poznana.", en: "No 'vestibular' symptom carries fully specific topological or nosological meaning, and its pathogenesis is probably incompletely understood." },
          { litera: "3", pl: "Definicje mają być maksymalnie fenomenologiczne — bez odwołania do teorii patofizjologicznej ani do konkretnej choroby.", en: "Definitions are to be as phenomenological as possible — with no appeal to pathophysiological theory or to any particular disease." },
          { litera: "4", pl: "Definicje są najczystsze, gdy są nienakładające się i NIEHIERARCHICZNE, ale dopuszczają, by u jednego pacjenta współistniał jeden lub więcej objawów.", en: "Definitions are cleanest when non-overlapping and NON-HIERARCHICAL, while allowing one patient to carry one or more symptoms at once." },
          { litera: "5", pl: "Przy wyborze terminologii należy uwzględnić łatwość tłumaczenia na języki inne niż angielski, z uwzględnieniem bieżących zwyczajów językowych.", en: "Terminology must be chosen with ease of translation into languages other than English in mind, respecting current usage." },
        ],
        przypisyPl: [
          "Zasada 2 jest merytorycznym fundamentem całego ICVD: jakość objawu nie lokalizuje uszkodzenia. To ona uzasadnia porzucenie pytania o rodzaj zawrotu na rzecz pytań o czas trwania i wyzwalacz.",
          "Zasada 4 rozstrzygnęła spór o relację vertigo↔dizziness: typowe użycie amerykańskie traktuje dizziness jako termin parasolowy zawierający vertigo, tu oba są ROZDZIELONE, jak częściej robi się w Europie.",
        ],
        przypisyEn: [
          "Principle 2 is the substantive foundation of the whole ICVD: symptom quality does not localise the lesion. It is what licenses replacing the question about the kind of dizziness with questions about timing and triggers.",
          "Principle 4 settled the vertigo↔dizziness dispute: typical American usage treats dizziness as an umbrella containing vertigo; here the two are SEPARATE, as is more common in Europe.",
        ],
      },
      {
        postac: "1. Vertigo (zawrót wewnętrzny)",
        nazwaPl: "Kategoria 1 — vertigo, z gałęzią wyzwalaczy", nazwaEn: "Category 1 — vertigo, with its trigger branch",
        wymagane: "definicja + obowiązkowa specyfikacja spinning / non-spinning / oboje; podkategoria 1.1 albo jedna z 1.2.1–1.2.7",
        punkty: [
          { litera: "def", pl: "Wrażenie ruchu własnego, gdy żaden ruch własny nie zachodzi, ALBO wrażenie zniekształconego ruchu własnego podczas skądinąd prawidłowego ruchu głowy. Obejmuje fałszywe wrażenia wirowania oraz kołysania, przechylania, kiwania, podskakiwania i ślizgania.", en: "The sensation of self-motion where no self-motion is taking place, OR a self-motion that feels distorted while the head is moving normally. It covers false spinning as well as swaying, tilting, bobbing, bouncing and sliding." },
          { litera: "1.1", pl: "Spontaneous vertigo — zawrót bez oczywistego wyzwalacza. Jeśli nasilają go ruchy głowy, dokłada się DRUGI objaw: head-motion vertigo.", en: "Spontaneous vertigo — vertigo with no obvious trigger. If head movement worsens it, a SECOND symptom is added: head-motion vertigo." },
          { litera: "1.2.1", pl: "Positional vertigo — wyzwolony zmianą położenia głowy względem grawitacji i występujący PO tej zmianie (odróżnienie od head-motion vertigo, który występuje W TRAKCIE ruchu).", en: "Positional vertigo — triggered by a change of head position relative to gravity and occurring AFTER that change (as distinct from head-motion vertigo, which occurs DURING the movement)." },
          { litera: "1.2.2", pl: "Head-motion vertigo — występujący wyłącznie podczas ruchu głowy, zsynchronizowany z nim czasowo.", en: "Head-motion vertigo — occurring only during head movement and time-locked to it." },
          { litera: "1.2.3", pl: "Visually-induced vertigo — wyzwolony bodźcem wzrokowym złożonym, zniekształconym, wielkopolowym albo ruchomym; obejmuje wzrokowo wywołaną iluzję ruchu własnego (vection).", en: "Visually-induced vertigo — triggered by a complex, distorted, large-field or moving visual stimulus; includes visually induced illusory self-motion (vection)." },
          { litera: "1.2.4", pl: "Sound-induced vertigo — wyzwolony bodźcem słuchowym. Nie wolno tu zaliczać zawrotu z Valsalvy, ze zmian ciśnienia na błonie bębenkowej ani z wibracji.", en: "Sound-induced vertigo — triggered by an auditory stimulus. Vertigo from Valsalva, from tympanic pressure change or from vibration must not be coded here." },
          { litera: "1.2.5", pl: "Valsalva-induced vertigo — wyzwolony jakimkolwiek manewrem cielesnym zwiększającym ciśnienie wewnątrzczaszkowe lub w uchu środkowym. Należy odnotować, czy wyzwala go Valsalva głośniowa, z zaciśniętym nosem, czy OBIE.", en: "Valsalva-induced vertigo — triggered by any bodily manoeuvre that raises intracranial or middle-ear pressure. Record whether the trigger is glottic Valsalva, nose-pinched Valsalva, or BOTH." },
          { litera: "1.2.6", pl: "Orthostatic vertigo — wyzwolony przez wstawanie i występujący przy wstawaniu (leżenie→siad, siad→stanie).", en: "Orthostatic vertigo — triggered by, and occurring on, rising (lying→sitting, sitting→standing)." },
          { litera: "1.2.7", pl: "Other triggered vertigo — wyzwolony jakimkolwiek innym bodźcem; podana lista obejmuje m.in. odwodnienie, leki, zmiany ciśnienia środowiskowego, wysiłek (także kończyn górnych), stan po długiej ekspozycji na ruch bierny, hormony, hiperwentylację, sytuacje fobiczne, ciasne kołnierze i wibrację.", en: "Other triggered vertigo — triggered by any other stimulus; the listed examples include dehydration, drugs, ambient pressure changes, exertion (including of the upper limbs), the aftermath of prolonged passive motion, hormones, hyperventilation, phobic situations, tight neck collars and vibration." },
        ],
        przypisyPl: [
          "Wrażenie ruchu ADEKWATNE do ruchu rzeczywistego nie jest zawrotem.",
          "Jeśli wrażenie kołysania występuje TYLKO przy staniu lub chodzeniu — to jest unsteadiness (4.1), nie vertigo.",
          "Izolowane fałszywe wrażenie ruchu WZROKOWEGO koduje się wyłącznie jako external vertigo (3.1) albo oscillopsia (3.2); gdy towarzyszy zawrotowi wewnętrznemu, dokłada się osobny objaw przedsionkowo-wzrokowy.",
          "Zastrzeżenie o wyzwalaczach chemicznych: pokarm, stany hormonalne i leki mogą współtworzyć przyczynę napadów pozornie samoistnych (podane przykłady: migrena przedsionkowa, choroba Ménière'a) — wolno je nazwać wyzwalaczem TYLKO wtedy, gdy związek z epizodem jest jasny.",
          "Rozgraniczenie z chorobą lokomocyjną: w chorobie lokomocyjnej objawem dominującym jest utrzymujące się, trzewne uczucie nudności.",
        ],
        przypisyEn: [
          "A sensation of motion that MATCHES real motion is not vertigo.",
          "If the swaying sensation occurs ONLY on standing or walking, it is unsteadiness (4.1), not vertigo.",
          "An isolated false sense of VISUAL motion is coded solely as external vertigo (3.1) or oscillopsia (3.2); when it accompanies internal vertigo, a separate vestibulo-visual symptom is added.",
          "Caveat on chemical triggers: food, hormonal states and drugs may contribute to apparently spontaneous attacks (examples given: vestibular migraine, Ménière's disease) — they may be called a trigger ONLY where the link to the episode is clear.",
          "Boundary with motion sickness: in motion sickness the dominant symptom is a sustained, visceral sense of nausea.",
        ],
      },
      {
        postac: "2. Dizziness (zawrót niewirowy)",
        nazwaPl: "Kategoria 2 — dizziness, z tą samą gałęzią wyzwalaczy", nazwaEn: "Category 2 — dizziness, with the same trigger branch",
        wymagane: "definicja + podkategoria 2.1 albo jedna z 2.2.1–2.2.7; oś spinning/non-spinning tu NIE istnieje",
        punkty: [
          { litera: "def", pl: "Wrażenie zaburzonej lub upośledzonej orientacji przestrzennej BEZ fałszywego lub zniekształconego wrażenia ruchu.", en: "The sensation of disturbed or impaired spatial orientation WITHOUT a false or distorted sense of motion." },
          { litera: "2.2.1–2.2.7", pl: "Podkategorie wyzwalaczy zbudowane dokładnie równolegle do gałęzi zawrotu: pozycyjna, przy ruchu głowy, wzrokowa, dźwiękowa, po Valsalvie, ortostatyczna i inna.", en: "Trigger subcategories built exactly in parallel with the vertigo branch: positional, head-motion, visually induced, sound-induced, Valsalva-induced, orthostatic and other." },
        ],
        przypisyPl: [
          "U jednego pacjenta oba objawy mogą współistnieć lub następować po sobie — obecność zawrotu nie wyklucza równoczesnego oznaczenia dizziness.",
          "Terminu NIE stosuje się przy czystym wrażeniu nadchodzącego omdlenia (presyncope), zaburzonego myślenia (mental confusion) ani oderwania od rzeczywistości (depersonalizacja/derealizacja), o ile wrażeniu nie towarzyszy poczucie dezorientacji przestrzennej.",
          "Terminu NIE stosuje się też przy uogólnionym lub ogniskowym osłabieniu siły ani przy nieswoistym złym samopoczuciu, zmęczeniu i niezdrowiu.",
          "Rozgraniczenie 1.2.3 ↔ 2.2.3 rozstrzyga obecność wyraźnej vection: jest vection → visually-induced VERTIGO; nie ma → visually-induced DIZZINESS.",
          "Pytanie różnicujące z komentarza 2.2.6 (najbogatszy klinicznie fragment pracy): chorego z objawem przy wstawaniu należy zapytać, czy występuje on TAKŻE przy kładzeniu się albo w pozycji leżącej (np. przy obracaniu się w łóżku) — jeśli tak, objaw jest prawdopodobnie POZYCYJNY, nie ortostatyczny.",
        ],
        przypisyEn: [
          "Both symptoms may coexist or follow one another in the same patient — the presence of vertigo does not preclude simultaneously coding dizziness.",
          "The term is NOT used for a pure sense of impending faint (presyncope), disturbed thinking (mental confusion) or detachment from reality (depersonalisation/derealisation), unless accompanied by a sense of spatial disorientation.",
          "Nor is it used for generalised or focal muscle weakness, or for non-specific malaise, fatigue or feeling unwell.",
          "The 1.2.3 ↔ 2.2.3 boundary turns on distinct vection: vection present → visually-induced VERTIGO; absent → visually-induced DIZZINESS.",
          "The differentiating question from comment 2.2.6 (the clinically richest passage in the paper): a patient with symptoms on rising should be asked whether they also occur on LYING DOWN or while recumbent (e.g. rolling over in bed) — if so, the symptom is likely POSITIONAL rather than orthostatic.",
        ],
      },
      {
        postac: "3. Objawy przedsionkowo-wzrokowe",
        nazwaPl: "Kategoria 3 — objawy przedsionkowo-wzrokowe (5 pozycji)", nazwaEn: "Category 3 — vestibulo-visual symptoms (5 entries)",
        wymagane: "jedna z pozycji 3.1–3.5; kodowane ODDZIELNIE od objawu cielesnego",
        punkty: [
          { litera: "3.1", pl: "External vertigo — fałszywe wrażenie, że otoczenie wzrokowe wiruje albo płynie. Odróżniane od oscylopsji BRAKIEM ruchu dwukierunkowego.", en: "External vertigo — the false sense that the visual surround is spinning or flowing. Distinguished from oscillopsia by the ABSENCE of to-and-fro motion." },
          { litera: "3.2", pl: "Oscillopsia — fałszywe wrażenie, że otoczenie wzrokowe OSCYLUJE (ruch tam-i-z-powrotem, w dowolnym kierunku). Należy podać, czy objaw zależy od ruchu głowy, czy występuje nawet przy głowie całkowicie nieruchomej.", en: "Oscillopsia — the false sense that the visual surround OSCILLATES (to-and-fro motion, in any direction). The description should state whether the symptom depends on head movement or occurs even with the head perfectly still." },
          { litera: "3.3", pl: "Visual lag — fałszywe wrażenie, że otoczenie wzrokowe podąża za ruchem głowy z opóźnieniem albo wykonuje krótki dryf po zakończeniu ruchu.", en: "Visual lag — the false sense that the visual surround follows head movement with a delay, or drifts briefly after the movement ends." },
          { litera: "3.4", pl: "Visual tilt — fałszywe postrzeganie otoczenia wzrokowego jako zorientowanego poza prawdziwym pionem. Kąt STAŁY → visual tilt; kąt ZMIENIAJĄCY SIĘ → external albo wewnętrzny vertigo.", en: "Visual tilt — false perception of the visual surround as oriented away from true vertical. A FIXED angle → visual tilt; a CHANGING angle → external or internal vertigo." },
          { litera: "3.5", pl: "Movement-induced blur — obniżona ostrość wzroku podczas ruchu głowy albo tuż po nim; mechanizm podany przez autorów to poślizg obrazu na siatkówce.", en: "Movement-induced blur — reduced visual acuity during or momentarily after a head movement; the authors attribute it to retinal slip." },
        ],
        przypisyPl: [
          "Kategoria powstała po części jako ŚWIADOMA próba podniesienia świadomości: autorzy piszą wprost, że poza środowiskiem otoneurologicznym nie zawsze rozumie się, iż dysfunkcja przedsionkowa daje całą gamę zaburzeń widzenia.",
          "Iluzje polegające na ruchu OBIEKTÓW wewnątrz statycznego otoczenia (męty, migotania aury migrenowej) NIE są objawami przedsionkowo-wzrokowymi.",
          "Sam oczopląs skokowy może wywołać wrażenie ciągłego przepływu wzrokowego BEZ fałszywego wrażenia ruchu własnego — dlatego objaw wzrokowy koduje się osobno.",
          "Visual tilt NIE jest synonimem bezobjawowego odchylenia subiektywnego pionu wzrokowego (SVV) mierzonego w warunkach kontrolowanych.",
          "Zastrzeżenie rozdzielające przy 3.5: NIEKTÓRZY ludzie doświadczają w tych samych sytuacjach oscylopsji albo visual lag ZAMIAST rozmycia.",
        ],
        przypisyEn: [
          "The category was created partly as a DELIBERATE awareness-raising move: the authors state that outside otoneurology it is not always understood that vestibular dysfunction produces a whole range of visual disturbances.",
          "Illusions involving movement of OBJECTS within an otherwise static surround (floaters, migraine aura scintillations) are NOT vestibulo-visual symptoms.",
          "Jerk nystagmus alone can produce a sense of continuous visual flow WITHOUT any false sense of self-motion — hence the visual symptom is coded separately.",
          "Visual tilt is NOT synonymous with the asymptomatic subjective visual vertical (SVV) deviation measured under controlled viewing conditions.",
          "Separating caveat at 3.5: SOME people experience oscillopsia or visual lag INSTEAD of blur in the very same situations.",
        ],
      },
      {
        postac: "4. Objawy posturalne",
        nazwaPl: "Kategoria 4 — objawy posturalne (4 pozycje)", nazwaEn: "Category 4 — postural symptoms (4 entries)",
        wymagane: "jedna z pozycji 4.1–4.4; wszystkie WYŁĄCZNIE w pozycji wyprostowanej (siedzącej, stojącej lub podczas chodzenia)",
        punkty: [
          { litera: "4.1", pl: "Unsteadiness — uczucie bycia niestabilnym podczas siedzenia, stania lub chodzenia, BEZ szczególnej preferencji kierunkowej.", en: "Unsteadiness — the feeling of being unstable while seated, standing or walking, WITHOUT a particular directional preference." },
          { litera: "4.2", pl: "Directional pulsion — niestabilność z tendencją do zbaczania lub padania w OKREŚLONYM kierunku. Kierunek NALEŻY określić jako latero-, retro- albo anteropulsję; przy lateropulsji trzeba podać stronę.", en: "Directional pulsion — instability with a tendency to veer or fall in a DEFINED direction. The direction should be specified as latero-, retro- or anteropulsion; for lateropulsion the side should be given as well." },
          { litera: "4.3", pl: "Balance-related near fall — wrażenie nieuchronnego upadku BEZ upadku dokonanego, związane z silną niestabilnością, pulsją kierunkową albo innym objawem przedsionkowym. Upadki „złapane” (np. ręką sięgającą ściany) klasyfikuje się tutaj.", en: "Balance-related near fall — a sense of imminent falling WITHOUT a completed fall, linked to severe unsteadiness, directional pulsion or another vestibular symptom. Caught falls (e.g. by a hand reaching the wall) are coded here." },
          { litera: "4.4", pl: "Balance-related fall — upadek DOKONANY związany z silną niestabilnością, pulsją kierunkową albo innym objawem przedsionkowym.", en: "Balance-related fall — a COMPLETED fall linked to severe unsteadiness, directional pulsion or another vestibular symptom." },
        ],
        przypisyPl: [
          "Reguła przyłóżkowa („test ściany”), wspólna dla 4.1 i 4.2: dodatkowa stabilizacja — na przykład przytrzymanie się stabilnej powierzchni — POWINNA wyraźnie zmniejszyć lub znieść objaw; jeśli tego NIE robi, należy rozważyć, czy objawem nie jest w istocie vertigo albo dizziness.",
          "Jedyne zdanie o prawdopodobieństwie CHOROBY w całej pracy: jeśli unsteadiness występuje bez żadnego innego objawu przedsionkowego z kategorii 1, 2 i 3, to zaburzenie przedsionkowe jest MAŁO PRAWDOPODOBNE, choć NIEWYKLUCZONE.",
          "Wykluczenia dla 4.3 i 4.4: upadki wyraźnie spowodowane przeszkodą w otoczeniu, osłabieniem siły (podgięcie nogi, ostry udar ruchowy) albo utratą lub bliską utratą przytomności (presyncope, omdlenie, napad drgawkowy, śpiączka) NIE są balance-related.",
          "Napady bez towarzyszących objawów przedsionkowych, występujące w zespole zatoki szyjnej, zaburzeniach rytmu serca i padaczce, NIE wolno klasyfikować jako balance-related.",
          "„Postural” w tej nomenklaturze oznacza objaw W pozycji wyprostowanej, a NIE objaw przy ZMIANIE postawy względem grawitacji — ten ostatni nazywa się „orthostatic”.",
        ],
        przypisyEn: [
          "The bedside rule ('wall test'), shared by 4.1 and 4.2: additional stabilisation — holding onto a stable surface, for instance — SHOULD markedly reduce or abolish the symptom; if it does NOT, consider whether the symptom is in fact vertigo or dizziness.",
          "The only sentence in the paper about the likelihood of DISEASE: unsteadiness occurring without any other vestibular symptom from categories 1, 2 and 3 makes a vestibular disorder UNLIKELY, though not excluded.",
          "Exclusions for 4.3 and 4.4: falls clearly caused by an environmental obstacle, by weakness (a leg buckling, acute motor stroke) or by loss or near-loss of consciousness (presyncope, syncope, seizure, coma) are NOT balance-related.",
          "Attacks without accompanying vestibular symptoms — as seen in carotid sinus syndrome, cardiac arrhythmia and epilepsy — must NOT be coded as balance-related.",
          "'Postural' here means a symptom occurring IN the upright posture, NOT a symptom on CHANGING posture relative to gravity — the latter is 'orthostatic'.",
        ],
      },
    ],
    progi: [
      { ranga: "nota", wartosc: "⩾ 1 minuta", wielkoscPl: "czas trwania objawu w utrzymanej nowej pozycji głowy — postać utrwalona", wielkoscEn: "symptom duration in the maintained new head position — persistent form", kontekstPl: "1.2.1 positional vertigo oraz 2.2.1 positional dizziness", kontekstEn: "1.2.1 positional vertigo and 2.2.1 positional dizziness" },
      { ranga: "nota", wartosc: "< 1 minuta (przy przemijającej należy odnotować czas trwania)", wielkoscPl: "czas trwania objawu w utrzymanej nowej pozycji głowy — postać przemijająca", wielkoscEn: "symptom duration in the maintained new head position — transient form", kontekstPl: "1.2.1 oraz 2.2.1 — oś transient/persistent istnieje TYLKO przy objawach pozycyjnych", kontekstEn: "1.2.1 and 2.2.1 — the transient/persistent axis exists ONLY for positional symptoms" },
      { ranga: "nota", wartosc: "na ogół krócej niż 1–2 sekundy", wielkoscPl: "typowy czas trwania wrażenia opóźnienia otoczenia wzrokowego", wielkoscEn: "typical duration of the visual-lag sensation", kontekstPl: "komentarz do 3.3 visual lag", kontekstEn: "comment to 3.3 visual lag" },
      { ranga: "nota", wartosc: "sekundy do minut (epizodyczny i krótki)", wielkoscPl: "typowy czas trwania objawowego statycznego przechyłu wzrokowego przy głowie wyprostowanej", wielkoscEn: "typical duration of symptomatic static visual tilt with the head upright", kontekstPl: "komentarz do 3.4 visual tilt", kontekstEn: "comment to 3.4 visual tilt" },
      { ranga: "nota", wartosc: "90° albo 180°", wielkoscPl: "kąty przechyłu przypisywane tzw. iluzji przechylenia pokoju", wielkoscEn: "tilt angles attributed to the so-called room tilt illusion", kontekstPl: "3.4 — praca preferuje zamiast tego termin visual tilt z podaniem PRZYBLIŻONEGO kąta, nie precyzując, jak przybliżonego", kontekstEn: "3.4 — the paper prefers the term visual tilt with an APPROXIMATE angle stated, without saying how approximate" },
    ],
    granicePl: [
      "Praca NIE zawiera ani jednego kryterium rozpoznania choroby. Postaci „pewna/prawdopodobna/możliwa” w niej nie ma — definiowanie chorób to dopiero etap IC planu, opisanego w Tabeli 1.",
      "Praca NIE ma osi ośrodkowo-obwodowej. Ciąg „central” pada dwukrotnie i ani razu w funkcji reguły różnicującej. Przeciwnie: zasada 2 konsensusu mówi wprost, że żaden objaw przedsionkowy nie ma w pełni swoistego znaczenia topologicznego. Zdanie „wg tej pracy objaw X przemawia za ośrodkiem” byłoby przypisaniem treści, której źródło nie niesie.",
      "Praca NIE stawia ŻADNYCH wymagań co do badań instrumentalnych. Nie ma w niej MRI, obrazowania, próby kalorycznej, audiometrii, vHIT, VEMP ani manewru Dix-Hallpike'a. Jedyne wystąpienie SVV jest zdaniem ODGRANICZAJĄCYM (visual tilt to nie odchylenie SVV), a nie zaleceniem badania.",
      "Taksonomii „czas i wyzwalacze” w postaci AVS/EVS w tej pracy NIE MA, mimo że David E. Newman-Toker jest współautorem. Nie ma tu ani ostrego zespołu przedsionkowego, ani czerwonych flag. Praca dostarcza oś WYZWALACZA (1.2.x/2.2.x), ale nie dostarcza osi czasu PRZEBIEGU CHOROBY — jedyne progi czasowe dotyczą czasu trwania objawu w prowokowanej pozycji.",
      "Druga niespójność: komentarz do kategorii 1 nakazuje kategoryzować zawrót jako spinning, non-spinning ALBO OBOJE, ale algorytm kodowania ma tylko kod na spinning i na non-spinning — kodu łączonego nie ma, a praca nie mówi, jak „oboje” zapisać.",
      "Zapowiedziana rewizja: praca stanowi wersję 1.0 ze stycznia 2009, a mechanizm aktualizacji to dopiero etap III planu. Późniejszy dokument ICVD [H61] Kaski 2025 zapowiada dodanie do definicji zawrotu nowego podtypu (haptic vertigo) przy planowej rewizji — cytując tę definicję, trzeba nieść tę informację.",
    ],
    graniceEn: [
      "The paper contains NOT ONE disease criterion. There is no definite/probable/possible tier — defining disorders is stage IC of the plan set out in Table 1.",
      "The paper has NO central-peripheral axis. The string 'central' occurs twice and never as a discriminating rule. On the contrary, consensus principle 2 states outright that no vestibular symptom carries fully specific topological meaning. Writing 'per this paper, symptom X favours a central cause' would attribute content the source does not carry.",
      "The paper imposes NO requirements regarding instrumental testing. It contains no MRI, no imaging, no caloric test, no audiometry, no vHIT, no VEMP and no Dix-Hallpike. The single mention of SVV is a BOUNDARY statement (visual tilt is not SVV deviation), not a recommendation to test.",
      "The AVS/EVS 'timing and triggers' taxonomy is ABSENT here, even though David E. Newman-Toker is a co-author. There is no acute vestibular syndrome and no red-flag list. The paper supplies the TRIGGER axis (1.2.x/2.2.x) but not an axis of DISEASE COURSE over time — its only time thresholds concern symptom duration in the provoked position.",
      "A second inconsistency: the comment to category 1 requires vertigo to be categorised as spinning, non-spinning OR BOTH, yet the coding algorithm offers only a spinning code and a non-spinning code — there is no combined code, and the paper does not say how to record 'both'.",
      "A revision is announced: this is version 1.0 of January 2009, and the update mechanism is only stage III of the plan. The later ICVD document [H61] Kaski 2025 announces that a new subtype (haptic vertigo) will be added to the definition of vertigo at its scheduled revision — anyone quoting that definition must carry this note.",
    ],
  },
  {
    klucz: "klasyfikacjaOczoplasu",
    zrodlo: "[H51] Eggers 2019",
    typ: "ramowy",
    nazwaPl: "ICVD: klasyfikacja oczopląsu i ruchów oczopląsopodobnych",
    nazwaEn: "ICVD: classification of nystagmus and nystagmus-like movements",
    zespol: "nd",
    wSilniku: "modelowana",
    wSilnikuDowod: "pomiar 2026-08-22 w src/ gałęzi atlas-otoneurologiczny. `grep -rnoiE 'oczopląs|nystagm' src/` = 818 trafień w 34 plikach; `geotrop` = 204; `upbeat|downbeat|torsyj|torsion` = 242; `SPV|slowPhase|faza wolna` = 51; `fiksacj|fixation` = 238; `pseudoSpont|pseudo-samoistn|pseudo-spontaneous` = 5; `alexander` = 4. Sam numer [H51] w src/ = 8 trafień w trzech plikach: src/app/cpn-model.js (6 — hierarchia wskazówek ośrodkowego oczopląsu pozycyjnego zbudowana na tym źródle: pola `neuro`, `trajektoria`, `ksztalt`, `meczliwosc` z `zrodlo: ['H51']`, wiersze 29-56), src/app/atlas-model.js (1, wiersz 230) i src/render/svg-screens.js (1, wiersz 2749). Silnik liczy tor i kierunek oczopląsu, nie tylko go nazywa.",
    streszczeniePl: "Konsensusowy słownik oczopląsu Bárány Society — 69 numerowanych pozycji, każda z definicją i (w większości) komentarzem, podzielonych na oczopląs fizjologiczny, patologiczny i ruchy oczopląsopodobne. Poza samą listą praca ustala trzy warstwy nomenklatury, których wcześniej nie było zebranych w jednym miejscu: układy odniesienia i osie obrotu oka (oczny, głowowy/Reida, kanałowy, ziemski), listę atrybutów, które należy przy oczopląsie odnotować, oraz czynniki wpływające — pozycję spojrzenia, stan fiksacji, wergencję i manewry prowokacyjne. Autorzy jawnie przyznają, że schemat jest hybrydowy: miesza fenomenologię z kierunkiem, domniemaną lokalizacją i etiologią, i że żaden schemat nie mieści idealnie każdej postaci oczopląsu.",
    streszczenieEn: "The Bárány Society consensus vocabulary for nystagmus — 69 numbered entries, each with a definition and (mostly) a comment, split into physiological nystagmus, pathological nystagmus and nystagmus-like movements. Beyond the list itself, the paper fixes three layers of nomenclature not previously gathered in one place: frames of reference and eye-rotation axes (eye-, head-/Reid-, canal- and earth-referenced), the checklist of attributes a nystagmus description should carry, and the modifying factors — gaze position, fixation state, vergence and provocative manoeuvres. The authors openly concede the scheme is hybrid, mixing phenomenology with direction, presumed localisation and aetiology, and that no scheme accommodates every form of nystagmus perfectly.",
    synonimy: [
      { pl: "ageotropowy", en: "ageotropic", odradzany: true, uwagaPl: "Praca nazywa tę formę wprost BŁĘDNĄ („sometimes mistakenly called”). Poprawnie: apogeotropowy — bijący OD ziemi.", uwagaEn: "The paper calls this form outright mistaken ('sometimes mistakenly called'). The correct term is apogeotropic — beating AWAY from the earth." },
      { pl: "rotacyjny (rotary / rotatory) o ruchu torsyjnym", en: "rotary / rotatory for torsional movement", odradzany: true, uwagaPl: "Odradzany w §4: niemal każdy ruch oka jest technicznie obrotem, więc określenie nic nie rozstrzyga. Najjednoznaczniejszy opis torsji: ucho, ku któremu obraca się GÓRNY BIEGUN oka (pozycja godziny 12).", uwagaEn: "Discouraged in §4: nearly every eye movement is technically a rotation, so the label settles nothing. The least ambiguous description of torsion names the ear toward which the UPPER POLE of the eye rotates (the 12 o'clock position)." },
      { pl: "zgodnie / przeciwnie do ruchu wskazówek zegara", en: "clockwise / counterclockwise", odradzany: true, uwagaPl: "Odradzany jako częste źródło nieporozumień. Jeśli mimo to użyty — trzeba określić, o którą fazę chodzi (szybką czy wolną), i podkreślić, że perspektywa jest PACJENTA. Podpis Ryciny 3 w tej samej pracy używa „clockwise”, ale właśnie w ten sposób: z nazwaniem fazy wolnej i z dopiskiem, że perspektywa jest pacjenta — czyli zgodnie z własnym zastrzeżeniem, a nie wbrew niemu.", uwagaEn: "Discouraged as a frequent source of confusion. If used anyway, the phase must be named (fast or slow) and the perspective must be flagged as the PATIENT'S. The legend of Figure 3 in this same paper does use 'clockwise' — but in exactly that way: naming the slow phase and marking the perspective as the patient's — i.e. in line with its own proviso, not against it." },
      { pl: "wektor (zamiast toru)", en: "vector (in place of trajectory)", odradzany: true, uwagaPl: "Odradzany jako synonim „trajectory”, żeby nie mylić z pojęciem rotation vector.", uwagaEn: "Discouraged as a synonym for 'trajectory', to avoid confusion with the concept of a rotation vector." },
    ],
    kryteria: [
      {
        postac: "definicje podstawowe",
        nazwaPl: "Czym jest oczopląs, a czym nie jest", nazwaEn: "What nystagmus is, and what it is not",
        wymagane: "definicja + odgraniczenie od sakkad i oscylacji sakkadowych",
        punkty: [
          { litera: "A", pl: "Oczopląs — mimowolny, szybki, rytmiczny, oscylacyjny ruch gałek ocznych mający CO NAJMNIEJ JEDNĄ fazę wolną.", en: "Nystagmus — an oscillation of the eyes that is involuntary, rapid and rhythmic, and that carries AT LEAST ONE slow phase." },
          { litera: "B", pl: "Oczopląs skokowy (jerk) — oczopląs z fazą wolną i fazą szybką.", en: "Jerk nystagmus — nystagmus with a slow phase and a fast phase." },
          { litera: "C", pl: "Oczopląs wahadłowy (pendular) — oczopląs mający WYŁĄCZNIE fazy wolne.", en: "Pendular nystagmus — nystagmus with only slow phases." },
          { litera: "D", pl: "Odgraniczenie: intruzje i oscylacje sakkadowe to szybkie ruchy odrywające oko od celu podczas próby fiksacji przy braku nowego bodźca wzrokowego; ich pierwszym ruchem jest SAKKADA (w oczopląsie — zwykle faza wolna) i NIE mają dryfu fazy wolnej, z wyjątkiem impulsów sakkadowych.", en: "Boundary: saccadic intrusions and oscillations are fast movements that take the eye off target during attempted fixation, absent any new visual stimulus; their first movement is a SACCADE (in nystagmus, usually a slow phase) and they have NO slow-phase drift, saccadic pulses excepted." },
          { litera: "E", pl: "Termin „oczopląsopodobne” zarezerwowano dla ruchów o niepewnej naturze: spasmus nutans, oczopląs zbieżno-retrakcyjny, ocular bobbing, mioklonie mięśnia skośnego górnego i pokrewne.", en: "The label 'nystagmus-like' is reserved for movements of uncertain nature: spasmus nutans, convergence-retraction nystagmus, ocular bobbing, superior oblique myokymia and related phenomena." },
        ],
        przypisyPl: [
          "Komitet przejrzał cztery wcześniejsze definicje oczopląsu i wszystkie odrzucił. Trzy pierwsze — bo nie odróżniają oczopląsu od oscylacji sakkadowych. Czwartą — opisującą oczopląs jako powtarzalne ruchy tam i z powrotem zapoczątkowane fazami wolnymi — bo nie oddaje mimowolnego i szybkiego charakteru ruchu oraz wymaga rozstrzygnięcia, czy cykl zaczyna się fazą wolną, co przy łóżku bywa niewykonalne; przykład podany przez autorów: POŁOWA wariantów ocular bobbing/dipping jest uważana za inicjowaną fazami wolnymi, druga połowa — szybkimi.",
          "Oczopląs skokowy bywa FIZJOLOGICZNY, np. podczas naturalnego obrotu głowy — wtedy faza wolna zapewnia, a nie zaburza, stabilną fiksację.",
        ],
        przypisyEn: [
          "The committee reviewed four earlier definitions of nystagmus and rejected all of them. The first three because they fail to separate nystagmus from saccadic oscillations. The fourth — describing nystagmus as repetitive to-and-fro movements begun by slow phases — because it misses the involuntary and rapid character of the movement and demands a judgement about whether the cycle begins with a slow phase — often undecidable at the bedside; the authors' example: HALF the variants of ocular bobbing/dipping are considered slow-phase initiated, the other half fast-phase initiated.",
          "Jerk nystagmus may be PHYSIOLOGICAL, e.g. during natural head rotation — there the slow phase preserves rather than disrupts steady fixation.",
        ],
      },
      {
        postac: "układy odniesienia",
        nazwaPl: "Cztery układy odniesienia i reguły opisu kierunku", nazwaEn: "Four frames of reference and the direction-description rules",
        wymagane: "przy każdym opisie oczopląsu należy PODAĆ, którego układu się używa",
        punkty: [
          { litera: "A", pl: "Kierunek opisuje się ZAWSZE z perspektywy badanego, nie badającego: oczopląs prawobijny bije ku prawemu uchu pacjenta.", en: "Direction is ALWAYS described from the subject's perspective, not the examiner's: right-beating nystagmus beats toward the patient's right ear." },
          { litera: "B", pl: "Kierunek oczopląsu skokowego opisuje się FAZĄ SZYBKĄ. Komitet uznał tę konwencję za zbyt zakorzenioną, by ją zmieniać, mimo że faza szybka zwykle nie jest pierwotną przyczyną oczopląsu.", en: "The direction of jerk nystagmus is named after the FAST PHASE. The committee judged that convention too entrenched to change, even though it is rarely the fast phase that primarily generates the nystagmus." },
          { litera: "C", pl: "Układ oczny i głowowy stosuje się NIEZALEŻNIE od położenia głowy względem grawitacji: oczopląs bijący ku czołu w pozycji zwisu głowy Dix-Hallpike'a nadal jest bijącym w górę (upbeat), mimo że jest „w dół” względem grawitacji.", en: "Eye- and head-referenced frames apply REGARDLESS of head position relative to gravity: nystagmus beating toward the forehead in the Dix-Hallpike head-hanging position is still upbeating, even though it is 'downward' with respect to gravity." },
          { litera: "D", pl: "Układ ZIEMSKI stosuje się głównie do oczopląsu pozycyjnego, zwłaszcza poziomego: bijący ku ziemi = geotropowy, bijący od ziemi = apogeotropowy. Terminologia ta jest OGRANICZONA do badania pozycyjnego — nazwanie downbeat u osoby siedzącej „geotropowym” byłoby technicznie poprawne, ale mylące.", en: "The EARTH-referenced frame is used mainly for positional nystagmus, especially horizontal: beating toward the earth = geotropic, away from the earth = apogeotropic. This terminology is RESTRICTED to positional testing — calling downbeat nystagmus in a seated patient 'geotropic' would be technically correct but misleading." },
          { litera: "E", pl: "Współrzędne głowowe (Reida): oś +Z skierowana w górę prostopadle do poziomej płaszczyzny Reida. Płaszczyznę tę wyznaczają — obustronnie — środek wejścia do kostnego przewodu słuchowego oraz górna krawędź dolnego brzegu oczodołu (źródło stawia słowo „obustronnie” na końcu wyliczenia i nie rozstrzyga, do którego z punktów je odnieść); +Y = lewy koniec osi międzyusznej; +X do przodu wzdłuż osi nosowo-potylicznej.", en: "Head-referenced (Reid's) coordinates: +Z points upward, perpendicular to Reid's horizontal plane. That plane is fixed — bilaterally — by the mid-point of the bony ear canal opening together with the upper edge of the inferior orbital margin (the source places 'bilaterally' at the end of the list and does not settle which point it governs); +Y = the leftward end of the interaural axis; +X anterior along the naso-occipital axis." },
          { litera: "F", pl: "Układ KANAŁOWY: także +Y = lewa oś międzyuszna, ale +Z prostopadłe do średniej płaszczyzny kanału poziomego, która jest nachylona o około 20° nosem do góry względem płaszczyzny poziomej Reida.", en: "The CANAL frame: also +Y = the leftward interaural axis, but +Z perpendicular to the mean horizontal canal plane, which is pitched about 20° nose-up relative to Reid's horizontal plane." },
          { litera: "G", pl: "Wszystkie trzy składowe kierunkowe powinny być opisane wraz z układem współrzędnych — poza przypadkami, gdy pominięte składowe są bardzo małe względem największej.", en: "All three directional components should be described along with the coordinate frame — except where the omitted components are very small relative to the largest." },
        ],
        przypisyPl: [
          "Dlaczego układ kanałowy jest najoszczędniejszy — przykład podany przez autorów dla lewego kanału tylnego: ruch oka zachodzi wokół osi mniej więcej 45° od przedniego końca osi nosowo-potylicznej i od lewego końca osi międzyusznej. W układzie OCZNYM przy spojrzeniu 45° w lewo ten sam oczopląs wydaje się czysto torsyjny, a przy spojrzeniu 45° w prawo — czysto pionowy; opis zależy więc od chwilowej orientacji oka. W układzie GŁOWOWYM oczopląs ma dwie prawie równe składowe (roll i pitch), z których żadna nie wiąże się intuicyjnie ze źródłem. W układzie KANAŁOWYM jest prawie w całości wokół osi RALP.",
          "Układ odniesienia bywa narzędziem RÓŻNICUJĄCYM: oczopląs samoistny obwodowy powinien mieć stałą oś we współrzędnych GŁOWOWYCH/BŁĘDNIKOWYCH; oczopląs poziomy, który pozostaje „poziomy” w spojrzeniu w górę i w dół we współrzędnych OCZNYCH, nabiera składowej torsyjnej we współrzędnych głowowych — co sugeruje przyczynę ośrodkową, np. oczopląs niemowlęcy.",
          "Ostrzeżenie autorów: drobnych przesunięć toru zależnych od pozycji oka w oczodole nie wolno mylić ze znaczącą zmianą cech oczopląsu — choć ich obecność lub brak pomaga ustalić pochodzenie.",
          "Intorsja i ekstorsja to terminy tylko dla ruchów JEDNOOCZNYCH albo rozkojarzonych; przy torsji sprzężonej jedno oko intortuje, drugie ekstortuje, więc w układzie głowowym opisuje się to jako obrót górnego bieguna ku prawemu albo lewemu uchu.",
        ],
        przypisyEn: [
          "Why the canal frame is the most economical — the authors' worked example for the left posterior canal: the eye rotates about an axis roughly 45° from the anterior end of the naso-occipital axis and from the left end of the interaural axis. In EYE-referenced terms, with gaze 45° left the same nystagmus looks purely torsional and with gaze 45° right purely vertical, so the description depends on the momentary eye orientation. In HEAD-referenced terms it has two nearly equal components (roll and pitch), neither intuitively tied to the source. In the CANAL frame it is almost entirely about the RALP axis.",
          "The frame of reference doubles as a DISCRIMINATING tool: spontaneous peripheral vestibular nystagmus should keep a fixed axis in HEAD-/labyrinth-referenced coordinates; horizontal nystagmus that stays 'horizontal' on up- and downgaze in EYE-referenced coordinates acquires a torsional component in head coordinates — which suggests a central cause such as infantile nystagmus.",
          "The authors' warning: small trajectory shifts driven by orbital eye position must not be mistaken for a meaningful change in the nystagmus itself — though their presence or absence helps establish its origin.",
          "Intorsion and extorsion are terms for MONOCULAR or dissociated movements only; in conjugate torsion one eye intorts while the other extorts, so head-referenced description names the rotation of the upper pole toward the right or left ear.",
        ],
      },
      {
        postac: "2.1.1 oczopląs obwodowy",
        nazwaPl: "Samoistny obwodowy oczopląs przedsionkowy — pięć cech oczekiwanych", nazwaEn: "Spontaneous peripheral vestibular nystagmus — the five expected features",
        wymagane: "praca wylicza pięć cech, które taki oczopląs POWINIEN mieć; nie jest to punktacja ani reguła decyzyjna z progiem",
        punkty: [
          { litera: "1", pl: "Obuoczny i sprzężony we współrzędnych głowowych.", en: "Binocular and conjugate in head-referenced coordinates." },
          { litera: "2", pl: "Bije w jednej płaszczyźnie i jednym kierunku we współrzędnych głowowych, niezależnie od pozycji spojrzenia.", en: "Beats in a single plane and a single direction in head-referenced coordinates, regardless of gaze position." },
          { litera: "3", pl: "Spełnia prawo Alexandra.", en: "Obeys Alexander's law." },
          { litera: "4", pl: "Tłumiony przez fiksację wzrokową (nasilany przez zablokowanie fiksacji).", en: "Suppressed by visual fixation (enhanced when fixation is blocked)." },
          { litera: "5", pl: "Fazy wolne o STAŁEJ prędkości — jeśli zarejestrowany okulograficznie.", en: "Constant-velocity slow phases — if recorded oculographically." },
        ],
        przypisyPl: [
          "Tor powinien pokrywać się z przybliżoną płaszczyzną zajętego kanału (kanałów) lub ich połączeń doprowadzających. Praca wylicza trzy kombinacje toru i PRZY KAŻDEJ podaje ośrodkowego naśladowcę: poziomo-torsyjny (naśladowcy: pęczki nerwu przedsionkowego wewnątrz mostu, jądro przedsionkowe, struktury móżdżkowe), pionowo-torsyjny (przy zajęciu jednego kanału pionowego; przykład: izolowane zapalenie nerwu przedsionkowego dolnego), poziomo-pionowo-torsyjny (najczęściej zapalenie nerwu przedsionkowego górnego; naśladowca: zespół boczny opuszki).",
          "Prawo Alexandra i trzy stopnie: intensywność jest największa przy patrzeniu w kierunku faz szybkich, najmniejsza przy patrzeniu w kierunku faz wolnych. I stopnia — obecny TYLKO przy patrzeniu w kierunku fazy szybkiej; II stopnia — obecny TAKŻE w pozycji na wprost; III stopnia — obecny TAKŻE przy patrzeniu w kierunku fazy wolnej.",
          "Ostrzeżenie o nakładaniu: udar pnia mózgu lub móżdżku może czasem dać samoistny, dominująco poziomy oczopląs przedsionkowy NIEODRÓŻNIALNY od tego w ostrych westybulopatiach obwodowych.",
          "Typ hamujący (2.1.1.1) — oczopląs bije OD strony obniżonej funkcji; typ pobudzeniowy (2.1.1.2) — bije KU stronie zwiększonej aktywności. Praca dodaje wprost: z samych cech oczopląsu na ogół NIE da się rozstrzygnąć, który to typ; trzeba to wywnioskować z innych danych klinicznych, radiologicznych albo z wiedzy o patofizjologii.",
          "Oczopląs zdrowienia (2.1.1.3) odwraca kierunek po pewnym czasie (zwykle godziny lub dni) i występuje głównie wtedy, gdy faza początkowa trwa długo, a zdrowienie jest szybkie; NIE występuje zwykle, gdy oczopląs jest bardzo krótki lub napadowy.",
        ],
        przypisyEn: [
          "The affected canal(s), or their afferents, set the approximate plane that the nystagmus trajectory should match. The paper lists three trajectory combinations and gives a central mimic FOR EACH: horizontal-torsional (mimics: vestibular nerve fascicles within the pons, the vestibular nucleus, cerebellar structures), vertical-torsional (single vertical canal involvement; example: isolated inferior vestibular neuritis), horizontal-vertical-torsional (most often superior vestibular neuritis; mimic: lateral medullary syndrome).",
          "Alexander's law and the three degrees: intensity is greatest on gaze toward the fast phases and least on gaze toward the slow phases. First degree — present ONLY on gaze in the fast-phase direction; second degree — present ALSO in centre gaze; third degree — present ALSO on gaze in the slow-phase direction.",
          "Overlap warning: brainstem or cerebellar stroke can sometimes produce spontaneous, predominantly horizontal vestibular nystagmus INDISTINGUISHABLE from that of acute peripheral vestibulopathy.",
          "The inhibitory subtype (2.1.1.1) beats AWAY from the side of reduced function; the excitatory subtype (2.1.1.2) beats TOWARD the side of increased activity. The paper states outright that the nystagmus features alone generally CANNOT settle which subtype it is; that must be inferred from other clinical or radiological data, or from knowledge of the pathophysiology.",
          "Recovery nystagmus (2.1.1.3) reverses direction after a period (usually hours to days) and occurs mainly when the initial phase is long and recovery is rapid; it does NOT usually occur when the nystagmus is very brief or paroxysmal.",
        ],
      },
      {
        postac: "2.3.1.1 BPPN",
        nazwaPl: "Łagodny napadowy oczopląs pozycyjny — trzy kanały", nazwaEn: "Benign paroxysmal positional nystagmus — the three canals",
        wymagane: "oczopląs pozycyjny przypisywany BPPV; POWINIEN obracać się wokół osi prostopadłej do płaszczyzny zajętego kanału",
        punkty: [
          { litera: "PC", pl: "Kanał tylny: wywoływany PO LATENCJI JEDNEJ LUB KILKU SEKUND manewrem Dix-Hallpike'a albo manewrem na boku (diagnostycznym manewrem Semonta). Bije torsyjnie górnym biegunem oka KU UCHU NIŻEJ POŁOŻONEMU oraz pionowo KU GÓRZE (ku czołu). Kanalolitiaza: crescendo-decrescendo, czas trwania TYPOWO NIE PRZEKRACZA 40 SEKUND, kierunek MOŻE krótko odwrócić się po powrocie do siedzenia. Rzadki wariant kupulolitiazowy: krótka latencja albo jej brak, „półmanewr Dix-Hallpike'a”, trwa PONAD 1 MINUTĘ.", en: "Posterior canal: provoked AFTER A LATENCY OF ONE OR SEVERAL SECONDS by the Dix-Hallpike or the side-lying (Semont diagnostic) manoeuvre. Torsion carries the eye's upper pole TOWARD THE LOWER EAR, and the vertical component runs UPWARD (toward the forehead). In canalolithiasis the course is crescendo-decrescendo, duration TYPICALLY NOT EXCEEDING 40 SECONDS, and the direction MAY reverse briefly once the patient sits up. In the rare cupulolithiasis variant latency is brief or absent, the provoking position is the 'half Dix-Hallpike manoeuvre', and the nystagmus lasts MORE THAN 1 MINUTE." },
          { litera: "HC-geo", pl: "Kanał poziomy, postać geotropowa: wywoływana po krótkiej latencji albo bez latencji testem obrotu na plecach; bije poziomo KU UCHU NIŻEJ POŁOŻONEMU (z mniejszą składową torsyjną w tę samą stronę) przy obrocie w każdą stronę; trwa zwykle OKOŁO 1 MINUTY (zakres ~30–90 SEKUND); jest INTENSYWNIEJSZA przy głowie obróconej KU UCHU CHOREMU. Przypisywana kanalolitiazie.", en: "Horizontal canal, geotropic form: provoked with brief or no latency by the supine roll test; the horizontal component runs TOWARD THE LOWER EAR (a smaller torsional component runs the same way) whichever way the head is turned; it generally lasts ABOUT 1 MINUTE (range ~30–90 SECONDS) and is MORE INTENSE with the head turned TOWARD THE AFFECTED EAR. Attributed to canalolithiasis." },
          { litera: "HC-apo", pl: "Kanał poziomy, postać apogeotropowa: bije poziomo KU UCHU WYŻEJ POŁOŻONEMU; intensywność narasta powoli przez OKOŁO 30 SEKUND, a potem stopniowo opada przez dłuższy okres KILKU MINUT; jest zwykle silniejsza przy głowie obróconej OD UCHA CHOREGO. Przypisywana GENERALNIE kupulolitiazie — ale może wystąpić także w kanalolitiazie kanału poziomego i wtedy szybko przejść w postać geotropową podczas testu obrotu.", en: "Horizontal canal, apogeotropic form: the horizontal component runs TOWARD THE UPPER EAR; intensity climbs slowly over ABOUT 30 SECONDS and then fades across a longer span of SEVERAL MINUTES; turning the head AWAY FROM THE AFFECTED EAR usually makes it stronger. Attributed GENERALLY to cupulolithiasis — yet the source also allows horizontal-canal canalolithiasis, where the picture may switch quickly into the geotropic form while the roll test is under way." },
          { litera: "AC", pl: "Kanał przedni: wywoływany NATYCHMIAST albo po latencji jednej lub kilku sekund manewrem Dix-Hallpike'a ALBO w pozycji leżącej na plecach z prostym zwisem głowy. Bije DOMINUJĄCO W DÓŁ, z małą składową torsyjną, w której górny biegun oka bije KU UCHU CHOREMU. Rzadki wariant, POWINIEN trwać KRÓCEJ NIŻ 1 MINUTĘ podczas badania pozycyjnego, MUSI być odróżniony od ośrodkowego oczopląsu pozycyjnego; bywa apogeotropowym wariantem BPPV kanału tylnego.", en: "Anterior canal: elicited IMMEDIATELY or after a latency of one or several seconds by the Dix-Hallpike manoeuvre OR in the supine straight head-hanging position. It beats PREDOMINANTLY DOWNWARD with a small torsional component whose upper pole beats TOWARD THE AFFECTED EAR. A rare variant; it SHOULD last LESS THAN 1 MINUTE during positional testing and MUST be distinguished from central positional nystagmus; it may be an apogeotropic variant of posterior canal BPPV." },
          { litera: "pseudo", pl: "Oczopląs pseudo-samoistny (2.3.1.1.2.1): poziomy oczopląs skokowy przy głowie w pozycji wyprostowanej, wtórny do kanalo- albo kupulolitiazy kanału poziomego, przypisywany 30° NACHYLENIU między kanałem poziomym a poziomą płaszczyzną grawitacyjną. POWINIEN ZNIKNĄĆ po pochyleniu głowy 30° DO PRZODU i POWINIEN ODWRÓCIĆ KIERUNEK przy dalszym pochyleniu. W typie apogeotropowym bije generalnie KU UCHU CHOREMU; w typie geotropowym — ku KTÓREMUKOLWIEK uchu.", en: "Pseudo-spontaneous nystagmus (2.3.1.1.2.1): horizontal jerk nystagmus with the head upright, secondary to canalo- or cupulolithiasis of the horizontal canal, and ascribed to the 30° tilt that separates that canal from earth-horizontal while the subject sits up. It SHOULD VANISH once the head is pitched 30° FORWARD and SHOULD REVERSE with further forward pitch. In the apogeotropic type the beat generally runs TOWARD THE AFFECTED EAR; in the geotropic type, toward EITHER ear." },
        ],
        przypisyPl: [
          "Efekt fiksacji i pozycji spojrzenia przy BPPN kanału tylnego: jeśli fiksacja NIE jest zablokowana, oczopląs może wyglądać dominująco TORSYJNIE, bo fiksacja tłumi składową pionową silniej niż torsyjną. Spojrzenie ku uchu niżej położonemu → oczopląs wydaje się głównie torsyjny; spojrzenie ku uchu wyżej położonemu → głównie pionowy. Niezależnie od pozycji oka w oczodole, we współrzędnych głowowych ruch zachodzi wokół osi prostopadłej do płaszczyzny kanału tylnego.",
          "„Półmanewr Dix-Hallpike'a” wykonuje się z głową spoczywającą NIECO UNIESIONĄ znad pozycji leżącej na plecach; ta pozycja najlepiej ustawia zajęty osklepek równolegle do poziomu ziemi, by był maksymalnie odchylany grawitacją.",
          "Metodologia testu obrotu na plecach: intensywność jest większa, a latencja krótsza przy WIĘKSZYCH i SZYBSZYCH obrotach głowy — dlatego kąt netto i przyspieszenie obrotu POWINNY być podobne w prawo i w lewo, żeby dało się w ogóle porównać intensywność. Zastrzeżenie to praca powtarza przy obu postaciach, geotropowej i apogeotropowej.",
          "Bow i lean opisane WYŁĄCZNIE przy postaci geotropowej: zgięcie głowy o 90° do przodu w pozycji siedzącej („bow”) MOŻE wywołać przemijający oczopląs bijący KU UCHU CHOREMU, a patrzenie w górę lub odchylanie się do tyłu („lean”) MOŻE sprowokować przemijający oczopląs bijący KU UCHU ZDROWEMU.",
          "„Lying down nystagmus” opisany WYŁĄCZNIE przy postaci apogeotropowej: słaby, utrwalony oczopląs bijący KU UCHU CHOREMU w pozycji leżącej na plecach, ustępujący po lekkim obróceniu głowy w tę stronę.",
        ],
        przypisyEn: [
          "Effect of fixation and gaze position in posterior canal BPPN: if fixation is NOT blocked the nystagmus may look predominantly TORSIONAL, because fixation suppresses the vertical component more than the torsional. Gaze toward the undermost ear → it appears mainly torsional; gaze toward the uppermost ear → mainly vertical. Independent of orbital eye position, in head coordinates the movement occurs about an axis perpendicular to the posterior canal plane.",
          "The 'half Dix-Hallpike manoeuvre' has the head SLIGHTLY RAISED above the supine plane; that position brings the affected cupula closest to earth-horizontal, where gravity deflects it most strongly.",
          "Supine roll test methodology: bigger and quicker head turns yield MORE INTENSE nystagmus after a SHORTER latency — so the net angle and the acceleration of the turn SHOULD match to the right and to the left, or the two intensities cannot be compared at all. The source repeats this caveat under both the geotropic and the apogeotropic form.",
          "Bow and lean are described ONLY under the geotropic form: bending the head 90° forward while seated ('bow') MAY bring on a transient beat TOWARD THE AFFECTED EAR, whereas looking up or reclining backwards ('lean') MAY bring on a transient beat TOWARD THE HEALTHY EAR.",
          "'Lying down nystagmus' is described ONLY under the apogeotropic form: a weak, sustained nystagmus beating TOWARD THE AFFECTED EAR in the supine position, resolving on turning the head slightly to that side.",
        ],
      },
      {
        postac: "2.3.1.3 ośrodkowy oczopląs pozycyjny",
        nazwaPl: "Ośrodkowy oczopląs pozycyjny — cztery wskazówki", nazwaEn: "Central positional nystagmus — four pointers",
        wymagane: "cztery wskazówki opisowe, gdy brak innych objawów neurologicznych i okoruchowych; praca nie nadaje im punktacji ani progu",
        punkty: [
          { litera: "1", pl: "Oczopląs może mieć DOWOLNY tor, ale czysto bijący w dół (downbeat) i czysto poziomy są ZNACZNIE CZĘSTSZE niż upbeat, torsyjny lub mieszany.", en: "The nystagmus may take ANY trajectory, but purely downbeating and purely horizontal forms are MUCH MORE COMMON than upbeat, torsional or mixed." },
          { litera: "2", pl: "Oczopląs pozycyjny, którego tor nie pokrywa się z żadnym kanałem półkolistym we współrzędnych głowowych — np. czysto pionowy albo czysto torsyjny, POD WARUNKIEM ZABLOKOWANIA FIKSACJI — SUGERUJE chorobę ośrodkowego układu nerwowego.", en: "Positional nystagmus whose trajectory matches no semicircular canal in head coordinates — e.g. purely vertical or purely torsional, PROVIDED FIXATION IS BLOCKED — SUGGESTS central nervous system disease." },
          { litera: "3", pl: "Brak męczliwości po powtarzanych badaniach pozycyjnych ALBO brak ustąpienia po właściwych manewrach repozycji otokoniów SUGERUJE przyczynę ośrodkową.", en: "Absence of fatigability on repeated positional testing OR failure to resolve after appropriate otoconia-repositioning procedures SUGGESTS a central cause." },
          { litera: "4", pl: "Intensywny oczopląs pozycyjny z NIEWIELKIM LUB ŻADNYM wrażeniem zawrotu też może sugerować przyczynę ośrodkową.", en: "Intense positional nystagmus with LITTLE OR NO sensation of vertigo may likewise suggest a central cause." },
        ],
        przypisyPl: [
          "Wymienione przyczyny: zwyrodnienie móżdżku, stwardnienie rozsiane, nowotwór tylnego dołu, malformacja Chiariego, udar, migrena przedsionkowa, zespół paranowotworowy.",
          "Pozycyjny downbeat jest SZCZEGÓLNIE PRAWDOPODOBNIE ośrodkowy — ale mała składowa torsyjna z górnym biegunem oka bijącym ku uchu choremu MOŻE SUGEROWAĆ BPPN kanału przedniego.",
          "Ośrodkowy poziomy oczopląs pozycyjny, zwłaszcza apogeotropowy, bywa NIEODRÓŻNIALNY PRZY ŁÓŻKU od oczopląsu BPPV kanału poziomego. Trzy podane różnice: intensywność ośrodkowa jest typowo największa NA POCZĄTKU i opada wykładniczo, zamiast stopniowo narastać przez 10–20 sekund jak w kupulolitiazie kanału poziomego; przy zniesionej fiksacji pacjenci mają zwykle TAKŻE niskointensywny poziomy ośrodkowy oczopląs przedsionkowy, podobny w pozycji siedzącej i leżącej; intensywność apogeotropowego oczopląsu ośrodkowego jest zwykle PODOBNA po obu stronach, inaczej niż w apogeotropowym BPPN kanału poziomego.",
        ],
        przypisyEn: [
          "Causes listed: cerebellar degeneration, multiple sclerosis, posterior fossa tumour, Chiari malformation, stroke, vestibular migraine, paraneoplastic syndrome.",
          "Positional downbeat is PARTICULARLY LIKELY to be central — but a small torsional component with the upper pole beating toward the affected ear MAY SUGGEST anterior canal BPPN.",
          "Central horizontal positional nystagmus, especially apogeotropic, can be INDISTINGUISHABLE AT THE BEDSIDE from horizontal canal BPPV. Three differences are given: central intensity is typically greatest AT ONSET and decays exponentially, rather than building over 10–20 seconds as in horizontal canal cupulolithiasis; with fixation removed patients usually ALSO show low-intensity horizontal central vestibular nystagmus, similar seated and supine; the intensity of apogeotropic central nystagmus is usually SIMILAR on both sides, unlike apogeotropic horizontal canal BPPN.",
        ],
      },
      {
        postac: "2.3.2 HSN",
        nazwaPl: "Oczopląs po potrząsaniu głową — technika i interpretacja", nazwaEn: "Headshaking-induced nystagmus — technique and interpretation",
        wymagane: "oczopląs wyzwalany i występujący PO powtarzalnym potrząsaniu głową",
        punkty: [
          { litera: "A", pl: "Badany wyprostowany (siedzący albo stojący).", en: "The subject is upright (seated or standing)." },
          { litera: "B", pl: "Energiczne potrząsanie głową W POZIOMIE z częstotliwością OKOŁO 2 Hz.", en: "Vigorous HORIZONTAL headshaking at ABOUT 2 Hz." },
          { litera: "C", pl: "NAJLEPIEJ z głową pochyloną 30° DO PRZODU, by ustawić kanały poziome w płaszczyźnie obrotu głowy.", en: "PREFERABLY with the head pitched 30° FORWARD, to align the horizontal canals with the plane of head rotation." },
          { litera: "D", pl: "Przez OKOŁO 20 CYKLI, a następnie NAGŁE zatrzymanie i obserwacja w poszukiwaniu oczopląsu skokowego.", en: "For ABOUT 20 CYCLES, then an ABRUPT stop, watching for jerk nystagmus." },
        ],
        przypisyPl: [
          "Jeśli badający porusza głową OKRĘŻNIE lub eliptycznie zamiast tam i z powrotem, wywoła oczopląs POOBROTOWY (1.3), a nie HSN.",
          "Interpretacja: HSN może być JEDNOFAZOWY i w jednostronnym HAMUJĄCYM uszkodzeniu przedsionkowym zwykle bije KU UCHU LEPSZEMU. Czasem po pierwszej fazie następuje SŁABSZA DRUGA FAZA bijąca ku stronie niedoczynnej, zanikająca wolniej.",
          "Potrząsanie w PIONIE może dawać oczopląs bijący KU UCHU NIEDOWŁADNEMU, przez aktywację kanału tylnego wnoszącego składową poziomą.",
          "HSN może też występować w zaburzeniach OŚRODKOWYCH — może tam bić KU STRONIE USZKODZENIA, szybko odwracać kierunek albo wykazywać oczopląs skrzyżowany (2.3.3).",
        ],
        przypisyEn: [
          "Should the examiner swing the head round in a CIRCLE or an ellipse rather than to and fro, what follows is POST-ROTATIONAL nystagmus (1.3), not HSN.",
          "Interpretation: HSN can be MONOPHASIC, and where one labyrinth is INHIBITED it usually runs TOWARD THE BETTER EAR. A WEAKER SECOND PHASE sometimes follows, running toward the hypofunctional side and fading more slowly than the first.",
          "Shake the head VERTICALLY and the nystagmus that results may beat TOWARD THE PARETIC EAR: the posterior canal is activated, and that contributes a horizontal component.",
          "HSN also occurs in CENTRAL vestibular disorders — where it may beat TOWARD THE SIDE OF THE LESION, reverse direction rapidly, or show cross-coupling (2.3.3).",
        ],
      },
      {
        postac: "atrybuty i fiksacja",
        nazwaPl: "Co należy odnotować przy każdym oczopląsie", nazwaEn: "What to record for any nystagmus",
        wymagane: "lista kontrolna Tabeli 2 (13 wierszy) plus warunki fiksacji",
        punkty: [
          { litera: "A", pl: "Tor (oś i płaszczyzna obrotu oraz kierunek w pozycji na wprost, ze składowymi poziomą, pionową i torsyjną), obuoczność, sprzężenie, prędkość, kształt fali, częstotliwość, intensywność, wpływ spojrzenia ekscentrycznego, efekt konwergencji, wpływ dopuszczenia vs zablokowania fiksacji, efekt manewrów prowokacyjnych, wiek pierwszego pojawienia się, profil czasowy.", en: "Trajectory (axis and plane of rotation plus direction in centre gaze, with horizontal, vertical and torsional components), binocularity, conjugacy, velocity, waveform, frequency, intensity, the effect of eccentric gaze, the effect of convergence, the effect of allowing vs blocking fixation, the effect of provocative manoeuvres, age of first appearance, and temporal profile." },
          { litera: "B", pl: "Prędkość FAZY WOLNEJ w stopniach na sekundę jest najbardziej użyteczną zmienną pomiarową do ilościowego ujęcia intensywności; przy łóżku ocenia się ją pośrednio, łącząc częstotliwość i amplitudę.", en: "SLOW-PHASE velocity in degrees per second is the most useful measured variable for quantifying intensity; at the bedside it is estimated indirectly by combining frequency and amplitude." },
          { litera: "C", pl: "Sama amplituda mało wnosi: oczopląs drobnoamplitudowy o wysokiej częstotliwości może mieć TĘ SAMĄ prędkość co gruboamplitudowy o niskiej częstotliwości.", en: "Amplitude alone adds little: a fine, high-frequency nystagmus may have THE SAME velocity as a coarse, low-frequency one." },
          { litera: "D", pl: "Trzy warunki fiksacji: fiksacja obuoczna, zasłonięcie jednooczne, zasłonięcie obuoczne. Siedem metod blokowania fiksacji: zamknięcie/zasłonięcie jednego oka, oftalmoskopia okluzyjna, test latarka-zasłonięcie, technika Ganzfeld, okulary Frenzla, ciemność (gogle wideo w podczerwieni albo elektrookulografia), zamknięcie powiek.", en: "Three fixation conditions: binocular fixation, monocular cover, binocular cover. Seven methods of blocking fixation: closing/covering one eye, occlusion ophthalmoscopy, the penlight-cover test, the Ganzfeld technique, Frenzel goggles, darkness (infrared video goggles or electro-oculography), and eyelid closure." },
        ],
        przypisyPl: [
          "Zastrzeżenie do fiksacji: zdolność do fiksacji zależy od wyjściowej ostrości wzroku (oko niewidome nie fiksuje, nawet otwarte i niezasłonięte) oraz od stanów jak ezotropia naprzemienna. Sam fakt, że oboje oczu są otwarte i niezasłonięte, NIE oznacza automatycznie stanu fiksacji obuocznej.",
          "Próba fiksacji może wpływać na ruchy oczu NAWET W CAŁKOWITEJ CIEMNOŚCI, jeśli pacjent zostanie poproszony o wyobrażenie sobie celu wzrokowego.",
          "Profil czasowy obejmuje wygaszanie (damping), przebieg crescendo-decrescendo (przykład podany przez autorów: oczopląs BPPV) oraz męczliwość, czyli słabnięcie przy powtarzanych manewrach prowokacyjnych.",
          "Przy oczopląsie wyzwalanym (2.3) należy określić wyzwalacz i odnotować, czy oczopląs jest obecny podczas fiksacji, czy tylko przy zablokowanej fiksacji lub czy się wtedy nasila. Choć przy ocenie oczopląsu pozycyjnego zwykle nie jest to niezbędne, zablokowanie fiksacji jest CZĘSTO KONIECZNE, by wywołać oczopląs przy potrząsaniu głową, dźwięku, próbie Valsalvy, ciśnieniu, wibracji lub hiperwentylacji.",
        ],
        przypisyEn: [
          "Caveat on fixation: the ability to fixate depends on baseline visual acuity (a blind eye does not fixate, even open and uncovered) and on conditions such as alternating esotropia. The mere fact that both eyes are open and uncovered does NOT automatically mean binocular fixation.",
          "Attempted fixation can influence eye movements EVEN IN COMPLETE DARKNESS if the patient is asked to imagine a visual target.",
          "The temporal profile covers damping, a crescendo-decrescendo course (the authors' example: BPPV nystagmus), and fatigability, i.e. waning on repeated provocative manoeuvres.",
          "For triggered nystagmus (2.3), the trigger must be specified and it must be recorded whether the nystagmus is present during fixation, or only when fixation is blocked, or whether it is enhanced then. Although usually unnecessary for positional testing, blocking fixation is OFTEN NECESSARY to elicit nystagmus on headshaking, sound, Valsalva, pressure, vibration or hyperventilation.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "zwykle co 90 do 120 sekund", wielkoscPl: "typowy okres spontanicznego odwrócenia kierunku w oczopląsie okresowo naprzemiennym (PAN)", wielkoscEn: "typical period of spontaneous direction reversal in periodic alternating nystagmus (PAN)", kontekstPl: "2.1.2.1.2", kontekstEn: "2.1.2.1.2" },
      { ranga: "kryterium", wartosc: "jedna lub kilka sekund", wielkoscPl: "latencja BPPN kanału tylnego", wielkoscEn: "latency of posterior canal BPPN", kontekstPl: "2.3.1.1.1 (Dix-Hallpike albo manewr na boku)", kontekstEn: "2.3.1.1.1 (Dix-Hallpike or side-lying manoeuvre)" },
      { ranga: "nota", wartosc: "typowo nie przekracza 40 sekund", wielkoscPl: "czas trwania oczopląsu w kanalolitiazie kanału tylnego", wielkoscEn: "nystagmus duration in posterior canal canalolithiasis", kontekstPl: "2.3.1.1.1", kontekstEn: "2.3.1.1.1" },
      { ranga: "nota", wartosc: "> 1 minuty", wielkoscPl: "czas trwania oczopląsu w kupulolitiazie kanału tylnego (półmanewr Dix-Hallpike'a)", wielkoscEn: "nystagmus duration in posterior canal cupulolithiasis (half Dix-Hallpike manoeuvre)", kontekstPl: "2.3.1.1.1", kontekstEn: "2.3.1.1.1" },
      { ranga: "nota", wartosc: "około 1 minuta (zakres około 30–90 sekund)", wielkoscPl: "czas trwania geotropowego oczopląsu kanału poziomego", wielkoscEn: "duration of geotropic horizontal canal nystagmus", kontekstPl: "2.3.1.1.2", kontekstEn: "2.3.1.1.2" },
      { ranga: "nota", wartosc: "około 30 sekund, potem stopniowy zanik przez kilka minut", wielkoscPl: "czas powolnego narastania intensywności w apogeotropowym oczopląsie kanału poziomego", wielkoscEn: "build-up time of apogeotropic horizontal canal nystagmus", kontekstPl: "2.3.1.1.2 — rozjazd z wartością 10–20 sekund podaną w 2.3.1.3", kontekstEn: "2.3.1.1.2 — inconsistent with the 10–20 seconds given in 2.3.1.3" },
      { ranga: "nota", wartosc: "10–20 sekund", wielkoscPl: "czas stopniowego narastania w kupulolitiazie kanału poziomego, wg sekcji o oczopląsie ośrodkowym", wielkoscEn: "gradual build-up time in horizontal canal cupulolithiasis, per the central-nystagmus section", kontekstPl: "2.3.1.3 — ta sama wielkość co wyżej, inna liczba; praca różnicy nie tłumaczy", kontekstEn: "2.3.1.3 — the same quantity as above, a different number; the paper does not explain the discrepancy" },
      { ranga: "kryterium", wartosc: "fale prostokątne: amplituda < 2 stopni, odstęp międzysakkadowy 200–400 ms, częstotliwość < 2 Hz; makrofale: amplituda > 5 stopni, 2–3 Hz, odstęp 70–150 ms", wielkoscPl: "parametry fal prostokątnych i makrofal prostokątnych", wielkoscEn: "parameters of square-wave jerks and macro square-wave jerks", kontekstPl: "3.1.1 — próg < 2 Hz odnosi się w źródle do postaci PRAWIE CIĄGŁEJ, nazywanej oscylacjami prostokątnymi, a nie do fal prostokątnych w ogóle", kontekstEn: "3.1.1 — the < 2 Hz figure applies in the source to the NEARLY CONTINUOUS form, called square-wave oscillations, not to square-wave jerks in general" },
    ],
    granicePl: [
      "Praca NIE podaje algorytmu ani punktacji różnicowania ośrodkowe/obwodowe. Podaje LISTY CECH (pięć cech oczopląsu obwodowego w 2.1.1, wskazówki ośrodkowe w 2.1.2.1.1 i cztery w 2.3.1.3) — jako cechy OPISOWE, nie jako regułę decyzyjną z progiem.",
      "Ciąg „HINTS” — 0 trafień. Praca nie wspomina HINTS ani żadnego zestawu badań przyłóżkowych pod nazwą własną, mimo że David E. Newman-Toker jest współautorem. Ciąg „sensitivity” = 0, „specificity” = 0: praca nie podaje ŻADNYCH parametrów trafności diagnostycznej.",
      "Praca NIE podaje ŻADNEGO progu prędkości w stopniach na sekundę — ani dla HSN, ani dla oczopląsu samoistnego, ani dla żadnej innej postaci. Wyrażenie „degrees per second” pada raz, jako definicja jednostki prędkości fazy wolnej.",
      "Praca NIE mówi, że apogeotropowy oczopląs kanału poziomego RÓWNA SIĘ kupulolitiazie. Mówi, że przypisuje się ją kupulolitiazie GENERALNIE, i od razu dopuszcza kanalolitiazę kanału poziomego z szybką konwersją do postaci geotropowej. Ciąg „canal switch” — 0 trafień; słowo „convert” pada dwa razy i ani razu nie oznacza przeskoku otokoniów do innego kanału.",
      "Praca NIE mówi, że oczopląs pozycyjny czysto pionowy albo czysto torsyjny JEST ośrodkowy — mówi, że taki tor SUGERUJE chorobę ośrodkowego układu nerwowego, i dodaje warunek: fiksacja musi być zablokowana. Warunek jest częścią zdania i nie wolno go odciąć.",
      "Rozjazd wewnętrzny numer jeden: narastanie apogeotropowego oczopląsu kanału poziomego opisano raz jako „około 30 sekund” (2.3.1.1.2), a raz jako „10–20 sekund” (2.3.1.3). Praca różnicy nie tłumaczy; cytując, trzeba podać obie liczby z numerem sekcji.",
    ],
    graniceEn: [
      "The paper gives NO algorithm and NO score for central-versus-peripheral discrimination. It gives LISTS OF FEATURES (five features of peripheral nystagmus at 2.1.1, central pointers at 2.1.2.1.1, and four at 2.3.1.3) — as DESCRIPTIVE features, not as a decision rule with a threshold.",
      "The string 'HINTS' — 0 hits. The paper mentions neither HINTS nor any named bedside battery, even though David E. Newman-Toker is a co-author. 'sensitivity' = 0, 'specificity' = 0: the paper reports NO diagnostic accuracy figures whatsoever.",
      "The paper gives NO velocity threshold in degrees per second — not for HSN, not for spontaneous nystagmus, not for any form. 'degrees per second' appears once, defining the unit of slow-phase velocity.",
      "The paper does NOT say that apogeotropic horizontal canal nystagmus EQUALS cupulolithiasis. It says the attribution to cupulolithiasis holds GENERALLY, and immediately allows horizontal canalolithiasis with rapid conversion to the geotropic form. The string 'canal switch' — 0 hits; 'convert' appears twice and never means otoconia jumping to another canal.",
      "The paper does NOT say that purely vertical or purely torsional positional nystagmus IS central — it says such a trajectory SUGGESTS central nervous system disease, and attaches a condition: fixation must be blocked. That condition is part of the sentence and must not be severed from it.",
      "Internal discrepancy one: the build-up of apogeotropic horizontal canal nystagmus is given once as 'approximately 30 seconds' (2.3.1.1.2) and once as '10–20 seconds' (2.3.1.3). The paper does not explain the difference; when quoting, give both numbers with their section numbers.",
    ],
  },
  {
    klucz: "ramyICVD",
    zrodlo: "[H61] Kaski 2025",
    typ: "ramowy",
    nazwaPl: "ICVD: architektura klasyfikacji i samoocena komitetu",
    nazwaEn: "ICVD: the architecture of the classification and the committee's self-assessment",
    zespol: "nd",
    wSilniku: "kryteria-bez-modelu",
    wSilnikuDowod: "pomiar 2026-08-22 w src/ gałęzi atlas-otoneurologiczny. `grep -rnoE '\\bAVS\\b|\\bEVS\\b|\\bCVS\\b' src/` = 162 trafienia w 11 plikach (najwięcej src/render/svg-screens.js = 71, src/engine/neuro-vor.js = 26, src/app/triage-model.js = 25, src/app/atlas-model.js = 13); `t-EVS|s-EVS` = 46; `icvd` = 64; `zespół przedsionkow|vestibular syndrome` = 34; `\\bCVS\\b` = 18. Sam numer [H61] w src/ = 9 trafień w trzech plikach: src/app/triage-model.js (6 — wiersze 27, 51, 246, 372, 381, 382), src/app/atlas-model.js (2), src/app/state.js (1). Trzy zespoły kardynalne z progami czasowymi napędzają routing kwalifikacji, a próg CVS zacytowano w komentarzu dosłownie (triage-model.js:372 — fragment „a minimum of 3 months”) i CVS ma własny węzeł kwalifikacji (triage-model.js:372-382). Silnik jednak niczego z tej pracy NIE LICZY: sam plik triage-model.js:381 stwierdza „Silnik OTOREPO żadnej z tych jednostek nie modeluje” o ścieżce CVS. Oś zespołów jest strukturą decyzyjną, nie modelem fizycznym ani obrazowym.",
    streszczeniePl: "Praca stanowiskowa Komitetu Klasyfikacyjnego Bárány Society, napisana ponad 15 lat po rozpoczęciu projektu w 2007 roku. Nie jest dokumentem kryteriów — nie zawiera ani jednej litery kryterium ani progu dla jakiejkolwiek jednostki. Robi dwie rzeczy: opisuje czterowarstwową architekturę ICVD (objawy i oznaki, zespoły kliniczne, choroby i zaburzenia, mechanizmy patofizjologiczne) wraz z definicjami trzech zespołów kardynalnych rozróżnianych czasem trwania objawów, oraz — co cenniejsze — wylicza wprost słabości, krytyki i luki, które komitet dostrzega we własnym dziele. To stąd pochodzi oś AVS / EVS / CVS, po której atlas jest linkowany z kwalifikacji.",
    streszczenieEn: "A position paper by the Bárány Society Classification Committee, written more than 15 years after the project began in 2007. It is not a criteria document — it contains not a single criterion letter or threshold for any entity. It does two things: it describes the ICVD's four-layer architecture (symptoms and signs; clinical syndromes; diseases and disorders; pathophysiological mechanisms), including the definitions of the three cardinal syndromes distinguished by symptom duration; and — more valuably — it sets out plainly the weaknesses, criticisms and gaps the committee sees in its own work. This is the source of the AVS / EVS / CVS axis by which the atlas is linked from triage.",
    synonimy: [
      { pl: "AUPV / AUVP (ostra jednostronna westybulopatia obwodowa)", en: "AUPV / AUVP (acute unilateral peripheral vestibulopathy)" },
      { pl: "zawrót haptyczny (haptic vertigo)", en: "haptic vertigo" },
      { pl: "zawroty szyjnopochodne (cervical dizziness)", en: "cervical dizziness", odradzany: true, uwagaPl: "Jednostka ODRZUCONA. Po gruntownej ocenie komitet opublikował position paper przedstawiający ograniczenia definiowania tego stanu, a nie kryteria — powodem były niewystarczające dowody na odrębną chorobę łączącą iluzoryczne wrażenia ruchu własnego z bólem szyi lub oznakami pierwotnej choroby szyi. Zalecenie: testować koncepcję dalej w dedykowanych badaniach.", uwagaEn: "A REJECTED entity. After thorough assessment the committee published a position paper on the limitations of defining the condition rather than criteria — the evidence was judged insufficient to support a distinct disorder linking illusory self-motion to neck pain or signs of primary neck disease. The recommendation: test the concept further in dedicated research." },
      { pl: "rozpoznanie z wykluczenia", en: "diagnosis of exclusion", odradzany: true, uwagaPl: "Praca prostuje najczęstsze nieporozumienie wprost: kryterium „nie lepiej wyjaśnione innym zaburzeniem”, obecne we WSZYSTKICH ISTNIEJĄCYCH definicjach ICVD i zapożyczone z Międzynarodowej Klasyfikacji Bólów Głowy, NIE oznacza, że rozpoznania ICVD stawia się procesem „rule-out” ani że są to rozpoznania z wykluczenia. Kryterium podkreśla konieczność ROZWAŻENIA istotnych rozpoznań różnicowych.", uwagaEn: "The paper corrects the commonest misreading outright: the criterion 'not better accounted for by another disorder', present in ALL EXISTING ICVD definitions and borrowed from the International Classification of Headache Disorders, does NOT mean ICVD diagnoses are made by a 'rule-out' process or that they are diagnoses of exclusion. The criterion stresses the need to CONSIDER the relevant differential diagnoses." },
    ],
    kryteria: [
      {
        postac: "warstwy",
        nazwaPl: "Czterowarstwowa architektura ICVD", nazwaEn: "The ICVD's four-layer architecture",
        wymagane: "cztery warstwy; użytkownik może wejść w klasyfikację z DOWOLNEGO punktu",
        punkty: [
          { litera: "I", pl: "Objawy i oznaki. Zawiera definicje swoistych objawów przedsionkowych; była fundamentem wszystkich późniejszych definicji.", en: "Symptoms and signs. It holds the definitions of specific vestibular symptoms and was the foundation for every subsequent definition." },
          { litera: "II", pl: "Zespoły kliniczne — trzy zespoły kardynalne rozróżniane czasem trwania objawów.", en: "Clinical syndromes — three cardinal syndromes distinguished by symptom duration." },
          { litera: "III", pl: "Choroby i zaburzenia. WSZYSTKIE definicje tej warstwy zbudowano z objawów i oznak zdefiniowanych w Warstwie I; NIEKTÓRE wprost włączają zespoły z Warstwy II.", en: "Diseases and disorders. ALL definitions in this layer are built from the symptoms and signs defined in Layer I; SOME explicitly incorporate the syndromes of Layer II." },
          { litera: "IV", pl: "Mechanizmy patoanatomiczne, patofizjologiczne i etiologiczne. Ostatnia warstwa do pełnego rozwinięcia — z powodu obecnych ograniczeń w rozumieniu patofizjologii wielu zaburzeń przedsionkowych — a zarazem ta, która ma rozwinąć się najbardziej.", en: "Pathoanatomic, pathophysiological and aetiological mechanisms. The last layer to be fully developed — owing to current limits in understanding the pathophysiology of many vestibular disorders — and at the same time the one expected to grow most." },
        ],
        przypisyPl: [
          "Dlaczego odrzucono klasyfikację jednowymiarową: schemat wzdłuż JEDNEGO wymiaru — na przykład ośrodkowa vs obwodowa lokalizacja uszkodzenia albo obecność/brak objawów towarzyszących — nie oddałby adekwatnie złożoności obrazów chorobowych. Analogia podana przez autorów: psychiatria i neurologia bólów głowy, czyli dziedziny opierające się na rozpoznaniu zespołowym z objawów, gdzie dla większości zdefiniowanych zespołów nie ma testów potwierdzających.",
          "Struktura pozwala wprowadzać nowe odkrycia bez reorganizacji całego systemu kryteriów.",
          "Warstwa IV — przykłady wymienione wprost przez autorów: modele mechaniczne lub symulacje komputerowe w BPPV, mutacje genetyczne w zespołach ataktycznych, oraz to, co niedawno pokazano dla oczopląsu bijącego w dół.",
          "Warstwa III, przykłady elementów instrumentalnych w kryteriach podane w tej pracy: choroba Ménière'a — fluktuujący niedosłuch w zakresie NISKICH częstotliwości w audiogramie; rozszczep kanału półkolistego górnego — ujemne progi przewodnictwa kostnego ALBO wzmocnione przedsionkowe miogenne potencjały wywołane ALBO ruchy gałek ocznych wywołane ciśnieniem w płaszczyźnie zajętego kanału. Trzy elementy SCDS stoją w ALTERNATYWIE, nie w koniunkcji, a praca nie podaje przy nich żadnych progów liczbowych.",
          "Warstwa III, część jednostek opiera się WYŁĄCZNIE na wywiadzie — praca podaje jeden przykład: migrenę przedsionkową — uzasadnieniem jest brak jakichkolwiek testów diagnostycznych w chwili pisania.",
        ],
        przypisyEn: [
          "Why a one-dimensional classification was rejected: built along a SINGLE dimension — central versus peripheral lesion site, say, or whether accompanying symptoms are there or not — a scheme would fail to do justice to how complex these presentations are. The authors' analogy: psychiatry and headache neurology, fields resting on symptom-driven syndromic diagnosis where most defined syndromes have no confirmatory test.",
          "The structure lets new findings feed into the system without reorganising the whole body of criteria.",
          "Layer IV — examples named outright by the authors: mechanical models or computer simulations in BPPV, genetic mutations in ataxic syndromes, and what has recently been shown for downbeat nystagmus.",
          "Layer III, examples of instrumental elements inside criteria as cited in this paper: Ménière's disease — fluctuating LOW-frequency hearing loss on audiogram; superior semicircular canal dehiscence — bone-conduction thresholds below zero, OR augmented vestibular evoked myogenic potentials, OR eye movements provoked by pressure and running in the plane of the canal involved. The three SCDS elements stand in ALTERNATION, not conjunction, and the paper attaches no numerical thresholds to them.",
          "Layer III, some entities rest ON HISTORY ALONE — the paper's one example is vestibular migraine — the stated reason being that no diagnostic test existed at the time of writing.",
        ],
      },
      {
        postac: "zespoły kardynalne",
        nazwaPl: "Trzy zespoły kardynalne Warstwy II", nazwaEn: "The three cardinal syndromes of Layer II",
        wymagane: "rozróżnienie po CZASIE TRWANIA objawów — to jedyne progi o charakterze kryterialnym w całej pracy",
        punkty: [
          { litera: "AVS", pl: "Ostry zespół przedsionkowy — choroby JEDNOFAZOWE o OSTRYM POCZĄTKU, trwające OD DNI DO TYGODNI.", en: "Acute vestibular syndrome — MONOPHASIC diseases of ACUTE ONSET, lasting DAYS TO WEEKS." },
          { litera: "EVS", pl: "Napadowy (epizodyczny) zespół przedsionkowy — choroby przebiegające NAWRACAJĄCYMI NAPADAMI objawów przedsionkowych, KAŻDY trwający OD SEKUND DO DNI.", en: "Episodic vestibular syndrome — conditions that present as RECURRENT ATTACKS of vestibular symptoms, with EACH attack running SECONDS TO DAYS." },
          { litera: "CVS", pl: "Przewlekły zespół przedsionkowy — stany, w których objawy utrzymują się przez MINIMUM 3 MIESIĄCE.", en: "Chronic vestibular syndrome — conditions whose symptoms carry on for A MINIMUM OF 3 MONTHS." },
        ],
        przypisyPl: [
          "Uzasadnienie podziału po czasie, a nie po jakości objawu: podejścia jakościowe propagowane od dekady rozpoczynającej się rokiem 1950, próbujące sortować rozpoznania przez odróżnianie zawrotu wirowego od niewirowego od niestabilności, są gorsze — bo żaden objaw przedsionkowy nie ma patognomonicznej swoistości, a pacjenci opisują różne kombinacje tych wrażeń NIEZALEŻNIE od rozpoznania. Podział czasowy zawęża diagnostykę szybciej i mniej dwuznacznie.",
          "SAMOKRYTYKA komitetu: definicje PPPD i MdDS pokazały, że jakości objawu nie da się zignorować całkowicie — ŻADNA z tych dwóch jednostek nie obejmuje zawrotu wirowego. Praca stawia to zdanie kategorycznie. O napadach zawrotu wirowego u pacjenta spełniającego kryteria PPPD lub MdDS mówi już HEDGINGOWO: „zdają się wskazywać” na obecność choroby współistniejącej. Praca nie nazywa tego kryterium ani nie czyni z tego reguły rozstrzygającej.",
          "Do czego warstwa zespołów MOŻE BYĆ PRZYDATNA (formuła hedgingowa źródła): do badań epidemiologicznych oraz jako PIERWSZY PUNKT ROZGAŁĘZIENIA w algorytmach diagnostycznych. Do czego NIE WYSTARCZA (formuła kategoryczna): do pełnego postępowania klinicznego.",
          "Powód podany wprost: AVS obejmuje ZARÓWNO choroby obwodowe, JAK I ośrodkowe — obwodowe zwykle niezagrażające życiu (przykład: ostra jednostronna westybulopatia obwodowa / zapalenie nerwu przedsionkowego), ośrodkowe mogące być śmiertelne (przykład: zawał pnia mózgu lub móżdżku). Dlatego algorytmy muszą zawierać odpowiednie badania — praca podaje jako przykład przyłóżkową ocenę „HINTS”, w cudzysłowie, i nic więcej o niej nie mówi.",
          "Dotyczy to SZCZEGÓLNIE AVS o początku spontanicznym i EVS o początku spontanicznym, gdzie różnicowanie jest bardziej niejednoznaczne niż w EVS WYZWALANYM, gdzie istnieją klasyczne czynniki wyzwalające — przykład podany przez autorów: zmiany pozycji głowy u pacjentów z BPPV.",
        ],
        przypisyEn: [
          "Why the split is by duration rather than symptom quality: the qualitative approaches promulgated since the decade beginning in 1950, which tried to sort diagnoses by separating vertigo from dizziness from unsteadiness, are inferior — no vestibular symptom is pathognomonically specific, and patients describe varying combinations of these sensations REGARDLESS of diagnosis. The duration-based split narrows the differential more quickly and less ambiguously.",
          "The committee's SELF-CRITICISM: the definitions of PPPD and MdDS showed that symptom quality cannot be ignored entirely — NEITHER of these disorders includes spinning vertigo. The paper states this categorically. On bouts of spinning vertigo in a patient meeting PPPD or MdDS criteria it HEDGES: these 'appear to indicate' the presence of co-existing illness. The paper neither calls this a criterion nor makes it a decisive rule.",
          "What the syndromic layer MAY BE USEFUL for (the source's hedged wording): epidemiologic research, and as the FIRST BRANCH POINT of a diagnostic algorithm. What it is INSUFFICIENT for (the source's categorical wording): complete clinical management.",
          "The reason given outright: the AVS covers BOTH peripheral AND central disease — peripheral disease typically not life-threatening (example: acute unilateral peripheral vestibulopathy / vestibular neuritis), central disease potentially fatal (example: brainstem or cerebellar infarction). Diagnostic algorithms must therefore include appropriate examinations — the paper offers the bedside 'HINTS' assessment as an example, in quotation marks, and says nothing further about it.",
          "This applies PARTICULARLY to spontaneous-onset AVS and spontaneous-onset EVS, where the differential is more ambiguous than in TRIGGERED EVS, where classic precipitants exist — the authors' example: changes in head position in patients with BPPV.",
        ],
      },
      {
        postac: "czerwone flagi",
        nazwaPl: "Cztery czerwone flagi wymienione z nazwy", nazwaEn: "Four red flags named in the text",
        wymagane: "cztery flagi podane jako PRZYKŁADY (źródło wprowadza je zwrotem „such as”) — lista nie jest domknięta",
        punkty: [
          { litera: "1", pl: "Towarzysząca dysfunkcja neurologiczna.", en: "Associated neurological dysfunction." },
          { litera: "2", pl: "Ciężka ataksja chodu.", en: "Severe gait ataxia." },
          { litera: "3", pl: "Ostra jednostronna utrata słuchu.", en: "Acute unilateral loss of hearing." },
          { litera: "4", pl: "Naczyniowe czynniki ryzyka.", en: "Vascular risk factors." },
        ],
        przypisyPl: [
          "Lista jest PRZYKŁADOWA, nie zamknięta: zdanie źródła wylicza te cztery pozycje po zwrocie „such as”. Cztery to liczba flag NAZWANYCH, nie liczba flag istniejących.",
          "Praca podaje tę listę w kontekście DOPEŁNIENIA integracji klasyfikacji zespołowej z algorytmami diagnostycznymi — nie jako narzędzie przesiewowe z czułością, swoistością ani progiem.",
          "Praca nie podaje żadnych parametrów trafności dla tych flag ani nie mówi, ile z nich musi wystąpić.",
        ],
        przypisyEn: [
          "The list is EXEMPLARY, not closed: the source sentence introduces these four items with 'such as'. Four is the count of flags NAMED, not the count of flags that exist.",
          "The paper gives this list in the context of COMPLETING the integration of syndromic classification into diagnostic algorithms — not as a screening tool with sensitivity, specificity or a threshold.",
          "The paper reports no accuracy figures for these flags and does not say how many must be present.",
        ],
      },
      {
        postac: "samokrytyka",
        nazwaPl: "Słabości ICVD wyliczone przez sam komitet", nazwaEn: "The ICVD's weaknesses as listed by the committee itself",
        wymagane: "wszystkie punkty to stwierdzenia autorów o własnym dziele, nie zarzuty zewnętrzne",
        punkty: [
          { litera: "A", pl: "Prace stanowiskowe ICVD wydają się szeroko przyjęte, ALE NIE PRZESZŁY WALIDACJI KLINICZNEJ; autorzy nazywają walidację ważnym zadaniem dla społeczności międzynarodowej. Osobno, we wstępie: użyteczność niekoniecznie przekłada się na poprawę wyników leczenia pacjentów.", en: "The ICVD position papers seem widely adopted BUT HAVE NOT UNDERGONE CLINICAL VALIDATION; the authors call validation an important task for the international community. Separately, in the introduction: usability may not necessarily translate into improved patient outcomes." },
          { litera: "B", pl: "Próg spełnienia kryteriów danej jednostki jest CELOWO WYSOKI, aby zwiększyć SWOISTOŚĆ — co pozwala badać bardziej jednorodne kohorty. KLINICYŚCI mogą potrzebować DOSTOSOWAĆ swoje progi rozpoznania, mając świadomość potrzeby lub kontekstu klinicznego. Podstawowym celem kryteriów jest wzmocnienie BADAŃ NAUKOWYCH; poprawa jakości opieki pozostaje NADZIEJĄ.", en: "The bar for meeting an entity's criteria is DELIBERATELY HIGH, to raise SPECIFICITY — allowing more homogeneous cohorts to be studied. CLINICIANS may need to ADJUST their diagnostic thresholds in light of clinical need or context. The primary aim of the criteria is to strengthen RESEARCH; improved clinical care remains an ASPIRATION." },
          { litera: "C", pl: "Dotychczas prace konsensusowe ICVD NIE BYŁY aktualizowane — z JEDNYM WYJĄTKIEM: migreny przedsionkowej, której aktualizację opublikowano po DZIESIĘCIU LATACH. Autorzy postulują ustalenie określonej liczby lat, po której aktualizacja musi nastąpić, tak jak robi się to dla wytycznych klinicznych.", en: "To date the ICVD consensus papers have NOT been updated, with ONE EXCEPTION: vestibular migraine, whose update was published after TEN YEARS. The authors propose fixing a set number of years after which an update must occur, as is done for clinical guidelines." },
          { litera: "D", pl: "Ewolucja obrazu chorobowego w czasie może wymagać przeklasyfikowania stanu pacjenta, ale ta koncepcja NIE JEST wbudowana w kryteria ICVD — z JEDNYM WYJĄTKIEM: AUVP. Najwyrazistszy przykład problemu: nakładanie się migreny przedsionkowej i PPPD, zaburzeń mogących leżeć na kontinuum, z zacieraniem się granic w miarę przewlekania się migreny przedsionkowej.", en: "Evolution of the clinical picture over time may require reclassifying a patient's condition, but this concept is NOT built into the ICVD criteria — with ONE EXCEPTION: AUVP. The starkest example of the problem: vestibular migraine and PPPD overlap — these disorders may sit on a shared continuum, whose diagnostic boundaries blur once the migraine turns chronic." },
          { litera: "E", pl: "Krytyki PPPD wyliczone wprost, trzy: argumenty za wyodrębnieniem podtypów; możliwa potrzeba przemyślenia elementu „postural” w definicji; niechęć do fonetycznego podobieństwa skrótów BPPV i PPPD. Autorzy piszą, że to MOŻE wymagać aktualizacji istniejących kryteriów.", en: "Three criticisms of PPPD listed outright: arguments supporting sub-typing; a possible need to reconsider the 'postural' element of the definition; and a dislike of the phonetic similarity between BPPV and PPPD. The authors write that this MAY require updating the existing criteria." },
          { litera: "F", pl: "Krytyki BPPV wyliczone wprost, dwie: przegląd zasadności wiązania patologii z rokowaniem oraz mocniejsze zalecenie PRZESIEWU w kierunku BPPV NIEZALEŻNIE od skargi na zawroty w grupach predysponowanych — u osób starszych, zwłaszcza z upadkami w wywiadzie, i u osób po urazowym uszkodzeniu mózgu, gdzie wskaźniki niedodiagnozowania sięgają 10-KROTNOŚCI. Uwaga na status: to POSTULAT komitetu na przyszłość, sformułowany w trybie możliwości — komitet MOŻE to rozważyć — a nie obowiązujące zalecenie.", en: "Two criticisms of BPPV are listed outright. One asks whether tying pathology to prognosis is appropriate at all. The other would urge SCREENING for BPPV more firmly, and IRRESPECTIVE of any vertigo complaint, in predisposed groups: the elderly — above all those whose history includes falls — and anyone after traumatic brain injury, where underdiagnosis runs AS HIGH AS 10-FOLD. Note the status: the committee MAY review this. It is a PROPOSAL for the future, phrased in the modality of possibility, not a standing recommendation." },
          { litera: "G", pl: "Objawy wtórne — nudności, zmęczenie, lęk, depresja — świadomie NIE zostały włączone do definicji ICVD, ponieważ uznano, że brakuje im czułości i swoistości, by wnieść wartość diagnostyczną. To jawna decyzja projektowa komitetu, nie przeoczenie.", en: "Secondary symptoms — nausea, fatigue, anxiety, depression — were deliberately NOT included in the ICVD definitions, on the view that they lack the sensitivity and specificity to add diagnostic value. An explicit design decision, not an oversight." },
          { litera: "H", pl: "Choroba mózgu ORAZ starzenie zmieniają sposób, w jaki pacjenci relacjonują objawy przedsionkowe, co skutkuje DRAMATYCZNYM NIEDODIAGNOZOWANIEM częstych rozpoznań, takich jak BPPV, w grupach wrażliwych.", en: "Brain disease AND ageing alter how patients report vestibular symptoms, resulting in DRAMATIC UNDERDIAGNOSIS of common diagnoses such as BPPV in vulnerable groups." },
        ],
        przypisyPl: [
          "Współchorobowość jest częsta i praca wylicza CZTERY drogi, którymi się pojawia: (i) dwie lub więcej chorób aktywnych niezależnie — przykład: BPPV i migrena przedsionkowa; (ii) wiele zaburzeń przedsionkowych z JEDNEJ etiologii — w urazowym uszkodzeniu mózgu jest to REGUŁA; (iii) jedno zaburzenie jako NASTĘPSTWO innego — przykład: PPPD po AUVP; (iv) objawy nakładające się na dwa stany — przykład: migrena przedsionkowa i choroba Ménière'a.",
          "ICVD ŚWIADOMIE ZAAKCEPTOWAŁ częściowo nakładające się kryteria — pod warunkiem, że każda zdefiniowana jednostka wyławia unikalną grupę pacjentów, to jest takich, którzy spełniają kryteria TYLKO JEDNEJ jednostki, nawet jeśli inni mają objawy nakładające się.",
          "Warunek wejścia nowej jednostki do ICVD: proponowana jednostka MUSI obejmować grupę pacjentów z obrazem choroby nieujętym gdzie indziej, przy jednoczesnym dopuszczeniu częstego występowania chorób współistniejących.",
          "Praktyczne trudności ze stosowaniem kryterium „nie lepiej wyjaśnione innym zaburzeniem”: subiektywizm, dynamiczny charakter dziedziny, możliwość chorób współistniejących. Ostrzeżenie autorów: potrzeba wykluczenia innych zaburzeń NIE POWINNA prowadzić do opóźnień diagnostycznych, zwłaszcza gdy terminowa interwencja jest kluczowa dla wyniku leczenia. Pytanie pozostawione otwarte: jak daleko personel ma posuwać eliminację innych przyczyn, gdy rozpoznanie jest skądinąd jasne? Decyduje indywidualna preferencja, ale też struktury opieki zdrowotnej i implikacje prawne.",
          "Obecnie działają CZTERY nowe podkomitety, zajmujące się jednostkami przedsionkowymi o nieco mniejszej swoistości; praca wymienia z nazwy TYLKO DWA: pokontuzyjne zaburzenia przedsionkowe oraz skojarzone obwodowe i ośrodkowe zaburzenia przedsionkowe. Prace nad westybulopatiami związanymi z urazem mózgu UTKNĘŁY z powodu nakładania się z istniejącymi jednostkami.",
        ],
        przypisyEn: [
          "Comorbidity is common and the paper lists FOUR routes by which it arises: (i) two or more independently active diseases — example: BPPV and vestibular migraine; (ii) multiple vestibular disorders from a SINGLE aetiology — in traumatic brain injury this is the RULE; (iii) one disorder as a CONSEQUENCE of another — example: PPPD after AUVP; (iv) symptoms overlapping two conditions — example: vestibular migraine and Ménière's disease.",
          "The ICVD has DELIBERATELY ACCEPTED partially overlapping criteria — on condition that each defined entity captures a unique group of patients, i.e. those meeting the criteria of ONLY ONE entity, even if others have overlapping features.",
          "The entry condition for a new ICVD entity: the candidate condition MUST take in a group of patients whose illness picture no existing entity already captures, while leaving room for comorbidity, which is common.",
          "Practical difficulties in applying the 'not better accounted for by another disorder' criterion: how subjective the judgement is, how fast the field moves, and how readily comorbidity intervenes. The authors' warning: the need to rule out other disorders SHOULD NOT promote diagnostic delays, particularly when timely intervention is crucial to the outcome. The question they leave open: once a diagnosis is otherwise clear, how hard should staff keep chasing the alternatives? Personal preference weighs on that, and so do the way health services are organised and where the legal liability falls.",
          "FOUR new subcommittees are currently at work on vestibular entities of somewhat lower specificity. Only TWO get named in the paper: post-concussion vestibular disorders and — separately — combined peripheral and central vestibular disorders. Work on traumatic brain injury-related vestibulopathies has STALLED, blocked by overlap with entities that already exist.",
        ],
      },
    ],
    progi: [
      { ranga: "kryterium", wartosc: "dni do tygodni", wielkoscPl: "czas trwania AVS", wielkoscEn: "AVS duration", kontekstPl: "definicja pierwszego zespołu kardynalnego Warstwy II", kontekstEn: "definition of the first cardinal syndrome of Layer II" },
      { ranga: "kryterium", wartosc: "sekundy do dni", wielkoscPl: "czas trwania POJEDYNCZEGO napadu w EVS", wielkoscEn: "duration of a SINGLE attack in EVS", kontekstPl: "definicja drugiego zespołu kardynalnego; próg dotyczy napadu, nie choroby", kontekstEn: "definition of the second cardinal syndrome; the threshold applies to the attack, not the illness" },
      { ranga: "kryterium", wartosc: "minimum 3 miesiące", wielkoscPl: "próg CVS", wielkoscEn: "CVS threshold", kontekstPl: "definicja trzeciego zespołu kardynalnego", kontekstEn: "definition of the third cardinal syndrome" },
    ],
    granicePl: [
      "Praca NIE zawiera ani jednego zestawu kryteriów diagnostycznych żadnej jednostki — ani litery kryterium, ani progu liczbowego dla jakiejkolwiek choroby. Słowo „kryteria” pada 38 razy, ale zawsze o kryteriach jako OBIEKCIE DYSKUSJI, nigdy jako wyliczenie A/B/C/D.",
      "Praca NIE stawia własnych wymagań wobec badań instrumentalnych. Opisuje, że niektóre istniejące kryteria je zawierają, i postuluje, że przyszłe rewizje mogą włączyć zapisy z urządzeń przenośnych. „HINTS” pada dokładnie RAZ, w cudzysłowie, jako przykład — praca nie opisuje składowych HINTS, nie podaje jego czułości ani swoistości i nie mówi nic o wymogu przeszkolenia badającego.",
      "Praca NIE podaje żadnego progu w decybelach, hercach, wartościach gain ani stopniach na sekundę. Kryterium audiogramowe choroby Ménière'a jest tu przywołane jako „fluktuujący niedosłuch w zakresie niskich częstotliwości” — bez jednej liczby. Nie wolno cytować tej pracy jako źródła progu liczbowego dla jakiejkolwiek jednostki.",
      "Praca NIE używa skrótów t-EVS ani s-EVS, nie zna frazy „timing and triggers” i nie wspomina o GRACE-3 w ogóle. Operuje pojęciowo rozróżnieniem spontaniczny AVS / spontaniczny EVS vs wyzwalany EVS, ale nazewnictwo skrótowe pochodzi z innego źródła i tam musi być przypisane.",
      "Praca ODRZUCA oś ośrodkowe vs obwodowe jako samodzielnie wystarczającą podstawę klasyfikacji i NIE podaje żadnej reguły różnicowania ośrodek/obwód, żadnego objawu różnicującego ani żadnej dokładności testu. Zdanie „ICVD dzieli zaburzenia na ośrodkowe i obwodowe” byłoby przypisaniem treści, której praca nie niesie.",
      "Praca NIE twierdzi, że kryteria ICVD zostały zwalidowane klinicznie — twierdzi wprost odwrotnie. Nie twierdzi też, że ICVD poprawia wyniki leczenia pacjentów — pisze, że użyteczność niekoniecznie się na nie przekłada.",
    ],
    graniceEn: [
      "The paper contains NOT ONE diagnostic criteria set for any entity — no criterion letter, no numerical threshold for any disease. The word 'criteria' appears 38 times, always with criteria as the OBJECT OF DISCUSSION, never as an A/B/C/D enumeration.",
      "The paper imposes no requirements of its own regarding instrumental testing. It describes that some existing criteria contain them and proposes that future revisions may incorporate recordings from portable devices. 'HINTS' appears exactly ONCE, in quotation marks, as an example — the paper does not describe its components, gives no sensitivity or specificity, and says nothing about any training requirement for the examiner.",
      "The paper gives no threshold in decibels, hertz, gain or degrees per second. Ménière's audiogram criterion is invoked here as 'fluctuating low-frequency hearing loss' — without a single number. Do not cite this paper as the source of a numerical threshold for any entity.",
      "The paper uses neither the abbreviation t-EVS nor s-EVS, does not know the phrase 'timing and triggers', and does not mention GRACE-3 at all. It works conceptually with the spontaneous-AVS / spontaneous-EVS versus triggered-EVS distinction, but the abbreviated nomenclature comes from another source and must be attributed there.",
      "The paper REJECTS the central-versus-peripheral axis as sufficient on its own for classification and supplies no central/peripheral discrimination rule, no discriminating symptom and no test accuracy. Writing 'the ICVD divides disorders into central and peripheral' would attribute content the paper does not carry.",
      "The paper does not claim that the ICVD criteria have been clinically validated — it states the opposite outright. Nor does it claim the ICVD improves patient outcomes — it writes that usability may not necessarily translate into them.",
    ],
  },
];

/* ═══════════ 4. WYBIERAKI ═══════════
   Wszystkie CZYSTE i wszystkie bez wyjątków — ekran nie ma prawa mieć własnego warunku, bo
   wtedy za pół roku będą dwa warunki, które się rozjadą (tak powstało 7 wejść omijających
   kwalifikację HINTS, scalonych dopiero w Bloku 12). */
export const ATLAS_KLUCZE = ATLAS.map(w => w.klucz);

export function wpis(klucz) { return ATLAS.find(w => w.klucz === klucz) || null; }
export function wpisy(klucze) { return (klucze || []).map(wpis).filter(Boolean); }
export const jednostki = () => ATLAS.filter(w => w.typ === 'jednostka');
export const ramowe = () => ATLAS.filter(w => w.typ === 'ramowy');
export const stanowiska = () => ATLAS.filter(w => w.typ === 'stanowisko');
export const wpisyZespolu = (z) => ATLAS.filter(w => w.zespol === z);
export const wpisyStanu = (s) => ATLAS.filter(w => w.wSilniku === s);

/* Progi, które karta pokazuje — kryterialne i notowe. Wybierak istnieje po to, żeby ekran nie
   miał własnego warunku: filtr rangi jest decyzją redakcyjną i ma mieszkać w jednym miejscu. */
export const progiKarty = (klucz) => {
  const w = wpis(klucz); if (!w) return [];
  return (w.progi || []).filter(p => RANGI_NA_KARCIE.includes(p.ranga));
};

/* Numer źródła bez oznaczenia: `[H48] von Brevern 2015` → `H48`. Bramka porównuje po nim
   z bibliografią `engine_doc`, a ekran pokazuje CAŁE `zrodlo` — konwencja cytowania żąda,
   by oznaczenie szło zaraz po numerze i niosło rok. */
export function numerZrodla(klucz) {
  const w = wpis(klucz); if (!w) return null;
  const m = /^\[(H\d+)\]/.exec(w.zrodlo || '');
  return m ? m[1] : null;
}

/* Rozkład rejestru zakresu — liczby, nie deklaracja. Czyta to ekran atlasu (żeby powiedzieć
   wprost, ile jednostek silnik modeluje, a ile stoi tu wyłącznie do czytania) i bramka ATL6. */
export function rozkladZakresu() {
  const out = {};
  for (const s of STAN_SILNIKA_IDS) out[s] = wpisyStanu(s).length;
  return out;
}

/* Wyszukiwanie po nazwie i synonimach, w OBU językach naraz. Nie po treści kryteriów: klinicysta
   szuka jednostki, a dopasowanie do słowa z wnętrza kryterium dałoby trafienia, których nie da
   się wytłumaczyć („dlaczego Ménière wyszedł na «ataksja»?"). */
export function szukaj(fraza) {
  const q = String(fraza || '').trim().toLowerCase();
  if (!q) return [];
  return ATLAS.filter(w => {
    const pola = [w.nazwaPl, w.nazwaEn, ...(w.synonimy || []).flatMap(s => [s.pl, s.en])];
    return pola.filter(Boolean).some(p => p.toLowerCase().includes(q));
  });
}

/* LISTA PO FILTRACH. Bierze WARTOŚCI, nie obiekt stanu — moduł zostaje czysty i bramka przechodzi
   po nim pełny iloczyn filtrów w gołym Node. Filtry łączą się KONIUNKCJĄ i to jest zamierzone:
   „EVS + poza zakresem" ma znaczyć jedno i to samo niezależnie od kolejności klikania.
   Kolejność wyniku jest kolejnością ATLASU (kliniczną), a nie kolejnością trafień — ranking
   wyszukiwania wprowadzałby hierarchię jednostek, której to źródło nie niesie. */
export function filtruj({ zespol = null, zakres = null, fraza = '' } = {}) {
  const q = String(fraza || '').trim().toLowerCase();
  const trafia = (w) => {
    if (!q) return true;
    const pola = [w.nazwaPl, w.nazwaEn, ...(w.synonimy || []).flatMap(s => [s.pl, s.en])];
    return pola.filter(Boolean).some(p => p.toLowerCase().includes(q));
  };
  return ATLAS.filter(w =>
    (zespol == null || w.zespol === zespol) &&
    (zakres == null || w.wSilniku === zakres) &&
    trafia(w));
}

/* Terminy ODRADZANE przez [H47] Bisdorff 2009 i [H51] Eggers 2019, zebrane z całego atlasu.
   Osobny wybierak, bo to jest treść etapu E7 (harmonizacja nazewnictwa) i ma dać się policzyć
   niezależnie od tego, w którym wpisie termin stoi. */
export function terminyOdradzane() {
  const out = [];
  for (const w of ATLAS) for (const s of (w.synonimy || [])) if (s.odradzany) out.push({ klucz: w.klucz, ...s });
  return out;
}
