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

  // Contact form: submitted server-side via FormSubmit (formsubmit.co), a
  // form-to-email relay — no backend of our own needed on static hosting.
  // FormSubmit requires the receiving address to be activated once: the
  // first-ever submission triggers a confirmation email to KANZLEI_EMAIL
  // that must be clicked before delivery starts working.
  var form = document.getElementById("kontakt-form");
  var note = document.getElementById("form-note");
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  var KANZLEI_EMAIL = "mz@zhdanov-kanzlei.de";
  var FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/" + KANZLEI_EMAIL;

  if (form && note) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var telefon = form.telefon.value.trim();
      var rechtsgebiet = form.rechtsgebiet.value;
      var nachricht = form.nachricht.value.trim();
      var datenschutz = form.datenschutz.checked;

      if (!name || !email || !rechtsgebiet || !nachricht || !datenschutz) {
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
      note.textContent = "Ihre Nachricht wird gesendet …";
      if (submitBtn) submitBtn.disabled = true;

      fetch(FORMSUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          Name: name,
          "E-Mail": email,
          Telefon: telefon || "-",
          Themenbereich: rechtsgebiet,
          Nachricht: nachricht,
          _subject: "Anfrage über die Website: " + rechtsgebiet,
          _template: "table"
        })
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Request failed");
          note.classList.remove("error");
          note.textContent = "Vielen Dank! Ihre Nachricht wurde gesendet. Wir melden uns zeitnah bei Ihnen.";
          form.reset();
        })
        .catch(function () {
          note.textContent =
            "Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder " +
            "kontaktieren Sie uns telefonisch unter +49 30 70012509 oder per E-Mail an " + KANZLEI_EMAIL + ".";
          note.classList.add("error");
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
