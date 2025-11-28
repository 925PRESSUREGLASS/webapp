import { defineStore } from 'pinia';
import { ref, computed, watch, toRaw } from 'vue';
import type { WindowLine, PressureLine, PricingConfig } from '@tictacstick/calculation-engine';
import {
  calculateGST,
  roundMoney,
  calculateWindowTime,
  calculatePressureTime,
} from '@tictacstick/calculation-engine';
import { useQuoteStorage, type SavedQuote } from '../composables/useStorage';
import {
  windowTypeMap,
  pressureSurfaceMap,
  calculateWindowLineCost,
  calculatePressureLineCost,
} from '../composables/useCalculations';

// History state for undo/redo
interface QuoteSnapshot {
  clientName: string;
  clientLocation: string;
  clientEmail: string;
  clientPhone: string;
  quoteTitle: string;
  jobType: 'residential' | 'commercial';
  windowLines: WindowLine[];
  pressureLines: PressureLine[];
}

const MAX_HISTORY = 50;

/**
 * Quote store
 * Manages the current quote state with real calculation engine
 */
export const useQuoteStore = defineStore('quote', () => {
  const storage = useQuoteStorage();

  // Current quote ID (null for new quotes)
  const currentQuoteId = ref<string | null>(null);
  const isDirty = ref(false);

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

  // Undo/Redo history
  const history = ref<QuoteSnapshot[]>([]);
  const historyIndex = ref(-1);
  const isUndoRedo = ref(false);

  // Cost breakdown computed
  const breakdown = computed(() => {
    let windows = 0;
    let pressure = 0;
    let highReach = 0;

    // Calculate window costs using shared composable
    windowLines.value.forEach(line => {
      const cost = calculateWindowLineCost(line, pricingConfig.value);
      // Separate high reach costs
      if (line.highReach) {
        const baseCost = calculateWindowLineCost(
          { ...line, highReach: false },
          pricingConfig.value
        );
        windows += baseCost;
        highReach += cost - baseCost;
      } else {
        windows += cost;
      }
    });

    // Calculate pressure costs using shared composable
    pressureLines.value.forEach(line => {
      pressure += calculatePressureLineCost(line, pricingConfig.value);
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

  // Undo/Redo computed
  const canUndo = computed(() => historyIndex.value > 0);
  const canRedo = computed(() => historyIndex.value < history.value.length - 1);

  // Create snapshot of current state
  function createSnapshot(): QuoteSnapshot {
    return {
      clientName: clientName.value,
      clientLocation: clientLocation.value,
      clientEmail: clientEmail.value,
      clientPhone: clientPhone.value,
      quoteTitle: quoteTitle.value,
      jobType: jobType.value,
      windowLines: JSON.parse(JSON.stringify(toRaw(windowLines.value))),
      pressureLines: JSON.parse(JSON.stringify(toRaw(pressureLines.value))),
    };
  }

  // Restore from snapshot
  function restoreSnapshot(snapshot: QuoteSnapshot) {
    isUndoRedo.value = true;
    clientName.value = snapshot.clientName;
    clientLocation.value = snapshot.clientLocation;
    clientEmail.value = snapshot.clientEmail;
    clientPhone.value = snapshot.clientPhone;
    quoteTitle.value = snapshot.quoteTitle;
    jobType.value = snapshot.jobType;
    windowLines.value = JSON.parse(JSON.stringify(snapshot.windowLines));
    pressureLines.value = JSON.parse(JSON.stringify(snapshot.pressureLines));
    isUndoRedo.value = false;
  }

  // Push state to history
  function pushHistory() {
    if (isUndoRedo.value) return;

    // Remove any future states if we're not at the end
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    // Add current state
    history.value.push(createSnapshot());

    // Trim history if too long
    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(-MAX_HISTORY);
    }

    historyIndex.value = history.value.length - 1;
    isDirty.value = true;
  }

  // Undo
  function undo() {
    if (!canUndo.value) return;
    historyIndex.value--;
    restoreSnapshot(history.value[historyIndex.value]);
  }

  // Redo
  function redo() {
    if (!canRedo.value) return;
    historyIndex.value++;
    restoreSnapshot(history.value[historyIndex.value]);
  }

  // Watch for changes and push to history
  watch(
    [windowLines, pressureLines],
    () => {
      if (!isUndoRedo.value) {
        pushHistory();
      }
    },
    { deep: true }
  );

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
    currentQuoteId.value = null;
    clientName.value = '';
    clientLocation.value = '';
    clientEmail.value = '';
    clientPhone.value = '';
    quoteTitle.value = '';
    quoteDate.value = new Date();
    windowLines.value = [];
    pressureLines.value = [];
    history.value = [];
    historyIndex.value = -1;
    isDirty.value = false;
  }

  function generateLineId(): string {
    return `line_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Save quote to storage
  async function saveQuote(): Promise<{ success: boolean; id: string | null }> {
    const id = currentQuoteId.value || storage.generateId();
    const now = new Date().toISOString();

    const quote: SavedQuote = {
      id,
      title: quoteTitle.value || `Quote ${new Date().toLocaleDateString()}`,
      clientName: clientName.value,
      clientLocation: clientLocation.value,
      clientEmail: clientEmail.value,
      clientPhone: clientPhone.value,
      jobType: jobType.value,
      windowLines: JSON.parse(JSON.stringify(toRaw(windowLines.value))),
      pressureLines: JSON.parse(JSON.stringify(toRaw(pressureLines.value))),
      pricingConfig: JSON.parse(JSON.stringify(toRaw(pricingConfig.value))),
      subtotal: subtotal.value,
      gst: gst.value,
      total: total.value,
      estimatedMinutes: estimatedMinutes.value,
      createdAt: currentQuoteId.value ? (await storage.loadQuote(id))?.createdAt || now : now,
      updatedAt: now,
      status: 'draft',
    };

    const success = await storage.saveQuote(quote);
    if (success) {
      currentQuoteId.value = id;
      isDirty.value = false;
    }

    return { success, id: success ? id : null };
  }

  // Load quote from storage
  async function loadQuote(id: string): Promise<boolean> {
    const quote = await storage.loadQuote(id);
    if (!quote) return false;

    currentQuoteId.value = quote.id;
    quoteTitle.value = quote.title;
    clientName.value = quote.clientName;
    clientLocation.value = quote.clientLocation;
    clientEmail.value = quote.clientEmail;
    clientPhone.value = quote.clientPhone;
    jobType.value = quote.jobType;
    windowLines.value = [...quote.windowLines];
    pressureLines.value = [...quote.pressureLines];
    if (quote.pricingConfig) {
      pricingConfig.value = { ...quote.pricingConfig };
    }

    // Reset history
    history.value = [createSnapshot()];
    historyIndex.value = 0;
    isDirty.value = false;

    return true;
  }

  // Autosave
  function autosave() {
    storage.saveAutosave({
      clientName: clientName.value,
      clientLocation: clientLocation.value,
      clientEmail: clientEmail.value,
      clientPhone: clientPhone.value,
      quoteTitle: quoteTitle.value,
      jobType: jobType.value,
      windowLines: JSON.parse(JSON.stringify(toRaw(windowLines.value))),
      pressureLines: JSON.parse(JSON.stringify(toRaw(pressureLines.value))),
      pricingConfig: JSON.parse(JSON.stringify(toRaw(pricingConfig.value))),
      savedAt: new Date().toISOString(),
    });
  }

  // Load autosave
  function loadAutosave(): boolean {
    const data = storage.loadAutosave();
    if (!data) return false;

    clientName.value = data.clientName;
    clientLocation.value = data.clientLocation;
    clientEmail.value = data.clientEmail;
    clientPhone.value = data.clientPhone;
    quoteTitle.value = data.quoteTitle;
    jobType.value = data.jobType;
    windowLines.value = [...data.windowLines];
    pressureLines.value = [...data.pressureLines];
    if (data.pricingConfig) {
      pricingConfig.value = { ...data.pricingConfig };
    }

    return true;
  }

  // Expose the maps for components
  function getWindowTypeMap() {
    return windowTypeMap;
  }

  function getPressureSurfaceMap() {
    return pressureSurfaceMap;
  }

  // Quote validation
  const validation = computed(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (windowLines.value.length === 0 && pressureLines.value.length === 0) {
      errors.push('Quote must have at least one line item');
    }

    if (!clientName.value.trim()) {
      warnings.push('Client name is empty');
    }

    if (!clientLocation.value.trim()) {
      warnings.push('Client location is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  });

  return {
    // State
    currentQuoteId,
    isDirty,
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
    canUndo,
    canRedo,
    validation,
    
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
    
    // Save/Load
    saveQuote,
    loadQuote,
    autosave,
    loadAutosave,
    
    // Undo/Redo
    undo,
    redo,
  };
});
