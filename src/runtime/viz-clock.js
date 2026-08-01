/* OTOREPO — zegar WIZUALIZACJI (Blok 7).
 *
 * Dokument użytkownika żąda sterowania odtwarzaniem: „pauza, 0,5×, 1×, krok po kroku, reset".
 *
 * ═══ DLACZEGO OSOBNY ZEGAR, A NIE MNOŻNIK W PĘTLI ═══
 * W `setupGuideAnim` (svg-screens.js) JEDNA pętla rAF robi dwie rzeczy naraz:
 *     const dt = now - last; last = now;
 *     if (_otoStart === null) _otoStart = now;          // ANIMACJA wędrówki złogu
 *     ...
 *     if (state.running) state.elapsedMs += dt;          // KLINICZNY licznik utrzymania pozycji
 * Spowolnienie „czasu" globalnie spowolniłoby ODLICZANIE: aplikacja pisałaby „utrzymaj 30 s",
 * a liczyła 60 s realnych. Czas utrzymania pozycji jest parametrem klinicznym (od niego zależy,
 * czy złóg zdąży opuścić kanał), więc nie wolno go wiązać z prędkością podglądu.
 * Stąd DWA zegary: `performance.now()` dla licznika, ten moduł dla obrazu.
 *
 * ═══ MODUŁ JEST CZYSTY ═══
 * Zero importów, zero DOM, zero `performance.now()` w środku — czas rzeczywisty wchodzi
 * ARGUMENTEM. Dzięki temu tools/vizclock-check.mjs sprawdza go w gołym Node, co ma tu
 * szczególne znaczenie: snapshot.mjs podmienia requestAnimationFrame na no-op, więc ŻADNA
 * animacja nie jest objęta wyrocznią golden. Bez tego pliku sterowanie odtwarzaniem byłoby
 * jedyną częścią aplikacji bez jakiejkolwiek bramki.
 */

// Krok przy zatrzymanym obrazie. 120 ms to około 1/6 okresu uderzenia oczopląsu (pętle używają
// T = 720–780 ms), czyli tyle, by rozróżnić fazę wolną od szybkiej, a nie przeskoczyć całego cyklu.
export const VIZ_STEP_MS = 120;
export const VIZ_SPEEDS = [1, 0.5];

export function createVizClock() {
  let wirt = 0;          // czas wirtualny (ms) — monotoniczny
  let ostatniReal = null;
  let speed = 1;
  let paused = false;

  return {
    /* Zwraca czas WIRTUALNY dla podanego czasu rzeczywistego.
       WŁASNOŚĆ NACZELNA: przy speed=1 i bez pauzy przyrost wirtualny == przyrost rzeczywisty
       co do milisekundy. Dzięki temu użytkownik, który nie dotknie sterowania, dostaje
       zachowanie IDENTYCZNE ze stanem sprzed Bloku 7 — a to jest warunek, żeby wprowadzenie
       sterowania nie było po cichu zmianą modelu klinicznego. */
    now(realNow) {
      if (ostatniReal === null) { ostatniReal = realNow; return wirt; }
      let d = realNow - ostatniReal;
      ostatniReal = realNow;
      // Zegar rzeczywisty potrafi się cofnąć (zmiana czasu systemowego, inny timeline w WebView).
      // Ujemny przyrost cofnąłby obwiednię ξ(t) i animacja odtworzyłaby się wstecz.
      if (!(d > 0)) d = 0;
      // CELOWO BEZ OGRANICZANIA dużych skoków. Kuszące jest przyciąć przerwę po powrocie
      // z tła, ale obwiednia oczopląsu modeluje REALNY zanik w czasie: po 30 s w tle oczopląs
      // u pacjenta już by wygasł. Przycięcie kazałoby animacji wznowić się w połowie zaniku,
      // czyli pokazać stan fizycznie niemożliwy.
      if (!paused) wirt += d * speed;
      return wirt;
    },
    setSpeed(s) { speed = (VIZ_SPEEDS.includes(s) ? s : 1); return speed; },
    getSpeed() { return speed; },
    setPaused(p) { paused = !!p; return paused; },
    isPaused() { return paused; },
    toggle() { paused = !paused; return paused; },
    // Ręczne przesunięcie przy zatrzymanym obrazie. Poza pauzą nie robi nic: przesuwanie
    // biegnącego zegara dałoby skok, którego użytkownik nie odróżni od zacięcia.
    step(ms) { if (paused) wirt += Math.max(0, ms == null ? VIZ_STEP_MS : ms); return wirt; },
    /* Rozpięcie od czasu rzeczywistego. Wołane po każdym render(): pętle są wtedy tworzone na
       nowo i zapisują swój `start` z bieżącego czasu wirtualnego, ale MIĘDZY renderami mogła
       upłynąć dowolna ilość czasu rzeczywistego. Bez rozpięcia pierwsza klatka po renderze
       doliczyłaby całą tę przerwę i animacja wystartowałaby w połowie zaniku. */
    detach() { ostatniReal = null; },
    reset() { wirt = 0; ostatniReal = null; },
    peek() { return wirt; },
    snapshot() { return { wirt, speed, paused, przypiety: ostatniReal !== null }; },
  };
}

// Singleton używany przez aplikację. Stan (pauza/prędkość) MUSI przeżyć render(): cancelAnims()
// czyści rejestr rAF przy każdym przerysowaniu, więc gdyby prędkość mieszkała w pętli, każde
// dotknięcie czegokolwiek w interfejsie po cichu wracałoby do 1×.
export const vizClock = createVizClock();
