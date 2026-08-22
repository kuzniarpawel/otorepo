/* OTOREPO — TROPY OŚRODKOWEGO OCZOPLĄSU POZYCYJNEGO (CPN). Etap D-CPN, 2026-08-21.
 *
 * ═══ PO CO TEN MODUŁ ISTNIEJE ═══
 * Do tego etapu czerwone flagi CPN żyły w PIĘCIU literałach (karta diagnostyki, FLAGI modelu
 * obserwacji, proza przy schemacie downbeatu, skrót na karcie GRACE, dokumentacja view_doc) —
 * i JUŻ SIĘ ROZESZŁY. Siedem różnic, z czego trzy zmieniały treść kliniczną:
 *   1. karta wypisywała „bez latencji" / „uporczywy" / „niemęczliwy" jako TRZY NIEZALEŻNE czerwone
 *      flagi, podczas gdy obs-model.js od dawna ma regułę odwrotną — ta triada SAMA jest opisem
 *      KUPULOLITIAZY i ostrzega dopiero w towarzystwie innych cech (patrz CPN_REGULA_TRIADY);
 *   2. karta nie znała braku tłumienia fiksacją (f5), choć model to liczy;
 *   3. „oczopląs bywa zmienny kierunkowo" na karcie było ODWRÓCENIEM znaczenia f3, które mówi,
 *      że kierunek NIE układa się w spójny wzorzec.
 * Ten moduł jest odtąd JEDNYM źródłem treści klinicznej karty.
 *
 * ═══ DLACZEGO OSOBNY PLIK, A NIE obs-model.js ═══
 * Kierunek jest WYMUSZONY BRAMKAMI, nie gustem. `tools/obs-check.mjs` ma dwie reguły, które
 * zamykają tamtą drogę: CZ1/bez-importow zabrania obs-model.js JAKIEGOKOLWIEK importu, a SEP2
 * skanuje jego napisy listą zakazanych wzorców zawierającą /\bBPPV\b/i i nazwy kanałów — czyli
 * zastrzeżenia klinicznie konieczne w tej treści (np. kontrapunkt o kanale przednim) zapaliłyby ją.
 * Ten moduł jest więc CZYSTY (zero importów, sam tekst i dane) i stoi obok triage-model.js, który
 * jest precedensem: czysty moduł swobodnie nazywający rozpoznania.
 *
 * ═══ CO ZOSTAJE NIETKNIĘTE ═══
 * FLAGI i flagi() w obs-model.js — bez zmian, co do bajtu. Tamte identyfikatory są bramkowane
 * (obs:check 942 przypadki, m.in. FLAGA2/f6-samo-milczy) i to one LICZĄ. Wiązanie idzie przez
 * GOŁY STRING w polu `flaga`, nie przez import — żadna nowa krawędź w grafie modułów nie powstaje.
 *
 * ═══ ŹRÓDŁA ═══
 * [H51] Eggers 2019 — klasyfikacja oczopląsu ICVD; [H48] von Brevern 2015 — kryteria BPPV.
 * Każdy trop niesie w polu `zrodlo` numer pracy, która go NAPRAWDĘ niesie; tropy bez pokrycia
 * mają `zrodlo: []` i tak mają zostać, dopóki pokrycia nie będzie.
 */

/* HIERARCHIA ZE ŹRÓDŁA, KTÓREJ KARTA NIE MIAŁA. [H51] Eggers 2019 mówi wprost: „Additional
   neurological or ocular motor symptoms or signs are TYPICALLY PRESENT to suggest a diagnosis other
   than BPPV", a dopiero potem: „IN THEIR ABSENCE, several clues suggest a central cause". Objawy
   neurologiczne są więc PIERWSZE i typowe, a pozostałe tropy to DRUGI RZĄD. Karta stawiała je na
   szóstym, ostatnim miejscu; model obserwacji nie ma ich wcale.
   RANGA Tych ZDAŃ U ŹRÓDŁA (K7-D-b): oba stoją w bloku „Comment:" do pozycji 2.3.1.3 słownika —
   nie w linii definicji ani w kryterium. To komentarz konsensusowy pracy, która sama nie podaje
   żadnego algorytmu ani punktacji różnicowania ośrodkowe/obwodowe (granice wpisu atlasu). */
