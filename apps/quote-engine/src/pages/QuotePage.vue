<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="row items-center q-mb-md">
          <div class="col">
            <h4 class="q-my-none">Create Quote</h4>
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
                  v-model="quoteStore.clientName"
                  label="Client Name"
                  outlined
                  dense
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
            <q-btn flat color="primary" label="Save Quote" @click="saveQuote" />
            <q-btn color="primary" label="Create Invoice" @click="createInvoice" />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useQuoteStore } from '../stores/quote';
import QuoteBuilder from '../components/QuoteBuilder/QuoteBuilder.vue';
import PriceDisplay from '../components/QuoteBuilder/PriceDisplay.vue';

const $q = useQuasar();
const quoteStore = useQuoteStore();

function saveQuote() {
  // TODO: Implement save quote logic
  $q.notify({
    type: 'positive',
    message: 'Quote saved successfully!',
  });
}

function createInvoice() {
  // TODO: Implement create invoice logic
  $q.notify({
    type: 'info',
    message: 'Invoice creation coming soon!',
  });
}
</script>
