/* OTOREPO — WYROCZNIA GENERATORA OPISU I ZAPISU SESJI (Blok 15). Czysty model, gołe Node.
 *
 * Trzy pytania, na które ta wyrocznia odpowiada POMIAREM, a nie deklaracją:
 *   1. czy opis ŚLEDZI stan (kryterium odbioru nr 1) — sprawdzane mutacją: zmiana kanału, strony,
 *      mechanizmu, wyniku kontroli i tolerancji MUSI zmienić tekst, a zmiana pola nieklinicznego
 *      NIE MOŻE go zmienić;
 *   2. czy opis nie twierdzi więcej, niż zapisano — strona i mechanizm bez ŹRÓDŁA nie mają prawa
 *      pojawić się jako wartość, a instancja odrzucona jako niewiarygodna nie ma prawa wejść
 *      do opisu jako stwierdzenie;
 *   3. czy do zapisu sesji da się wcisnąć cokolwiek spoza słowników (strażnik danych osobowych).
 *
 * Uruchomienie: npm run opis:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { state } from '../src/app/state.js';
state.lang = 'pl';
const { SEKCJE, SEKCJE_IDS, sekcja, POWODY_BRAKU, POWODY_BRAKU_IDS, ZRODLA, ZRODLA_IDS,
  raport, tekst, domyslneSekcje, przelaczSekcje, POLA_PACJENTA, POLA_SESJI, POLA_ULOTNE,
  jestCoZapisac, rekordSesji, nadajId, KSZTALT_ID, podpisSesji, bezDanychOsobowychSesji,
  przywrocenie, ULOTNE_PO_ODTWORZENIU, pakietEksportu, KODY_EKSPORTU, WERSJA_SESJI } = await import('../src/app/opis-model.js');
const { opisDeps } = await import('../src/app/opis-deps.js');
const { TOLERANCJE, TOLERANCJA_IDS, WYNIKI, SPRZECZNOSCI, spojnoscWyniku, POLA_WPISU } = await import('../src/app/followup-model.js');
const { followupDeps } = await import('../src/app/followup-deps.js');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

/* Przypadek odniesienia — pełny przebieg: wywiad, opisana próba, interpretacja, manewr, kontrola. */
const PELNY = () => ({
  // D-CZAS (2026-08-21): doszlo piate pytanie kwalifikacji (czas od poczatku) — przypadek
  // odniesienia dostaje odpowiedz, zeby byl KOMPLETNY tak jak przed zmiana.
  triage: { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'tak', flagi: ['brak'] },
  testKey: 'dix', canal: 'posterior', side: 'P', sideZrodlo: 'wybrany',
  variant: 'canalo', variantZrodlo: 'wyprowadzony',
  dixObs: 'post', dixRep: 0, diagCentral: false, size: 'medium', trybCzasu: 'staly', decisionSeq: 4,
  maneuverKey: 'epley',
  obs: { dix: { proba: 'dix', wystapil: 'tak', pola: { 'pion#jedyna': { w: 'p1' }, 'torsja#jedyna': { w: 'p1' }, latencja: { w: '1-5s' } } } },
  obsOdciski: {},
  kontrole: [{ manewr: 'epley', kanal: 'posterior', strona: 'P', mechanizm: 'canalo', czasy: [null, 30, 30],
               czasySkad: 'plan', wynik: 'ustapienie', powod: null, tolerancja: 'dobra', viaInterpret: true }],
  kontrolaPowod: null,
  flow: { testSeen: true, obsSeen: true, interpretSeen: true,
          maneuver: { key: 'epley', viaInterpret: true, planSide: 'P', canal: 'posterior', consumed: false,
                      zatarte: false, inputs: { testKey: 'dix', variant: 'canalo', dixObs: 'post', side: 'P', central: false, obsOdcisk: null },
                      kontrolaIdx: 0 } },
});
const PUSTY = () => ({ side: 'P', variant: 'canalo', canal: null, obs: {}, obsOdciski: {}, triage: {}, kontrole: [], flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null } });
const D = (s) => opisDeps(s);
const TXT = (s) => tekst(raport(s, D(s)));

/* ═══════════ A. STRUKTURA OPISU ═══════════ */
{
  eq('A1/liczba-sekcji', SEKCJE.length, 8);
  T('A2/id-unikalne', new Set(SEKCJE_IDS).size === SEKCJE.length, 'identyfikatory sekcji się powtarzają');
  for (const s of SEKCJE) {
    T(`A3/${s.id}-dwujezyczna`, !!(s.pl && s.en && s.pl !== s.en), `sekcja ${s.id} nie ma obu języków`);
    T(`A4/${s.id}-w-raporcie`, raport(PELNY(), D(PELNY())).sekcje.some(x => x.id === s.id), `sekcji ${s.id} nie ma w raporcie`);
  }
  const obow = SEKCJE.filter(s => s.obowiazkowa);
  eq('A5/jedna-obowiazkowa', obow.length, 1);
  eq('A6/obowiazkowa-to-zastrzezenie', obow[0].id, 'zastrzezenie');
  T('A7/powody-braku-dwujezyczne', POWODY_BRAKU_IDS.every(id => POWODY_BRAKU[id].pl && POWODY_BRAKU[id].en), 'powód braku bez tłumaczenia');
  T('A8/zrodla-dwujezyczne', ZRODLA_IDS.every(id => ZRODLA[id].pl && ZRODLA[id].en), 'źródło bez tłumaczenia');
  // Każdy wiersz ma etykietę i albo wartość, albo POWÓD braku — milczenia nie ma.
  const r = raport(PELNY(), D(PELNY()));
  for (const sek of r.sekcje) for (const w of sek.wiersze) {
    T(`A9/${sek.id}-etykieta`, !!w.etykieta, `wiersz bez etykiety w ${sek.id}`);
    T(`A10/${sek.id}-wartosc-albo-powod`, w.wartosc != null || POWODY_BRAKU_IDS.includes(w.brak), `wiersz bez wartości i bez powodu w ${sek.id}`);
  }
}

