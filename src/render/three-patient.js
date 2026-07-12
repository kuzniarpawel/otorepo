// ThreePatientRenderer (Etap 3) — sylwetka pacjenta + kozetka w WebGL, OBOK SVG.
//
// Zakres 3D = wyłącznie ciało/głowa (oczopląs, oczy, HIT i błędnik zostają w SVG).
// Renderer NIE wyprowadza pozy sam (audyt 2.5D): czyta wyłącznie PoseSpec —
// spec.joints (te same stawy/segmenty co figProj w SVG, pozycyjnie) oraz
// spec.headQ przez zweryfikowany most osi (three-bridge; tools/bridge-check.mjs).
// Render NA ŻĄDANIE: pojedyncza klatka po zmianie pozy; pętla rAF działa tylko
// podczas przejścia między pozami (~0,6 s) i zatrzymuje się (rejestr loopRAF,
// więc cancelAnims() przy re-renderze ubija ją jak każdą animację SVG).
// Model proceduralny (kapsuły wg SKEL); wymiana na GLB = ta sama funkcja show(spec)
// z adapterem kości — planowana w Etapie 4/5.
import {
  Scene, PerspectiveCamera, WebGLRenderer, AmbientLight, DirectionalLight,
  Group, Mesh, MeshLambertMaterial, CylinderGeometry, SphereGeometry, ConeGeometry,
  BoxGeometry, Vector3, Quaternion,
} from 'three';
import { toThreeVec, toThreeQuat } from './three-bridge.js';
import { loopRAF, easeInOut } from '../runtime/registry.js';

// segmenty i szerokości identyczne z figProj (SVG) — jednostki SKEL
const HEAD = 0x4fc9e8, LIMB = 0x7e94a6, TORSO = 0x90a6b8, COUCH = 0x2c3d4c, LEG = 0x1c2935, MARK = 0x0e141b;
const SEGS = [
  ['pelvis','spine',24,TORSO],['spine','neck',17,TORSO],
  ['spine','shL',8],['shL','elbL',10],['elbL','handL',10],
  ['spine','shR',8],['shR','elbR',10],['elbR','handR',10],
  ['pelvis','hipL',10],['hipL','kneeL',13],['kneeL','ankL',13],['ankL','toeL',10],
  ['pelvis','hipR',10],['hipR','kneeR',13],['kneeR','ankR',13],['ankR','toeR',10],
];
const HEAD_R = 15;
// wykluczenia kotwiczenia do blatu — te same co bedY w figProj
const BED_EXCL = { supineHang: { neck:1, head:1 }, sit: { ankL:1, ankR:1, toeL:1, toeR:1 } };

const jointR = {};                                        // promień stawu = najgrubszy przyległy segment
for (const [a, b, w] of SEGS) { jointR[a] = Math.max(jointR[a] || 0, w / 2); jointR[b] = Math.max(jointR[b] || 0, w / 2); }
const JOINTS = Object.keys(jointR);                       // stawy z kulami (bez głowy — zakrywa ją czaszka)
const ALL = [...JOINTS, 'head'];                          // wszystkie punkty pozy: pozycje, bbox kozetki, przejścia

