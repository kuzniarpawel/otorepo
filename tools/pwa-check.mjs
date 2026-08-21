/* OTOREPO — WYROCZNIA PWA, AKTUALIZACJI I SKROTOW KLAWIATUROWYCH (Blok 16). Gole Node.
 *
 * Cztery pytania, na ktore ta wyrocznia odpowiada POMIAREM:
 *   1. czy aktualizacja moze przerwac trwajacy manewr (kryterium odbioru nr 3 + zasada wspolna
 *      „aktualizacja zasobow nie moze przerywac aktywnego manewru") — sprawdzane na stanie,
 *      a nie na intencji: KAZDY sygnal otwartego przypadku musi wstrzymac wdrozenie automatyczne;
 *   2. czy skrot klawiaturowy nie zabiera klawisza temu, kto go potrzebuje — spacja na przycisku,
 *      spacja w polu tekstowym, strzalka w suwaku fazy manewru;
 *   3. czy zdanie „wszystko dziala bez polaczenia" jest PRAWDA — bramka skanuje `src/` w poszukiwaniu
 *      wywolan sieci, z komentarzami usunietymi (bo komentarz o `fetch` nie jest wywolaniem),
 *      z kontrola czulosci w obie strony;
 *   4. co NAPRAWDE robi service worker — szablon jest URUCHAMIANY na sztucznym `self`, `caches`
 *      i `fetch`. To jest cala roznica wobec stanu sprzed tego bloku: worker „wygladal poprawnie"
 *      i przez caly czas nie potrafil podniesc aplikacji offline.
 *
 * Uruchomienie: npm run pwa:check
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
const { BLOKADA_TWARDA, SYGNALY_PRZYPADKU, SYGNALY_IDS, sygnalyPrzypadku, decyzjaAktualizacji,
  wdrozenieAutomatyczne, decyzjaPrzeladowania, TEKSTY_AKTUALIZACJI, STANY_AKTUALIZACJI,
  SKROTY, AKCJE_SKROTOW, POWODY_ODMOWY, skrot,
  FUNKCJE_WYMAGAJACE_SIECI, komunikatSieci } = await import('../src/app/pwa-model.js');
const { swSource } = await import('./sw-template.mjs');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

// Stan czysty = aplikacja bez przypadku (po zakonczeniu sesji albo tuz po starcie).
const CZYSTY = () => ({ screen: 'start', running: false, step: 0, aktualizacja: 'brak',
  aktualizacjaSchowana: false, flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null },
  kontrole: [], obs: {}, triage: {}, hintsBadanie: {}, naukaPrzypadek: null });
const CZEKA = (nad = {}) => ({ ...CZYSTY(), aktualizacja: 'czeka', ...nad });

/* ═══════════ A. POLITYKA: KIEDY POKAZAC I CZY WOLNO WDROZYC ═══════════ */
{
  eq('A1/stany', STANY_AKTUALIZACJI, ['brak', 'czeka', 'wdrazana']);
  const brak = decyzjaAktualizacji(CZYSTY());
  T('A2/brak-nie-pokazuje', brak.pokaz === false, 'pasek pokazuje sie bez czekajacej wersji');
  T('A3/brak-bez-tekstu', brak.tytul === null && brak.tresc === null, 'pasek sklada zdania, kiedy nie ma czego komunikowac');

  const gotowa = decyzjaAktualizacji(CZEKA());
  T('A4/czeka-pokazuje', gotowa.pokaz === true, 'czekajaca wersja nie jest komunikowana (kryterium odbioru nr 3)');
  T('A5/czeka-mozna', gotowa.mozna === true, 'przy czystym stanie wdrozenie powinno byc dozwolone');
  T('A6/czeka-bez-ostrzezenia', gotowa.ostrzezenie === null, 'ostrzezenie o utracie przypadku bez przypadku');
  T('A7/czeka-ma-przycisk', !!gotowa.przycisk, 'brak przycisku wdrozenia przy dozwolonym wdrozeniu');
  T('A8/tresc-gotowa', gotowa.tresc === TEKSTY_AKTUALIZACJI.gotowa, 'inna tresc niz „wejdzie po zakonczeniu sesji"');

  const wdraz = decyzjaAktualizacji(CZEKA({ aktualizacja: 'wdrazana' }));
  T('A9/wdrazana-pokazuje', wdraz.pokaz === true && wdraz.wdrazana === true, 'wdrazanie nie jest widoczne');
  T('A10/wdrazana-bez-przycisku', wdraz.przycisk === null && wdraz.mozna === false, 'w trakcie wdrazania dalej mozna klikac');

  const schowana = decyzjaAktualizacji(CZEKA({ aktualizacjaSchowana: true }));
  T('A11/schowana-nie-pokazuje', schowana.pokaz === false, '„Nie teraz" nie chowa paska');

  // Dwujezycznosc wszystkich napisow bloku — pasek jest chromem, a chrom bywa zapominany.
  for (const [k, v] of Object.entries(TEKSTY_AKTUALIZACJI)) {
    T(`A12/${k}-dwujezyczny`, !!(v.pl && v.en && v.pl !== v.en), `tekst ${k} nie ma obu jezykow`);
  }
}

