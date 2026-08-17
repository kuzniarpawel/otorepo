/* OTOREPO — JEDYNY wstrzykiwacz wiedzy klinicznej do modelu nauki (Blok 13).
 *
 * ═══ POWÓD ISTNIENIA TEGO PLIKU ═══
 * Biblioteka przypadków dydaktycznych to najbardziej naturalne miejsce, w którym ta aplikacja
 * mogłaby zacząć kłamać. Wystarczyłoby wpisać do przypadku pole `rozpoznanie: 'kanał tylny,
 * kanalolitiaza, prawy'` — i od tej chwili istniałby SZÓSTY opis tej samej wiedzy klinicznej
 * (po silniku, `baranyClassify`, `interp-model`, `man-model` i `followup-model`), który przy
 * pierwszej zmianie parametru rozjechałby się z resztą po cichu. Lekcja uczyłaby wtedy czegoś,
 * czego aplikacja obok już nie robi.
 *
 * Dlatego przypadek NIE NIESIE KLUCZA ODPOWIEDZI. Niesie OBSERWACJĘ (w słowniku `obs-model`)
 * i wywiad (w słowniku `triage-model`), a klucz do każdego z sześciu etapów lekcji LICZY ten sam
 * model, którego używa ścieżka kliniczna. Zmiana w silniku zmienia lekcję albo zapala wyrocznię —
 * trzeciej możliwości nie ma.
 *
 * ═══ CO TU NIE WCHODZI ═══
 * Napisy. Model nauki zwraca IDENTYFIKATORY (klucz cechy, id flagi, id manewru, id akcji), a ekran
 * rozwiązuje je w prawdziwych słownikach (`OBS_POLA`, `FLAGI`, `AKCJE`, `MANEUVERS`). Gdyby napisy
 * przechodziły tędy, powstałaby ich druga kopia — dokładnie to, przed czym broni ten plik.
 *
 * Importuje wyłącznie moduły, które tools/nauka-check.mjs wciąga w gołym Node.
 */
import { interpretuj, sugerowaneProby, nietypowy, kandydatury, odciskPredykcji } from './interp-model.js';
import { interpDeps, fazaKandydatury } from './interp-deps.js';
import { poparcie, flagi, spojnosc, geoApo, wartoscInstancji, OBS_FAZY, OBS_PROBY } from './obs-model.js';
import { doborEkspercki } from './man-model.js';
import { manDeps } from './man-deps.js';
import { REGULY_KROKOW, wynikKontroli, WYNIK_IDS, AKCJA_IDS, ZAWSZE_DOSTEPNE } from './followup-model.js';
import { triageResult, triageComplete } from './triage-model.js';
import { MANEUVERS, CANALS, recommend, otherSide } from '../pose/maneuvers.js';

/* ═══ PACJENT ZERO ═══
   Modele kliniczne przyjmują OBIEKT STANU. Najkrótsza droga do zbudowania go dla lekcji byłaby
   `{...state, obs: przypadek.obs}` — i to jest defekt, który ten literał zamyka raz na zawsze.
   Przy takim spreadzie przeżywa KAŻDE pole, którego przypadek nie deklaruje: klinicysta, który
   przed chwilą ustawił `side='L'`, `variant='cupulo'` i przełączył kartę na `diagCentral=true`,
   wnosiłby te wartości do lekcji, a klucz odpowiedzi liczyłby się dla jego pacjenta, nie dla
   przypadku. Stan lekcji powstaje więc WYŁĄCZNIE z tego literału i z przypadku; `nauka-deps.js`
   ani `nauka-model.js` nie mają prawa zaimportować `state.js` (bramka w wyroczni). */
export const PACJENT_ZERO = Object.freeze({
  obs: null, triage: null,
  diagCentral: false, side: null, sideZrodlo: null, variant: null, variantZrodlo: null,
  canal: null, testKey: null, dixObs: null, maneuverKey: null, size: 'medium', dixRep: 0,
});

