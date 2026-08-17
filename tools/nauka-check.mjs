/* OTOREPO — wyrocznia CZYSTEGO MODELU TRYBU NAUKI (Blok 13). Gołe Node, bez jsdom.
 *
 * Bada twierdzenia o MODELU. Twierdzenia o EKRANIE (decyzja przed odpowiedzią widoczna w DOM,
 * układ D3/M3, brak poziomego przewijania) bada tools/nauka-dom.mjs — ta sama para wyroczni,
 * co przy Blokach 9-12.
 *
 * ═══ CO TA WYROCZNIA MA ZŁAPAĆ ═══
 * Nie „czy odpowiedzi są poprawne" — one są LICZONE przez modele kliniczne, więc pilnują ich
 * wyrocznie tamtych bloków. Ta wyrocznia pilnuje czterech rzeczy, których tamte nie widzą:
 *   1. czy biblioteka nie zaczęła nieść własnego, ręcznie wpisanego klucza (rozjazd z modelem),
 *   2. czy któryś etap nie stracił NOŚNIKA BŁĘDU, czyli nie zaczął tylko wyglądać na oceniony,
 *   3. czy odpowiedź OBRONNA nie jest nigdzie nazywana błędną (kryterium odbioru nr 4),
 *   4. czy klucz jest odporny na stan prawdziwego pacjenta (rozdział torów).
 *
 * Uruchomienie: npm run nauka:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  POZIOMY, POZIOM_IDS, RODZAJE, RODZAJ_IDS, ETAPY, ETAP_IDS, ETAPY_PYTAJACE, etapNauki,
  WERDYKTY, WERDYKT_IDS, POWODY_BLEDU, ODPOWIEDZI_WLASNE,
  BIBLIOTEKA, PRZYPADEK_IDS, przypadek, przypadki, probyPrzypadku, probaGlowna,
  kluczPrzypadku, opcjeEtapu, opcjePrzewidywania, opcjeRozpoznania, opcjeMechanizmu, opcjeManewru, opcjeKontroli,
  werdyktyEtapu, etapNiejednoznaczny, mocRozstrzygajaca, mocPrzypadku, walidujPrzypadek,
  RODZAJE_WSKAZOWEK, wskazowka, odsloniete, informacjaZwrotna, wolnoDalej,
  postepLekcji, koniecPrzypadku, OCENY, wynikPrzypadku,
  POLA_POSTEPU, wpisPostepu, bezDanychOsobowychNauka, postepBiblioteki,
} from '../src/app/nauka-model.js';
import { naukaDeps, PACJENT_ZERO, uchoBadane, odciskObserwacji } from '../src/app/nauka-deps.js';
import { OBS_POLA, OBS_FAZY, FLAGI } from '../src/app/obs-model.js';
import { AKCJE, AKCJA_IDS, ZAWSZE_DOSTEPNE, REGULY_KROKOW, WYNIK_IDS } from '../src/app/followup-model.js';
import { MANEUVERS } from '../src/pose/maneuvers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
/* OTOREPO_TAGI=1 wypisuje KAZDY sprawdzany tag. Zapadka liczbowa mowi, ze przypadek zniknal,
   ale nie ktory — bez tego trzeba by ja podniesc na slepo, czyli obejsc. */
