<template>
  <q-card flat bordered class="q-mb-sm line-item-card">
    <q-card-section class="q-pa-sm">
      <div class="row items-center q-gutter-sm">
        <!-- Line Type Icon -->
        <q-icon
          :name="type === 'window' ? 'window' : 'water_drop'"
          :color="type === 'window' ? 'primary' : 'secondary'"
          size="sm"
        />

        <!-- Main Content -->
        <div class="col">
          <div class="row items-center q-gutter-xs">
            <!-- Window Line Details -->
            <template v-if="type === 'window' && isWindowLine(line)">
              <q-input
                v-model.number="line.panes"
                type="number"
                label="Panes"
                outlined
                dense
                class="col-2"
                min="1"
              />
              <q-checkbox
                v-model="line.inside"
                label="Inside"
                dense
              />
              <q-checkbox
                v-model="line.outside"
                label="Outside"
                dense
              />
              <q-checkbox
                v-model="line.highReach"
                label="High Reach"
                dense
              />
            </template>

            <!-- Pressure Line Details -->
            <template v-else-if="type === 'pressure' && isPressureLine(line)">
              <q-input
                v-model.number="line.areaSqm"
                type="number"
                label="Area (sqm)"
                outlined
                dense
                class="col-3"
                min="1"
              />
              <q-select
                v-model="line.soilLevel"
                :options="soilOptions"
                label="Condition"
                outlined
                dense
                emit-value
                map-options
                class="col-3"
              />
            </template>
          </div>
        </div>

        <!-- Remove Button -->
        <q-btn
          flat
          round
          dense
          color="negative"
          icon="close"
          size="sm"
          @click="$emit('remove')"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { WindowLine, PressureLine } from '@tictacstick/calculation-engine';

defineProps<{
  line: WindowLine | PressureLine;
  type: 'window' | 'pressure';
}>();

defineEmits<{
  remove: [];
}>();

const soilOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Medium', value: 'medium' },
  { label: 'Heavy', value: 'heavy' },
];

// Type guards
function isWindowLine(line: WindowLine | PressureLine): line is WindowLine {
  return 'panes' in line;
}

function isPressureLine(line: WindowLine | PressureLine): line is PressureLine {
  return 'areaSqm' in line;
}
</script>

<style scoped>
.line-item-card {
  background: rgba(0, 0, 0, 0.02);
}

.body--dark .line-item-card {
  background: rgba(255, 255, 255, 0.02);
}
</style>