/* ═══════════ B. KRYTERIUM ODBIORU NR 1 — OPIS ŚLEDZI STAN ═══════════
   „Opis zgadza się z aktualnym stanem kroków i aktualizuje po zmianie rozpoznania."
   Mierzone mutacją, nie deklaracją. Każda mutacja klinicznie znacząca MUSI zmienić tekst. */
{
  const baza = TXT(PELNY());
  const mutacje = [
    ['kanal', s => { s.canal = 'horizontal'; }],
    ['strona-wartosc', s => { s.side = 'L'; s.kontrole[0].strona = 'L'; s.flow.maneuver.planSide = 'L'; }],
    ['strona-zrodlo', s => { s.sideZrodlo = null; }],
    ['mechanizm', s => { s.variant = 'cupulo'; }],
    ['mechanizm-zrodlo', s => { s.variantZrodlo = 'nadpisany'; }],
    ['obraz-osrodkowy', s => { s.diagCentral = true; }],
    ['wynik-kontroli', s => { s.kontrole[0].wynik = 'brakPoprawy'; }],
    ['tolerancja', s => { s.kontrole[0].tolerancja = 'wymioty'; }],
    ['manewr', s => { s.kontrole[0].manewr = 'semont'; }],
    ['czasy-skad', s => { s.kontrole[0].czasySkad = 'planPodniesiony'; }],
    ['opis-oczoplasu', s => { s.obs.dix.pola['pion#jedyna'] = { w: 'm1' }; }],
    ['wywiad', s => { s.triage.przebieg = 'ciagle'; }],
    ['flagi', s => { s.triage.flagi = ['ataksja']; }],
    ['druga-proba', s => { s.obs.roll = { proba: 'roll', wystapil: 'tak', pola: { 'poziom#prawoWDole': { w: 'p1' } } }; }],
    ['druga-kontrola', s => { s.kontrole.push({ ...s.kontrole[0], wynik: 'czesciowaPoprawa', tolerancja: null }); }],
  ];
  for (const [nazwa, mut] of mutacje) {
    const s = PELNY(); mut(s);
    T(`B1/${nazwa}-zmienia-opis`, TXT(s) !== baza, `mutacja „${nazwa}" nie zmieniła opisu — opis nie śledzi stanu`);
  }
  // KONTROLA CZUŁOŚCI W DRUGĄ STRONĘ: pola niekliniczne NIE MAJĄ prawa ruszyć opisu. Bez tego
  // bramka wyżej przechodziłaby także dla generatora, który wypisuje cały stan bez wyboru.
  const obojetne = [
    ['tryb-3d', s => { s.view3d = true; }],
    ['obszar', s => { s.area = 'learn'; }],
    ['mapa-krokow', s => { s.stepMapOpen = true; }],
    ['grupa-pytan', s => { s.obsGrupa = 'kierunek'; }],
    ['stanowisko-lab', s => { s.labStanowisko = 'B'; }],
    ['licznik-decyzji', s => { s.decisionSeq = 99; }],
  ];
  for (const [nazwa, mut] of obojetne) {
    const s = PELNY(); mut(s);
    T(`B2/${nazwa}-nie-zmienia-opisu`, TXT(s) === baza, `zmiana „${nazwa}" ruszyła opis badania`);
  }
  // Opis NIE JEST PRZECHOWYWANY: dwa wywołania na tym samym stanie dają to samo, a stan po
  // policzeniu raportu nie zyskuje żadnego pola z tekstem.
  const s2 = PELNY(); const przed = JSON.stringify(s2);
  const a = TXT(s2), b = TXT(s2);
  T('B3/powtarzalny', a === b, 'dwa policzenia tego samego stanu dały różny opis');
  T('B4/bez-skutkow-ubocznych', JSON.stringify(s2) === przed, 'policzenie opisu zmieniło stan');
}

/* ═══════════ C. ANI JEDNEGO SŁOWA KLINICZNEGO WŁASNEGO ═══════════
   Nie czytamy kodu — mierzymy zachowanie: podmiana etykiety w SŁOWNIKU musi zmienić opis.
   Jeśli nie zmienia, znaczy, że model ma własną kopię tej nazwy. */
{
  const s = PELNY();
  const podmien = (pole, wartosc) => {
    const d = D(s); const oryg = d[pole];
    d[pole] = (...args) => { const v = oryg(...args); return v == null ? v : wartosc; };
    return tekst(raport(s, d));
  };
  const baza = TXT(s);
  const pola = ['kanalLabel', 'stronaLabel', 'mechanizmLabel', 'manewrLabel', 'wynikLabel', 'tolerancjaLabel', 'probaLabel', 'czasySkadLabel'];
  for (const p of pola) {
    const zmieniony = podmien(p, 'ZNACZNIK_TESTOWY');
    T(`C1/${p}-ze-slownika`, zmieniony !== baza && /ZNACZNIK_TESTOWY/.test(zmieniony),
      `etykieta ${p} nie pochodzi ze słownika — model ma własną kopię`);
  }
  // Kontrola czułości: bez podmiany tekst musi być identyczny (inaczej bramka wyżej mierzy szum).
  T('C2/kontrola-czulosci', tekst(raport(s, D(s))) === baza, 'ten sam stan i te same słowniki dały inny opis');
  // Wartości opisu oczopląsu też muszą iść ze słownika pól obserwacji.
  {
    const d = D(s); const oryg = d.wartoscPola;
    d.wartoscPola = (pole, v) => { const o = oryg(pole, v); return o ? { pl: 'ZNACZNIK_WARTOSCI', en: 'ZNACZNIK_WARTOSCI' } : o; };
    T('C3/wartosci-obserwacji', /ZNACZNIK_WARTOSCI/.test(tekst(raport(s, d))), 'wartości opisu oczopląsu nie idą ze słownika');
  }
  // Rady aplikacji NIE wchodzą do opisu: akapit `tresc` z modelu kwalifikacji nie ma prawa się pojawić.
  {
    const czerwony = PELNY(); czerwony.triage.flagi = ['ataksja'];
    const w = D(czerwony).wynikTriage(czerwony.triage);
    const txt = TXT(czerwony);
    T('C4/bez-akapitu-zalecen', !txt.includes(w.tresc.pl), 'akapit zaleceń z kwalifikacji trafił do opisu badania');
    T('C5/tytul-kwalifikacji-jest', txt.includes(w.tytul.pl), 'opis nie mówi, jaka była kwalifikacja wstępna');
    T('C6/bez-uwag', (w.uwagi || []).every(u => !txt.includes(u.pl)), 'uwagi kwalifikacji trafiły do opisu badania');
  }
}

