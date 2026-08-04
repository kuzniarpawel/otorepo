/* OTOREPO — wyrocznia CZYSTEGO MODELU KONTROLI PO MANEWRZE (Blok 11). Gołe Node, bez jsdom.
 *
 * Bada twierdzenia o MODELU. Twierdzenia o EKRANIE (kryteria odbioru nr 1 i nr 3 są zdaniami
 * o tym, co widać i czego dotyka użytkownik) bada osobno tools/followup-dom.mjs — ta sama zasada,
 * dla której Bloki 9 i 10 mają po dwie wyrocznie.
 *
 * Każda bramka ma KONTROLĘ CZUŁOŚCI: stan bliźniaczy, w którym wynik MUSI być przeciwny.
 * Najważniejsze niezmienniki sprawdzamy na PEŁNYM ILOCZYNIE stanów, a nie na ręcznie dobranych
 * przypadkach: przypadek dowodzi, że reguła działa DLA NIEGO, iloczyn dowodzi, że nie istnieje
 * kombinacja, która ją łamie (ten sam ruch, co przy kwalifikacji wstępnej w Bloku 6).
 *
 * Uruchomienie: npm run fu:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  WYNIKI, WYNIK_IDS, TOLERANCJA_IDS, wynikKontroli, AKCJE, AKCJA_IDS, ZAWSZE_DOSTEPNE, POWODY_ZAKAZU, REGULY_KROKOW,
  nastepneKroki, celAkcji, kontrolaMozliwa, POWODY_BRAKU_KONTROLI, spojnoscWyniku, SPRZECZNOSCI,
  wpisKontroli, POLA_WPISU, bezDanychOsobowych, podsumowanieSesji, streszczenieKontroli,
} from '../src/app/followup-model.js';
import { followupDeps } from '../src/app/followup-deps.js';
import { MANEUVERS, CANALS, CANAL_OF } from '../src/pose/maneuvers.js';
import { POWODY_NIEWIARYGODNOSCI } from '../src/app/obs-model.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const D = followupDeps();
const KANALY = ['posterior', 'horizontal', 'anterior'];

// Stan sesji zbudowany jak w aplikacji: manewr wykonany, plan tego samego manewru.
function stanPo(manewr, opcje = {}) {
  const plan = MANEUVERS[manewr].gen(opcje.strona || 'P');
  plan.key = manewr;
  return {
    canal: opcje.canal !== undefined ? opcje.canal : CANAL_OF[manewr],
    side: opcje.strona || 'P',
    variant: plan.mechanism || 'canalo',
    testKey: opcje.testKey !== undefined ? opcje.testKey : 'dix',
    trybCzasu: opcje.trybCzasu || 'staly',
    plan,
    kontrole: opcje.kontrole || [],
    kontrolaPowod: opcje.kontrolaPowod || null,
    obs: opcje.obs || {},
    flow: {
      testSeen: true, obsSeen: true, interpretSeen: true,
      maneuver: {
        key: manewr, planSide: opcje.strona || 'P', canal: CANAL_OF[manewr],
        consumed: opcje.consumed !== false, viaInterpret: opcje.viaInterpret !== false,
        kontrolaIdx: opcje.kontrolaIdx !== undefined ? opcje.kontrolaIdx : null,
        inputs: {},
      },
    },
  };
}

/* ═══════════ A. SŁOWNIK ZAMKNIĘTY ═══════════ */
eq('SL1/liczba-wynikow', WYNIKI.length, 7);
eq('SL2/identyfikatory', WYNIK_IDS, ['ustapienie', 'czesciowaPoprawa', 'brakPoprawy', 'konwersja', 'drugaStrona', 'residual', 'niewiarygodne']);
T('SL3/unikalne', new Set(WYNIK_IDS).size === WYNIK_IDS.length, 'identyfikatory wyników muszą być unikalne');
for (const w of WYNIKI) {
  T(`SL4/${w.id}/dwujezyczny`, !!w.pl && !!w.en && !!w.pytaniePl && !!w.pytanieEn && !!w.uwagaPl && !!w.uwagaEn,
    'każda pozycja musi mieć komplet napisów w obu językach');
  T(`SL5/${w.id}/uwaga-niesie-tresc`, w.uwagaPl.length > 40 && w.uwagaEn.length > 40,
    'uwaga kliniczna nie może być etykietą — to ona niesie treść bloku');
}
// DOKŁADNIE JEDNA odpowiedź niewiarygodna i DOKŁADNIE dwie zamykające proces.
eq('SL6/jedna-niewiarygodna', WYNIKI.filter(w => !w.wiarygodny).map(w => w.id), ['niewiarygodne']);
eq('SL7/zamykajace', WYNIKI.filter(w => w.zamyka).map(w => w.id), ['ustapienie', 'residual']);
eq('SL8/nowa-podstawa', WYNIKI.filter(w => w.nowaPodstawa).map(w => w.id), ['konwersja', 'drugaStrona']);
eq('SL9/nieznany-null', wynikKontroli('bzdura'), null);
eq('SL10/akcje', AKCJA_IDS.sort(), ['alternatywnyManewr', 'obserwuj', 'ponownaInterpretacja', 'powtorzManewr', 'powtorzProbe', 'zakonczSesje']);
for (const a of AKCJA_IDS) T(`SL11/${a}/dwujezyczna`, !!AKCJE[a].pl && !!AKCJE[a].en, 'akcja musi mieć oba napisy');

