/* OTOREPO — wyrocznia CZASU TRWANIA oczopląsu wobec kryteriów Bárány.
 *
 * Dlaczego to jest osobna bramka, a nie linijka w snapshocie: golden PRZYPINA wartości, ale nie
 * wyraża RELACJI. Można przypiąć czas 18,5 s i mieć zieloną wyrocznię, mając jednocześnie na
 * ekranie animację postaci UPORCZYWEJ krótszą od PRZEMIJAJĄCEJ — i dokładnie tak było do
 * 2026-08-01: `tHold: persistent ? 18 : 40` sprawiało, że kupulolitiaza pod chipem
 * „Uporczywy (> 60 s)” zamierała po 18,85 s, a kanalolitiaza pod „Przemijający (< 60 s)”
 * trwała 30,10 s. Kolejność obu czasów była ODWROTNA niż kryteria drukowane nad nimi.
 *
 * Użytkownik (klinicysta) rozstrzygnął, że okno symulacji MA udawać czas kliniczny — więc czas
 * trwania przestaje być parametrem wygody animacji i staje się twierdzeniem, które trzeba bramkować.
 *
 * Kryteria: [H48] von Brevern 2015 (Bárány/ICVD) — kanalolitiaza: czas napadu < 1 min, a oczopląs
 * „typowo < 1 minuty"; kupulolitiaza: utrzymuje się tak długo, jak utrzymywana jest pozycja.
 * Pełna treść kryteriów wraz z przypisami: engine_doc.txt, rozdział „KRYTERIA BPPV".
 * E1 (2026-08-21): do tego etapu ten odnośnik wskazywał sekcję engine_doc, KTÓREJ NIE BYŁO — bramka
 * pilnowała więc zgodności z dokumentem nieistniejącym. Teraz rozdział istnieje i niesie też DWIE
 * JAWNIE NAZWANE ROZBIEŻNOŚCI silnika wobec kryteriów (kanał przedni 61,25 s wobec „< 1 min";
 * geometria testu Roll 10,3° wobec „około 30°"), których ta bramka z założenia NIE ocenia:
 * porównuje pomiar z OBIETNICĄ CHIPA, a nie z liczbą z pracy — i tak ma zostać.
 *
 * Uruchomienie: npm run barany:check
 */
import { engineXi, xiEnvelope, provokeQ, featsByVariant, DIAG, baranyClassify } from '../src/pose/maneuvers.js';
import { Vestibular } from '../src/engine/vestibular.js';

let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };

const PROG = 60;                       // sekundy — próg „< 1 min” / „> 1 min” z kryteriów
const KANALY = ['posterior', 'horizontal', 'anterior'];
const STRONY = ['P', 'L'];

const zmierz = (canal, side, persistent) => {
  const sim = engineXi(canal, side, persistent, provokeQ(canal, side));
  const { tEnd, peak } = xiEnvelope(sim);
  const ost = sim[sim.length - 1];
  return { tEnd, peak, resztka: Math.abs(ost.xi) / peak, okno: ost.t };
};

/* ============ 0. CZEGO APLIKACJA OBIECUJE ============
   Bramki nie znaja juz jednej liczby „60 s" na wszystkie kanaly. Pytaja o zgodnosc POMIARU
   z OBIETNICA, ktora aplikacja wypisuje na chipie — bo to chip czyta klinicysta, i to on moze
   sklamac. Kanal PRZEDNI ma w silniku napad ~61 s (emergentna fizyka, werdykt kliniczny 2026-08-14),
   wiec jego chip mowi „Przemijajacy (≈1 min)", a nie „< 60 s". Gdyby ktos przywrocil tam wspolny
   chip „< 60 s", ta bramka zapali sie NATYCHMIAST — i o to chodzi.
   Obietnicy NIEROZPOZNANEJ nie przepuszczamy: nowy tekst chipa musi tu dostac swoja regule. */
const TEST_KANALU = { posterior: 'dix', horizontal: 'roll', anterior: 'headhang' };
const chipCzasu = (v, canal) => featsByVariant(v, canal)[1];

/* ============ 1. PRZEMIJAJĄCY — czas wyznacza fizyka i zgadza sie z chipem ============ */
for (const canal of KANALY) {
  const obietnica = chipCzasu('canalo', canal);
  const podProgiem = /<\s*60|<\s*1\s*min/.test(obietnica);
  const okoloMinuty = /≈\s*1\s*min|≈\s*60/.test(obietnica);
  T(`PM0/${canal}/chip-rozpoznany`, podProgiem || okoloMinuty,
    `chip czasu „${obietnica}" nie pasuje do zadnej znanej obietnicy — dopisz regule, nie przepuszczaj`);
  for (const side of STRONY) {
    const m = zmierz(canal, side, false);
    T(`PM1/${canal}/${side}/zgodny-z-chipem`,
      podProgiem ? m.tEnd < PROG : (okoloMinuty ? (m.tEnd >= 45 && m.tEnd <= 75) : false),
      `kanalolitiaza trwa ${m.tEnd.toFixed(2)} s, a chip obiecuje „${obietnica}"`);
    // NAJWAŻNIEJSZY przypadek tej sekcji: gdy resztka na końcu okna jest jeszcze znacząca,
    // to okno OBCIĘŁO przebieg i wypisany czas trwania znaczy „długość okna”, a nie „czas zaniku”.
    T(`PM2/${canal}/${side}/okno-nie-obcina`, m.resztka < 0.01,
      `na końcu okna zostało ${(m.resztka * 100).toFixed(1)} % szczytu — okno obcina zanik`);
    T(`PM3/${canal}/${side}/zapas-okna`, m.okno - m.tEnd >= 10,
      `zapas okna ${(m.okno - m.tEnd).toFixed(2)} s < 10 s — zmiana parametru cząstki obetnie zanik po cichu`);
  }
}

