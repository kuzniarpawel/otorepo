// Akcje UI (onclick=… przez window): nawigacja, wybory, HINTS, zapis/odczyt pacjenta.
import { NeuroVOR } from '../engine/neuro-vor.js';
import { MANEUVERS, CANALS, sizedSeconds, derivedHold, CANAL_OF, DIAG, actTimeline, sessionSim, SIT_SEG, SESSION_REST, readhesion, maneuverTimeline } from '../pose/maneuvers.js';
import { state } from './state.js';
import { $, releaseWake, beep } from '../runtime/registry.js';
import { render, hintsNysLabel, hintsCompPatient, refreshHintsComp, startNeuroNys, startHIT, hitLabel, nerveLesionSummary, refreshHintsCustom, scdsRestNote, scdsLabel } from '../render/svg-screens.js';
import { setLang, t } from '../i18n.js';

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
// N7 (D6): nakladka AVS — AKTYWNY pacjent HINTS zostaje tonicznym tlem ekranow diagnostyki pozycyjnej.
// Fundament taksonomii GRACE-3: oczoplas obecny PRZED manewrem i w kazdej pozycji (AVS) vs
// latencja+paroksyzm+wyczerpywanie (t-EVS/BPPV) — teraz demonstrowalny, bo silniki sie spotykaja.
function toggleNeuroOverlay(){ state.neuroOverlay = state.neuroOverlay ? null : hintsActivePatient(); render(); }

/* ============ „Matematyczny pacjent" — tryb własnych parametrów (etap 7 / UI) ============ */
// Pacjent aktywny: własne parametry (pełny obiekt makePatient) LUB scenariusz+kompensacja.
function hintsActivePatient(){
  return state.hintsCustom ? NeuroVOR.makePatient(state.hintsCustom)
                           : hintsCompPatient(state.hintsScenario||"neuritisR");
}
// Presety scenariuszowe (obok trybu NEURONITIS, który steruje ramką „Wypadnięcie gałęzi nerwu").
// Neuronitis (górny/dolny/cały × L/P × nasilenie) NIE ma osobnych przycisków — konfiguruje się w ramce nerwu.
const HINTS_PRESETS = {
  healthy: { get label(){return t("Zdrowy","Healthy");},              make:()=>({}) },
  bvh:     { get label(){return t("BVH (obustronny)","BVH (bilateral)");},    make:()=>NeuroVOR.bilateralLoss(1) },
  meniereP:{ get label(){return t("Ménière — drażnienie P","Ménière — irritative R");}, make:()=>NeuroVOR.meniere("P",{phase:"irritative"}) },
  meniereL:{ get label(){return t("Ménière — drażnienie L","Ménière — irritative L");}, make:()=>NeuroVOR.meniere("L",{phase:"irritative"}) },
  scdsP:   { get label(){return t("SCDS P","SCDS R");},              make:()=>({dehiscence:"P"}) },
  scdsL:   { label:"SCDS L",              make:()=>({dehiscence:"L"}) },
  // skewTone UJEMNY — OTR poniżej skrzyżowania (Wallenberg) jest IPSIWERSYJNY: przy zmianie P oko P NIŻEJ.
  // Musi zgadzać się z NeuroVOR.SCENARIOS.strokeCentral (ten sam pacjent, dwa wejścia do UI).
  stroke:  { get label(){return t("Udar (ośrodek)","Stroke (central)");},      make:()=>({toneR:72, gainL:1, gainR:1, fixationGain:0, integratorTau:2.2, skewTone:-3, otrTorsion:4}) },
  // s-EVS (GRACE-3): migrena przedsionkowa MIĘDZYNAPADOWO — badanie całkowicie prawidłowe, rozpoznanie
  // z WYWIADU (napadowość). Lekcja: hints().applicable=false + verdictNote zamiast werdyktu triady.
  vmi:     { get label(){return t("Migrena przeds. (międzynapadowo)","Vestibular migraine (interictal)");}, make:()=>({}) },
  // ETAP N5: nowe osie — JEDNO źródło parametrów: NeuroVOR.SCENARIOS (bez duplikacji literałów jak w stroke).
  laby:    { get label(){return t("Labyrinthitis P (+niedosłuch)","Labyrinthitis R (+hearing loss)");}, make:()=>Object.assign({},NeuroVOR.SCENARIOS.labyrinthitisR.params) },
  aica:    { get label(){return t("Zawał AICA P (pułapka HIT)","AICA infarct R (HIT trap)");},          make:()=>Object.assign({},NeuroVOR.SCENARIOS.aicaR.params) },
  downbeat:{ get label(){return t("Zespół downbeat (CPN)","Downbeat syndrome (CPN)");},                 make:()=>Object.assign({},NeuroVOR.SCENARIOS.downbeat.params) },
  rd:      { get label(){return t("Zawroty rezydualne po CRM","Residual dizziness post-CRM");},         make:()=>Object.assign({},NeuroVOR.SCENARIOS.residual.params) }
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
function pickSide(s){ if(state.session && state.side!==s) state.session=freshSession(state.session.canal, s, state.session.size);   // strona = tożsamość złogu (D1)
  state.side=s; render(); }
function pickCanal(k){ state.canal=k; const keys=CANALS[k].maneuvers; if(!keys.includes(state.maneuverKey)) state.maneuverKey=keys.length===1?keys[0]:null; render(); }
function pickMan(k){ state.maneuverKey=k; render(); }
function pickTest(k){ state.testKey=k; state.dixObs="post"; state.dixRep=0; state.diagCentral=false; state.diagPhaseFace=0;
  if(state.session && DIAG[k].canal!==state.session.canal) state.session=freshSession(DIAG[k].canal, state.side, state.size);   // inny kanał = nowy złóg; ten sam (roll↔bowlean, dix↔manewry PC) DZIELI sesję (R10)
  render(); }
// kliknięcie pozycji = od razu otwórz (bez osobnego przycisku CTA)
function openMan(k){ state.maneuverKey=k; startPlan(); }
function openTest(k){ state.testKey=k; state.dixObs="post"; state.dixRep=0; state.diagCentral=false; state.diagPhaseFace=0;
  if(state.session && DIAG[k].canal!==state.session.canal) state.session=freshSession(DIAG[k].canal, state.side, state.size);
  state.screen="diag"; render(); }
function setDixObs(o){ state.dixObs=o; state.dixRep=0; render(); }
// Diagnostyka: przełącznik „obwodowy (BPPV) ↔ ośrodkowy (CPN)" w karcie klasyfikacji Bárány.
function toggleDiagCentral(v){ state.diagCentral=!!v; render(); }
function setVariant(v){ state.variant=v; render(); }
// Bow & Lean: wybór scenariusza historii pozycyjnej (klucz BLT_HISTORY; ocena II V5 — wododział R8/R10)
function setBltScenario(k){ state.bltScenario=k; render(); }
// Męczliwość oczopląsu: powtórna prowokacja Dix-Hallpike (rep++) → kanalolitiaza słabnie (fatigueFactor);
// kupulolitiaza nie. Reset zeruje serię. Nie zerujemy przy przełączeniu mechanizmu (flip) — po to, by przy tym
// samym rep pokazać kontrast kanalo↔kupulo.
// W SESJI (D1/V10) powtórzenie = AKT: łańcuch fizyki (pozycja+wiązanie+ogon ξ) × dyspersja (rep) z JEDNEGO
// naciśnięcia — bez podwójnego liczenia (dyspersja siedzi w ξ symulacji; render nie mnoży przez fatigueFactor).
function repeatDixProvoke(){ if(state.session){ sessionProvoke(); return; }
  state.dixRep=(state.dixRep||0)+1; render(); }
// W SESJI reset serii = nowy złóg (rep jest częścią stanu fizycznego — zerowanie samego licznika przy
// zachowanym położeniu złogu byłoby niefizyczne); poza sesją — jak dotąd, sam licznik.
function resetDixProvoke(){ if(state.session){ state.dixRep=0; resetSession(); return; }
  state.dixRep=0; render(); }

/* ============ Sesja ciągła (ocena II, V10/D1 — pamięć pozycji / domknięcie R10) ============
   state.session = stan JEDNEGO złogu (canal/side/size to jego tożsamość — zmiana każdej z nich zaczyna
   nowy złóg). phi=null → spoczynek naturalny (restPhi silnika); exited → kanał wyczyszczony (kontrolny
   test niemy). Zegar aktowy: tSession = suma czasów SYMULOWANYCH timeline'ów (zero wall-clock — wyrocznie
   deterministyczne). Kupulolitiaza sesji nie czyta (brak wolnej cząstki; wynik nie zależy od historii). */
function freshSession(canal, side, size){
  return {canal, side, size, phi:null, xi:0, bondFrac:1, stuck:true, exited:false, inCrus:false,
          rep:0, acts:[], tSession:0};
}
function toggleSessionMode(on){
  const c = state.testKey ? DIAG[state.testKey].canal : (CANAL_OF[state.maneuverKey]||"posterior");
  state.session = on ? freshSession(c, state.side, state.size) : null;
  syncSessionBar(); render();
}
function resetSession(){ const S=state.session; if(!S) return;
  state.session=freshSession(S.canal, S.side, S.size); if(state.testKey==="dix") state.dixRep=0; render(); }
// AKT: jedna nić symulacji (prowokacja/manewr + powrót do siadu + spoczynek) → out.final → stan sesji.
// Transport w spoczynku liczy SILNIK (w timeline); odrost wiązania za ten sam spoczynek dokłada
// readhesion() post-hoc (silnik świadomie nie ma re-adhezji w pętli — patrz maneuvers.js/TAU_BOND).
function commitAct(kind, timeline, restSecs){
  const S=state.session; if(!S) return;
  const dur=timeline.reduce((a,g)=>a+(g.tTrans||0)+(g.tHold||0),0);
  if(!S.exited){
    const f=sessionSim(S, timeline).final;
    Object.assign(S, {phi:f.exited?null:f.phi, xi:f.exited?0:f.xi,
      bondFrac:readhesion(f.bondFrac, restSecs||0), stuck:f.stuck, exited:f.exited, inCrus:f.inCrus});
  }
  S.acts.push({kind, t:Math.round(dur)}); S.tSession+=dur;   // render() u WYWOŁUJĄCEGO — sessionProvoke inkrementuje rep PO commicie, render musi widzieć stan końcowy
}
// prowokacja bieżącego testu jako akt; rep++ PO symulacji (pierwsza prowokacja = pełna odpowiedź).
// Bowlean poza aktami sesji — karta B&L ma własne scenariusze historii (V5); integracja = kandydat V11.
function sessionProvoke(){
  const S=state.session; if(!S || !state.testKey || state.testKey==="bowlean") return;
  commitAct(state.testKey, actTimeline(state.testKey, S.side), SESSION_REST);
  S.rep=(S.rep||0)+1; if(state.testKey==="dix") state.dixRep=S.rep;
  render();
}
// manewr zaliczony do sesji JAWNYM przyciskiem (render nie może commitować) + końcowy siad.
function sessionManeuver(){
  const S=state.session; if(!S || !state.plan || CANAL_OF[state.maneuverKey]!==S.canal) return;
  commitAct(state.maneuverKey, [...maneuverTimeline(state.plan, S.size), SIT_SEG], SESSION_REST);
  render();
}
// Przerwa 10 min w siadzie: transport złogu liczy silnik (600 s), wiązanie odrasta (readhesion → latencja
// wraca częściowo), rep BEZ zmian (re-agregacja kłębka w siadzie niezmierzona — luka; Imai mierzy amplitudę).
function sessionRest(){
  const S=state.session; if(!S) return;
  commitAct("rest", [{q:[1,0,0,0], tTrans:0.8, tHold:600, pivot:"body"}], 600);
  render();
}
function syncSessionBar(){
  const bar=$("#sessionbar"); if(!bar) return;
  const b=bar.querySelector("button[data-session]"); if(!b) return;
  b.setAttribute("aria-pressed", String(!!state.session));
  b.textContent=t("Sesja ciągła","Continuous session");
}
// Generuje plan manewru i nakłada holdy zależne od rozmiaru złogu (małe = dłuższe utrzymanie pozycji).
function genPlan(key, side){
  const plan=MANEUVERS[key].gen(side);
  // TIMER KROKU = max(zalecenie kliniczne, hold przy którym FIZYKA czyści) — ocena II, A7/V8.
  // Dotąd karta uczyła sizedSeconds, a animacja/walidacja grały derivedHold: Bascule medium uczyła
  // 30 s, choć model czyści dopiero od 45 s — użytkownik widział pełną liberację przy holdzie,
  // którego fizyka nie potwierdza (fałszywy sukces). max() podnosi WYŁĄCZNIE timery poniżej holdu
  // fizyki (dziś: tylko Bascule); zalecenia dłuższe (Semont 90 s) zostają. derivedHold null
  // (Gufoni apo — konwersja) → samo zalecenie.
  const dh=derivedHold(plan, state.size);                  // od V9: {h, u} (u = hold kroków bez timera, niewidoczny w timerze)
  for(const st of plan.steps){ if(st.seconds!=null) st.seconds=Math.max(sizedSeconds(st.seconds, state.size), dh?dh.h:0); }
  return plan;
}
// Zmiana rozmiaru złogu: przebuduj plan (nowe holdy), unieważnij cache dynamiki, przelicz od bieżącego kroku.
function pickSize(s){ if(state.size===s) return; state.size=s;
  if(state.session) state.session=freshSession(state.session.canal, state.session.side, s);   // bond/dynamika skalują się r — łańcuch między size to footgun (D1)
  if(state.plan && state.screen==="guide"){ state.plan=genPlan(state.maneuverKey, state.side); }
  render(); }
// Repozycja: zmiana strony PRZEBUDOWUJE plan i restartuje manewr od kroku 0
function setGuideSide(s){ if(state.side===s) return; state.side=s;
  if(state.session) state.session=freshSession(state.session.canal, s, state.session.size);
  state.plan=genPlan(state.maneuverKey,s); state.step=0; state.autostart=false; render(); }
// Diagnostyka: zmiana strony tylko odświeża predykcje (brak bieżącego kroku — fazy widoczne naraz)
function setDiagSide(s){ if(state.side===s) return; state.side=s; state.dixRep=0;
  if(state.session) state.session=freshSession(state.session.canal, s, state.session.size);
  render(); }
function startPlan(){ state.plan=genPlan(state.maneuverKey,state.side); state.step=0; state.autostart=false; state.screen="guide"; render(); }
function startManeuver(key){
  state.mode="treat"; state.maneuverKey=key; state.canal=CANAL_OF[key];
  if(state.session && CANAL_OF[key]!==state.session.canal) state.session=freshSession(CANAL_OF[key], state.side, state.size);
  state.plan=genPlan(key,state.side); state.step=0; state.autostart=false; state.screen="guide"; render();
}
function startDiag(){ state.screen="diag"; render(); }
function backToSetup(){ state.running=false; releaseWake(); state.screen="setup"; render(); }
function goStep(i,autostart){ const n=state.plan.steps.length; if(i<0||i>=n) return; state.step=i; state.autostart=!!autostart; render(); }
function toggleAuto(el){ state.autoAdvance=!state.autoAdvance; el.setAttribute("aria-checked",state.autoAdvance); }
function toggleSound(el){ state.sound=!state.sound; el.setAttribute("aria-checked",state.sound); if(state.sound)beep(); }
// Etap 3: przełącznik karty „Ułożenie" SVG ↔ Three.js (WebGL). Pełny render — montaż canvasa robi hook w renderGuide/renderDiag.
function setView3d(v){ state.view3d=!!v; render(); }

/* i18n — przełącznik języka (P3). Pasek #langbar żyje w statycznej powłoce index.html (POZA #app),
   więc zmiana języka NIE rusza złotego snapshotu: setLang aktualizuje stan+localStorage+<html lang>,
   syncLangBar spina aria-pressed przycisków, render() przerysowuje #app w nowym języku. */
function syncLangBar(){
  const bar=$("#langbar"); if(!bar) return;
  bar.querySelectorAll("button[data-lang]").forEach(b=>
    b.setAttribute("aria-pressed", String(b.getAttribute("data-lang")===state.lang)));
}
function setLangUI(lang){ setLang(lang); if(state.plan && state.screen==="guide"){ state.plan=genPlan(state.maneuverKey, state.side); } syncLangBar(); syncSessionBar(); render(); }   // regeneruj plan → instrukcje kroków w nowym jezyku (wzorzec jak pickSize); etykieta sesji też przez t()


export { toggleNeuroOverlay, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, HINTS_CANAL_KEYS, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, setBltScenario, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar, freshSession, toggleSessionMode, resetSession, sessionProvoke, sessionManeuver, sessionRest, syncSessionBar };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { toggleNeuroOverlay, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, setBltScenario, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar, toggleSessionMode, resetSession, sessionProvoke, sessionManeuver, sessionRest, syncSessionBar });
