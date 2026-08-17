/* OTOREPO — MODEL LABORATORIUM NEUROOTOLOGICZNEGO (Blok 14).
 *
 * ═══ PO CO TEN BLOK ISTNIEJE ═══
 * Dokument: „oddzielenie zaawansowanych modeli od podstawowej ścieżki klinicznej, aby nie
 * przeciążały głównego interfejsu". Zmierzone przed napisaniem czegokolwiek: na dziewięciu
 * ekranach ścieżki klinicznej jest ZERO kontrolek laboratoryjnych, a pełny przebieg
 * wywiad → próba → oczopląs → interpretacja → manewr → kontrola przechodzi bez tknięcia stanu
 * matematycznego pacjenta. Kryterium odbioru nr 1 jest więc już spełnione — i cała robota polega
 * na tym, żeby zamienić ten pomiar w STAŁĄ BRAMKĘ, zanim któryś przyszły blok cicho go złamie.
 *
 * ═══ CO TU JEST NOWE, A CO TYLKO OPISANE ═══
 * Silnik NeuroVOR ma 27 parametrów w 8 grupach i 5 scenariuszy referencyjnych. Ten moduł NIE
 * dokłada ani jednego parametru i nie zmienia ani jednej liczby — dokłada to, czego brakowało:
 *   · OPIS każdego parametru (zmierzone: 27 z 27 nie miało żadnego, 14 z 27 nie miało jednostki),
 *   · POMIAR skutku zmiany (co dokładnie ruszyło się w obrazie klinicznym),
 *   · POWRÓT do scenariusza referencyjnego i wykaz odchyleń od niego.
 * Treść opisów pochodzi z KOMENTARZY SILNIKA i z dokumentacji [H15][H16][H19][H22] — nie z głowy.
 * Bramka `PARAMETRY` ↔ `PARAM_SPEC` pilnuje, żeby nie powstał opis parametru, którego nie ma,
 * ani parametr bez opisu.
 *
 * Moduł CZYSTY: zero importów, zero DOM, zero `t()`, zero `new Date`/`Math.random`.
 * Bramka: npm run lab:check.
 */

/* ═══════════ 1. SŁOWNIK PARAMETRÓW (kryterium odbioru nr 2) ═══════════
   Każdy wpis odpowiada na trzy pytania, bo dokument żąda „opisu jednostki i zakresu", a sam
   zakres bez znaczenia krańców niczego nie mówi:
     coTo      — czym jest ten parametr fizjologicznie,
     jednostka — w czym jest mierzony I CO ZNACZY WARTOŚĆ TYPOWA (przy wielkościach bezwymiarowych
                 to jedyna informacja, która czyni suwak czytelnym: „1,0 = norma" a nie „maksimum"),
     zakres    — co znaczą KRAŃCE, czyli co użytkownik zobaczy, przesuwając suwak do końca.
   `nieFizjologiczny` oznacza część zakresu, która istnieje w modelu, ale nie ma odpowiednika
   w fizjologii — mówimy o tym wprost, zamiast udawać, że każdy suwak opisuje pacjenta. */
