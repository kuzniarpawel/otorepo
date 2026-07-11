/* OTOREPO — budowa dist/ (ETAP 0: kopia 1:1 istniejącego zestawu PWA).
 *
 * Nie transformuje otorepo.html (ręcznie utworzona strona PWA: inline base64 fonty +
 * klasyczny <script>). Celem Etapu 0 jest UDOWODNIENIE deployowalnego artefaktu
 * identycznego z obecnym wdrożeniem (GitHub Pages / Capacitor webDir), zanim ruszymy
 * kod. ETAP 1 zastąpi ten skrypt prawdziwym `vite build` (wejście index.html + src/main.js),
 * gdzie Vite zacznie hashować zasoby i generować listę precache.
 */
import { rmSync, mkdirSync, copyFileSync, cpSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// zestaw wdrożeniowy PWA (root GitHub Pages), spójny z listą ASSETS w sw.js
const FILES = ['otorepo.html', 'sw.js', 'manifest.json', 'privacy.html', '.nojekyll'];
const DIRS = ['icons'];

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

let items = 0, bytes = 0;
for (const f of FILES) {
  const src = join(ROOT, f);
  if (!existsSync(src)) { console.warn('  pomijam (brak):', f); continue; }
  copyFileSync(src, join(DIST, f));
  bytes += statSync(src).size; items++;
}
for (const d of DIRS) {
  const src = join(ROOT, d);
  if (!existsSync(src)) { console.warn('  pomijam (brak):', d); continue; }
  cpSync(src, join(DIST, d), { recursive: true });
  items++;
}
console.log(`dist/ gotowy: ${items} pozycji, ${(bytes / 1024).toFixed(0)} KB plików głównych (kopia 1:1).`);
