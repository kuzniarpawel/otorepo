/* OTOREPO — czysty model BADANIA HINTS/HINTS+ Z KWALIFIKACJĄ (Blok 12).
 *
 * Dokument użytkownika, Blok 12: „Włączenie modułu ostrego zespołu przedsionkowego w sposób
 * bezpieczny, kontekstowy i dydaktyczny”. Ekran kwalifikacyjny POPRZEDZA badanie; składowe to
 * head impulse, charakter oczopląsu, test of skew, przesiewowa ocena słuchu, chód/stabilność oraz
 * wynik niewiarygodny; każda ma krótką instrukcję i wyjaśnienie znaczenia; podsumowanie odróżnia
 * wynik wspierający uszkodzenie OBWODOWE od CECH ALARMOWYCH i nie zastępuje decyzji klinicznej.
 * Trzy kryteria odbioru:
 *   1. nie można przejść do HINTS bez potwierdzenia właściwego obrazu klinicznego ALBO świadomego
 *      pominięcia kwalifikacji,
 *   2. odpowiedź „nie można ocenić” NIE jest traktowana jak wynik prawidłowy,
 *   3. wynik zawiera wyraźne ostrzeżenie przy cechach ośrodkowych.
 *
 * ═══ TO NIE JEST SYMULATOR ═══
 * OTOREPO ma już moduł HINTS: scenariuszowy model NeuroVOR, w którym wybierasz patologię, a silnik
 * pokazuje, jak zachowają się oczy. Ten model robi rzecz ODWROTNĄ — przyjmuje to, co klinicysta
 * ZOBACZYŁ U PACJENTA, i porządkuje obserwacje. Symulator uczy wzorca; badanie zapisuje obserwację.
 * Mieszanie ich na jednym ekranie było ryzykiem opisanym już przy Bloku 8: dopóki formularz sąsiaduje
 * z animacją przewidywanego oczopląsu, „zgodność” mierzy tylko to, czy ktoś dobrze przepisał ekran.
 *
 * ═══ DLACZEGO OPCJE NIE NAZYWAJĄ SIĘ „PRAWIDŁOWY / NIEPRAWIDŁOWY” ═══
 * Dokument opisuje wybory jako „prawidłowy, nieprawidłowy, nie można ocenić”. Zachowujemy KSZTAŁT
 * (duże wybory, zawsze jawne „nie można ocenić”), ale nie te dwa napisy — bo w HINTS one się
 * ODWRACAJĄ i to jest cała pointa badania. PRAWIDŁOWA próba pchnięcia głową u pacjenta z ostrym
 * zespołem przedsionkowym jest ustaleniem GROŹNYM („Impulse Normal” z mnemoniku INFARCT [H8]),
 * a NIEPRAWIDŁOWA — uspokajającym. Przycisk „prawidłowy” nad ustaleniem, które znaczy „udar do
 * wykluczenia”, byłby najgorszym możliwym napisem w całej aplikacji. Opcje nazywają więc to, CO
 * WIDAĆ („sakada korygująca” / „oczy zostają na celu”), a znaczenie dokłada podsumowanie.
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * ZERO importów, zero DOM, zero `state` z modułu — stan i wiedza kliniczna wchodzą ARGUMENTEM
 * (wzorzec „inject-for-purity”, jak flow-model.js, obs-model.js, man-model.js, followup-model.js).
 * tools/hints-check.mjs uruchamia go w gołym Node na PEŁNYM iloczynie odpowiedzi.
 * Napisy trzymamy jako SUROWE pary pl/en: t() na poziomie modułu ZAMROZIŁOBY język.
 *
 * deps (src/app/hints-deps.js): { triageResult, activeQuestions, triageComplete }
 *
 * Źródła: [H8] Kattah 2009 (HINTS, INFARCT) · [H9] Tarnutzer 2011 (HINTS a kontekst) ·
 *         [H24] GRACE-3 2023 (ataksja chodu = ośrodek; HINTS niedokładny bez przeszkolenia) ·
 *         [H28] Newman-Toker 2013 (HINTS „plus” — nowy jednostronny niedosłuch).   // [H26] to Ozgirgin; numer poprawiony przez zrodla:check
 */

/* ════════════════════════════════════════════════════════════════════════════════════════════
   1. KWALIFIKACJA — kryterium odbioru nr 1
   ════════════════════════════════════════════════════════════════════════════════════════════
   Kwalifikacja NIE jest osobnym kwestionariuszem. Czyta ten sam stan `triage`, który wypełnia
   Blok 6, przez wstrzyknięty `triageResult` — dzięki temu kwalifikacja wstępna i kwalifikacja do
   HINTS nie mogą powiedzieć dwóch różnych rzeczy o tym samym pacjencie. Ekran kwalifikacyjny
   Bloku 12 pokazuje te same pytania, tylko z werdyktem liczonym pod kątem HINTS.

   Wejście do modułu jest możliwe DWIEMA drogami i tylko dwiema:
     • kwalifikacja POTWIERDZONA — odpowiedzi układają się w ostry zespół przedsionkowy,
     • kwalifikacja POMINIĘTA ŚWIADOMIE — użytkownik klika pominięcie i wybiera POWÓD z zamkniętej
       listy; powód idzie do wyniku jako zastrzeżenie i nigdy z niego nie znika.
   Trzeciej drogi (wejścia „po prostu”) nie ma — i to jest cała treść kryterium nr 1. */

export const POWODY_POMINIECIA = {
  nauka: {
    pl: 'pokaz dydaktyczny — nie badam teraz pacjenta',
    en: 'teaching demonstration — I am not examining a patient now',
    badaniePacjenta: false,
  },
  symulacja: {
    pl: 'chcę zobaczyć wzorce na modelu (matematyczny pacjent)',
    en: 'I want to see the patterns on the model (mathematical patient)',
    badaniePacjenta: false,
  },
  pozaAplikacja: {
    pl: 'kwalifikację przeprowadziłem poza aplikacją',
    en: 'I carried out the qualification outside the app',
    badaniePacjenta: true,
  },
  mimoOdradzania: {
    pl: 'znam obraz kliniczny i wchodzę mimo odradzania',
    en: 'I know the clinical picture and I am proceeding despite the advice against it',
    badaniePacjenta: true,
  },
};
export const POMINIECIE_IDS = Object.keys(POWODY_POMINIECIA);

