<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    maximized
  >
    <q-card class="column no-wrap full-height">
      <!-- Header -->
      <q-card-section class="bg-primary text-white q-py-sm">
        <div class="row items-center">
          <q-btn
            flat
            round
            dense
            icon="close"
            color="white"
            @click="handleCancel"
          />
          <div class="text-h6 q-ml-sm">Complete Job</div>
          <q-space />
          <div class="text-caption">Step {{ currentStep }} of {{ totalSteps }}</div>
        </div>
      </q-card-section>

      <!-- Stepper -->
      <q-stepper
        v-model="currentStep"
        ref="stepperRef"
        color="primary"
        animated
        flat
        class="col q-pa-none"
        header-class="q-pa-sm"
      >
        <!-- Step 1: Review Checklist -->
        <q-step
          :name="1"
          title="Review"
          icon="checklist"
          :done="currentStep > 1"
        >
          <div class="q-pa-md">
            <div class="text-subtitle1 q-mb-md">Checklist Review</div>
            
            <q-list v-if="job" separator>
              <q-item 
                v-for="item in job.items" 
                :key="item.id"
                :class="{ 'bg-green-1': item.status === 'completed' }"
              >
                <q-item-section avatar>
                  <q-icon 
                    :name="item.status === 'completed' ? 'check_circle' : 'radio_button_unchecked'"
                    :color="item.status === 'completed' ? 'positive' : 'grey'"
                    size="24px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.description }}</q-item-label>
                  <q-item-label caption v-if="item.notes">
                    {{ item.notes }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  {{ formatCurrency(item.actualPrice) }}
                </q-item-section>
              </q-item>
            </q-list>

            <q-banner 
              v-if="incompleteItems.length > 0" 
              class="bg-warning text-dark q-mt-md"
              rounded
            >
              <template #avatar>
                <q-icon name="warning" color="dark" />
              </template>
              {{ incompleteItems.length }} item(s) not marked complete
            </q-banner>

            <div class="row q-mt-lg q-col-gutter-md">
              <div class="col-6">
                <q-card flat bordered class="text-center q-pa-md">
                  <div class="text-caption text-grey">Quoted</div>
                  <div class="text-h6">{{ formatCurrency(job?.pricing?.estimatedTotal || 0) }}</div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="text-center q-pa-md">
                  <div class="text-caption text-grey">Final</div>
                  <div class="text-h6" :class="priceDiff !== 0 ? 'text-primary' : ''">
                    {{ formatCurrency(job?.pricing?.actualTotal || 0) }}
                  </div>
                </q-card>
              </div>
            </div>
          </div>
        </q-step>

        <!-- Step 2: Photos -->
        <q-step
          :name="2"
          title="Photos"
          icon="photo_camera"
          :done="currentStep > 2"
        >
          <div class="q-pa-md">
            <div class="text-subtitle1 q-mb-md">Job Photos</div>
            
            <div v-if="job?.photos && job.photos.length > 0" class="photo-grid q-mb-md">
              <div 
                v-for="photo in job.photos" 
                :key="photo.id"
                class="photo-item"
              >
                <q-img 
                  :src="photo.uri" 
                  :ratio="1"
                  class="rounded-borders"
                />
                <q-badge 
                  :color="getPhotoTypeColor(photo.type)"
                  class="absolute-bottom-left q-ma-xs"
                >
                  {{ photo.type }}
                </q-badge>
              </div>
            </div>

            <q-banner 
              v-else 
              class="bg-grey-2 text-dark"
              rounded
            >
              <template #avatar>
                <q-icon name="photo_camera" color="grey" />
              </template>
              No photos have been taken for this job
            </q-banner>

            <div class="row q-mt-md q-col-gutter-sm">
              <div class="col-6">
                <q-card flat bordered class="text-center q-pa-sm">
                  <div class="text-caption text-grey">Before</div>
                  <div class="text-h6">{{ photoCountByType('before') }}</div>
                </q-card>
              </div>
              <div class="col-6">
                <q-card flat bordered class="text-center q-pa-sm">
                  <div class="text-caption text-grey">After</div>
                  <div class="text-h6">{{ photoCountByType('after') }}</div>
                </q-card>
              </div>
            </div>
          </div>
        </q-step>

        <!-- Step 3: Signature -->
        <q-step
          :name="3"
          title="Signature"
          icon="draw"
          :done="currentStep > 3"
        >
          <div class="q-pa-md">
            <div class="text-subtitle1 q-mb-md">Customer Signature</div>
            
            <SignatureCanvas
              v-model="customerSignature"
              label="Customer Signature"
              :show-save-button="false"
              @signed="handleSignatureSigned"
            />

            <q-input
              v-model="customerName"
              label="Customer Name (Print)"
              class="q-mt-md"
              outlined
              dense
            />

            <q-banner 
              v-if="!customerSignature" 
              class="bg-info text-white q-mt-md"
              rounded
            >
              <template #avatar>
                <q-icon name="info" color="white" />
              </template>
              A signature is required to complete the job
            </q-banner>
          </div>
        </q-step>

        <!-- Step 4: Completion Notes -->
        <q-step
          :name="4"
          title="Notes"
          icon="notes"
          :done="currentStep > 4"
        >
          <div class="q-pa-md">
            <div class="text-subtitle1 q-mb-md">Completion Notes</div>
            
            <q-input
              v-model="completionNotes"
              type="textarea"
              label="Notes about the completed job"
              outlined
              :rows="4"
              placeholder="Enter any notes about the job completion..."
            />

            <div class="text-subtitle2 q-mt-lg q-mb-sm">Quick Notes</div>
            <div class="row q-col-gutter-sm">
              <div class="col-auto" v-for="note in quickNotes" :key="note">
                <q-chip
                  clickable
                  color="primary"
                  text-color="white"
                  @click="addQuickNote(note)"
                >
                  {{ note }}
                </q-chip>
              </div>
            </div>

            <q-toggle
              v-model="notifyCustomer"
              label="Send completion notification to customer"
              class="q-mt-lg"
            />
          </div>
        </q-step>

        <!-- Step 5: Summary -->
        <q-step
          :name="5"
          title="Summary"
          icon="summarize"
        >
          <div class="q-pa-md">
            <div class="text-subtitle1 q-mb-md">Job Summary</div>
            
            <q-card flat bordered class="q-mb-md">
              <q-card-section>
                <div class="row q-mb-sm">
                  <div class="col text-grey">Customer</div>
                  <div class="col-auto text-right">{{ job?.client?.name || 'N/A' }}</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col text-grey">Items Completed</div>
                  <div class="col-auto text-right">{{ completedItems.length }} / {{ job?.items.length || 0 }}</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col text-grey">Photos</div>
                  <div class="col-auto text-right">{{ job?.photos?.length || 0 }}</div>
                </div>
                <div class="row q-mb-sm">
                  <div class="col text-grey">Time Spent</div>
                  <div class="col-auto text-right">{{ formattedTimeSpent }}</div>
                </div>
                <q-separator class="q-my-sm" />
                <div class="row text-weight-bold">
                  <div class="col">Total</div>
                  <div class="col-auto text-right text-primary text-h6">
                    {{ formatCurrency(job?.pricing?.actualTotal || 0) }}
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Signature preview -->
            <div v-if="customerSignature" class="q-mb-md">
              <div class="text-caption text-grey q-mb-xs">Customer Signature</div>
              <q-img 
                :src="customerSignature" 
                class="signature-preview rounded-borders"
                fit="contain"
              />
              <div class="text-caption text-center">{{ customerName }}</div>
            </div>

            <q-banner 
              class="bg-positive text-white"
              rounded
            >
              <template #avatar>
                <q-icon name="check_circle" color="white" />
              </template>
              Ready to complete this job
            </q-banner>
          </div>
        </q-step>

        <!-- Navigation -->
        <template #navigation>
          <q-stepper-navigation class="row q-pa-md q-col-gutter-sm">
            <q-btn
              v-if="currentStep > 1"
              flat
              color="primary"
              label="Back"
              @click="previousStep"
              class="col"
            />
            <q-btn
              v-if="currentStep < totalSteps"
              unelevated
              color="primary"
              label="Next"
              @click="nextStep"
              class="col"
              :disable="!canProceed"
            />
            <q-btn
              v-else
              unelevated
              color="positive"
              label="Complete Job"
              icon="check"
              @click="completeJob"
              class="col"
              :loading="completing"
              :disable="!canComplete"
            />
          </q-stepper-navigation>
        </template>
      </q-stepper>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { QStepper } from 'quasar';
import type { Job, JobPhotoType } from '@tictacstick/calculation-engine';
import SignatureCanvas from './SignatureCanvas.vue';

const props = defineProps<{
  modelValue: boolean;
  job: Job | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'complete', data: JobCompletionData): void;
  (e: 'cancel'): void;
}>();

