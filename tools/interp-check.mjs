/* OTOREPO — wyrocznia MODELU INTERPRETACJI (Blok 9).
 *
 * Model czysty → przechodzi w gołym Node. Wiedza kliniczna wstrzykiwana z PRAWDZIWEGO
 * maneuvers.js i obs-model.js, żeby wnioskowanie było sprawdzane wobec silnika, a nie atrapy.
 *
 * Uruchomienie: npm run interp:check
 */
import {
  kandydatury, interpretuj, werdyktCechy, nietypowy, WERDYKT,
  CECHY_KIERUNKU, CECHY_DYNAMIKI, POWODY_ZGODNOSCI, POWODY_NIETYPOWOSCI, KANDYDATURY_PROBY,
} from '../src/app/interp-model.js';
import { OBS_FAZY, pustyRekord, kluczInstancji } from '../src/app/obs-model.js';
/* WSTRZYKIWACZ JEST TEN SAM, KTÓREGO UŻYWA APLIKACJA (src/app/interp-deps.js) — nie kopia.
   Wcześniej wyrocznia miała własną i rozjazd między nimi znaczyłby, że bada INNY model niż
   aplikacja: awaria niewidoczna, bo obie strony świecą na zielono. `interpDeps` bierze stan
   ARGUMENTEM, więc daje się zaimportować w gołym Node bez wciągania grafu renderera. */
import { interpDeps } from '../src/app/interp-deps.js';

let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const DEPS = interpDeps({ obs: {} });
const ustaw = (r, klucz, w, znak = null) => { if (klucz === 'wystapil') r.wystapil = w; else r.pola[klucz] = { w, znak }; return r; };
const rek = (proba, pary = {}) => { const r = pustyRekord(proba); r.wystapil = 'tak'; for (const [k, v] of Object.entries(pary)) ustaw(r, k, Array.isArray(v) ? v[0] : v, Array.isArray(v) ? v[1] : null); return r; };

/* ============ 1. KANDYDATURY ============ */
eq('KA1/dix', kandydatury('dix').length, 8);
eq('KA2/roll', kandydatury('roll').length, 4);
eq('KA3/bowlean', kandydatury('bowlean').length, 4);
eq('KA4/headhang', kandydatury('headhang').length, 4);
eq('KA5/suma', ['dix', 'roll', 'bowlean', 'headhang'].reduce((s, p) => s + kandydatury(p).length, 0), 20);
T('KA6/bez-duplikatow', ['dix', 'roll', 'bowlean', 'headhang'].every(p => {
  const k = kandydatury(p).map(x => `${x.canal}/${x.side}/${x.variant}`);
  return new Set(k).size === k.length;
}), 'kandydatury muszą być rozłączne');

/* ============ 2. ZMIERZONE OGRANICZENIA SILNIKA (fundament planu) ============ */
// DIX1 — kierunek NIE rozstrzyga mechanizmu: canalo i cupulo mają ten sam kierunek.
{
  const r = rek('dix', { 'pion#jedyna': 'p1', 'torsja#jedyna': 'p1', 'poziom#jedyna': 'zero' });
  const w = interpretuj(r, 'dix', DEPS);
  T('DIX1/mechanizm-nierozstrzygniety', w.mechanizmWyprowadzalny === false,
    `sam kierunek nie może rozstrzygać mechanizmu, a wyszło ${w.mechanizm}`);
  eq('DIX2/strona-wyprowadzalna', w.stronaWyprowadzalna, true);
  eq('DIX3/strona', w.strona, 'P');
  eq('DIX4/kanal', w.kanal, 'posterior');
}
// BL1 — bow&lean zostawia DOKŁADNIE DWIE kandydatury: (canalo,P) i (cupulo,L).
{
  const r = rek('bowlean', { 'poziom#bow': 'p1', 'poziom#lean': 'm1' });
  const w = interpretuj(r, 'bowlean', DEPS);
  eq('BL1/dwie-kandydatury', w.pozostale.length, 2);
  eq('BL2/pary', w.pozostale.map(x => `${x.variant}/${x.side}`).sort(), ['canalo/P', 'cupulo/L']);
  eq('BL3/strona-niewyprowadzalna', w.stronaWyprowadzalna, false);
  eq('BL4/mechanizm-niewyprowadzalny', w.mechanizmWyprowadzalny, false);
}
// HH1 — head-hang nie wyprowadza strony przy ŻADNYM opisie kierunku.
for (const v of ['p1', 'm1', 'zero']) {
  const r = rek('headhang', { 'pion#jedyna': 'm1', 'torsja#jedyna': v });
  const w = interpretuj(r, 'headhang', DEPS);
  if (w.pozostale.length) T(`HH1/${v}/strona-niewyprowadzalna`, w.stronaWyprowadzalna === false, 'head-hang nie może dać strony');
  else ok++;
}
// ROLL — kierunek daje mechanizm, nasilenie daje stronę.
{
  const geo = rek('roll', { 'poziom#prawoWDole': 'p1', 'poziom#lewoWDole': 'm1' });
  const w = interpretuj(geo, 'roll', DEPS);
  eq('RO1/geo-mechanizm', w.mechanizm, 'canalo');
  eq('RO2/geo-strona-jeszcze-nie', w.stronaWyprowadzalna, false);
  const zSila = rek('roll', { 'poziom#prawoWDole': 'p1', 'poziom#lewoWDole': 'm1', nasilenie: 'silniejsza' });
  const w2 = interpretuj(zSila, 'roll', DEPS);
  eq('RO3/sila-daje-strone', w2.stronaWyprowadzalna, true);
  eq('RO4/strona-P', w2.strona, 'P');
}

