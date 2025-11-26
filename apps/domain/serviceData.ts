import {
  BusinessRecord,
  ServiceLineRecord,
  ServiceTypeRecord,
  ModifierRecord,
  MarketAreaRecord,
  PriceBookVersionRecord,
  PackageRecord
} from './types';

var serviceBusinesses: BusinessRecord[] = [
  {
    id: 'biz-925',
    name: '925 Pressure Glass',
    slug: '925-pressure-glass',
    status: 'active',
    region: 'Perth, WA',
    contactEmail: 'info@925pressureglass.com.au',
    website: 'https://925pressureglass.com.au',
    currency: 'AUD',
    defaultMarkup: 0.18
  },
  {
    id: 'biz-cottesloe',
    name: "Jim's Window & Pressure Cleaning - Cottesloe",
    slug: 'jims-cottesloe',
    status: 'active',
    region: 'Cottesloe / Perth Western Suburbs',
    contactEmail: 'cottesloe@jims.com',
    currency: 'AUD',
    defaultMarkup: 0.2
  }
];

var serviceLines: ServiceLineRecord[] = [
  {
    id: 'sl-window-925',
    businessId: 'biz-925',
    name: 'Window Cleaning',
    description: 'Residential and light commercial window cleaning.',
    category: 'residential',
    tags: ['window', 'residential']
  },
  {
    id: 'sl-pressure-925',
    businessId: 'biz-925',
    name: 'Pressure Cleaning',
    description: 'Driveways, patios, pavers, walls.',
    category: 'pressure',
    tags: ['pressure', 'residential']
  },
  {
    id: 'sl-softwash-925',
    businessId: 'biz-925',
    name: 'Softwash & Delicate Surfaces',
    description: 'Low-pressure cleaning for limestone, render, cladding.',
    category: 'softwash',
    tags: ['softwash', 'delicate']
  },
  {
    id: 'sl-window-cottesloe',
    businessId: 'biz-cottesloe',
    name: 'Window Cleaning',
    description: 'Local window cleaning for coastal properties.',
    category: 'residential',
    tags: ['window', 'residential']
  },
  {
    id: 'sl-pressure-cottesloe',
    businessId: 'biz-cottesloe',
    name: 'Pressure Cleaning & Softwash',
    description: 'Coastal-safe pressure cleaning and softwash.',
    category: 'pressure',
    tags: ['pressure', 'softwash']
  }
];