/* ═══════════ B. KRYTERIUM ODBIORU NR 3 — ZAKOŃCZENIE SESJI ZAWSZE DOSTĘPNE ═══════════
   Niezmiennik na PEŁNYM iloczynie: 7 wyników × 6 manewrów × 2 strony × 2 drogi dojścia × 3 kanały
   deklarowane. Żadna reguła `zakaz` nie ma prawa zabrać zakończenia sesji, bo to jedyna droga
   wyjścia z badania bez podawania czegokolwiek. */
{
  let zle = 0, razem = 0;
  for (const id of WYNIK_IDS)
    for (const man of Object.keys(MANEUVERS))
      for (const strona of ['L', 'P'])
        for (const testKey of ['dix', null])
          for (const canal of KANALY) {
            razem++;
            const k = nastepneKroki(id, stanPo(man, { strona, testKey, canal }), D);
            const wszedzie = [k.glowny, ...k.dalsze, ...k.zawszeDostepne];
            const zakazane = k.zakaz.map(z => z.akcja);
            if (!wszedzie.includes('zakonczSesje') || zakazane.includes('zakonczSesje')) zle++;
          }
  eq('KO3-1/zawsze-mozna-zakonczyc', zle, 0);
  // Liczba kombinacji liczona z RZECZYWISTYCH zbiorów, nie wpisana: gdyby ktoś dołożył manewr,
  // literał po cichu przestałby opisywać to, co bramka naprawdę przeszła.
  const spodziewane = WYNIK_IDS.length * Object.keys(MANEUVERS).length * 2 * 2 * KANALY.length;
  T('KO3-2/iloczyn-pelny', razem === spodziewane && razem > 500, `iloczyn ma mieć ${spodziewane} kombinacji, ma ${razem}`);
}