/* Stany kwalifikacji. `wolno` mówi, czy z tego stanu da się wejść do BADANIA — i jest jedynym
   miejscem, w którym ta decyzja zapada. Warstwa akcji nie ma prawa mieć własnego warunku. */
export const STANY_KWALIFIKACJI = {
  potwierdzona: {
    wolno: true,
    pl: 'Obraz kliniczny potwierdzony', en: 'Clinical picture confirmed',
    opisPl: 'Ciągłe zawroty z utrzymującym się oczopląsem samoistnym to ostry zespół przedsionkowy — sytuacja, w której HINTS ma zastosowanie.',
    opisEn: 'Continuous dizziness with sustained spontaneous nystagmus is an acute vestibular syndrome — the situation in which HINTS applies.',
  },
  odradzana: {
    wolno: false,
    pl: 'Kwalifikacja odradza HINTS', en: 'The qualification advises against HINTS',
    opisPl: 'Odpowiedzi nie układają się w ostry zespół przedsionkowy. HINTS wykonany poza tym obrazem daje wynik, którego nie da się poprawnie odczytać — a wynik „uspokajający” jest wtedy groźniejszy niż brak badania.',
    opisEn: 'The answers do not match an acute vestibular syndrome. HINTS performed outside that picture yields a result that cannot be read correctly — and a "reassuring" result is then more dangerous than not testing at all.',
  },
  brak: {
    wolno: false,
    pl: 'Kwalifikacja niewypełniona', en: 'Qualification not completed',
    opisPl: 'Bez odpowiedzi o przebiegu i o oczopląsie samoistnym nie wiadomo, czy HINTS jest tu właściwym badaniem.',
    opisEn: 'Without answers about the time course and spontaneous nystagmus it is not known whether HINTS is the right examination here.',
  },
  pominieta: {
    wolno: true,
    pl: 'Kwalifikacja pominięta świadomie', en: 'Qualification deliberately skipped',
    opisPl: 'Wchodzisz do modułu bez potwierdzenia obrazu klinicznego. Powód pominięcia wchodzi do wyniku i zostaje w nim do końca sesji.',
    opisEn: 'You are entering the module without confirming the clinical picture. The reason for skipping goes into the result and stays there for the rest of the session.',
  },
};

/* Przeszkolenie badającego. To NIE jest ozdobnik: GRACE-3 [H24] mówi wprost, że HINTS wykonany
   przez osobę nieprzeszkoloną jest niedokładny, a jego czułość przy łóżku spada poniżej wartości
   ze źródeł. Pytamy raz, w kwalifikacji, i wynik nosi to jako zastrzeżenie — zamiast kazać
   użytkownikowi zaznaczać „badanie niewiarygodne” za każdym razem. */
export const PRZESZKOLENIE = {
  tak: { pl: 'Wykonuję HINTS rutynowo i byłem w tym szkolony',
         en: 'I perform HINTS routinely and I was trained in it' },
  nie: { pl: 'Nie mam przeszkolenia w wykonywaniu HINTS',
         en: 'I have no training in performing HINTS' },
};

export function kwalifikacjaHints(stan, deps) {
  const s = stan || {};
  const pominiecie = s.hintsPominiecie && POWODY_POMINIECIA[s.hintsPominiecie] ? s.hintsPominiecie : null;
  const przeszkolenie = (s.hintsPrzeszkolenie === 'tak' || s.hintsPrzeszkolenie === 'nie') ? s.hintsPrzeszkolenie : null;
  const w = deps && typeof deps.triageResult === 'function' ? deps.triageResult(s.triage || {}) : null;
  const kompletna = deps && typeof deps.triageComplete === 'function' ? !!deps.triageComplete(s.triage || {}) : false;

  let status;
  if (pominiecie) status = 'pominieta';
  else if (!kompletna) status = 'brak';
  else if (w && w.sciezka === 'hints') status = 'potwierdzona';
  else status = 'odradzana';

  const def = STANY_KWALIFIKACJI[status];
  return {
    status,
    wolno: def.wolno,
    potwierdzona: status === 'potwierdzona',
    pominieta: status === 'pominieta',
    pominiecie,
    // Pominięcie „na pokaz” znaczy, że to nie jest zapis badania pacjenta — wynik ma to napisać.
    badaniePacjenta: pominiecie ? POWODY_POMINIECIA[pominiecie].badaniePacjenta : true,
    przeszkolenie,
    // Kategoria kwalifikacji wstępnej niesie POWÓD odradzania (BPPV, pseudo-AVS, czerwona flaga).
    kategoria: w ? w.kategoria : null,
    czerwona: !!(w && w.kategoria === 'czerwona'),
    kompletna,
    pl: def.pl, en: def.en, opisPl: def.opisPl, opisEn: def.opisEn,
  };
}

/* Jedyna bramka wejścia. Warstwa akcji woła TO, a nie własny warunek — inaczej za pół roku będą
   dwa warunki, które się rozjadą (dokładnie tak powstało 7 wejść omijających kwalifikację). */
