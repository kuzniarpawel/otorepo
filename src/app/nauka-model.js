/* OTOREPO — MODEL TRYBU NAUKI I BIBLIOTEKI PRZYPADKÓW (Blok 13).
 *
 * ═══ ZASADA ═══
 * Przypadek dydaktyczny NIE NIESIE KLUCZA ODPOWIEDZI. Gdyby niósł — a to jest domyślny sposób,
 * w jaki buduje się quizy — powstałby SZÓSTY opis tej samej wiedzy klinicznej (po silniku,
 * `baranyClassify`, `interp-model`, `man-model` i `followup-model`). Rozjechałby się przy
 * pierwszej zmianie parametru i lekcja uczyłaby czegoś, czego aplikacja obok już nie robi,
 * a nikt by tego nie zauważył, bo quiz świeciłby na zielono wobec własnej odpowiedzi.
 *
 * Przypadek niesie WYWIAD (słownik `triage-model`) i OBSERWACJĘ (słownik `obs-model`). Klucz do
 * każdego z sześciu etapów LICZY ten sam model, którego używa ścieżka kliniczna — wstrzyknięty
 * przez `nauka-deps.js`. Zmiana w silniku zmienia lekcję albo zapala wyrocznię; trzeciej
 * możliwości nie ma.
 *
 * ═══ CZTERY POLA KOŃCA PRZYPADKU ═══
 * Dokument wymaga, by każdy przypadek kończył się cechą rozstrzygającą, pułapką, alternatywą
 * i następnym krokiem. Trzy z nich są WYLICZANE (`rozstrzygajaca`, `wykluczone`/`pozostale`,
 * `sugerowaneProby`/`REGULY_KROKOW`). Autorska jest wyłącznie PUŁAPKA — i dlatego jest jedynym
 * polem, którego wyrocznia pilnuje po treści: musi wskazywać cechę albo flagę REALNIE obecną
 * w tym przypadku, żeby nie dało się dopisać morału niezwiązanego z obrazem.
 *
 * ═══ KRYTERIUM ODBIORU NR 1 (decyzja przed odpowiedzią) ═══
 * Odpowiedź nie jest UKRYWANA — ona NIE ISTNIEJE, dopóki nie ma decyzji. `informacjaZwrotna()`
 * zwraca null bez odpowiedzi i bez wskazówki, więc ekran nie ma czego schować ani odsłonić.
 * Wskazówka jest trzecią drogą wprost z dokumentu, ale WSKAZUJE CECHĘ, nigdy nie podaje wyniku,
 * i zostaje zapisana — inaczej „rozwiązałem" i „podejrzałem" byłyby tym samym.
 *
 * ═══ KRYTERIUM ODBIORU NR 4 (niejednoznaczność) ═══
 * Werdykt jest TRÓJWARTOŚCIOWY: `trafna` (zgodna z jedyną odpowiedzią, jaką model potrafi
 * udowodnić) / `dopuszczalna` (jedna z kilku, których model NIE ROZDZIELA) / `bledna`.
 * Zbiór dopuszczalnych bierze się z `pozostale`/`alternatywy`, a nie z deklaracji autora —
 * niejednoznaczność jest więc WŁASNOŚCIĄ MODELU, a nie opinią o przypadku. Tam, gdzie model
 * nie rozstrzyga, etap NIE MA odpowiedzi trafnej: wynik nie stoi wtedy na jednej wartości.
 *
 * Moduł CZYSTY: zero importów, zero DOM, zero `t()`, zero `new Date`/`Math.random`.
 * Napisy jako surowe pary {pl,en}. Bramka: npm run nauka:check.
 */

/* ═══════════ 1. POZIOMY ═══════════
   Trzy poziomy z dokumentu. Poziom NIE JEST miarą trudności obrazu — jest deklaracją, ile
   wiedzy pośredniej przypadek zakłada. Klasyczne BPPV kanału tylnego zostaje „podstawowe" także
   wtedy, gdy ktoś rozwiąże je źle. */
export const POZIOMY = {
  podstawowy: {
    pl: 'podstawowy', en: 'basic',
    opisPl: 'wzorce podręcznikowe — kierunek, latencja, czas trwania',
    opisEn: 'textbook patterns — direction, latency, duration',
  },
  kliniczny: {
    pl: 'kliniczny', en: 'clinical',
    opisPl: 'obrazy, w których rozstrzyga jedna cecha albo jej brak',
    opisEn: 'pictures settled by a single feature, or by its absence',
  },
  ekspercki: {
    pl: 'ekspercki', en: 'expert',
    opisPl: 'maski modelu, obrazy wielokanałowe i cechy przemawiające za ośrodkiem',
    opisEn: 'model masks, multicanal pictures and features arguing for a central cause',
  },
};
export const POZIOM_IDS = ['podstawowy', 'kliniczny', 'ekspercki'];

/* ═══════════ 2. RODZAJE ═══════════ Cztery grupy wprost z dokumentu. */
export const RODZAJE = {
  klasyczny:     { pl: 'klasyczny', en: 'classic',
                   opisPl: 'obraz zgodny ze wzorcem', opisEn: 'a picture matching the pattern' },
  prawieTypowy:  { pl: 'prawie typowy', en: 'near-typical',
                   opisPl: 'jedna cecha odstaje albo jej brakuje', opisEn: 'one feature is off, or missing' },
  wielokanalowy: { pl: 'wielokanałowy', en: 'multicanal',
                   opisPl: 'więcej niż jeden kanał w jednej sesji', opisEn: 'more than one canal in one session' },
  osrodkowy:     { pl: 'ośrodkowy', en: 'central',
                   opisPl: 'wywiad wygląda na BPPV, oczopląs nie', opisEn: 'the history looks like BPPV, the nystagmus does not' },
};
export const RODZAJ_IDS = ['klasyczny', 'prawieTypowy', 'wielokanalowy', 'osrodkowy'];

/* ═══════════ 3. SZEŚĆ ETAPÓW LEKCJI ═══════════
   Kolejność wprost z dokumentu. `pyta:false` ma tylko „opis" — to jest ekspozycja przypadku,
   a nie pytanie; wliczanie go do wyniku dawałoby punkt za przeczytanie. */
export const ETAPY = [
  {
    id: 'opis', pyta: false,
    pl: 'Opis', en: 'Description',
    pytaniePl: null, pytanieEn: null,
    wstepPl: 'Przeczytaj wywiad i wykonaną próbę. Oczopląs zobaczysz po przewidywaniu.',
    wstepEn: 'Read the history and the provocation performed. You will see the nystagmus after your prediction.',
  },
  {
    id: 'przewidywanie', pyta: true,
    pl: 'Przewidywanie oczopląsu', en: 'Predicting the nystagmus',
    pytaniePl: 'Jakiego oczopląsu spodziewasz się w tej próbie?',
    pytanieEn: 'What nystagmus do you expect in this provocation?',
    wstepPl: 'Zanim zobaczysz zapis. Próba potrafi dać kilka różnych wzorców — pytanie brzmi, KTÓRE z nich w ogóle wchodzą w grę.',
    wstepEn: 'Before you see the record. The provocation can produce several patterns — the question is WHICH of them are even possible.',
  },
  {
    id: 'rozpoznanie', pyta: true,
    pl: 'Rozpoznanie', en: 'Recognition',
    pytaniePl: 'Który kanał i która strona?',
    pytanieEn: 'Which canal and which side?',
    wstepPl: 'Teraz znasz zapis obserwacji. Kanał i strona wynikają z KIERUNKU.',
    wstepEn: 'You now know the observation record. Canal and side follow from the DIRECTION.',
  },
  {
    id: 'mechanizm', pyta: true,
    pl: 'Mechanizm', en: 'Mechanism',
    pytaniePl: 'Kanalolitiaza czy kupulolitiaza?',
    pytanieEn: 'Canalithiasis or cupulolithiasis?',
    wstepPl: 'Mechanizmu nie widać w kierunku — rozstrzyga go DYNAMIKA: latencja, czas trwania, męczliwość.',
    wstepEn: 'The mechanism is not visible in the direction — it is settled by the DYNAMICS: latency, duration, fatigability.',
  },
  {
    id: 'manewr', pyta: true,
    pl: 'Manewr', en: 'Maneuver',
    pytaniePl: 'Co robisz dalej z tym obrazem?',
    pytanieEn: 'What do you do next with this picture?',
    wstepPl: 'Manewr wynika z kanału i mechanizmu. „Nie wykonuję repozycji" jest pełnoprawną odpowiedzią, nie rezygnacją.',
    wstepEn: 'The maneuver follows from canal and mechanism. "I do not reposition" is a full answer, not a refusal.',
  },
  {
    id: 'kontrola', pyta: true,
    pl: 'Kontrola', en: 'Follow-up',
    pytaniePl: 'Wynik kontroli jest podany — co dalej?',
    pytanieEn: 'The follow-up result is given — what next?',
    wstepPl: 'Ostatni etap sprawdza to, czego uczy Blok 11: nie każdy wynik kontroli uzasadnia powtórzenie manewru.',
    wstepEn: 'The last stage tests what Block 11 teaches: not every follow-up result justifies repeating the maneuver.',
  },
];
export const ETAP_IDS = ETAPY.map(e => e.id);
export const ETAPY_PYTAJACE = ETAPY.filter(e => e.pyta).map(e => e.id);
export function etapNauki(id) { return ETAPY.find(e => e.id === id) || null; }

/* ═══════════ 4. WERDYKTY ═══════════
   `dopuszczalna` nie jest złagodzonym „źle". Jest twierdzeniem o MODELU: on tych odpowiedzi
   NIE ROZDZIELA, więc nazwanie którejś błędną byłoby nieprawdą, a nazwanie jednej trafną —
   losowaniem. Dlatego etap niejednoznaczny nie ma trafnej odpowiedzi w ogóle. */