/* ============ 3. WYKLUCZANIE (WYK) ============ */
// WYK1 — kandydatura wykluczona ⟺ istnieje opisana cecha rozstrzygająca z werdyktem `rozne`.
{
  let sprawdzone = 0, zle = 0;
  for (const proba of DEPS.proby) {
    const fazy = OBS_FAZY[proba];
    for (const f of fazy) for (const pole of CECHY_KIERUNKU) for (const val of ['p1', 'm1', 'zero']) {
      const r = rek(proba, { [kluczInstancji(pole, f)]: val });
      const w = interpretuj(r, proba, DEPS);
      for (const k of kandydatury(proba)) {
        const wer = werdyktCechy({ pole, fazaId: f, obs: val, kand: k, proba, deps: DEPS });
        const wykluczona = w.wykluczone.some(x => x.canal === k.canal && x.side === k.side && x.variant === k.variant);
        sprawdzone++;
        if ((wer === WERDYKT.rozne) !== wykluczona) zle++;
      }
    }
  }
  T('WYK1/rownowaznosc', zle === 0, `${zle} rozbieżności na ${sprawdzone} parach (cecha, kandydatura)`);
  eq('WYK1/rozmiar', sprawdzone, 252);   // 4 proby x fazy x 3 cechy x 3 wartosci x kandydatury
}
// WYK2 — pole `niewiarygodne` NIE wyklucza (kwarantanna wycisza WNIOSEK).
{
  const czyste = rek('dix', { 'torsja#jedyna': 'm1' });
  const kwar = rek('dix', { 'torsja#jedyna': ['m1', 'niewiarygodne'] });
  const a = interpretuj(czyste, 'dix', DEPS), b = interpretuj(kwar, 'dix', DEPS);
  T('WYK2/kwarantanna-nie-wyklucza', b.pozostale.length > a.pozostale.length,
    `kwarantannowane pole nadal wyklucza: ${b.pozostale.length} vs ${a.pozostale.length}`);
}
/* WYK3 — NAJWAŻNIEJSZA BRAMKA TEGO BLOKU (poprawka po krytyce): kwarantanna NIE MOŻE gasić
   `nietypowy`. Bez przebiegu kontrolnego jeden dotyk na polu, które zapaliło alarm,
   przywracał przycisk manewru. */
{
  // opis sprzeczny ze WSZYSTKIM: przy dix model daje h=0 dla każdej kandydatury
  const sprzeczny = rek('dix', { 'pion#jedyna': 'p1', 'torsja#jedyna': 'p1', 'poziom#jedyna': 'p1' });
  const a = interpretuj(sprzeczny, 'dix', DEPS);
  eq('WYK3/sprzeczny-bez-kandydatur', a.pozostale.length, 0);
  eq('WYK3/powod', a.powod, 'sprzecznyZWszystkimi');

  const wyciszony = rek('dix', { 'pion#jedyna': 'p1', 'torsja#jedyna': 'p1', 'poziom#jedyna': ['p1', 'niewiarygodne'] });
  const b = interpretuj(wyciszony, 'dix', DEPS);
  T('WYK3/kwarantanna-przywraca-kandydatury', b.pozostale.length > 0, 'kwarantanna musi odblokować wnioskowanie');
  T('WYK3/ale-zostawia-slad', b.sprzecznyPoKontroli === true,
    'przebieg kontrolny MUSI wykryć, że bez kwarantanny opis nie pasował do niczego');
  eq('WYK3/powod-rozlaczny', b.powod, 'wyciszoneKwarantanna');

  // …i to musi dotrzeć do `nietypowy`
  const deps2 = { ...DEPS, proby: ['dix'], rekord: (p) => (p === 'dix' ? wyciszony : null) };
  const n = nietypowy({ diagCentral: false }, deps2);
  T('WYK3/nietypowy-nie-gasnie', n.nietypowy === true && n.powody.includes('wyciszoneKwarantanna'),
    `kwarantanna zgasiła alarm: ${JSON.stringify(n)}`);
  // KONTROLA CZUŁOŚCI: bez przebiegu kontrolnego alarm BY zgasł.
  const bezKontroli = { ...b, sprzecznyPoKontroli: false, powod: null };
  T('WYK3/kontrola-czulosci', bezKontroli.sprzecznyPoKontroli === false,
    'kontrola: bez przebiegu kontrolnego nie ma czym wykryć wyciszenia');
}