/* ═══════════ B. TWARDA BLOKADA: TRWAJACY MANEWR ═══════════
   „Aktualizacja zasobow nie moze przerywac aktywnego manewru" — i to jest jedyny zakaz, ktorego
   nie zdejmuje zyczenie uzytkownika. */
{
  const zLicznikiem = CZEKA({ screen: 'guide', running: true, step: 0 });
  const zKrokiem = CZEKA({ screen: 'guide', running: false, step: 2 });
  const podglad = CZEKA({ screen: 'guide', running: false, step: 0 });

  T('B1/licznik-blokuje', BLOKADA_TWARDA.czy(zLicznikiem) === true, 'biegnacy licznik nie blokuje wdrozenia');
  T('B2/krok-blokuje', BLOKADA_TWARDA.czy(zKrokiem) === true, 'zmieniony etap manewru nie blokuje wdrozenia');
  T('B3/podglad-nie-blokuje', BLOKADA_TWARDA.czy(podglad) === false, 'sam widok manewru na kroku 0 blokuje wdrozenie');
  T('B4/poza-manewrem', BLOKADA_TWARDA.czy(CZEKA({ screen: 'obs', running: true })) === false,
     'blokada zapala sie poza ekranem manewru (licznik nie istnieje na tym ekranie)');

  const d = decyzjaAktualizacji(zLicznikiem);
  T('B5/blokada-widoczna', d.pokaz === true, 'przy manewrze pasek milczy zamiast obiecac, ze nie przerwie');
  T('B6/blokada-nie-mozna', d.mozna === false, 'przy manewrze wdrozenie jest dozwolone');
  T('B7/blokada-bez-przycisku', d.przycisk === null, 'przy manewrze jest przycisk, ktory i tak odmowi');
  T('B8/blokada-nazwana', d.blokada === 'manewrWToku', `powod blokady: ${d.blokada}`);
  T('B9/blokada-tresc', d.tresc === TEKSTY_AKTUALIZACJI.wManewrze, 'tresc nie mowi o manewrze');
  T('B10/blokada-bez-schowaj', d.schowaj === false, 'przy blokadzie oferujemy chowanie zamiast informacji');
  // Kontrola czulosci: ten sam stan bez czekajacej wersji nie ma prawa niczego pokazac.
  T('B11/czulosc', decyzjaAktualizacji({ ...zLicznikiem, aktualizacja: 'brak' }).pokaz === false, 'pasek pokazuje sie bez aktualizacji');
}

