/**
 * Pre-defined Test Data Scenarios
 *
 * Common test scenarios with realistic data.
 * These are functions that return fresh data each time to avoid test pollution.
 *
 * Usage:
 *   const { SMALL_RESIDENTIAL } = require('./fixtures/test-data');
 *   const result = await helpers.calculateQuote(SMALL_RESIDENTIAL());
 */

const { createQuote, createWindowLine, createPressureLine } = require('./factories');

/**
 * Small residential job - minimal job
 */
const SMALL_RESIDENTIAL = () => createQuote({
  jobSettings: {
    clientName: 'Small Residential Client',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 5,
      width: 120,
      height: 150,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    })
  ]
});

/**
 * Standard 4x2 house - typical residential job
 */
const STANDARD_4X2_HOUSE = () => createQuote({
  jobSettings: {
    clientName: 'Standard House Client',
    propertyAddress: '456 Typical St, Perth WA 6000',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 8,
      width: 120,
      height: 150,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    }),
    createWindowLine({
      type: 'awning_casement',
      count: 4,
      width: 90,
      height: 120,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    })
  ],
  pressure: [
    createPressureLine({
      surfaceType: 'driveway_concrete',
      area: 40,
      condition: 'standard',
      slope: 'level',
      drainageQuality: 'good',
      waterAccess: 'onsite'
    })
  ]
});

/**
 * Large commercial job
 */
const LARGE_COMMERCIAL = () => createQuote({
  jobSettings: {
    clientName: 'Big Corporation Pty Ltd',
    propertyAddress: '100 Business Park Dr, Perth WA 6000',
    jobType: 'commercial',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'fixed_picture',
      count: 20,
      width: 200,
      height: 180,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    }),
    createWindowLine({
      type: 'door_glass',
      count: 4,
      width: 90,
      height: 210,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    })
  ],
  pressure: [
    createPressureLine({
      surfaceType: 'driveway_concrete',
      area: 200,
      condition: 'standard'
    }),
    createPressureLine({
      surfaceType: 'walls_brick',
      area: 150,
      condition: 'standard'
    })
  ]
});

/**
 * High-reach job - requires extension poles or ladder work
 */
const HIGH_REACH_JOB = () => createQuote({
  jobSettings: {
    clientName: 'High Rise Client',
    propertyAddress: '789 Tall Building, Perth WA 6000',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 12,
      width: 120,
      height: 150,
      paneConfig: 'both',
      condition: 'standard',
      accessType: 'roof',
      storey: 3
    })
  ]
});

/**
 * Complex access job - multiple access types
 */
const COMPLEX_ACCESS = () => createQuote({
  jobSettings: {
    clientName: 'Complex Property Client',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 6,
      accessType: 'ground',
      storey: 1,
      condition: 'standard'
    }),
    createWindowLine({
      type: 'standard_sliding',
      count: 4,
      accessType: 'ladder',
      storey: 2,
      condition: 'standard'
    }),
    createWindowLine({
      type: 'balcony_glass',
      count: 8,
      accessType: 'balcony',
      storey: 2,
      condition: 'standard'
    }),
    createWindowLine({
      type: 'stair_void',
      count: 2,
      accessType: 'void',
      storey: 2,
      condition: 'standard'
    })
  ]
});

/**
 * Heavy soiling job - requires extra cleaning time
 */
const HEAVY_SOILING = () => createQuote({
  jobSettings: {
    clientName: 'Dirty Property Client',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 10,
      condition: 'heavy',
      accessType: 'ground',
      storey: 1
    })
  ],
  pressure: [
    createPressureLine({
      surfaceType: 'driveway_concrete',
      area: 60,
      condition: 'heavy',
      stainingType: ['oil', 'mould', 'tyre_marks']
    })
  ]
});

/**
 * Post-construction job - very dirty, first clean
 */
const POST_CONSTRUCTION = () => createQuote({
  jobSettings: {
    clientName: 'New Build Client',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 15,
      condition: 'construction',
      accessType: 'ground',
      storey: 1
    })
  ]
});

