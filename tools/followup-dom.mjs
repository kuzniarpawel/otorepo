/* OTOREPO — wyrocznia EKRANU I AKCJI KONTROLI PO MANEWRZE (Blok 11). jsdom, realny graf modułów.
 *
 * ═══ DLACZEGO OSOBNO OD fu:check ═══
 * Wszystkie trzy kryteria odbioru Bloku 11 są zdaniami o TYM, CO ROBI APLIKACJA, a nie o modelu:
 *   1. „nie wraca automatycznie do początku po zakończeniu manewru" — to zachowanie AKCJI;
 *   2. „konwersja prowadzi do ponownej interpretacji" — to zawartość EKRANU i cel przycisku;
 *   3. „można zakończyć sesję bez danych identyfikacyjnych" — to nieobecność pól na WSZYSTKICH
 *      ekranach i brak warunku wstępnego w akcji.
 * Model może być bezbłędny, a akcja i tak zrobi swoje (Blok 10 zmierzył to trzy razy).
 *
 * Każda bramka ma KONTROLĘ CZUŁOŚCI — stan bliźniaczy z odwrotnym wynikiem.
 * Uruchomienie: npm run fu:dom
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { JSDOM, VirtualConsole } from 'jsdom';
import { build as esbuild } from 'esbuild';

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
vc.on('jsdomError', e => errs.push(String(e && (e.detail?.message || e.message) || e)));
const dom = new JSDOM(readFileSync(resolve(ROOT, 'index.html'), 'utf8'),
  { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost:8777/', virtualConsole: vc });
const win = dom.window;
{ const s = win.document.createElement('script'); s.textContent = outputFiles[0].text; win.document.body.appendChild(s); }
win.requestAnimationFrame = () => 0;
win.cancelAnimationFrame = () => {};

const h = win.__OTOREPO_TEST__;
const A = (n) => (h && h[n]) || win[n];
const POTRZEBNE = ['state', 'render', 'startManeuver', 'zakonczSerie', 'goStep', 'goKontrola', 'wrocDoManewru',
  'ustawWynikKontroli', 'ustawPowodKontroli', 'kontrolaAkcja', 'kontrolaAlternatywa', 'powtorzManewrKontroli',
  'pytajOZakonczeniu', 'zakonczSesje', 'openTest', 'openMan', 'pickCanal', 'syncShell', 'goObs', 'openTriage', 'setTriage',
  // K3o/K3p: listy pól modułów + droga wypełnienia badania HINTS. Brak któregokolwiek uchwytu ma
  // NAZWAĆ brak, a nie wywalić wyrocznię na „undefined is not a function".
  'POLA_HINTS', 'POLA_PREFERENCJI', 'goHintsKwal', 'ustawPrzeszkolenieHints', 'pomijajKwalifikacje',
  'zacznijBadanieHints', 'ustawSkladowaHints', 'ustawPowodNiewiarHints'];
const brak = POTRZEBNE.filter(n => typeof A(n) === 'undefined');
if (errs.length || brak.length) {
  console.error('✗ BLAD LADOWANIA — wyrocznia niewazna.');
  if (errs.length) console.error('  loadErrors   :', errs.slice(0, 5));
  if (brak.length) console.error('  brak uchwytu :', brak);
  process.exit(1);
}
const st = A('state');
st.lang = 'pl';
const app = () => win.document.querySelector('#app').innerHTML;
// KAZDE nowe pole stanu MUSI tu trafic — inaczej przypadki przechodza przez kolejnosc blokow,
// a nie przez kod aplikacji (ta pulapka zamknela ZR4/ZR5 w Bloku 9 i TC3 w Bloku 10).
function czysty() {
  st.mode = 'treat'; st.screen = 'setup'; st.area = 'diag';
  st.side = 'P'; st.canal = null; st.maneuverKey = null; st.testKey = null;
  st.variant = 'canalo'; st.variantZrodlo = null; st.dixObs = null; st.dixRep = 0;
  st.diagCentral = false; st.size = 'medium'; st.plan = null; st.step = 0;
  st.running = false; st.elapsedMs = 0; st.total = 0; st.autoAdvance = false;
  st.trybCzasu = 'staly'; st.sideZrodlo = null;
  st.kontrole = []; st.kontrolaPowod = null; st.zakonczeniePyta = false; st.kontrolaBlad = null;
  st.obs = {}; st.obsOdciski = {}; st.decisionSeq = 0; st.triage = {}; st.triageStep = null;
  st.flow = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null };
  A('render')();
}

/* ═══════════ A. KRYTERIUM ODBIORU NR 1 ═══════════
   „Aplikacja nie wraca automatycznie do początku po zakończeniu manewru."
   Zmierzone PRZED zmianą: `zakonczSerie` wołało `backToSetup()`, czyli seria kończyła się dokładnie
   tam, gdzie się zaczęła — na liście kanałów, bez jednego zdania o tym, co się wydarzyło. */
