/* OTOREPO — GENERATOR OPISU BADANIA I ZAPIS SESJI (Blok 15). MODUŁ CZYSTY (bez importów).
 *
 * ═══ OPIS JEST LICZONY, A NIE PRZECHOWYWANY ═══
 * Kryterium odbioru nr 1 brzmi: „opis zgadza się z aktualnym stanem kroków i aktualizuje po
 * zmianie rozpoznania". Najprostszym sposobem jego złamania byłoby TRZYMANIE gotowego tekstu
 * w stanie — wtedy każda zmiana rozpoznania zostawia w pamięci zdanie, które przestało być
 * prawdą, a użytkownik kopiuje je do dokumentacji. Dlatego opis nie ma tu żadnego miejsca
 * zapisu: `raport()` liczy go od nowa przy każdym renderze, a wyrocznia sprawdza mutacją, że
 * zmiana kanału, strony, mechanizmu, wyniku kontroli i tolerancji ZMIENIA tekst.
 *
 * ═══ ANI JEDNEGO SŁOWA KLINICZNEGO WŁASNEGO ═══
 * Ten moduł nie zna nazwy żadnego kanału, manewru ani cechy oczopląsu. Wszystkie etykiety
 * kliniczne wchodzą przez wstrzykiwacz (`opis-deps.js`) ze słowników, z których korzystają
 * ekrany. Gdyby generator miał własne napisy, byłby SZÓSTYM opisem tej samej wiedzy i rozjechał
 * się z resztą przy pierwszej poprawce — a rozjazd w generatorze opisu trafia do dokumentacji.
 * Wyrocznia pilnuje tego zachowaniem, nie czytaniem kodu: podmiana etykiety w słowniku MUSI
 * zmienić tekst opisu.
 *
 * ═══ OPIS NIGDY NIE TWIERDZI WIĘCEJ, NIŻ ZAPISANO ═══
 * Najgroźniejszy tryb awarii tego bloku nie jest techniczny. `state.side` ma literał 'P',
 * a `state.variant` literał 'canalo' — obie wartości istnieją tylko dlatego, że animacja musi
 * coś rysować, i żadnej użytkownik nie musiał dotknąć (Blok 9 i 10 zbudowały na to `variantZrodlo`
 * i `sideZrodlo`). Generator, który wypisałby je jak ustalenia, wkładałby STRONNOŚĆ do
 * dokumentacji medycznej na podstawie wartości domyślnej. Reguła jest więc twarda: strona
 * i mechanizm pojawiają się w części „Interpretacja" WYŁĄCZNIE ze źródłem; bez źródła sekcja
 * mówi „nieustalone" i nie podaje wartości.
 * Osobną rzeczą jest strona WYKONANEGO manewru — to fakt („zrobiono to uchu prawemu"), a nie
 * wniosek, więc wolno ją napisać. Zestawienie obu zdań jest informacją, a nie sprzecznością.
 *
 * ═══ CO NIE WCHODZI DO OPISU ═══
 * Rady aplikacji. Model kwalifikacji i model kontroli niosą akapity zaleceń („rozważ MRI DWI",
 * „powtórz manewr") — one są dla użytkownika NA EKRANIE. Opis badania jest zapisem tego, co
 * zrobiono i co stwierdzono; wklejanie do dokumentacji cudzych zaleceń podpisanych nazwiskiem
 * klinicysty jest czymś innym niż opis badania. Wyrocznia sprawdza, że żadna sekcja nie niesie
 * pól `tresc`/`uwagi`.
 * Nie ma tu też ZEGARA. Data badania jest daną dokumentacji, a nie odczytem z przeglądarki;
 * czas zapisu sesji wchodzi WSTRZYKNIĘTY (`teraz`) i służy wyłącznie do porządkowania listy.
 */

/* ============ 1. Sekcje opisu ============
   Dokument: „Sekcje opisu można włączać i wyłączać przełącznikami". Jedna sekcja jest
   OBOWIĄZKOWA i nie da się jej wyłączyć — zastrzeżenie o charakterze narzędzia. Opis bez niego
   wygląda jak wynik badania aparaturowego, a nie jak notatka z narzędzia dydaktycznego. */
export const SEKCJE = [
  { id: 'kwalifikacja',  pl: 'Wywiad i kwalifikacja',       en: 'History and triage' },
  { id: 'proby',         pl: 'Wykonane próby',              en: 'Provocation tests performed' },
  { id: 'oczoplas',      pl: 'Opis oczopląsu',              en: 'Nystagmus description' },
  { id: 'interpretacja', pl: 'Interpretacja',               en: 'Interpretation' },
  { id: 'manewr',        pl: 'Manewr repozycyjny',          en: 'Repositioning maneuver' },
  { id: 'tolerancja',    pl: 'Tolerancja manewru',          en: 'Tolerance of the maneuver' },
  { id: 'kontrola',      pl: 'Kontrola po manewrze',        en: 'Post-maneuver control' },
  { id: 'zastrzezenie',  pl: 'Zastrzeżenie',                en: 'Disclaimer', obowiazkowa: true },
];
export const SEKCJE_IDS = SEKCJE.map(s => s.id);
export const sekcja = (id) => SEKCJE.find(s => s.id === id) || null;

/* ============ 2. Dlaczego czegoś nie ma ============
   Milczenie w opisie badania czyta się jako „nie było potrzeby". Każdy brak ma więc powód ze
   słownika zamkniętego — i te powody znaczą różne rzeczy klinicznie: „nie wykonano" to nie to
   samo co „wykonano i nie opisano", a „opis niewiarygodny" to nie to samo co brak opisu. */
export const POWODY_BRAKU = {
  nieWykonano:   { pl: 'nie wykonano', en: 'not performed' },
  nieOpisano:    { pl: 'wykonano, nie opisano', en: 'performed, not described' },
  nieOdnotowano: { pl: 'nie odnotowano', en: 'not recorded' },
  niewiarygodne: { pl: 'opis uznany za niewiarygodny — nie wchodzi do wniosków',
                   en: 'description deemed unreliable — not used for conclusions' },
  nieustalone:   { pl: 'nieustalone — w aplikacji pozostała wartość domyślna, której nikt nie potwierdził',
                   en: 'not established — the app kept a default value that nobody confirmed' },
};
export const POWODY_BRAKU_IDS = Object.keys(POWODY_BRAKU);

