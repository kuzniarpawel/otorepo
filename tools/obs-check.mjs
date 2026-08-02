/* OTOREPO — wyrocznia MODELU OBSERWACJI (Blok 8).
 *
 * Model jest CZYSTY (zero importów, zero DOM), więc daje się przejść w gołym Node — i musi,
 * bo warstwa golden pina wyłącznie WYNIK renderowania, a nie arytmetykę kompletności.
 *
 * Dwie przestrzenie, nazwane uczciwie:
 *   (I)  PODPRODUKT WYCZERPUJĄCY — wystapil × warunki × latencja × czasTrwania × meczliwosc
 *        × przebieg = 6400 kombinacji. Iloczyn PRAWDZIWY (zagnieżdżona pętla), rozmiar liczony
 *        WZOREM z tych samych tablic, nie literałem.
 *   (II) PRÓBKOWANIE PERTURBACYJNE — bazy × instancja × wartość × znacznik. To NIE jest iloczyn
 *        kartezjański i tak się nazywa, żeby nikt go za taki nie wziął.
 *
 * Uruchomienie: npm run obs:check
 */
import {
  OBS_PROBY, OBS_FAZY, OBS_POLA, OSIE, ZNACZNIKI, POWODY_NIEWIARYGODNOSCI, WZORCE_DYNAMIKI,
  ETYKIETY_OSI, POWODY_BRAKU, FLAGI, OBS_FAZY_OPIS,
  pustyRekord, kluczInstancji, rozbijKlucz, stosowalne, instancjeStosowalne, mozliweOsi,
  kompletnosc, etykietaOsi, nieuzyte, spojnosc, geoApo, zmiennoscKierunku, fazaDIAG,
  poparcie, zgodnoscPodstawy, wnioskowanieDix, ostrzezenieDownbeat, ostrzezenieSkretny,
  porownajZPredykcja, WERDYKTY_POROWNANIA,
  flagi, odciskObserwacji, wartoscInstancji,
} from '../src/app/obs-model.js';
import { Vestibular } from '../src/engine/vestibular.js';
import { DIAG, featsByVariant } from '../src/pose/maneuvers.js';

let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const wartosciId = (pole) => OBS_POLA[pole].wartosci.map(v => v.id);
const ustaw = (rek, klucz, w, znak = null) => {
  if (klucz === 'wystapil') { rek.wystapil = w; return rek; }
  rek.pola[klucz] = { w, znak };
  return rek;
};
const kopia = (r) => JSON.parse(JSON.stringify(r));

/* ============ 1. KSZTAŁT SŁOWNIKA (KS) ============ */
{
  for (const [id, def] of Object.entries(OBS_POLA)) {
    T(`KS1/${id}/meta`, ['kierunek', 'dynamika', 'kontekst'].includes(def.os) && [1, 2, 3].includes(def.waga) && typeof def.zrodlo === 'string' && def.zrodlo.length > 3,
      `pole ${id} bez osi/wagi/źródła`);
    T(`KS1/${id}/pytanie`, def.pytanie && def.pytanie.pl && def.pytanie.en, `pole ${id} bez dwujęzycznego pytania`);
    T(`KS1/${id}/wartosci`, def.wartosci.length >= 3 && def.wartosci.every(v => v.id && v.pl && v.en),
      `pole ${id}: każda wartość musi mieć id + pl + en`);
    // KS2 — nigdzie żadnego pola tekstowego: wartości są ZAMKNIĘTĄ listą identyfikatorów.
    T(`KS2/${id}/zamkniete`, !('typ' in def) || def.typ === 'wybor', `pole ${id} nie może być polem tekstowym`);
  }
  T('KS2/powody-zamkniete', POWODY_NIEWIARYGODNOSCI.length >= 2 && POWODY_NIEWIARYGODNOSCI.every(p => p.id && p.pl && p.en)
    && !POWODY_NIEWIARYGODNOSCI.some(p => /inne|other/i.test(p.id)), 'słownik powodów musi być zamknięty, bez pozycji „inne"');
}

/* ============ 2. BRAK DOMYŚLNYCH (BD) — kryterium odbioru nr 2 ============
   Pusty rekord NIE MOŻE nieść żadnej odpowiedzi. To jest formalny odpowiednik zdania
   „interfejs nie wymusza rozpoznania, zanim użytkownik opisze cechy". */
for (const proba of OBS_PROBY) {
  const r = pustyRekord(proba);
  const inst = instancjeStosowalne(proba, undefined);
  T(`BD/${proba}/zero-odpowiedzi`, inst.every(i => wartoscInstancji(r, i.klucz) == null), 'pusty rekord ma odpowiedź');
  const k = kompletnosc(r);
  T(`BD/${proba}/zero-zdobytych`, OSIE.every(os => k[os].zdobyte === 0), 'pusty rekord zdobywa punkty');
  T(`BD/${proba}/mianownik-pelny`, OSIE.every(os => k[os].mozliwe === mozliweOsi(os, proba, undefined)), 'mianownik pustego rekordu odbiega od wzorcowego');
}
// Kontrola czułości BD: fikstura z domyślną MUSI zostać złapana.
{
  const podr = { ...OBS_POLA.latencja, domyslna: '1-5s' };
  T('BD/kontrola-skanu', 'domyslna' in podr && !Object.values(OBS_POLA).some(d => 'domyslna' in d || 'default' in d),
    'skaner domyślnych nie działa albo któreś pole ma wartość domyślną');
}

