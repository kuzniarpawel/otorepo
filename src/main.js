
"use strict";
import { Vestibular } from './engine/vestibular.js';
import { Scene3D } from './engine/scene3d.js';
import { NeuroVOR } from './engine/neuro-vor.js';
const $ = (s,r=document)=>r.querySelector(s);
const SIDE = {L:"lewa", P:"prawa"};
const otherSide = s => s==="L" ? "P" : "L";
// prawe ucho pacjenta po lewej stronie badającego -> ekranowy kierunek
const earToScreen = s => s==="P" ? -1 : 1;
const yawToA = side => side==="L" ? -45 : 45;   // obrót KU uchu choremu: L=w lewo(-), P=w prawo(+); konwencja yaw>0=prawo

/* ============ Silnik neurologiczny — etap 0 (regułowy) ============
   Czysty moduł bez DOM. Koduje prawa Ewalda i mapowanie kanał → oś ruchu oka.
   Wyjście: składowe szybkiej fazy oczopląsu w układzie pacjenta:
     h: + w prawo / − w lewo   (pozioma)
     v: + ku górze / − w dół    (pionowa)
     t: + górne bieguny w prawo / − w lewo  (skrętna)
    Side kodujemy jako 'L'/'P' (lewe/prawe ucho).
*/
function makeManualOrientation(){
  // walidacja + normalizacja wejścia (sensor/użytkownik): kwaternion niejednostkowy skalowałby rzuty o |q|²,
  // a przechowywanie/oddawanie referencji pozwalałoby mutować stan spoza API. Zwracamy KOPIE. [audyt #4]
  const normQuat = nq => {
    if(!Array.isArray(nq) || nq.length!==4 || nq.some(v=>!Number.isFinite(v)))
      throw new TypeError("makeManualOrientation: kwaternion musi być [w,x,y,z] o skończonych składowych");
    const n=Math.hypot(nq[0],nq[1],nq[2],nq[3]); if(n<1e-12) throw new RangeError("makeManualOrientation: kwaternion zerowy");
    return [nq[0]/n, nq[1]/n, nq[2]/n, nq[3]/n];
  };
  let q=[1,0,0,0];
  const api = {
    setQuat(nq){ q=normQuat(nq); return api; },                 // waliduje + normalizuje + kopiuje
    // yaw = obrót wokół osi czaszki (y); znak zgodny z dialem/qaxis (yaw>0 = obrót w PRAWO — audyt #5)
    setYaw(yawDeg){ q = Vestibular.qaxis([0,1,0], yawDeg); return api; },
    get(){ return q.slice(); }                                  // kopia — chroni stan wewnętrzny przed mutacją
  };
  return api;
}


/* ============ Manewry repozycyjne ============ */
function epley(side){
  const A=side,H=otherSide(side),aY=yawToA(A),hY=-aY;
  const sideH=H==="L"?"sideL":"sideR";
  return {name:"Manewr Epleya",canal:"posterior",side,headCamera:"topDownBehind",steps:[
    {title:"Pozycja wyjściowa",body:"sit",yaw:aY,face:"fwd",seconds:null,progress:0.02,
     headSlot:{kind:"backTurn",dir:A}, headText:`Stań za pacjentem i skręć głowę ${A==="L"?"w lewo":"w prawo"}.`,
     instr:`Pacjent siada na kozetce. Obróć jego głowę o 45° w stronę chorą (${SIDE[A]}).`},
    {title:"Szybkie położenie na plecach",body:"supineHang",yaw:aY,face:"up",seconds:30,progress:0.18,
     instr:`Połóż pacjenta szybko na plecach, głowa odchylona ~20° poza krawędź kozetki, wciąż obrócona 45° w stronę ${SIDE[A]}. Utrzymaj do ustąpienia oczopląsu.`},
    {title:"Obrót głowy o 90°",body:"supineHang",yaw:hY,face:"up",seconds:30,progress:0.45,
     instr:`Obróć głowę o 90° w stronę zdrową, tak że jest odchylona 45° w stronę ${SIDE[H]}. Utrzymaj.`},
    {title:"Obrót na bok zdrowy",body:sideH,yaw:hY,face:"down",seconds:30,progress:0.74,
     instr:`Obróć pacjenta na bok ${SIDE[H]} i dodatkowo głowę o kolejne 90°, tak by nos był skierowany ku podłodze. Utrzymaj.`},
    {title:"Powrót do siadu",body:"sit",yaw:hY,face:"fwd",seconds:null,progress:1.0,
     headSlot:{kind:"textOnly"}, headText:`Poproś chorego o opuszczenie nóg na podłogę po stronie zdrowej (${A==="L"?"prawej":"lewej"}). Dynamicznym ruchem pomóż choremu usiąść.`,
     instr:`Powoli posadź pacjenta, utrzymując obrót głowy w stronę zdrową, a następnie wyprostuj głowę. Koniec serii.`},
  ]};
}
function semont(side){
  const A=side,H=otherSide(side),hY=-yawToA(A);
  // obserwator na wprost; pacjent pada na bok chory, potem zdrowy. lewy bok pacjenta = ekran prawy.
  const leanA=A==="L"?"leanR":"leanL";
  const leanH=A==="L"?"leanL":"leanR";
  return {name:"Manewr Semonta",canal:"posterior",side,steps:[
    {title:"Pozycja wyjściowa",body:"sitFront",yaw:hY,face:"fwd",seconds:null,progress:0.02,
     instr:`Pacjent siedzi na środku kozetki, twarzą do badającego. Obróć jego twarz o 45° w stronę zdrową (${SIDE[H]}).`},
    {title:"Szybki rzut na bok chory",body:leanA,yaw:hY,face:"up",seconds:90,progress:0.25,
     instr:`Szybko połóż pacjenta na bok chory (${SIDE[A]}). Głowa pozostaje obrócona — nos ku górze. Utrzymaj 1–3 min.`},
    {title:"Szybki rzut na bok przeciwny",body:leanH,yaw:hY,face:"down",seconds:90,progress:0.72,
     instr:`Bez zmiany ustawienia głowy szybko przemieść pacjenta na bok przeciwny (${SIDE[H]}) — nos ku podłodze. Utrzymaj 1–3 min.`},
    {title:"Powrót do siadu",body:"sitFront",yaw:hY,face:"fwd",seconds:null,progress:1.0,
     instr:`Powoli posadź pacjenta, nie zmieniając pozycji badającego, a następnie wyprostuj głowę. Koniec serii.`},
  ]};
}
function lempert(side){
  const A=side,H=otherSide(side),aY=yawToA(A),yawH=A==="L"?-90:90;
  const sideH=H==="L"?"sideL":"sideR",sideA=A==="L"?"sideL":"sideR";
  return {name:"Manewr Lemperta (rolka BBQ)",canal:"horizontal",side,headCamera:"topDownBehind",steps:[
    {title:"Na plecach, głowa ku choremu",body:"supineFlat",yaw:yawH,face:"up",seconds:30,progress:0.08,
     instr:`Pacjent leży na plecach. Obróć głowę o 90° w stronę chorą (${SIDE[A]}). Utrzymaj.`},
    {title:"Głowa twarzą do sufitu",body:"supineFlat",yaw:0,face:"up",seconds:30,progress:0.30,
     instr:`Obróć głowę o 90° tak, aby nos był skierowany ku sufitowi. Utrzymaj.`},
    {title:"Obrót na bok zdrowy",body:sideH,yaw:-aY,face:"fwd",seconds:30,progress:0.52,
     instr:`Obróć głowę i ciało o kolejne 90° w stronę zdrową (${SIDE[H]}). Utrzymaj.`},
    {title:"Obrót na brzuch",body:"prone",yaw:0,face:"down",seconds:30,progress:0.74,
     instr:`Kontynuuj obrót o 90° — pacjent na brzuchu, nos ku podłodze. Utrzymaj.`},
    {title:"Obrót na bok chory",body:sideA,yaw:aY,face:"fwd",seconds:30,progress:0.92,
     instr:`Obróć o kolejne 90° na bok chory (${SIDE[A]}). Utrzymaj.`},
    {title:"Powrót do siadu",body:"sit",yaw:0,face:"fwd",seconds:null,progress:1.0,headSlot:{kind:"textOnly"},headText:`Pomóż pacjentowi usiąść przez powrót na plecy. Koniec rolki (360°).`,
     instr:`Posadź pacjenta przez powrót na plecy. Koniec rolki (360°).`},
  ]};
}
function yacovino(side){
  return {name:"Głębokie odchylenie głowy (Yacovino)",canal:"anterior",side,headCamera:"topDownBehind",steps:[
    {title:"Pozycja wyjściowa",body:"sit",yaw:0,face:"fwd",seconds:null,progress:0.02,
     instr:`Pacjent siada na środku kozetki, głowa prosto.`},
    {title:"Głębokie odchylenie głowy",body:"supineHang",yaw:0,face:"up",seconds:30,progress:0.30,
     instr:`Szybko połóż pacjenta na plecach z głową głęboko odchyloną w dół (znacznie poniżej poziomu). Utrzymaj.`},
    {title:"Przygięcie brody do klatki (leżąc)",body:"supineChin",yaw:0,face:"up",seconds:30,progress:0.70,
     instr:`NIE sadzając pacjenta, przygnij jego głowę do przodu — broda do klatki (~45°). Pacjent nadal leży. Utrzymaj.`},
    {title:"Powrót do siadu",body:"sit",yaw:0,face:"down",seconds:null,progress:1.0,
     instr:`Posadź pacjenta, utrzymując brodę przy klatce, i dopiero na końcu wyprostuj głowę. Koniec serii.`},
  ]};
}
function gufoniGeo(side){
  const A=side,H=otherSide(side), onH=H==="L"?"sideL":"sideR";
  return {name:"Manewr Gufoniego (geotropowy)",canal:"horizontal",side,headCamera:"topDownBehind",steps:[
    {title:"Pozycja wyjściowa",body:"sit",yaw:0,face:"fwd",seconds:null,progress:0.05,
     instr:`Pacjent siedzi wyprostowany na brzegu kozetki, głowa prosto.`},
    {title:"Szybko na bok zdrowy",body:onH,yaw:0,face:"fwd",seconds:60,progress:0.32,
     instr:`Szybko połóż pacjenta na bok zdrowy (${SIDE[H]}). Oczopląs geotropowy ku podłodze (ku uchu ${SIDE[H]}). Utrzymaj 1–2 min, do ustąpienia oczopląsu.`},
    {title:"Obrót głowy nosem w dół",body:onH,yaw:0,face:"down",seconds:60,progress:0.78,
     instr:`Szybko obróć głowę o 45° nosem ku podłodze. Możliwy krótki oczopląs liberacyjny ku podłodze. Utrzymaj 1–2 min.`},
    {title:"Powrót do siadu",body:"sit",yaw:0,face:"fwd",seconds:null,progress:1.0,
     instr:`Powoli posadź pacjenta i wyprostuj głowę. Koniec manewru.`},
  ]};
}
function gufoniApo(side){
  const A=side, H=otherSide(side), onA=A==="L"?"sideL":"sideR";
  return {name:"Manewr Gufoniego (apogeotropowy)",canal:"horizontal",side,headCamera:"topDownBehind",steps:[
    {title:"Pozycja wyjściowa",body:"sit",yaw:0,face:"fwd",seconds:null,progress:0.05,
     instr:`Pacjent siedzi wyprostowany, głowa prosto.`},
    {title:"Szybko na bok chory",body:onA,yaw:0,face:"fwd",seconds:60,progress:0.30,
     instr:`Szybko połóż pacjenta na bok chory (${SIDE[A]}). Oczopląs apogeotropowy ku górze (ku uchu ${SIDE[H]}). Utrzymaj 1–2 min.`},
    {title:"Obrót głowy nosem w górę",body:onA,yaw:0,face:"up",seconds:60,progress:0.62,
     instr:`Szybko obróć głowę o 45° nosem ku górze (ku sufitowi). Utrzymaj 1–2 min.`},
    {title:"Powrót do siadu — kontrola",body:"sit",yaw:0,face:"fwd",seconds:null,progress:0.85,
     instr:`Powoli posadź pacjenta. Cel: przekształcenie postaci apogeotropowej w geotropową. Wykonaj ponowny Roll test; jeśli potwierdzi postać geotropową, lecz odpowiednio (Lempert lub Gufoni geotropowy).`},
  ]};
}
const MANEUVERS={
  epley:{label:"Epley",desc:"kanał tylny",gen:epley},
  semont:{label:"Semont",desc:"kanał tylny",gen:semont},
  lempert:{label:"Lempert (BBQ)",desc:"kanał poziomy",gen:lempert},
  gufoniGeo:{label:"Gufoni (geotropowy)",desc:"kanał poziomy",gen:gufoniGeo},
  gufoniApo:{label:"Gufoni (apogeotropowy)",desc:"kanał poziomy",gen:gufoniApo},
  yacovino:{label:"Yacovino",desc:"kanał przedni",gen:yacovino},
};
const CANALS={
  posterior:{label:"Kanał tylny",note:"najczęstszy (~85%)",color:"var(--post)",maneuvers:["epley","semont"]},
  horizontal:{label:"Kanał poziomy",note:"~10%",color:"var(--horiz)",maneuvers:["lempert","gufoniGeo","gufoniApo"]},
  anterior:{label:"Kanał przedni",note:"rzadki (~1–2%)",color:"var(--ant)",maneuvers:["yacovino"]},
};

/* ============ Testy diagnostyczne ============ */
// Kierunki oczopląsu dla wszystkich testów (Dix–Hallpike, Roll, Bow & Lean) wynikają z
// geometrii (silnik Vestibular): orientacja głowy → grawitacja → przepływ → prawo Ewalda.
function nysFromGeom(canal, side, variant, q, strengthMode){
  const r = Vestibular.position({canal, side, variant, q});
  // 'asym' (Roll): amplituda lateralizuje (Ewald II — hamowanie słabsze);
  // 'flat' (Bow & Lean, Dix): lateralizacja przez kierunek
  const strength = strengthMode==="asym" ? (r.excited?1:0.45) : 1;
  // kierunek NA EKRANIE z KAMERY obserwatora (diagnostyka: 'frontal' — lustro):
  // poziomy beat biegnie wzdłuż osi międzyusznej → ekran-x = h·cam.right[0];
  // skręt odbija się tak samo jak poziom (lustro horyzontalne).
  const camRx = Scene3D.CAMERAS.frontal.right[0];
  return {
    kind: canal==="horizontal" ? "horizontal" : "upbeatTorsional",
    dir:  canal==="horizontal" ? Math.sign((r.h||0)*camRx) : Math.sign((r.t||0)*camRx),
    vdir: Math.sign(r.v||0) || 1,   // kierunek pionowy z silnika (frontal nie odwraca pionu)
    strength,
    persistent: variant==="cupulo",
    canal, side, q,                 // do dynamiki ξ(t): diagnostyka używa realnej pozycji
    anat: {h:r.h, v:r.v, t:r.t}     // anatomiczne składowe (±1) do animacji dialu (widok z tyłu)
  };
}

// Frontalny obiekt oczopląsu dla kroku terapeutycznego (Repozycja) z headNys.
// PEŁNE WYPROWADZENIE Z EWALDA: kierunek + intensywność + ODWRÓCENIE z dynNystagmus(canal, side, ξ).
// ξ (ze znakiem) pochodzi z fizyki (ciągła symulacja / provoke) — NIE z ręcznej annotacji ear/intensity.
// dynNystagmus: kierunek = quickPhase × sign(ξ) (ξ<0 = hamowanie → odwrócenie), intensywność = |ξ|·(ξ>0?1:0.45) (Ewald II).
function nysFromDyn(canal, side, xiPeak){
  const N = Vestibular.dynNystagmus(canal, side, xiPeak);   // {excited, intensity, h, v, t}
  const camRx = Scene3D.CAMERAS.frontal.right[0];
  const horizontal = canal==="horizontal";
  const rev = !N.excited && Math.abs(xiPeak) > 0.03;        // hamowanie → oczopląs odwrócony
  const weak = N.intensity < 0.5;
  const base = horizontal ? "oczopląs poziomy"
             : canal==="anterior" ? "oczopląs ↓ (downbeat)" : "oczopląs ↑ + skrętny";
  const label = base + (rev ? " — ODWRÓCONY" : "") + (weak ? " (słaby)" : "");
  return {
    kind: horizontal ? "horizontal" : "upbeatTorsional",
    dir:  horizontal ? Math.sign((N.h||0)*camRx) : Math.sign((N.t||0)*camRx),
    vdir: Math.sign(N.v||0) || 1,
    strength: N.intensity,                    // FIZYKA (nie annotacja)
    excited: N.excited, reversed: rev,
    persistent: false, canal, side,
    anat: {h:N.h, v:N.v, t:N.t},              // do dialu (widok z góry)
    label
  };
}

// pozycja prowokująca kanał (konwencje silnika) — wejście do dynamiki ξ(t)
function provokeQ(canal, side){
  if(canal==="horizontal") return Vestibular.qSupineYaw(side==="P"? 90 : -90); // ucho chore w dół
  if(canal==="anterior")  return Vestibular.qSupineYaw(0);                      // głębokie odchylenie (strona przez skręt)
  return Vestibular.qSupineYaw(side==="P"? 45 : -45);                           // tylny (Dix-Hallpike)
}
// przebieg ξ(t) z silnika: kanalolitiaza = PRZEJŚCIOWY (wygasa, cząstka wychodzi, NIE wraca);
// kupulolitiaza = uporczywy (trzyma się, dopóki pozycja utrzymana).
function engineXi(canal, side, persistent, q){
  const timeline=[{q: q||provokeQ(canal,side), tTrans:0.5, tHold: persistent?18:40}];
  return persistent
    ? Vestibular.simulateCupulolith({canal, side, timeline})
    : Vestibular.simulateCanalith({canal, side, timeline});
}
// znormalizowana obwiednia czasowa z ξ(t): env(sekundy)∈[0,1] oraz tEnd (gdy |ξ|<3% szczytu po szczycie)
function xiEnvelope(sim){
  let peak=1e-6; for(const s of sim) peak=Math.max(peak, Math.abs(s.xi));
  const dt = sim.length>1 ? (sim[1].t - sim[0].t) : 0.05;
  const lastT = sim.length ? sim[sim.length-1].t : 0;
  let tEnd=lastT; for(let i=sim.length-1;i>=0;i--){ if(Math.abs(sim[i].xi)>=0.03*peak){ tEnd=sim[i].t; break; } }
  const env = ts => { if(ts<=0) return 0; const idx=Math.min(sim.length-1, Math.max(0, Math.round(ts/dt))); const s=sim[idx]; return s? Math.min(1, Math.abs(s.xi)/peak) : 0; };
  return {env, tEnd, peak};
}

/* ============ Manewry jako sekwencje orientacji 3D (timeline kwaternionów) ============
   Wejście do symulacji dynamiki: każdy krok manewru → orientacja głowy (head→świat) jako
   kwaternion, zgodnie z modelem "orientacja głowy = orientacja ciała ∘ skręt szyi".
   simulateCanalith używa WYŁĄCZNIE gHead (grawitacji w ramce głowy), więc krok definiujemy
   przez docelowy gHead, a kwaternion budujemy funkcją qFromG. Konwencja ramki głowy:
   x=prawe ucho, y=czaszka (+czubek), z=nos. Pozycje "nos w dół" mają składową +czaszka
   (czubek głowy opada → otolit przenoszony przez odnogę wspólną = krok kuracyjny).
   Walidacja offline (cząstka osiąga φ=178°=wyjście, obie strony):
     Epley ✓ · Yacovino ✓ · Lempert ✓ · Semont ✓ · Gufoni geotropowy ✓
     Gufoni apogeotropowy ✗ — POPRAWNIE: to manewr KONWERSJI (apo→geo), nie czyści wprost. */
