# Website Michael Zhdanov – Rechtsanwalt für Immobilienrecht

Statische Landingpage (HTML/CSS/JS, keine Build-Tools, kein Backend nötig).

## Struktur

- `index.html` – Startseite (Hero, Leistungen, Über mich, Ablauf, Kontakt)
- `impressum.html` – Impressum
- `datenschutz.html` – Datenschutzerklärung
- `css/styles.css` – Styles
- `js/script.js` – Mobiles Menü, Kontaktformular

## Lokal ansehen

Da keine externen Abhängigkeiten verwendet werden, reicht ein einfacher lokaler Server:

```bash
python3 -m http.server 8000
```

Danach im Browser `http://localhost:8000` öffnen.

## Deployment

Die Seite besteht nur aus statischen Dateien und kann direkt auf jedem
Webspace, GitHub Pages, Netlify oder Vercel gehostet werden – einfach den
gesamten Ordner hochladen.

## Vor dem Livegang bitte noch ergänzen

Im Text mit <span class="placeholder">gelb markierte</span> Stellen in
`impressum.html`, `datenschutz.html` und `js/script.js` (Variable
`KANZLEI_EMAIL`) enthalten Platzhalter, die aus rechtlichen Gründen durch
die tatsächlichen Angaben ersetzt werden müssen:

- Tatsächliche Kanzlei-E-Mail-Adresse (aktuell: `kanzlei@zhdanov-immobilienrecht.de`)
- USt-IdNr. (falls vorhanden)
- Zuständige Rechtsanwaltskammer (Adresse bitte bestätigen)
- Angaben zur Berufshaftpflichtversicherung (gesetzlich vorgeschrieben, § 51 BRAO)
- Hosting-Provider in der Datenschutzerklärung, sobald das Hosting feststeht

## Kontaktformular

Das Formular verwendet bewusst keinen Server: Beim Absenden öffnet es einen
`mailto:`-Link mit vorausgefüllter Nachricht im E-Mail-Programm des
Besuchers. Für eine serverseitige Zustellung (z. B. über einen Formular-Dienst
wie Formspree oder ein eigenes Backend) müsste `js/script.js` entsprechend
angepasst werden.
