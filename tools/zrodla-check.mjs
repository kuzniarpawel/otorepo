/* OTOREPO — wyrocznia ŹRÓDEŁ: numer [Hnn] w PROGRAMIE I W DOKUMENTACJI musi wskazywać TĘ pracę,
 * o której mowa.
 *
 * ═══ DLACZEGO TA BRAMKA ISTNIEJE ═══
 * Zmierzone 2026-08-16: DWIE karty kierowały klinicystę do złych prac. Karta zawrotów resztkowych
 * cytowała `[H28]` dla Özgirgina (w tej gałęzi [H28] to Newman-Toker), a karta chmury cytowała
 * `[H28]` dla Cochrane'a, który w bibliografii futureUI NIE MIAŁ WTEDY NUMERU. Przyczyna: numeracja
 * źródeł rozeszła się między gałęziami (`main` ma pod [H28] Cochrane), a numery przepisywano
 * z podsumowania main zamiast sprawdzać bibliografię TEJ gałęzi.
 *
 * ŻADNA Z 25 WYROCZNI TEGO NIE ŁAPAŁA i nie mogła: dla golden i dla skanów DOM numer w napisie jest
 * zwykłym tekstem. Złapała to dopiero synchronizacja dokumentacji — czyli przypadek, nie procedura.
 *
 * ═══ CZEGO NIE WYSTARCZY SPRAWDZIĆ ═══
 * „Czy numer istnieje w bibliografii" NIE złapałoby ani jednego z tych dwóch błędów: [H28] istniało,
 * tylko znaczyło co innego. Dlatego bramka porównuje numer z OZNACZENIEM podanym w tym samym napisie:
 * jeśli obok `[H26]` stoi „Özgirgin", to definicja [H26] musi nieść „Özgirgin". Kod i bibliografia
 * mają mówić to samo, a nie tylko istnieć obok siebie.
 *
 * ═══ ZAKRES (rozszerzony 2026-08-16 o dokumentację) ═══
 *   · `src` rekurencyjnie, pliki .js — i komentarze, i napisy;
 *   · engine_doc.txt / engine_doc.en.txt — rozdziały (bibliografia jest ŹRÓDŁEM, nie przedmiotem);
 *   · view_doc.txt / view_doc.en.txt — całe, bo własnej bibliografii nie mają (czerpią z engine_doc).
 * Powód rozszerzenia: przegląd 2026-08-16 znalazł w rozdziale CHMURA ZŁOGU wiersz „kontekst RCT
 * (56% vs 21%, OR 4,42) z [H28]" — liczby Cochrane'a pod numerem pracy o udarze. Skrypt scalający
 * przepisywał [H28]→[H29] tylko w wierszach ze słowem „Cochrane"/„Hilton", a ten wiersz nazywa pracę
 * „kontekstem RCT". Reguła ominęła miejsce, którego nie widziała — więc pilnuje go teraz bramka.
 *
 * ═══ KONWENCJA, NA KTOREJ TA BRAMKA STOI ═══
 * Ujednolicone 2026-08-16, po pomiarze: ze 123 cytowań w `src` (dziś 130, po odzyskaniu tych ukrytych
 * w nawiasach zbiorczych) aż 83 to SAME `[Hnn]` bez oznaczenia —
 * w komentarzach silnika numer JEST odnośnikiem i wymuszanie nazwiska rozdęłoby je bez korzyści.
 * Reszta dzieliła się 10 „po numerze" wobec 6 „przed numerem". Stąd konwencja:
 *   NUMER MOŻE STAĆ SAM, ale jeśli towarzyszy mu oznaczenie źródła, oznaczenie idzie BEZPOŚREDNIO
 *   PO numerze i niesie ROK: `[Hnn] Autor ROK`.
 * Dzięki temu bramka NIE POTRZEBUJE słownika nazwisk — oznaczeniem jest to, co następuje po numerze,
 * a rok odróżnia cytat od prozy. Pierwsza wersja trzymała zamknięty słownik i sprawdzała 18 %
 * cytowań; dziś nowe źródło z nowym nazwiskiem działa BEZ dopisywania czegokolwiek (zweryfikowane
 * na „[H19] Strupp 2017", którego w żadnym słowniku nie ma).
 *
 * ═══ CZEGO NADAL NIE PILNUJE — GRANICE ZADEKLAROWANE ═══
 *   · Numer stojący SAM — nie ma czego z czym porównać; to świadomy koszt konwencji. Dziurę po nim
 *     zasłania CZĘŚCIOWO sekcja LICZB ZNAMIENNYCH (niżej), która nie potrzebuje nazwiska.
 *   · Źródło zacytowane SAMYM nazwiskiem, bez `[Hnn]`. Pomiar 2026-08-16: takich cytatów jest 10,
 *     a 154 pozostałe wystąpienia nazwisk to EPONIMY („prawo Ewalda", „ćwiczenia Brandta-Daroffa"),
 *     nie cytaty. Z tych 10 dziewięć dostało numery, a „Brandt & Steddin 1993" numeru NIE MA i mieć
 *     nie musi — to INNA praca niż [H7] Brandt & Dieterich 1993. Bramka jej nie widzi i tak ma być.
 *   · CZY TEZA JEST PRAWDZIWA — bramka sprawdza, czy numer wskazuje właściwą pracę, a nie czy praca
 *     mówi to, co jest przy niej napisane. To zostaje robotą czytelnika.
 *   · SYNONIMY są tylko dla ORGANIZACJI (GRACE-3, AAO-HNS), które nie padają dosłownie w opisie
 *     bibliograficznym. Nowa organizacja bez wpisu ZAPALI bramkę — i dobrze, bo to prośba o decyzję.
 *
 * Uruchomienie: npm run zrodla:check
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const czytaj = (p) => readFileSync(resolve(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const bez = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/* SYNONIMY dotyczą WYŁĄCZNIE oznaczeń ORGANIZACJI, które nie padają dosłownie w opisie
   bibliograficznym (opis niesie autora i czasopismo). Nazwiska NIE MAJĄ tu wpisów i mieć nie muszą —
   sprawdzają się dosłownie, więc nowe źródło zacytowane nowym nazwiskiem działa bez dopisywania
   czegokolwiek. To jest cała różnica wobec pierwszej wersji, która trzymała zamknięty słownik
   nazwisk i przez to sprawdzała 18 % cytowań. */
const SYNONIMY = { 'GRACE-3': 'Edlow', 'AAO-HNS': 'Otolaryngol Head Neck Surg' };

/* ═══════════ 1. BIBLIOGRAFIA = JEDYNE ŹRÓDŁO PRAWDY ═══════════
   Definicją jest wpis zaczynający wiersz `[Hnn]`; bierzemy go razem z wcięciami, bo nazwisko
   i rok bywają w drugiej linii. Zwracamy też NUMERY WIERSZY wpisu — rozdziały to wszystko poza nimi,
   a bibliografia w tym dokumencie NIE stoi na końcu (rozdziały Bloków 8-16 są za nią). */
function bibliografia(tekst) {
  const BIB = new Map(); const wiersze = new Set(); const start = new Map();
  /* `przypis` mapuje KAŻDY wiersz wpisu na jego numer — sekcja 8b (BIB6) czyta z niej prozę
     pod wpisami, którą zbierz() celowo pomija. Dodane w K7-B1; wcześniej ta proza była
     martwym polem bramki (dowód i historia — dziennik przy OCZEKIWANE, wpis E3a). */
  const przypis = new Map();
  const linie = tekst.split('\n');
  let biezacy = null, bufor = [], kol = [];
  const domknij = () => { if (biezacy) { BIB.set(biezacy, bufor.join(' ')); start.set(biezacy, kol[0]); kol.forEach(i => { wiersze.add(i); przypis.set(i, biezacy); }); } };
  linie.forEach((l, i) => {
    const m = /^\[(H\d+)\]/.exec(l);
    /* PIERWSZE wystąpienie wygrywa, nie ostatnie. `[H24]` zaczyna wiersz DWA RAZY: raz jako wpis
       bibliograficzny (Edlow 2023), raz jako lista źródeł w rozdziale Bloku 12. Branie ostatniego
       podmieniało definicję na streszczenie i bramka krzyczała na poprawny tekst. */
    if (m && BIB.has(m[1])) { domknij(); biezacy = null; bufor = []; kol = []; }
    else if (m) { domknij(); biezacy = m[1]; bufor = [l]; kol = [i]; }
    else if (biezacy && /^\s{4,}\S/.test(l)) { bufor.push(l.trim()); kol.push(i); }
    else if (biezacy && !l.trim()) { domknij(); biezacy = null; bufor = []; kol = []; }
  });
  domknij();
  return { BIB, wiersze, start, przypis };
}