function qFromG(g){                                   // kwaternion head→świat t.że gHead(q)=g
  const a=[0,-1,0], n=Math.hypot(g[0],g[1],g[2])||1, b=[g[0]/n,g[1]/n,g[2]/n];
  const d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  if(d>0.9999) return [1,0,0,0];
  if(d<-0.9999) return [0,1,0,0];
  const c=[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const q=[1+d,c[0],c[1],c[2]], m=Math.hypot(q[0],q[1],q[2],q[3]);
  return Vestibular.qconj([q[0]/m,q[1]/m,q[2]/m,q[3]/m]);
}
const rotYg=(g,deg)=>{ const r=deg*Math.PI/180, c=Math.cos(r), s=Math.sin(r); // obrót grawitacji wokół osi czaszki (skręt szyi)
  return [g[0]*c+g[2]*s, g[1], -g[0]*s+g[2]*c]; };
// grawitacja w ramce głowy dla yaw=0 (skręt nakładany osobno)
const BASE_G={ "sit|fwd":[0,-1,0], "sit|down":[0,0.9,0.45], "sit|up":[0,-0.5,-0.85],
  "prone|down":[0,0.3,0.95], "sideL|fwd":[-1,0,0], "sideR|fwd":[1,0,0],
  "sideL|down":[-0.5,0.6,0.6], "sideR|down":[0.5,0.6,0.6], "sideL|up":[-0.6,-0.5,-0.6], "sideR|up":[0.6,-0.5,-0.6],
  "sitFront|fwd":[0,-1,0] };
// Semont (rzuty boczne leanL/leanR) — gHead KOŃCOWE (skręt szyi wbudowany), lustro wg strony.
// |down: nos ~46° POD poziomem (składowa nosa 0.72) — twarz wyraźnie ku podłodze/materacowi (rzut skośny
// pokazuje wtedy tył/czubek głowy). Zweryfikowane: Semont dalej CZYŚCI L i P (φ→178); audyt #1 zachowany
// (composeHead czerpie z LEAN_G → gHead(composeHead)==stepGravity). Było [±0.4,0.85,0.3] (nos ~18°, mylący profil w górę).
const LEAN_G={ "leanL|up":[0.5,-0.2,-0.8], "leanR|up":[-0.5,-0.2,-0.8],
  "leanR|down":[-0.35,0.6,0.72], "leanL|down":[0.35,0.6,0.72] };
// Yacovino krok 3: leżenie supine + DOGIĘCIE głowy do przodu (broda do klatki) — osobna orientacja,
// nie generyczne supine. Ta sama q dla stepHeadQ (fizyka) i composeHead (render) → zero rozjazdu (audyt #1).
const SUPINE_PITCH={ supineChin:-75 };   // ° doginania wokół osi ucha: −75° = z ~30° odgięcia (deep-hang) do ~45° przygięcia; gHead≈[0,1,−0.09], czyści anterior
function supineHeadQ(body, yaw){          // orientacja głowy dla póz supine (opcjonalny pitch brody)
  const q=Vestibular.qSupineYaw(yaw), p=SUPINE_PITCH[body];
  return p ? Vestibular.qmul(q, Vestibular.qaxis([1,0,0], p)) : q;
}
function stepGravity(body, yaw, face){               // gHead dla kroku manewru
  if(body.startsWith("supine")) return Vestibular.rotate(Vestibular.qconj(supineHeadQ(body,yaw)), [0,-1,0]);  // supineHang/Flex/Flat/Chin
  const key=body+"|"+face;
  if(body==="leanL"||body==="leanR") return LEAN_G[key]||[0,-1,0];   // yaw wbudowany
  const g=BASE_G[key]||BASE_G[body+"|fwd"]||[0,-1,0];
  return rotYg(g, -yaw);
}
function stepHeadQ(body, yaw, face){                  // orientacja głowy (head→świat) dla kroku
  return body.startsWith("supine") ? supineHeadQ(body,yaw) : qFromG(stepGravity(body,yaw,face));
}
// ===== MODEL 3D — Krok 1: orientacja CIAŁA + złożenie głowy = ciało ∘ pitch(twarz) ∘ skręt szyi(yaw) =====
// Zgodne z silnikiem: gHead(composeHead) == stepGravity (zweryfikowane offline dla wszystkich kombinacji).
// Daje też POPRAWNY roll anatomiczny (w przeciwieństwie do qFromG, gdzie roll jest dowolny) — to jest
// niezbędne do rzutu szkieletu 3D (Krok 2-3). Na razie NIE podłączone do renderu.
const BODY_Q = {                                     // orientacja głowy (head→świat) przy neutralnej twarzy, yaw=0
  sit:[1,0,0,0], sitFront:[1,0,0,0],
  sideL:Vestibular.qaxis([0,0,1],90), sideR:Vestibular.qaxis([0,0,1],-90),
  prone:Vestibular.qmul(Vestibular.qaxis([0,0,1],180),Vestibular.qaxis([1,0,0], Math.atan2(-BASE_G["prone|down"][2],BASE_G["prone|down"][1])*180/Math.PI))   // twarz w dół; pitch WYPROWADZONY z BASE_G["prone|down"] → gHead(composeHead)==stepGravity (było -107.5°, rozjazd 35° — audyt #1)
};
const BODY_NEUTRAL = { sit:"fwd", sitFront:"fwd", sideL:"fwd", sideR:"fwd", prone:"down" };
function qFromToVec(a,b){                             // najkrótsza rotacja wektora a→b (samo normalizuje wejście)
  const la=Math.hypot(a[0],a[1],a[2])||1, lb=Math.hypot(b[0],b[1],b[2])||1;
  a=[a[0]/la,a[1]/la,a[2]/la]; b=[b[0]/lb,b[1]/lb,b[2]/lb];
  const d=Math.max(-1,Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  if(d>0.99999) return [1,0,0,0];
  const cx=[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const cl=Math.hypot(cx[0],cx[1],cx[2]);
  if(cl<1e-6) return Vestibular.qaxis(Math.abs(a[0])>0.9?[0,1,0]:[1,0,0], 180);  // antyrównoległe
  return Vestibular.qaxis([cx[0]/cl,cx[1]/cl,cx[2]/cl], Math.acos(d)*180/Math.PI);
}
function headPitchQ(body,face){                      // pitch szyi: neutral→face (z BASE_G); rotate(qconj(P),g0)=gFace
  const n=BODY_NEUTRAL[body]; if(!n||face===n) return [1,0,0,0];
  const g0=BASE_G[body+"|"+n], gf=BASE_G[body+"|"+face]; if(!g0||!gf) return [1,0,0,0];
  return Vestibular.qconj(qFromToVec(g0, gf));
}
function composeHead(body,yaw,face){                 // orientacja głowy (head→świat) z ciała+pitch+szyi
  if(body.startsWith("supine")) return supineHeadQ(body,yaw);                   // = qSupineYaw (+ pitch brody dla supineChin)
  if(body==="leanL"||body==="leanR"){                                          // Semont: głowa leżąca na boku; grawitacja = LEAN_G (źródło prawdy silnika)
    const T=TORSO_Q[body], g=LEAN_G[body+"|"+face]||[0,-1,0];                   // roll z tułowia-na-boku + minimalna korekta orientacji do grawitacji kroku
    return Vestibular.qmul(T, qFromToVec(g, Vestibular.gHead(T)));              // gHead(composeHead)==LEAN_G z konstrukcji (było skręt 45°, rozjazd 17.6°/59.9° — audyt #1)
  }
  const B=BODY_Q[body]||[1,0,0,0];
  return Vestibular.qmul(Vestibular.qmul(B, headPitchQ(body,face)), Vestibular.qaxis([0,1,0],yaw));
}
// ===== MODEL 3D — Krok 2: szkielet (offsety stawów w układzie ciała) + kinematyka prosta (FK) =====
// Układ ciała: x=prawo, y=góra(czaszka), z=przód(brzuch/nos). Długości spójne z figSide.
// Drzewo stawów [nazwa, rodzic, offset-w-ramce-rodzica] dla NEUTRALNEJ postawy (stojąca/wyprostowana).
const SK={torso:42,neck:15,head:15,thigh:33,shin:29,foot:11,uarm:25,farm:23,shHalf:13,hipHalf:9};
const SKEL=[
  ["pelvis",null,[0,0,0]],
  ["spine","pelvis",[0,SK.torso,0]], ["neckBase","spine",[0,0,0]], ["neck","neckBase",[0,SK.neck,0]], ["head","neck",[0,SK.head,0]],
  ["shL","spine",[-SK.shHalf,0,0]], ["shR","spine",[SK.shHalf,0,0]],
  ["elbL","shL",[0,-SK.uarm,0]], ["elbR","shR",[0,-SK.uarm,0]],
  ["handL","elbL",[0,-SK.farm,0]], ["handR","elbR",[0,-SK.farm,0]],
  ["hipL","pelvis",[-SK.hipHalf,0,0]], ["hipR","pelvis",[SK.hipHalf,0,0]],
  ["kneeL","hipL",[0,-SK.thigh,0]], ["kneeR","hipR",[0,-SK.thigh,0]],
  ["ankL","kneeL",[0,-SK.shin,0]], ["ankR","kneeR",[0,-SK.shin,0]],
  ["toeL","ankL",[0,0,SK.foot]], ["toeR","ankR",[0,0,SK.foot]]
];
// kinematyka prosta: rot = {nazwaStawu: lokalny kwaternion}; offset stawu obracany rotacją RODZICA,
// rotacja stawu wpływa na potomków (worldRot[n]=worldRot[rodzic] ∘ lokalny[n]). Zwraca pozycje 3D w ramce ciała.
function fkJoints(rot){
  const pos={}, wr={};
  for(const seg of SKEL){ const n=seg[0], p=seg[1], o=seg[2];
    const pr=p?wr[p]:[1,0,0,0], pp=p?pos[p]:[0,0,0], lr=(rot&&rot[n])||[1,0,0,0];
    wr[n]=Vestibular.qmul(pr,lr);
    const ro=Vestibular.rotate(pr,o);
    pos[n]=[pp[0]+ro[0], pp[1]+ro[1], pp[2]+ro[2]];
  }
  return pos;
}
// artykulacja per klasa ciała (kąty stawów). Pozostałe wyprostowane — orientację w przestrzeni daje TORSO_Q.
const POSE3D={
  sit:{ hipL:Vestibular.qaxis([1,0,0],-90), hipR:Vestibular.qaxis([1,0,0],-90),
        kneeL:Vestibular.qaxis([1,0,0],90), kneeR:Vestibular.qaxis([1,0,0],90) }, // siad na krawędzi: uda w przód, podudzia w dół
  sitFront:{}, supine:{}, side:{}, prone:{}, lean:{}   // sitFront: nogi w dół (widok z przodu)
};
// orientacja TUŁOWIA (torso→świat) per ciało. Głowa osobno przez composeHead (Krok 3).
const TORSO_Q={
  sit:[1,0,0,0], sitFront:[1,0,0,0],
  sideL:Vestibular.qmul(Vestibular.qaxis([0,0,1],90), Vestibular.qaxis([1,0,0],-90)),   // na boku: supine + roll wokół osi długiej
  sideR:Vestibular.qmul(Vestibular.qaxis([0,0,1],-90),Vestibular.qaxis([1,0,0],-90)),
  prone:Vestibular.qmul(Vestibular.qaxis([0,0,1],180),Vestibular.qaxis([1,0,0],-90)),   // na brzuchu = supine + obrót 180° wokół osi długiej: twarz w dół, głowa NIE odwrócona
  supineHang:Vestibular.qaxis([1,0,0],-90), supineFlex:Vestibular.qaxis([1,0,0],-90), supineFlat:Vestibular.qaxis([1,0,0],-90), supineChin:Vestibular.qaxis([1,0,0],-90),
  leanL:Vestibular.qaxis([0,0,1],-90), leanR:Vestibular.qaxis([0,0,1],90)   // Semont: POZIOME leżenie na boku (widok odgórny); leanL=prawy bok w dół, leanR=lewy bok w dół
};
// kąt szyi per ciało (stopnie, wokół osi usznej x): <0 = wyprost (głowa do tyłu/zwis), >0 = zgięcie (broda do mostka).
// Wszystkie supine* mają identyczny gHead (silnik ich nie różnicuje) → różnica Hang/Flex/Flat jest TU, w pozie szyi.
const NECK_DEG={ supineHang:-34, supineFlex:28, supineFlat:12, supineChin:45 };   // supineChin: kark mocno przygięty do przodu (broda do klatki)
function bodyClass(b){ return b.startsWith("supine")?"supine":(b==="sideL"||b==="sideR")?"side":(b==="leanL"||b==="leanR")?"lean":b; }
function bodyJoints(body,face){                       // pozycje 3D stawów po orientacji w przestrzeni (pre-kamera)
  const pose=Object.assign({}, POSE3D[bodyClass(body)]||{});
  let nd=(NECK_DEG[body]||0);                          // wyprost/zgięcie szyi (<0 wyprost, >0 zgięcie do klatki)
  if(body==="sit"){ if(face==="down") nd+=30; else if(face==="up") nd-=30; }   // dynamiczny kark (Yacovino): broda do klatki / odchylenie
  if(nd) pose.neckBase=Vestibular.qaxis([1,0,0], nd);
  if(body==="leanL"||body==="leanR"){                  // Semont: z czysto odgórnej kamery L/R kończyny rzutują się NA SIEBIE
    const up=body==="leanL"?"L":"R";                    // (ten sam ekranowy x,y, różni je tylko głębia) — bez tego nie widać,
    pose["sh"+up]=Vestibular.qaxis([1,0,0], face==="down"?100:-100);  // który bok leży na dole. Górną (widoczną) rękę wychylamy:
  }                                                     // krok 2 (nos w górę) KU GÓRZE, krok 3 (nos w dół/twarz w materac) W DÓŁ; dolna prosta/schowana.
  const local=fkJoints(pose), TQ=TORSO_Q[body]||[1,0,0,0], out={};
  for(const k in local) out[k]=Vestibular.rotate(TQ, local[k]);
  return out;
}
// Strzałka „do ziemi": rzut grawitacji kroku na ekran widoku frontalnego (right=-x, up=y → SVG y w dół)
function gravArrowFor(body, yaw, face){
  const g = stepGravity(body, yaw, face);
  const dx = -g[0], dy = -g[1], mag = Math.hypot(dx, dy);
  if(mag <= 0.15) return "";                          // grawitacja niemal wzdłuż osi nos-potylica → brak kierunku w płaszczyźnie
  const ang = (Math.atan2(dy, dx)*180/Math.PI).toFixed(1);
  return `<div class="gravmark" title="kierunek do ziemi"><svg viewBox="0 0 24 24" fill="none"><g transform="rotate(${ang} 12 12)"><line x1="4" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M13 7l5 5-5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>ziemia</div>`;
}
// ikona „obróć kartę" (flip) — używana w Repozycji i Diagnostyce
const FLIP_ICO = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 8a8 8 0 0 1 13-2.5M20 16a8 8 0 0 1-13 2.5M17 3v4h-4M7 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// ROZMIAR ZŁOGU (UI) — mnożnik promienia r, SPÓJNY z SIZE_R w module Vestibular.
const SIZE_LABELS={small:"mała", medium:"średnia", big:"duża"};
const SIZE_NOTE={small:"drobne/wolno osiadające", medium:"typowe", big:"duże/ciężkie"};
const sizeRadius=s=>({small:0.78, medium:1.0, big:1.35})[s]!==undefined?({small:0.78, medium:1.0, big:1.35})[s]:1;
// Klinicznie zalecany hold kroku wg rozmiaru: małe (wolno osiadające) złogi wymagają DŁUŻSZEGO utrzymania
// pozycji (uzasadnienie ~30 s holdów w CRP: Hain, Squires & Stone 2005). medium/big = bez zmian (bezpieczne).
const holdMult=s=> s==="small"?1.6:1;
function sizedSeconds(sec, size){ if(sec==null) return null; const v=sec*holdMult(size); return Math.max(15, Math.min(120, Math.round(v/15)*15)); }
// oś czasu manewru: [{q,tTrans,tHold}] — wejście do simulateCanalith/Cupulolith
function maneuverTimeline(plan, size="medium"){
  const r=sizeRadius(size), cap = r>=1 ? 12 : Math.round(12/(r*r));   // małe złogi osiadają wolniej → dłuższy hold dynamiki (medium/big=12, regresja)
  return plan.steps.map(st=>({
    q: stepHeadQ(st.body, st.yaw, st.face),
    tTrans: 0.8,
    tHold: Math.max(6, Math.min(cap, st.seconds!=null ? st.seconds : 6))   // ograniczone do dynamiki (cząstka i tak osiada)
  }));
}
// pełna symulacja manewru → φ(t) cząstki w kanale (dynamika repozycji)
function maneuverSim(plan, size="medium"){
  return Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, timeline:maneuverTimeline(plan,size), size});
}
// v: "canalo" (kanalolitiaza / geotropowy) | "cupulo" (kupulolitiaza / apogeotropowy)
const featsByVariant = v => v==="canalo"
  ? ["Latencja 1–5 s","Przemijający (<60 s)","Wyczerpuje się"]
  : ["Bez latencji","Uporczywy (>60 s)","Nie wyczerpuje się"];

const DIAG={
  dix:{ name:"Manewr Dix–Hallpike", tests:"kanał tylny", canal:"posterior",
    intro:"Z siadu obróć głowę 45° w stronę badaną, połóż szybko na plecach z głową odchyloną ~20° poniżej poziomu.",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Postać klasyczna (kanalolitiaza): złóg swobodny w kanale tylnym po stronie ${SIDE[A]}.`
      : `Postać rzadka (kupulolitiaza): złóg na osklepku kanału tylnego — oczopląs uporczywy.`,
    phases:(A,v)=>[{
      ptitle:"Strona chora w dole", ppos:"Na plecach, głowa 45° ku stronie chorej, ~20° poniżej poziomu",
      body:"supineHang", yaw:yawToA(A), face:"up",
      nys: nysFromGeom("posterior", A, v, Vestibular.qSupineYaw(A==="P"?45:-45)),
      label:`ku górze + skrętny ku uchu choremu (${SIDE[A]})`,
      note: v==="canalo"
        ? "po latencji, narasta i wygasa; wyczerpuje się przy powtórzeniu."
        : "bez latencji, uporczywy, nie wyczerpuje się przy powtórzeniu."
    }]
  },
  roll:{ name:"Test pozycyjny (Roll / Pagnini–McClure)", tests:"kanał poziomy", canal:"horizontal",
    intro:"Pacjent na plecach, głowa zgięta ~30°. Obróć głowę szybko w jedną, potem w drugą stronę.",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Geotropowy: strona chora = SILNIEJSZA reakcja → ${SIDE[A]}.`
      : `Apogeotropowy: strona chora = SŁABSZA reakcja przy uchu w dole → ${SIDE[A]}.`,
    phases:(A,v)=>{ const H=otherSide(A), geo=(v==="canalo");
      const mk=down=>{ const up=otherSide(down);
        const strong = geo ? (down===A) : (down===H);
        return {ptitle:`Ucho ${down==="L"?"lewe":"prawe"} w dole`, ppos:`Głowa obrócona 90° ku stronie ${SIDE[down]}`,
          body:"supineFlex", yaw: down==="P"?90:-90, face:"up",
          nys: nysFromGeom("horizontal", A, v, Vestibular.qSupineYaw(down==="P"?90:-90), "asym"),
          label: geo ? `geotropowy — ku uchu w dole (${SIDE[down]})` : `apogeotropowy — ku uchu w górze (${SIDE[up]})`,
          note: strong ? "Reakcja silniejsza w tej pozycji." : "Reakcja słabsza w tej pozycji."};
      };
      return [mk(A), mk(H)];
    }
  },
  bowlean:{ name:"Test Bow & Lean (skłon i odchylenie)", tests:"kanał poziomy — lateralizacja", canal:"horizontal",
    intro:"W siadzie wykonaj skłon głowy w przód (bow), następnie odchylenie do tyłu (lean).",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Geotropowy: skłon (bow) bije ku stronie chorej → ${SIDE[A]}.`
      : `Apogeotropowy: kierunki odwrócone — skłon bije ku stronie zdrowej.`,
    phases:(A,v)=>{ const H=otherSide(A), geo=(v==="canalo");
      return [
        {ptitle:"Skłon w przód (bow)", ppos:"Siad, broda do klatki",
         body:"sit", yaw:0, face:"down",
         nys: nysFromGeom("horizontal", A, v, Vestibular.qPitch(90), "flat"),
         label: geo?`bije ku stronie chorej (${SIDE[A]})`:`bije ku stronie zdrowej (${SIDE[H]})`,
         note: geo?"Geotropowy: skłon wskazuje stronę chorą.":"Apogeotropowy: kierunek odwrócony."},
        {ptitle:"Odchylenie do tyłu (lean)", ppos:"Siad, głowa odchylona do tyłu",
         body:"sit", yaw:0, face:"up",
         nys: nysFromGeom("horizontal", A, v, Vestibular.qPitch(-90), "flat"),
         label: geo?`bije ku stronie zdrowej (${SIDE[H]})`:`bije ku stronie chorej (${SIDE[A]})`,
         note: geo?"Przy odchyleniu kierunek odwraca się (ku zdrowej).":"Apogeotropowy: odchylenie bije ku chorej."},
      ];
    }
  },
  headhang:{ name:"Test deep head-hang", tests:"kanał przedni", canal:"anterior",
    intro:"Z siadu połóż pacjenta szybko na plecach z głową głęboko odchyloną w tył (~30° poniżej poziomu) — prosto, bez obrotu.",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Kanalolitiaza kanału przedniego: oczopląs ku dołowi — czysty downbeat. Lateralizacja oczopląsem NIEWIARYGODNA (torsja śladowa/nieobecna) — stronę różnicuj reakcją na manewr i kontekstem klinicznym.`
      : `Kupulolitiaza kanału przedniego (bardzo rzadka): downbeat uporczywy, bez latencji. Strony nie da się pewnie ustalić oczopląsem.`,
    phases:(A,v)=>[{
      ptitle:"Głowa głęboko w tył", ppos:"Na plecach, głowa prosto, głęboko odchylona (~30° poniżej poziomu)",
      body:"supineHang", yaw:0, face:"up",
      nys: nysFromGeom("anterior", A, v, Vestibular.qSupineYaw(0)),
      label:`ku dołowi — czysty downbeat (bez wyraźnej torsji)`,
      note: v==="canalo"
        ? "po latencji: czysty downbeat, narasta i wygasa, wyczerpuje się przy powtórzeniu. Oczopląsu nie używaj do ustalenia strony — torsja bywa śladowa/nieobecna."
        : "bez latencji, downbeat, uporczywy, nie wyczerpuje się przy powtórzeniu."
    }]
  },
};
function variantLabels(canal){
  return canal==="horizontal"
    ? {canalo:"Kanalolitiaza (geotropowy)", cupulo:"Kupulolitiaza (apogeotropowy)"}
    : {canalo:"Kanalolitiaza", cupulo:"Kupulolitiaza (rzadko)"};
}
// dobór manewru leczniczego na podstawie testu + wariantu
function recommend(testKey,variant){
  if(testKey==="dix"){
    return variant==="canalo"
      ? {primary:"epley",alts:["semont"],note:"Kanalolitiaza kanału tylnego — preferowany manewr Epleya; alternatywnie Semont."}
      : {primary:"semont",alts:["epley"],note:"Kupulolitiaza kanału tylnego (rzadka) — preferowany manewr uwalniający Semonta."};
  }
  if(testKey==="headhang"){
    return variant==="canalo"
      ? {primary:"yacovino",alts:[],note:"Kanalolitiaza kanału przedniego — manewr Yacovino (deep head-hang → szybki ruch brody do klatki). Kanał przedni jest rzadki; oczopląs to czysty downbeat — strony nie ustalisz oczopląsem, różnicuj kontekstem i reakcją na manewr."}
      : {primary:"yacovino",alts:[],note:"Kupulolitiaza kanału przedniego (bardzo rzadka) — postępowanie jak w kanalolitiazie; rozważ ponowną ocenę i wykluczenie przyczyny ośrodkowej (izolowany downbeat)."};
  }
  // roll / bowlean → kanał poziomy
  return variant==="canalo"
    ? {primary:"lempert",alts:["gufoniGeo"],note:"Geotropowy (kanalolitiaza) kanału poziomego — rolka Lemperta ku stronie zdrowej lub manewr Gufoniego (geotropowy)."}
    : {primary:"gufoniApo",alts:["lempert"],note:"Apogeotropowy (kupulolitiaza) — manewr Gufoniego (apogeotropowy) przekształca postać w geotropową; następnie ponowny test i leczenie postaci geotropowej."};
}

/* ============ Stan ============ */
const state={
  mode:"treat", screen:"setup",
  side:"P", canal:null, maneuverKey:null, testKey:null, variant:"canalo", dixObs:"post",
  size:"medium",                                   // rozmiar/gęstość złogu otoconiów (small|medium|big) → dynamika + holdy + animacja
  plan:null, step:0,
  total:0, elapsedMs:0, running:false,
  _manKey:null, _manSim:null,
  autoAdvance:false, sound:true, autostart:false,
  // HINTS / różnicowanie (etap: silnik NeuroVOR)
  hintsScenario:"neuritisR", hintsSide:"P", hintsFix:false, hintsGaze:0,   // scenariusz(engine key) · ucho zajęte neuronitis(L/P) · fiksacja · spojrzenie(-1/0/+1)
  hintsComp:0, hintsRecovery:false, hintsHitSide:null,       // kompensacja ośrodkowa c(0..1) · regeneracja (Bechterew) · ostatnio pchnięte ucho — etap 6
  // „Matematyczny pacjent" (etap 7 / faza UI). hintsCustom = pełny obiekt makePatient (null → tryb scenariuszowy).
  hintsCustom:null, hintsAdvanced:false, hintsQuiz:false, hintsQuizReveal:false,
  hintsNerveEar:"P", hintsNerveBranch:"superior", hintsNerveSev:0.6,   // szybki selektor wypadnięcia gałęzi nerwu
  hintsPreset:null,                                // aktywny preset/tryb (klucz HINTS_PRESETS lub "neuritis") — podświetlenie + dynamiczna ramka
  hintsPlane:"HC", hintsHitCanal:"horizontal",     // vHIT: wybrana płaszczyzna (HC/RALP/LARP) · kanał ostatniego pchnięcia
  hintsSCDS:null,                                  // SCDS: ostatni bodziec (obiekt pressureStimulus) lub null
};

/* ============ rAF rejestr ============ */
let animFrames=[];
let _otoStart=null;   // start animacji wędrówki otolitu (moduł, by dało się ją zrestartować przy flipie karty)
function cancelAnims(){ animFrames.forEach(id=>cancelAnimationFrame(id)); animFrames=[]; }
function loopRAF(fn){ // fn(now) -> true aby kontynuować
  const idx=animFrames.length;
  const tick=(now)=>{ if(fn(now)){ animFrames[idx]=requestAnimationFrame(tick); } };
  animFrames.push(requestAnimationFrame(tick));
}
const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp=(a,b,t)=>a+(b-a)*t;

/* ============ Wake Lock — ekran nie gaśnie podczas odliczania manewru ============
   W3C Screen Wake Lock API: bez wtyczek/zależności; działa w WebView Capacitora (kontekst https)
   i w przeglądarce po http(s)/localhost. Wymaga secure context (po file:// milcząco nieaktywny).
   Blokada aktywna WYŁĄCZNIE gdy licznik biegnie (state.running); zwalniana przy pauzie/resecie/końcu/
   wyjściu. System zwalnia blokadę po zejściu apki w tło → ponawiamy przy powrocie, jeśli licznik trwa. */
let _wakeLock=null;
async function acquireWake(){
  try{ if('wakeLock' in navigator && !_wakeLock){
    _wakeLock = await navigator.wakeLock.request('screen');
    _wakeLock.addEventListener('release', ()=>{ _wakeLock=null; });
  } }catch(e){ /* nieobsługiwane / odrzucone → brak działania */ }
}
async function releaseWake(){ try{ const w=_wakeLock; _wakeLock=null; if(w) await w.release(); }catch(e){} }
function syncWake(){ if(state.running) acquireWake(); else releaseWake(); }   // spina blokadę ze stanem licznika
document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible' && state.running) acquireWake(); });

/* ============ SVG: głowa z góry ============ */
function headDial(yaw,face,headCamera,nys){
  // obserwator jako KAMERA: plan podaje wprost klucz kamery (headCamera), domyślnie widok od przodu-z-góry (audyt #6)
  const cam = Scene3D.CAMERAS[headCamera] || Scene3D.CAMERAS.topDownFront;
  const qH = Vestibular.qaxis([0,1,0], yaw);                       // orientacja głowy z yaw
  const rot = Scene3D.screenAngleCW(Scene3D.project(Scene3D.HEAD_POINTS.nose, qH, cam));  // obrót schematu = kąt nosa
  const el = Scene3D.project(Scene3D.HEAD_POINTS.earL, [1,0,0,0], cam);   // strony z rzutu uszu (niezależne od yaw)
  const er = Scene3D.project(Scene3D.HEAD_POINTS.earR, [1,0,0,0], cam);
  const leftLab  = el.x < er.x ? "L" : "P";
  const rightLab = el.x < er.x ? "P" : "L";
  const ring=face==="down"?"#FF9FBD":"#9FE3F6";
  const feat="#CFEFFB";
  const faceLabel=face==="up"?"nos ku górze":face==="down"?"nos ku podłodze":"nos do przodu";
  const turnLabel=yaw>0?"obrót w prawo":yaw<0?"obrót w lewo":"na wprost";
  let nysNote="", h=180;
  if(nys){
    const strong=(nys.strength||0)>=0.5, revNote=nys.reversed?"(odwrócony — hamowanie)":"(geotropowy)";
    if(nys.canal==="horizontal"){
      nysNote = strong
        ? `<text x="70" y="186" text-anchor="middle" fill="var(--timer)" font-size="9" font-weight="600">oczopląs poziomy</text>
           <text x="70" y="197" text-anchor="middle" fill="var(--muted)" font-size="8.5">${revNote}</text>`
        : `<text x="70" y="188" text-anchor="middle" fill="var(--muted)" font-size="9">oczopląs poziomy słaby${nys.reversed?" ⟲":""}</text>`;
    } else {
      const arrow = nys.canal==="anterior" ? "↓" : "↑";
      const tors = nys.canal==="anterior" ? "" : " + skrętny";   // kanał przedni: czysty downbeat
      nysNote = strong
        ? `<text x="70" y="186" text-anchor="middle" fill="var(--timer)" font-size="9" font-weight="600">oczopląs ${arrow}${tors}</text>
           <text x="70" y="197" text-anchor="middle" fill="var(--muted)" font-size="8.5">(najsilniejszy)</text>`
        : `<text x="70" y="188" text-anchor="middle" fill="var(--muted)" font-size="9">oczopląs słaby / zanika</text>`;
    }
    h = strong?206:196;
  }
  return `<svg viewBox="0 0 140 ${h}" role="img" aria-label="Głowa: ${turnLabel}, ${faceLabel}">
    <text x="12" y="20" fill="var(--faint)" font-size="10" font-weight="700">${leftLab}</text>
    <text x="122" y="20" fill="var(--faint)" font-size="10" font-weight="700">${rightLab}</text>
    <circle cx="70" cy="74" r="50" fill="none" stroke="var(--line)" stroke-width="1.5"/>
    <g transform="rotate(${rot} 70 74)">
      <rect x="16" y="66" width="8" height="16" rx="3" fill="var(--faint)"/>
      <rect x="116" y="66" width="8" height="16" rx="3" fill="var(--faint)"/>
      <circle cx="70" cy="74" r="35" fill="#22303D" stroke="${ring}" stroke-width="2"/>
      <path d="M70 37 l9 15 h-18 z" fill="${ring}"/>
      <g class="dial-eye"><ellipse cx="60" cy="62" rx="5" ry="6.5" fill="#EAF6FC"/>
        <g class="dial-iris" data-cx="60" data-cy="62">
          <circle cx="60" cy="62" r="3.4" fill="#2b6b86"/><circle cx="60" cy="62" r="1.5" fill="#0c1922"/>
          <line x1="60" y1="62" x2="60" y2="56.5" stroke="#cfe3ee" stroke-width="1.3" stroke-linecap="round"/>
        </g></g>
      <g class="dial-eye"><ellipse cx="80" cy="62" rx="5" ry="6.5" fill="#EAF6FC"/>
        <g class="dial-iris" data-cx="80" data-cy="62">
          <circle cx="80" cy="62" r="3.4" fill="#2b6b86"/><circle cx="80" cy="62" r="1.5" fill="#0c1922"/>
          <line x1="80" y1="62" x2="80" y2="56.5" stroke="#cfe3ee" stroke-width="1.3" stroke-linecap="round"/>
        </g></g>
      <path d="M62 86 q8 7 16 0" stroke="${feat}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    </g>
    <text x="70" y="154" text-anchor="middle" fill="var(--text)" font-size="11" font-weight="600">${turnLabel}</text>
    <text x="70" y="171" text-anchor="middle" fill="var(--muted)" font-size="11">${faceLabel}</text>
    ${nysNote}
  </svg>`;
}
// Animator dialu per-faza (diagnostyka): te same tęczówki .dial-iris, ale w zakresie kontenera.
// Widok z tyłu (topDownBehind); kierunek z anatomicznych składowych silnika, obwiednia ξ(t).
function startDialNysIn(container, nys){
  const irises=[...container.querySelectorAll(".dial-iris")]; if(!irises.length) return;
  const token=(container.__dialTok=(container.__dialTok||0)+1);   // restart: starsza pętla się zakończy
  const cam=Scene3D.CAMERAS.topDownBehind, flip=cam.up[2]<0?-1:1;
  const a=nys.anat||{h:0,v:0,t:0}, amp=nys.strength||1;
  const hx=a.h*flip*2.2*amp, upY=a.v*2*amp, rot=a.t*flip*12*amp;   // poziom (odbity) / pion / skręt (odbity)
  const fast=0.17, T=720, start=performance.now();
  const {env, tEnd} = xiEnvelope(engineXi(nys.canal, nys.side, nys.persistent, nys.q));
  loopRAF((now)=>{
    if(container.__dialTok!==token || !document.body.contains(container)) return false;
    const elapsed=(now-start)/1000;
    if(elapsed>tEnd+0.4){ for(const g of irises) g.setAttribute("transform","translate(0 0) rotate(0)"); return false; }
    const e=env(elapsed), p=((now-start)%T)/T, o=nysOffset(p,fast)*e;
    for(const g of irises){ const cx=+g.dataset.cx, cy=+g.dataset.cy;
      g.setAttribute("transform",`translate(${(o*hx).toFixed(2)} ${(-o*upY).toFixed(2)}) rotate(${(o*rot).toFixed(2)} ${cx} ${cy})`); }
    return true;
  });
}
function startDialNys(nys,plan,envOv){
  const irises=[...document.querySelectorAll(".dial-iris")]; if(!irises.length) return;
  const a = nys.anat || {h:0,v:0,t:0};                  // kierunek Z FIZYKI (dynNystagmus), nie z annotacji
  // znak przeniesienia do ramki schematu wynika z KAMERY: obserwator z tyłu (nos ku dołowi
  // ekranu, up·nos<0) odbija składową poziomą i skrętną.
  const cam = Scene3D.CAMERAS[plan.headCamera] || Scene3D.CAMERAS.topDownFront;
  const flip = cam.up[2] < 0 ? -1 : 1, cH=flip, cT=flip;
  const amp = envOv ? 1 : (nys.strength||1);            // env historyczny niesie intensywność
  const hx=a.h*cH*2.2*amp, upY=a.v*2*amp, rot=a.t*cT*12*amp;  // pozioma / pionowa / skrętna
  const fast=0.17, T=720, start=performance.now();
  // ta sama OBWIEDNIA co karta oczu → oba widoki zsynchronizowane, jednorazowe (bez pętli)
  const {env, tEnd} = envOv || xiEnvelope(engineXi(nys.canal, nys.side, false, provokeQ(nys.canal, nys.side)));
  loopRAF((now)=>{
    if(!document.querySelector(".dial-iris")) return false;
    const elapsed=(now-start)/1000;
    if(elapsed>tEnd+0.4){ for(const g of irises) g.setAttribute("transform","translate(0 0) rotate(0)"); return false; }
    const e=env(elapsed), p=((now-start)%T)/T, o=nysOffset(p,fast)*e;
    for(const g of irises){ const cx=+g.dataset.cx, cy=+g.dataset.cy;
      g.setAttribute("transform",`translate(${(o*hx).toFixed(2)} ${(-o*upY).toFixed(2)}) rotate(${(o*rot).toFixed(2)} ${cx} ${cy})`); }
    return true;
  });
}
/* ============ SVG: głowa od tyłu (slajd 1 Epleya) ============ */
function backHeadSVG(){
  const HEAD="#22303D", line="#9FE3F6";
  return `<svg viewBox="0 0 140 150" role="img" aria-label="Głowa od tyłu — obrót w stronę chorą">
    <text x="12" y="18" fill="var(--faint)" font-size="10" font-weight="700">L</text>
    <text x="122" y="18" fill="var(--faint)" font-size="10" font-weight="700">P</text>
    <g id="backhead" transform="rotate(0 70 70)">
      <rect x="60" y="98" width="20" height="24" rx="7" fill="#2C3D4C"/>
      <rect x="29" y="62" width="9" height="18" rx="4" fill="var(--faint)"/>
      <rect x="102" y="62" width="9" height="18" rx="4" fill="var(--faint)"/>
      <circle cx="70" cy="70" r="36" fill="${HEAD}" stroke="${line}" stroke-width="2"/>
      <path d="M70 36 q11 34 0 66" stroke="${line}" stroke-width="2" fill="none" opacity=".45"/>
      <circle cx="70" cy="56" r="4.5" fill="${line}" opacity=".35"/>
    </g>
  </svg>`;
}
function startBackHeadTurn(container,dir){
  const g=container.querySelector("#backhead"); if(!g) return;
  const target=dir==="L"?-45:45, start=performance.now();
  loopRAF((now)=>{
    if(!document.body.contains(container)) return false;
    const t=((now-start)%3000)/3000;
    let a;
    if(t<0.4) a=target*easeInOut(t/0.4);
    else if(t<0.72) a=target;
    else a=target*(1-easeInOut((t-0.72)/0.28));
    g.setAttribute("transform",`rotate(${a.toFixed(2)} 70 70)`);
    return true;
  });
}

// twarz na głowie (oczy + nos) skierowana pod kątem; 0°=ku górze, rośnie zgodnie z ruchem wskazówek
// tył głowy (gdy twarz odwrócona od obserwatora): linia włosów + ucho, bez oczu/nosa
// profil głowy (nos w płaszczyźnie ekranu, np. supine twarzą do sufitu): nos = wierzchołek distalny, oko tuż pod nim
function profileMarks(cx,cy,r,noseDeg){
  const c="#06303B";
  return `<g transform="rotate(${noseDeg.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})">
    <path d="M${cx.toFixed(1)} ${(cy-r-4).toFixed(1)} l5 7 l-6 0 z" fill="${c}"/>
    <circle cx="${(cx-3).toFixed(1)}" cy="${(cy-6).toFixed(1)}" r="2.1" fill="${c}"/>
  </g>`;
}
// Bogata twarz (widok z przodu): oczy+nos+usta+ucho (skręt) dla twarzy; linia włosów+ucho dla tyłu.
// angle = obrót (z osi czaszki), dx = poziome przesunięcie rysów = skręt głowy 45° (dodatnie/ujemne).
function frontFace(cx,cy,r,angle,dx,faceUp){
  const c="#06303B";
  if(faceUp) return `<g transform="rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})">
    <rect x="${(cx-dx*2.4-2).toFixed(1)}" y="${(cy-4).toFixed(1)}" width="4" height="9" rx="2" fill="${c}" opacity=".5"/>
    <g transform="translate(${dx.toFixed(1)} 0)">
      <circle cx="${(cx-6).toFixed(1)}" cy="${(cy-3).toFixed(1)}" r="2.2" fill="${c}"/>
      <circle cx="${(cx+6).toFixed(1)}" cy="${(cy-3).toFixed(1)}" r="2.2" fill="${c}"/>
      <path d="M${cx.toFixed(1)} ${cy.toFixed(1)} l3.5 8 h-7 z" fill="${c}"/>
      <path d="M${(cx-7).toFixed(1)} ${(cy+10).toFixed(1)} q7 4 14 0" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g></g>`;
  return `<g transform="rotate(${angle.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})">
    <path d="M${(cx-r+3).toFixed(1)} ${(cy-4).toFixed(1)} q ${(r-3).toFixed(1)} ${(-(r+2)).toFixed(1)} ${(2*(r-3)).toFixed(1)} 0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="${(cx+dx).toFixed(1)}" cy="${(cy+5).toFixed(1)}" r="2.3" fill="${c}"/></g>`;
}
// Widok od przodu (Semont): obserwator na wprost pacjenta, ruchy na boki
// ===== Etap C: artykułowana sylwetka (widok z boku) — kapsuły (grube linie z zaokrąglonymi końcami) =====
// Prosta kinematyka prosta: kąty w stopniach ekranowych (0=prawo, 90=dół). Głowa = koniec szyi; twarz/tył z kamery.
// ===== MODEL 3D — Krok 3: renderer rzutowy (rzut szkieletu 3D przez kamerę obserwatora) =====
// Zastąpi figSide/POSE. Stawy z bodyJoints → rzut przez obsCam → kapsuły (sort głębią). Głowa w pos.head;
// twarz/profil/tył liczone z rzutu osi nosa+czaszki (composeHead) — bez ręcznego faceAngle. opt.s = skala.
function figProj(body,yaw,face,obsCam,opt){
  opt=opt||{}; const HEAD="#4FC9E8", LIMB="#7E94A6", TORSO="#90A6B8", R=15;
  const J=bodyJoints(body,face), I=[1,0,0,0], P={};
  for(const k in J) P[k]=Scene3D.project(J[k], I, obsCam);
  const s=opt.s||1, names=Object.keys(P);
  let cx=0,cy=0; for(const n of names){cx+=P[n].x;cy+=P[n].y;} cx/=names.length; cy/=names.length;
  const ax=(opt.ax!=null?opt.ax:100), ay=(opt.ay!=null?opt.ay:80);
  const SX=x=>ax+(x-cx)*s, SY=y=>ay+(y-cy)*s;            // project zwrócił już -up; SVG y w dół
  // --- depth cueing: znormalizuj głębię do realnego zakresu sylwetki, przyciemnij dalsze segmenty ---
  let dmin=Infinity,dmax=-Infinity; for(const k of names){const d=P[k].depth; if(d<dmin)dmin=d; if(d>dmax)dmax=d;}
  const drange=(dmax-dmin)||1;                            // depth większe = dalej od kamery (dot(w,fwd))
  const CUE=(opt.cue!=null?opt.cue:0.42);                 // siła cieniowania (0 = brak)
  const shade=(col,d)=>{ const t=(d-dmin)/drange, f=1-CUE*t;   // blisko→1, daleko→1-CUE
    const c=v=>Math.round(Math.max(0,Math.min(255,parseInt(col.substr(v,2),16)*f))).toString(16).padStart(2,"0");
    return "#"+c(1)+c(3)+c(5); };
  const cap=(a,b,w,col)=>{ const d=(P[a].depth+P[b].depth)/2;
    return {d, svg:`<line x1="${SX(P[a].x).toFixed(1)}" y1="${SY(P[a].y).toFixed(1)}" x2="${SX(P[b].x).toFixed(1)}" y2="${SY(P[b].y).toFixed(1)}" stroke="${shade(col||LIMB,d)}" stroke-width="${w}" stroke-linecap="round"/>`}; };
  const SEGS=[["pelvis","spine",24,TORSO],["spine","neck",17,TORSO],
    ["spine","shL",8],["shL","elbL",10],["elbL","handL",10],
    ["spine","shR",8],["shR","elbR",10],["elbR","handR",10],
    ["pelvis","hipL",10],["hipL","kneeL",13],["kneeL","ankL",13],["ankL","toeL",10],
    ["pelvis","hipR",10],["hipR","kneeR",13],["kneeR","ankR",13],["ankR","toeR",10]];
  const items=SEGS.map(g=>cap(g[0],g[1],g[2],g[3]));
  items.sort((u,v)=>v.d-u.d);                            // najdalej (max głębia) najpierw → bliższe na wierzchu
  let fig=items.map(i=>i.svg).join("");
  // --- kotwiczenie do blatu (opt.bedY): najniższy punkt CIAŁA-NA-KOZETCE siada na bedY; transformacja na CAŁEJ grupie ---
  let offY=0;
  if(opt.bedY!=null){
    const excl = body==="supineHang" ? {neck:1,head:1}                             // Dix-Hallpike: głowa+szyja zwisają poza krawędź
               : body==="sit"        ? {ankL:1,ankR:1,toeL:1,toeR:1}               // siad na krawędzi: podudzia/stopy zwisają
               : {};
    let bot=-Infinity;
    for(const g of SEGS){ const [a,b,w]=g; if(excl[a]||excl[b]) continue;
      bot=Math.max(bot, Math.max(SY(P[a].y),SY(P[b].y))+w/2); }
    if(!excl.head) bot=Math.max(bot, SY(P.head.y)+R);
    offY=+(opt.bedY-bot).toFixed(1);
  }
  const hq=composeHead(body,yaw,face);
  const noseP=Scene3D.project(Scene3D.HEAD_POINTS.nose, hq, obsCam);
  const topP =Scene3D.project(Scene3D.HEAD_POINTS.top,  hq, obsCam);
  const hx=SX(P.head.x), hy=SY(P.head.y);
  const noseDown = noseP.y > 0.5 && Math.abs(noseP.x) < 0.6*noseP.y;   // nos celuje PROSTO W DÓŁ EKRANU (twarz w podłogę) → TYŁ; nos w dół-DO-PRZODU (profil boczny, np. Lempert obrót ku 360°) NIE łapany
  let marks;
  if(noseDown){
    const ang=Scene3D.screenAngleCW(topP);
    marks=frontFace(hx,hy,R,ang,0,false);              // tył (linia włosów), bez skrętu
  }
  else if(Math.abs(noseP.depth)<=0.35) marks=profileMarks(hx,hy,R, Scene3D.screenAngleCW(noseP));
  else {                                                // twarz/tył: bogata twarz, obrót z osi czaszki, dx = skręt
    const ang=Scene3D.screenAngleCW(topP);
    const ul=Math.hypot(topP.x,topP.y)||1, ux=topP.x/ul, uy=topP.y/ul, rx=-uy, ry=ux;   // ekranowe "prawo głowy" (⟂ do góry, 90° CW)
    let dx=12*(noseP.x*rx+noseP.y*ry); dx=Math.max(-8,Math.min(8,dx));
    marks=frontFace(hx,hy,R,ang,dx,noseP.depth<0);
  }
  fig+=`<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${R}" fill="${HEAD}"/>${marks}`;
  if(offY) fig=`<g transform="translate(0 ${offY})">${fig}</g>`;   // transformacja korzenia na całą grupę
  return {fig, headC:[hx,hy+offY], offY};
}
function posture(body,face,yaw,viewSide){
  if(body==="sitFront"||body==="leanL"||body==="leanR"){   // Semont — model rzutowy 2.5D (figProj) + depth cueing
    const front=body==="sitFront";
    const cam=front?Scene3D.CAMERAS.frontal:Scene3D.CAMERAS.topDownFront;   // Semont: obserwator NA WPROST pacjenta — leżenie widok odgórny-od-przodu (pac.-lewo = ekran-prawo, spójnie z siadem)
    const {fig}=figProj(body,yaw,face,cam,{ax:100, ay:front?95:96, s:front?0.85:1});
    const Pc="#2C3D4C";
    const couch=front
      ? `<rect x="34" y="106" width="132" height="9" rx="3" fill="${Pc}"/><rect x="50" y="114" width="8" height="26" fill="#1c2935"/><rect x="142" y="114" width="8" height="26" fill="#1c2935"/>`
      : `<rect x="14" y="120" width="172" height="10" rx="3" fill="${Pc}"/><rect x="22" y="130" width="8" height="20" fill="#1c2935"/><rect x="172" y="130" width="8" height="20" fill="#1c2935"/>`;
    const label=front?"Siad — twarzą do badającego"
      :(face==="up"?"Na boku — nos ku sufitowi (pozycja wyjściowa)":"Na boku — nos ku podłodze (przerzut)");
    const view=front?"widok od przodu — na wprost pacjenta":"widok z góry — nad kozetką";
    return `<svg viewBox="0 0 200 160" role="img" aria-label="Ułożenie: ${label}">
      <text x="100" y="12" text-anchor="middle" fill="var(--faint)" font-size="9">${view}</text>
      ${couch}${fig}
      <text x="100" y="154" text-anchor="middle" fill="var(--muted)" font-size="11">${label}</text></svg>`;
  }
  const P="#2C3D4C";
  const obsCam=Scene3D.CAMERAS[viewSide==="L"?"sideRight":"sideLeft"];   // patrzymy od strony chorej
  const {fig,headC}=figProj(body,yaw,face,obsCam,{ax:100, ay:80, s:1, bedY:118});
  let couch;
  if(body==="supineHang"){                              // kozetka krótsza — luka po stronie ZWISAJĄCEJ głowy
    const cw=130, x0=headC[0]>100 ? 14 : 200-14-cw;
    couch=`<rect x="${x0}" y="118" width="${cw}" height="10" rx="3" fill="${P}"/>
      <rect x="${x0}" y="128" width="8" height="20" fill="#1c2935"/><rect x="${x0+cw-8}" y="128" width="8" height="20" fill="#1c2935"/>`;
  } else {
    couch=`<rect x="14" y="118" width="172" height="10" rx="3" fill="${P}"/>
      <rect x="14" y="128" width="8" height="20" fill="#1c2935"/><rect x="178" y="128" width="8" height="20" fill="#1c2935"/>`;
  }
  const label={sit:"Siad",supineHang:"Na plecach, głowa w dół",supineFlex:"Na plecach, głowa przygięta ~30°",supineFlat:"Na plecach, głowa płasko",supineChin:"Na plecach, broda do klatki",prone:"Na brzuchu",sideL:"Na boku lewym",sideR:"Na boku prawym"}[body]||"";
  const viewLbl=viewSide?`◉ widok od strony ${SIDE[viewSide]} (chora)`:"";
  return `<svg viewBox="0 0 200 160" role="img" aria-label="Ułożenie: ${label}, ${viewLbl}">
    <text x="100" y="12" text-anchor="middle" fill="var(--faint)" font-size="9">${viewLbl}</text>
    ${couch}${fig}
    <text x="100" y="154" text-anchor="middle" fill="var(--muted)" font-size="11">${label}</text></svg>`;
}
/* ============ SVG: kanały + otolit ============ */
const CANAL_PATHS={
  posterior:"M150 96 C150 40, 96 26, 70 56 C44 86, 70 130, 110 118",
  horizontal:"M150 96 C150 150, 70 156, 52 116 C40 90, 78 78, 110 92",
  anterior:"M150 96 C150 44, 200 36, 214 70 C226 100, 196 126, 160 116",
};
function labyrinth(canal){
  const colors={posterior:"var(--post)",horizontal:"var(--horiz)",anterior:"var(--ant)"};
  const active=colors[canal];
  let loops="";
  for(const k of ["anterior","horizontal","posterior"]){
    const on=k===canal;
    loops+=`<path id="path-${k}" d="${CANAL_PATHS[k]}" fill="none" stroke="${on?active:"#33404D"}"
      stroke-width="${on?9:6}" stroke-linecap="round" opacity="${on?1:.5}"/>`;
  }
  return `<svg viewBox="0 0 250 175" role="img" aria-label="Kanały półkoliste, aktywny: ${CANALS[canal].label}">
    <ellipse cx="150" cy="100" rx="20" ry="15" fill="#22303D" stroke="var(--line)" stroke-width="1.5"/>
    <text x="150" y="103" text-anchor="middle" fill="var(--faint)" font-size="8">łagiewka</text>
    ${loops}<circle id="otolith" r="6" fill="#fff" stroke="${active}" stroke-width="2"/></svg>
    <div class="viewpoint">schemat wędrówki — położenie poglądowe; czas i skuteczność z fizyki</div>`;
}
function placeOtolith(canal,p,exitBlend){
  const path=$("#path-"+canal),dot=$("#otolith"); if(!path||!dot) return false;
  const pt=path.getPointAtLength(Math.max(0,Math.min(1,p))*path.getTotalLength());
  let x=pt.x, y=pt.y;
  if(exitBlend>0){ x=pt.x+(150-pt.x)*exitBlend; y=pt.y+(100-pt.y)*exitBlend; }  // wpadnięcie do łagiewki
  dot.setAttribute("cx",x); dot.setAttribute("cy",y); return true;
}

/* ============ SVG: oczy + oczopląs ============ */
function eyesSVG(){
  const eye=(cx)=>`<ellipse cx="${cx}" cy="55" rx="40" ry="30" fill="#EEF3F7" stroke="var(--line)" stroke-width="2"/>
    <g class="iris" data-cx="${cx}" data-cy="55">
      <circle cx="${cx}" cy="55" r="17" fill="#3A6B86"/><circle cx="${cx}" cy="55" r="8" fill="#0b1118"/>
      <line x1="${cx}" y1="55" x2="${cx}" y2="40" stroke="#cfe3ee" stroke-width="2.5" stroke-linecap="round"/></g>`;
  return `<svg viewBox="0 0 220 110" class="eyes" role="img" aria-label="Animacja oczopląsu">${eye(62)}${eye(158)}</svg>`;
}
// fala oczopląsu: -1 -> +1 szybka faza na początku cyklu, potem wolny dryf z powrotem
function nysOffset(p,fast){ if(p<fast){const t=p/fast; return -1+2*(1-Math.pow(1-t,3));} const t=(p-fast)/(1-fast); return 1-2*t; }
function startNys(container,nys,envOv){
  const irises=[...container.querySelectorAll(".iris")]; if(!irises.length) return;
  const token=(container.__nysTok=(container.__nysTok||0)+1);   // restart: starsza pętla się zakończy
  const A=(nys.kind==="horizontal"?6:0)*(envOv?1:nys.strength);  // env historyczny NIESIE intensywność (bez podwójnego skalowania)
  const Aup=nys.kind==="upbeatTorsional"?5:0;
  const tors=nys.kind==="upbeatTorsional"?9:0;          // skrętność zmniejszona (było 15) — bliżej realnej
  const vdir=(nys.vdir==null?1:nys.vdir);               // +góra / -dół (kanał przedni = downbeat)
  const T=nys.kind==="upbeatTorsional"?720:760, fast=0.17, start=performance.now();
  // OBWIEDNIA CZASOWA Z SILNIKA: ξ(t) z simulateCanalith/Cupulolith.
  // kanalolitiaza → przejściowa (narost po latencji → szczyt → wygasanie, cząstka wychodzi → NIE wraca);
  // kupulolitiaza → uporczywa. Animacja gra RAZ i się zatrzymuje (koniec pętli).
  const canal=nys.canal||"posterior", side=nys.side||"P";
  const {env, tEnd} = envOv || xiEnvelope(engineXi(canal, side, nys.persistent, nys.q));
  loopRAF((now)=>{
    if(container.__nysTok!==token || !document.body.contains(container)) return false;
    const elapsed=(now-start)/1000;                      // sekundy
    if(elapsed>tEnd+0.4){ for(const g of irises) g.setAttribute("transform","translate(0 0) rotate(0)"); return false; } // koniec — bez zapętlenia
    const e=env(elapsed), p=((now-start)%T)/T, o=nysOffset(p,fast)*e;
    let x=0,y=0,rot=0;
    if(nys.kind==="horizontal"){ x=o*A*nys.dir; } else { y=-o*Aup*vdir; rot=o*tors*nys.dir; }
    for(const g of irises){ const cx=+g.dataset.cx, cy=+g.dataset.cy;
      g.setAttribute("transform",`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)} ${cx} ${cy})`); }
    return true;
  });
}
function arrowGlyph(nys){
  if(nys.kind==="upbeatTorsional"){ const va=(nys.vdir==null?1:nys.vdir)<0?"↓":"↑";
    if(!nys.dir) return va;                                  // czysty pionowy (np. kanał przedni — downbeat bez torsji)
    return nys.dir<0?`${va} ↺`:`${va} ↻`; }
  return nys.dir<0?"⟵":"⟶";
}

/* ============ SVG: mechanizm otolitu (kanalo vs kupulo) ============ */
function diagCanalSVG(canal){
  const color={posterior:"var(--post)",horizontal:"var(--horiz)",anterior:"var(--ant)"}[canal];
  const loop="M80 52 H172 A22 22 0 0 1 172 96 H80 A22 22 0 0 1 80 52 Z";
  return `<svg viewBox="0 0 250 150" role="img" aria-label="Mechanizm przemieszczania otolitów">
    <path d="${loop}" fill="none" stroke="#33404D" stroke-width="15" stroke-linejoin="round"/>
    <path id="dpath" d="${loop}" fill="none" stroke="${color}" stroke-width="2" opacity=".55"/>
    <ellipse cx="62" cy="74" rx="22" ry="26" fill="#22303D" stroke="${color}" stroke-width="2"/>
    <text x="62" y="128" text-anchor="middle" fill="var(--faint)" font-size="9">bańka</text>
    <text x="200" y="128" text-anchor="middle" fill="var(--faint)" font-size="9">ramię kanału</text>
    <g id="cupula">
      <path d="M62 96 q11 -22 0 -44" stroke="#CFE3EE" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>
      <circle id="cuptip" cx="62" cy="52" r="6" fill="#fff" stroke="${color}" stroke-width="2"/>
    </g>
    <circle id="dparticle" r="6" fill="#fff" stroke="${color}" stroke-width="2"/>
  </svg>`;
}
function startDiagOtolith(container,variant,canal,side){
  const path=container.querySelector("#dpath");
  const particle=container.querySelector("#dparticle");
  const cupula=container.querySelector("#cupula");
  const cuptip=container.querySelector("#cuptip");
  if(!path||!particle||!cupula) return;
  canal=canal||"posterior"; side=side||"P";
  const len=path.getTotalLength(), start=performance.now();
  if(variant==="canalo"){
    cuptip.style.display="none";                 // złóg swobodny w świetle kanału
    cupula.setAttribute("transform","rotate(0 62 96)");
    // REALNE φ(t) z silnika (simulateCanalith): po latencji cząstka wędruje wg grawitacji
    // i zatrzymuje się (wyjście do woreczka / spoczynek). Bez sztucznej pętli.
    const sim = engineXi(canal, side, false, provokeQ(canal, side));   // [{t,xi,phi,exited}], phi w stopniach
    const dt = sim.length>1?(sim[1].t-sim[0].t):0.05;
    const lastT = sim.length?sim[sim.length-1].t:0;
    const phiAt = ts=>{ const i=Math.max(0,Math.min(sim.length-1,Math.round(ts/dt))); return sim[i]?sim[i].phi:90; };
    const place = ph=>{ const pt=path.getPointAtLength(Math.max(0,Math.min(1,ph/360))*len); particle.setAttribute("cx",pt.x); particle.setAttribute("cy",pt.y); };
    place(phiAt(0));
    loopRAF((now)=>{ if(!document.body.contains(container)) return false;
      const elapsed=(now-start)/1000;
      if(elapsed>lastT){ place(phiAt(lastT)); return false; }   // koniec — cząstka spoczywa, bez pętli
      place(phiAt(elapsed)); return true; });
  } else {
    particle.style.display="none";               // złóg na osklepku — bańka się odgina
    // odgięcie osklepka wg ξ(t) z silnika (uporczywe — kupulolitiaza nie wygasa, dopóki pozycja trwa)
    const {env, tEnd} = xiEnvelope(engineXi(canal, side, true, provokeQ(canal, side)));
    cupula.setAttribute("transform","rotate(0 62 96)");
    loopRAF((now)=>{ if(!document.body.contains(container)) return false;
      const elapsed=(now-start)/1000;
      const ang = 17*env(Math.min(elapsed,tEnd));
      cupula.setAttribute("transform",`rotate(${ang.toFixed(2)} 62 96)`);
      return elapsed<=tEnd+0.4; });
  }
}

/* ============ Dźwięk ============ */
let audioCtx=null;
function beep(){ if(!state.sound) return;
  try{ audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(audioCtx.destination);
    o.type="sine";o.frequency.value=880; g.gain.setValueAtTime(.001,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(.25,audioCtx.currentTime+.02);
    g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.5);
    o.start();o.stop(audioCtx.currentTime+.5); if(navigator.vibrate)navigator.vibrate(200);
  }catch(e){}
}
const fmt=s=>{const m=Math.floor(s/60),x=s%60; return m>0?`${m}:${String(x).padStart(2,"0")}`:String(x);};
const fmtClock=s=>{const m=Math.floor(s/60),x=s%60; return `${m}:${String(x).padStart(2,"0")}`;};

/* ============ Licznik + płynny otolit ============ */
/* Fizyka (simulateCanalith) dostarcza CZAS wędrówki (tEnd per krok, zależny od rozmiaru) i WALIDUJE
   skuteczność (man.exited → krok kuracyjny). POŁOŻENIE cząstki na ścieżce jest jednak SCHEMATYCZNE (audyt #3):
   dla manewrów skutecznych to monotoniczna rampa 0.15→1.0 (patrz manFractions), realne φ(t) tylko dla
   KONWERSJI (Gufoni apo). maneuverSim liczone raz na (manewr×strona×rozmiar×czasy kroków) i cache'owane. */
function computeManSim(plan, size="medium"){
  const tl = maneuverTimeline(plan, size);
  const sim = Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, timeline:tl, size});
  const dt = sim.length>1 ? sim[1].t - sim[0].t : 0.05;
  const segs=[]; let t0=0;
  for(const seg of tl){ const dur=(seg.tTrans||0)+(seg.tHold||0); segs.push({t0,dur}); t0+=dur; }
  return {sim, dt, segs, exited: sim.some(s=>s.exited)};
}
// symulacja manewru z cache; klucz zawiera rozmiar → zmiana rozmiaru unieważnia cache i przelicza dynamikę.
function currentManSim(){
  const key=state.plan.name+"|"+state.plan.side+"|"+state.size+"|"+state.plan.steps.map(s=>s.seconds==null?"_":s.seconds).join(",");   // czasy kroków (st.seconds → tHold) wpływają na dynamikę → muszą być w kluczu (audyt #8: małe złogi cap=20 s, ręczne skrócenie zmienia φ(t))
  if(state._manKey!==key){ state._manKey=key; state._manSim=computeManSim(state.plan, state.size); }
  return state._manSim;
}
// Obwiednia ξ(t) dla KROKU z HISTORYCZNEJ symulacji manewru (uwzględnia stan osklepka przeniesiony z poprzednich
// kroków — np. krok 2/3 Epleya startuje od rezydualnej deflekcji, nie „od świeża" jak provokeQ).
// Intensywność jak dynNystagmus: ABSOLUTNA |ξ| z REKTYFIKACJĄ EWALDA II — przepływ ampullofugalny (ξ<0, hamowanie)
// daje słabszą odpowiedź ×0.45. Bez normalizacji do szczytu manewru (inaczej ukryłaby hamowanie, gdy CAŁY manewr
// jest ampullofugalny, jak rolka Lemperta). env(0) może być >0 (rezyduum). Gładki ogon do zera po oknie symulacji.
function manStepEnv(man, step){
  if(!man || !man.sim || !man.segs) return null;
  const seg = man.segs[Math.min(step, man.segs.length-1)]; if(!seg || seg.dur<=0) return null;
  const sim=man.sim, dt=man.dt, t0=seg.t0, dur=seg.dur, TAIL=6;
  const REC = x => Math.min(1, Math.abs(x)*(x>0?1:0.45));           // Ewald II: hamowanie (ampullofugalny ξ<0) słabsze ×0.45
  const at = tabs => { const i=Math.min(sim.length-1, Math.max(0, Math.round(tabs/dt))); return sim[i]?REC(sim[i].xi):0; };
  const endV = at(t0+dur);
  const env = ts => {
    if(ts<=0) return at(t0);                                        // start = stan REZYDUALNY z poprzedniego kroku
    if(ts<=dur) return at(t0+ts);
    return Math.max(0, endV*(1-(ts-dur)/TAIL));                     // gładki ogon
  };
  let stepPk=0, tEnd=0;
  for(let ts=0; ts<=dur+TAIL+1e-6; ts+=dt){ const e=env(ts); if(e>stepPk) stepPk=e; if(e>=0.03) tEnd=ts; }
  // BEZPIECZNIK: model nie re-prowokuje na niektórych przejściach (obroty poziome Lemperta) — jeśli sygnał
  // historyczny tego kroku jest znikomy, oddaj sterowanie annotacji (świeży provokeQ w startNys), by krok
  // z annotowanym oczopląsem nie „zniknął". Carry-over/rektyfikacja zostają tam, gdzie fizyka daje realny ślad.
  if(stepPk < 0.10) return null;
  return {env, tEnd, hist:true};
}
// szczyt ξ (ZE ZNAKIEM) dla kroku z ciągłej symulacji; przy luce (model nie re-prowokuje) — świeży provoke
// z FAKTYCZNEJ orientacji kroku (neutralny start → pozycja kroku). Znak steruje kierunkiem (odwróceniem) w nysFromDyn.
function stepXiPeak(man, plan, step, size="medium"){
  let xi=0;
  const seg = man && man.segs ? man.segs[step] : null;
  if(seg){ const i0=Math.round(seg.t0/man.dt), i1=Math.round((seg.t0+seg.dur)/man.dt);
    for(let k=i0;k<=i1 && k<man.sim.length;k++){ if(Math.abs(man.sim[k].xi)>Math.abs(xi)) xi=man.sim[k].xi; } }
  if(Math.abs(xi) < 0.06){                                  // luka: świeży provoke z orientacji kroku
    const st=plan.steps[step];
    const pre = stepHeadQ(st.body, 0, st.face==="down"?"up":st.face);
    const q   = stepHeadQ(st.body, st.yaw, st.face);
    const psim = Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, size,
      timeline:[{q:pre,tTrans:0,tHold:1},{q,tTrans:0.8,tHold:12}]});
    let pp=0; for(const s of psim){ if(Math.abs(s.xi)>Math.abs(pp)) pp=s.xi; }
    if(Math.abs(pp) > Math.abs(xi)) xi=pp;
  }
  return xi;
}
function manPhi(man, step, frac){                       // φ realne dla danego kroku i ułamka timera
  const seg = man.segs[Math.min(step, man.segs.length-1)]; if(!seg) return 90;
  const ts = seg.t0 + Math.max(0,Math.min(1,frac))*seg.dur;
  const i = Math.min(man.sim.length-1, Math.max(0, Math.round(ts/man.dt)));
  return man.sim[i] ? man.sim[i].phi : 90;
}
const phiToFrac = phi => Math.max(0, Math.min(1, phi/178));   // φ→ułamek ścieżki (178°=wyjście)
// harmonogram ułamków ścieżki per krok.
// Silnik WALIDUJE, że manewr czyści (man.exited) i wskazuje krok kuracyjny; wędrówkę pokazujemy jako
// czystą, monotoniczną progresję 0.15→1.0 (wyjście) dokładnie w kroku kuracyjnym = ostatnim repozycyjnym
// (przedostatni krok, przed powrotem do siadu). Surowe φ z silnika jest „front-loaded" (nasyca się ~krok 2)
// i dla kanału poziomego idzie ku bańce — nie daje czytelnej wędrówki przez wszystkie kroki, stąd schemat.
function manFractions(man, plan){
  const n=plan.steps.length;
  if(!man.exited){                                       // konwersja (Gufoni apo) — ruch ku bańce wg silnika, bez wyjścia
    return {fr: plan.steps.map((_,i)=>phiToFrac(manPhi(man,i,1))), exitStep:-1};
  }
  const cure=Math.max(1, n-2), s0=0.15;                  // krok kuracyjny; pozycja spoczynkowa złogu (blisko bańki)
  const fr=[];
  for(let i=0;i<n;i++) fr.push(i<=cure ? s0+(1-s0)*(i/cure) : 1);   // ramp do 1.0 w kroku kuracyjnym, potem łagiewka
  return {fr, exitStep:cure};
}
// Czas trwania oczopląsu (widok frontalny) dla danego kroku — DOKŁADNIE to samo tEnd, którego użyją
// startNys/startDialNys w renderGuide (envOv=manStepEnv(...) z fallbackiem na świeży xiEnvelope(engineXi(...))).
// Zwraca sekundy albo null, gdy krok nie ma oczopląsu (sygnał < próg). Wędrówkę otolitu wiążemy z tą wartością.
function guideNysSeconds(plan, man, step, size){
  const _gn = nysFromDyn(plan.canal, plan.side, stepXiPeak(man, plan, step, size));
  if(!_gn || _gn.strength < 0.10) return null;
  const r = manStepEnv(man, step) || xiEnvelope(engineXi(_gn.canal, _gn.side, _gn.persistent, _gn.q));
  return r ? r.tEnd : null;
}
function setupGuideAnim(){
  const st=state.plan.steps[state.step], total=st.seconds||0;
  state.total=total; state.elapsedMs=0; state.running=false;
  const canal=state.plan.canal;
  const man=currentManSim(), sched=manFractions(man, state.plan), fr=sched.fr;
  const fTo=fr[state.step], fFrom=state.step>0?fr[state.step-1]:fTo;
  const exited = sched.exitStep>=0 && state.step>=sched.exitStep;        // cząstka już w łagiewce?
  const blendOnly = exited && state.step>sched.exitStep;                  // krok po wyjściu — spoczynek w łagiewce
  if(blendOnly) placeOtolith(canal, 1, 1); else placeOtolith(canal, fFrom, 0);
  if(state.autostart && total>0){ state.running=true; }
  state.autostart=false; syncWake();

  _otoStart=null; let last=performance.now(), lastSec=-1;
  // CZAS WĘDRÓWKI OTOLITU = CZAS OCZOPLĄSU (widok frontalny): oba grają przez to samo okno tEnd z silnika,
  // więc na flipkarcie obie strony kończą się razem. Zależność od rozmiaru cząstki niesie już samo tEnd
  // (mniejsza cząstka → wolniejsze osiadanie → dłuższe ξ(t) → dłuższa wędrówka). Widełki chronią skrajności.
  const nysSec=guideNysSeconds(state.plan, man, state.step, state.size);
  const rSize=sizeRadius(state.size);
  const DUR = nysSec!=null
    ? Math.max(1200, Math.min(24000, Math.round(nysSec*1000)))              // krok z oczopląsem → zsynchronizowany z ξ(t)
    : Math.max(800,  Math.min(3000,  Math.round(1600/(rSize*rSize))));      // krok bez oczopląsu → fallback wg rozmiaru (osiadanie ∝ 1/r²)
  loopRAF((now)=>{
    if(!document.getElementById("otolith")) return false;
    const dt=now-last; last=now;
    // ANIMACJA OTOLITU: przejście fFrom→fTo na wejściu w krok, niezależnie od timera (ruch przy repozycji)
    if(_otoStart===null) _otoStart=now;
    const ot=Math.min(1,(now-_otoStart)/DUR);
    if(blendOnly){ placeOtolith(canal, 1, 1); }
    else if(exited && state.step===sched.exitStep){
      // najpierw dojazd po ścieżce do wyjścia (0–0.65), potem wpadnięcie do łagiewki (0.65–1)
      if(ot<0.65){ placeOtolith(canal, fFrom+(1-fFrom)*easeInOut(ot/0.65), 0); }
      else{ placeOtolith(canal, 1, easeInOut((ot-0.65)/0.35)); }
    } else {
      placeOtolith(canal, fFrom+(fTo-fFrom)*easeInOut(ot), 0);
    }
    // TIMER (pasek liniowy + odliczanie) — czyta state.total na żywo (suwak działa od razu)
    const T=state.total;
    if(T>0){
      if(state.running) state.elapsedMs+=dt;
      const frac=Math.min(1,state.elapsedMs/1000/T);
      const remaining=Math.max(0,Math.ceil(T-state.elapsedMs/1000));
      if(remaining!==lastSec){ lastSec=remaining; const r=$("#tread"); if(r)r.textContent=fmtClock(remaining); }
      const bar=$("#tprog"); if(bar) bar.style.width=((1-frac)*100)+"%";
      if(state.running && state.elapsedMs/1000>=T){ state.running=false; updateGoBtn(); beep();
        if(state.autoAdvance) goStep(state.step+1,true); }
    }
    return true;
  });
}
function updateGoBtn(){ const b=$("#btnGo"); if(b){ b.textContent=state.running?"Pauza":"Start"; b.classList.toggle("run",state.running);} syncWake(); }
function toggleTimer(){ if(!state.running && state.elapsedMs/1000>=state.total) state.elapsedMs=0; state.running=!state.running; updateGoBtn(); }
function resetTimer(){ state.elapsedMs=0; state.running=false; updateGoBtn(); }
function adjust(d){ state.total=Math.max(5,state.total+d); const st=state.plan.steps[state.step]; st.seconds=state.total;
  if(state.elapsedMs/1000>state.total) state.elapsedMs=state.total*1000; const r=$("#tread"); if(r)r.textContent=fmt(Math.ceil(state.total-state.elapsedMs/1000)); }
