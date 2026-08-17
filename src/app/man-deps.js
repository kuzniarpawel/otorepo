/* OTOREPO — JEDEN wstrzykiwacz wiedzy klinicznej dla man-model.js (Blok 10).
 *
 * Ten sam wzorzec i ten sam powód co interp-deps.js: model manewru jest CZYSTY (bezimportowy),
 * więc wiedza o manewrach musi do niego wejść argumentem. Wstrzykiwacz jest JEDEN i wspólny dla
 * aplikacji i dla wyroczni — dwa osobne dawałyby dwie definicje tej samej wiedzy i rozjechałyby
 * się przy pierwszej zmianie parametru.
 *
 * Importuje WYŁĄCZNIE moduły czyste (pose/maneuvers.js), więc tools/man-check.mjs wciąga go
 * w gołym Node bez grafu renderera.
 */
import { MANEUVERS, CANALS, DIAG, CANAL_OF, recommend,
         computeManSim, manFractions, guideNysSeconds, sizedSeconds } from '../pose/maneuvers.js';

export function manDeps() {
  return {
    recommend,
    canalOf: (k) => CANAL_OF[k] || null,
    manewryKanalu: (kanal) => (CANALS[kanal] || {}).maneuvers || [],
    // Przypisanie próba→kanał czytamy z DIAG, czyli z JEDYNEGO miejsca, w którym ono istnieje.
    kanalProby: (k) => (DIAG[k] || {}).canal || null,
    proby: () => Object.keys(DIAG),
    mechanizmManewru: (k) => {
      // Mechanizm manewru jest cechą PLANU (plan.mechanism), a nie osobnej tabeli — bierzemy go
      // z wygenerowanego planu, żeby nie powstało drugie źródło prawdy o tym, co leczy kupulolitiazę.
      try { return (MANEUVERS[k].gen('P').mechanism) || 'canalo'; } catch (e) { return null; }
    },
    symulacja: (plan, rozmiar) => computeManSim(plan, rozmiar || 'medium'),
    harmonogram: (man, plan) => manFractions(man, plan),
    sekundyOczoplasu: (plan, man, i, rozmiar) => guideNysSeconds(plan, man, i, rozmiar || 'medium'),
    sizedSeconds,
  };
}