export const WERDYKTY = {
  trafna: {
    pl: 'trafna', en: 'correct',
    opisPl: 'to jedyna odpowiedź, jaką ten opis pozwala udowodnić',
    opisEn: 'this is the only answer the description allows to be proven',
  },
  dopuszczalna: {
    pl: 'dopuszczalna', en: 'defensible',
    opisPl: 'model nie rozdziela tej odpowiedzi od innych — na tym opisie nie da się jej podważyć',
    opisEn: 'the model does not separate this answer from the others — it cannot be refuted on this description',
  },
  bledna: {
    pl: 'błędna', en: 'incorrect',
    opisPl: 'opisana obserwacja tę odpowiedź wyklucza',
    opisEn: 'the described observation excludes this answer',
  },
};
export const WERDYKT_IDS = Object.keys(WERDYKTY);

/* Powody błędu — słownik ZAMKNIĘTY, żeby ekran nigdy nie musiał układać zdania sam.
   NIE MA TU pozycji „ta próba nie potrafi dać takiego oczopląsu". Pierwsza wersja modelu ją miała
   i była to najgroźniejsza pomyłka całego bloku: awansowała UPROSZCZENIE SILNIKA do twierdzenia
   klinicznego. Zmierzony przeciwprzykład — model przewiduje dla kanału przedniego czysty downbeat
   bez składowej skrętnej, więc podręcznikowy oczopląs skrętno-pionowy kanału przedniego zostałby
   uczniowi oznaczony jako „niemożliwy". Brak dopasowania w silniku jest TREŚCIĄ odpowiedzi
   (`pozaWzorcami`), nigdy podstawą jej odrzucenia. */
export const POWODY_BLEDU = {
  wykluczonaKierunkiem: { pl: 'kierunek opisany w tej próbie tę kandydaturę wyklucza', en: 'the direction described in this provocation excludes this candidate' },
  wykluczonaDynamika:   { pl: 'opisana dynamika należy do przeciwnego wzorca', en: 'the described dynamics belong to the opposite pattern' },
  zlaStrona:            { pl: 'ten wzorzec należy do UCHA PRZECIWNEGO — próby wykonanej po tej stronie tak nie widać', en: 'this pattern belongs to the OPPOSITE EAR — the provocation performed on this side does not look like that' },
  cechaOsrodkowa:       { pl: 'opis niesie cechę przemawiającą za przyczyną ośrodkową', en: 'the description carries a feature arguing for a central cause' },
  brakPodstawy:         { pl: 'opis nie pasuje do żadnego wzorca, który model zna', en: 'the description matches no pattern the model knows' },
  repozycjaBezPodstawy: { pl: 'repozycja na tej podstawie przeniosłaby złóg w miejsce, którego nikt nie ustalił', en: 'repositioning on this basis would move debris to a place nobody has established' },
  wstrzymanieModelu:    { pl: 'aplikacja wstrzymuje blok leczenia przy KAŻDYM obrazie nietypowym — to granica modelu, nie zakaz kliniczny', en: 'the app withholds the treatment block for EVERY atypical picture — that is a limit of the model, not a clinical prohibition' },
  innyKanal:            { pl: 'to manewr innego kanału', en: 'this is a maneuver for a different canal' },
  obrazTypowy:          { pl: 'obraz jest typowy i wskazuje kanał oraz stronę — jest co leczyć', en: 'the picture is typical and indicates canal and side — there is something to treat' },
  akcjaZakazana:        { pl: 'ten wynik kontroli tej akcji nie uzasadnia', en: 'this follow-up result does not justify this action' },
  wzorzecPasuje:        { pl: 'opisany obraz pasuje do wzorca, który model zna', en: 'the described picture matches a pattern the model knows' },
};

/* Odpowiedzi OSOBNE, nienależące do żadnego słownika klinicznego — trzy i tylko trzy.
   Każda z nich jest odpowiedzią MERYTORYCZNĄ, a nie ucieczką: „nie da się" bywa jedyną
   prawdziwą odpowiedzią i musi dać się ją zaznaczyć, tak samo jak „nie można ocenić" w Bloku 12. */
export const ODPOWIEDZI_WLASNE = {
  nieDaSiePrzewidziec: { pl: 'jednego wzorca nie da się tu przewidzieć — próba może dać więcej niż jeden', en: 'a single pattern cannot be predicted here — the provocation can give more than one' },
  pozaWzorcami:        { pl: 'wzorzec, którego model nie umie przypisać do żadnego kanału', en: 'a pattern the model cannot assign to any canal' },
  obrazNietypowy:      { pl: 'obraz nietypowy — nie nazywam tego BPPV', en: 'atypical picture — I do not call this BPPV' },
  nieRozstrzygaSie:    { pl: 'tego opisu nie da się rozstrzygnąć', en: 'this description cannot settle it' },
  bezRepozycji:        { pl: 'nie wykonuję repozycji na tej podstawie', en: 'I do not reposition on this basis' },
  ocenOsrodkowa:       { pl: 'oceń przyczynę ośrodkową, zanim wrócisz do repozycji', en: 'assess a central cause before returning to repositioning' },
};

/* ═══════════ 5. BIBLIOTEKA ═══════════
   Rekordy w formacie `obs-model` (pola/znaki), wywiad w formacie `triage-model`.
   ŻADNE pole nie mówi, co jest prawidłową odpowiedzią.

   Wywiad przypadków OŚRODKOWYCH wygląda na BPPV (napadowe, pozycyjne, bez czerwonych flag)
   i to jest ich sens: gdyby ośrodkowość dało się odczytać z wywiadu, przypadek uczyłby czytania
   wywiadu, a nie oczopląsu. Czerwone flagi ma już Blok 6 i to on ich uczy. */
const P = (w) => ({ w, znak: null });
const rek = (proba, pola, wystapil = 'tak') => ({
  proba, wystapil, pola: Object.fromEntries(Object.entries(pola).map(([k, v]) => [k, P(v)])),
});
const DYN_KANALO = { latencja: '1-5s', czasTrwania: 'ponizej1min', meczliwosc: 'slabnie', przebieg: 'narastaWygasa' };
const DYN_KUPULO = { latencja: 'brak', czasTrwania: 'powyzej1min', meczliwosc: 'bezZmian', przebieg: 'staly' };
const KTX = { warunki: 'bezFiksacji', pozycjaNeutralna: 'nie', fiksacja: 'tlumil', odwrocenieSiad: 'odwrocil' };
const WYWIAD_BPPV = { przebieg: 'napadowe', wyzwalacz: 'pozycyjny', flagi: ['brak'] };

const dixKier = (torsja, pion = 'p1') => ({ 'poziom#jedyna': 'zero', 'pion#jedyna': pion, 'torsja#jedyna': torsja });
const rollKier = (prawo, lewo) => ({
  'poziom#prawoWDole': prawo, 'pion#prawoWDole': 'zero', 'torsja#prawoWDole': 'zero',
  'poziom#lewoWDole': lewo, 'pion#lewoWDole': 'zero', 'torsja#lewoWDole': 'zero',
});

