/* OTOREPO — wyrocznia CZYSTEGO MODELU LABORATORIUM (Blok 14). Gołe Node, bez jsdom.
 *
 * Trzy kryteria odbioru tego bloku dzielą się tak:
 *   K1 (Laboratorium niepotrzebne do zakończenia podstawowej diagnostyki) — twierdzenie o EKRANACH,
 *      więc bada je tools/lab-dom.mjs;
 *   K2 (każdy parametr ma opis jednostki i zakresu) — twierdzenie o DANYCH, bada je sekcja A i B;
 *   K3 (zmiana parametru pokazuje, co się zmieniło) — twierdzenie o MODELU, bada je sekcja C,
 *      i to na PEŁNYM zamiataniu wszystkich 27 parametrów w dwóch kontekstach klinicznych.
 *
 * Uruchomienie: npm run lab:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  PARAMETRY, PARAMETR_IDS, parametrLab, POWODY_BEZ_SKUTKU,
  OBSERWABLE, OBSERWABLE_IDS, obserwabla,
  skutekZmiany, EKSPERYMENTY, EKSPERYMENT_IDS, eksperyment,
  odchylenia, czyPrzyReferencji, porownanie,
} from '../src/app/lab-model.js';
import { labDeps, specParametru, specParametrow, grupyParametrow } from '../src/app/lab-deps.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const D = labDeps();
const SPEC = specParametrow();
import { NeuroVOR as _NV } from '../src/engine/neuro-vor.js';
const NERW_PELNY = _NV.nerveBranchLesion('P','superior',1);

/* ═══════════ A. SŁOWNIK ↔ SILNIK: ZERO DRYFU ═══════════
   Opis parametru, którego silnik nie ma, i parametr bez opisu to dwie strony tej samej awarii:
   dokumentacja rozjechana z modelem. Obie muszą być niemożliwe. */
{
  const kluczeSilnika = SPEC.map(p => p.key);
  eq('A1/tyle-samo', PARAMETR_IDS.length, kluczeSilnika.length);
  const bezOpisu = kluczeSilnika.filter(k => !PARAMETRY[k]);
  T('A2/kazdy-ma-opis', !bezOpisu.length, `parametry silnika bez opisu: ${bezOpisu.join(', ')}`);
  const zmyslone = PARAMETR_IDS.filter(k => !kluczeSilnika.includes(k));
  T('A3/bez-zmyslonych', !zmyslone.length, `opisy parametrów, których silnik nie ma: ${zmyslone.join(', ')}`);
  eq('A4/parametr-nieznany', parametrLab('cokolwiek'), null);
  eq('A5/spec-nieznany', specParametru('cokolwiek'), null);
  T('A6/grupy', grupyParametrow().length >= 8, 'silnik ma co najmniej 8 grup parametrów');
}

