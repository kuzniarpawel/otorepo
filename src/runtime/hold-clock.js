/* OTOREPO — zegar UTRZYMANIA POZYCJI (Blok 10, kryterium odbioru nr 3).
 *
 * Dokument: „Timer działa przy zablokowanym ekranie, o ile pozwala na to platforma, lub wyraźnie
 * ostrzega przed przerwaniem."
 *
 * ═══ CO BYŁO ═══
 * Licznik sumował `dt` z kolejnych klatek rAF (`state.elapsedMs += rnow - last`). Wygląda to na
 * „licznik stoi, gdy ekran zgaśnie", ale prawda jest inna i gorsza: `last` jest zmienną domknięcia,
 * nikt jej nie rusza przy powrocie widoczności, a znacznik rAF biegnie w czasie RZECZYWISTYM.
 * Pierwsza klatka po odblokowaniu dostaje więc `dt` równe CAŁEJ przerwie i licznik nadrabia ją
 * jednym skokiem — razem z warunkiem końca etapu, sygnałem dźwiękowym i auto-przejściem. Przy
 * przerwie dłuższej niż suma etapów daje to KASKADĘ aż do ostatniego, gdzie `goStep` woła
 * `markConsumed`. Aplikacja meldowała wtedy manewr wykonany, choć telefon leżał w kieszeni.
 *
 * ═══ CO ROBIMY ═══
 * 1. Czas mierzymy ZEGAREM ŚCIENNYM (kotwica + suma pauz), a nie sumą klatek. `dt` zostaje
 *    wyłącznie animacji. Dzięki temu odczyt jest prawdziwy niezależnie od tego, ile klatek
 *    przepadło — to jest ta połowa kryterium, która mówi „timer działa".
 * 2. PRZERWA W WIDOCZNOŚCI JEST ZDARZENIEM KLINICZNYM, nie tylko technicznym. Aplikacja umie
 *    zmierzyć czas, ale NIE UMIE stwierdzić, czy pacjent naprawdę utrzymał pozycję, gdy nikt na
 *    ekran nie patrzył. Dlatego luka dłuższa niż próg zatrzymuje odliczanie i musi zostać
 *    potwierdzona — to jest druga połowa kryterium: „wyraźnie ostrzega przed przerwaniem".
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * Zero importów, zero DOM i — co ważniejsze — ZERO `Date.now()`: bieżący czas wchodzi ARGUMENTEM.
 * Bez tego wyrocznia nie mogłaby zbadać sekwencji „start → 10 s → ukrycie 4 s → powrót" inaczej
 * niż przez realne czekanie, a determinizm bramki o znaczeniu klinicznym nie może zależeć od tego,
 * jak szybko chodzi maszyna.
 */

// Luka krótsza od progu to zwykłe przełączenie aplikacji na moment; dłuższa znaczy, że przez ten
// czas NIKT nie patrzył na pacjenta. 3 s jest po stronie ostrożności: krótsze przerwy zdarzają się
// przy powiadomieniach systemowych i alarmowanie o nich uczyłoby ignorowania komunikatu.
export const PROG_LUKI_MS = 3000;

export function nowyZegar() {
  return { kotwica: null, pauzaOd: null, sumaPauz: 0, luka: 0, luki: 0 };
}

export function startZegara(z, teraz, odMs) {
  const od = odMs == null ? odliczono(z, teraz) : odMs;
  z.kotwica = teraz - od;
  z.sumaPauz = 0;
  z.pauzaOd = null;
  return z;
}
export function pauzaZegara(z, teraz) {
  if (z.kotwica == null || z.pauzaOd != null) return z;
  z.pauzaOd = teraz;
  return z;
}
export function wznowZegar(z, teraz) {
  if (z.pauzaOd == null) return z;
  z.sumaPauz += Math.max(0, teraz - z.pauzaOd);
  z.pauzaOd = null;
  return z;
}
export function resetZegara(z) {
  z.kotwica = null; z.pauzaOd = null; z.sumaPauz = 0; z.luka = 0; z.luki = 0;
  return z;
}
// Odliczony czas w ms. Pauza NIE liczy się do utrzymania pozycji — pacjent w niej nie leży.
export function odliczono(z, teraz) {
  if (z.kotwica == null) return 0;
  const doKiedy = z.pauzaOd != null ? z.pauzaOd : teraz;
  return Math.max(0, doKiedy - z.kotwica - z.sumaPauz);
}
/* Ręczna zmiana odczytu (suwak skrócił czas poniżej odliczonego). Przesuwamy KOTWICĘ, a nie
   osobne pole — dwa źródła prawdy o tym samym czasie rozjechałyby się przy pierwszej pauzie. */
export function ustawOdliczono(z, teraz, ms) {
  if (z.kotwica == null) return z;
  const baza = z.pauzaOd != null ? z.pauzaOd : teraz;
  z.kotwica = baza - Math.max(0, ms) - z.sumaPauz;
  return z;
}

/* Powrót po przerwie w widoczności. Zwraca `{ms, istotna}`; `istotna` znaczy „dłuższa niż próg,
   więc nie wolno jej po cichu zaliczyć jako utrzymanej pozycji". Czas i tak jest policzony
   prawdziwie (kotwica), bo pacjent najprawdopodobniej leżał — pytanie brzmi, czy klinicysta to
   POTWIERDZA, a na to odpowiada człowiek, nie zegar. */
export function odnotujLuke(z, ukryteOd, teraz, prog) {
  const p = prog == null ? PROG_LUKI_MS : prog;
  const ms = Math.max(0, teraz - (ukryteOd == null ? teraz : ukryteOd));
  const istotna = ms >= p;
  if (istotna) { z.luka = ms; z.luki = (z.luki | 0) + 1; }
  return { ms, istotna };
}
export function potwierdzLuke(z) { z.luka = 0; return z; }