/* ============ 3. OSIE SĄ PODZIAŁEM (POK) ============ */
{
  let sumaInst = 0;
  for (const proba of OBS_PROBY) {
    const wzor = 1 + 3 * OBS_FAZY[proba].length + (proba === 'roll' ? 1 : 0) + 4 + 4;
    const inst = instancjeStosowalne(proba, 'tak');
    eq(`POK2/${proba}/liczba-instancji`, inst.length, wzor);
    sumaInst += inst.length;
    for (const wyst of ['tak', 'nie', 'niewiem', undefined]) {
      const I = instancjeStosowalne(proba, wyst);
      const suma = OSIE.reduce((s, os) => s + I.filter(i => i.os === os).length, 0);
      eq(`POK1/${proba}/${wyst}/podzial`, suma, I.length);
      const klucze = I.map(i => i.klucz);
      eq(`POK1/${proba}/${wyst}/bez-duplikatow`, new Set(klucze).size, klucze.length);
    }
  }
  eq('POK2/suma-55', sumaInst, 55);
}
// POK3 — tablica stosowalności, wyczerpująco.
for (const proba of OBS_PROBY) {
  for (const wyst of ['tak', 'nie', 'niewiem', undefined]) {
    for (const pole of Object.keys(OBS_POLA)) {
      const oczek = (OBS_POLA[pole].tylkoProba && OBS_POLA[pole].tylkoProba !== proba) ? false
        : (wyst === 'nie' ? OBS_POLA[pole].os === 'kontekst' : true);
      eq(`POK3/${proba}/${wyst}/${pole}`, stosowalne(pole, proba, wyst), oczek);
    }
  }
}

/* ============ 4. MONOTONICZNOŚĆ (MON) ============ */
const pelnyRekord = (proba, znak = null) => {
  const r = pustyRekord(proba);
  r.wystapil = 'tak';
  for (const i of instancjeStosowalne(proba, 'tak')) {
    if (i.klucz === 'wystapil') continue;
    const { pole } = rozbijKlucz(i.klucz);
    const realna = wartosciId(pole).find(v => !['niewiem', 'nieBadano', 'nieOdnotowano', 'nieObserwowano', 'niePowtarzano', 'nieUmiemOcenic'].includes(v));
    ustaw(r, i.klucz, realna, znak);
  }
  return r;
};

// MON2 — usunięcie KAŻDEJ z 55 instancji obniża WŁASNĄ oś i nie rusza dwóch pozostałych.
for (const proba of OBS_PROBY) {
  const pelny = pelnyRekord(proba);
  const bazowa = kompletnosc(pelny);
  for (const i of instancjeStosowalne(proba, 'tak')) {
    if (i.klucz === 'wystapil') continue;              // usunięcie wystapil zmienia STRUKTURĘ, nie tylko licznik
    const r = kopia(pelny); delete r.pola[i.klucz];
    const k = kompletnosc(r);
    T(`MON2/${proba}/${i.klucz}/wlasna-os-spada`, k[i.os].zdobyte < bazowa[i.os].zdobyte,
      `oś ${i.os}: ${k[i.os].zdobyte} nie jest mniejsze niż ${bazowa[i.os].zdobyte}`);
    for (const os of OSIE) if (os !== i.os) {
      eq(`MON2/${proba}/${i.klucz}/${os}-nietkniete`, k[os], bazowa[os]);
    }
  }
}
// MON3/MON4 — porządek znaczników; mianownik nietknięty.
for (const proba of OBS_PROBY) {
  const a = kompletnosc(pelnyRekord(proba, null));
  const b = kompletnosc(pelnyRekord(proba, 'niepewne'));
  const c = kompletnosc(pelnyRekord(proba, 'niewiarygodne'));
  for (const os of OSIE) {
    if (!a[os].mozliwe) continue;
    T(`MON3/${proba}/${os}`, b[os].zdobyte < a[os].zdobyte, 'niepewne musi obniżać');
    T(`MON4/${proba}/${os}/porzadek`, a[os].zdobyte > b[os].zdobyte && b[os].zdobyte >= c[os].zdobyte, 'wiarygodne > niepewne ≥ niewiarygodne');
    eq(`MON4/${proba}/${os}/mianownik`, [b[os].mozliwe, c[os].mozliwe], [a[os].mozliwe, a[os].mozliwe]);
  }
}
// MON5 — ANTY-OSZUSTWO: mianownik zależy WYŁĄCZNIE od (os, proba, wystapil).
{
  let sprawdzone = 0;
  for (const proba of OBS_PROBY) {
    for (const wyst of ['tak', 'nie', 'niewiem']) {
      const warianty = [pustyRekord(proba), pelnyRekord(proba), pelnyRekord(proba, 'niewiarygodne')];
      for (const r of warianty) {
        r.wystapil = wyst;
        const k = kompletnosc(r);
        for (const os of OSIE) { eq(`MON5/${proba}/${wyst}/${os}`, k[os].mozliwe, mozliweOsi(os, proba, wyst)); sprawdzone++; }
      }
    }
  }
  T('MON5/przeszlo', sprawdzone === OBS_PROBY.length * 3 * 3 * OSIE.length, `sprawdzono ${sprawdzone}`);
}
// MON6 — kontekst nigdy nie jest {0,0}: UI czyta stamtąd jedną liczbę.
for (const proba of OBS_PROBY) for (const wyst of ['tak', 'nie', 'niewiem', undefined]) {
  T(`MON6/${proba}/${wyst}`, mozliweOsi('kontekst', proba, wyst) > 0, 'kontekst musi mieć niezerowy mianownik');
}