/* ═══════════ B. KRYTERIUM ODBIORU NR 2 — JEDNOSTKA I ZAKRES ═══════════
   Zmierzone przed blokiem: 27 z 27 parametrów nie miało ŻADNEGO opisu, a 14 z 27 nie miało nawet
   jednostki. Te bramki są tym pomiarem zamienionym w wymaganie. */
{
  for (const key of PARAMETR_IDS) {
    const p = PARAMETRY[key];
    T(`B1/komplet/${key}`, !!(p.pl && p.en && p.coToPl && p.coToEn && p.jednostkaPl && p.jednostkaEn && p.zakresPl && p.zakresEn),
      'wpis musi mieć nazwę, opis, jednostkę i zakres w OBU językach');
  }
  // B2: parametr LICZBOWY musi wymieniać swoją jednostkę albo powiedzieć wprost, że jest bezwymiarowy.
  for (const s of SPEC) {
    const p = PARAMETRY[s.key];
    const wybor = !!p.wybor;
    if (wybor) continue;
    const opis = `${p.jednostkaPl} ${p.jednostkaEn}`;
    const maJednostke = s.unit ? opis.includes(s.unit) : /BEZWYMIAROWA|DIMENSIONLESS/.test(opis);
    T(`B2/jednostka/${s.key}`, maJednostke,
      s.unit ? `opis nie wymienia jednostki „${s.unit}"` : 'parametr bezwymiarowy musi to powiedzieć wprost');
  }
  /* B3: przy wielkości bezwymiarowej sam zakres nic nie znaczy — opis MUSI PRZYPIĄĆ KONKRETNĄ
     LICZBĘ DO ZNACZENIA („1,0 = norma", „0 = faza ostra"). Pierwsza wersja tej bramki wymagała
     słowa „norma" i wywaliła dwa parametry, które normy NIE MAJĄ: kompensacja 0..1 to nie
     odchylenie od zdrowia, tylko dwa równie prawdziwe stany pacjenta, a supresja fiksacyjna ma
     wartość zdrową 0,9. Bramka mierzyła słowo zamiast własności. */
  for (const s of SPEC) {
    const p = PARAMETRY[s.key];
    if (p.wybor || s.unit) continue;
    T(`B3/liczba-ma-znaczenie/${s.key}`, /\d(?:[.,]\d+)?\s*=/.test(`${p.jednostkaPl} ${p.jednostkaEn}`),
      'przy wielkości bezwymiarowej opis musi przypiąć konkretną wartość do znaczenia');
  }
  // B4: opis zakresu musi wymieniać OBA krańce liczbowe silnika — inaczej „zakres" jest deklaracją.
  for (const s of SPEC) {
    const p = PARAMETRY[s.key];
    if (p.wybor) continue;
    // Normalizujemy typografię: minus „−" i plus „+" są poprawne w tekście polskim, ale nie są
    // tym samym znakiem, co w liczbie ze specyfikacji silnika.
    const tekst = `${p.zakresPl} ${p.zakresEn}`.replace(/,/g, '.').replace(/[−–]/g, '-').replace(/\+(?=\d)/g, '');
    const ma = (v) => tekst.includes(String(v));
    T(`B4/krance/${s.key}`, ma(s.min) && ma(s.max), `opis zakresu nie wymienia krańców ${s.min}..${s.max}`);
  }
  // B5: selektor MUSI powiedzieć, że nie ma zakresu liczbowego — inaczej użytkownik szuka suwaka.
  for (const key of PARAMETR_IDS) {
    const p = PARAMETRY[key];
    if (!p.wybor) continue;
    T(`B5/wybor/${key}`, /wybór|wybor|choice/i.test(`${p.jednostkaPl} ${p.jednostkaEn}`),
      'parametr wyboru musi powiedzieć wprost, że nie jest liczbą');
  }
  // B6: część zakresu bez odpowiednika w fizjologii ma być NAZWANA, a nie przemilczana.
  const zNiefizjo = PARAMETR_IDS.filter(k => PARAMETRY[k].nieFizjologiczny);
  T('B6/niefizjologiczne-nazwane', zNiefizjo.length >= 1, 'model dopuszcza wartości poza fizjologią — muszą być nazwane');
  for (const k of zNiefizjo) {
    T(`B6b/mowi-o-modelu/${k}`, /model|zakres modelu|range of the model/i.test(`${PARAMETRY[k].zakresPl} ${PARAMETRY[k].zakresEn}`),
      'opis musi powiedzieć, że to zakres MODELU, a nie stan kliniczny');
  }
}