/* Skąd wzięła się wartość. `wyprowadzony` to nie to samo co `wybrany`: mechanizm przyjęty
   z opisu obserwacji pochodzi z MODELU, a nie od klinicysty, i opis ma to rozróżniać. */
export const ZRODLA = {
  wybrany:      { pl: 'wskazane przez badającego', en: 'indicated by the examiner' },
  wyprowadzony: { pl: 'wyprowadzone z opisu obserwacji', en: 'derived from the observation' },
  nadpisany:    { pl: 'nadpisane ręcznie mimo innego wyniku modelu', en: 'manually overridden against the model' },
};
export const ZRODLA_IDS = Object.keys(ZRODLA);

/* ============ 3. Wiersz opisu ============
   Wartość jest albo napisem ze słownika klinicznego (wstrzykiwacz zwraca gotowy napis w języku
   interfejsu), albo parą {pl,en} należącą do TEGO modułu (napisy strukturalne, nie kliniczne). */
const napis = (v, lang) => (v == null ? null : typeof v === 'string' ? v : (lang === 'pl' ? v.pl : v.en));
const W = (etykieta, wartosc, brak = null, zrodlo = null) => ({ etykieta, wartosc: wartosc == null ? null : wartosc, brak, zrodlo });

/* ============ 4. Raport ============ */
export function raport(stan, deps) {
  const s = stan || {};
  const d = deps || {};
  const pod = typeof d.podsumowanie === 'function' ? (d.podsumowanie(s) || {}) : {};
  const sekcje = [
    sekcjaKwalifikacja(s, d),
    sekcjaProby(s, d, pod),
    sekcjaOczoplas(s, d, pod),
    sekcjaInterpretacja(s, d, pod),
    sekcjaManewr(s, d, pod),
    sekcjaTolerancja(s, d, pod),
    sekcjaKontrola(s, d, pod),
    sekcjaZastrzezenie(s, d),
  ];
  return {
    jezyk: typeof d.lang === 'function' ? d.lang() : 'en',
    sekcje,
    // Ile sekcji niesie choć jedną stwierdzoną wartość — ekran ma czym powiedzieć, że opis jest pusty.
    zNoweTresci: sekcje.filter(x => x.wiersze.some(w => w.wartosc != null)).length,
  };
}

function pakiet(id, wiersze) {
  const sp = sekcja(id);
  return { id, tytul: { pl: sp.pl, en: sp.en }, obowiazkowa: !!sp.obowiazkowa, wiersze };
}

function sekcjaKwalifikacja(s, d) {
  const odp = s.triage || {};
  const pytania = typeof d.pytaniaTriage === 'function' ? d.pytaniaTriage() : [];
  const aktywne = typeof d.aktywnePytania === 'function' ? d.aktywnePytania(odp) : pytania.map(p => p.id);
  const wiersze = [];
  for (const p of pytania) {
    if (!aktywne.includes(p.id)) continue;            // pytanie nieaktywne nie jest „bez odpowiedzi"
    const v = odp[p.id];
    const etykieta = { pl: p.pl, en: p.en };
    if (v == null || (Array.isArray(v) && v.length === 0)) { wiersze.push(W(etykieta, null, 'nieOdnotowano')); continue; }
    const lista = Array.isArray(v) ? v : [v];
    const nazwy = lista.map(x => {
      const o = (p.opcje || []).find(o => o.v === x);
      return o ? { pl: o.pl, en: o.en } : null;
    }).filter(Boolean);
    if (!nazwy.length) { wiersze.push(W(etykieta, null, 'nieOdnotowano')); continue; }
    wiersze.push(W(etykieta, {
      pl: nazwy.map(n => n.pl).join('; '),
      en: nazwy.map(n => n.en).join('; '),
    }));
  }
  /* KATEGORIA TYLKO PRZY ODPOWIEDZIACH. `triageResult({})` zwraca kategorię ZAWSZE — dla pustego
     wywiadu jest nią „ustal najpierw przebieg", czyli rada dla użytkownika, a nie ustalenie.
     Wpisana do opisu badania czytałaby się jak wynik kwalifikacji, której nikt nie przeprowadził
     (zmierzone: pusty przypadek miał jedną wartość kliniczną i była nią właśnie ta). */
  const odpowiedziano = Object.values(odp).some(v => v != null && (!Array.isArray(v) || v.length > 0));
  const wynik = odpowiedziano && typeof d.wynikTriage === 'function' ? d.wynikTriage(odp) : null;
  const kat = typeof d.kategoriaTriage === 'function' && wynik ? d.kategoriaTriage(wynik) : null;
  wiersze.push(kat
    ? W({ pl: 'Kwalifikacja wstępna', en: 'Initial triage' }, kat)
    : W({ pl: 'Kwalifikacja wstępna', en: 'Initial triage' }, null, 'nieOdnotowano'));
  return pakiet('kwalifikacja', wiersze);
}

function sekcjaProby(s, d, pod) {
  const opisane = Array.isArray(pod.opisaneProby) ? pod.opisaneProby : [];
  const proby = typeof d.proby === 'function' ? d.proby() : [];
  const wiersze = proby.map(p => {
    const etykieta = typeof d.probaLabel === 'function' ? d.probaLabel(p) : p;
    const rek = typeof d.rekord === 'function' ? d.rekord(s, p) : null;
    if (!opisane.includes(p)) return W(etykieta, null, 'nieWykonano');
    const wyst = rek ? rek.wystapil : undefined;
    const opcja = typeof d.wartoscPola === 'function' ? d.wartoscPola('wystapil', wyst) : null;
    return opcja ? W(etykieta, opcja) : W(etykieta, null, 'nieOpisano');
  });
  return pakiet('proby', wiersze);
}

/* Opis oczopląsu. Instancja oznaczona `niewiarygodne` NIE trafia do opisu jako stwierdzenie —
   `wartosc()` (czyli `wartoscInstancji` bez ufania kwarantannie) zwraca dla niej `undefined`.
   Zamiast niej wchodzi wiersz z powodem: opis badania musi powiedzieć, że coś opisano i odrzucono,
   bo inaczej ta sama luka wygląda jak „nie patrzyliśmy". */