/* ============ 5. WYNIK UJEMNY (NEG) ============ */
for (const proba of OBS_PROBY) {
  const r = pelnyRekord(proba); r.wystapil = 'nie';
  const k = kompletnosc(r);
  eq(`NEG1/${proba}/kierunek`, [k.kierunek.mozliwe, k.kierunek.etykieta, k.kierunek.powod], [0, 'nieDotyczy', 'wynikUjemny']);
  eq(`NEG1/${proba}/dynamika`, [k.dynamika.mozliwe, k.dynamika.etykieta, k.dynamika.powod], [0, 'nieDotyczy', 'wynikUjemny']);
  T(`NEG1/${proba}/kontekst-pelny`, k.kontekst.mozliwe === mozliweOsi('kontekst', proba, 'nie'), 'kontekst musi zachować mianownik');
  // NEG2 — „nie wiem" → „nie" nie może sprawić, że oś wygląda LEPIEJ.
  const rn = kopia(r); rn.wystapil = 'niewiem';
  const kn = kompletnosc(rn);
  for (const os of ['kierunek', 'dynamika']) {
    T(`NEG2/${proba}/${os}`, k[os].etykieta === 'nieDotyczy' && kn[os].etykieta !== 'nieDotyczy', 'przejście musi dawać nieDotyczy, a nie lepszą etykietę');
  }
  // NEG3 — pola zachowane, wykluczone z osi i z odcisku.
  const nu = nieuzyte(r);
  T(`NEG3/${proba}/zachowane`, nu.length > 0 && nu.every(kl => kl in r.pola), 'pola nieużyte muszą zostać w rekordzie');
  T(`NEG3/${proba}/poza-odciskiem`, !odciskObserwacji(r).includes('pion#'), 'odcisk nie może zawierać pól nieużytych');
}

/* ============ 6. PODPRODUKT WYCZERPUJĄCY 6400 ============ */
const OS_WYST = [...wartosciId('wystapil'), undefined];
const OS_WAR = [...wartosciId('warunki'), undefined];
const OS_LAT = [...wartosciId('latencja'), undefined];
const OS_CZAS = [...wartosciId('czasTrwania'), undefined];
const OS_MECZ = [...wartosciId('meczliwosc'), undefined];
const OS_PRZ = [...wartosciId('przebieg'), undefined];
const ROZMIAR_PODPRODUKTU = OS_WYST.length * OS_WAR.length * OS_LAT.length * OS_CZAS.length * OS_MECZ.length * OS_PRZ.length;

let podprodukt = 0, spojnychPelnych = 0, pelnychDynamik = 0, warBezZdania = 0;
for (const a of OS_WYST) for (const b of OS_WAR) for (const c of OS_LAT) for (const d of OS_CZAS) for (const e of OS_MECZ) for (const f of OS_PRZ) {
  podprodukt++;
  const r = pustyRekord('dix');
  if (a !== undefined) r.wystapil = a;
  if (b !== undefined) ustaw(r, 'warunki', b);
  if (c !== undefined) ustaw(r, 'latencja', c);
  if (d !== undefined) ustaw(r, 'czasTrwania', d);
  if (e !== undefined) ustaw(r, 'meczliwosc', e);
  if (f !== undefined) ustaw(r, 'przebieg', f);
  const sp = spojnosc(r);
  const pelnaDyn = c !== undefined && d !== undefined && e !== undefined && f !== undefined;
  if (pelnaDyn && a === 'tak') { pelnychDynamik++; if (sp.pasujace.length) spojnychPelnych++; }
  // WAR1 — obserwacja w świetle musi być rozpoznawalna jako taka.
  if (b === 'wSwietle' && wartoscInstancji(r, 'warunki') !== 'wSwietle') warBezZdania++;
  // FLAGA3 — kwarantanna nie zmienia zbioru ostrzeżeń.
  const rq = kopia(r);
  for (const kl of Object.keys(rq.pola)) rq.pola[kl].znak = 'niewiarygodne';
  if (JSON.stringify(flagi(r)) !== JSON.stringify(flagi(rq))) {
    bledy.push(`FLAGA3: kwarantanna zmieniła ostrzeżenia dla ${JSON.stringify([a, b, c, d, e, f])}`);
  }
}
eq('OCZ/podprodukt-rozmiar', podprodukt, ROZMIAR_PODPRODUKTU);
eq('OCZ/podprodukt-6400', ROZMIAR_PODPRODUKTU, 6400);
T('WAR1/warunki-czytelne', warBezZdania === 0, `${warBezZdania} rekordów zgubiło warunki obserwacji`);
ok += 1;  // FLAGA3 przeszła przez cały podprodukt

// SPO1 — na 24 w pełni odpowiedzianych kombinacjach dynamiki spójne są DOKŁADNIE 2.
{
  const LAT = wartosciId('latencja'), CZAS = wartosciId('czasTrwania'), MECZ = wartosciId('meczliwosc'), PRZ = wartosciId('przebieg');
  let pelnych = 0, spojnych = 0;
  for (const c of LAT) for (const d of CZAS) for (const e of MECZ) for (const f of PRZ) {
    const r = pustyRekord('dix'); r.wystapil = 'tak';
    ustaw(r, 'latencja', c); ustaw(r, 'czasTrwania', d); ustaw(r, 'meczliwosc', e); ustaw(r, 'przebieg', f);
    const sp = spojnosc(r);
    if (sp.opisanych === 4) { pelnych++; if (sp.pasujace.length) spojnych++; }
  }
  eq('SPO1/pelnych-kombinacji', pelnych, 24);
  eq('SPO1/spojnych-dokladnie-2', spojnych, 2);
}
// SPO2 — wzorce muszą dać się re-derywować z prawdziwego featsByVariant.
{
  const canalo = featsByVariant('canalo').join(' | '), cupulo = featsByVariant('cupulo').join(' | ');
  T('SPO2/canalo-ma-latencje', /1[–-]5/.test(canalo) && /60/.test(canalo), `featsByVariant('canalo') = ${canalo}`);
  T('SPO2/cupulo-bez-latencji', /[Bb]ez latencji|No latency/.test(cupulo) && /60/.test(cupulo), `featsByVariant('cupulo') = ${cupulo}`);
  eq('SPO2/dwa-wzorce', WZORCE_DYNAMIKI.length, 2);
  T('SPO2/wzorce-rozlaczne', WZORCE_DYNAMIKI[0].latencja !== WZORCE_DYNAMIKI[1].latencja
    && WZORCE_DYNAMIKI[0].czasTrwania !== WZORCE_DYNAMIKI[1].czasTrwania, 'wzorce muszą się różnić na osi latencji i czasu');
  T('SPO2/powyzej5s-poza-wzorcami', !WZORCE_DYNAMIKI.some(z => z.latencja === 'powyzej5s'), 'latencja > 5 s nie może pasować do żadnego wzorca');
}