// Liniowy suwak czasu kroku (0–2:00, snap co 15 s). Aktualizuje state.total (pętla czyta na żywo).
function setStepSeconds(v){
  v=Math.max(15,Math.min(120,Math.round(v/15)*15));
  state.total=v; const st=state.plan.steps[state.step]; st.seconds=v;
  if(state.elapsedMs/1000>v) state.elapsedMs=v*1000;
  const p=v/120*100, k=$("#knob"), f=$("#fill"); if(k)k.style.left=p+"%"; if(f)f.style.width=p+"%";
  const r=$("#tread"); if(r)r.textContent=fmtClock(Math.max(0,Math.ceil(v-state.elapsedMs/1000)));
}
function initGuideSlider(){
  const track=$("#track"); if(!track) return;
  const fromX=x=>{const r=track.getBoundingClientRect(); return (x-r.left)/r.width*120;};
  let drag=false;
  track.onpointerdown=e=>{ drag=true; try{track.setPointerCapture(e.pointerId);}catch(_){} setStepSeconds(fromX(e.clientX)); };
  track.onpointermove=e=>{ if(drag) setStepSeconds(fromX(e.clientX)); };
  track.onpointerup=track.onpointercancel=()=>{ drag=false; };
}
// Odwracana karta: widok frontalny ⇄ wędrówka otolitów — obrót jest CZYSTO WIZUALNY (tylko klasa CSS).
// Animacje kroku (oczopląs: oczy+dial oraz wędrówka otolitu) startują RAZ przy wejściu w krok (renderGuide
// + setupGuideAnim), grają nieprzerwanie w tle na obu stronach (obie w DOM) aż do końca (tEnd) i płynnie z
// niego wynikają — flip ich NIE resetuje ani nie zatrzymuje; po obrocie widać bieżący, ciągły stan animacji.
function flipGuide(){ const f=$("#flip"); if(!f) return; f.classList.toggle("flipped"); }
// wyrównanie wysokości obu stron (warstwy absolutne) — bez „skakania" przy obrocie
function sizeFlip(id="flip"){ const f=$("#"+id); if(!f) return; let h=0;
  f.querySelectorAll(".face").forEach(el=>{ h=Math.max(h, el.scrollHeight + (el.offsetHeight - el.clientHeight)); });  // +ramka (border-box) → bez paska
  if(h>0) f.style.height=h+"px"; }

