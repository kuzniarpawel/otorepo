/* OTOREPO — wyrocznia HSN: próg prędkości potrząsania i dwufazowość. [H40] Katsarkas 2000
 *
 * ═══ DLACZEGO TA BRAMKA ISTNIEJE ═══
 * Złoty snapshot pina hsn() TYLKO przy domyślnych 150 °/s, bo harness woła `NV.hsn(p)` bez opcji.
 * Zmierzone przy wdrożeniu etapu V26: cała treść progu żyje POZA tym punktem (179 wobec 180 °/s),
 * a przełącznik MONO↔DWUfazowy jest funkcją kompensacji, nie prędkości. Golden nie widzi ani
 * jednego, ani drugiego — gdyby ktoś jutro skasował `directionReliable` albo odwrócił warunek
 * τ_gh>τ_vs, WSZYSTKIE 27 bramek zostałyby zielone. Ta wyrocznia zamyka dokładnie tę dziurę.
 *
 * ═══ CZEGO NIE WYSTARCZY SPRAWDZIĆ ═══
 * „Czy pola istnieją" nie łapie niczego: `directionReliable:false` wpisane na stałe przeszłoby taki
 * test. Dlatego bramka sprawdza ZACHOWANIE na obu brzegach progu, niezależnie przelicza postacie
 * zamknięte t_cross i t_peak z definicji, i wymusza EMERGENT (odwrócenie pojawia się dopiero
 * z kompensacją, a nie jest wpisane w tabelę).
 *
 * ═══ GRANICE ZADEKLAROWANE ═══
 *   · Nie sprawdza, czy próg 180 °/s jest PRAWDZIWY klinicznie — to zostaje robotą czytelnika [H40].
 *   · HSN_PH2_K=0.35 to kalibracja tego silnika, nie liczba z pracy; bramka pilnuje SKUTKÓW K,
 *     nie samej wartości — zmiana K jest dozwolona, o ile emergenty poniżej się utrzymają.
 *   · Nie dotyka „perverted HSN" — to nadal świadomie poza modelem (patrz komentarz przy hsn()).
 *
 * Uruchomienie: npm run hsn:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (nazwa, warunek, detal) => { if (warunek) ok++; else bledy.push(nazwa + (detal ? ' — ' + detal : '')); };
const BLISKO = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));

const { outputFiles } = await esbuild({ entryPoints: [resolve(ROOT, 'src/main.js')], bundle: true,
  format: 'iife', write: false, platform: 'browser', target: 'es2020', logLevel: 'silent' });
const dom = new JSDOM(readFileSync(resolve(ROOT, 'index.html'), 'utf8'), { runScripts: 'dangerously',
  pretendToBeVisual: true, url: 'http://localhost:8777/otorepo.html', virtualConsole: new VirtualConsole() });
const win = dom.window;
const el = win.document.createElement('script'); el.textContent = outputFiles[0].text;
win.document.body.appendChild(el);
win.requestAnimationFrame = () => 0;
const H = win.__OTOREPO_TEST__ || win;
const NV = H.NeuroVOR;
if (!NV) { console.error('✗ hsn:check — brak NeuroVOR w seamie'); process.exit(2); }

const VIS = NV.VIS_THRESH;
const uvh = () => NV.makePatient(NV.SCENARIOS.neuritisR.params);
const komp = (c) => NV.makePatient(Object.assign({}, NV.SCENARIOS.neuritisR.params, { comp: c }));
const zdrowy = () => NV.makePatient({});

/* ── 1. FAZA 1 JEST NIEZALEŻNA OD PRĘDKOŚCI ───────────────────────────────────────────────
   To nie życzenie, tylko własność modelu: mod = gain·S_HZ·Ω po obu stronach, więc Ω skraca się
   w ilorazie asym. Bramka trzyma ten fakt, bo NA NIM stoi zdanie w engine_doc, że próg jest
   warstwą wiarygodności NAD fizyką, a nie zmianą fizyki. */
{
  const p = uvh(), ref = NV.hsn(p, { peakVel: 90 });
  for (const v of [120, 150, 179, 180, 200, 220]) {
    const h = NV.hsn(p, { peakVel: v });
    T('faza1 niezalezna od predkosci: spv0 @' + v, BLISKO(h.spv0, ref.spv0, 1e-12), h.spv0 + ' vs ' + ref.spv0);
    T('faza1 niezalezna od predkosci: beatEar @' + v, h.beatEar === ref.beatEar);
    T('faza1 niezalezna od predkosci: present @' + v, h.present === ref.present);
  }
}

