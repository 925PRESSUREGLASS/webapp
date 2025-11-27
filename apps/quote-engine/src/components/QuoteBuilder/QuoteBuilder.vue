<template>
  <div class="quote-builder">
    <div class="row q-col-gutter-md">
      <!-- Main Content -->
      <div class="col-12 col-md-8">
        <!-- Window Cleaning Section -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6">
                <q-icon name="window" class="q-mr-sm" />
                Window Cleaning
              </div>
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
              <q-icon name="window" size="xl" class="q-mb-sm" />
              <div>No window lines added. Click + to add a line.</div>
            </div>
          </q-card-section>

          <q-card-section v-else class="q-pt-none">
            <WindowLineEditor
              v-for="line in quoteStore.windowLines"
              :key="line.id"
              :line="line"
              @update="updateWindowLine"
              @remove="quoteStore.removeWindowLine"
            />
          </q-card-section>
        </q-card>

        <!-- Pressure Cleaning Section -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row items-center justify-between">
              <div class="text-h6">
                <q-icon name="waves" class="q-mr-sm" />
                Pressure Cleaning
              </div>
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
              <q-icon name="waves" size="xl" class="q-mb-sm" />
              <div>No pressure lines added. Click + to add a line.</div>
            </div>
          </q-card-section>

          <q-card-section v-else class="q-pt-none">
            <PressureLineEditor
              v-for="line in quoteStore.pressureLines"
              :key="line.id"
              :line="line"
              @update="updatePressureLine"
              @remove="quoteStore.removePressureLine"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- Quote Summary Sidebar -->
      <div class="col-12 col-md-4">
        <QuoteSummary
          :window-line-count="quoteStore.windowLines.length"
          :pressure-line-count="quoteStore.pressureLines.length"
          :estimated-minutes="quoteStore.estimatedMinutes"
          :breakdown="quoteStore.breakdown"
          :subtotal="quoteStore.subtotal"
          :gst="quoteStore.gst"
          :total="quoteStore.total"
          :minimum-job="quoteStore.pricingConfig.minimumJob"
        />
        
        <!-- Action Buttons -->
        <q-card class="q-mt-md">
          <q-card-section>
            <q-btn
              unelevated
              color="primary"
              class="full-width q-mb-sm"
              icon="save"
              label="Save Quote"
              @click="saveQuote"
            />
            <q-btn
              outline
              color="primary"
              class="full-width q-mb-sm"
              icon="send"
              label="Send to Client"
              @click="sendQuote"
            />
            <q-btn
              flat
              color="negative"
              class="full-width"
              icon="delete_outline"
              label="Clear Quote"
              @click="confirmClear"
            />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useQuoteStore } from '../../stores/quote';
import WindowLineEditor from './WindowLineEditor.vue';
import PressureLineEditor from './PressureLineEditor.vue';
import QuoteSummary from './QuoteSummary.vue';
import type { WindowLine, PressureLine } from '@tictacstick/calculation-engine';

const $q = useQuasar();
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

function updateWindowLine(line: WindowLine) {
  quoteStore.updateWindowLine(line.id, line);
}

function addPressureLine() {
  quoteStore.addPressureLine({
    id: quoteStore.generateLineId(),
    surfaceId: 'concrete',
    areaSqm: 10,
    modifiers: [],
  });
}

function updatePressureLine(line: PressureLine) {
  quoteStore.updatePressureLine(line.id, line);
}

function saveQuote() {
  // TODO: Implement save functionality
  $q.notify({
    type: 'positive',
    message: 'Quote saved successfully',
    position: 'top',
  });
}

function sendQuote() {
  // TODO: Implement send functionality
  $q.notify({
    type: 'info',
    message: 'Send to client coming soon',
    position: 'top',
  });
}

function confirmClear() {
  $q.dialog({
    title: 'Clear Quote',
    message: 'Are you sure you want to clear the current quote? This cannot be undone.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    quoteStore.clearQuote();
    $q.notify({
      type: 'info',
      message: 'Quote cleared',
      position: 'top',
    });
  });
}
</script>

<style scoped>
.quote-builder {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
