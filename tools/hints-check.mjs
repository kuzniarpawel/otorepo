/* OTOREPO — wyrocznia CZYSTEGO MODELU BADANIA HINTS Z KWALIFIKACJĄ (Blok 12). Gołe Node, bez jsdom.
 *
 * Bada twierdzenia o MODELU. Twierdzenia o EKRANIE (kwalifikacja poprzedzająca KAŻDE wejście,
 * duże wybory, osobny ekran wyniku) bada tools/hints-dom.mjs — ta sama para wyroczni, co przy
 * Blokach 9, 10 i 11.
 *
 * NAJWAŻNIEJSZE NIEZMIENNIKI IDĄ PO PEŁNYM ILOCZYNIE ODPOWIEDZI (6 składowych, wraz z „jeszcze nie
 * odpowiedziano” = 14 400 stanów badania). Przypadek dowodzi, że reguła działa dla niego; iloczyn
 * dowodzi, że NIE ISTNIEJE kombinacja, która ją łamie — a właśnie kombinacja jest tu ryzykiem,
 * bo kryterium odbioru nr 2 („nie można ocenić” nie jest wynikiem prawidłowym) da się złamać
 * jedną nieoczywistą parą odpowiedzi, a nie pojedynczą odpowiedzią.
 *
 * Uruchomienie: npm run hints:check
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  POWODY_POMINIECIA, POMINIECIE_IDS, STANY_KWALIFIKACJI, PRZESZKOLENIE,
  kwalifikacjaHints, wolnoBadac,
  ELEMENTY, ELEMENT_IDS, TRZON_IDS, elementHints, opcjaHints,
  POWODY_NIEWIARYGODNOSCI_HINTS, POWOD_NIEWIAR_IDS,
  SPRZEZENIA, wagaOdpowiedzi,
  odpowiedziHints, nastepnyElement, badanieKompletne, postepBadania,
  WNIOSKI, WNIOSEK_IDS, OSTRZEZENIE, ZASTRZEZENIA, podsumowanieHints,
  POLA_WPISU_HINTS, wpisHints, bezDanychOsobowychHints,
} from '../src/app/hints-model.js';
import { hintsDeps } from '../src/app/hints-deps.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let ok = 0; const bledy = [];
const T = (tag, w, opis) => { if (w) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

const D = hintsDeps();

/* Stany kwalifikacji wstępnej, których używamy wszędzie niżej. Nazwy odpowiadają taksonomii
   czas-i-wyzwalacze z GRACE-3 [H24] — tej samej, którą koduje triage-model.js. */
const TRIAGE = {
  pusty: {},
  niepelny: { przebieg: 'ciagle' },                                        // bez oczopląsu i bez flag
  /* D-CZAS (2026-08-21): doszlo piate pytanie kwalifikacji — o CZAS OD POCZATKU objawow — wiec
     dawne komplety odpowiedzi PRZESTALY byc kompletne, a kwalifikacja HINTS czyta kompletnosc
     triage'u. Bramka zlapala to OSMIOMA bledami naraz i mialy racje: to nie jest zmiana kosmetyczna,
     tylko realne nastepstwo dolozenia pytania wymaganego.
     Fikstury dostaja odpowiedz tam, gdzie pytanie JEST zadawane (przebieg ustalony i rozny od
     "nieznane"). Trzy zostaja bez niej CELOWO: "pusty" i "niepelny" maja byc niekompletne z
     zalozenia, a "nieznany" tego pytania w ogole nie dostaje. */
  avs: { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'obecny', flagi: ['brak'] },
  pseudoAVS: { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'brak', flagi: ['brak'] },
  oczoplasNieoceniony: { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'nieoceniony', flagi: ['brak'] },
  tEVS: { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'pozycyjny', flagi: ['brak'] },
  sEVS: { przebieg: 'napadowe', odkiedy: 'ostre', wyzwalacz: 'samoistny', flagi: ['brak'] },
  nieznany: { przebieg: 'nieznane', flagi: ['brak'] },
  czerwonaAtaksja: { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'obecny', flagi: ['ataksja'] },
  czerwonaPiecD: { przebieg: 'ciagle', odkiedy: 'ostre', oczoplas: 'obecny', flagi: ['pieciod'] },
};
const TRIAGE_IDS = Object.keys(TRIAGE);
const PRZESZK = [null, 'tak', 'nie'];
const POMIN = [null, ...POMINIECIE_IDS];

const stanK = (triageId, pominiecie, przeszkolenie) => ({
  triage: TRIAGE[triageId], hintsPominiecie: pominiecie, hintsPrzeszkolenie: przeszkolenie,
});

/* ═══════════ A. KRYTERIUM ODBIORU NR 1 — BRAMKA WEJŚCIA ═══════════
   „Nie można przejść do HINTS bez potwierdzenia właściwego obrazu klinicznego lub świadomego
   pominięcia kwalifikacji.”

   ZMIERZONE PRZED ZMIANĄ (tools/… pomiar-b12): siedem z siedmiu dróg wejścia do modułu HINTS
   wchodziło przy PUSTEJ kwalifikacji, a jedyna istniejąca bramka (`triageGo`) leżała na ścieżce,
   której żadna z nich nie dotykała. Bramka jest więc NOWA, a nie „wzmocniona”. */
{
  let zle = [], wolnoInaczej = [], niezgodne = [];
  for (const t of TRIAGE_IDS) for (const p of POMIN) for (const s of PRZESZK) {
    const st = stanK(t, p, s);
    const k = kwalifikacjaHints(st, D);
    // A1: `wolno` jest funkcją WYŁĄCZNIE statusu — nic innego nie ma prawa otwierać modułu.
    if (k.wolno !== (k.status === 'potwierdzona' || k.status === 'pominieta')) zle.push(`${t}/${p}/${s}`);
    // A2: bez świadomego pominięcia wejście istnieje TYLKO przy obrazie AVS.
    if (!p && k.wolno !== (D.triageResult(TRIAGE[t]).sciezka === 'hints' && D.triageComplete(TRIAGE[t]))) wolnoInaczej.push(`${t}/${s}`);
    // A10: bramka publiczna i model mówią to samo.
    if (wolnoBadac(st, D).wolno !== k.wolno) niezgodne.push(`${t}/${p}/${s}`);
  }
  T('A1/wolno-tylko-dwa-statusy', !zle.length, `stany łamiące regułę: ${zle.slice(0, 3)}`);
  T('A2/bez-pominiecia-tylko-AVS', !wolnoInaczej.length, `stany wchodzące bez AVS i bez pominięcia: ${wolnoInaczej.slice(0, 3)}`);
  T('A10/bramka-zgodna-z-modelem', !niezgodne.length, `rozjazd wolnoBadac vs kwalifikacjaHints: ${niezgodne.slice(0, 3)}`);
}
eq('A3/pominiecie-zawsze-wpuszcza', POMINIECIE_IDS.map(p => kwalifikacjaHints(stanK('tEVS', p, null), D).status),
  POMINIECIE_IDS.map(() => 'pominieta'));