/* ============ Render ============ */
function render(){
  cancelAnims();
  if(state.screen==="setup") renderSetup();
  else if(state.screen==="guide") renderGuide();
  else if(state.screen==="hints") renderHints();
  else renderDiag();
}

function renderSetup(){
  let body="";
  if(state.mode==="treat"){
    const canalOpt=k=>{const c=CANALS[k];return `<button class="opt" aria-pressed="${state.canal===k}" onclick="pickCanal('${k}')">
        <span class="canaldot" style="background:${c.color}"></span>${c.label}<small>${c.note}</small></button>`;};
    let man="";
    if(state.canal){const keys=CANALS[state.canal].maneuvers;
      man=`<div class="group"><div class="label"><span class="eyebrow">Manewr</span><span class="hint">dobrany do kanału</span></div>
        <div class="seg ${keys.length===2?'two':''}">${keys.map(k=>`<button class="opt" aria-pressed="${state.maneuverKey===k}" onclick="openMan('${k}')">${MANEUVERS[k].label}<small>${MANEUVERS[k].desc}</small></button>`).join("")}</div></div>`;}
    const ready=state.canal&&state.maneuverKey;
    const sizeOpt=k=>`<button class="opt" aria-pressed="${state.size===k}" onclick="pickSize('${k}')">Cząstka ${SIZE_LABELS[k]}<small>${SIZE_NOTE[k]}</small></button>`;
    const sizeGroup=`<div class="group"><div class="label"><span class="eyebrow">Rozmiar złogu</span><span class="hint">latencja · siła · czas holdu</span></div>
        <div class="seg three">${sizeOpt("small")}${sizeOpt("medium")}${sizeOpt("big")}</div></div>`;
    body=`<div class="group"><div class="label"><span class="eyebrow">Kanał półkolisty</span><span class="hint">zajęty kanał</span></div>
        <div class="seg three">${canalOpt("posterior")}${canalOpt("horizontal")}${canalOpt("anterior")}</div></div>
      ${man}${sizeGroup}`;
  } else if(state.mode==="hints"){
    const famOf=k=> k==="normal"?"normal": k==="strokeCentral"?"stroke":"neuritis";
    const curFam=famOf(state.hintsScenario);
    const scDesc={normal:"prawidłowy VOR — bez oczopląsu", neuritis:"obwód — wypadnięcie błędnika", stroke:"ośrodek — objaw groźny (AVS)"};
    const scOpt=(f,key,lbl)=>`<button class="opt" aria-pressed="${curFam===f}" onclick="openHints('${key}')">${lbl}<small>${scDesc[f]}</small></button>`;
    body=`<div class="group"><div class="label"><span class="eyebrow">Scenariusz</span><span class="hint">obwód ↔ ośrodek</span></div>
        <div class="seg three">${scOpt('normal','normal','Zdrowy / równowaga')}${scOpt('neuritis','neuritisR','Neuronitis przedsionkowy')}${scOpt('stroke','strokeCentral','Udar móżdżku / pnia')}</div>
        <button class="opt" style="margin-top:8px" onclick="openHintsCustom()"><b>Własny — matematyczny pacjent</b><small>ustaw surową fizjologię (suwaki); cały obraz kliniczny wynika sam</small></button></div>
      <div class="note" style="margin-top:14px">Model „od pierwszych zasad": zmieniasz fizjologię (spoczynkowa aktywność błędników, wzmocnienie kanałów, kłaczek, integrator, otolity), a oczopląs samoistny, HIT i skew wynikają <b>same</b>. Wybierz scenariusz (przy neuronitis stronę ucha ustawisz przełącznikiem na karcie HINTS) albo tryb „Własny", by sterować każdym parametrem.</div>`;
  } else {
    const testOpt=k=>`<button class="opt" aria-pressed="${state.testKey===k}" onclick="openTest('${k}')">${DIAG[k].name}<small>${DIAG[k].tests}</small></button>`;
    body=`<div class="group"><div class="label"><span class="eyebrow">Test diagnostyczny</span><span class="hint">stronę ustalisz na karcie testu</span></div>
        <div class="seg">${testOpt("dix")}${testOpt("roll")}${testOpt("bowlean")}${testOpt("headhang")}</div></div>`;
  }
  $("#app").innerHTML=`
    <div class="topbar">
      <div class="mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13c0-5 4-8 7.5-8S20 7.5 20 11c0 3-2.5 4-2.5 6.5S16 21 14 21s-2-2-2-3.5S10.5 15 9 14s-4 .5-4-1Z" stroke="var(--primary)" stroke-width="1.6"/></svg></div>
      <div><h1>BPPV — asystent</h1><div class="sub">Repozycja i diagnostyka otolitów — prototyp</div></div>
    </div>
    <div class="tabs three" role="tablist">
      <button role="tab" aria-selected="${state.mode==='treat'}" onclick="setMode('treat')">Repozycja</button>
      <button role="tab" aria-selected="${state.mode==='diag'}" onclick="setMode('diag')">Diagnostyka</button>
      <button role="tab" aria-selected="${state.mode==='hints'}" onclick="setMode('hints')">HINTS</button>
    </div>
    <div class="disclaimer"><b>Narzędzie wspomagające dla personelu medycznego.</b> Nie zastępuje badania, rozpoznania ani decyzji klinicysty. Czasy i wzorce oczopląsu są poglądowe (wariant kanalitiazy/geotropowy) — zweryfikuj z własnym protokołem.</div>
    ${body}
    <p class="footnote">Prototyp poglądowy. Brak gromadzenia danych.</p>`;
}

