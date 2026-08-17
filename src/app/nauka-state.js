/* OTOREPO — JEDYNY PISARZ STANU TRYBU NAUKI (Blok 13).
 *
 * ═══ DLACZEGO JEDEN PISARZ, I DLACZEGO WŁAŚNIE TUTAJ ═══
 * Tor nauki i tor pacjenta dzielą jeden obiekt `state`. Gdyby lekcja pisała do pól klinicznych,
 * skażenie byłoby CZĘŚCIOWO NIEODWRACALNE: `decisionSeq` jest jawnie monotoniczny („nawigacja go
 * NIE cofa"), `obsOdciski` jest pochodny od `obs`, a `kontrole` to historia serii indeksowana
 * przez `flow.maneuver.kontrolaIdx`. Odruchowa mitygacja — „zapisz stan, uruchom lekcję,
 * przywróć" — NIE DZIAŁA dla żadnego z tych trzech pól i zawodzi po cichu. Separacja jest więc
 * STRUKTURALNA: ten moduł pisze WYŁĄCZNIE do pól `nauka*` i nie importuje żadnego innego pisarza.
 * Wyrocznia bierze odcisk wszystkich pól pacjenta przed lekcją i po niej — mają być identyczne.
 *
 * ═══ ODPOWIEDŹ RAZ UDZIELONA JEST ZAMROŻONA ═══
 * To nie jest surowość, tylko kryterium odbioru nr 1 dociągnięte do końca. Gdyby dało się
 * odpowiedź zmienić PO zobaczeniu informacji zwrotnej, „decyzja przed odsłonięciem odpowiedzi"
 * byłaby fikcją: wystarczyłoby kliknąć cokolwiek, przeczytać werdykt i poprawić. Zmiana zdania
 * jest możliwa dokładnie tak długo, jak długo decyzji nie ma.
 */
import { ETAPY_PYTAJACE, etapNauki, ETAP_IDS, przypadek, opcjeEtapu, wolnoDalej,
         PRZYPADEK_IDS, POZIOM_IDS, RODZAJ_IDS, wpisPostepu, bezDanychOsobowychNauka } from './nauka-model.js';

/* (USUNIĘTE 2026-08-08) `POLA_NAUKI`. Komentarz obiecywał, że „wyrocznia czyta ją WPROST" — a nie
   czytała jej żadna. Taki kontrakt-w-komentarzu jest dokładnie tym, przez co zakończenie sesji przez
   dwa bloki omijało pola badania HINTS. Niezmiennik „lekcja nie tyka pacjenta" jest tu pilnowany
   OD DRUGIEJ STRONY i naprawdę: bramka G w tools/nauka-dom.mjs porównuje odcisk POLA_PACJENTA przed
   lekcją i po niej. Lista własnych pól modułu nie miała czego dokładać. */

export const POWODY_ODMOWY = {
  odpowiedzZamrozona: { pl: 'ta odpowiedź jest już udzielona — decyzji nie zmienia się po zobaczeniu werdyktu', en: 'this answer has already been given — a decision is not changed after seeing the verdict' },
  etapNiedostepny:    { pl: 'najpierw odpowiedz na wcześniejsze etapy', en: 'answer the earlier stages first' },
  opcjaSpozaListy:    { pl: 'ta odpowiedź nie należy do tego etapu', en: 'this answer does not belong to this stage' },
};

export function zacznijPrzypadek(stan, id) {
  if (!PRZYPADEK_IDS.includes(id)) { stan.naukaBlad = 'przypadekNieznany'; return false; }
  stan.naukaPrzypadek = id;
  stan.naukaEtap = 'opis';
  stan.naukaOdp = {};
  stan.naukaWskazowki = [];
  stan.naukaBlad = null;
  return true;
}

export function zamknijPrzypadek(stan) {
  stan.naukaPrzypadek = null;
  stan.naukaEtap = null;
  stan.naukaOdp = {};
  stan.naukaWskazowki = [];
  stan.naukaBlad = null;
}

