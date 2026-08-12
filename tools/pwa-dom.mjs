/* OTOREPO — WYROCZNIA PWA NA PRAWDZIWYM GRAFIE MODUŁÓW (Blok 16). jsdom.
 *
 * `pwa:check` mierzy MODEL (czy polityka jest poprawna) i szablon workera. Tutaj sprawdzamy to,
 * czego w czystym Node sprawdzić się nie da:
 *   1. czy adapter przeglądarki naprawdę rejestruje workera, wykrywa CZEKAJĄCĄ wersję i nie
 *      zawraca głowy przy pierwszej instalacji (sztuczny `navigator.serviceWorker` — wiadomości
 *      do workera są MIERZONE, a nie zakładane);
 *   2. czy „zaktualizuj teraz" naprawdę odmawia w trakcie manewru i naprawdę wysyła prośbę po
 *      zakończeniu sesji (kryterium odbioru nr 3);
 *   3. czy skróty klawiaturowe działają na PRAWDZIWYM ekranie manewru i naprawdę stają z drogi
 *      prawdziwemu suwakowi fazy, prawdziwemu przyciskowi i prawdziwemu polu tekstowemu;
 *   4. czy jedyne pole tekstowe w aplikacji ma co najmniej 16 px (zoom formularza na iOS) i czy
 *      nikt nie zablokował powiększania w meta viewport.
 *
 * Uruchomienie: npm run pwa:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';
import { komunikatSieci, SKROTY } from '../src/app/pwa-model.js';
import { POLA_AKTUALIZACJI } from '../src/app/pwa-state.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

/* ---- sztuczny service worker: wszystko, czego dotyka src/runtime/pwa.js ---- */
const wiadomosci = [];
const rejestracje = [];
const worker = { state: 'installing', _s: {}, addEventListener: (t, f) => { (worker._s[t] = worker._s[t] || []).push(f); },
                 postMessage: (m) => wiadomosci.push(m) };
const reg = { waiting: null, installing: null, _s: {}, _update: 0,
              addEventListener: (t, f) => { (reg._s[t] = reg._s[t] || []).push(f); },
              update: () => { reg._update++; } };
const swKontener = { controller: { scriptURL: 'sw.js' }, _s: {},
                     register: (u) => { rejestracje.push(u); return Promise.resolve(reg); },
                     addEventListener: (t, f) => { (swKontener._s[t] = swKontener._s[t] || []).push(f); } };
// Nowa wersja zainstalowała się i CZEKA — dokładnie ta sekwencja zdarzeń, którą wysyła przeglądarka.
const nowaWersjaCzeka = () => {
  reg.installing = worker;
  (reg._s.updatefound || []).forEach(f => f());
  worker.state = 'installed';
  (worker._s.statechange || []).forEach(f => f());
  reg.waiting = worker;
};