function renderGuide(){
  const p=state.plan, st=p.steps[state.step], n=p.steps.length;
  const _man = currentManSim();
  const _gn = nysFromDyn(p.canal, p.side, stepXiPeak(_man, p, state.step, state.size));
  const gn = (_gn && _gn.strength >= 0.10) ? _gn : null;   // karta oczopląsu TAM, gdzie FIZYKA daje sygnał > próg (bez markera)
  const gravArrow = gn ? gravArrowFor(st.body, st.yaw, st.face) : "";
  const dots=p.steps.map((_,i)=>`<i class="${i<state.step?'done':i===state.step?'cur':''}"></i>`).join("");
  const tgIcons = `<div class="tg">
      <button class="ic" role="switch" aria-checked="${state.autoAdvance}" aria-label="Auto‑przejście po odliczeniu" title="Auto‑przejście" onclick="toggleAuto(this)"><svg viewBox="0 0 24 24" fill="none"><path d="M5 5l10 7-10 7V5z" fill="currentColor"/><path d="M18.6 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
      <button class="ic" role="switch" aria-checked="${state.sound}" aria-label="Sygnał dźwiękowy i wibracja" title="Sygnał dźwiękowy" onclick="toggleSound(this)"><svg viewBox="0 0 24 24" fill="none"><path d="M5 9v6h4l5 4V5L9 9H5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M17 9.5a4 4 0 0 1 0 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    </div>`;
  const sp = Math.max(0, Math.min(100, ((st.seconds||0)/120)*100));
  const timerBlock=st.seconds==null
    ? `<div class="tcard"><div class="trow1"><div class="nostimer-inline">Krok bez odliczania — wykonaj płynnie, bez przerwy.</div>${tgIcons}</div></div>`
    : `<div class="tcard">
        <div class="trow1">
          <button id="btnGo" class="go" onclick="toggleTimer()">Start</button>
          <button class="ghost" onclick="resetTimer()" aria-label="Reset" title="Reset">↺</button>
          ${tgIcons}
          <div class="tval mono" id="tread">${fmtClock(st.seconds)}</div>
        </div>
        <div class="tprogwrap"><div id="tprog" class="tprog"></div></div>
        <div class="slider">
          <div class="track" id="track">
            <div class="fill" id="fill" style="width:${sp}%"></div>
            <span class="tk" style="left:25%"></span><span class="tk" style="left:50%"></span><span class="tk" style="left:100%"></span>
            <div class="knob" id="knob" style="left:${sp}%"></div>
          </div>
          <div class="ticks"><span style="left:25%" onclick="setStepSeconds(30)">0:30</span><span style="left:50%" onclick="setStepSeconds(60)">1:00</span><span class="r" style="left:100%" onclick="setStepSeconds(120)">2:00</span></div>
        </div>
      </div>`;
  const headPanel = st.headSlot && st.headSlot.kind==="textOnly"
      ? `<div class="panelbox"><h4>Głowa</h4><div class="headnote">${st.headText}</div></div>`
    : st.headSlot && st.headSlot.kind==="backTurn"
      ? `<div class="panelbox"><h4>Głowa</h4><div data-backhead>${backHeadSVG()}</div><div class="headnote">${st.headText}</div></div>`
      : `<div class="panelbox"><h4>Głowa (z góry)</h4>${headDial(st.yaw,st.face,p.headCamera,gn)}</div>`;
  const gufoniNote = state.maneuverKey==="gufoniApo"
    ? `<div class="note">Manewr <b>konwersji</b>: złóg nie opuszcza kanału — celem jest przekształcenie postaci apogeotropowej w geotropową. Po nim wykonaj ponowny Roll test i lecz postać geotropową (Lempert / Gufoni geotropowy).</div>` : "";
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="Wróć"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${p.name}</b><span>${CANALS[p.canal].label}</span></div>
      <div class="sidewrap"><em>strona</em><div class="sidepill"><button data-s="L" aria-pressed="${p.side==='L'}" onclick="setGuideSide('L')">L</button><button data-s="P" aria-pressed="${p.side==='P'}" onclick="setGuideSide('P')">P</button></div></div></div>
    <div class="steps-dots">${dots}</div>
    <div class="sizerow"><span class="lbl">Rozmiar złogu</span>
      <div class="sizepill">${["small","medium","big"].map(k=>`<button aria-pressed="${state.size===k}" onclick="pickSize('${k}')">${SIZE_LABELS[k]}</button>`).join("")}</div></div>
    ${state.size==="small"
      ? `<div class="note">Drobny/wolno osiadający złóg — <b>wydłużono zalecany czas utrzymania pozycji</b> (wolniejsze osiadanie otoconiów; por. uzasadnienie ~30 s holdów w CRP: Hain, Squires &amp; Stone 2005). Oczopląs słabszy i o dłuższej latencji.</div>`
      : ""}
    <div class="viz"><div class="panelbox"><h4>Ułożenie pacjenta</h4>${posture(st.body,st.face,st.yaw,p.side)}</div>
      ${headPanel}</div>
    ${gn
      ? `<div class="flipwrap"><div class="flip" id="flip" role="button" tabindex="0" aria-label="Odwróć kartę: widok frontalny albo wędrówka otolitów" onclick="flipGuide()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipGuide();}">
          <div class="face front panelbox"><h4>Widok frontalny</h4>
            <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-nys-guide>${eyesSVG()}</div><span class="emk">L</span></div>
            <div class="nyslabel"><span class="arrow">${arrowGlyph(gn)}</span><span>${gn.label}</span></div>
            ${gravArrow}
            <div class="fliphint">${FLIP_ICO} wędrówka otolitów</div></div>
          <div class="face back panelbox"><h4>Wędrówka otolitów — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal)}${gufoniNote}
            <div class="fliphint">${FLIP_ICO} widok frontalny</div></div>
        </div></div>`
      : `<div class="panelbox" style="margin-bottom:12px"><h4>Wędrówka otolitów — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal)}${gufoniNote}</div>`}
    <div class="card stepcard">
      <div class="stephead">
        <button class="stepnav" ${state.step===0?"disabled":""} onclick="goStep(${state.step-1})" aria-label="Poprzedni krok"><svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="num">KROK ${state.step+1} / ${n}</div>
        ${state.step<n-1
          ? `<button class="stepnav" onclick="goStep(${state.step+1})" aria-label="Następny krok"><svg viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
          : `<button class="stepnav fin" onclick="backToSetup()" aria-label="Zakończ serię"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`}
      </div>
      <div class="title">${st.title}</div>
      <div class="instr">${st.instr}</div></div>
    ${timerBlock}
    <p class="footnote">Po zakończeniu odczekaj zgodnie z protokołem i rozważ ponowny test pozycyjny.</p>`;
  requestAnimationFrame(setupGuideAnim);
  requestAnimationFrame(initGuideSlider);
  if(gn) requestAnimationFrame(()=>sizeFlip("flip"));
  if(st.headSlot && st.headSlot.kind==="backTurn") requestAnimationFrame(()=>{ const bh=$("[data-backhead]"); if(bh) startBackHeadTurn(bh, st.headSlot.dir); });
  if(gn) requestAnimationFrame(()=>{ startDialNys(gn,p,manStepEnv(_man,state.step)); });
  if(gn) requestAnimationFrame(()=>{ const c=$("[data-nys-guide]"); if(c) startNys(c, gn, manStepEnv(_man,state.step)); });
  updateGoBtn();
}

function renderDiag(){
  const t=DIAG[state.testKey], A=state.side, v=state.variant;
  const isDix = state.testKey==="dix";
  const antMode = isDix && state.dixObs==="ant";          // zaobserwowano downbeat → kanał PRZEDNI
  const effCanal = antMode ? "anterior" : t.canal;
  const effSide  = antMode ? otherSide(A) : A;            // kanał przedni ucha PRZECIWNEGO (płaszczyzna LARP/RALP)
  const phases = t.phases(A,v).map(ph => antMode
    ? { ...ph, nys: nysFromGeom("anterior", effSide, v, Vestibular.qSupineYaw(A==="P"?45:-45)),
        label: "ku dołowi — czysty downbeat (kanał przedni)",
        note: `To NIE kanał tylny. Downbeat w Dix-Hallpike wskazuje kanał PRZEDNI ucha przeciwnego (${SIDE[effSide]}) — ta sama płaszczyzna co tylny ucha dolnego (LARP/RALP). Ułożenie głowy bez zmian; różni się tylko zaobserwowany oczopląs.` }
    : ph);
  state._diagPhaseNys = phases.map(p=>p.nys);   // do restartu animacji przy odwracaniu kart pozycji
  const vl=variantLabels(t.canal);
  const mechNote = v==="canalo"
    ? "Swobodne złogi przemieszczają się w świetle kanału pod wpływem grawitacji."
    : "Złogi przylegają do osklepka (cupula), który się odgina — bańka staje się wrażliwa na grawitację.";
  const phaseInner=(ph,i)=>`
      <div class="ptitle">${ph.ptitle}</div><div class="ppos">${ph.ppos}</div>
      <div class="minihead"><div class="panelbox"><h4>Ułożenie</h4>${posture(ph.body,ph.face,ph.yaw,A)}</div>
        <div class="panelbox"><h4>Głowa (z góry)</h4><div data-dialnys="${i}">${headDial(ph.yaw,ph.face,"topDownBehind")}</div></div></div>
      <div class="panelbox" style="margin-top:10px"><h4>Widok frontalny</h4>
        <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-nys="${i}">${eyesSVG()}</div><span class="emk">L</span></div>
        <div class="nyslabel"><span class="arrow">${arrowGlyph(ph.nys)}</span><span>${ph.label}${ph.nys.persistent?" · uporczywy":" · przemijający"}</span></div>
        ${gravArrowFor(ph.body, ph.yaw, ph.face)}</div>
      <div class="note">${ph.note}</div>`;
  const phaseHTML = phases.length===2
    ? `<div class="flipwrap" style="margin-top:6px"><div class="flip" id="phaseflip" style="min-height:470px" role="button" tabindex="0" aria-label="Odwróć: ${phases[0].ptitle} albo ${phases[1].ptitle}" onclick="flipPhases()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipPhases();}">
        <div class="face front phaseface">${phaseInner(phases[0],0)}<div class="fliphint">${FLIP_ICO} ${phases[1].ptitle}</div></div>
        <div class="face back phaseface">${phaseInner(phases[1],1)}<div class="fliphint">${FLIP_ICO} ${phases[0].ptitle}</div></div>
      </div></div>`
    : phases.map((ph,i)=>`<div class="phase">${phaseInner(ph,i)}</div>`).join("");
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="Wróć"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t.name}</b><span>${t.tests}</span></div>
      <div class="sidewrap"><em>strona</em><div class="sidepill"><button data-s="L" aria-pressed="${A==='L'}" onclick="setDiagSide('L')">L</button><button data-s="P" aria-pressed="${A==='P'}" onclick="setDiagSide('P')">P</button></div></div></div>
    <div class="card" style="margin-bottom:4px"><div class="instr" style="font-size:14px;color:#D4DEE8">${t.intro}</div></div>
    ${isDix ? `<div class="obsrow"><div class="obslabel">Zaobserwowany oczopląs w Dix-Hallpike:</div>
      <div class="seg segobs">
        <button class="opt" aria-pressed="${!antMode}" onclick="setDixObs('post')"><b>↑ + skrętny</b><small>kanał tylny (ucho dolne) — typowy</small></button>
        <button class="opt" aria-pressed="${antMode}" onclick="setDixObs('ant')"><b>↓ downbeat</b><small>kanał przedni (rzadki, ucho przeciwne)</small></button>
      </div></div>` : ""}
    ${phaseHTML}
    ${(()=>{
      const interp = v0 => antMode
        ? `Kanał przedni ucha przeciwnego (${SIDE[effSide]}). Oczopląs to czysty downbeat — lateralizacja oczopląsem NIEWIARYGODNA (torsja śladowa). Potwierdź deep head-hangiem; lecz Yacovino.`
        : t.latNote(A, v0);
      const note = v0 => v0==="canalo"
        ? "Swobodne złogi przemieszczają się w świetle kanału pod wpływem grawitacji."
        : "Złogi przylegają do osklepka (cupula), który się odgina — bańka staje się wrażliwa na grawitację.";
      const face = v0 => `<h4>Mechanizm — ${CANALS[effCanal].label} · ${v0==="canalo"?"kanalolitiaza":"kupulolitiaza"}</h4>
        <div data-diagcanal="${v0}">${diagCanalSVG(effCanal)}</div>
        <div class="features">${t.features(v0).map(f=>`<span>${f}</span>`).join("")}</div>
        <div class="note">${note(v0)}</div>
        <div class="note" style="color:var(--text)"><b>Interpretacja:</b> ${interp(v0)}</div>`;
      return `<div class="flipwrap" style="margin-top:12px"><div class="flip ${v==='cupulo'?'flipped':''}" id="mechflip" role="button" tabindex="0" aria-label="Odwróć kartę mechanizmu: kanalolitiaza albo kupulolitiaza" onclick="flipDiagMech()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipDiagMech();}">
        <div class="face front panelbox">${face("canalo")}<div class="fliphint">${FLIP_ICO} kupulolitiaza</div></div>
        <div class="face back panelbox">${face("cupulo")}<div class="fliphint">${FLIP_ICO} kanalolitiaza</div></div>
      </div></div>`;
    })()}
    ${antMode ? `<div class="redflag"><b>⚠ Czerwona flaga — wyklucz przyczynę OŚRODKOWĄ.</b> Downbeat, który jest <b>uporczywy, bez latencji i nie wyczerpuje się</b> przy powtórzeniach, występuje także w pozycji neutralnej (na wznak, głowa prosto), albo towarzyszą mu objawy neurologiczne (dyzartria, ataksja, zaburzenia spojrzenia, dwojenie) — przemawia za przyczyną OŚRODKOWĄ (móżdżek, pogranicze czaszkowo‑szyjne: malformacja Arnolda‑Chiariego, SM, zmiany naczyniowe). Wymaga oceny neurologicznej i MRI, nie manewru. Repozycję rozważ dopiero po wykluczeniu przyczyny ośrodkowej.</div>` : ""}
    ${(()=>{ const rec = antMode
        ? {primary:"yacovino", alts:[], note:`Downbeat w Dix-Hallpike → kanał PRZEDNI ucha przeciwnego (${SIDE[effSide]}), płaszczyzna LARP/RALP. Leczenie: Yacovino (deep head-hang → szybki ruch brody do klatki). Lateralizacja oczopląsem niepewna.`}
        : recommend(state.testKey,v);
      const btns=[rec.primary,...rec.alts].map((k,idx)=>`<button class="${idx===0?'recoprimary':'recoalt'}" onclick="startManeuver('${k}')">${idx===0?'Rozpocznij: ':'Alternatywa: '}${MANEUVERS[k].label} — ${MANEUVERS[k].desc}</button>`).join("");
      return `<div class="reco"><h4>Sugerowane leczenie</h4>
        <div class="note" style="color:var(--text)">${rec.note}</div>
        <div class="note">Leczenie dla strony <b>${SIDE[effSide]}</b>. ${antMode?"Strona kanału przedniego niepewna — potwierdź deep head-hangiem i dopiero po wykluczeniu przyczyny ośrodkowej.":"Potwierdź stronę regułą lateralizacji powyżej, zanim rozpoczniesz manewr."}</div>
        <div class="recobtns">${btns}</div></div>`; })()}
    <p class="footnote">Wzorce poglądowe. Interpretuj w kontekście klinicznym.</p>`;
  requestAnimationFrame(()=>{
    phases.forEach((ph,i)=>{
      const c=$(`[data-nys="${i}"]`); if(c) startNys(c,ph.nys);
      const dh=$(`[data-dialnys="${i}"]`); if(dh) startDialNysIn(dh,ph.nys);   // animacja dialu (widok z tyłu)
    });
    const dcA=$('[data-diagcanal="canalo"]'); if(dcA) startDiagOtolith(dcA,"canalo",effCanal,effSide);
    const dcB=$('[data-diagcanal="cupulo"]'); if(dcB) startDiagOtolith(dcB,"cupulo",effCanal,effSide);
    sizeFlip("mechflip"); sizeFlip("phaseflip");
  });
}

/* ============ HINTS — różnicowanie ośrodek↔obwód (silnik NeuroVOR) ============ */
function hintsNysLabel(nys){
  const dirArrow = nys.dir<0?"⟵":nys.dir>0?"⟶":"•";
  const tor = nys.tdir<0?" ↺":nys.tdir>0?" ↻":"";
  const spv=(nys.spv||0);
  const txt = spv < NeuroVOR.VIS_THRESH ? "brak jawnego oczopląsu"
    : `oczopląs poziomo-skrętny bije ${nys.dir<0?"w lewo":"w prawo"} · faza wolna ${spv.toFixed(1)}°/s`;
  return `<div class="nyslabel"><span class="arrow">${dirArrow}${tor}</span><span>${txt}</span></div>`;
}
// Werdykt HINTS: trzy składowe (HI · N · TS) z tagami + synteza obwód/ośrodek (INFARCT).
function hintsVerdictHTML(H){
  const v=H.verdict;
  const tag=(cls,txt)=>`<span class="tag ${cls}">${txt}</span>`;
  const hiNA = !H.ny.hasSpontaneous && !H.hi.abnormal;                 // brak AVS → HIT nieinformacyjny do różnicowania
  const hiRow = H.hi.abnormal
    ? [tag("ok","HI"), `Head-Impulse: sakada korygująca po stronie ${H.hi.side==="P"?"prawej":"lewej"} (kanał chory) — <b>obwodowy</b>.`]
    : H.ny.hasSpontaneous
      ? [tag("bad","HI"), `Head-Impulse: prawidłowy MIMO oczopląsu — <b>groźny</b> (ośrodek).`]
      : [tag("","HI"), `Head-Impulse: prawidłowy.`];
  const nyRow = H.ny.pattern==="directionChanging"
    ? [tag("bad","N"), `Oczopląs: zmienny kierunkowo, niehamowany fiksacją — <b>ośrodek</b>.`]
    : H.ny.pattern==="unidirectional"
      ? [tag("ok","N"), `Oczopląs: jednokierunkowy${H.ny.suppresses?", tłumiony fiksacją":""} — <b>obwodowy</b>.`]
      : [tag("","N"), `Oczopląs: brak samoistnego.`];
  const tsRow = H.ts.present
    ? (H.ts.central
        ? [tag("bad","TS"), `Test of Skew: dodatni (rozjazd pionowy) — <b>ośrodek</b>.`]
        : [tag("ok","TS"), `Test of Skew: śladowy skew (${H.ts.skewDeg}°, łagiewka) — <b>obwodowy</b>, poniżej progu ośrodkowego.`])
    : [tag("ok","TS"), `Test of Skew: ujemny (oczy w linii).`];
  const vText = v==="central"?"Wzorzec OŚRODKOWY — groźny" : v==="peripheral"?"Wzorzec OBWODOWY — uspokajający" : "Bez cech ostrego zespołu przedsionkowego";
  const foot = v==="central"
    ? `<div class="note" style="color:#ffd9df;margin-top:10px"><b>INFARCT / czerwona flaga:</b> ${H.centralSigns.join("; ")}. Pilna ocena neurologiczna i MRI tylnego dołu (wyklucz udar). W ostrym zespole przedsionkowym HINTS bywa czulszy niż wczesne MRI — nie zwalnia z diagnostyki.</div>`
    : v==="peripheral"
      ? `<div class="note" style="margin-top:10px">Triada uspokajająca: patologiczny HIT + oczopląs jednokierunkowy tłumiony fiksacją + brak skew — zgodne z przyczyną obwodową. Zawsze interpretuj klinicznie (m.in. HINTS dotyczy AVS z oczopląsem).</div>`
      : `<div class="note" style="margin-top:10px">Brak oczopląsu samoistnego, HIT prawidłowy, brak skew — w tym modelu bez cech ostrego zespołu przedsionkowego.</div>`;
  const row=r=>`<div class="hrow">${r[0]}<span>${r[1]}</span></div>`;
  return `<div class="hverdict ${v}"><h4>Werdykt HINTS</h4><div class="vv">${vText}</div>
    ${row(hiRow)}${row(nyRow)}${row(tsRow)}${foot}</div>`;
}
function renderHints(){
  const key=state.hintsScenario||"neuritisR";
  const custom=!!state.hintsCustom;                // tryb „matematycznego pacjenta"
  const p=hintsActivePatient();                    // scenariusz+kompensacja LUB własne parametry
  const fixOn=!!state.hintsFix;                    // true=światło/fiksacja · false=Frenzel/ciemność
  const gaze=state.hintsGaze||0, gazeDeg=gaze*20;  // -1/0/+1 → -20/0/+20°
  const nys=NeuroVOR.nystagmusAtGaze(p, gazeDeg, fixOn);
  const H=NeuroVOR.hints(p), sp=NeuroVOR.spontaneous(p);
  const lastHi = hintsHitSpecOf() ? NeuroVOR.headImpulse(p, hintsHitSpecOf()) : null;   // odtwórz opis dla ostatnio pchniętego kanału
  const fam = custom ? "custom" : key==="normal" ? "normal" : key==="strokeCentral" ? "stroke" : "neuritis";
  const famBtn=(f,lbl,desc,on)=>`<button class="opt" aria-pressed="${fam===f}" onclick="${on}" style="min-height:auto;padding:10px 11px;font-size:12.5px">${lbl}<small>${desc}</small></button>`;
  const gazeBtn=(g,lbl)=>`<button aria-pressed="${gaze===g}" onclick="setHintsGaze(${g})">${lbl}</button>`;
  const fixBtn=(v,lbl)=>`<button aria-pressed="${fixOn===v}" onclick="setHintsFix(${v})">${lbl}</button>`;
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="Wróć"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>Różnicowanie — HINTS</b><span>ośrodek ↔ obwód · silnik z pierwszych zasad</span></div>
      ${fam==="neuritis" ? `<div class="sidewrap"><em>strona</em><div class="sidepill"><button data-s="L" aria-pressed="${state.hintsSide==='L'}" onclick="setHintsNeuritisSide('L')">L</button><button data-s="P" aria-pressed="${state.hintsSide==='P'}" onclick="setHintsNeuritisSide('P')">P</button></div></div>` : ""}</div>
    <div class="group" style="margin-top:4px"><div class="label"><span class="eyebrow">Scenariusz</span><span class="hint">zmienia tylko parametry fizjologii</span></div>
      <div class="seg four">${famBtn('normal','Zdrowy','prawidłowy VOR',"setHintsDx('normal')")}${famBtn('neuritis','Neuronitis','obwód',"setHintsDx('neuritis')")}${famBtn('stroke','Udar','ośrodek (AVS)',"setHintsDx('stroke')")}${famBtn('custom','Własny','matematyczny pacjent',"openHintsCustom()")}</div></div>
    <div data-verdict>${hintsVerdictBlock(H)}</div>
    ${custom ? (state.hintsQuiz && !state.hintsQuizReveal ? hintsQuizBanner() : hintsCustomPanel()) : hintsCompPanel(key)}
    <div class="panelbox hpanel" style="margin-top:12px">
      <h4>Oczopląs samoistny — widok frontalny</h4>
      <div class="hint-eyes ${fixOn?'':'dark'}">
        <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-neuronys>${eyesSVG()}</div><span class="emk">L</span></div>
        ${fixOn?"":'<div class="frenzel-tag">◌ gogle Frenzla — fiksacja zniesiona</div>'}
      </div>
      <div data-nyslabel>${hintsNysLabel(nys)}</div>
      <div class="hctrl"><span class="lbl">Fiksacja</span>
        <div class="pillseg">${fixBtn(false,"Frenzel")}${fixBtn(true,"Światło")}</div></div>
      <div class="hctrl"><span class="lbl">Spojrzenie</span>
        <div class="pillseg">${gazeBtn(-1,"◀ lewo")}${gazeBtn(0,"środek")}${gazeBtn(1,"prawo ▶")}</div></div>
      ${p.dehiscence ? `<div class="hctrl"><span class="lbl">SCDS · bodziec</span>
        <div class="pillseg"><button onclick="hintsSCDSStim('sound')">🔊 Dźwięk / Valsalva</button><button onclick="hintsSCDSStim('suction')">Podciśnienie</button></div></div>
      <div class="note" data-scdsnote>${scdsRestNote(p)}</div>` : ""}
      <div class="note" data-supplnote>${hintsSupplHTML(H,fixOn,sp)}</div>
    </div>
    <div class="panelbox hpanel" style="margin-top:12px">
      <h4>Test pchnięcia głowy (HIT) — obserwuj cel ○</h4>
      <div class="viewpoint">widok badającego (naprzeciw pacjenta) — P = ucho prawe pacjenta, L = ucho lewe</div>
      <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-hit>${hitSVG()}</div><span class="emk">L</span></div>
      <div class="hctrl" style="justify-content:center"><span class="lbl">Płaszczyzna</span>
        <div class="pillseg">${["HC","RALP","LARP"].map(pl=>`<button aria-pressed="${(state.hintsPlane||'HC')===pl}" onclick="setHintsPlane('${pl}')">${pl==='HC'?'HC poziomy':pl}</button>`).join("")}</div></div>
      <div class="hctrl" style="justify-content:center"><span class="lbl">Pchnij</span>
        <div class="pillseg">${(NeuroVOR.PLANE_CANALS[state.hintsPlane||'HC']).map(s=>`<button data-hitbtn="${s.canal}-${s.ear}" aria-pressed="${state.hintsHitSide===s.ear && (state.hintsHitCanal||'horizontal')===s.canal}" onclick="hintsHIT('${s.canal}','${s.ear}')">${hitPushLabel(s.canal,s.ear)}</button>`).join("")}</div></div>
      <div class="note" data-hitlabel>${lastHi ? hitLabel(lastHi) : ((state.hintsPlane||'HC')==='HC' ? "Kliknij stronę (ucho pacjenta), aby wykonać szybkie pchnięcie głowy. Oczy powinny zostać na celu; sakada korygująca = kanał chory po tej stronie." : "Płaszczyzny skośne RALP/LARP badają kanały PIONOWE (przedni/tylny). Sakada korygująca jest pionowo-skrętna. Wybierz kanał do pchnięcia.")}</div>
    </div>
    <div class="panelbox hpanel" style="margin-top:12px">
      <h4>Odchylenie skośne — naprzemienne zasłanianie</h4>
      <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-skew>${skewSVG()}</div><span class="emk">L</span></div>
      <div class="note">${skewLabel(H.ts)}</div>
    </div>
    ${custom ? `<div data-readout>${hintsReadoutHTML(p)}</div>` : ""}
    <p class="footnote">Wzorce poglądowe — narzędzie dydaktyczne, nie urządzenie diagnostyczne. Interpretuj klinicznie.</p>`;
  requestAnimationFrame(()=>{
    const c=$('[data-neuronys]'); if(c) startNeuroNys(c, nys, gazeDeg);
    const sk=$('[data-skew]'); if(sk) startSkew(sk, H.ts);
  });
}
// Pacjent = scenariusz + KOMPENSACJA ośrodkowa (tylko obwód). Regeneracja błędnika → sticky pacemaker (Bechterew).
function hintsCompPatient(key){
  const p=NeuroVOR.scenario(key), base=NeuroVOR.SCENARIOS[key];
  if(key!=="neuritisR" && key!=="neuritisL") return p;         // kompensujemy tylko uszkodzenie OBWODOWE
  p.comp=Math.max(0,Math.min(1,state.hintsComp||0));
  if(state.hintsRecovery && base.side){
    const ear=base.side, acute = ear==="P" ? (base.params.toneR??NeuroVOR.R0) : (base.params.toneL??NeuroVOR.R0);
    if(ear==="P") p.toneR=85; else p.toneL=85;                 // błędnik regeneruje (ton wraca ~do normy)
    p.lesionEar=ear;                                            // historia: która strona była chora
    p.pacemakerBias=0.7*p.comp*(NeuroVOR.R0-acute);            // sticky ładunek pacemakera — Bechterew ∝ c
  }
  return p;
}
const compStage=c=> c<0.05?"Faza ostra" : c<0.4?"Podostra" : c<0.85?"Zaawansowana" : "Pełna kompensacja";
const compRowHTML=(sp,pr)=>`<span>Clamp móżdżkowy <b>−${(sp.clampAmt||0).toFixed(0)} Hz</b></span><span>Pacemaker <b>+${(sp.paceAmt||0).toFixed(0)} Hz</b></span><span>Velocity storage <b>${pr.tau.toFixed(1)} s</b></span>`;
function compNoteHTML(c,rec,sp){
  const t = rec ? "Błędnik odzyskuje funkcję. Jeśli pacemaker zdążył się naładować (wyższa kompensacja) — pojawia się oczopląs powrotny."
    : c<0.05 ? "Faza ostra: pełna asymetria toniczna → silny oczopląs samoistny; w vHIT sakady JAWNE (overt, spóźnione)."
    : c<0.85 ? "Kompensacja statyczna znosi asymetrię spoczynkową (oczopląs słabnie). Dynamika (gain vHIT) trwa — sakady przechodzą w UKRYTE (covert)."
    : "Pełna kompensacja: brak oczopląsu samoistnego, velocity storage skrócone. vHIT nadal ujawnia deficyt (sakady ukryte) — dynamiki NIE da się naprawić.";
  const bech = sp&&sp.bechterew ? `<div style="color:#ffcf8f;margin-top:6px">Oczopląs POWROTNY (Bechterewa): błędnik wrócił, a pacemaker wciąż naładowany → bije ku uchu <b>wcześniej choremu</b>.</div>` : "";
  return t+bech;
}
// Panel kompensacji — tylko dla scenariuszy obwodowych (neuronitis). „Jeden suwak" steruje całą fizjologią.
function hintsCompPanel(key){
  if(key!=="neuritisR" && key!=="neuritisL") return "";
  const c=state.hintsComp||0, pct=Math.round(c*100), rec=!!state.hintsRecovery;
  const p=hintsCompPatient(key), sp=NeuroVOR.spontaneous(p), pr=NeuroVOR.postRotational(p);
  const recBtn=(v,lbl)=>`<button aria-pressed="${rec===v}" onclick="setHintsRecovery(${v})">${lbl}</button>`;
  return `<div class="panelbox hpanel" data-comppanel style="margin-top:12px">
    <h4>Kompensacja ośrodkowa<span class="comptag" data-comptag>${pct}% · ${compStage(c)}</span></h4>
    <input type="range" class="comprange" min="0" max="100" value="${pct}" oninput="setHintsComp(this.value)" onchange="rerunHintsHIT()" aria-label="Poziom kompensacji ośrodkowej">
    <div class="comprow" data-comprow>${compRowHTML(sp,pr)}</div>
    <div class="hctrl"><span class="lbl">Błędnik</span>
      <div class="pillseg">${recBtn(false,"nieczynny")}${recBtn(true,"regeneracja")}</div></div>
    <div class="note" data-compnote>${compNoteHTML(c,rec,sp)}</div>
  </div>`;
}
// Opis oczopląsu samoistnego pod panelem (fiksacja / kierunek / Bechterew) — współdzielony z odświeżaniem suwaka.
function hintsSupplHTML(H,fixOn,sp){
  const suppl = H.ny.hasSpontaneous
    ? (fixOn ? (H.ny.suppresses ? "Z fiksacją oczopląs OBWODOWY słabnie (kłaczek tłumi dryf)."
                                : "Mimo fiksacji oczopląs NIE słabnie — cecha OŚRODKOWA.")
             : "Bez fiksacji (gogle Frenzla / ciemność) oczopląs bije z pełną siłą.")
    : "Brak oczopląsu samoistnego w tym scenariuszu.";
  const dc = H.ny.directionChanging ? " Zmienia kierunek ze spojrzeniem → OŚRODEK." : "";
  const be = sp&&sp.bechterew ? " Kierunek ODWRÓCONY (oczopląs powrotny Bechterewa)." : "";
  return suppl+dc+be;
}
// Lekkie odświeżenie przy przeciąganiu suwaka: aktualizuje odczyty/werdykt/animację bez przebudowy DOM (płynnie).
function refreshHintsComp(){
  const key=state.hintsScenario||"neuritisR", p=hintsCompPatient(key);
  const fixOn=!!state.hintsFix, gazeDeg=(state.hintsGaze||0)*20;
  const nys=NeuroVOR.nystagmusAtGaze(p,gazeDeg,fixOn);
  const H=NeuroVOR.hints(p), sp=NeuroVOR.spontaneous(p), pr=NeuroVOR.postRotational(p);
  const c=state.hintsComp||0, set=(sel,html)=>{const el=$(sel); if(el) el.innerHTML=html;};
  set('[data-comptag]', `${Math.round(c*100)}% · ${compStage(c)}`);
  set('[data-comprow]', compRowHTML(sp,pr));
  set('[data-compnote]', compNoteHTML(c,state.hintsRecovery,sp));
  set('[data-verdict]', hintsVerdictHTML(H));
  set('[data-nyslabel]', hintsNysLabel(nys));
  set('[data-supplnote]', hintsSupplHTML(H,fixOn,sp));
  if(hintsHitSpecOf()) set('[data-hitlabel]', hitLabel(NeuroVOR.headImpulse(p, hintsHitSpecOf())));  // opis vHIT: JAWNA↔UKRYTA na żywo
  const cont=$('[data-neuronys]'); if(cont) startNeuroNys(cont, nys, gazeDeg);   // płynna zmiana amplitudy
}
// Parametry animacji oczopląsu (amplituda/kierunek) — odczytywane na żywo z pętli (płynny suwak kompensacji).
// Składowe poziomą, PIONOWĄ i skrętną (E3/SCDS): torsja i pion napędzane siłą pionowo-skrętną, gdy poziom=0
// (neuronitis dolny, SCDS = czysto pionowo-skrętny). Poziom nadal z nys.strength (wstecznie zgodne).
// PRÓG WIDOCZNOŚCI: nie animujemy oczopląsu poniżej VIS_THRESH (jak etykieta) — inaczej zdrowy/BVH/SCDS-w-spoczynku
// pokazywałyby drobny sub-progowy DRYF SPOJRZENIOWY (np. τ=25 → 0.8°/s, klinicznie niewidoczny). [Fix 2026-07-10]
function neuroNysParams(nys, gazeDeg){
  const camRx=Scene3D.CAMERAS.frontal.right[0];
  const VISFRAC=(NeuroVOR.VIS_THRESH||2)/(NeuroVOR.SPV_MAX||12);           // próg widoczności przeniesiony na strength (~0.17)
  let sH=Math.max(0,Math.min(1,nys.strength||0));                          // siła składowej POZIOMEJ
  let sV=Math.max(0,Math.min(1, nys.strengthV!=null ? nys.strengthV : (nys.dir?0:nys.strength)||0));  // PIONOWO-skrętnej
  if(sH<VISFRAC) sH=0;                                                     // poniżej progu → nie animuj (spójne z etykietą)
  if(sV<VISFRAC) sV=0;
  return { gazePx:(gazeDeg||0)*camRx*0.5, Ah:7*sH, Av:6*sV, At:8*Math.max(sH,sV),
           hDir:nys.dir||0, vDir:nys.vdir||0, tDir:nys.tdir||nys.dir||0 };
}
// Ciągły oczopląs poziomo-skrętny + odchylenie spojrzenia. Parametry aktualizowalne bez restartu FAZY:
// ponowne wywołanie tylko podmienia __nnParams (suwak kompensacji zmienia amplitudę płynnie).
function startNeuroNys(container, nys, gazeDeg){
  const irises=[...container.querySelectorAll(".iris")]; if(!irises.length) return;
  container.__nnParams = neuroNysParams(nys, gazeDeg);
  if(container.__nnRunning) return;                // pętla już działa → sama odczyta nowe __nnParams
  container.__nnRunning = true;
  const T=780, fast=0.17, start=performance.now();
  loopRAF((now)=>{
    if(!document.body.contains(container)){ container.__nnRunning=false; return false; }
    const P=container.__nnParams, ph=((now-start)%T)/T, o=nysOffset(ph,fast);
    const x=P.gazePx + o*P.Ah*P.hDir, y=-o*(P.Av||0)*(P.vDir||0), rot=o*P.At*P.tDir;   // y: ekran w dół = +, vdir<0 downbeat → +y
    for(const g of irises){ const cx=+g.dataset.cx, cy=+g.dataset.cy;
      g.setAttribute("transform",`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)} ${cx} ${cy})`); }
    return true;                                    // ciągły — do usunięcia kontenera (zmiana warunków/render)
  });
}

