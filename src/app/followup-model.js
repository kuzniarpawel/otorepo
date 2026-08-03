/* OTOREPO — czysty model KONTROLI PO MANEWRZE (Blok 11).
 *
 * Dokument użytkownika, Blok 11: „Zamknięcie procesu klinicznego i obsługa wyników innych niż
 * natychmiastowe ustąpienie BPPV" — siedem odpowiedzi (ustąpienie / częściowa poprawa / brak
 * poprawy / konwersja kanałowa / podejrzenie drugiej strony / residual dizziness / badanie
 * niewiarygodne), możliwość powtórzenia próby, zmiany rozpoznania, manewru alternatywnego albo
 * zakończenia sesji, oraz trzy kryteria odbioru:
 *   1. aplikacja NIE wraca automatycznie do początku po zakończeniu manewru,
 *   2. konwersja kanałowa prowadzi do PONOWNEJ INTERPRETACJI, a nie do powtórzenia tego samego
 *      manewru,
 *   3. sesję da się zakończyć i zapisać BEZ danych identyfikacyjnych pacjenta.
 *
 * ═══ CO TEN MODEL ROBI, A CZEGO NIE ═══
 * Wynik kontroli jest OBSERWACJĄ KLINICYSTY, nie wnioskiem aplikacji. Model nie ocenia, czy
 * repozycja się „udała" — przyjmuje odpowiedź na pytanie „co obserwujesz teraz?" i wyprowadza
 * z niej NASTĘPNY KROK. To jest ta sama granica, którą trzymają Bloki 6, 8 i 9: kwestionariusz
 * wybiera ścieżkę, formularz opisuje obserwację, interpretacja eliminuje kandydatury — żaden
 * z nich nie stawia rozpoznania.
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * ZERO importów, zero DOM, zero `state` z modułu — stan i wiedza kliniczna wchodzą ARGUMENTEM
 * (wzorzec „inject-for-purity"). tools/followup-check.mjs uruchamia go w gołym Node.
 * Napisy trzymamy jako SUROWE pary pl/en: wywołanie t() na poziomie modułu ZAMROZIŁOBY język,
 * bo moduły ładują się przed initLang().
 *
 * deps (src/app/followup-deps.js): { canalOf, manewryKanalu, powodyNiewiarygodnosci }
 */

/* ============ 1. Siedem odpowiedzi — SŁOWNIK ZAMKNIĘTY ============
   Bez pozycji „inne" i bez pola tekstowego. To nie jest oszczędność: pole wolnego tekstu w karcie
   kontroli jest wektorem danych identyfikacyjnych pacjenta (kryterium odbioru nr 3) i tę samą
   zasadę trzyma obs-model.js oraz tor VOG.

   Pola każdej pozycji:
     wiarygodny — czy odpowiedź w ogóle NIESIE wynik kontroli (badanie niewiarygodne nie niesie);
     zamyka     — czy proces kliniczny jest po niej domknięty (to nie znaczy „wyleczony" —
                  patrz `uwaga` przy `ustapienie`);
     nowaPodstawa — czy odpowiedź wymaga ZBUDOWANIA WNIOSKU OD NOWA (kanał/strona), a nie
                  poprawienia wykonania. To jest oś, na której stoi kryterium odbioru nr 2. */