eq('A4a/pusty-triage-nie-wpuszcza', kwalifikacjaHints(stanK('pusty', null, 'tak'), D).status, 'brak');
eq('A4b/pusty-triage-wolno', kwalifikacjaHints(stanK('pusty', null, 'tak'), D).wolno, false);
eq('A4c/niepelny-triage', kwalifikacjaHints(stanK('niepelny', null, 'tak'), D).status, 'brak');
eq('A5/AVS-potwierdza', kwalifikacjaHints(stanK('avs', null, 'tak'), D).status, 'potwierdzona');
eq('A5b/AVS-wolno', kwalifikacjaHints(stanK('avs', null, 'tak'), D).wolno, true);
// KONTROLE CZUŁOŚCI — obrazy, które MUSZĄ zostać zatrzymane.
eq('A6/czerwona-flaga-odradza', kwalifikacjaHints(stanK('czerwonaAtaksja', null, 'tak'), D).status, 'odradzana');
eq('A6b/czerwona-flaga-widoczna', kwalifikacjaHints(stanK('czerwonaAtaksja', null, 'tak'), D).czerwona, true);
eq('A7/BPPV-odradza', kwalifikacjaHints(stanK('tEVS', null, 'tak'), D).status, 'odradzana');
eq('A7b/pseudoAVS-odradza', kwalifikacjaHints(stanK('pseudoAVS', null, 'tak'), D).status, 'odradzana');
eq('A7c/sEVS-odradza', kwalifikacjaHints(stanK('sEVS', null, 'tak'), D).status, 'odradzana');
eq('A7d/nieznany-przebieg-odradza', kwalifikacjaHints(stanK('nieznany', null, 'tak'), D).status, 'odradzana');
eq('A7e/oczoplas-nieoceniony-odradza', kwalifikacjaHints(stanK('oczoplasNieoceniony', null, 'tak'), D).status, 'odradzana');
// A8: pokaz i symulacja NIE są zapisem badania pacjenta — wynik ma to napisać.
eq('A8a/nauka-nie-jest-badaniem', kwalifikacjaHints(stanK('avs', 'nauka', 'tak'), D).badaniePacjenta, false);
eq('A8b/symulacja-nie-jest-badaniem', kwalifikacjaHints(stanK('avs', 'symulacja', 'tak'), D).badaniePacjenta, false);
eq('A8c/poza-aplikacja-jest-badaniem', kwalifikacjaHints(stanK('avs', 'pozaAplikacja', 'tak'), D).badaniePacjenta, true);
eq('A8d/mimo-odradzania-jest-badaniem', kwalifikacjaHints(stanK('tEVS', 'mimoOdradzania', 'tak'), D).badaniePacjenta, true);
// A9: powód spoza słownika NIE jest pominięciem — inaczej dowolny napis otwierałby moduł.
eq('A9/powod-spoza-slownika-ignorowany', kwalifikacjaHints({ triage: TRIAGE.tEVS, hintsPominiecie: 'bo tak' }, D).status, 'odradzana');
eq('A9b/przeszkolenie-spoza-slownika', kwalifikacjaHints({ triage: TRIAGE.avs, hintsPrzeszkolenie: 'chyba' }, D).przeszkolenie, null);
// A11: pominięcie zapisane jest CZYTELNE — wynik musi móc powiedzieć, które.
eq('A11/pominiecie-zapamietane', kwalifikacjaHints(stanK('avs', 'nauka', null), D).pominiecie, 'nauka');
// A12: każdy stan kwalifikacji ma opis w obu językach (ekran nie ma prawa pokazać pustki).
T('A12/stany-opisane', Object.values(STANY_KWALIFIKACJI).every(s => s.pl && s.en && s.opisPl && s.opisEn),
  'każdy stan kwalifikacji musi mieć nazwę i opis w obu językach');
T('A13/pominiecia-opisane', Object.values(POWODY_POMINIECIA).every(p => p.pl && p.en && typeof p.badaniePacjenta === 'boolean'),
  'każdy powód pominięcia musi mieć napis w obu językach i deklarację, czy to badanie pacjenta');
T('A14/przeszkolenie-opisane', Object.values(PRZESZKOLENIE).every(p => p.pl && p.en), 'obie odpowiedzi o przeszkoleniu opisane');

/* ═══════════ B. STRUKTURA SKŁADOWYCH ═══════════
   Dokument wymienia sześć elementów z nazwy. Bramka trzyma ten skład, bo „dołożymy słuch później”
   jest dokładnie tym, co odróżnia HINTS od HINTS+. */
