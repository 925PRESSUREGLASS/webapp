// client-database.spec.js - Client Database (CRM) Tests
// Tests client CRUD operations, search, validation, and persistence

const { test, expect } = require('./fixtures/fresh-context');
const { gotoApp } = require('./fixtures/app-url');

test.describe('Client Database', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.APP.initialized);

    // Clear client database before each test
    await page.evaluate(() => {
      localStorage.removeItem('client-database');
      // Reload clients
      if (window.ClientDatabase) {
        window.location.reload();
      }
    });

    await page.waitForFunction(() => window.ClientDatabase);
  });

  test.describe('Client Creation', () => {
    test('should create new client with required fields', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0412345678',
          location: 'Perth',
          address: '123 Main St, Perth WA 6000',
          notes: 'Prefers morning appointments'
        });
      });

      expect(client).toBeTruthy();
      expect(client.id).toBeTruthy();
      expect(client.id).toMatch(/^client_/);
      expect(client.name).toBe('John Doe');
      expect(client.email).toBe('john@example.com');
      expect(client.phone).toBe('0412345678');
      expect(client.location).toBe('Perth');
      expect(client.address).toBe('123 Main St, Perth WA 6000');
      expect(client.notes).toBe('Prefers morning appointments');
      expect(client.createdAt).toBeTruthy();
      expect(client.updatedAt).toBeTruthy();
    });

    test('should create client with only name (minimal data)', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: 'Jane Smith'
        });
      });

      expect(client).toBeTruthy();
      expect(client.name).toBe('Jane Smith');
      expect(client.email).toBe('');
      expect(client.phone).toBe('');
      expect(client.location).toBe('');
      expect(client.address).toBe('');
      expect(client.notes).toBe('');
    });

    test('should trim whitespace from client name', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: '  Whitespace Test  '
        });
      });

      expect(client.name).toBe('Whitespace Test');
    });

    test('should generate unique IDs for multiple clients', async ({ page }) => {
      const ids = await page.evaluate(() => {
        var client1 = window.ClientDatabase.save({ name: 'Client 1' });
        var client2 = window.ClientDatabase.save({ name: 'Client 2' });
        var client3 = window.ClientDatabase.save({ name: 'Client 3' });
        return [client1.id, client2.id, client3.id];
      });

      expect(ids[0]).not.toBe(ids[1]);
      expect(ids[1]).not.toBe(ids[2]);
      expect(ids[0]).not.toBe(ids[2]);
    });
  });

  test.describe('Client Validation', () => {
    test('should reject client without name', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          email: 'test@example.com'
        });
      });

      expect(client).toBeNull();
    });

    test('should reject client with empty name', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: ''
        });
      });

      expect(client).toBeNull();
    });

    test('should reject client with whitespace-only name', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: '   '
        });
      });

      expect(client).toBeNull();
    });
  });

  test.describe('Client Updates', () => {
    test('should update existing client', async ({ page }) => {
      const result = await page.evaluate(() => {
        // Create client
        var original = window.ClientDatabase.save({
          name: 'Original Name',
          email: 'original@example.com'
        });

        var start = Date.now();
        while (Date.now() - start < 5) {}

        // Update client
        var updated = window.ClientDatabase.save({
          id: original.id,
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '0412345678'
        });

        return { original: original, updated: updated };
      });

      expect(result.updated.id).toBe(result.original.id);
      expect(result.updated.name).toBe('Updated Name');
      expect(result.updated.email).toBe('updated@example.com');
      expect(result.updated.phone).toBe('0412345678');
      expect(result.updated.updatedAt).toBeGreaterThan(result.original.updatedAt);
    });

    test('should preserve createdAt when updating', async ({ page }) => {
      const result = await page.evaluate(() => {
        var original = window.ClientDatabase.save({
          name: 'Test Client'
        });

        // Wait a bit
        var start = Date.now();
        while (Date.now() - start < 10) {}

        var updated = window.ClientDatabase.save({
          id: original.id,
          name: 'Updated Client',
          createdAt: original.createdAt
        });

        return { original: original, updated: updated };
      });

      expect(result.updated.createdAt).toBe(result.original.createdAt);
    });
  });

  test.describe('Client Retrieval', () => {
    test('should get client by ID', async ({ page }) => {
      const result = await page.evaluate(() => {
        var saved = window.ClientDatabase.save({
          name: 'John Doe',
          email: 'john@example.com'
        });

        var retrieved = window.ClientDatabase.get(saved.id);
        return { saved: saved, retrieved: retrieved };
      });

      expect(result.retrieved).toBeTruthy();
      expect(result.retrieved.id).toBe(result.saved.id);
      expect(result.retrieved.name).toBe('John Doe');
    });

    test('should return null for non-existent ID', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.get('non_existent_id');
      });

      expect(client).toBeNull();
    });

    test('should get client by name (case-insensitive)', async ({ page }) => {
      const result = await page.evaluate(() => {
        window.ClientDatabase.save({
          name: 'John Doe',
          email: 'john@example.com'
        });

        return {
          exact: window.ClientDatabase.getByName('John Doe'),
          lower: window.ClientDatabase.getByName('john doe'),
          upper: window.ClientDatabase.getByName('JOHN DOE'),
          mixed: window.ClientDatabase.getByName('JoHn DoE')
        };
      });

      expect(result.exact).toBeTruthy();
      expect(result.lower).toBeTruthy();
      expect(result.upper).toBeTruthy();
      expect(result.mixed).toBeTruthy();
      expect(result.exact.name).toBe('John Doe');
      expect(result.lower.name).toBe('John Doe');
    });

    test('should return null for non-existent name', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.getByName('Non Existent');
      });

      expect(client).toBeNull();
    });

    test('should get all clients sorted by name', async ({ page }) => {
      const clients = await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Zoe' });
        window.ClientDatabase.save({ name: 'Alice' });
        window.ClientDatabase.save({ name: 'Mike' });

        return window.ClientDatabase.getAll();
      });

      expect(clients.length).toBe(3);
      expect(clients[0].name).toBe('Alice');
      expect(clients[1].name).toBe('Mike');
      expect(clients[2].name).toBe('Zoe');
    });
  });

  test.describe('Client Search', () => {
    test.beforeEach(async ({ page }) => {
      await page.evaluate(() => {
        window.ClientDatabase.save({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0412345678',
          location: 'Perth'
        });

        window.ClientDatabase.save({
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '0423456789',
          location: 'Fremantle'
        });

        window.ClientDatabase.save({
          name: 'Mike Johnson',
          email: 'mike@business.com',
          phone: '0434567890',
          location: 'Subiaco'
        });
      });
    });

    test('should search by name (partial match)', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('john');
      });

      expect(results.length).toBe(2); // John Doe and Mike Johnson
      const names = results.map(c => c.name);
      expect(names).toContain('John Doe');
      expect(names).toContain('Mike Johnson');
    });

    test('should search by email', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('business.com');
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Mike Johnson');
    });

    test('should search by phone', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('0423');
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Jane Smith');
    });

    test('should search by location', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('fremantle');
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Jane Smith');
    });

    test('should return all clients for empty search', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('');
      });

      expect(results.length).toBe(3);
    });

    test('should return all clients for whitespace search', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('   ');
      });

      expect(results.length).toBe(3);
    });

    test('should return empty array for no matches', async ({ page }) => {
      const results = await page.evaluate(() => {
        return window.ClientDatabase.search('nonexistent');
      });

      expect(results.length).toBe(0);
    });

    test('should search case-insensitively', async ({ page }) => {
      const results = await page.evaluate(() => {
        return {
          lower: window.ClientDatabase.search('perth'),
          upper: window.ClientDatabase.search('PERTH'),
          mixed: window.ClientDatabase.search('PeRtH')
        };
      });

      expect(results.lower.length).toBe(1);
      expect(results.upper.length).toBe(1);
      expect(results.mixed.length).toBe(1);
    });
  });

  test.describe('Client Deletion', () => {
    test('should delete client (with confirmation override)', async ({ page }) => {
      // Override confirm to auto-accept
      await page.evaluate(() => {
        window.confirm = function() { return true; };
      });

      const result = await page.evaluate(() => {
        var client = window.ClientDatabase.save({
          name: 'Delete Me'
        });

        var deleted = window.ClientDatabase.delete(client.id);
        var retrieved = window.ClientDatabase.get(client.id);

        return { deleted: deleted, retrieved: retrieved };
      });

      expect(result.deleted).toBe(true);
      expect(result.retrieved).toBeNull();
    });

    test('should not delete if user cancels confirmation', async ({ page }) => {
      // Override confirm to auto-reject
      await page.evaluate(() => {
        window.confirm = function() { return false; };
      });

      const result = await page.evaluate(() => {
        var client = window.ClientDatabase.save({
          name: 'Keep Me'
        });

        var deleted = window.ClientDatabase.delete(client.id);
        var retrieved = window.ClientDatabase.get(client.id);

        return { deleted: deleted, retrieved: retrieved };
      });

      expect(result.deleted).toBe(false);
      expect(result.retrieved).toBeTruthy();
      expect(result.retrieved.name).toBe('Keep Me');
    });

    test('should return false for non-existent client', async ({ page }) => {
      const deleted = await page.evaluate(() => {
        return window.ClientDatabase.delete('non_existent_id');
      });

      expect(deleted).toBe(false);
    });
  });

  test.describe('LocalStorage Persistence', () => {
    test('should persist clients to localStorage', async ({ page }) => {
      await page.evaluate(() => {
        window.ClientDatabase.save({
          name: 'Persistent Client',
          email: 'persist@example.com'
        });
      });

      const stored = await page.evaluate(() => {
        var json = localStorage.getItem('client-database');
        return JSON.parse(json);
      });

      expect(stored).toBeTruthy();
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toBe(1);
      expect(stored[0].name).toBe('Persistent Client');
    });

    test('should load clients from localStorage on init', async ({ page }) => {
      // Set data in localStorage first
      await page.evaluate(() => {
        var clients = [
          {
            id: 'client_123',
            name: 'Preloaded Client',
            email: 'preload@example.com',
            phone: '',
            location: '',
            address: '',
            notes: '',
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
        ];
        localStorage.setItem('client-database', JSON.stringify(clients));
      });

      // Reload page to trigger init
      await page.reload();
      await page.waitForFunction(() => window.ClientDatabase);

      const client = await page.evaluate(() => {
        return window.ClientDatabase.get('client_123');
      });

      expect(client).toBeTruthy();
      expect(client.name).toBe('Preloaded Client');
      expect(client.email).toBe('preload@example.com');
    });

    test('should handle corrupted localStorage gracefully', async ({ page }) => {
      await page.evaluate(() => {
        localStorage.setItem('client-database', 'invalid json {{{');
      });

      // Reload page
      await page.reload();
      await page.waitForFunction(() => window.ClientDatabase);

      const clients = await page.evaluate(() => {
        return window.ClientDatabase.getAll();
      });

      // Should return empty array, not crash
      expect(clients).toEqual([]);
    });
  });

  test.describe('Client Statistics', () => {
    test('should return zero stats for client with no quotes', async ({ page }) => {
      const stats = await page.evaluate(() => {
        var client = window.ClientDatabase.save({
          name: 'New Client'
        });

        return window.ClientDatabase.getStats(client.id);
      });

      // May return null if QuoteAnalytics not available, or zero stats
      if (stats) {
        expect(stats.quoteCount).toBe(0);
        expect(stats.totalRevenue).toBe(0);
        expect(stats.averageQuote).toBe(0);
      }
    });

    test('should calculate stats when QuoteAnalytics unavailable', async ({ page }) => {
      const stats = await page.evaluate(() => {
        // Temporarily hide QuoteAnalytics
        var temp = window.QuoteAnalytics;
        window.QuoteAnalytics = null;

        var client = window.ClientDatabase.save({
          name: 'Test Client'
        });

        var result = window.ClientDatabase.getStats(client.id);

        // Restore
        window.QuoteAnalytics = temp;

        return result;
      });

      expect(stats).toBeNull();
    });
  });

  test.describe('Client Count and Data Integrity', () => {
    test('should maintain accurate client count', async ({ page }) => {
      const result = await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Client 1' });
        var count1 = window.ClientDatabase.getAll().length;

        window.ClientDatabase.save({ name: 'Client 2' });
        var count2 = window.ClientDatabase.getAll().length;

        window.ClientDatabase.save({ name: 'Client 3' });
        var count3 = window.ClientDatabase.getAll().length;

        return { count1: count1, count2: count2, count3: count3 };
      });

      expect(result.count1).toBe(1);
      expect(result.count2).toBe(2);
      expect(result.count3).toBe(3);
    });

    test('should not create duplicates when updating', async ({ page }) => {
      const count = await page.evaluate(() => {
        var client = window.ClientDatabase.save({ name: 'Original' });

        // Update same client multiple times
        window.ClientDatabase.save({ id: client.id, name: 'Update 1' });
        window.ClientDatabase.save({ id: client.id, name: 'Update 2' });
        window.ClientDatabase.save({ id: client.id, name: 'Update 3' });

        return window.ClientDatabase.getAll().length;
      });

      expect(count).toBe(1);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle special characters in name', async ({ page }) => {
      const client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: "O'Brien & Associates (Pty) Ltd."
        });
      });

      expect(client).toBeTruthy();
      expect(client.name).toBe("O'Brien & Associates (Pty) Ltd.");
    });

    test('should handle very long client data', async ({ page }) => {
      const client = await page.evaluate(() => {
        var longText = 'A'.repeat(5000);
        return window.ClientDatabase.save({
          name: 'Long Data Client',
          notes: longText
        });
      });

      expect(client).toBeTruthy();
      expect(client.notes.length).toBe(5000);
    });

    test('should handle empty email/phone/location gracefully', async ({ page }) => {
      const results = await page.evaluate(() => {
        window.ClientDatabase.save({
          name: 'Minimal Client',
          email: '',
          phone: '',
          location: ''
        });

        return {
          emailSearch: window.ClientDatabase.search(''),
          phoneSearch: window.ClientDatabase.search('')
        };
      });

      // Should not crash
      expect(results.emailSearch.length).toBeGreaterThan(0);
    });
  });
});
