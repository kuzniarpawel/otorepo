// Akcje UI (onclick=… przez window): nawigacja, wybory, HINTS, zapis/odczyt pacjenta.
import { NeuroVOR } from '../engine/neuro-vor.js';
import { MANEUVERS, CANALS, sizedSeconds, CANAL_OF } from '../pose/maneuvers.js';
import { state } from './state.js';
import { $, releaseWake, beep, vizClock } from '../runtime/registry.js';
import { render, syncVizBar, hintsNysLabel, hintsCompPatient, refreshHintsComp, startNeuroNys, startHIT, hitLabel, nerveLesionSummary, refreshHintsCustom, scdsRestNote, scdsLabel } from '../render/svg-screens.js';
import { setLang, t } from '../i18n.js';
import { markDecision, markSeen, markManeuver, patchManeuverSide, markConsumed, resetSeen, noteNavCleared, syncTriage } from './flow-state.js';
import { toggleFlaga, sciezkaDozwolona } from './triage-model.js';
import { setObsWystapil as _setObsWystapil, setObsPole as _setObsPole, oznaczObsPole as _oznaczObsPole,
         setObsPowod as _setObsPowod, setObsGrupa as _setObsGrupa, clearObs as _clearObs,
         przyjmijObserwacje } from './obs-state.js';
import { interpretuj } from './interp-model.js';
import { interpDeps } from './interp-deps.js';
import { wykonanySekwencyjnie, przeniesCzasy } from './man-model.js';

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
/* ============ JEDNA droga budowy planu manewru (Blok 10) ============
   Dotąd plan powstawał w czterech miejscach i KAŻDE czytało `state.maneuverKey` w chwili
   przebudowy. To jest źródło cichej podmiany manewru, zmierzonej na realnym grafie:
     startManeuver('lempert') → plan „Lempert" (6 kroków), odcisk.key='lempert'
     pickCanal('anterior')    → maneuverKey='yacovino' (kanał ma jeden manewr, więc dotknięcie
                                KAFELKA KANAŁU wybierało manewr za użytkownika), plan NADAL Lempert
     setGuideSide('L')        → genPlan(state.maneuverKey) → plan staje się YACOVINO (4 kroki),
                                a `flow.maneuver.key` dalej mówi 'lempert'; dryf pusty, pasek zielony
   Klinicysta wykonywał Yacovino, a zapis przebiegu meldował Lemperta — po JEDNYM dotknięciu
   pigułki strony. Klucz manewru wchodzi więc ARGUMENTEM, a plan nosi go w polu `key`, żeby
   `spojnoscPlanu` (man-model.js) miała co porównywać.

   `key` stemplujemy TUTAJ, a nie w `genPlan`: golden `engine.plans` serializuje wynik genPlan,
   więc dołożenie pola w samym generatorze byłoby zmianą warstwy, która ma zostać bit w bit. */
function przebudujPlan(key, side, opcje){
  const o = opcje || {};
  const nowy = genPlan(key, side);
  nowy.key = key;
  // Ręcznie ustawiony czas utrzymania pozycji to parametr KLINICZNY, nie preferencja interfejsu
  // (tak nazywa go komentarz przy setLangUI — jedynej akcji, która go dotąd chroniła).
  // `setGuideSide` i `pickSize` gubiły go bez słowa; przenosimy po TOŻSAMOŚCI kroku, nie po
  // indeksie, bo przy podmianie manewru indeksy wskazują zupełnie inne pozycje ciała.
  if(o.zachowajCzasy !== false && state.plan) przeniesCzasy(state.plan, nowy);
  return nowy;
}
function pickSide(s){ state.side=s; render(); }
/* Wybór kanału NIE wybiera manewru za użytkownika. Dotąd kanał o jednym manewrze (przedni →
   Yacovino) uzbrajał go samym dotknięciem kafelka kanału, przez co `state.maneuverKey` i
   `state.plan` opisywały dwa różne manewry. Plan porzuconego kanału znika razem z nim — inaczej
   krok „Manewr" prowadziłby do przewodnika rysującego manewr kanału, który przed chwilą odrzucono
   (`wymaga: plan && maneuverKey` było spełnione, bo oba pola były niepuste — tylko niezgodne). */
