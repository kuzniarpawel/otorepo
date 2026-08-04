/* OTOREPO — WYROCZNIA EKRANU OPISU I ZAPISU SESJI (Blok 15). jsdom, PRAWDZIWY graf modułów.
 *
 * Wyrocznia modelu (`opis:check`) sprawdza, że opis ŚLEDZI stan. Tutaj sprawdzamy trzy rzeczy,
 * których w czystym Node sprawdzić się nie da, bo dotyczą prawdziwego DOM i prawdziwej pamięci
 * przeglądarki:
 *   1. czy ręcznie zmieniony tekst opisu NA PEWNO nie trafia do pamięci ani do eksportu
 *      (pole tekstowe jest pierwszym w całej aplikacji — mierzymy BAJTY w localStorage),
 *   2. czy zapis i odtworzenie sesji naprawdę odtwarzają przypadek i NIE wznawiają odliczania,
 *   3. czy „usuń wszystkie zapisane sesje" jest w USTAWIENIACH i naprawdę kasuje klucz.
 *
 * Uruchomienie: npm run opis:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';
import { SEKCJE, SEKCJE_IDS, POLA_PACJENTA, POLA_SESJI, POLA_FLOW, POLA_MANEWRU, POLA_WEJSC,
         POLA_STRESZCZENIA_TRIAGE, rekordSesji, bezDanychOsobowychSesji } from '../src/app/opis-model.js';
import { opisDeps } from '../src/app/opis-deps.js';
import { POLA_OPISU } from '../src/app/opis-state.js';
import { TOLERANCJE, POLA_WPISU } from '../src/app/followup-model.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

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
{ const s = win.document.createElement('script'); s.textContent = outputFiles[0].text; win.document.body.appendChild(s); }

const H = win.__OTOREPO_TEST__;
const POTRZEBNE = ['state', 'render', 'goOpis', 'przelaczSekcjeOpisu', 'edytujOpis', 'ustawEdycjeOpisu',
  'wrocDoWyliczonego', 'zapiszSesjeOpisu', 'przywrocSesjeOpisu', 'usunSesjeOpisu', 'usunWszystkieSesjeOpisu',
  'wczytajSesjeOpisu', 'ustawTolerancjeKontroli', 'openTriage', 'setTriage', 'toggleTriageFlaga', 'openTest',
  'setDiagSide', 'goObs', 'setObsPole', 'setDixObs', 'goInterpret', 'startManeuver', 'goKontrola',
  'ustawWynikKontroli', 'pytajOZakonczeniu', 'goArea', 'goStep', 'zakonczSesje'];
const brak = POTRZEBNE.filter(n => !H || typeof H[n] === 'undefined');
if (errs.length || brak.length) {
  console.error('✗ BLAD LADOWANIA — wyrocznia niewazna.');
  if (errs.length) console.error('  loadErrors   :', errs.slice(0, 5));
  if (brak.length) console.error('  brak uchwytu :', brak);
  process.exit(1);
}
const app = () => win.document.getElementById('app').innerHTML;
const st = H.state;
st.lang = 'pl';
const KLUCZ = 'otorepo_sesje';
const bajty = () => win.localStorage.getItem(KLUCZ) || '';

/* PEŁNY PRZEBIEG KLINICZNY — te same gesty, co u użytkownika. `setObsPole` bierze PRÓBĘ pierwszym
   argumentem; wywołanie dwuargumentowe zapisuje rekord pod kluczem pola i cicho psuje przypadek. */
function przebieg() {
  H.goArea('diag');
  H.openTriage(); H.setTriage('przebieg', 'napadowe'); H.setTriage('wyzwalacz', 'pozycyjny'); H.toggleTriageFlaga('brak');
  H.openTest('dix'); H.setDiagSide('P');
  H.goObs();
  H.setObsPole('dix', 'wystapil', 'tak');
  H.setObsPole('dix', 'pion#jedyna', 'p1'); H.setObsPole('dix', 'torsja#jedyna', 'p1'); H.setObsPole('dix', 'poziom#jedyna', 'zero');
  H.setObsPole('dix', 'latencja', '1-5s'); H.setObsPole('dix', 'czasTrwania', 'ponizej1min'); H.setObsPole('dix', 'meczliwosc', 'slabnie');
  H.setDixObs('post'); H.goInterpret();
  H.startManeuver('epley');
  // Manewr musi byc NAPRAWDE wykonany: ekran kontroli nie pyta o nic po manewrze, ktorego
  // nikt nie przeszedl (followup-model.kontrolaMozliwa -> `niewykonany`).
  { const n = st.plan.steps.length; for (let i = 1; i < n; i++) H.goStep(i); }
  H.goKontrola();
}

