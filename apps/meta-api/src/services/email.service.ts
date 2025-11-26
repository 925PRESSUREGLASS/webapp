import nodemailer from 'nodemailer';
import { z } from 'zod';

/**
 * Email configuration schema
 */
var emailConfigSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  secure: z.boolean(),
  user: z.string().min(1),
  pass: z.string().min(1),
  from: z.string().min(1)
});

type EmailConfig = z.infer<typeof emailConfigSchema>;

/**
 * Email send request schema
 */
var sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string(),
  html: z.string().optional(),
  attachment: z.string().optional(), // Base64 encoded file
  filename: z.string().optional(),
  cc: z.string().email().optional(),
  bcc: z.string().email().optional()
});

type SendEmailRequest = z.infer<typeof sendEmailSchema>;

/**
 * Email service for sending emails with attachments
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Initialize the email service with SMTP configuration
   */
  configure(config: EmailConfig): void {
    var parsed = emailConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error('Invalid email configuration: ' + JSON.stringify(parsed.error.format()));
    }

    this.config = parsed.data;
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    });
  }

  /**
   * Check if the email service is configured
   */
  isConfigured(): boolean {
    return this.transporter !== null && this.config !== null;
  }

  /**
   * Get the default from address
   */
  getFromAddress(): string {
    return this.config ? this.config.from : '';
  }

  /**
   * Validate send email request
   */
  validateRequest(request: unknown): { success: true; data: SendEmailRequest } | { success: false; error: z.ZodError } {
    var parsed = sendEmailSchema.safeParse(request);
    if (!parsed.success) {
      return { success: false, error: parsed.error };
    }
    return { success: true, data: parsed.data };
  }

  /**
   * Send an email
   */
  async send(request: SendEmailRequest): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter || !this.config) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      var mailOptions: nodemailer.SendMailOptions = {
        from: this.config.from,
        to: request.to,
        subject: request.subject,
        text: request.body
      };

      // Add HTML if provided
      if (request.html) {
        mailOptions.html = request.html;
      }

      // Add CC if provided
      if (request.cc) {
        mailOptions.cc = request.cc;
      }

      // Add BCC if provided
      if (request.bcc) {
        mailOptions.bcc = request.bcc;
      }

      // Add attachment if provided (base64 encoded)
      if (request.attachment && request.filename) {
        mailOptions.attachments = [
          {
            filename: request.filename,
            content: Buffer.from(request.attachment, 'base64')
          }
        ];
      }

      var info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      var message = err && err.message ? err.message : 'Unknown error';
      console.error('[EMAIL] Send failed:', message);
      return { success: false, error: message };
    }
  }

  /**
   * Verify the SMTP connection
   */
  async verify(): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true };
    } catch (err: any) {
      var message = err && err.message ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

// Singleton instance
var emailService = new EmailService();

export { emailService, sendEmailSchema, EmailService };
export type { SendEmailRequest, EmailConfig };
