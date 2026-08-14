// Poza + domena manewrów/diagnostyki BPPV (czyste: silnik → plan/poza/oczopląs; bez state/DOM).
import { Vestibular } from '../engine/vestibular.js';
import { Scene3D } from '../engine/scene3d.js';
// UWAGA: żadnego importu z runtime/registry ani render/svg-screens — ten moduł jest czysty (patrz
// nagłówek). Wisiały tu martwe importy `$` i `render` (nieużywane w całym pliku), przez które KAŻDY
// czysto-nodowy import pozy (bridge:check, view:check) wciągał cały 2450-liniowy moduł renderujący.
import { t } from '../i18n.js';

const SIDE = {L:"lewa", P:"prawa"};
const SIDE_EN = {L:"left", P:"right"};
const sideN = a => t(SIDE[a], SIDE_EN[a]);   // reaktywna nazwa strony (PL/EN) do wplatania w instrukcje kroków
const otherSide = s => s==="L" ? "P" : "L";
// prawe ucho pacjenta po lewej stronie badającego -> ekranowy kierunek
const earToScreen = s => s==="P" ? -1 : 1;
const yawToA = side => side==="L" ? -45 : 45;   // obrót KU uchu choremu: L=w lewo(-), P=w prawo(+); konwencja yaw>0=prawo

/* ============ Silnik neurologiczny — etap 0 (regułowy) ============
   Czysty moduł bez DOM. Koduje prawa Ewalda i mapowanie kanał → oś ruchu oka.
   Wyjście: składowe szybkiej fazy oczopląsu w układzie pacjenta:
     h: + w prawo / − w lewo   (pozioma)
     v: + ku górze / − w dół    (pionowa)
     t: + górne bieguny w prawo / − w lewo  (skrętna)
    Side kodujemy jako 'L'/'P' (lewe/prawe ucho).
*/
function makeManualOrientation(){
  // walidacja + normalizacja wejścia (sensor/użytkownik): kwaternion niejednostkowy skalowałby rzuty o |q|²,
  // a przechowywanie/oddawanie referencji pozwalałoby mutować stan spoza API. Zwracamy KOPIE. [audyt #4]
  const normQuat = nq => {
    if(!Array.isArray(nq) || nq.length!==4 || nq.some(v=>!Number.isFinite(v)))
      throw new TypeError("makeManualOrientation: kwaternion musi być [w,x,y,z] o skończonych składowych");
    const n=Math.hypot(nq[0],nq[1],nq[2],nq[3]); if(n<1e-12) throw new RangeError("makeManualOrientation: kwaternion zerowy");
    return [nq[0]/n, nq[1]/n, nq[2]/n, nq[3]/n];
  };
  let q=[1,0,0,0];
  const api = {
    setQuat(nq){ q=normQuat(nq); return api; },                 // waliduje + normalizuje + kopiuje
    // yaw = obrót wokół osi czaszki (y); znak zgodny z dialem/qaxis (yaw>0 = obrót w PRAWO — audyt #5)
    setYaw(yawDeg){ q = Vestibular.qaxis([0,1,0], yawDeg); return api; },
    get(){ return q.slice(); }                                  // kopia — chroni stan wewnętrzny przed mutacją
  };
  return api;
}