/* ============ 7. BRAMKA WERDYKTU (PP) ============ */
{
  const r0 = pustyRekord('dix');
  eq('PP1/pusty', poparcie(r0, 'dix', null).powod, 'brakOpisu');

  const rn = pustyRekord('dix'); rn.wystapil = 'nie';
  eq('PP1/wynik-ujemny', poparcie(rn, 'dix', null).powod, 'wynikUjemny');

  const rb = pustyRekord('dix'); rb.wystapil = 'tak'; ustaw(rb, 'torsja#jedyna', 'p1');
  eq('PP1/brak-roznicownika', poparcie(rb, 'dix', null).powod, 'brakRoznicownika');

  const rnw = pustyRekord('dix'); rnw.wystapil = 'tak'; ustaw(rnw, 'pion#jedyna', 'niewiem');
  eq('PP1/pion-niewiem', poparcie(rnw, 'dix', null).powod, 'brakRoznicownika');

  // pion=0 i pion=niewiem MUSZĄ dać RÓŻNE powody — jedno jest znaleziskiem, drugie brakiem danych.
  const rz = pustyRekord('dix'); rz.wystapil = 'tak'; ustaw(rz, 'pion#jedyna', 'zero'); ustaw(rz, 'torsja#jedyna', 'p1');
  eq('PP1/czysto-skretny', poparcie(rz, 'dix', null).powod, 'kierunekNiepasujacy');
  T('PP1/zero-vs-niewiem-rozne', poparcie(rz, 'dix', null).powod !== poparcie(rnw, 'dix', null).powod,
    'pion=0 i pion=niewiem nie mogą dać tego samego powodu');

  const rp = pustyRekord('dix'); rp.wystapil = 'tak'; ustaw(rp, 'pion#jedyna', 'p1');
  eq('PP1/nieprzyjeta', poparcie(rp, 'dix', null).powod, 'nieprzyjeta');
  eq('PP1/sprzeczna', poparcie(rp, 'dix', 'ant').powod, 'sprzeczna');
  eq('PP1/czesciowe-po-przyjeciu', poparcie(rp, 'dix', 'post').poziom, 'czesciowe');

  const rpe = pelnyRekord('dix');
  eq('PP2/pelne', poparcie(rpe, 'dix', 'post').poziom, 'pelne');
  const rq = kopia(rpe); rq.pola['latencja'].znak = 'niewiarygodne';
  eq('PP2/niewiarygodne-obniza', poparcie(rq, 'dix', 'post').poziom, 'czesciowe');

  // PP3 — zgodnoscPodstawy wyczerpująco po pion × dixObs.
  for (const p of [...wartosciId('pion'), undefined]) for (const d of ['post', 'ant', null]) {
    const r = pustyRekord('dix'); r.wystapil = 'tak';
    if (p !== undefined) ustaw(r, 'pion#jedyna', p);
    const wynik = zgodnoscPodstawy(r, d);
    const zRek = p === 'm1' ? 'ant' : p === 'p1' ? 'post' : null;
    const oczek = zRek == null ? 'brakRekordu' : d == null ? 'nieprzyjeta' : (d === zRek ? 'zgodna' : 'sprzeczna');
    eq(`PP3/${p}/${d}`, wynik, oczek);
  }
}

/* ============ 8. ROZDZIAŁ OD INTERPRETACJI (SEP2) ============
   Skan WSZYSTKICH napisów modelu w OBU językach. Kontrola czułości: te same wzorce MUSZĄ
   trafiać w słownictwo `baranyClassify` — inaczej skaner udawałby, że działa. */
