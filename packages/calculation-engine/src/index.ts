/**
 * @tictacstick/calculation-engine
 * Shared calculation engine for TicTacStick Quote Engine
 * 
 * Provides precise monetary and time calculations using integer arithmetic
 * to avoid floating-point errors in financial calculations.
 */

// ============================================
// Type Definitions
// ============================================

/**
 * Window line item configuration
 */
/**
 * Window addon severity level
 */
export type WindowAddonSeverity = 'light' | 'medium' | 'heavy';

/**
 * Window size category for addon pricing
 */
export type WindowSize = 'small' | 'standard' | 'large' | 'extraLarge';

/**
 * Window addon configuration
 */
export interface WindowAddon {
  id: string;
  label: string;
  description: string;
  basePrice: number;
  insideCount: number;
  outsideCount: number;
  severity: WindowAddonSeverity;
}

/**
 * Window addon type definition for available add-ons
 */
export interface WindowAddonType {
  id: string;
  label: string;
  description: string;
  basePrice: number;
  hasInsideOutside: boolean;
  hasSeverity: boolean;
}

/**
 * Predefined window add-on types with base pricing
 * Prices are per pane and can be multiplied by severity
 */
export const WINDOW_ADDON_TYPES: WindowAddonType[] = [
  {
    id: 'fly-screen',
    label: 'Fly Screen Clean',
    description: 'Clean fly screens/insect screens',
    basePrice: 5.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'fly-screen-deep',
    label: 'Deep Clean Fly Screens',
    description: 'Heavy duty cleaning for heavily soiled fly screens',
    basePrice: 10.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'track-deep',
    label: 'Deep Clean Tracks',
    description: 'Thorough cleaning of window tracks and channels',
    basePrice: 8.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'bird-poo',
    label: 'Bird Droppings Removal',
    description: 'Descaling and removal of bird droppings',
    basePrice: 12.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'bug-residue',
    label: 'Bug/Insect Residue',
    description: 'Removal of bug splatter and insect residue',
    basePrice: 8.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'paint-overspray',
    label: 'Paint Overspray',
    description: 'Removal of paint overspray and spots',
    basePrice: 15.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'adhesive-staining',
    label: 'Adhesive/Sticker Removal',
    description: 'Removal of adhesive residue and sticker marks',
    basePrice: 10.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
  {
    id: 'hard-water',
    label: 'Hard Water Stain Removal',
    description: 'Treatment and removal of mineral/hard water stains',
    basePrice: 20.00,
    hasInsideOutside: true,
    hasSeverity: true,
  },
];

// ============================================
// Pressure Add-on Types
// ============================================

/**
 * Pressure addon severity level (matches window for consistency)
 */
export type PressureAddonSeverity = 'light' | 'medium' | 'heavy';

/**
 * Pressure addon configuration
 */
export interface PressureAddon {
  id: string;
  label: string;
  description: string;
  basePrice: number;       // Base price per sqm or flat fee
  isPerSqm: boolean;       // If true, multiply by area; if false, flat fee
  areaSqm?: number;        // Area covered by this addon (if per sqm)
  severity: PressureAddonSeverity;
}

/**
 * Pressure addon type definition
 */
export interface PressureAddonType {
  id: string;
  label: string;
  description: string;
  basePrice: number;
  isPerSqm: boolean;       // Per sqm pricing vs flat fee
  hasSeverity: boolean;
}

/**
 * Predefined pressure cleaning add-on types with base pricing
 */
export const PRESSURE_ADDON_TYPES: PressureAddonType[] = [
  {
    id: 'oil-stain',
    label: 'Oil Stain Treatment',
    description: 'Pre-treatment and removal of oil/grease stains',
    basePrice: 15.00,
    isPerSqm: false,  // Flat fee per stain area
    hasSeverity: true,
  },
  {
    id: 'mold-treatment',
    label: 'Mold/Mildew Treatment',
    description: 'Anti-fungal treatment for mold and mildew',
    basePrice: 2.50,
    isPerSqm: true,
    hasSeverity: true,
  },
  {
    id: 'rust-stain',
    label: 'Rust Stain Removal',
    description: 'Chemical treatment for rust stains',
    basePrice: 12.00,
    isPerSqm: false,  // Flat fee per stain
    hasSeverity: true,
  },
  {
    id: 'sealer-application',
    label: 'Sealer Application',
    description: 'Apply protective sealer after cleaning',
    basePrice: 8.00,
    isPerSqm: true,
    hasSeverity: false,
  },
  {
    id: 'gum-removal',
    label: 'Chewing Gum Removal',
    description: 'Removal of chewing gum and sticky residue',
    basePrice: 5.00,
    isPerSqm: false,  // Per piece/spot
    hasSeverity: false,
  },
  {
    id: 'graffiti-removal',
    label: 'Graffiti Removal',
    description: 'Chemical treatment and removal of graffiti',
    basePrice: 25.00,
    isPerSqm: true,
    hasSeverity: true,
  },
  {
    id: 'tire-marks',
    label: 'Tire Mark Removal',
    description: 'Removal of tire marks and rubber stains',
    basePrice: 10.00,
    isPerSqm: false,
    hasSeverity: true,
  },
  {
    id: 'efflorescence',
    label: 'Efflorescence Treatment',
    description: 'Removal of white mineral deposits on concrete/brick',
    basePrice: 3.50,
    isPerSqm: true,
    hasSeverity: true,
  },
];

/**
 * Create a PressureAddon from an addon type
 */
export function createPressureAddon(
  addonType: PressureAddonType,
  areaSqm: number = 0,
  severity: PressureAddonSeverity = 'light'
): PressureAddon {
  return {
    id: addonType.id,
    label: addonType.label,
    description: addonType.description,
    basePrice: addonType.basePrice,
    isPerSqm: addonType.isPerSqm,
    areaSqm,
    severity,
  };
}

/**
 * Calculate pressure addon cost with severity multiplier
 * light = 1.0x, medium = 1.5x, heavy = 2.0x
 */
export function calculatePressureAddonCost(addon: PressureAddon): number {
  const severityMultipliers: Record<PressureAddonSeverity, number> = {
    light: 1.0,
    medium: 1.5,
    heavy: 2.0,
  };
  const multiplier = severityMultipliers[addon.severity] || 1.0;
  
  if (addon.isPerSqm) {
    return roundMoney(addon.basePrice * (addon.areaSqm || 0) * multiplier);
  } else {
    // Flat fee with severity multiplier
    return roundMoney(addon.basePrice * multiplier);
  }
}

/**
 * Create a WindowAddon from an addon type with counts and severity
 */
export function createWindowAddon(
  addonType: WindowAddonType,
  insideCount: number = 0,
  outsideCount: number = 0,
  severity: WindowAddonSeverity = 'light'
): WindowAddon {
  return {
    id: addonType.id,
    label: addonType.label,
    description: addonType.description,
    basePrice: addonType.basePrice,
    insideCount,
    outsideCount,
    severity,
  };
}

/**
 * Calculate addon cost with severity multiplier
 * light = 1.0x, medium = 1.5x, heavy = 2.0x
 */
export function calculateAddonCost(addon: WindowAddon): number {
  const severityMultipliers: Record<WindowAddonSeverity, number> = {
    light: 1.0,
    medium: 1.5,
    heavy: 2.0,
  };
  const totalPanes = (addon.insideCount || 0) + (addon.outsideCount || 0);
  const multiplier = severityMultipliers[addon.severity] || 1.0;
  return roundMoney(addon.basePrice * totalPanes * multiplier);
}

export interface WindowLine {
  id: string;
  windowTypeId: string;
  type?: 'standard' | 'french' | 'skylight' | 'shopfront';
  panes: number;
  width?: number;
  height?: number;
  inside: boolean;
  outside: boolean;
  highReach: boolean;
  insideHighReachCount?: number;  // Number of inside panes with high reach
  outsideHighReachCount?: number; // Number of outside panes with high reach
  highReachLevel?: number;
  conditionId?: string;
  soilLevel?: 'light' | 'medium' | 'heavy';
  condition?: 'clean' | 'moderate' | 'dirty';
  accessId?: string;
  tintLevel?: 'none' | 'light' | 'heavy';
  trackClean?: boolean;
  screenClean?: boolean;
  location?: string;
  notes?: string;
  modifiers?: string[];
  addons?: WindowAddon[];
}

/**
 * Pressure cleaning line item configuration
 */
export interface PressureLine {
  id: string;
  surfaceId: string;
  service?: 'driveway' | 'patio' | 'deck' | 'fence' | 'house-wash' | 'roof';
  areaSqm: number;
  soilLevel?: 'light' | 'medium' | 'heavy';
  condition?: 'light' | 'moderate' | 'heavy';
  access?: 'easy' | 'ladder' | 'highReach';
  includeSealing?: boolean;
  notes?: string;
  modifiers?: string[];
  addons?: PressureAddon[];
}

/**
 * Window type configuration from pricing data
 */
export interface WindowTypeConfig {
  id: string;
  label: string;
  baseMinutesInside: number;
  baseMinutesOutside: number;
}

/**
 * Pressure surface configuration from pricing data
 */
export interface PressureSurfaceConfig {
  id: string;
  label: string;
  minutesPerSqm: number;
}

/**
 * Pricing configuration
 */
export interface PricingConfig {
  baseFee: number;
  hourlyRate: number;
  minimumJob: number;
  highReachModifierPercent: number;
  insideMultiplier: number;
  outsideMultiplier: number;
  pressureHourlyRate: number;
  setupBufferMinutes: number;
  travelMinutes?: number;
  travelKm?: number;
  travelRatePerHour?: number;
  travelRatePerKm?: number;
  
  // Rate configurations
  baseRates?: {
    windowPerPane: number;
    insideMultiplier: number;
    outsideMultiplier: number;
    highReachMultiplier: number;
    conditionMultipliers: Record<string, number>;
  };
  pressureRates?: Record<string, number>;
  gstRate?: number;
}

/**
 * Quote calculation state
 */
export interface QuoteState extends PricingConfig {
  windowLines: WindowLine[];
  pressureLines: PressureLine[];
}

/**
 * Line item result breakdown
 */
export interface LineItemResult {
  id: string;
  description: string;
  amount: number;
  minutes: number;
}

/**
 * Money breakdown from calculation
 */
export interface MoneyBreakdown {
  baseFee: number;
  windows: number;
  pressure: number;
  setup: number;
  travel: number;
  highReach: number;
  subtotal: number;
  minimumJob: number;
  total: number;
}

/**
 * Time breakdown from calculation
 */
export interface TimeBreakdown {
  windowsMinutes: number;
  pressureMinutes: number;
  highReachMinutes: number;
  setupMinutes: number;
  travelMinutes: number;
  windowsHours: number;
  pressureHours: number;
  highReachHours: number;
  setupHours: number;
  travelHours: number;
  totalMinutes: number;
  totalHours: number;
}

/**
 * Complete quote result
 */
export interface QuoteResult {
  money: MoneyBreakdown;
  time: TimeBreakdown;
  lineItems?: LineItemResult[];
  estimatedTime?: number;
  subtotal: number;
  gst: number;
  total: number;
}

// ============================================
// Constants
// ============================================

const CENTS_PER_DOLLAR = 100;
const MINUTES_PER_HOUR = 60;
const GST_RATE = 0.10; // Australian GST 10%

// ============================================
// Money Helper Functions
// ============================================

/**
 * Convert dollars to cents (integers)
 */
export function toCents(dollars: number): number {
  if (typeof dollars !== 'number' || !isFinite(dollars)) {
    throw new Error(`Invalid dollar amount: ${dollars}`);
  }
  return Math.round(dollars * CENTS_PER_DOLLAR);
}

/**
 * Convert cents to dollars (float)
 */
export function fromCents(cents: number): number {
  if (typeof cents !== 'number' || !isFinite(cents)) {
    throw new Error(`Invalid cents amount: ${cents}`);
  }
  return cents / CENTS_PER_DOLLAR;
}

/**
 * Round to 2 decimals using integer arithmetic
 */
export function roundMoney(dollars: number): number {
  if (typeof dollars !== 'number' || !isFinite(dollars)) {
    throw new Error(`Invalid dollar amount in round: ${dollars}`);
  }
  return fromCents(toCents(dollars));
}

/**
 * Sum multiple cents values safely
 */
export function sumCents(...centsArray: number[]): number {
  return centsArray.reduce((total, value) => {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error(`Invalid cents value in sum: ${value}`);
    }
    return total + value;
  }, 0);
}