const { BIB, wiersze: WIERSZE_BIB_PL, start: START_PL, przypis: PRZYPIS_PL } = bibliografia(czytaj('engine_doc.txt'));
const { BIB: BIB_EN, wiersze: WIERSZE_BIB_EN, start: START_EN, przypis: PRZYPIS_EN } = bibliografia(czytaj('engine_doc.en.txt'));
T('BIB1/bibliografia-znaleziona', BIB.size >= 20, `w engine_doc.txt znaleziono ${BIB.size} wpisów [Hnn] — spodziewano się kompletu`);
T('BIB2/bibliografia-en', BIB_EN.size === BIB.size, `engine_doc.en.txt ma ${BIB_EN.size} wpisów wobec ${BIB.size} w PL`);

/* ═══════════ 1b. NUMER W ROZDZIALE NIE MOŻE UDAWAĆ WPISU — PUŁAPKA ZŁAPANA NA SOBIE ═══════════
   ZMIERZONE 2026-08-20 (etap V28, na własnej edycji): zdanie rozdziału zawinęło się tak, że „[H20]"
   wypadło w KOLUMNIE 0. Parser wyżej czyta KAŻDĄ linię zaczynającą się od `^[Hnn]` jako POCZĄTEK
   WPISU, a rozdziały stoją PRZED blokiem wpisów — więc zdanie z rozdziału stało się DEFINICJĄ H20,
   a prawdziwy wpis Lopez-Escameza został ODRZUCONY przez regułę „pierwsze wystąpienie wygrywa".
   BRAMKA BYŁA PRZY TYM ZIELONA, bo zatrute zdanie przypadkiem zawierało nazwisko „Lopez-Escamez" —
   reguła 5 (numer↔oznaczenie) porównywała wtedy definicję SAMĄ ZE SOBĄ. Cicha podmiana źródła
   prawdy jest gorsza od czerwonej: reszta bramki dalej działa, tylko mierzy nie to, co trzeba.
   Jedynym śladem był licznik — zatrute linie trafiają do `wiersze`, więc wypadają z DOC3/DOC4
   i suma spada o kilka przypadków. Nikt nie czyta spadku licznika jako sygnału korupcji.

   CZEGO NIE WOLNO TU SPRAWDZAĆ — zmierzone, nie zgadnięte: reguła „żadna linia rozdziału nie
   zaczyna się od [Hnn]" ZAPALIŁABY SIĘ NA POPRAWNYM TEKŚCIE. W obu dokumentach istnieje legalna
   taka linia (`[H24] GRACE-3 2023 …`, lista źródeł w rozdziale Bloku 12) — stoi ZA blokiem wpisów,
   więc jest nieszkodliwa: chroni ją dokładnie ta sama reguła „pierwsze wystąpienie wygrywa".
   Bramka krzycząca na poprawny tekst uczy wyłączać wyrocznię, więc zamiast pozycji bezwzględnej
   sprawdzamy DWA NIEZALEŻNE NIEZMIENNIKI, oba obojętne na tamtą legalną linię.

   NIEZMIENNIK 1 — MONOTONICZNOŚĆ. Wpisy stoją w pliku w kolejności numerycznej, więc numer wiersza
   przyjętej definicji musi rosnąć razem z numerem [Hnn]. Zatrucie łamie to natychmiast i z dużym
   marginesem: porwane H20 startowało setki wierszy PRZED H19.
   NIEZMIENNIK 2 — KSZTAŁT. Każdy opis bibliograficzny niesie znacznik `→` (PL) albo `->` (EN);
   zmierzone 46/46 w obu plikach. Zdanie wyjęte z rozdziału go nie ma.
   KONTROLA CZUŁOŚCI (niżej) odtwarza zatrucie W PAMIĘCI, nie dotykając plików, i żąda, żeby OBA
   niezmienniki je złapały. Bez niej ta sekcja mogłaby kiedyś przechodzić na pusto. */
{
  for (const [tag, slownik, startMapa, plik] of [['PL', BIB, START_PL, 'engine_doc.txt'],
                                                 ['EN', BIB_EN, START_EN, 'engine_doc.en.txt']]) {
    const kolejne = [...slownik.keys()]
      .map(h => ({ h, n: Number(h.slice(1)), w: startMapa.get(h) }))
      .sort((a, b) => a.n - b.n);
    const zlamane = kolejne.filter((e, i) => i > 0 && e.w < kolejne[i - 1].w)
      .map(e => `${e.h} (wiersz ${e.w + 1}) stoi PRZED poprzednim wpisem`);
    T(`BIB4/${tag}/wpisy-w-kolejnosci`, zlamane.length === 0,
      `definicja przyjęta poza blokiem bibliografii w ${plik} — najpewniej linia rozdziału zaczynająca się od [Hnn] w kolumnie 0: ${zlamane.join(' · ')}`);

    const bezOpisu = [...slownik].filter(([, d]) => !/(→|->)/.test(d)).map(([h]) => h);
    T(`BIB5/${tag}/definicja-to-opis`, bezOpisu.length === 0,
      `definicja bez znacznika opisu (→ / ->) w ${plik} — to nie jest wpis bibliograficzny, tylko zdanie z rozdziału: ${bezOpisu.join(', ')}`);
  }

  const NL = String.fromCharCode(10);
  const oryginal = czytaj('engine_doc.txt');
  const zatruty = (() => {
    const linie = oryginal.split(NL);
    const blok = linie.findIndex(l => /^\[H1\]/.test(l));           // początek bloku wpisów
    const ofiara = linie.findIndex((l, i) => i < blok && l.includes('[H20]'));
    if (ofiara < 0) return oryginal;                                // nie ma czego zatruć
    // dokładnie ta usterka co w V28: przełamanie wiersza tak, że numer ląduje w KOLUMNIE 0
    linie[ofiara] = linie[ofiara].replace(/\s*\[H20\]/, NL + '[H20]');
    return linie.join(NL);
  })();
  const probny = bibliografia(zatruty);
  const kol = [...probny.BIB.keys()].map(h => ({ n: Number(h.slice(1)), w: probny.start.get(h) }))
    .sort((a, b) => a.n - b.n);
  const wykrytaMonotonicznosc = kol.some((e, i) => i > 0 && e.w < kol[i - 1].w);
  const wykrytyKsztalt = !/(→|->)/.test(probny.BIB.get('H20') || '→');
  T('BIB4/kontrola-czulosci', zatruty !== oryginal && wykrytaMonotonicznosc && wykrytyKsztalt,
    `sekcja przestała cokolwiek pilnować: ${zatruty === oryginal
      ? 'syntetycznego zatrucia NIE DAŁO SIĘ WSTRZYKNĄĆ — w rozdziałach nie ma już wiersza z [H20]; przenieś kontrolę na inny numer'
      : `zatrucie H20 nie zostało wykryte (monotoniczność ${wykrytaMonotonicznosc}, kształt ${wykrytyKsztalt})`}`);
}

/* ═══════════ 2. SKĄD ZBIERAMY CYTOWANIA ═══════════ */
function zbierz(plik, tekst, pomin = new Set()) {
  const out = [];
  tekst.split('\n').forEach((l, i) => {
    if (pomin.has(i)) return;
    /* ZNACZNIK NALEŻY DO NAJBLIŻSZEGO NUMERU — liczone ODLEGŁOŚCIĄ, nie kierunkiem.
       Pierwsza wersja bramki obsługiwała tylko jeden styl i krzyczała na poprawną listę
       `[H8] Kattah · [H9] Tarnutzer`, przypisując Kattaha do [H9]. Bramka, która krzyczy na
       poprawny kod, jest gorsza od milczącej: uczy wyłączać wyrocznię. */
    const nal = [...l.matchAll(/\[(H\d+)\]/g)].map(m => ({ h: m[1], poz: m.index }));
    for (const c of nal) out.push({ plik, wiersz: i + 1, h: c.h, poz: c.poz, linia: l });
  });
  return out;
}

const pliki = [];
(function chodz(kat) {
  for (const w of readdirSync(kat)) {
    const p = join(kat, w);
    if (statSync(p).isDirectory()) chodz(p);
    else if (p.endsWith('.js')) pliki.push(p);
  }
})(resolve(ROOT, 'src'));

