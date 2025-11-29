<template>
  <div class="job-receipt" ref="receiptRef">
    <!-- Header -->
    <div class="receipt-header">
      <div class="business-info">
        <h1 class="business-name">{{ settings.businessName || 'TicTacStick' }}</h1>
        <div v-if="settings.businessAddress">{{ settings.businessAddress }}</div>
        <div v-if="settings.businessPhone">{{ settings.businessPhone }}</div>
        <div v-if="settings.businessEmail">{{ settings.businessEmail }}</div>
        <div v-if="settings.abn">ABN: {{ settings.abn }}</div>
      </div>
      <div class="job-info">
        <h2>JOB COMPLETION RECEIPT</h2>
        <div class="job-number">{{ job.jobNumber }}</div>
        <div>Completed: {{ formatDate(job.completion?.completedAt || '') }}</div>
      </div>
    </div>

    <!-- Client Section -->
    <div class="client-section">
      <h3>Client</h3>
      <div class="client-name">{{ job.client.name }}</div>
      <div v-if="job.client.address">{{ job.client.address }}</div>
      <div v-if="job.client.phone">Phone: {{ job.client.phone }}</div>
      <div v-if="job.client.email">Email: {{ job.client.email }}</div>
    </div>

    <!-- Schedule Summary -->
    <div class="schedule-section">
      <h3>Service Details</h3>
      <div class="detail-row">
        <span>Scheduled Date:</span>
        <span>{{ formatDate(job.schedule.scheduledDate) }}</span>
      </div>
      <div class="detail-row" v-if="job.schedule.scheduledTime">
        <span>Scheduled Time:</span>
        <span>{{ job.schedule.scheduledTime }}</span>
      </div>
      <div class="detail-row" v-if="job.schedule.actualStartTime">
        <span>Started:</span>
        <span>{{ formatDateTime(job.schedule.actualStartTime) }}</span>
      </div>
      <div class="detail-row" v-if="job.schedule.actualEndTime">
        <span>Completed:</span>
        <span>{{ formatDateTime(job.schedule.actualEndTime) }}</span>
      </div>
      <div class="detail-row" v-if="job.schedule.actualDuration">
        <span>Duration:</span>
        <span>{{ formatDuration(job.schedule.actualDuration) }}</span>
      </div>
    </div>

    <!-- Work Items -->
    <table class="work-items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-center">Status</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in job.items" :key="item.id">
          <td>
            <div>{{ item.description }}</div>
            <div v-if="item.notes" class="item-notes">{{ item.notes }}</div>
            <div v-if="item.priceAdjustmentReason" class="item-adjustment">
              Adjusted: {{ item.priceAdjustmentReason }}
            </div>
          </td>
          <td class="text-center">
            <span :class="getStatusClass(item.status)">
              {{ getStatusLabel(item.status) }}
            </span>
          </td>
          <td class="text-right">${{ formatMoney(item.actualPrice) }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals-section">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>${{ formatMoney(job.pricing.actualSubtotal) }}</span>
      </div>
      <div class="total-row">
        <span>GST (10%):</span>
        <span>${{ formatMoney(job.pricing.actualGst) }}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total:</span>
        <span>${{ formatMoney(job.pricing.actualTotal) }}</span>
      </div>
      <div v-if="hasPriceAdjustment" class="total-row estimate-comparison">
        <span>Original Estimate:</span>
        <span>${{ formatMoney(job.pricing.estimatedTotal) }}</span>
      </div>
    </div>

    <!-- Issues (if any) -->
    <div v-if="job.issues.length > 0" class="issues-section">
      <h3>Issues Noted</h3>
      <div v-for="issue in job.issues" :key="issue.id" class="issue-item">
        <div class="issue-header">
          <span :class="getSeverityClass(issue.severity)">
            {{ issue.severity.toUpperCase() }}
          </span>
          {{ issue.description }}
        </div>
        <div v-if="issue.resolved" class="issue-resolution">
          ✓ Resolved: {{ issue.resolution }}
        </div>
      </div>
    </div>

    <!-- Notes (if any) -->
    <div v-if="job.notes.length > 0" class="notes-section">
      <h3>Notes</h3>
      <div v-for="note in job.notes" :key="note.id" class="note-item">
        <div>{{ note.text }}</div>
        <div class="note-date">{{ formatDateTime(note.createdAt) }}</div>
      </div>
    </div>

    <!-- Photos Section -->
    <div v-if="includePhotos && job.photos.length > 0" class="photos-section">
      <h3>Job Photos</h3>
      <div class="photo-grid">
        <div v-for="photo in job.photos" :key="photo.id" class="photo-item">
          <img :src="photo.uri" :alt="photo.caption || photo.type" />
          <div class="photo-caption">
            {{ photo.type }} - {{ formatDateTime(photo.takenAt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Signature -->
    <div v-if="job.completion?.clientSignature" class="signature-section">
      <h3>Client Signature</h3>
      <div class="signature-container">
        <img :src="job.completion.clientSignature" alt="Client Signature" class="signature-image" />
        <div class="signature-name">
          {{ job.completion.clientName || job.client.name }}
        </div>
        <div class="signature-date">
          Signed: {{ formatDateTime(job.completion.completedAt) }}
        </div>
      </div>
    </div>

    <!-- Rating (if provided) -->
    <div v-if="job.completion?.rating" class="rating-section">
      <h3>Customer Feedback</h3>
      <div class="stars">
        <span v-for="star in 5" :key="star" :class="star <= job.completion.rating ? 'star-filled' : 'star-empty'">
          ★
        </span>
        <span class="rating-text">{{ job.completion.rating }}/5</span>
      </div>
      <div v-if="job.completion.feedback" class="feedback-text">
        "{{ job.completion.feedback }}"
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Thank you for choosing {{ settings.businessName || 'TicTacStick' }}!</p>
      <p class="footer-small">
        This receipt was generated on {{ formatDateTime(new Date().toISOString()) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Job, JobItemStatus, JobIssueSeverity } from '@tictacstick/calculation-engine';
import type { InvoiceSettings } from '../../stores/invoices';

interface Props {
  job: Job;
  settings: InvoiceSettings;
  includePhotos?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  includePhotos: true,
});

const receiptRef = ref<HTMLElement | null>(null);

const hasPriceAdjustment = computed(() => {
  return Math.abs(props.job.pricing.actualTotal - props.job.pricing.estimatedTotal) > 0.01;
});

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} minutes`;
  if (mins === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hours}h ${mins}m`;
}

function getStatusLabel(status: JobItemStatus): string {
  const labels: Record<JobItemStatus, string> = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    skipped: 'Skipped',
  };
  return labels[status];
}

function getStatusClass(status: JobItemStatus): string {
  const classes: Record<JobItemStatus, string> = {
    pending: 'status-pending',
    'in-progress': 'status-progress',
    completed: 'status-completed',
    skipped: 'status-skipped',
  };
  return classes[status];
}

function getSeverityClass(severity: JobIssueSeverity): string {
  const classes: Record<JobIssueSeverity, string> = {
    low: 'severity-low',
    medium: 'severity-medium',
    high: 'severity-high',
  };
  return classes[severity];
}

// Expose receipt element for PDF generation
defineExpose({
  receiptRef,
});
</script>

<style scoped>
.job-receipt {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 40px;
  background: white;
  color: #333;
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 3px solid #4caf50;
}

.business-info {
  flex: 1;
}

.business-name {
  margin: 0 0 10px 0;
  color: #4caf50;
  font-size: 28px;
}

.job-info {
  text-align: right;
}

.job-info h2 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
}

