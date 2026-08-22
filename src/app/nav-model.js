// nav-model.js — JEDNA definicja obszarów aplikacji (Blok 3: nawigacja i architektura informacji).
//
// Ta sama tablica zasila dolny pasek (telefon) i szynę boczną (komputer), więc kryterium odbioru
// „nawigacja nie zmienia nazw ani znaczeń między telefonem a komputerem" jest spełnione
// KONSTRUKCYJNIE, w obu językach — nie da się rozjechać dwóch list, bo lista jest jedna.
//
// ETYKIETY TRZYMAMY JAKO SUROWE NAPISY, a t() wołamy dopiero przy renderowaniu. Wywołanie t()
// na poziomie modułu zamroziłoby język na tym, który był aktywny w chwili importu — a moduły
// ładują się PRZED ustaleniem języka (main.js woła initLang() po imporcie).
//
// Pole `bar` jest JAWNE, zamiast brać pierwsze cztery pozycje. Ucięcie listy wypychało Profil
// (jedyne wejście do ustawień) i wciągało Laboratorium na pasek telefonu wbrew dokumentowi.

const ICO = {
  start:   '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 11.5 12 4l8 7.5M6.5 10v9h11v-9" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  diag:    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.5" stroke="currentColor" stroke-width="1.9"/><path d="M8.5 12h2l1.5 3 2-6 1.5 3h2" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  learn:   '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 8.5 12 4.5l9 4-9 4-9-4Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M6.5 10.5v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  lab:     '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 3.5v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5v-6" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9 3.5h6M8 14h8" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  profile: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6" stroke="currentColor" stroke-width="1.9"/><path d="M5 20c.9-3.4 3.7-5 7-5s6.1 1.6 7 5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
  // Atlas: otwarta księga. Celowo NIE lupa ani litera „i" — obie znaczą już co innego w tym
  // interfejsie (szukanie, informacja), a obszar ma się czytać jako materiał do CZYTANIA.
  atlas:   '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6.5C10.4 5.2 8.2 4.5 5 4.5v13c3.2 0 5.4.7 7 2 1.6-1.3 3.8-2 7-2v-13c-3.2 0-5.4.7-7 2Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M12 6.5v13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',
};

// bar: 'both' = dolny pasek telefonu ORAZ szyna; 'rail' = tylko szyna (na telefonie dostępne z Profilu).
export const AREAS = [
  // EN celowo „Home", nie „Start": napis „Start" jest już etykietą przycisku licznika na ekranie
  // manewru (svg-screens.js) oraz prefiksem rekomendacji („Start: manewr Epleya"). Dwa różne
  // znaczenia tego samego słowa zderzyłyby się na jednym ekranie.
  { id:'start',   pl:'Start',        en:'Home',        bar:'both', ico:ICO.start,
    plDesc:'Repozycja — manewry',            enDesc:'Repositioning — maneuvers' },
  // Para „Diagnostyka"/„Diagnostics" istnieje już w kodzie i jest zapieczętowana w złotym
  // wzorcu — przejmujemy ją dosłownie, zamiast wprowadzać drugi wariant tłumaczenia.
  { id:'diag',    pl:'Diagnostyka',  en:'Diagnostics', bar:'both', ico:ICO.diag,
    plDesc:'Testy pozycyjne i HINTS',        enDesc:'Positional tests and HINTS' },
  { id:'learn',   pl:'Nauka',        en:'Learn',       bar:'both', ico:ICO.learn,
    plDesc:'Przypadki i quizy',              enDesc:'Cases and quizzes' },
  { id:'lab',     pl:'Laboratorium', en:'Laboratory',  bar:'rail', ico:ICO.lab,
    plDesc:'Matematyczny pacjent',           enDesc:'Mathematical patient' },
  /* ATLAS OTONEUROLOGICZNY (E6, decyzja użytkownika 2026-08-22). SZÓSTY obszar, `bar:'rail'` —
     wzorem Laboratorium. Dwa powody, oba wprost z decyzji:
     1. ZAKRES JEST ROZŁĄCZNY ze ścieżką ostrą. Program ma ZNAĆ wszystkie jednostki ICVD, ale
        tam, gdzie stosuje się GRACE-3 i HINTS, rozpoznań się NIE MNOŻY. Własny obszar jest
        najmocniejszym możliwym zapisem tej rozłączności: atlas nie leży wewnątrz Diagnostyki,
        więc nie da się w niego wejść „po drodze" do manewru.
     2. NIE NA PASKU TELEFONU. Pasek ma cztery pozycje i wciągnięcie tam atlasu wypchnęłoby
        Profil — jedyne wejście do ustawień. Ten dokładny błąd już raz popełniono, gdy pasek
        brał pierwsze cztery pozycje listy; dlatego pole `bar` jest jawne (patrz nagłówek). */
  { id:'atlas',   pl:'Atlas',        en:'Atlas',       bar:'rail', ico:ICO.atlas,
    plDesc:'Jednostki ICVD i kryteria',      enDesc:'ICVD entities and criteria' },
  { id:'profile', pl:'Profil',       en:'Profile',     bar:'both', ico:ICO.profile,
    plDesc:'Język, ruch, informacje',        enDesc:'Language, motion, about' },
];

/* (USUNIĘTE 2026-08-08) `AREA_IDS` — lista identyfikatorów obszarów. Wyrocznie i nawigacja czytają
   `AREAS` wprost (razem z etykietami), więc sama lista kluczy nie miała czytelnika. */
export const barAreas = () => AREAS.filter(a => a.bar === 'both');
export const areaById = (id) => AREAS.find(a => a.id === id) || AREAS[0];