/* ═══════════ A. EKRAN OPISU ISTNIEJE I JEST OSIĄGALNY Z PRZEBIEGU ═══════════ */
{
  przebieg();
  T('A1/karta-na-kontroli', /data-opiskarta/.test(app()), 'ekran kontroli nie proponuje opisu badania');
  H.goOpis();
  eq('A2/ekran', st.screen, 'opis');
  T('A3/podglad', /data-opodglad/.test(app()), 'brak podglądu opisu');
  T('A4/przelaczniki', (app().match(/data-osek="/g) || []).length === SEKCJE.length, 'nie wszystkie sekcje mają przełącznik');
  T('A5/kopiuj-duzy', /class="cta opisakcje__kop"/.test(app()), 'brak dużego przycisku „Kopiuj" (układ telefonu)');
  T('A6/lista-sesji', /class="card opissesje"/.test(app()), 'brak listy zapisanych sesji');
  // Opis jest TREŚCIĄ, nie zaślepką: podgląd niesie ustalenia z przebiegu.
  const podglad = app().match(/<pre class="opispodglad__t"[^>]*>([\s\S]*?)<\/pre>/);
  T('A7/podglad-niepusty', !!podglad && podglad[1].length > 300, 'podgląd opisu jest pusty');
  T('A8/podglad-ma-manewr', !!podglad && /Epley/.test(podglad[1]), 'opis nie wymienia wykonanego manewru');
  T('A9/podglad-ma-zastrzezenie', !!podglad && /ZASTRZE/.test(podglad[1]), 'opis nie niesie zastrzeżenia');
}

/* ═══════════ B. KRYTERIUM ODBIORU NR 1 W PRAWDZIWYM GRAFIE ═══════════
   „Opis aktualizuje po zmianie rozpoznania." Zmieniamy rozpoznanie i patrzymy NA EKRAN. */
{
  const przed = app();
  st.canal = 'horizontal'; H.render();
  T('B1/zmiana-kanalu-widoczna', app() !== przed, 'zmiana kanału nie ruszyła opisu na ekranie');
  st.canal = 'posterior'; H.render();
  eq('B2/powrot-identyczny', app(), przed);
  // Opis nie jest PRZECHOWYWANY: w stanie nie ma pola z gotowym tekstem (poza ulotną edycją).
  const zTekstem = Object.keys(st).filter(k => typeof st[k] === 'string' && st[k].length > 200 && k !== 'opisEdycja');
  eq('B3/bez-zapamietanego-tekstu', zTekstem, []);
}

/* ═══════════ C. SEKCJE ═══════════ */
{
  const pelny = app();
  for (const sek of SEKCJE.filter(s => !s.obowiazkowa)) {
    H.przelaczSekcjeOpisu(sek.id);
    const txt = app();
    T(`C1/${sek.id}-znika`, !txt.includes(sek.pl.toUpperCase()), `wyłączona sekcja ${sek.id} została w podglądzie`);
    H.przelaczSekcjeOpisu(sek.id);
  }
  eq('C2/wraca-do-pelnego', app(), pelny);
  // Zastrzeżenia wyłączyć się NIE DA — przełącznik jest zablokowany, a tekst zostaje.
  const przycisk = win.document.querySelector('[data-osek="zastrzezenie"]');
  T('C3/obowiazkowa-zablokowana', !!przycisk && przycisk.hasAttribute('disabled'), 'zastrzeżenie da się wyłączyć przełącznikiem');
  for (const id of SEKCJE_IDS.filter(x => x !== 'zastrzezenie')) H.przelaczSekcjeOpisu(id);
  T('C4/zastrzezenie-zostaje', /ZASTRZE/.test(app()), 'przy wszystkich sekcjach wyłączonych zniknęło zastrzeżenie');
  for (const id of SEKCJE_IDS.filter(x => x !== 'zastrzezenie')) H.przelaczSekcjeOpisu(id);
  eq('C5/pelny-po-powrocie', app(), pelny);
}

/* ═══════════ D. PIERWSZE POLE TEKSTOWE W APLIKACJI ═══════════
   Edycja jest ULOTNA. Mierzymy to bajtami w pamięci przeglądarki, a nie deklaracją w kodzie. */
{
  const ZNACZNIK = 'PACJENT_TESTOWY_KOWALSKI';
  H.edytujOpis();
  const pole = win.document.querySelector('[data-oedycja]');
  T('D1/pole-jest', !!pole, 'brak pola edycji po dotknięciu „Edytuj"');
  T('D2/ostrzezenie-przy-polu', /data-oostrz/.test(app()), 'pole edycji bez ostrzeżenia o ulotności');
  H.ustawEdycjeOpisu(`${ZNACZNIK}\ncokolwiek`);
  T('D3/edycja-w-stanie', String(st.opisEdycja).includes(ZNACZNIK), 'edycja nie trafiła do stanu');
  // ZAPIS SESJI z otwartą edycją — znacznik NIE MA PRAWA znaleźć się w pamięci.
  H.zapiszSesjeOpisu();
  T('D4/zapis-sie-udal', (st.opisSesje || []).length === 1, `zapis sesji nie powiódł się (blad=${st.opisBlad})`);
  T('D5/znacznika-nie-ma-w-pamieci', !bajty().includes(ZNACZNIK), 'ręcznie wpisany tekst trafił do pamięci przeglądarki');
  T('D6/pamiec-niepusta', bajty().length > 100, 'kontrola czułości: w pamięci nie ma czego przeszukiwać');
  T('D7/zapis-ma-przypadek', /"canal":"posterior"/.test(bajty()), 'zapis nie niesie przypadku');
  // Wyjście z ekranu KASUJE edycję — „nie jest zapisywana" ma być prawdą także po powrocie.
  H.goKontrola(); H.goOpis();
  eq('D8/edycja-skasowana', st.opisEdycja, null);
  T('D9/znacznik-zniknal-z-ekranu', !app().includes(ZNACZNIK), 'ręczna wersja tekstu przeżyła wyjście z ekranu');
  // Powrót do wyliczonego opisu jednym gestem.
  H.edytujOpis(); H.ustawEdycjeOpisu('cokolwiek'); H.wrocDoWyliczonego();
  eq('D10/powrot-do-wyliczonego', st.opisEdycja, null);
  T('D11/pole-znika', !/data-oedycja/.test(app()), 'pole edycji zostało po powrocie do wyliczonego opisu');
}

/* ═══════════ E. POLE TEKSTOWE JEST DOKŁADNIE JEDNO ═══════════
   Bloki 12–14 pilnowały, że w aplikacji NIE MA pól tekstowych. Blok 15 dokłada jedno, świadomie
   i w jednym miejscu — więc bramka nie znika, tylko zmienia się w „nigdzie indziej". */
{
  const policz = (html) => (html.match(/<textarea|<input(?![^>]*type="(?:range|checkbox|radio)")|contenteditable/gi) || []).length;
  const ekrany = [];
  H.goArea('diag'); ekrany.push(['proba', app()]);
  H.goObs(); ekrany.push(['oczoplas', app()]);
  H.goInterpret(); ekrany.push(['interpretacja', app()]);
  H.startManeuver('epley'); ekrany.push(['manewr', app()]);
  H.goKontrola(); ekrany.push(['kontrola', app()]);
  H.pytajOZakonczeniu(true); ekrany.push(['zakonczenie', app()]);
  H.pytajOZakonczeniu(false);
  H.goArea('learn'); ekrany.push(['nauka', app()]);
  H.goArea('lab'); ekrany.push(['laboratorium', app()]);
  for (const [nazwa, html] of ekrany) eq(`E1/${nazwa}-bez-pol`, policz(html), 0);
  H.goArea('diag'); H.goKontrola(); H.goOpis();
  eq('E2/opis-bez-pola-domyslnie', policz(app()), 0);
  H.edytujOpis();
  eq('E3/opis-jedno-pole-po-gescie', policz(app()), 1);
  H.wrocDoWyliczonego();
}

/* ═══════════ F. ZAPIS I ODTWORZENIE SESJI ═══════════ */
{
  H.usunWszystkieSesjeOpisu();
  przebieg();
  H.ustawWynikKontroli('ustapienie');
  H.ustawTolerancjeKontroli('nudnosci');
  H.goOpis(); H.zapiszSesjeOpisu();
  const id = (st.opisSesje[0] || {}).id;
  T('F1/zapisano', !!id, 'sesja się nie zapisała');
  const odcisk = JSON.stringify(POLA_SESJI.map(k => [k, st[k]]));

  // Wszystko kasujemy tak, jak robi to zakończenie sesji, i odtwarzamy z listy.
  H.zakonczSesje && H.zakonczSesje();
  H.goOpis();
  T('F2/przypadek-wyczyszczony', JSON.stringify(POLA_SESJI.map(k => [k, st[k]])) !== odcisk, 'kontrola czułości: zakończenie nie wyczyściło przypadku');
  T('F3/zapis-przezyl', (st.opisSesje || []).length === 1, 'zapis zniknął razem z przypadkiem');
  H.przywrocSesjeOpisu(id);
  eq('F4/przypadek-wrocil', JSON.stringify(POLA_SESJI.map(k => [k, st[k]])), odcisk);
  // ODTWORZENIE NIE WZNAWIA ODLICZANIA — pacjenta nie ma już w tej pozycji.
  eq('F5/licznik-stoi', st.running, false);
  eq('F6/czas-zerowy', st.elapsedMs, 0);
  eq('F7/zegar-pusty', st.zegar, null);
  T('F8/plan-odbudowany', !!st.plan && st.plan.key === 'epley', 'plan manewru nie został odbudowany z klucza');
  T('F9/pokwitowanie', st.opisKomunikat === 'przywrocono', 'odtworzenie bez pokwitowania na ekranie');
  T('F10/opis-po-odtworzeniu', /Epley/.test(app()), 'odtworzona sesja nie daje opisu');
  // Usunięcie POJEDYNCZEGO zapisu.
  H.usunSesjeOpisu(id);
  eq('F11/usuniety', (st.opisSesje || []).length, 0);
  T('F12/pamiec-bez-wpisu', !bajty().includes('"canal":"posterior"'), 'usunięty zapis został w pamięci');
}

/* ═══════════ G. KRYTERIUM ODBIORU NR 2 — NIC NIE WYCHODZI BEZ GESTU ═══════════ */
{
  H.usunWszystkieSesjeOpisu();
  przebieg();
  const przed = bajty();
  H.goOpis(); H.render();
  H.przelaczSekcjeOpisu('proby'); H.przelaczSekcjeOpisu('proby');
  H.edytujOpis(); H.ustawEdycjeOpisu('cokolwiek'); H.wrocDoWyliczonego();
  eq('G1/otwarcie-nie-zapisuje', bajty(), przed);
  T('G2/pamiec-pusta-bez-gestu', przed === '', 'sam przebieg kliniczny coś zapisał do pamięci');
  H.zapiszSesjeOpisu();
  T('G3/gest-zapisuje', bajty() !== przed, 'jawny zapis nic nie zmienił w pamięci');
  // Zapis niesie WYŁĄCZNIE identyfikatory — żadnego zdania z opisu.
  T('G4/bez-zdan', !/Kanał tylny|narzędzie dydaktyczne|ZASTRZE/.test(bajty()), 'do pamięci trafiły zdania opisu, a nie identyfikatory');
}

/* ═══════════ H. KRYTERIUM ODBIORU NR 3 — KASOWANIE Z USTAWIEŃ ═══════════ */
{
  H.goOpis(); H.zapiszSesjeOpisu();
  T('H1/dwa-zapisy', (st.opisSesje || []).length >= 1, 'brak zapisów do skasowania');
  H.goArea('profile');                       // obszar „Profil" otwiera arkusz ustawień
  const sheet = win.document.getElementById('sheet');
  T('H2/arkusz-otwarty', !!sheet && sheet.hidden === false, 'obszar „Profil" nie otworzył ustawień');
  const przycisk = sheet.querySelector('[data-sesje-usun]');
  T('H3/przycisk-w-ustawieniach', !!przycisk, 'w ustawieniach nie ma kasowania zapisanych sesji');
  const licznik = sheet.querySelector('[data-sesje-ile]');
  eq('H4/licznik', licznik && licznik.textContent, String((st.opisSesje || []).length));
  // Pierwsze dotknięcie PYTA, drugie kasuje — kasowanie nieodwracalne nie może być jednym klikiem.
  przycisk.dispatchEvent(new win.Event('click', { bubbles: true }));
  T('H5/pierwsze-dotkniecie-pyta', przycisk.getAttribute('data-potwierdz') === '1' && (st.opisSesje || []).length >= 1,
    'pierwsze dotknięcie od razu skasowało zapisy');
  przycisk.dispatchEvent(new win.Event('click', { bubbles: true }));
  eq('H6/skasowane', (st.opisSesje || []).length, 0);
  eq('H7/klucz-usuniety', win.localStorage.getItem(KLUCZ), null);
  eq('H8/licznik-zerowy', sheet.querySelector('[data-sesje-ile]').textContent, '0');
  T('H9/potwierdzenie-zresetowane', przycisk.getAttribute('data-potwierdz') === null, 'przycisk został w trybie potwierdzenia');
}

/* ═══════════ I. TOLERANCJA MANEWRU ═══════════ */
{
  przebieg();
  T('I1/karta-na-kontroli', /data-futol/.test(app()), 'ekran kontroli nie pyta o tolerancję manewru');
  eq('I2/wszystkie-opcje', (app().match(/class="futol__b"/g) || []).length, TOLERANCJE.length);
  H.ustawTolerancjeKontroli('wymioty');
  const wpis = () => (st.kontrole || [])[(st.flow.maneuver || {}).kontrolaIdx] || {};
  eq('I3/zapisana', wpis().tolerancja, 'wymioty');
  // Ponowne dotknięcie COFA odpowiedź (ten sam gest, co przy wyniku kontroli).
  H.ustawTolerancjeKontroli('wymioty');
  eq('I4/cofniecie', wpis().tolerancja, null);
  H.ustawTolerancjeKontroli('nudnosci');
  // ZMIANA WYNIKU NIE KASUJE TOLERANCJI — wpis jest przebudowywany od zera przy każdej zmianie.
  H.ustawWynikKontroli('ustapienie');
  eq('I5/przezyla-wynik', wpis().tolerancja, 'nudnosci');
  H.ustawWynikKontroli('brakPoprawy');
  eq('I6/przezyla-druga-zmiane', wpis().tolerancja, 'nudnosci');
  // I trafia do opisu.
  H.goOpis();
  T('I7/w-opisie', /nudno/.test(app()), 'tolerancja nie weszła do opisu badania');
  H.goKontrola();
  // Manewr przerwany + wynik wiarygodny → sprzeczność NAZWANA na ekranie.
  H.ustawTolerancjeKontroli('nudnosci');   // cofnięcie
  H.ustawTolerancjeKontroli('przerwano');
  H.ustawWynikKontroli('brakPoprawy'); H.ustawWynikKontroli('ustapienie');
  T('I8/sprzecznosc-na-ekranie', /nie dokończono/.test(app()), 'ekran nie nazwał wyniku po przerwanym manewrze');
}

/* ═══════════ J. POLA STANU I JĘZYK ═══════════ */
{
  T('J1/pola-opisu', POLA_OPISU.every(k => k in st), `stan nie ma pól Bloku 15: ${POLA_OPISU.filter(k => !(k in st)).join(',')}`);
  T('J2/rozlaczne-z-pacjentem', !POLA_OPISU.some(k => POLA_PACJENTA.includes(k)), 'pole generatora opisu jest polem przypadku');
  H.goOpis();
  const pl = app();
  st.lang = 'en'; H.render();
  const en = app();
  T('J3/inny-jezyk', pl !== en, 'przełączenie języka nie zmieniło ekranu opisu');
  T('J4/en-bez-polskiego', !/Opis badania|Sekcje opisu|Zapisane sesje|Kanał tylny/.test(en), 'ekran EN niesie polskie napisy');
  T('J5/pl-bez-angielskiego', !/Report preview|Saved sessions|Posterior canal/.test(pl), 'ekran PL niesie angielskie napisy');
  st.lang = 'pl'; H.render();
}

/* ═══════════ K. ZDANIE O PRYWATNOŚCI ZGADZA SIĘ Z TYM, CO ROBI APLIKACJA ═══════════
   Do Bloku 15 karta zakończenia mówiła „aplikacja nie zapisuje go na urządzeniu" — i było to
   prawdą, bo nie było czym zapisać. Zapis istnieje, więc zdanie musiało się zmienić. Bramka
   pilnuje, żeby nie wróciło. */
{
  przebieg();
  H.pytajOZakonczeniu(true);
  const txt = app();
  T('K1/bez-nieprawdy', !/nie zapisuje go na urządzeniu/.test(txt), 'karta zakończenia twierdzi, że aplikacja nic nie zapisuje na urządzeniu');
  T('K2/mowi-o-dobrowolnym-zapisie', /TYLKO wtedy, gdy sam zapiszesz/.test(txt), 'karta zakończenia nie mówi, kiedy przypadek zostaje na urządzeniu');
  T('K3/nadal-mowi-o-braku-wysylki', /nie wysyła niczego poza urządzenie/.test(txt), 'zniknęło zdanie o braku wysyłki');
  T('K4/wyjscie-do-opisu', /goOpis\(\)/.test(txt), 'z karty zakończenia nie da się przejść do opisu badania');
  H.pytajOZakonczeniu(false);
}

/* ═══════════ L. STRAŻNIK ZNA CAŁY PRAWDZIWY STAN ═══════════
   Ta sekcja jest zapadką na najdroższy błąd tego bloku. Strażnik danych powstał na przypadku
   ZBUDOWANYM RĘCZNIE i przez to nie wiedział o trzech rzeczach, które prawdziwy przebieg wkłada
   do `flow`: streszczeniu kwalifikacji, streszczeniu kontroli i opisie SPRZED manewru. Odrzucał
   więc każdy prawdziwy zapis — czyli funkcja „zapisz sesję" nie działała ANI RAZU, a wyrocznia
   modelu świeciła na zielono.
   Nie wystarczy to naprawić: następny blok dołoży kolejne streszczenie i historia się powtórzy.
   Dlatego mierzymy POKRYCIE — każdy klucz prawdziwego stanu musi być na liście strażnika. */
{
  przebieg();
  H.ustawWynikKontroli('ustapienie');
  const brakujace = (klucze, lista) => klucze.filter(k => !lista.includes(k));
  eq('L1/flow-pokryte', brakujace(Object.keys(st.flow || {}), POLA_FLOW), []);
  eq('L2/manewr-pokryty', brakujace(Object.keys((st.flow || {}).maneuver || {}), POLA_MANEWRU), []);
  eq('L3/wejscia-pokryte', brakujace(Object.keys(((st.flow || {}).maneuver || {}).inputs || {}), POLA_WEJSC), []);
  eq('L4/wpis-kontroli-pokryty', brakujace(Object.keys((st.kontrole || [])[0] || {}), POLA_WPISU), []);
  eq('L5/streszczenie-kwalifikacji', brakujace(Object.keys((st.flow || {}).triage || {}).filter(k => !/^tytul/.test(k)), POLA_STRESZCZENIA_TRIAGE), []);
  // Kontrola czułości: pomiar musi UMIEĆ znaleźć brak.
  eq('L6/kontrola-czulosci', brakujace(['nieistniejace'], POLA_FLOW), ['nieistniejace']);
  // I to samo od drugiej strony: prawdziwy zapis MUSI przejść strażnika.
  const rek = rekordSesji(st, opisDeps(st), 1, []);
  const straz = bezDanychOsobowychSesji(rek, opisDeps(st));
  T('L7/prawdziwy-zapis-czysty', straz.czysty, `strażnik odrzucił prawdziwy przebieg: ${straz.powody.join('; ')}`);
  // Zdania z paska przebiegu NIE wchodzą do zapisu — projekcja, nie czyszczenie naruszenia.
  T('L8/bez-zdan-w-zapisie', !JSON.stringify(rek).includes('tytulPl'), 'tytuł kwalifikacji trafił do zapisu sesji');
  T('L9/identyfikatory-zostaly', JSON.stringify(rek.pola.flow.triage).includes('kategoria'), 'projekcja zabrała też identyfikatory');
}

/* ═══════════ WYNIK ═══════════ */
const OCZEKIWANE = 95;
if (ok !== OCZEKIWANE) bledy.push(`LICZBA PRZYPADKÓW: ${ok}, oczekiwano ${OCZEKIWANE} — dopisz albo popraw zakres, ale nie po cichu`);
if (bledy.length) { console.error(`✗ opis:dom — ${bledy.length} błędów (${ok} przeszło)`); for (const b of bledy) console.error('  ' + b); process.exit(1); }
console.log(`✓ opis:dom — ${ok} przypadków`);
