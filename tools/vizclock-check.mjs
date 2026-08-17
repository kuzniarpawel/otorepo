/* OTOREPO — wyrocznia zegara wizualizacji (Blok 7).
 *
 * Dlaczego to jest KONIECZNE, a nie miłe: tools/snapshot.mjs podmienia requestAnimationFrame
 * na no-op (funkcja neuter()), więc ŻADNA animacja i żadne sterowanie odtwarzaniem nie jest
 * objęte wyrocznią golden. Bez tego pliku pauza i prędkość byłyby jedyną częścią aplikacji
 * bez jakiejkolwiek bramki — a jedna z nich (0,5×) sąsiaduje z KLINICZNYM licznikiem czasu
 * utrzymania pozycji, który dzieli z animacją tę samą pętlę rAF.
 *
 * Uruchomienie: npm run viz:check
 */
import { createVizClock, vizClock, VIZ_STEP_MS, VIZ_SPEEDS } from '../src/runtime/viz-clock.js';

let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

/* ============ 1. Tożsamość przy 1× — najważniejsza własność ============
   Użytkownik, który nie dotknie sterowania, MUSI dostać zachowanie identyczne ze stanem sprzed
   Bloku 7. Inaczej wprowadzenie sterowania byłoby po cichu zmianą modelu klinicznego: obwiednia
   ξ(t) opisuje realny zanik oczopląsu w czasie. */
{
  const c = createVizClock();
  c.now(1000);                                   // pierwsze wywołanie tylko przypina zegar
  eq('TZ1/pierwsze-nie-skacze', c.peek(), 0);
  eq('TZ2/przyrost-1do1', c.now(1500), 500);
  eq('TZ3/kumulacja', c.now(2000), 1000);
  // Suma dowolnie posiekanych przyrostów = przyrost całkowity (brak dryfu numerycznego).
  const a = createVizClock(), b = createVizClock();
  a.now(0); b.now(0);
  for (let i = 1; i <= 100; i++) a.now(i * 7.3);
  b.now(100 * 7.3);
  T('TZ4/bez-dryfu', Math.abs(a.peek() - b.peek()) < 1e-9, `posiekany ${a.peek()} vs jednorazowy ${b.peek()}`);
}

/* ============ 2. Prędkość ============ */
{
  const c = createVizClock(); c.now(0);
  c.setSpeed(0.5);
  eq('PR1/polowa', c.now(1000), 500);
  c.setSpeed(1);
  eq('PR2/powrot-do-1', c.now(2000), 1500);      // 500 + 1000
  eq('PR3/dozwolone', VIZ_SPEEDS, [1, 0.5]);
  // Wartość spoza listy MUSI wracać do 1×, a nie zostawiać zegara w nieznanym stanie.
  eq('PR4/spoza-listy', c.setSpeed(7), 1);
  eq('PR5/ujemna', c.setSpeed(-1), 1);
  eq('PR6/zero-odrzucone', c.setSpeed(0), 1);    // 0 to NIE pauza — pauza ma własny przełącznik
}

/* ============ 3. Pauza ============ */
{
  const c = createVizClock(); c.now(0); c.now(1000);
  c.setPaused(true);
  eq('PA1/stoi', c.now(5000), 1000);
  eq('PA2/dalej-stoi', c.now(9000), 1000);
  c.setPaused(false);
  // Po wznowieniu czas NIE MOŻE nadrobić przerwy — inaczej pauza byłaby tylko zasłonięciem obrazu.
  eq('PA3/bez-nadrabiania', c.now(9500), 1500);
  const d = createVizClock(); d.now(0);
  eq('PA4/toggle-w-dol', d.toggle(), true);
  eq('PA5/toggle-w-gore', d.toggle(), false);
  T('PA6/isPaused', !d.isPaused(), 'stan pauzy odczytywalny');
}

