/* OTOREPO — JEDYNA DROGA ZAPISU KONTROLI PO MANEWRZE (Blok 11).
 *
 * Wzorzec z flow-state.js i obs-state.js: model (`followup-model.js`) jest czysty i tylko CZYTA,
 * a cała mutacja stanu przechodzi przez ten jeden moduł.
 *
 * ═══ DWIE GRANICE, KTÓRE TU MIESZKAJĄ ═══
 * 1. ZAPIS PRZECHODZI PRZEZ STRAŻNIKA DANYCH i jest ODRZUCANY, gdy strażnik zgłosi naruszenie.
 *    Nie sanityzujemy: zapis wyglądałby wtedy na zapisany, a część treści znikałaby bez śladu
 *    (lekcja z toru VOG). Odmowa wraca do wołającego z powodami, żeby ekran miał co pokazać.
 * 2. ZAKOŃCZENIE SESJI KASUJE DANE PRZYPADKU, A NIE PREFERENCJE. Lista jest JAWNA i wyliczona
 *    z nazwy, nie z „wszystko poza kilkoma polami": pole dołożone w przyszłym bloku ma zostać
 *    w sesji następnego pacjenta tylko wtedy, gdy ktoś świadomie je tu dopisze.
 */
import { wpisKontroli, bezDanychOsobowych, wynikKontroli } from './followup-model.js';

function f(state) {
  if (!state.flow) state.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  return state.flow;
}

/* Zapis wyniku kontroli. Ponowne dotknięcie tej samej odpowiedzi ją COFA (ten sam gest, co przy
   `wystapil` w karcie obserwacji) — inaczej odpowiedź raz dotknięta byłaby nieodwoływalna.

   Wpis NIE JEST USUWANY z listy przy cofnięciu, tylko traci wynik: indeksy w `kontrolaIdx`
   wskazują pozycje tablicy, więc usunięcie elementu przesunęłoby kontrole POPRZEDNICH manewrów
   i historia serii zaczęłaby opisywać cudze manewry. */
export function zapiszWynik(state, wynikId, deps) {
  const m = f(state).maneuver;
  if (!m || !m.key) return { ok: false, powody: ['brak manewru'] };
  if (!Array.isArray(state.kontrole)) state.kontrole = [];

  const idx = m.kontrolaIdx;
  const biezacy = idx != null && state.kontrole[idx] ? state.kontrole[idx].wynik : null;
  const nowy = biezacy === wynikId ? null : wynikId;

  const wpis = wpisKontroli(state, nowy, deps);
  if (!wpis) return { ok: false, powody: ['brak manewru'] };
  // TOLERANCJA PRZEŻYWA ZMIANĘ WYNIKU. Wpis jest przebudowywany od zera, więc bez tego jednego
  // wiersza odnotowane „wymioty" znikałyby po zmianie odpowiedzi o skuteczności — czyli akurat
  // wtedy, gdy klinicysta poprawia wynik po namyśle.
  if (idx != null && state.kontrole[idx] && state.kontrole[idx].tolerancja) wpis.tolerancja = state.kontrole[idx].tolerancja;
  const straz = bezDanychOsobowych(wpis, deps);
  if (!straz.czysty) return { ok: false, powody: straz.powody };

  if (idx != null && state.kontrole[idx]) state.kontrole[idx] = wpis;
  else { state.kontrole.push(wpis); m.kontrolaIdx = state.kontrole.length - 1; }
  // Powód niewiarygodności traci sens, gdy wynik przestaje być niewiarygodny — zostawiony
  // wróciłby po cichu przy ponownym wyborze tej odpowiedzi.
  if (nowy !== 'niewiarygodne') state.kontrolaPowod = null;
  return { ok: true, wynik: nowy, powody: [] };
}

// Powód niewiarygodności ze SŁOWNIKA Bloku 8 (obs-model). Przełącznik, jak w karcie obserwacji.
export function ustawPowodKontroli(state, powod, deps) {
  state.kontrolaPowod = state.kontrolaPowod === powod ? null : powod;
  // Wpis już istnieje → musi zobaczyć nowy powód, inaczej historia serii i podsumowanie
  // pokazywałyby „niewiarygodne bez powodu" mimo podanego powodu.
  const m = f(state).maneuver;
  const idx = m ? m.kontrolaIdx : null;
  if (idx != null && state.kontrole && state.kontrole[idx] && state.kontrole[idx].wynik === 'niewiarygodne') {
    const wpis = wpisKontroli(state, 'niewiarygodne', deps);
    if (state.kontrole[idx].tolerancja) wpis.tolerancja = state.kontrole[idx].tolerancja;
    const straz = bezDanychOsobowych(wpis, deps);
    if (straz.czysty) state.kontrole[idx] = wpis;
  }
}