/* ═══════════ C. SYGNALY OTWARTEGO PRZYPADKU (POKRYCIE) ═══════════
   Zapadka z Bloku 15: lista, ktora powstala „z glowy", przeoczy pole dolozone w nastepnym bloku.
   Tutaj kazdy sygnal jest sprawdzany OSOBNO — i osobno musi wstrzymac wdrozenie automatyczne. */
{
  const PRZYKLADY = {
    manewrOtwarty: { screen: 'guide' },
    proba: { flow: { testSeen: true, obsSeen: false, interpretSeen: false, maneuver: null } },
    oczoplas: { flow: { testSeen: false, obsSeen: true, interpretSeen: false, maneuver: null } },
    interpretacja: { flow: { testSeen: false, obsSeen: false, interpretSeen: true, maneuver: null } },
    manewrWybrany: { flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: { key: 'epley' } } },
    kontrola: { kontrole: [{ manewr: 'epley' }] },
    obserwacje: { obs: { dix: { proba: 'dix' } } },
    kwalifikacja: { triage: { przebieg: 'napadowe' } },
    hints: { hintsBadanie: { hit: 'prawidlowy' } },
    nauka: { naukaPrzypadek: 'p1' },
  };
  eq('C1/liczba-sygnalow', SYGNALY_PRZYPADKU.length, 10);
  T('C2/id-unikalne', new Set(SYGNALY_IDS).size === SYGNALY_IDS.length, 'identyfikatory sygnalow sie powtarzaja');
  T('C3/pokrycie-przykladow', Object.keys(PRZYKLADY).every(k => SYGNALY_IDS.includes(k)) && SYGNALY_IDS.every(k => k in PRZYKLADY),
     `przyklady i lista sygnalow sie rozjechaly: ${SYGNALY_IDS.filter(k => !(k in PRZYKLADY)).join(',')}`);
  T('C4/czysty-bez-sygnalow', sygnalyPrzypadku(CZYSTY()).length === 0, `czysty stan zglasza sygnaly: ${sygnalyPrzypadku(CZYSTY())}`);

  for (const s of SYGNALY_PRZYPADKU) {
    const st = CZEKA(PRZYKLADY[s.id]);
    T(`C5/${s.id}-wykryty`, sygnalyPrzypadku(st).includes(s.id), `sygnal ${s.id} nie zapala sie na wlasnym przykladzie`);
    T(`C6/${s.id}-wstrzymuje`, wdrozenieAutomatyczne(st) === false, `sygnal ${s.id} nie wstrzymuje wdrozenia automatycznego`);
    const d = decyzjaAktualizacji(st);
    T(`C7/${s.id}-ostrzega`, d.ostrzezenie === 'przypadekPrzepadnie',
       `przy sygnale ${s.id} pasek nie ostrzega, ze wdrozenie skasuje przypadek`);
    T(`C8/${s.id}-dwujezyczny`, !!(s.pl && s.en && s.pl !== s.en), `sygnal ${s.id} nie ma obu jezykow`);
    T(`C9/${s.id}-mozna-swiadomie`, d.mozna === true, `sygnal ${s.id} zamienil sie w twarda blokade`);
  }
}

/* ═══════════ D. WDROZENIE AUTOMATYCZNE „PO ZAKONCZENIU SESJI" ═══════════ */
{
  T('D1/czysty-czeka', wdrozenieAutomatyczne(CZEKA()) === true, 'po zakonczeniu sesji aktualizacja nie wchodzi sama');
  T('D2/bez-aktualizacji', wdrozenieAutomatyczne(CZYSTY()) === false, 'wdrazamy cos, czego nie ma');
  T('D3/manewr', wdrozenieAutomatyczne(CZEKA({ screen: 'guide', running: true })) === false, 'automat wchodzi w trakcie manewru');
  T('D4/przypadek', wdrozenieAutomatyczne(CZEKA({ kontrole: [{ manewr: 'epley' }] })) === false, 'automat kasuje otwarty przypadek');
  T('D5/schowany-nie-zmienia', wdrozenieAutomatyczne(CZEKA({ aktualizacjaSchowana: true })) === true,
     '„Nie teraz" wstrzymalo wdrozenie po sesji — a mialo dotyczyc tylko widocznosci paska');
}

