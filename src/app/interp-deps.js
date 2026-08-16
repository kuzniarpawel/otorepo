/* OTOREPO — JEDYNY wstrzykiwacz wiedzy klinicznej do modelu interpretacji (Blok 9).
 *
 * `interp-model.js` jest bezimportowy (wzorzec inject-for-purity), więc predykcje silnika,
 * wzorce dynamiki i zasady kwarantanny musi dostać z zewnątrz. Ten plik jest tym „zewnątrz" —
 * JEDEN raz, dla aplikacji i dla wyroczni naraz.
 *
 * ═══ DLACZEGO OSOBNY MODUŁ, A NIE FUNKCJA W RENDERERZE ═══
 * Pierwsza wersja miała dwie kopie tego samego wstrzykiwacza: jedną w `svg-screens.js`, drugą
 * w `tools/interp-check.mjs`. Rozjazd między nimi znaczyłby, że wyrocznia bada INNY model niż
 * aplikacja — czyli dokładnie ten tryb awarii, przed którym wyrocznia ma chronić, tyle że
 * niewidoczny, bo obie strony świecą na zielono. Kopii nie da się upilnować komentarzem.
 *
 * `stan` wchodzi ARGUMENTEM (nie importem `state.js`), bo `state.js` wciąga `actions.js`, a ten
 * cały graf renderera — wyrocznia w gołym Node nie miałaby jak tego zaimportować.
 */
import { DIAG, nysFromGeom, stepHeadQ } from '../pose/maneuvers.js';
import { OBS_FAZY, OBS_PROBY, WZORCE_DYNAMIKI, fazaDIAG, wartoscInstancji, spojnosc, flagi } from './obs-model.js';

/* Predykcja modelu dla JEDNEJ kandydatury w JEDNEJ fazie, w konwencji `Vestibular.quickPhase`
   (+1 = ku PRAWEMU uchu pacjenta). `s` to siła — niesie stronę przy rollu, gdzie kierunek jej
   nie niesie. */
/* `scen` = SCENARIUSZ HISTORII POZYCYJNEJ (BLT_HISTORY, ocena II V5). Domyślnie `undefined`, co
   w silniku znaczy „textbook" — czyli ścieżka bez scenariusza jest dokładnie dotychczasowa.
   PO CO TO TU: od chwili, gdy ekran pozwala scenariusz PRZEŁĄCZYĆ, predykcja interpretacji musi
   iść z tego samego stanu, co strzałka i napis na karcie. Inaczej wododział R8 rozjeżdża wnioski
   z obrazem: karta rysuje kierunek dla „po nocy na boku chorym", a interpretacja eliminuje
   kandydatury wg „textbook" — i żadna z dwóch stron ekranu nie wie, że kłamie ta druga. */
