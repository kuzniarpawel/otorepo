/* OTOREPO — JEDYNY pisarz stanu badania HINTS (Blok 12).
 *
 * Ten sam wzorzec, co obs-state.js (Blok 8) i followup-state.js (Blok 11): model jest czysty i
 * niczego nie zapisuje, ekran niczego nie zapisuje, a wszystkie mutacje idą przez jeden plik.
 * Powód jest praktyczny: pól badania jest sześć plus cztery pola kwalifikacji, a przy dwóch
 * pisarzach „wyczyść badanie” i „zmień odpowiedź” rozjeżdżają się po pierwszej zmianie zakresu.
 *
 * Wartości NIE ZE SŁOWNIKA są odrzucane TUTAJ, na granicy zapisu — nie w modelu i nie na ekranie.
 * Dzięki temu stan aplikacji nigdy nie zawiera napisu, którego model nie zna, i strażnik danych
 * z hints-model.js nie ma czego odrzucać na wyjściu.
 */
import { state } from './state.js';
import { ELEMENT_IDS, opcjaHints, POMINIECIE_IDS, POWOD_NIEWIAR_IDS, nastepnyElement } from './hints-model.js';

/* Pełna lista pól, które ten moduł posiada. Wyrocznie i `czysty()` w złotym wzorcu MUSZĄ ją
   przepisać w całości — pominięcie choćby jednego pola sprawia, że przypadki testowe zaczynają
   przechodzić przez KOLEJNOŚĆ, a nie przez kod (pułapka zamknęła ZR4/ZR5 w Bloku 9 i TC3 w 10). */
export const POLA_HINTS = ['hintsBadanie', 'hintsPowodNiewiar', 'hintsPominiecie',
  'hintsPrzeszkolenie', 'hintsKrok', 'hintsBlad'];

export function czystyStanHints(s) {
  const st = s || state;
  st.hintsBadanie = {};
  st.hintsPowodNiewiar = null;
  st.hintsPominiecie = null;
  st.hintsPrzeszkolenie = null;
  st.hintsKrok = null;
  st.hintsBlad = null;
}

/* Zapis składowej. Ponowne dotknięcie tej samej odpowiedzi ją ZDEJMUJE — składowa wraca do stanu
   „jeszcze nie odpowiedziano”, który jest czymś innym niż „nie można ocenić”. To rozróżnienie jest
   kryterium odbioru nr 2 widzianym od strony zapisu: gdyby cofnięcie odpowiedzi ustawiało
   „nieocenione”, użytkownik zaznaczałby brak oceny przez pomyłkę, samym wahaniem. */
export function zapiszSkladowa(id, v) {
  if (!ELEMENT_IDS.includes(id)) return false;
  const b = state.hintsBadanie && typeof state.hintsBadanie === 'object' ? state.hintsBadanie : {};
  const nowe = { ...b };
  if (v == null || b[id] === v) delete nowe[id];
  else { if (!opcjaHints(id, v)) return false; nowe[id] = v; }
  state.hintsBadanie = nowe;
  // Powód niewiarygodności ma sens WYŁĄCZNIE przy odpowiedzi „niewiarygodne”. Zostawiony po zmianie
  // odpowiedzi opisywałby stan, którego już nie ma — i wszedłby tak do wpisu sesji.
  if (nowe.wiarygodnosc !== 'niewiarygodne') state.hintsPowodNiewiar = null;
  return true;
}

export function ustawPowodNiewiar(v) {
  if (v != null && !POWOD_NIEWIAR_IDS.includes(v)) return false;
  state.hintsPowodNiewiar = state.hintsPowodNiewiar === v ? null : v;
  return true;
}

export function ustawPrzeszkolenie(v) {
  if (v !== 'tak' && v !== 'nie' && v != null) return false;
  state.hintsPrzeszkolenie = state.hintsPrzeszkolenie === v ? null : v;
  return true;
}

/* Pominięcie kwalifikacji. Powód spoza słownika NIE jest pominięciem — bez tej linii dowolny napis
   podany przez wywołującego otwierałby moduł, a bramka `wolnoBadac` czyta właśnie to pole.

   ZAPIS JEST IDEMPOTENTNY, A COFNIĘCIE MA WŁASNĄ FUNKCJĘ — i to nie jest kwestia gustu. Pierwsza
   wersja przełączała: ponowne dotknięcie tego samego powodu zdejmowało pominięcie. Złoty wzorzec
   złapał to natychmiast (połowa scenariuszy symulatora wylądowała z powrotem na kwalifikacji), ale
   groźniejszy jest skutek w aplikacji: przy BRAMCE WEJŚCIA przełącznik znaczy, że przypadkowe
   podwójne dotknięcie po cichu odbiera dostęp — bez komunikatu, bo stan wraca do poprawnego
   „kwalifikacja niewypełniona". Ustawienie i cofnięcie to dwie różne intencje i mają dwie funkcje. */
export function ustawPominiecie(powod) {
  if (powod == null || !POMINIECIE_IDS.includes(powod)) return false;
  state.hintsPominiecie = powod;
  state.hintsBlad = null;
  return true;
}
export function cofnijPominiecieStan() {
  state.hintsPominiecie = null;
  state.hintsBlad = null;
  return true;
}

export function wyczyscBadanie() {
  state.hintsBadanie = {};
  state.hintsPowodNiewiar = null;
  state.hintsKrok = ELEMENT_IDS[0];
}

// Krok pokazywany na telefonie. `null` znaczy „pierwsza nieodpowiedziana”, a nie „żadna”.
export function ustawKrok(id) {
  if (id != null && !ELEMENT_IDS.includes(id)) return false;
  state.hintsKrok = id;
  return true;
}
export function biezacyKrok() {
  const k = state.hintsKrok;
  if (k && ELEMENT_IDS.includes(k)) return k;
  return nastepnyElement(state) || ELEMENT_IDS[ELEMENT_IDS.length - 1];
}
