# PRZESIEW OTOREPO WOBEC KRYTERIÓW ICVD BÁRÁNY SOCIETY

Powstał 2026-08-21 z kwerendy **wszystkich 19 dokumentów konsensusu i stanowisk ICVD** wymienionych
na stronie Bárány Society, przeczytanych w pełnym tekście pierwotnym. Napisany na gałęzi
`claude/icvd-diagnostic-criteria-203f6a`, **od 2026-08-21 stoi na `main`** — scalenie fast-forward
`5035f09` → `b6e5203`, potem `24d9518`. Nie jest już dokumentem gałęzi roboczej, tylko zapisem
przesiewu w linii głównej.

Dokument NIE zmienia ani jednej linii kodu. Jest wejściem do decyzji użytkownika i mapą etapów.

**Konwencja aktualizacji.** Znaleziska i pomiary otwierające zostają w brzmieniu pierwotnym,
a to, co je zamknęło, dopisuje się obok — z datą i numerem commita. Zapis zmiany, nie zacieranie
śladu. Gdy pomiar późniejszy wyszedł **inaczej** niż otwierający, mówi się to wprost (§3.2).

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

### 1.1. STAN WYKONANIA — 2026-08-22

**Dwanaście commitów przesiewu na `main`**, `ee08f99`..`24d9518`, wypchniętych na `origin/main`
(commit, który dopisuje tę sekcję, jest trzynasty i sam niczego merytorycznie nie zmienia —
doprowadza ten dokument do zgodności z tym, co już się wykonało).

| Etap / decyzja | Commit | Co zrobił |
|---|---|---|
| **E0** | `ee08f99` | bibliografia `[H47]`–`[H61]` + rozdział MAPA POKRYCIA ICVD |
| **E1** | `ae36e0a` | rozdział KRYTERIA BPPV, `[H48]` przy trzech odsyłaczach, rodowód pamięciowy usunięty, etykieta tier naprawiona |
| **E4a** | `ca8a649` | kryteria Ménière'a pod istniejący pusty numer `[H20]` + naprawiony błąd atrybucji |
| **E5a** | `e446f1c` | dwie fałszywe komórki karty GRACE |
| **D-REP · D-ATX · D-CPN** | `1223f25` | trzy twierdzenia sprowadzone do brzmienia źródeł; nowy `src/app/cpn-model.js` |
| **D-MRI** | `96d9fa8` | interwał „48–72 h" (nasz, nie źródłowy) zastąpiony liczbami `[H58]` |
| **D2** | `4db7a97` | AUVP — rozstrzygnięcie, patrz §4.1 |
| **D-CZAS** | `b50d7d2` + `c3ebf18` | oś czasu sprowadzona do `[H61]`; piąte pytanie kwalifikacji + naprawa unieważnionych fikstur |
| **E1-DŁUG** | `5a93ea1` | luka golden domknięta, `barany:check` 49 → 61 |
| *(zapis)* | `b6e5203`, `24d9518` | oba długi opisane; `weryfikacja_ekstrakcji_icvd.md` wraca do repozytorium |

**Zostaje z planu:** **E2** (częściowo wyprzedzony przez D-CPN — patrz §3.2) · **E3** (reszta progów
po E3a) · **E4b** (AUVP) · **E5** (kwalifikacja) · **E7** (słownik).
**Domknięte po tej liście:** **E6** — Atlas otoneurologiczny, razem z rozstrzygnięciem D6
i wariantem A okna HINTS (patrz §5 E6).

