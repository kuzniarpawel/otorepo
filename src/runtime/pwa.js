/* pwa.js — Blok 16: ADAPTER PRZEGLADARKI dla service workera. Cala decyzja („czy wolno teraz
   wdrozyc", „co napisac") siedzi w czystym src/app/pwa-model.js; tutaj sa wylacznie rzeczy, ktorych
   w czystym Node nie da sie miec: rejestracja, nasluch na zainstalowana wersje, wiadomosc do
   workera i przeladowanie karty.

   Trzy pulapki, ktore ten plik omija — kazda zmierzona na zbudowanym `dist`, nie zalozona:

   1. `controllerchange` leci TAKZE przy pierwszej instalacji, gdy karta nie miala jeszcze zadnego
      workera. Przeladowanie w tym miejscu obrocilo by kazde pierwsze wejscie w podwojne wczytanie
      (a przy otwartym przypadku — w utrate danych). Regule podejmuje czysty
      `pwa-model.decyzjaPrzeladowania`, a `bylSterownik` aktualizujemy przy KAZDYM przejeciu:
      wersja „sterowana w chwili bootu" byla za waska i zmierzylem, jak zawodzi — pierwsza wizyta
      instaluje workera PO wczytaniu strony, wiec karta zostawala z `false` na zawsze i pozniejsza
      aktualizacja nie przeladowywala jej nigdy, mimo ze jej stary cache juz zniknal.
   2. Przeladowanie musi byc JEDNORAZOWE. Bez zatrzasku dwie karty potrafia sie nawzajem budzic
      w petli.
   3. `registration.update()` wolamy przy POWROCIE do karty, a nie z zegara. Aplikacja bez zegara
      nie budzi sie sama i nie zjada baterii w kieszeni, a moment powrotu jest dokladnie tym, w
      ktorym uzytkownik i tak patrzy na ekran. */

import { decyzjaPrzeladowania } from '../app/pwa-model.js';

let _reg = null;
let _przeladowano = false;
let _bylSterownik = false;

function dostepny() {
  try {
    // Capacitor: natywna apka ma wlasny cykl aktualizacji (sklep), wiec worker jest tam wylaczony.
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && !(typeof window !== 'undefined' && window.Capacitor);
  } catch { return false; }
}

export function zarejestrujSW(onCzeka) {
  if (!dostepny()) return;
  const zglos = () => { try { onCzeka && onCzeka(); } catch { /* powiadomienie nie ma prawa zabrac aplikacji */ } };
  try {
    _bylSterownik = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      const d = decyzjaPrzeladowania({ bylSterownik: _bylSterownik, przeladowano: _przeladowano });
      _bylSterownik = true;                          // od teraz karta JEST sterowana
      if (!d.przeladuj) return;
      _przeladowano = true;
      try { location.reload(); } catch { }
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      _reg = reg;
      if (reg.waiting && navigator.serviceWorker.controller) zglos();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', () => {
          // 'installed' + istniejacy sterownik = nowa wersja CZEKA (przy pierwszej instalacji
          // sterownika nie ma, a wtedy nie ma tez czego komunikowac).
          if (w.state === 'installed' && navigator.serviceWorker.controller) zglos();
        });
      });
    }).catch(() => { });
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && _reg) { try { _reg.update(); } catch { } }
      });
    }
  } catch { /* brak workera = aplikacja dziala dalej, tylko bez offline */ }
}

/* WDROZENIE: prosimy CZEKAJACEGO workera, zeby przejal sterowanie. Przeladowanie nastapi
   w `controllerchange` — nie wolamy go tutaj, bo karta przeladowana przed przejeciem dostalaby
   z powrotem STARY dokument i wszystko wrocilo by do punktu wyjscia. */
export function wdrozAktualizacje() {
  if (!dostepny()) return false;
  try {
    const w = (_reg && _reg.waiting) || null;
    if (!w) return false;
    w.postMessage({ typ: 'OTOREPO_WDROZ' });
    return true;
  } catch { return false; }
}
