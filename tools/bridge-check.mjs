/* OTOREPO — wyrocznia mostu OTOREPO↔Three (Etap 3; zasada z migracja_3d.txt: MOST
 * weryfikowany liczbowo ZANIM dotknie ekranu).
 *
 * Dla pełnej siatki pozycja×twarz×yaw (siatka golden pose) + kroków WSZYSTKICH manewrów
 * (generatory czyste) + faz WSZYSTKICH testów DIAG, dla OBU kwaternionów pozy
 * (headQ=composeHead, stepQ=stepHeadQ) sprawdza:
 *   1. wektory bazowe: Q3·(three-lokalny e) == toThreeVec(rotate(q, otorepo-lokalny e))
 *      dla e ∈ {prawo, czubek, tył} (tył: three e_z ↔ OTOREPO [0,0,-1]);
 *   2. grawitację: fromThreeVec-lokalnie(Q3⁻¹·(0,-1,0)) == gHead(q) == spec.gravity;
 *   3. właściwość rotacji: |Q3| = 1;
 *   4. informacyjnie: zgodność z kandydatem wzoru q3=(-qx,-qy,qz,qw) z migracja_3d.txt.
 * Próg twardy 1e-6 (oczekiwane ~1e-15). Exit 1 przy przekroczeniu.
 *
 * Uruchomienie: npm run bridge:check  (czysty Node — guardy window/document w modułach).
 */
import { Vestibular } from '../src/engine/vestibular.js';
import { poseSpec, TORSO_Q, MANEUVERS, DIAG } from '../src/pose/maneuvers.js';
import { toThreeVec, fromThreeVec, toThreeQuat } from '../src/render/three-bridge.js';
import { Vector3 } from 'three';

const TOL = 1e-6;
const R = Vestibular.rotate;
const cases = [];

// 1. siatka jak w golden pose oracle
const faces = ['up', 'down', 'front', 'left', 'right', null];
const yaws = [-90, -45, 0, 45, 90];
for (const body of Object.keys(TORSO_Q)) for (const face of faces) for (const yaw of yaws)
  cases.push({ tag: `grid/${body}/${face}/${yaw}`, st: { body, yaw, face } });

// 2. kroki wszystkich manewrów × strony (generatory czyste — bez state)
for (const [key, m] of Object.entries(MANEUVERS)) for (const side of ['P', 'L']) {
  const plan = m.gen(side);
  (plan.steps || []).forEach((st, i) => {
    if (st.body) cases.push({ tag: `man/${key}/${side}/step${i}`, st });
  });
}

// 3. fazy wszystkich testów diagnostycznych × strony (warianty canalo/cupulo gdzie dotyczy)
for (const [key, t] of Object.entries(DIAG)) for (const side of ['P', 'L']) for (const v of ['canalo', 'cupulo']) {
  let phases; try { phases = t.phases(side, v); } catch { continue; }
  (phases || []).forEach((ph, i) => {
    if (ph.body) cases.push({ tag: `diag/${key}/${side}/${v}/faza${i}`, st: ph });
  });
}

// pary (three-lokalny, OTOREPO-lokalny): prawo, czubek, tył
const AXES = [
  [new Vector3(1, 0, 0), [1, 0, 0]],
  [new Vector3(0, 1, 0), [0, 1, 0]],
  [new Vector3(0, 0, 1), [0, 0, -1]],
];
const DOWN3 = new Vector3(0, -1, 0);

let n = 0, maxErr = 0, maxTag = '', formulaOK = true, worst = [];
for (const { tag, st } of cases) {
  const spec = poseSpec(st);
  for (const [qName, q] of [['headQ', spec.headQ], ['stepQ', spec.stepQ]]) {
    const Q3 = toThreeQuat(q);
    let err = Math.abs(Q3.length() - 1);                                   // 3. unormowanie
    for (const [e3, eO] of AXES) {                                         // 1. wektory bazowe
      const got = e3.clone().applyQuaternion(Q3);
      const want = toThreeVec(R(q, eO));
      err = Math.max(err, got.distanceTo(want));
    }
    const gLoc3 = DOWN3.clone().applyQuaternion(Q3.clone().invert());      // 2. grawitacja w lokalnych
    const gOto = fromThreeVec(gLoc3);                                      //    (mapa lokalnych = ta sama M)
    const gRef = Vestibular.gHead(q);
    err = Math.max(err, Math.hypot(gOto[0] - gRef[0], gOto[1] - gRef[1], gOto[2] - gRef[2]));
    if (qName === 'stepQ') {                                               // spec.gravity ∥ gHead(stepQ) — KIERUNKOWO:
      const g = spec.gravity, m = Math.hypot(g[0], g[1], g[2]) || 1;       // BASE_G/LEAN_G to kierunki nieznormalizowane
      err = Math.max(err, Math.hypot(gOto[0] - g[0] / m, gOto[1] - g[1] / m, gOto[2] - g[2] / m));
    }
    const dot = Math.abs(Q3.x * -q[1] + Q3.y * -q[2] + Q3.z * q[3] + Q3.w * q[0]);  // 4. wzór-kandydat
    if (Math.abs(dot - 1) > 1e-9) formulaOK = false;
    if (err > maxErr) { maxErr = err; maxTag = `${tag}[${qName}]`; }
    if (err > TOL) worst.push(`${tag}[${qName}] err=${err.toExponential(2)}`);
    n++;
  }
}

console.log(`bridge-check: ${n} kwaternionów (${cases.length} póz: siatka+manewry+diag)`);
console.log(`maks. błąd   : ${maxErr.toExponential(3)}  @ ${maxTag}  (próg ${TOL})`);
console.log(`wzór (-x,-y,z,w) z migracja_3d.txt: ${formulaOK ? 'POTWIERDZONY liczbowo' : 'NIEZGODNY (most z baz jest rozstrzygający)'}`);
if (worst.length) {
  console.error(`\n✗ FAIL — ${worst.length} przypadków ponad próg:`);
  for (const w of worst.slice(0, 10)) console.error('  •', w);
  process.exit(1);
}
console.log('\n✓ PASS — most OTOREPO↔Three zweryfikowany na pełnej siatce.');
