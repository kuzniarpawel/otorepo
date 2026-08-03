/* OTOREPO — czysty model doboru i przebiegu manewru (Blok 10).
 *
 * Dokument użytkownika, Blok 10: „Połączenie prowadzonego manewru z szybkim trybem dla użytkownika,
 * który już zna kanał, stronę i mechanizm" + cztery zachowania wspólne (wspólny komponent sekwencji,
 * zalecany manewr odróżniony od alternatyw, każdy etap pokazuje pozycję/kąt/stronę/czas/kryterium,
 * timer na stały czas albo „do ustąpienia oczopląsu + zapas").
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * ZERO importów, zero DOM, zero `state` z modułu — stan i wiedza kliniczna wchodzą ARGUMENTEM
 * (wzorzec „inject-for-purity" z flow-model.js / interp-model.js). Dzięki temu tools/man-check.mjs
 * uruchamia go w gołym Node, a bramka o znaczeniu klinicznym nie zależy od jsdom.
 * Napisy trzymamy jako SUROWE pary pl/en — wywołanie t() na poziomie modułu ZAMROZIŁOBY język,
 * bo moduły ładują się przed initLang() (ta sama pułapka co w nav-model.js i obs-model.js).
 *
 * deps (src/app/man-deps.js): { recommend, canalOf, manewryKanalu, kanalProby, proby,
 *                               symulacja, harmonogram, sekundyOczoplasu, mechanizmManewru }
 */

/* ============ 1. Kanał → próba ============
   `recommend(testKey, variant)` ma CICHY WYNIK DOMYŚLNY: wszystko, co nie jest 'dix' ani 'headhang',
   spada do gałęzi kanału POZIOMEGO (maneuvers.js). Czyli literówka w kluczu próby nie daje błędu,
   tylko manewr niewłaściwego kanału. W trybie eksperckim wejściem jest KANAŁ, nie próba, więc
   tłumaczenie kanał→próba jest tu jedynym mostem i nie wolno go wpisać ręcznie: wyprowadzamy je
   z DIAG (jedyne źródło przypisania próba→kanał) i zwracamy null, gdy kanał jest nieznany. */
export function probyKanalu(kanal, deps) {
  if (!kanal || !deps || typeof deps.proby !== 'function' || typeof deps.kanalProby !== 'function') return [];
  return deps.proby().filter(k => deps.kanalProby(k) === kanal);
}
export function probaKanalu(kanal, deps) {
  const p = probyKanalu(kanal, deps);
  return p.length ? p[0] : null;
}

/* ============ 2. Dobór ekspercki ============
   Ani jednej pary „kanał+mechanizm → manewr" wpisanej ręcznie: pytamy `recommend()`, czyli to samo
   źródło, z którego korzysta ścieżka diagnostyczna. Gdyby kiedyś rozjechało się z listą manewrów
   kanału (CANALS[k].maneuvers), `poza` przestanie być puste i wyrocznia to pokaże — zamiast
   pokazywać klinicyście przycisk manewru, którego ten ekran nie zna.
   `rozbiezneProby` pilnuje kanału poziomego: ma DWIE próby (roll, bowlean) i dziś dają identyczne
   zalecenie. Gdy przestaną, wybór „pierwszej z brzegu" byłby cichym rozstrzygnięciem klinicznym. */
export function doborEkspercki(kanal, mechanizm, deps) {
  const proba = probaKanalu(kanal, deps);
  if (!proba || !deps || typeof deps.recommend !== 'function') return null;
  const rec = deps.recommend(proba, mechanizm);
  if (!rec || !rec.primary) return null;
  const lista = typeof deps.manewryKanalu === 'function' ? (deps.manewryKanalu(kanal) || []) : [];
  const alternatywy = (rec.alts || []).filter(k => k !== rec.primary);
  const poza = [rec.primary, ...alternatywy].filter(k => lista.length && !lista.includes(k));
  const inne = probyKanalu(kanal, deps).slice(1);
  const rozbiezneProby = inne.filter(p2 => {
    const r2 = deps.recommend(p2, mechanizm);
    return !r2 || r2.primary !== rec.primary;
  });
  return { proba, pierwszy: rec.primary, alternatywy, uwaga: rec.note || null, poza, rozbiezneProby };
}

/* ============ 2b. CZYJE SĄ TE TRZY WARTOŚCI ============
   Karta doboru chce napisać, skąd wziął się zalecany manewr. Zdanie „kanał, stronę i mechanizm
   podałeś Ty" jest przy pierwszym wejściu NIEPRAWDĄ: `state.side` ma literał 'P', a `state.variant`
   literał 'canalo' — obie wartości istnieją, bo animacja musi coś rysować, i żadnej użytkownik nie
   dotknął. Blok 9 zbudował `variantZrodlo` dokładnie po to, żeby takich rzeczy nie zlepiać;
   `sideZrodlo` jest jego symetrycznym uzupełnieniem. Kanał ma źródło wbudowane: literał to `null`,
   więc każda niepusta wartość pochodzi od użytkownika.
   Karta wymienia WYŁĄCZNIE pola z niepustym źródłem, a o reszcie mówi wprost, że jest domyślna. */
