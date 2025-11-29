<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="row items-center q-mb-md">
          <div class="col">
            <h4 class="q-my-none">
              {{ quoteStore.currentQuoteId ? 'Edit Quote' : 'Create Quote' }}
            </h4>
            <div v-if="quoteStore.quoteTitle" class="text-grey">
              {{ quoteStore.quoteTitle }}
            </div>
          </div>
          <div class="col-auto">
            <PriceDisplay :amount="quoteStore.total" size="large" />
          </div>
        </div>

        <!-- Client Information -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-h6">Client Information</div>
          </q-card-section>
          <q-card-section>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="quoteStore.quoteTitle"
                  label="Quote Title"
                  outlined
                  dense
                  placeholder="e.g., Window Cleaning - March 2025"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="quoteStore.jobType"
                  :options="jobTypeOptions"
                  label="Job Type"
                  outlined
                  dense
                  emit-value
                  map-options
                />
              </div>
              <div class="col-12 col-sm-6">
                <ClientAutocomplete
                  v-model="quoteStore.clientName"
                  @client-selected="handleClientSelected"
                  @manage-clients="router.push('/clients')"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="quoteStore.clientLocation"
                  label="Location"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="quoteStore.clientEmail"
                  label="Email"
                  type="email"
                  outlined
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="quoteStore.clientPhone"
                  label="Phone"
                  type="tel"
                  outlined
                  dense
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Quote Builder Component -->
        <QuoteBuilder />

        <!-- Summary Card -->
        <q-card class="q-mt-md">
          <q-card-section>
            <div class="text-h6">Quote Summary</div>
          </q-card-section>
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <span>Subtotal:</span>
              <PriceDisplay :amount="quoteStore.subtotal" />
            </div>
            <div class="row items-center justify-between q-mb-sm">
              <span>GST (10%):</span>
              <PriceDisplay :amount="quoteStore.gst" />
            </div>
            <q-separator class="q-my-sm" />
            <div class="row items-center justify-between">
              <span class="text-weight-bold">Total:</span>
              <PriceDisplay :amount="quoteStore.total" size="large" />
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat color="primary" label="Save Quote" @click="handleSave" />
            <q-btn flat color="secondary" icon="email" label="Email Quote" @click="openEmailDialog" />
            <q-btn color="primary" label="Create Invoice" @click="createInvoice" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Email Dialog -->
    <EmailDialog
      v-model="showEmailDialog"
      type="quote"
      :recipient-email="quoteStore.clientEmail"
      :document-number="quoteStore.currentQuoteId || 'DRAFT'"
      :attachment-base64="quotePdfBase64"
      :attachment-name="quotePdfFilename"
      @sent="handleEmailSent"
    />

    <!-- Loading overlay -->
    <q-inner-loading :showing="isLoading">
      <q-spinner size="50px" color="primary" />
    </q-inner-loading>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useQuoteStore } from '../stores/quote';
import { useInvoiceStore } from '../stores/invoices';
import { useAuthStore } from '../stores/auth';
import { useSyncStore } from '../stores/sync';
import QuoteBuilder from '../components/QuoteBuilder/QuoteBuilder.vue';
import PriceDisplay from '../components/QuoteBuilder/PriceDisplay.vue';
import ClientAutocomplete from '../components/QuoteBuilder/ClientAutocomplete.vue';
import EmailDialog from '../components/Email/EmailDialog.vue';
import type { Client } from '../stores/clients';
import {
  calculateWindowLineCost,
  calculatePressureLineCost,
} from '../composables/useCalculations';
import { generateQuotePdfBase64, type QuoteData } from '../utils/pdf-generator';
import { buildQuoteSyncPayload, buildInvoiceSyncPayload } from '../utils/sync-payloads';

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const quoteStore = useQuoteStore();
const invoiceStore = useInvoiceStore();
const authStore = useAuthStore();
const syncStore = useSyncStore();

const isLoading = ref(false);
const showEmailDialog = ref(false);
const quotePdfBase64 = ref('');

// Computed filename for the PDF attachment
const quotePdfFilename = computed(function() {
  var quoteId = quoteStore.currentQuoteId || 'DRAFT';
  return 'Quote-' + quoteId + '.pdf';
});

const jobTypeOptions = [
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
];

// Handle client selection from autocomplete
function handleClientSelected(client: Client) {
  quoteStore.clientLocation = client.location;
  quoteStore.clientEmail = client.email;
  quoteStore.clientPhone = client.phone;
}

// Load quote from URL parameter if present
onMounted(async () => {
  syncStore.init();

  const quoteId = route.query.id as string;
  if (quoteId && quoteId !== quoteStore.currentQuoteId) {
    isLoading.value = true;
    try {
      const success = await quoteStore.loadQuote(quoteId);
      if (!success) {
        $q.notify({
          type: 'warning',
          message: 'Quote not found',
          position: 'top',
        });
        router.replace({ path: '/quote' });
      }
    } finally {
      isLoading.value = false;
    }
  }
});

