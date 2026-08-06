// Renderer SVG + ekrany (setup/guide/diag/HINTS) + animacje (oczopląs, HIT, skew, otolit).
import { Vestibular } from '../engine/vestibular.js';
import { Scene3D } from '../engine/scene3d.js';
import { NeuroVOR } from '../engine/neuro-vor.js';
import { SIDE, sideN, otherSide, yacovino, gufoniApo, MANEUVERS, CANALS, CANAL_OF, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, stepHeadQ, poseSpec, gravArrowFor, sizeRadius, maneuverTimeline, maneuverSim,
         computeManSim, manStepEnv, stepXiPeak, manPhi, phiToFrac, manExitStep, manFractions, guideNysSeconds,
         DIAG, variantLabels, recommend, baranyClassify } from '../pose/maneuvers.js';
import { state } from '../app/state.js';
import { poparcie, POWODY_BRAKU, ostrzezenieDownbeat, ostrzezenieSkretny, wnioskowanieDix, wartoscInstancji,
         POWODY_NIEWIARYGODNOSCI,
         OBS_POLA, OBS_FAZY_OPIS, instancjeStosowalne, kompletnosc, spojnosc, flagi, FLAGI,
         ETYKIETY_OSI, nieuzyte, porownajZPredykcja, WERDYKTY_POROWNANIA, fazaDIAG,
         OBS_FAZY, OBS_PROBY, WZORCE_DYNAMIKI, rozbijKlucz } from '../app/obs-model.js';
import { nietypowy, interpretuj, sugerowaneProby, POWODY_NIETYPOWOSCI, POWODY_ZGODNOSCI, CECHY_KIERUNKU, CECHY_DYNAMIKI } from '../app/interp-model.js';
import { interpDeps as _interpDeps } from '../app/interp-deps.js';
import { doborEkspercki, podpisWyboru, POLA_WYBORU, etapyManewru, czasUtrzymania, trybDoUstapieniaDostepny, POWOD_BRAKU_TRYBU, POWODY_CZASU, KRYTERIA, WYJSCIE_ZLOGA, opisPozycji } from '../app/man-model.js';
import { manDeps } from '../app/man-deps.js';
import { WYNIKI, TOLERANCJE, AKCJE, wynikKontroli, nastepneKroki, kontrolaMozliwa, spojnoscWyniku,
         podsumowanieSesji, streszczenieKontroli } from '../app/followup-model.js';
import { followupDeps } from '../app/followup-deps.js';
import { raport, tekst, sekcja as sekcjaOpisu, domyslneSekcje, podpisSesji } from '../app/opis-model.js';
import { opisDeps } from '../app/opis-deps.js';
import { KOMUNIKATY_OPISU, BLEDY_OPISU } from '../app/opis-state.js';
import { POWODY_ZAPISU_SESJI } from '../app/opis-store.js';
import { ELEMENTY, ELEMENT_IDS, elementHints, opcjaHints, kwalifikacjaHints, STANY_KWALIFIKACJI,
         POWODY_POMINIECIA, PRZESZKOLENIE, POWODY_NIEWIARYGODNOSCI_HINTS, SPRZEZENIA,
         podsumowanieHints, odpowiedziHints, postepBadania, wagaOdpowiedzi } from '../app/hints-model.js';
import { hintsDeps } from '../app/hints-deps.js';
import { biezacyKrok } from '../app/hints-state.js';
import { POZIOMY, POZIOM_IDS, RODZAJE, RODZAJ_IDS, ETAPY, ETAP_IDS, ETAPY_PYTAJACE, etapNauki,
         WERDYKTY, POWODY_BLEDU, ODPOWIEDZI_WLASNE, BIBLIOTEKA, przypadek as przypadekNauki, przypadki,
         kluczPrzypadku, opcjeEtapu, werdyktyEtapu, mocRozstrzygajaca, wskazowka, RODZAJE_WSKAZOWEK,
         odsloniete, informacjaZwrotna, wolnoDalej, postepLekcji, koniecPrzypadku, wynikPrzypadku,
         OCENY, postepBiblioteki, probyPrzypadku, probaGlowna } from '../app/nauka-model.js';
import { naukaDeps } from '../app/nauka-deps.js';
import { POWODY_ODMOWY } from '../app/nauka-state.js';
import { PARAMETRY, POWODY_BEZ_SKUTKU, OBSERWABLE, obserwabla, EKSPERYMENTY, eksperyment,
         odchyleniaZeSkutkiem, porownanie, wolnoPokazac, STANOWISKA, STANOWISKO_IDS } from '../app/lab-model.js';
import { labDeps } from '../app/lab-deps.js';
import { pacjentStanowiska } from '../app/lab-state.js';
import { POWODY_ZAPISU } from '../app/nauka-store.js';
import { nowyZegar, startZegara, pauzaZegara, resetZegara, odliczono, ustawOdliczono, odnotujLuke, potwierdzLuke, PROG_LUKI_MS } from '../runtime/hold-clock.js';
import { $, cancelAnims, loopRAF, rafOnce, easeInOut, syncWake, beep, vizNow, vizPeek, vizClock } from '../runtime/registry.js';
import { zakonczSerie, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, fmtParamVal, setHintsParam, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, saveShareHints, pickCanal, pickSide, openMan, openTest, zmienManewr, ustawTrybCzasu, setDixObs, pickSize, setGuideSide, setDiagSide, startManeuver, backToSetup, goStep, toggleAuto, toggleSound } from '../app/actions.js';
import { markDecision, markSeen } from '../app/flow-state.js';
import { activeQuestions, nextQuestionId, triageComplete, triageResult, czerwoneFlagi } from '../app/triage-model.js';
import { t } from '../i18n.js';
const tr = t;   // alias tlumaczenia dla funkcji HINTS z lokalnym 't' (string/param) — 'tr' (modul-scope) NIE jest przeslaniany, wiec nie koliduje w bundlu

// ikona „obróć kartę" (flip) — używana w Repozycji i Diagnostyce
const FLIP_ICO = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 8a8 8 0 0 1 13-2.5M20 16a8 8 0 0 1-13 2.5M17 3v4h-4M7 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// ROZMIAR ZŁOGU (UI) — mnożnik promienia r, SPÓJNY z SIZE_R w module Vestibular.
const SIZE_LABELS={ get small(){return t("mała","small");}, get medium(){return t("średnia","medium");}, get big(){return t("duża","large");} };
const SIZE_NOTE={ get small(){return t("drobne/wolno osiadające","fine/slow-settling");}, get medium(){return t("typowe","typical");}, get big(){return t("duże/ciężkie","large/heavy");} };
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
  const leftLab  = el.x < er.x ? "L" : t("P","R");
  const rightLab = el.x < er.x ? t("P","R") : "L";
  const ring=face==="down"?"#FF9FBD":"#9FE3F6";
  const feat="#CFEFFB";
  const faceLabel=face==="up"?t("nos ku górze","nose up"):face==="down"?t("nos ku podłodze","nose down"):face==="chin"?t("broda przy klatce","chin to chest"):face==="ceil"?t("nos ku sufitowi","nose to ceiling"):face==="floor"?t("nos ku podłodze","nose down"):t("nos do przodu","nose forward");
  const turnLabel=yaw>0?t("obrót w prawo","turn right"):yaw<0?t("obrót w lewo","turn left"):t("na wprost","straight ahead");
  let nysNote="", h=180;
  if(nys){
    const strong=(nys.strength||0)>=0.5, revNote=nys.reversed?t("(odwrócony — hamowanie)","(reversed — inhibition)"):nys.apo?t("(apogeotropowy)","(apogeotropic)"):t("(geotropowy)","(geotropic)");
    if(nys.canal==="horizontal"){
      nysNote = strong
        ? `<text x="70" y="186" text-anchor="middle" fill="var(--timer)" font-size="9" font-weight="600">${t("oczopląs poziomy","horizontal nystagmus")}</text>
           <text x="70" y="197" text-anchor="middle" fill="var(--muted)" font-size="8.5">${revNote}</text>`
        : `<text x="70" y="188" text-anchor="middle" fill="var(--muted)" font-size="9">${t("oczopląs poziomy słaby","weak horizontal nystagmus")}${nys.reversed?" ⟲":""}</text>`;
    } else {
      const arrow = nys.canal==="anterior" ? "↓" : "↑";
      const tors = nys.canal==="anterior" ? "" : t(" + skrętny"," + torsional");   // kanał przedni: czysty downbeat
      nysNote = strong
        ? `<text x="70" y="186" text-anchor="middle" fill="var(--timer)" font-size="9" font-weight="600">${t("oczopląs","nystagmus")} ${arrow}${tors}</text>
           <text x="70" y="197" text-anchor="middle" fill="var(--muted)" font-size="8.5">${t("(najsilniejszy)","(strongest)")}</text>`
        : `<text x="70" y="188" text-anchor="middle" fill="var(--muted)" font-size="9">${t("oczopląs słaby / zanika","weak nystagmus / fading")}</text>`;
    }
    h = strong?206:196;
  }
  return `<svg viewBox="0 0 140 ${h}" role="img" aria-label="${t("Głowa","Head")}: ${turnLabel}, ${faceLabel}">
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
  const fast=0.17, T=720, start=vizPeek();
  const {env, tEnd} = xiEnvelope(engineXi(nys.canal, nys.side, nys.persistent, nys.q));
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  const fast=0.17, T=720, start=vizPeek();
  // ta sama OBWIEDNIA co karta oczu → oba widoki zsynchronizowane, jednorazowe (bez pętli)
  const {env, tEnd} = envOv || xiEnvelope(engineXi(nys.canal, nys.side, false, provokeQ(nys.canal, nys.side)));
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  return `<svg viewBox="0 0 140 150" role="img" aria-label="${t("Głowa od tyłu — obrót w stronę chorą","Head from behind — turn toward the affected side")}">
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
  const target=dir==="L"?-45:45, start=vizPeek();
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  // --- kotwiczenie pionowe CAŁEJ grupy ---
  let offY=0;
  if(opt.sitCenter!=null){                              // SIAD: wyśrodkuj CAŁĄ sylwetkę pionowo (stopy↔czubek); pośladki siądą na blacie, stopy niżej na podłodze
    let lo=Infinity, hi=-Infinity;
    for(const g of SEGS){ const [a,b,w]=g;
      lo=Math.min(lo, SY(P[a].y)-w/2, SY(P[b].y)-w/2);
      hi=Math.max(hi, SY(P[a].y)+w/2, SY(P[b].y)+w/2); }
    lo=Math.min(lo, SY(P.head.y)-R); hi=Math.max(hi, SY(P.head.y)+R);
    offY=+(opt.sitCenter-(lo+hi)/2).toFixed(1);
  } else if(opt.bedY!=null){                            // reszta (supine/Semont): najniższy punkt CIAŁA-NA-KOZETCE siada na bedY
    const excl = (spec.body==="supineHang"||spec.body==="supineDeepHang") ? {neck:1,head:1}   // Dix-Hallpike / Yacovino: głowa+szyja zwisają poza krawędź
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
  const fin = k => ({x:+SX(P[k].x).toFixed(1), y:+(SY(P[k].y)+offY).toFixed(1)});   // finalne pozycje ekranowe (po offY) — dla kozetki/podłogi siadu
  let bx0=Infinity, bx1=-Infinity; for(const k in P){ const x=SX(P[k].x); if(x<bx0)bx0=x; if(x>bx1)bx1=x; }
  return {fig, headC:[hx,hy+offY], offY,
    seat:{pelvis:fin('pelvis'), hipL:fin('hipL'), hipR:fin('hipR'), ankL:fin('ankL'), ankR:fin('ankR'), toeL:fin('toeL'), toeR:fin('toeR')},
    boxX:[+bx0.toFixed(1), +bx1.toFixed(1)]};
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
    const label=front?t("Siad — twarzą do badającego","Sitting — facing the examiner")
      :(face==="up"?t("Na boku — nos ku sufitowi (pozycja wyjściowa)","On the side — nose to ceiling (starting position)"):face==="down"?t("Na boku — nos ku podłodze (przerzut)","On the side — nose to floor (swing)"):face==="ceil"?t("Na boku — nos ku sufitowi (głowa skręcona ~90°)","On the side — nose to ceiling (head rotated ~90°)"):face==="floor"?t("Na boku — nos ku podłodze (głowa skręcona ~90°)","On the side — nose to floor (head rotated ~90°)"):t("Na boku — głowa w linii ciała","On the side — head in line with the body"));
    const view=t("widok od przodu — na wprost pacjenta","front view — facing the patient");
    return `<svg viewBox="0 0 200 160" role="img" aria-label="${t("Ułożenie","Position")}: ${label}">
      <text x="100" y="12" text-anchor="middle" fill="var(--faint)" font-size="9">${view}</text>
      ${couch}${fig}
      <text x="100" y="154" text-anchor="middle" fill="var(--muted)" font-size="11">${label}</text></svg>`;
  }
  const P="#2C3D4C";
  const obsCam=Scene3D.CAMERAS[viewSide==="L"?"sideRight":"sideLeft"];   // patrzymy od strony chorej
  const viewLbl=viewSide?t(`◉ widok od strony ${SIDE[viewSide]} (chora)`,`◉ view from the ${viewSide==="L"?"left":"right"} side (affected)`):"";
  if(body==="sit"){                                     // SIAD NA KRAWĘDZI KOZETKI: pośladki na blacie, nogi zwisają w przód, stopy na podłodze; kozetka (blat+nogi) ZA plecami
    const {fig, seat, boxX}=figProj(spec,obsCam,{ax:100, ay:80, s:0.82, sitCenter:82});
    const seatX=(seat.pelvis.x+seat.hipL.x+seat.hipR.x)/3;
    const seatY=Math.max(seat.pelvis.y,seat.hipL.y,seat.hipR.y)+3;      // górna powierzchnia blatu tuż pod pośladkami
    const feetX=(seat.ankL.x+seat.ankR.x)/2;
    const floorY=Math.max(seat.ankL.y,seat.ankR.y,seat.toeL.y,seat.toeR.y)+2;   // podłoga = poziom stóp
    const back=seatX<=feetX?-1:1;                                       // „tył" ławki = przeciwnie do stóp (nogi lecą w przód)
    const CW=58, OVER=12, slabH=6, legW=7, legH=Math.max(6, floorY-(seatY+slabH));
    const edgeF=seatX-back*OVER, edgeB=seatX+back*CW, x0=Math.min(edgeF,edgeB), x1=Math.max(edgeF,edgeB);
    const couch=`<rect x="${x0.toFixed(1)}" y="${seatY.toFixed(1)}" width="${(x1-x0).toFixed(1)}" height="${slabH}" rx="2" fill="${P}"/>`
      +`<rect x="${(x0+2).toFixed(1)}" y="${(seatY+slabH).toFixed(1)}" width="${legW}" height="${legH.toFixed(1)}" fill="#1c2935"/>`
      +`<rect x="${(x1-2-legW).toFixed(1)}" y="${(seatY+slabH).toFixed(1)}" width="${legW}" height="${legH.toFixed(1)}" fill="#1c2935"/>`;
    const compMinX=Math.min(x0,boxX[0]), compMaxX=Math.max(x1,boxX[1]), dx=+(100-(compMinX+compMaxX)/2).toFixed(1);
    return `<svg viewBox="0 0 200 160" role="img" aria-label="${t("Ułożenie","Position")}: ${t("Siad","Sitting")}, ${viewLbl}">
      <text x="100" y="12" text-anchor="middle" fill="var(--faint)" font-size="9">${viewLbl}</text>
      <g transform="translate(${dx} 0)">${couch}${fig}</g>
      <text x="100" y="154" text-anchor="middle" fill="var(--muted)" font-size="11">${t("Siad","Sitting")}</text></svg>`;
  }
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
  const label={supineHang:t("Na plecach, głowa w dół","Supine, head down"),supineFlex:t("Na plecach, głowa przygięta ~30°","Supine, head flexed ~30°"),supineFlat:t("Na plecach, głowa płasko","Supine, head flat"),supineChin:t("Na plecach, broda do klatki","Supine, chin to chest"),prone:t("Na brzuchu","Prone"),sideL:t("Na boku lewym","On the left side"),sideR:t("Na boku prawym","On the right side")}[body]||"";
  return `<svg viewBox="0 0 200 160" role="img" aria-label="${t("Ułożenie","Position")}: ${label}, ${viewLbl}">
    <text x="100" y="12" text-anchor="middle" fill="var(--faint)" font-size="9">${viewLbl}</text>
    ${couch}${fig}
    <text x="100" y="154" text-anchor="middle" fill="var(--muted)" font-size="11">${label}</text></svg>`;
}
/* ============ SVG: błędnik (kanały + bańki z grzebieniami + odnoga wspólna + łagiewka) + otolit ============ */
// JEDNO ŹRÓDŁO GEOMETRII — ten sam układ czytają SVG i pozycjonowanie otolitu (placeOtolith/setupGuideAnim).
// Anatomia oddana schematycznie: każdy kanał zaczyna się BAŃKĄ z grzebieniem (crista, φ≈0), łukiem biegnie do
// WYJŚCIA (φ≈180). Kanały PIONOWE (tylny+przedni) schodzą się w ODNOGĘ WSPÓLNĄ i wspólnym pniem wpadają do
// ŁAGIEWKI; kanał POZIOMY wchodzi do łagiewki wprost (bez odnogi). Bańki rozłożone na obwodzie (osobna crista
// dla każdego kanału), łagiewka + odnoga w centrum — złóg wędruje z obwodu (bańka) do środka (łagiewka).
const LAB_UTR={cx:147,cy:162,rx:33,ry:16};                  // łagiewka (utricle) — wspólna komora
const LAB_CRUS={fx:150,fy:120};                             // widełki odnogi wspólnej (zejście kan. PIONOWYCH tuż nad łagiewką)
const LAB_AMP={ posterior:{x:84,y:150}, anterior:{x:214,y:120}, horizontal:{x:206,y:151} };  // środki baniek
const LAB_PIVOT=`${LAB_AMP.posterior.x} ${LAB_AMP.posterior.y}`;   // środek obrotu osklepka (Bascule → bańka kanału tylnego)
const CANAL_PATHS={                                         // OD bańki (start, φ≈0) DO wyjścia (koniec: widełki odnogi / łagiewka, φ≈180)
  posterior:"M84 150 C46 146, 36 94, 60 68 C84 42, 134 58, 150 120",
  anterior:"M214 120 C244 106, 242 56, 206 46 C166 35, 130 72, 150 120",
  horizontal:"M206 151 C218 192, 116 202, 86 176 C64 158, 92 150, 118 162",
};
// Bańka (ampulla) = rozdęcie na końcu kanału; grzebień (crista) = wał czuciowy na dnie bańki; osklepek
// (cupula) = galaretowata kopuła nad grzebieniem. Kopułę statyczną rysujemy przy aktywnym kanale (dome=true);
// przy kupulolitiazie zastępuje ją RUCHOMA grupa #labcupula (patrz opts.cupula), więc wtedy dome=false.
function ampullaGlyph(k,color,active,dome){
  const a=LAB_AMP[k], sw=active?2.4:1.5;
  return `<g transform="translate(${a.x} ${a.y})" opacity="${active?1:.5}">
    <ellipse rx="11.5" ry="8.5" fill="#22303D" stroke="${color}" stroke-width="${sw}"/>
    <path d="M-6 5 Q0 -6 6 5 Z" fill="var(--faint)" opacity="${active?.95:.6}"/>${dome
      ? `<path d="M-7.5 4 Q0 -13 7.5 4 Z" fill="#CFE3EE" opacity=".13"/><path d="M-7.5 4 Q0 -13 7.5 4" fill="none" stroke="#CFE3EE" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`
      : ""}</g>`;
}
function labyrinth(canal, opts){
  opts=opts||{};
  const colors={posterior:"var(--post)",horizontal:"var(--horiz)",anterior:"var(--ant)"};
  const active=colors[canal];
  const vertical = canal==="posterior"||canal==="anterior";
  const order=["anterior","horizontal","posterior"].filter(k=>k!==canal).concat([canal]);   // aktywny rysowany NA WIERZCHU
  // ODNOGA WSPÓLNA: pień łączący widełki kan. pionowych z łagiewką (wyraźny, gdy aktywny kanał pionowy)
  const crus=`<path d="M${LAB_CRUS.fx} ${LAB_CRUS.fy} L${LAB_UTR.cx} ${LAB_UTR.cy-LAB_UTR.ry+2}" fill="none"
    stroke="${vertical?active:"#33404D"}" stroke-width="${vertical?10:7}" stroke-linecap="round" opacity="${vertical?.9:.45}"/>`;
  let loops="";
  for(const k of order){
    const on=k===canal;
    loops+=`<path id="path-${k}" d="${CANAL_PATHS[k]}" fill="none" stroke="${on?active:"#33404D"}"
      stroke-width="${on?9:6}" stroke-linecap="round" opacity="${on?1:.5}"/>`;
  }
  // BAŃKI Z GRZEBIENIAMI — wszystkie trzy (kontekst dydaktyczny); aktywna z osklepkiem (chyba że kupulolitiaza)
  let amps=""; for(const k of order) amps+=ampullaGlyph(k,colors[k],k===canal,k===canal&&!opts.cupula);
  // Osklepek (cupula) przy bańce kanału TYLNEGO — TYLKO dla manewrów na KUPULOLITIAZĘ (Bascule). Ruchoma błona:
  // animacja (setupGuideAnim, krok 1) odgina ją w fazie przylegania i prostuje przy odklejaniu (obrót wokół LAB_PIVOT).
  const cp=LAB_AMP[canal]||LAB_AMP.posterior, px=cp.x, py=cp.y;   // osklepek przy bańce AKTYWNEGO kanału (kupulolitiaza: tylny=Bascule / poziomy=Gufoni apo)
  const cupula = opts.cupula
    ? `<g id="labcupula" transform="rotate(0 ${px} ${py})"><path d="M${px-7.5} ${py+4} Q${px} ${py-13} ${px+7.5} ${py+4} Z" fill="#CFE3EE" opacity=".18"/><path d="M${px-7.5} ${py+4} Q${px} ${py-13} ${px+7.5} ${py+4}" fill="none" stroke="#CFE3EE" stroke-width="3" stroke-linecap="round" opacity=".92"/></g>`
    : "";
  return `<svg viewBox="38 35 205 164" role="img" aria-label="${t("Błędnik: kanały półkoliste z bańkami i grzebieniami, odnoga wspólna kanałów pionowych, łagiewka; aktywny","Labyrinth: semicircular canals with ampullae and cristae, common crus of the vertical canals, utricle; active")}: ${CANALS[canal].label}" style="width:80%;margin-inline:auto">
    <ellipse cx="${LAB_UTR.cx}" cy="${LAB_UTR.cy}" rx="${LAB_UTR.rx}" ry="${LAB_UTR.ry}" fill="#22303D" stroke="var(--line)" stroke-width="1.5"/>
    ${crus}${loops}${amps}${cupula}
    <text x="${LAB_UTR.cx}" y="${LAB_UTR.cy+4}" text-anchor="middle" fill="var(--faint)" font-size="9">${t("łagiewka","utricle")}</text>
    <line x1="169" y1="116" x2="153" y2="130" stroke="var(--faint)" stroke-width="1" opacity=".6"/>
    <text x="171" y="115" text-anchor="start" fill="var(--faint)" font-size="7.5">${t("odnoga wspólna","common crus")}</text>
    <circle id="otolith" r="6" fill="#fff" stroke="${active}" stroke-width="2"/></svg>
    <div class="viewpoint">${t("schemat wędrówki — położenie poglądowe; czas i skuteczność z fizyki","migration diagram — illustrative position; timing and efficacy from the physics")}</div>`;
}
function placeOtolith(canal,p,exitBlend){
  const path=$("#path-"+canal),dot=$("#otolith"); if(!path||!dot) return false;
  const pt=path.getPointAtLength(Math.max(0,Math.min(1,p))*path.getTotalLength());
  let x=pt.x, y=pt.y;
  if(exitBlend>0){ x=pt.x+(LAB_UTR.cx-pt.x)*exitBlend; y=pt.y+(LAB_UTR.cy-pt.y)*exitBlend; }  // osiadanie w łagiewce
  dot.setAttribute("cx",x); dot.setAttribute("cy",y); return true;
}

