// OTOREPO — most SPV (ocena II, D6/V13): adapter jednostek ξ(t) → SPV(t) [°/s] na WSPÓLNEJ osi obu
// silników. BEZ FIZYKI — czyste przeliczenie; warstwa NAD silnikami (graf acykliczny: bridge →
// {vestibular, neuro-vor} → vestibular), więc vestibular.js zostaje bez importów, a SPV_MAX ma
// JEDNO źródło (NeuroVOR.SPV_MAX=30 °/s — pełna asymetria toniczna pary HC; trzecia żywa kopia
// literału to udokumentowany tryb awarii, patrz svg-screens „||12").
//
// KONTRAKT ŚLADU (przybity dla gałęzi feature/vog-camera — nałożenie modelu na ślad z kamery):
//   spvTrace(sim, canal, side) -> [{t, spvH, spvVert, spvTors}], siatka czasowa 1:1 z sim (dt symulacji).
//   t        — SEKUNDY od startu prowokacji (jak w sim; kamera niesie ms + kotwicę kroku — mapuje VOG).
//   spvH/spvVert/spvTors — SPV ZE ZNAKIEM KIERUNKU FAZY SZYBKIEJ w ramce ANATOMICZNEJ pacjenta
//     (+spvH ku uchu prawemu, +spvVert upbeat, +spvTors górne bieguny ku prawemu — konwencja VNG
//     „right-beating dodatni"); moduł = prędkość fazy WOLNEJ [°/s]. Lustro ekranu (camRx) dopiero
//     w renderze — jak mapVog po stronie kamery. Nazwy spv* (słownik NeuroVOR: spvVert/spvTors),
//     NIE gołe h/v/t — te w całym repo są bezwymiarowymi składowymi kierunku; `tor`/`t` obok czasu
//     kolidowałyby w płaskim rekordzie ({t,h,v,t} ze spec = niepoprawny obiekt, duplikat klucza).
//   Kamera (tor Research, experimental/spv): [{t: ms, x, y, conf}] → estymaty segmentowe spvX/spvY
//     w jednostkach ZNORMALIZOWANYCH obrazu (kalibracja j/s→°/s świadomie poza zakresem do near-IR)
//     i BEZ torsji — nałożenie do tego czasu deklarowane jako KSZTAŁT+TIMING, nie amplituda;
//     dla PC-BPPV torsja jest składową DOMINUJĄCĄ modelu (quickPhase t=1.0) — kamera zobaczy ~0.81 wektora.
//
// SKALA I ASYMETRIA (rozstrzygnięcia D6 z sondami):
//   xiEff = ξ≥0 ? ξ : ξ·EWALD_INHIB — asymetria Ewalda II ZOSTAJE (to fizjologia TRANSDUKCJI —
//     wyciszanie aferentu przy hamowaniu, ten sam mechanizm co afferent() z podłogą 0 Hz w NeuroVOR;
//     kamera ją WIDZI: odwrócenie po Dixie 11.6 °/s, nie fałszywe 25.7; asymetria Rolla 23.5/8.9
//     [V25 — poza Rolla z nachylenia kanału; do V24 20.9/8.0, kanał tylny bez zmian];
//     „chore w dole słabsze" kupulo istnieje tylko z nią). ZNAK zostaje — to nie rektyfikacja percepcyjna.
//   min(1,·) NIE wchodzi (klamra renderowa, nie fizyka): ξ>1 jest osiągalne (Semont/Bascule 1.05;
//     size big ×2.46) → ślad >30 °/s WYSTĄPI i jest zamierzony; ślad i animacja celowo rozjeżdżają
//     się powyżej ξ=1 — nie „naprawiać" jednego względem drugiego.
//   ξ=1 ≡ SPV_MAX to WYBÓR KALIBRACYJNY (awans konwencji renderowej; ξ nie ma warstwy Hz), zapisany
//     jak CUP_WEAK: sanity — szczyt Rolla geo 0.784→~23.5 °/s [V25; do V24 0.696→~21] (pasmo
//     publikowane 20–70), Dix 0.872→~26 (kanał tylny nietknięty przez V25).
//   Oś pionowa: wspólne są JEDNOSTKI, nie sufity — NeuroVOR tłumi pion wagą VERT_W=0.5 (imbalans
//     toniczny pary, sufit ~15 °/s), BPPV liczy z wychylenia osklepka (do ~24 °/s przy ξ=1);
//     VERT_W świadomie NIE wchodzi do BPPV (inny mechanizm).
import { Vestibular } from './vestibular.js';
import { NeuroVOR } from './neuro-vor.js';

// próg widoczności klinicznej w ξ (gałąź POBUDZENIOWA): ξ ≥ XI_VIS ⇔ |SPV| ≥ VIS_THRESH (2 °/s).
// Dla gałęzi hamującej próg w ξ to XI_VIS/EWALD_INHIB ≈ 0.148 (asymetria transdukcji) — konsument
// śladu porównuje po prostu |spv*| ≥ NeuroVOR.VIS_THRESH, bo ślad JEST w °/s. Trzeci literał progu
// (obok nystagmusPhase 0.05 i XI_CARD 0.10 — różne skale, pasmo nazwane w engine_doc) NIE powstaje:
// to pochodna dwóch stałych publicznych. Unifikacja progów = osobna decyzja z rebaseline.
// D8/V22: odczyt LENIWY (funkcja), nie eager const — od kiedy svg-screens importuje most (pierwsza
// konsumpcja UI śladu), spv-bridge żyje wewnątrz cyklu modułów (neuro-vor→i18n→state→actions→
// svg-screens→spv-bridge→neuro-vor) i jego ciało potrafi wykonać się PRZED ciałem neuro-vor
// (esbuild IIFE, post-order cyklu) — jedyny zapis na poziomie modułu czytał wtedy undefined.
// Wartość i jedno źródło stałych BEZ ZMIAN: VIS_THRESH/SPV_MAX z NeuroVOR w chwili pierwszego użycia.
let _xiVis = null;
function xiVis(){ return _xiVis != null ? _xiVis : (_xiVis = NeuroVOR.VIS_THRESH / NeuroVOR.SPV_MAX); }

function spvTrace(sim, canal, side){
  if(!Array.isArray(sim) || !sim.length) throw new TypeError("spvTrace: sim musi być NIEPUSTĄ tablicą próbek {t, xi} (wyjście simulateCanalith/Cupulolith/LightCupula)");
  const q0 = Vestibular.quickPhase(canal, side);            // waliduje canal/side (reqCanal) za darmo
  const out = new Array(sim.length);
  for(let i=0;i<sim.length;i++){
    const s = sim[i];
    if(!s || typeof s.t!=="number" || !isFinite(s.t) || typeof s.xi!=="number" || !isFinite(s.xi))
      throw new TypeError("spvTrace: próbka ["+i+"] musi mieć skończone {t, xi} (podano "+JSON.stringify(s)+")");
    const xiEff = s.xi >= 0 ? s.xi : s.xi * Vestibular.EWALD_INHIB;
    const A = NeuroVOR.SPV_MAX * xiEff;
    out[i] = { t: s.t, spvH: A*q0.h, spvVert: A*q0.v, spvTors: A*q0.t };
  }
  return out;
}

export { spvTrace, xiVis };
