// Infrastruktura przeglądarkowa: $, rejestr rAF, easing, Wake Lock, dźwięk.
import { state } from '../app/state.js';

const $ = (s,r=document)=>r.querySelector(s);

/* ============ rAF rejestr ============ */
let animFrames=[];
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

export { $, animFrames, cancelAnims, loopRAF, easeInOut, lerp, _wakeLock, acquireWake, releaseWake, syncWake, audioCtx, beep };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
Object.assign(window, { cancelAnims, loopRAF, syncWake, beep });
