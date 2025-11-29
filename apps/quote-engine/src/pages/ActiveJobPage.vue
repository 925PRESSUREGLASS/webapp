<template>
  <q-page class="q-pa-md">
    <!-- Loading State -->
    <div v-if="!job" class="text-center q-pa-xl">
      <q-spinner-dots size="50px" color="primary" />
      <p class="text-grey-7 q-mt-md">Loading job...</p>
    </div>

    <!-- Job Content -->
    <template v-else>
      <!-- Header -->
      <div class="row items-center q-mb-lg">
        <q-btn
          flat
          round
          icon="arrow_back"
          @click="$router.push('/jobs')"
        />
        <div class="col q-ml-md">
          <div class="text-h5">{{ job.jobNumber }}</div>
          <div class="text-grey-7">{{ job.client.name }}</div>
        </div>
        <div class="col-auto q-mr-md" v-if="job.status !== 'scheduled'">
          <JobTimer
            :start-time="job.schedule.actualStartTime"
            :end-time="job.schedule.actualEndTime"
            :estimated-minutes="job.schedule.estimatedDuration"
            :status="job.status"
            :show-estimate="true"
          />
        </div>
        <q-badge
          :color="JOB_STATUSES[job.status].color"
          class="q-pa-sm text-body2"
        >
          {{ JOB_STATUSES[job.status].label }}
        </q-badge>
      </div>

      <!-- Action Buttons -->
      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-auto" v-if="job.status === 'scheduled'">
          <q-btn
            color="positive"
            icon="play_arrow"
            label="Start Job"
            @click="handleStartJob"
          />
        </div>
        <div class="col-auto" v-if="job.status === 'in-progress'">
          <q-btn
            color="warning"
            icon="pause"
            label="Pause"
            @click="handlePauseJob"
          />
        </div>
        <div class="col-auto" v-if="job.status === 'paused'">
          <q-btn
            color="positive"
            icon="play_arrow"
            label="Resume"
            @click="handleResumeJob"
          />
        </div>
        <div class="col-auto" v-if="job.status === 'in-progress' || job.status === 'paused'">
          <q-btn
            color="primary"
            icon="check_circle"
            label="Complete"
            @click="handleCompleteJob"
          />
        </div>
        <div class="col-auto">
          <q-btn
            flat
            icon="photo_camera"
            label="Add Photo"
            @click="showPhotoDialog = true"
          />
        </div>
        <div class="col-auto">
          <q-btn
            flat
            icon="note_add"
            label="Add Note"
            @click="showNoteDialog = true"
          />
        </div>
        <div class="col-auto" v-if="job.status === 'completed'">
          <q-btn
            color="purple"
            icon="receipt"
            label="Create Invoice"
            @click="handleCreateInvoice"
          />
        </div>
        <div class="col-auto" v-if="job.status === 'completed' || job.status === 'invoiced'">
          <q-btn
            color="teal"
            icon="picture_as_pdf"
            label="Export PDF"
            @click="showPdfDialog = true"
          />
        </div>
      </div>

      <!-- Progress Bar -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-subtitle1">Progress</div>
            </div>
            <div class="col-auto text-body2">
              {{ progress }}% Complete
            </div>
          </div>
          <q-linear-progress
            :value="progress / 100"
            color="positive"
            size="20px"
            class="q-mt-sm"
            rounded
          />
        </q-card-section>
      </q-card>

      <!-- Work Items Checklist -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Work Items</div>
          <q-list separator>
            <q-item
              v-for="item in job.items"
              :key="item.id"
              clickable
              @click="toggleItem(item)"
            >
              <q-item-section avatar>
                <q-checkbox
                  :model-value="item.status === 'completed'"
                  @update:model-value="toggleItem(item)"
                  color="positive"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label :class="{ 'text-strike text-grey-6': item.status === 'completed' }">
                  {{ item.description }}
                </q-item-label>
                <q-item-label caption v-if="item.notes">
                  {{ item.notes }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-weight-medium">
                  ${{ item.actualPrice.toFixed(2) }}
                </q-item-label>
                <q-badge
                  v-if="item.priceAdjustmentReason"
                  color="warning"
                  outline
                  class="q-mt-xs"
                >
                  Adjusted
                </q-badge>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  size="sm"
                  icon="more_vert"
                  @click.stop="showItemMenu(item)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Client & Schedule Info -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">Client</div>
              <div class="text-body1">{{ job.client.name }}</div>
              <div class="text-grey-7">{{ job.client.address }}</div>
              <div class="text-grey-7" v-if="job.client.phone">
                <q-icon name="phone" /> {{ job.client.phone }}
              </div>
              <div class="text-grey-7" v-if="job.client.email">
                <q-icon name="email" /> {{ job.client.email }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">Schedule</div>
              <div class="text-body1">{{ formatDate(job.schedule.scheduledDate) }}</div>
              <div class="text-grey-7" v-if="job.schedule.scheduledTime">
                {{ job.schedule.scheduledTime }}
              </div>
              <div class="text-grey-7">
                Est. {{ job.schedule.estimatedDuration }} minutes
              </div>
              <div class="text-grey-7" v-if="job.schedule.actualDuration">
                Actual: {{ job.schedule.actualDuration }} minutes
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Pricing Summary -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Pricing</div>
          <div class="row">
            <div class="col">
              <div class="text-grey-7">Estimated</div>
              <div class="text-h5">${{ job.pricing.estimatedTotal.toFixed(2) }}</div>
            </div>
            <div class="col">
              <div class="text-grey-7">Actual</div>
              <div class="text-h5">${{ job.pricing.actualTotal.toFixed(2) }}</div>
            </div>
            <div class="col" v-if="priceDifference !== 0">
              <div class="text-grey-7">Difference</div>
              <div class="text-h5" :class="priceDifference > 0 ? 'text-positive' : 'text-negative'">
                {{ priceDifference > 0 ? '+' : '' }}${{ priceDifference.toFixed(2) }}
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Photos -->
      <q-card v-if="job.photos.length > 0" class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Photos ({{ job.photos.length }})</div>
          <div class="row q-col-gutter-sm">
            <div
              v-for="photo in job.photos"
              :key="photo.id"
              class="col-4 col-md-2"
            >
              <q-img
                :src="photo.uri"
                :ratio="1"
                class="rounded-borders cursor-pointer"
                @click="viewPhoto(photo)"
              >
                <div class="absolute-bottom text-center text-caption bg-dark">
                  {{ photo.type }}
                </div>
              </q-img>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Notes -->
      <q-card v-if="job.notes.length > 0" class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Notes ({{ job.notes.length }})</div>
          <q-list separator>
            <q-item v-for="note in job.notes" :key="note.id">
              <q-item-section>
                <q-item-label>{{ note.text }}</q-item-label>
                <q-item-label caption>
                  {{ formatDateTime(note.createdAt) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  size="sm"
                  icon="delete"
                  color="negative"
                  @click="removeNote(note.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Issues -->
      <q-card v-if="job.issues.length > 0" class="q-mb-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Issues ({{ job.issues.length }})</div>
          <q-list separator>
            <q-item v-for="issue in job.issues" :key="issue.id">
              <q-item-section avatar>
                <q-icon
                  :name="issue.resolved ? 'check_circle' : 'warning'"
                  :color="issue.resolved ? 'positive' : getSeverityColor(issue.severity)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ issue.description }}</q-item-label>
                <q-item-label caption v-if="issue.resolution">
                  Resolution: {{ issue.resolution }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge
                  :color="issue.resolved ? 'positive' : getSeverityColor(issue.severity)"
                >
                  {{ issue.resolved ? 'Resolved' : issue.severity }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </template>

    <!-- Note Dialog -->
    <q-dialog v-model="showNoteDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Note</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="newNoteText"
            type="textarea"
            outlined
            autofocus
            rows="3"
            placeholder="Enter your note..."
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Add"
            @click="addNote"
            :disable="!newNoteText.trim()"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Photo Dialog with PhotoCapture -->
    <q-dialog v-model="showPhotoDialog" full-width>
      <q-card style="max-width: 500px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Job Photos</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <PhotoCapture
            :model-value="jobPhotosForCapture"
            @update:model-value="handlePhotosUpdate"
            @photo-added="handlePhotoAdded"
            @photo-removed="handlePhotoRemoved"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Price Adjust Modal -->
    <PriceAdjustModal
      v-if="selectedItemForPriceAdjust"
      v-model="showPriceAdjustModal"
      :item-id="selectedItemForPriceAdjust.id"
      :item-description="selectedItemForPriceAdjust.description"
      :original-price="selectedItemForPriceAdjust.estimatedPrice"
      :current-price="selectedItemForPriceAdjust.actualPrice"
      @adjust="handlePriceAdjust"
    />

    <!-- Job Completion Wizard -->
    <JobCompletionWizard
      v-model="showCompletionWizard"
      :job="jobForCompletionWizard"
      @complete="handleJobCompletion"
      @cancel="showCompletionWizard = false"
    />

    <!-- PDF Export Dialog -->
    <q-dialog v-model="showPdfDialog" maximized>
      <q-card v-if="job">
        <q-toolbar class="bg-teal text-white">
          <q-btn flat round icon="arrow_back" @click="showPdfDialog = false" />
          <q-toolbar-title>Job Receipt - {{ job.jobNumber }}</q-toolbar-title>
          <q-btn-dropdown flat icon="download" label="Export">
            <q-list>
              <q-item clickable v-close-popup @click="handleDownloadPdf(false)">
                <q-item-section>
                  <q-item-label>Download PDF</q-item-label>
                  <q-item-label caption>Without photos</q-item-label>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="handleDownloadPdf(true)">
                <q-item-section>
                  <q-item-label>Download PDF (with photos)</q-item-label>
                  <q-item-label caption>Includes all job photos</q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-close-popup @click="handleSharePdf">
                <q-item-section>
                  <q-item-label>Share PDF</q-item-label>
                  <q-item-label caption>Send via email or messages</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <q-btn flat icon="print" label="Print" @click="handlePrint" />
        </q-toolbar>
        <q-card-section class="pdf-preview-container">
          <JobReceiptPrint
            ref="receiptPrintRef"
            :job="job"
            :settings="invoiceSettings"
            :include-photos="pdfIncludePhotos"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useJobStore, JOB_STATUSES } from '../stores/jobs';
import { useInvoiceStore } from '../stores/invoices';
import { useEmail } from '../composables/useEmail';
import type { Job, JobItem, JobPhoto, JobIssueSeverity } from '@tictacstick/calculation-engine';
import JobTimer from '../components/Jobs/JobTimer.vue';
import PriceAdjustModal from '../components/Jobs/PriceAdjustModal.vue';
import PhotoCapture from '../components/Jobs/PhotoCapture.vue';
import JobCompletionWizard from '../components/Jobs/JobCompletionWizard.vue';
import JobReceiptPrint from '../components/Jobs/JobReceiptPrint.vue';
import {
  downloadPdfFromElement,
  sharePdf,
  generateJobReceiptFilename,
  generateJobReceiptPdfBase64,
} from '../utils/pdf-generator';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const $q = useQuasar();
const jobStore = useJobStore();
const invoiceStore = useInvoiceStore();
const { sendJobSummary, isSending: isSendingEmail } = useEmail();

// State
const job = ref<Job | null>(null);
const showNoteDialog = ref(false);
const showPhotoDialog = ref(false);
const showPriceAdjustModal = ref(false);
const showCompletionWizard = ref(false);
const selectedItemForPriceAdjust = ref<JobItem | null>(null);
const newNoteText = ref('');

// PDF Export State
const showPdfDialog = ref(false);
const pdfIncludePhotos = ref(true);
const receiptPrintRef = ref<InstanceType<typeof JobReceiptPrint> | null>(null);

// Get invoice settings for PDF
const invoiceSettings = computed(() => {
  invoiceStore.initialize();
  return invoiceStore.getSettings();
});

// Computed
const progress = computed(() => {
  if (!job.value) return 0;
  return jobStore.getJobProgress(job.value.id);
});

const priceDifference = computed(() => {
  if (!job.value) return 0;
  return job.value.pricing.actualTotal - job.value.pricing.estimatedTotal;
});

// Convert job photos to PhotoCapture format
const jobPhotosForCapture = computed((): JobPhoto[] => {
  if (!job.value?.photos) return [];
  return job.value.photos;
});

// Convert job for completion wizard (uses Job type directly now)
const jobForCompletionWizard = computed((): Job | null => {
  return job.value;
});

// Load job
function loadJob() {
  jobStore.initialize();
  job.value = jobStore.getJob(props.id);
  
  if (!job.value) {
    $q.notify({
      type: 'negative',
      message: 'Job not found',
    });
    router.push('/jobs');
  }
}

onMounted(loadJob);

watch(() => props.id, loadJob);

// Methods
function handleStartJob() {
  if (!job.value) return;
  jobStore.startJob(job.value.id);
  job.value = jobStore.getJob(job.value.id);
  $q.notify({
    type: 'positive',
    message: 'Job started',
  });
}

function handlePauseJob() {
  if (!job.value) return;
  $q.dialog({
    title: 'Pause Job',
    message: 'Why are you pausing this job? (optional)',
    prompt: {
      model: '',
      type: 'textarea',
    },
    cancel: true,
  }).onOk((reason: string) => {
    if (!job.value) return;
    jobStore.pauseJob(job.value.id, reason || undefined);
    job.value = jobStore.getJob(job.value.id);
    $q.notify({
      type: 'warning',
      message: 'Job paused',
    });
  });
}

function handleResumeJob() {
  if (!job.value) return;
  jobStore.resumeJob(job.value.id);
  job.value = jobStore.getJob(job.value.id);
  $q.notify({
    type: 'positive',
    message: 'Job resumed',
  });
}

function handleCompleteJob() {
  if (!job.value) return;
  // Open the completion wizard instead of simple dialog
  showCompletionWizard.value = true;
}

interface JobCompletionData {
  signature: string;
  customerName: string;
  completionNotes: string;
  notifyCustomer: boolean;
  completedAt: string;
}

function handleJobCompletion(data: JobCompletionData) {
  if (!job.value) return;
  
  // Add signature as a photo (use 'after' type since there's no 'signature' type)
  if (data.signature) {
    jobStore.addPhoto(job.value.id, data.signature, 'after', {
      caption: `Customer Signature: ${data.customerName}`,
    });
  }
  
  // Add completion notes
  if (data.completionNotes) {
    jobStore.addNote(job.value.id, `Completion: ${data.completionNotes}`);
  }
  
  // Complete the job
  const success = jobStore.completeJob(job.value.id);
  if (success) {
    job.value = jobStore.getJob(job.value.id);
    $q.notify({
      type: 'positive',
      message: 'Job completed successfully!',
      icon: 'check_circle',
    });
    
    if (data.notifyCustomer && job.value?.client.email) {
      // Send completion notification email to customer
      sendCustomerNotification(job.value);
    }
  } else {
    $q.notify({
      type: 'negative',
      message: 'Could not complete job. Check requirements.',
    });
  }
}

/**
 * Send job completion notification email to customer
 */
async function sendCustomerNotification(completedJob: Job) {
  if (!completedJob.client.email) {
    console.log('[Email] No customer email available');
    return;
  }
  
  try {
    // Generate PDF of the job receipt
    const pdfBase64 = await generateJobReceiptPdfBase64(completedJob);
    
    // Send the email
    const result = await sendJobSummary({
      to: completedJob.client.email,
      subject: `Job Complete - ${completedJob.jobNumber}`,
      body: `Dear ${completedJob.client.name},\n\nYour job (${completedJob.jobNumber}) has been completed.\n\nPlease find attached a summary of the work completed.\n\nTotal: $${completedJob.pricing.actualTotal.toFixed(2)}\n\nThank you for choosing our services!\n\nBest regards,\n925 Pressure Glass`,
      jobNumber: completedJob.jobNumber,
      pdfBase64: pdfBase64,
    });
    
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `Notification sent to ${completedJob.client.email}`,
        icon: 'email',
      });
    } else {
      console.error('[Email] Failed to send notification:', result.error);
      $q.notify({
        type: 'warning',
        message: 'Job completed but notification could not be sent',
        caption: result.error,
        icon: 'email',
      });
    }
  } catch (error) {
    console.error('[Email] Error sending notification:', error);
    $q.notify({
      type: 'warning',
      message: 'Job completed but notification failed',
      icon: 'email',
    });
  }
}

function handleCreateInvoice() {
  if (!job.value || job.value.status !== 'completed') return;
  
  $q.dialog({
    title: 'Create Invoice',
    message: `Create an invoice for ${job.value.client.name} - $${job.value.pricing.actualTotal.toFixed(2)}?`,
    cancel: true,
    ok: {
      label: 'Create Invoice',
      color: 'purple',
    },
  }).onOk(() => {
    if (!job.value) return;
    
    // Initialize invoice store if needed
    invoiceStore.initialize();
    
    // Create invoice from completed job
    const invoice = invoiceStore.convertJobToInvoice(job.value);
    
    // Mark job as invoiced
    jobStore.markJobInvoiced(job.value.id, invoice.id);
    job.value = jobStore.getJob(job.value.id);
    
    $q.notify({
      type: 'positive',
      message: `Invoice ${invoice.invoiceNumber} created`,
      icon: 'receipt',
    });
    
    // Navigate to invoice
    router.push(`/invoices/${invoice.id}`);
  });
}

function toggleItem(item: JobItem) {
  if (!job.value) return;
  const newStatus = item.status === 'completed' ? 'pending' : 'completed';
  jobStore.updateItemStatus(job.value.id, item.id, newStatus);
  job.value = jobStore.getJob(job.value.id);
}

function showItemMenu(item: JobItem) {
  $q.dialog({
    title: item.description,
    message: 'Choose an action',
    options: {
      type: 'radio',
      model: '',
      items: [
        { label: 'Add Note', value: 'note' },
        { label: 'Adjust Price', value: 'price' },
        { label: 'Mark as Skipped', value: 'skip' },
      ],
    },
    cancel: true,
  }).onOk((action: string) => {
    if (!job.value) return;
    
    if (action === 'note') {
      $q.dialog({
        title: 'Add Note',
        prompt: {
          model: item.notes || '',
          type: 'textarea',
        },
        cancel: true,
      }).onOk((note: string) => {
        if (!job.value) return;
        jobStore.addItemNote(job.value.id, item.id, note);
        job.value = jobStore.getJob(job.value.id);
      });
    } else if (action === 'price') {
      // Use the new PriceAdjustModal
      selectedItemForPriceAdjust.value = item;
      showPriceAdjustModal.value = true;
    } else if (action === 'skip') {
      jobStore.updateItemStatus(job.value.id, item.id, 'skipped');
      job.value = jobStore.getJob(job.value.id);
    }
  });
}

function handlePriceAdjust(payload: { itemId: string; newPrice: number; reason: string }) {
  if (!job.value) return;
  jobStore.adjustItemPrice(job.value.id, payload.itemId, payload.newPrice, payload.reason);
  job.value = jobStore.getJob(job.value.id);
  selectedItemForPriceAdjust.value = null;
  $q.notify({
    type: 'positive',
    message: 'Price adjusted',
  });
}

function addNote() {
  if (!job.value || !newNoteText.value.trim()) return;
  jobStore.addNote(job.value.id, newNoteText.value.trim());
  job.value = jobStore.getJob(job.value.id);
  newNoteText.value = '';
  showNoteDialog.value = false;
}

function removeNote(noteId: string) {
  if (!job.value) return;
  $q.dialog({
    title: 'Delete Note',
    message: 'Are you sure you want to delete this note?',
    cancel: true,
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  }).onOk(() => {
    if (!job.value) return;
    jobStore.removeNote(job.value.id, noteId);
    job.value = jobStore.getJob(job.value.id);
  });
}

function viewPhoto(photo: JobPhoto) {
  $q.dialog({
    title: photo.caption || photo.type,
    message: `<img src="${photo.uri}" style="width: 100%; max-height: 70vh; object-fit: contain;" />`,
    html: true,
    ok: 'Close',
  });
}

function handlePhotosUpdate(_photos: JobPhoto[]) {
  // Photos are updated individually via add/remove handlers
}

function handlePhotoAdded(photo: JobPhoto) {
  if (!job.value) return;
  // Photo is already added by PhotoCapture, just add to store
  jobStore.addPhoto(job.value.id, photo.uri, photo.type, {
    caption: photo.caption,
  });
  job.value = jobStore.getJob(job.value.id);
}

function handlePhotoRemoved(photo: JobPhoto) {
  if (!job.value) return;
  jobStore.removePhoto(job.value.id, photo.id);
  job.value = jobStore.getJob(job.value.id);
}

function getSeverityColor(severity: JobIssueSeverity): string {
  switch (severity) {
    case 'high': return 'negative';
    case 'medium': return 'warning';
    case 'low': return 'grey';
    default: return 'grey';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// PDF Export Handlers
async function handleDownloadPdf(includePhotos: boolean) {
  if (!job.value || !receiptPrintRef.value?.receiptRef) {
    $q.notify({
      type: 'negative',
      message: 'Unable to generate PDF',
    });
    return;
  }

  pdfIncludePhotos.value = includePhotos;
  
  // Wait for the DOM to update with the new photo setting
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    $q.loading.show({ message: 'Generating PDF...' });
    
    const filename = generateJobReceiptFilename(job.value);
    await downloadPdfFromElement(receiptPrintRef.value.receiptRef, {
      filename,
      includePhotos,
    });

    $q.notify({
      type: 'positive',
      message: 'PDF downloaded successfully',
      icon: 'picture_as_pdf',
    });
  } catch (error) {
    console.error('[PDF] Download failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to generate PDF',
    });
  } finally {
    $q.loading.hide();
  }
}

async function handleSharePdf() {
  if (!job.value || !receiptPrintRef.value?.receiptRef) {
    $q.notify({
      type: 'negative',
      message: 'Unable to generate PDF',
    });
    return;
  }

  try {
    $q.loading.show({ message: 'Preparing PDF...' });
    
    const filename = generateJobReceiptFilename(job.value);
    const shared = await sharePdf(receiptPrintRef.value.receiptRef, {
      filename,
      includePhotos: true,
    });

    if (shared) {
      $q.notify({
        type: 'positive',
        message: 'PDF shared successfully',
        icon: 'share',
      });
    }
  } catch (error) {
    console.error('[PDF] Share failed:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to share PDF',
    });
  } finally {
    $q.loading.hide();
  }
}

function handlePrint() {
  window.print();
}
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}

.pdf-preview-container {
  max-width: 850px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
  overflow-y: auto;
  max-height: calc(100vh - 50px);
}

@media print {
  .pdf-preview-container {
    background: white;
    max-height: none;
    padding: 0;
  }
}
</style>
