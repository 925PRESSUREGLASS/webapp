// test-suites.js - Unit Test Suites for Core Modules
// Comprehensive unit tests for TicTacStick modules
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Unit Tests for AppStorage
   */
  describe('AppStorage Module', function(ctx) {
    var testState;

    ctx.beforeEach(function() {
      testState = {
        quoteTitle: 'Test Quote',
        clientName: 'Test Client',
        clientLocation: 'Perth WA',
        baseFee: 120,
        hourlyRate: 95,
        windowLines: [
          { id: 1, type: 'standard', quantity: 10, insidePanes: 10, outsidePanes: 10 }
        ],
        pressureLines: [],
        totalExGst: 450,
        totalIncGst: 495
      };
    });

    ctx.it('should save and load state', function() {
      if (typeof AppStorage === 'undefined') {
        throw new Error('AppStorage not defined');
      }

      AppStorage.saveState(testState);
      var loaded = AppStorage.loadState();

      assert.ok(loaded, 'State should be loaded');
      assert.equal(loaded.quoteTitle, testState.quoteTitle, 'Quote title should match');
      assert.equal(loaded.clientName, testState.clientName, 'Client name should match');
      assert.equal(loaded.baseFee, testState.baseFee, 'Base fee should match');
    });

    ctx.it('should handle invalid state gracefully', function() {
      // Save corrupted data
      localStorage.setItem('tictacstick_autosave_state_v1', 'invalid json');

      var loaded = AppStorage.loadState();
      assert.isNull(loaded, 'Should return null for invalid JSON');
    });

    ctx.it('should clear state correctly', function() {
      AppStorage.saveState(testState);
      AppStorage.clearState();
      var loaded = AppStorage.loadState();

      assert.isNull(loaded, 'State should be null after clearing');
    });

    ctx.afterEach(function() {
      AppStorage.clearState();
    });
  });

  /**
   * Unit Tests for Money (Precision Calculator)
   */
  describe('Money Precision Calculator', function(ctx) {
    ctx.it('should convert dollars to cents correctly', function() {
      if (typeof Money === 'undefined') {
        throw new Error('Money not defined');
      }

      assert.equal(Money.toCents(1.00), 100, '$1.00 should be 100 cents');
      assert.equal(Money.toCents(19.99), 1999, '$19.99 should be 1999 cents');
      assert.equal(Money.toCents(0.50), 50, '$0.50 should be 50 cents');
    });

    ctx.it('should convert cents to dollars correctly', function() {
      assert.equal(Money.fromCents(100), 1.00, '100 cents should be $1.00');
      assert.equal(Money.fromCents(1999), 19.99, '1999 cents should be $19.99');
      assert.equal(Money.fromCents(50), 0.50, '50 cents should be $0.50');
    });

    ctx.it('should sum cents accurately', function() {
      var cents1 = Money.toCents(0.1);
      var cents2 = Money.toCents(0.2);
      var sum = Money.sumCents(cents1, cents2);

      assert.equal(sum, 30, 'Sum should be 30 cents');
      assert.equal(Money.fromCents(sum), 0.30, 'Sum should be $0.30');
    });

    ctx.it('should round dollars to 2 decimals', function() {
      assert.equal(Money.round(1.234), 1.23, 'Should round down');
      assert.equal(Money.round(1.235), 1.24, 'Should round up');
      assert.equal(Money.round(1.999), 2.00, 'Should round up to 2');
    });

    ctx.it('should handle invalid inputs', function() {
      assert.throws(function() {
        Money.toCents('invalid');
      }, 'Should throw on invalid input');

      assert.throws(function() {
        Money.fromCents(NaN);
      }, 'Should throw on NaN');
    });
  });

  /**
   * Unit Tests for TaskManager
   */
  describe('TaskManager Module', function(ctx) {
    var testTask;

    ctx.beforeEach(function() {
      testTask = {
        quoteId: 'test_quote_1',
        type: 'follow-up',
        priority: 'normal',
        title: 'Test Follow-up',
        description: 'Test task description',
        dueDate: new Date().toISOString()
      };
    });

    ctx.it('should create a task', function() {
      if (typeof TaskManager === 'undefined') {
        throw new Error('TaskManager not defined');
      }

      var task = TaskManager.createTask(testTask);

      assert.ok(task, 'Task should be created');
      assert.ok(task.id, 'Task should have ID');
      assert.equal(task.status, 'pending', 'New task should be pending');
      assert.equal(task.title, testTask.title, 'Task title should match');
    });

    ctx.it('should update task status', function() {
      var task = TaskManager.createTask(testTask);
      var updated = TaskManager.updateTaskStatus(task.id, 'completed');

      assert.ok(updated, 'Task should be updated');

      var retrieved = TaskManager.getTask(task.id);
      assert.equal(retrieved.status, 'completed', 'Status should be updated');
    });

    ctx.it('should complete a task with notes', function() {
      var task = TaskManager.createTask(testTask);
      var completed = TaskManager.completeTask(task.id, 'Task completed successfully');

      assert.ok(completed, 'Task should be completed');

      var retrieved = TaskManager.getTask(task.id);
      assert.equal(retrieved.status, 'completed', 'Status should be completed');
      assert.ok(retrieved.completedDate, 'Completion date should be set');
    });

    ctx.it('should get tasks for quote', function() {
      var task = TaskManager.createTask(testTask);
      var tasks = TaskManager.getTasksForQuote('test_quote_1');

      assert.ok(tasks.length > 0, 'Should find tasks for quote');
      assert.equal(tasks[0].quoteId, 'test_quote_1', 'Quote ID should match');
    });

    ctx.it('should get pending tasks', function() {
      TaskManager.createTask(testTask);

      var testTask2 = Object.assign({}, testTask);
      testTask2.title = 'Completed Task';
      var task2 = TaskManager.createTask(testTask2);
      TaskManager.completeTask(task2.id, 'Done');

      var pending = TaskManager.getPendingTasks();
      var hasPendingTestTask = pending.some(function(t) {
        return t.title === 'Test Follow-up';
      });

      assert.ok(hasPendingTestTask, 'Should have pending test task');

      var hasCompletedTask = pending.some(function(t) {
        return t.title === 'Completed Task';
      });

      assert.notOk(hasCompletedTask, 'Should not include completed task');
    });

    ctx.afterEach(function() {
      // Cleanup test tasks
      var tasks = TaskManager.getTasksForQuote('test_quote_1');
      for (var i = 0; i < tasks.length; i++) {
        TaskManager.deleteTask(tasks[i].id);
      }
    });
  });

  /**
   * Unit Tests for Invoice System
   */
  describe('Invoice System', function(ctx) {
    var testQuote;
    var testInvoice;

    ctx.beforeEach(function() {
      testQuote = {
        id: 'test_quote_inv_1',
        quoteTitle: 'Test Quote',
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        clientPhone: '0400000000',
        totalExGst: 500,
        gst: 50,
        totalIncGst: 550,
        windowLines: [
          { description: 'Standard Windows', quantity: 10, total: 500 }
        ],
        pressureLines: []
      };
    });

    ctx.it('should create invoice from quote', function() {
      if (typeof InvoiceSystem === 'undefined') {
        throw new Error('InvoiceSystem not defined');
      }

      var invoice = InvoiceSystem.convertQuoteToInvoice(testQuote);

      assert.ok(invoice, 'Invoice should be created');
      assert.ok(invoice.invoiceNumber, 'Invoice should have number');
      assert.equal(invoice.totalIncGst, testQuote.totalIncGst, 'Total should match');
      assert.equal(invoice.status, 'draft', 'New invoice should be draft');
    });

    ctx.it('should calculate GST correctly', function() {
      var subtotal = 100;
      var gst = Money.calculateGST(subtotal);

      assert.equal(gst, 10, 'GST should be 10% of subtotal');
    });

    ctx.it('should handle invoice status changes', function() {
      var invoice = InvoiceSystem.convertQuoteToInvoice(testQuote);
      InvoiceSystem.saveInvoice(invoice);

      InvoiceSystem.updateInvoiceStatus(invoice.id, 'sent');
      var updated = InvoiceSystem.getInvoice(invoice.id);

      assert.equal(updated.status, 'sent', 'Status should be updated');
    });

    ctx.afterEach(function() {
      // Cleanup - remove test invoice if it exists
      var invoices = InvoiceSystem.getAllInvoices();
      for (var i = 0; i < invoices.length; i++) {
        if (invoices[i].quoteTitle === 'Test Quote') {
          InvoiceSystem.deleteInvoice(invoices[i].id);
        }
      }
    });
  });

  /**
   * Unit Tests for Client Database
   */
  describe('Client Database', function(ctx) {
    var testClient;

    ctx.beforeEach(function() {
      testClient = {
        name: 'Test Client',
        email: 'testclient@example.com',
        phone: '0400000000',
        address: '123 Test St, Perth WA',
        notes: 'Test client notes'
      };
    });

    ctx.it('should add a new client', function() {
      if (typeof ClientDatabase === 'undefined') {
        throw new Error('ClientDatabase not defined');
      }

      var client = ClientDatabase.addClient(testClient);

      assert.ok(client, 'Client should be created');
      assert.ok(client.id, 'Client should have ID');
      assert.equal(client.name, testClient.name, 'Name should match');
      assert.equal(client.email, testClient.email, 'Email should match');
    });

    ctx.it('should search clients by name', function() {
      ClientDatabase.addClient(testClient);

      var results = ClientDatabase.searchClients('Test Client');
      assert.ok(results.length > 0, 'Should find client');
      assert.equal(results[0].name, 'Test Client', 'Name should match');
    });

    ctx.it('should search clients by email', function() {
      ClientDatabase.addClient(testClient);

      var results = ClientDatabase.searchClients('testclient@example.com');
      assert.ok(results.length > 0, 'Should find client by email');
    });

    ctx.it('should update an existing client', function() {
      var client = ClientDatabase.addClient(testClient);

      client.phone = '0411111111';
      var updated = ClientDatabase.updateClient(client.id, client);

      assert.ok(updated, 'Client should be updated');
      assert.equal(updated.phone, '0411111111', 'Phone should be updated');
    });

    ctx.afterEach(function() {
      // Cleanup test clients
      var clients = ClientDatabase.searchClients('Test Client');
      for (var i = 0; i < clients.length; i++) {
        ClientDatabase.deleteClient(clients[i].id);
      }
    });
  });

  /**
   * Unit Tests for Analytics Engine
   */
  describe('Analytics Engine', function(ctx) {
    ctx.it('should generate date range correctly', function() {
      if (typeof AnalyticsEngine === 'undefined') {
        throw new Error('AnalyticsEngine not defined');
      }

      var range = AnalyticsEngine.getDateRange('last_30_days');

      assert.ok(range, 'Date range should be generated');
      assert.ok(range.startDate, 'Should have start date');
      assert.ok(range.endDate, 'Should have end date');
    });

    ctx.it('should calculate revenue metrics', function() {
      var range = AnalyticsEngine.getDateRange('last_30_days');
      var metrics = AnalyticsEngine.calculateRevenueMetrics(range);

      assert.ok(metrics, 'Metrics should be generated');
      assert.isDefined(metrics.totalRevenue, 'Should have total revenue');
      assert.isNumber(metrics.totalRevenue, 'Total revenue should be a number');
    });

    ctx.it('should calculate sales metrics', function() {
      var range = AnalyticsEngine.getDateRange('last_30_days');
      var metrics = AnalyticsEngine.calculateSalesMetrics(range);

      assert.ok(metrics, 'Metrics should be generated');
      assert.isDefined(metrics.quotesGenerated, 'Should have quotes generated');
      assert.isNumber(metrics.quotesGenerated, 'Quotes generated should be a number');
    });
  });

  /**
   * Unit Tests for Data Validation
   */
  describe('Data Validation', function(ctx) {
    ctx.it('should validate required fields', function() {
      if (typeof InvoiceValidation === 'undefined') {
        throw new Error('InvoiceValidation not defined');
      }

      var result = InvoiceValidation.validateField('clientName', '');
      assert.notOk(result.valid, 'Empty client name should be invalid');
    });

    ctx.it('should validate email format', function() {
      var result = InvoiceValidation.validateField('email', 'invalid-email');
      assert.notOk(result.valid, 'Invalid email should fail validation');

      var result2 = InvoiceValidation.validateField('email', 'valid@example.com');
      assert.ok(result2.valid, 'Valid email should pass validation');
    });

    ctx.it('should validate phone format', function() {
      var result = InvoiceValidation.validateField('phone', '123');
      assert.notOk(result.valid, 'Invalid phone should fail validation');

      var result2 = InvoiceValidation.validateField('phone', '0400000000');
      assert.ok(result2.valid, 'Valid phone should pass validation');
    });

    ctx.it('should validate numeric values', function() {
      if (typeof Security === 'undefined' || !Security.validateNumber) {
        console.log('  ⊘ Skipping - Security.validateNumber not available');
        return;
      }

      var result = Security.validateNumber('abc', { min: 0, fieldName: 'Test' });
      assert.equal(result, 0, 'Invalid number should return fallback');

      var result2 = Security.validateNumber('123.45', { min: 0, fieldName: 'Test' });
      assert.equal(result2, 123.45, 'Valid number should be parsed correctly');
    });
  });

  console.log('[TEST-SUITES] Unit tests loaded');
})();