/* ═══════════ C. KRYTERIUM ODBIORU NR 3 — SKUTEK ZMIANY JEST MIERZONY ═══════════
   Pełne zamiatanie: każdy z 27 parametrów przestawiany na oba krańce (albo na każdą opcję),
   w DWÓCH kontekstach — u zdrowego i u pacjenta z jednostronnym wypadnięciem. Kontekst ma
   znaczenie, bo zmierzone: supresja fiksacyjna u zdrowego nie ma czego tłumić. */
{
  const konteksty = [['zdrowy', {}], ['neuritisR', D.scenariusz('neuritisR').params]];
  const bezSkutkuWszedzie = [];
  for (const s of SPEC) {
    const wartosci = PARAMETRY[s.key].wybor ? ['L', 'P', null] : [s.min, s.max];
    let ruszyloGdziekolwiek = false;
    for (const [nazwaK, bazaP] of konteksty) {
      const baza = D.pacjent(bazaP);
      const przed = D.obraz(baza);
      for (const v of wartosci) {
        if (JSON.stringify(baza[s.key]) === JSON.stringify(v)) continue;
        const po = D.obraz(D.pacjent({ ...bazaP, [s.key]: v }));
        const sk = skutekZmiany(przed, po, s.key);
        T(`C1/ksztalt/${s.key}/${nazwaK}/${v}`,
          Array.isArray(sk.obserwable) && Array.isArray(sk.zdaniaDodane) && Array.isArray(sk.zdaniaZniklo)
            && typeof sk.bezSkutku === 'boolean',
          'skutekZmiany musi zwracać komplet pól');
        T(`C2/obserwable-ze-slownika/${s.key}/${nazwaK}/${v}`, sk.obserwable.every(o => OBSERWABLE_IDS.includes(o)),
          `obserwabla spoza słownika: ${sk.obserwable.filter(o => !OBSERWABLE_IDS.includes(o)).join(',')}`);
        T(`C3/powod-tylko-przy-braku/${s.key}/${nazwaK}/${v}`, sk.bezSkutku === (sk.powodBezSkutku != null),
          'powód braku skutku istnieje DOKŁADNIE wtedy, gdy nic się nie ruszyło');
        if (sk.powodBezSkutku) T(`C4/powod-ze-slownika/${s.key}/${nazwaK}/${v}`, !!POWODY_BEZ_SKUTKU[sk.powodBezSkutku],
          `powód „${sk.powodBezSkutku}" spoza słownika`);
        if (!sk.bezSkutku) ruszyloGdziekolwiek = true;
      }
    }
    // C5: parametr, który NIGDZIE nic nie rusza, musi sam deklarować, czego brakuje. Suwak bez
    //     skutku i bez wyjaśnienia uczy, że fizjologia jest przypadkowa.
    if (!ruszyloGdziekolwiek) bezSkutkuWszedzie.push(s.key);
    T(`C5/rusza-albo-tlumaczy/${s.key}`, ruszyloGdziekolwiek || !!PARAMETRY[s.key].bezSkutkuGdy,
      'parametr nie zmienia nic w żadnym kontekście i nie mówi dlaczego');
  }
  // C6: kontrola czułości — porównanie obrazu z samym sobą NIE MOŻE dać skutku.
  const r = D.obraz(D.pacjent({}));
  const pusty = skutekZmiany(r, r, 'toneL');
  eq('C6a/brak-roznicy', pusty.obserwable, []);
  eq('C6b/brak-skutku', pusty.bezSkutku, true);
  T('C6c/powod-podany', !!pusty.powodBezSkutku, 'przy braku skutku powód musi być podany');
  // C7: kontrola czułości w drugą stronę — realna patologia MUSI ruszyć obraz.
  const chory = skutekZmiany(r, D.obraz(D.pacjent({ toneR: 0, gainR: 0.3 })), 'toneR');
  T('C7/patologia-rusza', chory.obserwable.length >= 2 && chory.zdaniaDodane.length >= 1,
    'ubytek jednostronny musi ruszyć co najmniej dwie obserwable i dołożyć zdanie opisu');
  // C8: każda obserwabla ze słownika ma komplet napisów i opis badania, którym się ją stwierdza.
  for (const o of OBSERWABLE) T(`C8/obserwabla/${o.id}`, !!(o.pl && o.en && o.badaniePl && o.badanieEn),
    'obserwabla musi mieć nazwę i badanie w obu językach');
  eq('C9/obserwabla-nieznana', obserwabla('cokolwiek'), null);
}