const { outputFiles } = await esbuild({
  entryPoints: [resolve(ROOT, 'src/main.js')], bundle: true, format: 'iife',
  write: false, platform: 'browser', target: 'es2020', logLevel: 'silent',
});
const errs = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errs.push(String((e && (e.detail && e.detail.message || e.message)) || e)));
const dom = new JSDOM(readFileSync(resolve(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8777/', virtualConsole: vc });
const win = dom.window;
win.requestAnimationFrame = () => 0; win.cancelAnimationFrame = () => {};
// PRZED bootem — adapter rejestruje workera w czasie wykonania modułu main.js.
Object.defineProperty(win.navigator, 'serviceWorker', { value: swKontener, configurable: true });
{ const s = win.document.createElement('script'); s.textContent = outputFiles[0].text; win.document.body.appendChild(s); }
await new Promise(r => setTimeout(r, 0));   // register() rozwiązuje się w mikrozadaniu

const H = win.__OTOREPO_TEST__;
const POTRZEBNE = ['state', 'render', 'aktualizacjaCzeka', 'schowajAktualizacje', 'wdrozAktualizacjeTeraz',
  'obsluzKlawisz', 'syncAktualizacja', 'pickCanal', 'pickSide', 'openMan', 'goStep', 'goOpis', 'edytujOpis',
  'goArea', 'zakonczSesje', 'openTest', 'setDiagSide', 'goObs', 'setObsPole', 'goKontrola'];
const brak = POTRZEBNE.filter(n => !H || typeof H[n] === 'undefined');
if (errs.length || brak.length) {
  console.error('✗ BLAD LADOWANIA — wyrocznia niewazna.');
  if (errs.length) console.error('  loadErrors   :', errs.slice(0, 5));
  if (brak.length) console.error('  brak uchwytu :', brak);
  process.exit(1);
}
const st = H.state;
// Przez setLangUI, a nie przez podmianę pola: to jedyna droga, która przebudowuje CHROM (arkusz
// ustawień składa się raz, więc zmiana samego `state.lang` zostawiłaby ustawienia po angielsku).
win.setLangUI('pl');
const doc = win.document;
const pasek = () => doc.getElementById('updbar');
const widoczny = () => !!pasek() && !pasek().hidden;
const tekst = (sel) => { const e = pasek() && pasek().querySelector(sel); return e ? e.textContent : null; };
const przycisk = (sel) => (pasek() ? pasek().querySelector(sel) : null);
const czysty = () => { st.aktualizacja = 'brak'; st.aktualizacjaSchowana = false; wiadomosci.length = 0; H.syncAktualizacja(); };

/* ═══════════ A. PASEK JEST CHROMEM, A NIE TREŚCIĄ ═══════════ */
{
  T('A1/istnieje', !!pasek(), 'brak #updbar w powłoce');
  T('A2/domyslnie-ukryty', pasek().hidden === true, 'pasek nowej wersji widać bez nowej wersji');
  T('A3/poza-app', !doc.getElementById('app').contains(pasek()), 'pasek siedzi w #app — zmieniłby złoty wzorzec DOM');
  T('A4/poza-shell', !doc.getElementById('shell').contains(pasek()),
     'pasek siedzi w #shell — zmieniłby wszystkie 20 przypiętych stanów powłoki, choć nic w nich nie zaszło');
  T('A5/role-status', pasek().getAttribute('role') === 'status', 'pasek nie ogłasza się czytnikowi ekranu');
  T('A6/nie-modalny', pasek().getAttribute('aria-modal') !== 'true', 'komunikat o aktualizacji zabiera ekran');
  eq('A7/pola-stanu', POLA_AKTUALIZACJI, ['aktualizacja', 'aktualizacjaSchowana']);
}

/* ═══════════ B. REJESTRACJA I WYKRYCIE CZEKAJĄCEJ WERSJI ═══════════ */
{
  eq('B1/zarejestrowano', rejestracje, ['sw.js']);
  T('B2/nasluch-controllerchange', (swKontener._s.controllerchange || []).length === 1,
     'adapter nie słucha przejęcia karty — po wdrożeniu strona nie przeładowałaby się nigdy');
  T('B3/nasluch-updatefound', (reg._s.updatefound || []).length === 1, 'adapter nie słucha nowej wersji');
  T('B4/na-starcie-brak', st.aktualizacja === 'brak', 'sama rejestracja zgłasza aktualizację');
  T('B5/pasek-milczy', !widoczny(), 'pasek pokazuje się bez nowej wersji');

  nowaWersjaCzeka();
  eq('B6/stan-czeka', st.aktualizacja, 'czeka');
  T('B7/pasek-widoczny', widoczny(), 'czekająca wersja nie jest komunikowana (kryterium odbioru nr 3)');
  T('B8/tytul', (tekst('[data-upd-tytul]') || '').length > 10, 'pasek nie ma tytułu');
  T('B9/tresc', /zakonczeniu sesji|zakończeniu sesji/i.test(tekst('[data-upd-tresc]') || ''),
     `treść nie mówi o zakończeniu sesji: ${tekst('[data-upd-tresc]')}`);
  T('B10/przycisk-widoczny', !przycisk('[data-upd-teraz]').hidden, 'brak przycisku wdrożenia przy czystym stanie');
  T('B11/nie-teraz-widoczny', !przycisk('[data-upd-pozniej]').hidden, 'brak możliwości schowania paska');
  T('B12/bez-blokady', pasek().getAttribute('data-blokada') === '', 'pasek melduje blokadę bez manewru');

  // Język: pasek jest chromem, a chrom bywa zamrożony po polsku.
  st.lang = 'en'; H.syncAktualizacja();
  const en = tekst('[data-upd-tytul]');
  st.lang = 'pl'; H.syncAktualizacja();
  const pl = tekst('[data-upd-tytul]');
  T('B13/dwujezyczny', en !== pl && /version/i.test(en) && /wersja/i.test(pl), `PL="${pl}" EN="${en}"`);
}

/* ═══════════ C. „NIE TERAZ" CHOWA PASEK, ALE NIE ODWOŁUJE AKTUALIZACJI ═══════════ */
{
  H.schowajAktualizacje();
  T('C1/schowany', !widoczny(), '„Nie teraz" nie chowa paska');
  eq('C2/stan-nadal-czeka', st.aktualizacja, 'czeka');
  st.aktualizacjaSchowana = false; H.syncAktualizacja();
  T('C3/wraca', widoczny(), 'pasek nie wraca po cofnięciu schowania');
}

/* ═══════════ D. TRWAJĄCY MANEWR — ZAKAZ, KTÓREGO NIE ZDEJMUJE ŻYCZENIE ═══════════ */
{
  wiadomosci.length = 0;
  H.pickCanal('posterior'); H.pickSide('P'); H.openMan('epley'); H.render();
  H.goStep(1);                              // pacjent jest już w pozycji
  H.syncAktualizacja();
  eq('D1/ekran', st.screen, 'guide');
  T('D2/pasek-widoczny', widoczny(), 'w trakcie manewru pasek milczy zamiast obiecać, że nie przerwie');
  eq('D3/blokada-w-atrybucie', pasek().getAttribute('data-blokada'), 'manewrWToku');
  T('D4/bez-przycisku', przycisk('[data-upd-teraz]').hidden === true, 'w trakcie manewru jest przycisk wdrożenia');
  T('D5/tresc-o-manewrze', /manewr/i.test(tekst('[data-upd-tresc]') || ''), 'treść nie tłumaczy, dlaczego czekamy');

  const r = H.wdrozAktualizacjeTeraz();
  T('D6/odmowa', r && r.ok === false, 'wdrożenie w trakcie manewru zostało wykonane');
  eq('D7/powod-odmowy', r && r.powod, 'manewrWToku');
  eq('D8/worker-nietkniety', wiadomosci, []);
  eq('D9/stan-nadal-czeka', st.aktualizacja, 'czeka');

  // Kontrola czułości: ten sam ekran, ale licznik stoi i etap jest zerowy → to jeszcze podgląd.
  H.goStep(0); st.running = false; H.syncAktualizacja();
  T('D10/podglad-nie-blokuje', przycisk('[data-upd-teraz]').hidden === false,
     'sam widok manewru na etapie 0 blokuje wdrożenie — blokada byłaby wtedy o ekranie, a nie o pacjencie');
}

/* ═══════════ E. OTWARTY PRZYPADEK — ŚWIADOMA STRATA, NIE CICHA ═══════════ */
{
  H.goArea('diag');
  H.openTest('dix'); H.setDiagSide('P'); H.goObs();
  H.setObsPole('dix', 'wystapil', 'tak');
  H.syncAktualizacja();
  eq('E1/ostrzezenie', pasek().getAttribute('data-ostrzezenie'), 'przypadekPrzepadnie');
  T('E2/tresc-o-utracie', /skasuje|przypad/i.test(tekst('[data-upd-tresc]') || ''), 'pasek nie mówi, co użytkownik straci');
  T('E3/mimo-to-mozna', przycisk('[data-upd-teraz]').hidden === false, 'świadome wdrożenie stało się niemożliwe');

  wiadomosci.length = 0;
  reg.waiting = worker;
  const r = H.wdrozAktualizacjeTeraz();
  T('E4/wdrozone-na-zyczenie', r && r.ok === true, 'świadome wdrożenie odmówiło');
  eq('E5/prosba-do-workera', wiadomosci, [{ typ: 'OTOREPO_WDROZ' }]);
  eq('E6/stan-wdrazana', st.aktualizacja, 'wdrazana');
  T('E7/pasek-o-wdrazaniu', /Wdraz|Wdraż/i.test(tekst('[data-upd-tresc]') || ''), 'pasek nie mówi, że trwa wdrażanie');
}

/* ═══════════ F. KRYTERIUM ODBIORU NR 3 — WDROŻENIE PO ZAKOŃCZENIU SESJI ═══════════ */
{
  // Pełny przebieg, tak jak u użytkownika: przypadek istnieje, więc automat NIE MOŻE wejść.
  czysty();
  H.goArea('diag'); H.openTest('dix'); H.setDiagSide('P'); H.goObs();
  H.setObsPole('dix', 'wystapil', 'tak');
  H.setObsPole('dix', 'pion#jedyna', 'p1'); H.setObsPole('dix', 'torsja#jedyna', 'p1');
  st.aktualizacja = 'czeka'; H.syncAktualizacja();
  wiadomosci.length = 0; reg.waiting = worker;
  T('F1/przypadek-wstrzymuje', wiadomosci.length === 0, 'aktualizacja weszła sama, mimo otwartego przypadku');

  H.zakonczSesje();
  eq('F2/wdrozone-po-sesji', wiadomosci, [{ typ: 'OTOREPO_WDROZ' }]);
  eq('F3/ekran-startowy', st.screen, 'start');

  // Kontrola czułości: bez czekającej wersji zakończenie sesji nie wysyła NICZEGO.
  czysty();
  wiadomosci.length = 0;
  H.zakonczSesje();
  eq('F4/bez-aktualizacji-cisza', wiadomosci, []);
}

/* ═══════════ G. SKRÓTY NA PRAWDZIWYM EKRANIE MANEWRU ═══════════ */
{
  czysty();
  H.pickCanal('posterior'); H.pickSide('P'); H.openMan('epley'); H.render();
  // Etap 1, a nie 0: pierwszy etap Epleya jest BEZ odliczania („wykonaj płynnie"), więc nie ma na
  // nim ani licznika, ani suwaka — testy skrótów mierzyłyby wtedy pustą stronę.
  H.goStep(1);
  eq('G1/ekran-manewru', st.screen, 'guide');
  const klaw = (key, cel, nad = {}) => {
    const el = cel || doc.body;
    el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...nad }));
  };

  const przedRun = st.running;
  klaw(' ');
  T('G2/spacja-przelacza', st.running !== przedRun, 'spacja nie uruchamia licznika na ekranie manewru');
  klaw(' ');
  T('G3/spacja-wraca', st.running === przedRun, 'druga spacja nie zatrzymuje licznika');

  const krok0 = st.step;
  klaw('ArrowRight');
  T('G4/strzalka-dalej', st.step === krok0 + 1, `strzałka w prawo nie zmieniła etapu (${krok0} → ${st.step})`);
  klaw('ArrowLeft');
  T('G5/strzalka-wstecz', st.step === krok0, 'strzałka w lewo nie cofnęła etapu');

  // PRAWDZIWY suwak fazy: strzałka należy do niego, bo inaczej czas utrzymania pozycji staje się
  // nieustawialny z klawiatury (Blok 2 dokładał tę obsługę świadomie).
  const suwak = doc.querySelector('#track');
  T('G6/suwak-istnieje', !!suwak, 'na ekranie manewru nie ma suwaka fazy — test poniżej byłby pusty');
  const krokPrzedSuwakiem = st.step;
  klaw('ArrowRight', suwak);
  T('G7/suwak-nie-zmienia-etapu', st.step === krokPrzedSuwakiem, 'strzałka w suwaku przestawiła ETAP manewru');
  const dSuwak = H.obsluzKlawisz({ key: 'ArrowRight', target: suwak, preventDefault() {} });
  eq('G8/powod-suwak', dSuwak && dSuwak.powod, 'kontrolka');

  // PRAWDZIWY przycisk Start/Pauza: spacja ma go WCISNĄĆ (przeglądarka), a nie iść do skrótu.
  const btn = doc.querySelector('#btnGo');
  T('G9/przycisk-istnieje', !!btn, 'na ekranie manewru nie ma przycisku Start');
  const dBtn = H.obsluzKlawisz({ key: ' ', target: btn, preventDefault() {} });
  eq('G10/powod-przycisk', dBtn && dBtn.powod, 'kontrolka');

  // PRAWDZIWE pole tekstowe (jedyne w aplikacji, Blok 15): spacja ma PISAĆ.
  H.goOpis(); H.edytujOpis();
  const pole = doc.querySelector('textarea');
  T('G11/pole-istnieje', !!pole, 'po geście „Edytuj" nie ma pola tekstowego');
  const ekranOpisu = st.screen;
  st.screen = 'guide';                       // mierzymy ADAPTER, nie regułę „inny ekran"
  const dPole = H.obsluzKlawisz({ key: ' ', target: pole, preventDefault() {} });
  st.screen = ekranOpisu;
  eq('G12/powod-pole', dPole && dPole.powod, 'poleTekstowe');
  // Na ekranie opisu skrót nie ma prawa działać w ogóle.
  const dOpis = H.obsluzKlawisz({ key: ' ', target: doc.body, preventDefault() {} });
  eq('G13/powod-inny-ekran', dOpis && dOpis.powod, 'innyEkran');

  // preventDefault TYLKO wtedy, gdy skrót naprawdę zadziałał — inaczej spacja przestaje
  // przewijać stronę na wszystkich pozostałych ekranach.
  let blokowane = 0;
  const dNic = H.obsluzKlawisz({ key: ' ', target: doc.body, preventDefault() { blokowane++; } });
  T('G14/bez-akcji-bez-blokady', blokowane === 0 && !!dNic.powod, 'skrót zablokował klawisz, choć odmówił działania');
  H.goArea('start');
}