eq('B1/szesc-skladowych', ELEMENT_IDS, ['hit', 'oczoplas', 'skew', 'sluch', 'chod', 'wiarygodnosc']);
eq('B6/trzon-to-HINTS', TRZON_IDS, ['hit', 'oczoplas', 'skew']);
{
  let brakNieocenione = [], zleWagi = [], duplikaty = [], brakOpisow = [], jednakoweJezyki = [];
  const WAGI = ['obwod', 'alarm', 'neutralny', 'nieinformatywny', 'nieoceniony'];
  for (const el of ELEMENTY) {
    const n = el.opcje.filter(o => o.waga === 'nieoceniony');
    if (n.length !== 1 || n[0].v !== 'nieocenione') brakNieocenione.push(el.id);
    if (el.opcje.some(o => !WAGI.includes(o.waga))) zleWagi.push(el.id);
    const v = el.opcje.map(o => o.v);
    if (new Set(v).size !== v.length) duplikaty.push(el.id);
    if (!(el.pl && el.en && el.instrukcjaPl && el.instrukcjaEn && el.znaczeniePl && el.znaczenieEn && el.pulapkaPl && el.pulapkaEn)) brakOpisow.push(el.id);
    if (el.pl === el.en || el.instrukcjaPl === el.instrukcjaEn || el.znaczeniePl === el.znaczenieEn) jednakoweJezyki.push(el.id);
    if (el.opcje.some(o => !o.pl || !o.en || o.pl === o.en)) jednakoweJezyki.push(el.id + '/opcje');
  }
  T('B2/jedno-nie-mozna-ocenic', !brakNieocenione.length, `składowe bez dokładnie jednej opcji „nie można ocenić”: ${brakNieocenione}`);
  T('B3/wagi-ze-slownika', !zleWagi.length, `składowe z wagą spoza słownika: ${zleWagi}`);
  T('B4/identyfikatory-unikalne', !duplikaty.length, `składowe z powtórzonym identyfikatorem opcji: ${duplikaty}`);
  T('B5/instrukcja-znaczenie-pulapka', !brakOpisow.length, `dokument wymaga instrukcji i wyjaśnienia znaczenia dla każdej składowej; brakuje: ${brakOpisow}`);
  T('B5b/oba-jezyki-rozne', !jednakoweJezyki.length, `napis nieprzetłumaczony (pl === en): ${jednakoweJezyki}`);
  // Trzon musi mieć CO NAJMNIEJ jedną drogę w obwód i jedną w alarm — inaczej składowa nie różnicuje.
  const bezObu = TRZON_IDS.filter(id => {
    const o = elementHints(id).opcje;
    return !o.some(x => x.waga === 'obwod') || !o.some(x => x.waga === 'alarm');
  });
  T('B6b/trzon-rozniczkuje', !bezObu.length, `składowa trzonu bez opcji obwodowej albo bez alarmowej: ${bezObu}`);
}
/* B7: ŚWIADOME ODSTĘPSTWO OD DOKUMENTU, zamienione w zapadkę. Dokument opisuje wybory jako
   „prawidłowy / nieprawidłowy / nie można ocenić”. Dwóch pierwszych napisów w HINTS użyć nie wolno,
   bo PRAWIDŁOWA próba pchnięcia głową w ostrym zespole przedsionkowym jest ustaleniem GROŹNYM.
   Bramka pilnuje, żeby nikt tego „nie poprawił” z powrotem do dosłownego brzmienia dokumentu. */
{
  const ZAKAZANE = /^(prawidłow|nieprawidłow|normal|abnormal)/i;
  const zle = [];
  for (const el of ELEMENTY) for (const o of el.opcje) if (ZAKAZANE.test(o.pl) || ZAKAZANE.test(o.en)) zle.push(`${el.id}/${o.v}`);
  T('B7/opcje-opisuja-obserwacje', !zle.length, `opcja nazwana oceną zamiast obserwacją: ${zle}`);
  T('B7b/czulosc-wzorca', ZAKAZANE.test('Prawidłowy') && ZAKAZANE.test('Abnormal — saccade'), 'kontrola: wzorzec musi trafiać w zakazane napisy');
  T('B7c/czulosc-nie-lapie', !ZAKAZANE.test('Bez sakady — oczy zostają na celu'), 'kontrola: opis obserwacji nie jest oceną');
}

/* ═══════════ C. PRZEBIEG KROK PO KROKU ═══════════ */
{
  const s = { hintsBadanie: {} };
  eq('C1/pierwszy-element', nastepnyElement(s), 'hit');
  eq('C2/brak-postepu', postepBadania(s), { zrobione: 0, wszystkich: 6, rozpoczete: false });
  eq('C3/niekompletne', badanieKompletne(s), false);
  const pelne = { hintsBadanie: { hit: 'sakadaL', oczoplas: 'jednokierunkowy', skew: 'brakOdchylenia', sluch: 'symetryczny', chod: 'chodziBezPodparcia', wiarygodnosc: 'wiarygodne' } };
  eq('C4/kompletne', badanieKompletne(pelne), true);
  eq('C5/brak-nastepnego', nastepnyElement(pelne), null);
  eq('C6/postep-pelny', postepBadania(pelne).zrobione, 6);
  // Wartość spoza słownika NIE jest odpowiedzią — inaczej dowolny napis „wypełniałby” składową.
  eq('C7/wartosc-spoza-slownika-odrzucona', odpowiedziHints({ hintsBadanie: { hit: 'cokolwiek' } }).hit, null);
  eq('C7b/i-nie-liczy-sie-do-postepu', postepBadania({ hintsBadanie: { hit: 'cokolwiek' } }).zrobione, 0);
}

/* ═══════════ D. PEŁNY ILOCZYN — KRYTERIA ODBIORU NR 2 I NR 3 ═══════════
   Sześć składowych, każda z opcjami + „jeszcze nie odpowiedziano” = 6·6·4·5·5·4 = 14 400 stanów.
   Zliczamy naruszenia, a nie przypadki — jedna bramka to jedno twierdzenie o CAŁYM iloczynie. */