/* ═══════════ D. EKSPERYMENTY I SCENARIUSZE REFERENCYJNE ═══════════ */
{
  const scen = D.scenariusze();
  T('D1/ile', EKSPERYMENTY.length >= 6, `eksperymentów jest ${EKSPERYMENTY.length}`);
  T('D2/id-unikalne', new Set(EKSPERYMENT_IDS).size === EKSPERYMENT_IDS.length, 'identyfikatory muszą być unikalne');
  for (const e of EKSPERYMENTY) {
    T(`D3/scenariusz-istnieje/${e.id}`, scen.includes(e.referencja), `scenariusz „${e.referencja}" nie istnieje w silniku`);
    T(`D4/napisy/${e.id}`, !!(e.pl && e.en && e.pytaniePl && e.pytanieEn), 'eksperyment musi mieć nazwę i pytanie w obu językach');
    T(`D5/parametry-istnieja/${e.id}`, e.parametry.every(k => !!PARAMETRY[k]),
      `nieznane parametry: ${e.parametry.filter(k => !PARAMETRY[k]).join(',')}`);
    T(`D6/parametry-niepuste/${e.id}`, e.parametry.length >= 2, 'eksperyment bez parametrów nie jest eksperymentem');
  }
  eq('D7/eksperyment-nieznany', eksperyment('cokolwiek'), null);
  // D8: każdy scenariusz silnika jest referencją co najmniej jednego eksperymentu ALBO jest
  //     świadomie pominięty — inaczej model silnika po cichu przestaje być dostępny.
  const uzyte = new Set(EKSPERYMENTY.map(e => e.referencja));
  const nieuzyte = scen.filter(s => !uzyte.has(s));
  T('D8/scenariusze-uzyte', nieuzyte.length <= 1, `scenariusze bez eksperymentu: ${nieuzyte.join(', ')}`);
}

/* ═══════════ E. RESET DO REFERENCJI ═══════════
   „Każdy eksperyment ma ustawienia początkowe i przycisk resetu do scenariusza referencyjnego."
   Reset ma być sprawdzalny, a nie deklarowany: po nim lista odchyleń musi być PUSTA. */
{
  for (const e of EKSPERYMENTY) {
    const ref = D.pacjentReferencyjny(e.referencja);
    T(`E1/reset-czysty/${e.id}`, czyPrzyReferencji(ref, ref), 'pacjent referencyjny nie może odbiegać od siebie');
    eq(`E2/brak-odchylen/${e.id}`, odchylenia(ref, ref), []);
  }
  // E3: jedna zmiana = dokładnie jedno odchylenie, z podaną wartością referencyjną i bieżącą.
  const ref = D.pacjentReferencyjny('normal');
  const zmieniony = D.pacjent({ toneR: 40 });
  const o = odchylenia(zmieniony, ref);
  eq('E3a/jedno-odchylenie', o.length, 1);
  eq('E3b/klucz', o[0].key, 'toneR');
  eq('E3c/referencja', o[0].referencja, ref.toneR);
  eq('E3d/teraz', o[0].teraz, 40);
  eq('E3e/nie-przy-referencji', czyPrzyReferencji(zmieniony, ref), false);
  // E4: odchylenia liczone tylko po ZNANYCH parametrach — pole spoza słownika ich nie zmyli.
  const zSmieciem = { ...ref, cokolwiek: 123 };
  eq('E4/smiec-ignorowany', odchylenia(zSmieciem, ref).length, 0);
}

/* ═══════════ F. PORÓWNANIE DWÓCH PATOLOGII ═══════════ */
{
  const a = D.obraz(D.pacjentReferencyjny('neuritisR'));
  const b = D.obraz(D.pacjentReferencyjny('bvh'));
  const p = porownanie(a, b);
  T('F1/rozne', p.rozne.length >= 2, 'neuronitis i BVH muszą różnić się w co najmniej dwóch obserwablach');
  T('F2/tylko-a', p.tylkoA.length >= 1, 'neuronitis musi mieć zdanie, którego BVH nie ma');
  T('F3/ze-slownika', p.rozne.every(id => OBSERWABLE_IDS.includes(id)), 'obserwabla spoza słownika');
  eq('F4/identyczne-ze-soba', porownanie(a, a).identyczne, true);
  eq('F5/nic-roznego', porownanie(a, a).rozne, []);
  // F6: model porównuje OBRAZY, nie ocenia chorób — w wyniku nie ma pola z werdyktem.
  T('F6/bez-werdyktu', !('werdykt' in p) && !('gorsza' in p) && !('ciezsza' in p),
    'porównanie nie ma prawa orzekać, która patologia jest cięższa');
}