const cytKod = pliki.flatMap(p => zbierz(relative(ROOT, p).replace(/\\/g, '/'), czytaj(relative(ROOT, p))));
const cytDokPl = [
  ...zbierz('engine_doc.txt', czytaj('engine_doc.txt'), WIERSZE_BIB_PL),
  ...zbierz('view_doc.txt', czytaj('view_doc.txt')),
];
const cytDokEn = [
  ...zbierz('engine_doc.en.txt', czytaj('engine_doc.en.txt'), WIERSZE_BIB_EN),
  ...zbierz('view_doc.en.txt', czytaj('view_doc.en.txt')),
];
T('CY1/cytowania-kod', cytKod.length >= 30, `w src/ znaleziono ${cytKod.length} cytowań — spodziewano się kilkudziesięciu`);
T('CY2/cytowania-dok', cytDokPl.length >= 50 && cytDokEn.length >= 50,
  `w rozdziałach dokumentacji znaleziono PL ${cytDokPl.length} / EN ${cytDokEn.length} cytowań`);

/* ═══════════ 3. KAŻDY CYTOWANY NUMER MA DEFINICJĘ ═══════════
   Tania bramka, ale nie ta najważniejsza — łapie literówkę i numer usunięty z bibliografii.
   Dokumentacja EN rozlicza się z bibliografią EN: to lustro ma być spójne SAMO ZE SOBĄ. */
for (const [tag, cyt, slownik, gdzie] of [
  ['ZR1/kod', cytKod, BIB, 'engine_doc.txt'],
  ['DOC1/pl', cytDokPl, BIB, 'engine_doc.txt'],
  ['DOC1/en', cytDokEn, BIB_EN, 'engine_doc.en.txt'],
]) {
  const sieroty = [...new Set(cyt.filter(c => !slownik.has(c.h)).map(c => `${c.h} (${c.plik}:${c.wiersz})`))];
  T(`${tag}/bez-sierot`, sieroty.length === 0, `cytowania bez definicji w ${gdzie}: ${sieroty.slice(0, 5).join(', ')}`);
}

/* ═══════════ 4. ŻADEN WPIS NIE JEST OSIEROCONY ═══════════
   Wpis, o którym nikt nie wspomina, to albo pozostałość po usuniętej treści, albo cytowanie zgubione
   przy scalaniu. ALE „wspomina" to NIE to samo co „cytuje numerem".
   POMIAR 2026-08-16 na main: pierwsza wersja (tylko numer w rozdziałach) zapaliła się na H25, H30,
   H34, H35, H38, H39 — a wszystkie SĄ przywołane, tylko nazwiskiem („Bhandari 2022", „Imai",
   „Hentze"), czyli dokładnie tak, jak zezwala zadeklarowana granica konwencji, albo cytowane
   z `src`, albo z WNĘTRZA innego wpisu (odsyłacz w bibliografii). Bramka krzyczała więc na
   poprawny tekst — a to uczy wyłączać wyrocznię.
   DZIŚ: wpis jest ŻYWY, gdy jego numer pada gdziekolwiek poza jego własnym wpisem (rozdziały, inne
   wpisy, kod) ALBO gdy jego oznaczenie (pierwsze nazwisko) pada w rozdziałach. Numer WYCOFANY
   (jawna nota w treści wpisu) jest zwolniony — jego zadaniem jest właśnie NIE być cytowanym. */