export const PARAMETRY = {
  toneL: {
    pl: 'Ton spoczynkowy kanału poziomego — lewy', en: 'Horizontal canal resting tone — left',
    coToPl: 'Spoczynkowa częstotliwość wyładowań aferentów kanału poziomego. To ona, porównana z uchem przeciwnym, decyduje o oczopląsie SAMOISTNYM.',
    coToEn: 'The resting firing rate of the horizontal-canal afferents. Compared with the other ear, it is what decides the SPONTANEOUS nystagmus.',
    jednostkaPl: 'herc (Hz); zdrowy błędnik ≈ 90 Hz', jednostkaEn: 'hertz (Hz); a healthy labyrinth ≈ 90 Hz',
    zakresPl: '0 Hz = całkowite wypadnięcie tonu po tej stronie; 200 Hz = ton dwukrotnie wyższy niż zdrowy (podrażnienie).',
    zakresEn: '0 Hz = complete loss of tone on this side; 200 Hz = tone twice the healthy value (irritation).',
    granicaPl: 'ZMIERZONA GRANICA MODELU: aferent NIE nasyca się już przy prędkości pchnięcia głową — zmierzone: przy tonie 150, 200, 240 i 300 Hz vHIT zostaje prawidłowy. Wcześniej model psuł vHIT powyżej ok. 167 Hz mimo sprawnego kanału i trzeba było o tym ostrzegać. Dziś ograniczenie jest odwrotne i węższe: podrażnienie podnosi ton, ale NIE ma jak pogorszyć pchnięcia — a to właśnie czyni prawidłowy vHIT cechą odróżniającą fazy drażnienia w chorobie Ménière’a.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the afferent NO LONGER saturates at head-impulse velocity — measured: at 150, 200, 240 and 300 Hz the vHIT stays normal. The model used to corrupt vHIT above about 167 Hz despite an intact canal, and that had to be warned about. Today the limit is the opposite and narrower: irritation raises the tone but has no way to worsen the impulse — and that is exactly what makes a normal vHIT the distinguishing feature of the irritative phase of Ménière’s disease.',
  },
  toneR: {
    pl: 'Ton spoczynkowy kanału poziomego — prawy', en: 'Horizontal canal resting tone — right',
    coToPl: 'Jak wyżej, ucho prawe. RÓŻNICA tonów, a nie ich wartości bezwzględne, tworzy oczopląs samoistny.',
    coToEn: 'As above, right ear. The DIFFERENCE between the tones, not their absolute values, creates the spontaneous nystagmus.',
    jednostkaPl: 'herc (Hz); zdrowy błędnik ≈ 90 Hz', jednostkaEn: 'hertz (Hz); a healthy labyrinth ≈ 90 Hz',
    zakresPl: '0 Hz = całkowite wypadnięcie tonu po tej stronie; 200 Hz = podrażnienie. Ton równy po obu stronach = brak oczopląsu, niezależnie od wysokości.',
    zakresEn: '0 Hz = complete loss on this side; 200 Hz = irritation. Equal tone on both sides = no nystagmus, whatever its height.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: aferent NIE nasyca się już przy prędkości pchnięcia głową — zmierzone: 150, 200, 240 i 300 Hz zostawiają vHIT prawidłowy. Suwak wolno przesunąć do końca: podrażnienie podnosi ton, ale nie psuje pchnięcia. Fazę drażnienia Ménière’a (ok. 150 Hz) poznaje się właśnie po tym, że vHIT zostaje prawidłowy.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the afferent NO LONGER saturates at head-impulse velocity — measured: at 150, 200, 240 and 300 Hz the vHIT stays normal. The model used to corrupt vHIT above about 167 Hz despite an intact canal, and that had to be warned about. Today the limit is the opposite and narrower: irritation raises the tone but has no way to worsen the impulse — and that is exactly what makes a normal vHIT the distinguishing feature of the irritative phase of Ménière’s disease.',
  },
  gainL: {
    pl: 'Wzmocnienie VOR kanału poziomego — lewy', en: 'Horizontal canal VOR gain — left',
    coToPl: 'Wzmocnienie odruchu przedsionkowo-ocznego przy WYSOKIEJ częstotliwości (~5 Hz) — czyli to, co mierzy vHIT i co widać jako sakadę korygującą przy pchnięciu głowy.',
    coToEn: 'The vestibulo-ocular reflex gain at HIGH frequency (~5 Hz) — what vHIT measures and what appears as a corrective saccade on a head impulse.',
    jednostkaPl: 'wielkość BEZWYMIAROWA (prędkość oka ÷ prędkość głowy); 1,0 = norma, a nie maksimum',
    jednostkaEn: 'DIMENSIONLESS (eye velocity ÷ head velocity); 1.0 = normal, not a maximum',
    zakresPl: '0 = oko nie nadąża wcale (pełne wypadnięcie, jawna sakada); 1,2 = powyżej normy — zakres modelu, nie stan kliniczny.',
    zakresEn: '0 = the eye does not follow at all (complete loss, overt saccade); 1.2 = above normal — a range of the model, not a clinical state.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: ten suwak jest wzmocnieniem TRANSDUKCJI kanału, a nie odczytem badania. Silnik odwzorowuje PEŁNE wypadnięcie gałęzi nerwu jako gain 0,100 — zero jest krańcem modelu, nie stanem pacjenta. Ton nie psuje już pchnięcia (aferent nie nasyca się do 300 Hz), więc zmierzony gain zależy od tego suwaka, a nie od tonu.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: this slider is the canal’s TRANSDUCTION gain, not a reading of the test. The engine represents a COMPLETE loss of a nerve branch as gain 0.100 — zero is an edge of the model, not a state of the patient. The tone no longer spoils the impulse (the afferent does not saturate up to 300 Hz), so the measured gain depends on this slider, not on the tone.',
    nieFizjologiczny: 'powyżej 1,1',
  },
  gainR: {
    pl: 'Wzmocnienie VOR kanału poziomego — prawy', en: 'Horizontal canal VOR gain — right',
    coToPl: 'Jak wyżej, ucho prawe. Ten parametr jest OSOBNĄ OSIĄ wobec tonu: wzmocnienie może być obniżone przy zachowanym tonie i odwrotnie.',
    coToEn: 'As above, right ear. This parameter is a SEPARATE AXIS from tone: gain can drop with tone preserved, and vice versa.',
    jednostkaPl: 'wielkość BEZWYMIAROWA (prędkość oka ÷ prędkość głowy); 1,0 = norma',
    jednostkaEn: 'DIMENSIONLESS (eye velocity ÷ head velocity); 1.0 = normal',
    zakresPl: '0 = pełne wypadnięcie; 1,2 = powyżej normy (zakres modelu).',
    zakresEn: '0 = complete loss; 1.2 = above normal (range of the model).',
    granicaPl: 'ZMIERZONA GRANICA MODELU: ten suwak jest wzmocnieniem TRANSDUKCJI kanału, a nie odczytem badania. Silnik odwzorowuje PEŁNE wypadnięcie gałęzi nerwu jako gain 0,100 — zero jest krańcem modelu, nie stanem pacjenta. Ton nie psuje już pchnięcia (aferent nie nasyca się do 300 Hz), więc zmierzony gain zależy od tego suwaka, a nie od tonu.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: this slider is the canal’s TRANSDUCTION gain, not a reading of the test. The engine represents a COMPLETE loss of a nerve branch as gain 0.100 — zero is an edge of the model, not a state of the patient. The tone no longer spoils the impulse (the afferent does not saturate up to 300 Hz), so the measured gain depends on this slider, not on the tone.',
    nieFizjologiczny: 'powyżej 1,1',
  },
  caloricGainL: {
    pl: 'Wzmocnienie kaloryczne — lewy', en: 'Caloric gain — left',
    coToPl: 'Wzmocnienie kanału poziomego przy BARDZO NISKIEJ częstotliwości (~0,003 Hz) — to jest oś próby kalorycznej, osobna od vHIT. Rozbieżność między nimi jest treścią kliniczną, nie usterką.',
    coToEn: 'The horizontal-canal gain at VERY LOW frequency (~0.003 Hz) — the axis of the caloric test, separate from vHIT. A dissociation between them is clinical content, not a defect.',
    jednostkaPl: 'wielkość BEZWYMIAROWA; 1,0 = odpowiedź kaloryczna prawidłowa',
    jednostkaEn: 'DIMENSIONLESS; 1.0 = a normal caloric response',
    zakresPl: '0 = niepobudliwość kaloryczna po tej stronie; 1,2 = odpowiedź powyżej normy (zakres modelu).',
    zakresEn: '0 = caloric areflexia on this side; 1.2 = a response above normal (range of the model).',
  },
  caloricGainR: {
    pl: 'Wzmocnienie kaloryczne — prawy', en: 'Caloric gain — right',
    coToPl: 'Jak wyżej, ucho prawe. Obniżone TYLKO tutaj, przy prawidłowym vHIT, daje dysocjację niskich i wysokich częstotliwości — obraz typowy dla choroby Ménière’a.',
    coToEn: 'As above, right ear. Reduced HERE ONLY, with a normal vHIT, it gives a low-versus-high-frequency dissociation — the picture typical of Ménière’s disease.',
    jednostkaPl: 'wielkość BEZWYMIAROWA; 1,0 = odpowiedź kaloryczna prawidłowa',
    jednostkaEn: 'DIMENSIONLESS; 1.0 = a normal caloric response',
    zakresPl: '0 = niepobudliwość kaloryczna; 1,2 = powyżej normy (zakres modelu).',
    zakresEn: '0 = caloric areflexia; 1.2 = above normal (range of the model).',
  },
  toneAcL: {
    pl: 'Ton kanału przedniego — lewy', en: 'Anterior canal tone — left',
    coToPl: 'Ton spoczynkowy kanału PRZEDNIEGO (górnego), unerwionego przez nerw GÓRNY — razem z kanałem poziomym i łagiewką.',
    coToEn: 'The resting tone of the ANTERIOR (superior) canal, innervated by the SUPERIOR nerve — together with the horizontal canal and the utricle.',
    jednostkaPl: 'herc (Hz); zdrowy ≈ 90 Hz', jednostkaEn: 'hertz (Hz); healthy ≈ 90 Hz',
    zakresPl: '0 Hz = wypadnięcie tonu kanału przedniego; 200 Hz = podrażnienie.',
    zakresEn: '0 Hz = loss of anterior-canal tone; 200 Hz = irritation.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: izolowane wypadnięcie kanału PIONOWEGO daje lokalizację OBWODOWĄ i tylko ją — zmierzone: 4 objawy obwodowe, 0 ośrodkowych. Wcześniej silnik dokładał do tego fałszywy wpis „klasycznie podejrzany o ośrodek" i była to sprzeczność w modelu, nie w rozumowaniu użytkownika; ta sprzeczność zniknęła. Granica została węższa: zestaw HINTS nadal liczy oczopląs wyłącznie ze składowej POZIOMEJ, więc pionowej po prostu nie widzi.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: an isolated VERTICAL canal loss here yields a PERIPHERAL localisation and nothing else — measured: 4 peripheral signs, 0 central. The engine used to add a spurious „classically suspicious for a central cause” entry, and that was a contradiction in the model rather than in your reasoning; it is gone. The limit is now narrower: the HINTS set still computes the nystagmus from the HORIZONTAL component only, so it simply does not see the vertical one.',
  },
  toneAcR: {
    pl: 'Ton kanału przedniego — prawy', en: 'Anterior canal tone — right',
    coToPl: 'Jak wyżej, ucho prawe. Asymetria tonu kanałów PIONOWYCH daje składową pionowo-skrętną oczopląsu.',
    coToEn: 'As above, right ear. Asymmetry of the VERTICAL canal tones produces the vertical-torsional component of the nystagmus.',
    jednostkaPl: 'herc (Hz); zdrowy ≈ 90 Hz', jednostkaEn: 'hertz (Hz); healthy ≈ 90 Hz',
    zakresPl: '0 Hz = wypadnięcie; 200 Hz = podrażnienie.', zakresEn: '0 Hz = loss; 200 Hz = irritation.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: izolowane wypadnięcie kanału PIONOWEGO daje lokalizację OBWODOWĄ i tylko ją — zmierzone: 4 objawy obwodowe, 0 ośrodkowych. Wcześniej silnik dokładał do tego fałszywy wpis „klasycznie podejrzany o ośrodek" i była to sprzeczność w modelu, nie w rozumowaniu użytkownika; ta sprzeczność zniknęła. Granica została węższa: zestaw HINTS nadal liczy oczopląs wyłącznie ze składowej POZIOMEJ, więc pionowej po prostu nie widzi.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: an isolated VERTICAL canal loss here yields a PERIPHERAL localisation and nothing else — measured: 4 peripheral signs, 0 central. The engine used to add a spurious „classically suspicious for a central cause” entry, and that was a contradiction in the model rather than in your reasoning; it is gone. The limit is now narrower: the HINTS set still computes the nystagmus from the HORIZONTAL component only, so it simply does not see the vertical one.',
  },
  gainAcL: {
    pl: 'Wzmocnienie kanału przedniego — lewy', en: 'Anterior canal gain — left',
    coToPl: 'Wzmocnienie VOR kanału przedniego — mierzone w płaszczyźnie skośnej (RALP/LARP), a nie w poziomej.',
    coToEn: 'The VOR gain of the anterior canal — measured in an oblique plane (RALP/LARP), not the horizontal one.',
    jednostkaPl: 'wielkość BEZWYMIAROWA; 1,0 = norma', jednostkaEn: 'DIMENSIONLESS; 1.0 = normal',
    zakresPl: '0 = pełne wypadnięcie w tej płaszczyźnie; 1,2 = powyżej normy (zakres modelu).',
    zakresEn: '0 = complete loss in that plane; 1.2 = above normal (range of the model).',
    granicaPl: 'ZMIERZONA GRANICA MODELU: ten suwak jest wzmocnieniem TRANSDUKCJI kanału, a nie odczytem badania. Silnik odwzorowuje PEŁNE wypadnięcie gałęzi nerwu jako gain 0,100 — zero jest krańcem modelu, nie stanem pacjenta. Ton nie psuje już pchnięcia (aferent nie nasyca się do 300 Hz), więc zmierzony gain zależy od tego suwaka, a nie od tonu.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: this slider is the canal’s TRANSDUCTION gain, not a reading of the test. The engine represents a COMPLETE loss of a nerve branch as gain 0.100 — zero is an edge of the model, not a state of the patient. The tone no longer spoils the impulse (the afferent does not saturate up to 300 Hz), so the measured gain depends on this slider, not on the tone.',
    nieFizjologiczny: 'powyżej 1,1',
  },
  gainAcR: {
    pl: 'Wzmocnienie kanału przedniego — prawy', en: 'Anterior canal gain — right',
    coToPl: 'Jak wyżej, ucho prawe.', coToEn: 'As above, right ear.',
    jednostkaPl: 'wielkość BEZWYMIAROWA; 1,0 = norma', jednostkaEn: 'DIMENSIONLESS; 1.0 = normal',
    zakresPl: '0 = pełne wypadnięcie; 1,2 = powyżej normy (zakres modelu).',
    zakresEn: '0 = complete loss; 1.2 = above normal (range of the model).',
    granicaPl: 'ZMIERZONA GRANICA MODELU: ten suwak jest wzmocnieniem TRANSDUKCJI kanału, a nie odczytem badania. Silnik odwzorowuje PEŁNE wypadnięcie gałęzi nerwu jako gain 0,100 — zero jest krańcem modelu, nie stanem pacjenta. Ton nie psuje już pchnięcia (aferent nie nasyca się do 300 Hz), więc zmierzony gain zależy od tego suwaka, a nie od tonu.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: this slider is the canal’s TRANSDUCTION gain, not a reading of the test. The engine represents a COMPLETE loss of a nerve branch as gain 0.100 — zero is an edge of the model, not a state of the patient. The tone no longer spoils the impulse (the afferent does not saturate up to 300 Hz), so the measured gain depends on this slider, not on the tone.',
    nieFizjologiczny: 'powyżej 1,1',
  },
  tonePcL: {
    pl: 'Ton kanału tylnego — lewy', en: 'Posterior canal tone — left',
    coToPl: 'Ton spoczynkowy kanału TYLNEGO, unerwionego przez nerw DOLNY — razem z woreczkiem. Próba kaloryczna go NIE bada.',
    coToEn: 'The resting tone of the POSTERIOR canal, innervated by the INFERIOR nerve — together with the saccule. The caloric test does NOT examine it.',
    jednostkaPl: 'herc (Hz); zdrowy ≈ 90 Hz', jednostkaEn: 'hertz (Hz); healthy ≈ 90 Hz',
    zakresPl: '0 Hz = wypadnięcie tonu kanału tylnego; 200 Hz = podrażnienie.',
    zakresEn: '0 Hz = loss of posterior-canal tone; 200 Hz = irritation.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: izolowane wypadnięcie kanału PIONOWEGO daje lokalizację OBWODOWĄ i tylko ją — zmierzone: 4 objawy obwodowe, 0 ośrodkowych. Wcześniej silnik dokładał do tego fałszywy wpis „klasycznie podejrzany o ośrodek" i była to sprzeczność w modelu, nie w rozumowaniu użytkownika; ta sprzeczność zniknęła. Granica została węższa: zestaw HINTS nadal liczy oczopląs wyłącznie ze składowej POZIOMEJ, więc pionowej po prostu nie widzi.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: an isolated VERTICAL canal loss here yields a PERIPHERAL localisation and nothing else — measured: 4 peripheral signs, 0 central. The engine used to add a spurious „classically suspicious for a central cause” entry, and that was a contradiction in the model rather than in your reasoning; it is gone. The limit is now narrower: the HINTS set still computes the nystagmus from the HORIZONTAL component only, so it simply does not see the vertical one.',
  },
  tonePcR: {
    pl: 'Ton kanału tylnego — prawy', en: 'Posterior canal tone — right',
    coToPl: 'Jak wyżej, ucho prawe. Izolowane wypadnięcie tego kanału przy prawidłowej kaloryce to klasyczny obraz zajęcia nerwu DOLNEGO.',
    coToEn: 'As above, right ear. An isolated loss of this canal with a normal caloric response is the classic picture of INFERIOR nerve involvement.',
    jednostkaPl: 'herc (Hz); zdrowy ≈ 90 Hz', jednostkaEn: 'hertz (Hz); healthy ≈ 90 Hz',
    zakresPl: '0 Hz = wypadnięcie; 200 Hz = podrażnienie.', zakresEn: '0 Hz = loss; 200 Hz = irritation.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: izolowane wypadnięcie kanału PIONOWEGO daje lokalizację OBWODOWĄ i tylko ją — zmierzone: 4 objawy obwodowe, 0 ośrodkowych. Wcześniej silnik dokładał do tego fałszywy wpis „klasycznie podejrzany o ośrodek" i była to sprzeczność w modelu, nie w rozumowaniu użytkownika; ta sprzeczność zniknęła. Granica została węższa: zestaw HINTS nadal liczy oczopląs wyłącznie ze składowej POZIOMEJ, więc pionowej po prostu nie widzi.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: an isolated VERTICAL canal loss here yields a PERIPHERAL localisation and nothing else — measured: 4 peripheral signs, 0 central. The engine used to add a spurious „classically suspicious for a central cause” entry, and that was a contradiction in the model rather than in your reasoning; it is gone. The limit is now narrower: the HINTS set still computes the nystagmus from the HORIZONTAL component only, so it simply does not see the vertical one.',
  },
  gainPcL: {
    pl: 'Wzmocnienie kanału tylnego — lewy', en: 'Posterior canal gain — left',
    coToPl: 'Wzmocnienie VOR kanału tylnego, mierzone w płaszczyźnie skośnej.',
    coToEn: 'The VOR gain of the posterior canal, measured in an oblique plane.',
    jednostkaPl: 'wielkość BEZWYMIAROWA; 1,0 = norma', jednostkaEn: 'DIMENSIONLESS; 1.0 = normal',
    zakresPl: '0 = pełne wypadnięcie; 1,2 = powyżej normy (zakres modelu).',
    zakresEn: '0 = complete loss; 1.2 = above normal (range of the model).',
    granicaPl: 'ZMIERZONA GRANICA MODELU: ten suwak jest wzmocnieniem TRANSDUKCJI kanału, a nie odczytem badania. Silnik odwzorowuje PEŁNE wypadnięcie gałęzi nerwu jako gain 0,100 — zero jest krańcem modelu, nie stanem pacjenta. Ton nie psuje już pchnięcia (aferent nie nasyca się do 300 Hz), więc zmierzony gain zależy od tego suwaka, a nie od tonu.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: this slider is the canal’s TRANSDUCTION gain, not a reading of the test. The engine represents a COMPLETE loss of a nerve branch as gain 0.100 — zero is an edge of the model, not a state of the patient. The tone no longer spoils the impulse (the afferent does not saturate up to 300 Hz), so the measured gain depends on this slider, not on the tone.',
    nieFizjologiczny: 'powyżej 1,1',
  },
  gainPcR: {
    pl: 'Wzmocnienie kanału tylnego — prawy', en: 'Posterior canal gain — right',
    coToPl: 'Jak wyżej, ucho prawe.', coToEn: 'As above, right ear.',
    jednostkaPl: 'wielkość BEZWYMIAROWA; 1,0 = norma', jednostkaEn: 'DIMENSIONLESS; 1.0 = normal',
    zakresPl: '0 = pełne wypadnięcie; 1,2 = powyżej normy (zakres modelu).',
    zakresEn: '0 = complete loss; 1.2 = above normal (range of the model).',
    granicaPl: 'ZMIERZONA GRANICA MODELU: ten suwak jest wzmocnieniem TRANSDUKCJI kanału, a nie odczytem badania. Silnik odwzorowuje PEŁNE wypadnięcie gałęzi nerwu jako gain 0,100 — zero jest krańcem modelu, nie stanem pacjenta. Ton nie psuje już pchnięcia (aferent nie nasyca się do 300 Hz), więc zmierzony gain zależy od tego suwaka, a nie od tonu.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: this slider is the canal’s TRANSDUCTION gain, not a reading of the test. The engine represents a COMPLETE loss of a nerve branch as gain 0.100 — zero is an edge of the model, not a state of the patient. The tone no longer spoils the impulse (the afferent does not saturate up to 300 Hz), so the measured gain depends on this slider, not on the tone.',
    nieFizjologiczny: 'powyżej 1,1',
  },
  fixationGain: {
    pl: 'Supresja fiksacyjna (kłaczek)', en: 'Fixation suppression (flocculus)',
    coToPl: 'Zdolność kłaczka do TŁUMIENIA oczopląsu przy patrzeniu na cel. To ona odróżnia oczopląs obwodowy (tłumi się) od ośrodkowego (nie tłumi się).',
    coToEn: 'The flocculus’s ability to SUPPRESS the nystagmus when looking at a target. It is what separates a peripheral nystagmus (suppresses) from a central one (does not).',
    jednostkaPl: 'wielkość BEZWYMIAROWA — udział tłumienia; 0,9 = zdrowa supresja, 0 = brak tłumienia',
    jednostkaEn: 'DIMENSIONLESS — the fraction suppressed; 0.9 = healthy suppression, 0 = none',
    zakresPl: '0 = fiksacja nie tłumi nic (obraz ośrodkowy); 1 = tłumienie pełne. Wartości UJEMNE (do −0,5) istnieją w modelu i znaczą „fiksacja nasila" — to rozszerzenie modelu, nie stan opisany fizjologicznie.',
    zakresEn: '0 = fixation suppresses nothing (a central picture); 1 = full suppression. NEGATIVE values (down to −0.5) exist in the model and mean "fixation enhances" — an extension of the model, not a physiologically described state.',
    nieFizjologiczny: 'poniżej 0',
    bezSkutkuGdy: 'brakOczoplasu',
  },
  integratorTau: {
    pl: 'Stała czasowa integratora spojrzenia', en: 'Gaze integrator time constant',
    coToPl: 'Jak długo układ utrzymuje oko w pozycji ekscentrycznej. Integrator „nieszczelny" (krótka stała) daje oczopląs spojrzeniowy — cechę OŚRODKOWĄ.',
    coToEn: 'How long the system holds the eye in an eccentric position. A "leaky" integrator (short constant) produces gaze-evoked nystagmus — a CENTRAL feature.',
    jednostkaPl: 'sekunda (s); zdrowy ≈ 25 s', jednostkaEn: 'second (s); healthy ≈ 25 s',
    zakresPl: '0,5 s = skrajnie nieszczelny integrator (jawny oczopląs spojrzeniowy); 30 s = utrzymanie prawidłowe.',
    zakresEn: '0.5 s = an extremely leaky integrator (overt gaze-evoked nystagmus); 30 s = normal holding.',
    bezSkutkuGdy: 'brakSpojrzeniaBocznego',
  },
  skewTone: {
    pl: 'Asymetria grawiceptywna (skew)', en: 'Graviceptive asymmetry (skew)',
    coToPl: 'Niezrównoważenie toru otolitowo-ocznego dające pionowe rozejście się osi oczu — test naprzemiennego zasłaniania (test of skew z HINTS).',
    coToEn: 'An imbalance of the otolith-ocular pathway producing a vertical divergence of the eyes — the alternate cover test (the test of skew in HINTS).',
    jednostkaPl: 'stopień (°) rozejścia pionowego; 0 = brak skew', jednostkaEn: 'degree (°) of vertical divergence; 0 = no skew',
    zakresPl: 'od −6° do +6°; znak wskazuje, które oko stoi wyżej. Małe wartości bywają obwodowe (łagiewka), duże przemawiają za ośrodkiem.',
    zakresEn: 'from −6° to +6°; the sign says which eye is higher. Small values can be peripheral (utricle); large ones argue for a central cause.',
  },
  otrTorsion: {
    pl: 'Skręt gałek w reakcji przechylenia (OTR)', en: 'Ocular torsion in the tilt reaction (OTR)',
    coToPl: 'Skrętne ustawienie gałek w reakcji przechylenia ocznego — składowa triady OTR razem ze skew i przechyleniem głowy.',
    coToEn: 'The torsional eye position in the ocular tilt reaction — one component of the OTR triad, with skew and head tilt.',
    jednostkaPl: 'stopień (°) skrętu; 0 = brak', jednostkaEn: 'degree (°) of torsion; 0 = none',
    zakresPl: '0° = gałki nieskręcone; 10° = wyraźny skręt toniczny.',
    zakresEn: '0° = no torsion; 10° = marked tonic torsion.',
  },
  comp: {
    pl: 'Kompensacja ośrodkowa', en: 'Central compensation',
    coToPl: 'Stopień ośrodkowego wyrównania asymetrii spoczynkowej. Znosi oczopląs samoistny, ale NIE naprawia ubytku: kaloryka i vHIT zostają nieprawidłowe.',
    coToEn: 'The degree of central rebalancing of the resting asymmetry. It abolishes the spontaneous nystagmus but does NOT repair the deficit: the caloric test and vHIT stay abnormal.',
    jednostkaPl: 'wielkość BEZWYMIAROWA 0–1; 0 = faza ostra, 1 = pełne wyrównanie spoczynkowe',
    jednostkaEn: 'DIMENSIONLESS 0–1; 0 = the acute phase, 1 = full resting rebalancing',
    zakresPl: '0 = świeże uszkodzenie z pełnym oczopląsem; 1 = pacjent skompensowany — bez oczopląsu, z zachowanym ubytkiem w badaniach.',
    zakresEn: '0 = a fresh lesion with full nystagmus; 1 = a compensated patient — no nystagmus, the deficit still present on testing.',
    bezSkutkuGdy: 'brakStronyChorej',
  },
  pacemakerBias: {
    pl: 'Ładunek pacemakera (oczopląs powrotny)', en: 'Pacemaker bias (recovery nystagmus)',
    coToPl: 'Trwałe przestawienie aktywności jądra po stronie chorej. Po powrocie funkcji błędnika daje oczopląs POWROTNY (Bechterewa) — bijący w drugą stronę niż pierwotny.',
    coToEn: 'A lasting shift of nuclear activity on the affected side. When labyrinthine function returns it produces a RECOVERY (Bechterew) nystagmus — beating opposite to the original one.',
    jednostkaPl: 'herc (Hz) dodane do jądra; 0 = brak przestawienia', jednostkaEn: 'hertz (Hz) added to the nucleus; 0 = no shift',
    zakresPl: '0 Hz = brak; 40 Hz = silne przestawienie, wyraźny oczopląs powrotny po odzyskaniu funkcji.',
    zakresEn: '0 Hz = none; 40 Hz = a strong shift, an overt recovery nystagmus once function returns.',
    bezSkutkuGdy: 'brakStronyChorej',
  },
  tauVS: {
    pl: 'Stała czasowa magazynu prędkości', en: 'Velocity-storage time constant',
    coToPl: 'Jak długo układ przedłuża odpowiedź po obrocie. Kompensacja i uszkodzenia ośrodkowe ją SKRACAJĄ; widać to w oczopląsie porotacyjnym.',
    coToEn: 'How long the system prolongs the response after rotation. Compensation and central lesions SHORTEN it; this shows in the post-rotational nystagmus.',
    jednostkaPl: 'sekunda (s); zdrowy ≈ 15 s', jednostkaEn: 'second (s); healthy ≈ 15 s',
    zakresPl: '1 s = magazyn praktycznie zniesiony; 20 s = przedłużenie powyżej typowego.',
    zakresEn: '1 s = storage practically abolished; 20 s = a prolongation above the typical value.',
    bezSkutkuGdy: 'brakObrotu',
  },
  lesionEar: {
    pl: 'Ucho chore (dla kompensacji)', en: 'Affected ear (for compensation)',
    coToPl: 'Jawne wskazanie strony chorej dla mechanizmu kompensacji. Puste = model wykrywa ją sam po słabszym błędniku.',
    coToEn: 'An explicit statement of the affected side for the compensation mechanism. Empty = the model detects it itself from the weaker labyrinth.',
    jednostkaPl: 'wybór, nie liczba: brak / lewe / prawe', jednostkaEn: 'a choice, not a number: none / left / right',
    zakresPl: 'Brak zakresu liczbowego. „Brak" znaczy „wykryj automatycznie", a nie „obie strony zdrowe".',
    zakresEn: 'No numeric range. "None" means "detect automatically", not "both sides healthy".',
    wybor: true,
  },
  sacculeL: {
    pl: 'Woreczek — lewy', en: 'Saccule — left',
    coToPl: 'Funkcja woreczka, badana przez cVEMP i unerwiona przez nerw DOLNY. Ubytek tutaj przy zachowanej łagiewce wskazuje gałąź dolną.',
    coToEn: 'Saccular function, tested by cVEMP and innervated by the INFERIOR nerve. A loss here with the utricle preserved points to the inferior branch.',
    jednostkaPl: 'wielkość BEZWYMIAROWA 0–1; 1 = funkcja prawidłowa', jednostkaEn: 'DIMENSIONLESS 0–1; 1 = normal function',
    zakresPl: '0 = brak odpowiedzi cVEMP po tej stronie; 1 = odpowiedź prawidłowa.',
    zakresEn: '0 = no cVEMP response on this side; 1 = a normal response.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: odczyt VEMP jest ASYMETRIĄ między uszami, więc utrata OBUSTRONNA nie daje żadnej asymetrii. Silnik kiedyś po prostu o niej milczał — a to jest właśnie pułapka, której ten parametr uczy. Dziś nazywa ją wprost („cVEMP: obustronnie zniesiony … brak asymetrii mimo ubytku”), ale granica zostaje ta sama: model porównuje RÓŻNICĘ, a nie poziom bezwzględny.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the VEMP reading is an ASYMMETRY between the ears, so a BILATERAL loss produces no asymmetry at all. The engine used to stay silent about it — the very trap this parameter teaches. It now names it outright („cVEMP: bilaterally absent … no asymmetry despite the deficit”), but the underlying limit remains: what the model compares is the difference, not the absolute level.',
  },
  sacculeR: {
    pl: 'Woreczek — prawy', en: 'Saccule — right',
    coToPl: 'Jak wyżej, strona prawa.', coToEn: 'As above, right side.',
    jednostkaPl: 'wielkość BEZWYMIAROWA 0–1; 1 = funkcja prawidłowa', jednostkaEn: 'DIMENSIONLESS 0–1; 1 = normal function',
    zakresPl: '0 = brak odpowiedzi cVEMP; 1 = odpowiedź prawidłowa.',
    zakresEn: '0 = no cVEMP response; 1 = a normal response.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: odczyt VEMP jest ASYMETRIĄ między uszami, więc utrata OBUSTRONNA nie daje żadnej asymetrii. Silnik kiedyś po prostu o niej milczał — a to jest właśnie pułapka, której ten parametr uczy. Dziś nazywa ją wprost („cVEMP: obustronnie zniesiony … brak asymetrii mimo ubytku”), ale granica zostaje ta sama: model porównuje RÓŻNICĘ, a nie poziom bezwzględny.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the VEMP reading is an ASYMMETRY between the ears, so a BILATERAL loss produces no asymmetry at all. The engine used to stay silent about it — the very trap this parameter teaches. It now names it outright („cVEMP: bilaterally absent … no asymmetry despite the deficit”), but the underlying limit remains: what the model compares is the difference, not the absolute level.',
  },
  utricleL: {
    pl: 'Łagiewka — lewa', en: 'Utricle — left',
    coToPl: 'Funkcja łagiewki, badana przez oVEMP (nerw GÓRNY) i współtworząca przechylenie SVV.',
    coToEn: 'Utricular function, tested by oVEMP (SUPERIOR nerve) and contributing to the SVV tilt.',
    jednostkaPl: 'wielkość BEZWYMIAROWA 0–1; 1 = funkcja prawidłowa', jednostkaEn: 'DIMENSIONLESS 0–1; 1 = normal function',
    zakresPl: '0 = brak odpowiedzi oVEMP i maksymalny wkład w przechył SVV; 1 = odpowiedź prawidłowa.',
    zakresEn: '0 = no oVEMP response and a maximal contribution to the SVV tilt; 1 = a normal response.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: odczyt VEMP jest ASYMETRIĄ między uszami, więc utrata OBUSTRONNA nie daje żadnej asymetrii. Silnik kiedyś po prostu o niej milczał — a to jest właśnie pułapka, której ten parametr uczy. Dziś nazywa ją wprost („cVEMP: obustronnie zniesiony … brak asymetrii mimo ubytku”), ale granica zostaje ta sama: model porównuje RÓŻNICĘ, a nie poziom bezwzględny.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the VEMP reading is an ASYMMETRY between the ears, so a BILATERAL loss produces no asymmetry at all. The engine used to stay silent about it — the very trap this parameter teaches. It now names it outright („cVEMP: bilaterally absent … no asymmetry despite the deficit”), but the underlying limit remains: what the model compares is the difference, not the absolute level.',
  },
  utricleR: {
    pl: 'Łagiewka — prawa', en: 'Utricle — right',
    coToPl: 'Jak wyżej, strona prawa.', coToEn: 'As above, right side.',
    jednostkaPl: 'wielkość BEZWYMIAROWA 0–1; 1 = funkcja prawidłowa', jednostkaEn: 'DIMENSIONLESS 0–1; 1 = normal function',
    zakresPl: '0 = brak odpowiedzi oVEMP; 1 = odpowiedź prawidłowa.',
    zakresEn: '0 = no oVEMP response; 1 = a normal response.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: odczyt VEMP jest ASYMETRIĄ między uszami, więc utrata OBUSTRONNA nie daje żadnej asymetrii. Silnik kiedyś po prostu o niej milczał — a to jest właśnie pułapka, której ten parametr uczy. Dziś nazywa ją wprost („cVEMP: obustronnie zniesiony … brak asymetrii mimo ubytku”), ale granica zostaje ta sama: model porównuje RÓŻNICĘ, a nie poziom bezwzględny.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the VEMP reading is an ASYMMETRY between the ears, so a BILATERAL loss produces no asymmetry at all. The engine used to stay silent about it — the very trap this parameter teaches. It now names it outright („cVEMP: bilaterally absent … no asymmetry despite the deficit”), but the underlying limit remains: what the model compares is the difference, not the absolute level.',
  },
  /* OŚ SŁUCHOWA — dołożona razem z oceną II silnika NeuroVOR (N5). Do tej pory słownik
     Laboratorium nie znał tych dwóch parametrów, więc wyrocznia lab:check przewracała się na
     `PARAMETRY[key]` równym undefined: silnik dawał 29 parametrów, słownik opisywał 27. */
  hearingL: {
    pl: 'Słuch — ucho lewe', en: 'Hearing — left ear',
    coToPl: 'Sprawność słuchu po tej stronie. W modelu nie jest ozdobą: to ONA odróżnia zapalenie błędnika od zawału w dorzeczu AICA, gdy oczopląs i HIT wyglądają tak samo.',
    coToEn: 'Hearing on this side. In the model it is not decoration: it is what separates labyrinthitis from an AICA-territory infarct when the nystagmus and HIT look identical.',
    jednostkaPl: 'BEZWYMIAROWA (0–1); 1 = słuch prawidłowy, próba tarcia palcami', jednostkaEn: 'DIMENSIONLESS (0–1); 1 = normal hearing, finger-rub test',
    zakresPl: '0 = głuchota po tej stronie; 1 = słuch prawidłowy. Poniżej 0,65 model uznaje ubytek za istotny klinicznie.',
    zakresEn: '0 = deafness on this side; 1 = normal hearing. Below 0.65 the model treats the loss as clinically significant.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: model wystawia ubytek słuchu jako liczbę, ale NIE ROZSTRZYGA, czy jego przyczyną jest zapalenie błędnika, czy zawał w dorzeczu AICA — a to jest cała stawka tego parametru. Nieprawidłowy HIT nie wyklucza udaru: zawał AICA obejmuje tętnicę błędnikową, więc daje obwodowy obraz HIT razem z głuchotą. Rozstrzyga obrazowanie, nie ten model.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: the model reports hearing loss as a number but DOES NOT SETTLE whether its cause is labyrinthitis or an AICA-territory infarct — which is the whole point of this parameter. An abnormal HIT does not exclude stroke: an AICA infarct involves the labyrinthine artery, so it produces a peripheral-looking HIT together with deafness. Imaging settles this, not this model.',
  },
  hearingR: {
    pl: 'Słuch — ucho prawe', en: 'Hearing — right ear',
    coToPl: 'Jak wyżej, ucho prawe. Znaczenie ma RÓŻNICA między uszami i to, czy ubytek jest ŚWIEŻY — stary, utrwalony niedosłuch nie niesie tej informacji.',
    coToEn: 'As above, right ear. What matters is the DIFFERENCE between the ears and whether the loss is NEW — an old, established hearing loss does not carry this information.',
    jednostkaPl: 'BEZWYMIAROWA (0–1); 1 = słuch prawidłowy, próba tarcia palcami', jednostkaEn: 'DIMENSIONLESS (0–1); 1 = normal hearing, finger-rub test',
    zakresPl: '0 = głuchota po tej stronie; 1 = słuch prawidłowy. Poniżej 0,65 model uznaje ubytek za istotny klinicznie.',
    zakresEn: '0 = deafness on this side; 1 = normal hearing. Below 0.65 the model treats the loss as clinically significant.',
    granicaPl: 'ZMIERZONA GRANICA MODELU: model bierze JEDNĄ liczbę na ucho i nie zna ani progu częstotliwościowego, ani przewodzeniowego charakteru ubytku — odwzorowuje próbę tarcia palcami, a nie audiometrię. Nie odróżnia też ubytku ŚWIEŻEGO od utrwalonego, a tylko świeży niesie tu informację.',
    granicaEn: 'A MEASURED LIMIT OF THE MODEL: it takes ONE number per ear and knows neither the frequency threshold nor whether the loss is conductive — it reproduces the finger-rub test, not audiometry. Nor does it distinguish a NEW loss from an established one, and only a new one carries information here.',
  },
  dehiscence: {
    pl: 'Dehiscencja kanału górnego (SCDS)', en: 'Superior canal dehiscence (SCDS)',
    coToPl: 'Trzecie okno w kanale przednim: dźwięk i ciśnienie zaczynają pobudzać kanał, dając objaw Tullia i Hennueberta.',
    coToEn: 'A third window in the anterior canal: sound and pressure begin to stimulate the canal, producing the Tullio and Hennebert signs.',
    jednostkaPl: 'wybór, nie liczba: brak / lewa / prawa', jednostkaEn: 'a choice, not a number: none / left / right',
    zakresPl: 'Brak zakresu liczbowego. Model nie stopniuje wielkości ubytku kostnego — jest albo go nie ma.',
    zakresEn: 'No numeric range. The model does not grade the size of the bony defect — it is either there or not.',
    wybor: true,
    bezSkutkuGdy: 'brakBodzca',
  },
};
export const PARAMETR_IDS = Object.keys(PARAMETRY);
export function parametrLab(key) { return PARAMETRY[key] || null; }