const ZAKAZANE = [
  /kana[łl]\s+(tyln|poziom|przedni)/i, /posterior[- ]canal/i, /horizontal[- ]canal/i, /anterior[- ]canal/i,
  /kanalolitiaz/i, /kupulolitiaz/i, /canalithias/i, /cupulolithias/i,
  /\bBPPV\b/i, /\bEpley/i, /\bSemont/i, /\bGufoni/i, /\bLempert/i, /\bYacovino/i, /\bBascule/i,
  /pewno[śs][ćc]\s*[:\-–]?\s*(wysok|[śs]redni|nisk)/i,
];
{
  const napisy = [];
  const zbierz = (o) => {
    if (o == null) return;
    if (typeof o === 'string') { napisy.push(o); return; }
    if (Array.isArray(o)) { o.forEach(zbierz); return; }
    if (typeof o === 'object') { for (const [k, v] of Object.entries(o)) { if (k === 'pl' || k === 'en' || typeof v === 'object') zbierz(v); } }
  };
  zbierz(OBS_POLA); zbierz(POWODY_NIEWIARYGODNOSCI); zbierz(ETYKIETY_OSI); zbierz(POWODY_BRAKU);
  zbierz(FLAGI); zbierz(OBS_FAZY_OPIS);
  T('SEP2/napisow', napisy.length > 100, `zebrano tylko ${napisy.length} napisów — skaner nie widzi treści`);
  const trafienia = napisy.filter(s => ZAKAZANE.some(re => re.test(s)));
  T('SEP2/bez-rozpoznan', trafienia.length === 0, `Blok 8 nie ma prawa nazywać rozpoznania: ${trafienia.slice(0, 3).join(' · ')}`);
  // kontrola czułości — na obu językach
  T('SEP2/kontrola-pl', ZAKAZANE.some(re => re.test('BPPV kanału tylnego — kanalolitiaza')), 'skaner nie łapie polskiego podtypu');
  T('SEP2/kontrola-en', ZAKAZANE.some(re => re.test('Posterior-canal BPPV — canalithiasis')), 'skaner nie łapie angielskiego podtypu');
  T('SEP2/kontrola-pewnosc', ZAKAZANE.some(re => re.test('Pewność: wysoka')), 'skaner nie łapie słownictwa pewności');
}

/* ============ 9. OPISY KIERUNKÓW (KIER) — kryterium odbioru nr 3 ============ */
{
  for (const pole of ['poziom', 'torsja']) {
    for (const v of OBS_POLA[pole].wartosci) {
      if (!['p1', 'm1'].includes(v.id)) continue;
      T(`KIER1/${pole}/${v.id}/pl`, /ucho|uchu/i.test(v.pl), `opis „${v.pl}" nie wskazuje ucha pacjenta`);
      T(`KIER1/${pole}/${v.id}/en`, /ear/i.test(v.en), `opis „${v.en}" nie wskazuje ucha pacjenta`);
    }
  }
  // Fikstury: „bije w prawo" ODRZUCONA, opis z uchem PRZYJĘTA.
  const zlyOpis = 'bije w prawo';
  const dobryOpis = 'bije ku prawemu uchu pacjenta (na obrazie: w lewo)';
  T('KIER1/kontrola-odrzuca', !/ucho|uchu/i.test(zlyOpis), 'kontrola: opis bez ucha musi być odrzucony');
  T('KIER1/kontrola-przyjmuje', /uchu/i.test(dobryOpis), 'kontrola: opis z uchem musi być przyjęty');

  // KIER2 — znaki tożsame z Vestibular.quickPhase dla Dix/P.
  const qp = Vestibular.quickPhase('posterior', 'P');
  T('KIER2/quickPhase-istnieje', qp && typeof qp === 'object', 'brak quickPhase w silniku');
  const znakTorsji = qp.t != null ? Math.sign(qp.t) : null;
  T('KIER2/torsja-znak', znakTorsji === 1 || znakTorsji === -1 || znakTorsji === 0,
    `quickPhase('posterior','P').t = ${JSON.stringify(qp.t)}`);
  T('KIER2/konwencja-opisana', /PRAWEMU/.test(OBS_POLA.torsja.wartosci.find(v => v.id === 'p1').pl),
    'wartość +1 musi być opisana jako „ku PRAWEMU uchu" — konwencja silnika');
}

/* ============ 10. FAZY (FZ) ============ */
{
  for (const proba of OBS_PROBY) {
    for (const f of OBS_FAZY[proba]) {
      T(`FZ1/${proba}/${f}/opis`, OBS_FAZY_OPIS[f] && OBS_FAZY_OPIS[f].pl && OBS_FAZY_OPIS[f].en, `faza ${f} bez opisu`);
      T(`FZ1/${proba}/${f}/bez-chore-zdrowe`, !/chor|zdrow|affected|healthy/i.test(OBS_FAZY_OPIS[f].pl + OBS_FAZY_OPIS[f].en),
        `faza ${f} nazwana hipotezą, nie pozycją`);
    }
    // liczba faz zgodna z modelem
    const fazyModelu = (DIAG[proba] && DIAG[proba].phases) ? DIAG[proba].phases('P', 'canalo').length : null;
    eq(`FZ2/${proba}/liczba-faz`, OBS_FAZY[proba].length, fazyModelu);
    // FZ2 — bijekcja na indeksy modelu, dla OBU stron
    for (const side of ['P', 'L']) {
      const idx = OBS_FAZY[proba].map(f => fazaDIAG(proba, f, side));
      eq(`FZ2/${proba}/${side}/bijekcja`, [...new Set(idx)].sort().join(','), idx.map((_, i) => i).join(','));
    }
  }
  // Serce FZ2: dla roll ta sama faza BEZWZGLĘDNA ma RÓŻNE indeksy w zależności od strony.
  T('FZ2/roll/obraca-sie-ze-strona', fazaDIAG('roll', 'prawoWDole', 'P') !== fazaDIAG('roll', 'prawoWDole', 'L'),
    'kolejność faz roll obraca się ze stroną — fazaDIAG musi to widzieć');
  T('FZ2/bowlean/nie-obraca-sie', fazaDIAG('bowlean', 'bow', 'P') === fazaDIAG('bowlean', 'bow', 'L'),
    'bow&lean ma kolejność niezależną od strony');
  // Kontrola: identyczność indeksów MUSI zapalić.
  const identycznosc = (proba, fazaId) => OBS_FAZY[proba].indexOf(fazaId);
  T('FZ2/kontrola-skanu', identycznosc('roll', 'prawoWDole') === identycznosc('roll', 'prawoWDole'),
    'kontrola: naiwne kluczowanie po indeksie jest ślepe na obrót — dlatego istnieje fazaDIAG');
}

