# Wolkenlotse

Eine mobile Offline-Web-App für Segler, die Wolkenfotos direkt auf dem Gerät grob einordnet.

## Funktionen

- Fotoaufnahme oder Auswahl aus der Galerie
- Lokale, heuristische Auswertung von Wolkendecke, Kontrast, Struktur und Helligkeit
- Segelbezogene Beobachtungshinweise
- Offline-Wolkenführer mit sieben Wolkentypen
- Lokales Bordlogbuch ohne Server oder Benutzerkonto
- Installierbar als Progressive Web App (PWA)

Die App lädt keine Fotos hoch. Die Auswertung ist eine Orientierungshilfe und ersetzt weder
Seewetterbericht noch Barometer, Ausguck oder gute Seemannschaft.

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
