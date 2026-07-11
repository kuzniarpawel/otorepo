import { Vestibular } from './vestibular.js';

/* ============ Rdzeń wizualizacji 2.5D — etap A ============
   Wspólne źródło prawdy 3D dla animacji. Matematyka 3D → schematyczne SVG przez
   rzut ortograficzny. Układ głowy jak w silniku: x=prawo, y=góra(czaszka), z=nos.
   Obserwator (lekarz) = KAMERA; zamiana stron L/P i lustro wynikają z kamery,
   nie z flag swap/behindHead. */
export const Scene3D = (()=>{
  const {rotate, qaxis} = Vestibular;
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  // anatomiczne punkty głowy (jednostkowe, układ głowy)
  const HEAD_POINTS = {
    nose:[0,0,1], top:[0,1,0], chin:[0,-1,0],
    earR:[1,0,0], earL:[-1,0,0], occiput:[0,0,-1],
    eyeR:[0.4,0.15,0.85], eyeL:[-0.4,0.15,0.85]
  };
  // Widoki ortograficzne (bazy right/up/fwd — jednostkowe i wzajemnie ortogonalne): right=świat→ekran+x,
  // up=świat→„góra ekranu", fwd=kierunek patrzenia (depth=p·fwd, większe=dalej). SVG ma y w dół → ekran y=-(p·up).
  // SKRĘTNOŚĆ BAZY (audyt #7) — det = right·(up×fwd):
  //   det=+1 (OBRÓT WŁAŚCIWY): frontal, behind, sideRight, sideLeft. „frontal" jest obrócony NAPRZECIW pacjenta,
  //     więc klinicznie zamienia lewo/prawo (right=-x, „lustro") — ale to nadal poprawny obrót, nie odbicie bazy.
  //   det=-1 (baza LEWOSKRĘTNA = ODBICIE): topDownBehind, topDownFront — jedyne widoki z realnym odbiciem bazy
  //     (nieosiągalne samym obrotem). Wystarczają do obecnego dialu „z góry", lecz łamią jedną spójną konwencję.
  //   KONSEKWENCJA: znak przeniesienia poziomu/skrętu bierzemy PER-WIDOK (camRx = frontal.right[0] = -1;
  //     flip = cam.up[2]<0 w startDialNys), a NIE z jednej globalnej reguły. Dodając nowy widok / wyprowadzając
  //     skrętność — uwzględnij det tego widoku (obiekty to „widoki", nie czyste kamery-obroty).
  const CAMERAS = {
    topDownBehind:{right:[1,0,0],  up:[0,0,-1], fwd:[0,-1,0]}, // nad głową, od tyłu (obecny dial) — det=-1 (odbicie)
    topDownFront: {right:[-1,0,0], up:[0,0,1],  fwd:[0,-1,0]}, // nad głową, od przodu — det=-1 (odbicie)
    frontal:      {right:[-1,0,0], up:[0,1,0],  fwd:[0,0,-1]}, // naprzeciw pacjenta (oczy — lustro) — det=+1 (obrót)
    behind:       {right:[1,0,0],  up:[0,1,0],  fwd:[0,0,1]},  // za głową — det=+1
    sideRight:    {right:[0,0,-1], up:[0,1,0],  fwd:[1,0,0]},  // z prawego boku — det=+1
    sideLeft:     {right:[0,0,1],  up:[0,1,0],  fwd:[-1,0,0]}  // z lewego boku — det=+1
  };
  // rzut punktu głowy (po obrocie głowy qHead) przez kamerę → ekran {x,y,depth}
  function project(pHead, qHead, cam){
    const w = rotate(qHead, pHead);
    return { x: dot(w,cam.right), y: -dot(w,cam.up), depth: dot(w,cam.fwd) };
  }
  // kąt zgodny z ruchem wskazówek zegara od "góry ekranu" (dla obrotów schematu)
  function screenAngleCW(p){ const a=Math.atan2(p.x, -p.y)*180/Math.PI; return ((a%360)+360)%360; }
  return { HEAD_POINTS, CAMERAS, project, screenAngleCW };
})();

