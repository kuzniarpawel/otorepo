/* OTOREPO — wyrocznia DVA: bramka OBUSTRONNOŚCI na fladze oscylopsji + redakcja zdania karty.
 * [H41] Guinand 2012 · [H42] Hall 2022 · [H43] Schubert 2008 · [H44] Geisinger 2024 · [H45] Karabulut 2023
 *
 * ═══ DLACZEGO TA BRAMKA ISTNIEJE ═══
 * Zmierzone przy wdrożeniu etapu V27: poprawka fizyki (bramka obustronności) zmieniła w złotym wzorcu
 * DOKŁADNIE ZERO wartości — flaga i tak padała już tylko u dwóch pacjentów obustronnych, więc
 * `snapshot:check` jej NIE WIDZI. Sprawdzone osobno: przed V27 ŻADEN tools/*-check.mjs nie asertował
 * na dva, logMARLoss, oscillopsia ani na tekst zdania DVA (lab-check filtruje findings wzorcem /VEMP/i,
 * hsn-check wzorcami HSN). Czyli bez tej bramki cała zmiana byłaby NIEPILNOWANA: ktoś mógłby jutro
 * skasować koniunkcję i wszystkie 28 pozostałych bramek zostałoby zielonych.
 *
 * ═══ CZEGO NIE WYSTARCZY SPRAWDZIĆ ═══
 * Zbadanie kilku scenariuszy nie łapie nic, bo w baterii golden defekt się NIE UJAWNIA (żaden z 19
 * pacjentów nie jest jednostronny-i-dostatecznie-głęboki). Defekt żyje w przestrzeni SUWAKÓW, którą
 * użytkownik przemierza myszą w Laboratorium i w „matematycznym pacjencie". Dlatego bramka przechodzi
 * SIATKĘ gainR × gainL i sprawdza niezmiennik na każdej komórce.
 *
 * ═══ GRANICE ZADEKLAROWANE ═══
 *   · Nie sprawdza, czy próg 0,3 jest PRAWDZIWY klinicznie — to zostaje robotą czytelnika [H44].
 *   · Nie sprawdza pochodzenia (obwodowe vs ośrodkowe): pacjent ośrodkowy z niskim gainem obustronnie
 *     dostaje flagę tak samo i TAK MA BYĆ do czasu osobnego etapu — patrz granice w engine_doc V27.
 *   · Nie waliduje treści klinicznej zdania, tylko obecność/nieobecność fraz, które źródła wymusiły.
 *
 * Uruchomienie: npm run dva:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (nazwa, warunek, detal) => { if (warunek) ok++; else bledy.push(nazwa + (detal ? ' — ' + detal : '')); };

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
if (!NV) { console.error('✗ dva:check — brak NeuroVOR w seamie'); process.exit(2); }

const BVP_CUT = 0.6;                       // kryterium C [H19] Strupp 2017 — musi zgadzac sie z silnikiem
const pac = (o) => NV.makePatient(o);
const g = (p) => [NV.headImpulse(p, 'P').gain, NV.headImpulse(p, 'L').gain];

/* ── 1. NIEZMIENNIK GŁÓWNY NA SIATCE SUWAKÓW ──────────────────────────────────────────────────
   „Flaga oscylopsji NIGDY nie pada, gdy KTÓREKOLWIEK ucho ma gain >= 0,6." Siatka odwzorowuje
   dokladnie to, co uzytkownik moze ustawic mysza: PARAM_SPEC daje gainR/gainL min 0, max 1,2, krok 0,05. */
{
  let komorek = 0, flag = 0, naruszen = 0, odebranych = 0, przyklad = null;
  for (let r = 0; r <= 24; r++) for (let l = 0; l <= 24; l++) {
    const gainR = r * 0.05, gainL = l * 0.05;
    const p = pac({ gainR, gainL });
    const d = NV.dva(p);
    const [gP, gL] = g(p);
    komorek++;
    if (d.oscillopsia) {
      flag++;
      if (!(gP < BVP_CUT && gL < BVP_CUT)) { naruszen++; if (!przyklad) przyklad = `gainR=${gainR} gainL=${gainL} → gP=${gP.toFixed(3)} gL=${gL.toFixed(3)}`; }
    } else if (d.logMARLoss >= 0.3) {
      odebranych++;                        // stary predykat by zapalil, nowy nie — to ma byc wylacznie jednostronny
      if (gP < BVP_CUT && gL < BVP_CUT) { naruszen++; if (!przyklad) przyklad = `ODEBRANA OBUSTRONNEMU: gainR=${gainR} gainL=${gainL}`; }
    }
  }
  T('siatka przeszla w calosci', komorek === 625, String(komorek));
  T('NIEZMIENNIK: flaga nigdy przy uchu >= 0.6', naruszen === 0, przyklad || '');
  T('bramka faktycznie cos odbiera (test nie jest pusty)', odebranych > 0, 'odebranych=' + odebranych);
  T('bramka nadal cos przepuszcza (nie skasowala flagi)', flag > 0, 'flag=' + flag);
  console.log(`  [siatka] ${komorek} komorek · flaga pada w ${flag} · bramka odebrala ${odebranych} (wszystkie jednostronne)`);
}