var serviceTypes: ServiceTypeRecord[] = [
  {
    id: 'st-window-standard',
    serviceLineId: 'sl-window-925',
    code: 'WIN-STD',
    name: 'Standard Window Panel',
    description: 'Standard pane inside/outside',
    unit: 'panel',
    baseRate: 8,
    baseMinutesPerUnit: 5,
    riskLevel: 'low',
    tags: ['window']
  },
  {
    id: 'st-window-door',
    serviceLineId: 'sl-window-925',
    code: 'WIN-DOOR',
    name: 'Glass Door / Slider',
    description: 'Glass slider or hinged door',
    unit: 'panel',
    baseRate: 12,
    baseMinutesPerUnit: 9,
    riskLevel: 'low',
    tags: ['window', 'door']
  },
  {
    id: 'st-window-feature',
    serviceLineId: 'sl-window-925',
    code: 'WIN-FEAT',
    name: 'Feature / Picture Window',
    description: 'Large fixed window with extra edging',
    unit: 'panel',
    baseRate: 18,
    baseMinutesPerUnit: 12,
    riskLevel: 'medium',
    tags: ['window', 'feature']
  },
  {
    id: 'st-pressure-driveway',
    serviceLineId: 'sl-pressure-925',
    code: 'DRV-CONC',
    name: 'Concrete Driveway',
    description: 'Standard concrete driveway',
    unit: 'sqm',
    baseRate: 8,
    baseMinutesPerUnit: 1.4,
    riskLevel: 'low',
    pressureMethod: 'pressure',
    tags: ['driveway', 'pressure']
  },
  {
    id: 'st-pressure-limestone',
    serviceLineId: 'sl-softwash-925',
    code: 'PAT-LIME',
    name: 'Limestone Paving (Softwash)',
    description: 'Softwash for limestone to avoid damage',
    unit: 'sqm',
    baseRate: 15,
    baseMinutesPerUnit: 2.5,
    riskLevel: 'high',
    pressureMethod: 'softwash',
    tags: ['patio', 'limestone', 'softwash']
  },
  {
    id: 'st-pressure-decking',
    serviceLineId: 'sl-pressure-925',
    code: 'DECK-TMBR',
    name: 'Timber Decking (Low Pressure)',
    description: 'Low pressure to protect timber boards',
    unit: 'sqm',
    baseRate: 12,
    baseMinutesPerUnit: 2,
    riskLevel: 'medium',
    pressureMethod: 'pressure',
    tags: ['deck', 'timber']
  },
  {
    id: 'st-softwash-render',
    serviceLineId: 'sl-softwash-925',
    code: 'WALL-RNDR',
    name: 'Rendered Wall (Softwash)',
    description: 'Low pressure clean for render',
    unit: 'sqm',
    baseRate: 9,
    baseMinutesPerUnit: 1.8,
    riskLevel: 'medium',
    pressureMethod: 'softwash',
    tags: ['walls', 'softwash']
  },
  {
    id: 'st-addons-gutter',
    serviceLineId: 'sl-pressure-925',
    code: 'GUT-LINEAR',
    name: 'Gutter Clean (Exterior)',
    description: 'Linear metre pricing for gutters',
    unit: 'linear_m',
    baseRate: 5,
    baseMinutesPerUnit: 1.2,
    riskLevel: 'medium',
    tags: ['gutter', 'addon']
  },
  {
    id: 'st-pressure-driveway-cott',
    serviceLineId: 'sl-pressure-cottesloe',
    code: 'DRV-CONC-C',
    name: 'Driveway (Coastal Safe)',
    description: 'Driveway cleaning tuned for coastal properties',
    unit: 'sqm',
    baseRate: 9,
    baseMinutesPerUnit: 1.5,
    riskLevel: 'low',
    pressureMethod: 'pressure',
    tags: ['driveway', 'pressure']
  },
  {
    id: 'st-window-standard-cott',
    serviceLineId: 'sl-window-cottesloe',
    code: 'WIN-STD-C',
    name: 'Standard Window Panel (Coastal)',
    description: 'Coastal window cleaning with salt considerations',
    unit: 'panel',
    baseRate: 9,
    baseMinutesPerUnit: 5.5,
    riskLevel: 'low',
    tags: ['window']
  }
];

var modifiers: ModifierRecord[] = [
  {
    id: 'mod-tint-light',
    businessId: 'biz-925',
    scope: 'pricing',
    name: 'Light Tint',
    multiplier: 1.05,
    tags: ['tint']
  },
  {
    id: 'mod-tint-heavy',
    businessId: 'biz-925',
    scope: 'pricing',
    name: 'Heavy/Reflective Tint',
    multiplier: 1.1,
    tags: ['tint']
  },
  {
    id: 'mod-soil-dirty',
    businessId: 'biz-925',
    scope: 'pricing',
    name: 'Dirty',
    multiplier: 1.2,
    tags: ['soil']
  },
  {
    id: 'mod-soil-very-dirty',
    businessId: 'biz-925',
    scope: 'pricing',
    name: 'Very Dirty / Built-up',
    multiplier: 1.4,
    tags: ['soil']
  },
  {
    id: 'mod-access-ladder',
    businessId: 'biz-925',
    scope: 'pricing',
    name: 'Ladder / Awkward Access',
    multiplier: 1.25,
    tags: ['access']
  },
  {
    id: 'mod-access-highreach',
    businessId: 'biz-925',
    scope: 'pricing',
    name: 'High Reach Pole',
    multiplier: 1.4,
    tags: ['access']
  },
  {
    id: 'mod-coastal-salt',
    businessId: 'biz-cottesloe',
    scope: 'pricing',
    name: 'Coastal Salt Build-up',
    multiplier: 1.1,
    tags: ['coastal', 'soil']
  }
];