/* ============ Manewry repozycyjne ============ */
function epley(side){
  const A=side,H=otherSide(side),aY=yawToA(A),hY=-aY;
  const sideH=H==="L"?"sideL":"sideR";
  return {name:t("Manewr Epleya","Epley maneuver"),canal:"posterior",side,headCamera:"topDownBehind",steps:[
    {title:t("Pozycja wyjściowa","Starting position"),body:"sit",yaw:aY,face:"fwd",seconds:null,progress:0.02,
     headSlot:{kind:"backTurn",dir:A}, headText:t(`Stań za pacjentem i skręć głowę ${A==="L"?"w lewo":"w prawo"}.`,`Stand behind the patient and turn the head ${A==="L"?"to the left":"to the right"}.`),
     instr:t(`Pacjent siada na kozetce. Obróć jego głowę o 45° w stronę chorą (${sideN(A)}).`,`The patient sits on the couch. Turn their head 45° toward the affected side (${sideN(A)}).`)},
    {title:t("Szybkie położenie na plecach","Quick move to supine"),body:"supineHang",yaw:aY,face:"up",seconds:30,progress:0.18,
     instr:t(`Połóż pacjenta szybko na plecach, głowa odchylona ~20° poza krawędź kozetki, wciąż obrócona 45° w stronę ${sideN(A)}. Utrzymaj do ustąpienia oczopląsu.`,`Lay the patient down quickly on their back, head extended ~20° beyond the edge of the couch, still turned 45° toward the ${sideN(A)} side. Hold until the nystagmus subsides.`)},
    {title:t("Obrót głowy o 90°","Turn the head 90°"),body:"supineHang",yaw:hY,face:"up",seconds:30,progress:0.45,
     instr:t(`Obróć głowę o 90° w stronę zdrową, tak że jest odchylona 45° w stronę ${sideN(H)}. Utrzymaj.`,`Turn the head 90° toward the healthy side, so it is rotated 45° toward the ${sideN(H)} side. Hold.`)},
    {title:t("Obrót na bok zdrowy","Roll onto the healthy side"),body:sideH,yaw:hY,face:"down",seconds:30,progress:0.74,
     instr:t(`Obróć pacjenta na bok ${sideN(H)} i dodatkowo głowę o kolejne 90°, tak by nos był skierowany ku podłodze. Utrzymaj.`,`Roll the patient onto the ${sideN(H)} side and turn the head a further 90°, so the nose points toward the floor. Hold.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sit",yaw:hY,face:"fwd",seconds:null,progress:1.0,
     headSlot:{kind:"textOnly"}, headText:t(`Poproś chorego o opuszczenie nóg na podłogę po stronie zdrowej (${A==="L"?"prawej":"lewej"}). Dynamicznym ruchem pomóż choremu usiąść.`,`Ask the patient to lower their legs to the floor on the healthy side (${A==="L"?"right":"left"}). With a brisk motion, help the patient sit up.`),
     instr:t(`Powoli posadź pacjenta, utrzymując obrót głowy w stronę zdrową, a następnie wyprostuj głowę. Koniec serii.`,`Slowly sit the patient up, keeping the head turned toward the healthy side, then straighten the head. End of the series.`)},
  ]};
}
function semont(side){
  const A=side,H=otherSide(side),hY=-yawToA(A);
  // obserwator na wprost; pacjent pada na bok chory, potem zdrowy. lewy bok pacjenta = ekran prawy.
  const leanA=A==="L"?"leanR":"leanL";
  const leanH=A==="L"?"leanL":"leanR";
  return {name:t("Manewr Semonta","Semont maneuver"),canal:"posterior",side,steps:[
    {title:t("Pozycja wyjściowa","Starting position"),body:"sitFront",yaw:hY,face:"fwd",seconds:null,progress:0.02,
     instr:t(`Pacjent siedzi na środku kozetki, twarzą do badającego. Obróć jego twarz o 45° w stronę zdrową (${sideN(H)}).`,`The patient sits in the middle of the couch, facing the examiner. Turn their face 45° toward the healthy side (${sideN(H)}).`)},
    {title:t("Szybki rzut na bok chory","Rapid drop onto the affected side"),body:leanA,yaw:hY,face:"up",seconds:90,progress:0.25,
     instr:t(`Szybko połóż pacjenta na bok chory (${sideN(A)}). Głowa pozostaje obrócona — nos ku górze. Utrzymaj 1–3 min.`,`Quickly lay the patient onto the affected side (${sideN(A)}). The head stays turned — nose pointing up. Hold 1–3 min.`)},
    {title:t("Szybki rzut na bok przeciwny","Rapid drop onto the opposite side"),body:leanH,yaw:hY,face:"down",seconds:90,progress:0.72,
     instr:t(`Bez zmiany ustawienia głowy szybko przemieść pacjenta na bok przeciwny (${sideN(H)}) — nos ku podłodze. Utrzymaj 1–3 min.`,`Without changing the head position, quickly move the patient onto the opposite side (${sideN(H)}) — nose toward the floor. Hold 1–3 min.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sitFront",yaw:hY,face:"fwd",seconds:null,progress:1.0,
     instr:t(`Powoli posadź pacjenta, nie zmieniając pozycji badającego, a następnie wyprostuj głowę. Koniec serii.`,`Slowly sit the patient up without changing the examiner's position, then straighten the head. End of the series.`)},
  ]};
}
function bascule(side){
  const A=side,H=otherSide(side),hY=-yawToA(A);
  // Bascule (fr. „huśtawka”) — manewr UWALNIAJĄCY dla KUPULOLITIAZY kanału tylnego (oraz opornych,
  // atypowych postaci; rzadziej kanał przedni). Pacjent rytmicznie BUJA się bok–bok: siły bezwładności
  // odrywają złóg przylegający do osklepka (cupula) i przenoszą go do łagiewki. Głowa 45° w stronę
  // ZDROWĄ przez cały manewr (jak Semont). leanA=bok chory w dół, leanH=bok zdrowy w dół — te same pozy
  // leanL/leanR co Semont (LEAN_G dostarcza gHead „nos w dół/górę”); różni się KOLEJNOŚĆ i powtarzalność.
  const leanA=A==="L"?"leanR":"leanL";
  const leanH=A==="L"?"leanL":"leanR";
  return {name:t("Manewr Bascule","Bascule maneuver"),canal:"posterior",side,mechanism:"cupulo",steps:[   // mechanism:"cupulo" → wędrówka pokazuje przyleganie/odklejanie od osklepka i wyjście do łagiewki
    {title:t("Pozycja wyjściowa","Starting position"),body:"sitFront",yaw:hY,face:"fwd",seconds:null,progress:0.02,
     instr:t(`Pacjent siedzi na środku kozetki, twarzą do badającego. Obróć jego głowę o 45° w stronę zdrową (${sideN(H)}) i utrzymuj ten skręt przez cały manewr.`,`The patient sits in the middle of the couch, facing the examiner. Turn their head 45° toward the healthy side (${sideN(H)}) and keep this rotation throughout the maneuver.`)},
    {title:t("Szybko na bok zdrowy — nos w dół","Quickly onto the healthy side — nose down"),body:leanH,yaw:hY,face:"down",seconds:30,progress:0.28,
     instr:t(`Szybko połóż pacjenta na bok zdrowy (${sideN(H)}); głowa wciąż obrócona, nos skierowany ku podłodze. Utrzymaj 15–30 s.`,`Quickly lay the patient onto the healthy side (${sideN(H)}); the head still turned, nose pointing toward the floor. Hold 15–30 s.`)},
    {title:t("Przerzut na bok chory — nos w górę","Swing onto the affected side — nose up"),body:leanA,yaw:hY,face:"up",seconds:30,progress:0.52,
     instr:t(`Szybkim ruchem przerzuć głowę i tułów RAZEM o 180° na bok chory (${sideN(A)}) — nos ku sufitowi. Utrzymaj 15–30 s.`,`With a swift motion, swing the head and trunk TOGETHER 180° onto the affected side (${sideN(A)}) — nose toward the ceiling. Hold 15–30 s.`)},
    {title:t("Powrót na bok zdrowy — nos w dół","Back onto the healthy side — nose down"),body:leanH,yaw:hY,face:"down",seconds:30,progress:0.78,
     instr:t(`Szybko przerzuć pacjenta o 180° z powrotem na bok zdrowy (${sideN(H)}) — nos ku podłodze. To jedna „huśtawka”; powtarzaj przerzuty bok–bok do 5 serii, aż oczopląs i zawroty wygasną.`,`Quickly swing the patient 180° back onto the healthy side (${sideN(H)}) — nose toward the floor. This is one "rock"; repeat the side-to-side swings up to 5 series until the nystagmus and vertigo subside.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sitFront",yaw:hY,face:"fwd",seconds:null,progress:1.0,
     instr:t(`Po ostatniej serii powoli posadź pacjenta, nie zmieniając pozycji badającego, i dopiero na końcu wyprostuj głowę. Po manewrze wykonaj ponowny Dix–Hallpike. Koniec.`,`After the last series, slowly sit the patient up without changing the examiner's position, and only at the end straighten the head. Afterward repeat the Dix–Hallpike. End.`)},
  ]};
}
function lempert(side){
  const A=side,H=otherSide(side),aY=yawToA(A),yawH=A==="L"?-90:90;
  const sideH=H==="L"?"sideL":"sideR",sideA=A==="L"?"sideL":"sideR";
  return {name:t("Manewr Lemperta (rolka BBQ)","Lempert maneuver (BBQ roll)"),canal:"horizontal",side,headCamera:"topDownBehind",steps:[
    {title:t("Na plecach, głowa ku choremu","Supine, head toward the affected side"),body:"supineFlat",yaw:yawH,face:"up",seconds:30,progress:0.08,
     instr:t(`Pacjent leży na plecach. Obróć głowę o 90° w stronę chorą (${sideN(A)}). Utrzymaj.`,`The patient lies supine. Turn the head 90° toward the affected side (${sideN(A)}). Hold.`)},
    {title:t("Głowa twarzą do sufitu","Head facing the ceiling"),body:"supineFlat",yaw:0,face:"up",seconds:30,progress:0.30,
     instr:t(`Obróć głowę o 90° tak, aby nos był skierowany ku sufitowi. Utrzymaj.`,`Turn the head 90° so the nose points toward the ceiling. Hold.`)},
    {title:t("Obrót na bok zdrowy","Roll onto the healthy side"),body:sideH,yaw:-aY,face:"fwd",seconds:30,progress:0.52,
     instr:t(`Obróć głowę i ciało o kolejne 90° w stronę zdrową (${sideN(H)}). Utrzymaj.`,`Turn the head and body a further 90° toward the healthy side (${sideN(H)}). Hold.`)},
    {title:t("Obrót na brzuch","Roll onto the stomach"),body:"prone",yaw:0,face:"down",seconds:30,progress:0.74,
     instr:t(`Kontynuuj obrót o 90° — pacjent na brzuchu, nos ku podłodze. Utrzymaj.`,`Continue the 90° roll — the patient prone, nose toward the floor. Hold.`)},
    {title:t("Obrót na bok chory","Roll onto the affected side"),body:sideA,yaw:aY,face:"fwd",seconds:30,progress:0.92,
     instr:t(`Obróć o kolejne 90° na bok chory (${sideN(A)}). Utrzymaj.`,`Roll a further 90° onto the affected side (${sideN(A)}). Hold.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sit",yaw:0,face:"fwd",seconds:null,progress:1.0,headSlot:{kind:"textOnly"},headText:t(`Pomóż pacjentowi usiąść przez powrót na plecy. Koniec rolki (360°).`,`Help the patient sit up by returning through supine. End of the roll (360°).`),
     instr:t(`Posadź pacjenta przez powrót na plecy. Koniec rolki (360°).`,`Sit the patient up by returning through supine. End of the roll (360°).`)},
  ]};
}
function yacovino(side){
  return {name:t("Głębokie odchylenie głowy (Yacovino)","Deep head-hang (Yacovino)"),canal:"anterior",side,headCamera:"topDownBehind",steps:[
    {title:t("Pozycja wyjściowa","Starting position"),body:"sit",yaw:0,face:"fwd",seconds:null,progress:0.02,
     instr:t(`Pacjent siada na środku kozetki, głowa prosto.`,`The patient sits in the middle of the couch, head straight.`)},
    // (był tu `dynHold:22` — obejście zaszytego cap=12 s; usunięte 2026-08-05, bo hold jest teraz WYPROWADZANY
    //  z silnika i nie ma czego obchodzić. Zostawiony SKRACAŁBY ten krok z holdu wyprowadzonego do 22 s.)
    {title:t("Głębokie odchylenie głowy","Deep head-hang"),body:"supineDeepHang",yaw:0,face:"up",seconds:30,progress:0.30,
     instr:t(`Szybko połóż pacjenta na plecach z głową głęboko odchyloną w dół (znacznie poniżej poziomu). Utrzymaj — złóg opuszcza kanał w tej pozycji.`,`Quickly lay the patient supine with the head hanging deeply downward (well below horizontal). Hold — the debris leaves the canal in this position.`)},
    {title:t("Przygięcie brody do klatki (leżąc)","Chin to chest (while supine)"),body:"supineChin",yaw:0,face:"up",seconds:30,progress:0.70,
     instr:t(`NIE sadzając pacjenta, przygnij jego głowę do przodu — broda do klatki (~45°). Pacjent nadal leży. Utrzymaj.`,`WITHOUT sitting the patient up, flex their head forward — chin to chest (~45°). The patient remains supine. Hold.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sit",yaw:0,face:"chin",seconds:null,progress:1.0,
     instr:t(`Posadź pacjenta, utrzymując brodę przy klatce, i dopiero na końcu wyprostuj głowę. Koniec serii.`,`Sit the patient up, keeping the chin to the chest, and only at the end straighten the head. End of the series.`)},
  ]};
}
function gufoniGeo(side){
  const A=side,H=otherSide(side), leanH=A==="L"?"leanL":"leanR";   // leanH: bok ZDROWY w dół, poza FRONTALNA (jak Gufoni apo); grawitacja = sideX|fwd/|down (fizyka bez zmian)
  return {name:t("Manewr Gufoniego (geotropowy)","Gufoni maneuver (geotropic)"),canal:"horizontal",side,headCamera:"topDownBehind",steps:[
    {title:t("Pozycja wyjściowa","Starting position"),body:"sitFront",yaw:0,face:"fwd",seconds:null,progress:0.05,   // jak Semont krok 1 (widok od przodu), tylko BEZ skrętu głowy 45°
     instr:t(`Pacjent siedzi na środku kozetki, twarzą do badającego, głowa prosto (bez skrętu).`,`The patient sits in the middle of the couch, facing the examiner, head straight (no rotation).`)},
    {title:t("Szybko na bok zdrowy","Quickly onto the healthy side"),body:leanH,yaw:0,face:"fwd",seconds:60,progress:0.32,   // bok ZDROWY w dół, widok od przodu; głowa w linii ciała (leanX|fwd = ta sama grawitacja co sideX|fwd)
     instr:t(`Szybko połóż pacjenta na bok zdrowy (${sideN(H)}). Oczopląs geotropowy ku podłodze (ku uchu ${sideN(H)}). Utrzymaj 1–2 min, do ustąpienia oczopląsu.`,`Quickly lay the patient onto the healthy side (${sideN(H)}). Geotropic nystagmus toward the floor (toward the ${sideN(H)} ear). Hold 1–2 min, until the nystagmus subsides.`)},
    {title:t("Obrót głowy nosem ku podłodze","Turn the head, nose toward the floor"),body:leanH,yaw:0,face:"floor",seconds:60,progress:0.78,   // głowa obrócona nosem w dół; widok od przodu (leanX|floor = ta sama grawitacja co sideX|down)
     instr:t(`Nie zmieniając ułożenia ciała, obróć głowę tak, aby nos był skierowany ku podłodze. Możliwy krótki oczopląs liberacyjny ku podłodze. Utrzymaj 1–2 min.`,`Without changing the body position, turn the head so the nose points toward the floor. A brief liberatory nystagmus toward the floor may occur. Hold 1–2 min.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sitFront",yaw:0,face:"fwd",seconds:null,progress:1.0,   // siad frontalny, głowa wyprostowana
     instr:t(`Powoli posadź pacjenta i wyprostuj głowę. Koniec manewru.`,`Slowly sit the patient up and straighten the head. End of the maneuver.`)},
  ]};
}
function gufoniApo(side){
  const A=side, H=otherSide(side), leanA=A==="L"?"leanR":"leanL";   // leanA: bok CHORY w dół, poza FRONTALNA (jak Semont); głowa neutralna (leanX|fwd) → nos ku sufitowi (leanX|ceil)
  return {name:t("Manewr Gufoniego (apogeotropowy)","Gufoni maneuver (apogeotropic)"),canal:"horizontal",side,mechanism:"cupulo",headCamera:"topDownBehind",steps:[   // apogeotropowy HC-BPPV = KUPULOLITIAZA: złóg startuje WBITY w osklepek (krok 1)
    {title:t("Pozycja wyjściowa","Starting position"),body:"sitFront",yaw:0,face:"fwd",seconds:null,progress:0.05,   // jak Semont krok 1 (widok od przodu), tylko BEZ skrętu głowy 45°
     instr:t(`Pacjent siedzi na środku kozetki, twarzą do badającego, głowa prosto (bez skrętu).`,`The patient sits in the middle of the couch, facing the examiner, head straight (no rotation).`)},
    {title:t("Szybko na bok chory","Quickly onto the affected side"),body:leanA,yaw:0,face:"fwd",seconds:60,progress:0.30,   // bok CHORY w dół, widok od przodu; głowa w linii ciała (leanX|fwd → gHead ±x, ta sama fizyka co sideX|fwd)
     instr:t(`Szybko połóż pacjenta na bok chory (${sideN(A)}). Oczopląs apogeotropowy ku górze (ku uchu ${sideN(H)}). Utrzymaj 1–2 min.`,`Quickly lay the patient onto the affected side (${sideN(A)}). Apogeotropic nystagmus upward (toward the ${sideN(H)} ear). Hold 1–2 min.`)},
    {title:t("Obrót głowy nosem ku sufitowi","Turn the head, nose toward the ceiling"),body:leanA,yaw:0,face:"ceil",seconds:60,progress:0.62,   // głowa skręcona ~90° = nos PROSTO W GÓRĘ; widok od przodu (leanX|ceil)
     instr:t(`Nie zmieniając ułożenia ciała, obróć głowę o ~90° tak, aby nos był skierowany prosto ku górze (ku sufitowi). Utrzymaj 1–2 min.`,`Without changing the body position, turn the head ~90° so the nose points straight up (toward the ceiling). Hold 1–2 min.`)},
    {title:t("Powrót do siadu — kontrola","Return to sitting — check"),body:"sitFront",yaw:A==="L"?90:-90,face:"fwd",seconds:null,progress:0.85,   // siad jak krok 1 (widok od przodu), ale GŁOWA POZOSTAJE skręcona ~90° (nie zmieniamy ustawienia z kroku 3): nos w bok — L→ekran-lewo, P→ekran-prawo (zweryfikowane rzutem nosa). Grawitacja [0,-1,0] niezmienna przy obrocie wokół pionu (fizyka bez zmian).
     instr:t(`Posadź pacjenta, NIE zmieniając ustawienia głowy — pozostaje skręcona ~90° (nos skierowany w bok). Cel: przekształcenie postaci apogeotropowej w geotropową. Wykonaj ponowny Roll test; jeśli potwierdzi postać geotropową, lecz odpowiednio (Lempert lub Gufoni geotropowy).`,`Sit the patient up WITHOUT changing the head position — it stays rotated ~90° (nose pointing to the side). Goal: convert the apogeotropic form into the geotropic one. Repeat the Roll test; if it confirms the geotropic form, treat accordingly (Lempert or Gufoni geotropic).`)},
  ]};
}
const MANEUVERS={
  epley:{label:"Epley", get desc(){return t("kanał tylny","posterior canal");}, gen:epley},
  semont:{label:"Semont", get desc(){return t("kanał tylny","posterior canal");}, gen:semont},
  bascule:{label:"Bascule", get desc(){return t("kupulolitiaza (k. tylny)","cupulolithiasis (post. canal)");}, gen:bascule},
  lempert:{label:"Lempert (BBQ)", get desc(){return t("kanał poziomy","horizontal canal");}, gen:lempert},
  gufoniGeo:{get label(){return t("Gufoni (geotropowy)","Gufoni (geotropic)");}, get desc(){return t("kanał poziomy","horizontal canal");}, gen:gufoniGeo},
  gufoniApo:{get label(){return t("Gufoni (apogeotropowy)","Gufoni (apogeotropic)");}, get desc(){return t("kanał poziomy","horizontal canal");}, gen:gufoniApo},
  yacovino:{label:"Yacovino", get desc(){return t("kanał przedni","anterior canal");}, gen:yacovino},
};
const CANALS={
  posterior:{get label(){return t("Kanał tylny","Posterior canal");}, get note(){return t("najczęstszy (~85%)","most common (~85%)");}, color:"var(--post)",maneuvers:["epley","semont","bascule"]},
  horizontal:{get label(){return t("Kanał poziomy","Horizontal canal");}, note:"~10%", color:"var(--horiz)",maneuvers:["lempert","gufoniGeo","gufoniApo"]},
  anterior:{get label(){return t("Kanał przedni","Anterior canal");}, get note(){return t("rzadki (~1–2%)","rare (~1–2%)");}, color:"var(--ant)",maneuvers:["yacovino"]},
};

/* ============ Testy diagnostyczne ============ */
// PRÓG WIDOCZNOŚCI KARTY OCZOPLĄSU (ocena II, C3) — jedno źródło zamiast trzech literałów 0.10
// rozsianych po svg-screens.js (bezpiecznik manStepEnv, guideNysSeconds, karta kroku renderGuide).
// Jednostka: strength/intensity PO rektyfikacji Ewalda (NIE surowe ξ — dlatego pasmo sprzeczności
// z nystagmusPhase thr=0.05 opisane w engine_doc). Wartość NIEZMIENIONA względem literałów.
const XI_CARD = 0.10;
// Kierunki oczopląsu dla wszystkich testów (Dix–Hallpike, Roll, Bow & Lean) wynikają z
// geometrii (silnik Vestibular): orientacja głowy → grawitacja → przepływ → prawo Ewalda.
function nysFromGeom(canal, side, variant, q, strengthMode){
  const r = Vestibular.position({canal, side, variant, q});
  // 'asym' (Roll): amplituda lateralizuje (Ewald II — hamowanie słabsze);
  // 'flat' (Bow & Lean, Dix): lateralizacja przez kierunek
  // KUPULOLITIAZA słabsza od kanalolitiazy — ten sam współczynnik co w silniku (Vestibular.CUP_WEAK): oczopląs
  //   wariantu „cupulo" mniej intensywny, lecz uporczywy (persistent niżej niesie brak wygasania).
  const cupWeak = variant==="cupulo" ? Vestibular.CUP_WEAK : 1;
  const strength = (strengthMode==="asym" ? (r.excited?1:Vestibular.EWALD_INHIB) : 1) * cupWeak;
  // kierunek NA EKRANIE z KAMERY obserwatora (diagnostyka: 'frontal' — lustro):
  // poziomy beat biegnie wzdłuż osi międzyusznej → ekran-x = h·cam.right[0];
  // skręt odbija się tak samo jak poziom (lustro horyzontalne).
  const camRx = Scene3D.CAMERAS.frontal.right[0];
  return {
    kind: canal==="horizontal" ? "horizontal" : "upbeatTorsional",
    dir:  canal==="horizontal" ? Math.sign((r.h||0)*camRx) : Math.sign((r.t||0)*camRx),
    vdir: Math.sign(r.v||0) || 1,   // kierunek pionowy z silnika (frontal nie odwraca pionu)
    strength,
    persistent: variant==="cupulo",
    canal, side, q,                 // do dynamiki ξ(t): diagnostyka używa realnej pozycji
    anat: {h:r.h, v:r.v, t:r.t}     // anatomiczne składowe (±1) do animacji dialu (widok z tyłu)
  };
}

// Frontalny obiekt oczopląsu dla kroku terapeutycznego (Repozycja) z headNys.
// PEŁNE WYPROWADZENIE Z EWALDA: kierunek + intensywność + ODWRÓCENIE z dynNystagmus(canal, side, ξ).
// ξ (ze znakiem) pochodzi z fizyki (ciągła symulacja / provoke) — NIE z ręcznej annotacji ear/intensity.
// dynNystagmus: kierunek = quickPhase × sign(ξ) (ξ<0 = hamowanie → odwrócenie), intensywność = |ξ|·(ξ>0?1:0.45) (Ewald II).
// apo=true (manewr KUPULOLITYCZNY, np. Gufoni apogeotropowy): oczopląs POZIOMY jest APOGEOTROPOWY — bije w stronę
//   PRZECIWNĄ niż w kanalolitiazie (Ewald II, odwrócenie geo/apo). simulateCanalith daje kierunek GEOTROPOWY,
//   więc dla kupulolitiazy odwracamy składową poziomą — jako odpowiedź PIERWOTNĄ (nie „hamowanie", pełna siła).
function nysFromDyn(canal, side, xiPeak, apo){
  const N = Vestibular.dynNystagmus(canal, side, xiPeak);   // {excited, intensity, h, v, t}
  const camRx = Scene3D.CAMERAS.frontal.right[0];
  const horizontal = canal==="horizontal";
  const as = (apo && horizontal) ? -1 : 1;                  // apogeotropowy = poziom odwrócony (tylko kanał poziomy)
  const hAnat = (N.h||0)*as;
  const rev = !N.excited && Math.abs(xiPeak) > 0.03;        // hamowanie → oczopląs odwrócony
  const weak = N.intensity < 0.5;
  const base = horizontal ? (apo ? t("oczopląs poziomy (apogeotropowy)","horizontal nystagmus (apogeotropic)") : t("oczopląs poziomy","horizontal nystagmus"))
             : canal==="anterior" ? t("oczopląs ↓ (downbeat)","nystagmus ↓ (downbeat)") : t("oczopląs ↑ + skrętny","nystagmus ↑ + torsional");
  const label = base + (rev ? t(" — ODWRÓCONY"," — REVERSED") : "") + (weak ? t(" (słaby)"," (weak)") : "");
  return {
    kind: horizontal ? "horizontal" : "upbeatTorsional",
    dir:  horizontal ? Math.sign(hAnat*camRx) : Math.sign((N.t||0)*camRx),
    vdir: Math.sign(N.v||0) || 1,
    strength: N.intensity,                    // FIZYKA (nie annotacja)
    excited: N.excited, reversed: rev, apo: (apo && horizontal) || false,   // apo: kupulolitiaza (etykieta „apogeotropowy" na dialu)
    persistent: false, canal, side,
    anat: {h:hAnat, v:N.v, t:N.t},            // do dialu (widok z góry) — poziom już z odwróceniem apo
    label
  };
}

// pozycja prowokująca kanał (konwencje silnika) — wejście do dynamiki ξ(t)
// RÓWNOWAŻNOŚĆ ZMIERZONA (ocena II, KLIN-4): skok siad→pozycja Roll daje identyczne ξ i kierunek jak
// protokół dwuetapowy (najpierw płasko, potem skręt), bo etap leżenia płasko nie rusza złogu
// (φ zostaje w restPhi 199.8°) — karta Roll niczego nie traci na jednosegmentowym skoku.
function provokeQ(canal, side){        // POZA prowokująca = ta sama tabela POSE_SPEC co ekran testu (było: własne qSupineYaw,
  if(canal==="horizontal") return stepHeadQ("supineFlex", side==="P"? 90 : -90, "up");   // które ignorowało pochylenie z opisu — Roll liczony
  if(canal==="anterior")  return stepHeadQ("supineDeepHang", 0, "up");                   // przy 10° WYPROSTU zamiast opisanych 30° ZGIĘCIA)
  return stepHeadQ("supineHang", side==="P"? 45 : -45, "up");                            // tylny (Dix-Hallpike)
}
// przebieg ξ(t) z silnika: kanalolitiaza = PRZEJŚCIOWY (wygasa, cząstka wychodzi, NIE wraca);
// kupulolitiaza = uporczywy (trzyma się, dopóki pozycja utrzymana).
// OKNO OBSERWACJI (tHold) — to ONO, przez xiEnvelope→tEnd, ustala jak długo gra animacja oczopląsu.
//   Kupulolitiaza NIE wygasa, więc jej tEnd = całe okno; kanalolitiaza wygasa sama w ~30–40 s. Okno 18 s dla
//   postaci uporczywej dawało tEnd 18,5 s przeciw 29,8–39,8 s dla przejściowej, czyli oczopląs „uporczywy"
//   zatrzymywał się PIERWSZY — dokładne odwrócenie cechy różnicującej, której uczy ta sama karta
//   („Uporczywy > 60 s" vs „Przemijający < 60 s"). Okno 60 s = próg kliniczny 1 min z kryteriów Bárány.
function engineXi(canal, side, persistent, q, init){
  // pivot:"body" — badany jest KŁADZIONY z siadu (rusza całe ciało), a nie sam obraca głowę.
  // Okno PRZEDNIEGO 70 s (ocena II, A6/V8): napad AC trwa w silniku ~61 s (szczyt dopiero ~25 s) —
  // wspólne okno 40 s ucinało animację przy 36% szczytu, w pół napadu. Zmienia wyłącznie tEnd animacji
  // diagnostyki (manewrów nie zasila — tam manStepEnv).
  // ZNANA ASYMETRIA tego rozwidlenia (świadomie tolerowana; werdykt sondy 2026-08-14): tEnd kanalo-AC
  // 61,25 s > kupulo-AC 60,50 s (pełne okno) o 0,75 s — poniżej percepcji (tEnd steruje wyłącznie ruchem
  // tęczówek, bez napisu z sekundami; warianty na przeciwnych stronach flip-karty; peak kupulo-AC 0,142).
  // NIE „naprawiać" oknem kupulo 60→70 s: łamałoby kotwicę „60 s = próg 1 min Bárány" (wyżej), a chipy AC
  // celowo uczą, że czas trwania NIE różnicuje dla przedniego („Przemijający ≈1 min"). Sam napad ~61 s to
  // emergentna fizyka, zgodna z kliniką pDBN — werdykt i liczby: engine_doc „STAŁE SKALIBROWANE".
  const timeline=[{q: q||provokeQ(canal,side), tTrans:0.5, tHold: persistent?60:(canal==="anterior"?70:40), pivot:"body"}];
  // q0 = POZYCJA WYJŚCIOWA (siad): bez niej pierwszy segment interpolował „z samego siebie", czyli test
  // zaczynał się już W pozycji prowokującej — złóg nie dostawał przejścia, które go w ogóle rusza.
  const q0=[1,0,0,0];
  // init {phi0, settled} (ocena II, V5): warunki początkowe scenariusza historii pozycyjnej (Bow & Lean) —
  // obwiednia animacji liczy się z TEGO SAMEGO stanu, z którego karta wzięła kierunek. Kupulolitiaza bez
  // wpływu (brak cząstki). Brak init = dokładnie dotychczasowa ścieżka.
  return persistent
    ? Vestibular.simulateCupulolith({canal, side, timeline, q0})
    : Vestibular.simulateCanalith({canal, side, timeline, q0, ...(init ? {phi0:init.phi0, settled:init.settled} : {})});
}
// znormalizowana obwiednia czasowa z ξ(t): env(sekundy)∈[0,1] oraz tEnd (gdy |ξ|<3% szczytu po szczycie)
function xiEnvelope(sim){
  let peak=1e-6; for(const s of sim) peak=Math.max(peak, Math.abs(s.xi));
  const dt = sim.length>1 ? (sim[1].t - sim[0].t) : 0.05;
  const lastT = sim.length ? sim[sim.length-1].t : 0;
  let tEnd=lastT; for(let i=sim.length-1;i>=0;i--){ if(Math.abs(sim[i].xi)>=0.03*peak){ tEnd=sim[i].t; break; } }
  const env = ts => { if(ts<=0) return 0; const idx=Math.min(sim.length-1, Math.max(0, Math.round(ts/dt))); const s=sim[idx]; return s? Math.min(1, Math.abs(s.xi)/peak) : 0; };
  return {env, tEnd, peak};
}

/* ============ Manewry jako sekwencje orientacji 3D (timeline kwaternionów) ============
   Wejście do symulacji dynamiki: każdy krok manewru → orientacja głowy (head→świat) jako
   kwaternion, zgodnie z modelem "orientacja głowy = orientacja ciała ∘ skręt szyi".
   simulateCanalith używa WYŁĄCZNIE gHead (grawitacji w ramce głowy), więc krok definiujemy
   przez docelowy gHead, a kwaternion budujemy funkcją qFromG. Konwencja ramki głowy:
   x=prawe ucho, y=czaszka (+czubek), z=nos. Pozycje "nos w dół" mają składową +czaszka
   (czubek głowy opada → otolit przenoszony przez odnogę wspólną = krok kuracyjny).
   Walidacja offline (cząstka osiąga ujście ARC_SPAN, 267–319° per kanał; obie strony):
     Epley ✓ · Yacovino ✓ · Lempert ✓ · Semont ✓ · Bascule ✓ · Gufoni geotropowy ✓
     Gufoni apogeotropowy ✗ — POPRAWNIE: to manewr KONWERSJI (apo→geo), nie czyści wprost. */
/* ===== POZY WYPROWADZONE Z OPISU KLINICZNEGO (2026-08-05) =====
   Do tej daty poza kroku była RĘCZNIE WPISANYM wektorem grawitacji (BASE_G/LEAN_G), obok drugiej tabeli
   pochyleń (SUPINE_PITCH) i trzeciej — dla szkieletu 3D (TORSO_Q/NECK_DEG). Trzy tabele rozjeżdżały się
   ze sobą I z instrukcją pokazywaną klinicyście: 18 z 27 póz nie zgadzało się z własnym opisem, sześć
   o ponad 50°. Najgorsze przypadki:
     • test Roll — opis „na plecach, głowa zgięta ~30°", silnik liczył 10° WYPROSTU: 40° i ODWROTNY ZNAK;
     • Semont „nos ku podłodze" — rozjazd 70°, z dopisaną składową ku czubkowi głowy, której nie ma
       w żadnym opisie (patrz niżej: bez niej manewr w tym modelu nie czyścił, więc pozę nagięto do wyniku);
     • Bow & Lean — ta sama faza testu miała 153° w tabeli pozy (rysunek) i 90° w prowokacji (fizyka);
     • Yacovino — „broda do klatki (~45°)" liczone jako 65° w kroku 3 i 50° w kroku 4, mimo że opis
       obu kroków mówi o TYM SAMYM przygięciu karku.
   Teraz poza to TRZY KĄTY ANATOMICZNE, każdy wprost ze zdania instrukcji:
     roll  — obrót wokół osi długiej ciała: przewrót na bok/brzuch (±90/180) albo upadek boczny (Semont)
     trunk — kąt TUŁOWIA w płaszczyźnie strzałkowej: siad 0°, leżenie −90°, skłon w biodrach +45°
     pitch — kąt CAŁEJ GŁOWY = trunk + kark (wyprost <0 / zgięcie >0); to on daje grawitację
     dyaw  — skręt karku ZAWARTY w opisie pozy (dodawany do yaw kroku)
   headQ = Rz(roll)·Rx(pitch)·Ry(yaw+dyaw) — kolejność jak w dotychczasowym qSupineYaw = Rx(−100)·Ry(yaw):
   skręt karku jest WEWNĘTRZNY (wokół osi czaszki), pochylenie ZEWNĘTRZNE (kładzenie odbywa się
   w płaszczyźnie strzałkowej pokoju, całym ciałem). Grawitacja, szkielet i rysunek czerpią z TEJ JEDNEJ
   tabeli, więc rozjazd silnik↔widok↔instrukcja jest strukturalnie niemożliwy.
   [UZUP] = opis w aplikacji był jakościowy; liczbę dopisano z definicji manewru. UWAGA (ocena II, C9):
   wbrew wcześniejszemu zapisowi liczby NIE zostały jeszcze wniesione do opisów — faza Lean (~60°)
   i instrukcja kroku 3 Gufoniego geo (~45°) kąta nie podają; uzupełnienie tekstów = pakiet V8
   (wymaga rebaseline dom). */
const POSE_SPEC = {
  // ---- siad ----
  "sit|fwd":       {roll:0,   trunk:0,   pitch:0,    dyaw:0},   // „głowa prosto"
  "sitFront|fwd":  {roll:0,   trunk:0,   pitch:0,    dyaw:0},   // „siedzi na środku kozetki, twarzą do badającego"
  "sit|chin":      {roll:0,   trunk:0,   pitch:+45,  dyaw:0},   // Yacovino krok 4: „utrzymując brodę przy klatce" = te same 45° co krok 3
  "sit|down":      {roll:0,   trunk:+45, pitch:+90,  dyaw:0},   // Bow: „skłon tułowia w przód ~45°, nos ku podłodze" = 45° biodra + 45° kark
  "sit|up":        {roll:0,   trunk:0,   pitch:-60,  dyaw:0},   // Lean: odchylenie do tyłu [UZUP 60°]
  // ---- leżenie na plecach: pitch = −90 − zwis (lub −90 + zgięcie) ----
  "supineFlat|up": {roll:0,   trunk:-90, pitch:-90,  dyaw:0},   // Lempert: „leży na plecach" — płasko, bez zwisu
  "supineHang|up": {roll:0,   trunk:-90, pitch:-110, dyaw:0},   // Dix–Hallpike / Epley: „~20° poniżej poziomu"
  "supineFlex|up": {roll:0,   trunk:-90, pitch:-60,  dyaw:0},   // Roll test: „głowa zgięta ~30°"
  "supineDeepHang|up":{roll:0,trunk:-90, pitch:-120, dyaw:0},   // deep head-hang: „~30° poniżej poziomu"
  "supineChin|up": {roll:0,   trunk:-90, pitch:-45,  dyaw:0},   // Yacovino krok 3: „broda do klatki (~45°)", pacjent nadal leży
  // ---- przewrót na bok/brzuch z leżenia (Epley krok 4, Lempert) ----
  "sideL|fwd":     {roll:+90, trunk:-90, pitch:-90,  dyaw:0},   // „obróć o 90°" — głowa w linii ciała
  "sideR|fwd":     {roll:-90, trunk:-90, pitch:-90,  dyaw:0},
  "sideL|down":    {roll:+90, trunk:-90, pitch:-110, dyaw:0},   // Epley krok 4: obraca się CIAŁO; kark bez zmiany, „nos ku podłodze" wychodzi z przewrotu
  "sideR|down":    {roll:-90, trunk:-90, pitch:-110, dyaw:0},
  "sideL|up":      {roll:+90, trunk:-90, pitch:-90,  dyaw:0},
  "sideR|up":      {roll:-90, trunk:-90, pitch:-90,  dyaw:0},
  "prone|down":    {roll:180, trunk:-90, pitch:-110, dyaw:0},   // Lempert: „na brzuchu, nos ku podłodze"
  // ---- upadek boczny Z SIADU (Semont/Bascule/Gufoni): tułów NIE kładzie się na plecy ----
  // Skręt karku 45° (Semont/Bascule) przychodzi z pola yaw kroku — opis mówi „bez zmiany ustawienia głowy",
  // więc obie pozycje rzutu mają IDENTYCZNY kark i różnią się wyłącznie bokiem, na którym leży pacjent.
  "leanL|fwd":     {roll:-90, trunk:0,   pitch:0,    dyaw:0},   // leanL = prawy bok w dół
  "leanR|fwd":     {roll:+90, trunk:0,   pitch:0,    dyaw:0},
  "leanL|up":      {roll:-90, trunk:0,   pitch:0,    dyaw:0},
  "leanR|up":      {roll:+90, trunk:0,   pitch:0,    dyaw:0},
  "leanL|down":    {roll:-90, trunk:0,   pitch:0,    dyaw:0},
  "leanR|down":    {roll:+90, trunk:0,   pitch:0,    dyaw:0},
  "leanL|ceil":    {roll:-90, trunk:0,   pitch:0,    dyaw:-90},  // Gufoni apo krok 3: „obróć głowę o ~90°, nos prosto ku górze"
  "leanR|ceil":    {roll:+90, trunk:0,   pitch:0,    dyaw:+90},
  "leanL|floor":   {roll:-90, trunk:0,   pitch:0,    dyaw:+45},  // Gufoni geo krok 3: „nos ku podłodze" [UZUP 45° — Gufoni/Appiani]
  "leanR|floor":   {roll:+90, trunk:0,   pitch:0,    dyaw:-45},
};
// NEUTRALNA POZA CIAŁA — jedno pojęcie „domyślnej postawy tego ciała", z którego korzystają
// zarówno łańcuch zapasowy poseOf, jak i orientacja tułowia (TORSO_Q) i zawias biodrowy (bodyJoints).
// Wariant „fwd" wygrywa, jeśli istnieje; ciała, które go nie mają (wszystkie supine*, prone),
// biorą własny jedyny wariant.
const BODY_NEUTRAL=(()=>{ const out={};
  for(const key of Object.keys(POSE_SPEC)){ const [body,face]=key.split("|");
    if(!out[body] || face==="fwd") out[body]=POSE_SPEC[key]; }
  return out; })();
// [2026-08-06] Łańcuch zapasowy kończył się na POSE_SPEC["sit|fwd"] — pozie INNEGO ciała.
// Brakująca twarz dla ciała leżącego dawała więc pozę SIEDZĄCĄ (tułów 0°), a nie „to samo ciało,
// głowa w neutrum". Teraz zapas jest wewnątrz ciała; do sit|fwd schodzimy tylko dla ciała spoza tabeli.
const poseOf=(body,face)=>POSE_SPEC[body+"|"+face] || BODY_NEUTRAL[body] || POSE_SPEC["sit|fwd"];
const headQOf=(roll,pitch,yaw)=>Vestibular.qmul(Vestibular.qmul(
  Vestibular.qaxis([0,0,1],roll), Vestibular.qaxis([1,0,0],pitch)), Vestibular.qaxis([0,1,0],yaw));
function stepHeadQ(body, yaw, face){                  // orientacja głowy (head→świat) dla kroku
  const s=poseOf(body,face); return headQOf(s.roll, s.pitch, yaw + s.dyaw);
}
// Grawitacja jest teraz WYPROWADZANA z pozy (było odwrotnie: poza odtwarzana z wpisanej grawitacji przez
// qFromG, co gubiło roll anatomiczny i pozwalało obu opisom żyć własnym życiem).
function stepGravity(body, yaw, face){ return Vestibular.gHead(stepHeadQ(body, yaw, face)); }
// ===== MODEL 3D — Krok 1: orientacja głowy do RYSOWANIA =====
// Dawniej osobna ścieżka (BODY_Q + headPitchQ wyprowadzane wstecz z BASE_G), pilnowana inwariantem
// „gHead(composeHead) == stepGravity" (audyt #1) — czyli dwie konstrukcje, które trzeba było ZGADZAĆ.
// Po wyprowadzeniu pozy z opisu headQOf daje od razu POPRAWNY roll anatomiczny, więc rysunek i fizyka
// biorą DOKŁADNIE tę samą orientację: inwariant nie jest już pilnowany, tylko TOŻSAMOŚCIOWY.
const composeHead = stepHeadQ;
// ===== MODEL 3D — Krok 2: szkielet (offsety stawów w układzie ciała) + kinematyka prosta (FK) =====
// Układ ciała: x=prawo, y=góra(czaszka), z=przód(brzuch/nos). Długości spójne z figSide.
// Drzewo stawów [nazwa, rodzic, offset-w-ramce-rodzica] dla NEUTRALNEJ postawy (stojąca/wyprostowana).
const SK={torso:42,neck:15,head:15,thigh:33,shin:29,foot:11,uarm:25,farm:23,shHalf:13,hipHalf:9};
const SKEL=[
  ["pelvis",null,[0,0,0]],
  ["spine","pelvis",[0,SK.torso,0]], ["neckBase","spine",[0,0,0]], ["neck","neckBase",[0,SK.neck,0]], ["head","neck",[0,SK.head,0]],
  ["shL","spine",[-SK.shHalf,0,0]], ["shR","spine",[SK.shHalf,0,0]],
  ["elbL","shL",[0,-SK.uarm,0]], ["elbR","shR",[0,-SK.uarm,0]],
  ["handL","elbL",[0,-SK.farm,0]], ["handR","elbR",[0,-SK.farm,0]],
  ["hipL","pelvis",[-SK.hipHalf,0,0]], ["hipR","pelvis",[SK.hipHalf,0,0]],
  ["kneeL","hipL",[0,-SK.thigh,0]], ["kneeR","hipR",[0,-SK.thigh,0]],
  ["ankL","kneeL",[0,-SK.shin,0]], ["ankR","kneeR",[0,-SK.shin,0]],
  ["toeL","ankL",[0,0,SK.foot]], ["toeR","ankR",[0,0,SK.foot]]
];
// kinematyka prosta: rot = {nazwaStawu: lokalny kwaternion}; offset stawu obracany rotacją RODZICA,
// rotacja stawu wpływa na potomków (worldRot[n]=worldRot[rodzic] ∘ lokalny[n]). Zwraca pozycje 3D w ramce ciała.
function fkJoints(rot){
  const pos={}, wr={};
  for(const seg of SKEL){ const n=seg[0], p=seg[1], o=seg[2];
    const pr=p?wr[p]:[1,0,0,0], pp=p?pos[p]:[0,0,0], lr=(rot&&rot[n])||[1,0,0,0];
    wr[n]=Vestibular.qmul(pr,lr);
    const ro=Vestibular.rotate(pr,o);
    pos[n]=[pp[0]+ro[0], pp[1]+ro[1], pp[2]+ro[2]];
  }
  return pos;
}
// artykulacja per klasa ciała (kąty stawów). Pozostałe wyprostowane — orientację w przestrzeni daje TORSO_Q.
const POSE3D={
  sit:{ hipL:Vestibular.qaxis([1,0,0],-90), hipR:Vestibular.qaxis([1,0,0],-90),
        kneeL:Vestibular.qaxis([1,0,0],90), kneeR:Vestibular.qaxis([1,0,0],90) }, // siad na krawędzi: uda w przód, podudzia w dół
  sitFront:{}, supine:{}, side:{}, prone:{}, lean:{}   // sitFront: nogi w dół (widok z przodu)
};
// orientacja TUŁOWIA (torso→świat) per ciało — WYPROWADZONA z POSE_SPEC: Rz(roll)·Rx(trunk).
// Dawniej wpisana ręcznie obok BASE_G, przez co szkielet mógł opisywać inną pozę niż fizyka (i opisywał:
// supineFlat miał tułów −90° przy grawitacji liczonej dla −100°, a kark „prostował" tę różnicę).
const TORSO_Q=(()=>{ const out={};
  for(const body of Object.keys(BODY_NEUTRAL)){ const s=BODY_NEUTRAL[body];
    out[body]=Vestibular.qmul(Vestibular.qaxis([0,0,1],s.roll), Vestibular.qaxis([1,0,0],s.trunk)); }
  return out; })();
function bodyClass(b){ return b.startsWith("supine")?"supine":(b==="sideL"||b==="sideR")?"side":(b==="leanL"||b==="leanR")?"lean":b; }
function bodyJoints(body,face){                       // pozycje 3D stawów po orientacji w przestrzeni (pre-kamera)
  const pose=Object.assign({}, POSE3D[bodyClass(body)]||{});
  const s=poseOf(body,face);
  const nd=s.pitch - s.trunk;                          // KARK = kąt głowy − kąt tułowia (<0 wyprost, >0 zgięcie do mostka) — wprost z tabeli pozy
  if(nd) pose.neckBase=Vestibular.qaxis([1,0,0], nd);
  const F=s.trunk - (BODY_NEUTRAL[body]||s).trunk;     // ZAWIAS BIODROWY: o ile tułów tej pozy odchyla się od neutralnej TEGO ciała (Bow & Lean: +45°)
  if(F){                                               // sam kark nie oddaje skłonu — pada CAŁY tułów nad uda (patrz rycina Bow & Lean)
    pose.pelvis=Vestibular.qaxis([1,0,0], F);           // tułów w przód (zawias w biodrach)
    pose.hipL=Vestibular.qaxis([1,0,0], -90-F); pose.hipR=Vestibular.qaxis([1,0,0], -90-F);   // uda niezmienione — kontr-obrót znosi obrót miednicy (nogi zostają)
    pose.shL=Vestibular.qaxis([1,0,0], -F); pose.shR=Vestibular.qaxis([1,0,0], -F);            // ramiona zwisają pionowo (kontr-obrót barków)
  }
  // [2026-08-06] Kontr-obrót barków ma sens TYLKO przy zawiasie z postawy pionowej (skłon Bow).
  // Dopóki neutralę brano z sit|fwd, każde ciało leżące dostawało F=−90° i ten sam kontr-obrót:
  // ręce sterczały 48 j. pionowo w dół, POD blat. Renderer kotwiczy sylwetkę najniższym punktem
  // (dy=−minY), więc na dłoniach stawiał całego pacjenta — tułów wisiał w powietrzu nad kozetką.
  // Teraz neutralą ciała leżącego jest ono samo → F=0, brak kontr-obrotu, ręce leżą wzdłuż tułowia.
  // (leanL/leanR: dawny hack unoszący górną rękę był potrzebny TYLKO dla kamery odgórnej, gdzie kończyny
  //  obu boków rzutowały się na siebie. Widok frontalny rozdziela barki po ekranowym Y → ręce proste.)
  const local=fkJoints(pose), TQ=TORSO_Q[body]||[1,0,0,0], out={};
  for(const k in local) out[k]=Vestibular.rotate(TQ, local[k]);
  return out;
}
/* ============ PoseSpec — kanoniczny opis pozy kroku (Etap 2) ============
   JEDNO źródło pozy dla wszystkich rendererów (SVG dziś, Three.js od Etapu 3):
   renderer NIE wyprowadza pozy sam (audyt 2.5D — rozjazd silnik↔widok), tylko
   czyta gotowe pola. Fizyka złogu (maneuverTimeline) używa stepQ; rysowanie
   głowy używa headQ (FK: tułów+szyja+yaw). Inwariant (audyt #1):
   gHead(headQ) == gravity == gHead(stepQ) dla każdego kroku/fazy. */
function poseSpec(st){                                // st: {body,yaw,face} — krok manewru lub faza testu
  return {
    body: st.body, yaw: st.yaw, face: st.face,        // surowa trójka (etykiety, warianty kozetki, kamery)
    headQ: composeHead(st.body, st.yaw, st.face),     // orientacja głowy head→świat (rysowanie, przyszły rig 3D)
    stepQ: stepHeadQ(st.body, st.yaw, st.face),       // orientacja kanoniczna kroku (fizyka złogu)
    gravity: stepGravity(st.body, st.yaw, st.face),   // gHead — grawitacja w układzie głowy
    joints: bodyJoints(st.body, st.face),             // stawy szkieletu 3D (pre-kamera)
  };
}
// Strzałka „do ziemi": rzut grawitacji kroku na ekran widoku frontalnego (right=-x, up=y → SVG y w dół)
function gravArrowFor(spec){
  const g = spec.gravity;
  const dx = -g[0], dy = -g[1], mag = Math.hypot(dx, dy);
  if(mag <= 0.15) return "";                          // grawitacja niemal wzdłuż osi nos-potylica → brak kierunku w płaszczyźnie
  const ang = (Math.atan2(dy, dx)*180/Math.PI).toFixed(1);
  return `<div class="gravmark" title="kierunek do ziemi"><svg viewBox="0 0 24 24" fill="none"><g transform="rotate(${ang} 12 12)"><line x1="4" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M13 7l5 5-5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g></svg>ziemia</div>`;
}
const sizeRadius=s=>Vestibular.sizeR(s);   // była tu WKLEJONA kopia SIZE_R (dwa razy w jednym wyrażeniu) — jedno źródło
// Klinicznie zalecany hold kroku wg rozmiaru: małe (wolno osiadające) złogi wymagają DŁUŻSZEGO utrzymania
// pozycji (uzasadnienie ~30 s holdów w CRP: Hain, Squires & Stone 2005). medium/big = bez zmian (bezpieczne).
const holdMult=s=> s==="small"?1.6:1;
function sizedSeconds(sec, size){ if(sec==null) return null; const v=sec*holdMult(size); return Math.max(15, Math.min(120, Math.round(v/15)*15)); }
/* oś czasu manewru: [{q,tTrans,tHold}] — wejście do simulateCanalith/Cupulolith
   HOLD WYPROWADZONY Z SILNIKA [2026-08-05, R4b]. Do tej daty hold dynamiki był OBCIĘTY do zaszytego
   `cap` (12 s, dla small 12/r²), niezależnie od tego, ile kroku realnie potrzeba. Obcięcie było głębokie
   i NIERÓWNE (semont 20% zaleconego holdu, gufoniGeo 30%, lempert 44%, epley 53%, yacovino 77%), więc
   „czy manewr czyści" częściowo mierzyło agresywność obcięcia, a nie geometrię kanału. Po wprowadzeniu
   ZMIERZONEGO zakresu łuku (ARC_SPAN w silniku, R1) łuk kanału tylnego urósł 178°→307° i przy 12 s Epley
   dochodził do φ 305,5 z 307 — nie wychodził o włos. Teraz hold jest LICZONY: najmniejsza wartość
   z HOLD_STEPS, przy której silnik wyprowadza złóg do łagiewki.
     • krok Z TIMEREM  → hold wyprowadzony (podłoga 30 s = minimum kliniczne CRP, Hain [2]; krok 15 s)
     • krok BEZ TIMERA → hold TAKŻE WYPROWADZANY (ocena II, B5/V9). Dawne sztywne 6 s („5× zapasu")
       było FAŁSZYWE dla Semonta: jego końcowy bez-timerowy siad musi pomieścić 38,4° wędrówki złogu
       + parking + ekspulsję (5,35 s + 1,2 s = 6,55 z 6,8 s dostępnych) — margines 0,25 s przy medium,
       a wzrost tauP o ~8% wywalał czyszczenie PO CICHU, bo derivedHold przeszukiwał wyłącznie kroki
       z timerem. Teraz derivedHold szuka pary (h, u): h z HOLD_STEPS (kroki z timerem, minimalne
       PRZED u — bo h podnosi timer karty przez genPlan/A7), u z UNTIMED_STEPS (kroki bez timera,
       w timerze NIEwidoczne — tylko oś czasu fizyki/animacji), z WBUDOWANYM strażnikiem: para musi
       czyścić nominalnie ORAZ przy tauP×TAUP_GUARD (wolniejsza cząstka). Niezależnie pilnuje tego
       WYROCZNIA WRAŻLIWOŚCI (tools/snapshot.mjs): manewry czyszczące muszą czyścić przy tauP±10%.
     • manewr, który NIE czyści przy ŻADNYM kandydacie → hold ZALECONY KLINICZNIE (st.seconds). Dotyczy
       dziś WYŁĄCZNIE Gufoniego apo (manewr KONWERSJI — z założenia nie czyści); Bascule i Yacovino
       CZYSZCZĄ (przemierzone 2026-08-13; R1/R6 zamknięte). */
const HOLD_STEPS=[30,45,60,75,90,105,120], UNTIMED_STEPS=[6,9,12,15,18], TAUP_GUARD=1.1;
const holdKey=(plan,size)=>[plan.canal,plan.side,size,plan.steps.map(s=>`${s.body}|${s.yaw}|${s.face}|${s.seconds}`).join(";")].join("#");
const _holdMemo=new Map();                                   // szukanie holdu = do 7 symulacji; pamiętamy per (kanał,strona,rozmiar,pozy)
// STRAŻNIK (ocena II, KLIN-7): klucz memo musi rosnąć razem z sygnaturą wywołania simulateCanalith
// w derivedHold — dziś pokrywa całość (canal, side, size, pozy+sekundy), a rep/tauP/gc nie wchodzą do
// toru manewru. Pierwsze przelotowanie parametrów silnika (np. tryb laboratoryjny) bez rozszerzenia
// klucza zacznie po cichu serwować przestarzałe holdy (Map nie jest nigdy unieważniana).
// OŚ OBROTU KROKU — wyprowadzona z tej samej tabeli pozy: jeśli zmienił się roll albo kąt TUŁOWIA,
// to przemieszcza się całe ciało (oś w biodrach/na kozetce); jeśli zmienia się tylko kark lub skręt —
// obraca się sama głowa (oś u podstawy szyi). Silnik zamienia to na ramię ω²·L (siła właściwa, R7).
function stepPivot(prev, st){
  if(!prev) return "body";                                   // wejście w pozycję wyjściową: pacjent siada/kładzie się
  const a=poseOf(prev.body, prev.face), b=poseOf(st.body, st.face);
  return (a.roll!==b.roll || a.trunk!==b.trunk) ? "body" : "neck";
}
function timelineWithHold(plan, h, u=UNTIMED_STEPS[0]){
  return plan.steps.map((st,i)=>({ q: stepHeadQ(st.body, st.yaw, st.face), tTrans:0.8,
    pivot: stepPivot(plan.steps[i-1], st),
    tHold: st.seconds!=null ? h : u }));
}
// najmniejsza para {h, u}: h z HOLD_STEPS (kroki z timerem), u z UNTIMED_STEPS (kroki bez timera),
// przy której manewr wyprowadza złóg NOMINALNIE ORAZ przy tauP×TAUP_GUARD (wolniejsza cząstka =
// jedyne realne ryzyko kalibracyjne; ocena II B5/V9 — margines Semonta wynosił 0,25 s i +8% tauP
// zabijało czyszczenie po cichu, bo sztywne 6 s kroku bez timera nie mieściło wędrówki+ekspulsji).
// Wymóg ±10% jest tu WBUDOWANY, a wyrocznia wrażliwości (snapshot.mjs) pilnuje go niezależnie.
// h minimalne PRZED u (h podnosi timer karty przez genPlan/A7; u jest w timerze niewidoczne).
// Gdy żadna para nie przechodzi strażnika, wraca pierwsza czyszcząca nominalnie; null gdy żadna
// (Gufoni apo — konwersja).
function derivedHold(plan, size){
  const k=holdKey(plan,size); if(_holdMemo.has(k)) return _holdMemo.get(k);
  const cleans=(h,u,tp)=>{ const sim=Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, size,
      timeline:timelineWithHold(plan,h,u), ...(tp?{tauP:tp}:{})});
    return sim.length && sim[sim.length-1].exited; };
  let out=null, firstExit=null;
  outer:
  for(const h of HOLD_STEPS){
    for(const u of UNTIMED_STEPS){
      if(!cleans(h,u)) continue;
      if(!firstExit) firstExit={h,u};
      if(cleans(h,u,6.5*TAUP_GUARD)){ out={h,u}; break outer; }   // 6.5 = domyślne tauP silnika
    }
  }
  if(!out) out=firstExit;                                  // czyści nominalnie, bez strażnika — lepsze niż null
  _holdMemo.set(k,out); return out;
}
function maneuverTimeline(plan, size="medium"){
  const dh=derivedHold(plan,size);
  return plan.steps.map((st,i)=>({
    q: stepHeadQ(st.body, st.yaw, st.face),
    tTrans: 0.8,
    pivot: stepPivot(plan.steps[i-1], st),                                // oś obrotu → ramię bezwładności (R7)
    tHold: st.seconds==null ? (dh ? dh.u : UNTIMED_STEPS[0])
                            : (dh ? dh.h : st.seconds)                    // fallback: hold zalecony klinicznie
  }));
}
// pełna symulacja manewru → φ(t) cząstki w kanale (dynamika repozycji)
function maneuverSim(plan, size="medium"){
  return Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, timeline:maneuverTimeline(plan,size), size});
}
// v: "canalo" (kanalolitiaza / geotropowy) | "cupulo" (kupulolitiaza / apogeotropowy)
// CHIPY PER KANAŁ (ocena II, A6/V8): kanał PRZEDNI ma w silniku WYPROWADZONY brak latencji (R7: złóg
// startuje dociśnięty do osklepka, 0.5 s = sam czas przejścia) i napad ~61 s — wspólne chipy
// „Latencja 1–5 s"/„<60 s" przeczyły własnej fizyce (i klinice AC-BPPV: latencja krótka/nieobecna).
const featsByVariant = (v, canal) => v==="canalo"
  ? (canal==="anterior"
      ? [t("Latencja krótka/nieobecna","Short/absent latency"),t("Przemijający (≈1 min)","Transient (≈1 min)"),t("Wyczerpuje się","Fatigues")]
      : [t("Latencja 1–5 s","Latency 1–5 s"),t("Przemijający (<60 s)","Transient (<60 s)"),t("Wyczerpuje się","Fatigues")])
  : [t("Bez latencji","No latency"),t("Uporczywy (>60 s)","Persistent (>60 s)"),t("Nie wyczerpuje się","Does not fatigue")];

/* ============ Bow & Lean: scenariusze historii pozycyjnej (ocena II, V5 — rozdział E) ============
   WODODZIAŁ (R8/R10): w kanalolitiazie HC obecność, kierunek i amplituda odpowiedzi BLT zależą od
   położenia złogu NA STARCIE, a to ustala historia pozycyjna pacjenta — nie anatomia. Domyślny
   spoczynek modelu (restPhi 199.8°) leży 9.9° ZA wododziałem skłonu (189.9°), a napęd skłonu (0.026)
   nie zrywa adhezji (fStat 0.04) — stąd bez znanej historii model UCZCIWIE nie rozstrzyga kierunku.
   Preset = historia jako TIMELINE PÓZ; φ₀ jest WYPROWADZANE tą samą symulacją, która liczy test
   (wzorzec derivedHold: liczba jest wynikiem, nie stałą — nie zestarzeje się przy rekalibracji
   geometrii). settled:false = złóg świeżo przemieszczony (V3, bez bramki adhezji). STRZAŁKA I NAPIS
   pochodzą z JEDNEGO ξ (bltDirWord) — sprzeczność strzałka↔napis jest strukturalnie niemożliwa.
   Kupulolitiaza: scenariusz BEZ wpływu (brak cząstki w świetle) — silnik emergentnie odtwarza
   „BLT powtarzalny w trwałej cupulopatii" (poprawiona H5); kierunki kupulo liczy fizyka od V4. */
const BLT_HISTORY = {
  textbook:  { get label(){return t("Po nocy na boku chorym","After a night on the affected side");}, settled:false,
               steps: A => [{body:A==="P"?"sideR":"sideL", yaw:0, face:"fwd", hold:300}, {body:"sit", yaw:0, face:"fwd", hold:30}] },
  afterDix:  { get label(){return t("Po teście Dix–Hallpike'a","After a Dix–Hallpike test");}, settled:false,
               steps: A => [{body:"supineHang", yaw:A==="P"?45:-45, face:"up", hold:40}, {body:"sit", yaw:0, face:"fwd", hold:30}] },
  afterRoll: { get label(){return t("Po teście Roll (oba boki)","After a Roll test (both sides)");}, settled:false,
               steps: A => [{body:"supineFlex", yaw:A==="P"?90:-90, face:"up", hold:20}, {body:"supineFlex", yaw:A==="P"?-90:90, face:"up", hold:20}, {body:"sit", yaw:0, face:"fwd", hold:30}] },
  neutral:   { get label(){return t("Długi siad — start nieoznaczony","Prolonged sitting — start indeterminate");}, settled:true, steps:null },
};
const _bltMemo=new Map();                        // sondowanie scenariusza = 1-2 symulacje; pamiętamy per (strona, scenariusz)
// φ₀ presetu = WYNIK symulacji historii przez silnik (nie wpisana stała).
function bltInit(side, scen){
  const sc=BLT_HISTORY[scen]||BLT_HISTORY.neutral;
  if(!sc.steps) return {phi0:null, settled:true, exitedInHistory:false};
  const k="init#"+side+"#"+scen; if(_bltMemo.has(k)) return _bltMemo.get(k);
  const timeline=sc.steps(side).map(st=>({q:stepHeadQ(st.body, st.yaw, st.face), tTrans:0.8, tHold:st.hold, pivot:"body"}));
  const sim=Vestibular.simulateCanalith({canal:"horizontal", side, q0:[1,0,0,0], timeline});
  const out={phi0: sim.final.exited?null:sim.final.phi, settled:sc.settled, exitedInHistory:sim.final.exited};
  _bltMemo.set(k,out); return out;
}
// TEST jako JEDNA oś czasu (skłon→siad→odchylenie) — tak test jest wykonywany, a wykonany skłon
// masywnie przemieszcza złóg (w sekwencji odpowiedź lean bywa 2× silniejsza niż w izolacji).
function bltPhases(side, scen){
  const k="ph#"+side+"#"+scen; if(_bltMemo.has(k)) return _bltMemo.get(k);
  const init=bltInit(side, scen);
  const out={init, bow:{xi:0, exited:false}, lean:{xi:0}, exited:init.exitedInHistory};
  if(!init.exitedInHistory){
    const qSit=[1,0,0,0], qBow=stepHeadQ("sit",0,"down"), qLean=stepHeadQ("sit",0,"up");
    const segs=[{q:qBow,tTrans:0.8,tHold:30,pivot:"neck"},{q:qSit,tTrans:0.8,tHold:5,pivot:"neck"},{q:qLean,tTrans:0.8,tHold:30,pivot:"neck"}];
    const sim=Vestibular.simulateCanalith({canal:"horizontal", side, q0:qSit, phi0:init.phi0, settled:init.settled, timeline:segs});
    const t1=30.8, t2=36.6;                      // granice faz (tTrans+tHold narastająco)
    for(const s of sim){
      if(s.t<=t1){ if(Math.abs(s.xi)>Math.abs(out.bow.xi)) out.bow.xi=s.xi; if(s.exited) out.bow.exited=true; }
      else if(s.t>t2 && !out.bow.exited){ if(Math.abs(s.xi)>Math.abs(out.lean.xi)) out.lean.xi=s.xi; }
    }
    out.exited=sim.final.exited;
  }
  _bltMemo.set(k,out); return out;
}
// napis kierunku GENEROWANY z tego samego ξ/znaku co strzałka (jedno źródło prawdy).
const bltDirWord=(A,positive)=> positive
  ? t(`bije ku stronie chorej (${sideN(A)})`,`beats toward the affected side (${sideN(A)})`)
  : t(`bije ku stronie zdrowej (${sideN(otherSide(A))})`,`beats toward the healthy side (${sideN(otherSide(A))})`);
// MAPA WODODZIAŁU (rycina dydaktyczna): przemiatanie φ₀ co 5° z adhezją świeżego depozytu —
// per punkt znak/siła odpowiedzi skłonu i odchylenia (fazy IZOLOWANE: mapa opisuje położenie startowe).
function bltZones(side){
  const k="zones#"+side; if(_bltMemo.has(k)) return _bltMemo.get(k);
  const qSit=[1,0,0,0], qBow=stepHeadQ("sit",0,"down"), qLean=stepHeadQ("sit",0,"up");
  const peak=(phi0,q)=>{ const sim=Vestibular.simulateCanalith({canal:"horizontal", side, q0:qSit, phi0, settled:false,
      timeline:[{q, tTrans:0.8, tHold:30, pivot:"neck"}]});
    let p=0; for(const s of sim) if(Math.abs(s.xi)>Math.abs(p)) p=s.xi; return p; };
  const pts=[];
  for(let phi0=5; phi0<=265; phi0+=5){
    const b=peak(phi0,qBow), l=peak(phi0,qLean);
    const ib=Vestibular.dynNystagmus("horizontal", side, b).intensity, il=Vestibular.dynNystagmus("horizontal", side, l).intensity;
    const zone = (b>0 && l<0) ? "choung" : (b<0 && l>0) ? "reversed" : "mixed";
    pts.push({phi0, bow:+b.toFixed(3), lean:+l.toFixed(3), zone, sub: Math.max(ib,il)<XI_CARD});
  }
  _bltMemo.set(k,pts); return pts;
}
const DIAG={
  dix:{ get name(){return t("Manewr Dix–Hallpike","Dix–Hallpike test");}, get tests(){return t("kanał tylny","posterior canal");}, canal:"posterior",
    get intro(){return t("Z siadu obróć głowę 45° w stronę badaną, połóż szybko na plecach z głową odchyloną ~20° poniżej poziomu.","From sitting, turn the head 45° toward the tested side, then lay the patient supine quickly with the head extended ~20° below horizontal.");},
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? t(`Postać klasyczna (kanalolitiaza): złóg swobodny w kanale tylnym po stronie ${sideN(A)}.`,`Classic form (canalithiasis): free-floating debris in the posterior canal on the ${sideN(A)} side.`)
      : t(`Postać rzadka (kupulolitiaza): złóg na osklepku kanału tylnego — oczopląs uporczywy.`,`Rare form (cupulolithiasis): debris on the cupula of the posterior canal — persistent nystagmus.`),
    phases:(A,v)=>[{
      ptitle:t("Strona chora w dole","Affected side down"), ppos:t("Na plecach, głowa 45° ku stronie chorej, ~20° poniżej poziomu","Supine, head 45° toward the affected side, ~20° below horizontal"),
      body:"supineHang", yaw:yawToA(A), face:"up",
      nys: nysFromGeom("posterior", A, v, stepHeadQ("supineHang", A==="P"?45:-45, "up")),
      label:t(`ku górze + skrętny ku uchu choremu (${sideN(A)})`,`upbeat + torsional toward the affected ear (${sideN(A)})`),
      note: v==="canalo"
        ? t("po latencji, narasta i wygasa; wyczerpuje się przy powtórzeniu.","after a latency, crescendos and fades; fatigues on repetition.")
        : t("bez latencji, uporczywy, nie wyczerpuje się przy powtórzeniu.","no latency, persistent, does not fatigue on repetition.")
    }]
  },
  roll:{ get name(){return t("Test pozycyjny (Roll / Pagnini–McClure)","Positional test (Roll / Pagnini–McClure)");}, get tests(){return t("kanał poziomy","horizontal canal");}, canal:"horizontal",
    get intro(){return t("Pacjent na plecach, głowa zgięta ~30°. Obróć głowę szybko w jedną, potem w drugą stronę.","Patient supine, head flexed ~30°. Turn the head quickly to one side, then to the other.");},
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? t(`Geotropowy: strona chora = SILNIEJSZA reakcja → ${sideN(A)}.`,`Geotropic: affected side = STRONGER response → ${sideN(A)}.`)
      : t(`Apogeotropowy: strona chora = SŁABSZA reakcja przy uchu w dole → ${sideN(A)}.`,`Apogeotropic: affected side = WEAKER response with that ear down → ${sideN(A)}.`),
    phases:(A,v)=>{ const H=otherSide(A), geo=(v==="canalo");
      const mk=down=>{ const up=otherSide(down);
        const strong = geo ? (down===A) : (down===H);
        return {ptitle:t(`Ucho ${down==="L"?"lewe":"prawe"} w dole`,`${down==="L"?"Left":"Right"} ear down`), ppos:t(`Głowa obrócona 90° ku stronie ${sideN(down)}`,`Head turned 90° toward the ${sideN(down)} side`),
          body:"supineFlex", yaw: down==="P"?90:-90, face:"up",
          nys: nysFromGeom("horizontal", A, v, stepHeadQ("supineFlex", down==="P"?90:-90, "up"), "asym"),
          label: geo ? t(`geotropowy — ku uchu w dole (${sideN(down)})`,`geotropic — toward the lower ear (${sideN(down)})`) : t(`apogeotropowy — ku uchu w górze (${sideN(up)})`,`apogeotropic — toward the upper ear (${sideN(up)})`),
          note: strong ? t("Reakcja silniejsza w tej pozycji.","Stronger response in this position.") : t("Reakcja słabsza w tej pozycji.","Weaker response in this position.")};
      };
      return [mk(A), mk(H)];
    }
  },
  bowlean:{ get name(){return t("Test Bow & Lean (skłon i odchylenie)","Bow & Lean test (bow and lean)");}, get tests(){return t("kanał poziomy — lateralizacja","horizontal canal — lateralization");}, canal:"horizontal",
    get intro(){return t("W siadzie wykonaj skłon głowy w przód (bow), następnie odchylenie do tyłu (lean).","While sitting, bend the head forward (bow), then tilt it back (lean).");},
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? t("Kierunek i obecność odpowiedzi zależą od położenia złogu na starcie, a to ustala HISTORIA POZYCYJNA — wybierz scenariusz nad fazami. Reguła Choung (skłon→chora, odchylenie→zdrowa) WYNIKA z fizyki, gdy złóg leży przed wododziałem skłonu (φ₀<190°).","The direction and presence of the response depend on where the debris starts, which is set by the POSITIONAL HISTORY — pick a scenario above the phases. The Choung rule (bow→affected, lean→healthy) FOLLOWS from physics whenever the debris lies before the bow watershed (φ₀<190°).")
      : t("Apogeotropowy (kupulolitiaza): skłon bije ku stronie zdrowej, odchylenie ku chorej. Wynik NIE zależy od historii pozycyjnej (brak wolnej cząstki) — test powtarzalny w trwałej kupulopatii.","Apogeotropic (cupulolithiasis): the bow beats toward the healthy side, the lean toward the affected one. The result does NOT depend on positional history (no free particle) — the test is repeatable in persistent cupulopathy."),
    phases:(A,v,scen)=>{ const S=scen||"textbook";
      const mkPose=(key)=> key==="bow"
        ? {ptitle:t("Skłon w przód (bow)","Forward bend (bow)"), ppos:t("Siad, skłon tułowia w przód ~45°, nos ku podłodze","Sitting, trunk bent forward ~45°, nose toward the floor"), body:"sit", yaw:0, face:"down"}
        : {ptitle:t("Odchylenie do tyłu (lean)","Backward tilt (lean)"), ppos:t("Siad, głowa odchylona do tyłu","Sitting, head tilted back"), body:"sit", yaw:0, face:"up"};
      if(v==="cupulo"){
        // KUPULO: kierunek z FIZYKI (position, cel przy osklepku — V4); napis GENEROWANY z tej samej
        // odpowiedzi (anat.h), więc nie może przeczyć strzałce. Scenariusz historii bez wpływu.
        const mk=(key)=>{ const p=mkPose(key);
          const nys=nysFromGeom("horizontal", A, v, stepHeadQ("sit", 0, key==="bow"?"down":"up"), "flat");
          const towardA = A==="P" ? nys.anat.h>0 : nys.anat.h<0;
          return {...p, nys, label: bltDirWord(A, towardA),
            note: key==="bow"
              ? t("Kupulolitiaza: ciężki osklepek reaguje na sam KIERUNEK grawitacji — bez latencji, uporczywie, niezależnie od położenia złogu (test powtarzalny).","Cupulolithiasis: the heavy cupula responds to the DIRECTION of gravity itself — no latency, persistently, regardless of debris position (repeatable test).")
              : t("Odchylenie odwraca rzut grawitacji na osklepek → kierunek przeciwny niż w skłonie.","Leaning back reverses the gravity projection on the cupula → direction opposite to the bow.")};
        };
        const arr=[mk("bow"), mk("lean")];
        arr.blt={scen:null, cupulo:true}; return arr;
      }
      // CANALO: strzałka + napis + obwiednia animacji z JEDNEJ symulacji sekwencji (skłon→siad→odchylenie)
      // dla scenariusza historii pozycyjnej. |strength| < XI_CARD → karta uczciwie „model nie rozstrzyga".
      const P=bltPhases(A, S), init=P.init;
      const mk=(key)=>{ const p=mkPose(key), xi=P[key].xi;
        const N=nysFromDyn("horizontal", A, xi, false);
        const emptied = init.exitedInHistory || (key==="lean" && P.bow.exited);
        const resolved = !emptied && N.strength>=XI_CARD;
        const nys={kind:N.kind, dir:resolved?N.dir:0, vdir:N.vdir, strength:resolved?N.strength:0,
                   excited:N.excited, persistent:false, canal:"horizontal", side:A,
                   q:stepHeadQ("sit",0,key==="bow"?"down":"up"), anat:resolved?N.anat:{h:0,v:0,t:0},
                   init:{phi0:init.phi0, settled:init.settled}, unresolved:!resolved};
        let label, note;
        if(emptied){
          label = init.exitedInHistory
            ? t("kanał opróżniony już PRZED testem","the canal was emptied BEFORE the test")
            : t("kanał opróżniony w fazie skłonu","the canal was emptied during the bow phase");
          note = t("Historia pozycyjna/poprzednia faza usunęła złóg z kanału — test niemy, pacjent w praktyce wyleczony (ta sama zasada, na której działa wymuszona pozycja Vannucchiego).","The positional history/previous phase removed the debris from the canal — the test is mute; in practice the patient is cured (the very principle behind Vannucchi's forced prolonged position).");
        } else if(key==="bow" && P.bow.exited){
          if(resolved){   // złóg ZA wododziałem, ale w zasięgu napędu: skłon bije ku ZDROWEJ (myląco!) i po drodze USUWA złóg
            label = bltDirWord(A, xi>0) + t(" — i złóg opuszcza kanał"," — and the debris leaves the canal");
            note = t("Złóg za wododziałem (φ₀>190°): skłon bije ku stronie ZDROWEJ — dokładnie PRZECIWNIE do reguły Choung (wynik MYLĄCY) — i jednocześnie wyprowadza złóg do łagiewki: diagnostyka wykonuje pracę manewru. Kolejne fazy i testy będą nieme.","Debris beyond the watershed (φ₀>190°): the bow beats toward the HEALTHY side — exactly OPPOSITE to the Choung rule (a MISLEADING result) — while carrying the debris into the utricle: the diagnostic does the maneuver's job. Subsequent phases and tests will be mute.");
          } else {        // złóg tuż przy ujściu: wyjście niemal bez wychylenia osklepka
            label = t("złóg opuszcza kanał — bez wyraźnego oczopląsu","the debris leaves the canal — no distinct nystagmus");
            note = t("Złóg leżał przy ujściu (φ₀ blisko końca łuku): skłon dopycha go do łagiewki niemal bez wychylenia osklepka — CICHE SAMOWYLECZENIE. Kolejne fazy i testy będą nieme.","The debris lay near the exit (φ₀ close to the arc end): the bow pushes it into the utricle with barely any cupular deflection — SILENT SELF-CLEARING. Subsequent phases and tests will be mute.");
          }
        } else if(!resolved){
          label = t("model nie rozstrzyga","the model does not resolve it");
          note = t(`Złóg spoczywa na WODODZIALE skłonu (φ₀≈${Math.round(init.phi0??Vestibular.restPhi("horizontal",A))}°, szczyt 190°), a napęd (0.026) nie zrywa adhezji (próg 0.04) — model uczciwie nie wskazuje kierunku. Klinicznie BLT jest niemy lub mylący u 11,5–45% chorych; wybierz scenariusz historii, by zobaczyć, kiedy reguła działa.`,`The debris rests on the bow WATERSHED (φ₀≈${Math.round(init.phi0??Vestibular.restPhi("horizontal",A))}°, crest 190°), and the drive (0.026) does not break adhesion (threshold 0.04) — the model honestly does not pick a direction. Clinically the BLT is mute or misleading in 11.5–45% of patients; pick a history scenario to see when the rule works.`);
        } else {
          label = bltDirWord(A, xi>0) + (N.strength<0.25 ? t(" (słaby)"," (weak)") : "");
          note = key==="bow"
            ? t("Skłon przenosi złóg DOampułkowo → pobudzenie (Ewald II) → oczopląs ku uchu choremu. Reguła Choung — tu WYNIKA z fizyki, bo scenariusz ustala położenie złogu.","The bow carries the debris ampullopetally → excitation (Ewald II) → nystagmus toward the affected ear. The Choung rule — here it FOLLOWS from physics, because the scenario pins the debris position.")
            : t("Odchylenie odwraca przepływ (ODampułkowy) → hamowanie → bije ku uchu zdrowemu, słabiej (rektyfikacja pobudzenie/hamowanie).","Leaning back reverses the flow (ampullofugal) → inhibition → beats toward the healthy ear, more weakly (excitation/inhibition rectification).");
        }
        return {...p, nys, label, note};
      };
      const arr=[mk("bow"), mk("lean")];
      arr.blt={scen:S, phi0:init.phi0, settled:init.settled, exitedInHistory:init.exitedInHistory,
               exitedInBow:P.bow.exited, bowXi:P.bow.xi, leanXi:P.lean.xi};
      return arr;
    }
  },
  headhang:{ get name(){return t("Test deep head-hang","Deep head-hang test");}, get tests(){return t("kanał przedni","anterior canal");}, canal:"anterior",
    get intro(){return t("Z siadu połóż pacjenta szybko na plecach z głową głęboko odchyloną w tył (~30° poniżej poziomu) — prosto, bez obrotu.","From sitting, lay the patient supine quickly with the head extended deeply back (~30° below horizontal) — straight, without rotation.");},
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? t(`Kanalolitiaza kanału przedniego: oczopląs ku dołowi — czysty downbeat. Lateralizacja oczopląsem NIEWIARYGODNA (torsja śladowa/nieobecna) — stronę różnicuj reakcją na manewr i kontekstem klinicznym.`,`Anterior-canal canalithiasis: downward nystagmus — pure downbeat. Lateralization by nystagmus is UNRELIABLE (torsion trace/absent) — differentiate the side by the response to the maneuver and clinical context.`)
      : t(`Kupulolitiaza kanału przedniego (bardzo rzadka): downbeat uporczywy, bez latencji. Strony nie da się pewnie ustalić oczopląsem. Uwaga (model): w tej geometrii deep head-hang słabo obciąża osklepek przedni (cel statyczny ~0,05) — oczopląs na ekranie jest SŁABY, a po transjencie przejścia pozornie przygasa.`,`Anterior-canal cupulolithiasis (very rare): persistent downbeat, no latency. The side cannot be reliably established by nystagmus. Note (model): in this geometry the deep head-hang loads the anterior cupula only weakly (static target ~0.05) — the on-screen nystagmus is WEAK and appears to fade after the transition transient.`),
    phases:(A,v)=>[{
      ptitle:t("Głowa głęboko w tył","Head deep back"), ppos:t("Na plecach, głowa prosto, głęboko odchylona (~30° poniżej poziomu)","Supine, head straight, extended deeply (~30° below horizontal)"),
      body:"supineDeepHang", yaw:0, face:"up",   // było supineHang (20°) przy opisie mówiącym 30° — poza szła za opisem
      nys: nysFromGeom("anterior", A, v, stepHeadQ("supineDeepHang", 0, "up")),
      label:t(`ku dołowi — czysty downbeat (bez wyraźnej torsji)`,`downward — pure downbeat (no clear torsion)`),
      note: v==="canalo"
        ? t("BEZ istotnej latencji (złóg startuje dociśnięty do osklepka — wyprowadzenie R7): czysty downbeat, narasta WOLNO (szczyt ~25 s), wygasa ~1 min, wyczerpuje się przy powtórzeniu. Oczopląsu nie używaj do ustalenia strony — torsja bywa śladowa/nieobecna.","WITHOUT significant latency (the debris starts pressed against the cupula — the R7 derivation): pure downbeat, builds SLOWLY (peak ~25 s), fades by ~1 min, fatigues on repetition. Do not use the nystagmus to establish the side — torsion may be trace/absent.")
        : t("bez latencji, downbeat SŁABY (deep head-hang słabo obciąża osklepek przedni w tej geometrii), nie wyczerpuje się. Uporczywy pozycyjny downbeat to przede wszystkim czerwona flaga ośrodkowa — patrz klasyfikacja.","no latency, WEAK downbeat (the deep head-hang loads the anterior cupula only weakly in this geometry), does not fatigue. A persistent positional downbeat is first of all a central red flag — see the classification.")
    }]
  },
};
function variantLabels(canal){
  return canal==="horizontal"
    ? {canalo:t("Kanalolitiaza (geotropowy)","Canalithiasis (geotropic)"), cupulo:t("Kupulolitiaza (apogeotropowy)","Cupulolithiasis (apogeotropic)")}
    : {canalo:t("Kanalolitiaza","Canalithiasis"), cupulo:t("Kupulolitiaza (rzadko)","Cupulolithiasis (rare)")};
}
// dobór manewru leczniczego na podstawie testu + wariantu
function recommend(testKey,variant){
  if(testKey==="dix"){
    return variant==="canalo"
      ? {primary:"epley",alts:["semont"],note:t("Kanalolitiaza kanału tylnego — preferowany manewr Epleya; alternatywnie Semont.","Posterior-canal canalithiasis — the Epley maneuver is preferred; Semont as an alternative.")}
      : {primary:"semont",alts:["bascule","epley"],note:t("Kupulolitiaza kanału tylnego (rzadka) — preferowany manewr uwalniający Semonta. W postaciach opornych/atypowych rozważ manewr Bascule („huśtawka” bok–bok odrywa złóg od osklepka). Epley służy głównie kanalolitiazie.","Posterior-canal cupulolithiasis (rare) — the Semont liberatory maneuver is preferred. In resistant/atypical forms consider the Bascule maneuver (side-to-side 'rocking' detaches the debris from the cupula). Epley mainly serves canalithiasis.")};
  }
  if(testKey==="headhang"){
    return variant==="canalo"
      ? {primary:"yacovino",alts:[],note:t("Kanalolitiaza kanału przedniego — manewr Yacovino (deep head-hang → szybki ruch brody do klatki). Kanał przedni jest rzadki; oczopląs to czysty downbeat — strony nie ustalisz oczopląsem, różnicuj kontekstem i reakcją na manewr.","Anterior-canal canalithiasis — the Yacovino maneuver (deep head-hang → quick chin-to-chest movement). The anterior canal is rare; the nystagmus is a pure downbeat — you cannot establish the side by nystagmus, differentiate by context and response to the maneuver.")}
      : {primary:"yacovino",alts:[],note:t("Kupulolitiaza kanału przedniego (bardzo rzadka) — postępowanie jak w kanalolitiazie; rozważ ponowną ocenę i wykluczenie przyczyny ośrodkowej (izolowany downbeat).","Anterior-canal cupulolithiasis (very rare) — manage as for canalithiasis; consider re-evaluation and ruling out a central cause (isolated downbeat).")};
  }
  // roll / bowlean → kanał poziomy
  return variant==="canalo"
    ? {primary:"lempert",alts:["gufoniGeo"],note:t("Geotropowy (kanalolitiaza) kanału poziomego — rolka Lemperta ku stronie zdrowej lub manewr Gufoniego (geotropowy).","Geotropic (canalithiasis) of the horizontal canal — Lempert roll toward the healthy side or the Gufoni maneuver (geotropic).")}
    : {primary:"gufoniApo",alts:["lempert"],note:t("Apogeotropowy (kupulolitiaza) — manewr Gufoniego (apogeotropowy) przekształca postać w geotropową; następnie ponowny test i leczenie postaci geotropowej.","Apogeotropic (cupulolithiasis) — the Gufoni maneuver (apogeotropic) converts the form into a geotropic one; then re-test and treat the geotropic form.")};
}
// Klasyfikacja podtypu BPPV wg kryteriów Bárány Society (ICVD 2015): mapuje (kanał, wariant, strona, tryb downbeat)
// na formalną etykietę + poziom pewności (established/emerging) + cechy różnicujące (latencja/czas/męczliwość/kierunek/
// strona chora). Czysta funkcja kliniczna — jak recommend(); zasila kartę „Klasyfikacja" w diagnostyce. NIE zmienia
// fizyki — synteza z konwencji już zakodowanych w DIAG (latNote/features). [Kryteria źródłowe: Bárány/ICVD 2015 —
// von Brevern i wsp.; ocena II C: dawny odnośnik „engine_doc: KRYTERIA BARANY" wskazywał sekcję, której nie ma.]
function baranyClassify(canal, variant, side, antMode){
  const S=sideN(side);
  const est={ tier:"established", tierLabel:t("zespół ustalony","established syndrome") };
  const emg={ tier:"emerging",    tierLabel:t("zespół wyłaniający się / atypowy","emerging / atypical syndrome") };
  if(antMode || canal==="anterior")
    return { ...emg, subtype:t("BPPV kanału przedniego","Anterior-canal BPPV"),
      crit:[[t("Latencja","Latency"), variant==="cupulo"?t("brak","none"):t("po latencji","after a latency")],[t("Czas trwania","Duration"), variant==="cupulo"?t("uporczywy","persistent"):"< 1 min"],
            [t("Męczliwość","Fatigability"), variant==="cupulo"?t("nie","no"):t("tak","yes")],[t("Kierunek","Direction"),t("czysty downbeat (± śladowa torsja)","pure downbeat (± trace torsion)")],[t("Strona chora","Affected side"),t("niepewna z oczoplasu","uncertain from nystagmus")]],
      redflag:t("Izolowany downbeat pozycyjny — WYKLUCZ przyczynę ośrodkową (móżdżek, pogranicze czaszkowo-szyjne) przed leczeniem.","Isolated positional downbeat — RULE OUT a central cause (cerebellum, craniocervical junction) before treatment.") };
  if(canal==="posterior")
    return variant==="canalo"
      ? { ...est, subtype:t("BPPV kanału tylnego — kanalolitiaza","Posterior-canal BPPV — canalithiasis"),
          crit:[[t("Latencja","Latency"),t("1–kilka s","1–a few s")],[t("Czas trwania","Duration"),"< 1 min"],[t("Męczliwość","Fatigability"),t("tak — złóg się rozprasza","yes — the debris disperses")],[t("Kierunek","Direction"),t("upbeat + skrętny ku uchu dolnemu","upbeat + torsional toward the lower ear")],[t("Odwrócenie przy siadaniu","Reversal on sitting up"),t("tak — po powrocie bije przeciwnie (złóg cofa się w kanale)","yes — beats the opposite way on return (the debris moves back in the canal)")],[t("Strona chora","Affected side"),`${S} ${t("(ucho zależne)","(dependent ear)")}`]] }
      : { ...emg, subtype:t("BPPV kanału tylnego — kupulolitiaza (atypowa)","Posterior-canal BPPV — cupulolithiasis (atypical)"),
          crit:[[t("Latencja","Latency"),t("brak","none")],[t("Czas trwania","Duration"),t("uporczywy (> 1 min)","persistent (> 1 min)")],[t("Męczliwość","Fatigability"),t("nie","no")],[t("Kierunek","Direction"),t("upbeat-skrętny, uporczywy","upbeat-torsional, persistent")],[t("Strona chora","Affected side"),S]] };
  // kanał poziomy (roll / bow-lean)
  return variant==="canalo"
    ? { ...est, subtype:t("BPPV kanału poziomego — kanalolitiaza (geotropowy)","Horizontal-canal BPPV — canalithiasis (geotropic)"),
        crit:[[t("Latencja","Latency"),t("sekundy","seconds")],[t("Czas trwania","Duration"),"< 1 min"],[t("Męczliwość","Fatigability"),t("tak","yes")],[t("Kierunek","Direction"),t("geotropowy (ku uchu w dole)","geotropic (toward the lower ear)")],[t("Strona chora","Affected side"),`${S} — ${t("SILNIEJSZA reakcja","STRONGER response")}`]] }
    : { ...est, subtype:t("BPPV kanału poziomego — kupulolitiaza (apogeotropowy)","Horizontal-canal BPPV — cupulolithiasis (apogeotropic)"),
        crit:[[t("Latencja","Latency"),t("brak / krótka","none / brief")],[t("Czas trwania","Duration"),t("uporczywy","persistent")],[t("Męczliwość","Fatigability"),t("nie","no")],[t("Kierunek","Direction"),t("apogeotropowy (ku uchu w górze)","apogeotropic (toward the upper ear)")],[t("Punkt zerowy (null point)","Null point"),t("zanik przy ~10–30° skrętu ku uchu choremu","abolished at ~10–30° rotation toward the affected ear")],[t("Strona chora","Affected side"),`${S} — ${t("SŁABSZA reakcja","WEAKER response")}`]],
        redflag:t("Uporczywy pozycyjny DCPN bez punktu zerowego, kierunek niemieszczący się w jednym kanale lub ataksja → rozważ przyczynę OŚRODKOWĄ (CPN — przełącz na widok „Ośrodkowy”). Trwały GEOTROPOWY oczopląs >1 min sugeruje light cupula, nie kanalolitiazę.","Persistent positional DCPN without a null point, a direction that fits no single canal, or ataxia → consider a CENTRAL cause (CPN — switch to the \"Central\" view). Persistent GEOTROPIC nystagmus >1 min suggests light cupula, not canalithiasis.") };
}
const CANAL_OF={epley:"posterior",semont:"posterior",bascule:"posterior",lempert:"horizontal",gufoniGeo:"horizontal",gufoniApo:"horizontal",yacovino:"anterior"};

export { SIDE, stepPivot, otherSide, earToScreen, yawToA, makeManualOrientation, epley, semont, bascule, lempert, yacovino, gufoniGeo, gufoniApo, MANEUVERS, CANALS, XI_CARD, BLT_HISTORY, bltInit, bltPhases, bltZones, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, POSE_SPEC, poseOf, headQOf, stepGravity, stepHeadQ, composeHead, SK, SKEL, fkJoints, POSE3D, TORSO_Q, bodyClass, bodyJoints, poseSpec, gravArrowFor, sizeRadius, holdMult, sizedSeconds, derivedHold, maneuverTimeline, maneuverSim, featsByVariant, DIAG, variantLabels, recommend, baranyClassify, CANAL_OF };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { makeManualOrientation, epley, semont, bascule, lempert, yacovino, gufoniGeo, gufoniApo, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, stepGravity, stepHeadQ, composeHead, fkJoints, bodyClass, bodyJoints, gravArrowFor, sizedSeconds, maneuverTimeline, maneuverSim, variantLabels, recommend });
