// Akcje UI (onclick=… przez window): nawigacja, wybory, HINTS, zapis/odczyt pacjenta.
import { NeuroVOR } from '../engine/neuro-vor.js';
import { MANEUVERS, CANALS, sizedSeconds, CANAL_OF, DIAG, ACT_STEPS, actTimeline, sessionSim } from '../pose/maneuvers.js';
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
import { wykonanySekwencyjnie, przeniesCzasy, etapyManewru, czasUtrzymania, trybDoUstapieniaDostepny } from './man-model.js';
import { manDeps } from './man-deps.js';
import { celAkcji } from './followup-model.js';
import { followupDeps } from './followup-deps.js';
import { zapiszWynik, ustawPowodKontroli as _ustawPowodKontroli, zakonczSesjeStan, syncKontrola } from './followup-state.js';
import { ustawTolerancje } from './followup-state.js';
import { pakietEksportu } from './opis-model.js';
import { opisDeps } from './opis-deps.js';
import { ustawSekcje, ustawEdycje, wyczyscEdycje, wczytajSesjeStan, zapiszSesjeStan, przywrocSesjeStan, usunSesjeStan, usunWszystkieStan } from './opis-state.js';
import { tekstOpisu, tekstOpisuDoKopiowania, toggleTimer } from '../render/svg-screens.js';
import { skrot, wdrozenieAutomatyczne } from './pwa-model.js';
import { ustawCzekajaca, schowajPasek, ustawWdrazana, cofnijWdrazanie, zerujAktualizacje as zerujAktualizacjeStan } from './pwa-state.js';
import { wdrozAktualizacje } from '../runtime/pwa.js';
import { wolnoBadac, nastepnyElement, ELEMENT_IDS } from './hints-model.js';
import { przypadek as przypadekNauki } from './nauka-model.js';
import { naukaDeps } from './nauka-deps.js';
import { zacznijPrzypadek, zamknijPrzypadek, ustawOdpowiedz, uzyjWskazowki, ustawEtap, ustawFiltr, zapiszPostepDoStanu, wyczyscPostepStanu } from './nauka-state.js';
import { wczytajPostep, zapiszPostep, wyczyscPostep } from './nauka-store.js';
import { labDeps } from './lab-deps.js';
import { otworzEksperyment, zamknijEksperyment, ustawStanowisko, przelaczPorownanie, ustawParametr, resetDoReferencji, rozwinParametr } from './lab-state.js';
import { hintsDeps } from './hints-deps.js';
import { zapiszSkladowa, ustawPowodNiewiar as _ustawPowodNiewiar, ustawPrzeszkolenie as _ustawPrzeszkolenie,
         ustawPominiecie as _ustawPominiecie, cofnijPominiecieStan, wyczyscBadanie as _wyczyscBadanie, ustawKrok, biezacyKrok,
         czystyStanHints } from './hints-state.js';

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
/* Blok 12 (kryterium odbioru nr 1): zakładka HINTS przestała być skrótem do symulatora. Zmierzone
   przed zmianą: siedem z siedmiu dróg wejścia do modułu wchodziło przy PUSTEJ kwalifikacji, a
   jedyna bramka w aplikacji (`triageGo`) leżała na ścieżce, której żadna z nich nie dotykała.
   Teraz drzwi są JEDNE — ekran kwalifikacji — a za nimi stoi `wolnoBadac`. */
function setMode(m){ if(m==="hints"){ goHintsKwal(); return; } state.mode=m; render(); }
function openHints(key){
  if(!bramkaHints()) return;
  state.hintsCustom=null; state.hintsScenario=key||"neuritisR"; state.hintsSide = key==="neuritisL"?"L":"P"; state.hintsFix=false; state.hintsGaze=0; state.hintsComp=0; state.hintsRecovery=false; state.hintsHitSide=null; state.screen="hints"; render(); }
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
  if(!bramkaHints()) return;
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
/* ============ BADANIE HINTS/HINTS+ Z KWALIFIKACJĄ (Blok 12) ============
   Trzy ekrany, w tej kolejności i bez skrótów:
     hintsKwal — kwalifikacja: pytania Bloku 6 pod kątem HINTS, przeszkolenie, świadome pominięcie,
     hintsBad  — badanie: jedna składowa naraz, duże wybory, zawsze jawne „nie można ocenić”,
     hintsWyn  — wynik: OSOBNY ekran, żeby nie mieszał się z wykonywaniem testu (wprost z dokumentu).
   Symulator (screen `hints`) zostaje tam, gdzie był, ale też stoi ZA bramką. */

// JEDNA bramka dla wszystkich wejść. Odmowa nie jest cicha: zapisuje powód, który ekran wypisuje.
function bramkaHints(){
  const w = wolnoBadac(state, hintsDeps());
  if(w.wolno){ state.hintsBlad=null; return true; }
  state.hintsBlad = w.status; state.mode="hints"; state.screen="hintsKwal"; render();
  return false;
}
function goHintsKwal(){ state.mode="hints"; state.screen="hintsKwal"; state.hintsBlad=null; render(); }
function ustawPrzeszkolenieHints(v){ if(_ustawPrzeszkolenie(v)) render(); }
function pomijajKwalifikacje(powod){ if(_ustawPominiecie(powod)) render(); }
function cofnijPominiecie(){ cofnijPominiecieStan(); render(); }
function zacznijBadanieHints(){
  if(!bramkaHints()) return;
  state.mode="hints"; state.screen="hintsBad";
  state.hintsKrok = nastepnyElement(state) || ELEMENT_IDS[0];
  render();
}
function otworzSymulatorHints(){ openHints(state.hintsScenario||"neuritisR"); }   // bramka siedzi w openHints
function otworzLaboratorium(){ openHintsCustom(); }                              // j.w.

