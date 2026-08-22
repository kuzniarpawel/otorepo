# PRZESIEW OTOREPO WOBEC KRYTERIÓW ICVD BÁRÁNY SOCIETY

Dokument roboczy gałęzi `claude/icvd-diagnostic-criteria-203f6a`. Powstał 2026-08-21 z kwerendy
**wszystkich 19 dokumentów konsensusu i stanowisk ICVD** wymienionych na stronie Bárány Society,
przeczytanych w pełnym tekście pierwotnym.

Dokument NIE zmienia ani jednej linii kodu. Jest wejściem do decyzji użytkownika i mapą etapów.

---

## 1. STAN KWERENDY

**19 z 19 prac w pełnym tekście pierwotnym.** Razem 811 tys. znaków źródła, 1,42 MB ekstrakcji.

| Kanał pozyskania | Prace |
|---|---|
| Europe PMC (JATS full text) | 15 prac: 05–19 |
| PDF wydawcy przez Wayback Machine | 04 von Brevern 2015 (BPPV) |
| Publicznie wystawiona kopia PDF wydawcy | 03 López-Escámez 2015 (Ménière) |
| PDF dostarczony przez użytkownika | 01 Bisdorff 2009, 02 Lempert 2012 |

Licencje: 18 prac **CC BY-NC**, Kask 2025 **CC BY**. Kryteria wolno w programie **parafrazować**,
nie przedrukowywać — tak jak zrobił to etap V28 dla migreny przedsionkowej.

Każdą ekstrakcję sprawdził **osobny agent adwersaryjny** wobec pliku źródłowego (liczenie punktów
kryteriów, kontrola progów co do cyfry, kontrola spójników logicznych, wyrywkowa kontrola pięciu
twierdzeń grepem). Werdykty: większość „poprawione" — czyli weryfikacja realnie łapała błędy,
a nie przyklepywała. Jedna weryfikacja (AUVP) padła wtedy na błędzie API; **powtórzona
i zamknięta 2026-08-21** — trzy usterki znalezione i poprawione, w tym jedno fałszywe twierdzenie
o silniku (rzekomy brak progu kalorycznego `< 6°/s`, który silnik ma jako `CAL_BILAT`, tyle że
czyta go wyłącznie obustronnie). Rozstrzygnięcie D2 sprawdzone u źródła i utrzymane w mocy.

Materiał leży TRWALE w `Otorepo_code/icvd-korpus/` (poza repozytorium — licencje; katalog ma
własny `README.md`): `zrodla-pelny-tekst/` · `ekstrakcje/` (19 plików `NN-*.md`) ·
`mapa-programu/` (5 audytów) · `konflikty/` (4 pliki) · `plany/` · `narzedzia/`.
**Zapis samej kontroli wrócił do repozytorium:** `weryfikacja_ekstrakcji_icvd.md`.

---

## 2. CO POKAZAŁ POMIAR

Trzy liczby, wszystkie zmierzone grepem po repozytorium, nie oszacowane:

> **469** miejsc w programie wypowiada się o jednostce chorobowej albo o kryterium rozpoznania.
> **386 z nich (82%) nie ma przy sobie numeru źródła `[Hnn]`.**
> **10 z 16 jednostek ICVD nie istnieje w programie w ogóle** — zero trafień nazwy.

Rozkład miejsc bez źródła wg obszaru:

| Obszar | Miejsc | Bez źródła | Uwaga |
|---|---:|---:|---|
| Napisy kliniczne | 136 | 124 | warstwa, którą czyta klinicysta |
| Kwalifikacja / triage | 104 | 97 | **zero numerów w napisach widzianych przez klinicystę** |
| NeuroVOR / HINTS | 95 | 64 | tu są progi ilościowe |
| BPPV / manewry | 69 | 64 | rdzeń aplikacji |
| Dokumentacja / baza wiedzy | 65 | 37 | bibliografia [H1]–[H46] |