/* ── 2. DEFEKT, KTÓRY WYWOŁAŁ ZMIANĘ — dokładnie ten pacjent ─────────────────────────────────
   Martwe ucho prawe, zdrowe lewe. Przed V27: logMAR 0,300 → flaga + zdanie „skarga definicyjna BVH",
   przy jednoczesnym werdykcie „peripheral" i lokalizacji „nerw GORNY po stronie prawej". */
{
  const p = pac({ toneR: 0, gainR: 0, caloricGainR: 0 });
  const d = NV.dva(p), [gP, gL] = g(p);
  T('regresja: martwe ucho + zdrowe drugie NIE dostaje flagi', d.oscillopsia === false,
    `gP=${gP.toFixed(3)} gL=${gL.toFixed(3)} logMAR=${d.logMARLoss.toFixed(3)}`);
  T('regresja: ten pacjent nadal ma NIEPRAWIDLOWE dva', d.abnormal === true);
  T('regresja: logMAR nadal przekracza dawny prog (dowod, ze to bramka, nie zmiana progu)',
    d.logMARLoss >= 0.3, d.logMARLoss.toFixed(4));
  T('regresja: drugie ucho faktycznie POWYZEJ kryterium C', gL >= BVP_CUT, gL.toFixed(3));
}

/* ── 3. OBUSTRONNI ZACHOWUJĄ FLAGĘ (zmiana nie jest kasowaniem funkcji) ─────────────────────── */
{
  for (const sev of [0.7, 0.9, 1.0]) {
    const p = pac(NV.bilateralLoss(sev)), d = NV.dva(p), [gP, gL] = g(p);
    T(`BVH sev=${sev} zachowuje flage`, d.oscillopsia === true, `gP=${gP.toFixed(3)} gL=${gL.toFixed(3)}`);
    T(`BVH sev=${sev} jest obustronny wg kryterium C`, gP < BVP_CUT && gL < BVP_CUT);
  }
  T('scenariusz bvh zachowuje flage', NV.dva(pac(NV.SCENARIOS.bvh.params)).oscillopsia === true);
}

/* ── 4. PAS „OBUSTRONNY BEZ OSCYLOPSJI" — produkt uboczny wart zamrożenia ───────────────────
   Oba gainy <0,6 implikuja logMAR >0,24, wiec koniunkcja z progiem 0,3 zostawia pas 0,24-0,30:
   pacjent JEST obustronny, a skargi nie zglasza. To odtwarza fakt, ze skarge ma tylko czesc
   chorych na BVP [H45] — klasa pacjenta, ktorej silnik wczesniej NIE UMIAL wygenerowac. */
{
  const p = pac(NV.bilateralLoss(0.5)), d = NV.dva(p), [gP, gL] = g(p);
  T('BVH lagodny: obustronny wg kryterium C', gP < BVP_CUT && gL < BVP_CUT, `${gP.toFixed(3)}/${gL.toFixed(3)}`);
  T('BVH lagodny: BEZ flagi oscylopsji', d.oscillopsia === false);
  T('BVH lagodny: mimo to dva NIEPRAWIDLOWE', d.abnormal === true);
  T('pas 0,24-0,30 istnieje', d.logMARLoss > 0.24 && d.logMARLoss < 0.30, d.logMARLoss.toFixed(4));
}

/* ── 5. CISZA U ZDROWEGO I NIEZALEŻNOŚĆ OD KOMPENSACJI ──────────────────────────────────────
   comp jest scislym no-op dla dva() — to wlasnie czyni zdanie karty prawdziwym O MODELU i dlatego
   teza fizyczna zostala, a zlagodzono tylko kwalifikatory. Zamrazamy ten fakt. */
{
  const z = NV.dva(pac({}));
  T('zdrowy: zero utraty', z.logMARLoss === 0 && z.abnormal === false && z.oscillopsia === false);
  const ref = NV.dva(pac(NV.SCENARIOS.neuritisR.params)).logMARLoss;
  for (const c of [0, 0.25, 0.5, 0.75, 1]) {
    const d = NV.dva(pac(Object.assign({}, NV.SCENARIOS.neuritisR.params, { comp: c })));
    T(`comp=${c} nie rusza logMARLoss`, d.logMARLoss === ref, `${d.logMARLoss} vs ${ref}`);
  }
}