/* PRZYJĘTA PODSTAWA INTERPRETACJI PRZY DIX-HALLPIKE'U.
   `poparcie(rekord, 'dix', dixObs)` wymaga trzeciego argumentu: tego, co klinicysta ŚWIADOMIE
   przyjął za podstawę (kanał tylny czy przedni). W lekcji nikt jeszcze niczego nie przyjął, więc
   przekazanie `null` dałoby `nieprzyjeta` i każdy przypadek Dix-Hallpike'a wyglądałby jak brak
   podstaw do wniosku. Bierzemy więc podstawę Z SAMEGO REKORDU — czyli pytamy „co powiedziałaby
   ścieżka kliniczna, gdyby klinicysta przyjął to, co sam opisał". To jest jedyne uczciwe
   odczytanie: nie dokłada wiedzy, tylko usuwa krok interfejsu, którego w lekcji nie ma. */
export function podstawaZRekordu(rekord) {
  if (!rekord || rekord.proba !== 'dix') return null;
  const pion = wartoscInstancji(rekord, 'pion#jedyna');
  return pion === 'm1' ? 'ant' : pion === 'p1' ? 'post' : null;
}

/* ODCISK OBSERWACJI w tej samej postaci, w jakiej `odciskPredykcji` liczy odcisk PREDYKCJI.
   Bez wspólnej postaci etap „przewidywanie" nie miałby jak porównać tego, co uczeń wybrał,
   z tym, co naprawdę zobaczono — a doklejenie drugiego formatu byłoby miejscem, w którym
   znak mógłby się cicho odwrócić.
   Relację nasilenia czytamy z pola `nasilenie`, które opisuje PIERWSZĄ fazę wobec drugiej —
   ta sama konwencja, co w `werdyktCechy` (`ta = fazaId || fazy[0]`). Przy próbach jednofazowych
   relacji nie ma ('-'), a przy bow&leanie model przewiduje siły równe ('rowne'). */
const ZNAK = { p1: 1, m1: -1, zero: 0 };
const REL_Z_NASILENIA = { silniejsza: 'pierwsza', slabsza: 'druga', porownywalne: 'rowne' };
export function odciskObserwacji(rekord, proba) {
  const fazy = OBS_FAZY[proba] || [];
  if (!fazy.length) return null;
  const czesci = [];
  for (const f of fazy) {
    const h = ZNAK[wartoscInstancji(rekord, `poziom#${f}`)];
    const v = ZNAK[wartoscInstancji(rekord, `pion#${f}`)];
    const t = ZNAK[wartoscInstancji(rekord, `torsja#${f}`)];
    if (h === undefined || v === undefined || t === undefined) return null;   // opis niepełny → brak odcisku
    czesci.push([h, v, t].join(','));
  }
  let rel = '-';
  if (fazy.length === 2) {
    if (proba === 'roll') {
      rel = REL_Z_NASILENIA[wartoscInstancji(rekord, 'nasilenie')] || null;
      if (!rel) return null;
    } else {
      rel = 'rowne';                                   // bow&lean: model przewiduje siły równe
    }
  }
  return `${czesci.join('|')}#${rel}`;
}

/* UCHO FAKTYCZNIE BADANE przez daną kandydaturę.
   Zwykle jest to `kand.side`, ale przy Dix-Hallpike'u i kanale PRZEDNIM ucho badane jest
   PRZECIWNE do chorego — to nie jest nowa reguła, tylko odbicie gałęzi, którą `fazaKandydatury`
   ma w tym samym pliku obok (interp-deps.js: `const badana = otherSide(side)`), wraz z jej
   pomiarem. Bez tej jednej linijki etap „przewidywanie" nie odróżniłby ucha badanego od chorego,
   a to jest jedyna pomyłka, która wysyła klinicystę na manewr niewłaściwego ucha. */
export function uchoBadane(proba, kand) {
  return (proba === 'dix' && kand.canal === 'anterior') ? otherSide(kand.side) : kand.side;
}

/* WZORCE, JAKIE DANA PRÓBA W OGÓLE POTRAFI DAĆ — pogrupowane kandydatury o identycznym odcisku.
   Zmierzone: dix daje 3 różne wzorce, roll 4, bow&lean 2, a headhang JEDEN dla wszystkich czterech
   kandydatur. To ostatnie jest treścią kliniczną, nie ubóstwem danych: strony kanału przedniego
   nie da się wyprowadzić z kierunku i lekcja ma to pokazać, a nie obejść.

   `strona` (ucho, do którego wykonano próbę) ZAWĘŻA zbiór. Próba obustronna — rolka i bow&lean —
   nie ma strony i wtedy `strona` jest null. */