const T = (tag, w, opis) => { if (process.env.OTOREPO_TAGI) console.log('TAG', tag); if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const D = (p) => naukaDeps(p);
const KLUCZE = new Map(BIBLIOTEKA.map(p => [p.id, kluczPrzypadku(p, D(p))]));

/* ═══════════ A. BIBLIOTEKA — POKRYCIE I POPRAWNOŚĆ ZAPISU ═══════════
   Dokument wymaga trzech poziomów i czterech rodzajów. Brak pokrycia nie jest usterką kosmetyczną:
   biblioteka bez przypadku wielokanałowego uczy, że BPPV zawsze siedzi w jednym kanale. */
{
  T('A1/niepusta', BIBLIOTEKA.length >= 12, `biblioteka ma ${BIBLIOTEKA.length} przypadków`);
  T('A2/id-unikalne', new Set(PRZYPADEK_IDS).size === PRZYPADEK_IDS.length, 'identyfikatory przypadków muszą być unikalne');
  for (const poziom of POZIOM_IDS) T(`A3/poziom-${poziom}`, przypadki({ poziom }).length >= 2, `poziom ${poziom} ma mniej niż 2 przypadki`);
  for (const rodzaj of RODZAJ_IDS) T(`A4/rodzaj-${rodzaj}`, przypadki({ rodzaj }).length >= 2, `rodzaj ${rodzaj} ma mniej niż 2 przypadki`);
  eq('A5/filtr-pusty', przypadki(null).length, BIBLIOTEKA.length);
  eq('A6/filtr-nieznany', przypadki({ poziom: 'nieistnieje' }).length, 0);
  for (const p of BIBLIOTEKA) {
    const w = walidujPrzypadek(p);
    T(`A7/walidator/${p.id}`, w.ok, `braki: ${w.braki.join(',')}`);
  }
  // A8: żadne pole przypadku nie może nieść rozpoznania. To jest CAŁA zasada tego bloku:
  // gdyby przypadek niósł klucz, biblioteka byłaby szóstym opisem tej samej wiedzy klinicznej.
  const ZAKAZANE = ['rozpoznanie', 'kanal', 'canal', 'strona', 'side', 'mechanizm', 'variant', 'manewr', 'maneuver', 'odpowiedz', 'klucz'];
  for (const p of BIBLIOTEKA) {
    const zle = Object.keys(p).filter(k => ZAKAZANE.includes(k));
    T(`A8/bez-klucza/${p.id}`, !zle.length, `przypadek niesie wpisane rozpoznanie: ${zle.join(',')}`);
  }
  // A9: pułapka MUSI wskazywać cechę albo flagę REALNIE obecną w tym przypadku — inaczej można
  // dopisać dowolny morał, a wyrocznia nie zauważy, że nie ma on związku z obrazem.
  for (const p of BIBLIOTEKA) {
    const k = KLUCZE.get(p.id);
    const cecha = p.pulapkaCecha;
    const kluczeRekordu = Object.keys((k.rekord || {}).pola || {});
    const trafia = kluczeRekordu.includes(cecha) || k.flagi.includes(cecha)
      || (k.interp.brakujace || []).includes(cecha) || Object.keys(OBS_POLA).includes(cecha);
    T(`A9/pulapka-trafia/${p.id}`, trafia, `pułapka wskazuje „${cecha}", czego w tym przypadku nie ma`);
  }
  // A10: teksty dwujęzyczne — brak wersji EN znaczy, że połowa użytkowników dostaje polską lukę.
  for (const p of BIBLIOTEKA) {
    T(`A10/pl-en/${p.id}`, !!(p.tytulPl && p.tytulEn && p.kontekstPl && p.kontekstEn && p.pulapkaPl && p.pulapkaEn),
      'przypadek musi mieć komplet napisów PL i EN');
  }
}

/* ═══════════ B. KLUCZ JEST LICZONY, NIE WPISANY ═══════════
   Dowód, że model NAPRAWDĘ pyta silnik: zmieniamy JEDNO pole rekordu i sprawdzamy, że klucz się
   zmienia. Gdyby klucz był wpisany, ta pętla nie zauważyłaby niczego. */
{
  const p = przypadek('pc-p-klasyk');
  const k = KLUCZE.get(p.id);
  eq('B1/klasyk-kanal', k.interp.kanal, 'posterior');
  eq('B2/klasyk-strona', k.interp.strona, 'P');
  eq('B3/klasyk-mechanizm', k.interp.mechanizm, 'canalo');
  eq('B4/klasyk-manewr', k.dobor.pierwszy, 'epley');

  // Odwracamy skręt: strona MUSI się odwrócić. To jest pomiar, że klucz idzie z silnika.
  const lustro = JSON.parse(JSON.stringify(p));
  lustro.obs.dix.pola['torsja#jedyna'].w = 'm1';
  lustro.stronaProby = 'L';
  const kl = kluczPrzypadku(lustro, D(lustro));
  eq('B5/lustro-strona', kl.interp.strona, 'L');
  eq('B6/lustro-manewr', kl.dobor.pierwszy, 'epley');

  // Podmieniamy dynamikę na kupulolitiazę: mechanizm i manewr MUSZĄ się zmienić.
  const kupulo = JSON.parse(JSON.stringify(p));
  Object.assign(kupulo.obs.dix.pola, { latencja: { w: 'brak', znak: null }, czasTrwania: { w: 'powyzej1min', znak: null },
    meczliwosc: { w: 'bezZmian', znak: null }, przebieg: { w: 'staly', znak: null } });
  const kk = kluczPrzypadku(kupulo, D(kupulo));
  eq('B7/kupulo-mechanizm', kk.interp.mechanizm, 'cupulo');
  eq('B8/kupulo-manewr', kk.dobor.pierwszy, 'semont');

  // B9: manewr liczony z PRÓBY przypadku, nie z „pierwszej próby kanału".
  const bl = przypadek('hc-geo-p');
  const kb = KLUCZE.get(bl.id);
  eq('B9/manewr-z-proby', kb.dobor.proba, 'roll');
}

/* ═══════════ C. ROZDZIAŁ TORÓW — KLUCZ ODPORNY NA PACJENTA ═══════════
   Najgroźniejszy defekt, jaki ten blok mógł popełnić: policzyć klucz na `{...state, obs:…}`.
   Wtedy klinicysta, który przed chwilą ustawił stronę, wariant i przełącznik „ośrodkowy",
   wnosiłby swojego pacjenta do lekcji. Sprawdzamy to DWOMA niezależnymi sposobami. */
{
  // C1: literał PACJENT_ZERO jest zamrożony i ma wartości neutralne.
  T('C1/zamrozony', Object.isFrozen(PACJENT_ZERO), 'PACJENT_ZERO musi być zamrożony');
  eq('C2/neutralny-side', PACJENT_ZERO.side, null);
  eq('C3/neutralny-variant', PACJENT_ZERO.variant, null);
  eq('C4/neutralny-central', PACJENT_ZERO.diagCentral, false);
  // C5: klucz liczony DWA RAZY dla tego samego przypadku jest identyczny — brak stanu ukrytego.
  for (const p of BIBLIOTEKA) {
    const a = kluczPrzypadku(p, D(p)), b = kluczPrzypadku(p, D(p));
    T(`C5/deterministyczny/${p.id}`, JSON.stringify(a) === JSON.stringify(b), 'klucz nie jest deterministyczny');
  }
  // C6: modele nauki nie mają prawa zaimportować stanu aplikacji.
  for (const plik of ['src/app/nauka-model.js', 'src/app/nauka-deps.js']) {
    const src = readFileSync(resolve(ROOT, plik), 'utf8');
    const bezKom = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    T(`C6/bez-state/${plik}`, !/from\s+['"][^'"]*state\.js['"]/.test(bezKom), 'moduł nauki nie ma prawa importować state.js');
  }
}

/* ═══════════ D. KRYTERIUM ODBIORU NR 1 — DECYZJA PRZED ODPOWIEDZIĄ ═══════════ */
{
  const p = przypadek('pc-p-klasyk'), d = D(p);
  const pusty = { naukaOdp: {}, naukaWskazowki: [] };
  for (const e of ETAPY_PYTAJACE) {
    eq(`D1/brak-informacji/${e}`, informacjaZwrotna(e, p, d, pusty), null);
    eq(`D2/nie-odsloniete/${e}`, odsloniete(pusty, e).odsloniete, false);
    eq(`D3/nie-wolno-dalej/${e}`, wolnoDalej(pusty, e), false);
  }
  eq('D4/opis-bez-decyzji', wolnoDalej(pusty, 'opis'), true);
  // D5: WSKAZÓWKA odsłania, ale NIE ZWALNIA z decyzji — informacja zwrotna wciąż nie istnieje.
  const zeWsk = { naukaOdp: {}, naukaWskazowki: ['rozpoznanie'] };
  eq('D5/wskazowka-odslania', odsloniete(zeWsk, 'rozpoznanie').odsloniete, true);
  eq('D6/wskazowka-nie-odpowiada', informacjaZwrotna('rozpoznanie', p, d, zeWsk), null);
  eq('D7/wskazowka-nie-przepuszcza', wolnoDalej(zeWsk, 'rozpoznanie'), false);
  // D8: po decyzji informacja zwrotna istnieje i niesie werdykt.
  const poDecyzji = { naukaOdp: { rozpoznanie: 'posterior:P' }, naukaWskazowki: [] };
  const iz = informacjaZwrotna('rozpoznanie', p, d, poDecyzji);
  T('D8/po-decyzji', !!iz && iz.werdykt === 'trafna', `oczekiwano trafnej, jest ${iz && iz.werdykt}`);
  eq('D9/po-decyzji-wolno', wolnoDalej(poDecyzji, 'rozpoznanie'), true);
  // D10: wskazówka NIGDY nie niesie odpowiedzi — wskazuje cechę albo flagę, i tyle.
  for (const p2 of BIBLIOTEKA) {
    const d2 = D(p2);
    for (const e of ETAPY_PYTAJACE) {
      const w = wskazowka(e, p2, d2);
      const dobra = !!RODZAJE_WSKAZOWEK[w.rodzaj]
        && (w.klucz == null || typeof w.klucz === 'string')
        && (w.flaga == null || !!FLAGI[w.flaga])
        && !('kanal' in w) && !('strona' in w) && !('mechanizm' in w) && !('manewr' in w);
      T(`D10/wskazowka-nie-odpowiada/${p2.id}/${e}`, dobra, `wskazówka niesie coś więcej niż cechę: ${JSON.stringify(w)}`);
    }
  }
}

/* ═══════════ E. KRYTERIUM ODBIORU NR 4 — NIEJEDNOZNACZNOŚĆ ═══════════ */
{
  // E1: KAŻDY etap ma nośnik błędu ALBO jawnie udowodnioną nierozróżnialność.
  for (const p of BIBLIOTEKA) {
    const moc = mocPrzypadku(p, D(p));
    T(`E1/nosnik-bledu/${p.id}`, !moc.tepe.length, `etapy bez nośnika błędu: ${moc.tepe.join(',')}`);
    T(`E2/nie-caly-niejednoznaczny/${p.id}`, moc.zTrafna >= 3, `tylko ${moc.zTrafna} etapów ma odpowiedź trafną`);
  }
  // E3: kandydatura, która PRZEŻYŁA, nigdy nie jest odpowiedzią błędną. To jest naprawa po
  //     krytyce: inaczej każdy downbeat w Dix-Hallpike'u kasowałby kanał przedni z różnicowania.
  for (const p of BIBLIOTEKA) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('rozpoznanie', p, d, k);
    for (const kand of (k.interp.pozostale || [])) {
      const v = `${kand.canal}:${kand.side}`;
      T(`E3/przezyla-nie-bledna/${p.id}/${v}`, w[v] && w[v].werdykt !== 'bledna',
        `kandydatura, która przeżyła, dostała werdykt ${w[v] && w[v].werdykt}`);
    }
  }
  // E4: przy przypadku, w którym model nie rozstrzyga mechanizmu, NIE MA odpowiedzi trafnej
  //     wśród mechanizmów — trafną jest „nie da się rozstrzygnąć".
  {
    const p = przypadek('pc-bez-dynamiki'), d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('mechanizm', p, d, k);
    eq('E4a/nierozstrzygniety-trafna', w.nieRozstrzygaSie.werdykt, 'trafna');
    eq('E4b/canalo-dopuszczalna', w.canalo.werdykt, 'dopuszczalna');
    eq('E4c/cupulo-dopuszczalna', w.cupulo.werdykt, 'dopuszczalna');
  }
  // E5: maska modelu — strona kanału przedniego NIE JEST wyprowadzalna, więc obie strony
  //     są dopuszczalne i żadna nie jest trafna.
  {
    const p = przypadek('ac-headhang'), d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('rozpoznanie', p, d, k);
    eq('E5a/przednia-P', w['anterior:P'].werdykt, 'dopuszczalna');
    eq('E5b/przednia-L', w['anterior:L'].werdykt, 'dopuszczalna');
    T('E5c/brak-trafnej', etapNiejednoznaczny('rozpoznanie', p, d, k), 'strona kanału przedniego nie ma prawa być rozstrzygnięta');
  }
  // E6: „nie da się przewidzieć" jest LICZONE, nie ustalone — trafne przy wielu wzorcach,
  //     dopuszczalne przy jednym. Inaczej dałoby się przejść całą bibliotekę jednym przyciskiem.
  for (const p of BIBLIOTEKA) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('przewidywanie', p, d, k);
    const ocz = k.wzorceStrony.length > 1 ? 'trafna' : 'dopuszczalna';
    eq(`E6/nie-da-sie/${p.id}`, w.nieDaSiePrzewidziec.werdykt, ocz);
    T(`E6b/nigdy-bledna/${p.id}`, w.nieDaSiePrzewidziec.werdykt !== 'bledna', 'powściągliwość nie może być błędem');
  }
}

