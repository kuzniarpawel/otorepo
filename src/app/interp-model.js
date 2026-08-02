/* OTOREPO — MODEL INTERPRETACJI (Blok 9: obserwacja → kanał, strona, mechanizm).
 *
 * ═══ ZASADA ═══
 * NIE budujemy drugiego zbioru reguł klinicznych — byłby to trzeci opis tej samej wiedzy
 * (po silniku i po baranyClassify) i rozjechałby się przy pierwszej zmianie parametru.
 * Zamiast tego ENUMERUJEMY kandydatury, których model potrafi dowieść, i sprawdzamy, które
 * z nich opisana obserwacja WYKLUCZA. Kandydatura pada, gdy choć jedna opisana cecha
 * ROZSTRZYGAJĄCA jest sprzeczna z predykcją. Bez punktacji, bez procentów, bez rankingu.
 *
 * ═══ ZMIERZONE OGRANICZENIA SILNIKA, KTÓRE TEN MODUŁ MUSI WYPOWIEDZIEĆ ═══
 * dix      — kierunek daje STRONĘ (torsja ±1), ale NIE mechanizm: canalo i cupulo mają
 *            identyczny kierunek {h:0, v:+0.93, t:+1}, różni je tylko strength (1,0 vs 0,6).
 *            Mechanizm wynika WYŁĄCZNIE z dynamiki.
 * roll     — kierunek daje MECHANIZM (geo/apo), asymetria siły daje STRONĘ, w przeciwnych
 *            zwrotach: kanalolitiaza chore ucho SILNIEJ (1,00/0,45), kupulolitiaza SŁABIEJ
 *            (0,27/0,60).
 * bowlean  — (canalo,P) i (cupulo,L) dają IDENTYCZNY wzorzec, a siła jest symetryczna.
 *            Dwuznaczność jest twierdzeniem, nie błędem — zwracamy dwie równorzędne hipotezy.
 * headhang — wszystkie 4 kandydatury mają ten sam kierunek {h:0,v:-1,t:0}. Strona
 *            NIEWYPROWADZALNA; to twierdzenie o MODELU (kanał przedni jako czysty downbeat
 *            to uproszczenie kliniczne — engine_doc.txt), nie porażka użytkownika.
 *
 * Moduł CZYSTY: zero importów, zero DOM, zero `t()`, zero `new Date`/`Math.random`.
 * Wiedza kliniczna WSTRZYKIWANA (deps). Bramka: npm run interp:check.
 */

export const KANDYDATURY_PROBY = {
  dix: { kanaly: ['posterior', 'anterior'] },
  roll: { kanaly: ['horizontal'] },
  bowlean: { kanaly: ['horizontal'] },
  headhang: { kanaly: ['anterior'] },
};

export function kandydatury(proba) {
  const def = KANDYDATURY_PROBY[proba];
  if (!def) return [];
  const out = [];
  for (const canal of def.kanaly) for (const side of ['P', 'L']) for (const variant of ['canalo', 'cupulo']) {
    out.push({ canal, side, variant });
  }
  return out;
}

/* Trzeci werdykt `pozaWzorcami` (poprawka po krytyce). Twarda równość ze wzorcem wykluczała
   WSZYSTKIE kandydatury przy podręcznikowym BPPV, gdy klinicysta rzetelnie odnotował
   `latencja='powyzej5s'` — wartość, której nie ma w ŻADNYM z dwóch wzorców. Wyklucza wyłącznie
   wartość należąca do wzorca PRZECIWNEGO; wartość spoza obu nie wyklucza niczego. */
export const WERDYKT = { zgodne: 'zgodne', rozne: 'rozne', poza: 'pozaWzorcami', brak: 'nieopisane', nieporownywalne: 'nieporownywalne' };

const ZNAK_OPISU = { p1: 1, m1: -1, zero: 0 };
const znakModelu = (x) => (x == null ? null : x > 0.05 ? 1 : x < -0.05 ? -1 : 0);

/* Cechy ROZSTRZYGAJĄCE — tylko one wykluczają. Pola wagi 1-2 (przebieg, warunki,
   pozycjaNeutralna, fiksacja, odwrocenieSiad) wchodzą do uzasadnienia i do flag, nie do
   eliminacji: model ich albo nie przewiduje, albo przewiduje zbyt słabo, by na nich odrzucać. */
export const CECHY_KIERUNKU = ['poziom', 'pion', 'torsja'];
export const CECHY_DYNAMIKI = ['latencja', 'czasTrwania', 'meczliwosc'];

const drugaFaza = (fazy, ta) => fazy.find(f => f !== ta) || fazy[1];

