/* OTOREPO — ZAPISANE SESJE W PAMIĘCI PRZEGLĄDARKI (Blok 15, kryterium odbioru nr 2 i nr 3).
 *
 * ═══ JEDYNY BRUDNY MODUŁ TEGO BLOKU ═══
 * Ten sam podział, co w `nauka-store.js`: `opis-model.js` jest czysty i nie wie, że pamięć
 * istnieje. Cały kontakt z `localStorage` mieszka tutaj, więc wyrocznia modelu działa w gołym
 * Node, a złoty wzorzec zostaje deterministyczny — żaden ekran nie czyta pamięci sam z siebie.
 *
 * ═══ DANE NIE OPUSZCZAJĄ URZĄDZENIA ═══
 * Kryterium odbioru nr 2: „dane sesji nie opuszczają urządzenia bez świadomego eksportu".
 * W całym `src/` nie ma ANI JEDNEGO `fetch`, `XMLHttpRequest`, `sendBeacon` ani `WebSocket`
 * (zmierzone przed napisaniem tego pliku, wyrocznia pilnuje tego dalej), a zapis idzie do
 * `localStorage` tej przeglądarki. Eksport jest osobnym, jawnym gestem człowieka.
 *
 * ═══ STRAŻNIK PRZED KAŻDYM ZAPISEM, NIE PO ═══
 * `bezDanychOsobowychSesji` chodzi po GOTOWYM wpisie i go ODRZUCA, zamiast po cichu czyścić.
 * Cicha sanitacja wygląda jak zapis, którego nie było — to lekcja z toru VOG (`assertNoPersonalData`)
 * i z Bloku 11. Wpis uszkodzony przy ODCZYCIE po prostu odpada: pamięć przeglądarki jest
 * edytowalna z konsoli, więc zapis nie jest źródłem zaufanym.
 */
import { bezDanychOsobowychSesji } from './opis-model.js';

const KLUCZ = 'otorepo_sesje';
const WERSJA = 1;
const LIMIT = 50;   // ponad tyle wpisów lista przestaje być listą, a zaczyna być archiwum

export function wczytajSesje(deps) {
  try {
    const surowy = localStorage.getItem(KLUCZ);
    if (!surowy) return [];
    const dane = JSON.parse(surowy);
    if (!dane || typeof dane !== 'object' || dane.wersja !== WERSJA || !Array.isArray(dane.wpisy)) return [];
    return dane.wpisy.filter(w => bezDanychOsobowychSesji(w, deps).czysty);
  } catch { return []; }
}

/* Zapis CAŁEJ listy naraz — jak w `nauka-store.js`. Dwie karty otwarte na tym samym profilu
   nadpisują się nawzajem i to jest świadoma decyzja: scalanie dwóch list sesji wymagałoby
   rozstrzygania, który zapis tego samego przypadku jest „lepszy". */
export function zapiszSesje(lista, deps) {
  const wpisy = (Array.isArray(lista) ? lista : []).filter(w => bezDanychOsobowychSesji(w, deps).czysty).slice(-LIMIT);
  try {
    localStorage.setItem(KLUCZ, JSON.stringify({ wersja: WERSJA, wpisy }));
    return { ok: true, powod: null, wpisy };
  } catch {
    // Najczęściej przepełniony quota albo tryb prywatny. Mówimy wprost, że NIE zapisaliśmy.
    return { ok: false, powod: 'brakPamieci', wpisy: null };
  }
}

export function wyczyscSesje() {
  try { localStorage.removeItem(KLUCZ); return { ok: true, powod: null }; }
  catch { return { ok: false, powod: 'brakPamieci' }; }
}

export const POWODY_ZAPISU_SESJI = {
  brakPamieci: {
    pl: 'Nie udało się zapisać w tej przeglądarce (tryb prywatny albo brak miejsca). Bieżący przypadek działa dalej, ale zniknie po zamknięciu karty.',
    en: 'Saving failed in this browser (private mode or no space). The current case still works, but it will be lost when the tab is closed.',
  },
  nicDoZapisania: {
    pl: 'Nie ma czego zapisać — w tym przypadku nie odnotowano jeszcze niczego.',
    en: 'There is nothing to save — nothing has been recorded in this case yet.',
  },
  odmowaStraznika: {
    pl: 'Zapis odrzucony przez strażnika danych: wpis zawierał wartość spoza słowników aplikacji.',
    en: 'The save was refused by the data guard: the record contained a value outside the app dictionaries.',
  },
};
