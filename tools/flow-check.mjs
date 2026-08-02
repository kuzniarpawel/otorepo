/* OTOREPO — wyrocznia modelu przebiegu klinicznego (Blok 5).
 *
 * Dlaczego osobna bramka, a nie zaufanie do snapshotu DOM: model przebiegu jest MASZYNĄ STANÓW
 * o znaczeniu klinicznym (decyduje, kiedy aplikacja mówi „trzymasz manewr wynikający z
 * nieaktualnej odpowiedzi"). Golden zrzuca #app.innerHTML, a stepper żyje w powłoce — czyli
 * ŻADNA istniejąca wyrocznia nie dotyka tej logiki. Bez tego pliku regresja w wykrywaniu
 * nieaktualnych wniosków przechodziłaby przy komplecie zielonych wyroczni.
 *
 * Moduł flow-model.js jest czysty (zero importów, zero DOM, stan wchodzi argumentem), więc
 * importujemy go wprost w gołym Node — wzorzec z tools/bridge-check.mjs. Wiedzę kliniczną
 * (recommend/CANAL_OF/DIAG) wstrzykujemy z PRAWDZIWEGO maneuvers.js: dzięki temu zgodność
 * manewru z zaleceniem jest sprawdzana wobec silnika, a nie wobec atrapy, która mogłaby się
 * z nim rozjechać.
 *
 * Uruchomienie: npm run flow:check
 */
import {
  FLOW_STEPS, FLOW_IDS, FLOW_STATUS, flowStep, stepPending, stepTarget,
  decisionInputs, sameInputs, noteManeuver, maneuverDrift, maneuverAgreement,
  lateralizacjaNiepewna, activeStepId, flowStatuses, nextStepId, stepReachable, stepSummary,
  flowVisible, flowSignature, KONWERSJE,
} from '../src/app/flow-model.js';
import { recommend, CANAL_OF, DIAG } from '../src/pose/maneuvers.js';
// flow-state.js importuje WYŁĄCZNIE flow-model.js i triage-model.js — oba czyste, więc cały
// łańcuch jest importowalny w gołym Node i `noteNavCleared` daje się sprawdzić naprawdę,
// a nie przez odwzorowanie jego działania w teście.
import { noteNavCleared } from '../src/app/flow-state.js';

const DEPS = { recommend, canalOf: k => CANAL_OF[k] || null, testCanal: k => (DIAG[k] || {}).canal || null };

let ok = 0; const bledy = [];
const T = (tag, warunek, opis) => { if (warunek) ok++; else bledy.push(`${tag}: ${opis}`); };
const eq = (tag, a, b) => T(tag, JSON.stringify(a) === JSON.stringify(b), `oczekiwano ${JSON.stringify(b)}, jest ${JSON.stringify(a)}`);

// Stan zgodny kształtem z src/app/state.js (tylko pola czytane przez model).
const S = (o = {}) => ({
  screen: 'diag', mode: 'diag', area: 'diag', lang: 'pl',
  testKey: 'dix', side: 'P', variant: 'canalo',
  dixObs: 'post', dixRep: 0, diagCentral: false, size: 'medium', decisionSeq: 0,
  canal: null, maneuverKey: null, plan: null, step: 0, stepMapOpen: false,
  flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null },
  ...o,
});
const statusOf = (s, id) => (flowStatuses(s, DEPS).find(x => x.id === id) || {}).status;
const krok = (s, id) => flowStatuses(s, DEPS).find(x => x.id === id) || {};
// Stan „po wyborze manewru z rekomendacji", gotowy do psucia.
const zManewrem = (o = {}, key = 'epley', via = true) => {
  const s = S({ flow: { testSeen: true, obsSeen: true, interpretSeen: true, maneuver: null }, ...o });
  s.flow.maneuver = noteManeuver(s, key, via, s.side);
  return s;
};

/* ============ 1. Kształt tablicy kroków ============ */
eq('SH1/kolejnosc', FLOW_IDS, ['history', 'test', 'nystagmus', 'interpret', 'maneuver', 'followup']);
T('SH2/liczba', FLOW_STEPS.length === 6, `kroków ${FLOW_STEPS.length}, dokument mówi o sześciu`);
// Blok 6 dał Wywiadowi realną tresc (kwalifikacja wstepna), wiec jedynym krokiem bez modulu
// zostaje Kontrola. Ta asercja ma trzymac liste KROTKA: kazdy kolejny `pending` to obietnica.
T('SH3/pending', FLOW_STEPS.filter(s => s.pending).map(s => s.id).join(',') === 'followup',
  'w przygotowaniu ma byc juz tylko Kontrola');
T('SH4/dwujezycznosc', FLOW_STEPS.every(s => s.pl && s.en && s.plDesc && s.enDesc),
  'każdy krok musi mieć komplet napisów PL i EN');
T('SH5/statusy', ['todo', 'active', 'done', 'unreliable', 'skipped', 'pending', 'stale']
  .every(k => FLOW_STATUS[k] && FLOW_STATUS[k].pl && FLOW_STATUS[k].en), 'brak nazwy statusu');
// Status NIGDY samym kolorem (a11y.css: „STAN NIGDY SAMYM KOLOREM") — każdy poza „niewykonanym"
// musi mieć znak, który przeżyje skalę szarości i czytnik ekranu.
T('SH5b/glify', ['active', 'done', 'unreliable', 'skipped', 'pending', 'stale'].every(k => FLOW_STATUS[k].glif),
  'każdy status poza „niewykonany" potrzebuje własnego glifu');
