<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <div class="col">
        <h4 class="q-my-none">Jobs</h4>
        <p class="text-grey-7 q-mb-none">Track and manage your work</p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Schedule Job"
          @click="showScheduleDialog = true"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6 col-md-3">
        <q-card class="bg-info text-white">
          <q-card-section>
            <div class="text-h6">{{ stats.scheduledJobs }}</div>
            <div class="text-caption">Scheduled</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="bg-warning text-white">
          <q-card-section>
            <div class="text-h6">{{ stats.inProgressJobs }}</div>
            <div class="text-caption">In Progress</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="bg-positive text-white">
          <q-card-section>
            <div class="text-h6">{{ stats.completedJobs }}</div>
            <div class="text-caption">Completed</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6 col-md-3">
        <q-card class="bg-purple text-white">
          <q-card-section>
            <div class="text-h6">${{ stats.totalRevenue.toFixed(0) }}</div>
            <div class="text-caption">Revenue (30d)</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              dense
              outlined
              placeholder="Search jobs..."
              clearable
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="statusFilter"
              :options="statusOptions"
              dense
              outlined
              emit-value
              map-options
              label="Status"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="dateFilter"
              dense
              outlined
              type="date"
              label="Date"
              clearable
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Jobs List -->
    <q-card v-if="filteredJobs.length > 0">
      <q-list separator>
        <q-item
          v-for="job in filteredJobs"
          :key="job.id"
          clickable
          @click="openJob(job.id)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="JOB_STATUSES[job.status].color"
              text-color="white"
              :icon="JOB_STATUSES[job.status].icon"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ job.client.name }}</q-item-label>
            <q-item-label caption>
              {{ job.jobNumber }} • {{ job.client.address }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label caption>
              {{ formatDate(job.schedule.scheduledDate) }}
            </q-item-label>
            <q-badge :color="JOB_STATUSES[job.status].color">
              {{ JOB_STATUSES[job.status].label }}
            </q-badge>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-weight-bold">
              ${{ job.pricing.actualTotal.toFixed(2) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty State -->
    <q-card v-else class="text-center q-pa-lg">
      <q-icon name="work_off" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No jobs found</div>
      <p class="text-grey-6">
        {{ searchQuery || statusFilter !== 'all' || dateFilter
          ? 'Try adjusting your filters'
          : 'Schedule a job from a quote to get started' }}
      </p>
    </q-card>

    <!-- Schedule Dialog (placeholder) -->
    <q-dialog v-model="showScheduleDialog">
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">Schedule Job</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <p class="text-grey-7">
            To schedule a job, first create a quote and then convert it to a job.
          </p>
          <p class="text-grey-7 q-mb-none">
            Go to <router-link to="/quotes">Saved Quotes</router-link> to select a quote.
          </p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" v-close-popup />
          <q-btn
            color="primary"
            label="Go to Quotes"
            @click="$router.push('/quotes')"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useJobStore, JOB_STATUSES } from '../stores/jobs';
import { useAuthStore } from '../stores/auth';
import { useSyncStore } from '../stores/sync';
import type { JobStatus } from '@tictacstick/calculation-engine';

const router = useRouter();
const jobStore = useJobStore();
const authStore = useAuthStore();
const syncStore = useSyncStore();

// Initialize store
onMounted(async () => {
  syncStore.init();
  jobStore.initialize();

  if (authStore.isAuthenticated && navigator.onLine) {
    await syncStore.processQueue();
  }
});

// Filters
const searchQuery = ref('');
const statusFilter = ref<JobStatus | 'all'>('all');
const dateFilter = ref('');
const showScheduleDialog = ref(false);

// Status options for filter
const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Paused', value: 'paused' },
  { label: 'Completed', value: 'completed' },
  { label: 'Invoiced', value: 'invoiced' },
  { label: 'Cancelled', value: 'cancelled' },
];

// Computed
const stats = computed(() => jobStore.stats);

const filteredJobs = computed(() => {
  let jobs = jobStore.getAll();

  // Search filter
  if (searchQuery.value) {
    jobs = jobStore.search(searchQuery.value);
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    jobs = jobs.filter(j => j.status === statusFilter.value);
  }

  // Date filter
  if (dateFilter.value) {
    jobs = jobStore.getJobsByDate(dateFilter.value);
  }

  return jobs;
});

// Methods
function openJob(id: string) {
  router.push(`/jobs/${id}`);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
</script>

<style scoped>
.q-card {
  border-radius: 12px;
}
</style>
