(function () {
  "use strict";

  // The Transable plugin is loaded with data-selector="custom", i.e. headless:
  // it translates the page but draws no floating pill of its own. The control
  // below belongs to this site instead, and it talks to the plugin through the
  // agreed contract — set window.TRANSLATE_LANG, then fire the event. Nothing
  // else needs to be handed over.
  var EVENT_NAME = "transable:languagechange";
  var LANGUAGES_EVENT = "transable:languages";
  var SOURCE_LANG = "de";

  // Which languages appear is decided in the Transable dashboard, not here: the
  // plugin reads the project's enabled languages and hands them over. Adding a
  // language is then one switch in the dashboard, with no change to this site.
  // Until that list arrives, and if it never does, the page keeps the languages
  // below, so the control is never empty and never waits on the network.
  var FALLBACK = [
    { code: "de", label: "DE", title: "Deutsch" },
    { code: "en", label: "EN", title: "English" },
    { code: "pt", label: "PT", title: "Português" },
    { code: "ru", label: "RU", title: "Русский" }
  ];

  // Keys the plugin maintains for itself. We only ever read them: writing would
  // give one piece of state two owners, and the plugin would win anyway.
  var STORAGE_KEY = "webTranslate.targetLanguage";
  var COOKIE_NAME = "transable_lang";

  // The plugin picks the language for the first paint and reveals its choice
  // only after its first response, so our mark can be wrong for a moment right
  // after load. Catch up a few times instead of trusting the first read.
  var SYNC_INTERVAL_MS = 250;
  var SYNC_MAX_TICKS = 20;

  var languages = FALLBACK.slice();
  var current = "";
  var syncTimer = null;
  var root = null;
  var menu = null;
  var trigger = null;

  var knownLang = function (value) {
    if (typeof value !== "string") return "";
    var code = value.trim().toLowerCase();
    for (var i = 0; i < languages.length; i++) {
      if (languages[i].code === code) return code;
    }
    return "";
  };

  var entryFor = function (code) {
    for (var i = 0; i < languages.length; i++) {
      if (languages[i].code === code) return languages[i];
    }
    return null;
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

  // A two-letter code is the closed label; anything longer (pt-BR, zh-Hans)
  // keeps only the part before the dash, so the trigger stays the same width
  // whatever the dashboard adds.
  var labelFor = function (code) {
    return String(code || "").split("-")[0].toUpperCase();
  };

  // The plugin reports every enabled language, the source one included. German
  // is the language this site is written in, so it comes first however the
  // dashboard sorts its list; the rest follow in the order the server sent.
  var adoptLanguages = function (list) {
    if (!list || !list.length) return false;

    var seen = {};
    var next = [];
    var add = function (entry) {
      var code = String(entry && entry.code || "").trim().toLowerCase();
      if (!code || seen[code]) return;
      seen[code] = true;
      next.push({
        code: code,
        label: labelFor(code),
        // The name a speaker of that language recognises. Someone looking for
        // their own language scans the list for "Русский", not for "Russian"
        // spelled out in a language they may not read.
        title: entry.nativeName || entry.name || labelFor(code)
      });
    };

    list.forEach(function (entry) {
      if (String(entry && entry.code || "").toLowerCase() === SOURCE_LANG) add(entry);
    });
    if (!next.length) add({ code: SOURCE_LANG, nativeName: "Deutsch" });
    list.forEach(add);

    if (next.length < 2) return false;
    languages = next;
    return true;
  };

  var closeMenu = function () {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  };

  var openMenu = function () {
    if (!menu || !menu.hidden) return;
    menu.hidden = false;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    var active = menu.querySelector('[aria-selected="true"]') || menu.firstElementChild;
    if (active) active.focus();
  };

  // Always a dropdown, at every language count and every width. Closed, it is
  // one code-width button that never reflows the header; open, it has room for
  // the full name of every language. A row of inline codes only ever fit three
  // or four of them, and a bare code reads as a country rather than a language.
  var build = function (wrap) {
    trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "lang-switch__trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-label", "Sprache wählen / Choose language");
    trigger.innerHTML = '<span class="lang-switch__code"></span><span class="lang-switch__caret" aria-hidden="true"></span>';
    wrap.appendChild(trigger);

    menu = document.createElement("div");
    menu.className = "lang-switch__menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;
    languages.forEach(function (language) {
      var option = document.createElement("button");
      option.type = "button";
      option.className = "lang-switch__item";
      option.setAttribute("role", "option");
      option.setAttribute("data-lang", language.code);
      // Each row is written in its own language, so it needs its own lang
      // attribute: without it a screen reader reads "Русский" by German
      // pronunciation rules and the browser may pick the wrong font.
      option.setAttribute("lang", language.code);
      option.setAttribute("aria-selected", "false");
      option.textContent = language.title;
      option.addEventListener("click", function () {
        select(language.code);
        closeMenu();
        if (trigger) trigger.focus();
      });
      menu.appendChild(option);
    });
    wrap.appendChild(menu);

    trigger.addEventListener("click", function () {
      if (menu.hidden) openMenu(); else closeMenu();
    });
    wrap.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        trigger.focus();
      }
    });
    document.addEventListener("click", function (event) {
      if (!wrap.contains(event.target)) closeMenu();
    });
  };

  // Rebuilt rather than patched when the dashboard's list arrives, so the
  // control and the current language can never disagree about what is in it.
  var render = function () {
    if (!root) return;
    var wasFocused = root.contains(document.activeElement);
    menu = null;
    trigger = null;
    root.textContent = "";
    build(root);
    mark(current);
    if (wasFocused && trigger) trigger.focus();
  };

  var mark = function (code) {
    if (!root || !code) return;
    Array.prototype.forEach.call(root.querySelectorAll("[data-lang]"), function (option) {
      var isActive = option.getAttribute("data-lang") === code;
      option.classList.toggle("is-active", isActive);
      option.setAttribute("aria-selected", String(isActive));
    });
    var label = root.querySelector(".lang-switch__code");
    var entry = entryFor(code);
    if (label && entry) {
      // Closed, the control says only the code: two letters are the widest the
      // header can give it, and the full name is one click away.
      label.textContent = entry.label;
      if (trigger) trigger.title = entry.title;
    }
  };

  var apply = function (code) {
    var next = knownLang(code);
    if (!next || next === current) return;
    current = next;
    mark(current);
    // Assistive technology and the browser's own translation prompt both read
    // the page language off this attribute, so it has to follow along.
    document.documentElement.lang = current;
  };

  var stopSync = function () {
    if (syncTimer === null) return;
    window.clearInterval(syncTimer);
    syncTimer = null;
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
    apply(next);
  };

  // The legal pages carry nothing but the logo in the header, so they ship no
  // markup for the switch and we build it here. Where there is a burger, stay
  // to its left; otherwise the switch is the last child and the stylesheet
  // pushes it to the right edge on its own.
  var mountSwitch = function () {
    var headerInner = document.querySelector(".header-inner");
    if (!headerInner) return null;

    var wrap = document.createElement("div");
    wrap.className = "lang-switch";
    wrap.setAttribute("data-lang-switch", "");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Sprache / Language");
    // Without this the plugin would translate the language names themselves.
    wrap.setAttribute("data-translate-ignore", "");

    var navToggle = headerInner.querySelector(".nav-toggle");
    if (navToggle) headerInner.insertBefore(wrap, navToggle);
    else headerInner.appendChild(wrap);
    return wrap;
  };

  root = document.querySelector("[data-lang-switch]") || mountSwitch();
  if (!root) return;
  root.setAttribute("data-translate-ignore", "");

  current = readStoredLang();
  render();
  document.documentElement.lang = current;

  // The dashboard's list, whenever it arrives: before this script ran (the
  // property), or after it (the event).
  var onLanguages = function (detail) {
    if (!detail || !adoptLanguages(detail.languages)) return;
    if (!knownLang(current)) current = SOURCE_LANG;
    render();
  };
  if (window.Transable && window.Transable.languages) onLanguages(window.Transable);
  window.addEventListener(LANGUAGES_EVENT, function (event) { onLanguages(event.detail); });

  // The plugin announces language changes of its own with the same event. That
  // is also how a first-time visitor's browser language arrives: the project
  // has auto-detect on, so a Russian browser lands on Russian and the trigger
  // has to catch up from DE.
  window.addEventListener(EVENT_NAME, function () {
    apply(knownLang(window.TRANSLATE_LANG) || readStoredLang());
  });

  var ticks = 0;
  syncTimer = window.setInterval(function () {
    ticks++;
    if (ticks >= SYNC_MAX_TICKS) stopSync();
    apply(readStoredLang());
  }, SYNC_INTERVAL_MS);
})();
