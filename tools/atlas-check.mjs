/* OTOREPO — wyrocznia ATLASU OTONEUROLOGICZNEGO (E6).
 *
 * Atlas jest warstwą, w której NIC SIĘ NIE LICZY — więc żadna bramka obliczeniowa go nie kryje.
 * Cała jego jakość jest jakością TWIERDZEŃ: numer źródła, treść kryteriów, progi, granice.
 * Ta wyrocznia sprawdza dokładnie to, co da się sprawdzić maszynowo, i nie udaje, że sprawdza
 * więcej. Parafrazy i wierności kryteriów wobec pracy NIE DA SIĘ tu zmierzyć — pełne teksty leżą
 * poza repozytorium (licencje), a kontrolę adwersaryjną wobec nich wykonuje się osobno i zapisuje
 * w `weryfikacja_ekstrakcji_icvd.md`. Ta bramka pilnuje KSZTAŁTU i RODOWODU.
 *
 * CZEGO PILNUJE — i po co każde z tych twierdzeń istnieje:
 *   ATL1  rodowód: `[Hnn] Autor ROK`, numer ISTNIEJE w bibliografii, a NAZWISKO się z nią zgadza.
 *         Błąd atrybucji złapano w tym projekcie już dwa razy (E4a: regułę [H46] przypisano [H20];
 *         D-CT: komunikat mówił „GRACE-3", a pokrycie dawały [H58] i [H59]). Nazwisko przy numerze
 *         jest jedyną rzeczą, która to łapie automatycznie.
 *   ATL2  lustra PL/EN — komplet i ZGODNOŚĆ LICZB. Rozjazd liczb między lustrami znaczy, że
 *         jedno z nich niesie inny próg niż drugie; to jest błąd kliniczny, nie redakcyjny.
 *   ATL3  granice źródła — co najmniej dwie, w obu lustrach. To pole odróżnia atlas od podręcznika
 *         i jest jedynym, które łatwo pominąć bez śladu.
 *   ATL4  słowniki ZAMKNIĘTE (`typ`, `zespol`, `wSilniku`) — inaczej rejestr zakresu przestaje
 *         być rejestrem, bo każda nowa wartość znaczy, co kto chce.
 *   ATL5  klucze: unikalne, ASCII, camelCase — po nich linkuje kwalifikacja.
 *   ATL6  roster: 18 wpisów, komplet numerów, ŻADNEGO numeru dwa razy.
 *   ATL7  spójność z kwalifikacją: każdy klucz wymieniony w `triage-model.js` istnieje w atlasie.
 *         To jest połączenie przez NAPIS, więc bez tej bramki literówka w kluczu daje cichy
 *         martwy link zamiast błędu.
 *   ATL8  atlas niczego nie liczy: żaden wpis nie niesie pola wyglądającego na werdykt.
 *
 * Uruchomienie: npm run atlas:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  ATLAS, ATLAS_KLUCZE, ZESPOL_IDS, STAN_SILNIKA_IDS, RANGA_IDS, TYP_IDS, TYPY_BEZ_ZESPOLU,
  progiKarty, wpis, numerZrodla, jednostki, ramowe, stanowiska, rozkladZakresu, szukaj, terminyOdradzane,
} from '../src/app/atlas-model.js';
import { triageResult } from '../src/app/triage-model.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);
const czytaj = (p) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const bez = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

/* Liczby z napisu — do porównania luster. Bierzemy CYFRY z ewentualnym separatorem dziesiętnym,
   normalizując przecinek do kropki: polskie „0,6" i angielskie „0.6" to ta sama liczba i rozjazdem
   nie są. Zakresy („5–72") rozpadają się na dwie liczby i to jest w porządku — porównujemy
   WIELOZBIÓR, więc kolejność i powtórzenia zostają znaczące. */
const liczby = (s) => (String(s || '').replace(/(\d),(\d)/g, '$1.$2').match(/\d+(?:\.\d+)?/g) || []).sort();

