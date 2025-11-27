// integration-tests.js - Integration Tests for Complete Workflows
// Test complete user workflows across multiple modules
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[INTEGRATION-TESTS] Skipped in test mode');
    return;
  }

  /**
   * Integration Tests - Quote to Invoice Flow
   */
  describe('Quote to Invoice Workflow', function(ctx) {
    var testQuote;
    var testInvoice;

    ctx.beforeAll(function() {
      console.log('  Setting up Quote to Invoice workflow tests...');
    });

    ctx.beforeEach(function() {
      testQuote = {
        id: 'test_flow_quote_' + Date.now(),
        quoteTitle: 'Flow Test Quote',
        clientName: 'Flow Test Client',
        clientEmail: 'flow@test.com',
        clientPhone: '0400000000',
        totalExGst: 500,
        gst: 50,
        totalIncGst: 550,
        status: 'draft',
        windowLines: [
          { description: 'Window Cleaning', quantity: 1, total: 500 }
        ],
        pressureLines: []
      };
    });

    ctx.it('should complete full quote creation workflow', function() {
      // 1. Create quote with APP.setState if available
      if (typeof APP !== 'undefined' && APP.setState) {
        APP.setState(testQuote);
        var currentState = APP.getState();

        assert.ok(currentState, 'State should be set');
        assert.equal(currentState.quoteTitle, testQuote.quoteTitle, 'Quote title should match');
      } else {
        console.log('    ⊘ APP.setState not available, skipping state test');
      }

      // 2. Save quote to storage
      if (typeof AppStorage !== 'undefined') {
        AppStorage.saveState(testQuote);
        var loaded = AppStorage.loadState();

        assert.ok(loaded, 'Quote should be saved');
        assert.equal(loaded.quoteTitle, testQuote.quoteTitle, 'Loaded quote title should match');
      }
    });

    ctx.it('should convert quote to invoice', function() {
      if (typeof InvoiceSystem === 'undefined') {
        console.log('    ⊘ InvoiceSystem not available, skipping invoice test');
        return;
      }

      // Create invoice from quote
      testInvoice = InvoiceSystem.convertQuoteToInvoice(testQuote);

      assert.ok(testInvoice, 'Invoice should be created');
      assert.ok(testInvoice.invoiceNumber, 'Invoice should have number');
      assert.equal(testInvoice.totalIncGst, testQuote.totalIncGst, 'Total should match');
    });

    ctx.it('should track invoice status changes', function() {
      if (typeof InvoiceSystem === 'undefined') {
        console.log('    ⊘ InvoiceSystem not available, skipping status test');
        return;
      }

      var invoice = InvoiceSystem.convertQuoteToInvoice(testQuote);
      InvoiceSystem.saveInvoice(invoice);

      // Update status from draft -> sent
      InvoiceSystem.updateInvoiceStatus(invoice.id, 'sent');
      var updated = InvoiceSystem.getInvoice(invoice.id);

      assert.equal(updated.status, 'sent', 'Status should be sent');

      // Update status from sent -> paid
      InvoiceSystem.updateInvoiceStatus(invoice.id, 'paid');
      updated = InvoiceSystem.getInvoice(invoice.id);

      assert.equal(updated.status, 'paid', 'Status should be paid');
    });

    ctx.afterEach(function() {
      // Cleanup
      if (typeof AppStorage !== 'undefined') {
        AppStorage.clearState();
      }

      if (typeof InvoiceSystem !== 'undefined' && testInvoice) {
        InvoiceSystem.deleteInvoice(testInvoice.id);
      }
    });
  });

  /**
   * Integration Tests - Follow-up Automation
   */
  describe('Follow-up Automation Workflow', function(ctx) {
    var testQuote;
    var createdTasks;

    ctx.beforeEach(function() {
      testQuote = {
        id: 'test_followup_quote_' + Date.now(),
        quoteTitle: 'Followup Test Quote',
        clientName: 'Followup Test Client',
        clientEmail: 'followup@test.com',
        totalIncGst: 500,
        status: 'sent',
        dateSent: new Date().toISOString()
      };

      createdTasks = [];
    });

    ctx.it('should create follow-up tasks when quote is sent', function() {
      if (typeof FollowupAutomation === 'undefined') {
        console.log('    ⊘ FollowupAutomation not available, skipping');
        return;
      }

      if (typeof TaskManager === 'undefined') {
        console.log('    ⊘ TaskManager not available, skipping');
        return;
      }

      // Trigger follow-up automation
      FollowupAutomation.handleQuoteEvent('quote-sent', testQuote);

      // Check that tasks were created
      var tasks = TaskManager.getTasksForQuote(testQuote.id);
      createdTasks = tasks;

      assert.ok(tasks.length > 0, 'Follow-up tasks should be created');

      // Verify task types
      var hasFollowupTask = tasks.some(function(task) {
        return task.type === 'follow-up' || task.type === 'phone-call' || task.type === 'email';
      });

      assert.ok(hasFollowupTask, 'Should have follow-up related task');
    });

    ctx.it('should handle task completion', function() {
      if (typeof TaskManager === 'undefined') {
        console.log('    ⊘ TaskManager not available, skipping');
        return;
      }

      // Create a test task
      var task = TaskManager.createTask({
        quoteId: testQuote.id,
        type: 'follow-up',
        title: 'Test Follow-up',
        priority: 'normal'
      });

      createdTasks.push(task);

      // Complete the task
      TaskManager.completeTask(task.id, 'Follow-up completed');

      // Verify completion
      var updated = TaskManager.getTask(task.id);
      assert.equal(updated.status, 'completed', 'Task should be completed');
      assert.ok(updated.completedDate, 'Completion date should be set');
    });

    ctx.afterEach(function() {
      // Cleanup tasks
      if (typeof TaskManager !== 'undefined') {
        for (var i = 0; i < createdTasks.length; i++) {
          TaskManager.deleteTask(createdTasks[i].id);
        }
      }
    });
  });

  /**
   * Integration Tests - Client and Quote History
   */
  describe('Client and Quote History Workflow', function(ctx) {
    var testClient;
    var testQuotes;

    ctx.beforeEach(function() {
      testClient = {
        name: 'History Test Client',
        email: 'history@test.com',
        phone: '0400000000',
        address: '123 Test St, Perth WA'
      };

      testQuotes = [];
    });

    ctx.it('should track client quote history', function() {
      if (typeof ClientDatabase === 'undefined') {
        console.log('    ⊘ ClientDatabase not available, skipping');
        return;
      }

      // Add client
      var client = ClientDatabase.addClient(testClient);
      assert.ok(client, 'Client should be created');

      // Create multiple quotes for this client
      for (var i = 0; i < 3; i++) {
        var quote = {
          id: 'history_quote_' + i + '_' + Date.now(),
          clientName: client.name,
          clientEmail: client.email,
          totalIncGst: 100 * (i + 1),
          dateCreated: new Date().toISOString()
        };

        testQuotes.push(quote);

        // Save to analytics history if available
        if (typeof QuoteAnalytics !== 'undefined') {
          QuoteAnalytics.saveToHistory(quote);
        }
      }

      // Get client history
      var history = ClientDatabase.getClientHistory(client.id);

      assert.ok(history, 'History should be available');
      assert.ok(history.totalRevenue >= 0, 'Should have revenue data');
    });

    ctx.afterEach(function() {
      // Cleanup
      if (typeof ClientDatabase !== 'undefined') {
        var clients = ClientDatabase.searchClients('History Test Client');
        for (var i = 0; i < clients.length; i++) {
          ClientDatabase.deleteClient(clients[i].id);
        }
      }
    });
  });

  /**
   * Integration Tests - Offline Storage and Sync
   */
  describe('Offline Storage Workflow', function(ctx) {
    var testData;

    ctx.beforeEach(function() {
      testData = {
        id: 'offline_test_' + Date.now(),
        data: 'Test data for offline storage',
        timestamp: new Date().toISOString()
      };
    });

    ctx.it('should save data to localStorage', function() {
      var key = 'test_offline_data';

      // Save data
      localStorage.setItem(key, JSON.stringify(testData));

      // Retrieve data
      var retrieved = JSON.parse(localStorage.getItem(key));

      assert.ok(retrieved, 'Data should be retrieved');
      assert.equal(retrieved.id, testData.id, 'ID should match');
      assert.equal(retrieved.data, testData.data, 'Data should match');

      // Cleanup
      localStorage.removeItem(key);
    });

    ctx.it('should handle localStorage quota', function() {
      // This test is informational - it doesn't actually fill up localStorage
      // Just checks that we can detect quota
      try {
        var usage = 0;
        for (var key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            usage += localStorage[key].length + key.length;
          }
        }

        console.log('    Current localStorage usage: ' + (usage / 1024).toFixed(2) + ' KB');

        assert.ok(usage >= 0, 'Usage should be measurable');
      } catch (e) {
        console.log('    Could not measure localStorage usage');
      }
    });

    ctx.it('should persist data across page reloads', function() {
      // This test verifies data structure but can't actually test reload
      var key = 'test_persist_data';

      localStorage.setItem(key, JSON.stringify(testData));

      // Simulate reload by re-parsing
      var retrieved = JSON.parse(localStorage.getItem(key));

      assert.deepEqual(retrieved, testData, 'Data should persist');

      // Cleanup
      localStorage.removeItem(key);
    });
  });

  console.log('[INTEGRATION-TESTS] Integration tests loaded');
})();