export const BIBLIOTEKA = [
  {
    id: 'pc-p-klasyk', poziom: 'podstawowy', rodzaj: 'klasyczny', stronaProby: 'P',
    tytulPl: 'Zawroty przy kładzeniu się — próba Dix-Hallpike’a w prawo',
    tytulEn: 'Dizziness on lying down — Dix-Hallpike to the right',
    kontekstPl: 'Krótkie napady zawrotów przy kładzeniu się i przy wstawaniu z łóżka, od kilku dni. Wykonano próbę Dix-Hallpike’a w prawo, z fiksacją zniesioną.',
    kontekstEn: 'Short attacks of vertigo on lying down and getting out of bed, for several days. A Dix-Hallpike to the right was performed, with fixation removed.',
    triage: WYWIAD_BPPV,
    obs: { dix: rek('dix', { ...dixKier('p1'), ...DYN_KANALO, ...KTX }) },
    kontrolaWynik: 'ustapienie',
    pulapkaCecha: 'torsja#jedyna',
    pulapkaPl: 'Składowa pionowa mówi tu tylko tyle, że to kanał TYLNY, a nie przedni. Strony nie niesie — niesie ją SKRĘT, i to on jest jedyną cechą, która odróżnia prawą stronę od lewej w tym zapisie.',
    pulapkaEn: 'The vertical component says only that this is the POSTERIOR canal, not the anterior one. It does not carry the side — the TORSION does, and it is the only feature separating right from left in this record.',
  },
  {
    id: 'pc-l-klasyk', poziom: 'podstawowy', rodzaj: 'klasyczny', stronaProby: 'L',
    tytulPl: 'Ten sam wzorzec, druga strona',
    tytulEn: 'The same pattern, the other side',
    kontekstPl: 'Napady zawrotów przy obracaniu się w łóżku. Wykonano próbę Dix-Hallpike’a w lewo, z fiksacją zniesioną.',
    kontekstEn: 'Attacks of vertigo on rolling over in bed. A Dix-Hallpike to the left was performed, with fixation removed.',
    triage: WYWIAD_BPPV,
    obs: { dix: rek('dix', { ...dixKier('m1'), ...DYN_KANALO, ...KTX }) },
    kontrolaWynik: 'czesciowaPoprawa',
    pulapkaCecha: 'torsja#jedyna',
    pulapkaPl: 'Kierunek skrętu opisujemy przez GÓRNY biegun gałki — nie przez to, w którą stronę „ucieka" obraz. Zamiana tej konwencji odwraca stronę, a razem z nią ucho, na którym wykonasz manewr.',
    pulapkaEn: 'Torsion is described by the UPPER pole of the globe — not by which way the image seems to run. Swapping that convention flips the side, and with it the ear you will treat.',
  },
  {
    id: 'hc-geo-l', poziom: 'podstawowy', rodzaj: 'klasyczny',
    tytulPl: 'Test rolki — oczopląs geotropowy',
    tytulEn: 'Roll test — geotropic nystagmus',
    kontekstPl: 'Gwałtowne zawroty przy obracaniu się w łóżku na boki, bez związku z kładzeniem się. Wykonano test rolki w obie strony.',
    kontekstEn: 'Violent vertigo on rolling to either side in bed, unrelated to lying down. A roll test was performed to both sides.',
    triage: WYWIAD_BPPV,
    obs: { roll: rek('roll', { ...rollKier('p1', 'm1'), nasilenie: 'slabsza', ...DYN_KANALO, ...KTX }) },
    kontrolaWynik: 'ustapienie',
    pulapkaCecha: 'nasilenie',
    pulapkaPl: 'Kierunek geotropowy mówi o MECHANIZMIE, nie o stronie: bije do ziemi po obu stronach. Stronę niesie wyłącznie różnica NASILENIA — to jest II prawo Ewalda przy łóżku, i bez tej jednej odpowiedzi manewr nie ma ucha.',
    pulapkaEn: 'A geotropic direction speaks of the MECHANISM, not the side: it beats toward the ground on both sides. Only the difference in INTENSITY carries the side — that is Ewald’s second law at the bedside, and without that one answer the maneuver has no ear.',
  },
  {
    id: 'hc-geo-p', poziom: 'kliniczny', rodzaj: 'klasyczny',
    tytulPl: 'Test rolki — geotropowy, silniejszy po prawej',
    tytulEn: 'Roll test — geotropic, stronger on the right',
    kontekstPl: 'Napady zawrotów przy obracaniu się w łóżku. Test rolki wykonany w obie strony, z fiksacją zniesioną.',
    kontekstEn: 'Attacks of vertigo on rolling over in bed. A roll test was performed to both sides, with fixation removed.',
    triage: WYWIAD_BPPV,
    obs: { roll: rek('roll', { ...rollKier('p1', 'm1'), nasilenie: 'silniejsza', ...DYN_KANALO, ...KTX }) },
    kontrolaWynik: 'brakPoprawy',
    pulapkaCecha: 'nasilenie',
    pulapkaPl: 'Ta sama para kierunków co w poprzednim przypadku daje DRUGĄ stronę, bo odwrócone jest jedno pole: nasilenie. Jeżeli nie porównałeś obu pozycji, nie masz strony — masz połowę rozpoznania.',
    pulapkaEn: 'The same pair of directions as in the previous case gives the OTHER side, because one field is reversed: the intensity. If you did not compare both positions, you have no side — you have half a diagnosis.',
  },
  {
    id: 'hc-apo-p', poziom: 'kliniczny', rodzaj: 'prawieTypowy',
    tytulPl: 'Test rolki — oczopląs apogeotropowy',
    tytulEn: 'Roll test — apogeotropic nystagmus',
    kontekstPl: 'Zawroty przy obracaniu w łóżku, trwające dłużej niż minutę i nieustępujące, dopóki pacjent leży. Test rolki w obie strony.',
    kontekstEn: 'Vertigo on rolling in bed, lasting more than a minute and not settling as long as the patient lies still. Roll test to both sides.',
    triage: WYWIAD_BPPV,
    obs: { roll: rek('roll', { ...rollKier('m1', 'p1'), nasilenie: 'slabsza', ...DYN_KUPULO, ...KTX }) },
    kontrolaWynik: 'konwersja',
    pulapkaCecha: 'nasilenie',
    pulapkaPl: 'Przy kupulolitiazie relacja nasilenia jest ODWRÓCONA: chore ucho w dole daje oczopląs SŁABSZY. Odruchowe przeniesienie reguły „silniejsza strona = chora" z kanalolitiazy wskazuje tu drugie ucho.',
    pulapkaEn: 'In cupulolithiasis the intensity relation is REVERSED: the affected ear down gives the WEAKER nystagmus. Carrying the canalithiasis rule "stronger side = affected side" over to this case points at the wrong ear.',
  },
  {
    id: 'pc-bez-dynamiki', poziom: 'kliniczny', rodzaj: 'prawieTypowy', stronaProby: 'P',
    tytulPl: 'Kierunek opisany, dynamika nie',
    tytulEn: 'The direction recorded, the dynamics not',
    kontekstPl: 'Próba Dix-Hallpike’a w prawo wykonana w gabinecie zabiegowym, przy świetle. Kierunek odnotowany, prowokacji nie powtarzano, czasu nie mierzono.',
    kontekstEn: 'A Dix-Hallpike to the right performed in a treatment room, in the light. The direction was noted, the provocation was not repeated, nothing was timed.',
    triage: WYWIAD_BPPV,
    obs: { dix: rek('dix', { ...dixKier('p1'), meczliwosc: 'niePowtarzano', warunki: 'wSwietle' }) },
    kontrolaWynik: 'niewiarygodne',
    pulapkaCecha: 'latencja',
    pulapkaPl: 'Kanał i strona są tu pewne, a mechanizm nie jest — i to nie dlatego, że obraz jest dziwny, tylko dlatego, że nikt nie zmierzył czasu. Wybór manewru „bo zwykle to kanalolitiaza" jest zgadywaniem podpartym częstością, a nie tym opisem.',
    pulapkaEn: 'Canal and side are certain here, the mechanism is not — and not because the picture is odd, but because nobody timed anything. Choosing the maneuver "because it is usually canalithiasis" is guessing backed by prevalence, not by this description.',
  },
  {
    id: 'pc-latencja-dluga', poziom: 'ekspercki', rodzaj: 'prawieTypowy', stronaProby: 'P',
    tytulPl: 'Podręcznikowy kierunek, latencja ponad 5 sekund',
    tytulEn: 'Textbook direction, latency over 5 seconds',
    kontekstPl: 'Próba Dix-Hallpike’a w prawo. Oczopląs pojawił się dopiero po dłuższej chwili — badający odnotował latencję powyżej 5 sekund. Poza tym obraz jak z podręcznika.',
    kontekstEn: 'A Dix-Hallpike to the right. The nystagmus appeared only after a while — the examiner recorded a latency of more than 5 seconds. Otherwise the picture is textbook.',
    triage: WYWIAD_BPPV,
    obs: { dix: rek('dix', { ...dixKier('p1'), latencja: 'powyzej5s', czasTrwania: 'ponizej1min', meczliwosc: 'slabnie', przebieg: 'narastaWygasa', ...KTX }) },
    kontrolaWynik: 'czesciowaPoprawa',
    pulapkaCecha: 'latencja',
    pulapkaPl: 'Wartość „powyżej 5 s" nie należy do ŻADNEGO z dwóch wzorców dynamiki, które zna ten model — więc niczego nie wyklucza, a mimo to zapala „obraz nietypowy". Aplikacja wstrzymuje wtedy blok leczenia, choć kierunek wskazuje kanał i stronę. To jest granica MODELU, nie zakaz kliniczny.',
    pulapkaEn: 'The value "more than 5 s" belongs to NEITHER of the two dynamic patterns this model knows — so it excludes nothing, yet it still raises "atypical picture". The app then withholds the treatment block, even though the direction indicates canal and side. That is a limit of the MODEL, not a clinical prohibition.',
  },
  {
    id: 'ac-headhang', poziom: 'ekspercki', rodzaj: 'prawieTypowy',
    tytulPl: 'Downbeat w pozycji zwieszonej głowy',
    tytulEn: 'Downbeat in the head-hanging position',
    kontekstPl: 'Napady zawrotów przy odchylaniu głowy do tyłu (mycie włosów, półka nad głową). Wykonano próbę zwieszonej głowy w linii pośrodkowej, z fiksacją zniesioną.',
    kontekstEn: 'Attacks of vertigo on tipping the head back (washing hair, reaching a high shelf). A straight head-hanging test was performed, with fixation removed.',
    triage: WYWIAD_BPPV,
    obs: { headhang: rek('headhang', { 'poziom#jedyna': 'zero', 'pion#jedyna': 'm1', 'torsja#jedyna': 'zero', ...DYN_KANALO, ...KTX }) },
    kontrolaWynik: 'ustapienie',
    pulapkaCecha: 'pion#jedyna',
    pulapkaPl: 'Wszystkie cztery kandydatury kanału przedniego mają w tym modelu IDENTYCZNY kierunek. Strony nie da się z tego zapisu wyprowadzić — i nie jest to brak wiedzy badającego, tylko granica uproszczenia „kanał przedni = czysty downbeat". Manewr Yacovino jest tu obustronny i właśnie dlatego działa bez lateralizacji.',
    pulapkaEn: 'All four anterior-canal candidates have an IDENTICAL direction in this model. The side cannot be derived from this record — and that is not a gap in the examiner’s knowledge but the limit of the simplification "anterior canal = pure downbeat". The Yacovino maneuver is bilateral here, which is exactly why it works without lateralization.',
  },
  {
    id: 'pc-hc-p', poziom: 'ekspercki', rodzaj: 'wielokanalowy', stronaProby: 'P',
    tytulPl: 'Dwie próby dodatnie u jednego pacjenta',
    tytulEn: 'Two positive provocations in one patient',
    kontekstPl: 'Zawroty przy kładzeniu się I przy obracaniu na boki. Wykonano obie próby: Dix-Hallpike w prawo oraz test rolki.',
    kontekstEn: 'Vertigo on lying down AND on rolling to the sides. Both provocations were performed: a Dix-Hallpike to the right and a roll test.',
    triage: WYWIAD_BPPV,
    obs: {
      dix: rek('dix', { ...dixKier('p1'), ...DYN_KANALO, ...KTX }),
      roll: rek('roll', { ...rollKier('p1', 'm1'), nasilenie: 'silniejsza', ...DYN_KANALO, ...KTX }),
    },
    kontrolaWynik: 'czesciowaPoprawa',
    pulapkaCecha: 'nasilenie',
    pulapkaPl: 'Dwa dodatnie wyniki po tej samej stronie to nie sprzeczność do rozstrzygnięcia, tylko dwa kanały do leczenia. Model liczy każdą próbę OSOBNO i żadna z nich nie unieważnia drugiej — sprzeczność zobaczyłbyś dopiero wtedy, gdyby wskazywały różne strony.',
    pulapkaEn: 'Two positive results on the same side are not a contradiction to resolve but two canals to treat. The model evaluates each provocation SEPARATELY and neither invalidates the other — you would see a contradiction only if they pointed to different sides.',
  },
  {
    id: 'konwersja-po-epleyu', poziom: 'kliniczny', rodzaj: 'wielokanalowy',
    tytulPl: 'Po manewrze Epleya wzorzec się zmienił',
    tytulEn: 'After an Epley the pattern changed',
    kontekstPl: 'Pacjent leczony wcześniej manewrem Epleya z powodu obrazu kanału tylnego po stronie prawej. W kontroli zawroty są inne — pojawiają się przy obracaniu na boki. Wykonano test rolki.',
    kontekstEn: 'The patient was previously treated with an Epley for a right posterior-canal picture. At follow-up the vertigo is different — it appears on rolling to the sides. A roll test was performed.',
    triage: WYWIAD_BPPV,
    obs: { roll: rek('roll', { ...rollKier('p1', 'm1'), nasilenie: 'silniejsza', ...DYN_KANALO, ...KTX }) },
    kontrolaWynik: 'konwersja',
    pulapkaCecha: 'poziom#prawoWDole',
    pulapkaPl: 'Konwersja kanałowa nie jest porażką poprzedniego manewru — jest jego skutkiem. Powtórzenie Epleya leczyłoby kanał, w którym złogu już nie ma, dlatego ta akcja jest w tym miejscu ZAKAZANA, a nie tylko „mniej dobra".',
    pulapkaEn: 'A canal conversion is not a failure of the previous maneuver — it is its consequence. Repeating the Epley would treat a canal the debris has already left, which is why that action is FORBIDDEN here, not merely "less good".',
  },
  {
    id: 'downbeat-staly', poziom: 'kliniczny', rodzaj: 'osrodkowy', stronaProby: 'P',
    tytulPl: 'Downbeat, który nie ustaje',
    tytulEn: 'A downbeat that does not stop',
    kontekstPl: 'Zawroty opisywane jako pozycyjne. Próba Dix-Hallpike’a w prawo: oczopląs bez latencji, trwa tak długo, jak długo trzymana jest pozycja, obecny także w pozycji neutralnej i NIE tłumi się przy fiksacji wzroku.',
    kontekstEn: 'Vertigo described as positional. Dix-Hallpike to the right: nystagmus with no latency, lasting as long as the position is held, present in the neutral position too, and NOT suppressed by visual fixation.',
    triage: WYWIAD_BPPV,
    obs: { dix: rek('dix', { 'poziom#jedyna': 'zero', 'pion#jedyna': 'm1', 'torsja#jedyna': 'zero',
                             ...DYN_KUPULO, warunki: 'bezFiksacji', pozycjaNeutralna: 'tak', fiksacja: 'nieTlumil' }) },
    kontrolaWynik: null,
    pulapkaCecha: 'f5',
    pulapkaPl: 'Model podaje tu kandydatury kanału przedniego i podałby manewr — a równocześnie zapala cechy ośrodkowe. To jest najgroźniejszy układ w całej aplikacji: lista kandydatur wygląda jak rozpoznanie. Rozstrzyga nie ona, tylko brak latencji, brak wygasania, obecność w pozycji neutralnej i BRAK TŁUMIENIA PRZY FIKSACJI.',
    pulapkaEn: 'The model offers anterior-canal candidates here and would offer a maneuver — while at the same time raising central features. This is the most dangerous configuration in the whole app: the candidate list looks like a diagnosis. What settles it is not the list but the absent latency, the absent fading, the presence in the neutral position and the LACK OF FIXATION SUPPRESSION.',
  },
  {
    id: 'czysto-skretny', poziom: 'ekspercki', rodzaj: 'osrodkowy', stronaProby: 'P',
    tytulPl: 'Oczopląs czysto skrętny',
    tytulEn: 'Purely torsional nystagmus',
    kontekstPl: 'Próba Dix-Hallpike’a w prawo. Oczopląs wyłącznie skrętny — bez składowej pionowej, bez latencji, stały, nietłumiony fiksacją.',
    kontekstEn: 'Dix-Hallpike to the right. Purely torsional nystagmus — no vertical component, no latency, steady, not suppressed by fixation.',
    triage: WYWIAD_BPPV,
    obs: { dix: rek('dix', { 'poziom#jedyna': 'zero', 'pion#jedyna': 'zero', 'torsja#jedyna': 'p1',
                             ...DYN_KUPULO, warunki: 'bezFiksacji', pozycjaNeutralna: 'nie', fiksacja: 'nieTlumil' }) },
    kontrolaWynik: null,
    pulapkaCecha: 'f2',
    pulapkaPl: 'Tu nie zostaje ANI JEDNA kandydatura — nie dlatego, że opis jest niepełny, tylko dlatego, że każdy kanał w tym modelu daje jakąś składową pionową. Pusty wynik jest twierdzeniem: „to nie jest wzorzec, który znam", a nie zaproszeniem do wybrania najbliższego.',
    pulapkaEn: 'Not a SINGLE candidate survives here — not because the description is incomplete, but because every canal in this model produces some vertical component. An empty result is a statement: "this is not a pattern I know", not an invitation to pick the nearest one.',
  },
  {
    id: 'roll-niespojny', poziom: 'ekspercki', rodzaj: 'osrodkowy',
    tytulPl: 'Test rolki bijący w tę samą stronę w obu pozycjach',
    tytulEn: 'A roll test beating the same way in both positions',
    kontekstPl: 'Zawroty przy obracaniu w łóżku. Test rolki: w obu pozycjach oczopląs bije ku prawemu uchu, o porównywalnym nasileniu, bez latencji, obecny również w pozycji neutralnej, nietłumiony fiksacją.',
    kontekstEn: 'Vertigo on rolling in bed. Roll test: in both positions the nystagmus beats toward the right ear, of comparable intensity, with no latency, present in the neutral position too, not suppressed by fixation.',
    triage: WYWIAD_BPPV,
    obs: { roll: rek('roll', { ...rollKier('p1', 'p1'), nasilenie: 'porownywalne',
                               ...DYN_KUPULO, warunki: 'bezFiksacji', pozycjaNeutralna: 'tak', fiksacja: 'nieTlumil' }) },
    kontrolaWynik: null,
    pulapkaCecha: 'f3',
    pulapkaPl: 'Oczopląs, który w obu pozycjach bije w tę samą stronę, nie jest ani geotropowy, ani apogeotropowy — jest oczopląsem SAMOISTNYM, na który ułożenie nie ma wpływu. Nazwanie go „geotropowym po jednej stronie" jest próbą zmieszczenia obrazu w schemacie, do którego nie należy.',
    pulapkaEn: 'A nystagmus beating the same way in both positions is neither geotropic nor apogeotropic — it is a SPONTANEOUS nystagmus that positioning does not change. Calling it "geotropic on one side" is an attempt to fit the picture into a scheme it does not belong to.',
  },
];