/* TOLERANCJA MANEWRU (Blok 15). Osobne pytanie i osobny gest, więc osobny pisarz — ale ten sam
   wpis, bo tolerancja opisuje TEN manewr, a nie sesję.

   Wpis powstaje także wtedy, gdy wyniku kontroli jeszcze nie ma: klinicysta widzi reakcję
   pacjenta ZARAZ po manewrze, a wynik kontroli dopiero po ponownej próbie. Wymuszanie kolejności
   „najpierw wynik, potem tolerancja" kazałoby zapamiętać obserwację i wrócić do niej później. */
export function ustawTolerancje(state, id, deps) {
  const m = f(state).maneuver;
  if (!m || !m.key) return { ok: false, powody: ['brak manewru'] };
  if (!Array.isArray(state.kontrole)) state.kontrole = [];
  const idx = m.kontrolaIdx;
  const istnieje = idx != null && state.kontrole[idx] ? state.kontrole[idx] : null;
  const wpis = wpisKontroli(state, istnieje ? istnieje.wynik : null, deps);
  if (!wpis) return { ok: false, powody: ['brak manewru'] };
  // Ponowne dotknięcie tej samej odpowiedzi ją COFA — ten sam gest, co przy wyniku i przy `wystapil`.
  wpis.tolerancja = (istnieje && istnieje.tolerancja === id) ? null : id;
  const straz = bezDanychOsobowych(wpis, deps);
  if (!straz.czysty) return { ok: false, powody: straz.powody };
  if (istnieje) state.kontrole[idx] = wpis;
  else { state.kontrole.push(wpis); m.kontrolaIdx = state.kontrole.length - 1; }
  return { ok: true, tolerancja: wpis.tolerancja, powody: [] };
}

/* ============ KRYTERIUM ODBIORU NR 3 ============
   „Użytkownik może zakończyć i zapisać sesję bez wypełnienia danych identyfikacyjnych pacjenta."
   Zakończenie nie ma ŻADNEGO warunku wstępnego: żadnego pola do wypełnienia, żadnej odpowiedzi
   do zaznaczenia. Kasuje dane PRZYPADKU i zostawia preferencje narzędzia.

   POLA_PRZYPADKU jest listą JAWNĄ, bo odwrotna reguła („kasuj wszystko poza…") sprawiłaby, że
   każde pole dołożone w przyszłym bloku znikałoby po cichu — także takie, które jest preferencją. */
export const POLA_PRZYPADKU = {
  triage: () => ({}), triageStep: () => null,
  obs: () => ({}), obsOdciski: () => ({}), obsGrupa: () => null, obsPorownanie: () => false,
  testKey: () => null, dixObs: () => null, dixRep: () => 0, diagCentral: () => false, diagPhaseFace: () => 0,
  canal: () => null, maneuverKey: () => null, plan: () => null, step: () => 0,
  side: () => 'P', sideZrodlo: () => null, variant: () => 'canalo', variantZrodlo: () => null,
  size: () => 'medium',
  kontrole: () => [], kontrolaPowod: () => null, zakonczeniePyta: () => false, kontrolaBlad: () => null,
  decisionSeq: () => 0,
  running: () => false, elapsedMs: () => 0, total: () => 0, autostart: () => false,
  zegar: () => null, ukryteOd: () => null, luka: () => 0, trybCzasu: () => 'staly',
  _manKey: () => null, _manSim: () => null,
  flow: () => ({ testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null }),
};
// Preferencje narzędzia — NIE dane pacjenta. Wypisane, żeby wyrocznia mogła sprawdzić, że
// zakończenie sesji ich NIE rusza (kasowanie języka przy każdym pacjencie byłoby wrogie).
export const POLA_PREFERENCJI = ['lang', 'view3d', 'sound', 'autoAdvance', 'reducedMotion', 'area', 'mode'];

export function zakonczSesjeStan(state) {
  for (const [pole, domyslna] of Object.entries(POLA_PRZYPADKU)) state[pole] = domyslna();
}

/* Streszczenie kontroli dla paska przebiegu — ta sama droga, co `syncTriage` w Bloku 6.
   Powód jest ten sam: flow-model.js jest BEZIMPORTOWY i taki ma zostać, więc czyta gotowe
   streszczenie ze stanu zamiast wołać model kontroli. */
export function syncKontrola(state) {
  const o = f(state);
  const kontrole = Array.isArray(state.kontrole) ? state.kontrole : [];
  const m = o.maneuver;
  const idx = m ? m.kontrolaIdx : null;
  const wpis = idx != null && kontrole[idx] ? kontrole[idx] : null;
  if (!wpis || !wpis.wynik) { o.kontrola = null; return; }
  const w = wynikKontroli(wpis.wynik);
  o.kontrola = {
    wynik: wpis.wynik,
    wiarygodny: !!(w && w.wiarygodny),
    zamyka: !!(w && w.zamyka),
    nowaPodstawa: !!(w && w.nowaPodstawa),
    powod: wpis.powod || null,
    seria: kontrole.filter(k => k && k.wynik).length,
  };
}
