import { Vestibular } from './vestibular.js';
import { Scene3D } from './scene3d.js';
import { t as tr } from '../i18n.js';   // alias 'tr' — lokalne 't' (param testu) NIE koliduje z tlumaczeniem

/* ============ NeuroVOR — silnik toniczny/ośrodkowy (warstwa HINTS) ============
   Model „od pierwszych zasad": nie kodujemy wyglądu patologii, lecz fizjologię
   (spoczynkowa aktywność błędników, prawo Ewalda z obcięciem hamowania, przetwarzanie
   ośrodkowe). Oczopląs i objawy WYNIKAJĄ z asymetrii parametrów. Warstwa niezależna od
   dynamiki BPPV (simulateCanalith); współdzieli tylko konwencje kierunków i kamerę.
   Konwencje: "P"=prawa=+x (ucho prawe), "L"=lewa=-x; kamera frontalna (lekarz naprzeciw)
   odbija poziom/skręt (cam.right[0]=-1), tak jak nysFromGeom/nysFromDyn.
   Etapy: (1) oczopląs samoistny push-pull ← TU; (2) supresja fiksacji; (3) vHIT;
   (4) integrator „leaky" + skew/OTR; (5) synteza HINTS.
   LITERATURA (pełne odnośniki w engine_doc.txt, sekcja „MODUŁ NeuroVOR"):
   [H1] Goldberg&Fernández 1971 (spoczynkowa aktywność aferentów ~90/s) · [H2] Ewald 1892 / Baloh&Honrubia
   (II prawo: pobudzenie>hamowanie, obcięcie hamowania) · [H3] Leigh&Zee, Neurology of Eye Movements
   (supresja fiksacji przez kłaczek; integrator) · [H4] Halmagyi&Curthoys 1988 (head impulse) · [H5] Weber
   i wsp. 2008 (vHIT: VOR gain + sakady korygujące) · [H6] Cannon&Robinson 1987 (integrator „leaky" →
   oczopląs spojrzeniowy) · [H7] Brandt&Dieterich 1993 (skew/OTR, znak pniowy, MLF) · [H8] Kattah i wsp.
   2009, Stroke (HINTS; mnemonik INFARCT). */
