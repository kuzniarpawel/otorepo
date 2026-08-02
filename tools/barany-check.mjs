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
 * Kryteria: Bárány Society, diagnostyka BPPV (por. engine_doc.txt) — kanalolitiaza: oczopląs
 * ustępuje zwykle w < 1 min; kupulolitiaza: utrzymuje się tak długo, jak utrzymywana jest pozycja.
 *
 * Uruchomienie: npm run barany:check
 */
import { engineXi, xiEnvelope, provokeQ, XI_OKNO_PRZEMIJAJACY, XI_OKNO_UPORCZYWY } from '../src/pose/maneuvers.js';
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

/* ============ 1. PRZEMIJAJĄCY — czas wyznacza fizyka i mieści się pod progiem ============ */
for (const canal of KANALY) {
  for (const side of STRONY) {
    const m = zmierz(canal, side, false);
    T(`PM1/${canal}/${side}/pod-progiem`, m.tEnd < PROG,
      `kanalolitiaza trwa ${m.tEnd.toFixed(2)} s — chip mówi „< ${PROG} s”`);
    // NAJWAŻNIEJSZY przypadek tej sekcji: gdy resztka na końcu okna jest jeszcze znacząca,
    // to okno OBCIĘŁO przebieg i wypisany czas trwania znaczy „długość okna”, a nie „czas zaniku”.
    T(`PM2/${canal}/${side}/okno-nie-obcina`, m.resztka < 0.01,
      `na końcu okna zostało ${(m.resztka * 100).toFixed(1)} % szczytu — okno obcina zanik`);
    T(`PM3/${canal}/${side}/zapas-okna`, m.okno - m.tEnd >= 10,
      `zapas okna ${(m.okno - m.tEnd).toFixed(2)} s < 10 s — zmiana parametru cząstki obetnie zanik po cichu`);
  }
}

/* ============ 2. UPORCZYWY — nie wygasa i przekracza próg ============ */
for (const canal of KANALY) {
  for (const side of STRONY) {
    const m = zmierz(canal, side, true);
    T(`UP1/${canal}/${side}/ponad-progiem`, m.tEnd > PROG,
      `kupulolitiaza trwa ${m.tEnd.toFixed(2)} s — chip mówi „> ${PROG} s”`);
    T(`UP2/${canal}/${side}/nie-wygasa`, m.resztka > 0.95,
      `na końcu okna zostało tylko ${(m.resztka * 100).toFixed(1)} % szczytu — to nie jest przebieg uporczywy`);
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
  T(`RL2/${canal}/po-wlasciwych-stronach-progu`, p.tEnd < PROG && u.tEnd > PROG,
    `przemijający ${p.tEnd.toFixed(2)} s i uporczywy ${u.tEnd.toFixed(2)} s muszą leżeć po przeciwnych stronach ${PROG} s`);
}

/* ============ 4. Same stałe okna ============ */
T('OK1/uporczywe-okno-ponad-progiem', XI_OKNO_UPORCZYWY > PROG,
  `okno uporczywe ${XI_OKNO_UPORCZYWY} s nie przekracza progu — dla ξ bez zaniku tEnd JEST oknem`);
T('OK2/przemijajace-okno-miesci-zanik', XI_OKNO_PRZEMIJAJACY > 45,
  `okno przemijające ${XI_OKNO_PRZEMIJAJACY} s zbyt ciasne wobec najdłuższego zaniku (poziomy ~39,9 s)`);
T('OK3/okna-rozne', XI_OKNO_UPORCZYWY > XI_OKNO_PRZEMIJAJACY,
  'okno uporczywe musi być dłuższe — inaczej wracamy do stanu sprzed naprawy');

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
const razem = ok + bledy.length;
console.log(`\nOTOREPO — czas trwania oczopląsu wobec kryteriów Bárány`);
console.log(`przypadki     : ${razem}`);
console.log(`okna          : przemijające ${XI_OKNO_PRZEMIJAJACY} s · uporczywe ${XI_OKNO_UPORCZYWY} s · próg ${PROG} s`);
for (const canal of KANALY) {
  const p = zmierz(canal, 'P', false), u = zmierz(canal, 'P', true);
  console.log(`  ${canal.padEnd(11)} przemijający ${p.tEnd.toFixed(2).padStart(6)} s · uporczywy ${u.tEnd.toFixed(2).padStart(6)} s`);
}
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
const OCZEKIWANE = 41;   // 18 (przemijajacy) + 12 (uporczywy) + 6 (relacja) + 3 (stale) + 2 (kontrola skanu)
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — czasy trwania zgodne z kryteriami (${razem} przypadków).`);
