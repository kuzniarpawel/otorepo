/* OTOREPO — JEDYNA DROGA ZAPISU obserwacji (Blok 8).
 *
 * Wzorzec z flow-state.js: model (`obs-model.js`) jest czysty i tylko CZYTA, a cała mutacja
 * stanu przechodzi przez ten jeden moduł. Dzięki temu niezmiennik „zapis pola obserwacji NIE
 * RUSZA niczego poza rekordem" da się wyrazić w jednym miejscu, zamiast pilnować go w każdym
 * handlerze z osobna.
 *
 * ═══ NAJWAŻNIEJSZA GRANICA W TYM PLIKU ═══
 * `state.dixObs` przestaje być „wyborem" i staje się PRZYJĘTĄ PODSTAWĄ INTERPRETACJI.
 * Pisze do niego WYŁĄCZNIE `przyjmijObserwacje()` — jawny gest użytkownika. Żaden zapis pola
 * rekordu nie rusza go nigdy. Bez tej granicy opisanie kierunku po cichu podmieniałoby kanał,
 * stronę i zalecany manewr (a `setDixObs('ant')` robi dokładnie te cztery rzeczy naraz),
 * czyli Blok 9 wchodziłby tylnymi drzwiami przy okazji wypełniania formularza.
 */
import { pustyRekord, OBS_POLA, OBS_FAZY, instancjeStosowalne, wartoscInstancji, kluczInstancji,
         odciskObserwacji } from './obs-model.js';
import { markDecision, markSeen } from './flow-state.js';

function dostep(state, proba) {
  if (!state.obs || typeof state.obs !== 'object') state.obs = {};
  if (!state.obs[proba]) state.obs[proba] = pustyRekord(proba);
  return state.obs[proba];
}

/* ODCISK OPISU dla wykrywania nieaktualnego wniosku (Blok 5 × Blok 9). Liczony TUTAJ, bo
   flow-model.js jest bezimportowy i nie może zawołać `odciskObserwacji` sam, a rekord obserwacji
   ma dokładnie jednego pisarza — ten moduł. Każda mutacja rekordu MUSI przez to przejść: odcisk,
   który rozjedzie się z rekordem, jest gorszy od braku odcisku, bo alarm milczy fałszywie. */
function odswiezOdcisk(state, proba) {
  if (!state.obsOdciski || typeof state.obsOdciski !== 'object') state.obsOdciski = {};
  const r = obsRekordu(state, proba);
  state.obsOdciski[proba] = r ? odciskObserwacji(r) : null;
}

export function obsRekordu(state, proba) {
  return (state.obs && state.obs[proba]) || null;
}

export function setObsWystapil(state, proba, w) {
  const r = dostep(state, proba);
  r.wystapil = (r.wystapil === w) ? undefined : w;      // ponowne dotknięcie = cofnięcie odpowiedzi
  odswiezOdcisk(state, proba);
  markSeen(state, 'obsSeen');
}

export function setObsPole(state, proba, klucz, wartosc) {
  const r = dostep(state, proba);
  const e = r.pola[klucz];
  if (e && e.w === wartosc) delete r.pola[klucz];        // cofnięcie odpowiedzi, nie „nie wiem"
  else r.pola[klucz] = { w: wartosc, znak: e ? e.znak : null };
  odswiezOdcisk(state, proba);
  markSeen(state, 'obsSeen');
}

/* Znacznik przełącza się cyklicznie: pewne → niepewne → niewiarygodne → pewne.
   Pole bez odpowiedzi nie ma czego znaczyć — inaczej powstałby czwarty, niemy stan. */
export function oznaczObsPole(state, proba, klucz) {
  const r = dostep(state, proba);
  const e = r.pola[klucz];
  if (!e) return;
  e.znak = e.znak === null ? 'niepewne' : e.znak === 'niepewne' ? 'niewiarygodne' : null;
  // Znacznik ZMIENIA odcisk, bo `odciskObserwacji` pomija pola kwarantannowane: oznaczenie cechy
  // jako niewiarygodnej wyjmuje ją z podstawy wniosku równie skutecznie jak jej skasowanie.
  odswiezOdcisk(state, proba);
}

export function setObsPowod(state, proba, powod) {
  const r = dostep(state, proba);
  r.powodNiewiarygodnosci = (r.powodNiewiarygodnosci === powod) ? undefined : powod;
}

/* Kasowanie CAŁEGO rekordu jest jawną decyzją użytkownika i jedynym miejscem, w którym zapis
   znika. Pola, które przestały być stosowalne, NIE są kasowane nigdzie indziej — ciche
   usuwanie cudzego zapisu jest najgorszym możliwym obejściem się z danymi. */
export function clearObs(state, proba) {
  if (!state.obs) return;
  if (proba) { delete state.obs[proba]; odswiezOdcisk(state, proba); }
  else { state.obs = {}; state.obsOdciski = {}; }
}

export function setObsGrupa(state, grupa) {
  state.obsGrupa = (state.obsGrupa === grupa) ? null : grupa;
}

/* MOST DO INTERPRETACJI — jedyny. Zwraca to, co przyjęto, albo null, jeśli nie było czego.
   Świadomie NIE ustawia `variant` ani `side`: mechanizm i strona to wnioski (Blok 9), a nie
   rzeczy, które wypadałoby po cichu podmienić przy okazji opisania kierunku. */
export function przyjmijObserwacje(state, proba) {
  const r = obsRekordu(state, proba);
  if (!r || proba !== 'dix') return null;
  const pion = wartoscInstancji(r, kluczInstancji('pion', 'jedyna'));
  const podstawa = pion === 'm1' ? 'ant' : pion === 'p1' ? 'post' : null;
  if (!podstawa) return null;
  markDecision(state, 'dixObs', podstawa);
  markSeen(state, 'obsSeen');
  return podstawa;
}

/* Ile instancji jest w danej grupie już odpowiedzianych — do podpisu „3 z 4" przy grupie.
   Liczymy WYPEŁNIENIE, nie kompletność: to jest nawigacja po formularzu, a nie ocena opisu. */
export function postepGrupy(state, proba, os) {
  const r = obsRekordu(state, proba);
  const wyst = r ? wartoscInstancji(r, 'wystapil') : undefined;
  const inst = instancjeStosowalne(proba, wyst).filter(i => i.os === os);
  const zrobione = inst.filter(i => wartoscInstancji(r, i.klucz, { ufajNiewiarygodnym: true }) != null).length;
  return { zrobione, ile: inst.length };
}