/* ═══════════ F. ETAP PRZEWIDYWANIA — NOŚNIKIEM BŁĘDU JEST UCHO ═══════════
   Pierwsza wersja modelu nazywała błędem „wzorzec, którego ta próba nie potrafi dać" i awansowała
   przez to uproszczenie silnika do twierdzenia klinicznego. Te przypadki pilnują, żeby nie wróciło. */
{
  // F1: w słowniku powodów NIE MA i nie może być pozycji o niemożliwości.
  T('F1/bez-niemozliwosci', !Object.keys(POWODY_BLEDU).some(k => /niemozliw/i.test(k)),
    'powód „niemożliwy wzorzec" nie ma prawa wrócić — to uproszczenie modelu, nie fizyka');
  // F2: przy próbie JEDNOSTRONNEJ wzorzec drugiego ucha jest błędny — i to jedyny błędny wzorzec.
  {
    const p = przypadek('pc-p-klasyk'), d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('przewidywanie', p, d, k);
    const bledneWzorce = Object.entries(w).filter(([v, x]) => x.werdykt === 'bledna' && !ODPOWIEDZI_WLASNE[v]);
    T('F2a/jest-zla-strona', bledneWzorce.length >= 1, 'przy próbie jednostronnej musi istnieć wzorzec drugiego ucha');
    T('F2b/powod-strona', bledneWzorce.every(([, x]) => x.powod === 'zlaStrona'), 'jedynym powodem błędu wzorca jest zła strona');
    eq('F2c/obserwowany-trafny', w[k.obserwowany].werdykt, 'trafna');
  }
  // F3: przy próbie OBUSTRONNEJ żaden wzorzec nie jest błędny — nie ma ucha, o które można się pomylić.
  for (const p of BIBLIOTEKA.filter(x => !x.stronaProby)) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('przewidywanie', p, d, k);
    const zleWzorce = Object.entries(w).filter(([v, x]) => x.werdykt === 'bledna' && !ODPOWIEDZI_WLASNE[v]);
    T(`F3/obustronna-bez-strony/${p.id}`, !zleWzorce.length, `próba obustronna nie ma prawa mieć wzorca „ze złej strony": ${zleWzorce.map(x => x[0])}`);
  }
  // F4: „poza wzorcami" jest trafne DOKŁADNIE wtedy, gdy obraz do niczego nie pasuje.
  for (const p of BIBLIOTEKA) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('przewidywanie', p, d, k);
    eq(`F4/poza-wzorcami/${p.id}`, w.pozaWzorcami.werdykt, k.pozaWzorcami ? 'trafna' : 'bledna');
  }
  // F5: ucho BADANE przy kanale przednim w Dix-Hallpike'u jest PRZECIWNE do chorego.
  eq('F5a/przedni-dix', uchoBadane('dix', { canal: 'anterior', side: 'L' }), 'P');
  eq('F5b/tylny-dix', uchoBadane('dix', { canal: 'posterior', side: 'L' }), 'L');
  eq('F5c/przedni-headhang', uchoBadane('headhang', { canal: 'anterior', side: 'L' }), 'L');
  // F6: odcisk OBSERWACJI i odcisk PREDYKCJI mają ten sam format — inaczej porównanie nie ma sensu.
  {
    const p = przypadek('hc-geo-p'), k = KLUCZE.get(p.id);
    T('F6a/odcisk-istnieje', !!k.obserwowany, 'rekord kompletny musi dać odcisk');
    T('F6b/odcisk-pasuje', k.wzorceStrony.some(w => w.odcisk === k.obserwowany), 'odcisk obserwacji musi trafić w któryś wzorzec');
    // Rekord bez nasilenia nie daje odcisku — i to jest poprawne, bo bez niego nie ma strony.
    const bezNas = JSON.parse(JSON.stringify(p));
    delete bezNas.obs.roll.pola.nasilenie;
    eq('F6c/bez-nasilenia', odciskObserwacji(bezNas.obs.roll, 'roll'), null);
  }
}

