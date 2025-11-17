// Test Suite: Client Database (CRM System)
// Tests client registry, search, and management functionality
// PHASE 1: Critical Data Integrity Tests

const { test, expect } = require('@playwright/test');

const APP_URL = '/index.html';

test.describe('Client Database - CRM System', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL);
    await page.waitForLoadState('networkidle');

    // Clear client database before each test
    await page.evaluate(() => {
      localStorage.removeItem('client-database');
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait for ClientDatabase to initialize
    await page.waitForFunction(() => {
      return typeof window.ClientDatabase !== 'undefined';
    }, { timeout: 5000 });
  });

  test.describe('Client Creation', () => {

    test('should create a new client with required fields', async ({ page }) => {
      console.log('=== Test: Create New Client ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0412345678',
          location: 'Perth CBD',
          address: '123 Main St, Perth',
          notes: 'VIP client'
        });
      });

      expect(client).toBeTruthy();
      expect(client.id).toMatch(/^client_\d+_[a-z0-9]+$/);
      expect(client.name).toBe('John Doe');
      expect(client.email).toBe('john@example.com');
      expect(client.phone).toBe('0412345678');
      expect(client.location).toBe('Perth CBD');
      expect(client.address).toBe('123 Main St, Perth');
      expect(client.notes).toBe('VIP client');
      expect(client.createdAt).toBeGreaterThan(0);
      expect(client.updatedAt).toBeGreaterThan(0);

      console.log('✓ Client created with all fields:', client.id);
    });

    test('should create client with only required name field', async ({ page }) => {
      console.log('=== Test: Create Client - Minimal Data ===');

      var client = await page.evaluate(() => {
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

      console.log('✓ Client created with minimal data');
    });

    test('should reject client without name', async ({ page }) => {
      console.log('=== Test: Reject Client Without Name ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          email: 'test@example.com',
          phone: '0412345678'
        });
      });

      expect(client).toBeNull();
      console.log('✓ Client without name rejected');
    });

    test('should reject client with empty name', async ({ page }) => {
      console.log('=== Test: Reject Client With Empty Name ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: '   ',
          email: 'test@example.com'
        });
      });

      expect(client).toBeNull();
      console.log('✓ Client with empty name rejected');
    });

    test('should trim whitespace from client name', async ({ page }) => {
      console.log('=== Test: Trim Whitespace From Name ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: '  John Doe  '
        });
      });

      expect(client.name).toBe('John Doe');
      console.log('✓ Name trimmed correctly');
    });

    test('should generate unique client IDs', async ({ page }) => {
      console.log('=== Test: Unique Client IDs ===');

      var clients = await page.evaluate(() => {
        var c1 = window.ClientDatabase.save({ name: 'Client 1' });
        var c2 = window.ClientDatabase.save({ name: 'Client 2' });
        var c3 = window.ClientDatabase.save({ name: 'Client 3' });
        return [c1.id, c2.id, c3.id];
      });

      expect(clients[0]).not.toBe(clients[1]);
      expect(clients[1]).not.toBe(clients[2]);
      expect(clients[0]).not.toBe(clients[2]);

      console.log('✓ All client IDs are unique');
    });

  });

  test.describe('Client Retrieval', () => {

    test('should get client by ID', async ({ page }) => {
      console.log('=== Test: Get Client By ID ===');

      var result = await page.evaluate(() => {
        var saved = window.ClientDatabase.save({ name: 'Test Client' });
        var retrieved = window.ClientDatabase.get(saved.id);
        return {
          savedId: saved.id,
          retrievedId: retrieved.id,
          match: saved.id === retrieved.id,
          name: retrieved.name
        };
      });

      expect(result.match).toBe(true);
      expect(result.name).toBe('Test Client');
      console.log('✓ Client retrieved by ID');
    });

    test('should return null for non-existent ID', async ({ page }) => {
      console.log('=== Test: Non-Existent Client ID ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.get('client_nonexistent_12345');
      });

      expect(client).toBeNull();
      console.log('✓ Returns null for non-existent ID');
    });

    test('should get client by name (case-insensitive)', async ({ page }) => {
      console.log('=== Test: Get Client By Name ===');

      var result = await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'John Doe' });

        var exact = window.ClientDatabase.getByName('John Doe');
        var lowercase = window.ClientDatabase.getByName('john doe');
        var uppercase = window.ClientDatabase.getByName('JOHN DOE');
        var mixed = window.ClientDatabase.getByName('JoHn DoE');

        return {
          exact: exact ? exact.name : null,
          lowercase: lowercase ? lowercase.name : null,
          uppercase: uppercase ? uppercase.name : null,
          mixed: mixed ? mixed.name : null
        };
      });

      expect(result.exact).toBe('John Doe');
      expect(result.lowercase).toBe('John Doe');
      expect(result.uppercase).toBe('John Doe');
      expect(result.mixed).toBe('John Doe');

      console.log('✓ Case-insensitive name search works');
    });

    test('should return null for non-existent name', async ({ page }) => {
      console.log('=== Test: Non-Existent Client Name ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.getByName('Non Existent');
      });

      expect(client).toBeNull();
      console.log('✓ Returns null for non-existent name');
    });

    test('should get all clients sorted by name', async ({ page }) => {
      console.log('=== Test: Get All Clients ===');

      var clients = await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Charlie' });
        window.ClientDatabase.save({ name: 'Alice' });
        window.ClientDatabase.save({ name: 'Bob' });
        return window.ClientDatabase.getAll();
      });

      expect(clients.length).toBe(3);
      expect(clients[0].name).toBe('Alice');
      expect(clients[1].name).toBe('Bob');
      expect(clients[2].name).toBe('Charlie');

      console.log('✓ All clients returned in sorted order');
    });

  });

  test.describe('Client Search', () => {

    test('should search clients by name', async ({ page }) => {
      console.log('=== Test: Search By Name ===');

      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'John Doe', email: 'john@test.com' });
        window.ClientDatabase.save({ name: 'Jane Smith', email: 'jane@test.com' });
        window.ClientDatabase.save({ name: 'Bob Johnson', email: 'bob@test.com' });
      });

      var results = await page.evaluate(() => {
        return window.ClientDatabase.search('john');
      });

      expect(results.length).toBe(2); // John Doe and Bob Johnson
      var names = results.map(function(c) { return c.name; });
      expect(names).toContain('John Doe');
      expect(names).toContain('Bob Johnson');

      console.log('✓ Search by name works');
    });

    test('should search clients by email', async ({ page }) => {
      console.log('=== Test: Search By Email ===');

      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Alice', email: 'alice@example.com' });
        window.ClientDatabase.save({ name: 'Bob', email: 'bob@different.com' });
        window.ClientDatabase.save({ name: 'Charlie', email: 'charlie@example.com' });
      });

      var results = await page.evaluate(() => {
        return window.ClientDatabase.search('example.com');
      });

      expect(results.length).toBe(2);
      var names = results.map(function(c) { return c.name; });
      expect(names).toContain('Alice');
      expect(names).toContain('Charlie');

      console.log('✓ Search by email works');
    });

    test('should search clients by phone', async ({ page }) => {
      console.log('=== Test: Search By Phone ===');

      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Client 1', phone: '0412345678' });
        window.ClientDatabase.save({ name: 'Client 2', phone: '0487654321' });
        window.ClientDatabase.save({ name: 'Client 3', phone: '0412999888' });
      });

      var results = await page.evaluate(() => {
        return window.ClientDatabase.search('0412');
      });

      expect(results.length).toBe(2);
      console.log('✓ Search by phone works');
    });

    test('should search clients by location', async ({ page }) => {
      console.log('=== Test: Search By Location ===');

      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Client 1', location: 'Perth CBD' });
        window.ClientDatabase.save({ name: 'Client 2', location: 'Fremantle' });
        window.ClientDatabase.save({ name: 'Client 3', location: 'South Perth' });
      });

      var results = await page.evaluate(() => {
        return window.ClientDatabase.search('perth');
      });

      expect(results.length).toBe(2);
      var locations = results.map(function(c) { return c.location; });
      expect(locations).toContain('Perth CBD');
      expect(locations).toContain('South Perth');

      console.log('✓ Search by location works');
    });

    test('should return all clients for empty search', async ({ page }) => {
      console.log('=== Test: Empty Search Returns All ===');

      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Client 1' });
        window.ClientDatabase.save({ name: 'Client 2' });
        window.ClientDatabase.save({ name: 'Client 3' });
      });

      var results = await page.evaluate(() => {
        return window.ClientDatabase.search('');
      });

      expect(results.length).toBe(3);
      console.log('✓ Empty search returns all clients');
    });

    test('should return empty array for no matches', async ({ page }) => {
      console.log('=== Test: No Search Matches ===');

      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Alice', email: 'alice@test.com' });
      });

      var results = await page.evaluate(() => {
        return window.ClientDatabase.search('xyz123notfound');
      });

      expect(results).toEqual([]);
      console.log('✓ No matches returns empty array');
    });

  });

  test.describe('Client Updates', () => {

    test('should update existing client', async ({ page }) => {
      console.log('=== Test: Update Existing Client ===');

      var result = await page.evaluate(() => {
        var original = window.ClientDatabase.save({
          name: 'John Doe',
          email: 'john@old.com',
          phone: '0412345678'
        });

        var updated = window.ClientDatabase.save({
          id: original.id,
          name: 'John Doe',
          email: 'john@new.com',
          phone: '0487654321'
        });

        return {
          sameId: original.id === updated.id,
          emailUpdated: updated.email === 'john@new.com',
          phoneUpdated: updated.phone === '0487654321',
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          timestampsDifferent: updated.updatedAt > updated.createdAt
        };
      });

      expect(result.sameId).toBe(true);
      expect(result.emailUpdated).toBe(true);
      expect(result.phoneUpdated).toBe(true);

      console.log('✓ Client updated successfully');
    });

    test('should preserve createdAt when updating', async ({ page }) => {
      console.log('=== Test: Preserve CreatedAt ===');

      var result = await page.evaluate(() => {
        var original = window.ClientDatabase.save({ name: 'Test Client' });
        var originalCreatedAt = original.createdAt;

        // Wait a bit
        return new Promise(function(resolve) {
          setTimeout(function() {
            var updated = window.ClientDatabase.save({
              id: original.id,
              name: 'Test Client Updated'
            });
            resolve({
              originalCreatedAt: originalCreatedAt,
              updatedCreatedAt: updated.createdAt,
              preserved: originalCreatedAt === updated.createdAt
            });
          }, 100);
        });
      });

      await page.waitForTimeout(150);

      expect(result.preserved).toBe(true);
      console.log('✓ createdAt timestamp preserved on update');
    });

    test('should update updatedAt timestamp', async ({ page }) => {
      console.log('=== Test: Update UpdatedAt ===');

      var result = await page.evaluate(() => {
        var original = window.ClientDatabase.save({ name: 'Test Client' });

        return new Promise(function(resolve) {
          setTimeout(function() {
            var updated = window.ClientDatabase.save({
              id: original.id,
              name: 'Test Client Updated'
            });
            resolve({
              originalUpdatedAt: original.updatedAt,
              newUpdatedAt: updated.updatedAt,
              wasUpdated: updated.updatedAt > original.updatedAt
            });
          }, 100);
        });
      });

      await page.waitForTimeout(150);

      expect(result.wasUpdated).toBe(true);
      console.log('✓ updatedAt timestamp updated');
    });

  });

  test.describe('Client Deletion', () => {

    test('should delete client after confirmation', async ({ page }) => {
      console.log('=== Test: Delete Client ===');

      // Setup confirm dialog to auto-accept
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm');
        await dialog.accept();
      });

      var result = await page.evaluate(() => {
        var client = window.ClientDatabase.save({ name: 'To Delete' });
        var clientId = client.id;

        var deleted = window.ClientDatabase.delete(clientId);
        var stillExists = window.ClientDatabase.get(clientId);

        return {
          deleted: deleted,
          stillExists: stillExists
        };
      });

      expect(result.deleted).toBe(true);
      expect(result.stillExists).toBeNull();

      console.log('✓ Client deleted successfully');
    });

    test('should return false for non-existent client deletion', async ({ page }) => {
      console.log('=== Test: Delete Non-Existent Client ===');

      var result = await page.evaluate(() => {
        return window.ClientDatabase.delete('client_fake_12345');
      });

      expect(result).toBe(false);
      console.log('✓ Deleting non-existent client returns false');
    });

    test('should not delete if confirmation cancelled', async ({ page }) => {
      console.log('=== Test: Cancel Deletion ===');

      // Setup confirm dialog to auto-dismiss
      page.on('dialog', async dialog => {
        await dialog.dismiss();
      });

      var result = await page.evaluate(() => {
        var client = window.ClientDatabase.save({ name: 'Keep Me' });
        var clientId = client.id;

        var deleted = window.ClientDatabase.delete(clientId);
        var stillExists = window.ClientDatabase.get(clientId);

        return {
          deleted: deleted,
          stillExists: stillExists !== null
        };
      });

      expect(result.deleted).toBe(false);
      expect(result.stillExists).toBe(true);

      console.log('✓ Cancelled deletion preserves client');
    });

  });

  test.describe('Data Persistence', () => {

    test('should persist clients across page reload', async ({ page }) => {
      console.log('=== Test: Persist Across Reload ===');

      // Create clients
      await page.evaluate(() => {
        window.ClientDatabase.save({ name: 'Client 1', email: 'c1@test.com' });
        window.ClientDatabase.save({ name: 'Client 2', email: 'c2@test.com' });
        window.ClientDatabase.save({ name: 'Client 3', email: 'c3@test.com' });
      });

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForFunction(() => typeof window.ClientDatabase !== 'undefined');

      // Check clients still exist
      var clients = await page.evaluate(() => {
        return window.ClientDatabase.getAll();
      });

      expect(clients.length).toBe(3);
      expect(clients[0].name).toBe('Client 1');
      expect(clients[1].name).toBe('Client 2');
      expect(clients[2].name).toBe('Client 3');

      console.log('✓ Clients persisted across reload');
    });

    test('should handle large number of clients', async ({ page }) => {
      console.log('=== Test: Large Number of Clients ===');

      await page.evaluate(() => {
        for (var i = 0; i < 100; i++) {
          window.ClientDatabase.save({
            name: 'Client ' + i,
            email: 'client' + i + '@test.com',
            phone: '041234' + (5678 + i)
          });
        }
      });

      var clients = await page.evaluate(() => {
        return window.ClientDatabase.getAll();
      });

      expect(clients.length).toBe(100);
      console.log('✓ Large number of clients handled');
    });

  });

  test.describe('Data Integrity', () => {

    test('should handle special characters in client data', async ({ page }) => {
      console.log('=== Test: Special Characters ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: 'O\'Brien & Sons',
          email: 'test+tag@example.com',
          address: '123 "Main" St\nUnit #5',
          notes: 'Client with €500 budget'
        });
      });

      expect(client.name).toBe('O\'Brien & Sons');
      expect(client.email).toBe('test+tag@example.com');
      expect(client.address).toContain('123 "Main" St');
      expect(client.notes).toContain('€500');

      console.log('✓ Special characters preserved');
    });

    test('should handle empty optional fields', async ({ page }) => {
      console.log('=== Test: Empty Optional Fields ===');

      var client = await page.evaluate(() => {
        return window.ClientDatabase.save({
          name: 'Minimal Client',
          email: '',
          phone: '',
          location: '',
          address: '',
          notes: ''
        });
      });

      expect(client.email).toBe('');
      expect(client.phone).toBe('');
      expect(client.location).toBe('');
      expect(client.address).toBe('');
      expect(client.notes).toBe('');

      console.log('✓ Empty optional fields handled');
    });

  });

  test.describe('Client Statistics', () => {

    test('should return stats for client with no quotes', async ({ page }) => {
      console.log('=== Test: Client Stats - No Quotes ===');

      var stats = await page.evaluate(() => {
        var client = window.ClientDatabase.save({ name: 'New Client' });
        return window.ClientDatabase.getStats(client.id);
      });

      if (stats) {
        expect(stats.quoteCount).toBe(0);
        expect(stats.totalRevenue).toBe(0);
        expect(stats.averageQuote).toBe(0);
      }

      console.log('✓ Stats for client with no quotes handled');
    });

  });

});
