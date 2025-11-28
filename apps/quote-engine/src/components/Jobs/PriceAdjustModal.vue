<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 400px; max-width: 500px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Adjust Price</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-subtitle2 text-grey-7 q-mb-md">{{ itemDescription }}</div>
        
        <!-- Original vs New Price -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6">
            <div class="text-caption text-grey">Original Price</div>
            <div class="text-h5 text-grey-7">{{ formatCurrency(originalPrice) }}</div>
          </div>
          <div class="col-6">
            <div class="text-caption text-grey">New Price</div>
            <div class="text-h5" :class="priceClass">{{ formatCurrency(newPrice) }}</div>
          </div>
        </div>

        <!-- Price Input -->
        <q-input
          v-model.number="newPrice"
          type="number"
          outlined
          label="New Price"
          prefix="$"
          :rules="[val => val >= 0 || 'Price must be positive']"
          autofocus
          @keyup.enter="adjustIfValid"
        >
          <template #append>
            <q-btn-group flat>
              <q-btn 
                dense 
                flat 
                icon="remove" 
                @click="adjustByPercent(-10)"
                title="-10%"
              />
              <q-btn 
                dense 
                flat 
                icon="add" 
                @click="adjustByPercent(10)"
                title="+10%"
              />
            </q-btn-group>
          </template>
        </q-input>

        <!-- Quick Adjustments -->
        <div class="q-mt-md">
          <div class="text-caption text-grey q-mb-sm">Quick Adjustments</div>
          <div class="row q-gutter-xs">
            <q-btn 
              v-for="percent in quickAdjustments" 
              :key="percent"
              :label="percent > 0 ? `+${percent}%` : `${percent}%`"
              :color="percent < 0 ? 'red-4' : 'green-4'"
              :text-color="percent < 0 ? 'red-10' : 'green-10'"
              size="sm"
              unelevated
              @click="adjustByPercent(percent)"
            />
            <q-btn 
              label="Reset"
              color="grey-4"
              text-color="grey-8"
              size="sm"
              unelevated
              @click="resetPrice"
            />
          </div>
        </div>

        <!-- Difference Display -->
        <div v-if="priceDifference !== 0" class="q-mt-md">
          <q-banner 
            :class="priceDifference > 0 ? 'bg-green-1' : 'bg-red-1'"
            rounded
          >
            <template #avatar>
              <q-icon 
                :name="priceDifference > 0 ? 'trending_up' : 'trending_down'" 
                :color="priceDifference > 0 ? 'green' : 'red'"
              />
            </template>
            <span :class="priceDifference > 0 ? 'text-green-10' : 'text-red-10'">
              {{ priceDifference > 0 ? '+' : '' }}{{ formatCurrency(priceDifference) }}
              ({{ priceDifference > 0 ? '+' : '' }}{{ percentChange.toFixed(1) }}%)
            </span>
          </q-banner>
        </div>

        <!-- Reason Input -->
        <q-input
          v-model="reason"
          type="textarea"
          outlined
          label="Reason for adjustment (optional)"
          rows="2"
          class="q-mt-md"
          placeholder="e.g., Extra dirty, access issues, customer discount..."
        />

        <!-- Common Reasons -->
        <div class="q-mt-sm">
          <div class="text-caption text-grey q-mb-xs">Common reasons:</div>
          <div class="row q-gutter-xs">
            <q-chip 
              v-for="commonReason in commonReasons" 
              :key="commonReason"
              clickable
              size="sm"
              @click="reason = commonReason"
            >
              {{ commonReason }}
            </q-chip>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn 
          color="primary" 
          label="Apply Adjustment"
          :disable="newPrice === originalPrice || newPrice < 0"
          @click="applyAdjustment"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  itemId: string;
  itemDescription: string;
  originalPrice: number;
  currentPrice: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'adjust', payload: { itemId: string; newPrice: number; reason: string }): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const newPrice = ref(props.currentPrice);
const reason = ref('');

const quickAdjustments = [-25, -10, -5, 5, 10, 25];

const commonReasons = [
  'Extra dirty',
  'Access issues',
  'Customer discount',
  'First-time customer',
  'Repeat customer',
  'Weather delay',
  'Additional work',
  'Scope change',
];

watch(() => props.currentPrice, (val) => {
  newPrice.value = val;
});

watch(() => props.modelValue, (val) => {
  if (val) {
    newPrice.value = props.currentPrice;
    reason.value = '';
  }
});

const priceDifference = computed(() => newPrice.value - props.originalPrice);

const percentChange = computed(() => {
  if (props.originalPrice === 0) return 0;
  return ((newPrice.value - props.originalPrice) / props.originalPrice) * 100;
});

const priceClass = computed(() => {
  if (newPrice.value > props.originalPrice) return 'text-positive';
  if (newPrice.value < props.originalPrice) return 'text-negative';
  return '';
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
}

function adjustByPercent(percent: number) {
  const adjustment = props.originalPrice * (percent / 100);
  newPrice.value = Math.round((props.originalPrice + adjustment) * 100) / 100;
}

function resetPrice() {
  newPrice.value = props.originalPrice;
}

function adjustIfValid() {
  if (newPrice.value >= 0 && newPrice.value !== props.originalPrice) {
    applyAdjustment();
  }
}

function applyAdjustment() {
  emit('adjust', {
    itemId: props.itemId,
    newPrice: newPrice.value,
    reason: reason.value.trim(),
  });
  emit('update:modelValue', false);
}
</script>