export const POLA_WYBORU = {
  kanal:     { pl: 'kanał',     en: 'canal' },
  strona:    { pl: 'strona',    en: 'side' },
  mechanizm: { pl: 'mechanizm', en: 'mechanism' },
};
export function podpisWyboru(stan) {
  const s = stan || {};
  const podane = [], domyslne = [];
  (s.canal ? podane : domyslne).push('kanal');
  (s.sideZrodlo ? podane : domyslne).push('strona');
  (s.variantZrodlo ? podane : domyslne).push('mechanizm');
  return { podane, domyslne, komplet: domyslne.length === 0 };
}

/* ============ 3. Etapy manewru ============
   Dokument: „Każdy etap pokazuje pozycję, kąt, stronę, czas i ewentualne kryterium przejścia dalej".
   Wszystkie pięć pochodzi z danych, których manewr już dostarcza — kryterium NIE jest napisem
   przypisanym manewrowi, tylko odczytem z fizyki:
     plynne — krok bez odliczania (seconds==null): „wykonaj płynnie, bez przerwy"
     czas   — krok z odliczaniem
   WYJŚCIE ZŁOGU JEST OSOBNĄ OSIĄ, nie trzecią wartością kryterium — i to nie jest kosmetyka.
   Zmierzone: w Epleyu złóg opuszcza kanał w kroku SIAD, który NIE MA odliczania. Wtłoczenie obu
   rzeczy w jedno pole kazałoby wybrać, którą z nich zataić, a akurat ten krok jest klinicznie
   najważniejszy w całym manewrze („oczopląs liberacyjny przy siadaniu").
   `wyjscieZeSchematu` mówi, czy krok kuracyjny wynika z FIZYKI, czy z reguły n-2 (kanał poziomy,
   kupulolitiaza). Schematu nie wolno pokazać jako pomiaru. */
export const KRYTERIA = {
  plynne:  { pl: 'bez odliczania — wykonaj płynnie', en: 'no countdown — perform smoothly' },
  czas:    { pl: 'utrzymaj pozycję przez podany czas', en: 'hold the position for the given time' },
};
export const WYJSCIE_ZLOGA = {
  fizyka:  { pl: 'w tym etapie złóg opuszcza kanał', en: 'at this stage the debris leaves the canal' },
  schemat: { pl: 'etap kuracyjny wg schematu manewru (nie z symulacji)', en: 'curative stage per the maneuver scheme (not from the simulation)' },
};
export function etapyManewru(plan, deps, rozmiar) {
  if (!plan || !plan.steps) return [];
  const man = deps && typeof deps.symulacja === 'function' ? deps.symulacja(plan, rozmiar) : null;
  const sched = man && typeof deps.harmonogram === 'function' ? deps.harmonogram(man, plan) : null;
  return plan.steps.map((st, i) => {
    const wyjscie = !!sched && sched.exitStep === i;
    const sekundyOczoplasu = man && typeof deps.sekundyOczoplasu === 'function'
      ? deps.sekundyOczoplasu(plan, man, i, rozmiar) : null;
    return {
      nr: i + 1,
      tytul: st.title,
      pozycja: { body: st.body, face: st.face },
      kat: st.yaw,
      strona: plan.side,
      sekundy: st.seconds == null ? null : st.seconds,
      kryterium: st.seconds == null ? 'plynne' : 'czas',
      wyjscieZloga: wyjscie,
      wyjscieZeSchematu: wyjscie && !!(sched && sched.schemat),
      sekundyOczoplasu,
    };
  });
}

/* ============ 4. „Do ustąpienia oczopląsu + zapas" ============
   ZMIERZONE, i to jest powód, dla którego ta funkcja jest PODŁOGĄ, a nie wartością:
   `sekundyOczoplasu` bierze się z okna dynamiki `min(cap, seconds)+tTrans+TAIL`, gdzie cap dla
   rozmiaru „średni" wynosi 12 s — czyli liczba NIGDY nie przekroczy ~19 s, niezależnie od tego,
   ile pozycja ma być trzymana. Semont ma w instrukcji „Utrzymaj 1–3 min" i seconds=90, a model
   daje 18,5 s. Gdyby tryb ustawiał tę liczbę wprost, aplikacja skróciłaby rzut Semonta o ~70 s
   PONIŻEJ dolnej granicy własnej instrukcji — a przy włączonym auto-przejściu sama przesunęłaby
   pacjenta dalej. Tryb ma więc prawo WYŁĄCZNIE WYDŁUŻAĆ czas protokolarny. */
