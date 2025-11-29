<template>
  <q-chip
    :color="chipColor"
    text-color="white"
    dense
    icon-right
    :icon="chipIcon"
    size="sm"
    class="pricing-indicator"
    clickable
    @click="showDetails = true"
  >
    <q-tooltip>{{ tooltipText }}</q-tooltip>
    {{ chipLabel }}
  </q-chip>

  <!-- Details Dialog -->
  <q-dialog v-model="showDetails">
    <q-card style="min-width: 300px">
      <q-card-section class="row items-center">
        <div class="text-h6">Pricing Info</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-list dense>
          <q-item>
            <q-item-section avatar>
              <q-icon :name="chipIcon" :color="chipColor" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Pricing Source</q-item-label>
              <q-item-label caption>{{ pricingSource }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="isUsingDynamicPricing">
            <q-item-section avatar>
              <q-icon name="category" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Service Types</q-item-label>
              <q-item-label caption>{{ serviceTypesCount }} loaded from API</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="isUsingDynamicPricing">
            <q-item-section avatar>
              <q-icon name="tune" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Modifiers</q-item-label>
              <q-item-label caption>{{ modifiersCount }} loaded from API</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section avatar>
              <q-icon name="schedule" color="grey" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Last Updated</q-item-label>
              <q-item-label caption>{{ lastUpdatedText }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn 
          flat 
          label="Refresh Pricing" 
          color="primary" 
          @click="refreshPricing"
          :loading="isLoading"
        />
        <q-btn flat label="Close" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePricingStore } from '../../stores/pricing';
import { useDynamicPricing } from '../../composables/useDynamicPricing';

/**
 * Pricing Source Indicator
 * Shows whether pricing comes from API or uses static defaults
 * Clickable to show details and allow manual refresh
 */

const showDetails = ref(false);
const pricingStore = usePricingStore();
const { pricingSource, isUsingDynamicPricing } = useDynamicPricing();

const isLoading = computed(() => pricingStore.loading);
const serviceTypesCount = computed(() => pricingStore.serviceTypes.length);
const modifiersCount = computed(() => pricingStore.modifiers.length);

const chipColor = computed(() => {
  if (pricingStore.error) return 'negative';
  if (isUsingDynamicPricing.value) return 'primary';
  return 'grey-7';
});

const chipIcon = computed(() => {
  if (pricingStore.error) return 'error';
  if (isUsingDynamicPricing.value) return 'cloud_sync';
  return 'storage';
});

const chipLabel = computed(() => {
  if (pricingStore.error) return 'Error';
  if (isUsingDynamicPricing.value) return 'API';
  return 'Default';
});

const tooltipText = computed(() => {
  if (pricingStore.error) return 'Failed to load pricing - using defaults';
  if (isUsingDynamicPricing.value) return 'Using live pricing from API';
  return 'Using built-in default pricing';
});

const lastUpdatedText = computed(() => {
  if (!pricingStore.lastFetched) return 'Never';
  const diff = Date.now() - pricingStore.lastFetched;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return new Date(pricingStore.lastFetched).toLocaleDateString();
});

async function refreshPricing() {
  await pricingStore.fetchPricing(true); // force refresh
}
</script>

<style scoped>
.pricing-indicator {
  margin-right: 8px;
  cursor: pointer;
}
</style>
