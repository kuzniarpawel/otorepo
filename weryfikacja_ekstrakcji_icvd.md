# WERYFIKACJA EKSTRAKCJI ICVD — ZAPIS KONTROLI

Towarzyszy `przesiew_icvd.md`: tamten mówi, **co znaleziono i co z tym zrobić**, ten mówi,
**czym to sprawdzono**. Napisany na gałęzi `claude/icvd-diagnostic-criteria-203f6a`, **stoi na `main`
od commita `24d9518`** (2026-08-22) — razem z `przesiew_icvd.md`.

Dokument NIE zmienia ani jednej linii kodu. Nie czyta go żadna bramka — jak `przesiew_icvd.md`,
jest zapisem dla człowieka. Lustra EN świadomie nie ma, z tego samego powodu co przy `przesiew_icvd.md`:
to dokument roboczy przesiewu, a nie warstwa produktu.

---

## 1. PO CO TEN PLIK ISTNIEJE

Przesiew ICVD stoi na 19 ekstrakcjach pełnych tekstów. Każda przeszła osobną weryfikację
adwersaryjną, ale **zarówno ekstrakcje, jak i zapisy weryfikacji leżą poza repozytorium** —
w katalogu korpusu, razem z pełnymi tekstami, których do publicznego repo wrzucić nie wolno
(patrz §2). Do tej pory oznaczało to, że repozytorium **twierdzi**, iż kryteria sprawdzono
u źródła, a dowód stoi obok, niewersjonowany.

Przy zwykłej notatce roboczej to nie boli. Zabolało, gdy **dług został zamknięty**: 2026-08-21
powtórzono przerwaną wcześniej weryfikację AUVP, a jedynym śladem w historii repozytorium było
siedem linii w `przesiew_icvd.md` mówiących „zrobione". Commit `5a93ea1`, który tego samego dnia
zamykał drugi dług, niósł artefakt wykonywalny (nowy przypadek złotego wzorca + sekcja bramki);
commit dokumentacyjny niósł samo zapewnienie. Ta asymetria jest powodem powstania tego pliku.

**Zasada na przyszłość:** zamknięcie długu weryfikacyjnego zapisuje się TUTAJ, w repozytorium —
razem z liczbami, nie tylko z werdyktem. Ekstrakcje zostają w korpusie; zapis kontroli wraca do repo.

---

## 2. GRANICA LICENCYJNA — CO TU JEST, A CZEGO NIE MA

`otorepo` jest publicznym repozytorium. Z 19 dokumentów konsensusu trzy (Bisdorff 2009,
López-Escámez 2015, von Brevern 2015) niosą w PDF „IOS Press and the authors. All rights reserved" —
wolne do czytania, ale **bez otwartej licencji**; pozostałe to CC BY-NC 4.0, Kaski 2025 CC BY.

Obowiązuje więc ta sama reguła co dla bazy wiedzy: **kryteria się parafrazuje, progi liczbowe
i strukturę logiczną oddaje dokładnie (to fakty, nie ekspresja), prozy się nie przedrukowuje.**

Ten dokument jest **pomiarem własnym**: liczby trafień, numery wierszy, werdykty. Cudzych słów
niesie tyle, ile trzeba, żeby pomiar dało się powtórzyć — **krótkie ciągi wyszukiwania**, po których
sięga się `grep`em. Nie ma tu ani jednego akapitu źródła.

**Czego tu nie ma i gdzie to jest:** pełne teksty (`zrodla-pelny-tekst/`), ekstrakcje z kryteriami
punkt po punkcie (`ekstrakcje/`) oraz zapisy weryfikacji pozostałych 18 prac — wszystko
w katalogu korpusu **poza repozytorium**, opisanym własnym `README.md`.

---

## 3. JAK ODTWORZYĆ POMIARY

Plik źródłowy: **`17-strupp2022-auvp.txt`**, 546 wierszy, 56 530 bajtów — pełny tekst pobrany
z Europe PMC (JATS `fullTextXML`) i przekonwertowany do tekstu z nagłówkami. Bibliografia w pliku
jest pominięta (znacznik `[[BIBLIOGRAFIA POMINIETA]]`), więc **numerów piśmiennictwa z niego nie
da się odczytać** — to jawna granica wszystkich pomiarów niżej.

Praca: Strupp M i wsp., *Acute unilateral vestibulopathy/vestibular neuritis: Diagnostic criteria*,
J Vestib Res 2022;32(5):389–406. **PMID 35723133 · PMC9661346 · DOI 10.3233/VES-220201.**
CC BY-NC 4.0. W bibliografii OTOREPO figuruje jako **[H47]**.