/* ═══════════ H. ZOOM FORMULARZA I POWIĘKSZANIE (kolumna „Telefon") ═══════════ */
{
  /* Mierzymy KASKADĘ, a nie pierwszą pasującą regułę: pole dziedziczy rozmiar ze wspólnej reguły
     podglądu i edycji, a własna reguła go nadpisuje. Bramka szukająca pierwszego `font-size`
     zgłaszałaby 14 px także wtedy, gdy pole naprawdę ma 16 — i odwrotnie, mogłaby przeoczyć
     nadpisanie w drugą stronę. Przy równej specyficzności decyduje OSTATNIA deklaracja. */
  const css = readFileSync(resolve(ROOT, 'src/styles/opis.css'), 'utf8');
  const rozmiarPola = (tekstCss) => {
    let wynik = null;
    // Komentarze USUWAMY, bo inaczej sklejają się z selektorem następnej reguły i reguła znika
    // z pomiaru — bramka pokazywałaby wtedy rozmiar sprzed nadpisania.
    const bezKom = tekstCss.replace(/\/\*[\s\S]*?\*\//g, ' ');
    for (const m of bezKom.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!m[1].split(',').some(sel => sel.trim() === '.opispodglad__e')) continue;
      const fs = m[2].match(/font-size:\s*([0-9.]+)rem/);
      if (fs) wynik = parseFloat(fs[1]);
    }
    return wynik;
  };
  const rozmiar = rozmiarPola(css);
  T('H1/regula-istnieje', rozmiar !== null, 'żadna reguła nie ustala rozmiaru pisma pola edycji opisu');
  T('H2/pole-16px', rozmiar !== null && rozmiar >= 1,
     `pole tekstowe ma ${rozmiar}rem — iOS powiększy widok przy wejściu w pole`);
  // Kontrola czułości w OBIE strony: stara treść MUSI zapalić, nowa NIE MOŻE.
  T('H3/czulosc-stara', rozmiarPola('.opispodglad__t, .opispodglad__e { font-size: .875rem; }') < 1,
     'bramka rozmiaru pola nie wykrywa starych 14 px');
  T('H3b/czulosc-nadpisanie', rozmiarPola('.opispodglad__t, .opispodglad__e { font-size: .875rem; }\n.opispodglad__e { font-size: 1rem; }') === 1,
     'bramka nie widzi nadpisania rozmiaru w dalszej regule — mierzyłaby pierwszą, a nie obowiązującą');

  const vp = doc.querySelector('meta[name="viewport"]');
  T('H4/viewport', !!vp, 'brak meta viewport');
  T('H5/powiekszanie-dozwolone', !/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(vp.getAttribute('content') || ''),
     'blokada zoomu formularzy została zrobiona przez ZAKAZ powiększania — to odbiera powiększanie także tym, którzy go potrzebują');
  T('H6/viewport-fit', /viewport-fit=cover/.test(vp.getAttribute('content') || ''), 'brak viewport-fit=cover (obszary bezpieczne)');

  // Pole tekstowe jest nadal DOKŁADNIE JEDNO — bramka Bloku 15 nie może zwietrzeć.
  H.goOpis();
  const przedEdycja = doc.querySelectorAll('#app textarea, #app input[type="text"]').length;
  H.edytujOpis();
  const poEdycji = doc.querySelectorAll('#app textarea, #app input[type="text"]').length;
  eq('H7/pol-przed-gestem', przedEdycja, 0);
  eq('H8/pol-po-gescie', poEdycji, 1);
  H.goArea('start');
}