/* ── 6. ZDANIE KARTY — dwie redakcje wymuszone przez zrodla ─────────────────────────────────
   (1) etykieta diagnostyczna „skarga definicyjna BVH" znikla [H19]; (2) „gain HF trwaly" znikl,
   bo padal u przewleklego SKOMPENSOWANEGO UVH, czyli w populacji zalecenia 2 [H42]. */
{
  H.state.lang = 'pl';
  const zdanie = (p) => (NV.clinicalReadout(p).findings.find(z => /^DVA/.test(z)) || '');
  const uvh = zdanie(pac(NV.SCENARIOS.neuritisR.params));
  const bvh = zdanie(pac(NV.SCENARIOS.bvh.params));
  T('PL: zniklo "skarga definicyjna BVH"', !/definicyjna/.test(bvh), bvh.slice(0, 80));
  T('PL: zniklo "gain HF trwaly"', !/gain HF trwały/.test(uvh), uvh.slice(0, 80));
  T('PL: jest kwalifikator "sama kompensacja ośrodkowa"', /sama kompensacja ośrodkowa/.test(uvh));
  T('PL: jest kwalifikator "PASYWNYM pchnięciu"', /PASYWNYM pchnięciu/.test(uvh));
  T('PL: karta wskazuje cwiczenia jako OSOBNA droge', /ćwiczenia stabilizacji spojrzenia/.test(uvh));
  T('PL: oscylopsja opisana MECHANIZMEM', /obraz ucieka przy ruchu głowy/.test(bvh), bvh.slice(0, 80));
  T('PL: zdanie DVA nie cytuje (konwencja warstwy findings)', !/\[H\d+\]/.test(uvh) && !/\[H\d+\]/.test(bvh));
  H.state.lang = 'en';
  const uvhEn = zdanie(pac(NV.SCENARIOS.neuritisR.params));
  const bvhEn = zdanie(pac(NV.SCENARIOS.bvh.params));
  T('EN: zniklo "defining BVH complaint"', !/defining BVH complaint/.test(bvhEn));
  T('EN: zniklo "HF gain is permanent"', !/HF gain is permanent/.test(uvhEn));
  T('EN: jest "central compensation ALONE"', /central compensation ALONE/.test(uvhEn));
  T('EN: jest "PASSIVE impulse"', /PASSIVE impulse/.test(uvhEn));
  T('EN: bez polskich znakow', !/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(uvhEn + bvhEn), (uvhEn + bvhEn).slice(0, 90));
  H.state.lang = 'pl';
}

/* ── 7. IZOLACJA POLA — oscillopsia nie steruje rozpoznaniem ────────────────────────────────
   Zweryfikowane przy V27: pole jest czytane w DOKLADNIE JEDNYM miejscu (wtracenie w napisie).
   Gdyby ktos podpial je pod werdykt, zmiana flagi zaczelaby ruszac rozpoznaniem — zamrazamy izolacje. */
{
  const p = pac({ toneR: 0, gainR: 0, caloricGainR: 0 });
  const rd = NV.clinicalReadout(p);
  T('flaga nie wycieka do peripheralSigns', !rd.peripheralSigns.some(z => /scylopsj/i.test(z)));
  T('flaga nie wycieka do centralSigns', !rd.centralSigns.some(z => /scylopsj/i.test(z)));
  T('flaga nie wycieka do ambiguities', !rd.ambiguities.some(z => /scylopsj/i.test(z)));
  T('werdykt tego pacjenta pozostaje obwodowy', rd.verdict === 'peripheral', String(rd.verdict));
}

const OCZEKIWANE = 41;   /* ZMIERZONE przy wdrozeniu etapu V27 (2026-08-20): 4 (siatka) + 4 (regresja
                            defektu) + 7 (obustronni) + 4 (pas bez oscylopsji) + 6 (cisza i comp)
                            + 12 (zdanie PL/EN) + 4 (izolacja pola). Podnies SWIADOMIE. */
if (bledy.length) {
  console.error('✗ dva:check — ' + bledy.length + ' bledow z ' + (ok + bledy.length) + ':');
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error('✗ dva:check — przypadkow ' + ok + ', oczekiwano ' + OCZEKIWANE + '. Popraw OCZEKIWANE, ale nie po cichu.');
  process.exit(1);
}
console.log('✓ dva:check — ' + ok + ' przypadkow; bramka obustronnosci (kryt. C [H19] <' + BVP_CUT +
  ') i redakcja zdania DVA zgodne. [H41] [H42] [H43] [H44] [H45]');
