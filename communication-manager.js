// communication-manager.js - Communication Manager Module
// Dependencies: message-templates.js, ghl-client.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Message history storage key
  var MESSAGE_STORAGE_KEY = 'tts_message_history';
  var MAX_HISTORY_ITEMS = 1000;

  // Company configuration (fallback values)
  var COMPANY_DEFAULTS = {
    name: '925 Pressure Glass',
    ownerName: 'Gerry',
    phone: '(08) 1234 5678',
    email: 'info@925pressureglass.com.au',
    abn: '12 345 678 901',
    address: {
      street: '123 Main Street',
      city: 'Perth',
      state: 'WA',
      postcode: '6000'
    },
    reviewLink: 'https://g.page/r/your-review-link',
    websiteUrl: 'https://925pressureglass.com.au'
  };

  /**
   * Get company configuration
   */
  function getCompanyConfig() {
    // Try to get from GHL config first
    if (window.GHL_CONFIG && window.GHL_CONFIG.company) {
      return window.GHL_CONFIG.company;
    }

    // Try to get from settings
    try {
      var settings = localStorage.getItem('tts_company_settings');
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (e) {
      console.error('[COMM] Failed to load company settings:', e);
    }

    return COMPANY_DEFAULTS;
  }

  /**
   * Format currency for display
   */
  function formatCurrency(amount) {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    if (isNaN(amount)) {
      return '$0.00';
    }
    return '$' + amount.toFixed(2);
  }

  /**
   * Format address as string
   */
  function formatAddress(address) {
    if (!address) return '';
    if (typeof address === 'string') return address;

    var parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.postcode) parts.push(address.postcode);

    return parts.join(', ');
  }

  /**
   * Generate discount code
   */
  function generateDiscountCode() {
    return 'SAVE15-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  /**
   * Get quote link
   */
  function getQuoteLink(quote) {
    var company = getCompanyConfig();
    var baseUrl = company.websiteUrl || COMPANY_DEFAULTS.websiteUrl;
    return baseUrl + '/quotes/' + (quote.id || quote.quoteNumber);
  }

  /**
   * Get booking link
   */
  function getBookingLink(quote) {
    var company = getCompanyConfig();
    var baseUrl = company.websiteUrl || COMPANY_DEFAULTS.websiteUrl;
    return baseUrl + '/book?quote=' + (quote.id || quote.quoteNumber);
  }

  /**
   * Get template data from quote
   */
  function getTemplateDataFromQuote(quote) {
    var company = getCompanyConfig();
    var client = quote.client || {};
    var clientFirstName = client.name ? client.name.split(' ')[0] : 'there';

    // Determine primary service type
    var serviceType = 'our services';
    if (quote.jobType) {
      serviceType = quote.jobType;
    } else if (quote.windowLines && quote.windowLines.length > 0) {
      serviceType = 'window cleaning';
    } else if (quote.pressureLines && quote.pressureLines.length > 0) {
      serviceType = 'pressure cleaning';
    }

    // Calculate expiry date (14 days from now)
    var expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 14);

    var data = {
      // Client info
      clientName: client.name || 'Valued Customer',
      clientFirstName: clientFirstName,
      clientEmail: client.email || '',
      clientPhone: client.phone || '',

      // Quote info
      quoteNumber: quote.quoteNumber || quote.id || 'N/A',
      quoteTotal: formatCurrency(quote.totalIncGst || quote.total || 0),
      serviceType: serviceType,
      quoteLink: getQuoteLink(quote),
      bookingLink: getBookingLink(quote),
      expiryDate: expiryDate.toLocaleDateString(),

      // Appointment info (if available)
      appointmentDate: quote.appointmentDate || '',
      appointmentTime: quote.appointmentTime || '',
      address: quote.clientLocation || formatAddress(client.address) || '',

      // Company info
      companyName: company.name || COMPANY_DEFAULTS.name,
      ownerName: company.ownerName || COMPANY_DEFAULTS.ownerName,
      phone: company.phone || COMPANY_DEFAULTS.phone,
      email: company.email || COMPANY_DEFAULTS.email,
      companyAddress: formatAddress(company.address || COMPANY_DEFAULTS.address),
      abn: company.abn || COMPANY_DEFAULTS.abn,

      // Dynamic links
      reviewLink: company.reviewLink || COMPANY_DEFAULTS.reviewLink,
      discountCode: generateDiscountCode()
    };

    return data;
  }

  /**
   * Replace template variables
   */
  function replaceVariables(template, data) {
    var message = template;

    // Replace all variables
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var value = data[key] || '';
        var regex = new RegExp('{' + key + '}', 'g');
        message = message.replace(regex, value);
      }
    }

    return message;
  }

  /**
   * Send SMS via GoHighLevel
   */
  function sendSMS(contactId, message, callback) {
    // Check if SMS is enabled
    if (!window.GHL_CONFIG || !window.GHL_CONFIG.features || !window.GHL_CONFIG.features.smsSync) {
      console.error('[COMM] SMS not enabled in GHL config');
      if (callback) callback(new Error('SMS not enabled'));
      return;
    }

    if (!contactId) {
      console.error('[COMM] No contact ID provided for SMS');
      if (callback) callback(new Error('No contact ID'));
      return;
    }

    if (!message) {
      console.error('[COMM] No message provided for SMS');
      if (callback) callback(new Error('No message'));
      return;
    }

    console.log('[COMM] Sending SMS to contact:', contactId);

    var messageData = {
      type: 'SMS',
      contactId: contactId,
      message: message
    };

    // Use GHL client to send
    if (!window.GHLClient) {
      console.error('[COMM] GHL Client not available');
      if (callback) callback(new Error('GHL Client not available'));
      return;
    }

    window.GHLClient.makeRequest('POST', '/conversations/messages', messageData, function(error, response) {
      if (error) {
        console.error('[COMM] Failed to send SMS:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[COMM] SMS sent successfully');

      // Save to message history
      saveMessageToHistory({
        type: 'sms',
        direction: 'outbound',
        contactId: contactId,
        message: message,
        timestamp: new Date().toISOString(),
        status: 'sent',
        ghlMessageId: response.message ? response.message.id : null
      });

      if (callback) callback(null, response);
    });
  }

  /**
   * Send email via GoHighLevel
   */
  function sendEmail(contactId, subject, body, callback) {
    // Check if email is enabled
    if (!window.GHL_CONFIG || !window.GHL_CONFIG.features || !window.GHL_CONFIG.features.emailSync) {
      console.error('[COMM] Email not enabled in GHL config');
      if (callback) callback(new Error('Email not enabled'));
      return;
    }

    if (!contactId) {
      console.error('[COMM] No contact ID provided for email');
      if (callback) callback(new Error('No contact ID'));
      return;
    }

    if (!subject || !body) {
      console.error('[COMM] Subject and body required for email');
      if (callback) callback(new Error('Subject and body required'));
      return;
    }

    console.log('[COMM] Sending email to contact:', contactId);

    var messageData = {
      type: 'Email',
      contactId: contactId,
      subject: subject,
      html: body
    };

    // Use GHL client to send
    if (!window.GHLClient) {
      console.error('[COMM] GHL Client not available');
      if (callback) callback(new Error('GHL Client not available'));
      return;
    }

    window.GHLClient.makeRequest('POST', '/conversations/messages', messageData, function(error, response) {
      if (error) {
        console.error('[COMM] Failed to send email:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[COMM] Email sent successfully');

      // Save to message history
      saveMessageToHistory({
        type: 'email',
        direction: 'outbound',
        contactId: contactId,
        subject: subject,
        message: body,
        timestamp: new Date().toISOString(),
        status: 'sent',
        ghlMessageId: response.message ? response.message.id : null
      });

      if (callback) callback(null, response);
    });
  }

  /**
   * Send message from template
   */
  function sendFromTemplate(quote, templateId, messageType, callback) {
    if (!quote || !quote.client) {
      console.error('[COMM] Invalid quote or missing client');
      if (callback) callback(new Error('Invalid quote'));
      return;
    }

    // Get template
    if (!window.MessageTemplates) {
      console.error('[COMM] MessageTemplates not available');
      if (callback) callback(new Error('MessageTemplates not available'));
      return;
    }

    var template = window.MessageTemplates.getTemplate(messageType, templateId);

    if (!template) {
      console.error('[COMM] Template not found:', templateId);
      if (callback) callback(new Error('Template not found'));
      return;
    }

    if (!template.active) {
      console.error('[COMM] Template not active:', templateId);
      if (callback) callback(new Error('Template not active'));
      return;
    }

    // Get template data
    var templateData = getTemplateDataFromQuote(quote);

    // Replace variables in body
    var message = replaceVariables(template.body, templateData);

    // Get contact GHL ID
    var contactId = quote.client.ghlId;

    if (!contactId) {
      console.error('[COMM] Client has no GHL ID');
      if (callback) callback(new Error('No GHL ID'));
      return;
    }

    // Send based on type
    if (messageType === 'sms') {
      sendSMS(contactId, message, callback);
    } else if (messageType === 'email') {
      var subject = replaceVariables(template.subject, templateData);
      sendEmail(contactId, subject, message, callback);
    } else {
      console.error('[COMM] Invalid message type:', messageType);
      if (callback) callback(new Error('Invalid message type'));
    }
  }

  /**
   * Save message to history
   */
  function saveMessageToHistory(message) {
    try {
      var history = getMessageHistory();
      history.push(message);

      // Keep last N messages
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(-MAX_HISTORY_ITEMS);
      }

      localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(history));
      console.log('[COMM] Message saved to history');
    } catch (e) {
      console.error('[COMM] Failed to save message history:', e);
    }
  }

  /**
   * Get message history
   */
  function getMessageHistory() {
    try {
      var history = localStorage.getItem(MESSAGE_STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch (e) {
      console.error('[COMM] Failed to load message history:', e);
      return [];
    }
  }

  /**
   * Get messages for contact
   */
  function getMessagesForContact(contactId) {
    var history = getMessageHistory();
    var messages = [];

    for (var i = 0; i < history.length; i++) {
      if (history[i].contactId === contactId) {
        messages.push(history[i]);
      }
    }

    return messages;
  }

  /**
   * Get messages for quote
   */
  function getMessagesForQuote(quote) {
    if (!quote.client || !quote.client.ghlId) {
      return [];
    }

    return getMessagesForContact(quote.client.ghlId);
  }

  /**
   * Get recent messages
   */
  function getRecentMessages(limit) {
    limit = limit || 50;
    var history = getMessageHistory();

    // Return last N messages in reverse order (newest first)
    var recent = history.slice(-limit);
    return recent.reverse();
  }

  /**
   * Mark message as read
   */
  function markAsRead(messageId) {
    try {
      var history = getMessageHistory();
      var updated = false;

      for (var i = 0; i < history.length; i++) {
        if (history[i].ghlMessageId === messageId) {
          history[i].read = true;
          updated = true;
          break;
        }
      }

      if (updated) {
        localStorage.setItem(MESSAGE_STORAGE_KEY, JSON.stringify(history));
        console.log('[COMM] Message marked as read:', messageId);
      }
    } catch (e) {
      console.error('[COMM] Failed to mark message as read:', e);
    }
  }

  /**
   * Get unread message count
   */
  function getUnreadCount() {
    var history = getMessageHistory();
    var unread = 0;

    for (var i = 0; i < history.length; i++) {
      if (history[i].direction === 'inbound' && !history[i].read) {
        unread++;
      }
    }

    return unread;
  }

  /**
   * Clear message history
   */
  function clearHistory() {
    try {
      localStorage.removeItem(MESSAGE_STORAGE_KEY);
      console.log('[COMM] Message history cleared');
      return true;
    } catch (e) {
      console.error('[COMM] Failed to clear message history:', e);
      return false;
    }
  }

  /**
   * Export message history
   */
  function exportHistory() {
    var history = getMessageHistory();
    var csv = 'Timestamp,Type,Direction,Message,Status\n';

    for (var i = 0; i < history.length; i++) {
      var msg = history[i];
      var row = [
        msg.timestamp,
        msg.type,
        msg.direction,
        '"' + (msg.message || '').replace(/"/g, '""') + '"',
        msg.status
      ];
      csv += row.join(',') + '\n';
    }

    // Download CSV
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'message-history-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);

    console.log('[COMM] Message history exported');
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('communicationManager', {
      sendSMS: sendSMS,
      sendEmail: sendEmail,
      sendFromTemplate: sendFromTemplate,
      getMessageHistory: getMessageHistory,
      getMessagesForContact: getMessagesForContact,
      getMessagesForQuote: getMessagesForQuote,
      getRecentMessages: getRecentMessages,
      markAsRead: markAsRead,
      getUnreadCount: getUnreadCount,
      clearHistory: clearHistory,
      exportHistory: exportHistory,
      replaceVariables: replaceVariables,
      getTemplateDataFromQuote: getTemplateDataFromQuote
    });
  }

  // Global API
  window.CommunicationManager = {
    sendSMS: sendSMS,
    sendEmail: sendEmail,
    sendFromTemplate: sendFromTemplate,
    getMessageHistory: getMessageHistory,
    getMessagesForContact: getMessagesForContact,
    getMessagesForQuote: getMessagesForQuote,
    getRecentMessages: getRecentMessages,
    markAsRead: markAsRead,
    getUnreadCount: getUnreadCount,
    clearHistory: clearHistory,
    exportHistory: exportHistory,
    replaceVariables: replaceVariables,
    getTemplateDataFromQuote: getTemplateDataFromQuote
  };

  console.log('[COMMUNICATION-MANAGER] Initialized');
})();
