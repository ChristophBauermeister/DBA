# Wolkenlotse – vollständige Dokumentation

Version 1.0 · Stand 18. Juli 2026

## Inhaltsverzeichnis

1. [Zweck der App](#1-zweck-der-app)
2. [Wichtiger Sicherheitshinweis](#2-wichtiger-sicherheitshinweis)
3. [Schnellstart](#3-schnellstart)
4. [Übersicht der Hauptbereiche](#4-übersicht-der-hauptbereiche)
5. [Fotoanalyse](#5-fotoanalyse)
6. [Sicherheits-Fusion](#6-sicherheits-fusion)
7. [Himmel-Timeline](#7-himmel-timeline)
8. [Manuelle Wolkenbestimmung](#8-manuelle-wolkenbestimmung)
9. [Wolkenatlas und Warnzeichen](#9-wolkenatlas-und-warnzeichen)
10. [Törn-Wetterpakete](#10-törn-wetterpakete)
11. [Amtliche CAP-Warnmeldungen](#11-amtliche-cap-warnmeldungen)
12. [GRIB-Ablage](#12-grib-ablage)
13. [Bordinstrumente](#13-bordinstrumente)
14. [Bordlogbuch](#14-bordlogbuch)
15. [Offline- und Online-Funktionen](#15-offline--und-online-funktionen)
16. [Datenschutz und lokale Speicherung](#16-datenschutz-und-lokale-speicherung)
17. [Native Android-App](#17-native-android-app)
18. [Empfohlener Ablauf vor und während eines Törns](#18-empfohlener-ablauf-vor-und-während-eines-törns)
19. [Grenzen der App](#19-grenzen-der-app)
20. [Fehlerbehebung](#20-fehlerbehebung)
21. [Technische Architektur](#21-technische-architektur)
22. [Qualitätssicherung](#22-qualitätssicherung)
23. [Build-Anleitung für Entwickler](#23-build-anleitung-für-entwickler)
24. [Glossar](#24-glossar)

---

## 1. Zweck der App

Wolkenlotse ist eine mobile, offline-fähige Anwendung für Segler. Sie unterstützt dabei,
Wolkenbilder systematisch zu beobachten, Entwicklungen über Zeit festzuhalten und mehrere
Wetterhinweise gemeinsam zu bewerten.

Die App verbindet:

- lokale Analyse eines Wolkenfotos,
- eine manuelle Wolkenbestimmung,
- einen Atlas mit Wolkengattungen und Sonderformen,
- typische Front- und Gewitterwarnzeichen,
- eine zeitbasierte Himmel-Timeline,
- ein lokales Bordlogbuch,
- Barometer-, Blitz-, Peilungs- und Kreuzwindwerkzeuge,
- vorab ladbare Törn-Wetterpakete,
- importierbare amtliche CAP-Warnmeldungen,
- eine Offline-Ablage für GRIB-Dateien,
- eine erklärbare Sicherheits-Fusion aller verfügbaren Hinweise.

Die wesentlichen Funktionen arbeiten ohne Benutzerkonto, ohne eigenen Backend-Server und ohne
Übertragung der aufgenommenen Fotos.

---

## 2. Wichtiger Sicherheitshinweis

Wolkenlotse ist eine **Beobachtungs- und Entscheidungshilfe**. Die App ist kein amtlicher
Wetterdienst, kein zugelassenes Navigationsinstrument und kein Ersatz für gute Seemannschaft.

Entscheidungen an Bord müssen weiterhin auf mehreren unabhängigen Quellen beruhen:

- amtlicher Seewetterbericht,
- amtliche Warnungen,
- Barometer und übrige Bordinstrumente,
- eigener Ausguck,
- lokale Revierkenntnis,
- Zustand von Boot und Crew,
- sichere Alternativroute und Schutzhafen.

Die Stufe „Beobachten“ bedeutet ausdrücklich **keine Entwarnung**. Ein Foto zeigt immer nur einen
Ausschnitt des Himmels. Eine Gewitterzelle, Front oder Böenwalze kann sich außerhalb des Bildes
befinden.

Bei unmittelbarer Gefahr gelten direkte Beobachtungen und amtliche Warnungen vor der
Bilderkennung. Beispiele sind:

- sichtbare Böenwalze,
- Blitz und Donner in geringer Entfernung,
- stehende Peilung einer Gewitterzelle,
- stark fallender Luftdruck,
- aktive amtliche Sturm- oder Gewitterwarnung.

---

## 3. Schnellstart

### 3.1 Native Android-App

1. `Wolkenlotse-Android-1.0.apk` auf das Android-Gerät übertragen.
2. APK öffnen.
3. Falls Android nachfragt, die Installation aus dieser Quelle erlauben.
4. „Installieren“ wählen.
5. Wolkenlotse über das App-Symbol starten.
6. Kamera und Standort nur dann erlauben, wenn diese Funktionen genutzt werden sollen.

Die native Android-App benötigt keinen Webserver. Alle App-Dateien sind im APK enthalten.

Voraussetzung: Android 7 oder neuer.

### 3.2 PWA im Browser

Die Webversion muss einmal über HTTPS oder `localhost` geöffnet werden. Danach kann sie als
Progressive Web App installiert und offline gestartet werden.

- Android/Chrome: Menü → „App installieren“
- iPhone/Safari: Teilen → „Zum Home-Bildschirm“

Eine direkt aus dem Dateimanager geöffnete `index.html` reicht nicht aus, weil Browser
Service Worker und einige Gerätefunktionen für normale `file://`-Dateien einschränken.

### 3.3 Erster Funktionstest

Vor dem ersten Törn:

1. App starten.
2. Ein Testfoto aufnehmen.
3. GPS optional erfassen.
4. Foto lokal analysieren.
5. Ergebnis zur Himmel-Timeline und zum Logbuch hinzufügen.
6. Im Bereich „Bord“ ein Törn-Wetterpaket laden.
7. Flugmodus aktivieren.
8. App neu starten und gespeicherte Inhalte kontrollieren.

---

## 4. Übersicht der Hauptbereiche

Die untere Navigation enthält fünf Bereiche.

| Bereich | Aufgabe |
|---|---|
| Analyse | Wolkenfoto auswerten, Sicherheits-Fusion anzeigen, Timeline führen |
| Bestimmen | Wolkenart über zwei bis drei Beobachtungsfragen eingrenzen |
| Atlas | Wolkensteckbriefe und typische Warnsequenzen nachschlagen |
| Bord | Wetterpakete, CAP, GRIB und Bordinstrumente verwalten |
| Logbuch | Gespeicherte Fotoanalysen ansehen und löschen |

Im Kopfbereich zeigt die App, ob eine Netzverbindung besteht. „Offline bereit“ bedeutet, dass die
lokalen Kernfunktionen ohne Netz genutzt werden können.

---

## 5. Fotoanalyse

### 5.1 Aufnahme oder Galerie

Im Bereich „Analyse“ kann ein Bild auf zwei Wegen ausgewählt werden:

- „Foto aufnehmen“ öffnet auf unterstützten Geräten direkt die rückwärtige Kamera.
- „Aus Galerie“ öffnet die Dateiauswahl.

Die maximale Dateigröße beträgt 24 MB.

Für ein möglichst brauchbares Bild:

- freien Himmel aufnehmen,
- Sonne nicht direkt in die Kamera richten,
- Horizont, Wasser, Mast und Segel möglichst wenig ins Bild nehmen,
- bei Folgeaufnahmen denselben Ausschnitt und dieselbe Blickrichtung verwenden.

### 5.2 Lokale Verarbeitung

Das Foto wird nur auf dem Gerät verarbeitet. Für die Analyse wird es intern auf maximal 320 Pixel
Kantenlänge verkleinert. Die unteren 12 Prozent des Bildes werden bei der Merkmalsmessung
ausgespart, weil dort häufig Wasser, Land oder Decksausrüstung sichtbar sind.

Gemessen werden unter anderem:

- Anteil wahrscheinlicher Wolkenfläche,
- Blauanteil des Himmels,
- Grauanteil,
- mittlere Helligkeit,
- dunkle Bildanteile,
- helle Bildanteile,
- Helligkeitsvarianz,
- Kantendichte und Struktur.

Die App lädt das Foto nicht hoch.

### 5.3 Zusätzliche Beobachtungen

Vor der Analyse können drei Beobachtungen ergänzt werden:

- Wind gleichbleibend, zunehmend oder abnehmend,
- Luftdruck stabil, steigend, fallend oder unbekannt,
- dunkle Wolken am Horizont.

Existiert ein ausreichender Barometertrend im Bereich „Bord“, kann die App diesen automatisch
übernehmen.

### 5.4 GPS

„GPS erfassen“ speichert optional:

- Breitengrad,
- Längengrad,
- gemeldete Positionsgenauigkeit.

Die Position kann in Timeline, Logbuch und Törn-Wetterpaket verwendet werden. Eine Fotoanalyse ist
auch ohne GPS möglich.

### 5.5 Erkennbare Wolkentypen

Die automatische Bildheuristik unterscheidet sieben Gruppen:

1. Cirrus
2. Cirrostratus
3. Altocumulus
4. Stratus
5. Nimbostratus
6. Cumulus
7. Cumulonimbus

Weitere Wolkentypen und Sonderformen sind über die manuelle Bestimmung und den Atlas verfügbar.

### 5.6 Ergebnis

Das Ergebnis zeigt:

- wahrscheinliche Wolkenart,
- lateinische Bezeichnung,
- Bildübereinstimmung,
- geschätzte Wolkendecke,
- gemessene Struktur,
- Helligkeit,
- allgemeine Segler-Empfehlung,
- Qualitätswarnung bei ungeeignetem Bild,
- zusammengeführte Sicherheitsbewertung.

Die Bildübereinstimmung ist technisch auf 38 bis 92 Prozent begrenzt. Sie ist keine
meteorologische Wahrscheinlichkeit.

Wurde im Bild wenig eindeutig erkennbarer Himmel gefunden, erscheint eine zusätzliche Warnung.

### 5.7 Aktionen nach der Analyse

- „Im Logbuch speichern“
- „Zur Timeline hinzufügen“
- „Steckbrief öffnen“
- „Mit Fragen verfeinern“

---

## 6. Sicherheits-Fusion

### 6.1 Zweck

Ein einzelnes Foto ist für eine Sicherheitsentscheidung nicht ausreichend. Die Sicherheits-Fusion
führt deshalb alle verfügbaren Hinweise zusammen.

Mögliche Quellen:

- Wolkenfoto,
- Bildqualität,
- eigene Windbeobachtung,
- dunkler Horizont,
- Barometertrend,
- Blitz-Distanz,
- Zellen-Peilung,
- Himmel-Timeline,
- gespeichertes Törn-Modellpaket,
- importierte und noch gültige DWD-CAP-Warnung.

### 6.2 Ergebnisstufen

| Stufe | Bedeutung |
|---|---|
| Weiter beobachten | Keine akute Eskalation aus den vorhandenen Daten; keine Entwarnung |
| Vorbereiten | Mehrere Hinweise verlangen konkrete Vorbereitung |
| Jetzt handeln | Mindestens ein starkes Gefahrensignal verlangt unmittelbare Maßnahmen |

### 6.3 Erklärbarkeit

Die Fusion zeigt nicht nur eine Stufe, sondern auch:

- welche Quellen verwendet wurden,
- welchen Hinweis jede Quelle liefert,
- welche Daten widersprüchlich oder unsicher sind,
- welche nächsten Schritte empfohlen werden.

Beispiele für sichtbare Widersprüche:

- fronttypisches Wolkenbild bei steigendem Luftdruck,
- geringe Bildübereinstimmung,
- Timeline-Aufnahmen aus deutlich unterschiedlichen Richtungen,
- nicht verifizierte CAP-Quelle,
- scheinbar harmloses Bild trotz gemessener Blitznähe.

### 6.4 Prioritäten

Direkte Gefahrensignale erhalten mehr Gewicht als indirekte Modell- oder Bildhinweise.

Besonders hoch priorisiert werden:

- Blitz unter 5 km,
- Blitz unter 10 km,
- stehende Peilung einer Gewitterzelle,
- stark fallender Luftdruck,
- schnell eskalierende Himmel-Timeline,
- aktive schwere oder extreme DWD-CAP-Warnung.

Ein ergänzendes Modellpaket kann allein keine unmittelbare Notfallstufe auslösen. Es dient der
Vorbereitung und muss mit aktuellen Beobachtungen verglichen werden.

### 6.5 Interne Schwellen

Die App verwendet intern einen Orientierungsscore:

- ab 38: „Vorbereiten“
- ab 70: „Jetzt handeln“

Beispiele:

- dunkler Horizont: zusätzliche Gewichtung,
- zunehmender Wind: zusätzliche Gewichtung,
- stark fallender Druck von mindestens 3 hPa in drei Stunden: starke Gewichtung,
- Blitz unter 5 km: mindestens sehr hohe Gefahrenstufe,
- stehende Zellenpeilung: mindestens hohe Gefahrenstufe,
- schnelle Timeline-Entwicklung: deutliche Erhöhung.

Diese Werte sind interne Entscheidungsregeln der App und keine amtlichen meteorologischen
Warnschwellen.

---

## 7. Himmel-Timeline

### 7.1 Zweck

Die Timeline vergleicht mehrere Aufnahmen über Zeit. Dadurch kann die App erkennen, ob sich eine
Wolkensituation sichtbar verändert.

Gespeichert werden:

- Zeitpunkt,
- erkannte Wolkenart,
- Bildübereinstimmung,
- Bildmetriken,
- kleines Vorschaubild,
- GPS-Position, falls vorhanden,
- Kompassrichtung, falls verfügbar.

Maximal zwölf Beobachtungen werden gespeichert.

### 7.2 Voraussetzungen für einen Trend

- mindestens zwei Aufnahmen,
- mindestens zwei Minuten Abstand,
- Aufnahmen innerhalb der letzten drei Stunden.

Ist eine Kompassrichtung vorhanden, sollten die Aufnahmen höchstens 35 Grad voneinander
abweichen. Größere Abweichungen führen zum Status „unsicher“.

### 7.3 Erkannte Trends

| Status | Bedeutung |
|---|---|
| Stabil | Keine schnelle Bildveränderung erkannt |
| In Entwicklung | Erkennbare Verdichtung, Verdunklung oder Strukturzunahme |
| Schnelle Entwicklung | Starke Veränderung innerhalb kurzer Zeit |
| Auflockernd | Gemessene Wolkendecke nimmt ab; keine Entwarnung |
| Unsicher | Blickrichtungen sind nicht ausreichend vergleichbar |

Die Raten werden auf eine Stunde normiert. „+35 %/h“ bedeutet in diesem Zusammenhang ungefähr
35 Prozentpunkte mehr gemessene Wolkendecke pro Stunde.

### 7.4 Erinnerungen

Verfügbare Intervalle:

- 10 Minuten,
- 15 Minuten,
- 30 Minuten.

Die App zeigt einen Countdown und erinnert bei Fälligkeit. Eine Systembenachrichtigung wird nur
versucht, wenn das Gerät sie erlaubt. Der zuverlässigste Betrieb besteht bei geöffneter App. Nach
einem späteren Neustart wird eine überfällige Aufnahme ebenfalls angezeigt.

Die Funktion ist kein garantierter Hintergrundalarm.

---

## 8. Manuelle Wolkenbestimmung

Der Bereich „Bestimmen“ funktioniert vollständig offline und ohne Foto.

Der Assistent fragt:

1. ungefähre Höhe und Grundform,
2. Struktur,
3. bei Bedarf eine Sonderform.

Mögliche Ergebnisse:

- Cirrus,
- Cirrocumulus,
- Cirrostratus,
- Altocumulus,
- Altostratus,
- Nimbostratus,
- Stratocumulus,
- Stratus,
- Cumulus,
- Cumulonimbus,
- Arcus,
- Lenticularis,
- Mammatus,
- Virga.

Besondere Hinweise:

- Zinnen oder Türmchen bei Altocumulus können auf Castellanus und erhöhte Gewitterneigung
  hindeuten.
- Stark wachsende Cumulus-Türme können sich im Congestus-Stadium befinden.
- Eine dunkle Rolle vor einer Regenwand kann eine Böenwalze sein.

Nach dem Ergebnis kann der passende Steckbrief geöffnet oder die Bestimmung neu gestartet werden.

---

## 9. Wolkenatlas und Warnzeichen

### 9.1 Wolkenatlas

Der Atlas enthält zehn WMO-Wolkengattungen und vier seglerrelevante Sonderformen.

Filter:

- Alle
- Hoch
- Mittel
- Tief
- Vertikal

Jeder Steckbrief enthält:

- deutschen Namen,
- lateinische Bezeichnung,
- typische Höhe,
- Erkennungsmerkmale,
- mögliches Wettersignal,
- konkrete Beobachtungs- oder Handlungsempfehlung.

### 9.2 Warmfront-Sequenz

Typischer Ablauf:

1. Cirrus verdichtet sich.
2. Cirrostratus erzeugt einen milchigen Schleier oder Halo.
3. Altostratus lässt die Sonne nur noch matt erscheinen.
4. Nimbostratus bringt anhaltenden Niederschlag.

Die App nennt hierfür einen typischen Vorlauf von 12 bis 24 Stunden. Die reale Entwicklung kann
deutlich abweichen.

### 9.3 Kaltfront oder Squall-Linie

Typischer Ablauf:

1. dunkle Cumulonimbus-Wand am Horizont,
2. Arcus oder Böenwalze,
3. Böensprung, Winddrehung und Starkregen.

Die App nennt einen typischen Vorlauf von 30 bis 120 Minuten. Eine sichtbare Böenwalze kann jedoch
wesentlich schneller eintreffen.

### 9.4 Gewitter-Frühindikatoren

- Altocumulus castellanus am Morgen,
- schnell wachsende Cumuluswolken,
- faserig werdende Wolkenspitzen,
- Windstille unter dunkler Basis,
- Halo zusammen mit fallendem Luftdruck.

Der Bereich „Warnzeichen“ ist ein statischer Feldführer und keine Live-Warnung.

---

## 10. Törn-Wetterpakete

### 10.1 Zweck

Vor dem Ablegen kann eine stundenweise Vorhersage für eine Position gespeichert werden. Das Paket
steht danach ohne Netz zur Verfügung.

Auswahl:

- Breitengrad,
- Längengrad,
- drei, fünf oder sieben Tage.

Die Position kann manuell eingegeben oder per GPS übernommen werden.

### 10.2 Daten

Das Paket kann enthalten:

- Windgeschwindigkeit,
- Windböen,
- Windrichtung,
- Niederschlag,
- Niederschlagswahrscheinlichkeit,
- Luftdruck,
- Bewölkung,
- Temperatur,
- Sichtweite,
- CAPE als Modellgröße für konvektive Energie,
- Wellenhöhe,
- Wellenrichtung,
- Wellenperiode,
- Windwelle,
- Dünung,
- Wassertemperatur.

### 10.3 Quelle

Die automatisch geladenen Werte stammen aus:

- Open-Meteo Wetter-API,
- Open-Meteo Marine-API.

Diese Modellwerte sind **nicht amtlich**. Sie ersetzen keinen DWD-/BSH-Seewetterbericht und keine
amtliche Warnung.

### 10.4 Zusammenfassung

Für die nächsten 24 Stunden zeigt die App unter anderem:

- höchsten modellierten Wind,
- höchste Böe,
- höchste Welle,
- niedrigste Sicht.

Interne Modellschwellen:

| Stufe | Modellbedingung |
|---|---|
| Handlungsnahes Modellsignal | Böen mindestens 34 kn oder Welle mindestens 4 m |
| Vorbereitungssignal | Böen mindestens 25 kn, Welle mindestens 2,5 m, CAPE mindestens 1000 oder Sicht unter 2 km |

Ein solches Modellsignal führt in der Sicherheits-Fusion nur zu einer Vorbereitung oder
zusätzlichen Gewichtung. Es ist keine amtliche Warnung.

### 10.5 Datenalter

| Kennzeichnung | Bedeutung |
|---|---|
| Frisch geladen | höchstens 6 Stunden alt |
| Aktualisierung empfohlen | mehr als 6 Stunden alt |
| Veraltet | mehr als 12 Stunden alt |
| Gültigkeit abgelaufen | Ende des Vorhersagezeitraums überschritten |

Veraltete oder abgelaufene Pakete werden nicht zur Risikoeskalation verwendet.

### 10.6 Export und Import

Ein Wolkenlotse-Paket kann als JSON-Datei exportiert und auf einem anderen Gerät importiert werden.
Enthalten sind:

- Position,
- Gültigkeit,
- stündliche Modellwerte,
- Quellenkennzeichnung,
- optional importierte CAP-Warnungen.

---

## 11. Amtliche CAP-Warnmeldungen

### 11.1 CAP

CAP steht für Common Alerting Protocol. Es ist ein standardisiertes XML-Format für
Warnmeldungen.

Wolkenlotse kann `.xml`- und `.cap`-Dateien importieren.

Angezeigt werden:

- Ereignis,
- Warnüberschrift,
- Beschreibung,
- Anweisung der Quelle,
- Schweregrad,
- Dringlichkeit,
- Gültigkeitsgebiet,
- Ablaufzeit,
- Absender.

### 11.2 DWD-Erkennung

Eine importierte Meldung wird als DWD-Meldung gekennzeichnet, wenn der Absender `dwd.de` oder die
Bezeichnung „Deutscher Wetterdienst“ enthält.

Das ist eine Absenderprüfung, aber keine kryptografische Signaturprüfung.

Nur noch gültige und als DWD erkannt markierte Meldungen können die Sicherheits-Fusion
eskalieren.

### 11.3 Wichtige Einschränkung

Wolkenlotse lädt CAP-Warnungen nicht automatisch vom DWD. Die Datei muss manuell importiert werden.

„Keine CAP-Datei importiert“ bedeutet daher **nicht**, dass keine amtliche Warnung besteht.

Direkte Links zu DWD und BSH befinden sich in der App und benötigen eine Internetverbindung.

---

## 12. GRIB-Ablage

### 12.1 Unterstützte Dateien

- `.grb`
- `.grib`
- `.grib2`

Maximale Dateigröße: 128 MB.

### 12.2 Prüfung

Beim Import prüft die App:

- GRIB-Signatur,
- Edition 1 oder 2,
- deklarierte Dateilänge,
- bei GRIB2 nach Möglichkeit Disziplin und Referenzzeit.

### 12.3 Speicherung

Die Rohdatei wird unverändert in IndexedDB gespeichert. Sie kann später wieder exportiert oder
gelöscht werden.

### 12.4 Keine Interpretation

Wolkenlotse visualisiert und interpretiert GRIB-Felder derzeit nicht. Es werden keine Windpfeile,
Isobaren oder Wellenkarten aus der Datei erzeugt.

Diese Einschränkung ist bewusst: Eine sicherheitsrelevante GRIB-Darstellung soll erst mit einem
gegen Referenzdaten validierten Decoder erfolgen.

---

## 13. Bordinstrumente

### 13.1 Barometer-Log

Der Wert wird vom Schiffsbarometer abgelesen und manuell eingegeben.

Zulässiger Bereich:

- 920 bis 1080 hPa,
- Eingabe in 0,1-hPa-Schritten möglich.

Die App normalisiert die Änderung auf drei Stunden. Verwendet werden Messungen mit mindestens
15 Minuten und höchstens sechs Stunden Abstand; bevorzugt wird ein Abstand nahe drei Stunden.

| Änderung in drei Stunden | Anzeige |
|---|---|
| höchstens −6 hPa | Drucksturz – Sturmgefahr |
| höchstens −3 hPa | stark fallend |
| höchstens −1 hPa | fallend |
| zwischen −1 und +1 hPa | nahezu stabil |
| unter +3 hPa | steigend |
| ab +3 hPa | stark steigend |

Maximal 30 Messungen der letzten 48 Stunden werden gespeichert.

Das Smartphone-Barometer wird nicht automatisch ausgelesen.

### 13.2 Blitz-Distanzmesser

Ablauf:

1. Beim sichtbaren Blitz „Blitz gesehen“ drücken.
2. Beim Donner „Donner gehört“ drücken.
3. Die App berechnet den ungefähren Abstand.

Formel:

`Entfernung in km = Sekunden × 0,343`

Faustregel:

`etwa 3 Sekunden entsprechen 1 km`

Der Timer wird nach 60 Sekunden zurückgesetzt. Maximal zwölf Messungen der letzten drei Stunden
werden gespeichert. Für die Sicherheits-Fusion wird eine Messung höchstens 90 Minuten lang
verwendet.

Diese Funktion ist kein Blitzdetektor. Mehrfachblitze, Wind, Schallreflexion und menschliche
Reaktionszeit können das Ergebnis verfälschen.

### 13.3 Zellen-Peilung

Das Smartphone wird hochkant auf dieselbe Gewitterzelle gerichtet. Nach drei bis fünf Minuten wird
erneut gepeilt.

Als stehende Peilung gilt intern:

- mindestens zwei Peilungen,
- mindestens zwei Minuten Abstand,
- weniger als acht Grad Änderung.

Eine stehende Peilung kann bedeuten, dass die Zelle auf das Boot zuhält.

Der Smartphone-Kompass kann durch Stahl, Lautsprecher, Stromleitungen, Motor, Mast und andere
Magnetfelder an Bord stark verfälscht werden. Peilungen müssen mit einem geeigneten Bordkompass
und der tatsächlichen Bewegung abgeglichen werden.

### 13.4 Kreuzwind-Check

Eingegeben werden:

- Richtung, aus der der Bodenwind kommt,
- Richtung, aus der hohe Wolken ziehen,
- Nord- oder Südhalbkugel.

Die Hemisphäre kann aus dem GPS-Breitengrad übernommen werden.

Die Funktion setzt eine meteorologische Faustregel um:

- bestimmte linke Winkelbereiche sprechen eher für Warmluftadvektion und Verschlechterung,
- bestimmte rechte Winkelbereiche eher für Kaltluftadvektion und Besserung,
- paralleler Zug liefert kein klares Signal.

Der Kreuzwind-Check ist keine Frontengarantie.

---

## 14. Bordlogbuch

Eine Fotoanalyse kann lokal gespeichert werden.

Ein Eintrag enthält:

- Datum und Uhrzeit,
- erkannte Wolkenart,
- Bildübereinstimmung,
- Wolkendecke,
- Risikokennzeichnung,
- kleines Vorschaubild,
- optional GPS-Position.

Maximal 25 Einträge werden gespeichert. Danach werden die ältesten Einträge verworfen.

Möglichkeiten:

- einzelnen Eintrag löschen,
- gesamtes Logbuch nach Bestätigung löschen.

Das Logbuch besitzt keinen Cloud-Sync und kein Benutzerkonto.

---

## 15. Offline- und Online-Funktionen

| Funktion | Offline nutzbar | Internet erforderlich |
|---|---:|---:|
| Fotoanalyse | Ja | Nein |
| Sicherheits-Fusion | Ja | Nein |
| Himmel-Timeline | Ja | Nein |
| Bestimmungsassistent | Ja | Nein |
| Wolkenatlas | Ja | Nein |
| Warnzeichen-Feldführer | Ja | Nein |
| Barometer-Log | Ja | Nein |
| Blitz-Distanz | Ja | Nein |
| Zellen-Peilung | Ja | Nein |
| Kreuzwind-Check | Ja | Nein |
| Bordlogbuch | Ja | Nein |
| Gespeichertes Törn-Paket ansehen | Ja | Nein |
| Neues Törn-Paket laden | Nein | Ja |
| CAP-Datei importieren | Ja | Nein |
| GRIB-Datei importieren | Ja | Nein |
| DWD-/BSH-Webseiten öffnen | Nein | Ja |
| GPS | Ja, geräteabhängig | Nein |
| Kamera | Ja, geräteabhängig | Nein |

Bei der nativen Android-App sind alle Oberflächen- und Programmdateien im APK enthalten.

---

## 16. Datenschutz und lokale Speicherung

### 16.1 Grundsätze

- keine Foto-Uploads,
- kein Benutzerkonto,
- keine Analytics,
- kein Tracking,
- keine Telemetrie,
- keine Werbenetzwerke,
- kein Browser-API-Key für einen KI-Anbieter.

### 16.2 Speicherorte

| Daten | Speicher |
|---|---|
| Logbuch | localStorage |
| Timeline | localStorage |
| Barometerwerte | localStorage |
| Blitzmessungen | localStorage |
| Peilungen | localStorage |
| Wetterpaket | localStorage |
| CAP-Meldungen | localStorage |
| GRIB-Rohdateien | IndexedDB |
| PWA-App-Shell | Browser Cache API |

### 16.3 Verschlüsselung

Die App verschlüsselt die lokal gespeicherten Daten nicht selbst. Der Schutz hängt von
Gerätesperre, Betriebssystem und App-Speicher des Telefons ab.

### 16.4 Android-Backups

Für die native Android-App sind deaktiviert:

- Cloud-Backup,
- Geräteübertragung der App-Daten,
- unverschlüsselter HTTP-Verkehr.

### 16.5 Daten löschen

- Logbuch über „Alle löschen“
- Timeline über „Timeline löschen“
- Modellpaket über „Modellpaket löschen“
- einzelne GRIB-Datei über „Löschen“
- vollständige Datenlöschung über Android → App-Info → Speicher → Daten löschen

---

## 17. Native Android-App

### 17.1 Eigenschaften

| Eigenschaft | Wert |
|---|---|
| Paketname | `de.wolkenlotse.app` |
| Version | 1.0 |
| Mindestversion | Android 7 / API 24 |
| Zielplattform | API 36 |
| Technik | Capacitor 8 / Android WebView |
| Server im Betrieb | nicht erforderlich |

### 17.2 Berechtigungen

| Berechtigung | Zweck |
|---|---|
| Internet | neue Wetterpakete und externe Informationsseiten |
| Kamera | Wolkenfoto aufnehmen |
| genauer/ungefährer Standort | GPS-Position und Paketkoordinaten |
| Vibration | derzeit nicht aktiv genutzt; für mögliche native Rückmeldung deklariert |

Kamera und GPS sind als optionale Hardwaremerkmale markiert. Die App kann auch ohne diese
Hardware geöffnet werden.

### 17.3 APK-Signatur

Das bereitgestellte APK ist mit einer Android-Debugsignatur signiert. Es kann direkt getestet und
per Sideload installiert werden, ist aber kein Play-Store-Release.

Für eine öffentliche Veröffentlichung werden benötigt:

- eigener sicher verwahrter Release-Key,
- signiertes Android App Bundle,
- Datenschutzerklärung,
- Store-Texte und Screenshots,
- verbindliches Release- und Updateverfahren.

### 17.4 Updates

Das direkt installierte APK aktualisiert sich nicht automatisch. Eine neue Version muss erneut
heruntergeladen und installiert werden. Sie muss mit demselben Signierschlüssel signiert sein,
damit Android sie als Update akzeptiert.

---

## 18. Empfohlener Ablauf vor und während eines Törns

### 18.1 Vor dem Ablegen

1. Android-Akku laden und Offline-Stromversorgung prüfen.
2. App starten und Funktionstest durchführen.
3. Törnposition oder Wegpunkt eingeben.
4. neues Wetterpaket laden.
5. Datenalter und Gültigkeit kontrollieren.
6. amtliche DWD-/BSH-Informationen separat prüfen.
7. verfügbare CAP-Warnung importieren.
8. benötigte GRIB-Dateien importieren.
9. Barometer-Ausgangswert eintragen.
10. App im Flugmodus neu starten.

### 18.2 Während des Törns

1. Himmel regelmäßig rundum beobachten.
2. Bei auffälliger Entwicklung Foto aufnehmen.
3. Windtrend, Drucktrend und Horizont ergänzen.
4. Analyse ausführen.
5. Ergebnis und Widersprüche lesen.
6. Beobachtung zur Timeline hinzufügen.
7. Folgeaufnahme nach 10 bis 15 Minuten.
8. Barometer regelmäßig nachführen.
9. Bei Gewitter Blitzabstand und Peilung verfolgen.
10. Frühzeitig reffen und sichere Alternativen vorbereiten.

### 18.3 Bei akuter Gewittergefahr

Die konkrete Maßnahme hängt von Boot, Revier, Crew und Seegang ab. Allgemein:

- Segelfläche frühzeitig reduzieren,
- Crew einpicken,
- Luken schließen,
- Ausweichkurs und Schutzhafen beurteilen,
- Position zusätzlich analog sichern,
- Kontakt zu exponierten Metallteilen minimieren,
- amtliche Warnungen und Funkmeldungen verfolgen.

Wolkenlotse gibt keine Garantie, dass diese Liste für jede Situation vollständig oder richtig ist.

---

## 19. Grenzen der App

### 19.1 Keine echte Offline-KI

Die Fotoanalyse ist eine lokale Pixelheuristik und kein trainiertes Machine-Learning-Modell.

Sie bewertet Farbe, Helligkeit, Struktur und Wolkendecke. Sie versteht weder räumliche Tiefe noch
die vollständige meteorologische Lage.

### 19.2 Nur sieben automatische Bildklassen

Der Atlas enthält 14 Typen. Die Fotoanalyse unterscheidet davon sieben. Sonderformen wie Arcus,
Mammatus, Virga oder Lenticularis müssen über eigene Beobachtung, Wizard und Atlas eingeordnet
werden.

### 19.3 Modellpaket nicht amtlich

Open-Meteo-Daten sind ergänzende Modellwerte. Lokale Böen, Gewitter, Küsten- und Düseneffekte
können fehlen oder falsch eingeschätzt werden.

### 19.4 Kein automatischer DWD-CAP-Abruf

Amtliche CAP-Dateien müssen manuell importiert werden. Eine fehlende Datei ist keine Aussage über
die tatsächliche Warnlage.

### 19.5 Keine GRIB-Karte

GRIB wird nur validiert, gespeichert und exportiert.

### 19.6 Sensorgrenzen

- kein automatisches Smartphone-Barometer,
- GPS kann ungenau sein,
- Kompass kann an Bord stark gestört sein,
- Blitzdistanz ist eine akustische Schätzung,
- Hintergrundbenachrichtigungen sind nicht garantiert.

### 19.7 Lokaler Speicher

Browser und Betriebssystem können Speicher begrenzen oder bei Speichermangel löschen. Wichtige
Informationen müssen zusätzlich in einem unabhängigen Bordlogbuch geführt werden.

### 19.8 Keine Navigationsfunktionen

Die App:

- berechnet keinen sicheren Kurs,
- berücksichtigt keine Untiefen,
- zeigt keine Seekarte,
- empfängt kein AIS,
- ersetzt kein Radar,
- ersetzt kein NAVTEX,
- löst keinen Notruf aus.

---

## 20. Fehlerbehebung

### Foto kann nicht ausgewertet werden

- anderes Foto wählen,
- Horizontanteil reduzieren,
- Kamera reinigen,
- stärkere Gegenlichtsituation vermeiden,
- Dateigröße unter 24 MB prüfen.

### GPS liefert keine Position

- Standortberechtigung kontrollieren,
- GPS am Gerät aktivieren,
- freie Sicht zum Himmel herstellen,
- App neu starten,
- Position alternativ manuell im Törn-Paket eingeben.

### Kompass zeigt keinen Wert

- Sensorverfügbarkeit des Geräts prüfen,
- Kompassberechtigung erlauben,
- Gerät kalibrieren,
- Abstand zu Metall und Stromleitungen vergrößern,
- geeigneten Bordkompass verwenden.

### Kein Barometertrend

Es werden mindestens zwei plausible Werte mit ausreichendem Zeitabstand benötigt. Nach dem ersten
Eintrag mindestens 15 Minuten warten; aussagekräftiger sind mehrere Messungen über etwa drei
Stunden.

### Neues Wetterpaket lädt nicht

- Internetverbindung prüfen,
- Koordinaten prüfen,
- Datum und Uhrzeit des Geräts prüfen,
- später erneut versuchen,
- gespeichertes Paket und dessen Alter kontrollieren.

### Keine Wellenwerte

Die Marine-API kann für eine Position keine Daten liefern oder vorübergehend ausfallen. Das
Wetterpaket kann trotzdem Wind- und Wetterwerte enthalten.

### CAP-Import schlägt fehl

- gültige XML-/CAP-Datei verwenden,
- Datei unverändert importieren,
- prüfen, ob mindestens ein CAP-`alert` mit `info` enthalten ist.

### GRIB-Import schlägt fehl

- Signatur und Edition prüfen,
- maximale Größe von 128 MB beachten,
- beschädigte oder unvollständige Datei erneut herunterladen.

### Android blockiert die Installation

- in Android die Installation aus der verwendeten Quelle erlauben,
- ausreichend freien Speicher sicherstellen,
- ZIP zuerst entpacken,
- anschließend die APK öffnen.

### App-Daten vollständig zurücksetzen

Android:

`Einstellungen → Apps → Wolkenlotse → Speicher → Daten löschen`

Dadurch werden Logbuch, Timeline, Wetterpaket, CAP- und GRIB-Daten gelöscht.

---

## 21. Technische Architektur

### 21.1 Technologien

- HTML5
- modernes CSS
- Vanilla JavaScript als ES-Module
- Canvas API für Bildanalyse
- localStorage für strukturierte Kleindaten
- IndexedDB für GRIB-Dateien
- Cache API und Service Worker für die PWA
- Capacitor 8 für Android
- Gradle und Android SDK 36 für den APK-Build

Es wird kein Frontend-Framework benötigt.

### 21.2 Module

| Datei | Aufgabe |
|---|---|
| `js/app.js` | zentrale UI- und Workflow-Orchestrierung |
| `js/analyzer.js` | lokale Pixelmerkmale und Wolkenklassifikation |
| `js/cloud-data.js` | Atlasdaten und Risikokennzeichnungen |
| `js/wizard.js` | manueller Entscheidungsbaum |
| `js/safety-engine.js` | erklärbare Signal-Fusion |
| `js/sky-timeline.js` | Timeline-Speicherung und Trendberechnung |
| `js/instruments.js` | Barometer, Blitz, Peilung, Kreuzwind |
| `js/weather-pack.js` | Wetter-/Marine-Download, CAP und Paketformat |
| `js/grib-archive.js` | GRIB-Validierung und IndexedDB-Ablage |
| `sw.js` | PWA-Offline-Cache |
| `scripts/build-mobile.mjs` | kopiert Webdateien für Capacitor |

### 21.3 Datenfluss der Analyse

```text
Foto
  ↓
lokale Canvas-Verkleinerung
  ↓
Pixelmetriken
  ↓
Wolkenheuristik
  ↓
Bildresultat
  ↓
Sicherheits-Fusion ← Barometer / Blitz / Peilung / Timeline / Modell / CAP
  ↓
Beobachten / Vorbereiten / Handeln + Begründungen + Widersprüche
```

### 21.4 Netzwerk

Direkte Datenabrufe erfolgen ausschließlich über HTTPS:

- `api.open-meteo.com`
- `marine-api.open-meteo.com`

DWD- und BSH-Seiten werden nur als externe Links geöffnet. Es existiert kein eigener
Wolkenlotse-Server.

---

## 22. Qualitätssicherung

### 22.1 Automatisierte JavaScript-Tests

32 Tests prüfen unter anderem:

- Bildmetriken und Klassifikation,
- Druckkontext,
- Barometertrend,
- Blitzformel,
- Kompasswinkel,
- Kreuzwindregel,
- Sicherheits-Fusion,
- Vorrang naher Blitze,
- stehende Peilung,
- amtliche Warnungen,
- Modellpakete,
- Timeline-Trends,
- Paketvalidierung,
- GRIB-Header,
- Wizard-Pfade und Atlasumfang.

### 22.2 Android-Prüfungen

Durchgeführt wurden:

- nativer Android-Build,
- Android-Unit-Test,
- Android Lint ohne Fehler,
- Prüfung des Paketnamens,
- Prüfung der Mindest- und Zielversion,
- Prüfung der Berechtigungen,
- Prüfung der eingebetteten Offline-Dateien,
- Prüfung der APK-v2-Signatur,
- Prüfung der SHA-256-Prüfsumme.

### 22.3 Release-Prüfsumme

APK SHA-256:

`40418b5d210f925e6d329657c64ea9cbf12b67e27c1cac7d6e4e94fa2649b58e`

Die Prüfsumme gilt für `Wolkenlotse-Android-1.0.apk` im Release-Verzeichnis.

---

## 23. Build-Anleitung für Entwickler

### 23.1 Voraussetzungen

- Node.js
- npm
- Python 3 für den einfachen lokalen Webserver
- JDK 21 für Android
- Android SDK Platform 36
- Android Build Tools 36

### 23.2 Abhängigkeiten installieren

```bash
npm install
```

### 23.3 Webversion starten

```bash
npm start
```

Danach:

`http://localhost:4173`

### 23.4 Tests

```bash
npm test
npm run check
```

### 23.5 Android-Web-Bundle

```bash
npm run build:mobile
```

### 23.6 Capacitor synchronisieren

```bash
npm run android:sync
```

### 23.7 Debug-APK bauen

```bash
npm run android:apk
```

Ausgabe:

`android/app/build/outputs/apk/debug/app-debug.apk`

### 23.8 Release-Build

Für einen produktiven Release müssen ein eigener Keystore und eine sichere Signierkonfiguration
erstellt werden. Keystore und Passwörter dürfen nicht in das Repository committed werden.

---

## 24. Glossar

**Arcus**  
Böenwalze oder Regalwolke an der Vorderseite eines Gewittersystems.

**CAPE**  
Modellgröße für potenziell verfügbare konvektive Energie. Ein hoher Wert allein garantiert kein
Gewitter.

**CAP**  
Common Alerting Protocol, standardisiertes Format für Warnmeldungen.

**Cumulonimbus**  
Mächtige Gewitterwolke mit möglichem Amboss, Starkregen, Hagel und schweren Böen.

**GRIB**  
Binärformat für gerasterte meteorologische Vorhersagedaten.

**Heuristik**  
Regelbasiertes Näherungsverfahren. Die Fotoanalyse verwendet keine trainierte künstliche
Intelligenz.

**IndexedDB**  
Lokale Browser-/WebView-Datenbank für größere Dateien wie GRIB.

**PWA**  
Progressive Web App. Eine installierbare Webanwendung mit Offline-Cache.

**Signal-Fusion**  
Gemeinsame Bewertung mehrerer unabhängiger Hinweise.

**Stehende Peilung**  
Peilung auf ein Objekt verändert sich trotz Zeitablauf kaum. Bei einer Zelle kann das auf einen
Annäherungs- oder Kollisionskurs hindeuten.

**Virga**  
Niederschlag, der unter einer Wolke verdunstet, bevor er Wasser oder Land erreicht.

---

## Schlussbemerkung

Der größte Nutzen von Wolkenlotse entsteht nicht durch ein einzelnes Analyseergebnis, sondern
durch wiederholte Beobachtung und den Vergleich unabhängiger Quellen.

Die App soll den Blick nach draußen strukturieren – nicht ersetzen.