/* Odpowiedź na składową. AUTOMATYCZNE PRZEJŚCIE DALEJ tylko przy PIERWSZEJ odpowiedzi na daną
   składową — poprawianie już udzielonej odpowiedzi zostawia użytkownika na miejscu. Bez tego
   warunku każda korekta wyrzucałaby go o ekran dalej, czyli dokładnie wtedy, gdy patrzy na to,
   co właśnie poprawia. */
function ustawSkladowaHints(id, v){
  const bylo = (state.hintsBadanie||{})[id];
  if(!zapiszSkladowa(id, v)) return;
  const jest = (state.hintsBadanie||{})[id];
  if(!bylo && jest){ const n = nastepnyElement(state); ustawKrok(n || id); }
  render();
}
function ustawPowodNiewiarHints(v){ if(_ustawPowodNiewiar(v)) render(); }
function goHintsKrok(id){ if(ustawKrok(id)) render(); }
function dalejHints(){
  const i = ELEMENT_IDS.indexOf(biezacyKrok());
  if(i < ELEMENT_IDS.length-1){ ustawKrok(ELEMENT_IDS[i+1]); render(); }
  else pokazWynikHints();
}
function wsteczHints(){
  const i = ELEMENT_IDS.indexOf(biezacyKrok());
  if(i > 0){ ustawKrok(ELEMENT_IDS[i-1]); render(); }
  else goHintsKwal();
}
function pokazWynikHints(){ state.mode="hints"; state.screen="hintsWyn"; render(); }
function wrocDoBadaniaHints(){ state.mode="hints"; state.screen="hintsBad"; render(); }
function wyczyscBadanieHints(){ _wyczyscBadanie(); state.screen="hintsBad"; render(); }

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
/* Wybór strony w TRYBIE EKSPERCKIM (Blok 10). Trzy rzeczy naraz, i każda z powodu:
   • `sideZrodlo` — strona przestaje być literałem ze state.js i staje się deklaracją użytkownika.
     Bez tego karta doboru pisałaby „stronę podałeś Ty" nad wartością, której nikt nie dotknął.
   • przebudowa planu, GDY ISTNIEJE — inaczej powstaje dokładnie ten rozjazd, który Blok 10
     naprawia gdzie indziej: `state.side` mówi jedno, `plan.side` drugie, a pigułka na ekranie
     manewru czyta plan i przestaje reagować.
   • `patchManeuverSide` — plan jest po tej akcji najświeższym elementem stanu, więc pasek nie ma
     prawa krzyczeć „zmieniono stronę" nad planem właśnie przeliczonym. */
function pickSide(s){
  if(state.side===s && state.sideZrodlo) return;
  state.side=s; state.sideZrodlo="wybrany";
  if(state.plan){
    state.plan=przebudujPlan(state.plan.key||state.maneuverKey, s);
    state.step=0; state.autostart=false; patchManeuverSide(state,s);
  }
  render();
}
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
/* `interpretSeen` znaczy „użytkownik przeszedł przez krok INTERPRETACJI PRÓBY". Przy pustym
   `testKey` żadna próba nie istnieje, więc ustawianie tej flagi zamieniało uczciwy status
   „pominięty — kanał i strona pochodzą od Ciebie" w „zakończony" i kasowało uzasadnienie.
   Zmierzone: openMan('epley') → pasek „– Interpretacja pominięty"; jedno dotknięcie mechanizmu →
   „✓ Interpretacja zakończony" przy testKey nadal null. Flaga jest lepka (`resetSeen` woła tylko
   zmiana PRÓBY, której w tym trybie nie ma), więc zostawała do końca sesji. */
function setVariant(v){ markDecision(state,"variant",v); state.variantZrodlo="nadpisany"; if(state.testKey) markSeen(state,"interpretSeen"); render(); }
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
/* SCENARIUSZ HISTORII POZYCYJNEJ (BLT_HISTORY, ocena II V5 — wododział R8).
   Pole `state.bltScenario` istniało od V5, ale BEZ TEGO PRZEŁĄCZNIKA było niedostępne: silnik
   liczył wododział, a klinicysta nie miał jak powiedzieć, gdzie złóg był PRZED próbą — czyli
   jedyna rzecz, która w kanalolitiazie kanału poziomego rozstrzyga kierunek Bow & Lean, siedziała
   za stałą „textbook". To NIE jest ustawienie testu, tylko cecha PACJENTA, więc jedno pole obsługuje
   wszystkie karty kanału poziomego. `markDecision` — bo zmiana historii unieważnia wcześniejszy
   wniosek tak samo jak zmiana strony. */
/* SESJA CIAGLA (ocena II D1/V10) — TRYB OPT-IN, DOMYSLNIE WYLACZONY.
   `state.session === null` to sciezka BIT-IDENTYCZNA z dotychczasowa: silnik startuje kazde badanie
   ze spoczynku naturalnego, a meczliwosc niesie mnoznik `fatigueFactor`. Wlaczenie przewleka miedzy
   badaniami stan JEDNEGO zlogu (polozenie phi, wiazanie bondFrac, ogon xi), wiec kolejna prowokacja
   zastaje go tam, gdzie zostawila go poprzednia.
   DLACZEGO OPT-IN, A NIE ZAWSZE: sesja i mnoznik opisuja TO SAMO zjawisko (zmierzona zgodnosc
   ponizej 1,5 %), wiec wlaczone naraz licza meczliwosc dwa razy. Trzymanie sciezki domyslnej
   nietknietej daje przelacznikowi jednoznaczna semantyke — i zostawia zloty wzorzec w spokoju.
   CZEGO SESJA NIE ROBI: nie wchodzi do toru NAUKI (moduly nauki maja zakaz importu state.js) ani do
   zapisu sesji z Bloku 15 — to stan FIZYKI zlogu, a nie dana przypadku. */