export function fazaKandydatury(proba, fazaId, kand, scen) {
  const { side, variant } = kand;
  try {
    /* KANDYDATURA KANAŁU PRZEDNIEGO PRZY DIX-HALLPIKE'U NIE JEST W `DIAG.dix.phases` — aplikacja
       buduje ją osobno (renderDiag, gałąź antMode) przez nysFromGeom, bo ułożenie głowy jest to
       samo, a inny jest tylko zaobserwowany oczopląs. Bez tego wyjątku kandydatura przednia
       dostawała predykcję kanału TYLNEGO, obie przechodziły identycznie i kanał wychodził null.
       ZMIERZONE PO POPRAWCE (odciski Dixa): posterior/P v+0.81 t+1.00 · posterior/L v+0.81 t−1.00 ·
       anterior/P v−1.00 t+0.74 · anterior/L v−1.00 t−0.74 — PION daje kanał, TORSJA stronę. */
    if (proba === 'dix' && kand.canal === 'anterior') {
      /* STRONA NIE WYNIKA Z POZY — POPRAWKA 2026-08-16 (po zdjęciu maski anterior.t w V26).
         DO TĄD stało tu `otherSide(side)`: kandydatura przednia była liczona w pozie ucha
         PRZECIWNEGO, „bo płaszczyzna LARP/RALP". To rozumowanie o PARZE WSPÓŁPŁASZCZYZNOWEJ —
         rządzi vHIT-em i odruchem z obrotu głowy, gdzie napęd daje wspólny przepływ endolimfy, więc
         partner dostaje znak przeciwny. W BPPV napęd daje WŁASNY złóg jednego kanału i nic się na
         partnera nie przenosi. Maska t=0 kryła skutek: kandydatura odpadała NA TORSJI. Po V26
         wychodził z tego UPBEAT + torsja ku uchu ZDROWEMU — obraz, którego klinika nie opisuje.

         CO MÓWI KWERENDA (ta sama, która kazała zdjąć maskę):
           [H33] Bertholon 2002 — w grupie idiopatycznej prowokacja OBUSTRONNA w Dix-Hallpike u 9/12,
                 wyłącznie w zwisie prostym u 2/12 ⇒ STRONA DIXA NIE IDENTYFIKUJE UCHA;
           [H32] Garaycochea 2022 — stronę niesie TORSJA (górny biegun ku uchu CHOREMU), lecz była
                 jednoznaczna tylko u 10/157 (6,35%); apo-PC drugiej strony daje TEN SAM obraz;
           [H31] Castellucci 2020 — torsji BRAK u 57,1% potwierdzonych AC-BPPV.
         DLATEGO: obie kandydatury przednie są ŻYWE w każdym Dixie, a predykcję bierzemy z pozy,
         w której kanał JEST prowokowany (napęd +0.0382 w Dixie własnej strony wobec −0.0312
         w przeciwnym) — bo klinicysta widzi ten sam downbeat niezależnie od tego, którą stronę bada.
         Strona zostaje ROZSTRZYGNIĘTA TORSJĄ, gdy klinicysta ją opisze; przy opisie „torsja: zero"
         (większość chorych) obie strony przeżywają i model uczciwie mówi „strona nieoznaczalna". */
      const q = stepHeadQ('supineHang', side === 'P' ? 45 : -45, 'up');
      const n = nysFromGeom('anterior', side, variant, q);
      /* `opcjonalne: ['torsja']` — patrz werdyktCechy w interp-model: OBECNY skręt rozstrzyga stronę
         ([H32]), a jego BRAK nie wyklucza kanału przedniego, bo torsji nie widać u 57,1% chorych
         z potwierdzonym AC-BPPV ([H31]). Bez tego opis „torsja: zero" wykluczałby rozpoznanie
         u większości tych, którzy je mają. */
      return { h: n.anat.h, v: n.anat.v, t: n.anat.t, s: n.strength == null ? 1 : n.strength, opcjonalne: ['torsja'] };
    }
    const f = DIAG[proba].phases(side, variant, scen)[fazaDIAG(proba, fazaId, side)];
    if (!f || !f.nys || !f.nys.anat) return null;
    /* Torsja kanału PRZEDNIEGO jest opcjonalna w KAŻDEJ próbie (nie tylko w Dixie): 57,1% z [H31]
       to fakt o CHORYCH z AC-BPPV, nie o ułożeniu głowy. Dotyczy więc też deep head-hangu. */
    return { h: f.nys.anat.h, v: f.nys.anat.v, t: f.nys.anat.t, s: f.nys.strength == null ? 1 : f.nys.strength,
             ...(kand.canal === 'anterior' ? { opcjonalne: ['torsja'] } : {}) };
  } catch (e) { return null; }
}

export function interpDeps(stan) {
  return {
    fazyProby: (p) => OBS_FAZY[p],
    /* Scenariusz wchodzi DOMKNIĘCIEM, a nie kolejnym argumentem u wołających: `faza` jest wołana
       w kilkunastu miejscach modelu, a wiedza o historii pacjenta należy do wstrzykiwacza — to on
       jest jedynym miejscem, w którym stan aplikacji styka się z czystym modelem interpretacji.
       Wstrzykiwacz bez stanu (wyrocznie, tor nauki) daje `undefined` → silnik bierze „textbook",
       czyli ścieżka bez scenariusza zostaje bit-identyczna. */
    faza: (proba, fazaId, kand) => fazaKandydatury(proba, fazaId, kand, stan && stan.bltScenario),
    wzorzec: (variant) => WZORCE_DYNAMIKI.find(z => z.id === (variant === 'cupulo' ? 'B' : 'A')),
    czytaj: (rek, klucz, ufaj) => wartoscInstancji(rek, klucz, { ufajNiewiarygodnym: !!ufaj }),
    spojnosc, flagi,
    // Po WSZYSTKICH próbach, nie po bieżącej: inaczej rada „zrób następną próbę" kasowałaby
    // alarm, bo downbeat opisany w Dix-Hallpike znikałby z pamięci po przełączeniu na roll.
    proby: OBS_PROBY,
    rekord: (p) => (((stan && stan.obs) || {})[p]) || null,
  };
}