interface JobCompletionData {
  signature: string;
  customerName: string;
  completionNotes: string;
  notifyCustomer: boolean;
  completedAt: string;
}

const stepperRef = ref<QStepper | null>(null);
const currentStep = ref(1);
const totalSteps = 5;

const customerSignature = ref('');
const customerName = ref('');
const completionNotes = ref('');
const notifyCustomer = ref(true);
const completing = ref(false);

const quickNotes = [
  'Customer satisfied',
  'All work completed as quoted',
  'Minor adjustments made',
  'Follow-up recommended',
  'Additional work identified',
];

// Reset state when dialog opens
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    currentStep.value = 1;
    customerSignature.value = '';
    customerName.value = props.job?.client?.name || '';
    completionNotes.value = '';
    notifyCustomer.value = true;
    completing.value = false;
  }
});

// Computed
const completedItems = computed(() => {
  if (!props.job) return [];
  return props.job.items.filter(item => item.status === 'completed');
});

const incompleteItems = computed(() => {
  if (!props.job) return [];
  return props.job.items.filter(item => item.status !== 'completed' && item.status !== 'skipped');
});

const priceDiff = computed(() => {
  if (!props.job?.pricing) return 0;
  return (props.job.pricing.actualTotal || 0) - (props.job.pricing.estimatedTotal || 0);
});