function przelaczSesje(){
  if(state.session){ state.session=null; render(); return; }
  const kanal = state.canal || CANAL_OF[state.maneuverKey] || (DIAG[state.testKey]||{}).canal || "posterior";
  state.session = { canal:kanal, side:state.side||"P", size:state.size||"medium",
                    phi:null, xi:0, bondFrac:0, rep:0, exited:false, acts:[] };
  render();
}
function setBltScenario(k){ if(state.bltScenario===k) return; markDecision(state,"blt",k); state.bltScenario=k; render(); }
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
/* GRANICA AKTU: akt konczy sie PRZY PRZEJSCIU DO INTERPRETACJI (decyzja kliniczna uzytkownika
   2026-08-15). Uzasadnienie tej granicy, a nie „po opisaniu obserwacji": opis mozna poprawiac,
   dopisywac i wycofywac — dopoki klinicysta go redaguje, proba TRWA. Przejscie do interpretacji
   jest pierwszym gestem, ktory mowi „to badanie mam za soba" — i dopiero wtedy wolno przesunac
   zlog, bo przesuniecie jest NIEODWRACALNE dla nastepnej proby.
   ZMIERZONE, ze akt DOWOLNEJ proby rusza zlog sesji: symulacja prowadzi zlog TEGO kanalu przez
   pozycje glowy TEGO testu, wiec Dix-Hallpike przesuwa zlog poziomy z 199,8° na 173,0° (odpowiedz
   slabsza — szczyt 0,478 wobec 0,941 przy Rollu). Dlatego NIE MA reguly zgodnosci kanalow:
   glowa rusza sie naprawde, niezaleznie od tego, ktory kanal badamy. */
function domknijAkt(){
  const S = state.session; if(!S || S.exited) return;
  const proba = state.testKey; if(!proba) return;
  /* IDEMPOTENCJA po (proba, strona, numer prowokacji). Wchodzenie i wychodzenie z interpretacji
     NIE MOZE przesuwac zlogu wielokrotnie — inaczej sama nawigacja leczylaby pacjenta. Ponowna
     PROWOKACJA (dixRep++) otwiera nowy akt, bo to naprawde kolejne ulozenie glowy. */
  const klucz = `${proba}|${state.side}|${state.dixRep||0}`;
  if(S.aktDomkniety === klucz) return;
  /* PROBA BEZ AKTU. `actTimeline` ma CICHY FALLBACK na ACT_STEPS.dix, wiec dla Bow & Lean
     zasymulowalby Dix-Hallpike'a i zapisal cudze przesuniecie jako wynik tej proby. Zamiast tego
     odnotowujemy POMINIECIE z powodem — sesja ma mowic, czego nie wie, a nie zmyslac. */
  if(!ACT_STEPS[proba]){
    S.acts = [...(S.acts||[]), { kind:proba, pominiety:"brakAktu" }];
    S.aktDomkniety = klucz; return;
  }
  let sim; try { sim = sessionSim(S, actTimeline(proba, state.side)); } catch(e){ return; }
  const fin = (sim && sim.final) || {};
  state.session = { ...S,
    phi: fin.phi != null ? fin.phi : S.phi,
    xi: fin.xi || 0,
    bondFrac: fin.bondFrac != null ? fin.bondFrac : (S.bondFrac||0),
    exited: !!fin.exited,
    rep: (S.rep||0) + 1,
    acts: [...(S.acts||[]), { kind:proba, phi: fin.phi != null ? Math.round(fin.phi) : null, exited: !!fin.exited }],
    aktDomkniety: klucz };
}
function goInterpret(){ domknijAkt(); state.screen="interpret"; markSeen(state,"interpretSeen"); render(); }

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
  if(state.testKey) markSeen(state,"interpretSeen");   // patrz setVariant — bez proby nie ma czego "widziec"
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
  // Blok 12: ścieżka HINTS prowadzi na ekran KWALIFIKACJI, nie do symulatora. Kwalifikacja wstępna
  // ustaliła obraz kliniczny, ale nie zapytała o przeszkolenie badającego — a bez tej odpowiedzi
  // wynik nie ma jak powiedzieć, ile jest wart (GRACE-3: HINTS bez przeszkolenia bywa mylący).
  if(tryb==="hints"){ goHintsKwal(); return; }
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
/* Jawne zakończenie serii (przycisk ✓ na ostatnim etapie) — to jest DEKLARACJA wykonania,
   więc tu `markConsumed` idzie bezwarunkowo.

   KRYTERIUM ODBIORU NR 1 BLOKU 11: „aplikacja nie wraca automatycznie do początku po zakończeniu
   manewru". Dotąd wołaliśmy tu `backToSetup()`, czyli seria kończyła się dokładnie tam, gdzie się
   zaczęła — na liście kanałów, bez jednego zdania o tym, co się przed chwilą wydarzyło, i bez
   miejsca na wynik kontroli. Teraz prowadzi do kroku „Kontrola". Licznik i blokadę ekranu i tak
   trzeba zdjąć (robił to `backToSetup`), więc robimy to tutaj jawnie. */
