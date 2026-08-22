/* OTOREPO — JEDYNY PISARZ STANU ATLASU (E6).
 *
 * ═══ DLACZEGO ATLAS MA WŁASNE POLA, A NIE DOKLEJA SIĘ DO `triage` ═══
 * Najkrótsza droga prowadziła przez pola kwalifikacji, które już istnieją — atlas i tak jest
 * z niej osiągalny. Byłby to defekt NIE DO SPRAWDZENIA: cała decyzja użytkownika z 2026-08-22
 * mówi, że ścieżka ostra pozostaje OGÓLNA, a jednostki szczegółowe mieszkają osobno. Gdyby atlas
 * pisał do `state.triage`, rozłączność zakresów byłaby deklaracją, której żadna wyrocznia nie
 * mogłaby zobaczyć — bo nie byłoby dwóch rzeczy, które można porównać.
 *
 * Osobne pola `atlas*` sprawiają, że rozłączność jest TWIERDZENIEM MIERZALNYM: wyrocznia bierze
 * odcisk `state.triage` przed wejściem do atlasu i po wyjściu i żąda, żeby był identyczny.
 * Ten sam wzorzec i ten sam powód, co przy Laboratorium (Blok 14).
 *
 * ═══ CZEGO TEN MODUŁ NIE ROBI ═══
 * Nie zmienia `mode`, `screen` ani niczego w powłoce — to należy do warstwy akcji. Nie czyta
 * i nie pisze pól klinicznych. Nie ma tu ani jednej funkcji, która przyjmowałaby wynik badania.
 */
import { ATLAS_KLUCZE, ZESPOL_IDS, STAN_SILNIKA_IDS } from './atlas-model.js';

/* Pola, które ten moduł ma prawo tknąć. Wyrocznia czyta tę listę WPROST — dopisanie tu pola
   klinicznego zapali bramkę, zamiast po cichu otworzyć furtkę. */
export const POLA_ATLAS = ['atlasWpis', 'atlasZespol', 'atlasZakres', 'atlasSzukaj', 'atlasSkad'];

/* Otwarcie wpisu. `skad` jest ZAPAMIĘTYWANE, bo powrót ma prowadzić tam, skąd użytkownik przyszedł:
   klinicysta, którego kwalifikacja odesłała do atlasu, wraca do swojego werdyktu, a nie na listę
   osiemnastu jednostek. To jest nawigacja, nie treść — wpis wygląda tak samo w obu wejściach. */
export function otworzWpis(stan, klucz, skad) {
  if (!ATLAS_KLUCZE.includes(klucz)) return false;
  stan.atlasWpis = klucz;
  if (skad === 'triage' || skad === null) stan.atlasSkad = skad;
  return true;
}

export function zamknijWpis(stan) {
  if (stan.atlasWpis == null) return false;
  stan.atlasWpis = null;
  return true;
}

/* FILTRY. Ponowne dotknięcie tej samej wartości ZDEJMUJE filtr — bez tego jedyną drogą do pełnej
   listy byłby przycisk „wyczyść", którego użytkownik może nie znaleźć, a lista wyglądałaby wtedy
   na kompletną, będąc przyciętą. Ta pułapka jest w tym projekcie realna: filtr biblioteki nauki
   ma dokładnie tę samą regułę i z tego samego powodu. */
export function ustawZespol(stan, z) {
  if (z != null && !ZESPOL_IDS.includes(z)) return false;
  stan.atlasZespol = (stan.atlasZespol === z) ? null : z;
  return true;
}

export function ustawZakres(stan, s) {
  if (s != null && !STAN_SILNIKA_IDS.includes(s)) return false;
  stan.atlasZakres = (stan.atlasZakres === s) ? null : s;
  return true;
}

/* Fraza wyszukiwania. Przycinana, bo spacja na końcu jest niewidoczna, a zmieniałaby wynik —
   i nikt by nie zrozumiał dlaczego. */
export function ustawSzukaj(stan, fraza) {
  const v = String(fraza == null ? '' : fraza).trim();
  if (stan.atlasSzukaj === v) return false;
  stan.atlasSzukaj = v;
  return true;
}

export function wyczyscFiltry(stan) {
  stan.atlasZespol = null;
  stan.atlasZakres = null;
  stan.atlasSzukaj = '';
  return true;
}

/* Czy cokolwiek zawęża listę. Ekran musi to wiedzieć, żeby powiedzieć „nic nie pasuje do filtru"
   zamiast „atlas jest pusty" — dwa różne zdania, z których jedno jest nieprawdą. */
export const filtrAktywny = (stan) => !!(stan.atlasZespol || stan.atlasZakres || (stan.atlasSzukaj || '').length);