export const WYNIKI = [
  {
    id: 'ustapienie', wiarygodny: true, zamyka: true, nowaPodstawa: false,
    pl: 'ustąpienie', en: 'resolution',
    pytaniePl: 'Próba kontrolna ujemna — bez oczopląsu i bez zawrotu',
    pytanieEn: 'Control test negative — no nystagmus and no vertigo',
    uwagaPl: 'Ujemna próba kontrolna nie jest równoznaczna z wyleczeniem: BPPV nawraca, a próba wykonana zaraz po repozycji bywa ujemna przejściowo. Zaplanuj ponowną ocenę.',
    uwagaEn: 'A negative control test does not equal a cure: BPPV recurs, and a test done right after repositioning may be transiently negative. Plan a re-assessment.',
  },
  {
    id: 'czesciowaPoprawa', wiarygodny: true, zamyka: false, nowaPodstawa: false,
    pl: 'częściowa poprawa', en: 'partial improvement',
    pytaniePl: 'Oczopląs i zawrót słabsze albo krótsze, ale nadal obecne',
    pytanieEn: 'Nystagmus and vertigo weaker or shorter, but still present',
    uwagaPl: 'Częściowe przemieszczenie złogu. Powtórzenie tego samego manewru w tej samej sesji jest postępowaniem typowym.',
    uwagaEn: 'Partial displacement of the debris. Repeating the same maneuver in the same session is standard practice.',
  },
  {
    id: 'brakPoprawy', wiarygodny: true, zamyka: false, nowaPodstawa: false,
    pl: 'brak poprawy', en: 'no improvement',
    pytaniePl: 'Bez zmiany — ten sam oczopląs i ten sam zawrót',
    pytanieEn: 'Unchanged — the same nystagmus and the same vertigo',
    uwagaPl: 'Po kilku nieskutecznych powtórzeniach rozważ inny mechanizm (kupulolitiaza), inny kanał albo przyczynę spoza BPPV — powtarzanie tego samego manewru w nieskończoność nie jest planem.',
    uwagaEn: 'After several ineffective repetitions consider a different mechanism (cupulolithiasis), a different canal, or a cause other than BPPV — repeating the same maneuver indefinitely is not a plan.',
  },
  {
    id: 'konwersja', wiarygodny: true, zamyka: false, nowaPodstawa: true,
    pl: 'konwersja kanałowa', en: 'canal conversion',
    pytaniePl: 'Wzorzec oczopląsu wskazuje INNY kanał niż leczony',
    pytanieEn: 'The nystagmus pattern points to a canal OTHER than the treated one',
    uwagaPl: 'Złóg przeszedł do innego kanału (typowo tylny → poziomy po manewrze Epleya). To wskazanie do NOWEGO manewru dla nowego kanału, a nie porażka poprzedniego — kanał i stronę ustal od nowa w kroku „Interpretacja".',
    uwagaEn: 'The debris moved into another canal (typically posterior → horizontal after an Epley). This indicates a NEW maneuver for the new canal, not a failure of the previous one — re-establish canal and side in the "Interpretation" step.',
  },
  {
    id: 'drugaStrona', wiarygodny: true, zamyka: false, nowaPodstawa: true,
    pl: 'podejrzenie drugiej strony', en: 'other side suspected',
    pytaniePl: 'Próba po stronie przeciwnej wypada dodatnio',
    pytanieEn: 'The test on the opposite side is positive',
    uwagaPl: 'Postać obustronna albo błędna lateralizacja wyjściowa. Stronę ustal od nowa; leczenie prowadzi się zwykle po jednej stronie na sesję.',
    uwagaEn: 'A bilateral form or an incorrect initial lateralization. Re-establish the side; treatment is usually carried out one side per session.',
  },
  {
    id: 'residual', wiarygodny: true, zamyka: true, nowaPodstawa: false,
    pl: 'zawroty resztkowe (residual dizziness)', en: 'residual dizziness',
    pytaniePl: 'Bez oczopląsu pozycyjnego, ale utrzymuje się niespecyficzny niepokój ruchowy',
    pytanieEn: 'No positional nystagmus, but non-specific unsteadiness persists',
    uwagaPl: 'Częste po SKUTECZNEJ repozycji i zwykle samoograniczające się (dni–tygodnie). Brak oczopląsu pozycyjnego znaczy, że nie ma czego repozycjonować — powtarzanie manewru z tego powodu jest błędem.',
    uwagaEn: 'Common after SUCCESSFUL repositioning and usually self-limiting (days to weeks). No positional nystagmus means there is nothing to reposition — repeating the maneuver for this reason is an error.',
  },
  {
    id: 'niewiarygodne', wiarygodny: false, zamyka: false, nowaPodstawa: false,
    pl: 'badanie niewiarygodne', en: 'unreliable examination',
    pytaniePl: 'Kontroli nie da się wiarygodnie ocenić',
    pytanieEn: 'The control cannot be reliably assessed',
    uwagaPl: 'Odpowiedź nie niesie wyniku: na jej podstawie nie wolno ani domknąć procesu, ani uzasadnić kolejnej repozycji. Podaj powód — wchodzi do podsumowania sesji.',
    uwagaEn: 'This answer carries no result: it may neither close the process nor justify another repositioning. Give the reason — it goes into the session summary.',
  },
];
export const WYNIK_IDS = WYNIKI.map(w => w.id);
export function wynikKontroli(id) { return WYNIKI.find(w => w.id === id) || null; }