function zakonczSerie(){
  markConsumed(state); syncKontrola(state);
  state.running=false; releaseWake();
  state.zakonczeniePyta=false; state.kontrolaBlad=null;
  state.screen="followup"; render();
}

/* ============ Krok „Kontrola" po manewrze (Blok 11) ============ */
function goKontrola(){ syncKontrola(state); state.zakonczeniePyta=false; state.screen="followup"; render(); }
// Wróć TAM, skąd kontrola ma sens: do przewodnika, gdy plan istnieje; do doboru, gdy go nie ma.
// renderGuide czyta plan.steps[state.step] PRZED przypisaniem innerHTML, więc wejście na przewodnik
// bez planu to TypeError i zawis aplikacji bez śladu (ta sama pułapka, którą złapał man:dom).
function wrocDoManewru(){ state.screen = state.plan ? "guide" : "setup"; render(); }

/* Zapis wyniku idzie przez JEDNĄ drogę (followup-state), a ta przez STRAŻNIKA DANYCH. Odmowę
   trzeba pokazać, a nie połknąć: „zapisałem" nad niezapisanym wynikiem jest gorsze od błędu. */
function ustawWynikKontroli(id){
  const r = zapiszWynik(state, id, followupDeps());
  state.kontrolaBlad = r.ok ? null : r.powody.join("; ");
  syncKontrola(state); render();
}
function ustawPowodKontroli(p){ _ustawPowodKontroli(state, p, followupDeps()); syncKontrola(state); render(); }

/* POWTÓRZENIE MANEWRU to NOWE WYKONANIE, nie powrót do poprzedniego: odcisk przebiegu powstaje od
   nowa (`markManeuver`), więc powtórka dostaje własny wpis w historii serii i własną kontrolę.
   Bez tego druga próba nadpisywałaby wynik pierwszej i seria trzech powtórzeń wyglądałaby w
   podsumowaniu jak jedno podejście. Drogę dojścia dziedziczymy — kto doszedł tu z interpretacji,
   nie przestaje mieć jej za sobą przez to, że powtarza manewr. */
function powtorzManewrKontroli(){
  const m = state.flow && state.flow.maneuver;
  if(!m || !m.key) return;
  const key = m.key, strona = m.planSide || state.side, via = !!m.viaInterpret;
  state.maneuverKey=key; state.canal=CANAL_OF[key]; state.side=strona;
  markManeuver(state,key,via);
  state.plan=przebudujPlan(key,strona,{zachowajCzasy:false});
  state.step=0; state.autostart=false; state.running=false; releaseWake();
  syncKontrola(state);
  state.screen="guide"; render();
}
// Alternatywa idzie przez `zmienManewr` (Blok 10), który już robi wszystko, co trzeba — dokładamy
// wyłącznie przejście na ekran przewodnika, bo stąd manewru nie widać.
function kontrolaAlternatywa(k){ if(!state.plan) return; state.screen="guide"; zmienManewr(k); }

function kontrolaAkcja(a){
  const cel = celAkcji(a, state);
  if(a==="powtorzManewr") return powtorzManewrKontroli();
  if(a==="ponownaInterpretacja"){
    if(cel==="interpret") return goInterpret();
    // Tryb ekspercki nie ma próby, więc „ustal kanał i stronę od nowa" znaczy ekran doboru.
    state.mode="treat"; state.screen="setup"; return render();
  }
  if(a==="powtorzProbe"){
    if(cel==="obs") return goObs();
    state.mode="diag"; state.screen="setup"; return render();
  }
  if(a==="zakonczSesje") return pytajOZakonczeniu(true);
}

/* ZAKOŃCZENIE SESJI (kryterium odbioru nr 3). Dwustopniowe, bo kasuje dane przypadku — i BEZ
   ŻADNEGO warunku wstępnego: nie ma pola do wypełnienia, nie trzeba zaznaczyć wyniku kontroli,
   nie pytamy o nic o pacjencie. Ekran startowy jest tu celem świadomego gestu, a nie automatycznym
   powrotem po manewrze (to dwie różne rzeczy, patrz kryterium nr 1). */
function pytajOZakonczeniu(v){ state.zakonczeniePyta=!!v; render(); }
function zakonczSesje(){
  zakonczSesjeStan(state);
  /* BADANIE HINTS TEŻ JEST DANĄ PRZYPADKU (naprawa, 2026-08-08). `POLA_PRZYPADKU` w followup-state
     powstało w Bloku 11, a przyłóżkowe badanie HINTS w Bloku 12 — i nikt tej listy nie dopisał, więc
     odpowiedzi, deklaracja przeszkolenia, powód niewiarygodności i powód pominięcia PRZEŻYWAŁY
     zakończenie sesji i witały następnego pacjenta. Funkcja, która je czyści, istniała od Bloku 12
     i nie była wołana z żadnego miejsca. Skutek drugi, niewidoczny: sygnał `hints` w pwa-model
     czyta `hintsBadanie`, więc po jednym badaniu HINTS automatyczne wdrożenie aktualizacji
     (Blok 16, kryterium nr 3) było wstrzymane NA ZAWSZE — sesja kończyła się z „otwartym
     przypadkiem", którego nie dało się zamknąć inaczej niż przyciskiem „wyczyść badanie".
     Każdy moduł czyści SWOJE pola (jeden pisarz), a akcja tylko woła po kolei. */
  czystyStanHints(state);
  releaseWake();
  state.screen="start"; state.area="start"; render();
  /* BLOK 16, KRYTERIUM ODBIORU NR 3: „aktualizacja jest komunikowana i WYKONYWANA PO ZAKONCZENIU
     SESJI". Wdrazamy tutaj, a nie przy wykryciu nowej wersji, i nie bezwarunkowo: wdrozenie
     przeladowuje karte, wiec pwa-model.wdrozenieAutomatyczne najpierw MIERZY na stanie, czy
     zostalo jeszcze cokolwiek do stracenia. Po zakonczeniu sesji nie zostaje — i dlatego to
     jedyny moment, w ktorym przeladowanie niczego nie kosztuje. */
  if(wdrozenieAutomatyczne(state)) wdrozAktualizacjeTeraz();
}

