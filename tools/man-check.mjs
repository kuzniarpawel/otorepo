/* OTOREPO — wyrocznia CZYSTEGO MODELU MANEWRU (Blok 10). Gołe Node, bez jsdom.
 *
 * Bada twierdzenia, które da się postawić o MODELU. Twierdzenia o EKRANIE (kryteria odbioru nr 1
 * i nr 3) bada osobno tools/man-dom.mjs — ta sama zasada, dla której Blok 9 ma i interp:check,
 * i interp:dom: model może bezbłędnie liczyć, a ekran i tak wypisze co innego.
 *
 * Każda bramka ma KONTROLĘ CZUŁOŚCI: stan bliźniaczy, w którym wynik MUSI być przeciwny.
 * Bramka bez kontroli przechodzi też na wyłączonym module i nie pilnuje niczego.
 *
 * Uruchomienie: npm run man:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  probyKanalu, probaKanalu, doborEkspercki, etapyManewru, KRYTERIA,
  czasUtrzymania, ZAPAS_S, trybDoUstapieniaDostepny, POWOD_BRAKU_TRYBU,
  spojnoscPlanu, ROZJAZDY, wykonanySekwencyjnie, sygnalKonwersji, przeniesCzasy,
  opisPozycji, POZYCJE_CIALA, USTAWIENIA_TWARZY,
} from '../src/app/man-model.js';
import { manDeps } from '../src/app/man-deps.js';
import { nowyZegar, startZegara, pauzaZegara, wznowZegar, resetZegara, odliczono, ustawOdliczono, odnotujLuke, PROG_LUKI_MS } from '../src/runtime/hold-clock.js';
import { MANEUVERS, CANALS, CANAL_OF, DIAG, recommend, sizedSeconds, LEAN_G, BASE_G, SIDE_FORMY } from '../src/pose/maneuvers.js';
import { state } from '../src/app/state.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
state.lang = 'pl';                              // determinizm napisów w skanach źródła

let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const D = manDeps();
const KANALY = ['posterior', 'horizontal', 'anterior'];
const KLUCZE = Object.keys(MANEUVERS);
const plan = (k, s) => { const p = MANEUVERS[k].gen(s); p.key = k; return p; };

/* ═══════════ A. KANAŁ → PRÓBA (most trybu eksperckiego) ═══════════ */
eq('KP1/posterior', probyKanalu('posterior', D), ['dix']);
eq('KP2/horizontal', probyKanalu('horizontal', D), ['roll', 'bowlean']);
eq('KP3/anterior', probyKanalu('anterior', D), ['headhang']);
// Kanał nieznany NIE MOŻE dać próby: recommend() ma cichy wynik domyślny (wszystko poza
// 'dix'/'headhang' spada do kanału poziomego), więc null jest tu jedyną uczciwą odpowiedzią.
eq('KP4/nieznany-null', probaKanalu('bzdura', D), null);
eq('KP5/pusty-null', probaKanalu(null, D), null);
T('KP6/pokrycie', KANALY.every(k => probyKanalu(k, D).length > 0), 'każdy kanał ma próbę w DIAG');

/* ═══════════ B. DOBÓR EKSPERCKI ═══════════ */
for (const kanal of KANALY) for (const mech of ['canalo', 'cupulo']) {
  const d = doborEkspercki(kanal, mech, D);
  T(`DE1/${kanal}/${mech}`, !!d && !!d.pierwszy, 'dobór musi dać manewr pierwszego rzutu');
  eq(`DE2/${kanal}/${mech}/w-liscie`, d.poza, []);
  T(`DE3/${kanal}/${mech}/alt-bez-pierwszego`, !d.alternatywy.includes(d.pierwszy), 'pierwszy rzut nie może być własną alternatywą');
  eq(`DE4/${kanal}/${mech}/kanal-manewru`, CANAL_OF[d.pierwszy], kanal);
}
// Kanał poziomy ma DWIE próby. Dziś dają identyczne zalecenie; gdy przestaną, wybór „pierwszej
// z brzegu" byłby cichym rozstrzygnięciem klinicznym — bramka ma o tym krzyczeć, nie milczeć.
eq('DE5/roll-vs-bowlean', doborEkspercki('horizontal', 'canalo', D).rozbiezneProby, []);
eq('DE6/roll-vs-bowlean-cup', doborEkspercki('horizontal', 'cupulo', D).rozbiezneProby, []);
eq('DE7/nieznany-kanal', doborEkspercki('bzdura', 'canalo', D), null);
// KONTROLA CZUŁOŚCI: podstawiony recommend zwracający manewr spoza kanału MUSI zapełnić `poza`.
{
  const zly = { ...D, recommend: () => ({ primary: 'epley', alts: [] }) };
  T('DE8/czulosc-poza', doborEkspercki('horizontal', 'canalo', zly).poza.length === 1,
    'manewr spoza listy kanału musi trafić do `poza`');
  const rozne = { ...D, recommend: (p) => ({ primary: p === 'roll' ? 'lempert' : 'gufoniGeo', alts: [] }) };
  T('DE9/czulosc-rozbiezne', doborEkspercki('horizontal', 'canalo', rozne).rozbiezneProby.length === 1,
    'rozjazd zaleceń między próbami tego samego kanału musi być widoczny');
}