const formattedTimeSpent = computed(() => {
  if (!props.job?.schedule?.actualStartTime) return 'N/A';
  
  const start = new Date(props.job.schedule.actualStartTime).getTime();
  const end = props.job.schedule.actualEndTime 
    ? new Date(props.job.schedule.actualEndTime).getTime() 
    : Date.now();
  
  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
});

const canProceed = computed(() => {
  if (currentStep.value === 3) {
    return !!customerSignature.value;
  }
  return true;
});

const canComplete = computed(() => {
  return !!customerSignature.value;
});

// Methods
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function getPhotoTypeColor(type: JobPhotoType): string {
  const colors: Record<JobPhotoType, string> = {
    before: 'blue',
    during: 'purple',
    after: 'green',
    issue: 'orange',
  };
  return colors[type] || 'grey';
}

function photoCountByType(type: JobPhotoType): number {
  if (!props.job?.photos) return 0;
  return props.job.photos.filter(p => p.type === type).length;
}

function addQuickNote(note: string) {
  if (completionNotes.value) {
    completionNotes.value += '\n' + note;
  } else {
    completionNotes.value = note;
  }
}

function handleSignatureSigned(_dataUrl: string) {
  // Signature already bound via v-model
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
}

function nextStep() {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
}

function handleCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

async function completeJob() {
  if (!canComplete.value) return;
  
  completing.value = true;
  
  try {
    const completionData: JobCompletionData = {
      signature: customerSignature.value,
      customerName: customerName.value,
      completionNotes: completionNotes.value,
      notifyCustomer: notifyCustomer.value,
      completedAt: new Date().toISOString(),
    };
    
    emit('complete', completionData);
    emit('update:modelValue', false);
  } finally {
    completing.value = false;
  }
}
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.photo-item {
  position: relative;
}

.signature-preview {
  height: 100px;
  background: #f5f5f5;
  border: 1px solid #ddd;
}
</style>