// Potwierdzenie przerwy w obserwacji (kryterium odbioru nr 3). To JAWNY gest czlowieka: aplikacja
// zna czas, ale nie wie, czy pacjent utrzymal pozycje, gdy nikt nie patrzyl na ekran.
function potwierdzPrzerwe(){ state.luka=0; render(); }

/* ============ Ekran manewru — zachowania wspólne Bloku 10 ============ */

/* ALTERNATYWA BEZ OPUSZCZANIA EKRANU (dokument: „Alternatywne manewry dostępne bez opuszczania
   ekranu"). Podmiana manewru to NOWA DECYZJA, nie korekta widoku, więc odcisk przebiegu powstaje
   od nowa (`markManeuver`) — inaczej pasek meldowałby manewr, którego nikt już nie wykonuje.
   Drogę dojścia (`viaInterpret`) dziedziczymy z poprzedniego rekordu: klinicysta, który doszedł
   tu z interpretacji próby, nie przestaje mieć jej za sobą przez to, że wziął alternatywę. */
function zmienManewr(k){
  if(!state.plan || k===state.plan.key) return;
  const via = !!(state.flow && state.flow.maneuver && state.flow.maneuver.viaInterpret);
  const strona = state.plan.side;
  state.maneuverKey=k; state.canal=CANAL_OF[k]; state.side=strona;
  markManeuver(state,k,via);
  state.plan=przebudujPlan(k,strona,{zachowajCzasy:false});
  state.step=0; state.autostart=false; state.running=false; releaseWake();
  render();
}

/* TRYB TIMERA (dokument: „Timer można ustawić na stały czas lub «do ustąpienia oczopląsu + zapas»").
   Liczbę bierze MODEL z ξ(t) silnika, ale wyłącznie jako PODŁOGĘ — patrz man-model.czasUtrzymania:
   okno dynamiki jest zakorkowane capem, więc przewidywany czas oczopląsu nigdy nie przekracza
   ~19 s, a Semont ma w instrukcji „Utrzymaj 1–3 min". Tryb może zatem tylko WYDŁUŻAĆ.
   Przełączenie z powrotem na „stały" przywraca czasy protokolarne, bo inaczej wydłużenia zostałyby
   w planie jako wartości bez właściciela. */
function ustawTrybCzasu(tryb){
  const t2 = tryb==="doUstapienia" ? "doUstapienia" : "staly";
  if(state.trybCzasu===t2) return;
  state.trybCzasu=t2;
  if(state.plan){
    const key=state.plan.key||state.maneuverKey;
    state.plan=przebudujPlan(key, state.plan.side, {zachowajCzasy:false});
    if(t2==="doUstapienia" && trybDoUstapieniaDostepny(state.plan).dostepny){
      const etapy=etapyManewru(state.plan, manDeps(), state.size);
      state.plan.steps.forEach((st2,i)=>{
        const w=czasUtrzymania(st2.seconds, etapy[i] && etapy[i].sekundyOczoplasu, {});
        if(w.sekundy!=null) st2.seconds=w.sekundy;
      });
    }
  }
  render();
}
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

/* ============ LABORATORIUM NEUROOTOLOGICZNE (Blok 14) ============
   Wszystkie akcje przechodzą przez `lab-state.js`, który pisze WYŁĄCZNIE do pól `lab*`. Żadna
   z nich nie dotyka pól pacjenta ani pól symulatora HINTS — i to jest cała treść kryterium
   odbioru nr 1: „Laboratorium nie jest potrzebne do zakończenia podstawowej diagnostyki" znaczy
   też, że wejście do Laboratorium NICZEGO w tej diagnostyce nie zmienia. Wyrocznia bierze odcisk
   obu tamtych zbiorów pól przed eksperymentem i po nim. */
function goLab(){
  state.area="lab"; state.mode="lab"; state.screen="labLista";
  zamknijEksperyment(state);
  render();
}
function otworzEksperymentLab(id){
  if(!otworzEksperyment(state, id, labDeps())){ render(); return; }
  state.area="lab"; state.mode="lab"; state.screen="labEksp";
  render();
}
function wrocDoEksperymentow(){ goLab(); }
function ustawStanowiskoLab(id){ ustawStanowisko(state, id); render(); }
function przelaczPorownanieLab(){ przelaczPorownanie(state); render(); }
function ustawParametrLab(key, wartosc){ ustawParametr(state, key, wartosc, labDeps()); render(); }
function resetLab(){ resetDoReferencji(state, labDeps()); render(); }
function opisParametruLab(key){ rozwinParametr(state, key); render(); }

/* ============ TRYB NAUKI (Blok 13) ============
   Wszystkie akcje lekcji przechodzą przez `nauka-state.js`, który pisze WYŁĄCZNIE do pól
   `nauka*`. Żadna z nich nie woła `markDecision`, `markSeen`, `zapiszWynik` ani pisarzy
   obserwacji — i to jest cała separacja torów: rozwiązanie przypadku nie zmienia ani jednego
   pola opisującego prawdziwego pacjenta. Wyrocznia bierze odcisk stanu przed lekcją i po niej. */