**Jednostki ICVD nieobecne w programie (0 trafień):** PPPD · presbywestybulopatia ·
mal de débarquement · choroba lokomocyjna · hemodynamiczne zawroty ortostatyczne ·
zawroty szyjne · migrena przedsionkowa wieku dziecięcego · napadowica przedsionkowa
(1 wzmianka, bez własnego źródła) · klasyfikacja objawów Bisdorffa · klasyfikacja oczopląsu Eggersa.

To **nie jest zarzut** — OTOREPO jest aplikacją o BPPV i ostrych zawrotach, nie atlasem otoneurologii.
Ale różnica między „świadomie poza zakresem" a „nie wiedzieliśmy, że istnieje" jest decyzją, którą
trzeba podjąć jawnie, jednostka po jednostce. To treść etapu **E6**.

---

## 3. SZEŚĆ ZNALEZISK, KTÓRE ZMIENIAJĄ PRIORYTETY

### 3.1. Kryteria BPPV — rodowód „pamięć otoneurologiczna", a karta LICZY

Potwierdzone w trzech niezależnych miejscach:
- `view_doc.txt:39-40` i lustro EN: *„Kryteria: pamięć otoneurologiczna «BPPV — kryteria Bárány 2015»"*
- `todo.txt:279` — rozszerza ten rodowód **także na czerwone flagi CPN**
- `src/pose/maneuvers.js:1647-1648` — *„dawny odnośnik «engine_doc: KRYTERIA BARANY» wskazywał sekcję, której nie ma"*

Ciąg `von Brevern` w całym repo: występuje wyłącznie przy pracy z **2007** (epidemiologia strony),
nigdy przy pracy z 2015. **Praca, na której stoi cała klasyfikacja podtypów, nie ma numeru `[Hnn]`.**

Dodatkowo `tools/barany-check.mjs:13-14` parafrazuje kryteria i odsyła do tej samej nieistniejącej
sekcji — czyli **bramka pilnuje zgodności z dokumentem, którego nie ma**.

To ta sama dziura, którą V28 zamknął dla migreny przedsionkowej — tyle że pod funkcją rdzeniową,
a nie pod kartą pomocniczą. **Etap E1.**

### 3.2. Czerwone flagi CPN — sześć kryteriów, dwa pliki, zero źródeł, i BLOKUJĄ LECZENIE

`svg-screens.js:2675-2680` oraz `obs-model.js:505-513` niosą **tę samą treść w dwóch niezależnych
literałach**: brak latencji / uporczywy / niemęczliwy / czysto pionowy lub skrętny / pozycja
neutralna / objawy neurologiczne. Flagi są **wyliczane** przez `flagi()` i **blokują kartę leczenia**.

Ciąg `Eggers` w całym worktree: **0 trafień** — mimo że to jest dokładnie treść dokumentu
klasyfikacji oczopląsu ICVD (Eggers 2019, 114 tys. znaków, najbogatsze źródło w korpusie).

Najwyższe ryzyko kliniczne w całym przesiewie: **twierdzenie, które zatrzymuje leczenie, nie ma
źródła i istnieje w dwóch kopiach, które mogą się rozejść.** Etap E2.

### 3.3. Oś progów ilościowych pęka najmocniej — funkcja kanału poziomego

Trzy prace ICVD definiują **ten sam ubytek** trzema różnymi liczbami, na trzech różnych
statystykach, przy trzech różnych albo **niepodanych** protokołach bodźca:

| Praca | Próg gain vHIT | Statystyka |
|---|---|---|
| BVP 2017 `[H19]` | < 0,6 | suma maksimów |
| Presbywestybulopatia 2019 | 0,6–0,8 | suma średnich |
| AUVP 2022 | < 0,7 | pojedyncza odpowiedź |

