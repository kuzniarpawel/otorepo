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
  // Blok 10 — tryb ekspercki sterowany AKCJAMI. Brak = handleMissing = twardy exit(1), czyli
  // „ekran doboru przestal byc sterowalny z testu" jest bledem, a nie cicha degradacja.
  'pickCanal', 'pickSide', 'openMan', 'goStep', 'pickSize', 'zakonczSerie',
  // Blok 6 — kwalifikacja wstępna. Brak = handleMissing = twardy exit(1).
  'openTriage', 'setTriage', 'toggleTriageFlaga', 'resetTriage',
  // Blok 8 — krok „Oczopląs". Brak = handleMissing = twardy exit(1), czyli „ekranu obserwacji
  // nie da się wysterować z testu" jest błędem, a nie cichą degradacją pokrycia.
  'goObs', 'setObsPole', 'oznaczObsPole', 'setObsGrupa', 'wyczyscObs', 'przyjmijObs',
  // Blok 9 — krok „Interpretacja" ma wlasny ekran. Brak = handleMissing = twardy exit(1).
  'goInterpret', 'przyjmijMechanizm', 'nadpiszMechanizm', 'wrocDoWyprowadzonego', 'idzDoProby',
  // Blok 12 — HINTS/HINTS+ z kwalifikacją. Trzy ekrany sterowane WYŁĄCZNIE akcjami: wstrzyknięcie
  // stanu ominęłoby bramkę wejścia, czyli dokładnie to, czego pilnuje kryterium odbioru nr 1.
  // Brak uchwytu = handleMissing = twardy exit(1).
  'goHintsKwal', 'ustawPrzeszkolenieHints', 'pomijajKwalifikacje', 'cofnijPominiecie', 'zacznijBadanieHints',
  'ustawSkladowaHints', 'ustawPowodNiewiarHints', 'goHintsKrok', 'pokazWynikHints', 'wyczyscBadanieHints',
  // Blok 11 — krok „Kontrola" po manewrze. Brak = handleMissing = twardy exit(1): ekran, ktorego
  // nie da sie wysterowac z testu, nie bylby przypiety zadna wyrocznia.
  'goKontrola', 'ustawWynikKontroli', 'ustawPowodKontroli', 'kontrolaAkcja', 'pytajOZakonczeniu', 'zakonczSesje',
  // Blok 15 — generator opisu badania. Brak = handleMissing = twardy exit(1): ekran, ktorego
  // nie da sie wysterowac z testu, nie bylby przypiety zadna wyrocznia.
  'goOpis', 'przelaczSekcjeOpisu', 'edytujOpis', 'ustawTolerancjeKontroli',
  // Blok 16 — pasek nowej wersji i skroty. Brak = handleMissing = twardy exit(1): komunikat,
  // ktorego nie da sie wysterowac z testu, nie bylby przypiety zadna wyrocznia.
  'aktualizacjaCzeka', 'zerujAktualizacje', 'schowajAktualizacje', 'wdrozAktualizacjeTeraz',
  'obsluzKlawisz', 'syncAktualizacja',
  // Blok 13 — tryb nauki. Ekran, ktorego nie da sie wysterowac z testu, nie bylby przypiety zadna
  // wyrocznia; brak uchwytu = handleMissing = twardy exit(1), a nie ciche zwezenie pokrycia.
  'goNauka', 'otworzPrzypadek', 'wrocDoBiblioteki', 'ustawFiltrNauki', 'goEtapNauki',
  'odpowiedzNauki', 'wskazowkaNauki', 'zakonczPrzypadek', 'wyczyscPostepNauki',
  // Blok 14 — Laboratorium. Brak uchwytu = handleMissing = twardy exit(1).
  'goLab', 'otworzEksperymentLab', 'wrocDoEksperymentow', 'ustawStanowiskoLab',
  'przelaczPorownanieLab', 'ustawParametrLab', 'resetLab', 'opisParametruLab',
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

  // WYROCZNIA WRAŻLIWOŚCI (ocena II, V9/B5): manewry czyszczące muszą czyścić także przy tauP±10%.
  // Margines Semonta wynosił 0.25 s i rekalibracja tauP o +8% zabijała czyszczenie PO CICHU —
  // od V9 derivedHold wyprowadza też hold kroków bez timera z marginesem EXIT_MARGIN, a ten test
  // pilnuje, żeby przyszła rekalibracja stałych nie ubiła żadnego manewru. TWARDY INWARIANT:
  // niepowodzenie rzuca błąd (nie da się go zapiec do golden); wynik trafia też do snapshotu
  // (engine.sensitivity), więc dryf wykryje również --check. Rozmiar medium = najcieńsze marginesy
  // (small/big mają większe — patrz tabela minimalnych holdów w engine_doc).
  if (h.Vestibular && h.maneuverTimeline) {
    const sensFails = [];
    for (const key of ['epley', 'semont', 'bascule', 'lempert', 'gufoniGeo', 'yacovino', 'zuma', 'kim'])   // D11/V18: nowe manewry POD ochroną tauP±10% od urodzenia (pre-test projektu: zielony)
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
    out.sensitivity = 'PASS(tauP±10%: 8 manewrów × 2 strony × 2 mnożniki = 32/32)';

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

  // V24: timeline'y INLINE tego bloku (short-arm i jam) są ŚWIADOMIE BEZ KARKU — pin SEMANTYKI
  // SILNIKA, NIE lustro rollShortPhases/aktów aplikacji (te od V24 niosą kark i prefiks).
  // Dwuźródłowość celowa: nie wyrównywać bez osobnej decyzji.
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
    const jamRes = {}, jamPredFails = [];
    for (const side of ['P', 'L']) {
      // V23: parametry z JEDNEGO źródła (JAM_DEMO warstwy domenowej — bit-równe dawnemu literałowi
      // 306.8=pcrus); fallback WEWNĘTRZNY, nie w bramce zewnętrznej — stary build bez eksportu
      // zachowuje piny shortarm+jam bez zmian.
      const jam = h.JAM_DEMO ? { ...h.JAM_DEMO } : { phi: 306.8, xi: 0.5, dir: 1 };
      const ep = h.Vestibular.simulateCanalithJam({ canal: 'posterior', side, q0: [1, 0, 0, 0], jam, timeline: h.maneuverTimeline(h.genPlan('epley', side), 'medium') });
      const yac = h.Vestibular.simulateCanalithJam({ canal: 'posterior', side, q0: [1, 0, 0, 0], jam,
        timeline: [{ q: h.stepHeadQ('supineDeepHang', 0, 'up'), tTrans: 0.8, tHold: 30 }, { q: [1, 0, 0, 0], tTrans: 0.8, tHold: 90 }] });
      jamRes[side] = { epley: { xiMid: r5(ep[Math.floor(ep.length / 2)].xi), jammed: ep.final.jammed, tRelease: r5(ep.final.tRelease) },
        deepHang: { jammed: yac.final.jammed, tRelease: r5(yac.final.tRelease), exited: yac.final.exited } };
      // V23: karta jam — piny jako PŁASKIE klucze RODZEŃSTWA (diffKeys porównuje pierwszy poziom
      // engine.jam: zagnieżdżenie w jamRes[side] zmieniłoby ISTNIEJĄCE klucze P/L zamiast dodać nowe).
      // JAM_PRED — TWARDY throw wyłącznie na LOGICE predykcji (Epley trzyma, pełny Yacovino uwalnia);
      // liczby (tRelease/relDelta/minXi/finalPhi/exited/postEpley) = piny r5 — rekalibracja
      // crusGrav/bond zmieniająca liczby bez odwrócenia predykcji to jawny rebaseline, nie FAIL.
      // exited ŚWIADOMIE pinem (kontyngentne od holdów derivedHold). relMap: churn przy okablowaniu
      // karku B8 w diagnostyce = oczekiwany rebaseline.
      if (h.jamDemo) {
        const J = h.jamDemo(side);
        if (!(J.epley.jammed === true && J.epley.tRelease == null && J.yac.jammed === false && J.yac.tRelease != null))
          jamPredFails.push(`${side}: epley ${J.epley.jammed}/${J.epley.tRelease} yac ${J.yac.jammed}/${J.yac.tRelease}`);
        jamRes[`${side}/yacFull`] = { tRelease: r5(J.yac.tRelease), relDelta: r5(J.yac.relDelta), minXi: r5(J.yac.minXi), finalPhi: r5(J.yac.finalPhi), exited: J.yac.exited };
        jamRes[`${side}/postEpley`] = { exited: J.postEpley.exited, expelDur: r5(J.postEpley.expelDur) };
        jamRes[`${side}/dix`] = { jammed: J.dix.jammed, endXi: J.dix.endXi.map(r5) };
        jamRes[`${side}/relMap`] = Object.fromEntries(Object.entries(J.relMap).map(([k, v]) => [k, r5(v)]));
        jamRes[`${side}/holds`] = { semont: J.semont.jammed, bascule: J.bascule.jammed };
      }
    }
    if (jamPredFails.length) throw new Error('WYROCZNIA JAM_PRED (Epley trzyma / Yacovino uwalnia) NIE PRZESZŁA: ' + jamPredFails.join(' · '));
    out.jam = jamRes;
  }
  // ===== V25: AKT ROLL — czy test diagnostyczny opróżnia kanał (jedyna wyrocznia tej własności) =====
  // Zmiana zgięcia pozy (HC_FLEX_DEG) przesunęła próg opróżnienia z holdu 25 s na 20 s = dokładnie
  // wartość ACT_STEPS.roll, więc akt Roll wyprowadza teraz złóg do łagiewki. To NAJWAŻNIEJSZY nowy
  // skutek zmiany, a przed V25 nie pilnowała go ŻADNA wyrocznia (zarzut blokujący krytyka wyroczni):
  // regres wróciłby z zielonym snapshotem. Liczby = PINY (kontyngentne od holdów i rozmiaru);
  // TWARDY throw wyłącznie na NIEZBYWALNEJ semantyce karty.
  if (h.sessionPreview && h.actTimeline && h.Vestibular) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const fresh = (side, size) => ({ canal: 'horizontal', side, size, phi: null, xi: 0, bondFrac: 1,
      stuck: true, exited: false, inCrus: false, rep: 0, acts: [], tSession: 0 });
    const ra = {};
    for (const side of ['P', 'L']) for (const size of ['small', 'medium', 'big']) {
      const pv = h.sessionPreview(fresh(side, size), 'roll');
      const sim = h.Vestibular.simulateCanalith({ canal: 'horizontal', side, size, q0: [1, 0, 0, 0],
        timeline: h.actTimeline('roll', side) });
      const ex = sim.find(s => s.exited);
      ra[side + '/' + size] = {
        exited: pv.exited, exitStep: pv.exitStep, tExit: ex ? r5(ex.t) : null,
        phases: pv.phases.map(x => ({ xi: r5(x.xi), exited: !!x.exited, gone: !!x.gone })) };
      // (1) ŚWIEŻY chory NIGDY nie może mieć fazy oznaczonej „gone" (= złóg poza kanałem PRZED tą
      //     fazą). Naruszenie = karta uczy, że nieleczony HC-BPPV ma niemy test obustronny.
      if (pv.phases.some(x => x.gone))
        throw new Error(`WYROCZNIA AKTU ROLL (V25): świeży chory HC/${side}/${size} ma fazę oznaczoną "gone" — karta pokaże niemy test u NIELECZONEGO`);
      // (2) Faza pierwsza (ucho chore w dole) musi nieść odpowiedź: to ona lateralizuje.
      if (!(Math.abs(pv.phases[0].xi) > 0))
        throw new Error(`WYROCZNIA AKTU ROLL (V25): faza "ucho chore w dole" HC/${side}/${size} bez odpowiedzi`);
      // (3) Ekspulsja, jeśli zachodzi, może zdarzyć się TYLKO w ostatnim kroku pozycyjnym — nigdy
      //     w pierwszej fazie (inaczej test traci fazę porównawczą, a lateralizacja przestaje istnieć).
      if (pv.exitStep != null && pv.exitStep < 2)
        throw new Error(`WYROCZNIA AKTU ROLL (V25): HC/${side}/${size} opróżnia kanał w kroku ${pv.exitStep} (< 2) — utrata fazy porównawczej`);
    }
    // (4) Lustro P/L bit-w-bit — poza jest symetryczna, więc rozjazd = błąd, nie fizjologia.
    for (const size of ['small', 'medium', 'big'])
      if (JSON.stringify(ra['P/' + size]) !== JSON.stringify(ra['L/' + size]))
        throw new Error(`WYROCZNIA AKTU ROLL (V25): lustro P/L rozjechane dla ${size}`);
    out.rollact = ra;
  }

  // ENSEMBLE (ocena II, V20/D9): chmura N=9 cząstek na JEDNEJ kanonicznej timeline — pin tabeli
  // frakcji częściowej repozycji (sedno D9) + siatki (cicha zmiana siatki = FAIL) dla 9 manewrów × 2
  // stron. TWARDA WYROCZNIA CHMURY (throw, nie pin — wzorzec fenotypu V15): środkowa cząstka
  // (grid[4]=1.0) MUSI być BIT-RÓWNA maneuverSim — karta chmury nie może rozjechać się z tym, co
  // grają oczy/pasek objawów (kanoniczna pojedyncza). Pokrycie ścieżki size LICZBOWEGO w silniku
  // (poza ensemble nieużywanej — regresje ciągłego r byłyby bez tego niewidzialne).
  if (h.ensembleSim && h.ENS_GRID && h.maneuverSim) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const r1 = x => x == null ? null : +(+x).toFixed(1);
    const ens = { grid: h.ENS_GRID.map(r5) };
    const cloudFails = [];
    for (const key of Object.keys(h.MANEUVERS || {})) {
      for (const side of ['P', 'L']) {
        const plan = h.genPlan(key, side);
        const e = h.ensembleSim(plan, 'medium');
        ens[`${key}/${side}`] = { M: e.M, exitedN: e.exitedN, fracN: r5(e.fracN), fracMass: r5(e.fracMass),
          meanPeak: r5(e.meanPeak), tPeak: r5(e.tPeak), tExit: e.parts.map(p => r1(p.tExit)) };
        const mid = e.parts[4].sim, can = h.maneuverSim(plan, 'medium');
        let eq = mid.length === can.length;
        if (eq) for (let i = 0; i < mid.length; i++) { if (mid[i].xi !== can[i].xi || mid[i].phi !== can[i].phi || mid[i].exited !== can[i].exited) { eq = false; break; } }
        if (!eq) cloudFails.push(`${key}/${side}`);
      }
    }
    if (cloudFails.length) throw new Error('WYROCZNIA CHMURY (środek≡kanoniczna) NIE PRZESZŁA: ' + cloudFails.join(', '));
    out.ensemble = ens;
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

  // EGZAMIN (ocena II, V21/D7): losowy pacjent ważony epidemiologią + cross-test.
  // TWARDE THROWY (nie piny — wzorzec sensitivity/CLOUD): (1) suma PRIORS = 1±1e-9 (ŚWIADOMIE tu,
  // nie przy imporcie — literówka w tabeli ma oblać CI, nie ubić boot PWA); (2) walidacja KSZTAŁTU
  // 300 pacjentów (multi = PC+HC ta sama strona; bilat = PC-P + PC-L; mech=null w puli V21);
  // (3) determinizm double-run (łapie przemyt Math.random/Date.now); (4) EXAM_SANE — zgodność
  // ZNAKÓW/kind mono-pacjenta z kanoniczną kartą statyczną na teście macierzystym (tożsamość
  // AMPLITUD jest z konstrukcji niemożliwa: karta statyczna ma strength z konwencji, egzamin
  // z dynamiki |ξ| — porównujemy to, co porównywalne). Piny: tabela PRIORS, pacjenci seeds 1..12,
  // rozkład na 300 ziarnach, macierz cross 7 pacjentów × 9 póz, klucz odpowiedzi 3 ziaren,
  // męczliwość rep=2.
  if (h.PRIORS && h.mulberry32 && h.randomPatient && h.examPhaseNys && h.examAnswerKey && h.nysFromGeom && h.stepHeadQ) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const ex = {};
    const sum = h.PRIORS.reduce((a, w) => a + w.p, 0);
    if (Math.abs(sum - 1) > 1e-9) throw new Error(`WYROCZNIA EGZAMINU: suma PRIORS = ${sum} ≠ 1`);
    ex.priors = h.PRIORS.map(w => ({ key: w.key, p: r5(w.p) }));
    const shapeFails = [], dist = {};
    for (let s = 1; s <= 300; s++) {
      const p = h.randomPatient(h.mulberry32(s));
      dist[p.row] = (dist[p.row] || 0) + 1;
      const L = p.lesions;
      const bad =
        !(L.length >= 1 && L.length <= 2) ? 'len' :
        L.some(l => !['posterior', 'horizontal', 'anterior'].includes(l.canal) || !['P', 'L'].includes(l.side) || !['canalo', 'cupulo'].includes(l.variant) || l.mech !== null) ? 'pola' :
        (p.row === 'multiPcHc' && !(L.length === 2 && L[0].canal === 'posterior' && L[1].canal === 'horizontal' && L[0].side === L[1].side)) ? 'multi' :
        (p.row === 'bilatPc' && !(L.length === 2 && L[0].canal === 'posterior' && L[1].canal === 'posterior' && L[0].side === 'P' && L[1].side === 'L')) ? 'bilat' : null;
      if (bad) shapeFails.push(`s${s}:${bad}`);
    }
    if (shapeFails.length) throw new Error('WYROCZNIA EGZAMINU (kształt pacjenta): ' + shapeFails.join(', '));
    ex.dist300 = dist;
    const d1 = JSON.stringify(h.randomPatient(h.mulberry32(7))), d2 = JSON.stringify(h.randomPatient(h.mulberry32(7)));
    if (d1 !== d2) throw new Error('WYROCZNIA EGZAMINU (determinizm): randomPatient(mulberry32(7)) niestabilny');
    ex.patients = {};
    for (let s = 1; s <= 12; s++) ex.patients[`s${s}`] = h.randomPatient(h.mulberry32(s));
    const Q = { dixP: h.stepHeadQ('supineHang', 45, 'up'), dixL: h.stepHeadQ('supineHang', -45, 'up'),
      rollP: h.stepHeadQ('supineFlex', 90, 'up'), rollL: h.stepHeadQ('supineFlex', -90, 'up'),
      bow: h.stepHeadQ('sit', 0, 'down'), lean: h.stepHeadQ('sit', 0, 'up'),
      lie: h.stepHeadQ('supineFlex', 0, 'up'), sit: h.stepHeadQ('sit', 0, 'fwd'), hh: h.stepHeadQ('supineDeepHang', 0, 'up') };
    const LES = { pcP: [{ canal: 'posterior', side: 'P', variant: 'canalo', mech: null }],
      pcCupP: [{ canal: 'posterior', side: 'P', variant: 'cupulo', mech: null }],
      hcGeoP: [{ canal: 'horizontal', side: 'P', variant: 'canalo', mech: null }],
      hcApoP: [{ canal: 'horizontal', side: 'P', variant: 'cupulo', mech: null }],
      acP: [{ canal: 'anterior', side: 'P', variant: 'canalo', mech: null }],
      multiP: [{ canal: 'posterior', side: 'P', variant: 'canalo', mech: null }, { canal: 'horizontal', side: 'P', variant: 'canalo', mech: null }],
      bilat: [{ canal: 'posterior', side: 'P', variant: 'canalo', mech: null }, { canal: 'posterior', side: 'L', variant: 'canalo', mech: null }] };
    const cross = {};
    for (const [lk, les] of Object.entries(LES))
      for (const [qk, q] of Object.entries(Q)) {
        const N = h.examPhaseNys(les, q, 0);
        cross[`${lk}/${qk}`] = { k: N.kind === 'horizontal' ? 'h' : 'u', dir: N.dir, vdir: N.vdir, s: r5(N.strength) };
      }
    ex.cross = cross;
    const saneFails = [];
    const sane = [
      ['pcP/dixP', LES.pcP, Q.dixP, h.nysFromGeom('posterior', 'P', 'canalo', Q.dixP)],
      ['pcCupP/dixP', LES.pcCupP, Q.dixP, h.nysFromGeom('posterior', 'P', 'cupulo', Q.dixP)],
      ['hcGeoP/rollP', LES.hcGeoP, Q.rollP, h.nysFromGeom('horizontal', 'P', 'canalo', Q.rollP, 'asym')],
      ['hcGeoP/rollL', LES.hcGeoP, Q.rollL, h.nysFromGeom('horizontal', 'P', 'canalo', Q.rollL, 'asym')],
      ['hcApoP/rollP', LES.hcApoP, Q.rollP, h.nysFromGeom('horizontal', 'P', 'cupulo', Q.rollP, 'asym')],
      ['hcApoP/rollL', LES.hcApoP, Q.rollL, h.nysFromGeom('horizontal', 'P', 'cupulo', Q.rollL, 'asym')],
      ['acP/hh', LES.acP, Q.hh, h.nysFromGeom('anterior', 'P', 'canalo', Q.hh)],
    ];
    for (const [name, les, q, C] of sane) {
      const N = h.examPhaseNys(les, q, 0);
      if (N.kind !== C.kind || (N.dir !== C.dir && N.dir !== 0) || N.vdir !== C.vdir)
        saneFails.push(`${name}: exam ${N.kind}/${N.dir}/${N.vdir} vs kanon ${C.kind}/${C.dir}/${C.vdir}`);
    }
    if (saneFails.length) throw new Error('WYROCZNIA EGZAMINU (EXAM_SANE — znaki mono vs karta kanoniczna): ' + saneFails.join(' · '));
    // (determinizm examPhaseNys niesie podwójny collect — wywołanie 2× tutaj byłoby tautologią przez memo)
    ex.fatigue = { rep0: r5(h.examPhaseNys(LES.pcP, Q.dixP, 0).strength), rep2: r5(h.examPhaseNys(LES.pcP, Q.dixP, 2).strength),
      cupRep2: r5(h.examPhaseNys(LES.pcCupP, Q.dixP, 2).strength) };
    ex.answers = {};
    for (const s of [2, 4, 30]) {
      const p = h.randomPatient(h.mulberry32(s));
      ex.answers[`s${s}`] = h.examAnswerKey(p.lesions).map(a => ({ tier: a.classify.tier, primary: a.rec.primary, alts: a.rec.alts }));
    }
    out.exam = ex;
  }

  // GRACE (ocena II, V22/D8): demo t-EVS na ekranie HINTS + archetypy taksonomii.
  // TWARDE THROWY (własności fizyczne, nie piny): (a) CISZA SPOCZYNKU EMERGENTNA — wszystkie próbki
  // t≤TEVS_REST < 1e-9 (fizyka daje DOKŁADNIE 0: restPhi+adhezja; próg VIS_THRESH byłby za luźny);
  // (b) paroksyzm ≥ VIS_THRESH; (c) czysto siedząca symulacja 30 s = dokładne 0; (d) TRANSLACJA:
  // szczyt |ξ| demo bit-równy kanonicznemu engineXi, tPeak przesunięte o dokładnie TEVS_REST —
  // prefiks spoczynku niczego nie zmienia w fizyce prowokacji (analog B7); (e) hints() zdrowego:
  // normal/applicable=false/nota null/pattern none; (f) kontrast AVS: spv(neuritisR)≥VIS_THRESH
  // i applicable=true. Ogon po SIT_SEG ŚWIADOMIE bez throwa (margines 0,18 °/s = zapieczona
  // kruchość) — dryf łapie pin. Piny kompaktowe + linia diffKeys w --check.
  if (h.tevsDemoSim && h.TEVS_REST != null && h.spvTrace && h.NeuroVOR && h.engineXi) {
    const r5 = x => x == null ? null : +(+x).toFixed(5);
    const sim = h.tevsDemoSim();
    const trace = h.spvTrace(sim, 'posterior', 'P');
    const V = h.NeuroVOR.VIS_THRESH, dt = trace[1].t - trace[0].t, REST = h.TEVS_REST, provEnd = REST + 0.5 + 40;
    if (Math.abs(REST / dt - Math.round(REST / dt)) > 1e-9) throw new Error(`WYROCZNIA GRACE: TEVS_REST=${REST} niepodzielne przez dt=${dt}`);
    const mag = trace.map(s => Math.max(Math.abs(s.spvH), Math.abs(s.spvVert), Math.abs(s.spvTors)));
    let pk = 0, tPk = 0, tOn = null, over = 0, hump = 0;
    trace.forEach((s, i) => {
      if (s.t <= REST && mag[i] > 1e-9) throw new Error(`WYROCZNIA GRACE (cisza spoczynku): |SPV|=${mag[i]} @t=${s.t}`);
      if (mag[i] > pk) { pk = mag[i]; tPk = s.t; }
      if (s.t <= provEnd && mag[i] >= V) { if (tOn == null) tOn = s.t; over += dt; }
      if (s.t > provEnd && mag[i] > hump) hump = mag[i];
    });
    if (pk < V) throw new Error(`WYROCZNIA GRACE (paroksyzm podprogowy): szczyt ${pk} < ${V}`);
    const sitSim = h.Vestibular.simulateCanalith({ canal: 'posterior', side: 'P', q0: [1, 0, 0, 0], timeline: [{ q: [1, 0, 0, 0], tTrans: 0.5, tHold: 30, pivot: 'body' }] });
    let sitMax = 0; for (const s of sitSim) sitMax = Math.max(sitMax, Math.abs(s.xi));
    if (sitMax > 1e-9) throw new Error(`WYROCZNIA GRACE (siedzenie nie jest ciszą): max|ξ|=${sitMax}`);
    const bare = h.engineXi('posterior', 'P', false, null, null);
    let bpk = 0, btPk = 0; for (const s of bare) { const m = Math.abs(s.xi); if (m > bpk) { bpk = m; btPk = s.t; } }
    let dpk = 0, dtPk = 0; for (const s of sim) { const m = Math.abs(s.xi); if (m > dpk) { dpk = m; dtPk = s.t; } }
    if (Math.abs(dpk - bpk) > 1e-12 || Math.abs((dtPk - btPk) - REST) > dt / 2 + 1e-9)
      throw new Error(`WYROCZNIA GRACE (translacja): |ξ| demo ${dpk}@${dtPk} vs kanon ${bpk}@${btPk} (REST=${REST})`);
    const Hh = h.NeuroVOR.hints(h.NeuroVOR.makePatient({}));
    if (!(Hh.verdict === 'normal' && Hh.applicable === false && Hh.verdictNote == null && Hh.ny.pattern === 'none'))
      throw new Error(`WYROCZNIA GRACE (hints zdrowego): ${Hh.verdict}/${Hh.applicable}/${Hh.verdictNote}/${Hh.ny.pattern}`);
    const avsSpv = h.NeuroVOR.observe(h.NeuroVOR.scenario('neuritisR'), false).spv;
    const Ha = h.NeuroVOR.hints(h.NeuroVOR.scenario('neuritisR'));
    const Hc = h.NeuroVOR.hints(h.NeuroVOR.scenario('strokeCentral'));
    if (!(avsSpv >= V && Ha.applicable === true)) throw new Error(`WYROCZNIA GRACE (kontrast AVS): spv=${avsSpv}, applicable=${Ha.applicable}`);
    out.grace = {
      tevsDemo: { n: trace.length, peak: r5(pk), tPeak: r5(tPk), latency: r5(tOn - REST), overDur: r5(over), hump: r5(hump), tail: r5(mag[mag.length - 1]) },
      archetypes: { tevs: { verdict: Hh.verdict, applicable: Hh.applicable, ny: Hh.ny.pattern },
        avs: { verdict: Ha.verdict, applicable: Ha.applicable }, avsCentral: { verdict: Hc.verdict, applicable: Hc.applicable }, avsSpv: r5(avsSpv) },
    };
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

  /* KARTA POWROTU DO PRZERWANEJ SESJI. Klucz `start` wyzej zrzuca stan CZYSTY, wiec karta sie
     w nim nie renderuje — cala nowa powierzchnia (podpis kroku, kropki postepu z flowStatuses,
     dwie akcje, dwustopniowe potwierdzenie akcji niszczacej) mialaby w zlotym wzorcu zero stanow.
     Postep ustawiamy JAWNIE na polach `flow`, bo tego wlasnie dotyka karta; proba i strona wchodza
     do podtytulu. Zrzut jest deterministyczny, bo karta NIE pokazuje czasu — patrz komentarz przy
     startResume w svg-screens.js. */
  grab('start/sesja', () => {
    h.state.screen = 'start'; h.state.mode = 'diag'; h.state.area = 'start';
    h.state.testKey = 'dix'; h.state.side = 'L'; h.state.zakonczeniePyta = false;
    h.state.flow = { testSeen: true, obsSeen: true, interpretSeen: false, maneuver: null };
    h.render();
  });
  grab('start/sesja-pyta', () => { h.state.zakonczeniePyta = true; h.render(); });
  // Powrot do stanu wyjsciowego — kolejne klucze nie moga dziedziczyc postepu po tej sekcji.
  grab('start/czysty-po-sesji', () => {
    h.state.zakonczeniePyta = false;
    h.state.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
    h.state.testKey = 'dix'; h.state.side = 'P'; h.state.mode = 'treat'; h.state.area = 'start';
    h.render();
  });

  // setup
  grab('setup', () => { h.state.screen = 'setup'; h.state.mode = 'treat'; h.render(); });

  /* TRYB EKSPERCKI (Blok 10) — sterowany PRAWDZIWYMI AKCJAMI, nie wstrzyknięciem stanu.
     Powód: klucz `setup` powyżej jest zrzucany przy `state.canal === null`, więc karta doboru
     w ogóle się w nim nie renderuje — cała nowa powierzchnia (trzy selektory, manewr pierwszego
     rzutu odróżniony od alternatyw, zdanie o AUTORSTWIE kanału/strony/mechanizmu) miałaby w złotym
     wzorcu zero stanów i `snapshot:check` świeciłby na zielono nad ekranem, którego głównej treści
     nigdy nie widział. Akcje, a nie Object.assign: napis o autorstwie stoi na `sideZrodlo`
     i `variantZrodlo`, które ustawiają WYŁĄCZNIE akcje — wstrzyknięty stan przypiąłby zdanie,
     do którego aplikacja nie ma drogi. Wzorzec z sekcji `obs/*`. */
  {
    const czystyEkspert = () => {
      Object.assign(h.state, { screen: 'setup', mode: 'treat', canal: null, maneuverKey: null,
        plan: null, step: 0, side: 'P', sideZrodlo: null, variant: 'canalo', variantZrodlo: null, testKey: null,
        flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null } });
    };
    // sam kanał — reszta DOMYŚLNA (zdanie o autorstwie musi to przyznać)
    grab('setup/ekspert/kanal-tylko', () => { czystyEkspert(); h.pickCanal('posterior'); });
    // komplet trzech deklaracji, kanał tylny × kanalolitiaza (pierwszy rzut: Epley, alternatywa: Semont)
    grab('setup/ekspert/tylny-kanalo', () => { czystyEkspert(); h.pickCanal('posterior'); h.pickSide('L'); h.setVariant('canalo'); });
    // kupulolitiaza kanału tylnego — pierwszym rzutem jest INNY manewr (Semont), z dwiema alternatywami
    grab('setup/ekspert/tylny-kupulo', () => { czystyEkspert(); h.pickCanal('posterior'); h.pickSide('P'); h.setVariant('cupulo'); });
    // kanał poziomy apogeotropowy — pierwszym rzutem manewr KONWERSJI (Gufoni apo)
    grab('setup/ekspert/poziomy-kupulo', () => { czystyEkspert(); h.pickCanal('horizontal'); h.pickSide('P'); h.setVariant('cupulo'); });
    // kanał przedni — JEDEN manewr, więc sekcja alternatyw nie ma prawa się pojawić
    grab('setup/ekspert/przedni', () => { czystyEkspert(); h.pickCanal('anterior'); h.pickSide('L'); h.setVariant('canalo'); });
    czystyEkspert();
  }

  // guide: manewr × strona × wszystkie kroki (rozmiar medium)
  const CANAL_OF = h.CANAL_OF ||
    { epley: 'posterior', semont: 'posterior', lempert: 'horizontal', gufoniGeo: 'horizontal', gufoniApo: 'horizontal', yacovino: 'anterior' };
  for (const key of Object.keys(h.MANEUVERS || {})) {
    for (const side of ['P', 'L']) {
      let plan;
      //  stempluje w aplikacji przebudujPlan (actions.js); harness buduje plan wprost,
      // wiec musi zrobic to samo — inaczej ekran manewru widzi plan bez tozsamosci.
      try { plan = h.genPlan(key, side); plan.key = key; } catch (e) { out[`guide/${key}/${side}`] = 'ERR:' + e.message; continue; }
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
  // V26: KARTA DIX W TRYBIE KANAŁU PRZEDNIEGO (antMode) — luka pokrycia ujawniona przy zdejmowaniu
  // maski anterior.t. Cały tor „downbeat w Dix–Hallpike'u → kanał przedni ucha przeciwnego" nie miał
  // w złotym wzorcu ANI JEDNEGO ekranu, więc etykieta oczopląsu i nota lateralizacji mogły zacząć
  // kłamać bez jednego bajtu różnicy (ta sama klasa luki co Roll pod sesją w V25).
  if (h.setDixObs) {
    for (const side of ['P', 'L'])
      grab(`diag/dix/${side}/antMode`, () => {
        if (h.openTest) h.openTest('dix'); else Object.assign(h.state, { testKey: 'dix', screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        h.setDixObs('ant');
        h.render();
      });
    h.setDixObs('post');                                   // higiena: nie przenoś trybu na dalsze sekcje
    if (h.setDiagSide) h.setDiagSide('P');
  }
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
  // D4/V16: mechanizmy alternatywne fenotypów HC (light w obrębie geo, short w obrębie apo) — bez tego
  // pokrycia regresje kart mech-* byłyby niewidzialne (wzorzec sekcji kupulo wyżej). setVariant PRZED
  // setMechanism (setVariant zeruje mechanizm — higiena flipa); higiena po pętli przywraca default.
  for (const key of ['roll', 'bowlean', 'lyingdown']) {
    for (const side of ['P', 'L']) {
      grab(`diag/${key}/${side}/mech-light`, () => {
        if (h.openTest) h.openTest(key); else Object.assign(h.state, { testKey: key, screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        if (h.setVariant) h.setVariant('canalo'); else h.state.variant = 'canalo';
        if (h.setMechanism) h.setMechanism('light'); else h.state.mechanism = 'light';
        h.render();
      });
      grab(`diag/${key}/${side}/mech-short`, () => {
        if (h.openTest) h.openTest(key); else Object.assign(h.state, { testKey: key, screen: 'diag' });
        if (h.setDiagSide) h.setDiagSide(side); else h.state.side = side;
        if (h.setVariant) h.setVariant('cupulo'); else h.state.variant = 'cupulo';
        if (h.setMechanism) h.setMechanism('short'); else h.state.mechanism = 'short';
        h.render();
      });
    }
  }
  if (h.setMechanism) h.setMechanism(null); else if (h.state) h.state.mechanism = null;    // higiena mechanizmu
  if (h.setVariant) h.setVariant('canalo'); else if (h.state) h.state.variant = 'canalo';  // higiena wariantu

  /* Krok „Oczopląs" (Blok 8) — opis ZAOBSERWOWANEGO wyniku. Pinujemy stany, w których ekran
     mówi RÓŻNE rzeczy, bo to jedyne miejsce w aplikacji, gdzie zapisuje się relacja człowieka,
     a nie wynik modelu. Najważniejsze trzy: `pusty` (nie wolno niczego zakładać), `czysto-skretny`
     (znalezisko, nie brak danych) i `niewiarygodne` (kwarantanna wycisza wniosek, ale ostrzeżenie
     ZOSTAJE — cicha zmiana tej reguły byłaby regresją bezpieczeństwa niewidoczną w żadnej innej
     bramce). Rekordy budujemy przez PRAWDZIWE akcje, nie przez wstrzyknięcie stanu. */
  if (h.goObs && h.setObsPole && h.oznaczObsPole && h.setObsGrupa) {
    // Rekordy obserwacji PRZEŻYWAJĄ nawigację (to celowe), więc bez zerowania między scenariuszami
    // wyciekałyby jeden na drugi i kolejność bloków zaczęłaby wpływać na złoty wzorzec.
    /* PRZECIEK MIĘDZY SCENARIUSZAMI ZŁAPANY PRZY SCALENIU (Etap 4, 2026-08-17). Do listy weszły
       `variantZrodlo`, `sideZrodlo`, `variant` i `mechanism`. Powód jest mierzalny, nie estetyczny:
       gałąź main dołożyła 62 scenariusze rodziny `diag` (warianty cupulo), a one wołają `setVariant`, które ustawia
       `variantZrodlo='nadpisany'`. Scenariusze Bloku 9 lecą PO nich i nic tego pola nie zerowało —
       więc ekran interpretacji dla przypadku PUSTEGO (zero opisu, zero gestów) zaczął pisać
       „ustawiony ręcznie przez Ciebie" zamiast „HIPOTEZA MODELU". Golden zamroziłby zdanie, które
       przypisuje użytkownikowi decyzję, której nie podjął — czyli dokładnie tę klasę usterki, dla
       której Blok 9 wprowadził `variantZrodlo`. Bez tej linii przypadki przechodzą przez KOLEJNOŚĆ
       scenariuszy, a nie przez kod aplikacji. */
    const czystyObs = () => { h.state.obs = {}; h.state.obsGrupa = null; h.state.dixObs = null;
      h.state.variant = 'canalo'; h.state.variantZrodlo = null; h.state.sideZrodlo = null; h.state.mechanism = null; };
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

    /* OBRAZ NIETYPOWY NA EKRANIE PRÓBY (Blok 9, kryterium odbioru nr 3). Para scenariuszy
       bliźniaczych, różniących się WYŁĄCZNIE kierunkiem w drugiej fazie rolla: geotropowy
       (kierunek się odwraca) prowadzi do manewru, stały (nie odwraca się — flaga f3) prowadzi
       do komunikatu zamiast przycisku. Bez tej PARY klucz pinowałby tylko jeden stan i nie
       byłoby widać, że różnicę robi obserwacja, a nie sam fakt istnienia opisu.
       Wnętrze bloku leczenia jest tu jedynym miejscem, gdzie golden widzi rekomendację manewru
       pod kontrolą opisu — `interp:dom` bada obecność przycisku, a nie brzmienie zdań. */
    const diagPoOpisie = (tag, proba, kroki) => grab(`diag/${tag}`, () => {
      czystyObs();
      if (h.openTest) h.openTest(proba); else Object.assign(h.state, { testKey: proba });
      if (h.setDiagSide) h.setDiagSide('P');
      for (const [klucz, w] of kroki) h.setObsPole(proba, klucz, w);
      h.render();
    });
    diagPoOpisie('roll-geotropowy/P', 'roll', [
      ['poziom#prawoWDole', 'p1'], ['pion#prawoWDole', 'zero'],
      ['poziom#lewoWDole', 'm1'], ['pion#lewoWDole', 'zero'], ['nasilenie', 'silniejsza']]);
    diagPoOpisie('roll-kierunek-staly/P', 'roll', [
      ['poziom#prawoWDole', 'p1'], ['pion#prawoWDole', 'zero'],
      ['poziom#lewoWDole', 'p1'], ['pion#lewoWDole', 'zero']]);

    /* ═══ KANAŁ PRZEDNI × KUPULOLITIAZA — jedyna kombinacja POZA klasyfikacją ICVD ═══
       Dług zapisany jawnie w commicie E1 („to miejsce na nowy przypadek golden") i domykany tutaj.
       E1 zmienił etykietę tej jednej postaci — [H48] von Brevern 2015 wylicza sześć kombinacji
       kanał × mechanizm i mówi wprost, że udokumentowano zapisem ruchów gałek i WŁĄCZONO do
       klasyfikacji wszystkie POZA kupulolitiazą kanału przedniego — a poprawkę zweryfikowano
       wtedy WPROST na funkcji `baranyClassify`, bo golden jej nie widział.
       DLACZEGO NIE WIDZIAŁ, ZMIERZONE: klucze `diag/headhang/{P,L}/cupulo` w złotym wzorcu SĄ
       (wbrew temu, co mówi commit E1 — tam napisano „0 trafień", i to była pomyłka), ale karty
       klasyfikacji NIE ZAWIERAJĄ: `renderDiag` podmienia ją na `kartaBezOpisu`, dopóki
       `obsPoparcie` zwraca poziom „brak", a tamte klucze wchodzą na ekran próby bez jednego
       dotknięcia formularza obserwacji. Trafienie na „kupulolitiaza kanału przedniego" w ich
       wartości pochodzi z noty `recommend()`, nie z karty Bárány.
       Dlatego ten przypadek OPISUJE obraz: uporczywy downbeat bez latencji i bez męczliwości,
       czyli komplet wag 3 osi kierunku i dynamiki → poparcie „pełne" → karta z plakietką tieru.
       Mechanizm bierze się z PRZYJĘCIA wyprowadzenia (`przyjmijMechanizm`), a nie z nadpisania —
       inaczej klucz pinowałby decyzję harnessu zamiast wniosku modelu. */
    grab('diag/headhang-kupulo/P', () => {
      czystyObs();
      if (h.openTest) h.openTest('headhang'); else Object.assign(h.state, { testKey: 'headhang' });
      if (h.setDiagSide) h.setDiagSide('P');
      for (const [k, w] of [['poziom#jedyna', 'zero'], ['pion#jedyna', 'm1'], ['torsja#jedyna', 'p1'],
        ['latencja', 'brak'], ['czasTrwania', 'powyzej1min'], ['meczliwosc', 'bezZmian']]) h.setObsPole('headhang', k, w);
      h.goInterpret();
      h.przyjmijMechanizm();
      h.idzDoProby('headhang');                    // powrót na ekran próby PRZYCISKIEM ekranu interpretacji
      h.render();
    });


    /* Krok „Interpretacja" na WŁASNYM EKRANIE (Blok 9). Pinujemy stany, w których ekran mówi
       RÓŻNE rzeczy o tym, CZEGO MODEL NIE POTRAFI — bo to najłatwiejsze do cichego zgubienia:
       `bowlean-dwuznaczny` (dwie RÓWNORZĘDNE hipotezy, nie ranking), `headhang-bez-strony`
       (strona niewyprowadzalna — twierdzenie o modelu, nie o użytkowniku), `dix-bez-mechanizmu`
       (kierunek nie różnicuje kanalo/cupulo). Gdyby któreś z tych zdań zniknęło, aplikacja
       zaczęłaby udawać pewność, której nie ma, i żadna inna wyrocznia by tego nie zobaczyła. */
    const interp = (tag, proba, kroki) => grab(`interpret/${tag}`, () => {
      czystyObs();
      if (h.openTest) h.openTest(proba); else Object.assign(h.state, { testKey: proba });
      if (h.setDiagSide) h.setDiagSide('P');
      for (const [klucz, w] of (kroki || [])) h.setObsPole(proba, klucz, w);
      h.goInterpret();
      h.render();
    });
    interp('pusty', 'dix', []);
    interp('dix-bez-mechanizmu', 'dix', [['pion#jedyna', 'p1'], ['torsja#jedyna', 'p1'], ['poziom#jedyna', 'zero']]);
    interp('dix-pelna', 'dix', [['pion#jedyna', 'p1'], ['torsja#jedyna', 'p1'], ['poziom#jedyna', 'zero'],
      ['latencja', '1-5s'], ['czasTrwania', 'ponizej1min'], ['meczliwosc', 'slabnie']]);
    interp('bowlean-dwuznaczny', 'bowlean', [['poziom#bow', 'p1'], ['poziom#lean', 'm1']]);
    interp('headhang-bez-strony', 'headhang', [['pion#jedyna', 'm1']]);
    // Roll bez opisu NASILENIA — jedyny brak strony, ktory da sie naprawic opisem, wiec ekran ma
    // prosic o konkretna ceche, a nie deklarowac ograniczenie modelu.
    interp('roll-bez-nasilenia', 'roll', [['poziom#prawoWDole', 'p1'], ['pion#prawoWDole', 'zero'],
      ['poziom#lewoWDole', 'm1'], ['pion#lewoWDole', 'zero']]);
    interp('sprzeczny', 'dix', [['pion#jedyna', 'p1'], ['torsja#jedyna', 'p1'], ['poziom#jedyna', 'p1']]);
    // Mechanizm PRZYJĘTY jawnym gestem — jedyny stan, w którym ekran ma prawo napisać
    // „wyprowadzony z opisu obserwacji". Bez tego klucza etykieta źródła byłaby nieprzypięta.
    grab('interpret/dix-przyjety', () => {
      czystyObs();
      h.openTest('dix'); h.setDiagSide('P');
      for (const [k, w] of [['pion#jedyna', 'p1'], ['torsja#jedyna', 'p1'], ['poziom#jedyna', 'zero'],
        ['latencja', '1-5s'], ['czasTrwania', 'ponizej1min'], ['meczliwosc', 'slabnie']]) h.setObsPole('dix', k, w);
      h.goInterpret();
      h.przyjmijMechanizm();
      h.render();
    });
    czystyObs();
    try { h.state.variantZrodlo = null; h.state.variant = 'canalo'; } catch { }
  }

  /* KROK „KONTROLA" PO MANEWRZE (Blok 11) — sterowany PRAWDZIWYMI AKCJAMI, nie wstrzyknięciem
     stanu. Powód jest ten sam co przy trybie eksperckim Bloku 10: wynik kontroli zapisuje wyłącznie
     `ustawWynikKontroli` (przez strażnika danych i przez `flow.maneuver.kontrolaIdx`), więc stan
     wstawiony ręcznie przypiąłby ekran, do którego aplikacja nie ma drogi.
     Pinujemy stany, w których ekran mówi RÓŻNE rzeczy — a najważniejszy jest `konwersja`:
     to jedyne miejsce w całej aplikacji, gdzie przycisk jest NIEOBECNY z powodu KLINICZNEGO
     (kryterium odbioru nr 2), więc jego ciche pojawienie się musi się odbić w wyroczni. */
  if (h.zakonczSerie && h.ustawWynikKontroli && h.goKontrola) {
    const czystaKontrola = () => {
      Object.assign(h.state, {
        screen: 'setup', mode: 'treat', canal: null, maneuverKey: null, plan: null, step: 0,
        side: 'P', sideZrodlo: null, variant: 'canalo', variantZrodlo: null, testKey: null,
        dixObs: null, kontrole: [], kontrolaPowod: null, zakonczeniePyta: false, kontrolaBlad: null,
        obs: {}, obsOdciski: {}, trybCzasu: 'staly',
        flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null },
      });
    };
    const poManewrze = (key = 'epley') => { czystaKontrola(); h.startManeuver(key); h.zakonczSerie(); };
    const fu = (tag, fn) => grab(`followup/${tag}`, () => { fn(); h.render(); });

    fu('bez-manewru', () => { czystaKontrola(); h.goKontrola(); });
    fu('niewykonany', () => { czystaKontrola(); h.startManeuver('epley'); h.goKontrola(); });
    fu('pusty', () => poManewrze());
    fu('ustapienie', () => { poManewrze(); h.ustawWynikKontroli('ustapienie'); });
    fu('konwersja', () => { poManewrze(); h.ustawWynikKontroli('konwersja'); });
    fu('residual', () => { poManewrze(); h.ustawWynikKontroli('residual'); });
    fu('niewiarygodne', () => { poManewrze(); h.ustawWynikKontroli('niewiarygodne'); h.ustawPowodKontroli('szyja'); });
    fu('brak-poprawy', () => { poManewrze(); h.ustawWynikKontroli('brakPoprawy'); });
    // Seria: powtórzenie manewru to NOWE wykonanie, więc historia ma dwa wpisy, nie jeden.
    fu('seria', () => {
      poManewrze();
      h.ustawWynikKontroli('czesciowaPoprawa');
      h.kontrolaAkcja('powtorzManewr');
      h.zakonczSerie();
      h.ustawWynikKontroli('ustapienie');
    });
    fu('zakonczenie', () => { poManewrze(); h.ustawWynikKontroli('ustapienie'); h.pytajOZakonczeniu(true); });

    /* GENERATOR OPISU BADANIA (Blok 15). Cztery stany, i kazdy pilnuje INNEGO zdania:
       • `opis/pelny` — pelny opis po domknietym przebiegu; tu widac cala tresc naraz,
       • `opis/bez-strony` — NAJWAZNIEJSZY. Strona i mechanizm bez ZRODLA nie maja prawa
         pojawic sie jako ustalenie: `state.side` ma literal 'P', ktorego nikt nie dotknal.
         Ciche zamienienie „nieustalone" na „prawe" wlozyloby stronnosc do dokumentacji
         medycznej — dlatego to zdanie jest PRZYPIETE, a nie tylko przetestowane,
       • `opis/wylaczone` — przelaczniki sekcji z dokumentu (uklad telefonu),
       • `opis/edycja` — jedyne pole tekstowe w calej aplikacji RAZEM z ostrzezeniem, ze
         wpisany tekst nigdzie nie jest zapisywany. Ostrzezenie ma stac przy polu, a nie
         w stopce, wiec jego zniknieciе musi zapalic wyrocznie. */
    if (h.goOpis) {
      const opisPoPelnym = (tol) => {
        poManewrze(); h.ustawWynikKontroli('ustapienie');
        if (tol && h.ustawTolerancjeKontroli) h.ustawTolerancjeKontroli(tol);
        h.goOpis();
      };
      grab('opis/pelny', () => { h.state.sideZrodlo = 'wybrany'; h.state.variantZrodlo = 'wyprowadzony'; opisPoPelnym('nudnosci'); h.render(); });
      grab('opis/bez-strony', () => { opisPoPelnym('dobra'); h.state.sideZrodlo = null; h.state.variantZrodlo = null; h.render(); });
      grab('opis/wylaczone', () => {
        opisPoPelnym('dobra');
        if (h.przelaczSekcjeOpisu) { h.przelaczSekcjeOpisu('kwalifikacja'); h.przelaczSekcjeOpisu('oczoplas'); }
        h.render();
      });
      grab('opis/edycja', () => { opisPoPelnym('dobra'); if (h.edytujOpis) h.edytujOpis(); h.render(); });
      czystaKontrola(); h.state.opisSekcje = null; h.state.opisEdycja = null;
    }
    czystaKontrola();
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
    /* D-CZAS (2026-08-21) dołożyło PIĄTE pytanie — o czas od początku objawów — i te fikstury
       przestały być kompletne. Skutek był ZMIERZONY na złotym wzorcu, a nie teoretyczny: pięć
       ekranów przestało dochodzić do werdyktu i zamarło na nieodpowiedzianym pytaniu, przez co
       `triage/tEVS`, `triage/sEVS` i `triage/czerwona` stały się BAJT W BAJT IDENTYCZNE (6143
       znaki), a `triage/AVS` i `triage/pseudoAVS` też (6162). Rozróżnienie, o które ta sekcja
       jawnie prosi w akapicie wyżej („czerwona to ten sam komplet co tEVS, różniący się WYŁĄCZNIE
       ataksją"), przestało być przypięte czymkolwiek — a wyrocznia była zielona, bo golden
       przebazowano razem ze zmianą. `pusty` zostaje bez odpowiedzi CELOWO: pinuje ekran startowy. */
    tri('pusty', {});
    tri('tEVS', { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'tak' }, ['brak']);
    tri('czerwona', { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'tak' }, ['ataksja']);
    tri('AVS', { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'obecny' }, ['brak']);
    tri('pseudoAVS', { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'brak' }, ['brak']);
    tri('sEVS', { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'samoistny' }, ['brak']);
    try { h.resetTriage(); } catch { /* przywróć czysty stan dla kolejnych warstw */ }
  }

  /* SYMULATOR HINTS stoi od Bloku 12 ZA BRAMKĄ (`openHints`/`openHintsCustom` wołają `wolnoBadac`).
     Harness musi więc wejść tak, jak wchodzi użytkownik — przez świadome pominięcie kwalifikacji
     z powodem „chcę zobaczyć wzorce na modelu". Gdyby zamiast tego wstrzykiwał `screen='hints'`,
     złoty wzorzec przypinałby stany, do których aplikacja nie ma już drogi, a bramka mogłaby
     przestać działać bez jednej czerwonej wyroczni. */
  const przezBrame = () => { if (h.goHintsKwal) h.goHintsKwal(); if (h.pomijajKwalifikacje) h.pomijajKwalifikacje('symulacja'); };
  // HINTS — presety
  for (const p of Object.keys(h.HINTS_PRESETS || {})) {
    grab(`hints/preset/${p}`, () => {
      przezBrame();
      if (h.openHintsCustom) h.openHintsCustom();
      h.state.screen = 'hints'; h.state.mode = 'hints';
      if (h.loadHintsPreset) h.loadHintsPreset(p);
      h.render();
    });
  }
  // HINTS — neuritis (gałąź × ucho)
  for (const ear of ['P', 'L']) for (const br of ['superior', 'inferior']) {
    grab(`hints/nerve/${ear}/${br}`, () => {
      przezBrame();
      if (h.openHintsCustom) h.openHintsCustom();
      h.state.screen = 'hints'; h.state.mode = 'hints';
      h.state.hintsNerveEar = ear; h.state.hintsNerveBranch = br; h.state.hintsNerveSev = 0.6;
      if (h.loadHintsNeuritis) h.loadHintsNeuritis();
      h.render();
    });
  }
  // HINTS — scenariusze wbudowane + fixacja/spojrzenie
  for (const k of ['normal', 'neuritisR', 'neuritisL', 'strokeCentral', 'bvh']) {
    grab(`hints/scenario/${k}`, () => { przezBrame(); if (h.openHints) h.openHints(k); h.render(); });
  }
  grab('hints/scenario/neuritisR/fix', () => { przezBrame(); if (h.openHints) h.openHints('neuritisR'); if (h.setHintsFix) h.setHintsFix(true); h.render(); });
  grab('hints/scenario/neuritisR/gaze30', () => { przezBrame(); if (h.openHints) h.openHints('neuritisR'); if (h.setHintsGaze) h.setHintsGaze(30); h.render(); });

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
  // V19: SESJA na kartach SCENARIUSZOWYCH (bowlean/lyingdown) — zasiew historii jako akt otwierający
  // + akty B&L/LDT + niemy test kontrolny po opróżnieniu skłonem (nagroda R10). Łańcuch stanu MIĘDZY
  // grabami zamierzony (jak wyżej); strażnik h.seedSessionFromScenario — stary build bez handlera
  // pomija sekcję cicho (wzorzec fallbacków h.*). Higiena: setBltScenario('textbook') po łańcuchu
  // (zasiew synchronizuje state.bltScenario — bez resetu przeciekłby na klucze poza sekcją).
  if (h.toggleSessionMode && h.sessionProvoke && h.seedSessionFromScenario) {
    grab('diag/bowlean/P/session-on',   () => { if (h.openTest) h.openTest('bowlean'); if (h.setDiagSide) h.setDiagSide('P'); h.toggleSessionMode(true); h.render(); });
    grab('diag/bowlean/P/session-seed', () => { h.seedSessionFromScenario('textbook'); h.render(); });     // φ≈146°, bond 0 → pełna reguła Choung (BIT-EQ ze scenariuszem)
    grab('diag/bowlean/P/session-act1', () => { h.sessionProvoke(); h.render(); });                        // złóg ≈74°: bow słabszy, lean podprogowy (męczliwość = pozycja, R10)
    grab('diag/bowlean/P/session-seed2',() => { h.seedSessionFromScenario('afterRoll'); h.render(); });    // φ≈220° ZA wododziałem → podgląd: bije ku zdrowej I OPRÓŻNIA kanał
    grab('diag/bowlean/P/session-act2', () => { h.sessionProvoke(); h.render(); });                        // akt wykonany → S.exited: niemy test kontrolny, chip „kanał czysty"
    grab('diag/bowlean/P/session-off',  () => { h.toggleSessionMode(false); h.render(); });                // zejście do karty scenariuszowej (bltScenario='afterRoll' po zasiewie)
    grab('diag/lyingdown/P/session-on',   () => { if (h.openTest) h.openTest('lyingdown'); if (h.setDiagSide) h.setDiagSide('P'); h.toggleSessionMode(true); h.render(); });
    grab('diag/lyingdown/P/session-seed', () => { h.seedSessionFromScenario('textbook'); h.render(); });   // lie ku zdrowej (geo emergentnie), sit podprogowy — BIT-EQ ze scenariuszem
    grab('diag/lyingdown/P/session-act1', () => { h.sessionProvoke(); h.render(); });                      // złóg w strefie podprogowej ~195° (D2) — druga próba niema (R10)
    grab('diag/lyingdown/P/session-off',  () => { h.toggleSessionMode(false); h.render(); });
    // V25: KARTA ROLL POD SESJĄ — luka pokrycia ujawniona przez zarzut blokujący krytyka kliniki.
    // Sesja miała w złotym wzorcu dix/bowlean/lyingdown, ale NIE Roll — a to właśnie na Rollu akt
    // opróżnia kanał, więc dokładnie ten ekran mógł zacząć kłamać („niemy test u NIELECZONEGO")
    // bez jednego bajtu różnicy w snapshotcie. Pierwszy graby = ŚWIEŻY chory: karta MUSI pokazywać
    // obie fazy z odpowiedzią, a fazę wyjścia opisać jako ostatnią prowokację, nie jako kontrolę.
    grab('diag/roll/P/session-on',   () => { if (h.openTest) h.openTest('roll'); if (h.setDiagSide) h.setDiagSide('P'); h.toggleSessionMode(true); h.render(); });
    grab('diag/roll/P/session-act1', () => { h.sessionProvoke(); h.render(); });      // akt wyprowadza złóg w fazie 3 → kontrolny NIEMY (R10)
    grab('diag/roll/P/session-off',  () => { h.toggleSessionMode(false); h.render(); });
    if (h.setBltScenario) h.setBltScenario('textbook'); else if (h.state) h.state.bltScenario = 'textbook';   // higiena po zasiewach
  }
  // V20/D9: CHMURA ZŁOGU na finalnym kroku guide — karta częściowej repozycji (Epley 8/9), gałąź
  // konwersji (gufoniApo 0/9) i WIECZNY pin własności „OFF = zero bajtów" (ensemble-off ≡ step finalny
  // bazowy). Strażnik h.toggleEnsembleMode — stary build pomija cicho; higiena = OFF w ostatnim grabie.
  if (h.toggleEnsembleMode && h.startManeuver) {
    grab('guide/epley/P/ensemble-on', () => { h.startManeuver('epley'); if (h.state && h.state.plan) h.state.step = h.state.plan.steps.length - 1; h.toggleEnsembleMode(true); h.render(); });
    grab('guide/gufoniApo/P/ensemble-on', () => { h.startManeuver('gufoniApo'); if (h.state && h.state.plan) h.state.step = h.state.plan.steps.length - 1; h.render(); });
    grab('guide/epley/P/ensemble-off', () => { h.startManeuver('epley'); if (h.state && h.state.plan) h.state.step = h.state.plan.steps.length - 1; h.toggleEnsembleMode(false); h.render(); });
  }
  // V21/D7: EGZAMIN — pacjent z JAWNEGO ziarna (gałąź entropii examStart nigdy nie działa pod
  // wyrocznią). SEED 44 = hcGeo/P badany na dix (cross-test w DOM: poziomy beat na karcie Dix),
  // SEED 4 = multi PC+HC/P (suma wektorów: etykieta MIESZANY). Łańcuch stanu między grabami
  // zamierzony (egzamin przeżywa zmianę testu — to sedno trybu). STRAŻNIK PRZECIEKU (twardy throw):
  // klucze exam PRZED odsłoną nie mogą zawierać słów lateralizujących — klucz odpowiedzi nie może
  // wyciec do DOM. Higiena: examEnd w ostatnim grabie (exam-off = wieczny pin „OFF ≡ karta bazowa").
  if (h.examStart && h.examReveal && h.examEnd && h.openTest) {
    const LEAK = /stronie chorej|stronę chorą|strona chora|ucho chore|uchu chorym|uchu choremu|stronie zdrowej|ku zdrowej|ku chorej|affected side|affected ear|healthy side/i;
    const leakGuard = key => { const html = out[key]; if (typeof html === 'string' && !html.startsWith('ERR:') && LEAK.test(html)) throw new Error(`WYROCZNIA EGZAMINU (przeciek klucza): ${key} zawiera słowa lateralizujące przed odsłoną`); };
    grab('diag/dix/P/exam-on', () => { h.openTest('dix'); if (h.setDiagSide) h.setDiagSide('P'); h.examStart(44); });   // hcGeo/P na Dix = cross-test
    leakGuard('diag/dix/P/exam-on');
    grab('diag/roll/P/exam-on', () => { h.openTest('roll'); h.render(); });                                             // egzamin przeżywa zmianę testu
    leakGuard('diag/roll/P/exam-on');
    grab('diag/bowlean/P/exam-on', () => { h.openTest('bowlean'); h.render(); });                                       // panele scenariuszy ukryte
    leakGuard('diag/bowlean/P/exam-on');
    grab('diag/dix/P/exam-reveal', () => { h.openTest('dix'); h.examReveal(); });                                       // klucz odpowiedzi (hcGeo/P)
    grab('diag/dix/P/exam-multi', () => { h.examStart(4); });                                                           // multi PC+HC: etykieta MIESZANY
    leakGuard('diag/dix/P/exam-multi');
    grab('diag/dix/P/exam-off', () => { h.examEnd(); });                                                                // wieczny pin: OFF ≡ diag/dix/P
  }
  // V23: karta canalith jam w widoku CPN (dix, kanał tylny — bramka canal==='posterior' wyklucza
  // antMode z konstrukcji). 2 klucze; higiena: powrót do widoku obwodowego + strona P.
  if (h.toggleDiagCentral && h.openTest) {
    grab('diag/dix/P/central', () => { h.openTest('dix'); if (h.setDiagSide) h.setDiagSide('P'); h.toggleDiagCentral(true); });
    grab('diag/dix/L/central', () => { if (h.setDiagSide) h.setDiagSide('L'); });   // setDiagSide renderuje; diagCentral przeżywa zmianę strony
    h.toggleDiagCentral(false); if (h.setDiagSide) h.setDiagSide('P');
  }

  /* ════ BLOK 12 — KWALIFIKACJA · BADANIE · WYNIK ════
     Wszystko przez AKCJE (jak `obs/*` i `setup/ekspert/*`): bramka wejścia, kolejność ekranów i
     zapis odpowiedzi mieszkają w akcjach, więc wstrzyknięty stan przypiąłby ekrany, do których
     aplikacja nie prowadzi. Stany dobrane tak, żeby KAŻDY wniosek modelu miał w złotym wzorcu
     co najmniej jeden ekran — inaczej reguła może zniknąć bez zmiany choćby jednego klucza. */
  {
    const czystyH = () => {
      Object.assign(h.state, { triage: {}, triageStep: null, hintsBadanie: {}, hintsPowodNiewiar: null,
        hintsPominiecie: null, hintsPrzeszkolenie: null, hintsKrok: null, hintsBlad: null,
        hintsCustom: null, hintsScenario: 'neuritisR', screen: 'setup', mode: 'treat' });
    };
    /* To samo następstwo D-CZAS, ale groźniejsze, bo dotyka SZESNASTU kluczy: `kwalifikacjaHints`
       czyta `triageComplete`, więc bez odpowiedzi „od kiedy" bramka odmawiała wejścia i
       `zacznijBadanieHints()` zostawiało harness na ekranie kwalifikacji. Złoty wzorzec zamroził
       wtedy EKRAN ODMOWY pod kluczami `hintsBad/*` — zmierzone: `hintsBad/pierwsza`, `/hit-sakada`
       i `/skew` miały identyczne 8286 znaków i wszystkie zawierały „Nie wpuszczono do badania".
       Całe pokrycie ekranu badania HINTS i jedenastu kart wyniku zniknęło po cichu przy zielonej
       wyroczni — dokładnie ta klasa luki, dla której powstała notatka o `hintsBad` w Bloku 12. */
    const kwalifikuj = () => {
      czystyH();
      h.goHintsKwal();
      h.setTriage('przebieg', 'ciagle'); h.setTriage('odkiedy', 'ostre');
      h.setTriage('oczoplas', 'obecny'); h.toggleTriageFlaga('brak');
      h.ustawPrzeszkolenieHints('tak');
    };
    // Kwalifikacja: cztery stany, bo cztery różne karty wyniku i cztery różne zestawy przycisków.
    grab('hintsKwal/pusta', () => { czystyH(); h.goHintsKwal(); });
    grab('hintsKwal/odradzana-BPPV', () => {
      czystyH(); h.goHintsKwal();
      h.setTriage('przebieg', 'napadowe'); h.setTriage('wyzwalacz', 'pozycyjny'); h.setTriage('ortostaza', 'tak'); h.toggleTriageFlaga('brak');
    });
    grab('hintsKwal/czerwona-flaga', () => {
      czystyH(); h.goHintsKwal();
      h.setTriage('przebieg', 'ciagle'); h.setTriage('oczoplas', 'obecny'); h.toggleTriageFlaga('ataksja');
    });
    grab('hintsKwal/potwierdzona', () => { kwalifikuj(); });
    grab('hintsKwal/pominieta', () => { czystyH(); h.goHintsKwal(); h.pomijajKwalifikacje('nauka'); });
    // ODMOWA WEJŚCIA — jedyny stan, w którym widać, że bramka odmówiła i powiedziała dlaczego.
    grab('hintsKwal/odmowa', () => { czystyH(); h.goHintsKwal(); h.zacznijBadanieHints(); });

    // Badanie: pierwsza składowa, składowa środkowa, „nie można ocenić", powód niewiarygodności.
    grab('hintsBad/pierwsza', () => { kwalifikuj(); h.zacznijBadanieHints(); });
    grab('hintsBad/hit-sakada', () => { kwalifikuj(); h.zacznijBadanieHints(); h.ustawSkladowaHints('hit', 'sakadaP'); });
    grab('hintsBad/nieocenione', () => { kwalifikuj(); h.zacznijBadanieHints(); h.ustawSkladowaHints('hit', 'nieocenione'); });
    grab('hintsBad/skew', () => { kwalifikuj(); h.zacznijBadanieHints(); h.goHintsKrok('skew'); });
    grab('hintsBad/niewiarygodne', () => {
      kwalifikuj(); h.zacznijBadanieHints(); h.goHintsKrok('wiarygodnosc');
      h.ustawSkladowaHints('wiarygodnosc', 'niewiarygodne'); h.goHintsKrok('wiarygodnosc');
      h.ustawPowodNiewiarHints('brakZniesieniaFiksacji');
    });

    // Wynik — po jednym ekranie na każdy wniosek modelu.
    const wypelnij = (odp) => { kwalifikuj(); h.zacznijBadanieHints(); for (const [k, v] of Object.entries(odp)) h.ustawSkladowaHints(k, v); h.pokazWynikHints(); };
    const OBWOD = { hit: 'sakadaP', oczoplas: 'jednokierunkowy', skew: 'brakOdchylenia', sluch: 'symetryczny', chod: 'chodziBezPodparcia', wiarygodnosc: 'wiarygodne' };
    grab('hintsWyn/niewykonane', () => { kwalifikuj(); h.zacznijBadanieHints(); h.pokazWynikHints(); });
    grab('hintsWyn/obwodowy', () => wypelnij(OBWOD));
    grab('hintsWyn/alarm-skew', () => wypelnij({ ...OBWOD, skew: 'obecne' }));
    grab('hintsWyn/alarm-hit', () => wypelnij({ ...OBWOD, hit: 'brakSakady' }));
    grab('hintsWyn/alarm-chod', () => wypelnij({ ...OBWOD, chod: 'nieStoiBezPodparcia' }));
    grab('hintsWyn/alarm-sluch', () => wypelnij({ ...OBWOD, sluch: 'nowyJednostronny' }));
    grab('hintsWyn/niepelne', () => wypelnij({ ...OBWOD, skew: 'nieocenione' }));
    grab('hintsWyn/nierozstrzygniete', () => wypelnij({ ...OBWOD, hit: 'sakadaObu' }));
    grab('hintsWyn/nieinformatywne', () => wypelnij({ ...OBWOD, oczoplas: 'bezOczoplasu' }));
    grab('hintsWyn/niepewne', () => wypelnij({ ...OBWOD, wiarygodnosc: 'niewiarygodne' }));
    // Wynik z pominiętą kwalifikacją i bez przeszkolenia — komplet zastrzeżeń na jednym ekranie.
    grab('hintsWyn/zastrzezenia', () => {
      czystyH(); h.goHintsKwal(); h.pomijajKwalifikacje('nauka'); h.ustawPrzeszkolenieHints('nie');
      h.zacznijBadanieHints(); for (const [k, v] of Object.entries(OBWOD)) h.ustawSkladowaHints(k, v);
      h.pokazWynikHints();
    });
    czystyH();
  }

  /* ═══ BLOK 13 — TRYB NAUKI ═══
     Dwa ekrany i cala lekcja przypinane AKCJAMI, nie wstrzyknieciem stanu: kryterium odbioru
     nr 1 mowi o tym, czego NIE MA w DOM przed decyzja, wiec scenariusz musi przejsc dokladnie ta
     droga, ktora idzie uzytkownik. Postep NIE jest czytany z pamieci przegladarki — `czystyN`
     przypina go jawnie, zeby zloty wzorzec zostal deterministyczny. */
  if (h.goNauka && h.otworzPrzypadek) {
    const czystyN = () => {
      h.state.naukaPrzypadek = null; h.state.naukaEtap = null; h.state.naukaOdp = {};
      h.state.naukaWskazowki = []; h.state.naukaFiltr = { poziom: null, rodzaj: null };
      h.state.naukaPostep = {}; h.state.naukaBlad = null; h.state.naukaZapisBlad = null;
    };
    grab('nauka/biblioteka', () => { czystyN(); h.goNauka(); });
    grab('nauka/filtr-osrodkowy', () => { czystyN(); h.goNauka(); h.ustawFiltrNauki('rodzaj', 'osrodkowy'); });
    grab('nauka/filtr-podstawowy', () => { czystyN(); h.goNauka(); h.ustawFiltrNauki('poziom', 'podstawowy'); });
    // Etap „opis" — zapis obserwacji ZASLONIETY. To jest kryterium odbioru nr 1 w DOM.
    grab('nauka/opis', () => { czystyN(); h.otworzPrzypadek('pc-p-klasyk'); });
    grab('nauka/przewidywanie-przed', () => { czystyN(); h.otworzPrzypadek('pc-p-klasyk'); h.goEtapNauki('przewidywanie'); });
    grab('nauka/wskazowka', () => { czystyN(); h.otworzPrzypadek('pc-p-klasyk'); h.goEtapNauki('przewidywanie'); h.wskazowkaNauki('przewidywanie'); });
    grab('nauka/przewidywanie-trafna', () => {
      czystyN(); h.otworzPrzypadek('pc-p-klasyk'); h.goEtapNauki('przewidywanie');
      h.odpowiedzNauki('przewidywanie', '0,1,1#-');
    });
    grab('nauka/przewidywanie-zla-strona', () => {
      czystyN(); h.otworzPrzypadek('pc-p-klasyk'); h.goEtapNauki('przewidywanie');
      h.odpowiedzNauki('przewidywanie', '0,1,-1#-');
    });
    // Etap rozpoznania na przypadku OSRODKOWYM: kandydatura przezyla, wiec jest dopuszczalna,
    // a trafna jest „obraz nietypowy". To jest najwazniejszy pojedynczy ekran calego bloku.
    grab('nauka/osrodkowy-rozpoznanie', () => {
      czystyN(); h.otworzPrzypadek('downbeat-staly'); h.goEtapNauki('przewidywanie');
      h.odpowiedzNauki('przewidywanie', '0,-1,0#-'); h.goEtapNauki('rozpoznanie');
      h.odpowiedzNauki('rozpoznanie', 'anterior:P');
    });
    grab('nauka/osrodkowy-manewr', () => {
      czystyN(); h.otworzPrzypadek('downbeat-staly'); h.goEtapNauki('przewidywanie');
      h.odpowiedzNauki('przewidywanie', '0,-1,0#-'); h.goEtapNauki('rozpoznanie');
      h.odpowiedzNauki('rozpoznanie', 'obrazNietypowy'); h.goEtapNauki('mechanizm');
      h.odpowiedzNauki('mechanizm', 'nieRozstrzygaSie'); h.goEtapNauki('manewr');
      h.odpowiedzNauki('manewr', 'yacovino');
    });
    // Mechanizm NIEROZSTRZYGNIETY — ekran musi to nazwac (kryterium odbioru nr 4).
    grab('nauka/mechanizm-nierozstrzygniety', () => {
      czystyN(); h.otworzPrzypadek('pc-bez-dynamiki'); h.goEtapNauki('przewidywanie');
      h.odpowiedzNauki('przewidywanie', '0,1,1#-'); h.goEtapNauki('rozpoznanie');
      h.odpowiedzNauki('rozpoznanie', 'posterior:P'); h.goEtapNauki('mechanizm');
      h.odpowiedzNauki('mechanizm', 'canalo');
    });
    // Przypadek rozwiazany do konca — karta wyniku jako PROFIL etapow, nigdy jako liczba.
    grab('nauka/wynik', () => {
      czystyN(); h.otworzPrzypadek('pc-p-klasyk');
      const odp = { przewidywanie: '0,1,1#-', rozpoznanie: 'posterior:P', mechanizm: 'canalo', manewr: 'epley', kontrola: 'zakonczSesje' };
      for (const [e, v] of Object.entries(odp)) { h.goEtapNauki(e); h.odpowiedzNauki(e, v); }
    });
    czystyN();
  }

  /* ═══ BLOK 14 — LABORATORIUM ═══
     Sterowane AKCJAMI. Stanowiska przypinane jawnie, bo pacjent Laboratorium powstaje ze
     scenariusza silnika i musi byc deterministyczny. */
  if (h.goLab && h.otworzEksperymentLab) {
    const czystyL = () => {
      h.state.labEksperyment = null; h.state.labStanowisko = 'A';
      h.state.labA = null; h.state.labB = null; h.state.labPorownanie = false;
      h.state.labOstatniaZmiana = null; h.state.labParametr = null;
    };
    grab('lab/lista', () => { czystyL(); h.goLab(); });
    grab('lab/eksperyment', () => { czystyL(); h.otworzEksperymentLab('jednostronny'); });
    // Opis parametru rozwiniety — kryterium odbioru nr 2 w DOM (jednostka, zakres, granica modelu).
    grab('lab/opis-parametru', () => { czystyL(); h.otworzEksperymentLab('jednostronny'); h.opisParametruLab('gainR'); });
    // Pomiar skutku zmiany — kryterium odbioru nr 3.
    grab('lab/skutek', () => { czystyL(); h.otworzEksperymentLab('jednostronny'); h.ustawParametrLab('gainR', '0.3'); });
    // Zmiana BEZ skutku, nazwana wprost.
    grab('lab/bez-skutku', () => { czystyL(); h.otworzEksperymentLab('trzecieOkno'); h.ustawParametrLab('otrTorsion', '10'); });
    // Porownanie dwoch stanowisk — uklad „komputer" z dokumentu.
    grab('lab/porownanie', () => {
      czystyL(); h.otworzEksperymentLab('dysocjacja'); h.ustawParametrLab('caloricGainR', '0.2');
      h.ustawStanowiskoLab('B'); h.ustawParametrLab('gainR', '0.3'); h.przelaczPorownanieLab();
    });
    grab('lab/po-resecie', () => {
      czystyL(); h.otworzEksperymentLab('nerw'); h.ustawParametrLab('sacculeR', '0'); h.resetLab();
    });
    czystyL();
  }

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
    /* Blok 16: pasek nowej wersji leży POZA #shell (jak arkusz i mapa kroków), więc dopisujemy go
       na tej samej zasadzie — TYLKO gdy jest widoczny. Dzięki temu dwadzieścia przypiętych stanów
       powłoki zostaje bajt w bajt takie samo, a nowe stany pinują sam komunikat. */
    const upd = doc.getElementById('updbar');
    return s + (mapa && !mapa.hidden ? '\n@@FLOWMAP@@' + mapa.outerHTML : '')
             + (upd && !upd.hidden ? '\n@@AKTUALIZACJA@@' + upd.outerHTML : '');
  };
  const grab = (tag, fn) => { try { fn(); out[tag] = zrzut(); } catch (e) { out[tag] = 'ERR:' + e.message; } };
  const st = h.state;
  const czysty = () => {
    if (!st) return;
    st.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
    // Blok 11: historia kontroli PRZEŻYWA nawigację (to celowe), więc bez wyzerowania tutaj
    // scenariusze wyciekałyby jeden na drugi — ta sama pułapka, co przy rekordach obserwacji.
    st.kontrole = []; st.kontrolaPowod = null; st.zakonczeniePyta = false; st.kontrolaBlad = null;
    st.decisionSeq = 0; st.diagCentral = false; st.variant = 'canalo'; st.dixObs = null;   // null, nie 'post' (Blok 8): harness nie ma prawa odpowiadac za uzytkownika
    st.stepMapOpen = false; st.running = false; st.step = 0;
    st.triage = {}; st.triageStep = null;
    // Blok 8: rekordy obserwacji PRZEŻYWAJĄ nawigację (to celowe), więc bez wyczyszczenia ich
    // TUTAJ scenariusze wyciekałyby jeden na drugi i kolejność bloków w tym pliku zaczęłaby
    // wpływać na złoty wzorzec — awaria, której nie widać, dopóki ktoś nie przestawi bloków.
    st.obs = {}; st.obsGrupa = null;
    // Blok 12: odpowiedzi badania HINTS i pominięcie kwalifikacji też PRZEŻYWAJĄ nawigację.
    st.hintsBadanie = {}; st.hintsPowodNiewiar = null; st.hintsPominiecie = null;
    st.hintsPrzeszkolenie = null; st.hintsKrok = null; st.hintsBlad = null; st.hintsCustom = null;
    // Blok 13: postep nauki i odpowiedzi lekcji tez PRZEZYWAJA nawigacje (postep celowo, bo jest
    // wczytywany z pamieci przegladarki). Bez wyzerowania TUTAJ scenariusze wyciekalyby jeden na
    // drugi, a zloty wzorzec zaczalby zalezec od kolejnosci blokow w tym pliku.
    st.naukaPrzypadek = null; st.naukaEtap = null; st.naukaOdp = {}; st.naukaWskazowki = [];
    st.naukaFiltr = { poziom: null, rodzaj: null }; st.naukaPostep = {};
    st.naukaBlad = null; st.naukaZapisBlad = null;
    // Blok 14: stanowiska Laboratorium tez PRZEZYWAJA nawigacje — bez wyzerowania tutaj
    // scenariusze wyciekalyby jeden na drugi.
    st.labEksperyment = null; st.labStanowisko = 'A'; st.labA = null; st.labB = null;
    st.labPorownanie = false; st.labOstatniaZmiana = null; st.labParametr = null;
    try { if (h.resetTriage) h.resetTriage(); } catch { }
  };

  /* Tryb ustawiany JAWNIE tylko tutaj. Klucz 'start' warstwy shell dziedziczyl data-mode po
     OSTATNIM scenariuszu warstwy dom, czyli zalezal od kolejnosci blokow w tym pliku, a nie od
     tego, co robi aplikacja — Blok 12 dolozyl na koncu warstwy dom sekcje HINTS i wartosc sie
     zmienila bez jednej zmiany w kodzie ekranu startowego. Zerowanie w czysty() naprawiloby to
     szerzej, ale ZEPSULOBY klucz 'diag/roll/P': openTest nie ustawia trybu, wiec ekran proby
     raportowalby data-mode='treat'. Naprawa wezsza i uczciwa: przypinamy tryb tam, gdzie go
     naprawde znamy. */
  grab('start', () => { czysty(); st.mode = 'treat'; h.goArea && h.goArea('start'); });
  grab('diag/dix/P', () => { czysty(); h.goArea && h.goArea('diag'); h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P'); h.syncShell && h.syncShell(); });
  grab('diag/roll/P', () => { czysty(); h.openTest && h.openTest('roll'); h.syncShell && h.syncShell(); });
  // Stan ZGODNY: Dix-Hallpike + kanalolitiaza → Epley jest manewrem pierwszego rzutu, więc pasek
  // NIE MOŻE pokazywać ostrzeżenia. Fałszywy alarm jest tu równie groźny jak brak alarmu — pasek,
  // który krzyczy zawsze, przestaje być czytany.
  grab('guide/epley/P', () => { czysty(); h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P'); h.startManeuver && h.startManeuver('epley'); h.syncShell && h.syncShell(); });
  grab('learn', () => { czysty(); h.goArea && h.goArea('learn'); });
  /* Ten klucz ma pokazywac chrom nad SYMULATOREM, a nie nad kwalifikacja — i przez caly czas go
     NIE pokazywal: `goHintsKwal()` wola render(), ale nie syncShell(), wiec atrybuty powloki
     zostawaly z poprzedniego przejscia. Wchodzimy pelna, prawdziwa droga i domykamy syncShell(). */
  grab('hints', () => {
    czysty(); h.goArea && h.goArea('diag'); h.goHintsKwal && h.goHintsKwal();
    h.pomijajKwalifikacje && h.pomijajKwalifikacje('symulacja');
    h.otworzSymulatorHints && h.otworzSymulatorHints(); h.syncShell && h.syncShell();
  });
  /* Blok 13 — chrom nad LEKCJA. Ta sama rzecz, ktorej pilnujemy nad HINTS: pasek szesciu krokow
     przebiegu klinicznego nie ma prawa stanac nad przypadkiem dydaktycznym. */
  grab('naukaLekcja', () => { czysty(); h.goArea && h.goArea('learn'); h.otworzPrzypadek && h.otworzPrzypadek('pc-p-klasyk'); h.syncShell && h.syncShell(); });
  /* Blok 14 — chrom nad Laboratorium. Pilnujemy tu rzeczy, ktorej nie widzi warstwa dom:
     nawigacja ma podswietlac „Laboratorium", a nie „Diagnostyke". Zmierzone przed naprawa:
     `goArea('lab')` konczyl z data-area="diag", bo syncShell PRZEPISUJE state.area wynikiem
     areaZeStanu, a ta nie znala trybu 'lab'. */
  grab('labLista', () => { czysty(); h.goArea && h.goArea('lab'); h.syncShell && h.syncShell(); });
  /* Blok 12 — chrom nad trzema nowymi ekranami. Pilnujemy tu JEDNEJ rzeczy, której nie widzi
     żadna inna warstwa: pasek sześciu kroków przebiegu klinicznego NIE MA PRAWA pojawić się nad
     HINTS. Ten pasek opisuje ścieżkę BPPV („Krok 2 z 6 — Próba"); postawiony nad różnicowaniem
     ostrego zespołu przedsionkowego mówiłby, że użytkownik jest w środku innego badania. */
  /* OBSZAR PRZYPINANY JAWNIE (naprawa wykryta przez Blok 13). Te dwa klucze wolaly samo
     `goHintsKwal()` i DZIEDZICZYLY `data-area` po poprzednim scenariuszu: dopoki obszar „Nauka"
     byl zaslepka, wychodzilo z tego `lab`, a po ozywieniu nauki — `learn`. Wartosc zmieniala sie
     wiec bez jednej zmiany w kodzie ekranow HINTS, czyli dokladnie ta sama pulapka „kolejnosc
     blokow w tym pliku", ktora naprawiono juz przy kluczu `start`. Wchodzimy PRAWDZIWA droga:
     `goArea('lab')` prowadzi do kwalifikacji (Blok 12), wiec scenariusz mowi, co znaczy. */
  /* Blok 14 przestawil znaczenie obszaru „Laboratorium", wiec te dwa klucze wchodza teraz
     zakladka HINTS: `goArea('diag')` przypina obszar jawnie, a `goHintsKwal()` otwiera drzwi
     modulu. Sens bramki zostaje ten sam — scenariusz mowi, skad przyszedl, zamiast dziedziczyc. */
  grab('hintsKwal', () => { czysty(); h.goArea && h.goArea('diag'); h.goHintsKwal && h.goHintsKwal(); h.syncShell && h.syncShell(); });
  grab('hintsBad', () => {
    czysty(); h.goArea && h.goArea('diag'); h.goHintsKwal && h.goHintsKwal(); h.pomijajKwalifikacje && h.pomijajKwalifikacje('nauka');
    h.zacznijBadanieHints && h.zacznijBadanieHints(); h.syncShell && h.syncShell();
  });
  /* Blok 8 — krok „Oczopląs" na WŁASNYM ekranie. Pasek przebiegu żyje w chromie POZA #app,
     więc te trzy stany są jedynym miejscem, gdzie widać, że nowy ekran w ogóle wpiął się
     w przebieg kliniczny: krok musi być AKTYWNY, a nie „w przygotowaniu", i to przy próbie
     INNEJ niż Dix-Hallpike — bo właśnie tam do Bloku 7 stała uczciwa deklaracja braku. */
  grab('obs/dix', () => {
    czysty(); h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P');
    h.goObs && h.goObs(); h.syncShell && h.syncShell();
  });
  grab('obs/roll', () => {
    czysty(); h.goArea && h.goArea('diag');
    h.openTest && h.openTest('roll'); h.goObs && h.goObs(); h.syncShell && h.syncShell();
  });
  // Po przyjęciu downbeatu jako podstawy krok „Oczopląs" jest zrobiony, a lateralizacja
  // NIEPEWNA — pasek musi to powiedzieć, bo na ekranie manewru tej informacji już nie ma.
  grab('obs/przyjety-downbeat', () => {
    czysty(); h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P');
    h.goObs && h.goObs();
    h.setObsPole && h.setObsPole('dix', 'pion#jedyna', 'm1');
    h.przyjmijObs && h.przyjmijObs();
    h.syncShell && h.syncShell();
  });
  /* Blok 9 — krok „Interpretacja" na WŁASNYM ekranie. Ten klucz jest CAŁYM sensem poprawki F4:
     zmierzone przed nią `flowVisible=false` i `activeStepId=null`, czyli pasek ZNIKAŁ dokładnie
     na ekranie, do którego krok prowadzi — a razem z nim jedyny sygnał o nieaktualnym wniosku.
     Pasek musi tu być i musi wskazywać krok 4 jako aktywny. */
  grab('interpret/dix', () => {
    czysty(); h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P');
    h.goInterpret && h.goInterpret(); h.syncShell && h.syncShell();
  });
  /* Blok 11 — krok „Kontrola" przestał być `pending`. Te dwa stany są jedynym miejscem, w którym
     widać, że pasek naprawdę zna wynik kontroli: `done` po wyniku wiarygodnym i `unreliable` po
     kontroli, której nie dało się ocenić. Drugi jest ważniejszy — meldowanie „zakończony" nad
     badaniem nazwanym niewiarygodnym jest dokładnie tym błędem, który Blok 8 wyciął przy
     lateralizacji, a żadna inna warstwa golden paska nie dotyka. */
  grab('followup/wynik', () => {
    czysty();
    h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix');
    h.startManeuver && h.startManeuver('epley');
    h.zakonczSerie && h.zakonczSerie();
    h.ustawWynikKontroli && h.ustawWynikKontroli('ustapienie');
    h.syncShell && h.syncShell();
  });
  grab('followup/niewiarygodne', () => {
    czysty();
    h.goArea && h.goArea('diag');
    h.openTest && h.openTest('dix');
    h.startManeuver && h.startManeuver('epley');
    h.zakonczSerie && h.zakonczSerie();
    h.ustawWynikKontroli && h.ustawWynikKontroli('niewiarygodne');
    h.ustawPowodKontroli && h.ustawPowodKontroli('szyja');
    h.syncShell && h.syncShell();
  });
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
    h.setTriage && h.setTriage('ortostaza', 'tak');
    h.toggleTriageFlaga && h.toggleTriageFlaga('ataksja');
    h.openTest && h.openTest('dix');            // uzytkownik idzie dalej mimo flagi
    h.syncShell && h.syncShell();
  });

  /* BLOK 16 — PASEK NOWEJ WERSJI. Dwa stany, i drugi jest wazniejszy:
     • `aktualizacja/gotowa` — nowa wersja czeka, przypadku nie ma: pasek proponuje wdrozenie,
     • `aktualizacja/manewr` — TA SAMA nowa wersja w trakcie repozycji. Pasek ma tu NIE MIEC
       przycisku wdrozenia i powiedziec, ze poczeka. Gdyby ktos kiedys „dla wygody" dolozyl tu
       przycisk, zloty wzorzec zapali sie natychmiast — a to jest dokladnie ta zmiana, ktora
       przerywa manewr wykonywany na pacjencie.
     Stan zerujemy na koncu, bo pola aktualizacji PRZEZYWAJA nawigacje (jak rekordy obserwacji
     i historia kontroli) — bez tego wyciekalyby na kolejne scenariusze. */
  if (h.aktualizacjaCzeka) {
    grab('aktualizacja/gotowa', () => {
      czysty(); if (h.zerujAktualizacje) h.zerujAktualizacje();
      h.goArea && h.goArea('start');
      h.aktualizacjaCzeka(); h.syncShell && h.syncShell();
    });
    grab('aktualizacja/manewr', () => {
      czysty(); if (h.zerujAktualizacje) h.zerujAktualizacje();
      h.goArea && h.goArea('diag');
      h.openTest && h.openTest('dix'); h.setDiagSide && h.setDiagSide('P');
      h.startManeuver && h.startManeuver('epley');
      h.goStep && h.goStep(1);
      h.aktualizacjaCzeka(); h.syncShell && h.syncShell();
    });
    if (h.zerujAktualizacje) h.zerujAktualizacje();
    h.syncAktualizacja && h.syncAktualizacja();
  }
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
      diffKeys(snap.engine.sessionChain, gold.engine.sessionChain, 'engine.sessionChain/', diffs);   // V10/D1: bez tej linii pin byłby zapisywany, ale nigdy porównywany
      diffKeys(snap.engine.lyingdown, gold.engine.lyingdown, 'engine.lyingdown/', diffs);            // V11/D2: jw.
      diffKeys(snap.engine.lightcupula, gold.engine.lightcupula, 'engine.lightcupula/', diffs);      // V12/D3: jw.
      diffKeys(snap.engine.spv, gold.engine.spv, 'engine.spv/', diffs);                              // V13/D6: jw.
      diffKeys(snap.engine.shortarm, gold.engine.shortarm, 'engine.shortarm/', diffs);               // V15/D10: jw.
      diffKeys(snap.engine.jam, gold.engine.jam, 'engine.jam/', diffs);                              // V15/D10: jw.
      diffKeys(snap.engine.ensemble, gold.engine.ensemble, 'engine.ensemble/', diffs);               // V20/D9: jw.
      diffKeys(snap.engine.exam, gold.engine.exam, 'engine.exam/', diffs);                           // V21/D7: jw.
      diffKeys(snap.engine.grace, gold.engine.grace, 'engine.grace/', diffs);                        // V22/D8: jw.
      diffKeys(snap.engine.rollact, gold.engine.rollact, 'engine.rollact/', diffs);            // V25: jw.
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
