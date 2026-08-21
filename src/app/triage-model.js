/* OTOREPO — kwalifikacja wstępna („Wywiad", Blok 6).
 *
 * Cel z dokumentu użytkownika: „Wstępne uporządkowanie objawów według czasu trwania i czynników
 * wyzwalających oraz NIEDOPUSZCZENIE DO NIEWŁAŚCIWEGO UŻYCIA HINTS."
 *
 * ═══ CO TEN MODUŁ ROBI, A CZEGO NIE ═══
 * Wybiera ŚCIEŻKĘ BADANIA, nie stawia rozpoznania. Wynikiem jest zdanie „wykonaj tę próbę",
 * nigdy „to jest BPPV". Różnica nie jest kosmetyczna: OTOREPO to narzędzie dydaktyczne, a
 * kwestionariusz zwracający rozpoznanie byłby najmocniejszym twierdzeniem klinicznym w całej
 * aplikacji — postawionym na kilku odpowiedziach tak/nie, bez badania pacjenta.
 *
 * ═══ PODSTAWA ═══
 * Taksonomia CZAS-I-WYZWALACZE wg GRACE-3 (Edlow, Carpenter, Akhter i wsp., Acad Emerg Med
 * 2023;30(5):442–486, PMID 37166022) — ta sama, która jest już zapisana w engine_doc.txt [H24]:
 *   t-EVS   — napadowe, WYZWALANE zmianą pozycji → próby pozycyjne (Dix-Hallpike, roll)
 *   AVS     — ciągłe od godzin/dni Z oczopląsem samoistnym → HINTS, ale TYLKO u przeszkolonych
 *   pseudo-AVS — ciągłe BEZ oczopląsu → najpierw znieś fiksację; HINTS nie ma tu zastosowania
 *   s-EVS   — napadowe BEZ wyzwalacza → migrena przedsionkowa / TIA tylnego kręgu;
 *             silnik OTOREPO tego CELOWO nie modeluje (engine_doc [H24])
 * Czerwone flagi biją wszystko: „każda ataksja chodu = OŚRODEK", 5 D (dyplopia, dyzartria,
 * dysfagia, dysfonia, dysmetria). GRACE-3 dotyczy zawrotów ostrych, poniżej 2 tygodni.
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * ZERO importów, zero DOM, odpowiedzi wchodzą argumentem — jak flow-model.js. Dzięki temu
 * tools/triage-check.mjs sprawdza go w gołym Node na PEŁNYM iloczynie kartezjańskim odpowiedzi,
 * a nie na kilku ręcznie dobranych przypadkach. Napisy jako surowe pary pl/en (t() na poziomie
 * modułu zamroziłoby język).
 */

/* ============ Pytania ============
   Dokument: „Pytania krótkie, preferencyjnie tak/nie lub wybór jednej odpowiedzi" oraz
   „Odpowiedź «nie wiem / nie można ocenić» jest zawsze dostępna, gdy ma znaczenie kliniczne".
   Ta druga zasada nie jest uprzejmością wobec użytkownika: klinicysta, który NIE MOŻE ocenić
   oczopląsu bez okularów Frenzla, ma mieć to jak zaznaczyć, zamiast zgadywać „nie ma". */