/* ═══════════ I. „KTÓRE TREŚCI WYMAGAJĄ POŁĄCZENIA" — W USTAWIENIACH ═══════════ */
{
  const sheet = doc.getElementById('sheet');
  T('I1/arkusz', !!sheet && sheet.innerHTML.length > 100, 'arkusz ustawień jest pusty');
  const nota = sheet.querySelector('[data-siec]');
  T('I2/nota-o-sieci', !!nota, 'ustawienia nie mówią, które treści wymagają połączenia');
  const oczekiwana = komunikatSieci().pl;
  eq('I3/nota-z-modelu', nota.textContent, oczekiwana);
  T('I4/nota-nie-obiecuje-wiecej', /wlasne pliki|własne pliki/.test(nota.textContent),
     'zdanie o offline pomija to, że worker pobiera z sieci własne pliki aplikacji');
  const skroty = sheet.querySelector('[data-skroty]');
  T('I5/skroty-opisane', !!skroty && /spacja/i.test(skroty.textContent), 'ustawienia nie wymieniają skrótów klawiaturowych');
  for (const s of SKROTY) {
    const slowo = s.id === 'licznik' ? /spacja/i : /strza/i;
    T(`I6/${s.id}-w-ustawieniach`, slowo.test(skroty.textContent), `skrót ${s.id} nie jest nigdzie opisany`);
  }
  T('I7/arkusz-ma-kasowanie', !!sheet.querySelector('[data-sesje-usun]'), 'zniknęło kasowanie sesji z Bloku 15');
}

