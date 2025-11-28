<template>
  <div class="quote-builder">
    <!-- Undo/Redo Toolbar -->
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn
        flat
        round
        dense
        icon="undo"
        :disable="!quoteStore.canUndo"
        @click="quoteStore.undo"
      >
        <q-tooltip>Undo (Ctrl+Z)</q-tooltip>
      </q-btn>
      <q-btn
        flat
        round
        dense
        icon="redo"
        :disable="!quoteStore.canRedo"
        @click="quoteStore.redo"
      >
        <q-tooltip>Redo (Ctrl+Shift+Z)</q-tooltip>
      </q-btn>
      <q-space />
      <!-- Status badges with autosave indicator -->
      <q-badge v-if="quoteStore.isDirty && lastAutosaveTime" color="blue-grey" class="q-mr-xs">
        <q-icon name="cloud_done" size="xs" class="q-mr-xs" />
        Autosaved
      </q-badge>
      <q-badge v-if="quoteStore.isDirty" color="orange" label="Unsaved changes">
        <q-tooltip>Press Ctrl+S to save</q-tooltip>
      </q-badge>
      <q-badge v-else-if="quoteStore.currentQuoteId" color="green" label="Saved" />
    </div>

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

        <!-- Validation Warnings -->
        <q-card v-if="quoteStore.validation.warnings.length > 0" class="q-mt-md bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-orange-9 q-mb-sm">
              <q-icon name="warning" class="q-mr-xs" />
              Suggestions
            </div>
            <ul class="q-ma-none q-pl-md text-body2">
              <li v-for="warning in quoteStore.validation.warnings" :key="warning">
                {{ warning }}
              </li>
            </ul>
          </q-card-section>
        </q-card>
        
        <!-- Action Buttons -->
        <q-card class="q-mt-md">
          <q-card-section>
            <q-btn
              unelevated
              color="primary"
              class="full-width q-mb-sm"
              icon="save"
              :label="quoteStore.currentQuoteId ? 'Update Quote' : 'Save Quote'"
              :loading="isSaving"
              @click="saveQuote"
            />
            <q-btn
              outline
              color="primary"
              class="full-width q-mb-sm"
              icon="send"
              label="Send to Client"
              :disable="!quoteStore.validation.isValid"
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
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useQuoteStore } from '../../stores/quote';
import WindowLineEditor from './WindowLineEditor.vue';
import PressureLineEditor from './PressureLineEditor.vue';
import QuoteSummary from './QuoteSummary.vue';
import type { WindowLine, PressureLine } from '@tictacstick/calculation-engine';

const $q = useQuasar();
const router = useRouter();
const quoteStore = useQuoteStore();

const isSaving = ref(false);
const lastAutosaveTime = ref<Date | null>(null);

// Debounced autosave
let autosaveTimeout: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DELAY_MS = 2000; // 2 seconds after last change

function debouncedAutosave() {
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
  autosaveTimeout = setTimeout(() => {
    if (quoteStore.isDirty) {
      quoteStore.autosave();
      lastAutosaveTime.value = new Date();
    }
  }, AUTOSAVE_DELAY_MS);
}

// Watch for changes and trigger autosave
watch(
  [
    () => quoteStore.windowLines,
    () => quoteStore.pressureLines,
    () => quoteStore.clientName,
    () => quoteStore.clientLocation,
  ],
  () => {
    if (quoteStore.isDirty) {
      debouncedAutosave();
    }
  },
  { deep: true }
);

// Keyboard shortcuts
function handleKeydown(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
    if (event.shiftKey) {
      event.preventDefault();
      quoteStore.redo();
    } else {
      event.preventDefault();
      quoteStore.undo();
    }
  }
  
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault();
    saveQuote();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  // Clean up autosave timeout
  if (autosaveTimeout) {
    clearTimeout(autosaveTimeout);
  }
});

function addWindowLine() {
  quoteStore.addWindowLine({
    id: quoteStore.generateLineId(),
    windowTypeId: 'std1', // Standard 1x1 (small) - default window type
    panes: 1,
    inside: true,
    outside: true,
    highReach: false,
    insideHighReachCount: 0,  // Number of inside panes with high reach
    outsideHighReachCount: 0, // Number of outside panes with high reach
    modifiers: [],
    addons: [],
  });
}

function updateWindowLine(line: WindowLine) {
  quoteStore.updateWindowLine(line.id, line);
}

function addPressureLine() {
  quoteStore.addPressureLine({
    id: quoteStore.generateLineId(),
    surfaceId: 'driveway', // Concrete Driveway - default pressure surface
    areaSqm: 10,
    soilLevel: 'medium', // Default soil level
    access: 'easy', // Default access level
    modifiers: [],
  });
}

function updatePressureLine(line: PressureLine) {
  quoteStore.updatePressureLine(line.id, line);
}

async function saveQuote() {
  isSaving.value = true;
  try {
    const { success, id } = await quoteStore.saveQuote();
    if (success) {
      $q.notify({
        type: 'positive',
        message: quoteStore.currentQuoteId ? 'Quote updated' : 'Quote saved',
        position: 'top',
      });
      
      // Update URL with quote ID
      if (id) {
        router.replace({ path: '/quote', query: { id } });
      }
    } else {
      $q.notify({
        type: 'negative',
        message: 'Failed to save quote',
        position: 'top',
      });
    }
  } finally {
    isSaving.value = false;
  }
}

function sendQuote() {
  if (!quoteStore.validation.isValid) {
    $q.notify({
      type: 'warning',
      message: quoteStore.validation.errors.join(', '),
      position: 'top',
    });
    return;
  }
  
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
    router.replace({ path: '/quote' });
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
