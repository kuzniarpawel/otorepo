# OTOREPO — asystent repozycji i diagnostyki otolitów (BPPV)

Jednoplikowa aplikacja HTML/JS wspomagająca **diagnostykę i leczenie łagodnych położeniowych zawrotów głowy (BPPV)** — repozycję otolitów. Narzędzie **dydaktyczne / wspomagające dla personelu medycznego**: modeluje fizykę złogu otolitowego w kanałach półkolistych i wyprowadza kierunek oraz dynamikę oczopląsu wyłącznie z praw Ewalda i symulacji cząstki (bez ręcznych adnotacji).

> ⚠️ **Zastrzeżenie kliniczne.** Prototyp poglądowy. Nie zastępuje badania, rozpoznania ani decyzji klinicysty. Czasy i wzorce oczopląsu są przybliżone (wariant kanalitiazy/geotropowy). Zweryfikuj z własnym protokołem. Brak gromadzenia danych.

## Uruchomienie

Brak kroku budowania i brak zależności — cała aplikacja to jeden plik `otorepo.html`.

- **Najprościej:** otwórz `otorepo.html` bezpośrednio w przeglądarce (działa też z `file://`).
- **Przez serwer statyczny** (dowolny), np.:
  - `python -m http.server 8000` → http://localhost:8000/otorepo.html
  - `npx serve` (Node)
  - dowolny inny serwer plików statycznych

Aplikacja jest w pełni offline (brak three.js / CDN); wizualizacja to schematyczne SVG z rzutu 3D.

## Co robi

Trzy zakładki:

- **Repozycja** — wybór zajętego kanału (tylny ~85% / poziomy ~10% / przedni ~1–2%), dobór manewru
  (Epley, Semont, Lempert/BBQ, Gufoni geo/apo, Yacovino), przewodnik krok-po-kroku z licznikiem,
  schematem głowy z góry, animacją wędrówki otolitu w labiryncie oraz kartą frontalną oczopląsu.
- **Diagnostyka** — Dix–Hallpike (tylny/przedni), Roll test (geo/apo), Bow & Lean, deep head-hang;
  predykcja oczopląsu (oczy + dial), mechanizm otolitu (kanalo-/kupulolitiaza), karta zalecanego leczenia.
- **HINTS (różnicowanie ośrodek↔obwód)** — model **„od pierwszych zasad"** (silnik `NeuroVOR`): zmieniasz
  fizjologię (spoczynkowa aktywność błędników, wzmocnienie kanałów, kłaczek, integrator, otolity), a oczopląs
  samoistny, jego zależność od fiksacji/spojrzenia, wynik pchnięcia głowy (vHIT) i odchylenie skośne
  **wynikają same**. Scenariusze (zdrowy / neuronitis / udar), interaktywne panele (oczopląs + Frenzel/spojrzenie,
  vHIT z sakadą korygującą, naprzemienne zasłanianie) i karta werdyktu HINTS (mnemonik INFARCT). Suwak
  **kompensacji ośrodkowej** (`c`) pokazuje zdrowienie: oczopląs samoistny znika, sakady vHIT przechodzą
  z jawnych w ukryte, a regeneracja błędnika daje **oczopląs powrotny Bechterewa**.

## Architektura

Jedno źródło prawdy 3D (układ głowy: `x = prawo, y = góra/czaszka, z = przód/nos`) wspólne dla fizyki i wizualizacji.

- **Silnik `Vestibular`** — czysty moduł **bez DOM** (testowalny offline). Prawa Ewalda (I/II/III),
  dynamika kanalolitiazy (otolit na łuku kanału, opór Stokesa, osklepek 1. rzędu → latencja / crescendo /
  decrescendo / wygasanie / jednokierunkowe wyjście do woreczka) oraz kupulolitiazy (ciężki osklepek,
  bez latencji, uporczywy). Kierunek, siła i odwrócenie oczopląsu wynikają **wyłącznie z fizyki**.
  Dokumentacja: [`engine_doc.txt`](engine_doc.txt).