function sekcjaOczoplas(s, d, pod) {
  const opisane = Array.isArray(pod.opisaneProby) ? pod.opisaneProby : [];
  const wiersze = [];
  for (const p of opisane) {
    const rek = typeof d.rekord === 'function' ? d.rekord(s, p) : null;
    if (!rek) continue;
    const naglowek = typeof d.probaLabel === 'function' ? d.probaLabel(p) : p;
    const inst = typeof d.instancje === 'function' ? d.instancje(p, rek.wystapil) : [];
    let ile = 0;
    for (const i of inst) {
      if (i.klucz === 'wystapil') continue;            // już w sekcji „Wykonane próby"
      const v = typeof d.wartosc === 'function' ? d.wartosc(rek, i.klucz) : undefined;
      if (v === undefined) continue;
      const pyt = typeof d.pytaniePola === 'function' ? d.pytaniePola(i.pole) : null;
      const faza = i.fazaId && typeof d.fazaLabel === 'function' ? d.fazaLabel(p, i.fazaId) : null;
      const opcja = typeof d.wartoscPola === 'function' ? d.wartoscPola(i.pole, v) : null;
      if (!pyt || !opcja) continue;
      ile++;
      wiersze.push(W({
        pl: `${napis(naglowek, 'pl')}${faza ? ` (${napis(faza, 'pl')})` : ''} — ${napis(pyt, 'pl')}`,
        en: `${napis(naglowek, 'en')}${faza ? ` (${napis(faza, 'en')})` : ''} — ${napis(pyt, 'en')}`,
      }, opcja));
    }
    const powod = rek.powodNiewiarygodnosci
      ? (typeof d.powodNiewiar === 'function' ? d.powodNiewiar(rek.powodNiewiarygodnosci) : null) : null;
    if (powod) wiersze.push(W(naglowek, null, 'niewiarygodne'));
    if (powod) wiersze.push(W({ pl: 'Powód niewiarygodności', en: 'Reason for unreliability' }, powod));
    else if (!ile) wiersze.push(W(naglowek, null, 'nieOpisano'));
  }
  if (!wiersze.length) wiersze.push(W({ pl: 'Oczopląs', en: 'Nystagmus' }, null, 'nieOpisano'));
  return pakiet('oczoplas', wiersze);
}

/* Interpretacja — patrz nagłówek pliku. Strona i mechanizm bez ŹRÓDŁA nie mają prawa pojawić
   się jako wartość, bo w stanie zawsze coś stoi. */
function sekcjaInterpretacja(s, d, pod) {
  const wiersze = [];
  wiersze.push(pod.kanal && typeof d.kanalLabel === 'function'
    ? W({ pl: 'Kanał', en: 'Canal' }, d.kanalLabel(pod.kanal))
    : W({ pl: 'Kanał', en: 'Canal' }, null, 'nieustalone'));
  wiersze.push(pod.stronaZrodlo && pod.strona && typeof d.stronaLabel === 'function'
    ? W({ pl: 'Strona zajęta', en: 'Affected side' }, d.stronaLabel(pod.strona), null, pod.stronaZrodlo)
    : W({ pl: 'Strona zajęta', en: 'Affected side' }, null, 'nieustalone'));
  wiersze.push(pod.mechanizmZrodlo && pod.mechanizm && typeof d.mechanizmLabel === 'function'
    ? W({ pl: 'Mechanizm', en: 'Mechanism' }, d.mechanizmLabel(pod.mechanizm, pod.kanal), null, pod.mechanizmZrodlo)
    : W({ pl: 'Mechanizm', en: 'Mechanism' }, null, 'nieustalone'));
  if (pod.obrazOsrodkowy) {
    wiersze.push(W({ pl: 'Uwaga', en: 'Note' }, {
      pl: 'obraz oznaczony w aplikacji jako podejrzany o przyczynę ośrodkową',
      en: 'the picture was marked in the app as suspicious for a central cause',
    }));
  }
  return pakiet('interpretacja', wiersze);
}

function sekcjaManewr(s, d, pod) {
  const kontrole = Array.isArray(pod.kontrole) ? pod.kontrole : [];
  const wiersze = [];
  if (!kontrole.length && !pod.manewrBezKontroli) {
    wiersze.push(W({ pl: 'Manewr', en: 'Maneuver' }, null, 'nieWykonano'));
    return pakiet('manewr', wiersze);
  }
  const seria = kontrole.length ? kontrole : [{ manewr: (s.flow && s.flow.maneuver && s.flow.maneuver.key) || null,
                                                strona: (s.flow && s.flow.maneuver && s.flow.maneuver.planSide) || null }];
  seria.forEach((k, i) => {
    const nr = seria.length > 1 ? ` ${i + 1}` : '';
    const nazwa = k.manewr && typeof d.manewrLabel === 'function' ? d.manewrLabel(k.manewr) : null;
    const strona = k.strona && typeof d.stronaLabel === 'function' ? d.stronaLabel(k.strona) : null;
    const etykieta = { pl: `Wykonany manewr${nr}`, en: `Maneuver performed${nr}` };
    if (!nazwa) { wiersze.push(W(etykieta, null, 'nieWykonano')); return; }
    wiersze.push(W(etykieta, strona
      ? { pl: `${napis(nazwa, 'pl')} — ucho ${napis(strona, 'pl')}`, en: `${napis(nazwa, 'en')} — ${napis(strona, 'en')} ear` }
      : nazwa));
  });
  if (pod.czasySkad && typeof d.czasySkadLabel === 'function') {
    const cz = d.czasySkadLabel(pod.czasySkad);
    if (cz) wiersze.push(W({ pl: 'Czasy utrzymania pozycji', en: 'Position hold times' }, cz));
  }
  if (pod.manewrBezKontroli) wiersze.push(W({ pl: 'Kontrola po tym manewrze', en: 'Control after this maneuver' }, null, 'nieOdnotowano'));
  return pakiet('manewr', wiersze);
}

