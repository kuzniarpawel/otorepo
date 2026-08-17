/* pwa-model.js — Blok 16: POLITYKA AKTUALIZACJI, SKROTY KLAWIATUROWE I ODPOWIEDZ NA PYTANIE
   „ktore tresci wymagaja polaczenia". Modul CZYSTY: zero importow, zero DOM, zero `navigator`,
   zero zegara. Wyrocznia tools/pwa-check.mjs importuje go w golym Node.

   Cztery reguly tego modulu:

   1. AKTUALIZACJA NIE JEST ZDARZENIEM TECHNICZNYM, TYLKO KLINICZNYM. Nowa wersja PWA wchodzi
      przez przeladowanie karty, a przeladowanie kasuje przypadek trzymany w pamieci. Dopoki
      trwa manewr repozycyjny, aktualizacja nie ma prawa wejsc ZADNA droga — nawet na wyrazne
      zyczenie: pacjent lezy w pozycji, a licznik utrzymania jest czescia procedury.
   2. TWARDA BLOKADA I MIEKKIE OSTRZEZENIE TO DWIE ROZNE RZECZY. Otwarty przypadek (opisany
      oczoplas, zapisana kontrola) da sie stracic swiadomie — ale uzytkownik musi wiedziec, ze
      wlasnie to robi. Dlatego decyzja zwraca OSOBNO `blokada` i `ostrzezenie`.
   3. SKROT KLAWIATUROWY NIE MOZE ZABRAC KLAWISZA TEMU, KTO GO POTRZEBUJE. Spacja na przycisku
      go WCISKA, spacja w polu tekstowym PISZE, strzalki w suwaku go PRZESTAWIAJA. Przechwycenie
      globalne zamienia dostepnosc z klawiatury w pulapke, wiec model odmawia z NAZWANYM powodem.
   4. ZDANIE O OFFLINE JEST FUNKCJA FAKTU, A NIE OBIETNICA. `komunikatSieci` czyta liste funkcji
      wymagajacych polaczenia; lista jest pusta, bo w `src/` nie ma ani jednego wywolania sieci
      (pilnuje tego bramka w wyroczni). Gdy ktos dolozy pierwsze, zdanie zmieni sie samo. */

/* ============ 1. Aktualizacja aplikacji ============ */

export const STANY_AKTUALIZACJI = ['brak', 'czeka', 'wdrazana'];

/* BLOKADA TWARDA — jedyny stan, w ktorym aktualizacji nie wolno wdrozyc NAWET na zyczenie.
   `screen==='guide'` samo w sobie nie wystarczy: karta manewru otwarta na kroku 0 z zatrzymanym
   licznikiem to jeszcze nie procedura na pacjencie, tylko podglad. Blokujemy dopiero wtedy, gdy
   licznik biegnie albo etap jest juz zmieniony — czyli gdy pacjent jest W POZYCJI. */
export const BLOKADA_TWARDA = {
  id: 'manewrWToku',
  pl: 'trwa manewr repozycyjny',
  en: 'a repositioning maneuver is in progress',
  czy: (s) => !!s && s.screen === 'guide' && (!!s.running || (s.step | 0) > 0),
};

/* SYGNALY OTWARTEGO PRZYPADKU — dane, ktore przeladowanie strony bezpowrotnie kasuje (chyba ze
   uzytkownik sam zapisal sesje, Blok 15). Lista jest jawna i sprawdzana przez wyrocznie po to,
   zeby dolozenie nowego modulu nie przeoczylo jego danych: „aktualizacja nic nie zabiera" ma byc
   twierdzeniem sprawdzalnym, a nie zalozeniem. */
export const SYGNALY_PRZYPADKU = [
  { id: 'manewrOtwarty', pl: 'otwarty ekran manewru', en: 'the maneuver screen is open',
    czy: (s) => s.screen === 'guide' },
  { id: 'proba', pl: 'wykonana próba pozycyjna', en: 'a positional test was performed',
    czy: (s) => !!(s.flow && s.flow.testSeen) },
  { id: 'oczoplas', pl: 'opisany oczopląs', en: 'nystagmus has been described',
    czy: (s) => !!(s.flow && s.flow.obsSeen) },
  { id: 'interpretacja', pl: 'przyjęta interpretacja', en: 'an interpretation was accepted',
    czy: (s) => !!(s.flow && s.flow.interpretSeen) },
  { id: 'manewrWybrany', pl: 'wybrany manewr', en: 'a maneuver was selected',
    czy: (s) => !!(s.flow && s.flow.maneuver) },
  { id: 'kontrola', pl: 'zapisana kontrola', en: 'a follow-up entry was recorded',
    czy: (s) => !!(s.kontrole && s.kontrole.length) },
  { id: 'obserwacje', pl: 'zapisane rekordy obserwacji', en: 'observation records were saved',
    czy: (s) => !!(s.obs && Object.keys(s.obs).length) },
  { id: 'kwalifikacja', pl: 'odpowiedzi kwalifikacji', en: 'triage answers were given',
    czy: (s) => !!(s.triage && Object.keys(s.triage).length) },
  { id: 'hints', pl: 'odpowiedzi badania HINTS', en: 'HINTS examination answers',
    czy: (s) => !!(s.hintsBadanie && Object.keys(s.hintsBadanie).length) },
  { id: 'nauka', pl: 'otwarty przypadek nauki', en: 'a learning case is open',
    czy: (s) => !!s.naukaPrzypadek },
];