Ścieżka pozyskania jest skryptowa i powtarzalna (`narzedzia/harvest.mjs` w korpusie: odpytanie
Europe PMC po DOI → PMCID → `fullTextXML`). **Trasa, której nie ma sensu próbować:**
`content.iospress.com` odpowiada wyzwaniem Cloudflare — zabezpieczeń antybotowych się nie obchodzi.

**Dwie pułapki pomiarowe, obie zmierzone:**
1. **U+200A HAIR SPACE** rozdziela liczbę od jednostki w konwersji z JATS, więc `grep -F "100 Hz"`,
   `grep -F "3 mm"`, `grep -F "0.003 Hz"` dają **0 trafień**, mimo że fragmenty w pliku są.
   Potwierdzone wierszami: `100 Hz` 515 · `3 mm` 398 · `0.1 to 10 Hz` 364 · `0.003 Hz` 378 ·
   `< 6` 382 — we wszystkich pięciu separatorem jest hair space, nie zwykła spacja.
2. **Wielkość liter ma znaczenie tam, gdzie się jej nie spodziewasz.** `Up to 25%` stoi z wielkiej
   litery (w. 208), a nagłówek tabeli `Peripheral vestibular disorders` (w. 448) też — przez co
   wyszukiwanie wrażliwe na wielkość liter gubi trafienie, które istnieje. Wszystkie liczby
   w §4 policzono `grep -o -i`.

---

## 4. [H47] AUVP — WERYFIKACJA POWTÓRZONA I ZAMKNIĘTA (2026-08-21)

**Dlaczego powtórzona:** pierwsze podejście przerwał błąd API. Sprawdzono wtedy ręcznie wyłącznie
część rozstrzygającą dla decyzji D2 (kryteria A–F i oba miejsca z liczbami); reszta ekstrakcji
**nie przeszła kontroli**. Do 2026-08-21 była to jedyna z 19, która miała ten status.

**Metoda:** przeczytanie całego pliku źródłowego (546 wierszy) i całej ekstrakcji (1187 wierszy),
a następnie przeliczenie każdej liczby, którą ekstrakcja deklaruje — bez opierania się na pamięci.

### 4.1. Struktura kryteriów — bez zastrzeżeń

- **Cztery zestawy**, nagłówki w wierszach **92 / 122 / 152 / 180**; sekcja not ma numer **3.4.1**
  (w. 202), czyli formalnie jest zagnieżdżona pod „History of AUVP", choć obsługuje wszystkie cztery.
- **Liczba punktów:** 3.1 **A–F (6)** · 3.2 **A–F (6)** · 3.3 **A–F (6)** · 3.4 **A–E (5)**.
- **Preambuła koniunkcji** `Each of the following criteria have to be fulfilled` → **2 trafienia**,
  wiersze **94** i **124**. Sekcje 3.3 i 3.4 jej nie mają — teza ekstrakcji potwierdzona wprost.
- **Odsyłacze do not odtworzone bez pomyłki**, łącznie z tymi, które różnicują zestawy:
  3.1A ma **5 i 6**, 3.2A ma **6 bez 5**, 3.3A ma **5 bez 6**; 3.1B **bez noty 9**, a 3.2B i 3.3B
  **z notą 9**; 3.4C ma **17**, a nota **13** stoi przy 3.4B **oraz** przy 3.4D.
- **Nota 18 naprawdę nieprzywołana:** ciąg `18` w bloku kryteriów (w. 96–200) → **0 trafień**.
- **Numeracja cech ośrodkowych w 4.6.1 pomija „5"** — wiersz 479 biegnie 1, 2, 3, 4, **6**.

### 4.2. Trzy rozjazdy abstrakt ↔ tekst główny — wszystkie prawdziwe

| Rozjazd | Pomiar |
|---|---|
| „**pronounced** skew deviation" | `pronounced` → **1 trafienie, w. 44** (tylko abstrakt); tekst główny w. 114 pisze „no skew deviation" bez kwalifikatora |
| „**Unambiguous**" w History-C | `unambiguous` (bez rozróżnienia wielkości liter) → **6 trafień**: 44, 50, 106, 136, 244 ×2. Abstrakt (w. 50) je stawia, **tekst główny (w. 192) nie** |
| History-D rozbudowane w abstrakcie | `audiologic or otological` → **1** (w. 44, kryterium E) · `audiological or otological` → **1** (w. 50, History-D). Dwie różne pisownie, dwa różne miejsca — ekstrakcja rozdzieliła je poprawnie |

### 4.3. Wszystkie 38 zadeklarowanych liczb trafień — przeliczone, zgodne co do jednego