T('SH6/flowStep', flowStep('maneuver').id === 'maneuver' && flowStep('nieistnieje') === null, 'flowStep');
T('SH7/brak-t', !/\bt\(/.test(FLOW_STEPS.map(s => s.pl + s.en).join('')), 'napisy nie mogą przechodzić przez t()');

/* ============ 2. Odcisk wejść decyzyjnych ============ */
eq('OD1/dix', decisionInputs(S()), { testKey: 'dix', variant: 'canalo', dixObs: 'post', side: 'P', central: false, obsOdcisk: null });
eq('OD2/roll-zeruje-dixObs', decisionInputs(S({ testKey: 'roll', dixObs: 'ant' })).dixObs, null);
eq('OD3/headhang', decisionInputs(S({ testKey: 'headhang', dixObs: 'ant' })).dixObs, null);
T('OD4/central', decisionInputs(S({ diagCentral: true })).central === true, 'diagCentral → central');
T('OD5/dixRep-poza', sameInputs(decisionInputs(S()), decisionInputs(S({ dixRep: 7 }))),
  'dixRep nie może wchodzić do odcisku — inaczej każde „Powtórz prowokację" dawałoby alarm');
T('OD6/size-poza', sameInputs(decisionInputs(S()), decisionInputs(S({ size: 'small' }))), 'size zmienia czasy holdów, nie zalecenie');
T('OD7/canal-poza', sameInputs(decisionInputs(S()), decisionInputs(S({ canal: 'horizontal', maneuverKey: 'lempert' }))),
  'canal/maneuverKey to WYNIKI decyzji; zgodność mierzy osobny człon');
T('OD8/sameInputs-null', !sameInputs(null, decisionInputs(S())) && !sameInputs(decisionInputs(S()), null), 'sameInputs(null)');
// Licznik decyzji NIE wchodzi do odcisku: byłby zbyt tępy. Odwrócenie karty mechanizmu tam
// i z powrotem to gest POROWNAWCZY (karta jest do tego zrobiona) i nie może zostawiać alarmu,
// którego nie da się zdjąć. Sygnał zatarty przez nawigację łapie osobna, precyzyjna flaga.
T('OD9/seq-poza-odciskiem', sameInputs(decisionInputs(S()), decisionInputs(S({ decisionSeq: 7 }))),
  'sam licznik decyzji nie może unieważniać wniosku');
/* OD10-OD12 — ODCISK OPISU OBSERWACJI (Blok 9). Model jest bezimportowy, więc czyta gotową
   wartość z `state.obsOdciski[proba]`; liczy ją obs-state.js. Odcisk jest KLUCZOWANY PRÓBĄ,
   inaczej opis rolla unieważniałby wniosek z Dix-Hallpike'a. */
eq('OD10/odcisk-w-odcisku', decisionInputs(S({ obsOdciski: { dix: 'dix|pion#jedyna=p1' } })).obsOdcisk, 'dix|pion#jedyna=p1');
eq('OD11/odcisk-innej-proby-niewidoczny', decisionInputs(S({ obsOdciski: { roll: 'roll|poziom#prawoWDole=p1' } })).obsOdcisk, null);
T('OD12/odcisk-rozroznia', !sameInputs(decisionInputs(S()), decisionInputs(S({ obsOdciski: { dix: 'dix|pion#jedyna=p1' } }))),
  'sameInputs MUSI widzieć zmianę opisu — inaczej odcisk jest martwym polem');

/* ============ 3. Wykrywanie nieaktualnego manewru ============ */
eq('DR1/swiezy', maneuverDrift(zManewrem()), []);
{
  const s = zManewrem(); s.variant = 'cupulo';
  const d = maneuverDrift(s);
  T('DR2/variant', d.length === 1 && d[0].pole === 'variant', `zmiana mechanizmu musi dać dryf, jest ${JSON.stringify(d)}`);
  T('DR2b/waga', d[0] && d[0].waga === 'krytyczna', 'zmiana mechanizmu jest krytyczna');
  T('DR2c/dwujezyczny', d[0] && d[0].pl && d[0].en, 'opis dryfu musi być dwujęzyczny');
}
{
  const s = zManewrem(); s.diagCentral = true;
  T('DR3/central', maneuverDrift(s).some(x => x.pole === 'central' && x.waga === 'krytyczna'),
    'przełączenie na CPN musi być krytyczne — repozycja staje się przeciwwskazana');
}
{ const s = zManewrem(); s.side = 'L'; T('DR4/side', maneuverDrift(s).some(x => x.pole === 'side'), 'zmiana strony'); }
{ const s = zManewrem(); s.dixObs = 'ant';
  T('DR5/dixObs', maneuverDrift(s).some(x => x.pole === 'dixObs'), 'downbeat → inny kanał'); }
{
  const s = zManewrem(); s.testKey = 'roll'; s.dixObs = 'post';
  const d = maneuverDrift(s);
  T('DR6/test', d.some(x => x.pole === 'testKey'), 'zmiana próby');
  T('DR6b/bez-szumu', !d.some(x => x.pole === 'dixObs'), 'przy zmianie próby dixObs nie może dokładać drugiego, mylącego powodu');
}
{ const s = zManewrem(); s.variant = 'cupulo'; s.variant = 'canalo';
  eq('DR7/powrot', maneuverDrift(s), []); }
{
  const s = zManewrem(); s.variant = 'cupulo'; s.side = 'L'; s.diagCentral = true;
  T('DR8/wiele', maneuverDrift(s).length === 3, `oczekiwano 3 powodów, jest ${maneuverDrift(s).length}`);
}
T('DR9/bez-manewru', maneuverDrift(S()).length === 0, 'bez wybranego manewru nie ma czego unieważniać');
T('DR10/brak-flow', maneuverDrift({ testKey: 'dix', side: 'P', variant: 'canalo' }).length === 0, 'stan bez pola flow');

/* --- 3a'. DRYF `dixObs` MUSI REAGOWAĆ NA WNIOSEK, NIE NA SUROWĄ WARTOŚĆ (Blok 8) ---
   Blok 8 przestaje wpisywać domyślne `dixObs='post'` przy wyborze próby: pusty opis nie ma
   prawa nieść odpowiedzi. Skutek uboczny, gdyby zostawić porównanie surowych wartości:
   opisanie TYPOWEGO oczopląsu (null → 'post') zapalałoby alarm o wadze KRYTYCZNEJ ze zdaniem
   „to zmienia wskazany kanał", mimo że kanał się nie zmienia (tylny → Epley w obu stanach),
   a `nextStepId` zawracałby użytkownika do „Interpretacji". To jest dokładnie to zmęczenie
   alarmowe, przeciwko któremu argumentuje komentarz przy `decisionInputs`.
   Alarm ma się zapalać, gdy zmienia się WNIOSEK (downbeat ↔ nie-downbeat). */
{ const s = zManewrem(); s.flow.maneuver.inputs.dixObs = null; s.dixObs = 'post';
  T('DR-A/null-na-post-bez-alarmu', !maneuverDrift(s).some(x => x.pole === 'dixObs'),
    'opisanie typowego oczopląsu nie zmienia wniosku — alarm byłby szumem'); }
{ const s = zManewrem(); s.flow.maneuver.inputs.dixObs = null; s.dixObs = 'ant';
  T('DR-B/null-na-ant-alarm', maneuverDrift(s).some(x => x.pole === 'dixObs'),
    'opisanie downbeatu zmienia wskazany kanał — alarm MUSI wstać'); }
{ const s = zManewrem(); s.flow.maneuver.inputs.dixObs = 'post'; s.dixObs = 'ant';
  T('DR-C/post-na-ant-alarm', maneuverDrift(s).some(x => x.pole === 'dixObs'), 'zmiana wniosku na downbeat'); }
{ const s = zManewrem(); s.flow.maneuver.inputs.dixObs = 'ant'; s.dixObs = null;
  T('DR-D/ant-na-null-alarm', maneuverDrift(s).some(x => x.pole === 'dixObs'),
    'cofnięcie downbeatu też zmienia wniosek'); }

/* --- 3a''. SKASOWANIE OPISU PO WYBORZE MANEWRU (Blok 9, poprawka F3) ---
   Defekt, którego pilnuje DR-O2: `variant` przykleja się do ostatniej wartości (animacja musi coś
   rysować), więc po skasowaniu opisu WSZYSTKIE dotychczasowe pola odcisku stały nietknięte, dryf
   był pusty i krok „Manewr" świecił `done` na mechanizmie, którego podstawę użytkownik przed
   chwilą skasował. Kierunek „było → nie ma" jest tu ważniejszy niż zwykły, dlatego straż
   `bylUstalony` przy tym polu NIE STOI. */
{ const s = zManewrem({ obsOdciski: { dix: 'dix|pion#jedyna=p1,torsja#jedyna=p1' } });
  s.obsOdciski = { dix: 'dix|pion#jedyna=m1,torsja#jedyna=p1' };
  T('DR-O1/zmiana-opisu-alarm', maneuverDrift(s).some(x => x.pole === 'obsOdcisk'),
    'zmiana opisu rozstrzygającej cechy MUSI unieważnić wniosek'); }
{ const s = zManewrem({ obsOdciski: { dix: 'dix|pion#jedyna=p1,torsja#jedyna=p1' } });
  s.obsOdciski = {};
  const d = maneuverDrift(s);
  T('DR-O2/skasowanie-opisu-alarm', d.some(x => x.pole === 'obsOdcisk'),
    'skasowanie opisu zostawiało wniosek bez podstawy i BEZ alarmu — to jest naprawiany defekt');
  T('DR-O2b/wlasne-zdanie', d.some(x => x.pole === 'obsOdcisk' && /skasowano/.test(x.pl) && /cleared/.test(x.en)),
    'skasowanie i zmiana to dwa różne zdarzenia i muszą mieć różne zdania'); }
{ const s = zManewrem(); s.obsOdciski = {};
  eq('DR-O3/dwa-puste-to-nie-zmiana', maneuverDrift(s), []); }
{ // Droga „Znam kanał i stronę": testKey null po obu stronach, opis nie istnieje — cisza.
  const s = zManewrem({ testKey: null }, 'epley', false);
  eq('DR-O4/bez-proby-cisza', maneuverDrift(s).filter(x => x.pole === 'obsOdcisk'), []); }
{ // Odcisk jest kluczowany próbą, więc zmiana próby NIE dokłada drugiego, mylącego powodu.
  const s = zManewrem({ obsOdciski: { dix: 'dix|pion#jedyna=p1' } });
  s.testKey = 'roll'; s.dixObs = 'post';
  const d = maneuverDrift(s);
  T('DR-O5/przy-zmianie-proby-bez-szumu', !d.some(x => x.pole === 'obsOdcisk'),
    'zmiana próby ma JEDEN powód — testKey; odcisk opisu nie może dokładać drugiego'); }
{ // Pola wagi 1-2 nie wchodzą do `odciskObserwacji`, więc ich dopisywanie nie może alarmować.
  // Kontrola czułości całej sekcji: gdyby odcisk był porównywany BEZ warunku równości prób,
  // DR-O5 by padło; gdyby nie był porównywany wcale, padłoby DR-O1 i DR-O2.
  const s = zManewrem({ obsOdciski: { dix: 'dix|pion#jedyna=p1' } });
  eq('DR-O6/ten-sam-odcisk-cisza', maneuverDrift(s), []); }

/* --- 3b. Sygnał zatarty przez nawigację ---
   Ciąg z krytyki: Dix → Epley → oznacz „Ośrodkowy — CPN" → INNA próba → z powrotem Dix.
   openTest przywraca dixObs='post' i diagCentral=false, więc SAME POLA odcisku wracają do
   wartości wyjściowych i binarne porównanie melduje „wszystko zgodne" u pacjenta oznaczonego
   jako podejrzany o przyczynę OŚRODKOWĄ. Flaga `zatarte` zapamiętuje sam FAKT wyczyszczenia. */
{
  const s = zManewrem();
  s.diagCentral = true;
  T('ZT1/alarm-zapalony', maneuverDrift(s).length > 0, 'CPN musi zapalić alarm');
  // odwzorowanie tego, co robi openTest przy INNEJ próbie: najpierw zapamiętaj, potem wyczyść
  s.flow.maneuver.zatarte = true; s.diagCentral = false; s.dixObs = 'post';
  const d = maneuverDrift(s);
  T('ZT2/alarm-nie-gasnie', d.length > 0, 'nawigacja NIE MOŻE zgasić ostrzeżenia o CPN');
  eq('ZT3/powod-zatarcia', d[0].pole, 'zatarte');
  T('ZT4/dwujezyczny', !!(d[0].pl && d[0].en), 'powód musi być dwujęzyczny');
}

/* --- 3b'. `noteNavCleared` TRACI PRZESŁANKĘ PRZY dixObs (Blok 8) ---
   Człon `dixObs === 'ant'` w `bylSygnal` stał na założeniu, że po odejściu od próby i powrocie
   obserwacja JEST STRACONA — bo `resetTestLocal` czyścił pole. Blok 8 to założenie kasuje:
   rekord obserwacji przeżywa nawigację, a `dixObs` jest odtąd PRZYJĘTĄ PODSTAWĄ, którą zmienia
   wyłącznie jawny gest. Gdyby człon został, sam przelot przez inną próbę stawiałby flagę
   `zatarte`, a ta zeruje się WYŁĄCZNIE przy wyborze nowego manewru — czyli powstałby trwały,
   nieusuwalny fałszywy alarm nad manewrem, z którym nic złego się nie stało.
   Sygnał o przyczynie OŚRODKOWEJ zostaje bez zmian: `diagCentral` nadal jest czyszczony przy
   zmianie próby i nadal musi zostawiać ślad (ZT1-ZT4 wyżej tego pilnują). */
{
  const s = zManewrem({ dixObs: 'ant' });
  noteNavCleared(s);                                   // to, co robi openTest przy INNEJ próbie
  T('ZT-N1/sam-downbeat-nie-zaciera', !s.flow.maneuver.zatarte,
    'przelot przez inną próbę nie może zostawiać nieusuwalnego alarmu, skoro obserwacja przeżywa');
  eq('ZT-N2/brak-dryfu-po-powrocie', maneuverDrift(s), []);
  const c = zManewrem({ diagCentral: true });
  noteNavCleared(c);
  T('ZT-N3/CPN-nadal-zaciera', !!c.flow.maneuver.zatarte, 'sygnał ośrodkowy MUSI zostawiać ślad');
}
{
  // Gest POROWNAWCZY: odwrócenie karty mechanizmu tam i z powrotem. Karta jest do tego zrobiona
  // („Odwróć kartę mechanizmu: kanalolitiaza albo kupulolitiaza") — alarm po każdym obejrzeniu
  // byłby szumem, a szum uczy ignorowania paska, który ma chronić przed repozycją przy CPN.
  const s = zManewrem();
  s.variant = 'cupulo'; s.decisionSeq = 1;
  T('ZT5/w-trakcie-alarm', maneuverDrift(s).length === 1, 'w trakcie oglądania drugiej strony alarm jest zasłużony');
  s.variant = 'canalo'; s.decisionSeq = 2;
  eq('ZT6/po-powrocie-cisza', maneuverDrift(s), []);
}

/* --- 3c. Pola nieustalone w chwili zapisu nie generują dryfu ---
   Wejście „Znam kanał i stronę" zapisuje odcisk z literałów ze state.js (testKey:null), których
   użytkownik nigdy nie dotknął. Późniejszy kontrolny Dix dałby różnicę „null → dix", z której nie
   da się ułożyć zdania klinicznego. */
{
  const s = zManewrem({ testKey: null }, 'epley', false);
  eq('NL1/bez-proby-brak-dryfu', maneuverDrift(s), []);
  s.testKey = 'dix';
  eq('NL2/pozniejsza-proba-brak-dryfu', maneuverDrift(s), []);
}

/* --- 3d. Manewry konwersji: oczekiwane przejście wariantu to POSTĘP, nie unieważnienie --- */
T('KV1/lista', !!KONWERSJE.gufoniApo && !!KONWERSJE.bascule, 'gufoniApo i bascule są manewrami konwersji');
{
  const s = zManewrem({ testKey: 'roll', variant: 'cupulo' }, 'gufoniApo');
  s.variant = 'canalo';                    // dokładnie to, do czego instruuje maneuvers.js:562
  eq('KV2/konwersja-bez-alarmu', maneuverDrift(s).filter(x => x.pole === 'variant'), []);
}
{
  // Odwrotny kierunek NIE jest konwersją — to zmiana rozpoznania i musi zapalić alarm.
  const s = zManewrem({ testKey: 'roll', variant: 'canalo' }, 'gufoniApo');
  s.variant = 'cupulo';
  T('KV3/kierunek-ma-znaczenie', maneuverDrift(s).some(x => x.pole === 'variant'), 'canalo→cupulo to nie konwersja');
}
{
  // Zwykły manewr przy tej samej zmianie wariantu — alarm musi zostać.
  const s = zManewrem({ variant: 'cupulo' }, 'epley');
  s.variant = 'canalo';
  T('KV4/nie-kazdy-manewr', maneuverDrift(s).some(x => x.pole === 'variant'), 'Epley nie jest manewrem konwersji');
}

/* --- 3e. Manewr WYKONANY przestaje być wnioskiem oczekującym --- */
{
  const s = zManewrem(); s.flow.maneuver.consumed = true;
  s.variant = 'cupulo';
  eq('CN1/consumed-gasi-dryf', maneuverDrift(s), []);
  eq('CN2/consumed-status', maneuverAgreement(s, DEPS).zgodnosc, 'consumed');
}

/* ============ 4. Zgodność manewru z wejściami (wstrzyknięty silnik) ============ */
eq('ZG1/pierwszy', maneuverAgreement(zManewrem(), DEPS).zgodnosc, 'pierwszy');           // dix+canalo → epley
eq('ZG2/alternatywa', maneuverAgreement(zManewrem({}, 'semont'), DEPS).zgodnosc, 'alternatywa');
{
  // Roll → apogeotropowy (kanał poziomy), a manewr Epley (kanał tylny). Żadne pole odcisku się
  // nie zmienia, więc SAM dryf tego nie widzi — dwa sąsiednie kroki twierdziłyby coś sprzecznego.
  const s = zManewrem({ testKey: 'roll', variant: 'cupulo' }, 'epley');
  const z = maneuverAgreement(s, DEPS);
  eq('ZG3/rozjazd', z.zgodnosc, 'rozjazd');
  eq('ZG3b/kanaly', [z.kanalManewru, z.kanalWejsc], ['posterior', 'horizontal']);
  eq('ZG3c/status', statusOf(s, 'maneuver'), 'stale');
}
{
  // Odwrotnie: klinicysta wziął „Alternatywa: Semont" przy canalo, potem przeszedł na cupulo —
  // trzyma wtedy DOKŁADNIE zalecany manewr. Sam dryf wołałby „nieaktualny".
  const s = zManewrem({}, 'semont'); s.variant = 'cupulo';
  eq('ZG4/semont-cupulo-jest-pierwszym', maneuverAgreement(s, DEPS).zgodnosc, 'pierwszy');
  T('ZG4b/ale-dryf-zostaje', statusOf(s, 'maneuver') === 'stale',
    'zgodność nie kasuje dryfu: wejścia realnie się zmieniły i trzeba je potwierdzić');
}
eq('ZG5/central-przeciwwskazany', maneuverAgreement(zManewrem({ diagCentral: true }), DEPS).zgodnosc, 'przeciwwskazany');
eq('ZG6/bez-proby-nieznana', maneuverAgreement(zManewrem({ testKey: null }, 'epley', false), DEPS).zgodnosc, 'nieznana');
eq('ZG7/antMode-yacovino', maneuverAgreement(zManewrem({ dixObs: 'ant' }, 'yacovino'), DEPS).zgodnosc, 'pierwszy');
eq('ZG8/antMode-epley-rozjazd', maneuverAgreement(zManewrem({ dixObs: 'ant' }, 'epley'), DEPS).zgodnosc, 'rozjazd');
T('ZG9/bez-deps', maneuverAgreement(zManewrem(), null) === null, 'bez wstrzykniętego silnika zwraca null, nie zgaduje');
T('ZG10/bez-manewru', maneuverAgreement(S(), DEPS) === null, 'bez manewru nie ma czego oceniać');

/* ============ 5. Wiarygodność lateralizacji ============ */
T('WR1/downbeat', lateralizacjaNiepewna(S({ dixObs: 'ant' })), 'czysty downbeat — strony nie ustalisz oczopląsem');
T('WR2/headhang', lateralizacjaNiepewna(S({ testKey: 'headhang' })), 'deep head-hang — kanał przedni');
T('WR3/dix-typowy', !lateralizacjaNiepewna(S()), 'typowy Dix-Hallpike lateralizuje');
T('WR4/roll', !lateralizacjaNiepewna(S({ testKey: 'roll' })), 'roll lateralizuje');
{
  const s = S({ dixObs: 'ant', flow: { obsSeen: true, interpretSeen: true }, screen: 'guide' });
  eq('WR5/oczoplas-niewiarygodny', statusOf(s, 'nystagmus'), 'unreliable');
  eq('WR6/interpretacja-niewiarygodna', statusOf(s, 'interpret'), 'unreliable');
  T('WR7/z-uzasadnieniem', krok(s, 'interpret').powodPl.length > 20 && krok(s, 'interpret').powodEn.length > 20,
    'status „niewiarygodny" musi powiedzieć DLACZEGO');
}

/* ============ 6. Widoczność paska ============ */
T('WD1/diag', flowVisible(S()), 'ekran testu');
T('WD2/setup-treat', flowVisible(S({ screen: 'setup', mode: 'treat' })), 'wybór manewru');
T('WD3/guide', flowVisible(S({ screen: 'guide' })), 'przewodnik manewru');
T('WD4/start', !flowVisible(S({ screen: 'start', area: 'start' })), 'ekran startowy');
// applyArea zostawia screen='setup', mode='diag' — bramka MUSI patrzeć na area, inaczej nad
// zaślepką „Moduł w przygotowaniu" zawisłoby „Krok 2 z 6 — Próba".
T('WD5/nauka', !flowVisible(S({ screen: 'setup', mode: 'diag', area: 'learn' })), 'zaślepka „Nauka"');
T('WD6/hints-screen', !flowVisible(S({ screen: 'hints', mode: 'hints', area: 'diag' })), 'ekran HINTS');
// setMode('hints') zostawia screen='setup' — sam warunek na screen NIE wystarczy.
T('WD7/hints-setup', !flowVisible(S({ screen: 'setup', mode: 'hints', area: 'diag' })), 'zakładka HINTS przed wejściem');
T('WD8/lab', !flowVisible(S({ area: 'lab', mode: 'hints' })), 'Laboratorium');
T('WD9/null', !flowVisible(null), 'brak stanu');

/* ============ 7. Podpis stanu dla powłoki ============
   NAJWAŻNIEJSZY TRIPWIRE BLOKU. Dotychczasowa bramka obserwatora (`screen|mode|step|side|area`)
   nie zawierała ANI JEDNEGO pola, na którym stoi wykrywanie nieaktualności — pasek nie odświeżał
   się dokładnie przy tych zmianach, dla których powstał. Każde pole widoczne na pasku musi
   zmieniać podpis. */
{
  const baza = flowSignature(S());
  const zmiany = {
    screen: 'setup', mode: 'treat', area: 'lab', step: 2, side: 'L', lang: 'en',
    testKey: 'roll', variant: 'cupulo', dixObs: 'ant', diagCentral: true, decisionSeq: 5,
    canal: 'horizontal', maneuverKey: 'lempert', stepMapOpen: true,
  };
  for (const [pole, wart] of Object.entries(zmiany))
    T(`PS/${pole}`, flowSignature(S({ [pole]: wart })) !== baza, `zmiana ${pole} MUSI zmienić podpis powłoki`);
  for (const flaga of ['testSeen', 'obsSeen', 'interpretSeen'])
    T(`PS/${flaga}`, flowSignature(S({ flow: { [flaga]: true } })) !== baza, `zmiana flow.${flaga} musi zmienić podpis`);
  T('PS/maneuver', flowSignature(zManewrem()) !== flowSignature(S({ flow: { testSeen: true, obsSeen: true, interpretSeen: true } })),
    'wybór manewru musi zmienić podpis');
  {
    const a = zManewrem(), b = zManewrem(); b.flow.maneuver.consumed = true;
    T('PS/consumed', flowSignature(a) !== flowSignature(b), 'wykonanie manewru musi zmienić podpis');
  }
  T('PS/stabilny', flowSignature(S()) === baza, 'ten sam stan → ten sam podpis');
  T('PS/dixRep-poza', flowSignature(S({ dixRep: 9 })) === baza, 'dixRep nie zmienia paska, więc nie ma go w podpisie');
  T('PS/null', flowSignature(null) === '', 'brak stanu');
}

/* ============ 8. Krok aktywny ============ */
eq('AK1/guide', activeStepId(S({ screen: 'guide' })), 'maneuver');
eq('AK2/setup-treat', activeStepId(S({ screen: 'setup', mode: 'treat' })), 'maneuver');
eq('AK3/setup-diag', activeStepId(S({ screen: 'setup', mode: 'diag' })), 'test');
eq('AK4/diag-swiezy', activeStepId(S({ screen: 'diag' })), 'test');
eq('AK5/diag-obs', activeStepId(S({ screen: 'diag', flow: { obsSeen: true } })), 'nystagmus');
eq('AK6/diag-interp', activeStepId(S({ screen: 'diag', flow: { obsSeen: true, interpretSeen: true } })), 'interpret');
eq('AK7/start', activeStepId(S({ screen: 'start' })), null);
eq('AK8/hints', activeStepId(S({ screen: 'hints', mode: 'hints' })), null);

/* ============ 9. Statusy kroków ============ */
eq('ST1/wywiad-niewykonany', statusOf(S(), 'history'), 'todo');
eq('ST2/kontrola', statusOf(S(), 'followup'), 'pending');
T('ST3/powod-pending', krok(S(), 'followup').powodPl.length > 20, 'krok w przygotowaniu MUSI mieć uzasadnienie');
T('ST3b/powod-en', krok(S(), 'followup').powodEn.length > 20, 'uzasadnienie po angielsku');
eq('ST4/test-aktywny', statusOf(S(), 'test'), 'active');
eq('ST5/test-todo-gdy-gdzie-indziej', statusOf(S({ screen: 'guide' }), 'test'), 'todo');
eq('ST6/test-done', statusOf(S({ screen: 'guide', flow: { testSeen: true } }), 'test'), 'done');
eq('ST7/manewr-aktywny', statusOf(S({ screen: 'guide' }), 'maneuver'), 'active');
{
  const s = zManewrem({ screen: 'guide' });
  eq('ST8/manewr-aktywny-na-ekranie', statusOf(s, 'maneuver'), 'active');
  eq('ST8b/interpret-done', statusOf(s, 'interpret'), 'done');
  eq('ST9/manewr-done-z-boku', statusOf({ ...s, screen: 'diag' }, 'maneuver'), 'done');
  const s3 = { ...s, screen: 'diag', variant: 'cupulo', decisionSeq: 1 };
  eq('ST10/manewr-stale', statusOf(s3, 'maneuver'), 'stale');
  T('ST10b/dryf-widoczny', krok(s3, 'maneuver').drift.length >= 1, 'status stale musi nieść POWÓD, nie samą flagę');
  eq('ST11/stale-bije-active', statusOf({ ...s3, screen: 'guide' }, 'maneuver'), 'stale');
}
{
  const s = zManewrem({ screen: 'guide', mode: 'treat', canal: 'posterior', maneuverKey: 'epley',
    flow: { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null } }, 'epley', false);
  eq('ST12/interpret-skipped', statusOf(s, 'interpret'), 'skipped');
  T('ST12b/uzasadnienie', krok(s, 'interpret').powodPl.length > 20, 'dokument wymaga „pominięty Z UZASADNIENIEM"');
  eq('ST13/test-todo', statusOf(s, 'test'), 'todo');
}
{
  const s = zManewrem({ screen: 'diag' }, 'semont');   // alternatywa przy dix+canalo
  eq('ST14/alternatywa-done', statusOf(s, 'maneuver'), 'done');
  T('ST14b/nota', krok(s, 'maneuver').powodPl.length > 10, 'alternatywa musi powiedzieć, że pierwszym rzutem jest inny manewr');
}

/* ============ 10. Krok „Oczopląs" ISTNIEJE DLA KAŻDEJ PRÓBY (Blok 8) ============
   Do Bloku 7 ten krok był `pending` przy roll, bow&lean i head-hangu, bo wprowadzanie
   obserwacji istniało wyłącznie przy Dix-Hallpike'u — i to była uczciwa deklaracja braku.
   Blok 8 dał wszystkim czterem próbom pełny formularz na WŁASNYM ekranie, więc te asercje
   opisują teraz stan, którego już nie ma; przepisane, a nie usunięte, żeby regresja
   („ktoś przywrócił pending") miała co złamać. */
for (const k of ['dix', 'roll', 'bowlean', 'headhang']) {
  eq(`OB1/${k}/nie-pending`, statusOf(S({ testKey: k, screen: 'guide' }), 'nystagmus'), 'todo');
  T(`OB2/${k}/osiagalny`, stepReachable(S({ testKey: k }), 'nystagmus'), 'krok z treścią MUSI być klikalny');
  eq(`OB3/${k}/cel-to-osobny-ekran`, stepTarget(S({ testKey: k }), 'nystagmus').screen, 'obs');
}
T('OB4/zaden-nie-pending', !['dix', 'roll', 'bowlean', 'headhang'].some(k => stepPending(S({ testKey: k }), 'nystagmus')),
  'po Bloku 8 nie ma próby, przy której nie da się nic wpisać');
T('OB5/bez-proby', stepReachable(S({ testKey: null }), 'nystagmus'), 'brak wybranej próby nie przesądza');
// Bez wybranej próby cel schodzi na ekran wyboru — inaczej renderObs czytałby DIAG[null].
eq('OB6/bez-proby-zamiast', stepTarget(S({ testKey: null }), 'nystagmus').screen, 'setup');
eq('OB7/nastepny-nie-pomija', nextStepId(S({ screen: 'diag', testKey: 'roll' }), DEPS), 'nystagmus');
eq('OB8/aktywny-na-ekranie-obs', activeStepId(S({ screen: 'obs', testKey: 'roll' })), 'nystagmus');
T('OB9/pasek-widoczny-na-obs', flowVisible(S({ screen: 'obs', testKey: 'roll' })), 'pasek przebiegu musi być widoczny na ekranie obserwacji');

/* ============ 11. Cel nawigacji — bramka danych ============
   renderDiag czyta DIAG[state.testKey].canal (svg-screens.js:1039-1043), renderGuide czyta
   plan.steps[step] (:905-906). Wyjątek leci PRZED przypisaniem innerHTML, więc ekran nie drgnie,
   a każdy kolejny render() rzuca to samo — aplikacja zablokowana do przeładowania. W powłoce
   siedzą puste `catch {}`, więc nie byłoby nawet śladu w konsoli. */
{
  const pusty = S({ screen: 'start', testKey: null, plan: null, maneuverKey: null });
  for (const id of FLOW_IDS) {
    const cel = stepTarget(pusty, id);
    if (stepPending(pusty, id)) { T(`CL/${id}-pending`, cel === null, 'krok w przygotowaniu nie ma celu'); continue; }
    T(`CL/${id}-cel`, !!cel && ['start', 'setup', 'diag', 'guide', 'hints', 'triage'].includes(cel.screen),
      `krok ${id} musi wskazać ekran obsługiwany przez render(), jest ${JSON.stringify(cel)}`);
  }
  eq('CL1/test-bez-proby', stepTarget(pusty, 'test'), { screen: 'setup', mode: 'diag', anchor: null, pelny: false });
  eq('CL2/interpret-bez-proby', stepTarget(pusty, 'interpret'), { screen: 'setup', mode: 'diag', anchor: null, pelny: false });
  eq('CL3/manewr-bez-planu', stepTarget(pusty, 'maneuver'), { screen: 'setup', mode: 'treat', anchor: null, pelny: false });
}
eq('CL4/test-z-proba', stepTarget(S(), 'test'), { screen: 'diag', mode: 'diag', anchor: '[data-flow-anchor="test"]', pelny: true });
// Blok 8: krok ma WŁASNY EKRAN, więc nie ma kotwicy w ekranie próby — rozdzielenie jest fizyczne.
eq('CL5/oczoplas-bez-kotwicy', stepTarget(S(), 'nystagmus').anchor, null);
eq('CL6/interpretacja-kotwica', stepTarget(S(), 'interpret').anchor, '[data-flow-anchor="interpret"]');
eq('CL7/manewr-z-planem', stepTarget(S({ plan: { steps: [{}] }, maneuverKey: 'epley' }), 'maneuver'),
  { screen: 'guide', mode: 'treat', anchor: null, pelny: true });
eq('CL8/pending-brak-celu', stepTarget(S(), 'followup'), null);
eq('CL9/wywiad-ma-cel', stepTarget(S(), 'history'), { screen: 'triage', mode: 'diag', anchor: null, pelny: true });

/* ============ 11b. Integracja kwalifikacji wstępnej (Blok 6) ============
   Model przebiegu NIE zna kwestionariusza — czyta jego STRESZCZENIE zapisane przez
   flow-state.syncTriage. Dzięki temu flow-model.js zostaje bezimportowy (tripwire CZ1). */
eq('TR1/ekran-wywiadu', activeStepId(S({ screen: 'triage' })), 'history');
T('TR2/pasek-widoczny', flowVisible(S({ screen: 'triage' })), 'pasek przebiegu musi być widoczny nad Wywiadem');
eq('TR3/aktywny-na-ekranie', statusOf(S({ screen: 'triage' }), 'history'), 'active');
{
  const zrobiony = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null,
    triage: { complete: true, kategoria: 'tEVS', sciezka: 'diag', pewnosc: 'wysoka', czerwona: false } };
  eq('TR4/zakonczony', statusOf(S({ screen: 'diag', flow: zrobiony }), 'history'), 'done');
}
{
  // Czerwona flaga: krok jest ZAKONCZONY (kwalifikacja dala jednoznaczna odpowiedz), ale musi
  // niesc uzasadnienie — samo „zakonczony" nad pacjentem z ataksja chodu byloby uspokajajace.
  const flaga = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null,
    triage: { complete: true, kategoria: 'czerwona', sciezka: null, pewnosc: 'wysoka', czerwona: true } };
  const k = krok(S({ screen: 'diag', flow: flaga }), 'history');
  eq('TR5/czerwona-zakonczona', k.status, 'done');
  T('TR6/czerwona-z-uzasadnieniem', /czerwon/i.test(k.powodPl) && k.powodEn.length > 20,
    'status musi powiedziec, ze kwalifikacja wykazala czerwona flage');
}
{
  const niepewny = { testSeen: false, obsSeen: false, interpretSeen: false, maneuver: null,
    triage: { complete: true, kategoria: 'niepewna', sciezka: null, pewnosc: 'niska', czerwona: false } };
  eq('TR7/niska-pewnosc', statusOf(S({ screen: 'diag', flow: niepewny }), 'history'), 'unreliable');
}
{
  // Podpis powloki MUSI reagowac na wynik kwalifikacji — inaczej pasek czerwonej flagi
  // nie odswiezylby sie po jej stwierdzeniu.
  const baza = flowSignature(S());
  const zFlaga = flowSignature(S({ flow: { triage: { complete: true, kategoria: 'czerwona', sciezka: null, pewnosc: 'wysoka', czerwona: true } } }));
  const zeSciezka = flowSignature(S({ flow: { triage: { complete: true, kategoria: 'tEVS', sciezka: 'diag', pewnosc: 'wysoka', czerwona: false } } }));
  T('TR8/podpis-widzi-kwalifikacje', zFlaga !== baza && zeSciezka !== baza && zFlaga !== zeSciezka,
    'wynik kwalifikacji musi zmieniac podpis powloki');
}