/* ============ SVG: oczy + oczopląs ============ */
function eyesSVG(){
  const eye=(cx)=>`<ellipse cx="${cx}" cy="55" rx="40" ry="30" fill="#EEF3F7" stroke="var(--line)" stroke-width="2"/>
    <g class="iris" data-cx="${cx}" data-cy="55">
      <circle cx="${cx}" cy="55" r="17" fill="#3A6B86"/><circle cx="${cx}" cy="55" r="8" fill="#0b1118"/>
      <line x1="${cx}" y1="55" x2="${cx}" y2="40" stroke="#cfe3ee" stroke-width="2.5" stroke-linecap="round"/></g>`;
  return `<svg viewBox="0 0 220 110" class="eyes" role="img" aria-label="${tr("Animacja oczopląsu","Nystagmus animation")}">${eye(62)}${eye(158)}</svg>`;
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
  const T=nys.kind==="upbeatTorsional"?720:760, fast=0.17, start=vizPeek();
  // OBWIEDNIA CZASOWA Z SILNIKA: ξ(t) z simulateCanalith/Cupulolith.
  // kanalolitiaza → przejściowa (narost po latencji → szczyt → wygasanie, cząstka wychodzi → NIE wraca);
  // kupulolitiaza → uporczywa. Animacja gra RAZ i się zatrzymuje (koniec pętli).
  const canal=nys.canal||"posterior", side=nys.side||"P";
  const {env, tEnd} = envOv || xiEnvelope(engineXi(canal, side, nys.persistent, nys.q));
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  return `<svg viewBox="0 0 250 150" role="img" aria-label="${t("Mechanizm przemieszczania otolitów","Otolith displacement mechanism")}">
    <path d="${loop}" fill="none" stroke="#33404D" stroke-width="15" stroke-linejoin="round"/>
    <path id="dpath" d="${loop}" fill="none" stroke="${color}" stroke-width="2" opacity=".55"/>
    <ellipse cx="62" cy="74" rx="22" ry="26" fill="#22303D" stroke="${color}" stroke-width="2"/>
    <text x="62" y="128" text-anchor="middle" fill="var(--faint)" font-size="9">${t("bańka","ampulla")}</text>
    <text x="200" y="128" text-anchor="middle" fill="var(--faint)" font-size="9">${t("ramię kanału","canal arm")}</text>
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
  const len=path.getTotalLength(), start=vizPeek();
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
    loopRAF((rnow)=>{ const now=vizNow(rnow); if(!document.body.contains(container)) return false;
      const elapsed=(now-start)/1000;
      if(elapsed>lastT){ place(phiAt(lastT)); return false; }   // koniec — cząstka spoczywa, bez pętli
      place(phiAt(elapsed)); return true; });
  } else {
    particle.style.display="none";               // złóg na osklepku — bańka się odgina
    // odgięcie osklepka wg ξ(t) z silnika (uporczywe — kupulolitiaza nie wygasa, dopóki pozycja trwa)
    const {env, tEnd} = xiEnvelope(engineXi(canal, side, true, provokeQ(canal, side)));
    cupula.setAttribute("transform","rotate(0 62 96)");
    loopRAF((rnow)=>{ const now=vizNow(rnow); if(!document.body.contains(container)) return false;
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
/* computeManSim / manStepEnv / stepXiPeak / manPhi / phiToFrac / manExitStep / manFractions /
   guideNysSeconds PRZENIESIONE do src/pose/maneuvers.js (Blok 10) — to czysta fizyka złogu, nie
   renderowanie, a wyrocznia man:check musi ją wołać w gołym Node. Tutaj zostaje wyłącznie
   currentManSim(), bo trzyma cache w state. */
// symulacja manewru z cache; klucz zawiera rozmiar → zmiana rozmiaru unieważnia cache i przelicza dynamikę.
function currentManSim(){
  const key=state.plan.name+"|"+state.plan.side+"|"+state.size+"|"+state.plan.steps.map(s=>s.seconds==null?"_":s.seconds).join(",");   // czasy kroków (st.seconds → tHold) wpływają na dynamikę → muszą być w kluczu (audyt #8: małe złogi cap=20 s, ręczne skrócenie zmienia φ(t))
  if(state._manKey!==key){ state._manKey=key; state._manSim=computeManSim(state.plan, state.size); }
  return state._manSim;
}
// Klucz TOŻSAMOŚCI odliczanej pozycji. Póki się nie zmieni, ponowny render NIE jest nowym krokiem.
let _timerKey=null;
function setupGuideAnim(){
  const st=state.plan.steps[state.step], total=st.seconds||0;
  // Licznik zerował się BEZWARUNKOWO przy każdym renderze ekranu manewru, a render woła m.in.
  // przełącznik języka i przełącznik 2D/3D — w środku repozycji kasowało to trwające odliczanie
  // pozycji. Blok 1 wymaga, by zmiana układu/preferencji nie gubiła stanu przypadku, więc reset
  // wiążemy z TOŻSAMOŚCIĄ kroku, nie z faktem przerysowania. `total` jest w kluczu celowo:
  // ręcznie ustawiony czas utrzymania pozycji (suwak) to parametr kliniczny — jego zmiana MA
  // zaczynać odliczanie od nowa. Clamp chroni przed stanem „już przekroczony" po skróceniu czasu.
  const k=`${state.maneuverKey}|${state.side}|${state.step}|${state.size}|${total}`;
  state.total=total;
  if(_timerKey!==k){ _timerKey=k; state.elapsedMs=0; state.running=false; }
  state.elapsedMs=Math.min(state.elapsedMs, total*1000);
  const canal=state.plan.canal;
  const cupPivot=(()=>{const a=LAB_AMP[canal]||LAB_AMP.posterior; return `${a.x} ${a.y}`;})();   // środek obrotu osklepka = bańka AKTYWNEGO kanału (Bascule=tylny / Gufoni apo=poziomy)
  const man=currentManSim(), sched=manFractions(man, state.plan), fr=sched.fr;
  const fTo=fr[state.step], fFrom=state.step>0?fr[state.step-1]:fTo;
  const exited = sched.exitStep>=0 && state.step>=sched.exitStep;        // cząstka już w łagiewce?
  const blendOnly = exited && state.step>sched.exitStep;                  // krok po wyjściu — spoczynek w łagiewce
  // KUPULOLITIAZA (mechanism:"cupulo"): 1. krok = etap przylegania/odklejania złogu od osklepka, potem zwykła wędrówka.
  const cupuloAdh = state.plan.mechanism==="cupulo" && state.step===0;
  const holdAdh = cupuloAdh && !man.exited;   // KONWERSJA (Gufoni apo): krok 1 = złóg WBITY w osklepek — TRZYMA się (bez odklejania/wędrówki). Bascule (wychodzi) → pełna liberacja.
  const cupuloDetach = state.plan.mechanism==="cupulo" && !man.exited && state.step===1;   // GUFONI APO krok 2: ODKLEJANIE od osklepka (błona prostuje się) + start wędrówki złogu w kanale.
  const EA=0.04, CUP_ANG=17;                                             // pozycja złogu na osklepku (ułamek ścieżki, tuż przy bańce/grzebieniu) + kąt odgięcia błony
  if(cupuloAdh){ placeOtolith(canal, EA, 0); const c0=document.getElementById("labcupula"); if(c0) c0.setAttribute("transform",`rotate(${CUP_ANG} ${cupPivot})`); }
  else if(cupuloDetach){ placeOtolith(canal, EA, 0); const c1=document.getElementById("labcupula"); if(c1) c1.setAttribute("transform",`rotate(${CUP_ANG} ${cupPivot})`); }   // start kroku 2: złóg jeszcze na osklepku (odgiętym) — za moment się odkleja
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
  loopRAF((rnow)=>{
    if(!document.getElementById("otolith")) return false;
    /* DWA ZEGARY W JEDNEJ PETLI (Blok 7). `dt` liczy sie z czasu RZECZYWISTEGO, bo zasila
       state.elapsedMs — czas utrzymania pozycji jest parametrem KLINICZNYM (od niego zalezy,
       czy zlog zdazy opuscic kanal) i predkosc podgladu nie ma prawa go zmieniac.
       `vnow` to czas WIZUALIZACJI: wedrowka zloga, oddech osklepka i pulsy reaguja na pauze
       i na 0,5x. Pomylenie tych dwoch znaczyloby, ze aplikacja pisze „utrzymaj 30 s", a liczy 60. */
    const dt=rnow-last; last=rnow;
    const now=vizNow(rnow);
    // ANIMACJA OTOLITU: przejście fFrom→fTo na wejściu w krok, niezależnie od timera (ruch przy repozycji)
    if(_otoStart===null) _otoStart=now;
    const ot=Math.min(1,(now-_otoStart)/DUR);
    if(holdAdh){                                                 // GUFONI APO krok 1: złóg WBITY w osklepek = punkt startowy — trzyma się (delikatny „oddech", bez odklejania)
      const cup=document.getElementById("labcupula"), oto=document.getElementById("otolith");
      if(cup) cup.setAttribute("transform",`rotate(${(CUP_ANG+Math.sin(now/95)*2).toFixed(2)} ${cupPivot})`);
      placeOtolith(canal, EA, 0);
      if(oto) oto.setAttribute("r",(6.4+Math.sin(now/95)*0.5).toFixed(2));
    }
    else if(cupuloAdh){
      const cup=document.getElementById("labcupula"), oto=document.getElementById("otolith");
      const AD=0.42, DET=0.58;                                    // fazy: [0,AD]=przyleganie · [AD,DET]=odklejanie · [DET,1]=start wędrówki
      if(ot<AD){                                                  // PRZYLEGANIE: osklepek odgięty, złóg drży „przyklejony"
        if(cup) cup.setAttribute("transform",`rotate(${(CUP_ANG+Math.sin(now/85)*2.5).toFixed(2)} ${cupPivot})`);
        placeOtolith(canal, EA, 0);
        if(oto) oto.setAttribute("r",(6.4+Math.sin(now/85)*0.5).toFixed(2));
      } else if(ot<DET){                                          // ODKLEJANIE: osklepek prostuje się, złóg pulsuje i uwalnia
        const u=easeInOut((ot-AD)/(DET-AD));
        if(cup) cup.setAttribute("transform",`rotate(${(CUP_ANG*(1-u)).toFixed(2)} ${cupPivot})`);
        placeOtolith(canal, EA, 0);
        if(oto) oto.setAttribute("r",(6.4+3.4*Math.sin(u*Math.PI)).toFixed(2));
      } else {                                                    // START WĘDRÓWKI: od osklepka na ścieżkę do pozycji spoczynkowej
        if(cup) cup.setAttribute("transform",`rotate(0 ${cupPivot})`);
        if(oto) oto.setAttribute("r",6);
        placeOtolith(canal, EA+(fTo-EA)*easeInOut((ot-DET)/(1-DET)), 0);
      }
    }
    else if(cupuloDetach){                                        // GUFONI APO krok 2: osklepek PROSTUJE się (odklejanie), złóg rusza z osklepka i wędruje EA→fTo
      const cup=document.getElementById("labcupula"), oto=document.getElementById("otolith");
      if(cup) cup.setAttribute("transform",`rotate(${(CUP_ANG*Math.max(0,1-ot*2.2)).toFixed(2)} ${cupPivot})`);   // błona wraca do pionu w ~1. połowie kroku
      if(oto) oto.setAttribute("r",(ot<0.28?6.4+2.6*Math.sin(easeInOut(ot/0.28)*Math.PI):6).toFixed(2));           // krótki „puls" uwolnienia
      placeOtolith(canal, EA+(fTo-EA)*easeInOut(ot), 0);
    }
    else if(blendOnly){ placeOtolith(canal, 1, 1); }
    else if(exited && state.step===sched.exitStep){
      // najpierw dojazd po ścieżce do wyjścia (0–0.65), potem wpadnięcie do łagiewki (0.65–1)
      if(ot<0.65){ placeOtolith(canal, fFrom+(1-fFrom)*easeInOut(ot/0.65), 0); }
      else{ placeOtolith(canal, 1, easeInOut((ot-0.65)/0.35)); }
    } else {
      placeOtolith(canal, fFrom+(fTo-fFrom)*easeInOut(ot), 0);
    }
    /* TIMER — czyta state.total na żywo (suwak działa od razu).
       CZAS ŚCIENNY, NIE SUMA KLATEK (Blok 10, kryterium odbioru nr 3). Sumowanie `dt` wyglądało
       na „licznik stoi przy zgaszonym ekranie", ale w rzeczywistości pierwsza klatka po powrocie
       dostawała `dt` równe CAŁEJ przerwie i nadrabiała ją jednym skokiem — razem z sygnałem
       i auto-przejściem, w skrajnym razie kaskadą aż do `markConsumed`. `dt` zostaje wyłącznie
       animacji (wyżej), a odczyt licznika bierze się z kotwicy zegara ściennego. */
    const T=state.total;
    if(T>0){
      const teraz=Date.now();
      // PRZERWA W WIDOCZNOŚCI. Czas i tak jest policzony prawdziwie, ale aplikacja NIE UMIE
      // stwierdzić, czy pacjent utrzymał pozycję, gdy nikt na ekran nie patrzył — więc zatrzymuje
      // odliczanie i pyta. To jest druga połowa kryterium: „wyraźnie ostrzega przed przerwaniem".
      if(state.ukryteOd!=null){
        const l=odnotujLuke(state.zegar, state.ukryteOd, teraz);
        state.ukryteOd=null;
        if(l.istotna && state.running){ state.running=false; pauzaZegara(state.zegar, teraz); render(); return false; }
      }
      if(state.running) state.elapsedMs=odliczono(state.zegar, teraz);
      const frac=Math.min(1,state.elapsedMs/1000/T);
      const remaining=Math.max(0,Math.ceil(T-state.elapsedMs/1000));
      if(remaining!==lastSec){ lastSec=remaining; const r=$("#tread"); if(r)r.textContent=fmtClock(remaining); }
      const bar=$("#tprog"); if(bar) bar.style.width=((1-frac)*100)+"%";
      if(state.running && state.elapsedMs/1000>=T){ state.running=false; pauzaZegara(state.zegar, teraz); updateGoBtn(); beep();
        if(state.autoAdvance) goStep(state.step+1,true); }
    }
    return true;
  });
}
function updateGoBtn(){ const b=$("#btnGo"); if(b){ b.textContent=state.running?t("Pauza","Pause"):"Start"; b.classList.toggle("run",state.running);} syncWake();
  /* Blok 16: start i pauza licznika zmieniaja odpowiedz na pytanie „czy wolno teraz wdrozyc nowa
     wersje" — a to jedyne miejsce, przez ktore przechodza OBIE drogi (przycisk i skrot spacja).
     Uchwyt globalny, bo powloka ma zostac lisciem grafu (ten sam wzorzec, co __otoLangChange). */
  try{ if(typeof window!=="undefined" && typeof window.__otoAktualizacja==="function") window.__otoAktualizacja(); }catch(e){}
}
/* Start/pauza idzie przez zegar SCIENNY. Kotwica jest JEDNYM zrodlem prawdy o czasie utrzymania
   pozycji; `state.elapsedMs` zostaje wylacznie jako ODCZYT dla petli animacji i markupu. Dwa
   niezalezne liczniki tego samego czasu rozjechalyby sie przy pierwszej pauzie. */
function toggleTimer(){
  const teraz=Date.now();
  if(!state.zegar) state.zegar=nowyZegar();
  if(!state.running && state.elapsedMs/1000>=state.total){ state.elapsedMs=0; resetZegara(state.zegar); }
  state.running=!state.running;
  if(state.running) startZegara(state.zegar, teraz, state.elapsedMs);
  else { pauzaZegara(state.zegar, teraz); state.elapsedMs=odliczono(state.zegar, teraz); }
  updateGoBtn();
}
function resetTimer(){ state.elapsedMs=0; state.running=false; if(state.zegar) resetZegara(state.zegar); state.luka=0; updateGoBtn(); }
function adjust(d){ state.total=Math.max(5,state.total+d); const st=state.plan.steps[state.step]; st.seconds=state.total;
  if(state.elapsedMs/1000>state.total) state.elapsedMs=state.total*1000; const r=$("#tread"); if(r)r.textContent=fmt(Math.ceil(state.total-state.elapsedMs/1000)); }
// Liniowy suwak czasu kroku (0–2:00, snap co 15 s). Aktualizuje state.total (pętla czyta na żywo).
function setStepSeconds(v){
  v=Math.max(15,Math.min(120,Math.round(v/15)*15));
  state.total=v; const st=state.plan.steps[state.step]; st.seconds=v;
  // Skrocenie czasu suwakiem ponizej juz odliczonego przesuwa KOTWICE, a nie osobne pole.
  if(state.elapsedMs/1000>v){ state.elapsedMs=v*1000; if(state.zegar) ustawOdliczono(state.zegar, Date.now(), state.elapsedMs); }
  const p=v/120*100, k=$("#knob"), f=$("#fill"); if(k)k.style.left=p+"%"; if(f)f.style.width=p+"%";
  const r=$("#tread"); if(r)r.textContent=fmtClock(Math.max(0,Math.ceil(v-state.elapsedMs/1000)));
  // ARIA musi iść za wartością — inaczej czytnik ekranu podaje wartość z chwili renderu.
  const tr0=$("#track"); if(tr0){ tr0.setAttribute("aria-valuenow", String(v)); tr0.setAttribute("aria-valuetext", fmtClock(v)); }
}
function initGuideSlider(){
  const track=$("#track"); if(!track) return;
  const fromX=x=>{const r=track.getBoundingClientRect(); return (x-r.left)/r.width*120;};
  let drag=false;
  track.onpointerdown=e=>{ drag=true; try{track.setPointerCapture(e.pointerId);}catch(_){} setStepSeconds(fromX(e.clientX)); };
  track.onpointermove=e=>{ if(drag) setStepSeconds(fromX(e.clientX)); };
  track.onpointerup=track.onpointercancel=()=>{ drag=false; };
  // KLAWIATURA (Blok 2). Suwak obsługiwał wyłącznie wskaźnik, więc czas utrzymania pozycji —
  // parametr KLINICZNY, nie preferencja UI — był nieosiągalny bez myszy/dotyku. Krok 15 s jest
  // zgodny z kwantyzacją w setStepSeconds (Math.round(v/15)*15), więc klawiatura i przeciąganie
  // dają dokładnie ten sam zbiór wartości.
  track.onkeydown=e=>{
    // Wartość bieżąca czytana z KROKU planu, nie ze state.total: total ustawia setupGuideAnim,
    // które biegnie w rAF, więc tuż po renderze bywa jeszcze 0 — pierwszy klawisz liczyłby wtedy
    // od zera i skakał na 15 s zamiast o jeden krok w górę.
    const stp=state.plan && state.plan.steps[state.step];
    const cur=(stp && stp.seconds!=null) ? stp.seconds : (state.total||0);
    let v=null;
    if(e.key==="ArrowRight"||e.key==="ArrowUp") v=cur+15;
    else if(e.key==="ArrowLeft"||e.key==="ArrowDown") v=cur-15;
    else if(e.key==="Home") v=15;
    else if(e.key==="End") v=120;
    else if(e.key==="PageUp") v=cur+30;
    else if(e.key==="PageDown") v=cur-30;
    if(v==null) return;
    e.preventDefault();
    setStepSeconds(v);
  };
}
// Odwracana karta: widok frontalny ⇄ wędrówka otolitów — obrót jest CZYSTO WIZUALNY (tylko klasa CSS).
// Animacje kroku (oczopląs: oczy+dial oraz wędrówka otolitu) startują RAZ przy wejściu w krok (renderGuide
// + setupGuideAnim), grają nieprzerwanie w tle na obu stronach (obie w DOM) aż do końca (tEnd) i płynnie z
// niego wynikają — flip ich NIE resetuje ani nie zatrzymuje; po obrocie widać bieżący, ciągły stan animacji.
function flipGuide(){ const f=$("#flip"); if(!f) return; f.classList.toggle("flipped"); }
// wyrównanie wysokości obu stron (warstwy absolutne) — bez „skakania" przy obrocie
function sizeFlip(id="flip"){ const f=$("#"+id); if(!f) return; let h=0;
  // ZAPADKA (naprawa, Blok 1): obie strony to .face{position:absolute;inset:0;overflow:hidden},
  // więc gdy f.style.height jest już ustawione, warstwy są do niego PRZYCIĘTE i scrollHeight nigdy
  // nie zgłosi mniej niż bieżąca wysokość — karta potrafiła tylko rosnąć (1200→360 px zostawiało
  // ~793 px). Zerujemy PRZED pomiarem; odczyt scrollHeight i tak wymusza layout synchronicznie,
  // a całość biegnie w rAF, więc użytkownik nie zobaczy stanu pośredniego.
  f.style.height="";
  f.querySelectorAll(".face").forEach(el=>{ h=Math.max(h, el.scrollHeight + (el.offsetHeight - el.clientHeight)); });  // +ramka (border-box) → bez paska
  if(h>0) f.style.height=h+"px"; }

/* ============ Render ============ */
function render(){
  cancelAnims();
  if(state.screen==="start") renderStart();
  else if(state.screen==="triage") renderTriage();
  else if(state.screen==="setup") renderSetup();
  else if(state.screen==="guide") renderGuide();
  else if(state.screen==="obs") renderObs();
  else if(state.screen==="interpret") renderInterpret();
  else if(state.screen==="followup") renderFollowup();
  else if(state.screen==="opis") renderOpis();
  else if(state.screen==="hintsKwal") renderHintsKwal();
  else if(state.screen==="hintsBad") renderHintsBad();
  else if(state.screen==="hintsWyn") renderHintsWyn();
  else if(state.screen==="labLista") renderLabLista();
  else if(state.screen==="labEksp") renderLabEksp();
  else if(state.screen==="naukaBib") renderNaukaBib();
  else if(state.screen==="naukaLekcja") renderNaukaLekcja();
  else if(state.screen==="hints") renderHints();
  else renderDiag();
  /* ZASIĘG ZEGARA WIZUALIZACJI = EKRAN, KTÓRY MA PILOTA (naprawa po krytyce Bloku 7).
     Warunek stoi na OBECNOŚCI paska w świeżo narysowanym drzewie, a nie na liście nazw ekranów:
     lista rozjechałaby się po cichu przy pierwszym ekranie, który dostanie sterowanie, a golden
     i tak przypina, gdzie pasek jest (markup .vizbar siedzi w kluczach diag/*).
     Wołane PO narysowaniu, a przed pierwszą klatką: pętle zapisują tylko `start=vizPeek()`,
     a `vizNow()` czytają dopiero w rAF, czyli już po powrocie z render(). */
  try{ if(!document.querySelector(".vizbar")) vizClock.wymusOdtwarzanie(); }catch(e){}
}

/* ============ Ekran startowy oparty na CELU użytkownika (Blok 4) ============
   Dotąd wejściem był wybór MODUŁU aplikacji (zakładki Repozycja/Diagnostyka/HINTS), co wymagało
   od użytkownika wiedzy, jak nazywa się szuflada, w której leży to, czego szuka. Ten ekran pyta
   o SYTUACJĘ KLINICZNĄ i sam prowadzi do właściwego modułu.

   Ważne: żadne wejście nie prowadzi donikąd i żadne nie obiecuje funkcji, której nie ma. Pozycja
   „Mam wynik próby" celuje w ekran testu, bo TAM istnieje wprowadzanie zaobserwowanego oczopląsu
   (.obsrow) i klasyfikacja Bárány; pełny krok „Interpretacja" jako osobny etap to Blok 9.

   Wyrocznia: domOracle ustawia state.screen jawnie dla każdego scenariusza (snapshot.mjs:305),
   więc dołożenie NOWEGO ekranu nie zmienia żadnego z 91 przypiętych kluczy.
   Handlery wołane przez powierzchnię globalną (window) — ten sam wzorzec, co reszta onclick
   w tym pliku; dzięki temu moduł nie musi importować actions.js i nie powstaje cykl. */
// Szybkie wejście z ekranu startowego: przełącz moduł I OPUŚĆ ekran startowy. Samo setMode nie
// wystarcza — zmienia tryb, ale render() zostaje przy screen="start", więc dotknięcie karty
// wyglądałoby na nieskuteczne.
function startGo(mode){ state.mode=mode; state.screen="setup"; render(); }
function startQuick(n, ico, tytul, opis, akcja){
  return `<li><button type="button" class="quick" onclick="${akcja}">
      <span class="quick__n" aria-hidden="true">${n}</span>
      <span class="quick__ico" aria-hidden="true">${ico}</span>
      <span class="quick__txt"><b>${tytul}</b><small>${opis}</small></span>
      <span class="quick__go" aria-hidden="true">›</span></button></li>`;
}
function renderStart(){
  const I = {
    poz:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6" r="2.6" stroke="currentColor" stroke-width="1.8"/><path d="M6 20c0-3.6 2.7-6 6-6s6 2.4 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4 9.5 6.5 7M20 9.5 17.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    czas: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    oko:  '<svg viewBox="0 0 24 24" fill="none"><path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2.6" stroke="currentColor" stroke-width="1.8"/></svg>',
    cel:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7.5" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    uwaga:'<svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5 21 19.5H3L12 4.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v4M12 16.6v.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
    lek:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="6.2" r="2.8" stroke="currentColor" stroke-width="1.8"/><path d="M7 11.5v3.2a5 5 0 0 0 10 0v-3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="18.5" cy="17.5" r="2.2" stroke="currentColor" stroke-width="1.8"/></svg>',
    ucz:  '<svg viewBox="0 0 24 24" fill="none"><path d="M3 8.5 12 4.5l9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M6.5 10.5v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  };
  $("#app").innerHTML=`
    <section class="startpage">
      <h2 class="starth">${t("Wybierz tryb","Choose a mode")}</h2>
      <div class="modecards">
        <button type="button" class="modecard modecard--clin" onclick="openTriage()">
          <span class="modecard__ico" aria-hidden="true">${I.lek}</span>
          <span class="modecard__txt"><b>${t("Badam pacjenta","Examining a patient")}</b>
            <small>${t("Tryb kliniczny dla lekarzy i praktyków","Clinical mode for physicians and practitioners")}</small></span>
          <span class="modecard__go" aria-hidden="true">›</span></button>
        <button type="button" class="modecard" onclick="goArea('learn')">
          <span class="modecard__ico" aria-hidden="true">${I.ucz}</span>
          <span class="modecard__txt"><b>${t("Uczę się","Learning")}</b>
            <small>${t("Tryb edukacyjny dla studentów i lekarzy","Educational mode for students and physicians")}</small></span>
          <span class="modecard__go" aria-hidden="true">›</span></button>
      </div>

      <div class="pagegrid startgrid">
        <div class="col col--ctl">
          <h2 class="starth">${t("Co chcesz zrobić?","What do you want to do?")}</h2>
          <ul class="quicklist">
            ${startQuick(1, I.poz,  t("Zawroty po zmianie pozycji","Vertigo after a change of position"),
                             t("Diagnostyka BPPV krok po kroku","Step-by-step BPPV work-up"), "startGo('diag')")}
            ${startQuick(2, I.czas, t("Ciągłe zawroty od godzin lub dni","Continuous vertigo for hours or days"),
                             t("Kwalifikacja do HINTS / HINTS+","Qualification for HINTS / HINTS+"), "goHintsKwal()")}
            ${startQuick(3, I.oko,  t("Mam wynik próby","I have a test result"),
                             t("Opis oczopląsu i klasyfikacja","Nystagmus description and classification"), "startGo('diag')")}
            ${startQuick(4, I.cel,  t("Znam kanał i stronę","I know the canal and the side"),
                             t("Szybki wybór manewru","Quick maneuver selection"), "startGo('treat')")}
            ${startQuick(5, I.uwaga,t("Przypadek nietypowy","Atypical case"),
                             t("Różnicowanie i czerwone flagi","Differentiation and red flags"), "goHintsKwal()")}
          </ul>
        </div>
        <div class="col col--viz">
          <div class="card startaside">
            <h4>${t("Zakres narzędzia","Scope of the tool")}</h4>
            <ul class="startscope">
              <li><b>${t("Repozycja","Repositioning")}</b> — ${t("manewry i protokoły","maneuvers and protocols")}</li>
              <li><b>${t("Diagnostyka","Diagnostics")}</b> — ${t("testy pozycyjne, oczopląs, klasyfikacja Bárány","positional tests, nystagmus, Bárány classification")}</li>
              <li><b>HINTS</b> — ${t("różnicowanie obwód ↔ ośrodek","peripheral ↔ central differentiation")}</li>
              <li><b>${t("Laboratorium","Laboratory")}</b> — ${t("matematyczny pacjent (parametry fizjologii)","mathematical patient (physiology parameters)")}</li>
            </ul>
            <p class="note">${t("Oczopląs i czasy wynikają z symulacji fizyki złogu, nie z ręcznych adnotacji.","Nystagmus and timings follow from a physical simulation of the debris, not from manual annotations.")}</p>
          </div>
        </div>
      </div>

      <div class="disclaimer">${t('<b>Narzędzie wspomagające dla personelu medycznego.</b> Nie zastępuje badania, rozpoznania ani decyzji klinicysty. Czasy i wzorce oczopląsu są poglądowe — zweryfikuj z własnym protokołem.','<b>Support tool for medical staff.</b> Does not replace examination, diagnosis, or clinician judgment. Nystagmus timings and patterns are illustrative — verify against your own protocol.')}</div>
    </section>`;
}

/* ============ Kwalifikacja wstępna („Wywiad", Blok 6) ============
   Układ z dokumentu: komputer — kwestionariusz i podsumowanie ryzyka OBOK SIEBIE, panel boczny
   tłumaczy, DLACZEGO proponowana jest dana ścieżka; telefon — mała grupa pytań, wynik jako
   wyraźna karta z JEDNĄ zalecaną akcją, dłuższe wyjaśnienie w rozwijanym „Dlaczego?".
   Dwie kolumny idą przez ten sam `.pagegrid` co ekran manewru, więc na telefonie znikają
   (display:contents) i kolejność czytania zostaje pytania → wynik.

   Karta wyniku pokazuje ŚCIEŻKĘ, nigdy rozpoznania — patrz nagłówek triage-model.js. */
function triageOpcjaHTML(q, o, wybrane){
  const zazn = q.typ==="wielokrotny" ? (wybrane||[]).includes(o.v) : wybrane===o.v;
  const akcja = q.typ==="wielokrotny" ? `toggleTriageFlaga('${o.v}')` : `setTriage('${q.id}','${o.v}')`;
  return `<button type="button" class="tqopt" aria-pressed="${zazn}" onclick="${akcja}">
      <span class="tqopt__box" aria-hidden="true"></span>
      <span class="tqopt__txt">${t(o.pl,o.en)}</span></button>`;
}
function triageQuestionHTML(q, odp, nastepne){
  const wybrane = odp[q.id];
  const odpowiedziane = q.typ==="wielokrotny" ? Array.isArray(wybrane)&&wybrane.length : !!wybrane;
  return `<section class="card tq ${q.id===nastepne?'tq--biezace':''} ${odpowiedziane?'tq--gotowe':''}">
      <h3 class="tq__q">${t(q.pl,q.en)}</h3>
      <p class="tq__hint">${t(q.plHint,q.enHint)}</p>
      <div class="tq__opts">${q.opcje.map(o=>triageOpcjaHTML(q,o,wybrane)).join("")}</div>
    </section>`;
}
/* ============ Sterowanie symulacją + jawna perspektywa (Blok 7) ============
   Dokument: „Sterowanie: pauza, 0,5×, 1×, krok po kroku, reset i pełny ekran" oraz
   „Stale jawna perspektywa: widok badającego lub pacjenta" i „Widoczne etykiety LEWE/PRAWE
   UCHO PACJENTA".

   Dlaczego etykieta perspektywy jest tu sprawą KLINICZNĄ, a nie kosmetyczną: na jednym ekranie
   sąsiadują dwa panele o PRZECIWNYCH konwencjach — „Widok frontalny" pokazuje pacjenta tak, jak
   widzi go badający (prawe ucho pacjenta po LEWEJ stronie obrazu), a „Głowa (z góry)" jest
   rysowana kamerą topDownBehind, czyli znad głowy OD TYŁU (prawe ucho po PRAWEJ). Dotąd żaden
   z nich tego nie mówił, a od strony zależy, które ucho zostanie poddane repozycji. */
const VIZ_PERSPEKTYWA = {
  frontal: () => t('widok badającego — prawe ucho pacjenta po LEWEJ stronie obrazu',
                   "examiner's view — the patient's right ear is on the LEFT of the image"),
  topDownBehind: () => t('znad głowy, od tyłu — prawe ucho pacjenta po PRAWEJ stronie obrazu',
                         'from above and behind — the patient’s right ear is on the RIGHT of the image'),
  /* Kamera DOMYŚLNA schematu głowy (headDial: `Scene3D.CAMERAS[headCamera] || topDownFront`).
     Dopisana, bo bez niej perspNota() dla Semonta i Bascule — jedynych dwóch manewrów bez jawnej
     `headCamera` — zwracałaby pusty napis, czyli naprawa udawałaby, że działa akurat tam,
     gdzie sprawdzić ją najtrudniej. */
  topDownFront: () => t('znad głowy, od przodu — prawe ucho pacjenta po LEWEJ stronie obrazu',
                        'from above and in front — the patient’s right ear is on the LEFT of the image'),
};
function perspNota(kind){
  const f = VIZ_PERSPEKTYWA[kind]; if(!f) return "";
  return `<p class="perspnote">${f()}</p>`;
}
// Znacznik ucha przy wierszu oczu. Sam napis „P"/„L" nie mówi CZYJA to strona — a to jedyna
// informacja, od której zależy, po której stronie wykonasz manewr.
function earMark(strona){
  const pl = strona==="P" ? "prawe ucho pacjenta" : "lewe ucho pacjenta";
  const en = strona==="P" ? "patient's right ear" : "patient's left ear";
  return `<span class="emk" title="${t(pl,en)}"><abbr aria-label="${t(pl,en)}">${strona==="P"?t("P","R"):"L"}</abbr></span>`;
}

/* Pasek sterowania odtwarzaniem. Stan mieszka w zegarze (src/runtime/viz-clock.js), nie w DOM:
   cancelAnims() kasuje pętle przy każdym render(), więc prędkość trzymana w pętli wracałaby
   po cichu do 1× po każdym dotknięciu czegokolwiek.
   UWAGA: przyciski NIE wołają render(). Przerysowanie odtworzyłoby wszystkie pętle od zera,
   czyli „pauza" najpierw restartowałaby animację, a dopiero potem ją zatrzymywała — nie dałoby
   się zamrozić oglądanej klatki. Stan odbijamy w miejscu (wzorzec toggleAuto/toggleSound). */
function vizControls(){
  const sp = vizClock.getSpeed(), pau = vizClock.isPaused();
  const spBtn = (v,lbl)=>`<button type="button" class="vizbtn" data-vizspeed="${v}" aria-pressed="${sp===v}" onclick="setVizSpeed(${v})">${lbl}</button>`;
  return `<div class="vizbar" role="group" aria-label="${t("Sterowanie symulacją","Simulation controls")}">
      <button type="button" class="vizbtn vizbtn--play" data-vizpause aria-pressed="${pau}"
              aria-label="${t("Zatrzymaj albo wznów animację","Pause or resume the animation")}" onclick="toggleVizPause()">
        <span class="vizbtn__glif" aria-hidden="true">${pau?"▶":"❚❚"}</span><span class="vizbtn__txt">${pau?t("Wznów","Resume"):t("Pauza","Pause")}</span></button>
      ${spBtn(1,"1×")}${spBtn(0.5,t("0,5×","0.5×"))}
      <button type="button" class="vizbtn" data-vizstep aria-disabled="${!pau}"
              aria-label="${t("Przesuń obraz o jeden krok","Advance the image by one step")}" onclick="vizStepFwd()">${t("Krok","Step")} ›</button>
      <button type="button" class="vizbtn" onclick="resetViz()" aria-label="${t("Odtwórz animację od początku","Replay the animation from the start")}">↺</button>
      <span class="vizbar__stan" role="status" data-vizstate>${vizStanTxt()}</span>
    </div>`;
}
function vizStanTxt(){
  const sp = vizClock.getSpeed();
  return vizClock.isPaused()
    ? t("obraz zatrzymany","image paused")
    : (sp===1 ? t("odtwarzanie 1×","playing 1×") : t("odtwarzanie 0,5×","playing 0.5×"));
}
// Odbicie stanu zegara BEZ przerysowania — patrz komentarz przy vizControls.
function syncVizBar(){
  try{
    const pau = vizClock.isPaused(), sp = vizClock.getSpeed();
    document.querySelectorAll("[data-vizpause]").forEach(b=>{
      b.setAttribute("aria-pressed", String(pau));
      const g=b.querySelector(".vizbtn__glif"); if(g) g.textContent = pau?"▶":"❚❚";
      const x=b.querySelector(".vizbtn__txt"); if(x) x.textContent = pau?t("Wznów","Resume"):t("Pauza","Pause");
    });
    document.querySelectorAll("[data-vizspeed]").forEach(b=>
      b.setAttribute("aria-pressed", String(parseFloat(b.getAttribute("data-vizspeed"))===sp)));
    document.querySelectorAll("[data-vizstep]").forEach(b=> b.setAttribute("aria-disabled", String(!pau)));
    // role="status" ogłasza zmianę czytnikowi ekranu — bez tego pauza byłaby zmianą wyłącznie wizualną.
    document.querySelectorAll("[data-vizstate]").forEach(e=> e.textContent = vizStanTxt());
  }catch(e){}
}

/* STATYCZNA SEKWENCJA POZYCJI (kryterium odbioru nr 4: „przy ograniczonych animacjach dostępna
   jest statyczna sekwencja pozycji"). NIE zastępuje pętli oczopląsu — Blok 2 rozstrzygnął, że
   zatrzymanie oczopląsu w losowej klatce pod podpisem opisującym jego kierunek byłoby kłamstwem.
   To informacja INNEGO rodzaju: same UŁOŻENIA, które są z natury statyczne. */
function pozySekwencja(fazy, strona, rozwin){
  if(!fazy || !fazy.length) return "";
  const kafle = fazy.map((ph,i)=>`<li class="seqitem"><div class="seqitem__n">${i+1}</div>
      <div class="seqitem__img">${posture(poseSpec(ph), strona)}</div>
      <div class="seqitem__txt"><b>${ph.ptitle||ph.title||""}</b><small>${ph.ppos||""}</small></div></li>`).join("");
  return `<details class="card seqcard"${rozwin?" open":""}>
      <summary>${t("Sekwencja pozycji (statyczna)","Position sequence (static)")}</summary>
      <p class="note">${t("Kolejne ułożenia pacjenta bez animacji — do odczytania w dowolnym tempie.","The successive patient positions without animation — to read at any pace.")}</p>
      <ol class="seqlist">${kafle}</ol></details>`;
}

/* ============ EKRAN „OCZOPLĄS" — opis ZAOBSERWOWANEGO wyniku (Blok 8) ============
   OSOBNY EKRAN, nie panel doklejony do próby. Powód jest treściowy, nie kosmetyczny: dopóki
   formularz obserwacji sąsiaduje z animacją oczopląsu PRZEWIDYWANEGO, klinicysta może przepisać
   to, co widzi na ekranie, zamiast tego, co zobaczył u pacjenta — a wtedy „zgodność obserwacji
   z modelem" mierzy wyłącznie to, że ktoś dobrze przepisał. Rozdzielenie fizyczne jest jedynym,
   które tego nie dopuszcza.
   Ekran NIE nazywa kanału, strony ani mechanizmu — to Blok 9. Bramka SEP2 skanuje napisy modelu
   w obu językach przeciw nazwom rozpoznań. */
function obsWartoscHTML(proba, klucz, def, biezaca, znak){
  const btn = (v)=>`<button type="button" class="oqopt" aria-pressed="${biezaca===v.id}"
      onclick="setObsPole('${proba}','${klucz}','${v.id}')">
      <span class="oqopt__box" aria-hidden="true"></span>
      <span class="oqopt__txt">${t(v.pl, v.en)}</span></button>`;
  return def.wartosci.map(btn).join("");
}
function obsZnacznikHTML(proba, klucz, znak, odpowiedziane){
  if(!odpowiedziane) return "";
  const opis = znak==="niewiarygodne" ? t("niewiarygodne","unreliable") : znak==="niepewne" ? t("niepewne","uncertain") : t("pewne","confident");
  const glif = znak==="niewiarygodne" ? "⊘" : znak==="niepewne" ? "~" : "✓";
  return `<button type="button" class="oznak oznak--${znak||'pewne'}" onclick="oznaczObsPole('${proba}','${klucz}')"
      aria-label="${t("Wiarygodność tej odpowiedzi","Reliability of this answer")}: ${opis}">
      <span aria-hidden="true">${glif}</span> ${opis}</button>`;
}
function obsPytanieHTML(proba, rekord, inst){
  const def = OBS_POLA[inst.pole];
  const e = inst.klucz==="wystapil" ? { w: rekord && rekord.wystapil, znak: null } : ((rekord && rekord.pola[inst.klucz]) || null);
  const biezaca = e ? e.w : null;
  const fazaOpis = inst.fazaId && OBS_FAZY_OPIS[inst.fazaId] ? ` — ${t(OBS_FAZY_OPIS[inst.fazaId].pl, OBS_FAZY_OPIS[inst.fazaId].en)}` : "";
  return `<div class="oq${biezaca?' oq--gotowe':''}">
      <div class="oq__q">${t(def.pytanie.pl, def.pytanie.en)}${fazaOpis}</div>
      ${def.pozaModelem ? `<div class="oq__poza">${t("Model tego nie przewiduje — zapisujemy obserwację, ale nie ma jej z czym porównać.","The model does not predict this — we record the observation, but there is nothing to compare it with.")}</div>` : ""}
      <div class="oq__opts">${obsWartoscHTML(proba, inst.klucz, def, biezaca, e&&e.znak)}</div>
      ${obsZnacznikHTML(proba, inst.klucz, e&&e.znak, !!biezaca)}
    </div>`;
}
const OBS_GRUPY = [
  { os:"kontekst_wystapil", pl:"Czy wystąpił", en:"Did it occur" },
  { os:"kierunek", pl:"Kierunek", en:"Direction" },
  { os:"dynamika", pl:"Dynamika", en:"Dynamics" },
  { os:"kontekst", pl:"Warunki i cechy dodatkowe", en:"Conditions and additional features" },
];

/* KARTA PORÓWNANIA — wyłącznie za JAWNYM GESTEM (state.obsPorownanie).
   Domyślnie schowana z dwóch powodów naraz. Klinicznie: dopóki predykcja jest widoczna obok
   formularza, można ją przepisać zamiast opisać to, co się zobaczyło. Technicznie: karta za
   gestem nie renderuje się w scenariuszach domyślnych, więc NIE rusza ani jednego istniejącego
   klucza golden — a jeśli rusza, to znaczy, że gest nie jest gestem.
   Układ jest ASYMETRYCZNY (obserwacja jako nagłówek wiersza, model jako dopisek), bo dwie
   kolumny obok siebie sugerowałyby, że to dwa równorzędne pomiary tej samej rzeczy. */
function obsPorownanieHTML(rek, proba){
  if(!rek) return "";
  const A = state.side || "P";
  const deps = {
    anat: (pr, fazaId)=>{
      try{
        const fazy = DIAG[pr].phases(A, state.variant);
        const f = fazy[fazaDIAG(pr, fazaId, A)];
        return f && f.nys && f.nys.anat ? f.nys.anat : null;
      }catch(e){ return null; }
    },
    wzorzec: state.variant==="cupulo" ? "B" : "A",
  };
  const wiersze = porownajZPredykcja(rek, deps);
  const opisWartosci = (pole, id)=>{
    const w = (OBS_POLA[pole].wartosci||[]).find(v=>v.id===id);
    return w ? t(w.pl, w.en) : String(id);
  };
  const wiersz = (r)=>{
    const wd = WERDYKTY_POROWNANIA[r.werdykt];
    const faza = r.fazaId && OBS_FAZY_OPIS[r.fazaId] ? ` (${t(OBS_FAZY_OPIS[r.fazaId].pl, OBS_FAZY_OPIS[r.fazaId].en)})` : "";
    return `<li class="opor__w opor__w--${r.werdykt}">
        <div class="opor__co">${t(OBS_POLA[r.pole].pytanie.pl, OBS_POLA[r.pole].pytanie.en).replace(/\s*—.*$/,"")}${faza}</div>
        <div class="opor__ty">${r.obs!=null && r.werdykt!=="nieopisane" ? opisWartosci(r.pole, r.obs) : "—"}</div>
        <div class="opor__v">${t(wd.pl, wd.en)}</div></li>`;
  };
  return `<div class="card opor">
      <h4>${t("Porównanie z przewidywaniem modelu","Comparison with the model's prediction")}</h4>
      <div class="note">${t("Model jest UPROSZCZENIEM, nie wzorcem prawdy — rozbieżność nie znaczy, że obserwacja jest błędna. Aplikacja nie sumuje tych wierszy i nie wylicza z nich żadnej trafności.","The model is a SIMPLIFICATION, not a standard of truth — a discrepancy does not mean the observation is wrong. The app does not total these rows or derive any accuracy from them.")}</div>
      <ol class="opor__l">${wiersze.map(wiersz).join("")}</ol></div>`;
}
function renderObs(){
  const proba = state.testKey || "dix";
  const D = DIAG[proba];
  const rek = (state.obs||{})[proba] || null;
  const wyst = rek ? rek.wystapil : undefined;
  const inst = instancjeStosowalne(proba, wyst);
  const komp = kompletnosc(rek || { proba, pola:{} });
  const sp = spojnosc(rek || { proba, pola:{} });
  const flg = flagi(rek);
  const wsp = rek ? poparcie(rek, proba, state.dixObs) : { poziom:"brak", powod:"brakOpisu" };

  const grupaHTML = (g)=>{
    const lista = g.os==="kontekst_wystapil"
      ? inst.filter(i=>i.klucz==="wystapil")
      : inst.filter(i=>i.os===g.os && i.klucz!=="wystapil");
    if(!lista.length) return "";
    const zrobione = lista.filter(i=>{
      const v = i.klucz==="wystapil" ? wyst : ((rek&&rek.pola[i.klucz])||{}).w;
      return v!=null;
    }).length;
    // Na telefonie rozwinięta jest JEDNA grupa; state.obsGrupa jest tu NAPRAWDĘ czytane.
    const otwarta = state.obsGrupa ? state.obsGrupa===g.os : zrobione<lista.length;
    return `<details class="card ogrupa"${otwarta?" open":""}>
        <summary onclick="event.preventDefault();setObsGrupa('${g.os}')">
          <span class="ogrupa__t">${t(g.pl,g.en)}</span>
          <span class="ogrupa__n">${zrobione}/${lista.length}</span></summary>
        ${lista.map(i=>obsPytanieHTML(proba, rek, i)).join("")}
      </details>`;
  };

  const osHTML = (klucz, etykietaPl, etykietaEn)=>{
    const o = komp[klucz]; const et = ETYKIETY_OSI[o.etykieta];
    return `<div class="opas"><span class="opas__n">${t(etykietaPl,etykietaEn)}</span>
        <span class="opas__v opas__v--${o.etykieta}">${t(et.pl,et.en)}</span></div>`;
  };
  const powodBraku = wsp.poziom==="brak" ? (POWODY_BRAKU[wsp.powod]||POWODY_BRAKU.brakOpisu) : null;
  /* Przycisk przyjęcia MUSI pytać o to samo, o co pyta `przyjmijObserwacje` — czyli o wartość
     PO kwarantannie. Inaczej powstaje przycisk aktywny, którego kliknięcie nic nie robi:
     dokładnie ta klasa defektu, którą krytyka Bloku 7 znalazła w HINTS (werdykt wypisywany
     nad nieruchomym obrazem). Trzy różne powody blokady dają trzy różne zdania — „nie opisano
     pionu" i „opisano, ale oznaczono jako niewiarygodny" to nie to samo. */
  const pionWpis = (rek && rek.pola["pion#jedyna"]) || null;
  const pionUzyteczny = rek ? wartoscInstancji(rek, "pion#jedyna") : null;
  const mozliwePrzyjecie = proba==="dix" && ["p1","m1"].includes(pionUzyteczny);
  const powodBlokady = mozliwePrzyjecie ? null
    : proba!=="dix" ? t("Podstawę interpretacji przyjmuje się na razie tylko dla manewru Dix–Hallpike'a — pozostałe próby zapisujesz, ale aplikacja nie wyprowadza z nich wniosku.","The basis of interpretation can so far be accepted only for the Dix–Hallpike — the other tests are recorded, but the app does not draw a conclusion from them.")
    : (pionWpis && pionWpis.znak==="niewiarygodne") ? t("Składowa pionowa jest oznaczona jako NIEWIARYGODNA — obserwacja zostaje zapisana i nadal zapala ostrzeżenia, ale nie może być podstawą wniosku.","The vertical component is marked UNRELIABLE — the observation is kept and still raises warnings, but it cannot be the basis of a conclusion.")
    : (pionUzyteczny==="zero") ? t("Opisano brak składowej pionowej — ten kierunek nie odpowiada żadnemu kanałowi w tym modelu.","No vertical component was described — this direction does not match any canal in this model.")
    : t("Żeby przyjąć opis jako podstawę, opisz składową pionową — to ona różnicuje kanał.","To accept the description as the basis, describe the vertical component — it is what differentiates the canal.");

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="wrocDoProby()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Zaobserwowany oczopląs","Observed nystagmus")}</b><span>${D.name}</span></div></div>
    <div class="card obsintro"><div class="instr">${t("Opisz to, co zobaczyłeś u pacjenta. To jest zapis TWOJEJ obserwacji — nie musi zgadzać się z tym, co pokazuje model.","Describe what you saw in the patient. This is a record of YOUR observation — it does not have to agree with what the model shows.")}</div></div>
    <div class="pagegrid"><div class="col col--ctl">
      ${OBS_GRUPY.map(grupaHTML).join("")}
      <div class="card oakcje">
        <button class="recoprimary" ${mozliwePrzyjecie?"":'aria-disabled="true"'} onclick="przyjmijObs()">${t("Przyjmij ten opis jako podstawę interpretacji","Accept this description as the basis of interpretation")}</button>
        ${mozliwePrzyjecie?"":`<div class="note">${powodBlokady}</div>`}
        <button class="recoalt" onclick="wyczyscObs()">${t("Wyczyść opis tej próby","Clear the description of this test")}</button>
      </div>
    </div><div class="col col--viz">
      <div class="card opodsum">
        <h4>${t("Podsumowanie obserwacji","Observation summary")}</h4>
        ${osHTML("kierunek","Kierunek","Direction")}
        ${osHTML("dynamika","Dynamika","Dynamics")}
        ${osHTML("kontekst","Warunki","Conditions")}
        <div class="note">${sp.opisanych
          ? (sp.pasujace.length
            ? t("Opisane cechy dynamiki układają się w jeden ze wzorców znanych temu modelowi.","The described dynamic features form one of the patterns this model knows.")
            : t(`Cech niepasujących do żadnego wzorca, który ten model zna: ${sp.niepasujace}.`,`Features not matching any pattern this model knows: ${sp.niepasujace}.`))
          : t("Nie opisano jeszcze dynamiki.","The dynamics have not been described yet.")}</div>
        ${powodBraku?`<div class="note" style="color:var(--text)">${t(powodBraku.pl,powodBraku.en)}</div>`:""}
        ${flg.length?`<div class="oflagi"><b>${t("Sygnały ostrzegawcze","Warning signals")}</b><ul>${flg.map(f=>`<li>${t(FLAGI[f].pl,FLAGI[f].en)}</li>`).join("")}</ul></div>`:""}
        ${rek?`<button class="recoalt oporgo" aria-pressed="${!!state.obsPorownanie}" onclick="togglePorownanie()">${state.obsPorownanie?t("Ukryj porównanie z modelem","Hide the comparison with the model"):t("Porównaj z przewidywaniem modelu","Compare with the model's prediction")}</button>`:""}
        ${(rek && nieuzyte(rek).length)?`<div class="note">${t(`Zapisane, nieużyte przy tym wyniku: ${nieuzyte(rek).length} pól.`,`Recorded but unused for this result: ${nieuzyte(rek).length} fields.`)}</div>`:""}
      </div>
      ${state.obsPorownanie?obsPorownanieHTML(rek, proba):""}
    </div></div>
    <p class="footnote">${t("Opis obserwacji nie jest rozpoznaniem. Interpretacja to osobny krok.","An observation record is not a diagnosis. Interpretation is a separate step.")}</p>`;
}