export const CPN_TROPY = [
  {
    id: 'neuro', rzad: 1, flaga: null, zrodlo: ['H51'],
    pl: '<b>Dodatkowe objawy neurologiczne lub okoruchowe</b> — dyzartria, ataksja, dwojenie, zaburzenia spojrzenia. U źródła są one <b>typowo obecne</b> i to one nasuwają rozpoznanie inne niż BPPV; pozostałe tropy to dopiero <b>druga linia</b>, brana pod uwagę w ich braku.',
    en: '<b>Additional neurological or ocular motor signs</b> — dysarthria, ataxia, diplopia, gaze disturbance. In the source these are <b>typically present</b> and are what suggest a diagnosis other than BPPV; the remaining clues are only a <b>second line</b>, considered in their absence.',
  },
  {
    id: 'trajektoria', rzad: 2, flaga: 'f1/f2', zrodlo: ['H51'],
    pl: '<b>Trajektoria niezgodna z żadnym kanałem</b> w układzie głowy: czysto pionowy (zwłaszcza <b>downbeat</b>) albo czysto skrętny — <b>pod warunkiem zniesionej fiksacji wzroku</b>. Warunek jest częścią zdania źródłowego, nie dopiskiem: przy zachowanej fiksacji oczopląs OBWODOWY potrafi WYGLĄDAĆ na czysto skrętny, bo fiksacja tłumi składową poziomą i pionową skuteczniej niż skrętną.',
    en: '<b>A trajectory that fits no canal</b> in head coordinates: purely vertical (especially <b>downbeat</b>) or purely torsional — <b>provided visual fixation is blocked</b>. The proviso is part of the source sentence, not an afterthought: with fixation retained a PERIPHERAL nystagmus can LOOK purely torsional, because fixation suppresses the horizontal and vertical components more effectively than the torsional one.',
  },
  {
    id: 'ksztalt', rzad: 2, flaga: null, zrodlo: ['H51'],
    pl: '<b>Kształt przebiegu</b>: w oczopląsie ośrodkowym nasilenie jest <b>największe od razu</b> i opada <b>wykładniczo</b>. W kupulolitiazie kanału poziomego jest odwrotnie — <b>narasta przez 10–20 s</b>, a potem opada powoli. To jest różnicownik mocniejszy niż samo słowo „uporczywy": ośrodkowy poziomy oczopląs pozycyjny <b>też wygasa</b>, tylko inaczej.',
    en: '<b>The time course</b>: in central nystagmus the intensity is <b>at its peak immediately</b> and decays <b>exponentially</b>. In horizontal-canal cupulolithiasis it is the reverse — it <b>builds up over 10–20 s</b> and then decreases slowly. This discriminates better than the word "persistent" alone: central horizontal positional nystagmus <b>also fades</b>, just differently.',
  },
  {
    id: 'meczliwosc', rzad: 2, flaga: 'f6', zrodlo: ['H51', 'H48'],
    pl: '<b>Brak męczliwości</b> przy powtarzanym badaniu pozycyjnym <b>ALBO brak ustąpienia po właściwym manewrze repozycyjnym</b>. Drugiej połowy tego zdania nie miał dotąd żaden napis w programie, a to ona jest w źródle wiążąca — <b>bezskuteczność repozycji</b> jest tropem, nie samo „nie słabnie".',
    en: '<b>Failure to fatigue</b> on repeated positional testing <b>OR failure to resolve after an appropriate canalith repositioning procedure</b>. The second half of that sentence appeared in no string in the program until now, and it is the binding one in the source — <b>a repositioning that does not work</b> is the clue, not merely "it does not weaken".',
  },
  {
    id: 'fiksacja', rzad: 2, flaga: 'f5', zrodlo: [],
    pl: '<b>Oczopląs nietłumiony fiksacją wzroku.</b> Model obserwacji liczy tę cechę (f5) od dawna — karta jej dotąd <b>nie wymieniała ani razu</b>, mimo że jest jednym z mocniejszych różnicowników ośrodek/obwód.',
    en: '<b>Nystagmus not suppressed by visual fixation.</b> The observation model has computed this (f5) all along — the card did <b>not mention it once</b> until now, although it is one of the stronger central/peripheral discriminators.',
  },
  {
    id: 'pozycja', rzad: 2, flaga: 'f3/f4', zrodlo: [],
    pl: '<b>Obecny w pozycji neutralnej</b> albo w wielu pozycjach, a kierunek <b>nie układa się w spójny wzorzec</b> żadnego kanału. UWAGA NA POPRZEDNIE BRZMIENIE: karta mówiła „oczopląs bywa zmienny kierunkowo", co jest <b>odwróceniem</b> tego, co liczy f3 — geotropia/apogeotropia zmieniająca się z pozycją jest cechą <b>obwodową</b>; tropem jest <b>niespójność</b>.',
    en: '<b>Present in the neutral position</b> or in many positions, with a direction that <b>forms no consistent pattern</b> for any canal. NOTE ON THE PREVIOUS WORDING: the card said "the nystagmus may be direction-changing", which <b>inverts</b> what f3 computes — geotropy/apogeotropy that changes with position is a <b>peripheral</b> feature; the clue is <b>inconsistency</b>.',
  },
  {
    id: 'apogeotropowy', rzad: 2, flaga: null, zrodlo: ['H48'],
    pl: '<b>Apogeotropowy oczopląs pozycyjny</b> — przy tym obrazie wykluczenie choroby OUN jest w źródle <b>OBOWIĄZKOWE</b> („mandatory"), bo apogeotropia występuje także jako objaw dysfunkcji ośrodkowej. Zastrzeżenie stoi wprost w kryteriach kupulolitiazy kanału poziomego (sekcja 2.3).',
    en: '<b>Apogeotropic positional nystagmus</b> — for this picture the source makes excluding CNS disease <b>MANDATORY</b>, because apogeotropy also occurs as a sign of central vestibular dysfunction. The proviso stands in the criteria for horizontal-canal cupulolithiasis itself (section 2.3).',
  },
];

