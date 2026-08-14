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
  // Źródło: atlas IE-Map — Ahmadi, Raiser, Rühl, Flanagin, zu Eulenburg (2021) „IE-Map: a novel in-vivo
  //   atlas and template of the human inner ear", Sci Rep 11:3293, doi:10.1038/s41598-021-82716-0
  //   (MRI 3T, CISS 0.5 mm izo → template 0.2 mm izo, n=63 osób / 126 uszu, CC BY 4.0).
  //   Dla każdego kanału dopasowana płaszczyzna PCA przez uporządkowane punkty osi przewodu. TA SAMA
  //   rekonstrukcja, z której pochodzą AMPULLA_DIR i ARC_SPAN, więc płaszczyzna, położenie bańki
  //   i długość łuku mówią o jednym i tym samym kanale.
  //   RAMKA: template jest wyrównany do STANDARDOWEJ PŁASZCZYZNY REIDA (punkt podoczodołowy + przewód
  //   słuchowy zewnętrzny, obustronnie) — czyli do zdefiniowanej płaszczyzny czaszkowej, nie do ramki
  //   skanera. Dlatego ramkę atlasu bierzemy jako ramkę głowy BEZ obrotu (patrz engine_doc R9).
  //   Wcześniej normalne brano z Wu i wsp. 2021 (Front. Neurol. 12:741948, MRI n=55) — uśrednienie
  //   populacyjne bez informacji o położeniu bańki wzdłuż pętli; zgodność obu źródeł 17.1°.
  //   Kanon kierunkowy: Della Santina i wsp. (2005), JARO 6:191-206, doi:10.1007/s10162-005-0003-x.
  // Ramka GŁOWY (x=prawo, y=góra, z=nos) — bez przeliczania osi. Magnitudy z |składowych|:
  //   PION ∝ |x|(międzyuszna) · POZIOM ∝ |y|(czaszkowa) · SKRĘT ∝ |z|(nosowo-potyliczna).
  // ZNAK normalnej NIE jest konwencją: wybrany tak, by przejście bańka→ujście wzdłuż zmierzonej osi
  //   dawało DODATNI przyrost kąta (reguła prawej dłoni) — to on definiuje „rosnące φ = ampullofugalne".
  // Kontrole: kanały wzajemnie prostopadłe (87.8/87.5/89.8° — kąty PŁASZCZYZN mod 180; między
  //   znakowanymi normalnymi z pliku: 92.2/92.5/89.8, bo konwencja ampullofugalna odwraca część
  //   wektorów), koplanarność RA∥LP i RP∥LA 16.0° (Della Santina podaje realne odchylenie tego rzędu
  //   — idealna koplanarność jest idealizacją), L = lustro P (0.000° — KONWENCJA transkrypcji: wpisy L
  //   są odbiciem wpisów P, nie niezależną rekonstrukcją; asymetria międzyuszna niemodelowana).
  //   Nachylenie kanału bocznego od poziomu wychodzi 10.4°, nie kanoniczne ~30°:
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
  //   posterior.h: geom.≈0.21 (klin. pomijany) · anterior.t: geom.≈0.74 (override: czysty downbeat)
  //   horizontal.t: geom.≈0.18 (klin. czysto poziomy)   [liczby żywe IE-Map 2026-08-13; stare
  //   0.41/0.78/0.29 pochodziły z wektorów Wu]. ZNAK posterior.h POPRAWIONY 2026-08-13 (ocena II, A4):
  //   znakowana geometria (oś pobudzenia Ω=−n, Ewald III) daje składową poziomą KONTRA (−0.21), więc
  //   quickPhase wiąże ją z −ipsi — flaga jest od teraz bezpieczna do odsłonięcia (dziś false → h=0,
  //   zmiana martwa dla wyników).
  const NYS_SHOW = { posterior:{h:false,t:true}, anterior:{h:false,t:false}, horizontal:{t:false} };
  function quickPhase(canal, ear /* 'L'|'P' */){
    const ipsi = ear==="P" ? +1 : -1;                 // + = strona prawa
    const m = nysMag(canal, ear);                     // realne magnitudy z CANAL_NORMALS
    if(canal==="horizontal") return {h: ipsi*m.h, v:0, t: NYS_SHOW.horizontal.t ? ipsi*m.t : 0};       // poziomy ku pobudzonemu uchu
    if(canal==="posterior")  return {h: NYS_SHOW.posterior.h ? -ipsi*m.h : 0, v:+m.v, t: NYS_SHOW.posterior.t ? ipsi*m.t : 0}; // upbeat + skręt ku uchu; realne v:t≈0.81:1; h KONTRA (−ipsi, A4)
    if(canal==="anterior")   return {h: NYS_SHOW.anterior.h ? ipsi*m.h : 0, v:-m.v, t: NYS_SHOW.anterior.t ? ipsi*m.t : 0};   // downbeat; override klin. t:0 (geom. skręt ≈0.74)
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
  // (Q_SUPINE/qSupineYaw/qPitch USUNIĘTE 2026-08-05: kodowały starą konwencję pozy — stały zwis −100°
  //  dla WSZYSTKICH póz leżących. Pozy pochodzą teraz z POSE_SPEC w pose/maneuvers.js, gdzie każdy kąt
  //  ma źródło w zdaniu instrukcji. Zostawione dawałyby drugą, cichą drogę do tej samej rozbieżności.)
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
  // Weryfikacja: kanały wzajemnie prostopadłe (87.8/87.5/89.8°), zgodność z KONTROLNĄ pracą Wu 17.1°
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
  // ZAKRES ŁUKU: od ŚRODKA BAŃKI (φ=0) do ujścia do przedsionka/łagiewki (φ=phiExit).
  // ŹRÓDŁO: atlas IE-Map — to samo, z którego pochodzą CANAL_NORMALS i AMPULLA_DIR (patrz nagłówek
  //   pliku). Kąt liczony między rzutami (A−C) i (O−C) na dopasowaną płaszczyznę PCA kanału.
  //   Kontrola wewnętrzna: suma kątów po polilinii Q0→Q4 zgadza się z prostym kątem A→O co do 0.1°
  //   (kanał dobrze opisany okręgiem; promienie |Qi−C| 2.3–3.9 mm bez odstających); L = lustro P (0.000°).
  // KONTROLA ZEWNĘTRZNA (nie źródło — wartości NIE pochodzą z tych prac):
  //   Cárdenas-Serna & Jeffery, 96 błędników kostnych (Zenodo doi:10.5281/zenodo.4818568, opis PMC8819049):
  //     przedni 265.8°±7.1 · tylny 307.0°±5.3 · boczny 236.8°±10.1 — ten sam pomiar, ten sam rząd.
  //   Bradshaw i wsp. 2010 (JARO doi:10.1007/s10162-009-0195-6), błędnik BŁONIASTY: θs 271.7/324.7/249.2° —
  //     liczone między GRANICAMI przedsionkowymi, nie od środka bańki, więc systematycznie wyższe.
  //   Cherchi 2026 (PMC12799655) zwraca uwagę, że klasyczne schematy używają łuku 180° albo błędnego
  //     odcinka przednio-przyśrodkowego, podczas gdy realny kanał boczny ma odcinek tylno-przyśrodkowy
  //     i łuk ~240° — kierunkowo zgodne z naszymi 267.3°.
  // TO ZAMKNĘŁO R1: do 2026-08-05 model miał JEDEN globalny phiExit=178°, czyli ujście DOKŁADNIE naprzeciw
  //   bańki. Anatomicznie oba końce przewodu uchodzą do łagiewki — leżą OBOK siebie — a pętla biegnie
  //   między nimi długą drogą. Skutkiem było to, że minimum grawitacyjne w KAŻDEJ pozycji prowokującej
  //   leżało POZA końcem łuku, więc złóg zawsze dobijał do odnogi — diagnostyka wykonywała pracę manewru.
  const ARC_SPAN = { anterior:281.1, posterior:318.8, horizontal:267.3 };
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
    if(eq>CUPULA_DEG && eq<ARC_SPAN[canal]) return eq;
    // KLAMRA PER KANAŁ (2026-08-13, ocena II A3/V7): minimum ZA UJŚCIEM ≠ minimum za osklepkiem.
    //   POZIOMY (koniec nieampułkowy uchodzi WPROST do łagiewki): minimum za ujściem → spoczynek NA
    //   UJŚCIU — pierwszy krok symulacji wyprowadza złóg (kanał opróżnia się), zamiast dawnej cichej
    //   TELEPORTACJI o ~264° do osklepka (start w ramieniu bańkowym = fenotyp apogeotropowy z niczego).
    //   Przy ramce 0° gałąź jest dla poziomego NIEOSIĄGALNA (eq=199.8) — zmiana bezkosztowa; uzbraja
    //   się dopiero przy pochyleniu ramki ≥ +9.9° (granice przedziału wolności: R9/engine_doc).
    //   PIONOWE celowo BEZ zmiany: minimum za ujściem → osklepek (zamierzone — tak model koduje brak
    //   stabilnego spoczynku kanału przedniego w pionie i wyprowadza brak latencji AC-BPPV, R7).
    if(canal==="horizontal" && eq>=ARC_SPAN.horizontal) return ARC_SPAN.horizontal;
    return CUPULA_DEG;
  }
  /* NAPĘD W SPOCZYNKU — decyduje, czy złóg jest w ogóle PRZYKLEJONY. Gdy spoczynek jest prawdziwym
     minimum (tylny, poziomy), styczna składowa = 0: złóg leży swobodnie i trzyma go adhezja, którą
     prowokacja musi zerwać — stąd LATENCJA. Gdy minimum wypada poza łukiem (kanał przedni), złóg jest
     DOCISKANY do osklepka stałą siłą 0.131 (przy progu fStat 0.04): nie trzyma go wiązanie, tylko
     grawitacja, więc po odwróceniu głowy rusza BEZ zrywania adhezji. Model przewiduje z tego brak
     latencji w kanale przednim — zgodnie z opisami BPPV kanału przedniego (latencja krótka/nieobecna).
     Bez tego test deep head-hang nie dawał ŻADNEGO oczopląsu: 0.5 s przejścia nie starcza, by zużyć
     wiązanie adh=0.2, a w manewrze Yacovino zużywał je dopiero 6-sekundowy krok „pacjent siedzi". */
  // NAPĘD STYCZNY W DOWOLNYM PUNKCIE ŁUKU I DOWOLNEJ ORIENTACJI (ocena II, V3) — uogólnienie restDrive
  // (ta sama arytmetyka; restDrive = driveAt w restPhi i pionie, tożsamościowo — zweryfikowane bitowo).
  // EKSPORTOWANE: warstwa domenowa policzy z niego napęd presetów historii pozycyjnej (BLT_HISTORY, plan V5).
  function driveAt(canal, side, phiDeg, q, tauP=6.5){
    reqCanal(canal, side, "driveAt");
    const G=CANAL_GEOM[canal][side];
    return dot3(gHead(reqQuat(q,"driveAt")), tangAt(G, phiDeg))/tauP;
  }
  function restDrive(canal, side, tauP){
    return driveAt(canal, side, restPhi(canal, side), [1,0,0,0], tauP);
  }
  // stymulacja chorego kanału w danej orientacji głowy
  function position({canal, side, variant, q}){
    reqCanal(canal, side, "position");
    if(variant!=null && variant!=="cupulo" && variant!=="canalo" && variant!=="light") throw new TypeError('position: nieznany variant "'+variant+'" (dozwolone: "cupulo"|"canalo"|"light"|brak)');
    // variant="light" (ocena II, D3/V12): light cupula — WYŁĄCZNIE kanał poziomy (jednostka opisana
    // dla HC; furtka wąska świadomie — TypeError zamiast cichej ekstrapolacji na kanały pionowe).
    if(variant==="light" && canal!=="horizontal") throw new TypeError('position: variant "light" (light cupula) jest zdefiniowany tylko dla canal="horizontal" (podano "'+canal+'")');
    q=reqQuat(q, "position");            // waliduje (skończony, dł. 4) i normalizuje
    const g=gHead(q), G=CANAL_GEOM[canal][side];
    // napęd styczny TAM, GDZIE ZŁÓG LEŻY — ta sama wielkość, którą całkuje simulateCanalith,
    // więc karta testu i symulacja nie mogą już pokazać przeciwnych kierunków.
    // KUPULOLITIAZA KANAŁU POZIOMEGO — CEL PRZY OSKLEPKU (2026-08-13, ocena II A1/V4). Złóg kupulolityczny
    //   siedzi NA OSKLEPKU (φ≈0–3°), nie w restPhi wolnego złogu (199.8°): ciężki osklepek wychyla rzut
    //   grawitacji na styczną PRZY BAŃCE, ze STANDARDOWĄ regułą Ewalda II (G.exc), bez gałęzi specjalnej.
    //   Dawna inwersja proj<0 (liczona w restPhi) trzymała znak Rolla wyłącznie antypodycznym zbiegiem
    //   (restPhi HC leży ~197° od bańki, cos=−0.957), ale: null point wypadał po ZŁEJ stronie (yaw −9°
    //   ku zdrowemu; klinika: 10–30° ku CHOREMU), Bow&Lean apo przeczył regule Choung i tekstowi własnej
    //   karty, pseudo-SN w siadzie był zerem z konstrukcji, a asymetria Rolla żyła tylko z rektyfikacji
    //   wyświetlacza. Po poprawce (zmierzone): Roll apo zachowany z WEWNĘTRZNĄ asymetrią we właściwą
    //   stronę (chore w dole 0.832 < zdrowe 0.885), null point yaw +8..9° ku CHOREMU, B&L apo wg reguły
    //   (skłon→zdrowa 0.120, odchylenie→chora 0.130), pseudo-SN w siadzie 0.052 (słaby — jak klinicznie).
    // KANAŁY PIONOWE świadomie ZOSTAJĄ na restPhi (wybór fenomenologiczny, nie fizyka): czysty cel przy
    //   osklepku dawałby PC silny UPORCZYWY bodziec w siadzie (0.708) — sprzeczny z kliniką; w Dix oba
    //   punkty dają ten sam znak (magnituda przy osklepku 2.35× mniejsza). AC: restPhi=3=CUPULA_DEG,
    //   więc obie reguły są tożsame z konstrukcji.
    const cupHC = ((variant==="cupulo" || variant==="light") && canal==="horizontal");
    const drive=dot3(g, tangAt(G, cupHC ? CUPULA_DEG : restPhi(canal, side)));   // >0 = ampullofugalny (rosnące φ)
    let proj=G.exc*drive;                                   // exc: +1 pionowe (Ewald III), −1 poziomy (Ewald II)
    // LIGHT CUPULA (ocena II, D3/V12): lekki osklepek = ODWRÓCONY znak wyporu — ten sam punkt oceny
    // (przy osklepku), to samo zero rzutu (null point WSPÓLNY z apo, ku uchu CHOREMU: +8.7° supineFlex /
    // +6.9° supineFlat), przeciwny kierunek DCPN po obu stronach zera (geotropowy trwały).
    if(variant==="light") proj=-proj;
    const excited = proj>0;                                 // JEDNA reguła Ewalda — inwersja cupulo-HC zbędna po przeniesieniu punktu oceny
    const q0=quickPhase(canal, side), s=excited?1:-1, mag=Math.abs(proj);
    return {excited, mag, h:q0.h*s, v:q0.v*s, t:q0.t*s};
  }
  /* ---- dynamika cząstki (etap 2) ----
     Otolit jako cząstka na łuku kanału (φ=kąt łuku; ampułka φ=0, ujście = ARC_SPAN 267–319° per kanał).
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
  /* RÓWNOWAŻNA ŚREDNICA KŁĘBKA [µm] — WYPROWADZONA, nie wpisana (2026-08-06).
     tauP nie jest wolnym parametrem. Prędkość graniczna cząstki w kanale to v = R/tauP, a prawo Stokesa
     v = (2/9)·Δρ·g·a²/μ wiąże ją z promieniem kłębka a. Dla tauP=6.5 s i średniego promienia łuku
     trzech kanałów (3.17 mm) wychodzi a ≈ 10.6 µm, czyli równoważna średnica ≈ 21 µm — kłębek kilku
     otoconiów (pojedyncze ludzkie otoconium 1–30 µm, PMC3226995; rozmiar realnego agregatu u żywego
     chorego NIE jest znany). Skalowanie rozmiarem w silniku to tauP = tauP₀/r², czyli v ∝ r² — DOKŁADNIE
     Stokes, więc mnożnik r przekłada się wprost na promień i skala jest spójna z fizyką, a nie dopisana.
     Δρ = 1700 kg/m³ (otoconia 2.7 − endolimfa 1.0) · μ = 8.5e-4 Pa·s (endolimfa ≈ woda 37 °C).
     ZASTRZEŻENIE: implikowany promień zależy od promienia łuku KONKRETNEGO kanału (9.7 µm boczny …
     11.1 µm tylny, ±7% wokół średniej), bo tauP jest w silniku wspólny dla wszystkich trzech. Podajemy
     wartość dla średniego kanału i ZAOKRĄGLONĄ — ma dawać rząd wielkości porównywalny z piśmiennictwem,
     nie precyzję, której model nie ma. */
  const R_ARC_MEAN=3.17e-3, TAUP0=6.5, D_RHO=1700, MU=8.5e-4, G_ACC=9.81;
  const A_MED_M = Math.sqrt((R_ARC_MEAN/TAUP0)*9*MU/(2*D_RHO*G_ACC));   // promień kłębka dla size=medium [m]
  const sizeUm = size => Math.round(2*A_MED_M*1e6*sizeR(size));         // równoważna ŚREDNICA [µm]
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
    for(const k of ["neckPitch","neckYaw"])   // B8 (V14a): kąt karku segmentu [°] — opcjonalny, skończony
      if(seg[k]!=null && !Number.isFinite(seg[k])) throw new RangeError(where+": timeline["+i+"]."+k+" musi być liczbą skończoną (podano "+seg[k]+")");
    return reqQuat(seg.q, where+" timeline["+i+"]");
  }
  // symulacja kanalolitiazy: timeline = [{q, tTrans, tHold}, ...]
  // MODEL FENOMENOLOGICZNY/EDUKACYJNY (nie pełna hydrodynamika — brak ciśnienia transkupularnego, zmiennej
  //   średnicy przewodu, bezwładności płynu, wielu cząstek; pełny model: Squires/Hain/Stone). Szczegóły → engine_doc.txt.
  // Stałe skalibrowane do literatury (kanał tylny): latencja 2.25 s, szczyt 0.872 @10.15 s, trwanie
  //   ~37 s (metryka |ξ|≷0.05; przemierzone 2026-08-13 — stare „~7–9 s / ~25 s" sprzed ARC_SPAN).
  //   tauP=6.5  — cząstka (opór); tauC=5 — osklepek (długa stała kanału ~4–6 s);
  //   gc=1.6 — wzmocnienie; phiExit=178 — koniec nieampułkowy = wyjście do ŁAGIEWKI (kan. pionowe: odnoga wspólna; poziomy: wprost);
  //   fStat/adh — adhezja otolitu (zrywana utrzymaną siłą styczną → latencja; silniejsza
  //   prowokacja = krótsza latencja). Kupulolitiaza nie ma adhezji/latencji (osobna funkcja).
  // KOMORA ODNOGI WSPÓLNEJ + ŁAGIEWKA (kanały PIONOWE: tylny+przedni; poziomy NIE ma odnogi → wyjście wprost).
  //   Anatomicznie „dotarcie do końca łuku" (φ=phiExit) ≠ „wpadnięcie do łagiewki" — to DWA zdarzenia. Złóg po
  //   dojściu do odnogi (φ≥phiExit−crusArc) WCHODZI DO KOMORY ODNOGI i PARKUJE: opuszcza czuły kanał, osklepek
  //   relaksuje (brak oczopląsu), czeka na ekspulsję do łagiewki. Warunek ekspulsji: −g[1] > crusGrav,
  //   gdzie g to SIŁA WŁAŚCIWA (R7). KOREKTA 2026-08-13 (ocena II, C7): działa wyłącznie droga
  //     GRAWITACYJNA — przy głowie pionowej (siad) łagiewka jest POD odnogą → złóg wpada; to daje
  //     ekspulsję Epleya PRZY SIADANIU + oczopląs liberacyjny. Droga „BEZWŁADNOŚCIOWA" jest
  //     strukturalnie MARTWA: człon dośrodkowy a=ω×(ω×d) przy d=[±EAR_X, L>0, 0] ma a[1]≤0, więc
  //     inercja może −f[1] tylko OBNIŻAĆ (rzut Semonta 180°/0.8 s: +1.18 g KU CZUBKOWI — hamuje;
  //     KOREKTA V14: z ramieniem B8 (z≠0) twierdzenie z algebraicznego staje się numerycznym —
  //     zmierzone maksimum dodatniego wkładu po 7 manewrach × 2 strony: ≤0.0012 g przy progu 0.6,
  //     ekspulsja bezwładnościowa POZOSTAJE martwa). Usunięte 2026-08-05
  //     proxy (kąt > crusFling ORAZ tempo > crusFlingRate) zastąpiła grawitacja w bez-timerowym
  //     siadzie, NIE inercja — manewry czyszczą dalej 12/12, bo inercja robi swoje w napędzie
  //     WZDŁUŻ kanału (Semont z pivot=neck nie dowozi złogu do odnogi).
  //   Ekspulsja przesuwa φ: (phiExit−crusArc)→phiExit w czasie WYNIKAJĄCYM z siły i tauP (B6/V14c:
  //   1.95–9.90 s w realnych manewrach; final.expelDur; dawna stała EXPEL_DUR=1.2 s usunięta z ruchu)
  //   → TRANSJENT oczopląsu w kierunku
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
  // B8 (ocena II, V14a): RAMIĘ Z POZY. Podział skalibrowanego LEVER.body=0.75 (kotwica R7) na człon
  // TUŁOWIOWY biodra→C7 i SZYJNY C7→błędnik — celowo RÓŻNICĄ, nie literałem: suma wraca do kalibracji
  // bitowo (ARM_TRUNK+LEVER.neck===LEVER.body). Antropometria 50c (Drillis & Contini 1966): krętarz
  // ≈0.53H, C7 ≈0.86H, tragion ≈0.93H → człon szyjny ≈0.12 m (trafia w LEVER.neck), suma anatomiczna
  // ≈0.70 vs modelowe 0.75 (ramię EFEKTYWNE — oś przejścia body to kozetka, poniżej krętarza). STATUS
  // podziału: założenie SPOZA kodu, „granica źródła" jak ramka IE-Map; zmienność osobnicza ±10%.
  const ARM_TRUNK = LEVER.body - LEVER.neck;   // 0.63 m biodra→C7
  // ramię oś-obrotu→błędnik w RAMCE GŁOWY, zależne od kąta KARKU (neckP=pitch−trunk, neckY=yaw+dyaw [°]).
  // pivot="neck": ramię kark→błędnik jest wektorem SZTYWNYM głowy — poprawne dla każdego kąta, bez zmian.
  // pivot="body" i kark w linii (neckP=0): DOKŁADNIE stary wektor (literalna gałąź — bit-tożsamość
  // strukturalna). Kark zgięty: człon tułowiowy obraca się WZGLĘDEM głowy odwrotnością rotacji karku
  // Rx(ν)∘Ry(Y) — dokładnie rozkład POSE_SPEC (headQ = torso ∘ kark; tożsamość zweryfikowana 2.2e-16).
  function armVec(side, pivot, neckP, neckY){
    const ex = side==="P" ? EAR_X : -EAR_X;
    if(pivot!=="body" || !neckP) return [ex, LEVER[pivot]||LEVER.body, 0];
    const qn = qmul(qaxis([1,0,0], neckP), qaxis([0,1,0], neckY||0));
    const tr = rotv(qconj(qn), [0, ARM_TRUNK, 0]);
    return [ex+tr[0], LEVER.neck+tr[1], tr[2]];
  }
  function angVel(qPrev, sq, tTrans){        // ω [rad/s] w RAMCE GŁOWY (oś obrotu względnego jest w niej stała)
    if(!(tTrans>0)) return [0,0,0];
    let r=qmul(qconj(qPrev), sq); if(r[0]<0) r=[-r[0],-r[1],-r[2],-r[3]];
    const v=Math.hypot(r[1],r[2],r[3]); if(v<1e-9) return [0,0,0];
    const w=2*Math.atan2(v, r[0])/tTrans;
    return [w*r[1]/v, w*r[2]/v, w*r[3]/v];
  }
  function specForce(g, wv, side, pivot, neckP, neckY){   // f = g − a/g0, a = ω × (ω × d) [dośrodkowe]
    if(!wv[0] && !wv[1] && !wv[2]) return g;
    const d=armVec(side, pivot, neckP, neckY);              // oś obrotu → błędnik, w ramce głowy (B8: z kąta karku)
    const c1=cross3(wv,d), a=cross3(wv,c1);
    return [g[0]-a[0]/G0, g[1]-a[1]/G0, g[2]-a[2]/G0];
  }
  function simulateCanalith({canal, side, timeline, q0=null, phi0=null, settled=true, xi0=0, bond0=null, dt=0.05, tauP=6.5, tauC=5, gc=1.6, phiExit=null, fStat=0.04, adh=0.2, size="medium", rep=0, fatTau=2.0, fatFloor=0.06, crusArc=12, crusGrav=0.6}){
    reqCanal(canal, side, "simulateCanalith");
    if(phiExit==null) phiExit=ARC_SPAN[canal];   // domyślnie ZMIERZONY zakres łuku per kanał (było: globalne 178°)
    if(!(phiExit>0) || !isFinite(phiExit)) throw new RangeError("simulateCanalith: phiExit musi być liczbą > 0 (podano "+phiExit+")");
    if(!Array.isArray(timeline) || !timeline.length) throw new TypeError("simulateCanalith: timeline musi być NIEPUSTĄ tablicą {q,tTrans,tHold}");
    if(!(dt>0) || !isFinite(dt)) throw new RangeError("simulateCanalith: dt musi być liczbą > 0 (podano "+dt+")");   // dt<=0 → nieskończona pętla
    // WALIDACJE PARAMETRÓW DYNAMIKI (ocena II, A10/DYN-11) — wartości niefizyczne przechodziły po cichu:
    // gc<0 ODWRACAŁO stronę oczopląsu (ucho chore!), tauC<0 rozbiegało ξ wykładniczo, tauC<dt/2 destabilizowało
    // jawny schemat Eulera, tauP<0 pchało złóg POD grawitację, crusArc>phiExit dawało pcrus<0 (test martwy bez
    // śladu), crusGrav<=0 ekspulsowało w dowolnej pozie. Wartości domyślne przechodzą wszystkie bramki.
    if(!(tauP>0) || !isFinite(tauP)) throw new RangeError("simulateCanalith: tauP musi być liczbą > 0 (podano "+tauP+")");
    if(!(tauC>dt/2) || !isFinite(tauC)) throw new RangeError("simulateCanalith: tauC musi być liczbą > dt/2 (stabilność Eulera; podano "+tauC+")");
    if(!(gc>0) || !isFinite(gc)) throw new RangeError("simulateCanalith: gc musi być liczbą > 0 (podano "+gc+")");
    if(!(fStat>=0) || !isFinite(fStat)) throw new RangeError("simulateCanalith: fStat musi być liczbą >= 0 (podano "+fStat+")");
    if(!(adh>=0) || !isFinite(adh)) throw new RangeError("simulateCanalith: adh musi być liczbą >= 0 (podano "+adh+")");
    if(!(crusArc>=0) || !(crusArc < phiExit-CUPULA_DEG)) throw new RangeError("simulateCanalith: crusArc musi spełniać 0 <= crusArc < phiExit-"+CUPULA_DEG+" (podano "+crusArc+")");
    if(!(crusGrav>0) || !isFinite(crusGrav)) throw new RangeError("simulateCanalith: crusGrav musi być liczbą > 0 (podano "+crusGrav+")");
    // WALIDACJA phi0 (ocena II, A9/V3) — do tej pory NaN dawał po cichu martwą symulację, start za pcrus
    // był snapowany WSTECZ, a phi0>phiExit wskrzeszał złóg spoza kanału z pełnym transjentem liberacyjnym.
    if(phi0!=null && (!isFinite(phi0) || phi0<CUPULA_DEG || phi0>phiExit))
      throw new RangeError("simulateCanalith: phi0 musi być w ["+CUPULA_DEG+", phiExit="+phiExit+"] (podano "+phi0+")");
    // WALIDACJA bond0/xi0 (ocena II, D1/V10) — parametry ŁAŃCUCHOWANIA SESJI. bond0 = UŁAMEK pełnej
    // adhezji [0..1] — jednostka NIEZALEŻNA od size (final.bond jest w adh·r: łańcuchowanie surowego
    // bond między przebiegami o różnym size przekłamywało stan wiązania — bondFrac przenosi się czysto).
    // xi0 = wychylenie osklepka na starcie (przenosi ogon ξ poprzedniego przebiegu: łańcuch ≡ jedna
    // timeline BIT-W-BIT — na tej tożsamości stoi rozstrzygnięcie B7).
    if(bond0!=null && (!(bond0>=0 && bond0<=1) || !isFinite(bond0)))
      throw new RangeError("simulateCanalith: bond0 musi być ułamkiem pełnej adhezji w [0, 1] (podano "+bond0+")");
    if(typeof xi0!=="number" || !isFinite(xi0))
      throw new RangeError("simulateCanalith: xi0 musi być liczbą skończoną (podano "+xi0+")");
    const r=sizeR(size); tauP=tauP/(r*r); gc=gc*r*r*r*fatigueFactor(rep,{fatTau,fatFloor}); adh=adh*r;   // skalowanie rozmiarem cząstki (SIZE_R) × męczliwość (dyspersja przy powtórzeniach, rep)
    const G=CANAL_GEOM[canal][side], D=Math.PI/180, pex=phiExit*D, pcrus=(phiExit-crusArc)*D;
    const crusGate=(canal==="posterior"||canal==="anterior");   // odnoga wspólna TYLKO dla kanałów pionowych; poziomy → wyjście wprost
    let expT0=null, expT1=null;   // B6 (V14c): okno ekspulsji → final.expelDur (WYNIK, nie stała; EXPEL_DUR=1.2 s usunięte z ruchu — historyczne)
    const tang=phi=>{const c=Math.cos(phi),s=Math.sin(phi);
      return [-s*G.e1[0]+c*G.e2[0], -s*G.e1[1]+c*G.e2[1], -s*G.e1[2]+c*G.e2[2]];};
    // pozycja startowa: jawne q0 (1. segment interpoluje Z NIEGO) lub — domyślnie (null) — pierwszy q, czyli
    // 1. segment = pozycja startowa, a jego tTrans to czas W tej pozycji (NIE przejście z neutralnej). Wsteczna zgodność.
    // settled (ocena II, A2/V3): true (domyślne) = złóg OSIADŁY — bramka adhezji jak dotąd (napęd
    // postojowy w restPhi i pionie; ścieżka bit-identyczna). false = złóg ŚWIEŻO PRZEMIESZCZONY
    // (historia pozycyjna odłożyła go przed chwilą — wiązanie nie zdążyło się wytworzyć): start bez
    // bramki. Uzasadnienie fizyczne = ten sam mechanizm, którym silnik tłumaczy brak latencji kanału
    // przedniego (restDrive wyżej: „nie trzyma go wiązanie, tylko grawitacja"); w PĘTLI re-adhezji nie ma
    // (raz zerwane wiązanie nie odrasta W BIEGU — bramkowany odrost przy |drive|≤fStat re-engażowałby
    // stuck przez 56 s żywego ogona napadu AC i zabiłby go w całości; sonda 2026-08-14). Odrost MIĘDZY
    // badaniami → readhesion() w warstwie domenowej (maneuvers.js, D1/B7). Bez `settled` bramka —
    // ewaluowana w CUDZYM punkcie (restPhi zamiast phi0) — wygasza do 0.000 nawet odpowiedzi o swobodnej
    // amplitudzie |ξ|>1 i robi z odpowiedzi funkcję schodkową phi0 z ~20% martwego łuku (klif 205°).
    // Start w strefie odnogi (phi0>phiExit−crusArc, kanały pionowe): złóg STARTUJE W KOMORZE (inCrus)
    // zamiast dawnego snapu WSTECZNEGO do pcrus — czeka na ekspulsję jak każdy zaparkowany złóg.
    // BRAMKA W PUNKCIE STARTU (ocena II, D1/V10 — domknięcie artefaktu A2): dla phi0!=null napęd
    // postojowy liczony TAM, GDZIE ZŁÓG LEŻY, i w orientacji STARTOWEJ (q0 = poza spoczynkowa przed
    // badaniem; bez q0 — pion). Stara bramka mroziła złóg zaparkowany po Dixie (φ₀=159.5°, siad:
    // |driveAt|=0.142>fStat, a |restDrive(restPhi)|≈0 → STUCK) na 2.05 s zużywania wiązania w cudzym
    // punkcie. phi0=null → DOSŁOWNIE stary restDrive (te same bity — ścieżka domyślna nietknięta).
    // Człon (bond0==null || bond0>0): bond0=0 ≡ settled:false (ciągłość w zerze, bez klifu 0→0⁺).
    const qStart=q0!=null?reqQuat(q0,"simulateCanalith q0"):null;
    const holdDrive = phi0!=null ? driveAt(canal, side, phi0, qStart!=null?qStart:[1,0,0,0], tauP)
                                 : restDrive(canal, side, tauP);
    let phi=(phi0!=null?phi0:restPhi(canal,side))*D, xi=xi0, t=0, exited=false, stuck=settled && (bond0==null || bond0>0) && Math.abs(holdDrive)<=fStat, inCrus=crusGate && phi0!=null && phi0 > phiExit-crusArc, bond=bond0!=null?bond0*adh:adh, qPrev=qStart!=null?qStart:reqSegment(timeline[0],0,"simulateCanalith"); const out=[];
    let nPrev=null;   // B8 (V14a): kąt karku POPRZEDNIEGO segmentu [νP, Y] — jak qPrev; pierwszy segment = wartości własne (stałe ramię); q0 nie niesie rozkładu karku (granica udokumentowana)
    for(const [si,seg] of timeline.entries()){
      const sq=reqSegment(seg,si,"simulateCanalith");    // waliduje segment (obiekt, q, tTrans/tHold≥0) + normalizuje q (slerpQ zakłada q jednostkowe)
      const wv = angVel(qPrev, sq, seg.tTrans);          // prędkość kątowa przejścia (stała — slerp o stałym tempie)
      const pivot = seg.pivot || "body";                  // oś obrotu kroku: "body" (biodra/kozetka) | "neck" (sama głowa)
      const nP=seg.neckPitch||0, nY=seg.neckYaw||0;       // B8: kark segmentu (brak pól = 0 = stara ścieżka armVec literalnie)
      const pP=nPrev?nPrev[0]:nP, pY=nPrev?nPrev[1]:nY;
      const total=(seg.tTrans||0)+(seg.tHold||0), steps=Math.round(total/dt);
      for(let i=0;i<steps;i++){
        const u=seg.tTrans>0?Math.min(1,(i*dt)/seg.tTrans):1;
        const g0v=gHead(slerpQ(qPrev,sq,u));
        const g = u<1 ? specForce(g0v, wv, side, pivot, pP+u*(nP-pP), pY+u*(nY-pY)) : g0v;   // W TRAKCIE przejścia siła właściwa; kark z TEJ SAMEJ interpolacji co poza (rozszerzenie zasady R7); w holdzie ω=0 → f=g
        let dphi=0, flow=0;
        if(!exited){
          if(crusGate && inCrus){
            // złóg w KOMORZE ODNOGI WSPÓLNEJ — poza czułym kanałem (osklepek relaksuje). Czeka na ekspulsję do łagiewki.
            // g to SIŁA WŁAŚCIWA (R7), ale warunek realnie spełnia wyłącznie GRAWITACJA (siad: łagiewka
            // pod odnogą) — człon dośrodkowy ma a[1]≤0, więc −f[1] podnieść nie może (ocena II, C7).
            // Dawne proxy crusFling/crusFlingRate — „kąt > 145° ORAZ tempo > 180°/s" — USUNIĘTE 2026-08-05:
            // manewry czyszczą dalej 12/12, bo ekspulsję przejęła grawitacja w bez-timerowym siadzie
            // (inercja utrzymuje DOJAZD złogu do odnogi — napęd wzdłuż kanału).
            // B6 (ocena II, V14c): JEDNO PRAWO RUCHU. Strefa [pcrus,pex] to ZMIERZONY końcowy odcinek
            // łuku atlasu IE-Map (ujście = wejście do przedsionka) — tangAt tam OBOWIĄZUJE i jest
            // kierunkiem odnogi (PC przy ujściu: 9.3° od osi „głowa-dół"; stare −g[1] było ślepym
            // na kanał przybliżeniem tego rzutu). crusGrav zmienia sens: z binarnej bramki na PRÓG
            // ZASTANIA szerokiej komory (tarcie Coulomba złogu na ścianie — granica płynięcia
            // Binghama; w wąskim świetle złóg płynie jak tłok, tam progu nie ma — adhezję niesie
            // fStat/adh: jedna fizyka, dwie geometrie). Prędkość ∝ nadwyżce siły, /tauP (Stokes:
            // czasy ∝ r⁻²; stara stała 10°/s nie skalowała się wcale). EMERGENTNIE: PC ekspulsuje
            // w siadzie jak dotąd (rzut 0.965>0.6), a AC wymaga BRODY NA KLATCE (czysty siad
            // 0.401<0.6, broda 0.81–0.88) — instrukcja kończąca Yacovino staje się fizycznie nośna.
            // Jednokierunkowość: max(0,·) + klamra pex (kieszeń komory; powrót/jam poza zakresem —
            // D10). Latch `expelling` usunięty — ruch podąża za siłą, ciągłość bez klifu (v→0 przy
            // nadwyżce→0); „wieczne pełzanie" pilnowane wyrocznią EXPEL_SANE (snapshot.mjs).
            const excess = dot3(g,tang(phi)) - crusGrav;       // g = siła właściwa (R7); C7: inercja może rzut tylko obniżać (≤0.0012 g z ramieniem B8)
            if(excess > 0){
              dphi=excess/tauP; let nphi=phi+dphi*dt;
              if(expT0==null) expT0=t;
              if(nphi>=pex){ dphi=Math.max(0,pex-phi)/dt; nphi=pex; exited=true; expT1=t+dt; }   // wpadł do łagiewki; dphi = realny dojazd (flow bez przestrzału)
              phi=nphi; flow=gc*G.exc*dphi;                    // transjent liberacyjny: amplituda ∝ SILE napędu (nie ∝ crusArc — koniec konwencji)
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
      qPrev=sq; nPrev=[nP,nY];
    }
    // STAN KOŃCOWY do łańcuchowania sesji (ocena II, V3+V10 — fundament D1/R10): pre=simulateCanalith(historia);
    // test=simulateCanalith({phi0:pre.final.phi, xi0:pre.final.xi, bond0:pre.final.bondFrac, settled:true, ...})
    // — łańcuch tak zbudowany jest BIT-W-BIT tożsamy z jedną timeline (rozstrzygnięcie B7). Właściwość NA
    // TABLICY — JSON.stringify tablic ją pomija (wyrocznie serializujące nie widzą zmiany), iteracja bez zmian.
    // bondFrac = wiązanie jako UŁAMEK [0..1] (clamp: bond kończy ujemnie po zerwaniu) — JEDYNA postać do
    // łańcuchowania; bond (jednostki WEWNĘTRZNE adh·r) zostaje dla zgodności — footgun między size udokumentowany.
    out.final = { phi: phi/D, xi, bond, stuck, exited, inCrus,
                  bondFrac: adh>0 ? Math.min(1, Math.max(0, bond)/adh) : 0,
                  expelDur: (expT0!=null && expT1!=null) ? expT1-expT0 : null };   // B6: trwanie ekspulsji = WYNIK (null = ekspulsji nie było); pilnowane pasmem EXPEL_SANE w wyroczni
    return out;
  }
  // ξ (odchylenie osklepka) → składowe oczopląsu (kierunek z etapu 0, znak z pobudzenia)
  function dynNystagmus(canal, side, xi){
    const q0=quickPhase(canal,side), exc=xi>0, s=exc?1:-1;
    const m=Math.min(1, Math.abs(xi)*(exc?1:EWALD_INHIB));   // Ewald II: rektyfikacja — odpowiedź hamująca słabsza
    return {excited:exc, intensity:m, h:q0.h*s, v:q0.v*s, t:q0.t*s};
  }
  // klasyfikacja fazy oczopląsu względem kierunku prowokującego (ξ>0 = pierwotny/liberatoryjny)
  function nystagmusPhase(xi, thr=0.05){ return xi>thr ? "primary" : xi<-thr ? "reversed" : "none"; }
  // KUPULOLITIAZA SŁABSZA OD KANALOLITIAZY [1] — współczynnik amplitudy (cecha RÓŻNICUJĄCA obok latencji/uporczywości).
  //   Złóg PRZYKLEJONY do osklepka odchyla go słabiej niż bolus swobodnych otoconiów, który przy kanalolitiazie
  //   napędza całą kolumnę endolimfy (efekt „tłoka"). Klinicznie: oczopląs kupulolityczny jest MNIEJ intensywny,
  //   lecz UPORCZYWY (bez wygasania) i NIEmęczliwy — uporczywość/niemęczliwość już modelujemy (tauCup, brak rep),
  //   ten współczynnik domyka RÓŻNICĘ SIŁY. Skaluje ξ (simulateCupulolith) i oczopląs diagnostyczny wariantu
  //   „cupulo" (nysFromGeom) — JEDNO źródło prawdy. Wartość = wybór KALIBRACYJNY (model fenomenologiczny):
  //   KALIBROWANA DO WIELKOŚCI OBSERWOWANEJ (2026-08-13, ocena II B2/K4), nie do samej stałej — pasmo
  //   piśmiennicze SPV apogeotropowy ≈ 0.4–0.7× geotropowy (kan. poziomy) porównuje się z EMERGENTNYM
  //   stosunkiem szczytów ξ obu symulacji, a ten przy 0.6 wynosił 0.736 (tuż POZA pasmem: cel statyczny
  //   kupulo przewyższa szczyt dynamiczny kanalo). 0.45 daje stosunek ~0.54 = środek pasma (z celem przy
  //   osklepku po A1: 0.45·0.832/0.696). NIE stała wyprowadzona z hydrodynamiki. Jeden globalny mnożnik
  //   (uproszczenie: nie per-kanał/per-geometria; dla kanałów PIONOWYCH pasmo 0.4–0.7 jest ekstrapolacją
  //   bez własnej normy piśmienniczej).
  const CUP_WEAK=0.45;
  // LIGHT CUPULA — waga statyczna lekkiego osklepka (ocena II, D3/V12). Start = CUP_WEAK (0.45): osobna
  // GAŁKA kalibracyjna (nie alias), kotwiczona jak CUP_WEAK do wielkości emergentnej — stosunek szczytów
  // light/canalo-geo w Rollu 0.375/0.696 = 0.538 (środek tego samego pasma 0.4–0.7, którym skalibrowano
  // CUP_WEAK; piśmiennictwo nie daje osobnej normy SPV light-vs-geo). „DCPN wyraźniejszy niż apo" wychodzi
  // BEZ nowej stałej z samej rektyfikacji EWALD_INHIB (na tej samej fazie display 0.375 vs 0.169).
  const LIGHT_W=0.45;
  // REKTYFIKACJA EWALDA II — o ile słabsza jest odpowiedź HAMUJĄCA niż pobudzająca. Jedno źródło: ta sama
  // stała rządzi dynamiką (dynNystagmus) i kartą testu (nysFromGeom w pose/maneuvers.js), gdzie do
  // 2026-08-05 stały DWA niezależne literalne 0.45.
  const EWALD_INHIB=0.45;
  // WSPÓLNA CAŁKA STATYCZNA osklepka (ocena II, D3/V12): ciężki (kupulo) i lekki (light) osklepek to TEN SAM
  // mechanizm „cel statyczny + relaksacja tauCup, bez latencji, uporczywy" — różnią się wyłącznie znakiem
  // kontrastu gęstości (znak żyje w position(variant) — jedno źródło) i wagą (CUP_WEAK / LIGHT_W).
  // ξ relaksuje do celu statycznego (rzut grawitacji, znak z reguły Ewalda) z krótką stałą tauCup.
  function simCupStatic({canal, side, timeline, q0=null, dt=0.05, tauCup=0.8, gain=1.0, size="medium", variant="cupulo"}){
    reqCanal(canal, side, "simulateCupulolith");
    if(!Array.isArray(timeline) || !timeline.length) throw new TypeError("simulateCupulolith: timeline musi być NIEPUSTĄ tablicą {q,tTrans,tHold}");
    if(!(dt>0) || !isFinite(dt)) throw new RangeError("simulateCupulolith: dt musi być liczbą > 0 (podano "+dt+")");
    // WALIDACJE (ocena II, A10/DYN-9): tauCup <= dt/2 ROZBIEGA jawny schemat Eulera (tauCup=0.024 → ξ~8e26),
    // tauCup=0 dawało NaN bez wyjątku. Znak gainu pilnują FASADY (simulateCupulolith / simulateLightCupula) —
    // dawna furtka „gain<0 = przyszła light cupula" ZAMKNIĘTA w D3/V12 (mechanizm wybiera się fasadą, nie znakiem).
    if(!(tauCup>dt/2) || !isFinite(tauCup)) throw new RangeError("simulateCupulolith: tauCup musi być liczbą > dt/2 (stabilność Eulera; podano "+tauCup+")");
    if(typeof gain!=="number" || !isFinite(gain)) throw new RangeError("simulateCupulolith: gain musi być liczbą skończoną (podano "+gain+")");
    gain=gain*Math.pow(sizeR(size),3);   // cięższy klaster otoconiów → silniejsze wychylenie osklepka (gain ∝ r³); latencji brak (tauCup bez zmian)
    // UWAGA size dla LIGHT: „rozmiar złogu" nie ma tu interpretacji fizycznej (mechanizm gęstościowy osklepka,
    // nie masa kłębka) — pass-through zostaje jako GENERYCZNY mnożnik amplitudy (udokumentowane).
    const W = variant==="light" ? LIGHT_W : CUP_WEAK;
    // pozycja startowa: jak w simulateCanalith — jawne q0 lub domyślnie (null) pierwszy q (wsteczna zgodność).
    let xi=0, t=0, qPrev=q0!=null?reqQuat(q0,"simulateCupulolith q0"):reqSegment(timeline[0],0,"simulateCupulolith"); const out=[];
    for(const [si,seg] of timeline.entries()){
      const sq=reqSegment(seg,si,"simulateCupulolith");  // waliduje segment (obiekt, q, tTrans/tHold≥0) + normalizuje q (slerpQ zakłada q jednostkowe)
      const total=(seg.tTrans||0)+(seg.tHold||0), steps=Math.round(total/dt);
      for(let i=0;i<steps;i++){
        const u=seg.tTrans>0?Math.min(1,(i*dt)/seg.tTrans):1;
        const p=position({canal, side, variant, q:slerpQ(qPrev,sq,u)});
        const target=W*gain*p.mag*(p.excited?1:-1);      // cel statyczny ważony grawitacją (ξ>0 = pobudzenie); waga: kupulo/light słabsze od kanalo [1]
        xi += dt*(target-xi)/tauCup;                   // szybka relaksacja: bez latencji, uporczywy
        t+=dt; out.push({t, xi, target});
      }
      qPrev=sq;
    }
    return out;
  }
  // FASADA: kupulolitiaza (ciężki osklepek, DCPN apogeotropowy trwały). Gołe gain<0 ZABLOKOWANE — znak gainu
  // to przełącznik CHOROBY, nie pokrętło amplitudy: ujemna wartość z formuły cicho odwracałaby fenotyp
  // apo→geo na karcie kupulo (anty-wzorzec „drugiej cichej drogi"; filozofia walidacji V2/A10).
  function simulateCupulolith(opts){
    if(opts && typeof opts.gain==="number" && opts.gain<0)
      throw new RangeError("simulateCupulolith: gain<0 to mechanizm LIGHT CUPULA — użyj simulateLightCupula (gain>0); furtka ujemnego gainu zamknięta (ocena II, D3/V12)");
    return simCupStatic({...opts, variant:"cupulo"});
  }
  // FASADA: light cupula (lekki osklepek, DCPN GEOTROPOWY trwały; ocena II D3/V12). Znak wyporu odwraca
  // position(variant:"light") — caller nigdy nie steruje znakiem; gain>0 = generyczna amplituda.
  function simulateLightCupula(opts){
    const gain = (opts && opts.gain!==undefined) ? opts.gain : 1.0;
    if(typeof gain!=="number" || !(gain>0) || !isFinite(gain))
      throw new RangeError("simulateLightCupula: gain musi być liczbą > 0 (podano "+gain+")");
    return simCupStatic({...opts, gain, variant:"light"});
  }
  return {isExcitatory, quickPhase, nysMag, nystagmus, gHead, position, sizeR, sizeUm,
          simulateCanalith, simulateCupulolith, simulateLightCupula, dynNystagmus, nystagmusPhase, fatigueFactor,
          qmul, qconj, qaxis, rotate:rotv, CANAL_NORMALS, CANAL_GEOM, ARC_SPAN, restPhi, driveAt, CUP_WEAK, LIGHT_W, EWALD_INHIB};
})();

