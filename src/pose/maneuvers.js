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
// D11/V18: Zuma e Maia (2016) — manewr uwalniający dla KUPULOLITIAZY kanału POZIOMEGO (postać
// apogeotropowa) BEZ etapu konwersji: szybki dekubit na bok CHORY wytwarza rzut bezwładnościowy
// odrywający złóg od osklepka (ta sama bramka adhezji, którą silnik gra w Bascule), kolejne pozycje
// przenoszą go przez ramię długie do łagiewki. Sonda fizyczna (2026-08-14): czyści kanał we
// WSZYSTKICH trzech uczciwych startach — pipeline restPhi, złóg kupulo-kanałowy (phi0=4°, settled)
// i short-arm (V15); kontrast emergentny: Gufoni apo na starcie kupulo-kanałowym NIE czyści
// (konwersja, phi_end 191.6°) — silnik sam odtwarza rację bytu Zumy. Kroki z ISTNIEJĄCYCH póz
// (zero nowych body); k3 wg ryciny oryginalnej: nos prosto ku sufitowi (rozbieżność źródeł: opis
// wspólnych kroków z Appianim podaje 45° — PMC9220154; fizyka nieczuła, obie wersje czyszczą).
// Kliniczne holdy 3 min — sizedSeconds klamruje kartę do 120 s, instrukcja niesie pełny czas.
function zuma(side){
  const A=side, H=otherSide(side), sideA=A==="L"?"sideL":"sideR", yawH=A==="P"?-90:90;
  return {name:t("Manewr Zuma e Maia","Zuma e Maia maneuver"),canal:"horizontal",side,mechanism:"cupulo",headCamera:"topDownBehind",steps:[   // mechanism:"cupulo" → narracja przylegania (krok 1) i odklejania (krok 2)
    {title:t("Pozycja wyjściowa","Starting position"),body:"sitFront",yaw:0,face:"fwd",seconds:null,progress:0.02,
     instr:t(`Pacjent siedzi na środku kozetki, twarzą do badającego, głowa prosto.`,`The patient sits in the middle of the couch, facing the examiner, head straight.`)},
    {title:t("Szybki dekubit na bok chory","Rapid decubitus onto the affected side"),body:sideA,yaw:0,face:"fwd",seconds:180,progress:0.25,
     instr:t(`SZYBKO połóż pacjenta na bok chory (${sideN(A)}) — rzut bezwładnościowy odrywa złóg od osklepka. Głowa w linii ciała. Utrzymaj ~3 min.`,`QUICKLY lay the patient onto the affected side (${sideN(A)}) — the inertial jolt detaches the debris from the cupula. Head in line with the body. Hold ~3 min.`)},
    {title:t("Obrót głowy nosem ku sufitowi","Turn the head, nose toward the ceiling"),body:sideA,yaw:yawH,face:"fwd",seconds:180,progress:0.45,
     instr:t(`Nie zmieniając ułożenia ciała, obróć głowę tak, aby nos był skierowany prosto ku sufitowi. Utrzymaj ~3 min.`,`Without changing the body position, turn the head so the nose points straight toward the ceiling. Hold ~3 min.`)},
    {title:t("Obrót na plecy, głowa ku zdrowemu","Roll supine, head toward the healthy side"),body:"supineFlat",yaw:yawH,face:"up",seconds:180,progress:0.65,
     instr:t(`Obróć ciało do leżenia na plecach; głowa pozostaje skręcona 90° ku stronie zdrowej (${sideN(H)}). Utrzymaj ~3 min.`,`Roll the body to lie supine; the head stays rotated 90° toward the healthy side (${sideN(H)}). Hold ~3 min.`)},
    {title:t("Lekkie przygięcie głowy","Slight head flexion"),body:"supineFlex",yaw:yawH,face:"up",seconds:180,progress:0.85,
     instr:t(`Unieś lekko głowę (przygięcie ~${HC_TILT_TXT}°, jak do testu Roll), wciąż skręconą ku stronie zdrowej — ułatwia zsyp złogu do łagiewki. Utrzymaj ~3 min.`,`Raise the head slightly (~${HC_TILT_TXT}° flexion, as for the Roll test), still rotated toward the healthy side — this eases the debris descent into the utricle. Hold ~3 min.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sitFront",yaw:0,face:"fwd",seconds:null,progress:1.0,
     instr:t(`Powoli posadź pacjenta i wyprostuj głowę. Po manewrze wykonaj ponowny Roll test. Koniec.`,`Slowly sit the patient up and straighten the head. Afterward repeat the Roll test. End.`)},
  ]};
}
// D11/V18: Kim (CRM, 2012) — pierwszy manewr celowany wprost w kupulolitiazę kanału poziomego.
// GRANICA ŹRÓDŁA: kliniczny protokół zawiera WIBRACJĘ wyrostka sutkowatego jako integralny element
// odrywania złogu — silnik nie ma wejścia wibracyjnego, w modelu czyszczą SAME zmiany pozycji
// (sonda: exited we wszystkich trzech startach). Nota na karcie mówi to wprost — nie wolno uczyć,
// że wibracja jest zbędna. Skuteczność natychmiastowa ~36% (niższa niż Zuma ~56%).
function kim(side){
  const A=side, H=otherSide(side), sideA=A==="L"?"sideL":"sideR", sideH=H==="L"?"sideL":"sideR", yawD=A==="P"?45:-45;
  return {name:t("Manewr Kima (CRM)","Kim maneuver (CRM)"),canal:"horizontal",side,mechanism:"cupulo",headCamera:"topDownBehind",steps:[
    {title:t("Leżenie na plecach","Lying supine"),body:"supineFlat",yaw:0,face:"up",seconds:120,progress:0.05,
     instr:t(`Pacjent leży na plecach, głowa w linii ciała, twarz ku sufitowi. Utrzymaj ~2 min.`,`The patient lies supine, head in line with the body, face toward the ceiling. Hold ~2 min.`)},
    {title:t("Na bok chory, nos 45° ku podłodze","Onto the affected side, nose 45° toward the floor"),body:sideA,yaw:yawD,face:"fwd",seconds:120,progress:0.28,
     instr:t(`Obróć pacjenta na bok chory (${sideN(A)}) i skręć głowę tak, aby nos był 45° ku podłodze. Tu protokół stosuje WIBRACJĘ wyrostka sutkowatego (~30 s) — odrywa złóg od osklepka; model jej nie liczy (granica modelu). Utrzymaj ~2 min.`,`Turn the patient onto the affected side (${sideN(A)}) and rotate the head so the nose points 45° toward the floor. Here the protocol applies MASTOID VIBRATION (~30 s) — it detaches the debris from the cupula; the model does not compute it (a model boundary). Hold ~2 min.`)},
    {title:t("Nos wraca do poziomu","Nose back to horizontal"),body:sideA,yaw:0,face:"fwd",seconds:120,progress:0.45,
     instr:t(`Nie zmieniając ułożenia ciała, wróć głową do linii ciała (nos poziomo). Utrzymaj ~2 min.`,`Without changing the body position, return the head to the body line (nose horizontal). Hold ~2 min.`)},
    {title:t("Na plecy, twarz ku sufitowi","Supine, face toward the ceiling"),body:"supineFlat",yaw:0,face:"up",seconds:120,progress:0.62,
     instr:t(`Obróć pacjenta na plecy, twarz ku sufitowi. Utrzymaj ~2 min.`,`Roll the patient supine, face toward the ceiling. Hold ~2 min.`)},
    {title:t("Na bok zdrowy","Onto the healthy side"),body:sideH,yaw:0,face:"fwd",seconds:120,progress:0.78,
     instr:t(`Obróć pacjenta na bok zdrowy (${sideN(H)}), głowa w linii ciała. Utrzymaj ~2 min.`,`Turn the patient onto the healthy side (${sideN(H)}), head in line with the body. Hold ~2 min.`)},
    {title:t("Na brzuch, nos w dół","Prone, nose down"),body:"prone",yaw:0,face:"down",seconds:120,progress:0.92,
     instr:t(`Kontynuuj obrót na brzuch — nos ku podłodze. Utrzymaj ~2 min.`,`Continue the roll to prone — nose toward the floor. Hold ~2 min.`)},
    {title:t("Powrót do siadu","Return to sitting"),body:"sit",yaw:0,face:"fwd",seconds:null,progress:1.0,
     instr:t(`Powoli posadź pacjenta. Po manewrze wykonaj ponowny Roll test. Koniec.`,`Slowly sit the patient up. Afterward repeat the Roll test. End.`)},
  ]};
}
const MANEUVERS={
  epley:{label:"Epley", get desc(){return t("kanał tylny","posterior canal");}, gen:epley},
  semont:{label:"Semont", get desc(){return t("kanał tylny","posterior canal");}, gen:semont},
  bascule:{label:"Bascule", get desc(){return t("kupulolitiaza (k. tylny)","cupulolithiasis (post. canal)");}, gen:bascule},
  lempert:{label:"Lempert (BBQ)", get desc(){return t("kanał poziomy","horizontal canal");}, gen:lempert},
  gufoniGeo:{get label(){return t("Gufoni (Appiani, geotropowy)","Gufoni (Appiani, geotropic)");}, get desc(){return t("kanał poziomy","horizontal canal");}, gen:gufoniGeo},   // D11: eponim Appiani (2001 geo / 2005 apo); nazwy GENERATORÓW nietknięte (pin pose + nagłówki guide)
  gufoniApo:{get label(){return t("Gufoni (Appiani, apogeotropowy)","Gufoni (Appiani, apogeotropic)");}, get desc(){return t("kanał poziomy","horizontal canal");}, gen:gufoniApo},
  yacovino:{label:"Yacovino", get desc(){return t("kanał przedni","anterior canal");}, gen:yacovino},
  zuma:{label:"Zuma e Maia", get desc(){return t("kupulolitiaza (k. poziomy)","cupulolithiasis (horiz. canal)");}, gen:zuma},
  kim:{label:"Kim (CRM)", get desc(){return t("kupulolitiaza (k. poziomy)","cupulolithiasis (horiz. canal)");}, gen:kim},
};
const CANALS={
  posterior:{get label(){return t("Kanał tylny","Posterior canal");}, get note(){return t("najczęstszy (~85%)","most common (~85%)");}, color:"var(--post)",maneuvers:["epley","semont","bascule"]},
  horizontal:{get label(){return t("Kanał poziomy","Horizontal canal");}, note:"~10%", color:"var(--horiz)",maneuvers:["lempert","gufoniGeo","gufoniApo","zuma","kim"]},
  anterior:{get label(){return t("Kanał przedni","Anterior canal");}, get note(){return t("rzadki (~1–2%)","rare (~1–2%)");}, color:"var(--ant)",maneuvers:["yacovino"]},
};

/* ============ D7/V21: EGZAMIN — losowy pacjent ważony epidemiologią ============
   PRIORS formalizuje etykiety, które CANALS nosi jako napisy („~85%” / „~10%” / „~1–2%”).
   WARTOŚCI DO DECYZJI KLINICZNEJ (granica źródła): epidemiologia PRZYJĘTA, nie zmierzona przez model —
   łączne p wierszy dobrane tak, by marginesy zgadzały się z etykietami aplikacji i pasmami spec D7
   [AAO-HNS 2017 (H27): PC 85–95% przypadków; HC 5–15% (geo:apo ~2:1 w seriach); AC 1–3%;
   wielokanałowe 5–20% (spec D7 pinuje 5–10%); obustronne 1–8% (spec 1–2%, asocjacja z urazem głowy)].
   Marginesy tej tabeli: PC-jakikolwiek 0,875 ✓ · HC mono 0,105 ✓ · AC 0,02 ✓ · multi 0,075 ✓ · bilat 0,02 ✓.
   POZA pulą V21 (granice modelu, nie epidemiologia): pacjent zdrowy (ujemny test nie wyklucza BPPV —
   fałszywy odruch), light/short (null point i samoleczenie per faza — kandydat na rozszerzenie),
   jam (poza osią mechanizmu), AC-cupulo (cel statyczny ~0,05 — ekran nierozstrzygalny), pary
   kontralateralne i mieszanki persistent+transient (język karty rósłby nieproporcjonalnie do p).
   Strona 50/50 (piśmiennictwo raportuje przewagę prawego ucha ~1,4:1 — von Brevern 2007; do decyzji).
   Suma p = 1,000 — pilnowana TWARDYM throwem w wyroczni (engine.exam), ŚWIADOMIE nie przy imporcie
   (literówka w tabeli ubijałaby boot PWA zamiast oblać CI). */
const PRIORS=[
  {key:"pcCanalo",  p:0.73,  get label(){return t("BPPV kanału tylnego — kanalolitiaza","Posterior-canal BPPV — canalithiasis");},
    mk:s=>[{canal:"posterior", side:s, variant:"canalo", mech:null}]},
  {key:"pcCupulo",  p:0.05,  get label(){return t("BPPV kanału tylnego — kupulolitiaza","Posterior-canal BPPV — cupulolithiasis");},
    mk:s=>[{canal:"posterior", side:s, variant:"cupulo", mech:null}]},
  {key:"hcGeo",     p:0.07,  get label(){return t("BPPV kanału poziomego — geotropowy (kanalolitiaza)","Horizontal-canal BPPV — geotropic (canalithiasis)");},
    mk:s=>[{canal:"horizontal", side:s, variant:"canalo", mech:null}]},
  {key:"hcApo",     p:0.035, get label(){return t("BPPV kanału poziomego — apogeotropowy (kupulolitiaza)","Horizontal-canal BPPV — apogeotropic (cupulolithiasis)");},
    mk:s=>[{canal:"horizontal", side:s, variant:"cupulo", mech:null}]},
  {key:"acCanalo",  p:0.02,  get label(){return t("BPPV kanału przedniego — kanalolitiaza","Anterior-canal BPPV — canalithiasis");},
    mk:s=>[{canal:"anterior", side:s, variant:"canalo", mech:null}]},
  {key:"multiPcHc", p:0.075, get label(){return t("BPPV wielokanałowe — PC+HC ipsilateralne (oba kanalolitiaza)","Multicanal BPPV — ipsilateral PC+HC (both canalithiasis)");},
    mk:s=>[{canal:"posterior", side:s, variant:"canalo", mech:null},{canal:"horizontal", side:s, variant:"canalo", mech:null}]},
  {key:"bilatPc",   p:0.02,  get label(){return t("BPPV obustronne — kanał tylny P + L (kanalolitiaza)","Bilateral BPPV — posterior canal R + L (canalithiasis)");},
    mk:()=>[{canal:"posterior", side:"P", variant:"canalo", mech:null},{canal:"posterior", side:"L", variant:"canalo", mech:null}]},
];
// mulberry32 — deterministyczny PRNG (4 linie, bez zależności). JEDYNE źródło losowości egzaminu;
// Math.random/Date.now ZAKAZANE w tym module (wyrocznia z jawnym ziarnem — entropia wolno żyć tylko
// w gałęzi UI actions.js, precedens hintsRandomPatient).
function mulberry32(seed){ let a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; let z=a;
  z=Math.imul(z^(z>>>15), z|1); z^=z+Math.imul(z^(z>>>7), z|61); return ((z^(z>>>14))>>>0)/4294967296; }; }
// KOLEJNOŚĆ LOSOWAŃ = KONTRAKT GOLDEN (piny engine.exam pacjentów zamrażają wynik per ziarno):
// r1 = wiersz PRIORS (ważony p) → r2 = strona (50/50; wiersz bilatPc strony nie czyta — ma obie).
function randomPatient(rng){
  const r1=rng(), r2=rng();
  let acc=0, row=PRIORS[PRIORS.length-1];
  for(const w of PRIORS){ acc+=w.p; if(r1<acc){ row=w; break; } }
  const side = r2<0.5 ? "P" : "L";
  return { row: row.key, p: row.p, lesions: row.mk(side) };
}

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
  //   „light" (D3/V12): waga LIGHT_W + persistent (trwały GEOTROPOWY) — pełna obsługa w tym samym kroku
  //   co furtka w position(), żeby nie było pół-obsługi (waga 1/persistent:false po cichu).
  const cupWeak = variant==="cupulo" ? Vestibular.CUP_WEAK : variant==="light" ? Vestibular.LIGHT_W : 1;
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
    persistent: variant==="cupulo" || variant==="light",
    canal, side, q,                 // do dynamiki ξ(t): diagnostyka używa realnej pozycji
    anat: {h:r.h, v:r.v, t:r.t},    // anatomiczne składowe (±1) do animacji dialu (widok z tyłu)
    mag: r.mag                      // surowa magnituda rzutu (D3: mini-karta null point liczy z niej cel)
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
/* V24: JEDNA prawda pozy prowokacji — kanał → {body, face, yaw(strona)}: kwaternion ORAZ kark
   czytane z tego samego wiersza (dawny provokeQ czytał te same pozy literalnie — refaktor
   bit-tożsamy; było: własne qSupineYaw ignorujące pochylenie z opisu — Roll liczony przy 10°
   WYPROSTU zamiast opisanych 30° ZGIĘCIA). */
const PROVOKE_POSE={
  horizontal:{body:"supineFlex",     face:"up", yaw:s=>s==="P"? 90:-90},
  anterior:  {body:"supineDeepHang", face:"up", yaw:()=>0},
  posterior: {body:"supineHang",     face:"up", yaw:s=>s==="P"? 45:-45},   // tylny (Dix-Hallpike)
};
function provokeQ(canal, side){ const P=PROVOKE_POSE[canal]||PROVOKE_POSE.posterior; return stepHeadQ(P.body, P.yaw(side), P.face); }
// V24 (okablowanie B8 w diagnostyce): kąt karku pozy (ν=pitch−trunk, y=yaw+dyaw) — ten sam wzór
// co stepNeck toru manewrowego; nośnik ramienia bezwładności armVec dla segmentów pivot:"body".
function poseNeck(body, yaw, face){ const s=poseOf(body, face); return { p: s.pitch - s.trunk, y: yaw + s.dyaw }; }
function provokeNeck(canal, side){ const P=PROVOKE_POSE[canal]||PROVOKE_POSE.posterior; return poseNeck(P.body, P.yaw(side), P.face); }
// V24: PREFIKS INTERPOLACYJNY — segment 0-sekundowy (0 próbek) ustawiający qPrev/nPrev na siad
// [0,0], żeby PIERWSZY realny segment interpolował kark 0→ν TĄ SAMĄ u co slerp pozy (rozszerzenie
// zasady R7, którą silnik realizuje między segmentami). Konwencja WYBRANA zamiast const (wartości
// własne przez całe tTrans = fantomowo pre-zgięty kark) bo ZACHOWUJE inwariant B7: sklejenie aktów
// w jedną timeline ≡ łańcuch bit-w-bit (prefiks resetuje nPrev w obu układach identycznie —
// dowód sondą P3; const łamałby B7 przez nPrev z SIT_SEG). Prefiks bez pól karku = bit-0.
const NECK_PREFIX=Object.freeze({q:[1,0,0,0], tTrans:0, tHold:0, pivot:"body"});
// przebieg ξ(t) z silnika: kanalolitiaza = PRZEJŚCIOWY (wygasa, cząstka wychodzi, NIE wraca);
// kupulolitiaza = uporczywy (trzyma się, dopóki pozycja utrzymana).
// OKNO OBSERWACJI (tHold) — to ONO, przez xiEnvelope→tEnd, ustala jak długo gra animacja oczopląsu.
//   Kupulolitiaza NIE wygasa, więc jej tEnd = całe okno; kanalolitiaza wygasa sama w ~30–40 s. Okno 18 s dla
//   postaci uporczywej dawało tEnd 18,5 s przeciw 29,8–39,8 s dla przejściowej, czyli oczopląs „uporczywy"
//   zatrzymywał się PIERWSZY — dokładne odwrócenie cechy różnicującej, której uczy ta sama karta
//   („Uporczywy > 60 s" vs „Przemijający < 60 s"). Okno 60 s = próg kliniczny 1 min z kryteriów Bárány.
function engineXi(canal, side, persistent, q, init, mech, neck){
  // pivot:"body" — badany jest KŁADZIONY z siadu (rusza całe ciało), a nie sam obraca głowę.
  // Okno PRZEDNIEGO 70 s (ocena II, A6/V8): napad AC trwa w silniku ~61 s (szczyt dopiero ~25 s) —
  // wspólne okno 40 s ucinało animację przy 36% szczytu, w pół napadu. Zmienia wyłącznie tEnd animacji
  // diagnostyki (manewrów nie zasila — tam manStepEnv).
  // ZNANA ASYMETRIA tego rozwidlenia (świadomie tolerowana; werdykt sondy 2026-08-14): tEnd kanalo-AC
  // 60,95 s (V24, z karkiem) > kupulo-AC 60,50 s (pełne okno) o 0,45 s — poniżej percepcji (tEnd steruje wyłącznie ruchem
  // tęczówek, bez napisu z sekundami; warianty na przeciwnych stronach flip-karty; peak kupulo-AC 0,142).
  // NIE „naprawiać" oknem kupulo 60→70 s: łamałoby kotwicę „60 s = próg 1 min Bárány" (wyżej), a chipy AC
  // celowo uczą, że czas trwania NIE różnicuje dla przedniego („Przemijający ≈1 min"). Sam napad ~61 s to
  // emergentna fizyka, zgodna z kliniką pDBN — werdykt i liczby: engine_doc „STAŁE SKALIBROWANE".
  // V24: kark toru diagnostycznego — q==null (kanoniczna prowokacja) dostaje kark z PROVOKE_POSE;
  // jawne q dostaje kark TYLKO gdy wołający go poda (parametr neck) — egzamin V21 i fallback guide
  // ŚWIADOMIE bez karku (granice nazwane w doc; kandydat V25). Kupulo/light: simCupStatic bez
  // specForce = na kark ODPORNE z konstrukcji — stara timeline bez zmian.
  const nv = q==null ? provokeNeck(canal, side) : (neck||null);
  const seg={q: q||provokeQ(canal,side), tTrans:0.5, tHold: persistent?60:(canal==="anterior"?70:40), pivot:"body"};
  const timeline = (!persistent && nv) ? [NECK_PREFIX, {...seg, neckPitch:nv.p, neckYaw:nv.y}] : [seg];
  // q0 = POZYCJA WYJŚCIOWA (siad): bez niej pierwszy segment interpolował „z samego siebie", czyli test
  // zaczynał się już W pozycji prowokującej — złóg nie dostawał przejścia, które go w ogóle rusza.
  const q0=[1,0,0,0];
  // init {phi0, settled} (ocena II, V5): warunki początkowe scenariusza historii pozycyjnej (Bow & Lean) —
  // obwiednia animacji liczy się z TEGO SAMEGO stanu, z którego karta wzięła kierunek. Kupulolitiaza bez
  // wpływu (brak cząstki). Brak init = dokładnie dotychczasowa ścieżka.
  // mech (D4/V16, opcjonalny ogonowy): "light" → fasada lekkiego osklepka (ten sam tor persistent);
  // "short" płynie przez init.arm niżej. Brak parametru = dokładnie dotychczasowa ścieżka (bit-w-bit).
  return persistent
    ? (mech==="light" ? Vestibular.simulateLightCupula({canal, side, timeline, q0})
                      : Vestibular.simulateCupulolith({canal, side, timeline, q0}))
    // spread WARUNKOWY per pole (D1/V10): BLT (V5) podaje tylko {phi0,settled} → wywołanie bit-identyczne;
    // sesja dodaje bond0/xi0/rep tym samym szwem — obwiednia animacji liczy się z TEGO SAMEGO stanu co karta.
    // D4/V16: init.arm ("short") tym samym szwem — pole nieobecne = stare wywołanie bit-w-bit.
    : Vestibular.simulateCanalith({canal, side, timeline, q0, ...(init ? {phi0:init.phi0, settled:init.settled,
        ...(init.bond0!=null?{bond0:init.bond0}:{}), ...(init.xi0!=null?{xi0:init.xi0}:{}), ...(init.rep!=null?{rep:init.rep}:{}),
        ...(init.arm?{arm:init.arm}:{})} : {})});
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

/* ============ D8/V22: demo pacjenta t-EVS na ekranie HINTS ============
   JEDNA nić symulacji dla całego demo (wykres SPV i oczy grają z tego samego sim):
   spoczynek (TEVS_REST s siadu — cisza EMERGENTNA z restPhi+adhezji, nie z „if”; twardy throw
   1e-9 w wyroczni) → prowokacja Dix (okno 40 s i tTrans 0,5 IDENTYCZNE z engineXi — część po
   prefiksie jest czystą translacją czasową, pilnowaną throwem translacyjnym) → SIT_SEG
   (siadanie = DRUGA prowokacja: transjent ODWRÓCONY, podpisany na wykresie, nie przemilczany;
   ogon podprogowy ~1,8 °/s — pin, świadomie BEZ throwa „cisza wraca”, margines 0,18 °/s byłby
   zapieczoną kruchością). Demo twardo zamknięte na PC-P canalo (postać uporczywa nie wygasa
   i psułaby lekcję ciszy); CELOWO bez phi0/init (strefa artefaktu A2 nietknięta; ewentualne
   spotkanie z sesją V19 wyłącznie przez szwy actTimeline). */
const TEVS_REST = 8;   // s spoczynku przed prowokacją (nazwany wybór demonstracyjny, pasmo sensowne 5–10 s)
let _tevsSim = null;
function tevsDemoSim(){
  // V24: prowokacja demo OKABLOWANA identycznie z kanoniczną (kark z PROVOKE_POSE) — inaczej throw
  // translacyjny wyroczni GRACE słusznie pęka (demo grałoby latencję 2,25 przy kanonicznej 2,35).
  // Segment spoczynku niesie jawne neck 0 (ustawia nPrev [0,0] → interp 0→ν jak NECK_PREFIX).
  if(!_tevsSim){ const nv=provokeNeck("posterior","P");
    _tevsSim = Vestibular.simulateCanalith({canal:"posterior", side:"P", q0:[1,0,0,0],
      timeline:[{q:[1,0,0,0], tTrans:0, tHold:TEVS_REST, pivot:"body", neckPitch:0, neckYaw:0},
                {q:provokeQ("posterior","P"), tTrans:0.5, tHold:40, pivot:"body", neckPitch:nv.p, neckYaw:nv.y}, SIT_SEG]}); }
  return _tevsSim;
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
       [V25: sama liczba „30°" też nie przetrwała — poza bierze dziś zgięcie z NACHYLENIA kanału
        (HC_TILT_DEG); zapis powyżej opisuje naprawę ZNAKU i rzędu wielkości z 2026-08-05, nie kąt];
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
/* ===== V25: ZGIĘCIE POZYCJI TESTU ROLL — WYPROWADZONE Z ATLASU, NIE WPISANE Z PODRĘCZNIKA =====
   Klinika mówi „na plecach, głowa zgięta ~20–30°" i uzasadnia to CELEM GEOMETRYCZNYM: uniesienie ma
   ustawić kanał boczny tak, żeby grawitacja leżała W JEGO PŁASZCZYŹNIE. Cel jest spełniony dokładnie
   wtedy, gdy zgięcie RÓWNA SIĘ nachyleniu kanału — a nachylenie nie jest w tym silniku założeniem,
   tylko WIELKOŚCIĄ ZMIERZONĄ: wychodzi wprost z normalnej kanału (atlas IE-Map, ta sama rekonstrukcja,
   z której płynie cała fizyka łuku). Kanoniczne „30°" NIE jest pomiarem wydajności testu — to liczba
   przeniesiona z konwencji kalorycznej, zawyżająca anatomię o ~20° (R3-PRZEMIERZENIE 30°, punkty b–f;
   pomiary porównawcze [H29] 19.9°, Wu 17.4°). Dlatego poza bierze kąt STĄD, a nie z podręcznika.
   DWIE LICZBY, NIE JEDNA (korekta po krytyce geometrycznej — pierwsza wersja myliła je ze sobą):
     HC_TILT_DEG = acos(|n_y|/|n|) = 10.4398° — PEŁNE (dwuścienne) nachylenie płaszczyzny kanału.
       To wielkość PORÓWNYWALNA Z PIŚMIENNICTWEM: Della Santina [H29] mierzy dokładnie ją (kąt
       normalnej do osi Z Reida) = 19.9°, Wu 2021 = 17.4°. Służy WYŁĄCZNIE do porównań w tekstach.
     HC_FLEX_DEG = atan2(|n_z|,|n_y|) = 10.2955° — ZGIĘCIE STRZAŁKOWE, przy którym grawitacja
       naprawdę kładzie się w płaszczyźnie kanału. Zgięcie karku jest obrotem wokół osi MIĘDZYUSZNEJ,
       więc „przekręca" tylko składowe (y,z) normalnej; składowa x (−0.0304 — lekkie pochylenie
       płaszczyzny kanału w płaszczyźnie CZOŁOWEJ) jest dla niego NIEOSIĄGALNA. Dlatego pozę ustawia
       ta liczba, a nie nachylenie: przy niej |g| w płaszczyźnie kanału = 1.000000 DOKŁADNIE
       (przy 10.4398° byłoby 0.999997, przy 30° — 0.9415).
   Obie są WYPROWADZONE z jednej normalnej atlasu, żadna nie jest wynikiem optymalizatora (w kodzie
   nie ma optymalizatora); różnią się o 0.14°, więc klinicznie to ta sama instrukcja „~10°".
   Strona bez znaczenia — normalne P/L są lustrzane, oba kąty identyczne co do cyfry. */
const _HCN = Vestibular.CANAL_NORMALS.horizontal.P;
const HC_TILT_DEG = Math.acos(Math.abs(_HCN[1])/Math.hypot(_HCN[0],_HCN[1],_HCN[2])) * 180/Math.PI;  // 10.4398° — do porównań z [H29]
const HC_FLEX_DEG = Math.atan2(Math.abs(_HCN[2]), Math.abs(_HCN[1])) * 180/Math.PI;                  // 10.2955° — TO ustawia pozę
const HC_TILT_TXT = HC_FLEX_DEG.toFixed(0);                    // „10" — jedna liczba dla WSZYSTKICH instrukcji klinicznych
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
  "supineFlex|up": {roll:0,   trunk:-90, pitch:-90+HC_FLEX_DEG, dyaw:0},   // Roll test: zgięcie realizujące „kanał pionowo" (HC_FLEX_DEG); do V24 wpisane „~30°"
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
// B8 (ocena II, V14b): kąt KARKU kroku z TEJ SAMEJ tabeli pozy co stepPivot (jedno źródło rozkładu
// headQ = torso ∘ kark) — ν = pitch − trunk (jak bodyJoints), Y = yaw + dyaw. Zasila ramię
// bezwładności armVec w silniku (segment.neckPitch/neckYaw). Diagnostyka OKABLOWANA w V24 (poseNeck
// + NECK_PREFIX na segmentach pivot:"body"; STAŁE SKALIBROWANE przemierzone — Dix 2.35, Roll 2.30, AC 0.45 s).
function stepNeck(st){ const s=poseOf(st.body, st.face); return { p: s.pitch - s.trunk, y: st.yaw + s.dyaw }; }
function timelineWithHold(plan, h, u=UNTIMED_STEPS[0]){
  return plan.steps.map((st,i)=>{ const n=stepNeck(st);
    return { q: stepHeadQ(st.body, st.yaw, st.face), tTrans:0.8,
      pivot: stepPivot(plan.steps[i-1], st), neckPitch:n.p, neckYaw:n.y,
      tHold: st.seconds!=null ? h : u }; });
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
  return plan.steps.map((st,i)=>{ const n=stepNeck(st);                   // B8: kark do ramienia bezwładności — OBA tory (derivedHold liczy timelineWithHold z tą samą fizyką)
    return {
      q: stepHeadQ(st.body, st.yaw, st.face),
      tTrans: 0.8,
      pivot: stepPivot(plan.steps[i-1], st),                              // oś obrotu → ramię bezwładności (R7)
      neckPitch: n.p, neckYaw: n.y,
      tHold: st.seconds==null ? (dh ? dh.u : UNTIMED_STEPS[0])
                              : (dh ? dh.h : st.seconds)                  // fallback: hold zalecony klinicznie
    }; });
}
// pełna symulacja manewru → φ(t) cząstki w kanale (dynamika repozycji)
function maneuverSim(plan, size="medium"){
  return Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, timeline:maneuverTimeline(plan,size), size});
}
/* ============ D9/V20: ENSEMBLE — chmura N niezależnych symulacji (BEZ FIZYKI) ============
   Orkiestracja NAD silnikiem: N cząstek o promieniach z JAWNEJ siatki kwantylowej, każda gra
   TĘ SAMĄ kanoniczną timeline (klinicysta wykonuje JEDEN manewr — re-derywacja holdów per cząstka
   dałaby każdej własny protokół i ominęła całą treść częściowej repozycji). GRANICA ŹRÓDŁA:
   rozkład rozmiarów agregatu in vivo NIEZMIERZONY (patrz engine_doc przy H2) — pasmo jednostajne
   [0.7,1.3]·r_size to deklaracja niewiedzy, nie pomiar (NIE kalibrować do danych, których nie ma).
   Siatka = kwantyle ŚRODKOWE rozkładu jednostajnego (m_k = 0.7+0.6·(k+0.5)/N): zbiega do całki po
   rozkładzie (szczyt agregatu 1.0071/1.0085/1.0091 dla N=7/9/13 — sonda projektu; siatka z krańcami
   przeważa ekstrema i dryfuje z N: 1.061→1.035), a środek siatki (k=4, N=9) = DOKŁADNIE 1.0 →
   środkowa cząstka jest BIT-RÓWNA kanonicznej maneuverSim (twarda wyrocznia chmury: karta nie może
   rozjechać się z tym, co grają oczy). Kotwica oceny „1.085" zidentyfikowana jako artefakt grubej
   siatki N=5 z krańcami (odtworzone 1.0865) — teza jakościowa (dyspersja przesuwa i podnosi szczyt)
   stoi, liczby docelowej NIE MA. AGREGACJA = ŚREDNIA arytmetyczna ξ po cząstkach: silnik JUŻ skaluje
   gain∝r³ wewnątrz simulateCanalith — jawna dodatkowa waga r³ liczyłaby masę DWA RAZY (zmierzone
   1.353, poza kalibracją CUP_WEAK/SPV) i jest ZAKAZANA. Chmura jest WYŁĄCZNIE widokiem: derivedHold/
   timery/manExitStep/sesja/symptomy czytają dalej kanoniczną pojedynczą symulację. Osie rozdzielne:
   rep NIE wchodzi (rep₂/rep₀ = fatigueFactor(2) co do 6 cyfr identycznie dla pojedynczej i chmury —
   ensemble NIE zastępuje męczliwości; osobna decyzja kalibracyjna). */
const ENS_BAND=[0.7,1.3], ENS_N=9;
const ENS_GRID=Array.from({length:ENS_N},(_,k)=> ENS_BAND[0] + (ENS_BAND[1]-ENS_BAND[0])*(k+0.5)/ENS_N);
function ensembleSim(plan, size="medium"){
  const tl=maneuverTimeline(plan, size), r0=Vestibular.sizeR(size);
  const parts=ENS_GRID.map(m=>{
    const sim=Vestibular.simulateCanalith({canal:plan.canal, side:plan.side, timeline:tl, size:m*r0});
    let tExit=null; for(const s of sim){ if(s.exited){ tExit=s.t; break; } }
    return {m, sim, exited:sim.final.exited, inCrus:!!sim.final.inCrus, tExit};
  });
  const n=Math.min(...parts.map(p=>p.sim.length));
  let meanPeak=0, tPeak=0;
  for(let i=0;i<n;i++){ let s=0; for(const p of parts) s+=p.sim[i].xi; s/=parts.length;
    if(Math.abs(s)>Math.abs(meanPeak)){ meanPeak=s; tPeak=parts[0].sim[i].t; } }
  const exitedN=parts.filter(p=>p.exited).length;
  const mass=parts.reduce((a,p)=>a+p.m*p.m*p.m,0);
  const fracMass=parts.reduce((a,p)=>a+(p.exited?p.m*p.m*p.m:0),0)/mass;   // frakcja MASY (r³) — inna wielkość niż waga sygnału (ta jest w silniku)
  return {parts, M:parts.length, exitedN, fracN:exitedN/parts.length, fracMass, meanPeak, tPeak};
}
// v: "canalo" (kanalolitiaza / geotropowy) | "cupulo" (kupulolitiaza / apogeotropowy)
// CHIPY PER KANAŁ (ocena II, A6/V8): kanał PRZEDNI ma w silniku WYPROWADZONY brak latencji (R7: złóg
// startuje dociśnięty do osklepka, 0.45–0.5 s = sam czas przejścia) i napad ~61 s — wspólne chipy
// „Latencja 1–5 s"/„<60 s" przeczyły własnej fizyce (i klinice AC-BPPV: latencja krótka/nieobecna).
const featsByVariant = (v, canal, mech) => {
  // D4/V16: opcjonalny ogonowy mech — brak parametru albo mechanizm klasyczny = dokładnie dawne wiersze.
  const m = mech==null ? v : mech;
  if(m==="light") return [t("Bez latencji","No latency"),t("Geotropowy TRWAŁY (>1 min)","PERSISTENT geotropic (>1 min)"),t("Nie wyczerpuje się","Does not fatigue"),t("Null point ku uchu choremu","Null point toward the affected ear")];
  if(m==="short") return [t("Latencja krótka","Short latency"),t("Apogeotropowy PRZEMIJAJĄCY","TRANSIENT apogeotropic"),t("Wyczerpuje się","Fatigues"),t("Roll może oczyścić ramię","The Roll may clear the arm")];
  return v==="canalo"
  ? (canal==="anterior"
      ? [t("Latencja krótka/nieobecna","Short/absent latency"),t("Przemijający (≈1 min)","Transient (≈1 min)"),t("Wyczerpuje się","Fatigues")]
      : [t("Latencja 1–5 s","Latency 1–5 s"),t("Przemijający (<60 s)","Transient (<60 s)"),t("Wyczerpuje się","Fatigues")])
  : [t("Bez latencji","No latency"),t("Uporczywy (>60 s)","Persistent (>60 s)"),t("Nie wyczerpuje się","Does not fatigue")];
};

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
  const timeline=[NECK_PREFIX, ...sc.steps(side).map(st=>{ const n=poseNeck(st.body, st.yaw, st.face);   // V24: kark historii pozycyjnej (pivot body)
    return {q:stepHeadQ(st.body, st.yaw, st.face), tTrans:0.8, tHold:st.hold, pivot:"body", neckPitch:n.p, neckYaw:n.y}; })];
  const sim=Vestibular.simulateCanalith({canal:"horizontal", side, q0:[1,0,0,0], timeline});
  const out={phi0: sim.final.exited?null:sim.final.phi, settled:sc.settled, exitedInHistory:sim.final.exited};
  _bltMemo.set(k,out); return out;
}
// TEST jako JEDNA oś czasu (skłon→siad→odchylenie) — tak test jest wykonywany, a wykonany skłon
// masywnie przemieszcza złóg (w sekwencji odpowiedź lean bywa 2× silniejsza niż w izolacji).
function bltPhases(side, scen, mech){
  // D4/V16, mech="short": ramię bańkowe NIE MA spoczynku (siad je czyści ≤2 min — sonda D4), więc
  // historia pozycyjna nie ustala φ₀ — sekwencja gra ZAWSZE świeży depozyt (SHORT_PHI0), scenariusz
  // ignorowany świadomie (selektor ukryty w UI z jawnym banerem). Ta sama oś czasu co canalo.
  const k="ph#"+side+"#"+(mech==="short"?"short":scen); if(_bltMemo.has(k)) return _bltMemo.get(k);
  const init = mech==="short" ? {phi0:SHORT_PHI0, settled:false, exitedInHistory:false} : bltInit(side, scen);
  const out={init, bow:{xi:0, exited:false}, lean:{xi:0}, exited:init.exitedInHistory};
  if(!init.exitedInHistory){
    const qSit=[1,0,0,0], qBow=stepHeadQ("sit",0,"down"), qLean=stepHeadQ("sit",0,"up");
    // V24/T3: segmenty pivot:"neck" ŚWIADOMIE BEZ pól karku — armVec dla pivotu karkowego wraca
    // wcześnie (ramię kark→błędnik sztywne), a pola żywiłyby jedynie nPrev NASTĘPNEGO segmentu
    // body; pomiar krytyka: taki handoff to artefakt zadeklarowanego pivotu (przy pivot-poprawnym
    // "neck" pola są bez znaczenia) — kandydat V25: pivot ze stepPivot, jedna spójna decyzja.
    const segs=[{q:qBow,tTrans:0.8,tHold:30,pivot:"neck"},{q:qSit,tTrans:0.8,tHold:5,pivot:"neck"},{q:qLean,tTrans:0.8,tHold:30,pivot:"neck"}];
    const sim = mech==="short"
      ? Vestibular.simulateShortArm({canal:"horizontal", side, q0:qSit, phi0:SHORT_PHI0, settled:false, timeline:segs})
      : Vestibular.simulateCanalith({canal:"horizontal", side, q0:qSit, phi0:init.phi0, settled:init.settled, timeline:segs});
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

/* ============ Lying-down / sitting-up (ocena II, V11/D2) ============
   Test położeniowy kanału poziomego: siad → leżenie (supineFlex, poza testu Roll) → siad. Fizyka
   (pomiary 2026-08-14): leżenie przesuwa równowagę HC ledwie o ~9° DOampułkowo (siad 199.8° →
   supineFlex 190.35°; do V24: 191.0° przy zgięciu 30°) — cała karta z tego wynika. KANALO: oczopląs POŁOŻENIA ku ZDROWEJ dla φ₀<190°
   (reguła geotropowa EMERGENTNA — Han 2006, Koo 2006: LDN kontralezjonalny w geo), ku CHOREJ dla
   φ₀>190° (wynik „mylący" GT− ~7% serii Califano 2026 — odczyt położenia wyjściowego złogu);
   SIADANIE zawsze podprogowe (−0.028, złóg wraca 190→200° ODampułkowo) — kliniczna reguła siadania
   (geo→ku chorej) to wyprowadzenie mechaniczne BEZ własnych serii (luka nazwana na karcie). Spoczynek
   z pełną adhezją: napęd 0.025 ≤ fStat → test NIEMY („model nie rozstrzyga", spójnie z E; klinicznie
   LDN nieobecny u 32–62%). LDT NIGDY nie usuwa złogu (żadne φ₀ 5–265°; leżenie i siadanie przyciągają
   ku 190–200°, nigdy ku ujściu 267°) — twardy kontrast ze skłonem B&L. Po LDT złóg ląduje w strefie
   podprogowej 195–196° dla WSZYSTKICH presetów — kolejność testów ma fizyczne znaczenie (R10).
   KUPULO (V4, cel przy osklepku): leżenie +0.057 ku CHOREJ (uporczywy; null point yaw ~7.5° ku chorej
   — klinicznie 10–30°), pseudo-SN w siadzie +0.024 ku chorej (Asprella 2008: apo→ipsilezjonalnie);
   model NIE odtwarza odwrócenia przy siadaniu (null pitch +23.6° zgięcia ≈ kliniczny HPT ~30°). */
function ldtPhases(side, scen, mech){
  // D4/V16, mech="short": jak w bltPhases — świeży depozyt (SHORT_PHI0), scenariusz ignorowany (brak spoczynku).
  const k="ldt#"+side+"#"+(mech==="short"?"short":(scen||"textbook")); if(_bltMemo.has(k)) return _bltMemo.get(k);
  const init = mech==="short" ? {phi0:SHORT_PHI0, settled:false, exitedInHistory:false} : bltInit(side, scen||"textbook");
  const out={init, lie:{xi:0}, sit:{xi:0}, phiAfterLie:null, exited:init.exitedInHistory};
  if(!init.exitedInHistory){
    const qSit=[1,0,0,0], qLie=stepHeadQ("supineFlex",0,"up");
    const nLie=poseNeck("supineFlex",0,"up");                    // V24/V25: kark toru diagnostycznego (pivot body, ν = HC_TILT_DEG)
    const segs=[NECK_PREFIX, {q:qLie,tTrans:0.8,tHold:30,pivot:"body",neckPitch:nLie.p,neckYaw:nLie.y},
                {q:qSit,tTrans:0.8,tHold:30,pivot:"body",neckPitch:0,neckYaw:0}];
    const sim = mech==="short"
      ? Vestibular.simulateShortArm({canal:"horizontal", side, q0:qSit, phi0:SHORT_PHI0, settled:false, timeline:segs})
      : Vestibular.simulateCanalith({canal:"horizontal", side, q0:qSit, phi0:init.phi0, settled:init.settled, timeline:segs});
    const t1=30.8;                                       // granica faz: przejście+hold położenia (ogon ξ przy t1 ≈ 0 — fazy nieskontaminowane)
    for(const s of sim){
      if(s.t<=t1){ if(Math.abs(s.xi)>Math.abs(out.lie.xi)) out.lie.xi=s.xi; out.phiAfterLie=s.phi; }
      else if(Math.abs(s.xi)>Math.abs(out.sit.xi)) out.sit.xi=s.xi;
      if(s.exited) out.exited=true;
    }
  }
  _bltMemo.set(k,out); return out;
}
/* ============ Light cupula: skan płaszczyzny zerowej (ocena II, V12/D3) ============
   Null point (zero rzutu grawitacji na oś osklepka) jest ŚLEPY na znak kontrastu gęstości — WSPÓLNY dla
   ciężkiego (apo) i lekkiego (light) osklepka, ku uchu CHOREMU (+7.5° supineFlex [V25: było +8.7° przy zgięciu 30°] / +6.9° supineFlat;
   klinicznie „typowo ~20–30°, opisywany zakres 0–85°" — Lee & Kim 2025; model daje mniejszy kąt tej
   geometrii). Mechanizm czyta się z KIERUNKU DCPN po bokach zera (pełne odwrócenie apo↔light) i z czasu
   trwania — nie z położenia zera. Liczba nulla NIE jest wpisana — liczona (konwencja derivedHold). */
function nullScan(side, yawDeg, body="supineFlex"){
  const q=stepHeadQ(body, yawDeg, "up");
  const mk=v=>{ const r=Vestibular.position({canal:"horizontal", side, variant:v, q});
    const w = v==="light" ? Vestibular.LIGHT_W : Vestibular.CUP_WEAK;
    const xi = w*r.mag*(r.excited?1:-1);                       // cel statyczny (ten sam wzór co simCupStatic)
    return { xi, towardA: side==="P" ? r.h>0 : r.h<0,
             intensity: Math.min(1, Math.abs(xi)*(r.excited?1:Vestibular.EWALD_INHIB)) };
  };
  return { heavy: mk("cupulo"), light: mk("light") };
}
// V25: liczba nulla w TEKSTACH bierze się z tego samego skanu co mini-karta — po zmianie zgięcia pozy
// (HC_TILT_DEG) zero przesunęło się 8.7°→7.5°, a wpisane „~9°" cicho by skłamało w czterech miejscach.
const nullTxt = side => "~" + Math.abs(nullYawOf(side)).toFixed(0) + "°";
function nullYawOf(side, body="supineFlex"){
  const k="nullyaw#"+side+"#"+body; if(_bltMemo.has(k)) return _bltMemo.get(k);
  let prev=null, out=null;
  for(let y=-45; y<=45.001; y+=0.1){                            // zakres kliniczny skanu; zero jedno w paśmie
    const xi=nullScan(side, y, body).heavy.xi;                  // zero wspólne (ślepe na znak) — heavy wystarczy
    if(prev && Math.sign(xi)!==Math.sign(prev.xi)){ out = prev.y + 0.1*(0-prev.xi)/(xi-prev.xi); break; }
    prev={y, xi};
  }
  out = out==null ? null : Math.round(out*10)/10;
  _bltMemo.set(k,out); return out;
}
// Karty z SELEKTOREM SCENARIUSZY historii pozycyjnej (V5/V11). Od V19 predykat NIE wyklucza już
// z sesji: przy WŁĄCZONEJ sesji (i zgodności kanał/strona/mech==canalo) karty te czytają stan złogu
// Z SESJI (sessDrive), a selektor zmienia funkcję na ZASIEW — scenariusz staje się AKTEM OTWIERAJĄCYM
// łańcucha (seedSessionFromScenario w actions.js). Czytelnicy predykatu: tryb selektora + nota panelu
// sesji. Strażnik prowokacji przeszedł na MOCNIEJSZY warunek !ACT_STEPS[testKey] (żadna przyszła karta
// bez wpisu aktu nie odpali po cichu fallbacku dixowego).
const SCEN_DRIVEN=new Set(["bowlean","lyingdown"]);

/* ============ Sesja ciągła (ocena II, V10/D1 — domknięcie R10, rozstrzygnięcie B7) ============
   Stan JEDNEGO złogu (state.session, default OFF=null) przewlekany między badaniami tej samej wizyty:
   położenie φ, wiązanie bondFrac, ogon ξ — wszystko z out.final poprzedniego aktu (łańcuch ≡ jedna
   timeline BIT-W-BIT, patrz vestibular.js). Męczliwość klinicznie to POZYCJA, nie „zużycie" (Imai 2021:
   powrót odpowiedzi bramkowany pozycją spoczynku — siad 10 min→70%, leżenie ku choremu→7%; Imai
   2025/2026: mechaniczne odprowadzenie złogu ku bańce przywraca oczopląs u 90% — dowód przyczynowy).
   Silnik odtwarza ten mechanizm transportem: prowokacja z parkingu (~159°) daje odpowiedź martwą
   (0.004), po spoczynku w siadzie złóg osiada z powrotem ku restPhi i odpowiedź wraca. ROZJAZD
   UDOKUMENTOWANY: transport w siadzie (τ zsuwu tauP/A ≈ 7.5 s) przywraca pozycję w ~30 s, klinika
   Imai — w 10–30 min; rep (dyspersja, fatigueFactor→gc) zostaje jako HIPOTEZA WTÓRNA składana w tym
   samym wywołaniu. B7-ROZWIĄZANIE: seria w sesji = łańcuch stanu (kanoniczna); rep solo = dyspersja;
   między wizytami bond odrasta (readhesion), a rep wraca do 0 (kłębek re-agreguje). */
// RE-ADHEZJA MIĘDZY BADANIAMI — czysta funkcja, ŚWIADOMIE nie w pętli silnika: b(t)=1−(1−b0)·e^(−t/τB).
// TAU_BOND=1800 s to stała kalibracyjna klasy tauP/tauC, NIE wartość literaturowa (krzywej powrotu
// latencji nikt nie zmierzył — luka; Imai mierzy AMPLITUDĘ, którą u nas niesie transport+rep).
// Kotwica dwustronna: przerwy sesyjne 30–120 s → 1.7–6.4% wiązania (latencja ≈ brak — seryjny Dix
// nie odzyskuje latencji), doba → 100% (pierwsza prowokacja wizyty ma znów pełną latencję 2.35 s — V24).
// τB ≫ timeline (70 s) ⇒ odrost w biegu <3.9% — pominięcie uczciwe; bramkowany odrost w pętli
// zabiłby cały napad AC (|drive|<fStat od t=0.5 s przy żywym ξ przez 56 s — sonda 2026-08-14).
const TAU_BOND=1800;
function readhesion(bondFrac, gapSeconds, tauB=TAU_BOND){
  if(!(gapSeconds>=0) || !isFinite(gapSeconds)) throw new RangeError("readhesion: gapSeconds musi być liczbą >= 0 (podano "+gapSeconds+")");
  if(!(tauB>0) || !isFinite(tauB)) throw new RangeError("readhesion: tauB musi być liczbą > 0 (podano "+tauB+")");
  const b0=Math.min(1, Math.max(0, bondFrac??0));
  return 1-(1-b0)*Math.exp(-gapSeconds/tauB);
}
// AKT = prowokacja + POWRÓT DO SIADU + spoczynek, jedna nić symulacji (zegar aktowy — zero wall-clock;
// czas sesji to suma czasów timeline'ów). SESSION_REST=30 s = standardowa pauza kliniczna między
// prowokacjami; fizycznie robi dokładnie to, po co jest: wolny złóg osiada ku minimum siadu (transport
// liczony tym samym silnikiem), a osklepek relaksuje (6·tauC). ξ i bond przenosimy MIMO TO jawnie
// (xi0/bond0) — łańcuch pozostaje bitowo tożsamy z jedną timeline, bez aproksymacji.
const SESSION_REST=30;
const SIT_SEG={q:[1,0,0,0], tTrans:0.8, tHold:SESSION_REST, pivot:"body"};
const ACT_STEPS={                     // pozy aktu per test W KOLEJNOŚCI WYKONANIA (bez końcowego siadu)
  dix:      A=>[{body:"supineHang",     yaw:A==="P"?45:-45, face:"up", hold:40}],
  headhang: A=>[{body:"supineDeepHang", yaw:0,              face:"up", hold:40}],
  roll:     A=>[{body:"supineFlex", yaw:A==="P"?90:-90, face:"up", hold:20},
                {body:"supineFlex", yaw:0,              face:"up", hold:5},    // POWRÓT DO CENTRUM (Pagnini–McClure) — bez niego druga strona dostaje przemach 180° zamiast 90°
                {body:"supineFlex", yaw:A==="P"?-90:90, face:"up", hold:20}],
  // V19: bowlean/lyingdown W AKTACH — pozy, holdy i PIVOT dokładnie jak nici kart (bltPhases 30/5/30
  // pivot "neck"; ldtPhases 30/30 pivot "body") → akt z zasianego scenariusza odtwarza kartę BIT-W-BIT
  // (sonda projektu: textbook bow +0.975294/lean −0.366342, delta 0.0e+0; LDT lie −0.381640 idem).
  bowlean:  A=>[{body:"sit", yaw:0, face:"down", hold:30, pivot:"neck"},
                {body:"sit", yaw:0, face:"fwd",  hold:5,  pivot:"neck"},       // siad-centrum (bez fazy karty)
                {body:"sit", yaw:0, face:"up",   hold:30, pivot:"neck"}],
  lyingdown:A=>[{body:"supineFlex", yaw:0, face:"up",  hold:30},
                {body:"sit",        yaw:0, face:"fwd", hold:30}],              // sit = FAZA karty LDT (siadanie); SESSION_REST dolicza się osobno w SIT_SEG
};
const PHASE_OF={ roll:[0,2], bowlean:[0,2], lyingdown:[0,1] };   // mapowanie kroków aktu → fazy karty (centrum bowlean bez karty); reszta: tożsamość
function actTimeline(testKey, side){
  // V24: prefiks interpolacyjny (B7: sklejone akty ≡ łańcuch — prefiks resetuje nPrev identycznie
  // w obu układach) + kark na krokach pivot:"body"; kroki pivot:"neck" (bowlean) ŚWIADOMIE bez pól
  // (T3 — pomiar krytyka: handoff pól przez nPrev to artefakt zadeklarowanego pivotu SIT_SEG,
  // nie fizyka; kandydat V25: pivot SIT_SEG/aktów ze stepPivot). SIT_SEG bez pól = ν=0 bit-w-bit.
  return [NECK_PREFIX, ...(ACT_STEPS[testKey]||ACT_STEPS.dix)(side)
    .map(st=>{ const piv=st.pivot||"body";
      if(piv!=="body") return {q:stepHeadQ(st.body,st.yaw,st.face), tTrans:0.8, tHold:st.hold, pivot:piv};
      const n=poseNeck(st.body,st.yaw,st.face);
      return {q:stepHeadQ(st.body,st.yaw,st.face), tTrans:0.8, tHold:st.hold, pivot:piv, neckPitch:n.p, neckYaw:n.y}; }), SIT_SEG];
}
// stan sesji → parametry startowe silnika. settled:true ZAWSZE — o zatrzymaniu decyduje UCZCIWA bramka
// w (phi0, q0) + bond0 (bond0=0 ≡ settled:false); phi=null = spoczynek naturalny (restPhi, jak dotąd).
const sessionInit=S=>({ ...(S.phi!=null?{phi0:S.phi}:{}), settled:true,
  bond0:Math.min(1,Math.max(0,S.bondFrac)), xi0:S.xi||0, rep:S.rep||0 });
const sessionSim=(S,timeline)=>Vestibular.simulateCanalith({canal:S.canal, side:S.side, size:S.size,
  q0:[1,0,0,0], timeline, ...sessionInit(S)});
// podgląd karty diag bez commitu: szczyt ξ per faza z JEDNEJ nici (okna czasowe jak w bltPhases).
// Memo kluczem PEŁNEJ sygnatury stanu (strażnik KLIN-7; od V19 także S.exited — kolizja fresh↔exited
// przy bondFrac 1 potwierdzona sondą). Od V19 podgląd obsługuje też karty SCEN_DRIVEN (bowlean/
// lyingdown): out.exitStep = indeks KROKU aktu z pierwszą próbką exited (null = brak; ekspulsja
// w SIT_SEG → steps.length), phases[pi].exited = flaga fazy zawierającej ten krok. Akumulacja ξ
// ŚWIADOMIE nietknięta (ogon po ekspulsji zostaje w pv — jest podprogowy, a render i tak wycisza
// fazy PO fazie wyjścia); cięcie akumulacji gubiłoby szczyt fazy wyjścia (−0,749 vs −0,753 zmierzone).
const _sessMemo=new Map();
const sessKey=S=>[S.canal,S.side,S.size,S.phi==null?"-":S.phi.toFixed(3),S.bondFrac.toFixed(4),(S.xi||0).toFixed(4),S.rep||0,S.exited?1:0].join("#");
function sessionPreview(S, testKey){
  const k="pv#"+testKey+"#"+sessKey(S); if(_sessMemo.has(k)) return _sessMemo.get(k);
  const steps=(ACT_STEPS[testKey]||ACT_STEPS.dix)(S.side), map=PHASE_OF[testKey]||steps.map((_,i)=>i);
  const out={phases:map.map(()=>({xi:0, exited:false})), exited:!!S.exited, exitStep:null};
  if(!S.exited){
    const sim=sessionSim(S, actTimeline(testKey, S.side));
    const bounds=[]; let t0=0; for(const st of steps){ t0+=0.8+st.hold; bounds.push(t0); }
    for(const s of sim){ const i=bounds.findIndex(b=>s.t<=b), pi=map.indexOf(i);
      if(pi>=0 && Math.abs(s.xi)>Math.abs(out.phases[pi].xi)) out.phases[pi].xi=s.xi;
      if(s.exited && out.exitStep==null){ out.exitStep = i>=0 ? i : steps.length; if(pi>=0) out.phases[pi].exited=true; } }
    out.exited=sim.final.exited;
    // V25: „gone" = złóg był POZA kanałem JUŻ NA POCZĄTKU tej fazy. Osobne od `exited` (stan KOŃCA
    // aktu) i od `phases[].exited` (faza, W KTÓREJ złóg wyszedł — ta jeszcze ma pełną odpowiedź).
    // Bez tego rozróżnienia karta rzutuje koniec aktu wstecz na wszystkie fazy i twierdzi, że świeży
    // chory ma niemy test obustronny — po V25 akt Roll opróżnia kanał w fazie 3, więc to nie jest
    // już przypadek teoretyczny (zarzut blokujący krytyka kliniki).
    if(out.exitStep!=null) map.forEach((stepIdx,pi)=>{ if(stepIdx>out.exitStep) out.phases[pi].gone=true; });
  }
  _sessMemo.set(k,out); return out;
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
    get intro(){return t(`Pacjent na plecach, głowa zgięta ~${HC_TILT_TXT}°. Obróć głowę szybko w jedną, potem w drugą stronę.`,`Patient supine, head flexed ~${HC_TILT_TXT}°. Turn the head quickly to one side, then to the other.`);},
    // V25: UWAGA DO POZYCJI — jedyne miejsce w aplikacji, gdzie kąt zgięcia jest UZASADNIONY, a nie podany.
    get poseNote(){return t(`Uwaga do pozycji: zgięcie karku jest tu ~${HC_TILT_TXT}°, a nie podręcznikowe „20–30°" — bo tyle wynosi kąt, przy którym grawitacja kładzie się DOKŁADNIE w płaszczyźnie kanału bocznego tego atlasu (${HC_FLEX_DEG.toFixed(2)}°; pełne nachylenie płaszczyzny ${HC_TILT_DEG.toFixed(2)}°). To jest dokładnie to, czym klinika uzasadnia swój kąt („unieś głowę, żeby kanał boczny stanął pionowo") — tyle że kanon 30° realizuje ten cel dla anatomii o nachyleniu 30°, której pomiary nie potwierdzają (19,9° · 17,4° · ${HC_TILT_DEG.toFixed(1)}°); 30° nie jest pomiarem wydajności testu, tylko liczbą przeniesioną z konwencji kalorycznej. ZYSK W MODELU: grawitacja w płaszczyźnie kanału 100,0% zamiast 94,1%, szczyt odpowiedzi 0,696→0,784, latencja 2,30→2,00 s. GRANICA, KTÓRĄ TRZEBA ZNAĆ: te liczby dotyczą pozycji WYJŚCIOWEJ (przed obrotem głowy); w pozycji z uchem w dole, czyli tam, gdzie test się odczytuje, optimum leży przy ~0° i każde zgięcie kosztuje — kąt realizuje cel USTAWIENIA kanału, nie maksimum odpowiedzi. KOSZT NAZWANY WPROST: pełny test obustronny w modelu WYPROWADZA złóg do łagiewki, więc kontrolny test bywa niemy. Zależy to jednak głównie od DŁUGOŚCI utrzymania pozycji i od rozmiaru złogu, a nie od zgięcia: przy 20 s na stronę złóg średni wychodzi pod sam koniec drugiej fazy (margines 0,85 s), duży już w jej połowie, mały nie wychodzi wcale — a przy 30 s na stronę kanał opróżnia się także przy podręcznikowych 30°. Klinicznie NIE jest to błąd: badanie pozycyjne bywa zabiegiem i tak należy je odnotować — pamiętaj tylko, że ujemny test kontrolny zaraz po prowokacji nie dowodzi wyleczenia sprzed badania. Sam ROZKŁAD tego zjawiska (jak często i przy jakim złogu) pozostaje własnością wyidealizowanego łuku modelu, nie pomiarem na chorych.`,`A note on the position: the neck flexion here is ~${HC_TILT_TXT}°, not the textbook "20-30°" — because that is the angle at which gravity comes to lie EXACTLY in the plane of this atlas's lateral canal (${HC_FLEX_DEG.toFixed(2)}°; the plane's full inclination is ${HC_TILT_DEG.toFixed(2)}°). That is precisely what the clinic uses to justify its own angle ("raise the head so the lateral canal stands vertical") — except that the 30° canon realises the goal for an anatomy tilted 30°, which measurements do not support (19.9° · 17.4° · ${HC_TILT_DEG.toFixed(1)}°); 30° is not a measurement of the test's performance but a number carried over from the caloric convention. THE GAIN IN THE MODEL: gravity in the canal plane 100.0% instead of 94.1%, peak response 0.696->0.784, latency 2.30->2.00 s. A LIMIT YOU SHOULD KNOW: those figures belong to the SETUP position (before the head is turned); in the ear-down position, where the test is actually read, the optimum sits near 0° and every degree of flexion costs — the angle realises the canal ALIGNMENT goal, not a maximum response. THE COST, NAMED PLAINLY: in this model the full bilateral test CARRIES the debris into the utricle, so the control test can be mute. That, however, depends mainly on HOW LONG each position is held and on the debris size, not on the flexion: at 20 s per side medium debris leaves right at the end of the second phase (margin 0.85 s), large debris halfway through it, small debris not at all — and at 30 s per side the canal empties at the textbook 30° as well. Clinically this is NOT an error: a positional test can act as a treatment and should simply be noted as such — bear in mind only that a negative control test right after the provocation does not prove the patient was already cured. How OFTEN it happens, and with what debris, remains a property of the model's idealised arc rather than a measurement in patients.`);},
    features:featsByVariant,
    latNote:(A,v,mech)=>{
      if(mech==="light") return t(`Light cupula: DCPN geotropowy TRWAŁY (>1 min w pozycji), bez latencji, NIEmęczliwy — kierunek jak w kanalolitiazie, czas jak w kupulopatii. Reakcja silniejsza przy uchu chorym w dole (${sideN(A)}), ale stronę ROZSTRZYGA płaszczyzna zerowa ~10–30° skrętu ku uchu choremu (model: ${nullTxt(A)}; mini-karta niżej) — kanalolitiaza jej nie ma. Manewry repozycyjne nieskuteczne — patrz zalecenie.`,`Light cupula: a PERSISTENT geotropic DCPN (>1 min per position), no latency, NON-fatiguing — direction as in canalithiasis, time course as in cupulopathy. The response is stronger with the affected ear (${sideN(A)}) down, but the side is SETTLED by the null plane at ~10–30° of turn toward the affected ear (model: ${nullTxt(A)}; mini-card below) — canalithiasis has none. Repositioning maneuvers are ineffective — see the recommendation.`);
      if(mech==="short") return t(`Ramię bańkowe (short arm): DCPN apogeotropowy PRZEMIJAJĄCY i męczliwy — kierunek jak w kupulolitiazie, dynamika jak w kanalolitiazie. Strona chora = SŁABSZA reakcja przy uchu w dole → ${sideN(A)}. Faza „zdrowe ucho w dole” wyprowadza złóg do łagiewki — test bywa SAMOLECZĄCY (dlatego apo z ramienia bańkowego rzadko jest uporczywe). Null point jednostronny, nie wspólny — różnicuje od kupulopatii.`,`Short (ampullar) arm: a TRANSIENT, fatiguing apogeotropic DCPN — direction as in cupulolithiasis, dynamics as in canalithiasis. Affected side = WEAKER response with that ear down → ${sideN(A)}. The healthy-ear-down phase carries the debris into the utricle — the test can be SELF-TREATING (which is why short-arm apo is rarely persistent). The null point is one-sided, not common — differentiating it from cupulopathy.`);
      return v==="canalo"
      ? t(`Geotropowy: strona chora = SILNIEJSZA reakcja → ${sideN(A)}. Uwaga (D3): geotropowy DCPN UPORCZYWY (>1 min w pozycji), bez latencji i NIEmęczliwy to light cupula, nie kanalolitiaza — zbadaj płaszczyznę zerową (mini-karta niżej).`,`Geotropic: affected side = STRONGER response → ${sideN(A)}. Note (D3): a PERSISTENT geotropic DCPN (>1 min per position), without latency and NON-fatiguing is light cupula, not canalithiasis — examine the null plane (mini-card below).`)
      : t(`Apogeotropowy: strona chora = SŁABSZA reakcja przy uchu w dole → ${sideN(A)}. Uwaga (D10): apogeotropia ≠ zawsze kupulolitiaza — PRZEMIJAJĄCY, męczliwy DCPN apo daje wolny złóg w RAMIENIU BAŃKOWYM (mechanizm różnicuje czas trwania i powtarzalność).`,`Apogeotropic: affected side = WEAKER response with that ear down → ${sideN(A)}. Note (D10): apogeotropy ≠ always cupulolithiasis — a TRANSIENT, fatiguing apo DCPN comes from free debris in the SHORT (ampullar) ARM (mechanism differentiated by duration and repeatability).`);
    },
    phases:(A,v,scen,mech)=>{ const H=otherSide(A), geo=(v==="canalo");
      const pose=down=>({ptitle:t(`Ucho ${down==="L"?"lewe":"prawe"} w dole`,`${down==="L"?"Left":"Right"} ear down`), ppos:t(`Głowa obrócona 90° ku stronie ${sideN(down)}`,`Head turned 90° toward the ${sideN(down)} side`),
          body:"supineFlex", yaw: down==="P"?90:-90, face:"up"});
      // D4/V16, mech="short": DYNAMIKA per faza (rollShortPhases) — strzałka+napis z JEDNEGO ξ (wzorzec V5);
      // segment nie ma statyki, bo nie ma spoczynku (sonda D4).
      if(mech==="short"){
        const R=rollShortPhases(A);
        const mk=down=>{ const up=otherSide(down), ph=(down===A)?R.aff:R.heal;
          const N=nysFromDyn("horizontal", A, ph.xi, false);
          const towardUp = (up==="P") ? N.anat.h>0 : N.anat.h<0;
          const nys={kind:N.kind, dir:N.dir, vdir:N.vdir, strength:N.strength, excited:N.excited,
                     persistent:false, canal:"horizontal", side:A, q:stepHeadQ("supineFlex", down==="P"?90:-90, "up"),
                     anat:N.anat, init:{arm:"short", phi0:SHORT_PHI0, settled:false}};
          return {...pose(down), nys,
            label: towardUp ? t(`apogeotropowy — ku uchu w górze (${sideN(up)})`,`apogeotropic — toward the upper ear (${sideN(up)})`)
                            : t(`geotropowy — ku uchu w dole (${sideN(down)})`,`geotropic — toward the lower ear (${sideN(down)})`),
            note: down===A
              ? t("Złóg zsuwa się w ramieniu ku osklepkowi i zostaje DOCIŚNIĘTY (kontakt): oczopląs nie wygasa, póki pozycja trwa (pseudo-trwały), ale PRZEMIJA po zmianie pozycji i męczy się przy powtórzeniach — to różni go od kupulolitiazy. Reakcja słabsza (Ewald: hamowanie).","The debris slides down the arm toward the cupula and gets PRESSED against it (contact): the nystagmus does not fade while the position lasts (pseudo-persistent), but it PASSES on position change and fatigues on repetition — unlike cupulolithiasis. Weaker response (Ewald: inhibition).")
              : t("Złóg wypada z ramienia do ŁAGIEWKI (samooczyszczenie): oczopląs przemijający, a test wykonuje pracę manewru — po tej fazie kolejne prowokacje słabną albo milkną.","The debris falls out of the arm into the UTRICLE (self-clearing): the nystagmus is transient and the test does the maneuver's job — after this phase further provocations weaken or fall silent.")};
        };
        return [mk(A), mk(H)];
      }
      const mkVar = mech==="light" ? "light" : v;   // light: ta sama statyka co cupulo, znak odwraca position(variant)
      const mk=down=>{ const up=otherSide(down);
        const strong = (geo || mech==="light") ? (down===A) : (down===H);
        return {...pose(down),
          nys: nysFromGeom("horizontal", A, mkVar, stepHeadQ("supineFlex", down==="P"?90:-90, "up"), "asym"),
          label: mech==="light" ? t(`geotropowy TRWAŁY — ku uchu w dole (${sideN(down)})`,`PERSISTENT geotropic — toward the lower ear (${sideN(down)})`)
               : geo ? t(`geotropowy — ku uchu w dole (${sideN(down)})`,`geotropic — toward the lower ear (${sideN(down)})`) : t(`apogeotropowy — ku uchu w górze (${sideN(up)})`,`apogeotropic — toward the upper ear (${sideN(up)})`),
          note: (mech==="light" && strong) ? t("Reakcja silniejsza w tej pozycji; bez latencji, nie wygasa i nie męczy się.","Stronger response in this position; no latency, does not fade and does not fatigue.")
              : (mech==="light") ? t("Reakcja słabsza w tej pozycji; uporczywa, niemęczliwa.","Weaker response in this position; persistent, non-fatiguing.")
              : strong ? t("Reakcja silniejsza w tej pozycji.","Stronger response in this position.") : t("Reakcja słabsza w tej pozycji.","Weaker response in this position.")};
      };
      return [mk(A), mk(H)];
    }
  },
  bowlean:{ get name(){return t("Test Bow & Lean (skłon i odchylenie)","Bow & Lean test (bow and lean)");}, get tests(){return t("kanał poziomy — lateralizacja","horizontal canal — lateralization");}, canal:"horizontal",
    get intro(){return t("W siadzie wykonaj skłon głowy w przód (bow), następnie odchylenie do tyłu (lean).","While sitting, bend the head forward (bow), then tilt it back (lean).");},
    features:featsByVariant,
    latNote:(A,v,mech)=>{
      if(mech==="light") return t("Light cupula: lekki osklepek odgina się PRZECIWNIE do ciężkiego — skłon bije ku uchu CHOREMU, odchylenie ku ZDROWEMU (wzorzec jak reguła Choung, ale UPORCZYWY, bez latencji i niemęczliwy). Wynik nie zależy od historii pozycyjnej (brak wolnej cząstki w świetle) — test powtarzalny.","Light cupula: the light cupula deflects OPPOSITE to the heavy one — the bow beats toward the AFFECTED ear, the lean toward the HEALTHY one (the pattern matches the Choung rule, but is PERSISTENT, latency-free and non-fatiguing). The result does not depend on positional history (no free particle in the lumen) — the test is repeatable.");
      if(mech==="short") return t("Ramię bańkowe (short arm): wzorzec apo — skłon ku ZDROWEJ, odchylenie ku CHOREJ (odwrócenie reguły Choung, jak w kupulolitiazie) — ale PRZEMIJAJĄCY i męczliwy, a odchylenie OPRÓŻNIA ramię do łagiewki (test bywa samoleczący). Historia pozycyjna nie ustala tu położenia startowego: ramię nie ma spoczynku — siad je czyści.","Short (ampullar) arm: the apo pattern — bow toward the HEALTHY side, lean toward the AFFECTED one (the Choung rule reversed, as in cupulolithiasis) — but TRANSIENT and fatiguing, and the lean EMPTIES the arm into the utricle (the test can be self-treating). Positional history does not set the start here: the arm has no rest — sitting clears it.");
      return v==="canalo"
      ? t("Kierunek i obecność odpowiedzi zależą od położenia złogu na starcie, a to ustala HISTORIA POZYCYJNA — wybierz scenariusz nad fazami. Reguła Choung (skłon→chora, odchylenie→zdrowa) WYNIKA z fizyki, gdy złóg leży przed wododziałem skłonu (φ₀<190°).","The direction and presence of the response depend on where the debris starts, which is set by the POSITIONAL HISTORY — pick a scenario above the phases. The Choung rule (bow→affected, lean→healthy) FOLLOWS from physics whenever the debris lies before the bow watershed (φ₀<190°).")
      : t("Apogeotropowy (kupulolitiaza): skłon bije ku stronie zdrowej, odchylenie ku chorej. Wynik NIE zależy od historii pozycyjnej (brak wolnej cząstki) — test powtarzalny w trwałej kupulopatii. Wolny złóg w ramieniu bańkowym (D10) daje apo PRZEMIJAJĄCE i męczliwe — powtarzalność ma tylko prawdziwa kupulopatia.","Apogeotropic (cupulolithiasis): the bow beats toward the healthy side, the lean toward the affected one. The result does NOT depend on positional history (no free particle) — the test is repeatable in persistent cupulopathy. Free debris in the short (ampullar) arm (D10) gives a TRANSIENT, fatiguing apo — only true cupulopathy is repeatable.");
    },
    phases:(A,v,scen,mech)=>{ const S=scen||"textbook";
      const mkPose=(key)=> key==="bow"
        ? {ptitle:t("Skłon w przód (bow)","Forward bend (bow)"), ppos:t("Siad, skłon tułowia w przód ~45°, nos ku podłodze","Sitting, trunk bent forward ~45°, nose toward the floor"), body:"sit", yaw:0, face:"down"}
        : {ptitle:t("Odchylenie do tyłu (lean)","Backward tilt (lean)"), ppos:t("Siad, głowa odchylona do tyłu","Sitting, head tilted back"), body:"sit", yaw:0, face:"up"};
      // D4/V16, mech="light": ta sama statyka co kupulo (znak odwraca position(variant:"light")) —
      // napis z TEJ SAMEJ odpowiedzi (anat.h); wzorzec Choung-podobny, ale TRWAŁY i powtarzalny.
      if(mech==="light"){
        const mk=(key)=>{ const p=mkPose(key);
          const nys=nysFromGeom("horizontal", A, "light", stepHeadQ("sit", 0, key==="bow"?"down":"up"), "flat");
          const towardA = A==="P" ? nys.anat.h>0 : nys.anat.h<0;
          return {...p, nys, label: bltDirWord(A, towardA),
            note: key==="bow"
              ? t("Lekki osklepek odgina się PRZECIWNIE do ciężkiego — bez latencji, uporczywie, niezależnie od położenia złogu i historii (test powtarzalny).","The light cupula deflects OPPOSITE to the heavy one — no latency, persistently, regardless of debris position and history (repeatable test).")
              : t("Odchylenie odwraca rzut grawitacji na osklepek → kierunek przeciwny niż w skłonie.","Leaning back reverses the gravity projection on the cupula → direction opposite to the bow.")};
        };
        const arr=[mk("bow"), mk("lean")];
        arr.blt={scen:null, light:true}; return arr;
      }
      // D4/V16, mech="short": DYNAMIKA sekwencji (bltPhases z fasadą short) — świeży depozyt SHORT_PHI0,
      // scenariusze ignorowane (ramię nie ma spoczynku). Strzałka+napis z JEDNEGO ξ (V5).
      if(mech==="short"){
        const P=bltPhases(A, S, "short");
        const mk=(key)=>{ const p=mkPose(key), xi=P[key].xi;
          const N=nysFromDyn("horizontal", A, xi, false);
          const resolved = N.strength>=XI_CARD;
          const nys={kind:N.kind, dir:resolved?N.dir:0, vdir:N.vdir, strength:resolved?N.strength:0,
                     excited:N.excited, persistent:false, canal:"horizontal", side:A,
                     q:stepHeadQ("sit",0,key==="bow"?"down":"up"), anat:resolved?N.anat:{h:0,v:0,t:0},
                     init:{arm:"short", phi0:SHORT_PHI0, settled:false}, unresolved:!resolved};
          const label = resolved ? bltDirWord(A, xi>0) + (key==="lean" && P.exited ? t(" — i złóg opuszcza ramię"," — and the debris leaves the arm") : "")
                                 : t("odpowiedź podprogowa","subthreshold response");
          const note = key==="bow"
            ? t("Skłon zsuwa złóg w ramieniu ODampułkowo (hamowanie) → bije ku ZDROWEJ — odwrócenie reguły Choung, jak w kupulolitiazie, ale odpowiedź jest PRZEMIJAJĄCA.","The bow slides the debris in the arm ampullofugally (inhibition) → beats toward the HEALTHY side — the Choung rule reversed, as in cupulolithiasis, but the response is TRANSIENT.")
            : t("Odchylenie prowadzi złóg z powrotem ku łagiewce — bije ku CHOREJ i OPRÓŻNIA ramię (samooczyszczenie w trakcie diagnostyki).","The lean carries the debris back toward the utricle — beats toward the AFFECTED side and EMPTIES the arm (self-clearing during diagnostics).");
          return {...p, nys, label, note};
        };
        const arr=[mk("bow"), mk("lean")];
        arr.blt={scen:null, short:true, bowXi:P.bow.xi, leanXi:P.lean.xi, exitedInBow:P.bow.exited, exitedInHistory:false, exitedTotal:P.exited};
        return arr;
      }
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
  // ============ Lying-down / sitting-up (ocena II, V11/D2) — patrz komentarz przy ldtPhases ============
  lyingdown:{ get name(){return t("Test położenia i siadania (lying-down)","Lying-down / sitting-up test");}, get tests(){return t("kanał poziomy — lateralizacja","horizontal canal — lateralization");}, canal:"horizontal",
    get intro(){return t(`Z siadu połóż pacjenta na wznak z głową lekko uniesioną (~${HC_TILT_TXT}°, jak do testu Roll), bez obrotu. Obserwuj oczopląs po położeniu, następnie posadź i obserwuj ponownie.`,`From sitting, lay the patient supine with the head slightly raised (~${HC_TILT_TXT}°, as for the Roll test), without turning. Watch for nystagmus after lying down, then sit the patient up and watch again.`);},
    features:featsByVariant,
    latNote:(A,v,mech)=>{
      if(mech==="light") return t("Light cupula: położenie → oczopląs ku uchu ZDROWEMU (lustro kupulolitiazy — lekki osklepek odgina się przeciwnie), TRWAŁY; w siadzie słaby pseudo-SN ku ZDROWEJ (odwrócony względem apo — to różnicuje mechanizmy przy tym samym null point). Wynik nie zależy od historii pozycyjnej.","Light cupula: lying down → nystagmus toward the HEALTHY ear (the mirror of cupulolithiasis — the light cupula deflects the opposite way), PERSISTENT; in sitting a weak pseudo-SN toward the HEALTHY side (reversed vs apo — this differentiates the mechanisms at the same null point). The result does not depend on positional history.");
      if(mech==="short") return t("Ramię bańkowe (short arm): położenie → oczopląs ku uchu CHOREMU (wzorzec apo — złóg zsuwa się w ramieniu DOampułkowo), ale PRZEMIJAJĄCY; siadanie podprogowe i domyka SAMOOCZYSZCZENIE (złóg wypada do łagiewki). Historia pozycyjna nie ustala położenia startowego — ramię nie ma spoczynku.","Short (ampullar) arm: lying down → nystagmus toward the AFFECTED ear (the apo pattern — the debris slides ampullopetally in the arm), but TRANSIENT; sitting up is subthreshold and completes the SELF-CLEARING (the debris falls into the utricle). Positional history does not set the start — the arm has no rest.");
      return v==="canalo"
      ? t("Kierunek i obecność oczopląsu położenia (LDN) zależą od miejsca złogu na starcie — wybierz scenariusz historii nad fazami. Wzorzec geotropowy (położenie → ku uchu ZDROWEMU, odampułkowo) WYNIKA z fizyki dla φ₀<190°. LDN to znak POMOCNICZY lateralizacji (obecny u ~38–68% chorych; nie jest kryterium Bárány) — rozstrzyga zwłaszcza przy symetrycznym teście Roll. Trwały geotropowy oczopląs >1 min → myśl o light cupula (mini-karta null point na karcie Roll).","The direction and presence of the lying-down nystagmus (LDN) depend on where the debris starts — pick a history scenario above the phases. The geotropic pattern (lying down → toward the HEALTHY ear, ampullofugal) FOLLOWS from physics for φ₀<190°. LDN is a SECONDARY sign of lateralization (present in ~38–68% of patients; not a Bárány criterion) — it settles the side especially when the Roll test is symmetric. A persistent geotropic nystagmus >1 min → think light cupula (null-point mini-card on the Roll test).")
      : t(`Apogeotropowy (kupulolitiaza): położenie → oczopląs KU UCHU CHOREMU (ampulopetalne odchylenie ciężkiego osklepka), uporczywy; w siadzie słaby pseudo-spontaniczny oczopląs (PSN) ku chorej. Null point ~10–30° skrętu głowy ku uchu choremu (model: ${nullTxt(A)}). Wynik nie zależy od historii pozycyjnej.`,`Apogeotropic (cupulolithiasis): lying down → nystagmus TOWARD THE AFFECTED ear (ampullopetal deflection of the heavy cupula), persistent; in sitting a weak pseudo-spontaneous nystagmus (PSN) toward the affected side. Null point at ~10–30° of head turn toward the affected ear (model: ${nullTxt(A)}). The result does not depend on positional history.`);
    },
    phases:(A,v,scen,mech)=>{ const S=scen||"textbook";
      const mkPose=(key)=> key==="lie"
        ? {ptitle:t("Położenie (lying-down)","Lying down"), ppos:t(`Na wznak, głowa uniesiona ~${HC_TILT_TXT}° (pozycja testu Roll), bez obrotu`,`Supine, head raised ~${HC_TILT_TXT}° (Roll-test position), no turning`), body:"supineFlex", yaw:0, face:"up"}
        : {ptitle:t("Siadanie (sitting-up)","Sitting up"), ppos:t("Powrót do siadu, głowa prosto","Back to sitting, head straight"), body:"sit", yaw:0, face:"fwd"};
      // D4/V16, mech="light": statyka jak kupulo, znak odwraca position(variant:"light") — lustro apo.
      if(mech==="light"){
        const mk=(key)=>{ const p=mkPose(key);
          const q = key==="lie" ? stepHeadQ("supineFlex",0,"up") : stepHeadQ("sit",0,"fwd");
          const nys=nysFromGeom("horizontal", A, "light", q, "flat");
          const towardA = A==="P" ? nys.anat.h>0 : nys.anat.h<0;
          return {...p, nys, label: bltDirWord(A, towardA) + (key==="lie" ? "" : t(" (pseudo-SN, słaby)"," (pseudo-SN, weak)")),
            note: key==="lie"
              ? t("Lekki osklepek odchyla się ODampułkowo (lustro kupulolitiazy) — trwale, bez latencji, ku uchu ZDROWEMU. Null point wspólny z postacią heavy, ku uchu choremu (mini-karta na teście Roll).","The light cupula deflects ampullofugally (the mirror of cupulolithiasis) — persistently, without latency, toward the HEALTHY ear. The null point is common with the heavy form, toward the affected ear (mini-card on the Roll test).")
              : t("Pseudo-spontaniczny oczopląs w siadzie — słaby, ku ZDROWEJ: ODWROTNIE niż w kupulolitiazie (apo → ku chorej). Ten sam null point, przeciwne kierunki wokół niego — tak różnicuje się mechanizm.","Pseudo-spontaneous nystagmus in sitting — weak, toward the HEALTHY side: the OPPOSITE of cupulolithiasis (apo → toward the affected side). Same null point, opposite directions around it — this is how the mechanism is differentiated.")};
        };
        const arr=[mk("lie"), mk("sit")];
        arr.ldt={scen:null, light:true}; return arr;
      }
      // D4/V16, mech="short": dynamika sekwencji (ldtPhases z fasadą short) — świeży depozyt, bez scenariuszy.
      if(mech==="short"){
        const P=ldtPhases(A, S, "short");
        const mk=(key)=>{ const p=mkPose(key), xi=P[key==="lie"?"lie":"sit"].xi;
          const N=nysFromDyn("horizontal", A, xi, false);
          const resolved = N.strength>=XI_CARD;
          const q = key==="lie" ? stepHeadQ("supineFlex",0,"up") : stepHeadQ("sit",0,"fwd");
          const nys={kind:N.kind, dir:resolved?N.dir:0, vdir:N.vdir, strength:resolved?N.strength:0,
                     excited:N.excited, persistent:false, canal:"horizontal", side:A,
                     q, anat:resolved?N.anat:{h:0,v:0,t:0}, init:{arm:"short", phi0:SHORT_PHI0, settled:false}, unresolved:!resolved};
          const label = resolved ? bltDirWord(A, xi>0) : t("napęd podprogowy","subthreshold drive");
          const note = key==="lie"
            ? t("Położenie zsuwa złóg w ramieniu DOampułkowo → pobudzenie → oczopląs ku uchu CHOREMU (wzorzec apo LDT), ale PRZEMIJAJĄCY — to wolny złóg, nie kupulopatia.","Lying down slides the debris in the arm ampullopetally → excitation → nystagmus toward the AFFECTED ear (the apo LDT pattern), but TRANSIENT — free debris, not cupulopathy.")
            : (P.exited
                ? t("Siadanie domyka SAMOOCZYSZCZENIE: złóg wypada z ramienia do łagiewki (wyjście przez próg łagiewkowy) — kolejne testy będą nieme.","Sitting up completes the SELF-CLEARING: the debris falls out of the arm into the utricle (exit through the utricular threshold) — further tests will be mute.")
                : t("Siadanie: odpowiedź podprogowa (złóg blisko progu łagiewkowego).","Sitting up: subthreshold response (debris near the utricular threshold)."));
          return {...p, nys, label, note};
        };
        const arr=[mk("lie"), mk("sit")];
        arr.ldt={scen:null, short:true, lieXi:P.lie.xi, sitXi:P.sit.xi, exitedTotal:P.exited};
        return arr;
      }
      if(v==="cupulo"){
        // KUPULO: kierunek z FIZYKI (cel przy osklepku — V4); napis z TEJ SAMEJ odpowiedzi (anat.h).
        const mk=(key)=>{ const p=mkPose(key);
          const q = key==="lie" ? stepHeadQ("supineFlex",0,"up") : stepHeadQ("sit",0,"fwd");
          const nys=nysFromGeom("horizontal", A, v, q, "flat");
          const towardA = A==="P" ? nys.anat.h>0 : nys.anat.h<0;
          return {...p, nys, label: bltDirWord(A, towardA) + (key==="lie" ? "" : t(" (pseudo-SN, słaby)"," (pseudo-SN, weak)")),
            note: key==="lie"
              ? t(`Ciężki osklepek odchyla się ampulopetalnie — uporczywie, bez latencji. Null point: skręć głowę ~10–30° ku uchu choremu (model: ${nullTxt(A)}) — oczopląs znika; to potwierdza stronę.`,`The heavy cupula deflects ampullopetally — persistently, without latency. Null point: turn the head ~10–30° toward the affected ear (model: ${nullTxt(A)}) — the nystagmus vanishes; this confirms the side.`)
              : t("Pseudo-spontaniczny oczopląs (Asprella): słaby (cel statyczny ~0,05), w siadzie BEZ prowokacji — w SOR bywa mylony z zapaleniem neuronu. Różnicuj MODULACJĄ pitch (znika ~30° przodozgięcia, odwraca się głębiej), NIE fiksacją. Model nie odtwarza odwrócenia przy samym siadaniu (null pitch ~24° zgięcia).","Pseudo-spontaneous nystagmus (Asprella): weak (static target ~0.05), present in sitting WITHOUT provocation — in the ED it can mimic vestibular neuritis. Differentiate by PITCH MODULATION (vanishes at ~30° of flexion, reverses deeper), NOT by fixation. The model does not reproduce a reversal on sitting up itself (null pitch at ~24° of flexion).")};
        };
        const arr=[mk("lie"), mk("sit")];
        arr.ldt={scen:null, cupulo:true}; return arr;
      }
      // CANALO: strzałka + napis + obwiednia animacji z JEDNEJ symulacji sekwencji (leżenie→siad).
      const P=ldtPhases(A, S), init=P.init;
      const mk=(key)=>{ const p=mkPose(key), xi=P[key==="lie"?"lie":"sit"].xi;
        const N=nysFromDyn("horizontal", A, xi, false);
        const emptied = init.exitedInHistory;
        const resolved = !emptied && N.strength>=XI_CARD;
        const q = key==="lie" ? stepHeadQ("supineFlex",0,"up") : stepHeadQ("sit",0,"fwd");
        const iniAnim = key==="lie" ? {phi0:init.phi0, settled:init.settled}
                                    : {phi0:P.phiAfterLie, settled:false};   // siadanie startuje tam, gdzie zostawiło je leżenie
        const nys={kind:N.kind, dir:resolved?N.dir:0, vdir:N.vdir, strength:resolved?N.strength:0,
                   excited:N.excited, persistent:false, canal:"horizontal", side:A,
                   q, anat:resolved?N.anat:{h:0,v:0,t:0}, init:iniAnim, unresolved:!resolved};
        let label, note;
        if(emptied){
          label = t("kanał opróżniony już PRZED testem","the canal was emptied BEFORE the test");
          note = t("Historia pozycyjna usunęła złóg z kanału — test niemy, pacjent w praktyce wyleczony.","The positional history removed the debris from the canal — the test is mute; in practice the patient is cured.");
        } else if(!resolved){
          label = key==="lie" ? t("model nie rozstrzyga","the model does not resolve it")
                              : t("napęd podprogowy — model nie rozstrzyga","subthreshold drive — the model does not resolve it");
          note = key==="lie"
            ? t(`Leżenie przesuwa równowagę ledwie o ~9° (siad 200° → leżenie 190°): przy spoczynku z pełną adhezją napęd (0.025) nie zrywa wiązania (próg 0.04), a złóg blisko 190° prawie nie ma drogi. Klinicznie LDN jest NIEOBECNY u 32–62% chorych — to ta sama fizyka.`,`Lying down shifts the equilibrium by barely ~9° (sitting 200° → lying 190°): at rest with full adhesion the drive (0.025) does not break the bond (threshold 0.04), and debris near 190° has almost no path. Clinically the LDN is ABSENT in 32–62% of patients — the same physics.`)
            : t("Siadanie prowadzi złóg z powrotem ODampułkowo (190→200°) — w modelu odpowiedź zawsze podprogowa. Kliniczna reguła siadania (geo → ku uchu choremu) to wyprowadzenie mechaniczne BEZ własnych serii liczbowych — luka dowodowa, nie pewnik.","Sitting up carries the debris back ampullofugally (190→200°) — in the model the response is always subthreshold. The clinical sitting-up rule (geo → toward the affected ear) is a mechanical derivation WITHOUT its own numeric series — an evidence gap, not a certainty.");
        } else {
          label = bltDirWord(A, xi>0) + (N.strength<0.25 ? t(" (słaby)"," (weak)") : "");
          note = xi<0
            ? t("Złóg przed równowagą leżenia (φ₀<190°): położenie zsuwa go ODampułkowo → hamowanie → oczopląs ku uchu ZDROWEMU. Wzorzec geotropowy (Han 2006, Koo 2006) — tu WYNIKA z fizyki.","Debris before the lying equilibrium (φ₀<190°): lying down slides it ampullofugally → inhibition → nystagmus toward the HEALTHY ear. The geotropic pattern (Han 2006, Koo 2006) — here it FOLLOWS from physics.")
            : t("Złóg ZA równowagą leżenia (φ₀>190°): położenie przesuwa go DOampułkowo → pobudzenie → oczopląs ku uchu CHOREMU — odwrotnie niż uczy reguła geotropowa (wzorzec GT−, ~7% serii Califano 2026). To odczyt POŁOŻENIA WYJŚCIOWEGO złogu, nie błąd reguły — ta sama fizyka wododziału co w Bow & Lean.","Debris BEYOND the lying equilibrium (φ₀>190°): lying down moves it ampullopetally → excitation → nystagmus toward the AFFECTED ear — opposite to the geotropic rule (the GT− pattern, ~7% of the Califano 2026 series). This reads out the debris STARTING POSITION, not a failure of the rule — the same watershed physics as in Bow & Lean.");
        }
        return {...p, nys, label, note};
      };
      const arr=[mk("lie"), mk("sit")];
      arr.ldt={scen:S, phi0:init.phi0, settled:init.settled, exitedInHistory:init.exitedInHistory,
               lieXi:P.lie.xi, sitXi:P.sit.xi, phiAfterLie:P.phiAfterLie};
      return arr;
    }
  },
};
function variantLabels(canal){
  return canal==="horizontal"
    ? {canalo:t("Kanalolitiaza (geotropowy)","Canalithiasis (geotropic)"), cupulo:t("Kupulolitiaza (apogeotropowy)","Cupulolithiasis (apogeotropic)")}
    : {canalo:t("Kanalolitiaza","Canalithiasis"), cupulo:t("Kupulolitiaza (rzadko)","Cupulolithiasis (rare)")};
}
/* ============ D4 (ocena II, V16 — wdrożenie R11): rozdział FENOTYP / MECHANIZM ============
   Oś ADDYTYWNA: state.variant zostaje osią zgodności (na kanale poziomym znaczy FENOTYP geo/apo,
   na pionowych — wprost mechanizm; geo/apo nie istnieje tam, gdzie oś kanału jest pionowa — R11),
   a state.mechanism (null = mechanizm klasyczny fenotypu ⇒ każda istniejąca ścieżka bit-w-bit
   identyczna) wybiera MECHANIZM w obrębie fenotypu:
     HC geo = {canalo (długie ramię), light (lekki osklepek)} · HC apo = {cupulo, short (ramię bańkowe)}.
   JAM świadomie POZA osią mechanizmu: stan obturacyjny pozycjo-NIEzależny z własnymi parametrami
   {phi, xi, thrG} (kierunek zadaje jam.xi, nie fenotyp; DCPN nie zmienia się z pozycją, więc geo/apo
   traci sens) — kandydat na osobną kartę po D4. Silnik NIE zna wartości "short" w position() i nie
   może jej znać (sonda D4: siad i leżenie opróżniają ramię bańkowe z KAŻDEGO φ₀ w ≤120 s — segment
   nie ma spoczynku, statyka byłaby fałszem konstrukcyjnym); kartę short liczy DYNAMIKA per faza
   (rollShortPhases, wzorzec SCEN_DRIVEN) z wyprowadzonym φ₀ świeżego depozytu. */
const MECHS_BY_PHENO=(canal,v)=> canal==="horizontal" ? (v==="canalo"?["canalo","light"]:["cupulo","short"]) : [v];
// JEDYNY czytelnik pary (variant, mechanism): para niedozwolona (np. "light" wiszące w stanie po
// przejściu na kanał tylny) DEGRADUJE do mechanizmu klasycznego — nigdy wyjątek w renderze.
const mechOf=(variant,mechanism,canal)=> (mechanism!=null && MECHS_BY_PHENO(canal,variant).includes(mechanism)) ? mechanism : variant;
// mapowanie WSTECZNE mech→oś zgodności (gałąź karty geo/apo); "light" żyje na stronie geo, "short" na apo
const variantOfMech=mech=> mech==="light" ? "canalo" : mech==="short" ? "cupulo" : mech;
// TRWAŁOŚĆ (uporczywy/niemęczliwy) — jedna funkcja zamiast rozsianych v==="cupulo" tam, gdzie chodzi
// o trwałość: light się NIE męczy (jak cupulo), short SIĘ męczy i samooczyszcza (jak canalo).
const persistentOf=mech=> mech==="cupulo" || mech==="light";
// φ₀ świeżego depozytu w ramieniu bańkowym = geometryczny ŚRODEK segmentu [SA_MIN, 3°); 3 = CUPULA_DEG
// silnika (stała wewnętrzna). WYPROWADZONY z eksportowanego SA_MIN (wzorzec derivedHold: liczba jest
// wynikiem geometrii, nie stałą). Sonda D4: znaki fenotypu NIECZUŁE na głębokość startu (−40°/−10°
// dają te same kierunki, zdrowe-w-dole zawsze czyści) — środek jest bezpieczny fenotypowo.
const SHORT_PHI0=(Vestibular.SA_MIN.horizontal+3)/2;   // ≈ −21,7°
// Karta Roll dla mech="short": dwie IZOLOWANE nici simulateShortArm z siadu (fazy = rama dydaktyczna
// karty statycznej, jak bltZones; sekwencyjność chore→centrum→zdrowe niesie sesja — R10). Szczyt ξ
// per faza → strzałka+napis+obwiednia z JEDNEGO ξ (konwencja V5). Bramka adhezji bez znaczenia
// (napęd w siadzie ≫ fStat — sonda D4), więc settled:false wystarcza bez maszynerii scenariuszy.
function rollShortPhases(side){
  const k="rollshort#"+side; if(_bltMemo.has(k)) return _bltMemo.get(k);
  const mk=yaw=>{
    const nS=poseNeck("supineFlex", yaw, "up");                  // V24: kark (pivot body)
    const sim=Vestibular.simulateShortArm({canal:"horizontal", side, q0:[1,0,0,0], phi0:SHORT_PHI0, settled:false,
      timeline:[NECK_PREFIX, {q:stepHeadQ("supineFlex", yaw, "up"), tTrans:0.8, tHold:60, pivot:"body", neckPitch:nS.p, neckYaw:nS.y}]});
    let pk=0; for(const s of sim) if(Math.abs(s.xi)>Math.abs(pk)) pk=s.xi;
    return {xi:pk, exited:sim.final.exited, pressed:!!sim.final.pressed, xiEnd:sim.length?sim[sim.length-1].xi:0};
  };
  const out={aff:mk(side==="P"?90:-90), heal:mk(side==="P"?-90:90)};   // aff = ucho CHORE w dole
  _bltMemo.set(k,out); return out;
}
/* ============ V23: karta canalith jam — dane demo (JEDNO źródło parametrów z pinem engine.jam) ============
   JAM_DEMO = czop przy wejściu do odnogi wspólnej (pcrus = ARC_SPAN.posterior − crusArc 12 = 306,8°) —
   te same wartości konsumuje wyrocznia engine.jam (fallback wewnętrzny snapshotu) i karta: rozjazd
   karta↔pin strukturalnie niemożliwy. Wszystkie liczby karty pochodzą z jamDemo (memo per strona,
   zero literałów w renderze). Progi thr=0,6 (crusGrav) i zapas bond=0,3 g·s = WYBORY KALIBRACYJNE
   silnika (nazwane na karcie). Rampa startowa nici jam (ξ: 0→0,50 przez ~15 s, tauC) to artefakt
   xi0=0, NIE latencja kliniczna — karta czyta wyłącznie KOŃCE segmentów / stany ustalone. */
const JAM_DEMO = Object.freeze({ phi: Vestibular.ARC_SPAN.posterior - 12, xi: 0.5, dir: 1 });
function jamDemo(side){
  const k="jamdemo#"+side; if(_bltMemo.has(k)) return _bltMemo.get(k);
  const run=(plan)=>Vestibular.simulateCanalithJam({canal:"posterior", side, q0:[1,0,0,0], jam:{...JAM_DEMO},
    timeline:maneuverTimeline(plan,"medium")});
  const bounds=(tl)=>{ let tt=0; return tl.map(g=>(tt+=(g.tTrans||0)+(g.tHold||0))); };
  const xiAt=(sim,te)=>{ let v=sim.length?sim[0].xi:0; for(const s of sim){ if(s.t<=te+1e-9) v=s.xi; else break; } return v; };
  const ep=run(epley(side)), se=run(semont(side)), ba=run(bascule(side));
  const yPlan=yacovino(side), yac=run(yPlan), yb=bounds(maneuverTimeline(yPlan,"medium"));
  let minXi=0; for(const s of yac) if(s.xi<minXi) minXi=s.xi;
  // łańcuch: Epley BEZPOŚREDNIO po uwolnieniu (konwencja B7: phi0+xi0+bond0 z final Yacovino;
  // karta uczy sekwencji Yacovino → kontrolny Dix → Epley — liczba dotyczy Epleya od razu po uwolnieniu)
  const post=Vestibular.simulateCanalith({canal:"posterior", side, q0:[1,0,0,0], phi0:yac.final.phi,
    xi0:yac.final.xi, bond0:yac.final.bondFrac, settled:false, timeline:maneuverTimeline(epley(side),"medium")});
  // pozycjo-niezależność: prowokacja Dix + powrót do siadu (istniejący akt) pod jamem — KOŃCE segmentów
  const dixTl=actTimeline("dix", side);
  const dix=Vestibular.simulateCanalithJam({canal:"posterior", side, q0:[1,0,0,0], jam:{...JAM_DEMO}, timeline:dixTl});
  const endXi=bounds(dixTl).filter(te=>te>0).map(te=>xiAt(dix,te));   // V24: NECK_PREFIX daje granicę t=0 — odfiltrowana (chip czytałby ξ z granicy prefiksu, nie stan ustalony)
  // mapa napędu uwolnienia: rel = −dir·dot(g,tang(φ)) = −dir·driveAt(…,tauP=1) w pozach standardowych;
  // UWAGA churn: pozy diagnostyczne czekają na okablowanie karku B8 — dryf tych liczb przy B8 to
  // oczekiwany rebaseline, nie regresja.
  const rel=(body,yaw,face)=> -(JAM_DEMO.dir)*Vestibular.driveAt("posterior", side, JAM_DEMO.phi, stepHeadQ(body,yaw,face), 1);
  const yA=side==="P"?45:-45;
  const relMap={ sit:rel("sit",0,"fwd"), dixAff:rel("supineHang",yA,"up"), dixHeal:rel("supineHang",-yA,"up"),
    supine:rel("supineFlex",0,"up"), deepHang:rel("supineDeepHang",0,"up"), chin:rel("supineChin",0,"up") };
  const out={
    epley:{jammed:ep.final.jammed, tRelease:ep.final.tRelease, xiEnd:ep.length?ep[ep.length-1].xi:0},
    semont:{jammed:se.final.jammed, tRelease:se.final.tRelease},
    bascule:{jammed:ba.final.jammed, tRelease:ba.final.tRelease},
    yac:{jammed:yac.final.jammed, tRelease:yac.final.tRelease,
         relDelta:yac.final.tRelease!=null?yac.final.tRelease-yb[0]:null,
         minXi, finalPhi:yac.final.phi, exited:yac.final.exited},
    postEpley:{exited:post.final.exited, expelDur:post.final.expelDur},
    dix:{jammed:dix.final.jammed, endXi}, relMap, thr:0.6 };   // thr = crusGrav (domyślny próg jam.thrG silnika)
  _bltMemo.set(k,out); return out;
}
// Etykiety chipów mechanizmu (D4/V16) — chipy renderują się tylko, gdy fenotyp ma >1 mechanizm (HC).
function mechLabels(canal, v){
  if(canal!=="horizontal") return null;
  return v==="canalo"
    ? {canalo:{lab:t("Kanalolitiaza — ramię długie","Canalithiasis — long arm"), sub:t("klasyczna · przemijający, męczliwy","classic · transient, fatiguing")},
       light: {lab:t("Light cupula","Light cupula"), sub:t("trwały geo (>1 min) · null point","persistent geo (>1 min) · null point")}}
    : {cupulo:{lab:t("Kupulolitiaza","Cupulolithiasis"), sub:t("klasyczna · uporczywy, niemęczliwy","classic · persistent, non-fatiguing")},
       short: {lab:t("Ramię bańkowe (short arm)","Short (ampullar) arm"), sub:t("przemijający apo · męczliwy","transient apo · fatiguing")}};
}
// dobór manewru leczniczego na podstawie testu + wariantu (+ opcjonalny mechanizm D4/V16;
// brak parametru albo mechanizm klasyczny = dokładnie dawny wynik). UWAGA: primary może być null
// (light cupula — manewrów nie ma) — render MUSI to strażnikować, zanim sięgnie do MANEUVERS[k].
// D11/V18 (ocena II, KLIN-3): rozszerzenia CZYSTO TEKSTOWE — pola opcjonalne:
//   home = nota domowa (Brandt-Daroff przy kanale tylnym; FPP Vannucchiego przy HC geo),
//   altNotes = {kluczManewru → dopisek przy przycisku alternatywy} (dziś: lempert „po konwersji").
// home ŚWIADOMIE nieobecne przy headhang (kanał przedni: najpierw wykluczenie ośrodkowe — nie wolno
// wysyłać do domu z ćwiczeniami przed wykluczeniem CPN) i przy HC apo (domowej alternatywy nie ma).
function recommend(testKey,variant,mech){
  // Brandt-Daroff: WSPÓLNA treść dla obu wariantów kanału tylnego (habituacja/dyspersja niezależna
  // od mechanizmu); 31–61% = zakres RD z Özgirgin 2024 — spójnie z kartą RD przewodnika (D5/V17).
  const BD=t("Ćwiczenia Brandta-Daroff (dom): z siadu szybko połóż się na bok, odczekaj do ustąpienia zawrotu (co najmniej 30 s), usiądź, powtórz na drugi bok; 5 powtórzeń w serii, 2–3 serie dziennie. Mechanizm habituacyjno-dyspersyjny — skuteczność niższa niż repozycji, ale nie wymaga badającego. Rola: uzupełnienie PO manewrze (m.in. przy zawrotach rezydualnych, które po skutecznej repozycji dotyczą 31–61% chorych) albo postępowanie tymczasowe, gdy manewr repozycyjny jest niedostępny lub źle tolerowany.","Brandt-Daroff exercises (home): from sitting, lie down quickly onto one side, wait until the vertigo subsides (at least 30 s), sit up, repeat to the other side; 5 repetitions per set, 2–3 sets daily. A habituation-dispersion mechanism — less effective than repositioning, but requires no examiner. Role: an adjunct AFTER the maneuver (e.g. for residual dizziness, which follows successful repositioning in 31–61% of patients) or an interim measure when a repositioning maneuver is unavailable or poorly tolerated.");
  if(testKey==="dix"){
    return variant==="canalo"
      ? {primary:"epley",alts:["semont"],home:BD,note:t("Kanalolitiaza kanału tylnego — preferowany manewr Epleya; alternatywnie Semont.","Posterior-canal canalithiasis — the Epley maneuver is preferred; Semont as an alternative.")}
      : {primary:"semont",alts:["bascule","epley"],home:BD,note:t("Kupulolitiaza kanału tylnego (rzadka) — preferowany manewr uwalniający Semonta. W postaciach opornych/atypowych rozważ manewr Bascule („huśtawka” bok–bok odrywa złóg od osklepka). Epley służy głównie kanalolitiazie.","Posterior-canal cupulolithiasis (rare) — the Semont liberatory maneuver is preferred. In resistant/atypical forms consider the Bascule maneuver (side-to-side 'rocking' detaches the debris from the cupula). Epley mainly serves canalithiasis.")};
  }
  if(testKey==="headhang"){
    return variant==="canalo"
      ? {primary:"yacovino",alts:[],note:t("Kanalolitiaza kanału przedniego — manewr Yacovino (deep head-hang → szybki ruch brody do klatki). Kanał przedni jest rzadki; oczopląs to czysty downbeat — strony nie ustalisz oczopląsem, różnicuj kontekstem i reakcją na manewr.","Anterior-canal canalithiasis — the Yacovino maneuver (deep head-hang → quick chin-to-chest movement). The anterior canal is rare; the nystagmus is a pure downbeat — you cannot establish the side by nystagmus, differentiate by context and response to the maneuver.")}
      : {primary:"yacovino",alts:[],note:t("Kupulolitiaza kanału przedniego (bardzo rzadka) — postępowanie jak w kanalolitiazie; rozważ ponowną ocenę i wykluczenie przyczyny ośrodkowej (izolowany downbeat).","Anterior-canal cupulolithiasis (very rare) — manage as for canalithiasis; consider re-evaluation and ruling out a central cause (isolated downbeat).")};
  }
  // roll / bowlean / lyingdown → kanał poziomy; mechanizmy alternatywne (D4/V16) tylko tu —
  // mechOf degraduje "light"/"short" poza HC, więc gałęzie dix/headhang wyżej ich nie widzą.
  const m = mech==null ? variant : mech;
  if(m==="light") return {primary:null, alts:[], note:t("Light cupula — manewry repozycyjne NIESKUTECZNE (0% w opisanych seriach): nie ma wolnego złogu do repozycji. Postać ustępuje SAMOISTNIE w dniach–tygodniach. Leczeniem jest rozpoznanie (null point!), wyjaśnienie i obserwacja; unikaj supresantów przedsionkowych. Uporczywy DCPN bez punktu zerowego lub objawy ośrodkowe → diagnostyka ośrodkowa.","Light cupula — repositioning maneuvers are INEFFECTIVE (0% in reported series): there is no free debris to reposition. The form resolves SPONTANEOUSLY within days–weeks. The treatment is recognition (the null point!), explanation and observation; avoid vestibular suppressants. A persistent DCPN without a null point or central signs → central work-up.")};
  if(m==="short") return {primary:"gufoniApo", alts:["lempert"], note:t("Wolny złóg w RAMIENIU BAŃKOWYM (apo przemijający): postać często czyści się SAMA diagnostyką i siadem — faza „zdrowe ucho w dole” testu Roll wyprowadza złóg do łagiewki (fizyka silnika). Jeśli oczopląs się utrzymuje, postępuj jak w postaci apogeotropowej (Gufoni apo → ponowny test); ustalonego manewru swoistego dla ramienia bańkowego piśmiennictwo nie ma. UWAGA — nie mylić z canalith jam: predykcja „Epley nieskuteczny / Yacovino skuteczny” dotyczy zaklinowanego złogu (jam), nie ramienia bańkowego.","Free debris in the SHORT (ampullar) ARM (transient apo): the form often clears ITSELF through diagnostics and sitting — the Roll test's healthy-ear-down phase carries the debris into the utricle (engine physics). If the nystagmus persists, manage as the apogeotropic form (apogeotropic Gufoni → re-test); the literature has no established short-arm-specific maneuver. CAUTION — do not confuse with canalith jam: the \"Epley ineffective / Yacovino effective\" prediction concerns an impacted plug (jam), not the short arm.")};
  return variant==="canalo"
    ? {primary:"lempert",alts:["gufoniGeo"],
       home:t("Pozycja wymuszona Vannucchiego (FPP, dom): sen przez całą noc na boku ZDROWYM — grawitacja przez wiele godzin wyprowadza złóg z kanału poziomego ku łagiewce. Silnik odtwarza to emergentnie: w sesji ciągłej długie leżenie na zdrowym boku opróżnia kanał (ta sama fizyka, którą pokazują scenariusze historii pozycyjnej). Opcja, gdy manewr jest niedostępny lub źle tolerowany, oraz uzupełnienie po repozycji.","Vannucchi's forced prolonged position (FPP, home): sleep through the whole night on the HEALTHY side — over many hours gravity carries the debris out of the horizontal canal toward the utricle. The engine reproduces this emergently: in the continuous session, prolonged lying on the healthy side empties the canal (the same physics the positional-history scenarios show). An option when a maneuver is unavailable or poorly tolerated, and an adjunct after repositioning."),
       note:t("Geotropowy (kanalolitiaza) kanału poziomego — rolka Lemperta ku stronie zdrowej lub manewr Gufoniego (geotropowy).","Geotropic (canalithiasis) of the horizontal canal — Lempert roll toward the healthy side or the Gufoni maneuver (geotropic).")}
    : {primary:"gufoniApo",alts:["zuma","lempert"],altNotes:{lempert:t("po konwersji","after conversion")},
       note:t("Apogeotropowy (kupulolitiaza) — manewr Gufoniego (apogeotropowy) przekształca postać w geotropową; następnie ponowny test i leczenie postaci geotropowej. Rolka Lemperta ma sens dopiero PO konwersji — nie działa na złóg związany z osklepkiem. W literaturze opisano też manewry celowane wprost w postać apogeotropową — Zuma e Maia i Kim — próbujące oderwać złóg od osklepka bez etapu konwersji; stosuj według dostępności i własnego doświadczenia.","Apogeotropic (cupulolithiasis) — the Gufoni maneuver (apogeotropic) converts the form into a geotropic one; then re-test and treat the geotropic form. The Lempert roll makes sense only AFTER conversion — it does not act on debris bound to the cupula. The literature also describes maneuvers aimed directly at the apogeotropic form — Zuma e Maia and Kim — which try to detach the debris from the cupula without a conversion stage; use according to availability and your own experience.")};
}
// Klasyfikacja podtypu BPPV wg kryteriów Bárány Society (ICVD 2015): mapuje (kanał, wariant, strona, tryb downbeat)
// na formalną etykietę + poziom pewności (established/emerging) + cechy różnicujące (latencja/czas/męczliwość/kierunek/
// strona chora). Czysta funkcja kliniczna — jak recommend(); zasila kartę „Klasyfikacja" w diagnostyce. NIE zmienia
// fizyki — synteza z konwencji już zakodowanych w DIAG (latNote/features). [Kryteria źródłowe: Bárány/ICVD 2015 —
// von Brevern i wsp.; ocena II C: dawny odnośnik „engine_doc: KRYTERIA BARANY" wskazywał sekcję, której nie ma.]
function baranyClassify(canal, variant, side, antMode, mech){
  const S=sideN(side);
  const est={ tier:"established", tierLabel:t("zespół ustalony","established syndrome") };
  const emg={ tier:"emerging",    tierLabel:t("zespół wyłaniający się / atypowy","emerging / atypical syndrome") };
  // D4/V16: mechanizmy alternatywne HC — oba POZA klasyfikacją Bárány/ICVD (uczciwie: tier emerging).
  // mechOf degraduje je poza kanałem poziomym, więc gałęzie anterior/posterior ich nie widzą.
  const m = mech==null ? variant : mech;
  if(canal==="horizontal" && !antMode && m==="light")
    return { ...emg, subtype:t("Zespół BPPV-podobny — light cupula (poza klasyfikacją ICVD)","BPPV-like syndrome — light cupula (outside the ICVD classification)"),
      crit:[[t("Latencja","Latency"),t("brak","none")],[t("Czas trwania","Duration"),t("uporczywy (>1 min)","persistent (>1 min)")],[t("Męczliwość","Fatigability"),t("nie","no")],
            [t("Kierunek","Direction"),t("geotropowy (ku uchu w dole) — jak kanalolitiaza, ale TRWAŁY","geotropic (toward the lower ear) — like canalithiasis, but PERSISTENT")],
            [t("Punkt zerowy (null point)","Null point"),t(`wspólny z postacią heavy: ~10–30° ku uchu choremu (model: ${nullTxt(side)})`,`common with the heavy form: ~10–30° toward the affected ear (model: ${nullTxt(side)})`)],
            [t("Strona chora","Affected side"),`${S} — ${t("SILNIEJSZA reakcja + null point","STRONGER response + null point")}`]],
      redflag:t("Trwały geotropowy DCPN BEZ punktu zerowego albo z punktem obustronnym → flaga OŚRODKOWA (co ~8. chory z trwałym geotropowym oczopląsem ma zmianę móżdżku). Manewry repozycyjne nieskuteczne (0% w seriach) — ustępuje samoistnie w dni–tygodnie; „light cupula” to nazwa wzorca, mechanizm nieustalony (5 hipotez) — formalnie raportuj jako uporczywy geotropowy DCPN (poza katalogiem ICVD 2015).","A persistent geotropic DCPN WITHOUT a null point or with a bilateral one → a CENTRAL flag (~1 in 8 patients with persistent geotropic nystagmus has a cerebellar lesion). Repositioning maneuvers are ineffective (0% in series) — resolves spontaneously within days–weeks; \"light cupula\" names a pattern, the mechanism is unsettled (5 hypotheses) — formally report as a persistent geotropic DCPN (outside the ICVD 2015 catalogue).") };
  if(canal==="horizontal" && !antMode && m==="short")
    return { ...emg, subtype:t("BPPV kanału poziomego — kanalolitiaza ramienia bańkowego (short arm)","Horizontal-canal BPPV — short-arm canalithiasis"),
      crit:[[t("Latencja","Latency"),t("krótka","brief")],[t("Czas trwania","Duration"),t("przemijający (przy uchu chorym w dole może trwać — złóg dociśnięty do osklepka)","transient (may last with the affected ear down — debris pressed against the cupula)")],
            [t("Męczliwość","Fatigability"),t("tak — ramię się samooczyszcza","yes — the arm self-clears")],
            [t("Kierunek","Direction"),t("apogeotropowy (ku uchu w górze) — jak kupulolitiaza, ale PRZEMIJAJĄCY","apogeotropic (toward the upper ear) — like cupulolithiasis, but TRANSIENT")],
            [t("Punkt zerowy (null point)","Null point"),t("jednostronny, nie wspólny — różnicuje od kupulopatii","one-sided, not common — differentiates from cupulopathy")],
            [t("Strona chora","Affected side"),`${S} — ${t("SŁABSZA reakcja","WEAKER response")}`]],
      redflag:t("R11: apogeotropia ≠ kupulolitiaza — apo PRZEMIJAJĄCY i męczliwy to wolny złóg w ramieniu bańkowym; uporczywy i powtarzalny — prawdziwa kupulopatia. Faza „zdrowe ucho w dole” testu Roll często czyści ramię (test bywa samoleczący).","R11: apogeotropy ≠ cupulolithiasis — a TRANSIENT, fatiguing apo is free debris in the short (ampullar) arm; persistent and repeatable — true cupulopathy. The Roll test's healthy-ear-down phase often clears the arm (the test can be self-treating).") };
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
        crit:[[t("Latencja","Latency"),t("sekundy","seconds")],[t("Czas trwania","Duration"),"< 1 min"],[t("Męczliwość","Fatigability"),t("tak","yes")],[t("Kierunek","Direction"),t("geotropowy (ku uchu w dole)","geotropic (toward the lower ear)")],[t("Strona chora","Affected side"),`${S} — ${t("SILNIEJSZA reakcja","STRONGER response")}`]],
        redflag:t("Geotropowy DCPN UPORCZYWY (>1 min), bez latencji, NIEmęczliwy → light cupula (poza klasyfikacją Bárány): manewry repozycyjne nieskuteczne (0% w seriach), ustępuje samoistnie w dniach–tygodniach; płaszczyzna zerowa ~10–30° skrętu ku uchu choremu potwierdza stronę (mini-karta na teście Roll). Ośrodkowo: co ~8. chory z trwałym geotropowym oczopląsem ma zmianę móżdżku (migdałek) — brak punktu zerowego lub punkt obustronny to flaga ośrodkowa.","A PERSISTENT geotropic DCPN (>1 min), without latency, NON-fatiguing → light cupula (outside the Bárány classification): repositioning maneuvers are ineffective (0% in series), resolves spontaneously in days–weeks; a null plane at ~10–30° of rotation toward the affected ear confirms the side (mini-card on the Roll test). Central caveat: ~1 in 8 patients with persistent geotropic nystagmus has a cerebellar (tonsil) lesion — an absent or bilateral null point is a central flag.") }
    : { ...est, subtype:t("BPPV kanału poziomego — kupulolitiaza (apogeotropowy)","Horizontal-canal BPPV — cupulolithiasis (apogeotropic)"),
        crit:[[t("Latencja","Latency"),t("brak / krótka","none / brief")],[t("Czas trwania","Duration"),t("uporczywy","persistent")],[t("Męczliwość","Fatigability"),t("nie","no")],[t("Kierunek","Direction"),t("apogeotropowy (ku uchu w górze)","apogeotropic (toward the upper ear)")],[t("Punkt zerowy (null point)","Null point"),t("zanik przy ~10–30° skrętu ku uchu choremu","abolished at ~10–30° rotation toward the affected ear")],[t("Strona chora","Affected side"),`${S} — ${t("SŁABSZA reakcja","WEAKER response")}`]],
        redflag:t("Uporczywy pozycyjny DCPN bez punktu zerowego, kierunek niemieszczący się w jednym kanale lub ataksja → rozważ przyczynę OŚRODKOWĄ (CPN — przełącz na widok „Ośrodkowy”). Trwały GEOTROPOWY oczopląs >1 min sugeruje light cupula, nie kanalolitiazę; apo PRZEMIJAJĄCY i męczliwy → wolny złóg w ramieniu bańkowym (D10), nie kupulopatia.","Persistent positional DCPN without a null point, a direction that fits no single canal, or ataxia → consider a CENTRAL cause (CPN — switch to the \"Central\" view). Persistent GEOTROPIC nystagmus >1 min suggests light cupula, not canalithiasis; a TRANSIENT, fatiguing apo → free debris in the short (ampullar) arm (D10), not cupulopathy.") };
}
/* ============ D7/V21: rdzeń egzaminu — odpowiedź pacjenta na pozę fazy DOWOLNEGO testu ============
   JEDNA ścieżka DYNAMICZNA dla każdego mechanizmu (statyka nysFromGeom jest pozycjo-niezależna —
   w cross-teście byłaby fabrykacją): canalo→simulateCanalith, cupulo→simulateCupulolith (przez
   engineXi; light fasadą). Suma PUNKTOWA po wspólnej osi czasu (dt symulacji) — sonda oceny II
   potwierdziła addytywność wektorów {h,v,t} RÓWNOCZESNYCH (brak sprzężeń między kanałami); suma
   szczytów izolowanych zawyżałaby amplitudę (składniki szczytują w różnych chwilach). Odczyt karty
   w argmax ‖V‖∞. Wzorce kierunkowe per zmiana z dynNystagmus (JEDYNE źródło rektyfikacji Ewalda II),
   znormalizowane do ∞-normy 1, żeby mono-przypadek czytał się jak karty kanoniczne (strength =
   intensity). Kind sumy = DOMINANTA (bez nowego kindu „mixed” — konsument startNys jest binarny);
   mieszaninę niesie etykieta GENEROWANA z tego samego wektora co strzałka i pełny anat dialu. */
const TEST_OF_CANAL={posterior:"dix", horizontal:"roll", anterior:"headhang"};   // klucz odpowiedzi: test macierzysty kanału (odwrócenie DIAG[k].canal — jawny 3-wpisowy słownik)
const _examMemo=new Map();
function examPhaseNys(lesions, q, rep){
  rep=rep||0;
  const key=JSON.stringify(lesions)+"|"+(q||[]).map(x=>(+x).toFixed(6)).join(",")+"|"+rep;
  if(_examMemo.has(key)) return _examMemo.get(key);
  if(_examMemo.size>400) _examMemo.clear();               // klucz niesie pełne zmiany+pozę+rep (brak kolizji) — czapka tylko na rozmiar
  const parts=lesions.map(l=>{
    const eff = l.mech || l.variant;                      // mechanizm efektywny zmiany (null → klasyczny wariantu)
    const persistent = persistentOf(eff);
    // rep tylko dla zmian PRZEJŚCIOWYCH i przez SILNIK (init.rep → fatigueFactor w ξ) — render
    // ustawia fatigue=1, żeby męczliwości nie liczyć dwa razy (wzorzec sesji V10).
    const sim = engineXi(l.canal, l.side, persistent, q, (!persistent && rep>0)?{rep}:null, eff==="light"?"light":undefined);
    const pat = Vestibular.dynNystagmus(l.canal, l.side, 1);
    const nrm = Math.max(Math.abs(pat.h||0), Math.abs(pat.v||0), Math.abs(pat.t||0)) || 1;
    let pk=0; for(const s of sim) if(Math.abs(s.xi)>Math.abs(pk)) pk=s.xi;
    return {l, eff, persistent, sim, nrm, xiPk:pk};
  });
  const dt=0.05, nmax=Math.max(...parts.map(p=>p.sim.length));
  const mag=new Array(nmax);
  let best={k:0, m:0, V:{h:0,v:0,t:0}};
  for(let k=0;k<nmax;k++){
    let H=0,Vv=0,T=0;
    for(const p of parts){
      const s=p.sim[Math.min(k, p.sim.length-1)]; if(!s) continue;
      const N=Vestibular.dynNystagmus(p.l.canal, p.l.side, s.xi);
      H+=N.intensity*N.h/p.nrm; Vv+=N.intensity*N.v/p.nrm; T+=N.intensity*N.t/p.nrm;
    }
    const m=Math.max(Math.abs(H),Math.abs(Vv),Math.abs(T));
    mag[k]=Math.min(1,m);
    if(m>best.m) best={k, m, V:{h:H,v:Vv,t:T}};
  }
  // zmiana DOMINUJĄCA w chwili odczytu — jej pełna tożsamość (canal/side/persistent) płynie do nys,
  // żeby obwiednia animacji i sufiks trwałości grały z właściwej fizyki (mono: dokładnie ta zmiana).
  let dom=parts[0], domI=-1;
  for(const p of parts){
    const s=p.sim[Math.min(best.k, p.sim.length-1)];
    const c=s ? Vestibular.dynNystagmus(p.l.canal, p.l.side, s.xi).intensity : 0;
    if(c>domI){ domI=c; dom=p; }
  }
  const V=best.V, m=best.m||1e-9, camRx=Scene3D.CAMERAS.frontal.right[0];
  const horiz = Math.abs(V.h) >= Math.max(Math.abs(V.v), Math.abs(V.t));
  const hasH = Math.abs(V.h) >= XI_CARD, hasVT = Math.max(Math.abs(V.v), Math.abs(V.t)) >= XI_CARD;
  const strength = Math.min(1, best.m);
  // etykieta OBSERWACYJNA z TEGO SAMEGO wektora co strzałka (żadnych słów „chora/zdrowa” — egzamin);
  // mieszanina obu składowych ≥ progu = obraz więcej niż jednego kanału (to JEST obserwowalne).
  const vtTxt = V.v<0 ? t("oczopląs ↓ (downbeat)","nystagmus ↓ (downbeat)") : t("oczopląs ↑ + skrętny","nystagmus ↑ + torsional");
  const label = (hasH && hasVT)
    ? t("oczopląs MIESZANY: poziomy + pionowo-skrętny — obraz więcej niż jednego kanału","MIXED nystagmus: horizontal + vertical-torsional — the picture of more than one canal")
    : hasH ? t("oczopląs poziomy","horizontal nystagmus")
    : hasVT ? vtTxt
    : t("bez wyraźnego oczopląsu","no distinct nystagmus");
  // obwiednie sumy (tylko pacjent wielozmianowy — mono gra własną fizyką przez pełną tożsamość nys):
  // _envI (oczy: env NIESIE intensywność — kontrakt envOv startNys) · _env01 (dial: kształt 0..1, amplitudę niesie strength)
  let tEnd=(nmax-1)*dt;
  if(!dom.persistent){ for(let k=nmax-1;k>=0;k--){ if(mag[k]>=0.03*best.m){ tEnd=k*dt; break; } } }
  const envAt=ts=>{ if(ts<=0) return 0; const i=Math.min(nmax-1, Math.max(0, Math.round(ts/dt))); return mag[i]||0; };
  const envI={env:envAt, tEnd}, env01={env:ts=>best.m>0?envAt(ts)/Math.min(1,best.m):0, tEnd};
  const out={
    kind: horiz ? "horizontal" : "upbeatTorsional",
    dir:  horiz ? Math.sign(V.h*camRx) : Math.sign(V.t*camRx),
    vdir: Math.sign(V.v) || 1,
    strength, anat:{h:V.h/m, v:V.v/m, t:V.t/m},
    label: label + (strength>=XI_CARD && strength<0.25 ? t(" (słaby)"," (weak)") : ""),
    dom:{canal:dom.l.canal, side:dom.l.side, persistent:dom.persistent, eff:dom.eff},
    multi: parts.length>1, envI, env01,
    parts: parts.map(p=>({canal:p.l.canal, side:p.l.side, variant:p.l.variant, mech:p.l.mech, xiPk:p.xiPk, persistent:p.persistent})),
  };
  _examMemo.set(key,out); return out;
}
// Klucz odpowiedzi egzaminu — WYŁĄCZNIE z istniejących funkcji klinicznych (jedno źródło prawdy,
// zero drugiej implementacji): per zmiana baranyClassify + recommend(test macierzysty kanału).
function examAnswerKey(lesions){
  return lesions.map(l=>({ canal:l.canal, side:l.side, variant:l.variant, mech:l.mech,
    classify: baranyClassify(l.canal, l.variant, l.side, false, l.mech||undefined),
    rec: recommend(TEST_OF_CANAL[l.canal], l.variant, l.mech||undefined) }));
}

const CANAL_OF={epley:"posterior",semont:"posterior",bascule:"posterior",lempert:"horizontal",gufoniGeo:"horizontal",gufoniApo:"horizontal",yacovino:"anterior",zuma:"horizontal",kim:"horizontal"};

export { HC_TILT_DEG, HC_FLEX_DEG, HC_TILT_TXT, SIDE, stepPivot, otherSide, earToScreen, yawToA, makeManualOrientation, epley, semont, bascule, lempert, yacovino, gufoniGeo, gufoniApo, zuma, kim, MANEUVERS, CANALS, XI_CARD, BLT_HISTORY, bltInit, bltPhases, bltZones, bltDirWord, ldtPhases, nullScan, nullYawOf, SCEN_DRIVEN, TAU_BOND, readhesion, SESSION_REST, SIT_SEG, ACT_STEPS, PHASE_OF, actTimeline, sessionInit, sessionSim, sessionPreview, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, POSE_SPEC, poseOf, headQOf, stepGravity, stepHeadQ, composeHead, SK, SKEL, fkJoints, POSE3D, TORSO_Q, bodyClass, bodyJoints, poseSpec, gravArrowFor, sizeRadius, holdMult, sizedSeconds, derivedHold, maneuverTimeline, maneuverSim, ENS_GRID, ensembleSim, featsByVariant, DIAG, variantLabels, MECHS_BY_PHENO, mechOf, variantOfMech, persistentOf, SHORT_PHI0, rollShortPhases, mechLabels, recommend, baranyClassify, CANAL_OF, PRIORS, mulberry32, randomPatient, TEST_OF_CANAL, examPhaseNys, examAnswerKey, TEVS_REST, tevsDemoSim, JAM_DEMO, jamDemo, PROVOKE_POSE, poseNeck, provokeNeck, NECK_PREFIX };

// handlery inline (onclick=…) — powierzchnia globalna jak w klasycznym <script>
if (typeof window !== "undefined")   // guard: moduł importowalny też w czystym Node (tools/bridge-check.mjs)
Object.assign(window, { makeManualOrientation, epley, semont, bascule, lempert, yacovino, gufoniGeo, gufoniApo, zuma, kim, nysFromGeom, nysFromDyn, provokeQ, engineXi, xiEnvelope, stepGravity, stepHeadQ, composeHead, fkJoints, bodyClass, bodyJoints, gravArrowFor, sizedSeconds, maneuverTimeline, maneuverSim, variantLabels, recommend });