/* ============ 2. Akcje — też słownik ZAMKNIĘTY ============
   `cel` jest WSKAZÓWKĄ NAWIGACYJNĄ dla warstwy akcji, nie nawigacją: model nie zna ekranów.
   `zakonczSesje` NIE MA prawa zniknąć z żadnej listy — patrz `zawszeDostepne` niżej. */
export const AKCJE = {
  powtorzManewr:        { pl: 'powtórz ten sam manewr',            en: 'repeat the same maneuver' },
  alternatywnyManewr:   { pl: 'wykonaj alternatywny manewr',       en: 'perform an alternative maneuver' },
  ponownaInterpretacja: { pl: 'ustal kanał i stronę od nowa',      en: 're-establish canal and side' },
  powtorzProbe:         { pl: 'wykonaj próbę kontrolną i opisz oczopląs', en: 'perform the control test and describe the nystagmus' },
  obserwuj:             { pl: 'nie wykonuj repozycji — obserwacja', en: 'do not reposition — observation' },
  zakonczSesje:         { pl: 'zakończ sesję',                     en: 'end the session' },
};
export const AKCJA_IDS = Object.keys(AKCJE);

/* Zakończenie sesji jest DOSTĘPNE ZAWSZE i to jest wprost kryterium odbioru nr 3: użytkownik ma
   móc zakończyć sesję, cokolwiek wybrał i czegokolwiek nie wypełnił. Trzymamy to jako osobne
   pole, a nie jako pozycję listy, żeby żadna reguła `zakaz` nie mogła go przypadkiem zabrać —
   wyrocznia sprawdza tę niemożliwość na PEŁNYM iloczynie wyników i stanów. */
export const ZAWSZE_DOSTEPNE = ['zakonczSesje'];

/* POWODY ZAKAZU. Zakaz znaczy „ta akcja NIE MA PRAWA pojawić się na ekranie", a nie „jest
   wyszarzona" — i zawsze niesie uzasadnienie. Wyszarzenie bez słowa uczy klikać dalej. */
export const POWODY_ZAKAZU = {
  konwersjaNieJestPowtorka: {
    pl: 'złóg jest w innym kanale — ten sam manewr leczyłby kanał, w którym już go nie ma',
    en: 'the debris is in a different canal — the same maneuver would treat a canal it is no longer in',
  },
  konwersjaNieJestAlternatywa: {
    pl: 'manewry tego kanału nie dotyczą kanału, do którego złóg przeszedł — najpierw ustal, który to kanał',
    en: 'maneuvers for this canal do not address the canal the debris moved into — first establish which canal that is',
  },
  drugaStronaWymagaLateralizacji: {
    pl: 'manewr po stronie dotąd leczonej nie dotyczy strony, którą podejrzewasz',
    en: 'a maneuver on the side treated so far does not address the side you suspect',
  },
  residualBezOczoplasu: {
    pl: 'bez oczopląsu pozycyjnego nie ma czego repozycjonować',
    en: 'without positional nystagmus there is nothing to reposition',
  },
  niewiarygodneNieUzasadnia: {
    pl: 'ocena, którą sam nazwałeś niewiarygodną, nie uzasadnia kolejnej repozycji',
    en: 'an assessment you called unreliable does not justify another repositioning',
  },
};

/* Mapa wynik → następne kroki. Trzymana JAWNIE, bo to jest treść kliniczna bloku, a nie logika:
   każda pozycja odpowiada jednemu zdaniu z uwagi przy wyniku wyżej.

   EKSPORTOWANA SUROWO, i to nie jest wygoda testu. `nastepneKroki` odsiewa akcje zakazane, więc
   wpisanie zakazanej akcji do `dalsze` NIE ZMIENIA wyniku funkcji — zmierzone: mutacja dodająca
   „powtórz manewr" do konwersji przechodziła wyrocznię na zielono. Filtr jest dobry (broni ekranu),
   ale sprawia, że sama tabela przestaje być pilnowana. Bramka czyta więc tabelę WPROST i wymaga,
   żeby była wewnętrznie niesprzeczna: nic, co zakazane, nie ma prawa być równocześnie oferowane. */
