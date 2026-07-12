// Renderer SVG + ekrany (setup/guide/diag/HINTS) + animacje (oczopląs, HIT, skew, otolit).
import { Vestibular } from '../engine/vestibular.js';
import { Scene3D } from '../engine/scene3d.js';
import { NeuroVOR } from '../engine/neuro-vor.js';
import { SIDE, otherSide, yacovino, gufoniApo, MANEUVERS, CANALS, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, stepHeadQ, poseSpec, gravArrowFor, sizeRadius, maneuverTimeline, maneuverSim, DIAG, variantLabels, recommend } from '../pose/maneuvers.js';
import { state } from '../app/state.js';
import { $, cancelAnims, loopRAF, easeInOut, syncWake, beep } from '../runtime/registry.js';
import { setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, fmtParamVal, setHintsParam, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, saveShareHints, pickCanal, openMan, openTest, setDixObs, pickSize, setGuideSide, setDiagSide, startManeuver, backToSetup, goStep, toggleAuto, toggleSound } from '../app/actions.js';

// ikona „obróć kartę" (flip) — używana w Repozycji i Diagnostyce
const FLIP_ICO = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 8a8 8 0 0 1 13-2.5M20 16a8 8 0 0 1-13 2.5M17 3v4h-4M7 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// ROZMIAR ZŁOGU (UI) — mnożnik promienia r, SPÓJNY z SIZE_R w module Vestibular.
const SIZE_LABELS={small:"mała", medium:"średnia", big:"duża"};
const SIZE_NOTE={small:"drobne/wolno osiadające", medium:"typowe", big:"duże/ciężkie"};
let _otoStart=null;   // start animacji wędrówki otolitu (moduł, by dało się ją zrestartować przy flipie karty)