/* ═══════════ C. KRYTERIUM ODBIORU NR 2 — KONWERSJA NIE JEST POWTÓRKĄ ═══════════
   „Konwersja kanałowa prowadzi do ponownej interpretacji zamiast prostego powtórzenia tego samego
   manewru." Sprawdzamy DWIE rzeczy naraz, bo osobno każda z nich przechodzi na uszkodzonym
   modelu: (a) głównym krokiem MUSI być ponowna interpretacja, (b) powtórzenie manewru NIE MOŻE
   się w ogóle pojawić na liście. */
{
  let zleGlowny = 0, zlePowtorka = 0, bezPowodu = 0;
  for (const man of Object.keys(MANEUVERS))
    for (const strona of ['L', 'P'])
      for (const testKey of ['dix', 'roll', null]) {
        const k = nastepneKroki('konwersja', stanPo(man, { strona, testKey }), D);
        if (k.glowny !== 'ponownaInterpretacja') zleGlowny++;
        if ([k.glowny, ...k.dalsze].includes('powtorzManewr')) zlePowtorka++;
        if (!k.zakaz.every(z => z.pl && z.en)) bezPowodu++;
      }
  eq('KO2-1/glowny-to-interpretacja', zleGlowny, 0);
  eq('KO2-2/bez-powtorki', zlePowtorka, 0);
  eq('KO2-3/zakaz-z-uzasadnieniem', bezPowodu, 0);
}
// Alternatywny manewr TEGO SAMEGO kanału też jest zakazany: leczyłby kanał, z którego złóg wyszedł.
{
  const k = nastepneKroki('konwersja', stanPo('epley'), D);
  eq('KO2-4/bez-alternatywy-tego-kanalu', [k.glowny, ...k.dalsze].includes('alternatywnyManewr'), false);
  eq('KO2-5/dwa-zakazy', k.zakaz.map(z => z.akcja).sort(), ['alternatywnyManewr', 'powtorzManewr']);
}
/* TABELA MUSI BYĆ NIESPRZECZNA SAMA W SOBIE. Powód jest ZMIERZONY: `nastepneKroki` odsiewa akcje
   zakazane, więc dopisanie „powtórz manewr" do listy dalszych kroków konwersji NIE ZMIENIA jej
   wyniku — mutacja przechodziła całą wyrocznię na zielono. Filtr broni ekranu, ale przestaje
   pilnować źródła; od tego są trzy bramki niżej, czytające tabelę WPROST. */
{
  let sprzeczne = 0, glownyWDalszych = 0, obceId = 0;
  for (const id of WYNIK_IDS) {
    const r = REGULY_KROKOW[id];
    const zak = new Set(r.zakaz.map(z => z[0]));
    if ([r.glowny, ...r.dalsze].some(a => zak.has(a))) sprzeczne++;
    if (r.dalsze.includes(r.glowny)) glownyWDalszych++;
    if ([r.glowny, ...r.dalsze, ...r.zakaz.map(z => z[0])].some(a => !AKCJA_IDS.includes(a))) obceId++;
    if (r.zakaz.some(z => !POWODY_ZAKAZU[z[1]])) obceId++;
  }
  eq('TB1/zakaz-rozlaczny-z-oferta', sprzeczne, 0);
  eq('TB2/glowny-nie-dubluje-dalszych', glownyWDalszych, 0);
  eq('TB3/same-znane-identyfikatory', obceId, 0);
  eq('TB4/komplet-wynikow', Object.keys(REGULY_KROKOW).sort(), WYNIK_IDS.slice().sort());
}
// KONTROLA CZUŁOŚCI: przy „częściowej poprawie" powtórzenie manewru jest krokiem GŁÓWNYM.
{
  const k = nastepneKroki('czesciowaPoprawa', stanPo('epley'), D);
  eq('KO2-6/czulosc-powtorka-dozwolona', k.glowny, 'powtorzManewr');
  eq('KO2-7/czulosc-bez-zakazow', k.zakaz, []);
}

/* ═══════════ D. ZAWROTY RESZTKOWE NIE SĄ WSKAZANIEM DO REPOZYCJI ═══════════
   Bez oczopląsu pozycyjnego nie ma czego repozycjonować, a residual dizziness jest opisane po
   SKUTECZNEJ repozycji. Powtórzenie manewru z tego powodu jest błędem, więc żadna z akcji
   repozycyjnych nie ma prawa się pojawić. */
{
  let zle = 0;
  for (const man of Object.keys(MANEUVERS)) {
    const k = nastepneKroki('residual', stanPo(man), D);
    const wszystkie = [k.glowny, ...k.dalsze];
    if (wszystkie.includes('powtorzManewr') || wszystkie.includes('alternatywnyManewr')) zle++;
  }
  eq('RE1/bez-repozycji', zle, 0);
  const k = nastepneKroki('residual', stanPo('epley'), D);
  eq('RE2/glowny-obserwacja', k.glowny, 'obserwuj');
  T('RE3/powod-nazwany', k.zakaz.every(z => /nie ma czego repozycjonować|nothing to reposition/.test(z.pl + z.en)),
    'zakaz musi nieść powód, a nie samo wyszarzenie');
}
// „Badanie niewiarygodne" też nie uzasadnia repozycji — ale z INNEGO powodu, i to musi być widać.
{
  const k = nastepneKroki('niewiarygodne', stanPo('epley'), D);
  eq('NW1/glowny-powtorz-probe', k.glowny, 'powtorzProbe');
  eq('NW2/bez-repozycji', [k.glowny, ...k.dalsze].filter(a => a === 'powtorzManewr' || a === 'alternatywnyManewr'), []);
  T('NW3/inny-powod-niz-residual', k.zakaz[0].powod === 'niewiarygodneNieUzasadnia',
    'powód zakazu przy niewiarygodnym badaniu jest inny niż przy zawrotach resztkowych');
}