for (const [tag, cyt, slownik, plik] of [['DOC2/pl', cytDokPl, BIB, 'engine_doc.txt'],
                                          ['DOC2/en', cytDokEn, BIB_EN, 'engine_doc.en.txt']]) {
  const pelny = czytaj(plik);
  const rozdzialy = cyt.map(c => c.linia).join('\n');
  const osierocone = [...slownik.keys()].filter(h => {
    const def = slownik.get(h);
    if (/WYCOFANY|RETIRED/.test(def)) return false;                      // numer świadomie wycofany
    if (cyt.some(c => c.h === h)) return false;                          // cytowany w rozdziałach
    if (cytKod.some(c => c.h === h)) return false;                       // cytowany w kodzie
    /* odsyłacz z wnętrza INNEGO wpisu: numer pada w pliku częściej, niż wynosi jego własna definicja */
    const wystapien = (pelny.match(new RegExp(`\\[${h}\\]`, 'g')) || []).length;
    if (wystapien > 1) return false;
    const m = /^\[H\d+\]\s+([A-ZŁŚŻŹĆÓÖ][A-Za-zŁłŚśŻżŹźĆćÓóĘęĄąŃńÖö'’-]+)/.exec(def);
    if (m && new RegExp(`\\b${m[1]}\\b`).test(rozdzialy + pelny.split(m[0])[0])) return false;  // przywołany nazwiskiem
    return true;
  });
  T(`${tag}/bez-osieroconych`, osierocone.length === 0,
    `wpisy bibliografii, o których nikt nie wspomina — ani numerem, ani nazwiskiem: ${osierocone.join(', ')}`);
}

/* ═══════════ 4b. DWA NUMERY NA JEDNĄ PRACĘ ═══════════
   ZMIERZONE 2026-08-16 na main: [H17] i [H29] to była TA SAMA praca (Della Santina i wsp. 2005) —
   drugi wpis dodano przy R3, nie zauważywszy pierwszego. Czytelnik dostawał dwa numery na jedno
   źródło i nie miał jak rozstrzygnąć, który jest właściwy. Żadna z pozostałych reguł tego nie
   widziała: oba numery MIAŁY definicje i oba zgadzały się z nazwiskiem obok.
   KLUCZ PORÓWNANIA — mierzony, nie zgadnięty. Pierwsza wersja brała NAZWISKO + ROK i dała FAŁSZYWY
   ALARM: „Hentze 2025 = H36 i H37" to DWIE RÓŻNE prace tego samego autora z tego samego roku
   (Front Neurol 16:1654404 vs J Clin Med 14(2):434). Dlatego kluczem jest DOI, gdy jest — a gdy go
   nie ma (jak w dawnym [H17]), nazwisko + rok + POCZĄTEK TYTUŁU. Duplikat z 2026-08-16 miał tytuł
   identyczny co do znaku, więc obie ścieżki go łapią. */
{
  const klucze = new Map();
  for (const [h, def] of BIB) {
    if (/WYCOFANY|RETIRED/.test(def)) continue;
    const doi = /doi:\s*(10\.\S+?)[.,;\s)]*$|doi:\s*(10\.[^\s,;]+)/i.exec(def);
    let k = null;
    if (doi) k = 'doi:' + (doi[1] || doi[2]).replace(/[.,;]+$/, '').toLowerCase();
    else {
      const m = /^\[H\d+\]\s+([A-ZŁŚŻŹĆÓÖ][A-Za-zŁłŚśŻżŹźĆćÓóĘęĄąŃńÖö'’-]+)[^(]*\((\d{4})\)[^„"“]*[„"“]([^”"]{0,45})/.exec(def);
      if (!m) continue;
      k = `${bez(m[1])} ${m[2]} ${bez(m[3]).toLowerCase().replace(/\s+/g, ' ').trim()}`;
    }
    if (!klucze.has(k)) klucze.set(k, []);
    klucze.get(k).push(h);
  }
  const duble = [...klucze].filter(([, hs]) => hs.length > 1).map(([k, hs]) => `${k} = ${hs.join(' i ')}`);
  T('BIB3/jedna-praca-jeden-numer', duble.length === 0,
    `ta sama praca pod dwoma numerami: ${duble.join(' · ')}`);
}

/* ═══════════ 5. NUMER MUSI WSKAZYWAĆ TĘ PRACĘ, O KTÓREJ MOWA — TO JEST TA BRAMKA ═══════════ */
function zgodnoscOznaczen(tag, cytowania, slownik, gdzie) {
  let sprawdzone = 0;
  for (const c of cytowania) {
    const def = slownik.get(c.h); if (!def) continue;
    /* KONWENCJA: oznaczenie źródła stoi BEZPOŚREDNIO PO numerze. Bierzemy pierwszy token po
       `[Hnn]` — jeśli zaczyna się wielką literą, to kandydat na oznaczenie. Numer stojący sam
       jest poprawny i nie ma czego sprawdzać. */
    const po = c.linia.slice(c.poz + c.h.length + 2).replace(/^[\s:—·)(,;.-]+/, '');
    const m = /^([A-ZŁŚŻŹĆÓĘĄŃÖ][A-Za-zŁłŚśŻżŹźĆćÓóĘęĄąŃńÖö'’-]*(?:-[A-Z][A-Za-z]*)?)/.exec(po);
    if (!m) continue;
    const ozn = m[1];
    if (ozn.length < 3) continue;                       // „I", „W" itp. — nie oznaczenie
    /* OZNACZENIEM jest dopiero „Autor ROK" albo znana organizacja — sama wielka litera NIE wystarcza.
       Zmierzone: bez tego warunku bramka brała za nazwiska zwykłe słowa, którymi zaczyna się dalsza
       część zdania („[H3] Emergent…", „[H26] MIERZALNĄ…") i krzyczała na poprawny tekst. Rok jest
       tym, co odróżnia cytat od prozy — i jest częścią konwencji, więc nic nie kosztuje. */
    if (!SYNONIMY[ozn] && !/^[^]{0,30}(19|20)\d\d/.test(po)) continue;
    const szukaj = SYNONIMY[ozn] || ozn;
    sprawdzone++;
    T(`${tag}/${c.h}/${ozn}/${c.plik}:${c.wiersz}`, bez(def).includes(bez(szukaj)),
      `cytowane „[${c.h}] ${ozn}", a definicja ${c.h} w ${gdzie} mówi o czym innym: „${def.slice(0, 90)}…"`);
  }
  return sprawdzone;
}
{
  const wKodzie = zgodnoscOznaczen('ZR2', cytKod, BIB, 'engine_doc.txt');
  const wDokPl = zgodnoscOznaczen('DOC3/pl', cytDokPl, BIB, 'engine_doc.txt');
  const wDokEn = zgodnoscOznaczen('DOC3/en', cytDokEn, BIB_EN, 'engine_doc.en.txt');
  // KONTROLA CZUŁOŚCI: gdyby konwencja przestała być stosowana, sekcja nie sprawdziłaby NICZEGO
  // i bramka przechodziłaby na pusto — tak jak pierwsza wersja MC2 przy sesji ciągłej.
  T('ZR3/konwencja-zywa', wKodzie >= 10,
    `oznaczenie po numerze znaleziono tylko przy ${wKodzie} cytowaniach w src — konwencja przestała być stosowana i bramka nic nie pilnuje`);
  T('DOC3/konwencja-zywa', wDokPl >= 5 && wDokEn >= 5,
    `w dokumentacji sprawdzono PL ${wDokPl} / EN ${wDokEn} par numer↔oznaczenie — za mało, by cokolwiek pilnować`);
}

/* ═══════════ 6. KONWENCJA JAKO BRAMKA, NIE JAKO PROŚBA ═══════════
   (a) NAWIAS MUSI SIĘ ZAMYKAĆ NA NUMERZE. Zmierzone 2026-08-16: `[H25 Hain 1987]` i `[H5 Weber 2008]`
       — numer i nazwisko w JEDNYM nawiasie. Wzorzec `[Hnn]` ich nie łapie, więc te trzy cytowania
       były NIEWIDZIALNE dla każdej wyroczni i dla każdego pomiaru. Cichy brak jest gorszy od błędu.
   (b) OZNACZENIE NIE STOI PRZED NUMEREM. Rozpoznajemy je tą samą sygnaturą co po numerze (nazwisko
       + rok), żeby reguła była symetryczna, a nie zależna od słownika. */
{
  const zrodla = [...pliki.map(p => [relative(ROOT, p).replace(/\\/g, '/'), czytaj(relative(ROOT, p))]),
    ...['engine_doc.txt', 'engine_doc.en.txt', 'view_doc.txt', 'view_doc.en.txt'].map(f => [f, czytaj(f)])];
  const zle = [], przed = [];
  for (const [nazwa, tekst] of zrodla) {
    tekst.split('\n').forEach((l, i) => {
      for (const m of l.matchAll(/\[H\d+(?=[^\]\n]{0,40}\])[^\]\n]*\]/g)) {
        if (!/^\[H\d+\]$/.test(m[0])) zle.push(`${nazwa}:${i + 1} „${m[0]}"`);
      }
      for (const m of l.matchAll(/([A-ZŁŚŻŹĆÓÖ][A-Za-zŁłŚśŻżŹźĆćÓóĘęĄąŃńÖö'’-]{2,}(?:\s*(?:i wsp\.|et al\.|&\s*\w+))?[\s,]+(?:19|20)\d\d\s*[),]?\s*)\[H\d+\]/g)) {
        przed.push(`${nazwa}:${i + 1} „${m[0].trim()}"`);
      }
    });
  }
  T('KON1/nawias-zamkniety', zle.length === 0,
    `numer w nawiasie z doklejonym oznaczeniem — niewidzialny dla wzorca [Hnn]: ${zle.slice(0, 4).join(' · ')}`);
  T('KON2/oznaczenie-po-numerze', przed.length === 0,
    `oznaczenie stoi PRZED numerem wbrew konwencji: ${przed.slice(0, 4).join(' · ')}`);
}

/* ═══════════ 7. LICZBA ZNAMIENNA NALEŻY DO JEDNEJ PRACY ═══════════
   TO JEST JEDYNA SEKCJA, KTÓRA ZŁAPAŁABY BŁĄD Z CHMURY ZŁOGU. Tam numer stał SAM („kontekst RCT
   (56% vs 21%, OR 4,42) z [H28]"), więc porównanie numer↔nazwisko nie miało czego porównać.
   Ale te liczby SĄ WYPISANE w opisie bibliograficznym [H29] — właściciel jest WYPROWADZALNY.

   ZASADA: token liczbowy o WŁASNEJ STRUKTURZE (iloraz szans, zakres procentowy, porównanie „x% vs
   y%"), występujący w DOKŁADNIE JEDNYM wpisie bibliografii, należy do tego wpisu. Wiersz, który
   niesie taki token I NIESIE JAKIŚ numer, musi nieść numer właściciela.
     · wiersz BEZ numeru jest pomijany — źródło wolno cytować samym nazwiskiem (granica bramki);
     · token w CUDZYSŁOWIE w opisie jest pomijany — „80–93%" to liczba ODRZUCONA, omawiana, a nie
       wielkość, którą praca niesie;
     · gołe wartości („80%", „15°/s") NIE są tokenami. Pomiar: reguła bez wymogu struktury dała
       fałszywy alarm — „15°/s" z opisu HSN [H25] trafiało w zdanie „spvV 15°/s" cytujące [H22].
       Wartość sama w sobie nie jest niczyją własnością; struktura już tak. */
{
  const TOK = /(?:OR\s*\d+[.,]\d+|\d+(?:[.,]\d+)?\s*%\s*vs\s*\d+(?:[.,]\d+)?\s*%|\d+(?:[.,]\d+)?[–-]\d+(?:[.,]\d+)?\s*%)/g;
  const CUDZ = /[„“"][^”“"]{0,40}[”"]/g;
  const norm = (s) => s.replace(/[–—]/g, '-').replace(/(\d),(\d)/g, '$1.$2').replace(/\s+/g, ' ').trim().toLowerCase();
  let pinow = 0, wlascicieli = 0;
  for (const [tag, slownik, cyt] of [['LIC/pl', BIB, [...cytDokPl, ...cytKod]], ['LIC/en', BIB_EN, cytDokEn]]) {
    const kto = new Map();
    for (const [h, def] of slownik) {
      for (const t of new Set([...def.replace(CUDZ, ' ').matchAll(TOK)].map(m => norm(m[0])))) {
        if (!kto.has(t)) kto.set(t, new Set());
        kto.get(t).add(h);
      }
    }
    const wlasc = [...kto].filter(([, hs]) => hs.size === 1).map(([t, hs]) => [t, [...hs][0]]);
    wlascicieli += wlasc.length;
    /* jeden wiersz może nieść kilka cytowań — grupujemy, bo pytanie brzmi „czy w tym wierszu
       stoi numer właściciela", a nie „czy stoi przy tym konkretnym wystąpieniu". */
    const wiersze = new Map();
    for (const c of cyt) {
      const k = `${c.plik}:${c.wiersz}`;
      if (!wiersze.has(k)) wiersze.set(k, { linia: c.linia, hs: new Set() });
      wiersze.get(k).hs.add(c.h);
    }
    for (const [k, w] of wiersze) {
      const nl = norm(w.linia);
      for (const [t, h] of wlasc) {
        if (!nl.includes(t)) continue;
        pinow++;
        T(`${tag}/${t}/${k}`, w.hs.has(h),
          `liczba „${t}" należy do ${h}, a wiersz cytuje ${[...w.hs].join(', ')} — ${k}`);
      }
    }
  }
  T('LIC1/liczby-zyja', wlascicieli >= 6 && pinow >= 2,
    `wyprowadzono ${wlascicieli} liczb znamiennych i ${pinow} pinów — sekcja przestała cokolwiek pilnować`);
}

/* ═══════════ 8. OBIE BIBLIOGRAFIE MUSZĄ ZNAĆ TE SAME ŹRÓDŁA, A OBA LUSTRA — CYTOWAĆ TAK SAMO ═══════════
   Tłumaczenie ma prawo brzmieć inaczej, ale nie ma prawa mieć innych źródeł ani cytować ich w innych
   miejscach: rozjazd numeracji między dokumentami to dokładnie ten rodzaj usterki, który wywołał
   całą tę bramkę. */
{
  const tylkoPl = [...BIB.keys()].filter(h => !BIB_EN.has(h));
  const tylkoEn = [...BIB_EN.keys()].filter(h => !BIB.has(h));
  T('ZR4/bibliografie-zgodne', tylkoPl.length === 0 && tylkoEn.length === 0,
    `zbiory numerów rozjechały się — tylko w PL: ${tylkoPl.join(', ') || 'brak'}; tylko w EN: ${tylkoEn.join(', ') || 'brak'}`);

  const licz = (cyt) => cyt.reduce((a, c) => (a[c.h] = (a[c.h] || 0) + 1, a), {});
  const lp = licz(cytDokPl), le = licz(cytDokEn);
  const rozjazd = [...new Set([...Object.keys(lp), ...Object.keys(le)])]
    .filter(h => (lp[h] || 0) !== (le[h] || 0))
    .map(h => `${h}: PL ${lp[h] || 0} ≠ EN ${le[h] || 0}`);
  T('DOC4/lustro-cytowan', rozjazd.length === 0,
    `dokumentacja PL i EN cytuje różną liczbę razy: ${rozjazd.join(' · ')}`);
}

/* ═══════════ 8b. PROZA POD WPISAMI PRZESTAJE BYĆ MARTWYM POLEM — BIB6 (K7-B1) ═══════════
   HISTORIA DŁUGU: zbierz() celowo pomija wiersze bibliografii (bibliografia jest ŹRÓDŁEM, nie
   przedmiotem skanu) — ale wpisy niosą też PROZĘ: noty E3a pod [H53], notę erraty pod [H19],
   dopiski K7-A2/A4 pod [H52] i [H61], PMID Lacoura pod [H43]. Ta proza nie była zliczana,
   sprawdzana numer↔nazwisko ani porównywana między lustrami. Dowód (dziennik E3a niżej):
   wstrzyknięte tam celowo błędne „[H19] Kattah 2009" przechodziło na zielono, a realny rozjazd
   lustra [H19] PL 20 / EN 19 zaszedł NIEWYKRYTY i został wyrównany ręcznie.
   ARCHITEKTURA LICZNIKA — AGREGAT, świadomie: jedna asercja na regułę i lustro (jak DOC4),
   nie przypadek per cytowanie (jak ZR2/DOC3). Proza wpisów to warstwa dopisków — rośnie przy
   każdym przeglądzie — a licznik OCZEKIWANE nie powinien ruszać się od każdego dopisku;
   ruszać ma się od NIEZGODNOŚCI. Zmierzone przy wdrożeniu: 43 cytowania w prozie na lustro
   (PL i EN identycznie), 18 wpisów z co najmniej jednym [Hnn], asymetrii per wpis ZERO.
   PO REBASE NA E-DOC2 (K7-B1b): 44/lustro i 19 wpisów — E-DOC2b dopisało odsyłacz [H19]
   w prozie wpisu [H23], symetrycznie w obu lustrach, więc reguły pozostały zielone.
   CZEGO TA SEKCJA NIE SPRAWDZA: tokenu definicji (pierwszy [Hnn] wpisu to jego numer, nie
   cytowanie) ani prozy w rozdziałach (to robota DOC1–DOC4). */
function cytProzyWpisow(tekst, bib) {
  const linie = tekst.split('\n'); const out = [];
  for (const [i, wpis] of bib.przypis) {
    for (const m of linie[i].matchAll(/\[(H\d+)\]/g)) {
      if (i === bib.start.get(wpis) && m.index === 0) continue;   // token definicji, nie cytowanie
      out.push({ wpis, h: m[1], poz: m.index, linia: linie[i], wiersz: i + 1 });
    }
  }
  return out;
}
function zleOznaczeniaProzy(cyt, slownik) {
  let sprawdzone = 0; const zle = [];
  for (const c of cyt) {
    const def = slownik.get(c.h);
    if (!def) { zle.push(`${c.h} bez definicji (proza wpisu ${c.wpis}, w. ${c.wiersz})`); continue; }
    /* ta sama sygnatura oznaczenia co w zgodnoscOznaczen() — nazwisko + rok w zasięgu 30 znaków */
    const po = c.linia.slice(c.poz + c.h.length + 2).replace(/^[\s:—·)(,;.-]+/, '');
    const m = /^([A-ZŁŚŻŹĆÓĘĄŃÖ][A-Za-zŁłŚśŻżŹźĆćÓóĘęĄąŃńÖö'’-]*(?:-[A-Z][A-Za-z]*)?)/.exec(po);
    if (!m) continue;
    const ozn = m[1];
    if (ozn.length < 3) continue;
    if (!SYNONIMY[ozn] && !/^[^]{0,30}(19|20)\d\d/.test(po)) continue;
    sprawdzone++;
    if (!bez(def).includes(bez(SYNONIMY[ozn] || ozn)))
      zle.push(`„[${c.h}] ${ozn}" w prozie wpisu ${c.wpis} (w. ${c.wiersz}), a definicja ${c.h} mówi o czym innym`);
  }
  return { sprawdzone, zle };
}
const licznikProzy = (cyt) => {
  const m = new Map();
  for (const c of cyt) { const k = `${c.wpis}→${c.h}`; m.set(k, (m.get(k) || 0) + 1); }
  return m;
};
{
  const cytPl = cytProzyWpisow(czytaj('engine_doc.txt'), { przypis: PRZYPIS_PL, start: START_PL });
  const cytEn = cytProzyWpisow(czytaj('engine_doc.en.txt'), { przypis: PRZYPIS_EN, start: START_EN });

  const zPl = zleOznaczeniaProzy(cytPl, BIB);
  const zEn = zleOznaczeniaProzy(cytEn, BIB_EN);
  T('BIB6/PL/zgodnosc-w-prozie-wpisow', zPl.zle.length === 0,
    `proza wpisów PL cytuje niezgodnie z bibliografią: ${zPl.zle.slice(0, 4).join(' · ')}`);
  T('BIB6/EN/zgodnosc-w-prozie-wpisow', zEn.zle.length === 0,
    `proza wpisów EN cytuje niezgodnie z bibliografią: ${zEn.zle.slice(0, 4).join(' · ')}`);

  const lp = licznikProzy(cytPl), le = licznikProzy(cytEn);
  const rozjazd = [...new Set([...lp.keys(), ...le.keys()])]
    .filter(k => (lp.get(k) || 0) !== (le.get(k) || 0))
    .map(k => `${k}: PL ${lp.get(k) || 0} ≠ EN ${le.get(k) || 0}`);
  T('BIB6/lustro-prozy-wpisow', rozjazd.length === 0,
    `proza wpisów cytuje w lustrach różną liczbę razy: ${rozjazd.join(' · ')}`);

  T('BIB6/zasieg-zywy', cytPl.length >= 20 && cytEn.length >= 20,
    `w prozie wpisów znaleziono PL ${cytPl.length} / EN ${cytEn.length} cytowań — sekcja przestała cokolwiek czytać`);

  /* KONTROLA CZUŁOŚCI — dokładnie sonda z zapisu długu, tym razem W PAMIĘCI: do prozy wpisu
     [H53] w PL wstrzykujemy „[H19] Kattah 2009" i żądamy, by złapały to OBIE reguły naraz —
     zgodność (Kattah nie jest w definicji H19) i lustro (PL zyskuje H53→H19, EN nie). */
  const NL = String.fromCharCode(10);
  const oryginal = czytaj('engine_doc.txt');
  const linie = oryginal.split(NL);
  const ofiara = [...PRZYPIS_PL].find(([i, h]) => h === 'H53' && i !== START_PL.get('H53'));
  const zatruty = ofiara ? (() => {
    const kopia = [...linie];
    kopia[ofiara[0]] += ' Wg [H19] Kattah 2009.';
    return kopia.join(NL);
  })() : oryginal;
  const probny = bibliografia(zatruty);
  const cytProbny = cytProzyWpisow(zatruty, { przypis: probny.przypis, start: probny.start });
  const wykrytaZgodnosc = zleOznaczeniaProzy(cytProbny, probny.BIB).zle.some(z => /H19.*Kattah|Kattah/.test(z));
  const lProbny = licznikProzy(cytProbny);
  const wykrytyLustro = (lProbny.get('H53→H19') || 0) !== (le.get('H53→H19') || 0);
  T('BIB6/kontrola-czulosci', zatruty !== oryginal && wykrytaZgodnosc && wykrytyLustro,
    zatruty === oryginal
      ? 'syntetycznego zatrucia NIE DAŁO SIĘ WSTRZYKNĄĆ — wpis [H53] nie ma już prozy; przenieś kontrolę na inny wpis'
      : `zatrucie prozy [H53] nie zostało wykryte (zgodność ${wykrytaZgodnosc}, lustro ${wykrytyLustro}) — sekcja przestała pilnować`);
}

/* ═══════════ 9. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 276;  /* 2026-08-22, K7-B1: 271 -> 276. PIEC asercji sekcji 8b (BIB6) —
                            MARTWE POLE ZAMKNIETE. Proza pod wpisami bibliografii (noty E3a pod
                            [H53], nota erraty pod [H19], dopiski K7 pod [H52]/[H61], PMID
                            Lacoura pod [H43]) jest odtad czytana: zgodnosc numer-nazwisko
                            (PL + EN), rownosc luster per wpis, straznik zasiegu i kontrola
                            czulosci odtwarzajaca sonde z zapisu dlugu ("[H19] Kattah 2009"
                            wstrzykniete w proze [H53] W PAMIECI musi zapalic OBIE reguly).
                            Architektura AGREGATOWA (jak DOC4): dopisek w prozie wpisu NIE rusza
                            licznika — rusza go dopiero niezgodnosc. Zmierzone przy wdrozeniu:
                            43 cytowania/lustro, 18 wpisow z [Hnn], asymetrii ZERO; --ile: 276.
                            Po rebase na E-DOC2 (K7-B1b): 44/lustro, 19 wpisow — [H19] w prozie
                            [H23] z E-DOC2b, symetrycznie; licznik przypadkow BEZ zmian (agregat).
                            POPRZEDNIO: 2026-08-22, K7-A6: 270 -> 271. JEDNO cytowanie "[H56] Ward 2021"
                            w komentarzu przy VEMP_AR (src/engine/neuro-vor.js) — kotwica dla
                            deklaracji "norma pracowniana, poza korpusem ICVD": [H56] wprost
                            kaze ustalac odciecia VEMP per pracownia (2 zdania w pelnym tekscie,
                            zadne bez liczby). Prog i nazwisko Rosengren bez zmian (E3a).
                            Zmierzone przez --ile: 271.
                            POPRZEDNIO: 2026-08-22, kontrola powtorna K7-A3: 268 -> 270. DWA cytowania
                            "[H46] Lempert 2022" w src/render/svg-screens.js — dodatni odsylacz
                            przy regule pierwszenstwa Meniere'a nad migrena w punkcie karty
                            migreny (blok wykluczen kryterium D), lustro PL + lustro EN. Twardy
                            blad atrybucji naprawila E4a; ten krok domyka rezyduum — [H46] padal
                            na karcie dopiero w nocie zamykajacej. Zmierzone przez --ile: 270.
                            POPRZEDNIO: 2026-08-22, etap E6 (ATLAS OTONEUROLOGICZNY): 228 -> 268.
                            CZTERDZIESCI cytowan, rozlozone na DWA pliki. Arytmetyka ZMIERZONA
                            przez dokladanie plikow po jednym do czystego HEAD (git archive do
                            katalogu tymczasowego), a nie oszacowana:
                              src/app/atlas-model.js  +38 — nowy plik: 18 wpisow ICVD. Kazdy niesie
                                                            rodowod "[Hnn] Autor ROK" w polu `zrodlo`,
                                                            a reszta cytowan stoi w tresci kryteriow,
                                                            granic zrodla i uwag o terminach
                                                            ODRADZANYCH. Rozklad zmierzony:
                                                            H61 x5, H54 x5, H51 x4, H47 x4, H57 x3,
                                                            H20 x3, H19 x3, H60 x2, H52 x2 oraz po
                                                            jednym H59, H58, H56, H53, H50, H49, H46.
                              src/app/triage-model.js +2  — "[H61] Kaski 2025" w komentarzu pola
                                                            `atlas` i "[H52] Kim 2019" przy linku
                                                            ortostatycznym, ktory idzie za uwaga D-ORTO.
                              pozostale SIEDEM zmienionych plikow: PO ZERO (state.js, svg-screens.js,
                              actions.js, nav-model.js, shell.js, main.js, atlas-state.js) — zmierzone,
                              nie zalozone. W state.js stoi bare "[H61]" bez oznaczenia, wiec bramka
                              nie liczy go jako przypadku; to jest zgodne z konwencja, nie przeoczenie.
                            CO TA LICZBA NAPRAWDE MOWI: 268 cytowan przeszlo kontrole zgodnosci
                            NUMER-NAZWISKO wobec bibliografii. Dla atlasu to jest jedyna maszynowa
                            kontrola atrybucji, jaka istnieje — bo pelnych tekstow nie ma w repo.
                            CZEGO TA BRAMKA NIE WIDZI: czy tresc jest PARAFRAZA, czy przedrukiem.
                            To mierzy osobne narzedzie `tools/atlas-parafraza.mjs`, uruchamiane przy
                            korpusie; jego wynik zapisuje sie w repozytorium, bo pomiar bez zapisu
                            jest zapewnieniem, nie dowodem.
                            DOKUMENTACJA WNOSI ZERO: engine_doc w tym etapie nietkniete.

                            2026-08-22, etap D6-NAPRAWY: 225 -> 228.
                            TRZY cytowania "[H49] Strupp 2016", WSZYSTKIE w src/render/svg-screens.js
                            (lustro PL, lustro EN i komentarz przy poprawce). Zmierzone przez
                            podstawianie wersji z HEAD: bez svg-screens.js licznik wraca do 225,
                            bez engine_doc zostaje 228 — czyli DOKUMENTACJA WNOSI ZERO NETTO.
                            UZASADNIENIE TEGO ZERA SPRAWDZONE SONDA, a nie zalozone: wstrzykniete
                            w mape pokrycia celowo bledne "[H57] Kattah 2009" ZAPALA bramke, wiec
                            ten fragment JEST czytany. (Inaczej niz proza pod wpisem bibliograficznym
                            — tam bramka ma martwe pole, opisane nizej przy etapie E3a.) Zero bierze
                            sie stad, ze usuniete odwolania [H48] w obu lustrach zrownowazyly sie
                            z trescia dopisana.
                            POWOD ZMIANY: karta migreny ZANIZALA okno napadowicy do „jednej do kilku
                            sekund", podczas gdy kryterium B [H49] mowi < 1 minuty (postac pewna)
                            i < 5 minut (prawdopodobna) — a napis stoi w bloku WYKLUCZEN, wiec chory
                            z napadem 40-sekundowym byl nim odrzucany. Przy okazji mapa pokrycia ICVD
                            przestala klamac o [H50], [H52] i [H53] jako "NIEOBECNYCH".

                            2026-08-22, etap D-CT (decyzja uzytkownika, wariant A): 217 -> 225.
                            OSIEM cytowan netto, zmierzone przez podstawianie wersji z HEAD, ADDYTYWNE:
                              pelna zmiana 225 | bez triage-model.js 219 (czyli +6)
                                               | bez hints-model.js  223 (czyli +2)
                              217 + 6 + 2 = 225.
                            Zdanie o TK bylo DWUCZLONOWE u zrodla, a program niosl tylko czlon
                            negatywny. Doszedl czlon pozytywny — TK ZALECANA do wykrycia krwotoku
                            ([H58] Kim 2022) i angio-TK dla zwezenia t. kregowej/podstawnej
                            ([H59] Strupp 2022) — w karcie czerwonej flagi i w stalej OSTRZEZENIE,
                            w obu lustrach. Uwaga na karcie dostala tez ZNACZNIK ZRODLA, ktorego
                            jako JEDYNA z trzech nie miala.
                            PULAPKA KONWENCJI ZLAPANA PRZEZ BRAMKE W TRAKCIE: pierwszy zapis brzmial
                            „[H58] Kim 2022, [H59] Strupp 2022" — i KON2 slusznie zapalil sie na
                            „Kim 2022, [H59]", czyli oznaczeniu stojacym PRZED numerem. Rozdzielone
                            na dwa zdania, kazdy numer niesie wlasne oznaczenie.

                            2026-08-22, etap D-ORTO (decyzja uzytkownika, wariant A): 214 -> 217.
                            TRZY cytowania "[H52] Kim 2019" Z OZNACZENIEM, wszystkie w
                            src/app/triage-model.js: dwa w tresci UWAGI (lustro PL i EN) i jedno
                            w komentarzu przy nowym pytaniu `ortostaza`. Pozostale wystapienia
                            [H52] w tym komentarzu sa GOLE (numer bez oznaczenia), wiec licznika
                            nie ruszaja — konwencja na to pozwala.
                            Zmierzone: po cofnieciu samego triage-model.js licznik wraca do 214.

                            2026-08-22, etap E3a (decyzja uzytkownika D1): 205 -> 214.
                            DZIEWIEC cytowan netto, ROZLOZONE NA DWA PLIKI — zmierzone przez
                            podstawianie wersji z HEAD, nie oszacowane. Pomiar jest ADDYTYWNY:
                              pelna zmiana 214 | bez neuro-vor.js 207 (czyli silnik wnosi +7)
                                              | bez engine_doc  212 (czyli dokumentacja wnosi +2)
                              205 + 7 + 2 = 214.
                            SILNIK, src/engine/neuro-vor.js: dodano OSIEM cytowan z oznaczeniem —
                            przy GAIN_CUT trzy ("[H19] Strupp 2017" nota 5 z granica normy,
                            "[H53] Agrawal 2019" pasmo presbywestybulopatii, "[H59] Strupp 2022"
                            brak zgody co do odciecia), przy CAL_BILAT trzy (te same prace przy
                            zapisie STATYSTYKI), przy CP_THRESH jedno ("[H59] Strupp 2022" — prog
                            25% lezal w TYM SAMYM zdaniu zrodla co prog 6°/s) i jedno w miejscu
                            uzycia orzekajacego ("[H19] Strupp 2017"). USUNIETO jedno ("[H19] Strupp
                            2017" ze starego komentarza uzycia). 8 - 1 = 7.
                            DOKUMENTACJA, engine_doc.txt + .en.txt: +2, po jednym "[H19] Strupp 2017"
                            w kazdym lustrze — nota przy #A6, ktora zastapila OSIEROCONY odsylacz
                            "(McGarvie 2015)" przypisujacy temu nazwisku WSZYSTKIE TRZY liczby,
                            w tym pionowe 0,7 ogloszone w tym samym etapie bez pokrycia.
                            UWAGA NA PRZYSZLOSC — POMIAR ZLAPAL WLASNA POMYLKE: pierwsza wersja tego
                            komentarza mowila "6, wszystkie w neuro-vor.js, engine_doc wnosi zero, bo
                            numery juz tam byly". Liczba byla prawdziwa, UZASADNIENIE FALSZYWE. Zmiany
                            w engine_doc lezaly wtedy WEWNATRZ wpisu [H53] jako wiersze wciete, a
                            bibliografia() dokleja kazdy taki wiersz do DEFINICJI wpisu, wiec zbierz()
                            go POMIJA — bramka tamtego fragmentu W OGOLE NIE CZYTA (nie liczy cytowan,
                            nie sprawdza zgodnosci numer-nazwisko, nie porownuje lustra PL/EN).
                            Dowod: wstrzykniete tam celowo bledne "[H19] Kattah 2009" przechodzi na
                            zielono. Dlug zapisany w przesiew_icvd.md przy etapie E3a.
                            [DLUG ZAMKNIETY 2026-08-22 w K7-B1 — sekcja 8b (BIB6) czyta te proze,
                            a kontrola czulosci wstrzykuje dokladnie te sama sonde i zada jej
                            wykrycia przez OBIE reguly naraz.]
                            ZADNEJ LICZBY PROGU NIE ZMIENIONO: snapshot:check identyczny ze zlotym
                            wzorcem. Zmieniono RANGE (granica normy vs kryterium) i RODOWOD.
                            2026-08-21, etap D-CZAS (decyzja uzytkownika): 194 -> 205.
                            JEDENASCIE nowych cytowan z oznaczeniem, wszystkie w triage-model.js
                            i w obu jezykach: nowy wezel CVS niesie "[H61] Kaski 2025" (zrodlo osi
                            trzech zespolow kardynalnych) oraz "[H50] Staab 2017", "[H19] Strupp 2017"
                            i "[H53] Agrawal 2019" (jednostki, ktore ICVD definiuje w oknie
                            przewleklym), a poprawiona uwaga pseudoAVS odsyla do tego samego wezla.
                            Policzone przez --ile PO wstawieniu, nie oszacowane.
                            2026-08-21, etap D-MRI (decyzja uzytkownika): 186 -> 194.
                            OSIEM nowych cytowan z oznaczeniem "[H58] Kim 2022", w czterech miejscach
                            i obu jezykach: triage-model.js (nowa tresc o falszywie ujemnym DWI oraz
                            DRUGA uwaga o wyzszej czulosci badania klinicznego), hints-model.js
                            (ta sama tresc w komunikacie HINTS) i svg-screens.js (skrot na karcie
                            GRACE). Zastapiony napis nie mial ZADNEGO numeru — interwal "48-72 h"
                            byl NASZ: ciag "48-72" ma w calym korpusie 19 dokumentow ICVD 0 trafien.
                            2026-08-21, etapy D-REP + D-ATX + D-CPN (decyzje uzytkownika): 178 -> 186.
                            OSIEM nowych cytowan Z OZNACZENIEM, w trzech plikach: src/app/cpn-model.js
                            (nowy modul tresci karty CPN — "[H48] von Brevern 2015" w kontrapunkcie
                            downbeatu, oba jezyki), src/app/triage-model.js ("[H58] Kim 2022" przy
                            zawezonym twierdzeniu o ataksji, oba jezyki) i src/app/flow-model.js
                            ("[H48] von Brevern 2015" przy obowiazku wykluczenia OUN, oba jezyki).
                            Numery w polu `zrodlo` modulu cpn-model.js sa GOLE i przypadku nie tworza —
                            konwencja je dopuszcza. Policzone przez --ile PO wstawieniu.
                            2026-08-21, etap E5a (dwie poprawki faktow na karcie GRACE): 176 -> 178.
                            DWA nowe cytowania z oznaczeniem, oba w graceCard: "[H48] von Brevern 2015"
                            (wyjatek pseudo-samoistny w kolumnie t-EVS) i "[H46] Lempert 2022"
                            (badanie miedzynapadowe w kolumnie s-EVS). Obie komorki byly NIEPRAWDZIWE
                            wobec zrodel, ktore projekt juz ma — poprawka faktu, nie decyzja redakcyjna.
                            2026-08-21, etap E4a (kryteria choroby Meniere'a [H20]): 154 -> 176.
                            DWADZIESCIA DWA nowe przypadki, WSZYSTKIE z dwoch nowych rozdzialow
                            engine_doc (PL + EN) — ZMIERZONE: licznik pokazywal 176 juz PO wstawieniu
                            rozdzialow, a PRZED poprawka atrybucji w svg-screens.js, i po niej sie
                            NIE ZMIENIL. Poprawka atrybucji byla PRZESUNIECIEM odsylacza wewnatrz
                            jednej linii (numer przykleil sie do REGULY, a nalezy do KRYTERIOW),
                            wiec liczba wystapien "[H20] Lopez-Escamez 2015" w src zostala ta sama.
                            2026-08-21, etap E1 (kryteria BPPV [H48] von Brevern 2015): 152 -> 154.
                            DWA nowe przypadki, oba z view_doc — ZMIERZONE, nie oszacowane: po cofnieciu
                            samych zmian w view_doc.txt/.en licznik wraca do 152 przy WSZYSTKICH
                            pozostalych zmianach etapu na miejscu. Zrodlem sa dwa nowe cytowania
                            z oznaczeniem, w obu lustrach: "[H48] von Brevern 2015" (zrodlo kryteriow
                            karty klasyfikacji, ktora dotad podawala jako zrodlo PAMIEC MODELU) oraz
                            "[H51] Eggers 2019" (zapowiedz etapu E2 dla czerwonych flag CPN).
                            ZERO nowych przypadkow z src/ i z engine_doc, mimo ze [H48] doszlo tam
                            w czterech miejscach — te reguly sa ZBIORCZE, nie per cytowanie.
                            2026-08-21, etap E0 (bibliografia 19 dokumentow ICVD): 152 -> 152, BEZ ZMIANY.
                            Bibliografia 46 -> 61 ([H47]-[H61]), ale nowe cytowania sa GOLYMI numerami,
                            ktore konwencja dopuszcza i ktore nie tworza wlasnego przypadku. Nowe wpisy
                            sprawdzaja wylacznie reguly ZBIORCZE: BIB2, BIB4, BIB5, ZR4, DOC2 i DOC4.
                            To jest ZADEKLAROWANA GRANICA tej bramki, a nie jej awaria — i wlasnie
                            dlatego E0 potrzebowal osobnego dowodu zakresu ze snapshotu.
                            2026-08-20, etap V28b (zabramkowanie pulapki parsera): 147 -> 152.
                            PIEC nowych przypadkow, wszystkie STALE (nie zaleza od liczby wpisow):
                            BIB4/PL i BIB4/EN (monotonicznosc), BIB5/PL i BIB5/EN (ksztalt definicji)
                            oraz BIB4/kontrola-czulosci. Bramka zweryfikowana KONCOWO-DO-KONCA, nie
                            tylko kontrola w pamieci: zatrucie prawdziwego engine_doc.txt przez
                            przelamanie wiersza tak, by "[H20]" wypadlo w kolumnie 0, daje DWA bledy
                            (BIB4/PL i BIB5/PL) i wskazuje wiersz. Przedtem ta sama edycja przechodzila
                            na ZIELONO.
                            2026-08-20, etap V28 (kryteria migreny przedsionkowej): 132 -> 147.
                            PIETNASCIE nowych cytowan, policzonych przez --ile PO wstawieniu, nie
                            oszacowanych. Bibliografia 45 -> 46 ([H46] Lempert 2022 - dokument
                            konsensusu Barany Society i IHS). Rozbicie:
                              +2 svg-screens.js karta CPN - "[H46] Lempert 2022" w napisie t(),
                                 czyli PO JEDNYM w polowce PL i EN (napis stoi w jednej linii zrodla),
                              +4 svg-screens.js nota karty vmCriteriaCard - "[H20] Lopez-Escamez 2015"
                                 i "[H46] Lempert 2022", oba razy po dwa (PL+EN),
                              +1 neuro-vor.js komentarz presetu vmInterictal - "[H46] Lempert 2022",
                              +4 engine_doc.txt rozdzial V28 - naglowek i tresc: dwa razy
                                 "[H46] Lempert 2022", raz "[H24] Edlow 2023", raz
                                 "[H20] Lopez-Escamez 2015",
                              +4 engine_doc.en.txt - lustro tego samego rozdzialu, ta sama czworka.
                            NIE licza sie do tej sumy: same wpisy bibliograficzne (+0, linie wpisu sa
                            pomijane przez zbierz) oraz "Wpis [H46] w obu bibliografiach" w rozdziale
                            (+0 jako para, bo po numerze stoi mala litera - ale +1 do DOC4 w KAZDYM
                            lustrze, wiec zdanie musi stac w obu jezykach; stoi).
                            PULAPKA ZMIERZONA PRZY TYM ETAPIE, warta zapisania: pierwsza wersja
                            rozdzialu miala zdanie zawijajace sie tak, ze "[H20]" wypadalo na POCZATEK
                            linii. Parser bibliografia() czyta KAZDA linie zaczynajaca sie od ^[Hnn]
                            jako POCZATEK WPISU - a poniewaz rozdzialy stoja PRZED wpisami, ta linia
                            stawala sie definicja H20, a prawdziwy wpis Lopez-Escameza byl potem
                            ODRZUCANY przez regule "pierwsze wystapienie wygrywa". Bramka byla przy tym
                            ZIELONA, bo zdanie przypadkiem zawieralo nazwisko - czyli cicha korupcja
                            zrodla prawdy, gorsza od czerwonej. Regula: w rozdziale numer NIGDY nie
                            stoi w kolumnie 0.
                            (Zapis wczesniejszy zachowany nizej.)
                            ZMIERZONE na SCALONYM drzewie (Etap 3): 54 z main + 47 z rozdzialow Blokow
                            8-16 futureUI, wszystkie zielone. Nie ma tu dwoch numeracji — [H28] to
                            Newman-Toker, [H29] Cochrane 2014 (slot zwolniony przez scalenie [H17]/[H29]
                            w Etapie 1), a cytowania main przenumerowane. Byly: 54 (main) / 88 (futureUI).
                            2026-08-20, etap V27a (bramka obustronnosci w dva()): 107 -> 113.
                            SZESC nowych cytowan, wszystkie zielone, policzone przez --ile:
                            bibliografia 40 -> 43 ([H41] Guinand 2012, [H44] Geisinger 2024,
                            [H45] Karabulut 2023) plus odsylacze w komentarzu dva(). Uwaga:
                            "(Guinand 2012)" bylo cytatem SAMYM NAZWISKIEM, wiec bramka go NIE
                            LICZYLA - zamiana na [H41] Guinand 2012 sama z siebie podnosi licznik.
                            2026-08-20, etap V27b (redakcja zdania DVA + rozdzial): 113 -> 132.
                            DZIEWIETNASCIE nowych cytowan: bibliografia 43 -> 45 ([H42] Hall 2022,
                            [H43] Schubert 2008) plus odsylacze przy zdaniu karty i rozdzial V27
                            w engine_doc.txt i engine_doc.en.txt (lustro PL/EN symetryczne).
                            (Historyczny zapis sprzed rozbicia na dwa commity: 107 -> 132.)
                            NIEUZYWANE JUZ, zostawione dla ciagu: DWADZIESCIA PIEC nowych cytowan,
                            wszystkie zielone, policzone przez --ile po wstawieniu, nie oszacowane:
                            bibliografia urosla 40 -> 45 ([H41] Guinand 2012, [H42] Hall 2022,
                            [H43] Schubert 2008, [H44] Geisinger 2024, [H45] Karabulut 2023), doszly
                            odsylacze w komentarzach dva() i przy zdaniu karty, oraz rozdzial V27
                            w engine_doc.txt i engine_doc.en.txt (lustro PL/EN symetryczne).
                            Uwaga: "(Guinand 2012)" bylo cytatem SAMYM NAZWISKIEM, wiec bramka go
                            NIE LICZYLA - zamiana na [H41] Guinand 2012 sama z siebie podnosi licznik.
                            2026-08-20, etap V26 (HSN): 101 -> 107. SZESC nowych cytowan, wszystkie
                            zielone i wszystkie policzone RECZNIE, nie przepisane z komunikatu:
                              +1 neuro-vor.js — "[H25] Hain 1987" (numer STAL SAM, dopisano oznaczenie
                                 z rokiem, wiec bramka zaczela go widziec; praca bez zmian),
                              +2 neuro-vor.js — "[H40] Katsarkas 2000" przy hsn() i przy clinicalReadout,
                              +3 dokumentacja — naglowek rozdzialu V26 w engine_doc.txt i .en.txt
                                 oraz odsylacz w tresci. Bibliografia urosla 39 -> 40 wpisow. */
if (process.argv.includes('--ile')) {
  console.log(`przypadków: ${ok + bledy.length} (zielonych ${ok}, czerwonych ${bledy.length})`);
  bledy.forEach(b => console.log('  ' + b));
  process.exit(0);
}
if (bledy.length) {
  console.error(`✗ zrodla:check — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ zrodla:check — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli dopisano/usunieto cytowanie, popraw OCZEKIWANE — ale nie po cichu (npm run zrodla:check -- --ile).');
  process.exit(1);
}
console.log(`✓ zrodla:check — ${ok} przypadkow; kod (${cytKod.length} cytowan) i dokumentacja (PL ${cytDokPl.length} / EN ${cytDokEn.length}) zgodne z bibliografia ${BIB.size} wpisow.`);