function nDeps(){ return naukaDeps(przypadekNauki(state.naukaPrzypadek)); }

function goNauka(){
  state.area="learn"; state.mode="nauka"; state.screen="naukaBib";
  zamknijPrzypadek(state);
  render();
}
function otworzPrzypadek(id){
  if(!zacznijPrzypadek(state, id)){ render(); return; }
  state.area="learn"; state.mode="nauka"; state.screen="naukaLekcja";
  render();
}
function wrocDoBiblioteki(){ goNauka(); }
function ustawFiltrNauki(pole, wartosc){ ustawFiltr(state, pole, wartosc); render(); }
function goEtapNauki(id){ ustawEtap(state, id); render(); }

/* ODPOWIEDŹ. Po jej przyjęciu przechodzimy do informacji zwrotnej TEGO SAMEGO etapu — nie do
   następnego. Dokument mówi wprost: „po udzieleniu odpowiedzi ekran automatycznie przewija się
   do informacji zwrotnej". Automatyczne przeskoczenie dalej zabrałoby uczniowi to, po co ten
   blok w ogóle powstał. */
function odpowiedzNauki(etap, wartosc){
  ustawOdpowiedz(state, etap, wartosc, nDeps());
  render();
  try{ const el=$("#naukaFeedback"); if(el && el.scrollIntoView) el.scrollIntoView({block:"nearest"}); }catch(e){}
}
function wskazowkaNauki(etap){ uzyjWskazowki(state, etap); render(); }

/* KONIEC PRZYPADKU. Zapis idzie DWUSTOPNIOWO: najpierw do stanu (przez strażnika danych),
   potem do pamięci przeglądarki. Rozdzielenie ma powód: gdy pamięć odmówi (tryb prywatny,
   brak miejsca), lekcja i tak ma poprawny wynik na ekranie, a użytkownik dostaje informację,
   że postęp nie został zapisany — zamiast cichego udawania, że został. */
function zakonczPrzypadek(){
  const wpis = zapiszPostepDoStanu(state, nDeps());
  if(wpis){
    const r = zapiszPostep(state.naukaPostep);
    state.naukaZapisBlad = r.ok ? null : r.powod;
  }
  state.screen="naukaBib";
  zamknijPrzypadek(state);
  render();
}
function wyczyscPostepNauki(){
  wyczyscPostepStanu(state);
  const r = wyczyscPostep();
  state.naukaZapisBlad = r.ok ? null : r.powod;
  render();
}
/* Boot: postęp z pamięci wczytujemy RAZ, poza renderem. Gdyby ekran czytał `localStorage` sam,
   złoty wzorzec przestałby być deterministyczny — a to jest jedyna wyrocznia, która widzi cały
   DOM naraz. */
function wczytajPostepNauki(){ try{ state.naukaPostep = wczytajPostep(); }catch(e){ state.naukaPostep = {}; } }


/* ============ GENERATOR OPISU I ZAPIS SESJI (Blok 15) ============
   Cała logika siedzi w opis-model.js (czysty) i opis-state.js (jedyny pisarz). Tutaj zostają
   tylko rzeczy, których czysty moduł mieć nie może: nawigacja, schowek, pobranie pliku i ZEGAR.

   ZEGAR WCHODZI TYLKO TĘDY. `Date.now()` nie ma prawa pojawić się ani w modelu, ani w magazynie:
   model musi być powtarzalny w wyroczni, a znacznik czasu służy WYŁĄCZNIE do porządkowania listy
   zapisów — nigdy nie wchodzi do opisu badania. */
function goOpis(){ state.screen="opis"; wyczyscEdycje(state); state.opisBlad=null; state.opisKomunikat=null; render(); }
function przelaczSekcjeOpisu(id){ ustawSekcje(state, id); render(); }
function edytujOpis(){
  // Edycja startuje od tekstu, który użytkownik WIDZI — inaczej pole otwierałoby się puste
  // i pierwsze wrażenie byłoby takie, że opis zniknął.
  ustawEdycje(state, tekstOpisu());
  render();
}
function ustawEdycjeOpisu(txt){
  // BEZ render(): przerysowanie pola w trakcie pisania gubi kursor. Stan zapisujemy, ekran nie drga.
  ustawEdycje(state, txt);
}
function wrocDoWyliczonego(){ wyczyscEdycje(state); render(); }