export function wolnoBadac(stan, deps) {
  const k = kwalifikacjaHints(stan, deps);
  return { wolno: k.wolno, status: k.status, powodPl: k.opisPl, powodEn: k.opisEn };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   2. SKŁADOWE BADANIA — sześć elementów z dokumentu
   ════════════════════════════════════════════════════════════════════════════════════════════
   Pola opcji:
     v          — identyfikator (słownik ZAMKNIĘTY; nigdzie w tym bloku nie ma pola tekstowego),
     waga       — jak opcja wchodzi do podsumowania:
                    'obwod'          wspiera uszkodzenie obwodowe,
                    'alarm'          cecha alarmowa (ośrodkowa),
                    'neutralny'      odnotowane, nie przechyla w żadną stronę,
                    'nieinformatywny' obserwacja, z której w TYM kontekście nic nie wynika,
                    'nieoceniony'    „nie można ocenić” — DOKŁADNIE JEDNA opcja na element.
   Pola elementu:
     trzon      — czy to jedna z trzech właściwych składowych HINTS (HI · N · TS). Trzon rozstrzyga
                  o wniosku; „plus” (słuch) i chód dokładają cechy alarmowe, ale same nie tworzą
                  wyniku uspokajającego.
     instrukcja — jak wykonać (dokument: „każdy element ma krótką instrukcję”),
     znaczenie  — co z tego wynika (dokument: „i wyjaśnienie znaczenia”),
     pulapka    — czego ten element NIE mówi. To jest najważniejsze pole kliniczne w całym bloku:
                  bez niego moduł uczyłby, że ujemny test of skew wyklucza udar. */
export const ELEMENTY = [
  {
    id: 'hit', trzon: true,
    pl: 'Próba pchnięcia głową (head impulse)', en: 'Head impulse test',
    instrukcjaPl: 'Poproś pacjenta o patrzenie na Twój nos. Trzymając głowę w dłoniach, wykonaj MAŁE (10–20°), szybkie i NIEPRZEWIDYWALNE pchnięcie w płaszczyźnie kanałów poziomych, osobno w każdą stronę. Patrz na oczy PO zatrzymaniu głowy.',
    instrukcjaEn: 'Ask the patient to look at your nose. Holding the head, deliver a SMALL (10–20°), fast and UNPREDICTABLE thrust in the plane of the horizontal canals, separately to each side. Watch the eyes AFTER the head stops.',
    znaczeniePl: 'Sakada korygująca (oczy zjeżdżają z celu i wracają skokiem) znaczy, że odruch przedsionkowo-oczny po tej stronie nie działa — to przemawia za uszkodzeniem OBWODOWYM. Oczy, które zostają na celu MIMO oczopląsu samoistnego, to „Impulse Normal” z mnemoniku INFARCT — ustalenie ALARMOWE.',
    znaczenieEn: 'A corrective saccade (the eyes slip off the target and jump back) means the vestibulo-ocular reflex on that side is not working — this argues for a PERIPHERAL lesion. Eyes that stay on target DESPITE spontaneous nystagmus are the "Impulse Normal" of INFARCT — an ALARM finding.',
    pulapkaPl: 'Skompensowany ubytek obwodowy daje sakady UKRYTE, niewidoczne przy łóżku — prawidłowy obraz przy łóżku nie wyklucza przebytego uszkodzenia obwodowego. Pchnięcie zbyt wolne albo przewidywalne daje wynik fałszywie prawidłowy.',
    pulapkaEn: 'A compensated peripheral loss produces COVERT saccades, invisible at the bedside — a normal bedside picture does not exclude a past peripheral lesion. A thrust that is too slow or predictable gives a falsely normal result.',
    opcje: [
      { v: 'sakadaL', waga: 'obwod',
        pl: 'Sakada korygująca przy pchnięciu w LEWO (ucho lewe)', en: 'Corrective saccade on thrust to the LEFT (left ear)' },
      { v: 'sakadaP', waga: 'obwod',
        pl: 'Sakada korygująca przy pchnięciu w PRAWO (ucho prawe)', en: 'Corrective saccade on thrust to the RIGHT (right ear)' },
      { v: 'sakadaObu', waga: 'nieinformatywny',
        pl: 'Sakady po OBU stronach', en: 'Saccades on BOTH sides' },
      { v: 'brakSakady', waga: 'alarm',
        pl: 'Bez sakady — oczy zostają na celu', en: 'No saccade — the eyes stay on target' },
      { v: 'nieocenione', waga: 'nieoceniony',
        pl: 'Nie można ocenić', en: 'Cannot assess' },
    ],
  },
  {
    id: 'oczoplas', trzon: true,
    pl: 'Charakter oczopląsu', en: 'Character of the nystagmus',
    instrukcjaPl: 'Obejrzyj oczy w patrzeniu na wprost, a potem przy spojrzeniu 20–30° w lewo i w prawo (nie do skrajności — oczopląs krańcowy jest fizjologiczny). Oceń także BEZ fiksacji: gogle Frenzla, ciemność albo oftalmoskop z zasłoniętym drugim okiem.',
    instrukcjaEn: 'Look at the eyes in primary gaze, then at 20–30° left and right (not to the extremes — end-point nystagmus is physiological). Assess also WITHOUT fixation: Frenzel goggles, darkness, or an ophthalmoscope with the other eye covered.',
    znaczeniePl: 'Oczopląs OBWODOWY bije zawsze w tę samą stronę niezależnie od kierunku spojrzenia i słabnie przy fiksacji. Oczopląs zmieniający kierunek ze spojrzeniem („Fast-phase Alternating”) oraz oczopląs czysto pionowy albo czysto skrętny to cechy OŚRODKOWE.',
    znaczenieEn: 'PERIPHERAL nystagmus always beats the same way regardless of gaze direction and fades with fixation. Nystagmus that changes direction with gaze ("Fast-phase Alternating") and purely vertical or purely torsional nystagmus are CENTRAL features.',
    pulapkaPl: 'Brak widocznego oczopląsu NIE jest wynikiem prawidłowym — znaczy, że to nie jest sytuacja dla HINTS (pseudo-AVS). Oczopląs obwodowy bywa całkowicie tłumiony patrzeniem, więc ocena w świetle, bez zniesienia fiksacji, potrafi go w całości przeoczyć.',
    pulapkaEn: 'Absent visible nystagmus is NOT a normal result — it means this is not a situation for HINTS (pseudo-AVS). Peripheral nystagmus can be completely suppressed by fixation, so assessment in the light, without removing fixation, can miss it entirely.',
    opcje: [
      { v: 'jednokierunkowy', waga: 'obwod',
        pl: 'Jednokierunkowy poziomo-skrętny, kierunek nie zmienia się ze spojrzeniem',
        en: 'Unidirectional horizontal-torsional, direction unchanged by gaze' },
      { v: 'zmiennyKierunkowo', waga: 'alarm',
        pl: 'Zmienia kierunek ze spojrzeniem', en: 'Changes direction with gaze' },
      { v: 'pionowyLubSkretny', waga: 'alarm',
        pl: 'Czysto pionowy albo czysto skrętny', en: 'Purely vertical or purely torsional' },
      { v: 'bezOczoplasu', waga: 'nieinformatywny',
        pl: 'Nie widać oczopląsu samoistnego', en: 'No spontaneous nystagmus visible' },
      { v: 'nieocenione', waga: 'nieoceniony',
        pl: 'Nie można ocenić', en: 'Cannot assess' },
    ],
  },
  {
    id: 'skew', trzon: true,
    pl: 'Test naprzemiennego zasłaniania (test of skew)', en: 'Alternate cover test (test of skew)',
    instrukcjaPl: 'Pacjent patrzy na cel na wprost. Zasłoń jedno oko na około dwie sekundy, przenieś zasłonkę na drugie i obserwuj oko, które właśnie odsłoniłeś. Powtórz kilka razy — szukasz PIONOWEGO ruchu nastawczego.',
    instrukcjaEn: 'The patient fixes on a target straight ahead. Cover one eye for about two seconds, move the cover to the other eye and watch the eye you have just uncovered. Repeat several times — you are looking for a VERTICAL refixation movement.',
    znaczeniePl: 'Pionowy ruch nastawczy to odchylenie skośne — element reakcji przechylenia ocznej z uszkodzenia pnia mózgu. Cecha ALARMOWA. Brak odchylenia jest zgodny z przyczyną obwodową.',
    znaczenieEn: 'A vertical refixation movement is a skew deviation — part of the ocular tilt reaction from a brainstem lesion. An ALARM feature. No deviation is consistent with a peripheral cause.',
    pulapkaPl: 'Test of skew jest SWOISTY, ale mało czuły: występuje u mniejszości chorych z udarem. Ujemny wynik nie wyklucza udaru i nie ma prawa być czytany jako „w porządku”.',
    pulapkaEn: 'The test of skew is SPECIFIC but insensitive: it is present in a minority of stroke patients. A negative result does not exclude a stroke and must not be read as "all clear".',
    opcje: [
      { v: 'brakOdchylenia', waga: 'obwod',
        pl: 'Bez pionowego ruchu nastawczego', en: 'No vertical refixation movement' },
      { v: 'obecne', waga: 'alarm',
        pl: 'Pionowy ruch nastawczy obecny', en: 'Vertical refixation movement present' },
      { v: 'nieocenione', waga: 'nieoceniony',
        pl: 'Nie można ocenić', en: 'Cannot assess' },
    ],
  },
  {
    id: 'sluch', trzon: false,
    pl: 'Przesiewowa ocena słuchu (HINTS „plus”)', en: 'Hearing screen (HINTS "plus")',
    instrukcjaPl: 'Zapytaj o NOWY niedosłuch, szum albo uczucie pełności w uchu w TYM epizodzie. Porównaj słyszenie potarcia palców przy każdym uchu; jeśli masz stroik — wykonaj próbę Webera i Rinnego.',
    instrukcjaEn: 'Ask about NEW hearing loss, tinnitus or aural fullness in THIS episode. Compare the perception of finger rub at each ear; if you have a tuning fork, perform the Weber and Rinne tests.',
    znaczeniePl: 'Nowy jednostronny niedosłuch w ostrym zespole przedsionkowym podnosi podejrzenie zawału w zakresie tętnicy AICA (unaczynienie błędnika) — to jest „plus” w HINTS+. Symetryczny słuch usuwa tę cechę alarmową, ale sam z siebie NIE dokłada nic uspokajającego.',
    znaczenieEn: 'New unilateral hearing loss in an acute vestibular syndrome raises suspicion of an AICA-territory infarct (the labyrinth is supplied by that artery) — this is the "plus" in HINTS+. Symmetric hearing removes that alarm feature but adds nothing reassuring on its own.',
    pulapkaPl: 'Niedosłuch nie dowodzi udaru: zapalenie błędnika daje ten sam obraz. Działa w drugą stronę — jego OBECNOŚĆ podnosi czujność, jego brak niczego nie wyklucza.',
    pulapkaEn: 'Hearing loss does not prove a stroke: labyrinthitis produces the same picture. It works one way — its PRESENCE raises concern, its absence excludes nothing.',
    opcje: [
      { v: 'symetryczny', waga: 'neutralny',
        pl: 'Słuch symetryczny, bez nowego niedosłuchu', en: 'Symmetric hearing, no new hearing loss' },
      { v: 'nowyJednostronny', waga: 'alarm',
        pl: 'Nowy jednostronny niedosłuch w tym epizodzie', en: 'New unilateral hearing loss in this episode' },
      { v: 'przewlekly', waga: 'neutralny',
        pl: 'Niedosłuch obecny, ale sprzed tego epizodu', en: 'Hearing loss present, but predating this episode' },
      { v: 'nieocenione', waga: 'nieoceniony',
        pl: 'Nie można ocenić', en: 'Cannot assess' },
    ],
  },
  {
    id: 'chod', trzon: false,
    pl: 'Chód i stabilność', en: 'Gait and stability',
    instrukcjaPl: 'Przy asekuracji drugiej osoby posadź pacjenta, potem poproś o stanie ze złączonymi stopami i o kilka kroków BEZ PODPARCIA. Jeżeli stan pacjenta na to nie pozwala — zaznacz „nie można ocenić”, nie zgaduj.',
    instrukcjaEn: 'With a second person alongside, sit the patient up, then ask them to stand with the feet together and take a few steps UNAIDED. If the patient is too unwell — mark "cannot assess", do not guess.',
    znaczeniePl: 'Niemożność samodzielnego stania albo chodzenia w ostrych zawrotach przemawia za przyczyną OŚRODKOWĄ niezależnie od pozostałych składowych — to najmocniejsza pojedyncza cecha wytycznych GRACE-3.',
    znaczenieEn: 'Inability to stand or walk unaided in acute dizziness argues for a CENTRAL cause regardless of the other components — this is the single strongest feature in the GRACE-3 guideline.',
    pulapkaPl: 'Ostre jednostronne uszkodzenie obwodowe też daje wyraźną niestabilność z zbaczaniem ku uchu chorego. Progiem jest NIEMOŻNOŚĆ chodzenia bez podparcia, a nie sama chwiejność.',
    pulapkaEn: 'An acute unilateral peripheral loss also causes marked unsteadiness with veering toward the affected ear. The threshold is INABILITY to walk unaided, not unsteadiness as such.',
    opcje: [
      { v: 'chodziBezPodparcia', waga: 'obwod',
        pl: 'Chodzi bez podparcia', en: 'Walks unaided' },
      { v: 'chwiejnyAleChodzi', waga: 'neutralny',
        pl: 'Wyraźnie chwiejny, ale chodzi bez podparcia', en: 'Markedly unsteady, but walks unaided' },
      { v: 'nieStoiBezPodparcia', waga: 'alarm',
        pl: 'Nie stoi ani nie chodzi bez podparcia', en: 'Cannot stand or walk unaided' },
      { v: 'nieocenione', waga: 'nieoceniony',
        pl: 'Nie można ocenić', en: 'Cannot assess' },
    ],
  },
  {
    id: 'wiarygodnosc', trzon: false,
    pl: 'Wiarygodność badania', en: 'Reliability of the examination',
    instrukcjaPl: 'Na koniec odpowiedz, czy warunki pozwoliły przeprowadzić badanie tak, żeby na jego podstawie cokolwiek twierdzić.',
    instrukcjaEn: 'At the end, state whether the conditions allowed the examination to be carried out well enough to claim anything from it.',
    znaczeniePl: 'Badanie nazwane niewiarygodnym nie może uspokajać. Nie znosi natomiast zauważonej cechy alarmowej — to celowa asymetria: „nie byłem pewien” nie kasuje tego, co zobaczyłeś.',
    znaczenieEn: 'An examination called unreliable cannot reassure. It does not, however, cancel an alarm feature that was noticed — a deliberate asymmetry: "I was not sure" does not erase what you saw.',
    pulapkaPl: 'To pole nie jest zastrzeżeniem prawnym. Zaznaczenie „wiarygodne” przy dwóch nieocenionych składowych trzonu niczego nie naprawia — wniosek i tak zostanie niepełny.',
    pulapkaEn: 'This field is not a legal disclaimer. Marking "reliable" with two unassessed core components repairs nothing — the conclusion will remain incomplete anyway.',
    opcje: [
      { v: 'wiarygodne', waga: 'neutralny',
        pl: 'Badanie wykonane w warunkach pozwalających na ocenę', en: 'Examination performed in conditions allowing assessment' },
      { v: 'niewiarygodne', waga: 'neutralny',
        pl: 'Badania nie da się wiarygodnie ocenić', en: 'The examination cannot be reliably assessed' },
      { v: 'nieocenione', waga: 'nieoceniony',
        pl: 'Nie można ocenić', en: 'Cannot assess' },
    ],
  },
];

export const ELEMENT_IDS = ELEMENTY.map(e => e.id);
export const TRZON_IDS = ELEMENTY.filter(e => e.trzon).map(e => e.id);
export function elementHints(id) { return ELEMENTY.find(e => e.id === id) || null; }
export function opcjaHints(id, v) { const e = elementHints(id); return e ? (e.opcje.find(o => o.v === v) || null) : null; }

/* Powody niewiarygodności — słownik ZAMKNIĘTY, jak w Bloku 8 i 11. Brak przeszkolenia NIE jest tu
   pozycją: pytamy o nie raz, w kwalifikacji, i wynik nosi to sam. Dwa miejsca na to samo zdanie
   znaczą, że kiedyś powiedzą co innego. */
export const POWODY_NIEWIARYGODNOSCI_HINTS = {
  pacjentNiewspolpracujacy: {
    pl: 'pacjent nie współpracuje (wymioty, senność, ból)',
    en: 'the patient does not cooperate (vomiting, drowsiness, pain)',
  },
  brakZniesieniaFiksacji: {
    pl: 'brak możliwości zniesienia fiksacji (gogle Frenzla, ciemność)',
    en: 'no way to remove fixation (Frenzel goggles, darkness)',
  },
  patologiaOczu: {
    pl: 'wcześniejsza patologia oczu lub okoruchowa uniemożliwia ocenę',
    en: 'pre-existing ocular or oculomotor pathology prevents assessment',
  },
  brakWarunkow: {
    pl: 'warunki badania (ułożenie, kołnierz, brak asekuracji) nie pozwoliły na pełne badanie',
    en: 'the examination conditions (positioning, collar, no second person) did not allow a full examination',
  },
};
export const POWOD_NIEWIAR_IDS = Object.keys(POWODY_NIEWIARYGODNOSCI_HINTS);

/* ════════════════════════════════════════════════════════════════════════════════════════════
   3. SPRZĘŻENIA MIĘDZY SKŁADOWYMI
   ════════════════════════════════════════════════════════════════════════════════════════════
   Waga opcji nie zawsze jest stała — dwie zależności są klinicznie nieusuwalne i muszą siedzieć
   w modelu, a nie w napisie na ekranie:

   • „Impulse Normal” jest cechą alarmową WYŁĄCZNIE w ostrym zespole przedsionkowym, czyli przy
     obecnym oczopląsie samoistnym. U pacjenta bez oczopląsu prawidłowa próba pchnięcia głową jest
     zwyczajnie prawidłowa i nie znaczy nic — czytanie jej jako „ośrodek” byłoby fałszywym alarmem
     w najczęstszej sytuacji ambulatoryjnej. Gdy oczopląsu NIE OCENIONO, wynik też nie jest alarmem,
     ale wniosek i tak nie może wtedy wyjść uspokajający (trzon jest niekompletny).

   • Sakady po OBU stronach nie wspierają obwodu w sensie HINTS: HINTS zakłada JEDNOSTRONNY ostry
     zespół przedsionkowy, a obustronna wiestibulopatia daje sakady wszędzie i wygląda „uspokajająco”
     przy realnym, ciężkim uszkodzeniu. */
export const SPRZEZENIA = {
  hitBezOczoplasu: {
    pl: 'prawidłowa próba pchnięcia głową jest cechą alarmową tylko przy obecnym oczopląsie samoistnym — bez niego nic z niej nie wynika',
    en: 'a normal head impulse is an alarm feature only when spontaneous nystagmus is present — without it nothing follows from it',
  },
  hitObustronny: {
    pl: 'sakady po obu stronach nie wspierają uszkodzenia jednostronnego — HINTS zakłada jednostronny ostry zespół przedsionkowy',
    en: 'saccades on both sides do not support a unilateral lesion — HINTS assumes a unilateral acute vestibular syndrome',
  },
};

const OCZOPLAS_REALNY = ['jednokierunkowy', 'zmiennyKierunkowo', 'pionowyLubSkretny'];

/* Waga opcji W KONTEKŚCIE pozostałych odpowiedzi. Zwraca też `sprzezenie`, żeby ekran mógł napisać,
   DLACZEGO ta sama obserwacja waży dziś inaczej. */
export function wagaOdpowiedzi(elementId, odp) {
  const a = odp || {};
  const v = a[elementId];
  const o = opcjaHints(elementId, v);
  if (!o) return { waga: null, sprzezenie: null };
  if (elementId === 'hit' && v === 'brakSakady' && !OCZOPLAS_REALNY.includes(a.oczoplas)) {
    return { waga: 'nieinformatywny', sprzezenie: 'hitBezOczoplasu' };
  }
  if (elementId === 'hit' && v === 'sakadaObu') return { waga: 'nieinformatywny', sprzezenie: 'hitObustronny' };
  return { waga: o.waga, sprzezenie: null };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   4. PRZEBIEG BADANIA — telefon prowadzi krok po kroku
   ════════════════════════════════════════════════════════════════════════════════════════════ */
export function odpowiedziHints(stan) {
  const b = (stan && stan.hintsBadanie) || {};
  const out = {};
  for (const id of ELEMENT_IDS) out[id] = opcjaHints(id, b[id]) ? b[id] : null;
  return out;
}
export function nastepnyElement(stan) {
  const a = odpowiedziHints(stan);
  for (const id of ELEMENT_IDS) if (!a[id]) return id;
  return null;
}
export function badanieKompletne(stan) { return nastepnyElement(stan) === null; }
export function postepBadania(stan) {
  const a = odpowiedziHints(stan);
  const zrobione = ELEMENT_IDS.filter(id => !!a[id]).length;
  return { zrobione, wszystkich: ELEMENT_IDS.length, rozpoczete: zrobione > 0 };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   5. PODSUMOWANIE — kryteria odbioru nr 2 i nr 3
   ════════════════════════════════════════════════════════════════════════════════════════════
   Dokument: „Podsumowanie rozróżnia wynik wspierający obwodowe uszkodzenie od cech alarmowych;
   nie zastępuje decyzji klinicznej.”

   KRYTERIUM NR 2 („nie można ocenić” nie jest wynikiem prawidłowym) jest tu ZAPISANE TRZY RAZY,
   na trzech różnych poziomach, bo jedno miejsce dałoby się obejść przypadkiem:
     a) `nieocenione` nigdy nie wchodzi do `wspierajaObwod` — bo jego waga to 'nieoceniony';
     b) wniosek 'obwodowy' WYMAGA kompletnego trzonu — jedna nieoceniona składowa HINTS wystarczy,
        żeby wynik nie mógł wyjść uspokajający;
     c) nieocenione składowe są WYMIENIONE z nazwy w osobnej liście, więc ekran nie może ich
        przemilczeć ani wyświetlić jako pustych.

   KRYTERIUM NR 3 (wyraźne ostrzeżenie przy cechach ośrodkowych): `ostrzezenie` jest niepuste
   WTEDY I TYLKO WTEDY, gdy `cechyAlarmowe` jest niepuste. Wyrocznia sprawdza tę równoważność na
   pełnym iloczynie odpowiedzi, w obie strony. */

export const WNIOSKI = {
  alarm: {
    pl: 'Cechy alarmowe — pilna ocena', en: 'Alarm features — urgent evaluation',
    opisPl: 'Zaznaczono ustalenia, które w ostrym zespole przedsionkowym przemawiają za przyczyną ośrodkową. To jest wskazanie do pilnej oceny, a nie wynik badania obrazowego.',
    opisEn: 'You marked findings that, in an acute vestibular syndrome, argue for a central cause. This indicates urgent evaluation; it is not an imaging result.',
  },
  nieinformatywne: {
    pl: 'HINTS nie ma tu zastosowania', en: 'HINTS does not apply here',
    opisPl: 'Bez oczopląsu samoistnego to nie jest ostry zespół przedsionkowy w rozumieniu HINTS. Najpierw znieś fiksację i oceń ponownie; jeżeli oczopląsu nadal nie ma, przyczyny szukaj poza układem przedsionkowym.',
    opisEn: 'Without spontaneous nystagmus this is not an acute vestibular syndrome in the sense of HINTS. First remove fixation and reassess; if there is still no nystagmus, look for a cause outside the vestibular system.',
  },
  niepelne: {
    pl: 'Badanie niepełne — bez wniosku', en: 'Incomplete examination — no conclusion',
    opisPl: 'Nie oceniono wszystkich trzech składowych HINTS. Brak oceny NIE jest wynikiem prawidłowym: z niepełnego badania nie wynika ani obraz obwodowy, ani jego brak.',
    opisEn: 'Not all three HINTS components were assessed. A missing assessment is NOT a normal result: an incomplete examination implies neither a peripheral picture nor its absence.',
  },
  /* Trzon KOMPLETNY, ale nie układa się w obraz obwodowy i nie ma cechy alarmowej. Dotąd wpadało
     to do „badania niepełnego" — a to był NAPIS NIEPRAWDZIWY: składowe zostały ocenione, tylko
     wynik jednej z nich nic nie rozstrzyga (sakady po obu stronach, prawidłowa próba pchnięcia
     głową bez oczopląsu). Osobny wniosek, bo prowadzi do innego działania niż „dokończ badanie". */
  nierozstrzygniete: {
    pl: 'Badanie wykonane, wynik nierozstrzygający', en: 'Examination performed, result inconclusive',
    opisPl: 'Składowe oceniono, ale nie układają się ani w obraz obwodowy, ani w cechy alarmowe — któraś obserwacja w tym kontekście nic nie rozstrzyga. Brak rozstrzygnięcia to nie jest wynik uspokajający.',
    opisEn: 'The components were assessed, but they form neither a peripheral picture nor alarm features — one of the observations settles nothing in this context. An inconclusive result is not a reassuring one.',
  },
  niepewne: {
    pl: 'Wzorzec obwodowy, ale bez wartości uspokajającej', en: 'Peripheral pattern, but with no reassuring value',
    opisPl: 'Składowe układają się w obraz obwodowy, ale coś odbiera temu wynikowi wartość: badanie nazwano niewiarygodnym, kwalifikacja została pominięta albo badający nie ma przeszkolenia w HINTS. Nie traktuj tego wyniku jako uspokajającego.',
    opisEn: 'The components form a peripheral picture, but something removes its value: the examination was called unreliable, the qualification was skipped, or the examiner has no HINTS training. Do not treat this result as reassuring.',
  },
  obwodowy: {
    pl: 'Wzorzec wspierający uszkodzenie obwodowe', en: 'Pattern supporting a peripheral lesion',
    opisPl: 'Wszystkie trzy składowe HINTS wypadły w kierunku obwodowym i nie zaznaczono cech alarmowych. To wynik BADANIA PRZY ŁÓŻKU, nie rozpoznanie i nie wykluczenie udaru — interpretuj razem z całym obrazem klinicznym.',
    opisEn: 'All three HINTS components pointed peripheral and no alarm features were marked. This is a BEDSIDE result, not a diagnosis and not an exclusion of stroke — interpret it together with the whole clinical picture.',
  },
  niewykonane: {
    pl: 'Badania jeszcze nie wykonano', en: 'The examination has not been performed yet',
    opisPl: 'Nie zaznaczono żadnej składowej.',
    opisEn: 'No component has been marked.',
  },
};
export const WNIOSEK_IDS = Object.keys(WNIOSKI);

