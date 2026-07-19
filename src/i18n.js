// i18n.js — warstwa dwujezyczna OTOREPO (EN domyslny; PL gdy locale uzytkownika = polski).
//
// Mechanizm: t(pl, en) zwraca napis w aktywnym jezyku — tlumaczenie lezy OBOK oryginalu
// (latwa recenzja kliniczna, minimalne ryzyko dla golden). Aktywnym jezykiem jest state.lang,
// wiec przelaczenie jezyka = zmiana pola + render() (jak kazdy inny re-render aplikacji).
//
//   detectLang() — jawny wybor uzytkownika (localStorage) > locale przegladarki (navigator) > 'en'.
//   initLang()   — boot: ustawia state.lang = detectLang() i synchronizuje <html lang>.
//   setLang(l)   — zmiana w locie: pole + zapis wyboru + <html lang> (render dowola handler w actions.js).
//   t(pl, en)    — wybor wariantu wg state.lang (nieznany jezyk → angielski).
//
// GOLDEN/HARNESS: literal state.lang="en", ale tools/snapshot.mjs przypina state.lang="pl",
// wiec zloty snapshot pozostaje deterministycznie POLSKI niezaleznie od navigator.language jsdom.
import { state } from './app/state.js';

export const LANGS = ['en', 'pl'];
const LS_KEY = 'otorepo.lang';

// Zwraca wariant napisu wg aktywnego jezyka. Domyslnie (i dla nieznanego jezyka) — angielski.
export function t(pl, en){ return state.lang === 'pl' ? pl : en; }

// Wykrycie jezyka startowego. Kolejnosc: zapamietany wybor → locale przegladarki → 'en'.
export function detectLang(){
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved === 'pl' || saved === 'en') return saved;
  } catch { /* brak localStorage (np. tryb prywatny) → pomin */ }
  const navL = (typeof navigator !== 'undefined'
    && (navigator.language || (navigator.languages || [])[0])) || '';
  return /^pl\b/i.test(navL) ? 'pl' : 'en';           // polski locale → PL; reszta swiata → EN (domyslny)
}

// Synchronizacja atrybutu <html lang> (dostepnosc / poprawny jezyk dokumentu).
function syncHtmlLang(){
  if (typeof document !== 'undefined' && document.documentElement)
    document.documentElement.lang = state.lang;
}

// Metadane dokumentu (tytul karty przegladarki + <meta description>) — dwujezyczne, EN domyslny.
// Statyczne wartosci EN sa w index.html (pierwszy paint / crawlery); tu nadpisujemy je wg state.lang,
// wiec tytul karty PL pojawia sie przy locale PL i reaguje na przelacznik jezyka. (manifest.json = EN,
// staly — etykieta instalacji PWA jest pobierana raz i nie ma prostej podmiany w locie.)
function syncMeta(){
  if (typeof document === 'undefined') return;
  document.title = t('OTOREPO — asystent przedsionkowy', 'OTOREPO — vestibular assistant');
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute('content', t(
    'Asystent przedsionkowy — repozycja BPPV, testy pozycyjne i różnicowanie ośrodek/obwód (HINTS). Narzędzie dydaktyczne dla personelu medycznego.',
    'Vestibular assistant — BPPV repositioning, positional tests and central/peripheral differentiation (HINTS). Educational tool for medical professionals.'
  ));
}

// Boot: ustala jezyk startowy z detekcji (localStorage/navigator) i spina <html lang>.
export function initLang(){
  state.lang = detectLang();
  syncHtmlLang();
  syncMeta();
  return state.lang;
}

// Zmiana jezyka w locie (przelacznik UI — P3). NIE wola render(): handler w actions.js
// dorzuca render() (unikamy cyklu importow i18n → svg-screens).
export function setLang(lang){
  state.lang = (lang === 'pl') ? 'pl' : 'en';
  try { localStorage.setItem(LS_KEY, state.lang); } catch { /* pomin */ }
  syncHtmlLang();
  syncMeta();
  return state.lang;
}