export const REGULY_KROKOW = {
  ustapienie:       { glowny: 'zakonczSesje',         dalsze: ['powtorzProbe'],                        zakaz: [] },
  czesciowaPoprawa: { glowny: 'powtorzManewr',        dalsze: ['alternatywnyManewr', 'powtorzProbe'],  zakaz: [] },
  brakPoprawy:      { glowny: 'powtorzManewr',        dalsze: ['alternatywnyManewr', 'ponownaInterpretacja'], zakaz: [] },
  konwersja:        { glowny: 'ponownaInterpretacja', dalsze: ['powtorzProbe'],
                      zakaz: [['powtorzManewr', 'konwersjaNieJestPowtorka'], ['alternatywnyManewr', 'konwersjaNieJestAlternatywa']] },
  drugaStrona:      { glowny: 'ponownaInterpretacja', dalsze: ['powtorzProbe'],
                      zakaz: [['powtorzManewr', 'drugaStronaWymagaLateralizacji']] },
  residual:         { glowny: 'obserwuj',             dalsze: ['zakonczSesje'],
                      zakaz: [['powtorzManewr', 'residualBezOczoplasu'], ['alternatywnyManewr', 'residualBezOczoplasu']] },
  niewiarygodne:    { glowny: 'powtorzProbe',         dalsze: ['obserwuj'],
                      zakaz: [['powtorzManewr', 'niewiarygodneNieUzasadnia'], ['alternatywnyManewr', 'niewiarygodneNieUzasadnia']] },
};

/* CEL NAWIGACYJNY „ponownej interpretacji" zależy od tego, jak użytkownik tu doszedł. Ścieżka
   diagnostyczna ma próbę, więc ma ekran interpretacji; tryb ekspercki („Znam kanał i stronę")
   próby NIE MA, a ekran interpretacji bez `testKey` nie ma z czego się zbudować — tam ponowne
   ustalenie kanału i strony odbywa się na ekranie doboru. Cel wyliczamy w modelu, żeby wyrocznia
   mogła go sprawdzić bez uruchamiania aplikacji. */
export function celAkcji(akcja, stan) {
  const s = stan || {};
  if (akcja === 'ponownaInterpretacja') return s.testKey ? 'interpret' : 'setup';
  if (akcja === 'powtorzProbe') return s.testKey ? 'obs' : 'setup';
  if (akcja === 'powtorzManewr' || akcja === 'alternatywnyManewr') return 'guide';
  return null;
}

export function nastepneKroki(id, stan, deps) {
  const k = REGULY_KROKOW[id];
  if (!k) return null;
  const s = stan || {};
  const zakazane = new Set(k.zakaz.map(z => z[0]));

  // Alternatywa istnieje tylko wtedy, gdy kanał NAPRAWDĘ ma drugi manewr. Kanał przedni ma jeden
  // (Yacovino), więc przycisk „wykonaj alternatywny manewr" prowadziłby donikąd.
  const kanal = s.plan ? s.plan.canal : s.canal;
  const lista = kanal && deps && typeof deps.manewryKanalu === 'function' ? (deps.manewryKanalu(kanal) || []) : [];
  const maAlternatywe = lista.length > 1;

  const dostepna = (a) => {
    if (zakazane.has(a)) return false;
    if (a === 'alternatywnyManewr') return maAlternatywe;
    return true;
  };
  const glowny = dostepna(k.glowny) ? k.glowny
    : (k.dalsze.find(dostepna) || 'zakonczSesje');
  const dalsze = k.dalsze.filter(a => a !== glowny && dostepna(a));
  return {
    glowny,
    dalsze,
    zakaz: k.zakaz.map(([akcja, powod]) => ({ akcja, powod, ...POWODY_ZAKAZU[powod] })),
    zawszeDostepne: ZAWSZE_DOSTEPNE.slice(),
    cel: celAkcji(glowny, s),
  };
}

/* ============ 3. Czy jest w ogóle co kontrolować ============
   Karta kontroli bez wykonanego manewru opisywałaby wynik czegoś, co się nie wydarzyło. Rozróżniamy
   trzy stany, bo prowadzą do trzech różnych zdań na ekranie (i do trzech różnych przycisków). */