/* Ostrzeżenie z kryterium nr 3. Treść jest ta sama, co na karcie czerwonej flagi Bloku 6 — i tak
   ma być: dwa różne zdania o tym samym postępowaniu znaczyłyby, że jedno z nich jest nieaktualne. */
export const OSTRZEZENIE = {
  tytulPl: 'Cechy przemawiające za przyczyną ośrodkową',
  tytulEn: 'Features arguing for a central cause',
  trescPl: 'Wymagana pilna ocena neurologiczna. Obrazowanie: MRI z dyfuzją (DWI) i angiografią (MRA); tomografia komputerowa NIE nadaje się do wykluczenia udaru tylnego dołu. Wczesne MRI bywa fałszywie ujemne — DWI jest fałszywie ujemne u 12–50% chorych w pierwszych 48 h (przy udarach ≤ 10 mm nawet 53%), więc przy prawidłowym pierwszym badaniu i utrzymującym się podejrzeniu potrzebna jest ocena SERYJNA; odstępu powtórzenia źródło nie podaje — [H58] Kim 2022.',
  trescEn: 'Urgent neurological evaluation is required. Imaging: MRI with diffusion (DWI) and angiography (MRA); CT is NOT suitable for ruling out a posterior-fossa stroke. Early MRI can be false-negative — DWI is falsely negative in 12–50% within the first 48 h (up to 53% for strokes ≤ 10 mm), so if the first scan is normal and suspicion persists, SERIAL evaluation is required; the source gives no repeat interval — [H58] Kim 2022.',
};