/* ═══════════ G. ETAP MANEWRU — DWIE ROZŁĄCZNE GAŁĘZIE ═══════════ */
{
  for (const p of BIBLIOTEKA) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('manewr', p, d, k);
    const manewryNieBledne = Object.entries(w).filter(([v, x]) => v !== 'bezRepozycji' && x.werdykt !== 'bledna');
    // G1: NIGDY obie drogi naraz. Model aplikacji traktuje obserwację i repozycję jako
    //     wykluczające się (REGULY_KROKOW.residual), więc lekcja nie ma prawa dopuszczać obu.
    const obie = w.bezRepozycji.werdykt !== 'bledna' && manewryNieBledne.length > 0;
    T(`G1/rozlaczne/${p.id}`, !obie, 'nie wolno, by „nie repozycjonuję" i manewr były równocześnie nie-błędne');
    // G2: przy obrazie nietypowym trafną jest wstrzymanie się — dokładnie tak, jak robi aplikacja.
    if (k.nietypowy) {
      eq(`G2a/nietypowy-wstrzymanie/${p.id}`, w.bezRepozycji.werdykt, 'trafna');
      T(`G2b/nietypowy-bez-manewru/${p.id}`, !manewryNieBledne.length, 'przy obrazie nietypowym żaden manewr nie jest poprawny');
    } else {
      eq(`G2c/typowy-nie-wstrzymuje/${p.id}`, w.bezRepozycji.werdykt, 'bledna');
    }
    // G3: manewry spoza kandydatur są błędne z powodem „inny kanał".
    for (const [v, x] of Object.entries(w)) {
      if (v === 'bezRepozycji' || x.werdykt !== 'bledna') continue;
      T(`G3/powod-manewru/${p.id}/${v}`, !!POWODY_BLEDU[x.powod], `powód „${x.powod}" spoza słownika`);
    }
  }
  // G4: opcje manewru to WSZYSTKIE manewry aplikacji — zawężenie do kanału oddałoby odpowiedź.
  const opcje = opcjeManewru(D(BIBLIOTEKA[0])).filter(o => o.typ === 'manewr').map(o => o.v);
  eq('G4/wszystkie-manewry', opcje.sort(), Object.keys(MANEUVERS).sort());
}