function kopiujOpis(){
  const txt = tekstOpisuDoKopiowania();
  const pokwituj = (klucz)=>{ state.opisKomunikat=klucz; state.opisBlad=null; render(); };
  try{
    if(navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(txt).then(()=>pokwituj("skopiowano"), ()=>pokwituj("nieSkopiowano"));
    else pokwituj("nieSkopiowano");
  }catch(e){ pokwituj("nieSkopiowano"); }
}

/* EKSPORT — jawny gest, osobny plik i TEN SAM strażnik, co przy zapisie. Nie eksportujemy tekstu
   po ręcznej edycji: zapis ustrukturyzowany ma być czytelny dla programu, a nie kopią zdania,
   w którym ktoś mógł dopisać cokolwiek. */
function eksportujOpis(){
  const e = pakietEksportu(state, opisDeps(state), Date.now());
  if(!e.ok){ state.opisBlad="odmowaStraznika"; state.opisKomunikat=null; render(); return; }
  try{
    const blob = new Blob([JSON.stringify(e.pakiet, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `otorepo-sesja-${e.pakiet.utworzono}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 0);
    state.opisKomunikat="wyeksportowano"; state.opisBlad=null;
  }catch(err){ state.opisBlad="brakPamieci"; state.opisKomunikat=null; }
  render();
}

function zapiszSesjeOpisu(){ zapiszSesjeStan(state, opisDeps(state), Date.now()); render(); }
function usunSesjeOpisu(id){ usunSesjeStan(state, id, opisDeps(state)); render(); }
function usunWszystkieSesjeOpisu(){ usunWszystkieStan(state); render(); }
/* ODTWORZENIE. Plan manewru NIE jest zapisywany (patrz opis-model.POLA_ULOTNE), więc odtwarzamy
   go z klucza manewru i strony — a licznik zostaje ZATRZYMANY, bo pacjenta dawno nie ma w tej
   pozycji. Sesja odtworzona z licznikiem w biegu mierzyłaby czas utrzymania cudzej pozycji. */
function przywrocSesjeOpisu(id){
  const r = przywrocSesjeStan(state, id, opisDeps(state));
  if(r.ok && r.wymagaPlanu && r.maneuverKey){
    try{ state.plan = przebudujPlan(r.maneuverKey, r.side || state.side, {zachowajCzasy:false}); }catch(e){ state.plan=null; }
    state.step=0; state.autostart=false; state.running=false;
  }
  // Streszczenia w  sa WYLICZANE, a nie zapisywane — po odtworzeniu trzeba je odtworzyc,
  // inaczej pasek przebiegu pokazuje kwalifikacje poprzedniego przypadku.
  syncTriage(state);
  syncKontrola(state);
  render();
}
// Boot: zapisy z pamięci wczytujemy RAZ i POZA renderem — ten sam powód, co przy postępie nauki.
function wczytajSesjeOpisu(){ try{ wczytajSesjeStan(state, opisDeps(state)); }catch(e){ state.opisSesje=[]; } }

// Tolerancja manewru (Blok 15) — jedyna nowa dana kliniczna tego bloku.
function ustawTolerancjeKontroli(id){
  const r = ustawTolerancje(state, id, followupDeps());
  state.kontrolaBlad = r.ok ? null : (r.powody||[]).join("; ") || r.powod;
  render();
}

/* ============ Blok 16: aktualizacja PWA i skroty klawiaturowe ============ */

// Odswiezenie paska idzie przez guardowany uchwyt globalny — actions.js NIE importuje powloki
// (ta ma zostac lisciem grafu), dokladnie jak przy __otoLangChange.
function odswiezPasekAktualizacji(){
  try{ if(typeof window!=="undefined" && typeof window.__otoAktualizacja==="function") window.__otoAktualizacja(); }catch(e){}
}
// Wolane przez adapter przegladarki, gdy nowa wersja zainstalowala sie i CZEKA.
function aktualizacjaCzeka(){ if(ustawCzekajaca(state)) odswiezPasekAktualizacji(); }
// Uzywane WYLACZNIE przez wyrocznie i scenariusze zlotego wzorca: pola aktualizacji przezywaja
// nawigacje (jak rekordy obserwacji), wiec bez zerowania scenariusze wyciekalyby jeden na drugi.
function zerujAktualizacje(){ zerujAktualizacjeStan(state); odswiezPasekAktualizacji(); }
function schowajAktualizacje(){ if(schowajPasek(state)) odswiezPasekAktualizacji(); }
/* WDROZENIE NA ZYCZENIE. Odmowa przy trwajacym manewrze nie jest awaria, tylko CELEM tego bloku —
   dlatego zwracamy powod, a nie ciche `undefined`. Samo przeladowanie robi 'controllerchange'
   w src/runtime/pwa.js: karta przeladowana przed przejeciem dostalaby z powrotem stary dokument. */
function wdrozAktualizacjeTeraz(){
  const r = ustawWdrazana(state);
  odswiezPasekAktualizacji();
  if(!r.ok) return r;
  if(!wdrozAktualizacje()){ cofnijWdrazanie(state); odswiezPasekAktualizacji(); return {ok:false, powod:"brakCzekajacej"}; }
  return r;
}

/* SKROTY KLAWIATUROWE (dokument, kolumna „Komputer": spacja pauza/wznowienie, strzalki krok).
   Tlumaczenie KeyboardEvent na obiekt jest CALA rola tej funkcji — decyzja nalezy do czystego
   pwa-model.skrot, zeby dalo sie ja zmierzyc bez przegladarki. Zwracamy decyzje (a nie boolean),
   bo wyrocznia sprawdza NAZWANY powod odmowy, a nie samo „nic sie nie stalo". */
function celZdarzenia(el){
  if(!el || typeof el !== "object") return {tag:"", typ:"", edytowalne:false, rola:""};
  const attr = (n) => (typeof el.getAttribute === "function" ? (el.getAttribute(n) || "") : "");
  return { tag: el.tagName || "", typ: attr("type"), edytowalne: !!el.isContentEditable, rola: attr("role") };
}
function obsluzKlawisz(e){
  if(!e) return null;
  const d = skrot({ key:e.key, ctrlKey:!!e.ctrlKey, altKey:!!e.altKey, metaKey:!!e.metaKey,
                    shiftKey:!!e.shiftKey, repeat:!!e.repeat, cel:celZdarzenia(e.target) }, state);
  if(!d.akcja) return d;
  if(!state.plan || !state.plan.steps) return { akcja:null, powod:"brakKroku", skrot:d.skrot };
  // preventDefault dopiero TERAZ: gdyby stal wyzej, spacja przestalaby przewijac strone nawet
  // wtedy, gdy skrot odmawia.
  if(typeof e.preventDefault === "function") e.preventDefault();
  if(d.akcja === "przelaczLicznik") toggleTimer();
  else if(d.akcja === "nastepnyKrok") goStep(state.step+1);
  else if(d.akcja === "poprzedniKrok") goStep(state.step-1);
  return d;
}

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


export { aktualizacjaCzeka, zerujAktualizacje, schowajAktualizacje, wdrozAktualizacjeTeraz, obsluzKlawisz, goOpis, przelaczSekcjeOpisu, edytujOpis, ustawEdycjeOpisu, wrocDoWyliczonego, kopiujOpis, eksportujOpis, zapiszSesjeOpisu, usunSesjeOpisu, usunWszystkieSesjeOpisu, przywrocSesjeOpisu, wczytajSesjeOpisu, ustawTolerancjeKontroli, goLab, otworzEksperymentLab, wrocDoEksperymentow, ustawStanowiskoLab, przelaczPorownanieLab, ustawParametrLab, resetLab, opisParametruLab, goNauka, otworzPrzypadek, wrocDoBiblioteki, ustawFiltrNauki, goEtapNauki, odpowiedzNauki, wskazowkaNauki, zakonczPrzypadek, wyczyscPostepNauki, wczytajPostepNauki, goHintsKwal, ustawPrzeszkolenieHints, pomijajKwalifikacje, cofnijPominiecie, zacznijBadanieHints, otworzSymulatorHints, otworzLaboratorium, ustawSkladowaHints, ustawPowodNiewiarHints, goHintsKrok, dalejHints, wsteczHints, pokazWynikHints, wrocDoBadaniaHints, wyczyscBadanieHints, biezacyKrok, goKontrola, wrocDoManewru, ustawWynikKontroli, ustawPowodKontroli, kontrolaAkcja, kontrolaAlternatywa, powtorzManewrKontroli, pytajOZakonczeniu, zakonczSesje, potwierdzPrzerwe, zmienManewr, ustawTrybCzasu, zakonczSerie, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, togglePorownanie, goObs, wrocDoProby, setObsWystapil, setObsPole, oznaczObsPole, setObsPowod, setObsGrupa, wyczyscObs, przyjmijObs, toggleVizPause, setVizSpeed, vizStepFwd, resetViz, openTriage, setTriage, toggleTriageFlaga, goTriageStep, resetTriage, triageGo, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, HINTS_PRESETS, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, HINTS_CANAL_KEYS, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, setBltScenario, przelaczSesje, domknijAkt, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { schowajAktualizacje, wdrozAktualizacjeTeraz, goOpis, przelaczSekcjeOpisu, edytujOpis, ustawEdycjeOpisu, wrocDoWyliczonego, kopiujOpis, eksportujOpis, zapiszSesjeOpisu, usunSesjeOpisu, usunWszystkieSesjeOpisu, przywrocSesjeOpisu, wczytajSesjeOpisu, ustawTolerancjeKontroli, goLab, otworzEksperymentLab, wrocDoEksperymentow, ustawStanowiskoLab, przelaczPorownanieLab, ustawParametrLab, resetLab, opisParametruLab, goNauka, otworzPrzypadek, wrocDoBiblioteki, ustawFiltrNauki, goEtapNauki, odpowiedzNauki, wskazowkaNauki, zakonczPrzypadek, wyczyscPostepNauki, wczytajPostepNauki, goHintsKwal, ustawPrzeszkolenieHints, pomijajKwalifikacje, cofnijPominiecie, zacznijBadanieHints, otworzSymulatorHints, otworzLaboratorium, ustawSkladowaHints, ustawPowodNiewiarHints, goHintsKrok, dalejHints, wsteczHints, pokazWynikHints, wrocDoBadaniaHints, wyczyscBadanieHints, biezacyKrok, goKontrola, wrocDoManewru, ustawWynikKontroli, ustawPowodKontroli, kontrolaAkcja, kontrolaAlternatywa, powtorzManewrKontroli, pytajOZakonczeniu, zakonczSesje, potwierdzPrzerwe, zmienManewr, ustawTrybCzasu, zakonczSerie, goInterpret, przyjmijMechanizm, nadpiszMechanizm, wrocDoWyprowadzonego, idzDoProby, togglePorownanie, goObs, wrocDoProby, setObsWystapil, setObsPole, oznaczObsPole, setObsPowod, setObsGrupa, wyczyscObs, przyjmijObs, toggleVizPause, setVizSpeed, vizStepFwd, resetViz, openTriage, setTriage, toggleTriageFlaga, goTriageStep, resetTriage, triageGo, setHintsPlane, hintsHIT, rerunHintsHIT, setMode, openHints, setHintsDx, setHintsNeuritisSide, setHintsFix, setHintsGaze, setHintsComp, setHintsRecovery, hintsActivePatient, loadHintsPreset, loadHintsNeuritis, openHintsCustom, exitHintsCustom, setHintsAdvanced, findParamSpec, fmtParamVal, setHintsParam, applyHintsNerve, setHintsNerveEar, setHintsNerveBranch, setHintsNerveSev, hintsRandomPatient, revealHintsQuiz, hintsSCDSStim, hintsCustomDiff, hintsEncode, hintsDecode, saveShareHints, loadHintsFromHash, loadHintsFromStore, pickSide, pickCanal, pickMan, pickTest, openMan, openTest, setDixObs, toggleDiagCentral, setVariant, repeatDixProvoke, resetDixProvoke, genPlan, pickSize, setGuideSide, setDiagSide, setBltScenario, przelaczSesje, domknijAkt, startPlan, startManeuver, startDiag, backToSetup, goStep, toggleAuto, toggleSound, setView3d, setLangUI, syncLangBar });