/* Wszystkie pola tekstowe wpisu, parami PL/EN. Jedno miejsce, w którym wiadomo, co jest lustrem —
   bez tego każda asercja miałaby własną listę pól i nowe pole wypadłoby z połowy z nich. */
function pary(w) {
  const out = [[`${w.klucz}.nazwa`, w.nazwaPl, w.nazwaEn], [`${w.klucz}.streszczenie`, w.streszczeniePl, w.streszczenieEn]];
  (w.synonimy || []).forEach((s, i) => out.push([`${w.klucz}.synonim[${i}]`, s.pl, s.en]));
  (w.kryteria || []).forEach((k, i) => {
    out.push([`${w.klucz}.kryteria[${i}].nazwa`, k.nazwaPl, k.nazwaEn]);
    (k.punkty || []).forEach((p, j) => out.push([`${w.klucz}.kryteria[${i}].punkt[${j}]`, p.pl, p.en]));
    (k.przypisyPl || []).forEach((p, j) => out.push([`${w.klucz}.kryteria[${i}].przypis[${j}]`, p, (k.przypisyEn || [])[j]]));
  });
  (w.progi || []).forEach((p, i) => out.push([`${w.klucz}.prog[${i}]`, p.wielkoscPl, p.wielkoscEn]));
  (w.granicePl || []).forEach((g, i) => out.push([`${w.klucz}.granica[${i}]`, g, (w.graniceEn || [])[i]]));
  return out;
}

/* ═══════════ 0. WPISY W OGÓLE SĄ ═══════════ */
T('ATL0/niepusty', Array.isArray(ATLAS) && ATLAS.length > 0, 'ATLAS jest pusty — wyrocznia nie ma czego sprawdzać');
if (!ATLAS.length) { console.error('✗ ATLAS pusty'); process.exit(1); }

/* ═══════════ 1. RODOWÓD — numer, nazwisko, rok ═══════════ */
const { BIB } = (() => {
  const BIB = new Map();
  let biezacy = null, bufor = [];
  const domknij = () => { if (biezacy && !BIB.has(biezacy)) BIB.set(biezacy, bufor.join(' ')); };
  czytaj('engine_doc.txt').split('\n').forEach(l => {
    const m = /^\[(H\d+)\]/.exec(l);
    if (m && BIB.has(m[1])) { domknij(); biezacy = null; bufor = []; }
    else if (m) { domknij(); biezacy = m[1]; bufor = [l]; }
    else if (biezacy && /^\s{4,}\S/.test(l)) bufor.push(l.trim());
    else if (biezacy && !l.trim()) { domknij(); biezacy = null; bufor = []; }
  });
  domknij();
  return { BIB };
})();
T('ATL1a/bibliografia-wczytana', BIB.size >= 20, `w engine_doc.txt znaleziono ${BIB.size} wpisów [Hnn]`);