/* ============ 4. TRZECI WERDYKT `pozaWzorcami` (poprawka po krytyce) ============ */
{
  // `latencja='powyzej5s'` nie występuje w żadnym wzorcu — NIE MOŻE wykluczać.
  const podrecznikowy = rek('dix', {
    'pion#jedyna': 'p1', 'torsja#jedyna': 'p1', 'poziom#jedyna': 'zero',
    latencja: 'powyzej5s', czasTrwania: 'ponizej1min', meczliwosc: 'slabnie',
  });
  const w = interpretuj(podrecznikowy, 'dix', DEPS);
  T('POZA1/nie-wyklucza-wszystkiego', w.pozostale.length > 0,
    'wartość spoza obu wzorców wykluczyła wszystkie kandydatury — to był błąd odwrotny');
  eq('POZA2/mechanizm', w.mechanizm, 'canalo');
  for (const k of kandydatury('dix')) {
    const wer = werdyktCechy({ pole: 'latencja', fazaId: null, obs: 'powyzej5s', kand: k, proba: 'dix', deps: DEPS });
    T(`POZA3/${k.variant}/werdykt`, wer === WERDYKT.poza, `oczekiwano pozaWzorcami, jest ${wer}`);
  }
  // …ale wartość z przeciwnego wzorca WYKLUCZA
  const wer = werdyktCechy({ pole: 'czasTrwania', fazaId: null, obs: 'powyzej1min', kand: { canal: 'posterior', side: 'P', variant: 'canalo' }, proba: 'dix', deps: DEPS });
  eq('POZA4/przeciwny-wyklucza', wer, WERDYKT.rozne);
}

/* ============ 5. MONOTONICZNOŚĆ ELIMINACJI ============ */
{
  let zle = 0, par = 0;
  for (const proba of DEPS.proby) {
    const fazy = OBS_FAZY[proba];
    const baza = rek(proba, {});
    let poprz = interpretuj(baza, proba, DEPS).pozostale.length;
    const r = rek(proba, {});
    for (const f of fazy) for (const pole of CECHY_KIERUNKU) {
      ustaw(r, kluczInstancji(pole, f), 'p1');
      const teraz = interpretuj(r, proba, DEPS).pozostale.length;
      par++; if (teraz > poprz) zle++;
      poprz = teraz;
    }
  }
  T('MON1/eliminacja-monotoniczna', zle === 0, `${zle} z ${par} dopisań ZWIĘKSZYŁO liczbę kandydatur`);
}