export const SYGNALY_IDS = SYGNALY_PRZYPADKU.map((s) => s.id);

export function sygnalyPrzypadku(stan) {
  const s = stan || {};
  return SYGNALY_PRZYPADKU.filter((x) => { try { return !!x.czy(s); } catch { return false; } }).map((x) => x.id);
}

export const TEKSTY_AKTUALIZACJI = {
  tytul: { pl: 'Nowa wersja aplikacji jest gotowa', en: 'A new version of the app is ready' },
  gotowa: { pl: 'Wejdzie po zakończeniu sesji albo teraz, jeśli zdecydujesz.',
            en: 'It will be applied when the session ends, or now if you decide so.' },
  // Zdanie o manewrze jest SAMODZIELNE (powtarza podmiot), bo w trybie skupienia pasek zwija sie
  // do jednej linii i tytul nie jest wtedy widoczny — a komunikat bez podmiotu nie znaczy nic.
  wManewrze: { pl: 'Nowa wersja wejdzie po zakończeniu manewru — trwającej repozycji nie przerywamy.',
               en: 'The new version will be applied after the maneuver — an ongoing repositioning is never interrupted.' },
  zPrzypadkiem: { pl: 'Wdrożenie teraz przeładuje aplikację i skasuje niezapisany przypadek.',
                  en: 'Applying it now reloads the app and discards the unsaved case.' },
  przycisk: { pl: 'Zaktualizuj teraz', en: 'Update now' },
  schowaj: { pl: 'Nie teraz', en: 'Not now' },
  wdrazana: { pl: 'Wdrażanie nowej wersji…', en: 'Applying the new version…' },
};

/* DECYZJA — jedno miejsce, ktore odpowiada na pytania „czy pokazac", „czy wolno wdrozyc" oraz
   „co dokladnie powiedziec". Ekran nie ma tu wlasnej logiki i nie sklada wlasnych zdan. */
export function decyzjaAktualizacji(stan) {
  const s = stan || {};
  const st = s.aktualizacja || 'brak';
  if (st === 'wdrazana') {
    return { pokaz: true, mozna: false, wdrazana: true, blokada: null, ostrzezenie: null,
             sygnaly: [], tytul: TEKSTY_AKTUALIZACJI.tytul, tresc: TEKSTY_AKTUALIZACJI.wdrazana,
             przycisk: null, schowaj: false };
  }
  if (st !== 'czeka') {
    return { pokaz: false, mozna: false, wdrazana: false, blokada: null, ostrzezenie: null,
             sygnaly: [], tytul: null, tresc: null, przycisk: null, schowaj: false };
  }
  const twarda = BLOKADA_TWARDA.czy(s);
  const sygnaly = sygnalyPrzypadku(s);
  // Schowanie paska jest gestem uzytkownika i dotyczy WYLACZNIE widocznosci — wdrozenie po
  // zakonczeniu sesji dzieje sie tak samo, bo nie jest nagroda za czytanie komunikatu.
  const schowane = !!s.aktualizacjaSchowana;
  return {
    pokaz: !schowane,
    mozna: !twarda,
    wdrazana: false,
    blokada: twarda ? BLOKADA_TWARDA.id : null,
    ostrzezenie: !twarda && sygnaly.length ? 'przypadekPrzepadnie' : null,
    sygnaly,
    tytul: TEKSTY_AKTUALIZACJI.tytul,
    tresc: twarda ? TEKSTY_AKTUALIZACJI.wManewrze
         : sygnaly.length ? TEKSTY_AKTUALIZACJI.zPrzypadkiem
         : TEKSTY_AKTUALIZACJI.gotowa,
    przycisk: twarda ? null : TEKSTY_AKTUALIZACJI.przycisk,
    schowaj: !twarda,
  };
}