Silnik ma dziś `BVP_CUT = 0.6` **oraz** `GAIN_CUT {HC 0.8, pionowe 0.7}` opisane jako
„McGarvie 2015 (bez numeru w tej bibliografii)". Trzy liczby w źródłach, dwie w silniku, żadna
nie jest wprost przypisana do właściwego dokumentu ICVD. **Etap E3, wymaga decyzji użytkownika.**

### 3.4. AUVP 2022 przeczy sama sobie

Ta sama praca podaje kryterium instrumentalne dwa razy: **nota 12 jako alternatywę**, a **§4.4.1
jako koniunkcję z trzecim warunkiem**. To dwa różne zbiory pacjentów. Konflikt jest
**wewnątrz jednego dokumentu**, więc nie da się go rozstrzygnąć wyborem „nowszej pracy".

### 3.5. Silnik daje kanałowi przedniemu napad 61,25 s, a kryterium 3.1 C żąda < 1 min

Zmierzone: `npm run barany:check` 49/49 zielone, kanał tylny 42,00 s, poziomy 41,40 s,
**przedni 61,25 s**. Chip mówi „Przemijający (≈1 min)" — bramka została świadomie napisana tak,
by to przepuścić (werdykt kliniczny 2026-08-14, fizyka emergentna).

Teraz jest źródło, którego wtedy nie było: kryterium 3.1 C mówi **„< 1 min"**. To nie jest błąd
fizyki — to jawna rozbieżność między modelem a kryterium, którą trzeba albo nazwać w karcie,
albo rozstrzygnąć. **Wymaga decyzji.**

### 3.6. Silnik nadaje tier „emerging" podtypowi, który praca JAWNIE WYKLUCZA

`baranyClassify` przypisuje kupulolitiazie kanału przedniego status „zespół wyłaniający się",
podczas gdy von Brevern 2015 tę postać **jawnie wyklucza**. „Emerging" znaczy w tej pracy
„opisany, ale niedostatecznie potwierdzony" — nie „odrzucony". To **błąd etykiety**, nie fizyki.

---

## 4. KONFLIKTY MIĘDZY PRACAMI — 75 pozycji

Rozkład: **34 twarde** (prace mówią rzeczy wzajemnie sprzeczne) · **35 napięć** (da się pogodzić,
ale wymaga jawnej decyzji redakcyjnej) · **6 następstw** (praca późniejsza świadomie zmienia
wcześniejszą — to nie konflikt, to wersja, ale trzeba wiedzieć, którą cytować).

Pełne opisy z obiema stronami, liczbami i wariantami rozstrzygnięcia: `icvd-korpus/konflikty/`.

### 4.1. Decyzje BLOKUJĄCE — bez nich nie da się napisać bazy wiedzy