/* ═══════════ D. OPIS NIE TWIERDZI WIĘCEJ, NIŻ ZAPISANO ═══════════ */
{
  // D1: strona bez źródła — wartości NIE MA, jest powód.
  {
    const s = PELNY(); s.sideZrodlo = null;
    const r = raport(s, D(s));
    const interp = r.sekcje.find(x => x.id === 'interpretacja');
    const w = interp.wiersze.find(x => x.etykieta.pl === 'Strona zajęta');
    eq('D1a/strona-bez-zrodla-brak-wartosci', w.wartosc, null);
    eq('D1b/strona-bez-zrodla-powod', w.brak, 'nieustalone');
    // Kontrola czułości: ze źródłem wartość MUSI się pojawić.
    const s2 = PELNY();
    const w2 = raport(s2, D(s2)).sekcje.find(x => x.id === 'interpretacja').wiersze.find(x => x.etykieta.pl === 'Strona zajęta');
    T('D1c/kontrola-czulosci', w2.wartosc != null && w2.zrodlo === 'wybrany', 'strona ze źródłem nie weszła do opisu');
  }
  // D2: mechanizm bez źródła — tak samo (literał 'canalo' nie jest ustaleniem).
  {
    const s = PELNY(); s.variantZrodlo = null;
    const w = raport(s, D(s)).sekcje.find(x => x.id === 'interpretacja').wiersze.find(x => x.etykieta.pl === 'Mechanizm');
    eq('D2a/mechanizm-bez-zrodla', w.wartosc, null);
    eq('D2b/powod', w.brak, 'nieustalone');
  }
  // D3: pusty przypadek nie niesie ANI JEDNEJ wartości klinicznej poza zastrzeżeniem.
  {
    const s = PUSTY();
    const r = raport(s, D(s));
    const zTrescia = r.sekcje.filter(x => x.id !== 'zastrzezenie' && x.wiersze.some(w => w.wartosc != null));
    eq('D3a/pusty-bez-wartosci', zTrescia.map(x => x.id), []);
    const txt = tekst(r);
    T('D3b/pusty-bez-strony', !/praw|lew|right|left/i.test(txt.split('ZASTRZEŻENIE')[0]), 'pusty opis wypisał stronę');
    T('D3c/pusty-bez-mechanizmu', !/kanalolitiaz|kupulolitiaz/i.test(txt), 'pusty opis wypisał mechanizm');
    T('D3d/zastrzezenie-jest', /ZASTRZEŻENIE/.test(txt), 'pusty opis nie ma zastrzeżenia');
    eq('D3e/licznik-tresci', r.zNoweTresci, 1);
  }
  // D4: instancja odrzucona jako niewiarygodna NIE wchodzi do opisu jako stwierdzenie.
  {
    const s = PELNY();
    s.obs.dix.pola['pion#jedyna'] = { w: 'p1', znak: 'niewiarygodne' };
    const txt = TXT(s);
    const wzorzec = D(s).wartoscPola('pion', 'p1').pl;
    T('D4a/niewiarygodna-nie-wchodzi', !txt.includes(wzorzec), 'wartość oznaczona jako niewiarygodna weszła do opisu');
    const s2 = PELNY();
    T('D4b/kontrola-czulosci', TXT(s2).includes(wzorzec), 'wiarygodna wartość nie weszła do opisu');
  }
  // D5: cały rekord niewiarygodny — opis mówi o tym WPROST i podaje powód.
  {
    const s = PELNY(); s.obs.dix.powodNiewiarygodnosci = 'brakFrenzla';
    const r = raport(s, D(s)).sekcje.find(x => x.id === 'oczoplas');
    T('D5a/powod-w-opisie', r.wiersze.some(w => w.brak === 'niewiarygodne'), 'opis nie powiedział, że badanie uznano za niewiarygodne');
    T('D5b/nazwa-powodu', r.wiersze.some(w => w.wartosc && String(w.wartosc.pl || '').includes('Frenzl')), 'opis nie podał powodu niewiarygodności');
  }
  // D6: próba nieopisana ma powód „nie wykonano", a nie ciszę.
  {
    const s = PELNY();
    const proby = raport(s, D(s)).sekcje.find(x => x.id === 'proby');
    eq('D6a/wszystkie-proby-wymienione', proby.wiersze.length, D(s).proby().length);
    eq('D6b/niewykonane-maja-powod', proby.wiersze.filter(w => w.brak === 'nieWykonano').length, D(s).proby().length - 1);
  }
  // D7: manewr wykonany bez kontroli — opis NAZYWA tę dziurę.
  {
    const s = PELNY(); s.kontrole = []; s.flow.maneuver.kontrolaIdx = null;
    const man = raport(s, D(s)).sekcje.find(x => x.id === 'manewr');
    T('D7a/dziura-nazwana', man.wiersze.some(w => w.brak === 'nieOdnotowano'), 'brak kontroli po manewrze nie został nazwany');
    T('D7b/manewr-mimo-to-jest', man.wiersze.some(w => w.wartosc != null), 'wykonany manewr zniknął z opisu, bo nie było kontroli');
  }
  // D8: strona WYKONANEGO manewru wolno napisać nawet bez ustalonej strony zajętej — to fakt.
  {
    const s = PELNY(); s.sideZrodlo = null;
    const txt = TXT(s);
    T('D8/strona-manewru-jest', /Wykonany manewr: Epley — ucho/.test(txt), 'strona wykonanego manewru zniknęła z opisu');
  }
}