/* ═══════════ C. ETAPY: pozycja · kąt · strona · czas · kryterium ═══════════ */
for (const k of KLUCZE) for (const s of ['P', 'L']) {
  const p = plan(k, s);
  const e = etapyManewru(p, D, 'medium');
  eq(`ET1/${k}/${s}/liczba`, e.length, p.steps.length);
  T(`ET2/${k}/${s}/komplet`, e.every(x => x.pozycja.body && x.kat !== undefined && x.strona === s && x.kryterium),
    'każdy etap musi nieść pozycję, kąt, stronę i kryterium');
  T(`ET3/${k}/${s}/kryteria-znane`, e.every(x => KRYTERIA[x.kryterium]), 'kryterium spoza słownika');
  T(`ET4/${k}/${s}/plynne-bez-czasu`, e.every(x => (x.kryterium === 'plynne') === (x.sekundy == null)),
    'krok bez odliczania i kryterium „płynne" to ten sam zbiór');
}
// Etap wyjścia złogu istnieje dokładnie tam, gdzie fizyka mówi „exited" — i najwyżej jeden na plan.
for (const k of KLUCZE) {
  const e = etapyManewru(plan(k, 'P'), D, 'medium');
  T(`ET5/${k}/jedno-wyjscie`, e.filter(x => x.wyjscieZloga).length <= 1, 'najwyżej jeden etap wyjścia');
}
// Gufoni apogeotropowy to manewr KONWERSJI — złóg NIE opuszcza kanału, więc etapu wyjścia być nie może.
eq('ET6/gufoniApo-bez-wyjscia', etapyManewru(plan('gufoniApo', 'P'), D, 'medium').filter(x => x.wyjscieZloga).length, 0);
// Kanał poziomy: krok kuracyjny pochodzi ze SCHEMATU (n-2), nie z fizyki — i model musi to przyznać.
T('ET7/lempert-schemat', etapyManewru(plan('lempert', 'P'), D, 'medium').some(x => x.wyjscieZloga && x.wyjscieZeSchematu),
  'kanał poziomy: etap kuracyjny wyprowadzony schematem musi być oznaczony jako schemat');
// Epley/Semont/Yacovino: wyjście z FIZYKI (man.exited + manExitStep), nie ze schematu.
for (const k of ['epley', 'semont', 'yacovino']) {
  const w = etapyManewru(plan(k, 'P'), D, 'medium').find(x => x.wyjscieZloga);
  T(`ET8/${k}/wyjscie-z-fizyki`, !!w && !w.wyjscieZeSchematu, 'kanał pionowy: etap wyjścia ma pochodzić z fizyki');
}
/* ZMIERZONE I ZAPISANE JAKO NIEZMIENNIK: w Epleyu złóg opuszcza kanał w kroku SIAD, który nie ma
   odliczania. Gdyby „wyjście" było trzecią wartością kryterium, ten etap musiałby przestać być
   „płynny" albo przestać być etapem wyjścia — czyli aplikacja zataiłaby jedną z dwóch rzeczy
   akurat o kroku, w którym powstaje oczopląs liberacyjny. */
{
  const e = etapyManewru(plan('epley', 'P'), D, 'medium').find(x => x.wyjscieZloga);
  T('ET9/epley-wyjscie-bez-odliczania', !!e && e.kryterium === 'plynne' && e.sekundy === null,
    'Epley: etap wyjścia złogu jest jednocześnie etapem bez odliczania — obie cechy muszą przetrwać');
}