/**
 * Multiply dollars by a factor, keeping cents accurate
 */
export function multiplyDollars(dollars: number, factor: number): number {
  if (typeof dollars !== 'number' || typeof factor !== 'number') {
    throw new Error('Invalid multiplyDollars inputs');
  }
  return fromCents(Math.round(dollars * factor * CENTS_PER_DOLLAR));
}

/**
 * Apply minimum charge
 */
export function applyMinimum(amountCents: number, minimumCents: number): number {
  return Math.max(amountCents, minimumCents);
}

/**
 * Apply minimum in dollars
 */
export function applyMinimumDollars(amountDollars: number, minimumDollars: number): number {
  const amountCents = toCents(amountDollars);
  const minimumCents = toCents(minimumDollars);
  const appliedCents = applyMinimum(amountCents, minimumCents);
  return fromCents(appliedCents);
}

// ============================================
// GST (Goods and Services Tax) Calculations
// ============================================

/**
 * Calculate 10% GST on a subtotal amount
 * Uses integer arithmetic (cents) to avoid floating-point errors
 */
export function calculateGST(subtotal: number, rate: number = GST_RATE): { gst: number; total: number } {
  if (typeof subtotal !== 'number' || !isFinite(subtotal) || subtotal < 0) {
    return { gst: 0, total: 0 };
  }

  const subtotalCents = toCents(subtotal);
  const gstCents = Math.round(subtotalCents * rate);
  const gst = fromCents(gstCents);
  const total = roundMoney(subtotal + gst);

  return { gst, total };
}

