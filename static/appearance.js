// Applies the learner's saved color scheme and accent before the page paints, so a
// dark choice never flashes light. Loaded by src/app.html as a same-origin script
// (the CSP allows no inline scripts). Mirrors parseAppearance() and
// applyAppearance() in src/lib/ui/appearance.ts; appearance.test.ts runs this file
// against them. Stored values are untrusted: only known names are ever applied.
(() => {
  const themes = ['light', 'dark'];
  const accents = ['ai', 'matcha', 'fuji', 'yamabuki'];
  /** @type {unknown} */
  let stored = null;
  try {
    const raw = window.localStorage.getItem('onihayo:appearance');
    if (raw !== null && raw.length <= 200) stored = /** @type {unknown} */ (JSON.parse(raw));
  } catch {
    // Storage is blocked or the value is not JSON: keep the defaults.
  }
  if (typeof stored !== 'object' || stored === null) return;
  /** @type {{ theme?: unknown, accent?: unknown }} */
  const fields = stored;
  const root = document.documentElement;
  if (typeof fields.theme === 'string' && themes.includes(fields.theme)) {
    root.setAttribute('data-theme', fields.theme);
  }
  if (typeof fields.accent === 'string' && accents.includes(fields.accent)) {
    root.setAttribute('data-accent', fields.accent);
  }
})();