/* Powody, dla których zmiana parametru może NIE ruszyć niczego widocznego. To jest treść
   kliniczna, nie obsługa błędu: suwak, który „nic nie robi", uczy nieprawdy, jeśli aplikacja
   nie powie, czego brakuje, żeby zaczął robić. Zmierzone: supresja fiksacyjna u zdrowego nie
   zmienia nic, bo nie ma oczopląsu, który można by stłumić. */
export const POWODY_BEZ_SKUTKU = {
  brakOczoplasu:        { pl: 'nie ma oczopląsu, który fiksacja mogłaby stłumić — najpierw zróżnicuj tony błędników', en: 'there is no nystagmus for fixation to suppress — first make the labyrinth tones differ' },
  brakSpojrzeniaBocznego: { pl: 'integrator widać dopiero przy spojrzeniu w bok — w pozycji na wprost nie ma czego utrzymywać', en: 'the integrator only shows on lateral gaze — with the eyes straight ahead there is nothing to hold' },
  brakStronyChorej:     { pl: 'kompensacja nie ma czego wyrównywać, dopóki błędniki są symetryczne', en: 'compensation has nothing to rebalance while the labyrinths are symmetric' },
  brakObrotu:           { pl: 'magazyn prędkości ujawnia się po obrocie — w spoczynku nie ma czego przedłużać', en: 'velocity storage appears after rotation — at rest there is nothing to prolong' },
  brakBodzca:           { pl: 'trzecie okno odzywa się dopiero na bodziec dźwiękowy lub ciśnieniowy', en: 'a third window responds only to a sound or pressure stimulus' },
  poZakresie:           { pl: 'ta wartość leży poza zakresem, w którym model cokolwiek różnicuje', en: 'this value lies outside the range in which the model differentiates anything' },
};

