// Infrastruktura przeglądarkowa: $, rejestr rAF, easing, Wake Lock, dźwięk.
import { state } from '../app/state.js';
import { vizClock } from './viz-clock.js';

const $ = (s,r=document)=>r.querySelector(s);

/* ============ rAF rejestr ============ */
let animFrames=[];
function cancelAnims(){
  animFrames.forEach(id=>cancelAnimationFrame(id)); animFrames=[];
  // Rozpięcie zegara wizualizacji od czasu rzeczywistego (Blok 7). cancelAnims() leci na początku
  // KAŻDEGO render(), a nowe pętle zapisują swój start z bieżącego czasu wirtualnego. Między
  // renderami mija dowolnie dużo czasu rzeczywistego (użytkownik czyta ekran), więc bez tego
  // pierwsza klatka po renderze doliczyłaby całą przerwę i oczopląs pojawiłby się już wygasły.
  try{ vizClock.detach(); }catch(e){}
}
/* Czas WIZUALIZACJI dla pętli animacji. Świadomie NIE dotyczy klinicznego licznika utrzymania
   pozycji (setupGuideAnim liczy `dt` z surowego `now`): prędkość podglądu nie ma prawa zmieniać
   czasu, przez który pacjent naprawdę trzyma głowę w pozycji. */
function vizPeek(){ try{ return vizClock.peek(); }catch(e){ return 0; } }
function vizNow(realNow){ try{ return vizClock.now(realNow); }catch(e){ return realNow; } }
function loopRAF(fn){ // fn(now) -> true aby kontynuować
  const myFrames=animFrames;                       // rejestr aktywny w chwili startu pętli
  const idx=myFrames.length;
  // Gdy fn(now) samo wywoła render() (np. auto-advance: goStep→render→cancelAnims), animFrames zostaje
  // PODMIENIONY na nowy rejestr, a render restartuje potrzebne pętle. Ta (już nieaktualna) pętla NIE może
  // się wtedy przeplanować — inaczej zostaje „zombie" liczący np. elapsedMs równolegle z nową pętlą (2× tempo).
  const tick=(now)=>{ if(animFrames===myFrames && fn(now) && animFrames===myFrames){ animFrames[idx]=requestAnimationFrame(tick); } };
  myFrames.push(requestAnimationFrame(tick));
}
/* Jednorazowy rAF ZAREJESTROWANY w rejestrze — do rozruchu ekranu po przerysowaniu.
   Rozruch planowany gołym requestAnimationFrame jest NIEKASOWALNY: cancelAnims() widzi tylko
   to, co jest w animFrames, więc po dwóch render()-ach w JEDNEJ turze obie zaległe funkcje
   rozruchowe odpalają w tej samej klatce i każda startuje własną pętlę. Pętle są wtedy nowe
   (ten sam rejestr), więc strażnik „zombie" z loopRAF ich nie rozróżnia i obie liczą.
   Na ekranie manewru znaczy to KLINICZNY LICZNIK BIEGNĄCY N RAZY SZYBCIEJ — zmierzone
   dokładnie 1,00 / 2,01 / 3,00 przy jednym, dwóch i trzech przerysowaniach.
   Tu fn jest bramkowane tym samym warunkiem co pętla: gdy między zaplanowaniem a klatką
   przyszedł nowy render, zaległy rozruch po prostu nie zachodzi — a nowy render i tak
   zaplanował własny. */
function rafOnce(fn){ loopRAF((now)=>{ fn(now); return false; }); }
const easeInOut=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const lerp=(a,b,t)=>a+(b-a)*t;

/* ============ Wake Lock — ekran nie gaśnie podczas odliczania manewru ============
   W3C Screen Wake Lock API: bez wtyczek/zależności; działa w WebView Capacitora (kontekst https)
   i w przeglądarce po http(s)/localhost. Wymaga secure context (po file:// milcząco nieaktywny).
   Blokada aktywna WYŁĄCZNIE gdy licznik biegnie (state.running); zwalniana przy pauzie/resecie/końcu/
   wyjściu. System zwalnia blokadę po zejściu apki w tło → ponawiamy przy powrocie, jeśli licznik trwa. */
let _wakeLock=null;
/* `state.wakeOK` ustawiamy z FAKTYCZNEJ PRÓBY, nie z detekcji na boocie — i to jest różnica
   merytoryczna, nie stylistyczna. Detekcja odpowiada na pytanie „czy API istnieje", a klinicystę
   interesuje „czy ekran naprawdę nie zgaśnie". Blokada bywa odrzucona (brak secure context,
   polityka systemu, oszczędzanie energii) mimo obecnego API. Przy okazji: `wakeOK` zostaje `null`
   dopóki nikt nie nacisnął „Start", więc złoty wzorzec — który nigdy go nie naciska — nie przypina
   ostrzeżenia jako stanu normalnego. */
async function acquireWake(){
  if(!('wakeLock' in navigator)){ state.wakeOK=false; return; }
  try{
    if(!_wakeLock){
      _wakeLock = await navigator.wakeLock.request('screen');
      _wakeLock.addEventListener('release', ()=>{ _wakeLock=null; });
    }
    state.wakeOK=true;
  }catch(e){ state.wakeOK=false; }
}
async function releaseWake(){ try{ const w=_wakeLock; _wakeLock=null; if(w) await w.release(); }catch(e){} }
function syncWake(){ if(state.running) acquireWake(); else releaseWake(); }   // spina blokadę ze stanem licznika
/* PRZERWA W WIDOCZNOŚCI. Do Bloku 10 ten handler tylko ponawiał blokadę; sam licznik sumował `dt`
   z klatek rAF, więc pierwsza klatka po powrocie doliczała CAŁĄ przerwę jednym skokiem — razem
   z warunkiem końca etapu i auto-przejściem, w skrajnym przypadku kaskadą aż do `markConsumed`.
   Teraz notujemy MOMENT ukrycia; przeliczeniem zajmuje się hold-clock (czas ścienny), a decyzją,
   czy przerwę wolno zaliczyć jako utrzymaną pozycję — człowiek. */
if (typeof document !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='hidden'){ if(state.running) state.ukryteOd=Date.now(); return; }
  if(state.running) acquireWake();
});

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

export { $, animFrames, cancelAnims, loopRAF, rafOnce, easeInOut, lerp, _wakeLock, acquireWake, releaseWake, syncWake, audioCtx, beep, vizNow, vizPeek, vizClock };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")
Object.assign(window, { cancelAnims, loopRAF, syncWake, beep });