/* ═══════════ D2. PRZELADOWANIE PO PRZEJECIU KARTY ═══════════
   Regula wyglada technicznie, ale kosztuje dane pacjenta w OBIE strony: przeladowanie przy
   pierwszej instalacji kasuje otwarty przypadek, a BRAK przeladowania po wdrozeniu zostawia karte
   ze starym kodem i skasowanym cache — czyli z zmierzonym bialym ekranem. */
{
  eq('D6/pierwsza-instalacja', decyzjaPrzeladowania({ bylSterownik: false, przeladowano: false }).przeladuj, false);
  eq('D7/powod-pierwsza', decyzjaPrzeladowania({ bylSterownik: false, przeladowano: false }).powod, 'pierwszaInstalacja');
  eq('D8/po-wdrozeniu', decyzjaPrzeladowania({ bylSterownik: true, przeladowano: false }).przeladuj, true);
  eq('D9/zatrzask', decyzjaPrzeladowania({ bylSterownik: true, przeladowano: true }).przeladuj, false);
  eq('D10/powod-zatrzask', decyzjaPrzeladowania({ bylSterownik: true, przeladowano: true }).powod, 'juzPrzeladowano');
  eq('D11/bez-kontekstu', decyzjaPrzeladowania().przeladuj, false);
}