/**
 * Add GST to subtotal
 */
export function addGST(subtotal: number): number {
  const { total } = calculateGST(subtotal);
  return total;
}

/**
 * Extract GST component from a GST-inclusive amount
 */
export function extractGST(totalInclGST: number): number {
  if (typeof totalInclGST !== 'number' || !isFinite(totalInclGST) || totalInclGST < 0) {
    return 0;
  }

  const totalCents = toCents(totalInclGST);
  const gstCents = Math.round(totalCents / 11); // GST = Total / 11
  return fromCents(gstCents);
}

/**
 * Extract subtotal from GST-inclusive amount
 */
export function extractSubtotal(totalInclGST: number): number {
  if (typeof totalInclGST !== 'number' || !isFinite(totalInclGST) || totalInclGST < 0) {
    return 0;
  }

  const gst = extractGST(totalInclGST);
  return roundMoney(totalInclGST - gst);
}

// ============================================
// Time Helper Functions
// ============================================

/**
 * Convert hours to minutes
 */
export function hoursToMinutes(hours: number): number {
  if (typeof hours !== 'number' || !isFinite(hours)) {
    throw new Error(`Invalid hours: ${hours}`);
  }
  return Math.round(hours * MINUTES_PER_HOUR);
}

/**
 * Convert minutes to hours
 */