const WARTOSCI = ELEMENT_IDS.map(id => [null, ...elementHints(id).opcje.map(o => o.v)]);
function* iloczyn() {
  const idx = new Array(ELEMENT_IDS.length).fill(0);
  for (;;) {
    const b = {};
    ELEMENT_IDS.forEach((id, i) => { if (WARTOSCI[i][idx[i]] !== null) b[id] = WARTOSCI[i][idx[i]]; });
    yield b;
    let i = ELEMENT_IDS.length - 1;
    while (i >= 0 && ++idx[i] >= WARTOSCI[i].length) { idx[i] = 0; i--; }
    if (i < 0) return;
  }
}
{
  let n = 0;
  const N = { k2a: [], k2b: [], k2c: [], k2d: [], k3a: [], k3b: [], k3c: [], sakadaObu: [], hitBez: [], alarmMimo: [], wnioskiSpoza: [] };
  const widziane = { wnioski: new Set(), zastrzezenia: new Set() };
  for (const b of iloczyn()) {
    n++;
    const st = { hintsBadanie: b, triage: TRIAGE.avs, hintsPrzeszkolenie: 'tak', hintsPowodNiewiar: 'pacjentNiewspolpracujacy' };
    const p = podsumowanieHints(st, D);
    const klucz = JSON.stringify(b);
    widziane.wnioski.add(p.wniosek);
    p.zastrzezenia.forEach(z => widziane.zastrzezenia.add(z.id));

    // K2a — „nie można ocenić” NIGDY nie wspiera obwodu.
    if (p.wspierajaObwod.some(x => x.wartosc === 'nieocenione')) N.k2a.push(klucz);
    // K2b — wynik uspokajający wymaga KOMPLETNEGO trzonu.
    if (p.wniosek === 'obwodowy' && !p.trzonKompletny) N.k2b.push(klucz);
    // K2c — nieoceniona składowa trzonu wyklucza KAŻDY wniosek inny niż alarm albo „niepełne”.
    const trzonNieoceniony = TRZON_IDS.some(id => !b[id] || b[id] === 'nieocenione');
    if (trzonNieoceniony && !['alarm', 'niepelne', 'niewykonane', 'nieinformatywne'].includes(p.wniosek)) N.k2c.push(klucz + ' → ' + p.wniosek);
    // K2d — lista nieocenionych jest DOKŁADNIE tym, co użytkownik tak zaznaczył (ekran nie może przemilczeć).
    const zaznaczoneNieocenione = ELEMENT_IDS.filter(id => b[id] === 'nieocenione');
    if (JSON.stringify(p.nieocenione.map(x => x.element)) !== JSON.stringify(zaznaczoneNieocenione)) N.k2d.push(klucz);

    // K3a — ostrzeżenie istnieje WTEDY I TYLKO WTEDY, gdy są cechy alarmowe (równoważność w obie strony).
    if (!!p.ostrzezenie !== (p.cechyAlarmowe.length > 0)) N.k3a.push(klucz);
    // K3b — cecha alarmowa wymusza wniosek „alarm”, cokolwiek innego zaznaczono.
    if (p.cechyAlarmowe.length && p.wniosek !== 'alarm') N.k3b.push(klucz);
    // K3c — ostrzeżenie wymienia DOKŁADNIE te składowe, które są alarmowe.
    if (p.ostrzezenie && JSON.stringify(p.ostrzezenie.cechy) !== JSON.stringify(p.cechyAlarmowe.map(x => x.element))) N.k3c.push(klucz);

    // Sprzężenia.
    if (b.hit === 'sakadaObu' && p.wspierajaObwod.some(x => x.element === 'hit')) N.sakadaObu.push(klucz);
    if (b.hit === 'brakSakady' && !['jednokierunkowy', 'zmiennyKierunkowo', 'pionowyLubSkretny'].includes(b.oczoplas)
        && p.cechyAlarmowe.some(x => x.element === 'hit')) N.hitBez.push(klucz);
    // ASYMETRIA: niewiarygodność nie kasuje cechy alarmowej.
    if (b.wiarygodnosc === 'niewiarygodne' && p.cechyAlarmowe.length && p.wniosek !== 'alarm') N.alarmMimo.push(klucz);
    if (!WNIOSEK_IDS.includes(p.wniosek)) N.wnioskiSpoza.push(klucz);
  }
  eq('D0/rozmiar-iloczynu', n, 14400);
  T('D1/K2a-nieocenione-nie-wspiera', !N.k2a.length, `stany, w których „nie można ocenić” trafiło do wspierających obwód: ${N.k2a.slice(0, 2)}`);
  T('D2/K2b-uspokojenie-wymaga-trzonu', !N.k2b.length, `wynik obwodowy przy niekompletnym trzonie: ${N.k2b.slice(0, 2)}`);
  T('D3/K2c-nieoceniony-trzon-blokuje', !N.k2c.length, `nieoceniona składowa trzonu dała wniosek inny niż dozwolone: ${N.k2c.slice(0, 2)}`);
  T('D4/K2d-lista-nieocenionych', !N.k2d.length, `lista nieocenionych rozjechała się z zaznaczeniami: ${N.k2d.slice(0, 2)}`);
  T('D5/K3a-ostrzezenie-rownowazne', !N.k3a.length, `ostrzeżenie bez cech alarmowych albo cechy bez ostrzeżenia: ${N.k3a.slice(0, 2)}`);
  T('D6/K3b-alarm-wymusza-wniosek', !N.k3b.length, `cecha alarmowa bez wniosku „alarm”: ${N.k3b.slice(0, 2)}`);
  T('D7/K3c-ostrzezenie-wymienia-cechy', !N.k3c.length, `ostrzeżenie wymienia inne składowe niż alarmowe: ${N.k3c.slice(0, 2)}`);
  T('D8/sakady-obustronne-nie-wspieraja', !N.sakadaObu.length, `sakady po obu stronach policzone jako wsparcie obwodu: ${N.sakadaObu.slice(0, 2)}`);
  T('D9/HIT-bez-oczoplasu-nie-alarmuje', !N.hitBez.length, `prawidłowy HIT bez oczopląsu policzony jako cecha alarmowa: ${N.hitBez.slice(0, 2)}`);
  T('D10/niewiarygodnosc-nie-kasuje-alarmu', !N.alarmMimo.length, `badanie niewiarygodne zdjęło cechę alarmową: ${N.alarmMimo.slice(0, 2)}`);
  T('D11/wnioski-ze-slownika', !N.wnioskiSpoza.length, `wniosek spoza słownika: ${N.wnioskiSpoza.slice(0, 2)}`);
  // Martwy wniosek to reguła, której nikt nigdy nie zobaczy — bramka wymusza osiągalność KAŻDEGO.
  const nieosiagalne = WNIOSEK_IDS.filter(w => !widziane.wnioski.has(w));
  T('D12/wnioski-osiagalne', !nieosiagalne.length, `wniosek nieosiągalny na całym iloczynie: ${nieosiagalne}`);
}