/* Tolerancja. Do Bloku 15 aplikacja NIE ZBIERAŁA tej danej w ogóle (zmierzone: wpis kontroli miał
   9 pól i nie było wśród nich tolerancji), więc dokument wymagał opisania czegoś, czego nie było
   z czego opisać. Zbieramy ją teraz jednym pytaniem ze słownika zamkniętego przy kontroli —
   a brak odpowiedzi zostaje brakiem, nie domysłem „zniósł dobrze". */
function sekcjaTolerancja(s, d, pod) {
  const kontrole = Array.isArray(pod.kontrole) ? pod.kontrole : [];
  if (!kontrole.length) return pakiet('tolerancja', [W({ pl: 'Tolerancja', en: 'Tolerance' }, null, 'nieWykonano')]);
  const wiersze = kontrole.map((k, i) => {
    const nr = kontrole.length > 1 ? ` ${i + 1}` : '';
    const etykieta = { pl: `Tolerancja manewru${nr}`, en: `Tolerance of maneuver${nr}` };
    const lab = k.tolerancja && typeof d.tolerancjaLabel === 'function' ? d.tolerancjaLabel(k.tolerancja) : null;
    return lab ? W(etykieta, lab) : W(etykieta, null, 'nieOdnotowano');
  });
  return pakiet('tolerancja', wiersze);
}

function sekcjaKontrola(s, d, pod) {
  const kontrole = Array.isArray(pod.kontrole) ? pod.kontrole : [];
  if (!kontrole.length) return pakiet('kontrola', [W({ pl: 'Kontrola', en: 'Control' }, null, 'nieWykonano')]);
  const wiersze = [];
  kontrole.forEach((k, i) => {
    const nr = kontrole.length > 1 ? ` ${i + 1}` : '';
    const etykieta = { pl: `Wynik kontroli${nr}`, en: `Control result${nr}` };
    const lab = k.wynik && typeof d.wynikLabel === 'function' ? d.wynikLabel(k.wynik) : null;
    if (!lab) { wiersze.push(W(etykieta, null, 'nieOdnotowano')); return; }
    wiersze.push(W(etykieta, lab));
    if (k.powod && typeof d.powodNiewiar === 'function') {
      const p = d.powodNiewiar(k.powod);
      if (p) wiersze.push(W({ pl: `Powód niewiarygodności${nr}`, en: `Reason for unreliability${nr}` }, p));
    }
  });
  wiersze.push(W({ pl: 'Proces', en: 'Process' }, pod.domkniete
    ? { pl: 'domknięty wynikiem kontroli', en: 'closed by a control result' }
    : { pl: 'niedomknięty — ostatni wynik kontroli nie zamyka procesu', en: 'not closed — the last control result does not close the process' }));
  return pakiet('kontrola', wiersze);
}

function sekcjaZastrzezenie(s, d) {
  return pakiet('zastrzezenie', [W({ pl: 'Charakter zapisu', en: 'Nature of this record' }, {
    pl: 'Opis wygenerowany przez OTOREPO — narzędzie dydaktyczne dla personelu medycznego. Nie jest wyrobem medycznym, nie stawia rozpoznania i nie zastępuje badania ani decyzji klinicysty. Zapis odtwarza wyłącznie to, co wprowadzono w aplikacji.',
    en: 'Description generated by OTOREPO — an educational tool for medical staff. It is not a medical device, it makes no diagnosis and does not replace examination or clinician judgment. It reproduces only what was entered in the app.',
  })]);
}

/* ============ 5. Tekst ============
   Sekcje wyłączone znikają w CAŁOŚCI. Sekcja obowiązkowa zostaje zawsze — także gdy użytkownik
   wyłączy wszystkie pozostałe. */
export function tekst(rap, opcje) {
  const o = opcje || {};
  const lang = (o.lang || (rap && rap.jezyk)) === 'pl' ? 'pl' : 'en';
  const wl = Array.isArray(o.wlaczone) ? o.wlaczone : null;
  const bloki = [];
  for (const sek of (rap && rap.sekcje) || []) {
    if (!sek.obowiazkowa && wl && !wl.includes(sek.id)) continue;
    const linie = sek.wiersze.map(w => {
      const et = napis(w.etykieta, lang);
      if (w.wartosc == null) {
        const b = POWODY_BRAKU[w.brak] || POWODY_BRAKU.nieOdnotowano;
        return `- ${et}: ${napis(b, lang)}`;
      }
      const zr = w.zrodlo && ZRODLA[w.zrodlo] ? ` (${napis(ZRODLA[w.zrodlo], lang)})` : '';
      return `- ${et}: ${napis(w.wartosc, lang)}${zr}`;
    });
    bloki.push(`${napis(sek.tytul, lang).toUpperCase()}\n${linie.join('\n')}`);
  }
  return bloki.join('\n\n');
}

/* Domyślnie włączone są wszystkie sekcje: opis niekompletny bez ostrzeżenia jest gorszy od
   opisu długiego, a przełączniki są jawnym gestem użytkownika. */
export const domyslneSekcje = () => SEKCJE_IDS.filter(id => !sekcja(id).obowiazkowa);
export function przelaczSekcje(lista, id) {
  if (!SEKCJE_IDS.includes(id) || sekcja(id).obowiazkowa) return { lista: Array.isArray(lista) ? lista.slice() : domyslneSekcje(), zmiana: false };
  const l = Array.isArray(lista) ? lista.slice() : domyslneSekcje();
  const i = l.indexOf(id);
  if (i >= 0) l.splice(i, 1); else l.push(id);
  return { lista: SEKCJE_IDS.filter(x => l.includes(x)), zmiana: true };
}

/* ============ 6. Co jest przypadkiem, a co bieżącym ustawieniem ekranu ============
   `POLA_PACJENTA` to ta sama lista, którą Blok 14 bierze na odcisk, żeby udowodnić, że
   Laboratorium nie tyka pacjenta. Trzymamy ją w JEDNYM miejscu i dzielimy na dwie rozłączne
   części, bo zapis sesji odpowiada dokładnie na pytanie „co z tego jest przypadkiem":
     • POLA_SESJI  — przypadek: co zaobserwowano, co ustalono, co zrobiono,
     • POLA_ULOTNE — bieżące położenie w aplikacji i ZEGAR trwającego manewru.
   Zegar jest ulotny nie dla oszczędności miejsca. Wznowienie odliczania przy odtworzeniu sesji
   znaczyłoby, że aplikacja mierzy czas utrzymania pozycji, w której pacjenta dawno nie ma. */
