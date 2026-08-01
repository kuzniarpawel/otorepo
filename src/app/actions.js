// Akcje UI (onclick=… przez window): nawigacja, wybory, HINTS, zapis/odczyt pacjenta.
import { NeuroVOR } from '../engine/neuro-vor.js';
import { MANEUVERS, CANALS, sizedSeconds, CANAL_OF } from '../pose/maneuvers.js';
import { state } from './state.js';
import { $, releaseWake, beep } from '../runtime/registry.js';
import { render, hintsNysLabel, hintsCompPatient, refreshHintsComp, startNeuroNys, startHIT, hitLabel, nerveLesionSummary, refreshHintsCustom, scdsRestNote, scdsLabel } from '../render/svg-screens.js';
import { setLang, t } from '../i18n.js';
import { markDecision, markSeen, markManeuver, patchManeuverSide, markConsumed, resetSeen, noteNavCleared } from './flow-state.js';

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
  stroke:  { get label(){return t("Udar (ośrodek)","Stroke (central)");},      make:()=>({toneR:72, gainL:1, gainR:1, fixationGain:0, integratorTau:2.2, skewTone:3, otrTorsion:4}) }
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
function pickSide(s){ state.side=s; render(); }
function pickCanal(k){ state.canal=k; const keys=CANALS[k].maneuvers; if(!keys.includes(state.maneuverKey)) state.maneuverKey=keys.length===1?keys[0]:null; render(); }
function pickMan(k){ state.maneuverKey=k; render(); }
/* Wybór próby. Zerowanie dixObs/dixRep/diagCentral dotyczy WYŁĄCZNIE zmiany próby na inną.
   Przy ponownym dotknięciu TEJ SAMEJ próby (kafel aktywnego testu ma tylko aria-pressed, nie jest
   wyłączony, a to jedyna droga powrotu po „Wróć") kasowanie flagi „Ośrodkowy — CPN" byłoby cichym
   cofnięciem decyzji klinicznej przez sam akt nawigacji: aplikacja przestawałaby ostrzegać przed
   repozycją u pacjenta oznaczonego jako podejrzany o przyczynę ośrodkową. [Blok 5] */
function resetTestLocal(k){
  const innaProba = state.testKey!==k;
  state.diagPhaseFace=0;
  if(innaProba){
    // NAJPIERW zapamiętaj, że zaraz zniknie sygnał ostrzegawczy — potem go wyczyść. Odwrotna
    // kolejność patrzyłaby na już wyzerowane pola i flaga nigdy by nie wstała. Ciąg „oznacz CPN →
    // inna próba → z powrotem ta sama próba" przywraca KOMPLET pól odcisku do wartości sprzed
    // decyzji, więc bez tej flagi aplikacja meldowałaby „wniosek zgodny" u pacjenta oznaczonego
    // jako podejrzany o przyczynę ośrodkową.
    noteNavCleared(state);
    state.dixRep=0;
    markDecision(state,"dixObs","post");
    markDecision(state,"diagCentral",false);
    markDecision(state,"testKey",k);
    resetSeen(state);
  } else state.testKey=k;
  markSeen(state,"testSeen");
}
function pickTest(k){ resetTestLocal(k); render(); }
// kliknięcie pozycji = od razu otwórz (bez osobnego przycisku CTA)
// Wejście „Znam kanał i stronę": manewr BEZ interpretacji próby → krok „Interpretacja" dostanie
// status „pominięty z uzasadnieniem", a nie fałszywe „zakończony".
function openMan(k){ state.maneuverKey=k; markManeuver(state,k,false); startPlan(); }
function openTest(k){ resetTestLocal(k); state.screen="diag"; render(); }
function setDixObs(o){ markDecision(state,"dixObs",o); state.dixRep=0; markSeen(state,"obsSeen"); render(); }
// Diagnostyka: przełącznik „obwodowy (BPPV) ↔ ośrodkowy (CPN)" w karcie klasyfikacji Bárány.
function toggleDiagCentral(v){ markDecision(state,"diagCentral",!!v); markSeen(state,"interpretSeen"); render(); }
function setVariant(v){ markDecision(state,"variant",v); markSeen(state,"interpretSeen"); render(); }
// Męczliwość oczopląsu: powtórna prowokacja Dix-Hallpike (rep++) → kanalolitiaza słabnie (fatigueFactor);
// kupulolitiaza nie. Reset zeruje serię. Nie zerujemy przy przełączeniu mechanizmu (flip) — po to, by przy tym
// samym rep pokazać kontrast kanalo↔kupulo.
// Męczliwość to OBSERWACJA (krok „Oczopląs"), nie wniosek — stąd markSeen('obsSeen') i BRAK
// markDecision: dixRep celowo nie wchodzi do odcisku decyzyjnego, bo alarm przy każdym
// powtórzeniu prowokacji zapalałby się dokładnie wtedy, gdy klinicysta pracuje wg protokołu.
function repeatDixProvoke(){ state.dixRep=(state.dixRep||0)+1; markSeen(state,"obsSeen"); render(); }
function resetDixProvoke(){ state.dixRep=0; markSeen(state,"obsSeen"); render(); }
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
// Repozycja: zmiana strony PRZEBUDOWUJE plan i restartuje manewr od kroku 0.
// Odcisk dostaje NOWĄ stronę: po tej akcji plan jest najświeższym elementem stanu, więc pasek
// nie ma prawa krzyczeć „zmieniono stronę" nad planem właśnie przeliczonym. Aktualizujemy samo
// pole strony — podmiana całego odcisku skasowałaby równoczesny, zasłużony dryf.
function setGuideSide(s){ if(state.side===s) return; state.side=s; state.plan=genPlan(state.maneuverKey,s); state.step=0; state.autostart=false; patchManeuverSide(state,s); render(); }
// Diagnostyka: zmiana strony tylko odświeża predykcje (brak bieżącego kroku — fazy widoczne naraz).
// Tu odcisku NIE ruszamy: plan nadal celuje w poprzednie ucho, więc dryf jest zasłużony.
function setDiagSide(s){ if(state.side===s) return; markDecision(state,"side",s); state.dixRep=0; render(); }
function startPlan(){ state.plan=genPlan(state.maneuverKey,state.side); state.step=0; state.autostart=false; state.screen="guide"; render(); }
// Wejście z rekomendacji na ekranie testu: kroki „Próba/Oczopląs/Interpretacja" mają za sobą
// realną pracę, więc odcisk zapisujemy z viaInterpret=true.
function startManeuver(key){
  state.mode="treat"; state.maneuverKey=key; state.canal=CANAL_OF[key];
  markManeuver(state,key,true);
  state.plan=genPlan(key,state.side); state.step=0; state.autostart=false; state.screen="guide"; render();
}
function startDiag(){ state.screen="diag"; markSeen(state,"testSeen"); render(); }
function backToSetup(){ state.running=false; releaseWake(); state.screen="setup"; render(); }
// Dojście do OSTATNIEGO kroku planu = manewr wykonany. Od tej chwili nie jest już wnioskiem
// oczekującym: konwersja postaci albo próba kontrolna po repozycji nie mogą go unieważniać.
function goStep(i,autostart){ const n=state.plan.steps.length; if(i<0||i>=n) return; state.step=i; state.autostart=!!autostart; if(i===n-1) markConsumed(state); render(); }
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
// Przełączenie języka regeneruje plan, żeby instrukcje kroków były w nowym języku (wzorzec jak pickSize).
// ALE regeneracja przywraca fabryczne czasy holdów, a setStepSeconds (svg-screens.js:686) zapisuje w
// żywym planie czas utrzymania pozycji ustawiony RĘCZNIE przez klinicystę — parametr kliniczny, nie
// preferencję UI. Przenosimy go na nowy plan: zmiana języka nie ma prawa zmienić przebiegu manewru.
function setLangUI(lang){
  setLang(lang);
  if(state.plan && state.screen==="guide"){
    const prev=state.plan.steps.map(s=>s.seconds);
    state.plan=genPlan(state.maneuverKey, state.side);
    state.plan.steps.forEach((s,i)=>{ if(prev[i]!=null) s.seconds=prev[i]; });
  }
  syncLangBar(); render();
  // Cały chrom (marka, nawigacja, pasek przebiegu, arkusz ustawień) jest wypełniany przez t()
  // RAZ, na boocie — bez tego wywołania przełączenie języka górnym paskiem zostawiało powłokę
  // po polsku nad angielską treścią, i to przy komplecie zielonych wyroczni (chrom leży poza #app).
  try{ if(typeof window!=="undefined" && typeof window.__otoLangChange==="function") window.__otoLangChange(); }catch(e){}
}


export { setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, HINTS_CANAL_KEYS, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar });
