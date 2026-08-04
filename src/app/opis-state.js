/* OTOREPO — JEDYNY PISARZ STANU GENERATORA OPISU I ZAPISU SESJI (Blok 15).
 *
 * Ten sam podział, co w obs-state / followup-state / hints-state / nauka-state / lab-state:
 * model liczy, ten moduł zapisuje, ekran rysuje. Tutaj dochodzi jedna rzecz, której nie miał
 * żaden poprzedni blok — PIERWSZE POLE TEKSTOWE w całej aplikacji.
 *
 * ═══ DLACZEGO EDYCJA OPISU JEST ULOTNA ═══
 * Dokument wymaga: „Możliwa edycja tekstu przed skopiowaniem". Pole tekstowe jest jedynym
 * miejscem w aplikacji, w które da się wpisać nazwisko pacjenta — do Bloku 15 nie było ich zero
 * przez przypadek. Rozwiązanie nie polega na odmowie ani na filtrowaniu wpisanego tekstu
 * (filtr nazwisk jest niemożliwy i wygląda jak obietnica), tylko na TRWAŁOŚCI:
 *   • edycja żyje w `state.opisEdycja` i NIE jest nigdzie zapisywana,
 *   • zapis sesji bierze POLA PRZYPADKU, a nie tekst — więc edycja nie ma jak trafić do pamięci,
 *   • eksport ustrukturyzowany bierze te same pola i przechodzi przez strażnika,
 *   • wyjście z ekranu opisu edycję KASUJE (i ekran mówi o tym wprost, zanim ktoś zacznie pisać).
 * Wyrocznia mierzy to wprost: po wpisaniu znacznika w pole i zapisaniu sesji bajty w pamięci
 * przeglądarki nie mogą go zawierać.
 */
import { SEKCJE_IDS, domyslneSekcje, przelaczSekcje, rekordSesji, bezDanychOsobowychSesji,
         przywrocenie, jestCoZapisac, ULOTNE_PO_ODTWORZENIU } from './opis-model.js';
import { wczytajSesje, zapiszSesje, wyczyscSesje } from './opis-store.js';

/* Pola stanu tego bloku. Wypisane, żeby wyrocznia mogła sprawdzić, że generator opisu nie pisze
   do pól pacjenta ani symulatora — ta sama zapadka, co w Bloku 14. */
export const POLA_OPISU = ['opisSekcje', 'opisEdycja', 'opisSesje', 'opisBlad', 'opisKomunikat'];

export function ustawSekcje(state, id) {
  const r = przelaczSekcje(state.opisSekcje || domyslneSekcje(), id);
  state.opisSekcje = r.lista;
  return r;
}

/* Edycja jest ULOTNA — patrz nagłówek. Pusty napis zeruje pole, żeby „wyczyściłem i wyszedłem"
   nie zostawiało pustego łańcucha udającego wersję użytkownika. */
export function ustawEdycje(state, txt) {
  state.opisEdycja = (typeof txt === 'string' && txt.trim() !== '') ? txt : null;
}
export function wyczyscEdycje(state) { state.opisEdycja = null; }

/* Wczytanie listy RAZ, na boocie i po każdym zapisie — nigdy z renderu. */
export function wczytajSesjeStan(state, deps) {
  state.opisSesje = wczytajSesje(deps);
  return state.opisSesje;
}

export function zapiszSesjeStan(state, deps, teraz) {
  state.opisBlad = null; state.opisKomunikat = null;
  if (!jestCoZapisac(state)) { state.opisBlad = 'nicDoZapisania'; return { ok: false, powod: 'nicDoZapisania' }; }
  const lista = Array.isArray(state.opisSesje) ? state.opisSesje.slice() : [];
  const rek = rekordSesji(state, deps, teraz, lista);
  const straz = bezDanychOsobowychSesji(rek, deps);
  if (!straz.czysty) { state.opisBlad = 'odmowaStraznika'; return { ok: false, powod: 'odmowaStraznika', powody: straz.powody }; }
  lista.push(rek);
  const w = zapiszSesje(lista, deps);
  if (!w.ok) { state.opisBlad = w.powod; return { ok: false, powod: w.powod }; }
  state.opisSesje = w.wpisy;
  state.opisKomunikat = 'zapisano';
  return { ok: true, id: rek.id, powod: null };
}