export const POLA_PACJENTA = ['side', 'canal', 'maneuverKey', 'testKey', 'variant', 'dixObs', 'dixRep',
  'diagCentral', 'size', 'plan', 'step', 'total', 'elapsedMs', 'running', 'zegar', 'ukryteOd', 'luka',
  'trybCzasu', 'sideZrodlo', 'variantZrodlo', 'obs', 'obsOdciski', 'obsGrupa', 'triage', 'triageStep',
  'kontrole', 'kontrolaPowod', 'decisionSeq', 'flow'];
export const POLA_SESJI = ['side', 'canal', 'maneuverKey', 'testKey', 'variant', 'dixObs', 'dixRep',
  'diagCentral', 'size', 'trybCzasu', 'sideZrodlo', 'variantZrodlo', 'obs', 'obsOdciski', 'triage',
  'kontrole', 'kontrolaPowod', 'decisionSeq', 'flow'];
export const POLA_ULOTNE = ['plan', 'step', 'total', 'elapsedMs', 'running', 'zegar', 'ukryteOd', 'luka',
  'obsGrupa', 'triageStep'];

/* Zapis pustego przypadku zaśmieca listę i uczy, że zapis nic nie znaczy. */
export function jestCoZapisac(stan) {
  const s = stan || {};
  const opisane = Object.keys(s.obs || {}).length > 0;
  const wywiad = Object.keys(s.triage || {}).length > 0;
  const kontrole = Array.isArray(s.kontrole) && s.kontrole.length > 0;
  const manewr = !!(s.flow && s.flow.maneuver && s.flow.maneuver.key);
  return opisane || wywiad || kontrole || manewr || !!s.canal;
}

export const WERSJA_SESJI = 1;
/* `teraz` WCHODZI ARGUMENTEM — moduł czysty nie ma prawa czytać zegara, a wyrocznia musi móc
   powtórzyć ten sam wynik jutro. */
/* STRESZCZENIE KWALIFIKACJI NIESIE ZDANIA — I NIE WCHODZĄ ONE DO ZAPISU.
   `flow.triage` trzyma obok identyfikatorów gotowy TYTUŁ wyniku w obu językach (`tytulPl`,
   `tytulEn`), bo pasek przebiegu musi go wypisać bez wołania modelu. W zapisie sesji zdanie jest
   niepotrzebne (przeliczy je `syncTriage` po odtworzeniu) i szkodliwe: zapis ma nieść wyłącznie
   identyfikatory, żeby „w tym pliku nie ma miejsca na dane pacjenta" było własnością struktury,
   a nie obietnicą. To PROJEKCJA przy zapisie, a nie czyszczenie naruszenia — strażnik dalej
   ODRZUCA wpis, w którym takie zdanie się pojawi. */
export const POLA_STRESZCZENIA_TRIAGE = ['complete', 'kategoria', 'sciezka', 'pewnosc', 'czerwona'];
function flowDoZapisu(flow) {
  if (!flow || typeof flow !== 'object') return flow;
  if (!flow.triage || typeof flow.triage !== 'object') return flow;
  const tr = {};
  for (const k of POLA_STRESZCZENIA_TRIAGE) if (k in flow.triage) tr[k] = flow.triage[k];
  return { ...flow, triage: tr };
}

export function rekordSesji(stan, deps, teraz, lista) {
  const s = stan || {};
  const pola = {};
  for (const k of POLA_SESJI) pola[k] = k in s ? s[k] : null;
  pola.flow = flowDoZapisu(pola.flow);
  const t = typeof teraz === 'number' && isFinite(teraz) ? Math.floor(teraz) : 0;
  return { id: nadajId(lista, t), wersja: WERSJA_SESJI, utworzono: t, pola };
}

/* Identyfikator wpisu jest WYLICZONY ze znacznika czasu, a nie losowy — dzięki temu zapis daje
   się powtórzyć w wyroczni, a kształt (`s<liczba>` z ewentualnym przyrostkiem) trzyma go w tym
   samym reżimie, co resztę zapisu: żadnej wartości, która nie jest liczbą albo słownikiem. */
export const KSZTALT_ID = /^s\d+(?:-\d+)?$/;
export function nadajId(lista, teraz) {
  const zajete = new Set((Array.isArray(lista) ? lista : []).map(x => x && x.id));
  const baza = `s${typeof teraz === 'number' && isFinite(teraz) ? Math.floor(teraz) : 0}`;
  if (!zajete.has(baza)) return baza;
  for (let i = 1; i < 1000; i++) if (!zajete.has(`${baza}-${i}`)) return `${baza}-${i}`;
  return `${baza}-999`;
}

/* Podpis wpisu na liście — z tych samych słowników co opis; ANI JEDNEGO pola tekstowego. */
export function podpisSesji(rek, deps) {
  const p = (rek && rek.pola) || {};
  const d = deps || {};
  const czesci = [];
  if (p.canal && typeof d.kanalLabel === 'function') czesci.push(d.kanalLabel(p.canal));
  if (p.sideZrodlo && p.side && typeof d.stronaLabel === 'function') czesci.push(d.stronaLabel(p.side));
  const k = Array.isArray(p.kontrole) ? p.kontrole[p.kontrole.length - 1] : null;
  if (k && k.manewr && typeof d.manewrLabel === 'function') czesci.push(d.manewrLabel(k.manewr));
  if (k && k.wynik && typeof d.wynikLabel === 'function') czesci.push(d.wynikLabel(k.wynik));
  return czesci.length ? czesci : null;
}

/* ============ 7. Strażnik danych osobowych ============
   Ta sama zasada, co w Bloku 11 i na torze VOG: strażnik chodzi po GOTOWYM wpisie i go ODRZUCA,
   zamiast po cichu czyścić. Reguła jest STRUKTURALNA: nie szukamy imion, tylko wymagamy, żeby
   każda wartość była liczbą, wartością logiczną albo napisem ZE SŁOWNIKA. Napis, którego nie ma
   w słowniku, jest naruszeniem niezależnie od tego, co znaczy — i dokładnie dlatego wpisanie
   nazwiska w jakiekolwiek pole nie ma jak przejść.
   `obsOdciski` to jedyne pole niosące napis wyliczony, a nie słownikowy — więc go PRZELICZAMY
   z rekordu i wymagamy zgodności. Odcisk, który się nie zgadza, nie jest odciskiem. */
