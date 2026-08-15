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
import { DIAG, nysFromGeom, otherSide, stepHeadQ } from '../pose/maneuvers.js';
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
       Zmierzone: chore ucho = PRZECIWNE do badanego, kierunek {h:0, v:-1, t:0} dla OBU stron
       (czyli strony z kierunku nie ustalisz — to jest właśnie „maska modelu"). */
    if (proba === 'dix' && kand.canal === 'anterior') {
      const badana = otherSide(side);
      const n = nysFromGeom('anterior', side, variant, stepHeadQ('supineHang', badana === 'P' ? 45 : -45, 'up'));
      return { h: n.anat.h, v: n.anat.v, t: n.anat.t, s: n.strength == null ? 1 : n.strength };
    }
    const f = DIAG[proba].phases(side, variant, scen)[fazaDIAG(proba, fazaId, side)];
    if (!f || !f.nys || !f.nys.anat) return null;
    return { h: f.nys.anat.h, v: f.nys.anat.v, t: f.nys.anat.t, s: f.nys.strength == null ? 1 : f.nys.strength };
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
