# OTOREPO — asystent przedsionkowy (BPPV, testy pozycyjne, HINTS)

[English](README.md) · **Polski**

Narzędzie **dydaktyczne / wspomagające dla personelu medycznego** obejmujące dwa filary przyłóżkowej oceny przedsionkowej: **łagodne położeniowe zawroty głowy (BPPV)** — diagnostyka pozycyjna i repozycja otolitów — oraz **różnicowanie ostrego zespołu przedsionkowego (HINTS, ośrodek↔obwód)**. Kierunek i dynamika oczopląsu wynikają wyłącznie z fizjologii (prawa Ewalda i symulacja cząstki złogu dla BPPV; toniczny/ośrodkowy VOR dla HINTS), bez ręcznych adnotacji.

Aplikacja jest **modularna** (Vite + moduły ES w `src/`) i wydawana na dwóch kanałach: **PWA** (GitHub Pages, instalowalna offline) oraz **Android** (Capacitor). Monolit `otorepo.html` jest zamrożony i służy wyłącznie jako źródło złotego snapshotu w testach.

> ⚠️ **Zastrzeżenie kliniczne.** Prototyp poglądowy. Nie zastępuje badania, rozpoznania ani decyzji klinicysty. Czasy i wzorce oczopląsu są poglądowe — zweryfikuj z własnym protokołem. Brak gromadzenia danych.

## Uruchomienie

Wymaga Node.js. Instalacja zależności i tryb deweloperski:

```bash
npm install
npm run dev       # serwer Vite (http://localhost:5178)
npm run build     # produkcja: vite build + tools/build-dist.mjs → dist/ (manifest + sw.js z hashem cache + ikony)
npm run preview   # podgląd zbudowanego dist/
```

Walidacja (3 wyrocznie — wszystkie muszą być zielone przed commitem):

```bash
npm run snapshot:check   # złoty snapshot DOM/silnika/pozy (jsdom)
npm run bridge:check     # most kwaternionów OTOREPO ↔ Three.js
npm run view:check       # zgodność kierunków ekranowych SVG ↔ 3D
```

Wizualizacja ma **dwie ścieżki**: schematyczne SVG (rzut ortograficzny 3D, w pełni offline, bez three.js)
oraz sylwetkę WebGL (three.js jako leniwie ładowany chunk) — 3D jest domyślne tam, gdzie działa WebGL,
a SVG stanowi fallback. Zbudowana aplikacja działa **offline** dzięki service workerowi PWA
(precache z zawartości `dist/`, nazwa cache = hash treści → brak ręcznych bumpów).

## Co robi

Trzy zakładki:

- **Repozycja** — wybór zajętego kanału (tylny ~85% / poziomy ~10% / przedni ~1–2%), dobór manewru
  (Epley, Semont, **Bascule** — manewr uwalniający dla kupulolitiazy k. tylnego, Lempert/BBQ,
  Gufoni geo/apo, Yacovino), przewodnik krok-po-kroku z licznikiem, sylwetką pacjenta (3D/SVG),
  animacją wędrówki otolitu w labiryncie oraz kartą frontalną oczopląsu. Rozmiar/gęstość złogu
  (`small`/`medium`/`big`) skaluje dynamikę i zalecane czasy utrzymania pozycji.
- **Diagnostyka** — Dix–Hallpike (tylny/przedni), Roll test (geo/apo), Bow & Lean, deep head-hang;
  predykcja oczopląsu (oczy + dial), mechanizm otolitu (kanalo-/kupulolitiaza), karta zalecanego
  leczenia (aktualizuje się po przełączeniu mechanizmu). Panel **„Powtarzalność prowokacji"** pokazuje
  męczliwość oczopląsu: przy powtarzanym Dix–Hallpike kanalolitiaza słabnie, a kupulolitiaza nie —
  kryterium różnicujące wyprowadzone z fizyki (`fatigueFactor`).
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
  decrescendo / wygasanie / jednokierunkowe wyjście do łagiewki) oraz kupulolitiazy (ciężki osklepek,
  bez latencji, uporczywy). Kierunek, siła i odwrócenie oczopląsu wynikają **wyłącznie z fizyki**.
  Dokumentacja: [`engine_doc.txt`](engine_doc.txt).