export const ZAPAS_S = 15;
export const POWODY_CZASU = {
  protokol:       { pl: 'czas protokolarny manewru', en: 'the maneuver protocol time' },
  protokolDluzszy:{ pl: 'model daje krótszy czas niż protokół — zostaje protokół', en: 'the model gives a shorter time than the protocol — the protocol stands' },
  brakSygnalu:    { pl: 'model nie przewiduje oczopląsu w tym etapie', en: 'the model predicts no nystagmus in this stage' },
  oczoplas:       { pl: 'przewidywany czas oczopląsu + zapas', en: 'predicted nystagmus duration + margin' },
};
export function czasUtrzymania(sekProtokolu, sekOczoplasu, opcje) {
  const o = opcje || {};
  const zapas = o.zapas == null ? ZAPAS_S : o.zapas;
  const max = o.max == null ? 120 : o.max;
  const min = o.min == null ? 15 : o.min;
  // Krok BEZ odliczania zostaje bez odliczania. Tryb timera nie ma prawa zamienić „wykonaj płynnie"
  // w odliczaną pozycję — to zmiana samego manewru, nie ustawienie licznika.
  if (sekProtokolu == null) return { sekundy: null, zrodlo: 'plynne', powod: null };
  if (sekOczoplasu == null || !(sekOczoplasu > 0))
    return { sekundy: sekProtokolu, zrodlo: 'protokol', powod: 'brakSygnalu' };
  const kandydat = Math.max(min, Math.min(max, Math.round((sekOczoplasu + zapas) / 5) * 5));
  if (kandydat <= sekProtokolu) return { sekundy: sekProtokolu, zrodlo: 'protokol', powod: 'protokolDluzszy' };
  return { sekundy: kandydat, zrodlo: 'oczoplas', powod: 'oczoplas' };
}

/* Kupulolitiaza: ξ NIE WYGASA (zmierzone |ξ| = 100% szczytu jeszcze po 300 s), a aplikacja pisze
   o tym w czterech miejscach („uporczywy > 60 s"). Zdanie „do ustąpienia oczopląsu" nie ma wtedy
   desygnatu i tryb musi być NIEDOSTĘPNY — z podaniem powodu, nie przez wyszarzenie bez słowa. */
export const POWOD_BRAKU_TRYBU = {
  cupulo: { pl: 'w kupulolitiazie oczopląs nie wygasa — trzymaj czas protokolarny',
            en: 'in cupulolithiasis the nystagmus does not subside — hold the protocol time' },
};
export function trybDoUstapieniaDostepny(plan) {
  if (!plan) return { dostepny: false, powod: null };
  if (plan.mechanism === 'cupulo') return { dostepny: false, powod: 'cupulo' };
  return { dostepny: true, powod: null };
}

/* ============ 5. Spójność planu ze stanem ============
   ZMIERZONE trzy rozjazdy, każdy cichy:
     • `pickCanal` przy kanale o JEDNYM manewrze wybiera manewr za użytkownika (anterior→yacovino),
       a `state.plan` zostaje poprzedni — ekran twierdzi „kanał przedni", rysuje Lemperta;
     • `setGuideSide`/`pickSize` budują plan z `state.maneuverKey`, więc jedno dotknięcie pigułki
       strony PODMIENIA MANEWR, a odcisk przebiegu trzyma stary klucz;
     • `pickSide` zmienia `state.side` bez przebudowy planu → pigułka czyta `plan.side` i przycisk
       drugiej strony staje się martwy (`setGuideSide` wychodzi wcześnie na równości).
   Model nazywa te stany; naprawa siedzi w akcjach. Bramka istnieje po to, żeby żadna NOWA droga
   (tryb ekspercki dokłada ich trzy) nie wprowadziła ich z powrotem. */
