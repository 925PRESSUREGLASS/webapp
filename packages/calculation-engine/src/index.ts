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
  highReachLevel?: number;
  conditionId?: string;
  soilLevel?: 'light' | 'medium' | 'heavy';
  condition?: 'clean' | 'moderate' | 'dirty';
  accessId?: string;
  tintLevel?: 'none' | 'light' | 'heavy';
  trackClean?: boolean;
  screenClean?: boolean;
  location?: string;
  modifiers?: string[];
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

  // Determine base time per pane
  let minutesPerPane = 0;
  if (line.inside) {
    minutesPerPane += baseInside * insideMultiplier;
  }
  if (line.outside) {
    minutesPerPane += baseOutside * outsideMultiplier;
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

  // Total minutes
  const panes = line.panes || 0;
  const totalMinutes = minutesPerPane * panes * combinedFactor * modFactor;

  // Convert to cost
  const hourlyRate = config.hourlyRate || 0;
  const hours = minutesToHours(totalMinutes);
  return roundMoney(hours * hourlyRate);
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
