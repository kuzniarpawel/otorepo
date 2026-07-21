# OTOREPO — vestibular assistant (BPPV, positional tests, HINTS)

**English** · [Polski](README.pl.md)

A **teaching / support tool for medical staff** covering two pillars of bedside vestibular assessment: **benign paroxysmal positional vertigo (BPPV)** — positional diagnosis and otolith repositioning — and **differentiation of the acute vestibular syndrome (HINTS, central↔peripheral)**. Nystagmus direction and dynamics arise purely from physiology (Ewald's laws and a canalith-particle simulation for BPPV; tonic/central VOR for HINTS), with no manual annotations.

The app is **modular** (Vite + ES modules in `src/`) and shipped on two channels: **PWA** (GitHub Pages, installable offline) and **Android** (Capacitor). The `otorepo.html` monolith is frozen and serves only as the golden-snapshot source in tests.

> ⚠️ **Clinical disclaimer.** Illustrative prototype. It does not replace clinical examination, diagnosis, or judgment. Nystagmus timings and patterns are illustrative — verify against your own protocol. No data collection.

## Getting started

Requires Node.js. Install dependencies and start dev mode:

```bash
npm install
npm run dev       # Vite server (http://localhost:5178)
npm run build     # production: vite build + tools/build-dist.mjs → dist/ (manifest + content-hashed sw.js cache + icons)
npm run preview   # preview the built dist/
```

Validation (3 oracles — all must be green before committing):

```bash
npm run snapshot:check   # golden DOM/engine/pose snapshot (jsdom)
npm run bridge:check     # OTOREPO ↔ Three.js quaternion bridge
npm run view:check       # SVG ↔ 3D screen-direction agreement
```

The visualization has **two paths**: schematic SVG (orthographic 3D projection, fully offline, no three.js)
and a WebGL silhouette (three.js as a lazy-loaded chunk) — 3D is the default wherever WebGL works,
with SVG as the fallback. The built app runs **offline** thanks to the PWA service worker
(precache from `dist/` contents, cache name = content hash → no manual bumps).

## What it does

Three tabs:

- **Repositioning** — select the involved canal (posterior ~85% / horizontal ~10% / anterior ~1–2%), choose the
  maneuver (Epley, Semont, **Bascule** — a liberatory maneuver for posterior-canal cupulolithiasis, Lempert/BBQ,
  Gufoni geo/apo, Yacovino), a step-by-step guide with a timer, a patient silhouette (3D/SVG),
  an animation of the otolith's travel through the labyrinth, and a frontal nystagmus card. Debris size/density
  (`small`/`medium`/`big`) scales the dynamics and the recommended position-hold times.
- **Diagnostics** — Dix–Hallpike (posterior/anterior), Roll test (geo/apo), Bow & Lean, deep head-hang;
  nystagmus prediction (eyes + dial), otolith mechanism (canalith-/cupulolithiasis), a recommended-treatment
  card (updates when the mechanism is toggled). The **"Provocation repeatability"** panel shows nystagmus
  fatigability: on repeated Dix–Hallpike, canalithiasis weakens while cupulolithiasis does not —
  a differentiating criterion derived from physics (`fatigueFactor`).
- **HINTS (central↔peripheral differentiation)** — a **"first-principles"** model (`NeuroVOR` engine): you change
  the physiology (resting labyrinthine activity, canal gain, flocculus, integrator, otoliths) and the spontaneous
  nystagmus, its fixation/gaze dependence, the head-impulse result (vHIT), and the skew deviation
  **emerge on their own**. Scenarios (healthy / neuritis / stroke), interactive panels (nystagmus + Frenzel/gaze,
  vHIT with a corrective saccade, alternate cover), and a HINTS verdict card (INFARCT mnemonic). The
  **central-compensation** slider (`c`) shows recovery: the spontaneous nystagmus fades, vHIT saccades shift
  from overt to covert, and labyrinthine regeneration produces **Bechterew's recovery nystagmus**.

## Architecture

A single 3D source of truth (head frame: `x = right, y = up/cranial, z = forward/nose`) shared by physics and visualization.

- **`Vestibular` engine** — a pure **DOM-free** module (offline-testable). Ewald's laws (I/II/III),
  canalithiasis dynamics (otolith on the canal arc, Stokes drag, first-order cupula → latency / crescendo /
  decrescendo / extinction / unidirectional exit to the utricle) and cupulolithiasis (heavy cupula, no latency,
  persistent). Nystagmus direction, strength, and reversal follow **from physics alone**.
  Documentation: [`engine_doc.en.txt`](engine_doc.en.txt).
- **`NeuroVOR` engine** — a second pure **DOM-free** layer: tonic/central VOR physiology (resting labyrinthine
  activity + Ewald's law with an inhibitory cut-off → spontaneous nystagmus; fixation suppression by the
  flocculus; canal gain → vHIT + corrective saccade; a "leaky" integrator → gaze-evoked nystagmus;
  graviceptive axis otoliths/MLF → skew) and the **HINTS** synthesis (peripheral↔central). The layer also covers
  **central compensation** (one slider `c`): a cerebellar clamp + an intrinsic pacemaker abolish the spontaneous
  nystagmus (static), labyrinthine regeneration → **Bechterew's recovery nystagmus**; vHIT is unrepairable
  (saccades overt→covert via reliability-weighted fusion: canals ↔ neck proprioception); velocity storage 15→~5 s.
  Pathology and recovery emerge from parameter changes. **Neuroanatomical layer (engine):** the model is
  generalized from the horizontal canal to **6 canals** per side — vestibular-nerve branches (superior/inferior),
  vHIT in the **RALP/LARP** planes, the **caloric** test (CP/DP per Jongkees, low-/high-frequency dissociation),
  and the pathologies **SCDS/Tullio, Ménière's disease, and bilateral vestibulopathy (BVH)**, with a
  **clinical synthesis** (`clinicalReadout`); the interactive **"mathematical patient"** mode (custom parameters,
  sliders, presets, random-patient quiz, save/link) is **ready and wired to the UI**.
  Documentation: [`engine_doc.en.txt`](engine_doc.en.txt) (the "NeuroVOR MODULE" section, references [H1]–[H22]).
- **Visualization** — a single pose source (`poseSpec` in `src/pose/maneuvers.js`) feeds two renderers:
  `Scene3D` + `src/render/svg-screens.js` project the 3D math (quaternions, skeletal FK) orthographically
  into schematic SVG, while `src/render/three-patient.js` draws the silhouette in WebGL (three.js). The axis
  bridge OTOREPO↔Three (`three-bridge.js`) is numerically verified. The camera = the observer (clinician).
  Documentation: [`view_doc.en.txt`](view_doc.en.txt).
- **Validation** — three offline oracles guard consistency: the golden DOM/engine/pose snapshot
  (`snapshot:check`), the quaternion bridge (`bridge:check`), and SVG↔3D screen-direction agreement
  (`view:check`). The engines are pure (DOM-free) and importable in Node.

### Debris size/density (the `size` parameter)

The app models **otoconial debris size** as a scaling parameter (`small` / `medium` / `big`,
default `medium` = base calibration). The radius `r` scales:

| Quantity | Scaling | Physical rationale |
|----------|---------|--------------------|
| `tauP`   | ∝ r⁻²   | Stokes settling velocity v ∝ r² (a larger particle sinks faster) |
| `gc`     | ∝ r³    | displaced endolymph volume/mass → cupular deflection |
| `adh`    | ∝ r     | force to detach a sphere from the wall (JKR/DMT scaling) |

Effects (emergent, clinically consistent): a **large** clot → shorter latency, a stronger and faster nystagmus,
faster clearance; a **small** one → long latency, a weak and slow course. For small (slowly settling) debris the
app **lengthens the recommended position-hold time** (holds) — in line with the rationale for ~30 s holds in
repositioning maneuvers (Hain, Squires & Stone 2005). The otolith-travel animation scales speed ∝ 1/r² (Stokes).
The Diagnostics tab stays at `medium`.

## File map

| Path | Contents |
|------|----------|
| `index.html` + `src/main.js`        | entry point (boot: patient from link, first render, test handle) |
| `src/engine/vestibular.js`          | BPPV physics engine (`Vestibular`) — Ewald's laws, canalith-/cupulolithiasis dynamics |
| `src/engine/neuro-vor.js`           | tonic/central engine (`NeuroVOR`) — VOR, vHIT, HINTS, calorics, compensation |
| `src/engine/scene3d.js`             | `Scene3D` — cameras and orthographic projection (shared 3D source of truth) |
| `src/pose/maneuvers.js`             | maneuver/test domain + `poseSpec` (single pose source) |
| `src/render/svg-screens.js`         | SVG renderer (all screens) |
| `src/render/three-patient.js` + `three-bridge.js` | 3D/WebGL renderer + OTOREPO↔Three axis bridge |
| `src/app/{state,actions}.js`, `src/runtime/registry.js` | state, UI actions, infrastructure (rAF, wake lock, audio) |
| `tools/{snapshot,bridge-check,view-check}.mjs` | 3 offline oracles · `tools/build-dist.mjs` — PWA static assets + `sw.js` |
| `android/`                          | Capacitor wrapper (Android) |
| `otorepo.html`                      | monolith — **frozen** golden-snapshot source (do not edit) |
| `engine_doc.en.txt`                 | engine documentation (API, conventions, calibration, references [H1]–[H22]) |
| `view_doc.en.txt`                   | visualization-layer documentation (2.5D SVG + 3D) |
| `todo.txt`                          | task list (open / done, milestones) |
| `migracja_3d.en.txt`                | historical notes on the 3D migration (Three.js) |

> Polish documentation originals keep the canonical `*.txt` filenames (`engine_doc.txt`, `view_doc.txt`,
> `migracja_3d.txt`) — they are referenced by in-code comments; the English versions are the `*.en.txt`
> siblings. See [`README.pl.md`](README.pl.md) for the Polish README.

## References (selected)

The engine is a reduced, phenomenological implementation of established BPPV biomechanical models
(full mapping in [`engine_doc.en.txt`](engine_doc.en.txt)):

- Squires, Weidman, Hain, Stone (2004) — canalithiasis model (otoconia settling, Stokes drag).
- Hain, Squires, Stone (2005) — clinical implications; rationale for ~30 s holds in CRP.
- Dai, Klein, Cohen, Raphan (1999) — cupula time constant.
- Schuknecht (1969) — cupulolithiasis; Hall, Ruby, McClure (1979) — canalithiasis.
- Ewald (1892) — Ewald's laws I/II/III.
- Wu et al. (2021); Della Santina et al. (2005) — canal-plane orientations.

The `NeuroVOR` layer (tonic/central VOR, HINTS, compensation, neuroanatomy) — full references [H1]–[H22] in [`engine_doc.en.txt`](engine_doc.en.txt):

- Goldberg & Fernández (1971) — resting activity of canal afferents (~90/s).
- Halmagyi & Curthoys (1988); Weber et al. (2008) — head impulse test (vHIT), corrective saccades.
- Cannon & Robinson (1987) — the "leaky" neural integrator (gaze-evoked nystagmus).
- Brandt & Dieterich (1993) — skew deviation / OTR (a brainstem sign).
- Kattah et al. (2009) — HINTS; Tarnutzer et al. (2011) — peripheral/central AVS differentiation.
- Leigh & Zee, *The Neurology of Eye Movements* — VOR, fixation suppression, integrator.
- Curthoys & Halmagyi (1995); Smith & Curthoys (1989) — vestibular compensation (clamp, pacemaker, Bechterew).
- Sadeghi, Minor & Cullen (2012); Cullen (2012) — sensory substitution, covert saccades, cervico-ocular fusion.
- Laurens & Angelaki (2011) — internal model / velocity storage (the basis for reliability-weighted fusion).
- Fetter & Dichgans (1996) — neuritis spares the inferior nerve (nerve-branch → canal map, vHIT pattern).
- Aw, Halmagyi, Curthoys et al. (1996) — 3D vector analysis of the VOR (per-canal vHIT, RALP/LARP planes).
- Minor (2000) — superior canal dehiscence syndrome (SCDS / Tullio phenomenon, "third window").
- Strupp et al. (2017, Bárány Society) — bilateral vestibulopathy (BVH) criteria.
- Lopez-Escamez et al. (2015, Bárány/AAO-HNS) — Ménière's disease criteria.
- Jongkees, Maas, Philipszoon (1962) — bithermal caloric test, CP/DP formula.
- Musat et al. (2025) — inferior-nerve neuritis (SVV, VEMP: saccule/utricle, posterior-canal vHIT pattern).

## License

This project is licensed under the **GNU General Public License v3.0** (GPL-3.0). Among other things, this means
you may use, study, modify, and distribute it, provided that derivative works remain under the same license
(copyleft) and retain the source notice. The software is provided **without any warranty**, to the extent
permitted by law.

The full license text is in the [`LICENSE`](LICENSE) file.
