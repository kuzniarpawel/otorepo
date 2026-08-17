/* OTOREPO — JEDEN wstrzykiwacz wiedzy dla followup-model.js (Blok 11).
 *
 * Ten sam wzorzec i ten sam powód co man-deps.js / interp-deps.js: model kontroli jest CZYSTY
 * (bezimportowy), więc wiedza o manewrach i słownik powodów niewiarygodności muszą wejść do niego
 * argumentem. Wstrzykiwacz jest JEDEN i wspólny dla aplikacji i dla wyroczni.
 *
 * `powodyNiewiarygodnosci` bierzemy z obs-model.js, a NIE przepisujemy: słownik powstał w Bloku 8
 * na wyraźną decyzję kliniczną użytkownika (5 pozycji, dwie zakotwiczone w triage-model.js).
 * Drugi egzemplarz tej listy znaczyłby, że „niewiarygodne" w kroku „Oczopląs" i „niewiarygodne"
 * w kroku „Kontrola" mogą po cichu zacząć znaczyć co innego.
 *
 * Importuje WYŁĄCZNIE moduły czyste (pose/maneuvers.js, app/obs-model.js), więc wyrocznia
 * tools/followup-check.mjs wciąga go w gołym Node bez grafu renderera.
 */
import { MANEUVERS, CANALS, CANAL_OF } from '../pose/maneuvers.js';
import { POWODY_NIEWIARYGODNOSCI } from './obs-model.js';

export function followupDeps() {
  return {
    canalOf: (k) => CANAL_OF[k] || null,
    manewryKanalu: (kanal) => (CANALS[kanal] || {}).maneuvers || [],
    manewry: () => Object.keys(MANEUVERS),
    powodyNiewiarygodnosci: () => POWODY_NIEWIARYGODNOSCI,
  };
}