/* Werdykt JEDNEJ cechy wobec JEDNEJ kandydatury. */
export function werdyktCechy(ctx) {
  const { pole, fazaId, obs, kand, proba, deps } = ctx;
  if (obs == null) return WERDYKT.brak;

  if (CECHY_KIERUNKU.includes(pole)) {
    const f = deps.faza(proba, fazaId, kand);
    if (!f) return WERDYKT.nieporownywalne;
    const m = znakModelu(pole === 'poziom' ? f.h : pole === 'pion' ? f.v : f.t);
    const o = ZNAK_OPISU[obs];
    if (m == null || o == null) return WERDYKT.nieporownywalne;
    return o === m ? WERDYKT.zgodne : WERDYKT.rozne;
  }

  if (pole === 'nasilenie') {
    // Tylko roll. Porównujemy ZNAK RÓŻNICY sił między fazą opisywaną a drugą — to relacja,
    // a nie wartość bezwzględna, niesie stronę.
    const fazy = deps.fazyProby(proba) || [];
    if (fazy.length !== 2) return WERDYKT.nieporownywalne;
    const ta = fazaId || fazy[0];
    const a = deps.faza(proba, ta, kand);
    const b = deps.faza(proba, drugaFaza(fazy, ta), kand);
    if (!a || !b) return WERDYKT.nieporownywalne;
    const d = (a.s == null ? 1 : a.s) - (b.s == null ? 1 : b.s);
    const m = Math.abs(d) < 0.02 ? 'porownywalne' : d > 0 ? 'silniejsza' : 'slabsza';
    return obs === m ? WERDYKT.zgodne : WERDYKT.rozne;
  }

  if (CECHY_DYNAMIKI.includes(pole)) {
    const wl = deps.wzorzec(kand.variant);
    const przeciw = deps.wzorzec(kand.variant === 'canalo' ? 'cupulo' : 'canalo');
    if (!wl || !przeciw) return WERDYKT.nieporownywalne;
    if (obs === wl[pole]) return WERDYKT.zgodne;
    if (obs === przeciw[pole]) return WERDYKT.rozne;
    return WERDYKT.poza;                         // wartość spoza OBU wzorców — nie wyklucza
  }
  return WERDYKT.nieporownywalne;
}

export const POWODY_ZGODNOSCI = {
  brakOpisu: { pl: 'Nie opisano jeszcze żadnej cechy rozstrzygającej.', en: 'No decisive feature has been described yet.' },
  sprzecznyZWszystkimi: { pl: 'Opisany obraz nie pasuje do żadnego wzorca, który ten model zna.', en: 'The described picture does not match any pattern this model knows.' },
  wyciszoneKwarantanna: { pl: 'Obraz przestaje pasować do czegokolwiek, gdy uwzględnić cechę oznaczoną jako niewiarygodna.', en: 'The picture stops matching anything once the feature marked as unreliable is taken into account.' },
};

/* GŁÓWNA FUNKCJA. `deps.faza(proba, fazaId, kand)` dostaje CAŁĄ kandydaturę, bo predykcja
   zależy też od KANAŁU: kandydatura kanału przedniego przy Dix-Hallpike nie jest w
   `DIAG.dix.phases` — aplikacja buduje ją osobno przez nysFromGeom.
   `deps.czytaj(rekord, klucz, ufajNiewiarygodnym)` wstrzykiwane, żeby moduł
   nie musiał znać kształtu rekordu ani zasad kwarantanny — te należą do obs-model. */