`central` 66 · `peripheral` 37 · `ICD` 0 · `ICHD` 0 · `H81` 0 · `treatment` 4 (w. 46, 88, 220, 224) ·
`steroid` 2 (224, 539) · `corticosteroid` 0 · `methylprednisolone` 0 · `antiviral` 0 · `aciclovir` 0 ·
`rehabilitation` 0 · `exercise` 0 · `prognos` 0 · `physical therapy` 1 (w. **11 — afiliacja autora,
nie treść**) · `HINTS` 9, z czego **0 w bloku kryteriów** i **1 w bloku not (w. 276) jako zwykłe
słowo „hints"** · `GRACE` 0 · `STANDING` 0 · `Dix-Hallpike` 0 · `Epley` 0 · `recommend` 3
(248, 324, 459) · `necessary` 4 (42, 236, 324, 358) · `gold standard` 1 (370) · `no definite test` 1 ·
`diagnosis of exclusion` 1 · `diagnosis after exclusion` 1 · `definite` 1 · `possible` 4
(86, 220, 252, 358) · `probable` 4 (42, 48, 88, 152 — wszystkie to nazwa kategorii) · `certain` 2
(88 = „uncertain", 324 = „certainty of the diagnosis") · `most often` 5 ·
`often but not always spared` 1 · `residual` 0 · `PPPD` 0 · `persistent postural` 1 ·
`functional dizziness` 2 · `secondary functional` 2 · `timing` 0 · `acute vestibular syndrome` 12.

Lista dokumentów ICVD we wstępie (w. 68) ma **14 pozycji** i **nie zawiera** „Vascular Vertigo
and Dizziness" — mimo że sekcja 4.3.3 (w. 330) odsyła do niego jako do istniejącego dokumentu
konsensusu. To rozjazd wewnątrz pracy, nie usterka ekstrakcji.

**Epidemiologia, przeliczona co do cyfry:** `3.5 to 15.5` 1 · `36,000` 1 · `sixth most common` 1 ·
`third most common` 2 · `30 and 60` 1 · `40 and 50` 1 · `1.9%` 1 · `10.7%` 1 · `13 out of 104` 1 ·
`162 patients` 1.

**Kontrola punktowa pięciu twierdzeń treściowych** (grep na frazie źródłowej, nie z pamięci):
`no gold standard to calculate gains` 1 · `There should also be saccades during the test` 1 ·
`ceases with the head tilted about 30` 1 · `a normal vHIT is not compatible with AUVP` 1 ·
`beating typically to the affected ear` 1.

### 4.4. Znalezione i poprawione — trzy usterki

**1. Fałszywe twierdzenie o silniku — jedyne znalezisko merytoryczne.**
Ekstrakcja pisała, że progu „< 6°/s dla sumy ciepłej i zimnej" silnik **nie implementuje**.
Implementuje: `CAL_BILAT = 6` w [`src/engine/neuro-vor.js:871`](src/engine/neuro-vor.js), z komentarzem
„suma ciepła+zimna DANEGO ucha < CAL_BILAT → osłabienie".

Prawdziwa różnica jest **węższa i ciekawsza**, więc weszła w miejsce zdania błędnego: silnik czyta
tę liczbę **wyłącznie jako warunek OBUSTRONNY** (`bilateralWeak = cR<CAL_BILAT && cL<CAL_BILAT`,
w. 906), a [H47] §4.4.2 podaje ją jako **alternatywną definicję niedowładu JEDNOSTRONNEGO**, obok
„> 25% asymetrii". Chory z jednym uchem poniżej 6°/s i drugim prawidłowym spełnia definicję pracy,
a `bilateralWeak` go nie zobaczy — złapie go dopiero `CP_THRESH`, i to inną drogą (stosunek,
nie wartość bezwzględna). To jest kandydat na rozszerzenie, nie na cichą podmianę liczby.

**2. Odsyłacz do złego pliku.** „nota przy `directionChanging`, w. 730" wskazywała `engine_doc.txt`;
nota jest w [`src/engine/neuro-vor.js:730`](src/engine/neuro-vor.js). W `engine_doc.txt`
`directionChanging` stoi w wierszach **2262, 2266 i 2685**, a wiersz 730 tego pliku to zapis
walidacji odwrócenia oczopląsu przy siadaniu — czyli czytelnik trafiłby na treść z zupełnie innej osi.

