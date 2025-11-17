/**
 * Test Helper Functions
 *
 * Common operations for interacting with the TicTacStick app in tests.
 * These helpers abstract away the complexity of page.evaluate() calls.
 *
 * Usage:
 *   const helpers = createHelpers(page);
 *   const result = await helpers.calculateQuote(quoteData);
 */

/**
 * Create helper functions bound to a Playwright page
 *
 * @param {Page} page - Playwright page object
 * @returns {Object} Helper functions
 */
function createHelpers(page) {
  return {
    /**
     * Load quote data into app state
     *
     * @param {Object} quoteData - Quote data to load
     * @returns {Promise<boolean>} Success status
     */
    loadQuote: async (quoteData) => {
      return await page.evaluate((data) => {
        window.APP.modules.app.state = data;
        return true;
      }, quoteData);
    },

    /**
     * Calculate quote totals
     * Loads quote data and returns calculation results
     *
     * @param {Object} quoteData - Quote data to calculate
     * @returns {Promise<Object>} Calculation results
     */
    calculateQuote: async (quoteData) => {
      await page.evaluate((data) => {
        window.APP.modules.app.state = data;
      }, quoteData);

      return await page.evaluate(() => {
        return window.APP.modules.calc.calculateTotals(window.APP.modules.app.state);
      });
    },

    /**
     * Get current app state
     *
     * @returns {Promise<Object>} Current app state
     */
    getState: async () => {
      return await page.evaluate(() => {
        return window.APP.modules.app.state;
      });
    },

    /**
     * Set app state
     *
     * @param {Object} state - State to set
     * @returns {Promise<boolean>} Success status
     */
    setState: async (state) => {
      return await page.evaluate((data) => {
        window.APP.modules.app.state = data;
        return true;
      }, state);
    },

    /**
     * Save current quote to history
     *
     * @param {string} quoteName - Name for the saved quote
     * @returns {Promise<Object>} Saved quote object with ID
     */
    saveQuote: async (quoteName) => {
      return await page.evaluate((name) => {
        return window.APP.modules.app.saveQuoteToHistory(name);
      }, quoteName);
    },

    /**
     * Get quote history from storage
     *
     * @returns {Promise<Array>} Array of saved quotes
     */
    getQuoteHistory: async () => {
      return await page.evaluate(() => {
        return window.APP.modules.storage.get('quote-history') || [];
      });
    },

    /**
     * Load quote from history by ID
     *
     * @param {string} quoteId - Quote ID to load
     * @returns {Promise<Object>} Loaded quote data
     */
    loadQuoteFromHistory: async (quoteId) => {
      return await page.evaluate((id) => {
        const history = window.APP.modules.storage.get('quote-history') || [];
        const quote = history.find(q => q.id === id);
        if (quote) {
          window.APP.modules.app.state = quote.data;
          return quote.data;
        }
        return null;
      }, quoteId);
    },

    /**
     * Delete quote from history
     *
     * @param {string} quoteId - Quote ID to delete
     * @returns {Promise<boolean>} Success status
     */
    deleteQuote: async (quoteId) => {
      return await page.evaluate((id) => {
        let history = window.APP.modules.storage.get('quote-history') || [];
        history = history.filter(q => q.id !== id);
        window.APP.modules.storage.set('quote-history', history);
        return true;
      }, quoteId);
    },

    /**
     * Create invoice from current quote
     *
     * @param {Object} invoiceData - Additional invoice data
     * @returns {Promise<Object>} Created invoice
     */
    createInvoice: async (invoiceData = {}) => {
      return await page.evaluate((data) => {
        const invoice = window.APP.modules.invoice.createFromQuote();
        // Merge in any override data
        Object.assign(invoice, data);
        return invoice;
      }, invoiceData);
    },

    /**
     * Create invoice from quote data (without loading to state)
     *
     * @param {Object} quoteData - Quote data
     * @returns {Promise<Object>} Created invoice
     */
    createInvoiceFromQuote: async (quoteData) => {
      return await page.evaluate((data) => {
        // Temporarily load quote
        const oldState = window.APP.modules.app.state;
        window.APP.modules.app.state = data;

        // Create invoice
        const invoice = window.APP.modules.invoice.createFromQuote();

        // Restore state
        window.APP.modules.app.state = oldState;

        return invoice;
      }, quoteData);
    },

    /**
     * Save invoice to database
     *
     * @param {Object} invoice - Invoice to save
     * @returns {Promise<string>} Invoice ID
     */
    saveInvoice: async (invoice) => {
      return await page.evaluate((inv) => {
        window.APP.modules.invoice.saveInvoice(inv);
        return inv.invoiceId;
      }, invoice);
    },

    /**
     * Get invoice by ID
     *
     * @param {string} invoiceId - Invoice ID
     * @returns {Promise<Object>} Invoice object
     */
    getInvoice: async (invoiceId) => {
      return await page.evaluate((id) => {
        const db = window.APP.modules.storage.get('invoice-database') || {};
        return db[id] || null;
      }, invoiceId);
    },

    /**
     * Get all invoices
     *
     * @returns {Promise<Object>} Invoice database object
     */
    getAllInvoices: async () => {
      return await page.evaluate(() => {
        return window.APP.modules.storage.get('invoice-database') || {};
      });
    },

    /**
     * Add payment to invoice
     *
     * @param {string} invoiceId - Invoice ID
     * @param {Object} paymentData - Payment data
     * @returns {Promise<Object>} Updated invoice
     */
    addPayment: async (invoiceId, paymentData) => {
      return await page.evaluate((args) => {
        return window.APP.modules.invoice.addPayment(args.invoiceId, args.payment);
      }, { invoiceId, payment: paymentData });
    },

    /**
     * Update invoice status
     *
     * @param {string} invoiceId - Invoice ID
     * @param {string} status - New status
     * @returns {Promise<Object>} Updated invoice
     */
    updateInvoiceStatus: async (invoiceId, status) => {
      return await page.evaluate((args) => {
        const db = window.APP.modules.storage.get('invoice-database') || {};
        if (db[args.id]) {
          db[args.id].status = args.status;
          window.APP.modules.storage.set('invoice-database', db);
          return db[args.id];
        }
        return null;
      }, { id: invoiceId, status });
    },

    /**
     * Get value from LocalStorage
     *
     * @param {string} key - Storage key
     * @returns {Promise<any>} Stored value
     */
    getStorage: async (key) => {
      return await page.evaluate((k) => {
        return window.APP.modules.storage.get(k);
      }, key);
    },

    /**
     * Set value in LocalStorage
     *
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Promise<boolean>} Success status
     */
    setStorage: async (key, value) => {
      return await page.evaluate((args) => {
        window.APP.modules.storage.set(args.key, args.value);
        return true;
      }, { key, value });
    },

    /**
     * Clear all LocalStorage
     *
     * @returns {Promise<boolean>} Success status
     */
    clearStorage: async () => {
      return await page.evaluate(() => {
        localStorage.clear();
        return true;
      });
    },

    /**
     * Clear specific storage key
     *
     * @param {string} key - Storage key to clear
     * @returns {Promise<boolean>} Success status
     */
    clearStorageKey: async (key) => {
      return await page.evaluate((k) => {
        localStorage.removeItem(k);
        return true;
      }, key);
    },

    /**
     * Wait for calculation to complete
     *
     * @param {number} timeout - Timeout in ms (default 2000)
     * @returns {Promise<void>}
     */
    waitForCalculation: async (timeout = 2000) => {
      await page.waitForFunction(() => {
        return window.APP.modules.app.state.calculations !== null &&
               window.APP.modules.app.state.calculations !== undefined;
      }, { timeout });
    },

    /**
     * Trigger autosave manually
     *
     * @returns {Promise<boolean>} Success status
     */
    triggerAutosave: async () => {
      return await page.evaluate(() => {
        if (window.APP.modules.app.saveState) {
          window.APP.modules.app.saveState();
          return true;
        }
        return false;
      });
    },

    /**
     * Check if APP is initialized
     *
     * @returns {Promise<boolean>} Initialization status
     */
    isAppReady: async () => {
      return await page.evaluate(() => {
        return window.APP !== undefined &&
               window.APP.initialized === true;
      });
    },

    /**
     * Get APP modules status
     *
     * @returns {Promise<Object>} Object with module names and loaded status
     */
    getModulesStatus: async () => {
      return await page.evaluate(() => {
        const modules = {};
        const required = ['storage', 'app', 'calc', 'ui', 'invoice'];

        required.forEach(mod => {
          modules[mod] = window.APP.modules[mod] !== undefined &&
                         window.APP.modules[mod] !== null;
        });

        return modules;
      });
    },

    /**
     * Click a UI element by selector
     *
     * @param {string} selector - CSS selector
     * @returns {Promise<void>}
     */
    click: async (selector) => {
      await page.click(selector);
    },

    /**
     * Fill an input field
     *
     * @param {string} selector - CSS selector
     * @param {string} value - Value to fill
     * @returns {Promise<void>}
     */
    fill: async (selector, value) => {
      await page.fill(selector, value);
    },

    /**
     * Get text content of element
     *
     * @param {string} selector - CSS selector
     * @returns {Promise<string>} Text content
     */
    getText: async (selector) => {
      return await page.textContent(selector);
    },

    /**
     * Wait for selector to be visible
     *
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in ms
     * @returns {Promise<void>}
     */
    waitForSelector: async (selector, timeout = 5000) => {
      await page.waitForSelector(selector, { timeout, state: 'visible' });
    },

    /**
     * Take a screenshot (useful for debugging failing tests)
     *
     * @param {string} name - Screenshot name
     * @returns {Promise<Buffer>} Screenshot buffer
     */
    screenshot: async (name) => {
      return await page.screenshot({ path: `test-results/${name}.png` });
    },

    /**
     * Get console logs (for debugging)
     *
     * @returns {Promise<Array>} Console messages
     */
    getConsoleLogs: async () => {
      // This requires setting up a listener, so we'll return a helper
      const logs = [];
      page.on('console', msg => logs.push({
        type: msg.type(),
        text: msg.text()
      }));
      return logs;
    },

    /**
     * Execute arbitrary function in page context
     *
     * @param {Function} fn - Function to execute
     * @param {any} args - Arguments to pass
     * @returns {Promise<any>} Function result
     */
    evaluate: async (fn, args) => {
      return await page.evaluate(fn, args);
    }
  };
}

module.exports = { createHelpers };
