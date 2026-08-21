// Renderer SVG + ekrany (setup/guide/diag/HINTS) + animacje (oczopląs, HIT, skew, otolit).
import { Vestibular } from '../engine/vestibular.js';
import { Scene3D } from '../engine/scene3d.js';
import { NeuroVOR } from '../engine/neuro-vor.js';
import { SIDE, sideN, otherSide, yacovino, gufoniApo, MANEUVERS, CANALS, CANAL_OF, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope,
         stepHeadQ, poseSpec, gravArrowFor, sizeRadius, maneuverTimeline, maneuverSim, computeManSim, manStepEnv, stepXiPeak, manPhi, phiToFrac,
         manExitStep, manFractions, guideNysSeconds, DIAG, variantLabels, recommend, baranyClassify, BLT_HISTORY, SCEN_DRIVEN, nullScan, nullYawOf,
         bltInit, ensembleSim, sessionPreview, XI_CARD, bltZones, bltDirWord, ldtPhases, PHASE_OF, sessionInit, SESSION_REST, MECHS_BY_PHENO, mechOf,
         persistentOf, mechLabels, SHORT_PHI0, PRIORS, examPhaseNys, examAnswerKey, TEVS_REST, tevsDemoSim, JAM_DEMO, jamDemo, poseNeck, HC_TILT_TXT } from '../pose/maneuvers.js';
import { spvTrace } from '../engine/spv-bridge.js';   // D8/V22: pierwsza konsumpcja UI mostu SPV (V13)
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
import { flowStatuses, resumeStepId, resumeSummary } from '../app/flow-model.js';
import { flowDeps } from '../app/flow-deps.js';
import { activeQuestions, nextQuestionId, triageComplete, triageResult, czerwoneFlagi } from '../app/triage-model.js';
import { t } from '../i18n.js';
const tr = t;   // alias tlumaczenia dla funkcji HINTS z lokalnym 't' (string/param) — 'tr' (modul-scope) NIE jest przeslaniany, wiec nie koliduje w bundlu

// ikona „obróć kartę" (flip) — używana w Repozycji i Diagnostyce
const FLIP_ICO = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 8a8 8 0 0 1 13-2.5M20 16a8 8 0 0 1-13 2.5M17 3v4h-4M7 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// ROZMIAR ZŁOGU (UI) — mnożnik promienia r, SPÓJNY z SIZE_R w module Vestibular.
const SIZE_LABELS={ get small(){return t("mała","small");}, get medium(){return t("średnia","medium");}, get big(){return t("duża","large");} };
const SIZE_NOTE={ get small(){return t("drobne/wolno osiadające","fine/slow-settling");}, get medium(){return t("typowe","typical");}, get big(){return t("duże/ciężkie","large/heavy");} };
// (SIZE_NOTE usunięte 2026-08-06 — było zdefiniowane i eksportowane, ale NIGDZIE nieużywane.
//  Zastąpione liczbą: Vestibular.sizeUm(size) daje RÓWNOWAŻNĄ ŚREDNICĘ kłębka w µm, wyprowadzoną
//  z tauP przez prawo Stokesa — klinicysta dostaje wielkość porównywalną z piśmiennictwem
//  zamiast etykiety bez jednostki.)
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
      const tors = t(" + skrętny"," + torsional");   // V26: maska anterior.t zdjęta — kanał przedni też ma skręt (0,74 pionu, ku uchu choremu)
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
function startDialNysIn(container, nys, envOv){
  const irises=[...container.querySelectorAll(".dial-iris")]; if(!irises.length) return;
  const token=(container.__dialTok=(container.__dialTok||0)+1);   // restart: starsza pętla się zakończy
  const cam=Scene3D.CAMERAS.topDownBehind, flip=cam.up[2]<0?-1:1;
  const a=nys.anat||{h:0,v:0,t:0}, amp=(nys.strength||1)*(nys.fatigue==null?1:nys.fatigue);   // fatigue: męczliwość przy powtórzeniach (Dix-Hallpike)
  const hx=a.h*flip*2.2*amp, upY=a.v*2*amp, rot=a.t*flip*12*amp;   // poziom (odbity) / pion / skręt (odbity)
  const fast=0.17, T=720, start=vizPeek();   // zegar wizualizacji (Blok 7: pauza/krok) zamiast performance.now()
  // D7/V21: envOv = jawny KSZTAŁT obwiedni 0..1 (suma punktowa pacjenta wielozmianowego — amplitudę
  // niesie strength jak dotąd); brak parametru = dokładnie dotychczasowa ścieżka (własna symulacja).
  const {env, tEnd} = envOv || xiEnvelope(engineXi(nys.canal, nys.side, nys.persistent, nys.q, nys.init, undefined, nys.neck));   // V24: kark obwiedni (jak startNys)
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
  const label={supineHang:t("Na plecach, głowa w dół ~20°","Supine, head down ~20°"),supineDeepHang:t("Na plecach, głowa głęboko w dół ~30°","Supine, head deep down ~30°"),supineFlex:t(`Na plecach, głowa przygięta ~${HC_TILT_TXT}°`,`Supine, head flexed ~${HC_TILT_TXT}°`),supineFlat:t("Na plecach, głowa płasko","Supine, head flat"),supineChin:t("Na plecach, broda do klatki","Supine, chin to chest"),prone:t("Na brzuchu","Prone"),sideL:t("Na boku lewym","On the left side"),sideR:t("Na boku prawym","On the right side")}[body]||"";
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
  const ov = (nys.ov && nys.ov.amp>0) ? nys.ov : null;   // N7/D6: toniczna nakladka AVS — bez obwiedni xi, nie wygasa
  const {env, tEnd} = envOv || xiEnvelope(engineXi(canal, side, nys.persistent, nys.q, nys.init, undefined, nys.neck));   // V24: kark obwiedni (nys.neck — brak pola = stara ścieżka)
  loopRAF((rnow)=>{ const now=vizNow(rnow);
    if(container.__nysTok!==token || !document.body.contains(container)) return false;
    const elapsed=(now-start)/1000;                      // sekundy
    if(elapsed>tEnd+0.4 && !ov){ for(const g of irises) g.setAttribute("transform","translate(0 0) rotate(0)"); return false; } // koniec — bez zapętlenia (nakladka: petla trwa)
    const e=elapsed>tEnd?0:env(elapsed), p=((now-start)%T)/T, oo=nysOffset(p,fast), o=oo*e;
    let x=0,y=0,rot=0;
    if(nys.kind==="horizontal"){ x=o*A*nys.dir; } else { y=-o*Aup*vdir; rot=o*tors*nys.dir; }
    if(ov) x += oo*ov.amp*ov.dir;                        // sklad TONICZNY: stala amplituda, ta sama faza pily
    for(const g of irises){ const cx=+g.dataset.cx, cy=+g.dataset.cy;
      g.setAttribute("transform",`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)} ${cx} ${cy})`); }
    return true;
  });
}
function arrowGlyph(nys){
  if(nys.kind==="upbeatTorsional"){ const va=(nys.vdir==null?1:nys.vdir)<0?"↓":"↑";
    if(!nys.dir) return va;                                  // czysty pionowy (np. kanał przedni — downbeat bez torsji)
    return nys.dir<0?`${va} ↺`:`${va} ↻`; }
  if(!nys.dir) return "•";                                   // poziomy NIEROZSTRZYGNIĘTY (Bow & Lean: wododział / kanał pusty — ocena II V5)
  return nys.dir<0?"⟵":"⟶";
}

/* ============ SVG: mapa wododziału Bow & Lean (ocena II, V5/W5) ============
   Łuk kanału poziomego 3–267.3° ze strefami odpowiedzi BLT policzonymi Z SILNIKA (bltZones —
   przemiatanie φ₀ z adhezją świeżego depozytu): zielona = pełna reguła Choung (skłon→chora
   I odchylenie→zdrowa), bursztynowa = wzorzec odwrócony, szara = mieszany; wyblakłe = odpowiedź
   podprogowa (< XI_CARD). Mapa opisuje geometrię TEGO modelu (jeden atlas, ramka Reida). */
