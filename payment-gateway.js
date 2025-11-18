// payment-gateway.js - Payment Gateway Integration
// Dependencies: payment-config.js, invoice-manager.js
// iOS Safari 12+ compatible (ES5 syntax only)

(function() {
  'use strict';

  /**
   * Generate payment link for invoice
   */
  function generatePaymentLink(invoice, callback) {
    var config = window.PaymentConfig.getConfig();
    var gateway = config.defaultGateway;

    console.log('[PAYMENT-GATEWAY] Generating payment link via:', gateway);

    switch (gateway) {
      case 'stripe':
        generateStripePaymentLink(invoice, callback);
        break;

      case 'square':
        generateSquarePaymentLink(invoice, callback);
        break;

      case 'ghl':
        generateGHLPaymentLink(invoice, callback);
        break;

      case 'manual':
        // No payment link for manual payments
        if (callback) callback(null, null);
        break;

      default:
        console.error('[PAYMENT-GATEWAY] Unsupported gateway:', gateway);
        if (callback) callback(new Error('Unsupported gateway'));
        break;
    }
  }

  /**
   * Generate Stripe payment link
   * In production, this would call backend API which creates Stripe Payment Link
   */
  function generateStripePaymentLink(invoice, callback) {
    var config = window.PaymentConfig.getConfig();
    var stripeConfig = config.gateways.stripe;

    if (!stripeConfig.enabled || !stripeConfig.publicKey) {
      console.error('[PAYMENT-GATEWAY] Stripe not configured');
      if (callback) callback(new Error('Stripe not configured'));
      return;
    }

    // In production, would make API call to backend:
    // POST /api/payments/create-stripe-link
    // Body: { invoiceId, amount, currency, description }
    // Backend creates Stripe Payment Link and returns URL

    // For now, generate placeholder link
    var paymentLink = 'https://buy.stripe.com/test_PLACEHOLDER';

    // Save link to invoice
    invoice.paymentLink = paymentLink;
    window.InvoiceManager.saveInvoice(invoice);

    console.log('[PAYMENT-GATEWAY] Stripe payment link generated:', paymentLink);

    if (callback) callback(null, paymentLink);
  }

  /**
   * Generate Square payment link
   */
  function generateSquarePaymentLink(invoice, callback) {
    var config = window.PaymentConfig.getConfig();
    var squareConfig = config.gateways.square;

    if (!squareConfig.enabled || !squareConfig.applicationId) {
      console.error('[PAYMENT-GATEWAY] Square not configured');
      if (callback) callback(new Error('Square not configured'));
      return;
    }

    // In production, would call backend API which creates Square Payment Link
    var paymentLink = 'https://square.link/u/PLACEHOLDER';

    invoice.paymentLink = paymentLink;
    window.InvoiceManager.saveInvoice(invoice);

    console.log('[PAYMENT-GATEWAY] Square payment link generated:', paymentLink);

    if (callback) callback(null, paymentLink);
  }

  /**
   * Generate GoHighLevel payment link
   */
  function generateGHLPaymentLink(invoice, callback) {
    var config = window.PaymentConfig.getConfig();
    var ghlConfig = config.gateways.ghl;

    if (!ghlConfig.enabled || !ghlConfig.apiKey) {
      console.error('[PAYMENT-GATEWAY] GHL not configured');
      if (callback) callback(new Error('GHL not configured'));
      return;
    }

    // In production, would call GHL API to create payment link
    var paymentData = {
      amount: Math.round(invoice.total * 100), // Convert to cents
      currency: ghlConfig.currency,
      description: 'Invoice ' + invoice.invoiceNumber,
      contactId: invoice.client.ghlId || null,
      invoiceNumber: invoice.invoiceNumber
    };

    // Would make API call to GHL
    var paymentLink = 'https://payments.leadconnectorhq.com/PLACEHOLDER';

    invoice.paymentLink = paymentLink;
    window.InvoiceManager.saveInvoice(invoice);

    console.log('[PAYMENT-GATEWAY] GHL payment link generated:', paymentLink);

    if (callback) callback(null, paymentLink);
  }

  /**
   * Process manual payment
   */
  function processManualPayment(invoiceId, paymentData, callback) {
    var invoice = window.InvoiceManager.getInvoice(invoiceId);

    if (!invoice) {
      if (callback) callback(new Error('Invoice not found'));
      return;
    }

    // Validate payment amount
    if (!paymentData.amount || paymentData.amount <= 0) {
      if (callback) callback(new Error('Invalid payment amount'));
      return;
    }

    if (paymentData.amount > invoice.amountDue) {
      console.warn('[PAYMENT-GATEWAY] Payment amount exceeds amount due');
    }

    // Record the payment
    var payment = window.InvoiceManager.recordPayment(invoiceId, {
      amount: paymentData.amount,
      method: paymentData.method || 'manual',
      reference: paymentData.reference || '',
      notes: paymentData.notes || '',
      status: 'completed'
    });

    console.log('[PAYMENT-GATEWAY] Manual payment processed:', payment.id);

    if (callback) callback(null, payment);

    return payment;
  }

  /**
   * Refund payment
   */
  function refundPayment(invoiceId, paymentId, refundAmount, reason, callback) {
    var config = window.PaymentConfig.getConfig();

    if (!config.features.refunds) {
      if (callback) callback(new Error('Refunds not enabled'));
      return;
    }

    var invoice = window.InvoiceManager.getInvoice(invoiceId);

    if (!invoice) {
      if (callback) callback(new Error('Invoice not found'));
      return;
    }

    // Find payment
    var payment = null;
    for (var i = 0; i < invoice.payments.length; i++) {
      if (invoice.payments[i].id === paymentId) {
        payment = invoice.payments[i];
        break;
      }
    }

    if (!payment) {
      if (callback) callback(new Error('Payment not found'));
      return;
    }

    // Validate refund amount
    var alreadyRefunded = payment.refunded || 0;
    var maxRefund = payment.amount - alreadyRefunded;

    if (refundAmount > maxRefund) {
      if (callback) callback(new Error('Refund amount exceeds payment amount'));
      return;
    }

    // Process refund (would call payment gateway API in production)
    var refund = {
      id: 'ref_' + Date.now(),
      paymentId: paymentId,
      amount: refundAmount,
      reason: reason || '',
      date: new Date().toISOString(),
      status: 'completed'
    };

    // Update payment record
    payment.refunded = (payment.refunded || 0) + refundAmount;
    payment.refunds = payment.refunds || [];
    payment.refunds.push(refund);

    // Update invoice amounts
    invoice.amountPaid = Math.round((invoice.amountPaid - refundAmount) * 100) / 100;
    invoice.amountDue = Math.round((invoice.total - invoice.amountPaid) * 100) / 100;

    // Update invoice status
    if (invoice.amountPaid <= 0) {
      invoice.status = 'refunded';
    } else if (invoice.amountDue > 0) {
      invoice.status = 'partially-paid';
    }

    window.InvoiceManager.saveInvoice(invoice);

    console.log('[PAYMENT-GATEWAY] Refund processed:', refund.amount, 'for payment', paymentId);

    if (callback) callback(null, refund);

    return refund;
  }

  /**
   * Verify payment from webhook
   * Called when payment gateway sends webhook notification
   */
  function verifyPayment(paymentData, callback) {
    console.log('[PAYMENT-GATEWAY] Verifying payment from webhook');

    // Extract invoice number from payment data
    var invoiceNumber = paymentData.invoiceNumber ||
                        (paymentData.metadata && paymentData.metadata.invoiceNumber);

    if (!invoiceNumber) {
      console.error('[PAYMENT-GATEWAY] No invoice number in payment data');
      if (callback) callback(new Error('No invoice number'));
      return;
    }

    var invoice = window.InvoiceManager.getInvoiceByNumber(invoiceNumber);

    if (!invoice) {
      console.error('[PAYMENT-GATEWAY] Invoice not found:', invoiceNumber);
      if (callback) callback(new Error('Invoice not found'));
      return;
    }

    // Record payment
    var payment = window.InvoiceManager.recordPayment(invoice.id, {
      amount: paymentData.amount / 100, // Convert from cents
      method: 'card',
      transactionId: paymentData.transactionId || paymentData.id,
      gateway: paymentData.gateway || 'unknown',
      status: 'completed'
    });

    console.log('[PAYMENT-GATEWAY] Payment verified:', payment.id);

    // Update related quote status if applicable
    if (invoice.quoteId && window.StorageManager) {
      var quote = window.StorageManager.getQuote(invoice.quoteId);
      if (quote && quote.status !== 'completed') {
        quote.status = 'paid';
        window.StorageManager.saveQuote(quote);
      }
    }

    if (callback) callback(null, payment);

    return payment;
  }

  /**
   * Get supported payment methods
   */
  function getSupportedMethods() {
    var config = window.PaymentConfig.getConfig();
    return config.options.acceptedMethods;
  }

  /**
   * Check if online payments are enabled
   */
  function isOnlinePaymentsEnabled() {
    var config = window.PaymentConfig.getConfig();
    return config.features.onlinePayments;
  }

  /**
   * Get active payment gateway
   */
  function getActiveGateway() {
    var config = window.PaymentConfig.getConfig();
    return config.defaultGateway;
  }

  // Public API
  var PaymentGateway = {
    generatePaymentLink: generatePaymentLink,
    processManualPayment: processManualPayment,
    refundPayment: refundPayment,
    verifyPayment: verifyPayment,
    getSupportedMethods: getSupportedMethods,
    isOnlinePaymentsEnabled: isOnlinePaymentsEnabled,
    getActiveGateway: getActiveGateway
  };

  // Register module
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('paymentGateway', PaymentGateway);
  }

  // Make globally available
  window.PaymentGateway = PaymentGateway;

  console.log('[PAYMENT-GATEWAY] Module loaded');
})();