/* ============ 2. UPORCZYWY — przekracza próg, a wygasanie musi byc ZAPOWIEDZIANE ============
   Kanal przedni gasnie w tym modelu do ~27 % szczytu, bo deep head-hang slabo obciaza osklepek
   przedni. To NIE jest ukryta usterka — `latNote` tego testu mowi o tym wprost. Bramka wiaze
   wyjatek Z TA NOTA: jesli ktos ja usunie, wraca rygor >95 % i wyrocznia sie zapala. Wyjatek musi
   byc napisany w aplikacji, a nie schowany w wyroczni. */
for (const canal of KANALY) {
  const nota = `${DIAG[TEST_KANALU[canal]].latNote('P', 'cupulo')}`;
  /* Fraza musi mowic o PRZYGASANIU, a nie o slabosci. Pierwsza wersja lapala tez „SŁABY",
     ktore pada w nocie kanalu POZIOMEGO — a ten trzyma 100 % szczytu, wiec bramka zwalniala
     rygor tam, gdzie nic go nie zwalnia. Zmierzone: horizontal 100 %, anterior 26,9 %. */
  const zapowiedzianeGasniecie = /przygasa|appears to fade/i.test(nota);
  for (const side of STRONY) {
    const m = zmierz(canal, side, true);
    T(`UP1/${canal}/${side}/ponad-progiem`, m.tEnd > PROG,
      `kupulolitiaza trwa ${m.tEnd.toFixed(2)} s — chip mówi „> ${PROG} s”`);
    T(`UP2/${canal}/${side}/nie-wygasa`,
      zapowiedzianeGasniecie ? m.resztka < 0.5 : m.resztka > 0.95,
      zapowiedzianeGasniecie
        ? `nota zapowiada slaby przebieg, a zostalo ${(m.resztka * 100).toFixed(1)} % szczytu — wtedy nota klamie`
        : `na końcu okna zostało tylko ${(m.resztka * 100).toFixed(1)} % szczytu, a nic tego nie zapowiada`);
  }
}

/* ============ 3. RELACJA MIĘDZY POSTACIAMI ============
   To jest zarzut w czystej postaci: nie chodzi o żadną konkretną liczbę, tylko o to, że postać
   UPORCZYWA nie może być na ekranie krótsza od PRZEMIJAJĄCEJ. Sprawdzane na każdym kanale
   osobno, bo zaniki różnią się między kanałami. */
for (const canal of KANALY) {
  const p = zmierz(canal, 'P', false), u = zmierz(canal, 'P', true);
  T(`RL1/${canal}/uporczywy-dluzszy`, u.tEnd > p.tEnd,
    `uporczywy ${u.tEnd.toFixed(2)} s NIE JEST dłuższy od przemijającego ${p.tEnd.toFixed(2)} s`);
  /* Prog rozdziela postacie TAM, GDZIE chip go obiecuje. Dla kanalu przedniego obie postacie leza
     powyzej 60 s (napad ~61 s), wiec rozdziela je RELACJA (RL1), a nie prog — i tak tez mowia chipy. */
  const rozdzielaProg = /<\s*60|<\s*1\s*min/.test(chipCzasu('canalo', canal));
  T(`RL2/${canal}/po-wlasciwych-stronach-progu`,
    rozdzielaProg ? (p.tEnd < PROG && u.tEnd > PROG) : (u.tEnd > p.tEnd && u.tEnd > PROG),
    `przemijający ${p.tEnd.toFixed(2)} s i uporczywy ${u.tEnd.toFixed(2)} s wobec progu ${PROG} s (chip: „${chipCzasu('canalo', canal)}")`);
}