export const POWODY_BRAKU_KONTROLI = {
  brakManewru: { pl: 'nie wybrano jeszcze manewru — kontrola nie ma czego dotyczyć',
                 en: 'no maneuver has been chosen yet — the control has no subject' },
  niewykonany: { pl: 'manewr nie został doprowadzony do końca w aplikacji',
                 en: 'the maneuver was not carried through to the end in the app' },
};
export function kontrolaMozliwa(stan) {
  const m = stan && stan.flow && stan.flow.maneuver;
  if (!m || !m.key) return { mozliwa: false, powod: 'brakManewru', ...POWODY_BRAKU_KONTROLI.brakManewru };
  if (!m.consumed) return { mozliwa: false, powod: 'niewykonany', ...POWODY_BRAKU_KONTROLI.niewykonany };
  return { mozliwa: true, powod: null };
}

/* ============ 4. Sprzeczności między odpowiedzią a resztą stanu ============
   Nie „walidacja formularza", tylko dwa zdania, których aplikacja NIE MA PRAWA przemilczeć:
     • wynik mówi „konwersja", ale bieżący kanał to nadal kanał leczony — czyli nikt jeszcze nie
       powiedział, DOKĄD złóg przeszedł, a bez tego „ponowna interpretacja" nie ma wejścia;
     • wynik mówi „ustąpienie", a bieżące wejścia wskazują INNY kanał niż wykonany manewr (to samo
       porównanie, które robi man-model.sygnalKonwersji) — dwie sprzeczne rzeczy naraz.
   Sprzeczność nie blokuje zapisu: klinicysta ma prawo mieć rację wbrew stanowi aplikacji. Ma być
   NAZWANA. */
export const SPRZECZNOSCI = {
  konwersjaBezKanalu: {
    pl: 'zaznaczono konwersję kanałową, ale kanał w aplikacji jest nadal ten sam co leczony — wskaż nowy kanał w kroku „Interpretacja"',
    en: 'canal conversion was marked, but the canal in the app is still the treated one — indicate the new canal in the "Interpretation" step',
  },
  ustapienieMimoInnegoKanalu: {
    pl: 'zaznaczono ustąpienie, a bieżące wejścia wskazują inny kanał niż wykonany manewr',
    en: 'resolution was marked, but the current inputs point to a canal other than the performed maneuver',
  },
  niewiarygodneBezPowodu: {
    pl: 'nie podano powodu niewiarygodności — bez niego zapis mówi tylko „nie wiadomo"',
    en: 'no reason for unreliability was given — without it the record says only "unknown"',
  },
};
export function spojnoscWyniku(id, stan, deps) {
  const out = [];
  const s = stan || {};
  const m = s.flow && s.flow.maneuver;
  const kanalManewru = m && m.key && deps && typeof deps.canalOf === 'function' ? deps.canalOf(m.key) : null;
  const innyKanal = !!(kanalManewru && s.canal && s.canal !== kanalManewru);
  if (id === 'konwersja' && !innyKanal) out.push({ pole: 'konwersjaBezKanalu', ...SPRZECZNOSCI.konwersjaBezKanalu });
  if (id === 'ustapienie' && innyKanal) out.push({ pole: 'ustapienieMimoInnegoKanalu', ...SPRZECZNOSCI.ustapienieMimoInnegoKanalu });
  if (id === 'niewiarygodne' && !(s.kontrolaPowod)) out.push({ pole: 'niewiarygodneBezPowodu', ...SPRZECZNOSCI.niewiarygodneBezPowodu });
  return out;
}

