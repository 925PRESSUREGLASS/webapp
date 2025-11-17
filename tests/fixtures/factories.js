/**
 * Test Data Factories
 *
 * Functions to create valid test objects with sensible defaults.
 * All factories accept an overrides object to customize specific fields.
 *
 * Usage:
 *   const quote = createQuote({ jobSettings: { clientName: 'Custom Name' } });
 *   const window = createWindowLine({ count: 10, type: 'awning_casement' });
 */

/**
 * Generate a unique ID for test objects
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateId(prefix) {
  return `${prefix}_test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Deep merge two objects
 * @param {Object} defaults - Default values
 * @param {Object} overrides - Override values
 * @returns {Object} Merged object
 */
function deepMerge(defaults, overrides) {
  const result = { ...defaults };

  for (const key in overrides) {
    if (overrides[key] && typeof overrides[key] === 'object' && !Array.isArray(overrides[key])) {
      result[key] = deepMerge(defaults[key] || {}, overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  }

  return result;
}

/**
 * Create a complete quote with all required fields
 *
 * @param {Object} overrides - Fields to override
 * @param {Object} overrides.jobSettings - Job settings overrides
 * @param {Array} overrides.windows - Window lines (use createWindowLine)
 * @param {Array} overrides.pressure - Pressure lines (use createPressureLine)
 * @param {Object} overrides.appliedModifiers - Modifier overrides
 * @returns {Object} Complete quote object
 */
function createQuote(overrides = {}) {
  const defaults = {
    jobSettings: {
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      clientPhone: '+61412345678',
      propertyAddress: '123 Test St, Perth WA 6000',
      jobType: 'residential',
      urgency: 'standard',
      season: 'regular'
    },
    windowLines: [],
    pressureLines: [],
    appliedModifiers: {
      seasonalMultiplier: 1.0,
      customerTypeDiscount: 0.0,
      rushPremiumPercent: 0
    }
  };

  const merged = deepMerge(defaults, overrides);

  // Handle windows/pressure array shorthand
  if (overrides.windows) {
    merged.windowLines = overrides.windows;
  }
  if (overrides.pressure) {
    merged.pressureLines = overrides.pressure;
  }

  return merged;
}

/**
 * Create a window cleaning line item
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Window line object
 */
function createWindowLine(overrides = {}) {
  const defaults = {
    id: generateId('win'),
    type: 'standard_sliding',
    count: 8,
    width: 120,
    height: 150,
    paneConfig: 'both',
    condition: 'standard',
    accessType: 'ground',
    storey: 1,
    hasScreens: false,
    hasGrids: false,
    notes: ''
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a pressure cleaning line item
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Pressure line object
 */
function createPressureLine(overrides = {}) {
  const defaults = {
    id: generateId('prs'),
    surfaceType: 'driveway_concrete',
    materialType: 'concrete',
    area: 45.5,
    condition: 'standard',
    stainingType: [],
    slope: 'level',
    drainageQuality: 'good',
    waterAccess: 'onsite',
    hoseRunDistance: 15,
    notes: ''
  };

  return { ...defaults, ...overrides };
}

/**
 * Create a client record
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Client object
 */
function createClient(overrides = {}) {
  const defaults = {
    id: generateId('client'),
    firstName: 'Test',
    lastName: 'Client',
    email: 'test@example.com',
    phone: '+61412345678',
    customerType: 'residential',
    segment: 'new',
    addresses: [{
      street: '123 Test St',
      suburb: 'Perth',
      state: 'WA',
      postcode: '6000'
    }]
  };

  return deepMerge(defaults, overrides);
}

/**
 * Create an invoice
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Invoice object
 */
function createInvoice(overrides = {}) {
  const invoiceNumber = Math.floor(Math.random() * 1000000);
  const now = new Date();
  const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const defaults = {
    invoiceId: `INV-2025-${String(invoiceNumber).padStart(6, '0')}`,
    clientName: 'Test Client',
    clientEmail: 'test@example.com',
    clientPhone: '+61412345678',
    propertyAddress: '123 Test St, Perth WA 6000',
    status: 'draft',
    issueDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    subtotal: 500.00,
    gst: 50.00,
    total: 550.00,
    amountPaid: 0.00,
    amountDue: 550.00,
    lineItems: [],
    payments: [],
    notes: '',
    terms: 'Payment due within 7 days'
  };

  const merged = deepMerge(defaults, overrides);

  // Recalculate totals if line items provided
  if (overrides.lineItems && overrides.lineItems.length > 0) {
    merged.subtotal = overrides.lineItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    merged.gst = Math.round(merged.subtotal * 0.10 * 100) / 100;
    merged.total = merged.subtotal + merged.gst;
    merged.amountDue = merged.total - merged.amountPaid;
  }

  return merged;
}

/**
 * Create a payment record
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Payment object
 */
function createPayment(overrides = {}) {
  const defaults = {
    paymentId: generateId('pay'),
    amount: 100.00,
    method: 'bank_transfer',
    reference: `TEST${Math.floor(Math.random() * 1000)}`,
    date: new Date().toISOString(),
    notes: 'Test payment'
  };

  return { ...defaults, ...overrides };
}

/**
 * Create an invoice line item
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Line item object
 */
function createLineItem(overrides = {}) {
  const defaults = {
    description: 'Test Service',
    quantity: 1,
    unitPrice: 100.00,
    lineTotal: 100.00
  };

  const merged = { ...defaults, ...overrides };

  // Auto-calculate lineTotal if not provided
  if (!overrides.lineTotal && (overrides.quantity || overrides.unitPrice)) {
    merged.lineTotal = merged.quantity * merged.unitPrice;
  }

  return merged;
}

/**
 * Create a template
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Template object
 */
function createTemplate(overrides = {}) {
  const defaults = {
    id: generateId('template'),
    name: 'Test Template',
    description: 'Test template description',
    category: 'residential',
    windowLines: [],
    pressureLines: [],
    notes: ''
  };

  return deepMerge(defaults, overrides);
}

/**
 * Create settings object
 *
 * @param {Object} overrides - Fields to override
 * @returns {Object} Settings object
 */
function createSettings(overrides = {}) {
  const defaults = {
    businessInfo: {
      name: 'Test Business',
      abn: '12 345 678 901',
      email: 'test@business.com',
      phone: '+61412345678',
      address: '123 Business St, Perth WA 6000'
    },
    pricing: {
      minimumCharge: 150.00,
      gstRate: 0.10
    },
    invoice: {
      defaultTerms: 'Payment due within 7 days',
      defaultDueDays: 7
    }
  };

  return deepMerge(defaults, overrides);
}

module.exports = {
  createQuote,
  createWindowLine,
  createPressureLine,
  createClient,
  createInvoice,
  createPayment,
  createLineItem,
  createTemplate,
  createSettings,
  // Also export utilities
  generateId,
  deepMerge
};