/* ═══════════ E. PRZEŁĄCZNIKI SEKCJI ═══════════ */
{
  const s = PELNY();
  const r = raport(s, D(s));
  const wszystkie = domyslneSekcje();
  eq('E1/domyslnie-bez-obowiazkowej', wszystkie.includes('zastrzezenie'), false);
  eq('E2/domyslnie-siedem', wszystkie.length, 7);
  const pelny = tekst(r, { wlaczone: wszystkie });
  for (const id of wszystkie) {
    const bez = przelaczSekcje(wszystkie, id).lista;
    const txt = tekst(r, { wlaczone: bez });
    const tytul = sekcja(id).pl.toUpperCase();
    T(`E3/${id}-znika`, !txt.includes(tytul), `wyłączona sekcja ${id} została w tekście`);
    T(`E4/${id}-reszta-zostaje`, wszystkie.filter(x => x !== id).every(x => txt.includes(sekcja(x).pl.toUpperCase())), `wyłączenie ${id} zabrało inną sekcję`);
    T(`E5/${id}-krotszy`, txt.length < pelny.length, `wyłączenie ${id} nie skróciło opisu`);
  }
  // Sekcji obowiązkowej nie da się wyłączyć ŻADNYM gestem.
  const proba = przelaczSekcje(wszystkie, 'zastrzezenie');
  eq('E6/obowiazkowej-nie-da-sie-wylaczyc', proba.zmiana, false);
  eq('E7/pusta-lista-a-zastrzezenie', tekst(r, { wlaczone: [] }).includes(sekcja('zastrzezenie').pl.toUpperCase()), true);
  T('E8/pusta-lista-nic-wiecej', tekst(r, { wlaczone: [] }).split('\n\n').length === 1, 'przy wyłączonych sekcjach został ktoś jeszcze');
  // Ponowne dotknięcie wraca.
  const wrocone = przelaczSekcje(przelaczSekcje(wszystkie, 'proby').lista, 'proby').lista;
  eq('E9/przelacznik-wraca', wrocone, wszystkie);
  eq('E10/nieznana-sekcja', przelaczSekcje(wszystkie, 'nieistnieje').zmiana, false);
}

/* ═══════════ F. CO JEST PRZYPADKIEM — PARTYCJA PÓL ═══════════ */
{
  const suma = POLA_SESJI.concat(POLA_ULOTNE).slice().sort();
  eq('F1/partycja-pelna', suma, POLA_PACJENTA.slice().sort());
  T('F2/partycja-rozlaczna', !POLA_SESJI.some(k => POLA_ULOTNE.includes(k)), 'pole jest naraz zapisywane i ulotne');
  eq('F3/liczby', [POLA_SESJI.length, POLA_ULOTNE.length, POLA_PACJENTA.length], [19, 10, 29]);
  // Zegar i plan MUSZĄ być ulotne — odtworzenie sesji nie wznawia odliczania pozycji.
  for (const k of ['plan', 'step', 'running', 'elapsedMs', 'zegar', 'ukryteOd', 'luka'])
    T(`F4/${k}-ulotne`, POLA_ULOTNE.includes(k), `pole ${k} weszłoby do zapisu i wznawiało odliczanie`);
  for (const k of ['obs', 'triage', 'kontrole', 'flow', 'canal', 'sideZrodlo', 'variantZrodlo'])
    T(`F5/${k}-zapisywane`, POLA_SESJI.includes(k), `pole ${k} wypadłoby z zapisanej sesji`);
  T('F6/pusty-nie-do-zapisu', !jestCoZapisac(PUSTY()), 'pusty przypadek dałby się zapisać');
  T('F7/pelny-do-zapisu', jestCoZapisac(PELNY()), 'pełny przypadek nie dałby się zapisać');
  for (const [nazwa, mut] of [['wywiad', s => { s.triage = { przebieg: 'napadowe' }; }],
                              ['opis', s => { s.obs = { dix: { proba: 'dix', wystapil: 'tak', pola: {} } }; }],
                              ['kanal', s => { s.canal = 'posterior'; }],
                              ['manewr', s => { s.flow.maneuver = { key: 'epley' }; }]]) {
    const s = PUSTY(); mut(s);
    T(`F8/${nazwa}-wystarczy`, jestCoZapisac(s), `sam ${nazwa} nie wystarczył do zapisu`);
  }
}

/* ═══════════ G. STRAŻNIK DANYCH OSOBOWYCH ═══════════
   Reguła jest STRUKTURALNA: każda wartość musi być liczbą, wartością logiczną albo napisem ze
   słownika. Dlatego nie testujemy „czy wykrywa imiona", tylko czy przez KAŻDĄ furtkę da się
   wcisnąć napis spoza słownika. */
{
  const s = PELNY();
  const czysty = rekordSesji(s, D(s), 1700000000000, []);
  const g = (rek) => bezDanychOsobowychSesji(rek, D(s));
  eq('G1/czysty-przechodzi', g(czysty).czysty, true);
  eq('G2/ksztalt-id', KSZTALT_ID.test(czysty.id), true);
  eq('G3/wersja', czysty.wersja, WERSJA_SESJI);
  const kopia = () => JSON.parse(JSON.stringify(czysty));

  const naruszenia = [
    ['id-tekstem', r => { r.id = 'pacjent Kowalski'; }],
    ['wersja-obca', r => { r.wersja = 99; }],
    ['czas-tekstem', r => { r.utworzono = 'wczoraj'; }],
    ['pole-obce', r => { r.pola.notatka = 'Jan Kowalski'; }],
    ['pole-ulotne', r => { r.pola.plan = { key: 'epley' }; }],
    ['strona-obca', r => { r.pola.side = 'X'; }],
    ['kanal-obcy', r => { r.pola.canal = 'kanał Kowalskiego'; }],
    ['manewr-obcy', r => { r.pola.maneuverKey = 'mój manewr'; }],
    ['proba-obca', r => { r.pola.testKey = 'notatka'; }],
    ['mechanizm-obcy', r => { r.pola.variant = 'inny'; }],
    ['rozmiar-obcy', r => { r.pola.size = 'XXL'; }],
    ['tryb-czasu-obcy', r => { r.pola.trybCzasu = 'dowolny'; }],
    ['zrodlo-obce', r => { r.pola.sideZrodlo = 'od pacjenta Kowalskiego'; }],
    ['powod-obcy', r => { r.pola.kontrolaPowod = 'pacjent Kowalski'; }],
    ['licznik-tekstem', r => { r.pola.decisionSeq = 'dużo'; }],
    ['licznik-ujemny', r => { r.pola.dixRep = -1; }],
    ['obs-obca-proba', r => { r.pola.obs.notatki = { proba: 'notatki', pola: {} }; }],
    ['obs-obce-pole', r => { r.pola.obs.dix.komentarz = 'Kowalski'; }],
    ['obs-obca-instancja', r => { r.pola.obs.dix.pola.imie = { w: 'Jan' }; }],
    ['obs-obca-wartosc', r => { r.pola.obs.dix.pola['pion#jedyna'] = { w: 'Jan' }; }],
    ['obs-obcy-znak', r => { r.pola.obs.dix.pola['pion#jedyna'] = { w: 'p1', znak: 'Kowalski' }; }],
    ['obs-obcy-wystapil', r => { r.pola.obs.dix.wystapil = 'pacjent Kowalski'; }],
    ['obs-obcy-powod', r => { r.pola.obs.dix.powodNiewiarygodnosci = 'nie chciał'; }],
    ['obs-podpisana-inna-proba', r => { r.pola.obs.dix.proba = 'roll'; }],
    ['odcisk-obcy', r => { r.pola.obsOdciski.dix = 'Jan Kowalski'; }],
    ['odcisk-nieznana-proba', r => { r.pola.obsOdciski.notatki = 'x'; }],
    ['triage-obce-pytanie', r => { r.pola.triage.nazwisko = 'Kowalski'; }],
    ['triage-obca-odpowiedz', r => { r.pola.triage.przebieg = 'od wtorku'; }],
    ['triage-obca-flaga', r => { r.pola.triage.flagi = ['brak', 'Kowalski']; }],
    ['kontrola-obce-pole', r => { r.pola.kontrole[0].uwagi = 'Kowalski'; }],
    ['kontrola-obcy-wynik', r => { r.pola.kontrole[0].wynik = 'lepiej'; }],
    ['kontrola-obca-tolerancja', r => { r.pola.kontrole[0].tolerancja = 'źle'; }],
    ['kontrola-obce-czasy', r => { r.pola.kontrole[0].czasy = ['dużo']; }],
    ['flow-obce-pole', r => { r.pola.flow.notatka = 'Kowalski'; }],
    ['flow-obcy-manewr', r => { r.pola.flow.maneuver.key = 'mój'; }],
    ['flow-obce-pole-manewru', r => { r.pola.flow.maneuver.komentarz = 'Kowalski'; }],
    ['flow-obce-wejscie', r => { r.pola.flow.maneuver.inputs.imie = 'Jan'; }],
    ['flow-obca-strona', r => { r.pola.flow.maneuver.planSide = 'Kowalski'; }],
    ['flow-nie-logiczne', r => { r.pola.flow.testSeen = 'tak, w środę'; }],
    ['pola-nie-obiekt', r => { r.pola = 'Kowalski'; }],
  ];
  for (const [nazwa, mut] of naruszenia) {
    const r = kopia(); mut(r);
    const wynik = g(r);
    T(`G4/${nazwa}-odrzucone`, !wynik.czysty, `strażnik przepuścił naruszenie „${nazwa}"`);
    T(`G5/${nazwa}-ma-powod`, !wynik.czysty && wynik.powody.length > 0, `naruszenie „${nazwa}" bez powodu odrzucenia`);
  }
  // Odcisk musi się ZGADZAĆ z rekordem, a nie tylko być napisem ze zbioru znaków.
  {
    const s2 = PELNY();
    const d2 = D(s2);
    const prawdziwy = d2.odciskZRekordu(s2.obs.dix);
    const r = rekordSesji(s2, d2, 1, []);
    r.pola.obsOdciski = { dix: prawdziwy };
    eq('G6a/odcisk-zgodny', bezDanychOsobowychSesji(r, d2).czysty, true);
    r.pola.obsOdciski = { dix: prawdziwy + 'x' };
    eq('G6b/odcisk-niezgodny', bezDanychOsobowychSesji(r, d2).czysty, false);
  }
  // Strażnik nie CZYŚCI — odrzuca. Wpis po sprawdzeniu jest nietknięty.
  {
    const r = kopia(); r.pola.kontrolaPowod = 'Kowalski';
    const przed = JSON.stringify(r); g(r);
    T('G7/nie-czysci', JSON.stringify(r) === przed, 'strażnik zmienił sprawdzany wpis');
  }
  eq('G8/null-odrzucony', g(null).czysty, false);
  eq('G9/bez-pol', g({ id: 's1', wersja: WERSJA_SESJI, utworzono: 1 }).czysty, false);
  // Pusty przypadek jest STRUKTURALNIE poprawny (nie ma czego zapisać, ale nie jest brudny).
  eq('G10/pusty-czysty', g(rekordSesji(PUSTY(), D(PUSTY()), 1, [])).czysty, true);
}

/* ═══════════ H. ODTWORZENIE SESJI ═══════════ */
{
  const s = PELNY();
  const rek = rekordSesji(s, D(s), 100, []);
  const p = przywrocenie(rek, D(s));
  eq('H1/odtworzenie-ok', p.ok, true);
  for (const k of POLA_SESJI) eq(`H2/${k}-wraca`, JSON.stringify(p.latka[k]), JSON.stringify(s[k]));
  // NIGDY nie wznawiamy odliczania — to jest decyzja bezpieczeństwa, nie porządkowa.
  for (const [k, v] of Object.entries(ULOTNE_PO_ODTWORZENIU)) eq(`H3/${k}-wyzerowane`, p.latka[k], v);
  eq('H4/nie-biegnie', p.latka.running, false);
  eq('H5/plan-do-przebudowy', [p.latka.plan, p.wymagaPlanu], [null, true]);
  // Sesja bez manewru nie żąda przebudowy planu.
  {
    const s2 = PUSTY(); s2.triage = { przebieg: 'napadowe' };
    eq('H6/bez-manewru', przywrocenie(rekordSesji(s2, D(s2), 1, []), D(s2)).wymagaPlanu, false);
  }
  // Wpis brudny NIE daje łatki — odtworzenie nie ma prawa być furtką obok strażnika.
  {
    const brudny = JSON.parse(JSON.stringify(rek)); brudny.pola.kontrolaPowod = 'Kowalski';
    const r = przywrocenie(brudny, D(s));
    eq('H7a/brudny-odrzucony', r.ok, false);
    eq('H7b/brak-latki', r.latka, null);
    T('H7c/powod-podany', r.powody.length > 0, 'odmowa odtworzenia bez powodu');
  }
  // Odtworzenie MUSI odtwarzać opis: raport z łatki jest identyczny jak z oryginału.
  {
    const odtworzony = Object.assign(PUSTY(), p.latka);
    eq('H8/opis-identyczny', TXT(odtworzony), TXT(s));
  }
}

/* ═══════════ I. EKSPORT USTRUKTURYZOWANY ═══════════ */
{
  const s = PELNY();
  const e = pakietEksportu(s, D(s), 1700000000000);
  eq('I1/eksport-ok', e.ok, true);
  eq('I2/format', e.pakiet.format, 'otorepo-sesja');
  eq('I3/kody', e.pakiet.kody, KODY_EKSPORTU);
  T('I4/kody-nie-obiecuja-anonimowosci', !KODY_EKSPORTU.some(k => /anonim/i.test(k)), 'pakiet obiecuje anonimowość, której nie może zapewnić');
  // Pakiet niesie IDENTYFIKATORY, a nie zdania — inaczej byłby drugą kopią tekstu.
  const json = JSON.stringify(e.pakiet);
  T('I5/bez-zdan', !json.includes('Kanał tylny') && !json.includes('narzędzie dydaktyczne'), 'eksport niesie zdania opisu zamiast identyfikatorów');
  T('I6/niesie-dane', /"canal":"posterior"/.test(json) && /"wynik":"ustapienie"/.test(json), 'eksport nie niesie danych przypadku');
  // Eksport przechodzi przez TEGO SAMEGO strażnika.
  {
    const brudny = PELNY(); brudny.kontrolaPowod = 'Kowalski';
    const r = pakietEksportu(brudny, D(brudny), 1);
    eq('I7a/brudny-nie-eksportuje', r.ok, false);
    eq('I7b/brak-pakietu', r.pakiet, null);
  }
  // Znacznik czasu jest WSTRZYKNIĘTY i tylko taki — model nie ma dostępu do zegara.
  eq('I8/czas-wstrzykniety', pakietEksportu(s, D(s), 42).pakiet.utworzono, 42);
  eq('I9/czas-bez-argumentu', pakietEksportu(s, D(s)).pakiet.utworzono, 0);
}