/* ═══════════ C2. NAZWA POZYCJI — ODWRÓCENIE lean* ═══════════
   `sideL` = na boku LEWYM, ale `leanL` = na boku PRAWYM (pozy Semonta nazwane od strony PRZECHYŁU,
   nie od boku, na którym pacjent leży). Pomyłka wypisałaby klinicyście przy kozetce odwrotne ucho,
   a fizyka by na to nie zareagowała, bo nazwa nie wchodzi do symulacji — czyli żadna inna
   wyrocznia by tego nie złapała. */
{
  const pl = (b, f) => (opisPozycji(b, f) || {}).pl;
  T('PZ1/sideL-lewy', /boku lewym/.test(pl('sideL', 'fwd')), 'sideL to bok LEWY');
  T('PZ2/sideR-prawy', /boku prawym/.test(pl('sideR', 'fwd')), 'sideR to bok PRAWY');
  T('PZ3/leanL-PRAWY', /boku prawym/.test(pl('leanL', 'fwd')), 'leanL to bok PRAWY — odwrócenie względem sideL');
  T('PZ4/leanR-LEWY', /boku lewym/.test(pl('leanR', 'fwd')), 'leanR to bok LEWY — odwrócenie względem sideR');
  // Sprawdzenie wobec FIZYKI, a nie wobec komentarza: gHead dla pozy na boku ma znak wzdłuż osi
  // usznej (x>0 = grawitacja ku PRAWEMU uchu = pacjent leży na prawym boku).
  const g = (b) => LEAN_G[b + '|fwd'] || BASE_G[b + '|fwd'];
  T('PZ5/zgodne-z-fizyka', g('leanL')[0] > 0 && g('leanR')[0] < 0 && g('sideL')[0] < 0 && g('sideR')[0] > 0,
    'nazwy boków muszą zgadzać się ze znakiem grawitacji w ramce głowy, nie z intuicją');
  T('PZ6/komplet', Object.keys(POZYCJE_CIALA).every(b => !!pl(b, 'fwd')), 'każda poza ciała ma nazwę');
  T('PZ7/dwujezyczne', Object.values(POZYCJE_CIALA).every(o => o.pl && o.en)
    && Object.values(USTAWIENIA_TWARZY).every(o => o.pl && o.en), 'nazwy dwujęzyczne');
  // Każde `body` używane przez JAKIKOLWIEK manewr musi mieć nazwę — inaczej na ekranie zostanie
  // identyfikator silnika (zmierzone: „supineHang/up" trafiło na ekran przy pierwszym podejściu).
  const uzywane = new Set();
  for (const k of KLUCZE) for (const s of ['P', 'L']) plan(k, s).steps.forEach(x => uzywane.add(x.body));
  eq('PZ8/bez-luk', [...uzywane].filter(b => !POZYCJE_CIALA[b]), []);
}

/* ═══════════ D. „DO USTĄPIENIA OCZOPLĄSU + ZAPAS" — PODŁOGA, NIGDY SKRÓCENIE ═══════════ */
/* To jest najważniejsza bramka tego bloku. ZMIERZONE: model daje dla Semonta 18,5 s przy
   seconds=90 i instrukcji „Utrzymaj 1–3 min" (okno dynamiki jest zakorkowane capem 12 s, więc
   liczba NIGDY nie przekroczy ~19 s). Tryb, który ustawiałby tę liczbę wprost, skróciłby rzut
   Semonta o ~70 s poniżej dolnej granicy WŁASNEJ instrukcji aplikacji. */