/* --- Test pchnięcia głowy (HIT): WIDOK FRONTALNY (badający naprzeciw pacjenta, lustro: P=ekran-lewo,
   L=ekran-prawo). Głowa yaw ku pchniętemu uchu (translacja poglądowa), oczy kompensują wg VOR gain;
   sakada korygująca gdy niedomiar — JAWNA (po ruchu) vs UKRYTA (w trakcie, tylko vHIT). --- */
function hitSVG(){
  const eye=(cx)=>`<ellipse cx="${cx}" cy="66" rx="27" ry="21" fill="#EEF3F7" stroke="var(--line)" stroke-width="2"/>
    <g class="hiris"><circle cx="${cx}" cy="66" r="10" fill="#3A6B86"/><circle cx="${cx}" cy="66" r="5" fill="#0b1118"/></g>`;
  return `<svg viewBox="0 0 240 150" class="eyes" role="img" aria-label="Test pchnięcia głowy — widok frontalny (badający naprzeciw pacjenta)">
    <line x1="120" y1="2" x2="120" y2="15" stroke="var(--faint)" stroke-width="2"/><circle cx="120" cy="21" r="4" fill="none" stroke="var(--faint)" stroke-width="2"/>
    <g id="hithead">
      <ellipse cx="47" cy="88" rx="9" ry="15" fill="#16222c" stroke="#2b3e4b" stroke-width="2"/>
      <ellipse cx="193" cy="88" rx="9" ry="15" fill="#16222c" stroke="#2b3e4b" stroke-width="2"/>
      <rect x="53" y="40" width="134" height="96" rx="42" fill="#16222c" stroke="#2b3e4b" stroke-width="2"/>
      ${eye(95)}${eye(145)}
      <path d="M120 80 l-6 15 h12 Z" fill="#22303d" stroke="#33404d" stroke-width="1.4"/>
      <path d="M103 111 q17 11 34 0" fill="none" stroke="#33404d" stroke-width="2.2" stroke-linecap="round"/>
    </g>
  </svg>`;
}
// vHIT: pchnięcie GENERALNE (płaszczyzny HC/RALP/LARP). Głowa przesuwa się w kierunku ekranowym sakady
// korygującej (dla HC czysto poziomo — jak dotąd), oczy nadążają wg gain, a niedomiar → sakada w tym kierunku
// (+ skręt dla kanałów pionowych). Wektor {h,v,t} z silnika (Ewald/quickPhase). HC bez zmian numerycznych.
function startHIT(container, hi){
  const head=container.querySelector('#hithead');
  const irises=[...container.querySelectorAll('.hiris')];
  if(!head||!irises.length) return;
  const token=(container.__hitTok=(container.__hitTok||0)+1);
  const camRx=Scene3D.CAMERAS.frontal.right[0];
  const sx=hi.saccade.h*(-camRx), sy=-hi.saccade.v;       // ekran: x=prawo, y=dół (v „w górę" → −y). HC: sy=0
  const mag=Math.hypot(sx,sy)||1, ux=sx/mag, uy=sy/mag;   // jednostkowy kierunek pchnięcia = kierunek sakady korygującej
  const tor=hi.saccade.t*Math.sign(camRx||1);             // znak torsji w widoku lustrzanym badającego
  // Skok ANIZOTROPOWY: oko to elipsa rx27×ry21, źrenica r10 → poziomo mieści się ±17, PIONOWO tylko ±11.
  // Amplitudy dobrane na ~2 px marginesu (jak w poziomie): pozioma 15 (27−10−2), pionowa 9 (21−10−2);
  // |local| ≤ amplituda także przy pełnej kompensacji → źrenica NIE wychodzi poza obrys w żadnej płaszczyźnie.
  const HEADPX=15, HEADPY=9, IRIS_X=17, IRIS_Y=11, TOR_MAX=9;    // HC bez zmian (uy=0); RALP/LARP używają osi pionowej
  const gain=Math.max(0,Math.min(1.2,hi.gain)), errMax=Math.max(0,1-gain);  // niedomiar rotacji oka
  const covFrac=Math.max(0,Math.min(1,hi.covertFrac||0)); // udział sakady UKRYTEJ (predykcyjnej)
  const cen=irises.map(g=>{const c=g.querySelector('circle');return {cx:+c.getAttribute('cx'),cy:+c.getAttribute('cy')};});
  const T_IMP=200, T_COV=110, T_HOLD=150, T_SAC=90, T_RET=420, T_END=T_IMP+T_HOLD+T_SAC+T_RET;
  const corr=t=> t<T_COV ? 0
    : t<T_IMP ? covFrac*((t-T_COV)/(T_IMP-T_COV))
    : t<T_IMP+T_HOLD ? covFrac
    : t<T_IMP+T_HOLD+T_SAC ? covFrac+(1-covFrac)*((t-T_IMP-T_HOLD)/T_SAC)
    : 1;
  const start=performance.now();
  loopRAF((now)=>{
    if(container.__hitTok!==token || !document.body.contains(container)) return false;
    const t=now-start; let prof, raw;                     // prof = profil skoku głowy (0..1), raw = niedomiar zanim skoryguje
    if(t<T_IMP){ prof=easeInOut(t/T_IMP); raw=prof; }                                    // pchnięcie
    else if(t<T_IMP+T_HOLD+T_SAC){ prof=1; raw=1; }                                      // utrzymanie + sakada korygująca
    else if(t<T_END){ prof=1-easeInOut((t-T_IMP-T_HOLD-T_SAC)/T_RET); raw=0; }           // powrót
    else { head.setAttribute('transform','translate(0 0)'); irises.forEach(g=>g.setAttribute('transform','translate(0 0)')); return false; }
    const hX=ux*HEADPX*prof, hY=uy*HEADPY*prof;                                          // pozycja głowy (ekran; pion mniejszy — krótsza oś oka)
    const err=errMax*Math.max(0, raw-corr(t));            // pozostały błąd fiksacji (covert znosi część już w ruchu)
    const gX=ux*HEADPX*err, gY=uy*HEADPY*err, rot=tor*TOR_MAX*err;
    head.setAttribute('transform',`translate(${hX.toFixed(2)} ${hY.toFixed(2)})`);
    const lX=Math.max(-IRIS_X,Math.min(IRIS_X,gX-hX)), lY=Math.max(-IRIS_Y,Math.min(IRIS_Y,gY-hY));  // źrenica = dziecko głowy; klamra per oś (obrys elipsy)
    irises.forEach((g,i)=>g.setAttribute('transform',`translate(${lX.toFixed(2)} ${lY.toFixed(2)}) rotate(${rot.toFixed(2)} ${cen[i].cx} ${cen[i].cy})`));
    return true;
  });
}
// Kierunek sakady korygującej (opis) — pozioma (HC) lub pionowo-skrętna (kanały przednie/tylne).
function hitSaccadeDir(hi){
  if(hi.plane==="HC") return "pozioma, ku linii środkowej";
  const v = hi.saccade.v>0 ? "ku górze" : "ku dołowi";
  const t = Math.abs(hi.saccade.t)>0.15 ? ` + skrętna (bieguny górne ${hi.saccade.t>0?"w prawo":"w lewo"})` : "";
  return v+t;
}
function hitPushLabel(canal, ear){
  if(canal==="horizontal") return ear==="P"?"prawemu (P)":"lewemu (L)";
  return `${ear==="P"?"prawy":"lewy"} ${canal==="anterior"?"przedni":"tylny"}`;
}
// Spec ostatnio pchniętego kanału (string dla HC, {canal,ear} dla pionowych) — do odtworzenia opisu przy suwakach.
function hintsHitSpecOf(){
  if(state.hintsHitSide==null) return null;
  const canal=state.hintsHitCanal||"horizontal";
  return canal==="horizontal" ? state.hintsHitSide : {canal, ear:state.hintsHitSide};
}
function hitLabel(hi){
  const g=hi.gain.toFixed(2);
  const what = hi.plane==="HC" ? `Pchnięcie ku uchu ${hi.toSide==="P"?"prawemu (P)":"lewemu (L)"}`
             : `Pchnięcie w płaszczyźnie ${hi.plane} (kanał ${hi.canal==="anterior"?"przedni":"tylny"} ${hi.ear==="P"?"prawy":"lewy"})`;
  const dir = ` Sakada korygująca: ${hitSaccadeDir(hi)}.`;
  const vhitOnly = ` <b style="color:#ffcf8f">Sakada UKRYTA (covert) — rejestrowana tylko w vHIT (video), niewidoczna gołym okiem.</b>`;
  if(!hi.abnormal) return `<b style="color:#7fe3c4">${what}: bez sakady</b> · VOR gain ${g} → HIT prawidłowy.`;
  if(hi.overtSaccade && hi.covertSaccade) return `<b style="color:#ffbf8f">${what}: sakada JAWNA + UKRYTA</b> · gain ${g} → HIT patologiczny (obwód), deficyt <b>częściowo skompensowany</b>.${dir}${vhitOnly}`;
  if(hi.overtSaccade)  return `<b style="color:#ff9bab">${what}: sakada JAWNA (overt)</b> · gain ${g} → HIT patologiczny (obwód), deficyt <b>nieskompensowany</b> — widoczna gołym okiem (bedside).${dir}`;
  if(hi.covertSaccade) return `<b style="color:#ffcf8f">${what}: sakada UKRYTA (covert)</b> · gain ${g} wciąż niski, korekta W TRAKCIE ruchu → <b>bedside HIT „prawidłowy"</b>, deficyt widoczny TYLKO w vHIT (video).${dir}`;
  return `<b style="color:#7fe3c4">${what}: bez jawnej sakady</b> · VOR gain ${g}.`;
}
function setHintsPlane(pl){ state.hintsPlane=pl; state.hintsHitSide=null; render(); }
function hintsHIT(canal, ear){
  if(ear===undefined){ ear=canal; canal="horizontal"; }        // wstecznie: hintsHIT('P') = HC
  state.hintsHitCanal=canal; state.hintsHitSide=ear;
  const spec = canal==="horizontal" ? ear : {canal, ear};
  const hi=NeuroVOR.headImpulse(hintsActivePatient(), spec);    // scenariusz+kompensacja LUB własne parametry
  const c=$('[data-hit]'); if(c) startHIT(c, hi);
  const lab=$('[data-hitlabel]'); if(lab) lab.innerHTML=hitLabel(hi);
  const id=canal+"-"+ear;
  document.querySelectorAll('[data-hitbtn]').forEach(b=>b.setAttribute('aria-pressed', String(b.dataset.hitbtn===id)));
}
// Ponowne pchnięcie ostatniego kanału — po zmianie suwaka (pokazuje przejście overt→covert / zmianę gain).
function rerunHintsHIT(){ if(state.hintsHitSide) hintsHIT(state.hintsHitCanal||"horizontal", state.hintsHitSide); }