export const PRZYPADEK_IDS = BIBLIOTEKA.map(p => p.id);
export function przypadek(id) { return BIBLIOTEKA.find(p => p.id === id) || null; }

/* Filtr biblioteki. `null` znaczy „bez ograniczenia", a nie „żaden" — pusta lista przy pustym
   filtrze byłaby biblioteką, która startuje pusta i wygląda na zepsutą. */
export function przypadki(filtr) {
  const f = filtr || {};
  return BIBLIOTEKA.filter(p => (!f.poziom || p.poziom === f.poziom) && (!f.rodzaj || p.rodzaj === f.rodzaj));
}

/* Próba GŁÓWNA przypadku — pierwsza w kolejności zapisu. Przypadek wielokanałowy ma ich więcej;
   lekcja prowadzi po głównej, a pozostałe pokazuje jako drugi wynik dodatni. */
export const probyPrzypadku = (p) => Object.keys((p && p.obs) || {});
export const probaGlowna = (p) => probyPrzypadku(p)[0] || null;

/* ═══════════ 6. KLUCZ — LICZONY, NIE WPISANY ═══════════
   Jedno miejsce, w którym składają się trzy modele. KOLEJNOŚĆ JEST WYMAGANIEM, nie stylem:
   `nietypowy` czytamy PRZED `interpretuj`, bo dokładnie w tej kolejności czyta je aplikacja
   (`renderDiag`: bramka obrazu nietypowego stoi przed blokiem leczenia). Odwrotna kolejność
   dałaby lekcję, która przy downbeacie bez tłumienia fiksacją najpierw nazywa kanał przedni,
   a dopiero potem — jeśli w ogóle — wspomina o cechach ośrodkowych. */