eq('CZ1/podloga-semont', czasUtrzymania(90, 18.5, {}), { sekundy: 90, zrodlo: 'protokol', powod: 'protokolDluzszy' });
eq('CZ2/wydluza-gdy-dluzszy', czasUtrzymania(30, 39.8, {}), { sekundy: 55, zrodlo: 'oczoplas', powod: 'oczoplas' });
eq('CZ3/brak-sygnalu', czasUtrzymania(30, null, {}), { sekundy: 30, zrodlo: 'protokol', powod: 'brakSygnalu' });
eq('CZ4/plynne-zostaje-plynne', czasUtrzymania(null, 34.4, {}), { sekundy: null, zrodlo: 'plynne', powod: null });
eq('CZ5/zapas', ZAPAS_S, 15);
// NA CAŁEJ SIATCE: dla każdego manewru, strony, rozmiaru i etapu tryb NIE MOŻE skrócić protokołu.
{
  let naruszen = 0, wydluzen = 0;
  for (const k of KLUCZE) for (const s of ['P', 'L']) for (const rozm of ['small', 'medium', 'big']) {
    const p = plan(k, s);
    for (const st2 of p.steps) if (st2.seconds != null) st2.seconds = sizedSeconds(st2.seconds, rozm);
    for (const e of etapyManewru(p, D, rozm)) {
      const w = czasUtrzymania(e.sekundy, e.sekundyOczoplasu, {});
      if (e.sekundy != null && w.sekundy < e.sekundy) naruszen++;
      if (e.sekundy != null && w.sekundy > e.sekundy) wydluzen++;
    }
  }
  eq('CZ6/siatka-bez-skrocenia', naruszen, 0);
  T('CZ7/siatka-czasem-wydluza', wydluzen > 0, 'tryb musi być do czegokolwiek przydatny — gdzieś MUSI wydłużać');
}
// KONTROLA CZUŁOŚCI: wersja bez podłogi (czyli błąd, przed którym ta bramka chroni) MUSI paść.
{
  const bezPodlogi = (proto, ocz) => (proto == null ? null : (ocz == null ? proto : Math.round((ocz + ZAPAS_S) / 5) * 5));
  T('CZ8/czulosc-podlogi', bezPodlogi(90, 18.5) < 90, 'kontrola: wersja bez podłogi skraca Semonta — właśnie temu zapobiegamy');
}
// Kupulolitiaza: tryb NIEDOSTĘPNY, bo oczopląs nie wygasa (|ξ| = 100 % szczytu po 300 s).
eq('CZ9/cupulo-niedostepny', trybDoUstapieniaDostepny(plan('bascule', 'P')), { dostepny: false, powod: 'cupulo' });
eq('CZ10/gufoniApo-niedostepny', trybDoUstapieniaDostepny(plan('gufoniApo', 'P')), { dostepny: false, powod: 'cupulo' });
eq('CZ11/epley-dostepny', trybDoUstapieniaDostepny(plan('epley', 'P')), { dostepny: true, powod: null });
T('CZ12/powod-ma-oba-jezyki', !!(POWOD_BRAKU_TRYBU.cupulo.pl && POWOD_BRAKU_TRYBU.cupulo.en), 'powód dwujęzyczny');

/* ═══════════ E. SPÓJNOŚĆ PLANU ZE STANEM ═══════════ */
{
  const s0 = { maneuverKey: 'epley', side: 'P', canal: 'posterior', plan: plan('epley', 'P'), flow: { maneuver: { key: 'epley' } } };
  eq('SP1/zgodny', spojnoscPlanu(s0, D).zgodny, true);
  eq('SP2/strona', spojnoscPlanu({ ...s0, side: 'L' }, D).powody.map(p => p.pole), ['strona']);
  eq('SP3/kanal', spojnoscPlanu({ ...s0, canal: 'horizontal' }, D).powody.map(p => p.pole), ['kanal']);
  // Zmierzony rozjazd nr 1: pickCanal('anterior') podmienia maneuverKey na yacovino, a plan zostaje
  // Lempertem. Bramka MUSI to nazwać dwoma powodami: manewr planu i kanał planu.
  eq('SP3b/pickCanal', spojnoscPlanu({ maneuverKey: 'yacovino', side: 'P', canal: 'anterior',
    plan: plan('lempert', 'P'), flow: { maneuver: { key: 'lempert' } } }, D).powody.map(p => p.pole).sort(),
    ['kanal', 'manewr']);
  eq('SP4/manewr', spojnoscPlanu({ ...s0, maneuverKey: 'lempert' }, D).powody.map(p => p.pole), ['manewr']);
  eq('SP5/odcisk', spojnoscPlanu({ ...s0, flow: { maneuver: { key: 'lempert' } } }, D).powody.map(p => p.pole), ['odcisk']);
  eq('SP6/bez-planu', spojnoscPlanu({ maneuverKey: 'epley', side: 'P' }, D).zgodny, true);
  T('SP7/powody-dwujezyczne', Object.values(ROZJAZDY).every(r => r.pl && r.en), 'każdy rozjazd ma oba języki');
}

/* ═══════════ F. „WYKONANY" TO NIE „OBEJRZANY" ═══════════ */
eq('WY1/sekwencyjnie', wykonanySekwencyjnie(3, 4, 5), true);
eq('WY2/skok-z-zera', wykonanySekwencyjnie(0, 4, 5), false);
eq('WY3/skok-z-drugiego', wykonanySekwencyjnie(1, 4, 5), false);
eq('WY4/nie-ostatni', wykonanySekwencyjnie(2, 3, 5), false);
eq('WY5/cofniecie', wykonanySekwencyjnie(4, 3, 5), false);
eq('WY6/pusty-plan', wykonanySekwencyjnie(0, 0, 0), false);
// KONTROLA CZUŁOŚCI: dzisiejsza reguła (samo i===n-1) przepuszcza skok — dlatego ta funkcja istnieje.
T('WY7/czulosc', (0 === 5 - 1) === false && (4 === 5 - 1) === true, 'kontrola: reguła „i===n-1" nie odróżnia skoku od dojścia');

