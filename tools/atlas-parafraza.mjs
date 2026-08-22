/* OTOREPO — POMIAR PARAFRAZY ATLASU wobec pełnych tekstów źródłowych (E6).
 *
 * ═══ PO CO ISTNIEJE ═══
 * Repozytorium OTOREPO jest PUBLICZNE. Trzy prace korpusu ICVD — [H47] Bisdorff 2009,
 * [H20] López-Escámez 2015 i [H48] von Brevern 2015 — są wydane przez IOS Press z klauzulą
 * „all rights reserved": wolno je czytać, nie wolno redystrybuować. Pozostałe mają CC BY-NC,
 * co też nie jest zgodą na przedruk prozy. Zasada projektu brzmi więc: kryteria się PARAFRAZUJE,
 * a progi liczbowe i strukturę logiczną oddaje DOKŁADNIE, bo to fakty, nie ekspresja.
 *
 * Ta zasada jest NIESPRAWDZALNA przez `zrodla:check` ani przez `atlas:check`: obie widzą tylko
 * repozytorium, a pełne teksty leżą CELOWO poza nim. Dlatego pomiar parafrazy jest osobnym
 * narzędziem, uruchamianym ręcznie przy materiale, a jego WYNIK zapisuje się w repozytorium —
 * tak samo jak zapis kontroli ekstrakcji w `weryfikacja_ekstrakcji_icvd.md`.
 *
 * ═══ CO MIERZY ═══
 * Najdłuższy wspólny ciąg SŁÓW między każdym polem tekstowym atlasu a pełnym tekstem jego pracy.
 * Nie podobieństwo semantyczne — dosłowność. Parafraza może być bliska znaczeniowo (i ma być,
 * bo oddaje kryterium), ale nie ma prawa być tym samym ciągiem słów.
 *
 * PRÓG. Domyślnie 10 słów: tyle wynosi limit pojedynczego cytatu przyjęty w tym projekcie.
 * Ciągi krótsze bywają nieuniknione — nazwy własne, terminy anatomiczne, „at least one of the
 * following" — i nie są przedrukiem.
 *
 * CZEGO NIE MIERZY, i to jest ważne: pola POLSKIE. Źródła są angielskie, więc każdy pomiar
 * na PL mierzyłby jakość tłumaczenia, a nie dosłowność. Ryzyko licencyjne siedzi w EN.
 *
 * ═══ UŻYCIE ═══
 *   node tools/atlas-parafraza.mjs [--korpus <ścieżka>] [--prog 10] [--pokaz 12]
 * Bez korpusu kończy się kodem 0 i mówi, że nie miał czego zmierzyć — bo brak materiału NIE JEST
 * wynikiem „zielonym" i nie wolno go tak czytać w CI.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { ATLAS } from '../src/app/atlas-model.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const KORPUS = opt('--korpus', resolve(ROOT, '..', '..', '..', 'icvd-korpus'));
const PROG = parseInt(opt('--prog', '10'), 10);
const POKAZ = parseInt(opt('--pokaz', '12'), 10);

/* Klucz wpisu → plik źródła. Mapa JAWNA, nie wyprowadzana z numeru: numery [Hnn] nadano
   w kolejności strony towarzystwa, a pliki korpusu w kolejności publikacji — związek istnieje,
   ale jego odtwarzanie kodem byłoby trzecim opisem tej samej rzeczy. */
const PLIKI = {
  bppv: '04-vonbrevern2015-bppv', migrenaPrzedsionkowa: '15-lempert2022-vm-update',
  meniere: '03-lopezescamez2015-meniere', auvp: '17-strupp2022-auvp', bvp: '07-strupp2017-bvp',
  presbywestybulopatia: '10-agrawal2019-pvp', paroksyzmia: '05-strupp2016-paroksyzmia',
  pppd: '06-staab2017-pppd', ortostatyczny: '09-kim2019-hod', mdds: '11-cha2020-mdds',
  chorobaLokomocyjna: '14-cha2021-choroba-lokomocyjna', migrenaDziecieca: '12-vandeberg2021-vmc',
  scds: '13-ward2021-scds', naczyniowe: '16-kim2022-naczyniowe', szyjne: '18-seemungal2022-szyjne',
  slownikObjawow: '01-bisdorff2009-objawy', klasyfikacjaOczoplasu: '08-eggers2019-oczoplas',
  ramyICVD: '19-kask2025-icvd',
};

/* Normalizacja. LIGATURY są tu obowiązkowe, nie kosmetyczne: PDF-y wydawcy zapisują „fi" jako
   pojedynczy znak U+FB01, więc surowe porównanie z tekstem pisanym po ludzku daje ZERO trafień
   i pomiar wychodzi fałszywie czysty. Ta pułapka jest opisana w README korpusu i zmierzona. */