/* ═══════════ E. ALTERNATYWA ISTNIEJE TYLKO TAM, GDZIE NAPRAWDĘ ISTNIEJE ═══════════
   Kanał przedni ma JEDEN manewr (Yacovino), więc przycisk „wykonaj alternatywny manewr"
   prowadziłby donikąd. Liczba manewrów czytana z CANALS, nie wpisana. */
{
  const kPrzedni = nastepneKroki('brakPoprawy', stanPo('yacovino'), D);
  eq('AL1/przedni-bez-alternatywy', [kPrzedni.glowny, ...kPrzedni.dalsze].includes('alternatywnyManewr'), false);
  const kTylny = nastepneKroki('brakPoprawy', stanPo('epley'), D);
  eq('AL2/tylny-z-alternatywa', kTylny.dalsze.includes('alternatywnyManewr'), true);
  T('AL3/zrodlo-z-CANALS', (CANALS.anterior.maneuvers || []).length === 1 && (CANALS.posterior.maneuvers || []).length > 1,
    'kontrola: liczba manewrów kanału pochodzi z CANALS, więc bramka mierzy rzeczywistość, nie literał');
}

/* ═══════════ F. CEL NAWIGACYJNY ZALEŻY OD DROGI DOJŚCIA ═══════════
   Ekran interpretacji bez `testKey` nie ma z czego się zbudować (renderInterpret czyta rekord
   próby), więc w trybie eksperckim „ustal kanał i stronę od nowa" musi celować w ekran doboru.
   To jest ta sama pułapka, którą Blok 5 zamknął bramką `wymaga`/`zamiast`. */
eq('CE1/z-proba', celAkcji('ponownaInterpretacja', { testKey: 'dix' }), 'interpret');
eq('CE2/bez-proby', celAkcji('ponownaInterpretacja', { testKey: null }), 'setup');
eq('CE3/proba-kontrolna-z-proba', celAkcji('powtorzProbe', { testKey: 'roll' }), 'obs');
eq('CE4/proba-kontrolna-bez-proby', celAkcji('powtorzProbe', { testKey: null }), 'setup');
eq('CE5/manewr', celAkcji('powtorzManewr', {}), 'guide');
eq('CE6/zakonczenie-bez-celu', celAkcji('zakonczSesje', {}), null);
eq('CE7/cel-glownego-w-wyniku', nastepneKroki('konwersja', stanPo('epley', { testKey: null }), D).cel, 'setup');

/* ═══════════ G. CZY JEST CO KONTROLOWAĆ ═══════════ */
{
  const bezManewru = { flow: { maneuver: null } };
  eq('KM1/bez-manewru', kontrolaMozliwa(bezManewru).powod, 'brakManewru');
  eq('KM2/niewykonany', kontrolaMozliwa(stanPo('epley', { consumed: false })).powod, 'niewykonany');
  eq('KM3/wykonany', kontrolaMozliwa(stanPo('epley')).mozliwa, true);
  eq('KM4/pusty-stan', kontrolaMozliwa(null).mozliwa, false);
  T('KM5/powody-dwujezyczne', Object.values(POWODY_BRAKU_KONTROLI).every(p => p.pl && p.en), 'oba powody w dwóch językach');
  // Trzy stany dają TRZY różne zdania — inaczej ekran pisałby to samo o dwóch różnych sytuacjach.
  T('KM6/rozne-zdania', POWODY_BRAKU_KONTROLI.brakManewru.pl !== POWODY_BRAKU_KONTROLI.niewykonany.pl, 'zdania muszą się różnić');
}