/* ============ 4. Krok przy zatrzymanym obrazie ============ */
{
  const c = createVizClock(); c.now(0); c.now(1000);
  // Poza pauzą krok nic nie robi: przesunięcie biegnącego zegara dałoby skok nieodróżnialny
  // od zacięcia animacji.
  c.step();
  eq('KR1/bez-pauzy-nic', c.peek(), 1000);
  c.setPaused(true);
  c.step();
  eq('KR2/z-pauza-przesuwa', c.peek(), 1000 + VIZ_STEP_MS);
  c.step(300);
  eq('KR3/wlasna-wartosc', c.peek(), 1000 + VIZ_STEP_MS + 300);
  c.step(-500);
  eq('KR4/nie-cofa', c.peek(), 1000 + VIZ_STEP_MS + 300);
  // 120 ms to około 1/6 okresu uderzenia (pętle T=720-780 ms) — dość, by rozróżnić fazę wolną
  // od szybkiej, za mało, by przeskoczyć cały cykl. Ta liczba jest decyzją, więc jest przypięta.
  T('KR5/rozmiar-kroku', VIZ_STEP_MS >= 80 && VIZ_STEP_MS <= 200, `krok ${VIZ_STEP_MS} ms poza sensownym zakresem`);
  T('KR6/krok-mniejszy-od-okresu', VIZ_STEP_MS * 3 < 720, 'krok musi dzielić okres uderzenia na kilka faz');
}

/* ============ 5. Monotoniczność — obwiednia ξ(t) nie może płynąć wstecz ============ */
{
  const c = createVizClock(); c.now(1000);
  eq('MN1/cofniety-zegar', c.now(500), 0);       // zegar systemowy cofnięty → zero przyrostu
  // Po cofnięciu zegar PRZYJMUJE NOWY punkt odniesienia (ostatniReal=500) i liczy dalej od niego.
  // To celowe: alternatywa (trzymanie starego punktu) zamroziłaby animację na zawsze po
  // jednorazowym cofnięciu zegara systemowego, a taki błąd jest niediagnozowalny dla użytkownika.
  eq('MN2/re-kotwiczenie', c.now(1500), 1000);
}
{
  // Doprecyzowanie MN2: po cofnięciu zegar przyjmuje nowy punkt odniesienia, więc kolejny
  // przyrost liczy się OD NIEGO. Sprawdzamy, że wynik nigdy nie maleje.
  const c = createVizClock();
  let poprz = 0, spadki = 0;
  const czasy = [0, 100, 250, 200, 400, 399, 1000, 5, 1200];
  for (const r of czasy) { const v = c.now(r); if (v < poprz) spadki++; poprz = v; }
  eq('MN3/zero-spadkow', spadki, 0);
}

/* ============ 6. Rozpięcie po render() ============
   cancelAnims() kasuje wszystkie pętle przy każdym przerysowaniu, a nowe zapisują swój `start`
   z bieżącego czasu wirtualnego. Między renderami może upłynąć dowolnie dużo czasu rzeczywistego
   (użytkownik czyta ekran). Bez rozpięcia pierwsza klatka po renderze doliczyłaby całą tę
   przerwę i animacja wystartowałaby w połowie zaniku — czyli oczopląs pojawiłby się już wygasły. */
{
  const c = createVizClock(); c.now(0); c.now(100);
  c.detach();
  eq('RZ1/detach-nie-zmienia-czasu', c.peek(), 100);
  eq('RZ2/po-detach-brak-skoku', c.now(60000), 100);   // pierwsze wywołanie tylko przypina
  eq('RZ3/dalej-normalnie', c.now(60500), 600);
  T('RZ4/snapshot-mowi-o-przypieciu', c.snapshot().przypiety === true, 'snapshot musi ujawniać, czy zegar jest przypięty');
}

/* ============ 7. Reset i niezależność instancji ============ */
{
  const c = createVizClock(); c.now(0); c.now(2000); c.setSpeed(0.5); c.setPaused(true);
  c.reset();
  eq('RS1/czas-zerowany', c.peek(), 0);
  // Reset dotyczy CZASU, nie preferencji odtwarzania: użytkownik, który wybrał 0,5×, nie chce
  // wracać do 1× po każdym resecie obrazu.
  eq('RS2/predkosc-zostaje', c.getSpeed(), 0.5);
  T('RS3/pauza-zostaje', c.isPaused(), 'reset nie wznawia odtwarzania sam z siebie');
  const a = createVizClock(), b = createVizClock();
  a.now(0); a.now(1000); b.now(0);
  eq('RS4/niezalezne', b.peek(), 0);
}