/* ═══════════ J. TOLERANCJA (dana, której wcześniej nie było) ═══════════ */
{
  eq('J1/slownik-zamkniety', TOLERANCJA_IDS.length, 7);
  T('J2/dwujezyczny', TOLERANCJE.every(x => x.pl && x.en && x.pl !== x.en), 'pozycja tolerancji bez tłumaczenia');
  T('J3/jedna-przerywa', TOLERANCJE.filter(x => x.przerwany).length === 1, 'dokładnie jedna pozycja znaczy „nie dokończono"');
  T('J4/w-polach-wpisu', POLA_WPISU.includes('tolerancja'), 'tolerancja nie jest polem wpisu kontroli');
  // Każda pozycja słownika zmienia opis — słownik bez skutku uczy, że odpowiedź nie ma znaczenia.
  const opisy = new Set();
  for (const x of TOLERANCJE) { const s = PELNY(); s.kontrole[0].tolerancja = x.id; opisy.add(TXT(s)); }
  eq('J5/kazda-pozycja-widoczna', opisy.size, TOLERANCJE.length);
  // Brak odpowiedzi to BRAK, a nie „dobra".
  {
    const s = PELNY(); s.kontrole[0].tolerancja = null;
    const tol = raport(s, D(s)).sekcje.find(x => x.id === 'tolerancja');
    eq('J6/brak-to-brak', tol.wiersze[0].brak, 'nieOdnotowano');
    T('J7/nie-domysla-sie', tol.wiersze[0].wartosc == null, 'brak tolerancji zamienił się w odpowiedź');
  }
  // Sprzeczność: manewru nie dokończono, a wynik przypisano JEMU.
  {
    const s = PELNY(); s.kontrole[0].tolerancja = 'przerwano';
    const sp = spojnoscWyniku('ustapienie', s, followupDeps());
    T('J8/sprzecznosc-nazwana', sp.some(x => x.pole === 'wynikPoPrzerwanym'), 'wynik po przerwanym manewrze nie został nazwany');
    const s2 = PELNY();
    T('J9/kontrola-czulosci', !spojnoscWyniku('ustapienie', s2, followupDeps()).some(x => x.pole === 'wynikPoPrzerwanym'), 'sprzeczność zapaliła się przy dokończonym manewrze');
    T('J10/slownik-sprzecznosci', !!SPRZECZNOSCI.wynikPoPrzerwanym, 'brak wpisu w słowniku sprzeczności');
  }
  // Tolerancja per MANEWR, nie per sesja: dwa wpisy niosą dwie różne odpowiedzi.
  {
    const s = PELNY();
    s.kontrole.push({ ...s.kontrole[0], tolerancja: 'wymioty' });
    const tol = raport(s, D(s)).sekcje.find(x => x.id === 'tolerancja');
    eq('J11/dwa-wiersze', tol.wiersze.length, 2);
    T('J12/rozne-odpowiedzi', JSON.stringify(tol.wiersze[0].wartosc) !== JSON.stringify(tol.wiersze[1].wartosc), 'dwa manewry dostały tę samą tolerancję');
  }
}

/* ═══════════ K. PODPIS WPISU NA LIŚCIE ═══════════ */
{
  const s = PELNY();
  const rek = rekordSesji(s, D(s), 5, []);
  const podpis = podpisSesji(rek, D(s));
  T('K1/podpis-jest', Array.isArray(podpis) && podpis.length >= 2, 'wpis na liście nie ma z czego zrobić podpisu');
  T('K2/podpis-bez-tekstu', podpis.every(x => typeof x === 'string' || (x && (x.pl || x.en))), 'podpis niesie coś spoza słowników');
  // Bez ustalonej strony podpis jej NIE pokazuje — ta sama reguła, co w opisie.
  {
    const s2 = PELNY(); s2.sideZrodlo = null;
    const p2 = podpisSesji(rekordSesji(s2, D(s2), 5, []), D(s2));
    T('K3/bez-strony', p2.length < podpis.length, 'podpis pokazał stronę, której nikt nie ustalił');
  }
  eq('K4/pusty-podpis', podpisSesji(rekordSesji(PUSTY(), D(PUSTY()), 5, []), D(PUSTY())), null);
  // Identyfikatory nie kolidują nawet przy zapisie w tej samej milisekundzie.
  const lista = [];
  for (let i = 0; i < 5; i++) lista.push(rekordSesji(s, D(s), 7, lista));
  eq('K5/id-unikalne', new Set(lista.map(x => x.id)).size, 5);
  T('K6/id-ksztalt', lista.every(x => KSZTALT_ID.test(x.id)), 'identyfikator wpisu ma obcy kształt');
  eq('K7/id-powtarzalne', nadajId([], 7), nadajId([], 7));
}

