/**
 * Slim replacement for next/dist/build/polyfills/polyfill-module.js.
 * Keep only URL.canParse shim for Safari compatibility.
 */
if (typeof URL !== "undefined" && !("canParse" in URL)) {
  URL.canParse = function canParse(url, base) {
    try {
      return !!new URL(url, base);
    } catch {
      return false;
    }
  };
}