/* ============ 5. Wpis do historii serii ============
   Dokument (komputer): „Historia pozycji i czasu pozostaje dostępna", a wynik kontroli „zasila
   generator opisu" (Blok 15). Wpis powstaje TUTAJ, w jednym miejscu, i jest jedyną rzeczą, którą
   ten blok utrwala.

   DWIE RZECZY, KTÓRYCH TU NIE MA, I TO JEST ŚWIADOME:
     • ZEGARA — żadnego `Date.now`. Wpis nie niesie znacznika czasu, bo (a) czyniłby złoty wzorzec
       niedeterministycznym, (b) godzina badania w zapisie sesji jest daną, która razem z resztą
       zbliża zapis do dokumentacji pacjenta, a tego blok ma nie robić. Kolejność wpisów niesie
       cała potrzebna informacja o następstwie.
     • CZASU ZMIERZONEGO U PACJENTA — `czasy` to czasy Z PLANU (protokolarne albo ustawione ręcznie
       suwakiem), a nie to, ile pacjent naprawdę leżał. Aplikacja mierzy czas jednego etapu naraz
       i nie sumuje go przez manewr, więc nazwanie tego „czasem wykonania" byłoby fikcją. Pole
       `czasySkad` mówi to wprost i wchodzi do podsumowania. */
export function wpisKontroli(stan, wynikId, deps) {
  const s = stan || {};
  const m = s.flow && s.flow.maneuver;
  if (!m || !m.key) return null;
  const plan = s.plan && s.plan.key === m.key ? s.plan : null;
  const kanal = deps && typeof deps.canalOf === 'function' ? deps.canalOf(m.key) : (s.canal || null);
  return {
    manewr: m.key,
    kanal: kanal || null,
    strona: m.planSide || null,
    mechanizm: plan ? (plan.mechanism || null) : (s.variant || null),
    czasy: plan ? plan.steps.map(x => (x.seconds == null ? null : x.seconds)) : [],
    czasySkad: s.trybCzasu === 'doUstapienia' ? 'planPodniesiony' : 'plan',
    wynik: wynikId || null,
    powod: wynikId === 'niewiarygodne' ? (s.kontrolaPowod || null) : null,
    viaInterpret: !!m.viaInterpret,
  };
}

/* ============ 6. KRYTERIUM ODBIORU NR 3 — STRAŻNIK, NIE OBIETNICA ============
   „Użytkownik może zakończyć i zapisać sesję bez wypełnienia danych identyfikacyjnych pacjenta."
   W aplikacji nie ma dziś ANI JEDNEGO pola tekstowego, więc kryterium jest spełnione — i dokładnie
   dlatego dokładamy ZAPADKĘ zamiast naprawy (ten sam ruch, co przy kryterium nr 2 Bloku 10).

   Strażnik chodzi po GOTOWYM wpisie i go ODRZUCA, zamiast po cichu czyścić. Sanityzacja byłaby
   gorsza od odmowy: zapis wyglądałby na zapisany, a dane zniknęłyby bez śladu (lekcja z toru VOG,
   `assertNoPersonalData`). Reguła jest strukturalna, nie słownikowa — nie szukamy imion, tylko
   wymagamy, żeby KAŻDA wartość pochodziła z zamkniętego zbioru albo była liczbą. Napis, którego
   nie ma w słowniku, jest naruszeniem NIEZALEŻNIE od tego, co znaczy. */
export const POLA_WPISU = ['manewr', 'kanal', 'strona', 'mechanizm', 'czasy', 'czasySkad', 'wynik', 'powod', 'viaInterpret'];
export function bezDanychOsobowych(wpis, deps) {
  const powody = [];
  if (!wpis || typeof wpis !== 'object') return { czysty: false, powody: ['wpis nie jest obiektem'] };
  const dozwolonePowody = deps && typeof deps.powodyNiewiarygodnosci === 'function'
    ? deps.powodyNiewiarygodnosci().map(p => p.id) : [];
  for (const klucz of Object.keys(wpis)) {
    if (!POLA_WPISU.includes(klucz)) { powody.push(`pole spoza słownika: ${klucz}`); continue; }
    const v = wpis[klucz];
    if (v == null || typeof v === 'boolean') continue;
    if (klucz === 'czasy') {
      if (!Array.isArray(v) || v.some(x => x != null && !(typeof x === 'number' && isFinite(x))))
        powody.push('czasy muszą być liczbami albo null');
      continue;
    }
    if (typeof v === 'number') { if (!isFinite(v)) powody.push(`liczba nieskończona w polu ${klucz}`); continue; }
    if (typeof v !== 'string') { powody.push(`nieoczekiwany typ w polu ${klucz}`); continue; }
    const slownik =
      klucz === 'wynik' ? WYNIK_IDS
      : klucz === 'powod' ? dozwolonePowody
      : klucz === 'strona' ? ['L', 'P']
      : klucz === 'mechanizm' ? ['canalo', 'cupulo']
      : klucz === 'czasySkad' ? ['plan', 'planPodniesiony']
      : klucz === 'kanal' ? ['posterior', 'horizontal', 'anterior']
      : klucz === 'manewr' ? (deps && typeof deps.manewry === 'function' ? deps.manewry() : null)
      : null;
    if (slownik === null) { powody.push(`brak słownika dla pola ${klucz}`); continue; }
    if (!slownik.includes(v)) powody.push(`wartość spoza słownika w polu ${klucz}`);
  }
  return { czysty: powody.length === 0, powody };
}