czysty();
A('startManeuver')('epley');
eq('K1a/manewr-otwarty', st.screen, 'guide');
A('zakonczSerie')();
eq('K1b/nie-wraca-na-poczatek', st.screen, 'followup');
T('K1c/ekran-kontroli', /Kontrola po manewrze/.test(app()), 'ekran musi nazwać się kontrolą po manewrze');
T('K1d/pyta-o-obserwacje', /Co obserwujesz teraz\?/.test(app()), 'karta pyta o obserwację, nie o ocenę skuteczności');
T('K1e/manewr-nazwany', /Epley/.test(app()), 'kontrola musi powiedzieć, CZEGO dotyczy');
eq('K1f/licznik-zatrzymany', st.running, false);
// KONTROLA CZULOSCI: dopoki manewr trwa, ekran kontroli sie nie pokazuje.
czysty(); A('startManeuver')('epley'); A('goStep')(1);
eq('K1g/czulosc-w-trakcie', st.screen, 'guide');
// Dojscie SEKWENCYJNE do ostatniego etapu tez konczy manewr, ale NIE wyrzuca z ekranu przewodnika:
// „wykonany" to stan manewru, a nie polecenie nawigacji. Kontrola czeka w pasku i pod przyciskiem.
czysty(); A('startManeuver')('epley');
{ const n = st.plan.steps.length; for (let i = 1; i < n; i++) A('goStep')(i); }
eq('K1h/sekwencja-nie-nawiguje', st.screen, 'guide');
eq('K1i/ale-manewr-wykonany', st.flow.maneuver.consumed, true);

/* ═══════════ B. KONTROLA MA PODMIOT ═══════════
   Karta „co obserwujesz teraz?" bez wykonanego manewru opisywałaby wynik czegoś, co się nie
   wydarzyło. Trzy stany, trzy różne zdania. */
czysty();
A('goKontrola')();
T('K1j/bez-manewru-mowi-dlaczego', /Nie ma czego kontrolować/.test(app()) && !/Co obserwujesz teraz\?/.test(app()),
  'bez manewru ekran nie pyta o wynik, tylko mówi, dlaczego nie ma o co pytać');
czysty(); A('startManeuver')('epley'); A('goKontrola')();
T('K1k/niewykonany-manewr', /nie został doprowadzony do końca/.test(app()),
  'manewr wybrany, ale niewykonany — inne zdanie niż brak manewru');
T('K1l/droga-powrotna', /wrocDoManewru\(\)/.test(app()), 'ekran musi dać drogę powrotną, a nie ślepy zaułek');

/* ═══════════ C. KRYTERIUM ODBIORU NR 2 ═══════════
   „Konwersja kanałowa prowadzi do ponownej interpretacji zamiast prostego powtórzenia tego samego
   manewru." Sprawdzamy EKRAN: przycisku powtórzenia ma po prostu NIE BYĆ, a powód ma być napisany. */
