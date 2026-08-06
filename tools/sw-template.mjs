/* sw-template.mjs — JEDYNE źródło treści produkcyjnego service workera (Blok 16).
 *
 * Dlaczego osobny plik, skoro używa go tylko `build-dist.mjs`: dopóki szablon siedział w środku
 * skryptu budującego, żadna wyrocznia nie mogła go DOTKNĄĆ. Sprawdzanie zachowania workera
 * sprowadzało się do czytania kodu i wierzenia mu na słowo — a to dokładnie ta klasa dowodu,
 * przez którą aplikacja przez cały czas NIE WSTAWAŁA offline, mimo kompletnego precache.
 * Wydzielony szablon `tools/pwa-check.mjs` URUCHAMIA: montuje sztuczny `self`, sztuczny `caches`
 * i sztuczne `fetch`, po czym mierzy, co worker naprawdę robi z żądaniem.
 *
 * Plik jest CZYSTY (zero importów) i nie dotyka dysku — dostaje nazwę cache i listę zasobów.
 */
export function swSource(cache, assets) {
  return `/* OTOREPO — service worker (PWA offline).
   PLIK GENEROWANY przez tools/build-dist.mjs z szablonu tools/sw-template.mjs — nie edytować ręcznie.
   Precache = pełna zawartość dist/; nazwa cache pochodzi z hasha zawartości,
   więc każda zmiana buildu automatycznie wymusza odświeżenie (bez ręcznych bumpów vN).

   Blok 16 — trzy zachowania wynikające z POMIARU na zbudowanym dist, nie z lektury dokumentacji:

   1. NOWA WERSJA CZEKA (brak skipWaiting). Zmierzone: z natychmiastowym przejęciem pierwsze
      przeładowanie po wdrożeniu pokazywało PUSTĄ aplikację — karta dostawała STARY dokument
      (z cache sprzed aktualizacji), a jego moduł miał już nazwę z nowym hashem, więc nie istniał
      ani w nowym cache, ani na serwerze. Dopiero drugie przeładowanie wracało do żywych. Worker,
      który czeka, nie kasuje cache spod otwartej karty i nie przerywa manewru.
   2. IGNOREVARY. Moduły ES są pobierane w trybie CORS, więc ich żądanie niesie nagłówek Origin,
      którego nie miało żądanie z \`cache.addAll\`. Serwer odpowiadający \`Vary: Origin\` sprawiał,
      że \`caches.match\` NIE TRAFIAŁ mimo kompletnego precache — aplikacja nie wstawała offline,
      choć wszystkie pliki leżały w cache (zmierzone: \`fetch(url)\` trafiał, \`import(url)\` nie).
   3. ODPOWIEDŹ NA ŻĄDANIE SKRYPTU NIGDY NIE JEST HTML-em. Dawny fallback podawał otorepo.html na
      KAŻDE nieudane żądanie, więc brak pliku .js kończył się błędem typu MIME zamiast czytelnego
      braku. Dokument podajemy wyłącznie nawigacji. */
const CACHE = '${cache}';
const ASSETS = ${JSON.stringify(assets, null, 2).replace(/\n/g, '\r\n')};
const DOKUMENT = 'index.html';

self.addEventListener('install', (e) => {
  // BEZ skipWaiting — wersja czeka, aż aplikacja sama poprosi (wiadomość niżej) albo zamkną się
  // wszystkie karty. Decyzję „czy teraz wolno" podejmuje src/app/pwa-model.js.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

// Jedyna droga do natychmiastowego wdrożenia: świadoma prośba aplikacji.
self.addEventListener('message', (e) => {
  if (e.data && e.data.typ === 'OTOREPO_WDROZ') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith((async () => {
    const cached = await caches.match(req, { ignoreVary: true });
    if (cached) return cached;
    try { return await fetch(req); }
    catch (err) {
      if (req.mode === 'navigate') {
        const dok = (await caches.match(DOKUMENT, { ignoreVary: true })) || (await caches.match('./', { ignoreVary: true }));
        if (dok) return dok;
      }
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
`;
}