/* ═══════════ H. ETAP KONTROLI — ODBICIE BLOKU 11 ═══════════ */
{
  for (const p of BIBLIOTEKA.filter(x => x.kontrolaWynik)) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('kontrola', p, d, k);
    const reg = REGULY_KROKOW[p.kontrolaWynik];
    eq(`H1/glowny-trafny/${p.id}`, w[reg.glowny].werdykt, 'trafna');
    for (const a of (reg.dalsze || [])) eq(`H2/dalsze/${p.id}/${a}`, w[a].werdykt, 'dopuszczalna');
    for (const [a] of (reg.zakaz || [])) eq(`H3/zakaz/${p.id}/${a}`, w[a].werdykt, 'bledna');
    for (const a of ZAWSZE_DOSTEPNE) T(`H4/zawsze-dostepne/${p.id}/${a}`, w[a].werdykt !== 'bledna',
      'zakończenie sesji nie ma prawa być odpowiedzią błędną');
    T(`H5/wynik-ze-slownika/${p.id}`, WYNIK_IDS.includes(p.kontrolaWynik), 'wynik kontroli spoza słownika Bloku 11');
  }
  // H6: przypadek nieleczony ma własną gałąź — ocena przyczyny ośrodkowej jest trafna,
  //     a repozycja jest błędna. Bez tego etap 6 nie miałby przedmiotu.
  for (const p of BIBLIOTEKA.filter(x => !x.kontrolaWynik)) {
    const d = D(p), k = KLUCZE.get(p.id);
    const w = werdyktyEtapu('kontrola', p, d, k);
    eq(`H6a/ocen-osrodkowa/${p.id}`, w.ocenOsrodkowa.werdykt, 'trafna');
    eq(`H6b/bez-powtorki/${p.id}`, w.powtorzManewr.werdykt, 'bledna');
    eq(`H6c/bez-alternatywy/${p.id}`, w.alternatywnyManewr.werdykt, 'bledna');
  }
  // H7: każdy przypadek bez wyniku kontroli MUSI być nietypowy — inaczej „nie leczono"
  //     byłoby decyzją autora, a nie właściwością obrazu.
  for (const p of BIBLIOTEKA.filter(x => !x.kontrolaWynik)) {
    T(`H7/nieleczony-nietypowy/${p.id}`, KLUCZE.get(p.id).nietypowy, 'przypadek bez kontroli musi mieć obraz nietypowy');
  }
  // H8: brak kandydatur MUSI iść w parze z flagą — inaczej „nie pasuje do wzorca" udawałoby
  //     twierdzenie o ośrodku, a jest tylko luką w słowniku silnika.
  for (const p of BIBLIOTEKA) {
    const k = KLUCZE.get(p.id);
    if (!k.brakKandydatur) continue;
    T(`H8/pustka-z-flaga/${p.id}`, k.flagi.some(f => ['f1', 'f2', 'f3'].includes(f)),
      'przypadek bez kandydatur musi nieść flagę, inaczej uczy fałszywego alarmu');
  }
}

