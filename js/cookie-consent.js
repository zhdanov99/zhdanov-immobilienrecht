(function () {
  "use strict";

  // Minimal cookie/consent-storage manager. This site currently loads no
  // analytics, tracking, or third-party embeds -- the "necessary" category
  // (used only to remember this consent choice) is the only one active
  // today. The gate below (window.ZKConsent) is where any future
  // consent-requiring script would check before loading anything, so
  // adding e.g. analytics later means loading it behind
  // ZKConsent.hasConsent("analytics") instead of unconditionally.

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