/* ============ Krok „Interpretacja" — WŁASNY EKRAN (Blok 9) ============
   Symetrycznie do kroku „Oczopląs", z powodem odwróconym: dopóki wynik wnioskowania sąsiaduje
   z kartą mechanizmu, którą użytkownik SAM przewraca, nie widać, co jest wnioskiem z opisu,
   a co jego wyborem.

   ═══ CZEGO TU NIE MA I DLACZEGO ═══
   Ani jednej liczby zbiorczej, procentu i rankingu. Kandydatury, które przetrwały eliminację,
   są RÓWNORZĘDNE — model nie liczy prawdopodobieństw i nie wolno mu ich udawać kolejnością
   ani typografią. Przy bow&leanie dwie równorzędne hipotezy to nie porażka, tylko jedyna
   prawda, jaką model ma: (canalo,P) i (cupulo,L) dają identyczny wzorzec. */
const NAZWA_MECH = (v)=> v==="cupulo" ? t("kupulolitiaza","cupulolithiasis") : t("kanalolitiaza","canalithiasis");
function nazwaKandydatury(k){
  return `${CANALS[k.canal].label} · ${SIDE[k.side]} · ${NAZWA_MECH(k.variant)}`;
}
/* Czytelny opis instancji rekordu (`pion#jedyna`, `poziom#prawoWDole`, `latencja`). Pytanie
   ucinamy do pierwszego myślnika — pełne brzmienie jest formularzowe, a tu ma być etykietą. */
function opisInstancji(klucz){
  const [pole, fazaId] = String(klucz).split("#");
  const def = OBS_POLA[pole];
  if(!def) return klucz;
  const nazwa = t(def.pytanie.pl, def.pytanie.en).replace(/\s*—.*$/,"");
  const faza = fazaId && OBS_FAZY_OPIS[fazaId] ? ` (${t(OBS_FAZY_OPIS[fazaId].pl, OBS_FAZY_OPIS[fazaId].en)})` : "";
  return nazwa + faza;
}
/* DLACZEGO strony nie da się wyprowadzić — trzy RÓŻNE powody, których nie wolno zlewać w jedno
   zdanie. Zmierzone na predykcjach silnika:
     roll     — kierunek niesie MECHANIZM, stronę niesie dopiero ASYMETRIA NASILENIA. To jedyny
                z trzech przypadków, który daje się naprawić opisem, więc kończy się prośbą,
                a nie deklaracją ograniczenia.
     bowlean  — (kanalolitiaza, jedno ucho) i (kupulolitiaza, drugie) dają IDENTYCZNY wzorzec,
                a siła jest symetryczna. Dwuznaczność jest STRUKTURALNA: żaden dodatkowy opis
                tej próby jej nie zdejmie.
     dix/hh   — kanał przedni rysowany jako czysty downbeat to uproszczenie kliniczne
                (engine_doc.txt), więc kierunek jest dla obu stron ten sam. „Maska modelu".
   Pierwsza wersja miała jedno zdanie dla wszystkich i przy bow&leanie CYTOWAŁA POWÓD Z HEAD-HANGA,
   czyli tłumaczyła ograniczenie przyczyną, która w tej próbie nie zachodzi. */
function powodBrakuStrony(w, proba){
  const lead = t("<b>Strony nie da się wyprowadzić z tego opisu.</b>","<b>The side cannot be derived from this description.</b>");
  if(proba==="roll" && (w.brakujace||[]).includes("nasilenie"))
    return `${lead} ${t("Przy próbie obrotowej kierunek niesie MECHANIZM, a stronę dopiero różnica NASILENIA między obiema pozycjami. Opisz, przy którym uchu w dole oczopląs był silniejszy.","In the roll test the direction carries the MECHANISM, while the side comes only from the difference in INTENSITY between the two positions. Describe which ear-down position gave the stronger nystagmus.")}`;
  if(proba==="bowlean")
    return `${lead} ${t("To ograniczenie MODELU, a nie brak staranności: kanalolitiaza jednego ucha i kupulolitiaza drugiego dają w tej próbie IDENTYCZNY wzorzec, a nasilenie jest symetryczne — żaden dodatkowy opis tej próby ich nie rozdzieli. Rozstrzyga próba obrotowa albo odpowiedź na manewr.","This is a limitation of the MODEL, not a lack of care: canalithiasis of one ear and cupulolithiasis of the other produce an IDENTICAL pattern in this test, and the intensity is symmetric — no further description of this test will separate them. The roll test or the response to a maneuver settles it.")}`;
  return `${lead} ${t("To ograniczenie MODELU, a nie brak staranności: kanał przedni rysowany jest jako czysty downbeat (uproszczenie kliniczne), więc kierunek oczopląsu jest dla obu stron taki sam. Stronę rozstrzyga kontekst kliniczny i odpowiedź na manewr.","This is a limitation of the MODEL, not a lack of care: the anterior canal is drawn as a pure downbeat (a clinical simplification), so the nystagmus direction is the same for both sides. The side is settled by the clinical context and the response to the maneuver.")}`;
}
/* SUGEROWANA NASTĘPNA PRÓBA. Lista NIE jest wpisana ręcznie — `sugerowaneProby` pyta model, czy
   pozostałe kandydatury mają w innej próbie RÓŻNE predykcje. Dzięki temu rada nie może rozjechać
   się z silnikiem, a pusta lista jest TWIERDZENIEM („żadna próba tego nie rozdzieli"), nie luką.
   Odesłanie klinicysty do badania, które z góry nic nie wniesie, byłoby gorsze od milczenia. */
function kartaNastepnejProby(w, proba, deps){
  const sug = sugerowaneProby(w.pozostale, proba, deps);
  if(!sug.length) return `<div class="note ilimit">${t("<b>Żadna z prób, które ten model zna, nie rozdzieli tych możliwości.</b> Rozstrzyga kontekst kliniczny i odpowiedź na manewr — nie kolejne badanie pozycyjne.","<b>None of the tests this model knows will separate these possibilities.</b> The clinical context and the response to a maneuver decide — not another positional test.")}</div>`;
  return `<div class="isug"><div class="isug__t">${t("Próba, która to rozdzieli","A test that will separate this")}</div>
    ${sug.map(p=>`<button class="recoalt" onclick="idzDoProby('${p}')">${DIAG[p].name}</button>`).join("")}
    <div class="note">${t("Wskazana dlatego, że model przewiduje dla pozostałych możliwości RÓŻNY obraz w tej próbie.","Indicated because the model predicts a DIFFERENT picture for the remaining possibilities in this test.")}</div></div>`;
}
const ETYKIETY_ZGODNOSCI = {
  pelna:      { pl:"opis pasuje do jednego wzorca", en:"the description matches one pattern" },
  czesciowa:  { pl:"opis zawęża, ale nie rozstrzyga", en:"the description narrows down but does not settle it" },
  brak:       { pl:"opis niczego nie rozstrzyga", en:"the description settles nothing" },
};
function renderInterpret(){
  const proba = state.testKey || "dix";
  const D = DIAG[proba];
  const rek = (state.obs||{})[proba] || null;
  const deps = interpDeps();
  const w = rek ? interpretuj(rek, proba, deps) : null;
  const niet = nietypowy(state, deps);

  /* Wyprowadzenie mechanizmu jest MOŻLIWE tylko wtedy, gdy opis coś rozstrzyga i został dokładnie
     jeden mechanizm. Sam zapis idzie za JAWNYM GESTEM (jak `przyjmijObs`) — zapisywanie przy
     każdej edycji pola formularza znaczyłoby, że opisanie kierunku po cichu podmienia zalecany
     manewr, czyli dokładnie to, czego Blok 8 zabronił. */
  const mozliweWyprowadzenie = !!w && w.zgodnosc !== "brak" && w.mechanizmWyprowadzalny;
  const zrodlo = state.variantZrodlo || null;

  const kartaWyniku = ()=>{
    if(!rek) return `<div class="card ibrak"><h4>${t("Nie ma czego interpretować","Nothing to interpret yet")}</h4>
      <div class="note">${t("Ten krok czyta wyłącznie opis obserwacji. Dopóki go nie ma, aplikacja nie ma z czego wyprowadzić kanału, strony ani mechanizmu.","This step reads the observation record only. Until it exists, the app has nothing from which to derive the canal, side or mechanism.")}</div>
      <button class="recoprimary" onclick="goObs()">${t("Opisz zaobserwowany oczopląs","Describe the observed nystagmus")}</button></div>`;
    const et = ETYKIETY_ZGODNOSCI[w.zgodnosc];
    const powod = w.powod && POWODY_ZGODNOSCI[w.powod] ? POWODY_ZGODNOSCI[w.powod] : null;
    return `<div class="card iwynik">
      <h4>${t("Co z tego opisu wynika","What follows from this description")}</h4>
      <div class="izgod izgod--${w.zgodnosc}">${t(et.pl, et.en)}</div>
      ${powod?`<div class="note" style="color:var(--text)">${t(powod.pl, powod.en)}</div>`:""}
      ${w.pozostale.length ? `<ul class="ikand">${w.pozostale.map(k=>`<li>${nazwaKandydatury(k)}</li>`).join("")}</ul>
        ${w.pozostale.length>1?`<div class="note">${t(`Te ${w.pozostale.length} możliwości są RÓWNORZĘDNE — model nie potrafi ich rozdzielić tym, co opisano, i nie szereguje ich według prawdopodobieństwa.`,`These ${w.pozostale.length} possibilities are EQUIVALENT — the model cannot separate them from what was described, and does not rank them by probability.`)}</div>`:""}`
        : `<div class="note">${t("Żadna z możliwości, które model zna, nie pasuje do tego opisu.","None of the possibilities this model knows matches this description.")}</div>`}
      ${w.pozostale.length && !w.stronaWyprowadzalna ? `<div class="note ilimit">${powodBrakuStrony(w, proba)}</div>`:""}
      ${w.pozostale.length && !w.mechanizmWyprowadzalny && proba==="dix" ? `<div class="note ilimit">${t("<b>Mechanizmu nie da się wyprowadzić z samego kierunku.</b> Kanalolitiaza i kupulolitiaza dają w Dix-Hallpike'u ten sam kierunek — różni je wyłącznie DYNAMIKA (latencja, czas trwania, męczliwość).","<b>The mechanism cannot be derived from direction alone.</b> Canalithiasis and cupulolithiasis produce the same direction in the Dix-Hallpike — they differ only in DYNAMICS (latency, duration, fatigability).")}</div>`:""}
      ${w.pozostale.length>1 ? kartaNastepnejProby(w, proba, deps) : ""}
    </div>`;
  };

  const kartaUzasadnienia = ()=>{
    if(!w || (!w.wykluczone.length && !w.rozstrzygajaca)) return "";
    return `<div class="card iuzas">
      <h4>${t("Na czym to stoi","What this rests on")}</h4>
      ${w.rozstrzygajaca?`<div class="note" style="color:var(--text)">${t(`Najwięcej odrzuca cecha: <b>${opisInstancji(w.rozstrzygajaca.klucz)}</b> — sama wyklucza ${w.rozstrzygajaca.ileWyklucza} z ${w.pozostale.length + w.wykluczone.length} możliwości.`,`The feature that rejects the most: <b>${opisInstancji(w.rozstrzygajaca.klucz)}</b> — on its own it excludes ${w.rozstrzygajaca.ileWyklucza} of ${w.pozostale.length + w.wykluczone.length} possibilities.`)}</div>`:""}
      ${w.wykluczone.length?`<ol class="iwykl">${w.wykluczone.map(k=>`<li><span class="iwykl__k">${nazwaKandydatury(k)}</span>
          <span class="iwykl__d">${t("odrzucona przez:","rejected by:")} ${opisInstancji(k.wykluczoneCzym.klucz)}</span></li>`).join("")}</ol>`:""}
      ${w.brakujace.length?`<div class="note">${t(`Cechy rozstrzygające, których jeszcze nie opisano: ${w.brakujace.map(opisInstancji).join(" · ")}.`,`Decisive features not described yet: ${w.brakujace.map(opisInstancji).join(" · ")}.`)}</div>`:""}
    </div>`;
  };

  /* Karta mechanizmu: wyprowadzenie ALBO ręczne nadpisanie, zawsze z jawnym ŹRÓDŁEM. Trzy stany
     muszą być rozróżnialne, bo `state.variant` steruje animacją, chipami cech, klasyfikacją
     Bárány i doborem manewru — a przy braku danych trzyma po prostu ostatnią wartość i wtedy
     jest HIPOTEZĄ MODELU, nie wnioskiem z obserwacji. */
  const kartaMechanizmu = ()=>{
    const opisZrodla = zrodlo==="wyprowadzony"
      ? t("wyprowadzony z opisu obserwacji","derived from the observation record")
      : zrodlo==="nadpisany"
        ? t("ustawiony ręcznie przez Ciebie","set manually by you")
        : t("HIPOTEZA MODELU — nie wynika z opisu obserwacji","THE MODEL'S HYPOTHESIS — it does not follow from the observation record");
    return `<div class="card imech">
      <h4>${t("Mechanizm użyty w dalszych krokach","Mechanism used in the following steps")}</h4>
      <div class="imech__w"><b>${NAZWA_MECH(state.variant)}</b> <span class="imech__z imech__z--${zrodlo||"brak"}">${opisZrodla}</span></div>
      ${mozliweWyprowadzenie && zrodlo!=="wyprowadzony"
        ? `<button class="recoprimary" onclick="przyjmijMechanizm()">${t(`Przyjmij mechanizm wynikający z opisu: ${NAZWA_MECH(w.mechanizm)}`,`Accept the mechanism that follows from the description: ${NAZWA_MECH(w.mechanizm)}`)}</button>`
        : `<div class="note">${mozliweWyprowadzenie
            ? t("Mechanizm jest zgodny z opisem obserwacji.","The mechanism agrees with the observation record.")
            : t("Z tego opisu nie da się wyprowadzić mechanizmu — możesz go ustawić ręcznie, ale wtedy pochodzi od Ciebie, nie z obserwacji.","The mechanism cannot be derived from this description — you may set it manually, but then it comes from you, not from the observation.")}</div>`}
      <div class="imech__r">
        ${["canalo","cupulo"].map(v=>`<button class="recoalt" aria-pressed="${state.variant===v}" onclick="nadpiszMechanizm('${v}')">${NAZWA_MECH(v)}</button>`).join("")}
      </div>
      ${zrodlo==="nadpisany" && mozliweWyprowadzenie && state.variant!==w.mechanizm
        ? `<button class="recoalt" onclick="wrocDoWyprowadzonego()">${t("Wróć do mechanizmu wynikającego z opisu","Return to the mechanism that follows from the description")}</button>`:""}
    </div>`;
  };

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="wrocDoProby()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Interpretacja","Interpretation")}</b><span>${D.name}</span></div></div>
    <div class="card iintro"><div class="instr">${t("Aplikacja porównuje Twój opis z tym, co model potrafi przewidzieć, i ODRZUCA możliwości, które opisowi przeczą. Nie liczy prawdopodobieństw i nie stawia rozpoznania.","The app compares your description with what the model can predict and REJECTS the possibilities that contradict it. It does not compute probabilities and does not make a diagnosis.")}</div></div>
    <div class="pagegrid"><div class="col col--ctl">
      ${kartaWyniku()}
      ${kartaMechanizmu()}
    </div><div class="col col--viz">
      ${niet.nietypowy ? kartaNietypowa(niet) : ""}
      ${kartaUzasadnienia()}
    </div></div>
    <p class="footnote">${t("Wynik interpretacji nie jest rozpoznaniem. Model jest uproszczeniem — rozstrzyga kontekst kliniczny.","An interpretation result is not a diagnosis. The model is a simplification — the clinical context decides.")}</p>`;
}

/* ============ Krok „Kontrola" po manewrze (Blok 11) ============
   Dokument: „Zamknięcie procesu klinicznego i obsługa wyników innych niż natychmiastowe ustąpienie
   BPPV". Trzy kryteria odbioru i wszystkie trzy są zdaniami o TYM ekranie:
     1. aplikacja NIE wraca automatycznie do początku — koniec manewru prowadzi TUTAJ, a nie na
        ekran doboru (zmierzone przed zmianą: `zakonczSerie` wołało `backToSetup`, czyli seria
        kończyła się dokładnie tam, gdzie się zaczęła, bez śladu po tym, co się wydarzyło);
     2. konwersja kanałowa prowadzi do ponownej interpretacji — przycisku „powtórz ten sam manewr"
        po prostu NIE MA (model zwraca go jako zakazany, z powodem);
     3. sesję da się zakończyć bez danych identyfikacyjnych — na tym ekranie nie ma ANI JEDNEGO
        pola tekstowego, więc wpisanie nazwiska jest strukturalnie niemożliwe (ta sama zasada,
        co w karcie obserwacji i w torze VOG).

   Wartość odpowiedzi jest OBSERWACJĄ KLINICYSTY. Ekran nie ocenia, czy repozycja się udała —
   pokazuje, co z odpowiedzi wynika i czego aplikacja o niej nie wie. */
function fuWartoscOpisu(rek, klucz){
  const v = wartoscInstancji(rek, klucz, { ufajNiewiarygodnym:true });
  if(v==null) return null;
  const [pole] = String(klucz).split("#");
  const def = OBS_POLA[pole];
  if(!def) return String(v);
  const w = (def.wartosci||[]).find(x=>x.id===v);
  return w ? t(w.pl, w.en) : String(v);
}
/* PORÓWNANIE PRZED I PO (dokument, kolumna „Komputer”). „Przed” to KOPIA rekordu zdjęta w chwili
   oznaczenia manewru jako wykonanego (flow-state.markConsumed) — bez niej porównanie znikałoby
   dokładnie wtedy, gdy powstaje jego druga strona: rekordy obserwacji są kluczowane PRÓBĄ, więc
   opisanie próby kontrolnej nadpisuje opis sprzed manewru. */
function fuPorownanie(m){
  if(!m || m.opisPrzed === undefined) return "";
  const proba = m.opisPrzedProba || null;
  const przed = m.opisPrzed;
  const po = proba ? ((state.obs||{})[proba] || null) : null;
  const zmienione = JSON.stringify(przed) !== JSON.stringify(po);
  if(!przed && !po) return `<div class="card fuporown"><h4>${t("Przed i po","Before and after")}</h4>
    <div class="note">${t("Przed manewrem nie opisano oczopląsu w kroku „Oczopląs”, więc nie ma czego porównywać. Sam wynik kontroli zostaje w historii serii.","No nystagmus was described in the “Nystagmus” step before the maneuver, so there is nothing to compare. The control result alone stays in the series history.")}</div></div>`;
  const inst = instancjeStosowalne(proba, wartoscInstancji(przed || po, "wystapil", { ufajNiewiarygodnym:true }));
  const wiersze = inst.map(i=>{
    const a = przed ? fuWartoscOpisu(przed, i.klucz) : null;
    const b = po ? fuWartoscOpisu(po, i.klucz) : null;
    if(a==null && b==null) return "";
    return `<tr><th scope="row">${opisInstancji(i.klucz)}</th><td>${a==null?"—":a}</td><td>${b==null?"—":b}</td></tr>`;
  }).filter(Boolean).join("");
  return `<div class="card fuporown"><h4>${t("Przed i po","Before and after")}</h4>
    ${wiersze?`<table class="futab"><thead><tr><th scope="col">${t("cecha","feature")}</th><th scope="col">${t("przed manewrem","before")}</th><th scope="col">${t("po manewrze","after")}</th></tr></thead><tbody>${wiersze}</tbody></table>`:""}
    <div class="note">${zmienione
      ? t("Kolumna „po manewrze” pochodzi z opisu próby kontrolnej, który wprowadziłeś w kroku „Oczopląs”.","The “after” column comes from the control-test description you entered in the “Nystagmus” step.")
      : t("Próby kontrolnej nie opisano jeszcze cecha po cesze — kolumna „po manewrze” wypełni się, gdy opiszesz ją w kroku „Oczopląs”. Sama odpowiedź z tej karty jej nie zastępuje.","The control test has not been described feature by feature yet — the “after” column fills in once you describe it in the “Nystagmus” step. The answer on this card does not replace it.")}</div>
  </div>`;
}
function renderFollowup(){
  const D = followupDeps();
  const m = (state.flow && state.flow.maneuver) || null;
  const mozliwa = kontrolaMozliwa(state);
  const str = streszczenieKontroli(state);
  const wybrany = str.wynik;
  const kroki = wybrany ? nastepneKroki(wybrany, state, D) : null;
  const sprzecz = wybrany ? spojnoscWyniku(wybrany, state, D) : [];
  const wynikDef = wybrany ? wynikKontroli(wybrany) : null;
  const kanal = m && m.key ? CANAL_OF[m.key] : null;
  const podpis = m && m.key
    ? `${MANEUVERS[m.key].label} · ${CANALS[kanal].label} · ${t("ucho","ear")} ${sideN(m.planSide||state.side,"mianN")}`
    : t("brak manewru","no maneuver");

  // Kanał, do którego złóg mógł przejść, znamy tylko wtedy, gdy ktoś go wskazał; ekran o tym mówi.
  const alternatywy = kanal ? (CANALS[kanal].maneuvers||[]).filter(k=>k!==(m&&m.key)) : [];

  const kartaPytania = ()=>{
    if(!mozliwa.mozliwa) return `<div class="card fubrak"><h4>${t("Nie ma czego kontrolować","Nothing to control yet")}</h4>
      <div class="note">${t(mozliwa.pl, mozliwa.en)}</div>
      <button class="recoprimary" onclick="wrocDoManewru()">${m&&m.key?t("Wróć do manewru","Back to the maneuver"):t("Wybierz manewr","Choose a maneuver")}</button></div>`;
    return `<div class="card fupyt"><h4>${t("Co obserwujesz teraz?","What do you observe now?")}</h4>
      <div class="note">${t("Odpowiedź opisuje TWOJĄ obserwację po repozycji. Aplikacja nie ocenia skuteczności manewru — wyprowadza z odpowiedzi następny krok.","The answer describes YOUR observation after repositioning. The app does not judge the maneuver's effectiveness — it derives the next step from the answer.")}</div>
      <ul class="fuopcje">${WYNIKI.map(w=>`<li><button type="button" class="fuopcja" aria-pressed="${wybrany===w.id}" onclick="ustawWynikKontroli('${w.id}')">
        <span class="fuopcja__n">${t(w.pl, w.en)}</span>
        <span class="fuopcja__o">${t(w.pytaniePl, w.pytanieEn)}</span></button></li>`).join("")}</ul>
      ${wybrany==="niewiarygodne" ? `<div class="fupowod"><span class="eyebrow">${t("Dlaczego nie da się ocenić","Why it cannot be assessed")}</span>
        ${POWODY_NIEWIARYGODNOSCI.map(p=>`<button type="button" class="fupowod__b" aria-pressed="${state.kontrolaPowod===p.id}" onclick="ustawPowodKontroli('${p.id}')">${t(p.pl, p.en)}</button>`).join("")}</div>`:""}
      ${state.kontrolaBlad?`<div class="fublad" role="status">${t("Zapisu nie wykonano:","The record was not written:")} ${state.kontrolaBlad}</div>`:""}
    </div>`;
  };

  /* TOLERANCJA MANEWRU (Blok 15). Osobna karta, bo to osobne pytanie: „co widzisz teraz" dotyczy
     oczopląsu, a to — pacjenta. Stoi PRZED kartą „Co dalej", bo klinicysta widzi reakcję zaraz po
     manewrze, a wynik kontroli dopiero po ponownej próbie. Brak odpowiedzi zostaje BRAKIEM:
     opis badania napisze „nie odnotowano", a nie „zniósł dobrze". */
  const kartaTolerancji = ()=>{
    if(!mozliwa.mozliwa) return "";
    const idx = m ? m.kontrolaIdx : null;
    const biezacy = idx!=null && (state.kontrole||[])[idx] ? state.kontrole[idx] : null;
    const wybrana = biezacy ? biezacy.tolerancja : null;
    return `<div class="card futol" data-futol><h4>${t("Jak pacjent zniósł manewr?","How did the patient tolerate the maneuver?")}</h4>
      <div class="note">${t("Odpowiedź dotyczy TEGO manewru, nie całej sesji — w serii powtórzeń tolerancja bywa różna. Pytanie jest nieobowiązkowe; bez odpowiedzi opis badania napisze „nie odnotowano”.","The answer concerns THIS maneuver, not the whole session — in a series of repetitions tolerance can differ. The question is optional; without an answer the report will say “not recorded”.")}</div>
      <div class="futol__l">${TOLERANCJE.map(x=>`<button type="button" class="futol__b" aria-pressed="${wybrana===x.id}" onclick="ustawTolerancjeKontroli('${x.id}')">${t(x.pl, x.en)}</button>`).join("")}</div>
    </div>`;
  };

  const kartaDalej = ()=>{
    if(!wybrany || !kroki) return "";
    const przycisk = (a, klasa)=>`<button class="${klasa}" onclick="kontrolaAkcja('${a}')">${t(AKCJE[a].pl, AKCJE[a].en)}</button>`;
    // „Obserwacja” nie jest nawigacją — to zdanie kliniczne. Przycisk, który niczego nie otwiera,
    // uczy, że przyciski tej aplikacji bywają puste.
    /* ZAKOŃCZENIE SESJI NIE JEST TU PRZYCISKIEM, choć bywa krokiem głównym (po ustąpieniu).
       Ma własną, ZAWSZE OBECNĄ kartę niżej, więc dublowanie go tutaj dawało dwa identycznie
       podpisane przyciski obok siebie — zmierzone na gotowym ekranie przy wyniku „ustąpienie".
       Zamiast tego karta końcowa dostaje akcent głównego kroku. */
    const glowny = kroki.glowny==="obserwuj"
      ? `<div class="fuinfo">${t(AKCJE.obserwuj.pl, AKCJE.obserwuj.en)}</div>`
      : kroki.glowny==="zakonczSesje" ? ""
      : przycisk(kroki.glowny, "recoprimary");
    const dalsze = kroki.dalsze.filter(a=>a!=="obserwuj" && a!=="alternatywnyManewr" && a!=="zakonczSesje").map(a=>przycisk(a, "recoalt")).join("");
    const alty = kroki.dalsze.includes("alternatywnyManewr") && alternatywy.length
      ? `<div class="fualt"><span class="eyebrow">${t("Alternatywny manewr tego kanału","Alternative maneuver for this canal")}</span>
          ${alternatywy.map(k=>`<button class="recoalt" onclick="kontrolaAlternatywa('${k}')">${MANEUVERS[k].label}</button>`).join("")}</div>`
      : "";
    return `<div class="card fudalej"><h4>${t("Co dalej","What next")}</h4>
      <div class="note fuuwaga">${t(wynikDef.uwagaPl, wynikDef.uwagaEn)}</div>
      ${sprzecz.length?`<ul class="fusprzecz">${sprzecz.map(s=>`<li>${t(s.pl, s.en)}</li>`).join("")}</ul>`:""}
      ${glowny}
      ${dalsze}
      ${alty}
      ${kroki.zakaz.length?`<div class="fuzakaz"><span class="eyebrow">${t("Czego ten ekran celowo nie proponuje","What this screen deliberately does not offer")}</span>
        <ul>${kroki.zakaz.map(z=>`<li><b>${t(AKCJE[z.akcja].pl, AKCJE[z.akcja].en)}</b> — ${t(z.pl, z.en)}</li>`).join("")}</ul></div>`:""}
    </div>`;
  };

  /* ZAKOŃCZENIE SESJI STOI POZA KARTĄ WYNIKU i to jest kryterium odbioru nr 3, a nie układ.
     Pierwsza wersja miała ten przycisk wewnątrz karty „Co dalej", która renderuje się dopiero po
     wybraniu odpowiedzi — czyli sesji NIE DAŁO SIĘ zakończyć, dopóki użytkownik czegoś nie
     zaznaczył. Warunek wstępny do wyjścia z badania jest dokładnie tym, czego to kryterium
     zabrania, choć dotyczy odpowiedzi, a nie danych pacjenta. */
  const kartaKoniec = ()=> state.zakonczeniePyta ? "" : `<div class="card fukoniecbox">
      <button class="${kroki && kroki.glowny==="zakonczSesje" ? "recoprimary" : "recoalt"} fukoniec" onclick="pytajOZakonczeniu(true)">${t(AKCJE.zakonczSesje.pl, AKCJE.zakonczSesje.en)}</button>
      <div class="note">${t("Zakończenie nie wymaga wypełnienia czegokolwiek. Aplikacja nigdzie nie pyta o dane pacjenta.","Ending requires nothing to be filled in. The app never asks for patient data.")}</div>
    </div>`;

  /* HISTORIA SERII (dokument: „Historia pozycji i czasu pozostaje dostępna”). Czasy są PLANOWE
     i karta mówi to wprost — aplikacja mierzy czas jednego etapu naraz i nie sumuje go przez
     manewr, więc nazwanie tego „czasem wykonania” byłoby fikcją. */
  const kartaSerii = ()=>{
    const lista = (state.kontrole||[]).filter(k=>k && k.wynik);
    if(!lista.length) return "";
    return `<div class="card fuseria"><h4>${t("Przebieg serii","Series so far")}</h4>
      <ol class="fuseria__l">${lista.map((k,i)=>{
        const w = wynikKontroli(k.wynik);
        const czasy = (k.czasy||[]).filter(x=>x!=null);
        return `<li><b>${MANEUVERS[k.manewr]?MANEUVERS[k.manewr].label:k.manewr}</b> · ${t("ucho","ear")} ${sideN(k.strona,"mianN")}
          <span class="fuseria__w">${w?t(w.pl,w.en):k.wynik}</span>
          ${k.powod?`<span class="fuseria__p">${(()=>{const p=POWODY_NIEWIARYGODNOSCI.find(x=>x.id===k.powod); return p?t(p.pl,p.en):k.powod;})()}</span>`:""}
          ${czasy.length?`<span class="fuseria__c">${t("czasy z planu","times from the plan")}: ${czasy.map(s=>fmtClock(s)).join(" · ")}${k.czasySkad==="planPodniesiony"?` (${t("podniesione trybem „do ustąpienia oczopląsu”","raised by the “until nystagmus subsides” mode")})`:""}</span>`:""}
        </li>`;
      }).join("")}</ol>
      <div class="note">${t("Czasy pochodzą z PLANU manewru (protokolarne albo ustawione przez Ciebie), a nie z pomiaru u pacjenta — aplikacja odlicza jeden etap naraz i nie sumuje ich przez cały manewr.","The times come from the maneuver PLAN (protocol or set by you), not from measuring the patient — the app counts one stage at a time and does not sum them across the maneuver.")}</div>
    </div>`;
  };

  const kartaZakonczenia = ()=>{
    if(!state.zakonczeniePyta) return "";
    const p = podsumowanieSesji(state, D);
    const poz = [];
    poz.push([t("Kwalifikacja wstępna","Initial triage"), p.kwalifikacja?`${p.kwalifikacja.kategoria}${p.kwalifikacja.czerwona?` — ${t("czerwona flaga","red flag")}`:""}`:t("nie wypełniona","not completed")]);
    poz.push([t("Próba","Test"), p.proba?DIAG[p.proba].name:t("nie wybrano","not chosen")]);
    poz.push([t("Opisane próby","Described tests"), p.opisaneProby.length?p.opisaneProby.map(k=>DIAG[k].name).join(" · "):t("żadna","none")]);
    poz.push([t("Kanał i strona","Canal and side"), p.kanal?`${CANALS[p.kanal].label} · ${t("ucho","ear")} ${sideN(p.strona,"mianN")}`:t("nie ustalono","not established")]);
    poz.push([t("Manewry i kontrole","Maneuvers and controls"), p.kontrole.length
      ? p.kontrole.map(k=>`${MANEUVERS[k.manewr]?MANEUVERS[k.manewr].label:k.manewr} → ${(()=>{const w=wynikKontroli(k.wynik); return w?t(w.pl,w.en):k.wynik;})()}`).join(" · ")
      : t("brak zapisanej kontroli","no control recorded")]);
    return `<div class="card fukonczenie"><h4>${t("Zakończyć sesję?","End the session?")}</h4>
      <dl class="fupods">${poz.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>
      ${p.manewrBezKontroli?`<div class="note">${t("Ostatni manewr nie ma zapisanej kontroli — w podsumowaniu zostanie luka.","The last maneuver has no recorded control — the summary will have a gap.")}</div>`:""}
      ${/* ZDANIE POPRAWIONE W BLOKU 15. Do tego bloku brzmiało „aplikacja nie zapisuje go na
            urządzeniu" — i było prawdą, bo nie było czym zapisać. Od Bloku 15 zapis istnieje,
            więc zdanie stałoby się nieprawdziwe dokładnie w miejscu, w którym użytkownik pyta
            o prywatność. Zapis jest DOBROWOLNY i lokalny, i tak to teraz brzmi. */""}
      <div class="note">${t("Aplikacja nie wysyła niczego poza urządzenie. Przypadek zostaje w pamięci przeglądarki TYLKO wtedy, gdy sam zapiszesz sesję; bez tego zakończenie kasuje dane przypadku i zostawia ustawienia narzędzia. Nigdzie nie pytamy o dane pacjenta i nie ma gdzie ich wpisać.","The app sends nothing off the device. The case stays in the browser's storage ONLY if you save the session yourself; otherwise ending clears the case data and keeps the tool's settings. We never ask for patient data and there is nowhere to enter it.")}</div>
      <div class="fukonczenie__r">
        <button class="recoalt" onclick="goOpis()">${t("Opis badania i zapis","Report and save")}</button>
        <button class="recoprimary" onclick="zakonczSesje()">${t("Zakończ i wyczyść","End and clear")}</button>
        <button class="recoalt" onclick="pytajOZakonczeniu(false)">${t("Wróć","Back")}</button>
      </div>
    </div>`;
  };

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="wrocDoManewru()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Kontrola po manewrze","Post-maneuver control")}</b><span>${podpis}</span></div></div>
    <div class="pagegrid"><div class="col col--ctl">
      ${kartaPytania()}
      ${kartaTolerancji()}
      ${kartaDalej()}
      ${kartaZakonczenia()}
      ${kartaKoniec()}
    </div><div class="col col--viz">
      ${fuPorownanie(m)}
      ${kartaSerii()}
      ${kartaOpisu()}
    </div></div>
    <p class="footnote">${t("Wynik kontroli nie jest rozpoznaniem ani oceną skuteczności leczenia. Narzędzie jest edukacyjne — rozstrzyga badanie kliniczne.","A control result is neither a diagnosis nor an assessment of treatment efficacy. This is an educational tool — the clinical examination decides.")}</p>`;
}