/* ═══════════ I. WYNIK, POSTĘP I STRAŻNIK DANYCH ═══════════ */
{
  const p = przypadek('pc-p-klasyk'), d = D(p);
  const komplet = { naukaOdp: { przewidywanie: '0,1,1#-', rozpoznanie: 'posterior:P', mechanizm: 'canalo', manewr: 'epley', kontrola: 'zakonczSesje' }, naukaWskazowki: [] };
  const w = wynikPrzypadku(p, d, komplet);
  eq('I1/ocena-rozwiazany', w.ocena, 'rozwiazany');
  eq('I2/bez-bledow', w.bledne, 0);
  eq('I3/postep-pelny', postepLekcji(p, komplet).ukonczona, true);
  const zeWsk = { ...komplet, naukaWskazowki: ['mechanizm'] };
  eq('I4/ocena-ze-wskazowka', wynikPrzypadku(p, d, zeWsk).ocena, 'zeWskazowka');
  const zBledem = { ...komplet, naukaOdp: { ...komplet.naukaOdp, manewr: 'lempert' } };
  eq('I5/ocena-z-bledami', wynikPrzypadku(p, d, zBledem).ocena, 'zBledami');
  eq('I6/ocena-nieukonczony', wynikPrzypadku(p, d, { naukaOdp: {}, naukaWskazowki: [] }).ocena, 'nieukonczony');
  // I7: wynik NIE JEST liczbą — to profil etapów. Pojedyncza liczba kłamałaby przy etapach,
  //     na których model nie zna jedynej odpowiedzi.
  T('I7/wynik-profilem', Array.isArray(w.etapy) && w.etapy.length === ETAPY_PYTAJACE.length && !('procent' in w) && !('punkty' in w),
    'wynik przypadku nie ma prawa być pojedynczą liczbą');
  // I8: strażnik ODRZUCA, nie czyści.
  const wpis = wpisPostepu(p, d, komplet);
  eq('I8a/wpis-czysty', bezDanychOsobowychNauka(wpis).czysty, true);
  eq('I8b/pola-wpisu', Object.keys(wpis).sort(), POLA_POSTEPU.slice().sort());
  T('I8c/wpis-bez-zegara', !JSON.stringify(wpis).match(/\d{4}-\d{2}-\d{2}|\d{13}/), 'wpis postępu nie ma prawa nieść zegara');
  for (const brud of [{ ...wpis, pacjent: 'X' }, { ...wpis, przypadek: 'nieistnieje' }, { ...wpis, ocena: 'super' },
                      { ...wpis, werdykty: { ...wpis.werdykty, cokolwiek: 'trafna' } }, { ...wpis, wskazowki: ['opis'] }]) {
    T('I9/straznik-odrzuca', !bezDanychOsobowychNauka(brud).czysty, `strażnik przepuścił ${JSON.stringify(brud).slice(0, 60)}`);
  }
  // I10: postęp z nieznanym przypadkiem nie kasuje się po cichu — jest policzony osobno.
  const pb = postepBiblioteki({ [p.id]: wpis, 'stary-id': { ocena: 'rozwiazany' } }, null);
  eq('I10a/nieznane-widoczne', pb.nieznaneWpisy, 1);
  eq('I10b/nieznane-nie-liczone', pb.dotkniete, 1);
  eq('I10c/wszystkich', pb.wszystkich, BIBLIOTEKA.length);
  // I11: uszkodzony postęp nie wywraca modelu.
  for (const zly of [null, undefined, 'napis', 42, []]) {
    let padlo = false;
    try { postepBiblioteki(zly, null); } catch { padlo = true; }
    T('I11/postep-odporny', !padlo, `postepBiblioteki wywrócił się na ${JSON.stringify(zly)}`);
  }
}

