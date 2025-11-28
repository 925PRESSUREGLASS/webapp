import { defineStore } from 'pinia';
import { ref, computed, toRaw } from 'vue';
import { LocalStorage } from 'quasar';
import type {
  Job,
  JobItem,
  JobPhoto,
  JobNote,
  JobIssue,
  JobStatus,
  JobItemStatus,
  JobPhotoType,
  JobIssueSeverity,
  JobFilters,
  JobMetrics,
  WindowLineItem,
  PressureLineItem,
} from '@tictacstick/calculation-engine';
import {
  createJobItemFromWindowLine,
  createJobItemFromPressureLine,
  createJobPhoto,
  createJobNote,
  createJobIssue,
  calculateJobPricing,
  calculateJobProgress,
  getJobDuration,
  roundMoney,
} from '@tictacstick/calculation-engine';

// ============================================
// Constants
// ============================================

const JOBS_KEY = 'tts-jobs-v1';
const JOBS_SETTINGS_KEY = 'tts-jobs-settings-v1';

export const JOB_STATUSES: Record<JobStatus, { label: string; color: string; icon: string }> = {
  scheduled: { label: 'Scheduled', color: 'info', icon: 'event' },
  'in-progress': { label: 'In Progress', color: 'warning', icon: 'construction' },
  paused: { label: 'Paused', color: 'grey', icon: 'pause_circle' },
  completed: { label: 'Completed', color: 'positive', icon: 'check_circle' },
  invoiced: { label: 'Invoiced', color: 'purple', icon: 'receipt' },
  cancelled: { label: 'Cancelled', color: 'negative', icon: 'cancel' },
};

export const JOB_ITEM_STATUSES: Record<JobItemStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'grey', icon: 'radio_button_unchecked' },
  'in-progress': { label: 'In Progress', color: 'warning', icon: 'pending' },
  completed: { label: 'Completed', color: 'positive', icon: 'check_circle' },
  skipped: { label: 'Skipped', color: 'grey-6', icon: 'remove_circle' },
};

export interface JobSettings {
  nextJobNumber: number;
  jobPrefix: string;
  autoStartOnFirstItem: boolean;
  requirePhotosBeforeComplete: boolean;
  requireSignatureBeforeComplete: boolean;
  defaultScheduleDuration: number; // minutes
}

const DEFAULT_SETTINGS: JobSettings = {
  nextJobNumber: 1001,
  jobPrefix: 'JOB-',
  autoStartOnFirstItem: true,
  requirePhotosBeforeComplete: false,
  requireSignatureBeforeComplete: false,
  defaultScheduleDuration: 120, // 2 hours in minutes
};

// Window type labels for job items
const WINDOW_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard Window',
  french: 'French Door/Window',
  sliding: 'Sliding Door',
  skylight: 'Skylight',
  shopfront: 'Shopfront',
  leadlight: 'Leadlight',
  louvre: 'Louvre',
};

// Surface type labels for job items
const SURFACE_TYPE_LABELS: Record<string, string> = {
  concrete: 'Concrete',
  pavers: 'Pavers',
  timber: 'Timber Deck',
  roof: 'Roof',
  driveway: 'Driveway',
  walls: 'Walls',
  fence: 'Fence',
};

// ============================================
// Job Store
// ============================================

