import { defineConfig } from 'vite';

// OTOREPO — konfiguracja Vite (Etap 1: moduły ES).
//
// Wejście: index.html → src/main.js (9 modułów: engine/pose/app/runtime/render).
// `npm run build` = `vite build` + tools/build-dist.mjs (statyki PWA, alias
// otorepo.html, GENEROWANY sw.js z precache i hashem zawartości jako nazwą cache).
// `base:'./'` jest wymagane dla OBU celów wdrożenia: GitHub Pages (podścieżka
// projektu) oraz Capacitor (origin natywny) — ścieżki zasobów muszą być względne.
// Manifest/ikona mają w index.html atrybut vite-ignore (muszą zostać w rootcie —
// względne start_url/icons rozwiązują się względem URL-a manifestu).
//
// Monolityczny otorepo.html pozostaje w repo jako źródło złotego snapshotu
// (tools/snapshot.mjs); rozwój odbywa się w src/.
//
// Siatka bezpieczeństwa: `npm run snapshot:check` (monolit) i `snapshot:check:src` (moduły).

export default defineConfig({
  base: './',
  server: {
    port: 5178,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
