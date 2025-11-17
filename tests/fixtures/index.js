/**
 * Fixtures Index
 *
 * Convenience export for importing multiple fixtures at once.
 *
 * Usage:
 *   // Import everything
 *   const { test, expect, factories, testData, helpers } = require('./fixtures');
 *
 *   // Or import selectively
 *   const { test } = require('./fixtures');
 *   const { createQuote } = require('./fixtures/factories');
 */

// Re-export test and expect from test-base
const { test, expect } = require('./test-base');

// Import matchers to extend expect (side effect)
require('./matchers');

// Import all factories
const factories = require('./factories');

// Import all test data scenarios
const testData = require('./test-data');

// Import helper creator
const { createHelpers } = require('./helpers');

// Export everything
module.exports = {
  // Core test utilities
  test,
  expect,

  // Factories (as namespace and individual exports)
  factories,
  ...factories,

  // Test data scenarios (as namespace and individual exports)
  testData,
  ...testData,

  // Helper creator
  createHelpers
};