**3. Usterka gramatyczna** w parafrazie noty 18 („kryteria jednostronnego niedoczynności" →
„jednostronnej"). Treść bez zmian.

### 4.5. Czego NIE ruszyłem, mimo że wyglądało podejrzanie

Deklaracja `peripheral vestibular disorders` **×5 (w. 52, 286, 448, 495, 497)** wygląda na błąd,
bo wyszukiwanie wrażliwe na wielkość liter daje **4**. Wiersz **448** to jednak nagłówek Tabeli 1
pisany **wielką literą**, a ekstrakcja jawnie deklaruje wyszukiwanie `grep -o -i`. Liczba jest
poprawna — **to moja sonda była nie ta.** Zapisane, bo kontrola, która sama się myli i tego nie
odnotowuje, jest gorsza od braku kontroli.

### 4.6. Kotwice do kodu — 13 z 13 sprawdzonych

Wszystkie odsyłacze ekstrakcji do plików programu sprawdzono wprost na commicie bazowym gałęzi
(`5035f09`): presety `neuritisR/L` w. 926–929 · `GAIN_CUT` w. 431 · `CP_THRESH` w. 872 ·
`BVP_CUT` w. 694 · oś słuchowa w. 87 · `labyrinthitisR` 959–962 · `aicaR` 963–967 · `utricleR` 981 ·
komunikat neuronitis nerwu dolnego w. 1339 · `svg-screens.js` 2276 i 3571 · `hints-model.js` 208–209 ·
`maneuvers.js` 1469 · `triage-model.js` 16 i 252. Zgadzają się wszystkie **poza pozycją 1 z §4.4**.

Zweryfikowano też oba pomiary „zera": `AUVP|unilateral vestibulopathy` w `engine_doc.txt` i `src/`
→ **0 trafień**, najwyższy numer bibliografii → **[H46]**. Slot `[H47]` był wolny, tak jak ekstrakcja
twierdzi; numer nadał tej pracy dopiero etap E0.

### 4.7. Decyzja D2 — sprawdzona u źródła i UTRZYMANA W MOCY

Nota 12 (w. **252**) i §4.4.1 (w. **370**) odpowiadają na **różne pytania**, więc spór „alternatywa
czy koniunkcja" był źle postawiony. Kryterium C nie zawiera żadnej z tych liczb — brzmi jakościowo.
Nota 12 poprzedza swoje liczby zdaniem, że **ogólnej zgody co do wartości odcięcia nie ma** i że
trzeba opierać się na normach pracowni, a sama nazywa je „working approximation". Warunek, którego
nie miało żadne ze zgłoszonych czytań — `There should also be saccades during the test` —
potwierdzony jako obecny **dokładnie raz**, w §4.4.1.

Wniosek zapisany w `przesiew_icvd.md` (§4.1, D2) jest wierny źródłu i nie wymaga zmiany.
**Żaden z tych progów nie wchodzi do silnika jako kryterialny — i to jest zalecenie pracy, nie nasz wybór.**

---

## 5. POZOSTAŁE 18 EKSTRAKCJI

Każda przeszła osobną weryfikację adwersaryjną wobec swojego pliku źródłowego, w tym samym trybie:
przeliczenie punktów kryteriów, kontrola progów co do cyfry, kontrola spójników logicznych,
wyrywkowa kontrola twierdzeń treściowych grepem. Werdykty były w większości „poprawione" — czyli
weryfikacja realnie łapała błędy, a nie przyklepywała.

**Zapisy tych kontroli leżą w katalogu korpusu, poza repozytorium** (sekcje `== KOREKTY
WERYFIKATORA ==` na końcu każdej ekstrakcji). Nie przenoszę ich tutaj hurtem: ten dokument powstał,
żeby domknąć konkretny dług, a nie żeby zduplikować korpus. Jeśli któraś z tych kontroli będzie
kiedyś podstawą decyzji zapisanej w repozytorium, jej pomiary trafią tu tą samą drogą co §4.

---

## 6. CO Z TEJ WERYFIKACJI WYNIKA DLA REPOZYTORIUM

1. **`CAL_BILAT` jako kandydat na rozszerzenie** (§4.4 pkt 1) — silnik ma liczbę [H47], ale czyta ją
   węziej niż praca. To nie jest usterka do cichej naprawy: zmiana dotknęłaby `bilateralWeak`,
   czyli osi obustronności, więc wymaga decyzji, a nie podmiany progu.
2. **Uzasadnienie w commicie E1 (`ae36e0a`) było nieścisłe.** Podawało jako dowód „0 trafień
   headhang/anterior/przedni wśród kluczy złotego wzorca". Klucze `diag/headhang/{P,L}/cupulo`
   w golden **były**; nie zawierały karty klasyfikacji, bo bez opisu obserwacji `renderDiag`
   renderuje `kartaBezOpisu`. Luka była realna, ale w innym miejscu, niż ją opisano — i to
   przesądziło o kształcie poprawki w commicie `5a93ea1`.
3. **Zapis weryfikacji jest tańszy niż jej powtarzanie.** Pierwsze podejście przerwał błąd API
   i nie zostawiło zapisu — więc kontrolę trzeba było wykonać od początku, w całości. Drugie
   kosztowało tyle samo, z tą różnicą, że jego wynik leży teraz w historii repozytorium.