/* ═══════════ J. ARKUSZ STYLÓW JEST WPIĘTY ═══════════ */
{
  const idx = readFileSync(resolve(ROOT, 'src/styles/index.css'), 'utf8');
  T('J1/pwa-css-wpiety', /@import\s+'\.\/pwa\.css'/.test(idx), 'src/styles/pwa.css nie jest zaimportowany — pasek renderowałby się bez stylów');
  const html = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
  T('J2/brak-inline-rejestracji', !/navigator\.serviceWorker\.register/.test(html),
     'w index.html została stara rejestracja workera — działałaby obok adaptera i wróciłaby cicha podmiana cache');
  T('J3/updbar-w-markupie', /id="updbar"/.test(html), 'pasek nie istnieje w statycznym szkielecie powłoki');
}

/* ═══════════ K. NAWIGACJA MIĘDZY OBSZARAMI NAPRAWDĘ PRZEŁĄCZA EKRAN ═══════════
   ZNALEZIONE PRZEZ UŻYTKOWNIKA, nie przez wyrocznię: z Nauki albo z Laboratorium dotknięcie
   „Diagnostyka" nic nie robiło. Stan zmieniał się poprawnie (`area` i `mode` szły na 'diag'),
   ale `state.screen` zostawał na `naukaBib`/`labLista`, a `render()` dyspozytuje po `screen` —
   więc rysowała się dalej Nauka. Żadna wyrocznia tego nie widziała, bo wszystkie wchodziły na
   ekrany akcjami modułu (`goNauka`, `goLab`), nigdy PRZEZ NAWIGACJĘ z innego obszaru.

   Mapa oczekiwań jest tu WŁASNA, celowo niezależna od `OBSZAR_EKRANU` w shell.js: wyrocznia,
   która importuje tę samą tabelę, co kod, potwierdza tylko, że tabela równa się sama sobie. */
{
  const OBSZAR_OCZEKIWANY = { start: 'start', naukaBib: 'learn', naukaLekcja: 'learn',
                              labLista: 'lab', labEksp: 'lab' };
  const obszar = (s) => OBSZAR_OCZEKIWANY[s] || 'diag';

  const PRZEJSCIA = [['learn', 'diag'], ['lab', 'diag'], ['learn', 'lab'], ['lab', 'learn'],
                     ['diag', 'learn'], ['diag', 'lab'], ['start', 'diag']];
  for (const [z, dokad] of PRZEJSCIA) {
    czysty(); H.goArea('start'); H.goArea(z);
    const skad = st.screen;
    H.goArea(dokad);
    T(`K1/${z}-do-${dokad}`, obszar(st.screen) === dokad,
      `z ekranu ${skad} dotknięcie „${dokad}" zostawiło screen=${st.screen} (obszar ${obszar(st.screen)})`);
  }

  /* Druga strona tej samej monety: przejście NIE MOŻE cofać w obrębie własnego obszaru. Gdyby
     naprawę zrobić bezwarunkowym `screen='setup'`, dotknięcie „Diagnostyka" w trakcie badania
     wyrzucałoby klinicystę z „Oczopląsu" na początek — usterka gorsza od naprawianej. */
  czysty();
  H.goArea('diag'); H.openTest('dix'); H.setDiagSide('P'); H.goObs();
  const wTrakcie = st.screen;
  H.goArea('diag');
  T('K2/wlasny-obszar-nie-cofa', st.screen === wTrakcie && wTrakcie === 'obs',
    `ponowne dotknięcie własnego obszaru przeniosło z ${wTrakcie} na ${st.screen}`);

  /* Bramka na PRZYSZŁOŚĆ: każdy ekran z dyspozytora `render()`, którego nazwa zaczyna się od
     „nauka" albo „lab", musi być przypisany do swojego obszaru. To łapie realny scenariusz —
     kolejny blok dokłada `naukaWynik` i zapomina o mapie, a objaw jest znowu niewidoczny. */
  const zrodlo = readFileSync(resolve(ROOT, 'src/render/svg-screens.js'), 'utf8');
  const ekrany = [...zrodlo.matchAll(/state\.screen\s*===\s*"([A-Za-z]+)"/g)].map((m) => m[1]);
  T('K3/dyspozytor-znaleziony', ekrany.length >= 15, `w dyspozytorze render() znaleziono ${ekrany.length} ekranów`);
  const osierocone = ekrany.filter((s) => /^nauka/.test(s) && obszar(s) !== 'learn')
    .concat(ekrany.filter((s) => /^lab/.test(s) && obszar(s) !== 'lab'));
  T('K4/ekrany-maja-obszar', osierocone.length === 0,
    `ekrany bez przypisania do obszaru: ${osierocone.join(', ')} — dopisz je do OBSZAR_EKRANU w shell.js`);

  czysty(); H.goArea('start');
}

/* ═══════════ WYNIK ═══════════ */
const OCZEKIWANE = 89;   /* 79 + 10 bramek sekcji K (nawigacja miedzy obszarami) */
if (ok !== OCZEKIWANE) bledy.push(`LICZBA PRZYPADKÓW: ${ok}, oczekiwano ${OCZEKIWANE} — dopisz albo popraw zakres, ale nie po cichu`);
if (bledy.length) { console.error(`✗ pwa:dom — ${bledy.length} błędów (${ok} przeszło)`); for (const b of bledy) console.error('  ' + b); process.exit(1); }
console.log(`✓ pwa:dom — ${ok} przypadków`);
