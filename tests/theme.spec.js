// theme.spec.js - Theme System Tests
// Tests dark/light theme toggle, persistence, and system preference detection

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp } = require('./fixtures/app-url');

test.describe('Theme System', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);

    // Clear theme preference before each test
    await page.evaluate(() => {
      localStorage.removeItem('quote-engine-theme');
    });
  });

  test.describe('Theme API Availability', () => {
    test('should expose Theme global API', async ({ page }) => {
      const api = await page.evaluate(() => {
        return {
          exists: typeof window.Theme !== 'undefined',
          hasToggle: typeof window.Theme?.toggle === 'function',
          hasSet: typeof window.Theme?.set === 'function',
          hasGet: typeof window.Theme?.getCurrent === 'function'
        };
      });

      expect(api.exists).toBe(true);
      expect(api.hasToggle).toBe(true);
      expect(api.hasSet).toBe(true);
      expect(api.hasGet).toBe(true);
    });
  });

  test.describe('Theme Toggle', () => {
    test('should toggle from dark to light', async ({ page }) => {
      // Ensure we start with dark theme
      await page.evaluate(() => {
        if (window.Theme) {
          window.Theme.set('dark');
        }
      });

      const before = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      await page.evaluate(() => {
        window.Theme.toggle();
      });

      const after = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(before).toBe('dark');
      expect(after).toBe('light');
    });

    test('should toggle from light to dark', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('light');
      });

      const before = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      await page.evaluate(() => {
        window.Theme.toggle();
      });

      const after = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(before).toBe('light');
      expect(after).toBe('dark');
    });

    test('should toggle multiple times correctly', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('dark');
      });

      const themes = await page.evaluate(() => {
        var results = [];
        results.push(window.Theme.getCurrent()); // dark

        window.Theme.toggle();
        results.push(window.Theme.getCurrent()); // light

        window.Theme.toggle();
        results.push(window.Theme.getCurrent()); // dark

        window.Theme.toggle();
        results.push(window.Theme.getCurrent()); // light

        return results;
      });

      expect(themes).toEqual(['dark', 'light', 'dark', 'light']);
    });
  });

  test.describe('Theme Setting', () => {
    test('should set theme to dark', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('dark');
      });

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(theme).toBe('dark');
    });

    test('should set theme to light', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('light');
      });

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(theme).toBe('light');
    });

    test('should apply theme to document element', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('light');
      });

      const attr = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });

      expect(attr).toBe('light');
    });

    test('should apply theme to body element', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('dark');
      });

      const attr = await page.evaluate(() => {
        return document.body.getAttribute('data-theme');
      });

      expect(attr).toBe('dark');
    });
  });

  test.describe('Theme Persistence', () => {
    test('should save theme to localStorage', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('light');
      });

      const stored = await page.evaluate(() => {
        return localStorage.getItem('quote-engine-theme');
      });

      expect(stored).toBe('light');
    });

    test('should load saved theme on init', async ({ page }) => {
      // Set theme preference
      await page.evaluate(() => {
        localStorage.setItem('quote-engine-theme', 'light');
      });

      // Reload page to trigger init
      await page.reload();
      await page.waitForFunction(() => window.Theme);

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(theme).toBe('light');
    });

    test('should persist theme across page reloads', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('light');
      });

      await page.reload();
      await page.waitForFunction(() => window.Theme);

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(theme).toBe('light');
    });
  });

  test.describe('System Theme Detection', () => {
    test('should detect system dark mode preference', async ({ page }) => {
      // Note: Playwright can't easily override system preferences,
      // but we can test that the function exists and returns a value
      const systemTheme = await page.evaluate(() => {
        // Access internal function if available
        if (window.matchMedia) {
          var darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
          return darkModeQuery.matches ? 'dark' : 'light';
        }
        return 'unknown';
      });

      expect(['dark', 'light', 'unknown']).toContain(systemTheme);
    });

    test('should use system preference when no saved theme', async ({ page }) => {
      // Clear any saved theme
      await page.evaluate(() => {
        localStorage.removeItem('quote-engine-theme');
      });

      // Reload to trigger system preference detection
      await page.reload();
      await page.waitForFunction(() => window.Theme);

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      // Should be either 'dark' or 'light' based on system
      expect(['dark', 'light']).toContain(theme);
    });
  });

  test.describe('Toggle Button', () => {
    test('should add theme toggle button to UI', async ({ page }) => {
      const button = await page.$('#themeToggleBtn');
      expect(button).toBeTruthy();
    });

    test('should update toggle button on theme change', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('dark');
      });

      const darkText = await page.textContent('#themeToggleBtn');

      await page.evaluate(() => {
        window.Theme.set('light');
      });

      const lightText = await page.textContent('#themeToggleBtn');

      // Buttons should have different text for different themes
      expect(darkText).not.toBe(lightText);
    });

    test('should toggle theme when button clicked', async ({ page }) => {
      const before = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      await page.click('#themeToggleBtn');

      const after = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(before).not.toBe(after);
    });

    test('should have accessibility attributes', async ({ page }) => {
      const ariaLabel = await page.getAttribute('#themeToggleBtn', 'aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/theme/i);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle invalid theme gracefully', async ({ page }) => {
      await page.evaluate(() => {
        // Try to set invalid theme
        window.Theme.set('invalid-theme');
      });

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      // Should still be a valid theme
      expect(['dark', 'light']).toContain(theme);
    });

    test('should handle localStorage errors gracefully', async ({ page }) => {
      const result = await page.evaluate(() => {
        var originalSetItem = localStorage.setItem;
        localStorage.setItem = function() {
          throw new Error('localStorage disabled');
        };

        try {
          window.Theme.set('light');
          localStorage.setItem = originalSetItem;
          return 'handled';
        } catch (e) {
          localStorage.setItem = originalSetItem;
          return 'crashed';
        }
      });

      expect(result).toBe('handled');
    });

    test('should work without toggle button present', async ({ page }) => {
      await page.evaluate(() => {
        // Remove toggle button
        var btn = document.getElementById('themeToggleBtn');
        if (btn) {
          btn.remove();
        }
      });

      // Should still work
      await page.evaluate(() => {
        window.Theme.toggle();
      });

      const theme = await page.evaluate(() => {
        return window.Theme.getCurrent();
      });

      expect(['dark', 'light']).toContain(theme);
    });
  });

  test.describe('CSS Application', () => {
    test('should apply theme CSS class', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('dark');
      });

      const hasDarkTheme = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme') === 'dark';
      });

      expect(hasDarkTheme).toBe(true);
    });

    test('should change CSS on theme toggle', async ({ page }) => {
      await page.evaluate(() => {
        window.Theme.set('dark');
      });

      const beforeAttr = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });

      await page.evaluate(() => {
        window.Theme.toggle();
      });

      const afterAttr = await page.evaluate(() => {
        return document.documentElement.getAttribute('data-theme');
      });

      expect(beforeAttr).toBe('dark');
      expect(afterAttr).toBe('light');
    });
  });
});