/* ═══════════ H. SPRZECZNOŚCI ═══════════ */
{
  // Konwersja zaznaczona, ale kanał w stanie nadal ten sam co leczony → nie wiadomo, dokąd złóg przeszedł.
  const s1 = stanPo('epley');                                   // canal = posterior = kanał Epleya
  eq('SP1/konwersja-bez-kanalu', spojnoscWyniku('konwersja', s1, D).map(x => x.pole), ['konwersjaBezKanalu']);
  // KONTROLA CZUŁOŚCI: po wskazaniu innego kanału sprzeczność znika.
  const s2 = stanPo('epley', { canal: 'horizontal' });
  eq('SP2/czulosc-kanal-wskazany', spojnoscWyniku('konwersja', s2, D), []);
  // Ustąpienie przy innym kanale niż leczony = dwie sprzeczne rzeczy naraz.
  eq('SP3/ustapienie-mimo-innego-kanalu', spojnoscWyniku('ustapienie', s2, D).map(x => x.pole), ['ustapienieMimoInnegoKanalu']);
  eq('SP4/czulosc-ustapienie-zgodne', spojnoscWyniku('ustapienie', s1, D), []);
  // Niewiarygodne bez powodu — zapis mówi tylko „nie wiadomo".
  eq('SP5/niewiarygodne-bez-powodu', spojnoscWyniku('niewiarygodne', s1, D).map(x => x.pole), ['niewiarygodneBezPowodu']);
  const s3 = stanPo('epley', { kontrolaPowod: 'szyja' });
  eq('SP6/czulosc-powod-podany', spojnoscWyniku('niewiarygodne', s3, D), []);
  T('SP7/sprzecznosci-dwujezyczne', Object.values(SPRZECZNOSCI).every(x => x.pl && x.en), 'każda sprzeczność w dwóch językach');
  // Sprzeczność NIE blokuje: model ją nazywa, decyzję zostawia człowiekowi.
  T('SP8/nie-blokuje', !!nastepneKroki('konwersja', s1, D), 'sprzeczność nie ma prawa unieważnić następnego kroku');
  // Wyniki, które nie mają o co się sprzeczać, milczą — alarm bez powodu uczy ignorowania.
  eq('SP9/cisza-przy-braku-poprawy', spojnoscWyniku('brakPoprawy', s1, D), []);
  eq('SP10/cisza-przy-residual', spojnoscWyniku('residual', s1, D), []);
}

/* ═══════════ I. WPIS DO HISTORII SERII ═══════════ */
{
  const s = stanPo('epley', { strona: 'L' });
  const w = wpisKontroli(s, 'czesciowaPoprawa', D);
  eq('WP1/manewr', w.manewr, 'epley');
  eq('WP2/kanal', w.kanal, 'posterior');
  eq('WP3/strona', w.strona, 'L');
  eq('WP4/wynik', w.wynik, 'czesciowaPoprawa');
  eq('WP5/czasy-z-planu', w.czasy, s.plan.steps.map(x => (x.seconds == null ? null : x.seconds)));
  eq('WP6/czasy-skad', w.czasySkad, 'plan');
  eq('WP7/powod-tylko-przy-niewiarygodnym', w.powod, null);
  eq('WP8/pola-ze-slownika', Object.keys(w).every(k => POLA_WPISU.includes(k)), true);
  // Tryb „do ustąpienia oczopląsu" PODNOSI czasy planu, więc zapis musi mówić, skąd się wzięły.
  const sPodniesiony = stanPo('epley', { trybCzasu: 'doUstapienia' });
  eq('WP9/czasy-podniesione', wpisKontroli(sPodniesiony, 'ustapienie', D).czasySkad, 'planPodniesiony');
  // Powód niewiarygodności wchodzi do wpisu WYŁĄCZNIE przy wyniku niewiarygodnym.
  const sPowod = stanPo('epley', { kontrolaPowod: 'mruganie' });
  eq('WP10/powod-przy-niewiarygodnym', wpisKontroli(sPowod, 'niewiarygodne', D).powod, 'mruganie');
  eq('WP11/powod-ignorowany-gdzie-indziej', wpisKontroli(sPowod, 'ustapienie', D).powod, null);
  // Bez manewru nie ma wpisu — kontrola nie ma podmiotu.
  eq('WP12/bez-manewru-null', wpisKontroli({ flow: { maneuver: null } }, 'ustapienie', D), null);
  // Plan NALEŻĄCY DO INNEGO MANEWRU nie ma prawa oddać swoich czasów: po zmianie manewru na
  // ekranie kontroli wpis opisywałby przebieg, którego nie było.
  const sObcy = stanPo('epley'); sObcy.plan = MANEUVERS.lempert.gen('P'); sObcy.plan.key = 'lempert';
  eq('WP13/obcy-plan-bez-czasow', wpisKontroli(sObcy, 'ustapienie', D).czasy, []);
}