.job-number {
  font-size: 24px;
  font-weight: bold;
  color: #4caf50;
  margin-bottom: 10px;
}

.client-section,
.schedule-section,
.issues-section,
.notes-section,
.photos-section,
.signature-section,
.rating-section {
  margin-bottom: 25px;
}

h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.client-name {
  font-size: 18px;
  font-weight: bold;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.work-items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.work-items th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
  font-weight: 600;
}

.work-items td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  vertical-align: top;
}

.work-items .text-center {
  text-align: center;
}

.work-items .text-right {
  text-align: right;
}

.item-notes {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 4px;
}

.item-adjustment {
  font-size: 12px;
  color: #ff9800;
  margin-top: 4px;
}

.status-pending {
  color: #9e9e9e;
}

.status-progress {
  color: #ff9800;
}

.status-completed {
  color: #4caf50;
  font-weight: bold;
}

.status-skipped {
  color: #757575;
  text-decoration: line-through;
}

.totals-section {
  width: 300px;
  margin-left: auto;
  margin-bottom: 30px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.grand-total {
  font-size: 18px;
  font-weight: bold;
  border-top: 2px solid #4caf50;
  border-bottom: 2px solid #4caf50;
  padding: 12px 0;
  margin-top: 10px;
  color: #4caf50;
}

.estimate-comparison {
  color: #666;
  font-size: 14px;
}

.issue-item {
  margin-bottom: 10px;
  padding: 10px;
  background: #fff3e0;
  border-radius: 4px;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.severity-low {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.severity-medium {
  background: #fff3e0;
  color: #ef6c00;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.severity-high {
  background: #ffebee;
  color: #c62828;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.issue-resolution {
  margin-top: 8px;
  color: #4caf50;
  font-size: 14px;
}

.note-item {
  margin-bottom: 10px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.note-date {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.photo-item {
  text-align: center;
}

.photo-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.photo-caption {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  text-transform: capitalize;
}

.signature-container {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.signature-image {
  max-width: 300px;
  max-height: 100px;
  margin-bottom: 10px;
}

.signature-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.signature-date {
  font-size: 12px;
  color: #666;
}

.stars {
  margin-bottom: 10px;
}

.star-filled {
  color: #ffc107;
  font-size: 24px;
}

.star-empty {
  color: #e0e0e0;
  font-size: 24px;
}

.rating-text {
  margin-left: 10px;
  font-size: 16px;
  color: #666;
}

.feedback-text {
  font-style: italic;
  color: #666;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.footer {
  text-align: center;
  color: #666;
  padding-top: 20px;
  border-top: 1px solid #eee;
  margin-top: 30px;
}

.footer-small {
  font-size: 12px;
  color: #999;
}

/* Print styles */
@media print {
  .job-receipt {
    padding: 0;
    max-width: 100%;
  }

  .photo-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .photo-item img {
    height: 120px;
  }
}
</style>