/* ============ 8. PAUZA × PRĘDKOŚĆ — iloczyn, nie suma ============
   Luka znaleziona przez krytykę adwersaryjną: sekcja „Prędkość" nigdy nie pauzowała, sekcja
   „Pauza" chodziła na domyślnym 1×, a sekcja „Reset" ustawiała oba, ale potem wołała już tylko
   reset/peek/getSpeed/isPaused — ani razu now(). Iloczynu nie dotykał ŻADEN z 40 przypadków,
   więc mutacja `if (!paused)` → `if (!paused || speed !== 1)` przechodziła 40/40 na zielono.
   Dla użytkownika znaczyłoby to: wybiera 0,5×, klika Pauzę, pasek pisze „obraz zatrzymany”,
   a złóg i oczopląs idą dalej. */
{
  const c = createVizClock(); c.now(0);
  c.setSpeed(0.5);
  eq('PS1/polowa-idzie', c.now(1000), 500);
  c.setPaused(true);
  // TO jest przypadek, który przepuszczał mutację: pauza MUSI działać także poza 1×.
  eq('PS2/pauza-przy-polowie', c.now(3000), 500);
  eq('PS3/dalej-stoi', c.now(9000), 500);
  c.setSpeed(1);
  eq('PS4/zmiana-predkosci-w-pauzie-nie-rusza', c.now(11000), 500);
  c.setPaused(false);
  // Po wznowieniu liczy się NOWA prędkość i tylko czas OD wznowienia — zero nadrabiania przerwy.
  eq('PS5/wznowienie-bez-nadrabiania', c.now(12000), 1500);
}
{
  // Krok przy zatrzymanym obrazie to przesunięcie w MATERIALE, więc nie skaluje się prędkością
  // podglądu: przy 0,5× ma dać te same 120 ms, a nie 60. Druga mutacja, która przechodziła 40/40.
  const c = createVizClock(); c.now(0); c.now(1000);
  c.setSpeed(0.5); c.setPaused(true);
  eq('PS6/krok-nieskalowany', c.step(), 1000 + VIZ_STEP_MS);
  eq('PS7/krok-jawny-nieskalowany', c.step(300), 1000 + VIZ_STEP_MS + 300);
  c.setPaused(false);
  eq('PS8/wznowienie-od-przesunietego', c.now(2000), 1000 + VIZ_STEP_MS + 300 + 500);
}