export function bezDanychOsobowychSesji(rek, deps) {
  const powody = [];
  const d = deps || {};
  if (!rek || typeof rek !== 'object') return { czysty: false, powody: ['wpis nie jest obiektem'] };
  if (rek.wersja !== WERSJA_SESJI) powody.push('nieznana wersja zapisu');
  if (typeof rek.id !== 'string' || !KSZTALT_ID.test(rek.id)) powody.push('identyfikator wpisu ma obcy kształt');
  if (!(typeof rek.utworzono === 'number' && isFinite(rek.utworzono))) powody.push('znacznik czasu nie jest liczbą');
  const p = rek.pola;
  if (!p || typeof p !== 'object') return { czysty: false, powody: powody.concat(['brak pól przypadku']) };
  for (const k of Object.keys(p)) {
    if (!POLA_SESJI.includes(k)) { powody.push(`pole spoza słownika: ${k}`); continue; }
    if (POLA_ULOTNE.includes(k)) { powody.push(`pole ulotne w zapisie: ${k}`); continue; }
    powody.push(...sprawdzPole(k, p[k], d, p.obs || {}));
  }
  return { czysty: powody.length === 0, powody };
}

const slownikPola = (k, d) => {
  const S = (f, a) => (typeof d[f] === 'function' ? d[f](a) : null);
  switch (k) {
    case 'side': return ['L', 'P'];
    case 'canal': return S('kanaly');
    case 'maneuverKey': return S('manewry');
    case 'testKey': return S('proby');
    case 'variant': return ['canalo', 'cupulo'];
    case 'dixObs': return S('obserwacjeDix');
    case 'size': return S('rozmiary');
    case 'trybCzasu': return ['staly', 'doUstapienia'];
    case 'sideZrodlo': return ZRODLA_IDS;
    case 'variantZrodlo': return ZRODLA_IDS;
    case 'kontrolaPowod': return S('powodyNiewiarygodnosci');
    default: return null;
  }
};

function sprawdzPole(k, v, d, obs) {
  const zle = [];
  if (v == null || typeof v === 'boolean') return zle;
  if (k === 'dixRep' || k === 'decisionSeq') {
    if (!(typeof v === 'number' && isFinite(v) && v >= 0)) zle.push(`${k} musi być liczbą nieujemną`);
    return zle;
  }
  if (k === 'obs') return sprawdzObs(v, d);
  if (k === 'obsOdciski') return sprawdzOdciski(v, d, obs);
  if (k === 'triage') return sprawdzTriage(v, d);
  if (k === 'kontrole') return sprawdzKontrole(v, d);
  if (k === 'flow') return sprawdzFlow(v, d);
  if (typeof v !== 'string') { zle.push(`nieoczekiwany typ w polu ${k}`); return zle; }
  const sl = slownikPola(k, d);
  if (!Array.isArray(sl)) zle.push(`brak słownika dla pola ${k}`);
  else if (!sl.includes(v)) zle.push(`wartość spoza słownika w polu ${k}`);
  return zle;
}

/* JEDEN sprawdzacz rekordu obserwacji. Rekord lezy w zapisie w DWOCH miejscach: w `obs`
   i w `flow.maneuver.opisPrzed` (Blok 11 trzyma tam opis SPRZED manewru do porownania).
   Druga kopia regul rozjechalaby sie z pierwsza, a strażnik ma byc jednym zdaniem.
   Wyrocznia ekranu zlapala oba te pola dopiero na PRAWDZIWYM stanie — hand-made przypadek
   ich nie mial, bo nikt ich recznie nie wpisuje. */
export function sprawdzRekordObs(p, rek, d, gdzie) {
  const zle = [];
  const proby = typeof d.proby === 'function' ? d.proby() : [];
  if (!proby.includes(p)) return [`nieznana proba w ${gdzie}: ${p}`];
  if (!rek || typeof rek !== 'object') return [`rekord obserwacji nie jest obiektem: ${gdzie}.${p}`];
  for (const kl of Object.keys(rek)) {
    if (!['proba', 'wystapil', 'pola', 'powodNiewiarygodnosci'].includes(kl)) zle.push(`pole spoza slownika w rekordzie ${gdzie}.${p}: ${kl}`);
  }
  if (rek.proba !== undefined && rek.proba !== p) zle.push(`rekord ${gdzie}.${p} podpisany inna proba`);
  if (rek.wystapil !== undefined && !dozwolonaWartosc('wystapil', rek.wystapil, d)) zle.push(`wartosc spoza slownika: ${gdzie}.${p}.wystapil`);
  if (rek.powodNiewiarygodnosci !== undefined && rek.powodNiewiarygodnosci !== null) {
    const sl = typeof d.powodyNiewiarygodnosci === 'function' ? d.powodyNiewiarygodnosci() : [];
    if (!sl.includes(rek.powodNiewiarygodnosci)) zle.push(`powod niewiarygodnosci spoza slownika: ${gdzie}.${p}`);
  }
  const pola = rek.pola;
  if (pola === undefined) return zle;
  if (!pola || typeof pola !== 'object') { zle.push(`pola rekordu ${gdzie}.${p} nie sa obiektem`); return zle; }
  const dozwolone = typeof d.instancje === 'function' ? d.instancje(p, rek.wystapil).map(i => i.klucz) : [];
  const znaki = typeof d.znaczniki === 'function' ? d.znaczniki() : [];
  for (const [klucz, e] of Object.entries(pola)) {
    if (!dozwolone.includes(klucz)) { zle.push(`instancja spoza proby ${gdzie}.${p}: ${klucz}`); continue; }
    if (!e || typeof e !== 'object') { zle.push(`wpis instancji nie jest obiektem: ${gdzie}.${p}.${klucz}`); continue; }
    for (const kl of Object.keys(e)) if (!['w', 'znak'].includes(kl)) zle.push(`pole spoza slownika w instancji ${gdzie}.${p}.${klucz}: ${kl}`);
    const pole = klucz.split('#')[0];
    if (e.w !== undefined && !dozwolonaWartosc(pole, e.w, d)) zle.push(`wartosc spoza slownika: ${gdzie}.${p}.${klucz}`);
    if (e.znak !== undefined && e.znak !== null && !znaki.includes(e.znak)) zle.push(`znacznik spoza slownika: ${gdzie}.${p}.${klucz}`);
  }
  return zle;
}

