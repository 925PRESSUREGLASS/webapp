<template>
  <q-page class="analytics-page q-pa-md">
    <!-- Header -->
    <div class="row q-mb-md items-center">
      <div class="col">
        <h4 class="q-ma-none">Analytics Dashboard</h4>
        <p class="text-caption text-grey q-mb-none">{{ dateRangeLabel }}</p>
      </div>
      <div class="col-auto">
        <q-select
          v-model="analyticsStore.selectedDateRange"
          :options="dateRangeOptions"
          dense
          outlined
          emit-value
          map-options
          style="min-width: 180px"
        />
      </div>
      <div class="col-auto q-ml-sm">
        <q-btn flat icon="file_download" @click="exportReport" title="Export Report" />
        <q-btn flat icon="refresh" @click="refresh" title="Refresh" />
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div
        v-for="kpi in analyticsStore.kpis"
        :key="kpi.id"
        class="col-6 col-sm-4 col-md-2"
      >
        <q-card class="kpi-card" :class="`kpi-${kpi.status}`">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold">
              {{ formatKpiValue(kpi) }}
            </div>
            <div class="text-caption text-grey">{{ kpi.name }}</div>
            <q-linear-progress
              :value="Math.min(kpi.value / kpi.target, 1)"
              :color="getKpiColor(kpi.status)"
              class="q-mt-sm"
              size="4px"
            />
            <div class="text-caption text-grey-6 q-mt-xs">
              Target: {{ formatKpiTarget(kpi) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="row q-col-gutter-md">
      <!-- Revenue Overview -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6">Revenue Overview</div>
              <q-btn-toggle
                v-model="trendGroupBy"
                toggle-color="primary"
                :options="[
                  { label: 'Day', value: 'day' },
                  { label: 'Week', value: 'week' },
                  { label: 'Month', value: 'month' },
                ]"
                dense
                flat
              />
            </div>
          </q-card-section>
          <q-card-section class="chart-container">
            <div v-if="revenueTrendData.length > 0" class="trend-chart">
              <!-- Simple bar chart visualization -->
              <div class="chart-bars">
                <div
                  v-for="(point, index) in revenueTrendData"
                  :key="index"
                  class="chart-bar-group"
                >
                  <div class="chart-bar-container">
                    <div
                      class="chart-bar bg-primary"
                      :style="{ height: getBarHeight(point.revenue) }"
                      :title="`Revenue: $${point.revenue.toFixed(2)}`"
                    />
                    <div
                      class="chart-bar bg-positive"
                      :style="{ height: getBarHeight(point.paid) }"
                      :title="`Paid: $${point.paid.toFixed(2)}`"
                    />
                  </div>
                  <div class="chart-label text-caption">{{ point.label }}</div>
                </div>
              </div>
              <div class="chart-legend q-mt-md">
                <span class="legend-item"><span class="legend-dot bg-primary" /> Revenue</span>
                <span class="legend-item"><span class="legend-dot bg-positive" /> Paid</span>
              </div>
            </div>
            <div v-else class="text-center text-grey q-pa-xl">
              <q-icon name="show_chart" size="48px" color="grey-4" />
              <div class="q-mt-sm">No data for selected period</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Revenue Summary -->
      <div class="col-12 col-md-4">
        <q-card class="full-height">
          <q-card-section>
            <div class="text-h6">Revenue Summary</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Total Revenue</q-item-label>
                  <q-item-label class="text-h5 text-weight-bold">
                    ${{ formatMoney(analyticsStore.revenueMetrics.totalRevenue) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Collected</q-item-label>
                  <q-item-label class="text-h6 text-positive">
                    ${{ formatMoney(analyticsStore.revenueMetrics.paidRevenue) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge color="positive">
                    {{ analyticsStore.revenueMetrics.collectionRate.toFixed(0) }}%
                  </q-badge>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Outstanding</q-item-label>
                  <q-item-label class="text-h6 text-warning">
                    ${{ formatMoney(analyticsStore.revenueMetrics.outstandingRevenue) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator class="q-my-sm" />
              <q-item>
                <q-item-section>
                  <q-item-label caption>Avg Quote Value</q-item-label>
                  <q-item-label class="text-subtitle1">
                    ${{ formatMoney(analyticsStore.revenueMetrics.averageQuoteValue) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label caption>Avg Invoice Value</q-item-label>
                  <q-item-label class="text-subtitle1">
                    ${{ formatMoney(analyticsStore.revenueMetrics.averageInvoiceValue) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Conversion Funnel -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Conversion Funnel</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="funnel-container">
              <div
                v-for="(stage, index) in analyticsStore.conversionFunnel"
                :key="stage.name"
                class="funnel-stage"
              >
                <div class="funnel-bar-container">
                  <div
                    class="funnel-bar"
                    :style="{ width: `${stage.percentage}%` }"
                    :class="getFunnelColor(index)"
                  />
                </div>
                <div class="funnel-info">
                  <span class="funnel-name">{{ stage.name }}</span>
                  <span class="funnel-count">{{ stage.count }}</span>
                  <span class="funnel-percentage text-grey">{{ stage.percentage.toFixed(0) }}%</span>
                </div>
                <div v-if="stage.dropoff && stage.dropoff > 0" class="funnel-dropoff text-negative text-caption">
                  ↓ {{ stage.dropoff.toFixed(0) }}% drop-off
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Service Breakdown -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Service Breakdown</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list>
              <q-item v-for="service in analyticsStore.serviceBreakdown" :key="service.name">
                <q-item-section avatar>
                  <q-avatar :color="getServiceColor(service.name)" text-color="white" size="40px">
                    <q-icon :name="getServiceIcon(service.name)" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ service.name }}</q-item-label>
                  <q-item-label caption>{{ service.count }} quotes</q-item-label>
                  <q-linear-progress
                    :value="service.percentage / 100"
                    :color="getServiceColor(service.name)"
                    class="q-mt-xs"
                    size="6px"
                  />
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-weight-bold">${{ formatMoney(service.value) }}</q-item-label>
                  <q-item-label caption>{{ service.percentage.toFixed(0) }}%</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- Sales Metrics -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Sales Performance</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold text-primary">
                    {{ analyticsStore.salesMetrics.quotesGenerated }}
                  </div>
                  <div class="text-caption text-grey">Quotes Generated</div>
                </div>
              </div>
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold text-positive">
                    {{ analyticsStore.salesMetrics.quotesAccepted }}
                  </div>
                  <div class="text-caption text-grey">Quotes Accepted</div>
                </div>
              </div>
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold">
                    {{ analyticsStore.salesMetrics.conversionRate.toFixed(1) }}%
                  </div>
                  <div class="text-caption text-grey">Conversion Rate</div>
                </div>
              </div>
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold">
                    {{ analyticsStore.salesMetrics.averageTimeToClose.toFixed(1) }}
                  </div>
                  <div class="text-caption text-grey">Avg Days to Close</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Customer Metrics -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Customer Insights</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold text-primary">
                    {{ analyticsStore.customerMetrics.totalCustomers }}
                  </div>
                  <div class="text-caption text-grey">Total Customers</div>
                </div>
              </div>
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold text-info">
                    {{ analyticsStore.customerMetrics.newCustomers }}
                  </div>
                  <div class="text-caption text-grey">New Customers</div>
                </div>
              </div>
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold text-positive">
                    {{ analyticsStore.customerMetrics.repeatCustomers }}
                  </div>
                  <div class="text-caption text-grey">Repeat Customers</div>
                </div>
              </div>
              <div class="col-6">
                <div class="metric-box">
                  <div class="text-h4 text-weight-bold">
                    ${{ formatMoney(analyticsStore.customerMetrics.averageCustomerValue) }}
                  </div>
                  <div class="text-caption text-grey">Avg Customer Value</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Top Customers -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Top Customers</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-table
              :rows="analyticsStore.topCustomers"
              :columns="topCustomersColumns"
              row-key="name"
              flat
              dense
              :pagination="{ rowsPerPage: 5 }"
            >
              <template #body-cell-value="props">
                <q-td :props="props">
                  <span class="text-weight-bold">${{ formatMoney(props.value) }}</span>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAnalyticsStore, type GroupBy, type KPI } from '../stores/analytics';
import { useQuoteStore } from '../stores/quote';
import { useInvoiceStore } from '../stores/invoices';

const $q = useQuasar();
const analyticsStore = useAnalyticsStore();
const quoteStore = useQuoteStore();
const invoiceStore = useInvoiceStore();

// Initialize stores
onMounted(() => {
  quoteStore.loadSavedQuotes();
  invoiceStore.initialize();
});

// State
const trendGroupBy = ref<GroupBy>('day');

// Date range options
const dateRangeOptions = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last_7_days' },
  { label: 'Last 30 Days', value: 'last_30_days' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Quarter', value: 'this_quarter' },
  { label: 'This Year', value: 'this_year' },
];

// Computed
const dateRangeLabel = computed(() => {
  return analyticsStore.getDateRange().label;
});

const revenueTrendData = computed(() => {
  return analyticsStore.getRevenueTrend(trendGroupBy.value);
});

const maxRevenue = computed(() => {
  if (revenueTrendData.value.length === 0) return 1;
  return Math.max(...revenueTrendData.value.map(p => Math.max(p.revenue, p.paid))) || 1;
});

// Top customers table columns
const topCustomersColumns = [
  { name: 'name', label: 'Customer', field: 'name', align: 'left' as const, sortable: true },
  { name: 'quotes', label: 'Quotes', field: 'quotes', align: 'center' as const, sortable: true },
  { name: 'value', label: 'Total Value', field: 'value', align: 'right' as const, sortable: true },
];

// Methods
function formatMoney(value: number): string {
  return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatKpiValue(kpi: KPI): string {
  switch (kpi.format) {
    case 'currency':
      return `$${formatMoney(kpi.value)}`;
    case 'percentage':
      return `${kpi.value.toFixed(1)}%`;
    case 'hours':
      return `${kpi.value.toFixed(1)}h`;
    default:
      return kpi.value.toFixed(0);
  }
}

function formatKpiTarget(kpi: KPI): string {
  switch (kpi.format) {
    case 'currency':
      return `$${formatMoney(kpi.target)}`;
    case 'percentage':
      return `${kpi.target}%`;
    case 'hours':
      return `${kpi.target}h`;
    default:
      return kpi.target.toString();
  }
}

function getKpiColor(status: string): string {
  switch (status) {
    case 'good': return 'positive';
    case 'warning': return 'warning';
    case 'critical': return 'negative';
    default: return 'grey';
  }
}

function getBarHeight(value: number): string {
  const percentage = (value / maxRevenue.value) * 100;
  return `${Math.max(percentage, 2)}%`;
}

function getFunnelColor(index: number): string {
  const colors = ['bg-primary', 'bg-info', 'bg-positive', 'bg-warning'];
  return colors[index % colors.length];
}

function getServiceColor(name: string): string {
  if (name.includes('Window')) return 'blue';
  if (name.includes('Pressure')) return 'orange';
  return 'purple';
}

function getServiceIcon(name: string): string {
  if (name.includes('Window')) return 'window';
  if (name.includes('Pressure')) return 'water_drop';
  return 'cleaning_services';
}

function refresh() {
  quoteStore.loadSavedQuotes();
  invoiceStore.initialize();
  $q.notify({ message: 'Dashboard refreshed', type: 'positive' });
}

function exportReport() {
  const data = analyticsStore.exportReport();
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-report-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  $q.notify({ message: 'Report exported', type: 'positive' });
}
</script>

<style scoped>
.analytics-page {
  max-width: 1400px;
  margin: 0 auto;
}

/* KPI Cards */
.kpi-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.kpi-good {
  border-left: 4px solid var(--q-positive);
}

.kpi-warning {
  border-left: 4px solid var(--q-warning);
}

.kpi-critical {
  border-left: 4px solid var(--q-negative);
}

/* Chart Container */
.chart-container {
  min-height: 300px;
}

.trend-chart {
  height: 280px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 4px;
  padding-bottom: 24px;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 60px;
}

.chart-bar-container {
  display: flex;
  gap: 2px;
  height: 200px;
  align-items: flex-end;
}

.chart-bar {
  width: 12px;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
}

.chart-label {
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50px;
  text-align: center;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

/* Funnel */
.funnel-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.funnel-stage {
  position: relative;
}

.funnel-bar-container {
  height: 32px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.funnel-bar {
  height: 100%;
  min-width: 4px;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.funnel-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  font-size: 13px;
}

.funnel-name {
  flex: 1;
}

.funnel-count {
  font-weight: bold;
  margin-right: 8px;
}

.funnel-dropoff {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
}

/* Metric Box */
.metric-box {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.full-height {
  height: 100%;
}
</style>