function pickCanal(k){
  state.canal=k;
  const keys=CANALS[k].maneuvers;
  if(!keys.includes(state.maneuverKey)) state.maneuverKey=null;
  if(state.plan && state.plan.canal!==k){
    state.plan=null; state.step=0; state.running=false; releaseWake();
    // Skasowanie planu MUSI zabrać ze sobą ekran przewodnika. renderGuide czyta
    // `state.plan.steps[state.step]` PRZED przypisaniem innerHTML, więc przy pustym planie leci
    // TypeError, ekran nie drgnie, a każdy kolejny render() rzuca to samo — aplikacja zablokowana
    // do przeładowania, i to bez śladu widocznego dla użytkownika. Złapane przez man:dom przy
    // pierwszym uruchomieniu.
    if(state.screen==="guide") state.screen="setup";
  }
  render();
}
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
    // null, NIE „post" (Blok 8). Wybór próby nie jest obserwacją: wpisanie tu wartości domyślnej
    // znaczyło, że aplikacja odpowiada za użytkownika, zanim ten cokolwiek zobaczył — i właśnie
    // dlatego pusty opis dawał do niedawna pełne rozpoznanie z gotowym manewrem.
    markDecision(state,"dixObs",null);
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
/* Blok 9: przewrócenie karty mechanizmu na ekranie próby idzie TĄ SAMĄ drogą, więc musi
   oznaczyć źródło jako RĘCZNE. Bez tego ekran interpretacji dalej twierdziłby „wyprowadzony
   z opisu obserwacji" nad mechanizmem, który użytkownik przed chwilą przestawił sam. */
function setVariant(v){ markDecision(state,"variant",v); state.variantZrodlo="nadpisany"; markSeen(state,"interpretSeen"); render(); }
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
/* Zmiana rozmiaru złogu: przebuduj plan (nowe holdy), unieważnij cache dynamiki.
   `zachowajCzasy:false` JEST TU ŚWIADOME i jest jedynym takim miejscem: rozmiar złogu zmienia
   ZALECANY czas utrzymania pozycji (małe/wolno osiadające → dłużej, sizedSeconds), więc trzymanie
   poprzedniej wartości ręcznej znaczyłoby, że aplikacja przyjmuje wybór rozmiaru i zaraz go
   ignoruje. Plan przebudowujemy dla manewru, do którego NALEŻY (plan.key), nie dla tego, który
   akurat stoi w state.maneuverKey. */
function pickSize(s){ if(state.size===s) return; state.size=s;
  if(state.plan && state.screen==="guide"){ state.plan=przebudujPlan(state.plan.key||state.maneuverKey, state.plan.side, {zachowajCzasy:false}); }
  render(); }
/* Repozycja: zmiana strony PRZEBUDOWUJE plan i restartuje manewr od kroku 0.
   Odcisk dostaje NOWĄ stronę: po tej akcji plan jest najświeższym elementem stanu, więc pasek
   nie ma prawa krzyczeć „zmieniono stronę" nad planem właśnie przeliczonym. Aktualizujemy samo
   pole strony — podmiana całego odcisku skasowałaby równoczesny, zasłużony dryf.

   STRAŻ PATRZY NA PLAN, NIE NA `state.side`. Poprzednia wersja (`if(state.side===s) return`)
   robiła z przycisku strony MARTWY przycisk dokładnie wtedy, gdy był potrzebny: po rozjeździe
   `state.side='L'` / `plan.side='P'` pigułka pokazywała P (czyta plan), a kliknięcie L nie robiło
   nic, bo `state.side` już było 'L'. Manewru nie dało się przełączyć na drugie ucho. */
function setGuideSide(s){
  if(!state.plan) return;
  if(state.side===s && state.plan.side===s) return;
  const key = state.plan.key || state.maneuverKey;
  state.side=s;
  state.plan=przebudujPlan(key, s);
  state.maneuverKey=key;                     // pigułka strony nie ma prawa podmienić manewru
  state.step=0; state.autostart=false; patchManeuverSide(state,s); render();
}
// Diagnostyka: zmiana strony tylko odświeża predykcje (brak bieżącego kroku — fazy widoczne naraz).
// Tu odcisku NIE ruszamy: plan nadal celuje w poprzednie ucho, więc dryf jest zasłużony.
function setDiagSide(s){ if(state.side===s) return; markDecision(state,"side",s); state.dixRep=0; render(); }
function startPlan(){ state.plan=przebudujPlan(state.maneuverKey,state.side,{zachowajCzasy:false}); state.step=0; state.autostart=false; state.screen="guide"; render(); }
/* Wejście z rekomendacji na ekranie testu: kroki „Próba/Oczopląs/Interpretacja" mają za sobą
   realną pracę, więc odcisk zapisujemy z viaInterpret=true.

   STRONA WCHODZI ARGUMENTEM. Przy downbeacie w Dix-Hallpike'u karta leczenia nazywa ucho
   PRZECIWNE (`effSide = otherSide(A)`, bo kanał przedni leży w drugim uchu), a `startManeuver`
   budował plan ze `state.side` — czyli dla ucha, które karta właśnie wykluczyła. Zmierzone
   trzema gestami: karta pisze „Leczenie dla strony lewa", plan powstaje dla P. Domyślnie
   zostaje `state.side`, więc pozostali wołający nic nie tracą. */
