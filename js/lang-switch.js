(function () {
  "use strict";

  // The Transable plugin is loaded with data-selector="custom", i.e. headless:
  // it translates the page but draws no floating pill of its own. The control
  // below belongs to this site instead, and it talks to the plugin through the
  // agreed contract — set window.TRANSLATE_LANG, then fire the event. Nothing
  // else needs to be handed over.
  var EVENT_NAME = "transable:languagechange";
  var SOURCE_LANG = "de";
  var LANGUAGES = [
    { code: "de", label: "DE", title: "Deutsch" },
    { code: "en", label: "EN", title: "English" },
    { code: "pt", label: "PT", title: "Português" }
  ];

  // Keys the plugin maintains for itself. We only ever read them: writing would
  // give one piece of state two owners, and the plugin would win anyway.
  var STORAGE_KEY = "webTranslate.targetLanguage";
  var COOKIE_NAME = "transable_lang";

  // The translation runtime handles visible text, but browser metadata and
  // accessibility attributes need a stable source of truth when visitors
  // switch directly from one target language to another. Otherwise an English
  // alt/title can survive an EN -> PT switch because the German source value is
  // no longer present in the DOM.
  var PAGE_TITLES = {
    "index.html": {
      de: "Zhdanov Kanzlei | Rechtsanwaltskanzlei für Immobilienrecht Berlin",
      en: "Zhdanov Kanzlei | Real estate law firm in Berlin",
      pt: "Zhdanov Kanzlei | Escritório de advocacia de direito imobiliário em Berlim"
    },
    "impressum.html": {
      de: "Impressum | Zhdanov Kanzlei",
      en: "Legal notice | Zhdanov Kanzlei",
      pt: "Aviso legal | Zhdanov Kanzlei"
    },
    "datenschutz.html": {
      de: "Datenschutzerklärung | Zhdanov Kanzlei",
      en: "Privacy Policy | Zhdanov Kanzlei",
      pt: "Política de Privacidade | Zhdanov Kanzlei"
    }
  };

  var IMAGE_ALTS = [
    {
      selector: 'img[src$="hero-reichstag.jpg"]',
      de: "Reichstagsgebäude und Paul-Löbe-Haus an der Spree in Berlin",
      en: "Reichstag Building and Paul Löbe House by the River Spree in Berlin",
      pt: "Edifício do Reichstag e Paul-Löbe-Haus junto ao rio Spree, em Berlim"
    },
    {
      selector: 'img[src$="logo-zhdanov-kanzlei.png"]',
      de: "Zhdanov Kanzlei – Recht. Vertrauen. Lösung.",
      en: "Zhdanov Kanzlei – Law. Trust. Solutions.",
      pt: "Zhdanov Kanzlei – Direito. Confiança. Soluções."
    },
    {
      selector: 'img[src$="kanzlei-empfang.jpg"]',
      de: "Empfang in den Räumen der Zhdanov Kanzlei am Kurfürstendamm in Berlin",
      en: "Reception area at Zhdanov Kanzlei on Kurfürstendamm in Berlin",
      pt: "Receção da Zhdanov Kanzlei na Kurfürstendamm, em Berlim"
    },
    {
      selector: 'img[src$="michael-zhdanov.jpg"]',
      de: "Porträt von Rechtsanwalt Michael Zhdanov",
      en: "Portrait of attorney Michael Zhdanov",
      pt: "Retrato do advogado Michael Zhdanov"
    },
    {
      selector: 'img[src$="kanzlei-besprechungsraum.jpg"]',
      de: "Besprechungsraum der Zhdanov Kanzlei",
      en: "Meeting room at Zhdanov Kanzlei",
      pt: "Sala de reuniões da Zhdanov Kanzlei"
    }
  ];

  var STAR_LABELS = {
    de: "5 von 5 Sternen",
    en: "5 out of 5 stars",
    pt: "5 de 5 estrelas"
  };

  var SWITCH_LABELS = {
    de: "Sprache",
    en: "Language",
    pt: "Idioma"
  };

  // The plugin picks the language for the first paint and reveals its choice
  // only after its first response, so our mark can be wrong for a moment right
  // after load. Catch up a few times instead of trusting the first read.
  var SYNC_INTERVAL_MS = 250;
  var SYNC_MAX_TICKS = 20;

  var knownLang = function (value) {
    if (typeof value !== "string") return "";
    var code = value.trim().toLowerCase();
    for (var i = 0; i < LANGUAGES.length; i++) {
      if (LANGUAGES[i].code === code) return code;
    }
    return "";
  };

  // localStorage throws outright in a private window, and a locked-down cookie
  // setup can make document.cookie unhappy too, so neither read may escape and
  // take the whole switch down with it.
  var readStoredLang = function () {
    try {
      var fromStorage = knownLang(window.localStorage.getItem(STORAGE_KEY));
      if (fromStorage) return fromStorage;
    } catch (err) {
      // Storage unavailable — fall through to the cookie.
    }

    try {
      var match = document.cookie.match(new RegExp("(?:^|;\\s*)" + COOKIE_NAME + "=([^;]*)"));
      var fromCookie = match ? knownLang(decodeURIComponent(match[1])) : "";
      if (fromCookie) return fromCookie;
    } catch (err) {
      // Cookies unavailable — fall through to the source language.
    }

    return SOURCE_LANG;
  };

  var buildSwitch = function () {
    var wrap = document.createElement("div");
    wrap.className = "lang-switch";
    wrap.setAttribute("data-lang-switch", "");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Sprache / Language");
    // Without this the plugin would translate the DE/EN/PT labels themselves.
    wrap.setAttribute("data-translate-ignore", "");

    LANGUAGES.forEach(function (language) {
      var option = document.createElement("button");
      option.type = "button";
      option.className = "lang-switch__option";
      option.setAttribute("data-lang", language.code);
      option.setAttribute("lang", language.code);
      option.title = language.title;
      option.textContent = language.label;
      wrap.appendChild(option);
    });

    return wrap;
  };

  // The legal pages carry nothing but the logo in the header, so they ship no
  // markup for the switch and we build it here. Where there is a burger, stay
  // to its left; otherwise the switch is the last child and the stylesheet
  // pushes it to the right edge on its own.
  var mountSwitch = function () {
    var headerInner = document.querySelector(".header-inner");
    if (!headerInner) return null;

    var wrap = buildSwitch();
    var navToggle = headerInner.querySelector(".nav-toggle");
    if (navToggle) {
      headerInner.insertBefore(wrap, navToggle);
    } else {
      headerInner.appendChild(wrap);
    }
    return wrap;
  };

  var root = document.querySelector("[data-lang-switch]") || mountSwitch();
  if (!root) return;

  var options = root.querySelectorAll("[data-lang]");
  var current = "";
  var syncTimer = null;
  var metadataTimers = [];

  var stopSync = function () {
    if (syncTimer === null) return;
    window.clearInterval(syncTimer);
    syncTimer = null;
  };

  var localizeMetadata = function (code) {
    var path = window.location.pathname.split("/").pop() || "index.html";
    var titles = PAGE_TITLES[path];
    if (titles && titles[code]) document.title = titles[code];

    root.setAttribute("aria-label", SWITCH_LABELS[code] || SWITCH_LABELS.de);

    IMAGE_ALTS.forEach(function (entry) {
      var image = document.querySelector(entry.selector);
      if (image && entry[code]) image.setAttribute("alt", entry[code]);
    });

    document.querySelectorAll(".review-stars").forEach(function (stars) {
      stars.setAttribute("aria-label", STAR_LABELS[code] || STAR_LABELS.de);
    });
  };

  var scheduleMetadataSync = function (code) {
    metadataTimers.forEach(function (timer) {
      window.clearTimeout(timer);
    });
    metadataTimers = [0, 100, 400, 1200].map(function (delay) {
      return window.setTimeout(function () {
        if (current === code) localizeMetadata(code);
      }, delay);
    });
  };

  var render = function (code) {
    var next = knownLang(code);
    if (!next) return;
    var changed = next !== current;
    current = next;

    if (changed) {
      options.forEach(function (option) {
        var isActive = option.getAttribute("data-lang") === current;
        option.classList.toggle("is-active", isActive);
        option.setAttribute("aria-pressed", String(isActive));
      });
    }

    // Assistive technology and the browser's own translation prompt both read
    // the page language off this attribute, so it has to follow along.
    document.documentElement.lang = current;
    scheduleMetadataSync(current);
  };

  var select = function (code) {
    var next = knownLang(code);
    if (!next || next === current) return;

    // A deliberate click settles the question: the plugin writes its storage
    // key a little later, and until then the catch-up poll below would read the
    // previous language and undo the visitor's choice.
    stopSync();

    window.TRANSLATE_LANG = next;
    window.dispatchEvent(new Event(EVENT_NAME));
    render(next);
  };

  options.forEach(function (option) {
    option.addEventListener("click", function () {
      select(option.getAttribute("data-lang"));
    });
  });

  render(readStoredLang());

  // The plugin announces language changes of its own with the same event.
  window.addEventListener(EVENT_NAME, function () {
    render(knownLang(window.TRANSLATE_LANG) || readStoredLang());
  });

  var ticks = 0;
  syncTimer = window.setInterval(function () {
    ticks++;
    if (ticks >= SYNC_MAX_TICKS) stopSync();
    render(readStoredLang());
  }, SYNC_INTERVAL_MS);
})();