export function kluczPrzypadku(p, deps) {
  const proba = probaGlowna(p);
  const rekord = deps.rekord(proba);
  const interp = deps.interpretuj(rekord, proba);
  const wsparcie = deps.poparcie(rekord, proba);
  const niet = deps.nietypowy();
  const flagi = deps.flagi(rekord);
  const powodyNiet = (niet && niet.powody) || [];
  /* Trzy rozłączne role nietypowości. `flagaOsrodkowa` niesie CECHĘ, której obraz obwodowy nie
     ma. `sprzecznyZWszystkimi` / `wyciszoneKwarantanna` znaczą, że nie została ANI JEDNA
     kandydatura — więc nie ma czego nazwać, niezależnie od tego, co o tym sądzimy klinicznie.
     `dynamikaBezWzorca` jest zastrzeżeniem: kandydatura stoi, ale model wstrzymuje leczenie.
     Rozdzielenie ma skutek: przy pierwszych dwóch kandydatura kanału NIE ISTNIEJE albo jest
     obarczona cechą ośrodkową, ale NIGDY nie zostaje uznana za odpowiedź błędną — bo aplikacja
     na ekranie diagnostyki nadal ją nazywa (gałąź `antMode`: downbeat w Dix-Hallpike'u wskazuje
     kanał PRZEDNI ucha przeciwnego). Nazwanie jej błędem uczyłoby, że kanał przedni nie istnieje. */
  const brakKandydatur = powodyNiet.includes('sprzecznyZWszystkimi') || powodyNiet.includes('wyciszoneKwarantanna');
  const cechaOsrodkowa = powodyNiet.includes('flagaOsrodkowa');
  const zakazBPPV = cechaOsrodkowa || brakKandydatur;
  const tylkoDynamika = !!powodyNiet.length && !zakazBPPV;
  // Klucz manewru liczymy z PRÓBY zapisanej w przypadku, nie z „pierwszej próby kanału".
  const dobor = interp.mechanizm ? deps.doborZProby(proba, interp.mechanizm) : null;
  const inne = probyPrzypadku(p).slice(1).map(pr => {
    const r2 = deps.rekord(pr);
    const i2 = deps.interpretuj(r2, pr);
    return { proba: pr, kanal: i2.kanal, strona: i2.strona, mechanizm: i2.mechanizm, pozostale: i2.pozostale };
  });
  const wzorceStrony = deps.wzorceProby(proba, p.stronaProby || null);
  const obserwowany = deps.odciskObserwacji(rekord, proba);
  return {
    proba, rekord, interp, wsparcie, flagi,
    nietypowy: !!(niet && niet.nietypowy), powodyNietypowosci: powodyNiet,
    zakazBPPV, cechaOsrodkowa, brakKandydatur, tylkoDynamika,
    dobor, inne,
    wzorceStrony, obserwowany,
    // Czy zaobserwowany obraz W OGÓLE pasuje do któregokolwiek wzorca, jaki model przewiduje.
    pozaWzorcami: !obserwowany || !wzorceStrony.some(w => w.odcisk === obserwowany),
    sugerowane: deps.sugerowaneProby(interp.pozostale, proba),
    wynikKontroli: p.kontrolaWynik || null,
    regula: p.kontrolaWynik ? deps.regula(p.kontrolaWynik) : null,
  };
}

/* ═══════════ 7. OPCJE ETAPÓW ═══════════
   Każda opcja ma `v` (identyfikator), `zrodlo` (skąd się wzięła) i — dla opcji klinicznych —
   dane, z których EKRAN złoży napis w prawdziwym słowniku. Model nie niesie napisów pól
   obserwacji ani nazw manewrów: druga ich kopia rozjechałaby się z pierwszą.

   PRZEWIDYWANIE — NOŚNIKIEM BŁĘDU JEST UCHO, NIE „NIEMOŻLIWOŚĆ".
   Pierwsza wersja oznaczała jako błędne wzorce, których dana próba „nie potrafi dać". To była
   nieprawda: próba Dix-Hallpike'a kładzie głowę do tyłu i potrafi sprowokować także inny kanał,
   a czysty downbeat bez skrętu to uproszczenie modelu kanału przedniego, nie fizyka. Błędem jest
   natomiast wzorzec DRUGIEGO UCHA: próba wykonana w prawo nie pokaże kanału tylnego lewego.
   Ta jedna pomyłka wysyła klinicystę na manewr niewłaściwej strony — `man-model.js` poświęca jej
   osobny komentarz i osobny przypadek wyroczni, więc etap przewidywania nie ma prawa nazywać
   jej „dopuszczalną".
   Próby OBUSTRONNE (rolka, bow&lean) nie mają strony; nośnikiem błędu zostaje tam wyłącznie
   `pozaWzorcami` zaznaczone na obrazie, który do wzorca pasuje. */
export function opcjePrzewidywania(p, deps) {
  const proba = probaGlowna(p);
  const strona = p.stronaProby || null;
  const naszej = deps.wzorceProby(proba, strona) || [];
  const naszeOdciski = new Set(naszej.map(w => w.odcisk));
  const drugiej = strona
    ? (deps.wzorceProby(proba, strona === 'P' ? 'L' : 'P') || []).filter(w => !naszeOdciski.has(w.odcisk))
    : [];
  return [
    ...naszej.map(w => ({ v: w.odcisk, typ: 'wzorzec', naszaStrona: true, fazy: w.fazy, relacja: w.relacja, kandydatury: w.kandydatury })),
    ...drugiej.map(w => ({ v: w.odcisk, typ: 'wzorzec', naszaStrona: false, fazy: w.fazy, relacja: w.relacja, kandydatury: w.kandydatury })),
    { v: 'pozaWzorcami', typ: 'wlasna' },
    { v: 'nieDaSiePrzewidziec', typ: 'wlasna' },
  ];
}

/* ROZPOZNANIE: kandydatury próby zredukowane do par KANAŁ+STRONA (mechanizm ma własny etap),
   plus „obraz nietypowy". */
export function opcjeRozpoznania(p, deps) {
  const proba = probaGlowna(p);
  const pary = [];
  for (const k of (deps.kandydatury(proba) || [])) {
    const v = `${k.canal}:${k.side}`;
    if (!pary.some(x => x.v === v)) pary.push({ v, typ: 'kandydatura', kanal: k.canal, strona: k.side });
  }
  return [...pary, { v: 'obrazNietypowy', typ: 'wlasna' }];
}

export function opcjeMechanizmu() {
  return [
    { v: 'canalo', typ: 'mechanizm' },
    { v: 'cupulo', typ: 'mechanizm' },
    { v: 'nieRozstrzygaSie', typ: 'wlasna' },
  ];
}

/* MANEWR: WSZYSTKIE manewry, jakie zna aplikacja — nie tylko manewry ustalonego kanału.
   Zawężenie listy do kanału z etapu 3 zamieniłoby pytanie „który manewr" w pytanie „który
   z trzech", czyli oddałoby odpowiedź za darmo temu, kto trafił kanał. */
export function opcjeManewru(deps) {
  return [
    ...(deps.wszystkieManewry() || []).map(k => ({ v: k, typ: 'manewr' })),
    { v: 'bezRepozycji', typ: 'wlasna' },
  ];
}

export function opcjeKontroli(p, deps) {
  const klucz = kluczPrzypadku(p, deps);
  const akcje = (deps.akcje() || []).map(a => ({ v: a, typ: 'akcja' }));
  return klucz.wynikKontroli ? akcje : [...akcje, { v: 'ocenOsrodkowa', typ: 'wlasna' }];
}

export function opcjeEtapu(etapId, p, deps) {
  if (etapId === 'przewidywanie') return opcjePrzewidywania(p, deps);
  if (etapId === 'rozpoznanie') return opcjeRozpoznania(p, deps);
  if (etapId === 'mechanizm') return opcjeMechanizmu();
  if (etapId === 'manewr') return opcjeManewru(deps);
  if (etapId === 'kontrola') return opcjeKontroli(p, deps);
  return [];
}

/* ═══════════ 8. WERDYKT ETAPU ═══════════
   Zwraca {werdykt, powod} dla KAŻDEJ opcji — nie tylko dla zaznaczonej. Dzięki temu ekran
   porównania „Twoja odpowiedź obok mechanizmu" (układ D3) rysuje się z jednego źródła,
   a wyrocznia sprawdza CAŁĄ tabelę werdyktów, a nie tylko ścieżkę, którą ktoś przeszedł. */
const W = (werdykt, powod) => ({ werdykt, powod: powod || null });

/* PRZEWIDYWANIE. Cztery reguły, każda z osobnym uzasadnieniem:
   · wzorzec ZAOBSERWOWANY — trafna (to jest odpowiedź, którą przypadek naprawdę pokazał);
   · inny wzorzec TEJ SAMEJ strony — dopuszczalna (wywiad go nie wyklucza);
   · wzorzec DRUGIEGO ucha — błędna (patrz komentarz przy `opcjePrzewidywania`);
   · „poza wzorcami" — trafna, gdy obraz naprawdę nie pasuje do niczego (to jest cała pointa
     przypadku czysto skrętnego i niespójnej rolki), błędna, gdy pasuje;
   · „nie da się przewidzieć jednego" — LICZONA, nie ustalona: trafna, gdy po tej stronie zostaje
     więcej niż jeden wzorzec, dopuszczalna, gdy dokładnie jeden. Nigdy błędna — powściągliwość
     nie jest błędem — ale nigdy też nie jest darmowa: przy jednym wzorcu nie dostaje trafnej,
     więc naciskanie jej w kółko nie przechodzi biblioteki bez śladu. */