/* Zastrzeżenia — rzeczy, które odbierają wynikowi wartość uspokajającą, ale NIE znoszą cechy
   alarmowej. Ta asymetria jest świadoma i opisana przy elemencie `wiarygodnosc`. */
export const ZASTRZEZENIA = {
  bezPrzeszkolenia: {
    pl: 'badający zadeklarował brak przeszkolenia w wykonywaniu HINTS — badanie wykonane bez przeszkolenia bywa mylące, a wynik pozornie uspokajający jest wtedy groźniejszy niż brak badania',
    en: 'the examiner declared no training in performing HINTS — an untrained examination can mislead, and an apparently reassuring result is then more dangerous than not testing at all',
  },
  przeszkolenieNiepodane: {
    pl: 'nie podano, czy badający ma przeszkolenie w wykonywaniu HINTS',
    en: 'it was not stated whether the examiner has training in performing HINTS',
  },
  kwalifikacjaPominieta: {
    pl: 'kwalifikacja została pominięta — nie potwierdzono, że to ostry zespół przedsionkowy',
    en: 'the qualification was skipped — it was not confirmed that this is an acute vestibular syndrome',
  },
  niebadaniePacjenta: {
    pl: 'pominięcie zadeklarowano jako pokaz albo symulację — to nie jest zapis badania pacjenta',
    en: 'the skip was declared as a demonstration or a simulation — this is not a record of a patient examination',
  },
  badanieNiewiarygodne: {
    pl: 'badanie zostało nazwane niewiarygodnym — nie może uspokajać, ale nie znosi zauważonych cech alarmowych',
    en: 'the examination was called unreliable — it cannot reassure, but it does not cancel the alarm features noticed',
  },
  powodNiepodany: {
    pl: 'nie podano powodu niewiarygodności — bez niego zapis mówi tylko „nie wiadomo”',
    en: 'no reason for unreliability was given — without it the record says only "unknown"',
  },
};