const norm = (s) => String(s || '')
  .replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
  .replace(/[‘’‚‛]/g, "'").replace(/[“”„‟]/g, '"')
  .replace(/[‐-―]/g, '-')
  .toLowerCase()
  .replace(/<[^>]+>/g, ' ')
  .replace(/[^a-z0-9<>≥≤%.\/'-]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const slowa = (s) => norm(s).split(' ').filter(Boolean);

/* Pola EN wpisu, z etykietą miejsca — żeby raport wskazywał, CO poprawić, a nie tylko że coś jest. */
function polaEn(w) {
  const out = [];
  const dodaj = (gdzie, txt) => { if (txt) out.push([gdzie, txt]); };
  dodaj('nazwaEn', w.nazwaEn);
  dodaj('streszczenieEn', w.streszczenieEn);
  (w.synonimy || []).forEach((s, i) => { dodaj(`synonimy[${i}].en`, s.en); dodaj(`synonimy[${i}].uwagaEn`, s.uwagaEn); });
  (w.kryteria || []).forEach((k, i) => {
    dodaj(`kryteria[${i}].nazwaEn`, k.nazwaEn);
    (k.punkty || []).forEach((p, j) => dodaj(`kryteria[${i}].punkty[${j}].en`, p.en));
    (k.przypisyEn || []).forEach((p, j) => dodaj(`kryteria[${i}].przypisyEn[${j}]`, p));
  });
  (w.progi || []).forEach((p, i) => { dodaj(`progi[${i}].wielkoscEn`, p.wielkoscEn); dodaj(`progi[${i}].kontekstEn`, p.kontekstEn); });
  (w.graniceEn || []).forEach((g, i) => dodaj(`graniceEn[${i}]`, g));
  return out;
}

/* Najdłuższy wspólny ciąg słów. Zbiór n-gramów źródła budujemy RAZ na pracę (teksty mają
   40-140 tys. słów), a potem dla każdego pola szukamy najdłuższego trafienia rosnąco. */
function najdluzszyWspolny(polSlowa, zrodloNgramy, maxN) {
  let best = 0, bestTxt = '';
  for (let n = Math.min(maxN, polSlowa.length); n >= PROG; n--) {
    const zbior = zrodloNgramy(n);
    if (!zbior) continue;
    for (let i = 0; i + n <= polSlowa.length; i++) {
      const g = polSlowa.slice(i, i + n).join(' ');
      if (zbior.has(g)) { best = n; bestTxt = g; return { n: best, txt: bestTxt }; }
    }
  }
  return { n: best, txt: bestTxt };
}

if (!existsSync(KORPUS)) {
  console.log(`atlas:parafraza — KORPUSU NIE MA (${KORPUS}).`);
  console.log('Nie zmierzono niczego. To NIE jest wynik zielony: pomiar wymaga pełnych tekstów,');
  console.log('które leżą celowo poza repozytorium (licencje). Uruchom przy materiale.');
  process.exit(0);
}

const MAX_N = 40;
let pol = 0, ostrzezen = 0;
const znaleziska = [];

for (const w of ATLAS) {
  const plik = PLIKI[w.klucz];
  const sciezka = join(KORPUS, 'zrodla-pelny-tekst', plik + '.txt');
  if (!plik || !existsSync(sciezka)) { console.error(`  ! brak źródła dla ${w.klucz} (${sciezka})`); continue; }
  const zrodlo = slowa(readFileSync(sciezka, 'utf8'));
  const cache = new Map();
  const ngramy = (n) => {
    if (cache.has(n)) return cache.get(n);
    if (n > zrodlo.length) return null;
    const s = new Set();
    for (let i = 0; i + n <= zrodlo.length; i++) s.add(zrodlo.slice(i, i + n).join(' '));
    cache.set(n, s);
    return s;
  };
  for (const [gdzie, txt] of polaEn(w)) {
    pol++;
    const r = najdluzszyWspolny(slowa(txt), ngramy, MAX_N);
    if (r.n >= PROG) { ostrzezen++; znaleziska.push({ klucz: w.klucz, zrodlo: w.zrodlo, gdzie, dlugosc: r.n, ciag: r.txt }); }
  }
}

znaleziska.sort((a, b) => b.dlugosc - a.dlugosc);

console.log('OTOREPO — pomiar parafrazy atlasu wobec pełnych tekstów ICVD');
console.log(`korpus        : ${KORPUS}`);
console.log(`próg          : ${PROG} słów pod rząd`);
console.log(`pól zmierzonych: ${pol} (wyłącznie angielskie — źródła są angielskie)`);
console.log(`przekroczeń   : ${ostrzezen}`);
if (znaleziska.length) {
  console.log(`\n${znaleziska.length} pól z ciągiem ≥ ${PROG} słów (najdłuższe najpierw):`);
  for (const z of znaleziska.slice(0, POKAZ)) {
    console.log(`  · ${z.dlugosc} słów — ${z.klucz}.${z.gdzie}  [${z.zrodlo}]`);
    console.log(`      „${z.ciag}"`);
  }
  if (znaleziska.length > POKAZ) console.log(`  … i ${znaleziska.length - POKAZ} dalszych`);
  process.exit(1);
}
console.log(`\n✓ żadne pole nie powtarza ${PROG} ani więcej słów źródła pod rząd`);