/* ============ GENERATOR OPISU BADANIA I ZAPIS SESJI (Blok 15) ============
   Dokument, komputer: „Podgląd opisu i formularz znajdują się obok siebie. Możliwa edycja tekstu
   przed skopiowaniem". Telefon: „Podgląd jako osobny ekran z dużym przyciskiem »Kopiuj«. Sekcje
   opisu można włączać i wyłączać przełącznikami".

   CAŁA treść opisu pochodzi z opis-model.js. Ten ekran nie skleja ANI JEDNEGO zdania klinicznego
   — gdyby sklejał, opis w podglądzie mógłby się różnić od skopiowanego, a to jest dokładnie ten
   błąd, którego w dokumentacji medycznej nikt nie zauważy. */
/* Ucieczka HTML. Potrzebna PIERWSZY RAZ w tej aplikacji dopiero tutaj, bo dopiero tutaj do
   dokumentu trafia napis, którego nie napisał programista: tekst opisu po ręcznej edycji. */
const esc = (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const oDeps = () => opisDeps(state);
function raportBiezacy(){ return raport(state, oDeps()); }
export function tekstOpisu(){
  return tekst(raportBiezacy(), { wlaczone: state.opisSekcje || domyslneSekcje() });
}
// Tekst DO SKOPIOWANIA: wersja użytkownika, jeśli edytował; inaczej wyliczona. Jedno miejsce,
// żeby podgląd i schowek nie mogły się rozjechać.
export function tekstOpisuDoKopiowania(){ return state.opisEdycja != null ? state.opisEdycja : tekstOpisu(); }

function kartaOpisu(){
  const r = raportBiezacy();
  return `<div class="card opiskarta" data-opiskarta><h4>${t("Opis badania","Examination report")}</h4>
    <div class="note">${t("Opis powstaje z tego, co zapisano w krokach — nie jest osobnym dokumentem i nie da się w nim niczego dopisać na stałe.","The report is built from what the steps recorded — it is not a separate document and nothing can be permanently added to it.")}</div>
    <div class="opiskarta__n">${t("Sekcje z treścią","Sections with content")}: <b>${r.zNoweTresci}</b> / ${r.sekcje.length}</div>
    <button class="recoprimary" onclick="goOpis()">${t("Otwórz opis badania","Open the report")}</button>
  </div>`;
}

function renderOpis(){
  const r = raportBiezacy();
  const wl = state.opisSekcje || domyslneSekcje();
  const edytuje = state.opisEdycja != null;
  const podglad = tekstOpisuDoKopiowania();
  const sesje = Array.isArray(state.opisSesje) ? state.opisSesje : [];

  const kartaPrzelacznikow = ()=>`<div class="card opissek"><h4>${t("Sekcje opisu","Report sections")}</h4>
    <div class="note">${t("Wyłączona sekcja znika z tekstu w całości. Zastrzeżenia o charakterze narzędzia wyłączyć się nie da.","A disabled section disappears from the text entirely. The disclaimer about the tool's nature cannot be disabled.")}</div>
    <ul class="opissek__l">${r.sekcje.map(sek=>{
      const zawartosc = sek.wiersze.filter(w=>w.wartosc!=null).length;
      const on = sek.obowiazkowa || wl.includes(sek.id);
      return `<li><button type="button" class="opissek__b" role="switch" aria-checked="${on}" ${sek.obowiazkowa?'disabled':''}
        onclick="przelaczSekcjeOpisu('${sek.id}')" data-osek="${sek.id}">
        <span class="opissek__n">${t(sek.tytul.pl, sek.tytul.en)}</span>
        <span class="opissek__c">${sek.obowiazkowa?t("zawsze","always"):`${zawartosc}/${sek.wiersze.length}`}</span></button></li>`;
    }).join("")}</ul></div>`;

  const kartaDzialan = ()=>`<div class="card opisakcje"><h4>${t("Co dalej z opisem","What to do with the report")}</h4>
    <button class="cta opisakcje__kop" onclick="kopiujOpis()">${t("Kopiuj opis","Copy the report")}</button>
    <div class="opisakcje__r">
      <button class="recoalt" onclick="eksportujOpis()">${t("Eksportuj zapis ustrukturyzowany","Export a structured record")}</button>
      <button class="recoalt" onclick="zapiszSesjeOpisu()">${t("Zapisz sesję na tym urządzeniu","Save the session on this device")}</button>
    </div>
    ${state.opisKomunikat?`<div class="opiskom" role="status" data-okom>${t(KOMUNIKATY_OPISU[state.opisKomunikat].pl, KOMUNIKATY_OPISU[state.opisKomunikat].en)}</div>`:""}
    ${state.opisBlad?`<div class="opisblad" role="status" data-oblad>${(()=>{const b=POWODY_ZAPISU_SESJI[state.opisBlad]||BLEDY_OPISU[state.opisBlad]; return b?t(b.pl,b.en):state.opisBlad;})()}</div>`:""}
    <div class="note">${t("Kopiowanie i eksport to JAWNE gesty — dopóki ich nie wykonasz, opis nie opuszcza tej karty przeglądarki. Aplikacja nie wysyła niczego do sieci.","Copying and exporting are EXPLICIT gestures — until you make one, the report does not leave this browser tab. The app sends nothing over the network.")}</div>
  </div>`;

  /* PODGLĄD I EDYCJA. Pole tekstowe jest pierwszym i jedynym w całej aplikacji — dlatego ekran
     mówi WPROST, zanim ktoś zacznie pisać, że tekst nie jest zapisywany. */
  const kartaPodgladu = ()=>`<div class="card opispodglad"><h4>${t("Podgląd opisu","Report preview")}</h4>
    ${edytuje
      ? `<textarea class="opispodglad__e" data-oedycja rows="18" spellcheck="false"
           oninput="ustawEdycjeOpisu(this.value)">${esc(podglad)}</textarea>
         <div class="opisostrz" data-oostrz>${t("Tekst zmieniony ręcznie NIE jest nigdzie zapisywany: nie wchodzi do zapisanej sesji ani do eksportu i zniknie po wyjściu z tego ekranu. Nie wpisuj danych identyfikujących pacjenta.","Manually edited text is NOT stored anywhere: it does not go into the saved session or the export, and it disappears when you leave this screen. Do not type patient-identifying data.")}</div>
         <button class="recoalt" onclick="wrocDoWyliczonego()">${t("Wróć do wyliczonego opisu","Back to the generated report")}</button>`
      : `<pre class="opispodglad__t" data-opodglad>${esc(podglad)}</pre>
         <button class="recoalt" onclick="edytujOpis()">${t("Edytuj tekst przed skopiowaniem","Edit the text before copying")}</button>`}
  </div>`;

  const kartaSesji = ()=>`<div class="card opissesje"><h4>${t("Zapisane sesje","Saved sessions")}</h4>
    <div class="note">${t("Zapis leży w pamięci tej przeglądarki i niesie WYŁĄCZNIE identyfikatory ze słowników aplikacji — nie ma w nim miejsca na dane pacjenta. Wszystkie zapisy skasujesz w ustawieniach.","The record lives in this browser's storage and carries ONLY identifiers from the app dictionaries — there is no place in it for patient data. You can delete all records in the settings.")}</div>
    ${sesje.length
      ? `<ul class="opissesje__l">${sesje.slice().reverse().map(rek=>{
          const p = podpisSesji(rek, oDeps());
          const napisy = (p||[]).map(x=> typeof x === 'string' ? x : t(x.pl, x.en));
          return `<li data-osesja="${rek.id}"><span class="opissesje__p">${napisy.length?esc(napisy.join(" · ")):t("przypadek bez ustaleń","case with no findings")}</span>
            <span class="opissesje__r">
              <button type="button" class="recoalt" onclick="przywrocSesjeOpisu('${rek.id}')">${t("Odtwórz","Restore")}</button>
              <button type="button" class="recoalt" onclick="usunSesjeOpisu('${rek.id}')">${t("Usuń","Delete")}</button>
            </span></li>`;
        }).join("")}</ul>`
      : `<div class="opissesje__brak">${t("Nie ma jeszcze żadnego zapisu.","There are no saved records yet.")}</div>`}
  </div>`;

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="goKontrola()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Opis badania i zapis sesji","Report and session record")}</b><span>${t("wyliczany na bieżąco ze stanu kroków","computed live from the state of the steps")}</span></div></div>
    <div class="pagegrid"><div class="col col--ctl">
      ${kartaPrzelacznikow()}
      ${kartaDzialan()}
      ${kartaSesji()}
    </div><div class="col col--viz">
      ${kartaPodgladu()}
    </div></div>
    <p class="footnote">${t("Opis jest zapisem tego, co wprowadzono w aplikacji, a nie rozpoznaniem. Narzędzie jest edukacyjne — rozstrzyga badanie kliniczne.","The report is a record of what was entered in the app, not a diagnosis. This is an educational tool — the clinical examination decides.")}</p>`;
}

/* ============ HINTS/HINTS+ Z KWALIFIKACJĄ (Blok 12) — trzy ekrany ============
   Dokument: „Ekran kwalifikacyjny poprzedza badanie”; telefon — „badanie prowadzone krok po kroku,
   każdy krok ma duże wybory, podsumowanie jest ODDZIELNYM ekranem, aby nie mieszać go z wykonywaniem
   testu”; komputer — „wyniki wszystkich składowych w tabeli z dynamicznym podsumowaniem, materiały
   dydaktyczne w bocznym panelu”.

   Cała wiedza kliniczna siedzi w src/app/hints-model.js. Te funkcje NIE decydują o niczym: nie
   liczą wniosku, nie wiedzą, co jest cechą alarmową, i nie mają własnego warunku wejścia. To nie
   jest czystość dla czystości — jedyny sposób, żeby wyrocznia mogła sprawdzić kryterium odbioru
   nr 2 na 14 400 kombinacjach, to trzymanie reguły poza ekranem. */
const hDeps = () => hintsDeps();

// Jedna odpowiedź = jeden duży przycisk. „Nie można ocenić" dostaje WŁASNĄ klasę, bo ma wyglądać
// inaczej niż odpowiedź — kryterium odbioru nr 2 zaczyna się na poziomie wyglądu.
function hxOpcjaHTML(el, o, wybrana){
  const nieoceniona = o.v === 'nieocenione';
  return `<button type="button" class="hxopcja${nieoceniona?' hxopcja--nieocen':''}" aria-pressed="${wybrana}"
      onclick="ustawSkladowaHints('${el.id}','${o.v}')">
      <span class="hxopcja__box" aria-hidden="true"></span>
      <span class="hxopcja__txt">${t(o.pl,o.en)}</span></button>`;
}
function hxKartaElementu(el, odp){
  const wybrana = odp[el.id] || null;
  const powodNiewiar = el.id === 'wiarygodnosc' && wybrana === 'niewiarygodne'
    ? `<div class="hxpowod"><span class="eyebrow">${t("Powód","Reason")}</span>
        ${Object.entries(POWODY_NIEWIARYGODNOSCI_HINTS).map(([id,p])=>
          `<button type="button" class="hxpowod__b" aria-pressed="${state.hintsPowodNiewiar===id}" onclick="ustawPowodNiewiarHints('${id}')">${t(p.pl,p.en)}</button>`).join("")}</div>`
    : "";
  return `<section class="card hxkarta" data-hxel="${el.id}">
      <h3 class="hxkarta__q">${t(el.pl,el.en)}</h3>
      <p class="hxkarta__instr">${t(el.instrukcjaPl,el.instrukcjaEn)}</p>
      <div class="hxopcje">${el.opcje.map(o=>hxOpcjaHTML(el,o,wybrana===o.v)).join("")}</div>
      ${powodNiewiar}
      <div class="hxznacz"><span class="eyebrow">${t("Co to znaczy","What it means")}</span>
        <p>${t(el.znaczeniePl,el.znaczenieEn)}</p></div>
      <details class="hxpul"><summary>${t("Czego ten element NIE mówi","What this element does NOT tell you")}</summary>
        <p>${t(el.pulapkaPl,el.pulapkaEn)}</p></details>
    </section>`;
}
// Tabela wszystkich składowych + dynamiczne podsumowanie (układ „komputer" z dokumentu).
function hxTabelaHTML(odp, p){
  const wiersz = (el)=>{
    const v = odp[el.id];
    const w = v ? wagaOdpowiedzi(el.id, odp).waga : null;
    const kl = w==='alarm'?'hxw--alarm' : w==='obwod'?'hxw--obwod' : w==='nieoceniony'?'hxw--nieocen' : 'hxw--inne';
    const opis = v ? t(opcjaHints(el.id,v).pl, opcjaHints(el.id,v).en) : t("nie zaznaczono","not marked");
    const rola = !v ? t("brak odpowiedzi","no answer")
      : w==='alarm' ? t("cecha alarmowa","alarm feature")
      : w==='obwod' ? t("wspiera obwód","supports peripheral")
      : w==='nieoceniony' ? t("nie oceniono","not assessed")
      : w==='nieinformatywny' ? t("nic nie rozstrzyga","settles nothing")
      : t("odnotowane","recorded");
    return `<tr class="${kl}"><th scope="row">${t(el.pl,el.en)}${el.trzon?' <span class="hxtrzon">HINTS</span>':''}</th>
        <td>${opis}</td><td class="hxrola">${rola}</td></tr>`;
  };
  return `<section class="card hxtab-wrap">
      <h4>${t("Składowe badania","Examination components")}</h4>
      <table class="hxtab"><thead><tr><th>${t("Składowa","Component")}</th><th>${t("Zaznaczono","Marked")}</th><th>${t("Rola","Role")}</th></tr></thead>
        <tbody>${ELEMENTY.map(wiersz).join("")}</tbody></table>
      <div class="hxdyn hxdyn--${p.wniosek}"><b>${t(p.pl,p.en)}</b>
        <span>${t(`Zaznaczono ${p.postep.zrobione} z ${p.postep.wszystkich} składowych.`,
                  `${p.postep.zrobione} of ${p.postep.wszystkich} components marked.`)}</span></div>
    </section>`;
}

function renderHintsKwal(){
  const odp = state.triage||{};
  const pytania = activeQuestions(odp);
  const nastepne = nextQuestionId(odp);
  const k = kwalifikacjaHints(state, hDeps());
  const przesz = state.hintsPrzeszkolenie;

  const kartaPrzeszkolenia = `<section class="card hqprzesz">
      <h3 class="tq__q">${t("Czy masz przeszkolenie w wykonywaniu HINTS?","Are you trained in performing HINTS?")}</h3>
      <p class="tq__hint">${t("wytyczne GRACE-3: HINTS wykonany bez przeszkolenia bywa mylący, a wynik pozornie uspokajający jest wtedy groźniejszy niż brak badania",
                             "the GRACE-3 guideline: HINTS performed without training can mislead, and an apparently reassuring result is then more dangerous than not testing at all")}</p>
      <div class="tq__opts">${Object.entries(PRZESZKOLENIE).map(([id,o])=>
        `<button type="button" class="tqopt" aria-pressed="${przesz===id}" onclick="ustawPrzeszkolenieHints('${id}')">
          <span class="tqopt__box" aria-hidden="true"></span><span class="tqopt__txt">${t(o.pl,o.en)}</span></button>`).join("")}</div>
    </section>`;

  // Świadome pominięcie. Pokazujemy je WTEDY, gdy jest po co: przy niepotwierdzonym obrazie.
  // Przy obrazie potwierdzonym pominięcie niczego nie otwiera, więc byłoby tylko szumem.
  const kartaPominiecia = (k.status==='brak' || k.status==='odradzana')
    ? `<section class="card hqpomin">
        <h4>${t("Nie badam teraz pacjenta","I am not examining a patient now")}</h4>
        <p class="note">${t("Możesz wejść do modułu bez kwalifikacji, ale nie po cichu: wybierz powód, a wynik będzie go niósł do końca sesji.",
                            "You may enter the module without the qualification, but not silently: choose a reason, and the result will carry it for the rest of the session.")}</p>
        <div class="hqpomin__l">${Object.entries(POWODY_POMINIECIA).map(([id,o])=>
          `<button type="button" class="hqpomin__b" onclick="pomijajKwalifikacje('${id}')">${t(o.pl,o.en)}</button>`).join("")}</div>
      </section>`
    : k.status==='pominieta'
      ? `<section class="card hqpomin hqpomin--aktywne">
          <h4>${t("Kwalifikacja pominięta","Qualification skipped")}</h4>
          <p>${t(POWODY_POMINIECIA[k.pominiecie].pl, POWODY_POMINIECIA[k.pominiecie].en)}</p>
          <button type="button" class="recoalt" onclick="cofnijPominiecie()">${t("Cofnij pominięcie i wypełnij kwalifikację","Undo the skip and complete the qualification")}</button>
        </section>`
      : "";

  const odmowa = state.hintsBlad
    ? `<div class="hqblad">${t("Nie wpuszczono do badania.","Entry to the examination was refused.")} ${t(STANY_KWALIFIKACJI[state.hintsBlad].opisPl, STANY_KWALIFIKACJI[state.hintsBlad].opisEn)}</div>`
    : "";

  const akcje = k.wolno
    ? `<button class="recoprimary" onclick="zacznijBadanieHints()">${t("Rozpocznij badanie HINTS","Start the HINTS examination")}</button>
       <button class="recoalt" onclick="otworzSymulatorHints()">${t("Zobacz wzorce na modelu","See the patterns on the model")}</button>
       <button class="recoalt" onclick="otworzLaboratorium()">${t("Matematyczny pacjent (Laboratorium)","Mathematical patient (Laboratory)")}</button>`
    : `<p class="note hqczekam">${t("Badanie otworzy się, gdy kwalifikacja zostanie potwierdzona albo świadomie pominięta.",
                                    "The examination will open once the qualification is confirmed or deliberately skipped.")}</p>`;

  const wynik = `<section class="card hqw hqw--${k.status}" data-hq-status="${k.status}" tabindex="-1">
      <div class="hqw__ttl">${k.czerwona?"⚠ ":""}${t(k.pl,k.en)}</div>
      <p class="hqw__tresc">${t(k.opisPl,k.opisEn)}</p>
      ${odmowa}
      <div class="hqw__akcje">${akcje}</div>
    </section>`;

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="goArea('start')" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("HINTS / HINTS+ — kwalifikacja","HINTS / HINTS+ — qualification")}</b><span>${t("ostry zespół przedsionkowy · przeszkolenie · wejście do badania","acute vestibular syndrome · training · entry to the examination")}</span></div></div>
    <div class="pagegrid hqgrid">
      <div class="col col--ctl">
        <p class="hqlead">${t("HINTS ma zastosowanie w CIĄGŁYCH zawrotach z utrzymującym się oczopląsem samoistnym. Poniższe pytania są tymi samymi, które zadaje kwalifikacja wstępna — odpowiedzi są wspólne dla całej sesji.",
                              "HINTS applies to CONTINUOUS dizziness with sustained spontaneous nystagmus. The questions below are the same ones the initial triage asks — the answers are shared across the whole session.")}</p>
        ${pytania.map(q=>triageQuestionHTML(q,odp,nastepne)).join("")}
        ${kartaPrzeszkolenia}
      </div>
      <div class="col col--viz">${wynik}${kartaPominiecia}</div>
    </div>
    <div class="disclaimer">${t('<b>Kwalifikacja wskazuje, czy HINTS jest tu właściwym badaniem</b> — nie stawia rozpoznania. Taksonomia czas-i-wyzwalacze wg wytycznych GRACE-3 (Edlow i wsp., <i>Acad Emerg Med</i> 2023).',
                              '<b>The qualification indicates whether HINTS is the right examination here</b> — it makes no diagnosis. Timing-and-triggers taxonomy per the GRACE-3 guideline (Edlow et al., <i>Acad Emerg Med</i> 2023).')}</div>`;
}

function renderHintsBad(){
  const odp = odpowiedziHints(state);
  const p = podsumowanieHints(state, hDeps());
  const biezacy = biezacyKrok();
  const el = elementHints(biezacy);
  const i = ELEMENT_IDS.indexOf(biezacy);
  const ostatni = i === ELEMENT_IDS.length-1;

  const os = ELEMENT_IDS.map((id,n)=>{
    const e = elementHints(id), zrobiony = !!odp[id];
    return `<button type="button" class="hxkrok${id===biezacy?' hxkrok--biezacy':''}${zrobiony?' hxkrok--gotowy':''}"
        aria-current="${id===biezacy}" onclick="goHintsKrok('${id}')">
        <span class="hxkrok__n">${n+1}</span><span class="hxkrok__t">${t(e.pl,e.en)}</span></button>`;
  }).join("");

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="goHintsKwal()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Badanie HINTS / HINTS+","HINTS / HINTS+ examination")}</b><span>${t(`składowa ${i+1} z ${ELEMENT_IDS.length}`,`component ${i+1} of ${ELEMENT_IDS.length}`)}</span></div></div>
    <nav class="hxos" aria-label="${t("Składowe badania","Examination components")}">${os}</nav>
    <div class="pagegrid hxgrid">
      <div class="col col--ctl">
        ${hxKartaElementu(el, odp)}
        <div class="hxnaw">
          <button class="recoalt" onclick="wsteczHints()">${i===0?t("Wróć do kwalifikacji","Back to the qualification"):t("Poprzednia składowa","Previous component")}</button>
          <button class="${odp[biezacy]?'recoprimary':'recoalt'}" onclick="dalejHints()">${ostatni?t("Pokaż wynik","Show the result"):t("Następna składowa","Next component")}</button>
        </div>
        <button class="hxwynik" onclick="pokazWynikHints()">${t("Przejdź do wyniku","Go to the result")}</button>
      </div>
      <div class="col col--viz">${hxTabelaHTML(odp, p)}</div>
    </div>
    <div class="disclaimer">${t('<b>Zapisujesz to, co widzisz u pacjenta.</b> Aplikacja nie ocenia składowych za Ciebie — wynik powstaje dopiero na osobnym ekranie i nie zastępuje decyzji klinicznej.',
                              '<b>You are recording what you see in the patient.</b> The app does not judge the components for you — the result appears only on a separate screen and does not replace clinical judgment.')}</div>`;
}

function renderHintsWyn(){
  const p = podsumowanieHints(state, hDeps());
  const odp = odpowiedziHints(state);

  // KRYTERIUM ODBIORU NR 3. Ostrzeżenie stoi NAD wnioskiem i nad wszystkim innym — nie w stopce,
  // nie w „szczegółach", nie jako kolor ramki. Model gwarantuje, że istnieje dokładnie wtedy,
  // gdy zaznaczono cechę alarmową; ekran gwarantuje, że jest pierwszą rzeczą, którą widać.
  const ostrz = p.ostrzezenie
    ? `<section class="card hwostrz" role="alert" data-hw-ostrzezenie="1">
        <div class="hwostrz__t">⚠ ${t(p.ostrzezenie.tytulPl,p.ostrzezenie.tytulEn)}</div>
        <ul class="hwostrz__l">${p.cechyAlarmowe.map(c=>`<li><b>${t(c.pl,c.en)}</b>: ${t(c.wartoscPl,c.wartoscEn)}</li>`).join("")}</ul>
        <p class="hwostrz__c">${t(p.ostrzezenie.trescPl,p.ostrzezenie.trescEn)}</p>
      </section>`
    : "";

  const lista = (tytul, poz, klasa, pusty)=> `<section class="card hwlista ${klasa}">
      <h4>${tytul} <span class="hwlista__n">${poz.length}</span></h4>
      ${poz.length
        ? `<ul>${poz.map(c=>`<li><b>${t(c.pl,c.en)}</b>: ${t(c.wartoscPl,c.wartoscEn)}${c.powodPl?` <em>— ${t(c.powodPl,c.powodEn)}</em>`:""}</li>`).join("")}</ul>`
        : `<p class="note">${pusty}</p>`}
    </section>`;

  const zastrz = p.zastrzezenia.length
    ? `<section class="card hwzastrz"><h4>${t("Zastrzeżenia do tego wyniku","Caveats on this result")}</h4>
        <ul>${p.zastrzezenia.map(z=>`<li>${t(z.pl,z.en)}</li>`).join("")}</ul></section>`
    : "";

  const powodNiew = p.powodNiewiarygodnosci
    ? `<p class="note">${t("Powód niewiarygodności","Reason for unreliability")}: ${t(POWODY_NIEWIARYGODNOSCI_HINTS[p.powodNiewiarygodnosci].pl, POWODY_NIEWIARYGODNOSCI_HINTS[p.powodNiewiarygodnosci].en)}</p>`
    : "";

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="wrocDoBadaniaHints()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Wynik badania HINTS / HINTS+","HINTS / HINTS+ result")}</b><span>${t(`zaznaczono ${p.postep.zrobione} z ${p.postep.wszystkich} składowych`,`${p.postep.zrobione} of ${p.postep.wszystkich} components marked`)}</span></div></div>
    ${ostrz}
    <section class="card hww hww--${p.wniosek}" data-hw-wniosek="${p.wniosek}">
      <div class="hww__ttl">${t(p.pl,p.en)}</div>
      <p class="hww__tresc">${t(p.opisPl,p.opisEn)}</p>
      ${powodNiew}
    </section>
    <div class="pagegrid hwgrid">
      <div class="col col--ctl">
        ${lista(t("Wspiera uszkodzenie obwodowe","Supports a peripheral lesion"), p.wspierajaObwod, "hwlista--obwod",
                t("Nic nie przemawia dziś za obwodem.","Nothing currently argues for a peripheral cause."))}
        ${lista(t("Nie oceniono","Not assessed"), p.nieocenione, "hwlista--nieocen",
                t("Wszystkie zaznaczone składowe udało się ocenić.","Every marked component could be assessed."))}
      </div>
      <div class="col col--viz">
        ${lista(t("Cechy alarmowe","Alarm features"), p.cechyAlarmowe, "hwlista--alarm",
                t("Nie zaznaczono cechy alarmowej. To NIE jest wykluczenie przyczyny ośrodkowej.","No alarm feature was marked. This is NOT an exclusion of a central cause."))}
        ${p.nieinformatywne.length
          ? lista(t("Nic nie rozstrzyga w tym kontekście","Settles nothing in this context"), p.nieinformatywne, "hwlista--nieinf", "")
          : ""}
      </div>
    </div>
    ${zastrz}
    <div class="hwnaw">
      <button class="recoprimary" onclick="wrocDoBadaniaHints()">${t("Wróć do badania","Back to the examination")}</button>
      <button class="recoalt" onclick="wyczyscBadanieHints()">${t("Wyczyść i zacznij od nowa","Clear and start again")}</button>
      <button class="recoalt" onclick="otworzSymulatorHints()">${t("Zobacz wzorce na modelu","See the patterns on the model")}</button>
    </div>
    <div class="disclaimer">${t(p.zastrzezenieKliniczne.pl, p.zastrzezenieKliniczne.en)}</div>`;
}