/* ═══════════ E. SPRZĘŻENIA — PRZYPADKI Z NAZWY ═══════════
   Iloczyn wyżej dowodzi, że reguła nie ma dziury. Te przypadki mówią, JAK brzmi, i dają kontrolę
   czułości: gdyby sprzężenie usunąć, iloczyn D9 wciąż by przeszedł (bo alarm zniknąłby wszędzie),
   a te trzy się zawalą. */
const stanB = (b, extra = {}) => ({ hintsBadanie: b, triage: TRIAGE.avs, hintsPrzeszkolenie: 'tak', ...extra });
const OBWOD_PELNY = { hit: 'sakadaP', oczoplas: 'jednokierunkowy', skew: 'brakOdchylenia', sluch: 'symetryczny', chod: 'chodziBezPodparcia', wiarygodnosc: 'wiarygodne' };
{
  const zOczoplasem = podsumowanieHints(stanB({ hit: 'brakSakady', oczoplas: 'jednokierunkowy' }), D);
  eq('E1/HIT-prawidlowy-przy-oczoplasie-alarmuje', zOczoplasem.cechyAlarmowe.map(x => x.element), ['hit']);
  eq('E1b/i-daje-wniosek-alarm', zOczoplasem.wniosek, 'alarm');
  const bezOczoplasu = podsumowanieHints(stanB({ hit: 'brakSakady', oczoplas: 'bezOczoplasu' }), D);
  eq('E2/HIT-prawidlowy-bez-oczoplasu-nie-alarmuje', bezOczoplasu.cechyAlarmowe.length, 0);
  eq('E2b/i-jest-nazwany-nieinformatywnym', bezOczoplasu.nieinformatywne.map(x => x.element).sort(), ['hit', 'oczoplas']);
  // `?.` NIE jest ozdobnikiem: pod mutacją znoszącą sprzężenie ta pozycja znika i bramka MA
  // upaść z komunikatem, a nie wywalić wyrocznię wyjątkiem (lekcja z PP2/PP4 w Bloku 11).
  eq('E2c/z-podanym-powodem', bezOczoplasu.nieinformatywne.find(x => x.element === 'hit')?.sprzezenie, 'hitBezOczoplasu');
  eq('E2d/wniosek-nieinformatywne', bezOczoplasu.wniosek, 'nieinformatywne');
  eq('E3/HIT-prawidlowy-przy-nieocenionym-oczoplasie', podsumowanieHints(stanB({ hit: 'brakSakady', oczoplas: 'nieocenione' }), D).cechyAlarmowe.length, 0);
  eq('E3b/ale-wniosek-niepelny', podsumowanieHints(stanB({ hit: 'brakSakady', oczoplas: 'nieocenione', skew: 'brakOdchylenia' }), D).wniosek, 'niepelne');
  eq('E4/sakady-obustronne-nieinformatywne', podsumowanieHints(stanB({ ...OBWOD_PELNY, hit: 'sakadaObu' }), D).wniosek, 'nierozstrzygniete');
  eq('E4b/z-powodem', podsumowanieHints(stanB({ ...OBWOD_PELNY, hit: 'sakadaObu' }), D).nieinformatywne.find(x => x.element === 'hit')?.sprzezenie, 'hitObustronny');
  eq('E5/czulosc-jednostronna-sakada', podsumowanieHints(stanB(OBWOD_PELNY), D).wniosek, 'obwodowy');
  T('E6/sprzezenia-opisane', Object.values(SPRZEZENIA).every(s => s.pl && s.en && s.pl !== s.en), 'oba sprzężenia opisane w obu językach');
  // wagaOdpowiedzi wywołane wprost — ekran czyta tę samą funkcję, co podsumowanie.
  eq('E7/waga-wprost', wagaOdpowiedzi('hit', { hit: 'brakSakady', oczoplas: 'bezOczoplasu' }),
    { waga: 'nieinformatywny', sprzezenie: 'hitBezOczoplasu' });
  eq('E7b/waga-bez-odpowiedzi', wagaOdpowiedzi('hit', {}), { waga: null, sprzezenie: null });
}