function startManeuver(key, side){
  const s = side || state.side;
  state.mode="treat"; state.maneuverKey=key; state.canal=CANAL_OF[key]; state.side=s;
  markManeuver(state,key,true);
  state.plan=przebudujPlan(key,s,{zachowajCzasy:false}); state.step=0; state.autostart=false; state.screen="guide"; render();
}

/* ============ Sterowanie symulacją (Blok 7) ============
   ŻADNA z tych akcji NIE woła render(). Przerysowanie przechodzi przez cancelAnims() i odtwarza
   wszystkie pętle od zera, więc „pauza" najpierw restartowałaby animację, a dopiero potem ją
   zatrzymywała — nie dałoby się zamrozić oglądanej klatki, czyli kryterium odbioru nr 2
   („animację można zatrzymać w KAŻDYM momencie") byłoby spełnione tylko pozornie.
   Stan zegara odbijamy w miejscu przez syncVizBar (wzorzec toggleAuto/toggleSound). */
function toggleVizPause(){ vizClock.toggle(); syncVizBar(); }
function setVizSpeed(v){ vizClock.setSpeed(v); syncVizBar(); }
// Krok działa WYŁĄCZNIE przy zatrzymanym obrazie (pilnuje tego sam zegar) — przesuwanie
// biegnącej animacji dałoby skok nieodróżnialny od zacięcia.
function vizStepFwd(){ if(!vizClock.isPaused()) return; vizClock.step(); syncVizBar(); }
// Reset dotyczy CZASU obrazu, nie preferencji: wybrane 0,5× i pauza zostają. Wymaga przerysowania,
// bo pętle muszą wystartować od nowa z wyzerowanym `start`.
function resetViz(){ vizClock.reset(); render(); }


/* ============ Krok „Oczopląs" — opis ZAOBSERWOWANEGO wyniku (Blok 8) ============
   Wszystkie zapisy idą przez obs-state.js. ŻADEN z nich nie rusza `dixObs`, `variant`, `side`
   ani `plan`: opisanie kierunku nie ma prawa po cichu podmienić kanału i zalecanego manewru.
   Jedynym mostem do interpretacji jest `przyjmijObs` — jawny gest, własny przycisk. */
/* WYPROWADZENIE JEST WAŻNE TYLKO DLA OPISU, Z KTÓREGO POWSTAŁO (Blok 9, poprawka P2).
   Każda zmiana rekordu zdejmuje etykietę „wyprowadzony": mechanizm ZOSTAJE (animacja musi coś
   rysować), ale przestaje twierdzić, że wynika z obserwacji, dopóki użytkownik nie przyjmie go
   ponownie. Ręcznego nadpisania NIE ruszamy — to była świadoma decyzja i nie znika przez to,
   że ktoś dopisał cechę. */
function zdejmijWyprowadzenie(){ if(state.variantZrodlo==="wyprowadzony") state.variantZrodlo=null; }
function goObs(){ state.screen="obs"; state.obsGrupa=null; render(); }
function wrocDoProby(){ state.screen="diag"; render(); }
function setObsWystapil(proba,w){ _setObsWystapil(state,proba,w); zdejmijWyprowadzenie(); render(); }
function setObsPole(proba,klucz,wartosc){
  if(klucz==="wystapil"){ _setObsWystapil(state,proba,wartosc); zdejmijWyprowadzenie(); render(); return; }
  _setObsPole(state,proba,klucz,wartosc); zdejmijWyprowadzenie(); render();
}
function oznaczObsPole(proba,klucz){ _oznaczObsPole(state,proba,klucz); zdejmijWyprowadzenie(); render(); }
function setObsPowod(proba,p){ _setObsPowod(state,proba,p); render(); }
function setObsGrupa(os){ _setObsGrupa(state,os); render(); }
function togglePorownanie(){ state.obsPorownanie=!state.obsPorownanie; render(); }
function wyczyscObs(){ _clearObs(state, state.testKey); zdejmijWyprowadzenie(); render(); }
// Przyjęcie opisu jako podstawy interpretacji ZMIENIA `dixObs` — i jest jedynym miejscem,
// w którym to się dzieje. Po przyjęciu wracamy na ekran próby, bo to tam widać skutek.
function przyjmijObs(){ if(przyjmijObserwacje(state, state.testKey)){ state.screen="diag"; } render(); }