function renderTriage(){
  const odp = state.triage||{};
  const pytania = activeQuestions(odp);
  const nastepne = nextQuestionId(odp);
  const gotowe = triageComplete(odp);
  const w = triageResult(odp);
  const flagi = czerwoneFlagi(odp);
  const ile = pytania.length, zrobione = pytania.filter(q=> q.typ==="wielokrotny"
    ? Array.isArray(odp[q.id])&&odp[q.id].length : !!odp[q.id]).length;

  // JEDNA zalecana akcja — i tylko wtedy, gdy model naprawdę dopuścił ścieżkę.
  const akcja = gotowe && w.sciezka
    ? `<button class="recoprimary" onclick="triageGo('${w.sciezka}')">${
        w.sciezka==="diag" ? t("Przejdź do prób pozycyjnych","Go to positional testing")
                           : t("Przejdź do HINTS","Go to HINTS")}</button>`
    : "";
  const dlaczego = gotowe && w.powody.length
    ? `<details class="tw__why"><summary>${t("Dlaczego?","Why?")}</summary>
        <ul class="tw__powody">${w.powody.map(p=>`<li>${t(p.pl,p.en)}</li>`).join("")}</ul></details>`
    : "";
  const uwagi = gotowe && (w.uwagi||[]).length
    ? `<ul class="tw__uwagi">${w.uwagi.map(u=>`<li>${t(u.pl,u.en)}</li>`).join("")}</ul>` : "";

  const wynik = gotowe
    ? `<section class="card tw tw--${w.kategoria}" data-flow-anchor="triage" tabindex="-1">
        <div class="tw__ttl">${flagi.length?"⚠ ":""}${t(w.tytul.pl,w.tytul.en)}</div>
        <p class="tw__tresc">${t(w.tresc.pl,w.tresc.en)}</p>
        ${uwagi}${dlaczego}
        <div class="tw__akcje">${akcja}</div>
        <p class="tw__pewnosc">${t("Pewność kwalifikacji","Triage confidence")}: <b>${
          w.pewnosc==="wysoka"?t("wysoka","high"):w.pewnosc==="srednia"?t("średnia","medium"):t("niska","low")}</b></p>
      </section>`
    : `<section class="card tw tw--wtoku">
        <div class="tw__ttl">${t("Kwalifikacja w toku","Triage in progress")}</div>
        <p class="tw__tresc">${t(`Odpowiedziano na ${zrobione} z ${ile} pytań. Wynik pojawi się, gdy odpowiesz na wszystkie — łącznie z przeglądem czerwonych flag.`,
                                 `${zrobione} of ${ile} questions answered. The result appears once all are answered — including the red-flag review.`)}</p>
      </section>`;

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="goArea('start')" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Wywiad — kwalifikacja wstępna","History — initial triage")}</b><span>${t("czas trwania · wyzwalacz · czerwone flagi","time course · trigger · red flags")}</span></div>
      ${Object.keys(odp).length?`<button class="opt opt--inline" onclick="resetTriage()">${t("Wyczyść","Clear")}</button>`:""}</div>
    <div class="pagegrid triagegrid">
      <div class="col col--ctl">
        ${pytania.map(q=>triageQuestionHTML(q,odp,nastepne)).join("")}
      </div>
      <div class="col col--viz">${wynik}</div>
    </div>
    <div class="disclaimer">${t('<b>Kwalifikacja wskazuje ŚCIEŻKĘ BADANIA, nie rozpoznanie.</b> Opiera się na taksonomii czas-i-wyzwalacze z wytycznych GRACE-3 (Edlow i wsp., <i>Acad Emerg Med</i> 2023). Nie zastępuje badania ani decyzji klinicysty.',
                              '<b>The triage selects an EXAMINATION PATHWAY, not a diagnosis.</b> It follows the timing-and-triggers taxonomy of the GRACE-3 guideline (Edlow et al., <i>Acad Emerg Med</i> 2023). It does not replace examination or clinician judgment.')}</div>`;
}

/* ============ TRYB EKSPERCKI (Blok 10) ============
   Dokument: „szybki tryb dla użytkownika, który JUŻ ZNA kanał, stronę i mechanizm" + kryterium
   odbioru nr 1 („dobór kanału, strony i mechanizmu aktualizuje manewr bez przeładowania strony").
   Dotąd ten ekran miał wyłącznie kanał i płaską listę manewrów: bez strony, bez mechanizmu i bez
   odróżnienia manewru pierwszego rzutu od alternatyw.

   NAPIS KARTY JEST UCZCIWY. Mockup pisze „najwyższa zgodność z rozpoznaniem" — model nie liczy
   zgodności z rozpoznaniem TEGO pacjenta i nie wolno mu tego udawać (dyscyplina Bloku 9: żadnych
   liczb pewności, żadnego rankingu wprowadzonego typografią). `recommend()` koduje pierwszy rzut
   wg wytycznych DLA PODANEGO kanału i mechanizmu — i dokładnie tak to nazywamy, wymieniając przy
   tym, które z trzech wartości pochodzą naprawdę od użytkownika (podpisWyboru). */
function kartaDoboru(){
  const d = doborEkspercki(state.canal, state.variant, manDeps());
  if(!d) return "";
  const p = podpisWyboru(state);
  const nazwa = (k)=>`${MANEUVERS[k].label} — ${MANEUVERS[k].desc}`;
  const lista = (arr)=>arr.map(k=>`<button class="recoalt" onclick="openMan('${k}')">${t("Alternatywa: ","Alternative: ")}${nazwa(k)}</button>`).join("");
  const wymien = (klucze)=>klucze.map(x=>t(POLA_WYBORU[x].pl, POLA_WYBORU[x].en)).join(", ");
  const atrybucja = p.komplet
    ? t(`Kanał, stronę i mechanizm podałeś Ty — to nie jest wniosek z próby.`,
        `You provided the canal, side and mechanism — this is not a conclusion from a test.`)
    : (p.podane.length
        ? t(`Od Ciebie pochodzi: ${wymien(p.podane)}. Pozostałe (${wymien(p.domyslne)}) to wartości domyślne — nie potwierdziłeś ich.`,
            `Provided by you: ${wymien(p.podane)}. The rest (${wymien(p.domyslne)}) are defaults — you have not confirmed them.`)
        : t(`Wszystkie trzy wartości są domyślne — nie potwierdziłeś żadnej.`,
            `All three values are defaults — you have confirmed none of them.`));
  return `<div class="reco reco--ekspert" data-dobor>
      <h4>${t("Zalecany manewr","Recommended maneuver")}</h4>
      <div class="ekspert__pierwszy">
        <b>${MANEUVERS[d.pierwszy].label}</b>
        <span class="ekspert__rzut">${t("pierwszy rzut dla podanego kanału i mechanizmu","first-line for the given canal and mechanism")}</span>
      </div>
      <div class="note">${d.uwaga||""}</div>
      <div class="note ekspert__atryb">${atrybucja}</div>
      <button class="recoprimary" onclick="openMan('${d.pierwszy}')">${t("Rozpocznij manewr","Start the maneuver")}: ${MANEUVERS[d.pierwszy].label}</button>
      ${d.alternatywy.length?`<div class="ekspert__alt"><span class="eyebrow">${t("Alternatywy","Alternatives")}</span>${lista(d.alternatywy)}</div>`:""}
    </div>`;
}
function renderSetup(){
  let body="";
  if(state.mode==="treat"){
    const canalOpt=k=>{const c=CANALS[k];return `<button class="opt" aria-pressed="${state.canal===k}" onclick="pickCanal('${k}')">
        <span class="canaldot" style="background:${c.color}"></span>${c.label}<small>${c.note}</small></button>`;};
    // Strona i mechanizm to DEKLARACJE, więc ich kafelki niosą informację, czy zostały potwierdzone.
    const stronaOpt=s=>`<button class="opt" data-side="${s}" aria-pressed="${state.sideZrodlo?state.side===s:false}" onclick="pickSide('${s}')">${t("Ucho","Ear")} ${sideN(s,"mianN")}<small>${t("strona pacjenta","patient's side")}</small></button>`;
    const mechOpt=v=>`<button class="opt" aria-pressed="${state.variantZrodlo?state.variant===v:false}" onclick="setVariant('${v}')">${NAZWA_MECH(v)}<small>${v==="canalo"?t("złóg swobodny w kanale","free-floating debris"):t("złóg na osklepku","debris on the cupula")}</small></button>`;
    const grupa=(tytul,podpis,html,klasa)=>`<div class="group"><div class="label"><span class="eyebrow">${tytul}</span><span class="hint">${podpis}</span></div><div class="seg ${klasa||""}">${html}</div></div>`;
    // Rozmiar złogu ustawia się w PRZEWODNIKU manewru (renderGuide → .sizerow), w kontekście trwającej
    // repozycji — nie na ekranie wyboru. Domyślnie state.size="medium" (genPlan przy starcie manewru).
    body=`<p class="ekspert__lead">${t("Tryb ekspercki — szybki wybór manewru, gdy kanał, stronę i mechanizm już znasz.","Expert mode — quick maneuver choice when you already know the canal, side and mechanism.")}</p>
      ${grupa(t("Kanał półkolisty","Semicircular canal"), t("zajęty kanał","affected canal"), `${canalOpt("posterior")}${canalOpt("horizontal")}${canalOpt("anterior")}`, "three")}
      ${grupa(t("Strona","Side"), t("ucho zajęte — zawsze strona PACJENTA","affected ear — always the PATIENT's side"), `${stronaOpt("L")}${stronaOpt("P")}`, "two")}
      ${grupa(t("Mechanizm","Mechanism"), t("postać złogu","form of the debris"), `${mechOpt("canalo")}${mechOpt("cupulo")}`, "two")}
      ${state.canal?kartaDoboru():`<div class="note">${t("Wybierz kanał, żeby zobaczyć zalecany manewr.","Choose a canal to see the recommended maneuver.")}</div>`}`;
  } else if(state.mode==="hints"){
    const famOf=k=> k==="normal"?"normal": k==="strokeCentral"?"stroke":"neuritis";
    const curFam=famOf(state.hintsScenario);
    const scDesc={normal:t("prawidłowy VOR","normal VOR"), neuritis:t("obwód","peripheral"), stroke:t("ośrodek (AVS)","central (AVS)")};
    const scSt="min-height:auto;padding:10px 11px;font-size:12.5px";   // zwarte karty 2×2 jak selektor scenariusza wewnątrz HINTS (seg four)
    const scOpt=(f,key,lbl)=>`<button class="opt" aria-pressed="${curFam===f}" onclick="openHints('${key}')" style="${scSt}">${lbl}<small>${scDesc[f]}</small></button>`;
    body=`<div class="group"><div class="label"><span class="eyebrow">${t("Scenariusz","Scenario")}</span><span class="hint">${t("obwód ↔ ośrodek","peripheral ↔ central")}</span></div>
        <div class="seg four">${scOpt('normal','normal',t('Zdrowy','Healthy'))}${scOpt('neuritis','neuritisR',t('Neuronitis','Neuritis'))}${scOpt('stroke','strokeCentral',t('Udar','Stroke'))}<button class="opt" aria-pressed="false" onclick="openHintsCustom()" style="${scSt}">${t('Własny','Custom')}<small>${t('matematyczny pacjent','mathematical patient')}</small></button></div>
      <div class="note" style="margin-top:14px">${t('Model „od pierwszych zasad": zmieniasz fizjologię (spoczynkowa aktywność błędników, wzmocnienie kanałów, kłaczek, integrator, otolity), a oczopląs samoistny, HIT i skew wynikają <b>same</b>. Wybierz scenariusz (przy neuronitis stronę ucha ustawisz przełącznikiem na karcie HINTS) albo tryb „Własny", by sterować każdym parametrem.','First-principles model: you change the physiology (resting labyrinth activity, canal gain, flocculus, integrator, otoliths), and spontaneous nystagmus, HIT and skew follow <b>on their own</b>. Choose a scenario (for neuritis, set the affected ear with the toggle on the HINTS card) or the Custom mode to control every parameter.')}</div>`;
  } else {
    const testOpt=k=>`<button class="opt" aria-pressed="${state.testKey===k}" onclick="openTest('${k}')">${DIAG[k].name}<small>${DIAG[k].tests}</small></button>`;
    body=`<div class="group"><div class="label"><span class="eyebrow">${t("Test diagnostyczny","Diagnostic test")}</span><span class="hint">${t("stronę ustalisz na karcie testu","set the side on the test card")}</span></div>
        <div class="seg">${testOpt("dix")}${testOpt("roll")}${testOpt("bowlean")}${testOpt("headhang")}</div></div>`;
  }
  $("#app").innerHTML=`
    <div class="topbar">
      <div class="mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13c0-5 4-8 7.5-8S20 7.5 20 11c0 3-2.5 4-2.5 6.5S16 21 14 21s-2-2-2-3.5S10.5 15 9 14s-4 .5-4-1Z" stroke="var(--primary)" stroke-width="1.6"/></svg></div>
      <div><h1>OTOREPO</h1><div class="sub">${t("Asystent przedsionkowy — BPPV, testy pozycyjne, HINTS · narzędzie dydaktyczne","Vestibular assistant — BPPV, positional testing, HINTS · educational tool")}</div></div>
    </div>
    <div class="tabs three" role="tablist">
      <button role="tab" aria-selected="${state.mode==='treat'}" onclick="setMode('treat')">${t("Repozycja","Repositioning")}</button>
      <button role="tab" aria-selected="${state.mode==='diag'}" onclick="setMode('diag')">${t("Diagnostyka","Diagnostics")}</button>
      <button role="tab" aria-selected="${state.mode==='hints'}" onclick="setMode('hints')">HINTS</button>
    </div>
    <div class="disclaimer">${t('<b>Narzędzie wspomagające dla personelu medycznego.</b> Nie zastępuje badania, rozpoznania ani decyzji klinicysty. Czasy i wzorce oczopląsu są poglądowe — zweryfikuj z własnym protokołem.','<b>Support tool for medical staff.</b> Does not replace examination, diagnosis, or clinician judgment. Nystagmus timings and patterns are illustrative — verify against your own protocol.')}</div>
    ${body}
    <p class="footnote">${t("Prototyp poglądowy. Brak gromadzenia danych.","Illustrative prototype. No data collection.")}</p>`;
}

/* ── Etap 3: karta „Ułożenie" w Three.js OBOK SVG (wąski zakres: Epley + Roll) ──
   Przełącznik 2D/3D w nagłówku karty; canvas montowany PO wstawieniu innerHTML
   (dynamiczny import → chunk three ładowany dopiero przy pierwszym użyciu 3D).
   Renderer czyta wyłącznie PoseSpec (most osi zweryfikowany: npm run bridge:check). */
function view3dToggle(){
  // Etykieta MUSI iść przez t(): twardy polski `title` był jednym z wycieków językowych — po
  // przełączeniu na EN zostawał po polsku. Do tego sam napis „3D" nie mówi czytnikowi ekranu nic
  // o tym, że to przełącznik widoku, stąd osobny aria-label.
  const l3d=t("Widok przestrzenny (WebGL)","Spatial view (WebGL)");
  return `<button class="mini3d" aria-pressed="${!!state.view3d}" onclick="event.stopPropagation();setView3d(${!state.view3d})" aria-label="${l3d}" title="${l3d}">3D</button>`;
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
  const _gn = nysFromDyn(p.canal, p.side, stepXiPeak(_man, p, state.step, state.size), p.mechanism==="cupulo");
  const gn = (_gn && _gn.strength >= 0.10) ? _gn : null;   // karta oczopląsu TAM, gdzie FIZYKA daje sygnał > próg (bez markera)
  const gravArrow = gn ? gravArrowFor(ps) : "";
  /* OŚ ETAPÓW Z PODPISAMI (mockup D4/M4: „Wszystkie etapy manewru widoczne jako pozioma oś").
     Zastępuje bezimienne kropki: klinicysta widzi, co go czeka, i może wrócić o etap bez
     resetowania manewru (kryterium odbioru nr 4). Dotknięcie to zwykłe `goStep` — a że SKOK po
     osi nie liczy się już jako wykonanie manewru (man-model.wykonanySekwencyjnie), zaglądanie
     w przód jest bezpieczne. Bez tamtej poprawki ta oś byłaby jednym dotknięciem do trwałego
     wyciszenia wszystkich alarmów. */
  const etapy = etapyManewru(p, manDeps(), state.size);
  const os = `<ol class="osetapow" aria-label="${t("Etapy manewru","Maneuver stages")}">${etapy.map((e,i)=>{
      const stan = i<state.step?'done':i===state.step?'cur':'todo';
      return `<li class="osetap osetap--${stan}">
        <button type="button" onclick="goStep(${i})" ${i===state.step?'aria-current="step"':''}>
          <span class="osetap__n" aria-hidden="true">${e.nr}</span>
          <span class="osetap__t">${e.tytul}</span>
          ${e.wyjscieZloga?`<span class="osetap__wy" title="${t(WYJSCIE_ZLOGA[e.wyjscieZeSchematu?'schemat':'fizyka'].pl, WYJSCIE_ZLOGA[e.wyjscieZeSchematu?'schemat':'fizyka'].en)}">◆</span>`:''}
        </button></li>`;
    }).join("")}</ol>`;
  const tgIcons = `<div class="tg">
      <button class="ic" role="switch" aria-checked="${state.autoAdvance}" aria-label="${t("Auto‑przejście po odliczeniu","Auto-advance after countdown")}" title="${t("Auto‑przejście","Auto-advance")}" onclick="toggleAuto(this)"><svg viewBox="0 0 24 24" fill="none"><path d="M5 5l10 7-10 7V5z" fill="currentColor"/><path d="M18.6 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>
      <button class="ic" role="switch" aria-checked="${state.sound}" aria-label="${t("Sygnał dźwiękowy i wibracja","Sound signal and vibration")}" title="${t("Sygnał dźwiękowy","Sound signal")}" onclick="toggleSound(this)"><svg viewBox="0 0 24 24" fill="none"><path d="M5 9v6h4l5 4V5L9 9H5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M17 9.5a4 4 0 0 1 0 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    </div>`;
  const sp = Math.max(0, Math.min(100, ((st.seconds||0)/120)*100));
  const timerBlock=st.seconds==null
    ? `<div class="tcard"><div class="trow1"><div class="nostimer-inline">${t("Krok bez odliczania — wykonaj płynnie, bez przerwy.","Step without a timer — perform smoothly, without pausing.")}</div>${tgIcons}</div></div>`
    : `<div class="tcard">
        <div class="trow1">
          <button id="btnGo" class="go" onclick="toggleTimer()">Start</button>
          <button class="ghost" onclick="resetTimer()" aria-label="Reset" title="Reset">↺</button>
          ${tgIcons}
          <div class="tval mono" id="tread">${fmtClock(st.seconds)}</div>
        </div>
        <div class="tprogwrap"><div id="tprog" class="tprog"></div></div>
        <div class="slider">
          <div class="track" id="track" role="slider" tabindex="0"
               aria-label="${t("Czas utrzymania pozycji","Position hold time")}"
               aria-valuemin="15" aria-valuemax="120" aria-valuenow="${st.seconds}" aria-valuetext="${fmtClock(st.seconds)}">
            <div class="fill" id="fill" style="width:${sp}%"></div>
            <span class="tk" style="left:25%"></span><span class="tk" style="left:50%"></span><span class="tk" style="left:100%"></span>
            <div class="knob" id="knob" style="left:${sp}%"></div>
          </div>
          <div class="ticks"><button type="button" style="left:25%" onclick="setStepSeconds(30)">0:30</button><button type="button" style="left:50%" onclick="setStepSeconds(60)">1:00</button><button type="button" class="r" style="left:100%" onclick="setStepSeconds(120)">2:00</button></div>
        </div>
      </div>`;
  const headPanel = st.headSlot && st.headSlot.kind==="textOnly"
      ? `<div class="panelbox"><h4>${t("Głowa","Head")}</h4><div class="headnote">${st.headText}</div></div>`
    : st.headSlot && st.headSlot.kind==="backTurn"
      ? `<div class="panelbox"><h4>${t("Głowa","Head")}</h4><div data-backhead>${backHeadSVG()}</div><div class="headnote">${st.headText}</div></div>`
      : `<div class="panelbox"><h4>${t("Głowa (z góry)","Head (top-down)")}</h4>${headDial(ps,p.headCamera,gn)}${perspNota(p.headCamera||"topDownFront")}</div>`;
  const gufoniNote = state.maneuverKey==="gufoniApo"
    ? `<div class="note">${t('Manewr <b>konwersji</b>: złóg nie opuszcza kanału — celem jest przekształcenie postaci apogeotropowej w geotropową. Po nim wykonaj ponowny Roll test i lecz postać geotropową (Lempert / Gufoni geotropowy).','<b>Conversion</b> maneuver: the debris does not leave the canal — the goal is to convert the apogeotropic form into the geotropic one. Afterward repeat the Roll test and treat the geotropic form (Lempert / Gufoni geotropic).')}</div>` : "";
  const basculeNote = state.maneuverKey==="bascule"
    ? `<div class="note">${t('Manewr <b>uwalniający</b> dla <b>kupulolitiazy</b>: rytmiczne bujanie bok–bok wytwarza siły bezwładności, które odrywają złóg przylegający do osklepka (cupula) i przenoszą go do łagiewki. Powtarzaj przerzuty do 5 serii; po manewrze wykonaj ponowny Dix–Hallpike.','<b>Releasing</b> maneuver for <b>cupulolithiasis</b>: rhythmic side-to-side rocking generates inertial forces that detach debris adhering to the cupula and carry it into the utricle. Repeat the swings up to 5 series; after the maneuver repeat the Dix–Hallpike.')}</div>` : "";
  // Manewr na KUPULOLITIAZĘ (mechanism:"cupulo", np. Bascule): karta „wędrówka otolitów" domyślnie NA WIERZCHU
  // (flipped) — pokazuje przyleganie/odklejanie od osklepka; osklepek dorysowany w labiryncie (opts.cupula).
  const cupuloMech = p.mechanism==="cupulo";
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${p.name}</b><span>${CANALS[p.canal].label}</span></div>
      <div class="sidewrap"><em>${t("strona","side")}</em><div class="sidepill"><button data-s="L" aria-pressed="${p.side==='L'}" onclick="setGuideSide('L')">L</button><button data-s="P" aria-pressed="${p.side==='P'}" onclick="setGuideSide('P')">${t("P","R")}</button></div></div></div>
    ${os}
    <div class="sizerow"><span class="lbl">${t("Rozmiar złogu","Debris size")}</span>
      <div class="sizepill">${["small","medium","big"].map(k=>`<button aria-pressed="${state.size===k}" onclick="pickSize('${k}')">${SIZE_LABELS[k]}</button>`).join("")}</div></div>
    ${state.size==="small"
      ? `<div class="note">${t('Drobny/wolno osiadający złóg — <b>wydłużono zalecany czas utrzymania pozycji</b> (wolniejsze osiadanie otoconiów; por. uzasadnienie ~30 s holdów w CRP: Hain, Squires &amp; Stone 2005). Oczopląs słabszy i o dłuższej latencji.','Fine/slow-settling debris — <b>the recommended hold time has been extended</b> (slower otoconia settling; cf. the rationale for ~30 s holds in CRP: Hain, Squires &amp; Stone 2005). Nystagmus is weaker and with a longer latency.')}</div>`
      : ""}
    <div class="pagegrid"><div class="col col--viz">
    <div class="viz"><div class="panelbox"><h4>${t("Ułożenie pacjenta","Patient position")}${can3d?view3dToggle():""}</h4>${can3d&&state.view3d?threeSlot("guide"):posture(ps,p.side)}</div>
      ${headPanel}</div>
    ${gn
      ? `<div class="flipwrap"><div class="flip${cupuloMech?' flipped':''}" id="flip" role="button" tabindex="0" aria-label="${t('Odwróć kartę: widok frontalny albo wędrówka otolitów','Flip the card: frontal view or otolith migration')}" onclick="flipGuide()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipGuide();}">
          <div class="face front panelbox"><h4>${t("Widok frontalny","Frontal view")}</h4>
            <div class="eyesrow">${earMark("P")}<div class="eyeswrap" data-nys-guide>${eyesSVG()}</div>${earMark("L")}</div>
            ${perspNota("frontal")}
            <div class="nyslabel"><span class="arrow">${arrowGlyph(gn)}</span><span>${gn.label}</span></div>
            ${gravArrow}
            <div class="fliphint">${FLIP_ICO} ${t("wędrówka otolitów","otolith migration")}</div></div>
          <div class="face back panelbox"><h4>${t("Wędrówka otolitów","Otolith migration")} — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal, {cupula:cupuloMech})}${gufoniNote}${basculeNote}
            <div class="fliphint">${FLIP_ICO} ${t("widok frontalny","frontal view")}</div></div>
        </div></div>`
      : `<div class="panelbox" style="margin-bottom:12px"><h4>${t("Wędrówka otolitów","Otolith migration")} — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal, {cupula:cupuloMech})}${gufoniNote}${basculeNote}</div>`}
    </div><div class="col col--ctl">
    <div class="card stepcard">
      <div class="stephead">
        <button class="stepnav" ${state.step===0?"disabled":""} onclick="goStep(${state.step-1})" aria-label="${t("Poprzedni krok","Previous step")}"><svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        <div class="num">${t("KROK","STEP")} ${state.step+1} / ${n}</div>
        ${state.step<n-1
          ? `<button class="stepnav" onclick="goStep(${state.step+1})" aria-label="${t("Następny krok","Next step")}"><svg viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`
          : `<button class="stepnav fin" onclick="zakonczSerie()" aria-label="${t("Zakończ serię","Finish series")}"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`}
      </div>
      <div class="title">${st.title}</div>
      <div class="instr">${st.instr}</div>
      ${(()=>{ /* DANE ETAPU (dokument: „Każdy etap pokazuje pozycję, kąt, stronę, czas
           i ewentualne kryterium przejścia dalej"). Wszystkie pięć pochodzi z modelu, nie z
           napisów przypisanych manewrowi — `kryterium` jest odczytem z fizyki, a nie etykietą. */
        const e = etapy[state.step]; if(!e) return "";
        const op = opisPozycji(e.pozycja.body, e.pozycja.face);
        const poz = op ? t(op.pl, op.en) : `${e.pozycja.body}/${e.pozycja.face}`;
        const kat = `${e.kat>0?"+":""}${e.kat}°`;
        const czas = e.sekundy==null ? t("bez odliczania","no countdown") : fmtClock(e.sekundy);
        return `<dl class="etapdane">
          <div><dt>${t("Pozycja","Position")}</dt><dd>${poz}</dd></div>
          <div><dt>${t("Skręt głowy","Head rotation")}</dt><dd>${kat}</dd></div>
          <div><dt>${t("Strona","Side")}</dt><dd>${t("ucho","ear")} ${sideN(e.strona,"mianN")} ${t("(pacjenta)","(patient's)")}</dd></div>
          <div><dt>${t("Czas","Time")}</dt><dd>${czas}</dd></div>
          <div class="etapdane--szer"><dt>${t("Przejście dalej","Moving on")}</dt><dd>${t(KRYTERIA[e.kryterium].pl, KRYTERIA[e.kryterium].en)}${
            e.wyjscieZloga?` · ${t(WYJSCIE_ZLOGA[e.wyjscieZeSchematu?'schemat':'fizyka'].pl, WYJSCIE_ZLOGA[e.wyjscieZeSchematu?'schemat':'fizyka'].en)}`:""}</dd></div>
        </dl>`;
      })()}</div>
    ${(()=>{ /* ALTERNATYWY BEZ OPUSZCZANIA EKRANU (mockup D4). Manewr pierwszego rzutu dla
         BIEŻĄCEGO kanału i mechanizmu jest odróżniony — ale odróżnienie mówi „pierwszy rzut wg
         wytycznych", nie „lepszy". */
      const d = doborEkspercki(p.canal, state.variant, manDeps());
      // : plan zbudowany poza akcjami (harness golden) nie ma stempla,
      // a lista alternatyw, ktora zawiera BIEZACY manewr, jest po prostu falszywa.
      const biezacy = p.key||state.maneuverKey;
      const inne = (CANALS[p.canal].maneuvers||[]).filter(k=>k!==biezacy);
      if(!inne.length) return "";
      return `<div class="altman"><span class="eyebrow">${t("Inny manewr tego kanału","Another maneuver for this canal")}</span>
        ${inne.map(k=>`<button class="altman__b" onclick="zmienManewr('${k}')">${MANEUVERS[k].label}${d&&d.pierwszy===k?` <em>${t("pierwszy rzut","first-line")}</em>`:""}</button>`).join("")}</div>`;
    })()}
    ${(()=>{ /* TRYB TIMERA (dokument: „stały czas albo «do ustąpienia oczopląsu + zapas»").
         Drugi tryb WYŁĄCZNIE PODNOSI czas protokolarny — patrz man-model.czasUtrzymania. Przy
         kupulolitiazie jest niedostępny z podanym powodem: oczopląs w niej nie wygasa, więc
         zdanie „do ustąpienia" nie ma desygnatu. */
      const dost = trybDoUstapieniaDostepny(p);
      const tryb = state.trybCzasu||"staly";
      return `<div class="trybczasu">
        <span class="eyebrow">${t("Czas utrzymania pozycji","Position hold time")}</span>
        <div class="trybczasu__seg">
          <button aria-pressed="${tryb==="staly"}" onclick="ustawTrybCzasu('staly')">${t("czas protokołu","protocol time")}</button>
          <button aria-pressed="${tryb==="doUstapienia"}" ${dost.dostepny?"":"disabled"} onclick="ustawTrybCzasu('doUstapienia')">${t("do ustąpienia oczopląsu + zapas","until nystagmus subsides + margin")}</button>
        </div>
        <div class="note">${dost.dostepny
          ? (tryb==="doUstapienia"
              ? t("Model podnosi czas protokołu tam, gdzie przewiduje dłuższy oczopląs. NIGDY go nie skraca — przewidywany czas pochodzi z okna symulacji, nie z obserwacji pacjenta.","The model raises the protocol time where it predicts a longer nystagmus. It NEVER shortens it — the predicted duration comes from the simulation window, not from observing the patient.")
              : t("Czasy z protokołu manewru. Suwak niżej pozwala je zmienić ręcznie.","Times from the maneuver protocol. The slider below lets you change them manually."))
          : t(POWOD_BRAKU_TRYBU[dost.powod].pl, POWOD_BRAKU_TRYBU[dost.powod].en)}</div>
      </div>`;
    })()}
    ${(()=>{ /* KRYTERIUM ODBIORU NR 3 — dwa zdania, każde o czym innym.
         (a) LUKA: odliczanie było prowadzone, gdy nikt nie patrzył na ekran. Czas jest policzony
             prawdziwie (zegar ścienny), ale aplikacja NIE UMIE stwierdzić, czy pacjent utrzymał
             pozycję — więc zatrzymuje licznik i pyta. Bez tego przerwa dłuższa niż etap odpalała
             auto-przejście, w skrajnym razie kaskadę aż do „manewr wykonany".
         (b) BLOKADA EKRANU: gdy platforma jej nie daje, ekran zgaśnie w środku repozycji.
             Flaga pochodzi z FAKTYCZNEJ próby, nie z detekcji API — blokada bywa odrzucona mimo
             obecnego `wakeLock` (brak secure context, polityka systemu, oszczędzanie energii). */
      let out="";
      if(state.luka>0){
        const sek=Math.round(state.luka/1000);
        out+=`<div class="lukanote" role="status"><b>${t("Przerwa w obserwacji","Gap in observation")}: ${fmtClock(sek)}</b>
          <span>${t("Ekran był niewidoczny, więc odliczanie zatrzymano. Licznik zna czas, ale nie wie, czy pacjent utrzymał pozycję — potwierdź to sam, zanim ruszysz dalej.","The screen was not visible, so the countdown was stopped. The timer knows the elapsed time but not whether the patient held the position — confirm that yourself before moving on.")}</span>
          <button class="lukanote__ok" onclick="potwierdzPrzerwe()">${t("Potwierdzam","Confirm")}</button></div>`;
      }
      if(state.wakeOK===false){
        out+=`<div class="wakenote" role="status">${t("Ta platforma nie pozwala utrzymać ekranu włączonego — ekran może zgasnąć w trakcie odliczania. Licznik nadrobi czas po powrocie i zapyta o potwierdzenie.","This platform does not allow keeping the screen on — it may go dark during the countdown. The timer will catch up on return and ask you to confirm.")}</div>`;
      }
      return out;
    })()}
    ${timerBlock}
    <p class="footnote">${t("Po zakończeniu odczekaj zgodnie z protokołem i rozważ ponowny test pozycyjny.","When finished, wait per protocol and consider repeating the positional test.")}</p>
    </div></div>`;
  if(can3d && state.view3d) mount3D("guide", ps, p.side);
  rafOnce(setupGuideAnim);
  rafOnce(initGuideSlider);
  if(gn) rafOnce(()=>sizeFlip("flip"));
  if(st.headSlot && st.headSlot.kind==="backTurn") rafOnce(()=>{ const bh=$("[data-backhead]"); if(bh) startBackHeadTurn(bh, st.headSlot.dir); });
  if(gn) rafOnce(()=>{ startDialNys(gn,p,manStepEnv(_man,state.step)); });
  if(gn) rafOnce(()=>{ const c=$("[data-nys-guide]"); if(c) startNys(c, gn, manStepEnv(_man,state.step)); });
  updateGoBtn();
}

// Karta klasyfikacji Bárány (ICVD) + różnicowanie OŚRODKOWE (CPN). Etykieta podtypu z baranyClassify();
// przełącznik „obwodowy (BPPV) / ośrodkowy (CPN)" (state.diagCentral) ujawnia czerwone flagi + schemat
// uporczywego downbeatu. Czysto widokowa — zero zmian fizyki; domyślnie „obwodowy" (golden deterministyczny).
/* wsparcie: plakietka tieru („zespół ustalony") jest NAJMOCNIEJSZYM twierdzeniem o pewności
   na tym ekranie, więc pokazuje się wyłącznie przy PEŁNYM opisie obserwacji. Przy opisie
   częściowym zostaje podtyp i kryteria — czyli „do tego wzorca to pasuje" — bez etykiety
   sugerującej, że sprawa jest ustalona. */
function diagClassifyCard(canal, v, side, antMode, wsparcie){
  const central=!!state.diagCentral;
  const cls=baranyClassify(canal, v, side, antMode);
  const tierBg = cls.tier==="established" ? "rgba(127,227,196,.14)" : "rgba(255,207,143,.16)";
  const tierFg = cls.tier==="established" ? "#7fe3c4" : "#ffcf8f";
  const seg=`<div class="seg segobs" style="margin-bottom:10px">
      <button class="opt" aria-pressed="${!central}" onclick="toggleDiagCentral(false)"><b>${t("Obwodowy — BPPV","Peripheral — BPPV")}</b><small>${t("klasyfikacja Bárány","Bárány classification")}</small></button>
      <button class="opt" aria-pressed="${central}" onclick="toggleDiagCentral(true)"><b>${t("Ośrodkowy — CPN","Central — CPN")}</b><small>${t("czerwone flagi","red flags")}</small></button>
    </div>`;
  const chip=([k,val])=>`<span style="display:inline-flex;gap:6px;align-items:baseline;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><span style="color:var(--muted)">${k}:</span><b>${val}</b></span>`;
  const bppv=`
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
        <b style="font-size:14.5px">${cls.subtype}</b>
        ${(wsparcie && wsparcie.poziom==="pelne") ? `<span style="font-size:11px;padding:2px 9px;border-radius:10px;background:${tierBg};color:${tierFg};white-space:nowrap">${cls.tierLabel}</span>` : ""}</div>
      <div style="margin-bottom:2px">${cls.crit.map(chip).join("")}</div>
      ${cls.redflag?`<div class="note" style="color:var(--ant)"><b>⚠</b> ${cls.redflag}</div>`:""}
      <div class="note">${t('Kryteria Bárány Society (ICVD 2015). „Zespół ustalony" = pewny podtyp; „wyłaniający się/atypowy" = rzadszy lub kontrowersyjny — potwierdź i wyklucz przyczynę ośrodkową.','Bárány Society criteria (ICVD 2015). "Established syndrome" = confident subtype; "emerging/atypical" = rarer or controversial — confirm and rule out a central cause.')}</div>`;
  const cpn=`
      <div class="redflag" style="margin-top:0"><b>${t("⚠ Ośrodkowy oczopląs pozycyjny (CPN) — to NIE BPPV.","⚠ Central positional nystagmus (CPN) — this is NOT BPPV.")}</b>
        ${t("Rozpoznaj po cechach nietypowych dla złogu:","Recognize it by features atypical for debris:")}
        <ul style="margin:8px 0 0;padding-left:18px;line-height:1.5">
          <li>${t("<b>Bez latencji</b> — pojawia się natychmiast po ułożeniu.","<b>No latency</b> — appears immediately after positioning.")}</li>
          <li>${t("<b>Uporczywy</b> — trwa, dopóki utrzymana jest pozycja (nie narasta i nie wygasa).","<b>Persistent</b> — lasts as long as the position is held (does not crescendo or fade).")}</li>
          <li>${t("<b>Niemęczliwy</b> — nie słabnie przy powtórzeniach prowokacji.","<b>Non-fatiguing</b> — does not weaken on repeated provocations.")}</li>
          <li>${t("<b>Czysto pionowy</b> (zwłaszcza <b>downbeat</b>) lub czysto skrętny; kierunek <b>niepasujący do żadnego kanału</b>.","<b>Purely vertical</b> (especially <b>downbeat</b>) or purely torsional; a direction <b>not matching any canal</b>.")}</li>
          <li>${t("Obecny w wielu pozycjach / w pozycji neutralnej; oczopląs bywa zmienny kierunkowo.","Present in many positions / in the neutral position; the nystagmus may be direction-changing.")}</li>
          <li>${t("Objawy towarzyszące: dyzartria, ataksja, dwojenie, zaburzenia spojrzenia.","Accompanying signs: dysarthria, ataxia, diplopia, gaze disturbances.")}</li>
        </ul></div>
      <div class="panelbox" style="margin-top:10px"><h4>${t("Wzorzec: uporczywy downbeat (poglądowo)","Pattern: persistent downbeat (illustrative)")}</h4>
        <div class="eyesrow">${earMark("P")}<div class="eyeswrap" data-cpnnys>${eyesSVG()}</div>${earMark("L")}</div>
        <div class="nyslabel"><span class="arrow">↓</span><span>${t("downbeat · uporczywy · bez latencji","downbeat · persistent · no latency")}</span></div></div>
      <div class="note" style="color:var(--text)">${t('<b>Postępowanie:</b> NIE wykonuj repozycji. Skieruj na ocenę neurologiczną + MRI tylnego dołu (móżdżek, pogranicze szczytowo-potyliczne: malformacja Chiariego; SM; zmiany naczyniowe). Najczęstszy łagodny mimik: <b>migrena przedsionkowa</b> (ośrodkowy oczopląs pozycyjny w napadzie).','<b>Management:</b> Do NOT perform repositioning. Refer for neurological evaluation + MRI of the posterior fossa (cerebellum, craniocervical junction: Chiari malformation; MS; vascular lesions). The most common benign mimic: <b>vestibular migraine</b> (central positional nystagmus during an attack).')}</div>`;
  // data-flow-anchor + tabindex: cel przewijania dla kroku „Interpretacja" w pasku przebiegu
  // (Blok 5). Kotwica MUSI być w markupie, a nie doczepiana po renderze: doczepianie działałoby
  // tylko dlatego, że wyrocznia czyta innerHTML synchronicznie i nie widzi rAF — czyli opierałoby
  // bezpieczeństwo na tym, czego golden NIE obejmuje. tabindex="-1" jest konieczny, żeby po
  // przewinięciu dało się przenieść fokus (czytnik ekranu musi wiedzieć, gdzie wylądował).
  return `<div class="card" style="margin-top:12px" data-flow-anchor="interpret" tabindex="-1">
      <div class="obslabel" style="margin-bottom:8px">${t("Klasyfikacja wg Bárány (ICVD) i różnicowanie ośrodkowe","Bárány classification (ICVD) and central differentiation")}</div>
      ${seg}${central?cpn:bppv}</div>`;
}
/* ROZCIĘCIE `antMode` NA TRZY NIEZALEŻNE SYGNAŁY (Blok 8).
   `antMode` niósł RÓWNOCZEŚNIE wnioskowanie (kanał, strona, dobór manewru) i OSTRZEŻENIE
   (czerwona flaga downbeatu). Dopóki to jeden przełącznik, uszanowanie znacznika
   „obserwacja niewiarygodna" gasiłoby czerwoną flagę razem z wnioskiem — a to jest dokładnie
   odwrotność tego, czego wymaga bezpieczeństwo. Zasada: kwarantanna wycisza WNIOSEK,
   nigdy OSTRZEŻENIE. */
function obsRekord(){ return ((state.obs || {})[state.testKey]) || null; }

// Wstrzykiwacz wiedzy klinicznej dla modelu interpretacji siedzi w `src/app/interp-deps.js` —
// JEDEN dla aplikacji i dla wyroczni. Kopia w tym pliku była zaproszeniem do cichego rozjazdu.
const interpDeps = ()=>_interpDeps(state);
/* Ile ekran ma prawo powiedzieć.
   ═══ KRYTERIUM ODBIORU NR 2 („brak wystarczających danych NIE jest przedstawiany jako pewne
   rozpoznanie") DZIAŁAŁO DOTĄD TYLKO PRZY DIX-HALLPIKE'U ═══
   Ustępstwo `proba!=="dix" → czesciowe` było w Bloku 8 UCZCIWE: przy rollu, bow&leanie
   i head-hangu nie istniało wtedy ŻADNE pole, w które dałoby się cokolwiek wpisać, więc
   wymaganie opisu zamykałoby trzy z czterech prób na głucho. Blok 8 zbudował pełny formularz dla
   WSZYSTKICH czterech prób i tym samym unieważnił tę przesłankę — a ustępstwo zostało. Skutek
   zmierzony: wejście na ekran rolla bez jednego dotknięcia formularza dawało kartę klasyfikacji
   z nazwanym podtypem, stroną chorą i gotowym „Rozpocznij: Lempert”.
   Droga „Znam kanał i stronę" (ekran wyboru, tryb leczenia) zostaje otwarta i prowadzi do manewru
   bez opisu — z tą różnicą, że tam kanał i strona pochodzą JAWNIE od użytkownika, a pasek
   przebiegu odnotowuje krok „Interpretacja" jako pominięty Z UZASADNIENIEM. */