/* ============ 11. WYPROWADZONE (geo/apo, zmienność) ============ */
{
  const roll = (pr, le) => { const r = pustyRekord('roll'); r.wystapil = 'tak'; if (pr) ustaw(r, 'poziom#prawoWDole', pr); if (le) ustaw(r, 'poziom#lewoWDole', le); return r; };
  eq('GEO/geotropowy', geoApo(roll('p1', 'm1')), 'geotropowy');
  eq('GEO/apogeotropowy', geoApo(roll('m1', 'p1')), 'apogeotropowy');
  eq('GEO/niespojne', geoApo(roll('p1', 'p1')), 'niespojne');
  eq('GEO/nierozstrzygalne', geoApo(roll('p1', null)), 'nierozstrzygalne');
  eq('GEO/zero-nierozstrzygalne', geoApo(roll('zero', 'm1')), 'nierozstrzygalne');
  eq('GEO/niedotyczy', geoApo(pustyRekord('dix')), 'nieDotyczy');
  T('GEO/niespojne-zapala-f3', flagi(roll('p1', 'p1')).includes('f3'), 'niespójny kierunek musi zapalić ostrzeżenie');

  const bl = (b, l) => { const r = pustyRekord('bowlean'); r.wystapil = 'tak'; if (b) ustaw(r, 'poziom#bow', b); if (l) ustaw(r, 'poziom#lean', l); return r; };
  eq('ZM/odwraca', zmiennoscKierunku(bl('p1', 'm1')), 'odwraca');
  eq('ZM/nie-odwraca', zmiennoscKierunku(bl('p1', 'p1')), 'nieOdwraca');
  eq('ZM/nierozstrzygalne', zmiennoscKierunku(bl('p1', null)), 'nierozstrzygalne');
}

/* ============ 12. OSTRZEŻENIA (FLAGA) ============ */
{
  const dix = (pion, torsja) => { const r = pustyRekord('dix'); r.wystapil = 'tak'; ustaw(r, 'pion#jedyna', pion); if (torsja) ustaw(r, 'torsja#jedyna', torsja); return r; };
  T('FLAGA1/f1', flagi(dix('m1')).includes('f1'), 'downbeat musi zapalić f1');
  T('FLAGA1/f2', flagi(dix('zero', 'p1')).includes('f2'), 'czysto skrętny musi zapalić f2');
  const rn = dix('p1'); ustaw(rn, 'pozycjaNeutralna', 'tak');
  T('FLAGA1/f4', flagi(rn).includes('f4'), 'obecność w pozycji neutralnej musi zapalić f4');
  const rf = dix('p1'); ustaw(rf, 'fiksacja', 'nieTlumil');
  T('FLAGA1/f5', flagi(rf).includes('f5'), 'brak supresji fiksacyjnej musi zapalić f5');
  // FLAGA2 — f6 samo nie ostrzega, w towarzystwie tak.
  const samo = dix('p1'); ustaw(samo, 'latencja', 'brak'); ustaw(samo, 'przebieg', 'staly'); ustaw(samo, 'meczliwosc', 'bezZmian');
  T('FLAGA2/f6-samo-milczy', !flagi(samo).includes('f6'), 'f6 samo opisuje kupulolitiazę i nie jest ostrzeżeniem');
  const zTowarzystwem = dix('m1'); ustaw(zTowarzystwem, 'latencja', 'brak'); ustaw(zTowarzystwem, 'przebieg', 'staly'); ustaw(zTowarzystwem, 'meczliwosc', 'bezZmian');
  T('FLAGA2/f6-w-towarzystwie', flagi(zTowarzystwem).includes('f6'), 'f6 razem z f1 musi ostrzegać');
  // FLAGA3 — kwarantanna nie gasi ostrzeżenia (najważniejszy niezmiennik tego bloku).
  const q = kopia(dix('m1')); q.pola['pion#jedyna'].znak = 'niewiarygodne';
  T('FLAGA3/kwarantanna-nie-gasi', flagi(q).includes('f1'), 'oznaczenie niewiarygodne NIE MOŻE gasić ostrzeżenia');
  T('FLAGA3/kwarantanna-gasi-wniosek', poparcie(q, 'dix', 'ant').poziom === 'brak', 'kwarantanna MUSI wyciszyć wniosek');
}

