/* OTOREPO — POSTĘP NAUKI W PAMIĘCI PRZEGLĄDARKI (Blok 13, kryterium odbioru nr 2).
 *
 * ═══ JEDYNY BRUDNY MODUŁ TEGO BLOKU ═══
 * `nauka-model.js` jest czysty i nie wie, że pamięć istnieje. Tutaj mieszka cały kontakt
 * z `localStorage`, więc wyrocznia modelu może działać w gołym Node, a złoty wzorzec pozostaje
 * deterministyczny: żaden ekran nie czyta pamięci sam z siebie — czyta `state.naukaPostep`,
 * które ustawia się RAZ, na boocie, i które scenariusze złotego wzorca przypinają jawnie.
 *
 * ═══ CO TU NIE TRAFIA ═══
 * Nic o pacjencie. Przypadki są syntetyczne i zapis niesie wyłącznie identyfikatory ze słowników
 * (przypadek, ocena, werdykty etapów, użyte wskazówki). Strażnik `bezDanychOsobowychNauka`
 * sprawdza to PRZED zapisem i ODRZUCA wpis, zamiast go czyścić — cicha sanitacja wyglądałaby
 * jak zapis, którego nie było. Nie ma tu też ZEGARA: czas rozwiązywania jest daną o użytkowniku.
 *
 * ═══ WPISY NIEZNANE NIE ZNIKAJĄ PO CICHU ═══
 * Biblioteka się zmienia, a w pamięci zostają identyfikatory przypadków, których już nie ma.
 * Kasowanie ich przy odczycie sprawiłoby, że licznik postępu cofa się sam z siebie i nikt nie wie
 * dlaczego. Wpis strukturalnie poprawny, którego jedyną wadą jest nieznany przypadek, ZOSTAJE
 * i jest liczony osobno (`postepBiblioteki().nieznaneWpisy`). Odrzucamy tylko wpisy uszkodzone.
 */
import { bezDanychOsobowychNauka } from './nauka-model.js';

const KLUCZ = 'otorepo_nauka_postep';
const WERSJA = 1;

/* Każde wejście do pamięci jest w try/catch: tryb prywatny, wyłączone ciasteczka i przepełniony
   quota rzucają wyjątkiem, a brak zapisu postępu nie ma prawa zabrać ze sobą aplikacji. */
export function wczytajPostep() {
  try {
    const surowy = localStorage.getItem(KLUCZ);
    if (!surowy) return {};
    const dane = JSON.parse(surowy);
    if (!dane || typeof dane !== 'object' || dane.wersja !== WERSJA || !dane.wpisy || typeof dane.wpisy !== 'object') return {};
    const out = {};
    for (const [id, wpis] of Object.entries(dane.wpisy)) {
      const w = bezDanychOsobowychNauka(wpis);
      // Wpis o nieznanym przypadku zostaje — patrz nagłówek. Uszkodzony odpada.
      const tylkoNieznany = !w.czysty && w.powody.length === 1 && w.powody[0] === 'przypadekSpozaBiblioteki';
      if (w.czysty || tylkoNieznany) out[id] = wpis;
    }
    return out;
  } catch { return {}; }
}

/* Zapis CAŁEJ mapy naraz. Dwie karty otwarte na tym samym profilu nadpisują się nawzajem —
   to jest świadoma decyzja, a nie przeoczenie: scalanie postępu quizu wymagałoby rozstrzygania,
   który werdykt jest „lepszy", czyli reguły klinicznie nieuzasadnionej. Ostatni zapis wygrywa. */
export function zapiszPostep(postep) {
  const wpisy = {};
  for (const [id, wpis] of Object.entries(postep || {})) {
    if (bezDanychOsobowychNauka(wpis).czysty) wpisy[id] = wpis;
  }
  try {
    localStorage.setItem(KLUCZ, JSON.stringify({ wersja: WERSJA, wpisy }));
    return { ok: true, powod: null };
  } catch (e) {
    // Najczęstsza przyczyna to przepełniony quota. Mówimy o tym wprost — ekran ma powiedzieć,
    // że nie zapisał, zamiast udawać, że zapisał.
    return { ok: false, powod: 'brakPamieci' };
  }
}

export function wyczyscPostep() {
  try { localStorage.removeItem(KLUCZ); return { ok: true, powod: null }; }
  catch { return { ok: false, powod: 'brakPamieci' }; }
}

export const POWODY_ZAPISU = {
  brakPamieci: {
    pl: 'Nie udało się zapisać postępu w tej przeglądarce (tryb prywatny albo brak miejsca). Lekcje działają dalej, ale postęp zniknie po zamknięciu karty.',
    en: 'Progress could not be saved in this browser (private mode or no space). Lessons still work, but progress will be lost when the tab is closed.',
  },
};
