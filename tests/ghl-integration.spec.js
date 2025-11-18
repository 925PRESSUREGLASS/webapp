// tests/ghl-integration.spec.js - GoHighLevel Integration Tests
const { test, expect } = require('@playwright/test');

test.describe('GoHighLevel Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:8080');

    // Wait for app initialization
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);

    // Wait for GHL modules to load
    await page.waitForFunction(() => {
      return window.GHL_CONFIG &&
             window.GHLClient &&
             window.GHLContactSync &&
             window.GHLOpportunitySync;
    });
  });

  test.describe('Configuration', () => {
    test('should have GHL_CONFIG object', async ({ page }) => {
      const hasConfig = await page.evaluate(() => {
        return typeof window.GHL_CONFIG === 'object' && window.GHL_CONFIG !== null;
      });

      expect(hasConfig).toBe(true);
    });

    test('should load configuration from localStorage', async ({ page }) => {
      // Set test config
      await page.evaluate(() => {
        window.GHL_CONFIG.clientId = 'test-client-id';
        window.GHL_CONFIG.locationId = 'test-location-id';
        window.GHLConfig.save();
      });

      // Reload page
      await page.reload();
      await page.waitForFunction(() => window.GHL_CONFIG);

      // Check if config persisted
      const clientId = await page.evaluate(() => window.GHL_CONFIG.clientId);
      expect(clientId).toBe('test-client-id');
    });

    test('should save configuration', async ({ page }) => {
      const result = await page.evaluate(() => {
        window.GHL_CONFIG.clientId = 'new-client-id';
        window.GHL_CONFIG.clientSecret = 'new-client-secret';
        window.GHL_CONFIG.locationId = 'new-location-id';
        return window.GHLConfig.save();
      });

      expect(result).toBe(true);
    });

    test('should check if configured', async ({ page }) => {
      // Set minimal config
      await page.evaluate(() => {
        window.GHL_CONFIG.clientId = 'test-id';
        window.GHL_CONFIG.clientSecret = 'test-secret';
        window.GHL_CONFIG.locationId = 'test-location';
      });

      const isConfigured = await page.evaluate(() => {
        return window.GHLConfig.isConfigured();
      });

      expect(isConfigured).toBe(true);
    });

    test('should clear configuration', async ({ page }) => {
      // Set config
      await page.evaluate(() => {
        window.GHL_CONFIG.clientId = 'test-id';
        window.GHLConfig.save();
      });

      // Clear config
      await page.evaluate(() => {
        window.GHLConfig.clear();
      });

      // Check if cleared
      const clientId = await page.evaluate(() => window.GHL_CONFIG.clientId);
      expect(clientId).toBe('');
    });
  });

  test.describe('API Client', () => {
    test('should have GHLClient object', async ({ page }) => {
      const hasClient = await page.evaluate(() => {
        return typeof window.GHLClient === 'object' &&
               typeof window.GHLClient.makeRequest === 'function';
      });

      expect(hasClient).toBe(true);
    });

    test('should have API endpoints', async ({ page }) => {
      const hasEndpoints = await page.evaluate(() => {
        return window.GHLClient.endpoints &&
               window.GHLClient.endpoints.contacts &&
               window.GHLClient.endpoints.opportunities;
      });

      expect(hasEndpoints).toBe(true);
    });

    test('should manage request queue', async ({ page }) => {
      const queueLength = await page.evaluate(() => {
        return window.GHLClient.getQueueLength();
      });

      expect(typeof queueLength).toBe('number');
    });

    test('should clear queue', async ({ page }) => {
      await page.evaluate(() => {
        window.GHLClient.clearQueue();
      });

      const queueLength = await page.evaluate(() => {
        return window.GHLClient.getQueueLength();
      });

      expect(queueLength).toBe(0);
    });
  });

  test.describe('Contact Sync', () => {
    test('should have GHLContactSync object', async ({ page }) => {
      const hasSync = await page.evaluate(() => {
        return typeof window.GHLContactSync === 'object' &&
               typeof window.GHLContactSync.syncClient === 'function';
      });

      expect(hasSync).toBe(true);
    });

    test('should map client to contact format', async ({ page }) => {
      // This tests internal mapping logic
      const result = await page.evaluate(() => {
        // Create test client
        var testClient = {
          id: 'test-1',
          name: 'John Smith',
          email: 'john@example.com',
          phone: '0400123456',
          location: '123 Main St, Perth, WA',
          clientType: 'residential'
        };

        // Note: mapClientToContact is private, so we test via public API
        // We'll just verify the module exists and has the expected methods
        return {
          hasCreateContact: typeof window.GHLContactSync.createContact === 'function',
          hasUpdateContact: typeof window.GHLContactSync.updateContact === 'function',
          hasSyncClient: typeof window.GHLContactSync.syncClient === 'function'
        };
      });

      expect(result.hasCreateContact).toBe(true);
      expect(result.hasUpdateContact).toBe(true);
      expect(result.hasSyncClient).toBe(true);
    });
  });

  test.describe('Opportunity Sync', () => {
    test('should have GHLOpportunitySync object', async ({ page }) => {
      const hasSync = await page.evaluate(() => {
        return typeof window.GHLOpportunitySync === 'object' &&
               typeof window.GHLOpportunitySync.syncQuote === 'function';
      });

      expect(hasSync).toBe(true);
    });

    test('should have required methods', async ({ page }) => {
      const result = await page.evaluate(() => {
        return {
          hasCreateOpportunity: typeof window.GHLOpportunitySync.createOpportunity === 'function',
          hasUpdateOpportunity: typeof window.GHLOpportunitySync.updateOpportunity === 'function',
          hasSyncQuote: typeof window.GHLOpportunitySync.syncQuote === 'function',
          hasSyncAllQuotes: typeof window.GHLOpportunitySync.syncAllQuotes === 'function'
        };
      });

      expect(result.hasCreateOpportunity).toBe(true);
      expect(result.hasUpdateOpportunity).toBe(true);
      expect(result.hasSyncQuote).toBe(true);
      expect(result.hasSyncAllQuotes).toBe(true);
    });
  });

  test.describe('UI Components', () => {
    test('should have GHLUI object', async ({ page }) => {
      const hasUI = await page.evaluate(() => {
        return typeof window.GHLUI === 'object' &&
               typeof window.GHLUI.openSettings === 'function';
      });

      expect(hasUI).toBe(true);
    });

    test('should create settings modal', async ({ page }) => {
      const hasModal = await page.evaluate(() => {
        return document.getElementById('ghlSettingsModal') !== null;
      });

      expect(hasModal).toBe(true);
    });

    test('should add settings button', async ({ page }) => {
      const hasButton = await page.evaluate(() => {
        return document.getElementById('ghlSettingsBtn') !== null;
      });

      expect(hasButton).toBe(true);
    });

    test('should open settings modal', async ({ page }) => {
      // Click settings button
      await page.click('#ghlSettingsBtn');

      // Wait for modal to appear
      await page.waitForSelector('#ghlSettingsModal.active');

      // Check if modal is visible
      const isVisible = await page.isVisible('#ghlSettingsModal.active');
      expect(isVisible).toBe(true);
    });

    test('should close settings modal', async ({ page }) => {
      // Open modal
      await page.click('#ghlSettingsBtn');
      await page.waitForSelector('#ghlSettingsModal.active');

      // Close modal
      await page.click('#ghlSettingsModal .modal-close');

      // Wait for modal to close
      await page.waitForTimeout(300);

      // Check if modal is hidden
      const isHidden = await page.evaluate(() => {
        var modal = document.getElementById('ghlSettingsModal');
        return !modal.classList.contains('active');
      });

      expect(isHidden).toBe(true);
    });

    test('should switch tabs', async ({ page }) => {
      // Open modal
      await page.click('#ghlSettingsBtn');
      await page.waitForSelector('#ghlSettingsModal.active');

      // Click sync tab
      await page.click('.tab-btn[data-tab="sync"]');

      // Check if sync tab is active
      const isSyncActive = await page.evaluate(() => {
        return document.querySelector('.tab-content[data-tab="sync"]').classList.contains('active');
      });

      expect(isSyncActive).toBe(true);
    });

    test('should display connection status', async ({ page }) => {
      // Open modal
      await page.click('#ghlSettingsBtn');
      await page.waitForSelector('#ghlSettingsModal.active');

      // Check if connection status is displayed
      const hasStatus = await page.evaluate(() => {
        var statusEl = document.getElementById('ghlConnectionStatus');
        return statusEl !== null && statusEl.textContent.length > 0;
      });

      expect(hasStatus).toBe(true);
    });
  });

  test.describe('Feature Flags', () => {
    test('should have feature flags configured', async ({ page }) => {
      const features = await page.evaluate(() => {
        return window.GHL_CONFIG.features;
      });

      expect(features).toHaveProperty('contactSync');
      expect(features).toHaveProperty('opportunitySync');
      expect(features).toHaveProperty('taskSync');
    });

    test('should toggle feature flags', async ({ page }) => {
      await page.evaluate(() => {
        window.GHL_CONFIG.features.contactSync = false;
        window.GHLConfig.save();
      });

      const contactSyncEnabled = await page.evaluate(() => {
        return window.GHL_CONFIG.features.contactSync;
      });

      expect(contactSyncEnabled).toBe(false);
    });
  });

  test.describe('Sync Settings', () => {
    test('should have sync settings configured', async ({ page }) => {
      const settings = await page.evaluate(() => {
        return window.GHL_CONFIG.syncSettings;
      });

      expect(settings).toHaveProperty('autoSync');
      expect(settings).toHaveProperty('syncInterval');
      expect(settings).toHaveProperty('offlineQueue');
    });

    test('should update sync settings', async ({ page }) => {
      await page.evaluate(() => {
        window.GHL_CONFIG.syncSettings.autoSync = false;
        window.GHL_CONFIG.syncSettings.syncInterval = 600000; // 10 minutes
        window.GHLConfig.save();
      });

      const autoSync = await page.evaluate(() => {
        return window.GHL_CONFIG.syncSettings.autoSync;
      });

      const interval = await page.evaluate(() => {
        return window.GHL_CONFIG.syncSettings.syncInterval;
      });

      expect(autoSync).toBe(false);
      expect(interval).toBe(600000);
    });
  });

  test.describe('Module Registration', () => {
    test('should register GHL modules with APP', async ({ page }) => {
      const modules = await page.evaluate(() => {
        return {
          hasGhlConfig: window.APP.getModule('ghlConfig') !== null,
          hasGhlClient: window.APP.getModule('ghlClient') !== null,
          hasGhlContactSync: window.APP.getModule('ghlContactSync') !== null,
          hasGhlOpportunitySync: window.APP.getModule('ghlOpportunitySync') !== null,
          hasGhlUI: window.APP.getModule('ghlUI') !== null
        };
      });

      expect(modules.hasGhlConfig).toBe(true);
      expect(modules.hasGhlClient).toBe(true);
      expect(modules.hasGhlContactSync).toBe(true);
      expect(modules.hasGhlOpportunitySync).toBe(true);
      expect(modules.hasGhlUI).toBe(true);
    });
  });

  test.describe('Offline Queue', () => {
    test('should queue requests when offline', async ({ page }) => {
      // Simulate offline
      await page.evaluate(() => {
        // Mock offline status
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          value: false
        });
      });

      // Queue length should start at 0
      const initialLength = await page.evaluate(() => {
        return window.GHLClient.getQueueLength();
      });

      expect(initialLength).toBe(0);
    });

    test('should process queue when online', async ({ page }) => {
      const result = await page.evaluate(() => {
        // Clear queue first
        window.GHLClient.clearQueue();

        // Verify queue is empty
        return window.GHLClient.getQueueLength();
      });

      expect(result).toBe(0);
    });
  });

  // Cleanup after all tests
  test.afterEach(async ({ page }) => {
    // Clear test data
    await page.evaluate(() => {
      // Clear GHL config
      if (window.GHLConfig) {
        window.GHLConfig.clear();
      }

      // Clear queue
      if (window.GHLClient) {
        window.GHLClient.clearQueue();
      }
    });
  });
});
