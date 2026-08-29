# Website Zhdanov Kanzlei – Rechtsanwaltskanzlei für Immobilienrecht

Statische Landingpage (HTML/CSS/JS, keine Build-Tools, kein Backend nötig).

## Struktur

- `index.html` – Startseite (Hero, Leistungen, Über uns / Über den Gründer, Warum diese Kanzlei, Kontakt)
- `impressum.html` – Impressum
- `datenschutz.html` – Datenschutzerklärung
- `css/styles.css` – Styles
- `js/script.js` – Mobiles Menü, Kontaktformular
- `img/` – Fotos für den Bereich "Über uns" (siehe unten)

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
`impressum.html` und `datenschutz.html` enthalten Platzhalter, die aus
rechtlichen Gründen durch die tatsächlichen Angaben ersetzt werden müssen:

- USt-IdNr. (falls vorhanden)
- Zuständige Rechtsanwaltskammer (Adresse bitte bestätigen)
- Angaben zur Berufshaftpflichtversicherung (gesetzlich vorgeschrieben, § 51 BRAO)
- Hosting-Provider in der Datenschutzerklärung, sobald das Hosting feststeht

## Fotos im Bereich "Über uns"

Im Abschnitt "Über uns" (`index.html`, `.about-block`) stehen aktuell zwei
gestaltete Platzhalter anstelle echter Fotos:

- Ein Icon-Panel für die Kanzlei/das Büro
- Ein Kreis mit den Initialen "MZ" für Rechtsanwalt Michael Zhdanov

Um die tatsächlichen Fotos einzusetzen, die entsprechenden Bilddateien nach
`img/` legen und im Markup ersetzen:

```html
<!-- Kanzlei-Foto: ersetzt das Icon-Panel -->
<div class="about-photo">
  <img src="img/zhdanov-kanzlei.jpg" alt="Empfang der Zhdanov Kanzlei am Kurfürstendamm">
</div>

<!-- Porträt Michael Zhdanov: ersetzt "MZ" -->
<div class="about-portrait">
  <img src="img/michael-zhdanov.jpg" alt="Porträt von Rechtsanwalt Michael Zhdanov">
</div>
```

## Kontaktformular

Das Formular verwendet bewusst keinen Server: Beim Absenden öffnet es einen
`mailto:`-Link mit vorausgefüllter Nachricht im E-Mail-Programm des
Besuchers. Für eine serverseitige Zustellung (z. B. über einen Formular-Dienst
wie Formspree oder ein eigenes Backend) müsste `js/script.js` entsprechend
angepasst werden.