| # | Konflikt | Warianty |
|---|---|---|
| **D1** | **Próg gain vHIT: 0,6 / 0,7 / 0,6–0,8** (§3.3) | (a) próg per jednostka, z jawnym wskazaniem pracy przy każdym; (b) jeden próg silnika + nota o rozrzucie; (c) próg per jednostka **i** ostrzeżenie, że statystyki nie są porównywalne |
| ~~**D2**~~ | ~~**AUVP: alternatywa czy koniunkcja**~~ — **ROZSTRZYGNIĘTE 2026-08-21** | **Pytanie okazało się źle postawione.** Po przeczytaniu obu miejsc wraz z kryteriami: **żadna z tych liczb nie jest kryterium**. Kryterium C brzmi jakościowo („jednoznaczny dowód obniżonej czynności VOR") i nie zawiera liczby; komitet wprost mówi, że **nie ma zgody co do wartości odcięcia** i że trzeba opierać się na **normach pracowni**. Nota 12 sama nazywa swoje liczby „working approximation". Oba czytania odpowiadają przy tym na **różne pytania** (patologia w obu badaniach vs istotny ubytek w samym vHIT). Zapisane jako przybliżenia robocze; **żaden próg nie wchodzi do silnika jako kryterialny** — i to jest zalecenie pracy, nie nasz wybór. Wyszedł przy okazji warunek, którego nie miało żadne ze zgłoszonych czytań: **„powinny też wystąpić sakady"**. |
| **D3** | **„Probable" znaczy w ICVD co najmniej siedem różnych rzeczy** — w dwóch pracach tego samego pierwszego autora znaczy rzeczy **przeciwne** (BVP 2017: dodatnie znalezisko przyłóżkowe; AUVP 2022: **brak** znaleziska) | (a) nie tłumaczyć jednym słowem — każda jednostka niesie własną definicję; (b) wprowadzić słownik OTOREPO i jawnie odstąpić od terminu źródła; (c) używać wyłącznie cytatu z konkretnej pracy |
| **D4** | **Kanał przedni 61,25 s vs kryterium „< 1 min"** (§3.5) | (a) nazwać rozbieżność w karcie i zostawić fizykę; (b) przestroić model; (c) zmienić chip na wartość zgodną z kryterium |
| **D5** | **Geometria testu Roll: 30° (ICVD) vs 10,3° (silnik)** — a **30° niesie mechanizm** pseudo-samoistnego oczopląsu | (a) utrzymać 10,3° z notą, że ICVD podaje 30°; (b) wrócić do 30°; (c) rozdzielić: 30° jako poza kliniczna, 10,3° jako oś kanału |

**D5 dotyka rozstrzygnięcia, które już raz zapadło** (pomiar silnika: optimum przy +10,30°,
przy 30° strata 5,9–14,5%; rodowód kanonu 30° uznany za kaloryczny). Nowa okoliczność: kryteria
ICVD podają 30°, a przy tym kącie działa mechanizm, którego przy 10,3° nie ma. Warto rozstrzygnąć
ponownie, mając teraz źródło pierwotne.

### 4.2. Decyzje ZAKRESOWE — co w ogóle wchodzi do programu

| # | Pytanie | Uwaga |
|---|---|---|
| **D6** | Które z 10 nieobecnych jednostek ICVD wchodzą do programu, a które zostają **jawnie poza zakresem**? | Najsilniejsi kandydaci: **napadowica przedsionkowa** (jest już w bloku wykluczeń migreny, bez własnego źródła), **PPPD** (domyka warstwę zawrotów resztkowych `[H26]`), **hemodynamiczne ortostatyczne** (kryterium D BPPV wprost każe je odróżnić) |
| **D7** | Czy nadawać numer `[Hnn]` pracy Lempert 2012, skoro cytujemy 2022? | Wersja 2012 przydaje się jako **dowód**, nie jako źródło cytowania |
| **D8** | Czy „zawroty szyjne" (stanowisko Seemungala) mają trafić do programu, skoro program ma okablowanie karku (B8)? | Stanowisko **neguje** jednostkę; program nie stawia takiego rozpoznania — ale liczy pozy z pivotem karku |

### 4.3. Konflikty do rozstrzygnięcia przy pisaniu rozdziałów (nie blokują startu)

Wybrane z 75; reszta w plikach:

- **Ménière 12 h vs 24 h** — lepiej udokumentowany chory dostaje **niższy** stopień pewności
- **Liczba wymaganych epizodów: 2 / 3 / 2–4 / 5 / 10** — nierówna poprzeczka dowodowa dla tego samego wywiadu
- **Dwa różne zegary** — migrena liczy obwiednię serii napadów, BPPV i napadowica pojedynczy napad;
  ten sam chory z sekundowymi zawrotami pozycyjnymi spełnia oba kryteria czasu **jednocześnie**
- **„Przewlekły": 3 miesiące / 1 miesiąc / brak progu**
- **Pas 19–25% asymetrii kalorycznej jest niczyj** (19% jeszcze norma, > 25% patologia)
- **Męczliwość** — u ICVD cecha peryferyjna, u Eggersa **trop ośrodkowy**; silnik używa jej jako różnicownika mechanizmu
- **Pętla wykluczeń**: ten sam chory spełnia „prawdopodobne BPPV, które ustąpiło samoistnie" **i** „prawdopodobną napadowicę przedsionkową"
- **Błąd atrybucji do naprawy**: reguła pierwszeństwa Ménière'a nad migreną — sprawdzić, czy karta
  `vmCriteriaCard` przypisuje ją właściwej pracy

---

## 5. PLAN ETAPÓW

Zasady wspólne, wzięte z dyscypliny projektu (V27/V28):
- **jeden etap = jeden commit = jedna rzecz**; poprawka merytoryczna oddzielona od poprawki tekstu,
  żeby było widać, że fizyka się nie ruszyła (wzorzec `7d48018` + `24fd779`);
- **dowód zakresu przy każdym etapie**: `snapshot:check` z wyliczeniem, które klucze zapalono
  i dlaczego **żaden** nie leży w warstwie fizyki, o ile etap fizyki nie dotyczy;
- **arytmetyka `zrodla:check` rozpisana w komentarzu stałej**, policzona przez `--ile`, nie oszacowana;
- kryteria **parafrazowane** (CC BY-NC);
- **granice źródła zapisywane razem z treścią** — czego praca NIE mówi jest równie cenne.

---

### E0 — Fundament bibliograficzny · *bez zmian klinicznych*

**Cel.** Nadać numery `[H47]`–`[H62]` szesnastu dokumentom ICVD, których w bibliografii nie ma,
i uzupełnić dwa istniejące wpisy (`[H19]`, `[H20]`) o treść kryteriów, której nie niosą.

**Wejście.** 19 ekstrakcji z metadanymi zweryfikowanymi w rejestrach (PMID, DOI, PMC, licencja).

**Produkt.** Wpisy w `engine_doc.txt` i `engine_doc.en.txt`. Zero zmian w `src/`.

**Dowód.** `snapshot:check` — **0 zapalonych kluczy** (dokumentacja nie jest w golden).
`zrodla:check` rośnie o policzoną liczbę. Pozostałe bramki bez zmian.

**Pułapka do uniknięcia — zabramkowana już w V28b.** Zawijanie akapitu tak, by `[Hnn]` wypadło
w kolumnie 0, **cicho podmienia definicję źródła przy zielonej bramce**. Reguły BIB4 (monotoniczność)
i BIB5 (kształt) tego pilnują — ale przy dopisywaniu 16 wpisów naraz ryzyko rośnie, więc
`zrodla:check` uruchamiać po **każdym** wpisie, nie na końcu.

**Zależności.** Żadne. To musi być pierwsze.

---

### E1 — BPPV: spłata długu podstawowego · *najwyższy priorytet merytoryczny*

**Cel.** Postawić kryteria von Brevern 2015 tam, gdzie program już dziś twierdzi, że je stosuje.

**Zakres.**
1. Rozdział `KRYTERIA BPPV` w `engine_doc.txt` — **sekcja, na którą od dawna wskazują trzy odsyłacze,
   a której nie ma.** Wszystkie podtypy sekcji 2 (ustalone) i 3 (wyłaniające się), z kryteriami
   A/B/C i **kompletem przypisów numerowanych** (przypisy niosą połowę treści klinicznej:
   latencja do 40 s, nota o apogeotropowej kanalolitiazie, nota o czasie trwania).
2. `[Hnn]` przy `baranyClassify`, przy karcie „Klasyfikacja wg Bárány (ICVD)" (`svg-screens.js:2670`)
   i w `tools/barany-check.mjs`.
3. **Usunięcie rodowodu pamięciowego** z `view_doc.txt:39-40`, lustra EN i `todo.txt:279` —
   zastąpienie go odsyłaczem do pracy.
4. Naprawa etykiety tier dla kupulolitiazy kanału przedniego (§3.6).

**Dowód.** `snapshot:check` — spodziewane klucze wyłącznie `dom/diag/*`; **zero kluczy
`engine`/`pose`**. `barany:check` musi zostać zielony **bez rebaseline** — jeśli zapali się na
etykiecie tier, to jest właśnie ten błąd i ma się zapalić.

**Do decyzji przed startem:** D4 (kanał przedni), D5 (geometria Roll).

---

### E2 — Oczopląs: Eggers 2019 pod czerwone flagi CPN · *najwyższe ryzyko kliniczne*

**Cel.** Podeprzeć źródłem sześć kryteriów, które **blokują leczenie**, i usunąć drugą kopię.

**Zakres.**
1. Rozdział klasyfikacji oczopląsu w bazie wiedzy — zakres ograniczony do tego, czego program używa:
   oczopląs pozycyjny, samoistny, wywołany spojrzeniem, po potrząsaniu głową, tłumienie fiksacją.
2. `[Hnn]` przy flagach w `svg-screens.js:2675-2680` **i** `obs-model.js:505-513`.
3. **Jedno źródło zamiast dwóch literałów** — wzorzec z V28c (`vmCriteriaCard` wołana z dwóch
   ekranów, zero drugiego literału): rozjazd treści ma być **strukturalnie niemożliwy**,
   a nie pilnowany czujnością.
4. Nazewnictwo: Eggers odradza „headshaking nystagmus" i ogranicza „Bruns" — sprawdzić, czy
   program używa terminów odradzanych.

**Dowód.** `obs:check` i `interp:check` **nietknięte i zielone** — flagi mają liczyć to samo,
zmienia się źródło i miejsce definicji, nie logika. `snapshot:check` — klucze `dom/obs/*`, `dom/diag/*`.

**Do decyzji przed startem:** konflikt męczliwości (cecha peryferyjna vs trop ośrodkowy) —
to jest różnicownik, którego silnik **używa**.

---

### E3 — Progi ilościowe NeuroVOR · *wymaga decyzji D1 i D2*

**Cel.** Przypisać każdemu progowi silnika właściwy dokument ICVD albo jawnie nazwać, że progu
w ICVD nie ma.

**Zakres.** `GAIN_CUT`, `BVP_CUT`, `CAL_BILAT`, `VEMP_AR`, progi kaloryczne i fotela obrotowego.
Nazwiska bez numeru do rozstrzygnięcia: **McGarvie 2015**, **Rosengren 2019**, **Lee 2006**,
**Lacour 2020** — każde albo dostaje `[Hnn]`, albo znika jako cytat.

**Dowód.** **Fizyka bit-w-bit** — jeśli decyzja D1 nie zmienia liczb, `snapshot:check` ma dać
diff pusty, a ruszyć wyłącznie tekst. Wzorzec V27a/V27b: poprawka merytoryczna **darmowa**.
Jeśli D1 zmienia liczbę — rebaseline z dowodem zakresu i osobnym commitem.

---

### E4 — Ménière i AUVP: treść kryteriów pod istniejące numery

**Cel.** `[H19]` i `[H20]` istnieją, ale **treści kryteriów nie niosą** (zmierzone: `30 dB` 0 trafień,
`20 min` 0, `12 h` 0). Program liczy `meniere()` jako model tonu, nie jako model kryteriów.

**Zakres.** Rozdziały kryterialne dla obu jednostek + rozstrzygnięcie D2 dla AUVP + zmiana nazwy
(zapalenie nerwu → AUVP; oba terminy dozwolone, skrót niestabilny).

---

### E5 — Kwalifikacja wstępna: 97 miejsc bez źródła

**Cel.** Warstwa, którą klinicysta czyta **jako pierwszą**, ma dziś **zero numerów źródeł**
w napisach. Twierdzenia mocne klinicznie („ataksja chodu przemawia za przyczyną ośrodkową",
progi czasowe, okno 48–72 h) stoją bez odsyłacza.

**Zakres.** Przypisanie źródeł: GRACE-3 `[H24]` tam, gdzie to GRACE-3; Kim 2022 (naczyniowe)
tam, gdzie czerwone flagi; Bisdorff 2009 pod progi czasowe i nazwy objawów.

**Uwaga zmierzona:** kwestionariusz **nigdy nie pyta o czas od początku objawów**, a okno
stosowalności GRACE-3 („poniżej 2 tygodni") stoi wyłącznie w komentarzu. To luka logiczna,
nie tylko brak źródła.

---

### E6 — Decyzja zakresowa: jednostki nieobecne · *wymaga D6*

**Cel.** Dla każdej z 10 nieobecnych jednostek zapisać **jawnie**: wchodzi / poza zakresem —
i dlaczego. Sam zapis „świadomie poza zakresem" jest produktem: odróżnia decyzję od przeoczenia.

---

### E7 — Słownik objawów Bisdorffa i harmonizacja nazewnictwa · *ostatni, bo najszerszy*

**Cel.** Program nazywa objawy własnymi konwencjami. Bisdorff 2009 ma **31 pozycji słownika
i 25 terminów jawnie odrzuconych**. Zmierzone: **co najmniej osiem prac późniejszych ICVD samo
używa terminów z listy odrzuconych** — więc to nie jest wada wyłącznie naszego programu i nie
należy udawać, że da się to domknąć cytatem.

**Uwaga:** w korpusie **nie ma dokumentu harmonizacyjnego** (etap ID z Tabeli 1 Bisdorffa),
a Kask 2025 mówi o „poziomach pewności diagnostycznej" **nie nazywając ich**. Każde rozstrzygnięcie
tego etapu będzie **decyzją redakcyjną OTOREPO, nie cytatem** — i tak trzeba je opisać.

---

## 6. CZEGO TEN PLAN NIE OBEJMUJE

- **Nie modeluje nowych jednostek fizycznie.** Wzorzec V28: karta kryteriów niczego nie liczy
  i nie stawia rozpoznania. Dodanie kryteriów ≠ dodanie silnika.
- **Nie rozstrzyga konfliktów za użytkownika.** 75 pozycji czeka na decyzje; plan nazywa te,
  które blokują.
- **Nie rusza fizyki**, poza etapem E1 pkt 4 (etykieta tier) i ewentualnie D4/D5, jeśli decyzja
  tak każe.
- ~~**Nie obejmuje weryfikacji AUVP**, która padła na błędzie API — do powtórzenia przed E4.~~
  **SPŁACONE 2026-08-21** — patrz §1. Pełny zapis kontroli, z liczbami trafień i numerami
  wierszy, stoi **w repozytorium**: `weryfikacja_ekstrakcji_icvd.md` §4. Zapis w ekstrakcji
  (sekcja `== KOREKTY WERYFIKATORA ==`, katalog korpusu) zostaje jako wersja przy materiale.
- **Nie zna dokumentów ICVD w przygotowaniu.** Kask 2025 wymienia jednostki bez opublikowanych
  kryteriów; program nie powinien ich wyprzedzać.

---

## 7. KOLEJNOŚĆ I ZALEŻNOŚCI

```
E0 (fundament)  ──┬──> E1 (BPPV)     ──> E2 (oczopląs)
                  ├──> E4 (Ménière/AUVP)
                  ├──> E5 (kwalifikacja)
                  └──> E3 (progi)  [czeka na D1, D2]
                                   E6 (zakres) [czeka na D6]
                                   E7 (słownik) — ostatni
```

E0 musi być pierwszy. E1 i E2 są sprzężone (oba dotyczą karty diagnostyki), ale E1 pierwszy,
bo E2 korzysta z jego rozdziału. Reszta jest równoległa.

**Merge do `main`** — po weryfikacji użytkownika, zgodnie z ustaleniem otwierającym.
