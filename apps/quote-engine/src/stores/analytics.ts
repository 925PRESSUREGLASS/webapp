/**
 * Analytics Store
 * Business intelligence and metrics for quotes, invoices, and clients
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useQuoteStore } from './quote';
import { useInvoiceStore } from './invoices';
import { useClientsStore } from './clients';

// Types
export type DateRangeType = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';
export type GroupBy = 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
  rangeType: DateRangeType;
  label: string;
}

export interface RevenueMetrics {
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
  averageQuoteValue: number;
  averageInvoiceValue: number;
  totalQuoteValue: number;
  invoiceCount: number;
  collectionRate: number;
}

export interface SalesMetrics {
  quotesGenerated: number;
  quotesSent: number;
  quotesAccepted: number;
  quotesDeclined: number;
  conversionRate: number;
  winRate: number;
  averageTimeToClose: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  repeatCustomers: number;
  repeatCustomerRate: number;
  averageCustomerValue: number;
}

export interface ServiceBreakdown {
  name: string;
  count: number;
  value: number;
  percentage: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropoff?: number;
}

export interface TrendDataPoint {
  period: string;
  label: string;
  revenue: number;
  paid: number;
  outstanding: number;
  quoteCount: number;
  invoiceCount: number;
}

export interface KPI {
  id: string;
  name: string;
  value: number;
  target: number;
  format: 'currency' | 'percentage' | 'number' | 'hours';
  category: 'financial' | 'sales' | 'operations' | 'customer';
  trend?: number; // percentage change from previous period
  status: 'good' | 'warning' | 'critical';
}

// KPI Configurations
const KPI_CONFIGS = {
  revenue: {
    id: 'revenue',
    name: 'Total Revenue',
    category: 'financial' as const,
    format: 'currency' as const,
    target: 20000,
  },
  averageQuoteValue: {
    id: 'avg_quote_value',
    name: 'Average Quote Value',
    category: 'financial' as const,
    format: 'currency' as const,
    target: 850,
  },
  collectionRate: {
    id: 'collection_rate',
    name: 'Collection Rate',
    category: 'financial' as const,
    format: 'percentage' as const,
    target: 95,
  },
  quotesGenerated: {
    id: 'quotes_generated',
    name: 'Quotes Generated',
    category: 'sales' as const,
    format: 'number' as const,
    target: 30,
  },
  conversionRate: {
    id: 'conversion_rate',
    name: 'Conversion Rate',
    category: 'sales' as const,
    format: 'percentage' as const,
    target: 35,
  },
  repeatCustomerRate: {
    id: 'repeat_rate',
    name: 'Repeat Customers',
    category: 'customer' as const,
    format: 'percentage' as const,
    target: 25,
  },
};

export const useAnalyticsStore = defineStore('analytics', () => {
  // State
  const selectedDateRange = ref<DateRangeType>('last_30_days');
  const customStartDate = ref<string>('');
  const customEndDate = ref<string>('');
  const isLoading = ref(false);

  // Get stores
  const quoteStore = useQuoteStore();
  const invoiceStore = useInvoiceStore();
  const clientsStore = useClientsStore();

  // Date Range Helpers
  function getDateRange(rangeType: DateRangeType = selectedDateRange.value): DateRange {
    const now = new Date();
    let start: Date;
    let end: Date;
    let label: string;

    switch (rangeType) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        label = 'Today';
        break;

      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        label = 'Yesterday';
        break;

      case 'last_7_days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        label = 'Last 7 Days';
        break;

      case 'last_30_days':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        label = 'Last 30 Days';
        break;

      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        label = now.toLocaleString('en-AU', { month: 'long', year: 'numeric' });
        break;

      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-AU', { month: 'long', year: 'numeric' });
        break;

      case 'this_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
        label = `Q${quarter + 1} ${now.getFullYear()}`;
        break;

      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        label = `${now.getFullYear()}`;
        break;

      case 'custom':
        start = customStartDate.value ? new Date(customStartDate.value) : new Date(now.getFullYear(), now.getMonth(), 1);
        end = customEndDate.value ? new Date(customEndDate.value + 'T23:59:59.999') : now;
        label = `${start.toLocaleDateString('en-AU')} - ${end.toLocaleDateString('en-AU')}`;
        break;

      default:
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
        end = now;
        label = 'Last 30 Days';
    }

    return { start, end, rangeType, label };
  }

  function getPreviousDateRange(range: DateRange): DateRange {
    const duration = range.end.getTime() - range.start.getTime();
    const prevEnd = new Date(range.start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);
    
    return {
      start: prevStart,
      end: prevEnd,
      rangeType: 'custom',
      label: 'Previous Period',
    };
  }

  // Filter helpers
  function filterByDateRange<T extends { createdAt?: string; timestamp?: string }>(
    items: T[],
    range: DateRange,
    dateField: 'createdAt' | 'timestamp' = 'createdAt'
  ): T[] {
    return items.filter(item => {
      const dateStr = item[dateField];
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= range.start && date <= range.end;
    });
  }

  // Revenue Metrics
  const revenueMetrics = computed((): RevenueMetrics => {
    const range = getDateRange();
    const invoices = invoiceStore.getAll();
    const quotes = quoteStore.savedQuotes;

    // Filter by date
    const filteredInvoices = invoices.filter(inv => {
      const date = new Date(inv.invoiceDate);
      return date >= range.start && date <= range.end && inv.status !== 'draft' && inv.status !== 'cancelled';
    });

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const outstandingRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.balance, 0);
    const totalQuoteValue = filteredQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

    return {
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      averageQuoteValue: filteredQuotes.length > 0 ? totalQuoteValue / filteredQuotes.length : 0,
      averageInvoiceValue: filteredInvoices.length > 0 ? totalRevenue / filteredInvoices.length : 0,
      totalQuoteValue,
      invoiceCount: filteredInvoices.length,
      collectionRate: totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0,
    };
  });

  // Sales Metrics
  const salesMetrics = computed((): SalesMetrics => {
    const range = getDateRange();
    const quotes = quoteStore.savedQuotes;
    const invoices = invoiceStore.getAll();

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    // Count quotes that became invoices
    let acceptedCount = 0;
    const closeTimes: number[] = [];

    filteredQuotes.forEach(quote => {
      const matchingInvoice = invoices.find(inv => 
        inv.quoteId === quote.id || inv.quoteTitle === quote.title
      );
      if (matchingInvoice) {
        acceptedCount++;
        // Calculate time to close
        const quoteDate = new Date(quote.savedAt || quote.createdAt);
        const invoiceDate = new Date(matchingInvoice.createdAt);
        const days = (invoiceDate.getTime() - quoteDate.getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 0) closeTimes.push(days);
      }
    });

    const quotesGenerated = filteredQuotes.length;
    const conversionRate = quotesGenerated > 0 ? (acceptedCount / quotesGenerated) * 100 : 0;
    const averageTimeToClose = closeTimes.length > 0
      ? closeTimes.reduce((a, b) => a + b, 0) / closeTimes.length
      : 0;

    return {
      quotesGenerated,
      quotesSent: quotesGenerated, // Assume all saved quotes are sent
      quotesAccepted: acceptedCount,
      quotesDeclined: 0, // No tracking for declined
      conversionRate,
      winRate: conversionRate, // Same as conversion for now
      averageTimeToClose,
    };
  });

  // Customer Metrics
  const customerMetrics = computed((): CustomerMetrics => {
    const range = getDateRange();
    const quotes = quoteStore.savedQuotes;

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    const customerMap: Record<string, { count: number; value: number }> = {};

    filteredQuotes.forEach(quote => {
      const clientName = quote.clientName || 'Unknown';
      if (!customerMap[clientName]) {
        customerMap[clientName] = { count: 0, value: 0 };
      }
      customerMap[clientName].count++;
      customerMap[clientName].value += quote.grandTotal || 0;
    });

    const customerNames = Object.keys(customerMap);
    const totalCustomers = customerNames.length;
    const repeatCustomers = customerNames.filter(name => customerMap[name].count > 1).length;
    const newCustomers = totalCustomers - repeatCustomers;
    const totalValue = customerNames.reduce((sum, name) => sum + customerMap[name].value, 0);

    return {
      totalCustomers,
      newCustomers,
      repeatCustomers,
      repeatCustomerRate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0,
      averageCustomerValue: totalCustomers > 0 ? totalValue / totalCustomers : 0,
    };
  });

  // Service Breakdown
  const serviceBreakdown = computed((): ServiceBreakdown[] => {
    const range = getDateRange();
    const quotes = quoteStore.savedQuotes;

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    const breakdown: Record<string, { count: number; value: number }> = {
      'Window Cleaning': { count: 0, value: 0 },
      'Pressure Cleaning': { count: 0, value: 0 },
      'Combined Service': { count: 0, value: 0 },
    };

    filteredQuotes.forEach(quote => {
      const hasWindows = quote.windowLines && quote.windowLines.length > 0;
      const hasPressure = quote.pressureLines && quote.pressureLines.length > 0;

      let service = 'Combined Service';
      if (hasWindows && !hasPressure) service = 'Window Cleaning';
      else if (hasPressure && !hasWindows) service = 'Pressure Cleaning';

      breakdown[service].count++;
      breakdown[service].value += quote.grandTotal || 0;
    });

    const total = filteredQuotes.length;
    return Object.entries(breakdown).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      percentage: total > 0 ? (data.count / total) * 100 : 0,
    }));
  });

  // Conversion Funnel
  const conversionFunnel = computed((): FunnelStage[] => {
    const range = getDateRange();
    const quotes = quoteStore.savedQuotes;
    const invoices = invoiceStore.getAll();

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    const quotesCount = filteredQuotes.length;
    let acceptedCount = 0;
    let paidCount = 0;

    filteredQuotes.forEach(quote => {
      const matchingInvoice = invoices.find(inv => 
        inv.quoteId === quote.id || inv.quoteTitle === quote.title
      );
      if (matchingInvoice) {
        acceptedCount++;
        if (matchingInvoice.status === 'paid') paidCount++;
      }
    });

    const stages: FunnelStage[] = [
      { name: 'Quotes Created', count: quotesCount, percentage: 100 },
      { name: 'Quotes Sent', count: quotesCount, percentage: 100 },
      { name: 'Quotes Accepted', count: acceptedCount, percentage: quotesCount > 0 ? (acceptedCount / quotesCount) * 100 : 0 },
      { name: 'Invoices Paid', count: paidCount, percentage: quotesCount > 0 ? (paidCount / quotesCount) * 100 : 0 },
    ];

    // Add dropoff rates
    for (let i = 1; i < stages.length; i++) {
      const prev = stages[i - 1].count;
      const curr = stages[i].count;
      stages[i].dropoff = prev > 0 ? ((prev - curr) / prev) * 100 : 0;
    }

    return stages;
  });

  // Revenue Trend
  function getRevenueTrend(groupBy: GroupBy = 'day'): TrendDataPoint[] {
    const range = getDateRange();
    const invoices = invoiceStore.getAll();
    const quotes = quoteStore.savedQuotes;

    const filteredInvoices = invoices.filter(inv => {
      const date = new Date(inv.invoiceDate);
      return date >= range.start && date <= range.end && inv.status !== 'draft' && inv.status !== 'cancelled';
    });

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    const trendMap: Record<string, TrendDataPoint> = {};

    // Process invoices
    filteredInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      const period = formatPeriod(date, groupBy);
      const label = formatLabel(date, groupBy);

      if (!trendMap[period]) {
        trendMap[period] = { period, label, revenue: 0, paid: 0, outstanding: 0, quoteCount: 0, invoiceCount: 0 };
      }

      trendMap[period].revenue += inv.total;
      trendMap[period].paid += inv.amountPaid;
      trendMap[period].outstanding += inv.balance;
      trendMap[period].invoiceCount++;
    });

    // Process quotes
    filteredQuotes.forEach(quote => {
      const date = new Date(quote.savedAt || quote.createdAt);
      const period = formatPeriod(date, groupBy);
      const label = formatLabel(date, groupBy);

      if (!trendMap[period]) {
        trendMap[period] = { period, label, revenue: 0, paid: 0, outstanding: 0, quoteCount: 0, invoiceCount: 0 };
      }

      trendMap[period].quoteCount++;
    });

    return Object.values(trendMap).sort((a, b) => a.period.localeCompare(b.period));
  }

  function formatPeriod(date: Date, groupBy: GroupBy): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (groupBy) {
      case 'month':
        return `${year}-${month}`;
      case 'week':
        const week = getWeekNumber(date);
        return `${year}-W${String(week).padStart(2, '0')}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  function formatLabel(date: Date, groupBy: GroupBy): string {
    switch (groupBy) {
      case 'month':
        return date.toLocaleString('en-AU', { month: 'short', year: 'numeric' });
      case 'week':
        return `Week ${getWeekNumber(date)}`;
      default:
        return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    }
  }

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // KPIs
  const kpis = computed((): KPI[] => {
    const revenue = revenueMetrics.value;
    const sales = salesMetrics.value;
    const customers = customerMetrics.value;

    const getStatus = (value: number, target: number, higherIsBetter = true): 'good' | 'warning' | 'critical' => {
      const ratio = value / target;
      if (higherIsBetter) {
        if (ratio >= 1) return 'good';
        if (ratio >= 0.7) return 'warning';
        return 'critical';
      } else {
        if (ratio <= 1) return 'good';
        if (ratio <= 1.3) return 'warning';
        return 'critical';
      }
    };

    return [
      {
        ...KPI_CONFIGS.revenue,
        value: revenue.totalRevenue,
        status: getStatus(revenue.totalRevenue, KPI_CONFIGS.revenue.target),
      },
      {
        ...KPI_CONFIGS.averageQuoteValue,
        value: revenue.averageQuoteValue,
        status: getStatus(revenue.averageQuoteValue, KPI_CONFIGS.averageQuoteValue.target),
      },
      {
        ...KPI_CONFIGS.collectionRate,
        value: revenue.collectionRate,
        status: getStatus(revenue.collectionRate, KPI_CONFIGS.collectionRate.target),
      },
      {
        ...KPI_CONFIGS.quotesGenerated,
        value: sales.quotesGenerated,
        status: getStatus(sales.quotesGenerated, KPI_CONFIGS.quotesGenerated.target),
      },
      {
        ...KPI_CONFIGS.conversionRate,
        value: sales.conversionRate,
        status: getStatus(sales.conversionRate, KPI_CONFIGS.conversionRate.target),
      },
      {
        ...KPI_CONFIGS.repeatCustomerRate,
        value: customers.repeatCustomerRate,
        status: getStatus(customers.repeatCustomerRate, KPI_CONFIGS.repeatCustomerRate.target),
      },
    ];
  });

  // Top Customers
  const topCustomers = computed(() => {
    const range = getDateRange();
    const quotes = quoteStore.savedQuotes;

    const filteredQuotes = quotes.filter(q => {
      const date = new Date(q.savedAt || q.createdAt);
      return date >= range.start && date <= range.end;
    });

    const customerMap: Record<string, { name: string; quotes: number; value: number }> = {};

    filteredQuotes.forEach(quote => {
      const name = quote.clientName || 'Unknown';
      if (!customerMap[name]) {
        customerMap[name] = { name, quotes: 0, value: 0 };
      }
      customerMap[name].quotes++;
      customerMap[name].value += quote.grandTotal || 0;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  });

  // Actions
  function setDateRange(rangeType: DateRangeType, startDate?: string, endDate?: string) {
    selectedDateRange.value = rangeType;
    if (rangeType === 'custom' && startDate && endDate) {
      customStartDate.value = startDate;
      customEndDate.value = endDate;
    }
  }

  // Export data
  function exportReport(): string {
    const range = getDateRange();
    const data = {
      exportDate: new Date().toISOString(),
      dateRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        label: range.label,
      },
      revenue: revenueMetrics.value,
      sales: salesMetrics.value,
      customers: customerMetrics.value,
      serviceBreakdown: serviceBreakdown.value,
      funnel: conversionFunnel.value,
      kpis: kpis.value,
      topCustomers: topCustomers.value,
    };

    return JSON.stringify(data, null, 2);
  }

  return {
    // State
    selectedDateRange,
    customStartDate,
    customEndDate,
    isLoading,

    // Computed
    revenueMetrics,
    salesMetrics,
    customerMetrics,
    serviceBreakdown,
    conversionFunnel,
    kpis,
    topCustomers,

    // Methods
    getDateRange,
    getPreviousDateRange,
    getRevenueTrend,
    setDateRange,
    exportReport,
  };
});