/* ── 2. PRÓG WIARYGODNOŚCI KIERUNKU — oba brzegi ────────────────────────────────────────── */
{
  const p = uvh();
  T('velMin wystawione', NV.hsn(p).velMin === 180, String(NV.hsn(p).velMin));
  T('179 st./s → kierunek NIEwiarygodny', NV.hsn(p, { peakVel: 179 }).directionReliable === false);
  T('180 st./s → kierunek wiarygodny', NV.hsn(p, { peakVel: 180 }).directionReliable === true);
  T('220 st./s → kierunek wiarygodny', NV.hsn(p, { peakVel: 220 }).directionReliable === true);
  T('domyslne 150 st./s leza PONIZEJ progu (swiadomie)',
    NV.hsn(p).peakVel === 150 && NV.hsn(p).directionReliable === false);
  // brak oczoplasu → nie ma czego uwiarygodniac (inaczej „kierunek wiarygodny" przy beatEar=null)
  T('brak HSN → directionReliable false', NV.hsn(zdrowy(), { peakVel: 220 }).directionReliable === false);
  // regresja po zamianie `||` na `==null`: przy dawnym kodzie 0 wracalo do 150 i dawalo pelny oczoplas
  const zero = NV.hsn(p, { peakVel: 0 });
  T('peakVel=0 → brak oczoplasu (nie ciche 150)', zero.peakVel === 0 && zero.present === false,
    'peakVel=' + zero.peakVel + ' spv0=' + zero.spv0);
}

/* ── 3. SZCZYT FAZY 1 NIETKNIĘTY PRZEZ FAZĘ 2 ──────────────────────────────────────────────
   v(0) = spv0 − K·spv0·(1 − 1) = spv0. Gdyby ktoś dopisał fazę 2 jako osobny człon addytywny,
   ten test padnie — i o to chodzi, bo cały golden fazy 1 stoi na tej tożsamości. */
{
  const K = 0.35;
  for (const c of [0, 0.5, 1]) {
    const h = NV.hsn(komp(c));
    const v0 = h.spv0 - K * h.spv0 * (Math.exp(-0) - Math.exp(-0));
    T('v(0) = spv0 przy comp=' + c, BLISKO(v0, h.spv0, 1e-15));
  }
}

/* ── 4. EMERGENT: ODWRÓCENIE POJAWIA SIĘ DOPIERO Z KOMPENSACJĄ ────────────────────────────
   Ostry UVH ma τ_vs 15 wobec τ_gh 25 → faza 2 istnieje matematycznie, ale jest PODPROGOWA.
   Kompensacja skraca τ_vs → ta sama para stałych daje odwrócenie WIDOCZNE. */
{
  const ostry = NV.hsn(komp(0)), pelna = NV.hsn(komp(1));
  T('ostry UVH: faza 2 istnieje, ale niewidoczna',
    ostry.phase2.exists === true && ostry.phase2.present === false && ostry.phase2.spvPeak < VIS,
    'spvPeak=' + ostry.phase2.spvPeak);
  T('ostry UVH: MONOfazowy', ostry.biphasic === false);
  T('skompensowany UVH: DWUfazowy', pelna.biphasic === true && pelna.phase2.spvPeak >= VIS,
    'spvPeak=' + pelna.phase2.spvPeak);
  T('faza 2 bije PRZECIWNIE do fazy 1', !!pelna.phase2.beatEar && pelna.phase2.beatEar !== pelna.beatEar,
    pelna.beatEar + ' → ' + pelna.phase2.beatEar);
  T('faza 2 ma przeciwny znak ekranowy', pelna.phase2.dir === -pelna.dir, pelna.dir + ' vs ' + pelna.phase2.dir);
  let poprz = -Infinity, rosnie = true;
  for (const c of [0, 0.25, 0.5, 0.75, 1]) {
    const s = NV.hsn(komp(c)).phase2.spvPeak;
    if (!(s > poprz)) rosnie = false;
    poprz = s;
  }
  T('szczyt fazy 2 ROSNIE z kompensacja', rosnie);
}

