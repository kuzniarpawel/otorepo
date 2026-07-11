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
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GOLDEN = resolve(ROOT, 'tools', 'golden', 'snapshot.json');

const argv = process.argv.slice(2);
const CHECK = argv.includes('--check');
const targetArg = (argv.find(a => a.startsWith('--target=')) || '').split('=')[1];
const targetIdx = argv.indexOf('--target');
const TARGET = resolve(ROOT, targetArg || (targetIdx >= 0 ? argv[targetIdx + 1] : 'otorepo.html'));

// ---- load app in jsdom, neuter animation for determinism ----------------------
function loadApp(htmlPath) {
  const html = readFileSync(htmlPath, 'utf8');
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errs.push(String(e && (e.detail?.message || e.message) || e)));
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost:8777/otorepo.html',
    virtualConsole: vc,
  });
  const win = dom.window;
  win.requestAnimationFrame = () => 0;   // no animation callbacks → static frame only
  win.cancelAnimationFrame = () => {};
  try { win.cancelAnims && win.cancelAnims(); } catch {}
  return { dom, win, errs };
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
function engineOracle(h) {
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
      try { patients['scenario/' + k] = NV.makePatient ? NV.makePatient(NV.SCENARIOS[k]) : NV.scenario(k); }
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
    try { patients['meniereP'] = NV.makePatient(NV.meniere('P', 0.6)); } catch {}

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
      call('hitHC_P', () => NV.headImpulse(p, 'horizontal', 'P'));
      call('hitHC_L', () => NV.headImpulse(p, 'horizontal', 'L'));
      readouts[pk] = r;
    }
    out.neuro = readouts;
  }
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

// ---- collect all ------------------------------------------------------------
function collect() {
  const { win, errs } = loadApp(TARGET);
  const h = makeHandle(win);
  const missing = HANDLE_NAMES.filter(n => !(n in h));
  // engine/pose first (pure, before we mutate state), then dom
  const engine = engineOracle(h);
  const pose = poseOracle(h);
  const dom = domOracle(h, win);
  const meta = {
    loadErrors: errs,
    handleMissing: missing,
    counts: {
      plans: Object.keys(engine.plans || {}).length,
      neuro: Object.keys(engine.neuro || {}).length,
      pose: Object.keys(pose).length,
      dom: Object.keys(dom).length,
    },
    domErr: Object.entries(dom).filter(([, v]) => typeof v === 'string' && v.startsWith('ERR:')).map(([k]) => k),
  };
  return { engine, pose, dom, _meta: meta };
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

const snap = collect();
console.log('target        :', TARGET.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
console.log('load errors   :', snap._meta.loadErrors.length, snap._meta.loadErrors.slice(0, 3));
console.log('handle missing:', snap._meta.handleMissing);
console.log('counts        :', JSON.stringify(snap._meta.counts));
if (snap._meta.domErr.length) console.log('DOM scenarios with ERR:', snap._meta.domErr);

if (!CHECK) {
  mkdirSync(dirname(GOLDEN), { recursive: true });
  const body = JSON.stringify(snap, (k, v) => (typeof v === 'number' && Number.isFinite(v)) ? Math.round(v * 1e6) / 1e6 : v, 1);
  writeFileSync(GOLDEN, body);
  console.log(`\nWROTE golden → ${GOLDEN.replace(ROOT + '\\', '')} (${(body.length / 1024).toFixed(0)} KB)`);
} else {
  if (!existsSync(GOLDEN)) { console.error('no golden file — run without --check first'); process.exit(2); }
  const gold = JSON.parse(readFileSync(GOLDEN, 'utf8'));
  const diffs = [];
  for (const layer of ['engine', 'pose', 'dom']) {
    if (layer === 'engine') {
      diffKeys(snap.engine.plans, gold.engine.plans, 'engine.plans/', diffs);
      diffKeys(snap.engine.neuro, gold.engine.neuro, 'engine.neuro/', diffs);
    } else {
      diffKeys(snap[layer], gold[layer], layer + '/', diffs);
    }
  }
  if (diffs.length === 0) {
    console.log('\n✓ PASS — snapshot identyczny ze złotym wzorcem.');
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