const zleZrodlo = [], brakNumeru = [], zlaAtrybucja = [];
for (const w of ATLAS) {
  // Konwencja `zrodla:check`: numer może stać sam, ale gdy ma oznaczenie, idzie ono ZARAZ po
  // numerze i niesie ROK. Atlas jest warstwą cytowań, więc żądamy pełnej postaci zawsze.
  const m = /^\[(H\d+)\]\s+(\S[^,]*?)\s+((?:19|20)\d\d)$/.exec(w.zrodlo || '');
  if (!m) { zleZrodlo.push(`${w.klucz}: „${w.zrodlo}"`); continue; }
  const [, nr, nazwisko] = m;
  const def = BIB.get(nr);
  if (!def) { brakNumeru.push(`${w.klucz}: ${nr} nie ma wpisu w bibliografii`); continue; }
  // Nazwisko wieloczłonowe („van de Berg", „Lopez-Escamez") porównujemy po ostatnim członie
  // BEZ diakrytyków — bibliografia zapisuje je czasem inaczej niż cytowanie.
  const czlon = bez(nazwisko).split(/[\s-]+/).filter(Boolean).pop().toLowerCase();
  if (!bez(def).toLowerCase().includes(czlon)) zlaAtrybucja.push(`${w.klucz}: ${nr} → „${nazwisko}" nie występuje w definicji wpisu`);
}
T('ATL1b/ksztalt-zrodla', !zleZrodlo.length, `${zleZrodlo.length} wpisów bez postaci „[Hnn] Autor ROK": ${zleZrodlo.slice(0, 3).join(' · ')}`);
T('ATL1c/numer-istnieje', !brakNumeru.length, `${brakNumeru.length}: ${brakNumeru.slice(0, 3).join(' · ')}`);
T('ATL1d/atrybucja', !zlaAtrybucja.length, `${zlaAtrybucja.length} błędów atrybucji: ${zlaAtrybucja.slice(0, 3).join(' · ')}`);

/* ═══════════ 2. LUSTRA PL/EN ═══════════ */
const brakLustra = [], rozjazdLiczb = [];
for (const w of ATLAS) for (const [gdzie, pl, en] of pary(w)) {
  if (!pl || !en) { brakLustra.push(`${gdzie} (pl=${!!pl}, en=${!!en})`); continue; }
  if (JSON.stringify(liczby(pl)) !== JSON.stringify(liczby(en)))
    rozjazdLiczb.push(`${gdzie}: pl${JSON.stringify(liczby(pl))} vs en${JSON.stringify(liczby(en))}`);
}
T('ATL2a/lustro-kompletne', !brakLustra.length, `${brakLustra.length} pól bez pary: ${brakLustra.slice(0, 4).join(' · ')}`);
T('ATL2b/liczby-zgodne', !rozjazdLiczb.length, `${rozjazdLiczb.length} rozjazdów liczb: ${rozjazdLiczb.slice(0, 3).join(' · ')}`);

/* ATL2c BYŁ ŹLE POSTAWIONY I ZOSTAŁ POPRAWIONY (2026-08-22, przy pierwszym uruchomieniu na pełnej
   treści). Pierwsza wersja żądała CYFRY w każdym progu — i zapaliła się na CZTERNASTU, którym
   cyfry NIE DAJE ŹRÓDŁO: „rzędu godzin", „dni do tygodni", „co najmniej jeden z trzech", a we
   wpisie MdDS wprost „bez wartości liczbowej". Bramka w tamtej postaci nagradzałaby DOPISANIE
   liczby, której praca nie niesie — czyli dokładnie to, czego zakazuje pierwsza zasada tego
   przesiewu („nie pisz kryteriów z pamięci"). Wyrocznia żądająca czegoś, czego źródło nie ma,
   nie jest surowsza — jest szkodliwa.
   Wersja poprawiona żąda WARTOŚCI NIEPUSTEJ i KONTEKSTU. Wierności samej liczby pilnują: ATL2b
   (zgodność luster) oraz kontrola adwersaryjna wobec pełnego tekstu, która jedyna umie to
   naprawdę sprawdzić — i której ta bramka nie udaje. */
const progBezWartosci = ATLAS.flatMap(w => (w.progi || []).filter(p => !String(p.wartosc || '').trim()).map(p => `${w.klucz}: ${p.wielkoscPl}`));
T('ATL2c/prog-ma-wartosc', !progBezWartosci.length, `${progBezWartosci.length} progów bez wartości: ${progBezWartosci.slice(0, 3).join(' · ')}`);
const progBezKontekstu = ATLAS.flatMap(w => (w.progi || []).filter(p => !String(p.kontekstPl || '').trim()).map(p => `${w.klucz}: ${p.wielkoscPl}`));
T('ATL2c2/prog-ma-kontekst', !progBezKontekstu.length,
  `${progBezKontekstu.length} progów bez kontekstu — liczba bez wskazania, PRZY KTÓRYM kryterium stoi, jest nie do sprawdzenia: ${progBezKontekstu.slice(0, 3).join(' · ')}`);
