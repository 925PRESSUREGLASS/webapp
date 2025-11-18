// message-templates.js - Message Template System
// Dependencies: None
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Message Template Configuration
   * Defines reusable templates for SMS and email with variable substitution
   */
  var MESSAGE_TEMPLATES = {
    // SMS Templates
    sms: {
      // Quote sent notification
      quoteSent: {
        id: 'sms_quote_sent',
        name: 'Quote Sent',
        type: 'sms',
        body: 'Hi {clientFirstName}! Your quote for {serviceType} is ready. Check your email or view it here: {quoteLink}. Questions? Text or call anytime. - {companyName}',
        variables: ['clientFirstName', 'serviceType', 'quoteLink', 'companyName'],
        tags: ['quote', 'initial'],
        active: true
      },

      // First follow-up (24 hours)
      followUp1Day: {
        id: 'sms_followup_1day',
        name: 'Follow-up Day 1',
        type: 'sms',
        body: 'Hi {clientFirstName}, just checking if you got our quote for {serviceType}? Any questions? We\'re here to help! - {companyName}',
        variables: ['clientFirstName', 'serviceType', 'companyName'],
        tags: ['follow-up', 'day-1'],
        active: true
      },

      // Second follow-up (3 days)
      followUp3Days: {
        id: 'sms_followup_3days',
        name: 'Follow-up Day 3',
        type: 'sms',
        body: '{clientFirstName}, wanted to reach out about your {serviceType} quote. Would love to answer any questions. When works for a quick chat? - {ownerName}',
        variables: ['clientFirstName', 'serviceType', 'ownerName'],
        tags: ['follow-up', 'day-3'],
        active: true
      },

      // Expiring quote (7 days)
      quoteExpiring: {
        id: 'sms_quote_expiring',
        name: 'Quote Expiring',
        type: 'sms',
        body: 'Hi {clientFirstName}! Your {serviceType} quote expires in 48hrs. Lock in your price now. Book online: {bookingLink} or text me back. - {companyName}',
        variables: ['clientFirstName', 'serviceType', 'bookingLink', 'companyName'],
        tags: ['urgency', 'expiring'],
        active: true
      },

      // Booking confirmation
      bookingConfirmed: {
        id: 'sms_booking_confirmed',
        name: 'Booking Confirmed',
        type: 'sms',
        body: 'Thanks {clientFirstName}! Your {serviceType} is booked for {appointmentDate} at {appointmentTime}. We\'ll send a reminder 24hrs before. - {companyName}',
        variables: ['clientFirstName', 'serviceType', 'appointmentDate', 'appointmentTime', 'companyName'],
        tags: ['booking', 'confirmation'],
        active: true
      },

      // Pre-job reminder
      preJobReminder: {
        id: 'sms_prejob_reminder',
        name: 'Pre-Job Reminder',
        type: 'sms',
        body: 'Hi {clientFirstName}! Reminder: We\'ll be at {address} tomorrow at {appointmentTime} for {serviceType}. Please ensure clear access. See you then! - {companyName}',
        variables: ['clientFirstName', 'address', 'appointmentTime', 'serviceType', 'companyName'],
        tags: ['reminder', 'pre-job'],
        active: true
      },

      // Post-job thank you
      postJobThankYou: {
        id: 'sms_post_job',
        name: 'Post-Job Thank You',
        type: 'sms',
        body: 'Thanks for choosing {companyName}, {clientFirstName}! Hope you love the results! Mind leaving us a quick review? {reviewLink}. Appreciate you!',
        variables: ['companyName', 'clientFirstName', 'reviewLink'],
        tags: ['post-job', 'review-request'],
        active: true
      },

      // Lost quote - nurture
      lostQuoteNurture: {
        id: 'sms_lost_nurture',
        name: 'Lost Quote Nurture',
        type: 'sms',
        body: 'Hi {clientFirstName}, no worries if timing wasn\'t right! Here\'s 15% off when you\'re ready: {discountCode}. Valid for 30 days. - {companyName}',
        variables: ['clientFirstName', 'discountCode', 'companyName'],
        tags: ['nurture', 'discount'],
        active: true
      },

      // Seasonal reactivation
      seasonalReactivation: {
        id: 'sms_seasonal',
        name: 'Seasonal Reactivation',
        type: 'sms',
        body: '{clientFirstName}, it\'s been a while! Spring cleaning season is here. Ready for that {serviceType}? Reply YES for a quick quote. - {companyName}',
        variables: ['clientFirstName', 'serviceType', 'companyName'],
        tags: ['reactivation', 'seasonal'],
        active: true
      }
    },

    // Email Templates
    email: {
      // Quote sent email
      quoteSent: {
        id: 'email_quote_sent',
        name: 'Quote Sent Email',
        type: 'email',
        subject: 'Your {serviceType} Quote from {companyName}',
        body: '<!DOCTYPE html>\n<html>\n<head>\n    <style>\n        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n        .content { padding: 20px; background: #f9fafb; }\n        .quote-summary { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }\n        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }\n        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }\n    </style>\n</head>\n<body>\n    <div class="container">\n        <div class="header">\n            <h1>{companyName}</h1>\n            <p>Professional Window Cleaning & Pressure Washing</p>\n        </div>\n        \n        <div class="content">\n            <h2>Hi {clientName},</h2>\n            \n            <p>Thank you for requesting a quote! We\'re excited to help with your {serviceType} needs.</p>\n            \n            <div class="quote-summary">\n                <h3>Quote Summary</h3>\n                <p><strong>Quote #:</strong> {quoteNumber}</p>\n                <p><strong>Service:</strong> {serviceType}</p>\n                <p><strong>Total:</strong> {quoteTotal} (inc. GST)</p>\n                <p><strong>Valid Until:</strong> {expiryDate}</p>\n            </div>\n            \n            <p style="text-align: center;">\n                <a href="{quoteLink}" class="button">View Full Quote</a>\n                <a href="{bookingLink}" class="button">Book Now</a>\n            </p>\n            \n            <p>Have questions? Simply reply to this email or call us at {phone}.</p>\n            \n            <p>We look forward to working with you!</p>\n            \n            <p>Cheers,<br>\n            {ownerName}<br>\n            {companyName}</p>\n        </div>\n        \n        <div class="footer">\n            <p>{companyAddress}</p>\n            <p>Phone: {phone} | Email: {email}</p>\n            <p>ABN: {abn}</p>\n        </div>\n    </div>\n</body>\n</html>',
        variables: ['companyName', 'clientName', 'serviceType', 'quoteNumber', 'quoteTotal', 'expiryDate', 'quoteLink', 'bookingLink', 'phone', 'ownerName', 'companyAddress', 'email', 'abn'],
        tags: ['quote', 'initial'],
        active: true
      },

      // Follow-up email template
      followUpEmail: {
        id: 'email_followup',
        name: 'Follow-up Email',
        type: 'email',
        subject: 'Following up on your {serviceType} quote',
        body: '<!DOCTYPE html>\n<html>\n<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">\n    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">\n        <h2>Hi {clientName},</h2>\n        \n        <p>I wanted to follow up on the quote we sent for your {serviceType}.</p>\n        \n        <p>I understand you\'re busy, so I\'ll keep this brief:</p>\n        \n        <ul>\n            <li>✓ Fully insured and licensed</li>\n            <li>✓ 5-star reviews from local clients</li>\n            <li>✓ Professional equipment and eco-friendly products</li>\n            <li>✓ Satisfaction guaranteed</li>\n        </ul>\n        \n        <p>Is there anything I can clarify or any concerns I can address?</p>\n        \n        <p style="text-align: center; margin: 30px 0;">\n            <a href="{quoteLink}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">View Quote</a>\n        </p>\n        \n        <p>Best regards,<br>\n        {ownerName}<br>\n        {phone}</p>\n    </div>\n</body>\n</html>',
        variables: ['clientName', 'serviceType', 'quoteLink', 'ownerName', 'phone'],
        tags: ['follow-up'],
        active: true
      },

      // Booking confirmation email
      bookingConfirmation: {
        id: 'email_booking_confirmation',
        name: 'Booking Confirmation',
        type: 'email',
        subject: 'Booking Confirmed - {serviceType} on {appointmentDate}',
        body: '<!DOCTYPE html>\n<html>\n<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">\n    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">\n        <div style="background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px;">\n            <h1>✓ Booking Confirmed!</h1>\n        </div>\n        \n        <div style="padding: 20px; background: #f9fafb; margin-top: 20px; border-radius: 8px;">\n            <h2>Hi {clientName},</h2>\n            \n            <p>Great news! Your booking is confirmed.</p>\n            \n            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">\n                <h3>Appointment Details</h3>\n                <p><strong>Service:</strong> {serviceType}</p>\n                <p><strong>Date:</strong> {appointmentDate}</p>\n                <p><strong>Time:</strong> {appointmentTime}</p>\n                <p><strong>Address:</strong> {address}</p>\n                <p><strong>Total:</strong> {quoteTotal}</p>\n            </div>\n            \n            <h3>What to Expect</h3>\n            <ul>\n                <li>We\'ll send you a reminder 24 hours before</li>\n                <li>Please ensure clear access to all areas</li>\n                <li>Our technician will contact you on arrival</li>\n                <li>Payment due upon completion</li>\n            </ul>\n            \n            <p>Need to reschedule? Just reply to this email or call {phone}.</p>\n            \n            <p>Looking forward to serving you!</p>\n            \n            <p>Best regards,<br>\n            {companyName}</p>\n        </div>\n    </div>\n</body>\n</html>',
        variables: ['clientName', 'serviceType', 'appointmentDate', 'appointmentTime', 'address', 'quoteTotal', 'phone', 'companyName'],
        tags: ['booking', 'confirmation'],
        active: true
      }
    }
  };

  /**
   * Get template by ID
   */
  function getTemplate(messageType, templateId) {
    if (!MESSAGE_TEMPLATES[messageType]) {
      console.error('[TEMPLATES] Invalid message type:', messageType);
      return null;
    }

    var template = MESSAGE_TEMPLATES[messageType][templateId];

    if (!template) {
      console.error('[TEMPLATES] Template not found:', templateId);
      return null;
    }

    return template;
  }

  /**
   * Get all templates of a type
   */
  function getTemplatesByType(messageType) {
    if (!MESSAGE_TEMPLATES[messageType]) {
      console.error('[TEMPLATES] Invalid message type:', messageType);
      return {};
    }

    return MESSAGE_TEMPLATES[messageType];
  }

  /**
   * Get all templates with a specific tag
   */
  function getTemplatesByTag(tag) {
    var results = [];

    // Search SMS templates
    var smsTemplates = MESSAGE_TEMPLATES.sms;
    for (var key in smsTemplates) {
      if (smsTemplates.hasOwnProperty(key)) {
        var template = smsTemplates[key];
        if (template.tags && template.tags.indexOf(tag) !== -1) {
          results.push(template);
        }
      }
    }

    // Search email templates
    var emailTemplates = MESSAGE_TEMPLATES.email;
    for (var key in emailTemplates) {
      if (emailTemplates.hasOwnProperty(key)) {
        var template = emailTemplates[key];
        if (template.tags && template.tags.indexOf(tag) !== -1) {
          results.push(template);
        }
      }
    }

    return results;
  }

  /**
   * Save message templates to storage
   */
  function saveTemplates() {
    try {
      localStorage.setItem('tts_message_templates', JSON.stringify(MESSAGE_TEMPLATES));
      console.log('[TEMPLATES] Templates saved');
      return true;
    } catch (e) {
      console.error('[TEMPLATES] Failed to save templates:', e);
      return false;
    }
  }

  /**
   * Load message templates from storage
   */
  function loadTemplates() {
    try {
      var saved = localStorage.getItem('tts_message_templates');
      if (saved) {
        var templates = JSON.parse(saved);

        // Merge with defaults (preserves new default templates)
        if (templates.sms) {
          MESSAGE_TEMPLATES.sms = Object.assign({}, MESSAGE_TEMPLATES.sms, templates.sms);
        }
        if (templates.email) {
          MESSAGE_TEMPLATES.email = Object.assign({}, MESSAGE_TEMPLATES.email, templates.email);
        }

        console.log('[TEMPLATES] Templates loaded from storage');
      }
    } catch (e) {
      console.error('[TEMPLATES] Failed to load templates:', e);
    }
  }

  /**
   * Update template
   */
  function updateTemplate(messageType, templateId, updates) {
    var template = getTemplate(messageType, templateId);

    if (!template) {
      return false;
    }

    // Apply updates
    for (var key in updates) {
      if (updates.hasOwnProperty(key)) {
        template[key] = updates[key];
      }
    }

    // Save to storage
    return saveTemplates();
  }

  /**
   * Toggle template active status
   */
  function toggleTemplate(messageType, templateId) {
    var template = getTemplate(messageType, templateId);

    if (!template) {
      return false;
    }

    template.active = !template.active;
    return saveTemplates();
  }

  /**
   * Add custom template
   */
  function addCustomTemplate(messageType, template) {
    if (!MESSAGE_TEMPLATES[messageType]) {
      console.error('[TEMPLATES] Invalid message type:', messageType);
      return false;
    }

    // Generate ID if not provided
    if (!template.id) {
      template.id = 'custom_' + Date.now();
    }

    // Set type
    template.type = messageType;

    // Set active by default
    if (typeof template.active === 'undefined') {
      template.active = true;
    }

    // Add to templates
    MESSAGE_TEMPLATES[messageType][template.id] = template;

    return saveTemplates();
  }

  /**
   * Delete custom template
   */
  function deleteTemplate(messageType, templateId) {
    if (!MESSAGE_TEMPLATES[messageType]) {
      console.error('[TEMPLATES] Invalid message type:', messageType);
      return false;
    }

    // Don't allow deletion of default templates
    if (!templateId.startsWith('custom_')) {
      console.error('[TEMPLATES] Cannot delete default template');
      return false;
    }

    delete MESSAGE_TEMPLATES[messageType][templateId];
    return saveTemplates();
  }

  // Load templates on startup
  loadTemplates();

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('messageTemplates', {
      getTemplate: getTemplate,
      getTemplatesByType: getTemplatesByType,
      getTemplatesByTag: getTemplatesByTag,
      updateTemplate: updateTemplate,
      toggleTemplate: toggleTemplate,
      addCustomTemplate: addCustomTemplate,
      deleteTemplate: deleteTemplate,
      saveTemplates: saveTemplates,
      loadTemplates: loadTemplates
    });
  }

  // Global API
  window.MessageTemplates = {
    getTemplate: getTemplate,
    getTemplatesByType: getTemplatesByType,
    getTemplatesByTag: getTemplatesByTag,
    updateTemplate: updateTemplate,
    toggleTemplate: toggleTemplate,
    addCustomTemplate: addCustomTemplate,
    deleteTemplate: deleteTemplate,
    saveTemplates: saveTemplates,
    loadTemplates: loadTemplates,
    TEMPLATES: MESSAGE_TEMPLATES
  };

  console.log('[MESSAGE-TEMPLATES] Initialized');
})();