function sprawdzObs(v, d) {
  if (typeof v !== 'object') return ['obs nie jest obiektem'];
  const zle = [];
  for (const [p, rek] of Object.entries(v)) zle.push(...sprawdzRekordObs(p, rek, d, 'obs'));
  return zle;
}

function dozwolonaWartosc(pole, w, d) {
  const lista = typeof d.wartosciPola === 'function' ? d.wartosciPola(pole) : null;
  return Array.isArray(lista) && lista.includes(w);
}

function sprawdzOdciski(v, d, rekordy) {
  if (typeof v !== 'object') return ['obsOdciski nie są obiektem'];
  const zle = [];
  const proby = typeof d.proby === 'function' ? d.proby() : [];
  for (const [p, odc] of Object.entries(v)) {
    if (!proby.includes(p)) { zle.push(`nieznana próba w odciskach: ${p}`); continue; }
    if (odc == null) continue;
    if (typeof odc !== 'string') { zle.push(`odcisk nie jest napisem: ${p}`); continue; }
    // Odcisk MUSI dać się przeliczyć z rekordu — inaczej jest zwykłym napisem w zapisie.
    /* ODCISK LICZYMY Z REKORDU LEZACEGO W ZAPISIE, a nie ze stanu aplikacji. Pierwsza wersja
       pytala o odcisk BIEZACEGO przypadku - i straznik odrzucal KAZDE odtworzenie, bo w chwili
       odtwarzania biezacy przypadek jest juz wyczyszczony. Zlapala to wyrocznia ekranu na
       pierwszym przejsciu zapisz -> zakoncz -> odtworz. */
    if (typeof d.odciskZRekordu !== 'function') { zle.push('brak sposobu na przeliczenie odcisku'); continue; }
    const oczekiwany = d.odciskZRekordu((rekordy || {})[p]);
    if (oczekiwany !== odc) zle.push(`odcisk nie zgadza się z rekordem: ${p}`);
  }
  return zle;
}

function sprawdzTriage(v, d) {
  if (typeof v !== 'object') return ['triage nie jest obiektem'];
  const zle = [];
  const pytania = typeof d.pytaniaTriage === 'function' ? d.pytaniaTriage() : [];
  for (const [id, w] of Object.entries(v)) {
    const q = pytania.find(x => x.id === id);
    if (!q) { zle.push(`nieznane pytanie kwalifikacji: ${id}`); continue; }
    const dozwolone = (q.opcje || []).map(o => o.v);
    const lista = Array.isArray(w) ? w : [w];
    for (const x of lista) {
      if (x == null) continue;
      if (typeof x !== 'string' || !dozwolone.includes(x)) zle.push(`odpowiedź spoza słownika: ${id}`);
    }
  }
  return zle;
}

function sprawdzKontrole(v, d) {
  if (!Array.isArray(v)) return ['kontrole nie są tablicą'];
  const zle = [];
  v.forEach((wpis, i) => {
    if (typeof d.bezDanychWpisu !== 'function') { zle.push('brak strażnika wpisu kontroli'); return; }
    const r = d.bezDanychWpisu(wpis);
    if (!r || !r.czysty) zle.push(`wpis kontroli ${i}: ${(r && r.powody || ['nieznany powód']).join(', ')}`);
  });
  return zle;
}

/* POLA_FLOW jest listą JAWNĄ i tu leży pułapka, na którą wyrocznia DOM złapała mnie od razu:
   pisząc strażnika, sprawdzałem go na stanie ZBUDOWANYM RĘCZNIE, a prawdziwy  niesie DWA
   streszczenia (kwalifikacji z Bloku 6 i kontroli z Bloku 11), o których ręczny przypadek nie
   wiedział. Strażnik odrzucał więc KAŻDY prawdziwy zapis. Wyrocznia ekranu pilnuje teraz, żeby
   każdy klucz prawdziwego  był na tej liście — inaczej następne streszczenie zablokuje
   zapis w dniu, w którym ktoś je doda. */
export const POLA_FLOW = ['testSeen', 'obsSeen', 'interpretSeen', 'maneuver', 'triage', 'kontrola'];
/* `opisPrzed` to PELNY rekord obserwacji sprzed manewru (Blok 11 porownuje go z opisem po
   manewrze), a `opisPrzedProba` mowi, ktorej proby dotyczy. Sprawdzamy je tym samym
   sprawdzaczem, co `obs` — inaczej ta sama tresc byłaby przy jednej sciezce pilnowana,
   a przy drugiej nie. */
export const POLA_MANEWRU = ['key', 'viaInterpret', 'planSide', 'canal', 'consumed', 'zatarte', 'inputs',
  'opisPrzed', 'opisPrzedProba', 'kontrolaIdx'];