/* ═══════════ J. KRYTERIUM ODBIORU NR 3 — STRAŻNIK DANYCH ═══════════
   Wpis budujemy TĄ SAMĄ DROGĄ, którą buduje go aplikacja (`wpisKontroli`), a nie ręcznie: bramka
   sprawdzająca wyłącznie rekord wpisany w teście dowodzi tylko tego, że test jest poprawny.
   Ta luka wyszła w torze VOG przy przeglądzie eksportu i zamykamy ją tu od razu. */
{
  for (const man of Object.keys(MANEUVERS))
    for (const id of WYNIK_IDS) {
      const s = stanPo(man, { kontrolaPowod: 'szyja' });
      const g = bezDanychOsobowych(wpisKontroli(s, id, D), D);
      T(`DO1/${man}/${id}`, g.czysty, `wpis z realnej drogi musi przejść strażnika: ${g.powody.join(', ')}`);
    }
  // KONTROLA CZUŁOŚCI — strażnik MUSI odrzucić każdą z tych czterech rzeczy.
  const bazowy = wpisKontroli(stanPo('epley'), 'ustapienie', D);
  T('DO2/obce-pole', !bezDanychOsobowych({ ...bazowy, pacjent: 'Kowalski' }, D).czysty, 'pole spoza słownika musi być odrzucone');
  T('DO3/wolny-tekst', !bezDanychOsobowych({ ...bazowy, wynik: 'pacjent Jan K., ur. 1954' }, D).czysty, 'napis spoza słownika musi być odrzucony');
  T('DO4/obcy-manewr', !bezDanychOsobowych({ ...bazowy, manewr: 'wlasny-opis' }, D).czysty, 'manewr spoza MANEUVERS musi być odrzucony');
  T('DO5/obca-strona', !bezDanychOsobowych({ ...bazowy, strona: 'lewa noga' }, D).czysty, 'strona spoza L/P musi być odrzucona');
  T('DO6/czasy-nieliczbowe', !bezDanychOsobowych({ ...bazowy, czasy: ['trzydzieści'] }, D).czysty, 'czasy muszą być liczbami');
  T('DO7/powod-spoza-slownika', !bezDanychOsobowych({ ...bazowy, wynik: 'niewiarygodne', powod: 'bo tak' }, D).czysty, 'powód musi pochodzić ze słownika Bloku 8');
  T('DO8/powod-ze-slownika-przechodzi', bezDanychOsobowych({ ...bazowy, wynik: 'niewiarygodne', powod: POWODY_NIEWIARYGODNOSCI[0].id }, D).czysty,
    'powód ze słownika Bloku 8 musi przejść — inaczej strażnik jest po prostu zawsze na „nie"');
  T('DO9/nie-obiekt', !bezDanychOsobowych('Kowalski', D).czysty, 'napis zamiast wpisu to naruszenie, nie wyjątek');
  // Strażnik ODRZUCA, a nie czyści: wpis wchodzący nie może wyjść zmieniony.
  const kopia = { ...bazowy, pacjent: 'X' };
  bezDanychOsobowych(kopia, D);
  T('DO10/bez-sanityzacji', kopia.pacjent === 'X', 'strażnik nie ma prawa po cichu usuwać pól — ma odmówić zapisu');
  // Powody odrzucenia są NAZWANE (ekran ma co pokazać zamiast „błąd").
  T('DO11/powody-nazwane', bezDanychOsobowych({ ...bazowy, pacjent: 'X' }, D).powody.some(p => /pacjent/.test(p)), 'powód odrzucenia musi wskazywać pole');
}