function bltWatershedSVG(side, curPhi0){
  const pts=bltZones(side);
  const cx=186, cy=126, R=88, W=20;   // środek przesunięty w prawo: cały opis mieści się po lewej (wcześniej „ujście (267°)” wychodziło poza viewBox)
  const pt=(deg,r)=>{ const a=deg*Math.PI/180; return {x:cx+(r??R)*Math.sin(a), y:cy-(r??R)*Math.cos(a)}; };
  const arc=(a0,a1,color,op)=>{ const p0=pt(a0), p1=pt(a1);
    return `<path d="M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} A ${R} ${R} 0 ${(a1-a0)>180?1:0} 1 ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}" stroke="${color}" stroke-width="${W}" fill="none" stroke-linecap="butt" opacity="${op}"/>`; };
  const segs=[]; let run=null;
  for(const p of pts){ const key=p.zone+(p.sub?"#s":"");
    if(!run || run.key!==key){ run={key, zone:p.zone, sub:p.sub, a0:p.phi0-2.5, a1:p.phi0+2.5}; segs.push(run); }
    else run.a1=p.phi0+2.5; }
  const col={choung:"#3a8f6f", reversed:"#b0813f", mixed:"#8a93a6"};
  const arcs=segs.map(s=>arc(Math.max(3,s.a0), Math.min(267.3,s.a1), col[s.zone], s.sub?0.33:0.95)).join("");
  const tick=(deg)=>{ const p0=pt(deg,R-12), p1=pt(deg,R+12);
    return `<line x1="${p0.x.toFixed(1)}" y1="${p0.y.toFixed(1)}" x2="${p1.x.toFixed(1)}" y2="${p1.y.toFixed(1)}" stroke="var(--muted)" stroke-width="1.4"/>`; };
  const label=(deg,txt,r)=>{ const p=pt(deg,r??R+24), anchor=p.x>cx+6?"start":(p.x<cx-6?"end":"middle");
    return `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" font-size="10" fill="var(--muted)" text-anchor="${anchor}" dominant-baseline="middle">${txt}</text>`; };
  /* Wododział (190°) i spoczynek (199,8°) dzieli 9,8° — przy R=88 to ~15 px łuku na ~100 px tekstu,
     więc PROMIENIOWO napisy nachodziły na siebie. Idą w wolny lewy dół jako pionowy stos z odnośnikami
     do znaczników; odnośniki się nie przecinają (spoczynek wyżej, wododział niżej). Sama mapa bez zmian. */
  const LX=140, Y_REST=230, Y_WSHED=248;
  const leader=(deg,r0,y1)=>{ const p=pt(deg,r0);
    return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${LX+4}" y2="${y1}" stroke="var(--muted)" stroke-width="1" opacity=".7"/>`; };
  const stackLabel=(y,txt)=>`<text x="${LX}" y="${y}" font-size="10" fill="var(--muted)" text-anchor="end" dominant-baseline="middle">${txt}</text>`;
  const rest=pt(199.8);
  const restDot=`<circle cx="${rest.x.toFixed(1)}" cy="${rest.y.toFixed(1)}" r="4" fill="#D4DEE8" stroke="#22303e" stroke-width="1.2"/>`;
  const cur = curPhi0!=null ? (()=>{ const c=pt(curPhi0);
    return `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="6" fill="var(--primary)" stroke="#fff" stroke-width="2"/>`; })() : "";
  return `<svg viewBox="0 0 300 264" style="width:100%;max-width:340px;display:block;margin:0 auto">
    ${arcs}
    ${tick(3)}${tick(267.3)}${tick(190)}
    ${label(3, t("bańka (φ=3°)","ampulla (φ=3°)"))}
    ${label(267.3, t("ujście (267°)","exit (267°)"), R+18)}
    ${leader(199.8, R+11, Y_REST)}${stackLabel(Y_REST, t("spoczynek 199,8°","rest 199.8°"))}
    ${leader(190, R+12, Y_WSHED)}${stackLabel(Y_WSHED, t("wododział skłonu 190°","bow watershed 190°"))}
    ${restDot}
    ${cur}${curPhi0!=null?label(curPhi0, "φ₀", R-30):""}
    <text x="${cx}" y="${cy-6}" font-size="11" fill="var(--muted)" text-anchor="middle">${t("kanał poziomy","horizontal canal")}</text>
    <text x="${cx}" y="${cy+10}" font-size="10" fill="var(--muted)" text-anchor="middle">${t("strona","side")} ${side==="P"?t("prawa","right"):t("lewa","left")}</text>
  </svg>`;
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
  if(variant==="canalo" || variant==="short"){   // D10/V15: ramię bańkowe rysuje się jak swobodny złóg
    cuptip.style.display="none";                 // złóg swobodny w świetle kanału
    cupula.setAttribute("transform","rotate(0 62 96)");
    // REALNE φ(t) z silnika (simulateCanalith): po latencji cząstka wędruje wg grawitacji
    // i zatrzymuje się (wyjście do ŁAGIEWKI / spoczynek). Bez sztucznej pętli.
    // D4/V16, "short": ta sama gałąź z init.arm — φ ujemne klamruje się do 0 na ścieżce SVG,
    // więc cząstka siedzi przy bańce (uczciwy region ramienia bańkowego bez nowej geometrii rysunku).
    const sim = engineXi(canal, side, false, provokeQ(canal, side), variant==="short"?{arm:"short", phi0:SHORT_PHI0, settled:false}:undefined);   // [{t,xi,phi,exited}], phi w stopniach
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
    // cupulo | light: brak wolnej cząstki — bańka się odgina. Dla "light" ta sama animacja jest UCZCIWA:
    // ziaren nie rysujemy (light = brak złogu), a obwiednia |ξ| light ≡ cupulo (lustro bit-w-bit, V12).
    particle.style.display="none";               // złóg na osklepku — bańka się odgina
    // odgięcie osklepka wg ξ(t) z silnika (uporczywe — kupulopatia nie wygasa, dopóki pozycja trwa)
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
/* ═══ WARSTWA OBJAWOWA (ocena II V17/D5) ═══
   Dwie liczby z TEJ SAMEJ fizyki, która napędza oczopląs — nie z osobnego modelu objawów:
     zawrót   ~ bieżące |ξ| (odchylenie osklepka),
     nudności ~ saturacja skumulowanej DAWKI: 100·(1−exp(−Σ|ξ|·Δt / NAUS_I0)), NAUS_I0 = 25 ξ·s.
   Wykładnicza saturacja, a nie suma obcięta do 100 — dawka ma fizjologiczny plafon, a nie „railuje"
   się na sztywnej granicy. Próg widoczności zawrotu = 0,03, ta sama konwencja co odcięcie 3 % szczytu
   w xiEnvelope, żeby pasek nie drgał tam, gdzie animacja już nic nie rysuje.
   `man.cum` NIE ISTNIEJE w tej gałęzi (computeManSim zwraca sim/dt/segs/exited — sprawdzone), więc
   dawkę liczymy Z `man.sim` i pamiętamy przy obiekcie symulacji. Świadomie NIE dokładam pola do
   computeManSim: ten plik jest wspólny z main i trzymam go bit-w-bit, a suma skumulowana jest
   wielkością PREZENTACJI, nie stanem fizyki.
   TO NIE JEST POMIAR KLINICZNY — karta mówi to wprost. */
const SYM_FLOOR = 0.03, NAUS_I0 = 25;
function symAt(man, tAbs){
  if(!man || !man.sim || !man.sim.length) return {dizz:0, naus:0};
  if(!man._cum){                                    // budowane RAZ na obiekt symulacji (cache klucza man)
    const c = new Array(man.sim.length); let acc = 0;
    for(let i=0;i<man.sim.length;i++){ acc += Math.abs(man.sim[i].xi) * man.dt; c[i] = acc; }
    man._cum = c;
  }
  const i = Math.min(man.sim.length-1, Math.max(0, Math.round(tAbs/man.dt)));
  return { dizz: Math.abs(man.sim[i].xi), naus: 100*(1-Math.exp(-(man._cum[i]||0)/NAUS_I0)) };
}
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
  const holdAdh = cupuloAdh;                  // krok 1 = złóg WBITY w osklepek — TRZYMA się (bez odklejania/wędrówki). Warunkowane MECHANIZMEM, nie exited (ocena II, C8/V8): Bascule od R7 czyści (exited=true), a jego złóg w kroku 1 wciąż siedzi na osklepku.
  const cupuloDetach = state.plan.mechanism==="cupulo" && state.step===1;   // krok 2: ODKLEJANIE od osklepka (błona prostuje się) + start wędrówki złogu w kanale — Gufoni apo I Bascule.
  const EA=0.04, CUP_ANG=17;                                             // pozycja złogu na osklepku (ułamek ścieżki, tuż przy bańce/grzebieniu) + kąt odgięcia błony
  if(cupuloAdh){ placeOtolith(canal, EA, 0); const c0=document.getElementById("labcupula"); if(c0) c0.setAttribute("transform",`rotate(${CUP_ANG} ${cupPivot})`); }
  else if(cupuloDetach){ placeOtolith(canal, EA, 0); const c1=document.getElementById("labcupula"); if(c1) c1.setAttribute("transform",`rotate(${CUP_ANG} ${cupPivot})`); }   // start kroku 2: złóg jeszcze na osklepku (odgiętym) — za moment się odkleja
  else if(blendOnly) placeOtolith(canal, 1, 1); else placeOtolith(canal, fFrom, 0);
  if(state.autostart && total>0){ state.running=true; }
  state.autostart=false; syncWake();

  _otoStart=null; let last=performance.now(), lastSec=-1, lastDizz=-1, lastNaus=-1;   // lastDizz/lastNaus: pasek objawów D5/V17 (main)
  // CZAS WĘDRÓWKI OTOLITU = CZAS OCZOPLĄSU (widok frontalny): oba mają grać przez to samo okno tEnd
  // z silnika, żeby na flipkarcie obie strony kończyły się razem. Zależność od rozmiaru cząstki niesie
  // już samo tEnd (mniejsza cząstka → wolniejsze osiadanie → dłuższe ξ(t) → dłuższa wędrówka).
  // UWAGA PO OCENIE II (zmierzone 2026-08-14): sufit 24 s przestał być zabezpieczeniem skrajności
  // i stał się regułą — tEnd przekracza go w 122 ze 156 kroków z oczopląsem (78 %), najdłuższy 74,60 s.
  // Dawniej hold dynamiki był obcięty capem 12 s, więc tEnd nigdy nie sięgał widełek. Skutek: w tych
  // krokach wędrówka KOŃCZY SIĘ PIERWSZA, a oczopląs gra dalej — czyli obietnica „obie strony kończą
  // się razem" NIE jest dziś dotrzymana. Podniesienie sufitu to decyzja o UI (animacja do ~75 s),
  // więc liczba zostaje do rozstrzygnięcia klinicznego; komentarz mówi, jak jest, a nie jak było.
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
    // D5/V17: pasek objawów — zegar ANIMACJI kroku (ten sam _otoStart co otolit/oczopląs), NIE timer
    // użytkownika: przy timerze wydłużonym ręcznie objawy „zamierają" po końcu okna fizyki kroku —
    // spójnie z oczopląsem, który też gra raz od wejścia w krok. Aktualizacja przy zmianie wartości
    // zaokrąglonej (wzorzec lastSec — bez tekstowego spamu per klatka).
    const sgSym=man.segs[Math.min(state.step, man.segs.length-1)];
    if(sgSym){
      const sv=symAt(man, sgSym.t0+Math.min((now-_otoStart)/1000, sgSym.dur));
      const dp=sv.dizz<SYM_FLOOR?0:Math.min(100,Math.round(sv.dizz*100)), np2=Math.round(sv.naus);
      if(dp!==lastDizz){ lastDizz=dp; const b=$("#symDizz"); if(b){ b.style.width=dp+"%"; b.classList.toggle("over", sv.dizz>=1); }
        const vv=$("#symDizzV"); if(vv) vv.textContent="|ξ| "+(sv.dizz<SYM_FLOOR?"0.00":sv.dizz.toFixed(2)); }
      if(np2!==lastNaus){ lastNaus=np2; const b=$("#symNaus"); if(b) b.style.width=np2+"%"; const vv=$("#symNausV"); if(vv) vv.textContent=np2+"%"; }
    }
    // TIMER (pasek liniowy + odliczanie) — czyta state.total na żywo (suwak działa od razu)
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
/* TON jest ARGUMENTEM, nie wyliczeniem z numeru: numer porządkowy i znaczenie kliniczne to dwie
   różne rzeczy i przy zmianie kolejności pozycji nie mogą się rozjechać (1 → kanał tylny,
   2 → kryterium czasu, 3 → obserwacja, 4 → wybór kanału, 5 → ryzyko ośrodkowe).
   Barwa NIE jest jedynym nośnikiem znaczenia (Blok 2): numer, ikona i pełny opis zostają. */
function startQuick(n, ico, tytul, opis, akcja, ton){
  return `<li><button type="button" class="quick quick--${ton}" onclick="${akcja}"
      onmouseenter="startHint('${ton}')" onmouseleave="startHint(null)">
      <span class="quick__n" aria-hidden="true">${n}</span>
      <span class="quick__ico" aria-hidden="true">${ico}</span>
      <span class="quick__txt"><b>${tytul}</b><small>${opis}</small></span>
      <span class="quick__go" aria-hidden="true">›</span></button></li>`;
}
function startScope(ico, nazwa, opis){
  return `<li class="scopeitem"><span class="scopeitem__ico" aria-hidden="true">${ico}</span>
      <span class="scopeitem__txt"><b>${nazwa}</b><small>${opis}</small></span></li>`;
}

/* ════════ SCENA KLINICZNA ════════
   Render przestaje być kafelkiem w kolumnie bocznej i staje się ŚRODOWISKIEM: leży w tle prawej
   części obszaru treści, a karty leżą na nim jak szkło. Obraz i jego poświata siedzą w JEDNYM
   pudełku (`.startscene__plate`), bo poświata jest w PROCENTACH tego pudełka — dwa niezależne
   kotwiczenia rozjeżdżają się przy każdej zmianie kadru.

   `alt=""` jest ŚWIADOME: w tym wariancie render jest tłem, nie materiałem nauczania — nie ma
   odnośników anatomicznych ani podpisu, więc dla czytnika ekranu nie nosi żadnej treści.
   JEDYNE miejsce podmiany materiału (inny render, zrzut 3D, zdjęcie z gabinetu). Warunek kadru:
   proporcja bliska 3:2, błędnik w prawej-górnej ćwiartce, tło ciemne; inny kadr wymaga
   przeliczenia pary procentów `.startscene__glow` w start-scene.css. */
const CLIN_RENDER = "assets/head-xray.jpg";

/* `prefers-reduced-data` jest wciąż nierówno wspierane — BRAK WSPARCIA MUSI ZNACZYĆ „render",
   inaczej wszyscy dostaliby wersję zastępczą. `typeof` na niezadeklarowanej nazwie nie rzuca,
   więc to działa też w jsdom (który matchMedia nie ma w ogóle — zmierzone). */
function prefersReducedData(){
  try { return typeof matchMedia === "function" && matchMedia("(prefers-reduced-data: reduce)").matches; }
  catch(e){ return false; }
}
function startScene(){
  /* Oszczędzanie danych: zamiast pustego gradientu wchodzi SCHEMAT — kosztuje zero bajtów sieci
     (siedzi w pakiecie), a geometrię bierze z CANAL_PATHS, czyli z tego samego źródła co fizyka. */
  if(prefersReducedData())
    return `<div class="startscene startscene--schemat" aria-hidden="true">
      <span class="startscene__plate">${startAnatSVG()}</span></div>`;
  return `<div class="startscene" aria-hidden="true">
      <span class="startscene__plate">
        <img class="startscene__img" src="${CLIN_RENDER}" alt="" width="1264" height="768" decoding="async">
        <span class="startscene__glow"></span>
      </span>
    </div>`;
}

/* ════════ PANEL PODPOWIEDZI („co robi ta karta") ════════
   Treść WYPROWADZONA Z DOKUMENTU (Bloki 5-13), nie wymyślona: karta ma powiedzieć, co się stanie
   po kliknięciu. Panel ma `aria-hidden="true"` i jest chowany przy `(hover:none)` — powtarza
   treść, którą każda karta podaje słowem, więc dla czytnika ekranu byłby ósmym opisem tych samych
   siedmiu pozycji, a bez wskaźnika zostałby na wieki w spoczynku.
   Podmiana idzie przez `textContent`, BEZ przerysowania ekranu: rerender na `mouseenter` gubi
   hover i miga. */
const START_HINTS = {
  clin:  { ton:"var(--primary)", t:()=>t("Badam pacjenta","Examining a patient"),
           d:()=>t("Sześć kroków: Wywiad → Próba → Oczopląs → Interpretacja → Manewr → Kontrola. Każdy krok ma status, a powrót do wcześniejszego nie kasuje danych późniejszych.",
                   "Six steps: History → Test → Nystagmus → Interpretation → Maneuver → Follow-up. Every step carries a status, and going back to an earlier one does not erase later data.") },
  learn: { ton:"var(--ant)", t:()=>t("Uczę się","Learning"),
           d:()=>t("Przypadki prowadzone i quizy na trzech poziomach. Decyzja przed odsłonięciem odpowiedzi; każdy przypadek kończy cecha rozstrzygająca, pułapka i następny krok.",
                   "Guided cases and quizzes at three levels. The decision comes before the answer is revealed; each case ends with the decisive feature, the pitfall and the next step.") },
  kpost: { ton:"var(--post)", t:()=>t("Zawroty po zmianie pozycji","Vertigo after a change of position"),
           d:()=>t("Dix–Hallpike, test rolki, Bow & Lean, deep head-hang. Kierunek, latencja i wygasanie oczopląsu wynikają z symulacji złogu, nie z tabeli.",
                   "Dix–Hallpike, roll test, Bow & Lean, deep head-hang. Direction, latency and decay of the nystagmus follow from a simulation of the debris, not from a table.") },
  ktime: { ton:"var(--timer)", t:()=>t("Ciągłe zawroty od godzin lub dni","Continuous vertigo for hours or days"),
           d:()=>t("Kwalifikacja przed badaniem, potem test pchnięcia głową, oczopląs, test of skew, słuch i chód. Bez potwierdzenia obrazu klinicznego HINTS się nie otwiera.",
                   "Qualification before the exam, then head impulse, nystagmus, test of skew, hearing and gait. Without confirming the clinical picture, HINTS does not open.") },
  kobs:  { ton:"var(--primary)", t:()=>t("Mam wynik próby","I have a test result"),
           d:()=>t("Od zaobserwowanego oczopląsu do kanału, strony i mechanizmu. Wynik podaje poziom zgodności, alternatywy i cechę rozstrzygającą.",
                   "From the observed nystagmus to canal, side and mechanism. The result states the level of agreement, the alternatives and the decisive feature.") },
  kant:  { ton:"var(--ant)", t:()=>t("Znam kanał i stronę","I know the canal and the side"),
           d:()=>t("Tryb ekspercki — pomija wywiad i próbę. Epley, Semont, Bascule, Lempert/BBQ, Gufoni, Yacovino; licznik i kontrola po manewrze.",
                   "Expert mode — skips history and test. Epley, Semont, Bascule, Lempert/BBQ, Gufoni, Yacovino; timer and follow-up after the maneuver.") },
  krisk: { ton:"var(--crit)", t:()=>t("Przypadek nietypowy","Atypical case"),
           d:()=>t("Cechy niezgodne z klasycznym obrazem i czerwone flagi ośrodkowe. Prowadzi do różnicowania, nie do manewru repozycyjnego.",
                   "Features that do not fit the classic picture, plus central red flags. Leads to differentiation, not to a repositioning maneuver.") },
};
const START_HINT_SPOCZYNEK = { ton:"var(--faint)",
  t:()=>t("Co robi ta karta?","What does this card do?"),
  d:()=>t("Najedź kursorem na kartę trybu albo na szybkie wejście — tutaj pojawi się opis tego, co dana ścieżka faktycznie uruchamia.",
          "Hover over a mode card or a quick entry — a description of what that path actually starts will appear here.") };
function startHint(klucz){
  const el = document.querySelector("[data-hint]"); if(!el) return;
  const h = START_HINTS[klucz] || START_HINT_SPOCZYNEK;
  el.style.setProperty("--tone", h.ton);
  const b = el.querySelector("b"), s = el.querySelector("small");
  if(b) b.textContent = h.t();
  if(s) s.textContent = h.d();
}
function startHintHTML(){
  const h = START_HINT_SPOCZYNEK;
  return `<div class="starthint" aria-hidden="true" data-hint style="--tone:${h.ton}">
      <b>${h.t()}</b><small>${h.d()}</small></div>`;
}

/* ════════ POWRÓT DO OSTATNIEJ SESJI ════════
   Wejście wymagane przez Blok 4, dotąd nieobecne w interfejsie. CAŁA treść karty pochodzi ze
   stanu — poza etykietami nic nie jest tekstem stałym.

   BRAK ZNACZNIKA CZASU JEST ŚWIADOMY. Makieta miała podtytuł „…· przerwane 12 min temu", ale
   `flow-state.js` zapisuje CO zrobił użytkownik, nigdy KIEDY. Dołożenie `updatedAt` wymagałoby
   `Date.now()` w ścieżce zapisu, a złoty wzorzec przechodzi przez `markSeen`/`markManeuver` —
   ekran startowy zacząłby więc zrzucać do wzorca liczbę zmieniającą się co minutę. Przybliżenie
   („niedawno") jest niedopuszczalne: w karcie powrotu do BADANIA czas jest informacją kliniczną,
   nie ozdobą. Sam podtytuł z próbą i stroną jest kompletny.

   Bez sesji karta się nie renderuje i NIE zostawiamy po niej pustego miejsca — panel podpowiedzi
   wypełnia kolumnę sam. */
function startResumeOpis(){
  const cz = [];
  const proba = state.testKey && DIAG[state.testKey] ? DIAG[state.testKey].name : null;
  const mk = state.flow && state.flow.maneuver ? state.flow.maneuver.key : null;
  const man = mk && MANEUVERS[mk] ? MANEUVERS[mk].label : null;
  if(proba) cz.push(proba); else if(man) cz.push(man);
  if(state.side) cz.push(state.side==="P" ? t("strona prawa","right side") : t("strona lewa","left side"));
  return cz.join(" · ");
}
function startResume(){
  const FD = flowDeps();
  const id = resumeStepId(state, FD);
  if(!id) return "";
  const sum = resumeSummary(state, state.lang, FD);
  const kropki = flowStatuses(state, FD)
    .map(st => `<i${st.status!=="todo" && st.status!=="pending" ? " data-done" : ""}></i>`).join("");
  const opis = startResumeOpis();
  /* AKCJA NISZCZĄCA IDZIE PRZEZ ISTNIEJĄCE, DWUSTOPNIOWE POTWIERDZENIE. `state.zakonczeniePyta`
     obsługuje dokładnie to samo pytanie na ekranie kontroli — druga implementacja oznaczałaby
     dwa miejsca, w których można zapomnieć o polu przypadku (błąd wycieku badania HINTS). */
  const akcje = state.zakonczeniePyta
    ? `<div class="startresume__pyta">
         <small>${t("Nowy przypadek kasuje dane bieżącego badania. Kontynuować?","A new case erases the data of the current examination. Continue?")}</small>
         <button type="button" class="startresume__go" onclick="zakonczSesje()">${t("Tak, zacznij nowy","Yes, start a new one")}</button>
         <button type="button" class="startresume__new" onclick="pytajOZakonczeniu(false)">${t("Anuluj","Cancel")}</button>
       </div>`
    : `<button type="button" class="startresume__go" onclick="goFlowStep('${id}')">${t("Wróć do sesji","Back to the session")} <span aria-hidden="true">›</span></button>
       <button type="button" class="startresume__new" onclick="pytajOZakonczeniu(true)">${t("Zacznij nowy przypadek","Start a new case")}</button>`;
  return `<div class="startresume">
      <span class="startresume__eyebrow">${t("Ostatnia sesja","Last session")}</span>
      <b>${sum ? `${t("Krok","Step")} ${sum.nr} ${t("z","of")} ${sum.total} — ${sum.label}` : t("Badanie w toku","Examination in progress")}</b>
      ${opis ? `<small>${opis}</small>` : ""}
      <div class="startresume__steps" aria-hidden="true">${kropki}</div>
      ${akcje}
    </div>`;
}

/* ILUSTRACJA ANATOMICZNA EKRANU STARTOWEGO (mockupy D1/M1: głowa z podświetlonym błędnikiem
   i dwoma odnośnikami do struktur).
   Dwie decyzje, obie merytoryczne, nie estetyczne:
   1. Geometria kanałów, baniek i łagiewki jest brana Z TEGO SAMEGO ŹRÓDŁA, co schemat wędrówki
      złogu (CANAL_PATHS / LAB_AMP / LAB_UTR / LAB_CRUS). Obrazek na pierwszym ekranie nie ma
      prawa pokazywać innej anatomii niż ta, po której liczona jest fizyka — inaczej użytkownik
      uczyłby się układu, którego dwa ekrany dalej już nie zobaczy.
   2. Kanały dostają kod barwny CAŁEJ aplikacji (tylny/poziomy/przedni), a nie jednolitą poświatę
      z mockupu. Mockup jest wzorcem układu i hierarchii („nie specyfikacja piksel w piksel"),
      a kolor kanału jest w tej aplikacji nośnikiem informacji.
   Głowa jest schematyczna — ten sam idiom, co reszta rysunków (backHeadSVG, figProj). */
function startAnatSVG(){
  const COL={posterior:"var(--post)", horizontal:"var(--horiz)", anterior:"var(--ant)"};
  let kanaly="";
  for(const k of ["anterior","horizontal","posterior"]){         // poświata (szeroka, przezroczysta) + rdzeń
    kanaly+=`<path d="${CANAL_PATHS[k]}" fill="none" stroke="${COL[k]}" stroke-width="17" stroke-linecap="round" opacity=".18"/>`
          + `<path d="${CANAL_PATHS[k]}" fill="none" stroke="${COL[k]}" stroke-width="7" stroke-linecap="round"/>`;
  }
  let banki="";
  for(const k in LAB_AMP){ const a=LAB_AMP[k];
    banki+=`<ellipse cx="${a.x}" cy="${a.y}" rx="11" ry="8.5" fill="#22303D" stroke="${COL[k]}" stroke-width="3.5"/>`; }
  /* Umiejscowienie błędnika W GŁOWIE. Skala i przesunięcie tak dobrane, żeby środek trafił na
     okolicę ucha (rysowanego niżej), a nie w skroń — inaczej obrazek uczyłby złej lokalizacji.
     Punkty odnośników liczone TĄ SAMĄ transformacją, więc kreska nie może się rozjechać z rysunkiem. */
  const LS=0.38, LX=200, LY=112;                                 // błędnik: skala i przesunięcie W UKŁADZIE GŁOWY
  const HX=-4, HY=-6, HS=1.08;                                   // głowa: przesunięcie i skala W UKŁADZIE RYSUNKU
  const gx=x=>HX+(LX+(x-38)*LS)*HS, gy=y=>HY+(LY+(y-35)*LS)*HS;  // struktura błędnika → współrzędne rysunku
  const blednik=`<g transform="translate(${LX} ${LY}) scale(${LS}) translate(-38 -35)">
      <path d="M${LAB_CRUS.fx} ${LAB_CRUS.fy} L${LAB_UTR.cx} ${LAB_UTR.cy-LAB_UTR.ry+2}" fill="none" stroke="#4A5F72" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="${LAB_UTR.cx}" cy="${LAB_UTR.cy}" rx="${LAB_UTR.rx}" ry="${LAB_UTR.ry}" fill="#22303D" stroke="#7E94A6" stroke-width="4"/>
      ${kanaly}${banki}</g>`;
  // Głowa w profilu, twarzą w prawo — JEDNA ścieżka (bez szwów między nachodzącymi kształtami).
  // Szyja WYCHODZI POZA viewBox i jest przez niego przycięta. Domknięta u dołu dawała pudełkowy
  // kołnierz, bo w tej skali nie ma już miejsca na barki — kadr kończy rysunek za nas.
  const glowa=`<path d="M238 26 C204 26 168 52 166 98 C165 128 176 150 186 160 C187 180 188 198 187 216
      L187 262 L258 262 C256 240 254 220 255 203 C275 201 288 191 290 178
      C291 172 287 170 289 165 C292 160 287 158 290 153 C293 148 300 150 304 146
      L316 136 C310 126 302 120 300 110 C299 102 304 98 302 90 C298 58 272 26 238 26 Z"
      fill="#101822" stroke="#3C5165" stroke-width="2"/>`;
  const ucho=`<path d="M206 138 c-11 1 -17 10 -16 20 1 9 5 15 11 19" fill="none" stroke="#4A5F72" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M201 152 c-5 1 -7 6 -5 10" fill="none" stroke="#4A5F72" stroke-width="2" stroke-linecap="round"/>`;
  // Odnośniki celują w punkty POLICZONE z geometrii błędnika: szczyt pętli kanału tylnego (najbliżej
  // etykiety) i środek łagiewki. Ręcznie wpisane współrzędne rozjechałyby się przy każdej zmianie skali.
  const pKan=[gx(60), gy(68)], pLag=[gx(LAB_UTR.cx), gy(LAB_UTR.cy)];
  const pGlow=[gx(140), gy(112)], rGlow=(205*LS*HS)*0.86;
  const odn=(x,y,d,cx,cy,txt)=>`<path d="${d}" fill="none" stroke="var(--faint)" stroke-width="1.2" opacity=".75"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="2.6" fill="var(--faint)"/>
      <text x="${x}" y="${y}" fill="var(--faint)" font-size="9.5" letter-spacing=".07em">${txt}</text>`;
  return `<svg viewBox="0 0 360 250" role="img" aria-label="${t(
      "Schemat: głowa w profilu z zaznaczonym błędnikiem — trzy kanały półkoliste z bańkami i łagiewka",
      "Diagram: head in profile with the labyrinth highlighted — three semicircular canals with ampullae and the utricle")}">
    <defs><radialGradient id="otoglow"><stop offset="0" stop-color="var(--primary)" stop-opacity=".22"/>
      <stop offset="1" stop-color="var(--primary)" stop-opacity="0"/></radialGradient></defs>
    <g transform="translate(${HX} ${HY}) scale(${HS})">${glowa}${ucho}</g>
    <circle cx="${pGlow[0].toFixed(1)}" cy="${pGlow[1].toFixed(1)}" r="${rGlow.toFixed(1)}" fill="url(#otoglow)"/>
    <g transform="translate(${HX} ${HY}) scale(${HS})">${blednik}</g>
    ${odn(8, 60, `M92 66 H176 L${pKan[0].toFixed(1)} ${pKan[1].toFixed(1)}`, pKan[0], pKan[1], t("KANAŁY","SEMICIRCULAR"))}
    <text x="8" y="72" fill="var(--faint)" font-size="9.5" letter-spacing=".07em">${t("PÓŁKOLISTE","CANALS")}</text>
    ${odn(8, 194, `M78 190 H196 L${pLag[0].toFixed(1)} ${pLag[1].toFixed(1)}`, pLag[0], pLag[1], t("ŁAGIEWKA","UTRICLE"))}
  </svg>`;
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
    /* ikony paska zakresu (mockup D1, dolna listwa) */
    rep:  '<svg viewBox="0 0 24 24" fill="none"><path d="M4 9.5A6 6 0 0 1 15.5 7.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M20 14.5A6 6 0 0 1 8.5 16.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13 5.2 15.9 7.6 13.4 10.4M11 18.8 8.1 16.4 10.6 13.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    diag: '<svg viewBox="0 0 24 24" fill="none"><rect x="4.5" y="4" width="15" height="16" rx="2.4" stroke="currentColor" stroke-width="1.8"/><path d="M9 3h6v3H9z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.5 14h2l1.5-3 2 5 1.5-2h2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mozg: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5.2v13.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 6.2A2.7 2.7 0 0 0 7 5.6 2.6 2.6 0 0 0 4.8 9a2.7 2.7 0 0 0-.3 4.6A2.7 2.7 0 0 0 7.4 18a2.6 2.6 0 0 0 4.6-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 6.2A2.7 2.7 0 0 1 17 5.6 2.6 2.6 0 0 1 19.2 9a2.7 2.7 0 0 1 .3 4.6A2.7 2.7 0 0 1 16.6 18a2.6 2.6 0 0 1-4.6-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    lab:  '<svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="9" cy="7" r="2.2" fill="var(--panel)" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="12" r="2.2" fill="var(--panel)" stroke="currentColor" stroke-width="1.8"/><circle cx="10.5" cy="17" r="2.2" fill="var(--panel)" stroke="currentColor" stroke-width="1.8"/></svg>',
  };
  $("#app").innerHTML=`
    <section class="startpage">
      ${startScene()}
      <div class="startgrid">
        <div class="starthead">
          <span class="starteyebrow">${t("Atlas diagnostyki przedsionkowej","Atlas of vestibular diagnostics")}</span>
          <h2 class="starth">${t("Wybierz tryb","Choose a mode")}</h2>
        </div>
        <div class="startcol">
          <div class="modecards">
            <button type="button" class="modecard modecard--clin" onclick="openTriage()"
                    onmouseenter="startHint('clin')" onmouseleave="startHint(null)">
              <span class="modecard__ico" aria-hidden="true">${I.lek}</span>
              <span class="modecard__txt"><b>${t("Badam pacjenta","Examining a patient")}</b>
                <small>${t("Tryb kliniczny dla lekarzy i praktyków","Clinical mode for physicians and practitioners")}</small></span>
              <span class="modecard__go" aria-hidden="true">›</span></button>
            <button type="button" class="modecard" onclick="goArea('learn')"
                    onmouseenter="startHint('learn')" onmouseleave="startHint(null)">
              <span class="modecard__ico" aria-hidden="true">${I.ucz}</span>
              <span class="modecard__txt"><b>${t("Uczę się","Learning")}</b>
                <small>${t("Tryb edukacyjny dla studentów i lekarzy","Educational mode for students and physicians")}</small></span>
              <span class="modecard__go" aria-hidden="true">›</span></button>
          </div>

          <h2 class="starth">${t("Co chcesz zrobić?","What do you want to do?")}</h2>
          <ul class="quicklist">
            ${startQuick(1, I.poz,  t("Zawroty po zmianie pozycji","Vertigo after a change of position"),
                             t("Diagnostyka BPPV krok po kroku","Step-by-step BPPV work-up"), "startGo('diag')", "kpost")}
            ${startQuick(2, I.czas, t("Ciągłe zawroty od godzin lub dni","Continuous vertigo for hours or days"),
                             t("Kwalifikacja do HINTS / HINTS+","Qualification for HINTS / HINTS+"), "goHintsKwal()", "ktime")}
            ${startQuick(3, I.oko,  t("Mam wynik próby","I have a test result"),
                             t("Opis oczopląsu i klasyfikacja","Nystagmus description and classification"), "startGo('diag')", "kobs")}
            ${startQuick(4, I.cel,  t("Znam kanał i stronę","I know the canal and the side"),
                             t("Szybki wybór manewru","Quick maneuver selection"), "startGo('treat')", "kant")}
            ${startQuick(5, I.uwaga,t("Przypadek nietypowy","Atypical case"),
                             t("Różnicowanie i czerwone flagi","Differentiation and red flags"), "goHintsKwal()", "krisk")}
          </ul>
        </div>
        <aside class="startside">
          ${startHintHTML()}
          ${startResume()}
        </aside>
      </div>

      <ul class="scopestrip">
        ${startScope(I.rep,  t("Repozycja","Repositioning"), t("Manewry i protokoły","Maneuvers and protocols"))}
        ${startScope(I.diag, t("Diagnostyka","Diagnostics"), t("Testy pozycyjne i klasyfikacja Bárány","Positional tests and Bárány classification"))}
        ${startScope(I.mozg, "HINTS+", t("Ocena zawrotów ośrodkowych","Assessment of central vertigo"))}
        ${startScope(I.lab,  t("Laboratorium","Laboratory"), t("Matematyczny pacjent (parametry fizjologii)","Mathematical patient (physiology parameters)"))}
      </ul>

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
        const fazy = DIAG[pr].phases(A, state.variant, state.bltScenario);   // scenariusz historii (V5) — ten sam, z którego liczy interpretacja
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
    /* OŚ CECHY W MARKUPIE — nośnik TONU GRUPY (scena kliniczna). Ton wchodzi atrybutem, a nie
       kolejnością `:nth-of-type`: lista grup zależy od próby (część cech ma `tylkoProba`), więc
       numer porządkowy grupy zmienia się z ekranu na ekran, a jej OŚ nie. */
    return `<details class="card ogrupa" data-os="${g.os}"${otwarta?" open":""}>
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
    /* Klasa stanu ZGODNOSCI takze na plycie wyniku, nie tylko na pigulce w srodku: material
       plyty (obrys i podklad) niesie ten sam stan co napis, wiec nie moze go czytac z dziecka.
       `:has()` odpada — WebView < 105 (Capacitor, minSdk 24) go nie zna. */
    return `<div class="card iwynik iwynik--${w.zgodnosc}">
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
      <ul class="fuopcje">${WYNIKI.map(w=>`<li><button type="button" class="fuopcja" data-fuwynik="${w.id}" aria-pressed="${wybrany===w.id}" onclick="ustawWynikKontroli('${w.id}')">
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
    return `<div class="card fudalej" data-fuwynik="${wybrany}"><h4>${t("Co dalej","What next")}</h4>
      <div class="note fuuwaga">${t(wynikDef.uwagaPl, wynikDef.uwagaEn)}</div>
      ${sprzecz.length?`<ul class="fusprzecz">${sprzecz.map(s=>`<li>${t(s.pl, s.en)}</li>`).join("")}</ul>`:""}
      ${glowny}
      ${dalsze}
      ${alty}
      ${kroki.zakaz.length?`<div class="fuzakaz"><span class="eyebrow">${t("Czego ten ekran celowo nie proponuje","What this screen deliberately does not offer")}</span>
        <ul>${kroki.zakaz.map(z=>`<li><b>${t(AKCJE[z.akcja].pl, AKCJE[z.akcja].en)}</b> — ${t(z.pl, z.en)}</li>`).join("")}</ul></div>`:""}
      ${/* ZAWROTY RESZTKOWE (ocena II V17/D5, źródło [H26] Özgirgin 2024). Karta wchodzi WYŁĄCZNIE
            przy tym jednym wyniku, bo tylko tam ma desygnat, i mówi trzy rzeczy, których model
            kontroli sam z siebie nie powie:
              — SKUTECZNY manewr ≠ zdrowy pacjent: RD dotyczy 31–61 % chorych PO ustąpieniu oczopląsu;
              — zjawisko jest samoograniczające (dni–tygodnie), więc brak poprawy dziś nie jest porażką;
              — supresanty przedsionkowe SZKODZĄ, bo opóźniają kompensację ośrodkową.
            Ostatnie zdanie jest tu najważniejsze klinicznie: to jedyne miejsce w aplikacji, gdzie
            odradzamy LECZENIE, a nie manewr. Zakaz repozycji niesie już `kroki.zakaz` wyżej — ta
            karta go nie powtarza, tylko wyjaśnia, co robić ZAMIAST. */""}
      ${wybrany==="residual" ? `<div class="furd">
        <span class="eyebrow">${t("Zawroty resztkowe — co o nich wiadomo","Residual dizziness — what is known")}</span>
        <ul>
          <li>${t("Skuteczna repozycja nie kończy choroby: zawroty resztkowe opisano u <b>31–61 %</b> chorych po ustąpieniu oczopląsu pozycyjnego.","Successful repositioning does not end the illness: residual dizziness is reported in <b>31–61 %</b> of patients after the positional nystagmus resolves.")}</li>
          <li>${t("Zjawisko jest zwykle <b>samoograniczające</b> (dni–tygodnie). Samo poradnictwo obniża jego częstość do ok. 13 %.","The phenomenon is usually <b>self-limiting</b> (days to weeks). Counselling alone lowers its frequency to about 13 %.")}</li>
          <li>${t("Leki tłumiące układ przedsionkowy <b>szkodzą</b> — opóźniają kompensację ośrodkową, czyli dokładnie ten proces, który znosi objaw.","Vestibular suppressants are <b>harmful</b> — they delay central compensation, the very process that resolves the symptom.")}</li>
        </ul>
        <div class="note">${t("Źródło: [H26] Özgirgin i wsp., Front Neurol 2024. Aplikacja nie stawia rozpoznania i nie zleca leczenia — to tło do rozmowy z pacjentem.","Source: [H26] Özgirgin et al., Front Neurol 2024. The app makes no diagnosis and prescribes no treatment — this is background for the conversation with the patient.")}</div>
      </div>` : ""}
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
        return `<li data-fuwynik="${k.wynik}"><b>${MANEUVERS[k.manewr]?MANEUVERS[k.manewr].label:k.manewr}</b> · ${t("ucho","ear")} ${sideN(k.strona,"mianN")}
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

  /* V28c — KARTA KRYTERIÓW NA WĘŹLE s-EVS. Liść `wyzwalacz==="samoistny"` jest JEDYNYM w całym
     drzewie kwalifikacji z `sciezka:null`: wymienia migrenę przedsionkową, chorobę Ménière'a i TIA
     tylnego kręgu, mówi uczciwie „silnik ich nie modeluje" — i na tym się kończy, nie oferując
     NICZEGO do zrobienia. Kryteria trafiły w V28 na ekran symulatora HINTS, czyli o jeden ekran
     dalej niż potrzeba: tamten ekran jest właśnie tym, o którym TEN węzeł mówi „HINTS też nie jest
     właściwy". Tu jest ich miejsce kliniczne — to dokładnie ten pacjent i ten moment.
     ROZWINIĘTA (argument `true`), bo zwinięty <details> na ekranie, na który klinicysta trafia raz,
     powtarzałby wadę pierwotnego umiejscowienia: treść o najwyższej wartości decyzyjnej zostawałaby
     za kliknięciem. Karta NIE przechyla różnicowania ku migrenie — jej blok WYKLUCZEŃ niesie regułę
     choroby Ménière'a i czerwone flagi TIA, czyli dwie pozostałe pozycje z tego samego zdania
     modelu; dlatego stoi tu CAŁA, a nie w postaci wyciągu.
     JEDNO ŹRÓDŁO: ta sama funkcja co na ekranie HINTS, zero drugiego literału — sprzeczność między
     dwoma miejscami jest strukturalnie niemożliwa. Pole stanu nazywa się `hintsVmCrit` mimo dwóch
     miejsc użycia; nazwa jest historyczna i świadomie NIE zmieniana razem z wpięciem, żeby diff
     niósł jedną rzecz naraz. MODEL POZOSTAJE CZYSTY: `triage-model.js` nie wie o tej karcie,
     więc `triage:check` (62 przypadki + 2176 kombinacji) jest tą zmianą nietknięty. */
  const kryteriaVM = gotowe && w.kategoria === "sEVS"
    ? `<div class="note" style="margin-top:10px">${t("Poniżej kryteria pierwszej z wymienionych jednostek. Karta niesie też blok wykluczeń — regułę choroby Ménière'a i czerwone flagi TIA tylnego kręgu, czyli dwie pozostałe.", "Below are the criteria for the first of the entities listed. The card also carries an exclusion block — the Menière rule and the red flags of vertebrobasilar TIA, that is, the other two.")}</div>${vmCriteriaCard(true)}`
    : "";

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
      <div class="col col--viz">${wynik}${kryteriaVM}</div>
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
    /* STRONY TU NIE MA (usunięte 2026-08-17, decyzja użytkownika). Wybór ucha stał na tym ekranie
       RÓWNOLEGLE do pigułki L/P w nagłówku karty manewru — dwa miejsca, jeden stan, i to właśnie ta
       para zrodziła rozjazd `state.side` ↔ `plan.side`, który Blok 10 musiał gasić `patchManeuverSide`
       i strażnikiem w `setGuideSide`. Zostaje JEDNO miejsce: karta manewru, czyli tam, gdzie strona
       ma skutek (plan kroków powstaje dla ucha) i gdzie klinicysta ją realnie potwierdza.
       Akcja `pickSide` ZOSTAJE — jest wejściem do stanu dla wyroczni i dla linku/przywrócenia sesji;
       przestała mieć tylko własny przycisk na tym ekranie.
       Mechanizm zostaje: on NIE MA drugiego miejsca i steruje doborem manewru wprost. */
    const mechOpt=v=>`<button class="opt" aria-pressed="${state.variantZrodlo?state.variant===v:false}" onclick="setVariant('${v}')">${NAZWA_MECH(v)}<small>${v==="canalo"?t("złóg swobodny w kanale","free-floating debris"):t("złóg na osklepku","debris on the cupula")}</small></button>`;
    const grupa=(tytul,podpis,html,klasa)=>`<div class="group"><div class="label"><span class="eyebrow">${tytul}</span><span class="hint">${podpis}</span></div><div class="seg ${klasa||""}">${html}</div></div>`;
    // Rozmiar złogu ustawia się w PRZEWODNIKU manewru (renderGuide → .sizerow), w kontekście trwającej
    // repozycji — nie na ekranie wyboru. Domyślnie state.size="medium" (genPlan przy starcie manewru).
    body=`<p class="ekspert__lead">${t("Tryb ekspercki — szybki wybór manewru, gdy kanał i mechanizm już znasz. Ucho wskażesz na karcie manewru, pigułką L/P w nagłówku.","Expert mode — quick maneuver choice when you already know the canal and mechanism. You set the ear on the maneuver card, with the L/R pill in its header.")}</p>
      ${grupa(t("Kanał półkolisty","Semicircular canal"), t("zajęty kanał","affected canal"), `${canalOpt("posterior")}${canalOpt("horizontal")}${canalOpt("anterior")}`, "three")}
      ${grupa(t("Mechanizm","Mechanism"), t("postać złogu","form of the debris"), `${mechOpt("canalo")}${mechOpt("cupulo")}`, "two")}
      ${state.canal?kartaDoboru():`<div class="note">${t("Wybierz kanał, żeby zobaczyć zalecany manewr.","Choose a canal to see the recommended maneuver.")}</div>`}
      ${/* WSZYSTKIE MANEWRY KANAŁU — przywrócone przy scaleniu (Etap 3). Karta doboru pokazuje
            WYŁĄCZNIE to, co nazywa `recommend()`: pierwszy rzut i jego alternatywy. Manewr, który
            jest w kanale, ale nie stoi w żadnym `alts`, znikał wtedy z aplikacji — zmierzone na
            KIMIE (CRM): rejestr go ma, `CANALS.horizontal.maneuvers` go ma, `recommend` wspomina go
            w PROZIE noty, ale nie w `alts`, więc po przebudowie ekranu nie było jak go uruchomić.
            Ta lista czyta kanał, nie zalecenie — dokładnie tak, jak obiecuje komentarz przy liście
            prób niżej („manewry zuma i kim weszły SAME"). Kolejność zamierzona: najpierw zalecenie
            wg wytycznych, potem pełny wybór — lista nie jest rankingiem. */""}
      ${state.canal?grupa(t("Wszystkie manewry tego kanału","All maneuvers for this canal"),
          t("pełny wybór — lista nie jest rankingiem","the full set — this list is not a ranking"),
          (CANALS[state.canal].maneuvers||[]).map(k=>`<button class="opt" aria-pressed="${state.maneuverKey===k}" onclick="openMan('${k}')">${MANEUVERS[k].label}<small>${MANEUVERS[k].desc}</small></button>`).join(""),
          (CANALS[state.canal].maneuvers||[]).length===2?"two":""):""}`;
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
    /* LISTA PRÓB JEST WYLICZANA Z DIAG, NIE WPISANA (2026-08-15). Do oceny II stały tu cztery
       literały; silnik dostał w V11/D2 piątą próbę (lying-down / sitting-up) i ekran po prostu
       o niej nie wiedział — model umiał ją policzyć, a klinicysta nie miał jak do niej wejść.
       Ta sama zasada, dzięki której manewry `zuma` i `kim` weszły SAME: lista manewrów już czyta
       CANALS[kanal].maneuvers. Dopisanie próby do DIAG wystarcza teraz, żeby pojawiła się na
       ekranie; bramka niżej pilnuje, żeby literały nie wróciły. */
    body=`<div class="group"><div class="label"><span class="eyebrow">${t("Test diagnostyczny","Diagnostic test")}</span><span class="hint">${t("stronę ustalisz na karcie testu","set the side on the test card")}</span></div>
        <div class="seg">${Object.keys(DIAG).map(testOpt).join("")}</div></div>`;
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
    ${body}
    ${/* NOTA O NARZĘDZIU STOI NA KOŃCU, jak na ekranie startowym (renderStart: ostatni element
          sekcji, po odnośnikach do obszarów). Do tej pory była tu NAD treścią i to był jedyny
          ekran w aplikacji, gdzie zastrzeżenie wchodziło przed tym, czego dotyczy — użytkownik
          czytał ostrzeżenie o wzorcach oczopląsu, zanim zobaczył listę prób.
          STOPKA „Prototyp poglądowy. Brak gromadzenia danych." USUNIĘTA na życzenie użytkownika.
          Zdanie o prywatności NIE ZNIKA z aplikacji: niesie je arkusz Profilu („Aplikacja nie
          wysyła niczego poza urządzenie…", shell.js) i karta zakończenia sesji — czyli miejsca,
          w których użytkownik faktycznie o to pyta, a nie stopka ekranu wyboru próby. */''}
    <div class="disclaimer">${t('<b>Narzędzie wspomagające dla personelu medycznego.</b> Nie zastępuje badania, rozpoznania ani decyzji klinicysty. Czasy i wzorce oczopląsu są poglądowe — zweryfikuj z własnym protokołem.','<b>Support tool for medical staff.</b> Does not replace examination, diagnosis, or clinician judgment. Nystagmus timings and patterns are illustrative — verify against your own protocol.')}</div>`;
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
  const _gn = nysFromDyn(p.canal, p.side, stepXiPeak(_man, p, state.step), p.mechanism==="cupulo");
  const gn = (_gn && _gn.strength >= XI_CARD) ? _gn : null;   // karta oczopląsu TAM, gdzie FIZYKA daje sygnał > próg (bez markera)
  // OCZOPLĄS LIBERACYJNY (R5, decyzja kliniczna 2026-08-06): krok, w którym złóg OPUSZCZA kanał, dostaje
  // jawny znacznik. Źródłem jest TA SAMA symulacja, z której liczona jest wartość na karcie (manExitStep =
  // segment zawierający pierwsze man.sim.exited), więc etykieta nie może rozjechać się z liczbą.
  // Kroki PO ekspulsji nie potrzebują osobnego przypadku: ich |ξ| spada poniżej progu 0.10 i karty nie ma
  // (Lempert 4-6, Gufoni geo 3-4). Uwaga: dla kanału POZIOMEGO rysunek wędrówki używa schematu n−2, więc
  // może wskazać inny krok niż fizyka — znacznik celowo idzie za fizyką (patrz komentarz przy manFractions).
  // Sklejane BEZ własnej linii w szablonie: pusta gałąź musi dawać markup bajtowo identyczny z dotychczasowym.
  const libNote = (gn && state.step===manExitStep(_man))
    ? `<span class="libnote" title="${t('W tym kroku złóg opuszcza kanał i wpada do łagiewki. Oczopląs bije w tę samą stronę co prowokacyjny, jest krótki i dogasa — to spodziewany objaw skuteczności, nie nawrót.','In this step the debris leaves the canal and drops into the utricle. The nystagmus beats in the same direction as the provoking one, is brief and fades — an expected sign of success, not a relapse.')}">${t("oczopląs liberacyjny","liberatory nystagmus")}</span>`
    : "";
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
  // D5/V17: pasek objawów — OSTATNI wiersz .tcard w OBU wariantach (kroki bez timera też mają realne
  // ξ, np. rzut Semonta). Wartości początkowe deterministyczne = symAt(man, seg.t0) — rezyduum
  // z poprzedniego kroku (jak env(0) w manStepEnv); formaty toFixed/Math.round (golden stabilny).
  const symRow=(()=>{
    const sg=_man.segs[Math.min(state.step, _man.segs.length-1)];
    const s0=symAt(_man, sg?sg.t0:0);
    const d=s0.dizz, np=Math.round(s0.naus), over=d>=1;
    const TIP=t("Poglądowo, z tej samej fizyki, która napędza oczopląs: natężenie zawrotu ~ bieżące odchylenie osklepka |ξ|, nudności ~ skumulowana „dawka” Σ|ξ|·Δt od początku manewru. To nie jest pomiar kliniczny.","Illustrative, from the same physics that drives the nystagmus: vertigo intensity ~ the current cupular deflection |ξ|, nausea ~ the cumulative \"dose\" Σ|ξ|·Δt since the maneuver began. This is not a clinical measurement.");
    return `<div class="symrow" title="${TIP}">
          <span class="symlbl">${t("Zawrót","Vertigo")}</span>
          <div class="symbar"><div id="symDizz" class="symfill dizz${over?' over':''}" style="width:${d<SYM_FLOOR?0:Math.min(100,Math.round(d*100))}%"></div></div>
          <span id="symDizzV" class="symval mono"${over?` title="${t("powyżej nasycenia odpowiedzi oka (|ξ| ≥ 1)","above the ocular response saturation (|ξ| ≥ 1)")}"`:""}>|ξ| ${d<SYM_FLOOR?"0.00":d.toFixed(2)}</span>
          <span class="symlbl">${t("Nudności","Nausea")}</span>
          <div class="symbar"><div id="symNaus" class="symfill naus" style="width:${np}%"></div></div>
          <span id="symNausV" class="symval mono">${np}%</span>
        </div>`;
  })();
  const timerBlock=st.seconds==null
    ? `<div class="tcard"><div class="trow1"><div class="nostimer-inline">${t("Krok bez odliczania — wykonaj płynnie, bez przerwy.","Step without a timer — perform smoothly, without pausing.")}</div>${tgIcons}</div>${symRow}</div>`
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
        ${symRow}
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
  // D11/V18: noty mechanizmowe nowych manewrów HC-kupulo (wzór gufoniNote/basculeNote; Kim z OBOWIĄZKOWĄ
  // notą o wibracji poza modelem — inaczej karta uczyłaby, że wibracja jest zbędna).
  const zumaNote = state.maneuverKey==="zuma"
    ? `<div class="note">${t('Manewr <b>uwalniający</b> dla <b>kupulolitiazy kanału poziomego</b> — bez etapu konwersji: szybki dekubit na bok chory odrywa złóg od osklepka (rzut bezwładnościowy), a kolejne pozycje przenoszą go przez ramię długie do łagiewki. Skuteczność ~56% po pojedynczym manewrze; po nim ponowny Roll test.','<b>Releasing</b> maneuver for <b>horizontal-canal cupulolithiasis</b> — without a conversion stage: the rapid decubitus onto the affected side detaches the debris from the cupula (inertial jolt), and the subsequent positions carry it through the long arm into the utricle. ~56% efficacy after a single maneuver; repeat the Roll test afterward.')}</div>` : "";
  const kimNote = state.maneuverKey==="kim"
    ? `<div class="note">${t('Manewr <b>CRM (Kim 2012)</b> dla kupulolitiazy kanału poziomego. <b>Granica modelu:</b> protokół kliniczny zawiera WIBRACJĘ wyrostka sutkowatego jako integralny element odrywania złogu — silnik nie ma wejścia wibracyjnego i w modelu czyszczą same zmiany pozycji. NIE wyciągaj stąd wniosku, że wibracja jest zbędna. Skuteczność natychmiastowa ~36%; po manewrze ponowny Roll test.','The <b>CRM maneuver (Kim 2012)</b> for horizontal-canal cupulolithiasis. <b>Model boundary:</b> the clinical protocol includes MASTOID VIBRATION as an integral part of detaching the debris — the engine has no vibration input, and in the model the position changes alone do the clearing. Do NOT conclude that the vibration is unnecessary. Immediate efficacy ~36%; repeat the Roll test afterward.')}</div>` : "";
  // Manewr na KUPULOLITIAZĘ (mechanism:"cupulo", np. Bascule): karta „wędrówka otolitów" domyślnie NA WIERZCHU
  // (flipped) — pokazuje przyleganie/odklejanie od osklepka; osklepek dorysowany w labiryncie (opts.cupula).
  const cupuloMech = p.mechanism==="cupulo";
  // D5/V17: karta „Co dalej — RD" na OSTATNIM kroku manewru CZYSZCZĄCEGO (ekspulsja bywa wcześniej —
  // finał to naturalny moment „co dalej", a krok liberacyjny ma już libNote; Lempert czyści w 3/6).
  // gufoniApo (konwersja, exited=false) karty ŚWIADOMIE nie dostaje — jego gufoniNote nakazuje ponowny
  // Roll. Treść: frazowanie RD 1:1 z neuro-vor.js (spójność silników) + „~13%" z [H26] Özgirgin 2024.
  // D9/V20: karta „Chmura złogu" na FINALNYM kroku (bramka: ensemble ON, POZA sesją — sesja opowiada
  // JEDEN złóg z historią, chmura by temu przeczyła na tym samym ekranie). Chmura jest WYŁĄCZNIE
  // widokiem: oczy/pasek objawów/otolit grają dalej kanoniczną pojedynczą symulację (nota uczciwości
  // w karcie); ZAKAZ rysowania chmury na ścieżce otolitu — rampa manFractions jest schematyczna,
  // pozycyjny realizm byłby fabrykacją (klasa błędu usuniętej ścieżki awaryjnej stepXiPeak).
  const ensCard = (state.ensemble && !state.session && state.step===n-1) ? (()=>{
    const ekey=state._manKey+"|ens";
    if(state._ensKey!==ekey){ state._ensKey=ekey; state._ensSim=ensembleSim(state.plan, state.size); }
    const E=state._ensSim, pm=Math.round(100*E.fracMass);
    const main = (state.maneuverKey==="gufoniApo" && E.exitedN===0)
      ? t(`Żadna cząstka nie opuszcza kanału (0 z ${E.M}) — manewr KONWERSJI: celem jest zmiana postaci apo→geo; po nim ponowny Roll test i leczenie postaci geotropowej.`,`No particle leaves the canal (0 of ${E.M}) — a CONVERSION maneuver: the goal is the apo→geo change; afterward repeat the Roll test and treat the geotropic form.`)
      : E.exitedN===E.M
      ? t(`Cała chmura w łagiewce (${E.M} z ${E.M} cząstek) — w modelu kanał czysty. Kontrolny test pozycyjny wg protokołu.`,`The whole cloud is in the utricle (${E.M} of ${E.M} particles) — canal clear in the model. Control positional test per protocol.`)
      : t(`Usunięto ~${pm}% masy złogu (${E.exitedN} z ${E.M} cząstek chmury) — pozostają cząstki najdrobniejsze (najwolniejsze: τ ∝ r⁻², prawo Stokesa). <b>Powtórz test pozycyjny.</b>`,`Removed ~${pm}% of the debris mass (${E.exitedN} of ${E.M} cloud particles) — the finest (slowest: τ ∝ r⁻², Stokes' law) particles remain. <b>Repeat the positional test.</b>`);
    const swNote = (p.canal==="posterior" && E.exitedN>0)
      ? `<div class="note">${t("Po ekspulsji złóg ląduje w łagiewce, która leży nad niebańkowym ujściem kanału poziomego — część przypadków HC-BPPV powstaje jako „canal switch” po leczeniu kanału tylnego. Model przełączenia nie symuluje (cząstki po wyjściu są w łagiewce „bezpieczne”); przy nawrocie zawrotów po manewrze zbadaj także kanał poziomy (Roll test).","After expulsion the debris lands in the utricle, which lies above the non-ampullary opening of the horizontal canal — a share of HC-BPPV arises as a \"canal switch\" after posterior-canal treatment. The model does not simulate the switch (exited particles stay \"safe\" in the utricle); if vertigo recurs after the maneuver, examine the horizontal canal too (Roll test).")}</div>` : "";
    const dots=E.parts.map(p2=>{ const rr=3+3.5*(p2.m-0.7)/0.6;
      return `<span title="r ×${p2.m.toFixed(2)}${p2.exited?` — ${t("wyszła po","exited after")} ${Math.round(p2.tExit)} s`:` — ${t("pozostaje w kanale","remains in the canal")}`}" style="display:inline-block;width:${(2*rr).toFixed(1)}px;height:${(2*rr).toFixed(1)}px;border-radius:50%;margin:0 3px;${p2.exited?"background:var(--primary)":"border:1.5px solid var(--muted)"};vertical-align:middle"></span>`; }).join("");
    // wiersz kliniczny [H27]/[H29] (weryfikacja źródeł 2026-08-16; „80–93%" odrzucone — górne wartości
    // to POWTÓRZENIA): nie przy konwersji (gufoniApo — skuteczność CRP nie jest jej miarą)
    const clinNote = (state.maneuverKey!=="gufoniApo")
      ? `<div class="note">${t("Klinicznie POJEDYNCZY manewr repozycyjny znosi objawy u ~80% chorych (AAO-HNS 2017), a odsetek rośnie przy powtórzeniach; w warunkach RCT pełne ustąpienie zawrotu 56% vs 21% kontroli (OR 4,42 — Cochrane 2014). To odsetki PACJENTÓW, nie frakcja złogu — model pokazuje jeden z mechanizmów niepełnej skuteczności (dyspersję rozmiaru), nie porównuj liczb wprost.","Clinically a SINGLE repositioning maneuver abolishes symptoms in ~80% of patients (AAO-HNS 2017), and the rate rises with repetition; under RCT conditions complete resolution of vertigo is 56% vs 21% for controls (OR 4.42 — Cochrane 2014). These are shares of PATIENTS, not a debris fraction — the model shows one mechanism of incomplete efficacy (size dispersion); do not compare the numbers directly.")}</div>` : "";
    return `<div class="card" style="margin-top:10px">
        <div class="obslabel" style="margin-bottom:4px">${t("Chmura złogu — repozycja częściowa","Debris cloud — partial repositioning")}</div>
        <div style="margin:2px 0 6px;text-align:center">${dots}</div>
        <div class="note">${main}</div>${clinNote}${swNote}
        <div class="note">${t("Chmura (rozkład rozmiaru cząstek) i męczliwość przy powtórzeniach (rozpraszanie kłębka — oś rep, fatigueFactor) to OSOBNE osie modelu; chmura ich nie zastępuje. Oczy, pasek objawów i wędrówka otolitu pokazują cząstkę środkową chmury (kanoniczną symulację) — chmura żyje w liczbach tej karty.","The cloud (particle-size distribution) and fatigability across repetitions (clump dispersal — the rep axis, fatigueFactor) are SEPARATE model axes; the cloud does not replace them. The eyes, the symptom bar, and the otolith migration show the cloud's middle particle (the canonical simulation) — the cloud lives in this card's numbers.")}</div></div>`;
  })() : "";
  const rdCard = (_man.exited && state.step===n-1)
    ? `<div class="card" style="margin-top:10px">
        <div class="obslabel" style="margin-bottom:4px">${t("Co dalej — zawroty rezydualne (RD)","What next — residual dizziness (RD)")}</div>
        <div class="note">${t("Skuteczny manewr ≠ wyleczony pacjent: zawroty rezydualne utrzymują się u <b>31–61%</b> pacjentów po ustąpieniu oczopląsu (dysfunkcja łagiewki + niepełna kompensacja ośrodkowa).","A successful maneuver ≠ a cured patient: residual dizziness persists in <b>31–61%</b> of patients after the nystagmus resolves (utricular dysfunction + incomplete central compensation).")}</div>
        <div class="note">${t("<b>Poradnictwo</b> — wyjaśnienie, skąd biorą się objawy i że ustępują samoistnie — <b>zbija RD do ~13%</b>.","<b>Counselling</b> — explaining where the symptoms come from and that they subside on their own — <b>cuts RD to ~13%</b>.")}</div>
        <div class="note">${t("<b>Supresanty przedsionkowe są SZKODLIWE</b> — opóźniają kompensację. Zalecane: poradnictwo + rehabilitacja przedsionkowa (Özgirgin i wsp. 2024).","<b>Vestibular suppressants are HARMFUL</b> — they delay compensation. Recommended: counselling + vestibular rehabilitation (Özgirgin et al. 2024).")}</div></div>`
    : "";
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${p.name}</b><span>${CANALS[p.canal].label}</span></div>
      <div class="sidewrap"><em>${t("strona","side")}</em><div class="sidepill"><button data-s="L" aria-pressed="${p.side==='L'}" onclick="setGuideSide('L')">L</button><button data-s="P" aria-pressed="${p.side==='P'}" onclick="setGuideSide('P')">${t("P","R")}</button></div></div></div>
    ${os}
    <div class="sizerow"><span class="lbl">${t("Rozmiar złogu","Debris size")}<span class="um" title="${t("równoważna średnica kłębka — wyprowadzona z oporu Stokesa","equivalent clump diameter — derived from Stokes drag")}">~${Vestibular.sizeUm(state.size)} µm</span></span>
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
            <div class="nyslabel"><span class="arrow">${arrowGlyph(gn)}</span><span>${gn.label}</span></div>${libNote}
            ${gravArrow}
            <div class="fliphint">${FLIP_ICO} ${t("wędrówka otolitów","otolith migration")}</div></div>
          <div class="face back panelbox"><h4>${t("Wędrówka otolitów","Otolith migration")} — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal, {cupula:cupuloMech})}${gufoniNote}${basculeNote}${zumaNote}${kimNote}
            <div class="fliphint">${FLIP_ICO} ${t("widok frontalny","frontal view")}</div></div>
        </div></div>`
      : `<div class="panelbox" style="margin-bottom:12px"><h4>${t("Wędrówka otolitów","Otolith migration")} — ${CANALS[p.canal].label}</h4>${labyrinth(p.canal, {cupula:cupuloMech})}${gufoniNote}${basculeNote}${zumaNote}${kimNote}</div>`}
    ${/* PASEK OBJAWÓW (D5/V17) NIE JEST TU osobną kartą: mieszka w `.tcard` (symRow, niżej),
         gdzie jest AKTUALIZOWANY NA ŻYWO przez pętlę animacji kroku. futureUI miał tu drugą,
         statyczną kopię tych samych dwóch liczb — dwa paski o tych samych id i dwie różne
         wartości na jednym ekranie. Zostaje jeden, ten żywy. */""}
    ${/* CHMURA ZŁOGU (D9/V20): karta z gałęzi main — bogatsza od kopii futureUI (canal switch,
         wiersz kliniczny [H27]/[H29], osobny przypadek manewru KONWERSJI). Przełącznik trybu
         mieszka w powłoce (#sessionbar), więc karta pojawia się tylko przy włączonym trybie. */""}
    ${ensCard}
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
    ${rdCard}
    ${state.session ? (()=>{   // pasek sesji ciągłej (V10/D1) inline: przy wyłączonej sesji ZERO bajtów różnicy (golden)
      const S2=state.session, match=CANAL_OF[state.maneuverKey]===S2.canal;
      const chipS=(k,val)=>`<span style="display:inline-flex;gap:6px;align-items:baseline;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><span style="color:var(--muted)">${k}:</span><b>${val}</b></span>`;
      const chips = S2.exited
        ? `<span style="display:inline-flex;gap:6px;align-items:baseline;background:#3a8f6f22;border:1px solid #3a8f6f;border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><b>✓ ${t("złóg w łagiewce — kanał czysty","debris in the utricle — canal clear")}</b></span>`
        : chipS("φ", S2.phi==null ? t("spoczynek","rest") : `≈ ${Math.round(S2.phi)}°`) + chipS(t("wiązanie","bond"), `${Math.round(S2.bondFrac*100)}%`);
      const btn = (match && !S2.exited)
        ? `<button class="opt" style="min-height:auto;padding:9px 12px;font-size:13px;flex:0 0 auto;text-align:center" onclick="sessionManeuver()">${t("✓ Zalicz manewr do sesji","✓ Log the maneuver into the session")}</button>` : "";
      return `<div class="card" style="margin-top:10px">
        <div class="obslabel" style="margin-bottom:4px">${t("Sesja ciągła","Continuous session")}</div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">${chips}${chipS(t("akty","acts"), `${S2.acts.length} · ${Math.round(S2.tSession)} s`)}${btn}</div>
        <div class="note">${match
          ? t("„Zalicz” symuluje PEŁNY przebieg manewru z bieżącego stanu złogu (jedna nić: kroki + powrót do siadu) i zapisuje wynik do sesji — kontrolny test pozycyjny pokaże stan po repozycji.","\"Log\" simulates the FULL maneuver from the current debris state (a single thread: steps + return to sitting) and writes the result into the session — a control positional test will show the post-repositioning state.")
          : t("Manewr innego kanału niż złóg sesji — zaliczenie nieaktywne.","A maneuver for a different canal than the session debris — logging inactive.")}</div></div>`;
    })() : ""}
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
// ===== V23: karta canalith jam — pułapka obwodowa w widoku CPN (WYŁĄCZNIE kanał TYLNY) =====
// Bramka canal==="posterior" (parametr diagClassifyCard = effCanal) wyklucza antMode z konstrukcji
// (dix z downbeat → effCanal="anterior" → karty brak; sprzeczność treściowa niemożliwa). Wszystkie
// liczby z jamDemo (jedno źródło z pinem engine.jam). ZAKAZ xiEnvelope na nici jam (plateau:
// tEnd=lastT — oczy zamarzałyby po końcu danych); pętla ciągła przez envOv {env:()=>1, tEnd:Infinity}
// (kontrakt startNys: warunek stopu nigdy nie zachodzi; rAF w harnessie zneutralizowany — golden
// widzi wyłącznie statyczny markup).
function jamCard(side){
  const J=jamDemo(side), f2=x=>(+x).toFixed(2);
  const chip=(k,v)=>`<span style="display:inline-flex;gap:6px;align-items:baseline;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><span style="color:var(--muted)">${k}:</span><b>${v}</b></span>`;
  const N=nysFromDyn("posterior", side, JAM_DEMO.xi, false);
  const relChip=(lbl,v,star)=>chip(lbl, `${v>0?"+":""}${f2(v)}${star?" ★":""}`);
  const mrow=(name,txt,warn)=>`<div style="display:grid;grid-template-columns:110px 1fr;gap:8px;padding:5px 0;border-top:1px solid var(--line);font-size:12.5px"><b${warn?' style="color:#b0813f"':''}>${name}</b><span>${txt}</span></div>`;
  const holdTxt=t("TRZYMA — oczopląs bez zmian (stan ustalony ξ=0,50) przez cały manewr","HOLDS — nystagmus unchanged (steady state ξ=0.50) throughout the maneuver");
  return `<div class="panelbox" style="margin-top:10px"><h4>${t("Pułapka obwodowa — canalith jam (czop złogu)","A peripheral pitfall — canalith jam (a debris plug)")}</h4>
    <div class="eyesrow"><span class="emk">${t("P","R")}</span><div class="eyeswrap" data-jamnys>${eyesSVG()}</div><span class="emk">L</span></div>
    <div class="nyslabel"><span class="arrow">${arrowGlyph(N)}</span><span>${N.label}${t(" · uporczywy · pozycjo-niezależny · niemęczliwy"," · persistent · position-independent · non-fatiguing")}</span></div>
    <div class="note">${t("Ten sam oczopląs w KAŻDEJ pozycji — nić symulacji prowokacji Dix z powrotem do siadu (końce segmentów):","The same nystagmus in EVERY position — a simulation thread of the Dix provocation with return to sitting (segment ends):")}</div>
    <div>${chip(t("Dix (prowokacja)","Dix (provocation)"), `ξ=${f2(J.dix.endXi[0])}`)}${chip(t("siad po prowokacji","sitting after provocation"), `ξ=${f2(J.dix.endXi[1]!=null?J.dix.endXi[1]:J.dix.endXi[0])}`)}</div>
    <div class="note">${t("Zmiana pozycji nie odwraca go i nie gasi; siadanie nie daje odwrócenia. Wygląda ośrodkowo — ale kierunek wciąż PASUJE DO JEDNEGO kanału (tu: tylny — upbeat ze skrętem), a objawów neurologicznych brak. Mechanizm (model): czop zbitych otoconiów klinuje się w świetle przewodu przy wejściu do odnogi wspólnej (φ=306,8°) i blokuje przepływ — osklepek zostaje w stałym odchyleniu, więc oczopląs nie zależy od pozycji głowy. STATUS ŹRÓDŁOWY: kazuistyka — częstość nieznana, ustalonego postępowania brak; próg uwolnienia 0,60 g i zapas 0,3 g·s to jawne WYBORY KALIBRACYJNE modelu (emergencja jamu wymagałaby średnic przewodu — granica źródła).","A change of position neither reverses nor extinguishes it; sitting up brings no reversal. It looks central — yet the direction still FITS A SINGLE canal (here: posterior — upbeat with torsion), and there are no neurological signs. Mechanism (model): a plug of clumped otoconia wedges in the duct lumen at the entrance to the common crus (φ=306.8°) and blocks the flow — the cupula stays constantly deflected, so the nystagmus does not depend on head position. SOURCE STATUS: case reports — frequency unknown, no established management; the release threshold 0.60 g and the 0.3 g·s reserve are explicit CALIBRATION CHOICES of the model (emergent jam would require duct diameters — a source boundary).")}</div>
    <div class="obslabel" style="margin-top:8px">${t("Predykcja modelu (żywa symulacja, kanał tylny):","Model prediction (live simulation, posterior canal):")}</div>
    ${mrow("Epley", J.epley.jammed?holdTxt:"—")}
    ${mrow("Semont", J.semont.jammed?holdTxt:"—")}
    ${mrow("Bascule", J.bascule.jammed?holdTxt:"—")}
    ${mrow("Yacovino", t(`UWALNIA czop ~${f2(J.yac.relDelta)} s po wejściu w deep head-hang; potem transjent ODWRÓCONY do ξ=${f2(J.yac.minXi)} (krok „broda do klatki”) i zwykła kanalolitiaza`,`RELEASES the plug ~${f2(J.yac.relDelta)} s after entering the deep head-hang; then a REVERSED transient down to ξ=${f2(J.yac.minXi)} (the chin-to-chest step) and ordinary canalithiasis`), true)}
    <div class="note">${t("DLACZEGO: uwolnienie wymaga UTRZYMANEJ siły stycznej ponad progiem (iglica przejścia nie uwalnia). Napęd uwolnienia w pozach standardowych (próg 0,60):","WHY: release requires a SUSTAINED tangential force above the threshold (a transition spike does not release). Release drive in the standard positions (threshold 0.60):")}</div>
    <div>${relChip(t("siad","sitting"), J.relMap.sit)}${relChip(t("Dix chory","Dix affected"), J.relMap.dixAff)}${relChip(t("Dix zdrowy","Dix healthy"), J.relMap.dixHeal)}${relChip(t(`na wznak (głowa ~${HC_TILT_TXT}°)`,`supine (head ~${HC_TILT_TXT}°)`), J.relMap.supine)}${relChip("deep head-hang", J.relMap.deepHang, true)}${relChip(t("broda do klatki","chin to chest"), J.relMap.chin)}</div>
    <div class="note">${t("★ deep head-hang to JEDYNA standardowa poza nad progiem — siad wręcz DOCISKA czop (czas nie leczy). Uwolnienie ≠ wyleczenie: koniec pełnego Yacovino zostawia złóg W KANALE (φ≈","★ the deep head-hang is the ONLY standard position above the threshold — sitting actually PRESSES the plug in (time does not cure). Release ≠ cure: the end of the full Yacovino leaves the debris IN THE CANAL (φ≈")}${Math.round(J.yac.finalPhi)}°${t(") — to już zwykła kanalolitiaza. Epley wykonany BEZPOŚREDNIO po uwolnieniu czyści kanał (ekspulsja ","); — now ordinary canalithiasis. An Epley performed IMMEDIATELY after the release clears the canal (expulsion ")}${f2(J.postEpley.expelDur)}${t(" s). Sekwencja kliniczna: Yacovino (uwolnij) → kontrolny Dix (typowy przemijający oczopląs potwierdza uwolnienie) → Epley (repozycja)."," s). Clinical sequence: Yacovino (release) → a control Dix (a typical transient nystagmus confirms the release) → Epley (repositioning).")}</div>
    <div class="note" style="color:var(--ant)">${t("DYSCYPLINA: jam to rozpoznanie z WYKLUCZENIA — domyślna ścieżka pozycjo-niezależnego oczopląsu pozostaje OŚRODKOWA (najpierw flagi i MRI powyżej). O jamie myśl dopiero, gdy: kierunek pasuje do JEDNEGO kanału + wywiad BPPV/świeżego manewru + ZERO objawów neurologicznych. Nie mylić z ramieniem bańkowym (short arm): predykcja „Epley-nie/Yacovino-tak” dotyczy zaklinowanego CZOPU, nie wolnego złogu w ramieniu.","DISCIPLINE: jam is a diagnosis of EXCLUSION — the default path for position-independent nystagmus remains CENTRAL (flags and MRI above come first). Think of jam only when: the direction fits a SINGLE canal + a history of BPPV/a recent maneuver + ZERO neurological signs. Do not confuse it with the short (ampullar) arm: the „Epley-no/Yacovino-yes” prediction concerns an impacted PLUG, not free debris in the arm.")}</div></div>`;
}
/* wsparcie: plakietka tieru („zespół ustalony") jest NAJMOCNIEJSZYM twierdzeniem o pewności
   na tym ekranie, więc pokazuje się wyłącznie przy PEŁNYM opisie obserwacji. Przy opisie
   częściowym zostaje podtyp i kryteria — czyli „do tego wzorca to pasuje" — bez etykiety
   sugerującej, że sprawa jest ustalona. */
function diagClassifyCard(canal, v, side, antMode, mech, wsparcie){   // 5. i 6. parametr: mechanizm (D4/V16, main) ORAZ wsparcie opisu (Blok 9, futureUI) — dwie różne osie, obie potrzebne
  const central=!!state.diagCentral;
  const cls=baranyClassify(canal, v, side, antMode, mech);
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
      <div class="note">${t('Kryteria Bárány Society (ICVD 2015) — [H48] von Brevern 2015. „Zespół ustalony" = podtyp z sekcji 2 pracy; „wyłaniający się/atypowy" = sekcja 3, czyli opisany, ale niedostatecznie potwierdzony — potwierdź i wyklucz przyczynę ośrodkową. Postaci opisane jako „poza klasyfikacją ICVD" nie należą do żadnej z tych dwóch sekcji.','Bárány Society criteria (ICVD 2015) — [H48] von Brevern 2015. "Established syndrome" = a subtype from section 2 of the paper; "emerging/atypical" = section 3, i.e. described but insufficiently confirmed — confirm and rule out a central cause. Forms labelled "outside the ICVD classification" belong to neither section.')}</div>`;
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
      <div class="note" style="color:var(--text)">${t('<b>Postępowanie:</b> NIE wykonuj repozycji. Skieruj na ocenę neurologiczną + MRI tylnego dołu (móżdżek, pogranicze szczytowo-potyliczne: malformacja Chiariego; SM; zmiany naczyniowe). Łagodny mimik do rozważenia: <b>migrena przedsionkowa</b> — bywa czysto pozycyjna i wtedy naśladuje BPPV; kryteria i cechy różnicujące na karcie „Kryteria migreny przedsionkowej” (ekran HINTS) [H46] Lempert 2022. <b>To rozpoznanie z WYKLUCZENIA</b> — przy cechach ośrodkowych domyślną ścieżką pozostaje MRI; łagodny mimik rozpoznaje się PO wykluczeniu, nie zamiast niego.','<b>Management:</b> Do NOT perform repositioning. Refer for neurological evaluation + MRI of the posterior fossa (cerebellum, craniocervical junction: Chiari malformation; MS; vascular lesions). A benign mimic to consider: <b>vestibular migraine</b> — it may be purely positional and then mimics BPPV; the criteria and differentiating features are on the \"Diagnostic criteria for vestibular migraine\" card (HINTS screen) [H46] Lempert 2022. <b>It is a diagnosis of EXCLUSION</b> — with central features the default path remains MRI; a benign mimic is diagnosed AFTER exclusion, not instead of it.')}</div>`;
  // data-flow-anchor + tabindex: cel przewijania dla kroku „Interpretacja" w pasku przebiegu
  // (Blok 5). Kotwica MUSI być w markupie, a nie doczepiana po renderze: doczepianie działałoby
  // tylko dlatego, że wyrocznia czyta innerHTML synchronicznie i nie widzi rAF — czyli opierałoby
  // bezpieczeństwo na tym, czego golden NIE obejmuje. tabindex="-1" jest konieczny, żeby po
  // przewinięciu dało się przenieść fokus (czytnik ekranu musi wiedzieć, gdzie wylądował).
  return `<div class="card" style="margin-top:12px" data-flow-anchor="interpret" tabindex="-1">
      <div class="obslabel" style="margin-bottom:8px">${t("Klasyfikacja wg Bárány (ICVD) i różnicowanie ośrodkowe","Bárány classification (ICVD) and central differentiation")}</div>
      ${seg}${central?cpn+(canal==="posterior"?jamCard(side):""):bppv}</div>`;
}
// ===== Mini-karta „znajdź płaszczyznę zerową" (ocena II, V12/D3) =====
// Renderowana na karcie ROLL, NIEZALEŻNIE od state.variant: porównuje OBA mechanizmy trwałej kupulopatii
// (heavy=apo vs light=geo) z JEDNEGO suwaka yaw — trzeci mechanizm jako oś porównania, nie trzeci stan
// (flip-karta mechanizmu zostaje binarna; rozdział fenotyp/mechanizm = D4). Suwak żyje w DOM (bez pola
// w state — re-render wraca do 0; zmiana strony i tak unieważnia znak yaw). Napisy generowane z TEGO
// SAMEGO celu co strzałki (bltDirWord + nullScan) — konwencja V5, sprzeczność strukturalnie niemożliwa.
function setNullYaw(v){
  const A=state.side, yaw=Math.round(+v||0);
  const val=$('[data-nullyawval]'); if(val) val.textContent=(yaw>0?"+":"")+yaw+"°";
  const q=stepHeadQ("supineFlex", yaw, "up"), sc=nullScan(A, yaw);
  for(const [tag, variant, r] of [["heavy","cupulo",sc.heavy],["light","light",sc.light]]){
    const base=nysFromGeom("horizontal", A, variant, q, "flat");
    const sub = r.intensity < XI_CARD;                    // wokół zera etykieta NIE miga słowem kierunkowym
    const nys = sub ? {...base, dir:0, strength:0, anat:{h:0,v:0,t:0}, fatigue:1, init:null, unresolved:true}
                    : {...base, strength:r.intensity, fatigue:1, init:null};
    const c=$(`[data-nullnys-${tag}]`); if(c) startNys(c, nys, {env:()=>r.intensity, tEnd:Infinity});
    const ar=$(`[data-nullarr-${tag}]`); if(ar) ar.textContent=arrowGlyph(nys);
    const lb=$(`[data-nulllab-${tag}]`); if(lb) lb.textContent = sub
      ? t("≈ płaszczyzna zerowa — oczopląs cichnie","≈ null plane — the nystagmus falls silent")
      : bltDirWord(A, r.towardA) + t(" · uporczywy"," · persistent");
  }
}
function nullPointCard(A){
  const np=nullYawOf(A);
  const row=(tag,name)=>`<div class="panelbox" style="margin-top:8px"><h4>${name}</h4>
    <div class="eyesrow"><span class="emk">${t("P","R")}</span><div class="eyeswrap" data-nullnys-${tag}>${eyesSVG()}</div><span class="emk">L</span></div>
    <div class="nyslabel"><span class="arrow" data-nullarr-${tag}></span><span data-nulllab-${tag}></span></div></div>`;
  return `<div class="card" style="margin-bottom:4px">
    <div class="obslabel" style="margin-bottom:4px">${t("Znajdź płaszczyznę zerową — trwała kupulopatia: heavy (apo) vs light (geo)","Find the null plane — persistent cupulopathy: heavy (apo) vs light (geo)")}</div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <span style="font-size:12px;color:var(--muted)">${t("na wznak (pozycja Rolla), skręt głowy","supine (Roll position), head turn")}</span>
      <input type="range" min="-90" max="90" step="1" value="0" aria-label="${t("Skręt głowy w osi pionowej (yaw)","Head turn in the vertical axis (yaw)")}" oninput="setNullYaw(this.value)" style="flex:1;min-width:160px">
      <b class="mono" data-nullyawval>0°</b>
    </div>
    ${row("heavy", t("Ciężki osklepek — kupulolitiaza (DCPN apogeotropowy)","Heavy cupula — cupulolithiasis (apogeotropic DCPN)"))}
    ${row("light", t("Light cupula (DCPN geotropowy TRWAŁY)","Light cupula (PERSISTENT geotropic DCPN)"))}
    <div class="note">${t(`Płaszczyzna zerowa jest WSPÓLNA dla obu mechanizmów (model tej geometrii: ${np>0?"+":""}${np}° ku uchu choremu; klinicznie typowo ~20–30°, opisywany zakres 0–85°) — potwierdza STRONĘ. Mechanizm czyta się z KIERUNKU oczopląsu wokół zera (pełne odwrócenie heavy↔light: przemiataj ku ±90°) i z CZASU: oba trwałe i niemęczliwe, ale light jest geotropowy jak kanalolitiaza — różnicuje TRWAŁOŚĆ (>1 min) i null point, którego kanalolitiaza nie ma. Uwaga (model): wokół zera rozciąga się szerokie pasmo ciszy (~±25° — rzuty grawitacji przy linii środkowej są w tej geometrii małe, a odpowiedź hamująca dodatkowo słabnie przez rektyfikację); klinicznie oczopląs bywa widoczny bliżej linii środkowej, a null jest punktowy. „Light cupula" to nazwa WZORCA (mechanizm nieustalony — 5 hipotez); manewry repozycyjne: skuteczność 0%, leczeniem jest rozpoznanie, wyjaśnienie i obserwacja.`,`The null plane is COMMON to both mechanisms (this geometry's model: ${np>0?"+":""}${np}° toward the affected ear; clinically typically ~20–30°, reported range 0–85°) — it confirms the SIDE. The mechanism is read from the nystagmus DIRECTION around the null (full heavy↔light reversal: sweep toward ±90°) and from TIME: both are persistent and non-fatiguing, but light is geotropic like canalithiasis — what differentiates is PERSISTENCE (>1 min) and the null point, which canalithiasis does not have. Model note: a wide silence band (~±25°) surrounds the zero — gravity projections near the midline are small in this geometry, and inhibitory responses are further weakened by rectification; clinically the nystagmus is often visible closer to the midline, and the null is point-like. "Light cupula" names a PATTERN (mechanism unsettled — 5 hypotheses); repositioning maneuvers: 0% efficacy — the treatment is recognition, explanation and observation.`)}</div></div>`;
}
// ===== Selektor scenariuszy historii pozycyjnej (V5; od V11/D2 WSPÓLNY dla kart B&L i lying-down) =====
// state.bltScenario jest CELOWO jednym polem obu kart HC: scenariusz = historia PACJENTA, nie testu —
// „ta sama godzina życia pacjenta → dwa testy" (bltInit memo współdzielone). Ekstrakcja bajt-w-bajt
// z bltPanel (dowód: --check 0 diff po samej ekstrakcji, przed featurą V11).
function scenPanelHTML(A, scen, banner, seedMode){
  // V19, seedMode: selektor zmienia funkcję na ZASIEW — klik = akt otwierający (seedSessionFromScenario
  // RESTARTUJE sesję z historią jako startem); przyciski bez aria-pressed (akcja, nie stan).
  const btn=k=>{ const ini=bltInit(A,k);
    const small = ini.exitedInHistory ? t("kanał opróżniony","canal emptied")
      : ini.phi0!=null ? `φ₀ ≈ ${Math.round(ini.phi0)}°` : t("φ₀ ≈ 200° (spoczynek)","φ₀ ≈ 200° (rest)");
    if(seedMode) return `<button class="opt" onclick="seedSessionFromScenario('${k}')" aria-label="${t(`Ustaw historię jako akt otwierający sesji`,`Set this history as the session's opening act`)}"><b>${BLT_HISTORY[k].label}</b><small>${small} · ${t("ustaw start","set start")}</small></button>`;
    return `<button class="opt" aria-pressed="${scen===k}" onclick="setBltScenario('${k}')"><b>${BLT_HISTORY[k].label}</b><small>${small}</small></button>`; };
  const head = seedMode
    ? t("Historia pozycyjna — ustaw jako START sesji (akt otwierający):","Positional history — set as the session START (opening act):")
    : t("Historia pozycyjna przed testem (ustala położenie złogu):","Positional history before the test (pins the debris position):");
  return `<div class="obsrow"><div class="obslabel">${head}</div>
      <div class="seg" style="flex-wrap:wrap">${Object.keys(BLT_HISTORY).map(btn).join("")}</div>
      <div class="note" style="margin-top:8px">${banner}</div></div>`;
}
// ===== D7/V21: banner egzaminu + karta klucza odpowiedzi (po odsłonie) =====
// Klucz odpowiedzi WYŁĄCZNIE z baranyClassify+recommend (jedno źródło prawdy — examAnswerKey);
// wiersz PRIORS pokazuje, z jakim p pacjent został wylosowany (jawna epidemiologia tabeli).
function examBanner(){
  const E=state.exam; if(!E) return "";
  const btn=(fn,txt,extra)=>`<button class="opt" style="min-height:auto;padding:9px 12px;font-size:13px;flex:0 0 auto;text-align:center${extra||""}" onclick="${fn}">${txt}</button>`;
  const head=`<div class="obslabel" style="margin-bottom:4px">${t("Egzamin — zbadaj pacjenta","Exam — examine the patient")} <span class="mono" style="color:var(--muted)">#${E.seed}</span></div>`;
  const btns=`<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">${E.revealed?"":btn("examReveal()", t("Odsłoń rozpoznanie","Reveal the diagnosis"))}${btn("newExamPatient()", t("🎲 Nowy pacjent","🎲 New patient"))}${btn("examEnd()", t("Zakończ egzamin","End the exam"),";opacity:.85")}</div>`;
  if(!E.revealed){
    return `<div class="card" style="margin-bottom:4px">${head}
      <div class="note" style="margin-top:0">${t("Pacjent wylosowany z tabeli PRIORS (epidemiologia jawna w kodzie) — rozpoznanie UKRYTE. Wybieraj testy i strony badane (przełącznik „strona” to strona BADANA, nie chora), obserwuj oczopląs per pozycja, powtarzaj prowokacje (męczliwość). Postaw rozpoznanie: kanał(y), strona, wariant — potem „Odsłoń”. Fazy to prowokacje IZOLOWANE z siadu.","A patient drawn from the PRIORS table (epidemiology explicit in the code) — the diagnosis is HIDDEN. Choose tests and tested sides (the „side” switch is the side being TESTED, not the affected one), watch the nystagmus per position, repeat provocations (fatigability). Make your diagnosis: canal(s), side, variant — then „Reveal”. Phases are ISOLATED provocations from sitting.")}</div>${btns}</div>`;
  }
  const rowLab=(PRIORS.find(w=>w.key===E.row)||{label:E.row}).label;
  const chip=([k,val])=>`<span style="display:inline-flex;gap:6px;align-items:baseline;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><span style="color:var(--muted)">${k}:</span><b>${val}</b></span>`;
  const parts=examAnswerKey(E.lesions).map(a=>{
    const sideTxt = a.canal==="anterior"
      ? t(`${SIDE[a.side]} (w modelu) — lateralizacja AC z oczopląsu NIEWIARYGODNA (torsja u chorego często nieobecna, a przeciwstronne apo-PC wygląda tak samo); model daje maksimum w Dix IPSILATERALNYM, klasyczna reguła uczy ucha przeciwnego — granica źródła`,`${a.side==="L"?"left":"right"} (in the model) — AC lateralization by nystagmus is UNRELIABLE (the torsion is often absent in patients, and a contralateral apo-PC looks the same); the model peaks in the IPSILATERAL Dix, the classical rule teaches the opposite ear — a source boundary`)
      : SIDE[a.side];
    const recBtns = a.rec.primary ? `<div class="recobtns" style="margin-top:6px"><button class="recoprimary" onclick="startManeuver('${a.rec.primary}')">${t("Rozpocznij: ","Start: ")}${MANEUVERS[a.rec.primary].label} — ${MANEUVERS[a.rec.primary].desc}</button></div>` : "";
    return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line)">
      <div><b>${a.classify.subtype}</b> <span style="color:var(--muted)">(${a.classify.tierLabel})</span></div>
      <div class="note" style="margin-top:4px">${t("Strona chora:","Affected side:")} <b>${sideTxt}</b></div>
      <div>${a.classify.crit.map(chip).join("")}</div>
      <div class="note">${a.rec.note}</div>${recBtns}</div>`;
  }).join("");
  const multiNote = E.lesions.length>1 ? `<div class="note">${t("Dwie zmiany: lecz SEKWENCYJNIE — zacznij od zmiany bardziej objawowej i wykonaj kontrolę przed leczeniem kolejnej (jedna repozycja na posiedzenie ułatwia interpretację kontroli).","Two lesions: treat SEQUENTIALLY — start with the more symptomatic lesion and re-check before treating the next (one repositioning per sitting keeps the follow-up interpretable).")}</div>` : "";
  return `<div class="card" style="margin-bottom:4px">${head}
    <div style="display:inline-block;padding:4px 10px;border-radius:12px;background:#3a8f6f22;border:1px solid #3a8f6f;font-size:12.5px;color:#D4DEE8">${t("Klucz odpowiedzi","Answer key")} · ${rowLab} · ${t("wylosowano z","drawn with")} p=${(E.p*100).toFixed(1)}%</div>
    ${parts}${multiNote}
    <div class="note">${t("Klucz zbudowany z tych samych funkcji, które zasilają karty (baranyClassify + recommend) — zero drugiej implementacji. Fazy egzaminu to prowokacje izolowane; sekwencyjność i samooczyszczanie → sesja ciągła.","The key is built from the same functions that power the cards (baranyClassify + recommend) — no second implementation. Exam phases are isolated provocations; sequencing and self-clearing → the continuous session.")}</div>${btns}</div>`;
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
  /* TON EKRANU = BADANY KANAŁ (scena kliniczna, tura 2 paczki: „kafel próby ma ton kanału
     tylnego, więc kod barwny ze Startu ciągnie się na ekran"). Ton wchodzi INLINE, a nie klasą
      `quick--kpost` jak na Starcie: tam ton opisywał ZNACZENIE pozycji w stałym menu, tutaj
     opisuje BADANY KANAŁ i zmienia się z próbą oraz z obserwacją (antMode). Klasa zamroziłaby
     go w markupie i rozjechała przy pierwszej zmianie mapy próba→kanał.
     Atrament dobrany per ton — jeden wspólny czarny brudzi bursztyn kanału poziomego. */
  const TON_KANALU = { posterior:["--post","#0B221F"], horizontal:["--horiz","#2A1E02"], anterior:["--ant","#1A1230"] };
  const [tonVar, tonInk] = TON_KANALU[effCanal] || ["--primary","#03242E"];
  const TON = `--tone:var(${tonVar});--tone-ink:${tonInk}`;
  /* STRONA NIE WYNIKA Z POZY (poprawka 2026-08-16). Do V26 stało tu `antMode ? otherSide(A) : A`
     — „kanał przedni ucha PRZECIWNEGO, płaszczyzna LARP/RALP". To rozumowanie o PARZE
     WSPÓŁPŁASZCZYZNOWEJ: rządzi vHIT-em i odruchem z obrotu głowy, gdzie napęd daje wspólny
     przepływ endolimfy. W BPPV napęd daje własny złóg JEDNEGO kanału i na partnera się nie
     przenosi. Kwerenda: [H33] Bertholon 2002 — prowokacja OBUSTRONNA w Dix-Hallpike u 9/12, więc
     strona badanego Dixa ucha NIE identyfikuje. Skutek starej reguły był LECZNICZY: karta
     uruchamiała Yacovino dla ucha wyliczonego z pozy. Dziś karta rysuje kanał przedni ucha
     BADANEGO (to on ma w tej pozie napęd dodatni: +0.0382 wobec −0.0312 po drugiej stronie),
     a stronę oddaje TORSJI — z jawną notą, że u większości chorych torsji nie widać. */
  const effSide  = A;
  const mech = mechOf(v, state.mechanism, effCanal);
  const rawPhases = D.phases(A, v, state.bltScenario, mech);   // 3. argument: scenariusz historii (karty SCEN_DRIVEN); 4.: mechanizm (D4 — karty HC)
  const bltMeta = rawPhases.blt || null;                    // metadane scenariusza (właściwość na tablicy — .map ją gubi, więc łapiemy tu)
  const ldtMeta = rawPhases.ldt || null;                    // analogicznie dla lying-down (V11/D2)
  const phases = rawPhases.map(ph => antMode
    ? { ...ph, nys: nysFromGeom("anterior", effSide, v, stepHeadQ("supineHang", A==="P"?45:-45, "up")),   // TA SAMA poza co reszta aplikacji (było własne qSupineYaw z silnika)
        label: t("ku dołowi + skrętny ku uchu choremu (kanał przedni)","downward + torsional toward the affected ear (anterior canal)"),
        note: t(`To NIE kanał tylny — downbeat wskazuje kanał PRZEDNI. Ułożenie głowy bez zmian; różni się tylko zaobserwowany oczopląs. STRONY NIE USTALA POZYCJA: kanał przedni bywa prowokowany w Dix-Hallpike'u po OBU stronach (9/12 chorych — [H33]). Stronę niesie TORSJA: górny biegun bije ku uchu CHOREMU ([H32]) — ale u 57% potwierdzonych przypadków torsji nie widać ([H31]), a taki sam obraz daje apogeotropowe BPPV kanału TYLNEGO drugiej strony.`,`This is NOT the posterior canal — a downbeat indicates the ANTERIOR canal. Head positioning unchanged; only the observed nystagmus differs. THE POSITION DOES NOT GIVE THE SIDE: the anterior canal is often provoked in the Dix-Hallpike on BOTH sides (9/12 patients — [H33]). The side comes from the TORSION: the upper pole beats toward the AFFECTED ear ([H32]) — but in 57% of confirmed cases there is no visible torsion ([H31]), and apogeotropic posterior-canal BPPV of the other side looks the same.`) }
    : ph);
  // MĘCZLIWOŚĆ: przy powtórzeniach prowokacji Dix-Hallpike kanalolitiaza SŁABNIE, kupulolitiaza NIE (różnicowanie).
  // fatigue = ortogonalny mnożnik amplitudy (startNys/startDialNysIn); kupulo = 1 (nie wyczerpuje się).
  // W SESJI (V10/D1) mnożnik = 1: dyspersja (rep→gc) siedzi już w ξ symulacji sesji — mnożenie w renderze
  // liczyłoby ją DWA razy.
  const dixRep = (isDix && !antMode) ? (state.dixRep||0) : 0;
  /* MECZLIWOSC LICZONA RAZ, NIGDY DWA RAZY (sesja ciagla D1/V10, opt-in — 2026-08-15).
     `fatigueFactor(rep)` jest MNOZNIKIEM amplitudy dokladanym w renderze. Sesja ciagla liczy to samo
     zjawisko EMERGENTNIE: zlog zostaje po prowokacji przesuniety (zmierzone: phi 173,0 po Dix), wiec
     kolejna prowokacja zastaje go dalej od banki i odpowiedz slabnie SAMA.
     ZMIERZONE, ze to DWA OPISY TEGO SAMEGO: sesja daje 0,621 / 0,400 / 0,266 dla powtorzen 1-3,
     mnoznik 0,630 / 0,406 / 0,270 — zgodnosc ponizej 1,5 %. Zastosowanie OBU naraz podnosi
     meczliwosc DO KWADRATU (0,391 zamiast 0,621 przy pierwszym powtorzeniu), czyli oczoplas gasnie
     dwa razy szybciej niz mowi ktorykolwiek z modeli.
     Dlatego mnoznik obowiazuje WYLACZNIE przy sesji WYLACZONEJ. Bramka MC1-MC3 w man:dom pilnuje
     tego w obie strony — to nie komentarz do zapamietania, tylko warunek sprawdzalny. */
  const sesjaOn = !!state.session;
  // D4/V16 (main): trwałość czyta `persistentOf(mech)`, nie sam wariant — „light" się NIE męczy, „short" TAK.
  const fatFactor = (persistentOf(mech) || sesjaOn) ? 1 : Vestibular.fatigueFactor(dixRep);
  phases.forEach(ph=>{ if(ph.nys) ph.nys.fatigue = fatFactor; });
  // ===== Sesja ciągła (ocena II, V10/D1): fazy karty liczone ze STANU sesji — jedna nić symulacji, a TEN SAM
  // init płynie do obwiedni animacji (szew V5: startNys/startDialNysIn → engineXi(nys.init)) — karta i animacja
  // z jednego stanu, sprzeczność strukturalnie niemożliwa. antMode poza (kanał efektywny ≠ kanał sesji).
  // V19: karty SCEN_DRIVEN (bowlean/lyingdown) TEŻ czytają sesję — osobna gałąź niżej (konwencja V5:
  // strzałka+napis z jednego ξ przez bltDirWord; obsługa ekspulsji per faza — R10 na żywo).
  const S = state.session;
  const sessDrive = S && mech==="canalo" && !antMode && S.canal===effCanal && S.side===effSide;   // D4: sesja modeluje wyłącznie wolny złóg DŁUGIEGO ramienia
  if(sessDrive && !SCEN_DRIVEN.has(state.testKey)){
    const pv = sessionPreview(S, state.testKey);
    const sInit = sessionInit(S);
    phases.forEach((ph,i)=>{
      if(!ph.nys) return;
      // V25: „gone" = złóg był poza kanałem JUŻ NA POCZĄTKU tej fazy (S.exited przed aktem albo
      // ekspulsja we WCZEŚNIEJSZYM kroku). Dawne `pv.exited` (stan KOŃCA aktu) rzutowało wstecz na
      // wszystkie fazy — od V25, gdy akt Roll opróżnia kanał w fazie 3, dawało to kartę mówiącą,
      // że ŚWIEŻY chory ma niemy test obustronny. Ta sama semantyka co gałąź SCEN_DRIVEN niżej.
      const pvp = pv.phases[i]||{xi:0};
      const gone = !!S.exited || pvp.gone===true;
      const xi = gone ? 0 : pvp.xi;
      const N = nysFromDyn(effCanal, effSide, xi, false);
      if(gone || N.strength < XI_CARD){
        Object.assign(ph.nys, {dir:0, vdir:1, strength:0, anat:{h:0,v:0,t:0}, unresolved:true, init:null, fatigue:1});
        ph.label = gone
          ? t("kanał wyczyszczony — brak odpowiedzi","canal cleared — no response")
          : t("odpowiedź podprogowa (złóg blisko równowagi lub związany)","subthreshold response (debris near equilibrium or bound)");
        ph.note = gone
          ? t("Złóg opuścił kanał w tej sesji — prowokacja niema. Tak wygląda kontrolny test zaraz po skutecznej repozycji. Uwaga kliniczna: ujemny test NATYCHMIAST po manewrze nie dowodzi wyleczenia (NPV ~72% — nakłada się męczliwość); wiarygodna kontrola śródsesyjna po ≥30 min siadu, formalna ocena wg AAO-HNS w ciągu miesiąca.","The debris left the canal in this session — the provocation is mute. This is what a control test right after successful repositioning looks like. Clinical caveat: a negative test IMMEDIATELY after the maneuver does not prove cure (NPV ~72% — fatigability overlaps); a reliable within-session check needs ≥30 min upright, formal reassessment per AAO-HNS within a month.")
          : t("Stan sesji: złóg leży blisko równowagi tej pozycji albo trzyma go wiązanie — napęd podprogowy.","Session state: the debris lies near this position's equilibrium or is held by its bond — subthreshold drive.");
      } else {
        Object.assign(ph.nys, {dir:N.dir, vdir:N.vdir, strength:N.strength, anat:N.anat, excited:N.excited,
          reversed:N.reversed, unresolved:false, fatigue:1, init:sInit});
        ph.label = N.label;
        if(pvp.exited) ph.note = t("W TEJ pozycji złóg dochodzi do ujścia i opuszcza kanał — odpowiedź jest pełna, ale to OSTATNIA prowokacja tego złogu: kolejny (kontrolny) test będzie niemy. Test wykonuje pracę manewru (R10, Bhandari 2022) — ujemna kontrola NIE dowodzi tu wyleczenia sprzed badania.","In THIS position the debris reaches the outlet and leaves the canal — the response is full, but it is the LAST provocation of this debris: the next (control) test will be mute. The test does the maneuver's job (R10, Bhandari 2022) — a negative control here does NOT prove the patient was already cured.");
        else if(state.testKey==="roll") ph.note = t("Sesja liczy Roll jako SEKWENCJĘ (chore→centrum→zdrowe): pierwsza faza PRZEMIESZCZA złóg, więc amplitudy faz nie są już czystym porównaniem Ewalda z karty statycznej (fazy izolowane) — kolejność wykonania zmienia wynik (R10, Bhandari 2022).","The session computes the Roll as a SEQUENCE (affected→center→healthy): the first phase DISPLACES the debris, so the phase amplitudes are no longer the static card's clean Ewald comparison (isolated phases) — the order of execution changes the result (R10, Bhandari 2022).");
        else if(S.acts.length>0) ph.note = t(`Stan sesji (po ${S.acts.length} ${S.acts.length===1?"akcie":"aktach"}): amplituda i latencja WYNIKAJĄ z położenia złogu i wiązania po poprzednich aktach — męczliwość to głównie pozycja, nie „zużycie" (panel sesji niżej).`,`Session state (after ${S.acts.length} act${S.acts.length===1?"":"s"}): amplitude and latency FOLLOW from the debris position and bond after the previous acts — fatigability is mostly position, not "wear" (session panel below).`);
      }
    });
  }
  else if(sessDrive){
    // V19: karty scenariuszowe pod SESJĄ — fazy = podgląd NASTĘPNEGO wykonania testu z bieżącego stanu
    // złogu (sessionPreview = ta sama nić co commit aktu). Napis z TEGO SAMEGO ξ co strzałka (bltDirWord,
    // konwencja V5). Ekspulsja per faza (pv.exitStep/phases[i].exited): faza wyjścia dostaje dopisek
    // liberacyjny, fazy PO wyjściu milkną — skłon potrafi opróżnić kanał (R10 na żywo).
    const pv = sessionPreview(S, state.testKey);
    const sInit = sessionInit(S);
    const stepMap = PHASE_OF[state.testKey] || phases.map((_,j)=>j);
    phases.forEach((ph,i)=>{
      if(!ph.nys) return;
      const stepIdx = stepMap[i], pvp = pv.phases[i]||{xi:0, exited:false};
      const N = nysFromDyn(effCanal, effSide, (pv.exited && pv.exitStep==null) ? 0 : pvp.xi, false);
      const mute=(lbl,note)=>{ Object.assign(ph.nys,{dir:0,vdir:1,strength:0,anat:{h:0,v:0,t:0},unresolved:true,init:null,fatigue:1}); ph.label=lbl; ph.note=note; };
      if(pv.exited && pv.exitStep==null){                     // kanał opróżniony PRZED aktem — niemy test kontrolny
        mute(t("kanał wyczyszczony — brak odpowiedzi","canal cleared — no response"),
             t("Złóg opuścił kanał w tej sesji — prowokacja niema. Tak wygląda kontrolny test zaraz po skutecznej repozycji. Uwaga kliniczna: ujemny test NATYCHMIAST po manewrze nie dowodzi wyleczenia (NPV ~72% — nakłada się męczliwość); wiarygodna kontrola śródsesyjna po ≥30 min siadu, formalna ocena wg AAO-HNS w ciągu miesiąca.","The debris left the canal in this session — the provocation is mute. This is what a control test right after successful repositioning looks like. Clinical caveat: a negative test IMMEDIATELY after the maneuver does not prove cure (NPV ~72% — fatigability overlaps); a reliable within-session check needs ≥30 min upright, formal reassessment per AAO-HNS within a month."));
      } else if(pv.exitStep!=null && stepIdx>pv.exitStep){    // faza PO ekspulsji we wcześniejszym kroku aktu
        mute(t("kanał opróżniony we wcześniejszej fazie","the canal was emptied in an earlier phase"),
             t("Wcześniejsza faza aktu wyprowadziła złóg do łagiewki — dalsze fazy nieme: diagnostyka wykonała pracę manewru (R10).","An earlier phase of the act carried the debris into the utricle — the remaining phases are mute: the diagnostic did the maneuver's job (R10)."));
      } else if(pvp.exited && N.strength < XI_CARD){          // ciche samowyleczenie (złóg przy ujściu)
        mute(t("złóg opuszcza kanał — bez wyraźnego oczopląsu","the debris leaves the canal — no distinct nystagmus"),
             t("Złóg leżał przy ujściu: faza dopycha go do łagiewki niemal bez wychylenia osklepka — CICHE SAMOWYLECZENIE. Kolejne fazy i testy będą nieme.","The debris lay near the exit: the phase pushes it into the utricle with barely any cupular deflection — SILENT SELF-CLEARING. Subsequent phases and tests will be mute."));
      } else if(N.strength < XI_CARD){
        mute(t("odpowiedź podprogowa (złóg blisko równowagi lub związany)","subthreshold response (debris near equilibrium or bound)"),
             t("Stan sesji: napęd nie zrywa wiązania albo złóg leży przy równowadze tej pozycji. Użyj historii pozycyjnej powyżej jako aktu otwierającego, by zobaczyć, kiedy reguła działa.","Session state: the drive does not break the bond or the debris lies near this position's equilibrium. Use the positional history above as an opening act to see when the rule works."));
      } else {
        Object.assign(ph.nys, {dir:N.dir, vdir:N.vdir, strength:N.strength, anat:N.anat, excited:N.excited,
          reversed:N.reversed, unresolved:false, fatigue:1, init:sInit});
        ph.label = bltDirWord(A, pvp.xi>0) + (pvp.exited ? t(" — i złóg opuszcza kanał"," — and the debris leaves the canal") : (N.strength<0.25 ? t(" (słaby)"," (weak)") : ""));
        ph.note = pvp.exited
          ? t("Złóg za wododziałem (bieżące φ sesji): ta faza wyprowadza złóg do łagiewki — test wykonuje pracę manewru; kolejne fazy i testy będą nieme (R10). „▶ Wykonaj test w sesji” zapisuje ten akt.","Debris beyond the watershed (the session's current φ): this phase carries the debris into the utricle — the test does the maneuver's job; subsequent phases and tests will be mute (R10). \"▶ Run the test in the session\" commits this act.")
          : t(`Fazy = podgląd wykonania testu z BIEŻĄCEGO stanu złogu sesji${S.acts.length?` (po ${S.acts.length} ${S.acts.length===1?"akcie":"aktach"})`:""} — amplituda i kierunek wynikają z położenia i wiązania, nie ze scenariusza.`,`Phases = a preview of running the test from the session's CURRENT debris state${S.acts.length?` (after ${S.acts.length} act${S.acts.length===1?"":"s"})`:""} — amplitude and direction follow from position and bond, not from a scenario.`);
      }
    });
  }
  // ===== D7/V21: EGZAMIN — fazy liczone z UKRYTEGO pacjenta (lista zmian), nie z założeń karty =====
  // Gałąź ZA sessDrive (sesja wykluczona w examStart) i PRZED nakładką AVS (też wykluczona) — kolejność
  // jawna. Override przepisuje PEŁNĄ tożsamość nys (canal/side/persistent/q/init zmiany DOMINUJĄCEJ):
  // obwiednia animacji (startNys/startDialNysIn → engineXi) i sufiks trwałości muszą grać z tej samej
  // fizyki co strzałka; pacjentowi wielozmianowemu obwiednię niesie jawnie _envI/_env01 (suma punktowa —
  // silnik pojedynczej zmiany jej nie zna). Etykieta OBSERWACYJNA z tego samego wektora co strzałka
  // (zero słów „chora/zdrowa" przed odsłoną — strażnik przecieku w wyroczni dom).
  const exam = state.exam;
  if(exam && !antMode){
    const repX = isDix ? (state.dixRep||0) : 0;
    phases.forEach(ph=>{
      if(!ph.nys) return;
      if(isDix){   // neutralizacja tekstów zdradzających stronę (jedyny test z „chorą" w ptitle/ppos)
        ph.ptitle = t(`Ucho ${A==="L"?"lewe":"prawe"} w dole`,`${A==="L"?"Left":"Right"} ear down`);
        ph.ppos = t(`Na plecach, głowa 45° ku stronie badanej (${SIDE[A]}), ~20° poniżej poziomu`,`Supine, head 45° toward the tested side, ~20° below horizontal`);
      }
      const q = ph.nys.q || stepHeadQ(ph.body, ph.yaw, ph.face);
      const N = examPhaseNys(exam.lesions, q, repX);
      if(N.strength < XI_CARD){
        Object.assign(ph.nys, {kind:"horizontal", dir:0, vdir:1, strength:0, anat:{h:0,v:0,t:0},
          persistent:false, unresolved:true, init:null, fatigue:1, _envI:null, _env01:null});
        ph.label = t("bez wyraźnego oczopląsu w tej pozycji","no distinct nystagmus in this position");
        ph.note = t("Odpowiedź na tę pozycję jest podprogowa (fizyka silnika). Pozycja niema NIE wyklucza BPPV — badaj dalej (inne testy, obie strony).","The response to this position is subthreshold (engine physics). A mute position does NOT rule out BPPV — keep examining (other tests, both sides).");
      } else {
        Object.assign(ph.nys, {kind:N.kind, dir:N.dir, vdir:N.vdir, strength:N.strength, anat:N.anat,
          canal:N.dom.canal, side:N.dom.side, persistent:N.dom.persistent, q,
          init:(!N.dom.persistent && repX>0)?{rep:repX}:null, unresolved:false, fatigue:1,
          _envI:N.multi?N.envI:null, _env01:N.multi?N.env01:null});
        ph.label = N.label;
        ph.note = t("Obserwuj kierunek, latencję, czas trwania i męczliwość (powtórzenia). Fazy liczone jako prowokacje IZOLOWANE z siadu — sekwencyjność i samooczyszczanie modeluje sesja ciągła.","Observe the direction, latency, duration and fatigability (repetitions). Phases are computed as ISOLATED provocations from sitting — sequencing and self-clearing are modeled by the continuous session.");
      }
    });
  }
  // V24: kark OBWIEDNI animacji — ta sama poza co karta (M3: karta Dix nie może animować latencji
  // 2.25 s, gdy doc i piny spv mówią 2.40). Egzamin ŚWIADOMIE bez karku (spójnie z examPhaseNys —
  // granica nazwana w doc, kandydat V25); bowlean pominięty (nić karty jest pivot:"neck", a engineXi
  // gra pivot:"body" — kark wstrzykiwałby bezwładność tułowia w ruch czysto szyjny; kandydat V25
  // razem z pivotem). Czysto runtime (obwiednie nie są pod żadną wyrocznią).
  if(!exam && state.testKey!=="bowlean") phases.forEach(ph=>{ if(ph.nys) ph.nys.neck = poseNeck(ph.body, ph.yaw, ph.face); });
  // N7 (D6): NAKLADKA AVS — toniczny oczoplas NeuroVOR (skladowa POZIOMA) obecny w KAZDEJ pozycji testu
  // i NIEwyczerpujacy sie: fundament taksonomii GRACE-3 (AVS vs t-EVS) wreszcie demonstrowalny obok
  // przejsciowego, meczliwego oczoplasu BPPV. Default OFF -> zadna wyrocznia dom nie rusza sie bez wlaczenia.
  const ovVec = state.neuroOverlay ? (()=>{ const o=NeuroVOR.observe(NeuroVOR.makePatient(state.neuroOverlay), false);
    return o.spv>=NeuroVOR.VIS_THRESH ? { dir:o.dir||0, amp:6*Math.min(1,o.strength||0), spv:o.spv, ear:o.beatEar } : null; })() : null;
  if(ovVec) phases.forEach(ph=>{ if(ph.nys) ph.nys.ov = ovVec; });
  state._diagPhaseNys = phases.map(p=>p.nys);   // do restartu animacji przy odwracaniu kart pozycji
  // (martwe lokalne vl/mechNote usunięte w D4-K1 pod bramką 0-diff: szablon liczy własne note/face,
  //  etykiety wariantu niesie flip-karta; variantLabels zostaje w eksporcie — zgodność wsteczna futureUI)
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
        <div class="nyslabel"><span class="arrow">${arrowGlyph(ph.nys)}</span><span>${ph.label}${ph.nys.unresolved?"":(ph.nys.persistent?t(" · uporczywy"," · persistent"):t(" · przemijający"," · transient"))}</span></div>
        ${gravArrowFor(phs)}</div>
      <div class="note">${ph.note}</div>`;};
  const phaseHTML = phases.length===2
    ? `<div class="flipwrap" style="margin-top:6px;${TON}"><div class="flip${state.diagPhaseFace?' flipped':''}" id="phaseflip" role="button" tabindex="0" aria-label="${t("Odwróć","Flip")}: ${phases[0].ptitle} ${t("albo","or")} ${phases[1].ptitle}" onclick="flipPhases()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipPhases();}">
        <div class="face front phaseface">${phaseInner(phases[0],0)}<div class="fliphint">${FLIP_ICO} ${phases[1].ptitle}</div></div>
        <div class="face back phaseface">${phaseInner(phases[1],1)}<div class="fliphint">${FLIP_ICO} ${phases[0].ptitle}</div></div>
      </div></div>`
    : phases.map((ph,i)=>`<div class="phase" style="${TON}">${phaseInner(ph,i)}</div>`).join("");
  // Panel MĘCZLIWOŚCI (tylko Dix-Hallpike, tryb kanału tylnego): powtarzaj prowokację → kanalolitiaza słabnie,
  // kupulolitiaza nie (różnicowanie wprost). Amplituda z Vestibular.fatigueFactor(rep).
  const fatPanel = (isDix && !antMode) ? (()=>{
    // D7/V21: w egzaminie trwałość panelu czyta się z PACJENTA (zmiana dominująca fazy prowokacji),
    // nie ze stanu karty (state.variant jest znormalizowany do "canalo" i nie niesie prawdy pacjenta).
    // Przy SESJI męczliwość niesie FIZYKA (przesunięcie złogu), nie mnożnik — stąd 100% na pasku.
    const rep=state.dixRep||0, cupulo=(exam ? !!(phases[0]&&phases[0].nys&&phases[0].nys.persistent) : (v==="cupulo")), pct=Math.round(((cupulo||state.session)?1:Vestibular.fatigueFactor(rep))*100);
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
  // ===== Panel SESJI CIĄGŁEJ (ocena II, V10/D1): chipy stanu złogu + akty (renderowany WYŁĄCZNIE gdy
  // state.session — default OFF nie dodaje ani bajta do #app, golden nietknięte) =====
  const sessionPanel = S ? (()=>{
    const chipS=(k,val)=>`<span style="display:inline-flex;gap:6px;align-items:baseline;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><span style="color:var(--muted)">${k}:</span><b>${val}</b></span>`;
    const chips = S.exited
      ? `<span style="display:inline-flex;gap:6px;align-items:baseline;background:#3a8f6f22;border:1px solid #3a8f6f;border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><b>✓ ${t("złóg w łagiewce — kanał czysty","debris in the utricle — canal clear")}</b></span>`
      : chipS("φ", S.phi==null ? t("spoczynek naturalny","natural rest") : `≈ ${Math.round(S.phi)}°`)
        + chipS(t("wiązanie","bond"), `${Math.round(S.bondFrac*100)}%`)
        + chipS(t("stan","state"), S.inCrus ? t("w odnodze (parking)","in the crus (parked)") : t("w świetle kanału","in the canal lumen"))
        + (S.rep ? chipS(t("prowokacje","provocations"), S.rep) : "");
    const actChip = chipS(t("akty","acts"), `${S.acts.length} · ${Math.round(S.tSession)} s`);
    const mismatch = !(S.canal===effCanal && S.side===effSide);
    const bst="min-height:auto;padding:9px 12px;font-size:13px;flex:0 0 auto;text-align:center";
    const btnProvoke = (!isDix && !mismatch && mech==="canalo" && !S.exited)   // V19: karty scenariuszowe też prowokują (akt bowlean/lyingdown istnieje)
      ? `<button class="opt" style="${bst}" onclick="sessionProvoke()">${t("▶ Wykonaj test w sesji","▶ Run the test in the session")}</button>` : "";
    const btnRest = `<button class="opt" style="${bst};opacity:.9" onclick="sessionRest()">${t("⏸ Przerwa 10 min (siad)","⏸ 10-min break (sitting)")}</button>`;
    const btnReset = `<button class="opt" style="${bst};opacity:.85" onclick="resetSession()">${t("Reset (nowy złóg)","Reset (new debris)")}</button>`;
    const noteTxt = (mech==="light" || mech==="short")
      ? t("Sesja śledzi złóg RAMIENIA DŁUGIEGO — wybrany mechanizm ma własną kartę poza łańcuchem sesji.","The session tracks LONG-ARM debris — the selected mechanism has its own card outside the session chain.")
      : v==="cupulo"
      ? t("Kupulolitiaza: brak wolnej cząstki w świetle — wynik NIE zależy od historii (test powtarzalny); stan sesji dotyczy postaci kanalolitycznej.","Cupulolithiasis: no free particle in the lumen — the result does NOT depend on history (the test is repeatable); the session state applies to the canalithiasis form.")
      : mismatch
        ? t("Podgląd sesji nieaktywny: kanał/strona tej karty ≠ tożsamość złogu sesji.","Session preview inactive: this card's canal/side ≠ the session debris identity.")
        : SCEN_DRIVEN.has(state.testKey)
          ? t("Ta karta czyta stan złogu Z SESJI (fazy = podgląd aktu z bieżącego φ). Scenariusz historii działa jako AKT OTWIERAJĄCY — klik restartuje sesję z tą historią jako startem.","This card reads the debris state FROM THE SESSION (phases = an act preview from the current φ). A history scenario acts as the OPENING act — clicking restarts the session with that history as the start.")
          : (isDix
              ? t(`„↻ Powtórz prowokację" wykonuje AKT sesji: łańcuch fizyki (pozycja+wiązanie+ogon ξ) × dyspersja (rep). Akt = prowokacja + powrót do siadu + ${SESSION_REST} s spoczynku — transport złogu liczy silnik.`,`"↻ Repeat provocation" performs a session ACT: physics chain (position+bond+ξ tail) × dispersion (rep). An act = provocation + return to sitting + ${SESSION_REST} s of rest — the engine computes the debris transport.`)
              : t(`Akt = prowokacja + powrót do siadu + ${SESSION_REST} s spoczynku (jedna nić symulacji).`,`An act = provocation + return to sitting + ${SESSION_REST} s of rest (a single simulation thread).`));
    return `<div class="card" style="margin-bottom:4px">
      <div class="obslabel" style="margin-bottom:4px">${t("Sesja ciągła — stan złogu (jeden pacjent)","Continuous session — debris state (one patient)")}</div>
      <div style="margin-bottom:8px">${chips}${actChip}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">${btnProvoke}${btnRest}${btnReset}</div>
      <div class="note">${noteTxt} ${t("Zmiana kanału, strony lub rozmiaru zaczyna nowy złóg.","Changing the canal, side or size starts new debris.")}</div></div>`;
  })() : "";
  // ===== Bow & Lean: scenariusze historii pozycyjnej + reguła kliniczna + mapa wododziału (ocena II, V5) =====
  const isBlt = state.testKey==="bowlean";
  const isLdt = state.testKey==="lyingdown";               // V11/D2 — panel/badge niżej, selektor WSPÓLNY (scenPanelHTML)
  const bltPanel = isBlt ? (()=>{
    if(mech==="light") return `<div class="card" style="margin-bottom:4px"><div class="note" style="margin:0">${t("Light cupula: mechanizm osklepkowy bez wolnej cząstki — wynik NIE zależy od historii pozycyjnej (scenariusze dotyczą postaci kanalolitycznych). Test powtarzalny; od kupulolitiazy różni go ODWRÓCONY kierunek (skłon→chora).","Light cupula: a cupular mechanism with no free particle — the result does NOT depend on positional history (the scenarios apply to the canalithiasis forms). The test is repeatable; the REVERSED direction (bow→affected) distinguishes it from cupulolithiasis.")}</div></div>`;
    if(mech==="short") return `<div class="card" style="margin-bottom:4px"><div class="note" style="margin:0">${t("Ramię bańkowe nie ma spoczynku — siad czyści je w ≤2 min, więc historia pozycyjna NIE ustala położenia startowego (scenariusze dotyczą ramienia długiego). Karta pokazuje ŚWIEŻY depozyt w środku ramienia (φ₀ ≈ −22°, wyprowadzone z geometrii segmentu).","The ampullar arm has no rest — sitting clears it within ≤2 min, so positional history does NOT set the starting position (the scenarios apply to the long arm). The card shows a FRESH deposit at the arm's midpoint (φ₀ ≈ −22°, derived from the segment geometry).")}</div></div>`;
    if(v==="cupulo") return `<div class="card" style="margin-bottom:4px"><div class="note" style="margin:0">${t("Kupulolitiaza: ciężki osklepek reaguje na sam kierunek grawitacji — wynik NIE zależy od historii pozycyjnej (scenariusze dotyczą postaci kanalolitycznej). Test powtarzalny — to jego cecha różnicująca.","Cupulolithiasis: the heavy cupula responds to the direction of gravity itself — the result does NOT depend on positional history (the scenarios apply to the canalithiasis form). The test is repeatable — its differentiating feature.")}</div></div>`;
    const scen=state.bltScenario||"textbook";
    if(sessDrive){                                           // V19: karta sterowana SESJĄ — baner źródła + selektor w trybie ZASIEWU
      const phiTxt = S.exited ? t("kanał czysty","canal clear") : S.phi==null ? t("spoczynek ≈200°","rest ≈200°") : `φ ≈ ${Math.round(S.phi)}°`;
      const banner = t(`Karta sterowana SESJĄ — fazy liczone z BIEŻĄCEGO stanu złogu (${phiTxt}) z łańcucha aktów, nie ze scenariusza. Fazy niżej to podgląd NASTĘPNEGO wykonania; „▶ Wykonaj test w sesji” (panel sesji) zapisuje akt. Klik historii powyżej RESTARTUJE sesję z tą historią jako aktem otwierającym.`,`Card driven by the SESSION — phases are computed from the debris' CURRENT state (${phiTxt}) of the act chain, not from a scenario. The phases below preview the NEXT run; "▶ Run the test in the session" (session panel) commits the act. Clicking a history above RESTARTS the session with that history as the opening act.`);
      return scenPanelHTML(A, scen, banner, true);
    }
    const ini=bltInit(A,scen);
    const banner = ini.exitedInHistory
      ? t("Historia pozycyjna OPRÓŻNIŁA kanał (złóg wpadł do łagiewki, zanim test się zaczął) — obie fazy będą nieme.","The positional history EMPTIED the canal (the debris fell into the utricle before the test began) — both phases will be mute.")
      : ini.phi0!=null
        ? t(`Scenariusz ustala położenie złogu: φ₀ ≈ ${Math.round(ini.phi0)}° — POLICZONE symulacją historii przez silnik, nie wpisane. Strzałki i napisy poniżej to WYNIK symulacji dla tego położenia (złóg świeżo przemieszczony — bez bramki adhezji), nie reguła.`,`The scenario pins the debris position: φ₀ ≈ ${Math.round(ini.phi0)}° — COMPUTED by simulating the history through the engine, not typed in. The arrows and labels below are the SIMULATION RESULT for this position (freshly displaced debris — no adhesion gate), not a rule.`)
        : t("Start nieoznaczony = spoczynek modelu φ₀ ≈ 200°, czyli 9,9° ZA wododziałem skłonu (190°), z pełną adhezją — model uczciwie NIE rozstrzyga kierunku. Tak wygląda pacjent bez znanej historii pozycyjnej.","Start indeterminate = the model's rest φ₀ ≈ 200°, i.e. 9.9° BEYOND the bow watershed (190°), with full adhesion — the model honestly does NOT resolve the direction. This is the patient with no known positional history.");
    return scenPanelHTML(A, scen, banner);
  })() : "";
  const bltExtras = isBlt ? (()=>{
    const ruleTxt=t("Reguła kliniczna (Choung 2006): skłon → ucho chore, odchylenie → zdrowe; w postaci apogeotropowej odwrotnie.","Clinical rule (Choung 2006): bow → affected ear, lean → healthy; reversed in the apogeotropic form.");
    let badge, badgeCol="#3a8f6f";
    // V19: pod SESJĄ badge liczy się z TEGO SAMEGO podglądu co strzałki (pv) — gałęzie scenariuszowe
    // źle klasyfikują stany mid-chain (sonda: po akcie z textbook bow +0,51/lean +0,096 wpadałby
    // w „model PRZECIWNY regule" — fałsz; to złóg blisko równowagi po poprzednim akcie).
    if(sessDrive){
      const pv=sessionPreview(S, state.testKey);
      const bx=(pv.phases[0]||{}).xi||0, lx=(pv.phases[1]||{}).xi||0;
      const iB=nysFromDyn("horizontal",A,bx,false).strength, iL=nysFromDyn("horizontal",A,lx,false).strength;
      if(pv.exited && pv.exitStep==null){ badge=t("kanał opróżniony w tej sesji — karta pokazuje niemy test kontrolny","the canal was emptied in this session — the card shows a mute control test"); badgeCol="#8a93a6"; }
      else if(pv.exitStep!=null && bx<0 && iB>=XI_CARD){ badge=t("skłon MYLI (bije ku zdrowej — złóg za wododziałem) i OPRÓŻNIA kanał: test zadziała jak manewr","the bow MISLEADS (beats toward healthy — debris beyond the watershed) and EMPTIES the canal: the test will act as a maneuver"); badgeCol="#b0813f"; }
      else if(pv.exitStep!=null){ badge=t("ciche samowyleczenie — złóg przy ujściu (wyjście niemal bez oczopląsu)","silent self-clearing — debris near the exit (leaves with barely any nystagmus)"); badgeCol="#8a93a6"; }
      else if(bx>0 && iB>=XI_CARD && lx<0 && iL>=XI_CARD){ badge=t("pełna reguła Choung — z BIEŻĄCEGO stanu sesji","the full Choung rule — from the session's CURRENT state"); }
      else if(bx>0 && iB>=XI_CARD && iL<XI_CARD){ badge=t("skłon zgodny z regułą, odchylenie podprogowe — złóg blisko równowagi po poprzednich aktach (męczliwość = pozycja, R10)","bow consistent with the rule, lean subthreshold — debris near equilibrium after the previous acts (fatigability = position, R10)"); }
      else if(iB<XI_CARD && iL<XI_CARD){ badge=t("test niemy z tego stanu — wiązanie/równowaga; użyj historii jako aktu otwierającego","the test is mute from this state — bond/equilibrium; use a history as the opening act"); badgeCol="#8a93a6"; }
      else { badge=t("wzorzec odwrócony względem reguły — złóg za wododziałem (bieżące φ sesji)","pattern reversed vs the rule — debris beyond the watershed (the session's current φ)"); badgeCol="#b0813f"; }
    }
    else if(mech==="light"){ badge=t("model ZGODNY z regułą geotropową Choung — ale przez mechanizm OSKLEPKOWY (odwrócony wypór), nie wolny złóg; odpowiedź trwała i powtarzalna","model AGREES with the geotropic Choung rule — but via a CUPULAR mechanism (inverted buoyancy), not free debris; the response is persistent and repeatable"); }
    else if(mech==="short"){ badge=t("wzorzec apo PRZEMIJAJĄCY — wolny złóg w ramieniu bańkowym; odchylenie OPRÓŻNIA ramię (samooczyszczenie — test bywa terapeutyczny)","a TRANSIENT apo pattern — free debris in the ampullar arm; the lean EMPTIES the arm (self-clearing — the test can be therapeutic)"); badgeCol="#b0813f"; }
    else if(v==="cupulo"){ badge=t("model ZGODNY z regułą apogeotropową — kierunek liczy fizyka (cel przy osklepku)","model AGREES with the apogeotropic rule — the direction is computed by physics (target at the cupula)"); }
    else if(bltMeta && bltMeta.exitedInBow && (bltMeta.bowXi||0)<-0.23){ badge=t("skłon MYLI (bije ku zdrowej — złóg za wododziałem) i usuwa złóg z kanału: test zadziałał jak manewr","the bow MISLEADS (beats toward healthy — debris beyond the watershed) and removes the debris: the test acted as a maneuver"); badgeCol="#b0813f"; }
    else if(bltMeta && (bltMeta.exitedInHistory || bltMeta.exitedInBow)){ badge=t("kanał opróżniony — reguły nie ma na czym testować (test zadziałał jak manewr)","canal emptied — nothing left to test the rule on (the test acted as a maneuver)"); badgeCol="#8a93a6"; }
    else if(bltMeta && bltMeta.bowXi>0 && bltMeta.leanXi<0 && Math.abs(bltMeta.bowXi)>0.1){ badge=t("model ZGODNY z regułą w tym scenariuszu — reguła Choung WYNIKA tu z fizyki","model AGREES with the rule in this scenario — the Choung rule FOLLOWS from physics here"); }
    else if(bltMeta && Math.max(Math.abs(bltMeta.bowXi||0),Math.abs(bltMeta.leanXi||0))<0.12){ badge=t("model NIE ROZSTRZYGA — złóg na wododziale (tak wygląda 11,5–45% chorych bez odpowiedzi BLT)","the model DOES NOT RESOLVE it — debris on the watershed (this is what the 11.5–45% of BLT non-responders look like)"); badgeCol="#8a93a6"; }
    else { badge=t("model PRZECIWNY regule w tym scenariuszu — złóg za wododziałem","model OPPOSES the rule in this scenario — debris beyond the watershed"); badgeCol="#b0813f"; }
    const ruleCard=`<div class="card" style="margin-bottom:4px"><div class="obslabel" style="margin-bottom:4px">${ruleTxt}</div>
      <div style="display:inline-block;padding:4px 10px;border-radius:12px;background:${badgeCol}22;border:1px solid ${badgeCol};font-size:12.5px;color:#D4DEE8">${badge}</div></div>`;
    const mapCard = mech==="canalo" ? `<div class="card" style="margin-bottom:4px">
      <div class="obslabel" style="margin-bottom:6px">${t("Mapa wododziału — od czego zależy wynik BLT","Watershed map — what the BLT outcome depends on")}</div>
      ${bltWatershedSVG(A, sessDrive ? (S.exited?null:(S.phi??Vestibular.restPhi("horizontal",A))) : (bltMeta?bltMeta.phi0:null))}${sessDrive?`<div class="note" style="margin-top:4px">${t("Znacznik pokazuje BIEŻĄCE φ złogu sesji (po aktach), nie φ₀ scenariusza; po opróżnieniu kanału znika.","The marker shows the session debris' CURRENT φ (after the acts), not a scenario's φ₀; it disappears once the canal is emptied.")}</div>`:""}
      <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--muted);margin-top:6px">
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3a8f6f"></span> ${t("pełna reguła Choung","full Choung rule")}</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#b0813f"></span> ${t("wzorzec odwrócony","reversed pattern")}</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#8a93a6"></span> ${t("mieszany","mixed")}</span>
        <span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#3a8f6f;opacity:.33"></span> ${t("odpowiedź podprogowa","subthreshold response")}</span>
      </div>
      <div class="note">${t("Kierunek, obecność i siła odpowiedzi zależą od tego, GDZIE złóg leży przed testem — a to ustala ostatnia godzina życia pacjenta, nie anatomia. Pełną regułę Choung daje ~68% możliwych położeń (z progiem widoczności ~60%) — ten sam rząd co kliniczne odsetki poprawnych odpowiedzi; klinicznie BLT jest niemy lub mylący u 11,5–45% chorych (Choung 11,5% · Lee 20% · Kim 45%). Domyślny spoczynek modelu (199,8°) leży 9,9° za wododziałem skłonu. Mapa policzona z silnika dla geometrii tego modelu (jeden atlas, ramka Reida).","The direction, presence and strength of the response depend on WHERE the debris lies before the test — set by the patient's last hour, not by anatomy. The full Choung rule holds for ~68% of possible positions (~60% with the visibility threshold) — the same order as the clinical rates of correct responses; clinically the BLT is mute or misleading in 11.5–45% of patients (Choung 11.5% · Lee 20% · Kim 45%). The model's default rest (199.8°) lies 9.9° beyond the bow watershed. Map computed from the engine for this model's geometry (a single atlas, Reid's frame).")}</div>
    </div>` : "";
    return ruleCard + mapCard;
  })() : "";
  // ===== Lying-down (ocena II, V11/D2): selektor scenariuszy WSPÓLNY z B&L + badge zgodności =====
  const ldtPanel = isLdt ? (()=>{
    if(mech==="light") return `<div class="card" style="margin-bottom:4px"><div class="note" style="margin:0">${t("Light cupula: mechanizm osklepkowy bez wolnej cząstki — wynik NIE zależy od historii pozycyjnej. Trwały oczopląs położenia ku ZDROWEJ + pseudo-SN w siadzie ku zdrowej (lustro postaci apogeotropowej).","Light cupula: a cupular mechanism with no free particle — the result does NOT depend on positional history. A persistent lying-down nystagmus toward the HEALTHY side + a pseudo-SN in sitting toward healthy (the mirror of the apogeotropic form).")}</div></div>`;
    if(mech==="short") return `<div class="card" style="margin-bottom:4px"><div class="note" style="margin:0">${t("Ramię bańkowe nie ma spoczynku — historia pozycyjna NIE ustala położenia startowego (scenariusze dotyczą ramienia długiego). Karta pokazuje ŚWIEŻY depozyt w środku ramienia (φ₀ ≈ −22°).","The ampullar arm has no rest — positional history does NOT set the starting position (the scenarios apply to the long arm). The card shows a FRESH deposit at the arm's midpoint (φ₀ ≈ −22°).")}</div></div>`;
    if(v==="cupulo") return `<div class="card" style="margin-bottom:4px"><div class="note" style="margin:0">${t("Kupulolitiaza: ciężki osklepek reaguje na sam kierunek grawitacji — wynik NIE zależy od historii pozycyjnej (scenariusze dotyczą postaci kanalolitycznej). Uporczywy oczopląs położenia + pseudo-SN w siadzie.","Cupulolithiasis: the heavy cupula responds to the direction of gravity itself — the result does NOT depend on positional history (the scenarios apply to the canalithiasis form). Persistent lying-down nystagmus + pseudo-SN in sitting.")}</div></div>`;
    const scen=state.bltScenario||"textbook";
    if(sessDrive){                                           // V19: jak w bltPanel — źródłem karty jest SESJA
      const phiTxt = S.exited ? t("kanał czysty","canal clear") : S.phi==null ? t("spoczynek ≈200°","rest ≈200°") : `φ ≈ ${Math.round(S.phi)}°`;
      const banner = t(`Karta sterowana SESJĄ — fazy liczone z BIEŻĄCEGO stanu złogu (${phiTxt}) z łańcucha aktów, nie ze scenariusza. Fazy niżej to podgląd NASTĘPNEGO wykonania; „▶ Wykonaj test w sesji” (panel sesji) zapisuje akt. Klik historii powyżej RESTARTUJE sesję z tą historią jako aktem otwierającym.`,`Card driven by the SESSION — phases are computed from the debris' CURRENT state (${phiTxt}) of the act chain, not from a scenario. The phases below preview the NEXT run; "▶ Run the test in the session" (session panel) commits the act. Clicking a history above RESTARTS the session with that history as the opening act.`);
      return scenPanelHTML(A, scen, banner, true);
    }
    const ini=bltInit(A,scen);
    const banner = ini.exitedInHistory
      ? t("Historia pozycyjna OPRÓŻNIŁA kanał (złóg wpadł do łagiewki, zanim test się zaczął) — obie fazy będą nieme.","The positional history EMPTIED the canal (the debris fell into the utricle before the test began) — both phases will be mute.")
      : ini.phi0!=null
        ? t(`Scenariusz ustala położenie złogu: φ₀ ≈ ${Math.round(ini.phi0)}° — policzone symulacją historii przez silnik. Równowaga leżenia ≈190°: od tego, PO KTÓREJ jej stronie leży złóg, zależy kierunek oczopląsu położenia (ta sama fizyka wododziału co w Bow & Lean).`,`The scenario pins the debris position: φ₀ ≈ ${Math.round(ini.phi0)}° — computed by simulating the history through the engine. The lying equilibrium is ≈190°: WHICH side of it the debris lies on sets the lying-down nystagmus direction (the same watershed physics as in Bow & Lean).`)
        : t("Start nieoznaczony = spoczynek modelu φ₀ ≈ 200° z pełną adhezją: napęd położenia (0.026) nie zrywa wiązania (próg 0.04) — test niemy. Tak wygląda pacjent bez LDN (klinicznie 32–62% chorych).","Start indeterminate = the model's rest φ₀ ≈ 200° with full adhesion: the lying-down drive (0.026) does not break the bond (threshold 0.04) — the test is mute. This is the patient without LDN (clinically 32–62% of patients).");
    return scenPanelHTML(A, scen, banner);
  })() : "";
  const ldtExtras = isLdt ? (()=>{
    const ruleTxt=t("Reguła kliniczna: położenie → geo ku uchu ZDROWEMU / apo ku CHOREMU; siadanie odwraca kierunek (wyprowadzenie mechaniczne). LDN i PSN to znaki POMOCNICZE lateralizacji — nie kryterium Bárány.","Clinical rule: lying down → geo toward the HEALTHY ear / apo toward the AFFECTED one; sitting up reverses the direction (mechanical derivation). LDN and PSN are SECONDARY lateralization signs — not Bárány criteria.");
    let badge, badgeCol="#3a8f6f";
    // V19: pod SESJĄ badge z podglądu pv (jak w B&L); kategorii ekspulsji NIE ma — LDT nigdy nie usuwa złogu (D2).
    if(sessDrive){
      const pv=sessionPreview(S, state.testKey);
      const lieX=(pv.phases[0]||{}).xi||0;
      const iLie=nysFromDyn("horizontal",A,lieX,false).strength;
      if(pv.exited && pv.exitStep==null){ badge=t("kanał opróżniony w tej sesji — karta pokazuje niemy test kontrolny","the canal was emptied in this session — the card shows a mute control test"); badgeCol="#8a93a6"; }
      else if(iLie<XI_CARD){ badge=t("brak LDN z tego stanu — wiązanie/równowaga (klinicznie 32–62% chorych); użyj historii jako aktu otwierającego","no LDN from this state — bond/equilibrium (clinically 32–62% of patients); use a history as the opening act"); badgeCol="#8a93a6"; }
      else if(lieX<0){ badge=t("położenie ku ZDROWEJ (geotropowo — emergentnie) z BIEŻĄCEGO stanu sesji; siadanie w modelu podprogowe","lying down toward the HEALTHY side (geotropic — emergently) from the session's CURRENT state; sitting up subthreshold in the model"); }
      else { badge=t("położenie ku CHOREJ — wzorzec GT− (złóg za równowagą leżenia; bieżące φ sesji): odczyt położenia, nie błąd reguły","lying down toward the AFFECTED side — the GT− pattern (debris beyond the lying equilibrium; the session's current φ): a position readout, not a failure of the rule"); badgeCol="#b0813f"; }
    }
    else if(mech==="light"){ badge=t("model: położenie ku ZDROWEJ (geotropowo, trwale) + pseudo-SN ku zdrowej — lustro postaci apogeotropowej","model: lying down toward the HEALTHY side (geotropic, persistent) + pseudo-SN toward healthy — the mirror of the apogeotropic form"); }
    else if(mech==="short"){ badge=t("położenie ku CHOREJ (wzorzec apo), PRZEMIJAJĄCE — siadanie domyka samooczyszczenie ramienia","lying down toward the AFFECTED side (the apo pattern), TRANSIENT — sitting up completes the arm's self-clearing"); badgeCol="#b0813f"; }
    else if(v==="cupulo"){ badge=t("model ZGODNY z regułą apogeotropową — położenie ku chorej (cel przy osklepku), pseudo-SN w siadzie ku chorej","model AGREES with the apogeotropic rule — lying down toward the affected side (target at the cupula), pseudo-SN in sitting toward the affected side"); }
    else if(ldtMeta && ldtMeta.exitedInHistory){ badge=t("kanał opróżniony — reguły nie ma na czym testować","canal emptied — nothing left to test the rule on"); badgeCol="#8a93a6"; }
    else if(ldtMeta && nysFromDyn("horizontal", A, ldtMeta.lieXi, false).strength < XI_CARD){ badge=t("model NIE ROZSTRZYGA — brak LDN (klinicznie 32–62% chorych; GT0 = 56,7% geo w serii Califano 2026)","the model DOES NOT RESOLVE it — no LDN (clinically 32–62% of patients; GT0 = 56.7% of geo in the Califano 2026 series)"); badgeCol="#8a93a6"; }
    else if(ldtMeta && ldtMeta.lieXi<0){ badge=t("model ZGODNY z wzorcem geotropowym w tym scenariuszu (położenie ku zdrowej — emergentnie); siadanie w modelu podprogowe","model AGREES with the geotropic pattern in this scenario (lying down toward the healthy side — emergently); sitting up is subthreshold in the model"); }
    else { badge=t("położenie ku CHOREJ — wzorzec GT− (~7% serii Califano 2026): złóg za równowagą leżenia; odczyt położenia wyjściowego, nie błąd reguły","lying down toward the AFFECTED side — the GT− pattern (~7% of the Califano 2026 series): debris beyond the lying equilibrium; a readout of the starting position, not a failure of the rule"); badgeCol="#b0813f"; }
    return `<div class="card" style="margin-bottom:4px"><div class="obslabel" style="margin-bottom:4px">${ruleTxt}</div>
      <div style="display:inline-block;padding:4px 10px;border-radius:12px;background:${badgeCol}22;border:1px solid ${badgeCol};font-size:12.5px;color:#D4DEE8">${badge}</div></div>`;
  })() : "";
  // D4/V16: chipy mechanizmu POD flip-kartą — tylko HC (pionowe: mechanizm ≡ wariant → mechPanel="" i karta
  // bajt-w-bajt); interpolacja INLINE za `})()}` flipa (wzorzec V10 — osobna linia szablonu psułaby klucze pionowe).
  const mechPanel = (()=>{ const mechs=MECHS_BY_PHENO(effCanal, v); if(mechs.length<2) return "";
    const ML=mechLabels(effCanal, v);
    const btns=mechs.map(mk=>`<button class="opt" aria-pressed="${mech===mk}" onclick="setMechanism(${mk===v?"null":`'${mk}'`})"><b>${ML[mk].lab}</b><small>${ML[mk].sub}</small></button>`).join("");
    return `<div class="obsrow" style="margin-top:10px"><div class="obslabel">${t("Mechanizm w obrębie tego fenotypu:","Mechanism within this phenotype:")}</div>
        <div class="seg segobs">${btns}</div>
        <div class="note" style="margin-top:8px">${t("Fenotyp (kierunek DCPN) ≠ mechanizm: geotropowy daje ramię długie LUB light cupulę; apogeotropowy — kupulolitiazę LUB ramię bańkowe. Mechanizm czyta się z CZASU trwania i męczliwości, nie z kierunku.","Phenotype (DCPN direction) ≠ mechanism: geotropic comes from the long arm OR light cupula; apogeotropic — cupulolithiasis OR the ampullar arm. The mechanism is read from DURATION and fatigability, not from direction.")}</div></div>`;
  })();
  $("#app").innerHTML=`
    <div class="ghead"><button class="iconbtn" onclick="backToSetup()" aria-label="${t("Wróć","Back")}"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="ttl"><b>${D.name}</b><span>${D.tests}</span></div>
      <div class="sidewrap"><em>${t("strona","side")}</em><div class="sidepill"><button data-s="L" aria-pressed="${A==='L'}" onclick="setDiagSide('L')">L</button><button data-s="P" aria-pressed="${A==='P'}" onclick="setDiagSide('P')">${t("P","R")}</button></div></div></div>
    <div class="card clininstr" style="margin-bottom:4px;${TON}" data-flow-anchor="test" tabindex="-1" data-fatfactor="${fatFactor.toFixed(3)}"><div class="instr">${D.intro}</div></div>${/* data-fatfactor: EFEKTYWNY mnoznik meczliwosci wystawiony do DOM, zeby niezmiennik „meczliwosc liczona raz" byl MIERZALNY, a nie tylko opisany w komentarzu. Pierwsza wersja bramki MC2 czytala procent z karty meczliwosci — i przechodzila TAKZE po zepsuciu kodu, bo tamta karta ma wlasny warunek. Dowod failing-first to wykryl; bramka bez obserwowalnej wielkosci nie pilnuje niczego. */""}
    ${/* WEJŚCIE DO OPISU OBSERWACJI — takie samo dla WSZYSTKICH czterech prób (Blok 8).
          Zastępuje dwustanowy przełącznik, który istniał wyłącznie przy Dix-Hallpike i pytał
          wprost o WNIOSEK („kanał tylny" / „kanał przedni"), a nie o to, co widać. Przy roll,
          bow&lean i head-hangu nie było czym opisać obserwacji w ogóle. */""}
    <div class="obsrow" style="${TON}" tabindex="-1"><div class="obslabel">${t("Zaobserwowany oczopląs","Observed nystagmus")}</div>
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
    ${/* PANELE FIZYKI z gałęzi main (egzamin D7 · sesja D1 · historia B&L V5 · lying-down D2 ·
         null point D3 · extras). futureUI miał tu WŁASNE, węższe kopie karty sesji, historii
         i null pointu — zostają wersje z main, bo obejmują też LDT i tryb egzaminu, a dwie karty
         o tym samym stanie na jednym ekranie mówiłyby dwie rzeczy naraz. Sekwencja póz
         (pozySekwencja) to wkład futureUI i zostaje. */""}
    ${exam?examBanner():""}${sessionPanel}${exam?"":bltPanel}${exam?"":ldtPanel}${phaseHTML}${pozySekwencja(phases, A, !!state.reducedMotion)}${fatPanel}${state.testKey==="roll"&&!exam?nullPointCard(A):""}${exam?"":bltExtras}${exam?"":ldtExtras}
    ${exam?"":(()=>{
      const interp = (v0,m0) => antMode
        ? t(`Kanał PRZEDNI. Strony nie ustala pozycja — prowokacja bywa obustronna ([H33]); rozstrzyga TORSJA (górny biegun ku uchu choremu — [H32]), a nie widać jej u 57% chorych ([H31]). Potwierdź deep head-hangiem; lecz Yacovino.`,`The ANTERIOR canal. The position does not give the side — provocation is often bilateral ([H33]); the TORSION decides (upper pole toward the affected ear — [H32]), and it is invisible in 57% of patients ([H31]). Confirm with the deep head-hang; treat with Yacovino.`)
        : D.latNote(A, v0, m0);
      // D4/V16: twarz flipa = FENOTYP, treść twarzy = MECHANIZM efektywny (na twarzy bieżącego fenotypu
      // gra wybrany mech; twarz przeciwna pokazuje swój mechanizm klasyczny).
      const note = m0 => m0==="canalo"
        ? t("Swobodne złogi przemieszczają się w świetle kanału pod wpływem grawitacji.","Free-floating debris moves within the canal lumen under gravity.")
        : m0==="light"
        ? t("Osklepek LŻEJSZY od endolimfy (odwrócony kontrast gęstości) — odgina się przeciwnie niż ciężki; „light cupula” nazywa WZORZEC, mechanizm nieustalony (5 hipotez).","The cupula is LIGHTER than the endolymph (inverted density contrast) — it deflects opposite to the heavy one; \"light cupula\" names a PATTERN, the mechanism is unsettled (5 hypotheses).")
        : m0==="short"
        ? t("Wolny złóg w RAMIENIU BAŃKOWYM (krótkim), po łagiewkowej stronie osklepka — grawitacja napędza go przeciwnie niż złóg ramienia długiego, stąd fenotyp apogeotropowy przy dynamice kanalolitiazy.","Free debris in the SHORT (ampullar) arm, on the utricular side of the cupula — gravity drives it opposite to long-arm debris, hence an apogeotropic phenotype with canalithiasis dynamics.")
        : t("Złogi przylegają do osklepka (cupula), który się odgina — bańka staje się wrażliwa na grawitację.","Debris adheres to the cupula, which deflects — the cupula becomes gravity-sensitive.");
      const mechName = m0 => m0==="canalo"?t("kanalolitiaza","canalithiasis"):m0==="light"?"light cupula":m0==="short"?t("ramię bańkowe (short arm)","short (ampullar) arm"):t("kupulolitiaza","cupulolithiasis");
      const face = v0 => { const m0 = v0===v ? mech : v0; return `<h4>${t("Mechanizm","Mechanism")} — ${CANALS[effCanal].label} · ${mechName(m0)}</h4>
        <div data-diagcanal="${m0}">${diagCanalSVG(effCanal)}</div>
        <div class="features">${D.features(v0, effCanal, m0).map(f=>`<span>${f}</span>`).join("")}</div>
        <div class="note">${note(m0)}</div>
        <div class="note" style="color:var(--text)"><b>${t("Interpretacja:","Interpretation:")}</b> ${interp(v0,m0)}</div>`; };
      return `<div class="flipwrap" style="margin-top:12px"><div class="flip ${v==='cupulo'?'flipped':''}" id="mechflip" role="button" tabindex="0" aria-label="${t('Odwróć kartę mechanizmu: kanalolitiaza albo kupulolitiaza','Flip the mechanism card: canalithiasis or cupulolithiasis')}" onclick="flipDiagMech()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();flipDiagMech();}">
        <div class="face front panelbox">${face("canalo")}<div class="fliphint">${FLIP_ICO} ${t("kupulolitiaza","cupulolithiasis")}</div></div>
        <div class="face back panelbox">${face("cupulo")}<div class="fliphint">${FLIP_ICO} ${t("kanalolitiaza","canalithiasis")}</div></div>
      </div></div>`;
    })()}${exam?"":mechPanel}
    ${exam?"":(wsparcie.poziom==="brak" ? kartaBezOpisu(wsparcie, state.testKey) : diagClassifyCard(effCanal, v, effSide, antMode, mech, wsparcie))}
    ${ostrSkretny ? `<div class="redflag">${t('<b>⚠ Oczopląs czysto skrętny.</b> Kierunek bez składowej pionowej nie odpowiada żadnemu kanałowi w tym modelu — to jedna z cech przemawiających za przyczyną OŚRODKOWĄ. Nie wykonuj repozycji na tej podstawie.','<b>⚠ Purely torsional nystagmus.</b> A direction with no vertical component does not match any canal in this model — it is one of the features arguing for a CENTRAL cause. Do not perform repositioning on this basis.')}</div>` : ""}
    ${ostrDownbeat ? `<div class="redflag">${t('<b>⚠ Czerwona flaga — wyklucz przyczynę OŚRODKOWĄ.</b> Downbeat, który jest <b>uporczywy, bez latencji i nie wyczerpuje się</b> przy powtórzeniach, występuje także w pozycji neutralnej (na wznak, głowa prosto), albo towarzyszą mu objawy neurologiczne (dyzartria, ataksja, zaburzenia spojrzenia, dwojenie) — przemawia za przyczyną OŚRODKOWĄ (móżdżek, pogranicze czaszkowo‑szyjne: malformacja Arnolda‑Chiariego, SM, zmiany naczyniowe). Wymaga oceny neurologicznej i MRI, nie manewru. Repozycję rozważ dopiero po wykluczeniu przyczyny ośrodkowej.','<b>⚠ Red flag — rule out a CENTRAL cause.</b> A downbeat that is <b>persistent, without latency and non-fatiguing</b> on repetition, is also present in the neutral position (supine, head straight), or is accompanied by neurological signs (dysarthria, ataxia, gaze disturbances, diplopia) — argues for a CENTRAL cause (cerebellum, craniocervical junction: Arnold-Chiari malformation, MS, vascular lesions). Requires neurological evaluation and MRI, not a maneuver. Consider repositioning only after ruling out a central cause.')}</div>` : ""}
    ${(exam || wsparcie.poziom==="brak") ? "" : (()=>{ if(niet.nietypowy && !state.diagCentral) return kartaNietypowa(niet);
      if(state.diagCentral) return `<div class="reco"><h4>${t("Sugerowane leczenie","Suggested treatment")}</h4>
        <div class="note" style="color:var(--ant)">${t('<b>Repozycja niewskazana.</b> Przy podejrzeniu ośrodkowego oczoplasu pozycyjnego (CPN) nie wykonuj manewrów repozycyjnych — najpierw ocena neurologiczna i MRI tylnego dołu. Wróć do widoku „Obwodowy — BPPV", jeśli obraz jednak spełnia kryteria BPPV.','<b>Repositioning is not indicated.</b> When central positional nystagmus (CPN) is suspected, do not perform repositioning maneuvers — first a neurological evaluation and MRI of the posterior fossa. Return to the "Peripheral — BPPV" view if the picture does meet BPPV criteria.')}</div></div>`;
      const rec = antMode
        ? {primary:"yacovino", alts:[], note:t(`Downbeat w Dix-Hallpike → kanał PRZEDNI. Leczenie: Yacovino (deep head-hang). STRONA: z torsji, jeśli jest widoczna (górny biegun ku uchu choremu — [H32]); pozycja badania jej NIE ustala ([H33]).`,`A downbeat in the Dix-Hallpike → the ANTERIOR canal. Treatment: Yacovino (deep head-hang). SIDE: from the torsion if visible (upper pole toward the affected ear — [H32]); the test position does NOT establish it ([H33]).`)}
        : recommend(state.testKey,v,mech);   // D4/V16: mechanizm wchodzi do zalecenia (light/short mają inne)
      /* STRONA IDZIE Z KARTĄ, NIE ZE STANU — reguła zostaje, jej TREŚĆ się zmieniła (2026-08-16).
         Dawniej `effSide` przy downbeacie było uchem PRZECIWNYM, a `startManeuver` budował plan ze
         `state.side` — karta pisała „Leczenie dla strony lewa", a plan powstawał dla P. Dziś
         `effSide === A`, bo pozycja badania strony NIE ustala ([H33]); karta i plan mówią to samo,
         a o stronie rozstrzyga TORSJA opisana przez klinicystę, nie geometria pary kanałów. */
      // D4/V16: primary==null (light cupula — manewrów nie ma) → sama nota, bez przycisków i bez „Potwierdź stronę…"
      if(rec.primary==null) return `<div class="reco"><h4>${t("Sugerowane leczenie","Suggested treatment")}</h4>
        <div class="note" style="color:var(--text)">${rec.note}</div></div>`;
      const btns=[rec.primary,...rec.alts].map((k,idx)=>`<button class="${idx===0?'recoprimary':'recoalt'}" onclick="startManeuver('${k}','${effSide}')">${idx===0?t('Rozpocznij: ','Start: '):t('Alternatywa: ','Alternative: ')}${MANEUVERS[k].label}${rec.altNotes&&rec.altNotes[k]?` · ${rec.altNotes[k]}`:""} — ${MANEUVERS[k].desc}</button>`).join("");
      return `<div class="reco"><h4>${t("Sugerowane leczenie","Suggested treatment")}</h4>
        <div class="note" style="color:var(--text)">${rec.note}</div>${rec.home?`<div class="note">${rec.home}</div>`:""}
        <div class="note">${t(`Leczenie dla strony <b>${SIDE[effSide]}</b>.`,`Treatment for the <b>${effSide==="L"?"left":"right"}</b> side.`)} ${antMode?t("Strona kanału przedniego niepewna — potwierdź deep head-hangiem i dopiero po wykluczeniu przyczyny ośrodkowej.","The anterior-canal side is uncertain — confirm with the deep head-hang and only after ruling out a central cause."):t("Potwierdź stronę regułą lateralizacji powyżej, zanim rozpoczniesz manewr.","Confirm the side with the lateralization rule above before starting the maneuver.")}</div>
        <div class="recobtns">${btns}</div></div>`; })()}
    ${vizControls()}
    ${wsparcie.poziom==="czesciowe" ? `<div class="note obsniep">${t("Opis obserwacji jest niepełny — pokazany podtyp jest zgodnością z wzorcem modelu, a nie rozpoznaniem.","The observation is described only partly — the subtype shown is a match against the model's pattern, not a diagnosis.")}</div>` : ""}
    ${ovVec?`<div class="note" style="border:1px solid var(--line);border-radius:8px;padding:8px;margin-top:8px">〰 ${t(`NAKŁADKA AVS: oczopląs toniczny ${ovVec.spv.toFixed(1)}°/s ku stronie ${SIDE[ovVec.ear]||"?"} jest obecny już PRZED testem pozycyjnym, w KAŻDEJ pozycji i NIE wyczerpuje się — to obraz AVS (HINTS), nie t-EVS/BPPV (latencja + paroksyzm + wyczerpywanie). Wyłącz nakładkę na ekranie HINTS.`,`AVS OVERLAY: a tonic nystagmus of ${ovVec.spv.toFixed(1)}°/s toward the ${ovVec.ear==="P"?"right":"left"} side is present BEFORE the positional test, in EVERY position, and does NOT fatigue — an AVS picture (HINTS), not t-EVS/BPPV (latency + paroxysm + fatigability). Turn the overlay off on the HINTS screen.`)}</div>`:""}
    <p class="footnote">${t("Wzorce poglądowe. Interpretuj w kontekście klinicznym.","Illustrative patterns. Interpret in the clinical context.")}</p>`;
  if(can3d && state.view3d) phases.forEach((ph,i)=>mount3D("diag"+i, poseSpec(ph), A));
  rafOnce(()=>{
    phases.forEach((ph,i)=>{
      const c=$(`[data-nys="${i}"]`); if(c) startNys(c,ph.nys,ph.nys._envI);      // D7/V21: _envI (suma multi) — poza egzaminem undefined ⇒ ścieżka bez zmian
      const dh=$(`[data-dialnys="${i}"]`); if(dh) startDialNysIn(dh,ph.nys,ph.nys._env01);   // animacja dialu (widok z tyłu); _env01 = kształt sumy 0..1
    });
    const dcA=$('[data-diagcanal="canalo"]'); if(dcA) startDiagOtolith(dcA,"canalo",effCanal,effSide);
    const dcB=$('[data-diagcanal="cupulo"]'); if(dcB) startDiagOtolith(dcB,"cupulo",effCanal,effSide);
    const dcL=$('[data-diagcanal="light"]');  if(dcL) startDiagOtolith(dcL,"light",effCanal,effSide);    // D4: light = odgięcie osklepka bez ziaren
    const dcS=$('[data-diagcanal="short"]');  if(dcS) startDiagOtolith(dcS,"short",effCanal,effSide);    // D4: short = cząstka przy bańce (init.arm)
    // CPN: uporczywy downbeat Z SILNIKA (preset 'downbeat' — odhamowanie drog kanalow przednich), nie literal:
    // fizyka i animacja maja jedno zrodlo; petla CIAGLA (startNys z obwiednia xi wylaczylby sie, a CPN jest UPORCZYWY).
    const cpn=$('[data-cpnnys]'); if(cpn) startNeuroNys(cpn, NeuroVOR.observe(NeuroVOR.scenario('downbeat'), false), 0);
    // V23: oczy karty jam — pętla CIĄGŁA przez envOv (plateau nie wygasa; xiEnvelope ZAKAZANE na nici jam)
    const jn=$('[data-jamnys]'); if(jn) startNys(jn, {...nysFromDyn("posterior", effSide, JAM_DEMO.xi, false), fatigue:1}, {env:()=>1, tEnd:Infinity, peak:1});
    if(state.testKey==="roll") setNullYaw(0);   // V12/D3: montaż mini-karty null point (suwak startuje w 0)
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
  // Okno sakad wyłącznie UKRYTYCH: vHIT patologiczny, ale bedside NIC nie widać — pułapka sakad ukrytych.
  const hiRow = (H.hi.abnormal && !H.hi.bedsideAbnormal && H.ny.hasSpontaneous)
    ? [tag("warn","HI"), tr(`Head-Impulse: patologiczny w vHIT (sakady UKRYTE) — przy łóżku wygląda PRAWIDŁOWO. Pułapka: nieprzeszkolone badanie odczyta ośrodek.`,`Head impulse: abnormal on vHIT (COVERT saccades) — looks NORMAL at the bedside. Trap: an untrained exam would read central.`)]
    : H.hi.abnormal
    ? [tag("ok","HI"), tr(`Head-Impulse: sakada korygująca po stronie ${H.hi.side==="P"?"prawej":"lewej"} (kanał chory) — <b>obwodowy</b>.`,`Head impulse: corrective saccade on the ${H.hi.side==="P"?"right":"left"} side (affected canal) — <b>peripheral</b>.`)]
    // Kryterium „Impulse Normal" bierzemy z silnika (H.infarct), a NIE z hasSpontaneous: HIT bada kanaly
    // POZIOME, wiec grozny jest tylko oczoplas POZIOMY przy prawidlowym HIT. Oczoplas pionowo-skretny
    // z ubytku kanalu pionowego (neuronitis n. dolnego) jest OBWODOWY i nie moze zapalac tej flagi.
    : H.infarct.impulseNormal
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
  // Nota stosowalnosci GRACE-3 (silnik: applicable=false gdy brak AVS, a jakies znalezisko jest) —
  // werdykt widoczny, ale JAWNIE oznaczony jako interpretacja instrumentalna, nie przylozkowa triada.
  const applic = H.verdictNote ? `<div class="note" style="margin-top:8px;opacity:.85">⚠ ${H.verdictNote}</div>` : "";
  return `<div class="hverdict ${v}"><h4>${tr("Werdykt HINTS","HINTS verdict")}</h4><div class="vv">${vText}</div>
    ${applic}${row(hiRow)}${row(nyRow)}${row(tsRow)}${foot}</div>`;
}
/* ============ D8/V22: karta taksonomii GRACE-3 + demo pacjenta t-EVS ============ */
// Dane demo — JEDNA nić (tevsDemoSim) → ślad spvTrace + metryki liczone ZE ŚLADU (chipy nie są
// zapieczonymi twierdzeniami — dryf fizyki zmieni liczby na karcie) + obwiednia oczu WYŁĄCZNIE
// z odcinka prowokacji (t rebazowane o TEVS_REST; tożsamość z kanoniczną prowokacją pilnuje throw
// translacyjny wyroczni — 8 s ciszy zostaje na wykresie, nie w oczekiwaniu po kliknięciu).
let _tevsData=null;
function tevsData(){
  if(_tevsData) return _tevsData;
  const sim=tevsDemoSim();
  const trace=spvTrace(sim,"posterior","P");
  const mag=trace.map(s=>Math.max(Math.abs(s.spvH),Math.abs(s.spvVert),Math.abs(s.spvTors)));
  const V=NeuroVOR.VIS_THRESH, dt=trace.length>1?trace[1].t-trace[0].t:0.05, provEnd=TEVS_REST+0.5+40;
  let pk=0, tPk=0, tOn=null, over=0, hump=0;
  trace.forEach((s,i)=>{
    if(mag[i]>pk){ pk=mag[i]; tPk=s.t; }
    if(s.t<=provEnd && mag[i]>=V){ if(tOn==null) tOn=s.t; over+=dt; }
    if(s.t>provEnd && mag[i]>hump) hump=mag[i];
  });
  const eyes=xiEnvelope(sim.filter(s=>s.t>=TEVS_REST).map(s=>({t:s.t-TEVS_REST, xi:s.xi})));
  const avsSpv=NeuroVOR.observe(NeuroVOR.scenario("neuritisR"), false).spv;
  _tevsData={sim, trace, mag, V, pk, tPk, tOn, over, hump, tail:mag[mag.length-1], provEnd, eyes, avsSpv};
  return _tevsData;
}
// Wykres SPV(t): 3 składowe śladu (spvH/spvVert/spvTors — kontrakt mostu per składowa; przy PC
// dominacja torsji jest sama w sobie lekcją) + pas progu ±VIS_THRESH (żywa stała, zakaz literału)
// + linia kontrastu AVS z observe() (poziom STAŁY vs garb prowokacyjny = cała taksonomia na jednym
// obrazku). Czysto statyczny SVG (zero rAF — wyrocznie dom widzą pełną treść).
function spvChartSVG(){
  const D=tevsData(), W=560, Hh=250, Lm=36, Rm=8, Tm=18, Bm=30;
  const tMax=D.trace[D.trace.length-1].t, yMax=Math.max(D.pk, D.avsSpv)*1.1;
  const X=tt=>Lm+(W-Lm-Rm)*tt/tMax, Y=v=>Tm+(Hh-Tm-Bm)*(1-(v+yMax)/(2*yMax));
  const line=(fld,col,wd)=>{ let d=""; for(let i=0;i<D.trace.length;i+=4){ const s=D.trace[i]; d+=(d?"L":"M")+X(s.t).toFixed(1)+" "+Y(s[fld]).toFixed(1); } return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${wd}"/>`; };
  const zone=(tt,lbl)=>`<line x1="${X(tt).toFixed(1)}" y1="${Tm}" x2="${X(tt).toFixed(1)}" y2="${Hh-Bm}" stroke="var(--line)" stroke-dasharray="3 3"/><text x="${(X(tt)+3).toFixed(1)}" y="${Tm+9}" fill="var(--muted)" font-size="8.5">${lbl}</text>`;
  return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="${t("Ślad SPV demo t-EVS","t-EVS demo SPV trace")}" style="width:100%;height:auto">
    <rect x="${Lm}" y="${Y(D.V).toFixed(1)}" width="${W-Lm-Rm}" height="${(Y(-D.V)-Y(D.V)).toFixed(1)}" fill="var(--panel2)" opacity="0.6"/>
    <line x1="${Lm}" y1="${Y(0).toFixed(1)}" x2="${W-Rm}" y2="${Y(0).toFixed(1)}" stroke="var(--line)"/>
    <line x1="${Lm}" y1="${Y(D.avsSpv).toFixed(1)}" x2="${W-Rm}" y2="${Y(D.avsSpv).toFixed(1)}" stroke="#b0813f" stroke-dasharray="6 4" stroke-width="1.4"/>
    <text x="${W-Rm}" y="${(Y(D.avsSpv)-4).toFixed(1)}" text-anchor="end" fill="#b0813f" font-size="9">${t(`AVS (neuronitis): poziom STAŁY ${D.avsSpv.toFixed(1)} °/s — bez prowokacji`,`AVS (neuritis): CONSTANT level ${D.avsSpv.toFixed(1)} °/s — no provocation`)}</text>
    <text x="${Lm+3}" y="${(Y(D.V)-3).toFixed(1)}" fill="var(--muted)" font-size="8.5">${t(`próg widoczności ±${D.V} °/s`,`visibility threshold ±${D.V} °/s`)}</text>
    ${zone(0, t("spoczynek (siad)","rest (sitting)"))}${zone(TEVS_REST, t("prowokacja Dix-Hallpike","Dix-Hallpike provocation"))}${zone(D.provEnd, t("siadanie — ODWRÓCONY (2. prowokacja)","sitting up — REVERSED (2nd provocation)"))}
    ${line("spvH","#9FE3F6",1.3)}${line("spvVert","#3a8f6f",1.3)}${line("spvTors","#FF9FBD",1.6)}
    <text x="${Lm}" y="${Hh-8}" fill="var(--muted)" font-size="9">0 s</text><text x="${W-Rm}" y="${Hh-8}" text-anchor="end" fill="var(--muted)" font-size="9">${tMax.toFixed(0)} s</text>
    <text x="4" y="${Tm+8}" fill="var(--muted)" font-size="9">°/s</text>
    <text x="${(W/2).toFixed(0)}" y="${Hh-8}" text-anchor="middle" fill="var(--muted)" font-size="9"><tspan fill="#9FE3F6">— ${t("poziomy","horizontal")}</tspan>  <tspan fill="#3a8f6f">— ${t("pionowy","vertical")}</tspan>  <tspan fill="#FF9FBD">— ${t("skrętny","torsional")}</tspan></text>
  </svg>`;
}
// Karta różnicowa t-EVS/AVS/s-EVS — STATYCZNA (identyczny substring we wszystkich kluczach dom
// hints/* — dowód zakresu mechaniczny), zawsze na ekranie HINTS pod werdyktem; rozwinięta w trybie
// demo. Treść 1:1 z notą [H24] (pasma czasowe dopisane do noty w tym samym kroku — jedno źródło).
function graceCard(open){
  const cell=(a,b,c)=>`<span>${a}</span><span>${b}</span><span>${c}</span>`;
  const row=(lbl,a,b,c)=>`<div style="display:grid;grid-template-columns:86px 1fr 1fr 1fr;gap:8px;padding:7px 0;border-top:1px solid var(--line);font-size:12px;line-height:1.35">${`<span style="color:var(--muted)">${lbl}</span>`}${cell(a,b,c)}</div>`;
  const btn=(on,lbl)=>`<button class="preset" style="font-size:11px;padding:4px 8px" onclick="${on}">${lbl}</button>`;
  return `<details class="advbox" ${open||state.hintsGrace?"open":""} ontoggle="setHintsGrace(this.open)"><summary>${t("Kiedy w ogóle HINTS? — t-EVS / AVS / s-EVS (GRACE-3)","When is HINTS applicable at all? — t-EVS / AVS / s-EVS (GRACE-3)")}</summary>
    <div style="display:grid;grid-template-columns:86px 1fr 1fr 1fr;gap:8px;font-size:12px;font-weight:700;padding-bottom:4px"><span></span><span style="color:var(--post)">t-EVS (BPPV)</span><span style="color:var(--ant)">AVS</span><span style="color:var(--horiz)">s-EVS</span></div>
    ${row(t("Przebieg / czas","Course / time"),
      t("napady sekundy–minuty (BPPV: paroksyzm <1 min), między napadami bez objawów","attacks of seconds–minutes (BPPV: paroxysm <1 min), symptom-free between attacks"),
      t("CIĄGŁY — ostry początek, trwa dni","CONTINUOUS — acute onset, lasts days"),
      t("samoistne epizody minuty–godziny, między nimi norma","spontaneous episodes of minutes–hours, normal in between"))}
    ${row(t("Wyzwalacz","Trigger"),
      t("OBOWIĄZKOWY — zmiana pozycji głowy (położenie się, obrót w łóżku, pochylenie)","OBLIGATE — a change of head position (lying down, rolling in bed, bending)"),
      t("brak — trwa także w SPOCZYNKU (ruch głowy NASILA, ale nie wyzwala)","none — persists at REST (head movement EXACERBATES, does not trigger)"),
      t("brak (napady samoistne); wywiad migrenowy / napadowość","none (spontaneous attacks); migraine history / episodicity"))}
    ${row(t("Oczopląs samoistny","Spontaneous nystagmus"),
      t("NIE — złóg w spoczynku (restPhi), ξ=0","NO — debris at rest (restPhi), ξ=0"),
      t("TAK — toniczny, w każdej pozycji, nie wyczerpuje się","YES — tonic, in every position, non-fatiguing"),
      t("międzynapadowo NIE — badanie prawidłowe","interictally NO — the exam is normal"))}
    ${row(t("Oczopląs prowokowany","Provoked nystagmus"),
      t("TAK: latencja → paroksyzm → wyczerpanie (Dix-Hallpike / Roll)","YES: latency → paroxysm → fatigue (Dix-Hallpike / Roll)"),
      t("obecny stale, pozycją tylko modulowany","present throughout, merely modulated by position"),
      t("między napadami brak","absent between attacks"))}
    ${row(t("Czy HINTS?","Is HINTS applicable?"),
      t("NIE — brak oczopląsu samoistnego (bramka silnika: applicable=false)","NO — no spontaneous nystagmus (engine gate: applicable=false)"),
      t("TAK — triada w trwającym AVS, TYLKO przeszkoleni (HINTS+); każda ataksja chodu = OŚRODEK","YES — the triad in ongoing AVS, TRAINED examiners only (HINTS+); any gait ataxia = CENTRAL"),
      t("NIE międzynapadowo — rozpoznanie z WYWIADU","NOT interictally — the diagnosis comes from the HISTORY"))}
    ${row(t("Badanie z wyboru","Test of choice"),
      t("Dix-Hallpike → Epley; Roll → Gufoni. NIE HINTS, NIE CT","Dix-Hallpike → Epley; Roll → Gufoni. NOT HINTS, NOT CT"),
      t("HINTS(+); wątpliwość → MRI DWI+MRA (wczesne MRI bywa fałszywie ujemne — powtórz 48–72 h); NIE CT","HINTS(+); if in doubt → MRI DWI+MRA (early MRI can be falsely negative — repeat at 48–72 h); NOT CT"),
      t("kryteria migreny przedsionkowej (karta niżej) vs TIA tylnego kręgu; 5 D (dyplopia, dyzartria, dysfagia, dysfonia, dysmetria)","vestibular-migraine criteria (card below) vs posterior-circulation TIA; the 5 Ds (diplopia, dysarthria, dysphagia, dysphonia, dysmetria)"))}
    ${row(t("Pułapka / flaga","Pitfall / flag"),
      t("CPN: downbeat bez latencji, niemęczliwy → MRI (Diagnostyka → widok „Ośrodkowy”)","CPN: a downbeat without latency, non-fatiguing → MRI (Diagnostics → the „Central” view)"),
      t("pseudo-AVS bez oczopląsu → znieś fiksację (Frenzel)","pseudo-AVS without nystagmus → remove fixation (Frenzel)"),
      t("TIA tylnego kręgu wygląda jak napad migreny — czynniki naczyniowe = pilna diagnostyka","a posterior-circulation TIA mimics a migraine attack — vascular risk factors = urgent work-up"))}
    ${row(t("Zobacz w aplikacji","See in the app"),
      btn("loadHintsPreset('tevs')", t("▶ Pacjent t-EVS — demo","▶ t-EVS patient — demo"))+btn("openTest('dix')", "→ Dix-Hallpike"),
      btn("openHints('neuritisR')", t("→ Neuronitis","→ Neuritis"))+btn("openHints('strokeCentral')", t("→ Udar","→ Stroke")),
      btn("loadHintsPreset('vmi')", t("→ Migrena przeds.","→ Vestibular migraine")))}
    <div class="note">${t("Triada HINTS obowiązuje TYLKO w trwającym AVS z oczopląsem samoistnym — poza nim werdykt to interpretacja instrumentalna (bramka stosowalności silnika). Ménière — także napadowy — ma własne presety; [H24] w kolumnie s-EVS wymienia migrenę przedsionkową i TIA. Źródło: GRACE-3 [H24].","The HINTS triad applies ONLY in ongoing AVS with spontaneous nystagmus — outside it the verdict is an instrumental interpretation (the engine's applicability gate). Ménière — also episodic — has its own presets; [H24] lists vestibular migraine and TIA in the s-EVS column. Source: GRACE-3 [H24].")}</div>
  </details>`;
}
// ═════ V28 — KARTA KRYTERIÓW MIGRENY PRZEDSIONKOWEJ (Bárány Society / IHS) ═════
// POWÓD ISTNIENIA, ZMIERZONY PRZED ZMIANĄ: karta GRACE (D8/V22) w wierszu „Badanie z wyboru",
// kolumna s-EVS, odsyła do „kryteriów migreny przedsionkowej" — a tych kryteriów nie było
// w programie NIGDZIE. Pomiar na całym repo (bez dist/ i node_modules/): „ICHD" 0 trafień,
// „fotofobi" 0, „fonofobi" 0, „co najmniej 5" 0, „5 minut" 0. Odsyłacz prowadził donikąd
// i ŻADNA wyrocznia tego nie widziała: zrodla:check porównuje numer z oznaczeniem źródła,
// a przy tamtym zdaniu numeru nie było w ogóle — to jej jawnie zadeklarowana granica.
// CZEGO NIE ROBI: nie liczy, nie klasyfikuje i nie stawia rozpoznania. Migreny przedsionkowej
// silnik NIE MODELUJE i deklaracja ta zostaje w mocy — rozpoznanie stawia wywiad. Kryteria są
// PARAFRAZOWANE, bo licencja źródła to CC BY-NC 4.0; dosłowny przedruk byłby osobną decyzją.
// BLOK WYKLUCZEŃ NIE JEST OZDOBĄ (poprawka po recenzji klinicznej V28): kryterium D to jedyna
// bramka WYPUSZCZAJĄCA z rozpoznania, a sama lista A-C jest listą WPUSZCZAJĄCĄ. Bez treści D
// karta byłaby zestawem pól do odhaczenia — dlatego to WYKLUCZENIA, a nie akapit redakcyjny,
// noszą tu class="redflag" (idiom alarmu w tej aplikacji jest zarezerwowany dla zagrożenia).
// Szczególnie waży brak dolnego ograniczenia na długość wywiadu: kryterium A spełnia też chory
// z pięcioma napadami w ciągu trzech miesięcy, czyli podręcznikowy fenotyp TIA — źródło daje
// ten dyskryminator („cała historia napadów krótsza niż rok") i karta musi go nieść.
function vmCriteriaCard(open){
  const li=(k,v)=>`<li style="margin:0 0 5px"><b>${k}</b> — ${v}</li>`;
  const h4=(s)=>`<div style="font-weight:700;font-size:12.5px;margin:10px 0 5px">${s}</div>`;
  const ul=(items)=>`<ul style="margin:0;padding-left:18px;line-height:1.5;font-size:12px">${items}</ul>`;
  return `<details class="advbox" ${open||state.hintsVmCrit?"open":""} ontoggle="setHintsVmCrit(this.open)"><summary>${t("Kryteria migreny przedsionkowej — Bárány Society / IHS","Diagnostic criteria for vestibular migraine — Bárány Society / IHS")}</summary>
    <div class="note" style="color:var(--text);margin-top:0">${t("Rozpoznanie stawia <b>wywiad</b> — nie HINTS i nie badanie instrumentalne. Silnik OTOREPO tej jednostki nie modeluje: to wyciąg z kryteriów, nie kalkulator. Kryteria A–C <b>wpuszczają</b> do rozpoznania, kryterium D <b>wypuszcza</b> — czytaj je razem.","The diagnosis comes from the <b>history</b> — not from HINTS and not from instrumental testing. The OTOREPO engine does not model this entity: this is a digest of the criteria, not a calculator. Criteria A–C <b>let you in</b>, criterion D <b>lets you out</b> — read them together.")}</div>
    ${h4(t("Migrena przedsionkowa — wszystkie cztery kryteria","Vestibular migraine — all four criteria"))}
    ${ul(li("A", t("co najmniej <b>5 epizodów</b> objawów przedsionkowych o nasileniu umiarkowanym lub ciężkim, trwających <b>5 min – 72 h</b>","at least <b>5 episodes</b> of vestibular symptoms of moderate or severe intensity, lasting <b>5 min – 72 h</b>"))
       +li("B", t("migrena z aurą lub bez aury wg ICHD-3 — obecnie albo w wywiadzie","migraine with or without aura per ICHD-3 — current or past"))
       +li("C", t("co najmniej jedna cecha migrenowa w <b>co najmniej połowie</b> epizodów: ból głowy z ≥ 2 z czterech cech (jednostronny · pulsujący · umiarkowany lub ciężki · nasilany rutynową aktywnością fizyczną) <b>albo</b> światłowstręt <b>razem z</b> fonofobią <b>albo</b> aura wzrokowa","at least one migraine feature in <b>at least half</b> of the episodes: headache with ≥ 2 of four features (unilateral · pulsating · moderate or severe · aggravated by routine physical activity) <b>or</b> photophobia <b>together with</b> phonophobia <b>or</b> visual aura"))
       +li("D", t("obraz nie jest lepiej wyjaśniony przez inne rozpoznanie przedsionkowe ani przez inne rozpoznanie ICHD — <b>treść tego kryterium niżej</b>","not better accounted for by another vestibular diagnosis or by another ICHD diagnosis — <b>the content of this criterion is below</b>")))}
    <div class="redflag" style="margin-top:11px"><b>${t("⚠ Kryterium D — zanim rozpoznasz, wyklucz","⚠ Criterion D — rule out before you diagnose")}</b>
      <ul style="margin:7px 0 0;padding-left:18px;line-height:1.5">
        <li>${t("<b>TIA kręgowo-podstawne</b> — rozważ zwłaszcza u osób starszych. Za TIA przemawiają: czynniki ryzyka naczyniowego, <b>nagły</b> początek, <b>cała historia napadów krótsza niż rok</b> oraz dowód patologii naczyniowej (angiografia lub USG doppler) w tętnicy kręgowej lub bliższym odcinku podstawnej. Uwaga: kryterium A żąda 5 epizodów, ale <b>nie stawia dolnego ograniczenia na długość wywiadu</b> — pięć napadów w trzy miesiące spełnia A i jest zarazem fenotypem TIA.","<b>Vertebrobasilar TIA</b> — consider especially in older patients. Features favouring TIA: vascular risk factors, <b>sudden</b> onset, a <b>total history of attacks shorter than one year</b>, and angiographic or Doppler evidence of vascular pathology in the vertebral or proximal basilar artery. Note: criterion A demands 5 episodes but sets <b>no lower bound on the length of the history</b> — five attacks in three months satisfies A and is equally a TIA phenotype.")}</li>
        <li>${t("<b>Nagły ból karku</b> → podejrzenie <b>rozwarstwienia tętnicy kręgowej</b>. To sytuacja godzinowa, nie planowa.","<b>Sudden neck pain</b> → suspect <b>vertebral artery dissection</b>. That is a matter of hours, not of scheduling.")}</li>
        <li>${t("<b>Choroba Ménière'a</b> — gdy spełnione są jej kryteria [H20] Lopez-Escamez 2015, zwłaszcza przy udokumentowanym audiometrycznie jednostronnym niedosłuchu, rozpoznaje się Ménière'a nawet wtedy, gdy w napadach występują objawy migrenowe. <b>Oba</b> rozpoznania stawia się tylko u chorego mającego <b>dwa różne typy napadów</b>: jeden spełniający kryteria migreny przedsionkowej, drugi kryteria Ménière'a.","<b>Menière's disease</b> — when its criteria [H20] Lopez-Escamez 2015 are met, especially with audiometrically documented unilateral hearing loss, Menière's is diagnosed even if migraine symptoms occur during the attacks. <b>Both</b> diagnoses are made only in a patient who has <b>two different types of attacks</b>: one fulfilling the vestibular-migraine criteria, the other Menière's.")}</li>
        <li>${t("<b>Napadowica przedsionkowa</b> — napady trwające od jednej do kilku sekund, nawracające wielokrotnie w ciągu doby; rozpoznanie wspiera skuteczna profilaktyka karbamazepiną. Ważne tu, bo reguła liczenia napadów sekundowych (niżej) sama otwiera na ten fenotyp furtkę.","<b>Vestibular paroxysmia</b> — attacks lasting one to several seconds, recurring many times a day; successful prevention with carbamazepine supports it. Relevant here because the counting rule for attacks of seconds (below) opens the door to this phenotype.")}</li>
        <li>${t("<b>Nasilone nieprawidłowości w okresie bezobjawowym</b> — znaczny niedosłuch albo całkowite jedno- lub obustronne wypadnięcie czynności przedsionka — wskazują <b>zwykle na inną przyczynę</b>. Badanie służy tu do WYKLUCZANIA, nie do potwierdzania.","<b>Profound abnormalities in the symptom-free interval</b> — severe hearing loss or complete unilateral or bilateral vestibular loss — are <b>usually indicative of another cause</b>. Testing serves here to RULE OUT, not to confirm.")}</li>
      </ul></div>
    ${h4(t("Postać PRAWDOPODOBNA — trzy kryteria, nie cztery","PROBABLE form — three criteria, not four"))}
    ${ul(li("A", t("jak wyżej","as above"))
       +li("B", t("spełnione jest <b>tylko jedno</b> z kryteriów B i C postaci pewnej — albo wywiad migrenowy, albo cechy migrenowe w epizodzie, nie oba","<b>only one</b> of criteria B and C of the definite form is fulfilled — either the migraine history or the migraine features during the episode, not both"))
       +li("C", t("brak lepszego wyjaśnienia (rolę kryterium D przejmuje tu C — wykluczenia wyżej obowiązują tak samo, a poprzeczka jest NIŻSZA)","no better explanation (the role of criterion D is carried by C here — the exclusions above apply just the same, and the bar is LOWER)")))}
    ${h4(t("Co się kwalifikuje jako objaw i jak stopniuje się nasilenie","What qualifies as a symptom, and how intensity is graded"))}
    ${ul(li(t("Objawy","Symptoms"), t("zawrót samoistny (wewnętrzny i zewnętrzny), pozycyjny, wywołany bodźcem wzrokowym oraz wywołany ruchem głowy. Samo oszołomienie kwalifikuje się <b>tylko</b> jako wywołane ruchem głowy <b>z nudnościami</b>.","spontaneous vertigo (internal and external), positional, visually induced and head motion-induced. Dizziness alone qualifies <b>only</b> as head motion-induced dizziness <b>with nausea</b>."))
       +li(t("Nasilenie","Intensity"), t("umiarkowane = zakłóca codzienne czynności, ale ich nie uniemożliwia; ciężkie = codziennych czynności nie da się kontynuować. Nasilenie łagodne nie spełnia kryterium A — stopnia łagodnego kryteria nie przewidują.","moderate = interferes with but does not prohibit daily activities; severe = daily activities cannot be continued. Mild intensity does not satisfy criterion A — the criteria provide no mild grade."))
       +li(t("Czas trwania","Duration"), t("ok. 30% chorych ma napady minutowe, 30% godzinne, 30% wielodniowe, 10% wyłącznie sekundowe — u tych ostatnich za czas epizodu przyjmuje się <b>cały okres nawracania</b> krótkich napadów, nie długość jednego. U części chorych pełny powrót do zdrowia zajmuje do czterech tygodni, ale <b>rdzeń epizodu</b> rzadko przekracza 72 h — i to rdzeń liczy kryterium A.","about 30% of patients have attacks lasting minutes, 30% hours, 30% several days, 10% only seconds — in the last group the episode duration is taken as <b>the whole period over which</b> the brief attacks recur, not the length of a single one. In some patients full recovery takes up to four weeks, but <b>the core of the episode</b> rarely exceeds 72 h — and it is the core that criterion A counts.")))}
    <div class="panelbox" style="margin-top:11px"><h4>${t("Dlaczego to stoi w aplikacji o BPPV","Why this sits in a BPPV application")}</h4>
      <ul style="margin:2px 0 0;padding-left:18px;line-height:1.5;font-size:12px">
        <li>${t("Migrena przedsionkowa bywa <b>czysto pozycyjna</b> i wtedy <b>naśladuje BPPV</b>.","Vestibular migraine may be <b>purely positional</b> and then it <b>mimics BPPV</b>.")}</li>
        <li>${t("Jej oczopląs pozycyjny jest <b>zwykle utrwalony</b>, o <b>stałej</b> prędkości, przeważnie małej lub umiarkowanej, <b>rzadko powyżej 30°/s</b>. Kontrast z krescendo-dekrescendo wolnego złogu jest <b>nasz</b> — źródło opisuje tylko utrwalenie i stałą prędkość.","Its positional nystagmus is <b>usually persistent</b>, of <b>constant</b> velocity, mostly low to moderate, <b>rarely above 30°/s</b>. The contrast with the crescendo-decrescendo of free debris is <b>ours</b> — the source describes only the persistence and the constant velocity.")}</li>
        <li>${t("Rozstrzygnięcie może wymagać <b>bezpośredniej obserwacji oczopląsu w fazie ostrej</b> — międzynapadowo tej osi po prostu nie ma.","Settling it may require <b>direct observation of the nystagmus in the acute phase</b> — between attacks that axis is simply unavailable.")}</li>
        <li>${t("<b>Okres objawowy</b> (nie pojedynczy napad) bywa krótszy niż w BPPV — minuty–dni, nie tygodnie — a nawroty częstsze: kilka razy w roku wobec raz na kilka lat.","The <b>symptomatic period</b> (not the single attack) tends to be shorter than in BPPV — minutes to days, not weeks — and the recurrences more frequent: several times a year versus once every few years.")}</li>
        <li>${t("Typowe BPPV występuje <b>częściej</b> u chorych na migrenę, z przyczyn niejasnych: rozpoznanie migreny <b>nie zwalnia</b> z wykonania próby pozycyjnej, a dodatni Dix-Hallpike <b>nie wyklucza</b> współistniejącej migreny przedsionkowej.","Typical BPPV is <b>more common</b> in patients with migraine, for unclear reasons: a migraine diagnosis <b>does not excuse</b> skipping the positional test, and a positive Dix-Hallpike <b>does not rule out</b> coexisting vestibular migraine.")}</li>
      </ul></div>
    <div class="note">${t("Granice źródła: praca <b>nie mówi</b>, że badanie międzynapadowe jest prawidłowe — mówi, że wyniki bywają nieprawidłowe w napadzie lub tuż po nim, a międzynapadowo <b>nie są dość swoiste</b>, by być kryterium. Osobno: pobudzenie przedsionka samo bywa wyzwalaczem — próba kaloryczna <b>często</b> wyzwala napad migreny w ciągu 24 h u chorych na migrenę, więc objawy migrenowe <b>po prowokacji przedsionkowej</b> nie są dowodem migreny przedsionkowej (kryterium C dotyczy napadów samoistnych, nie sprowokowanych badaniem). Źródło kryteriów: [H46] Lempert 2022.","Source boundaries: the paper does <b>not</b> say the interictal examination is normal — it says findings can be pathological during or shortly after an episode, and that interictal results are <b>not sufficiently specific</b> to be a criterion. Separately: vestibular stimulation can itself be a trigger — caloric testing <b>often</b> provokes a migraine attack within 24 h in patients with migraine, so migraine symptoms <b>after vestibular provocation</b> are no proof of vestibular migraine (criterion C concerns spontaneous attacks, not ones provoked by testing). Source of the criteria: [H46] Lempert 2022.")}</div>
  </details>`;
}
// Panel demo t-EVS (zamiast panelu „Własny” przy preset tevs): pacjent NeuroVOR ZDROWY, cała
// patologia BPPV w śladzie tevsDemoSim. Oczy startują WYŁĄCZNIE z przycisku prowokacji (spec:
// „oś oczopląsu zasilana spvTrace tylko podczas prowokacji, poza nią cisza”).
function tevsDemoPanel(){
  const D=tevsData();
  const H=NeuroVOR.hints(NeuroVOR.makePatient({}));
  const chip=(k,v)=>`<span style="display:inline-flex;gap:6px;align-items:baseline;background:var(--panel2);border:1px solid var(--line);border-radius:8px;padding:4px 9px;font-size:12px;margin:3px 4px 0 0"><span style="color:var(--muted)">${k}:</span><b>${v}</b></span>`;
  const chips = chip(t("latencja","latency"), `${(D.tOn-TEVS_REST).toFixed(2)} s`)
    + chip(t("szczyt","peak"), `${D.pk.toFixed(1)} °/s @ ${(D.tPk-TEVS_REST).toFixed(1)} s`)
    + chip(t("nadprogowo","above threshold"), `${D.over.toFixed(1)} s (<60 s)`)
    + chip(t("odwrócenie przy siadaniu","reversal on sitting"), `${D.hump.toFixed(1)} °/s`)
    + chip(t("ogon","tail"), `${D.tail.toFixed(2)} °/s (${t("podprogowy","subthreshold")})`);
  return `<div class="panelbox hpanel custompanel" style="margin-top:12px">
    <h4>${t("Pacjent t-EVS (BPPV, kanał tylny P) na ekranie HINTS — demo","t-EVS patient (BPPV, posterior canal R) on the HINTS screen — demo")}</h4>
    <div class="presets">${hintsPresetsRow()}</div>
    <div class="note" style="margin-top:8px">${t("Między prowokacjami złóg SPOCZYWA na dnie kanału (restPhi) → ξ=0: oczopląsu samoistnego brak, HIT prawidłowy, skew ujemny — badanie spoczynkowe NIE odróżnia tego pacjenta od zdrowego. Dlatego HINTS/vHIT wychodzą „prawidłowe” w BPPV. Werdykt silnika dla tego pacjenta:","Between provocations the debris RESTS at the canal's bottom (restPhi) → ξ=0: no spontaneous nystagmus, a normal HIT, no skew — the resting exam does NOT distinguish this patient from a healthy one. That is why HINTS/vHIT come out „normal” in BPPV. The engine's verdict for this patient:")} <b>«${H.verdict}»</b>, applicable=<b>${H.applicable}</b>${t(" (triada HINTS wg GRACE-3 NIESTOSOWALNA — brak oczopląsu samoistnego) → WYKONAJ test pozycyjny: Dix-Hallpike."," (the HINTS triad per GRACE-3 is NOT APPLICABLE — no spontaneous nystagmus) → PERFORM a positional test: Dix-Hallpike.")}</div>
    <div class="eyesrow" style="margin-top:8px"><span class="emk">${t("P","R")}</span><div class="eyeswrap" data-tevsnys>${eyesSVG()}</div><span class="emk">L</span></div>
    <div class="hctrl" style="justify-content:center;margin-top:4px"><button class="preset" onclick="tevsProvoke()">${t("▶ Prowokacja Dix-Hallpike (odtwórz symulację)","▶ Dix-Hallpike provocation (replay the simulation)")}</button></div>
    <div class="note">${t("Oczy grają RAZ obwiednię ξ(t) tej samej symulacji, którą rysuje wykres (latencja → paroksyzm → wyczerpanie → odwrócenie przy siadaniu) i gasną same. Animacja niesie kształt i czas; amplitudę w °/s niesie wykres.","The eyes play ONCE the ξ(t) envelope of the same simulation the chart draws (latency → paroxysm → fatigue → reversal on sitting up) and stop by themselves. The animation carries shape and timing; the amplitude in °/s lives in the chart.")}</div>
    ${spvChartSVG()}
    <div style="margin-top:4px">${chips}</div>
    <div class="obsrow" style="margin-top:10px"><div class="obslabel">${t("Kontrast: AVS (neuronitis) — oczopląs CIĄGŁY, bez prowokacji","Contrast: AVS (neuritis) — CONTINUOUS nystagmus, no provocation")}</div>
      <div class="eyesrow"><span class="emk">${t("P","R")}</span><div class="eyeswrap" data-tevsavs>${eyesSVG()}</div><span class="emk">L</span></div>
      <div class="note" style="margin-top:4px">${t(`Linia przerywana na wykresie = ten pacjent (${D.avsSpv.toFixed(1)} °/s w ciemności, STALE — także w „spoczynku”). Garb przejściowy vs linia ciągła to cała taksonomia GRACE-3 na jednym obrazku. Odwrotny most: przycisk „Nakładka AVS → diagnostyka” w trybie Własny.`,`The dashed line on the chart = this patient (${D.avsSpv.toFixed(1)} °/s in darkness, CONSTANTLY — including „at rest”). A transient hump vs a constant line is the whole GRACE-3 taxonomy in one picture. The reverse bridge: the „AVS overlay → diagnostics” button in the Custom mode.`)}</div></div>
  </div>`;
}
// Odtworzenie prowokacji demo: startNys z obwiednią Z TEJ SAMEJ symulacji (envOv — zero drugiej
// fizyki); kierunek z nysFromGeom kanonicznej karty Dix. Bez zmian stanu — bez re-renderu.
function tevsProvoke(){
  const c=$('[data-tevsnys]'); if(!c) return;
  const N=nysFromGeom("posterior","P","canalo", provokeQ("posterior","P"));
  startNys(c, {...N, fatigue:1}, tevsData().eyes);
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
    <div data-verdict>${hintsVerdictBlock(H)}</div>${graceCard(state.hintsPreset==="tevs")}${vmCriteriaCard(state.hintsPreset==="vmi")}
    ${custom ? (state.hintsQuiz && !state.hintsQuizReveal ? hintsQuizBanner() : (state.hintsPreset==="tevs" ? tevsDemoPanel() : hintsCustomPanel())) : hintsCompPanel(key)}
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
    // D8/V22: oczy kontrastu AVS w panelu demo t-EVS — pętla ciągła (precedens karty CPN);
    // oczy DEMO celowo NIE startują tu (wyłącznie z przycisku prowokacji — spec D8).
    const ta=$('[data-tevsavs]'); if(ta) startNeuroNys(ta, NeuroVOR.observe(NeuroVOR.scenario('neuritisR'), false), 0);
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
    // Kalibracja z oceny II (B3): 0.7 dawalo oczoplas powrotny 19.8 st./s = 70% fazy ostrej (klinicznie:
    // KILKA st./s, czesto widoczny dopiero bez fiksacji — McClure 1981) i ladunek 59.5 Hz PONAD maksimum
    // wlasnego suwaka (40 Hz). 0.15 -> bias 12.75 Hz, SPV 4.25 w ciemnosci (>prog), ~0.4 z fiksacja (znika).
    p.pacemakerBias=0.15*p.comp*(NeuroVOR.R0-acute);           // sticky ładunek pacemakera — Bechterew ∝ c
  }
  return p;
}
// N6 (D8): etykieta epoki + PRZYBLIŻONY dzień choroby z odwrócenia mapy czasu silnika c(t)=1−exp(−t/6d)
// (NeuroVOR.timeline) — suwak % zyskuje kotwicę czasową bez zmiany mechaniki.
const compDays=c=> c>=0.995 ? "≥30" : String(Math.round(-6*Math.log(1-Math.max(0,Math.min(0.994,c)))));
const compStage=c=> (c<0.05?tr("Faza ostra","Acute phase") : c<0.4?tr("Podostra","Subacute") : c<0.85?tr("Zaawansowana","Advanced") : tr("Pełna kompensacja","Full compensation"))
  + tr(` (~${compDays(c)} d.)`,` (~${compDays(c)} d)`);
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
  // Próg widoczności przeniesiony na skalę `strength` (VIS_THRESH/SPV_MAX = 2/30 ≈ 0.067).
  // BEZ fallbacków „||2 / ||12": obie stałe są zawsze eksportowane z NeuroVOR, więc gałąź zapasowa była
  // martwa, a jej „12" po zmianie SPV_MAX na 30 stało się cichą kopią nieaktualnej wartości — dokładnie
  // ten rodzaj rozjazdu stała↔kopia, który silnik pilnuje tripwire'ami. Jedno źródło prawdy.
  const VISFRAC=NeuroVOR.VIS_THRESH/NeuroVOR.SPV_MAX;
  let sH=Math.max(0,Math.min(1,nys.strength||0));                          // siła składowej POZIOMEJ
  let sV=Math.max(0,Math.min(1, nys.strengthV!=null ? nys.strengthV : (nys.dir?0:nys.strength)||0));  // PIONOWEJ (bez skretu — A1)
  // SKRET z wlasna sila (strengthT, pary pionowe); fallback sV utrzymuje stare wywolania (CPN literal,
  // pressureStimulus bez strengthT) — tam skret jedzie na sile pionu, jak przed rozdzialem osi.
  let sT=Math.max(0,Math.min(1, nys.strengthT!=null ? nys.strengthT : sV));
  if(sH<VISFRAC) sH=0;                                                     // poniżej progu → nie animuj (spójne z etykietą)
  if(sV<VISFRAC) sV=0;
  if(sT<VISFRAC) sT=0;
  return { gazePx:(gazeDeg||0)*camRx*0.5, Ah:7*sH, Av:6*sV, At:8*Math.max(sH,sT),
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
const SIDE_GEN = {L:"lewej", P:"prawej"};   // dopelniacz: „ku stronie prawEJ" (SIDE[] jest w mianowniku — „prawa")
function otolithInner(p){
  const sv=NeuroVOR.svv(p), ve=NeuroVOR.vemp(p);
  // SVV NIE jest swoista dla obwodu — ta sama os grawiceptywna biegnie przez pien (OTR). Zrodlo z sv.central.
  const svLabel = !sv.abnormal
    ? tr(`SVV prawidłowa (≤2°) — pion postrzegany zgodnie z grawitacją.`,`SVV normal (≤2°) — vertical perceived in line with gravity.`)
    : sv.central
      ? tr(`SVV: przechył pionu <b>${sv.deg.toFixed(1)}°</b> ku stronie <b>${SIDE_GEN[sv.tiltSide]}</b> — oś grawiceptywna <b>ośrodkowa</b> (razem z odchyleniem skośnym / OTR).`,`SVV: vertical tilt <b>${sv.deg.toFixed(1)}°</b> toward the <b>${sv.tiltSide==="P"?"right":"left"}</b> side — <b>central</b> graviceptive axis (together with skew deviation / OTR).`)
      : tr(`SVV: przechył pionu <b>${sv.deg.toFixed(1)}°</b> ku stronie <b>${SIDE_GEN[sv.tiltSide]}</b> — grawiceptywny, ipsiwersyjny (obwodowo ku stronie chorej).`,`SVV: vertical tilt <b>${sv.deg.toFixed(1)}°</b> toward the <b>${sv.tiltSide==="P"?"right":"left"}</b> side — graviceptive, ipsiversive (peripheral, toward the affected side).`);
  const VB_FS=1.5;                                                  // skala paska: do 1.5 — miesci WZMOZENIE (trzecie okno), nie tylko ubytek
  const vbar=(name,ear,amp,stat)=>{
    const pct=Math.round(Math.max(0,Math.min(1,amp/VB_FS))*100);
    const col= amp>=1.35?"#c9b6ff":amp>=0.65?"#7fe3c4":amp>=0.3?"#ffcf8f":"#ff9bab";   // kolor z AMPLITUDY (odporny na tlumaczenie 'stat')
    return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="min-width:82px;font-size:12px">${name} ${ear}</span>
      <div style="flex:1;height:9px;border-radius:5px;background:var(--panel2);position:relative;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:${col};transition:width .3s"></div>
        <div style="position:absolute;left:${Math.round(0.3/VB_FS*100)}%;top:0;bottom:0;width:1px;background:var(--line)" title="próg"></div></div>
      <span style="min-width:74px;font-size:11px;color:${col};text-align:right">${stat}</span></div>`;
  };
  const c=ve.cVEMP, o=ve.oVEMP;
  const vempNote=(()=>{ const parts=[];
    if(c.weakEar) parts.push(tr(`cVEMP obniżony po stronie ${SIDE_GEN[c.weakEar]} → <b>woreczek / nerw DOLNY</b>`,`cVEMP reduced on the ${c.weakEar==="P"?"right":"left"} side → <b>saccule / INFERIOR nerve</b>`));
    if(o.weakEar) parts.push(tr(`oVEMP obniżony po stronie ${SIDE_GEN[o.weakEar]} → <b>łagiewka / nerw GÓRNY</b>`,`oVEMP reduced on the ${o.weakEar==="P"?"right":"left"} side → <b>utricle / SUPERIOR nerve</b>`));
    // WZMOZENIE = trzecie okno, nie ubytek — inaczej SCDS czytalby sie jako „prawidlowo".
    if(c.strongEar||o.strongEar) parts.push(tr(`VEMP <b>wzmożony</b> po stronie ${SIDE_GEN[o.strongEar||c.strongEar]} → <b>trzecie okno (SCDS)</b>`,`VEMP <b>enhanced</b> on the ${(o.strongEar||c.strongEar)==="P"?"right":"left"} side → <b>third window (SCDS)</b>`));
    if(parts.length) return parts.join("; ")+".";
    // OBUSTRONNE zniesienie daje AR%≈0: bez tej galezi „symetryczne" czytalo sie jak „zachowane" (jak CP przy BVH).
    if(c.bilateralWeak||o.bilateralWeak) return tr("VEMP zniesione OBUSTRONNIE — asymetria międzyuszna ≈0 mimo ubytku (jak CP przy BVH).","VEMP absent BILATERALLY — interaural asymmetry ≈0 despite the deficit (like CP in BVH).");
    return tr("VEMP symetryczne — funkcja otolitowa zachowana obustronnie.","VEMP symmetric — otolith function preserved bilaterally.");
  })();
  const scdsNote = p.dehiscence ? `<div class="note">${tr('SCDS: VEMP o <b>niskim progu / dużej amplitudzie</b> (trzecie okno) — model podnosi amplitudę po stronie dehiscencji, obok oczopląsu trzeciego okna (panel „Oczopląs samoistny").','SCDS: VEMP with a <b>low threshold / large amplitude</b> (third window) — the model raises the amplitude on the dehiscent side, alongside third-window nystagmus (the "Spontaneous nystagmus" panel).')}</div>` : "";
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

// D8/V22: rząd presetów wspólny dla panelu „Własny" i panelu demo t-EVS (jedno źródło przycisków;
// "tevs" w liście PRZED "rd" — jak w obiekcie HINTS_PRESETS).
function hintsPresetsRow(){
  const active=state.hintsPreset;
  const presetBtn=k=>`<button class="preset" aria-pressed="${active===k}" onclick="loadHintsPreset('${k}')">${HINTS_PRESETS[k].label}</button>`;
  return presetBtn("healthy")
    + `<button class="preset" aria-pressed="${active==='neuritis'}" onclick="loadHintsNeuritis()">${tr("Neuronitis","Neuritis")}</button>`
    + ["bvh","meniereP","meniereL","scdsP","scdsL","stroke","vmi","laby","aica","downbeat","tevs","rd"].map(presetBtn).join("");
}
// Panel sterowania parametrami (PARAM_SPEC): presety + selektor nerwu + suwaki basic + zaawansowane (zwijane).
function hintsCustomPanel(){
  const p=state.hintsCustom||NeuroVOR.makePatient({}), active=state.hintsPreset;
  const presets = hintsPresetsRow();
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
      <button class="preset" aria-pressed="${!!state.neuroOverlay}" onclick="toggleNeuroOverlay()" title="${tr("Nałóż tonicznego pacjenta AVS na ekrany diagnostyki pozycyjnej (AVS vs t-EVS wg GRACE-3)","Overlay the tonic AVS patient onto the positional-testing screens (AVS vs t-EVS per GRACE-3)")}">${tr("〰 Nakładka AVS → diagnostyka","〰 AVS overlay → diagnostics")}</button>
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
  // SLAD PRZYCZYNOWY (hints().trace): dla kazdego znaku INFARCT — ktore wejscie przekroczylo ktory prog.
  // Uczacy sie po odslonieciu quizu widzi WYWOD, nie tylko wnioski zdaniowe.
  const SIGN_LBL = { impulseNormal:"Impulse Normal", isolatedVertical:tr("izolowany pion","isolated vertical"),
    fastAlternating:tr("zmienny kierunkowo","direction-changing"), refixationCover:"Test of Skew",
    fixationFail:tr("brak supresji fiksacją","no fixation suppression") };
  const trace = (r.hints.trace||[]).map(t=>{
    const ins=t.inputs.map(i=>`${i.name}: <b>${i.value}</b> ${i.cmp} ${i.threshold}`).join(" · ");
    return `<li class="${t.fired?"fired":""}">${t.fired?"🔴":"⚪"} <b>${SIGN_LBL[t.sign]||t.sign}</b> — ${ins}</li>`;
  }).join("");
  const why = trace ? `<details class="rsub"><summary>${tr("Dlaczego ten werdykt (ślad parametr → próg)","Why this verdict (parameter → threshold trace)")}</summary><ul class="rfind">${trace}</ul></details>` : "";
  const body = hidden
    ? `<button class="preset" onclick="revealHintsQuiz()">${tr("Odsłoń rozpoznanie i parametry","Reveal the diagnosis and parameters")}</button>`
    : `<div class="rloc"><span class="eyebrow">${tr("Lokalizacja","Localization")}</span><b>${r.localization}</b></div>
       <div class="rsigns">${per}${cen||`<span class="rchip">${tr("brak jawnych cech ośrodkowych","no overt central features")}</span>`}</div>${amb}${why}`;
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
    state.mechanism=null;   // D4/V16 (main): flip = wybór FENOTYPU → mechanizm wraca do klasycznego
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
  const fr=$(`[data-nys="${i}"]`); if(fr) startNys(fr, nys, nys._envI);          // D7/V21: obwiednia sumy multi (poza egzaminem undefined)
  const dl=$(`[data-dialnys="${i}"]`); if(dl) startDialNysIn(dl, nys, nys._env01);
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

export { renderObs, syncVizBar, vizControls, pozySekwencja, perspNota, earMark, renderTriage, renderStart, startGo, startHint, startScene, startResume, FLIP_ICO, SIZE_LABELS, SIZE_NOTE, _otoStart, headDial, startDialNysIn, startDialNys, backHeadSVG, startBackHeadTurn, profileMarks, frontFace, figProj, posture, CANAL_PATHS, labyrinth, placeOtolith, eyesSVG, nysOffset, startNys, arrowGlyph, diagCanalSVG, startDiagOtolith, fmt, fmtClock, computeManSim, currentManSim, manStepEnv, stepXiPeak, manPhi, phiToFrac, manFractions, guideNysSeconds, setupGuideAnim, updateGoBtn, toggleTimer, resetTimer, adjust, setStepSeconds, initGuideSlider, flipGuide, sizeFlip, render, renderSetup, renderGuide, renderDiag, hintsNysLabel, hintsVerdictHTML, renderHints, hintsCompPatient, compStage, compRowHTML, compNoteHTML, hintsCompPanel, hintsSupplHTML, refreshHintsComp, neuroNysParams, startNeuroNys, hitSVG, startHIT, hitSaccadeDir, hitPushLabel, hintsHitSpecOf, hitLabel, skewSVG, startSkew, skewLabel, hintsVerdictBlock, nerveLesionSummary, hintsCustomPanel, hintsQuizBanner, hintsReadoutHTML, refreshHintsCustom, scdsRestNote, scdsLabel, flipDiagMech, flipPhases, sideSel, webglAvailable, renderNaukaBib, renderNaukaLekcja, renderLabLista, renderLabEksp, setNullYaw, nullPointCard, tevsProvoke, tevsData, graceCard };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { renderObs, syncVizBar, renderTriage, startGo, startHint, renderStart, headDial, startDialNysIn, startDialNys, backHeadSVG, startBackHeadTurn, profileMarks, frontFace, figProj, posture, labyrinth, placeOtolith, eyesSVG, nysOffset, startNys, arrowGlyph, diagCanalSVG, startDiagOtolith, computeManSim, currentManSim, manStepEnv, stepXiPeak, manPhi, manFractions, guideNysSeconds, setupGuideAnim, updateGoBtn, toggleTimer, resetTimer, adjust, setStepSeconds, initGuideSlider, flipGuide, sizeFlip, render, renderSetup, renderGuide, renderDiag, hintsNysLabel, hintsVerdictHTML, renderHints, hintsCompPatient, compNoteHTML, hintsCompPanel, hintsSupplHTML, refreshHintsComp, neuroNysParams, startNeuroNys, hitSVG, startHIT, hitSaccadeDir, hitPushLabel, hintsHitSpecOf, hitLabel, skewSVG, startSkew, skewLabel, hintsVerdictBlock, nerveLesionSummary, hintsCustomPanel, hintsQuizBanner, hintsReadoutHTML, refreshHintsCustom, scdsRestNote, scdsLabel, flipDiagMech, flipPhases, sideSel, setNullYaw, tevsProvoke });
