/* OTOREPO — krok PO `vite build` (Etap 1c). Uzupełnia dist/ do kompletnej,
 * wdrażalnej PWA (GitHub Pages root / Capacitor webDir):
 *
 * 1. dokłada statyki spoza grafu Vite (manifest.json, icons/, privacy.html, .nojekyll);
 * 2. alias dist/otorepo.html = zbudowany index.html — stare instalacje PWA mają
 *    start_url "otorepo.html" (manifest bez zmian), a fallback SW dalej trafia;
 * 3. GENERUJE dist/sw.js: precache = faktyczna zawartość dist/, nazwa cache
 *    = hash zawartości → każda zmiana buildu sama wymusza odświeżenie
 *    (koniec ręcznych bumpów otorepo-vN). Logika identyczna z dotychczasowym
 *    ręcznym sw.js: cache-first, GET-only, fallback do otorepo.html.
 *
 * Rejestracja SW pozostaje w markupie aplikacji (index.html) i jest wyłączona
 * pod window.Capacitor — bez zmian.
 */
import { readFileSync, writeFileSync, copyFileSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('dist/index.html nie istnieje — najpierw `vite build` (npm run build robi oba kroki).');
  process.exit(2);
}

// 1. statyki
copyFileSync(join(ROOT, 'manifest.json'), join(DIST, 'manifest.json'));
copyFileSync(join(ROOT, 'privacy.html'), join(DIST, 'privacy.html'));
copyFileSync(join(ROOT, '.nojekyll'), join(DIST, '.nojekyll'));
cpSync(join(ROOT, 'icons'), join(DIST, 'icons'), { recursive: true });

// 2. alias dla starych instalacji (start_url otorepo.html)
copyFileSync(join(DIST, 'index.html'), join(DIST, 'otorepo.html'));

// 3. spis plików (bez sw.js i dotfile'ów) + hash zawartości → nazwa cache
const files = [];
(function walk(d) { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p) : files.push(p); } })(DIST);
const rel = files.map(p => relative(DIST, p).replaceAll('\\', '/'))
  .filter(f => f !== 'sw.js' && !f.split('/').pop().startsWith('.'))
  .sort();
const h = createHash('sha256');
for (const f of rel) h.update(f).update(readFileSync(join(DIST, f)));
const CACHE = 'otorepo-' + h.digest('hex').slice(0, 10);

// 4. sw.js
const sw = `/* OTOREPO — service worker (PWA offline).
   PLIK GENEROWANY przez tools/build-dist.mjs — nie edytować ręcznie.
   Precache = pełna zawartość dist/; nazwa cache pochodzi z hasha zawartości,
   więc każda zmiana buildu automatycznie wymusza odświeżenie (bez ręcznych bumpów vN). */
const CACHE = '${CACHE}';
const ASSETS = ${JSON.stringify(['./', ...rel], null, 2).replace(/\n/g, '\r\n')};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).catch(() => caches.match('otorepo.html'))
    )
  );
});
`;
writeFileSync(join(DIST, 'sw.js'), sw);

const kb = rel.reduce((s, f) => s + statSync(join(DIST, f)).size, 0) / 1024;
console.log(`dist/ gotowy: ${rel.length} plików w precache (${kb.toFixed(0)} KB), CACHE=${CACHE}`);
