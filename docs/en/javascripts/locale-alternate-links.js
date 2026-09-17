(function () {
  // Derives the site's base path from the current URL instead of hardcoding
  // the repo name, so language links work on any fork/org/custom domain,
  // whether the site is served at the domain root or under a subpath
  // (e.g. "/rer-dsp-docs/pt-br/..." -> "/rer-dsp-docs", "/pt-br/..." -> "").
  function currentBasePath() {
    var match = location.pathname.match(/^(.*)\/(pt-br|en)(\/|$)/);
    return match ? match[1] : "";
  }

  function fixLocaleHref(element, prefix) {
    var href = element.getAttribute("href");
    if (!href || href.indexOf("://") !== -1) {
      return;
    }
    if (
      href.indexOf(prefix + "/pt-br/") === 0 ||
      href.indexOf(prefix + "/en/") === 0
    ) {
      return;
    }
    if (
      href === "/pt-br/" ||
      href === "/en/" ||
      href.indexOf("/pt-br/") === 0 ||
      href.indexOf("/en/") === 0
    ) {
      element.setAttribute("href", prefix + href);
    }
  }

  function adjustLocaleLinks() {
    var prefix = currentBasePath();
    if (!prefix) {
      return;
    }
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach(function (el) {
        fixLocaleHref(el, prefix);
      });
    document.querySelectorAll("a.md-select__link").forEach(function (el) {
      fixLocaleHref(el, prefix);
    });
  }

  // The theme itself re-resolves the language switcher's relative "href"
  // (e.g. "/en/") against the current origin at runtime, which drops any
  // subpath the site is served under (e.g. a GitHub Pages project page).
  // Fixing the attribute alone is therefore not reliable, so we also
  // intercept the click and recompute the intended destination from
  // scratch, using whichever locale segment the link still points to.
  function onLocaleLinkClick(event) {
    var el = event.target.closest && event.target.closest("a.md-select__link");
    if (!el) {
      return;
    }
    var href = el.getAttribute("href") || "";
    var localeMatch = href.match(/\/(pt-br|en)\/?(?:$|\?|#)/);
    if (!localeMatch) {
      return;
    }
    var prefix = currentBasePath();
    var target = prefix + "/" + localeMatch[1] + "/";
    if (location.pathname === target) {
      return;
    }
    // stopImmediatePropagation is required: the theme's own click handler
    // (bound in the bubble phase) re-resolves the original, unprefixed
    // href and would otherwise overwrite this navigation right after it.
    event.preventDefault();
    event.stopImmediatePropagation();
    location.href = target;
  }

  document.addEventListener("click", onLocaleLinkClick, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", adjustLocaleLinks);
  } else {
    adjustLocaleLinks();
  }
})();
