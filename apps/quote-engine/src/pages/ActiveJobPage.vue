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

    <!-- Photo Dialog (placeholder) -->
    <q-dialog v-model="showPhotoDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Add Photo</div>
        </q-card-section>
        <q-card-section class="text-center">
          <q-icon name="camera_alt" size="64px" color="grey-5" />
          <p class="text-grey-7 q-mt-md">Camera integration coming soon</p>
          <p class="text-grey-6">
            This feature will allow you to take photos directly from the app.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useJobStore, JOB_STATUSES } from '../stores/jobs';
import type { Job, JobItem, JobPhoto, JobIssueSeverity } from '@tictacstick/calculation-engine';

const props = defineProps<{
  id: string;
}>();

const router = useRouter();
const $q = useQuasar();
const jobStore = useJobStore();

// State
const job = ref<Job | null>(null);
const showNoteDialog = ref(false);
const showPhotoDialog = ref(false);
const newNoteText = ref('');

// Computed
const progress = computed(() => {
  if (!job.value) return 0;
  return jobStore.getJobProgress(job.value.id);
});

const priceDifference = computed(() => {
  if (!job.value) return 0;
  return job.value.pricing.actualTotal - job.value.pricing.estimatedTotal;
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
  $q.dialog({
    title: 'Complete Job',
    message: 'Are you sure you want to mark this job as complete?',
    cancel: true,
    ok: {
      label: 'Complete',
      color: 'primary',
    },
  }).onOk(() => {
    if (!job.value) return;
    const success = jobStore.completeJob(job.value.id);
    if (success) {
      job.value = jobStore.getJob(job.value.id);
      $q.notify({
        type: 'positive',
        message: 'Job completed!',
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'Could not complete job. Check requirements.',
      });
    }
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
      $q.dialog({
        title: 'Adjust Price',
        message: `Current: $${item.actualPrice.toFixed(2)}`,
        prompt: {
          model: item.actualPrice.toString(),
          type: 'number',
        },
        cancel: true,
      }).onOk((newPrice: string) => {
        $q.dialog({
          title: 'Reason for adjustment',
          prompt: {
            model: '',
            type: 'text',
          },
          cancel: true,
        }).onOk((reason: string) => {
          if (!job.value) return;
          jobStore.adjustItemPrice(job.value.id, item.id, parseFloat(newPrice), reason);
          job.value = jobStore.getJob(job.value.id);
        });
      });
    } else if (action === 'skip') {
      jobStore.updateItemStatus(job.value.id, item.id, 'skipped');
      job.value = jobStore.getJob(job.value.id);
    }
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
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
