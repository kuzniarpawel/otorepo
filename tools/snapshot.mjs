/* OTOREPO — golden-snapshot harness (siatka bezpieczeństwa "przed == po").
 *
 * Ładuje aplikację w jsdom, napędza baterię scenariuszy i zrzuca deterministyczny
 * snapshot trzech warstw:
 *   engine — czyste wyjścia (genPlan, NeuroVOR: clinicalReadout/hints/headImpulse/
 *            caloricBattery/svv/vemp/skew/spontaneous) → liczby.
 *   pose   — composeHead/stepHeadQ/stepGravity/bodyJoints na siatce pozycja×yaw×twarz
 *            (wielkości z audytu 2.5D — orientacja głowy z silnika).
 *   dom    — innerHTML #app dla ekranów setup / guide(manewr×strona×krok) /
 *            diag(test×strona) / hints(presety+scenariusze).
 *
 * DOSTĘP DO WNĘTRZA — jeden uchwyt, ta sama bateria przed i po podziale:
 *   • jeśli istnieje window.__OTOREPO_TEST__ (seam z Etapu 1) → używamy go;
 *   • inaczej (Etap 0, monolit) syntezujemy uchwyt z window.eval (const-y są
 *     osiągalne z globalnego eval w klasycznym <script>).
 *
 * UŻYCIE:
 *   node tools/snapshot.mjs                 # zapisz złoty snapshot
 *   node tools/snapshot.mjs --check         # porównaj z zapisanym (exit 1 przy różnicy)
 *   node tools/snapshot.mjs --target x.html # inne wejście (domyślnie otorepo.html)
 *   node tools/snapshot.mjs --check --layers=engine,pose   # tylko silnik+geometria (bez DOM)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN = resolve(ROOT, 'tools', 'golden', 'snapshot.json');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const optVal = (name) => {
  const eq = argv.find(a => a.startsWith(name + '='));
  if (eq) return eq.slice(name.length + 1);
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const SRC = optVal('--src');                         // np. src/main.js → bundluj esbuild IIFE (moduły ES)
const HTML = optVal('--html') || 'index.html';       // markup dla trybu --src
const TARGET = resolve(ROOT, optVal('--target') || 'otorepo.html');  // monolit (klasyczny <script>)

// --layers=engine,pose — porównuj TYLKO wskazane warstwy (domyślnie wszystkie trzy).
// Powód (przebudowa UI, gałąź futureUI): warstwy `engine` i `pose` to CZYSTA fizyka/geometria i
// muszą pozostać bit w bit przez cały remont interfejsu — natomiast `dom` z definicji się zmienia,
// bo nowy DOM JEST produktem tej przebudowy. Rozdzielenie daje niezależną bramkę regresji silnika
// (Blok 18: „nowy interfejs nie zmienia wyników istniejącego silnika symulacji"), która nie tonie
// w szumie zmienionego markupu. Zapis golden (bez --check) zawsze zapisuje komplet warstw.
// Warstwa `shell` (Blok 5) pina CHROM POZA #app: pasek marki, nawigację i pasek przebiegu
// klinicznego. Powstała, bo „golden-safe" zaczęło znaczyć „bez żadnej bramki": domOracle czyta
// wyłącznie #app.innerHTML, bridge/view nie budują DOM powłoki, a flow:check testuje czysty
// model. W shell.js siedzi kilkanaście pustych `catch {}`, więc wyjątek w budowie steppera
// zostałby połknięty lokalnie i NIE dotarłby nawet do twardej bramki loadErrors — komplet
// wyroczni na zielono, a jedynego nowego artefaktu bloku nie ma na ekranie.
const ALL_LAYERS = ['engine', 'pose', 'dom', 'shell'];
const LAYERS = (() => {
  const raw = optVal('--layers');
  if (!raw) return ALL_LAYERS;
  const want = raw.split(',').map(s => s.trim()).filter(Boolean);
  const bad = want.filter(l => !ALL_LAYERS.includes(l));
  if (bad.length) { console.error(`--layers: nieznana warstwa: ${bad.join(', ')} (dozwolone: ${ALL_LAYERS.join(', ')})`); process.exit(2); }
  return want;
})();

// ---- load app in jsdom, neuter animation for determinism ----------------------
function mkJsdom(htmlStr) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errs.push(String(e && (e.detail?.message || e.message) || e)));
  const dom = new JSDOM(htmlStr, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost:8777/otorepo.html',
    virtualConsole: vc,
  });
  return { dom, win: dom.window, errs };
}
function neuter(win) {
  win.requestAnimationFrame = () => 0;   // no animation callbacks → static frame only
  win.cancelAnimationFrame = () => {};
  try { win.cancelAnims && win.cancelAnims(); } catch {}
}
async function loadApp() {
  if (SRC) {
    // tryb modularny: bundluj moduły ES do IIFE (jsdom nie uruchamia <script type=module>)
    // i wstrzyknij jako klasyczny skrypt do markupu z index.html.
    const htmlStr = readFileSync(resolve(ROOT, HTML), 'utf8');
    const { outputFiles } = await esbuild({
      entryPoints: [resolve(ROOT, SRC)], bundle: true, format: 'iife',
      write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
    });
    const { win, errs } = mkJsdom(htmlStr);          // <script type=module> w markupie NIE odpala
    const s = win.document.createElement('script');
    s.textContent = outputFiles[0].text;
    win.document.body.appendChild(s);                // odpala IIFE synchronicznie (render + seam)
    neuter(win);
    return { win, errs, label: SRC + ' (esbuild IIFE)' };
  }
  // tryb monolitu: klasyczny <script> odpala się podczas budowy jsdom
  const { win, errs } = mkJsdom(readFileSync(TARGET, 'utf8'));
  neuter(win);
  return { win, errs, label: TARGET.replace(ROOT + '\\', '').replace(ROOT + '/', '') };
}

// ---- build the access handle (Etap 1 seam OR Etap 0 eval synthesis) -----------
const HANDLE_NAMES = [
  'Vestibular', 'NeuroVOR', 'Scene3D',
  'composeHead', 'stepHeadQ', 'stepGravity', 'bodyJoints', 'gravArrowFor',
  'genPlan', 'MANEUVERS', 'CANALS', 'DIAG', 'CANAL_OF', 'HINTS_PRESETS',
  'TORSO_Q', 'state', 'render',
  'startManeuver', 'setGuideSide', 'openTest', 'setDiagSide', 'setDixObs', 'setVariant',
  'openHints', 'loadHintsPreset', 'loadHintsNeuritis', 'openHintsCustom', 'exitHintsCustom',
  'setHintsFix', 'setHintsGaze', 'setHintsNerveEar', 'setHintsNerveBranch', 'setHintsNerveSev',
  // Blok 5 — potrzebne warstwie `shell`. Brak któregokolwiek = handleMissing = twardy exit(1),
  // czyli sytuacja „powłoka przestała być sterowalna z testu" jest błędem, a nie cichą degradacją.
  'goArea', 'syncShell', 'toggleDiagCentral',
  // Blok 6 — kwalifikacja wstępna. Brak = handleMissing = twardy exit(1).
  'openTriage', 'setTriage', 'toggleTriageFlaga', 'resetTriage',
  // Blok 8 — krok „Oczopląs". Brak = handleMissing = twardy exit(1), czyli „ekranu obserwacji
  // nie da się wysterować z testu" jest błędem, a nie cichą degradacją pokrycia.
  'goObs', 'setObsPole', 'oznaczObsPole', 'setObsGrupa', 'wyczyscObs', 'przyjmijObs',
];
function makeHandle(win) {
  if (win.__OTOREPO_TEST__) return win.__OTOREPO_TEST__;
  const h = {};
  for (const n of HANDLE_NAMES) {
    try { const v = win.eval(n); if (v !== undefined) h[n] = v; } catch {}
  }
  return h;
}

// ---- canonical serialization (stable keys, rounded floats) --------------------
function stable(o) {
  if (o === undefined || o === null) return 'null';
  if (Array.isArray(o)) return '[' + o.map(stable).join(',') + ']';
  const t = typeof o;
  if (t === 'number') return Number.isFinite(o) ? String(Math.round(o * 1e6) / 1e6) : JSON.stringify(String(o));
  if (t === 'object') {
    const ks = Object.keys(o).sort();
    return '{' + ks.map(k => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
  }
  if (t === 'function') return '"[fn]"';
  return JSON.stringify(o);
}
// deep clone through JSON so jsdom-realm objects become plain data (drops fns/undefined)
const plain = (v) => { try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); } };

// ---- oracles ------------------------------------------------------------------
// Zwięzły ODCISK trajektorii zamiast surowej serii (~1040 próbek na przebieg × 42 przebiegi
// podwoiłoby golden). Decyle φ/ξ pinują KSZTAŁT toru, a skalary — moment ekspulsji i szczyt
// oczopląsu. Każda zmiana gc/adh/tauP/tauC/phiExit/SIZE_R przesuwa którąś z tych liczb.
function trajDigest(series) {
  if (!Array.isArray(series) || !series.length) return 'ERR:pusta seria';
  const n = series.length, last = series[n - 1];
  const at = f => series[Math.min(n - 1, Math.round(f * (n - 1)))];
  const dec = [];
  for (let i = 0; i <= 10; i++) { const s = at(i / 10); dec.push([s.t, s.phi !== undefined ? s.phi : null, s.xi]); }
  let xiMax = -Infinity, xiMin = Infinity, tXiMax = null, tExit = null;
  for (const s of series) {
    if (s.xi > xiMax) { xiMax = s.xi; tXiMax = s.t; }
    if (s.xi < xiMin) xiMin = s.xi;
    if (tExit === null && s.exited) tExit = s.t;
  }
  return { n, tEnd: last.t, phiEnd: last.phi !== undefined ? last.phi : null, exitedEnd: !!last.exited, xiMax, xiMin, tXiMax, tExit, dec };
}

// Dynamika złogu — LUKA W SIATCE BEZPIECZEŃSTWA zamknięta przy przebudowie UI (gałąź futureUI):
// `engine.plans` pinuje wyłącznie POZY i CZASY (name/canal/side/steps[body,yaw,face,seconds…]),
// natomiast sama fizyka cząstki (simulateCanalith: gc∝r³, adh∝r, tauP/tauC, phiExit oraz
// SIZE_R small/medium/big) była próbkowana JEDYNIE pośrednio, przez warstwę `dom` (rendering
// oczopląsu). Rebaseline `dom` — nieunikniony przy remoncie interfejsu — kasowałby więc jedyną
// ochronę klinicznie najnośniejszego kodu w aplikacji. Dowód luki: podmiana SIZE_R.medium
// 1.0→1.01 NIE ruszała `engine`/`pose`. Teraz rusza.
function dynOracle(h, win) {
  const out = {};
  const sim = win && win.maneuverSim, mkTl = win && win.maneuverTimeline, V = h.Vestibular;
  if (!sim || !V) { out['ERR'] = 'brak maneuverSim/Vestibular na window'; return out; }
  for (const key of Object.keys(h.MANEUVERS || {})) {
    for (const side of ['P', 'L']) {
      for (const size of ['small', 'medium', 'big']) {
        const k = `canalith/${key}/${side}/${size}`;
        try { out[k] = trajDigest(plain(sim(h.MANEUVERS[key].gen(side), size))); }
        catch (e) { out[k] = 'ERR:' + e.message; }
      }
    }
  }
  // Kupulolitiaza — osobne równanie (tauCup, gain∝r³, CUP_WEAK), również nietknięte przez `plans`.
  if (mkTl && V.simulateCupulolith) {
    for (const key of Object.keys(h.MANEUVERS || {})) {
      for (const side of ['P', 'L']) {
        const k = `cupulolith/${key}/${side}`;
        try {
          const plan = h.MANEUVERS[key].gen(side);
          out[k] = trajDigest(plain(V.simulateCupulolith({ canal: plan.canal, side: plan.side, timeline: mkTl(plan, 'medium'), size: 'medium' })));
        } catch (e) { out[k] = 'ERR:' + e.message; }
      }
    }
  }
  // ξ → {h,v,t}: rektyfikacja Ewalda II (odpowiedź hamująca słabsza) — czysta mapa, siatka ξ.
  if (V.dynNystagmus) {
    for (const canal of ['posterior', 'horizontal', 'anterior']) {
      for (const side of ['P', 'L']) {
        for (const xi of [-1, -0.5, -0.1, 0, 0.1, 0.5, 1]) {
          const k = `dynNys/${canal}/${side}/${xi}`;
          try { out[k] = plain(V.dynNystagmus(canal, side, xi)); }
          catch (e) { out[k] = 'ERR:' + e.message; }
        }
      }
    }
  }
  return out;
}

function engineOracle(h, win) {
  const out = {};
  // plans (poza + oczopląs + timing per krok) dla wszystkich manewrów × stron
  const plans = {};
  for (const key of Object.keys(h.MANEUVERS || {})) {
    for (const side of ['P', 'L']) {
      try { plans[`${key}/${side}`] = plain(h.genPlan(key, side)); }
      catch (e) { plans[`${key}/${side}`] = 'ERR:' + e.message; }
    }
  }
  out.plans = plans;

  // NeuroVOR — czyste odczyty kliniczne dla zestawu pacjentów
  const NV = h.NeuroVOR;
  if (NV) {
    const patients = {};
    // scenariusze wbudowane
    for (const k of Object.keys(NV.SCENARIOS || {})) {
      // SCENARIOS[k] to OPAKOWANIE {label, side, params} — parametry patologii siedzą w .params.
      // Podanie całego opakowania do makePatient (Object.assign kopiuje tylko klucze najwyższego
      // poziomu) NIE nakładało ich: pacjent zostawał zdrowy, a .label/.side/.params lądowały w nim
      // jako śmieciowe pola. Skutek: wszystkie 5 scenariuszy przypinało w golden TEGO SAMEGO
      // zdrowego pacjenta (verdict "normal"), czyli neuritis/udar/BVH nie były badane wcale.
      try { patients['scenario/' + k] = NV.makePatient ? NV.makePatient(NV.SCENARIOS[k].params) : NV.scenario(k); }
      catch (e) { patients['scenario/' + k] = 'ERR:' + e.message; }
    }
    // uszkodzenia gałęzi nerwu (górna/dolna × ucho × nasilenie)
    try {
      for (const ear of ['P', 'L']) for (const br of ['superior', 'inferior']) {
        patients[`nerve/${ear}/${br}`] = NV.makePatient(NV.nerveBranchLesion(ear, br, 0.6));
      }
    } catch (e) { patients['nerve/ERR'] = 'ERR:' + e.message; }
    // dodatkowe jednostki chorobowe
    try { patients['bilateral'] = NV.makePatient(NV.bilateralLoss(0.7)); } catch {}
    // meniere(ear, opts) NIE ma parametru nasilenia — w przeciwieństwie do dwóch linii wyżej
    // (nerveBranchLesion/bilateralLoss, gdzie ostatni argument to sev). Trzeci wymiar Ménière'a to
    // FAZA napadu: opts {phase:"irritative"|"nullpoint"|"paretic"|"interictal", tone, gain, caloricLoss}.
    // Podanie liczby dawało opts=0.6, więc każde opts.* czytało undefined i wchodziły domyślne
    // (irritative, tone 150, gain 1.0, caloricLoss 0.55) — argument był martwy, nie zmieniał niczego.
    // Wołanie jest teraz jawne i pinuje DOKŁADNIE tę samą fazę (liczby w golden bez zmian).
    // Klucz 'meniereP' = faza DRAŻNIENIA (nazwa historyczna, zachowana dla ciągłości golden).
    try { patients['meniereP'] = NV.makePatient(NV.meniere('P', { phase: 'irritative' })); } catch {}
    // FAZA PORAŻENIA tego samego ucha — para do powyższej. Przypina EMERGENTNE odwrócenie kierunku:
    // drażnienie (toneR 150 > toneL 90) bije KU uchu choremu, porażenie (toneR 0) bije KU zdrowemu,
    // przy niezmienionej stronie zmiany. Do tego rozjeżdża się vHIT (gain 1.0 → prawidłowy mimo
    // oczopląsu = pułapka „pozornie ośrodkowa"; gain 0.5 → patologiczny), więc jedna zmiana pola
    // `phase` przestawia werdykt HINTS. Bez tej pary wyrocznia pinowała tylko jeden kraniec napadu.
    try { patients['meniereP/paretic'] = NV.makePatient(NV.meniere('P', { phase: 'paretic' })); } catch {}

    const readouts = {};
    for (const [pk, p] of Object.entries(patients)) {
      if (typeof p !== 'object') { readouts[pk] = p; continue; }
      const r = {};
      const call = (name, fn) => { try { r[name] = plain(fn()); } catch (e) { r[name] = 'ERR:' + e.message; } };
      call('clinicalReadout', () => NV.clinicalReadout(p));
      call('hints', () => NV.hints(p));
      call('spontaneous', () => NV.spontaneous(p));
      call('skew', () => NV.skew(p));
      call('svv', () => NV.svv(p));
      call('vemp', () => NV.vemp(p));
      call('caloric', () => NV.caloricBattery(p));
      // sygnatura to headImpulse(p, spec, opts), gdzie spec = 'P'/'L' ALBO {canal, ear} — trzeci
      // argument to opcje, nie ucho. Wołanie (p,'horizontal','P') dawało spec='horizontal', więc
      // canalSpec brał ear='horizontal' i rzucał; golden trzymał komunikat błędu zamiast liczb vHIT.
      call('hitHC_P', () => NV.headImpulse(p, { canal: 'horizontal', ear: 'P' }));
      call('hitHC_L', () => NV.headImpulse(p, { canal: 'horizontal', ear: 'L' }));
      readouts[pk] = r;
    }
    out.neuro = readouts;
  }
  out.dyn = dynOracle(h, win);
  return out;
}

function poseOracle(h) {
  const bodies = Object.keys(h.TORSO_Q || {});
  const list = bodies.length ? bodies
    : ['sit', 'supineHang', 'supineFlex', 'supineFlat', 'supineChin', 'sideL', 'sideR', 'prone', 'leanL', 'leanR'];
  const faces = ['up', 'down', 'front', 'left', 'right', null];
  const yaws = [-90, -45, 0, 45, 90];
  const out = {};
  for (const body of list) {
    for (const face of faces) {
      for (const yaw of yaws) {
        const tag = `${body}/${face}/${yaw}`;
        const rec = {};
        const call = (name, fn) => { try { rec[name] = plain(fn()); } catch (e) { rec[name] = 'ERR:' + e.message; } };
        if (h.composeHead) call('composeHead', () => h.composeHead(body, yaw, face));
        if (h.stepHeadQ) call('stepHeadQ', () => h.stepHeadQ(body, yaw, face));
        if (h.stepGravity) call('stepGravity', () => h.stepGravity(body, yaw, face));
        if (h.bodyJoints) call('bodyJoints', () => h.bodyJoints(body, face));
        out[tag] = rec;
      }
    }
  }
  return out;
}

function domOracle(h, win) {
  const app = () => (win.document.getElementById('app') || {}).innerHTML || '';
  const out = {};
  const grab = (tag, fn) => { try { fn(); out[tag] = app(); } catch (e) { out[tag] = 'ERR:' + e.message; } };

  /* Ekran startowy oparty na CELU (Blok 4) — dotąd NIEPRZYPIĘTY. To pierwszy ekran, jaki widzi
     użytkownik, i jedyne miejsce, gdzie aplikacja deklaruje swój ZAKRES („narzędzie edukacyjne,
     nie wyrób medyczny") oraz mapuje pięć szybkich wejść na realne cele. Zmiana dowolnego z tych
     napisów przechodziła przez komplet wyroczni na zielono. Dokładane przed Blokiem 8, bo ten
     blok zmienia znaczenie wejścia „Mam wynik próby". */
  grab('start', () => { h.state.screen = 'start'; h.state.mode = 'treat'; h.render(); });

  // setup
  grab('setup', () => { h.state.screen = 'setup'; h.state.mode = 'treat'; h.render(); });

  // guide: manewr × strona × wszystkie kroki (rozmiar medium)
  const CANAL_OF = h.CANAL_OF ||
    { epley: 'posterior', semont: 'posterior', lempert: 'horizontal', gufoniGeo: 'horizontal', gufoniApo: 'horizontal', yacovino: 'anterior' };
  for (const key of Object.keys(h.MANEUVERS || {})) {
    for (const side of ['P', 'L']) {
      let plan;
      try { plan = h.genPlan(key, side); } catch (e) { out[`guide/${key}/${side}`] = 'ERR:' + e.message; continue; }
      const n = (plan.steps || []).length || 0;
      for (let s = 0; s < n; s++) {
        grab(`guide/${key}/${side}/step${s}`, () => {
          Object.assign(h.state, { mode: 'treat', maneuverKey: key, canal: CANAL_OF[key], side, plan, size: 'medium', step: s, screen: 'guide', running: false });
          h.render();
        });
      }
    }
  }

  // diagnostyka: test × strona (+ dixObs post/lat dla dixHallpike)
  for (const key of Object.keys(h.DIAG || {})) {
    for (const side of ['P', 'L']) {
      grab(`diag/${key}/${side}`, () => {
        if (h.openTest) h.openTest(key); else Object.assign(h.state, { testKey: key, screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        h.render();
      });
    }
  }

  /* Krok „Oczopląs" (Blok 8) — opis ZAOBSERWOWANEGO wyniku. Pinujemy stany, w których ekran
     mówi RÓŻNE rzeczy, bo to jedyne miejsce w aplikacji, gdzie zapisuje się relacja człowieka,
     a nie wynik modelu. Najważniejsze trzy: `pusty` (nie wolno niczego zakładać), `czysto-skretny`
     (znalezisko, nie brak danych) i `niewiarygodne` (kwarantanna wycisza wniosek, ale ostrzeżenie
     ZOSTAJE — cicha zmiana tej reguły byłaby regresją bezpieczeństwa niewidoczną w żadnej innej
     bramce). Rekordy budujemy przez PRAWDZIWE akcje, nie przez wstrzyknięcie stanu. */
  if (h.goObs && h.setObsPole && h.oznaczObsPole && h.setObsGrupa) {
    // Rekordy obserwacji PRZEŻYWAJĄ nawigację (to celowe), więc bez zerowania między scenariuszami
    // wyciekałyby jeden na drugi i kolejność bloków zaczęłaby wpływać na złoty wzorzec.
    const czystyObs = () => { h.state.obs = {}; h.state.obsGrupa = null; h.state.dixObs = null; };
    const obs = (tag, proba, kroki) => grab(`obs/${tag}`, () => {
      czystyObs();
      if (h.openTest) h.openTest(proba); else Object.assign(h.state, { testKey: proba });
      h.goObs();
      for (const [klucz, w] of (kroki || [])) h.setObsPole(proba, klucz, w);
      h.render();
    });
    obs('dix/pusty', 'dix', []);
    obs('dix/tylko-pion', 'dix', [['pion#jedyna', 'p1']]);
    obs('dix/typowy', 'dix', [['pion#jedyna', 'p1'], ['torsja#jedyna', 'p1'], ['poziom#jedyna', 'zero'],
      ['latencja', '1-5s'], ['czasTrwania', 'ponizej1min'], ['meczliwosc', 'slabnie'], ['przebieg', 'narastaWygasa']]);
    obs('dix/downbeat', 'dix', [['pion#jedyna', 'm1']]);
    obs('dix/czysto-skretny', 'dix', [['pion#jedyna', 'zero'], ['torsja#jedyna', 'p1']]);
    obs('dix/wynik-ujemny', 'dix', [['wystapil', 'nie']]);
    grab('obs/dix/niewiarygodne', () => {
      czystyObs();
      if (h.openTest) h.openTest('dix'); else Object.assign(h.state, { testKey: 'dix' });
      h.goObs();
      h.setObsPole('dix', 'pion#jedyna', 'm1');
      h.oznaczObsPole('dix', 'pion#jedyna');            // → niepewne
      h.oznaczObsPole('dix', 'pion#jedyna');            // → niewiarygodne
      h.render();
    });
    grab('obs/dix/grupa-dynamika', () => {
      czystyObs();
      if (h.openTest) h.openTest('dix'); else Object.assign(h.state, { testKey: 'dix' });
      h.goObs();
      h.setObsGrupa('dynamika');                        // dowód, że state.obsGrupa jest NAPRAWDĘ czytane
      h.render();
    });
    obs('roll/pusty', 'roll', []);
    obs('roll/geotropowy', 'roll', [['poziom#prawoWDole', 'p1'], ['poziom#lewoWDole', 'm1'], ['nasilenie', 'silniejsza']]);
    obs('roll/niespojny', 'roll', [['poziom#prawoWDole', 'p1'], ['poziom#lewoWDole', 'p1']]);
    obs('bowlean/pusty', 'bowlean', []);
    obs('bowlean/odwraca', 'bowlean', [['poziom#bow', 'p1'], ['poziom#lean', 'm1']]);
    obs('headhang/pusty', 'headhang', []);
    obs('headhang/downbeat', 'headhang', [['pion#jedyna', 'm1'], ['pozycjaNeutralna', 'tak'], ['fiksacja', 'nieTlumil']]);
    czystyObs();
  }

  /* Kwalifikacja wstępna („Wywiad", Blok 6). Pinujemy po JEDNYM stanie na każdą kategorię
     taksonomii GRACE-3 — to jedyny ekran, którego treść jest wprost zaleceniem klinicznym,
     więc cicha zmiana słów („nie wykonuj repozycji" → cokolwiek łagodniejszego) musi się
     odbić w wyroczni. Scenariusz `czerwona` jest najważniejszy: ten sam komplet odpowiedzi
     co `tEVS`, różniący się WYŁĄCZNIE ataksją chodu. */
  if (h.openTriage && h.setTriage && h.toggleTriageFlaga && h.resetTriage) {
    const tri = (tag, odp, flagi) => grab(`triage/${tag}`, () => {
      h.resetTriage();
      h.openTriage();
      for (const [k, v] of Object.entries(odp)) h.setTriage(k, v);
      for (const f of (flagi || [])) h.toggleTriageFlaga(f);
      h.render();
    });
    tri('pusty', {});
    tri('tEVS', { przebieg: 'napadowe', wyzwalacz: 'pozycyjny' }, ['brak']);
    tri('czerwona', { przebieg: 'napadowe', wyzwalacz: 'pozycyjny' }, ['ataksja']);
    tri('AVS', { przebieg: 'ciagle', oczoplas: 'obecny' }, ['brak']);
    tri('pseudoAVS', { przebieg: 'ciagle', oczoplas: 'brak' }, ['brak']);
    tri('sEVS', { przebieg: 'napadowe', wyzwalacz: 'samoistny' }, ['brak']);
    try { h.resetTriage(); } catch { /* przywróć czysty stan dla kolejnych warstw */ }
  }

  // HINTS — presety
  for (const p of Object.keys(h.HINTS_PRESETS || {})) {
    grab(`hints/preset/${p}`, () => {
      if (h.openHintsCustom) h.openHintsCustom();
      h.state.screen = 'hints'; h.state.mode = 'hints';
      if (h.loadHintsPreset) h.loadHintsPreset(p);
      h.render();
    });
  }
  // HINTS — neuritis (gałąź × ucho)
  for (const ear of ['P', 'L']) for (const br of ['superior', 'inferior']) {
    grab(`hints/nerve/${ear}/${br}`, () => {
      if (h.openHintsCustom) h.openHintsCustom();
      h.state.screen = 'hints'; h.state.mode = 'hints';
      h.state.hintsNerveEar = ear; h.state.hintsNerveBranch = br; h.state.hintsNerveSev = 0.6;
      if (h.loadHintsNeuritis) h.loadHintsNeuritis();
      h.render();
    });
  }
  // HINTS — scenariusze wbudowane + fixacja/spojrzenie
  for (const k of ['normal', 'neuritisR', 'neuritisL', 'strokeCentral', 'bvh']) {
    grab(`hints/scenario/${k}`, () => { if (h.openHints) h.openHints(k); h.render(); });
  }
  grab('hints/scenario/neuritisR/fix', () => { if (h.openHints) h.openHints('neuritisR'); if (h.setHintsFix) h.setHintsFix(true); h.render(); });
  grab('hints/scenario/neuritisR/gaze30', () => { if (h.openHints) h.openHints('neuritisR'); if (h.setHintsGaze) h.setHintsGaze(30); h.render(); });

  return out;
}

/* Warstwa `shell` — chrom powłoki dla kilku charakterystycznych stanów.
   Poddrzewo #app jest WYCINANE: jego treść pilnuje domOracle, a dublowanie jej tutaj zamieniłoby
   każdą zmianę ekranu w podwójny szum. Zostaje to, czego nie widzi żadna inna warstwa: pasek
   marki, nawigacja, pasek przebiegu, ostrzeżenie o nieaktualnym wniosku i atrybuty data-* na
   .shell, przez które CSS steruje układem. */
function shellOracle(h, win) {
  const out = {};
  const doc = win.document;
  const zrzut = () => {
    const sh = doc.getElementById('shell');
    if (!sh) return 'BRAK #shell';
    const app = doc.getElementById('app');
    let zapamietane = null;
    if (app) { zapamietane = app.innerHTML; app.innerHTML = '<!--APP-->'; }
    let s;
    try { s = sh.outerHTML; } finally { if (app) app.innerHTML = zapamietane; }
    const mapa = doc.getElementById('flowmap');
    return s + (mapa && !mapa.hidden ? '\n@@FLOWMAP@@' + mapa.outerHTML : '');
  };
  const grab = (tag, fn) => { try { fn(); out[tag] = zrzut(); } catch (e) { out[tag] = 'ERR:' + e.message; } };
  const st = h.state;
  const czysty = () => {
    if (!st) return;
    st.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
    st.decisionSeq = 0; st.diagCentral = false; st.variant = 'canalo'; st.dixObs = null;   // null, nie 'post' (Blok 8): harness nie ma prawa odpowiadac za uzytkownika
    st.stepMapOpen = false; st.running = false; st.step = 0;
    st.triage = {}; st.triageStep = null;
    // Blok 8: rekordy obserwacji PRZEŻYWAJĄ nawigację (to celowe), więc bez wyczyszczenia ich
    // TUTAJ scenariusze wyciekałyby jeden na drugi i kolejność bloków w tym pliku zaczęłaby
    // wpływać na złoty wzorzec — awaria, której nie widać, dopóki ktoś nie przestawi bloków.
    st.obs = {}; st.obsGrupa = null;
    try { if (h.resetTriage) h.resetTriage(); } catch { }
  };

  grab('start', () => { czysty(); h.goArea && h.goArea('start'); });
  grab('diag/dix/P', () => { czysty(); h.goArea && h.goArea('diag'); h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P'); h.syncShell && h.syncShell(); });
  grab('diag/roll/P', () => { czysty(); h.openTest && h.openTest('roll'); h.syncShell && h.syncShell(); });
  // Stan ZGODNY: Dix-Hallpike + kanalolitiaza → Epley jest manewrem pierwszego rzutu, więc pasek
  // NIE MOŻE pokazywać ostrzeżenia. Fałszywy alarm jest tu równie groźny jak brak alarmu — pasek,
  // który krzyczy zawsze, przestaje być czytany.
  grab('guide/epley/P', () => { czysty(); h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P'); h.startManeuver && h.startManeuver('epley'); h.syncShell && h.syncShell(); });
  grab('learn', () => { czysty(); h.goArea && h.goArea('learn'); });
  grab('hints', () => { czysty(); h.goArea && h.goArea('lab'); });
  // NAJWAŻNIEJSZY stan bloku: manewr wybrany z rekomendacji, po czym zmieniony mechanizm.
  // Pasek MUSI wtedy pokazać „wymaga ponownego przeliczenia" wraz z powodem.
  grab('stale/mechanizm', () => {
    czysty();
    h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix');
    h.startManeuver && h.startManeuver('epley');
    h.setVariant && h.setVariant('cupulo');
    h.syncShell && h.syncShell();
  });
  // Ostrzeżenie NIE MOŻE zgasnąć przez samą nawigację (openTest po cichu przywraca diagCentral).
  grab('stale/cpn-po-nawigacji', () => {
    czysty();
    h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix');
    h.startManeuver && h.startManeuver('epley');
    h.toggleDiagCentral && h.toggleDiagCentral(true);
    h.openTest && h.openTest('dix');
    h.syncShell && h.syncShell();
  });
  // Obejście przez INNĄ próbę: openTest('roll') zeruje diagCentral, a powrót na 'dix' przywraca
  // komplet pól odcisku do wartości wyjściowych. Binarne porównanie pól melduje wtedy „wniosek
  // zgodny" u pacjenta oznaczonego jako podejrzany o przyczynę ośrodkową — to najgroźniejszy
  // fałszywy negatyw tego bloku. Ratuje go MONOTONICZNY licznik decyzji.
  grab('stale/cpn-obejscie-inna-proba', () => {
    czysty();
    h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix');
    h.startManeuver && h.startManeuver('epley');
    h.toggleDiagCentral && h.toggleDiagCentral(true);
    h.openTest && h.openTest('roll');
    h.openTest && h.openTest('dix');
    h.syncShell && h.syncShell();
  });
  // Czerwona flaga z kwalifikacji MUSI jechac z uzytkownikiem przez caly przebieg: karta wyniku
  // zostaje na ekranie Wywiadu, a sygnal ma byc widoczny „PRZED przejsciem do manewru lub HINTS".
  grab('flaga/czerwona-w-pasku', () => {
    czysty();
    h.openTriage && h.openTriage();
    h.setTriage && h.setTriage('przebieg', 'napadowe');
    h.setTriage && h.setTriage('wyzwalacz', 'pozycyjny');
    h.toggleTriageFlaga && h.toggleTriageFlaga('ataksja');
    h.openTest && h.openTest('dix');            // uzytkownik idzie dalej mimo flagi
    h.syncShell && h.syncShell();
  });
  czysty();
  return out;
}

// ---- collect all ------------------------------------------------------------
async function collect() {
  const { win, errs, label } = await loadApp();
  const h = makeHandle(win);
  const missing = HANDLE_NAMES.filter(n => !(n in h));
  // i18n: przypnij locale golden do PL (aplikacja domyślnie EN, ale wzorzec pozostaje POLSKI).
  // W P2 bez efektu (żaden napis nie czyta jeszcze state.lang); od P4 gwarantuje stabilny DOM/engine
  // niezależnie od navigator.language jsdom (które w jsdom domyślnie = "en-US").
  try { if (h.state) h.state.lang = 'pl'; } catch { /* monolit / brak state → pomiń */ }
  // Rozmiar złogu: przypnij 'medium' — genPlan NIE jest czystą funkcją swoich argumentów, czyta state.size
  // (actions.js: sizedSeconds(st.seconds, state.size) → holdMult, maneuvers.js:446). Bez tego pinu gwarancja
  // „engine bit w bit" jest BEHAWIORALNA, nie strukturalna: dowolny kod bootowy przywracający preferencję
  // użytkownika (np. zapis sesji z Bloku 15) przestawia czasy holdów i wywala wszystkie 14 planów, mimo że
  // silnik jest nietknięty. Udowodnione: state.size='small' na boot → engine.plans/epley/P seconds 30→45.
  // Pułapka jest podstępna, bo holdMult=1 dla medium i big — przechodzi wszystko poza 'small'.
  try { if (h.state) h.state.size = 'medium'; } catch { /* jw. */ }
  // engine/pose first (pure, before we mutate state), then dom
  const engine = engineOracle(h, win);
  const pose = poseOracle(h);
  const dom = domOracle(h, win);
  // shell PO dom: obie warstwy mutują stan, a dom jest starsza i ma pierwszeństwo w kolejności.
  const shell = shellOracle(h, win);
  const meta = {
    target: label,
    loadErrors: errs,
    handleMissing: missing,
    counts: {
      plans: Object.keys(engine.plans || {}).length,
      neuro: Object.keys(engine.neuro || {}).length,
      dyn: Object.keys(engine.dyn || {}).length,
      pose: Object.keys(pose).length,
      dom: Object.keys(dom).length,
      shell: Object.keys(shell).length,
    },
    domErr: Object.entries({ ...dom, ...shell }).filter(([, v]) => typeof v === 'string' && v.startsWith('ERR:')).map(([k]) => k),
  };
  return { engine, pose, dom, shell, _meta: meta };
}

// ---- write / check ----------------------------------------------------------
function diffKeys(aObj, bObj, prefix, sink) {
  const a = aObj || {}, b = bObj || {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const sa = stable(a[k]), sb = stable(b[k]);
    if (sa !== sb) {
      let at = -1;
      const n = Math.min(sa.length, sb.length);
      for (let i = 0; i < n; i++) if (sa[i] !== sb[i]) { at = i; break; }
      if (at < 0) at = n;
      sink.push({
        key: prefix + k,
        goldLen: sb.length, curLen: sa.length, at,
        gold: sb.slice(Math.max(0, at - 40), at + 40),
        cur: sa.slice(Math.max(0, at - 40), at + 40),
      });
    }
  }
}

const snap = await collect();
console.log('target        :', snap._meta.target);
console.log('load errors   :', snap._meta.loadErrors.length, snap._meta.loadErrors.slice(0, 3));
console.log('handle missing:', snap._meta.handleMissing);
console.log('counts        :', JSON.stringify(snap._meta.counts));
if (snap._meta.domErr.length) console.log('DOM scenarios with ERR:', snap._meta.domErr);

// Błąd ładowania / brak uchwytu = TWARDA PORAŻKA, także w trybie zapisu golden.
// Dotąd te dwa pola były tylko DRUKOWANE, nigdy porównywane: wyjątek w ciele modułu (albo brak API
// przeglądarki w jsdom, np. ResizeObserver/matchMedia) dawał pustą aplikację, a wyrocznie i tak
// świeciły na zielono — bo pusty DOM porównywał się z pustym DOM-em dopiero PO rebaseline, a przed
// nim scenariusze cicho zwracały 'ERR:'. Przy przebudowie UI (nowe API przeglądarki w powłoce)
// to najbardziej prawdopodobny tryb awarii: biały ekran przy komplecie zielonych wyroczni.
if (snap._meta.loadErrors.length || snap._meta.handleMissing.length) {
  console.error('\n✗ BŁĄD ŁADOWANIA APLIKACJI — snapshot nieważny (nie zapisuję, nie porównuję).');
  if (snap._meta.loadErrors.length) console.error('  loadErrors   :', snap._meta.loadErrors.slice(0, 5));
  if (snap._meta.handleMissing.length) console.error('  handleMissing:', snap._meta.handleMissing);
  console.error('  Wskazówka: API przeglądarki użyte w module musi być za detekcją (typeof X === "function").');
  process.exit(1);
}

if (!CHECK) {
  mkdirSync(dirname(GOLDEN), { recursive: true });
  const body = JSON.stringify(snap, (k, v) => (typeof v === 'number' && Number.isFinite(v)) ? Math.round(v * 1e6) / 1e6 : v, 1);
  writeFileSync(GOLDEN, body);
  console.log(`\nWROTE golden → ${GOLDEN.replace(ROOT + '\\', '')} (${(body.length / 1024).toFixed(0)} KB)`);
} else {
  if (!existsSync(GOLDEN)) { console.error('no golden file — run without --check first'); process.exit(2); }
  const gold = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const diffs = [];
  if (LAYERS.length !== ALL_LAYERS.length) console.log('layers        :', LAYERS.join(', ') + `  (pominięto: ${ALL_LAYERS.filter(l => !LAYERS.includes(l)).join(', ')})`);
  for (const layer of LAYERS) {
    if (layer === 'engine') {
      diffKeys(snap.engine.plans, gold.engine.plans, 'engine.plans/', diffs);
      diffKeys(snap.engine.neuro, gold.engine.neuro, 'engine.neuro/', diffs);
      diffKeys(snap.engine.dyn, gold.engine.dyn, 'engine.dyn/', diffs);
    } else {
      diffKeys(snap[layer], gold[layer], layer + '/', diffs);
    }
  }
  if (diffs.length === 0) {
    console.log(`\n✓ PASS — snapshot identyczny ze złotym wzorcem${LAYERS.length !== ALL_LAYERS.length ? ' (warstwy: ' + LAYERS.join(', ') + ')' : ''}.`);
    process.exit(0);
  }
  console.log(`\n✗ FAIL — ${diffs.length} scenariuszy różni się od wzorca:`);
  for (const d of diffs.slice(0, 12)) {
    console.log(`\n  • ${d.key}  (len gold=${d.goldLen} cur=${d.curLen}, first diff @${d.at})`);
    console.log(`      gold: …${d.gold}…`);
    console.log(`      cur : …${d.cur}…`);
  }
  if (diffs.length > 12) console.log(`\n  … i ${diffs.length - 12} więcej.`);
  process.exit(1);
}