/* ═══════════ L. CZYSTOŚĆ MODUŁU ═══════════
   Model musi dać się policzyć w gołym Node, bez przeglądarki i bez zegara — inaczej złoty wzorzec
   przestaje być deterministyczny, a wyrocznia bada co innego niż aplikacja. */
{
  const src = readFileSync(resolve(ROOT, 'src/app/opis-model.js'), 'utf8');
  T('L1/bez-importow', !/^\s*import\s/m.test(src), 'model przestał być bezimportowy');
  for (const [nazwa, re] of [['window', /\bwindow\./], ['document', /\bdocument\./], ['localStorage', /\blocalStorage\b/],
                             ['fetch', /\bfetch\s*\(/], ['Date.now', /Date\.now\s*\(/], ['new Date', /new\s+Date\b/],
                             ['Math.random', /Math\.random\s*\(/]]) {
    T(`L2/bez-${nazwa}`, !re.test(src), `model sięga po ${nazwa} — przestał być czysty albo deterministyczny`);
  }
  // Kontrola czułości bramki: ten sam skaner MUSI znaleźć wzorzec, gdy naprawdę jest.
  T('L3/kontrola-czulosci', /Date\.now\s*\(/.test('x = Date.now()'), 'skaner nie wykrywa wzorca, którego szuka');
  // Strażnik i zapis chodzą po TYCH SAMYCH polach — rozjazd znaczyłby, że da się zapisać pole,
  // którego strażnik nie zna.
  const straznikSrc = src.slice(src.indexOf('bezDanychOsobowychSesji'));
  T('L4/straznik-czyta-pola-sesji', /POLA_SESJI\.includes/.test(straznikSrc), 'strażnik nie sprawdza listy pól zapisu');
  // Wstrzykiwacz importuje wyłącznie moduły czyste — inaczej wyrocznia nie ruszy w gołym Node.
  const deps = readFileSync(resolve(ROOT, 'src/app/opis-deps.js'), 'utf8');
  const importy = [...deps.matchAll(/from\s+'([^']+)'/g)].map(m => m[1]);
  const dozwolone = ['../i18n.js', '../pose/maneuvers.js', './obs-model.js', './triage-model.js', './followup-model.js', './followup-deps.js'];
  for (const i of importy) T(`L5/import-${i}`, dozwolone.includes(i), `wstrzykiwacz wciąga moduł spoza listy: ${i}`);
  // Pamięć przeglądarki mieszka WYŁĄCZNIE w opis-store.js.
  const stateSrc = readFileSync(resolve(ROOT, 'src/app/opis-state.js'), 'utf8');
  T('L6/pamiec-tylko-w-store', !/localStorage/.test(stateSrc), 'pisarz stanu sięga po localStorage z pominięciem magazynu');
  const store = readFileSync(resolve(ROOT, 'src/app/opis-store.js'), 'utf8');
  T('L7/magazyn-ze-straznikiem', /bezDanychOsobowychSesji/.test(store), 'magazyn zapisuje bez strażnika');
  /* SIEĆ — szukamy UŻYCIA W KODZIE, a nie słowa. Pierwsza wersja tej bramki zapaliła się na
     własnym komentarzu nagłówkowym magazynu, który WYMIENIA te nazwy właśnie po to, żeby
     powiedzieć, że ich nie ma (ta sama pułapka, co „third window" w Bloku 14). Komentarze
     wycinamy, a obie kontrole czułości pilnują, żeby skaner nie oślepł przy okazji. */
  const bezKomentarzy = (x) => x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const torZapisu = [store, stateSrc, src].map(bezKomentarzy);
  for (const [nazwa, re] of [['fetch', /\bfetch\s*\(/], ['XHR', /new\s+XMLHttpRequest/],
                             ['beacon', /\.sendBeacon\s*\(/], ['ws', /new\s+WebSocket/]])
    T(`L8/bez-sieci-${nazwa}`, torZapisu.every(x => !re.test(x)), 'w torze zapisu pojawiła się sieć');
  T('L9/kontrola-czulosci-sieci', /\bfetch\s*\(/.test(bezKomentarzy('const x = 1;\nfetch("/x")')),
    'skaner sieci nie wykrywa wywołania, którego szuka');
  T('L10/kontrola-komentarza', !/\bfetch\s*\(/.test(bezKomentarzy('/* nie ma fetch() */')),
    'skaner sieci nadal czyta komentarze');
}

/* ═══════════ M. JĘZYK ═══════════ */
{
  const s = PELNY();
  state.lang = 'pl'; const pl = TXT(s);
  state.lang = 'en'; const en = TXT(s);
  state.lang = 'pl';
  T('M1/rozne', pl !== en, 'przełączenie języka nie zmieniło opisu');
  T('M2/pl-bez-angielskiego', !/Posterior canal|Canalithiasis|right ear|not recorded|Disclaimer/.test(pl), 'opis PL niesie napisy angielskie');
  T('M3/en-bez-polskiego', !/Kanał tylny|Kanalolitiaza|ucho praw|nie odnotowano|ZASTRZEŻENIE/.test(en), 'opis EN niesie napisy polskie');
  T('M4/oba-niepuste', pl.length > 400 && en.length > 400, 'opis w którymś języku wyszedł pusty');
  // Powody braku też muszą się tłumaczyć — to najczęstszy wiersz w niepełnym opisie.
  const p = PUSTY();
  state.lang = 'en'; const enPusty = TXT(p);
  state.lang = 'pl'; const plPusty = TXT(p);
  T('M5/braki-pl', /nie wykonano/.test(plPusty), 'powód braku nie przetłumaczył się na PL');
  T('M6/braki-en', /not performed/.test(enPusty), 'powód braku nie przetłumaczył się na EN');
}

/* ═══════════ WYNIK ═══════════ */
/* D-CZAS (2026-08-21): 355 -> 357. Sekcja opisu „Wywiad i kwalifikacja" wylicza JEDEN WIERSZ NA
   AKTYWNE PYTANIE kwalifikacji (opis-model.js, petla po `aktywne`), a doszlo piate pytanie —
   o czas od poczatku objawow. Przyrost jest wiec MECHANICZNY i wprost proporcjonalny: nowy wiersz
   w generowanym opisie, sprawdzany w dwoch miejscach. Zmierzone, nie oszacowane: licznik pokazywal
   357 juz PRZED poprawieniem przypadku odniesienia w tym pliku i po niej sie nie zmienil. */
const OCZEKIWANE = 359;   /* D-ORTO (2026-08-22): +2 — nowe pytanie kwalifikacji `ortostaza` wchodzi
                             do enumeracji opisu w OBU jezykach. Zmierzone: po cofnieciu samego
                             triage-model.js licznik wraca do 357.
                             Wczesniej 357: +2 za dwie fazy proby lying-down (polozenie/siad). */
if (ok !== OCZEKIWANE) bledy.push(`LICZBA PRZYPADKÓW: ${ok}, oczekiwano ${OCZEKIWANE} — dopisz albo popraw zakres, ale nie po cichu`);
if (bledy.length) { console.error(`✗ opis:check — ${bledy.length} błędów (${ok} przeszło)`); for (const b of bledy) console.error('  ' + b); process.exit(1); }
console.log(`✓ opis:check — ${ok} przypadków`);
