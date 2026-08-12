/* OTOREPO — wyrocznia KRYTERIUM ODBIORU NR 3 (Blok 9): „nietypowy wynik NIE prowadzi
 * automatycznie do manewru repozycyjnego".
 *
 * ═══ DLACZEGO OSOBNA WYROCZNIA, A NIE PRZYPADEK W interp:check ═══
 * `interp:check` bada CZYSTY model w gołym Node — i to jest jego wartość. Ale kryterium nr 3 nie
 * jest twierdzeniem o modelu, tylko o EKRANIE: model może bezbłędnie wołać `nietypowy === true`,
 * a `renderDiag` i tak wypisze „Rozpocznij: Lempert", jeśli bramka stoi w niewłaściwym miejscu.
 * Dokładnie ten błąd znalazła krytyka planu (poprawka F1): plan zakładał, że blok leczenia jest
 * bramkowany przez `poparcie` — nieprawda, `poparcie` bramkuje kartę KLASYFIKACJI, a blok
 * `startManeuver(` to osobne poddrzewo. Dlatego bramka jest tu SKANEM DOM: liczy się to, co
 * naprawdę trafia do `#app.innerHTML`, a nie to, co model twierdzi o sobie.
 *
 * ═══ CZEGO NIE ROBI ═══
 * Nie porównuje się ze złotym wzorcem (to `snapshot:check`) i nie sprawdza wyglądu. Pyta o jedną
 * rzecz: czy przycisk rozpoczynający repozycję istnieje w drzewie, czy nie. Każda bramka ma
 * KONTROLĘ CZUŁOŚCI — stan bliźniaczy, w którym przycisk MUSI być, bo wyrocznia, która przechodzi
 * na wyłączonym renderowaniu, nie pilnuje niczego.
 *
 * Uruchomienie: npm run interp:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };

/* ---- załadowanie aplikacji (ten sam tryb co snapshot.mjs: esbuild IIFE w jsdom) ---- */
const htmlStr = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const { outputFiles } = await esbuild({
  entryPoints: [resolve(ROOT, 'src/main.js')], bundle: true, format: 'iife',
  write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
});
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String(e && (e.detail?.message || e.message) || e)));
const dom = new JSDOM(htmlStr, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8777/', virtualConsole: vc });
const win = dom.window;
{
  const s = win.document.createElement('script');
  s.textContent = outputFiles[0].text;
  win.document.body.appendChild(s);
}
win.requestAnimationFrame = () => 0;
win.cancelAnimationFrame = () => {};

const h = win.__OTOREPO_TEST__;
const POTRZEBNE = ['state', 'render', 'openTest', 'setDiagSide', 'goObs', 'setObsPole', 'oznaczObsPole', 'przyjmijObs', 'goArea',
  'goInterpret', 'przyjmijMechanizm', 'nadpiszMechanizm', 'setVariant'];
const brak = POTRZEBNE.filter(n => !h || !(n in h));
if (errs.length || brak.length) {
  console.error('✗ BŁĄD ŁADOWANIA — wyrocznia nieważna.');
  if (errs.length) console.error('  loadErrors   :', errs.slice(0, 5));
  if (brak.length) console.error('  brak uchwytu :', brak);
  process.exit(1);
}
h.state.lang = 'pl';

/* ---- narzędzia ---- */
const app = () => (win.document.getElementById('app') || {}).innerHTML || '';
const MANEWR = /startManeuver\(/;
const czysty = () => {
  h.state.obs = {}; h.state.obsOdciski = {}; h.state.obsGrupa = null;
  h.state.dixObs = null; h.state.diagCentral = false; h.state.variant = 'canalo';
  // ŹRÓDŁO mechanizmu też musi wracać do zera. Bez tego ZR4/ZR5 przechodziły dzięki temu, że
  // poprzedni blok akurat zostawił `null` — czyli przez KOLEJNOŚĆ bloków w pliku, a nie przez
  // kod aplikacji. Ten sam wyciek Blok 8 zamknął w harnessie golden (`czystyObs`).
  h.state.variantZrodlo = null;
  h.state.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  h.state.decisionSeq = 0;
};
// Zwraca DOM po wykonaniu scenariusza. `render()` jawnie, bo część akcji go nie woła.
const ekran = (fn) => { czysty(); fn(); h.render(); return app(); };

/* Opisy używane wielokrotnie. Składowa PIONOWA jest opisywana także w rollu i bow&leanie —
   bez niej `poparcie` zwraca `brakRoznicownika` i blok leczenia nie renderuje się w ogóle,
   więc kontrola czułości nie miałaby czego kontrolować. Zmierzone przy pisaniu tej wyroczni. */
const rollGeo = () => {
  h.openTest('roll');
  h.setObsPole('roll', 'poziom#prawoWDole', 'p1'); h.setObsPole('roll', 'pion#prawoWDole', 'zero');
  h.setObsPole('roll', 'poziom#lewoWDole', 'm1'); h.setObsPole('roll', 'pion#lewoWDole', 'zero');
  h.setObsPole('roll', 'nasilenie', 'silniejsza');
};
const rollStaly = () => {                       // kierunek NIE odwraca się przy obrocie → flaga f3
  h.openTest('roll');
  h.setObsPole('roll', 'poziom#prawoWDole', 'p1'); h.setObsPole('roll', 'pion#prawoWDole', 'zero');
  h.setObsPole('roll', 'poziom#lewoWDole', 'p1'); h.setObsPole('roll', 'pion#lewoWDole', 'zero');
};
const dixTypowy = () => {
  h.openTest('dix');
  h.setObsPole('dix', 'pion#jedyna', 'p1'); h.setObsPole('dix', 'torsja#jedyna', 'p1');
  h.setObsPole('dix', 'poziom#jedyna', 'zero');
  h.przyjmijObs();
};
const dixSprzeczny = () => {                    // model daje h=0 dla KAŻDEJ kandydatury przy dix
  h.openTest('dix');
  h.setObsPole('dix', 'pion#jedyna', 'p1'); h.setObsPole('dix', 'torsja#jedyna', 'p1');
  h.setObsPole('dix', 'poziom#jedyna', 'p1');
  h.przyjmijObs();
};

/* ============ 1. KRYTERIUM 3 — przycisk manewru znika przy obrazie nietypowym ============ */
{
  const kontrola = ekran(rollGeo);
  T('K3-1/kontrola-czulosci', MANEWR.test(kontrola),
    'przy opisie TYPOWYM przycisk manewru MUSI być — inaczej wyrocznia przechodzi na wyłączonym ekranie');
  const niet = ekran(rollStaly);
  T('K3-2/roll-staly-bez-manewru', !MANEWR.test(niet),
    'roll o kierunku stałym (flaga f3) dalej prowadzi do manewru — to jest naprawiany defekt F1');
  T('K3-3/roll-staly-mowi-dlaczego', /reco--niet/.test(niet),
    'zdjęcie przycisku bez podania powodu uczy klikać dalej');
}
{
  const kontrola = ekran(dixTypowy);
  T('K3-4/dix-kontrola', MANEWR.test(kontrola), 'typowy Dix-Hallpike MUSI prowadzić do manewru');
  const niet = ekran(dixSprzeczny);
  T('K3-5/dix-sprzeczny-bez-manewru', !MANEWR.test(niet),
    'opis sprzeczny z KAŻDĄ kandydaturą nie ma prawa dawać przycisku repozycji');
}

/* ============ 2. KWARANTANNA NIE PRZYWRACA PRZYCISKU (poprawka F2, poziom DOM) ============
   Bez przebiegu kontrolnego w `interpretuj` jeden dotyk na polu, które zapaliło alarm,
   oznaczał je jako niewiarygodne, wnioskowanie znowu miało kandydatury — i przycisk wracał.
   Kwarantanna wycisza WNIOSEK, nigdy OSTRZEŻENIE (zasada Bloku 8). */
{
  const html = ekran(() => {
    dixSprzeczny();
    h.oznaczObsPole('dix', 'poziom#jedyna');    // → niepewne
    h.oznaczObsPole('dix', 'poziom#jedyna');    // → niewiarygodne
  });
  T('KW1/kwarantanna-nie-przywraca', !MANEWR.test(html),
    'oznaczenie cechy jako niewiarygodnej przywróciło przycisk manewru — alarm dał się zgasić dotknięciem');
  T('KW2/nadal-mowi-dlaczego', /reco--niet/.test(html), 'wyciszony wniosek nadal musi nieść powód');
}

/* ============ 3. PAMIĘĆ MIĘDZY PRÓBAMI (poprawka F1, drugie zdanie) ============
   Gdyby `nietypowy` liczył się tylko z bieżącej próby, rada „zrób następną próbę" kasowałaby
   alarm: downbeat opisany w Dix-Hallpike znikałby z pamięci po przełączeniu na roll. */
{
  const html = ekran(() => {
    h.openTest('dix'); h.setObsPole('dix', 'pion#jedyna', 'm1');   // downbeat → flaga ośrodkowa
    rollGeo();                                                      // …i całkiem porządny roll
  });
  T('PA1/alarm-przezywa-zmiane-proby', !MANEWR.test(html),
    'downbeat opisany w Dix-Hallpike musi blokować manewr także na ekranie rolla');
  // KONTROLA: sam poprawny roll, bez wcześniejszego downbeatu, przycisk MA.
  T('PA2/kontrola-czulosci', MANEWR.test(ekran(rollGeo)), 'kontrola: czysty roll prowadzi do manewru');
}

/* ============ 4. SKAN WSZYSTKICH EKRANÓW ŚCIEŻKI DIAGNOSTYCZNEJ ============
   Bramka postawiona przy jednym `recommend()` nie jest dowodem, że drugiego nie ma gdzie indziej.
   Przy stanie NIETYPOWYM przechodzimy ekrany, do których prowadzi ścieżka diagnostyczna, i żaden
   nie ma prawa nieść `startManeuver(`. Ekran `setup` w trybie „Znam kanał i stronę" jest CELOWO
   poza skanem: tam kanał i strona pochodzą od użytkownika, nie z interpretacji próby, a status
   „pominięty Z UZASADNIENIEM" jest przewidziany wprost (flow-model.js). */
{
  const ekrany = [];
  for (const proba of ['dix', 'roll', 'bowlean', 'headhang']) {
    for (const side of ['P', 'L']) {
      const html = ekran(() => {
        h.openTest('dix'); h.setObsPole('dix', 'pion#jedyna', 'm1');   // źródło alarmu
        h.openTest(proba); h.setDiagSide(side);
      });
      ekrany.push([`diag/${proba}/${side}`, html]);
    }
  }
  ekrany.push(['obs', ekran(() => {
    h.openTest('dix'); h.setObsPole('dix', 'pion#jedyna', 'm1'); h.goObs();
  })]);
  const zle = ekrany.filter(([, html]) => MANEWR.test(html)).map(([tag]) => tag);
  T('SK1/zaden-ekran-nie-prowadzi-do-manewru', zle.length === 0,
    `ekrany z przyciskiem repozycji mimo obrazu nietypowego: ${zle.join(', ')}`);
  T('SK1b/zakres', ekrany.length === 9, `spodziewano się 9 ekranów, zeskanowano ${ekrany.length}`);
}

/* ============ 5. OBRAZ OŚRODKOWY MA WŁASNY, MOCNIEJSZY KOMUNIKAT ============
   `nietypowy` obejmuje też `diagCentral`, ale karta CPN mówi więcej (MRI tylnego dołu), więc to
   ONA ma pierwszeństwo. Wspólny jest tylko wniosek: żadnego przycisku repozycji. */
{
  const html = ekran(() => { dixTypowy(); h.toggleDiagCentral(true); });
  T('CPN1/bez-manewru', !MANEWR.test(html), 'obraz ośrodkowy nie może prowadzić do repozycji');
  T('CPN2/wlasny-komunikat', !/reco--niet/.test(html) && /MRI/.test(html),
    'karta CPN mówi więcej niż karta „obraz nietypowy" i nie może być przez nią zastąpiona');
}

/* ============ 6. ODCISK OPISU W WEJŚCIACH DECYZYJNYCH (poprawka F3, poziom aplikacji) ============
   Model przebiegu dostaje odcisk z `state.obsOdciski`; liczy go obs-state.js. Tu sprawdzamy, że
   pisarz naprawdę go liczy i że kasowanie opisu naprawdę go zmienia — flow:check bada regułę,
   ale karmi ją wartościami wpisanymi ręcznie. */
{
  czysty();
  h.openTest('dix'); h.setObsPole('dix', 'pion#jedyna', 'p1');
  const po = (h.state.obsOdciski || {}).dix;
  T('OD-A/pisarz-liczy-odcisk', typeof po === 'string' && po.includes('pion#jedyna=p1'),
    `obs-state musi zapisać odcisk, jest ${JSON.stringify(po)}`);
  h.wyczyscObs ? h.wyczyscObs() : h.setObsPole('dix', 'pion#jedyna', 'p1');
  const poKasowaniu = (h.state.obsOdciski || {}).dix;
  T('OD-B/kasowanie-zmienia-odcisk', poKasowaniu !== po,
    'skasowanie opisu MUSI ruszyć odcisk — inaczej alarm o utracie podstawy nigdy nie wstanie');
  // Pole wagi 1 nie może ruszać odcisku: alarm przy dopisywaniu warunków byłby czystym szumem.
  czysty();
  h.openTest('dix'); h.setObsPole('dix', 'pion#jedyna', 'p1');
  const przed = (h.state.obsOdciski || {}).dix;
  h.setObsPole('dix', 'fiksacja', 'nieTlumil');
  T('OD-C/pole-wagi-1-nie-alarmuje', (h.state.obsOdciski || {}).dix === przed,
    'pole wagi 1 (fiksacja) ruszyło odcisk — to byłby fałszywy alarm przy każdym dopisku');
}

/* ============ 6b. KRYTERIUM ODBIORU NR 2 — PUSTY OPIS NIE DAJE ROZPOZNANIA ============
   „Brak wystarczających danych NIE jest przedstawiany jako pewne rozpoznanie". Blok 8 wyegzekwował
   to WYŁĄCZNIE przy Dix-Hallpike'u: ustępstwo `proba!=="dix" → czesciowe` było wtedy uczciwe, bo
   przy pozostałych próbach nie istniało ani jedno pole do wypełnienia. Formularz Bloku 8 objął
   wszystkie cztery próby i przesłanka wygasła, a ustępstwo zostało — wejście na ekran rolla bez
   jednego dotknięcia dawało podtyp, stronę chorą i gotowy przycisk repozycji. */
{
  const zle = [];
  for (const proba of ['dix', 'roll', 'bowlean', 'headhang']) {
    const html = ekran(() => { h.openTest(proba); h.setDiagSide('P'); });
    if (MANEWR.test(html)) zle.push(proba);
  }
  T('K2-1/pusty-opis-bez-manewru', zle.length === 0,
    `próby dające przycisk repozycji bez ŻADNEGO opisu: ${zle.join(', ')}`);
  T('K2-2/mowi-czego-brakuje', /obsbrak/.test(ekran(() => { h.openTest('roll'); h.setDiagSide('P'); })),
    'brak opisu musi być nazwany, a nie tylko pusty');
  // KONTROLA CZUŁOŚCI: opis, który wystarcza, przywraca przycisk — bramka nie może być „zawsze nie".
  T('K2-3/kontrola-czulosci', MANEWR.test(ekran(rollGeo)),
    'kontrola: pełny opis rolla MUSI prowadzić do manewru');
}

/* ============ 6c. ŹRÓDŁO MECHANIZMU (poprawka P2) ============
   `state.variant` steruje animacją, chipami cech, klasyfikacją Bárány i doborem manewru — i do
   Bloku 9 wyglądał identycznie w trzech zupełnie różnych sytuacjach: wyprowadzony z opisu,
   ustawiony ręcznie i „został z poprzedniego ekranu, bo animacja musi coś rysować". Ta ostatnia
   jest groźna, bo udaje wniosek. Zapis idzie ZA JAWNYM GESTEM: `przyjmijMechanizm` liczy warunek
   jeszcze raz sam, więc przycisk nieaktualny o jeden render nie może przepchnąć zapisu. */
const dixPelny = () => {
  dixTypowy();
  h.setObsPole('dix', 'latencja', '1-5s');
  h.setObsPole('dix', 'czasTrwania', 'ponizej1min');
  h.setObsPole('dix', 'meczliwosc', 'slabnie');
};
{
  czysty(); dixPelny(); h.goInterpret();
  T('ZR1/domyslnie-hipoteza', h.state.variantZrodlo == null, 'świeży stan nie może twierdzić, że mechanizm skądś wynika');
  h.przyjmijMechanizm();
  T('ZR2/gest-wyprowadza', h.state.variantZrodlo === 'wyprowadzony' && h.state.variant === 'canalo',
    `po jawnym geście mechanizm ma być wyprowadzony, jest ${h.state.variantZrodlo}/${h.state.variant}`);
  // Dopisanie cechy unieważnia wyprowadzenie: powstało z INNEGO opisu niż ten, który jest teraz.
  h.setObsPole('dix', 'przebieg', 'narastaWygasa');
  T('ZR3/zmiana-opisu-zdejmuje-wyprowadzenie', h.state.variantZrodlo == null,
    'wyprowadzenie przeżyło zmianę opisu, z którego powstało');
  T('ZR3b/mechanizm-zostaje', h.state.variant === 'canalo',
    'sam mechanizm ma ZOSTAĆ — animacja musi coś rysować; znika tylko twierdzenie o jego źródle');
}
{
  // Sam kierunek przy dix NIE różnicuje mechanizmu → gest nie ma prawa niczego zapisać.
  czysty(); dixTypowy(); h.goInterpret();
  h.przyjmijMechanizm();
  T('ZR4/bez-podstawy-brak-zapisu', h.state.variantZrodlo == null,
    'przy dix sam kierunek nie rozstrzyga mechanizmu — gest musi być bezskuteczny');
  // …i tak samo przy opisie sprzecznym z każdą kandydaturą.
  czysty(); dixSprzeczny(); h.goInterpret();
  h.przyjmijMechanizm();
  T('ZR5/sprzeczny-brak-zapisu', h.state.variantZrodlo == null,
    'opis sprzeczny ze wszystkim nie może wyprowadzać mechanizmu');
}
{
  // Ręczne nadpisanie jest ŚWIADOMĄ decyzją i NIE znika przez to, że ktoś dopisał cechę.
  czysty(); dixPelny(); h.goInterpret();
  h.nadpiszMechanizm('cupulo');
  T('ZR6/nadpisanie', h.state.variantZrodlo === 'nadpisany' && h.state.variant === 'cupulo', 'ręczny wybór mechanizmu');
  h.setObsPole('dix', 'przebieg', 'narastaWygasa');
  T('ZR7/nadpisanie-przezywa', h.state.variantZrodlo === 'nadpisany',
    'ręczna decyzja nie może znikać przez dopisanie cechy — to nie ona się zdezaktualizowała');
  // Przewrócenie karty mechanizmu na ekranie PRÓBY idzie tą samą drogą (setVariant) i też
  // musi oznaczyć źródło jako ręczne — inaczej ekran interpretacji twierdziłby „wyprowadzony"
  // nad mechanizmem, który użytkownik przed chwilą przestawił sam.
  czysty(); dixPelny(); h.goInterpret(); h.przyjmijMechanizm();
  h.setVariant('cupulo');
  T('ZR8/flip-na-ekranie-proby', h.state.variantZrodlo === 'nadpisany',
    'zmiana mechanizmu na ekranie próby zostawiała etykietę „wyprowadzony" — czyli kłamstwo o źródle');
}
{
  // Ekran interpretacji jest krokiem PRZED manewrem i nie ma prawa go rozpoczynać.
  const html = ekran(() => { dixPelny(); h.goInterpret(); });
  T('ZR9/interpretacja-nie-rozpoczyna-manewru', !MANEWR.test(html),
    'ekran interpretacji nie może nieść przycisku rozpoczynającego repozycję');
  T('ZR10/mowi-co-wynika', /iwynik/.test(html) && /ikand/.test(html), 'ekran musi pokazać, co z opisu wynika');
}

/* ============ 7. ARKUSZ, KTÓREGO NIKT NIE WPIĄŁ ============
   Znalezione przy pisaniu tej wyroczni: `src/styles/obs.css` (ponad 200 wierszy napisanych
   w Bloku 8) nie był importowany NIGDZIE — cały ekran „Oczopląs" renderował się bez stylów,
   przy komplecie zielonych wyroczni. Żadna z nich nie mogła tego zobaczyć: `domOracle` czyta
   `#app.innerHTML`, a nie kaskadę; jsdom nie liczy stylów; wyrocznie modeli są czyste.
   Bramka jest strukturalna, nie wizualna: KAŻDY plik z `src/styles/` musi być zaimportowany
   w `index.css`, bo `index.css` jest jedynym arkuszem wpinanym z `index.html`. */
{
  const fs = await import('node:fs');
  const dir = resolve(ROOT, 'src', 'styles');
  const pliki = fs.readdirSync(dir).filter(f => f.endsWith('.css') && f !== 'index.css');
  const indeks = fs.readFileSync(resolve(dir, 'index.css'), 'utf8');
  const sieroty = pliki.filter(f => !new RegExp(`@import\\s+['"]\\./${f.replace('.', '\\.')}['"]`).test(indeks));
  T('CSS1/brak-sierot', sieroty.length === 0, `arkusze nieobecne w index.css: ${sieroty.join(', ')}`);
  T('CSS2/kontrola-skanu', !/@import\s+['"]\.\/nieistnieje\.css['"]/.test(indeks),
    'kontrola: skaner nie może zgłaszać jako wpiętego arkusza, którego nie ma');
  T('CSS3/zakres', pliki.length >= 10, `spodziewano się co najmniej 10 arkuszy, jest ${pliki.length}`);
}

/* ============ 7b. TON, KTÓRY SPADŁ NA DOMYŚLNY ============
   Ta sama rodzina błędu co §7, o stopień subtelniejsza. Arkusze „sceny klinicznej" nadają ton
   przez selektor złożony z IDENTYFIKATORA MODELU: `[data-fuwynik="konwersja"]`,
   `.nfeed--bledna`, `.nwynik--zBledami`. Nazwa w modelu może się zmienić albo dojść nowa —
   i wtedy selektor przestaje trafiać BEZ ŚLADU: `--tone` spada na `:root{--tone:var(--primary)}`
   z clinic-scene.css, więc karta nie znika i nie brzydnie, tylko robi się cyjanowa, czyli
   w tej aplikacji znaczy „akcja". Wynik „badanie niewiarygodne" wyglądałby wtedy jak zachęta.

   Zmierzone przy wdrażaniu tury 3: paczka projektowa celowała w `bezZmian`, `zmianaKierunku`,
   `nkafel--bezbledu`, `nfeed--trafne`, `nwynik--zewskazowka` — ANI JEDEN z tych identyfikatorów
   nie istnieje w modelu. Bramka jest po to, żeby drugi raz nie trzeba było tego szukać ręcznie. */
{
  const fs = await import('node:fs');
  const arkusz = fs.readFileSync(resolve(ROOT, 'src', 'styles', 'rest-scene.css'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '');                      // komentarze NIE liczą się jako reguła
  const { WYNIK_IDS } = await import('../src/app/followup-model.js');
  const { OCENY, WERDYKT_IDS } = await import('../src/app/nauka-model.js');

  const brak = WYNIK_IDS.filter(id => !arkusz.includes(`[data-fuwynik="${id}"]`));
  T('CSS4/kontrola-tony-wynikow', brak.length === 0,
    `wyniki kontroli bez reguły tonu w rest-scene.css: ${brak.join(', ')}`);
  T('CSS4b/kontrola-czulosci', !arkusz.includes('[data-fuwynik="niemaTakiegoWyniku"]'),
    'kontrola: skaner nie może uznać za obecną reguły, której nie ma');

  const oceny = Object.keys(OCENY);
  const brakKafli = oceny.filter(o => !arkusz.includes(`.nkafel--${o}`));
  const brakWynikow = oceny.filter(o => !arkusz.includes(`.nwynik--${o}`));
  T('CSS5/nauka-oceny-kafla', brakKafli.length === 0, `oceny bez reguły .nkafel--*: ${brakKafli.join(', ')}`);
  T('CSS6/nauka-oceny-wyniku', brakWynikow.length === 0, `oceny bez reguły .nwynik--*: ${brakWynikow.join(', ')}`);

  const brakWerdyktow = WERDYKT_IDS.filter(w => !arkusz.includes(`.nfeed--${w}`));
  T('CSS7/nauka-werdykty', brakWerdyktow.length === 0, `werdykty bez reguły .nfeed--*: ${brakWerdyktow.join(', ')}`);

  /* Renderer składa `nkafel--${ocena||'nowy'}` — „nowy" nie jest oceną ze słownika, więc żadna
     pętla po OCENY go nie złapie, a to jest stan startowy KAŻDEGO przypadku w bibliotece. */
  T('CSS8/nauka-kafel-nowy', arkusz.includes('.nkafel--nowy'),
    'brak reguły .nkafel--nowy — nietknięty przypadek jest stanem domyślnym biblioteki');
}

/* ============ Wynik ============ */
const razem = ok + bledy.length;
console.log('\nOTOREPO — kryterium 3 na poziomie DOM (Blok 9)');
console.log(`przypadki    : ${razem}`);
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
const OCZEKIWANE = 39;   /* 33 + 6 bramek §7b (tony wyników kontroli i ocen/werdyktów nauki) */
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — obraz nietypowy nigdzie nie prowadzi do manewru (${razem} przypadków).`);
