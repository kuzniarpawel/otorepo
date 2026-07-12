/* OTOREPO — wyrocznia WIDOKU SVG↔3D (Etap 4: auto-oracle z planu migracji).
 *
 * bridge-check dowodzi zgodności KWATERNIONÓW; ta wyrocznia dowodzi zgodności OBRAZU:
 * że kamera 3D (three-patient: cameraDef/camKeyFor, z lustrem mirrorX dla topDownFront)
 * pokazuje pacjenta tak samo jak rzut ortograficzny SVG (Scene3D.CAMERAS) — strony L/P,
 * kierunek głowa–miednica i kierunek nosa na EKRANIE.
 *
 * Dla każdego kroku każdego manewru × strony oraz każdej fazy testów DIAG × strony
 * × wariantu porównuje kierunki ekranowe trzech wektorów:
 *   tułów  = head − pelvis        (orientacja ciała),
 *   kolana = kneeL − kneeR        (CHIRALNOŚĆ — wykrywa zamianę L/P),
 *   nos    = kierunek nosa z headQ (orientacja głowy — klinicznie krytyczna).
 * Wektor pomijany, gdy w danym widoku degeneruje (długość rzutu ~0, np. oś kolan
 * w widoku bocznym). Perspektywa vs orto daje odchyłki do ~15° przy krawędzi kadru
 * — próg 25° wyłapuje odbicia/zamiany osi (błędy 60–180°), nie szum projekcji.
 *
 * Uruchomienie: npm run view:check (czysty Node; exit 1 przy przekroczeniu progu).
 */
import { Vestibular } from '../src/engine/vestibular.js';
import { Scene3D } from '../src/engine/scene3d.js';
import { poseSpec, MANEUVERS, DIAG } from '../src/pose/maneuvers.js';
import { toThreeVec } from '../src/render/three-bridge.js';
import { FRAME, camKeyFor, cameraDef } from '../src/render/three-patient.js';
import { PerspectiveCamera } from 'three';

const TOL_DEG = 25, ASPECT = 5 / 4;
const dot3 = (a, b) => a[0]*b[0] + a[1]*b[1] + a[2]*b[2];

// ekran SVG (orto, y w dół) — jak figProj: project(point, I, cam)
function svgScreen(p, cam) { return { x: dot3(p, cam.right), y: -dot3(p, cam.up) }; }

// ekran 3D (perspektywa → NDC; x·aspect przywraca izotropię; mirrorX = lustro obrazu; y w dół jak SVG)
function makeCam(camKey) {
  const d = cameraDef(camKey);
  const cam = new PerspectiveCamera(FRAME.fov, ASPECT, 10, 2000);
  cam.up.set(...d.up); cam.position.set(...d.position); cam.lookAt(...d.target);
  cam.updateMatrixWorld(true);
  return { cam, mirror: d.mirrorX ? -1 : 1 };
}
function threeScreen(pOur, C) {
  const v = toThreeVec(pOur).project(C.cam);
  return { x: v.x * ASPECT * C.mirror, y: -v.y };
}

const add = (a, b, s) => [a[0] + b[0]*s, a[1] + b[1]*s, a[2] + b[2]*s];
function vectors(spec) {
  const J = spec.joints;
  const nose = Vestibular.rotate(spec.headQ, [0, 0, 1]);
  return [
    ['tułów', J.head, J.pelvis],
    ['kolana', J.kneeL, J.kneeR],
    ['nos', add(J.head, nose, 20), J.head],
  ];
}

// przypadki: wszystkie manewry × strony × kroki + DIAG × strony × warianty × fazy
const cases = [];
for (const [key, m] of Object.entries(MANEUVERS)) for (const side of ['P', 'L']) {
  const plan = m.gen(side);
  plan.steps.forEach((st, i) => st.body && cases.push({ tag: `man/${key}/${side}/krok${i}`, st, viewSide: side }));
}
for (const [key, t] of Object.entries(DIAG)) for (const side of ['P', 'L']) for (const v of ['canalo', 'cupulo']) {
  let phases; try { phases = t.phases(side, v); } catch { continue; }
  (phases || []).forEach((ph, i) => ph.body && cases.push({ tag: `diag/${key}/${side}/${v}/faza${i}`, st: ph, viewSide: side }));
}

let n = 0, worst = 0, worstTag = '', fails = [];
const camCache = {};
for (const { tag, st, viewSide } of cases) {
  const spec = poseSpec(st);
  const camKey = camKeyFor(spec, viewSide);
  const svgCam = Scene3D.CAMERAS[camKey];
  if (!svgCam) { fails.push(`${tag}: brak kamery SVG '${camKey}'`); continue; }
  const C = camCache[camKey] || (camCache[camKey] = makeCam(camKey));
  for (const [name, a, b] of vectors(spec)) {
    const s1 = svgScreen(a, svgCam), s2 = svgScreen(b, svgCam);
    const u = { x: s1.x - s2.x, y: s1.y - s2.y };
    const lu = Math.hypot(u.x, u.y);
    const t1 = threeScreen(a, C), t2 = threeScreen(b, C);
    const w = { x: t1.x - t2.x, y: t1.y - t2.y };
    const lw = Math.hypot(w.x, w.y);
    if (lu < 0.35 || lw < 0.004) continue;                 // rzut zdegenerowany w tym widoku (np. oś kolan z boku)
    const cos = (u.x * w.x + u.y * w.y) / (lu * lw);
    const ang = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
    n++;
    if (ang > worst) { worst = ang; worstTag = `${tag}[${name}] (kamera ${camKey})`; }
    if (ang > TOL_DEG) fails.push(`${tag}[${name}] kamera=${camKey} odchyłka=${ang.toFixed(1)}°`);
  }
}

console.log(`view-check: ${cases.length} póz (manewry+diag), ${n} porównań kierunków ekranowych`);
console.log(`maks. odchyłka: ${worst.toFixed(2)}°  @ ${worstTag}  (próg ${TOL_DEG}°)`);
if (fails.length) {
  console.error(`\n✗ FAIL — ${fails.length} niezgodności widoku SVG↔3D:`);
  for (const f of fails.slice(0, 15)) console.error('  •', f);
  process.exit(1);
}
console.log('\n✓ PASS — widoki 3D zgodne z SVG (strony L/P, tułów, nos) we wszystkich pozach.');