export function podsumowanieHints(stan, deps) {
  const s = stan || {};
  const a = odpowiedziHints(s);
  const k = kwalifikacjaHints(s, deps);

  const wspierajaObwod = [], cechyAlarmowe = [], nieocenione = [], nieinformatywne = [], neutralne = [];
  for (const el of ELEMENTY) {
    const v = a[el.id];
    if (!v) continue;
    const { waga, sprzezenie } = wagaOdpowiedzi(el.id, a);
    const poz = {
      element: el.id, wartosc: v, trzon: !!el.trzon, sprzezenie: sprzezenie || null,
      pl: el.pl, en: el.en,
      wartoscPl: opcjaHints(el.id, v).pl, wartoscEn: opcjaHints(el.id, v).en,
      powodPl: sprzezenie ? SPRZEZENIA[sprzezenie].pl : null,
      powodEn: sprzezenie ? SPRZEZENIA[sprzezenie].en : null,
    };
    if (waga === 'obwod') wspierajaObwod.push(poz);
    else if (waga === 'alarm') cechyAlarmowe.push(poz);
    else if (waga === 'nieoceniony') nieocenione.push(poz);
    else if (waga === 'nieinformatywny') nieinformatywne.push(poz);
    else neutralne.push(poz);
  }

  const trzonOceniony = TRZON_IDS.filter(id => a[id] && a[id] !== 'nieocenione');
  const trzonKompletny = trzonOceniony.length === TRZON_IDS.length;
  const trzonObwodowy = TRZON_IDS.every(id => wagaOdpowiedzi(id, a).waga === 'obwod');
  const niewiarygodne = a.wiarygodnosc === 'niewiarygodne';
  const postep = postepBadania(s);

  // Zastrzeżenia liczymy ZAWSZE, niezależnie od wniosku — także przy cechach alarmowych, gdzie nie
  // zmieniają wyniku, ale mówią, jak powstał.
  const zastrzezenia = [];
  const dodaj = (id) => zastrzezenia.push({ id, ...ZASTRZEZENIA[id] });
  if (k.przeszkolenie === 'nie') dodaj('bezPrzeszkolenia');
  else if (k.przeszkolenie === null) dodaj('przeszkolenieNiepodane');
  if (k.pominieta) dodaj('kwalifikacjaPominieta');
  if (!k.badaniePacjenta) dodaj('niebadaniePacjenta');
  if (niewiarygodne) {
    dodaj('badanieNiewiarygodne');
    if (!s.hintsPowodNiewiar) dodaj('powodNiepodany');
  }
  // Cokolwiek odbiera wartość uspokajającą — ale NIGDY nie kasuje cechy alarmowej.
  const odbieraUspokojenie = niewiarygodne || k.przeszkolenie !== 'tak' || k.pominieta;

  /* KOLEJNOŚĆ TYCH WARUNKÓW JEST WYMAGANIEM, NIE STYLEM.
     Alarm idzie pierwszy, przed „HINTS nie ma zastosowania” i przed „badanie niepełne”: obecne
     odchylenie skośne albo niemożność chodzenia bez podparcia znaczą to samo niezależnie od tego,
     czy resztę badania dało się wykonać. */
  let wniosek;
  if (cechyAlarmowe.length) wniosek = 'alarm';
  else if (!postep.rozpoczete) wniosek = 'niewykonane';
  else if (a.oczoplas === 'bezOczoplasu') wniosek = 'nieinformatywne';
  else if (!trzonKompletny) wniosek = 'niepelne';
  else if (!trzonObwodowy) wniosek = 'nierozstrzygniete';
  else if (odbieraUspokojenie) wniosek = 'niepewne';
  else wniosek = 'obwodowy';

  const def = WNIOSKI[wniosek];
  return {
    wniosek, ...def,
    wspierajaObwod, cechyAlarmowe, nieocenione, nieinformatywne, neutralne,
    trzonKompletny, trzonObwodowy, niewiarygodne,
    powodNiewiarygodnosci: niewiarygodne ? (s.hintsPowodNiewiar || null) : null,
    zastrzezenia,
    kwalifikacja: k.status,
    postep,
    // Kryterium odbioru nr 3: obecne dokładnie wtedy, gdy są cechy alarmowe.
    ostrzezenie: cechyAlarmowe.length ? {
      tytulPl: OSTRZEZENIE.tytulPl, tytulEn: OSTRZEZENIE.tytulEn,
      trescPl: OSTRZEZENIE.trescPl, trescEn: OSTRZEZENIE.trescEn,
      cechy: cechyAlarmowe.map(c => c.element),
    } : null,
    // Zdanie, którego ten moduł nie ma prawa przemilczeć.
    zastrzezenieKliniczne: {
      pl: 'Wynik badania przy łóżku. Nie zastępuje decyzji klinicznej ani diagnostyki obrazowej.',
      en: 'A bedside result. It does not replace clinical judgment or imaging.',
    },
  };
}