/* ZAPIS ODPOWIEDZI. Trzy odmowy, każda z powodem — odmowa bez słowa uczy klikać dalej. */
export function ustawOdpowiedz(stan, etapId, wartosc, deps) {
  const e = etapNauki(etapId);
  if (!e || !e.pyta) { stan.naukaBlad = 'etapNiedostepny'; return false; }
  const odp = stan.naukaOdp || (stan.naukaOdp = {});
  if (odp[etapId] != null) { stan.naukaBlad = 'odpowiedzZamrozona'; return false; }
  const p = przypadek(stan.naukaPrzypadek);
  if (!p) { stan.naukaBlad = 'przypadekNieznany'; return false; }
  const dozwolone = opcjeEtapu(etapId, p, deps).map(o => o.v);
  if (!dozwolone.includes(wartosc)) { stan.naukaBlad = 'opcjaSpozaListy'; return false; }
  odp[etapId] = wartosc;
  stan.naukaBlad = null;
  return true;
}

/* WSKAZÓWKA — idempotentna. Drugie dotknięcie tego samego przycisku nie ma prawa jej COFNĄĆ:
   raz zobaczona wskazówka została zobaczona, a wynik ma to nieść do końca. Ta sama lekcja, co
   przy pominięciu kwalifikacji w Bloku 12, gdzie przełączanie cicho odbierało dostęp. */
export function uzyjWskazowki(stan, etapId) {
  if (!ETAPY_PYTAJACE.includes(etapId)) { stan.naukaBlad = 'etapNiedostepny'; return false; }
  const lista = stan.naukaWskazowki || (stan.naukaWskazowki = []);
  if (!lista.includes(etapId)) lista.push(etapId);
  stan.naukaBlad = null;
  return true;
}

/* NAWIGACJA PO ETAPACH. W tył wolno zawsze (uczeń ma prawo wrócić do opisu), w przód tylko
   przez etapy, na które padła odpowiedź — inaczej dałoby się dojść do podsumowania bez decyzji,
   czyli obejść kryterium odbioru nr 1 samym przyciskiem „dalej". */
export function ustawEtap(stan, etapId) {
  const cel = ETAP_IDS.indexOf(etapId);
  if (cel < 0) { stan.naukaBlad = 'etapNiedostepny'; return false; }
  for (let i = 0; i < cel; i++) {
    if (!wolnoDalej(stan, ETAP_IDS[i])) { stan.naukaBlad = 'etapNiedostepny'; return false; }
  }
  stan.naukaEtap = etapId;
  stan.naukaBlad = null;
  return true;
}

export function ustawFiltr(stan, pole, wartosc) {
  const f = stan.naukaFiltr || (stan.naukaFiltr = { poziom: null, rodzaj: null });
  if (pole !== 'poziom' && pole !== 'rodzaj') return false;
  const dozwolone = pole === 'poziom' ? POZIOM_IDS : RODZAJ_IDS;
  if (wartosc != null && !dozwolone.includes(wartosc)) return false;
  f[pole] = (f[pole] === wartosc) ? null : wartosc;    // ponowne dotknięcie zdejmuje filtr
  return true;
}

/* ZAPIS POSTĘPU DO STANU. Do PAMIĘCI przeglądarki zapisuje osobno `nauka-store.js` — ten moduł
   nie dotyka localStorage, żeby wyrocznia modelu i złoty wzorzec zostały deterministyczne. */
export function zapiszPostepDoStanu(stan, deps) {
  const p = przypadek(stan.naukaPrzypadek);
  if (!p) return null;
  const wpis = wpisPostepu(p, deps, stan);
  const straz = bezDanychOsobowychNauka(wpis);
  if (!straz.czysty) { stan.naukaZapisBlad = straz.powody[0]; return null; }
  const postep = stan.naukaPostep || (stan.naukaPostep = {});
  postep[p.id] = wpis;
  stan.naukaZapisBlad = null;
  return wpis;
}

export function wyczyscPostepStanu(stan) {
  stan.naukaPostep = {};
  stan.naukaZapisBlad = null;
}