/* ============ Krok „Interpretacja" — WŁASNY EKRAN (Blok 9) ============
   `state.variant` zachowuje typ i wszystkie dzisiejsze role (animacja, chipy cech, klasyfikacja
   Bárány, `recommend`), więc nic istniejącego się nie łamie. Dokłada się do niego wyłącznie
   ŹRÓDŁO: `wyprowadzony` / `nadpisany` / null. Bez tego pola trzy różne sytuacje wyglądały
   identycznie, a najgroźniejsza z nich — „mechanizm jest po prostu ostatnią wartością, bo
   animacja musi coś rysować" — udawała wniosek. */
function goInterpret(){ state.screen="interpret"; markSeen(state,"interpretSeen"); render(); }

/* Wyprowadzenie idzie ZA JAWNYM GESTEM, jak `przyjmijObs`. Zapisywanie przy każdej edycji pola
   formularza znaczyłoby, że opisanie kierunku po cichu podmienia zalecany manewr — dokładnie to,
   czego Blok 8 zabronił. Warunek liczony JESZCZE RAZ tutaj, a nie przekazany z ekranu: przycisk
   może być nieaktualny o jeden render, stan nie ma prawa. */
function przyjmijMechanizm(){
  const rek = (state.obs||{})[state.testKey] || null;
  if(!rek) return;
  const w = interpretuj(rek, state.testKey, interpDeps(state));
  if(w.zgodnosc==="brak" || !w.mechanizmWyprowadzalny) return;
  markDecision(state,"variant",w.mechanizm);
  state.variantZrodlo="wyprowadzony";
  markSeen(state,"interpretSeen");
  render();
}
function nadpiszMechanizm(v){
  markDecision(state,"variant",v);
  state.variantZrodlo="nadpisany";
  markSeen(state,"interpretSeen");
  render();
}
function wrocDoWyprowadzonego(){ state.variantZrodlo=null; przyjmijMechanizm(); }
// Przejscie do proby WSKAZANEJ przez model. Prowadzi na ekran proby, a nie od razu do opisu:
// probe trzeba najpierw WYKONAC, a dopiero potem opisac, co bylo widac.
function idzDoProby(k){ openTest(k); }

/* ============ Kwalifikacja wstępna („Wywiad", Blok 6) ============
   Kwestionariusz WYBIERA ŚCIEŻKĘ BADANIA, nie stawia rozpoznania — dlatego `triageGo` prowadzi
   do trybu, a nie do gotowego wyniku, i istnieje wyłącznie dla ścieżki, którą model rzeczywiście
   dopuścił (przy czerwonej fladze sciezka===null, więc nie ma czego wołać). */
