/* pwa-state.js — Blok 16: JEDYNY pisarz pol aktualizacji. Ta sama zasada, co przy `flow`, `obs`,
   `kontrole`, nauce, Laboratorium i opisie: pole, do ktorego pisze wiecej niz jeden modul, przestaje
   miec wlasciciela, a wtedy nie da sie postawic bramki. Modul nie dotyka DOM ani `navigator` —
   rejestracja i komunikacja z service workerem siedza w src/runtime/pwa.js. */
import { BLOKADA_TWARDA } from './pwa-model.js';

export const POLA_AKTUALIZACJI = ['aktualizacja', 'aktualizacjaSchowana'];

/* Nowa wersja zainstalowala sie i CZEKA. Wolane z adaptera przegladarki; stan `wdrazana` jest
   nieodwracalny w ramach zycia karty (zaraz nastapi przeladowanie), wiec go nie nadpisujemy. */
export function ustawCzekajaca(state) {
  if (!state) return false;
  if (state.aktualizacja === 'wdrazana') return false;
  state.aktualizacja = 'czeka';
  return true;
}

export function schowajPasek(state) {
  if (!state || state.aktualizacja !== 'czeka') return false;
  state.aktualizacjaSchowana = true;
  return true;
}

/* WDROZENIE. Zwraca powod ODMOWY zamiast cicho nic nie robic: „nacisnalem i nic sie nie stalo"
   jest gorsze od komunikatu, a przy trwajacym manewrze odmowa jest CELEM, nie awaria. */
export function ustawWdrazana(state) {
  if (!state || state.aktualizacja !== 'czeka') return { ok: false, powod: 'brakAktualizacji' };
  if (BLOKADA_TWARDA.czy(state)) return { ok: false, powod: BLOKADA_TWARDA.id };
  state.aktualizacja = 'wdrazana';
  return { ok: true, powod: null };
}

/* Cofniecie stanu „wdrazana": worker nie przyjal prosby (np. zdazyl zniknac), wiec karta zostaje
   tam, gdzie byla. Bez tego pasek pokazywalby „Wdrazanie…" do konca zycia karty, a uzytkownik
   czekalby na przeladowanie, ktore nigdy nie nastapi. */
export function cofnijWdrazanie(state) {
  if (!state || state.aktualizacja !== 'wdrazana') return false;
  state.aktualizacja = 'czeka';
  return true;
}

// Uzywane wylacznie przez wyrocznie i scenariusze snapshotu — zeby zaden test nie musial pisac
// do pol stanu z zewnatrz i omijac tym samym jedynego pisarza.
export function zerujAktualizacje(state) {
  if (!state) return;
  state.aktualizacja = 'brak';
  state.aktualizacjaSchowana = false;
}