export const NeuroVOR = (()=>{
  const R0 = 90;         // spoczynkowa częstotliwość aferentów kanału (Hz) — zdrowy błędnik
  const R_SAT = 300;     // sufit pobudzenia (Hz) — aferent nie przekracza ~3× spoczynku (nasycenie)
  const SPV_MAX = 12;    // faza wolna (°/s) przy pełnej asymetrii (błędnik 0 Hz) — rząd kliniczny UVH w ciemności
  const TORS_FRAC = 0.5; // udział składowej skrętnej wzgl. poziomej w oczopląsie obwodowym (poglądowo — oczopląs poziomo-skrętny)
  const camRx = ()=>Scene3D.CAMERAS.frontal.right[0];   // odbicie kamery obserwatora (=-1)

  // Aferent po REKTYFIKACJI: prawo Ewalda — obcięcie hamowania (firing ≥ 0) + nasycenie (≤ R_SAT).
  // Wspólny prymityw: spoczynek (drive=0) i pchnięcie głowy (drive≠0, etap 3). drive w Hz-równoważnych.
  function afferent(tone, drive){ return Math.max(0, Math.min(R_SAT, tone + drive)); }

  // Pełny (NIEmaskowany) kierunek szybkiej fazy kanału z geometrii Vestibular.nysMag — skręt kanału PRZEDNIEGO
  // ZACHOWANY (maska kliniczna quickPhase zeruje go dla BPPV). Wspólne źródło dla: sakady korygującej vHIT,
  // składowej pionowo-skrętnej i napędu SCDS → spójny skręt przedniego we wszystkich trzech. [E5-fix]
  function qpFull(canal, ear){
    const m = Vestibular.nysMag(canal, ear), ipsi = ear==="P" ? +1 : -1;
    if(canal==="horizontal") return { h: ipsi*m.h, v:0, t:0 };      // poziomy: konwencja czysto pozioma
    if(canal==="anterior")   return { h:0, v:-m.v, t: ipsi*m.t };   // downbeat + skręt (PEŁNY)
    return { h:0, v:+m.v, t: ipsi*m.t };                            // tylny: upbeat + skręt
  }

  // Kanoniczny „pacjent": globalne parametry fizjologii. Patologię tworzy zmiana kilku liczb;
  // zachowanie gałek wynika z modelu. Pola dynamiczne wykorzystywane w kolejnych etapach.
  function makePatient(o){ return Object.assign({
    toneL:R0, toneR:R0,      // spoczynkowa aktywność błędnika L/P (Hz) — hipofunkcja obniża
    gainL:1.0, gainR:1.0,    // wzmocnienie VOR kanału poziomego L/P (0..~1.1) — vHIT = WYSOKA częstotl. ~5 Hz (etap 3)
    caloricGainL:1.0, caloricGainR:1.0,  // gain NISKOczęstotliwościowy HC L/P — PRÓBA KALORYCZNA ~0.003 Hz (etap 7/E4.5)
    fixationGain:0.9,        // zdolność kłaczka do supresji wzrokowej (0..1); ośrodek → ~0 (etap 2)
    integratorTau:25,        // stała czasowa integratora UTRZYMANIA SPOJRZENIA (s); ośrodek „leaky" → krótka (etap 4)
    skewTone:0, otrTorsion:0,// grawiceptywna asymetria / OTR (etap 4)
    comp:0,                  // poziom KOMPENSACJI ośrodkowej c∈[0,1]: 0=faza ostra, 1=pełna symetria spoczynkowa (etap 6)
    pacemakerBias:0,         // TRWAŁY (sticky) ładunek pacemakera jądra chorego (Hz) → oczopląs powrotny Bechterewa (etap 6b)
    lesionEar:null,          // jawna strona chora dla kompensacji (null → wykrywana ze słabszego błędnika)
    tauVS:15,                // stała czasowa VELOCITY STORAGE (s) — wygaszanie po obrocie; kompensacja skraca (etap 6c)
    // ETAP 7 — NEUROANATOMIA (per-kanał). Kanał POZIOMY (HC) = toneL/R, gainL/R powyżej. Kanały PIONOWE (domyślnie zdrowe):
    toneAcL:R0, toneAcR:R0, gainAcL:1.0, gainAcR:1.0,   // kanał PRZEDNI (anterior, „górny") L/P — n. GÓRNY (superior)
    tonePcL:R0, tonePcR:R0, gainPcL:1.0, gainPcR:1.0,   // kanał TYLNY  (posterior)              L/P — n. DOLNY  (inferior)
    // NARZĄDY OTOLITOWE (funkcja 0..1, zdrowy=1) — badane przez VEMP + współtworzą SVV (etap 7, [H22]):
    sacculeL:1.0, sacculeR:1.0,   // WORECZEK L/P → cVEMP (n. DOLNY, ipsilateralnie)
    utricleL:1.0, utricleR:1.0,   // ŁAGIEWKA L/P → oVEMP (n. GÓRNY) + grawiceptywny przechył SVV
    dehiscence:null          // SCDS: dehiscencja kanału GÓRNEGO/przedniego — null | "L" | "P" (trzecie okno, etap 7)
  }, o||{}); }

  // ETAP 7 — NEUROANATOMIA: mapa NERW przedsionkowy → kanały. [H15][H16]
  // n. GÓRNY (superior): kanał poziomy + przedni + łagiewka (utriculus). n. DOLNY (inferior): kanał tylny +
  // woreczek (sacculus; głównie cVEMP, znikomy sygnał okoruchowy). Neuronitis zwykle dotyczy n. GÓRNEGO
  // (dłuższy, wąski kanał kostny → podatność na obrzęk/niedokrwienie). Pełne wypadnięcie → ton 0, gain ~0.35.
  const CANAL_PARAM = {
    horizontal:{ L:{tone:"toneL",  gain:"gainL"},   P:{tone:"toneR",  gain:"gainR"}   },
    anterior:  { L:{tone:"toneAcL",gain:"gainAcL"}, P:{tone:"toneAcR",gain:"gainAcR"} },
    posterior: { L:{tone:"tonePcL",gain:"gainPcL"}, P:{tone:"tonePcR",gain:"gainPcR"} }
  };
  const NERVE_CANALS = { superior:["horizontal","anterior"], inferior:["posterior"] };
  // Override'y makePatient dla wypadnięcia gałęzi nerwu (ear "L"/"P", branch "superior"/"inferior", sev 0..1).
  function nerveBranchLesion(ear, branch, sev){
    sev = Math.max(0, Math.min(1, sev==null?1:sev));
    const o = {};
    for(const canal of (NERVE_CANALS[branch]||[])){
      const pk = CANAL_PARAM[canal] && CANAL_PARAM[canal][ear]; if(!pk) continue;
      o[pk.tone] = R0*(1-sev);                            // hipofunkcja tonu (0 przy pełnym)
      o[pk.gain] = 1 - sev*0.65;                          // gain → ~0.35 przy pełnym (jak preset neuritis)
    }
    if(branch==="superior"){
      o.skewTone = (ear==="P"?1:-1)*1.5*sev;                       // łagiewka (utriculus) → MAŁY skew (obwodowy, < próg ośrodkowy SKEW_CENTRAL)
      o[ear==="P"?"caloricGainR":"caloricGainL"] = 1-sev;           // HC = nerw GÓRNY → kaloryka osłabiona (zgodnie z vHIT)
      o[ear==="P"?"utricleR":"utricleL"] = 1-sev;                   // ŁAGIEWKA → oVEMP osłabiony (n. górny); cVEMP zachowany [H22]
    }                                                                // n. DOLNY: HC oszczędzony → kaloryka PRAWIDŁOWA (emergent)
    if(branch==="inferior"){
      o[ear==="P"?"sacculeR":"sacculeL"] = 1-sev;                   // WORECZEK → cVEMP osłabiony (n. dolny); oVEMP zachowany [H22]
    }
    return o;
  }

  // ETAP 7 (E4) — BVH / obustronna westybulopatia (otoksyczność, np. gentamycyna): SYMETRYCZNY spadek
  // tonu i gain OBU błędników we wszystkich 6 kanałach. EMERGENTNIE: symetria → imbalance push-pull = 0
  // → BRAK oczopląsu samoistnego (odróżnia BVH od jednostronnego UVH!), a mimo to vHIT PATOLOGICZNY
  // OBUSTRONNIE (każdy kanał badany osobno). Kompensacja bezczynna (compensate: brak strony chorej). [H19]
  function bilateralLoss(sev){
    sev = Math.max(0, Math.min(1, sev==null?1:sev));
    const tone = R0*(1-sev), gain = 1 - sev*0.65;            // jak ubytek jednostronny, lecz OBUSTRONNIE + wszystkie kanały
    return { toneL:tone, toneR:tone, gainL:gain, gainR:gain,
             toneAcL:tone, toneAcR:tone, gainAcL:gain, gainAcR:gain,
             tonePcL:tone, tonePcR:tone, gainPcL:gain, gainPcR:gain,
             caloricGainL:1-sev, caloricGainR:1-sev,              // kaloryka OBUSTRONNIE osłabiona (LF) → suma odpowiedzi ↓
             sacculeL:1-sev, sacculeR:1-sev, utricleL:1-sev, utricleR:1-sev };   // otoksyczność → VEMP obustronnie osłabiony (SYMETRYCZNIE → SVV=0)
  }

  // ETAP 7 (E4) — CHOROBA MÉNIÈRE'A / wodniak endolimfatyczny: NAPADOWE wahania tonu ucha CHOREGO.
  // Napad przemiata ton błędnika chorego: DRAŻNIENIE (nadczynność, ~150 Hz > bazowej) → PUNKT ZEROWY
  // (~90, symetria) → PORAŻENIE (niedoczynność, →0). Kierunek oczopląsu ODWRACA SIĘ SAM z push-pull:
  // drażnienie → bije KU choremu (irritative); porażenie → bije KU zdrowemu (jak ostry UVH). Międzynapadowo
  // powrót do normy (wczesna choroba). Dominuje kanał POZIOMY (oczopląs poziomo-skrętny). UWAGA DYDAKTYCZNA:
  // w drażnieniu gain zachowany → vHIT bywa PRAWIDŁOWY mimo oczopląsu; HINTS (dla CIĄGŁEGO AVS) może tu mylić
  // (pozorny objaw ośrodkowy) — to pułapka, bo Ménière jest NAPADOWY; oznaczyć w clinicalReadout (E5). [H20]
  const MENIERE_PHASE = {
    irritative: { tone:150,  gain:1.0 },   // drażnienie: oczopląs KU choremu, vHIT ~prawidłowy (cecha odróżniająca)
    nullpoint:  { tone:R0,   gain:1.0 },   // punkt zerowy: symetria → brak oczopląsu
    paretic:    { tone:0,    gain:0.5 },   // porażenie: oczopląs KU zdrowemu (jak ostry UVH), vHIT osłabiony
    interictal: { tone:R0,   gain:1.0 }    // międzynapadowo: powrót do normy
  };
  function meniere(ear, opts){
    opts = opts||{};
    const ph = MENIERE_PHASE[opts.phase] || MENIERE_PHASE.irritative;
    const tone = opts.tone!=null ? opts.tone : ph.tone;      // można podać surowy ton (płynne przemiatanie napadu)
    const gain = opts.gain!=null ? opts.gain : ph.gain;
    const pk = CANAL_PARAM.horizontal[ear==="L"?"L":"P"];    // kanał poziomy ucha chorego
    const cLoss = opts.caloricLoss!=null ? Math.max(0,Math.min(1,opts.caloricLoss)) : 0.55;  // PRZEWLEKŁY ubytek LF (0 = wczesny Ménière)
    const o = {}; o[pk.tone] = tone; o[pk.gain] = gain;
    o[ear==="L"?"caloricGainL":"caloricGainR"] = 1-cLoss;    // gain HF (vHIT) zachowany + kaloryka osłabiona = DYSOCJACJA
    return o;
  }

  // ETAP 7 — vHIT PER-KANAŁOWY: pary WSPÓŁPŁASZCZYZNOWE. Szybkie pchnięcie w płaszczyźnie kanału POBUDZA
  // jeden kanał (przepływ ampullopetalny, Ewald II) i HAMUJE koplanarny z drugiej strony (obcięcie na 0 →
  // wypada z estymaty prędkości). Pary: HC-P↔HC-L; RALP = prawy PRZEDNI ∥ lewy TYLNY; LARP = lewy PRZEDNI ∥
  // prawy TYLNY (RA∥LP, LA∥RP — koplanarność z CANAL_NORMALS). Bada się kanał POBUDZANY (ipsilateralny). [H15][H17]
  const COPLANAR = {
    horizontal:{ P:{canal:"horizontal", ear:"L"}, L:{canal:"horizontal", ear:"P"} },
    anterior:  { P:{canal:"posterior",  ear:"L"}, L:{canal:"posterior",  ear:"P"} },   // RA∥LP, LA∥RP
    posterior: { P:{canal:"anterior",   ear:"L"}, L:{canal:"anterior",   ear:"P"} }
  };
  const PLANE_CANALS = {   // dwa pobudzeniowe pchnięcia płaszczyzny — każde bada JEDEN kanał pary (kanał pobudzany)
    HC:   [{canal:"horizontal", ear:"P"}, {canal:"horizontal", ear:"L"}],
    RALP: [{canal:"anterior",   ear:"P"}, {canal:"posterior",  ear:"L"}],   // prawy przedni + lewy tylny
    LARP: [{canal:"anterior",   ear:"L"}, {canal:"posterior",  ear:"P"}]    // lewy przedni + prawy tylny
  };
  const canalSpec = spec => {
    const s = (typeof spec==="string") ? {canal:"horizontal", ear:spec}
                                       : {canal:(spec&&spec.canal)||"horizontal", ear:spec&&spec.ear};
    if(!CANAL_PARAM[s.canal]) throw new TypeError('canalSpec: nieznany kanał "'+s.canal+'" (horizontal|anterior|posterior)');
    if(s.ear!=="L" && s.ear!=="P") throw new TypeError('canalSpec: nieprawidłowa strona "'+s.ear+'" (L|P)');
    return s;
  };
  function canalPlane(canal, ear){
    if(canal==="horizontal") return "HC";
    const ralp = (canal==="anterior" && ear==="P") || (canal==="posterior" && ear==="L");
    return ralp ? "RALP" : "LARP";     // RALP = prawy przedni / lewy tylny; LARP = lewy przedni / prawy tylny
  }

  // ETAP 6 — KOMPENSACJA OŚRODKOWA (neuroplastyczność pnia/móżdżku). [H10][H11]
  // Po ostrym UVH mózg odtwarza SYMETRIĘ SPOCZYNKOWĄ (kompensacja STATYCZNA) dwutorowo:
  //   • CLAMP MÓŻDŻKOWY — kłaczek/robak gwałtownie HAMUJE zdrowe jądro (obniża VN_zdrowe); szybki,
  //     dominuje we WCZESNEJ fazie (małe c), słabnie gdy przejmuje pacemaker.
  //   • PACEMAKER WŁASNY — odnerwione jądro chore uwrażliwia się (upregulacja) i generuje AUTONOMICZNY
  //     rytm spoczynkowy (podnosi VN_chore); późny i TRWAŁY.
  // c∈[0,1]: 0=faza ostra (pełna asymetria → oczopląs samoistny), 1=pełna kompensacja (symetria, oczopląs znika).
  // clamp + pacemaker sumują się DOKŁADNIE do zniesionej asymetrii (restored=c·gap) → BEZ przeregulowania.
  // pacemakerBias (Hz, sticky): zatrzaśnięty ładunek pacemakera NIEZALEŻNY od bieżącego tonu — nośnik
  //   „naładowania" umożliwiający oczopląs POWROTNY (Bechterewa), gdy błędnik odzyska funkcję (etap 6b).
  // Zwraca aktywność JĄDER przedsionkowych (VN) — to ją, nie surowy błędnik, „widzi" push-pull (etap 1).
  const CLAMP_TAU = 0.32;    // rozkład udziału clampu w c: exp(−c/τ) — 1 przy c→0, ~0.04 przy c=1 (clamp ustępuje pacemakerowi)
  function compensate(p){
    const c = Math.max(0, Math.min(1, p.comp||0));
    const bias = p.pacemakerBias||0;                         // sticky ładunek pacemakera (Hz)
    const rL = afferent(p.toneL,0), rR = afferent(p.toneR,0);// surowy błędnik po rektyfikacji (Ewald)
    const lesion = p.lesionEar || (rL<rR ? "L" : rR<rL ? "P" : null);   // strona chora = słabszy błędnik
    let vnL=rL, vnR=rR, clampAmt=0, paceAmt=0;
    if(c>0 && lesion){
      const intactRate = lesion==="L" ? rR : rL, lesionRate = lesion==="L" ? rL : rR;
      const gap = Math.max(0, intactRate - lesionRate);      // asymetria ostra do zniesienia
      const restored = c*gap;                                // ile asymetrii już zniesiono (0→gap)
      const clampShare = Math.exp(-c/CLAMP_TAU);             // udział clampu (wczesny) vs pacemakera (późny)
      clampAmt = restored*clampShare;                        // obniżenie zdrowego jądra (przejściowe)
      paceAmt  = restored*(1-clampShare);                    // podniesienie chorego jądra (trwałe)
      if(lesion==="L"){ vnL = lesionRate+paceAmt; vnR = intactRate-clampAmt; }
      else            { vnR = lesionRate+paceAmt; vnL = intactRate-clampAmt; }
    }
    if(bias && lesion){ if(lesion==="L") vnL += bias; else vnR += bias; }   // sticky pacemaker (Bechterew)
    return { vnL, vnR, c, lesionEar:lesion, clampAmt, paceAmt, pacemakerBias:bias };
  }

  // ETAP 7 (E3/E4) — składowa PIONOWO-SKRĘTNA oczopląsu z PAR WSPÓŁPŁASZCZYZNOWYCH kanałów pionowych.
  // Push-pull per PŁASZCZYZNA: LARP = przedni-L ∥ tylny-P, RALP = przedni-P ∥ tylny-L. Imbalans pary
  // imb = (aktywność PRZEDNIEGO − aktywność TYLNEGO)/R0 udaje obrót w tej płaszczyźnie: przedni aktywniejszy
  // → faza szybka DOWNBEAT (v:−1) + skręt (LARP ku L, RALP ku P); tylny aktywniejszy → UPBEAT + skręt odwrotny.
  // KLUCZ: SYMETRYCZNY ubytek pary (oba kanały równo) → imb=0 → BRAK oczopląsu — istotne dla BVH (E4);
  // sumowanie PER-PARA (a nie per-kanał) gwarantuje to zniesienie mimo różnych magnitud AC/PC.
  // W spoczynku wszystkie = R0 → wektor ZERO (czysto poziomy przypadek bez zmian, backward compat). [H15]
  const TORS_V = 0.8;    // udział skrętu wzgl. pionu w oczopląsie kanałów pionowych (poglądowo; geom. ~0.78–1.0)
  const VERT_PAIRS = [
    { ac:"toneAcL", pc:"tonePcR", tSign:-1 },   // LARP: przedni LEWY ∥ tylny PRAWY → skręt ku L (−)
    { ac:"toneAcR", pc:"tonePcL", tSign:+1 }    // RALP: przedni PRAWY ∥ tylny LEWY → skręt ku P (+)
  ];
  function verticalBeat(p){
    let v=0, t=0;
    for(const pr of VERT_PAIRS){
      const imb = (afferent(p[pr.ac],0) - afferent(p[pr.pc],0))/R0;  // przewaga przedniego(+)/tylnego(−) w płaszczyźnie
      if(!imb) continue;
      v += imb*(-1);                 // przedni aktywniejszy → downbeat; tylny aktywniejszy → upbeat
      t += imb*pr.tSign*TORS_V;      // skręt zależny od płaszczyzny (LARP ku L, RALP ku P)
    }
    const mag = Math.hypot(v, t), spvV = SPV_MAX*Math.min(1, mag);
    return { v, t, mag, spvV, present: spvV >= VIS_THRESH };
  }

  // ETAP 7 (E4) — SCDS / fenomen TULLIO: dehiscencja kanału GÓRNEGO (przedniego) = TRZECIE OKNO ruchome.
  // Pozwala, by DŹWIĘK lub CIŚNIENIE (Valsalva, Hennebert, ucisk skrawka) odchyliły osklepek kanału górnego
  // BEZ ruchu głową → oczopląs w płaszczyźnie tego kanału (PIONOWO-SKRĘTNY). Bodziec POBUDZAJĄCY (głośny
  // dźwięk, dodatnie ciśnienie, Valsalva na zaciśnięte nozdrza) → przepływ ampullofugalny → faza WOLNA ku
  // GÓRZE i skrętnie (biegun górny OD ucha chorego); zatem faza SZYBKA w DÓŁ i skrętnie KU uchu choremu
  // (= szybka faza pobudzonego kanału przedniego). Bodziec HAMUJĄCY (podciśnienie) → kierunek odwrotny.
  // Reużywa PEŁNEJ geometrii (Vestibular.nysMag), bo skręt kanału przedniego jest znakiem rozpoznawczym
  // SCDS (maska kliniczna quickPhase zeruje go dla BPPV — tu potrzebny). W spoczynku (bez bodźca) cisza. [H18]
  const PRESSURE_EXC = { sound:+1, valsalva:+1, pressure:+1, hennebert:+1 };  // domyślny znak: +pobudzenie
  function pressureStimulus(p, opts){
    opts = opts||{};
    const ear = p.dehiscence, type = opts.type||"sound";
    const intensity = opts.intensity==null ? 1 : Math.max(0, Math.min(1, opts.intensity));
    const sign = opts.sign!=null ? (Math.sign(opts.sign)||1) : (PRESSURE_EXC[type]||1);  // + pobudzenie / − hamowanie
    if(!ear || !intensity)                                     // brak dehiscencji lub brak bodźca → brak odpowiedzi
      return { present:false, ear:ear||null, type, sign, intensity:0, h:0, v:0, t:0, dir:0, tdir:0, vdir:1, spv:0, strength:0, kind:"none" };
    const q = qpFull("anterior", ear);                        // wspólne, niemaskowane źródło (jak sakada vHIT / pion)
    let hh=q.h, vv=q.v, tt=q.t;                                // szybka faza pobudzonego kanału przedniego: downbeat + skręt ku uchu chorego
    const n = Math.hypot(hh, vv, tt) || 1;
    hh = sign*hh/n; vv = sign*vv/n; tt = sign*tt/n;           // znak bodźca (pobudzenie/hamowanie) × wektor jednostkowy
    const spv = SPV_MAX*intensity;                            // faza wolna rośnie z natężeniem bodźca (BEZ ruchu głową)
    return { present:true, ear, type, sign, intensity, h:hh, v:vv, t:tt,
      dir: Math.sign(hh*camRx())||0, tdir: Math.sign(tt*camRx())||0, vdir: Math.sign(vv)||1,
      spv, strength: intensity, kind:"verticalTorsional" };
  }

  // ETAP 1 — Oczopląs SAMOISTNY z asymetrii tonicznej (push-pull). [H1][H2]
  // Mózg szacuje prędkość głowy z różnicy aferentów pary poziomej: Ω_est ∝ (rateL − rateR)
  //   (obrót w LEWO pobudza lewy kanał → rateL↑). W spoczynku rate=tone → asymetria toniczna
  //   udaje stały obrót: faza WOLNA ku błędnikowi słabszemu, faza SZYBKA (widoczny beat) ku
  //   silniejszemu (zdrowemu). Kierunek stały niezależnie od spojrzenia — cecha OBWODOWA.
  function spontaneous(p){
    const cmp = compensate(p);                     // aktywność JĄDER przedsionkowych po kompensacji (etap 6)
    const rL = cmp.vnL, rR = cmp.vnR;              // c=0 i bias=0 → rL=afferent(toneL,0) itd. (dokładny no-op)
    const imbalance = rL - rR;                     // >0 ⇒ pozorny obrót w lewo ⇒ faza wolna w prawo ⇒ bije w LEWO
    const asym = Math.min(1, Math.abs(imbalance)/R0);
    const spv = SPV_MAX*asym;                      // °/s — surowa faza wolna (bez fiksacji)
    const beatSign = -Math.sign(imbalance) || 0;   // head-frame: +1 ku P, −1 ku L (ku silniejszemu uchu)
    const beatEar   = beatSign>0 ? "P" : beatSign<0 ? "L" : null;   // ucho z wyższą aktywnością jądra (kierunek bicia)
    const lesionEar = imbalance>0 ? "P" : imbalance<0 ? "L" : null; // ucho z niższą aktywnością jądra
    // Bechterew: bicie ku uchu PIERWOTNIE choremu (błędnik wrócił, pacemaker wciąż naładowany) — etap 6b.
    const bechterew = !!(cmp.lesionEar && beatEar===cmp.lesionEar && asym>0);
    // składowe head-frame: poziom ku silniejszemu uchu + śladowy skręt (biegun górny ku niemu).
    // PION/SKRĘT z kanałów pionowych (E3) sumują się wektorowo; kompensacja ośrodkowa znosi je tak samo
    // jak poziom (skala 1−c → przy pełnej kompensacji cały oczopląs samoistny znika, także pionowo-skrętny).
    const vb = verticalBeat(p), compFac = 1 - Math.max(0, Math.min(1, p.comp||0));
    const h=beatSign, tH=beatSign*TORS_FRAC;                  // poziomo-skrętna składowa (bez zmian → backward compat)
    const v=vb.v*compFac, tV=vb.t*compFac, t=tH+tV, spvV=vb.spvV*compFac;
    const strengthV=Math.min(1, spvV/SPV_MAX);
    const kind=(strengthV>0 && Math.abs(v)>Math.abs(h)) ? "verticalTorsional" : "horizontalTorsional";
    return { kind, h, v, t, tH, tV,
      dir:  Math.sign(h*camRx()) || 0,             // znak EKRANOWY poziomu (jak nysFromDyn)
      tdir: Math.sign(t*camRx()) || 0,             // znak EKRANOWY skrętu (poziomy + pionowy)
      vdir: Math.sign(v) || 1,                     // + = upbeat (frontal nie odwraca pionu)
      strength: asym, strengthV, spv, spvV, beatEar, lesionEar,
      comp: cmp.c, trueLesionEar: cmp.lesionEar, bechterew,   // etap 6: stan kompensacji
      clampAmt: cmp.clampAmt, paceAmt: cmp.paceAmt, vnL:rL, vnR:rR };
  }

  // ETAP 2 — SUPRESJA FIKSACJI (kłaczek / parakłaczek). [H3]
  // Równanie oka: prędkość_oka = sygnał_VOR − fixationGain·retinal_slip. W fazie wolnej poślizg
  // siatkówkowy = surowa faza wolna; pętla wzrokowa (pościg/optokinetyka przez kłaczek) odejmuje ją.
  // Z FIKSACJĄ (światło) oczopląs OBWODOWY gaśnie (fixationGain≈0.9); w ciemności/goglach Frenzla
  // (brak fiksacji) bije z pełną siłą. OŚRODEK: kłaczek uszkodzony → fixationGain≈0 → NIE tłumi się
  // fiksacją (a bywa silniejszy: fixationGain<0 = paradoksalne wzmocnienie).
  function suppressionFactor(p, fixOn){
    if(!fixOn) return 1;                                    // ciemność / Frenzel — brak sprzężenia wzrokowego
    const g = Math.max(-0.5, Math.min(1, p.fixationGain));
    return Math.max(0, 1 - g);                              // g=0.9→0.1 (obwód gaśnie); g=0→1 (ośrodek trwa); g<0→>1 (paradoks)
  }
  // Oczopląs OBSERWOWANY w danym stanie fiksacji (fixOn: true=światło/fiksacja, false=ciemność/Frenzel).
  function observe(p, fixOn){
    const s = spontaneous(p), f = suppressionFactor(p, fixOn), spvRaw = s.spv;
    return Object.assign({}, s, {
      spv: spvRaw*f, spvRaw, fixation: !!fixOn, suppressionFactor: f,
      suppressed: spvRaw>0.5 && f<=0.5,                     // klinicznie „tłumi się fiksacją" (≥50% redukcji)
      strength: spvRaw>0 ? s.strength*f : 0,                // amplituda renderera skaluje się z WIDOCZNĄ fazą wolną
      spvV: (s.spvV||0)*f, strengthV: (s.strengthV||0)*f    // E3: pionowo-skrętna też tłumiona fiksacją (obwód)
    });
  }

  // ETAP 3 — TEST PCHNIĘCIA GŁOWY (Head Impulse / vHIT). [H4][H5]
  // Szybkie, bierne pchnięcie głowy w bok X pobudza kanał poziomy IPSILATERALNY (Ewald II —
  // przepływ ampullopetalny), a hamuje przeciwny. Przy dużej prędkości kanał HAMOWANY uderza w
  // OBCIĘCIE HAMOWANIA (0 Hz) i przestaje nieść informację → sygnał prędkości niesie WYŁĄCZNIE kanał
  // POBUDZANY. Dlatego HIT bada kanał ipsilateralny: uszkodzony (niska gainX) → VOR gain<1 → oko nie
  // nadąża → poślizg siatkówkowy → SAKADA KORYGUJĄCA (catch-up) ku celowi (przeciwnie do pchnięcia).
  //   OBWÓD (neuronitis): gain kanału chorego niski → sakada przy pchnięciu ku choremu = wynik PATOLOGICZNY.
  //   OŚRODEK (udar): kanały zdrowe (gain≈1) → HIT PRAWIDŁOWY (brak sakady) = zły znak (nie uspokaja).
  const S_HZ = 0.8;          // czułość aferentu (Hz na °/s) — kalibracja: obcięcie hamowania ~tone/S ≈112°/s < prędkości vHIT
  const VIS_THRESH = 2;      // próg widoczności klinicznej oczopląsu (°/s) — poniżej: brak jawnego oczopląsu

  // ETAP 6c — KOMPENSACJA DYNAMICZNA: fuzja sensoryczna + velocity storage. [H12][H13][H14]
  // Wysokich częstotliwości VOR (vHIT) NIE da się naprawić (gain trwa). Ośrodek kompensuje inaczej:
  //  (1) FUZJA WAŻONA WIARYGODNOŚCIĄ (precision-weighted / komplementarny filtr — model optymalnego
  //      estymatora). Kanał przedsionkowy niesie estymatę prędkości z wagą = jego WIARYGODNOŚĆ. Przy
  //      dużej prędkości wiarygodność KANAŁU załamuje się (kanał hamowany wyzerowany, pobudzany nasyca)
  //      i spada z gain → estymator PRZEŁĄCZA się na PROPRIOCEPCJĘ SZYI / efference-copy (COR); waga
  //      w_szyja rośnie z kompensacją c. „Przełącznik" NIE jest zaprogramowany — WYNIKA z wag.
  //  (2) VELOCITY STORAGE — kompensacja „otwiera zawór" integratora prędkości → krótsza stała czasowa →
  //      oczopląs po obrocie szybciej gaśnie. To OSOBNY układ od integratora utrzymania spojrzenia
  //      (etap 4a): kompensacja skraca velocity storage, a NIE gaze-holding (inaczej fałsz. objaw ośrodkowy).
  const DVS_FRAC = 0.67;     // maks. skrócenie velocity storage przez pełną kompensację (τ 15 s → ~5 s)
  function fusionWeights(p, headVel, spec){
    const c = Math.max(0, Math.min(1, p.comp||0)), Ohm = headVel||200;
    const ex = canalSpec(spec), pk = CANAL_PARAM[ex.canal][ex.ear];   // kanał POBUDZANY (dowolny z 6) niesie sygnał w HIT
    const gEx = p[pk.gain], toneEx = p[pk.tone];             // horizontal 'P'/'L' → gainR/gainL, toneR/toneL (bez zmian)
    const rateEx = afferent(toneEx, +gEx*S_HZ*Ohm);
    const headroom = Math.max(0, (R_SAT - rateEx)/R_SAT);   // zapas do nasycenia: 1=pełny, 0=nasycony (utrata informacji)
    const canalRel = Math.max(0, Math.min(1, gEx)) * (0.5 + 0.5*headroom);  // wiarygodność kanału (gain × zapas)
    const neckRel  = c*(1 - canalRel);                       // propriocepcja/efference: rośnie z c, celuje w „martwe pole" kanału
    const sum = canalRel + neckRel || 1;
    return { wCanal: canalRel/sum, wNeck: neckRel/sum, canalRel, neckRel };
  }
  // Wygaszanie oczopląsu po stymulacji obrotowej (velocity storage). Kompensacja skraca stałą czasową.
  function postRotational(p){
    const c = Math.max(0, Math.min(1, p.comp||0)), base = Math.max(1, p.tauVS||15);
    return { tauBase: base, tau: base*(1 - DVS_FRAC*c), c, shortened: c>0 };
  }

  // spec: 'P'/'L' (poziomy, zgodność wsteczna) LUB {canal,ear} — dowolny z 6 kanałów (HC/przedni/tylny × L/P).
  function headImpulse(p, spec, opts){
    opts = opts||{};
    const Ohm = opts.headVel||200, amp = opts.headAmp||15;   // szczyt prędkości (°/s) i amplituda (°) pchnięcia
    const ex = canalSpec(spec), toSide = ex.ear;             // kanał POBUDZANY = testowany; strona pchnięcia = jego ucho
    const inh = COPLANAR[ex.canal][ex.ear];                  // kanał HAMOWANY = współpłaszczyznowy z DRUGIEJ strony
    const pkEx = CANAL_PARAM[ex.canal][ex.ear], pkIn = CANAL_PARAM[inh.canal][inh.ear];
    const gEx = p[pkEx.gain], gIn = p[pkIn.gain];            // horizontal 'P' → gainR/gainL (bez zmian numerycznych)
    const toneEx = p[pkEx.tone], toneIn = p[pkIn.tone];
    const rateEx = afferent(toneEx, +gEx*S_HZ*Ohm);          // pobudzany (może nasycać ≤R_SAT)
    const rateIn = afferent(toneIn, -gIn*S_HZ*Ohm);          // hamowany (obcięcie na 0)
    const modEx = rateEx - toneEx, modIn = rateIn - toneIn;  // modulacje względem spoczynku (+ / −)
    // Przy prędkości vHIT kanał hamowany jest obcięty → prędkość VOR niesie kanał pobudzany.
    // gain = modulacja pobudzana / modulacja idealna (gEx=1 bez nasycenia → gain 1).
    const gain = Math.max(0, Math.min(1.25, modEx/(S_HZ*Ohm)));
    const deficit = Math.max(0, 1-gain);
    const saccadeAmp = deficit*amp;                          // CAŁKOWity niedomiar rotacji oka → sakada korygująca (gain nienaprawialny)
    const abnormal = saccadeAmp >= 2.5;                      // vHIT PATOLOGICZNY (deficyt gain) — NIEZALEŻNY od kompensacji
    // KOMPENSACJA DYNAMICZNA: całość korekty stała, ale przesuwa się w czasie z sakady JAWNEJ (overt —
    // spóźnionej, po pchnięciu, napędzanej ślizgiem) na UKRYTĄ (covert — predykcyjnej, w trakcie pchnięcia,
    // z fuzji szyjno-ocznej/efference). Udział covert = KOMPLETNOŚĆ kompensacji c (przy pełnej kompensacji
    // korekta jest w całości predykcyjna). fusionWeights (fw) = MECHANIZM: przy prędkości vHIT kanał
    // niewiarygodny → układ opiera się na propriocepcji szyi (wNeck rośnie), co UMOŻLIWIA sakadę ukrytą. [H12][H13][H14]
    const fw = fusionWeights(p, Ohm, ex);
    const covertFrac = Math.max(0, Math.min(1, p.comp||0));  // predykcyjny udział → sakada ukryta (0 gdy niekompensowany, 1 przy pełnej)
    const covertAmp = saccadeAmp*covertFrac, overtAmp = saccadeAmp*(1-covertFrac);
    const overt  = overtAmp  >= 2.5;                         // JAWNA sakada — widoczna gołym okiem (bedside HIT)
    const covert = covertAmp >= 1.0;                         // UKRYTA sakada — wykrywalna tylko w vHIT (goggles)
    const plane = canalPlane(ex.canal, ex.ear);
    // Kierunek SAKADY KORYGUJĄCEJ = faza WOLNA VOR (przeciwna do szybkiej fazy POBUDZANEGO kanału),
    // znormalizowana {h,v,t}. Poziomy → czysto poziomy (ku linii środkowej); przedni → pionowy w górę;
    // tylny → pionowo-skrętny (płaszczyzny RALP/LARP). Reuse geometrii kanałów (Vestibular.quickPhase).
    const q = qpFull(ex.canal, ex.ear), qn = Math.hypot(q.h, q.v, q.t)||1;   // pełna geometria (skręt przedniego zachowany)
    const saccade = { h:-q.h/qn, v:-q.v/qn, t:-q.t/qn };
    return {
      toSide, canal:ex.canal, ear:ex.ear, plane, coplanar:inh, saccade,
      headVel:Ohm, headAmp:amp, gain, deficit,
      rateEx, rateIn, modEx, modIn, inhibitedFloored: rateIn<=0,
      saccadeAmp, covertAmp, overtAmp, covertFrac, fusion: fw,
      saccadePresent: overt, overtSaccade: overt, covertSaccade: covert,
      saccadeToSide: toSide==="P" ? "L" : "P",               // catch-up przeciwnie do pchnięcia (poziomy: ku linii środkowej)
      abnormal                                               // patologiczny HIT (deficyt gain); jawność bedside = saccadePresent/overt
    };
  }

  // vHIT całej PŁASZCZYZNY (HC/RALP/LARP): dwa pobudzeniowe pchnięcia — po jednym na każdy kanał pary.
  // Wzorzec nerwu GÓRNEGO (neuronitis superior): HC + PRZEDNI patologiczne, TYLNY prawidłowy (n. dolny sprawny). [H15]
  function vhitPlane(p, plane){
    const list = PLANE_CANALS[plane==null ? "HC" : plane];   // brak płaszczyzny → HC; literówka → jasny błąd (nie ciche HC)
    if(!list) throw new TypeError('vhitPlane: nieznana płaszczyzna "'+plane+'" (dozwolone: HC|RALP|LARP)');
    const tests = list.map(spec => headImpulse(p, spec));
    return { plane, tests, abnormal: tests.some(t=>t.abnormal),
             abnormalCanals: tests.filter(t=>t.abnormal).map(t=>({canal:t.canal, ear:t.ear})) };
  }

  // ETAP 4a — INTEGRATOR NERWOWY „leaky" → oczopląs SPOJRZENIOWY (gaze-evoked). [H6]
  // Utrzymanie oka w położeniu skrajnym θ wymaga tonicznego sygnału pozycji z integratora
  // (pień/móżdżek). Integrator NIESZCZELNY (mała stała τ) nie utrzymuje → oko dryfuje ku środkowi
  // z prędkością θ/τ (faza wolna), a szybka faza wraca ku celowi → oczopląs bije W KIERUNKU spojrzenia.
  //   Zdrowy τ≈25 s → przy 20° dryf 0.8°/s (klinicznie niewidoczny). OŚRODEK (leaky) τ≈1–3 s →
  //   dryf ~7–20°/s → oczopląs ZMIENIAJĄCY KIERUNEK ze spojrzeniem (prawo→bije w prawo, lewo→w lewo).
  function gazeEvoked(p, gazeDeg){
    const tau = Math.max(0.2, p.integratorTau||25);
    const drift = gazeDeg/tau;                               // °/s: znak = kierunek szybkiej fazy (ku spojrzeniu)
    return { gazeDeg, tau, spv: Math.abs(drift), beatSign: Math.sign(gazeDeg)||0, driftVel: drift, present: Math.abs(drift)>=VIS_THRESH };
  }
  // Oczopląs WYPADKOWY przy danym spojrzeniu: suma prędkości bicia — SAMOISTNY (obwód, stały kierunek,
  // z fiksacją) + SPOJRZENIOWY (ośrodek, zmienny kierunek). Prędkości w head-frame x (+ = bije ku P/prawej).
  function nystagmusAtGaze(p, gazeDeg, fixOn){
    const sp = observe(p, fixOn);                            // samoistny (po supresji fiksacji)
    const Vspont = (sp.h||0)*sp.spv;                         // sp.h = znak bicia head-frame; sp.spv = |faza wolna|
    const Vge = gazeEvoked(p, gazeDeg).driftVel;             // spojrzeniowy (nie tłumiony fiksacją — objaw ośrodkowy)
    const Vnet = Vspont + Vge;                               // wypadkowa prędkość bicia
    const beatHead = Math.sign(Vnet)||0, spv = Math.abs(Vnet);
    return { gazeDeg, beatHead, spv, strength: Math.min(1, spv/SPV_MAX),
      dir: Math.sign(beatHead*camRx())||0, tdir: sp.tdir, t: sp.t,
      v: sp.v||0, vdir: sp.vdir||1, strengthV: sp.strengthV||0,   // E3: pionowo-skrętna składowa niesiona z samoistnego
      kind: sp.kind||"horizontalTorsional", components:{Vspont, Vge} };
  }
  // Czy oczopląs ZMIENIA KIERUNEK ze spojrzeniem (cecha OŚRODKOWA)? Próbkujemy skrajne spojrzenia.
  // Wymóg: oczopląs KLINICZNIE WIDOCZNY (≥próg) po OBU stronach i przeciwne kierunki bicia. Silny
  // oczopląs samoistny (obwód) może zdominować dryf spojrzeniowy → pozostaje jednokierunkowy.
  function directionChanging(p, fixOn, ecc){
    ecc = ecc||20;
    const L = nystagmusAtGaze(p, -ecc, fixOn), R = nystagmusAtGaze(p, +ecc, fixOn);
    return L.spv>=VIS_THRESH && R.spv>=VIS_THRESH && L.beatHead!==0 && R.beatHead!==0 && L.beatHead!==R.beatHead;
  }

  // ETAP 4b — ODCHYLENIE SKOŚNE / OTR (otolity + MLF). [H7]
  // Łagiewka wysyła wektor grawiceptywny; sygnał krzyżuje się w pniu i utrzymuje oczy w poziomie.
  // Asymetria toniczna grawiceptywna lub przerwanie MLF → reakcja pochylenia ocznego (OTR): jedno oko
  // wyżej (hyper), drugie niżej (hypo) + współtowarzysząca torsja (bieguny górne ku oku niższemu).
  // Test naprzemiennego zasłaniania (cover): odsłonięte oko łapie fiksację PIONOWĄ SAKADĄ korygującą
  //   → widoczny rozjazd pionowy = TS DODATNI = objaw OŚRODKOWY (w kontekście AVS).
  //   skewTone (°, ze znakiem): + = oko PRAWE wyżej / lewe niżej; − = odwrotnie. 0 = oczy w linii.
  const SKEW_CENTRAL = 2.5;   // próg skew dla flagi OŚRODKOWEJ (INFARCT). Poniżej: skew MAŁY — może być OBWODOWY
                              // (łagiewka, n. górny) → NIE liczony jako cecha ośrodkowa (unika fałszywego „udaru").
  function skew(p){
    const st = p.skewTone||0, mag = Math.abs(st);
    return { present: mag>=1, central: mag>=SKEW_CENTRAL, skewDeg: mag, sign: Math.sign(st)||0,
      hyperSide: st>0?"P":st<0?"L":null,                     // oko wyżej (hipertropijne)
      torsionDeg: p.otrTorsion||0 };                         // torsja OTR (bieguny górne ku oku niższemu)
  }

  // ETAP 7 ([H22]) — SVV / GRAWICEPTYWNY PRZECHYŁ PIONU (subiektywna pionowa). Osobny, CZULSZY pomiar niż
  // odchylenie skośne: łączy ŁAGIEWKĘ (utricle) i kanały PIONOWE (przedni+tylny). W ostrym ubytku OBWODOWYM
  // pion przechyla się KU STRONIE CHOREJ (ipsiwersyjnie). Neuronitis DOLNY (utrata tylnego) daje MAŁY przechył
  // ku choremu, mimo prawidłowego odchylenia skośnego (skew z łagiewki = 0) — zgodne z Musat 2025. Symetria
  // (BVH) → 0. NIE wpływa na werdykt HINTS (to odczyt uzupełniający, nie składowa INFARCT).
  const SVV_MAX=12, SVV_UTRICLE=1.5, SVV_VCANAL=1.0, SVV_GAIN=5, SVV_THRESH=2;
  function svv(p){
    const g = e => Math.max(0,Math.min(1,p["utricle"+e]))*SVV_UTRICLE
      + ((afferent(p["toneAc"+e],0)+afferent(p["tonePc"+e],0))/(2*R0))*SVV_VCANAL;   // grawiceptywna „siła" ucha
    const gR=g("R"), gL=g("L"), imb=gR-gL;                   // >0 prawa mocniejsza → pion ku LEWEJ (słabszej/chorej)
    const tiltSide = imb>1e-6?"L" : imb<-1e-6?"P" : null;    // KU STRONIE CHOREJ (słabszej grawiceptywnie)
    const deg = Math.min(SVV_MAX, Math.abs(imb)*SVV_GAIN);
    return { tiltSide, deg, abnormal: deg>=SVV_THRESH };
  }

  // ETAP 7 ([H22]) — VEMP: przedsionkowe miogenne potencjały wywołane. cVEMP (szyjny) ≈ WORECZEK (n. DOLNY),
  // ipsilateralnie; oVEMP (oczny) ≈ ŁAGIEWKA (n. GÓRNY). Rozdziela gałęzie nerwu: neuronitis DOLNY → cVEMP↓ +
  // oVEMP prawidłowy; GÓRNY → odwrotnie. Amplituda z funkcji narządu (0..1). AR% = asymetria międzyuszna.
  const VEMP_THRESH=0.3;    // amplituda < 0.3 → „zniesiony"; 0.3..0.65 → „obniżony"; ≥0.65 → „prawidłowy"
  function vemp(p){
    const clamp = x => Math.max(0, Math.min(1, x));
    const stat = a => a>=0.65 ? tr("prawidłowy","normal") : a>=VEMP_THRESH ? tr("obniżony","reduced") : tr("zniesiony","absent");
    const asym = (L,R) => (L+R)>0 ? Math.abs(L-R)/(L+R) : 0;                     // AR% (0..1)
    const weak = (L,R) => Math.abs(L-R)<0.1 ? null : (L<R?"L":"P");
    const cL=clamp(p.sacculeL), cR=clamp(p.sacculeR), oL=clamp(p.utricleL), oR=clamp(p.utricleR);
    return {
      cVEMP:{ organ:tr("woreczek","saccule"), nerve:tr("dolny","inferior"), L:stat(cL), R:stat(cR), ampL:cL, ampR:cR, asym:asym(cL,cR), weakEar:weak(cL,cR) },
      oVEMP:{ organ:tr("łagiewka","utricle"), nerve:tr("górny","superior"), L:stat(oL), R:stat(oR), ampL:oL, ampR:oR, asym:asym(oL,oR), weakEar:weak(oL,oR) }
    };
  }

  // ETAP 7 (E4.5) — PRÓBA KALORYCZNA (bitermalna, wzór Jongkeesa). [H21]
  // Kaloryka = NISKOczęstotliwościowy (~0.003 Hz) test kanału POZIOMEGO — drugi koniec charakterystyki
  // przenoszenia względem vHIT (~5 Hz). Dlatego skaluje się OSOBNYM gainem (caloricGain), nie `gain` (HF):
  // to umożliwia DYSOCJACJĘ kaloryka↔vHIT (Ménière: kaloryka↓, vHIT prawidłowy). Bodziec = jednostronny
  // drive termiczny na HC drażnionego ucha: CIEPŁA pobudza (bije KU niemu), ZIMNA hamuje (przeciwnie) = COWS.
  // Oczopląs samoistny (ciemność) NAKŁADA się → przewaga kierunkowa (DP). Skala CAL_NORMAL nieistotna dla
  // CP/DP (to STOSUNKI), istotna dla sumy bezwzględnej (osłabienie obustronne). caloricGain jest OBWODOWY →
  // niezależny od kompensacji ośrodkowej: kaloryka ODSŁANIA skompensowany ubytek (CP trwa, gdy oczopląs znikł).
  const CAL_NORMAL = 20;   // °/s — prawidłowa szczytowa SPV pojedynczej irygacji przy caloricGain=1
  const CAL_BILAT  = 6;    // °/s — próg (kryt. Bárány): suma ciepła+zimna DANEGO ucha < CAL_BILAT → osłabienie
  const CP_THRESH  = 25;   // % — istotny niedowład kanału (unilateral weakness)
  const DP_THRESH  = 30;   // % — istotna przewaga kierunkowa
  function caloricGainOf(p, ear){ const g = ear==="P" ? p.caloricGainR : p.caloricGainL; return Math.max(0, g==null?1:g); }
  function caloricDir(ear, temp){ return (temp==="cold"?-1:1) * (ear==="P"?+1:-1); }   // head-frame +=ku P; COWS
  function caloric(p, o){
    o = o||{};
    const ear = o.ear==="L" ? "L" : "P", temp = o.temp==="cold" ? "cold" : "warm";
    const cg = caloricGainOf(p, ear);
    const Vcal = CAL_NORMAL * cg * caloricDir(ear, temp);    // składowa kaloryczna (∝ gain NISKOczęstotliwościowy)
    const sp = observe(p, false);                            // oczopląs samoistny (ciemność) — nakłada się → DP
    const Vsp = (sp.h||0) * sp.spv;                          // head-frame signed (+ ku P)
    const Vtot = Vcal + Vsp, spv = Math.abs(Vtot), beatSign = Math.sign(Vtot)||0;
    const fix = suppressionFactor(p, true);                  // indeks fiksacji = supresja fiksacją (kłaczek)
    return { ear, temp, spv, spvFix: spv*fix, fixationIndex: fix, failsSuppression: fix>0.5,
      beatSign, beatEar: beatSign>0?"P":beatSign<0?"L":null, dir: Math.sign(beatSign*camRx())||0,
      caloricGain: cg, Vcal, Vsp };
  }
  // Bateria bitermalna: 4 irygacje → CP (niedowład kanału, LOKALIZUJE) + DP (przewaga kierunkowa) wzorem Jongkeesa.
  function caloricBattery(p){
    const rw=caloric(p,{ear:"P",temp:"warm"}), rc=caloric(p,{ear:"P",temp:"cold"}),
          lw=caloric(p,{ear:"L",temp:"warm"}), lc=caloric(p,{ear:"L",temp:"cold"});
    const RW=rw.spv, RC=rc.spv, LW=lw.spv, LC=lc.spv;
    const rightSum=RW+RC, leftSum=LW+LC, total=rightSum+leftSum;
    const CP = total>0 ? (rightSum-leftSum)/total*100 : 0;   // SUROWY (raw): <0 = PRAWE słabsze; >0 = LEWE słabsze
    const DP = total>0 ? ((RW+LC)-(LW+RC))/total*100 : 0;    // >0 = przewaga bicia ku P; <0 = ku L
    // CP KORYGOWANY o tło (E5): z samej składowej kalorycznej |Vcal| — odjęty nałożony oczopląs samoistny,
    // który MASKUJE niedowład (surowy CP zaniża przy ostrym oczoplątem). Skorygowany = prawdziwa asymetria. [H21]
    const cR=Math.abs(rw.Vcal)+Math.abs(rc.Vcal), cL=Math.abs(lw.Vcal)+Math.abs(lc.Vcal), cT=cR+cL;
    const CPcorrected = cT>0 ? (cR-cL)/cT*100 : 0;
    const bilateralWeak = rightSum<CAL_BILAT && leftSum<CAL_BILAT;   // UWAGA: przy symetrii CP≈0 mimo obustronnego ubytku!
    const fixationIndex = suppressionFactor(p, true);
    const hcHIT = vhitPlane(p,"HC").abnormal;               // vHIT poziomego (HF) — do porównania dysocjacyjnego
    const caloricWeak = Math.abs(CPcorrected)>=CP_THRESH || bilateralWeak;   // skorygowany = odporny na maskowanie
    return { RW, RC, LW, LC, rightSum, leftSum, total,
      CP, CPcorrected, DP, weakEar: Math.abs(CPcorrected)>=CP_THRESH ? (CPcorrected<0?"P":"L") : null,
      dpSide: Math.abs(DP)>=DP_THRESH ? (DP>0?"P":"L") : null,
      bilateralWeak, fixationIndex, failsSuppression: fixationIndex>0.5,
      vHITabnormal: hcHIT, caloricWeak, dissociation: caloricWeak && !hcHIT,   // kaloryka+ / vHIT− = wzorzec Ménière
      reverseDissociation: hcHIT && !caloricWeak && !bilateralWeak };          // vHIT+ / kaloryka− = ubytek WYSOKOczęstotliwościowy
  }

  // ETAP 5 — SCENARIUSZE (presety) i SYNTEZA HINTS. [H8]
  // KLUCZ „first principles": ton STATYCZNY (spoczynkowa aktywność → oczopląs samoistny) i
  // wzmocnienie DYNAMICZNE kanału (gain → HIT) to OSOBNE parametry. Dlatego udar może dać oczopląs
  // samoistny przy PRAWIDŁOWYM HIT (rozprzężenie stat./dyn.), a obwód — oczopląs + patologiczny HIT
  // po tej samej stronie. Patologię tworzy zmiana kilku liczb; wynik HINTS wypada sam.
  const SCENARIOS = {
    normal:       { get label(){return tr("Zdrowy / równowaga","Healthy / balance");}, side:null,
      params:{} },
    neuritisR:    { get label(){return tr("Neuronitis przedsionkowy — ucho P (OBWÓD)","Vestibular neuritis — R ear (PERIPHERAL)");}, side:"P",
      params:{ toneR:5, gainR:0.35, caloricGainR:0.3, fixationGain:0.9, integratorTau:25, skewTone:0 } },
    neuritisL:    { get label(){return tr("Neuronitis przedsionkowy — ucho L (OBWÓD)","Vestibular neuritis — L ear (PERIPHERAL)");}, side:"L",
      params:{ toneL:5, gainL:0.35, caloricGainL:0.3, fixationGain:0.9, integratorTau:25, skewTone:0 } },
    strokeCentral:{ get label(){return tr("Udar móżdżku / pnia (OŚRODEK)","Cerebellar / brainstem stroke (CENTRAL)");}, side:"P",
      // kanały SPRAWNE (gain≈1 → HIT prawidłowy), łagodny ton asymetryczny ośrodkowy (oczopląs samoistny),
      // integrator „leaky" (oczopląs zmienny kierunkowo), asymetria grawiceptywna (skew + torsja).
      params:{ toneR:72, gainL:1, gainR:1, fixationGain:0, integratorTau:2.2, skewTone:3, otrTorsion:4 } },
    bvh:          { get label(){return tr("Obustronna westybulopatia / otoksyczność (BVH)","Bilateral vestibulopathy / ototoxicity (BVH)");}, side:null,
      // SYMETRYCZNY ubytek OBU błędników → brak oczopląsu samoistnego (symetria!), ale vHIT patologiczny
      // OBUSTRONNIE we wszystkich płaszczyznach. Objawy: oscylopsja przy ruchu głowy, chód po ciemku (nie okoruch).
      params: bilateralLoss(1) },
  };
  function scenario(key){ const s = SCENARIOS[key]||SCENARIOS.normal; return makePatient(s.params); }

  // Synteza HINTS z parametrów pacjenta → trzy składowe + werdykt obwód/ośrodek (mnemonik INFARCT).
  function hints(p){
    const hiR = headImpulse(p,"P"), hiL = headImpulse(p,"L");
    const hiAbnormal = hiR.abnormal || hiL.abnormal;
    const hiSide = hiR.abnormal ? "P" : hiL.abnormal ? "L" : null;
    const dark = observe(p,false), lit = observe(p,true);
    const hasSpont = dark.spv >= VIS_THRESH;                  // AVS = obecny oczopląs samoistny
    const dirChanging = directionChanging(p, true);
    const ts = skew(p);
    const nyPattern = dirChanging ? "directionChanging" : (hasSpont ? "unidirectional" : "none");
    // INFARCT — ważny w kontekście AVS (obecny oczopląs samoistny):
    const impulseNormalDanger = hasSpont && !hiAbnormal;      // HIT prawidłowy MIMO oczopląsu = ośrodek
    const anyFinding = hasSpont || dirChanging || ts.present || hiAbnormal;
    const centralSigns = [];
    if(impulseNormalDanger) centralSigns.push(tr("HIT prawidłowy mimo oczopląsu samoistnego (Impulse Normal)","HIT normal despite spontaneous nystagmus (Impulse Normal)"));
    if(dirChanging)         centralSigns.push(tr("oczopląs zmienny kierunkowo (Fast-phase Alternating)","direction-changing nystagmus (Fast-phase Alternating)"));
    if(ts.central)          centralSigns.push(tr("dodatni Test of Skew — pionowa sakada przy odsłanianiu (Refixation on Cover Test)","positive Test of Skew — vertical saccade on uncovering (Refixation on Cover Test)"));   // tylko ZNACZĄCY skew (mały = obwodowy)
    const verdict = !anyFinding ? "normal" : (centralSigns.length ? "central" : "peripheral");
    return {
      verdict,
      hi: { abnormal:hiAbnormal, side:hiSide, right:hiR, left:hiL },
      ny: { pattern:nyPattern, hasSpontaneous:hasSpont, directionChanging:dirChanging,
            suppresses:lit.suppressed, dark, lit },
      ts,
      infarct: { impulseNormal:impulseNormalDanger, fastAlternating:dirChanging, refixationCover:ts.central },
      centralSigns
    };
  }

  // ETAP 7 (E5) — PARAM_SPEC: metadane parametrów dla UI „matematycznego pacjenta" (suwaki/selektory).
  // group: „basic" widoczne od razu, „advanced" zwijane. Każdy: key, label, min/max/step/unit/def LUB type:"select".
  const PARAM_SPEC = [
    { get group(){return tr("Kanał poziomy (HC)","Horizontal canal (HC)");}, tier:"basic", get help(){return tr("Ton = spoczynek (→ oczopląs samoistny); gain = vHIT wysokiej częstotliwości.","Tone = rest (→ spontaneous nystagmus); gain = high-frequency vHIT.");}, params:[
      { key:"toneL", get label(){return tr("Ton HC lewy","HC tone left");},  min:0, max:200, step:1, unit:"Hz", def:R0 },
      { key:"toneR", get label(){return tr("Ton HC prawy","HC tone right");}, min:0, max:200, step:1, unit:"Hz", def:R0 },
      { key:"gainL", get label(){return tr("Gain HC lewy (vHIT)","HC gain left (vHIT)");},  min:0, max:1.2, step:0.05, unit:"", def:1 },
      { key:"gainR", get label(){return tr("Gain HC prawy (vHIT)","HC gain right (vHIT)");}, min:0, max:1.2, step:0.05, unit:"", def:1 } ]},
    { get group(){return tr("Kaloryka (niska częstotliwość)","Caloric (low frequency)");}, tier:"basic", get help(){return tr("Osobna oś od vHIT → dysocjacja LF/HF (Ménière).","A separate axis from vHIT → LF/HF dissociation (Ménière).");}, params:[
      { key:"caloricGainL", get label(){return tr("Kaloryczny gain lewy","Caloric gain left");},  min:0, max:1.2, step:0.05, unit:"", def:1 },
      { key:"caloricGainR", get label(){return tr("Kaloryczny gain prawy","Caloric gain right");}, min:0, max:1.2, step:0.05, unit:"", def:1 } ]},
    { get group(){return tr("Kanał przedni (nerw górny)","Anterior canal (superior nerve)");}, tier:"advanced", get help(){return tr("Płaszczyzny RALP/LARP; nerw górny = HC+przedni+łagiewka.","RALP/LARP planes; superior nerve = HC + anterior + utricle.");}, params:[
      { key:"toneAcL", get label(){return tr("Ton AC lewy","AC tone left");},  min:0, max:200, step:1, unit:"Hz", def:R0 },
      { key:"toneAcR", get label(){return tr("Ton AC prawy","AC tone right");}, min:0, max:200, step:1, unit:"Hz", def:R0 },
      { key:"gainAcL", get label(){return tr("Gain AC lewy","AC gain left");},  min:0, max:1.2, step:0.05, unit:"", def:1 },
      { key:"gainAcR", get label(){return tr("Gain AC prawy","AC gain right");}, min:0, max:1.2, step:0.05, unit:"", def:1 } ]},
    { get group(){return tr("Kanał tylny (nerw dolny)","Posterior canal (inferior nerve)");}, tier:"advanced", get help(){return tr("Nerw dolny = tylny+woreczek; kaloryka go NIE bada.","Inferior nerve = posterior + saccule; caloric does NOT test it.");}, params:[
      { key:"tonePcL", get label(){return tr("Ton PC lewy","PC tone left");},  min:0, max:200, step:1, unit:"Hz", def:R0 },
      { key:"tonePcR", get label(){return tr("Ton PC prawy","PC tone right");}, min:0, max:200, step:1, unit:"Hz", def:R0 },
      { key:"gainPcL", get label(){return tr("Gain PC lewy","PC gain left");},  min:0, max:1.2, step:0.05, unit:"", def:1 },
      { key:"gainPcR", get label(){return tr("Gain PC prawy","PC gain right");}, min:0, max:1.2, step:0.05, unit:"", def:1 } ]},
    { get group(){return tr("Przetwarzanie ośrodkowe","Central processing");}, tier:"advanced", get help(){return tr("Kłaczek (fiksacja), integrator (spojrzeniowy), otolity (skew).","Flocculus (fixation), integrator (gaze), otoliths (skew).");}, params:[
      { key:"fixationGain",  get label(){return tr("Supresja fiksacji","Fixation suppression");}, min:-0.5, max:1, step:0.05, unit:"", def:0.9 },
      { key:"integratorTau", get label(){return tr("Integrator (τ spojrzenia)","Integrator (gaze τ)");}, min:0.5, max:30, step:0.5, unit:"s", def:25 },
      { key:"skewTone",      get label(){return tr("Asymetria grawiceptywna (skew)","Graviceptive asymmetry (skew)");}, min:-6, max:6, step:0.5, unit:"°", def:0 },
      { key:"otrTorsion",    get label(){return tr("Torsja OTR","OTR torsion");}, min:0, max:10, step:0.5, unit:"°", def:0 } ]},
    { get group(){return tr("Kompensacja ośrodkowa","Central compensation");}, tier:"advanced", get help(){return tr("Neuroplastyka: znosi oczopląs, ale NIE kalorykę.","Neuroplasticity: abolishes nystagmus but NOT the caloric.");}, params:[
      { key:"comp",          get label(){return tr("Poziom kompensacji","Compensation level");}, min:0, max:1, step:0.05, unit:"", def:0 },
      { key:"pacemakerBias", get label(){return tr("Ładunek pacemakera (Bechterew)","Pacemaker charge (Bechterew)");}, min:0, max:40, step:1, unit:"Hz", def:0 },
      { key:"tauVS",         label:"Velocity storage (τ)", min:1, max:20, step:0.5, unit:"s", def:15 },
      { key:"lesionEar", get label(){return tr("Strona chora (kompensacja)","Affected side (compensation)");}, type:"select", def:null,
        options:[ {v:null,l:"auto"}, {v:"L",get l(){return tr("lewa","left");}}, {v:"P",get l(){return tr("prawa","right");}} ] } ]},
    { get group(){return tr("Otolity (VEMP / SVV)","Otoliths (VEMP / SVV)");}, tier:"advanced", get help(){return tr("Woreczek→cVEMP (n. dolny); łagiewka→oVEMP (n. górny). Współtworzą przechył SVV.","Saccule→cVEMP (inferior nerve); utricle→oVEMP (superior nerve). They contribute to SVV tilt.");}, params:[
      { key:"sacculeL", get label(){return tr("Woreczek lewy (cVEMP)","Saccule left (cVEMP)");},  min:0, max:1, step:0.05, unit:"", def:1 },
      { key:"sacculeR", get label(){return tr("Woreczek prawy (cVEMP)","Saccule right (cVEMP)");}, min:0, max:1, step:0.05, unit:"", def:1 },
      { key:"utricleL", get label(){return tr("Łagiewka lewa (oVEMP)","Utricle left (oVEMP)");},  min:0, max:1, step:0.05, unit:"", def:1 },
      { key:"utricleR", get label(){return tr("Łagiewka prawa (oVEMP)","Utricle right (oVEMP)");}, min:0, max:1, step:0.05, unit:"", def:1 } ]},
    { get group(){return tr("Trzecie okno (SCDS)","Third window (SCDS)");}, tier:"advanced", get help(){return tr("Dehiscencja kan. górnego → objaw Tullio/Hennebert.","Superior canal dehiscence → Tullio/Hennebert sign.");}, params:[
      { key:"dehiscence", get label(){return tr("Dehiscencja kan. górnego","Superior canal dehiscence");}, type:"select", def:null,
        options:[ {v:null,get l(){return tr("brak","none");}}, {v:"L",get l(){return tr("lewa","left");}}, {v:"P",get l(){return tr("prawa","right");}} ] } ]}
  ];

  // ETAP 7 (E5) — SYNTEZA KLINICZNA: pełny odczyt z parametrów (objawy + sygnały obwód/ośrodek +
  // niejednoznaczności + lokalizacja). Reużywa hints/caloricBattery/vhitPlane/observe/skew/pressureStimulus.
  // Narzędzie DYDAKTYCZNE, nie diagnostyczne. [H8][H21]
  function clinicalReadout(p){
    const R1 = x => Math.round(x*10)/10;
    const side = e => e==="P" ? tr("prawej","right") : e==="L" ? tr("lewej","left") : null;
    const h = hints(p), cal = caloricBattery(p);
    const dark = h.ny.dark, lit = h.ny.lit, sk = h.ts;         // Fix7: reuse z hints (bez ponownego observe/skew)
    const hc = { plane:"HC", tests:[h.hi.right, h.hi.left], abnormal:h.hi.abnormal };  // HC = te same pchnięcia co w hints
    const ralp = vhitPlane(p,"RALP"), larp = vhitPlane(p,"LARP");  // płaszczyzny pionowe — liczone raz
    const scds = p.dehiscence ? pressureStimulus(p,{type:"sound"}) : null;
    const findings = [], peripheralSigns = [], centralSigns = [], ambiguities = [];

    // oczopląs samoistny (POZIOMY i/lub PIONOWO-SKRĘTNY) + fiksacja + spojrzeniowy
    const hSpont = dark.spv >= VIS_THRESH, vSpont = (dark.spvV||0) >= VIS_THRESH;
    if(hSpont || vSpont){
      const parts = [];
      if(hSpont) parts.push(tr(`poziomo-skrętny ku stronie ${side(dark.beatEar)} (${R1(dark.spv)}°/s)`,`horizontal-torsional toward the ${side(dark.beatEar)} side (${R1(dark.spv)}°/s)`));
      if(vSpont) parts.push(tr(`pionowo-skrętny ${dark.vdir<0?"downbeat":"upbeat"} (${R1(dark.spvV)}°/s)`,`vertical-torsional ${dark.vdir<0?"downbeat":"upbeat"} (${R1(dark.spvV)}°/s)`));
      const f = lit.suppressionFactor, supp = f<=0.5 && (dark.spv>0.5 || (dark.spvV||0)>0.5);  // supresja poziomu LUB pionu
      findings.push(tr(`Oczopląs samoistny: ${parts.join(" + ")}; ${supp?"tłumiony":"NIEtłumiony"} fiksacją.`,`Spontaneous nystagmus: ${parts.join(" + ")}; ${supp?"suppressed":"NOT suppressed"} by fixation.`));
      (supp ? peripheralSigns : centralSigns).push(supp ? tr("oczopląs tłumiony fiksacją","nystagmus suppressed by fixation") : tr("oczopląs NIEtłumiony fiksacją","nystagmus NOT suppressed by fixation"));
      if(vSpont && !hSpont) centralSigns.push(tr("izolowany oczopląs pionowo-skrętny (klasycznie podejrzany o ośrodek)","isolated vertical-torsional nystagmus (classically suspicious for a central cause)"));
    } else findings.push(tr("Brak oczopląsu samoistnego w spoczynku.","No spontaneous nystagmus at rest."));
    if(h.ny.directionChanging){ findings.push(tr("Oczopląs zmienia kierunek ze spojrzeniem (spojrzeniowy).","Nystagmus changes direction with gaze (gaze-evoked).")); centralSigns.push(tr("oczopląs zmienny kierunkowo","direction-changing nystagmus")); }

    // vHIT płaszczyzn
    const planes = [];
    if(hc.abnormal)   planes.push(tr("poziomej","horizontal"));
    if(ralp.abnormal) planes.push(tr("RALP (przedni P / tylny L)","RALP (anterior R / posterior L)"));
    if(larp.abnormal) planes.push(tr("LARP (przedni L / tylny P)","LARP (anterior L / posterior R)"));
    if(planes.length){ findings.push(tr(`vHIT patologiczny w płaszczyźnie: ${planes.join(", ")}.`,`Pathological vHIT in the plane: ${planes.join(", ")}.`)); peripheralSigns.push(tr("patologiczny vHIT (ubytek obwodowy)","pathological vHIT (peripheral deficit)")); }
    else findings.push(tr("vHIT prawidłowy we wszystkich płaszczyznach.","vHIT normal in all planes."));

    // skew — cecha OŚRODKOWA tylko gdy ZNACZĄCY (sk.central); mały skew może być obwodowy (łagiewka)
    if(sk.present){
      findings.push(tr(`Odchylenie skośne: oko ${sk.hyperSide==="P"?"prawe":"lewe"} wyżej (${R1(sk.skewDeg)}°)${sk.central?"":" — małe, może być obwodowe (łagiewka)"}.`,`Skew deviation: ${sk.hyperSide==="P"?"right":"left"} eye higher (${R1(sk.skewDeg)}°)${sk.central?"":" — small, may be peripheral (utricle)"}.`));
      if(sk.central) centralSigns.push(tr("dodatni test odchylenia skośnego (znaczący)","positive skew deviation test (significant)"));
    }

    // kaloryka
    if(cal.bilateralWeak) findings.push(tr("Kaloryka: OBUSTRONNE osłabienie (suma odpowiedzi poniżej progu) — CP≈0 mimo ubytku.","Caloric: BILATERAL weakness (sum of responses below threshold) — CP≈0 despite the deficit."));
    else if(cal.weakEar)  findings.push(tr(`Kaloryka: niedowład kanału po stronie ${side(cal.weakEar)} (CP skoryg. ${R1(Math.abs(cal.CPcorrected))}%).`,`Caloric: canal paresis on the ${side(cal.weakEar)} side (corrected CP ${R1(Math.abs(cal.CPcorrected))}%).`));
    else findings.push(tr("Kaloryka: prawidłowa (brak istotnego niedowładu).","Caloric: normal (no significant paresis)."));
    if(Math.abs(cal.DP) >= DP_THRESH) findings.push(tr(`Przewaga kierunkowa ku stronie ${side(cal.dpSide)} (DP ${R1(Math.abs(cal.DP))}%).`,`Directional preponderance toward the ${side(cal.dpSide)} side (DP ${R1(Math.abs(cal.DP))}%).`));

    // SCDS
    if(scds && scds.present){ findings.push(tr(`SCDS: dźwięk/ciśnienie wyzwala oczopląs pionowo-skrętny (dehiscencja po stronie ${side(p.dehiscence)}), bez ruchu głową.`,`SCDS: sound/pressure triggers vertical-torsional nystagmus (dehiscence on the ${side(p.dehiscence)} side), without head movement.`)); peripheralSigns.push(tr("dodatni objaw Tullio/Hennebert (trzecie okno)","positive Tullio/Hennebert sign (third window)")); }

    // SVV / przechył pionu — grawiceptywny (łagiewka + kanały pionowe); OBWODOWY, ku stronie chorej. Czulszy niż
    // odchylenie skośne: neuronitis DOLNY daje mały przechył SVV mimo prawidłowego skew (skew z łagiewki=0). [H22]
    const sv = svv(p);
    if(sv.abnormal){ findings.push(tr(`SVV: przechył pionu ku stronie ${side(sv.tiltSide)} (${R1(sv.deg)}°) — grawiceptywny, obwodowy${sk.present?"":" (odchylenie skośne prawidłowe)"}.`,`SVV: vertical tilt toward the ${side(sv.tiltSide)} side (${R1(sv.deg)}°) — graviceptive, peripheral${sk.present?"":" (skew deviation normal)"}.`)); peripheralSigns.push(tr("przechył SVV ku stronie chorej","SVV tilt toward the affected side")); }

    // VEMP — cVEMP ≈ WORECZEK (n. DOLNY), oVEMP ≈ ŁAGIEWKA (n. GÓRNY): rozdziela gałęzie nerwu. [H22]
    const ve = vemp(p);
    if(ve.cVEMP.weakEar){ findings.push(tr(`cVEMP ${ve.cVEMP[ve.cVEMP.weakEar==="P"?"R":"L"]} po stronie ${side(ve.cVEMP.weakEar)} — woreczek (nerw DOLNY).`,`cVEMP ${ve.cVEMP[ve.cVEMP.weakEar==="P"?"R":"L"]} on the ${side(ve.cVEMP.weakEar)} side — saccule (INFERIOR nerve).`)); peripheralSigns.push(tr("cVEMP obniżony (woreczek — n. dolny)","cVEMP reduced (saccule — inferior nerve)")); }
    if(ve.oVEMP.weakEar){ findings.push(tr(`oVEMP ${ve.oVEMP[ve.oVEMP.weakEar==="P"?"R":"L"]} po stronie ${side(ve.oVEMP.weakEar)} — łagiewka (nerw GÓRNY).`,`oVEMP ${ve.oVEMP[ve.oVEMP.weakEar==="P"?"R":"L"]} on the ${side(ve.oVEMP.weakEar)} side — utricle (SUPERIOR nerve).`)); peripheralSigns.push(tr("oVEMP obniżony (łagiewka — n. górny)","oVEMP reduced (utricle — superior nerve)")); }

    // lokalizacja (z wzorca vHIT + kaloryki). Nerw GÓRNY (ucho E) = kanał poziomy-E + przedni-E; przedni-P leży
    // w płaszczyźnie RALP, przedni-L w LARP (tylny-E — nerw DOLNY — oszczędzony). Stąd wzorzec superior =
    // HC patologiczny + JEDNA płaszczyzna skośna (od strony chorej) patologiczna, druga prawidłowa.
    const lesSide = cal.weakEar || h.hi.side;
    const supObl = lesSide==="P" ? ralp.abnormal : lesSide==="L" ? larp.abnormal : false;   // płaszczyzna z przednim kanałem ucha chorego
    const othObl = lesSide==="P" ? larp.abnormal : lesSide==="L" ? ralp.abnormal : false;   // druga skośna (kanał tylny — nerw dolny)
    let localization;
    if(cal.bilateralWeak && hc.abnormal)                              localization = tr("obustronna westybulopatia (BVH)","bilateral vestibulopathy (BVH)");
    else if(hc.abnormal && ralp.abnormal && larp.abnormal)           localization = tr(`pełny ubytek błędnika po stronie ${side(lesSide)}`,`complete labyrinthine loss on the ${side(lesSide)} side`);
    else if((ralp.abnormal||larp.abnormal) && !hc.abnormal && !cal.weakEar){ const pcS=ralp.abnormal?"L":"P"; localization = tr(`nerw DOLNY (kanał tylny) po stronie ${side(pcS)}${ve.cVEMP.weakEar===pcS?" + cVEMP↓ (woreczek)":""} — kaloryka i HC prawidłowe`,`INFERIOR nerve (posterior canal) on the ${side(pcS)} side${ve.cVEMP.weakEar===pcS?" + cVEMP↓ (saccule)":""} — caloric and HC normal`); }   // RALP zawiera tylny-L, LARP tylny-P
    else if(cal.dissociation && cal.weakEar && !hc.abnormal)          localization = tr(`ubytek NISKOczęstotliwościowy (wodniak / Ménière?) po stronie ${side(cal.weakEar)}`,`LOW-frequency deficit (hydrops / Ménière?) on the ${side(cal.weakEar)} side`);
    else if((hc.abnormal||cal.weakEar) && supObl && !othObl)          localization = tr(`nerw GÓRNY po stronie ${side(lesSide)} (poziomy + przedni)${ve.oVEMP.weakEar===lesSide?" + oVEMP↓ (łagiewka)":""}`,`SUPERIOR nerve on the ${side(lesSide)} side (horizontal + anterior)${ve.oVEMP.weakEar===lesSide?" + oVEMP↓ (utricle)":""}`);
    else if((hc.abnormal||cal.weakEar) && !ralp.abnormal && !larp.abnormal) localization = tr(`nerw GÓRNY po stronie ${side(lesSide)} (kanał poziomy)`,`SUPERIOR nerve on the ${side(lesSide)} side (horizontal canal)`);
    else if(ve.cVEMP.weakEar && !ve.oVEMP.weakEar && !planes.length && !cal.weakEar) localization = tr(`nerw DOLNY (woreczek) po stronie ${side(ve.cVEMP.weakEar)} — izolowany ubytek otolitowy (cVEMP↓, oVEMP prawidłowy)`,`INFERIOR nerve (saccule) on the ${side(ve.cVEMP.weakEar)} side — isolated otolithic deficit (cVEMP↓, oVEMP normal)`);
    else if(h.verdict==="central")                                    localization = tr("ośrodkowa (pień/móżdżek)","central (brainstem/cerebellum)");
    else if(scds && scds.present)                                     localization = tr(`SCDS / trzecie okno po stronie ${side(p.dehiscence)}`,`SCDS / third window on the ${side(p.dehiscence)} side`);
    else if(!h.ny.hasSpontaneous && !cal.caloricWeak && !planes.length && !(sk.present) && !sv.abnormal && !ve.cVEMP.weakEar && !ve.oVEMP.weakEar) localization = tr("brak lokalizacji (obraz prawidłowy)","no localization (normal picture)");
    else                                                              localization = tr("nieokreślona","indeterminate");

    // niejednoznaczności / pułapki
    if(cal.dissociation) ambiguities.push(tr("Dysocjacja kaloryka↔vHIT (LF osłabiona, HF prawidłowy): wodniak/Ménière lub ubytek niskoczęstotliwościowy. Obraz często NAPADOWY → HINTS (dla ciągłego AVS) nie ma zastosowania.","Caloric↔vHIT dissociation (LF weakened, HF normal): hydrops/Ménière or a low-frequency deficit. The picture is often PAROXYSMAL → HINTS (for continuous AVS) does not apply."));
    if(h.infarct.impulseNormal && cal.weakEar) ambiguities.push(tr("HIT prawidłowy mimo oczopląsu, ale kaloryka lokalizuje ubytek OBWODOWY — rozważ fazę DRAŻNIENIA Ménière (napadowy) zamiast udaru.","HIT normal despite nystagmus, but caloric localizes a PERIPHERAL deficit — consider the IRRITATIVE phase of Ménière (paroxysmal) rather than a stroke."));
    if(cal.bilateralWeak) ambiguities.push(tr("HINTS zakłada jednostronny AVS — przy obustronnym ubytku (BVH) nie różnicuje; kieruj się sumą kaloryczną i obustronnym vHIT.","HINTS assumes a unilateral AVS — with a bilateral deficit (BVH) it does not differentiate; be guided by the caloric sum and bilateral vHIT."));
    if((ralp.abnormal||larp.abnormal) && !hc.abnormal && !cal.weakEar) ambiguities.push(tr("Kaloryka i vHIT poziomy prawidłowe, lecz vHIT kanału tylnego patologiczny — neuronitis nerwu DOLNEGO (kaloryka go NIE wykrywa).","Caloric and horizontal vHIT normal, but posterior-canal vHIT pathological — INFERIOR nerve neuritis (caloric does NOT detect it)."));
    if(cal.reverseDissociation) ambiguities.push(tr("Odwrotna dysocjacja: vHIT poziomy patologiczny przy PRAWIDŁOWEJ kalorycе — ubytek WYSOKOczęstotliwościowy (lub wczesna/częściowo skompensowana faza).","Reverse dissociation: horizontal vHIT pathological with a NORMAL caloric — a HIGH-frequency deficit (or an early/partially compensated phase)."));

    return { verdict:h.verdict, localization, findings, peripheralSigns, centralSigns, ambiguities,
      hints:h, caloric:cal, vhit:{ HC:hc, RALP:ralp, LARP:larp }, spontaneous:dark, skew:sk, scds, svv:sv, vemp:ve };
  }

  return { R0, R_SAT, SPV_MAX, VIS_THRESH, CLAMP_TAU, DVS_FRAC, afferent, makePatient, compensate, verticalBeat, pressureStimulus, spontaneous, suppressionFactor, observe,
           headImpulse, fusionWeights, postRotational, gazeEvoked, nystagmusAtGaze, directionChanging, skew, svv, vemp, caloric, caloricBattery,
           CANAL_PARAM, NERVE_CANALS, nerveBranchLesion, bilateralLoss, meniere,
           COPLANAR, PLANE_CANALS, canalSpec, canalPlane, qpFull, vhitPlane,
           SCENARIOS, scenario, hints, PARAM_SPEC, clinicalReadout };
})();

/* Źródło orientacji głowy (pluggable) — etap A: ręczne; później: żyroskop / DeviceOrientation / replay.
   Zwraca kwaternion orientacji głowy (układ głowy → świat) w konwencji silnika. */