function openTriage(){ state.screen="triage"; state.mode="diag"; syncTriage(state); render(); }
function setTriage(qid, wart){
  state.triage = { ...state.triage, [qid]: wart };
  // Zmiana wcześniejszej odpowiedzi unieważnia późniejsze: przy przestawieniu przebiegu z
  // „ciągłe" na „napadowe" odpowiedź o oczopląsie przestaje być zadawana, a zostawiona w stanie
  // wracałaby po cichu przy powrocie — użytkownik nigdy by jej ponownie nie potwierdził.
  if(qid==="przebieg"){ delete state.triage.wyzwalacz; delete state.triage.oczoplas; }
  state.triageStep=null;
  syncTriage(state); render();
}
function toggleTriageFlaga(v){
  state.triage = { ...state.triage, flagi: toggleFlaga(state.triage.flagi, v) };
  syncTriage(state); render();
}
function goTriageStep(qid){ state.triageStep=qid; render(); }
function resetTriage(){ state.triage={}; state.triageStep=null; syncTriage(state); render(); }
// Wejście w ścieżkę wskazaną przez kwalifikację. Bramka `sciezkaDozwolona` jest tu CELOWO
// powtórzona mimo że przycisk i tak powstaje tylko dla dozwolonej ścieżki: przycisk to widok,
// a to jest kontrakt — gdyby kiedyś powstał drugi sposób wywołania, nadal nie przepuści HINTS
// przy napadach pozycyjnych.
function triageGo(tryb){
  if(!sciezkaDozwolona(state.triage, tryb)) return;
  state.mode=tryb; state.screen="setup"; render();
}
function startDiag(){ state.screen="diag"; markSeen(state,"testSeen"); render(); }
function backToSetup(){ state.running=false; releaseWake(); state.screen="setup"; render(); }
/* Dojście do OSTATNIEGO kroku planu = manewr wykonany. Od tej chwili nie jest już wnioskiem
   oczekującym: konwersja postaci albo próba kontrolna po repozycji nie mogą go unieważniać.

   ALE „wykonany" to nie „obejrzany". `markConsumed` wycisza WSZYSTKIE alarmy manewru na stałe
   (`maneuverDrift` zwraca wtedy []), a Blok 10 daje oś etapów z podpisami — czyli jedno dotknięcie
   napisu „Powrót do siadu", najzwyklejszy gest „zobaczmy, co mnie czeka". Zmierzone: pojedyncze
   `goStep(4)` z kroku 0 ustawiało consumed, po czym zmiana mechanizmu, przełączenie na CPN i
   skasowanie opisu obserwacji nie zapalały już NICZEGO do końca sesji.
   Warunek jest teraz SEKWENCYJNY (man-model.wykonanySekwencyjnie); skok po osi go nie spełnia,
   a kto naprawdę skończył serię, ma jawny przycisk „Zakończ serię". */
function goStep(i,autostart){
  const n=state.plan.steps.length; if(i<0||i>=n) return;
  const zKroku=state.step;
  state.step=i; state.autostart=!!autostart;
  if(wykonanySekwencyjnie(zKroku,i,n)) markConsumed(state);
  render();
}
// Jawne zakończenie serii (przycisk ✓ na ostatnim etapie) — to jest DEKLARACJA wykonania,
// więc tu `markConsumed` idzie bezwarunkowo.
function zakonczSerie(){ markConsumed(state); backToSetup(); }
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
// ALE regeneracja przywraca fabryczne czasy holdów, a setStepSeconds (svg-screens.js) zapisuje w
// żywym planie czas utrzymania pozycji ustawiony RĘCZNIE przez klinicystę — parametr kliniczny, nie
// preferencję UI. Przenosimy go na nowy plan: zmiana języka nie ma prawa zmienić przebiegu manewru.
// Przenoszenie idzie przez `przebudujPlan`, czyli po TOŻSAMOŚCI kroku: kopiowanie po indeksie
// przepisywało 120 s z kroku 2 jednego manewru na krok 2 drugiego, gdyby plan i `state.maneuverKey`
// zdążyły się rozjechać.
function setLangUI(lang){
  setLang(lang);
  if(state.plan && state.screen==="guide"){
    state.plan=przebudujPlan(state.plan.key||state.maneuverKey, state.plan.side);
  }
  syncLangBar(); render();
  // Cały chrom (marka, nawigacja, pasek przebiegu, arkusz ustawień) jest wypełniany przez t()
  // RAZ, na boocie — bez tego wywołania przełączenie języka górnym paskiem zostawiało powłokę
  // po polsku nad angielską treścią, i to przy komplecie zielonych wyroczni (chrom leży poza #app).
  try{ if(typeof window!=="undefined" && typeof window.__otoLangChange==="function") window.__otoLangChange(); }catch(e){}
}


export { zakonczSerie, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, togglePorownanie, goObs, wrocDoProby, setObsWystapil, setObsPole, oznaczObsPole, setObsPowod, setObsGrupa, wyczyscObs, przyjmijObs, toggleVizPause, setVizSpeed, vizStepFwd, resetViz, openTriage, setTriage, toggleTriageFlaga, goTriageStep, resetTriage, triageGo, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, HINTS_CANAL_KEYS, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { zakonczSerie, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, togglePorownanie, goObs, wrocDoProby, setObsWystapil, setObsPole, oznaczObsPole, setObsPowod, setObsGrupa, wyczyscObs, przyjmijObs, toggleVizPause, setVizSpeed, vizStepFwd, resetViz, openTriage, setTriage, toggleTriageFlaga, goTriageStep, resetTriage, triageGo, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar });
