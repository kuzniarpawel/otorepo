/* OTOREPO — JEDYNY wstrzykiwacz wiedzy klinicznej do generatora opisu (Blok 15).
 *
 * Ten sam wzorzec i ten sam powód, co w interp-deps / man-deps / followup-deps / lab-deps:
 * `opis-model.js` jest bezimportowy, więc CAŁA wiedza kliniczna wchodzi do niego argumentem.
 * Tutaj ta zasada waży najwięcej ze wszystkich bloków: generator opisu z własnymi napisami
 * byłby szóstym opisem tej samej wiedzy, a rozjazd trafiałby prosto do dokumentacji.
 *
 * ETYKIETY KLINICZNE WCHODZĄ GOTOWE, W JĘZYKU INTERFEJSU. Słowniki `CANALS`, `MANEUVERS` i `DIAG`
 * mają etykiety jako gettery z `t()`, więc pary {pl,en} po prostu nie istnieją w źródle — próba
 * ich odtworzenia w tym pliku byłaby kopią tłumaczenia. Model dostaje więc napis bieżącego języka
 * i zapisuje w raporcie, dla jakiego języka go policzył (`raport().jezyk`).
 *
 * Importuje WYŁĄCZNIE moduły czyste, więc wyrocznia `tools/opis-check.mjs` wciąga go w gołym
 * Node bez grafu renderera.
 */
import { t } from '../i18n.js';
import { MANEUVERS, CANALS, CANAL_OF, DIAG, sideN, variantLabels } from '../pose/maneuvers.js';
import { OBS_PROBY, OBS_POLA, OBS_FAZY_OPIS, ZNACZNIKI, POWODY_NIEWIARYGODNOSCI,
         instancjeStosowalne, wartoscInstancji, odciskObserwacji } from './obs-model.js';
import { TRIAGE_QUESTIONS, activeQuestions, triageResult } from './triage-model.js';
import { WYNIKI, TOLERANCJE, wynikKontroli, tolerancjaKontroli, podsumowanieSesji,
         bezDanychOsobowych } from './followup-model.js';
import { followupDeps } from './followup-deps.js';

const para = (o) => (o ? { pl: o.pl, en: o.en } : null);

/* Wartości pól obserwacji — jeden słownik dla etykiet I dla strażnika danych, żeby „dozwolone
   w zapisie" i „możliwe do opisania" nie mogły się rozjechać. */
const wartosciPola = (pole) => ((OBS_POLA[pole] || {}).wartosci || []).map(w => w.id);
const wartoscPola = (pole, v) => para(((OBS_POLA[pole] || {}).wartosci || []).find(w => w.id === v));

/* JĘZYK NIE JEST PARAMETREM. Etykiety kliniczne przychodzą z getterów `t()`, więc parametr
   dawałby DRUGIE źródło prawdy o języku i pierwsza rozbieżność dałaby opis w dwóch językach naraz
   („Kanał: Posterior canal"). Pytamy więc wprost tę samą warstwę, z której korzystają etykiety. */
export function opisDeps(stan) {
  const s = stan || {};
  const jezyk = t('pl', 'en');
  const fd = followupDeps();
  return {
    lang: () => jezyk,
    podsumowanie: (st) => podsumowanieSesji(st, fd),

    // --- kwalifikacja wstępna (Blok 6) ---
    pytaniaTriage: () => TRIAGE_QUESTIONS,
    aktywnePytania: (odp) => activeQuestions(odp).map(q => q.id),
    wynikTriage: (odp) => triageResult(odp),
    // Do opisu wchodzi TYTUŁ wyniku, a nie akapit zaleceń — patrz nagłówek opis-model.js.
    kategoriaTriage: (w) => (w && w.tytul ? para(w.tytul) : null),
    wartosciStreszczeniaTriage: () => {
      const zPytan = TRIAGE_QUESTIONS.flatMap(q => (q.opcje || []).map(o => o.v));
      // Streszczenie w `flow.triage` niesie też własne identyfikatory kategorii/ścieżki/pewności.
      return zPytan.concat(['czerwona', 'niepewna', 'tEVS', 'sEVS', 'AVS', 'pseudoAVS', 'diag', 'hints', 'wysoka', 'srednia', 'niska']);
    },

    // --- próby i opis oczopląsu (Blok 8) ---
    proby: () => OBS_PROBY,
    probaLabel: (p) => (DIAG[p] ? DIAG[p].name : p),
    fazaLabel: (p, fazaId) => para(OBS_FAZY_OPIS[fazaId]),
    rekord: (st, p) => (((st && st.obs) || {})[p]) || null,
    instancje: (p, wystapil) => instancjeStosowalne(p, wystapil),
    wartosc: (rek, klucz) => wartoscInstancji(rek, klucz),
    pytaniePola: (pole) => para((OBS_POLA[pole] || {}).pytanie),
    wartoscPola, wartosciPola,
    znaczniki: () => ZNACZNIKI.filter(z => z != null),
    powodNiewiar: (id) => para(POWODY_NIEWIARYGODNOSCI.find(p => p.id === id)),
    powodyNiewiarygodnosci: () => POWODY_NIEWIARYGODNOSCI.map(p => p.id),
    /* Odcisk opisu przeliczony z PODANEGO rekordu - straznik nie przyjmuje odcisku na slowo,
       a przy odtwarzaniu nie ma prawa pytac o stan biezacego przypadku (jest juz wyczyszczony). */
    odciskZRekordu: (rek) => (rek ? odciskObserwacji(rek) : null),

    // --- etykiety wniosków ---
    kanalLabel: (k) => (CANALS[k] ? CANALS[k].label : null),
    stronaLabel: (x) => (x === 'L' || x === 'P' ? sideN(x, 'mianN') : null),
    /* Etykieta mechanizmu ZALEŻY OD KANAŁU — w kanale poziomym niesie dodatkowo geo/apo.
       Bierzemy ją z `variantLabels`, a nie przepisujemy: dwa napisy na tę samą rzecz rozjechałyby
       opis badania z ekranem interpretacji. */
    mechanizmLabel: (v, kanal) => (variantLabels(kanal || 'posterior')[v] || null),
    manewrLabel: (k) => (MANEUVERS[k] ? MANEUVERS[k].label : null),
    wynikLabel: (id) => para(wynikKontroli(id)),
    tolerancjaLabel: (id) => para(tolerancjaKontroli(id)),
    czasySkadLabel: (x) => (x === 'planPodniesiony'
      ? { pl: 'z protokołu, podniesione do przewidywanego czasu oczopląsu', en: 'from the protocol, raised to the predicted nystagmus duration' }
      : x === 'plan' ? { pl: 'protokolarne', en: 'per protocol' } : null),

    // --- słowniki dla strażnika zapisu ---
    kanaly: () => Object.keys(CANALS),
    manewry: () => Object.keys(MANEUVERS),
    rozmiary: () => ['small', 'medium', 'big'],
    obserwacjeDix: () => ['post', 'ant'],
    canalOf: (k) => CANAL_OF[k] || null,
    wyniki: () => WYNIKI.map(w => w.id),
    tolerancje: () => TOLERANCJE.map(x => x.id),
    bezDanychWpisu: (wpis) => bezDanychOsobowych(wpis, fd),
  };
}