/* Ile progów źródła jest JAKOŚCIOWYCH. To nie jest błąd, tylko pomiar wart pokazania: mówi, jak
   często ICVD stawia warunek BEZ liczby — a więc jak łatwo byłoby taką liczbę „uzupełnić". */
const jakosciowe = ATLAS.flatMap(w => (w.progi || []).filter(p => !/\d/.test(String(p.wartosc)))).length;

/* ═══ RANGA PROGU ═══ Dwa razy w tym projekcie liczba bez rangi kosztowała etap (E3a: dolna
   granica normy udawała kryterium; D-CT: cel obrazowania z kryterium B stał w prozie). Próg bez
   rangi jest więc w atlasie błędem kształtu, a nie brakiem ozdoby. */
const progBezRangi = ATLAS.flatMap(w => (w.progi || []).filter(p => !RANGA_IDS.includes(p.ranga)).map(p => `${w.klucz}: „${p.wielkoscPl}" ranga=${p.ranga}`));
T('ATL2d/prog-ma-range', !progBezRangi.length, `${progBezRangi.length} progów bez rangi: ${progBezRangi.slice(0, 3).join(' · ')}`);

/* ═══ KARTA NIE JEST ZRZUTEM EKSTRAKCJI ═══ Pierwsza wersja treści niosła po 13–17 progów i po
   14–17 granic na wpis — zmierzone, i to jest objętość EKSTRAKCJI, nie karty klinicznej.
   Komplet zostaje w `icvd-korpus/ekstrakcje/`; tutaj wchodzi to, co ma rangę i waży na decyzji.
   Limit jest BRAMKĄ, a nie wytyczną, bo inaczej przy następnym wpisie nikt go nie zauważy. */
const LIMIT_PROGOW = 8, LIMIT_GRANIC = 6;
const zaDuzoProgow = ATLAS.filter(w => progiKarty(w.klucz).length > LIMIT_PROGOW).map(w => `${w.klucz}=${progiKarty(w.klucz).length}`);
const zaDuzoGranic = ATLAS.filter(w => (w.granicePl || []).length > LIMIT_GRANIC).map(w => `${w.klucz}=${(w.granicePl || []).length}`);
T('ATL2e/progi-w-limicie', !zaDuzoProgow.length,
  `powyżej ${LIMIT_PROGOW} progów kryterialnych na karcie: ${zaDuzoProgow.join(' · ')} — komplet należy do ekstrakcji, nie do atlasu`);
T('ATL3c/granice-w-limicie', !zaDuzoGranic.length,
  `powyżej ${LIMIT_GRANIC} granic na karcie: ${zaDuzoGranic.join(' · ')}`);

/* ═══════════ 3. GRANICE ŹRÓDŁA ═══════════ */
const zaMaloGranic = ATLAS.filter(w => (w.granicePl || []).length < 2).map(w => `${w.klucz} (${(w.granicePl || []).length})`);
const granicNierowno = ATLAS.filter(w => (w.granicePl || []).length !== (w.graniceEn || []).length).map(w => w.klucz);
T('ATL3a/co-najmniej-dwie', !zaMaloGranic.length,
  `${zaMaloGranic.length} wpisów z mniej niż dwiema granicami: ${zaMaloGranic.join(' · ')} — „praca tego nie mówi" jest treścią, nie brakiem`);
T('ATL3b/granice-rownolegle', !granicNierowno.length, `nierówna liczba granic PL/EN: ${granicNierowno.join(' · ')}`);