**Otwarte decyzje użytkownika — z pierwotnego zestawienia ŻADNA.** Otwarte
pozostaje **D8** (zawroty szyjne), które nigdy nie weszło do tego zestawienia: E6 dał tej
pracy wpis atlasu o typie `stanowisko`, ale NIE rozstrzygnął, czy program ma wyciągnąć z niej
konsekwencje dla okablowania karku (B8).
**D-MEN ROZSTRZYGNIĘTE 2026-08-22 (decyzja użytkownika, kontrola K7-C3) — wariant 4 uznany za
wdrożony, paradoks NAZWANY WPROST.** Kontrola zmierzyła, że wariant 4 tabeli (oba zestawy
równolegle, punkt po punkcie, bez wydawania etykiety) już działa: wpis atlasu niesie obie postaci
z właściwymi oknami i rangami, a asymetria przypisu 3 jest oddana strukturalnie. Zostało jedno
pytanie, które baza wiedzy jawnie rezerwowała dla użytkownika — nazwać paradoks czy tylko
odtwarzać widełki — rozstrzygnięte: NAZWAĆ. Zapis wszedł w kontekst progu kryterialnego
20 min–24 h postaci prawdopodobnej wpisu atlasu (granice źródła zostały na limicie 6/6 — bez
ruszania `LIMIT_GRANIC`; mechanizm wybrany spośród trzech zgodnych z bramkami, po tym jak
adwersarz kontroli zmierzył, że siódma granica zapala `ATL3c` twardo). Fizyka `meniere()`
nietknięta. Warianty 2 (kodować okna w logice — brak substratu, architektura E6c idzie w przeciwną
stronę) i 3 (etykieta OTOREPO — słowniki rang atlasu są zamknięte) odrzucone z pomiarów kontroli.
**D3 ROZSTRZYGNIĘTE 2026-08-22 (decyzja użytkownika, kontrola K7-C2) — ZAPISEM GRANICY.**
Program wspólnej skali pewności ICVD nie ma i mieć nie będzie (zmierzone: atlas niesie stopnie
wyłącznie per praca, jako osobne bloki kryteriów; odmowy stopnia nazwane tam, gdzie zachodzą);
jedyny nienazwany rozjazd — rdzeń `[H19]`↔`[H59]` — został nazwany w WYSYŁANEJ treści: nowa
granica źródła wpisu `bvp` atlasu (slot po scalonej granicy erraty; granice zostają 6/6, limit
ATL3c nietknięty) plus brzmienie po diagnozie w adnotacji `[H61]` engine_doc (K7-A4). Warianty
odrzucone z pomiarów kontroli: synteza we wpisie `ramyICVD` (przypisywałaby `[H61]` treść, której
praca nie niesie — jeśli synteza, to jako byt etapu E7) i „tylko naprawy zestarzeń" (odkładał całą
pozostałą treść decyzji).
**D-5D ROZSTRZYGNIĘTE 2026-08-22 (decyzja użytkownika, kontrola K7-C1) — wariant A doprecyzowany.**
Nazwa i skład zostają NASZE, rodowód dopisany w trzech miejscach zamiast podmiany: nagłówek modułu
`triage-model.js` (pełny zmierzony rodowód), komentarz przy opcji `pieciod` i adnotacja `[H24]`
w obu lustrach `engine_doc`. Treść rodowodu: nazwa „5 D" to mnemotechnika GRACE-3 spoza korpusu
(0 rzeczywistych trafień w 19 pracach — sondą niesprawdzalna), a pokrycie FUNKCJI dają `[H58]`
kryterium B poz. 1 (lista otwarta „e.g.", więc szersze sito niesprzeczne ze źródłem) i `[H59]`
noty 13–14 (w tym „dysarthrophonia"; dysfonia samodzielnie nie pada w korpusie nigdzie). Doszła
bramka **KS7b** pinująca SKŁAD pięciu pojęć w każdym lustrze OSOBNO — KS7 pinowała tylko nazwę
i to na sklejce pl+en (pułapka luster z D-CT). Warianty B (zrównać z `[H58]`) i C (rozbić na dwie
flagi) odrzucone z pomiarów kontroli K7: B zwęża sito, którego źródło nie każe zwężać, C jest
najdroższy przy zerowej różnicy funkcjonalnej (podwójny strażnik iloczynu IN10+ATL7b). Zero zmian
napisów UI — 0 z 32 kluczy golden.

**TRZY POZYCJE ZNALEZIONE PRZY PISANIU ATLASU — jedna już zamknięta, dwie otwarte.** Wszystkie są
rozjazdami WEWNĄTRZ jednej pracy, więc nie da się ich zamknąć wyborem „nowszego źródła"; trzecią
zamknęła częściowo **errata odnaleziona 2026-08-22** (pełne opisy obu czytań przy materiale:
`konflikty/konflikty-progi-liczbowe.md` §K2 i `ekstrakcje/17-strupp2022-auvp.md`; do 2026-08-22
stał tu odsyłacz do `sporne.json` — pliku, który **nigdy nie istniał**, w żadnym drzewie ani
commicie; sprostowanie: przegląd dokumentacji):
1. **`[H59]` AUVP — operator łączący progi instrumentalne przy kryterium C.** Nota 12 zapisuje je
   jako ALTERNATYWĘ, proza §4.4.1 żąda KONIUNKCJI. To ta sama oś, którą zamknęło **D2**, więc karta
   oddaje ZALECENIE PRACY (żaden próg nie jest kryterialny), a spór zostaje nazwany, nie ukryty.
2. **`[H59]` AUVP — jak ostro czytać zakaz skew deviation w kryterium E.** Tekst główny mówi
   „brak skew deviation" bez kwalifikatora; nota i abstrakt dopuszczają małą SD (< 3°) u ok. 20%
   chorych i piszą „brak WYRAŹNEJ". **Trzy brzmienia w jednej pracy**, a literalne kryterium jest
   ostrzejsze niż intencja noty.
3. ~~**`[H19]` BVP — próg fotela obrotowego.**~~ **ERRATA ODNALEZIONA I ZASTOSOWANA 2026-08-22 —
   rozjazd LICZBOWY zamknięty, dwa pozostałe NIE.**
   > **Errata:** *J Vestib Res* 2023;33(1):87 · DOI **10.3233/VES-229002** · PMID 36336950 ·
   > PMC9986683. Pobrana przez **Europe PMC**, bo `content.iospress.com` odpowiada wyzwaniem
   > Cloudflare — ta sama trasa, którą pobrano 15 prac korpusu. Pełny tekst leży w korpusie:
   > `zrodla-pelny-tekst/07b-strupp2023-bvp-ERRATA.txt`. Wiązanie potwierdzone metadanymi
   > (`"type": "Erratum for"` → `10.3233/VES-170619`). **Uwaga pomiarowa na przyszłość:**
   > `fullTextXML` dla tego PMCID zwraca PUSTĄ odpowiedź (`isOpenAccess: N`) — treść jest na
   > stronie PMC, nie w API pełnych tekstów.
   >
   > **Errata zawiera DOKŁADNIE JEDNĄ poprawkę**, do linii kryterium C-3 (str. 179, sekcja 3):
   >
   > | wielkość | 2017 | po erracie |
   > |---|---|---|
   > | gain poziomego kątowego VOR | `< 0,1` | **`≤ 0,1`** |
   > | przesunięcie fazy | `> 68°` | **`≥ 15°`** |
   > | stała czasowa | `< 5 s` | **`≤ 6 s`** |
   >
   > Bodziec (0,1 Hz, Vmax = 50°/s) i spójnik ORAZ — bez zmian.
   >
   > **To nie jest korekta operatora brzegowego, tylko przesunięcie progu fazy o czynnik ~4,5.**
   > Przy 68° ten wariant kryterium C był praktycznie nieosiągalny. Ekstrakcja z 2026-08-21
   > odnotowała niezależnie, że „liczba 68 nie ma w dokumencie żadnego wyprowadzenia ani noty",
   > i wskazała ten próg jako **najbardziej prawdopodobnego kandydata na treść erraty** —
   > zgadło się co do miejsca.
   >
   > **CZEGO ERRATA NIE ZAMYKA, a co przy niej łatwo uznać za zamknięte:** (a) rozjazd
   > **spójnika** — abstrakt nadal łączy te wielkości przez „i/lub", errata abstraktu nie rusza;
   > (b) **trzecia wersja liczbowa z noty** (gain < 0,15 przy 0,05–0,1 Hz i Vmax = 60°/s) —
   > errata noty nie dotyczy. Oba zostają otwarte i oba stoją w granicach źródła wpisu atlasu.
   >
   > **Zastosowane w atlasie**: wpis `bvp` niesie liczby po erracie, a wersja pierwotna **zostaje
   > jako ślad** w kontekście progów i w granicach źródła — podmiana bez śladu kazałaby czytać,
   > że praca zawsze tak brzmiała. **Silnik był i jest czysty**: nie ma żadnej stałej progu fazy,
   > więc żadna liczba w `src/engine/` nie wymagała poprawki. Reszta etapu **E3** (progi fotela
   > obrotowego jako warstwa silnika) pozostaje niezamknięta.

Rozstrzygnięte w trakcie: D2 (§4.1) · D4 (§3.5) · D5 (§4.1) · D7 (§4.2) · **D1** (§3.3, etap E3a —
pytanie było źle postawione) · **D-ORTO** (§5 E5, wariant A — szóste pytanie kwalifikacji) ·
**D-CT** (§5 E5, wariant A — zdanie o TK dopełnione o człon pozytywny).

> **D-CT, wariant A (2026-08-22).** Zdanie źródła jest **dwuczłonowe**, a program niósł tylko człon
> negatywny: mówił klinicyście przy łóżku, że TK „nie nadaje się", nie mówiąc, **do czego się nadaje**.
> `[H58]` Kim 2022 §5.3: TK ma ograniczoną wartość w wykrywaniu zawału krążenia tylnego *„and is only
> recommended to detect hemorrhages or other pathologies"*. `[H59]` Strupp 2022 robi to samo zawężenie
> i dokłada angio-TK dla zwężenia tętnicy kręgowej lub podstawnej.
> **Ranga podnosi wagę zgubionej połowy o piętro:** sama modalność TK stoi w prozie przeglądowej, ale
> **cel** obrazowania — „dowód niedokrwienia **lub krwotoku**" — jest u `[H58]` treścią **kryterium B**.
> Dopełnione w karcie czerwonej flagi i w stałej `OSTRZEZENIE`, w obu lustrach; uwaga dostała też
> **znacznik źródła**, którego jako jedyna z trzech nie miała.
> **Bramka broniła połowy zdania i dlatego druga połowa mogła zniknąć.** KL2c rozbite na trzy
> asercje (KL2c/KL2g/KL2h), wzorem KL2d–KL2f z D-MRI, plus E6b w warstwie DOM.
> **Poprawiona atrybucja:** komunikat KL2c mówił „GRACE-3", a weryfikowalne pokrycie dają `[H58]`
> i `[H59]` — GRACE-3 nie należy do korpusu, więc jego brzmienia nie da się sprawdzić sondą.

---

## 2. CO POKAZAŁ POMIAR

Trzy liczby, wszystkie zmierzone grepem po repozytorium, nie oszacowane. **To jest pomiar
OTWIERAJĄCY, z 2026-08-21** — dwanaście commitów, które po nim poszły, część tych miejsc już
opatrzyło numerem; liczby zostają tu jako punkt odniesienia, nie jako stan bieżący:

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

> **POMIAR PONIŻEJ JEST OTWIERAJĄCY I DZIŚ NIEAKTUALNY — przeliczony 2026-08-22 na `9332244`.**
> W bazie wiedzy obecnych jest **10 z 10** (każda ma wpis). W działającym `src/` obecnych jest
> **pięć**, w trzech rangach: jako **kod** — `[H52]` (obiekt pytania `ortostaza`) i `[H51]` (tablica
> `CPN_TROPY` z polem rodowodu); jako **tekst** — `[H50]`, `[H53]` i `[H49]`. Czyste zero zostało
> **pięciu**: MdDS `[H54]` · choroba lokomocyjna `[H57]` · zawroty szyjne `[H60]` · migrena wieku
> dziecięcego `[H55]` · słownik Bisdorffa `[H47]`.
> **Trzy z nich weszły jako SKUTEK UBOCZNY innych etapów**, nie jako decyzja zakresowa: `[H51]`
> z D-CPN, `[H50]` i `[H53]` z D-CZAS, `[H52]` z D-ORTO. Dlatego D6 jest dziś częściowo **wsteczne**:
> musi zapisać nie tylko co ma wejść, ale i **co już weszło i w jakiej randze**.

> **DOPISEK 2026-08-22, przegląd dokumentacji: PRZELICZENIE POWYŻEJ UNIEWAŻNIŁ JESZCZE TEGO SAMEGO
> DNIA ETAP E6a (`83a147a`).** Od atlasu żaden z pięciu „czystych zer" nie jest zerem: `[H54]` 5,
> `[H57]` 3, `[H60]` 2, `[H55]` 1, `[H47]` 7 trafień — wszystkie w `src/app/atlas-model.js`, więc
> w `src/` obecnych jest **10 z 10**. Dwie ścisłości do samego przeliczenia: pin „na `9332244`"
> jest o jeden commit za wczesny — nota liczy `[H49]` jako obecny, a ten wszedł do `src/` dopiero
> w jej własnym commicie `21bdda4`, którego stan faktycznie opisuje; a obowiązek „D6 musi zapisać,
> co już weszło i w jakiej randze" został **wykonany** — rejestr jest polem `wSilniku` (7/7/4)
> liczonym przez `atlas:check`, a rejestr D6 zamknął `f99e6a7` (patrz §4.2).

**Jednostki ICVD nieobecne w programie (pomiar otwierający, 0 trafień):** PPPD · presbywestybulopatia ·
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

> **ZAMKNIĘTE — E1, `ae36e0a` (2026-08-21).** Rozdział `KRYTERIA BPPV` powstał (wszystkie osiem
> podtypów 2.1–2.4 i 3.1–3.4 z kryteriami i przypisami), `[H48]` stoi przy `baranyClassify`,
> przy karcie i w `tools/barany-check.mjs`, a rodowód „pamięć otoneurologiczna" został usunięty
> z `view_doc.txt`, lustra EN i `todo.txt` — z zachowaniem noty, **co** tam stało.

### 3.2. Czerwone flagi CPN — sześć kryteriów, dwa pliki, zero źródeł, i BLOKUJĄ LECZENIE

`svg-screens.js:2675-2680` oraz `obs-model.js:505-513` niosą **tę samą treść w dwóch niezależnych
literałach**: brak latencji / uporczywy / niemęczliwy / czysto pionowy lub skrętny / pozycja
neutralna / objawy neurologiczne. Flagi są **wyliczane** przez `flagi()` i **blokują kartę leczenia**.

Ciąg `Eggers` w całym worktree: **0 trafień** — mimo że to jest dokładnie treść dokumentu
klasyfikacji oczopląsu ICVD (Eggers 2019, 114 tys. znaków, najbogatsze źródło w korpusie).

Najwyższe ryzyko kliniczne w całym przesiewie: **twierdzenie, które zatrzymuje leczenie, nie ma
źródła i istnieje w dwóch kopiach, które mogą się rozejść.** Etap E2.

> **CZĘŚCIOWO ZAMKNIĘTE — D-CPN, `1223f25` (2026-08-21) — a pomiar wyszedł GORZEJ, niż tu napisano.**
> Literałów było **pięć**, nie dwa (karta diagnostyki, `FLAGI` modelu obserwacji, proza przy schemacie
> downbeatu, skrót na karcie GRACE, `view_doc`) — i **już się rozeszły**: siedem różnic, z czego trzy
> zmieniały treść kliniczną. Najcięższa: karta wypisywała „bez latencji" / „uporczywy" / „niemęczliwy"
> jako trzy **niezależne** czerwone flagi, podczas gdy `obs-model.js` od dawna ma regułę odwrotną —
> ta triada sama jest opisem **kupulolitiazy** i ostrzega dopiero w towarzystwie innych cech.
>
> Treść kliniczna karty pochodzi odtąd **wyłącznie** z `src/app/cpn-model.js`; każdy trop niesie
> w polu `zrodlo` numer pracy, która go **naprawdę** niesie (`[H51]` Eggers 2019, `[H48]` von Brevern
> 2015), a trzy tropy bez pokrycia świadomie numeru **nie dostają**. Rozjazd treści jest więc
> strukturalnie niemożliwy — to było pkt 3 etapu E2.
>
> **Co zostaje dla E2:** rozdział klasyfikacji oczopląsu w bazie wiedzy (pkt 1) · źródła przy `FLAGI`
> w `obs-model.js` (pkt 2 — zmierzone: `[Hnn]` **0 trafień** w tym pliku; D-CPN zostawił go bajt
> w bajt, bo to on **liczy** i jest bramkowany 942 przypadkami `obs:check`) · kontrola nazewnictwa
> odradzanego przez Eggersa (pkt 4).

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

> **CAŁA TA TABELA CZYTA SIĘ DZIŚ INACZEJ — D1 ROZSTRZYGNIĘTY 2026-08-22, ZGŁOSZENIE BYŁO ŹLE
> POSTAWIONE.** Nagłówek „na trzech różnych statystykach" **nie broni się u źródła**, a zdanie
> o „nieporównywalnych statystykach", które stało w tym miejscu do 2026-08-22, było **naszą
> pomyłką dwukrotnie**: te określenia należą do osi kalorycznej, nie do gain, a na osi kalorycznej
> obie prace liczą **tak samo**.
>
> 1. **Same linie kryteriów gain statystyki nie nazywają** — `[H19]` kryt. C mówi tylko „measured by
>    the video-HIT or scleral-coil technique"; `[H53]` kryt. B.1 — „measured by video-HIT". **Ale nie
>    są statystycznie nieme: one odsyłają.** Kryterium C niesie przypis 5, a nota 5 nazywa **dwie**
>    alternatywne wielkości — iloraz prędkości kątowych albo iloraz pól pod krzywą (AUC).
> 2. **Na osi kalorycznej obie linie kryteriów używają tej samej wielkości** — „sum of bithermal
>    **maximum** peak SPV on each side" — i dlatego **przylegają**: `[H19]` poniżej 6, `[H53]` od 6 do 25.
> 3. **Na osi gain tak samo:** BVP < 0,6, presbywestybulopatia 0,6–0,8.
> 4. **Zastrzeżenie, bez którego punkty 2–3 są za mocne:** `[H53]` podaje **trzy różne operatory
>    brzegowe** dla własnych progów — abstrakt „< 0.8 and > 0.6" (ostre), kryteria „between…and…"
>    (nierozstrzygające), dyskusja „≥ 0.6 and < 0.8" (dolny domknięty). Pasma przylegają, ale jedyna
>    nieciągłość jest **wewnątrz `[H53]`**: w odczycie z abstraktu wartości dokładnie 0,600 i dokładnie
>    6°/s nie należą do żadnego pasma. Konfliktu **między** pracami nie ma — i to jest właściwe
>    brzmienie rozstrzygnięcia.
> 5. **`[H59]` nie wnosi trzeciej statystyki** — pierwsza wersja tej notatki twierdziła inaczej i była
>    błędna. Rozjazd biegnie **wewnątrz `[H19]`**: linia kryterium mówi „max. peak", a jego **własna
>    nota 6** — ta, do której kryterium odsyła — wyprowadza liczbę 6 ze **średnich**. `[H59]` powtarza
>    czytanie noty 6, nie zaprzecza mu.
>
> **Skutek: żadnej liczby w silniku nie zmieniono** (E3a, `snapshot:check` bit w bit). Zmieniono rangę
> i rodowód — `GAIN_CUT {HC 0,8}` to **zaokrąglona w górę** dolna granica normy z noty 5 `[H19]`
> (0,79 przy 80 ms; przy 60 ms nota daje 0,75, a dolna wartość prawidłowa u zdrowego sięga 0,65),
> nie kryterium; `BVP_CUT 0,6` to kryterium C, ustawione świadomie **niżej**. Obie liczby silnika
> okazały się zarazem **obiema krawędziami pasma** `[H53]`.
>
> Kanały pionowe 0,7 — **meldunek zero**, i to jest **najcięższy próg w tym bloku**, nie przypis:
> jest jedyną bramką osi pionowej i wchodzi do dwóch osi werdyktu, przy czym do `isolatedVertical`
> **przez negację**. Próg za wysoki **maskuje** znak ośrodkowy, za niski go **fabrykuje**. Zmierzone:
> werdykt przeskakuje central↔peripheral dokładnie na 0,70.

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

> **ROZSTRZYGNIĘTE — D4, decyzja użytkownika 2026-08-21, zapisana w `ae36e0a`: wariant (a).**
> **Fizyka zostaje.** Napad jest emergentny — złóg startuje przy osklepku — a nie strojony pod
> liczbę; chip „Przemijający (≈1 min)" mówi prawdę o **własnym modelu**. Rozbieżność została
> **nazwana**, nie ukryta. `barany:check` liczy dziś **61** przypadków (49 → 61 w `5a93ea1`).
> *(Dopisek 2026-08-22, przegląd dokumentacji: od `82e3329`/D3-OS bramka liczy **69** przypadków.)*

### 3.6. Silnik nadaje tier „emerging" podtypowi, który praca JAWNIE WYKLUCZA

`baranyClassify` przypisuje kupulolitiazie kanału przedniego status „zespół wyłaniający się",
podczas gdy von Brevern 2015 tę postać **jawnie wyklucza**. „Emerging" znaczy w tej pracy
„opisany, ale niedostatecznie potwierdzony" — nie „odrzucony". To **błąd etykiety**, nie fizyki.

> **ZAMKNIĘTE — E1, `ae36e0a`.** Etykieta poprawiona na „poza klasyfikacją ICVD" — tam, gdzie stoją
> już light cupula i short arm. Praca włącza do klasyfikacji wszystkie kombinacje kanał × mechanizm
> **poza tą jedną**. Poprawka NAZWY, nie modelu: pozostałe sześć kombinacji bit w bit bez zmian.
> Golden nie pokrywał tego przypadku — luka domknięta osobno w `5a93ea1` (nowy klucz
> `dom/diag/headhang-kupulo/P` + sekcja 6 bramki, która **liczy**, ile kombinacji nosi ten znacznik).

---

## 4. KONFLIKTY MIĘDZY PRACAMI — 75 pozycji

Rozkład: **34 twarde** (prace mówią rzeczy wzajemnie sprzeczne) · **35 napięć** (da się pogodzić,
ale wymaga jawnej decyzji redakcyjnej) · **6 następstw** (praca późniejsza świadomie zmienia
wcześniejszą — to nie konflikt, to wersja, ale trzeba wiedzieć, którą cytować).

Pełne opisy z obiema stronami, liczbami i wariantami rozstrzygnięcia: `icvd-korpus/konflikty/`.

### 4.1. Decyzje BLOKUJĄCE — bez nich nie da się napisać bazy wiedzy

| # | Konflikt | Warianty |
|---|---|---|
| ~~**D1**~~ | ~~**Próg gain vHIT: 0,6 / 0,7 / 0,6–0,8**~~ (§3.3) — **ROZSTRZYGNIĘTE 2026-08-22: pytanie było ŹLE POSTAWIONE** | Trzy prace **nie** definiują tego samego ubytku trzema statystykami: kryteria gain nie nazywają statystyki w ogóle, a na osi kalorycznej `[H19]` i `[H53]` używają **tej samej** i **przylegają** (poniżej 6 / od 6 do 25). Żadnej liczby nie zmieniono; zmieniono rangę i rodowód — `GAIN_CUT {HC 0,8}` to **dolna granica normy** z noty 5 `[H19]`, nie kryterium. Kanały pionowe 0,7 zostają jawnym **meldunkiem zero**. Etap E3a. |
| ~~**D2**~~ | ~~**AUVP: alternatywa czy koniunkcja**~~ — **ROZSTRZYGNIĘTE 2026-08-21** | **Pytanie okazało się źle postawione.** Po przeczytaniu obu miejsc wraz z kryteriami: **żadna z tych liczb nie jest kryterium**. Kryterium C brzmi jakościowo („jednoznaczny dowód obniżonej czynności VOR") i nie zawiera liczby; komitet wprost mówi, że **nie ma zgody co do wartości odcięcia** i że trzeba opierać się na **normach pracowni**. Nota 12 sama nazywa swoje liczby „working approximation". Oba czytania odpowiadają przy tym na **różne pytania** (patologia w obu badaniach vs istotny ubytek w samym vHIT). Zapisane jako przybliżenia robocze; **żaden próg nie wchodzi do silnika jako kryterialny** — i to jest zalecenie pracy, nie nasz wybór. Wyszedł przy okazji warunek, którego nie miało żadne ze zgłoszonych czytań: **„powinny też wystąpić sakady"**. |
| ~~**D3**~~ | ~~**„Probable" znaczy w ICVD CZTERNAŚCIE różnych rzeczy**~~ (zmierzone 2026-08-22; zgłoszenie mówiło o siedmiu, potem dziesięciu) — **ROZSTRZYGNIĘTE 2026-08-22 (K7-C2): ZAPISEM GRANICY** | Trzy warianty pierwotne padły u adwersarza; rozstrzygnięcie poszło czwartą drogą, którą otworzył dopiero E6: **wspólnej skali się nie renderuje** (atlas niesie stopnie per praca, osobnymi blokami kryteriów), a **rdzeń `[H19]`↔`[H59]` został nazwany w wysyłanej treści** — granica źródła wpisu `bvp` + brzmienie po diagnozie w adnotacji `[H61]` (K7-A4). Patrz §1.1 i nota niżej. |

> **DIAGNOZA D3 — CZĘŚCIOWO SIĘ ROZPUSZCZA, ALE ZOSTAJE TWARDY RDZEŃ (2026-08-22).**
> Opis „opozycja" jest **zły**, a kontrargument o obustronności/jednostronności **upada przy sondzie**.
> Tłumaczy to **fenomenologia**: w AUVP dodatnia kotwica zostaje w kryterium B (oczopląs samoistny),
> więc HIT wolno puścić jako nieobecny; w BVP — zespole przewlekłym bez oczopląsu — kryterium C jest
> **jedynym znakiem w całym zestawie**, więc musi być dodatnie. Obie prace mają przy tym identyczną
> epistemologię narzędzia, zapisaną w notach.
>
> **Co się NIE rozpuszcza i jest właściwą treścią D3:** ten sam przyłóżkowy HIT z sakadami jest
> w `[H59]` wystarczający dla postaci **PEWNEJ**, a w `[H19]` nie może dojść do pewnej **nigdy**
> („quantitative measurement is required for BVP"). Narzędzie leży po **przeciwnych stronach linii
> pewna/prawdopodobna**. Skutek mierzalny: przy ujemnym HIT i bez pracowni AUVP daje kategorię,
> BVP nie daje żadnej.
>
> **Kierunek zarzutu się odwraca:** `[H19]` jest JEDYNYM przypadkiem w korpusie, w którym „probable"
> wymaga znaleziska **dodatniego**; `[H48]`, `[H52]`, `[H49]` i `[H20]` budują je przez **brak**
> badania potwierdzającego. Anomalia siedzi w `[H19]`, nie w `[H59]`. `[H48]` miał wzorzec
> „probable = nie udało się nic pokazać" już w 2015 (2.4, kryterium C sformułowane negatywnie).
>
> **Nowe stopnie, o których zgłoszenie milczało:** „Certain MD" z potwierdzeniem histopatologicznym
> (jedyna operacja **w górę** w korpusie) · „Possible MD" · aneks japoński 1974 „suspicious or
> uncertain" · **PPPD i SCDS stopień jawnie ODRZUCAJĄ**. `[H61]` Kaski 2025 **nazywa oś** („levels of
> diagnostic certainty"), ale ani jednego jej szczebla.
>
> **DWIE NAPRAWY NIEZALEŻNE OD WYBORU WARIANTU — WYKONANE (etap D3-OS):** oś `tier` rozbita z dwóch
> wartości na **trzy** (sekcja 2 / sekcja 3 / poza katalogiem), bo `emerging` sklejało „praca to zna,
> ale nie potwierdziła" z „praca tego nie zna wcale"; oraz **short arm dostał znacznik**, którego jako
> jedyna z trzech postaci spoza katalogu nie nosił — wbrew własnemu komentarzowi w kodzie.
>
> **ROZSTRZYGNIĘCIE — 2026-08-22, kontrola K7-C2 (decyzja użytkownika), zapisem granicy.**
> E6 rozpuścił strukturalnie lęk przed spłaszczeniem: atlas niesie stopnie WYŁĄCZNIE per praca
> (osobne bloki kryteriów; PPPD i MdDS mają odmowę stopnia nazwaną we wpisie), a żadna powierzchnia
> programu nie renderuje wspólnej skali. Zostawał rdzeń — nazwany teraz w wysyłanej treści: granica
> źródła wpisu `bvp` (K7-C2) i adnotacja `[H61]` w brzmieniu po diagnozie (K7-A4). **Korekta
> brzmienia za adwersarzem źródłowym kontroli:** wyżej stoi „postaci PEWNEJ" — `[H59]` etykiety
> „definite" nie zna (kategorie: AUVP / w toku / probable / w wywiadzie), więc zapisy wykonawcze
> mówią o postaci **PEŁNEJ**; oraz kwalifikator „jedyny wśród **kryteriów** ICVD, w którym probable
> czyni znalezisko dodatnie warunkiem KONIECZNYM" — bo poza kryteriami korpus ma kontrprzykłady
> (aneks AAO-HNS 1995 w `[H20]`; „probable" naczyniowe `[H58]` z drogami alternatywnymi).
| ~~**D4**~~ | ~~**Kanał przedni 61,25 s vs kryterium „< 1 min"**~~ (§3.5) — **ROZSTRZYGNIĘTE 2026-08-21: wariant (a)** | **Fizyka zostaje, rozbieżność nazwana.** Napad jest emergentny (złóg startuje przy osklepku), a nie strojony pod liczbę; chip „Przemijający (≈1 min)" mówi prawdę o własnym modelu. Zapisane w `ae36e0a`. |
| ~~**D5**~~ | ~~**Geometria testu Roll: 30° (ICVD) vs 10,3° (silnik)**~~ — **ROZSTRZYGNIĘTE 2026-08-21: wariant (a)** | **Zostaje 10,3°**, bo kąt jest wyprowadzony z anatomii kanału, a pomiar własny daje optimum przy +10,30° i stratę 5,9–14,5% przy 30°. **Świadomy koszt zapisany:** przy 30° działa mechanizm pseudo-samoistnego oczopląsu, którego przy 10,3° nie ma — silnik go nie odtworzy i nie wolno udawać, że odtwarza. Zapisane w `ae36e0a`. |

**D5 dotykał rozstrzygnięcia, które już raz zapadło** (pomiar silnika: optimum przy +10,30°,
przy 30° strata 5,9–14,5%; rodowód kanonu 30° uznany za kaloryczny). Nową okolicznością było to,
że kryteria ICVD podają 30°, a przy tym kącie działa mechanizm, którego przy 10,3° nie ma.
**Rozstrzygnięte ponownie 2026-08-21, już przy źródle pierwotnym — utrzymano 10,3°**, a mechanizm,
którego silnik przez to nie odtwarza, zapisano jako świadomy koszt, nie jako przeoczenie.

### 4.2. Decyzje ZAKRESOWE — co w ogóle wchodzi do programu

| # | Pytanie | Uwaga |
|---|---|---|
| ~~**D6**~~ | ~~Które z 10 nieobecnych jednostek ICVD wchodzą do programu~~ — **ROZSTRZYGNIĘTE 2026-08-22: pytanie było ŹLE POSTAWIONE** | **Wszystkie wchodzą — ale nie tam, gdzie pytanie zakładało.** Program ma ZNAĆ komplet jednostek ICVD; ścieżka OSTRA (GRACE-3, HINTS) pozostaje OGÓLNA i rozpoznań się w niej nie mnoży. Jednostki szczegółowe idą do **Atlasu otoneurologicznego** — szóstego, rozłącznego obszaru. Rejestr zakresu per jednostka przestał być prozą i jest polem `wSilniku`, które bramka liczy: **7 modelowanych / 7 kryteria-bez-modelu / 4 świadomie poza zakresem**. Etap E6. |
| ~~**D7**~~ | ~~Czy nadawać numer `[Hnn]` pracy Lempert 2012~~ — **ROZSTRZYGNIĘTE 2026-08-21: NIE** | Kryteria cytujemy za `[H46]`, bo to ich aktualny nośnik; wersja 2012 posłużyła jako **dowód**, a porównanie stoi przy wpisie `[H46]`. Dlatego numery E0 kończą się na `[H61]`, nie `[H62]`. Zapisane w `engine_doc.txt` (E0, `ee08f99`). |
| **D8** | Czy „zawroty szyjne" (stanowisko Seemungala) mają trafić do programu, skoro program ma okablowanie karku (B8)? | Stanowisko **neguje** jednostkę; program nie stawia takiego rozpoznania — ale liczy pozy z pivotem karku |

### 4.3. Konflikty do rozstrzygnięcia przy pisaniu rozdziałów (nie blokują startu)

Wybrane z 75; reszta w plikach:

- ~~**Ménière 12 h vs 24 h** — lepiej udokumentowany chory dostaje **niższy** stopień pewności~~ —
  **ROZSTRZYGNIĘTE 2026-08-22 (K7-C3)**, ze ścisłością wymierzoną przez kontrolę: stopnia nie
  obniża dokumentacja, obniża go CZAS napadu (audiogram chorego 18-godzinnego staje się bezczynny);
  paradoks nazwany wprost we wpisie atlasu, przy progu 24 h
- **Liczba wymaganych epizodów: 2 / 3 / 2–4 / 5 / 10** — nierówna poprzeczka dowodowa dla tego samego wywiadu
- **Dwa różne zegary** — migrena liczy obwiednię serii napadów, BPPV i napadowica pojedynczy napad;
  ten sam chory z sekundowymi zawrotami pozycyjnymi spełnia oba kryteria czasu **jednocześnie**
- **„Przewlekły": 3 miesiące / 1 miesiąc / brak progu**
- **Pas 19–25% asymetrii kalorycznej jest niczyj** (19% jeszcze norma, > 25% patologia)
- **Męczliwość** — u ICVD cecha peryferyjna, u Eggersa **trop ośrodkowy**; silnik używa jej jako różnicownika mechanizmu
- **Pętla wykluczeń**: ten sam chory spełnia „prawdopodobne BPPV, które ustąpiło samoistnie" **i** „prawdopodobną napadowicę przedsionkową"
- ~~**Błąd atrybucji do naprawy**: reguła pierwszeństwa Ménière'a nad migreną — sprawdzić, czy karta
  `vmCriteriaCard` przypisuje ją właściwej pracy~~ — **SPRAWDZONE I DOMKNIĘTE W DWÓCH KROKACH**
  (dwa niezależne zapisy zamknięcia z 2026-08-22 — przegląd dokumentacji i kontrola powtórna K7 —
  scalone przy rebase w jeden): **krok 1, E4a (`ca8a649`, 2026-08-21)** naprawiła twardy błąd —
  znacznik `[H20]` stoi przy klauzuli kryteriów, a reguła „dwóch różnych typów napadów" to zdanie
  `[H46]` (pomiar: 0 wobec 1 trafienia); patrz §1.1 i nota E4a w §5. **Krok 2, K7-A3 (2026-08-22)**
  domknął rezyduum: punkt karty migreny nie miał **dodatniego** odsyłacza przy samej regule
  ([H46] padał dopiero w nocie zamykającej kartę) — zdania o pierwszeństwie i dwóch typach napadów
  kończą się teraz „— [H46] Lempert 2022" w obu lustrach, wzorem punktu napadowicy. Atrybucja
  zmierzona powtórnie na pełnych tekstach: „two different types" / „even if" — praca 03 (Ménière):
  0/0 trafień, praca 15 (Lempert 2022): 1/1

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

### E0 — Fundament bibliograficzny · *bez zmian klinicznych* · **ZROBIONE `ee08f99`**

**Cel.** Nadać numery dokumentom ICVD, których w bibliografii nie ma, i uzupełnić dwa istniejące
wpisy (`[H19]`, `[H20]`) o treść kryteriów, której nie niosą.

> **WYKONANE INACZEJ, NIŻ ZAPOWIADAŁ TEN PLAN.** Plan mówił `[H47]`–`[H62]`, czyli **szesnaście**
> numerów. Poszło **piętnaście**, `[H47]`–`[H61]`: Lempert 2012 numeru **nie dostał** (decyzja D7,
> §4.2). Przy okazji poprawiono dwa błędy metadanych wobec strony towarzystwa — PPPD to
> 27(4):**191–208**, a pierwszy autor pracy z 2025 to **Kaski D**.

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

### E1 — BPPV: spłata długu podstawowego · *najwyższy priorytet merytoryczny* · **ZROBIONE `ae36e0a`**

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

**Decyzje podjęte przed wykonaniem:** D4 (kanał przedni) i D5 (geometria Roll) — obie na wariant
(a), patrz §4.1. Obie rozbieżności silnika wobec kryterium zostały **nazwane w rozdziale**, a nie
usunięte przestrojeniem modelu.

> **DOWÓD ZAKRESU, ZMIERZONY:** `snapshot:check` zapalił dokładnie **pięć** kluczy, wszystkie
> w warstwie `dom`; **zero** w `plans`, `neuro`, `dyn`, `pose` i `shell` — fizyka nietknięta.
> `barany:check` został zielony **bez rebaseline**. Granica dowodu też zapisana: poprawki etykiety
> nie pokrywał wtedy żaden klucz golden — lukę domknięto osobno w `5a93ea1`.

---

### E2 — Oczopląs: Eggers 2019 pod czerwone flagi CPN · *najwyższe ryzyko kliniczne* · **CZĘŚCIOWO WYPRZEDZONY**

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

> **PUNKTY 2 I 3 W DUŻEJ CZĘŚCI ZAMKNIĘTE PRZEZ D-CPN (`1223f25`)** — patrz §3.2. Karta ma już
> jedno źródło (`src/app/cpn-model.js`) i numery `[H51]`/`[H48]` przy tropach, a rozjazd treści
> jest strukturalnie niemożliwy. **Zostaje:** rozdział klasyfikacji oczopląsu w bazie wiedzy (pkt 1),
> źródła przy `FLAGI` w `obs-model.js` (pkt 2 — zmierzone `[Hnn]` 0 trafień w tym pliku) oraz
> kontrola nazewnictwa odradzanego (pkt 4). Konflikt męczliwości nadal **nierozstrzygnięty**;
> D-CPN zapisał go jako `CPN_REGULA_TRIADY`, czyli nazwał, nie usunął.

---

### E3 — Progi ilościowe NeuroVOR · **E3a ZROBIONE (D1), reszta ZOSTAJE**

**Cel.** Przypisać każdemu progowi silnika właściwy dokument ICVD albo jawnie nazwać, że progu
w ICVD nie ma.

**Zakres.** `GAIN_CUT`, `BVP_CUT`, `CAL_BILAT`, `VEMP_AR`, progi kaloryczne i fotela obrotowego.
Nazwiska bez numeru do rozstrzygnięcia: ~~**McGarvie 2015**~~ (zdjęty w E3a — wartości niesie nota 5
`[H19]`, a pionowe 0,7 nie ma pokrycia), **Rosengren 2019**, **Lee 2006**,
**Lacour 2020** — każde albo dostaje `[Hnn]`, albo znika jako cytat.

**Dowód.** **Fizyka bit-w-bit** — jeśli decyzja D1 nie zmienia liczb, `snapshot:check` ma dać
diff pusty, a ruszyć wyłącznie tekst. Wzorzec V27a/V27b: poprawka merytoryczna **darmowa**.
Jeśli D1 zmienia liczbę — rebaseline z dowodem zakresu i osobnym commitem.

> **E3a ZROBIONE (2026-08-22).** Przewidywanie się sprawdziło: D1 **nie zmienił żadnej liczby**,
> `snapshot:check` identyczny ze złotym wzorcem, ruszył wyłącznie tekst.
>
> **Kontrola adwersaryjna obaliła trzy twierdzenia pierwszej wersji tego etapu** i wszystkie trzy
> zostały poprawione: (a) „kryteria gain nie nazywają statystyki" — za mocne, kryterium **deleguje**
> ją przypisem do noty; (b) „`[H59]` to jedyny realny rozjazd" — nieprawda, rozjazd biegnie
> **wewnątrz `[H19]`**; (c) „silnik liczy jak `[H19]`/`[H53]` (suma maksymalnych)" — **nierozstrzygalne
> w tym modelu**: silnik ma jedną nominalną szczytową na irygację, więc nie ma zbioru, z którego
> można wziąć maksimum albo średnią. Komentarz deklarował przynależność metrologiczną, której kod
> nie może wyrazić.
>
> **Domknięte przy okazji:** `CP_THRESH = 25` dostał pokrycie, które leżało **w tym samym zdaniu
> `[H59]`**, z którego wzięto próg 6°/s — pierwsza wersja wzięła z niego tylko połowę. Usunięte też
> dwa **osierocone odsyłacze do „McGarvie 2015"** w `engine_doc` (obie wersje językowe), które
> przypisywały mu wszystkie trzy liczby, w tym pionowe 0,7 właśnie ogłoszone bez pokrycia.
>
> ~~**DŁUG ZNALEZIONY PRZEZ KONTROLĘ, NIEZAMKNIĘTY — MARTWE POLE BRAMKI.**~~ Cała ta zmiana w `engine_doc`
> leży jako wiersze **wcięte pod wpisem `[H53]`**, a parser `bibliografia()` dokleja każdy taki wiersz
> do *definicji wpisu* i pomija go w zliczaniu. Skutek: `zrodla:check` **nie czytał** tego fragmentu —
> nie liczył cytowań, nie sprawdzał zgodności numer↔nazwisko, nie porównywał lustra PL/EN. Sonda
> rozstrzygająca: wstrzyknięte celowo błędne `[H19] Kattah 2009` przechodziło na zielono. Lustro
> faktycznie się rozjechało (`[H19]` PL 20 / EN 19) i zostało **wyrównane ręcznie** — bramka tego nie
> złapała. Do rozstrzygnięcia było: rozszerzyć parser czy przenieść prozę poza wpis.
>
> **DŁUG ZAMKNIĘTY 2026-08-22 (kontrola powtórna, K7-B1) — wariantem „rozszerzyć parser".**
> Nowa sekcja 8b bramki (`BIB6`, pięć asercji, architektura agregatowa jak `DOC4`) czyta prozę
> pod wpisami: zgodność numer↔nazwisko w obu lustrach, równość cytowań **per wpis** PL/EN,
> strażnik zasięgu i kontrola czułości, która wstrzykuje **dokładnie sondę z tego zapisu**
> (`[H19] Kattah 2009` w prozę `[H53]`, w pamięci) i żąda wykrycia przez **obie** reguły naraz.
> Pomiar przy wdrożeniu: **43 cytowania w prozie na lustro** (PL i EN identycznie), 18 wpisów
> z `[Hnn]`, asymetrii per wpis **zero** — więc włączenie reguły nie wymagało żadnej korekty
> treści. *(Po rebase na E-DOC2, K7-B1b: 44/lustro i 19 wpisów — E-DOC2b dopisało `[H19]`
> w prozie wpisu `[H23]`, symetrycznie w obu lustrach; reguły pozostały zielone bez korekt.)* `OCZEKIWANE` 271 → 276, arytmetyka w dzienniku stałej. Wybór wariantu „parser", nie
> „przenieść prozę": proza-przy-wpisie to świadoma konwencja dokumentu (nota erraty NALEŻY do
> wpisu `[H19]`), a przenosiny obu luster ryzykowałyby pułapkę kolumny 0 opisaną przy V28.
>
> **Zostaje z E3:** `VEMP_AR` i `VEMP_THRESH` (norma pracowniana **poza korpusem ICVD** — żaden z 19
> dokumentów progu asymetrii VEMP nie stanowi; `[H56]` wprost każe ustalać odcięcia per pracownia),
> progi fotela obrotowego oraz nazwiska bez numeru: **Rosengren 2019**, **Lee 2006**, **Lacour 2020**.

---

### E4 — Ménière i AUVP: treść kryteriów pod istniejące numery · **E4a ZROBIONE `ca8a649`, E4b ZOSTAJE**

**Cel.** `[H19]` i `[H20]` istnieją, ale **treści kryteriów nie niosą** (zmierzone 2026-08-21:
`30 dB` 0 trafień, `20 min` 0, `12 h` 0). Program liczy `meniere()` jako model tonu, nie jako
model kryteriów.

**Zakres.** Rozdziały kryterialne dla obu jednostek + rozstrzygnięcie D2 dla AUVP + zmiana nazwy
(zapalenie nerwu → AUVP; oba terminy dozwolone, skrót niestabilny).

> **E4a — Ménière ZROBIONE (`ca8a649`).** Rozdział `KRYTERIA CHOROBY MÉNIÈRE'A` stoi w bazie wiedzy
> pod `[H20]`; pomiar otwierający jest już nieaktualny — dziś `30 dB` daje 4 trafienia, `20 min` 9,
> `12 h` 6. Przy okazji naprawiono **błąd atrybucji**: reguła „dwóch różnych typów napadów" to
> zdanie `[H46]`, nie `[H20]` (zmierzone: 0 wobec 1 trafienia).
> **D2 rozstrzygnięte osobno (`4db7a97`)** — patrz §4.1: żaden próg AUVP nie wchodzi do silnika
> jako kryterialny, i to jest zalecenie pracy, nie nasz wybór.
> **E4b zostaje:** rozdział kryterialny AUVP i zmiana nazwy. ~~**D-MEN (12 h vs 24 h) nadal
> otwarte.**~~ **D-MEN rozstrzygnięte 2026-08-22 (K7-C3)** — patrz §1.1: wariant 4 uznany za
> wdrożony przez atlas, paradoks 18 h nazwany wprost w kontekście progu 24 h.

---

### E5 — Kwalifikacja wstępna: 97 miejsc bez źródła · **E5a ZROBIONE `e446f1c`, reszta ZOSTAJE**

**Cel.** Warstwa, którą klinicysta czyta **jako pierwszą**, ma dziś **zero numerów źródeł**
w napisach. Twierdzenia mocne klinicznie („ataksja chodu przemawia za przyczyną ośrodkową",
progi czasowe, okno 48–72 h) stoją bez odsyłacza.

**Zakres.** Przypisanie źródeł: GRACE-3 `[H24]` tam, gdzie to GRACE-3; Kim 2022 (naczyniowe)
tam, gdzie czerwone flagi; Bisdorff 2009 pod progi czasowe i nazwy objawów.

**Uwaga zmierzona:** kwestionariusz **nigdy nie pyta o czas od początku objawów**, a okno
stosowalności GRACE-3 („poniżej 2 tygodni") stoi wyłącznie w komentarzu. To luka logiczna,
nie tylko brak źródła.

> **DRUGA LUKA TEJ SEKCJI — ZAMKNIĘTA (D-ORTO, wariant A, 2026-08-22).** Kwestionariusz nie pytał
> o nic ortostatycznego (zmierzone: 11 sond po `src/`, wszystkie zero), a oś wyzwalacza wchłaniała
> chorego z hemodynamicznym zawrotem ortostatycznym: opcja pozycyjna mówi „zmiana pozycji głowy
> **lub ciała**", a wstanie z łóżka jest zmianą pozycji ciała.
> **Narzędzie wzięte wprost ze źródła, nie wymyślone:** nota 1 `[H52]` Kim 2019 mówi, że samo
> wstawanie jest wyzwalaczem **niejednoznacznym** (niesie ze sobą ruch głowy), i podaje sposób
> rozstrzygnięcia — zapytać, czy objawy występują **także przy kładzeniu się albo obracaniu
> w łóżku**. Szóste pytanie `ortostaza` niesie dokładnie to zdanie.
> **Pytanie NIE ZMIENIA ścieżki** (wzorzec pytania `odkiedy`), i to jest **wymóg źródła**: §5.4
> `[H52]` niesie jedyne w całym dokumencie „should be performed" i każe wykonać próbę pozycyjną
> u chorego z zawrotem ortostatycznym **nawet gdy jego zawrót nie jest pozycyjny**. Pilnuje tego
> nowa bramka **KL9** — kontrola czułości wykonana: po ściągnięciu ścieżki zapalają się obie gałęzie.
> **Żadnej liczby nie wpisano** — progi mmHg mają u `[H52]` rangę **noty**, kryterium B brzmi
> jakościowo, a nota 4 sama ostrzega, że powtarzalność hipotonii w teście pochyleniowym jest niska.
>
> **PIERWSZA LUKA — ZAMKNIĘTA WCZEŚNIEJ, D-CZAS, `b50d7d2` (2026-08-21).** Kwestionariusz **pyta**: piąte
> pytanie kwalifikacji, `src/app/triage-model.js:88` („Poniżej 2 tygodni od początku"). Oś czasu
> sprowadzono przy okazji do `[H61]` — trzecie pasmo (CVS) i węzeł przewlekły. Iloczyn kombinacji
> bramki 2176 → 10880. **Nauka wyciągnięta i warta powtórzenia:** dołożenie **wymaganego** pytania
> unieważniło każdą fiksturę czytającą kompletność — `hints:dom` była od tego commita czerwona,
> a golden zamroził **11 kluczy pinujących nie ten ekran**, przy zielonej wyroczni. Naprawione
> w `c3ebf18`.
>
> **E5a zrobione osobno (`e446f1c`):** dwie komórki karty GRACE były **nieprawdziwe** wobec źródeł,
> które program już miał. **Reszta E5 — 97 miejsc bez numeru — zostaje**, ~~razem z D-5D, D-ORTO
> i D-CT~~ *(dopisek 2026-08-22: wszystkie trzy decyzje tego zdania są już rozstrzygnięte —
> D-ORTO `d0f0a3b`, D-CT `9332244`, D-5D kontrola K7-C1; zostaje samo „97 miejsc")*.

---

### E6 — Atlas otoneurologiczny · **ZROBIONE** · *D6 rozstrzygnięte*

**Cel pierwotny.** Dla każdej z 10 nieobecnych jednostek zapisać **jawnie**: wchodzi / poza
zakresem — i dlaczego. Sam zapis „świadomie poza zakresem" jest produktem: odróżnia decyzję
od przeoczenia.

> **D6 ROZSTRZYGNIĘTE 2026-08-22 (decyzja użytkownika) — I PYTANIE OKAZAŁO SIĘ ŹLE POSTAWIONE,
> tak jak D1 i D2.** Etap pytał, KTÓRE jednostki wchodzą. Odpowiedź brzmi: **wszystkie — ale nie
> tam, gdzie pytanie zakładało.** Program ma ZNAĆ komplet jednostek ICVD, natomiast ścieżka OSTRA
> — ta, na której stoi GRACE-3 i HINTS — pozostaje **OGÓLNA** i rozpoznań się w niej **nie mnoży**.
> Jednostki szczegółowe mieszkają w osobnym, **rozłącznym** zakresie: szóstym obszarze aplikacji.
>
> **DLACZEGO `sciezka: null` BYŁA PRZECIĄŻONA — to jest pomiar, który wyznaczył kształt etapu.**
> Kwalifikacja ma dziewięć wyjść, z czego **pięć** kończyło się `null`, a `null` znaczyło w nich
> trzy różne rzeczy: „działaj pilnie, nie czytaj" (czerwona flaga), „odpowiedz najpierw na pytanie"
> (niepewna, pseudo-AVS) oraz — w węzłach **sEVS** i **CVS** — „ICVD definiuje tu jednostki, tylko
> nasz silnik ich nie modeluje". To trzecie znaczenie jest **destynacją**, nie ślepym końcem.
> Węzeł CVS **już wymieniał** PPPD `[H50]`, obustronną westybulopatię `[H19]` i presbywestybulopatię
> `[H53]` — prozą. Atlas nie dokłada więc twierdzenia klinicznego; **nadaje strukturę zdaniu,
> które już stało**.
>
> **CO POWSTAŁO.** `src/app/atlas-model.js` — **18 wpisów** (14 jednostek, 3 dokumenty ramowe,
> 1 stanowisko), po jednym na każdy dokument korpusu poza Lempertem 2012 (D7: numeru nie dostaje).
> Moduł **CZYSTY**: zero importów, zero DOM. Wpis niesie `zrodlo`, `kryteria` (parafraza), `progi`
> z **rangą**, `granice` źródła, `zespol` wg `[H61]` i `wSilniku`.
>
> **REJESTR ZAKRESU PRZESTAŁ BYĆ PROZĄ.** `wSilniku` jest polem ze zbioru zamkniętego
> {`modelowana`, `kryteria-bez-modelu`, `poza-zakresem`}, każde ze **zmierzonym** dowodem (co
> grepowano, ile trafień). Rozkład: **7 / 7 / 4**. To jest odpowiedź na E6 uczyniona strukturą —
> i bezpośrednia odpowiedź na to, co unieważniło mapę pokrycia miesiąc wcześniej: akapit prozy
> zestarzał się po cichu, pole bramka liczy.
>
> **TRZECI TYP DOKUMENTU, KTÓREGO NIE BYŁO W PLANIE.** `[H60]` Seemungal 2022 nie jest ani
> jednostką (praca **jawnie odmawia** kryteriów), ani dokumentem ramowym (nie jest słownikiem).
> Pierwsza wersja treści wcisnęła go do „ramowy" i to było **zacieranie**: czytelnik karty bez
> kryteriów musiałby sam zgadnąć, czemu ich nie ma. Doszła wartość `stanowisko`.
>
> **RANGA PROGU** — `kryterium` / `nota` / `proza`. Karta pokazuje dwie pierwsze. Wzięte wprost
> z lekcji E3a (`GAIN_CUT` wyglądał jak kryterium, a był dolną granicą normy z noty) i D-CT (cel
> obrazowania stał w prozie, a był treścią kryterium B). Zmierzone: **301 progów → 119**, z czego
> **14 jest jakościowych** — źródło nie podaje dla nich liczby w ogóle.
>
> **ZASIĘG, ZMIERZONY.** `snapshot:check` — **32 klucze**: 4 (ekran startowy), 6 (okno HINTS),
> 22 (szyna nawigacji). **Zero** w `plans`, `neuro`, `dyn` i `pose` — fizyka nietknięta.
> `zrodla:check` 228 → 268, arytmetyka rozpisana per plik. `pwa:check` 237 → 239 (przyrost
> **mechaniczny**: bramka F6 biegnie raz na plik `.js` w `src/`).

> **WARIANT A — OKNO „DIAGNOSTYKA HINTS / HINTS+" PRZESTAŁO BYĆ KWESTIONARIUSZEM.**
> Do tego etapu `renderHintsKwal` renderował **cały** kwestionariusz kwalifikacji, więc ekran
> nazwany „HINTS" w połowie przypadków kończył się zdaniem, że HINTS nie ma tu zastosowania —
> nazwa okna mówiła co innego niż jego treść. Kwestionariusz wrócił na swój ekran (krok 1),
> a w oknie HINTS został **krok 2**: przeszkolenie, pułapki, wejście do badania + karta
> pokazująca werdykt kroku 1 i prowadząca do niego z powrotem.
>
> **NACISKOWA WADA, KTÓRĄ TO ZDEJMUJE — zmierzona, nie wydedukowana.** Przy werdykcie
> „odradzana" klinicysta, który **bada pacjenta**, miał na tym ekranie dokładnie **dwa** ruchy
> do przodu i **oba wchodziły w HINTS** (`pozaAplikacja` i `mimoOdradzania` — jedyne dwa powody
> pominięcia z `badaniePacjenta: true`). Konstrukcja sama pchała ku obejściu bramki. Trzecie
> wyjście — do atlasu — **opuszcza tryb HINTS**, więc nie jest ósmą drogą omijającą `wolnoBadac`.
>
> **PIĄTY KAFEL STARTOWY BYŁ ŹLE SKIEROWANY.** „Przypadek nietypowy" prowadził wprost do
> `goHintsKwal()` — czyli przypadek z definicji **najmniej** pasujący do HINTS był wstępnie
> przypisywany do HINTS, zanim padło jakiekolwiek pytanie. To dokładnie użycie, któremu
> `triage-model.js` ma zapobiegać. Teraz prowadzi do kwalifikacji. Szósty kafel otwiera Atlas.

> **CZTERY ZNALEZISKA UBOCZNE, WSZYSTKIE ZAMKNIĘTE W TYM ETAPIE.**
> 1. **DWIE FIKSTURY ZŁOTEGO WZORCA NIGDY NIE OSIĄGAŁY STANU ZE SWOJEJ NAZWY.** `hintsKwal/
>    odradzana-BPPV` i `hintsKwal/czerwona-flaga` nie podawały odpowiedzi `odkiedy`, więc od etapu
>    D-CZAS `triageComplete` było fałszem i obie pinowały **ekran niewypełnionej kwalifikacji** —
>    to samo, co `pusta`. Naprawa D-CZAS-FIX objęła `kwalifikuj()` i klucze `hintsBad/*`, ale
>    **nie te dwa**, stojące obok. Kwestionariusz to maskował: trzy klucze różniły się zaznaczonymi
>    odpowiedziami. Wariant A kwestionariusz zabrał i różnica zniknęła — zmierzone: `pusta`
>    i `odradzana-BPPV` miały po **3657 znaków, bajt w bajt**. Ta sama metoda wykrycia co przy
>    D-CZAS-FIX: **identyczne długości**.
> 2. **`goArea('atlas')` NIE DZIAŁAŁO MIMO POPRAWNEJ GAŁĘZI.** `applyArea` ma `A.goAtlas && …`,
>    ale `A` jest wstrzykiwane przez `mountNav(deps)` — a `goAtlas` tam nie trafiło. Strażnik
>    `A.x &&` chroni bundel bez akcji, ale zamienia brak wstrzyknięcia w **ciszę**: obszar zostawał
>    `diag`, ekran `setup`. Złapane przez `atlas:dom`, nie przez czytanie kodu.
> 3. **KOMENTARZ HTML W SZABLONIE TRAFIAŁ DO PRODUKCYJNEGO DOM.** Notatka dla programisty
>    wstawiona wewnątrz literału szablonu urosła ekran startowy o **1,8 kB na każdym renderze**.
>    Przy okazji: `/* */` jest tam **tekstem**, nie komentarzem, a backtick rozrywa literał.
> 4. **BRAMKA ATL2c BYŁA ŹLE POSTAWIONA — MOJA WŁASNA.** Żądała cyfry w każdym progu i zapaliła
>    się na czternastu, którym cyfry **nie daje źródło** („rzędu godzin", „dni do tygodni", a we
>    wpisie MdDS wprost „bez wartości liczbowej"). Wyrocznia w tamtej postaci **nagradzałaby
>    dopisanie liczby**, której praca nie niesie. Poprawiona: żąda wartości niepustej i kontekstu.

> **GRANICA LICENCYJNA — POMIAR, NIE ZAPEWNIENIE.** Repozytorium jest publiczne, a trzy prace
> (`[H47]`, `[H20]`, `[H48]`) są wydane przez IOS Press z klauzulą „all rights reserved".
> Kontrola adwersaryjna znalazła w pierwszej wersji treści **dosłowne przedruki** — najdłuższy
> **38 słów** z `[H48]`, dalej 28 i 26 z `[H20]` — i wszystkie poprawiła. Ponieważ „poprawione"
> jest zapewnieniem, powstało narzędzie **`tools/atlas-parafraza.mjs`**: mierzy najdłuższy wspólny
> ciąg słów między każdym polem angielskim atlasu a pełnym tekstem jego pracy. Uruchamiane przy
> korpusie (pełne teksty leżą celowo poza repo), bez korpusu **nie udaje wyniku zielonego**.
> *(Dopisek 2026-08-22, przegląd dokumentacji: domyślna ścieżka narzędzia szuka odtąd katalogu
> `icvd-korpus` w górę drzewa katalogów — wcześniejsze sztywne trzy `..` nie trafiały z żadnej
> lokalizacji repo, więc pomiar biegł wyłącznie z jawnym `--korpus`, o którym ta nota milczała.)*
> Pomiar po korekcie: **1022 pola, 24 z ciągiem ≥ 10 słów, maksimum 13** — przy czym prace IOS
> Press są praktycznie czyste (`[H48]` jedno pole 10 słów, `[H20]` i `[H47]` **zero**).
> Te 24 pola zostały następnie przepisane osobno; **liczby, operatory brzegowe i spójniki logiczne
> zostają co do znaku** — obniżanie pomiaru kosztem liczby byłoby gorsze niż sam pomiar.

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
E0 (fundament)  ──┬──> E1 (BPPV)     ──> E2 (oczopląs)   [pkt 2,3 zamknięte przez D-CPN]
   ✔ ee08f99      │     ✔ ae36e0a           ⟳ zostaje pkt 1 i 4
                  ├──> E4 (Ménière/AUVP)    ✔ E4a ca8a649  ⟳ E4b zostaje
                  ├──> E5 (kwalifikacja)    ✔ E5a e446f1c  ⟳ reszta zostaje
                  └──> E3 (progi)     ✔ E3a e7b4e09 (D1 rozstrzygnięty)  ⟳ zostaje VEMP/fotel/nazwiska
                                   ✔ E6 (atlas) 83a147a..63c3c27 — D6 rozstrzygnięte (f99e6a7)
                                   E7 (słownik) — ostatni
```

E0 musiał być pierwszy. E1 i E2 są sprzężone (oba dotyczą karty diagnostyki), ale E1 pierwszy,
bo E2 korzysta z jego rozdziału. Reszta jest równoległa.

**Merge do `main` — WYKONANY 2026-08-21.** Scalenie fast-forward `5035f09` → `b6e5203`, bez commita
scalającego; przed pushem 27/27 bramek zielonych i build OK. Push wyzwolił GitHub Actions
i przebudowę PWA — zmiana jest u użytkowników. **Android to osobny tor i krok użytkownika**
(`npm run sync` + versionCode + podpisany AAB). Kolejne etapy scalają się tak samo: po weryfikacji
użytkownika, zgodnie z ustaleniem otwierającym.