/* ═══════════ J. CZTERY POLA KOŃCA PRZYPADKU ═══════════ */
{
  for (const p of BIBLIOTEKA) {
    const d = D(p), k = KLUCZE.get(p.id);
    const kon = koniecPrzypadku(p, d, k);
    T(`J1/pulapka/${p.id}`, !!(kon.pulapka && kon.pulapka.pl && kon.pulapka.en), 'brak pułapki');
    T(`J2/nastepny/${p.id}`, !!(kon.nastepny && kon.nastepny.rodzaj), 'brak następnego kroku');
    T(`J3/rozstrzygajaca-lub-brak/${p.id}`, kon.rozstrzygajaca === null || typeof kon.rozstrzygajaca.klucz === 'string',
      'cecha rozstrzygająca musi być kluczem cechy albo jawnym brakiem');
    T(`J4/alternatywa/${p.id}`, kon.alternatywa === null || (!!kon.alternatywa.kanal && !!kon.alternatywa.strona),
      'alternatywa musi być kandydaturą albo jawnym brakiem');
  }
  // J5: przy obrazie nietypowym następnym krokiem jest ocena ośrodkowa, nie manewr.
  for (const p of BIBLIOTEKA) {
    const k = KLUCZE.get(p.id);
    if (!k.zakazBPPV) continue;
    eq(`J5/nietypowy-nastepny/${p.id}`, koniecPrzypadku(p, D(p), k).nastepny.rodzaj, 'ocenOsrodkowa');
  }
}

/* ═══════════ K. SPÓJNOŚĆ SŁOWNIKÓW ═══════════ */
{
  eq('K1/etapy-kolejnosc', ETAP_IDS, ['opis', 'przewidywanie', 'rozpoznanie', 'mechanizm', 'manewr', 'kontrola']);
  eq('K2/etapy-pytajace', ETAPY_PYTAJACE.length, 5);
  eq('K3/opis-nie-pyta', etapNauki('opis').pyta, false);
  eq('K4/etap-nieznany', etapNauki('cokolwiek'), null);
  eq('K5/przypadek-nieznany', przypadek('cokolwiek'), null);
  eq('K6/werdykty', WERDYKT_IDS.sort(), ['bledna', 'dopuszczalna', 'trafna']);
  for (const e of ETAPY) T(`K7/napisy/${e.id}`, !!(e.pl && e.en && e.wstepPl && e.wstepEn), 'etap bez kompletu napisów');
  for (const [id, o] of Object.entries(POZIOMY)) T(`K8/poziom/${id}`, !!(o.pl && o.en && o.opisPl && o.opisEn), 'poziom bez napisów');
  for (const [id, o] of Object.entries(RODZAJE)) T(`K9/rodzaj/${id}`, !!(o.pl && o.en), 'rodzaj bez napisów');
  for (const [id, o] of Object.entries(POWODY_BLEDU)) T(`K10/powod/${id}`, !!(o.pl && o.en), 'powód bez napisów');
  for (const [id, o] of Object.entries(ODPOWIEDZI_WLASNE)) T(`K11/odpowiedz/${id}`, !!(o.pl && o.en), 'odpowiedź własna bez napisów');
  // K12: opcje kontroli pochodzą ze słownika Bloku 11, a nie z nowej listy.
  const p = przypadek('pc-p-klasyk');
  const akcje = opcjeKontroli(p, D(p)).filter(o => o.typ === 'akcja').map(o => o.v);
  eq('K12/akcje-z-bloku-11', akcje.sort(), AKCJA_IDS.slice().sort());
  T('K13/akcje-maja-napisy', akcje.every(a => !!AKCJE[a]), 'akcja spoza słownika AKCJE');
  // K14: opcje rozpoznania pochodzą z kandydatur silnika.
  const roz = opcjeRozpoznania(p, D(p)).filter(o => o.typ === 'kandydatura');
  T('K14/kandydatury-z-silnika', roz.length === 4 && roz.every(o => ['posterior', 'anterior'].includes(o.kanal)),
    'opcje rozpoznania muszą pochodzić z kandydatur próby');
}

