import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LocalStorage } from 'quasar';
import type {
  InvoiceStatus,
  PaymentMethod,
  WindowLineItem,
  PressureLineItem,
} from '@tictacstick/calculation-engine';
import { roundMoney, calculateGST } from '@tictacstick/calculation-engine';

// ============================================
// Invoice Types
// ============================================

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  status: InvoiceStatus;
  timestamp: string;
  note?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  invoiceDate: string;
  dueDate: string;
  
  // Status
  status: InvoiceStatus;
  statusHistory: StatusHistoryEntry[];
  
  // Client info
  clientId?: string;
  clientName: string;
  clientLocation: string;
  clientEmail?: string;
  clientPhone?: string;
  
  // Quote reference
  quoteId?: string;
  quoteTitle?: string;
  jobType: 'residential' | 'commercial';
  
  // Line items
  lineItems: InvoiceLineItem[];
  windowLines?: WindowLineItem[];
  pressureLines?: PressureLineItem[];
  
  // Totals
  subtotal: number;
  gst: number;
  total: number;
  breakdown?: {
    baseFee: number;
    windows: number;
    pressure: number;
    highReach: number;
    setup: number;
    travel: number;
  };
  
  // Payment info
  amountPaid: number;
  balance: number;
  payments: Payment[];
  
  // Notes
  notes?: string;
  internalNotes?: string;
  clientNotes?: string;
}

export interface InvoiceSettings {
  nextInvoiceNumber: number;
  invoicePrefix: string;
  paymentTermsDays: number;
  bankName: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  abn: string;
  includeGST: boolean;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  cancelled: number;
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  averageInvoice: number;
}

// ============================================
// Constants
// ============================================

const INVOICES_KEY = 'tts-invoices-v2';
const INVOICE_SETTINGS_KEY = 'tts-invoice-settings-v2';

export const INVOICE_STATUSES: Record<InvoiceStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'grey', icon: 'edit_note' },
  sent: { label: 'Sent', color: 'info', icon: 'send' },
  paid: { label: 'Paid', color: 'positive', icon: 'check_circle' },
  overdue: { label: 'Overdue', color: 'negative', icon: 'warning' },
  cancelled: { label: 'Cancelled', color: 'grey-6', icon: 'cancel' },
};

const DEFAULT_SETTINGS: InvoiceSettings = {
  nextInvoiceNumber: 1001,
  invoicePrefix: 'INV-',
  paymentTermsDays: 7,
  bankName: '',
  accountName: '',
  bsb: '',
  accountNumber: '',
  abn: '',
  includeGST: true,
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  businessEmail: '',
};

// ============================================
// Invoice Store
// ============================================