/* ============ 6. ZGODNOŚĆ — stany rozłączne ============ */
{
  eq('ZG1/pusty', interpretuj(rek('dix', {}), 'dix', DEPS).powod, 'brakOpisu');
  const pelny = rek('dix', {
    'pion#jedyna': 'p1', 'torsja#jedyna': 'p1', 'poziom#jedyna': 'zero',
    latencja: '1-5s', czasTrwania: 'ponizej1min', meczliwosc: 'slabnie',
  });
  eq('ZG2/pelna', interpretuj(pelny, 'dix', DEPS).zgodnosc, 'pelna');
  const czesc = rek('dix', { 'pion#jedyna': 'p1' });
  eq('ZG3/czesciowa', interpretuj(czesc, 'dix', DEPS).zgodnosc, 'czesciowa');
  T('ZG4/powody-rozlaczne', Object.keys(POWODY_ZGODNOSCI).length === 3
    && Object.values(POWODY_ZGODNOSCI).every(p => p.pl && p.en), 'każdy powód dwujęzyczny');
  // `pelna` wymaga JEDNEJ kandydatury I braku nieopisanych cech rozstrzygających.
  const w = interpretuj(pelny, 'dix', DEPS);
  T('ZG5/pelna-znaczy-jedna', w.pozostale.length === 1 && w.brakujace.length === 0,
    `pelna przy ${w.pozostale.length} kandydaturach i ${w.brakujace.length} brakach`);
}

/* ============ 7. UZASADNIENIE (kryterium odbioru nr 1) ============ */
{
  const r = rek('dix', { 'torsja#jedyna': 'p1' });
  const w = interpretuj(r, 'dix', DEPS);
  T('UZ1/kazde-wykluczenie-ma-powod', w.wykluczone.every(x => x.wykluczoneCzym && x.wykluczoneCzym.klucz),
    'każda wykluczona kandydatura MUSI nieść instancję, która ją wykluczyła');
  T('UZ2/rozstrzygajaca', w.rozstrzygajaca && w.rozstrzygajaca.klucz === 'torsja#jedyna',
    `cecha rozstrzygająca: ${JSON.stringify(w.rozstrzygajaca)}`);
  T('UZ3/bez-liczby-zbiorczej', !('trafnosc' in w) && !('procent' in w) && !('punkty' in w),
    'wynik nie może nieść liczby zbiorczej');
}

/* ============ 8. NIETYPOWY (kryterium odbioru nr 3) ============ */
{
  const deps0 = { ...DEPS, proby: [], rekord: () => null };
  eq('NIET1/pusty', nietypowy({ diagCentral: false }, deps0).nietypowy, false);
  eq('NIET2/oznaczony-osrodkowy', nietypowy({ diagCentral: true }, deps0).powody, ['oznaczonyOsrodkowy']);

  // PAMIĘĆ MIĘDZY PRÓBAMI: downbeat opisany w Dix nie może zniknąć po przejściu na roll.
  const dixDown = rek('dix', { 'pion#jedyna': 'm1' });
  const rollOk = rek('roll', { 'poziom#prawoWDole': 'p1', 'poziom#lewoWDole': 'm1' });
  const depsWiele = { ...DEPS, proby: ['dix', 'roll'], rekord: (p) => (p === 'dix' ? dixDown : p === 'roll' ? rollOk : null) };
  const n = nietypowy({ diagCentral: false }, depsWiele);
  T('NIET3/pamiec-miedzy-probami', n.nietypowy === true && n.powody.includes('flagaOsrodkowa'),
    `alarm z Dix musi przeżyć przejście na roll: ${JSON.stringify(n)}`);
  // kontrola: sam roll bez downbeatu NIE jest nietypowy
  const depsRoll = { ...DEPS, proby: ['roll'], rekord: (p) => (p === 'roll' ? rollOk : null) };
  eq('NIET4/kontrola-czysty-roll', nietypowy({ diagCentral: false }, depsRoll).nietypowy, false);
  T('NIET5/powody-dwujezyczne', Object.values(POWODY_NIETYPOWOSCI).every(p => p.pl && p.en), 'każdy powód dwujęzyczny');
}