/* ============ SVG: głowa z góry ============ */
function headDial(spec,headCamera,nys){               // spec: PoseSpec (schemat czyta yaw/face)
  // obserwator jako KAMERA: plan podaje wprost klucz kamery (headCamera), domyślnie widok od przodu-z-góry (audyt #6)
  const {yaw, face} = spec;
  const cam = Scene3D.CAMERAS[headCamera] || Scene3D.CAMERAS.topDownFront;
  const qH = Vestibular.qaxis([0,1,0], yaw);                       // schemat odgórny: tylko składowa yaw (stylizacja, nie poza świata)
  const rot = Scene3D.screenAngleCW(Scene3D.project(Scene3D.HEAD_POINTS.nose, qH, cam));  // obrót schematu = kąt nosa
  const el = Scene3D.project(Scene3D.HEAD_POINTS.earL, [1,0,0,0], cam);   // strony z rzutu uszu (niezależne od yaw)
  const er = Scene3D.project(Scene3D.HEAD_POINTS.earR, [1,0,0,0], cam);
  const leftLab  = el.x < er.x ? "L" : "P";
  const rightLab = el.x < er.x ? "P" : "L";
  const ring=face==="down"?"#FF9FBD":"#9FE3F6";
  const feat="#CFEFFB";
  const faceLabel=face==="up"?"nos ku górze":face==="down"?"nos ku podłodze":face==="chin"?"broda przy klatce":"nos do przodu";
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
  const a=nys.anat||{h:0,v:0,t:0}, amp=(nys.strength||1)*(nys.fatigue==null?1:nys.fatigue);   // fatigue: męczliwość przy powtórzeniach (Dix-Hallpike)
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
function figProj(spec,obsCam,opt){                     // spec: PoseSpec — sylwetka NIE wyprowadza pozy sama (Etap 2)
  opt=opt||{}; const HEAD="#4FC9E8", LIMB="#7E94A6", TORSO="#90A6B8", R=15;
  const J=spec.joints, I=[1,0,0,0], P={};
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
    const excl = (spec.body==="supineHang"||spec.body==="supineDeepHang") ? {neck:1,head:1}   // Dix-Hallpike / Yacovino: głowa+szyja zwisają poza krawędź
               : spec.body==="sit"        ? {ankL:1,ankR:1,toeL:1,toeR:1}          // siad na krawędzi: podudzia/stopy zwisają
               : {};
    let bot=-Infinity;
    for(const g of SEGS){ const [a,b,w]=g; if(excl[a]||excl[b]) continue;
      bot=Math.max(bot, Math.max(SY(P[a].y),SY(P[b].y))+w/2); }
    if(!excl.head) bot=Math.max(bot, SY(P.head.y)+R);
    offY=+(opt.bedY-bot).toFixed(1);
  }
  const hq=spec.headQ;                                 // orientacja głowy z PoseSpec (nie re-derywowana — audyt 2.5D)
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
function posture(spec,viewSide){                       // spec: PoseSpec (jedno źródło pozy — Etap 2)
  const {body,face}=spec;
  if(body==="sitFront"||body==="leanL"||body==="leanR"){   // Semont — model rzutowy 2.5D (figProj) + depth cueing
    const front=body==="sitFront";
    const cam=Scene3D.CAMERAS.frontal;   // Semont: obserwator NA WPROST przez CAŁY manewr (siad i leżenie na boku) — jeden spójny widok od przodu
    const {fig}=figProj(spec,cam,front?{ax:100, ay:95, s:0.85}:{ax:100, ay:82, s:0.82, bedY:120});
    const Pc="#2C3D4C";
    const couch=front
      ? `<rect x="34" y="106" width="132" height="9" rx="3" fill="${Pc}"/><rect x="50" y="114" width="8" height="26" fill="#1c2935"/><rect x="142" y="114" width="8" height="26" fill="#1c2935"/>`
      : `<rect x="14" y="120" width="172" height="10" rx="3" fill="${Pc}"/><rect x="22" y="130" width="8" height="20" fill="#1c2935"/><rect x="172" y="130" width="8" height="20" fill="#1c2935"/>`;
    const label=front?"Siad — twarzą do badającego"
      :(face==="up"?"Na boku — nos ku sufitowi (pozycja wyjściowa)":"Na boku — nos ku podłodze (przerzut)");
    const view="widok od przodu — na wprost pacjenta";
    return `<svg viewBox="0 0 200 160" role="img" aria-label="Ułożenie: ${label}">
      <text x="100" y="12" text-anchor="middle" fill="var(--faint)" font-size="9">${view}</text>
      ${couch}${fig}
      <text x="100" y="154" text-anchor="middle" fill="var(--muted)" font-size="11">${label}</text></svg>`;
  }
  const P="#2C3D4C";
  const obsCam=Scene3D.CAMERAS[viewSide==="L"?"sideRight":"sideLeft"];   // patrzymy od strony chorej
  const {fig,headC}=figProj(spec,obsCam,{ax:100, ay:80, s:1, bedY:118});
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
function labyrinth(canal, opts){
  opts=opts||{};
  const colors={posterior:"var(--post)",horizontal:"var(--horiz)",anterior:"var(--ant)"};
  const active=colors[canal];
  let loops="";
  for(const k of ["anterior","horizontal","posterior"]){
    const on=k===canal;
    loops+=`<path id="path-${k}" d="${CANAL_PATHS[k]}" fill="none" stroke="${on?active:"#33404D"}"
      stroke-width="${on?9:6}" stroke-linecap="round" opacity="${on?1:.5}"/>`;
  }
  // Osklepek (cupula) przy bańce kanału tylnego — TYLKO dla manewrów na KUPULOLITIAZĘ (Bascule). Błona
  // spoczywa neutralnie; animacja (setupGuideAnim, krok 1) odgina ją w fazie przylegania i prostuje przy odklejaniu.
  const cupula = opts.cupula
    ? `<g id="labcupula" transform="rotate(0 150 96)"><path d="M143 86 Q150 69 157 86 Z" fill="#CFE3EE" opacity=".16"/><path d="M143 86 Q150 69 157 86" fill="none" stroke="#CFE3EE" stroke-width="3" stroke-linecap="round" opacity=".92"/></g>`
    : "";
  return `<svg viewBox="0 0 250 175" role="img" aria-label="Kanały półkoliste, aktywny: ${CANALS[canal].label}">
    <ellipse cx="150" cy="100" rx="20" ry="15" fill="#22303D" stroke="var(--line)" stroke-width="1.5"/>
    <text x="150" y="103" text-anchor="middle" fill="var(--faint)" font-size="8">łagiewka</text>
    ${loops}${cupula}<circle id="otolith" r="6" fill="#fff" stroke="${active}" stroke-width="2"/></svg>
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
  const fat=(nys.fatigue==null?1:nys.fatigue);          // męczliwość: ortogonalny mnożnik amplitudy (diagnostyka Dix-Hallpike, powtórzenia)
  const A=(nys.kind==="horizontal"?6:0)*(envOv?1:nys.strength)*fat;  // env historyczny NIESIE intensywność (bez podwójnego skalowania)
  const Aup=(nys.kind==="upbeatTorsional"?5:0)*fat;
  const tors=(nys.kind==="upbeatTorsional"?9:0)*fat;    // skrętność zmniejszona (było 15) — bliżej realnej
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
    // i zatrzymuje się (wyjście do ŁAGIEWKI / spoczynek). Bez sztucznej pętli.
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
// krok pierwszej ekspulsji do łagiewki wg FIZYKI (man.sim.exited) → indeks segmentu zawierającego ten czas.
// Dla kanałów PIONOWYCH model komory odnogi daje teraz czysty, klinicznie właściwy krok wyjścia
// (Epley = siad; Semont = rzut; Yacovino = broda do klatki). -1 gdy brak ekspulsji / brak danych.
function manExitStep(man){
  if(!man || !man.exited || !man.segs) return -1;
  let tExit=null; for(const s of man.sim){ if(s.exited){ tExit=s.t; break; } }
  if(tExit==null) return -1;
  for(let i=0;i<man.segs.length;i++){ const sg=man.segs[i]; if(tExit <= sg.t0+sg.dur+1e-9) return i; }
  return man.segs.length-1;
}
// harmonogram ułamków ścieżki per krok.
// Silnik WALIDUJE, że manewr czyści (man.exited) i wskazuje krok kuracyjny; wędrówkę pokazujemy jako
// czystą, monotoniczną progresję 0.15→1.0 (wyjście). Krok kuracyjny:
//  • kanały PIONOWE (model komory odnogi) → REALNY krok ekspulsji z fizyki (manExitStep): Epley = SIAD (k5),
//    Semont = rzut (k3), Yacovino = broda (k3). Spójne z oczoplątem liberacyjnym generowanym w tym kroku.
//  • kanał POZIOMY (bez odnogi, φ front-loaded ku bańce) i KUPULO (Bascule) → schemat n-2 (przedostatni krok).
function manFractions(man, plan){
  const n=plan.steps.length;
  if(!man.exited && plan.mechanism!=="cupulo"){          // konwersja (Gufoni apo) — ruch ku bańce wg silnika, bez wyjścia
    return {fr: plan.steps.map((_,i)=>phiToFrac(manPhi(man,i,1))), exitStep:-1};
  }
  const vertical = plan.canal!=="horizontal" && plan.mechanism!=="cupulo";
  const physExit = vertical ? manExitStep(man) : -1;     // pionowy: realny krok ekspulsji; poziomy/kupulo: schemat
  const cure=Math.max(1, physExit>=1 ? physExit : n-2), s0=0.15;   // krok kuracyjny; pozycja spoczynkowa złogu (blisko bańki)
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
  // KUPULOLITIAZA (mechanism:"cupulo"): 1. krok = etap przylegania/odklejania złogu od osklepka, potem zwykła wędrówka.
  const cupuloAdh = state.plan.mechanism==="cupulo" && state.step===0;
  const EA=0.09, CUP_ANG=17;                                             // pozycja złogu na osklepku (ułamek ścieżki) + kąt odgięcia błony
  if(cupuloAdh){ placeOtolith(canal, EA, 0); const c0=document.getElementById("labcupula"); if(c0) c0.setAttribute("transform",`rotate(${CUP_ANG} 150 96)`); }
  else if(blendOnly) placeOtolith(canal, 1, 1); else placeOtolith(canal, fFrom, 0);
  if(state.autostart && total>0){ state.running=true; }
  state.autostart=false; syncWake();

  _otoStart=null; let last=performance.now(), lastSec=-1;
  // CZAS WĘDRÓWKI OTOLITU = CZAS OCZOPLĄSU (widok frontalny): oba grają przez to samo okno tEnd z silnika,
  // więc na flipkarcie obie strony kończą się razem. Zależność od rozmiaru cząstki niesie już samo tEnd
  // (mniejsza cząstka → wolniejsze osiadanie → dłuższe ξ(t) → dłuższa wędrówka). Widełki chronią skrajności.
  const nysSec=guideNysSeconds(state.plan, man, state.step, state.size);
  const rSize=sizeRadius(state.size);
  const DUR = cupuloAdh ? 3600                                              // Bascule krok 1: przyleganie → odklejanie → start wędrówki (jedno ciągłe okno)
    : nysSec!=null
    ? Math.max(1200, Math.min(24000, Math.round(nysSec*1000)))              // krok z oczopląsem → zsynchronizowany z ξ(t)
    : Math.max(800,  Math.min(3000,  Math.round(1600/(rSize*rSize))));      // krok bez oczopląsu → fallback wg rozmiaru (osiadanie ∝ 1/r²)
  loopRAF((now)=>{
    if(!document.getElementById("otolith")) return false;
    const dt=now-last; last=now;
    // ANIMACJA OTOLITU: przejście fFrom→fTo na wejściu w krok, niezależnie od timera (ruch przy repozycji)
    if(_otoStart===null) _otoStart=now;
    const ot=Math.min(1,(now-_otoStart)/DUR);
    if(cupuloAdh){
      const cup=document.getElementById("labcupula"), oto=document.getElementById("otolith");
      const AD=0.42, DET=0.58;                                    // fazy: [0,AD]=przyleganie · [AD,DET]=odklejanie · [DET,1]=start wędrówki
      if(ot<AD){                                                  // PRZYLEGANIE: osklepek odgięty, złóg drży „przyklejony"
        if(cup) cup.setAttribute("transform",`rotate(${(CUP_ANG+Math.sin(now/85)*2.5).toFixed(2)} 150 96)`);
        placeOtolith(canal, EA, 0);
        if(oto) oto.setAttribute("r",(6.4+Math.sin(now/85)*0.5).toFixed(2));
      } else if(ot<DET){                                          // ODKLEJANIE: osklepek prostuje się, złóg pulsuje i uwalnia
        const u=easeInOut((ot-AD)/(DET-AD));
        if(cup) cup.setAttribute("transform",`rotate(${(CUP_ANG*(1-u)).toFixed(2)} 150 96)`);
        placeOtolith(canal, EA, 0);
        if(oto) oto.setAttribute("r",(6.4+3.4*Math.sin(u*Math.PI)).toFixed(2));
      } else {                                                    // START WĘDRÓWKI: od osklepka na ścieżkę do pozycji spoczynkowej
        if(cup) cup.setAttribute("transform","rotate(0 150 96)");
        if(oto) oto.setAttribute("r",6);
        placeOtolith(canal, EA+(fTo-EA)*easeInOut((ot-DET)/(1-DET)), 0);
      }
    }
    else if(blendOnly){ placeOtolith(canal, 1, 1); }
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
    const scDesc={normal:"prawidłowy VOR", neuritis:"obwód", stroke:"ośrodek (AVS)"};
    const scSt="min-height:auto;padding:10px 11px;font-size:12.5px";   // zwarte karty 2×2 jak selektor scenariusza wewnątrz HINTS (seg four)
    const scOpt=(f,key,lbl)=>`<button class="opt" aria-pressed="${curFam===f}" onclick="openHints('${key}')" style="${scSt}">${lbl}<small>${scDesc[f]}</small></button>`;
    body=`<div class="group"><div class="label"><span class="eyebrow">Scenariusz</span><span class="hint">obwód ↔ ośrodek</span></div>
        <div class="seg four">${scOpt('normal','normal','Zdrowy')}${scOpt('neuritis','neuritisR','Neuronitis')}${scOpt('stroke','strokeCentral','Udar')}<button class="opt" aria-pressed="false" onclick="openHintsCustom()" style="${scSt}">Własny<small>matematyczny pacjent</small></button></div>
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

/* ── Etap 3: karta „Ułożenie" w Three.js OBOK SVG (wąski zakres: Epley + Roll) ──
   Przełącznik 2D/3D w nagłówku karty; canvas montowany PO wstawieniu innerHTML
   (dynamiczny import → chunk three ładowany dopiero przy pierwszym użyciu 3D).
   Renderer czyta wyłącznie PoseSpec (most osi zweryfikowany: npm run bridge:check). */
function view3dToggle(){
  return `<button class="mini3d" aria-pressed="${!!state.view3d}" onclick="setView3d(${!state.view3d})" title="Widok przestrzenny (WebGL) — sylwetka wg PoseSpec">3D</button>`;
}
function threeSlot(key){ return `<div class="threewrap" data-three3d="${key}">ładowanie 3D…</div>`; }
// Etap 5: detekcja WebGL (raz, cache). Decyduje o domyślnym 3D (boot w main.js) i o fallbacku.
// W jsdom/harnessie brak WebGL → false → domyślnie SVG (golden deterministyczny).
let _webglOK=null;
function webglAvailable(){
  if(_webglOK!==null) return _webglOK;
  try{ const c=document.createElement("canvas");
    _webglOK=!!(window.WebGLRenderingContext && (c.getContext("webgl")||c.getContext("experimental-webgl")));
  }catch(e){ _webglOK=false; }
  return _webglOK;
}
function mount3D(key, spec, side){
  const el=$(`[data-three3d="${key}"]`); if(!el) return;
  import('./three-patient.js')
    .then(m=>m.mountPatient3D(key, el, spec, side))
    .catch(e=>{ console.error('mount3D → fallback SVG:', e);          // Etap 5: brak WebGL/błąd montażu → SVG
      if(state.view3d){ state.view3d=false; render(); } });          // bez pętli: view3d=false → renderGuide nie woła mount3D
}

function renderGuide(){
  const p=state.plan, st=p.steps[state.step], n=p.steps.length;
  const ps=poseSpec(st);                                   // kanoniczna poza kroku (Etap 2) — jedyne źródło dla sylwetki/dialu/strzałki
  const can3d = true;                                      // Etap 4: 3D dla WSZYSTKICH manewrów (kamera wg reguł posture: bok/frontal/topDown)
  const _man = currentManSim();
  const _gn = nysFromDyn(p.canal, p.side, stepXiPeak(_man, p, state.step, state.size));
  const gn = (_gn && _gn.strength >= 0.10) ? _gn : null;   // karta oczopląsu TAM, gdzie FIZYKA daje sygnał > próg (bez markera)
  const gravArrow = gn ? gravArrowFor(ps) : "";
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
      : `<div class="panelbox"><h4>Głowa (z góry)</h4>${headDial(ps,p.headCamera,gn)}</div>`;
  const gufoniNote = state.maneuverKey==="gufoniApo"
    ? `<div class="note">Manewr <b>konwersji</b>: złóg nie opuszcza kanału — celem jest przekształcenie postaci apogeotropowej w geotropową. Po nim wykonaj ponowny Roll test i lecz postać geotropową (Lempert / Gufoni geotropowy).</div>` : "";
  const basculeNote = state.maneuverKey==="bascule"
    ? `<div class="note">Manewr <b>uwalniający</b> dla <b>kupulolitiazy</b>: rytmiczne bujanie bok–bok wytwarza siły bezwładności, które odrywają złóg przylegający do osklepka (cupula) i przenoszą go do łagiewki. Powtarzaj przerzuty do 5 serii; po manewrze wykonaj ponowny Dix–Hallpike.</div>` : "";
  // Manewr na KUPULOLITIAZĘ (mechanism:"cupulo", np. Bascule): karta „wędrówka otolitów" domyślnie NA WIERZCHU
  // (flipped) — pokazuje przyleganie/odklejanie od osklepka; osklepek dorysowany w labiryncie (opts.cupula).
  const cupuloMech = p.mechanism==="cupulo";
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
    <div class="viz"><div class="panelbox"><h4>Ułożenie pacjenta${can3d?view3dToggle():""}</h4>${can3d&&state.view3d?threeSlot("guide"):posture(ps,p.side)}</div>
      ${headPanel}</div>
    ${gn
      ? `<div class="flipwrap"><div class="flip${cupuloMech?' flipped':''}" id="flip" role="button" tabindex="0" aria-label="Odwróć kartę: widok frontalny albo wędrówka otolitów" onclick="flipGuide()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipGuide();}">
          <div class="face front panelbox"><h4>Widok frontalny</h4>
            <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-nys-guide>${eyesSVG()}</div><span class="emk">L</span></div>
            <div class="nyslabel"><span class="arrow">${arrowGlyph(gn)}</span><span>${gn.label}</span></div>
            ${gravArrow}
            <div class="fliphint">${FLIP_ICO} wędrówka otolitów</div></div>
          <div class="face back panelbox"><h4>Wędrówka otolitów — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal, {cupula:cupuloMech})}${gufoniNote}${basculeNote}
            <div class="fliphint">${FLIP_ICO} widok frontalny</div></div>
        </div></div>`
      : `<div class="panelbox" style="margin-bottom:12px"><h4>Wędrówka otolitów — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal, {cupula:cupuloMech})}${gufoniNote}${basculeNote}</div>`}
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
  if(can3d && state.view3d) mount3D("guide", ps, p.side);
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
  // MĘCZLIWOŚĆ: przy powtórzeniach prowokacji Dix-Hallpike kanalolitiaza SŁABNIE, kupulolitiaza NIE (różnicowanie).
  // fatigue = ortogonalny mnożnik amplitudy (startNys/startDialNysIn); kupulo = 1 (nie wyczerpuje się).
  const dixRep = (isDix && !antMode) ? (state.dixRep||0) : 0;
  const fatFactor = v==="cupulo" ? 1 : Vestibular.fatigueFactor(dixRep);
  phases.forEach(ph=>{ if(ph.nys) ph.nys.fatigue = fatFactor; });
  state._diagPhaseNys = phases.map(p=>p.nys);   // do restartu animacji przy odwracaniu kart pozycji
  const vl=variantLabels(t.canal);
  const mechNote = v==="canalo"
    ? "Swobodne złogi przemieszczają się w świetle kanału pod wpływem grawitacji."
    : "Złogi przylegają do osklepka (cupula), który się odgina — bańka staje się wrażliwa na grawitację.";
  const can3d = true;                                    // Etap 4: 3D dla wszystkich testów pozycyjnych (dix/roll/bowlean/headhang)
  const phaseInner=(ph,i)=>{
    const phs=poseSpec(ph);                              // kanoniczna poza fazy testu (Etap 2)
    return `
      <div class="ptitle">${ph.ptitle}</div><div class="ppos">${ph.ppos}</div>
      <div class="minihead"><div class="panelbox"><h4>Ułożenie${can3d?view3dToggle():""}</h4>${can3d&&state.view3d?threeSlot("diag"+i):posture(phs,A)}</div>
        <div class="panelbox"><h4>Głowa (z góry)</h4><div data-dialnys="${i}">${headDial(phs,"topDownBehind")}</div></div></div>
      <div class="panelbox" style="margin-top:10px"><h4>Widok frontalny</h4>
        <div class="eyesrow"><span class="emk">P</span><div class="eyeswrap" data-nys="${i}">${eyesSVG()}</div><span class="emk">L</span></div>
        <div class="nyslabel"><span class="arrow">${arrowGlyph(ph.nys)}</span><span>${ph.label}${ph.nys.persistent?" · uporczywy":" · przemijający"}</span></div>
        ${gravArrowFor(phs)}</div>
      <div class="note">${ph.note}</div>`;};
  const phaseHTML = phases.length===2
    ? `<div class="flipwrap" style="margin-top:6px"><div class="flip" id="phaseflip" style="min-height:470px" role="button" tabindex="0" aria-label="Odwróć: ${phases[0].ptitle} albo ${phases[1].ptitle}" onclick="flipPhases()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipPhases();}">
        <div class="face front phaseface">${phaseInner(phases[0],0)}<div class="fliphint">${FLIP_ICO} ${phases[1].ptitle}</div></div>
        <div class="face back phaseface">${phaseInner(phases[1],1)}<div class="fliphint">${FLIP_ICO} ${phases[0].ptitle}</div></div>
      </div></div>`
    : phases.map((ph,i)=>`<div class="phase">${phaseInner(ph,i)}</div>`).join("");
  // Panel MĘCZLIWOŚCI (tylko Dix-Hallpike, tryb kanału tylnego): powtarzaj prowokację → kanalolitiaza słabnie,
  // kupulolitiaza nie (różnicowanie wprost). Amplituda z Vestibular.fatigueFactor(rep).
  const fatPanel = (isDix && !antMode) ? (()=>{
    const rep=state.dixRep||0, cupulo=(v==="cupulo"), pct=Math.round((cupulo?1:Vestibular.fatigueFactor(rep))*100);
    const barCol = cupulo ? "#3a8f6f" : (pct<40 ? "var(--ant)" : "var(--primary)");
    const note = cupulo
      ? "Kupulolitiaza: oczopląs NIE wyczerpuje się przy powtórzeniach — złóg przylega do osklepka."
      : rep===0
        ? "Powtórz prowokację kilka razy: w kanalolitiazie oczopląs SŁABNIE z każdym razem (rozproszenie złogu) — to odróżnia ją od kupulolitiazy."
        : `Osłabienie po ${rep} ${rep===1?"powtórzeniu":"powtórzeniach"}: amplituda oczopląsu ~${pct}% wartości wyjściowej.`;
    return `<div class="card" style="margin-bottom:4px">
      <div class="obslabel" style="margin-bottom:4px">Powtarzalność prowokacji — męczliwość oczopląsu</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <button class="opt" style="min-height:auto;padding:9px 12px;font-size:13px;flex:0 0 auto;text-align:center" onclick="repeatDixProvoke()">↻ Powtórz prowokację</button>
        <span class="mono" style="color:var(--muted);font-size:13px">Prowokacja #${rep+1}</span>
        ${rep>0?`<button class="opt" style="min-height:auto;padding:9px 12px;font-size:13px;flex:0 0 auto;text-align:center;opacity:.85" onclick="resetDixProvoke()">Reset</button>`:""}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:8px;border-radius:4px;background:var(--panel2);overflow:hidden"><div style="height:100%;width:${pct}%;background:${barCol};transition:width .35s"></div></div>
        <span style="font-size:12px;color:var(--muted);min-width:84px;text-align:right">amplituda ${pct}%</span>
      </div>
      <div class="note">${note}</div></div>`;
  })() : "";
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
    ${phaseHTML}${fatPanel}
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
  if(can3d && state.view3d) phases.forEach((ph,i)=>mount3D("diag"+i, poseSpec(ph), A));
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
// Werdykt HINTS z zasłoną w trybie quiz (zanim odsłonisz rozpoznanie).
function hintsVerdictBlock(H){
  if(state.hintsCustom && state.hintsQuiz && !state.hintsQuizReveal)
    return `<div class="hverdict"><h4>Werdykt HINTS</h4><div class="vv">Quiz — ukryto werdykt</div>
      <div class="note" style="margin-top:6px">Zbadaj pacjenta (oczopląs + fiksacja, HIT, skew), postaw rozpoznanie, a potem odsłoń.</div></div>`;
  return hintsVerdictHTML(H);
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
// Diagnostyka: karta „Mechanizm" jako flip kanalolitiaza⇄kupulolitiaza. Animacja wizualna, a po jej
// zakończeniu re-render z nowym wariantem (spójne fazy/oczopląs/zalecenie).
function flipDiagMech(){
  if(state._mechTO) return;                                // debounce: ignoruj ponowne kliknięcia w trakcie 500 ms animacji (bez nakładania timerów / desyncu wariantu)
  const c=$("#mechflip"); if(c) c.classList.toggle("flipped");
  state._mechTO=setTimeout(()=>{ state._mechTO=null;
    if(state.screen!=="diag") return;                      // użytkownik opuścił diagnostykę (Wróć / zmiana ekranu) → nie wymuszaj zmiany wariantu ani re-renderu
    state.variant = state.variant==="canalo"?"cupulo":"canalo"; render(); }, 500);
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

export { FLIP_ICO, SIZE_LABELS, SIZE_NOTE, _otoStart, headDial, startDialNysIn, startDialNys, backHeadSVG, startBackHeadTurn, profileMarks, frontFace, figProj, posture, CANAL_PATHS, labyrinth, placeOtolith, eyesSVG, nysOffset, startNys, arrowGlyph, diagCanalSVG, startDiagOtolith, fmt, fmtClock, computeManSim, currentManSim, manStepEnv, stepXiPeak, manPhi, phiToFrac, manFractions, guideNysSeconds, setupGuideAnim, updateGoBtn, toggleTimer, resetTimer, adjust, setStepSeconds, initGuideSlider, flipGuide, sizeFlip, render, renderSetup, renderGuide, renderDiag, hintsNysLabel, hintsVerdictHTML, renderHints, hintsCompPatient, compStage, compRowHTML, compNoteHTML, hintsCompPanel, hintsSupplHTML, refreshHintsComp, neuroNysParams, startNeuroNys, hitSVG, startHIT, hitSaccadeDir, hitPushLabel, hintsHitSpecOf, hitLabel, skewSVG, startSkew, skewLabel, hintsVerdictBlock, nerveLesionSummary, hintsCustomPanel, hintsQuizBanner, hintsReadoutHTML, refreshHintsCustom, scdsRestNote, scdsLabel, flipDiagMech, flipPhases, sideSel, webglAvailable };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { headDial, startDialNysIn, startDialNys, backHeadSVG, startBackHeadTurn, profileMarks, frontFace, figProj, posture, labyrinth, placeOtolith, eyesSVG, nysOffset, startNys, arrowGlyph, diagCanalSVG, startDiagOtolith, computeManSim, currentManSim, manStepEnv, stepXiPeak, manPhi, manFractions, guideNysSeconds, setupGuideAnim, updateGoBtn, toggleTimer, resetTimer, adjust, setStepSeconds, initGuideSlider, flipGuide, sizeFlip, render, renderSetup, renderGuide, renderDiag, hintsNysLabel, hintsVerdictHTML, renderHints, hintsCompPatient, compNoteHTML, hintsCompPanel, hintsSupplHTML, refreshHintsComp, neuroNysParams, startNeuroNys, hitSVG, startHIT, hitSaccadeDir, hitPushLabel, hintsHitSpecOf, hitLabel, skewSVG, startSkew, skewLabel, hintsVerdictBlock, nerveLesionSummary, hintsCustomPanel, hintsQuizBanner, hintsReadoutHTML, refreshHintsCustom, scdsRestNote, scdsLabel, flipDiagMech, flipPhases, sideSel });