export const TRIAGE_QUESTIONS = [
  {
    id: 'przebieg', typ: 'jeden',
    pl: 'Jak przebiegają zawroty?', en: 'What is the time course of the dizziness?',
    plHint: 'czas trwania decyduje o tym, które badanie ma sens',
    enHint: 'the time course decides which examination makes sense',
    opcje: [
      { v: 'napadowe', pl: 'Napadowo — sekundy do minut, między napadami wyraźnie lepiej',
        en: 'Episodic — seconds to minutes, clearly better between attacks' },
      { v: 'ciagle', pl: 'Ciągle — od godzin lub dni, bez przerw',
        en: 'Continuous — for hours or days, without breaks' },
      { v: 'nieznane', pl: 'Nie wiem / nie da się ustalić',
        en: 'Not known / cannot be established' },
    ],
  },
  {
    id: 'wyzwalacz', typ: 'jeden', gdy: a => a.przebieg === 'napadowe',
    pl: 'Co wyzwala napad?', en: 'What triggers an attack?',
    plHint: 'wyzwalacz pozycyjny odróżnia BPPV od napadów samoistnych',
    enHint: 'a positional trigger distinguishes BPPV from spontaneous attacks',
    opcje: [
      { v: 'pozycyjny', pl: 'Zmiana pozycji głowy lub ciała (kładzenie się, obrót w łóżku, odchylenie głowy)',
        en: 'A change of head or body position (lying down, rolling over in bed, head extension)' },
      { v: 'samoistny', pl: 'Napady przychodzą same, bez związku z pozycją',
        en: 'Attacks come on their own, unrelated to position' },
      { v: 'nieznane', pl: 'Nie wiem / niejednoznacznie',
        en: 'Not known / ambiguous' },
    ],
  },
  {
    id: 'oczoplas', typ: 'jeden', gdy: a => a.przebieg === 'ciagle',
    pl: 'Czy w spoczynku widać oczopląs samoistny?', en: 'Is spontaneous nystagmus visible at rest?',
    plHint: 'HINTS ma zastosowanie wyłącznie przy utrzymującym się oczopląsie',
    enHint: 'HINTS applies only when nystagmus is sustained',
    opcje: [
      { v: 'obecny', pl: 'Tak — oczopląs samoistny jest widoczny',
        en: 'Yes — spontaneous nystagmus is visible' },
      { v: 'brak', pl: 'Nie — nie widać oczopląsu',
        en: 'No — no nystagmus visible' },
      { v: 'nieoceniony', pl: 'Nie oceniano / nie da się ocenić (brak okularów Frenzla, pacjent niewspółpracujący)',
        en: 'Not assessed / cannot be assessed (no Frenzel goggles, uncooperative patient)' },
    ],
  },
  {
    // WIELOKROTNY i ZAWSZE zadawany. Dokument: „Czerwone flagi są widoczne PRZED przejściem
    // do manewru lub HINTS" — więc nie mogą być pytaniem warunkowym ani opcjonalnym.
    id: 'flagi', typ: 'wielokrotny',
    pl: 'Czerwone flagi', en: 'Red flags',
    plHint: 'zaznacz wszystkie stwierdzone; „nie stwierdzono" wymaga świadomego kliknięcia',
    enHint: 'tick everything found; "none found" requires a deliberate click',
    opcje: [
      // GRACE-3 stawia to najwyżej: KAŻDA ataksja chodu w ostrych zawrotach przemawia za ośrodkiem.
      { v: 'ataksja', pl: 'Ataksja chodu — pacjent nie stoi ani nie chodzi bez podparcia',
        en: 'Gait ataxia — the patient cannot stand or walk unaided' },
      { v: 'pieciod', pl: 'Którekolwiek z 5 D: dyplopia, dyzartria, dysfagia, dysfonia, dysmetria',
        en: 'Any of the 5 Ds: diplopia, dysarthria, dysphagia, dysphonia, dysmetria' },
      { v: 'ogniskowe', pl: 'Inne ogniskowe objawy neurologiczne (niedowład, zaburzenia czucia, porażenie nerwu czaszkowego)',
        en: 'Other focal neurological signs (weakness, sensory loss, cranial nerve palsy)' },
      { v: 'bolGlowy', pl: 'Nowy, nietypowy ból głowy albo karku',
        en: 'New, unusual headache or neck pain' },
      { v: 'niedoslych', pl: 'Nagły jednostronny niedosłuch towarzyszący zawrotom',
        en: 'Sudden unilateral hearing loss accompanying the dizziness' },
      { v: 'brak', pl: 'Nie stwierdzono żadnej z powyższych', en: 'None of the above found',
        wylaczna: true },
    ],
  },
];

export const TRIAGE_IDS = TRIAGE_QUESTIONS.map(q => q.id);
export function triageQuestion(id) { return TRIAGE_QUESTIONS.find(q => q.id === id) || null; }

// Które pytania mają w tym momencie sens (pytanie warunkowe znika, gdy warunek nie zachodzi).
export function activeQuestions(odp) {
  const a = odp || {};
  return TRIAGE_QUESTIONS.filter(q => typeof q.gdy !== 'function' || q.gdy(a));
}

// Pierwsze pytanie bez odpowiedzi — telefon pokazuje jedno naraz.
export function nextQuestionId(odp) {
  const a = odp || {};
  for (const q of activeQuestions(a)) {
    const v = a[q.id];
    if (q.typ === 'wielokrotny') { if (!Array.isArray(v) || !v.length) return q.id; }
    else if (!v) return q.id;
  }
  return null;
}

export function triageComplete(odp) { return nextQuestionId(odp) === null; }

/* Odpowiedź „nie stwierdzono" jest WYŁĄCZNA: nie da się jednocześnie zaznaczyć ataksji i braku
   flag. Bez tej reguły stan „ataksja + brak" byłby osiągalny i klasyfikacja musiałaby zgadywać,
   co użytkownik miał na myśli. */
export function toggleFlaga(lista, v) {
  const cur = Array.isArray(lista) ? lista.slice() : [];
  if (v === 'brak') return cur.includes('brak') ? [] : ['brak'];
  const bez = cur.filter(x => x !== 'brak');
  return bez.includes(v) ? bez.filter(x => x !== v) : bez.concat(v);
}

export function czerwoneFlagi(odp) {
  const f = (odp && odp.flagi) || [];
  return f.filter(v => v !== 'brak');
}

/* ============ Kwalifikacja ============
   Zwraca ŚCIEŻKĘ BADANIA + uzasadnienie wskazujące, KTÓRE odpowiedzi do niej doprowadziły
   (kryterium odbioru nr 3). `sciezka` jest kluczem trybu aplikacji albo null — null znaczy
   „aplikacja nie ma tu nic do zaproponowania", a nie „wybierz sobie sam". */
const P = (pl, en) => ({ pl, en });

function powod(qid, wartosc) {
  const q = triageQuestion(qid); if (!q) return null;
  const o = (q.opcje || []).find(x => x.v === wartosc); if (!o) return null;
  return { qid, wartosc, pl: `${q.pl}: ${o.pl}`, en: `${q.en}: ${o.en}` };
}

export function triageResult(odp) {
  const a = odp || {};
  const flagi = czerwoneFlagi(a);
  const powody = [];

  /* 1. CZERWONE FLAGI BIJĄ WSZYSTKO — także komplet odpowiedzi układających się w klasyczne BPPV.
        Kryterium odbioru nr 2: „przy czerwonej fladze użytkownik otrzymuje komunikat o
        konieczności pilnej oceny ZAMIAST pozornego rozpoznania BPPV". Kolejność w tej funkcji
        jest więc wymaganiem, nie stylem. */
  if (flagi.length) {
    for (const v of flagi) { const p = powod('flagi', v); if (p) powody.push(p); }
    const ataksja = flagi.includes('ataksja');
    return {
      kategoria: 'czerwona', sciezka: null, pewnosc: 'wysoka', flagi, powody,
      tytul: P('Pilna ocena — nie wykonuj repozycji', 'Urgent evaluation — do not perform repositioning'),
      /* D-ATX (2026-08-21): wcześniej stało tu „przemawia za przyczyną OŚRODKOWĄ NIEZALEŻNIE od
         pozostałych cech". [H58] Kim 2022 formułuje to WĘŻEJ i jednocześnie mówi zdanie w DRUGĄ
         STRONĘ. Postacią kryterialną jest ataksja CIĘŻKA TUŁOWIA, zdefiniowana twardo: chory NIE
         UTRZYMA pozycji siedzącej ANI stojącej BEZ PODPARCIA — i jest ona JEDNĄ z pozycji listy
         „co najmniej jedno z poniższych", a nie samodzielnym rozstrzygnięciem. Osobno praca mówi,
         że ataksja LEKKA DO UMIARKOWANEJ NIE WYKLUCZA zmiany ośrodkowej. Zawężamy więc TWIERDZENIE,
         ale NIE zawężamy WEJŚCIA: opcja „ataksja" w kwestionariuszu zostaje szeroka (bramka KS6),
         bo zdanie o nieczułości działa właśnie na korzyść czujności. */
      tresc: ataksja
        ? P('Ataksja chodu przy ostrych zawrotach każe pilnie wykluczyć przyczynę OŚRODKOWĄ. Postacią o mocy kryterium jest ataksja CIĘŻKA TUŁOWIA — chory nie utrzyma pozycji siedzącej ani stojącej bez podparcia; u Kima jest ona jedną z pozycji listy „co najmniej jedno z poniższych", a nie samodzielnym rozstrzygnięciem — [H58] Kim 2022. Uwaga w drugą stronę, z tej samej pracy: ataksja LEKKA lub UMIARKOWANA NIE WYKLUCZA zmiany ośrodkowej, więc jej łagodność nie jest powodem do uspokojenia. Wymaga pilnej oceny neurologicznej i obrazowania — nie manewru repozycyjnego.',
            'Gait ataxia in acute dizziness calls for urgent exclusion of a CENTRAL cause. The form carrying criterial weight is SEVERE TRUNCAL ataxia — the patient cannot maintain an upright sitting or standing posture without support; in Kim it is one item on the "at least one of the following" list, not a decision on its own — [H58] Kim 2022. The converse, from the same paper: MILD to MODERATE ataxia does NOT exclude a central lesion, so its mildness is no reason for reassurance. It requires urgent neurological evaluation and imaging — not a repositioning maneuver.')
        : P('Zaznaczono objaw, który wykracza poza obraz obwodowy. Zanim rozważysz próby pozycyjne albo HINTS, potrzebna jest pilna ocena neurologiczna.',
            'You marked a feature that goes beyond a peripheral picture. Before considering positional testing or HINTS, urgent neurological evaluation is needed.'),
      uwagi: [
        P('Obrazowanie: MRI z dyfuzją (DWI) i angiografią (MRA). Tomografia komputerowa NIE nadaje się do wykluczenia udaru tylnego dołu.',
          'Imaging: MRI with diffusion (DWI) and angiography (MRA). CT is NOT suitable for ruling out a posterior-fossa stroke.'),
        P('Wczesne MRI bywa fałszywie ujemne — przy utrzymującym się podejrzeniu powtórz badanie po 48–72 h.',
          'Early MRI can be false-negative — if suspicion persists, repeat after 48–72 h.'),
      ],
    };
  }

  const brakFlagPotwierdzony = Array.isArray(a.flagi) && a.flagi.includes('brak');
  if (brakFlagPotwierdzony) powody.push(powod('flagi', 'brak'));

  /* 2. Przebieg nieustalony — nie zgadujemy. Jedyną zalecaną akcją jest ustalenie przebiegu. */
  if (a.przebieg === 'nieznane' || !a.przebieg) {
    if (a.przebieg) powody.push(powod('przebieg', 'nieznane'));
    return {
      kategoria: 'niepewna', sciezka: null, pewnosc: 'niska', flagi, powody,
      tytul: P('Ustal najpierw przebieg', 'Establish the time course first'),
      tresc: P('Bez informacji, czy zawroty są napadowe czy ciągłe, żadne z badań nie jest właściwie dobrane: próby pozycyjne odpowiadają na inne pytanie niż HINTS.',
               'Without knowing whether the dizziness is episodic or continuous, neither examination is correctly chosen: positional testing answers a different question than HINTS.'),
      uwagi: [
        P('Pomocne pytanie: czy między napadami pacjent czuje się dobrze, czy zawroty trwają bez przerwy od początku?',
          'A helpful question: does the patient feel well between attacks, or has the dizziness been continuous since onset?'),
      ],
    };
  }

  /* 3. NAPADOWE. Tu leży kryterium odbioru nr 1: HINTS NIE MOŻE być tu proponowany.
        HINTS jest badaniem ostrego zespołu przedsionkowego z utrzymującym się oczopląsem —
        przy napadach trwających sekundy pacjent w chwili badania zwykle nie ma oczopląsu, więc
        „prawidłowy HIT" nie znaczy nic i bywa czytany jako uspokajający. */
  if (a.przebieg === 'napadowe') {
    powody.push(powod('przebieg', 'napadowe'));
    if (a.wyzwalacz === 'pozycyjny') {
      powody.push(powod('wyzwalacz', 'pozycyjny'));
      return {
        kategoria: 'tEVS', sciezka: 'diag', pewnosc: brakFlagPotwierdzony ? 'wysoka' : 'srednia', flagi, powody,
        tytul: P('Ścieżka: próby pozycyjne', 'Pathway: positional testing'),
        tresc: P('Napadowe zawroty wyzwalane zmianą pozycji to obraz zgodny z BPPV. Właściwym badaniem jest próba pozycyjna: Dix-Hallpike dla kanału tylnego i przedniego, test rolki dla poziomego.',
                 'Episodic dizziness triggered by a change of position matches BPPV. The appropriate examination is positional testing: Dix-Hallpike for the posterior and anterior canals, the roll test for the horizontal canal.'),
        uwagi: [
          P('To wskazanie ŚCIEŻKI, nie rozpoznanie. Rozpoznanie wynika z tego, co zobaczysz w próbie — kierunku, latencji i czasu trwania oczopląsu.',
            'This selects a PATHWAY, not a diagnosis. The diagnosis follows from what you see in the test — the direction, latency and duration of the nystagmus.'),
        ],
      };
    }
    if (a.wyzwalacz === 'samoistny') {
      powody.push(powod('wyzwalacz', 'samoistny'));
      return {
        kategoria: 'sEVS', sciezka: null, pewnosc: 'srednia', flagi, powody,
        tytul: P('Napady samoistne — poza zakresem symulacji', 'Spontaneous attacks — outside the simulation'),
        tresc: P('Napadowe zawroty BEZ wyzwalacza pozycyjnego to inna grupa niż BPPV: przede wszystkim migrena przedsionkowa, choroba Ménière’a i TIA tylnego kręgu. Silnik OTOREPO ich nie modeluje.',
                 'Episodic dizziness WITHOUT a positional trigger is a different group than BPPV: chiefly vestibular migraine, Ménière’s disease and posterior-circulation TIA. The OTOREPO engine does not model them.'),
        uwagi: [
          P('Próby pozycyjne mogą tu wyjść ujemnie mimo realnej choroby — ujemny wynik nie wyklucza tych rozpoznań.',
            'Positional tests may be negative here despite real disease — a negative result does not rule these out.'),
          P('HINTS też nie jest właściwy: dotyczy ciągłego zespołu przedsionkowego z oczopląsem, a nie napadów.',
            'HINTS is not appropriate either: it applies to a continuous vestibular syndrome with nystagmus, not to attacks.'),
        ],
      };
    }
    // wyzwalacz nieznany
    if (a.wyzwalacz) powody.push(powod('wyzwalacz', 'nieznane'));
    return {
      kategoria: 'niepewna', sciezka: 'diag', pewnosc: 'niska', flagi, powody,
      tytul: P('Ścieżka: próby pozycyjne — z zastrzeżeniem', 'Pathway: positional testing — with a caveat'),
      tresc: P('Przy napadach o niejasnym wyzwalaczu próba pozycyjna jest badaniem tanim i rozstrzygającym: dodatni wynik potwierdza BPPV, ujemny kieruje ku napadom samoistnym (migrena przedsionkowa, Ménière).',
               'When the trigger of the attacks is unclear, a positional test is a cheap and decisive examination: a positive result confirms BPPV, a negative one points toward spontaneous attacks (vestibular migraine, Ménière’s).'),
      uwagi: [
        P('HINTS nie jest tu proponowany: napady trwające sekundy nie są ostrym zespołem przedsionkowym.',
          'HINTS is not proposed here: attacks lasting seconds are not an acute vestibular syndrome.'),
      ],
    };
  }

  /* 4. CIĄGŁE — dopiero tutaj HINTS w ogóle wchodzi w grę, i to warunkowo. */
  powody.push(powod('przebieg', 'ciagle'));
  if (a.oczoplas === 'obecny') {
    powody.push(powod('oczoplas', 'obecny'));
    return {
      kategoria: 'AVS', sciezka: 'hints', pewnosc: brakFlagPotwierdzony ? 'wysoka' : 'srednia', flagi, powody,
      tytul: P('Ścieżka: HINTS', 'Pathway: HINTS'),
      tresc: P('Ciągłe zawroty z utrzymującym się oczopląsem samoistnym to ostry zespół przedsionkowy — sytuacja, w której HINTS ma zastosowanie i bywa czulszy niż wczesne MRI.',
               'Continuous dizziness with sustained spontaneous nystagmus is an acute vestibular syndrome — the situation in which HINTS applies and can be more sensitive than early MRI.'),
      uwagi: [
        P('HINTS jest wiarygodny WYŁĄCZNIE w rękach osoby przeszkolonej w jego wykonywaniu. Wykonany bez przeszkolenia bywa mylący — a wynik „uspokajający" jest wtedy groźniejszy niż brak badania.',
          'HINTS is reliable ONLY in the hands of someone trained to perform it. Performed without training it can mislead — and a "reassuring" result is then more dangerous than not testing at all.'),
        P('Skompensowany ubytek obwodowy może dać pozornie prawidłowy HIT przy łóżku (sakady ukryte) — pułapka, gdy oczopląs już przygasł.',
          'A compensated peripheral loss can give an apparently normal bedside HIT (covert saccades) — a trap once the nystagmus has faded.'),
      ],
    };
  }
  if (a.oczoplas === 'brak') {
    powody.push(powod('oczoplas', 'brak'));
    return {
      kategoria: 'pseudoAVS', sciezka: null, pewnosc: 'srednia', flagi, powody,
      tytul: P('Najpierw znieś fiksację', 'Remove fixation first'),
      tresc: P('Ciągłe zawroty BEZ widocznego oczopląsu to nie jest sytuacja dla HINTS. Oczopląs obwodowy bywa całkowicie tłumiony patrzeniem — oceń ponownie po zniesieniu fiksacji (okulary Frenzla, ciemność, oftalmoskop z zasłoniętym drugim okiem).',
               'Continuous dizziness WITHOUT visible nystagmus is not a situation for HINTS. Peripheral nystagmus can be completely suppressed by fixation — reassess after removing fixation (Frenzel goggles, darkness, ophthalmoscope with the other eye covered).'),
      uwagi: [
        P('Jeśli po zniesieniu fiksacji oczopląsu nadal nie ma, HINTS nie ma zastosowania — szukaj przyczyny poza układem przedsionkowym i oceń chód.',
          'If there is still no nystagmus after removing fixation, HINTS does not apply — look for a cause outside the vestibular system and assess gait.'),
      ],
    };
  }
  // oczopląs nieoceniony
  if (a.oczoplas) powody.push(powod('oczoplas', 'nieoceniony'));
  return {
    kategoria: 'niepewna', sciezka: null, pewnosc: 'niska', flagi, powody,
    tytul: P('Oceń oczopląs przed wyborem badania', 'Assess the nystagmus before choosing the examination'),
    tresc: P('Przy ciągłych zawrotach o dalszym postępowaniu rozstrzyga obecność oczopląsu samoistnego. Bez tej informacji nie da się powiedzieć, czy HINTS jest w ogóle właściwym badaniem.',
             'In continuous dizziness, the presence of spontaneous nystagmus decides what to do next. Without that information it cannot be said whether HINTS is even the right examination.'),
    uwagi: [
      P('Oceń po zniesieniu fiksacji — bez tego łagodny oczopląs obwodowy bywa niewidoczny.',
        'Assess after removing fixation — without it a mild peripheral nystagmus can be invisible.'),
    ],
  };
}

/* Czy wolno stąd wejść w daną ścieżkę. Bramka jawna, żeby warunek kryterium odbioru nr 1
   („HINTS nie jest proponowany przy krótkich, wyłącznie pozycyjnych napadach") dało się
   sprawdzić jednym wywołaniem, a nie przez czytanie tekstu karty. */
export function sciezkaDozwolona(odp, tryb) {
  const w = triageResult(odp);
  return w.sciezka === tryb;
}