- **Silnik `NeuroVOR`** — druga czysta warstwa **bez DOM**: fizjologia toniczna/ośrodkowa VOR (spoczynkowa
  aktywność błędników + prawo Ewalda z obcięciem hamowania → oczopląs samoistny; supresja fiksacji przez
  kłaczek; wzmocnienie kanałów → vHIT + sakada korygująca; integrator „leaky" → oczopląs spojrzeniowy;
  oś grawiceptywna otolity/MLF → skew) oraz synteza **HINTS** (obwód↔ośrodek). Warstwa obejmuje też
  **kompensację ośrodkową** (jeden suwak `c`): clamp móżdżkowy + własny pacemaker znoszą oczopląs samoistny
  (statyczna), regeneracja błędnika → **oczopląs powrotny Bechterewa**; vHIT nienaprawialny (sakady jawne→ukryte
  przez fuzję ważoną wiarygodnością: kanały ↔ propriocepcja szyi); velocity storage 15→~5 s. Patologia i zdrowienie
  emergują ze zmiany parametrów. Dokumentacja: [`engine_doc.txt`](engine_doc.txt) (sekcja „MODUŁ NeuroVOR", [H1]–[H14]).
- **Wizualizacja `Scene3D` (2.5D)** — matematyka 3D (kwaterniony, FK szkieletu) rzutowana ortograficznie
  do schematycznego SVG; kamera = obserwator (lekarz). Dokumentacja: [`view_doc.txt`](view_doc.txt).

### Rozmiar/gęstość złogu (parametr `size`)

Aplikacja modeluje **rozmiar złogu otoconiów** jako parametr skalujący (`small` / `medium` / `big`,
domyślnie `medium` = kalibracja bazowa). Od promienia `r` skalują się:

| Wielkość | Skalowanie | Uzasadnienie fizyczne |
|----------|-----------|-----------------------|
| `tauP`   | ∝ r⁻²     | prędkość osiadania Stokesa v ∝ r² (większa cząstka płynie szybciej) |
| `gc`     | ∝ r³      | wyparta objętość/masa endolimfy → wychylenie osklepka |
| `adh`    | ∝ r       | siła oderwania sfery od ścianki (skalowanie JKR/DMT) |

Skutki (emergentne, zgodne z kliniką): **duży** złóg → krótsza latencja, silniejszy i szybszy oczopląs,
szybsze wyleczenie; **mały** → długa latencja, słaby i wolny przebieg. Dla małych (wolno osiadających)
złogów aplikacja **wydłuża zalecany czas utrzymania pozycji** (holdy) — zgodnie z uzasadnieniem ~30 s
holdów w manewrach repozycyjnych (Hain, Squires & Stone 2005). Animacja wędrówki otolitu skaluje
prędkość ∝ 1/r² (Stokes). Zakładka Diagnostyki pozostaje przy `medium`.

## Mapa plików

| Plik | Zawartość |
|------|-----------|
| `otorepo.html`   | cała aplikacja (silnik `Vestibular`, `Scene3D`, UI) |
| `engine_doc.txt` | dokumentacja silnika fizyki (API, konwencje, kalibracja, bibliografia) |
| `view_doc.txt`   | dokumentacja warstwy wizualizacji 2.5D |
| `todo.txt`       | lista zadań (otwarte / zrobione, kamienie milowe) |
| `migracja_3d.txt`| notatki nt. ewentualnej migracji do 3D (Three.js) — projekt na przyszłość |

## Bibliografia (wybór)

Silnik jest zredukowaną, fenomenologiczną implementacją uznanych modeli biomechanicznych BPPV
(pełne mapowanie w `engine_doc.txt`):

- Squires, Weidman, Hain, Stone (2004) — model kanalolitiazy (osiadanie otoconiów, opór Stokesa).
- Hain, Squires, Stone (2005) — implikacje kliniczne; uzasadnienie ~30 s holdów w CRP.
- Dai, Klein, Cohen, Raphan (1999) — stała czasowa osklepka.
- Schuknecht (1969) — kupulolitiaza; Hall, Ruby, McClure (1979) — kanalolitiaza.
- Ewald (1892) — prawa Ewalda I/II/III.
- Wu i wsp. (2021); Della Santina i wsp. (2005) — orientacje płaszczyzn kanałów.

Warstwa `NeuroVOR` (VOR toniczny/ośrodkowy, HINTS, kompensacja) — pełne odnośniki [H1]–[H14] w `engine_doc.txt`:

- Goldberg & Fernández (1971) — spoczynkowa aktywność aferentów kanałowych (~90/s).
- Halmagyi & Curthoys (1988); Weber i wsp. (2008) — test pchnięcia głowy (vHIT), sakady korygujące.
- Cannon & Robinson (1987) — integrator nerwowy „leaky" (oczopląs spojrzeniowy).
- Brandt & Dieterich (1993) — odchylenie skośne / OTR (znak pniowy).
- Kattah i wsp. (2009) — HINTS; Tarnutzer i wsp. (2011) — różnicowanie AVS obwód/ośrodek.
- Leigh & Zee, *The Neurology of Eye Movements* — VOR, supresja fiksacji, integrator.
- Curthoys & Halmagyi (1995); Smith & Curthoys (1989) — kompensacja przedsionkowa (clamp, pacemaker, Bechterew).
- Sadeghi, Minor & Cullen (2012); Cullen (2012) — substytucja sensoryczna, sakady covert, fuzja szyjno-oczna.
- Laurens & Angelaki (2011) — model wewnętrzny / velocity storage (podstawa fuzji ważonej wiarygodnością).

## Licencja

Projekt objęty licencją **GNU General Public License v3.0** (GPL-3.0). Oznacza to m.in., że
możesz go używać, studiować, modyfikować i rozpowszechniać, pod warunkiem że utwory pochodne
pozostaną objęte tą samą licencją (copyleft) i zachowają informację o źródle. Oprogramowanie
dostarczane jest **bez jakiejkolwiek gwarancji**, w zakresie dopuszczalnym przez prawo.

Pełny tekst licencji znajduje się w pliku [`LICENSE`](LICENSE).