/* ============ 4. Okna obserwacji — MIERZONE, nie deklarowane ============
   Stale XI_OKNO_* zniknely: po ocenie II okno siedzi wprost w `engineXi` (55 s przemijajace,
   75 s uporczywe ORAZ kanal przedni — jego napad trwa ~61 s, wiec potrzebuje okna postaci
   uporczywej, zeby zmiescic sie z zapasem). Bramka pyta o to samo co wczesniej, ale na
   ZMIERZONYM tEnd, a nie na stalej obok kodu — czyli o jeden posrednik mniej. */
{
  const t = (canal, persistent) => { const r = xiEnvelope(engineXi(canal, 'P', persistent)); return r ? r.tEnd : NaN; };
  T('OK1/uporczywe-ponad-progiem', t('posterior', true) > PROG && t('horizontal', true) > PROG,
    `postac uporczywa musi przekraczac ${PROG} s — dla xi bez zaniku tEnd JEST oknem`);
  T('OK2/przemijajace-miesci-zanik', t('horizontal', false) > 39.9,
    'okno przemijajace zbyt ciasne wobec najdluzszego zaniku (poziomy ~39,9 s) — obcieloby przebieg');
  T('OK3/okna-rozne', t('posterior', true) > t('posterior', false),
    'okno uporczywe musi byc dluzsze — inaczej wracamy do stanu sprzed naprawy');
}

/* ============ 5. Kontrola skanu ============
   Bramka jest warta tyle, ile jej czułość. Odtwarzamy TU stary parametr (18 s) i wymagamy,
   żeby przynajmniej jedno twierdzenie sekcji 2 i 3 na nim padło. Bez tego cała wyrocznia
   mogłaby przechodzić na przebiegu, którego nie potrafi odróżnić od błędnego. */
{
  const stare = Vestibular.simulateCupulolith({
    canal: 'posterior', side: 'P',
    timeline: [{ q: provokeQ('posterior', 'P'), tTrans: 0.5, tHold: 18 }],
  });
  const { tEnd } = xiEnvelope(stare);
  const przemijajacy = zmierz('posterior', 'P', false);
  T('KS1/stary-parametr-padlby', tEnd < PROG,
    `stare okno 18 s dawało ${tEnd.toFixed(2)} s — kontrola czułości bramki nie zadziałała`);
  T('KS2/stary-parametr-byl-krotszy', tEnd < przemijajacy.tEnd,
    'kontrola: stare okno uporczywe MUSI wychodzić krótsze od przemijającego, inaczej nie ma czego pilnować');
}

/* ============ Wynik ============ */
/* ============ 5. JEDNO TWIERDZENIE O CZASIE, NIE DWA ============
   Chip proby i karta klasyfikacji Barany mowia klinicyscie o TYM SAMYM — czasie trwania i latencji —
   ale do 2026-08-15 mialy OSOBNE literaly. Dla kanalu PRZEDNIEGO rozjechaly sie naprawde: chip
   (poprawiony w V8) mowil „≈1 min", karta nadal „< 1 min", a silnik mierzy 61,25 s, czyli WIECEJ niz
   minute. Obie liczby staly na jednym ekranie. Karta bierze teraz oba pola z `featsByVariant`;
   ta bramka pilnuje, ze nikt nie wpisze ich z powrotem recznie. */
{
  const wiersz = (cls, nazwa) => (cls.crit || []).find(x => new RegExp(nazwa, 'i').test(x[0]));
  for (const canal of KANALY) {
    const cls = baranyClassify(canal, 'canalo', 'P', canal === 'anterior');
    const cz = wiersz(cls, 'Czas trwania|Duration'), lat = wiersz(cls, 'Latencja|Latency');
    if (canal === 'anterior') {
      T(`JT1/${canal}/czas-z-chipa`, cz && cz[1] === featsByVariant('canalo', canal)[1],
        `karta Barany mowi „${cz && cz[1]}", a chip „${featsByVariant('canalo', canal)[1]}" — dwa zrodla jednego twierdzenia`);
      T(`JT2/${canal}/latencja-z-chipa`, lat && lat[1] === featsByVariant('canalo', canal)[0],
        `karta Barany mowi „${lat && lat[1]}", a chip „${featsByVariant('canalo', canal)[0]}"`);
    }
    // KONTROLA CZULOSCI w druga strone: karta NIE MOZE obiecywac „< 1 min" tam, gdzie pomiar to przekracza.
    const m = zmierz(canal, 'P', false);
    T(`JT3/${canal}/karta-nie-klamie`, !(m.tEnd > PROG && /<\s*1\s*min|<\s*60/.test(String(cz && cz[1]))),
      `napad trwa ${m.tEnd.toFixed(2)} s, a karta Barany obiecuje „${cz && cz[1]}"`);
  }
}

const razem = ok + bledy.length;
console.log(`\nOTOREPO — czas trwania oczopląsu wobec kryteriów Bárány`);
console.log(`przypadki     : ${razem}`);
console.log(`próg Bárány   : ${PROG} s (okna obserwacji siedzą w engineXi, nie w osobnych stałych)`);
for (const canal of KANALY) {
  const p = zmierz(canal, 'P', false), u = zmierz(canal, 'P', true);
  console.log(`  ${canal.padEnd(11)} przemijający ${p.tEnd.toFixed(2).padStart(6)} s · uporczywy ${u.tEnd.toFixed(2).padStart(6)} s`);
}
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}

const OCZEKIWANE = 49;   /* 44 + 5: JT1/JT2 (przedni) + JT3 x3 kanaly — jedno zrodlo twierdzenia o czasie */
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — czasy trwania zgodne z kryteriami (${razem} przypadków).`);
