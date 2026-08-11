/* OTOREPO — krok PO `vite build` (Etap 1c). Uzupełnia dist/ do kompletnej,
 * wdrażalnej PWA (GitHub Pages root / Capacitor webDir):
 *
 * 1. dokłada statyki spoza grafu Vite (manifest.json, icons/, privacy.html, .nojekyll);
 * 2. alias dist/otorepo.html = zbudowany index.html — stare instalacje PWA mają
 *    start_url "otorepo.html" (manifest bez zmian), a fallback SW dalej trafia;
 * 3. GENERUJE dist/sw.js: precache = faktyczna zawartość dist/, nazwa cache
 *    = hash zawartości → każda zmiana buildu sama wymusza odświeżenie
 *    (koniec ręcznych bumpów otorepo-vN). Cache-first, GET-only; od Bloku 16
 *    nowa wersja CZEKA zamiast przejmować kartę w trakcie manewru, dopasowanie
 *    ignoruje Vary (moduły ES idą w trybie CORS), a dokument z cache dostaje
 *    wyłącznie nawigacja — nigdy żądanie skryptu.
 *
 * Rejestracja SW pozostaje w markupie aplikacji (index.html) i jest wyłączona
 * pod window.Capacitor — bez zmian.
 */
import { readFileSync, writeFileSync, copyFileSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { swSource } from './sw-template.mjs';

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
/* assets/ — render sceny ekranu startowego. Wchodzi znacznikiem <img src="assets/…">, czyli POZA
   grafem Vite'a (Vite przetwarza tylko url() w CSS i importy w JS), więc bez tej kopii pierwszy
   start offline pokazałby scenę bez renderu. Nazwa cache to hash zawartości dist/, więc plik
   sam wchodzi do precache i sam wymusza odświeżenie — bumpu nie trzeba. */
cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });

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

// 4. sw.js — TRESC pochodzi z tools/sw-template.mjs. Wydzielona, bo wyrocznia pwa:check
//    URUCHAMIA tego workera (sztuczny self/caches/fetch) zamiast czytac kod i wierzyc mu na slowo.
writeFileSync(join(DIST, 'sw.js'), swSource(CACHE, ['./', ...rel]));

const kb = rel.reduce((s, f) => s + statSync(join(DIST, f)).size, 0) / 1024;
console.log(`dist/ gotowy: ${rel.length} plików w precache (${kb.toFixed(0)} KB), CACHE=${CACHE}`);
