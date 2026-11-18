// Pre-paint theme + typography. Runs synchronously in <head> to avoid a flash
// of the wrong theme / typeface. Mirrors blank.page's own boot script.
(function () {
  "use strict";
  var settings = {};
  try { settings = JSON.parse(window.localStorage.getItem("settings") || "{}") || {}; } catch (e) {}

  var theme = settings.theme || "system";
  var resolvedTheme = theme;
  if (theme === "system") {
    resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  var typefaceTypography = {
    sans:  { fontFamily: '"IBM Plex Sans", system-ui, sans-serif', lineHeight: "1.65", letterSpacing: "0.005em", wordSpacing: "0",    contentHalfWidth: "34ch" },
    serif: { fontFamily: '"Lora", serif',                            lineHeight: "1.7",  letterSpacing: "0",     wordSpacing: "0",    contentHalfWidth: "33ch" },
    mono:  { fontFamily: "Cousine, monospace",                        lineHeight: "1.8",  letterSpacing: "0",     wordSpacing: "0",    contentHalfWidth: "35ch" }
  };
  var typeface = typefaceTypography[settings.typeface] ? settings.typeface : "sans";
  var typo = typefaceTypography[typeface];
  var textScale = (typeof settings.textScale === "number" && settings.textScale >= 16.5 / 18 && settings.textScale <= 19.5 / 18) ? settings.textScale : 1;

  var el = document.documentElement;
  el.style.setProperty("--font-editor", typo.fontFamily);
  el.style.setProperty("--content-half-width", typo.contentHalfWidth);
  el.style.setProperty("--font-editor-lh", typo.lineHeight);
  el.style.setProperty("--font-editor-ls", typo.letterSpacing);
  el.style.setProperty("--font-editor-ws", typo.wordSpacing);
  el.style.setProperty("--font-editor-scale", String(textScale));
  if (resolvedTheme === "dark") el.classList.add("dark");
})();
