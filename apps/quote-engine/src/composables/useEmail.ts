import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useEmailStore } from '../stores/email';

/**
 * Email types
 */
export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachment?: string;
  filename?: string;
  cc?: string;
  bcc?: string;
}

export interface QuoteEmailRequest {
  to: string;
  subject?: string;
  body?: string;
  quoteNumber: string;
  pdfBase64: string;
}

export interface InvoiceEmailRequest {
  to: string;
  subject?: string;
  body?: string;
  invoiceNumber: string;
  pdfBase64: string;
}

export interface JobSummaryEmailRequest {
  to: string;
  subject?: string;
  body?: string;
  jobNumber: string;
  pdfBase64: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Composable for sending emails via meta-api
 */
export function useEmail() {
  const $q = useQuasar();
  const emailStore = useEmailStore();

  const isSending = ref(false);
  const lastError = ref<string | null>(null);

  const isConfigured = computed(() => emailStore.isConfigured);
  const apiUrl = computed(() => emailStore.apiUrl);

  /**
   * Send a generic email
   */
  async function sendEmail(request: EmailRequest): Promise<EmailResult> {
    if (!emailStore.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    isSending.value = true;
    lastError.value = null;

    try {
      const response = await fetch(`${emailStore.apiUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailStore.apiKey || '',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        lastError.value = data.error || 'Failed to send email';
        return { success: false, error: lastError.value || 'Unknown error' };
      }

      return { success: true, messageId: data.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      lastError.value = errorMessage;
      return { success: false, error: errorMessage };
    } finally {
      isSending.value = false;
    }
  }

  /**
   * Send a quote via email
   */
  async function sendQuote(request: QuoteEmailRequest): Promise<EmailResult> {
    if (!emailStore.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    isSending.value = true;
    lastError.value = null;

    try {
      const response = await fetch(`${emailStore.apiUrl}/email/send-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailStore.apiKey || '',
        },
        body: JSON.stringify({
          to: request.to,
          subject: request.subject || emailStore.defaultQuoteSubject,
          body: request.body || emailStore.defaultQuoteBody,
          attachment: request.pdfBase64,
          quoteNumber: request.quoteNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        lastError.value = data.error || 'Failed to send quote';
        return { success: false, error: lastError.value || 'Unknown error' };
      }

      $q.notify({
        type: 'positive',
        message: `Quote sent to ${request.to}`,
        icon: 'email',
      });

      return { success: true, messageId: data.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      lastError.value = errorMessage;
      $q.notify({
        type: 'negative',
        message: `Failed to send quote: ${errorMessage}`,
        icon: 'error',
      });
      return { success: false, error: errorMessage };
    } finally {
      isSending.value = false;
    }
  }

  /**
   * Send an invoice via email
   */
  async function sendInvoice(request: InvoiceEmailRequest): Promise<EmailResult> {
    if (!emailStore.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    isSending.value = true;
    lastError.value = null;

    try {
      const response = await fetch(`${emailStore.apiUrl}/email/send-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailStore.apiKey || '',
        },
        body: JSON.stringify({
          to: request.to,
          subject: request.subject || emailStore.defaultInvoiceSubject,
          body: request.body || emailStore.defaultInvoiceBody,
          attachment: request.pdfBase64,
          invoiceNumber: request.invoiceNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        lastError.value = data.error || 'Failed to send invoice';
        return { success: false, error: lastError.value || 'Unknown error' };
      }

      $q.notify({
        type: 'positive',
        message: `Invoice sent to ${request.to}`,
        icon: 'email',
      });

      return { success: true, messageId: data.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      lastError.value = errorMessage;
      $q.notify({
        type: 'negative',
        message: `Failed to send invoice: ${errorMessage}`,
        icon: 'error',
      });
      return { success: false, error: errorMessage };
    } finally {
      isSending.value = false;
    }
  }

  /**
   * Send a job summary via email
   */
  async function sendJobSummary(request: JobSummaryEmailRequest): Promise<EmailResult> {
    if (!emailStore.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    isSending.value = true;
    lastError.value = null;

    try {
      const response = await fetch(`${emailStore.apiUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailStore.apiKey || '',
        },
        body: JSON.stringify({
          to: request.to,
          subject: request.subject || `Job Summary - ${request.jobNumber}`,
          body: request.body || 'Please find your job summary attached.',
          attachment: request.pdfBase64,
          filename: `Job-${request.jobNumber}.pdf`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        lastError.value = data.error || 'Failed to send job summary';
        return { success: false, error: lastError.value || 'Unknown error' };
      }

      $q.notify({
        type: 'positive',
        message: `Job summary sent to ${request.to}`,
        icon: 'email',
      });

      return { success: true, messageId: data.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      lastError.value = errorMessage;
      $q.notify({
        type: 'negative',
        message: `Failed to send job summary: ${errorMessage}`,
        icon: 'error',
      });
      return { success: false, error: errorMessage };
    } finally {
      isSending.value = false;
    }
  }

  /**
   * Verify email service is working
   */
  async function verifyEmailService(): Promise<EmailResult> {
    if (!emailStore.isConfigured) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const response = await fetch(`${emailStore.apiUrl}/email/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': emailStore.apiKey || '',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Email verification failed' };
      }

      return { success: data.verified === true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      return { success: false, error: errorMessage };
    }
  }

  return {
    // State
    isSending,
    lastError,
    isConfigured,
    apiUrl,

    // Methods
    sendEmail,
    sendQuote,
    sendInvoice,
    sendJobSummary,
    verifyEmailService,
  };
}