/* WDROZENIE AUTOMATYCZNE — „po zakonczeniu sesji" z kryterium odbioru nr 3. Wolno tylko wtedy,
   gdy nie ma juz CZEGO stracic: zadnego sygnalu przypadku i zadnej blokady. Wolane po tym, jak
   zakonczenie sesji wyczysci stan — nie zamiast tego czyszczenia. */
export function wdrozenieAutomatyczne(stan) {
  const s = stan || {};
  if ((s.aktualizacja || 'brak') !== 'czeka') return false;
  if (BLOKADA_TWARDA.czy(s)) return false;
  return sygnalyPrzypadku(s).length === 0;
}

/* PRZELADOWANIE PO PRZEJECIU KARTY. Regula wyglada na techniczna, ale kosztuje dane pacjenta:
   `controllerchange` leci TAKZE przy pierwszej instalacji workera, kiedy karta nie miala jeszcze
   zadnego sterownika — przeladowanie w tym miejscu obraca kazde pierwsze wejscie w podwojne
   wczytanie, a przy otwartym przypadku w jego utrate.
   Zmierzone: warunek „karta byla sterowana W CHWILI BOOTU" jest ZA WASKI. Pierwsza wizyta
   instaluje workera juz po wczytaniu strony, wiec ta sama karta zostaje z wartoscia `false` do
   konca zycia i pozniejsza aktualizacja NIE przeladowuje jej nigdy — a jej stary cache wlasnie
   zniknal. Dlatego adapter aktualizuje `bylSterownik` przy KAZDYM przejeciu, a decyzja jest
   czysta i osobno mierzona. */
export function decyzjaPrzeladowania(kontekst) {
  const k = kontekst || {};
  if (k.przeladowano) return { przeladuj: false, powod: 'juzPrzeladowano' };
  if (!k.bylSterownik) return { przeladuj: false, powod: 'pierwszaInstalacja' };
  return { przeladuj: true, powod: null };
}

/* ============ 2. Skroty klawiaturowe (dokument, kolumna „Komputer") ============ */

export const SKROTY = [
  { id: 'licznik', klawisze: [' ', 'Spacebar', 'Space'], akcja: 'przelaczLicznik',
    pl: 'pauza / wznowienie licznika', en: 'pause / resume the timer' },
  { id: 'nastepny', klawisze: ['ArrowRight'], akcja: 'nastepnyKrok',
    pl: 'następny etap manewru', en: 'next maneuver step' },
  { id: 'poprzedni', klawisze: ['ArrowLeft'], akcja: 'poprzedniKrok',
    pl: 'poprzedni etap manewru', en: 'previous maneuver step' },
];

export const AKCJE_SKROTOW = SKROTY.map((s) => s.akcja);

export const POWODY_ODMOWY = {
  brakSkrotu: { pl: 'klawisz bez przypisania', en: 'key is not bound' },
  innyEkran: { pl: 'skrót działa tylko na ekranie manewru', en: 'the shortcut works only on the maneuver screen' },
  modyfikator: { pl: 'klawisz z modyfikatorem należy do przeglądarki', en: 'a modified key belongs to the browser' },
  powtorzenie: { pl: 'przytrzymanie klawisza nie powtarza akcji', en: 'holding a key does not repeat the action' },
  poleTekstowe: { pl: 'kursor stoi w polu tekstowym', en: 'the caret is in a text field' },
  kontrolka: { pl: 'klawisz należy do kontrolki z fokusem', en: 'the key belongs to the focused control' },
  brakKroku: { pl: 'nie ma kroku w tym kierunku', en: 'there is no step in that direction' },
};

// Typy `input`, ktore SA polem tekstowym. Reszta (range, checkbox, radio, button) to kontrolki
// konsumujace klawisze na wlasny sposob — rozstrzygamy je nizej, osobno i z innym powodem.
const TYPY_TEKSTOWE = ['text', 'search', 'tel', 'url', 'email', 'password', 'number', 'date', 'time', ''];
const KONTROLKI_SPACJI = ['button', 'a', 'summary', 'details'];
const TYPY_SPACJI = ['button', 'submit', 'reset', 'checkbox', 'radio', 'file'];

function polemTekstowym(cel) {
  if (!cel) return false;
  const tag = String(cel.tag || '').toLowerCase();
  if (cel.edytowalne) return true;
  if (tag === 'textarea') return true;
  if (tag === 'input') return TYPY_TEKSTOWE.indexOf(String(cel.typ || '').toLowerCase()) >= 0;
  return false;
}

