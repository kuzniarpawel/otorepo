/* OTOREPO — zapis przebiegu klinicznego do stanu (Blok 5).
 *
 * flow-model.js jest CZYSTY (czyta stan, nigdy go nie zmienia) — tu mieszkają jedyne funkcje,
 * które ten stan zapisują. Rozdział jest celowy: wyrocznia tools/flow-check.mjs testuje model
 * bez uruchamiania aplikacji, a każda mutacja przechodzi przez jedno, dające się przeczytać
 * miejsce zamiast rozsypywać się po kilkunastu akcjach.
 *
 * Stan wchodzi ARGUMENTEM, nie importem. Dzięki temu moduł nie tworzy nowego cyklu w grafie
 * (state.js importuje actions.js, actions.js importuje svg-screens.js) i pozostaje wołalny
 * z obu stron: z actions.js i z svg-screens.js.
 */
import { noteManeuver } from './flow-model.js';

function f(state) {
  if (!state.flow) state.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  return state.flow;
}

/* JEDYNA droga zapisu decyzji interpretacyjnej (mechanizm, zaobserwowany oczopląs, obwód↔ośrodek).
   Licznik `decisionSeq` rośnie wyłącznie przy realnej zmianie wartości i służy JEDNEMU celowi:
   wchodzi do podpisu stanu powłoki (flowSignature), dzięki czemu pasek przebiegu odświeża się
   po każdej takiej decyzji. Do samego odcisku licznik NIE wchodzi — byłby zbyt tępy: karta
   mechanizmu jest narzędziem porównawczym („odwróć: kanalolitiaza albo kupulolitiaza"),
   a odwrócenie jej tam i z powrotem nie może zostawiać alarmu, którego nie da się zdjąć.
   Przypadek „nawigacja po cichu skasowała sygnał ostrzegawczy" łapie osobno noteNavCleared. */
export function markDecision(state, pole, wartosc) {
  const bylo = state[pole];
  state[pole] = wartosc;
  if (bylo !== wartosc) state.decisionSeq = (state.decisionSeq | 0) + 1;
  return bylo !== wartosc;
}

// Krok został przez użytkownika OTWARTY/dotknięty. Status opisuje to, co zrobił człowiek,
// a nie to, co aplikacja ma w stanie — samo `state.testKey` bywa ustawione bez wizyty na ekranie.
export function markSeen(state, ...flagi) { const o = f(state); for (const k of flagi) o[k] = true; }

// Wybór manewru. `viaInterpret=false` = wejście „Znam kanał i stronę" (kanał i strona pochodzą
// od użytkownika, nie z interpretacji próby) → krok „Interpretacja" dostaje status „pominięty".
export function markManeuver(state, key, viaInterpret) {
  f(state).maneuver = noteManeuver(state, key, viaInterpret, state.side);
}

/* Zmiana strony WEWNĄTRZ manewru (setGuideSide) przebudowuje plan dla nowej strony — po tej
   akcji manewr jest najświeższym elementem stanu. Gdyby odcisk trzymał starą stronę, pasek
   krzyczałby „zmieniono stronę" nad planem właśnie przeliczonym, w środku trwającej repozycji,
   a alarmu nie dałoby się zdjąć inaczej niż cofając własną korektę. Aktualizujemy WYŁĄCZNIE
   pole strony — podmiana całego odcisku skasowałaby równoczesny, zasłużony dryf (mechanizm/CPN). */
export function patchManeuverSide(state, side) {
  const m = f(state).maneuver;
  if (!m || !m.inputs) return;
  m.inputs.side = side;
  m.planSide = side;
}

// Manewr WYKONANY: dojście do ostatniego kroku planu albo „Zakończ serię". Przestaje być
// wnioskiem oczekującym — nowa interpretacja otwiera nowy odcisk. Bez tego każdy prawidłowy
// test kontrolny po repozycji zapalałby „wymaga ponownego przeliczenia" nad zakończoną serią.
export function markConsumed(state) {
  const m = f(state).maneuver;
  if (m) m.consumed = true;
}

/* Wybór INNEJ próby = nowy przebieg obserwacji, więc znaczniki „widziane" idą do zera.
   Odcisku manewru NIE kasujemy — i to jest istotne. Kasowanie go wyglądałoby na porządki, a w
   rzeczywistości tworzyło ciszę: `state.maneuverKey`, `state.canal` i `state.plan` zostają
   (ich czyszczenie to Blok 6, „Wywiad"/nowy pacjent), więc po wyczyszczeniu samego odcisku
   klinicysta mógłby wrócić do kroku „Manewr" i wejść w plan zbudowany dla poprzedniego badania
   BEZ żadnego ostrzeżenia. Zostawiony odcisk daje dokładnie to zdanie, które trzeba pokazać:
   „zmieniono próbę — inna próba wskazuje inny kanał". */
export function resetSeen(state) {
  const o = f(state);
  o.testSeen = false; o.obsSeen = false; o.interpretSeen = false;
}

/* Nawigacja zaraz WYCZYŚCI sygnał ostrzegawczy — zapamiętaj to na odcisku, zanim zniknie.
   Wołane z jednego miejsca: wybór INNEJ próby (który zeruje dixObs i diagCentral). Zwykłe
   odwrócenie karty mechanizmu tam i z powrotem tu nie trafia i trafić nie może — alarm po
   każdym obejrzeniu karty porównawczej byłby szumem, a szum uczy ignorowania paska. */
export function noteNavCleared(state) {
  const m = f(state).maneuver;
  if (!m) return;
  const bylSygnal = !!state.diagCentral || (state.testKey === 'dix' && state.dixObs === 'ant');
  if (bylSygnal) m.zatarte = true;
}