/* ════════════════════════════════════════════════════════════════════════════════════════════
   6. WPIS DO SESJI + STRAŻNIK DANYCH
   ════════════════════════════════════════════════════════════════════════════════════════════
   Ten sam ruch, co w Bloku 11: w module nie ma ANI JEDNEGO pola tekstowego, więc zamiast naprawy
   dokładamy ZAPADKĘ. Strażnik chodzi po GOTOWYM wpisie i go ODRZUCA, zamiast po cichu czyścić —
   sanityzacja wyglądałaby na zapis, a dane zniknęłyby bez śladu. Reguła jest STRUKTURALNA: każda
   wartość musi pochodzić z zamkniętego zbioru albo być liczbą; napis spoza słownika jest
   naruszeniem niezależnie od tego, co znaczy. Wpis nie niesie ZEGARA — z tych samych dwóch
   powodów, co wpis kontroli (determinizm złotego wzorca + godzina badania to dana pacjenta). */
export const POLA_WPISU_HINTS = ['kwalifikacja', 'pominiecie', 'przeszkolenie', 'wiarygodnosc',
  'powodNiewiarygodnosci', 'wniosek', 'elementy', 'cechyAlarmowe', 'nieocenione'];

export function wpisHints(stan, deps) {
  const s = stan || {};
  const a = odpowiedziHints(s);
  const p = podsumowanieHints(s, deps);
  const k = kwalifikacjaHints(s, deps);
  return {
    kwalifikacja: k.status,
    pominiecie: k.pominiecie,
    przeszkolenie: k.przeszkolenie,
    wiarygodnosc: a.wiarygodnosc || null,
    powodNiewiarygodnosci: p.powodNiewiarygodnosci,
    wniosek: p.wniosek,
    elementy: ELEMENT_IDS.reduce((o, id) => { o[id] = a[id]; return o; }, {}),
    cechyAlarmowe: p.cechyAlarmowe.map(c => c.element),
    nieocenione: p.nieocenione.map(c => c.element),
  };
}

export function bezDanychOsobowychHints(wpis) {
  const powody = [];
  if (!wpis || typeof wpis !== 'object') return { czysty: false, powody: ['wpis nie jest obiektem'] };
  const slownikPola = (klucz) =>
    klucz === 'kwalifikacja' ? Object.keys(STANY_KWALIFIKACJI)
    : klucz === 'pominiecie' ? POMINIECIE_IDS
    : klucz === 'przeszkolenie' ? ['tak', 'nie']
    : klucz === 'wiarygodnosc' ? (elementHints('wiarygodnosc').opcje.map(o => o.v))
    : klucz === 'powodNiewiarygodnosci' ? POWOD_NIEWIAR_IDS
    : klucz === 'wniosek' ? WNIOSEK_IDS
    : null;
  for (const klucz of Object.keys(wpis)) {
    if (!POLA_WPISU_HINTS.includes(klucz)) { powody.push(`pole spoza słownika: ${klucz}`); continue; }
    const v = wpis[klucz];
    if (v == null || typeof v === 'boolean') continue;
    if (klucz === 'elementy') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) { powody.push('elementy muszą być obiektem'); continue; }
      for (const id of Object.keys(v)) {
        if (!ELEMENT_IDS.includes(id)) { powody.push(`element spoza słownika: ${id}`); continue; }
        if (v[id] == null) continue;
        if (typeof v[id] !== 'string' || !opcjaHints(id, v[id])) powody.push(`wartość spoza słownika w elemencie ${id}`);
      }
      continue;
    }
    if (klucz === 'cechyAlarmowe' || klucz === 'nieocenione') {
      if (!Array.isArray(v) || v.some(x => !ELEMENT_IDS.includes(x))) powody.push(`${klucz} muszą być identyfikatorami składowych`);
      continue;
    }
    if (typeof v === 'number') { if (!isFinite(v)) powody.push(`liczba nieskończona w polu ${klucz}`); continue; }
    if (typeof v !== 'string') { powody.push(`nieoczekiwany typ w polu ${klucz}`); continue; }
    const slownik = slownikPola(klucz);
    if (slownik === null) { powody.push(`brak słownika dla pola ${klucz}`); continue; }
    if (!slownik.includes(v)) powody.push(`wartość spoza słownika w polu ${klucz}`);
  }
  return { czysty: powody.length === 0, powody };
}
