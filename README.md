# Wolkenlotse

Eine mobile Offline-Web-App für Segler, die Wolkenfotos direkt auf dem Gerät grob einordnet.

## Funktionen

- Fotoaufnahme oder Auswahl aus der Galerie
- Lokale, heuristische Auswertung von Wolkendecke, Kontrast, Struktur und Helligkeit
- Geführte manuelle Bestimmung in zwei bis drei Schritten
- Segelbezogene Beobachtungshinweise
- Offline-Atlas mit zehn WMO-Wolkengattungen und vier Sonderformen
- Warnsequenzen für Warmfronten, Squall-Linien und Gewitter
- GPS, Barometertrend, Blitz-Distanz, Zellen-Peilung und Kreuzwind-Check
- Himmel-Timeline mit wiederholten Aufnahmen, Trendberechnung und Erinnerungsfunktion
- Erklärbare Signal-Fusion mit Quellen, Widersprüchen und priorisierten Maßnahmen
- Offline-Törn-Pakete mit Wind-, Böen-, Sicht- und Wellenmodell für bis zu sieben Tage
- Import amtlicher DWD-CAP-Warnmeldungen sowie Paketexport für andere Geräte
- Validierte Offline-Ablage unveränderter GRIB1-/GRIB2-Rohdateien in IndexedDB
- Lokales Bordlogbuch ohne Server oder Benutzerkonto
- Installierbar als Progressive Web App (PWA)

Die App lädt keine Fotos hoch. Die Auswertung ist eine Orientierungshilfe und ersetzt weder
Seewetterbericht noch Barometer, Ausguck oder gute Seemannschaft.

Eine direkte KI-Anbindung mit einem im Browser gespeicherten API-Schlüssel ist bewusst nicht
enthalten. Für eine spätere Online-Detailanalyse sollte ein authentifizierter Server-Endpunkt den
Anbieter-Schlüssel schützen.

Die automatisch geladenen Vorhersagewerte stammen aus ergänzenden Open-Meteo-Modellen und sind
nicht amtlich. Amtliche Warnungen werden getrennt als CAP-Datei importiert und in der Oberfläche
eindeutig als solche gekennzeichnet.

GRIB-Dateien werden derzeit sicher archiviert und wieder exportiert, aber noch nicht kartografisch
interpretiert. Dafür wird bewusst erst ein gegen Referenzdaten validierter Decoder integriert.

## Lokal starten

```bash
npm start
```

Danach `http://localhost:4173` öffnen. Für Kamera- und PWA-Funktionen ist ein sicherer Kontext
(`https` oder `localhost`) erforderlich.

## Prüfen

```bash
npm test
npm run check
```