export const useInvoiceStore = defineStore('invoices', () => {
  // State
  const invoices = ref<Invoice[]>([]);
  const settings = ref<InvoiceSettings>({ ...DEFAULT_SETTINGS });
  const isLoaded = ref(false);

  // ============================================
  // Persistence
  // ============================================

  function loadInvoices(): void {
    try {
      const saved = LocalStorage.getItem<Invoice[]>(INVOICES_KEY);
      if (Array.isArray(saved)) {
        invoices.value = saved;
      }
    } catch (e) {
      console.error('[INVOICES] Failed to load invoices:', e);
    }
  }

  function saveInvoices(): void {
    try {
      LocalStorage.set(INVOICES_KEY, invoices.value);
    } catch (e) {
      console.error('[INVOICES] Failed to save invoices:', e);
    }
  }

  function loadSettings(): void {
    try {
      const saved = LocalStorage.getItem<InvoiceSettings>(INVOICE_SETTINGS_KEY);
      if (saved) {
        settings.value = { ...DEFAULT_SETTINGS, ...saved };
      }
    } catch (e) {
      console.error('[INVOICES] Failed to load settings:', e);
    }
  }

  function saveSettings(): void {
    try {
      LocalStorage.set(INVOICE_SETTINGS_KEY, settings.value);
    } catch (e) {
      console.error('[INVOICES] Failed to save settings:', e);
    }
  }

  function initialize(): void {
    if (!isLoaded.value) {
      loadSettings();
      loadInvoices();
      isLoaded.value = true;
    }
  }

  // ============================================
  // Invoice Number Generation
  // ============================================

  function getNextInvoiceNumber(): string {
    const number = settings.value.invoicePrefix + settings.value.nextInvoiceNumber;
    settings.value.nextInvoiceNumber++;
    saveSettings();
    return number;
  }

  function getHighestInvoiceNumber(): number {
    if (invoices.value.length === 0) return 0;
    
    let highest = 0;
    for (const invoice of invoices.value) {
      const numericPart = invoice.invoiceNumber.replace(/[^0-9]/g, '');
      const num = parseInt(numericPart) || 0;
      if (num > highest) highest = num;
    }
    return highest;
  }

  // ============================================
  // CRUD Operations
  // ============================================

  function createInvoice(data: Partial<Invoice>): Invoice {
    const now = new Date().toISOString();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + settings.value.paymentTermsDays);

    const invoice: Invoice = {
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoiceNumber: getNextInvoiceNumber(),
      createdAt: now,
      updatedAt: now,
      invoiceDate: now,
      dueDate: dueDate.toISOString(),
      status: 'draft',
      statusHistory: [{ status: 'draft', timestamp: now, note: 'Invoice created' }],
      clientName: data.clientName || 'Unknown Client',
      clientLocation: data.clientLocation || '',
      clientEmail: data.clientEmail || '',
      clientPhone: data.clientPhone || '',
      jobType: data.jobType || 'residential',
      lineItems: data.lineItems || [],
      windowLines: data.windowLines,
      pressureLines: data.pressureLines,
      subtotal: data.subtotal || 0,
      gst: data.gst || 0,
      total: data.total || 0,
      breakdown: data.breakdown,
      amountPaid: 0,
      balance: data.total || 0,
      payments: [],
      quoteId: data.quoteId,
      quoteTitle: data.quoteTitle,
      clientId: data.clientId,
      internalNotes: data.internalNotes || '',
      clientNotes: data.clientNotes || '',
    };

    invoices.value.unshift(invoice);
    saveInvoices();
    return invoice;
  }

  function getInvoice(id: string): Invoice | null {
    return invoices.value.find(inv => inv.id === id) || null;
  }

  function getInvoiceByNumber(invoiceNumber: string): Invoice | null {
    return invoices.value.find(inv => inv.invoiceNumber === invoiceNumber) || null;
  }

  function updateInvoice(id: string, updates: Partial<Invoice>): Invoice | null {
    const index = invoices.value.findIndex(inv => inv.id === id);
    if (index === -1) return null;

    const invoice = invoices.value[index];
    const updated: Invoice = {
      ...invoice,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Recalculate balance if total or amountPaid changed
    if (updates.total !== undefined || updates.amountPaid !== undefined) {
      updated.balance = roundMoney(updated.total - updated.amountPaid);
    }

    invoices.value[index] = updated;
    saveInvoices();
    return updated;
  }

  function deleteInvoice(id: string): boolean {
    const index = invoices.value.findIndex(inv => inv.id === id);
    if (index === -1) return false;

    invoices.value.splice(index, 1);
    saveInvoices();
    return true;
  }

  // ============================================
  // Status Management
  // ============================================

  function updateStatus(id: string, newStatus: InvoiceStatus, note?: string): boolean {
    const invoice = getInvoice(id);
    if (!invoice) return false;

    invoice.status = newStatus;
    invoice.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || '',
    });
    invoice.updatedAt = new Date().toISOString();

    saveInvoices();
    return true;
  }

  function checkOverdueInvoices(): number {
    const now = Date.now();
    let overdueCount = 0;

    for (const invoice of invoices.value) {
      if (
        invoice.status === 'sent' &&
        new Date(invoice.dueDate).getTime() < now &&
        invoice.balance > 0
      ) {
        invoice.status = 'overdue';
        invoice.statusHistory.push({
          status: 'overdue',
          timestamp: new Date().toISOString(),
          note: 'Automatically marked overdue',
        });
        overdueCount++;
      }
    }

    if (overdueCount > 0) {
      saveInvoices();
    }

    return overdueCount;
  }

  // ============================================
  // Payment Recording
  // ============================================

  function recordPayment(
    invoiceId: string,
    paymentData: {
      amount: number;
      method: PaymentMethod;
      date?: string;
      reference?: string;
      notes?: string;
    }
  ): boolean {
    const invoice = getInvoice(invoiceId);
    if (!invoice) return false;

    const payment: Payment = {
      id: `payment_${Date.now()}`,
      amount: roundMoney(paymentData.amount),
      method: paymentData.method,
      date: paymentData.date || new Date().toISOString(),
      reference: paymentData.reference,
      notes: paymentData.notes,
    };

    invoice.payments.push(payment);
    invoice.amountPaid = roundMoney(invoice.amountPaid + payment.amount);
    invoice.balance = roundMoney(invoice.total - invoice.amountPaid);
    invoice.updatedAt = new Date().toISOString();

    // Update status if fully paid
    if (invoice.balance <= 0.01) {
      updateStatus(invoiceId, 'paid', 'Fully paid');
    } else if (invoice.status === 'overdue') {
      updateStatus(invoiceId, 'sent', 'Partial payment received');
    }

    saveInvoices();
    return true;
  }

  function removePayment(invoiceId: string, paymentId: string): boolean {
    const invoice = getInvoice(invoiceId);
    if (!invoice) return false;

    const paymentIndex = invoice.payments.findIndex(p => p.id === paymentId);
    if (paymentIndex === -1) return false;

    const payment = invoice.payments[paymentIndex];
    invoice.payments.splice(paymentIndex, 1);
    invoice.amountPaid = roundMoney(invoice.amountPaid - payment.amount);
    invoice.balance = roundMoney(invoice.total - invoice.amountPaid);
    invoice.updatedAt = new Date().toISOString();

    // Update status if was paid but now has balance
    if (invoice.status === 'paid' && invoice.balance > 0.01) {
      updateStatus(invoiceId, 'sent', 'Payment removed, balance outstanding');
    }

    saveInvoices();
    return true;
  }

  // ============================================
  // Quote to Invoice Conversion
  // ============================================

  interface QuoteData {
    id: string;
    quoteTitle?: string;
    clientName: string;
    clientLocation?: string;
    clientEmail?: string;
    clientPhone?: string;
    clientId?: string;
    jobType: 'residential' | 'commercial';
    windowLines: WindowLineItem[];
    pressureLines: PressureLineItem[];
    subtotal: number;
    gst: number;
    total: number;
    breakdown?: {
      baseFee: number;
      windows: number;
      pressure: number;
      highReach: number;
      setup: number;
      travel: number;
    };
    internalNotes?: string;
    clientNotes?: string;
  }

  function generateLineDescription(line: WindowLineItem | PressureLineItem, type: 'window' | 'pressure'): string {
    if (type === 'window') {
      const windowLine = line as WindowLineItem;
      const parts: string[] = [];
      
      // Window type
      parts.push(windowLine.windowTypeId || 'Window');
      
      // Panes
      if (windowLine.panes) {
        parts.push(`(${windowLine.panes} panes)`);
      }
      
      // Inside/outside
      const sides: string[] = [];
      if (windowLine.inside) sides.push('inside');
      if (windowLine.outside) sides.push('outside');
      if (sides.length > 0) {
        parts.push(`- ${sides.join(' & ')}`);
      }
      
      // High reach
      if (windowLine.highReach) {
        parts.push('- high reach');
      }
      
      // Location
      if (windowLine.location?.trim()) {
        parts.push(`at ${windowLine.location}`);
      }
      
      return parts.join(' ');
    } else {
      const pressureLine = line as PressureLineItem;
      const parts: string[] = [];
      
      // Surface type
      parts.push(pressureLine.surfaceId || 'Pressure cleaning');
      
      // Area
      if (pressureLine.areaSqm) {
        parts.push(`(${pressureLine.areaSqm} sqm)`);
      }
      
      // Access
      if (pressureLine.access && pressureLine.access !== 'easy') {
        parts.push(`- ${pressureLine.access} access`);
      }
      
      // Notes
      if (pressureLine.notes?.trim()) {
        parts.push(`- ${pressureLine.notes}`);
      }
      
      return parts.join(' ');
    }
  }

  function convertQuoteToInvoice(quote: QuoteData): Invoice {
    // Convert window lines to invoice line items
    const windowItems: InvoiceLineItem[] = (quote.windowLines || []).map(line => ({
      id: line.id,
      description: generateLineDescription(line, 'window'),
      quantity: 1,
      unitPrice: line.calculatedCost || 0,
      amount: line.calculatedCost || 0,
    }));

    // Convert pressure lines to invoice line items
    const pressureItems: InvoiceLineItem[] = (quote.pressureLines || []).map(line => ({
      id: line.id,
      description: generateLineDescription(line, 'pressure'),
      quantity: 1,
      unitPrice: line.calculatedCost || 0,
      amount: line.calculatedCost || 0,
    }));

    // Create invoice
    return createInvoice({
      quoteId: quote.id,
      quoteTitle: quote.quoteTitle,
      clientId: quote.clientId,
      clientName: quote.clientName || 'Unknown Client',
      clientLocation: quote.clientLocation || '',
      clientEmail: quote.clientEmail,
      clientPhone: quote.clientPhone,
      jobType: quote.jobType,
      lineItems: [...windowItems, ...pressureItems],
      windowLines: quote.windowLines,
      pressureLines: quote.pressureLines,
      subtotal: quote.subtotal,
      gst: quote.gst,
      total: quote.total,
      breakdown: quote.breakdown,
      internalNotes: quote.internalNotes,
      clientNotes: quote.clientNotes,
    });
  }

  // ============================================
  // Filtering and Search
  // ============================================

  function getAll(): Invoice[] {
    return [...invoices.value].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getByStatus(status: InvoiceStatus): Invoice[] {
    return invoices.value.filter(inv => inv.status === status);
  }

  function search(query: string): Invoice[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return getAll();

    return invoices.value.filter(inv => 
      inv.invoiceNumber.toLowerCase().includes(lowerQuery) ||
      inv.clientName.toLowerCase().includes(lowerQuery) ||
      inv.clientLocation.toLowerCase().includes(lowerQuery) ||
      inv.quoteTitle?.toLowerCase().includes(lowerQuery)
    );
  }

  function getByDateRange(startDate: Date, endDate: Date): Invoice[] {
    const start = startDate.getTime();
    const end = endDate.getTime();
    
    return invoices.value.filter(inv => {
      const date = new Date(inv.invoiceDate).getTime();
      return date >= start && date <= end;
    });
  }

  // ============================================
  // Statistics and Reports
  // ============================================

  const stats = computed<InvoiceStats>(() => {
    const list = invoices.value;
    const result: InvoiceStats = {
      total: list.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      totalRevenue: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      averageInvoice: 0,
    };

    for (const invoice of list) {
      result[invoice.status]++;
      result.totalRevenue += invoice.total;
      result.totalPaid += invoice.amountPaid;
      result.totalOutstanding += invoice.balance;
    }

    result.averageInvoice = result.total > 0 ? roundMoney(result.totalRevenue / result.total) : 0;
    return result;
  });

  function getAgingReport(): { current: Invoice[]; days30: Invoice[]; days60: Invoice[]; days90Plus: Invoice[] } {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    const current: Invoice[] = [];
    const days30: Invoice[] = [];
    const days60: Invoice[] = [];
    const days90Plus: Invoice[] = [];

    for (const invoice of invoices.value) {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') continue;
      if (invoice.balance <= 0) continue;

      const dueDate = new Date(invoice.dueDate).getTime();
      const daysOverdue = Math.floor((now - dueDate) / day);

      if (daysOverdue <= 0) {
        current.push(invoice);
      } else if (daysOverdue <= 30) {
        days30.push(invoice);
      } else if (daysOverdue <= 60) {
        days60.push(invoice);
      } else {
        days90Plus.push(invoice);
      }
    }

    return { current, days30, days60, days90Plus };
  }

  // ============================================
  // Export/Import
  // ============================================

  function exportInvoices(): string {
    return JSON.stringify({
      invoices: invoices.value,
      settings: settings.value,
      exportedAt: new Date().toISOString(),
      version: '2.0',
    }, null, 2);
  }

  function importInvoices(jsonData: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      const importedInvoices = data.invoices || data;
      
      if (!Array.isArray(importedInvoices)) {
        return { success: false, count: 0, error: 'Invalid data format' };
      }

      let count = 0;
      for (const invoice of importedInvoices) {
        if (invoice.id && invoice.invoiceNumber) {
          // Check for existing
          const exists = invoices.value.some(inv => inv.id === invoice.id);
          if (!exists) {
            invoices.value.push(invoice);
            count++;
          }
        }
      }

      if (count > 0) {
        saveInvoices();
      }

      return { success: true, count };
    } catch (e) {
      return { success: false, count: 0, error: 'Failed to parse JSON' };
    }
  }

  // ============================================
  // Settings
  // ============================================

  function updateSettings(newSettings: Partial<InvoiceSettings>): void {
    settings.value = { ...settings.value, ...newSettings };
    saveSettings();
  }

  function getSettings(): InvoiceSettings {
    return { ...settings.value };
  }

  // ============================================
  // Return Store
  // ============================================

  return {
    // State
    invoices: computed(() => invoices.value),
    settings: computed(() => settings.value),
    isLoaded,
    stats,

    // Initialization
    initialize,

    // Invoice Number
    getNextInvoiceNumber,
    getHighestInvoiceNumber,

    // CRUD
    createInvoice,
    getInvoice,
    getInvoiceByNumber,
    updateInvoice,
    deleteInvoice,

    // Status
    updateStatus,
    checkOverdueInvoices,

    // Payments
    recordPayment,
    removePayment,

    // Quote Conversion
    convertQuoteToInvoice,

    // Filtering
    getAll,
    getByStatus,
    search,
    getByDateRange,

    // Reports
    getAgingReport,

    // Export/Import
    exportInvoices,
    importInvoices,

    // Settings
    updateSettings,
    getSettings,

    // Clear all
    clearAll: () => {
      invoices.value = [];
      saveInvoices();
    },

    // Save invoice (for import)
    saveInvoice: (invoice: Invoice) => {
      const index = invoices.value.findIndex((i) => i.id === invoice.id);
      if (index >= 0) {
        invoices.value[index] = invoice;
      } else {
        invoices.value.push(invoice);
      }
      saveInvoices();
    },
  };
});
