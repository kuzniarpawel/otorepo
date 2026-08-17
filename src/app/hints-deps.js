/* OTOREPO — wstrzyknięcie wiedzy klinicznej do czystego modelu HINTS (Blok 12).
 *
 * hints-model.js jest BEZIMPORTOWY, żeby wyrocznia mogła go uruchomić w gołym Node na pełnym
 * iloczynie odpowiedzi. Wiedza, której potrzebuje, mieszka gdzie indziej — ten plik ją podaje.
 *
 * Kwalifikacja do HINTS czyta DOKŁADNIE TEN SAM model kwalifikacji wstępnej, co Blok 6. To nie
 * jest oszczędność kodu: gdyby ekran Bloku 12 miał własne pytania o przebieg i oczopląs, ten sam
 * pacjent mógłby być równocześnie zakwalifikowany do HINTS tutaj i odesłany do prób pozycyjnych
 * tam — a użytkownik nie miałby jak zgadnąć, które z dwóch zdań aplikacji obowiązuje.
 */
import { triageResult, triageComplete, activeQuestions, triageQuestion } from './triage-model.js';

export function hintsDeps() {
  return { triageResult, triageComplete, activeQuestions, triageQuestion };
}