function werdyktyPrzewidywania(p, deps, klucz) {
  const opcje = opcjePrzewidywania(p, deps);
  const ile = klucz.wzorceStrony.length;
  const out = {};
  for (const o of opcje) {
    if (o.v === 'nieDaSiePrzewidziec') { out[o.v] = ile > 1 ? W('trafna') : W('dopuszczalna'); continue; }
    if (o.v === 'pozaWzorcami') { out[o.v] = klucz.pozaWzorcami ? W('trafna') : W('bledna', 'wzorzecPasuje'); continue; }
    if (!o.naszaStrona) { out[o.v] = W('bledna', 'zlaStrona'); continue; }
    out[o.v] = (klucz.obserwowany && o.v === klucz.obserwowany) ? W('trafna') : W('dopuszczalna');
  }
  return out;
}

/* ROZPOZNANIE. Kandydatura, KTÓRA PRZEŻYŁA, nigdy nie jest odpowiedzią błędną — nawet gdy obraz
   niesie cechę ośrodkową. Pierwsza wersja modelu oznaczała ją wtedy jako błędną i skutek był
   taki, że BPPV kanału przedniego znikało z różnicowania: każdy downbeat w Dix-Hallpike'u zapala
   `flagaOsrodkowa`, więc uczeń uczyłby się zdania „downbeat = nigdy BPPV". Aplikacja mówi coś
   innego — na ekranie diagnostyki NAZYWA kanał przedni i RÓWNOCZEŚNIE wstrzymuje leczenie.
   Lekcja odbija to dokładnie: „obraz nietypowy" jest trafną, kandydatura zostaje dopuszczalną. */
function werdyktyRozpoznania(p, deps, klucz) {
  const opcje = opcjeRozpoznania(p, deps);
  const pozostale = klucz.interp.pozostale || [];
  const pary = [...new Set(pozostale.map(k => `${k.canal}:${k.side}`))];
  const out = {};
  for (const o of opcje) {
    if (o.v === 'obrazNietypowy') { out[o.v] = klucz.zakazBPPV ? W('trafna') : W('bledna', 'obrazTypowy'); continue; }
    if (!pary.includes(o.v)) { out[o.v] = W('bledna', klucz.brakKandydatur ? 'brakPodstawy' : 'wykluczonaKierunkiem'); continue; }
    if (klucz.cechaOsrodkowa) { out[o.v] = W('dopuszczalna', 'cechaOsrodkowa'); continue; }
    out[o.v] = pary.length === 1 ? W('trafna') : W('dopuszczalna');
  }
  return out;
}

/* MECHANIZM. Przy obrazie, którego nie wolno nazwać BPPV, pytanie o mechanizm złogu nie ma
   przedmiotu — trafną jest „tego opisu nie da się rozstrzygnąć", a mechanizm, który przeżył
   w kandydaturach, zostaje dopuszczalny (ta sama zasada, co w rozpoznaniu: kandydatura modelu
   nie staje się nagle odpowiedzią błędną). */
function werdyktyMechanizmu(p, deps, klucz) {
  const pozostale = klucz.interp.pozostale || [];
  const mech = [...new Set(pozostale.map(k => k.variant))];
  const jedyny = mech.length === 1 && !klucz.zakazBPPV;
  const out = {};
  for (const o of opcjeMechanizmu()) {
    if (o.v === 'nieRozstrzygaSie') { out[o.v] = jedyny ? W('bledna', 'obrazTypowy') : W('trafna'); continue; }
    if (!mech.includes(o.v)) { out[o.v] = W('bledna', mech.length ? 'wykluczonaDynamika' : 'brakPodstawy'); continue; }
    out[o.v] = jedyny ? W('trafna') : W('dopuszczalna', klucz.zakazBPPV ? 'cechaOsrodkowa' : null);
  }
  return out;
}

/* MANEWR — DWIE ROZŁĄCZNE GAŁĘZIE, nigdy obie naraz.
   To jest naprawa po krytyce: pierwsza wersja pozwalała, żeby przy obrazie „nietypowym tylko
   z powodu dynamiki" NIE-BŁĘDNE były równocześnie manewr i „nie wykonuję repozycji". Wtedy cztery
   z pięciu odpowiedzi były zielone i przypadek, którego CAŁA lekcja polega na wstrzymaniu ręki,
   dawał ten sam werdykt temu, kto się zatrzymał, i temu, kto nie. Model aplikacji traktuje te dwie
   drogi jako WYKLUCZAJĄCE SIĘ (`REGULY_KROKOW.residual`: `obserwuj` jako główny ORAZ jawny zakaz
   repozycji z podanym powodem) — lekcja odbija to samo:
     · obraz NIETYPOWY (z jakiegokolwiek powodu) → „nie repozycjonuję" trafna, KAŻDY manewr błędny;
       to jest dosłownie zachowanie aplikacji, która przy nietypowym obrazie nie pokazuje leczenia;
     · obraz typowy → „nie repozycjonuję" BŁĘDNA, manewry kandydatur nie-błędne. */
function werdyktyManewru(p, deps, klucz) {
  const out = {};
  const opcje = opcjeManewru(deps);
  const dopuszczalne = new Set();
  if (klucz.dobor) { dopuszczalne.add(klucz.dobor.pierwszy); for (const a of klucz.dobor.alternatywy) dopuszczalne.add(a); }
  else {
    // kanał znany, mechanizm nie — bierzemy manewr KAŻDEJ kandydatury, która przeżyła
    for (const k of (klucz.interp.pozostale || [])) {
      const d = deps.doborZProby(klucz.proba, k.variant);
      if (d) { dopuszczalne.add(d.pierwszy); for (const a of d.alternatywy) dopuszczalne.add(a); }
    }
  }
  const powodWstrzymania = klucz.cechaOsrodkowa ? 'cechaOsrodkowa'
    : klucz.brakKandydatur ? 'repozycjaBezPodstawy' : 'wstrzymanieModelu';
  for (const o of opcje) {
    if (o.v === 'bezRepozycji') {
      out[o.v] = klucz.nietypowy ? W('trafna') : W('bledna', 'obrazTypowy');
      continue;
    }
    if (klucz.nietypowy) { out[o.v] = W('bledna', powodWstrzymania); continue; }
    if (!dopuszczalne.has(o.v)) { out[o.v] = W('bledna', 'innyKanal'); continue; }
    out[o.v] = (klucz.dobor && o.v === klucz.dobor.pierwszy) ? W('trafna') : W('dopuszczalna');
  }
  return out;
}

/* KONTROLA — dwie gałęzie. Przy obrazie, którego nie leczono, nie ma „wyniku kontroli po
   manewrze": pytanie brzmi, co zrobić z obrazem nietypowym, a odpowiedź jest ta sama, którą
   aplikacja daje w karcie obrazu nietypowego. */
function werdyktyKontroli(p, deps, klucz) {
  const out = {};
  const opcje = opcjeKontroli(p, deps);
  if (!klucz.wynikKontroli) {
    for (const o of opcje) {
      if (o.v === 'ocenOsrodkowa') { out[o.v] = W('trafna'); continue; }
      if (o.v === 'powtorzManewr' || o.v === 'alternatywnyManewr') { out[o.v] = W('bledna', 'repozycjaBezPodstawy'); continue; }
      out[o.v] = W('dopuszczalna');
    }
    return out;
  }
  const reg = klucz.regula || { glowny: null, dalsze: [], zakaz: [] };
  const zakaz = new Map((reg.zakaz || []).map(([a, powod]) => [a, powod]));
  for (const o of opcje) {
    if (zakaz.has(o.v)) { out[o.v] = W('bledna', 'akcjaZakazana'); continue; }
    if (o.v === reg.glowny) { out[o.v] = W('trafna'); continue; }
    if ((reg.dalsze || []).includes(o.v)) { out[o.v] = W('dopuszczalna'); continue; }
    if ((deps.zawszeDostepne() || []).includes(o.v)) { out[o.v] = W('dopuszczalna'); continue; }
    out[o.v] = W('bledna', 'akcjaZakazana');
  }
  return out;
}

export function werdyktyEtapu(etapId, p, deps, klucz) {
  const k = klucz || kluczPrzypadku(p, deps);
  if (etapId === 'przewidywanie') return werdyktyPrzewidywania(p, deps, k);
  if (etapId === 'rozpoznanie') return werdyktyRozpoznania(p, deps, k);
  if (etapId === 'mechanizm') return werdyktyMechanizmu(p, deps, k);
  if (etapId === 'manewr') return werdyktyManewru(p, deps, k);
  if (etapId === 'kontrola') return werdyktyKontroli(p, deps, k);
  return {};
}

/* ═══════════ 8b. MOC ROZSTRZYGAJĄCA — BRAMKA JAKOŚCI BIBLIOTEKI ═══════════
   Liczona przy BUDOWANIU biblioteki, nie przy ocenianiu ucznia. Etap, na którym żadna odpowiedź
   nie jest błędna, nie mierzy niczego, a wygląda na oceniony — i to jest gorsze niż brak oceny,
   bo uczeń wychodzi z przekonaniem, że umie.

   PRÓG „nie-błędnych najwyżej połowa" ZOSTAŁ ODRZUCONY PO POMIARZE. Wywalał wszystkie 13
   przypadków, w tym te, które wiernie odbijają model aplikacji: przy wyniku kontroli „częściowa
   poprawa" Blok 11 dopuszcza cztery akcje z sześciu, więc lekcja, która dopuszcza tyle samo, jest
   POPRAWNA, a nie tępa. Próg mierzył moją intuicję o ostrości quizu, a nie własność modelu.

   Zostaje jedno, sprawdzalne wymaganie: NOŚNIK BŁĘDU. Etap ma go mieć — z jednym wyjątkiem
   wypowiedzianym wprost: przy próbie OBUSTRONNEJ (rolka, bow&lean, zwieszona głowa w linii
   pośrodkowej) przewidywanie wzorca z samego wywiadu nie ma odpowiedzi błędnej, bo wywiad nie
   niesie ani kanału, ani strony. To jest twierdzenie o wiedzy, nie luka — i ekran ma je
   powiedzieć, a nie ukryć za pustą oceną. */