/* ═══════════ L. CZYSTOŚĆ MODUŁU ═══════════
   Skan po źródle z WYCIĘTYMI KOMENTARZAMI — bez tego bramka zapala się na własnym komentarzu
   wyjaśniającym zakaz (pułapka, która w tym projekcie wystąpiła już pięć razy). */
{
  const src = readFileSync(resolve(ROOT, 'src/app/nauka-model.js'), 'utf8');
  const bezKomentarzy = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  T('L1/bez-importow', !/^\s*import\s/m.test(bezKomentarzy), 'model nauki musi zostać bezimportowy');
  T('L2/bez-t', !/\bt\s*\(\s*['"]/.test(bezKomentarzy), 't() na poziomie modułu zamroziłoby język');
  T('L3/bez-zegara', !/Date\s*\.\s*now|new\s+Date|Math\s*\.\s*random/.test(bezKomentarzy),
    'wpis postępu nie ma prawa nieść zegara — złoty wzorzec musi zostać deterministyczny');
  T('L4/bez-dom', !/document|window|localStorage/.test(bezKomentarzy), 'model nie dotyka DOM ani pamięci przeglądarki');
  T('L5/czulosc-import', /^\s*import\s/m.test('import { x } from "y";'), 'kontrola: wzorzec importu musi trafiać');
  T('L6/czulosc-zegar', /Date\s*\.\s*now/.test('const teraz = Date.now();'), 'kontrola: wzorzec zegara musi trafiać');
  T('L7/kod-zostaje', /export function kluczPrzypadku/.test(bezKomentarzy), 'kontrola: wycinanie komentarzy nie wycina kodu');
  T('L8/komentarze-wyciete', !/pułapka, która w tym projekcie/.test(bezKomentarzy), 'kontrola: wycinanie komentarzy naprawdę działa');
  const WZORZEC_POLA = /<\s*(?:input|textarea)|contenteditable|type\s*=\s*["']text|\bprompt\s*\(/i;
  T('L9/bez-pol-tekstowych', !WZORZEC_POLA.test(bezKomentarzy), 'w module nauki nie ma prawa istnieć pole tekstowe');
  T('L10/czulosc-pola', WZORZEC_POLA.test('<textarea name="opis">'), 'kontrola: wzorzec pola musi trafiać');
  T('L11/bez-silnika', !/NeuroVOR|neuro-vor/.test(bezKomentarzy), 'model nauki nie sięga do symulatora HINTS');
  // L12: wstrzykiwacz też nie ma prawa zamrozić języka ani sięgnąć po DOM.
  const dep = readFileSync(resolve(ROOT, 'src/app/nauka-deps.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  T('L12/deps-bez-dom', !/document|window|localStorage/.test(dep), 'wstrzykiwacz nie dotyka DOM');
  T('L13/deps-bez-t', !/\bt\s*\(\s*['"]/.test(dep), 'wstrzykiwacz nie zamraża języka');
}

/* ═══════════ M. LICZNOŚĆ ═══════════ */
/* 576 -> 575 po wprowadzeniu silnikow z ocena II. ZMIERZONE zrzutem tagow (OTOREPO_TAGI=1),
   a nie podniesione na slepo: dla przypadku `downbeat-staly` znikly DWA przypadki
   E3/przezyla-nie-bledna/anterior:{L,P}, a doszedl JEDEN H8/pustka-z-flaga. Znaczy to, ze
   uporczywy downbeat przestal miec bronioną odpowiedz obwodowa (kanal przedni) i zamiast niej
   podnosi flage — czyli model przestal tlumaczyc klasyczna ceche osrodkowa przez BPPV.
   To zmiana POZADANA, nie utrata zakresu. */
const OCZEKIWANE = 601;   /* 600 + 1: po V26 i poprawce pozy kandydatura przednia jest porownywalna w jednym miejscu wiecej (torsja OPCJONALNA — [H31]) */
if (bledy.length) {
  console.error(`✗ nauka:check — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ nauka:check — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli to swiadoma zmiana zakresu, popraw OCZEKIWANE. Jesli nie — ktorys przypadek zniknal.');
  process.exit(1);
}
console.log(`✓ nauka:check — ${ok} przypadkow, model nauki zgodny.`);