/* ── 5. INTEGRATOR NIESZCZELNY (OŚRODEK) → BRAK ODWRÓCENIA ────────────────────────────────
   τ_gh < τ_vs: składowa niesie znak fazy 1, więc odwrócenia nie ma, a faza 1 gaśnie wolniej.
   To PREDYKCJA MODELU zadeklarowana w engine_doc — bramka pilnuje, żeby nie zniknęła po cichu. */
{
  const leaky = NV.hsn(NV.makePatient(Object.assign({}, NV.SCENARIOS.neuritisR.params, { integratorTau: 2.2 })));
  T('integrator nieszczelny → brak odwrocenia', leaky.phase2.exists === false && leaky.biphasic === false);
  T('integrator nieszczelny → tCross null', leaky.phase2.tCross === null);
  T('integrator nieszczelny → spvPeak 0', leaky.phase2.spvPeak === 0);
}

/* ── 6. POSTACIE ZAMKNIĘTE PRZELICZONE NIEZALEŻNIE ────────────────────────────────────────
   t_cross = ln(1+1/K)/(1/τ_vs−1/τ_gh); t_peak = ln((1+K)·τ_gh/(K·τ_vs))/(1/τ_vs−1/τ_gh).
   Liczone tutaj OD NOWA z definicji, nie przepisane z silnika. */
{
  const h = NV.hsn(komp(1)), K = 0.35, dk = 1 / h.tau - 1 / h.tauGaze;
  const tC = Math.log(1 + 1 / K) / dk, tP = Math.log((1 + K) * h.tauGaze / (K * h.tau)) / dk;
  T('t_cross zgodne z postacia zamknieta', BLISKO(h.phase2.tCross, tC, 1e-12), h.phase2.tCross + ' vs ' + tC);
  T('t_peak zgodne z postacia zamknieta', BLISKO(h.phase2.tPeak, tP, 1e-12), h.phase2.tPeak + ' vs ' + tP);
  T('odwrocenie NASTEPUJE przed szczytem fazy 2', h.phase2.tCross < h.phase2.tPeak);
  const v = (t) => h.spv0 * Math.exp(-t / h.tau) - K * h.spv0 * (Math.exp(-t / h.tauGaze) - Math.exp(-t / h.tau));
  T('v(t_cross) = 0', Math.abs(v(h.phase2.tCross)) < 1e-9, String(v(h.phase2.tCross)));
  T('v przed przejsciem dodatnie', v(h.phase2.tCross * 0.5) > 0);
  T('v po przejsciu ujemne', v(h.phase2.tCross * 1.5) < 0);
  T('|v(t_peak)| = spvPeak', BLISKO(Math.abs(v(h.phase2.tPeak)), h.phase2.spvPeak, 1e-9));
}

/* ── 7. SYMETRIA I CISZA ──────────────────────────────────────────────────────────────────── */
{
  const z = NV.hsn(zdrowy());
  T('zdrowy → brak HSN i brak fazy 2', !z.present && !z.biphasic && z.phase2.spvPeak === 0);
  const bvh = NV.hsn(NV.makePatient(NV.bilateralLoss(0.7)));
  T('BVH (symetria) → brak HSN', bvh.present === false && bvh.biphasic === false);
}