- **Silnik `NeuroVOR`** — druga czysta warstwa **bez DOM**: fizjologia toniczna/ośrodkowa VOR (spoczynkowa
  aktywność błędników + prawo Ewalda z obcięciem hamowania → oczopląs samoistny; supresja fiksacji przez
  kłaczek; wzmocnienie kanałów → vHIT + sakada korygująca; integrator „leaky" → oczopląs spojrzeniowy;
  oś grawiceptywna otolity/MLF → skew) oraz synteza **HINTS** (obwód↔ośrodek). Warstwa obejmuje też
  **kompensację ośrodkową** (jeden suwak `c`): clamp móżdżkowy + własny pacemaker znoszą oczopląs samoistny
  (statyczna), regeneracja błędnika → **oczopląs powrotny Bechterewa**; vHIT nienaprawialny (sakady jawne→ukryte
  przez fuzję ważoną wiarygodnością: kanały ↔ propriocepcja szyi); velocity storage 15→~5 s. Patologia i zdrowienie
  emergują ze zmiany parametrów. **Warstwa neuroanatomiczna (silnik):** model uogólniono z kanału poziomego na
  **6 kanałów** per strona — gałęzie nerwu przedsionkowego (górna/dolna), vHIT w płaszczyznach **RALP/LARP**, próba
  **kaloryczna** (CP/DP wg Jongkeesa, dysocjacja nisko-/wysokoczęstotliwościowa) oraz patologie **SCDS/Tullio,
  choroba Ménière'a i obustronna westybulopatia (BVH)**, ze **syntezą kliniczną** (`clinicalReadout`); interaktywny
  tryb **„matematycznego pacjenta"** (własne parametry, suwaki, presety, quiz losowego pacjenta, zapis/link)
  jest **gotowy i podłączony do UI**. Dokumentacja: [`engine_doc.txt`](engine_doc.txt)
  (sekcja „MODUŁ NeuroVOR", odnośniki [H1]–[H22]).
- **Wizualizacja** — jedno źródło pozy (`poseSpec` w `src/pose/maneuvers.js`) zasila dwa renderery:
  `Scene3D` + `src/render/svg-screens.js` rzutują matematykę 3D (kwaterniony, FK szkieletu) ortograficznie
  do schematycznego SVG, a `src/render/three-patient.js` rysuje sylwetkę w WebGL (three.js). Most osi
  OTOREPO↔Three (`three-bridge.js`) jest zweryfikowany liczbowo. Kamera = obserwator (lekarz).
  Dokumentacja: [`view_doc.txt`](view_doc.txt).
- **Walidacja** — trzy wyrocznie offline strzegą spójności: złoty snapshot DOM/silnika/pozy
  (`snapshot:check`), most kwaternionów (`bridge:check`) i zgodność kierunków ekranowych SVG↔3D
  (`view:check`). Silniki są czyste (bez DOM) i importowalne w Node.

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

| Ścieżka | Zawartość |
|---------|-----------|
| `index.html` + `src/main.js`        | punkt wejścia (boot: pacjent z linku, pierwszy render, uchwyt testów) |
| `src/engine/vestibular.js`          | silnik fizyki BPPV (`Vestibular`) — prawa Ewalda, dynamika kanalo-/kupulolitiazy |
| `src/engine/neuro-vor.js`           | silnik toniczny/ośrodkowy (`NeuroVOR`) — VOR, vHIT, HINTS, kaloryka, kompensacja |
| `src/engine/scene3d.js`             | `Scene3D` — kamery i rzut ortograficzny (wspólne źródło prawdy 3D) |
| `src/pose/maneuvers.js`             | domena manewrów/testów + `poseSpec` (jedno źródło pozy) |
| `src/render/svg-screens.js`         | renderer SVG (wszystkie ekrany) |
| `src/render/three-patient.js` + `three-bridge.js` | renderer 3D/WebGL + most osi OTOREPO↔Three |
| `src/app/{state,actions}.js`, `src/runtime/registry.js` | stan, akcje UI, infrastruktura (rAF, wake lock, dźwięk) |
| `tools/{snapshot,bridge-check,view-check}.mjs` | 3 wyrocznie offline · `tools/build-dist.mjs` — statyki PWA + `sw.js` |
| `android/`                          | wrapper Capacitor (Android) |
| `otorepo.html`                      | monolit — **zamrożone** źródło złotego snapshotu (nie edytować) |
| `engine_doc.txt`                    | dokumentacja silników (API, konwencje, kalibracja, bibliografia [H1]–[H22]) |
| `view_doc.txt`                      | dokumentacja warstwy wizualizacji (2.5D SVG + 3D) |
| `todo.txt`                          | lista zadań (otwarte / zrobione, kamienie milowe) |
| `migracja_3d.txt`                   | notatki historyczne nt. migracji 3D (Three.js) |

## Bibliografia (wybór)

Silnik jest zredukowaną, fenomenologiczną implementacją uznanych modeli biomechanicznych BPPV
(pełne mapowanie w `engine_doc.txt`):

- Squires, Weidman, Hain, Stone (2004) — model kanalolitiazy (osiadanie otoconiów, opór Stokesa).
- Hain, Squires, Stone (2005) — implikacje kliniczne; uzasadnienie ~30 s holdów w CRP.
- Dai, Klein, Cohen, Raphan (1999) — stała czasowa osklepka.
- Schuknecht (1969) — kupulolitiaza; Hall, Ruby, McClure (1979) — kanalolitiaza.
- Ewald (1892) — prawa Ewalda I/II/III.
- Wu i wsp. (2021); Della Santina i wsp. (2005) — orientacje płaszczyzn kanałów.

Warstwa `NeuroVOR` (VOR toniczny/ośrodkowy, HINTS, kompensacja, neuroanatomia) — pełne odnośniki [H1]–[H22] w `engine_doc.txt`:

- Goldberg & Fernández (1971) — spoczynkowa aktywność aferentów kanałowych (~90/s).
- Halmagyi & Curthoys (1988); Weber i wsp. (2008) — test pchnięcia głowy (vHIT), sakady korygujące.
- Cannon & Robinson (1987) — integrator nerwowy „leaky" (oczopląs spojrzeniowy).
- Brandt & Dieterich (1993) — odchylenie skośne / OTR (znak pniowy).
- Kattah i wsp. (2009) — HINTS; Tarnutzer i wsp. (2011) — różnicowanie AVS obwód/ośrodek.
- Leigh & Zee, *The Neurology of Eye Movements* — VOR, supresja fiksacji, integrator.
- Curthoys & Halmagyi (1995); Smith & Curthoys (1989) — kompensacja przedsionkowa (clamp, pacemaker, Bechterew).
- Sadeghi, Minor & Cullen (2012); Cullen (2012) — substytucja sensoryczna, sakady covert, fuzja szyjno-oczna.
- Laurens & Angelaki (2011) — model wewnętrzny / velocity storage (podstawa fuzji ważonej wiarygodnością).
- Fetter & Dichgans (1996) — neuronitis oszczędza nerw dolny (mapa gałąź nerwu → kanały, wzorzec vHIT).
- Aw, Halmagyi, Curthoys i wsp. (1996) — analiza wektorowa 3D VOR (vHIT per kanał, płaszczyzny RALP/LARP).
- Minor (2000) — zespół dehiscencji kanału górnego (SCDS / fenomen Tullio, „trzecie okno").
- Strupp i wsp. (2017, Bárány Society) — kryteria obustronnej westybulopatii (BVH).
- Lopez-Escamez i wsp. (2015, Bárány/AAO-HNS) — kryteria choroby Ménière'a.
- Jongkees, Maas, Philipszoon (1962) — próba kaloryczna bitermalna, wzór CP/DP.
- Musat i wsp. (2025) — neuronitis nerwu dolnego (SVV, VEMP: woreczek/łagiewka, wzorzec vHIT kanału tylnego).

## Licencja

Projekt objęty licencją **GNU General Public License v3.0** (GPL-3.0). Oznacza to m.in., że
możesz go używać, studiować, modyfikować i rozpowszechniać, pod warunkiem że utwory pochodne
pozostaną objęte tą samą licencją (copyleft) i zachowają informację o źródle. Oprogramowanie
dostarczane jest **bez jakiejkolwiek gwarancji**, w zakresie dopuszczalnym przez prawo.

Pełny tekst licencji znajduje się w pliku [`LICENSE`](LICENSE).
