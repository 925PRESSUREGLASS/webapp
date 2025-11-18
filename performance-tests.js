// performance-tests.js - Performance and Load Tests
// Test application performance under various conditions
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Performance Tests
   */
  describe('Performance - LocalStorage Operations', function(ctx) {
    ctx.it('should save multiple quotes quickly', function() {
      if (typeof AppStorage === 'undefined') {
        console.log('    ⊘ AppStorage not available, skipping');
        return;
      }

      var startTime = Date.now();
      var testCount = 50;

      // Create and save 50 test quotes
      for (var i = 0; i < testCount; i++) {
        var quote = {
          id: 'perf_quote_' + i,
          quoteTitle: 'Performance Test ' + i,
          clientName: 'Client ' + i,
          totalIncGst: Math.random() * 1000,
          windowLines: [],
          pressureLines: []
        };

        AppStorage.saveState(quote);
      }

      var saveTime = Date.now() - startTime;
      console.log('    Time to save ' + testCount + ' quotes: ' + saveTime + 'ms');

      assert.ok(saveTime < 1000, 'Should save ' + testCount + ' quotes in under 1 second');

      // Cleanup
      AppStorage.clearState();
    });

    ctx.it('should load state quickly', function() {
      if (typeof AppStorage === 'undefined') {
        console.log('    ⊘ AppStorage not available, skipping');
        return;
      }

      // Save a large state
      var largeState = {
        quoteTitle: 'Large Quote',
        windowLines: [],
        pressureLines: []
      };

      // Add 100 line items
      for (var i = 0; i < 100; i++) {
        largeState.windowLines.push({
          id: i,
          type: 'standard',
          quantity: 10,
          total: 100
        });
      }

      AppStorage.saveState(largeState);

      // Measure load time
      var startTime = Date.now();
      var loaded = AppStorage.loadState();
      var loadTime = Date.now() - startTime;

      console.log('    Time to load large state: ' + loadTime + 'ms');

      assert.ok(loaded, 'State should be loaded');
      assert.ok(loadTime < 200, 'Should load in under 200ms');

      // Cleanup
      AppStorage.clearState();
    });

    ctx.it('should handle JSON parsing efficiently', function() {
      var testData = {
        items: []
      };

      // Create array with 1000 items
      for (var i = 0; i < 1000; i++) {
        testData.items.push({
          id: i,
          data: 'Test data string ' + i,
          value: Math.random() * 100
        });
      }

      var startTime = Date.now();

      // Stringify
      var json = JSON.stringify(testData);
      var stringifyTime = Date.now() - startTime;

      startTime = Date.now();

      // Parse
      var parsed = JSON.parse(json);
      var parseTime = Date.now() - startTime;

      console.log('    JSON.stringify time: ' + stringifyTime + 'ms');
      console.log('    JSON.parse time: ' + parseTime + 'ms');

      assert.ok(stringifyTime < 100, 'Stringify should take < 100ms');
      assert.ok(parseTime < 100, 'Parse should take < 100ms');
      assert.equal(parsed.items.length, 1000, 'All items should be parsed');
    });
  });

  /**
   * Performance Tests - Calculations
   */
  describe('Performance - Calculation Speed', function(ctx) {
    ctx.it('should perform money calculations quickly', function() {
      if (typeof Money === 'undefined') {
        console.log('    ⊘ Money not available, skipping');
        return;
      }

      var startTime = Date.now();
      var iterations = 10000;

      for (var i = 0; i < iterations; i++) {
        var cents1 = Money.toCents(19.99);
        var cents2 = Money.toCents(5.50);
        var sum = Money.sumCents(cents1, cents2);
        var dollars = Money.fromCents(sum);
      }

      var calcTime = Date.now() - startTime;
      console.log('    Time for ' + iterations + ' calculations: ' + calcTime + 'ms');

      assert.ok(calcTime < 500, 'Should complete ' + iterations + ' calculations in under 500ms');
    });

    ctx.it('should calculate quote totals quickly', function() {
      if (typeof APP === 'undefined' || !APP.recalculate) {
        console.log('    ⊘ APP.recalculate not available, skipping');
        return;
      }

      // Set up a quote with multiple line items
      var state = {
        baseFee: 120,
        hourlyRate: 95,
        windowLines: [],
        pressureLines: []
      };

      // Add 50 window lines
      for (var i = 0; i < 50; i++) {
        state.windowLines.push({
          id: i,
          type: 'standard',
          quantity: 10,
          insidePanes: 10,
          outsidePanes: 10,
          highReach: false
        });
      }

      if (APP.setState) {
        APP.setState(state);
      }

      var startTime = Date.now();
      APP.recalculate();
      var calcTime = Date.now() - startTime;

      console.log('    Time to recalculate 50 line items: ' + calcTime + 'ms');

      assert.ok(calcTime < 200, 'Recalculation should take under 200ms');
    });
  });

  /**
   * Performance Tests - Search Operations
   */
  describe('Performance - Search and Filter', function(ctx) {
    var testClients;

    ctx.beforeAll(function() {
      if (typeof ClientDatabase === 'undefined') {
        console.log('    ⊘ ClientDatabase not available, skipping search tests');
        return;
      }

      testClients = [];

      // Create 100 test clients
      for (var i = 0; i < 100; i++) {
        var client = ClientDatabase.addClient({
          name: 'Test Client ' + i,
          email: 'client' + i + '@test.com',
          phone: '040000' + String(i).padStart(4, '0'),
          address: i + ' Test Street, Perth WA'
        });

        testClients.push(client);
      }
    });

    ctx.it('should search clients quickly', function() {
      if (typeof ClientDatabase === 'undefined') {
        console.log('    ⊘ ClientDatabase not available, skipping');
        return;
      }

      var startTime = Date.now();

      // Search for clients
      var results = ClientDatabase.searchClients('Test Client');

      var searchTime = Date.now() - startTime;
      console.log('    Time to search 100 clients: ' + searchTime + 'ms');

      assert.ok(results.length > 0, 'Should find clients');
      assert.ok(searchTime < 100, 'Search should take under 100ms');
    });

    ctx.it('should filter clients by criteria quickly', function() {
      if (typeof ClientDatabase === 'undefined') {
        console.log('    ⊘ ClientDatabase not available, skipping');
        return;
      }

      var startTime = Date.now();

      // Get all clients and filter manually
      var allClients = ClientDatabase.getAllClients();
      var filtered = allClients.filter(function(client) {
        return client.name.indexOf('Test Client') > -1;
      });

      var filterTime = Date.now() - startTime;
      console.log('    Time to filter 100 clients: ' + filterTime + 'ms');

      assert.ok(filtered.length > 0, 'Should find filtered clients');
      assert.ok(filterTime < 100, 'Filter should take under 100ms');
    });

    ctx.afterAll(function() {
      // Cleanup test clients
      if (typeof ClientDatabase !== 'undefined' && testClients) {
        for (var i = 0; i < testClients.length; i++) {
          ClientDatabase.deleteClient(testClients[i].id);
        }
      }
    });
  });

  /**
   * Performance Tests - DOM Operations
   */
  describe('Performance - DOM Rendering', function(ctx) {
    ctx.it('should create DOM elements quickly', function() {
      var startTime = Date.now();
      var container = document.createElement('div');

      // Create 100 elements
      for (var i = 0; i < 100; i++) {
        var el = document.createElement('div');
        el.className = 'test-item';
        el.textContent = 'Item ' + i;
        container.appendChild(el);
      }

      var createTime = Date.now() - startTime;
      console.log('    Time to create 100 DOM elements: ' + createTime + 'ms');

      assert.ok(createTime < 100, 'Should create 100 elements in under 100ms');
      assert.equal(container.children.length, 100, 'Should have 100 children');
    });

    ctx.it('should update DOM elements quickly', function() {
      var container = document.createElement('div');

      // Create 100 elements
      for (var i = 0; i < 100; i++) {
        var el = document.createElement('div');
        el.className = 'test-item';
        el.textContent = 'Item ' + i;
        container.appendChild(el);
      }

      var startTime = Date.now();

      // Update all elements
      var items = container.querySelectorAll('.test-item');
      for (var i = 0; i < items.length; i++) {
        items[i].textContent = 'Updated Item ' + i;
      }

      var updateTime = Date.now() - startTime;
      console.log('    Time to update 100 DOM elements: ' + updateTime + 'ms');

      assert.ok(updateTime < 100, 'Should update 100 elements in under 100ms');
    });
  });

  /**
   * Performance Tests - Analytics
   */
  describe('Performance - Analytics Generation', function(ctx) {
    ctx.it('should generate dashboard quickly', function() {
      if (typeof AnalyticsEngine === 'undefined') {
        console.log('    ⊘ AnalyticsEngine not available, skipping');
        return;
      }

      var startTime = Date.now();

      var range = AnalyticsEngine.getDateRange('last_30_days');
      var dashboard = AnalyticsEngine.generateDashboardData('last_30_days');

      var genTime = Date.now() - startTime;
      console.log('    Time to generate analytics dashboard: ' + genTime + 'ms');

      assert.ok(dashboard, 'Dashboard should be generated');
      assert.ok(genTime < 2000, 'Dashboard should generate in under 2 seconds');
    });

    ctx.it('should calculate metrics efficiently', function() {
      if (typeof AnalyticsEngine === 'undefined') {
        console.log('    ⊘ AnalyticsEngine not available, skipping');
        return;
      }

      var range = AnalyticsEngine.getDateRange('last_30_days');

      var startTime = Date.now();

      var revenue = AnalyticsEngine.calculateRevenueMetrics(range);
      var sales = AnalyticsEngine.calculateSalesMetrics(range);

      var calcTime = Date.now() - startTime;
      console.log('    Time to calculate metrics: ' + calcTime + 'ms');

      assert.ok(revenue, 'Revenue metrics should be calculated');
      assert.ok(sales, 'Sales metrics should be calculated');
      assert.ok(calcTime < 1000, 'Metrics should calculate in under 1 second');
    });
  });

  /**
   * Memory Usage Tests
   */
  describe('Performance - Memory Usage', function(ctx) {
    ctx.it('should not create memory leaks in calculations', function() {
      if (typeof Money === 'undefined') {
        console.log('    ⊘ Money not available, skipping');
        return;
      }

      var initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Perform many calculations
      for (var i = 0; i < 10000; i++) {
        var cents = Money.toCents(Math.random() * 100);
        var dollars = Money.fromCents(cents);
      }

      var finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      var memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      if (performance.memory) {
        console.log('    Memory increase: ' + memoryIncrease.toFixed(2) + ' MB');
        assert.ok(memoryIncrease < 10, 'Memory increase should be under 10 MB');
      } else {
        console.log('    ⊘ Memory API not available in this browser');
      }
    });

    ctx.it('should clean up DOM references', function() {
      var initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      // Create and destroy elements
      for (var i = 0; i < 1000; i++) {
        var el = document.createElement('div');
        el.textContent = 'Test ' + i;
        // Don't append - let it be garbage collected
        el = null;
      }

      // Force garbage collection if available (not in all browsers)
      if (window.gc) {
        window.gc();
      }

      var finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      var memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      if (performance.memory) {
        console.log('    Memory increase after cleanup: ' + memoryIncrease.toFixed(2) + ' MB');
        assert.ok(memoryIncrease < 5, 'Memory should be cleaned up');
      } else {
        console.log('    ⊘ Memory API not available in this browser');
      }
    });
  });

  console.log('[PERFORMANCE-TESTS] Performance tests loaded');
})();