export function minutesToHours(minutes: number): number {
  if (typeof minutes !== 'number' || !isFinite(minutes)) {
    throw new Error(`Invalid minutes: ${minutes}`);
  }
  return minutes / MINUTES_PER_HOUR;
}

/**
 * Format time for display
 */
export function formatHours(minutes: number): string {
  const hours = minutesToHours(minutes);
  return hours.toFixed(2);
}

/**
 * Sum multiple time values (in minutes)
 */
export function sumTime(...times: number[]): number {
  return times.reduce((total, minutes) => {
    if (typeof minutes !== 'number' || !isFinite(minutes)) {
      throw new Error(`Invalid minutes in sum: ${minutes}`);
    }
    return total + minutes;
  }, 0);
}

// ============================================
// Currency Formatting
// ============================================

/**
 * Format amount as currency string
 */
export function formatCurrency(amount: number, locale: string = 'en-AU', currency: string = 'AUD'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ============================================
// Window Time Calculation
// ============================================

/**
 * Calculate time (minutes) for a single window line
 */
export function calculateWindowTime(
  line: WindowLine,
  windowTypeMap: Map<string, WindowTypeConfig>,
  insideMultiplier: number = 1,
  outsideMultiplier: number = 1,
  getConditionMultiplier?: (id: string) => number,
  getAccessMultiplier?: (id: string) => number,
  getModifierMultiplier?: (id: string) => number
): number {
  if (!line) return 0;

  const typeData = windowTypeMap.get(line.windowTypeId);
  if (!typeData) return 0;

  const baseInside = typeData.baseMinutesInside || 0;
  const baseOutside = typeData.baseMinutesOutside || 0;
  const panes = line.panes || 0;

  // High reach multiplier (1.7 = 70% increase)
  const HIGH_REACH_MULTIPLIER = 1.7;

  // Calculate inside time with proportional high reach
  let totalInsideMinutes = 0;
  if (line.inside && panes > 0) {
    const baseInsideTime = baseInside * insideMultiplier;
    if (line.highReach && line.insideHighReachCount && line.insideHighReachCount > 0) {
      // Proportional: some panes are high reach, some are normal
      const hrCount = Math.min(line.insideHighReachCount, panes);
      const normalCount = panes - hrCount;
      totalInsideMinutes = (hrCount * baseInsideTime * HIGH_REACH_MULTIPLIER) + (normalCount * baseInsideTime);
    } else {
      totalInsideMinutes = panes * baseInsideTime;
    }
  }

  // Calculate outside time with proportional high reach
  let totalOutsideMinutes = 0;
  if (line.outside && panes > 0) {
    const baseOutsideTime = baseOutside * outsideMultiplier;
    if (line.highReach && line.outsideHighReachCount && line.outsideHighReachCount > 0) {
      // Proportional: some panes are high reach, some are normal
      const hrCount = Math.min(line.outsideHighReachCount, panes);
      const normalCount = panes - hrCount;
      totalOutsideMinutes = (hrCount * baseOutsideTime * HIGH_REACH_MULTIPLIER) + (normalCount * baseOutsideTime);
    } else {
      totalOutsideMinutes = panes * baseOutsideTime;
    }
  }

  // Condition, access, and tint modifiers
  const conditionId = line.conditionId || line.soilLevel;
  const accessId = line.accessId || (line.highReach ? 'highReach' : undefined);

  // Get multipliers
  let conditionFactor = 1.0;
  if (getConditionMultiplier && conditionId) {
    conditionFactor = getConditionMultiplier(conditionId);
  } else {
    if (line.soilLevel === 'medium') conditionFactor = 1.2;
    else if (line.soilLevel === 'heavy') conditionFactor = 1.4;
  }

  let accessFactor = 1.0;
  if (getAccessMultiplier && accessId) {
    accessFactor = getAccessMultiplier(accessId);
  } else {
    if (line.highReach) accessFactor = 1.4;
  }

  let tintFactor = 1.0;
  if (line.tintLevel === 'light') tintFactor = 1.05;
  else if (line.tintLevel === 'heavy') tintFactor = 1.1;

  const combinedFactor = conditionFactor * accessFactor * tintFactor;

  // Calculate modifier factor
  let modFactor = 1.0;
  if (line.modifiers?.length && getModifierMultiplier) {
    for (const mod of line.modifiers) {
      modFactor *= getModifierMultiplier(mod);
    }
  }

  // Total minutes (already calculated per-pane above)
  const totalMinutes = (totalInsideMinutes + totalOutsideMinutes) * combinedFactor * modFactor;
  return totalMinutes;
}

// ============================================
// Pressure Time Calculation
// ============================================

/**
 * Calculate time (minutes) for a single pressure line
 */
export function calculatePressureTime(
  line: PressureLine,
  pressureSurfaceMap: Map<string, PressureSurfaceConfig>,
  getModifierMultiplier?: (id: string) => number
): number {
  if (!line) return 0;

  const surface = pressureSurfaceMap.get(line.surfaceId);
  if (!surface) return 0;

  const mps = surface.minutesPerSqm || 0;
  const area = line.areaSqm || 0;

  // Soil factor
  let soilFactor = 1.0;
  if (line.soilLevel === 'medium') soilFactor = 1.25;
  else if (line.soilLevel === 'heavy') soilFactor = 1.5;

  // Access factor
  let accessFactor = 1.0;
  if (line.access === 'ladder') accessFactor = 1.2;
  else if (line.access === 'highReach') accessFactor = 1.35;

  // Modifier factor
  let modFactor = 1.0;
  if (line.modifiers?.length && getModifierMultiplier) {
    for (const mod of line.modifiers) {
      modFactor *= getModifierMultiplier(mod);
    }
  }

  return mps * area * soilFactor * accessFactor * modFactor;
}

// ============================================
// Window Cost Calculation
// ============================================

/**
 * Calculate cost for a single window line
 */
export function calculateWindowCost(
  line: WindowLine,
  config: PricingConfig,
  windowTypeMap: Map<string, WindowTypeConfig>,
  getConditionMultiplier?: (id: string) => number,
  getAccessMultiplier?: (id: string) => number,
  getModifierMultiplier?: (id: string) => number
): number {
  if (!line || !config) return 0;

  const typeData = windowTypeMap.get(line.windowTypeId);
  if (!typeData) return 0;

  const baseInside = typeData.baseMinutesInside || 0;
  const baseOutside = typeData.baseMinutesOutside || 0;

  const insideMultiplier = config.insideMultiplier || 1;
  const outsideMultiplier = config.outsideMultiplier || 1;
  const panes = line.panes || 0;

  // High reach multiplier (1.7 = 70% increase)
  const HIGH_REACH_MULTIPLIER = 1.7;

  // Calculate inside time with proportional high reach
  let totalInsideMinutes = 0;
  if (line.inside) {
    const baseInsideTime = baseInside * insideMultiplier;
    // Proportional high reach: only the specified count of panes get high reach pricing
    if (line.highReach && line.insideHighReachCount && line.insideHighReachCount > 0) {
      const hrCount = Math.min(line.insideHighReachCount, panes);
      const normalCount = panes - hrCount;
      totalInsideMinutes = (hrCount * baseInsideTime * HIGH_REACH_MULTIPLIER) + (normalCount * baseInsideTime);
    } else {
      // No high reach or zero count - all panes at normal rate
      totalInsideMinutes = panes * baseInsideTime;
    }
  }

  // Calculate outside time with proportional high reach
  let totalOutsideMinutes = 0;
  if (line.outside) {
    const baseOutsideTime = baseOutside * outsideMultiplier;
    // Proportional high reach: only the specified count of panes get high reach pricing
    if (line.highReach && line.outsideHighReachCount && line.outsideHighReachCount > 0) {
      const hrCount = Math.min(line.outsideHighReachCount, panes);
      const normalCount = panes - hrCount;
      totalOutsideMinutes = (hrCount * baseOutsideTime * HIGH_REACH_MULTIPLIER) + (normalCount * baseOutsideTime);
    } else {
      // No high reach or zero count - all panes at normal rate
      totalOutsideMinutes = panes * baseOutsideTime;
    }
  }

  // Condition, access, and tint modifiers
  const conditionId = line.conditionId || line.soilLevel;
  const accessId = line.accessId || (line.highReach ? 'highReach' : undefined);

  // Get multipliers
  let conditionFactor = 1.0;
  if (getConditionMultiplier && conditionId) {
    conditionFactor = getConditionMultiplier(conditionId);
  } else {
    if (line.soilLevel === 'medium') conditionFactor = 1.2;
    else if (line.soilLevel === 'heavy') conditionFactor = 1.4;
  }

  let accessFactor = 1.0;
  if (getAccessMultiplier && accessId) {
    accessFactor = getAccessMultiplier(accessId);
  } else {
    if (line.highReach) accessFactor = 1.4;
  }

  let tintFactor = 1.0;
  if (line.tintLevel === 'light') tintFactor = 1.05;
  else if (line.tintLevel === 'heavy') tintFactor = 1.1;

  const combinedFactor = conditionFactor * accessFactor * tintFactor;

  // Calculate modifier factor
  let modFactor = 1.0;
  if (line.modifiers?.length && getModifierMultiplier) {
    for (const mod of line.modifiers) {
      modFactor *= getModifierMultiplier(mod);
    }
  }

  // Total minutes (already calculated per-pane with proportional high reach above)
  const totalMinutes = (totalInsideMinutes + totalOutsideMinutes) * combinedFactor * modFactor;

  // Calculate addon costs
  let addonCost = 0;
  if (line.addons?.length) {
    for (const addon of line.addons) {
      const totalAddonPanes = (addon.insideCount || 0) + (addon.outsideCount || 0);
      // Apply severity multiplier: light=1.0, medium=1.5, heavy=2.0
      let severityMultiplier = 1.0;
      if (addon.severity === 'medium') severityMultiplier = 1.5;
      else if (addon.severity === 'heavy') severityMultiplier = 2.0;
      addonCost += (addon.basePrice || 0) * totalAddonPanes * severityMultiplier;
    }
  }

  // Convert to cost
  const hourlyRate = config.hourlyRate || 0;
  const hours = minutesToHours(totalMinutes);
  return roundMoney((hours * hourlyRate) + addonCost);
}

// ============================================
// Pressure Cost Calculation
// ============================================

/**
 * Calculate cost for a single pressure line
 */
export function calculatePressureCost(
  line: PressureLine,
  config: PricingConfig,
  pressureSurfaceMap: Map<string, PressureSurfaceConfig>,
  getModifierMultiplier?: (id: string) => number
): number {
  if (!line) return 0;

  const surface = pressureSurfaceMap.get(line.surfaceId);
  if (!surface) return 0;

  const mps = surface.minutesPerSqm || 0;
  const area = line.areaSqm || 0;

  // Soil factor
  let soilFactor = 1.0;
  if (line.soilLevel === 'medium') soilFactor = 1.25;
  else if (line.soilLevel === 'heavy') soilFactor = 1.5;

  // Access factor
  let accessFactor = 1.0;
  if (line.access === 'ladder') accessFactor = 1.2;
  else if (line.access === 'highReach') accessFactor = 1.35;

  // Modifier factor
  let modFactor = 1.0;
  if (line.modifiers?.length && getModifierMultiplier) {
    for (const mod of line.modifiers) {
      modFactor *= getModifierMultiplier(mod);
    }
  }

  const minutes = mps * area * soilFactor * accessFactor * modFactor;
  
  // Convert to cost
  const pressureHourlyRate = config.pressureHourlyRate || config.hourlyRate || 0;
  const hours = minutesToHours(minutes);
  return roundMoney(hours * pressureHourlyRate);
}

// ============================================
// Full Quote Calculation
// ============================================

/**
 * Calculate complete quote from state
 */
export function calculateQuote(
  state: QuoteState,
  windowTypeMap: Map<string, WindowTypeConfig>,
  pressureSurfaceMap: Map<string, PressureSurfaceConfig>,
  getConditionMultiplier?: (id: string) => number,
  getAccessMultiplier?: (id: string) => number,
  getModifierMultiplier?: (id: string) => number
): QuoteResult {
  const config: PricingConfig = {
    baseFee: parseFloat(String(state.baseFee)) || 0,
    hourlyRate: parseFloat(String(state.hourlyRate)) || 0,
    minimumJob: parseFloat(String(state.minimumJob)) || 0,
    highReachModifierPercent: parseFloat(String(state.highReachModifierPercent)) || 0,
    insideMultiplier: parseFloat(String(state.insideMultiplier)) || 1,
    outsideMultiplier: parseFloat(String(state.outsideMultiplier)) || 1,
    pressureHourlyRate: parseFloat(String(state.pressureHourlyRate)) || 0,
    setupBufferMinutes: parseFloat(String(state.setupBufferMinutes)) || 0,
    travelMinutes: state.travelMinutes,
    travelKm: state.travelKm,
    travelRatePerHour: state.travelRatePerHour,
    travelRatePerKm: state.travelRatePerKm,
  };

  // Initialize totals (in minutes)
  let windowsMinutes = 0;
  let pressureMinutes = 0;
  let highReachMinutes = 0;

  // Calculate window lines
  const lineItems: LineItemResult[] = [];

  if (state.windowLines?.length) {
    for (const wLine of state.windowLines) {
      const typeData = windowTypeMap.get(wLine.windowTypeId);
      if (!typeData) continue;

      const baseInside = typeData.baseMinutesInside || 0;
      const baseOutside = typeData.baseMinutesOutside || 0;

      let minutesPerPane = 0;
      if (wLine.inside) {
        minutesPerPane += baseInside * config.insideMultiplier;
      }
      if (wLine.outside) {
        minutesPerPane += baseOutside * config.outsideMultiplier;
      }

      // Condition and access factors
      const conditionId = wLine.conditionId || wLine.soilLevel;
      let conditionFactor = 1.0;
      if (getConditionMultiplier && conditionId) {
        conditionFactor = getConditionMultiplier(conditionId);
      } else {
        if (wLine.soilLevel === 'medium') conditionFactor = 1.2;
        else if (wLine.soilLevel === 'heavy') conditionFactor = 1.4;
      }

      const accessId = wLine.accessId || (wLine.highReach ? 'highReach' : undefined);
      let accessFactor = 1.0;
      if (getAccessMultiplier && accessId) {
        accessFactor = getAccessMultiplier(accessId);
      } else {
        if (wLine.highReach) accessFactor = 1.4;
      }

      let tintFactor = 1.0;
      if (wLine.tintLevel === 'light') tintFactor = 1.05;
      else if (wLine.tintLevel === 'heavy') tintFactor = 1.1;

      const combinedFactor = conditionFactor * accessFactor * tintFactor;

      let modFactor = 1.0;
      if (wLine.modifiers?.length && getModifierMultiplier) {
        for (const mod of wLine.modifiers) {
          modFactor *= getModifierMultiplier(mod);
        }
      }

      const panes = wLine.panes || 0;
      const totalMinutes = minutesPerPane * panes * combinedFactor * modFactor;
      windowsMinutes += totalMinutes;

      // High reach extra time
      if (wLine.highReach && wLine.outside) {
        const baseMinutes = baseOutside * config.outsideMultiplier * panes * conditionFactor * tintFactor;
        const extraMinutes = baseMinutes * 0.4;
        highReachMinutes += extraMinutes;
      }

      lineItems.push({
        id: wLine.id,
        description: `${typeData.label} - ${panes} panes`,
        amount: roundMoney((totalMinutes / 60) * config.hourlyRate),
        minutes: totalMinutes,
      });
    }
  }

  // Calculate pressure lines
  if (state.pressureLines?.length) {
    for (const pLine of state.pressureLines) {
      const surface = pressureSurfaceMap.get(pLine.surfaceId);
      if (!surface) continue;

      const mps = surface.minutesPerSqm || 0;
      const area = pLine.areaSqm || 0;

      let soilFactor = 1.0;
      if (pLine.soilLevel === 'medium') soilFactor = 1.25;
      else if (pLine.soilLevel === 'heavy') soilFactor = 1.5;

      let accessFactor = 1.0;
      if (pLine.access === 'ladder') accessFactor = 1.2;
      else if (pLine.access === 'highReach') accessFactor = 1.35;

      let modFactor = 1.0;
      if (pLine.modifiers?.length && getModifierMultiplier) {
        for (const mod of pLine.modifiers) {
          modFactor *= getModifierMultiplier(mod);
        }
      }

      const minutes = mps * area * soilFactor * accessFactor * modFactor;
      pressureMinutes += minutes;

      lineItems.push({
        id: pLine.id,
        description: `${surface.label} - ${area} sqm`,
        amount: roundMoney((minutes / 60) * (config.pressureHourlyRate || config.hourlyRate)),
        minutes,
      });
    }
  }

  // Setup and travel
  const setupMinutes = config.setupBufferMinutes || 0;
  const travelMinutes = config.travelMinutes || 0;

  // Convert to hours
  const windowsHours = minutesToHours(windowsMinutes);
  const pressureHours = minutesToHours(pressureMinutes);
  const highReachHours = minutesToHours(highReachMinutes);
  const setupHours = minutesToHours(setupMinutes);
  const travelHours = minutesToHours(travelMinutes);

  // Calculate costs in cents
  const labourRateCents = toCents(config.hourlyRate);
  const pressureRateCents = toCents(config.pressureHourlyRate || config.hourlyRate);
  const travelRateHourCents = toCents(config.travelRatePerHour || config.hourlyRate || 0);
  const travelRateKmCents = toCents(config.travelRatePerKm || 0);

  const windowsCostCents = Math.round(windowsHours * labourRateCents);
  const pressureCostCents = Math.round(pressureHours * pressureRateCents);
  const setupCostCents = Math.round(setupHours * labourRateCents);
  const travelCostCents = sumCents(
    Math.round(travelHours * travelRateHourCents),
    Math.round((config.travelKm || 0) * travelRateKmCents)
  );
  const highReachCostCents = Math.round(highReachHours * labourRateCents);
  const baseFeeCents = toCents(config.baseFee);

  // Calculate subtotal
  const subtotalCents = sumCents(
    baseFeeCents,
    windowsCostCents,
    pressureCostCents,
    setupCostCents,
    travelCostCents,
    highReachCostCents
  );

  // Apply minimum
  const minimumJobCents = toCents(config.minimumJob);
  const finalTotalCents = applyMinimum(subtotalCents, minimumJobCents);

  // Calculate GST
  const subtotal = fromCents(finalTotalCents);
  const { gst, total } = calculateGST(subtotal);

  const totalMinutes = sumTime(windowsMinutes, pressureMinutes, highReachMinutes, setupMinutes);

  return {
    money: {
      baseFee: fromCents(baseFeeCents),
      windows: fromCents(windowsCostCents),
      pressure: fromCents(pressureCostCents),
      setup: fromCents(setupCostCents),
      travel: fromCents(travelCostCents),
      highReach: fromCents(highReachCostCents),
      subtotal: fromCents(subtotalCents),
      minimumJob: config.minimumJob,
      total: fromCents(finalTotalCents),
    },
    time: {
      windowsMinutes,
      pressureMinutes,
      highReachMinutes,
      setupMinutes,
      travelMinutes,
      windowsHours,
      pressureHours,
      highReachHours,
      setupHours,
      travelHours,
      totalMinutes,
      totalHours: minutesToHours(totalMinutes + travelMinutes),
    },
    lineItems,
    estimatedTime: totalMinutes,
    subtotal,
    gst,
    total,
  };
}

// ============================================
// Re-exports for convenience
// ============================================

export const Money = {
  toCents,
  fromCents,
  round: roundMoney,
  sumCents,
  multiplyDollars,
  applyMinimum,
  applyMinimumDollars,
  calculateGST,
  addGST,
  extractGST,
  extractSubtotal,
};

export const Time = {
  hoursToMinutes,
  minutesToHours,
  formatHours,
  sum: sumTime,
};

// ============================================
// Type Exports
// ============================================

export * from './types';

// ============================================
// Data Exports
// ============================================

export {
  CORE_WINDOW_TYPES,
  EXTENDED_WINDOW_TYPES,
  ALL_WINDOW_TYPES,
  createWindowTypeMap,
  getWindowTypesByCategory,
  WINDOW_CATEGORY_LABELS,
  DEFAULT_WINDOW_TYPE_MAP,
} from './data/window-types';

export {
  CORE_PRESSURE_SURFACES,
  EXTENDED_PRESSURE_SURFACES,
  ALL_PRESSURE_SURFACES,
  createPressureSurfaceMap,
  getSurfacesByCategory,
  SURFACE_CATEGORY_LABELS,
  DEFAULT_PRESSURE_SURFACE_MAP,
} from './data/pressure-surfaces';

export {
  WINDOW_CONDITIONS,
  ACCESS_MODIFIERS,
  PRESSURE_CONDITIONS,
  TECHNIQUE_MODIFIERS,
  ALL_MODIFIERS,
  createModifierMap,
  getModifiersByCategory,
  calculateCombinedMultiplier,
  MODIFIER_CATEGORY_LABELS,
  DEFAULT_MODIFIER_MAP,
} from './data/modifiers';