/* ═══════════ F. WNIOSKI — KOLEJNOŚĆ I ASYMETRIA ═══════════ */
{
  eq('F1/pelny-obwod', podsumowanieHints(stanB(OBWOD_PELNY), D).wniosek, 'obwodowy');
  eq('F1b/bez-zastrzezen', podsumowanieHints(stanB(OBWOD_PELNY), D).zastrzezenia.length, 0);
  eq('F2/niewiarygodne-odbiera-uspokojenie',
    podsumowanieHints(stanB({ ...OBWOD_PELNY, wiarygodnosc: 'niewiarygodne' }, { hintsPowodNiewiar: 'patologiaOczu' }), D).wniosek, 'niepewne');
  eq('F3/brak-przeszkolenia-odbiera', podsumowanieHints({ hintsBadanie: OBWOD_PELNY, triage: TRIAGE.avs, hintsPrzeszkolenie: 'nie' }, D).wniosek, 'niepewne');
  eq('F3b/przeszkolenie-niepodane-odbiera', podsumowanieHints({ hintsBadanie: OBWOD_PELNY, triage: TRIAGE.avs }, D).wniosek, 'niepewne');
  eq('F4/pominieta-kwalifikacja-odbiera',
    podsumowanieHints({ hintsBadanie: OBWOD_PELNY, triage: TRIAGE.avs, hintsPrzeszkolenie: 'tak', hintsPominiecie: 'nauka' }, D).wniosek, 'niepewne');
  // ASYMETRIA: to samo zastrzeżenie przy cesze alarmowej NIE zmienia wniosku.
  const alarmNiewiar = podsumowanieHints(stanB({ ...OBWOD_PELNY, skew: 'obecne', wiarygodnosc: 'niewiarygodne' }), D);
  eq('F5/alarm-przezywa-niewiarygodnosc', alarmNiewiar.wniosek, 'alarm');
  T('F5b/ale-zastrzezenie-widoczne', alarmNiewiar.zastrzezenia.some(z => z.id === 'badanieNiewiarygodne'), 'zastrzeżenie musi być wymienione mimo alarmu');
  eq('F6/brak-oczoplasu-nieinformatywne', podsumowanieHints(stanB({ ...OBWOD_PELNY, oczoplas: 'bezOczoplasu' }), D).wniosek, 'nieinformatywne');
  eq('F7/alarm-bije-brak-oczoplasu', podsumowanieHints(stanB({ ...OBWOD_PELNY, oczoplas: 'bezOczoplasu', skew: 'obecne' }), D).wniosek, 'alarm');
  eq('F8/nic-nie-zaznaczono', podsumowanieHints(stanB({}), D).wniosek, 'niewykonane');
  eq('F9/sam-sluch-nie-daje-obwodu', podsumowanieHints(stanB({ sluch: 'symetryczny', chod: 'chodziBezPodparcia' }), D).wniosek, 'niepelne');
  eq('F9b/i-sluch-nie-wspiera-obwodu', podsumowanieHints(stanB({ sluch: 'symetryczny' }), D).wspierajaObwod.length, 0);
  eq('F10/nowy-niedoslych-alarmuje', podsumowanieHints(stanB({ ...OBWOD_PELNY, sluch: 'nowyJednostronny' }), D).wniosek, 'alarm');
  eq('F11/niemoznosc-chodzenia-alarmuje', podsumowanieHints(stanB({ ...OBWOD_PELNY, chod: 'nieStoiBezPodparcia' }), D).wniosek, 'alarm');
  eq('F11b/chwiejny-ale-chodzi-nie-alarmuje', podsumowanieHints(stanB({ ...OBWOD_PELNY, chod: 'chwiejnyAleChodzi' }), D).wniosek, 'obwodowy');
  eq('F12/przewlekly-niedoslych-nie-alarmuje', podsumowanieHints(stanB({ ...OBWOD_PELNY, sluch: 'przewlekly' }), D).wniosek, 'obwodowy');
  // Powód niewiarygodności — brak powodu jest osobnym zastrzeżeniem (jak w Bloku 11).
  const bezPowodu = podsumowanieHints(stanB({ ...OBWOD_PELNY, wiarygodnosc: 'niewiarygodne' }), D);
  T('F13/brak-powodu-nazwany', bezPowodu.zastrzezenia.some(z => z.id === 'powodNiepodany'), 'brak powodu niewiarygodności musi być nazwany');
  const zPowodem = podsumowanieHints(stanB({ ...OBWOD_PELNY, wiarygodnosc: 'niewiarygodne' }, { hintsPowodNiewiar: 'brakWarunkow' }), D);
  T('F13b/czulosc-powod-podany', !zPowodem.zastrzezenia.some(z => z.id === 'powodNiepodany'), 'kontrola: podany powód gasi zastrzeżenie');
  eq('F13c/powod-w-podsumowaniu', zPowodem.powodNiewiarygodnosci, 'brakWarunkow');
  eq('F13d/powod-tylko-przy-niewiarygodnym', podsumowanieHints(stanB(OBWOD_PELNY, { hintsPowodNiewiar: 'brakWarunkow' }), D).powodNiewiarygodnosci, null);
  // Pokaz dydaktyczny musi być NAZWANY w wyniku.
  const pokaz = podsumowanieHints({ hintsBadanie: OBWOD_PELNY, triage: TRIAGE.avs, hintsPrzeszkolenie: 'tak', hintsPominiecie: 'symulacja' }, D);
  T('F14/pokaz-nazwany', pokaz.zastrzezenia.some(z => z.id === 'niebadaniePacjenta'), 'symulacja musi być nazwana jako niebędąca badaniem pacjenta');
  T('F15/zdanie-kliniczne-zawsze', !!podsumowanieHints(stanB({}), D).zastrzezenieKliniczne.pl, 'wynik zawsze niesie zdanie o tym, że nie zastępuje decyzji klinicznej');
  T('F16/wnioski-opisane', Object.values(WNIOSKI).every(w => w.pl && w.en && w.opisPl && w.opisEn && w.pl !== w.en), 'każdy wniosek opisany w obu językach');
  T('F17/zastrzezenia-opisane', Object.values(ZASTRZEZENIA).every(z => z.pl && z.en && z.pl !== z.en), 'każde zastrzeżenie opisane w obu językach');
  T('F18/powody-niewiar-opisane', Object.values(POWODY_NIEWIARYGODNOSCI_HINTS).every(p => p.pl && p.en && p.pl !== p.en), 'każdy powód niewiarygodności opisany w obu językach');
}