/* ═══════════ K. STRESZCZENIE DLA PASKA PRZEBIEGU ═══════════ */
{
  eq('ST1/bez-kontroli', streszczenieKontroli(stanPo('epley')).status, 'todo');
  const zWynikiem = (id, powod) => {
    const wpis = wpisKontroli(stanPo('epley', { kontrolaPowod: powod }), id, D);
    return streszczenieKontroli(stanPo('epley', { kontrole: [wpis], kontrolaIdx: 0 }));
  };
  eq('ST2/ustapienie-done', zWynikiem('ustapienie').status, 'done');
  eq('ST3/ustapienie-zamyka', zWynikiem('ustapienie').zamyka, true);
  eq('ST4/brak-poprawy-done', zWynikiem('brakPoprawy').status, 'done');
  eq('ST5/brak-poprawy-nie-zamyka', zWynikiem('brakPoprawy').zamyka, false);
  // NAJWAŻNIEJSZY z tych pięciu: „niewiarygodne" NIE MOŻE meldować kroku jako zakończonego.
  eq('ST6/niewiarygodne-unreliable', zWynikiem('niewiarygodne', 'szyja').status, 'unreliable');
  eq('ST7/niewiarygodne-nie-zamyka', zWynikiem('niewiarygodne', 'szyja').zamyka, false);
  eq('ST8/konwersja-nowa-podstawa', zWynikiem('konwersja').nowaPodstawa, true);
  eq('ST9/seria-liczona', zWynikiem('ustapienie').seria, 1);
  // Wpis istnieje, ale NIE NALEŻY do bieżącego manewru (kontrolaIdx null) → krok jest niewykonany.
  const obcy = streszczenieKontroli(stanPo('epley', { kontrole: [wpisKontroli(stanPo('epley'), 'ustapienie', D)], kontrolaIdx: null }));
  eq('ST10/obca-kontrola-nie-liczy-sie', obcy.status, 'todo');
}

/* ═══════════ L. PODSUMOWANIE SESJI ═══════════ */
{
  const wpis = wpisKontroli(stanPo('epley'), 'ustapienie', D);
  const s = stanPo('epley', { kontrole: [wpis], kontrolaIdx: 0 });
  s.flow.triage = { complete: true, kategoria: 'tEVS', sciezka: 'diag', pewnosc: 'wysoka', czerwona: false };
  s.obs = { dix: { proba: 'dix', wystapil: 'tak', pola: {} } };
  s.sideZrodlo = 'wybrany'; s.variantZrodlo = 'wyprowadzony';
  const p = podsumowanieSesji(s, D);
  eq('PS1/kwalifikacja', p.kwalifikacja.kategoria, 'tEVS');
  eq('PS2/opisane-proby', p.opisaneProby, ['dix']);
  eq('PS3/kontrole', p.kontrole.map(k => k.wynik), ['ustapienie']);
  eq('PS4/domkniete', p.domkniete, true);
  eq('PS5/zrodla', [p.stronaZrodlo, p.mechanizmZrodlo], ['wybrany', 'wyprowadzony']);
  eq('PS6/czasy-skad', p.czasySkad, 'plan');
  eq('PS7/manewr-bez-kontroli', p.manewrBezKontroli, false);
  // Manewr wybrany, ale bez kontroli — najczęstsza dziura w opisie badania; podsumowanie ma ją NAZWAĆ.
  eq('PS8/dziura-nazwana', podsumowanieSesji(stanPo('epley'), D).manewrBezKontroli, true);
  // Pusta sesja nie udaje wypełnionej: pozycje bez wartości wracają jako null, a nie znikają.
  const pusty = podsumowanieSesji({ flow: {} }, D);
  T('PS9/pusta-sesja-ma-pozycje', 'kwalifikacja' in pusty && 'proba' in pusty && 'kanal' in pusty,
    'brak wartości musi być widoczny jako null, a nie jako brak pozycji');
  eq('PS10/pusta-sesja-nie-domknieta', pusty.domkniete, false);
  // ŻADNEGO wolnego tekstu w podsumowaniu: same identyfikatory, liczby i wartości logiczne.
  const napisy = JSON.stringify(p).match(/"[^"]*"/g).map(x => x.slice(1, -1));
  const dozwolone = new Set([...WYNIK_IDS, ...KANALY, ...Object.keys(MANEUVERS), ...POWODY_NIEWIARYGODNOSCI.map(x => x.id),
    'L', 'P', 'canalo', 'cupulo', 'dix', 'roll', 'bowlean', 'headhang', 'plan', 'planPodniesiony',
    'tEVS', 'diag', 'wysoka', 'wybrany', 'wyprowadzony', 'nadpisany',
    ...Object.keys(p), 'manewr', 'kanal', 'strona', 'wynik', 'powod', 'tolerancja', 'kategoria', 'sciezka', 'pewnosc', 'czerwona',
    ...TOLERANCJA_IDS]);
  const obce = napisy.filter(x => x && !dozwolone.has(x));
  eq('PS11/bez-wolnego-tekstu', obce, []);
}