/* ═══════════ 4. SŁOWNIKI ZAMKNIĘTE ═══════════ */
const zlyTyp = ATLAS.filter(w => !TYP_IDS.includes(w.typ)).map(w => `${w.klucz}=${w.typ}`);
const zlyZespol = ATLAS.filter(w => !ZESPOL_IDS.includes(w.zespol)).map(w => `${w.klucz}=${w.zespol}`);
const zlyStan = ATLAS.filter(w => !STAN_SILNIKA_IDS.includes(w.wSilniku)).map(w => `${w.klucz}=${w.wSilniku}`);
T('ATL4a/typ', !zlyTyp.length, `poza słownikiem: ${zlyTyp.join(' · ')}`);
T('ATL4b/zespol', !zlyZespol.length, `poza słownikiem: ${zlyZespol.join(' · ')}`);
T('ATL4c/wSilniku', !zlyStan.length, `poza słownikiem: ${zlyStan.join(' · ')}`);
/* Dokument, który nie opisuje jednostki chorobowej — RAMOWY albo STANOWISKO — nie ma prawa nieść
   zespołu kardynalnego. Przy stanowisku jest to twierdzenie mocniejsze niż porządkowe: [H60]
   Seemungal 2022 JAWNIE ODMAWIA kryteriów, więc przypisanie mu zespołu byłoby dopisaniem pracy
   zdania, którego świadomie nie powiedziała. */
const bezJednostkiZZespolem = ATLAS.filter(w => TYPY_BEZ_ZESPOLU.includes(w.typ) && w.zespol !== 'nd')
  .map(w => `${w.klucz} (${w.typ}) = ${w.zespol}`);
T('ATL4d/nie-jednostka-bez-zespolu', !bezJednostkiZZespolem.length,
  `dokument nieopisujący jednostki niesie zespół kardynalny: ${bezJednostkiZZespolem.join(' · ')}`);
// I odwrotnie: jednostka chorobowa MUSI mieć zespół — inaczej kwalifikacja nie ma po czym linkować.
const jednostkaBezZespolu = jednostki().filter(w => w.zespol === 'nd').map(w => w.klucz);
T('ATL4e/jednostka-ma-zespol', !jednostkaBezZespolu.length, `jednostka bez zespołu: ${jednostkaBezZespolu.join(' · ')}`);
// Rejestr zakresu musi być pełny: każdy wpis ma DOWÓD pomiaru, nie samą etykietę.
const bezDowodu = ATLAS.filter(w => !w.wSilnikuDowod || w.wSilnikuDowod.length < 10).map(w => w.klucz);
T('ATL4f/zakres-z-dowodem', !bezDowodu.length,
  `${bezDowodu.length} wpisów deklaruje zakres bez zmierzonego dowodu: ${bezDowodu.join(' · ')}`);

/* ═══════════ 5. KLUCZE ═══════════ */
const zleKlucze = ATLAS.filter(w => !/^[a-z][A-Za-z0-9]*$/.test(w.klucz || '')).map(w => w.klucz);
T('ATL5a/ksztalt', !zleKlucze.length, `klucze poza camelCase ASCII: ${zleKlucze.join(' · ')}`);
eq('ATL5b/unikalne', ATLAS_KLUCZE.length, new Set(ATLAS_KLUCZE).size);
T('ATL5c/lookup', ATLAS.every(w => wpis(w.klucz) === w), 'wpis(klucz) musi zwracać dokładnie ten obiekt');

/* ═══════════ 6. ROSTER ═══════════
   Osiemnaście dokumentów. Dziewiętnasty (Lempert 2012) numeru NIE DOSTAJE — decyzja D7. */
const OCZEKIWANE = ['H19', 'H20', 'H46', 'H47', 'H48', 'H49', 'H50', 'H51', 'H52',
  'H53', 'H54', 'H55', 'H56', 'H57', 'H58', 'H59', 'H60', 'H61'];