/* ═══════════ G. TREŚĆ OSTRZEŻENIA — KRYTERIUM ODBIORU NR 3 ═══════════
   „Wynik zawiera WYRAŹNE ostrzeżenie przy cechach centralnych.” Wyraźne znaczy: nazywa cechy,
   mówi co robić i mówi, czego NIE robić. Bramka trzyma trzy zdania, bo to jedyne trzy zdania,
   których skasowanie byłoby niewidoczne w każdym innym teście. */
{
  const p = podsumowanieHints(stanB({ ...OBWOD_PELNY, skew: 'obecne' }), D);
  T('G1/ostrzezenie-jest', !!p.ostrzezenie, 'przy cesze alarmowej ostrzeżenie musi istnieć');
  T('G2/mowi-o-MRI', /MRI/.test(p.ostrzezenie.trescPl) && /MRI/.test(p.ostrzezenie.trescEn), 'ostrzeżenie musi wskazać właściwe badanie obrazowe');
  T('G3/odradza-tomografie', /tomografia/i.test(p.ostrzezenie.trescPl) && /\bCT\b/.test(p.ostrzezenie.trescEn), 'ostrzeżenie musi powiedzieć, że tomografia nie wyklucza udaru tylnego dołu');
  T('G4/falszywie-ujemne-MRI', /48/.test(p.ostrzezenie.trescPl) && /48/.test(p.ostrzezenie.trescEn), 'ostrzeżenie musi wspomnieć o fałszywie ujemnym wczesnym MRI');
  T('G5/tytul-w-obu-jezykach', !!(OSTRZEZENIE.tytulPl && OSTRZEZENIE.tytulEn && OSTRZEZENIE.tytulPl !== OSTRZEZENIE.tytulEn), 'ostrzeżenie ma tytuł w obu językach');
  T('G6/czulosc-bez-alarmu', podsumowanieHints(stanB(OBWOD_PELNY), D).ostrzezenie === null, 'kontrola: bez cech alarmowych ostrzeżenia nie ma');
}

/* ═══════════ H. WPIS I STRAŻNIK DANYCH ═══════════
   Lekcja z przeglądu Bloku 6 toru VOG: strażnik testowany WYŁĄCZNIE na ręcznie napisanym rekordzie
   nigdy nie chodził po rekordzie z PRAWDZIWEJ ścieżki zapisu. Tutaj chodzi po całym iloczynie. */
{
  let brudne = [], polaSpoza = [];
  for (const b of iloczyn()) {
    const st = { hintsBadanie: b, triage: TRIAGE.avs, hintsPrzeszkolenie: 'nie', hintsPominiecie: 'nauka', hintsPowodNiewiar: 'patologiaOczu' };
    const w = wpisHints(st, D);
    const g = bezDanychOsobowychHints(w);
    if (!g.czysty) brudne.push(JSON.stringify(b) + ' → ' + g.powody[0]);
    if (Object.keys(w).some(k => !POLA_WPISU_HINTS.includes(k))) polaSpoza.push(JSON.stringify(b));
  }
  T('H1/wpis-z-prawdziwej-sciezki-czysty', !brudne.length, `strażnik odrzucił wpis zbudowany przez aplikację: ${brudne.slice(0, 2)}`);
  T('H2/pola-ze-slownika', !polaSpoza.length, `wpis ma pole spoza słownika: ${polaSpoza.slice(0, 2)}`);
  const wzor = wpisHints({ hintsBadanie: OBWOD_PELNY, triage: TRIAGE.avs, hintsPrzeszkolenie: 'tak' }, D);
  T('H3/odrzuca-pole-tekstowe', !bezDanychOsobowychHints({ ...wzor, nazwisko: 'Kowalski' }).czysty, 'strażnik musi odrzucić pole spoza słownika');
  T('H4/odrzuca-wartosc-spoza-slownika', !bezDanychOsobowychHints({ ...wzor, wniosek: 'pacjent Jan K.' }).czysty, 'strażnik musi odrzucić wartość spoza słownika');
  T('H5/odrzuca-zly-element', !bezDanychOsobowychHints({ ...wzor, elementy: { ...wzor.elementy, notatka: 'sala 4' } }).czysty, 'strażnik musi odrzucić składową spoza słownika');
  T('H6/odrzuca-zla-wartosc-elementu', !bezDanychOsobowychHints({ ...wzor, elementy: { ...wzor.elementy, hit: 'pacjent nie chciał' } }).czysty, 'strażnik musi odrzucić wartość składowej spoza słownika');
  T('H7/odrzuca-nie-obiekt', !bezDanychOsobowychHints('Kowalski').czysty, 'strażnik musi odrzucić wpis, który nie jest obiektem');
  T('H8/odrzuca-zla-cechę-alarmowa', !bezDanychOsobowychHints({ ...wzor, cechyAlarmowe: ['sala 4'] }).czysty, 'strażnik musi odrzucić listę cech spoza słownika');
  T('H9/czulosc-wzor-przechodzi', bezDanychOsobowychHints(wzor).czysty, 'kontrola: poprawny wpis musi przejść');
  eq('H10/wpis-nie-niesie-zegara', Object.keys(wzor).filter(k => /czas|data|time/i.test(k)), []);
}

