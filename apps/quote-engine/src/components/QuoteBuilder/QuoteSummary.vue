<template>
  <q-card class="quote-summary">
    <q-card-section>
      <div class="text-h6 q-mb-md">Quote Summary</div>
      
      <!-- Line Item Count -->
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-grey">Window Lines</span>
        <span>{{ windowLineCount }}</span>
      </div>
      
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-grey">Pressure Lines</span>
        <span>{{ pressureLineCount }}</span>
      </div>
      
      <q-separator class="q-my-md" />
      
      <!-- Time Estimate -->
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-grey">
          <q-icon name="schedule" size="xs" class="q-mr-xs" />
          Estimated Time
        </span>
        <span>{{ formatTime(estimatedMinutes) }}</span>
      </div>
      
      <q-separator class="q-my-md" />
      
      <!-- Cost Breakdown -->
      <div v-if="showBreakdown" class="breakdown q-mb-md">
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-grey text-caption">Windows</span>
          <span class="text-caption">{{ formatCurrency(breakdown.windows) }}</span>
        </div>
        
        <div class="row items-center justify-between q-mb-xs">
          <span class="text-grey text-caption">Pressure</span>
          <span class="text-caption">{{ formatCurrency(breakdown.pressure) }}</span>
        </div>
        
        <div v-if="breakdown.highReach > 0" class="row items-center justify-between q-mb-xs">
          <span class="text-grey text-caption">High Reach</span>
          <span class="text-caption">{{ formatCurrency(breakdown.highReach) }}</span>
        </div>
        
        <div v-if="breakdown.setup > 0" class="row items-center justify-between q-mb-xs">
          <span class="text-grey text-caption">Setup</span>
          <span class="text-caption">{{ formatCurrency(breakdown.setup) }}</span>
        </div>
        
        <div v-if="breakdown.travel > 0" class="row items-center justify-between q-mb-xs">
          <span class="text-grey text-caption">Travel</span>
          <span class="text-caption">{{ formatCurrency(breakdown.travel) }}</span>
        </div>
        
        <div v-if="breakdown.baseFee > 0" class="row items-center justify-between q-mb-xs">
          <span class="text-grey text-caption">Base Fee</span>
          <span class="text-caption">{{ formatCurrency(breakdown.baseFee) }}</span>
        </div>
      </div>
      
      <!-- Subtotal -->
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-body2">Subtotal</span>
        <span class="text-body2">{{ formatCurrency(subtotal) }}</span>
      </div>
      
      <!-- GST -->
      <div class="row items-center justify-between q-mb-sm">
        <span class="text-grey">GST (10%)</span>
        <span>{{ formatCurrency(gst) }}</span>
      </div>
      
      <q-separator class="q-my-md" />
      
      <!-- Total -->
      <div class="row items-center justify-between">
        <span class="text-h6">Total</span>
        <span class="text-h5 text-primary text-weight-bold">
          {{ formatCurrency(total) }}
        </span>
      </div>
      
      <!-- Minimum Job Notice -->
      <div v-if="minimumApplied" class="q-mt-sm">
        <q-banner dense class="bg-warning-1 text-warning">
          <template #avatar>
            <q-icon name="info" color="warning" />
          </template>
          Minimum job charge applied
        </q-banner>
      </div>
    </q-card-section>
    
    <!-- Actions -->
    <q-card-actions align="right" class="q-px-md q-pb-md">
      <q-btn
        flat
        label="Show Breakdown"
        :icon="showBreakdown ? 'expand_less' : 'expand_more'"
        color="grey"
        size="sm"
        @click="showBreakdown = !showBreakdown"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { formatCurrency } from '@tictacstick/calculation-engine';

const props = defineProps<{
  windowLineCount: number;
  pressureLineCount: number;
  estimatedMinutes: number;
  breakdown: {
    windows: number;
    pressure: number;
    highReach: number;
    setup: number;
    travel: number;
    baseFee: number;
  };
  subtotal: number;
  gst: number;
  total: number;
  minimumJob: number;
}>();

const showBreakdown = ref(false);

const minimumApplied = computed(() => {
  const calculatedSubtotal = 
    props.breakdown.windows +
    props.breakdown.pressure +
    props.breakdown.highReach +
    props.breakdown.setup +
    props.breakdown.travel +
    props.breakdown.baseFee;
  return calculatedSubtotal < props.minimumJob;
});

function formatTime(minutes: number): string {
  if (minutes <= 0) return '0 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
</script>

<style scoped>
.quote-summary {
  position: sticky;
  top: 16px;
}

.breakdown {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  padding: 8px;
}

.body--dark .breakdown {
  background: rgba(255, 255, 255, 0.02);
}

.bg-warning-1 {
  background: rgba(255, 193, 7, 0.1);
}
</style>