/**
 * Rush job - urgent with premium applied
 */
const RUSH_JOB = () => createQuote({
  jobSettings: {
    clientName: 'Urgent Client',
    jobType: 'residential',
    urgency: 'urgent',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 8,
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    })
  ],
  appliedModifiers: {
    seasonalMultiplier: 1.0,
    customerTypeDiscount: 0.0,
    rushPremiumPercent: 50
  }
});

/**
 * Peak season job - seasonal premium applied
 */
const PEAK_SEASON = () => createQuote({
  jobSettings: {
    clientName: 'Peak Season Client',
    jobType: 'residential',
    urgency: 'standard',
    season: 'peak'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 10,
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    })
  ],
  appliedModifiers: {
    seasonalMultiplier: 1.2,
    customerTypeDiscount: 0.0,
    rushPremiumPercent: 0
  }
});

/**
 * Minimum charge scenario - very small job that should hit minimum
 */
const MINIMUM_CHARGE_JOB = () => createQuote({
  jobSettings: {
    clientName: 'Small Job Client',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'awning_casement',
      count: 2,
      width: 60,
      height: 80,
      paneConfig: 'outside',
      condition: 'standard',
      accessType: 'ground',
      storey: 1
    })
  ]
});

/**
 * Windows only - no pressure washing
 */
const WINDOWS_ONLY = () => createQuote({
  jobSettings: {
    clientName: 'Windows Only Client',
    jobType: 'residential'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 10,
      condition: 'standard'
    }),
    createWindowLine({
      type: 'awning_casement',
      count: 6,
      condition: 'standard'
    })
  ]
});

/**
 * Pressure only - no windows
 */
const PRESSURE_ONLY = () => createQuote({
  jobSettings: {
    clientName: 'Pressure Only Client',
    jobType: 'residential'
  },
  pressure: [
    createPressureLine({
      surfaceType: 'driveway_concrete',
      area: 80,
      condition: 'standard'
    }),
    createPressureLine({
      surfaceType: 'patio_pavers',
      area: 25,
      condition: 'standard'
    })
  ]
});

/**
 * Multi-storey house
 */
const MULTI_STOREY = () => createQuote({
  jobSettings: {
    clientName: 'Multi Storey Client',
    jobType: 'residential'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 8,
      storey: 1,
      accessType: 'ground'
    }),
    createWindowLine({
      type: 'standard_sliding',
      count: 6,
      storey: 2,
      accessType: 'ladder'
    }),
    createWindowLine({
      type: 'awning_casement',
      count: 4,
      storey: 3,
      accessType: 'roof'
    })
  ]
});

/**
 * Return customer with discount
 */
const RETURN_CUSTOMER = () => createQuote({
  jobSettings: {
    clientName: 'Loyal Customer',
    jobType: 'residential',
    urgency: 'standard',
    season: 'regular'
  },
  windows: [
    createWindowLine({
      type: 'standard_sliding',
      count: 10
    })
  ],
  appliedModifiers: {
    seasonalMultiplier: 1.0,
    customerTypeDiscount: 10.0, // 10% discount
    rushPremiumPercent: 0
  }
});

/**
 * Empty quote - no lines
 */
const EMPTY_QUOTE = () => createQuote({
  jobSettings: {
    clientName: 'Empty Quote Client'
  }
});

module.exports = {
  SMALL_RESIDENTIAL,
  STANDARD_4X2_HOUSE,
  LARGE_COMMERCIAL,
  HIGH_REACH_JOB,
  COMPLEX_ACCESS,
  HEAVY_SOILING,
  POST_CONSTRUCTION,
  RUSH_JOB,
  PEAK_SEASON,
  MINIMUM_CHARGE_JOB,
  WINDOWS_ONLY,
  PRESSURE_ONLY,
  MULTI_STOREY,
  RETURN_CUSTOMER,
  EMPTY_QUOTE
};