/* ═══════════ 2. OBSERWABLE — CO WIDAĆ PRZY ŁÓŻKU ═══════════
   Silnik zwraca w `clinicalReadout` czternaście pól; różnica całego obiektu przy jednej zmianie
   tonu to 57 pozycji (zmierzone). Wysypanie ich na ekran nie byłoby odpowiedzią na kryterium
   odbioru nr 3 — byłoby zrzutem pamięci. Bierzemy więc DZIEWIĘĆ pól, którym odpowiada realne
   badanie przy łóżku albo w pracowni, i nazywamy je tym, czym są dla klinicysty. */
export const OBSERWABLE = [
  { id: 'spontaneous', pl: 'oczopląs samoistny', en: 'spontaneous nystagmus',
    badaniePl: 'obserwacja w spoczynku, z fiksacją i bez', badanieEn: 'observation at rest, with and without fixation' },
  { id: 'vhit', pl: 'vHIT (pchnięcie głową)', en: 'vHIT (head impulse)',
    badaniePl: 'szybkie pchnięcie głową w płaszczyźnie kanału', badanieEn: 'a rapid head thrust in the canal plane' },
  { id: 'caloric', pl: 'próba kaloryczna', en: 'caloric test',
    badaniePl: 'bodziec cieplny — bardzo niska częstotliwość', badanieEn: 'a thermal stimulus — a very low frequency' },
  { id: 'skew', pl: 'test naprzemiennego zasłaniania (skew)', en: 'alternate cover test (skew)',
    badaniePl: 'zasłanianie na przemian obu oczu', badanieEn: 'covering each eye in turn' },
  { id: 'svv', pl: 'subiektywna pionowa wzrokowa (SVV)', en: 'subjective visual vertical (SVV)',
    badaniePl: 'ustawianie linii do pionu', badanieEn: 'setting a line to vertical' },
  { id: 'vemp', pl: 'przedsionkowe potencjały miogenne (VEMP)', en: 'vestibular evoked myogenic potentials (VEMP)',
    badaniePl: 'cVEMP — woreczek; oVEMP — łagiewka', badanieEn: 'cVEMP — saccule; oVEMP — utricle' },
  { id: 'scds', pl: 'objaw trzeciego okna (Tullio/Hennebert)', en: 'third-window sign (Tullio/Hennebert)',
    badaniePl: 'bodziec dźwiękowy lub ciśnieniowy', badanieEn: 'a sound or pressure stimulus' },
  { id: 'hints', pl: 'zestaw HINTS', en: 'the HINTS battery',
    badaniePl: 'pchnięcie głową + oczopląs + skew', badanieEn: 'head impulse + nystagmus + skew' },
  { id: 'findings', pl: 'opis badania', en: 'examination findings',
    badaniePl: 'zdania, które model układa z powyższych', badanieEn: 'the sentences the model assembles from the above' },
];
export const OBSERWABLE_IDS = OBSERWABLE.map(o => o.id);
export const obserwabla = (id) => OBSERWABLE.find(o => o.id === id) || null;