var marketAreas: MarketAreaRecord[] = [
  {
    id: 'ma-perth-north',
    businessId: 'biz-925',
    name: 'Perth Metro North',
    postalCodes: ['6000', '6008', '6018', '6020', '6022', '6025'],
    travelFee: 25,
    minJobValue: 180
  },
  {
    id: 'ma-perth-south',
    businessId: 'biz-925',
    name: 'Perth Metro South',
    postalCodes: ['6100', '6153', '6160'],
    travelFee: 30,
    minJobValue: 200
  },
  {
    id: 'ma-cottesloe',
    businessId: 'biz-cottesloe',
    name: 'Cottesloe',
    postalCodes: ['6011', '6015'],
    travelFee: 0,
    minJobValue: 160,
    notes: 'Local zone, no travel fee'
  }
];

var priceBooks: PriceBookVersionRecord[] = [
  {
    id: 'pb-925-v1',
    businessId: 'biz-925',
    version: '1.0.0',
    changelog: 'Initial Perth price book',
    isCurrent: true,
    rates: [
      { id: 'pb-rate-1', priceBookId: 'pb-925-v1', serviceTypeId: 'st-window-standard', rate: 8, minutesPerUnit: 5, currency: 'AUD' },
      { id: 'pb-rate-2', priceBookId: 'pb-925-v1', serviceTypeId: 'st-window-door', rate: 12, minutesPerUnit: 9, currency: 'AUD' },
      { id: 'pb-rate-3', priceBookId: 'pb-925-v1', serviceTypeId: 'st-window-feature', rate: 18, minutesPerUnit: 12, currency: 'AUD' },
      { id: 'pb-rate-4', priceBookId: 'pb-925-v1', serviceTypeId: 'st-pressure-driveway', rate: 8, minutesPerUnit: 1.4, currency: 'AUD' },
      { id: 'pb-rate-5', priceBookId: 'pb-925-v1', serviceTypeId: 'st-pressure-limestone', rate: 15, minutesPerUnit: 2.5, currency: 'AUD' },
      { id: 'pb-rate-6', priceBookId: 'pb-925-v1', serviceTypeId: 'st-pressure-decking', rate: 12, minutesPerUnit: 2, currency: 'AUD' },
      { id: 'pb-rate-7', priceBookId: 'pb-925-v1', serviceTypeId: 'st-softwash-render', rate: 9, minutesPerUnit: 1.8, currency: 'AUD' },
      { id: 'pb-rate-8', priceBookId: 'pb-925-v1', serviceTypeId: 'st-addons-gutter', rate: 5, minutesPerUnit: 1.2, currency: 'AUD' }
    ]
  },
  {
    id: 'pb-cott-v1',
    businessId: 'biz-cottesloe',
    version: '1.0.0',
    changelog: 'Coastal baseline',
    isCurrent: true,
    rates: [
      { id: 'pb-rate-9', priceBookId: 'pb-cott-v1', serviceTypeId: 'st-window-standard-cott', rate: 9, minutesPerUnit: 5.5, currency: 'AUD' },
      { id: 'pb-rate-10', priceBookId: 'pb-cott-v1', serviceTypeId: 'st-pressure-driveway-cott', rate: 9, minutesPerUnit: 1.5, currency: 'AUD' }
    ]
  }
];

var packages: PackageRecord[] = [
  {
    id: 'pkg-925-standard-window',
    businessId: 'biz-925',
    name: 'Standard Window Bundle',
    description: '20 standard panels + 2 doors, inside/out',
    discountPct: 0.05,
    tags: ['window', 'bundle'],
    items: [
      { serviceTypeId: 'st-window-standard', quantity: 20 },
      { serviceTypeId: 'st-window-door', quantity: 2 }
    ]
  },
  {
    id: 'pkg-925-driveway-patio',
    businessId: 'biz-925',
    name: 'Driveway + Patio Refresh',
    description: 'Concrete driveway plus limestone patio softwash',
    discountPct: 0.08,
    tags: ['pressure', 'softwash'],
    items: [
      { serviceTypeId: 'st-pressure-driveway', quantity: 50, unitOverride: 'sqm' },
      { serviceTypeId: 'st-pressure-limestone', quantity: 30, unitOverride: 'sqm' }
    ]
  }
];

export {
  serviceBusinesses,
  serviceLines,
  serviceTypes,
  modifiers,
  marketAreas,
  priceBooks,
  packages
};