/* ============ 7. Podsumowanie sesji ============
   To NIE jest generator opisu badania (Blok 15). To lista tego, co w tej sesji naprawdę zaszło,
   zbudowana wyłącznie z identyfikatorów — etykiety dokłada ekran. Pozycje o wartości `null` też
   są zwracane: „czego NIE zrobiono" jest w podsumowaniu badania równie ważne jak to, co zrobiono,
   a milczenie czytałoby się jako brak potrzeby. */
export function podsumowanieSesji(stan, deps) {
  const s = stan || {};
  const f = s.flow || {};
  const tr = f.triage || null;
  const kontrole = Array.isArray(s.kontrole) ? s.kontrole : [];
  const opisano = Object.keys(s.obs || {}).filter(k => {
    const r = s.obs[k];
    return !!r && (r.wystapil !== undefined || Object.keys(r.pola || {}).length > 0);
  });
  return {
    kwalifikacja: tr && tr.complete ? { kategoria: tr.kategoria, sciezka: tr.sciezka, pewnosc: tr.pewnosc, czerwona: !!tr.czerwona } : null,
    proba: s.testKey || null,
    opisaneProby: opisano,
    kanal: s.canal || null,
    strona: s.side || null,
    stronaZrodlo: s.sideZrodlo || null,
    mechanizm: s.variant || null,
    mechanizmZrodlo: s.variantZrodlo || null,
    obrazOsrodkowy: !!s.diagCentral,
    kontrole: kontrole.map(k => ({ manewr: k.manewr, kanal: k.kanal, strona: k.strona, wynik: k.wynik, powod: k.powod || null })),
    // Manewr wybrany, ale bez zapisanej kontroli — najczęstsza dziura w opisie badania.
    manewrBezKontroli: !!(f.maneuver && f.maneuver.key && f.maneuver.kontrolaIdx == null),
    czasySkad: kontrole.length ? kontrole[kontrole.length - 1].czasySkad : null,
    domkniete: kontrole.length > 0 && !!wynikKontroli(kontrole[kontrole.length - 1].wynik)?.zamyka,
  };
}

/* ============ 8. Status kroku „Kontrola" dla paska przebiegu ============
   Czytane przez flow-model.js (bezimportowy) przez STRESZCZENIE w stanie — dokładnie tak samo,
   jak kwalifikacja wstępna z Bloku 6. Tutaj mieszka reguła, a nie w pasku:
     brak wyniku            → krok niewykonany,
     wynik „niewiarygodne"  → `unreliable` (nie `done` — kontrola się odbyła, ale nic nie niesie),
     wynik zamykający       → `done`,
     wynik niezamykający    → `done` Z POWODEM, bo proces trwa dalej i pasek ma to napisać. */
export function streszczenieKontroli(stan) {
  const s = stan || {};
  const kontrole = Array.isArray(s.kontrole) ? s.kontrole : [];
  const m = s.flow && s.flow.maneuver;
  const idx = m ? m.kontrolaIdx : null;
  const wpis = idx != null && kontrole[idx] ? kontrole[idx] : null;
  if (!wpis || !wpis.wynik) return { wynik: null, status: 'todo', zamyka: false, wiarygodny: true, seria: kontrole.length };
  const w = wynikKontroli(wpis.wynik);
  return {
    wynik: wpis.wynik,
    status: w && !w.wiarygodny ? 'unreliable' : 'done',
    zamyka: !!(w && w.zamyka),
    wiarygodny: !!(w && w.wiarygodny),
    nowaPodstawa: !!(w && w.nowaPodstawa),
    seria: kontrole.length,
  };
}