export function wzorceProby(proba, iD, strona) {
  const d = iD || interpDeps({ obs: {} });
  const mapa = new Map();
  for (const k of kandydatury(proba)) {
    if (strona && uchoBadane(proba, k) !== strona) continue;
    const o = odciskPredykcji(k, proba, d);
    if (!mapa.has(o)) {
      const fazy = (OBS_FAZY[proba] || []).map(f => {
        const p = fazaKandydatury(proba, f, k);
        const zn = (x) => (x == null ? null : x > 0.05 ? 'p1' : x < -0.05 ? 'm1' : 'zero');
        return p ? { fazaId: f, poziom: zn(p.h), pion: zn(p.v), torsja: zn(p.t) } : { fazaId: f, poziom: null, pion: null, torsja: null };
      });
      mapa.set(o, { odcisk: o, fazy, relacja: o.slice(o.indexOf('#') + 1), kandydatury: [] });
    }
    mapa.get(o).kandydatury.push({ canal: k.canal, side: k.side, variant: k.variant });
  }
  return [...mapa.values()];
}

export function naukaDeps(przypadek) {
  // `stan` to MINIMALNY, SZTUCZNY stan pacjenta: PACJENT_ZERO plus dwa pola z przypadku i nic
  // więcej. Bez tego `nietypowy()` (liczony po WSZYSTKICH próbach sesji) czytałby rekordy
  // prawdziwego pacjenta i lekcja zmieniałaby treść w zależności od tego, kogo klinicysta bada.
  const stan = { ...PACJENT_ZERO, obs: (przypadek && przypadek.obs) || {}, triage: (przypadek && przypadek.triage) || {} };
  const iD = interpDeps(stan);
  const mD = manDeps();
  return {
    proby: () => Object.keys(stan.obs),
    wszystkieProby: () => OBS_PROBY.slice(),
    rekord: (proba) => stan.obs[proba] || null,
    fazyProby: (proba) => (OBS_FAZY[proba] || []).slice(),
    kandydatury: (proba) => kandydatury(proba),
    uchoBadane,
    wzorceProby: (proba, strona) => wzorceProby(proba, iD, strona),
    odciskObserwacji,
    interpretuj: (rekord, proba) => interpretuj(rekord, proba, iD),
    poparcie: (rekord, proba) => poparcie(rekord, proba, podstawaZRekordu(rekord)),
    nietypowy: () => nietypowy(stan, iD),
    flagi: (rekord) => flagi(rekord),
    spojnosc: (rekord) => spojnosc(rekord),
    geoApo: (rekord) => geoApo(rekord),
    sugerowaneProby: (pozostale, proba) => sugerowaneProby(pozostale, proba, iD),
    dobor: (kanal, mechanizm) => doborEkspercki(kanal, mechanizm, mD),
    /* KLUCZ MANEWRU LICZONY Z PRÓBY, KTÓRĄ PRZYPADEK NAPRAWDĘ WYKONAŁ.
       `doborEkspercki` wchodzi przez `probaKanalu`, a ta bierze PIERWSZĄ próbę kanału — dla kanału
       poziomego zawsze `roll`, także wtedy, gdy przypadek stoi na bow&leanie. Dziś zalecenie jest
       to samo, więc różnicy nie widać; w dniu, w którym `recommend` dla bow&leana zacznie się
       różnić, lekcja oceniałaby odpowiedź względem próby, której w przypadku nie było. */
    doborZProby: (proba, mechanizm) => {
      const rec = recommend(proba, mechanizm);
      if (!rec || !rec.primary) return null;
      const alternatywy = (rec.alts || []).filter(k => k !== rec.primary);
      return { proba, pierwszy: rec.primary, alternatywy, uwaga: rec.note || null };
    },
    wszystkieManewry: () => Object.keys(MANEUVERS),
    manewryKanalu: (kanal) => ((CANALS[kanal] || {}).maneuvers || []).slice(),
    akcje: () => AKCJA_IDS.slice(),
    zawszeDostepne: () => ZAWSZE_DOSTEPNE.slice(),
    regula: (wynikId) => REGULY_KROKOW[wynikId] || null,
    wynikKontroli,
    wynikiKontroli: () => WYNIK_IDS.slice(),
    triage: () => triageResult(stan.triage),
    triageKompletny: () => triageComplete(stan.triage),
  };
}