export function mocRozstrzygajaca(etapId, p, deps, klucz) {
  const w = werdyktyEtapu(etapId, p, deps, klucz);
  const wartosci = Object.values(w);
  const bledne = wartosci.filter(x => x.werdykt === 'bledna').length;
  const trafne = wartosci.filter(x => x.werdykt === 'trafna').length;
  /* Etap bez nośnika błędu jest dopuszczalny WYŁĄCZNIE tam, gdzie model DA SIĘ ZAPYTAĆ i sam
     odpowiada, że nie rozróżnia — nigdy „bo tak wyszło". Dwa takie miejsca zmierzono:
       · przewidywanie przy próbie OBUSTRONNEJ — nie ma ucha, o które można się pomylić;
       · mechanizm, gdy PRZEŻYŁY OBA warianty — nie ma czego wykluczyć.
     Poza nimi brak odpowiedzi błędnej znaczy, że etap tylko wygląda na oceniony. */
  const k = klucz || kluczPrzypadku(p, deps);
  const obaMechanizmy = new Set((k.interp.pozostale || []).map(x => x.variant)).size === 2;
  const wolnoBezNosnika = (etapId === 'przewidywanie' && !p.stronaProby) || (etapId === 'mechanizm' && obaMechanizmy);
  return {
    opcji: wartosci.length, bledne, trafne, nieBledne: wartosci.length - bledne,
    bezNosnikaBledu: bledne === 0,
    ostra: bledne >= 1 || wolnoBezNosnika,
  };
}

export function mocPrzypadku(p, deps) {
  const klucz = kluczPrzypadku(p, deps);
  const etapy = ETAPY_PYTAJACE.map(id => ({ etap: id, ...mocRozstrzygajaca(id, p, deps, klucz) }));
  const zTrafna = etapy.filter(e => e.trafne > 0).length;
  return {
    etapy, zTrafna,
    tepe: etapy.filter(e => !e.ostra).map(e => e.etap),
    // Przypadek niejednoznaczny NA KAŻDYM etapie nie uczy niczego, czego dałoby się dowieść.
    ostry: etapy.every(e => e.ostra) && zTrafna >= 3,
  };
}

/* WALIDATOR PRZYPADKU. „Brak klucza" i „wartość pusta" to w tej dziedzinie dwie różne rzeczy:
   przypadek, który pomija `flagi`, nie mówi „bez czerwonych flag" — on nie mówi nic, a każde
   scalenie z czymkolwiek wpuściłoby tam cudzą wartość. Dlatego pustka musi być zapisana JAWNIE. */
export const POLA_WYMAGANE_WYWIADU = ['przebieg', 'flagi'];
export function walidujPrzypadek(p) {
  const braki = [];
  if (!p || typeof p !== 'object') return { ok: false, braki: ['brakPrzypadku'] };
  if (!POZIOM_IDS.includes(p.poziom)) braki.push('poziom');
  if (!RODZAJ_IDS.includes(p.rodzaj)) braki.push('rodzaj');
  if (!p.triage || typeof p.triage !== 'object') braki.push('triage');
  else for (const k of POLA_WYMAGANE_WYWIADU) if (!(k in p.triage)) braki.push(`triage.${k}`);
  const proby = probyPrzypadku(p);
  if (!proby.length) braki.push('obs');
  for (const pr of proby) {
    const r = p.obs[pr];
    if (!r || r.proba !== pr) braki.push(`obs.${pr}.proba`);
    if (!r || !('wystapil' in r)) braki.push(`obs.${pr}.wystapil`);
  }
  // Strona próby jest wymagana dokładnie tam, gdzie próba jest JEDNOSTRONNA.
  if (['dix', 'headhang'].includes(proby[0]) && proby[0] === 'dix' && !['P', 'L'].includes(p.stronaProby)) braki.push('stronaProby');
  if (!p.pulapkaPl || !p.pulapkaEn || !p.pulapkaCecha) braki.push('pulapka');
  return { ok: braki.length === 0, braki };
}

/* Czy etap jest NIEJEDNOZNACZNY — czyli czy model nie zna dla niego jedynej odpowiedzi.
   To jest maszynowa definicja „przypadku celowo niejednoznacznego" z kryterium odbioru nr 4:
   nie deklaracja autora, tylko brak trafnej odpowiedzi w tabeli werdyktów. */
export function etapNiejednoznaczny(etapId, p, deps, klucz) {
  const w = werdyktyEtapu(etapId, p, deps, klucz);
  return !Object.values(w).some(x => x.werdykt === 'trafna');
}

/* ═══════════ 9. WSKAZÓWKA ═══════════
   Trzecia droga z dokumentu („chyba że wybierze wskazówkę"). WSKAZUJE CECHĘ, nigdy nie podaje
   odpowiedzi — wskazówka, która mówi „to kanał tylny prawy", nie byłaby wskazówką, tylko
   odpowiedzią pod inną nazwą. Treść jest WYLICZANA z `rozstrzygajaca`, więc nie da się jej
   rozjechać z obrazem przez przeoczenie w tekście. */
export const RODZAJE_WSKAZOWEK = {
  cecha:      { pl: 'Popatrz na tę cechę — to ona wyklucza najwięcej kandydatur.', en: 'Look at this feature — it excludes the most candidates.' },
  brakCechy:  { pl: 'Tej cechy nikt nie opisał, a bez niej etap nie ma jak się rozstrzygnąć.', en: 'Nobody described this feature, and without it the stage cannot be settled.' },
  flaga:      { pl: 'W opisie jest cecha, która nie należy do obrazu obwodowego.', en: 'The description carries a feature that does not belong to a peripheral picture.' },
  zbior:      { pl: 'Więcej niż jedna odpowiedź jest tu do obrony — pytanie brzmi, które odpadają.', en: 'More than one answer is defensible here — the question is which ones drop out.' },
};

export function wskazowka(etapId, p, deps, klucz) {
  const k = klucz || kluczPrzypadku(p, deps);
  if (k.flagi.length && (etapId === 'rozpoznanie' || etapId === 'manewr' || etapId === 'kontrola')) {
    return { rodzaj: 'flaga', flaga: k.flagi[0], klucz: null };
  }
  /* Wskazówka do MECHANIZMU musi wskazać cechę DYNAMIKI, a nie kierunku. Bez tego wyjątku
     wypadała tu `rozstrzygajaca`, czyli przy klasycznym Dix-Hallpike'u — składowa skrętna,
     która o mechanizmie nie mówi nic i odsyłała ucznia w złą stronę. */
  const DYNAMIKA = ['latencja', 'czasTrwania', 'meczliwosc'];
  if (etapId === 'mechanizm') {
    const brak = (k.interp.brakujace || []).find(x => DYNAMIKA.includes(x));
    if (brak) return { rodzaj: 'brakCechy', klucz: brak, flaga: null };
    return { rodzaj: 'cecha', klucz: DYNAMIKA[0], flaga: null };
  }
  if (etapNiejednoznaczny(etapId, p, deps, k)) return { rodzaj: 'zbior', klucz: null, flaga: null };
  if (k.interp.rozstrzygajaca) return { rodzaj: 'cecha', klucz: k.interp.rozstrzygajaca.klucz, flaga: null };
  return { rodzaj: 'zbior', klucz: null, flaga: null };
}

/* ═══════════ 10. KRYTERIUM ODBIORU NR 1 ═══════════
   Odpowiedź nie istnieje przed decyzją. Ta funkcja jest JEDYNYM wejściem do informacji zwrotnej,
   więc ekran nie ma żadnej innej drogi, którą mógłby ją narysować „na wszelki wypadek". */
export function odsloniete(stan, etapId) {
  const s = stan || {};
  const odp = (s.naukaOdp || {})[etapId];
  const wsk = ((s.naukaWskazowki || []).includes(etapId));
  return { odpowiedziano: odp != null, wskazowka: wsk, odsloniete: odp != null || wsk };
}

export function informacjaZwrotna(etapId, p, deps, stan) {
  const o = odsloniete(stan, etapId);
  if (!o.odpowiedziano) return null;                 // ← kryterium odbioru nr 1
  const k = kluczPrzypadku(p, deps);
  const wszystkie = werdyktyEtapu(etapId, p, deps, k);
  const moja = (stan.naukaOdp || {})[etapId];
  const w = wszystkie[moja] || W('bledna', 'niemozliwyWzorzec');
  /* DWA RÓŻNE RODZAJE NIEJEDNOZNACZNOŚCI, i ekran musi umieć powiedzieć oba.
     `niejednoznaczny` — model NIE ZNA jedynej odpowiedzi (nie ma trafnej w ogóle).
     `nierozdzielone`  — trafna istnieje, ale obok niej stoją odpowiedzi, których model od niej
                         NIE ODDZIELA. Tak wygląda przypadek z nieopisaną dynamiką: trafną jest
                         „nie da się rozstrzygnąć", a kanalolitiaza i kupulolitiaza zostają obie
                         do obrony. Bez tego drugiego sygnału ekran milczałby dokładnie tam, gdzie
                         cała lekcja przypadku polega na nazwaniu granicy wiedzy. */
  return {
    etap: etapId, odpowiedz: moja, werdykt: w.werdykt, powod: w.powod,
    werdykty: wszystkie,
    niejednoznaczny: !Object.values(wszystkie).some(x => x.werdykt === 'trafna'),
    nierozdzielone: Object.values(wszystkie).filter(x => x.werdykt === 'dopuszczalna').length > 0,
    zeWskazowka: o.wskazowka,
    klucz: k,
  };
}