/* ═══════════ 3. SKUTEK ZMIANY (kryterium odbioru nr 3) ═══════════
   „Zmiana parametru pokazuje BEZPOŚREDNIO, jaki element modelu uległ zmianie."
   Nie deklarujemy tego z tabeli „parametr → skutek" — taka tabela byłaby DRUGIM opisem fizjologii
   i rozjechałaby się z silnikiem przy pierwszej zmianie równania. Zamiast tego MIERZYMY: liczymy
   obraz kliniczny przed zmianą i po niej, i pokazujemy, co się różni.

   Zdania opisu badania (`findings`) diffujemy jako CAŁE ZDANIA, bo to jest jedyna warstwa, którą
   klinicysta czyta bez tłumacza: „zniknęło «vHIT prawidłowy we wszystkich płaszczyznach», pojawiło
   się «vHIT patologiczny w płaszczyźnie: poziomej»".

   BRAK SKUTKU JEST WYNIKIEM, NIE AWARIĄ. Zmierzone: supresja fiksacyjna u zdrowego nie zmienia
   nic, bo nie ma oczopląsu do stłumienia. Suwak, który nic nie robi, uczy nieprawdy, dopóki
   aplikacja nie powie, CZEGO BRAKUJE, żeby zaczął działać — dlatego powód jest polem parametru
   (`bezSkutkuGdy`), a nie zgadywaniem po fakcie. */