function obsPoparcie(rek, proba, dixObs){
  if(rek) return poparcie(rek, proba, dixObs);
  return (proba==="dix" && dixObs) ? { poziom:"czesciowe", powod:null } : { poziom:"brak", powod:"brakOpisu" };
}
/* Ekran przy BRAKU opisu. Nie ma tu ani podtypu, ani plakietki „zespół ustalony", ani strony
   chorej, ani przycisku „Rozpocznij" — bo żadna z tych rzeczy nie wynika z niczego, co
   użytkownik powiedział. Zamiast tego jedno zdanie z POWODEM: te powody są rozłączne, więc
   „nie opisano jeszcze" i „opisany kierunek nie pasuje do żadnego kanału" nigdy nie zlewają
   się w jeden komunikat. */
function kartaBezOpisu(wsparcie){
  const p = POWODY_BRAKU[wsparcie.powod] || POWODY_BRAKU.brakOpisu;
  return `<div class="card reco obsbrak" style="margin-top:12px"><h4>${t("Nie ma jeszcze na czym oprzeć wniosku","Nothing to base a conclusion on yet")}</h4>
    <div class="note" style="color:var(--text)">${t(p.pl, p.en)}</div>
    <div class="note">${t("Opisz zaobserwowany oczopląs — aplikacja pokaże wtedy, do którego wzorca pasuje.","Describe the observed nystagmus — the app will then show which pattern it matches.")}</div></div>`;
}
/* Blok akcji przy obrazie NIETYPOWYM. Zajmuje miejsce rekomendacji manewru — nie dokłada się do
   niej — i świadomie NIE zawiera ani jednego `startManeuver(`. Wymienia POWODY, bo „coś tu nie
   gra" bez wskazania czego jest komunikatem, który uczy klikać dalej. Nie jest rozpoznaniem
   ośrodkowym: mówi, że TEN model nie ma wzorca na to, co opisano, i że repozycja nie ma na czym
   stanąć. Dwa wyjścia są realne: poprawić opis albo wziąć inną próbę. */
function kartaNietypowa(niet){
  const powody = (niet.powody||[]).map(p=>POWODY_NIETYPOWOSCI[p]).filter(Boolean);
  return `<div class="reco reco--niet"><h4>${t("Sugerowane leczenie","Suggested treatment")}</h4>
    <div class="note" style="color:var(--ant)"><b>${t("Repozycja niewskazana na tej podstawie.","Repositioning is not indicated on this basis.")}</b> ${t("Opisany obraz jest NIETYPOWY — nie da się z niego wyprowadzić kanału i strony, a manewr wykonany „na wszelki wypadek” przenosi złóg w miejsce, którego nikt nie ustalił.","The described picture is ATYPICAL — the canal and side cannot be derived from it, and a maneuver done “just in case” moves debris to a place nobody has established.")}</div>
    ${powody.length?`<ul class="nietpowody">${powody.map(p=>`<li>${t(p.pl,p.en)}</li>`).join("")}</ul>`:""}
    <div class="note">${t("Oceń przyczynę OŚRODKOWĄ, zanim wrócisz do repozycji. Jeżeli opis nie oddaje tego, co widziałeś — popraw go; jeżeli oddaje, wykonaj inną próbę pozycyjną.","Assess a CENTRAL cause before returning to repositioning. If the description does not reflect what you saw — correct it; if it does, perform a different positional test.")}</div>
    <div class="recobtns">
      <button class="recoalt" onclick="goObs()">${t("Wróć do opisu obserwacji","Back to the observation record")}</button>
      <button class="recoalt" onclick="backToSetup()">${t("Wybierz inną próbę","Choose a different test")}</button>
    </div></div>`;
}
function renderDiag(){
  const D=DIAG[state.testKey], A=state.side, v=state.variant;   // D = obiekt testu (NIE koliduj z importem t = tlumaczenie)
  const isDix = state.testKey==="dix";
  const rekObs = obsRekord();
  const wsparcie = obsPoparcie(rekObs, state.testKey, state.dixObs);
  const antMode = wnioskowanieDix(state)==="ant";          // WNIOSEK: downbeat → kanał PRZEDNI
  // OSTRZEŻENIA czytają REKORD — także wtedy, gdy jest oznaczony jako niewiarygodny.
  const ostrDownbeat = rekObs ? ostrzezenieDownbeat(rekObs) : (isDix && state.dixObs==="ant");
  const ostrSkretny  = rekObs ? ostrzezenieSkretny(rekObs)  : false;
  /* KRYTERIUM ODBIORU NR 3 („nietypowy wynik NIE prowadzi automatycznie do manewru repozycyjnego").
     Bramka stoi TUTAJ, a nie na nowym ekranie interpretacji, bo `recommend()` wołany jest w tym
     pliku i to stąd wychodzi jedyny `startManeuver(` diagnostyki. Zmierzony przeciwprzykład:
     roll o kierunku STAŁYM (prawo w dole = lewo w dole) daje flagę f3, a ekran próby dalej
     pokazywał „Rozpocznij: Lempert". `recommend()` zostaje NIETKNIĘTY — po prostu nie jest
     wołany w tej gałęzi, więc konflikt z kryterium znika bez ruszania silnika. */
  const niet = nietypowy(state, interpDeps());
  const effCanal = antMode ? "anterior" : D.canal;
  const effSide  = antMode ? otherSide(A) : A;            // kanał przedni ucha PRZECIWNEGO (płaszczyzna LARP/RALP)
  const phases = D.phases(A,v).map(ph => antMode
    ? { ...ph, nys: nysFromGeom("anterior", effSide, v, Vestibular.qSupineYaw(A==="P"?45:-45)),
        label: t("ku dołowi — czysty downbeat (kanał przedni)","downward — pure downbeat (anterior canal)"),
        note: t(`To NIE kanał tylny. Downbeat w Dix-Hallpike wskazuje kanał PRZEDNI ucha przeciwnego (${SIDE[effSide]}) — ta sama płaszczyzna co tylny ucha dolnego (LARP/RALP). Ułożenie głowy bez zmian; różni się tylko zaobserwowany oczopląs.`,`This is NOT the posterior canal. Downbeat in the Dix-Hallpike indicates the ANTERIOR canal of the opposite ear (${effSide==="L"?"left":"right"}) — the same plane as the posterior canal of the lower ear (LARP/RALP). Head positioning unchanged; only the observed nystagmus differs.`) }
    : ph);
  // MĘCZLIWOŚĆ: przy powtórzeniach prowokacji Dix-Hallpike kanalolitiaza SŁABNIE, kupulolitiaza NIE (różnicowanie).
  // fatigue = ortogonalny mnożnik amplitudy (startNys/startDialNysIn); kupulo = 1 (nie wyczerpuje się).
  const dixRep = (isDix && !antMode) ? (state.dixRep||0) : 0;
  const fatFactor = v==="cupulo" ? 1 : Vestibular.fatigueFactor(dixRep);
  phases.forEach(ph=>{ if(ph.nys) ph.nys.fatigue = fatFactor; });
  state._diagPhaseNys = phases.map(p=>p.nys);   // do restartu animacji przy odwracaniu kart pozycji
  const vl=variantLabels(D.canal);
  const mechNote = v==="canalo"
    ? t("Swobodne złogi przemieszczają się w świetle kanału pod wpływem grawitacji.","Free-floating debris moves within the canal lumen under gravity.")
    : t("Złogi przylegają do osklepka (cupula), który się odgina — bańka staje się wrażliwa na grawitację.","Debris adheres to the cupula, which deflects — the cupula becomes gravity-sensitive.");
  const can3d = true;                                    // Etap 4: 3D dla wszystkich testów pozycyjnych (dix/roll/bowlean/headhang)
  const phaseInner=(ph,i)=>{
    const phs=poseSpec(ph);                              // kanoniczna poza fazy testu (Etap 2)
    return `
      <div class="ptitle">${ph.ptitle}</div><div class="ppos">${ph.ppos}</div>
      <div class="minihead"><div class="panelbox"><h4>${t("Ułożenie","Position")}${can3d?view3dToggle():""}</h4>${can3d&&state.view3d?threeSlot("diag"+i):posture(phs,A)}</div>
        <div class="panelbox"><h4>${t("Głowa (z góry)","Head (top-down)")}</h4><div data-dialnys="${i}">${headDial(phs,"topDownBehind")}</div>${perspNota("topDownBehind")}</div></div>
      <div class="panelbox" style="margin-top:10px"><h4>${t("Widok frontalny","Frontal view")}</h4>
        <div class="eyesrow">${earMark("P")}<div class="eyeswrap" data-nys="${i}">${eyesSVG()}</div>${earMark("L")}</div>
        ${perspNota("frontal")}
        <div class="nyslabel"><span class="arrow">${arrowGlyph(ph.nys)}</span><span>${ph.label}${ph.nys.persistent?t(" · uporczywy"," · persistent"):t(" · przemijający"," · transient")}</span></div>
        ${gravArrowFor(phs)}</div>
      <div class="note">${ph.note}</div>`;};
  const phaseHTML = phases.length===2
    ? `<div class="flipwrap" style="margin-top:6px"><div class="flip${state.diagPhaseFace?' flipped':''}" id="phaseflip" role="button" tabindex="0" aria-label="${t("Odwróć","Flip")}: ${phases[0].ptitle} ${t("albo","or")} ${phases[1].ptitle}" onclick="flipPhases()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipPhases();}">
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
      ? t("Kupulolitiaza: oczopląs NIE wyczerpuje się przy powtórzeniach — złóg przylega do osklepka.","Cupulolithiasis: the nystagmus does NOT fatigue on repetition — the debris adheres to the cupula.")
      : rep===0
        ? t("Powtórz prowokację kilka razy: w kanalolitiazie oczopląs SŁABNIE z każdym razem (rozproszenie złogu) — to odróżnia ją od kupulolitiazy.","Repeat the provocation several times: in canalithiasis the nystagmus WEAKENS each time (debris disperses) — this distinguishes it from cupulolithiasis.")
        : t(`Osłabienie po ${rep} ${rep===1?"powtórzeniu":"powtórzeniach"}: amplituda oczopląsu ~${pct}% wartości wyjściowej.`,`Weakening after ${rep} ${rep===1?"repetition":"repetitions"}: nystagmus amplitude ~${pct}% of the initial value.`);
    return `<div class="card" style="margin-bottom:4px">
      <div class="obslabel" style="margin-bottom:4px">${t("Powtarzalność prowokacji — męczliwość oczopląsu","Provocation repeatability — nystagmus fatigability")}</div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px">
        <button class="opt opt--inline" onclick="repeatDixProvoke()">${t("↻ Powtórz prowokację","↻ Repeat provocation")}</button>
        <span class="mono" style="color:var(--muted);font-size:13px">${t("Prowokacja","Provocation")} #${rep+1}</span>
        ${rep>0?`<button class="opt" style="min-height:auto;padding:9px 12px;font-size:13px;flex:0 0 auto;text-align:center;opacity:.85" onclick="resetDixProvoke()">Reset</button>`:""}
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:8px;border-radius:4px;background:var(--panel2);overflow:hidden"><div style="height:100%;width:${pct}%;background:${barCol};transition:width .35s"></div></div>
        <span style="font-size:12px;color:var(--muted);min-width:84px;text-align:right">${t("amplituda","amplitude")} ${pct}%</span>
      </div>
      <div class="note">${note}</div></div>`;
  })() : "";
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${D.name}</b><span>${D.tests}</span></div>
      <div class="sidewrap"><em>${t("strona","side")}</em><div class="sidepill"><button data-s="L" aria-pressed="${A==='L'}" onclick="setDiagSide('L')">L</button><button data-s="P" aria-pressed="${A==='P'}" onclick="setDiagSide('P')">${t("P","R")}</button></div></div></div>
    <div class="card" style="margin-bottom:4px" data-flow-anchor="test" tabindex="-1"><div class="instr" style="font-size:14px;color:#D4DEE8">${D.intro}</div></div>
    ${/* WEJŚCIE DO OPISU OBSERWACJI — takie samo dla WSZYSTKICH czterech prób (Blok 8).
          Zastępuje dwustanowy przełącznik, który istniał wyłącznie przy Dix-Hallpike i pytał
          wprost o WNIOSEK („kanał tylny" / „kanał przedni"), a nie o to, co widać. Przy roll,
          bow&lean i head-hangu nie było czym opisać obserwacji w ogóle. */""}
    <div class="obsrow" tabindex="-1"><div class="obslabel">${t("Zaobserwowany oczopląs","Observed nystagmus")}</div>
      <button class="obsgo" onclick="goObs()">
        <span class="obsgo__t">${wsparcie.poziom==="brak" ? t("Opisz, co zobaczyłeś","Describe what you saw") : t("Opis obserwacji","Observation record")}</span>
        <span class="obsgo__s">${(()=>{
          if(!rekObs) return t("nie opisano — aplikacja nie ma na czym oprzeć wniosku","not described — the app has nothing to base a conclusion on");
          const k = kompletnosc(rekObs);
          const et = (os)=>t(ETYKIETY_OSI[k[os].etykieta].pl, ETYKIETY_OSI[k[os].etykieta].en);
          return `${t("kierunek","direction")}: ${et("kierunek")} · ${t("dynamika","dynamics")}: ${et("dynamika")}`;
        })()}</span>
        <span class="obsgo__go" aria-hidden="true">›</span></button>
      ${isDix && state.dixObs ? `<div class="obspodstawa">${t("Przyjęta podstawa interpretacji:","Accepted basis of interpretation:")} <b>${state.dixObs==="ant"?t("downbeat","downbeat"):t("ku górze + skrętny","upbeat + torsional")}</b></div>` : ""}
      ${/* WEJŚCIE NA EKRAN INTERPRETACJI. Do tej pory nowy ekran był osiągalny WYŁĄCZNIE przez
            rozwiniętą mapę kroków w pasku przebiegu — a ekran, do którego trzeba trafić przez
            schowane menu, jest praktycznie ekranem nieistniejącym. Podpis mówi, ile możliwości
            zostało, więc wejście niesie informację, a nie samą strzałkę. */""}
      <button class="obsgo interpgo" onclick="goInterpret()">
        <span class="obsgo__t">${t("Interpretacja","Interpretation")}</span>
        <span class="obsgo__s">${(()=>{
          if(!rekObs) return t("opisz obserwację, żeby model miał co interpretować","describe the observation so the model has something to interpret");
          const wi = interpretuj(rekObs, state.testKey, interpDeps());
          if(wi.zgodnosc==="brak") return wi.powod==="sprzecznyZWszystkimi"
            ? t("opis nie pasuje do żadnego wzorca, który model zna","the description matches no pattern the model knows")
            : t("nie opisano jeszcze cechy rozstrzygającej","no decisive feature described yet");
          return wi.pozostale.length===1
            ? t("jedna możliwość zgodna z opisem","one possibility consistent with the description")
            : t(`możliwości zgodnych z opisem: ${wi.pozostale.length}`,`possibilities consistent with the description: ${wi.pozostale.length}`);
        })()}</span>
        <span class="obsgo__go" aria-hidden="true">›</span></button>
    </div>
    ${phaseHTML}
    ${pozySekwencja(phases, A, !!state.reducedMotion)}
    ${fatPanel}
    ${(()=>{
      const interp = v0 => antMode
        ? t(`Kanał przedni ucha przeciwnego (${SIDE[effSide]}). Oczopląs to czysty downbeat — lateralizacja oczopląsem NIEWIARYGODNA (torsja śladowa). Potwierdź deep head-hangiem; lecz Yacovino.`,`Anterior canal of the opposite ear (${effSide==="L"?"left":"right"}). The nystagmus is a pure downbeat — lateralization by nystagmus is UNRELIABLE (trace torsion). Confirm with the deep head-hang; treat with Yacovino.`)
        : D.latNote(A, v0);
      const note = v0 => v0==="canalo"
        ? t("Swobodne złogi przemieszczają się w świetle kanału pod wpływem grawitacji.","Free-floating debris moves within the canal lumen under gravity.")
        : t("Złogi przylegają do osklepka (cupula), który się odgina — bańka staje się wrażliwa na grawitację.","Debris adheres to the cupula, which deflects — the cupula becomes gravity-sensitive.");
      const face = v0 => `<h4>${t("Mechanizm","Mechanism")} — ${CANALS[effCanal].label} · ${v0==="canalo"?t("kanalolitiaza","canalithiasis"):t("kupulolitiaza","cupulolithiasis")}</h4>
        <div data-diagcanal="${v0}">${diagCanalSVG(effCanal)}</div>
        <div class="features">${D.features(v0).map(f=>`<span>${f}</span>`).join("")}</div>
        <div class="note">${note(v0)}</div>
        <div class="note" style="color:var(--text)"><b>${t("Lateralizacja:","Lateralization:")}</b> ${interp(v0)}</div>`;
      return `<div class="flipwrap" style="margin-top:12px"><div class="flip ${v==='cupulo'?'flipped':''}" id="mechflip" role="button" tabindex="0" aria-label="${t('Odwróć kartę mechanizmu: kanalolitiaza albo kupulolitiaza','Flip the mechanism card: canalithiasis or cupulolithiasis')}" onclick="flipDiagMech()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipDiagMech();}">
        <div class="face front panelbox">${face("canalo")}<div class="fliphint">${FLIP_ICO} ${t("kupulolitiaza","cupulolithiasis")}</div></div>
        <div class="face back panelbox">${face("cupulo")}<div class="fliphint">${FLIP_ICO} ${t("kanalolitiaza","canalithiasis")}</div></div>
      </div></div>`;
    })()}
    ${wsparcie.poziom==="brak" ? kartaBezOpisu(wsparcie, state.testKey) : diagClassifyCard(effCanal, v, effSide, antMode, wsparcie)}
    ${ostrSkretny ? `<div class="redflag">${t('<b>⚠ Oczopląs czysto skrętny.</b> Kierunek bez składowej pionowej nie odpowiada żadnemu kanałowi w tym modelu — to jedna z cech przemawiających za przyczyną OŚRODKOWĄ. Nie wykonuj repozycji na tej podstawie.','<b>⚠ Purely torsional nystagmus.</b> A direction with no vertical component does not match any canal in this model — it is one of the features arguing for a CENTRAL cause. Do not perform repositioning on this basis.')}</div>` : ""}
    ${ostrDownbeat ? `<div class="redflag">${t('<b>⚠ Czerwona flaga — wyklucz przyczynę OŚRODKOWĄ.</b> Downbeat, który jest <b>uporczywy, bez latencji i nie wyczerpuje się</b> przy powtórzeniach, występuje także w pozycji neutralnej (na wznak, głowa prosto), albo towarzyszą mu objawy neurologiczne (dyzartria, ataksja, zaburzenia spojrzenia, dwojenie) — przemawia za przyczyną OŚRODKOWĄ (móżdżek, pogranicze czaszkowo‑szyjne: malformacja Arnolda‑Chiariego, SM, zmiany naczyniowe). Wymaga oceny neurologicznej i MRI, nie manewru. Repozycję rozważ dopiero po wykluczeniu przyczyny ośrodkowej.','<b>⚠ Red flag — rule out a CENTRAL cause.</b> A downbeat that is <b>persistent, without latency and non-fatiguing</b> on repetition, is also present in the neutral position (supine, head straight), or is accompanied by neurological signs (dysarthria, ataxia, gaze disturbances, diplopia) — argues for a CENTRAL cause (cerebellum, craniocervical junction: Arnold-Chiari malformation, MS, vascular lesions). Requires neurological evaluation and MRI, not a maneuver. Consider repositioning only after ruling out a central cause.')}</div>` : ""}
    ${wsparcie.poziom==="brak" ? "" : (()=>{ if(niet.nietypowy && !state.diagCentral) return kartaNietypowa(niet);
      if(state.diagCentral) return `<div class="reco"><h4>${t("Sugerowane leczenie","Suggested treatment")}</h4>
        <div class="note" style="color:var(--ant)">${t('<b>Repozycja niewskazana.</b> Przy podejrzeniu ośrodkowego oczoplasu pozycyjnego (CPN) nie wykonuj manewrów repozycyjnych — najpierw ocena neurologiczna i MRI tylnego dołu. Wróć do widoku „Obwodowy — BPPV", jeśli obraz jednak spełnia kryteria BPPV.','<b>Repositioning is not indicated.</b> When central positional nystagmus (CPN) is suspected, do not perform repositioning maneuvers — first a neurological evaluation and MRI of the posterior fossa. Return to the "Peripheral — BPPV" view if the picture does meet BPPV criteria.')}</div></div>`;
      const rec = antMode
        ? {primary:"yacovino", alts:[], note:t(`Downbeat w Dix-Hallpike → kanał PRZEDNI ucha przeciwnego (${SIDE[effSide]}), płaszczyzna LARP/RALP. Leczenie: Yacovino (deep head-hang → szybki ruch brody do klatki). Lateralizacja oczopląsem niepewna.`,`Downbeat in the Dix-Hallpike → ANTERIOR canal of the opposite ear (${effSide==="L"?"left":"right"}), LARP/RALP plane. Treatment: Yacovino (deep head-hang → quick chin-to-chest movement). Lateralization by nystagmus uncertain.`)}
        : recommend(state.testKey,v);
      /* STRONA IDZIE Z KARTĄ, NIE ZE STANU. Przy downbeacie `effSide` to ucho PRZECIWNE (kanał
         przedni leży po drugiej stronie), a `startManeuver` budował plan ze `state.side` — czyli
         dla ucha, które ta sama karta przed chwilą wykluczyła. Zmierzone trzema gestami: karta
         pisze „Leczenie dla strony lewa", a plan powstaje dla P. */
      const btns=[rec.primary,...rec.alts].map((k,idx)=>`<button class="${idx===0?'recoprimary':'recoalt'}" onclick="startManeuver('${k}','${effSide}')">${idx===0?t('Rozpocznij: ','Start: '):t('Alternatywa: ','Alternative: ')}${MANEUVERS[k].label} — ${MANEUVERS[k].desc}</button>`).join("");
      return `<div class="reco"><h4>${t("Sugerowane leczenie","Suggested treatment")}</h4>
        <div class="note" style="color:var(--text)">${rec.note}</div>
        <div class="note">${t(`Leczenie dla strony <b>${SIDE[effSide]}</b>.`,`Treatment for the <b>${effSide==="L"?"left":"right"}</b> side.`)} ${antMode?t("Strona kanału przedniego niepewna — potwierdź deep head-hangiem i dopiero po wykluczeniu przyczyny ośrodkowej.","The anterior-canal side is uncertain — confirm with the deep head-hang and only after ruling out a central cause."):t("Potwierdź stronę regułą lateralizacji powyżej, zanim rozpoczniesz manewr.","Confirm the side with the lateralization rule above before starting the maneuver.")}</div>
        <div class="recobtns">${btns}</div></div>`; })()}
    ${vizControls()}
    ${wsparcie.poziom==="czesciowe" ? `<div class="note obsniep">${t("Opis obserwacji jest niepełny — pokazany podtyp jest zgodnością z wzorcem modelu, a nie rozpoznaniem.","The observation is described only partly — the subtype shown is a match against the model's pattern, not a diagnosis.")}</div>` : ""}
    <p class="footnote">${t("Wzorce poglądowe. Interpretuj w kontekście klinicznym.","Illustrative patterns. Interpret in the clinical context.")}</p>`;
  if(can3d && state.view3d) phases.forEach((ph,i)=>mount3D("diag"+i, poseSpec(ph), A));
  rafOnce(()=>{
    phases.forEach((ph,i)=>{
      const c=$(`[data-nys="${i}"]`); if(c) startNys(c,ph.nys);
      const dh=$(`[data-dialnys="${i}"]`); if(dh) startDialNysIn(dh,ph.nys);   // animacja dialu (widok z tyłu)
    });
    const dcA=$('[data-diagcanal="canalo"]'); if(dcA) startDiagOtolith(dcA,"canalo",effCanal,effSide);
    const dcB=$('[data-diagcanal="cupulo"]'); if(dcB) startDiagOtolith(dcB,"cupulo",effCanal,effSide);
    const cpn=$('[data-cpnnys]'); if(cpn) startNeuroNys(cpn, {strength:0, strengthV:1, dir:0, vdir:-1, tdir:0}, 0);  // CPN: uporczywy CZYSTY downbeat — pętla CIĄGŁA (nie wygasa; startNys z obwiednią ξ wyłączyłby się, a to ma być oczopląs UPORCZYWY)
    sizeFlip("mechflip"); sizeFlip("phaseflip");
  });
}