/* ═══════════ 11. POSTĘP LEKCJI ═══════════ */
export function postepLekcji(p, stan) {
  const odp = (stan && stan.naukaOdp) || {};
  const wsk = (stan && stan.naukaWskazowki) || [];
  const odpowiedziane = ETAPY_PYTAJACE.filter(id => odp[id] != null);
  return {
    wszystkich: ETAPY_PYTAJACE.length,
    zrobione: odpowiedziane.length,
    zeWskazowka: ETAPY_PYTAJACE.filter(id => wsk.includes(id)).length,
    ukonczona: odpowiedziane.length === ETAPY_PYTAJACE.length,
    nastepny: ETAP_IDS.find(id => etapNauki(id).pyta && odp[id] == null) || null,
  };
}

/* Czy z ekranu wolno przejść do następnego etapu. Dokument: „użytkownik musi podjąć decyzję
   przed odsłonięciem odpowiedzi, chyba że wybierze wskazówkę" — wskazówka NIE ZWALNIA
   z decyzji, tylko ją ułatwia. Bez odpowiedzi nie ma przejścia dalej. */
export function wolnoDalej(stan, etapId) {
  const e = etapNauki(etapId);
  if (!e) return false;
  if (!e.pyta) return true;
  return ((stan && stan.naukaOdp) || {})[etapId] != null;
}

/* ═══════════ 12. KONIEC PRZYPADKU — CZTERY POLA ═══════════
   Trzy wyliczane, jedno autorskie. `alternatywa` bierzemy z kandydatury ODRZUCONEJ NAJPÓŹNIEJ
   w sensie klinicznym: tej, która różni się od pozostałej wyłącznie mechanizmem albo stroną —
   bo to ona jest realną pomyłką, a nie kandydatura z innego kanału. */
export function koniecPrzypadku(p, deps, klucz) {
  const k = klucz || kluczPrzypadku(p, deps);
  const pozostale = k.interp.pozostale || [];
  const wykluczone = k.interp.wykluczone || [];
  const wzor = pozostale[0] || null;
  const bliskie = wzor
    ? wykluczone.filter(x => x.canal === wzor.canal && (x.side === wzor.side || x.variant === wzor.variant))
    : wykluczone;
  const alternatywa = (bliskie[0] || wykluczone[0] || null);
  const nastepny = k.zakazBPPV ? { rodzaj: 'ocenOsrodkowa' }
    : k.sugerowane.length ? { rodzaj: 'proba', proby: k.sugerowane }
    : k.regula ? { rodzaj: 'akcja', akcja: k.regula.glowny }
    : k.dobor ? { rodzaj: 'manewr', manewr: k.dobor.pierwszy }
    : { rodzaj: 'ocenOsrodkowa' };
  return {
    rozstrzygajaca: k.interp.rozstrzygajaca || null,
    alternatywa: alternatywa ? { kanal: alternatywa.canal, strona: alternatywa.side, mechanizm: alternatywa.variant,
                                 wykluczonaCzym: alternatywa.wykluczoneCzym || null } : null,
    nastepny,
    pulapka: { cecha: p.pulapkaCecha, pl: p.pulapkaPl, en: p.pulapkaEn },
  };
}

/* ═══════════ 13. WYNIK PRZYPADKU ═══════════
   KRYTERIUM ODBIORU NR 4. Wynik NIE JEST liczbą. Jest profilem etapów, a przy każdym etapie
   niejednoznacznym stoi jawnie, że model nie zna tam jedynej odpowiedzi. Pojedyncza liczba
   („5/5") kłamałaby w obie strony: nagradzałaby trafienie tam, gdzie trafiać nie było czym,
   i karałaby odpowiedź obronną. */
export const OCENY = {
  rozwiazany:   { pl: 'rozwiązany', en: 'solved', opisPl: 'wszystkie etapy trafne albo dopuszczalne, bez wskazówek', opisEn: 'every stage correct or defensible, without hints' },
  zeWskazowka:  { pl: 'rozwiązany ze wskazówką', en: 'solved with a hint', opisPl: 'bez błędnych odpowiedzi, ale z użytą wskazówką', opisEn: 'no incorrect answers, but a hint was used' },
  zBledami:     { pl: 'z błędami', en: 'with errors', opisPl: 'co najmniej jedna odpowiedź wykluczona przez opis', opisEn: 'at least one answer excluded by the description' },
  nieukonczony: { pl: 'nieukończony', en: 'unfinished', opisPl: 'nie wszystkie etapy mają odpowiedź', opisEn: 'not every stage has an answer' },
};

export function wynikPrzypadku(p, deps, stan) {
  const k = kluczPrzypadku(p, deps);
  const post = postepLekcji(p, stan);
  const etapy = ETAPY_PYTAJACE.map(id => {
    const odp = ((stan && stan.naukaOdp) || {})[id];
    const wsz = werdyktyEtapu(id, p, deps, k);
    const w = odp != null ? (wsz[odp] || W('bledna', 'niemozliwyWzorzec')) : W(null);
    return {
      etap: id, odpowiedz: odp == null ? null : odp, werdykt: w.werdykt, powod: w.powod,
      niejednoznaczny: !Object.values(wsz).some(x => x.werdykt === 'trafna'),
      zeWskazowka: ((stan && stan.naukaWskazowki) || []).includes(id),
    };
  });
  const bledne = etapy.filter(e => e.werdykt === 'bledna').length;
  const ocena = !post.ukonczona ? 'nieukonczony' : bledne ? 'zBledami' : post.zeWskazowka ? 'zeWskazowka' : 'rozwiazany';
  return { etapy, bledne, ocena, postep: post, niejednoznacznych: etapy.filter(e => e.niejednoznaczny).length, koniec: koniecPrzypadku(p, deps, k), klucz: k };
}

/* ═══════════ 14. ZAPIS POSTĘPU (kryterium odbioru nr 2) ═══════════
   Wpis postępu jest LISTĄ ZAMKNIĘTĄ pól i wyłącznie identyfikatorów. Strażnik odrzuca wpis,
   w którym pojawi się cokolwiek spoza słowników — tak samo jak strażnik wpisu kontroli
   w Bloku 11 i wpisu badania w Bloku 12: ODRZUCA, nie czyści. Cicha sanitacja wyglądałaby
   jak zapis, którego nie było.

   Wpis NIE NIESIE ZEGARA. Przypadki są syntetyczne, więc nie ma tu danych pacjenta — ale czas
   rozwiązywania jest daną o UŻYTKOWNIKU, a złoty wzorzec i tak musi zostać deterministyczny. */
export const POLA_POSTEPU = ['przypadek', 'ocena', 'werdykty', 'wskazowki'];

export function wpisPostepu(p, deps, stan) {
  const w = wynikPrzypadku(p, deps, stan);
  return {
    przypadek: p.id,
    ocena: w.ocena,
    werdykty: Object.fromEntries(w.etapy.filter(e => e.werdykt).map(e => [e.etap, e.werdykt])),
    wskazowki: w.etapy.filter(e => e.zeWskazowka).map(e => e.etap),
  };
}

export function bezDanychOsobowychNauka(wpis) {
  const powody = [];
  if (!wpis || typeof wpis !== 'object') return { czysty: false, powody: ['brakWpisu'] };
  for (const k of Object.keys(wpis)) if (!POLA_POSTEPU.includes(k)) powody.push(`poleSpozaSlownika:${k}`);
  if (!PRZYPADEK_IDS.includes(wpis.przypadek)) powody.push('przypadekSpozaBiblioteki');
  if (!Object.keys(OCENY).includes(wpis.ocena)) powody.push('ocenaSpozaSlownika');
  for (const [etap, werdykt] of Object.entries(wpis.werdykty || {})) {
    if (!ETAPY_PYTAJACE.includes(etap)) powody.push(`etapSpozaSlownika:${etap}`);
    if (!WERDYKT_IDS.includes(werdykt)) powody.push(`werdyktSpozaSlownika:${werdykt}`);
  }
  for (const etap of (wpis.wskazowki || [])) if (!ETAPY_PYTAJACE.includes(etap)) powody.push(`etapSpozaSlownika:${etap}`);
  return { czysty: powody.length === 0, powody };
}

/* ═══════════ 15. POSTĘP BIBLIOTEKI ═══════════
   Postęp czytany z pamięci przeglądarki może zawierać identyfikatory przypadków, których już
   nie ma (biblioteka się zmieniła). Nie kasujemy ich po cichu i nie liczymy do postępu —
   pokazujemy liczbę, żeby użytkownik wiedział, że coś zniknęło, zamiast zastanawiać się,
   dlaczego licznik cofnął się sam z siebie. */
export function postepBiblioteki(postep, filtr) {
  const zapisane = postep && typeof postep === 'object' ? postep : {};
  const lista = przypadki(filtr);
  const znane = lista.filter(p => zapisane[p.id]);
  const obce = Object.keys(zapisane).filter(id => !PRZYPADEK_IDS.includes(id));
  return {
    wszystkich: lista.length,
    dotkniete: znane.length,
    rozwiazane: znane.filter(p => ['rozwiazany', 'zeWskazowka'].includes((zapisane[p.id] || {}).ocena)).length,
    zBledami: znane.filter(p => (zapisane[p.id] || {}).ocena === 'zBledami').length,
    nieznaneWpisy: obce.length,
  };
}
