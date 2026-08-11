/* OTOREPO — JEDEN wstrzykiwacz wiedzy klinicznej dla flow-model.js.
 *
 * Ten sam wzorzec i ten sam powód co interp-deps.js / man-deps.js: model przebiegu jest CZYSTY
 * i bezimportowy (wyrocznia tools/flow-check.mjs uruchamia go w gołym Node i pilnuje tego skanem
 * źródła), więc wiedza o manewrach musi do niego wejść argumentem.
 *
 * ═══ DLACZEGO OSOBNY MODUŁ, A NIE LITERAŁ W main.js ═══
 * Dotąd ten zestaw zależności istniał w JEDNYM miejscu — w wywołaniu `mountFlow(...)` w main.js —
 * i był dostępny wyłącznie powłoce. Karta „ostatnia sesja" na ekranie startowym liczy postęp z
 * `flowStatuses()`, czyli potrzebuje DOKŁADNIE tych samych zależności. Przepisanie ich do
 * renderera dałoby drugą definicję tej samej wiedzy klinicznej: rozjazd między nimi znaczyłby, że
 * kropki postępu na ekranie startowym pokazują inny stan niż pasek przebiegu dwa kliknięcia dalej
 * — i obie strony świeciłyby na zielono. Kopii nie da się upilnować komentarzem.
 *
 * Importuje wyłącznie moduły czyste (pose/maneuvers.js, app/man-model.js, app/man-deps.js), więc
 * nie tworzy cyklu z rendererem ani z powłoką.
 */
import { DIAG, CANAL_OF, recommend } from '../pose/maneuvers.js';
import { probaKanalu, sygnalKonwersji } from './man-model.js';
import { manDeps } from './man-deps.js';

export function flowDeps() {
  return {
    recommend,
    canalOf: (k) => CANAL_OF[k] || null,
    testCanal: (k) => (DIAG[k] || {}).canal || null,
    // Most kanał→próba dla ścieżki BEZ próby (tryb ekspercki, Blok 10). Bez niego
    // maneuverAgreement degraduje do 'nieznana', czyli do stanu sprzed Bloku 10.
    probaKanalu: (kanal) => probaKanalu(kanal, manDeps()),
    konwersja: (s) => sygnalKonwersji(s, manDeps()),
  };
}