export const useJobStore = defineStore('jobs', () => {
  // State
  const jobs = ref<Job[]>([]);
  const settings = ref<JobSettings>({ ...DEFAULT_SETTINGS });
  const isLoaded = ref(false);

  // ============================================
  // Persistence
  // ============================================

  function loadJobs(): void {
    try {
      const saved = LocalStorage.getItem<Job[]>(JOBS_KEY);
      if (Array.isArray(saved)) {
        jobs.value = saved;
      }
    } catch (e) {
      console.error('[JOBS] Failed to load jobs:', e);
    }
  }

  function saveJobs(): void {
    try {
      LocalStorage.set(JOBS_KEY, toRaw(jobs.value));
    } catch (e) {
      console.error('[JOBS] Failed to save jobs:', e);
    }
  }

  function loadSettings(): void {
    try {
      const saved = LocalStorage.getItem<JobSettings>(JOBS_SETTINGS_KEY);
      if (saved) {
        settings.value = { ...DEFAULT_SETTINGS, ...saved };
      }
    } catch (e) {
      console.error('[JOBS] Failed to load settings:', e);
    }
  }

  function saveSettings(): void {
    try {
      LocalStorage.set(JOBS_SETTINGS_KEY, toRaw(settings.value));
    } catch (e) {
      console.error('[JOBS] Failed to save settings:', e);
    }
  }

  function initialize(): void {
    if (!isLoaded.value) {
      loadSettings();
      loadJobs();
      isLoaded.value = true;
    }
  }

  // ============================================
  // Job Number Generation
  // ============================================

  function getNextJobNumber(): string {
    const number = settings.value.jobPrefix + settings.value.nextJobNumber;
    settings.value.nextJobNumber++;
    saveSettings();
    return number;
  }

  // ============================================
  // CRUD Operations
  // ============================================

  interface CreateJobParams {
    quoteId: string;
    clientName: string;
    clientAddress: string;
    clientEmail?: string;
    clientPhone?: string;
    clientId?: string;
    scheduledDate: string;
    scheduledTime?: string;
    estimatedDuration?: number;
    windowLines?: WindowLineItem[];
    pressureLines?: PressureLineItem[];
    estimatedTotal: number;
    notes?: string;
  }

  function createJob(data: CreateJobParams): Job {
    const now = new Date().toISOString();
    const jobNumber = getNextJobNumber();

    // Convert quote lines to job items
    const items: JobItem[] = [];
    
    if (data.windowLines) {
      for (const line of data.windowLines) {
        const price = line.calculatedCost || 0;
        const time = line.calculatedMinutes || 30;
        const typeLabel = WINDOW_TYPE_LABELS[line.windowTypeId] || line.windowTypeId;
        items.push(createJobItemFromWindowLine(line, price, time, typeLabel));
      }
    }
    
    if (data.pressureLines) {
      for (const line of data.pressureLines) {
        const price = line.calculatedCost || 0;
        const time = line.calculatedMinutes || 60;
        const typeLabel = SURFACE_TYPE_LABELS[line.surfaceId] || line.surfaceId;
        items.push(createJobItemFromPressureLine(line, price, time, typeLabel));
      }
    }

    // Calculate initial pricing
    const pricing = calculateJobPricing(items);

    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobNumber,
      quoteId: data.quoteId,
      client: {
        id: data.clientId || '',
        name: data.clientName,
        address: data.clientAddress,
        email: data.clientEmail || '',
        phone: data.clientPhone || '',
      },
      status: 'scheduled',
      schedule: {
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        estimatedDuration: data.estimatedDuration || settings.value.defaultScheduleDuration,
      },
      items,
      pricing,
      photos: [],
      notes: data.notes ? [createJobNote(data.notes)] : [],
      issues: [],
      createdAt: now,
      updatedAt: now,
    };

    jobs.value.unshift(job);
    saveJobs();
    return job;
  }

  function getJob(id: string): Job | null {
    return jobs.value.find(job => job.id === id) || null;
  }

  function getJobByNumber(jobNumber: string): Job | null {
    return jobs.value.find(job => job.jobNumber === jobNumber) || null;
  }

  function updateJob(id: string, updates: Partial<Job>): Job | null {
    const index = jobs.value.findIndex(job => job.id === id);
    if (index === -1) return null;

    const job = jobs.value[index];
    const updated: Job = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    jobs.value[index] = updated;
    saveJobs();
    return updated;
  }

  function deleteJob(id: string): boolean {
    const index = jobs.value.findIndex(job => job.id === id);
    if (index === -1) return false;

    jobs.value.splice(index, 1);
    saveJobs();
    return true;
  }

  // ============================================
  // Status Management
  // ============================================

  function startJob(id: string): boolean {
    const job = getJob(id);
    if (!job || job.status !== 'scheduled') return false;

    job.status = 'in-progress';
    job.schedule.actualStartTime = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  function pauseJob(id: string, reason?: string): boolean {
    const job = getJob(id);
    if (!job || job.status !== 'in-progress') return false;

    job.status = 'paused';
    job.updatedAt = new Date().toISOString();
    
    if (reason) {
      job.notes.push(createJobNote(`Paused: ${reason}`));
    }
    
    saveJobs();
    return true;
  }

  function resumeJob(id: string): boolean {
    const job = getJob(id);
    if (!job || job.status !== 'paused') return false;

    job.status = 'in-progress';
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  function completeJob(id: string, completionData?: {
    clientSignature?: string;
    clientName?: string;
    feedback?: string;
    rating?: 1 | 2 | 3 | 4 | 5;
  }): boolean {
    const job = getJob(id);
    if (!job || (job.status !== 'in-progress' && job.status !== 'paused')) return false;

    // Check requirements
    if (settings.value.requirePhotosBeforeComplete && job.photos.length === 0) {
      console.warn('[JOBS] Cannot complete - photos required');
      return false;
    }

    if (settings.value.requireSignatureBeforeComplete && !completionData?.clientSignature) {
      console.warn('[JOBS] Cannot complete - signature required');
      return false;
    }

    const now = new Date().toISOString();
    
    job.status = 'completed';
    job.schedule.actualEndTime = now;
    job.updatedAt = now;

    // Calculate actual duration
    if (job.schedule.actualStartTime) {
      const startTime = new Date(job.schedule.actualStartTime).getTime();
      const endTime = new Date(now).getTime();
      job.schedule.actualDuration = Math.round((endTime - startTime) / 60000); // minutes
    }

    if (completionData) {
      job.completion = {
        completedAt: now,
        clientSignature: completionData.clientSignature,
        clientName: completionData.clientName,
        feedback: completionData.feedback,
        rating: completionData.rating,
      };
    } else {
      job.completion = {
        completedAt: now,
      };
    }

    // Recalculate final pricing
    job.pricing = calculateJobPricing(job.items);

    saveJobs();
    return true;
  }

  function cancelJob(id: string, reason?: string): boolean {
    const job = getJob(id);
    if (!job || job.status === 'invoiced') return false;

    job.status = 'cancelled';
    job.cancelReason = reason;
    job.updatedAt = new Date().toISOString();
    
    if (reason) {
      job.notes.push(createJobNote(`Cancelled: ${reason}`));
    }
    
    saveJobs();
    return true;
  }

  function markJobInvoiced(id: string, invoiceId: string): boolean {
    const job = getJob(id);
    if (!job || job.status !== 'completed') return false;

    job.status = 'invoiced';
    job.invoiceId = invoiceId;
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  // ============================================
  // Item Management
  // ============================================

  function updateItemStatus(jobId: string, itemId: string, status: JobItemStatus, notes?: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const item = job.items.find(i => i.id === itemId);
    if (!item) return false;

    item.status = status;
    
    if (status === 'completed') {
      item.completedAt = new Date().toISOString();
    }
    
    if (notes) {
      item.notes = notes;
    }

    // Auto-start job if first item started and setting enabled
    if (settings.value.autoStartOnFirstItem && job.status === 'scheduled' && status === 'in-progress') {
      startJob(jobId);
    }

    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  function adjustItemPrice(jobId: string, itemId: string, newPrice: number, reason: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const item = job.items.find(i => i.id === itemId);
    if (!item) return false;

    item.actualPrice = roundMoney(newPrice);
    item.priceAdjustmentReason = reason;

    // Recalculate job pricing
    job.pricing = calculateJobPricing(job.items);
    
    // Store adjustment reason on pricing
    job.pricing.adjustmentReason = reason;
    
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  function addItemNote(jobId: string, itemId: string, note: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const item = job.items.find(i => i.id === itemId);
    if (!item) return false;

    item.notes = item.notes ? `${item.notes}\n${note}` : note;
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  // ============================================
  // Photo Management
  // ============================================

  function addPhoto(
    jobId: string,
    photoUri: string,
    type: JobPhotoType,
    options?: {
      itemId?: string;
      caption?: string;
      thumbnail?: string;
      location?: { latitude: number; longitude: number };
    }
  ): JobPhoto | null {
    const job = getJob(jobId);
    if (!job) return null;

    const photo = createJobPhoto(type, photoUri, options);
    job.photos.push(photo);
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return photo;
  }

  function removePhoto(jobId: string, photoId: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const index = job.photos.findIndex(p => p.id === photoId);
    if (index === -1) return false;

    job.photos.splice(index, 1);
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  function updatePhotoCaption(jobId: string, photoId: string, caption: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const photo = job.photos.find(p => p.id === photoId);
    if (!photo) return false;

    photo.caption = caption;
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  // ============================================
  // Notes Management
  // ============================================

  function addNote(jobId: string, content: string, itemId?: string): JobNote | null {
    const job = getJob(jobId);
    if (!job) return null;

    const note = createJobNote(content, itemId);
    job.notes.push(note);
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return note;
  }

  function removeNote(jobId: string, noteId: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const index = job.notes.findIndex(n => n.id === noteId);
    if (index === -1) return false;

    job.notes.splice(index, 1);
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  // ============================================
  // Issues Management
  // ============================================

  function addIssue(
    jobId: string,
    description: string,
    severity: JobIssueSeverity,
    photoIds?: string[]
  ): JobIssue | null {
    const job = getJob(jobId);
    if (!job) return null;

    const issue = createJobIssue(description, severity, photoIds);
    job.issues.push(issue);
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return issue;
  }

  function resolveIssue(jobId: string, issueId: string, resolution: string): boolean {
    const job = getJob(jobId);
    if (!job) return false;

    const issue = job.issues.find(i => i.id === issueId);
    if (!issue) return false;

    issue.resolved = true;
    issue.resolution = resolution;
    issue.resolvedAt = new Date().toISOString();
    job.updatedAt = new Date().toISOString();
    saveJobs();
    return true;
  }

  // ============================================
  // Filtering and Search
  // ============================================

  function getAll(): Job[] {
    return [...jobs.value].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  function getByStatus(status: JobStatus): Job[] {
    return jobs.value.filter(job => job.status === status);
  }

  function getActiveJobs(): Job[] {
    return jobs.value.filter(job =>
      job.status === 'scheduled' || job.status === 'in-progress' || job.status === 'paused'
    );
  }

  function getJobsByDate(date: string): Job[] {
    const targetDate = new Date(date).toDateString();
    return jobs.value.filter(job => {
      const jobDate = new Date(job.schedule.scheduledDate).toDateString();
      return jobDate === targetDate;
    });
  }

  function getJobsByDateRange(startDate: Date, endDate: Date): Job[] {
    const start = startDate.getTime();
    const end = endDate.getTime();

    return jobs.value.filter(job => {
      const jobDate = new Date(job.schedule.scheduledDate).getTime();
      return jobDate >= start && jobDate <= end;
    });
  }

  function search(query: string): Job[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return getAll();

    return jobs.value.filter(job =>
      job.jobNumber.toLowerCase().includes(lowerQuery) ||
      job.client.name.toLowerCase().includes(lowerQuery) ||
      job.client.address.toLowerCase().includes(lowerQuery)
    );
  }

  function filterJobs(filters: JobFilters): Job[] {
    let result = [...jobs.value];

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        result = result.filter(job => (filters.status as JobStatus[]).includes(job.status));
      } else {
        result = result.filter(job => job.status === filters.status);
      }
    }

    if (filters.clientId) {
      result = result.filter(job => job.client.id === filters.clientId);
    }

    if (filters.fromDate) {
      const from = new Date(filters.fromDate).getTime();
      result = result.filter(job => new Date(job.schedule.scheduledDate).getTime() >= from);
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate).getTime();
      result = result.filter(job => new Date(job.schedule.scheduledDate).getTime() <= to);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(job =>
        job.jobNumber.toLowerCase().includes(query) ||
        job.client.name.toLowerCase().includes(query) ||
        job.client.address.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) =>
      new Date(b.schedule.scheduledDate).getTime() - new Date(a.schedule.scheduledDate).getTime()
    );
  }

  // ============================================
  // Statistics and Metrics
  // ============================================

  const stats = computed<JobMetrics>(() => {
    const list = jobs.value;
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const recentJobs = list.filter(job =>
      new Date(job.createdAt).getTime() >= thirtyDaysAgo
    );

    const completedJobs = recentJobs.filter(job =>
      job.status === 'completed' || job.status === 'invoiced'
    );

    // Calculate average duration for completed jobs
    let totalDuration = 0;
    let durationCount = 0;
    for (const job of completedJobs) {
      const duration = getJobDuration(job);
      if (duration > 0) {
        totalDuration += duration;
        durationCount++;
      }
    }

    // Calculate average rating
    let totalRating = 0;
    let ratingCount = 0;
    for (const job of completedJobs) {
      if (job.completion?.rating) {
        totalRating += job.completion.rating;
        ratingCount++;
      }
    }

    // Calculate revenue
    const totalRevenue = completedJobs.reduce((sum, job) => sum + job.pricing.actualTotal, 0);

    return {
      totalJobs: list.length,
      completedJobs: completedJobs.length,
      scheduledJobs: list.filter(j => j.status === 'scheduled').length,
      inProgressJobs: list.filter(j => j.status === 'in-progress').length,
      cancelledJobs: list.filter(j => j.status === 'cancelled').length,
      totalRevenue: roundMoney(totalRevenue),
      averageJobValue: completedJobs.length > 0 ? roundMoney(totalRevenue / completedJobs.length) : 0,
      averageCompletionTime: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    };
  });

  function getJobProgress(id: string): number {
    const job = getJob(id);
    if (!job) return 0;
    return calculateJobProgress(job.items);
  }

  // ============================================
  // Quote to Job Conversion
  // ============================================

  interface QuoteToJobParams {
    quoteId: string;
    clientName: string;
    clientAddress: string;
    clientEmail?: string;
    clientPhone?: string;
    clientId?: string;
    windowLines?: WindowLineItem[];
    pressureLines?: PressureLineItem[];
    total: number;
    scheduledDate: string;
    scheduledTime?: string;
    estimatedDuration?: number;
    notes?: string;
  }

  function convertQuoteToJob(params: QuoteToJobParams): Job {
    return createJob({
      quoteId: params.quoteId,
      clientName: params.clientName,
      clientAddress: params.clientAddress,
      clientEmail: params.clientEmail,
      clientPhone: params.clientPhone,
      clientId: params.clientId,
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      estimatedDuration: params.estimatedDuration,
      windowLines: params.windowLines,
      pressureLines: params.pressureLines,
      estimatedTotal: params.total,
      notes: params.notes,
    });
  }

  // ============================================
  // Export/Import
  // ============================================

  function exportJobs(): string {
    return JSON.stringify({
      jobs: toRaw(jobs.value),
      settings: toRaw(settings.value),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }, null, 2);
  }

  function importJobs(jsonData: string): { success: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonData);
      const importedJobs = data.jobs || data;

      if (!Array.isArray(importedJobs)) {
        return { success: false, count: 0, error: 'Invalid data format' };
      }

      let count = 0;
      for (const job of importedJobs) {
        if (job.id && job.jobNumber) {
          const exists = jobs.value.some(j => j.id === job.id);
          if (!exists) {
            jobs.value.push(job);
            count++;
          }
        }
      }

      if (count > 0) {
        saveJobs();
      }

      return { success: true, count };
    } catch (e) {
      return { success: false, count: 0, error: 'Failed to parse JSON' };
    }
  }

  // ============================================
  // Settings
  // ============================================

  function updateSettings(newSettings: Partial<JobSettings>): void {
    settings.value = { ...settings.value, ...newSettings };
    saveSettings();
  }

  function getSettings(): JobSettings {
    return { ...settings.value };
  }

  // ============================================
  // Return Store
  // ============================================

  return {
    // State
    jobs: computed(() => jobs.value),
    settings: computed(() => settings.value),
    isLoaded,
    stats,

    // Initialization
    initialize,

    // Job Number
    getNextJobNumber,

    // CRUD
    createJob,
    getJob,
    getJobByNumber,
    updateJob,
    deleteJob,

    // Status Management
    startJob,
    pauseJob,
    resumeJob,
    completeJob,
    cancelJob,
    markJobInvoiced,

    // Item Management
    updateItemStatus,
    adjustItemPrice,
    addItemNote,

    // Photo Management
    addPhoto,
    removePhoto,
    updatePhotoCaption,

    // Notes Management
    addNote,
    removeNote,

    // Issues Management
    addIssue,
    resolveIssue,

    // Filtering
    getAll,
    getByStatus,
    getActiveJobs,
    getJobsByDate,
    getJobsByDateRange,
    search,
    filterJobs,

    // Progress
    getJobProgress,

    // Quote Conversion
    convertQuoteToJob,

    // Export/Import
    exportJobs,
    importJobs,

    // Settings
    updateSettings,
    getSettings,

    // Clear all
    clearAll: () => {
      jobs.value = [];
      saveJobs();
    },
  };
});
