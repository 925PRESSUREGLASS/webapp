<template>
  <span
    :class="[
      'price-display',
      { 'price-display--large': size === 'large' },
      { 'price-display--small': size === 'small' },
    ]"
  >
    {{ formattedAmount }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '@tictacstick/calculation-engine';

const props = withDefaults(
  defineProps<{
    amount: number;
    size?: 'small' | 'medium' | 'large';
    currency?: string;
    locale?: string;
  }>(),
  {
    size: 'medium',
    currency: 'AUD',
    locale: 'en-AU',
  }
);

const formattedAmount = computed(() => {
  return formatCurrency(props.amount, props.locale, props.currency);
});
</script>

<style scoped>
.price-display {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.price-display--small {
  font-size: 0.875rem;
}

.price-display--large {
  font-size: 1.5rem;
  color: var(--q-primary);
}
</style>