function kontrolkaKlawisza(cel, id) {
  if (!cel) return false;
  const tag = String(cel.tag || '').toLowerCase();
  const typ = String(cel.typ || '').toLowerCase();
  const rola = String(cel.rola || '').toLowerCase();
  // Suwak i lista wyboru zjadaja STRZALKI — i musza je zjadac, bo inaczej nie da sie ich obsluzyc
  // z klawiatury. Suwak fazy manewru jest dokladnie na tym ekranie, wiec to nie jest przypadek
  // teoretyczny: bez tej reguly strzalka przestawialaby ETAP zamiast fazy animacji.
  if (id === 'nastepny' || id === 'poprzedni') {
    if (tag === 'select' || rola === 'slider' || rola === 'tablist' || rola === 'radiogroup') return true;
    if (tag === 'input' && (typ === 'range' || typ === 'radio')) return true;
    return false;
  }
  // Spacja WCISKA element z fokusem. Przechwycenie jej globalnie znaczy, ze uzytkownik klawiatury
  // nie moze uzyc zadnego przycisku na ekranie manewru.
  if (KONTROLKI_SPACJI.indexOf(tag) >= 0) return true;
  if (tag === 'input' && TYPY_SPACJI.indexOf(typ) >= 0) return true;
  if (rola === 'button' || rola === 'checkbox' || rola === 'radio' || rola === 'switch') return true;
  return false;
}

/* Zdarzenie podajemy jako ZWYKLY OBIEKT (klucz, modyfikatory, powtorzenie, opis celu), zeby model
   nie znal DOM-u. Adapter w warstwie ekranu tlumaczy KeyboardEvent na te strukture. */
export function skrot(zdarzenie, stan) {
  const z = zdarzenie || {};
  const s = stan || {};
  const def = SKROTY.find((d) => d.klawisze.indexOf(z.key) >= 0);
  if (!def) return { akcja: null, powod: 'brakSkrotu', skrot: null };
  if (s.screen !== 'guide') return { akcja: null, powod: 'innyEkran', skrot: def.id };
  if (z.ctrlKey || z.altKey || z.metaKey || z.shiftKey) return { akcja: null, powod: 'modyfikator', skrot: def.id };
  if (z.repeat) return { akcja: null, powod: 'powtorzenie', skrot: def.id };
  if (polemTekstowym(z.cel)) return { akcja: null, powod: 'poleTekstowe', skrot: def.id };
  if (kontrolkaKlawisza(z.cel, def.id)) return { akcja: null, powod: 'kontrolka', skrot: def.id };
  const ile = (s.plan && s.plan.steps && s.plan.steps.length) || (s.total | 0) || 0;
  const krok = s.step | 0;
  if (def.akcja === 'nastepnyKrok' && ile && krok >= ile - 1) return { akcja: null, powod: 'brakKroku', skrot: def.id };
  if (def.akcja === 'poprzedniKrok' && krok <= 0) return { akcja: null, powod: 'brakKroku', skrot: def.id };
  return { akcja: def.akcja, powod: null, skrot: def.id };
}

/* ============ 3. Co wymaga polaczenia ============ */

/* Pomiar Bloku 16: w calym `src/` nie ma ani jednego `fetch`, `XMLHttpRequest`, `sendBeacon`
   ani `WebSocket`, a czcionki sa wklejone w dokument. Lista jest wiec PUSTA — i zdanie ponizej
   jest jej funkcja, nie obietnica przepisana z dokumentu. */
export const FUNKCJE_WYMAGAJACE_SIECI = [];

export function komunikatSieci(lista) {
  const l = lista || FUNKCJE_WYMAGAJACE_SIECI;
  if (!l.length) {
    // Zdanie jest PRECYZYJNE, a nie tylko uspokajajace: worker pobiera z sieci WLASNE pliki
    // aplikacji, dopoki nie ma ich w pamieci podrecznej. Danych nie wysyla i nie pobiera zadnych.
    return { pl: 'Wszystko działa bez połączenia — aplikacja nie wysyła ani nie pobiera żadnych danych; z sieci bierze wyłącznie własne pliki, i tylko dopóki nie ma ich w pamięci podręcznej.',
             en: 'Everything works offline — the app sends and fetches no data; the only thing it takes from the network is its own files, and only until they are in the cache.' };
  }
  return { pl: 'Połączenia wymagają: ' + l.map((x) => x.pl).join(', ') + '.',
           en: 'These require a connection: ' + l.map((x) => x.en).join(', ') + '.' };
}