export const POLA_WEJSC = ['testKey', 'variant', 'dixObs', 'side', 'central', 'obsOdcisk'];
function sprawdzFlow(v, d) {
  if (typeof v !== 'object') return ['flow nie jest obiektem'];
  const zle = [];
  for (const k of Object.keys(v)) {
    if (!POLA_FLOW.includes(k)) { zle.push(`pole spoza słownika w flow: ${k}`); continue; }
    if (k === 'maneuver' && v.maneuver) {
      const m = v.maneuver;
      if (typeof m !== 'object') { zle.push('flow.maneuver nie jest obiektem'); continue; }
      for (const mk of Object.keys(m)) {
        if (!POLA_MANEWRU.includes(mk)) { zle.push(`pole spoza słownika w flow.maneuver: ${mk}`); continue; }
        if (mk === 'opisPrzed') {
          if (m.opisPrzed == null) continue;
          const proba = m.opisPrzedProba || (m.opisPrzed && m.opisPrzed.proba) || null;
          if (!proba) { zle.push('flow.maneuver.opisPrzed bez proby'); continue; }
          zle.push(...sprawdzRekordObs(proba, m.opisPrzed, d, 'flow.maneuver.opisPrzed'));
          continue;
        }
        if (mk === 'opisPrzedProba') {
          const pr = typeof d.proby === 'function' ? d.proby() : [];
          if (m.opisPrzedProba != null && !pr.includes(m.opisPrzedProba)) zle.push('proba spoza slownika w flow.maneuver.opisPrzedProba');
          continue;
        }
        if (mk === 'inputs' && m.inputs) {
          if (typeof m.inputs !== 'object') { zle.push('flow.maneuver.inputs nie jest obiektem'); continue; }
          for (const ik of Object.keys(m.inputs)) if (!POLA_WEJSC.includes(ik)) zle.push(`pole spoza słownika w flow.maneuver.inputs: ${ik}`);
          continue;
        }
        const w = m[mk];
        if (w == null || typeof w === 'boolean' || typeof w === 'number') continue;
        if (typeof w !== 'string') { zle.push(`nieoczekiwany typ w flow.maneuver.${mk}`); continue; }
        const sl = mk === 'key' ? (typeof d.manewry === 'function' ? d.manewry() : null)
          : mk === 'planSide' ? ['L', 'P']
          : mk === 'canal' ? (typeof d.kanaly === 'function' ? d.kanaly() : null) : null;
        if (!Array.isArray(sl)) zle.push(`brak słownika dla flow.maneuver.${mk}`);
        else if (!sl.includes(w)) zle.push(`wartość spoza słownika w flow.maneuver.${mk}`);
      }
      continue;
    }
    if (k === 'kontrola') {
      const kt = v.kontrola;
      if (kt == null) continue;
      if (typeof kt !== 'object') { zle.push('flow.kontrola nie jest obiektem'); continue; }
      for (const [kk, kw] of Object.entries(kt)) {
        if (kw == null || typeof kw === 'boolean' || typeof kw === 'number') continue;
        if (typeof kw !== 'string') { zle.push(`nieoczekiwany typ w flow.kontrola.${kk}`); continue; }
        const sl = kk === 'wynik' ? (typeof d.wyniki === 'function' ? d.wyniki() : null)
          : kk === 'powod' ? (typeof d.powodyNiewiarygodnosci === 'function' ? d.powodyNiewiarygodnosci() : null) : null;
        if (!Array.isArray(sl)) zle.push(`brak słownika dla flow.kontrola.${kk}`);
        else if (!sl.includes(kw)) zle.push(`wartość spoza słownika w flow.kontrola.${kk}`);
      }
      continue;
    }
    if (k === 'triage') {
      // STRESZCZENIE kwalifikacji trzymane w flow (Blok 6) — same identyfikatory i wartości logiczne.
      const tr = v.triage;
      if (tr == null) continue;
      if (typeof tr !== 'object') { zle.push('flow.triage nie jest obiektem'); continue; }
      for (const [tk, tw] of Object.entries(tr)) {
        if (!POLA_STRESZCZENIA_TRIAGE.includes(tk)) { zle.push(`pole spoza słownika w flow.triage: ${tk}`); continue; }
        if (tw == null || typeof tw === 'boolean' || typeof tw === 'number') continue;
        if (typeof tw !== 'string') { zle.push(`nieoczekiwany typ w flow.triage.${tk}`); continue; }
        const sl = typeof d.wartosciStreszczeniaTriage === 'function' ? d.wartosciStreszczeniaTriage() : null;
        if (!Array.isArray(sl) || !sl.includes(tw)) zle.push(`wartość spoza słownika w flow.triage.${tk}`);
      }
      continue;
    }
    const w = v[k];
    if (w != null && typeof w !== 'boolean') zle.push(`pole flow.${k} musi być wartością logiczną`);
  }
  return zle;
}

/* ============ 8. Odtworzenie ============
   Zwraca ŁATKĘ stanu, a nie stan: nakładanie należy do jedynego pisarza (`opis-state.js`).
   Pola ulotne wracają wyzerowane — a `running:false` jest tu decyzją bezpieczeństwa, nie
   porządkową (patrz komentarz przy POLA_ULOTNE). */
export const ULOTNE_PO_ODTWORZENIU = {
  plan: null, step: 0, total: 0, elapsedMs: 0, running: false,
  zegar: null, ukryteOd: null, luka: 0, obsGrupa: null, triageStep: null,
};
export function przywrocenie(rek, deps) {
  const straz = bezDanychOsobowychSesji(rek, deps);
  if (!straz.czysty) return { ok: false, powody: straz.powody, latka: null, wymagaPlanu: false };
  const latka = {};
  for (const k of POLA_SESJI) if (k in rek.pola) latka[k] = rek.pola[k];
  Object.assign(latka, ULOTNE_PO_ODTWORZENIU);
  return { ok: true, powody: [], latka, wymagaPlanu: !!latka.maneuverKey };
}

/* ============ 9. Eksport ustrukturyzowany ============
   Dokument: „Użytkownik może skopiować tekst lub wyeksportować ustrukturyzowany zapis". To DWA
   różne gesty i dwa różne pliki. Eksport niesie IDENTYFIKATORY (a nie zdania), bo zapis
   ustrukturyzowany ma być czytelny dla programu; tekst niesie zdania, bo ma być czytelny dla
   człowieka. Pakiet NIE twierdzi, że jest anonimowy — mówi tylko tyle, ile wie: że aplikacja
   nie dołożyła żadnego identyfikatora. */
export const KODY_EKSPORTU = ['brak-identyfikatorow-z-aplikacji', 'narzedzie-dydaktyczne', 'zapis-lokalny'];
export function pakietEksportu(stan, deps, teraz) {
  const rek = rekordSesji(stan, deps, teraz);
  const straz = bezDanychOsobowychSesji(rek, deps);
  if (!straz.czysty) return { ok: false, powody: straz.powody, pakiet: null };
  return {
    ok: true, powody: [],
    pakiet: { format: 'otorepo-sesja', wersja: WERSJA_SESJI, kody: KODY_EKSPORTU.slice(), utworzono: rek.utworzono, pola: rek.pola },
  };
}
