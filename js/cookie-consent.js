(function () {
  "use strict";

  // Minimal cookie/consent-storage manager. Only the "necessary" category is
  // active today, and it covers exactly two things: this consent choice and the
  // visitor's chosen language.
  //
  // The translation widget does load before this banner is answered, on purpose:
  // it draws the language switcher and restores an already chosen language, so a
  // visitor who picked English last week would otherwise be shown German until
  // they clicked something. It is loaded with data-visitor-analytics="off", so it
  // keeps no identifier in the browser and sends none -- what is left is a
  // request that translates the page the visitor asked for, which is why it does
  // not need consent under TDDDG s 25(2)(2). Turn that flag back on and this
  // stops being true: the widget would then store a persistent id, and the load
  // would have to move behind ZKConsent.hasConsent(...).
  //
  // The gate below (window.ZKConsent) is where any future consent-requiring
  // script checks before loading anything, so adding e.g. analytics later means
  // loading it behind ZKConsent.hasConsent("analytics") instead of
  // unconditionally.

  var STORAGE_KEY = "zk_cookie_consent";
  var CONSENT_VERSION = 1;

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== CONSENT_VERSION) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeConsent(consent) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch (e) {
      // localStorage unavailable (private mode, disabled storage, quota) --
      // the choice still applies for this page view, it just won't persist.
    }
    window.dispatchEvent(new CustomEvent("zk:consent-updated", { detail: consent }));
  }

  function buildConsent(choice) {
    return {
      version: CONSENT_VERSION,
      necessary: true,
      analytics: false,
      externalMedia: false,
      choice: choice,
      decidedAt: new Date().toISOString()
    };
  }

  window.ZKConsent = {
    get: readConsent,
    hasConsent: function (category) {
      var consent = readConsent();
      return !!(consent && consent[category]);
    },
    set: writeConsent
  };

  document.addEventListener("DOMContentLoaded", function () {
    var banner = document.getElementById("cookie-banner");
    if (!banner) return;

    var actionsPanel = document.getElementById("cookie-banner-actions");
    var settingsPanel = document.getElementById("cookie-banner-settings");
    var acceptAllBtn = document.getElementById("cookie-accept-all");
    var necessaryOnlyBtn = document.getElementById("cookie-accept-necessary");
    var openSettingsBtn = document.getElementById("cookie-open-settings");
    var saveSettingsBtn = document.getElementById("cookie-save-settings");
    var reopenLink = document.getElementById("footer-cookie-settings");

    function showBanner(openSettings) {
      banner.hidden = false;
      actionsPanel.hidden = !!openSettings;
      settingsPanel.hidden = !openSettings;
      if (openSettings) {
        saveSettingsBtn.focus();
      }
    }

    function hideBanner() {
      banner.hidden = true;
    }

    function decide(choice) {
      writeConsent(buildConsent(choice));
      hideBanner();
    }

    acceptAllBtn.addEventListener("click", function () { decide("all"); });
    necessaryOnlyBtn.addEventListener("click", function () { decide("necessary"); });
    saveSettingsBtn.addEventListener("click", function () { decide("custom"); });

    openSettingsBtn.addEventListener("click", function () {
      actionsPanel.hidden = true;
      settingsPanel.hidden = false;
      saveSettingsBtn.focus();
    });

    if (reopenLink) {
      reopenLink.addEventListener("click", function () {
        showBanner(true);
      });
    }

    if (!readConsent()) {
      showBanner(false);
    }
  });
})();
