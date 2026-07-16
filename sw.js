/* OTOREPO — neutralizator starego service workera (TYLKO DEV).
   Historia: dawniej ten plik cache'owal powloke monolitu (cache 'otorepo-v9', cache-first),
   przez co serwer deweloperski (Vite, localhost:5178) serwowal NIEAKTUALNY kod mimo zmian
   w src/ (rejestracja sw.js zostaje w index.html oraz w zamrozonym otorepo.html).

   Produkcja NIE uzywa tego pliku — tools/build-dist.mjs GENERUJE wlasny dist/sw.js z hashem
   zawartosci jako nazwa cache (root sw.js jest jawnie pomijany w precache i nie trafia do dist/).

   Ten worker niczego nie cache'uje. Przy aktywacji: czysci wszystkie cache PWA, wyrejestrowuje
   sie i — jednorazowo, tylko gdy istnialy stare cache — przeladowuje otwarte karty. Dzieki temu
   przegladarki z zainstalowanym starym workerem same sie "lecza", a kolejne wczytania w dev ida
   prosto do sieci (swiezy kod). Brak handlera fetch => zero przechwytywania zadan. */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const hadOld = keys.length > 0;
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.registration.unregister();
    // Przeladuj karty TYLKO gdy faktycznie usuwalismy stary cache. Po przeladowaniu
    // keys=[] => hadOld=false => brak nawigacji => brak petli register->install->reload.
    if (hadOld) {
      for (const c of await self.clients.matchAll({ type: 'window' })) c.navigate(c.url);
    }
  })());
});
