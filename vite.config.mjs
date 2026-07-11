import { defineConfig } from 'vite';

// OTOREPO — konfiguracja Vite.
//
// ETAP 0 (obecny): Vite pełni rolę serwera deweloperskiego dla NIEZMIENIONEGO
// otorepo.html (klasyczny <script>, brak modułów ES). `base:'./'` jest wymagane
// dla OBU celów wdrożenia: GitHub Pages (podścieżka projektu) oraz Capacitor
// (origin natywny) — ścieżki zasobów muszą być względne.
//
// PRAWDZIWE bundlowanie modułów włącza ETAP 1: pojawi się wejście
// index.html → src/main.js, a skrypt `build` przejdzie na `vite build`.
// Do tego czasu `npm run build` = tools/build-dist.mjs (kopia 1:1 zestawu PWA do dist/),
// bo dziś nie ma modułowego wejścia, a wymuszanie transformacji ręcznie tworzonego
// otorepo.html hashowałoby manifest/ikony i zmieniało zachowanie.
//
// Siatka bezpieczeństwa: `npm run snapshot` (zapis) / `npm run snapshot:check` (porównanie).

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
