/**
 * Runs before the first paint (a `beforeInteractive` script in the root
 * layout) and applies the stored theme choice to `<html>`, so a page a user
 * set to dark never flashes light while React loads. The same key and the
 * same two values as `ThemeSwitcher`; a stored value that is neither is
 * ignored, which is what `system` means.
 *
 * Plain JavaScript in a string, because it runs before any module does.
 */
export const THEME_SCRIPT = `(function () {
  try {
    var choice = window.localStorage.getItem('pp-theme');
    if (choice === 'light' || choice === 'dark') {
      document.documentElement.setAttribute('data-pp-theme', choice);
    }
  } catch (error) {}
})();`;