function createPatientRenderer() {
  const scene = new Scene();
  scene.add(new AmbientLight(0xffffff, 0.85));
  const sun = new DirectionalLight(0xffffff, 1.6); sun.position.set(90, 180, 120); scene.add(sun);
  const camera = new PerspectiveCamera(30, 5 / 4, 10, 2000);

  const mats = {};
  const mat = c => (mats[c] = mats[c] || new MeshLambertMaterial({ color: c }));
  const unitCyl = new CylinderGeometry(1, 1, 1, 12);
  const unitSph = new SphereGeometry(1, 18, 14);
  const unitBox = new BoxGeometry(1, 1, 1);

  const body = new Group(); scene.add(body);
  const segMesh = SEGS.map(([, , w, c]) => { const m = new Mesh(unitCyl, mat(c || LIMB)); body.add(m); return m; });
  const jntMesh = {};
  for (const j of JOINTS) { const m = new Mesh(unitSph, mat(LIMB)); m.scale.setScalar(jointR[j]); body.add(m); jntMesh[j] = m; }
  // głowa: sfera + nos (three „przód" = lokalne -z, spójnie z mostem) + oczy
  const head = new Group();
  const skull = new Mesh(unitSph, mat(HEAD)); skull.scale.setScalar(HEAD_R); head.add(skull);
  const nose = new Mesh(new ConeGeometry(4.6, 10, 12), mat(HEAD));
  nose.rotation.x = -Math.PI / 2; nose.position.set(0, -1.5, -(HEAD_R + 4)); head.add(nose);
  for (const sx of [-1, 1]) { const eye = new Mesh(unitSph, mat(MARK)); eye.scale.setScalar(2.1); eye.position.set(sx * 5.4, 3.2, -(HEAD_R - 2.5)); head.add(eye); }
  body.add(head);

  const couchTop = new Mesh(unitBox, mat(COUCH)); scene.add(couchTop);
  const legs = [0, 1, 2, 3].map(() => { const m = new Mesh(unitBox, mat(LEG)); m.scale.set(8, 34, 8); scene.add(m); return m; });

  let renderer = null, canvas = null, lastSpec = null, lastSide = null;

  // ── jedna klatka z danych pozy (surowe stawy OTOREPO + headQ) ────────────────
  function applyFrame(J3, headQ3, bodyTag) {
    const excl = BED_EXCL[bodyTag] || {};
    let minY = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const j of ALL) {
      const p = J3[j], r = j === 'head' ? HEAD_R : jointR[j];
      if (!excl[j]) {
        minY = Math.min(minY, p.y - r);
        minX = Math.min(minX, p.x - r); maxX = Math.max(maxX, p.x + r);
        minZ = Math.min(minZ, p.z - r); maxZ = Math.max(maxZ, p.z + r);
      }
    }
    const dy = -minY;                                      // najniższy WŁĄCZONY punkt siada na blacie y=0
    body.position.y = dy;
    for (let i = 0; i < SEGS.length; i++) {
      const [a, b, w] = SEGS[i], A = J3[a], B = J3[b], m = segMesh[i];
      const len = A.distanceTo(B) || 0.001;
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(UP, T1.copy(B).sub(A).normalize());
      m.scale.set(w / 2, len, w / 2);
    }
    for (const j of JOINTS) jntMesh[j].position.copy(J3[j]);
    head.position.copy(J3.head);
    head.quaternion.copy(headQ3);
    // kozetka pod poziomym zasięgiem WŁĄCZONYCH stawów (wykluczenia → luka przy zwisie/siadzie)
    const w = Math.max(60, maxX - minX + 26), d = Math.max(56, maxZ - minZ + 26);
    const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;
    couchTop.scale.set(w, 8, d); couchTop.position.set(cx, -4, cz);
    const lx = w / 2 - 7, lz = d / 2 - 7;
    legs[0].position.set(cx - lx, -25, cz - lz); legs[1].position.set(cx + lx, -25, cz - lz);
    legs[2].position.set(cx - lx, -25, cz + lz); legs[3].position.set(cx + lx, -25, cz + lz);
    renderer.render(scene, camera);
  }
  const UP = new Vector3(0, 1, 0), T1 = new Vector3();

  const jointsToThree = spec => { const o = {}; for (const j of ALL) o[j] = toThreeVec(spec.joints[j]); return o; };
  function setCamera(side) {
    const D = 235, H = 62;                                 // strona P = kamera od strony PRAWEJ pacjenta (three +x)
    if (side === 'L') camera.position.set(-D, H, 0); else camera.position.set(D, H, 0);
    camera.lookAt(0, 30, 0);
  }

  return {
    initialize(container) {
      if (!renderer) {
        renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });   // bufor trwały: zrzuty canvasa (weryfikacja/wyrocznia pikselowa)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        canvas = renderer.domElement;
      }
      const w = Math.max(160, container.clientWidth || 200);
      renderer.setSize(w, Math.round(w * 0.8), false);
      camera.aspect = 5 / 4; camera.updateProjectionMatrix();
      container.textContent = '';
      container.appendChild(canvas);
    },
    // show: statycznie lub z przejściem od poprzedniej pozy (render na żądanie — pętla kończy się z t=1)
    show(spec, side) {
      setCamera(side);
      const to = { J: jointsToThree(spec), Q: toThreeQuat(spec.headQ) };
      const from = lastSpec;
      const changed = from && (from.spec.body !== spec.body || from.spec.yaw !== spec.yaw || from.spec.face !== spec.face);
      const sameCam = lastSide === side;
      lastSpec = { spec, ...to }; lastSide = side;
      if (!from || !changed || !sameCam) { applyFrame(to.J, to.Q, spec.body); return; }
      const t0 = performance.now(), DUR = 620;
      const Ji = {}, Qi = new Quaternion();
      loopRAF(now => {
        if (!canvas.isConnected) return false;             // panel zniknął (re-render bez 3D) → stop
        const t = Math.min(1, (now - t0) / DUR), e = easeInOut(t);
        for (const j of ALL) Ji[j] = from.J[j].clone().lerp(to.J[j], e);
        Qi.slerpQuaternions(from.Q, to.Q, e);
        applyFrame(Ji, Qi, e < 0.5 ? from.spec.body : spec.body);
        return t < 1;                                      // koniec przejścia → pętla staje (render na żądanie)
      });
    },
    pause() {}, resume() {},                               // pętla i tak żyje tylko w trakcie przejścia
    resize(container) { this.initialize(container); if (lastSpec) applyFrame(lastSpec.J, lastSpec.Q, lastSpec.spec.body); },
    dispose() {
      unitCyl.dispose(); unitSph.dispose(); unitBox.dispose(); nose.geometry.dispose();
      for (const c of Object.values(mats)) c.dispose();
      if (renderer) renderer.dispose();
      if (canvas && canvas.parentNode) canvas.remove();
      renderer = null; lastSpec = null;
    },
  };
}

// ── pula montażu (guide + 2 fazy diag = maks. 3 konteksty WebGL) ────────────────
const pool = new Map();
export async function mountPatient3D(key, container, spec, side) {
  let r = pool.get(key);
  if (!r) { r = createPatientRenderer(); pool.set(key, r); }
  try {
    r.initialize(container);
    r.show(spec, side);
  } catch (e) {
    console.error('mountPatient3D:', e);                  // diagnoza w konsoli; UI dostaje czytelny fallback
    container.textContent = '3D niedostępne (WebGL)';
    try { r.dispose(); } catch {}
    pool.delete(key);
  }
}
export { createPatientRenderer };