const zdania = (r) => (r && Array.isArray(r.findings)) ? r.findings : [];

export function skutekZmiany(przed, po, key) {
  const ruszone = OBSERWABLE_IDS.filter(id => id !== 'findings'
    && JSON.stringify((przed || {})[id]) !== JSON.stringify((po || {})[id]));
  const a = zdania(przed), b = zdania(po);
  const dodane = b.filter(z => !a.includes(z));
  const zniknely = a.filter(z => !b.includes(z));
  const spec = PARAMETRY[key] || null;
  const bezSkutku = !ruszone.length && !dodane.length && !zniknely.length;
  return {
    parametr: key,
    obserwable: ruszone,
    zdaniaDodane: dodane,
    zdaniaZniklo: zniknely,
    bezSkutku,
    // Powód podajemy TYLKO wtedy, gdy parametr sam go deklaruje. Zgadywanie („pewnie dlatego, że…")
    // byłoby wymyślaniem fizjologii, której model nie policzył.
    powodBezSkutku: bezSkutku ? ((spec && spec.bezSkutkuGdy) || 'poZakresie') : null,
  };
}

/* ═══════════ 4. EKSPERYMENTY ═══════════
   Dokument: „każdy eksperyment ma ustawienia początkowe i przycisk resetu do scenariusza
   referencyjnego". Scenariusze BIERZEMY Z SILNIKA (`NeuroVOR.SCENARIOS`) — nie zakładamy własnych,
   bo byłby to drugi zestaw definicji tych samych patologii.
   `parametry` wskazuje, które suwaki eksperyment stawia na wierzchu: nie po to, żeby ukryć resztę
   (wszystkie zostają dostępne), tylko po to, żeby pytanie eksperymentu miało odpowiedź w zasięgu. */