/* ============ 9. Zasięg sterowania: ekran bez pilota gra normalnie ============
   Zegar jest jeden, a pasek renderuje się tylko na ekranie „Próba”. Bez tego zawężenia pauza
   jechała z użytkownikiem na ekran manewru i do HINTS — obraz stawał, kontrolki nie było,
   a kliniczny licznik utrzymania pozycji odliczał dalej nad nieruchomym złogiem. */
{
  const c = createVizClock(); c.now(0); c.now(1000);
  c.setSpeed(0.5); c.setPaused(true); c.step();
  const czasPrzed = c.peek();
  T('ZA1/zglasza-zmiane', c.wymusOdtwarzanie() === true, 'wywołujący musi móc odróżnić realną zmianę od stanu spoczynkowego');
  T('ZA2/gra', !c.isPaused() && c.getSpeed() === 1, 'ekran bez pilota MUSI grać 1× bez pauzy');
  // Wymuszenie dotyczy PRĘDKOŚCI, nie pozycji w materiale: zerowanie czasu cofnęłoby oczopląs
  // na ekranie, na który użytkownik dopiero wchodzi.
  eq('ZA3/czas-nietkniety', c.peek(), czasPrzed);
  T('ZA4/idempotentne', c.wymusOdtwarzanie() === false, 'drugie wywołanie nie zgłasza zmiany');
  const d = createVizClock(); d.now(0); d.now(500); d.detach();
  d.wymusOdtwarzanie();
  T('ZA5/nie-przypina', d.snapshot().przypiety === false,
    'wymuszenie nie może przypiąć zegara — inaczej pierwsza klatka po renderze doliczyłaby całą przerwę');
  // Po wymuszeniu przyrost musi być 1:1 z czasem rzeczywistym.
  d.now(10000); eq('ZA6/po-wymuszeniu-1do1', d.now(10500), 1000);
}
{
  // Strażnik montażu: sama metoda nie chroni niczego, dopóki render() jej nie woła. Skan po
  // źródle, bo golden nie widzi animacji (rAF jest zneutralizowany), a tej linii nie widzi też
  // żaden inny test — bez tego przypadku usunięcie jej byłoby cichą regresją.
  const fs = await import('node:fs');
  const rend = fs.readFileSync(new URL('../src/render/svg-screens.js', import.meta.url), 'utf8');
  const ciało = (rend.match(/function render\(\)\{[\s\S]*?\n\}/) || [''])[0];
  T('ZA7/straznik-w-render', /wymusOdtwarzanie\(\)/.test(ciało),
    'render() musi wymuszać odtwarzanie na ekranie bez paska sterowania');
  T('ZA8/warunek-na-obecnosci-paska', /querySelector\((["'`])\.vizbar\1\)/.test(ciało),
    'warunek MUSI stać na obecności paska, nie na liście nazw ekranów — lista rozjedzie się po cichu');

  /* KAŻDA klatka planowana z modułu ekranów MUSI iść przez rejestr (loopRAF / rafOnce).
     Rozruch ekranu planowany gołym requestAnimationFrame jest niekasowalny przez cancelAnims(),
     więc dwa render()-y w jednej turze zostawiają dwie zaległe funkcje rozruchowe — obie odpalają
     w tej samej klatce i każda startuje własną pętlę. Na ekranie manewru daje to KLINICZNY LICZNIK
     N RAZY SZYBSZY (zmierzone 1,00 / 2,01 / 3,00 dla jednego, dwóch i trzech przerysowań), czyli
     „utrzymaj 30 s" odliczone w 15 s realnych. Golden tego nie widzi, bo neuter() zabija rAF. */
  const goleRAF = (rend.match(/(?<!\.)\brequestAnimationFrame\s*\(/g) || []).length;
  T('ZA9/bez-golych-rAF', goleRAF === 0,
    `w module ekranów zostało ${goleRAF} gołych requestAnimationFrame — rozruch musi iść przez rafOnce/loopRAF`);
  T('ZA10/skan-dziala', (rend.match(/\brafOnce\s*\(/g) || []).length > 0,
    'kontrola skanu: moduł musi w ogóle używać rafOnce, inaczej ZA9 przechodzi na pustym wzorcu');
}

/* ============ 10. Singleton aplikacji ============ */
T('SG1/istnieje', vizClock && typeof vizClock.now === 'function', 'aplikacja potrzebuje jednej instancji');
T('SG2/domyslnie-1x', vizClock.getSpeed() === 1 && !vizClock.isPaused(),
  'domyślnie zegar musi być nieodróżnialny od stanu sprzed Bloku 7');

/* ============ 11. Czystość modułu ============ */
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/runtime/viz-clock.js', import.meta.url), 'utf8');
  const kod = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  T('CZ1/bez-importow', !/^\s*import\s/m.test(kod), 'zero importów — wyrocznia w gołym Node');
  T('CZ2/bez-dom', !/\b(document|window|navigator|localStorage)\b/.test(kod), 'zero DOM');
  // Czas rzeczywisty MUSI wchodzić argumentem: własne performance.now() w środku uczyniłoby
  // moduł nietestowalnym deterministycznie i zaszyło zegar w miejscu, którego nie widać.
  T('CZ3/czas-argumentem', !/performance\s*\.\s*now|Date\.now|new Date/.test(kod), 'czas rzeczywisty wchodzi argumentem');
  T('CZ4/bez-rAF', !/requestAnimationFrame/.test(kod), 'zegar nie planuje klatek — od tego jest loopRAF');
  T('CZ5/skan-dziala', /performance\s*\.\s*now/.test(src) && !/performance\s*\.\s*now/.test(kod),
    'kontrola skanu: wzorzec musi być w komentarzu i znikać po jego wycięciu');
}

/* ============ Wynik ============ */
const razem = ok + bledy.length;
console.log(`\nOTOREPO — wyrocznia zegara wizualizacji (Blok 7)`);
console.log(`przypadki     : ${razem}`);
console.log(`krok          : ${VIZ_STEP_MS} ms · prędkości: ${VIZ_SPEEDS.join('× / ')}×`);
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
const OCZEKIWANE = 58;   // 40 (Blok 7) + 8 (pauza × prędkość) + 10 (zasięg sterowania i rejestr klatek) — po krytyce
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — zegar wizualizacji zgodny (${razem} przypadków).`);