/* ============ HINTS — różnicowanie ośrodek↔obwód (silnik NeuroVOR) ============ */
function hintsNysLabel(nys){
  const dirArrow = nys.dir<0?"⟵":nys.dir>0?"⟶":"•";
  const tor = nys.tdir<0?" ↺":nys.tdir>0?" ↻":"";
  const spv=(nys.spv||0);
  const txt = spv < NeuroVOR.VIS_THRESH ? tr("brak jawnego oczopląsu","no overt nystagmus")
    : tr(`oczopląs poziomo-skrętny bije ${nys.dir<0?"w lewo":"w prawo"} · faza wolna ${spv.toFixed(1)}°/s`,`horizontal-torsional nystagmus beats ${nys.dir<0?"to the left":"to the right"} · slow phase ${spv.toFixed(1)}°/s`);
  return `<div class="nyslabel"><span class="arrow">${dirArrow}${tor}</span><span>${txt}</span></div>`;
}
// Werdykt HINTS: trzy składowe (HI · N · TS) z tagami + synteza obwód/ośrodek (INFARCT).
function hintsVerdictHTML(H){
  const v=H.verdict;
  const tag=(cls,txt)=>`<span class="tag ${cls}">${txt}</span>`;
  const hiNA = !H.ny.hasSpontaneous && !H.hi.abnormal;                 // brak AVS → HIT nieinformacyjny do różnicowania
  const hiRow = H.hi.abnormal
    ? [tag("ok","HI"), tr(`Head-Impulse: sakada korygująca po stronie ${H.hi.side==="P"?"prawej":"lewej"} (kanał chory) — <b>obwodowy</b>.`,`Head impulse: corrective saccade on the ${H.hi.side==="P"?"right":"left"} side (affected canal) — <b>peripheral</b>.`)]
    : H.ny.hasSpontaneous
      ? [tag("bad","HI"), tr(`Head-Impulse: prawidłowy MIMO oczopląsu — <b>groźny</b> (ośrodek).`,`Head impulse: normal DESPITE nystagmus — <b>dangerous</b> (central).`)]
      : [tag("","HI"), tr(`Head-Impulse: prawidłowy.`,`Head impulse: normal.`)];
  const nyRow = H.ny.pattern==="directionChanging"
    ? [tag("bad","N"), tr(`Oczopląs: zmienny kierunkowo, niehamowany fiksacją — <b>ośrodek</b>.`,`Nystagmus: direction-changing, not suppressed by fixation — <b>central</b>.`)]
    : H.ny.pattern==="unidirectional"
      ? [tag("ok","N"), tr(`Oczopląs: jednokierunkowy${H.ny.suppresses?", tłumiony fiksacją":""} — <b>obwodowy</b>.`,`Nystagmus: unidirectional${H.ny.suppresses?", suppressed by fixation":""} — <b>peripheral</b>.`)]
      : [tag("","N"), tr(`Oczopląs: brak samoistnego.`,`Nystagmus: no spontaneous.`)];
  const tsRow = H.ts.present
    ? (H.ts.central
        ? [tag("bad","TS"), tr(`Test of Skew: dodatni (rozjazd pionowy) — <b>ośrodek</b>.`,`Test of Skew: positive (vertical misalignment) — <b>central</b>.`)]
        : [tag("ok","TS"), tr(`Test of Skew: śladowy skew (${H.ts.skewDeg}°, łagiewka) — <b>obwodowy</b>, poniżej progu ośrodkowego.`,`Test of Skew: trace skew (${H.ts.skewDeg}°, utricle) — <b>peripheral</b>, below the central threshold.`)])
    : [tag("ok","TS"), tr(`Test of Skew: ujemny (oczy w linii).`,`Test of Skew: negative (eyes aligned).`)];
  const vText = v==="central"?tr("Wzorzec OŚRODKOWY — groźny","CENTRAL pattern — dangerous") : v==="peripheral"?tr("Wzorzec OBWODOWY — uspokajający","PERIPHERAL pattern — reassuring") : tr("Bez cech ostrego zespołu przedsionkowego","No features of an acute vestibular syndrome");
  const foot = v==="central"
    ? `<div class="note" style="color:#ffd9df;margin-top:10px">${tr(`<b>INFARCT / czerwona flaga:</b> ${H.centralSigns.join("; ")}. Pilna ocena neurologiczna i MRI tylnego dołu (wyklucz udar). W ostrym zespole przedsionkowym HINTS bywa czulszy niż wczesne MRI — nie zwalnia z diagnostyki.`,`<b>INFARCT / red flag:</b> ${H.centralSigns.join("; ")}. Urgent neurological evaluation and MRI of the posterior fossa (rule out stroke). In acute vestibular syndrome HINTS can be more sensitive than early MRI — it does not replace diagnostics.`)}</div>`
    : v==="peripheral"
      ? `<div class="note" style="margin-top:10px">${tr("Triada uspokajająca: patologiczny HIT + oczopląs jednokierunkowy tłumiony fiksacją + brak skew — zgodne z przyczyną obwodową. Zawsze interpretuj klinicznie (m.in. HINTS dotyczy AVS z oczopląsem).","Reassuring triad: pathological HIT + unidirectional nystagmus suppressed by fixation + no skew — consistent with a peripheral cause. Always interpret clinically (HINTS applies to AVS with nystagmus).")}</div>`
      : `<div class="note" style="margin-top:10px">${tr("Brak oczopląsu samoistnego, HIT prawidłowy, brak skew — w tym modelu bez cech ostrego zespołu przedsionkowego.","No spontaneous nystagmus, normal HIT, no skew — in this model, no features of an acute vestibular syndrome.")}</div>`;
  const row=r=>`<div class="hrow">${r[0]}<span>${r[1]}</span></div>`;
  return `<div class="hverdict ${v}"><h4>${tr("Werdykt HINTS","HINTS verdict")}</h4><div class="vv">${vText}</div>
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
    <div class="ghead"><button class="iconbtn" onclick="goHintsKwal()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${tr("Różnicowanie — HINTS","Differentiation — HINTS")}</b><span>${tr("ośrodek ↔ obwód · silnik z pierwszych zasad","central ↔ peripheral · first-principles engine")}</span></div>
      ${fam==="neuritis" ? `<div class="sidewrap"><em>${t("strona","side")}</em><div class="sidepill"><button data-s="L" aria-pressed="${state.hintsSide==='L'}" onclick="setHintsNeuritisSide('L')">L</button><button data-s="P" aria-pressed="${state.hintsSide==='P'}" onclick="setHintsNeuritisSide('P')">${t("P","R")}</button></div></div>` : ""}</div>
    <div class="group" style="margin-top:4px"><div class="label"><span class="eyebrow">${tr("Scenariusz","Scenario")}</span><span class="hint">${tr("zmienia tylko parametry fizjologii","changes only the physiology parameters")}</span></div>
      <div class="seg four">${famBtn('normal',tr('Zdrowy','Healthy'),tr('prawidłowy VOR','normal VOR'),"setHintsDx('normal')")}${famBtn('neuritis',tr('Neuronitis','Neuritis'),tr('obwód','peripheral'),"setHintsDx('neuritis')")}${famBtn('stroke',tr('Udar','Stroke'),tr('ośrodek (AVS)','central (AVS)'),"setHintsDx('stroke')")}${famBtn('custom',tr('Własny','Custom'),tr('matematyczny pacjent','mathematical patient'),"openHintsCustom()")}</div></div>
    <div data-verdict>${hintsVerdictBlock(H)}</div>
    ${custom ? (state.hintsQuiz && !state.hintsQuizReveal ? hintsQuizBanner() : hintsCustomPanel()) : hintsCompPanel(key)}
    <div class="panelbox hpanel" style="margin-top:12px">
      <h4>${tr("Oczopląs samoistny — widok frontalny","Spontaneous nystagmus — frontal view")}</h4>
      <div class="hint-eyes ${fixOn?'':'dark'}">
        <div class="eyesrow">${earMark("P")}<div class="eyeswrap" data-neuronys>${eyesSVG()}</div>${earMark("L")}</div>
        ${fixOn?"":'<div class="frenzel-tag">'+tr("◌ gogle Frenzla — fiksacja zniesiona","◌ Frenzel goggles — fixation removed")+'</div>'}
      </div>
      <div data-nyslabel>${hintsNysLabel(nys)}</div>
      <div class="hctrl"><span class="lbl">${tr("Fiksacja","Fixation")}</span>
        <div class="pillseg">${fixBtn(false,"Frenzel")}${fixBtn(true,tr("Światło","Light"))}</div></div>
      <div class="hctrl"><span class="lbl">${tr("Spojrzenie","Gaze")}</span>
        <div class="pillseg">${gazeBtn(-1,tr("◀ lewo","◀ left"))}${gazeBtn(0,tr("środek","center"))}${gazeBtn(1,tr("prawo ▶","right ▶"))}</div></div>
      ${p.dehiscence ? `<div class="hctrl"><span class="lbl">${tr("SCDS · bodziec","SCDS · stimulus")}</span>
        <div class="pillseg"><button onclick="hintsSCDSStim('sound')">${tr("🔊 Dźwięk / Valsalva","🔊 Sound / Valsalva")}</button><button onclick="hintsSCDSStim('suction')">${tr("Podciśnienie","Suction")}</button></div></div>
      <div class="note" data-scdsnote>${scdsRestNote(p)}</div>` : ""}
      <div class="note" data-supplnote>${hintsSupplHTML(H,fixOn,sp)}</div>
    </div>
    <div class="panelbox hpanel" style="margin-top:12px">
      <h4>${tr("Test pchnięcia głową (HIT) — obserwuj cel ○","Head impulse test (HIT) — watch the target ○")}</h4>
      <div class="viewpoint">${tr("widok badającego (naprzeciw pacjenta) — P = ucho prawe pacjenta, L = ucho lewe","examiner's view (facing the patient) — R = patient's right ear, L = left ear")}</div>
      <div class="eyesrow">${earMark("P")}<div class="eyeswrap" data-hit>${hitSVG()}</div>${earMark("L")}</div>
      <div class="hctrl" style="justify-content:center"><span class="lbl">${tr("Płaszczyzna","Plane")}</span>
        <div class="pillseg">${["HC","RALP","LARP"].map(pl=>`<button aria-pressed="${(state.hintsPlane||'HC')===pl}" onclick="setHintsPlane('${pl}')">${pl==='HC'?tr('HC poziomy','HC horizontal'):pl}</button>`).join("")}</div></div>
      <div class="hctrl" style="justify-content:center"><span class="lbl">${tr("Pchnij","Thrust")}</span>
        <div class="pillseg">${(NeuroVOR.PLANE_CANALS[state.hintsPlane||'HC']).map(s=>`<button data-hitbtn="${s.canal}-${s.ear}" aria-pressed="${state.hintsHitSide===s.ear && (state.hintsHitCanal||'horizontal')===s.canal}" onclick="hintsHIT('${s.canal}','${s.ear}')">${hitPushLabel(s.canal,s.ear)}</button>`).join("")}</div></div>
      <div class="note" data-hitlabel>${lastHi ? hitLabel(lastHi) : ((state.hintsPlane||'HC')==='HC' ? tr("Kliknij stronę (ucho pacjenta), aby wykonać szybkie pchnięcie głową. Oczy powinny zostać na celu; sakada korygująca = kanał chory po tej stronie.","Click a side (the patient's ear) to perform a quick head thrust. The eyes should stay on the target; a corrective saccade = the affected canal on that side.") : tr("Płaszczyzny skośne RALP/LARP badają kanały PIONOWE (przedni/tylny). Sakada korygująca jest pionowo-skrętna. Wybierz kanał do pchnięcia.","The oblique RALP/LARP planes test the VERTICAL canals (anterior/posterior). The corrective saccade is vertical-torsional. Choose a canal to thrust."))}</div>
    </div>
    <div class="panelbox hpanel" style="margin-top:12px">
      <h4>${tr("Odchylenie skośne — naprzemienne zasłanianie","Skew deviation — alternate cover")}</h4>
      <div class="eyesrow">${earMark("P")}<div class="eyeswrap" data-skew>${skewSVG()}</div>${earMark("L")}</div>
      <div class="note">${skewLabel(H.ts)}</div>
    </div>
    ${otolithPanel(p)}
    ${custom ? `<div data-readout>${hintsReadoutHTML(p)}</div>` : ""}
    <p class="footnote">${tr("Wzorce poglądowe — narzędzie dydaktyczne, nie urządzenie diagnostyczne. Interpretuj klinicznie.","Illustrative patterns — an educational tool, not a diagnostic device. Interpret clinically.")}</p>`;
  rafOnce(()=>{
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
const compStage=c=> c<0.05?tr("Faza ostra","Acute phase") : c<0.4?tr("Podostra","Subacute") : c<0.85?tr("Zaawansowana","Advanced") : tr("Pełna kompensacja","Full compensation");
const compRowHTML=(sp,pr)=>`<span>${tr("Clamp móżdżkowy","Cerebellar clamp")} <b>−${(sp.clampAmt||0).toFixed(0)} Hz</b></span><span>Pacemaker <b>+${(sp.paceAmt||0).toFixed(0)} Hz</b></span><span>Velocity storage <b>${pr.tau.toFixed(1)} s</b></span>`;
function compNoteHTML(c,rec,sp){
  const t = rec ? tr("Błędnik odzyskuje funkcję. Jeśli pacemaker zdążył się naładować (wyższa kompensacja) — pojawia się oczopląs powrotny.","The labyrinth is recovering function. If the pacemaker has had time to charge (higher compensation) — a recovery nystagmus appears.")
    : c<0.05 ? tr("Faza ostra: pełna asymetria toniczna → silny oczopląs samoistny; w vHIT sakady JAWNE (overt, spóźnione).","Acute phase: full tonic asymmetry → strong spontaneous nystagmus; on vHIT OVERT saccades (delayed).")
    : c<0.85 ? tr("Kompensacja statyczna znosi asymetrię spoczynkową (oczopląs słabnie). Dynamika (gain vHIT) trwa — sakady przechodzą w UKRYTE (covert).","Static compensation removes the resting asymmetry (nystagmus fades). The dynamic deficit (vHIT gain) persists — saccades become COVERT.")
    : tr("Pełna kompensacja: brak oczopląsu samoistnego, velocity storage skrócone. vHIT nadal ujawnia deficyt (sakady ukryte) — dynamiki NIE da się naprawić.","Full compensation: no spontaneous nystagmus, velocity storage shortened. vHIT still reveals the deficit (covert saccades) — the dynamic loss CANNOT be repaired.");
  const bech = sp&&sp.bechterew ? `<div style="color:#ffcf8f;margin-top:6px">${tr("Oczopląs POWROTNY (Bechterewa): błędnik wrócił, a pacemaker wciąż naładowany → bije ku uchu <b>wcześniej choremu</b>.","RECOVERY nystagmus (Bechterew): the labyrinth has returned, but the pacemaker is still charged → beats toward the <b>previously affected</b> ear.")}</div>` : "";
  return t+bech;
}
// Panel kompensacji — tylko dla scenariuszy obwodowych (neuronitis). „Jeden suwak" steruje całą fizjologią.
function hintsCompPanel(key){
  if(key!=="neuritisR" && key!=="neuritisL") return "";
  const c=state.hintsComp||0, pct=Math.round(c*100), rec=!!state.hintsRecovery;
  const p=hintsCompPatient(key), sp=NeuroVOR.spontaneous(p), pr=NeuroVOR.postRotational(p);
  const recBtn=(v,lbl)=>`<button aria-pressed="${rec===v}" onclick="setHintsRecovery(${v})">${lbl}</button>`;
  return `<div class="panelbox hpanel" data-comppanel style="margin-top:12px">
    <h4>${tr("Kompensacja ośrodkowa","Central compensation")}<span class="comptag" data-comptag>${pct}% · ${compStage(c)}</span></h4>
    <input type="range" class="comprange" min="0" max="100" value="${pct}" oninput="setHintsComp(this.value)" onchange="rerunHintsHIT()" aria-label="${tr("Poziom kompensacji ośrodkowej","Central compensation level")}">
    <div class="comprow" data-comprow>${compRowHTML(sp,pr)}</div>
    <div class="hctrl"><span class="lbl">${tr("Błędnik","Labyrinth")}</span>
      <div class="pillseg">${recBtn(false,tr("nieczynny","non-functional"))}${recBtn(true,tr("regeneracja","recovery"))}</div></div>
    <div class="note" data-compnote>${compNoteHTML(c,rec,sp)}</div>
  </div>`;
}
// Opis oczopląsu samoistnego pod panelem (fiksacja / kierunek / Bechterew) — współdzielony z odświeżaniem suwaka.
function hintsSupplHTML(H,fixOn,sp){
  const suppl = H.ny.hasSpontaneous
    ? (fixOn ? (H.ny.suppresses ? tr("Z fiksacją oczopląs OBWODOWY słabnie (kłaczek tłumi dryf).","With fixation the PERIPHERAL nystagmus fades (the flocculus suppresses the drift).")
                                : tr("Mimo fiksacji oczopląs NIE słabnie — cecha OŚRODKOWA.","Despite fixation the nystagmus does NOT fade — a CENTRAL feature."))
             : tr("Bez fiksacji (gogle Frenzla / ciemność) oczopląs bije z pełną siłą.","Without fixation (Frenzel goggles / darkness) the nystagmus beats at full strength."))
    : tr("Brak oczopląsu samoistnego w tym scenariuszu.","No spontaneous nystagmus in this scenario.");
  const dc = H.ny.directionChanging ? tr(" Zmienia kierunek ze spojrzeniem → OŚRODEK."," Changes direction with gaze → CENTRAL.") : "";
  const be = sp&&sp.bechterew ? tr(" Kierunek ODWRÓCONY (oczopląs powrotny Bechterewa)."," Direction REVERSED (Bechterew recovery nystagmus).") : "";
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
  const T=780, fast=0.17, start=vizPeek();
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  return `<svg viewBox="0 0 240 150" class="eyes" role="img" aria-label="${tr("Test pchnięcia głową — widok frontalny (badający naprzeciw pacjenta)","Head impulse test — frontal view (examiner facing the patient)")}">
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
  const start=vizPeek();
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  if(hi.plane==="HC") return tr("pozioma, ku linii środkowej","horizontal, toward the midline");
  const v = hi.saccade.v>0 ? tr("ku górze","upward") : tr("ku dołowi","downward");
  const t = Math.abs(hi.saccade.t)>0.15 ? tr(` + skrętna (bieguny górne ${hi.saccade.t>0?"w prawo":"w lewo"})`,` + torsional (upper poles ${hi.saccade.t>0?"to the right":"to the left"})`) : "";
  return v+t;
}
function hitPushLabel(canal, ear){
  if(canal==="horizontal") return ear==="P"?tr("prawemu (P)","right (R)"):tr("lewemu (L)","left (L)");
  return tr(`${ear==="P"?"prawy":"lewy"} ${canal==="anterior"?"przedni":"tylny"}`,`${ear==="P"?"right":"left"} ${canal==="anterior"?"anterior":"posterior"}`);
}
// Spec ostatnio pchniętego kanału (string dla HC, {canal,ear} dla pionowych) — do odtworzenia opisu przy suwakach.
function hintsHitSpecOf(){
  if(state.hintsHitSide==null) return null;
  const canal=state.hintsHitCanal||"horizontal";
  return canal==="horizontal" ? state.hintsHitSide : {canal, ear:state.hintsHitSide};
}
function hitLabel(hi){
  const g=hi.gain.toFixed(2);
  const what = hi.plane==="HC" ? tr(`Pchnięcie ku uchu ${hi.toSide==="P"?"prawemu (P)":"lewemu (L)"}`,`Thrust toward the ${hi.toSide==="P"?"right (R)":"left (L)"} ear`)
             : tr(`Pchnięcie w płaszczyźnie ${hi.plane} (kanał ${hi.canal==="anterior"?"przedni":"tylny"} ${hi.ear==="P"?"prawy":"lewy"})`,`Thrust in the ${hi.plane} plane (${hi.canal==="anterior"?"anterior":"posterior"} canal, ${hi.ear==="P"?"right":"left"})`);
  const dir = tr(` Sakada korygująca: ${hitSaccadeDir(hi)}.`,` Corrective saccade: ${hitSaccadeDir(hi)}.`);
  const vhitOnly = tr(` <b style="color:#ffcf8f">Sakada UKRYTA (covert) — rejestrowana tylko w vHIT (video), niewidoczna gołym okiem.</b>`,` <b style="color:#ffcf8f">Covert saccade — recorded only on vHIT (video), invisible to the naked eye.</b>`);
  if(!hi.abnormal) return tr(`<b style="color:#7fe3c4">${what}: bez sakady</b> · VOR gain ${g} → HIT prawidłowy.`,`<b style="color:#7fe3c4">${what}: no saccade</b> · VOR gain ${g} → HIT normal.`);
  if(hi.overtSaccade && hi.covertSaccade) return tr(`<b style="color:#ffbf8f">${what}: sakada JAWNA + UKRYTA</b> · gain ${g} → HIT patologiczny (obwód), deficyt <b>częściowo skompensowany</b>.${dir}${vhitOnly}`,`<b style="color:#ffbf8f">${what}: OVERT + COVERT saccade</b> · gain ${g} → HIT pathological (peripheral), deficit <b>partially compensated</b>.${dir}${vhitOnly}`);
  if(hi.overtSaccade)  return tr(`<b style="color:#ff9bab">${what}: sakada JAWNA (overt)</b> · gain ${g} → HIT patologiczny (obwód), deficyt <b>nieskompensowany</b> — widoczna gołym okiem (bedside).${dir}`,`<b style="color:#ff9bab">${what}: OVERT saccade</b> · gain ${g} → HIT pathological (peripheral), deficit <b>uncompensated</b> — visible to the naked eye (bedside).${dir}`);
  if(hi.covertSaccade) return tr(`<b style="color:#ffcf8f">${what}: sakada UKRYTA (covert)</b> · gain ${g} wciąż niski, korekta W TRAKCIE ruchu → <b>bedside HIT „prawidłowy"</b>, deficyt widoczny TYLKO w vHIT (video).${dir}`,`<b style="color:#ffcf8f">${what}: COVERT saccade</b> · gain ${g} still low, correction DURING the movement → <b>bedside HIT "normal"</b>, deficit visible ONLY on vHIT (video).${dir}`);
  return tr(`<b style="color:#7fe3c4">${what}: bez jawnej sakady</b> · VOR gain ${g}.`,`<b style="color:#7fe3c4">${what}: no overt saccade</b> · VOR gain ${g}.`);
}

/* --- Test odchylenia skośnego: naprzemienne zasłanianie → pionowa sakada korygująca gdy skew obecny --- */
function skewSVG(){
  const eye=(cx,side)=>`<ellipse cx="${cx}" cy="55" rx="32" ry="25" fill="#EEF3F7" stroke="var(--line)" stroke-width="2"/>
    <g class="skiris" data-eye="${side}"><circle cx="${cx}" cy="55" r="14" fill="#3A6B86"/><circle cx="${cx}" cy="55" r="6.5" fill="#0b1118"/></g>`;
  return `<svg viewBox="0 0 240 110" class="eyes" role="img" aria-label="${tr("Test naprzemiennego zasłaniania","Alternate cover test")}">
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
  const start=vizPeek();
  loopRAF((rnow)=>{ const now=vizNow(rnow);
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
  if(!sk.present) return tr(`<b style="color:#7fe3c4">Skew nieobecny</b> — oczy pozostają w linii pionowej przy naprzemiennym zasłanianiu.`,`<b style="color:#7fe3c4">Skew absent</b> — the eyes stay vertically aligned during alternate cover.`);
  const who = sk.hyperSide?tr(`, oko ${sk.hyperSide==="P"?"prawe":"lewe"} wyżej`,`, ${sk.hyperSide==="P"?"right":"left"} eye higher`):"";
  return sk.central
    ? tr(`<b style="color:#ff9bab">Skew OBECNY (~${sk.skewDeg}°${who})</b> — pionowa sakada przy odsłanianiu = objaw OŚRODKOWY.`,`<b style="color:#ff9bab">Skew PRESENT (~${sk.skewDeg}°${who})</b> — vertical saccade on uncovering = CENTRAL sign.`)
    : tr(`<b style="color:#ffd9a0">Śladowy skew (~${sk.skewDeg}°${who})</b> — poniżej progu ośrodkowego; drobny rozjazd łagiewkowy (obwodowy, np. nerw górny).`,`<b style="color:#ffd9a0">Trace skew (~${sk.skewDeg}°${who})</b> — below the central threshold; a small utricular offset (peripheral, e.g. superior nerve).`);
}
/* ============ Otolity — SVV (subiektywna pionowa) + VEMP (cVEMP/oVEMP) ============
   Wizualizacja gotowych NeuroVOR.svv/vemp: linia SVV przechylona ku stronie chorej + słupki amplitud
   cVEMP (woreczek/n. dolny) i oVEMP (łagiewka/n. górny) z progiem. Statyczne (bez animacji) → odświeżane
   przez podmianę innerHTML w refreshHintsCustom/refreshHintsComp. Domyka mapę „narząd końcowy / gałąź nerwu". */
function svvSVG(sv){
  const cx=70, cy=60, R=46;
  const deg = sv.abnormal ? Math.min(sv.deg, 20) : 0;      // wychylenie linii; prawidłowa → pion
  const dir = sv.tiltSide==="P" ? -1 : 1;                  // konwencja paneli oczu: P=ekran-lewo, L=ekran-prawo; przechył KU stronie chorej
  const ang = (-90 + dir*deg)*Math.PI/180;                // 0°→pion (górny koniec linii)
  const dx=Math.cos(ang)*R, dy=Math.sin(ang)*R;
  const col = sv.abnormal ? "#ffcf8f" : "#7fe3c4";
  return `<svg viewBox="0 0 140 126" role="img" aria-label="${tr("Subiektywna pionowa (SVV)","Subjective visual vertical (SVV)")}" style="max-width:150px;width:100%">
    <rect x="0" y="0" width="140" height="110" rx="8" fill="#0b1118"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#22303d" stroke-width="1.5"/>
    <line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="#33404d" stroke-width="1.4" stroke-dasharray="4 5"/>
    <line x1="${(cx-dx).toFixed(1)}" y1="${(cy-dy).toFixed(1)}" x2="${(cx+dx).toFixed(1)}" y2="${(cy+dy).toFixed(1)}" stroke="${col}" stroke-width="3" stroke-linecap="round"/>
    <text x="8" y="123" fill="var(--muted)" font-size="10">${tr("P","R")}</text><text x="127" y="123" fill="var(--muted)" font-size="10">L</text>
  </svg>`;
}
function otolithInner(p){
  const sv=NeuroVOR.svv(p), ve=NeuroVOR.vemp(p);
  const svLabel = sv.abnormal
    ? tr(`SVV: przechył pionu <b>${sv.deg.toFixed(1)}°</b> ku stronie <b>${SIDE[sv.tiltSide]}</b> — grawiceptywny, ipsiwersyjny (obwodowo ku stronie chorej).`,`SVV: vertical tilt <b>${sv.deg.toFixed(1)}°</b> toward the <b>${sv.tiltSide==="P"?"right":"left"}</b> side — graviceptive, ipsiversive (peripheral, toward the affected side).`)
    : tr(`SVV prawidłowa (≤2°) — pion postrzegany zgodnie z grawitacją.`,`SVV normal (≤2°) — vertical perceived in line with gravity.`);
  const vbar=(name,ear,amp,stat)=>{
    const pct=Math.round(Math.max(0,Math.min(1,amp))*100);
    const col= amp>=0.65?"#7fe3c4":amp>=0.3?"#ffcf8f":"#ff9bab";   // kolor z AMPLITUDY (odporny na tlumaczenie 'stat')
    return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="min-width:82px;font-size:12px">${name} ${ear}</span>
      <div style="flex:1;height:9px;border-radius:5px;background:var(--panel2);position:relative;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${col};transition:width .3s"></div>
        <div style="position:absolute;left:30%;top:0;bottom:0;width:1px;background:var(--line)" title="próg"></div></div>
      <span style="min-width:74px;font-size:11px;color:${col};text-align:right">${stat}</span></div>`;
  };
  const c=ve.cVEMP, o=ve.oVEMP;
  const vempNote=(()=>{ const parts=[];
    if(c.weakEar) parts.push(tr(`cVEMP obniżony po stronie ${SIDE[c.weakEar]} → <b>woreczek / nerw DOLNY</b>`,`cVEMP reduced on the ${c.weakEar==="P"?"right":"left"} side → <b>saccule / INFERIOR nerve</b>`));
    if(o.weakEar) parts.push(tr(`oVEMP obniżony po stronie ${SIDE[o.weakEar]} → <b>łagiewka / nerw GÓRNY</b>`,`oVEMP reduced on the ${o.weakEar==="P"?"right":"left"} side → <b>utricle / SUPERIOR nerve</b>`));
    return parts.length ? parts.join("; ")+"." : tr("VEMP symetryczne — funkcja otolitowa zachowana obustronnie.","VEMP symmetric — otolith function preserved bilaterally.");
  })();
  const scdsNote = p.dehiscence ? `<div class="note">${tr('SCDS klinicznie: VEMP o <b>niskim progu / dużej amplitudzie</b> (trzecie okno). W tym modelu SCDS oddana jest oczoplasem trzeciego okna (panel „Oczopląs samoistny"), nie amplitudą VEMP.','Clinical SCDS: VEMP with a <b>low threshold / large amplitude</b> (third window). In this model SCDS is rendered via third-window nystagmus (the "Spontaneous nystagmus" panel), not by VEMP amplitude.')}</div>` : "";
  return `
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start">
      <div style="flex:0 0 auto">${svvSVG(sv)}</div>
      <div style="flex:1 1 160px;min-width:150px"><div class="note" style="margin-top:2px">${svLabel}</div>
        <div class="note" style="color:var(--muted)">${tr("Subiektywna pionowa (grawiceptja: łagiewka + kanały pionowe). W ostrym uszkodzeniu obwodowym przechył <b>ku stronie chorej</b> — składowa reakcji przechyłu ocznego (OTR).","Subjective visual vertical (graviception: utricle + vertical canals). In acute peripheral loss the tilt is <b>toward the affected side</b> — a component of the ocular tilt reaction (OTR).")}</div></div>
    </div>
    <div style="margin-top:10px">
      ${vbar("cVEMP","P",c.ampR,c.R)}${vbar("cVEMP","L",c.ampL,c.L)}
      ${vbar("oVEMP","P",o.ampR,o.R)}${vbar("oVEMP","L",o.ampL,o.L)}
    </div>
    <div class="note" style="margin-top:6px">${tr("<b>cVEMP</b> ≈ woreczek → nerw DOLNY (ipsilat. mostkowo-obojczykowo-sutkowy) · <b>oVEMP</b> ≈ łagiewka → nerw GÓRNY (kontralat. m. skośny dolny). Pionowa kreska = próg.","<b>cVEMP</b> ≈ saccule → INFERIOR nerve (ipsilateral sternocleidomastoid) · <b>oVEMP</b> ≈ utricle → SUPERIOR nerve (contralateral inferior oblique). The vertical line = threshold.")} ${vempNote}</div>
    ${scdsNote}`;
}
function otolithPanel(p){
  return `<div class="panelbox hpanel" style="margin-top:12px">
    <h4>${tr("Otolity — SVV &amp; VEMP","Otoliths — SVV &amp; VEMP")}</h4>
    <div data-otolith>${otolithInner(p)}</div>
  </div>`;
}
// Werdykt HINTS z zasłoną w trybie quiz (zanim odsłonisz rozpoznanie).
function hintsVerdictBlock(H){
  if(state.hintsCustom && state.hintsQuiz && !state.hintsQuizReveal)
    return `<div class="hverdict"><h4>${tr("Werdykt HINTS","HINTS verdict")}</h4><div class="vv">${tr("Quiz — ukryto werdykt","Quiz — verdict hidden")}</div>
      <div class="note" style="margin-top:6px">${tr("Zbadaj pacjenta (oczopląs + fiksacja, HIT, skew), postaw rozpoznanie, a potem odsłoń.","Examine the patient (nystagmus + fixation, HIT, skew), make a diagnosis, then reveal.")}</div></div>`;
  return hintsVerdictHTML(H);
}
// Dynamiczne podsumowanie ustawionej gałęzi nerwu (aktualizuje się z wyborem Ucho/Gałąź/Nasilenie).
function nerveLesionSummary(){
  const ear=state.hintsNerveEar||"P", branch=state.hintsNerveBranch||"superior", sev=state.hintsNerveSev==null?1:state.hintsNerveSev;
  const earW = ear==="P"?tr("prawe (P)","right (R)"):tr("lewe (L)","left (L)");
  const brW = branch==="superior" ? tr("nerw GÓRNY (poziomy + przedni + łagiewka)","SUPERIOR nerve (horizontal + anterior + utricle)")
            : branch==="inferior" ? tr("nerw DOLNY (tylny + woreczek)","INFERIOR nerve (posterior + saccule)")
            : tr("CAŁY nerw (górny + dolny)","WHOLE nerve (superior + inferior)");
  const exp = branch==="superior" ? tr("oczopląs poziomo-skrętny (bije ku zdrowemu), vHIT HC + przedni ↓, kaloryka ↓, oVEMP ↓, mały skew","horizontal-torsional nystagmus (beats toward the healthy side), vHIT HC + anterior ↓, caloric ↓, oVEMP ↓, small skew")
            : branch==="inferior" ? tr("oczopląs skrętno-DOWNBEAT (ku zdrowemu), vHIT tylny ↓, kaloryka + HC prawidłowe, cVEMP ↓, przechył SVV ku choremu","torsional-DOWNBEAT nystagmus (toward the healthy side), vHIT posterior ↓, caloric + HC normal, cVEMP ↓, SVV tilt toward the affected side")
            : tr("pełny ubytek: vHIT wszystkich płaszczyzn ↓, kaloryka ↓, oba VEMP ↓","complete deficit: vHIT of all planes ↓, caloric ↓, both VEMP ↓");
  return tr(`<b>Neuronitis</b> — ${brW}, ucho ${earW}, nasilenie <b>${Math.round(sev*100)}%</b>.<br>Spodziewany obraz: ${exp}.`,`<b>Neuritis</b> — ${brW}, ${earW} ear, severity <b>${Math.round(sev*100)}%</b>.<br>Expected picture: ${exp}.`);
}

// Panel sterowania parametrami (PARAM_SPEC): presety + selektor nerwu + suwaki basic + zaawansowane (zwijane).
function hintsCustomPanel(){
  const p=state.hintsCustom||NeuroVOR.makePatient({}), active=state.hintsPreset;
  const presetBtn=k=>`<button class="preset" aria-pressed="${active===k}" onclick="loadHintsPreset('${k}')">${HINTS_PRESETS[k].label}</button>`;
  const presets = presetBtn("healthy")
    + `<button class="preset" aria-pressed="${active==='neuritis'}" onclick="loadHintsNeuritis()">${tr("Neuronitis","Neuritis")}</button>`
    + ["bvh","meniereP","meniereL","scdsP","scdsL","stroke"].map(presetBtn).join("");
  const ear=state.hintsNerveEar||"P", branch=state.hintsNerveBranch||"superior", sev=state.hintsNerveSev==null?1:state.hintsNerveSev;
  const ne=(e)=>`<button aria-pressed="${ear===e}" onclick="setHintsNerveEar('${e}')">${e}</button>`;
  const nb=(b,l)=>`<button aria-pressed="${branch===b}" onclick="setHintsNerveBranch('${b}')">${l}</button>`;
  // Ramka „Wypadnięcie gałęzi nerwu" = konfigurator NEURONITIS; widoczna tylko dla trybu neuronitis (bez duplikacji).
  const nerveBox = active==="neuritis" ? `<div class="pgroup"><div class="pgtitle">${tr("Neuronitis — wypadnięcie gałęzi nerwu","Neuritis — nerve branch lesion")} <span class="pghelp">${tr("górny = poziomy + przedni + łagiewka; dolny = tylny. Ustawia gainy/tony kanałów.","superior = horizontal + anterior + utricle; inferior = posterior. Sets canal gains/tones.")}</span></div>
      <div class="hctrl"><span class="lbl">${tr("Ucho","Ear")}</span><div class="pillseg">${ne("L")}${ne("P")}</div>
        <span class="lbl">${tr("Gałąź","Branch")}</span><div class="pillseg">${nb("superior",tr("Górny","Superior"))}${nb("inferior",tr("Dolny","Inferior"))}${nb("full",tr("Cały","Whole"))}</div></div>
      <label class="prow"><span class="plabel">${tr("Nasilenie","Severity")}</span>
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
    <h4>${tr("Matematyczny pacjent — parametry fizjologii","Mathematical patient — physiology parameters")}</h4>
    <div class="presets">${presets}</div>
    ${nerveBox}
    ${basic}
    <details class="advbox" ${state.hintsAdvanced?"open":""} ontoggle="setHintsAdvanced(this.open)">
      <summary>${tr("Parametry zaawansowane — ośrodek, kompensacja, kanały pionowe, SCDS","Advanced parameters — central, compensation, vertical canals, SCDS")}</summary>
      ${adv}
    </details>
    <div class="hctrl" style="margin-top:12px">
      <button class="preset" onclick="hintsRandomPatient()">${tr("🎲 Losowy pacjent (quiz)","🎲 Random patient (quiz)")}</button>
      <button class="preset" onclick="saveShareHints()">${tr("🔗 Zapisz / udostępnij","🔗 Save / share")}</button>
      <button class="preset" onclick="exitHintsCustom()">${tr("Wróć do scenariuszy","Back to scenarios")}</button></div>
    <div class="note" data-sharenote style="margin-top:6px">${tr("Link koduje parametry w adresie (dane tylko lokalnie — nic nie jest wysyłane).","The link encodes the parameters in the URL (data local only — nothing is sent).")}</div>
  </div>`;
}
// Banner trybu quiz (parametry ukryte do odsłonięcia).
function hintsQuizBanner(){
  return `<div class="panelbox hpanel" style="margin-top:12px">
    <h4>${tr("Tryb quiz — nieznany pacjent","Quiz mode — unknown patient")}</h4>
    <div class="note">${tr("Wykonaj badania poniżej (oczopląs samoistny + fiksacja, test pchnięcia głową, odchylenie skośne), postaw rozpoznanie, a potem odsłoń parametry i odczyt kliniczny.","Perform the tests below (spontaneous nystagmus + fixation, head impulse test, skew deviation), make a diagnosis, then reveal the parameters and clinical readout.")}</div>
    <div class="hctrl"><button class="preset" onclick="hintsRandomPatient()">${tr("🎲 Nowy losowy pacjent","🎲 New random patient")}</button>
      <button class="preset" onclick="revealHintsQuiz()">${tr("Odsłoń rozpoznanie","Reveal the diagnosis")}</button>
      <button class="preset" onclick="exitHintsCustom()">${tr("Wyjdź z quizu","Exit the quiz")}</button></div>
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
    ? `<div class="rsub"><b>${tr("Pułapki / niejednoznaczności:","Pitfalls / ambiguities:")}</b><ul>${r.ambiguities.map(a=>`<li>${a}</li>`).join("")}</ul></div>` : "";
  const body = hidden
    ? `<button class="preset" onclick="revealHintsQuiz()">${tr("Odsłoń rozpoznanie i parametry","Reveal the diagnosis and parameters")}</button>`
    : `<div class="rloc"><span class="eyebrow">${tr("Lokalizacja","Localization")}</span><b>${r.localization}</b></div>
       <div class="rsigns">${per}${cen||`<span class="rchip">${tr("brak jawnych cech ośrodkowych","no overt central features")}</span>`}</div>${amb}`;
  return `<div class="readout">
    <h4>${tr("Odczyt kliniczny — matematyczny pacjent","Clinical readout — mathematical patient")}${hidden?" · QUIZ":""}</h4>
    <ul class="rfind">${findings}</ul>
    ${body}
    <div class="note" style="margin-top:8px">${tr("Narzędzie dydaktyczne — synteza z parametrów fizjologii, nie rozpoznanie kliniczne.","Educational tool — synthesized from the physiology parameters, not a clinical diagnosis.")}</div>
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
  set('[data-otolith]', otolithInner(p));   // SVV/VEMP zależą od suwaków woreczek/łagiewka + selektora nerwu
  if(hintsHitSpecOf()) set('[data-hitlabel]', hitLabel(NeuroVOR.headImpulse(p, hintsHitSpecOf())));
  const cont=$('[data-neuronys]'); if(cont) startNeuroNys(cont, nys, gazeDeg);   // płynna zmiana amplitudy
  const skc=$('[data-skew]'); if(skc) startSkew(skc, H.ts);                       // restart animacji skew (token)
}

/* --- U4: SCDS / trzecie okno — bodziec dźwiękowy/ciśnieniowy (objaw Tullio/Hennebert) --- */
// W spoczynku brak oczopląsu (dehiscencja ≠ hipofunkcja); bodziec napędza kanał GÓRNY → pionowo-skrętny
// oczopląs BEZ ruchu głową. Pobudzenie (dźwięk/Valsalva) = downbeat + skręt ku choremu; podciśnienie = odwrotnie.
function scdsRestNote(p){
  return p.dehiscence
    ? tr(`Dehiscencja kan. górnego po stronie ${p.dehiscence==="P"?"prawej":"lewej"}. W spoczynku oczy spokojne — kliknij bodziec, by wywołać oczopląs pionowo-skrętny (objaw Tullio/Hennebert).`,`Superior canal dehiscence on the ${p.dehiscence==="P"?"right":"left"} side. At rest the eyes are quiet — click a stimulus to elicit vertical-torsional nystagmus (Tullio/Hennebert sign).`)
    : "";
}
function scdsLabel(ps){
  if(!ps||!ps.present) return tr("Brak dehiscencji — bodziec bez efektu.","No dehiscence — the stimulus has no effect.");
  const v = ps.vdir<0 ? tr("downbeat (ku dołowi)","downbeat (downward)") : tr("upbeat (ku górze)","upbeat (upward)");
  const tor = ps.tdir<0 ? tr("bieguny górne w lewo","upper poles to the left") : tr("bieguny górne w prawo","upper poles to the right");
  return tr(`<b style="color:#ffcf8f">Bodziec (${ps.type}) → oczopląs pionowo-skrętny: ${v} + skręt (${tor})</b> · faza wolna ${(ps.spv||0).toFixed(1)}°/s. BEZ ruchu głową — patognomoniczne dla trzeciego okna.`,`<b style="color:#ffcf8f">Stimulus (${ps.type}) → vertical-torsional nystagmus: ${v} + torsion (${tor})</b> · slow phase ${(ps.spv||0).toFixed(1)}°/s. WITHOUT head movement — pathognomonic for a third window.`);
}
// Diagnostyka: karta „Mechanizm" jako flip kanalolitiaza⇄kupulolitiaza. Animacja wizualna, a po jej
// zakończeniu re-render z nowym wariantem (spójne fazy/oczopląs/zalecenie).
function flipDiagMech(){
  if(state._mechTO) return;                                // debounce: ignoruj ponowne kliknięcia w trakcie 500 ms animacji (bez nakładania timerów / desyncu wariantu)
  const c=$("#mechflip"); if(c) c.classList.toggle("flipped");
  state._mechTO=setTimeout(()=>{ state._mechTO=null;
    if(state.screen!=="diag") return;                      // użytkownik opuścił diagnostykę (Wróć / zmiana ekranu) → nie wymuszaj zmiany wariantu ani re-renderu
    // Odwrócenie karty mechanizmu to ŚWIADOMA decyzja interpretacyjna (kanalolitiaza ↔
    // kupulolitiaza), a od niej zależy zalecany manewr — musi więc iść przez ten sam zapis,
    // co przełącznik „obwodowy ↔ ośrodkowy", inaczej wcześniej wybrany manewr zostałby
    // niezauważenie nieaktualny. [Blok 5]
    markDecision(state,"variant", state.variant==="canalo"?"cupulo":"canalo");
    markSeen(state,"interpretSeen");
    render(); }, 500);
}
// Diagnostyka: para pozycji (Roll: ucho L/P w dole; Bow-Lean: skłon/odchylenie) jako flip — czysto wizualny
// (obie pozycje stale w DOM, animacje per-indeks działają niezależnie).
function flipPhases(){
  const c=$("#phaseflip"); if(!c) return;
  state.diagPhaseFace = state.diagPhaseFace ? 0 : 1;          // utrwal fazę w stanie → przetrwa re-render (przełącznik 3D nie przewraca karty)
  c.classList.toggle("flipped", state.diagPhaseFace===1);     // klasa zgodna ze stanem (płynna animacja flip zostaje)
  const i = state.diagPhaseFace;                              // odsłonięta pozycja (front=0 / back=1)
  markSeen(state,"obsSeen");                                  // odwrócenie pary pozycji = oglądanie oczopląsu w obu ułożeniach [Blok 5]
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


/* ============ TRYB NAUKI (Blok 13) ============
   Dwa ekrany: BIBLIOTEKA i LEKCJA. Układ z mockupu D3 — opis i odpowiedzi po lewej, ilustracja
   i informacja zwrotna po prawej — powstaje z tej samej siatki `.pagegrid`, co Bloki 10-12,
   więc na telefonie kolumny znikają (`display:contents`) i wszystko układa się sekwencyjnie,
   dokładnie jak w M3.

   ═══ CZEGO TU CELOWO NIE MA ═══
   Animacji silnika ani figury 3D. Obie stoją na `state.side`, `state.canal`, `state.variant`,
   `state.maneuverKey`, `state.plan` — czyli na polach opisujących PRAWDZIWEGO pacjenta. Żeby
   pokazać w lekcji manewr Epleya, trzeba by je nadpisać, a po wyjściu z nauki klinicysta
   zastałby na karcie ułożenia cudzy przypadek, przy `variantZrodlo` nadal mówiącym
   „wyprowadzony z opisu obserwacji". Ilustracją przypadku jest więc ZAPIS OBSERWACJI złożony
   z tych samych słowników, co formularz Bloku 8 — nic, co wymagałoby zapisu do stanu pacjenta. */

function nDeps(){ return naukaDeps(przypadekNauki(state.naukaPrzypadek)); }
const nOcena = (id) => ((state.naukaPostep||{})[id]||{}).ocena || null;

/* Napis wartości pola obserwacji — z PRAWDZIWEGO słownika Bloku 8, nigdy z własnej kopii. */
function nWartosc(pole, v){
  const def = OBS_POLA[pole]; if(!def) return v;
  const w = (def.wartosci||[]).find(x=>x.id===v);
  return w ? t(w.pl, w.en) : v;
}
/* Wzorzec kierunku (opcja etapu „przewidywanie") opisany słowami formularza. */
function nWzorzec(o){
  const czesci = (o.fazy||[]).map(f=>{
    const kier = ['poziom','pion','torsja']
      .filter(pole=>f[pole] && f[pole]!=='zero')
      .map(pole=>nWartosc(pole, f[pole]));
    const opis = kier.length ? kier.join(" + ") : t("bez oczopląsu w tej pozycji","no nystagmus in this position");
    const faza = OBS_FAZY_OPIS[f.fazaId];
    return (o.fazy.length>1 && faza) ? `<b>${t(faza.pl,faza.en)}:</b> ${opis}` : opis;
  });
  const rel = o.relacja==='pierwsza' ? t("silniejszy w pierwszej pozycji","stronger in the first position")
    : o.relacja==='druga' ? t("silniejszy w drugiej pozycji","stronger in the second position")
    : o.relacja==='rowne' ? t("porównywalny w obu pozycjach","comparable in both positions") : null;
  return czesci.join(" · ") + (rel ? ` · ${rel}` : "");
}
function nOpcjaNapis(etapId, o){
  if(o.typ==='wlasna') return t(ODPOWIEDZI_WLASNE[o.v].pl, ODPOWIEDZI_WLASNE[o.v].en);
  if(etapId==='przewidywanie') return nWzorzec(o);
  if(etapId==='rozpoznanie') return `${CANALS[o.kanal].label} — ${t("strona","side")} ${t(SIDE[o.strona], o.strona==='P'?'right':'left')}`;
  if(etapId==='mechanizm'){ const k=kluczPrzypadku(przypadekNauki(state.naukaPrzypadek), nDeps());
    return variantLabels(k.interp.kanal||'posterior')[o.v]; }
  if(etapId==='manewr') return `${MANEUVERS[o.v].label} — ${MANEUVERS[o.v].desc}`;
  if(etapId==='kontrola') return t(AKCJE[o.v].pl, AKCJE[o.v].en);
  return o.v;
}

/* ── EKRAN 1: BIBLIOTEKA ── */
function nKafelPrzypadku(p){
  const ocena = nOcena(p.id);
  const stan = ocena ? t(OCENY[ocena].pl, OCENY[ocena].en) : t("nierozpoczęty","not started");
  return `<li><button type="button" class="nkafel nkafel--${ocena||'nowy'}" data-nprz="${p.id}" onclick="otworzPrzypadek('${p.id}')">
      <span class="nkafel__t">${t(p.tytulPl,p.tytulEn)}</span>
      <span class="nkafel__m"><span class="npill npill--poz">${t(POZIOMY[p.poziom].pl,POZIOMY[p.poziom].en)}</span>
        <span class="npill npill--rodz">${t(RODZAJE[p.rodzaj].pl,RODZAJE[p.rodzaj].en)}</span></span>
      <span class="nkafel__s">${stan}</span>
      <span class="nkafel__go" aria-hidden="true">›</span></button></li>`;
}
function nFiltrHTML(pole, slownik, ids){
  const akt = (state.naukaFiltr||{})[pole] || null;
  return `<div class="nfiltr" role="group" aria-label="${pole==='poziom'?t("Poziom","Level"):t("Rodzaj","Kind")}">
      ${ids.map(id=>`<button type="button" class="nfiltr__b" aria-pressed="${akt===id}"
          onclick="ustawFiltrNauki('${pole}','${id}')">${t(slownik[id].pl, slownik[id].en)}</button>`).join("")}
    </div>`;
}
function renderNaukaBib(){
  const filtr = state.naukaFiltr || {poziom:null, rodzaj:null};
  const lista = przypadki(filtr);
  const pb = postepBiblioteki(state.naukaPostep, filtr);
  const zapisBlad = state.naukaZapisBlad
    ? `<p class="nzapisblad">${t(POWODY_ZAPISU[state.naukaZapisBlad].pl, POWODY_ZAPISU[state.naukaZapisBlad].en)}</p>` : "";

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="goArea('start')" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Nauka — biblioteka przypadków","Learning — case library")}</b><span>${t("przewidywanie · decyzja · informacja zwrotna","prediction · decision · feedback")}</span></div></div>
    <div class="pagegrid ngrid">
      <div class="col col--ctl">
        <p class="nlead">${t("Każdy przypadek prowadzi przez sześć etapów: opis, przewidywanie oczopląsu, rozpoznanie, mechanizm, manewr i kontrolę. Odpowiedź trzeba wybrać ZANIM zobaczysz werdykt.",
                             "Every case runs through six stages: description, predicting the nystagmus, recognition, mechanism, maneuver and follow-up. You must choose an answer BEFORE you see the verdict.")}</p>
        ${nFiltrHTML('poziom', POZIOMY, POZIOM_IDS)}
        ${nFiltrHTML('rodzaj', RODZAJE, RODZAJ_IDS)}
        <ul class="nlista" data-nlista>${lista.map(nKafelPrzypadku).join("")}</ul>
      </div>
      <div class="col col--viz">
        <section class="card npostep" data-npostep>
          <h3>${t("Postęp","Progress")}</h3>
          <p class="npostep__l">${t(`Rozwiązane: ${pb.rozwiazane} z ${pb.wszystkich}`, `Solved: ${pb.rozwiazane} of ${pb.wszystkich}`)}</p>
          <p class="npostep__l">${t(`Z błędami: ${pb.zBledami}`, `With errors: ${pb.zBledami}`)}</p>
          ${pb.nieznaneWpisy ? `<p class="note">${t(`W pamięci są ${pb.nieznaneWpisy} wpisy przypadków, których już nie ma w bibliotece. Nie liczą się do postępu i nie są kasowane po cichu.`,
                                                    `Memory holds ${pb.nieznaneWpisy} entries for cases no longer in the library. They do not count toward progress and are not deleted silently.`)}</p>` : ""}
          ${zapisBlad}
          <p class="note">${t("Postęp zapisuje się w tej przeglądarce. Nie ma w nim niczego o pacjencie — przypadki są syntetyczne, a zapis niesie wyłącznie identyfikatory etapów i werdyktów.",
                              "Progress is stored in this browser. It contains nothing about a patient — the cases are synthetic and the record carries only stage and verdict identifiers.")}</p>
          <button type="button" class="recoalt nkasuj" onclick="wyczyscPostepNauki()">${t("Wyczyść postęp nauki","Clear learning progress")}</button>
        </section>
      </div>
    </div>
    <div class="disclaimer">${t('<b>Przypadki są syntetyczne.</b> Klucz odpowiedzi nie jest wpisany do biblioteki — liczy go ten sam model, którego używa ścieżka kliniczna, więc lekcja nie może rozejść się z aplikacją.',
                              '<b>The cases are synthetic.</b> The answer key is not written into the library — it is computed by the same model the clinical path uses, so the lesson cannot drift from the app.')}</div>`;
}

/* ── EKRAN 2: LEKCJA ── */
function nOsEtapow(){
  return ETAP_IDS.map((id,n)=>{
    const e = etapNauki(id);
    const zrobiony = !e.pyta || ((state.naukaOdp||{})[id] != null);
    const dostepny = wolnoDalej(state, ETAP_IDS[Math.max(0,n-1)]);
    return `<button type="button" class="netap${id===state.naukaEtap?' netap--biezacy':''}${zrobiony?' netap--gotowy':''}"
        aria-current="${id===state.naukaEtap}" ${dostepny?"":'disabled aria-disabled="true"'}
        onclick="goEtapNauki('${id}')"><span class="netap__n">${n+1}</span><span class="netap__t">${t(e.pl,e.en)}</span></button>`;
  }).join("");
}
/* ZAPIS OBSERWACJI jako ilustracja przypadku. ODSŁANIANY dopiero po przewidywaniu — inaczej etap
   przewidywania byłby pytaniem o to, co widać obok. */
function nZapisObserwacji(p){
  return probyPrzypadku(p).map(proba=>{
    const rek = p.obs[proba];
    const fazy = OBS_FAZY[proba]||[];
    const wiersze = [];
    for(const f of fazy){
      const kier = ['poziom','pion','torsja'].map(pole=>{
        const v = wartoscInstancji(rek, `${pole}#${f}`);
        return v ? `${t(OBS_POLA[pole].pytanie.pl.split(' —')[0], OBS_POLA[pole].pytanie.en.split(' —')[0])}: ${nWartosc(pole,v)}` : null;
      }).filter(Boolean);
      const op = OBS_FAZY_OPIS[f];
      wiersze.push(`<tr><th scope="row">${op?t(op.pl,op.en):f}</th><td>${kier.join("<br>")}</td></tr>`);
    }
    for(const pole of ['nasilenie','latencja','czasTrwania','meczliwosc','przebieg','pozycjaNeutralna','fiksacja']){
      const v = wartoscInstancji(rek, pole);
      if(!v) continue;
      wiersze.push(`<tr><th scope="row">${t(OBS_POLA[pole].pytanie.pl.split(' —')[0], OBS_POLA[pole].pytanie.en.split(' —')[0])}</th><td>${nWartosc(pole,v)}</td></tr>`);
    }
    return `<section class="card nzapis"><h4>${t("Zapis obserwacji","Observation record")} — ${proba}</h4>
        <table class="nzapis__t"><tbody>${wiersze.join("")}</tbody></table></section>`;
  }).join("");
}
function nOpcjeHTML(etapId, p, d){
  const wybrana = (state.naukaOdp||{})[etapId];
  const zamrozona = wybrana != null;
  return `<div class="nopcje">${opcjeEtapu(etapId, p, d).map(o=>
    `<button type="button" class="nopcja${o.typ==='wlasna'?' nopcja--wlasna':''}" aria-pressed="${wybrana===o.v}"
        ${zamrozona?'disabled aria-disabled="true"':''} data-nopcja="${o.v}"
        onclick="odpowiedzNauki('${etapId}','${String(o.v).replace(/'/g,"\\'")}')">
        <span class="nopcja__box" aria-hidden="true"></span>
        <span class="nopcja__txt">${nOpcjaNapis(etapId,o)}</span></button>`).join("")}</div>`;
}
/* Informacja zwrotna — DZIELONA NA TRZY, dokładnie jak chce dokument: Dlaczego / Pułapka / Co dalej. */
function nFeedbackHTML(etapId, p, d){
  const iz = informacjaZwrotna(etapId, p, d, state);
  if(!iz) return "";                                   // ← kryterium odbioru nr 1: nie ma czego odsłonić
  const kon = koniecPrzypadku(p, d, iz.klucz);
  const powod = iz.powod && POWODY_BLEDU[iz.powod] ? t(POWODY_BLEDU[iz.powod].pl, POWODY_BLEDU[iz.powod].en) : null;
  const moc = mocRozstrzygajaca(etapId, p, d, iz.klucz);
  const rozstrz = kon.rozstrzygajaca
    ? t(`Cechą rozstrzygającą jest tu: ${rozbijKlucz(kon.rozstrzygajaca.klucz).pole}.`,
        `The decisive feature here is: ${rozbijKlucz(kon.rozstrzygajaca.klucz).pole}.`)
    : t("Ten opis nie ma cechy, która sama rozstrzygałaby obraz.","This description has no feature that settles the picture on its own.");
  const coDalej = kon.nastepny.rodzaj==='proba'
      ? t(`Następny krok: wykonaj próbę, która rozdzieli pozostałe hipotezy (${kon.nastepny.proby.join(', ')}).`,
          `Next step: perform the provocation that separates the remaining hypotheses (${kon.nastepny.proby.join(', ')}).`)
    : kon.nastepny.rodzaj==='akcja' ? t(`Następny krok: ${AKCJE[kon.nastepny.akcja].pl}.`, `Next step: ${AKCJE[kon.nastepny.akcja].en}.`)
    : kon.nastepny.rodzaj==='manewr' ? t(`Następny krok: manewr ${MANEUVERS[kon.nastepny.manewr].label}.`, `Next step: the ${MANEUVERS[kon.nastepny.manewr].label} maneuver.`)
    : t("Następny krok: oceń przyczynę ośrodkową, zanim wrócisz do repozycji.","Next step: assess a central cause before returning to repositioning.");
  return `<section class="card nfeed nfeed--${iz.werdykt}" id="naukaFeedback" data-nwerdykt="${iz.werdykt}" tabindex="-1">
      <div class="nfeed__w">${t(WERDYKTY[iz.werdykt].pl, WERDYKTY[iz.werdykt].en)}</div>
      <p class="nfeed__o">${t(WERDYKTY[iz.werdykt].opisPl, WERDYKTY[iz.werdykt].opisEn)}${powod?` — ${powod}`:""}</p>
      ${(iz.niejednoznaczny || iz.nierozdzielone) ? `<p class="nfeed__nj" data-nniejedn="1">${iz.niejednoznaczny ? t("Na tym etapie model NIE ZNA jedynej odpowiedzi — więcej niż jedna jest do obrony, a wynik nie stoi na jednej wartości.","At this stage the model does NOT know a single answer — more than one is defensible, and the result does not rest on one value.") : t("Model nie ODDZIELA tej odpowiedzi od innych — obok trafnej stoją tu odpowiedzi, których ten opis nie pozwala podważyć.","The model does not SEPARATE this answer from the others — alongside the correct one stand answers this description cannot refute.")}</p>` : ""}
      ${moc.bezNosnikaBledu ? `<p class="nfeed__nj">${t("Na tym etapie nie ma odpowiedzi błędnej: sam wywiad nie niesie ani kanału, ani strony. Właśnie dlatego wykonuje się próbę.",
                                                       "There is no incorrect answer at this stage: the history alone carries neither canal nor side. That is exactly why the provocation is performed.")}</p>` : ""}
      <details class="ndet" open><summary>${t("Dlaczego","Why")}</summary><p>${rozstrz}</p></details>
      <details class="ndet"><summary>${t("Pułapka","The trap")}</summary><p>${t(p.pulapkaPl,p.pulapkaEn)}</p></details>
      <details class="ndet"><summary>${t("Co dalej","What next")}</summary><p>${coDalej}</p></details>
    </section>`;
}
function renderNaukaLekcja(){
  const p = przypadekNauki(state.naukaPrzypadek);
  if(!p){ renderNaukaBib(); return; }
  const d = nDeps();
  const etapId = state.naukaEtap || 'opis';
  const e = etapNauki(etapId) || ETAPY[0];
  const post = postepLekcji(p, state);
  const odslonZapis = ((state.naukaOdp||{}).przewidywanie != null);
  const wsk = wskazowka(etapId, p, d);
  const uzyta = (state.naukaWskazowki||[]).includes(etapId);
  const odmowa = state.naukaBlad && POWODY_ODMOWY[state.naukaBlad]
    ? `<p class="nodmowa" role="status">${t(POWODY_ODMOWY[state.naukaBlad].pl, POWODY_ODMOWY[state.naukaBlad].en)}</p>` : "";

  const wskTekst = wsk.rodzaj==='flaga' && FLAGI[wsk.flaga]
      ? `${t(RODZAJE_WSKAZOWEK.flaga.pl, RODZAJE_WSKAZOWEK.flaga.en)} ${t(FLAGI[wsk.flaga].pl, FLAGI[wsk.flaga].en)}`
      : `${t(RODZAJE_WSKAZOWEK[wsk.rodzaj].pl, RODZAJE_WSKAZOWEK[wsk.rodzaj].en)}${wsk.klucz?` (${rozbijKlucz(wsk.klucz).pole})`:""}`;

  const pytanie = e.pyta ? `<section class="card npyt" data-netap="${etapId}">
        <h3 class="npyt__q">${t(e.pytaniePl, e.pytanieEn)}</h3>
        <p class="npyt__w">${t(e.wstepPl, e.wstepEn)}</p>
        ${etapId==='kontrola' && p.kontrolaWynik ? `<p class="npyt__k"><b>${t("Wynik kontroli","Follow-up result")}:</b> ${t(wynikKontroli(p.kontrolaWynik).pl, wynikKontroli(p.kontrolaWynik).en)} — ${t(wynikKontroli(p.kontrolaWynik).pytaniePl, wynikKontroli(p.kontrolaWynik).pytanieEn)}</p>` : ""}
        ${nOpcjeHTML(etapId, p, d)}
        ${odmowa}
        <div class="nwsk">
          <button type="button" class="nwsk__b" aria-pressed="${uzyta}" onclick="wskazowkaNauki('${etapId}')">${t("Wskazówka","Hint")}</button>
          ${uzyta?`<p class="nwsk__t" data-nwskazowka="1">${wskTekst}</p>`:""}
        </div>
      </section>`
    : `<section class="card nopis">
        <h3>${t(p.tytulPl,p.tytulEn)}</h3>
        <p class="nopis__k">${t(p.kontekstPl,p.kontekstEn)}</p>
        <p class="npyt__w">${t(e.wstepPl, e.wstepEn)}</p>
      </section>`;

  const kolejny = ETAP_IDS[ETAP_IDS.indexOf(etapId)+1] || null;
  const nawigacja = `<div class="nnaw">
      <button class="recoalt" onclick="${ETAP_IDS.indexOf(etapId)===0?"wrocDoBiblioteki()":`goEtapNauki('${ETAP_IDS[ETAP_IDS.indexOf(etapId)-1]}')`}">${ETAP_IDS.indexOf(etapId)===0?t("Wróć do biblioteki","Back to the library"):t("Poprzedni etap","Previous stage")}</button>
      ${kolejny
        ? `<button class="${wolnoDalej(state,etapId)?'recoprimary':'recoalt'}" ${wolnoDalej(state,etapId)?'':'disabled aria-disabled="true"'} onclick="goEtapNauki('${kolejny}')">${t("Następny etap","Next stage")}</button>`
        : `<button class="${post.ukonczona?'recoprimary':'recoalt'}" ${post.ukonczona?'':'disabled aria-disabled="true"'} onclick="zakonczPrzypadek()">${t("Zakończ przypadek","Finish the case")}</button>`}
    </div>`;

  const wynik = post.ukonczona ? (()=>{ const w = wynikPrzypadku(p, d, state);
    return `<section class="card nwynik nwynik--${w.ocena}" data-nocena="${w.ocena}">
        <h4>${t("Wynik przypadku","Case result")}</h4>
        <p class="nwynik__o">${t(OCENY[w.ocena].pl, OCENY[w.ocena].en)} — ${t(OCENY[w.ocena].opisPl, OCENY[w.ocena].opisEn)}</p>
        <ul class="nwynik__l">${w.etapy.map(x=>`<li><b>${t(etapNauki(x.etap).pl, etapNauki(x.etap).en)}</b>: ${t(WERDYKTY[x.werdykt].pl, WERDYKTY[x.werdykt].en)}${x.niejednoznaczny?` — ${t("etap niejednoznaczny","ambiguous stage")}`:""}${x.zeWskazowka?` · ${t("ze wskazówką","with a hint")}`:""}</li>`).join("")}</ul>
      </section>`; })() : "";

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="wrocDoBiblioteki()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t(p.tytulPl,p.tytulEn)}</b><span>${t(POZIOMY[p.poziom].pl,POZIOMY[p.poziom].en)} · ${t(RODZAJE[p.rodzaj].pl,RODZAJE[p.rodzaj].en)} · ${t(`etap ${ETAP_IDS.indexOf(etapId)+1} z ${ETAP_IDS.length}`,`stage ${ETAP_IDS.indexOf(etapId)+1} of ${ETAP_IDS.length}`)}</span></div></div>
    <nav class="nos" aria-label="${t("Etapy lekcji","Lesson stages")}">${nOsEtapow()}</nav>
    <div class="pagegrid ngrid">
      <div class="col col--ctl">
        ${etapId!=='opis' ? `<p class="nkontekst">${t(p.kontekstPl,p.kontekstEn)}</p>` : ""}
        ${pytanie}
        ${nFeedbackHTML(etapId, p, d)}
        ${nawigacja}
      </div>
      <div class="col col--viz">
        ${odslonZapis ? nZapisObserwacji(p) : `<section class="card nzaslona" data-nzaslona="1">
            <h4>${t("Zapis obserwacji","Observation record")}</h4>
            <p class="note">${t("Zapis odsłoni się po Twoim przewidywaniu. To jest cały sens tego etapu: przewidujesz, zanim zobaczysz.",
                                "The record will appear after your prediction. That is the whole point of this stage: you predict before you see.")}</p>
          </section>`}
        ${wynik}
      </div>
    </div>
    <div class="disclaimer">${t('<b>Przypadek jest syntetyczny.</b> Rozwiązywanie go nie zapisuje niczego o pacjencie i nie zmienia żadnego pola sesji klinicznej.',
                              '<b>The case is synthetic.</b> Solving it records nothing about a patient and changes no field of the clinical session.')}</div>`;
}


/* ============ LABORATORIUM NEUROOTOLOGICZNE (Blok 14) ============
   Dwa ekrany: LISTA EKSPERYMENTÓW i EKSPERYMENT. Układ „komputer" z dokumentu — panel parametrów
   stale widoczny obok obrazu — powstaje z tej samej siatki `.pagegrid`, co Bloki 10-13, więc na
   telefonie kolumny znikają i zostaje jeden eksperyment na ekranie.

   ═══ CZEGO TU NIE MA I DLACZEGO ═══
   Werdyktu ani lokalizacji. `clinicalReadout` je liczy, ale w Laboratorium kierunek wnioskowania
   jest ODWROTNY niż w ścieżce klinicznej: to użytkownik ustawia patologię suwakami, więc „werdykt:
   ośrodkowy" nad tymi suwakami jest echem wejścia, a nie wynikiem — kartą rozpoznania, która
   powtarza to, co przed chwilą wpisano. Model trzyma listę pól zakazanych (`POLA_ZAKAZANE_W_LAB`),
   a wyrocznia DOM sprawdza, że żadne z nich tu nie trafiło. */

function lDeps(){ return labDeps(); }
const lPacjent = (id) => pacjentStanowiska(state, id);
const lObraz = (id) => lDeps().obraz(lPacjent(id));

function lKafelEksperymentu(e){
  return `<li><button type="button" class="lkafel" data-leks="${e.id}" onclick="otworzEksperymentLab('${e.id}')">
      <span class="lkafel__t">${t(e.pl,e.en)}</span>
      <span class="lkafel__q">${t(e.pytaniePl,e.pytanieEn)}</span>
      <span class="lkafel__go" aria-hidden="true">›</span></button></li>`;
}
function renderLabLista(){
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="goArea('start')" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t("Laboratorium neurootologiczne","Neurotology laboratory")}</b><span>${t("fizjologia na stanowisku — nie badanie pacjenta","physiology at a bench — not a patient examination")}</span></div></div>
    <div class="pagegrid lgrid">
      <div class="col col--ctl">
        <p class="llead">${t("Każdy eksperyment zaczyna się od scenariusza referencyjnego i wraca do niego jednym przyciskiem. Zmiana parametru jest MIERZONA: aplikacja pokazuje, które badanie zmieniło wynik — a kiedy nic się nie zmieniło, mówi, czego brakuje, żeby ten parametr było widać.",
                             "Every experiment starts from a reference scenario and returns to it with one button. A parameter change is MEASURED: the app shows which examination changed its result — and when nothing changed, it says what is missing for that parameter to become visible.")}</p>
        <ul class="llista" data-llista>${EKSPERYMENTY.map(lKafelEksperymentu).join("")}</ul>
      </div>
      <div class="col col--viz">
        <section class="card lozakres">
          <h3>${t("Co to jest, a czym nie jest","What this is, and what it is not")}</h3>
          <p>${t("Laboratorium jest stanowiskiem fizjologicznym: ustawiasz liczby modelu i patrzysz, co robią z obrazem klinicznym. NIE jest narzędziem rozpoznania — kierunek wnioskowania jest tu odwrotny niż przy pacjencie.",
                 "The laboratory is a physiology bench: you set the model’s numbers and watch what they do to the clinical picture. It is NOT a diagnostic tool — the direction of reasoning here is the reverse of the one at the bedside.")}</p>
          <p class="note">${t("Podstawowa diagnostyka nie potrzebuje tego obszaru. Przebieg wywiad → próba → oczopląs → interpretacja → manewr → kontrola domyka się bez wejścia tutaj i nic tu ustawionego go nie zmienia.",
                              "Basic diagnostics does not need this area. The pathway history → provocation → nystagmus → interpretation → maneuver → follow-up closes without entering here, and nothing set here changes it.")}</p>
        </section>
      </div>
    </div>
    <div class="disclaimer">${t('<b>Model jest uproszczeniem.</b> Opis każdego parametru mówi, gdzie leży granica tego uproszczenia — bo suwak, który zachowuje się inaczej niż fizjologia, uczy nieprawdy szybciej niż brak suwaka.',
                              '<b>The model is a simplification.</b> Every parameter’s description states where that simplification ends — because a slider that behaves unlike physiology teaches falsehood faster than no slider at all.')}</div>`;
}