/* --- Test odchylenia skośnego: naprzemienne zasłanianie → pionowa sakada korygująca gdy skew obecny --- */
function skewSVG(){
  const eye=(cx,side)=>`<ellipse cx="${cx}" cy="55" rx="32" ry="25" fill="#EEF3F7" stroke="var(--line)" stroke-width="2"/>
    <g class="skiris" data-eye="${side}"><circle cx="${cx}" cy="55" r="14" fill="#3A6B86"/><circle cx="${cx}" cy="55" r="6.5" fill="#0b1118"/></g>`;
  return `<svg viewBox="0 0 240 110" class="eyes" role="img" aria-label="Test naprzemiennego zasłaniania">
    ${eye(70,"P")}${eye(170,"L")}
    <rect id="skcover" x="34" y="22" width="72" height="66" rx="10" fill="#0b1118" stroke="#33404d" stroke-width="2" opacity="0.96"/>
  </svg>`;
}
function startSkew(container, sk){
  const irisP=container.querySelector('.skiris[data-eye="P"]');
  const irisL=container.querySelector('.skiris[data-eye="L"]');
  const cover=container.querySelector('#skcover');
  if(!irisP||!irisL||!cover) return;
  const token=(container.__skTok=(container.__skTok||0)+1);
  const off=sk.present?Math.min(15, sk.skewDeg*4):0;      // px pionowego rozjazdu (SVG: −y=góra)
  const devP=(sk.sign>0?-1:1)*off, devL=-devP;             // sign>0: oko P wyżej
  const period=2600, half=1300, SAC=150, covXP=34, covXL=134;
  const start=performance.now();
  loopRAF((now)=>{
    if(container.__skTok!==token || !document.body.contains(container)) return false;
    const tt=(now-start)%period, pCov=tt<half;            // pCov: zasłonięte oko P (odsłonięte L)
    cover.setAttribute('x', pCov?covXP:covXL);
    const yP = pCov ? devP : devP*(1-Math.min(1,(tt-half)/SAC));   // odsłonięte P: sakada dev→cel
    const yL = !pCov ? devL : devL*(1-Math.min(1,tt/SAC));          // odsłonięte L: sakada dev→cel
    irisP.setAttribute('transform',`translate(0 ${yP.toFixed(2)})`);
    irisL.setAttribute('transform',`translate(0 ${yL.toFixed(2)})`);
    return true;
  });
}
function skewLabel(sk){
  if(!sk.present) return `<b style="color:#7fe3c4">Skew nieobecny</b> — oczy pozostają w linii pionowej przy naprzemiennym zasłanianiu.`;
  const who = sk.hyperSide?`, oko ${sk.hyperSide==="P"?"prawe":"lewe"} wyżej`:"";
  return sk.central
    ? `<b style="color:#ff9bab">Skew OBECNY (~${sk.skewDeg}°${who})</b> — pionowa sakada przy odsłanianiu = objaw OŚRODKOWY.`
    : `<b style="color:#ffd9a0">Śladowy skew (~${sk.skewDeg}°${who})</b> — poniżej progu ośrodkowego; drobny rozjazd łagiewkowy (obwodowy, np. nerw górny).`;
}

/* ============ Akcje ============ */
function setMode(m){ state.mode=m; render(); }
function openHints(key){ state.hintsCustom=null; state.hintsScenario=key||"neuritisR"; state.hintsSide = key==="neuritisL"?"L":"P"; state.hintsFix=false; state.hintsGaze=0; state.hintsComp=0; state.hintsRecovery=false; state.hintsHitSide=null; state.screen="hints"; render(); }
// 3 scenariusze: zdrowy / neuronitis / udar (strona neuronitis osobnym przełącznikiem L/P jak w manewrach)
function setHintsDx(fam){
  state.hintsCustom=null; state.hintsQuiz=false;    // wyjście z trybu „Własny"
  state.hintsScenario = fam==="normal" ? "normal" : fam==="stroke" ? "strokeCentral" : (state.hintsSide==="L"?"neuritisL":"neuritisR");
  state.hintsComp=0; state.hintsRecovery=false; state.hintsHitSide=null; render();
}
function setHintsNeuritisSide(s){    // L/P ucha zajętego; zachowuje poziom kompensacji (porównanie stron), wymusza ponowne pchnięcie
  state.hintsSide=s; state.hintsScenario = s==="L"?"neuritisL":"neuritisR"; state.hintsHitSide=null; render();
}
function setHintsFix(v){ state.hintsFix=!!v; render(); }
function setHintsGaze(g){ state.hintsGaze=g; render(); }
function setHintsComp(v){ state.hintsComp=Math.max(0,Math.min(1,(+v||0)/100)); refreshHintsComp(); }   // suwak (oninput) → lekkie odświeżenie
function setHintsRecovery(v){ state.hintsRecovery=!!v; render(); }

/* ============ „Matematyczny pacjent" — tryb własnych parametrów (etap 7 / UI) ============ */
// Pacjent aktywny: własne parametry (pełny obiekt makePatient) LUB scenariusz+kompensacja.
function hintsActivePatient(){
  return state.hintsCustom ? NeuroVOR.makePatient(state.hintsCustom)
                           : hintsCompPatient(state.hintsScenario||"neuritisR");
}
// Werdykt HINTS z zasłoną w trybie quiz (zanim odsłonisz rozpoznanie).
function hintsVerdictBlock(H){
  if(state.hintsCustom && state.hintsQuiz && !state.hintsQuizReveal)
    return `<div class="hverdict"><h4>Werdykt HINTS</h4><div class="vv">Quiz — ukryto werdykt</div>
      <div class="note" style="margin-top:6px">Zbadaj pacjenta (oczopląs + fiksacja, HIT, skew), postaw rozpoznanie, a potem odsłoń.</div></div>`;
  return hintsVerdictHTML(H);
}
// Presety scenariuszowe (obok trybu NEURONITIS, który steruje ramką „Wypadnięcie gałęzi nerwu").
// Neuronitis (górny/dolny/cały × L/P × nasilenie) NIE ma osobnych przycisków — konfiguruje się w ramce nerwu.
const HINTS_PRESETS = {
  healthy: { label:"Zdrowy",              make:()=>({}) },
  bvh:     { label:"BVH (obustronny)",    make:()=>NeuroVOR.bilateralLoss(1) },
  meniereP:{ label:"Ménière — drażnienie P", make:()=>NeuroVOR.meniere("P",{phase:"irritative"}) },
  meniereL:{ label:"Ménière — drażnienie L", make:()=>NeuroVOR.meniere("L",{phase:"irritative"}) },
  scdsP:   { label:"SCDS P",              make:()=>({dehiscence:"P"}) },
  scdsL:   { label:"SCDS L",              make:()=>({dehiscence:"L"}) },
  stroke:  { label:"Udar (ośrodek)",      make:()=>({toneR:72, gainL:1, gainR:1, fixationGain:0, integratorTau:2.2, skewTone:3, otrTorsion:4}) }
};
function loadHintsPreset(k){
  const pr=HINTS_PRESETS[k]; if(!pr) return;
  state.hintsCustom=NeuroVOR.makePatient(pr.make());
  state.hintsPreset=k;                                            // aktywny preset (podświetlenie + dynamiczna ramka)
  state.hintsHitSide=null; state.hintsQuiz=false; state.hintsQuizReveal=false; render();
}
// „Neuronitis" = wejście do konfiguratora gałęzi nerwu (ramka Ucho/Gałąź/Nasilenie), bez duplikowania przycisków.
function loadHintsNeuritis(){
  if(state.hintsNerveEar==null) state.hintsNerveEar="P";
  if(state.hintsNerveBranch==null) state.hintsNerveBranch="superior";
  if(state.hintsNerveSev==null) state.hintsNerveSev=1;            // domyślnie pełny neuronitis (jak dawny preset)
  state.hintsQuiz=false; state.hintsQuizReveal=false;
  applyHintsNerve();                                             // buduje hintsCustom + render (ustawi hintsPreset="neuritis")
}
// Wejście do trybu własnego (domyślnie łagodny neuronitis nerwu górnego P).
function openHintsCustom(){
  if(!state.hintsCustom){                                       // świeże wejście → domyślny łagodny neuronitis górny P
    state.hintsNerveEar="P"; state.hintsNerveBranch="superior"; state.hintsNerveSev=0.6;
    state.hintsCustom=NeuroVOR.makePatient(NeuroVOR.nerveBranchLesion("P","superior",0.6));
    state.hintsPreset="neuritis";                               // ramka nerwu = spójna z pacjentem
  }                                                             // jeśli pacjent już istnieje — NIE nadpisuj (ramka i suwaki zgodne)
  state.hintsHitSide=null; state.hintsQuiz=false; state.hintsQuizReveal=false; state.screen="hints"; render();
}
function exitHintsCustom(){ state.hintsCustom=null; state.hintsPreset=null; state.hintsQuiz=false; state.hintsQuizReveal=false; state.hintsHitSide=null; render(); }
function setHintsAdvanced(open){ state.hintsAdvanced=!!open; }   // details rozwija się sam, bez re-render

function findParamSpec(key){ for(const g of NeuroVOR.PARAM_SPEC) for(const pm of g.params) if(pm.key===key) return pm; return null; }
function fmtParamVal(v,spec){
  if(spec.type==="select"){ const o=(spec.options||[]).find(o=>String(o.v)===String(v)); return o?o.l:String(v); }
  const s=spec.step||1, dec = s>=1?0 : s>=0.1?1 : 2;
  return (dec? (+v).toFixed(dec) : String(Math.round(+v))) + (spec.unit?` ${spec.unit}`:"");
}
// Suwak/selektor pojedynczego parametru → aktualizacja na żywo (bez przebudowy DOM).
function setHintsParam(key,value){
  if(!state.hintsCustom) state.hintsCustom=NeuroVOR.makePatient({});
  const spec=findParamSpec(key);
  state.hintsCustom[key] = (spec && spec.type==="select") ? (value==="null"?null:value) : +value;
  const pv=$(`[data-pval="${key}"]`); if(pv&&spec) pv.textContent=fmtParamVal(state.hintsCustom[key],spec);
  if(spec && spec.type==="select"){ render(); return; }          // selektor zmienia layout (aria-pressed) → pełny render
  refreshHintsCustom();
}
// Szybki selektor wypadnięcia gałęzi nerwu (neuroanatomia): definiuje JEDNĄ zmianę obwodową — zeruje kanały
// (tony/gainy/kaloryka/łagiewkowy skew) do zdrowia, po czym nakłada ubytek gałęzi. Zachowuje parametry
// OŚRODKOWE i kompensację (kłaczek, integrator, OTR, comp, dehiscencja), by selektor był przewidywalny.
const HINTS_CANAL_KEYS=['toneL','toneR','gainL','gainR','caloricGainL','caloricGainR',
  'toneAcL','toneAcR','gainAcL','gainAcR','tonePcL','tonePcR','gainPcL','gainPcR','skewTone',
  'sacculeL','sacculeR','utricleL','utricleR'];   // otolity (VEMP) też resetowane przez selektor nerwu
function applyHintsNerve(){
  const ear=state.hintsNerveEar||"P", branch=state.hintsNerveBranch||"superior", sev=state.hintsNerveSev==null?1:state.hintsNerveSev;
  const o = branch==="full"
    ? Object.assign(NeuroVOR.nerveBranchLesion(ear,"superior",sev), NeuroVOR.nerveBranchLesion(ear,"inferior",sev))
    : NeuroVOR.nerveBranchLesion(ear,branch,sev);
  const base=state.hintsCustom||NeuroVOR.makePatient({}), healthy=NeuroVOR.makePatient({});
  HINTS_CANAL_KEYS.forEach(k=>{ base[k]=healthy[k]; });        // reset kanałów obwodowych do zdrowia
  state.hintsCustom = Object.assign(base, o);                  // nałóż ubytek gałęzi (ośrodek/kompensacja zachowane)
  state.hintsPreset="neuritis";                                // ramka nerwu = aktywny „Neuronitis"
  state.hintsHitSide=null; render();
}
// Dynamiczne podsumowanie ustawionej gałęzi nerwu (aktualizuje się z wyborem Ucho/Gałąź/Nasilenie).
function nerveLesionSummary(){
  const ear=state.hintsNerveEar||"P", branch=state.hintsNerveBranch||"superior", sev=state.hintsNerveSev==null?1:state.hintsNerveSev;
  const earW = ear==="P"?"prawe (P)":"lewe (L)";
  const brW = branch==="superior" ? "nerw GÓRNY (poziomy + przedni + łagiewka)"
            : branch==="inferior" ? "nerw DOLNY (tylny + woreczek)"
            : "CAŁY nerw (górny + dolny)";
  const exp = branch==="superior" ? "oczopląs poziomo-skrętny (bije ku zdrowemu), vHIT HC + przedni ↓, kaloryka ↓, oVEMP ↓, mały skew"
            : branch==="inferior" ? "oczopląs skrętno-DOWNBEAT (ku zdrowemu), vHIT tylny ↓, kaloryka + HC prawidłowe, cVEMP ↓, przechył SVV ku choremu"
            : "pełny ubytek: vHIT wszystkich płaszczyzn ↓, kaloryka ↓, oba VEMP ↓";
  return `<b>Neuronitis</b> — ${brW}, ucho ${earW}, nasilenie <b>${Math.round(sev*100)}%</b>.<br>Spodziewany obraz: ${exp}.`;
}
function setHintsNerveEar(e){ state.hintsNerveEar=e; applyHintsNerve(); }
function setHintsNerveBranch(b){ state.hintsNerveBranch=b; applyHintsNerve(); }
function setHintsNerveSev(v){ state.hintsNerveSev=Math.max(0,Math.min(1,+v||0));
  const pv=$('[data-nervesev]'); if(pv) pv.textContent=`${Math.round(state.hintsNerveSev*100)}%`;
  const su=$('[data-nervesummary]'); if(su) su.innerHTML=nerveLesionSummary();   // dynamiczne podsumowanie na żywo
}
// Losowy pacjent (quiz): archetyp patologii z losowymi parametrami; werdykt/lokalizacja ukryte do odsłonięcia.
function hintsRandomPatient(){
  const ear=()=>Math.random()<0.5?"L":"P", r=(a,b)=>a+Math.random()*(b-a);
  const archetypes=[
    ()=>({}),                                                             // zdrowy
    ()=>NeuroVOR.nerveBranchLesion(ear(),"superior", r(0.55,1)),          // neuronitis górny
    ()=>NeuroVOR.nerveBranchLesion(ear(),"inferior", r(0.6,1)),           // neuronitis dolny
    ()=>NeuroVOR.bilateralLoss(r(0.6,1)),                                 // BVH
    ()=>NeuroVOR.meniere(ear(),{phase: Math.random()<0.5?"irritative":"paretic"}),  // Ménière
    ()=>({dehiscence:ear()}),                                            // SCDS
    ()=>({toneR:r(60,80), gainL:1, gainR:1, fixationGain:0, integratorTau:r(1.8,3), skewTone:r(2,5), otrTorsion:r(2,5)})  // udar
  ];
  state.hintsCustom=NeuroVOR.makePatient(archetypes[Math.floor(Math.random()*archetypes.length)]());
  state.hintsPreset=null; state.hintsHitSide=null; state.hintsQuiz=true; state.hintsQuizReveal=false; render();
}
function revealHintsQuiz(){ state.hintsQuizReveal=true; render(); }