/* ═══════════ E. SKROTY KLAWIATUROWE ═══════════ */
{
  const GUIDE = (nad = {}) => ({ screen: 'guide', step: 1, plan: { steps: [1, 2, 3, 4] }, ...nad });
  const zd = (key, nad = {}) => ({ key, ctrlKey: false, altKey: false, metaKey: false, shiftKey: false,
    repeat: false, cel: { tag: 'DIV', typ: '', edytowalne: false, rola: '' }, ...nad });

  eq('E1/liczba-skrotow', SKROTY.length, 3);
  eq('E2/akcje', AKCJE_SKROTOW, ['przelaczLicznik', 'nastepnyKrok', 'poprzedniKrok']);
  for (const s of SKROTY) T(`E3/${s.id}-dwujezyczny`, !!(s.pl && s.en && s.pl !== s.en), `skrot ${s.id} bez obu jezykow`);

  // Zachowanie z dokumentu: spacja pauza/wznowienie, strzalki poprzedni/nastepny krok.
  eq('E4/spacja', skrot(zd(' '), GUIDE()).akcja, 'przelaczLicznik');
  eq('E5/spacja-alias-Spacebar', skrot(zd('Spacebar'), GUIDE()).akcja, 'przelaczLicznik');
  eq('E6/spacja-alias-Space', skrot(zd('Space'), GUIDE()).akcja, 'przelaczLicznik');
  eq('E7/strzalka-w-prawo', skrot(zd('ArrowRight'), GUIDE()).akcja, 'nastepnyKrok');
  eq('E8/strzalka-w-lewo', skrot(zd('ArrowLeft'), GUIDE()).akcja, 'poprzedniKrok');
  eq('E9/inny-klawisz', skrot(zd('a'), GUIDE()).powod, 'brakSkrotu');
  eq('E10/strzalka-w-gore', skrot(zd('ArrowUp'), GUIDE()).powod, 'brakSkrotu');

  // Skrot NIE MOZE dzialac poza ekranem manewru — na ekranie opisu spacja pisze.
  for (const ekran of ['start', 'setup', 'diag', 'obs', 'interpret', 'kontrola', 'opis', 'nauka', 'lab', 'hintsKwal']) {
    eq(`E11/${ekran}`, skrot(zd(' '), GUIDE({ screen: ekran })).powod, 'innyEkran');
  }
  // Modyfikatory naleza do przegladarki (Ctrl+strzalka = przeskok slowa, Alt+strzalka = historia).
  for (const m of ['ctrlKey', 'altKey', 'metaKey', 'shiftKey']) {
    eq(`E12/${m}`, skrot(zd('ArrowRight', { [m]: true }), GUIDE()).powod, 'modyfikator');
  }
  eq('E13/powtorzenie', skrot(zd('ArrowRight', { repeat: true }), GUIDE()).powod, 'powtorzenie');
  eq('E14/powtorzenie-spacja', skrot(zd(' ', { repeat: true }), GUIDE()).powod, 'powtorzenie');

  // POLE TEKSTOWE: spacja ma PISAC. To jedyne pole w aplikacji (edycja opisu, Blok 15).
  for (const cel of [{ tag: 'TEXTAREA' }, { tag: 'INPUT', typ: 'text' }, { tag: 'INPUT', typ: 'number' },
                     { tag: 'INPUT', typ: '' }, { tag: 'DIV', edytowalne: true }]) {
    const c = { tag: 'DIV', typ: '', edytowalne: false, rola: '', ...cel };
    eq(`E15/${c.tag}${c.typ}${c.edytowalne ? '-edytowalne' : ''}`, skrot(zd(' ', { cel: c }), GUIDE()).powod, 'poleTekstowe');
    eq(`E16/${c.tag}${c.typ}${c.edytowalne ? '-edytowalne' : ''}-strzalka`, skrot(zd('ArrowRight', { cel: c }), GUIDE()).powod, 'poleTekstowe');
  }

  // KONTROLKA Z FOKUSEM: spacja ma ja WCISNAC, a strzalka w suwaku ma przestawic FAZE, nie etap.
  for (const cel of [{ tag: 'BUTTON' }, { tag: 'A' }, { tag: 'SUMMARY' }, { tag: 'INPUT', typ: 'checkbox' },
                     { tag: 'INPUT', typ: 'radio' }, { tag: 'DIV', rola: 'button' }, { tag: 'DIV', rola: 'switch' }]) {
    const c = { tag: 'DIV', typ: '', edytowalne: false, rola: '', ...cel };
    eq(`E17/${c.tag}${c.typ}${c.rola}-spacja`, skrot(zd(' ', { cel: c }), GUIDE()).powod, 'kontrolka');
  }
  for (const cel of [{ tag: 'INPUT', typ: 'range' }, { tag: 'SELECT' }, { tag: 'DIV', rola: 'slider' },
                     { tag: 'DIV', rola: 'tablist' }, { tag: 'INPUT', typ: 'radio' }]) {
    const c = { tag: 'DIV', typ: '', edytowalne: false, rola: '', ...cel };
    eq(`E18/${c.tag}${c.typ}${c.rola}-strzalka`, skrot(zd('ArrowRight', { cel: c }), GUIDE()).powod, 'kontrolka');
  }
  // Kontrola czulosci w druga strone: przycisk nie zjada STRZALEK, suwak nie zjada SPACJI —
  // bramka „odmawiaj zawsze" przechodzilaby wszystkie testy wyzej i nie dawala zadnego skrotu.
  eq('E19/przycisk-strzalka-dziala', skrot(zd('ArrowRight', { cel: { tag: 'BUTTON', typ: '', edytowalne: false, rola: '' } }), GUIDE()).akcja, 'nastepnyKrok');
  eq('E20/suwak-spacja-dziala', skrot(zd(' ', { cel: { tag: 'INPUT', typ: 'range', edytowalne: false, rola: '' } }), GUIDE()).akcja, 'przelaczLicznik');

  // Granice planu: na ostatnim etapie „dalej" nie ma dokad isc, na pierwszym „wstecz".
  eq('E21/koniec-planu', skrot(zd('ArrowRight'), GUIDE({ step: 3 })).powod, 'brakKroku');
  eq('E22/poczatek-planu', skrot(zd('ArrowLeft'), GUIDE({ step: 0 })).powod, 'brakKroku');
  eq('E23/srodek-planu-dalej', skrot(zd('ArrowRight'), GUIDE({ step: 2 })).akcja, 'nastepnyKrok');
  eq('E24/spacja-na-koncu-dziala', skrot(zd(' '), GUIDE({ step: 3 })).akcja, 'przelaczLicznik');

  // Kazdy powod odmowy ma dwujezyczna nazwe — inaczej wyrocznia mowi kodem, a ekran niczym.
  for (const [k, v] of Object.entries(POWODY_ODMOWY)) {
    T(`E25/${k}-dwujezyczny`, !!(v.pl && v.en && v.pl !== v.en), `powod ${k} bez obu jezykow`);
  }
  // Kazdy zwracany powod musi istniec w slowniku (literowka w kodzie = powod bez nazwy).
  const powody = new Set();
  for (const k of [' ', 'ArrowRight', 'ArrowLeft', 'x']) {
    for (const st of [GUIDE(), GUIDE({ screen: 'start' }), GUIDE({ step: 0 }), GUIDE({ step: 3 })]) {
      const r = skrot(zd(k), st); if (r.powod) powody.add(r.powod);
    }
  }
  for (const p of powody) T(`E26/${p}-w-slowniku`, p in POWODY_ODMOWY, `powod ${p} nie ma nazwy w slowniku`);
}

