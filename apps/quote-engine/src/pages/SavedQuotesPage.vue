<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-lg-10">
        <!-- Header -->
        <div class="row items-center q-mb-lg">
          <div class="col">
            <h4 class="q-my-none">Saved Quotes</h4>
            <div class="text-grey">
              {{ savedQuotesStore.stats.total }} quotes • 
              {{ formatCurrency(savedQuotesStore.stats.totalValue) }} total value
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              color="primary"
              icon="add"
              label="New Quote"
              to="/quote"
            />
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6 col-sm-3">
            <q-card class="bg-blue-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-blue">{{ savedQuotesStore.stats.draft }}</div>
                <div class="text-grey">Drafts</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card class="bg-orange-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-orange">{{ savedQuotesStore.stats.sent }}</div>
                <div class="text-grey">Sent</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card class="bg-green-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-green">{{ savedQuotesStore.stats.accepted }}</div>
                <div class="text-grey">Accepted</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card class="bg-red-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-red">{{ savedQuotesStore.stats.declined }}</div>
                <div class="text-grey">Declined</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Filters -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row q-col-gutter-md items-center">
              <div class="col-12 col-sm-6 col-md-4">
                <q-input
                  v-model="searchQuery"
                  outlined
                  dense
                  placeholder="Search quotes..."
                  clearable
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6 col-md-3">
                <q-select
                  v-model="statusFilter"
                  :options="statusOptions"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Status"
                />
              </div>
              <div class="col-auto">
                <q-btn-toggle
                  v-model="sortBy"
                  toggle-color="primary"
                  :options="sortOptions"
                  size="sm"
                  rounded
                  unelevated
                />
              </div>
              <div class="col-auto">
                <q-btn
                  flat
                  round
                  dense
                  :icon="sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'"
                  @click="toggleSortDirection"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Loading State -->
        <div v-if="savedQuotesStore.isLoading" class="text-center q-pa-xl">
          <q-spinner size="lg" color="primary" />
          <div class="q-mt-md text-grey">Loading quotes...</div>
        </div>

        <!-- Empty State -->
        <q-card v-else-if="savedQuotesStore.filteredQuotes.length === 0" class="q-pa-xl text-center">
          <q-icon name="description" size="64px" color="grey" />
          <div class="text-h6 q-mt-md">No quotes found</div>
          <div class="text-grey q-mb-md">
            {{ searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Create your first quote to get started' }}
          </div>
          <q-btn
            v-if="!searchQuery && statusFilter === 'all'"
            color="primary"
            icon="add"
            label="Create Quote"
            to="/quote"
          />
        </q-card>

        <!-- Quotes List -->
        <div v-else class="q-gutter-md">
          <q-card
            v-for="quote in savedQuotesStore.filteredQuotes"
            :key="quote.id"
            class="quote-card cursor-pointer"
            @click="openQuote(quote.id)"
          >
            <q-card-section>
              <div class="row items-center q-col-gutter-md">
                <!-- Status Indicator -->
                <div class="col-auto">
                  <q-badge
                    :color="getStatusColor(quote.status)"
                    :label="quote.status"
                    class="text-capitalize"
                  />
                </div>

                <!-- Quote Info -->
                <div class="col">
                  <div class="text-subtitle1 text-weight-medium">
                    {{ quote.title || 'Untitled Quote' }}
                  </div>
                  <div class="text-grey">
                    <q-icon name="person" size="xs" class="q-mr-xs" />
                    {{ quote.clientName || 'No client' }}
                    <span v-if="quote.clientLocation" class="q-ml-sm">
                      <q-icon name="location_on" size="xs" class="q-mr-xs" />
                      {{ quote.clientLocation }}
                    </span>
                  </div>
                </div>

                <!-- Line Items Summary -->
                <div class="col-auto text-right text-grey">
                  <div v-if="quote.windowLines.length">
                    <q-icon name="window" size="xs" />
                    {{ quote.windowLines.length }} window{{ quote.windowLines.length !== 1 ? 's' : '' }}
                    <!-- High reach indicator -->
                    <q-icon
                      v-if="hasHighReach(quote)"
                      name="elevator"
                      size="xs"
                      color="orange"
                      class="q-ml-xs"
                    >
                      <q-tooltip>Includes high reach</q-tooltip>
                    </q-icon>
                    <!-- Add-ons indicator -->
                    <q-icon
                      v-if="hasAddons(quote)"
                      name="add_circle"
                      size="xs"
                      color="green"
                      class="q-ml-xs"
                    >
                      <q-tooltip>{{ getAddonCount(quote) }} add-on{{ getAddonCount(quote) !== 1 ? 's' : '' }}</q-tooltip>
                    </q-icon>
                  </div>
                  <div v-if="quote.pressureLines.length">
                    <q-icon name="waves" size="xs" />
                    {{ quote.pressureLines.length }} surface{{ quote.pressureLines.length !== 1 ? 's' : '' }}
                    <!-- Pressure Add-ons indicator -->
                    <q-icon
                      v-if="hasPressureAddons(quote)"
                      name="add_circle"
                      size="xs"
                      color="teal"
                      class="q-ml-xs"
                    >
                      <q-tooltip>{{ getPressureAddonCount(quote) }} surface add-on{{ getPressureAddonCount(quote) !== 1 ? 's' : '' }}</q-tooltip>
                    </q-icon>
                  </div>
                </div>

                <!-- Total -->
                <div class="col-auto text-right">
                  <div class="text-h6 text-primary">
                    {{ formatCurrency(quote.total) }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ formatDate(quote.updatedAt) }}
                  </div>
                </div>

                <!-- Actions -->
                <div class="col-auto">
                  <q-btn
                    flat
                    round
                    dense
                    icon="more_vert"
                    @click.stop
                  >
                    <q-menu>
                      <q-list style="min-width: 150px">
                        <q-item clickable v-close-popup @click="openQuote(quote.id)">
                          <q-item-section avatar>
                            <q-icon name="edit" />
                          </q-item-section>
                          <q-item-section>Edit</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="duplicateQuote(quote.id)">
                          <q-item-section avatar>
                            <q-icon name="content_copy" />
                          </q-item-section>
                          <q-item-section>Duplicate</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable v-close-popup>
                          <q-item-section avatar>
                            <q-icon name="send" />
                          </q-item-section>
                          <q-item-section>Send</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="convertToInvoice(quote.id)">
                          <q-item-section avatar>
                            <q-icon name="receipt" />
                          </q-item-section>
                          <q-item-section>Create Invoice</q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="scheduleJob(quote)">
                          <q-item-section avatar>
                            <q-icon name="construction" color="primary" />
                          </q-item-section>
                          <q-item-section>Schedule Job</q-item-section>
                        </q-item>
                        <q-separator />
                        <q-item clickable v-close-popup @click="confirmDelete(quote)">
                          <q-item-section avatar>
                            <q-icon name="delete" color="negative" />
                          </q-item-section>
                          <q-item-section class="text-negative">Delete</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useSavedQuotesStore } from '../stores/savedQuotes';
