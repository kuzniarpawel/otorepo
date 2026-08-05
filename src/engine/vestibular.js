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
  // Źródło: atlas IE-Map (ludzki błędnik, 3D Slicer) — dla każdego kanału dopasowana płaszczyzna PCA
  //   przez uporządkowane punkty osi przewodu. TA SAMA rekonstrukcja, z której pochodzą AMPULLA_DIR
  //   i ARC_SPAN, więc płaszczyzna, położenie bańki i długość łuku mówią o jednym i tym samym kanale.
  //   Wcześniej normalne brano z Wu i wsp. 2021 (Front. Neurol. 12:741948, MRI n=55) — uśrednienie
  //   populacyjne bez informacji o położeniu bańki wzdłuż pętli; zgodność obu źródeł 17.1°.
  //   Kanon kierunkowy: Della Santina i wsp. (2005), JARO 6:191-206, doi:10.1007/s10162-005-0003-x.
  // Ramka GŁOWY (x=prawo, y=góra, z=nos) — bez przeliczania osi. Magnitudy z |składowych|:
  //   PION ∝ |x|(międzyuszna) · POZIOM ∝ |y|(czaszkowa) · SKRĘT ∝ |z|(nosowo-potyliczna).
  // ZNAK normalnej NIE jest konwencją: wybrany tak, by przejście bańka→ujście wzdłuż zmierzonej osi
  //   dawało DODATNI przyrost kąta (reguła prawej dłoni) — to on definiuje „rosnące φ = ampullofugalne".
  // Kontrole: kanały wzajemnie prostopadłe (87.8/87.5/89.8°), koplanarność RA∥LP i RP∥LA 16.0° (Della
  //   Santina podaje realne odchylenie tego rzędu — idealna koplanarność jest idealizacją), L = idealne
  //   lustro P (0.000°). Nachylenie kanału bocznego od poziomu wychodzi 10.4°, nie kanoniczne ~30°:
  //   kanon opisuje POSTAWĘ NATURALNĄ, atlas jest w ramce skanu. Sprawdzone (sonda 39), czy da się to
  //   pogodzić jednym pochyleniem ramki — NIE: nachylenie ma MINIMUM przy +10° i rośnie dopiero przy
  //   ujemnych, a każde pochylenie ≠0 psuje test Roll albo head-hang. Ramka atlasu zostaje bez obrotu;
  //   różnica 10.4 vs 30° jest ODNOTOWANĄ ROZBIEŻNOŚCIĄ (patrz engine_doc R8), nie ukrytą poprawką.
  const CANAL_NORMALS = {
    posterior: { P:[ 0.622019, 0.161240, 0.766221], L:[ 0.622019,-0.161240,-0.766221] },
    anterior:  { P:[-0.803765, 0.039133, 0.593659], L:[-0.803765,-0.039133,-0.593659] },
    horizontal:{ P:[-0.030350, 0.983446,-0.178642], L:[-0.030350,-0.983446, 0.178642] }
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
    const n=CANAL_NORMALS[canal][ear], v=Math.abs(n[0]), h=Math.abs(n[1]), t=Math.abs(n[2]);   // ramka głowy: x=międzyuszna, y=czaszkowa, z=nosowo-potyliczna
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
  const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const nrm4=q=>{const n=Math.hypot(q[0],q[1],q[2],q[3])||1;return [q[0]/n,q[1]/n,q[2]/n,q[3]/n];};
  // walidacja + normalizacja kwaternionu na publicznych wejściach: rotv(q,·) skaluje wektor o |q|²,
  // więc q≠jednostkowy psuje normę grawitacji (rzut → mag → cała dynamika). Zwraca q znormalizowane.
  function reqQuat(q, where){
    if(!Array.isArray(q) || q.length!==4 || q.some(x=>!Number.isFinite(x)))
      throw new TypeError(where+": q musi być skończonym kwaternionem [w,x,y,z]");
    // kwaternion zerowy przechodzi test skończoności, ale nrm4 dzieli przez n||1=1 → zwraca [0,0,0,0]
    // (NIE-jednostkowy) i po cichu fałszuje gHead (rzut grawitacji = 0). Jasny błąd zamiast cichego zera.
    if(Math.hypot(q[0],q[1],q[2],q[3]) < 1e-12)
      throw new RangeError(where+": kwaternion zerowy (norma ≈ 0) nie definiuje orientacji");
    return nrm4(q);
  }
  // q obraca wektory głowy → świata; grawitacja świata = (0,-1,0)
  const gHead=q=>rotv(qconj(reqQuat(q,"gHead")),[0,-1,0]);
  const Q_SUPINE=qaxis([1,0,0],-100);                   // supine head-hanging
  const qSupineYaw=deg=>qmul(Q_SUPINE, qaxis([0,1,0],deg)); // skręt wokół osi czaszki
  const qPitch=deg=>qaxis([1,0,0],deg);                  // +deg = skłon (bow), -deg = odchylenie (lean)
  /* ---- GEOMETRIA KANAŁU: JEDNO ŹRÓDŁO, W CAŁOŚCI ZMIERZONE (2026-08-05) ----
     Etap 1 (rano): silnik miał DWIE niezależne geometrie tego samego kanału — zmierzone normalne do
       magnitud oczopląsu ORAZ ręczną idealizację 45° do dynamiki złogu, rozjechane o 15–20° na KAŻDYM
       kanale. Płaszczyznę ujednolicono: CANAL_GEOM, GEXC i uHC są z niej WYPROWADZONE.
     Etap 2 (ten): zniknęły trzy ostatnie wpisy ręczne. Kierunek bańki (AMPULLA_DIR) był ZAŁOŻENIEM
       anatomicznym, zwrot obiegu (ARC_SPIN) — sześcioma bitami konwencji, a zakres łuku brano z innej
       pracy niż normalne. Wszystkie trzy pochodzą teraz z jednej rekonstrukcji: normalna z PCA punktów
       osi, bańka z (A−C), ujście z (O−C), zwrot z monotoniczności Q0→Q4.
     Zostaje JEDNO wejście spoza pomiaru: reguły Ewalda II/III (która strona przepływu pobudza) —
       to fizjologia, nie geometria. */
  // KIERUNEK BAŃKI (φ=0) — ZMIERZONY (2026-08-05), już nie założony. Atlas IE-Map: dla każdego kanału
  // środek okręgu C, środek bańki A, ujście O oraz UPORZĄDKOWANE punkty osi Q0=A → Q4=O. e1 = rzut (A−C)
  // na płaszczyznę PCA kanału. Przeliczenie ze Slicer-RAS do ramki głowy: pozycje (X,Z,Y); normalna jest
  // wektorem OSIOWYM, a odwzorowanie ma wyznacznik −1, więc jej znak się odwraca.
  // Weryfikacja: kanały wzajemnie prostopadłe (87.8/87.5/89.8°), zgodność z normalnymi Wu 17.1°
  // (alternatywne przypisania osi dawały 80–85°), lewa strona = idealne lustro prawej (różnica 0.000°).
  const AMPULLA_DIR = {
    posterior: { P:[-0.5174,-0.6498,0.5568], L:[0.5174,-0.6498,0.5568] },
    anterior:  { P:[0.4703,-0.5693,0.6743],  L:[-0.4703,-0.5693,0.6743] },
    horizontal:{ P:[-0.1794,0.1705,0.9689],  L:[0.1794,0.1705,0.9689] } };
  // ZWROT OBIEGU ŁUKU — też WYPROWADZONY: przyrosty kąta wzdłuż uporządkowanej osi Q0→Q4 są monotonicznie
  // DODATNIE dla wszystkich trzech kanałów obu stron (tylny 11.4/130.6/132.9/43.9 · przedni 15.7/105.2/
  // 113.4/46.7 · boczny 21.6/107.9/113.3/24.6), więc „rosnące φ = ampullofugalne" wynika z pomiaru.
  // Znosi to dawną tabelę ARC_SPIN = 6 bitów konwencji wpisanych ręcznie.
  function canalBasis(canal, ear){                      // baza łuku: e1 = bańka (φ=0), e2 = n × e1 (rosnące φ)
    const n=nrm3(CANAL_NORMALS[canal][ear]), a=AMPULLA_DIR[canal][ear], k=dot3(a,n);
    const e1=nrm3([a[0]-k*n[0], a[1]-k*n[1], a[2]-k*n[2]]);   // rzut kierunku bańki na zmierzoną płaszczyznę
    return { e1, e2:nrm3(cross3(n,e1)) };
  }
  // geometria łuku kanału (płaszczyzna e1,e2); e1 = kierunek ampułki (φ=0); exc = znak pobudzenia
  // exc=+1: kanały pionowe — pobudza przepływ ampullofugalny (+dφ/dt, Ewald III)
  // exc=-1: kanał poziomy — pobudza przepływ ampullopetalny (Ewald II)
  const CANAL_GEOM=(()=>{
    const EXC={posterior:1, anterior:1, horizontal:-1}, out={};
    for(const canal of ["posterior","horizontal","anterior"]){
      out[canal]={};
      for(const ear of ["P","L"]){ const b=canalBasis(canal,ear); out[canal][ear]={e1:b.e1, e2:b.e2, exc:EXC[canal]}; }
    }
    return out;
  })();
  // OŚ POBUDZENIA — nie tabela, tylko STYCZNA do łuku w miejscu, gdzie złóg naprawdę leży.
  // Dawniej: GEXC (kanały pionowe) = −e1 i uHC (poziomy) = +e1, czyli styczna liczona w φ=90° —
  // tej samej wpisanej stałej, którą usunął restPhi. Przy zmierzonym łuku złóg spoczywa w 48.8°/199.8°/3°,
  // więc oś pobudzenia liczona w 90° opisywała inne miejsce kanału niż to, którym rusza symulacja:
  // kierunek oczopląsu w karcie testu potrafił być PRZECIWNY do wyniku dynamiki tej samej pozy.
  const tangAt=(G,phiDeg)=>{ const r=phiDeg*Math.PI/180, c=Math.cos(r), s=Math.sin(r);
    return [-s*G.e1[0]+c*G.e2[0], -s*G.e1[1]+c*G.e2[1], -s*G.e1[2]+c*G.e2[2]]; };
  // zachowane dla zgodności API (oś pobudzenia w konwencji „styczna przy φ=90")
  const neg3=v=>[-v[0],-v[1],-v[2]];
  const GEXC={ RP:neg3(CANAL_GEOM.posterior.P.e1), LP:neg3(CANAL_GEOM.posterior.L.e1),
               RA:neg3(CANAL_GEOM.anterior.P.e1),  LA:neg3(CANAL_GEOM.anterior.L.e1) };
  // ZAKRES ŁUKU: od ŚRODKA BAŃKI (φ=0) do ujścia do przedsionka/łagiewki (φ=phiExit) — POMIAR, nie idealizacja.
  // Źródło: Cárdenas-Serna & Jeffery — współrzędne anatomiczne 96 ludzkich błędników kostnych (48 dorosłych),
  //   Zenodo doi:10.5281/zenodo.4818568 (opis: PMC8819049). Wartości = duży łuk od środka bańki do
  //   przeciwległego ujścia, po rzucie kanału na jego najlepiej dopasowaną płaszczyznę:
  //     przedni → ujście odnogi wspólnej   265.8° ± 7.1°  (zakres 249.2–279.4)
  //     tylny   → ujście odnogi wspólnej   307.0° ± 5.3°  (zakres 295.1–319.5)
  //     boczny  → ujście niebańkowe        236.8° ± 10.1° (zakres 213.4–254.5)
  //   Zgodne kierunkowo z θs Bradshaw i wsp. 2010 (JARO, doi:10.1007/s10162-009-0195-6): 271.7/324.7/249.2°
  //   dla błędnika błoniastego — θs liczone między GRANICAMI przedsionkowymi, nie od środka bańki, stąd
  //   systematycznie wyższe (od granicy bańka–przedsionek nasze wartości rosną do 281.5/320.4/255.8°).
  // TO ZAMYKA R1: do 2026-08-05 model miał JEDEN globalny phiExit=178°, czyli ujście DOKŁADNIE naprzeciw
  //   bańki. Anatomicznie oba końce przewodu uchodzą do łagiewki — leżą OBOK siebie — a pętla biegnie
  //   między nimi długą drogą (~2/3 do 5/6 okręgu). Skutkiem było to, że minimum grawitacyjne w KAŻDEJ
  //   pozycji prowokującej (φ_eq: tylny 189.6°, przedni 207.1°) leżało POZA końcem łuku, więc złóg zawsze
  //   dobijał do odnogi. Przy zmierzonym zakresie φ_eq leży W ŚRODKU łuku dla wszystkich 6 kanałów.
  // UWAGA: to dane błędnika KOSTNEGO — „przedsionek" jest anatomicznym przybliżeniem ujścia do łagiewki.
  const ARC_SPAN = { anterior:281.1, posterior:318.8, horizontal:267.3 };   // ZMIERZONE na tym samym atlasie co AMPULLA_DIR
  // Kontrola: suma kątów po polilinii Q0→Q4 zgadza się z prostym kątem A→O co do 0.1° (kanał jest dobrze
  // opisany okręgiem; promienie |Qi−C| 2.3–3.9 mm bez odstających). Wartości Cárdenas-Serna (265.8/307.0/
  // 236.8) mierzą to samo na 48 błędnikach i leżą w tym samym zakresie — atlas wybrano, bo daje KOMPLET
  // (płaszczyzna + bańka + ujście + zwrot) z JEDNEGO źródła, bez zszywania trzech prac.
  const CUPULA_DEG=3;                                   // złóg nie przechodzi przez osklepek — kres łuku od strony bańki
  /* SPOCZYNEK ZŁOGU — WYPROWADZONY, nie wpisany (2026-08-05).
     Silnik startował KAŻDĄ symulację od φ=90°: stałej dobranej pod dawny łuk 178° (środek pętli).
     Przy zmierzonym łuku 267–319° to punkt bez znaczenia anatomicznego, a dla kanału poziomego
     wręcz taki, w którym styczna składowa grawitacji nie przekracza tarcia statycznego — Roll test
     nie ruszał złogu w ogóle. Teraz start = MINIMUM GRAWITACYJNE w postawie pionowej (tam, gdzie
     osad leży, zanim badanie się zacznie), a gdy to minimum wypada POZA łukiem — osklepek.
     Wychodzi: tylny 48.8° (tuż za bańką — klasyczny opis), poziomy 199.8° (ramię niebańkowe),
     przedni 3° (osklepek: minimum kanału przedniego leży w przedsionku, więc kanał NIE MA
     stabilnego spoczynku w pionie — to samo, czym tłumaczy się rzadkość BPPV kanału przedniego). */
  function restPhi(canal, side){
    const G=CANAL_GEOM[canal][side], g=gHead([1,0,0,0]);
    const a=Math.atan2(dot3(g,G.e2), dot3(g,G.e1))*180/Math.PI, eq=((a%360)+360)%360;
    return (eq>CUPULA_DEG && eq<ARC_SPAN[canal]) ? eq : CUPULA_DEG;
  }
  /* NAPĘD W SPOCZYNKU — decyduje, czy złóg jest w ogóle PRZYKLEJONY. Gdy spoczynek jest prawdziwym
     minimum (tylny, poziomy), styczna składowa = 0: złóg leży swobodnie i trzyma go adhezja, którą
     prowokacja musi zerwać — stąd LATENCJA. Gdy minimum wypada poza łukiem (kanał przedni), złóg jest
     DOCISKANY do osklepka stałą siłą 0.131 (przy progu fStat 0.04): nie trzyma go wiązanie, tylko
     grawitacja, więc po odwróceniu głowy rusza BEZ zrywania adhezji. Model przewiduje z tego brak
     latencji w kanale przednim — zgodnie z opisami BPPV kanału przedniego (latencja krótka/nieobecna).
     Bez tego test deep head-hang nie dawał ŻADNEGO oczopląsu: 0.5 s przejścia nie starcza, by zużyć
     wiązanie adh=0.2, a w manewrze Yacovino zużywał je dopiero 6-sekundowy krok „pacjent siedzi". */
  function restDrive(canal, side, tauP){
    const G=CANAL_GEOM[canal][side], g=gHead([1,0,0,0]), phi=restPhi(canal,side)*Math.PI/180;
    const c=Math.cos(phi), sn=Math.sin(phi);
    return dot3(g,[-sn*G.e1[0]+c*G.e2[0], -sn*G.e1[1]+c*G.e2[1], -sn*G.e1[2]+c*G.e2[2]])/tauP;
  }
  // stymulacja chorego kanału w danej orientacji głowy
  function position({canal, side, variant, q}){
    reqCanal(canal, side, "position");
    if(variant!=null && variant!=="cupulo" && variant!=="canalo") throw new TypeError('position: nieznany variant "'+variant+'" (dozwolone: "cupulo"|"canalo"|brak)');
    q=reqQuat(q, "position");            // waliduje (skończony, dł. 4) i normalizuje
    const g=gHead(q), G=CANAL_GEOM[canal][side];
    // napęd styczny TAM, GDZIE ZŁÓG LEŻY (restPhi) — ta sama wielkość, którą całkuje simulateCanalith,
    // więc karta testu i symulacja nie mogą już pokazać przeciwnych kierunków.
    const drive=dot3(g, tangAt(G, restPhi(canal, side)));   // >0 = ampullofugalny (rosnące φ)
    let proj=G.exc*drive;                                   // exc: +1 pionowe (Ewald III), −1 poziomy (Ewald II)
    const excited = (canal==="horizontal" && variant==="cupulo") ? proj<0 : proj>0;   // geo/apo odwracają się tylko w kanale poziomym
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
  // (CANAL_GEOM jest teraz WYPROWADZONE z CANAL_NORMALS — patrz „GEOMETRIA KANAŁU: JEDNO ŹRÓDŁO" wyżej)
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
  // MĘCZLIWOŚĆ (fatigability) oczopląsu — kryterium RÓŻNICUJĄCE kanalolitiaza↔kupulolitiaza.
  //   Przy POWTÓRZENIACH prowokacji w tej samej sesji (seryjny Dix–Hallpike) zbity klaster otoconiów ROZPRASZA
  //   SIĘ na mniejsze, mniej spójne fragmenty → słabsze zbiorcze wychylenie osklepka → oczopląs SŁABNIE z każdym
  //   powtórzeniem (klasyczny objaw KANALOLITIAZY). KUPULOLITIAZA (złóg przylega do osklepka, nie rozprasza się)
  //   NIE męczy się — dlatego simulateCupulolith NIE ma tego czynnika, a różnica jest emergentną cechą różnicującą.
  //   rep = numer powtórzenia (0 = pierwsza prowokacja = pełna odpowiedź). Czynnik ∈ [fatFloor,1] skaluje gc
  //   (wzmocnienie wychylenia osklepka) → maleje AMPLITUDA ξ i oczopląsu; geometria/latencja BEZ ZMIAN (dominujący,
  //   bezsporny efekt kliniczny to spadek amplitudy). fatTau = skala zaniku (w powtórzeniach), fatFloor = resztka.
  function fatigueFactor(rep=0, {fatTau=2.0, fatFloor=0.06}={}){
    if(!(fatTau>0) || !isFinite(fatTau)) throw new RangeError("fatigueFactor: fatTau musi być liczbą > 0 (podano "+fatTau+")");
    const n = (Number.isFinite(rep) && rep>0) ? rep : 0;   // rep 0 / ujemny / NaN = brak męczliwości (czynnik = 1)
    const fl = Math.min(1, Math.max(0, fatFloor));         // podłoga (resztkowa amplituda) w [0,1]
    return fl + (1-fl)*Math.exp(-n/fatTau);                // rep=0 → 1; monotoniczny zanik do fl
  }
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
  //   gc=1.6 — wzmocnienie; phiExit=178 — koniec nieampułkowy = wyjście do ŁAGIEWKI (kan. pionowe: odnoga wspólna; poziomy: wprost);
  //   fStat/adh — adhezja otolitu (zrywana utrzymaną siłą styczną → latencja; silniejsza
  //   prowokacja = krótsza latencja). Kupulolitiaza nie ma adhezji/latencji (osobna funkcja).
  // KOMORA ODNOGI WSPÓLNEJ + ŁAGIEWKA (kanały PIONOWE: tylny+przedni; poziomy NIE ma odnogi → wyjście wprost).
  //   Anatomicznie „dotarcie do końca łuku" (φ=phiExit) ≠ „wpadnięcie do łagiewki" — to DWA zdarzenia. Złóg po
  //   dojściu do odnogi (φ≥phiExit−crusArc) WCHODZI DO KOMORY ODNOGI i PARKUJE: opuszcza czuły kanał, osklepek
  //   relaksuje (brak oczopląsu), czeka na ekspulsję do łagiewki. Ekspulsja ma DWIE fizjologiczne drogi:
  //     • GRAWITACYJNA (wolna): przy głowie pionowej (siad) łagiewka jest POD odnogą → złóg wpada. Warunek
  //       −gHead_y > crusGrav (gHead·[0,−1,0]). To daje ekspulsję Epleya PRZY SIADZIE + oczopląs liberacyjny.
  //     • BEZWŁADNOŚCIOWA (szybka): gwałtowny przerzut o duży kąt (Semont ~180°) wyrzuca złóg z odnogi siłami
  //       bezwładności, niezależnie od grawitacji. Proxy: kąt przejścia segmentu > crusFling ORAZ prędkość
  //       kątowa kąt/tTrans > crusFlingRate. Sam kąt NIE wystarczy — bezwładność jest funkcją PRĘDKOŚCI, więc
  //       ten sam przerzut 180° wykonany POWOLI (np. tTrans 20 s) nie może wyrzucać złogu. To utrzymuje
  //       ekspulsję Semonta PRZY RZUCIE (155° w 0,8 s ≈ 194°/s), a odrzuca powolne przetoczenia.
  //   Ekspulsja przesuwa φ: (phiExit−crusArc)→phiExit w czasie ~EXPEL_DUR → TRANSJENT oczopląsu w kierunku
  //   ampullofugalnym (TEN SAM znak co pierwotny) = liberacyjny/potwierdzający. Uzasadnienie liczbowe i
  //   walidacja per manewr → engine_doc.txt. Kanał poziomy: bez komory (koniec nieampułkowy uchodzi wprost).
  /* ---- SIŁA WŁAŚCIWA f = g − a (zasada równoważności) [R7, 2026-08-05] ----
     Do tej daty złóg reagował na SAMĄ grawitację. To czyniło Semonta i Bascule nieodwzorowywalnymi
     z powodu STRUKTURALNEGO, nie liczbowego: obrót ciała o 180° odwraca gHead DOKŁADNIE (Rz(180)
     przeprowadza (0,−1,0) w (0,+1,0) niezależnie od ustawienia głowy względem tułowia), więc minimum
     drugiego rzutu leży dokładnie 180° od pierwszego i złóg ląduje w punkcie NIESTABILNYM — styczna
     składowa zero, żaden hold i żadne tauP tego nie ruszy. Dawne „działanie" Semonta pochodziło
     z ręcznie dopisanego do LEAN_G wektora ku czubkowi głowy (+0.6), który łamał tę symetrię.
     Ten wektor okazał się TĄ SAMĄ WIELKOŚCIĄ, tylko wpisaną: podczas rzutu błędnik jedzie po łuku
     wokół osi obrotu, więc doznaje przyspieszenia dośrodkowego skierowanego KU osi, a siła właściwa
     f = g − a zyskuje składową ku czubkowi o module ω²·L/g. Dla rzutu 180° w 0,8 s i L=0,75 m wychodzi
     1,2 g — ten sam kierunek i ten sam rząd co wpisane 0,6 (0,6 g odpowiada rzutowi 180° w ~1,16 s).
     ω bierzemy z TEJ SAMEJ interpolacji, która steruje pozą (slerp o stałym tempie): ω = Θ/tTrans wokół
     osi obrotu względnego. Człon styczny (α×d) POMIJAMY — przy stałym tempie α=0 poza granicami
     segmentów, a profil prędkości, który dałby α, nie istnieje w danych aplikacji. To zaniżenie,
     nie zawyżenie: model bierze tylko tę część bezwładności, którą interpolacja naprawdę określa.
     RAMIĘ (jedyne nowe wejście — antropometria, nie parametr dopasowywany):
       body 0.75 m — oś w biodrach/kozetce; siad→leżenie, rzut boczny, przewrót ciała
       neck 0.12 m — oś u podstawy szyi; sam skręt/pochylenie głowy przy nieruchomym tułowiu
       earX 0.075 m — półrozstaw międzyuszny: błędnik NIE leży na osi czaszki, więc sam skręt szyi
                      też daje (mały) człon dośrodkowy. Bez tego skręt głowy byłby zupełnie bezwładny. */
  const G0=9.81, LEVER={body:0.75, neck:0.12}, EAR_X=0.075;
  function angVel(qPrev, sq, tTrans){        // ω [rad/s] w RAMCE GŁOWY (oś obrotu względnego jest w niej stała)
    if(!(tTrans>0)) return [0,0,0];
    let r=qmul(qconj(qPrev), sq); if(r[0]<0) r=[-r[0],-r[1],-r[2],-r[3]];
    const v=Math.hypot(r[1],r[2],r[3]); if(v<1e-9) return [0,0,0];
    const w=2*Math.atan2(v, r[0])/tTrans;
    return [w*r[1]/v, w*r[2]/v, w*r[3]/v];
  }
  function specForce(g, wv, side, pivot){    // f = g − a/g0, a = ω × (ω × d) [dośrodkowe]
    if(!wv[0] && !wv[1] && !wv[2]) return g;
    const d=[(side==="P"?EAR_X:-EAR_X), LEVER[pivot]||LEVER.body, 0];   // oś obrotu → błędnik, w ramce głowy
    const c1=cross3(wv,d), a=cross3(wv,c1);
    return [g[0]-a[0]/G0, g[1]-a[1]/G0, g[2]-a[2]/G0];
  }
  function simulateCanalith({canal, side, timeline, q0=null, phi0=null, dt=0.05, tauP=6.5, tauC=5, gc=1.6, phiExit=null, fStat=0.04, adh=0.2, size="medium", rep=0, fatTau=2.0, fatFloor=0.06, crusArc=12, crusGrav=0.6, crusFling=145, crusFlingRate=180}){
    reqCanal(canal, side, "simulateCanalith");
    if(phiExit==null) phiExit=ARC_SPAN[canal];   // domyślnie ZMIERZONY zakres łuku per kanał (było: globalne 178°)
    if(!(phiExit>0) || !isFinite(phiExit)) throw new RangeError("simulateCanalith: phiExit musi być liczbą > 0 (podano "+phiExit+")");
    if(!Array.isArray(timeline) || !timeline.length) throw new TypeError("simulateCanalith: timeline musi być NIEPUSTĄ tablicą {q,tTrans,tHold}");
    if(!(dt>0) || !isFinite(dt)) throw new RangeError("simulateCanalith: dt musi być liczbą > 0 (podano "+dt+")");   // dt<=0 → nieskończona pętla
    const r=sizeR(size); tauP=tauP/(r*r); gc=gc*r*r*r*fatigueFactor(rep,{fatTau,fatFloor}); adh=adh*r;   // skalowanie rozmiarem cząstki (SIZE_R) × męczliwość (dyspersja przy powtórzeniach, rep)
    const G=CANAL_GEOM[canal][side], D=Math.PI/180, pex=phiExit*D, pcrus=(phiExit-crusArc)*D;
    const crusGate=(canal==="posterior"||canal==="anterior");   // odnoga wspólna TYLKO dla kanałów pionowych; poziomy → wyjście wprost
    const EXPEL_DUR=1.2, expelRate=(pex-pcrus)/EXPEL_DUR;        // tempo ekspulsji odnoga→łagiewka (transjent liberacyjny)
    const q4dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3];  // do kąta przejścia (bezwładność)
    const tang=phi=>{const c=Math.cos(phi),s=Math.sin(phi);
      return [-s*G.e1[0]+c*G.e2[0], -s*G.e1[1]+c*G.e2[1], -s*G.e1[2]+c*G.e2[2]];};
    // pozycja startowa: jawne q0 (1. segment interpoluje Z NIEGO) lub — domyślnie (null) — pierwszy q, czyli
    // 1. segment = pozycja startowa, a jego tTrans to czas W tej pozycji (NIE przejście z neutralnej). Wsteczna zgodność.
    let phi=(phi0!=null?phi0:restPhi(canal,side))*D, xi=0, t=0, exited=false, stuck=Math.abs(restDrive(canal,side,tauP))<=fStat, inCrus=false, expelling=false, bond=adh, qPrev=q0!=null?reqQuat(q0,"simulateCanalith q0"):reqSegment(timeline[0],0,"simulateCanalith"); const out=[];
    for(const [si,seg] of timeline.entries()){
      const sq=reqSegment(seg,si,"simulateCanalith");    // waliduje segment (obiekt, q, tTrans/tHold≥0) + normalizuje q (slerpQ zakłada q jednostkowe)
      const wv = angVel(qPrev, sq, seg.tTrans);          // prędkość kątowa przejścia (stała — slerp o stałym tempie)
      const pivot = seg.pivot || "body";                  // oś obrotu kroku: "body" (biodra/kozetka) | "neck" (sama głowa)
      const flingDeg = 2*Math.acos(Math.min(1,Math.abs(q4dot(qPrev,sq))))*180/Math.PI;   // kąt przejścia INTO tego segmentu
      // PRĘDKOŚĆ kątowa przejścia [°/s] — bezwładność zależy od NIEJ, nie od samego kąta. tTrans=0 (skok
      // orientacji) = przejście natychmiastowe → prędkość nieskończona (zachowuje dawne zachowanie kąt-only).
      const flingRate = seg.tTrans>0 ? flingDeg/seg.tTrans : Infinity;
      const flung = flingDeg>crusFling && flingRate>crusFlingRate;   // gwałtowny przerzut (Semont): duży kąt SZYBKO
      const total=(seg.tTrans||0)+(seg.tHold||0), steps=Math.round(total/dt);
      for(let i=0;i<steps;i++){
        const u=seg.tTrans>0?Math.min(1,(i*dt)/seg.tTrans):1;
        const g0v=gHead(slerpQ(qPrev,sq,u));
        const g = u<1 ? specForce(g0v, wv, side, pivot) : g0v;   // W TRAKCIE przejścia działa siła właściwa; w holdzie ω=0 → f=g
        let dphi=0, flow=0;
        if(!exited){
          if(crusGate && inCrus){
            // złóg w KOMORZE ODNOGI WSPÓLNEJ — poza czułym kanałem (osklepek relaksuje). Czeka na ekspulsję do łagiewki.
            if(!expelling && (-g[1] > crusGrav || flung)) expelling=true;   // GRAWITACYJNA (siad: łagiewka pod odnogą) LUB BEZWŁADNOŚCIOWA (szybki przerzut, np. Semont)
            if(expelling){                                     // transjent ekspulsji: φ pcrus→pex → oczopląs liberacyjny (ampullofugalny, TEN SAM znak co pierwotny)
              dphi=expelRate; let nphi=phi+dphi*dt;
              if(nphi>=pex){nphi=pex; exited=true; expelling=false;}   // wpadł do łagiewki (jednokierunkowo)
              phi=nphi; flow=gc*G.exc*dphi;
            }
          } else {
            const drive=dot3(g,tang(phi))/tauP;                // prędkość potencjalna (overdamped) — wędrówka w świetle kanału
            if(stuck && Math.abs(drive)>fStat){                // adhezja: zrywanie utrzymaną siłą
              bond-=(Math.abs(drive)-fStat)*dt; if(bond<=0) stuck=false;
            }
            if(!stuck){
              dphi=drive; let nphi=phi+dphi*dt;
              if(crusGate){ if(nphi>=pcrus){ dphi=Math.max(0,pcrus-phi)/dt; nphi=pcrus; inCrus=true; } }   // dotarł do odnogi → PARKUJE (opuszcza czuły kanał); dphi = realny dojazd
              else if(nphi>=pex){ nphi=pex; exited=true; }     // POZIOMY: brak odnogi — wyjście wprost do łagiewki
              if(nphi<CUPULA_DEG*D){nphi=CUPULA_DEG*D; dphi=0;} // nie przechodzi przez osklepek
              phi=nphi; flow=gc*G.exc*dphi;                    // ruch wsteczny → przepływ odwrócony → ξ<0
            }
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
  // KUPULOLITIAZA SŁABSZA OD KANALOLITIAZY [1] — współczynnik amplitudy (cecha RÓŻNICUJĄCA obok latencji/uporczywości).
  //   Złóg PRZYKLEJONY do osklepka odchyla go słabiej niż bolus swobodnych otoconiów, który przy kanalolitiazie
  //   napędza całą kolumnę endolimfy (efekt „tłoka"). Klinicznie: oczopląs kupulolityczny jest MNIEJ intensywny,
  //   lecz UPORCZYWY (bez wygasania) i NIEmęczliwy — uporczywość/niemęczliwość już modelujemy (tauCup, brak rep),
  //   ten współczynnik domyka RÓŻNICĘ SIŁY. Skaluje ξ (simulateCupulolith) i oczopląs diagnostyczny wariantu
  //   „cupulo" (nysFromGeom) — JEDNO źródło prawdy. Wartość = wybór KALIBRACYJNY (model fenomenologiczny), spójny
  //   z „mniej intensywny, bardziej uporczywy" i z zakresem SPV apogeotropowy ≈ 0.4–0.7× geotropowy (kan. poziomy);
  //   NIE stała wyprowadzona z hydrodynamiki. Jeden globalny mnożnik (uproszczenie: nie per-kanał/per-geometria).
  const CUP_WEAK=0.6;
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
        const target=CUP_WEAK*gain*p.mag*(p.excited?1:-1);   // cel statyczny ważony grawitacją (ξ>0 = pobudzenie); CUP_WEAK: kupulo słabsza od kanalo [1]
        xi += dt*(target-xi)/tauCup;                   // szybka relaksacja: bez latencji, uporczywy
        t+=dt; out.push({t, xi, target});
      }
      qPrev=sq;
    }
    return out;
  }
  return {isExcitatory, quickPhase, nysMag, nystagmus, gHead, qSupineYaw, qPitch, position,
          simulateCanalith, simulateCupulolith, dynNystagmus, nystagmusPhase, fatigueFactor,
          qmul, qconj, qaxis, rotate:rotv, GEXC, CANAL_NORMALS, CANAL_GEOM, ARC_SPAN, restPhi, CUP_WEAK};
})();

