"use strict";
export const Vestibular = (()=>{
  // Prawo Ewalda II/III: który kierunek przepływu pobudza dany kanał
  function isExcitatory(canal, flow){
    reqCanalName(canal, "isExcitatory");   // bez tego każdy canal!=="horizontal" (też literówka) udawał kanał pionowy
    if(flow!=="ampullopetal" && flow!=="ampullofugal")   // bez tego literówka/zły przepływ cicho zwracała false (jakby hamujący)
      throw new TypeError('isExcitatory: nieznany przepływ "'+flow+'" (dozwolone: "ampullopetal"|"ampullofugal")');
    return canal==="horizontal" ? flow==="ampullopetal"   // Ewald II — kanał poziomy
                                : flow==="ampullofugal";   // Ewald III — kanały pionowe
  }
  // Ewald I (swoistość płaszczyzny): oś szybkiej fazy dla POBUDZENIA kanału,
  // ipsiwersyjnie do pobudzonego ucha.
  // --- Realne wektory normalne kanałów (magnitudy oczopląsu zamiast idealnych 45°) ---
  // Źródło: Wu, Lin, Zheng, Zhou, Liu, Yang (2021) "Measurement of Human Semicircular Canal
  //   Spatial Attitude", Front. Neurol. 12:741948, doi:10.3389/fneur.2021.741948 (MRI, n=55).
  //   Kierunkowo zgodne z kanonem: Della Santina i wsp. (2005), JARO 6:191-206,
  //   doi:10.1007/s10162-005-0003-x. Dane potwierdzają koplanarność LARP/RALP (RA∥LP, RP∥LA).
  // Układ Wu: x=lewo, y=przednio-tylny, z=góra. Magnitudy biorę z |składowych| (znak osi Wu
  //   nieistotny dla proporcji; kierunki bicia zostają z konwencji klinicznej poniżej):
  //   PION ∝ |x|(międzyuszna) · POZIOM ∝ |z|(czaszkowa) · SKRĘT ∝ |y|(nosowo-potyliczna).
  const CANAL_NORMALS = {
    posterior: { P:[-0.651, 0.702, 0.287], L:[ 0.660, 0.702, 0.266] },
    anterior:  { P:[ 0.749, 0.577, 0.324], L:[-0.739, 0.588, 0.329] },
    horizontal:{ P:[-0.017,-0.299, 0.954], L:[ 0.025,-0.279, 0.960] }
  };
  // WALIDACJA WEJŚCIA — jasny błąd zamiast wyjątku „undefined" lub niemego złego wyniku (np. literówka w side
  // dawała cichy dryf ipsi=-1; literówka w canal udawała kanał pionowy w isExcitatory). Kanały: klucze CANAL_NORMALS. Strona: "L"|"P".
  function reqCanalName(canal, where){   // sam kanał (bez strony) — dla wejść przyjmujących tylko canal, np. isExcitatory
    if(!CANAL_NORMALS[canal]) throw new TypeError(where+': nieznany kanał "'+canal+'" (dozwolone: horizontal|anterior|posterior)');
  }
  function reqCanal(canal, ear, where){
    reqCanalName(canal, where);
    if(ear!=="L" && ear!=="P") throw new TypeError(where+': nieprawidłowa strona "'+ear+'" (dozwolone: "L"|"P")');
  }
  // magnitudy {v,h,t} z normalnej, znormalizowane do max=1
  function nysMag(canal, ear){
    reqCanal(canal, ear, "nysMag");
    const n=CANAL_NORMALS[canal][ear], v=Math.abs(n[0]), h=Math.abs(n[2]), t=Math.abs(n[1]);
    const m=Math.max(v,h,t)||1; return {v:v/m, h:h/m, t:t/m};
  }
  // MASKA KLINICZNA — geometria daje magnitudy, ale konwencja kliniczna decyduje, KTÓRE składowe
  // wyrażamy. true = odsłoń realną składową geometryczną; false = utrzymaj konwencję kliniczną.
  //   posterior.h: geom.≈0.41 (klin. pomijany) · anterior.t: geom.≈0.78 (override: czysty downbeat)
  //   horizontal.t: geom.≈0.29 (klin. czysto poziomy)
  const NYS_SHOW = { posterior:{h:false,t:true}, anterior:{h:false,t:false}, horizontal:{t:false} };
  function quickPhase(canal, ear /* 'L'|'P' */){
    const ipsi = ear==="P" ? +1 : -1;                 // + = strona prawa
    const m = nysMag(canal, ear);                     // realne magnitudy z CANAL_NORMALS
    if(canal==="horizontal") return {h: ipsi*m.h, v:0, t: NYS_SHOW.horizontal.t ? ipsi*m.t : 0};       // poziomy ku pobudzonemu uchu
    if(canal==="posterior")  return {h: NYS_SHOW.posterior.h ? ipsi*m.h : 0, v:+m.v, t: NYS_SHOW.posterior.t ? ipsi*m.t : 0}; // upbeat + skręt ku uchu; realne v:t≈0.93:1
    if(canal==="anterior")   return {h: NYS_SHOW.anterior.h ? ipsi*m.h : 0, v:-m.v, t: NYS_SHOW.anterior.t ? ipsi*m.t : 0};   // downbeat; override klin. t:0 (geom. skręt ≈0.78)
    return {h:0,v:0,t:0};
  }
  // Szybka faza dla zadanego, pobudzonego/hamowanego kanału
  function nystagmus({canal, ear, excited=true}){
    const q=quickPhase(canal,ear), s=excited?1:-1;    // hamowanie odwraca (jednostronna utrata itp.)
    return {h:q.h*s, v:q.v*s, t:q.t*s};
  }
  /* ---- warstwa geometryczna (etap 1) ----
     Kwaterniony q=[w,x,y,z]; układ głowy x=prawo, y=góra(czaszka), z=przód(nos).
     Orientacja głowy → grawitacja w układzie głowy → przepływ w kanale → Ewald. */
  const qmul=(a,b)=>[a[0]*b[0]-a[1]*b[1]-a[2]*b[2]-a[3]*b[3],
                     a[0]*b[1]+a[1]*b[0]+a[2]*b[3]-a[3]*b[2],
                     a[0]*b[2]-a[1]*b[3]+a[2]*b[0]+a[3]*b[1],
                     a[0]*b[3]+a[1]*b[2]-a[2]*b[1]+a[3]*b[0]];
  const qconj=q=>[q[0],-q[1],-q[2],-q[3]];
  const qaxis=(ax,deg)=>{const r=deg*Math.PI/360,s=Math.sin(r),n=Math.hypot(ax[0],ax[1],ax[2])||1;
                         return [Math.cos(r),s*ax[0]/n,s*ax[1]/n,s*ax[2]/n];};
  const rotv=(q,v)=>{const r=qmul(qmul(q,[0,v[0],v[1],v[2]]),qconj(q));return [r[1],r[2],r[3]];};
  const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const nrm3=v=>{const n=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/n,v[1]/n,v[2]/n];};
  const nrm4=q=>{const n=Math.hypot(q[0],q[1],q[2],q[3])||1;return [q[0]/n,q[1]/n,q[2]/n,q[3]/n];};
  // walidacja + normalizacja kwaternionu na publicznych wejściach: rotv(q,·) skaluje wektor o |q|²,
  // więc q≠jednostkowy psuje normę grawitacji (rzut → mag → cała dynamika). Zwraca q znormalizowane.
  function reqQuat(q, where){
    if(!Array.isArray(q) || q.length!==4 || q.some(x=>!Number.isFinite(x)))
      throw new TypeError(where+": q musi być skończonym kwaternionem [w,x,y,z]");
    return nrm4(q);
  }
  // q obraca wektory głowy → świata; grawitacja świata = (0,-1,0)
  const gHead=q=>rotv(qconj(reqQuat(q,"gHead")),[0,-1,0]);
  const Q_SUPINE=qaxis([1,0,0],-100);                   // supine head-hanging
  const qSupineYaw=deg=>qmul(Q_SUPINE, qaxis([0,1,0],deg)); // skręt wokół osi czaszki
  const qPitch=deg=>qaxis([1,0,0],deg);                  // +deg = skłon (bow), -deg = odchylenie (lean)
  // osie pobudzenia kanałów pionowych (w płaszczyźnie kanału, kalibrowane do Dix–Hallpike)
  const GEXC={ RP:nrm3([1,0,-1]), LP:nrm3([-1,0,-1]), RA:nrm3([-1,0,-1]), LA:nrm3([1,0,-1]) }; // oś pobudzenia = -e1 (ampullofugalna); przednie poprawione (był błędnie +e1)
  // oś ampullopetalna kanału poziomego: międzyuszna (ku choremu uchu) + przednio-tylna (przód = ampullopetalny)
  const uHC = side => side==="P" ? nrm3([0.87,0,0.5]) : nrm3([-0.87,0,0.5]);
  const CK={posterior:{P:"RP",L:"LP"}, anterior:{P:"RA",L:"LA"}};
  // stymulacja chorego kanału w danej orientacji głowy
  function position({canal, side, variant, q}){
    reqCanal(canal, side, "position");
    if(variant!=null && variant!=="cupulo" && variant!=="canalo") throw new TypeError('position: nieznany variant "'+variant+'" (dozwolone: "cupulo"|"canalo"|brak)');
    q=reqQuat(q, "position");            // waliduje (skończony, dł. 4) i normalizuje
    const g=gHead(q); let proj, excited;
    if(canal==="horizontal"){
      proj=dot3(g, uHC(side));                           // międzyuszna + przednio-tylna
      excited = variant==="cupulo" ? proj<0 : proj>0;    // Ewald II: geo/apo odwracają się
    } else {
      proj=dot3(g, GEXC[CK[canal][side]]);               // + = ampullofugalny = pobudzenie (Ewald III)
      excited = proj>0;                                  // kanały pionowe: bez odwrócenia geo/apo
    }
    const q0=quickPhase(canal, side), s=excited?1:-1, mag=Math.abs(proj);
    return {excited, mag, h:q0.h*s, v:q0.v*s, t:q0.t*s};
  }
  /* ---- dynamika cząstki (etap 2) ----
     Otolit jako cząstka na łuku kanału (φ=kąt łuku; ampułka φ=0, ujście/odnoga wspólna φ≈180).
     Ruch przetłumiony (opór Stokesa, bez bezwładności): dφ/dt ∝ styczna składowa grawitacji.
     Przepływ ampullofugalny (+dφ/dt) pobudza kanał pionowy (Ewald III) i odchyla osklepek ξ,
     który relaksuje z długą stałą czasową (latencja → narastanie → wygasanie). */
  function slerpQ(a,b,t){let d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];
    if(d<0){b=[-b[0],-b[1],-b[2],-b[3]];d=-d;}
    if(d>0.9995){return nrm4([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),a[2]+t*(b[2]-a[2]),a[3]+t*(b[3]-a[3])]);}
    const th=Math.acos(d),s=Math.sin(th),w0=Math.sin((1-t)*th)/s,w1=Math.sin(t*th)/s;
    return [w0*a[0]+w1*b[0],w0*a[1]+w1*b[1],w0*a[2]+w1*b[2],w0*a[3]+w1*b[3]];}
  // geometria łuku kanału (płaszczyzna e1,e2); e1 = kierunek ampułki (φ=0); exc = znak pobudzenia
  // exc=+1: kanały pionowe — pobudza przepływ ampullofugalny (+dφ/dt, Ewald III)
  // exc=-1: kanał poziomy — pobudza przepływ ampullopetalny (Ewald II)
  const CANAL_GEOM={
    posterior: { P:{e1:nrm3([-1,0,1]), e2:[0,-1,0], exc:1},  L:{e1:nrm3([1,0,1]),  e2:[0,-1,0], exc:1} },
    horizontal:{ P:{e1:nrm3([0.87,0,0.5]), e2:nrm3([0.5,0,-0.87]), exc:-1},
                 L:{e1:nrm3([-0.87,0,0.5]), e2:nrm3([-0.5,0,-0.87]), exc:-1} },
    anterior:  { P:{e1:nrm3([1,0,1]),  e2:[0,-1,0], exc:1},  L:{e1:nrm3([-1,0,1]), e2:[0,-1,0], exc:1} } };
  // ROZMIAR/GĘSTOŚĆ CZĄSTKI jako mnożnik promienia r (medium=1 = kalibracja bazowa, r=1 → wynik identyczny):
  //   tauP ∝ r⁻²  (prędkość osiadania Stokesa v ∝ r² → szybszy przepływ);
  //   gc   ∝ r³   (wyparta objętość/masa endolimfy → wychylenie osklepka);
  //   adh  ∝ r    (siła oderwania sfery od ścianki, skalowanie JKR/DMT).
  // Efekt kliniczny: DUŻA cząstka = krótsza latencja, silniejszy i szybszy oczopląs, szybsze wyjście;
  //   MAŁA = długa latencja, słaby i wolny przebieg (por. „extremely long-latency BPPV", ref [11]).
  const SIZE_R={small:0.78, medium:1.0, big:1.35};
  // size liczbowy = mnożnik promienia r; MUSI być > 0. Ujemny/zero odwracał znak gc∝r³ i adh∝r (niefizjologiczny
  // ujemny xi przy prowokacji) lub dawał tauP=∞ (r=0) — rozmiar cząstki NIE zmienia kierunku fizyki. Walidacja jak dt.
  const sizeR=size=>{
    if(typeof size==="number"){
      if(!(size>0) || !isFinite(size)) throw new RangeError("size: rozmiar liczbowy musi być > 0 (podano "+size+")");
      return size;
    }
    return SIZE_R[size]!==undefined ? SIZE_R[size] : 1;   // preset (small/medium/big) lub domyślnie medium (r=1)
  };
  // walidacja pojedynczego segmentu timeline {q, tTrans, tHold} — jasny błąd ZE WSKAZANIEM indeksu (zamiast
  // ogólnego „Cannot read properties of null/undefined" przy segmencie null lub braku q). Zwraca q znormalizowane.
  function reqSegment(seg, i, where){
    if(!seg || typeof seg!=="object") throw new TypeError(where+": timeline["+i+"] musi być obiektem {q, tTrans, tHold}");
    for(const k of ["tTrans","tHold"])
      if(seg[k]!=null && (!(seg[k]>=0) || !isFinite(seg[k]))) throw new RangeError(where+": timeline["+i+"]."+k+" musi być liczbą ≥ 0 (podano "+seg[k]+")");
    return reqQuat(seg.q, where+" timeline["+i+"]");
  }
  // symulacja kanalolitiazy: timeline = [{q, tTrans, tHold}, ...]
  // MODEL FENOMENOLOGICZNY/EDUKACYJNY (nie pełna hydrodynamika — brak ciśnienia transkupularnego, zmiennej
  //   średnicy przewodu, bezwładności płynu, wielu cząstek; pełny model: Squires/Hain/Stone). Szczegóły → engine_doc.txt.
  // Stałe skalibrowane do literatury (kanał tylny): latencja ~1–3 s, szczyt ~7–9 s, trwanie ~25 s.
  //   tauP=6.5  — cząstka (opór); tauC=5 — osklepek (długa stała kanału ~4–6 s);
  //   gc=1.6 — wzmocnienie; phiExit=178 — odnoga wspólna;
  //   fStat/adh — adhezja otolitu (zrywana utrzymaną siłą styczną → latencja; silniejsza
  //   prowokacja = krótsza latencja). Kupulolitiaza nie ma adhezji/latencji (osobna funkcja).
  function simulateCanalith({canal, side, timeline, q0=null, dt=0.05, tauP=6.5, tauC=5, gc=1.6, phiExit=178, fStat=0.04, adh=0.2, size="medium"}){
    reqCanal(canal, side, "simulateCanalith");
    if(!Array.isArray(timeline) || !timeline.length) throw new TypeError("simulateCanalith: timeline musi być NIEPUSTĄ tablicą {q,tTrans,tHold}");
    if(!(dt>0) || !isFinite(dt)) throw new RangeError("simulateCanalith: dt musi być liczbą > 0 (podano "+dt+")");   // dt<=0 → nieskończona pętla
    const r=sizeR(size); tauP=tauP/(r*r); gc=gc*r*r*r; adh=adh*r;   // skalowanie rozmiarem cząstki (patrz SIZE_R)
    const G=CANAL_GEOM[canal][side], D=Math.PI/180, pex=phiExit*D;
    const tang=phi=>{const c=Math.cos(phi),s=Math.sin(phi);
      return [-s*G.e1[0]+c*G.e2[0], -s*G.e1[1]+c*G.e2[1], -s*G.e1[2]+c*G.e2[2]];};
    // pozycja startowa: jawne q0 (1. segment interpoluje Z NIEGO) lub — domyślnie (null) — pierwszy q, czyli
    // 1. segment = pozycja startowa, a jego tTrans to czas W tej pozycji (NIE przejście z neutralnej). Wsteczna zgodność.
    let phi=90*D, xi=0, t=0, exited=false, stuck=true, bond=adh, qPrev=q0!=null?reqQuat(q0,"simulateCanalith q0"):reqSegment(timeline[0],0,"simulateCanalith"); const out=[];
    for(const [si,seg] of timeline.entries()){
      const sq=reqSegment(seg,si,"simulateCanalith");    // waliduje segment (obiekt, q, tTrans/tHold≥0) + normalizuje q (slerpQ zakłada q jednostkowe)
      const total=(seg.tTrans||0)+(seg.tHold||0), steps=Math.round(total/dt);
      for(let i=0;i<steps;i++){
        const u=seg.tTrans>0?Math.min(1,(i*dt)/seg.tTrans):1;
        const g=gHead(slerpQ(qPrev,sq,u));
        let dphi=0, flow=0;
        if(!exited){
          const drive=dot3(g,tang(phi))/tauP;                  // prędkość potencjalna (overdamped)
          if(stuck && Math.abs(drive)>fStat){                  // adhezja: zrywanie utrzymaną siłą
            bond-=(Math.abs(drive)-fStat)*dt; if(bond<=0) stuck=false;
          }
          if(!stuck){
            dphi=drive; let nphi=phi+dphi*dt;
            if(nphi>=pex){nphi=pex; exited=true;}              // odnoga wspólna → woreczek (jednokierunkowo)
            if(nphi<3*D){nphi=3*D; dphi=0;}                    // nie przechodzi przez osklepek
            phi=nphi; flow=gc*G.exc*dphi;                      // ruch wsteczny → przepływ odwrócony → ξ<0
          }
        }
        xi+=dt*(-xi/tauC + flow); t+=dt;
        out.push({t, xi, phi:phi/D, exited});
      }
      qPrev=sq;
    }
    return out;
  }
  // ξ (odchylenie osklepka) → składowe oczopląsu (kierunek z etapu 0, znak z pobudzenia)
  function dynNystagmus(canal, side, xi){
    const q0=quickPhase(canal,side), exc=xi>0, s=exc?1:-1;
    const m=Math.min(1, Math.abs(xi)*(exc?1:0.45));   // Ewald II: rektyfikacja — odpowiedź hamująca słabsza
    return {excited:exc, intensity:m, h:q0.h*s, v:q0.v*s, t:q0.t*s};
  }
  // klasyfikacja fazy oczopląsu względem kierunku prowokującego (ξ>0 = pierwotny/liberatoryjny)
  function nystagmusPhase(xi, thr=0.05){ return xi>thr ? "primary" : xi<-thr ? "reversed" : "none"; }
  // symulacja KUPULOLITIAZY: otolity na osklepku → ciężki osklepek odchylany WPROST grawitacją.
  // Brak cząstki w świetle kanału → brak latencji i uporczywość (trzyma się, dopóki pozycja utrzymana).
  // ξ relaksuje do celu statycznego (rzut grawitacji, znak z reguły Ewalda) z krótką stałą tauCup.
  function simulateCupulolith({canal, side, timeline, q0=null, dt=0.05, tauCup=0.8, gain=1.0, size="medium"}){
    reqCanal(canal, side, "simulateCupulolith");
    if(!Array.isArray(timeline) || !timeline.length) throw new TypeError("simulateCupulolith: timeline musi być NIEPUSTĄ tablicą {q,tTrans,tHold}");
    if(!(dt>0) || !isFinite(dt)) throw new RangeError("simulateCupulolith: dt musi być liczbą > 0 (podano "+dt+")");
    gain=gain*Math.pow(sizeR(size),3);   // cięższy klaster otoconiów → silniejsze wychylenie osklepka (gain ∝ r³); latencji brak (tauCup bez zmian)
    // pozycja startowa: jak w simulateCanalith — jawne q0 lub domyślnie (null) pierwszy q (wsteczna zgodność).
    let xi=0, t=0, qPrev=q0!=null?reqQuat(q0,"simulateCupulolith q0"):reqSegment(timeline[0],0,"simulateCupulolith"); const out=[];
    for(const [si,seg] of timeline.entries()){
      const sq=reqSegment(seg,si,"simulateCupulolith");  // waliduje segment (obiekt, q, tTrans/tHold≥0) + normalizuje q (slerpQ zakłada q jednostkowe)
      const total=(seg.tTrans||0)+(seg.tHold||0), steps=Math.round(total/dt);
      for(let i=0;i<steps;i++){
        const u=seg.tTrans>0?Math.min(1,(i*dt)/seg.tTrans):1;
        const p=position({canal, side, variant:"cupulo", q:slerpQ(qPrev,sq,u)});
        const target=gain*p.mag*(p.excited?1:-1);     // cel statyczny ważony grawitacją (ξ>0 = pobudzenie)
        xi += dt*(target-xi)/tauCup;                   // szybka relaksacja: bez latencji, uporczywy
        t+=dt; out.push({t, xi, target});
      }
      qPrev=sq;
    }
    return out;
  }
  return {isExcitatory, quickPhase, nysMag, nystagmus, gHead, qSupineYaw, qPitch, position,
          simulateCanalith, simulateCupulolith, dynNystagmus, nystagmusPhase,
          qmul, qconj, qaxis, rotate:rotv, GEXC, CANAL_NORMALS};
})();

