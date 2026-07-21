# OTOREPO — Google Play store listing

Maintained source for the Google Play Store listing, kept bilingual (EN + PL).
Paste the matching locale into Play Console → *Main store listing* (default/`en-US`) and the
Polish locale (`pl-PL`). Character limits enforced by Play:

| Field | Limit |
|-------|-------|
| Title (app name) | 30 characters |
| Short description | 80 characters |
| Full description | 4000 characters |

Privacy-policy URL for the listing: `privacy.html` (published at the same GitHub Pages origin as the app).

> Note: the English **Title** (30) and **Short description** (80) sit exactly at their caps (no headroom).
> If Play Console rejects either, drop a word (e.g. Short → "…differentiation. Teaching tool.").

---

## English (`en-US`)

**Title** (≤30)

```
OTOREPO — vestibular assistant
```

**Short description** (≤80)

```
BPPV repositioning + HINTS central/peripheral differentiation. Educational tool.
```

**Full description** (≤4000)

```
OTOREPO is a teaching and support tool for medical staff, built around two pillars of bedside vestibular assessment.

BENIGN PAROXYSMAL POSITIONAL VERTIGO (BPPV)
Positional diagnosis (Dix–Hallpike, Roll test, Bow & Lean, deep head-hang) and otolith repositioning (Epley, Semont, Bascule, Lempert/BBQ, Gufoni geo/apo, Yacovino) — with a step-by-step guide, a timer, a patient silhouette (3D/SVG), an animation of the otolith's travel through the labyrinth, and a frontal nystagmus card. Debris size scales the dynamics and the recommended position-hold times.

ACUTE VESTIBULAR SYNDROME (HINTS)
Central vs. peripheral differentiation driven by a first-principles model of the vestibulo-ocular reflex: spontaneous nystagmus, its fixation/gaze dependence, the head impulse test (vHIT), and skew deviation emerge from the underlying physiology rather than from hand-drawn patterns. Includes scenarios (healthy / neuritis / stroke), the INFARCT verdict, a central-compensation slider, the caloric test, RALP/LARP vHIT, and superior canal dehiscence (SCDS), Ménière's disease, and bilateral vestibulopathy.

WHY IT STAYS CONSISTENT
Nystagmus direction and dynamics are computed from physiology (Ewald's laws and a canalith-particle simulation), not annotated by hand — so the patterns stay internally consistent as you change the maneuver, the side, or the parameters.

PRIVACY & OFFLINE
• Runs fully offline — no internet permission.
• Collects no data — no accounts, analytics, advertising, or tracking.

DISCLAIMER
OTOREPO is an illustrative, educational tool. It is not a medical device and does not replace clinical examination, diagnosis, or judgment. The nystagmus timings and patterns shown are approximate.
```

---

## Polski (`pl-PL`)

**Tytuł** (≤30) — *uwaga: „OTOREPO — asystent przedsionkowy" ma 32 znaki (2 ponad limit); poniższy wariant bez myślnika ma 30.*

```
OTOREPO asystent przedsionkowy
```

**Krótki opis** (≤80)

```
Repozycja BPPV + różnicowanie HINTS ośrodek/obwód. Narzędzie dydaktyczne.
```

**Pełny opis** (≤4000)

```
OTOREPO to narzędzie dydaktyczne i wspomagające dla personelu medycznego, zbudowane wokół dwóch filarów przyłóżkowej oceny przedsionkowej.

ŁAGODNE POŁOŻENIOWE ZAWROTY GŁOWY (BPPV)
Diagnostyka pozycyjna (Dix–Hallpike, Roll test, Bow & Lean, deep head-hang) i repozycja otolitów (Epley, Semont, Bascule, Lempert/BBQ, Gufoni geo/apo, Yacovino) — z przewodnikiem krok po kroku, licznikiem, sylwetką pacjenta (3D/SVG), animacją wędrówki otolitu w błędniku i frontalną kartą oczopląsu. Rozmiar złogu skaluje dynamikę i zalecane czasy utrzymania pozycji.

OSTRY ZESPÓŁ PRZEDSIONKOWY (HINTS)
Różnicowanie ośrodek/obwód napędzane modelem odruchu przedsionkowo-ocznego „od pierwszych zasad": oczopląs samoistny, jego zależność od fiksacji/spojrzenia, test pchnięcia głową (vHIT) i odchylenie skośne wynikają z fizjologii, a nie z ręcznie rysowanych wzorców. Zawiera scenariusze (zdrowy / neuronitis / udar), werdykt INFARCT, suwak kompensacji ośrodkowej, próbę kaloryczną, vHIT RALP/LARP oraz dehiscencję kanału górnego (SCDS), chorobę Ménière'a i obustronną westybulopatię.

DLACZEGO POZOSTAJE SPÓJNE
Kierunek i dynamika oczopląsu są liczone z fizjologii (prawa Ewalda i symulacja cząstki złogu), a nie nanoszone ręcznie — dzięki temu wzorce pozostają wewnętrznie spójne przy zmianie manewru, strony czy parametrów.

PRYWATNOŚĆ I OFFLINE
• Działa w pełni offline — bez uprawnienia do internetu.
• Nie zbiera żadnych danych — bez kont, analityki, reklam i śledzenia.

ZASTRZEŻENIE
OTOREPO to narzędzie poglądowe i edukacyjne. Nie jest wyrobem medycznym i nie zastępuje badania, rozpoznania ani decyzji klinicysty. Prezentowane czasy i wzorce oczopląsu są przybliżone.
```