export function interpretuj(rekord, proba, deps) {
  const kand = kandydatury(proba);
  const fazy = deps.fazyProby(proba) || [];
  const instancje = [];
  for (const f of fazy) for (const p of CECHY_KIERUNKU) instancje.push({ pole: p, fazaId: f, klucz: `${p}#${f}` });
  if (proba === 'roll') instancje.push({ pole: 'nasilenie', fazaId: fazy[0], klucz: 'nasilenie' });
  for (const p of CECHY_DYNAMIKI) instancje.push({ pole: p, fazaId: null, klucz: p });

  const przebieg = (ufaj) => {
    const opisane = instancje.map(i => ({ ...i, obs: deps.czytaj(rekord, i.klucz, ufaj) })).filter(i => i.obs != null);
    const wynik = kand.map(k => {
      let wyklucza = null;
      for (const i of opisane) {
        if (werdyktCechy({ ...i, kand: k, proba, deps }) === WERDYKT.rozne) { wyklucza = { klucz: i.klucz, obs: i.obs }; break; }
      }
      return { ...k, wykluczoneCzym: wyklucza };
    });
    return { opisane, pozostale: wynik.filter(x => !x.wykluczoneCzym), wykluczone: wynik.filter(x => x.wykluczoneCzym) };
  };

  const A = przebieg(false);                     // WNIOSKOWANIE — bez pól kwarantannowanych
  const B = przebieg(true);                      // KONTROLA — z nimi (patrz niżej)

  const brakujace = instancje.filter(i => deps.czytaj(rekord, i.klucz, false) == null).map(i => i.klucz);
  let zgodnosc, powod = null;
  if (!A.opisane.length) { zgodnosc = 'brak'; powod = 'brakOpisu'; }
  else if (!A.pozostale.length) { zgodnosc = 'brak'; powod = 'sprzecznyZWszystkimi'; }
  else if (A.pozostale.length === 1 && !brakujace.length) zgodnosc = 'pelna';
  else zgodnosc = 'czesciowa';

  /* Cecha ROZSTRZYGAJĄCA = ta, która SAMA wyklucza najwięcej kandydatur — liczona osobno dla
     każdej cechy, a nie „ile padło, zanim do niej doszliśmy". */
  let rozstrzygajaca = null;
  for (const i of A.opisane) {
    const ile = kand.filter(k => werdyktCechy({ ...i, kand: k, proba, deps }) === WERDYKT.rozne).length;
    if (ile > 0 && (!rozstrzygajaca || ile > rozstrzygajaca.ileWyklucza)) rozstrzygajaca = { klucz: i.klucz, ileWyklucza: ile };
  }

  const strony = new Set(A.pozostale.map(x => x.side));
  const mechanizmy = new Set(A.pozostale.map(x => x.variant));
  const kanaly = new Set(A.pozostale.map(x => x.canal));

  /* KWARANTANNA NIE MOŻE GASIĆ OSTRZEŻENIA (poprawka po krytyce — ten sam defekt, który
     Blok 8 wyciął przy `antMode`). Jeśli przebieg KONTROLNY, uwzględniający pola oznaczone
     jako niewiarygodne, nie zostawia ani jednej kandydatury, obraz zostaje NIETYPOWY,
     z własnym rozłącznym powodem. */
  const wyciszone = A.pozostale.length > 0 && B.opisane.length > 0 && B.pozostale.length === 0;

  return {
    proba,
    pozostale: A.pozostale, wykluczone: A.wykluczone,
    zgodnosc, powod: (wyciszone && zgodnosc !== 'brak') ? 'wyciszoneKwarantanna' : powod,
    rozstrzygajaca, brakujace,
    stronaWyprowadzalna: A.pozostale.length > 0 && strony.size === 1,
    mechanizmWyprowadzalny: A.pozostale.length > 0 && mechanizmy.size === 1,
    strona: strony.size === 1 ? [...strony][0] : null,
    mechanizm: mechanizmy.size === 1 ? [...mechanizmy][0] : null,
    kanal: kanaly.size === 1 ? [...kanaly][0] : null,
    sprzecznyPoKontroli: wyciszone,
  };
}

export const POWODY_NIETYPOWOSCI = {
  sprzecznyZWszystkimi: { pl: 'opis nie pasuje do żadnego wzorca, który model zna', en: 'the description matches no pattern the model knows' },
  wyciszoneKwarantanna: { pl: 'opis przestaje pasować do czegokolwiek po uwzględnieniu cechy oznaczonej jako niewiarygodna', en: 'the description stops matching anything once the feature marked unreliable is included' },
  dynamikaBezWzorca: { pl: 'opisana dynamika nie układa się w żaden znany wzorzec', en: 'the described dynamics form no known pattern' },
  flagaOsrodkowa: { pl: 'cecha przemawiająca za przyczyną ośrodkową', en: 'a feature arguing for a central cause' },
  oznaczonyOsrodkowy: { pl: 'obraz oznaczony jako ośrodkowy', en: 'the picture is marked as central' },
};

/* NIETYPOWY — liczony po WSZYSTKICH rekordach sesji, nie po bieżącej próbie. Inaczej rada
   „zrób następną próbę" kasowałaby alarm: downbeat opisany w Dix-Hallpike zapala flagę,
   a po przełączeniu na roll ekran nie miałby o nim pamięci.
   Wynik tej funkcji bramkuje blok leczenia NA KAŻDYM ekranie, który woła recommend(). */
export function nietypowy(stan, deps) {
  const powody = [];
  if (stan && stan.diagCentral) powody.push('oznaczonyOsrodkowy');
  for (const proba of (deps.proby || [])) {
    const rek = deps.rekord(proba);
    if (!rek) continue;
    const w = interpretuj(rek, proba, deps);
    if (w.zgodnosc === 'brak' && w.powod === 'sprzecznyZWszystkimi') powody.push('sprzecznyZWszystkimi');
    if (w.sprzecznyPoKontroli) powody.push('wyciszoneKwarantanna');
    const sp = deps.spojnosc(rek);
    if (sp && sp.opisanych >= 3 && !sp.pasujace.length) powody.push('dynamikaBezWzorca');
    const fl = deps.flagi(rek) || [];
    if (fl.some(f => ['f2', 'f3'].includes(f) || (f === 'f1' && proba !== 'headhang'))) powody.push('flagaOsrodkowa');
  }
  const unikalne = [...new Set(powody)];
  return { nietypowy: unikalne.length > 0, powody: unikalne };
}
