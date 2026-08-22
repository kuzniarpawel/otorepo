/* OTOREPO — wyrocznia kwalifikacji wstępnej („Wywiad", Blok 6).
 *
 * Kryteria odbioru z dokumentu użytkownika są tu sprawdzane jako NIEZMIENNIKI na PEŁNYM
 * iloczynie kartezjańskim odpowiedzi, a nie na kilku ręcznie dobranych przypadkach:
 *   1. „HINTS nie jest proponowany przy krótkich, wyłącznie pozycyjnych napadach"
 *   2. „Przy czerwonej fladze użytkownik otrzymuje komunikat o konieczności pilnej oceny
 *       ZAMIAST pozornego rozpoznania BPPV"
 *   3. „Każda rekomendacja wskazuje, które odpowiedzi do niej doprowadziły"
 * Ręcznie dobrany przypadek udowadnia, że reguła działa dla niego. Przejście po całym iloczynie
 * udowadnia, że NIE ISTNIEJE kombinacja odpowiedzi, która ją łamie — a to zupełnie inna siła
 * twierdzenia przy module, który ma nie dopuścić do niewłaściwego użycia HINTS.
 *
 * Uruchomienie: npm run triage:check
 */
import {
  TRIAGE_QUESTIONS, TRIAGE_IDS, triageQuestion, activeQuestions, nextQuestionId,
  triageComplete, toggleFlaga, czerwoneFlagi, triageResult, sciezkaDozwolona,
} from '../src/app/triage-model.js';