/* ═══════════ M. CZYSTOŚĆ MODUŁU ═══════════
   Skan po źródle Z WYCIĘTYMI KOMENTARZAMI. Bez tego bramka zapala się na WŁASNYM komentarzu
   wyjaśniającym zakaz — pułapka, która w tym projekcie wystąpiła już trzy razy (Blok 6, Blok 9,
   Blok 10). Każdy skan ma własną kontrolę czułości: raz, że wzorzec trafia w tekst, który naprawdę
   łamie regułę, i raz, że wycinanie komentarzy nie wycina kodu. */
{
  const src = readFileSync(resolve(ROOT, 'src/app/followup-model.js'), 'utf8');
  const bezKomentarzy = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  T('CZ1/bez-importow', !/^\s*import\s/m.test(bezKomentarzy), 'model kontroli musi zostać bezimportowy');
  T('CZ2/bez-t', !/\bt\s*\(\s*['"]/.test(bezKomentarzy), 't() na poziomie modułu zamroziłoby język');
  T('CZ3/bez-zegara', !/Date\s*\.\s*now|new\s+Date|Math\s*\.\s*random/.test(bezKomentarzy),
    'wpis kontroli nie ma prawa nieść zegara — złoty wzorzec musi zostać deterministyczny');
  T('CZ4/bez-dom', !/document|window|localStorage/.test(bezKomentarzy), 'model nie dotyka DOM ani pamięci przeglądarki');
  // KONTROLE CZUŁOŚCI SAMYCH SKANÓW.
  T('CZ5/czulosc-import', /^\s*import\s/m.test('import { x } from "y";'), 'kontrola: wzorzec importu musi trafiać');
  T('CZ6/czulosc-zegar', /Date\s*\.\s*now/.test('const teraz = Date.now();'), 'kontrola: wzorzec zegara musi trafiać');
  T('CZ7/komentarze-wyciete', !/pułapka, która w tym projekcie/.test(bezKomentarzy.slice(0, 0) + src.replace(/\/\*[\s\S]*?\*\//g, '')),
    'kontrola: wycinanie komentarzy naprawdę usuwa komentarz blokowy');
  T('CZ8/kod-zostaje', /export function nastepneKroki/.test(bezKomentarzy), 'kontrola: wycinanie komentarzy nie wycina kodu');
  /* Model nie ma prawa zawierać ANI JEDNEGO pola tekstowego (kryterium odbioru nr 3 zaczyna się
     od tego, że nie ma gdzie wpisać nazwiska). Wzorzec jest STRUKTURALNY — szuka znaczników i
     wywołań, nie słowa: pierwsza wersja skanowała gołe „input" i zapaliła się na angielskim
     zdaniu klinicznym „the current inputs point to a canal…". Ta sama klasa fałszywego trafienia,
     co wzorzec prefiksowy „lew…" łapiący „prawidłowy" w Bloku 10. */
  const WZORZEC_POLA = /<\s*(?:input|textarea)|contenteditable|type\s*=\s*["']text|\bprompt\s*\(/i;
  T('CZ9/bez-pol-tekstowych', !WZORZEC_POLA.test(bezKomentarzy), 'w modelu kontroli nie ma prawa istnieć pole tekstowe');
  T('CZ10/czulosc-pola', WZORZEC_POLA.test('<input type="text" name="pacjent">') && WZORZEC_POLA.test('const imie = prompt("nazwisko");'),
    'kontrola: wzorzec musi łapać i znacznik, i okno dialogowe');
  T('CZ11/czulosc-slowo-nie-lapie', !WZORZEC_POLA.test('the current inputs point to a canal'),
    'kontrola: samo słowo „inputs" w zdaniu klinicznym nie jest polem tekstowym');
}

/* ═══════════ N. LICZNOŚĆ ═══════════
   Zapadka na cichy ubytek przypadków — ta sama, która w torze VOG złapała spadek 253→228. */
const OCZEKIWANE = 177;
if (bledy.length) {
  console.error(`✗ fu:check — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ fu:check — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli to swiadoma zmiana zakresu, popraw OCZEKIWANE. Jesli nie — ktorys przypadek zniknal.');
  process.exit(1);
}
console.log(`✓ fu:check — ${ok} przypadkow, model kontroli zgodny.`);