/* ── PANEL PARAMETRÓW (kryterium odbioru nr 2) ──
   Każdy parametr rozwija się do pełnego opisu: co to jest, jednostka, znaczenie krańców, a gdy
   model ma w tym miejscu ZMIERZONĄ granicę — także ona. */
function lOpisParametru(key){
  const p = PARAMETRY[key]; if(!p) return "";
  return `<div class="lopis" data-lopis="${key}">
      <p class="lopis__co">${t(p.coToPl,p.coToEn)}</p>
      <dl class="lopis__dl">
        <dt>${t("Jednostka","Unit")}</dt><dd data-ljedn>${t(p.jednostkaPl,p.jednostkaEn)}</dd>
        <dt>${t("Zakres","Range")}</dt><dd data-lzakres>${t(p.zakresPl,p.zakresEn)}</dd>
      </dl>
      ${p.granicaPl?`<p class="lgranica" data-lgranica="1">${t(p.granicaPl,p.granicaEn)}</p>`:""}
    </div>`;
}
function lSuwak(key){
  const spec = lDeps().spec(key); if(!spec) return "";
  const p = PARAMETRY[key], pac = lPacjent();
  const v = pac ? pac[key] : spec.def;
  const rozwiniety = state.labParametr===key;
  const pole = spec.type==="select"
    ? `<div class="lwybor">${[["null",t("brak","none")],["L",t("lewa","left")],["P",t("prawa","right")]].map(([o,lab])=>
        `<button type="button" class="lwybor__b" aria-pressed="${String(v)===o||(v==null&&o==='null')}" onclick="ustawParametrLab('${key}','${o}')">${lab}</button>`).join("")}</div>`
    : `<input type="range" class="lsuwak" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${v}"
         aria-label="${t(p.pl,p.en)}" oninput="ustawParametrLab('${key}',this.value)">`;
  return `<div class="lparam" data-lparam="${key}">
      <div class="lparam__g">
        <button type="button" class="lparam__n" aria-expanded="${rozwiniety}" onclick="opisParametruLab('${key}')">${t(p.pl,p.en)}<span class="lparam__i" aria-hidden="true">?</span></button>
        <span class="lparam__v" data-lwart="${key}">${fmtParamVal(v,spec)}</span>
      </div>
      ${pole}
      ${rozwiniety?lOpisParametru(key):""}
    </div>`;
}

/* ── CO SIĘ ZMIENIŁO (kryterium odbioru nr 3) ── */
function lSkutekHTML(){
  const s = state.labOstatniaZmiana;
  if(!s) return `<section class="card lskutek lskutek--pusty" data-lskutek="0">
      <h4>${t("Co się zmieniło","What changed")}</h4>
      <p class="note">${t("Przesuń dowolny parametr — tutaj pojawi się pomiar: które badanie zmieniło wynik i które zdanie opisu przyszło albo zniknęło.",
                          "Move any parameter — a measurement will appear here: which examination changed its result, and which sentence of the findings arrived or disappeared.")}</p>
    </section>`;
  const p = PARAMETRY[s.parametr];
  const naglowek = t(`Zmieniono: ${p?p.pl:s.parametr}`, `Changed: ${p?p.en:s.parametr}`);
  if(s.bezSkutku){
    const powod = POWODY_BEZ_SKUTKU[s.powodBezSkutku];
    return `<section class="card lskutek lskutek--nic" data-lskutek="1" data-lbezskutku="1">
        <h4>${t("Co się zmieniło","What changed")}</h4>
        <p class="lskutek__p">${naglowek}</p>
        <p class="lskutek__nic">${t("W obrazie klinicznym nie zmieniło się nic — i to jest wynik, nie usterka.",
                                    "Nothing changed in the clinical picture — and that is a result, not a fault.")}</p>
        <p class="lskutek__powod">${powod?t(powod.pl,powod.en):""}</p>
      </section>`;
  }
  const lista = s.obserwable.filter(id=>wolnoPokazac(id)).map(id=>{
    const o = obserwabla(id);
    return `<li data-lobs="${id}"><b>${t(o.pl,o.en)}</b><span>${t(o.badaniePl,o.badanieEn)}</span></li>`;
  }).join("");
  return `<section class="card lskutek" data-lskutek="1">
      <h4>${t("Co się zmieniło","What changed")}</h4>
      <p class="lskutek__p">${naglowek}</p>
      <ul class="lskutek__l">${lista}</ul>
      ${s.zdaniaDodane.length?`<div class="lzdania lzdania--plus"><span class="eyebrow">${t("Pojawiło się w opisie badania","Appeared in the findings")}</span>
        <ul>${s.zdaniaDodane.map(z=>`<li>${z}</li>`).join("")}</ul></div>`:""}
      ${s.zdaniaZniklo.length?`<div class="lzdania lzdania--minus"><span class="eyebrow">${t("Zniknęło z opisu badania","Disappeared from the findings")}</span>
        <ul>${s.zdaniaZniklo.map(z=>`<li>${z}</li>`).join("")}</ul></div>`:""}
    </section>`;
}

/* ── OBRAZ KLINICZNY STANOWISKA — bez werdyktu i bez lokalizacji ── */
function lObrazHTML(id){
  const r = lObraz(id);
  const zd = (r.findings||[]).map(z=>`<li>${z}</li>`).join("");
  return `<section class="card lobraz" data-lobraz="${id||state.labStanowisko}">
      <h4>${t("Obraz kliniczny","Clinical picture")} — ${t(STANOWISKA[id||state.labStanowisko].pl, STANOWISKA[id||state.labStanowisko].en)}</h4>
      <ul class="lobraz__l">${zd||`<li>${t("bez odchyleń","no abnormalities")}</li>`}</ul>
      <p class="note">${t("To jest opis BADANIA wyliczony z ustawionych liczb — nie rozpoznanie. Rozpoznanie stawia się u pacjenta, a nie na stanowisku.",
                          "This is a description of the EXAMINATION computed from the numbers you set — not a diagnosis. A diagnosis is made in a patient, not at a bench.")}</p>
    </section>`;
}

function renderLabEksp(){
  const e = eksperyment(state.labEksperyment);
  if(!e){ renderLabLista(); return; }
  const D = lDeps();
  const ref = D.pacjentReferencyjny(e.referencja);
  const odch = odchyleniaZeSkutkiem(lPacjent(), ref, D);
  const grupy = D.grupy();

  const stanowiska = STANOWISKO_IDS.map(id=>
    `<button type="button" class="lstan" aria-pressed="${state.labStanowisko===id}" data-lstan="${id}" onclick="ustawStanowiskoLab('${id}')">${t(STANOWISKA[id].pl,STANOWISKA[id].en)}</button>`).join("");

  const glowne = e.parametry.map(lSuwak).join("");
  const pozostale = grupy.map(g=>{
    const klucze = g.klucze.filter(k=>!e.parametry.includes(k));
    if(!klucze.length) return "";
    return `<details class="lgrupa"><summary>${g.grupa}</summary>
        <p class="lgrupa__h">${g.pomoc||""}</p>${klucze.map(lSuwak).join("")}</details>`;
  }).join("");

  const odchHTML = odch.length
    ? `<ul class="lodch">${odch.map(o=>{
        const p = PARAMETRY[o.key];
        const sk = o.skutekPowrotu;
        const co = sk.bezSkutku
          ? t("powrót tego parametru nic by nie zmienił","putting this one back would change nothing")
          : t(`powrót zmieniłby: ${sk.obserwable.filter(wolnoPokazac).map(x=>obserwabla(x).pl).join(", ")}`,
              `putting it back would change: ${sk.obserwable.filter(wolnoPokazac).map(x=>obserwabla(x).en).join(", ")}`);
        return `<li data-lodch="${o.key}"><b>${t(p.pl,p.en)}</b>: ${o.referencja==null?"—":o.referencja} → ${o.teraz==null?"—":o.teraz}<em>${co}</em></li>`;
      }).join("")}</ul>`
    : `<p class="note" data-lodch-brak="1">${t("Stanowisko stoi dokładnie na scenariuszu referencyjnym.","The bench is exactly at the reference scenario.")}</p>`;

  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="wrocDoEksperymentow()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${t(e.pl,e.en)}</b><span>${t("scenariusz referencyjny","reference scenario")}: ${D.scenariusz(e.referencja).label}</span></div></div>
    <nav class="lstany" aria-label="${t("Stanowiska","Benches")}">${stanowiska}
      <button type="button" class="lstan lstan--por" aria-pressed="${!!state.labPorownanie}" onclick="przelaczPorownanieLab()">${t("Porównaj A i B","Compare A and B")}</button></nav>
    <div class="pagegrid lgrid">
      <div class="col col--ctl">
        <section class="card lpyt"><h3>${t(e.pytaniePl,e.pytanieEn)}</h3></section>
        <section class="card lparams" data-lparams>
          <h4>${t("Parametry eksperymentu","Experiment parameters")}</h4>
          ${glowne}
          <div class="lreszta"><span class="eyebrow">${t("Pozostałe parametry modelu","The model’s other parameters")}</span>${pozostale}</div>
        </section>
        <section class="card lref">
          <h4>${t("Odchylenia od referencji","Deviations from the reference")}</h4>
          ${odchHTML}
          <button type="button" class="recoalt lreset" onclick="resetLab()">${t("Wróć do scenariusza referencyjnego","Return to the reference scenario")}</button>
        </section>
      </div>
      <div class="col col--viz">
        ${lSkutekHTML()}
        ${lObrazHTML(state.labStanowisko)}
        ${state.labPorownanie?(()=>{ const por = porownanie(lObraz('A'), lObraz('B'));
          return `${lObrazHTML(state.labStanowisko==='A'?'B':'A')}
            <section class="card lpor" data-lpor="1"><h4>${t("Czym się różnią","How they differ")}</h4>
              ${por.identyczne?`<p class="note">${t("Oba stanowiska dają identyczny obraz.","Both benches give an identical picture.")}</p>`
                : `<ul class="lpor__l">${por.rozne.filter(wolnoPokazac).map(id=>`<li>${t(obserwabla(id).pl,obserwabla(id).en)}</li>`).join("")}</ul>`}
            </section>`; })():""}
      </div>
    </div>
    <div class="disclaimer">${t('<b>Stanowisko, nie pacjent.</b> Aplikacja nie stawia tu rozpoznania i nie pokazuje werdyktu — pokazuje, co zmieniło się w BADANIU, gdy zmieniłeś liczbę w modelu.',
                              '<b>A bench, not a patient.</b> The app makes no diagnosis here and shows no verdict — it shows what changed in the EXAMINATION when you changed a number in the model.')}</div>`;
}

export { renderObs, syncVizBar, vizControls, pozySekwencja, perspNota, earMark, renderTriage, renderStart, startGo, FLIP_ICO, SIZE_LABELS, SIZE_NOTE, _otoStart, headDial, startDialNysIn, startDialNys, backHeadSVG, startBackHeadTurn, profileMarks, frontFace, figProj, posture, CANAL_PATHS, labyrinth, placeOtolith, eyesSVG, nysOffset, startNys, arrowGlyph, diagCanalSVG, startDiagOtolith, fmt, fmtClock, computeManSim, currentManSim, manStepEnv, stepXiPeak, manPhi, phiToFrac, manFractions, guideNysSeconds, setupGuideAnim, updateGoBtn, toggleTimer, resetTimer, adjust, setStepSeconds, initGuideSlider, flipGuide, sizeFlip, render, renderSetup, renderGuide, renderDiag, hintsNysLabel, hintsVerdictHTML, renderHints, hintsCompPatient, compStage, compRowHTML, compNoteHTML, hintsCompPanel, hintsSupplHTML, refreshHintsComp, neuroNysParams, startNeuroNys, hitSVG, startHIT, hitSaccadeDir, hitPushLabel, hintsHitSpecOf, hitLabel, skewSVG, startSkew, skewLabel, hintsVerdictBlock, nerveLesionSummary, hintsCustomPanel, hintsQuizBanner, hintsReadoutHTML, refreshHintsCustom, scdsRestNote, scdsLabel, flipDiagMech, flipPhases, sideSel, webglAvailable, renderNaukaBib, renderNaukaLekcja, renderLabLista, renderLabEksp };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { renderObs, syncVizBar, renderTriage, startGo, renderStart, headDial, startDialNysIn, startDialNys, backHeadSVG, startBackHeadTurn, profileMarks, frontFace, figProj, posture, labyrinth, placeOtolith, eyesSVG, nysOffset, startNys, arrowGlyph, diagCanalSVG, startDiagOtolith, computeManSim, currentManSim, manStepEnv, stepXiPeak, manPhi, manFractions, guideNysSeconds, setupGuideAnim, updateGoBtn, toggleTimer, resetTimer, adjust, setStepSeconds, initGuideSlider, flipGuide, sizeFlip, render, renderSetup, renderGuide, renderDiag, hintsNysLabel, hintsVerdictHTML, renderHints, hintsCompPatient, compNoteHTML, hintsCompPanel, hintsSupplHTML, refreshHintsComp, neuroNysParams, startNeuroNys, hitSVG, startHIT, hitSaccadeDir, hitPushLabel, hintsHitSpecOf, hitLabel, skewSVG, startSkew, skewLabel, hintsVerdictBlock, nerveLesionSummary, hintsCustomPanel, hintsQuizBanner, hintsReadoutHTML, refreshHintsCustom, scdsRestNote, scdsLabel, flipDiagMech, flipPhases, sideSel });
