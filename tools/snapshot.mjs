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

  // WYROCZNIA WRAŻLIWOŚCI (ocena II, V9/B5): manewry czyszczące muszą czyścić także przy tauP±10%.
  // Margines Semonta wynosił 0.25 s i rekalibracja tauP o +8% zabijała czyszczenie PO CICHU —
  // od V9 derivedHold wyprowadza też hold kroków bez timera z marginesem EXIT_MARGIN, a ten test
  // pilnuje, żeby przyszła rekalibracja stałych nie ubiła żadnego manewru. TWARDY INWARIANT:
  // niepowodzenie rzuca błąd (nie da się go zapiec do golden); wynik trafia też do snapshotu
  // (engine.sensitivity), więc dryf wykryje również --check. Rozmiar medium = najcieńsze marginesy
  // (small/big mają większe — patrz tabela minimalnych holdów w engine_doc).
  if (h.Vestibular && h.maneuverTimeline) {
    const sensFails = [];
    for (const key of ['epley', 'semont', 'bascule', 'lempert', 'gufoniGeo', 'yacovino'])
      for (const side of ['P', 'L'])
        for (const mult of [0.9, 1.1]) {
          try {
            const plan = h.genPlan(key, side);
            const tl = h.maneuverTimeline(plan, 'medium');
            const sim = h.Vestibular.simulateCanalith({ canal: plan.canal, side, size: 'medium', timeline: tl, tauP: 6.5 * mult });
            if (!(sim.length && sim[sim.length - 1].exited)) sensFails.push(`${key}/${side}@tauPx${mult}`);
          } catch (e) { sensFails.push(`${key}/${side}@tauPx${mult}:ERR ${e.message}`); }
        }
    if (sensFails.length) throw new Error('WYROCZNIA WRAŻLIWOŚCI (tauP±10%) NIE PRZESZŁA: ' + sensFails.join(', '));
    out.sensitivity = 'PASS(tauP±10%: 6 manewrów × 2 strony × 2 mnożniki = 24/24)';

    // WYROCZNIA EKSPULSJI (ocena II, V14c/B6): trwanie ekspulsji z komory odnogi (final.expelDur) musi
    // mieścić się w paśmie EXPEL_SANE — dolna granica łapie regresję typu „teleport" (powrót ukrytej
    // stałej prędkości), górna „wieczne pełzanie tuż nad progiem" (Semont!), zanim zamaskuje je
    // podnoszenie u przez derivedHold. Pasmo z DANYCH: obwiednia zmierzona 1.95 s (Epley big ×0.9)
    // – 9.90 s (Yacovino small ×1.1) + margines. NIE w silniku (derivedHold celowo próbkuje pary,
    // które nie czyszczą — assert runtime rzucałby w normalnym przeszukiwaniu). Kanały pionowe
    // (komora); HC/gufoniApo mają expelDur=null — poza pasmem świadomie.
    const EXPEL_SANE = [0.5, 12];
    const expFails = [];
    let expN = 0;
    for (const key of ['epley', 'semont', 'bascule', 'yacovino'])
      for (const side of ['P', 'L'])
        for (const size of ['small', 'medium', 'big'])
          for (const mult of [0.9, 1.0, 1.1]) {
            try {
              const plan = h.genPlan(key, side);
              const sim = h.Vestibular.simulateCanalith({ canal: plan.canal, side, size, timeline: h.maneuverTimeline(plan, size), tauP: 6.5 * mult });
              const d = sim.final && sim.final.expelDur;
              expN++;
              if (!(typeof d === 'number' && d >= EXPEL_SANE[0] && d <= EXPEL_SANE[1]))
                expFails.push(`${key}/${side}/${size}@x${mult}: expelDur=${d}`);
            } catch (e) { expFails.push(`${key}/${side}/${size}@x${mult}:ERR ${e.message}`); }
          }
    if (expFails.length) throw new Error('WYROCZNIA EKSPULSJI (EXPEL_SANE [0.5,12] s) NIE PRZESZŁA: ' + expFails.join(', '));
    out.expulsion = `PASS(expelDur∈[0.5,12] s: 4 manewry × 2 strony × 3 rozmiary × 3 tauP = ${expN}/${expN})`;
  }

  // SESJA CIĄGŁA (ocena II, V10/D1): pin ŁAŃCUCHA STANU — czyste liczby final, nie DOM.
  // Sekwencja kanoniczna: Dix#1 → (karta Dix#2 przy rep=1: peak/latencja) → Dix#2 → przerwa 10 min
  // (odrost wiązania readhesion) → Epley → exited. Lustro commitAct z actions.js (bez DOM).
  if (h.sessionSim && h.actTimeline && h.readhesion && h.maneuverTimeline) {
    const S = { canal: 'posterior', side: 'P', size: 'medium', phi: null, xi: 0, bondFrac: 1, stuck: true, exited: false, inCrus: false, rep: 0 };
    const act = (timeline, rest) => { const f = h.sessionSim(S, timeline).final;
      Object.assign(S, { phi: f.exited ? null : f.phi, xi: f.exited ? 0 : f.xi, bondFrac: h.readhesion(f.bondFrac, rest), stuck: f.stuck, exited: f.exited, inCrus: f.inCrus }); };
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const chain = {};
    act(h.actTimeline('dix', 'P'), h.SESSION_REST); S.rep = 1;
    chain.afterDix1 = { phi: r5(S.phi), bondFrac: r5(S.bondFrac), stuck: S.stuck, exited: S.exited };
    let pk = 0, lat = null;
    for (const s of h.sessionSim(S, h.actTimeline('dix', 'P'))) { if (Math.abs(s.xi) > 0.05 && lat == null) lat = s.t; if (Math.abs(s.xi) > Math.abs(pk)) pk = s.xi; }
    chain.dix2 = { peak: r5(pk), lat: r5(lat) };
    act(h.actTimeline('dix', 'P'), h.SESSION_REST); S.rep = 2;
    act([{ q: [1, 0, 0, 0], tTrans: 0.8, tHold: 600, pivot: 'body' }], 600);
    chain.afterRest = { bondFrac: r5(S.bondFrac), stuck: S.stuck };
    act([...h.maneuverTimeline(h.genPlan('epley', 'P'), 'medium'), h.SIT_SEG], h.SESSION_REST);
    chain.afterEpley = { exited: S.exited, phi: S.phi };
    out.sessionChain = chain;
  }

  // LIGHT CUPULA (ocena II, V12/D3): pin nulla i celów statycznych per strona — null yaw z bisekcji
  // (WSPÓLNY dla heavy/light), pełne odwrócenie kierunku wokół zera, oś Rolla fasady light.
  if (h.nullScan && h.nullYawOf && h.Vestibular && h.Vestibular.simulateLightCupula) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const lc = {};
    for (const side of ['P', 'L']) {
      const twdA = side === 'P' ? 1 : -1;
      const s0 = h.nullScan(side, 0), s20 = h.nullScan(side, 20 * twdA);
      const tlA = [{ q: h.stepHeadQ('supineFlex', 90 * twdA, 'up'), tTrans: 0.8, tHold: 20 }];
      const tlH = [{ q: h.stepHeadQ('supineFlex', -90 * twdA, 'up'), tTrans: 0.8, tHold: 20 }];
      const a = h.Vestibular.simulateLightCupula({ canal: 'horizontal', side, q0: [1, 0, 0, 0], timeline: tlA });
      const hh = h.Vestibular.simulateLightCupula({ canal: 'horizontal', side, q0: [1, 0, 0, 0], timeline: tlH });
      lc[side] = { nullYaw: r5(h.nullYawOf(side)),
        mid: { heavy: r5(s0.heavy.xi), light: r5(s0.light.xi) },
        beyond20: { heavy: r5(s20.heavy.xi), light: r5(s20.light.xi) },
        rollLight: { affDown: r5(a[a.length - 1].xi), healthyDown: r5(hh[hh.length - 1].xi) } };
    }
    out.lightcupula = lc;
  }

  // SPV-MOST (ocena II, V13/D6): pin śladu spvTrace — kompakt (pełny ślad za duży do golden):
  // per przebieg {n, peak:[t,spvH,spvVert,spvTors] w DOKŁADNYM czasie szczytu |SPV| (łapie dryf
  // amplitudy/latencji między węzłami siatki), grid5: co 5 s + ostatnia (łapie kształt/wygasanie)}.
  if (h.spvTrace && h.engineXi && h.provokeQ && h.actTimeline && h.Vestibular) {
    const r5 = x => +(+x).toFixed(5);
    const mag = p => Math.hypot(p.spvH, p.spvVert, p.spvTors);
    const compact = (sim, canal, side) => {
      const tr = h.spvTrace(sim, canal, side);
      let pk = tr[0]; for (const p of tr) if (mag(p) > mag(pk)) pk = p;
      const step = Math.max(1, Math.round(5 / (tr[1].t - tr[0].t)));
      const grid = [];
      for (let i = step - 1; i < tr.length; i += step) grid.push(tr[i]);
      if (grid[grid.length - 1] !== tr[tr.length - 1]) grid.push(tr[tr.length - 1]);
      const row = p => [r5(p.t), r5(p.spvH), r5(p.spvVert), r5(p.spvTors)];
      return { n: tr.length, peak: row(pk), grid5: grid.map(row) };
    };
    const spv = {};
    for (const side of ['P', 'L']) {
      spv[`dixAct/${side}`] = compact(h.Vestibular.simulateCanalith({ canal: 'posterior', side, q0: [1, 0, 0, 0], timeline: h.actTimeline('dix', side) }), 'posterior', side);
      spv[`headhang/${side}`] = compact(h.engineXi('anterior', side, false, null, null), 'anterior', side);
      spv[`rollGeo/${side}`] = compact(h.engineXi('horizontal', side, false, null, null), 'horizontal', side);
      const qRoll = h.provokeQ('horizontal', side), tl = [{ q: qRoll, tTrans: 0.5, tHold: 60 }];
      spv[`rollCupulo/${side}`] = compact(h.Vestibular.simulateCupulolith({ canal: 'horizontal', side, q0: [1, 0, 0, 0], timeline: tl }), 'horizontal', side);
      spv[`rollLight/${side}`] = compact(h.Vestibular.simulateLightCupula({ canal: 'horizontal', side, q0: [1, 0, 0, 0], timeline: tl }), 'horizontal', side);
    }
    out.spv = spv;
  }

  // SHORT-ARM + JAM (ocena II, V15/D10): piny segmentu bańkowego i czopu. TWARDY INWARIANT (throw,
  // nie pin — fenotypu nie wolno zapiec do golden): znak szczytu short-arm HC/Roll PRZECIWNY do
  // long-arm w tej samej pozie (wolny złóg w ramieniu bańkowym = fenotyp APO, domknięcie R11).
  if (h.Vestibular && h.Vestibular.simulateShortArm && h.stepHeadQ && h.maneuverTimeline) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const peakOf = sim => { let p = sim[0]; for (const s of sim) if (Math.abs(s.xi) > Math.abs(p.xi)) p = s; return p; };
    const sa = {};
    for (const side of ['P', 'L']) {
      const twd = side === 'P' ? 1 : -1;
      const tlAff = [{ q: h.stepHeadQ('supineFlex', 90 * twd, 'up'), tTrans: 0.8, tHold: 30 }];
      const tlHea = [{ q: h.stepHeadQ('supineFlex', -90 * twd, 'up'), tTrans: 0.8, tHold: 40 }];
      const sAff = h.Vestibular.simulateShortArm({ canal: 'horizontal', side, q0: [1, 0, 0, 0], phi0: -20, settled: false, timeline: tlAff });
      const sHea = h.Vestibular.simulateShortArm({ canal: 'horizontal', side, q0: [1, 0, 0, 0], phi0: -20, settled: false, timeline: tlHea });
      const lAff = h.Vestibular.simulateCanalith({ canal: 'horizontal', side, q0: [1, 0, 0, 0], timeline: tlAff });
      if (Math.sign(peakOf(sAff).xi) !== -Math.sign(peakOf(lAff).xi))
        throw new Error(`WYROCZNIA FENOTYPU (V15/D10): short-arm HC/${side} nie jest APO — znak szczytu == long-arm`);
      const dixSA = h.Vestibular.simulateShortArm({ canal: 'posterior', side, q0: [1, 0, 0, 0], phi0: -10, settled: false, timeline: [{ q: h.stepHeadQ('supineHang', 45 * twd, 'up'), tTrans: 0.8, tHold: 40 }] });
      const hhSA = h.Vestibular.simulateShortArm({ canal: 'posterior', side, q0: [1, 0, 0, 0], phi0: -10, settled: false, timeline: [{ q: h.stepHeadQ('supineDeepHang', 0, 'up'), tTrans: 0.8, tHold: 40 }] });
      const acSA = h.Vestibular.simulateShortArm({ canal: 'anterior', side, q0: [1, 0, 0, 0], phi0: -10, settled: false, timeline: [{ q: [1, 0, 0, 0], tTrans: 0.5, tHold: 15 }] });
      sa[side] = {
        rollAff: { plateau: r5(sAff[sAff.length - 1].xi), pressed: sAff.final.pressed },
        rollHealthy: { peak: r5(peakOf(sHea).xi), exited: sHea.final.exited },
        dixIpsi: { peak: r5(peakOf(dixSA).xi), finalPhi: r5(dixSA.final.phi) },
        headhang: { peak: r5(peakOf(hhSA).xi) },
        acSit: { exited: acSA.final.exited, peak: r5(peakOf(acSA).xi) } };
    }
    out.shortarm = sa;
    const jamRes = {};
    for (const side of ['P', 'L']) {
      const jam = { phi: 306.8, xi: 0.5, dir: 1 };
      const ep = h.Vestibular.simulateCanalithJam({ canal: 'posterior', side, q0: [1, 0, 0, 0], jam, timeline: h.maneuverTimeline(h.genPlan('epley', side), 'medium') });
      const yac = h.Vestibular.simulateCanalithJam({ canal: 'posterior', side, q0: [1, 0, 0, 0], jam,
        timeline: [{ q: h.stepHeadQ('supineDeepHang', 0, 'up'), tTrans: 0.8, tHold: 30 }, { q: [1, 0, 0, 0], tTrans: 0.8, tHold: 90 }] });
      jamRes[side] = { epley: { xiMid: r5(ep[Math.floor(ep.length / 2)].xi), jammed: ep.final.jammed, tRelease: r5(ep.final.tRelease) },
        deepHang: { jammed: yac.final.jammed, tRelease: r5(yac.final.tRelease), exited: yac.final.exited } };
    }
    out.jam = jamRes;
  }

  // LYING-DOWN (ocena II, V11/D2): pin liczb faz per scenariusz×strona — dom zaokrągla φ₀ i tnie ξ
  // progiem XI_CARD, więc dryf podprogowy byłby w dom niewidzialny (precedens sessionChain).
  if (h.ldtPhases) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const ldt = {};
    for (const scen of ['textbook', 'afterDix', 'afterRoll', 'neutral'])
      for (const side of ['P', 'L']) {
        const P = h.ldtPhases(side, scen);
        ldt[`${scen}/${side}`] = { phi0: r5(P.init.phi0), lie: r5(P.lie.xi), sit: r5(P.sit.xi),
          phiAfterLie: r5(P.phiAfterLie), exited: P.exited };
      }
    out.lyingdown = ldt;
  }

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
    // ETAP N6 (ocena II, D8): oś czasu — dwa punkty łuku pacjenta. d7 = podostry (comp 0.69, overt+covert);
    // d21+recovery = regeneracja (ton wraca, pacemaker naładowany → mieszany obraz przed Bechterewem).
    try { patients['timeline/neuritisR/d7'] = NV.makePatient(NV.timeline('neuritisR', 7)); } catch {}
    try { patients['timeline/neuritisR/d21rec'] = NV.makePatient(NV.timeline('neuritisR', 21, { recovery: true })); } catch {}
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
      // ETAP N4 (ocena II): nowe testy przyłóżkowe — pinowane od wejścia (czysto addytywne klucze)
      call('hsn', () => NV.hsn(p));
      call('shimpHC_P', () => NV.shimp(p, { canal: 'horizontal', ear: 'P' }));
      call('shimpHC_L', () => NV.shimp(p, { canal: 'horizontal', ear: 'L' }));
      call('pursuit', () => NV.smoothPursuit(p));
      call('dva', () => NV.dva(p));
      call('posture', () => NV.posture(p));   // ETAP N5: oś posturalna GRACE-3
      call('alex', () => NV.alexanderGrade(p, true));   // ETAP N7: stopień prawa Alexandra (fiksacja)
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
  // diagnostyka: wariant KUPULO (test × strona) — pokrycie dodane 2026-08-13 (ocena II, V4/E.4).
  // Fizyka kupulo-HC zmieniła punkt oceny (A1: cel przy osklepku) i CUP_WEAK (B2: 0.6→0.45), a złote
  // ekrany widziały dotąd WYŁĄCZNIE wariant domyślny (canalo) — regresje ekranów kupulo były niewidzialne.
  for (const key of Object.keys(h.DIAG || {})) {
    for (const side of ['P', 'L']) {
      grab(`diag/${key}/${side}/cupulo`, () => {
        if (h.openTest) h.openTest(key); else Object.assign(h.state, { testKey: key, screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        if (h.setVariant) h.setVariant('cupulo'); else h.state.variant = 'cupulo';
        h.render();
      });
    }
  }
  if (h.setVariant) h.setVariant('canalo'); else if (h.state) h.state.variant = 'canalo';   // higiena: nie przenoś wariantu na dalsze sekcje
  // Bow & Lean: scenariusze historii pozycyjnej (ocena II, V5/E.4) — wyrocznia musi widzieć WSZYSTKIE
  // stany karty (textbook jest już w diag/bowlean/{P,L}; tu pozostałe trzy, w tym „model nie rozstrzyga"
  // i „test zadziałał jak manewr" — inaczej regresje trybu uczciwego byłyby niewidzialne).
  for (const scen of ['afterDix', 'afterRoll', 'neutral']) {
    for (const side of ['P', 'L']) {
      grab(`diag/bowlean/${side}/scen-${scen}`, () => {
        if (h.openTest) h.openTest('bowlean'); else Object.assign(h.state, { testKey: 'bowlean', screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        if (h.setBltScenario) h.setBltScenario(scen); else h.state.bltScenario = scen;
        h.render();
      });
    }
  }
  if (h.setBltScenario) h.setBltScenario('textbook'); else if (h.state) h.state.bltScenario = 'textbook';   // higiena
  // Lying-down (ocena II, V11/D2): scenariusze WSPÓLNE z B&L (state.bltScenario) — lustro sekcji wyżej.
  // Bazowe diag/lyingdown/{P,L}(+/cupulo) łapie już pętla po Object.keys(DIAG); tu pozostałe scenariusze.
  for (const scen of ['afterDix', 'afterRoll', 'neutral']) {
    for (const side of ['P', 'L']) {
      grab(`diag/lyingdown/${side}/scen-${scen}`, () => {
        if (h.openTest) h.openTest('lyingdown'); else Object.assign(h.state, { testKey: 'lyingdown', screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        if (h.setBltScenario) h.setBltScenario(scen); else h.state.bltScenario = scen;
        h.render();
      });
    }
  }
  if (h.setBltScenario) h.setBltScenario('textbook'); else if (h.state) h.state.bltScenario = 'textbook';   // higiena

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

  // SESJA CIĄGŁA (ocena II, V10/D1) — default OFF ⇒ klucze czysto ADDYTYWNE; łańcuch stanu MIĘDZY
  // grabami jest zamierzony i deterministyczny (jak scen-*). Pinowane: panel+chipy świeżej sesji,
  // akt 1 i 2 (B7: druga prowokacja bez latencji mech. × dyspersja rep), zaliczenie Epleya w guide,
  // kontrolny Dix po repozycji (fazy nieme, openTest NIE resetuje — ten sam kanał) i powrót do OFF
  // (dixRep=2 zostaje — pin reguły lustrzenia licznika).
  if (h.toggleSessionMode && h.sessionProvoke && h.sessionManeuver) {
    grab('diag/dix/P/session-on', () => { if (h.openTest) h.openTest('dix'); if (h.setDiagSide) h.setDiagSide('P'); h.toggleSessionMode(true); h.render(); });
    grab('diag/dix/P/session-act1', () => { h.sessionProvoke(); h.render(); });
    grab('diag/dix/P/session-act2', () => { h.sessionProvoke(); h.render(); });
    grab('guide/epley/P/session-commit', () => { if (h.startManeuver) h.startManeuver('epley'); h.sessionManeuver(); h.render(); });
    grab('diag/dix/P/session-control', () => { if (h.openTest) h.openTest('dix'); h.render(); });
    grab('diag/dix/P/session-off', () => { h.toggleSessionMode(false); h.render(); });
  }

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
  // engine/pose first (pure, before we mutate state), then dom
  const engine = engineOracle(h);
  const pose = poseOracle(h);
  const dom = domOracle(h, win);
  const meta = {
    target: label,
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

const snap = await collect();
console.log('target        :', snap._meta.target);
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
      diffKeys(snap.engine.sessionChain, gold.engine.sessionChain, 'engine.sessionChain/', diffs);   // V10/D1: bez tej linii pin byłby zapisywany, ale nigdy porównywany
      diffKeys(snap.engine.lyingdown, gold.engine.lyingdown, 'engine.lyingdown/', diffs);            // V11/D2: jw.
      diffKeys(snap.engine.lightcupula, gold.engine.lightcupula, 'engine.lightcupula/', diffs);      // V12/D3: jw.
      diffKeys(snap.engine.spv, gold.engine.spv, 'engine.spv/', diffs);                              // V13/D6: jw.
      diffKeys(snap.engine.shortarm, gold.engine.shortarm, 'engine.shortarm/', diffs);               // V15/D10: jw.
      diffKeys(snap.engine.jam, gold.engine.jam, 'engine.jam/', diffs);                              // V15/D10: jw.
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