export const EKSPERYMENTY = [
  {
    id: 'jednostronny', referencja: 'neuritisR',
    pl: 'Jednostronne wypadnięcie', en: 'Unilateral loss',
    pytaniePl: 'Co odróżnia ubytek obwodowy od ośrodkowego, gdy oczopląs wygląda tak samo?',
    pytanieEn: 'What separates a peripheral from a central deficit when the nystagmus looks the same?',
    parametry: ['toneR', 'gainR', 'caloricGainR', 'fixationGain'],
  },
  {
    id: 'kompensacja', referencja: 'neuritisR',
    pl: 'Kompensacja ośrodkowa', en: 'Central compensation',
    pytaniePl: 'Dlaczego pacjent bez oczopląsu wciąż ma nieprawidłową kalorykę?',
    pytanieEn: 'Why does a patient without nystagmus still have an abnormal caloric test?',
    parametry: ['comp', 'pacemakerBias', 'tauVS', 'lesionEar'],
  },
  {
    id: 'dysocjacja', referencja: 'normal',
    pl: 'Dysocjacja niskich i wysokich częstotliwości', en: 'Low- versus high-frequency dissociation',
    pytaniePl: 'Jak wygląda ubytek, który widać w kalorykach, a nie widać w vHIT?',
    pytanieEn: 'What does a deficit look like when the caloric test sees it and vHIT does not?',
    parametry: ['caloricGainR', 'gainR', 'toneR'],
  },
  {
    id: 'obustronny', referencja: 'bvh',
    pl: 'Wypadnięcie obustronne', en: 'Bilateral loss',
    pytaniePl: 'Dlaczego przy ciężkim ubytku obustronnym NIE MA oczopląsu samoistnego?',
    pytanieEn: 'Why is there NO spontaneous nystagmus in a severe bilateral loss?',
    parametry: ['toneL', 'toneR', 'gainL', 'gainR'],
  },
  {
    id: 'osrodkowy', referencja: 'strokeCentral',
    pl: 'Obraz ośrodkowy', en: 'A central picture',
    pytaniePl: 'Które trzy liczby zamieniają obraz obwodowy w ośrodkowy?',
    pytanieEn: 'Which three numbers turn a peripheral picture into a central one?',
    parametry: ['fixationGain', 'integratorTau', 'skewTone', 'gainR'],
  },
  {
    id: 'nerw', referencja: 'normal',
    pl: 'Gałęzie nerwu przedsionkowego', en: 'Branches of the vestibular nerve',
    pytaniePl: 'Po czym poznać, że zajęta jest gałąź dolna, a nie górna?',
    pytanieEn: 'How do you tell that the inferior branch is involved rather than the superior one?',
    parametry: ['tonePcR', 'gainPcR', 'sacculeR', 'utricleR', 'caloricGainR'],
  },
  {
    id: 'otolity', referencja: 'normal',
    pl: 'Narządy otolitowe', en: 'The otolith organs',
    pytaniePl: 'Który z dwóch narządów otolitowych zmienia SVV, a który tylko VEMP?',
    pytanieEn: 'Which of the two otolith organs changes the SVV, and which only the VEMP?',
    parametry: ['sacculeL', 'sacculeR', 'utricleL', 'utricleR', 'skewTone'],
  },
  {
    id: 'trzecieOkno', referencja: 'normal',
    pl: 'Trzecie okno (SCDS)', en: 'The third window (SCDS)',
    pytaniePl: 'Dlaczego ten oczopląs pojawia się bez ruchu głowy?',
    pytanieEn: 'Why does this nystagmus appear without any head movement?',
    parametry: ['dehiscence', 'otrTorsion'],
  },
];
export const EKSPERYMENT_IDS = EKSPERYMENTY.map(e => e.id);
export const eksperyment = (id) => EKSPERYMENTY.find(e => e.id === id) || null;