/* ═══════════ F. ZDANIE O POLACZENIU JEST FUNKCJA FAKTU ═══════════ */
{
  eq('F1/lista-pusta', FUNKCJE_WYMAGAJACE_SIECI, []);
  const puste = komunikatSieci([]);
  /* Wzorzec przyjmuje OBIE pisownie („polaczenia" i „połączenia"), bo bramka ma pilnowac TRESCI
     zdania, a nie jego ortografii — inaczej poprawienie polskich ogonkow (2026-08-12: caly modul
     PWA mial napisy widoczne dla uzytkownika bez znakow diakrytycznych) zapala wyrocznie tak, jakby
     zdanie przestalo mowic o offline. Ogonkow pilnuje osobna bramka F2b, ktora mowi WPROST, o co jej chodzi. */
  T('F2/puste-bez-polaczenia', /bez po[lł][aą]czenia/.test(puste.pl) && /offline/.test(puste.en), 'zdanie o offline nie mowi o offline');
  T('F2b/napisy-po-polsku', !/\b(dziala|polaczenia|wysyla|zadnych|wylacznie|dopoki|pamieci|podrecznej)\b/.test(puste.pl),
    `napis widoczny dla uzytkownika zgubil polskie znaki diakrytyczne: ${puste.pl.slice(0, 60)}`);
  const zLista = komunikatSieci([{ pl: 'pobieranie atlasu', en: 'atlas download' }]);
  T('F3/lista-zmienia-zdanie', zLista.pl !== puste.pl && /atlasu/.test(zLista.pl), 'zdanie nie jest funkcja listy, tylko obietnica');
  T('F4/lista-en', /atlas download/.test(zLista.en), 'wersja angielska nie wymienia funkcji sieciowej');

  /* BRAMKA: zero wywolan sieci w src/. Komentarze USUWAMY przed skanem — inaczej bramka lapie
     wlasny opis (ta sama pulapka, co przy „trzecim oknie" Bloku 14 i przy strazniku Bloku 15). */
  const bezKomentarzy = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
  const WZORCE = [/\bfetch\s*\(/, /XMLHttpRequest/, /sendBeacon/, /new\s+WebSocket/, /EventSource/];
  const skan = (tekst) => WZORCE.filter(w => w.test(bezKomentarzy(tekst))).map(String);
  const pliki = [];
  (function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : (p.endsWith('.js') && pliki.push(p)); } })(join(ROOT, 'src'));
  T('F5/pliki-skanowane', pliki.length > 20, `skan objal tylko ${pliki.length} plikow — sciezka sie rozjechala`);
  for (const p of pliki) {
    const trafienia = skan(readFileSync(p, 'utf8'));
    T(`F6/${p.slice(ROOT.length + 1).replace(/\\/g, '/')}`, trafienia.length === 0, `wywolanie sieci: ${trafienia.join(', ')}`);
  }
  // Kontrola czulosci w OBIE strony: bramka musi zlapac prawdziwe wywolanie i przepuscic komentarz.
  T('F7/czulosc-lapie', skan('async function a(){ return await fetch("/x"); }').length === 1, 'bramka nie widzi prawdziwego wywolania fetch');
  T('F8/czulosc-komentarz', skan('/* nie wolno wolac fetch( ) ani sendBeacon */').length === 0, 'bramka lapie wlasny komentarz');
  T('F9/czulosc-linia', skan('// tu kiedys bylo fetch(url)').length === 0, 'bramka lapie komentarz liniowy');
}

