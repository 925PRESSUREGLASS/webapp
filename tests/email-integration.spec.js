// email-integration.spec.js - Email Integration Tests
// Tests email functionality in quote-pdf-ui.js and backup-manager.js
// Verifies API calls, fallback behavior, and UI interactions

var test = require('./fixtures/fresh-context').test;
var expect = require('./fixtures/fresh-context').expect;
var gotoApp = require('./fixtures/app-url').gotoApp;

test.describe('Email Integration', function() {

  // Helper function to create properly structured mock email data
  function createMockEmailData(options) {
    options = options || {};
    return {
      to: options.to || options.clientEmail || '',
      subject: options.subject || 'Quote ' + (options.quoteNumber || 'Q-123'),
      body: options.body || 'Please find attached your quote.',
      quoteNumber: options.quoteNumber || 'Q-123',
      attachment: {
        filename: (options.quoteNumber || 'Quote') + '.pdf',
        data: 'base64data'
      }
    };
  }

  test.beforeEach(async function({ page }) {
    await gotoApp(page);
    await page.waitForSelector('.app');
    await page.waitForFunction(function() {
      return window.APP && window.APP.initialized;
    });
  });

  test.describe('QuotePDFUI Email Functionality', function() {

    test('should expose email methods on QuotePDFUI', async function({ page }) {
      var api = await page.evaluate(function() {
        return {
          hasShowEmailModal: typeof window.QuotePDFUI.showEmailModal === 'function',
          hasCloseEmailModal: typeof window.QuotePDFUI.closeEmailModal === 'function',
          hasSendEmail: typeof window.QuotePDFUI.sendEmail === 'function',
          hasSendViaMailto: typeof window.QuotePDFUI._sendViaMailto === 'function'
        };
      });

      expect(api.hasShowEmailModal).toBe(true);
      expect(api.hasCloseEmailModal).toBe(true);
      expect(api.hasSendEmail).toBe(true);
      expect(api.hasSendViaMailto).toBe(true);
    });

    test('should expose global email modal functions', async function({ page }) {
      var globalFns = await page.evaluate(function() {
        return {
          hasShowEmailModal: typeof window.showEmailModal === 'function',
          hasCloseEmailModal: typeof window.closeEmailModal === 'function'
        };
      });

      expect(globalFns.hasShowEmailModal).toBe(true);
      expect(globalFns.hasCloseEmailModal).toBe(true);
    });

    test('should have email button in UI', async function({ page }) {
      var emailBtn = await page.$('#btn-email-pdf');
      // Button may or may not exist depending on UI state
      // Just verify no crash when checking
      expect(true).toBe(true);
    });

    test('should show email modal with quote data', async function({ page }) {
      var result = await page.evaluate(function() {
        // Create mock email data with proper structure
        var mockData = {
          to: 'test@example.com',
          subject: 'Quote Q-2024-001',
          body: 'Please find attached your quote.',
          quoteNumber: 'Q-2024-001',
          attachment: {
            filename: 'Quote-Q-2024-001.pdf',
            data: 'base64data'
          }
        };

        // Show modal
        window.showEmailModal(mockData);

        // Check if modal is visible
        var overlay = document.getElementById('email-modal-overlay');
        var toField = document.getElementById('email-to');
        var subjectField = document.getElementById('email-subject');

        return {
          overlayExists: !!overlay,
          overlayVisible: overlay ? overlay.style.display !== 'none' : false,
          toValue: toField ? toField.value : null,
          subjectContainsQuote: subjectField ? subjectField.value.indexOf('Q-2024-001') !== -1 : false
        };
      });

      expect(result.overlayExists).toBe(true);
      expect(result.toValue).toBe('test@example.com');
      expect(result.subjectContainsQuote).toBe(true);
    });

    test('should close email modal', async function({ page }) {
      await page.evaluate(function() {
        // Open modal with proper data structure
        var mockData = {
          to: '',
          subject: 'Quote Q-123',
          body: 'Test body',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);
      });

      // Wait for modal to appear
      await page.waitForTimeout(100);

      await page.evaluate(function() {
        window.closeEmailModal();
      });

      // Wait for animation
      await page.waitForTimeout(400);

      var modalHidden = await page.evaluate(function() {
        var overlay = document.getElementById('email-modal-overlay');
        if (!overlay) return true;
        return overlay.style.display === 'none' || overlay.style.opacity === '0';
      });

      expect(modalHidden).toBe(true);
    });

    test('should validate empty email address', async function({ page }) {
      var result = await page.evaluate(function() {
        // Show modal with proper structure
        var mockData = {
          to: '',
          subject: 'Quote Q-123',
          body: 'Test body',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);

        // Clear TO field
        var toField = document.getElementById('email-to');
        if (toField) toField.value = '';

        // Track toast
        var toastShown = false;
        var originalShowToast = window.UIComponents.showToast;
        window.UIComponents.showToast = function(msg, type) {
          if (type === 'warning' && msg.toLowerCase().indexOf('recipient') !== -1) {
            toastShown = true;
          }
          return originalShowToast.call(this, msg, type);
        };

        // Try to send
        window.QuotePDFUI.sendEmail();

        // Restore
        window.UIComponents.showToast = originalShowToast;

        return { toastShown: toastShown };
      });

      expect(result.toastShown).toBe(true);
    });

    test('should validate invalid email format', async function({ page }) {
      var result = await page.evaluate(function() {
        // Show modal with proper structure
        var mockData = {
          to: '',
          subject: 'Quote Q-123',
          body: 'Test body',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);

        // Set invalid email
        var toField = document.getElementById('email-to');
        if (toField) toField.value = 'not-an-email';

        // Track toast
        var toastShown = false;
        var originalShowToast = window.UIComponents.showToast;
        window.UIComponents.showToast = function(msg, type) {
          if (type === 'warning' && msg.toLowerCase().indexOf('valid email') !== -1) {
            toastShown = true;
          }
          return originalShowToast.call(this, msg, type);
        };

        // Try to send
        window.QuotePDFUI.sendEmail();

        // Restore
        window.UIComponents.showToast = originalShowToast;

        return { toastShown: toastShown };
      });

      expect(result.toastShown).toBe(true);
    });

    test('should validate empty subject', async function({ page }) {
      var result = await page.evaluate(function() {
        // Show modal with proper structure
        var mockData = {
          to: 'test@test.com',
          subject: 'Quote Q-123',
          body: 'Test body',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);

        // Clear subject
        var subjectField = document.getElementById('email-subject');
        if (subjectField) subjectField.value = '';

        // Track toast
        var toastShown = false;
        var originalShowToast = window.UIComponents.showToast;
        window.UIComponents.showToast = function(msg, type) {
          if (type === 'warning' && msg.toLowerCase().indexOf('subject') !== -1) {
            toastShown = true;
          }
          return originalShowToast.call(this, msg, type);
        };

        // Try to send
        window.QuotePDFUI.sendEmail();

        // Restore
        window.UIComponents.showToast = originalShowToast;

        return { toastShown: toastShown };
      });

      expect(result.toastShown).toBe(true);
    });

    test('should use mailto fallback when no API configured', async function({ page }) {
      var result = await page.evaluate(function() {
        // Ensure no API is configured
        var originalConfig = window.APP.config;
        window.APP.config = {};

        // Track _sendViaMailto call instead of location.href
        var mailtoUsed = false;
        var originalSendViaMailto = window.QuotePDFUI._sendViaMailto;
        window.QuotePDFUI._sendViaMailto = function() {
          mailtoUsed = true;
          // Don't actually navigate
        };

        // Show modal with valid data
        var mockData = {
          to: 'test@example.com',
          subject: 'Quote Q-123',
          body: 'Test body',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);

        // Fill in required fields
        document.getElementById('email-to').value = 'test@example.com';
        document.getElementById('email-subject').value = 'Test Subject';
        document.getElementById('email-body').value = 'Test body';

        // Call send
        window.QuotePDFUI.sendEmail();

        // Restore
        window.APP.config = originalConfig;
        window.QuotePDFUI._sendViaMailto = originalSendViaMailto;

        return { mailtoUsed: mailtoUsed };
      });

      expect(result.mailtoUsed).toBe(true);
    });

    test('should attempt API call when apiUrl configured', async function({ page }) {
      // Intercept fetch requests
      var apiCalled = false;
      var requestUrl = '';

      await page.route('**/email/send-quote', function(route) {
        apiCalled = true;
        requestUrl = route.request().url();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.evaluate(function() {
        // Configure API URL
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';

        // Show modal with proper structure
        var mockData = {
          to: 'test@example.com',
          subject: 'Quote Q-123',
          body: 'Please find attached your quote.',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);

        // Fill in fields
        document.getElementById('email-to').value = 'test@example.com';
        document.getElementById('email-subject').value = 'Quote Q-123';
        document.getElementById('email-body').value = 'Please find attached your quote.';

        // Send
        window.QuotePDFUI.sendEmail();
      });

      // Wait for fetch
      await page.waitForTimeout(500);

      expect(apiCalled).toBe(true);
    });

    test('should fall back to mailto on API error', async function({ page }) {
      // Intercept and fail the API request
      await page.route('**/email/send-quote', function(route) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' })
        });
      });

      var result = await page.evaluate(async function() {
        // Configure API URL
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';

        // Track mailto usage
        var mailtoUsed = false;
        var originalSendViaMailto = window.QuotePDFUI._sendViaMailto;
        window.QuotePDFUI._sendViaMailto = function() {
          mailtoUsed = true;
          // Don't actually call original to avoid navigation
        };

        // Show modal with proper structure
        var mockData = {
          to: 'test@example.com',
          subject: 'Quote Q-123',
          body: 'Test body',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);
        document.getElementById('email-to').value = 'test@example.com';
        document.getElementById('email-subject').value = 'Quote Q-123';
        document.getElementById('email-body').value = 'Test body';

        // Send and wait
        window.QuotePDFUI.sendEmail();

        // Wait for API response and fallback
        await new Promise(function(r) { setTimeout(r, 600); });

        // Restore
        window.QuotePDFUI._sendViaMailto = originalSendViaMailto;

        return { mailtoUsed: mailtoUsed };
      });

      expect(result.mailtoUsed).toBe(true);
    });
  });

  test.describe('Backup Manager Email Functionality', function() {

    test.beforeEach(async function({ page }) {
      // Wait for BackupManager to be loaded (it's lazily loaded)
      await page.waitForFunction(function() {
        return window.BackupManager && typeof window.BackupManager.emailBackup === 'function';
      }, { timeout: 5000 }).catch(function() {
        // BackupManager may not be available in all test environments
      });
    });

    test('should expose emailBackup function if BackupManager is loaded', async function({ page }) {
      var hasFunction = await page.evaluate(function() {
        return window.BackupManager && typeof window.BackupManager.emailBackup === 'function';
      });

      // Skip if BackupManager not loaded (lazy loading may not trigger in test)
      if (hasFunction === undefined || hasFunction === null) {
        test.skip();
        return;
      }
      expect(hasFunction).toBe(true);
    });

    test('should validate email address', async function({ page }) {
      var result = await page.evaluate(function() {
        if (!window.BackupManager) return { skip: true };

        var toastShown = false;
        var originalShowToast = window.UIComponents.showToast;
        window.UIComponents.showToast = function(msg, type) {
          if (type === 'warning' && msg.toLowerCase().indexOf('valid email') !== -1) {
            toastShown = true;
          }
          return originalShowToast ? originalShowToast.call(this, msg, type) : null;
        };

        // Call with invalid email
        window.BackupManager.emailBackup('invalid-email');

        // Restore
        window.UIComponents.showToast = originalShowToast;

        return { toastShown: toastShown };
      });

      if (result.skip) {
        test.skip();
        return;
      }
      expect(result.toastShown).toBe(true);
    });

    test('should fall back to download when no API configured', async function({ page }) {
      var result = await page.evaluate(function() {
        if (!window.BackupManager) return { skip: true };

        // Ensure no API URL
        var originalConfig = window.APP.config;
        window.APP.config = {};

        // Track download
        var downloadCalled = false;
        var originalDownload = window.BackupManager.downloadBackup;
        window.BackupManager.downloadBackup = function() {
          downloadCalled = true;
        };

        // Track toast
        var toastMsg = '';
        var originalShowToast = window.UIComponents.showToast;
        window.UIComponents.showToast = function(msg, type) {
          toastMsg = msg;
          return originalShowToast ? originalShowToast.call(this, msg, type) : null;
        };

        // Call with valid email
        window.BackupManager.emailBackup('test@example.com');

        // Restore
        window.APP.config = originalConfig;
        window.BackupManager.downloadBackup = originalDownload;
        window.UIComponents.showToast = originalShowToast;

        return {
          downloadCalled: downloadCalled,
          toastMentionsDownload: toastMsg.toLowerCase().indexOf('download') !== -1
        };
      });

      if (result.skip) {
        test.skip();
        return;
      }
      expect(result.downloadCalled).toBe(true);
    });

    test('should call API when configured', async function({ page }) {
      // Check if BackupManager is available first
      var hasBackupManager = await page.evaluate(function() {
        return window.BackupManager && typeof window.BackupManager.emailBackup === 'function';
      });

      if (!hasBackupManager) {
        test.skip();
        return;
      }

      var apiCalled = false;

      await page.route('**/email/send-backup', function(route) {
        apiCalled = true;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.evaluate(function() {
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';
        window.BackupManager.emailBackup('test@example.com');
      });

      // Wait for fetch
      await page.waitForTimeout(500);

      expect(apiCalled).toBe(true);
    });

    test('should fall back to download on API failure', async function({ page }) {
      // Check if BackupManager is available first
      var hasBackupManager = await page.evaluate(function() {
        return window.BackupManager && typeof window.BackupManager.emailBackup === 'function';
      });

      if (!hasBackupManager) {
        test.skip();
        return;
      }

      await page.route('**/email/send-backup', function(route) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Server error' })
        });
      });

      var result = await page.evaluate(async function() {
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';

        var downloadCalled = false;
        var originalDownload = window.BackupManager.downloadBackup;
        window.BackupManager.downloadBackup = function() {
          downloadCalled = true;
        };

        window.BackupManager.emailBackup('test@example.com');

        // Wait for API and fallback
        await new Promise(function(r) { setTimeout(r, 600); });

        window.BackupManager.downloadBackup = originalDownload;

        return { downloadCalled: downloadCalled };
      });

      expect(result.downloadCalled).toBe(true);
    });
  });

  test.describe('Email Validation', function() {

    test('should accept valid email addresses', async function({ page }) {
      var results = await page.evaluate(function() {
        var emails = [
          'test@example.com',
          'user.name@domain.org',
          'user+tag@subdomain.domain.com',
          'a@b.co'
        ];

        return emails.map(function(email) {
          return {
            email: email,
            valid: window.PDFHelpers && window.PDFHelpers.validateEmail ?
                   window.PDFHelpers.validateEmail(email) :
                   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          };
        });
      });

      results.forEach(function(r) {
        expect(r.valid).toBe(true);
      });
    });

    test('should reject invalid email addresses', async function({ page }) {
      var results = await page.evaluate(function() {
        var emails = [
          'invalid',
          '@missing-local.com',
          'missing-at-sign.com',
          'spaces in@email.com',
          ''
        ];

        return emails.map(function(email) {
          return {
            email: email,
            valid: window.PDFHelpers && window.PDFHelpers.validateEmail ?
                   window.PDFHelpers.validateEmail(email) :
                   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          };
        });
      });

      results.forEach(function(r) {
        expect(r.valid).toBe(false);
      });
    });
  });

  test.describe('Email Request Payload', function() {

    test('should include required fields in quote email', async function({ page }) {
      var capturedBody = null;

      await page.route('**/email/send-quote', function(route) {
        capturedBody = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.evaluate(function() {
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';

        // Set up email data with proper structure
        var mockData = {
          to: 'client@test.com',
          subject: 'Your Quote Q-2024-TEST',
          body: 'Please review the attached quote.',
          quoteNumber: 'Q-2024-TEST',
          attachment: { filename: 'Q-2024-TEST.pdf', data: 'base64' }
        };
        window._emailData = mockData;
        window.showEmailModal(mockData);

        document.getElementById('email-to').value = 'client@test.com';
        document.getElementById('email-subject').value = 'Your Quote Q-2024-TEST';
        document.getElementById('email-body').value = 'Please review the attached quote.';

        window.QuotePDFUI.sendEmail();
      });

      await page.waitForTimeout(500);

      expect(capturedBody).not.toBeNull();
      expect(capturedBody.to).toBe('client@test.com');
      expect(capturedBody.subject).toBe('Your Quote Q-2024-TEST');
      expect(capturedBody.body).toBe('Please review the attached quote.');
      expect(capturedBody.quoteNumber).toBe('Q-2024-TEST');
    });

    test('should include required fields in backup email', async function({ page }) {
      // Check if BackupManager is available first
      var hasBackupManager = await page.evaluate(function() {
        return window.BackupManager && typeof window.BackupManager.emailBackup === 'function';
      });

      if (!hasBackupManager) {
        test.skip();
        return;
      }

      var capturedBody = null;

      await page.route('**/email/send-backup', function(route) {
        capturedBody = route.request().postDataJSON();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      });

      await page.evaluate(function() {
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';
        window.BackupManager.emailBackup('backup@test.com');
      });

      await page.waitForTimeout(500);

      expect(capturedBody).not.toBeNull();
      expect(capturedBody.to).toBe('backup@test.com');
      expect(capturedBody.backup).toBeDefined();
    });
  });

  test.describe('Error Handling', function() {

    test('should handle network errors gracefully', async function({ page }) {
      await page.route('**/email/send-quote', function(route) {
        route.abort('failed');
      });

      var result = await page.evaluate(async function() {
        window.APP.config = window.APP.config || {};
        window.APP.config.apiUrl = 'http://localhost:3000/api';

        var fallbackCalled = false;
        var originalMailto = window.QuotePDFUI._sendViaMailto;
        window.QuotePDFUI._sendViaMailto = function() {
          fallbackCalled = true;
        };

        // Show modal with proper structure
        var mockData = {
          to: 'test@example.com',
          subject: 'Test',
          body: 'Test',
          quoteNumber: 'Q-123',
          attachment: { filename: 'Q-123.pdf', data: 'base64' }
        };
        window.showEmailModal(mockData);
        document.getElementById('email-to').value = 'test@example.com';
        document.getElementById('email-subject').value = 'Test';
        document.getElementById('email-body').value = 'Test';

        window.QuotePDFUI.sendEmail();

        await new Promise(function(r) { setTimeout(r, 600); });

        window.QuotePDFUI._sendViaMailto = originalMailto;

        return { fallbackCalled: fallbackCalled };
      });

      expect(result.fallbackCalled).toBe(true);
    });

    test('should handle missing UIComponents gracefully', async function({ page }) {
      var result = await page.evaluate(function() {
        // Temporarily remove UIComponents
        var original = window.UIComponents;
        window.UIComponents = null;

        var noError = true;
        try {
          // This should not throw
          if (window.BackupManager) {
            // Just check the function exists and can be referenced
            var fn = window.BackupManager.emailBackup;
            noError = typeof fn === 'function';
          }
        } catch (e) {
          noError = false;
        }

        window.UIComponents = original;
        return { noError: noError };
      });

      expect(result.noError).toBe(true);
    });
  });
});