czysty(); st.mode = 'diag'; A('openTest')('dix'); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('konwersja');
eq('K2a/wynik-zapisany', st.kontrole[0].wynik, 'konwersja');
T('K2b/bez-powtorki', !/kontrolaAkcja\('powtorzManewr'\)/.test(app()), 'przy konwersji NIE MA przycisku powtórzenia manewru');
T('K2c/bez-alternatywy', !/kontrolaAlternatywa\(/.test(app()), 'alternatywa TEGO kanału też nie ma sensu — złóg jest gdzie indziej');
T('K2d/glowny-to-interpretacja', /class="recoprimary" onclick="kontrolaAkcja\('ponownaInterpretacja'\)"/.test(app()),
  'krokiem głównym musi być ponowne ustalenie kanału i strony');
T('K2e/powod-napisany', /złóg jest w innym kanale/.test(app()), 'zakaz bez powodu to milczenie, nie ostrzeżenie');
A('kontrolaAkcja')('ponownaInterpretacja');
eq('K2f/prowadzi-do-interpretacji', st.screen, 'interpret');
// KONTROLA CZUŁOŚCI: przy częściowej poprawie powtórzenie manewru JEST krokiem głównym.
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('czesciowaPoprawa');
T('K2g/czulosc-powtorka-jest', /class="recoprimary" onclick="kontrolaAkcja\('powtorzManewr'\)"/.test(app()),
  'przy częściowej poprawie powtórzenie manewru jest krokiem głównym');
T('K2h/czulosc-alternatywa-jest', /kontrolaAlternatywa\('semont'\)/.test(app()), 'alternatywy kanału tylnego muszą być dostępne');
// Tryb ekspercki NIE MA proby, wiec „ustal kanal i strone od nowa" celuje w ekran doboru — ekran
// interpretacji bez `testKey` nie ma z czego sie zbudowac.
czysty(); st.canal = 'posterior'; A('openMan')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('konwersja'); A('kontrolaAkcja')('ponownaInterpretacja');
eq('K2i/bez-proby-do-doboru', st.screen, 'setup');

/* ═══════════ D. ZAWROTY RESZTKOWE ═══════════
   Bez oczopląsu pozycyjnego nie ma czego repozycjonować. To najczęstszy błąd po skutecznym
   manewrze i jedyne miejsce, w którym ekran ODMAWIA zaproponowania repozycji z powodu klinicznego,
   a nie technicznego. */
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('residual');
T('K2j/residual-bez-repozycji', !/kontrolaAkcja\('powtorzManewr'\)/.test(app()) && !/kontrolaAlternatywa\(/.test(app()),
  'przy zawrotach resztkowych ekran nie proponuje żadnej repozycji');
T('K2k/residual-powod', /nie ma czego repozycjonować/.test(app()), 'powód musi być napisany');
T('K2l/residual-obserwacja', /fuinfo/.test(app()), 'krok główny „obserwacja" jest zdaniem, nie przyciskiem prowadzącym donikąd');

/* ═══════════ E. KRYTERIUM ODBIORU NR 3 — ZERO PÓL IDENTYFIKACYJNYCH ═══════════
   Zapadka, nie naprawa: w aplikacji nie ma dziś ANI JEDNEGO pola tekstowego, więc kryterium jest
   spełnione — i właśnie dlatego dokładamy bramkę, która nie pozwoli tego cicho zmienić.
   Skan obejmuje WSZYSTKIE ekrany, bo „sesji nie da się zapisać z danymi pacjenta" jest zdaniem
   o całej aplikacji, nie o jednym widoku. Suwaki (`type=range`) są dozwolone — to parametry
   modelu, nie dane. */
{
  const POLE_TEKSTOWE = /<textarea|contenteditable|<input(?![^>]*type\s*=\s*["'](?:range|checkbox|radio)["'])/i;
  const ekrany = [];
  const dodaj = (nazwa, fn) => { czysty(); try { fn(); } catch (e) { bledy.push(`K3-scan/${nazwa}: ${e.message}`); } ekrany.push([nazwa, app()]); };
  dodaj('start', () => { st.screen = 'start'; A('render')(); });
  dodaj('setup', () => { st.screen = 'setup'; A('render')(); });
  dodaj('triage', () => { A('openTriage')(); A('setTriage')('przebieg', 'napadowy'); });
  dodaj('diag', () => { st.mode = 'diag'; A('openTest')('dix'); });
  dodaj('obs', () => { st.mode = 'diag'; A('openTest')('dix'); A('goObs')(); });
  dodaj('guide', () => { A('startManeuver')('epley'); });
  dodaj('followup', () => { A('startManeuver')('epley'); A('zakonczSerie')(); A('ustawWynikKontroli')('niewiarygodne'); });
  dodaj('followup-koniec', () => { A('startManeuver')('epley'); A('zakonczSerie')(); A('pytajOZakonczeniu')(true); });
  const zPolem = ekrany.filter(([, html]) => POLE_TEKSTOWE.test(html)).map(([n]) => n);
  eq('K3a/zadnego-pola-tekstowego', zPolem, []);
  T('K3b/skan-cos-widzial', ekrany.length === 8 && ekrany.every(([, x]) => x.length > 200), 'skan musi obejmować osiem niepustych ekranów');
  // KONTROLE CZUŁOŚCI wzorca — w obie strony.
  T('K3c/czulosc-input', POLE_TEKSTOWE.test('<input class="x" placeholder="nazwisko pacjenta">'), 'wzorzec musi łapać pole tekstowe bez atrybutu type');
  T('K3d/czulosc-textarea', POLE_TEKSTOWE.test('<textarea rows="3"></textarea>'), 'wzorzec musi łapać pole wielolinijkowe');
  T('K3e/czulosc-suwak-dozwolony', !POLE_TEKSTOWE.test('<input type="range" min="0" max="1">'), 'suwak parametru modelu nie jest polem danych');
}

/* ═══════════ F. ZAKOŃCZENIE SESJI ═══════════ */
// Zakończenie NIE MA warunku wstępnego: nie trzeba zaznaczyć wyniku ani niczego wypełnić.
// Pierwsza wersja ekranu miała ten przycisk wewnątrz karty „Co dalej", więc do wyjścia z badania
// trzeba było najpierw odpowiedzieć — dokładnie to, czego kryterium zabrania.
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
T('K3f/koniec-bez-odpowiedzi', /pytajOZakonczeniu\(true\)/.test(app()), 'sesję da się zakończyć bez zaznaczenia czegokolwiek');
A('pytajOZakonczeniu')(true);
T('K3g/potwierdzenie', /Zakończyć sesję\?/.test(app()), 'kasowanie danych przypadku jest dwustopniowe');
T('K3h/mowi-co-zniknie', /kasuje dane przypadku/.test(app()), 'potwierdzenie musi powiedzieć, co się stanie');
T('K3i/nie-pyta-o-pacjenta', /nigdzie nie pyta o dane pacjenta|Nigdzie nie pytamy o dane pacjenta/.test(app()),
  'ekran mówi wprost, że danych pacjenta nie ma gdzie podać');
/* Dane PRZYPADKU znikają, preferencje NARZĘDZIA zostają. Badanie HINTS wypełniamy PRZED
   zakończeniem, bo to ono przez dwa bloki przeżywało sesję (patrz K3p niżej). */
st.lang = 'pl'; st.view3d = false; st.sound = false; st.autoAdvance = true;
const niepuste = () => h.POLA_HINTS.filter(p => {
  const v = st[p];
  return v != null && !(typeof v === 'object' && !Object.keys(v).length);
});
A('goHintsKwal')(); A('ustawPrzeszkolenieHints')('tak'); A('pomijajKwalifikacje')('symulacja');
A('zacznijBadanieHints')(); A('ustawSkladowaHints')('hit', 'sakadaP'); A('ustawSkladowaHints')('skew', 'brak');
A('ustawPowodNiewiarHints')('brakZniesieniaFiksacji');
const hintsPrzed = niepuste();
T('K3p0/czulosc-badanie-wypelnione',
  hintsPrzed.includes('hintsBadanie') && Object.keys(st.hintsBadanie).length >= 1 && hintsPrzed.length >= 4,
  `przed zakończeniem muszą być wypełnione ODPOWIEDZI, nie tylko kwalifikacja — inaczej K3p przechodzi na pół pustym stanie (jest: ${hintsPrzed})`);
const prefPrzed = Object.fromEntries(h.POLA_PREFERENCJI.map(p => [p, st[p]]));
A('zakonczSesje')();
eq('K3j/ekran-startowy', st.screen, 'start');
{
  const zostalo = ['canal', 'maneuverKey', 'plan', 'testKey', 'dixObs'].filter(k => st[k] != null);
  eq('K3k/dane-przypadku-skasowane', zostalo, []);
  eq('K3l/kontrole-skasowane', st.kontrole, []);
  eq('K3m/odcisk-manewru-skasowany', st.flow.maneuver, null);
  eq('K3n/strona-domyslna', [st.side, st.sideZrodlo, st.variant, st.variantZrodlo], ['P', null, 'canalo', null]);
  /* Preferencje bierzemy z LISTY MODUŁU, nie z ręcznego wyliczenia w wyroczni: ręczna lista
     wymieniała 3 z 7 pól i to właśnie takie listy przeoczyły pola HINTS. */
  const zmienione = h.POLA_PREFERENCJI.filter(p => JSON.stringify(st[p]) !== JSON.stringify(prefPrzed[p]));
  eq('K3o/preferencje-zostaja', zmienione, []);
  /* K3p: KAŻDE pole badania HINTS wraca do stanu pustego — lista czytana z hints-state, więc pole
     dołożone w przyszłym bloku wchodzi pod bramkę bez dopisywania go tutaj. Bez tej bramki
     odpowiedzi poprzedniego pacjenta witały następnego, a sygnał `hints` z pwa-model trzymał
     „otwarty przypadek" na zawsze, blokując automatyczne wdrożenie aktualizacji (Blok 16 K3). */
  eq('K3p/badanie-hints-skasowane', niepuste(), []);
}
/* Przycisk zakończenia NIE MOŻE się dublować. Przy wyniku „ustąpienie" zakończenie jest krokiem
   GŁÓWNYM, a karta końcowa istnieje zawsze — pierwsza wersja rysowała więc dwa identycznie
   podpisane przyciski obok siebie. Znalezione CZYTANIEM gotowego ekranu, nie bramką, więc bramka
   powstaje teraz: akcent kroku głównego przenosi się na kartę końcową zamiast dublować przycisk. */
czysty(); A('startManeuver')('epley'); A('zakonczSerie')(); A('ustawWynikKontroli')('ustapienie');
eq('K3q/jeden-przycisk-konca', (app().match(/pytajOZakonczeniu\(true\)/g) || []).length, 1);
T('K3r/akcent-glownego-kroku', /class="recoprimary fukoniec"/.test(app()),
  'po ustąpieniu zakończenie sesji jest krokiem głównym, więc to ono ma akcent');
// KONTROLA CZUŁOŚCI: gdy krokiem głównym jest co innego, karta końcowa jest drugorzędna.
czysty(); A('startManeuver')('epley'); A('zakonczSerie')(); A('ustawWynikKontroli')('brakPoprawy');
T('K3s/czulosc-akcent', /class="recoalt fukoniec"/.test(app()) && /class="recoprimary" onclick="kontrolaAkcja\('powtorzManewr'\)"/.test(app()),
  'przy niedomkniętym procesie akcent należy do repozycji, nie do wyjścia');
// KONTROLA CZUŁOŚCI: „Wróć" z potwierdzenia NIE kasuje niczego.
czysty(); A('startManeuver')('epley'); A('zakonczSerie')(); A('ustawWynikKontroli')('ustapienie');
A('pytajOZakonczeniu')(true); A('pytajOZakonczeniu')(false);
T('K3p/czulosc-anulowanie', st.kontrole.length === 1 && st.flow.maneuver != null && st.screen === 'followup',
  'anulowanie zakończenia zostawia sesję nietkniętą');

/* ═══════════ G. HISTORIA SERII ═══════════
   Powtórzenie manewru to NOWE wykonanie: własny wpis i własna kontrola. Bez tego trzy powtórzenia
   wyglądałyby w podsumowaniu jak jedno podejście. */
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('czesciowaPoprawa');
A('kontrolaAkcja')('powtorzManewr');
eq('SE1/powtorka-otwiera-manewr', st.screen, 'guide');
eq('SE2/ten-sam-manewr', st.plan.key, 'epley');
eq('SE3/kontrola-nowa', st.flow.maneuver.kontrolaIdx, undefined);
A('zakonczSerie')(); A('ustawWynikKontroli')('ustapienie');
eq('SE4/dwa-wpisy', st.kontrole.map(k => k.wynik), ['czesciowaPoprawa', 'ustapienie']);
T('SE5/historia-na-ekranie', /Przebieg serii/.test(app()) && /częściowa poprawa/.test(app()),
  'historia serii musi być widoczna, a nie tylko w stanie');
T('SE6/czasy-nazwane-planowymi', /czasy z planu/.test(app()) && /nie z pomiaru u pacjenta/.test(app()),
  'czasy z planu NIE MOGĄ udawać czasu wykonania u pacjenta');
// Ponowne dotkniecie tej samej odpowiedzi ja COFA (gest jak przy `wystapil` w karcie obserwacji).
A('ustawWynikKontroli')('ustapienie');
eq('SE7/cofniecie-odpowiedzi', st.kontrole[1].wynik, null);
T('SE8/cofniecie-nie-usuwa-wpisu', st.kontrole.length === 2, 'wpis zostaje — indeksy wskazuja pozycje tablicy');

/* ═══════════ H. POWÓD NIEWIARYGODNOŚCI ═══════════
   Słownik jest TEN SAM co w karcie obserwacji (Blok 8) — drugi egzemplarz znaczyłby, że
   „niewiarygodne" w dwóch krokach może zacząć znaczyć co innego. */
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('niewiarygodne');
T('NW1a/pyta-o-powod', /Dlaczego nie da się ocenić/.test(app()), 'ekran musi zapytać o powód');
T('NW1b/slownik-bloku-8', /ograniczenie ruchomości szyi/.test(app()) && /brak okularów Frenzla/.test(app()),
  'powody pochodzą ze słownika Bloku 8');
T('NW1c/sprzecznosc-bez-powodu', /nie podano powodu niewiarygodności/.test(app()), 'brak powodu musi być nazwany');
A('ustawPowodKontroli')('szyja');
eq('NW1d/powod-we-wpisie', st.kontrole[0].powod, 'szyja');
T('NW1e/sprzecznosc-znika', !/nie podano powodu niewiarygodności/.test(app()), 'po podaniu powodu uwaga znika');
// Zmiana wyniku na inny KASUJE powod — zostawiony wrocilby po cichu przy ponownym wyborze.
A('ustawWynikKontroli')('ustapienie');
eq('NW1f/powod-skasowany', st.kontrolaPowod, null);

/* ═══════════ I. PASEK PRZEBIEGU WIDZI KONTROLĘ ═══════════
   Krok „Kontrola" przestał być `pending`, więc pasek musi pokazywać jego RZECZYWISTY stan.
   „Niewiarygodne" NIE jest zakończeniem — to ta sama zasada, którą Blok 8 postawił przy
   lateralizacji. */
const mapa = () => [...win.document.querySelectorAll('#flowsteps .flowstep')].map(li => li.className);
czysty(); A('startManeuver')('epley'); A('zakonczSerie')(); A('syncShell')();
T('PA1/kontrola-aktywna', /flowstep--active/.test(mapa()[5]), 'na ekranie kontroli krok jest aktywny');
T('PA2/nie-w-przygotowaniu', !/flowstep--pending/.test(mapa()[5]), 'krok Kontrola nie jest już „w przygotowaniu"');
A('ustawWynikKontroli')('ustapienie'); A('syncShell')();
T('PA3/po-wyniku-done', /flowstep--done|flowstep--active/.test(mapa()[5]), 'zapisany wynik nie może zostawiać kroku niewykonanego');
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('niewiarygodne'); st.screen = 'setup'; A('render')(); A('syncShell')();
T('PA4/niewiarygodne-w-pasku', /flowstep--unreliable/.test(mapa()[5]),
  'kontrola oznaczona jako niewiarygodna NIE MOŻE meldować kroku jako zakończonego');
// KONTROLA CZUŁOŚCI: ten sam stan z wynikiem wiarygodnym daje „zakończony".
czysty(); A('startManeuver')('epley'); A('zakonczSerie')();
A('ustawWynikKontroli')('ustapienie'); st.screen = 'setup'; A('render')(); A('syncShell')();
T('PA5/czulosc-done', /flowstep--done/.test(mapa()[5]), 'wiarygodny wynik zamyka krok');
// Nowy manewr ZERUJE streszczenie kontroli — inaczej pasek meldowalby kontrole nad manewrem,
// ktorego nikt jeszcze nie skontrolowal.
A('startManeuver')('semont'); A('syncShell')();
T('PA6/nowy-manewr-zeruje', !/flowstep--done/.test(mapa()[5]), 'nowy manewr nie dziedziczy cudzej kontroli');

/* ═══════════ J. PORÓWNANIE PRZED I PO ═══════════
   Opis sprzed manewru jest KOPIOWANY w chwili uznania manewru za wykonany — rekordy obserwacji są
   kluczowane próbą, więc opisanie próby kontrolnej nadpisuje opis sprzed manewru. */
czysty(); st.mode = 'diag';
A('openTest')('dix'); A('goObs')();
A('setObsPole') && A('setObsPole')('dix', 'wystapil', 'tak');
A('startManeuver')('epley'); A('zakonczSerie')();
T('PP1/karta-jest', /Przed i po/.test(app()), 'karta porównania musi istnieć');
// Brak kopii sprawdzamy WARUNKIEM, nie dostępem do pola: bez tego wyrocznia wywalałaby się
// wyjątkiem zamiast zgłosić czytelne naruszenie (zmierzone na mutacji failing-first).
T('PP2/kopia-zdjeta', !!(st.flow.maneuver.opisPrzed && st.flow.maneuver.opisPrzed.pola !== undefined), 'kopia opisu sprzed manewru musi powstać');
T('PP3/mowi-czego-nie-wie', /nie opisano jeszcze cecha po cesze|nie opisano/.test(app()),
  'karta musi przyznać, że kontrola nie została opisana cechą po cesze');
// Opis PO manewrze nie nadpisuje kolumny „przed".
A('goObs')(); A('setObsPole')('dix', 'wystapil', 'nie');
eq('PP4/przed-nietkniete', (st.flow.maneuver.opisPrzed || {}).wystapil, 'tak');
eq('PP5/po-zmienione', st.obs.dix.wystapil, 'nie');

/* ═══════════ K. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 70;
if (bledy.length) {
  console.error(`✗ fu:dom — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ fu:dom — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  process.exit(1);
}
console.log(`✓ fu:dom — ${ok} przypadkow, ekran i akcje kontroli zgodne.`);