// Panel sterowania parametrami (PARAM_SPEC): presety + selektor nerwu + suwaki basic + zaawansowane (zwijane).
function hintsCustomPanel(){
  const p=state.hintsCustom||NeuroVOR.makePatient({}), active=state.hintsPreset;
  const presetBtn=k=>`<button class="preset" aria-pressed="${active===k}" onclick="loadHintsPreset('${k}')">${HINTS_PRESETS[k].label}</button>`;
  const presets = presetBtn("healthy")
    + `<button class="preset" aria-pressed="${active==='neuritis'}" onclick="loadHintsNeuritis()">Neuronitis</button>`
    + ["bvh","meniereP","meniereL","scdsP","scdsL","stroke"].map(presetBtn).join("");
  const ear=state.hintsNerveEar||"P", branch=state.hintsNerveBranch||"superior", sev=state.hintsNerveSev==null?1:state.hintsNerveSev;
  const ne=(e)=>`<button aria-pressed="${ear===e}" onclick="setHintsNerveEar('${e}')">${e}</button>`;
  const nb=(b,l)=>`<button aria-pressed="${branch===b}" onclick="setHintsNerveBranch('${b}')">${l}</button>`;
  // Ramka „Wypadnięcie gałęzi nerwu" = konfigurator NEURONITIS; widoczna tylko dla trybu neuronitis (bez duplikacji).
  const nerveBox = active==="neuritis" ? `<div class="pgroup"><div class="pgtitle">Neuronitis — wypadnięcie gałęzi nerwu <span class="pghelp">górny = poziomy + przedni + łagiewka; dolny = tylny. Ustawia gainy/tony kanałów.</span></div>
      <div class="hctrl"><span class="lbl">Ucho</span><div class="pillseg">${ne("L")}${ne("P")}</div>
        <span class="lbl">Gałąź</span><div class="pillseg">${nb("superior","Górny")}${nb("inferior","Dolny")}${nb("full","Cały")}</div></div>
      <label class="prow"><span class="plabel">Nasilenie</span>
        <input type="range" class="comprange prange" min="0" max="1" step="0.05" value="${sev}" oninput="setHintsNerveSev(this.value)" onchange="applyHintsNerve()">
        <span class="pval" data-nervesev>${Math.round(sev*100)}%</span></label>
      <div class="note" data-nervesummary>${nerveLesionSummary()}</div></div>` : "";
  const rowFor=(pm)=>{
    if(pm.type==="select"){
      const cur=p[pm.key];
      const opts=pm.options.map(o=>`<button aria-pressed="${String(cur)===String(o.v)}" onclick="setHintsParam('${pm.key}','${o.v}')">${o.l}</button>`).join("");
      return `<div class="prow"><span class="plabel">${pm.label}</span><div class="pillseg small">${opts}</div></div>`;
    }
    const val=p[pm.key];
    return `<label class="prow"><span class="plabel">${pm.label}</span>
      <input type="range" class="comprange prange" min="${pm.min}" max="${pm.max}" step="${pm.step}" value="${val}"
        oninput="setHintsParam('${pm.key}',this.value)" onchange="rerunHintsHIT()">
      <span class="pval" data-pval="${pm.key}">${fmtParamVal(val,pm)}</span></label>`;
  };
  const groupHTML=(g)=>`<div class="pgroup"><div class="pgtitle">${g.group}${g.help?`<span class="pghelp">${g.help}</span>`:""}</div>${g.params.map(rowFor).join("")}</div>`;
  const basic=NeuroVOR.PARAM_SPEC.filter(g=>g.tier==="basic").map(groupHTML).join("");
  const adv=NeuroVOR.PARAM_SPEC.filter(g=>g.tier==="advanced").map(groupHTML).join("");
  return `<div class="panelbox hpanel custompanel" style="margin-top:12px">
    <h4>Matematyczny pacjent — parametry fizjologii</h4>
    <div class="presets">${presets}</div>
    ${nerveBox}
    ${basic}
    <details class="advbox" ${state.hintsAdvanced?"open":""} ontoggle="setHintsAdvanced(this.open)">
      <summary>Parametry zaawansowane — ośrodek, kompensacja, kanały pionowe, SCDS</summary>
      ${adv}
    </details>
    <div class="hctrl" style="margin-top:12px">
      <button class="preset" onclick="hintsRandomPatient()">🎲 Losowy pacjent (quiz)</button>
      <button class="preset" onclick="saveShareHints()">🔗 Zapisz / udostępnij</button>
      <button class="preset" onclick="exitHintsCustom()">Wróć do scenariuszy</button></div>
    <div class="note" data-sharenote style="margin-top:6px">Link koduje parametry w adresie (dane tylko lokalnie — nic nie jest wysyłane).</div>
  </div>`;
}
// Banner trybu quiz (parametry ukryte do odsłonięcia).
function hintsQuizBanner(){
  return `<div class="panelbox hpanel" style="margin-top:12px">
    <h4>Tryb quiz — nieznany pacjent</h4>
    <div class="note">Wykonaj badania poniżej (oczopląs samoistny + fiksacja, test pchnięcia głowy, odchylenie skośne), postaw rozpoznanie, a potem odsłoń parametry i odczyt kliniczny.</div>
    <div class="hctrl"><button class="preset" onclick="hintsRandomPatient()">🎲 Nowy losowy pacjent</button>
      <button class="preset" onclick="revealHintsQuiz()">Odsłoń rozpoznanie</button>
      <button class="preset" onclick="exitHintsCustom()">Wyjdź z quizu</button></div>
  </div>`;
}
// Synteza kliniczna (clinicalReadout): objawy + sygnały obwód/ośrodek + niejednoznaczności + lokalizacja.
function hintsReadoutHTML(p){
  const r=NeuroVOR.clinicalReadout(p);
  const hidden = state.hintsQuiz && !state.hintsQuizReveal;
  const chip=(cls,t)=>`<span class="rchip ${cls}">${t}</span>`;
  const findings=r.findings.map(f=>`<li>${f}</li>`).join("");
  const per=r.peripheralSigns.map(s=>chip("per",s)).join("");
  const cen=r.centralSigns.map(s=>chip("cen",s)).join("");
  const amb=r.ambiguities.length
    ? `<div class="rsub"><b>Pułapki / niejednoznaczności:</b><ul>${r.ambiguities.map(a=>`<li>${a}</li>`).join("")}</ul></div>` : "";
  const body = hidden
    ? `<button class="preset" onclick="revealHintsQuiz()">Odsłoń rozpoznanie i parametry</button>`
    : `<div class="rloc"><span class="eyebrow">Lokalizacja</span><b>${r.localization}</b></div>
       <div class="rsigns">${per}${cen||'<span class="rchip">brak jawnych cech ośrodkowych</span>'}</div>${amb}`;
  return `<div class="readout">
    <h4>Odczyt kliniczny — matematyczny pacjent${hidden?" · QUIZ":""}</h4>
    <ul class="rfind">${findings}</ul>
    ${body}
    <div class="note" style="margin-top:8px">Narzędzie dydaktyczne — synteza z parametrów fizjologii, nie rozpoznanie kliniczne.</div>
  </div>`;
}
// Lekkie odświeżenie trybu własnego przy przeciąganiu suwaka (bez przebudowy DOM).
function refreshHintsCustom(){
  const p=hintsActivePatient();
  const fixOn=!!state.hintsFix, gazeDeg=(state.hintsGaze||0)*20;
  const nys=NeuroVOR.nystagmusAtGaze(p,gazeDeg,fixOn);
  const H=NeuroVOR.hints(p), sp=NeuroVOR.spontaneous(p);
  const set=(sel,html)=>{const el=$(sel); if(el) el.innerHTML=html;};
  set('[data-verdict]', hintsVerdictBlock(H));
  set('[data-nyslabel]', hintsNysLabel(nys));
  set('[data-supplnote]', hintsSupplHTML(H,fixOn,sp));
  set('[data-readout]', hintsReadoutHTML(p));
  if(hintsHitSpecOf()) set('[data-hitlabel]', hitLabel(NeuroVOR.headImpulse(p, hintsHitSpecOf())));
  const cont=$('[data-neuronys]'); if(cont) startNeuroNys(cont, nys, gazeDeg);   // płynna zmiana amplitudy
  const skc=$('[data-skew]'); if(skc) startSkew(skc, H.ts);                       // restart animacji skew (token)
}

/* --- U4: SCDS / trzecie okno — bodziec dźwiękowy/ciśnieniowy (objaw Tullio/Hennebert) --- */
// W spoczynku brak oczopląsu (dehiscencja ≠ hipofunkcja); bodziec napędza kanał GÓRNY → pionowo-skrętny
// oczopląs BEZ ruchu głową. Pobudzenie (dźwięk/Valsalva) = downbeat + skręt ku choremu; podciśnienie = odwrotnie.
function scdsRestNote(p){
  return p.dehiscence
    ? `Dehiscencja kan. górnego po stronie ${p.dehiscence==="P"?"prawej":"lewej"}. W spoczynku oczy spokojne — kliknij bodziec, by wywołać oczopląs pionowo-skrętny (objaw Tullio/Hennebert).`
    : "";
}
function scdsLabel(ps){
  if(!ps||!ps.present) return "Brak dehiscencji — bodziec bez efektu.";
  const v = ps.vdir<0 ? "downbeat (ku dołowi)" : "upbeat (ku górze)";
  const tor = ps.tdir<0 ? "bieguny górne w lewo" : "bieguny górne w prawo";
  return `<b style="color:#ffcf8f">Bodziec (${ps.type}) → oczopląs pionowo-skrętny: ${v} + skręt (${tor})</b> · faza wolna ${(ps.spv||0).toFixed(1)}°/s. BEZ ruchu głową — patognomoniczne dla trzeciego okna.`;
}
function hintsSCDSStim(type){
  const p=hintsActivePatient(); if(!p.dehiscence) return;
  const sign = type==="suction" ? -1 : 1;                        // podciśnienie = hamujące (odwrócony kierunek)
  const ps=NeuroVOR.pressureStimulus(p,{type:type==="suction"?"pressure":type, sign});
  const gazeDeg=(state.hintsGaze||0)*20;
  const cont=$('[data-neuronys]'); if(cont) startNeuroNys(cont, ps, gazeDeg);
  const lab=$('[data-nyslabel]'); if(lab) lab.innerHTML=scdsLabel(ps);
  const note=$('[data-scdsnote]'); if(note) note.innerHTML="Bodziec działa — oczopląs pionowo-skrętny. Wygaśnie po chwili (jak po ustaniu dźwięku/Valsalvy).";
  clearTimeout(state._scdsTO);
  state._scdsTO=setTimeout(()=>{                                 // powrót do spoczynku (SCDS nie ma oczopląsu spoczynkowego)
    const p2=hintsActivePatient(), rest=NeuroVOR.nystagmusAtGaze(p2,gazeDeg,!!state.hintsFix);
    const c2=$('[data-neuronys]'); if(c2) startNeuroNys(c2, rest, gazeDeg);
    const l2=$('[data-nyslabel]'); if(l2) l2.innerHTML=hintsNysLabel(rest);
    const n2=$('[data-scdsnote]'); if(n2) n2.innerHTML=scdsRestNote(p2);
  }, 4200);
}

/* --- U7: zapis / udostępnienie pacjenta (hash URL + localStorage; dane tylko lokalnie) --- */
// Kodujemy TYLKO parametry różne od zdrowej normy (krótki link). base64(UTF-8(JSON)).
function hintsCustomDiff(){
  const base=NeuroVOR.makePatient({}), cur=state.hintsCustom||base, o={};
  Object.keys(base).forEach(k=>{ if(cur[k]!==base[k]) o[k]=cur[k]; });   // dehiscence/lesionEar: null==null → pomijane
  return o;
}
function hintsEncode(o){ return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); }
function hintsDecode(s){ return JSON.parse(decodeURIComponent(escape(atob(s)))); }
function saveShareHints(){
  const o=hintsCustomDiff(), code=hintsEncode(o);
  try{ localStorage.setItem('otorepo_hints_patient', JSON.stringify(o)); }catch(e){}
  try{ history.replaceState(null,"","#p="+code); }catch(e){ location.hash="p="+code; }
  const url=location.origin+location.pathname+"#p="+code;
  const done=(msg)=>{ const n=$('[data-sharenote]'); if(n) n.textContent=msg; };
  if(navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(url).then(()=>done("✓ Skopiowano link do pacjenta (zapisano też lokalnie)."), ()=>done("Link w pasku adresu (zapisano lokalnie)."));
  else done("Link zapisany w pasku adresu (i lokalnie).");
}
function loadHintsFromHash(){
  const m=(location.hash||"").match(/p=([^&]+)/); if(!m) return false;
  try{ state.hintsCustom=NeuroVOR.makePatient(hintsDecode(m[1])); return true; }catch(e){ return false; }
}
function loadHintsFromStore(){
  try{ const s=localStorage.getItem('otorepo_hints_patient'); if(!s) return false;
    state.hintsCustom=NeuroVOR.makePatient(JSON.parse(s)); return true; }catch(e){ return false; }
}
function pickSide(s){ state.side=s; render(); }
function pickCanal(k){ state.canal=k; const keys=CANALS[k].maneuvers; if(!keys.includes(state.maneuverKey)) state.maneuverKey=keys.length===1?keys[0]:null; render(); }
function pickMan(k){ state.maneuverKey=k; render(); }
function pickTest(k){ state.testKey=k; state.dixObs="post"; render(); }
// kliknięcie pozycji = od razu otwórz (bez osobnego przycisku CTA)
function openMan(k){ state.maneuverKey=k; startPlan(); }
function openTest(k){ state.testKey=k; state.dixObs="post"; state.screen="diag"; render(); }
function setDixObs(o){ state.dixObs=o; render(); }
function setVariant(v){ state.variant=v; render(); }
// Diagnostyka: karta „Mechanizm" jako flip kanalolitiaza⇄kupulolitiaza. Animacja wizualna, a po jej
// zakończeniu re-render z nowym wariantem (spójne fazy/oczopląs/zalecenie).
function flipDiagMech(){
  const c=$("#mechflip"); if(c) c.classList.toggle("flipped");
  setTimeout(()=>{ state.variant = state.variant==="canalo"?"cupulo":"canalo"; render(); }, 500);
}
// Diagnostyka: para pozycji (Roll: ucho L/P w dole; Bow-Lean: skłon/odchylenie) jako flip — czysto wizualny
// (obie pozycje stale w DOM, animacje per-indeks działają niezależnie).
function flipPhases(){
  const c=$("#phaseflip"); if(!c) return;
  c.classList.toggle("flipped");
  const i = c.classList.contains("flipped") ? 1 : 0;          // odsłonięta pozycja (front=0 / back=1)
  const nys=(state._diagPhaseNys||[])[i]; if(!nys) return;
  // odwrócenie karty = zmiana pozycji pacjenta → odtwórz oczopląs od początku (latencja → narost → wygasanie)
  const fr=$(`[data-nys="${i}"]`); if(fr) startNys(fr, nys);
  const dl=$(`[data-dialnys="${i}"]`); if(dl) startDialNysIn(dl, nys);
}
// Przełącznik strony na karcie manewru/testu (segment L/P)
function sideSel(current, fn, lbl){
  const opt=s=>`<button role="tab" aria-selected="${current===s}" onclick="${fn}('${s}')">Strona ${SIDE[s]}</button>`;
  return `<div class="sidesel"><span class="lbl">${lbl}</span><div class="tabs">${opt('L')}${opt('P')}</div></div>`;
}
// Generuje plan manewru i nakłada holdy zależne od rozmiaru złogu (małe = dłuższe utrzymanie pozycji).
function genPlan(key, side){
  const plan=MANEUVERS[key].gen(side);
  for(const st of plan.steps){ if(st.seconds!=null) st.seconds=sizedSeconds(st.seconds, state.size); }
  return plan;
}
// Zmiana rozmiaru złogu: przebuduj plan (nowe holdy), unieważnij cache dynamiki, przelicz od bieżącego kroku.
function pickSize(s){ if(state.size===s) return; state.size=s;
  if(state.plan && state.screen==="guide"){ state.plan=genPlan(state.maneuverKey, state.side); }
  render(); }
// Repozycja: zmiana strony PRZEBUDOWUJE plan i restartuje manewr od kroku 0
function setGuideSide(s){ if(state.side===s) return; state.side=s; state.plan=genPlan(state.maneuverKey,s); state.step=0; state.autostart=false; render(); }
// Diagnostyka: zmiana strony tylko odświeża predykcje (brak bieżącego kroku — fazy widoczne naraz)
function setDiagSide(s){ if(state.side===s) return; state.side=s; render(); }
function startPlan(){ state.plan=genPlan(state.maneuverKey,state.side); state.step=0; state.autostart=false; state.screen="guide"; render(); }
const CANAL_OF={epley:"posterior",semont:"posterior",lempert:"horizontal",gufoniGeo:"horizontal",gufoniApo:"horizontal",yacovino:"anterior"};
function startManeuver(key){
  state.mode="treat"; state.maneuverKey=key; state.canal=CANAL_OF[key];
  state.plan=genPlan(key,state.side); state.step=0; state.autostart=false; state.screen="guide"; render();
}
function startDiag(){ state.screen="diag"; render(); }
function backToSetup(){ state.running=false; releaseWake(); state.screen="setup"; render(); }
function goStep(i,autostart){ const n=state.plan.steps.length; if(i<0||i>=n) return; state.step=i; state.autostart=!!autostart; render(); }
function toggleAuto(el){ state.autoAdvance=!state.autoAdvance; el.setAttribute("aria-checked",state.autoAdvance); }
function toggleSound(el){ state.sound=!state.sound; el.setAttribute("aria-checked",state.sound); if(state.sound)beep(); }

// U7: pacjent z linku (hash #p=…) na starcie → tryb HINTS „Własny" (dane tylko lokalnie).
if(/[#&]p=/.test(location.hash) && loadHintsFromHash()){ state.mode="hints"; state.screen="hints"; state.hintsQuiz=false; state.hintsQuizReveal=false; }
render();


/* ── seam Etapu 1 (1a): globalne handlery (onclick=…) + uchwyt harnessu snapshotu ──
   Odtwarza dokładnie powierzchnię globalną klasycznego <script> (deklaracje function
   były globalne), plus wystawia moduły silnika dla tools/snapshot.mjs. */
Object.assign(window, { adjust, applyHintsNerve, arrowGlyph, backHeadSVG, backToSetup, beep, bodyClass, bodyJoints, cancelAnims, compNoteHTML, composeHead, computeManSim, currentManSim, diagCanalSVG, engineXi, epley, exitHintsCustom, eyesSVG, figProj, findParamSpec, fkJoints, flipDiagMech, flipGuide, flipPhases, fmtParamVal, frontFace, genPlan, goStep, gravArrowFor, gufoniApo, gufoniGeo, guideNysSeconds, headDial, headPitchQ, hintsActivePatient, hintsCompPanel, hintsCompPatient, hintsCustomDiff, hintsCustomPanel, hintsDecode, hintsEncode, hintsHIT, hintsHitSpecOf, hintsNysLabel, hintsQuizBanner, hintsRandomPatient, hintsReadoutHTML, hintsSCDSStim, hintsSupplHTML, hintsVerdictBlock, hintsVerdictHTML, hitLabel, hitPushLabel, hitSVG, hitSaccadeDir, initGuideSlider, labyrinth, lempert, loadHintsFromHash, loadHintsFromStore, loadHintsNeuritis, loadHintsPreset, loopRAF, makeManualOrientation, manFractions, manPhi, manStepEnv, maneuverSim, maneuverTimeline, nerveLesionSummary, neuroNysParams, nysFromDyn, nysFromGeom, nysOffset, openHints, openHintsCustom, openMan, openTest, pickCanal, pickMan, pickSide, pickSize, pickTest, placeOtolith, posture, profileMarks, provokeQ, qFromG, qFromToVec, recommend, refreshHintsComp, refreshHintsCustom, render, renderDiag, renderGuide, renderHints, renderSetup, rerunHintsHIT, resetTimer, revealHintsQuiz, saveShareHints, scdsLabel, scdsRestNote, semont, setDiagSide, setDixObs, setGuideSide, setHintsAdvanced, setHintsComp, setHintsDx, setHintsFix, setHintsGaze, setHintsNerveBranch, setHintsNerveEar, setHintsNerveSev, setHintsNeuritisSide, setHintsParam, setHintsPlane, setHintsRecovery, setMode, setStepSeconds, setVariant, setupGuideAnim, sideSel, sizeFlip, sizedSeconds, skewLabel, skewSVG, startBackHeadTurn, startDiag, startDiagOtolith, startDialNys, startDialNysIn, startHIT, startManeuver, startNeuroNys, startNys, startPlan, startSkew, stepGravity, stepHeadQ, stepXiPeak, supineHeadQ, syncWake, toggleAuto, toggleSound, toggleTimer, updateGoBtn, variantLabels, xiEnvelope, yacovino });
window.__OTOREPO_TEST__ = { Vestibular, NeuroVOR, Scene3D, composeHead, stepHeadQ, stepGravity, bodyJoints, gravArrowFor, genPlan, MANEUVERS, CANALS, DIAG, CANAL_OF, HINTS_PRESETS, TORSO_Q, state, render, startManeuver, setGuideSide, openTest, setDiagSide, setDixObs, setVariant, openHints, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsFix, setHintsGaze, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev };
