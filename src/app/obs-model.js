/* OTOREPO — MODEL OBSERWACJI (Blok 8: krok „Oczopląs").
 *
 * ═══ PO CO TEN PLIK ISTNIEJE ═══
 * Do tej pory aplikacja miała JEDEN kanał danych: hipotezę modelu (`state.variant`, `state.side`,
 * `state.dixObs`). Klinicysta nie miał gdzie zapisać, co NAPRAWDĘ zobaczył — mógł tylko oglądać
 * oczopląs przewidywany. Ten moduł dokłada DRUGI, niezależny kanał: relację człowieka.
 *
 * Zmierzone przed napisaniem tego pliku: `dixObs=null` renderował ekran Dix-Hallpike bajt w bajt
 * tak samo jak `'post'` — z podtypem Bárány, stroną chorą i przyciskiem „Rozpocznij: Epley".
 * Czyli PUSTY OPIS dawał pełne rozpoznanie i gotowy manewr. Kryterium odbioru nr 2 („interfejs
 * nie wymusza rozpoznania, zanim użytkownik opisze cechy") było złamane u samego korzenia,
 * a przyczyną było to, że `antMode = isDix && dixObs==="ant"` traktuje `null` identycznie
 * jak `'post'`. Stąd `poparcie()` — bramkujemy WERDYKT, nie kontrolkę.
 *
 * ═══ CZEGO TEN MODUŁ NIE ROBI ═══
 * NIE stawia rozpoznania. Nie nazywa kanału, strony ani mechanizmu — to Blok 9. Blok 8 ma być
 * użyteczny, gdyby Blok 9 nigdy nie powstał: opis obserwacji jest wartością sam w sobie.
 * Bramka SEP2 skanuje wszystkie napisy tego pliku w OBU językach przeciw nazwom kanałów,
 * jednostek chorobowych i manewrów.
 *
 * ═══ DWIE WIELKOŚCI, KTÓRE NIE SĄ „PEWNOŚCIĄ" ═══
 * `kompletnosc` mówi, ILE cech opisano (trzy rozłączne osie). `spojnosc` mówi, ile opisanych
 * cech dynamiki NIE PASUJE do żadnego wzorca, który ten model zna. Żadna z nich nie jest
 * pewnością rozpoznania i żadna nie używa słów „wysoka/średnia/niska": pełny opis obrazu
 * ośrodkowego jest kompletny i bezwartościowy dla BPPV, więc kompletność nie jest sufitem
 * niczego. Liczba nie wychodzi na ekran — czytałaby się jak prawdopodobieństwo rozpoznania.
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * Zero importów, zero DOM, zero `t()` (wywołanie na poziomie modułu ZAMRAŻA język — moduły
 * ładują się przed initLang), zero `new Date`/`Date.now`/`Math.random`. Napisy jako surowe pary
 * {pl,en}. Wiedza kliniczna z silnika WSTRZYKIWANA argumentem (wzorzec inject-for-purity
 * z flow-model.js). Bramka: npm run obs:check.
 */

export const OBS_PROBY = ['dix', 'roll', 'bowlean', 'headhang'];

/* FAZY BEZWZGLĘDNE — nigdy „chore/zdrowe".
   PUŁAPKA ZMIERZONA W SILNIKU: `DIAG.roll.phases(A,v)` kończy się `return [mk(A), mk(H)]`
   (maneuvers.js), więc indeks 0 to ZAWSZE ucho CHORE w dole: roll/P → [yaw=+90, yaw=−90],
   roll/L → [yaw=−90, yaw=+90]. Kolejność faz OBRACA SIĘ razem ze stroną. Formularz musi
   pytać o pozycję FIZYCZNĄ („prawe ucho w dole"), bo klinicysta widzi głowę, a nie hipotezę
   o tym, które ucho jest chore. Przeliczenie na indeks modelu robi `fazaDIAG`. */
export const OBS_FAZY = {
  dix: ['jedyna'],
  headhang: ['jedyna'],
  roll: ['prawoWDole', 'lewoWDole'],
  bowlean: ['bow', 'lean'],
};

export const OBS_FAZY_OPIS = {
  jedyna: { pl: 'w pozycji prowokacyjnej', en: 'in the provoking position' },
  prawoWDole: { pl: 'prawe ucho pacjenta w dole', en: "patient's right ear down" },
  lewoWDole: { pl: 'lewe ucho pacjenta w dole', en: "patient's left ear down" },
  bow: { pl: 'skłon głowy w przód (bow)', en: 'head bent forward (bow)' },
  lean: { pl: 'odchylenie głowy w tył (lean)', en: 'head leaned back (lean)' },
};

/* Znaczniki wiarygodności per POLE (dokument użytkownika: „możliwość oznaczenia obserwacji
   jako niepewnej lub NIEWIARYGODNEJ" — to dwie różne rzeczy, o różnych skutkach).
   `niepewne`      — „widziałem, ale nie ręczę": wartość ZOSTAJE, licznik dostaje POŁOWĘ.
   `niewiarygodne` — „obserwacja BYŁA, ale nie da się na niej polegać": licznik 0, wartość
                     KWARANTANNOWANA (nie wchodzi do odcisku ani do wnioskowania), ale
                     NIE JEST KASOWANA i NIE GASI OSTRZEŻEŃ. Zasada nadrzędna, pilnowana
                     przez FLAGA3: kwarantanna wycisza WNIOSEK, nigdy OSTRZEŻENIE. */
export const ZNACZNIKI = [null, 'niepewne', 'niewiarygodne'];

/* Słownik ZAMKNIĘTY. Bez pozycji „inne", bez pola tekstowego — nigdzie w tym module nie ma
   pola typu tekstowego (KS2). Pole wolnego tekstu w karcie obserwacji jest wektorem danych
   osobowych pacjenta; ta sama zasada, co w torze VOG.
   Dwie pierwsze pozycje mają zakotwiczenie w kodzie (triage-model.js). Trzy dalsze wpisane
   na wyraźną decyzję kliniczną użytkownika 2026-08-01 — repozytorium ich nie zna. */
export const POWODY_NIEWIARYGODNOSCI = [
  { id: 'brakFrenzla', pl: 'brak okularów Frenzla — fiksacja nie została zniesiona', en: 'no Frenzel goggles — fixation was not removed' },
  { id: 'pacjentNiewspolpracujacy', pl: 'pacjent niewspółpracujący', en: 'uncooperative patient' },
  { id: 'nieUtrzymalPozycji', pl: 'pacjent nie utrzymał pozycji', en: 'the patient did not hold the position' },
  { id: 'mruganie', pl: 'silne mruganie / łzawienie', en: 'heavy blinking / watering' },
  { id: 'szyja', pl: 'ograniczenie ruchomości szyi', en: 'restricted neck mobility' },
];

/* WARTOŚCI, KTÓRE NIE NIOSĄ INFORMACJI. Liczą się 0 do licznika, ale ZOSTAJĄ w mianowniku —
   inaczej pominięcie pytania podnosiłoby wynik i aplikacja nagradzałaby milczenie (MON5). */
const BEZ_INFORMACJI = new Set(['niewiem', 'nieBadano', 'nieOdnotowano', 'nieObserwowano', 'niePowtarzano', 'nieUmiemOcenic']);

const w = (id, pl, en) => ({ id, pl, en });

/* Konwencja znaków IDENTYCZNA z Vestibular.quickPhase (`ipsi = ear==="P" ? +1 : -1`):
   +1 = ku PRAWEMU uchu pacjenta, v=+1 = upbeat, t=+1 = górny biegun ku prawemu uchu.
   Konwencja torsji („górny biegun ku uchu") zatwierdzona przez użytkownika 2026-08-01 —
   ta sama, którą liczy silnik, więc między formularzem a modelem NIE MA warstwy tłumaczącej
   i nie ma gdzie zgubić znaku. Bramka KIER2 porównuje to znak w znak z `vestibular.js`. */
