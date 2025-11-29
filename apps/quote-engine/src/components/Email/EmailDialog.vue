<template>
  <q-dialog v-model="dialogOpen" persistent>
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="email" class="q-mr-sm" />
          {{ title }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Not Configured Warning -->
        <q-banner v-if="!emailStore.isConfigured" class="bg-warning text-dark q-mb-md">
          <template v-slot:avatar>
            <q-icon name="warning" color="dark" />
          </template>
          Email service is not configured. Please set up your email API in Settings.
          <template v-slot:action>
            <q-btn flat label="Go to Settings" @click="goToSettings" />
          </template>
        </q-banner>

        <q-form @submit.prevent="handleSend" class="q-gutter-md">
          <!-- Recipient -->
          <q-input
            v-model="form.to"
            label="To"
            type="email"
            :rules="[val => !!val || 'Email is required', val => isValidEmail(val) || 'Invalid email']"
            outlined
            dense
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <!-- CC (optional) -->
          <q-input
            v-model="form.cc"
            label="CC (optional)"
            type="email"
            outlined
            dense
          >
            <template v-slot:prepend>
              <q-icon name="people" />
            </template>
          </q-input>

          <!-- Subject -->
          <q-input
            v-model="form.subject"
            label="Subject"
            :rules="[val => !!val || 'Subject is required']"
            outlined
            dense
          >
            <template v-slot:prepend>
              <q-icon name="subject" />
            </template>
          </q-input>

          <!-- Body -->
          <q-input
            v-model="form.body"
            label="Message"
            type="textarea"
            :rules="[val => !!val || 'Message is required']"
            outlined
            rows="6"
          />

          <!-- Attachment Info -->
          <div v-if="attachmentName" class="q-pa-sm bg-grey-2 rounded-borders">
            <q-icon name="attach_file" class="q-mr-sm" />
            <span class="text-weight-medium">{{ attachmentName }}</span>
            <span class="text-grey-7 q-ml-sm">(will be attached)</span>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" v-close-popup :disable="isSending" />
        <q-btn
          color="primary"
          label="Send Email"
          icon="send"
          :loading="isSending"
          :disable="!canSend"
          @click="handleSend"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEmailStore } from '../../stores/email';
import { useEmail } from '../../composables/useEmail';

const props = defineProps<{
  modelValue: boolean;
  type: 'quote' | 'invoice' | 'job';
  recipientEmail?: string;
  defaultSubject?: string;
  defaultBody?: string;
  attachmentBase64?: string;
  attachmentName?: string;
  documentNumber?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'sent', result: { success: boolean; messageId?: string }): void;
}>();

const router = useRouter();
const emailStore = useEmailStore();
const { sendQuote, sendInvoice, sendEmail, isSending } = useEmail();

// Form state
const form = ref({
  to: '',
  cc: '',
  subject: '',
  body: '',
});

// Computed
const dialogOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const title = computed(() => {
  switch (props.type) {
    case 'quote': return 'Send Quote';
    case 'invoice': return 'Send Invoice';
    case 'job': return 'Send Job Summary';
    default: return 'Send Email';
  }
});

const canSend = computed(() => {
  return emailStore.isConfigured &&
    form.value.to.length > 0 &&
    isValidEmail(form.value.to) &&
    form.value.subject.length > 0 &&
    form.value.body.length > 0;
});

// Watch for dialog open to reset form
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Initialize form with props
    form.value = {
      to: props.recipientEmail || '',
      cc: '',
      subject: props.defaultSubject || getDefaultSubject(),
      body: props.defaultBody || getDefaultBody(),
    };
  }
});

// Methods
function getDefaultSubject(): string {
  switch (props.type) {
    case 'quote':
      return props.documentNumber
        ? `Your Quote #${props.documentNumber} from 925 Pressure Glass`
        : emailStore.defaultQuoteSubject;
    case 'invoice':
      return props.documentNumber
        ? `Invoice #${props.documentNumber} from 925 Pressure Glass`
        : emailStore.defaultInvoiceSubject;
    case 'job':
      return props.documentNumber
        ? `Job Summary #${props.documentNumber}`
        : 'Job Summary from 925 Pressure Glass';
    default:
      return '';
  }
}

function getDefaultBody(): string {
  switch (props.type) {
    case 'quote':
      return emailStore.defaultQuoteBody;
    case 'invoice':
      return emailStore.defaultInvoiceBody;
    case 'job':
      return 'Please find your job summary attached.\n\nThank you for choosing 925 Pressure Glass.';
    default:
      return '';
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function goToSettings(): void {
  dialogOpen.value = false;
  router.push('/settings');
}

async function handleSend(): Promise<void> {
  if (!canSend.value) return;

  let result;

  if (props.type === 'quote' && props.documentNumber && props.attachmentBase64) {
    result = await sendQuote({
      to: form.value.to,
      subject: form.value.subject,
      body: form.value.body,
      quoteNumber: props.documentNumber,
      pdfBase64: props.attachmentBase64,
    });
  } else if (props.type === 'invoice' && props.documentNumber && props.attachmentBase64) {
    result = await sendInvoice({
      to: form.value.to,
      subject: form.value.subject,
      body: form.value.body,
      invoiceNumber: props.documentNumber,
      pdfBase64: props.attachmentBase64,
    });
  } else {
    result = await sendEmail({
      to: form.value.to,
      cc: form.value.cc || undefined,
      subject: form.value.subject,
      body: form.value.body,
      attachment: props.attachmentBase64,
      filename: props.attachmentName,
    });
  }

  if (result.success) {
    emit('sent', { success: true, messageId: result.messageId });
    dialogOpen.value = false;
  } else {
    emit('sent', { success: false });
  }
}
</script>