let ok = 0; const bledy = [];
const T = (tag, warunek, opis) => { if (warunek) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

/* ============ 1. Kształt kwestionariusza ============ */
/* D-CZAS (2026-08-21): doszlo PIATE pytanie `odkiedy` (czas od poczatku objawow). Stoi ZARAZ PO
   `przebieg`, bo dotyczy tej samej osi czasu i ma byc widoczne, zanim klinicysta wybierze wyzwalacz. */
eq('KS1/pytania', TRIAGE_IDS, ['przebieg', 'odkiedy', 'wyzwalacz', 'ortostaza', 'oczoplas', 'flagi']);
eq('KS1b/przebieg-osie-ICVD', triageQuestion('przebieg').opcje.map(o => o.v),
  ['napadowe', 'ciagle', 'przewlekle', 'nieznane']);
T('KS1c/CVS-osiagalny', triageResult({ przebieg: 'przewlekle', flagi: ['brak'] }).kategoria === 'CVS',
  'trzeci zespol kardynalny ICVD (CVS) musi miec wlasny wezel, a nie wpadac do pseudoAVS');
T('KS1d/EVS-do-dni', /dni|days/.test(triageQuestion('przebieg').opcje[0].pl + triageQuestion('przebieg').opcje[0].en),
  '[H61] Kaski 2025: napady EVS trwaja SEKUNDY DO DNI — pasmo uciete na minutach zsylalo migrene i Meniere\'a poza wlasny wezel');
T('KS2/dwujezyczne', TRIAGE_QUESTIONS.every(q => q.pl && q.en && q.plHint && q.enHint
  && (q.opcje || []).every(o => o.pl && o.en)), 'każde pytanie i każda opcja muszą mieć PL i EN');
// „Odpowiedź «nie wiem / nie można ocenić» jest zawsze dostępna, gdy ma znaczenie kliniczne."
for (const id of ['przebieg', 'wyzwalacz', 'ortostaza', 'oczoplas'])
  T(`KS3/${id}-niewiem`, triageQuestion(id).opcje.some(o => /nieznane|nieoceniony/.test(o.v)),
    'pytanie rozstrzygające musi mieć wyjście „nie wiem"');
T('KS4/flagi-wielokrotne', triageQuestion('flagi').typ === 'wielokrotny', 'czerwone flagi to wybór wielokrotny');
T('KS5/flagi-bezwarunkowe', typeof triageQuestion('flagi').gdy !== 'function',
  'czerwone flagi MUSZĄ być pytane zawsze — dokument: „widoczne PRZED przejściem do manewru lub HINTS"');
T('KS6/ataksja-jest', triageQuestion('flagi').opcje.some(o => o.v === 'ataksja'),
  'GRACE-3 stawia ataksję chodu najwyżej: każda ataksja = ośrodek');
T('KS7/5D-jest', triageQuestion('flagi').opcje.some(o => /5 D|5 Ds/.test(o.pl + o.en)), 'lista 5 D');
T('KS8/brak-wylaczny', triageQuestion('flagi').opcje.find(o => o.v === 'brak').wylaczna === true,
  '„nie stwierdzono" musi być opcją wyłączną');

/* ============ 2. Przełącznik flag ============ */
eq('FL1/dodaj', toggleFlaga([], 'ataksja'), ['ataksja']);
eq('FL2/odejmij', toggleFlaga(['ataksja'], 'ataksja'), []);
eq('FL3/brak-czysci', toggleFlaga(['ataksja', 'pieciod'], 'brak'), ['brak']);
eq('FL4/flaga-czysci-brak', toggleFlaga(['brak'], 'ataksja'), ['ataksja']);
eq('FL5/brak-toggle', toggleFlaga(['brak'], 'brak'), []);
eq('FL6/null', toggleFlaga(null, 'ataksja'), ['ataksja']);
eq('FL7/czerwone-pomija-brak', czerwoneFlagi({ flagi: ['brak'] }), []);
eq('FL8/czerwone-liczy', czerwoneFlagi({ flagi: ['ataksja', 'bolGlowy'] }), ['ataksja', 'bolGlowy']);

/* ============ 3. Przepływ pytań ============ */
eq('PP1/pierwsze', nextQuestionId({}), 'przebieg');
/* D-CZAS: po 'przebieg' pyta teraz 'odkiedy' — dotyczy tej samej osi czasu, wiec stoi zaraz za nim. */
eq('PP2/napadowe-pyta-o-odkiedy', nextQuestionId({ przebieg: 'napadowe' }), 'odkiedy');
eq('PP2b/napadowe-potem-wyzwalacz', nextQuestionId({ przebieg: 'napadowe', odkiedy: 'ostre' }), 'wyzwalacz');
eq('PP3/ciagle-pyta-o-odkiedy', nextQuestionId({ przebieg: 'ciagle' }), 'odkiedy');
eq('PP3b/ciagle-potem-oczoplas', nextQuestionId({ przebieg: 'ciagle', odkiedy: 'ostre' }), 'oczoplas');
// Pytanie o wyzwalacz NIE MA sensu przy zawrotach ciągłych i odwrotnie — warunkowe znikają.
eq('PP4/ciagle-pomija-wyzwalacz', activeQuestions({ przebieg: 'ciagle' }).map(q => q.id), ['przebieg', 'odkiedy', 'oczoplas', 'flagi']);
eq('PP5/napadowe-pomija-oczoplas', activeQuestions({ przebieg: 'napadowe' }).map(q => q.id), ['przebieg', 'odkiedy', 'wyzwalacz', 'flagi']);
eq('PP6/nieznane-pomija-oba', activeQuestions({ przebieg: 'nieznane' }).map(q => q.id), ['przebieg', 'flagi']);
/* D-ORTO: miedzy 'wyzwalacz' a 'flagi' wchodzi teraz 'ortostaza' — ale TYLKO przy wyzwalaczu
   pozycyjnym albo niejasnym. PP7a pilnuje, ze pytanie sie pojawia; PP7b, ze przy wyzwalaczu
   SAMOISTNYM go NIE MA (chory bez zwiazku z pozycja nie ma czego rozroznaic). */
eq('PP7a/po-wyzwalaczu-ortostaza', nextQuestionId({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny' }), 'ortostaza');
eq('PP7b/samoistny-pomija-ortostaze', nextQuestionId({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'samoistny' }), 'flagi');
eq('PP7/na-koncu-flagi', nextQuestionId({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'tak' }), 'flagi');
T('PP8/komplet', triageComplete({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', ortostaza: 'tak', flagi: ['brak'] }), 'komplet odpowiedzi');
T('PP8b/bez-ortostazy-niekomplet', !triageComplete({ przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', flagi: ['brak'] }),
  'przy wyzwalaczu pozycyjnym komplet WYMAGA odpowiedzi o ortostazie — inaczej fikstury cicho pinowalyby ekran sprzed rozgalezienia');
/* D-CZAS: CVS pomija wyzwalacz I oczoplas — oba pytaja o zespol napadowy albo ostry. */
eq('PP10/przewlekle-pomija-oba', activeQuestions({ przebieg: 'przewlekle' }).map(q => q.id), ['przebieg', 'odkiedy', 'flagi']);
T('PP9/pusta-lista-flag-to-brak-odpowiedzi', !triageComplete({ przebieg: 'nieznane', flagi: [] }),
  'pusta lista flag NIE jest odpowiedzią — „nie stwierdzono" wymaga świadomego kliknięcia');

/* ============ 4. NIEZMIENNIKI na pełnym iloczynie kartezjańskim ============ */
/* D-CZAS: doszly DWIE nowe wartosci `przebieg` ('przewlekle') i CALY nowy wymiar `odkiedy`.
   To nie jest kosmetyka listy: petla nizej buduje iloczyn kartezjanski, wiec pominiecie tu nowego
   wymiaru zostawiloby nowa galaz NIEPRZEORANA przy ZIELONEJ bramce — dokladnie ta pulapka byla
   zapisana w planie jako ryzyko etapu. */
/* D-ORTO: doszedl wymiar `ortostaza`. Ta sama pulapka co przy D-CZAS — pominiecie go tutaj
   zostawiloby nowa galaz NIEPRZEORANA przy ZIELONEJ bramce. */
const WART = {
  przebieg: [undefined, 'napadowe', 'ciagle', 'przewlekle', 'nieznane'],
  odkiedy: [undefined, 'ostre', 'dluzej', 'nieznane'],
  wyzwalacz: [undefined, 'pozycyjny', 'samoistny', 'nieznane'],
  ortostaza: [undefined, 'tak', 'nie', 'nieznane'],
  oczoplas: [undefined, 'obecny', 'brak', 'nieoceniony'],
};
const FLAGI_POJ = ['ataksja', 'pieciod', 'ogniskowe', 'bolGlowy', 'niedoslych'];
const ZESTAWY_FLAG = [undefined, [], ['brak']];
for (let m = 1; m < (1 << FLAGI_POJ.length); m++)
  ZESTAWY_FLAG.push(FLAGI_POJ.filter((_, i) => m & (1 << i)));

const kombinacje = [];
for (const p of WART.przebieg) for (const d of WART.odkiedy) for (const w of WART.wyzwalacz) for (const r of WART.ortostaza) for (const o of WART.oczoplas) for (const f of ZESTAWY_FLAG)
  kombinacje.push({ przebieg: p, odkiedy: d, wyzwalacz: w, ortostaza: r, oczoplas: o, flagi: f });

const zlamane = { hintsPrzyNapadach: [], flagaBezPilnej: [], flagaZeSciezka: [], zlaSciezka: [], bezPowodu: [],
  bezTekstu: [], zlyPowod: [], hintsBezOczoplasu: [], diagPrzyCiagle: [] };
for (const k of kombinacje) {
  const w = triageResult(k);
  const flagi = czerwoneFlagi(k);
  const opis = JSON.stringify(k);

  // KRYTERIUM 1 — HINTS nigdy przy napadach.
  if (k.przebieg === 'napadowe' && w.sciezka === 'hints') zlamane.hintsPrzyNapadach.push(opis);
  // KRYTERIUM 2 — czerwona flaga zawsze wygrywa i nigdy nie prowadzi do ścieżki.
  if (flagi.length && w.kategoria !== 'czerwona') zlamane.flagaBezPilnej.push(opis);
  if (flagi.length && w.sciezka !== null) zlamane.flagaZeSciezka.push(opis);
  // KRYTERIUM 3 — każdy wynik uzasadniony odpowiedziami. Wyjątek: PUSTY kwestionariusz nie jest
  // rekomendacją, tylko stanem wyjściowym — nie ma czego uzasadniać i nie ma tam karty wyniku.
  // Liczy się odpowiedź na pytanie AKTYWNE. Wartość przy pytaniu, które w tym stanie nie jest
  // zadawane (np. „oczopląs" przy nieustalonym przebiegu), nie jest odpowiedzią użytkownika —
  // interfejs nigdy jej nie zbierze, bo pytanie się wtedy nie pokazuje.
  const aktywne = activeQuestions(k).map(q => q.id);
  const cokolwiekOdpowiedziano = aktywne.some(id => id === 'flagi'
    ? (Array.isArray(k.flagi) && k.flagi.length) : !!k[id]);
  if (cokolwiekOdpowiedziano && (!Array.isArray(w.powody) || !w.powody.length)) zlamane.bezPowodu.push(opis);
  for (const p of (w.powody || [])) {
    const q = p && triageQuestion(p.qid);
    if (!p || !q || !(q.opcje || []).some(o => o.v === p.wartosc) || !p.pl || !p.en) zlamane.zlyPowod.push(opis);
  }
  // Kształt wyniku.
  if (![null, 'diag', 'hints'].includes(w.sciezka)) zlamane.zlaSciezka.push(opis);
  if (!w.tytul || !w.tytul.pl || !w.tytul.en || !w.tresc || !w.tresc.pl || !w.tresc.en) zlamane.bezTekstu.push(opis);
  // HINTS wyłącznie przy ciągłych zawrotach Z oczopląsem.
  if (w.sciezka === 'hints' && !(k.przebieg === 'ciagle' && k.oczoplas === 'obecny')) zlamane.hintsBezOczoplasu.push(opis);
  // Próby pozycyjne nie są odpowiedzią na ciągły zespół przedsionkowy.
  if (w.sciezka === 'diag' && k.przebieg === 'ciagle') zlamane.diagPrzyCiagle.push(opis);
}
T('IN1/kryterium-1-HINTS-nie-przy-napadach', !zlamane.hintsPrzyNapadach.length,
  `${zlamane.hintsPrzyNapadach.length} kombinacji, np. ${zlamane.hintsPrzyNapadach[0]}`);
T('IN2/kryterium-2-flaga-daje-pilna-ocene', !zlamane.flagaBezPilnej.length,
  `${zlamane.flagaBezPilnej.length} kombinacji, np. ${zlamane.flagaBezPilnej[0]}`);
T('IN3/kryterium-2-flaga-blokuje-sciezke', !zlamane.flagaZeSciezka.length,
  `${zlamane.flagaZeSciezka.length} kombinacji, np. ${zlamane.flagaZeSciezka[0]}`);
T('IN4/kryterium-3-zawsze-uzasadnione', !zlamane.bezPowodu.length,
  `${zlamane.bezPowodu.length} kombinacji bez uzasadnienia, np. ${zlamane.bezPowodu[0]}`);
T('IN5/uzasadnienie-wskazuje-realne-odpowiedzi', !zlamane.zlyPowod.length,
  `${zlamane.zlyPowod.length} kombinacji, np. ${zlamane.zlyPowod[0]}`);
T('IN6/sciezka-z-dozwolonych', !zlamane.zlaSciezka.length, `${zlamane.zlaSciezka.length} kombinacji`);
T('IN7/zawsze-dwujezyczny-tekst', !zlamane.bezTekstu.length, `${zlamane.bezTekstu.length} kombinacji`);
T('IN8/HINTS-tylko-AVS-z-oczoplasem', !zlamane.hintsBezOczoplasu.length,
  `${zlamane.hintsBezOczoplasu.length} kombinacji, np. ${zlamane.hintsBezOczoplasu[0]}`);
T('IN9/proby-pozycyjne-nie-przy-ciaglych', !zlamane.diagPrzyCiagle.length,
  `${zlamane.diagPrzyCiagle.length} kombinacji, np. ${zlamane.diagPrzyCiagle[0]}`);
/* D-ORTO: 5 * 4 * 4 * 4 * 4 * 34 = 43520 (bylo 10880). Czwarta czworka to nowy wymiar
   `ortostaza` — iloczyn rosnie DOKLADNIE czterokrotnie, bo pytanie ma trzy wartosci plus
   undefined, i zaden inny wymiar sie nie zmienil. */
T('IN10/iloczyn-niepusty', kombinacje.length === 5 * 4 * 4 * 4 * 4 * (3 + 31),
  `iloczyn ma ${kombinacje.length} kombinacji — jeśli spadł, niezmienniki przestały być wyczerpujące`);

/* ============ 5. Konkretne rozstrzygnięcia kliniczne ============ */
const R = (o) => triageResult(o);
{
  // Klasyczny obraz BPPV, bez flag.
  const w = R({ przebieg: 'napadowe', wyzwalacz: 'pozycyjny', flagi: ['brak'] });
  eq('KL1/tEVS', [w.kategoria, w.sciezka, w.pewnosc], ['tEVS', 'diag', 'wysoka']);
  T('KL1b/nie-stawia-rozpoznania', /nie rozpoznanie/.test(w.uwagi.map(u => u.pl).join(' ')),
    'karta ścieżki MUSI powiedzieć wprost, że nie jest rozpoznaniem');
}
{
  // Ten sam obraz BPPV, ale z ataksją chodu — flaga bije komplet cech obwodowych.
  const w = R({ przebieg: 'napadowe', wyzwalacz: 'pozycyjny', flagi: ['ataksja'] });
  eq('KL2/ataksja-bije-BPPV', [w.kategoria, w.sciezka], ['czerwona', null]);
  T('KL2b/mowi-o-osrodku', /OŚRODKOWĄ/.test(w.tresc.pl), 'komunikat musi wskazać przyczynę ośrodkową');
  T('KL2c/bez-CT', /NIE nadaje się|CT is NOT/.test(w.uwagi.map(u => u.pl + u.en).join(' ')),
    'GRACE-3: tomografia NIE nadaje się do wykluczenia udaru tylnego dołu');
  /* D-MRI (2026-08-21): bramka pilnowała LICZBY „48–72", której ŻADEN z 19 dokumentów ICVD nie
     niesie (ciąg „48–72" i „48-72" = 0 trafień w całym korpusie) — czyli mroziła NASZ interwał jako
     gdyby był cytatem. Teraz pilnuje tego, co niesie [H58] Kim 2022: odsetka wyników fałszywie
     ujemnych ORAZ żądania oceny SERYJNEJ. Numer źródła jest częścią asercji — gdyby ktoś wrócił do
     interwału bez pokrycia, bramka zapali się natychmiast. */
  T('KL2d/fałszywie-ujemne-MRI', /12–50 ?%/.test(w.uwagi.map(u => u.pl).join(' ')),
    'trzeba podać odsetek fałszywie ujemnych wczesnych DWI ze źródła (12–50% w pierwszych 48 h)');
  T('KL2e/MRI-ocena-seryjna', /SERYJN/i.test(w.uwagi.map(u => u.pl).join(' ')) && /\[H58\]/.test(w.uwagi.map(u => u.pl).join(' ')),
    '[H58] Kim 2022 żąda oceny SERYJNEJ i NIE podaje odstępu — komunikat musi mówić to, a nie własny interwał');
  T('KL2f/badanie-kliniczne-czulsze', /WYŻSZĄ czułość niż obrazowanie/.test(w.uwagi.map(u => u.pl).join(' ')),
    'druga implikacja tej samej liczby u [H58]: badanie kliniczne ma w fazie ostrej wyższą czułość niż obrazowanie');
}
{
  const w = R({ przebieg: 'ciagle', oczoplas: 'obecny', flagi: ['brak'] });
  eq('KL3/AVS', [w.kategoria, w.sciezka], ['AVS', 'hints']);
  T('KL3b/tylko-przeszkoleni', /przeszkolon/.test(w.uwagi.map(u => u.pl).join(' ')),
    'GRACE-3: HINTS wiarygodny WYŁĄCZNIE u przeszkolonych');
}
{
  const w = R({ przebieg: 'ciagle', oczoplas: 'brak', flagi: ['brak'] });
  eq('KL4/pseudoAVS', [w.kategoria, w.sciezka], ['pseudoAVS', null]);
  T('KL4b/znies-fiksacje', /fiksacj/.test(w.tresc.pl), 'najpierw zniesienie fiksacji, nie HINTS');
}
{
  const w = R({ przebieg: 'napadowe', wyzwalacz: 'samoistny', flagi: ['brak'] });
  eq('KL5/sEVS', [w.kategoria, w.sciezka], ['sEVS', null]);
  T('KL5b/uczciwie-o-modelu', /nie modeluje/.test(w.tresc.pl),
    'silnik nie modeluje migreny przedsionkowej — trzeba to powiedzieć, a nie wpychać w BPPV');
  T('KL5c/wymienia-roznicowe', /migrena|Ménière|TIA/.test(w.tresc.pl), 'wskaż rozpoznania różnicowe');
}
{
  const w = R({ przebieg: 'ciagle', oczoplas: 'nieoceniony', flagi: ['brak'] });
  eq('KL6/nieoceniony', [w.kategoria, w.sciezka, w.pewnosc], ['niepewna', null, 'niska']);
}
{
  const w = R({ przebieg: 'nieznane', flagi: ['brak'] });
  eq('KL7/nieznany-przebieg', [w.kategoria, w.sciezka], ['niepewna', null]);
}
/* D-ORTO KL9 — SEDNO WARIANTU A. Odpowiedz o ortostazie DOKLADA UWAGE i NIE RUSZA klasyfikatora.
   To nie jest ostroznosc, tylko wymog zrodla: §5.4 [H52] Kim 2019 niesie jedyne w calym dokumencie
   „should be performed" i kaze wykonac probe pozycyjna u chorego z zawrotem ortostatycznym NAWET
   gdy jego zawrot nie jest pozycyjny. Gdyby odpowiedz 'nie' sciagala chorego ze sciezki prob
   pozycyjnych, program bylby WPROST sprzeczny z praca. Sprawdzane na obu galeziach, w ktorych
   pytanie w ogole zyje. */
for (const wyz of ['pozycyjny', 'nieznane']) {
  const baza = { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: wyz, flagi: ['brak'] };
  const tak = R({ ...baza, ortostaza: 'tak' }), nie = R({ ...baza, ortostaza: 'nie' });
  eq(`KL9/${wyz}-ortostaza-nie-rusza-sciezki`,
    [tak.kategoria, tak.sciezka, tak.pewnosc], [nie.kategoria, nie.sciezka, nie.pewnosc]);
  T(`KL9b/${wyz}-nie-dokłada-uwage`, nie.uwagi.length === tak.uwagi.length + 1
    && /ortostatyczn|orthostatic/.test(nie.uwagi[nie.uwagi.length - 1].pl + nie.uwagi[nie.uwagi.length - 1].en),
    'odpowiedz „wylacznie przy wstawaniu" ma dolozyc DOKLADNIE JEDNA uwage, i to o ortostazie');
  T(`KL9c/${wyz}-uwaga-zada-proby-mimo-to`, /MIMO TO|ANYWAY/.test(nie.uwagi[nie.uwagi.length - 1].pl + nie.uwagi[nie.uwagi.length - 1].en),
    'uwaga MUSI powiedziec, ze probe pozycyjna wykonuje sie mimo to — inaczej program odradza badanie, ktore zrodlo NAKAZUJE');
}
{
  // Niejasny wyzwalacz: próba pozycyjna jest tania i rozstrzygająca, ale HINTS dalej odpada.
  const w = R({ przebieg: 'napadowe', wyzwalacz: 'nieznane', flagi: ['brak'] });
  eq('KL8/niejasny-wyzwalacz', [w.kategoria, w.sciezka, w.pewnosc], ['niepewna', 'diag', 'niska']);
  T('KL8b/tlumaczy-brak-HINTS', /HINTS nie jest tu proponowany/.test(w.uwagi.map(u => u.pl).join(' ')),
    'trzeba powiedzieć, DLACZEGO nie HINTS, a nie tylko go nie pokazać');
}
{
  // Brak potwierdzenia „nie stwierdzono flag" obniża pewność, choć ścieżka zostaje ta sama.
  const zFlaga = R({ przebieg: 'napadowe', wyzwalacz: 'pozycyjny', flagi: ['brak'] });
  const bez = R({ przebieg: 'napadowe', wyzwalacz: 'pozycyjny' });
  eq('KL9/pewnosc-spada-bez-przegladu-flag', [zFlaga.pewnosc, bez.pewnosc], ['wysoka', 'srednia']);
  eq('KL9b/sciezka-ta-sama', [zFlaga.sciezka, bez.sciezka], ['diag', 'diag']);
}
T('KL10/bramka-sciezki', sciezkaDozwolona({ przebieg: 'ciagle', oczoplas: 'obecny', flagi: ['brak'] }, 'hints')
  && !sciezkaDozwolona({ przebieg: 'napadowe', wyzwalacz: 'pozycyjny', flagi: ['brak'] }, 'hints'),
  'bramka ścieżki musi zgadzać się z wynikiem');

/* ============ 6. Czystość modułu ============ */
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/app/triage-model.js', import.meta.url), 'utf8');
  // Skan po KODZIE, nie po pliku: komentarze wyjaśniają WŁAŚNIE te zakazy, więc surowy skan
  // całego pliku zapalał się na własnym uzasadnieniu. Tripwire, który łapie swój komentarz,
  // uczy wyłączania tripwire'ów.
  const kod = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  T('CZ1/bez-importow', !/^\s*import\s/m.test(kod), 'moduł musi być bez importów (wyrocznia w gołym Node)');
  T('CZ2/bez-dom', !/\b(document|window|localStorage|navigator)\b/.test(kod), 'zero odwołań do DOM');
  T('CZ3/bez-zegara', !/Date\.now|Math\.random|new Date/.test(kod), 'zero źródeł niedeterminizmu');
  T('CZ4/bez-t', !/\bt\(/.test(kod), 'napisy surowe — wywołanie tłumaczenia na poziomie modułu zamraża język');
  T('CZ5/skan-dziala', /\bt\(/.test(src) && !/\bt\(/.test(kod),
    'kontrola samego skanu: wzorzec MUSI występować w komentarzu i znikać po jego usunięciu');
}

/* ============ Wynik ============ */
const razem = ok + bledy.length;
console.log(`\nOTOREPO — wyrocznia kwalifikacji wstępnej (Blok 6)`);
console.log(`przypadki     : ${razem}`);
console.log(`iloczyn odp.  : ${kombinacje.length} kombinacji sprawdzonych niezmiennikami`);
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
/* D-CZAS (2026-08-21): 64 -> 70. SZESC nowych przypadkow po dodaniu piatego pytania `odkiedy`
   i trzeciej wartosci `przebieg` ('przewlekle' = CVS): KS1b (kolejnosc wartosci osi ICVD),
   KS1c (CVS ma WLASNY wezel, a nie wpada do pseudoAVS), KS1d (pasmo EVS siega DNI, nie minut),
   PP2b i PP3b (przeplyw po nowym pytaniu) oraz PP10 (CVS pomija wyzwalacz i oczoplas).
   D-ORTO (2026-08-22, wariant A): ILOCZYN 10880 -> 43520. Doszedl caly wymiar `ortostaza`
   (4 wartosci: tak / nie / nieznane / bez odpowiedzi). Nowe twierdzenia: PP7a (pytanie pojawia
   sie po wyzwalaczu pozycyjnym), PP7b (przy SAMOISTNYM go NIE MA), PP8b (bez odpowiedzi komplet
   NIE jest osiagniety) oraz KL9 (odpowiedz NIE ZMIENIA kategorii, sciezki ani pewnosci —
   dokłada wylacznie uwage; wzorzec pytania `odkiedy`).
   ILOCZYN KOMBINACJI 2176 -> 10880: doszedl caly wymiar `odkiedy` (4 wartosci) i jedna wartosc
   `przebieg`. To bylo ZAPISANE W PLANIE JAKO RYZYKO — piate pytanie dodane bez ruszenia petli
   przeszloby NIEPRZEORANE przy zielonej bramce.
   D-MRI (2026-08-21): 62 -> 64. DWA nowe przypadki, oba w bloku czerwonej flagi: KL2e (ocena SERYJNA
   z numerem [H58] zamiast wlasnego interwalu) i KL2f (druga implikacja tej samej liczby u Kima —
   badanie kliniczne ma w fazie ostrej wyzsza czulosc niz obrazowanie). KL2d ZOSTAJE, ale pilnuje juz
   odsetka ze zrodla (12-50%), a nie liczby "48-72", ktora w calym korpusie ICVD ma 0 trafien. */
const OCZEKIWANE = 80;
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zmieniasz zakres wyroczni: zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — kwalifikacja wstępna zgodna (${razem} przypadków).`);
