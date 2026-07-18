// Poza + domena manewrów/diagnostyki BPPV (czyste: silnik → plan/poza/oczopląs; bez state/DOM).
import { Vestibular } from '../engine/vestibular.js';
import { Scene3D } from '../engine/scene3d.js';
import { $ } from '../runtime/registry.js';
import { render } from '../render/svg-screens.js';
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
    {title:t("Głębokie odchylenie głowy","Deep head-hang"),body:"supineDeepHang",yaw:0,face:"up",seconds:30,dynHold:22,progress:0.30,
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
// Kierunki oczopląsu dla wszystkich testów (Dix–Hallpike, Roll, Bow & Lean) wynikają z
// geometrii (silnik Vestibular): orientacja głowy → grawitacja → przepływ → prawo Ewalda.
function nysFromGeom(canal, side, variant, q, strengthMode){
  const r = Vestibular.position({canal, side, variant, q});
  // 'asym' (Roll): amplituda lateralizuje (Ewald II — hamowanie słabsze);
  // 'flat' (Bow & Lean, Dix): lateralizacja przez kierunek
  // KUPULOLITIAZA słabsza od kanalolitiazy — ten sam współczynnik co w silniku (Vestibular.CUP_WEAK): oczopląs
  //   wariantu „cupulo" mniej intensywny, lecz uporczywy (persistent niżej niesie brak wygasania).
  const cupWeak = variant==="cupulo" ? Vestibular.CUP_WEAK : 1;
  const strength = (strengthMode==="asym" ? (r.excited?1:0.45) : 1) * cupWeak;
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
  const base = horizontal ? (apo ? "oczopląs poziomy (apogeotropowy)" : "oczopląs poziomy")
             : canal==="anterior" ? "oczopląs ↓ (downbeat)" : "oczopląs ↑ + skrętny";
  const label = base + (rev ? " — ODWRÓCONY" : "") + (weak ? " (słaby)" : "");
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
function provokeQ(canal, side){
  if(canal==="horizontal") return Vestibular.qSupineYaw(side==="P"? 90 : -90); // ucho chore w dół
  if(canal==="anterior")  return Vestibular.qSupineYaw(0);                      // głębokie odchylenie (strona przez skręt)
  return Vestibular.qSupineYaw(side==="P"? 45 : -45);                           // tylny (Dix-Hallpike)
}
// przebieg ξ(t) z silnika: kanalolitiaza = PRZEJŚCIOWY (wygasa, cząstka wychodzi, NIE wraca);
// kupulolitiaza = uporczywy (trzyma się, dopóki pozycja utrzymana).
function engineXi(canal, side, persistent, q){
  const timeline=[{q: q||provokeQ(canal,side), tTrans:0.5, tHold: persistent?18:40}];
  return persistent
    ? Vestibular.simulateCupulolith({canal, side, timeline})
    : Vestibular.simulateCanalith({canal, side, timeline});
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
   Walidacja offline (cząstka osiąga φ=178°=wyjście, obie strony):
     Epley ✓ · Yacovino ✓ · Lempert ✓ · Semont ✓ · Gufoni geotropowy ✓
     Gufoni apogeotropowy ✗ — POPRAWNIE: to manewr KONWERSJI (apo→geo), nie czyści wprost. */
function qFromG(g){                                   // kwaternion head→świat t.że gHead(q)=g
  const a=[0,-1,0], n=Math.hypot(g[0],g[1],g[2])||1, b=[g[0]/n,g[1]/n,g[2]/n];
  const d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  if(d>0.9999) return [1,0,0,0];
  if(d<-0.9999) return [0,1,0,0];
  const c=[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const q=[1+d,c[0],c[1],c[2]], m=Math.hypot(q[0],q[1],q[2],q[3]);
  return Vestibular.qconj([q[0]/m,q[1]/m,q[2]/m,q[3]/m]);
}
const rotYg=(g,deg)=>{ const r=deg*Math.PI/180, c=Math.cos(r), s=Math.sin(r); // obrót grawitacji wokół osi czaszki (skręt szyi)
  return [g[0]*c+g[2]*s, g[1], -g[0]*s+g[2]*c]; };
// grawitacja w ramce głowy dla yaw=0 (skręt nakładany osobno)
const BASE_G={ "sit|fwd":[0,-1,0], "sit|down":[0,0.9,0.45], "sit|up":[0,-0.5,-0.85],
  "sit|chin":[0,-0.64,0.77],   // broda przy klatce (~50° przygięcia; Yacovino krok 4) — NIE głęboki skłon „down" (Bow&Lean)
  "prone|down":[0,0.3,0.95], "sideL|fwd":[-1,0,0], "sideR|fwd":[1,0,0],
  "sideL|down":[-0.5,0.6,0.6], "sideR|down":[0.5,0.6,0.6], "sideL|up":[-0.6,-0.5,-0.6], "sideR|up":[0.6,-0.5,-0.6],
  "sitFront|fwd":[0,-1,0] };
// Semont (rzuty boczne leanL/leanR) — gHead KOŃCOWE (skręt szyi wbudowany), lustro wg strony.
// |down: nos ~46° POD poziomem (składowa nosa 0.72) — twarz wyraźnie ku podłodze/materacowi (rzut skośny
// pokazuje wtedy tył/czubek głowy). Zweryfikowane: Semont dalej CZYŚCI L i P (φ→178); audyt #1 zachowany
// (composeHead czerpie z LEAN_G → gHead(composeHead)==stepGravity). Było [±0.4,0.85,0.3] (nos ~18°, mylący profil w górę).
const LEAN_G={ "leanL|up":[0.5,-0.2,-0.8], "leanR|up":[-0.5,-0.2,-0.8],
  "leanR|down":[-0.35,0.6,0.72], "leanL|down":[0.35,0.6,0.72],
  // GŁOWA NEUTRALNA na boku (Gufoni: kładziemy na bok chory, głowa w linii ciała — NIE skręcona jak w Semoncie).
  // Grawitacja czysto boczna: leanL = bok PRAWY w dół (gHead +x), leanR = bok LEWY w dół (gHead −x) — DOKŁADNIE
  // ta sama fizyka co sideR|fwd / sideL|fwd (kanał poziomy prowokowany), ale poza rzutowana FRONTALNIE (jak Semont).
  "leanL|fwd":[1,0,0], "leanR|fwd":[-1,0,0],
  // NOS KU SUFITOWI (Gufoni apo krok 3): pacjent na boku CHORYM skręca głowę ~90° tak, że nos celuje PROSTO
  // W GÓRĘ (∥ świat +y). Grawitacja w ramce głowy pada wtedy wzdłuż osi nosowo-potylicznej: gHead=[0,0,-1]
  // (identyczne dla obu boków — kierunek nosa nie zależy od rolla wokół osi nosa). Poza rzutowana FRONTALNIE.
  "leanL|ceil":[0,0,-1], "leanR|ceil":[0,0,-1],
  // NOS KU PODŁODZE (Gufoni geo krok 3): pacjent na boku ZDROWYM obraca głowę nosem w dół. Grawitacja MATCHUJE
  // sideX|down — FIZYKA/oczopląs BEZ ZMIAN, zmienia się tylko KAMERA na frontalną (leanH leży na boku zdrowym:
  // leanR↔sideL dla P, leanL↔sideR dla L → leanL|floor=sideR|down, leanR|floor=sideL|down).
  "leanL|floor":[0.5,0.6,0.6], "leanR|floor":[-0.5,0.6,0.6] };
// Pochylenie głowy wokół osi ucha dla póz supine (° do qSupineYaw). Ta sama q dla stepHeadQ (fizyka)
// i composeHead (render) → zero rozjazdu (audyt #1). ZGŁOSZENIE Yacovino (screeny z markerami):
//   • supineChin (krok 3): −75° dawało nos POZIOMO KU ŚCIANIE za głową (czubek w materac) — absurd
//     anatomiczny. +75° = broda do klatki: nos w górę-ku-stopom (nos_świat≈[0,0.42,0.90]).
//   • supineDeepHang (krok 2): −30° = GŁĘBOKI zwis (nos ku górze-i-w-tył, gHead≈[0,0.64,−0.77]),
//     głębszy niż wspólny supineHang (Epley/Dix, ~10° poniżej poziomu). To ODSŁONIŁO ukryty błąd:
//     stary silnik „czyścił" anterior tylko przy anatomicznie ODWROTNEJ pozie (grawitacja ku czubkowi).
//     Poprawka: głęboki zwis czyści kanał W TRAKCIE zwisu (φ→178 przy holdzie dynamiki ~22 s — dynHold
//     na kroku), a broda/siad już tylko wyprowadzają (exited zostaje). NIE tknięto geometrii kanału.
const SUPINE_PITCH={ supineChin:+75, supineDeepHang:-30 };
function supineHeadQ(body, yaw){          // orientacja głowy dla póz supine (opcjonalny pitch brody)
  const q=Vestibular.qSupineYaw(yaw), p=SUPINE_PITCH[body];
  return p ? Vestibular.qmul(q, Vestibular.qaxis([1,0,0], p)) : q;
}
function stepGravity(body, yaw, face){               // gHead dla kroku manewru
  if(body.startsWith("supine")) return Vestibular.rotate(Vestibular.qconj(supineHeadQ(body,yaw)), [0,-1,0]);  // supineHang/Flex/Flat/Chin
  const key=body+"|"+face;
  if(body==="leanL"||body==="leanR") return LEAN_G[key]||[0,-1,0];   // yaw wbudowany
  const g=BASE_G[key]||BASE_G[body+"|fwd"]||[0,-1,0];
  return rotYg(g, -yaw);
}
function stepHeadQ(body, yaw, face){                  // orientacja głowy (head→świat) dla kroku
  return body.startsWith("supine") ? supineHeadQ(body,yaw) : qFromG(stepGravity(body,yaw,face));
}
// ===== MODEL 3D — Krok 1: orientacja CIAŁA + złożenie głowy = ciało ∘ pitch(twarz) ∘ skręt szyi(yaw) =====
// Zgodne z silnikiem: gHead(composeHead) == stepGravity (zweryfikowane offline dla wszystkich kombinacji).
// Daje też POPRAWNY roll anatomiczny (w przeciwieństwie do qFromG, gdzie roll jest dowolny) — to jest
// niezbędne do rzutu szkieletu 3D (Krok 2-3). Na razie NIE podłączone do renderu.
const BODY_Q = {                                     // orientacja głowy (head→świat) przy neutralnej twarzy, yaw=0
  sit:[1,0,0,0], sitFront:[1,0,0,0],
  sideL:Vestibular.qaxis([0,0,1],90), sideR:Vestibular.qaxis([0,0,1],-90),
  prone:Vestibular.qmul(Vestibular.qaxis([0,0,1],180),Vestibular.qaxis([1,0,0], Math.atan2(-BASE_G["prone|down"][2],BASE_G["prone|down"][1])*180/Math.PI))   // twarz w dół; pitch WYPROWADZONY z BASE_G["prone|down"] → gHead(composeHead)==stepGravity (było -107.5°, rozjazd 35° — audyt #1)
};
const BODY_NEUTRAL = { sit:"fwd", sitFront:"fwd", sideL:"fwd", sideR:"fwd", prone:"down" };
function qFromToVec(a,b){                             // najkrótsza rotacja wektora a→b (samo normalizuje wejście)
  const la=Math.hypot(a[0],a[1],a[2])||1, lb=Math.hypot(b[0],b[1],b[2])||1;
  a=[a[0]/la,a[1]/la,a[2]/la]; b=[b[0]/lb,b[1]/lb,b[2]/lb];
  const d=Math.max(-1,Math.min(1, a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  if(d>0.99999) return [1,0,0,0];
  const cx=[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const cl=Math.hypot(cx[0],cx[1],cx[2]);
  if(cl<1e-6) return Vestibular.qaxis(Math.abs(a[0])>0.9?[0,1,0]:[1,0,0], 180);  // antyrównoległe
  return Vestibular.qaxis([cx[0]/cl,cx[1]/cl,cx[2]/cl], Math.acos(d)*180/Math.PI);
}
function headPitchQ(body,face){                      // pitch szyi: neutral→face (z BASE_G); rotate(qconj(P),g0)=gFace
  const n=BODY_NEUTRAL[body]; if(!n||face===n) return [1,0,0,0];
  const g0=BASE_G[body+"|"+n], gf=BASE_G[body+"|"+face]; if(!g0||!gf) return [1,0,0,0];
  return Vestibular.qconj(qFromToVec(g0, gf));
}
function composeHead(body,yaw,face){                 // orientacja głowy (head→świat) z ciała+pitch+szyi
  if(body.startsWith("supine")) return supineHeadQ(body,yaw);                   // = qSupineYaw (+ pitch brody dla supineChin)
  if(body==="leanL"||body==="leanR"){                                          // Semont: głowa leżąca na boku; grawitacja = LEAN_G (źródło prawdy silnika)
    const T=TORSO_Q[body], g=LEAN_G[body+"|"+face]||[0,-1,0];                   // roll z tułowia-na-boku + minimalna korekta orientacji do grawitacji kroku
    return Vestibular.qmul(T, qFromToVec(g, Vestibular.gHead(T)));              // gHead(composeHead)==LEAN_G z konstrukcji (było skręt 45°, rozjazd 17.6°/59.9° — audyt #1)
  }
  const B=BODY_Q[body]||[1,0,0,0];
  return Vestibular.qmul(Vestibular.qmul(B, headPitchQ(body,face)), Vestibular.qaxis([0,1,0],yaw));
}
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
// orientacja TUŁOWIA (torso→świat) per ciało. Głowa osobno przez composeHead (Krok 3).
const TORSO_Q={
  sit:[1,0,0,0], sitFront:[1,0,0,0],
  sideL:Vestibular.qmul(Vestibular.qaxis([0,0,1],90), Vestibular.qaxis([1,0,0],-90)),   // na boku: supine + roll wokół osi długiej
  sideR:Vestibular.qmul(Vestibular.qaxis([0,0,1],-90),Vestibular.qaxis([1,0,0],-90)),
  prone:Vestibular.qmul(Vestibular.qaxis([0,0,1],180),Vestibular.qaxis([1,0,0],-90)),   // na brzuchu = supine + obrót 180° wokół osi długiej: twarz w dół, głowa NIE odwrócona
  supineHang:Vestibular.qaxis([1,0,0],-90), supineDeepHang:Vestibular.qaxis([1,0,0],-90), supineFlex:Vestibular.qaxis([1,0,0],-90), supineFlat:Vestibular.qaxis([1,0,0],-90), supineChin:Vestibular.qaxis([1,0,0],-90),
  leanL:Vestibular.qaxis([0,0,1],-90), leanR:Vestibular.qaxis([0,0,1],90)   // Semont: POZIOME leżenie na boku (widok odgórny); leanL=prawy bok w dół, leanR=lewy bok w dół
};
// kąt szyi per ciało (stopnie, wokół osi usznej x): <0 = wyprost (głowa do tyłu/zwis), >0 = zgięcie (broda do mostka).
// Wszystkie supine* mają identyczny gHead (silnik ich nie różnicuje) → różnica Hang/Flex/Flat jest TU, w pozie szyi.
const NECK_DEG={ supineHang:-34, supineDeepHang:-52, supineFlex:28, supineFlat:12, supineChin:45 };   // supineChin: kark mocno przygięty (broda do klatki); supineDeepHang: głębszy wyprost niż zwykły zwis (Yacovino)
function bodyClass(b){ return b.startsWith("supine")?"supine":(b==="sideL"||b==="sideR")?"side":(b==="leanL"||b==="leanR")?"lean":b; }
function bodyJoints(body,face){                       // pozycje 3D stawów po orientacji w przestrzeni (pre-kamera)
  const pose=Object.assign({}, POSE3D[bodyClass(body)]||{});
  let nd=(NECK_DEG[body]||0);                          // wyprost/zgięcie szyi (<0 wyprost, >0 zgięcie do klatki)
  if(body==="sit"){ if(face==="down") nd+=30; else if(face==="up") nd-=30; else if(face==="chin") nd+=45; }   // dynamiczny kark: skłon (bow) / odchylenie / broda do klatki (Yacovino)
  if(nd) pose.neckBase=Vestibular.qaxis([1,0,0], nd);
  if(body==="sit" && face==="down"){                    // Skłon w przód (Bow): ZAWIAS BIODROWY — cały tułów pada do przodu (~45°, nad uda),
    const F=45;                                         // głowa dołem, nos ku podłodze. Same zgięcie karku nie oddaje tej pozy (patrz rycina Bow & Lean).
    pose.pelvis=Vestibular.qaxis([1,0,0], F);            // tułów w przód (zawias w biodrach)
    pose.hipL=Vestibular.qaxis([1,0,0], -90-F); pose.hipR=Vestibular.qaxis([1,0,0], -90-F);   // uda niezmienione — kontr-obrót znosi obrót miednicy (nogi zostają)
    pose.shL=Vestibular.qaxis([1,0,0], -F); pose.shR=Vestibular.qaxis([1,0,0], -F);            // ramiona zwisają pionowo (kontr-obrót barków)
  }
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
const sizeRadius=s=>({small:0.78, medium:1.0, big:1.35})[s]!==undefined?({small:0.78, medium:1.0, big:1.35})[s]:1;
// Klinicznie zalecany hold kroku wg rozmiaru: małe (wolno osiadające) złogi wymagają DŁUŻSZEGO utrzymania
// pozycji (uzasadnienie ~30 s holdów w CRP: Hain, Squires & Stone 2005). medium/big = bez zmian (bezpieczne).
const holdMult=s=> s==="small"?1.6:1;
function sizedSeconds(sec, size){ if(sec==null) return null; const v=sec*holdMult(size); return Math.max(15, Math.min(120, Math.round(v/15)*15)); }
// oś czasu manewru: [{q,tTrans,tHold}] — wejście do simulateCanalith/Cupulolith
function maneuverTimeline(plan, size="medium"){
  const r=sizeRadius(size), cap = r>=1 ? 12 : Math.round(12/(r*r));   // małe złogi osiadają wolniej → dłuższy hold dynamiki (medium/big=12, regresja)
  return plan.steps.map(st=>({
    q: stepHeadQ(st.body, st.yaw, st.face),
    tTrans: 0.8,
    // dynHold: override czasu DYNAMIKI dla pojedynczego kroku (Yacovino: głęboki zwis czyści anterior
    // dopiero po ~22 s — dłużej niż domyślny cap; NIE zmienia to innych manewrów). Skalujemy tak jak cap
    // (małe złogi osiadają wolniej → cap=12/r², medium/big=12): dynHold·(cap/12) — small ~37 s, medium 22 s;
    // sprawdzone: φ→178 exited dla small/medium/big. Timer wyświetlany (st.seconds) niezależny.
    tHold: st.dynHold!=null ? st.dynHold * (cap/12) : Math.max(6, Math.min(cap, st.seconds!=null ? st.seconds : 6))
  }));
}
// pełna symulacja manewru → φ(t) cząstki w kanale (dynamika repozycji)
function maneuverSim(plan, size="medium"){
  return Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, timeline:maneuverTimeline(plan,size), size});
}
// v: "canalo" (kanalolitiaza / geotropowy) | "cupulo" (kupulolitiaza / apogeotropowy)
const featsByVariant = v => v==="canalo"
  ? ["Latencja 1–5 s","Przemijający (<60 s)","Wyczerpuje się"]
  : ["Bez latencji","Uporczywy (>60 s)","Nie wyczerpuje się"];

const DIAG={
  dix:{ get name(){return t("Manewr Dix–Hallpike","Dix–Hallpike test");}, get tests(){return t("kanał tylny","posterior canal");}, canal:"posterior",
    intro:"Z siadu obróć głowę 45° w stronę badaną, połóż szybko na plecach z głową odchyloną ~20° poniżej poziomu.",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Postać klasyczna (kanalolitiaza): złóg swobodny w kanale tylnym po stronie ${SIDE[A]}.`
      : `Postać rzadka (kupulolitiaza): złóg na osklepku kanału tylnego — oczopląs uporczywy.`,
    phases:(A,v)=>[{
      ptitle:"Strona chora w dole", ppos:"Na plecach, głowa 45° ku stronie chorej, ~20° poniżej poziomu",
      body:"supineHang", yaw:yawToA(A), face:"up",
      nys: nysFromGeom("posterior", A, v, Vestibular.qSupineYaw(A==="P"?45:-45)),
      label:`ku górze + skrętny ku uchu choremu (${SIDE[A]})`,
      note: v==="canalo"
        ? "po latencji, narasta i wygasa; wyczerpuje się przy powtórzeniu."
        : "bez latencji, uporczywy, nie wyczerpuje się przy powtórzeniu."
    }]
  },
  roll:{ get name(){return t("Test pozycyjny (Roll / Pagnini–McClure)","Positional test (Roll / Pagnini–McClure)");}, get tests(){return t("kanał poziomy","horizontal canal");}, canal:"horizontal",
    intro:"Pacjent na plecach, głowa zgięta ~30°. Obróć głowę szybko w jedną, potem w drugą stronę.",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Geotropowy: strona chora = SILNIEJSZA reakcja → ${SIDE[A]}.`
      : `Apogeotropowy: strona chora = SŁABSZA reakcja przy uchu w dole → ${SIDE[A]}.`,
    phases:(A,v)=>{ const H=otherSide(A), geo=(v==="canalo");
      const mk=down=>{ const up=otherSide(down);
        const strong = geo ? (down===A) : (down===H);
        return {ptitle:`Ucho ${down==="L"?"lewe":"prawe"} w dole`, ppos:`Głowa obrócona 90° ku stronie ${SIDE[down]}`,
          body:"supineFlex", yaw: down==="P"?90:-90, face:"up",
          nys: nysFromGeom("horizontal", A, v, Vestibular.qSupineYaw(down==="P"?90:-90), "asym"),
          label: geo ? `geotropowy — ku uchu w dole (${SIDE[down]})` : `apogeotropowy — ku uchu w górze (${SIDE[up]})`,
          note: strong ? "Reakcja silniejsza w tej pozycji." : "Reakcja słabsza w tej pozycji."};
      };
      return [mk(A), mk(H)];
    }
  },
  bowlean:{ get name(){return t("Test Bow & Lean (skłon i odchylenie)","Bow & Lean test (bow and lean)");}, get tests(){return t("kanał poziomy — lateralizacja","horizontal canal — lateralization");}, canal:"horizontal",
    intro:"W siadzie wykonaj skłon głowy w przód (bow), następnie odchylenie do tyłu (lean).",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Geotropowy: skłon (bow) bije ku stronie chorej → ${SIDE[A]}.`
      : `Apogeotropowy: kierunki odwrócone — skłon bije ku stronie zdrowej.`,
    phases:(A,v)=>{ const H=otherSide(A), geo=(v==="canalo");
      return [
        {ptitle:"Skłon w przód (bow)", ppos:"Siad, skłon tułowia w przód ~45°, nos ku podłodze",
         body:"sit", yaw:0, face:"down",
         nys: nysFromGeom("horizontal", A, v, Vestibular.qPitch(90), "flat"),
         label: geo?`bije ku stronie chorej (${SIDE[A]})`:`bije ku stronie zdrowej (${SIDE[H]})`,
         note: geo?"Geotropowy: skłon wskazuje stronę chorą.":"Apogeotropowy: kierunek odwrócony."},
        {ptitle:"Odchylenie do tyłu (lean)", ppos:"Siad, głowa odchylona do tyłu",
         body:"sit", yaw:0, face:"up",
         nys: nysFromGeom("horizontal", A, v, Vestibular.qPitch(-90), "flat"),
         label: geo?`bije ku stronie zdrowej (${SIDE[H]})`:`bije ku stronie chorej (${SIDE[A]})`,
         note: geo?"Przy odchyleniu kierunek odwraca się (ku zdrowej).":"Apogeotropowy: odchylenie bije ku chorej."},
      ];
    }
  },
  headhang:{ get name(){return t("Test deep head-hang","Deep head-hang test");}, get tests(){return t("kanał przedni","anterior canal");}, canal:"anterior",
    intro:"Z siadu połóż pacjenta szybko na plecach z głową głęboko odchyloną w tył (~30° poniżej poziomu) — prosto, bez obrotu.",
    features:featsByVariant,
    latNote:(A,v)=> v==="canalo"
      ? `Kanalolitiaza kanału przedniego: oczopląs ku dołowi — czysty downbeat. Lateralizacja oczopląsem NIEWIARYGODNA (torsja śladowa/nieobecna) — stronę różnicuj reakcją na manewr i kontekstem klinicznym.`
      : `Kupulolitiaza kanału przedniego (bardzo rzadka): downbeat uporczywy, bez latencji. Strony nie da się pewnie ustalić oczopląsem.`,
    phases:(A,v)=>[{
      ptitle:"Głowa głęboko w tył", ppos:"Na plecach, głowa prosto, głęboko odchylona (~30° poniżej poziomu)",
      body:"supineHang", yaw:0, face:"up",
      nys: nysFromGeom("anterior", A, v, Vestibular.qSupineYaw(0)),
      label:`ku dołowi — czysty downbeat (bez wyraźnej torsji)`,
      note: v==="canalo"
        ? "po latencji: czysty downbeat, narasta i wygasa, wyczerpuje się przy powtórzeniu. Oczopląsu nie używaj do ustalenia strony — torsja bywa śladowa/nieobecna."
        : "bez latencji, downbeat, uporczywy, nie wyczerpuje się przy powtórzeniu."
    }]
  },
};
function variantLabels(canal){
  return canal==="horizontal"
    ? {canalo:"Kanalolitiaza (geotropowy)", cupulo:"Kupulolitiaza (apogeotropowy)"}
    : {canalo:"Kanalolitiaza", cupulo:"Kupulolitiaza (rzadko)"};
}
// dobór manewru leczniczego na podstawie testu + wariantu
function recommend(testKey,variant){
  if(testKey==="dix"){
    return variant==="canalo"
      ? {primary:"epley",alts:["semont"],note:"Kanalolitiaza kanału tylnego — preferowany manewr Epleya; alternatywnie Semont."}
      : {primary:"semont",alts:["bascule","epley"],note:"Kupulolitiaza kanału tylnego (rzadka) — preferowany manewr uwalniający Semonta. W postaciach opornych/atypowych rozważ manewr Bascule („huśtawka” bok–bok odrywa złóg od osklepka). Epley służy głównie kanalolitiazie."};
  }
  if(testKey==="headhang"){
    return variant==="canalo"
      ? {primary:"yacovino",alts:[],note:"Kanalolitiaza kanału przedniego — manewr Yacovino (deep head-hang → szybki ruch brody do klatki). Kanał przedni jest rzadki; oczopląs to czysty downbeat — strony nie ustalisz oczopląsem, różnicuj kontekstem i reakcją na manewr."}
      : {primary:"yacovino",alts:[],note:"Kupulolitiaza kanału przedniego (bardzo rzadka) — postępowanie jak w kanalolitiazie; rozważ ponowną ocenę i wykluczenie przyczyny ośrodkowej (izolowany downbeat)."};
  }
  // roll / bowlean → kanał poziomy
  return variant==="canalo"
    ? {primary:"lempert",alts:["gufoniGeo"],note:"Geotropowy (kanalolitiaza) kanału poziomego — rolka Lemperta ku stronie zdrowej lub manewr Gufoniego (geotropowy)."}
    : {primary:"gufoniApo",alts:["lempert"],note:"Apogeotropowy (kupulolitiaza) — manewr Gufoniego (apogeotropowy) przekształca postać w geotropową; następnie ponowny test i leczenie postaci geotropowej."};
}
// Klasyfikacja podtypu BPPV wg kryteriów Bárány Society (ICVD 2015): mapuje (kanał, wariant, strona, tryb downbeat)
// na formalną etykietę + poziom pewności (established/emerging) + cechy różnicujące (latencja/czas/męczliwość/kierunek/
// strona chora). Czysta funkcja kliniczna — jak recommend(); zasila kartę „Klasyfikacja" w diagnostyce. NIE zmienia
// fizyki — synteza z konwencji już zakodowanych w DIAG (latNote/features). [engine_doc: KRYTERIA BARANY]
function baranyClassify(canal, variant, side, antMode){
  const S=SIDE[side];
  const est={ tier:"established", tierLabel:"zespół ustalony" };
  const emg={ tier:"emerging",    tierLabel:"zespół wyłaniający się / atypowy" };
  if(antMode || canal==="anterior")
    return { ...emg, subtype:"BPPV kanału przedniego",
      crit:[["Latencja", variant==="cupulo"?"brak":"po latencji"],["Czas trwania", variant==="cupulo"?"uporczywy":"< 1 min"],
            ["Męczliwość", variant==="cupulo"?"nie":"tak"],["Kierunek","czysty downbeat (± śladowa torsja)"],["Strona chora","niepewna z oczoplasu"]],
      redflag:"Izolowany downbeat pozycyjny — WYKLUCZ przyczynę ośrodkową (móżdżek, pogranicze czaszkowo-szyjne) przed leczeniem." };
  if(canal==="posterior")
    return variant==="canalo"
      ? { ...est, subtype:"BPPV kanału tylnego — kanalolitiaza",
          crit:[["Latencja","1–kilka s"],["Czas trwania","< 1 min"],["Męczliwość","tak — złóg się rozprasza"],["Kierunek","upbeat + skrętny ku uchu dolnemu"],["Strona chora",`${S} (ucho zależne)`]] }
      : { ...emg, subtype:"BPPV kanału tylnego — kupulolitiaza (atypowa)",
          crit:[["Latencja","brak"],["Czas trwania","uporczywy (> 1 min)"],["Męczliwość","nie"],["Kierunek","upbeat-skrętny, uporczywy"],["Strona chora",S]] };
  // kanał poziomy (roll / bow-lean)
  return variant==="canalo"
    ? { ...est, subtype:"BPPV kanału poziomego — kanalolitiaza (geotropowy)",
        crit:[["Latencja","sekundy"],["Czas trwania","< 1 min"],["Męczliwość","tak"],["Kierunek","geotropowy (ku uchu w dole)"],["Strona chora",`${S} — SILNIEJSZA reakcja`]] }
    : { ...est, subtype:"BPPV kanału poziomego — kupulolitiaza (apogeotropowy)",
        crit:[["Latencja","brak / krótka"],["Czas trwania","uporczywy"],["Męczliwość","nie"],["Kierunek","apogeotropowy (ku uchu w górze)"],["Strona chora",`${S} — SŁABSZA reakcja`]] };
}
const CANAL_OF={epley:"posterior",semont:"posterior",bascule:"posterior",lempert:"horizontal",gufoniGeo:"horizontal",gufoniApo:"horizontal",yacovino:"anterior"};

export { SIDE, otherSide, earToScreen, yawToA, makeManualOrientation, epley, semont, bascule, lempert, yacovino, gufoniGeo, gufoniApo, MANEUVERS, CANALS, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, qFromG, rotYg, BASE_G, LEAN_G, SUPINE_PITCH, supineHeadQ, stepGravity, stepHeadQ, BODY_Q, BODY_NEUTRAL, qFromToVec, headPitchQ, composeHead, SK, SKEL, fkJoints, POSE3D, TORSO_Q, NECK_DEG, bodyClass, bodyJoints, poseSpec, gravArrowFor, sizeRadius, holdMult, sizedSeconds, maneuverTimeline, maneuverSim, featsByVariant, DIAG, variantLabels, recommend, baranyClassify, CANAL_OF };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { makeManualOrientation, epley, semont, bascule, lempert, yacovino, gufoniGeo, gufoniApo, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, qFromG, supineHeadQ, stepGravity, stepHeadQ, qFromToVec, headPitchQ, composeHead, fkJoints, bodyClass, bodyJoints, gravArrowFor, sizedSeconds, maneuverTimeline, maneuverSim, variantLabels, recommend });