/* ============ 12. Następny krok ============ */
eq('NX1/z-testu', nextStepId(S({ screen: 'diag' }), DEPS), 'nystagmus');
eq('NX2/z-oczoplasu', nextStepId(S({ screen: 'diag', flow: { obsSeen: true } }), DEPS), 'interpret');
eq('NX3/z-interpretacji', nextStepId(S({ screen: 'diag', flow: { obsSeen: true, interpretSeen: true } }), DEPS), 'maneuver');
eq('NX4/pomija-pending', nextStepId(S({ screen: 'guide' }), DEPS), null);
eq('NX5/z-niczego', nextStepId(S({ screen: 'start' }), DEPS), 'test');
eq('NX7/z-wywiadu', nextStepId(S({ screen: 'triage' }), DEPS), 'test');
{
  const s = zManewrem({ screen: 'guide' }); s.variant = 'cupulo';
  eq('NX6/stale-kieruje-do-interpretacji', nextStepId(s, DEPS), 'interpret');
}

/* ============ 13. Osiągalność i podpis ============ */
T('OS1/pending-nieosiagalny', !stepReachable(S(), 'followup'), 'krok w przygotowaniu');
T('OS2/reszta-osiagalna', ['history', 'test', 'nystagmus', 'interpret', 'maneuver'].every(id => stepReachable(S(), id)), 'kroki istniejące');
T('OS3/nieznany', !stepReachable(S(), 'bzdura'), 'nieznany krok');
eq('PD1/podpis-pl', stepSummary(S({ screen: 'diag' }), 'pl'), { nr: 2, total: 6, label: 'Próba', id: 'test' });
eq('PD2/podpis-en', stepSummary(S({ screen: 'guide' }), 'en'), { nr: 5, total: 6, label: 'Maneuver', id: 'maneuver' });
eq('PD3/poza-przebiegiem', stepSummary(S({ screen: 'start' }), 'pl'), null);