/* ═══════════ G. SERVICE WORKER — URUCHOMIONY, NIE PRZECZYTANY ═══════════ */
{
  const ASSETS = ['./', 'index.html', 'assets/index-abc.js', 'otorepo.html'];
  const zbuduj = (opcje = {}) => {
    const zdarzenia = {};
    const self = {
      addEventListener: (typ, fn) => { (zdarzenia[typ] = zdarzenia[typ] || []).push(fn); },
      skipWaiting: () => { self._skip++; },
      clients: { claim: () => { self._claim++; return Promise.resolve(); } },
      _skip: 0, _claim: 0,
    };
    const wCache = new Map(opcje.wCache || []);
    const log = { addAll: [], usuniete: [], zapytania: [] };
    const url = (r) => (typeof r === 'string' ? r : r.url);
    const caches = {
      open: async () => ({ addAll: async (l) => { log.addAll.push(...l); } }),
      keys: async () => (opcje.klucze || []),
      delete: async (k) => { log.usuniete.push(k); return true; },
      match: async (r, o) => { log.zapytania.push({ url: url(r), opcje: o }); return wCache.get(url(r)) || undefined; },
    };
    const fetchFn = async (r) => {
      log.siec = (log.siec || []).concat(url(r));
      if (opcje.siecPada) throw new Error('offline');
      return { zSieci: true, url: url(r) };
    };
    const src = swSource('otorepo-test', ASSETS);
    // eslint-disable-next-line no-new-func
    new Function('self', 'caches', 'fetch', 'Response', src)(self, caches, fetchFn, Response);
    return { self, zdarzenia, log, src };
  };

  // G1-G3: instalacja precache'uje CALOSC i NIE przejmuje karty.
  {
    const { self, zdarzenia, log } = zbuduj();
    let czekano = null;
    zdarzenia.install[0]({ waitUntil: (p) => { czekano = p; } });
    await czekano;
    eq('G1/precache', log.addAll, ASSETS);
    T('G2/instalacja-nie-przejmuje', self._skip === 0,
       'install wola skipWaiting — nowa wersja przejmuje karte w trakcie manewru (zmierzony bialy ekran po wdrozeniu)');
    T('G3/install-czeka', typeof czekano.then === 'function', 'install nie zglasza pracy przez waitUntil');
  }

  // G4-G6: jedyna droga do natychmiastowego przejecia to SWIADOMA prosba aplikacji.
  {
    const { self, zdarzenia } = zbuduj();
    zdarzenia.message[0]({ data: { typ: 'OTOREPO_WDROZ' } });
    T('G4/wiadomosc-wdraza', self._skip === 1, 'prosba aplikacji nie wdraza nowej wersji');
    zdarzenia.message[0]({ data: { typ: 'cos-innego' } });
    zdarzenia.message[0]({ data: null });
    zdarzenia.message[0]({});
    T('G5/obca-wiadomosc-nic', self._skip === 1, 'obca wiadomosc wdraza nowa wersje');
    T('G6/ma-nasluch-message', (zdarzenia.message || []).length === 1, 'worker nie sluchaja prosby o wdrozenie');
  }

  // G7-G9: aktywacja kasuje STARE cache i tylko stare.
  {
    const { self, zdarzenia, log } = zbuduj({ klucze: ['otorepo-stare', 'otorepo-test', 'obcy-cache'] });
    let czekano = null;
    zdarzenia.activate[0]({ waitUntil: (p) => { czekano = p; } });
    await czekano;
    T('G7/kasuje-stare', log.usuniete.includes('otorepo-stare'), 'stary cache zostaje na dysku uzytkownika');
    T('G8/zostawia-biezacy', !log.usuniete.includes('otorepo-test'), 'aktywacja kasuje WLASNY cache');
    T('G9/przejmuje-po-aktywacji', self._claim === 1, 'po aktywacji worker nie przejmuje kart');
  }

  // G10-G13: TRAFIENIE W CACHE — z ignoreVary. To jest naprawa zmierzonej awarii offline.
  {
    const { zdarzenia, log } = zbuduj({ wCache: [['/assets/index-abc.js', { zCache: true }]] });
    const ev = { request: { method: 'GET', url: '/assets/index-abc.js', mode: 'cors' }, respondWith: (p) => { ev._o = p; } };
    zdarzenia.fetch[0](ev);
    const odp = await ev._o;
    T('G10/trafienie', odp && odp.zCache === true, 'zadanie modulu nie dostalo pliku z cache');
    T('G11/ignoreVary', log.zapytania[0].opcje && log.zapytania[0].opcje.ignoreVary === true,
       'dopasowanie honoruje Vary — modul ES (tryb CORS) niesie Origin, ktorego nie mialo zadanie z addAll, i cache NIE TRAFIA');
    T('G12/bez-sieci-przy-trafieniu', !log.siec, 'przy trafieniu w cache worker i tak poszedl do sieci');
  }
  {
    const { zdarzenia, log } = zbuduj({ wCache: [] });
    const ev = { request: { method: 'POST', url: '/x', mode: 'cors' }, respondWith: (p) => { ev._o = p; } };
    zdarzenia.fetch[0](ev);
    T('G13/POST-nietkniety', ev._o === undefined, 'worker odpowiada na zadania inne niz GET');
  }

  // G14-G15: brak w cache + dziala siec → siec (aplikacja online dostaje swiezy plik).
  {
    const { zdarzenia, log } = zbuduj({ wCache: [] });
    const ev = { request: { method: 'GET', url: '/nowy.js', mode: 'cors' }, respondWith: (p) => { ev._o = p; } };
    zdarzenia.fetch[0](ev);
    const odp = await ev._o;
    T('G14/pudlo-idzie-do-sieci', odp && odp.zSieci === true, 'pudlo w cache nie probuje sieci');
    T('G15/siec-dostala-zadanie', (log.siec || []).includes('/nowy.js'), 'zadanie nie trafilo do sieci');
  }

  // G16-G18: brak w cache + siec pada. NAWIGACJA dostaje dokument, SKRYPT nie dostaje HTML-a.
  {
    const { zdarzenia } = zbuduj({ siecPada: true, wCache: [['index.html', { dokument: true }]] });
    const nav = { request: { method: 'GET', url: '/cokolwiek', mode: 'navigate' }, respondWith: (p) => { nav._o = p; } };
    zdarzenia.fetch[0](nav);
    const odpNav = await nav._o;
    T('G16/nawigacja-dostaje-dokument', odpNav && odpNav.dokument === true, 'offline nawigacja nie dostaje dokumentu z cache');

    const skrypt = { request: { method: 'GET', url: '/assets/stary.js', mode: 'cors' }, respondWith: (p) => { skrypt._o = p; } };
    zdarzenia.fetch[0](skrypt);
    const odpSkrypt = await skrypt._o;
    T('G17/skrypt-nie-dostaje-html', !(odpSkrypt && odpSkrypt.dokument),
       'zadanie skryptu dostalo DOKUMENT — to jest zmierzony blad „Expected a JavaScript module but the server responded with text/html"');
    T('G18/skrypt-dostaje-504', odpSkrypt && odpSkrypt.status === 504, `skrypt dostal status ${odpSkrypt && odpSkrypt.status} zamiast 504`);
  }

  // G19: nazwa cache i lista zasobow trafiaja do wygenerowanego pliku (bez tego precache byloby puste).
  {
    const { src } = zbuduj();
    T('G19/cache-w-tresci', src.includes("'otorepo-test'"), 'nazwa cache nie trafila do workera');
    T('G20/zasoby-w-tresci', ASSETS.every(a => src.includes(JSON.stringify(a))), 'lista zasobow nie trafila do workera');
  }
}

/* ═══════════ WYNIK ═══════════ */
const OCZEKIWANE = 237;   /* 237 = 236 + 1 (D-CPN, 2026-08-21): bramka F6 biegnie RAZ NA PLIK w src/,
                             a doszedl src/app/cpn-model.js — czysty modul z trescia kliniczna karty
                             osrodkowego oczoplasu pozycyjnego. Przyrost jest wiec MECHANICZNY (nowy
                             plik = nowy przypadek F6), nie merytoryczny. */
                          /* 236 = 235 + 1: skan zrodla objal nowy modul silnika spv-bridge.js (ocena II V13/D6) */   // +1: bramka F6 biegnie RAZ NA PLIK w src/, a doszedl src/app/flow-deps.js (scena ekranu startowego)
if (ok !== OCZEKIWANE) bledy.push(`LICZBA PRZYPADKÓW: ${ok}, oczekiwano ${OCZEKIWANE} — dopisz albo popraw zakres, ale nie po cichu`);
if (bledy.length) { console.error(`✗ pwa:check — ${bledy.length} błędów (${ok} przeszło)`); for (const b of bledy) console.error('  ' + b); process.exit(1); }
console.log(`✓ pwa:check — ${ok} przypadków`);
