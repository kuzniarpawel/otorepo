/* OTOREPO — JEDYNY PISARZ STANU LABORATORIUM (Blok 14).
 *
 * ═══ DLACZEGO LABORATORIUM MA WŁASNE POLA, A NIE `hintsCustom` ═══
 * Najkrótsza droga do zbudowania tego bloku prowadziła przez pola matematycznego pacjenta, które
 * już istnieją. Byłby to defekt nie do sprawdzenia: kryterium odbioru nr 1 mówi, że Laboratorium
 * nie jest potrzebne do zakończenia podstawowej diagnostyki, a gdyby eksperyment pisał do
 * `hintsCustom`, przeciek siedziałby w MODELU DANYCH i żadna wyrocznia nie mogłaby go zobaczyć —
 * bo nie byłoby dwóch rzeczy, które można porównać. Osobne pola `lab*` sprawiają, że separacja
 * jest twierdzeniem, które da się zmierzyć odciskiem stanu przed eksperymentem i po nim.
 *
 * Ten moduł nie importuje żadnego innego pisarza i nie dotyka pól pacjenta ani symulatora.
 */
import { PARAMETRY, EKSPERYMENT_IDS, eksperyment, czyStanowisko, skutekZmiany } from './lab-model.js';

/* Pola, które ten moduł ma prawo tknąć. Wyrocznia czyta tę listę WPROST — dopisanie tu pola
   klinicznego zapali bramkę, zamiast po cichu otworzyć furtkę. */
export const POLA_LAB = ['labEksperyment', 'labStanowisko', 'labA', 'labB',
                         'labPorownanie', 'labOstatniaZmiana', 'labParametr'];

const kluczStanowiska = (id) => (id === 'B' ? 'labB' : 'labA');

/* Otwarcie eksperymentu USTAWIA OBA STANOWISKA na jego scenariusz referencyjny. To nie jest
   wygoda: „ustawienia początkowe" z dokumentu muszą istnieć, zanim ktokolwiek ruszy suwakiem,
   inaczej „reset do referencji" wracałby do stanu, którego użytkownik nigdy nie widział. */
export function otworzEksperyment(stan, id, deps) {
  const e = eksperyment(id);
  if (!e) return false;
  const ref = deps.pacjentReferencyjny(e.referencja);
  stan.labEksperyment = id;
  stan.labStanowisko = 'A';
  stan.labA = { ...ref };
  stan.labB = { ...ref };
  stan.labPorownanie = false;
  stan.labOstatniaZmiana = null;
  stan.labParametr = null;
  return true;
}

export function zamknijEksperyment(stan) {
  stan.labEksperyment = null;
  stan.labOstatniaZmiana = null;
  stan.labParametr = null;
  stan.labPorownanie = false;
}

export function ustawStanowisko(stan, id) {
  if (!czyStanowisko(id)) return false;
  stan.labStanowisko = id;
  stan.labOstatniaZmiana = null;   // pomiar dotyczy stanowiska, na którym padł — nie przenosi się
  return true;
}

export function przelaczPorownanie(stan) { stan.labPorownanie = !stan.labPorownanie; return true; }

/* ZMIANA PARAMETRU. Razem z zapisem powstaje POMIAR: obraz kliniczny przed i po. To jest całe
   kryterium odbioru nr 3 — bez tego pomiaru suwak przesuwa liczbę i nic więcej. */
export function ustawParametr(stan, key, wartosc, deps) {
  if (!PARAMETRY[key]) return false;
  const pole = kluczStanowiska(stan.labStanowisko);
  const biezacy = stan[pole];
  if (!biezacy) return false;
  const spec = deps.spec(key);
  const v = (spec && spec.type === 'select') ? (wartosc === 'null' || wartosc == null ? null : wartosc) : +wartosc;
  if (JSON.stringify(biezacy[key]) === JSON.stringify(v)) return false;   // brak zmiany = brak pomiaru
  const przed = deps.obraz(biezacy);
  const nowy = deps.pacjent({ ...biezacy, [key]: v });
  stan[pole] = nowy;
  stan.labOstatniaZmiana = skutekZmiany(przed, deps.obraz(nowy), key);
  return true;
}

/* RESET. Wraca do scenariusza referencyjnego TEGO eksperymentu i kasuje pomiar — po powrocie
   do punktu wyjścia nie ma „ostatniej zmiany", którą można by pokazać. */
export function resetDoReferencji(stan, deps) {
  const e = eksperyment(stan.labEksperyment);
  if (!e) return false;
  stan[kluczStanowiska(stan.labStanowisko)] = { ...deps.pacjentReferencyjny(e.referencja) };
  stan.labOstatniaZmiana = null;
  return true;
}

export function rozwinParametr(stan, key) {
  if (key != null && !PARAMETRY[key]) return false;
  stan.labParametr = (stan.labParametr === key) ? null : key;   // ponowne dotknięcie zwija
  return true;
}

export const pacjentStanowiska = (stan, id) => stan[kluczStanowiska(id || stan.labStanowisko)] || null;