/* ═══════════ 5. ODCHYLENIA OD REFERENCJI ═══════════
   Reset nie może być przyciskiem, który „coś robi" — użytkownik ma widzieć, DO CZEGO wróci
   i CO ZMIENIŁ. Lista odchyleń jest liczona przez porównanie z pacjentem scenariusza. */
export function odchylenia(pacjent, referencyjny) {
  const out = [];
  for (const key of PARAMETR_IDS) {
    const a = (referencyjny || {})[key], b = (pacjent || {})[key];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    out.push({ key, referencja: a == null ? null : a, teraz: b == null ? null : b });
  }
  return out;
}
export const czyPrzyReferencji = (pacjent, referencyjny) => odchylenia(pacjent, referencyjny).length === 0;

/* ═══════════ 6. PORÓWNANIE DWÓCH PATOLOGII (układ „komputer" z dokumentu) ═══════════
   Zwracamy WYŁĄCZNIE identyfikatory obserwabli i zdania z obu odczytów — bez własnego werdyktu
   o tym, która patologia jest „gorsza". Model porównuje obrazy, nie ocenia chorób. */
export function porownanie(readoutA, readoutB) {
  const rozne = OBSERWABLE_IDS.filter(id => id !== 'findings'
    && JSON.stringify((readoutA || {})[id]) !== JSON.stringify((readoutB || {})[id]));
  const za = zdania(readoutA), zb = zdania(readoutB);
  return {
    rozne,
    wspolne: za.filter(z => zb.includes(z)),
    tylkoA: za.filter(z => !zb.includes(z)),
    tylkoB: zb.filter(z => !za.includes(z)),
    identyczne: rozne.length === 0,
  };
}

/* ═══════════ 7. ODCHYLENIE ZE SKUTKIEM ═══════════
   Sama lista „te parametry odbiegają od referencji" uczy FAŁSZYWEJ PRZYCZYNOWOŚCI: czytelnik
   przypisuje cały obraz kliniczny każdemu odchyleniu z osobna, choć część z nich może nie robić
   nic (zmierzone: supresja fiksacyjna bez oczopląsu), a część działa dopiero razem.
   Dlatego każde odchylenie dostaje WŁASNY POMIAR: co się zmieni, jeśli ten JEDEN parametr wróci
   do referencji. To jest pytanie kontrfaktyczne, na które model umie odpowiedzieć, a nie domysł. */
export function odchyleniaZeSkutkiem(pacjent, referencyjny, deps) {
  const lista = odchylenia(pacjent, referencyjny);
  if (!deps || typeof deps.obraz !== 'function' || typeof deps.pacjent !== 'function') return lista;
  const teraz = deps.obraz(pacjent);
  return lista.map(o => {
    const bezTego = deps.pacjent({ ...pacjent, [o.key]: o.referencja });
    const sk = skutekZmiany(teraz, deps.obraz(bezTego), o.key);
    return { ...o, skutekPowrotu: { obserwable: sk.obserwable, bezSkutku: sk.bezSkutku, powodBezSkutku: sk.powodBezSkutku } };
  });
}

/* ═══════════ 8. CO WOLNO POKAZAĆ, A CZEGO NIE ═══════════
   `clinicalReadout` zwraca też `verdict` i `localization` — nazwy ROZPOZNANIA. W ścieżce klinicznej
   mają sens: tam obraz przychodzi od pacjenta, a model go interpretuje. W Laboratorium kierunek
   jest ODWROTNY: to użytkownik ustawia patologię, więc werdykt jest ECHEM WEJŚCIA, a nie wynikiem.
   Karta „rozpoznanie: ośrodkowe" nad suwakami, którymi się to ośrodkowe przed chwilą nastawiło,
   wygląda jak narzędzie diagnostyczne, a jest tautologią.
   Model wystawia więc jawną listę pól ZAKAZANYCH na ekranie Laboratorium, a wyrocznia DOM sprawdza,
   że żadne z nich tam nie trafiło. */
export const POLA_ZAKAZANE_W_LAB = ['verdict', 'localization'];
export function wolnoPokazac(idPola) {
  return OBSERWABLE_IDS.includes(idPola) && !POLA_ZAKAZANE_W_LAB.includes(idPola);
}

/* ═══════════ 9. DWA STANOWISKA (porównanie z układu „komputer") ═══════════
   Porównanie dwóch patologii wymaga DWÓCH pacjentów naraz, więc Laboratorium ma dwa stanowiska:
   A i B. Jeden globalny zestaw parametrów by tego nie udźwignął — użytkownik przestawiałby jedną
   patologię w drugą i porównywał ją z pamięcią.
   `STANOWISKA` jest słownikiem, żeby ekran i wyrocznia nie musiały znać liter. */
export const STANOWISKA = {
  A: { pl: 'stanowisko A', en: 'bench A' },
  B: { pl: 'stanowisko B', en: 'bench B' },
};
export const STANOWISKO_IDS = Object.keys(STANOWISKA);
export const czyStanowisko = (id) => STANOWISKO_IDS.includes(id);