/* ── 8. PROTOKÓŁ WYSTAWIONY PRZEZ clinicalReadout ─────────────────────────────────────────
   Prędkość potrząsania jest cechą BADANIA, nie chorego — więc musi wchodzić drugim argumentem
   i realnie zmieniać zdanie karty, a nie tylko pole w zwracanym obiekcie. */
{
  const p = uvh();
  H.state.lang = 'pl';
  const zdanie = (opts) => (NV.clinicalReadout(p, opts).findings.find(z => /HSN \(po potrz/.test(z)) || '');
  T('domyslnie karta OSTRZEGA o kierunku', /NIE MA CZYM POTWIERD/.test(zdanie(undefined)));
  T('nadprogowo karta podaje kierunek wprost',
    !/NIE MA CZYM POTWIERD/.test(zdanie({ hsnPeakVel: 200 })) && /ku stronie/.test(zdanie({ hsnPeakVel: 200 })));
  T('znak obwodowy zmiekczony ponizej progu',
    NV.clinicalReadout(p).peripheralSigns.some(z => /kierunku nie różnicuj/.test(z)));
  T('znak obwodowy pelny powyzej progu',
    NV.clinicalReadout(p, { hsnPeakVel: 200 }).peripheralSigns.some(z => /HSN ku stronie zdrowej/.test(z)));
  const rec = NV.makePatient(NV.timeline('neuritisR', 21, { recovery: true }));
  T('zdanie DWUFAZOWE u pacjenta z widoczna faza 2',
    NV.clinicalReadout(rec).findings.some(z => /HSN DWUFAZOWY/.test(z)));
  T('brak zdania dwufazowego u ostrego',
    !NV.clinicalReadout(p).findings.some(z => /HSN DWUFAZOWY/.test(z)));
}

/* ── 9. BRAK WYCIEKU JĘZYKA ───────────────────────────────────────────────────────────────
   Fraza kierunku jest liczona RAZ przez tr() i wstawiana do OBU wariantów językowych (ten sam
   wzorzec co side()). Gdyby tr() rozwiązał się do złego języka, w zdaniu EN pojawiłyby się
   polskie znaki — i odwrotnie. */
{
  const p = uvh();
  H.state.lang = 'en';
  const en = NV.clinicalReadout(p).findings.find(z => /HSN \(after head/.test(z)) || '';
  T('zdanie EN bez polskich fraz', /CANNOT BE TRUSTED/.test(en) && !/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(en), en.slice(0, 90));
  T('znak obwodowy EN', NV.clinicalReadout(p).peripheralSigns.some(z => /do not read the direction/.test(z)));
  H.state.lang = 'pl';
  const pl = NV.clinicalReadout(p).findings.find(z => /HSN \(po potrz/.test(z)) || '';
  T('zdanie PL bez fraz angielskich', !/CANNOT BE TRUSTED|toward the/.test(pl));
}

const OCZEKIWANE = 55;   /* ZMIERZONE przy wdrozeniu etapu V26 (2026-08-20): 18 z petli predkosci
                            w sekcji 1 (6 predkosci x 3 asercje) + 37 z sekcji 2-9. Podnies SWIADOMIE,
                            gdy dopiszesz przypadki — cicha zmiana liczby kasuje sens tej bramki. */
if (bledy.length) {
  console.error('✗ hsn:check — ' + bledy.length + ' bledow z ' + (ok + bledy.length) + ':');
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error('✗ hsn:check — przypadkow ' + ok + ', oczekiwano ' + OCZEKIWANE + '. Popraw OCZEKIWANE, ale nie po cichu.');
  process.exit(1);
}
console.log('✓ hsn:check — ' + ok + ' przypadkow; prog ' + NV.hsn(uvh()).velMin +
  ' st./s i dwufazowosc z pary tauVS+integratorTau zgodne. [H40] Katsarkas 2000');
