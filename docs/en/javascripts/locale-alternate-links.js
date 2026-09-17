(function () {
  function githubPagesPrefix() {
    var host = location.hostname;
    if (host !== "github.io" && !host.endsWith(".github.io")) {
      return "";
    }
    if (location.pathname.indexOf("/rer-dsp-docs/") === -1) {
      return "";
    }
    return "/rer-dsp-docs";
  }

  function fixLocaleHref(element, prefix) {
    var href = element.getAttribute("href");
    if (!href || href.indexOf("://") !== -1) {
      return;
    }
    if (prefix && href.indexOf("/rer-dsp-docs/") === 0) {
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
    var prefix = githubPagesPrefix();
    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach(function (el) {
        fixLocaleHref(el, prefix);
      });
    document.querySelectorAll("a.md-select__link").forEach(function (el) {
      fixLocaleHref(el, prefix);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", adjustLocaleLinks);
  } else {
    adjustLocaleLinks();
  }
})();
