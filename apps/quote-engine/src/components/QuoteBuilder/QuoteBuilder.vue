<template>
  <div class="quote-builder">
    <!-- Window Cleaning Section -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6">Window Cleaning</div>
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="add"
            @click="addWindowLine"
          />
        </div>
      </q-card-section>

      <q-card-section v-if="quoteStore.windowLines.length === 0">
        <div class="text-grey text-center q-py-md">
          No window lines added. Click + to add a line.
        </div>
      </q-card-section>

      <q-card-section v-else class="q-pt-none">
        <LineItemCard
          v-for="line in quoteStore.windowLines"
          :key="line.id"
          :line="line"
          type="window"
          @remove="quoteStore.removeWindowLine(line.id)"
        />
      </q-card-section>
    </q-card>

    <!-- Pressure Cleaning Section -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between">
          <div class="text-h6">Pressure Cleaning</div>
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="add"
            @click="addPressureLine"
          />
        </div>
      </q-card-section>

      <q-card-section v-if="quoteStore.pressureLines.length === 0">
        <div class="text-grey text-center q-py-md">
          No pressure lines added. Click + to add a line.
        </div>
      </q-card-section>

      <q-card-section v-else class="q-pt-none">
        <LineItemCard
          v-for="line in quoteStore.pressureLines"
          :key="line.id"
          :line="line"
          type="pressure"
          @remove="quoteStore.removePressureLine(line.id)"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { useQuoteStore } from '../../stores/quote';
import LineItemCard from './LineItemCard.vue';

const quoteStore = useQuoteStore();

function addWindowLine() {
  quoteStore.addWindowLine({
    id: quoteStore.generateLineId(),
    windowTypeId: 'standard',
    panes: 1,
    inside: true,
    outside: true,
    highReach: false,
    modifiers: [],
  });
}

function addPressureLine() {
  quoteStore.addPressureLine({
    id: quoteStore.generateLineId(),
    surfaceId: 'concrete',
    areaSqm: 10,
    modifiers: [],
  });
}
</script>
