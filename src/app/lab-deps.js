/* OTOREPO — JEDYNY wstrzykiwacz wiedzy silnika do modelu Laboratorium (Blok 14).
 *
 * Ten sam wzorzec i ten sam powód, co w `interp-deps.js`, `man-deps.js`, `hints-deps.js`
 * i `nauka-deps.js`: `lab-model.js` jest bezimportowy, więc metadane parametrów, scenariusze
 * referencyjne i obraz kliniczny musi dostać z zewnątrz. Wstrzykiwacz jest JEDEN i wspólny dla
 * aplikacji oraz dla wyroczni — dwa osobne dawałyby dwie definicje tej samej wiedzy.
 *
 * ═══ CO TU NIE WCHODZI ═══
 * Żadnej tabeli „parametr → skutek". Skutek zmiany jest MIERZONY (dwa odczyty kliniczne, przed
 * i po), a nie odczytywany z listy — lista byłaby drugim opisem fizjologii i rozjechałaby się
 * z silnikiem przy pierwszej zmianie równania.
 */
import { NeuroVOR } from '../engine/neuro-vor.js';

/* Płaski wykaz metadanych parametrów silnika (klucz, etykieta, zakres, krok, jednostka, wartość
   domyślna) — model Laboratorium dokłada do nich OPIS, ale nie rusza ani jednej liczby. */
export function specParametrow() {
  const out = [];
  for (const g of NeuroVOR.PARAM_SPEC) {
    for (const p of g.params) out.push({ ...p, grupa: g.group, tier: g.tier, pomocGrupy: g.help });
  }
  return out;
}
export function grupyParametrow() {
  return NeuroVOR.PARAM_SPEC.map(g => ({ grupa: g.group, tier: g.tier, pomoc: g.help, klucze: g.params.map(p => p.key) }));
}
export function specParametru(key) {
  for (const g of NeuroVOR.PARAM_SPEC) for (const p of g.params) if (p.key === key) return { ...p, grupa: g.group, tier: g.tier };
  return null;
}

export function labDeps() {
  return {
    spec: specParametru,
    wszystkieSpec: specParametrow,
    grupy: grupyParametrow,
    scenariusze: () => Object.keys(NeuroVOR.SCENARIOS),
    /* SCENARIUSZ ZAWSZE JAKO KOPIA. `NeuroVOR.SCENARIOS` to WSPÓŁDZIELONA STAŁA silnika: wydanie
       jej przez referencję znaczy, że jedno nieostrożne przypisanie w Laboratorium przestawia
       scenariusz referencyjny dla całej aplikacji — łącznie z przyciskiem „wróć do referencji",
       który wróciłby wtedy do wartości już zatrutej. Referencja, którą da się zmienić, nie jest
       referencją. */
    scenariusz: (key) => {
      const s = NeuroVOR.SCENARIOS[key];
      return s ? { label: s.label, side: s.side, params: { ...(s.params || {}) } } : null;
    },
    // Pacjent referencyjny scenariusza — liczony przez silnik, nigdy przepisywany do tego pliku.
    pacjentReferencyjny: (key) => NeuroVOR.scenario(key),
    pacjent: (nadpisania) => NeuroVOR.makePatient(nadpisania || {}),
    // Obraz kliniczny: to on jest MIARĄ skutku zmiany parametru.
    obraz: (pacjent) => NeuroVOR.clinicalReadout(pacjent),
  };
}