/* ═══════════ I. SPÓJNOŚĆ TABEL ═══════════
   Powód identyczny jak przy REGULY_KROKOW w Bloku 11: funkcje odsiewają, więc mutacja w tabeli
   potrafi NIE zmienić ich wyniku. Te bramki czytają tabele WPROST. */
{
  // I1: każde sprzężenie zadeklarowane w SPRZEZENIA jest naprawdę zwracane przez wagaOdpowiedzi.
  const uzyte = new Set();
  for (const b of iloczyn()) for (const id of ELEMENT_IDS) {
    const s = wagaOdpowiedzi(id, b).sprzezenie; if (s) uzyte.add(s);
  }
  eq('I1/sprzezenia-uzyte', [...uzyte].sort(), Object.keys(SPRZEZENIA).sort());
  // I2: każdy powód pominięcia jest osiągalny przez kwalifikację.
  eq('I2/pominiecia-osiagalne', POMINIECIE_IDS.map(p => kwalifikacjaHints(stanK('avs', p, 'tak'), D).pominiecie), POMINIECIE_IDS);
  // I3: każde zastrzeżenie jest osiągalne — martwe zastrzeżenie to reguła, której nikt nie zobaczy.
  const osiagalne = new Set();
  for (const przesz of PRZESZK) for (const pomin of POMIN) for (const wiar of ['wiarygodne', 'niewiarygodne']) for (const powod of [null, 'brakWarunkow']) {
    podsumowanieHints({ hintsBadanie: { ...OBWOD_PELNY, wiarygodnosc: wiar }, triage: TRIAGE.avs, hintsPrzeszkolenie: przesz, hintsPominiecie: pomin, hintsPowodNiewiar: powod }, D)
      .zastrzezenia.forEach(z => osiagalne.add(z.id));
  }
  eq('I3/zastrzezenia-osiagalne', [...osiagalne].sort(), Object.keys(ZASTRZEZENIA).sort());
  // I4: trzon to DOKŁADNIE te składowe, które mają flagę `trzon` — a nie osobna, rozjeżdżalna lista.
  eq('I4/trzon-z-flagi', TRZON_IDS, ELEMENTY.filter(e => e.trzon).map(e => e.id));
  // I5: opcja „nie można ocenić” ma w KAŻDEJ składowej ten sam identyfikator — ekran polega na tym.
  T('I5/wspolny-identyfikator', ELEMENTY.every(e => e.opcje.some(o => o.v === 'nieocenione')), 'każda składowa musi mieć opcję o identyfikatorze „nieocenione”');
  // I6: napis „nie można ocenić” nie powiela się z żadnym innym napisem w tej samej składowej.
  const kolizje = ELEMENTY.filter(e => {
    const n = e.opcje.find(o => o.v === 'nieocenione');
    return e.opcje.some(o => o.v !== 'nieocenione' && (o.pl === n.pl || o.en === n.en));
  }).map(e => e.id);
  T('I6/napis-nieoceniony-osobny', !kolizje.length, `„nie można ocenić” ma ten sam napis, co inna opcja: ${kolizje}`);
  // I7: opcjaHints/elementHints nie zmyślają.
  eq('I7a/element-nieznany', elementHints('cokolwiek'), null);
  eq('I7b/opcja-nieznana', opcjaHints('hit', 'cokolwiek'), null);
  eq('I7c/powody-niewiar-slownik', POWOD_NIEWIAR_IDS, Object.keys(POWODY_NIEWIARYGODNOSCI_HINTS));
}

/* ═══════════ J. CZYSTOŚĆ MODUŁU ═══════════
   Skan po źródle z WYCIĘTYMI KOMENTARZAMI — bez tego bramka zapala się na własnym komentarzu
   wyjaśniającym zakaz (pułapka, która w tym projekcie wystąpiła już cztery razy). */
{
  const src = readFileSync(resolve(ROOT, 'src/app/hints-model.js'), 'utf8');
  const bezKomentarzy = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  T('J1/bez-importow', !/^\s*import\s/m.test(bezKomentarzy), 'model HINTS musi zostać bezimportowy');
  T('J2/bez-t', !/\bt\s*\(\s*['"]/.test(bezKomentarzy), 't() na poziomie modułu zamroziłoby język');
  T('J3/bez-zegara', !/Date\s*\.\s*now|new\s+Date|Math\s*\.\s*random/.test(bezKomentarzy),
    'wpis badania nie ma prawa nieść zegara — złoty wzorzec musi zostać deterministyczny');
  T('J4/bez-dom', !/document|window|localStorage/.test(bezKomentarzy), 'model nie dotyka DOM ani pamięci przeglądarki');
  T('J5/czulosc-import', /^\s*import\s/m.test('import { x } from "y";'), 'kontrola: wzorzec importu musi trafiać');
  T('J6/czulosc-zegar', /Date\s*\.\s*now/.test('const teraz = Date.now();'), 'kontrola: wzorzec zegara musi trafiać');
  T('J7/kod-zostaje', /export function podsumowanieHints/.test(bezKomentarzy), 'kontrola: wycinanie komentarzy nie wycina kodu');
  T('J8/komentarze-wyciete', !/pułapka, która w tym projekcie/.test(bezKomentarzy), 'kontrola: wycinanie komentarzy naprawdę działa');
  const WZORZEC_POLA = /<\s*(?:input|textarea)|contenteditable|type\s*=\s*["']text|\bprompt\s*\(/i;
  T('J9/bez-pol-tekstowych', !WZORZEC_POLA.test(bezKomentarzy), 'w module HINTS nie ma prawa istnieć pole tekstowe');
  T('J10/czulosc-pola', WZORZEC_POLA.test('<textarea name="opis">') && WZORZEC_POLA.test('const imie = prompt("nazwisko");'),
    'kontrola: wzorzec musi łapać i znacznik, i okno dialogowe');
  T('J11/czulosc-slowo-nie-lapie', !WZORZEC_POLA.test('the current inputs point to a canal'),
    'kontrola: samo słowo „inputs” w zdaniu klinicznym nie jest polem tekstowym');
  // Model nie ma prawa importować silnika NeuroVOR: to jest formularz obserwacji, nie symulator.
  T('J12/bez-silnika', !/NeuroVOR|neuro-vor/.test(bezKomentarzy), 'model badania nie ma prawa sięgać do symulatora');
}

/* ═══════════ K. LICZNOŚĆ ═══════════ */
const OCZEKIWANE = 135;
if (bledy.length) {
  console.error(`✗ hints:check — ${bledy.length} bledow (przeszlo ${ok})`);
  bledy.forEach(b => console.error('  ' + b));
  process.exit(1);
}
if (ok !== OCZEKIWANE) {
  console.error(`✗ hints:check — przypadkow ${ok}, oczekiwano ${OCZEKIWANE}.`);
  console.error('  Jesli to swiadoma zmiana zakresu, popraw OCZEKIWANE. Jesli nie — ktorys przypadek zniknal.');
  process.exit(1);
}
console.log(`✓ hints:check — ${ok} przypadkow, model badania HINTS zgodny.`);