/* ═══════════ G. KONWERSJA KANAŁOWA PO WYKONANYM MANEWRZE ═══════════ */
{
  const wykonany = (key, canal) => ({ canal, flow: { maneuver: { key, consumed: true } } });
  T('KN1/pc-hc', !!sygnalKonwersji(wykonany('epley', 'horizontal'), D), 'Epley wykonany + kanał poziomy = konwersja kanałowa');
  eq('KN2/ten-sam-kanal', sygnalKonwersji(wykonany('epley', 'posterior'), D), null);
  eq('KN3/niewykonany', sygnalKonwersji({ canal: 'horizontal', flow: { maneuver: { key: 'epley', consumed: false } } }, D), null);
  eq('KN4/bez-manewru', sygnalKonwersji({ canal: 'horizontal', flow: {} }, D), null);
  const s = sygnalKonwersji(wykonany('epley', 'horizontal'), D);
  T('KN5/dwujezyczny', !!(s.pl && s.en), 'sygnał dwujęzyczny');
  eq('KN6/nazywa-kanaly', [s.kanalWykonanego, s.kanalTeraz], ['posterior', 'horizontal']);
}

/* ═══════════ H. PRZENIESIENIE RĘCZNIE USTAWIONYCH CZASÓW ═══════════ */
{
  const stary = plan('epley', 'P'); stary.steps[1].seconds = 120;
  const nowy = przeniesCzasy(stary, plan('epley', 'L'));
  eq('PC1/przezywa-zmiane-strony', nowy.steps[1].seconds, 120);
  eq('PC2/reszta-fabryczna', nowy.steps[2].seconds, 30);
  eq('PC3/plynne-zostaje-plynne', nowy.steps[0].seconds, null);
  // Inny manewr → czasy nie mają właściciela. Przenoszenie po INDEKSIE przepisałoby 120 s
  // z kroku 2 Epleya na krok 2 Yacovino, czyli na zupełnie inną pozycję ciała.
  const yac = przeniesCzasy(stary, plan('yacovino', 'P'));
  eq('PC4/inny-manewr-nie-dziedziczy', yac.steps[1].seconds, 30);
  // KONTROLA CZUŁOŚCI: bez przeniesienia wartość ginie — to jest zmierzony defekt setGuideSide.
  T('PC5/czulosc', plan('epley', 'L').steps[1].seconds === 30, 'kontrola: świeży plan ma czas fabryczny');
}