/* REGUŁA, KTÓREJ KARTA NIE ZNAŁA, A MODEL STOSUJE OD DAWNA.
   obs-model.js liczy f6 = (latencja brak) && (przebieg stały) && (męczliwość bez zmian) — i dodaje
   je do ostrzeżeń TYLKO w towarzystwie f1..f4, z komentarzem „f6 SAMO nie jest ostrzeżeniem — to
   opis kupulolitiazy". Karta wypisywała dokładnie tę triadę jako TRZY osobne czerwone flagi, więc
   przy zwykłej kupulolitiazie — jednostce ŁAGODNEJ i ULECZALNEJ, w klasyfikacji [H48] oznaczonej
   jako zespół USTALONY — popychała ku „nie repozycjonuj, MRI". Reguła jest tu odtworzona SŁOWEM,
   żeby karta i model mówiły to samo; LICZY nadal wyłącznie obs-model. */
export const CPN_REGULA_TRIADY = {
  pl: 'Sama triada <b>brak latencji + przebieg stały + brak męczliwości</b> NIE JEST flagą ośrodkową — to <b>opis kupulolitiazy</b>, czyli jednostki łagodnej i uleczalnej. Ostrzega dopiero <b>w towarzystwie</b> któregoś z tropów wyżej. Tak liczy model obserwacji (f6) i tak należy czytać tę kartę.',
  en: 'The triad <b>no latency + steady course + no fatigability</b> on its own is NOT a central flag — it is <b>the description of cupulolithiasis</b>, a benign and treatable entity. It warns only <b>in company</b> with one of the clues above. That is how the observation model computes it (f6), and that is how this card is to be read.',
};

/* KONTRAPUNKT, KTÓRY MUSI STAĆ PRZY DOWNBEACIE. Czysto pionowy oczopląs bijący w dół jest tropem
   ośrodkowym, ALE kryterium 3.1 C w [H48] opisuje kanalolitiazę kanału PRZEDNIEGO jako oczopląs
   bijący „przeważnie pionowo w dół" — w pozycji zwisu głowy albo w Dix-Hallpike'u. Model
   interpretacji już to zna (wyjątek dla próby `headhang`); karta musi to powiedzieć, bo inaczej
   kieruje na MRI chorego z rzadką, ale ULECZALNĄ postacią BPPV. */
export const CPN_KONTRAPUNKT_DOWNBEAT = {
  pl: '<b>Zanim uznasz downbeat za ośrodkowy:</b> kanalolitiaza kanału <b>przedniego</b> daje w kryteriach [H48] von Brevern 2015 oczopląs bijący <b>przeważnie pionowo w dół</b> — w zwisie głowy albo w Dix-Hallpike\'u po jednej lub obu stronach. Jest rzadka (1–2% w dużych seriach), ale <b>uleczalna</b>. Za kanałem przednim przemawia niewielka składowa skrętna; przeciw niemu — utrzymywanie się mimo repozycji.',
  en: '<b>Before calling a downbeat central:</b> in the [H48] von Brevern 2015 criteria, <b>anterior</b>-canal canalolithiasis produces nystagmus beating <b>predominantly vertically downward</b> — in head-hanging or on Dix-Hallpike to one or both sides. It is rare (1–2% in large series) but <b>treatable</b>. A small torsional component favours the anterior canal; persistence despite repositioning argues against it.',
};
