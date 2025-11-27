import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WindowLine, PressureLine, PricingConfig } from '@tictacstick/calculation-engine';
import { calculateGST, roundMoney } from '@tictacstick/calculation-engine';

/**
 * Quote store
 * Manages the current quote state
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

  // Computed totals
  const subtotal = computed(() => {
    // TODO: Implement actual calculation using calculation-engine
    let total = pricingConfig.value.baseFee;
    
    // Placeholder calculation
    windowLines.value.forEach(line => {
      total += (line.panes || 0) * 5;
    });
    
    pressureLines.value.forEach(line => {
      total += (line.areaSqm || 0) * 3;
    });
    
    return roundMoney(Math.max(total, pricingConfig.value.minimumJob));
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
  };
});