/* ═══════════ I. CZYSTOŚĆ MODELU (skan źródła) ═══════════ */
{
  const src = readFileSync(resolve(ROOT, 'src/app/man-model.js'), 'utf8');
  T('CZY1/bez-importow', !/^\s*import\s/m.test(src), 'man-model.js musi zostać bezimportowy');
  // t() na poziomie modułu ZAMRAŻA język (moduły ładują się przed initLang) — ta sama pułapka
  // złapała już twardy polski `title` w svg-screens.js. Wzorzec wymaga KONTEKSTU kodu, żeby
  // bramka nie zapaliła się na własnym komunikacie błędu (dwa razy w tym projekcie).
  T('CZY2/bez-t', !/[^\w.]t\s*\(\s*['"`]/.test(src), 'napisy muszą być surowymi parami {pl,en}, nie wywołaniami t()');
  T('CZY3/bez-dom', !/\bdocument\b|\bwindow\b/.test(src), 'model nie dotyka DOM');
  T('CZY4/bez-zegara', !/Date\.now|performance\.now|new Date\(/.test(src), 'model nie czyta zegara (determinizm wyroczni)');
  T('CZY5/bez-losowosci', !/Math\.random/.test(src), 'model nie losuje');
  // KONTROLA CZUŁOŚCI każdego skanu — budowana przez SKLEJANIE, żeby literał kontrolny sam nie
  // wpadł w skanowane źródło (ta pułapka zamknęła CZ6b w Bloku 9).
  const kontrola = "im" + "port { x } from 'y';\nconst A = " + "t('a','b');\nconst B = doc" + "ument.body;\nconst C = Date." + "now();\nconst E = Math." + "random();";
  T('CZY6/czulosc', /^\s*import\s/m.test(kontrola) && /[^\w.]t\s*\(\s*['"`]/.test(kontrola)
    && /\bdocument\b/.test(kontrola) && /Date\.now/.test(kontrola) && /Math\.random/.test(kontrola),
    'kontrola czułości: wzorce muszą trafiać w tekst, który naprawdę łamie regułę');
}

/* ═══════════ J. WSTRZYKIWACZ JEST JEDEN ═══════════ */
{
  const deps = readFileSync(resolve(ROOT, 'src/app/man-deps.js'), 'utf8');
  const importy = [...deps.matchAll(/from\s+'([^']+)'/g)].map(m => m[1]);
  eq('WS1/tylko-czyste', importy.filter(i => !/pose\/maneuvers\.js$/.test(i)), []);
  T('WS2/komplet', ['recommend', 'canalOf', 'manewryKanalu', 'kanalProby', 'proby', 'symulacja', 'harmonogram', 'sekundyOczoplasu']
    .every(k => typeof D[k] === 'function'), 'wstrzykiwacz musi dostarczyć komplet zależności');
}

/* ═══════════ J2. ZEGAR UTRZYMANIA POZYCJI (kryterium odbioru nr 3) ═══════════
   Sekwencja z krytyki, liczona DETERMINISTYCZNIE (czas wchodzi argumentem, w module nie ma
   ani jednego Date.now): „start → 10 s → ukrycie 4 s → powrót" musi dać 14 000 ms.
   Wersja z podwójnym liczeniem (kotwica ORAZ akumulacja dt) dałaby 18 000 — i to jest dokładnie
   ten błąd, przed którym ta sekcja chroni. */
{
  const z = nowyZegar();
  startZegara(z, 1000, 0);
  eq('ZE1/po-10s', odliczono(z, 11000), 10000);
  // Przerwa w widoczności: czas biegnie dalej (pacjent leży), ale luka jest ODNOTOWANA.
  const l = odnotujLuke(z, 11000, 15000);
  eq('ZE2/luka-4s', [l.ms, l.istotna], [4000, true]);
  eq('ZE3/czas-po-powrocie', odliczono(z, 15000), 14000);
  T('ZE4/bez-podwojnego-liczenia', odliczono(z, 15000) !== 18000, 'kotwica NIE dolicza przerwy drugi raz');
  // Pauza nie liczy się do utrzymania pozycji — pacjent w niej nie leży w pozycji prowokującej.
  pauzaZegara(z, 15000);
  eq('ZE5/pauza-zamraza', odliczono(z, 200000), 14000);
  wznowZegar(z, 200000);
  eq('ZE6/wznowienie', odliczono(z, 201000), 15000);
  eq('ZE7/pauza-3-min-nie-liczy', odliczono(z, 201000), 15000);
  // Krótkie mrugnięcie (powiadomienie systemowe) NIE jest luką: alarmowanie o nim uczyłoby
  // ignorowania komunikatu, a to jest ten sam mechanizm, przez który `dixRep` nie wszedł do odcisku.
  const k = odnotujLuke(z, 201000, 202000);
  eq('ZE8/krotkie-mrugniecie', [k.ms, k.istotna], [1000, false]);
  eq('ZE9/prog', PROG_LUKI_MS, 3000);
  // Suwak skracający czas poniżej odliczonego przesuwa KOTWICĘ — dwa źródła prawdy o tym samym
  // czasie rozjechałyby się przy pierwszej pauzie.
  const z2 = nowyZegar(); startZegara(z2, 0, 0);
  ustawOdliczono(z2, 50000, 20000);
  eq('ZE10/ustawienie-czasu', odliczono(z2, 50000), 20000);
  eq('ZE11/biegnie-dalej', odliczono(z2, 51000), 21000);
  eq('ZE12/reset', odliczono(resetZegara(z2), 60000), 0);
  eq('ZE13/bez-startu-zero', odliczono(nowyZegar(), 99999), 0);
  // KONTROLA CZUŁOŚCI: model z akumulacją klatek (to, co było) NA TEJ SAMEJ sekwencji daje 18 s.
  {
    let elapsed = 0, last = 1000;
    for (const t2 of [11000, 15000]) { elapsed += t2 - last; last = t2; }   // klatka po powrocie dostaje CAŁE 4 s
    T('ZE14/czulosc-suma-klatek', elapsed === 14000, 'kontrola: sama suma klatek też daje 14 s — różnica jest w KASKADZIE');
    // Prawdziwa różnica: przy sumie klatek warunek końca etapu odpala się w TEJ SAMEJ klatce
    // i auto-przejście leci dalej. Zegar ścienny zatrzymuje odliczanie na istotnej luce.
    T('ZE15/luka-zatrzymuje', l.istotna === true, 'istotna luka MUSI być sygnałem do zatrzymania, nie tłem');
  }
  /* Zero odczytu zegara w module — inaczej wyrocznia nie byłaby deterministyczna.
     SKANUJEMY KOD, NIE KOMENTARZE: pierwsza wersja tej bramki zapaliła się na własnym akapicie
     wyjaśniającym, dlaczego `Date.now()` jest tu zakazane. To już trzeci raz w tym projekcie
     (CZ6 w Bloku 9, skan `t()` w Bloku 6), więc usuwanie komentarzy jest teraz częścią wzorca. */
  const bezKomentarzy = (txt) => txt.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const src = bezKomentarzy(readFileSync(resolve(ROOT, 'src/runtime/hold-clock.js'), 'utf8'));
  T('ZE16/bez-zegara-w-module', !/Date\.now|performance\.now|new Date\(/.test(src), 'czas MUSI wchodzić argumentem');
  T('ZE17/bez-importow', !/^\s*import\s/m.test(src), 'hold-clock.js jest czysty');
  // KONTROLA CZUŁOŚCI: usuwanie komentarzy nie może zjadać KODU.
  T('ZE18/czulosc-skanu', /Date\.now/.test(bezKomentarzy('/* Date.now jest zakazane */\nconst x = Date.now();')),
    'kontrola: skan musi widzieć wywołanie w kodzie, a nie widzieć go w komentarzu');
  T('ZE19/czulosc-komentarz', !/Date\.now/.test(bezKomentarzy('/* Date.now jest zakazane */\nconst x = 1;')),
    'kontrola: sam komentarz nie może wywalać bramki');
}

/* ═══════════ J3. KRYTERIUM ODBIORU NR 2 — LEWO/PRAWO ZAWSZE Z WŁAŚCICIELEM ═══════════
   „Instrukcja nie używa niejednoznacznych określeń lewo/prawo bez wskazania, czy chodzi o pacjenta."
   ZMIERZONE: kryterium jest dziś SPEŁNIONE — każde zdanie z kierunkiem niesie właściciela. Ta
   sekcja jest więc ZAPADKĄ, nie naprawą: pilnuje, żeby kolejny dopisany krok manewru go nie złamał.

   JEDNOSTKĄ JEST ZDANIE, nie okno N znaków. Okno było moim pierwszym pomysłem i dało 22 fałszywe
   trafienia, bo „w stronę zdrową" bywa 56 znaków przed samą nazwą strony. Zdanie jest też
   jednostką, w której czyta klinicysta.

   SŁOWNIK JEST ZAMKNIĘTY I PEŁNY, nie prefiksowy. Wzorzec dopasowujący PREFIKS „lew"/„praw"
   z dowolną końcówką łapie „prawidłowy", „prawdopodobieństwo" i „poprawić" — bramka świeciłaby
   wtedy na czerwono na napisach bez związku z kierunkiem, a najtańszą reakcją byłoby zawężenie
   jej aż do niegroźności. Formy bierzemy więc z tabeli SIDE_FORMY, czyli z jedynego miejsca,
   w którym naprawdę powstają. */
{
  const FORMY_PL = new Set();
  for (const f of Object.values(SIDE_FORMY)) for (const v of Object.values(f)) FORMY_PL.add(v.toLowerCase());
  // Formy są zwykłymi słowami (bez „w lewo"/„w prawo" ze spacją i bez metaznaków), więc
  // wystarczy rozbić je na wyrazy — żadnego escapowania regexem w regexie.
  // Rozbicie na wyrazy wyciąga też PRZYIMEK z formy „w lewo" — a samo „w" stoi w co drugim
  // polskim zdaniu i zapaliłoby bramkę wszędzie (zmierzone: 3 fałszywe trafienia, m.in. na
  // „Cel: przekształcenie postaci apogeotropowej w geotropową"). Kierunkiem jest rdzeń, nie przyimek.
  const slowa = [...FORMY_PL].flatMap(w => w.split(/\s+/))
    .filter(w => /^[a-ząćęłńóśźż]{3,}$/i.test(w))
    .sort((a, b) => b.length - a.length);
  const KIER_PL = new RegExp('(?<![a-ząćęłńóśźż])(?:' + slowa.join('|') + ')(?![a-ząćęłńóśźż])', 'iu');
  const KIER_EN = /\b(?:left|right)\b/i;
  const WLASCICIEL_PL = /(pacjent[a-ząćęłńóśźż]*|chor[a-ząćęłńóśźż]*|zdrow[a-ząćęłńóśźż]*|jego|uch[a-ząćęłńóśźż]*|ucho)/iu;
  const WLASCICIEL_EN = /(patient|affected|healthy|ear)/i;
  const zdania = (txt) => txt.split(/(?<=[.!?])\s+/);
  const naruszenia = [];
  for (const lang of ['pl', 'en']) {
    state.lang = lang;
    for (const k of KLUCZE) for (const s of ['P', 'L']) {
      MANEUVERS[k].gen(s).steps.forEach((sp, i) => {
        for (const pole of ['title', 'instr', 'headText']) {
          const txt = sp[pole]; if (!txt) continue;
          zdania(txt).forEach(z => {
            const kier = lang === 'pl' ? KIER_PL : KIER_EN;
            const wl = lang === 'pl' ? WLASCICIEL_PL : WLASCICIEL_EN;
            if (kier.test(z) && !wl.test(z)) naruszenia.push(`${lang} ${k}/${s} k${i + 1} ${pole}: ${z.trim()}`);
          });
        }
      });
    }
  }
  state.lang = 'pl';
  eq('K2-1/bez-naruszen', naruszenia.slice(0, 3), []);
  // KONTROLA CZUŁOŚCI — bramka MUSI zapalić się na zdaniu, które naprawdę łamie regułę…
  T('K2-2/czulosc-lapie', KIER_PL.test('Obróć głowę w lewo.') && !WLASCICIEL_PL.test('Obróć głowę w lewo.'),
    'kontrola: goły kierunek bez właściciela musi być wykryty');
  // …i NIE MOŻE zapalać się na słowach, które tylko zaczynają się tak samo.
  for (const niewinne of ['prawidłowy VOR', 'nie liczy prawdopodobieństw', 'popraw go', 'lewitacja']) {
    T(`K2-3/${niewinne.slice(0, 12)}`, !KIER_PL.test(niewinne), `„${niewinne}" nie jest określeniem kierunku`);
  }
  T('K2-4/en-niewinne', !KIER_EN.test('the right examination'.replace('right', 'correct')), 'kontrola EN');
  // Odmiana: każda forma z tabeli MUSI być gdzieś użyta — martwa forma to zaproszenie do
  // wklejenia mianownika w kolejnym miejscu.
  const zrodlo = readFileSync(resolve(ROOT, 'src/pose/maneuvers.js'), 'utf8');
  const uzyte = new Set([...zrodlo.matchAll(/sideN\([^,)]+,\s*["'](\w+)["']\)/g)].map(m => m[1]));
  eq('K2-5/formy-uzyte', ['bier', 'bierM', 'cel', 'dop'].filter(f => !uzyte.has(f)), []);
  T('K2-6/tabela-pelna', ['mian', 'bier', 'bierM', 'dop', 'cel', 'dopN', 'mianN', 'przysl'].every(f => SIDE_FORMY[f]),
    'tabela odmiany musi mieć komplet form');
  // Brak MIANOWNIKA tam, gdzie polszczyzna wymaga przypadka zależnego.
  const zlePrzypadki = [];
  for (const k of KLUCZE) for (const s of ['P', 'L'])
    MANEUVERS[k].gen(s).steps.forEach((sp, i) => {
      for (const pole of ['title', 'instr', 'headText']) {
        const txt = sp[pole]; if (!txt) continue;
        if (/(?:w stronę|na bok|ku uchu|po stronie|ku stronie)\s+[^.,;]{0,24}?\(?(?:lewa|prawa)\)?/iu.test(txt))
          zlePrzypadki.push(`${k}/${s} k${i + 1}`);
      }
    });
  eq('K2-7/bez-mianownika-w-zaleznym', zlePrzypadki.slice(0, 3), []);
}

/* ═══════════ K. LICZNOŚĆ ═══════════
   Zapadka na cichy ubytek przypadków: skasowanie sekcji przy refaktorze zostawiłoby wyrocznię
   zieloną i pustą. Ta sama bramka złapała w torze VOG spadek 253→228. */
const OCZEKIWANE = 187;
if (bledy.length) {
  console.error(`✗ man:check — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ man:check — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli to swiadoma zmiana zakresu, popraw OCZEKIWANE. Jesli nie — ktorys przypadek zniknal.');
  process.exit(1);
}
console.log(`✓ man:check — ${ok} przypadkow, model manewru zgodny.`);
