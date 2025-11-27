import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WindowLine, PressureLine, PricingConfig, WindowTypeConfig, PressureSurfaceConfig } from '@tictacstick/calculation-engine';
import {
  calculateGST,
  roundMoney,
  calculateWindowCost,
  calculateWindowTime,
  calculatePressureCost,
  calculatePressureTime,
  createWindowTypeMap,
  createPressureSurfaceMap,
} from '@tictacstick/calculation-engine';

// Create lookup maps for window types and pressure surfaces
const windowTypeMap: Map<string, WindowTypeConfig> = createWindowTypeMap();
const pressureSurfaceMap: Map<string, PressureSurfaceConfig> = createPressureSurfaceMap();

/**
 * Quote store
 * Manages the current quote state with real calculation engine
 */
export const useQuoteStore = defineStore('quote', () => {
  // Client information
  const clientName = ref('');
  const clientLocation = ref('');
  const clientEmail = ref('');
  const clientPhone = ref('');

  // Quote metadata
  const quoteTitle = ref('');
  const quoteDate = ref(new Date());
  const jobType = ref<'residential' | 'commercial'>('residential');

  // Line items
  const windowLines = ref<WindowLine[]>([]);
  const pressureLines = ref<PressureLine[]>([]);

  // Pricing configuration
  const pricingConfig = ref<PricingConfig>({
    baseFee: 0,
    hourlyRate: 60,
    minimumJob: 80,
    highReachModifierPercent: 40,
    insideMultiplier: 1,
    outsideMultiplier: 1,
    pressureHourlyRate: 80,
    setupBufferMinutes: 15,
  });

  // Cost breakdown computed
  const breakdown = computed(() => {
    let windows = 0;
    let pressure = 0;
    let highReach = 0;

    // Calculate window costs
    windowLines.value.forEach(line => {
      const cost = calculateWindowCost(line, pricingConfig.value, windowTypeMap);
      // Separate high reach costs
      if (line.highReach) {
        const baseCost = calculateWindowCost(
          { ...line, highReach: false },
          pricingConfig.value,
          windowTypeMap
        );
        windows += baseCost;
        highReach += cost - baseCost;
      } else {
        windows += cost;
      }
    });

    // Calculate pressure costs
    pressureLines.value.forEach(line => {
      pressure += calculatePressureCost(line, pricingConfig.value, pressureSurfaceMap);
    });

    return {
      windows: roundMoney(windows),
      pressure: roundMoney(pressure),
      highReach: roundMoney(highReach),
      setup: 0, // Could add setup fee logic
      travel: 0, // Could add travel fee logic
      baseFee: pricingConfig.value.baseFee,
    };
  });

  // Time estimate computed
  const estimatedMinutes = computed(() => {
    let totalMinutes = pricingConfig.value.setupBufferMinutes;

    // Window time
    windowLines.value.forEach(line => {
      totalMinutes += calculateWindowTime(
        line,
        windowTypeMap,
        pricingConfig.value.insideMultiplier,
        pricingConfig.value.outsideMultiplier
      );
    });

    // Pressure time
    pressureLines.value.forEach(line => {
      totalMinutes += calculatePressureTime(line, pressureSurfaceMap);
    });

    return Math.round(totalMinutes);
  });

  // Computed totals using real calculation
  const subtotal = computed(() => {
    const lineTotal =
      breakdown.value.windows +
      breakdown.value.pressure +
      breakdown.value.highReach +
      breakdown.value.setup +
      breakdown.value.travel +
      breakdown.value.baseFee;
    
    return roundMoney(Math.max(lineTotal, pricingConfig.value.minimumJob));
  });

  const gst = computed(() => {
    const { gst } = calculateGST(subtotal.value);
    return gst;
  });

  const total = computed(() => {
    const { total } = calculateGST(subtotal.value);
    return total;
  });

  // Actions
  function addWindowLine(line: WindowLine) {
    windowLines.value.push(line);
  }

  function removeWindowLine(id: string) {
    const index = windowLines.value.findIndex(l => l.id === id);
    if (index !== -1) {
      windowLines.value.splice(index, 1);
    }
  }

  function updateWindowLine(id: string, updates: Partial<WindowLine>) {
    const line = windowLines.value.find(l => l.id === id);
    if (line) {
      Object.assign(line, updates);
    }
  }

  function addPressureLine(line: PressureLine) {
    pressureLines.value.push(line);
  }

  function removePressureLine(id: string) {
    const index = pressureLines.value.findIndex(l => l.id === id);
    if (index !== -1) {
      pressureLines.value.splice(index, 1);
    }
  }

  function updatePressureLine(id: string, updates: Partial<PressureLine>) {
    const line = pressureLines.value.find(l => l.id === id);
    if (line) {
      Object.assign(line, updates);
    }
  }

  function clearQuote() {
    clientName.value = '';
    clientLocation.value = '';
    clientEmail.value = '';
    clientPhone.value = '';
    quoteTitle.value = '';
    quoteDate.value = new Date();
    windowLines.value = [];
    pressureLines.value = [];
  }

  function generateLineId(): string {
    return `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Expose the maps for components
  function getWindowTypeMap() {
    return windowTypeMap;
  }

  function getPressureSurfaceMap() {
    return pressureSurfaceMap;
  }

  return {
    // State
    clientName,
    clientLocation,
    clientEmail,
    clientPhone,
    quoteTitle,
    quoteDate,
    jobType,
    windowLines,
    pressureLines,
    pricingConfig,
    
    // Computed
    breakdown,
    estimatedMinutes,
    subtotal,
    gst,
    total,
    
    // Actions
    addWindowLine,
    removeWindowLine,
    updateWindowLine,
    addPressureLine,
    removePressureLine,
    updatePressureLine,
    clearQuote,
    generateLineId,
    getWindowTypeMap,
    getPressureSurfaceMap,
  };
});