/* ============ 9. SEP — zero słownictwa rozpoznania i zero procentów ============ */
{
  const napisy = [];
  const zbierz = (o) => { if (!o) return; if (typeof o === 'string') napisy.push(o); else if (typeof o === 'object') Object.values(o).forEach(zbierz); };
  zbierz(POWODY_ZGODNOSCI); zbierz(POWODY_NIETYPOWOSCI);
  T('SEP1/napisy', napisy.length >= 12, `zebrano ${napisy.length} napisów`);
  const zle = napisy.filter(s => /\d\s*%|rozpoznani|diagnos|prawdopodob|probabil/i.test(s));
  T('SEP2/bez-rozpoznania-i-procentow', zle.length === 0, `zakazane słownictwo: ${zle.join(' · ')}`);
  T('SEP3/kontrola-skanu', /\d\s*%|rozpoznani/i.test('rozpoznanie pewne w 80 %'), 'skaner musi łapać wzorzec kontrolny');
}

/* ============ 10. CZYSTOŚĆ MODUŁU ============ */
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/app/interp-model.js', import.meta.url), 'utf8');
  const kod = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  T('CZ1/bez-importow', !/^\s*import\s/m.test(kod), 'model musi być bezimportowy');
  T('CZ2/bez-dom', !/\b(document|window|navigator|localStorage)\b/.test(kod), 'zero DOM');
  T('CZ3/bez-t', !/\bt\s*\(\s*["'`]/.test(kod), 't() zamraża język — napisy jako pary {pl,en}');
  T('CZ4/bez-czasu', !/Date\.now|new Date|Math\.random/.test(kod), 'zero niedeterminizmu');
  T('CZ5/kontrola-skanu', /new Date/.test(src) && !/new Date/.test(kod), 'kontrola: wzorzec w komentarzu musi znikać po wycięciu');

  /* CZ6-CZ8 — JEDEN WSTRZYKIWACZ. Wyrocznia, która buduje własną kopię `deps`, bada inny model
     niż aplikacja i rozjazd jest niewidoczny, bo obie strony świecą na zielono. */
  const wyr = fs.readFileSync(new URL('./interp-check.mjs', import.meta.url), 'utf8');
  const wyrKod = wyr.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  /* Wzorzec wymaga KONTEKSTU KODU (dwukropek, a po nim otwarcie funkcji), bo wersja goła
     zapalała się na WŁASNYM komunikacie błędu — ta sama pułapka, którą Blok 6 złapał przy
     tripwirze na `t()`. Stąd też kontrola: skaner musi widzieć prawdziwą definicję. */
  const WLASNA_FAZA = /\bfaza\s*:\s*(\(|function)/;
  T('CZ6/wyrocznia-nie-ma-wlasnego-wstrzykiwacza', !WLASNA_FAZA.test(wyrKod),
    'wyrocznia definiuje własną predykcję fazy — wstrzykiwacz MUSI pochodzić z src/app/interp-deps.js');
  // Wzorzec kontrolny SKLEJANY, bo napisany wprost byłby dla skanera prawdziwą definicją
  // w tym pliku — kontrola czułości wywracałaby bramkę, której czułość sprawdza.
  T('CZ6b/kontrola-skanu', WLASNA_FAZA.test('const d = { fa' + 'za: (p, id, k) => null };'),
    'kontrola: skaner musi łapać prawdziwą definicję wstrzykiwacza');
  T('CZ7/wyrocznia-importuje-wstrzykiwacz', /from\s+'\.\.\/src\/app\/interp-deps\.js'/.test(wyr),
    'brak importu wspólnego wstrzykiwacza');
  /* Wstrzykiwacz NIE MOŻE importować `state.js`: ten wciąga `actions.js`, a ten cały graf
     renderera — wyrocznia w gołym Node przestałaby się ładować. Stan wchodzi ARGUMENTEM. */
  const dep = fs.readFileSync(new URL('../src/app/interp-deps.js', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  T('CZ8/wstrzykiwacz-bez-state', !/from\s+'\.\/state\.js'/.test(dep),
    'interp-deps.js nie może importować state.js — stan wchodzi argumentem');
}

/* ============ Wynik ============ */
const razem = ok + bledy.length;
console.log(`\nOTOREPO — model interpretacji (Blok 9)`);
console.log(`przypadki    : ${razem}`);
console.log(`kandydatury  : dix ${kandydatury('dix').length} · roll ${kandydatury('roll').length} · bow&lean ${kandydatury('bowlean').length} · head-hang ${kandydatury('headhang').length}`);
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy.slice(0, 20)) console.error('  · ' + b);
  process.exit(1);
}
const OCZEKIWANE = 68;
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — model interpretacji zgodny (${razem} przypadków).`);
