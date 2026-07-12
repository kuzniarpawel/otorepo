// Most układów współrzędnych OTOREPO ↔ Three.js (Etap 3).
//
// OTOREPO (świat i lokalne): x=prawo, y=góra, z=PRZÓD (nos, brzuch); grawitacja dół=[0,-1,0];
//   kwaternion [w,x,y,z] (tożsamość [1,0,0,0]).
// Three.js: x=prawo, y=góra, z=TYŁ (ku obserwatorowi); „przód" obiektu = lokalne -z;
//   Quaternion (x,y,z,w) (tożsamość (0,0,0,1)).
//
// Mapa M: (x,y,z) → (x,y,-z) — ODBICIE osi z (det=-1, zmiana skrętności). Dotyczy TAK SAMO
// współrzędnych świata i lokalnych: nos OTOREPO [0,0,1] → three-lokalne (0,0,-1), czyli
// dokładnie konwencja „przodu" Three. Rotacja przenosi się przez koniugację R3 = M ∘ R ∘ M
// (dwa odbicia → znów rotacja właściwa, det=+1).
//
// ZASADA (migracja_3d.txt, sekcja MOST): NIE ufamy gotowemu wzorowi na kwaternion —
// budujemy R3 z WEKTORÓW BAZOWYCH (obrazy lokalnego prawa/czubka/tyłu w świecie) i
// weryfikujemy liczbowo pełną siatką pozycja×twarz×yaw względem gHead:
// tools/bridge-check.mjs (npm run bridge:check), próg 1e-6.
import { Quaternion, Matrix4, Vector3 } from 'three';
import { Vestibular } from '../engine/vestibular.js';

const toThreeVec = v => new Vector3(v[0], v[1], -v[2]);   // świat: OTOREPO → Three
const fromThreeVec = v => [v.x, v.y, -v.z];               // świat: Three → OTOREPO (inwolucja)

function toThreeQuat(q){                                  // q: [w,x,y,z] lokalne→świat (OTOREPO)
  const R = Vestibular.rotate;
  const cx = toThreeVec(R(q, [1, 0, 0]));                 // kolumna x: obraz three-lokalnego e_x (prawo)
  const cy = toThreeVec(R(q, [0, 1, 0]));                 // kolumna y: obraz three-lokalnego e_y (czubek)
  const cz = toThreeVec(R(q, [0, 0, -1]));                // kolumna z: obraz three-lokalnego e_z (TYŁ OTOREPO)
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(cx, cy, cz));
}

export { toThreeVec, fromThreeVec, toThreeQuat };