export const ROZJAZDY = {
  manewr: { pl: 'plan należy do innego manewru niż wybrany', en: 'the plan belongs to a different maneuver than the selected one' },
  strona: { pl: 'plan zbudowano dla drugiego ucha', en: 'the plan was built for the other ear' },
  kanal:  { pl: 'plan należy do innego kanału niż wybrany', en: 'the plan belongs to a different canal than the selected one' },
  odcisk: { pl: 'zapis przebiegu wskazuje inny manewr niż plan na ekranie', en: 'the flow record points to a different maneuver than the plan on screen' },
};
export function spojnoscPlanu(stan, deps) {
  const powody = [];
  const plan = stan && stan.plan;
  if (!plan) return { zgodny: true, powody };
  const kanalManewru = stan.maneuverKey && deps && typeof deps.canalOf === 'function' ? deps.canalOf(stan.maneuverKey) : null;
  const planKey = plan.key || null;
  if (stan.maneuverKey && planKey && planKey !== stan.maneuverKey) powody.push({ pole: 'manewr', ...ROZJAZDY.manewr });
  if (stan.side && plan.side && stan.side !== plan.side) powody.push({ pole: 'strona', ...ROZJAZDY.strona });
  if (stan.canal && plan.canal && stan.canal !== plan.canal) powody.push({ pole: 'kanal', ...ROZJAZDY.kanal });
  const m = stan.flow && stan.flow.maneuver;
  if (m && m.key && planKey && m.key !== planKey) powody.push({ pole: 'odcisk', ...ROZJAZDY.odcisk });
  if (kanalManewru && plan.canal && kanalManewru !== plan.canal && !powody.some(p => p.pole === 'manewr'))
    powody.push({ pole: 'manewr', ...ROZJAZDY.manewr });
  return { zgodny: powody.length === 0, powody };
}

/* ============ 6. „Wykonany" to nie „obejrzany" ============
   `markConsumed` na ostatnim kroku wycisza WSZYSTKIE alarmy manewru na stałe (`maneuverDrift`
   zwraca [] przy consumed). Dotąd barierą były trzy dotknięcia strzałki „dalej"; oś etapów
   z podpisami zamienia to w JEDNO dotknięcie napisu „Powrót do siadu" — najzwyklejszy gest
   „zobaczmy, co mnie czeka". Rozdzielamy więc dojście SEKWENCYJNE od skoku po osi. */
export function wykonanySekwencyjnie(zKroku, doKroku, liczbaKrokow) {
  if (!(liczbaKrokow > 0)) return false;
  const ostatni = liczbaKrokow - 1;
  return doKroku === ostatni && zKroku === ostatni - 1;
}

/* ============ 7. Konwersja kanałowa PO wykonanym manewrze ============
   `consumed` słusznie gasi zdanie „wniosek jest nieaktualny" — manewr się wydarzył i przeszłości
   nie unieważnia nic. Ale jest DRUGIE zdanie, którego cisza połyka: „bieżące wejścia wskazują INNY
   KANAŁ niż wykonany manewr". To jest podręcznikowa konwersja kanałowa (PC→HC po Epleyu), czyli
   wskazanie do NOWEGO manewru, a nie zarzut wobec starego. Krok „Kontrola" jest w przygotowaniu
   (Blok 11), więc dziś nie ma innego miejsca, które by to zauważyło. */
export const SYGNAL_KONWERSJI = {
  pl: 'manewr wykonany, a bieżące wejścia wskazują inny kanał — rozważ nowy manewr',
  en: 'the maneuver was performed, but the current inputs point to a different canal — consider a new maneuver',
};
export function sygnalKonwersji(stan, deps) {
  const m = stan && stan.flow && stan.flow.maneuver;
  if (!m || !m.consumed || !m.key) return null;
  const kanalWykonanego = deps && typeof deps.canalOf === 'function' ? deps.canalOf(m.key) : null;
  if (!kanalWykonanego || !stan.canal || stan.canal === kanalWykonanego) return null;
  return { pole: 'konwersja', kanalWykonanego, kanalTeraz: stan.canal, ...SYGNAL_KONWERSJI };
}

/* ============ 8. Przeniesienie ręcznie ustawionych czasów ============
   `setStepSeconds` zapisuje w ŻYWYM planie czas utrzymania pozycji ustawiony suwakiem — parametr
   KLINICZNY, nie preferencja interfejsu (tak nazywa go komentarz przy setLangUI, jedynej akcji,
   która go dotąd chroniła). `setGuideSide` i `pickSize` przebudowują plan i go gubiły; Blok 10
   dokłada kolejne trzy drogi przebudowy. Przenosimy po TOŻSAMOŚCI kroku, nie po indeksie: przy
   podmianie manewru indeksy wskazują zupełnie inne pozycje ciała. */
export function przeniesCzasy(stary, nowy) {
  if (!stary || !nowy || !stary.steps || !nowy.steps) return nowy;
  if (stary.key && nowy.key && stary.key !== nowy.key) return nowy;   // inny manewr → czasy nie mają właściciela
  const wg = new Map();
  stary.steps.forEach(s => { if (s.seconds != null) wg.set(`${s.body}|${s.face}|${s.progress}`, s.seconds); });
  nowy.steps.forEach(s => {
    if (s.seconds == null) return;                                    // krok bez odliczania zostaje bez odliczania
    const v = wg.get(`${s.body}|${s.face}|${s.progress}`);
    if (v != null) s.seconds = v;
  });
  return nowy;
}
