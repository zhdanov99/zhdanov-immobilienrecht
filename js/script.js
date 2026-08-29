(function () {
  "use strict";

  // Footer year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Sticky header shadow on scroll
  var header = document.getElementById("site-header");
  if (header) {
    var updateHeaderShadow = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeaderShadow();
    window.addEventListener("scroll", updateHeaderShadow, { passive: true });
  }

  // Mobile navigation toggle
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Contact form: no server-side submission by design (static hosting, no backend).
  // Validates the fields client-side, then falls back to a pre-filled mailto: link.
  // To wire this up to a real backend later (e.g. Formspree or a custom endpoint),
  // replace the mailto redirect below with a fetch() POST to that service.
  var form = document.getElementById("kontakt-form");
  var note = document.getElementById("form-note");
  var KANZLEI_EMAIL = "mz@zhdanov-kanzlei.de";

  if (form && note) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var telefon = form.telefon.value.trim();
      var rechtsgebiet = form.rechtsgebiet.value;
      var nachricht = form.nachricht.value.trim();
      var datenschutz = form.datenschutz.checked;

      if (!name || !email || !nachricht || !datenschutz) {
        note.textContent = "Bitte füllen Sie alle Pflichtfelder aus und bestätigen Sie die Datenschutzerklärung.";
        note.classList.add("error");
        return;
      }

      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        note.textContent = "Bitte geben Sie eine gültige E-Mail-Adresse ein.";
        note.classList.add("error");
        return;
      }

      note.classList.remove("error");
      note.textContent = "Ihr E-Mail-Programm wird geöffnet …";

      var subject = "Anfrage über die Website: " + rechtsgebiet;
      var bodyLines = [
        "Name: " + name,
        "E-Mail: " + email,
        "Telefon: " + (telefon || "-"),
        "Rechtsgebiet: " + rechtsgebiet,
        "",
        "Nachricht:",
        nachricht
      ];
      var mailtoUrl =
        "mailto:" + KANZLEI_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailtoUrl;
      form.reset();
    });
  }
})();