// Watch for route changes
watch(() => route.query.id, async (newId) => {
  if (newId && newId !== quoteStore.currentQuoteId) {
    isLoading.value = true;
    try {
      await quoteStore.loadQuote(newId as string);
    } finally {
      isLoading.value = false;
    }
  } else if (!newId && quoteStore.currentQuoteId) {
    // URL cleared, start fresh
    quoteStore.clearQuote();
  }
});

async function handleSave() {
  const isNew = !quoteStore.currentQuoteId;
  const { success, id } = await quoteStore.saveQuote();

  if (success) {
    if (id && authStore.isAuthenticated) {
      var payload = buildQuoteSyncPayload({
        id,
        title: quoteStore.quoteTitle,
        clientName: quoteStore.clientName || 'Unknown Client',
        clientLocation: quoteStore.clientLocation,
        clientEmail: quoteStore.clientEmail,
        clientPhone: quoteStore.clientPhone,
        jobType: quoteStore.jobType,
        windowLines: quoteStore.windowLines,
        pressureLines: quoteStore.pressureLines,
        subtotal: quoteStore.subtotal,
        gst: quoteStore.gst,
        total: quoteStore.total,
      });
      syncStore.queueChange('quotes', id, isNew ? 'create' : 'update', payload);
    }

    $q.notify({
      type: 'positive',
      message: 'Quote saved successfully!',
      position: 'top',
    });
  } else {
    $q.notify({
      type: 'negative',
      message: 'Failed to save quote',
      position: 'top',
    });
  }
}

function createInvoice() {
  if (!quoteStore.validation.isValid) {
    $q.notify({
      type: 'warning',
      message: quoteStore.validation.errors.join(', '),
      position: 'top',
    });
    return;
  }

  // Initialize invoice store if not already
  invoiceStore.initialize();

  // Calculate costs for each window line using shared composable
  const windowLinesWithCost = quoteStore.windowLines.map(line => {
    const cost = calculateWindowLineCost(line, quoteStore.pricingConfig);
    return {
      ...line,
      calculatedCost: cost,
    };
  });

  // Calculate costs for each pressure line using shared composable
  const pressureLinesWithCost = quoteStore.pressureLines.map(line => {
    const cost = calculatePressureLineCost(line, quoteStore.pricingConfig);
    return {
      ...line,
      calculatedCost: cost,
    };
  });

  // Convert quote to invoice with calculated costs
  const invoice = invoiceStore.convertQuoteToInvoice({
    id: quoteStore.currentQuoteId || `quote_${Date.now()}`,
    quoteTitle: quoteStore.quoteTitle,
    clientName: quoteStore.clientName,
    clientLocation: quoteStore.clientLocation,
    clientEmail: quoteStore.clientEmail,
    clientPhone: quoteStore.clientPhone,
    jobType: quoteStore.jobType,
    windowLines: windowLinesWithCost,
    pressureLines: pressureLinesWithCost,
    subtotal: quoteStore.subtotal,
    gst: quoteStore.gst,
    total: quoteStore.total,
    breakdown: quoteStore.breakdown,
  });

  $q.notify({
    type: 'positive',
    message: `Invoice ${invoice.invoiceNumber} created!`,
    position: 'top',
    actions: [
      { label: 'View', color: 'white', handler: () => router.push('/invoices') }
    ]
  });

  if (authStore.isAuthenticated) {
    var invoicePayload = buildInvoiceSyncPayload(invoice);
    syncStore.queueChange('invoices', invoice.id, 'create', invoicePayload);
  }
}

// Email dialog handlers
async function openEmailDialog() {
  isLoading.value = true;
  
  try {
    // Calculate costs for window lines
    var windowLinesWithCost = quoteStore.windowLines.map(function(line) {
      var cost = calculateWindowLineCost(line, quoteStore.pricingConfig);
      return { ...line, calculatedCost: cost };
    });
    
    // Calculate costs for pressure lines
    var pressureLinesWithCost = quoteStore.pressureLines.map(function(line) {
      var cost = calculatePressureLineCost(line, quoteStore.pricingConfig);
      return { ...line, calculatedCost: cost };
    });
    
    // Build quote data for PDF generation
    var quoteData: QuoteData = {
      id: quoteStore.currentQuoteId || 'DRAFT',
      title: quoteStore.quoteTitle,
      clientName: quoteStore.clientName,
      clientLocation: quoteStore.clientLocation,
      clientEmail: quoteStore.clientEmail,
      clientPhone: quoteStore.clientPhone,
      jobType: quoteStore.jobType,
      windowLines: windowLinesWithCost,
      pressureLines: pressureLinesWithCost,
      breakdown: quoteStore.breakdown,
      subtotal: quoteStore.subtotal,
      gst: quoteStore.gst,
      total: quoteStore.total,
    };
    
    // Generate real PDF as base64
    quotePdfBase64.value = await generateQuotePdfBase64(quoteData);
    showEmailDialog.value = true;
  } catch (err) {
    console.error('[QuotePage] PDF generation failed:', err);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate quote PDF',
      position: 'top',
    });
  } finally {
    isLoading.value = false;
  }
}

function handleEmailSent(result: { success: boolean; messageId?: string }) {
  if (result.success) {
    $q.notify({
      type: 'positive',
      message: 'Quote email sent successfully!',
      position: 'top',
    });
  }
}
</script>