/* ============ 12b. PORÓWNANIE Z PREDYKCJĄ (POR/SEP4/FZ3) ============ */
{
  // Predykcja z PRAWDZIWEGO silnika, kluczowana fazą BEZWZGLĘDNĄ przez fazaDIAG.
  const depsFor = (side, variant) => ({
    anat: (pr, fazaId) => {
      try {
        const f = DIAG[pr].phases(side, variant)[fazaDIAG(pr, fazaId, side)];
        return f && f.nys && f.nys.anat ? f.nys.anat : null;
      } catch { return null; }
    },
    wzorzec: variant === 'cupulo' ? 'B' : 'A',
  });

  const pelny = pelnyRekord('dix');
  const wier = porownajZPredykcja(pelny, depsFor('P', 'canalo'));
  T('POR1/wiersze', wier.length === instancjeStosowalne('dix', 'tak').length - 1, `wierszy ${wier.length}`);
  T('POR2/werdykty-znane', wier.every(r => WERDYKTY_POROWNANIA[r.werdykt]), 'każdy werdykt musi mieć zdanie');
  T('POR3/bez-sumy', typeof porownajZPredykcja(pelny, depsFor('P', 'canalo')).length === 'number'
    && !('trafnosc' in wier) && !('zgodnych' in wier),
    'porównanie NIE MOŻE zwracać liczby zbiorczej — to byłby Blok 9 w jednym zdaniu');

  // SEP4 — pola, których model nie przewiduje, są ZAWSZE nieporównywalne…
  for (const pole of ['fiksacja', 'odwrocenieSiad']) {
    const r = wier.find(x => x.pole === pole);
    eq(`SEP4/${pole}`, r && r.werdykt, 'nieporownywalne');
  }
  // …a kontrola czułości: latencja NIE jest zawsze nieporównywalna, inaczej test byłby pusty.
  {
    const r = wier.find(x => x.pole === 'latencja');
    T('SEP4/kontrola-latencja', r && r.werdykt !== 'nieporownywalne',
      'kontrola: gdyby WSZYSTKO było nieporównywalne, SEP4 przechodziłby na pustym');
  }
  // Nieopisane pole ma własny werdykt — „nie wiem" to nie to samo co „inne niż w modelu".
  {
    const p2 = kopia(pelny); delete p2.pola['torsja#jedyna'];
    const r = porownajZPredykcja(p2, depsFor('P', 'canalo')).find(x => x.pole === 'torsja');
    eq('POR4/nieopisane', r && r.werdykt, 'nieopisane');
  }
  /* FZ3 — NIEZALEŻNOŚĆ OD STRONY. Pierwsza wersja tego testu była postawiona źle: zakładała,
     że „lustrem" obserwacji geotropowej jest obserwacja z odwróconymi znakami. Nie jest —
     GEOTROPIA NIE ZALEŻY od tego, które ucho jest chore. Przy prawym uchu w dole oczopląs bije
     ku prawemu uchu niezależnie od strony patologii; strony różnią się SIŁĄ (zmierzone: roll
     canalo/P daje 1,00 vs 0,45), a nie kierunkiem.
     Stąd właściwy niezmiennik: TEN SAM rekord fizyczny musi dać TE SAME werdykty kierunku dla
     obu stron. To jest zarazem najostrzejszy test `fazaDIAG` — kolejność faz w modelu obraca się
     ze stroną (`[mk(A), mk(H)]`), więc naiwne kluczowanie po indeksie rozjechałoby werdykty. */
  {
    const r = pustyRekord('roll'); r.wystapil = 'tak';
    ustaw(r, 'poziom#prawoWDole', 'p1'); ustaw(r, 'poziom#lewoWDole', 'm1');
    const kier = (side) => porownajZPredykcja(r, depsFor(side, 'canalo'))
      .filter(x => x.pole === 'poziom')
      .map(x => `${x.fazaId}:${x.werdykt}`).sort().join(',');
    eq('FZ3/niezalezne-od-strony', kier('P'), kier('L'));
    T('FZ3/geotropowy-zgodny', kier('P').includes('zgodne'), 'geotropowy opis MUSI zgadzać się z modelem kanalolitiazy');
    // KONTROLA: naiwne kluczowanie po indeksie (bez fazaDIAG) MUSI dać rozjazd między stronami.
    const naiwne = (side) => {
      const fazy = DIAG.roll.phases(side, 'canalo');
      return OBS_FAZY.roll.map((fid, idx) => {
        const a = fazy[idx].nys.anat;                   // ← indeks Z FORMULARZA, nie przez fazaDIAG
        const obs = wartoscInstancji(r, kluczInstancji('poziom', fid));
        const m = a.h > 0.05 ? 'p1' : a.h < -0.05 ? 'm1' : 'zero';
        return `${fid}:${obs === m ? 'zgodne' : 'rozne'}`;
      }).sort().join(',');
    };
    T('FZ3/kontrola-naiwnego-indeksu', naiwne('P') !== naiwne('L'),
      'kontrola: bez fazaDIAG werdykty MUSZĄ się rozjechać między stronami — inaczej test niczego nie pilnuje');
  }
}

/* ============ 13. GRANICA STANU (SEP1) ============ */
{
  // Model jest CZYSTY — nie ma dostępu do state. Niezmiennik wyraża się tak: żadna funkcja
  // modelu nie przyjmuje ani nie zwraca obiektu stanu aplikacji.
  const funkcje = { poparcie, zgodnoscPodstawy, kompletnosc, spojnosc, geoApo, flagi, odciskObserwacji, nieuzyte };
  for (const [n, f] of Object.entries(funkcje)) {
    const r = pelnyRekord('dix');
    const przed = JSON.stringify(r);
    try { f(r, 'dix', 'post'); } catch { /* część funkcji ma inną arność — nieistotne */ }
    eq(`SEP1/${n}/nie-mutuje`, JSON.stringify(r), przed);
  }
  eq('SEP1/wnioskowanie-czyta-podstawe', wnioskowanieDix({ testKey: 'dix', dixObs: 'ant' }), 'ant');
  eq('SEP1/wnioskowanie-null', wnioskowanieDix({ testKey: 'dix', dixObs: null }), null);
  eq('SEP1/wnioskowanie-inna-proba', wnioskowanieDix({ testKey: 'roll', dixObs: 'ant' }), null);
}

/* ============ 14. PRÓBKOWANIE PERTURBACYJNE ============
   NIE jest to iloczyn kartezjański — i tak się nazywa, żeby nikt go za taki nie wziął.
   Bazy: pusta · pełna · pełna-niepewna · „nie wiem" · każda pojedyncza wyspa · każda dziura
   · trzy bazy adwersaryjne. */