/* ============ 14. Czystość modułu ============ */
{
  const fs = await import('node:fs');
  const src = fs.readFileSync(new URL('../src/app/flow-model.js', import.meta.url), 'utf8');
  T('CZ1/bez-importow', !/^\s*import\s/m.test(src), 'flow-model.js musi być bez importów (wyrocznia w gołym Node)');
  T('CZ2/bez-dom', !/\b(document|window|localStorage|navigator|requestAnimationFrame)\b/.test(src), 'zero odwołań do DOM');
  T('CZ3/bez-zegara', !/Date\.now|Math\.random|new Date/.test(src), 'zero źródeł niedeterminizmu');
  T('CZ4/bez-state-modulu', !/from\s+['"]\.\/state\.js/.test(src), 'stan wchodzi argumentem, nie importem');
}

/* ============ Wynik ============ */
const razem = ok + bledy.length;
console.log(`\nOTOREPO — wyrocznia przebiegu klinicznego (Blok 5)`);
console.log(`przypadki     : ${razem}`);
console.log(`kroki         : ${FLOW_IDS.join(' → ')}`);
if (bledy.length) {
  console.error(`\n✗ FAIL — ${bledy.length} z ${razem}:`);
  for (const b of bledy) console.error('  · ' + b);
  process.exit(1);
}
// Bramka liczności: skasowanie przypadków jest równie groźne jak zepsucie kodu.
const OCZEKIWANE = 197;   // +4 (DR-A..D) +3 (ZT-N) +6 (sekcja 10 przepisana: krok „Oczoplas" ma wlasny ekran i istnieje dla KAZDEJ proby) — Blok 8; +3 (OD10-12) +7 (DR-O1..O6) — Blok 9, odcisk opisu w wejsciach decyzyjnych
if (razem !== OCZEKIWANE) {
  console.error(`\n✗ FAIL — liczba przypadków ${razem} ≠ ${OCZEKIWANE}. Zmieniasz zakres wyroczni: zaktualizuj OCZEKIWANE świadomie.`);
  process.exit(1);
}
console.log(`\n✓ PASS — model przebiegu klinicznego zgodny (${razem} przypadków).`);