import { useQuoteStore } from '../stores/quote';
import { useJobStore } from '../stores/jobs';
import type { SavedQuote } from '../composables/useStorage';

const $q = useQuasar();
const router = useRouter();
const savedQuotesStore = useSavedQuotesStore();
const quoteStore = useQuoteStore();
const jobStore = useJobStore();

// Local state synced with store
const searchQuery = ref('');
const statusFilter = ref<SavedQuote['status'] | 'all'>('all');
const sortBy = ref<'date' | 'client' | 'total'>('date');
const sortDirection = ref<'asc' | 'desc'>('desc');

// Watch and sync with store
watch(searchQuery, (val) => savedQuotesStore.setSearchQuery(val));
watch(statusFilter, (val) => savedQuotesStore.setStatusFilter(val));
watch(sortBy, (val) => savedQuotesStore.setSort(val, sortDirection.value));

const statusOptions = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Sent', value: 'sent' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Declined', value: 'declined' },
];

const sortOptions = [
  { label: 'Date', value: 'date' },
  { label: 'Client', value: 'client' },
  { label: 'Total', value: 'total' },
];

onMounted(() => {
  savedQuotesStore.loadQuotes();
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function getStatusColor(status: SavedQuote['status']): string {
  switch (status) {
    case 'draft': return 'blue';
    case 'sent': return 'orange';
    case 'accepted': return 'green';
    case 'declined': return 'red';
    default: return 'grey';
  }
}

// Quote feature detection helpers
function hasHighReach(quote: SavedQuote): boolean {
  return quote.windowLines.some(line => line.highReach);
}

function hasAddons(quote: SavedQuote): boolean {
  return quote.windowLines.some(line => {
    const addons = (line as any).addons;
    return addons && Array.isArray(addons) && addons.length > 0;
  });
}

function getAddonCount(quote: SavedQuote): number {
  return quote.windowLines.reduce((count, line) => {
    const addons = (line as any).addons;
    return count + (addons && Array.isArray(addons) ? addons.length : 0);
  }, 0);
}

// Pressure add-on helpers
function hasPressureAddons(quote: SavedQuote): boolean {
  return quote.pressureLines.some(line => {
    const addons = (line as any).addons;
    return addons && Array.isArray(addons) && addons.length > 0;
  });
}

function getPressureAddonCount(quote: SavedQuote): number {
  return quote.pressureLines.reduce((count, line) => {
    const addons = (line as any).addons;
    return count + (addons && Array.isArray(addons) ? addons.length : 0);
  }, 0);
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  savedQuotesStore.setSort(sortBy.value, sortDirection.value);
}

function openQuote(id: string) {
  // Load quote into store and navigate
  const quote = savedQuotesStore.quotes.find(q => q.id === id);
  if (quote) {
    quoteStore.clientName = quote.clientName;
    quoteStore.clientLocation = quote.clientLocation;
    quoteStore.clientEmail = quote.clientEmail;
    quoteStore.clientPhone = quote.clientPhone;
    quoteStore.quoteTitle = quote.title;
    quoteStore.jobType = quote.jobType;
    quoteStore.windowLines = [...quote.windowLines];
    quoteStore.pressureLines = [...quote.pressureLines];
    // Store the ID for updating
    router.push({ path: '/quote', query: { id } });
  }
}

async function duplicateQuote(id: string) {
  const duplicate = await savedQuotesStore.duplicateQuote(id);
  if (duplicate) {
    $q.notify({
      type: 'positive',
      message: 'Quote duplicated',
      position: 'top',
    });
  }
}

function convertToInvoice(_id: string) {
  $q.notify({
    type: 'info',
    message: 'Invoice creation coming soon',
    position: 'top',
  });
}

function scheduleJob(quote: SavedQuote) {
  // Show scheduling dialog
  $q.dialog({
    title: 'Schedule Job',
    message: 'When should this job be scheduled?',
    prompt: {
      model: new Date().toISOString().split('T')[0], // Today's date
      type: 'date',
    },
    cancel: true,
    ok: {
      label: 'Schedule',
      color: 'primary',
    },
  }).onOk((scheduledDate: string) => {
    // Initialize job store and convert quote
    jobStore.initialize();
    
    const job = jobStore.convertQuoteToJob({
      quoteId: quote.id,
      clientName: quote.clientName || 'Unknown Client',
      clientAddress: quote.clientLocation || '',
      clientPhone: quote.clientPhone,
      clientEmail: quote.clientEmail,
      windowLines: quote.windowLines,
      pressureLines: quote.pressureLines,
      total: quote.total,
      scheduledDate,
      notes: quote.title ? `From quote: ${quote.title}` : undefined,
    });

    if (job) {
      $q.notify({
        type: 'positive',
        message: `Job ${job.jobNumber} scheduled for ${new Date(scheduledDate).toLocaleDateString('en-AU')}`,
        position: 'top',
        actions: [
          {
            label: 'View Job',
            color: 'white',
            handler: () => router.push(`/jobs/${job.id}`),
          },
        ],
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to create job',
        position: 'top',
      });
    }
  });
}

function confirmDelete(quote: SavedQuote) {
  $q.dialog({
    title: 'Delete Quote',
    message: `Are you sure you want to delete "${quote.title || 'Untitled Quote'}"? This cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await savedQuotesStore.deleteQuote(quote.id);
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Quote deleted',
        position: 'top',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to delete quote',
        position: 'top',
      });
    }
  });
}
</script>

<style scoped>
.quote-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.quote-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