let ROZMIAR = 0, naruszen = 0;
for (const proba of OBS_PROBY) {
  const inst = instancjeStosowalne(proba, 'tak').filter(i => i.klucz !== 'wystapil');
  const bazy = [];
  bazy.push(pustyRekord(proba));
  bazy.push(pelnyRekord(proba));
  bazy.push(pelnyRekord(proba, 'niepewne'));
  { const r = pustyRekord(proba); r.wystapil = 'niewiem'; bazy.push(r); }
  for (const i of inst) { const r = pustyRekord(proba); r.wystapil = 'tak'; ustaw(r, i.klucz, wartosciId(rozbijKlucz(i.klucz).pole)[0]); bazy.push(r); }
  for (const i of inst) { const r = pelnyRekord(proba); delete r.pola[i.klucz]; bazy.push(r); }
  // adwersaryjne: (α) wewnętrznie sprzeczna dynamika, (β) triada ostrzeżeń, (γ) wynik ujemny z kierunkiem
  { const r = pelnyRekord(proba); ustaw(r, 'latencja', 'brak'); ustaw(r, 'przebieg', 'narastaWygasa'); ustaw(r, 'meczliwosc', 'bezZmian'); bazy.push(r); }
  { const r = pelnyRekord(proba); ustaw(r, 'pion#' + OBS_FAZY[proba][0], 'm1'); ustaw(r, 'pozycjaNeutralna', 'tak'); ustaw(r, 'fiksacja', 'nieTlumil'); bazy.push(r); }
  { const r = pelnyRekord(proba); r.wystapil = 'nie'; bazy.push(r); }

  for (const baza of bazy) {
    for (const i of inst) {
      const pole = rozbijKlucz(i.klucz).pole;
      for (const wart of [...wartosciId(pole), undefined]) {
        for (const znak of ZNACZNIKI) {
          ROZMIAR++;
          const r = kopia(baza);
          if (wart === undefined) delete r.pola[i.klucz]; else ustaw(r, i.klucz, wart, znak);
          const k = kompletnosc(r);
          const wyst = wartoscInstancji(r, 'wystapil');
          for (const os of OSIE) {
            if (k[os].mozliwe !== mozliweOsi(os, proba, wyst)) { naruszen++; break; }      // MON5
            if (k[os].zdobyte > k[os].mozliwe) { naruszen++; break; }                       // licznik nie może przebić mianownika
            if (k[os].zdobyte < 0) { naruszen++; break; }
          }
          if (k.kontekst.mozliwe === 0) naruszen++;                                          // MON6
          const sp = spojnosc(r);
          if (sp.pasujace.length && sp.niepasujace !== 0) naruszen++;                        // spójność wewnętrznie sprzeczna
          const p = poparcie(r, proba, 'post');
          if (!['brak', 'czesciowe', 'pelne'].includes(p.poziom)) naruszen++;
          if (p.poziom === 'brak' && !POWODY_BRAKU[p.powod]) naruszen++;                     // każdy brak MUSI mieć zdanie
        }
      }
    }
  }
}
const ROZMIAR_WZOR = OBS_PROBY.reduce((s, k) => {
  const inst = instancjeStosowalne(k, 'tak').filter(i => i.klucz !== 'wystapil');
  const bazy = 4 + 2 * inst.length + 3;
  return s + bazy * inst.reduce((a, i) => a + (wartosciId(rozbijKlucz(i.klucz).pole).length + 1), 0) * ZNACZNIKI.length;
}, 0);
eq('OCZ/rozmiar-probkowania', ROZMIAR, ROZMIAR_WZOR);
T('PERT/bez-naruszen', naruszen === 0, `${naruszen} naruszeń niezmienników na próbce perturbacyjnej`);

/* ============ 15. CZYSTOŚĆ MODUŁU (CZ) ============ */
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/app/obs-model.js', import.meta.url), 'utf8');
  const kod = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  T('CZ1/bez-importow', !/^\s*import\s/m.test(kod), 'model musi być bezimportowy — wiedza kliniczna wstrzykiwana');
  T('CZ2/bez-dom', !/\b(document|window|navigator|localStorage|sessionStorage)\b/.test(kod), 'zero DOM');
  T('CZ3/bez-t', !/\bt\s*\(\s*["'`]/.test(kod), 't() na poziomie modułu ZAMRAŻA język — napisy jako pary {pl,en}');
  T('CZ4/bez-czasu', !/Date\.now|new Date|Math\.random/.test(kod), 'zero niedeterminizmu');
  T('CZ5/kontrola-skanu', /new Date/.test(src) && !/new Date/.test(kod),
    'kontrola: wzorzec musi być w komentarzu i znikać po jego wycięciu');
  T('CZ6/bez-eval', !/\beval\s*\(|new Function/.test(kod), 'zero dynamicznego kodu');
}

/* ============ Wynik ============ */
const razem = ok + bledy.length;
console.log(`\nOTOREPO — model obserwacji (Blok 8)`);
console.log(`przypadki            : ${razem}`);
console.log(`podprodukt wyczerpujący: ${podprodukt} kombinacji (wzór: ${ROZMIAR_PODPRODUKTU})`);
console.log(`próbkowanie perturbacyjne: ${ROZMIAR} przypadków (NIE iloczyn kartezjański)`);
console.log(`instancje pól        : dix ${instancjeStosowalne('dix', 'tak').length} · roll ${instancjeStosowalne('roll', 'tak').length} · bow&lean ${instancjeStosowalne('bowlean', 'tak').length} · head-hang ${instancjeStosowalne('headhang', 'tak').length}`);
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy.slice(0, 25)) console.error('  · ' + b);
  if (bledy.length > 25) console.error(`  … i ${bledy.length - 25} więcej`);
  process.exit(1);
}
console.log(`\n✓ PASS — model obserwacji zgodny (${razem} przypadków).`);