eq('ATL6a/osiemnascie', ATLAS.length, 18);
const numery = ATLAS.map(w => numerZrodla(w.klucz));
eq('ATL6b/komplet-numerow', numery.slice().sort(), OCZEKIWANE.slice().sort());
eq('ATL6c/numer-raz', numery.length, new Set(numery).size);
/* ROSTER PO TYPACH — liczby stoją jawnie, bo to jest rejestr, a rejestr, który sam się przelicza,
   niczego nie pilnuje. 14 + 3 + 1 = 18.
     ramowe:      [H47] Bisdorff (słownik objawów), [H51] Eggers (klasyfikacja oczopląsu),
                  [H61] Kaski (przegląd ICVD) — trzy dokumenty o JĘZYKU, nie o chorobie;
     stanowisko:  [H60] Seemungal (zawroty szyjne) — praca dotyczy domniemanej jednostki i JAWNIE
                  odmawia kryteriów. Osobny typ, żeby czytelnik karty bez kryteriów wiedział,
                  że to jest treść źródła, a nie nasze niedopatrzenie. */
eq('ATL6d/trzy-ramowe', ramowe().map(w => numerZrodla(w.klucz)).sort(), ['H47', 'H51', 'H61']);
eq('ATL6e/czternascie-jednostek', jednostki().length, 14);
eq('ATL6f/jedno-stanowisko', stanowiska().map(w => numerZrodla(w.klucz)), ['H60']);
eq('ATL6g/typy-sumuja', jednostki().length + ramowe().length + stanowiska().length, ATLAS.length);

/* ═══════════ 7. SPÓJNOŚĆ Z KWALIFIKACJĄ ═══════════
   Kwalifikacja niesie klucze jako gołe NAPISY (oba moduły zostają liśćmi grafu). Cena tej
   czystości: literówka daje martwy link, a nie błąd — więc płaci ją ta bramka.
   Przechodzimy pełny iloczyn odpowiedzi, bo pole `atlas` bywa wyliczane per gałąź. */
const WART = {
  przebieg: [undefined, 'napadowe', 'ciagle', 'przewlekle', 'nieznane'],
  odkiedy: [undefined, 'ostre', 'dluzej', 'nieznane'],
  wyzwalacz: [undefined, 'pozycyjny', 'samoistny', 'nieznane'],
  ortostaza: [undefined, 'tak', 'nie', 'nieznane'],
  oczoplas: [undefined, 'obecny', 'brak', 'nieoceniony'],
};
const FLAGI_POJ = ['ataksja', 'pieciod', 'ogniskowe', 'bolGlowy', 'niedoslych'];
const ZESTAWY_FLAG = [undefined, [], ['brak']];
for (let m = 1; m < (1 << FLAGI_POJ.length); m++) ZESTAWY_FLAG.push(FLAGI_POJ.filter((_, i) => m & (1 << i)));

const martweLinki = new Set(); const uzyte = new Set(); let zKombinacji = 0;
for (const p of WART.przebieg) for (const d of WART.odkiedy) for (const w of WART.wyzwalacz)
  for (const r of WART.ortostaza) for (const o of WART.oczoplas) for (const f of ZESTAWY_FLAG) {
    zKombinacji++;
    const wynik = triageResult({ przebieg: p, odkiedy: d, wyzwalacz: w, ortostaza: r, oczoplas: o, flagi: f });
    for (const k of (wynik.atlas || [])) { uzyte.add(k); if (!wpis(k)) martweLinki.add(k); }
  }
T('ATL7a/bez-martwych-linkow', !martweLinki.size,
  `kwalifikacja wskazuje klucze, których atlas nie ma: ${[...martweLinki].join(' · ')}`);
T('ATL7b/iloczyn-przeorany', zKombinacji === 5 * 4 * 4 * 4 * 4 * (3 + 31),
  `przeorano ${zKombinacji} kombinacji — jeśli spadło, nowy wymiar pytania nie wszedł do tej pętli`);