/* ODTWORZENIE. Łatkę liczy model; tutaj tylko ją nakładamy — i zawsze z polami ulotnymi, więc
   odtworzona sesja NIGDY nie wznawia odliczania pozycji (patrz opis-model.POLA_ULOTNE). */
export function przywrocSesjeStan(state, id, deps) {
  state.opisBlad = null; state.opisKomunikat = null;
  const rek = (state.opisSesje || []).find(x => x && x.id === id);
  if (!rek) { state.opisBlad = 'brakWpisu'; return { ok: false, powod: 'brakWpisu' }; }
  const p = przywrocenie(rek, deps);
  if (!p.ok) { state.opisBlad = 'odmowaStraznika'; return { ok: false, powod: 'odmowaStraznika', powody: p.powody }; }
  Object.assign(state, p.latka);
  Object.assign(state, ULOTNE_PO_ODTWORZENIU);
  state.opisEdycja = null;                 // cudza sesja z zastanym tekstem byłaby najgorszym możliwym błędem
  state.opisKomunikat = 'przywrocono';
  return { ok: true, wymagaPlanu: p.wymagaPlanu, maneuverKey: rek.pola.maneuverKey || null, side: rek.pola.side || null };
}

export function usunSesjeStan(state, id, deps) {
  state.opisBlad = null; state.opisKomunikat = null;
  const lista = (state.opisSesje || []).filter(x => x && x.id !== id);
  const w = zapiszSesje(lista, deps);
  if (!w.ok) { state.opisBlad = w.powod; return { ok: false, powod: w.powod }; }
  state.opisSesje = w.wpisy;
  state.opisKomunikat = 'usunieto';
  return { ok: true };
}

/* KRYTERIUM ODBIORU NR 3 — „użytkownik może usunąć wszystkie zapisane sesje z ustawień".
   Kasujemy KLUCZ, a nie zawartość: pusta lista w pamięci wygląda jak zapis, a ma być tak, jakby
   nigdy nic nie zapisano. */
export function usunWszystkieStan(state) {
  state.opisBlad = null; state.opisKomunikat = null;
  const w = wyczyscSesje();
  if (!w.ok) { state.opisBlad = w.powod; return { ok: false, powod: w.powod }; }
  state.opisSesje = [];
  state.opisKomunikat = 'usunietoWszystkie';
  return { ok: true };
}

export const KOMUNIKATY_OPISU = {
  zapisano: { pl: 'Zapisano sesję w pamięci tej przeglądarki.', en: 'Session saved in this browser.' },
  przywrocono: { pl: 'Odtworzono zapisaną sesję. Licznik pozycji NIE został wznowiony.', en: 'Saved session restored. The position timer was NOT resumed.' },
  usunieto: { pl: 'Usunięto zapis.', en: 'The record was deleted.' },
  usunietoWszystkie: { pl: 'Usunięto wszystkie zapisane sesje.', en: 'All saved sessions were deleted.' },
  skopiowano: { pl: 'Skopiowano opis do schowka.', en: 'The description was copied to the clipboard.' },
  nieSkopiowano: { pl: 'Przeglądarka nie pozwoliła na kopiowanie — zaznacz tekst i skopiuj ręcznie.', en: 'The browser refused clipboard access — select the text and copy manually.' },
  wyeksportowano: { pl: 'Zapisano plik z ustrukturyzowanym zapisem sesji.', en: 'A file with the structured session record was saved.' },
};
export const BLEDY_OPISU = {
  brakWpisu: { pl: 'Tego zapisu już nie ma.', en: 'That record no longer exists.' },
};
export const SEKCJE_DOMYSLNE = SEKCJE_IDS.filter(id => id !== 'zastrzezenie');