export const OBS_POLA = {
  wystapil: {
    os: 'kontekst', waga: 3, zrodlo: 'src/app/triage-model.js',
    pytanie: { pl: 'Czy wystąpił oczopląs?', en: 'Did nystagmus occur?' },
    wartosci: [
      w('tak', 'tak — oczopląs wystąpił', 'yes — nystagmus occurred'),
      w('nie', 'nie — oczopląsu nie było (wynik ujemny)', 'no — there was no nystagmus (negative result)'),
      w('niewiem', 'nie wiem / nie dało się ocenić', "I don't know / could not be assessed"),
    ],
  },
  poziom: {
    os: 'kierunek', waga: 3, faza: true, zrodlo: 'src/engine/vestibular.js',
    pytanie: { pl: 'Składowa pozioma — dokąd bije faza szybka?', en: 'Horizontal component — where does the quick phase beat?' },
    wartosci: [
      w('p1', 'ku PRAWEMU uchu pacjenta (w widoku badającego: w lewo na obrazie)', "toward the patient's RIGHT ear (in the examiner's view: to the left of the image)"),
      w('m1', 'ku LEWEMU uchu pacjenta (w widoku badającego: w prawo na obrazie)', "toward the patient's LEFT ear (in the examiner's view: to the right of the image)"),
      w('zero', 'brak składowej poziomej', 'no horizontal component'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  pion: {
    os: 'kierunek', waga: 3, faza: true, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Składowa pionowa — dokąd bije faza szybka?', en: 'Vertical component — where does the quick phase beat?' },
    wartosci: [
      w('p1', 'ku górze (upbeat) — ku czołu pacjenta', 'upward (upbeat) — toward the patient’s forehead'),
      w('m1', 'ku dołowi (downbeat) — ku brodzie pacjenta', 'downward (downbeat) — toward the patient’s chin'),
      w('zero', 'brak składowej pionowej', 'no vertical component'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  torsja: {
    os: 'kierunek', waga: 3, faza: true, zrodlo: 'src/engine/vestibular.js',
    pytanie: { pl: 'Składowa skrętna — dokąd obraca się GÓRNY biegun gałki?', en: 'Torsional component — where does the UPPER pole of the globe rotate?' },
    wartosci: [
      w('p1', 'górny biegun ku PRAWEMU uchu pacjenta', "the upper pole toward the patient's RIGHT ear"),
      w('m1', 'górny biegun ku LEWEMU uchu pacjenta', "the upper pole toward the patient's LEFT ear"),
      w('zero', 'brak składowej skrętnej', 'no torsional component'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  nasilenie: {
    os: 'kierunek', waga: 3, tylkoProba: 'roll', zrodlo: 'src/pose/maneuvers.js',
    pytanie: { pl: 'Nasilenie w tej pozycji w porównaniu z drugą stroną', en: 'Intensity in this position compared with the other side' },
    wartosci: [
      w('silniejsza', 'silniejszy niż po drugiej stronie', 'stronger than on the other side'),
      w('slabsza', 'słabszy niż po drugiej stronie', 'weaker than on the other side'),
      w('porownywalne', 'porównywalny po obu stronach', 'comparable on both sides'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  latencja: {
    os: 'dynamika', waga: 3, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Latencja — po jakim czasie od ułożenia zaczął się oczopląs?', en: 'Latency — how long after positioning did the nystagmus start?' },
    wartosci: [
      w('brak', 'brak — natychmiast', 'none — immediately'),
      w('1-5s', '1–5 s', '1–5 s'),
      w('powyzej5s', 'powyżej 5 s', 'more than 5 s'),
      w('niewiem', 'nie wiem / nie mierzono', "I don't know / not timed"),
    ],
  },
  czasTrwania: {
    os: 'dynamika', waga: 3, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Czas trwania', en: 'Duration' },
    wartosci: [
      w('ponizej1min', 'poniżej 1 minuty', 'less than 1 minute'),
      w('powyzej1min', 'powyżej 1 minuty — trwał, dopóki trzymano pozycję', 'more than 1 minute — it lasted as long as the position was held'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  meczliwosc: {
    os: 'dynamika', waga: 3, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Zachowanie przy powtórzeniu prowokacji', en: 'Behaviour on repeated provocation' },
    wartosci: [
      w('slabnie', 'słabnie z każdym powtórzeniem', 'weakens with each repetition'),
      w('bezZmian', 'bez zmian przy powtórzeniach', 'unchanged on repetition'),
      w('niePowtarzano', 'nie powtarzano prowokacji', 'the provocation was not repeated'),
      w('nieUmiemOcenic', 'powtarzano, nie umiem ocenić', 'repeated, I cannot judge'),
    ],
  },
  przebieg: {
    os: 'dynamika', waga: 2, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Przebieg w czasie', en: 'Time course' },
    wartosci: [
      w('narastaWygasa', 'narastał, a potem wygasał', 'crescendoed and then faded'),
      w('staly', 'stały — bez narastania i wygasania', 'steady — no crescendo, no fading'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  warunki: {
    os: 'kontekst', waga: 2, zrodlo: 'src/app/triage-model.js',
    pytanie: { pl: 'Warunki obserwacji', en: 'Observation conditions' },
    wartosci: [
      w('wSwietle', 'w świetle — pacjent mógł fiksować wzrok', 'in the light — the patient could fixate'),
      w('bezFiksacji', 'z fiksacją zniesioną (Frenzel / ciemność / oftalmoskop)', 'with fixation removed (Frenzel / darkness / ophthalmoscope)'),
      w('nieOdnotowano', 'nie odnotowano', 'not recorded'),
    ],
  },
  pozycjaNeutralna: {
    os: 'kontekst', waga: 2, zrodlo: 'src/render/svg-screens.js',
    pytanie: { pl: 'Czy oczopląs był obecny również w pozycji neutralnej?', en: 'Was nystagmus also present in the neutral position?' },
    wartosci: [
      w('tak', 'tak — obecny również w pozycji neutralnej', 'yes — also present in the neutral position'),
      w('nie', 'nie — tylko po ułożeniu', 'no — only after positioning'),
      w('nieBadano', 'nie badano pozycji neutralnej', 'the neutral position was not examined'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  /* WAGA 1 i znacznik pozaModelem: silnik BPPV NIE MA parametru fiksacji. Zmierzone klucze
     `Vestibular` nie zawierają ani jednego. Supresja fiksacyjna istnieje wyłącznie w NeuroVOR
     i jest czytana tylko przez ekran HINTS. Pole zostaje, bo klinicysta i tak to obserwuje,
     ale model nie ma czym tego przewidzieć — porównanie z predykcją zwraca `nieporownywalne`. */
  fiksacja: {
    os: 'kontekst', waga: 1, pozaModelem: true, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Wpływ fiksacji wzroku', en: 'Effect of visual fixation' },
    wartosci: [
      w('tlumil', 'tłumił się przy fiksacji', 'suppressed by fixation'),
      w('nieTlumil', 'NIE tłumił się przy fiksacji', 'NOT suppressed by fixation'),
      w('nieBadano', 'nie badano', 'not examined'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
  /* WAGA 1 i pozaModelem: model NIE MA fazy siadu w próbie diagnostycznej. Zmierzone:
     `DIAG.dix.phases` to JEDNA faza, a `engineXi` buduje oś czasu z jednego segmentu.
     Odwrócenie po posadzeniu istnieje wyłącznie w dynamice manewrów i jest tam transjentem
     TEGO SAMEGO znaku, nie odwróceniem. Nie dorabiamy predykcji, której nie ma. */
  odwrocenieSiad: {
    os: 'kontekst', waga: 1, pozaModelem: true, zrodlo: 'engine_doc.txt',
    pytanie: { pl: 'Czy kierunek odwrócił się po posadzeniu pacjenta?', en: 'Did the direction reverse after sitting the patient up?' },
    wartosci: [
      w('odwrocil', 'odwrócił się', 'it reversed'),
      w('nieOdwrocil', 'nie odwrócił się', 'it did not reverse'),
      w('nieObserwowano', 'nie obserwowano po posadzeniu', 'not observed after sitting up'),
      w('niewiem', 'nie wiem', "I don't know"),
    ],
  },
};

const POLA_KIERUNKU_FAZOWE = ['poziom', 'pion', 'torsja'];
const POLA_DYNAMIKI = ['latencja', 'czasTrwania', 'meczliwosc', 'przebieg'];
const POLA_KONTEKSTU_POZA_WYSTAPIL = ['warunki', 'pozycjaNeutralna', 'fiksacja', 'odwrocenieSiad'];

export const OSIE = ['kierunek', 'dynamika', 'kontekst'];

export const kluczInstancji = (pole, fazaId) => (fazaId ? `${pole}#${fazaId}` : pole);
export const rozbijKlucz = (klucz) => {
  const i = klucz.indexOf('#');
  return i < 0 ? { pole: klucz, fazaId: null } : { pole: klucz.slice(0, i), fazaId: klucz.slice(i + 1) };
};

/* Czy instancja pola W OGÓLE jest zadawana przy tej próbie i tym stanie `wystapil`.
   `nieodpowiedziane` zachowuje się jak `tak` — inaczej mianownik PUSTEGO rekordu zapadłby się
   do zera i „pusty rekord ma 100 %" stałoby się prawdą arytmetyczną. */
export function stosowalne(pole, proba, wystapil) {
  const def = OBS_POLA[pole];
  if (!def) return false;
  if (def.tylkoProba && def.tylkoProba !== proba) return false;
  if (def.faza && !(OBS_FAZY[proba] || []).length) return false;
  if (wystapil === 'nie') return def.os === 'kontekst';   // wynik ujemny: kierunek i dynamika nie mają przedmiotu
  return true;
}

/* Wszystkie instancje stosowalne przy danej próbie i danym `wystapil`, w kolejności zadawania. */
export function instancjeStosowalne(proba, wystapil) {
  const out = [];
  const dodaj = (pole, fazaId) => {
    if (!stosowalne(pole, proba, wystapil)) return;
    const def = OBS_POLA[pole];
    out.push({ klucz: kluczInstancji(pole, fazaId), pole, fazaId: fazaId || null, os: def.os, waga: def.waga });
  };
  dodaj('wystapil', null);
  for (const fazaId of (OBS_FAZY[proba] || [])) {
    for (const p of POLA_KIERUNKU_FAZOWE) dodaj(p, fazaId);
  }
  dodaj('nasilenie', null);
  for (const p of POLA_DYNAMIKI) dodaj(p, null);
  for (const p of POLA_KONTEKSTU_POZA_WYSTAPIL) dodaj(p, null);
  return out;
}

export const pustyRekord = (proba) => ({ proba, wystapil: undefined, pola: {}, powodNiewiarygodnosci: undefined });

const wpis = (rekord, klucz) => (rekord && rekord.pola ? rekord.pola[klucz] : undefined);
const wystapilOf = (rekord) => (rekord ? rekord.wystapil : undefined);

/* Wartość instancji z uwzględnieniem kwarantanny. `niewiarygodne` NIE kasuje wartości
   (dane klinicysty zostają), ale wyklucza ją z każdego wnioskowania. */
export function wartoscInstancji(rekord, klucz, { ufajNiewiarygodnym = false } = {}) {
  if (klucz === 'wystapil') return wystapilOf(rekord);
  const e = wpis(rekord, klucz);
  if (!e) return undefined;
  if (!ufajNiewiarygodnym && e.znak === 'niewiarygodne') return undefined;
  return e.w;
}

const mnoznikZnaku = (znak) => (znak === 'niewiarygodne' ? 0 : znak === 'niepewne' ? 1 : 2);

/* ═══ KOMPLETNOŚĆ ═══
   `mozliwe` zależy WYŁĄCZNIE od (os, proba, wystapil) — nigdy od tego, ile pól wypełniono.
   To jest serce konstrukcji i jedyna rzecz, która nie pozwala pustemu rekordowi wyglądać
   na kompletny (MON5). */
export function mozliweOsi(os, proba, wystapil) {
  return instancjeStosowalne(proba, wystapil)
    .filter(i => i.os === os)
    .reduce((s, i) => s + i.waga * 2, 0);
}

export function etykietaOsi({ zdobyte, mozliwe }) {
  if (!mozliwe) return 'nieDotyczy';
  const u = zdobyte / mozliwe;
  return u >= 0.75 ? 'pelny' : u >= 0.5 ? 'czesciowy' : 'szczatkowy';
}

export const ETYKIETY_OSI = {
  pelny: { pl: 'opisany w pełni', en: 'fully described' },
  czesciowy: { pl: 'opisany częściowo', en: 'partly described' },
  szczatkowy: { pl: 'opisany szczątkowo', en: 'barely described' },
  nieDotyczy: { pl: 'nie dotyczy', en: 'not applicable' },
};

/* (USUNIĘTE 2026-08-08) `POWODY_NIEDOTYCZY` — jednoelementowy słownik powodu „nie dotyczy". Powód
   „oczopląsu nie było" niesie dziś sama wartość pola `wystapil`, więc słownik nigdy nie był czytany. */

export function kompletnosc(rekord) {
  const proba = rekord && rekord.proba;
  const wyst = wartoscInstancji(rekord, 'wystapil');
  const out = {};
  for (const os of OSIE) {
    const inst = instancjeStosowalne(proba, wyst).filter(i => i.os === os);
    const mozliwe = inst.reduce((s, i) => s + i.waga * 2, 0);
    let zdobyte = 0;
    for (const i of inst) {
      const e = i.klucz === 'wystapil' ? { w: wyst, znak: null } : wpis(rekord, i.klucz);
      if (!e || e.w == null) continue;
      if (BEZ_INFORMACJI.has(e.w)) continue;
      zdobyte += i.waga * mnoznikZnaku(e.znak);
    }
    const wynik = { zdobyte, mozliwe, etykieta: etykietaOsi({ zdobyte, mozliwe }) };
    if (!mozliwe && wyst === 'nie') wynik.powod = 'wynikUjemny';
    out[os] = wynik;
  }
  return out;
}

/* Pola ZAPISANE, które przestały być stosowalne (np. cały opis kierunku po przestawieniu
   `wystapil` na „nie"). ZOSTAJĄ w rekordzie — ciche kasowanie cudzego zapisu jest najgorszym
   możliwym obejściem się z danymi — ale nie wchodzą do żadnej osi ani do odcisku. */
export function nieuzyte(rekord) {
  if (!rekord || !rekord.pola) return [];
  const proba = rekord.proba, wyst = wartoscInstancji(rekord, 'wystapil');
  const czynne = new Set(instancjeStosowalne(proba, wyst).map(i => i.klucz));
  return Object.keys(rekord.pola).filter(k => !czynne.has(k)).sort();
}

/* ═══ SPÓJNOŚĆ ═══
   Wzorce wyprowadzone z `featsByVariant` — jedynego miejsca, gdzie aplikacja stawia dwuklasowy
   kontrast latencja/czas/męczliwość wprost. Wstrzykiwane, żeby wyrocznia mogła je re-derywować
   z prawdziwego źródła (SPO2). `powyzej5s` nie pasuje do żadnego wzorca. */
export const WZORCE_DYNAMIKI = [
  { id: 'A', latencja: '1-5s', czasTrwania: 'ponizej1min', meczliwosc: 'slabnie', przebieg: 'narastaWygasa' },
  { id: 'B', latencja: 'brak', czasTrwania: 'powyzej1min', meczliwosc: 'bezZmian', przebieg: 'staly' },
];

export function spojnosc(rekord) {
  const opisane = POLA_DYNAMIKI
    .map(p => ({ p, w: wartoscInstancji(rekord, p) }))
    .filter(x => x.w != null && !BEZ_INFORMACJI.has(x.w));
  if (!opisane.length) return { pasujace: [], niepasujace: 0, opisanych: 0 };
  const pasujace = WZORCE_DYNAMIKI.filter(z => opisane.every(x => z[x.p] === x.w)).map(z => z.id);
  const niepasujace = pasujace.length ? 0 : opisane.filter(x => !WZORCE_DYNAMIKI.some(z => z[x.p] === x.w)).length || opisane.length;
  return { pasujace, niepasujace, opisanych: opisane.length };
}

/* ═══ WYPROWADZONE ═══ */

/* Tylko roll. Blok 8 NIE MÓWI, co `niespojne` znaczy klinicznie — mówi tylko, że tak jest. */
export function geoApo(rekord) {
  if (!rekord || rekord.proba !== 'roll') return 'nieDotyczy';
  const pr = wartoscInstancji(rekord, 'poziom#prawoWDole');
  const le = wartoscInstancji(rekord, 'poziom#lewoWDole');
  const kier = (w, geoZnak) => (w == null || w === 'niewiem' || w === 'zero') ? null : (w === geoZnak ? 'geo' : 'apo');
  const a = kier(pr, 'p1'), b = kier(le, 'm1');
  if (a == null || b == null) return 'nierozstrzygalne';
  if (a !== b) return 'niespojne';
  return a === 'geo' ? 'geotropowy' : 'apogeotropowy';
}

/* Tylko bow&lean. Zmierzone: DIAG.bowlean odwraca kierunek między fazami w OBU wariantach,
   więc sama zmienność NIE różnicuje mechanizmu bez znajomości strony chorej. */
export function zmiennoscKierunku(rekord) {
  if (!rekord || rekord.proba !== 'bowlean') return 'nieDotyczy';
  const b = wartoscInstancji(rekord, 'poziom#bow');
  const l = wartoscInstancji(rekord, 'poziom#lean');
  const zn = (x) => (x === 'p1' ? 1 : x === 'm1' ? -1 : null);
  const bb = zn(b), ll = zn(l);
  if (bb == null || ll == null) return 'nierozstrzygalne';
  return bb === -ll ? 'odwraca' : 'nieOdwraca';
}

/* Przeliczenie fazy FORMULARZA (bezwzględnej) na indeks fazy MODELU (kolejność zależna
   od strony). Bez tej funkcji zestawienie obserwacji z predykcją dla roll byłoby odwrócone
   dla jednej ze stron — a to jest dokładnie ten błąd, którego nie widać na oko. */
export function fazaDIAG(proba, fazaId, side) {
  if (proba === 'dix' || proba === 'headhang') return 0;
  if (proba === 'bowlean') return fazaId === 'bow' ? 0 : 1;
  if (proba === 'roll') {
    if (fazaId === 'prawoWDole') return side === 'P' ? 0 : 1;
    if (fazaId === 'lewoWDole') return side === 'P' ? 1 : 0;
  }
  return 0;
}

/* ═══ BRAMKA WERDYKTU ═══
   To jest odpowiedź na defekt, od którego zaczął się cały blok: pusty opis dawał pełne
   rozpoznanie. `poparcie` mówi, ile ekran ma prawo powiedzieć. */
export const POWODY_BRAKU = {
  brakOpisu: { pl: 'Nie opisano jeszcze obserwacji.', en: 'The observation has not been described yet.' },
  brakRoznicownika: { pl: 'Nie opisano składowej pionowej — to ona różnicuje kanał.', en: 'The vertical component has not been described — it is what differentiates the canal.' },
  kierunekNiepasujacy: { pl: 'Opisany kierunek nie odpowiada żadnemu kanałowi w tym modelu.', en: 'The described direction does not match any canal in this model.' },
  wynikUjemny: { pl: 'Zapisano wynik ujemny — nie ma obserwacji, na której można oprzeć wniosek.', en: 'A negative result was recorded — there is no observation to base a conclusion on.' },
  nieprzyjeta: { pl: 'Opisana obserwacja nie jest podstawą pokazanej interpretacji — przyjmij ją albo popraw opis.', en: 'The described observation is not the basis of the shown interpretation — accept it or correct the description.' },
  sprzeczna: { pl: 'Przyjęta podstawa interpretacji mówi co innego niż opis obserwacji.', en: 'The accepted basis of interpretation says something different from the observation.' },
};

const czyOdpowiedziane = (rekord, klucz) => {
  const v = wartoscInstancji(rekord, klucz);
  return v != null && !BEZ_INFORMACJI.has(v);
};

export function zgodnoscPodstawy(rekord, dixObs) {
  if (!rekord || rekord.proba !== 'dix') return 'brakRekordu';
  const pion = wartoscInstancji(rekord, 'pion#jedyna');
  if (pion == null || BEZ_INFORMACJI.has(pion)) return 'brakRekordu';
  const zRekordu = pion === 'm1' ? 'ant' : pion === 'p1' ? 'post' : null;
  if (zRekordu == null) return 'brakRekordu';
  if (dixObs == null) return 'nieprzyjeta';
  return dixObs === zRekordu ? 'zgodna' : 'sprzeczna';
}

export function poparcie(rekord, proba, dixObs) {
  const wyst = wartoscInstancji(rekord, 'wystapil');
  const brak = (powod) => ({ poziom: 'brak', powod });
  if (!rekord || !rekord.pola || (wyst == null && !Object.keys(rekord.pola || {}).length)) return brak('brakOpisu');
  if (wyst === 'nie') return brak('wynikUjemny');

  const fazy = OBS_FAZY[proba] || ['jedyna'];
  const pionK = fazy.map(f => kluczInstancji('pion', f));
  const jakisPion = pionK.some(k => czyOdpowiedziane(rekord, k));
  if (!jakisPion) return brak('brakRoznicownika');

  // pion=0 przy niezerowej torsji = oczopląs CZYSTO SKRĘTNY. To znalezisko DODATNIE, nie brak
  // danych — aplikacja sama nazywa je cechą ośrodkową na ekranie próby.
  for (const f of fazy) {
    const p = wartoscInstancji(rekord, kluczInstancji('pion', f));
    const t = wartoscInstancji(rekord, kluczInstancji('torsja', f));
    if (p === 'zero' && (t === 'p1' || t === 'm1')) return brak('kierunekNiepasujacy');
  }

  if (proba === 'dix') {
    const zg = zgodnoscPodstawy(rekord, dixObs);
    if (zg === 'nieprzyjeta' || zg === 'sprzeczna') return brak(zg);
  }

  const wagi3 = instancjeStosowalne(proba, wyst)
    .filter(i => i.waga === 3 && (i.os === 'kierunek' || i.os === 'dynamika'));
  const pelne = wagi3.every(i => {
    const e = wpis(rekord, i.klucz);
    return czyOdpowiedziane(rekord, i.klucz) && !(e && e.znak === 'niewiarygodne');
  });
  return { poziom: pelne ? 'pelne' : 'czesciowe', powod: null };
}

/* ═══ TRZY ROZCIĘTE SYGNAŁY ═══
   `antMode` był JEDNYM przełącznikiem niosącym równocześnie wnioskowanie i ostrzeżenie,
   więc uszanowanie znacznika „niewiarygodne" gasiło czerwoną flagę downbeatu. Rozcięte:
   wnioskowanie czyta PRZYJĘTĄ PODSTAWĘ, ostrzeżenia czytają REKORD — także kwarantannowany. */
export const wnioskowanieDix = (state) => (state && state.testKey === 'dix' && state.dixObs === 'ant') ? 'ant'
  : (state && state.testKey === 'dix' && state.dixObs === 'post') ? 'post' : null;

const kazdaFaza = (rekord, pole, pred) => {
  const fazy = OBS_FAZY[rekord && rekord.proba] || ['jedyna'];
  return fazy.some(f => pred(wartoscInstancji(rekord, kluczInstancji(pole, f), { ufajNiewiarygodnym: true })));
};

export const ostrzezenieDownbeat = (rekord) => !!rekord && kazdaFaza(rekord, 'pion', v => v === 'm1');
export const ostrzezenieSkretny = (rekord) => {
  if (!rekord) return false;
  const fazy = OBS_FAZY[rekord.proba] || ['jedyna'];
  return fazy.some(f => wartoscInstancji(rekord, kluczInstancji('pion', f), { ufajNiewiarygodnym: true }) === 'zero'
    && ['p1', 'm1'].includes(wartoscInstancji(rekord, kluczInstancji('torsja', f), { ufajNiewiarygodnym: true })));
};

/* FLAGI. Wszystkie czytają rekord Z kwarantannowanymi wartościami (FLAGA3): oznaczenie
   obserwacji jako niewiarygodnej wycisza WNIOSEK, ale nie ma prawa zgasić OSTRZEŻENIA. */
export const FLAGI = {
  f1: { pl: 'Oczopląs czysto pionowy w dół (downbeat).', en: 'Purely vertical downbeat nystagmus.' },
  f2: { pl: 'Oczopląs czysto skrętny bez składowej pionowej.', en: 'Purely torsional nystagmus with no vertical component.' },
  f3: { pl: 'Kierunek w obu pozycjach nie układa się w spójny wzorzec.', en: 'The direction in the two positions does not form a consistent pattern.' },
  f4: { pl: 'Oczopląs obecny także w pozycji neutralnej.', en: 'Nystagmus also present in the neutral position.' },
  f5: { pl: 'Oczopląs nie tłumi się przy fiksacji wzroku.', en: 'The nystagmus is not suppressed by visual fixation.' },
  f6: { pl: 'Brak latencji, przebieg stały i brak wyczerpywania się.', en: 'No latency, steady course and no fatigability.' },
};

export function flagi(rekord) {
  if (!rekord) return [];
  const v = (k) => wartoscInstancji(rekord, k, { ufajNiewiarygodnym: true });
  const out = [];
  if (ostrzezenieDownbeat(rekord)) out.push('f1');
  if (ostrzezenieSkretny(rekord)) out.push('f2');
  if (geoApo(rekord) === 'niespojne') out.push('f3');
  if (v('pozycjaNeutralna') === 'tak') out.push('f4');
  if (v('fiksacja') === 'nieTlumil') out.push('f5');
  const f6 = v('latencja') === 'brak' && v('przebieg') === 'staly' && v('meczliwosc') === 'bezZmian';
  // f6 SAMO nie jest ostrzeżeniem — to opis kupulolitiazy. Ostrzega dopiero w towarzystwie.
  if (f6 && out.some(x => ['f1', 'f2', 'f3', 'f4'].includes(x))) out.push('f6');
  return out;
}

/* ═══ PORÓWNANIE Z PREDYKCJĄ ═══
   CECHA PO CESZE, bez ani jednej liczby zbiorczej. Linijka „5 z 7 cech zgodnych" byłaby już
   miarą trafności hipotezy, czyli Blokiem 9 przemyconym jednym zdaniem — a przy okazji
   sugerowałaby, że model jest wzorcem prawdy, wobec którego ocenia się obserwację klinicysty.
   Kierunek zależności jest odwrotny: to model jest uproszczeniem.

   `fiksacja` i `odwrocenieSiad` zwracają ZAWSZE `nieporownywalne` — silnik BPPV nie ma
   parametru fiksacji, a próba diagnostyczna nie ma w modelu fazy siadu. Nie dorabiamy
   predykcji, której nie ma; mówimy wprost, że nie ma z czym porównać.

   deps.anat(proba, fazaId) → {h, v, t} z silnika (znaki w konwencji quickPhase) albo null.
   deps.wzorzec → 'A' | 'B' | null: który wzorzec dynamiki odpowiada BIEŻĄCEJ hipotezie modelu. */
const znakOpisu = (w) => (w === 'p1' ? 1 : w === 'm1' ? -1 : w === 'zero' ? 0 : null);
const znakModelu = (x) => (x == null ? null : x > 0.05 ? 1 : x < -0.05 ? -1 : 0);

export function porownajZPredykcja(rekord, deps) {
  if (!rekord || !rekord.proba) return [];
  const proba = rekord.proba, wyst = wartoscInstancji(rekord, 'wystapil');
  const out = [];
  for (const i of instancjeStosowalne(proba, wyst)) {
    if (i.klucz === 'wystapil') continue;
    const def = OBS_POLA[i.pole];
    const obs = wartoscInstancji(rekord, i.klucz);
    if (def.pozaModelem) { out.push({ ...i, obs, model: null, werdykt: 'nieporownywalne' }); continue; }
    if (obs == null || BEZ_INFORMACJI.has(obs)) { out.push({ ...i, obs, model: null, werdykt: 'nieopisane' }); continue; }

    if (POLA_KIERUNKU_FAZOWE.includes(i.pole)) {
      const a = deps && deps.anat ? deps.anat(proba, i.fazaId) : null;
      const m = a ? znakModelu(i.pole === 'poziom' ? a.h : i.pole === 'pion' ? a.v : a.t) : null;
      if (m == null) { out.push({ ...i, obs, model: null, werdykt: 'nieporownywalne' }); continue; }
      out.push({ ...i, obs, model: m, werdykt: znakOpisu(obs) === m ? 'zgodne' : 'rozne' });
      continue;
    }
    if (POLA_DYNAMIKI.includes(i.pole)) {
      const z = WZORCE_DYNAMIKI.find(x => x.id === (deps && deps.wzorzec));
      if (!z) { out.push({ ...i, obs, model: null, werdykt: 'nieporownywalne' }); continue; }
      out.push({ ...i, obs, model: z[i.pole], werdykt: z[i.pole] === obs ? 'zgodne' : 'rozne' });
      continue;
    }
    out.push({ ...i, obs, model: null, werdykt: 'nieporownywalne' });
  }
  return out;
}

export const WERDYKTY_POROWNANIA = {
  zgodne: { pl: 'zgodne z modelem', en: 'agrees with the model' },
  rozne: { pl: 'INNE niż w modelu', en: 'DIFFERENT from the model' },
  nieopisane: { pl: 'nieopisane', en: 'not described' },
  nieporownywalne: { pl: 'model tego nie przewiduje', en: 'the model does not predict this' },
};

/* Odcisk do wykrywania nieaktualnego wniosku (Blok 5). WYŁĄCZNIE pola wagi 3 i z pominięciem
   kwarantannowanych — ten sam argument, który wykluczył `dixRep` z odcisku: alarm ma się
   zapalać, gdy zmienia się WNIOSEK, a nie gdy ktoś doprecyzowuje opis. */
export function odciskObserwacji(rekord) {
  if (!rekord || !rekord.proba) return '';
  const wyst = wartoscInstancji(rekord, 'wystapil');
  const czesci = instancjeStosowalne(rekord.proba, wyst)
    .filter(i => i.waga === 3)
    .map(i => `${i.klucz}=${wartoscInstancji(rekord, i.klucz) ?? '-'}`);
  return `${rekord.proba}|${czesci.join(',')}`;
}