// Kwalifikacja MUSI dokądś linkować — inaczej cały etap jest martwy i nikt tego nie zauważy.
T('ATL7c/link-istnieje', uzyte.size >= 4,
  `kwalifikacja linkuje do ${uzyte.size} wpisów — węzły sEVS i CVS mają prowadzić do atlasu, a nie kończyć się ślepo`);

/* ═══════════ 8. ATLAS NICZEGO NIE LICZY ═══════════
   Nie da się zabronić liczenia inaczej niż przez kształt danych: gdyby wpis niósł pole
   wyglądające na werdykt, następny etap dopiąłby do niego ekran i atlas zacząłby orzekać. */
const POLA_ZAKAZANE = ['wniosek', 'werdykt', 'rozpoznanie', 'pewnosc', 'wynik', 'sciezka', 'punktacja', 'score'];
const orzekajace = ATLAS.flatMap(w => Object.keys(w).filter(k => POLA_ZAKAZANE.includes(k)).map(k => `${w.klucz}.${k}`));
T('ATL8a/bez-werdyktu', !orzekajace.length,
  `wpis atlasu nie ma prawa nieść pola orzekającego: ${orzekajace.join(' · ')} — atlas jest materiałem do czytania, nie klasyfikatorem`);
// Klucz atlasu nie może kolidować z kluczem TRYBU — `triageGo` bierze tryb z napisu.
const KOLIZJE_TRYBOW = ['diag', 'hints', 'treat', 'lab', 'start', 'learn', 'profile'];
const kolizje = ATLAS_KLUCZE.filter(k => KOLIZJE_TRYBOW.includes(k));
T('ATL8b/bez-kolizji-z-trybem', !kolizje.length, `klucz atlasu koliduje z kluczem trybu: ${kolizje.join(' · ')}`);

/* ═══════════ 9. WYBIERAKI ═══════════ */
T('ATL9a/szukaj-po-nazwie', szukaj(ATLAS[0].nazwaPl.slice(0, 6)).some(w => w.klucz === ATLAS[0].klucz),
  'wyszukiwanie po fragmencie nazwy polskiej musi trafiać we własny wpis');
T('ATL9b/szukaj-puste', szukaj('').length === 0 && szukaj(null).length === 0, 'pusta fraza nie zwraca całego atlasu');
const rz = rozkladZakresu();
T('ATL9c/rozklad-sumuje', STAN_SILNIKA_IDS.reduce((s, k) => s + rz[k], 0) === ATLAS.length,
  `rozkład zakresu sumuje się do ${STAN_SILNIKA_IDS.reduce((s, k) => s + rz[k], 0)}, a wpisów jest ${ATLAS.length}`);
T('ATL9d/odradzane-maja-uwage', terminyOdradzane().every(s => s.uwagaPl && s.uwagaEn),
  'termin oznaczony jako odradzany musi mówić, PRZEZ KOGO i dlaczego — inaczej jest samą etykietą');

/* ═══════════ WYNIK ═══════════ */
console.log(`atlas:check   : ${ok} twierdzeń`);
console.log(`wpisów        : ${ATLAS.length} (${jednostki().length} jednostek + ${ramowe().length} ramowych + ${stanowiska().length} stanowisko)`);
console.log(`zakres        : ${STAN_SILNIKA_IDS.map(s => `${s}=${rz[s]}`).join(' · ')}`);
console.log(`linków z kwal.: ${uzyte.size} wpisów, iloczyn ${zKombinacji} kombinacji`);
console.log(`odradzanych   : ${terminyOdradzane().length} terminów`);
console.log(`progów jakościowych (bez liczby W ŹRÓDLE): ${jakosciowe} z ${ATLAS.reduce((a, w) => a + (w.progi || []).length, 0)}`);
if (bledy.length) {
  console.error(`\n✗ ${bledy.length} BŁĘDÓW:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
console.log('✓ atlas:check — bez zastrzeżeń');