/* ═══════════ G. CZYSTOŚĆ MODUŁU ═══════════ */
{
  const src = readFileSync(resolve(ROOT, 'src/app/lab-model.js'), 'utf8');
  const bezKom = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  T('G1/bez-importow', !/^\s*import\s/m.test(bezKom), 'model Laboratorium musi zostać bezimportowy');
  T('G2/bez-t', !/\bt\s*\(\s*['"]/.test(bezKom), 't() na poziomie modułu zamroziłoby język');
  T('G3/bez-zegara', !/Date\s*\.\s*now|new\s+Date|Math\s*\.\s*random/.test(bezKom), 'model musi zostać deterministyczny');
  /* G4: szukamy UŻYCIA W KODZIE (`window.`, `document.`), a nie SŁOWA. Pierwsza wersja tej bramki
     zapaliła się na klinicznym „third window" — dehiscencja kanału górnego jest trzecim oknem
     błędnika i to słowo ma prawo stać w opisie parametru. Bramka, która zabrania mówić o trzecim
     oknie w aplikacji otoneurologicznej, pilnuje siebie, a nie modelu. */
  const WZ_DOM = new RegExp('\\bwindow\\s*[.\\[]|\\bdocument\\s*[.\\[]|localStorage');
  T('G4/bez-dom', !WZ_DOM.test(bezKom), 'model nie dotyka DOM ani pamięci przeglądarki');
  T('G4b/czulosc-dom', WZ_DOM.test('const x = window.innerWidth;') && !WZ_DOM.test('a third window in the canal'),
    'kontrola: bramka ma łapać użycie w kodzie i przepuszczać trzecie okno błędnika');
  T('G5/bez-silnika', !/NeuroVOR|neuro-vor/.test(bezKom), 'model nie sięga po silnik wprost — wiedza wchodzi wstrzyknięciem');
  T('G6/czulosc-import', /^\s*import\s/m.test('import { x } from "y";'), 'kontrola: wzorzec importu musi trafiać');
  T('G7/kod-zostaje', /export function skutekZmiany/.test(bezKom), 'kontrola: wycinanie komentarzy nie wycina kodu');
  T('G8/komentarze-wyciete', !/Wysypanie ich na ekran/.test(bezKom), 'kontrola: wycinanie komentarzy naprawdę działa');
  // G9: NIE MA TABELI „parametr → skutek". To jest cała zasada K3: skutek jest mierzony.
  T('G9/bez-tabeli-skutkow', !/SKUTKI\s*=|skutkiParametru|MAPA_SKUTKOW/.test(bezKom),
    'tabela skutków byłaby drugim opisem fizjologii — skutek ma być mierzony');
  const dep = readFileSync(resolve(ROOT, 'src/app/lab-deps.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  T('G10/deps-bez-dom', !/document|window|localStorage/.test(dep), 'wstrzykiwacz nie dotyka DOM');
  T('G11/deps-bez-t', !/\bt\s*\(\s*['"]/.test(dep), 'wstrzykiwacz nie zamraża języka');
  T('G12/deps-bez-stanu', !/from\s+['"][^'"]*state\.js['"]/.test(dep), 'wstrzykiwacz nie ma prawa importować stanu aplikacji');
}


/* ═══════════ H. ZMIERZONE GRANICE SILNIKA — TRIPWIRE'Y, NIE OSKARŻENIA ═══════════
   Krytyka fizjologiczna Bloku 14 uruchomiła silnik i znalazła cztery miejsca, w których opis
   parametru byłby NIEPRAWDĄ, gdyby go napisać wprost. Silnika w tym bloku NIE ZMIENIAMY — to jest
   decyzja kliniczna użytkownika, nie moja. Nazywamy granice w opisie parametru (pole `granica*`)
   i PRZYPINAMY je tutaj.

   CZERWONA BRAMKA W TEJ SEKCJI NIE ZNACZY „silnik jest zepsuty". Znaczy: „silnik się zmienił,
   a opis parametru nadal mówi o starej granicy — popraw opis". Bez tego opis granicy jest
   komentarzem, który cicho traci ważność. */
{
  const gr = (k) => PARAMETRY[k] && PARAMETRY[k].granicaPl && PARAMETRY[k].granicaEn;

  // H1: nasycenie aferentu — wysoki TON psuje zmierzony vHIT mimo suwaka gain = 1,0.
  const wysokiTon = D.obraz(D.pacjent({ toneR: 200 }));
  const prawidlowyTon = D.obraz(D.pacjent({ toneR: 150 }));
  const hcPatologiczny = (r) => JSON.stringify(r.vhit && r.vhit.HC || {}).includes('"abnormal":true');
  T('H1a/nasycenie-przy-200', hcPatologiczny(wysokiTon),
    'silnik przestal nasycac aferentu przy tonie 200 Hz — popraw opis granicy przy toneL/toneR');
  T('H1b/150-jeszcze-nie', !hcPatologiczny(prawidlowyTon),
    'ton 150 Hz (faza drazniena Meniere) zaczal psuc vHIT — popraw opis granicy przy toneL/toneR');
  T('H1c/granica-nazwana', gr('toneL') && gr('toneR'), 'ton musi niesc nazwana granice modelu');

  // H2: pelne wypadniecie to w tym silniku gain 0,35, a nie 0.
  const pelne = D.pacjent(NERW_PELNY);
  eq('H2a/pelne-wypadniecie-035', Math.round(pelne.gainR * 100) / 100, 0.35);
  T('H2b/granica-nazwana', gr('gainL') && gr('gainR'), 'wzmocnienie musi niesc nazwana granice modelu');

  // H3: odczyt VEMP jest ASYMETRIA — obustronna utrata jest w opisie badania NIEMA.
  const zdaniaO = (r, wzor) => (r.findings || []).filter(z => wzor.test(z));
  const jednostronnie = D.obraz(D.pacjent({ sacculeR: 0 }));
  const obustronnie = D.obraz(D.pacjent({ sacculeR: 0, sacculeL: 0 }));
  T('H3a/jednostronnie-widac', zdaniaO(jednostronnie, /VEMP/i).length >= 1,
    'jednostronna utrata woreczka musi dac zdanie o VEMP');
  T('H3b/obustronnie-nieme', zdaniaO(obustronnie, /VEMP/i).length === 0,
    'silnik zaczal widziec obustronna utrate VEMP — popraw opis granicy przy sacculeL/R i utricleL/R');
  T('H3c/granica-nazwana', gr('sacculeL') && gr('sacculeR') && gr('utricleL') && gr('utricleR'),
    'otolity musza niesc nazwana granice modelu');

  // H4: izolowany ubytek kanalu PIONOWEGO — lokalizacja obwodowa i „objaw osrodkowy" naraz.
  const pionowy = D.obraz(D.pacjent({ tonePcR: 0, gainPcR: 0.35 }));
  T('H4a/sprzecznosc-istnieje', (pionowy.centralSigns || []).length >= 1 && (pionowy.peripheralSigns || []).length >= 1,
    'silnik przestal wystawiac objaw osrodkowy przy izolowanym ubytku kanalu pionowego — popraw opis granicy');
  T('H4b/granica-nazwana', gr('tonePcL') && gr('tonePcR') && gr('toneAcL') && gr('toneAcR'),
    'kanaly pionowe musza niesc nazwana granice modelu');

  // H5: kazda nazwana granica ma byc W OBU JEZYKACH i mowic, ze dotyczy MODELU.
  for (const k of PARAMETR_IDS) {
    const p = PARAMETRY[k];
    if (!p.granicaPl && !p.granicaEn) continue;
    T(`H5/granica-dwujezyczna/${k}`, !!(p.granicaPl && p.granicaEn), 'granica modelu musi byc w obu jezykach');
    T(`H5b/granica-mowi-o-modelu/${k}`, /GRANICA MODELU|LIMIT OF THE MODEL/i.test(`${p.granicaPl} ${p.granicaEn}`),
      'granica musi byc nazwana granica MODELU, a nie stanem pacjenta');
  }
}

/* ═══════════ I. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 557;
if (bledy.length) {
  console.error(`✗ lab:check — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ lab:check — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli to swiadoma zmiana zakresu, popraw OCZEKIWANE. Jesli nie — ktorys przypadek zniknal.');
  process.exit(1);
}
console.log(`✓ lab:check — ${ok} przypadkow, model Laboratorium zgodny.`);
