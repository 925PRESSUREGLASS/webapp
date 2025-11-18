// message-sequences.js - Message Sequence Automation
// Dependencies: communication-manager.js, message-templates.js, task-manager.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Quote follow-up sequence
   * Triggered when quote is sent
   */
  var QUOTE_FOLLOWUP_SEQUENCE = {
    id: 'quote_followup',
    name: 'Quote Follow-up Sequence',
    trigger: 'quote-sent',
    enabled: true,
    steps: [
      {
        stepId: 1,
        delay: 0, // Immediate
        messageType: 'email',
        templateId: 'quoteSent',
        condition: null,
        description: 'Send quote via email'
      },
      {
        stepId: 2,
        delay: 24, // 24 hours
        messageType: 'sms',
        templateId: 'followUp1Day',
        condition: function(quote) {
          // Only if quote still in sent status
          return quote.status === 'sent' || quote.status === 'pending';
        },
        description: 'Follow-up SMS after 1 day'
      },
      {
        stepId: 3,
        delay: 72, // 3 days
        messageType: 'sms',
        templateId: 'followUp3Days',
        condition: function(quote) {
          return quote.status === 'sent' || quote.status === 'pending';
        },
        description: 'Follow-up SMS after 3 days'
      },
      {
        stepId: 4,
        delay: 168, // 7 days
        messageType: 'sms',
        templateId: 'quoteExpiring',
        condition: function(quote) {
          return quote.status === 'sent' || quote.status === 'pending';
        },
        description: 'Quote expiring reminder'
      }
    ]
  };

  /**
   * Booking confirmation sequence
   * Triggered when quote is accepted
   */
  var BOOKING_SEQUENCE = {
    id: 'booking_confirmation',
    name: 'Booking Confirmation Sequence',
    trigger: 'quote-accepted',
    enabled: true,
    steps: [
      {
        stepId: 1,
        delay: 0, // Immediate
        messageType: 'email',
        templateId: 'bookingConfirmation',
        condition: null,
        description: 'Send booking confirmation email'
      },
      {
        stepId: 2,
        delay: 1, // 1 hour
        messageType: 'sms',
        templateId: 'bookingConfirmed',
        condition: null,
        description: 'Send booking confirmation SMS'
      },
      {
        stepId: 3,
        delay: 24, // 24 hours before (would need to calculate based on appointment)
        messageType: 'sms',
        templateId: 'preJobReminder',
        condition: function(quote) {
          // Only if appointment date is set
          return quote.appointmentDate && quote.appointmentDate !== '';
        },
        description: 'Pre-job reminder'
      }
    ]
  };

  /**
   * Post-job sequence
   * Triggered when job is completed
   */
  var POSTJOB_SEQUENCE = {
    id: 'post_job',
    name: 'Post-Job Sequence',
    trigger: 'job-completed',
    enabled: true,
    steps: [
      {
        stepId: 1,
        delay: 2, // 2 hours after job
        messageType: 'sms',
        templateId: 'postJobThankYou',
        condition: null,
        description: 'Thank you and review request'
      }
    ]
  };

  /**
   * Lost quote nurture sequence
   * Triggered when quote is declined
   */
  var LOST_NURTURE_SEQUENCE = {
    id: 'lost_nurture',
    name: 'Lost Quote Nurture',
    trigger: 'quote-declined',
    enabled: true,
    steps: [
      {
        stepId: 1,
        delay: 168, // 1 week
        messageType: 'sms',
        templateId: 'lostQuoteNurture',
        condition: null,
        description: 'Offer discount for lost quote'
      },
      {
        stepId: 2,
        delay: 2160, // 90 days
        messageType: 'sms',
        templateId: 'seasonalReactivation',
        condition: null,
        description: 'Seasonal reactivation'
      }
    ]
  };

  /**
   * All sequences
   */
  var SEQUENCES = {
    quoteFollowup: QUOTE_FOLLOWUP_SEQUENCE,
    booking: BOOKING_SEQUENCE,
    postJob: POSTJOB_SEQUENCE,
    lostNurture: LOST_NURTURE_SEQUENCE
  };

  /**
   * Get sequence by ID
   */
  function getSequence(sequenceId) {
    return SEQUENCES[sequenceId] || null;
  }

  /**
   * Get all sequences
   */
  function getAllSequences() {
    var list = [];
    for (var key in SEQUENCES) {
      if (SEQUENCES.hasOwnProperty(key)) {
        list.push(SEQUENCES[key]);
      }
    }
    return list;
  }

  /**
   * Start sequence for quote
   */
  function startSequence(quote, sequenceId) {
    var sequence = getSequence(sequenceId);

    if (!sequence) {
      console.error('[SEQUENCES] Sequence not found:', sequenceId);
      return;
    }

    if (!sequence.enabled) {
      console.log('[SEQUENCES] Sequence disabled:', sequenceId);
      return;
    }

    if (!quote || !quote.id) {
      console.error('[SEQUENCES] Invalid quote');
      return;
    }

    console.log('[SEQUENCES] Starting sequence:', sequence.name, 'for quote:', quote.id);

    // Check if TaskManager is available
    if (!window.TaskManager) {
      console.error('[SEQUENCES] TaskManager not available');
      return;
    }

    // Create tasks for each step
    var baseTime = new Date();
    var tasksCreated = 0;

    for (var i = 0; i < sequence.steps.length; i++) {
      var step = sequence.steps[i];

      // Calculate scheduled time
      var scheduledTime = new Date(baseTime);
      scheduledTime.setHours(scheduledTime.getHours() + step.delay);

      // Create task
      try {
        var task = window.TaskManager.createTask({
          quoteId: quote.id,
          clientId: quote.client ? quote.client.id : null,
          type: 'message',
          followUpType: step.messageType,
          priority: 'normal',
          title: 'Send ' + step.messageType + ' - ' + sequence.name,
          description: step.description,
          scheduledDate: scheduledTime.toISOString(),
          dueDate: scheduledTime.toISOString(),
          metadata: {
            sequenceId: sequence.id,
            stepIndex: i,
            stepId: step.stepId,
            templateId: step.templateId,
            messageType: step.messageType,
            condition: step.condition ? step.condition.toString() : null
          }
        });

        console.log('[SEQUENCES] Task created:', task.id, '-', step.description);
        tasksCreated++;
      } catch (e) {
        console.error('[SEQUENCES] Failed to create task:', e);
      }
    }

    console.log('[SEQUENCES] Created', tasksCreated, 'tasks for sequence:', sequence.name);
    return tasksCreated;
  }

  /**
   * Stop sequence for quote
   */
  function stopSequence(quoteId, sequenceId) {
    if (!window.TaskManager) {
      console.error('[SEQUENCES] TaskManager not available');
      return 0;
    }

    var tasks = window.TaskManager.getTasksForQuote(quoteId);
    var stopped = 0;

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      // Check if task is part of this sequence
      if (task.metadata && task.metadata.sequenceId === sequenceId) {
        if (task.status === 'pending' || task.status === 'in-progress') {
          window.TaskManager.cancelTask(task.id, 'Sequence stopped');
          stopped++;
        }
      }
    }

    console.log('[SEQUENCES] Stopped', stopped, 'sequence tasks for:', sequenceId);
    return stopped;
  }

  /**
   * Stop all sequences for quote
   */
  function stopAllSequences(quoteId) {
    var totalStopped = 0;

    for (var key in SEQUENCES) {
      if (SEQUENCES.hasOwnProperty(key)) {
        var stopped = stopSequence(quoteId, SEQUENCES[key].id);
        totalStopped += stopped;
      }
    }

    console.log('[SEQUENCES] Stopped', totalStopped, 'total sequence tasks');
    return totalStopped;
  }

  /**
   * Process sequence task
   * Called when task is due
   */
  function processSequenceTask(task, callback) {
    if (!task.metadata || !task.metadata.templateId) {
      console.error('[SEQUENCES] Task missing sequence metadata');
      if (callback) callback(new Error('Invalid sequence task'));
      return;
    }

    console.log('[SEQUENCES] Processing sequence task:', task.id);

    // Get quote - use StorageManager if available
    var quote = null;
    if (window.StorageManager && window.StorageManager.getQuote) {
      quote = window.StorageManager.getQuote(task.quoteId);
    } else if (window.APP && window.APP.getQuoteById) {
      quote = window.APP.getQuoteById(task.quoteId);
    }

    if (!quote) {
      console.error('[SEQUENCES] Quote not found for sequence task:', task.quoteId);
      if (callback) callback(new Error('Quote not found'));
      return;
    }

    // Check condition if exists
    if (task.metadata.condition) {
      try {
        // Evaluate condition
        var conditionFn = eval('(' + task.metadata.condition + ')');
        var conditionMet = conditionFn(quote);

        if (!conditionMet) {
          console.log('[SEQUENCES] Condition not met, skipping task');
          if (window.TaskManager) {
            window.TaskManager.cancelTask(task.id, 'Condition not met');
          }
          if (callback) callback(null);
          return;
        }
      } catch (e) {
        console.error('[SEQUENCES] Failed to evaluate condition:', e);
        // Continue anyway if condition evaluation fails
      }
    }

    // Send message
    if (!window.CommunicationManager) {
      console.error('[SEQUENCES] CommunicationManager not available');
      if (callback) callback(new Error('CommunicationManager not available'));
      return;
    }

    window.CommunicationManager.sendFromTemplate(
      quote,
      task.metadata.templateId,
      task.metadata.messageType,
      function(error, result) {
        if (error) {
          console.error('[SEQUENCES] Failed to send sequence message:', error);
          if (callback) callback(error);
          return;
        }

        // Mark task as complete
        if (window.TaskManager) {
          window.TaskManager.completeTask(task.id, 'Message sent via sequence');
        }

        console.log('[SEQUENCES] Sequence message sent successfully');
        if (callback) callback(null, result);
      }
    );
  }

  /**
   * Handle quote event and trigger sequences
   */
  function handleQuoteEvent(eventType, quote) {
    console.log('[SEQUENCES] Handling quote event:', eventType);

    switch (eventType) {
      case 'quote-sent':
        startSequence(quote, 'quoteFollowup');
        break;

      case 'quote-accepted':
        // Stop follow-up sequence
        stopSequence(quote.id, 'quote_followup');
        // Start booking sequence
        startSequence(quote, 'booking');
        break;

      case 'quote-declined':
        // Stop follow-up sequence
        stopSequence(quote.id, 'quote_followup');
        // Start nurture sequence
        startSequence(quote, 'lostNurture');
        break;

      case 'job-completed':
        startSequence(quote, 'postJob');
        break;

      case 'quote-cancelled':
        // Stop all sequences
        stopAllSequences(quote.id);
        break;
    }
  }

  /**
   * Toggle sequence enabled/disabled
   */
  function toggleSequence(sequenceId) {
    var sequence = getSequence(sequenceId);

    if (!sequence) {
      console.error('[SEQUENCES] Sequence not found:', sequenceId);
      return false;
    }

    sequence.enabled = !sequence.enabled;
    console.log('[SEQUENCES] Sequence', sequenceId, 'enabled:', sequence.enabled);

    // Save to storage
    saveSequenceSettings();

    return sequence.enabled;
  }

  /**
   * Save sequence settings
   */
  function saveSequenceSettings() {
    try {
      var settings = {};
      for (var key in SEQUENCES) {
        if (SEQUENCES.hasOwnProperty(key)) {
          settings[key] = {
            enabled: SEQUENCES[key].enabled
          };
        }
      }

      localStorage.setItem('tts_sequence_settings', JSON.stringify(settings));
      console.log('[SEQUENCES] Settings saved');
    } catch (e) {
      console.error('[SEQUENCES] Failed to save settings:', e);
    }
  }

  /**
   * Load sequence settings
   */
  function loadSequenceSettings() {
    try {
      var settings = localStorage.getItem('tts_sequence_settings');
      if (settings) {
        var parsed = JSON.parse(settings);

        for (var key in parsed) {
          if (parsed.hasOwnProperty(key) && SEQUENCES[key]) {
            SEQUENCES[key].enabled = parsed[key].enabled;
          }
        }

        console.log('[SEQUENCES] Settings loaded');
      }
    } catch (e) {
      console.error('[SEQUENCES] Failed to load settings:', e);
    }
  }

  /**
   * Get active sequences count
   */
  function getActiveSequencesCount(quoteId) {
    if (!window.TaskManager) {
      return 0;
    }

    var tasks = window.TaskManager.getTasksForQuote(quoteId);
    var activeCount = 0;

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      // Check if task is a sequence task and is active
      if (task.metadata && task.metadata.sequenceId) {
        if (task.status === 'pending' || task.status === 'in-progress') {
          activeCount++;
        }
      }
    }

    return activeCount;
  }

  /**
   * Get sequence tasks for quote
   */
  function getSequenceTasksForQuote(quoteId) {
    if (!window.TaskManager) {
      return [];
    }

    var tasks = window.TaskManager.getTasksForQuote(quoteId);
    var sequenceTasks = [];

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      // Check if task is a sequence task
      if (task.metadata && task.metadata.sequenceId) {
        sequenceTasks.push(task);
      }
    }

    return sequenceTasks;
  }

  // Load settings on startup
  loadSequenceSettings();

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('messageSequences', {
      startSequence: startSequence,
      stopSequence: stopSequence,
      stopAllSequences: stopAllSequences,
      processSequenceTask: processSequenceTask,
      handleQuoteEvent: handleQuoteEvent,
      getSequence: getSequence,
      getAllSequences: getAllSequences,
      toggleSequence: toggleSequence,
      getActiveSequencesCount: getActiveSequencesCount,
      getSequenceTasksForQuote: getSequenceTasksForQuote
    });
  }

  // Global API
  window.MessageSequences = {
    startSequence: startSequence,
    stopSequence: stopSequence,
    stopAllSequences: stopAllSequences,
    processSequenceTask: processSequenceTask,
    handleQuoteEvent: handleQuoteEvent,
    getSequence: getSequence,
    getAllSequences: getAllSequences,
    toggleSequence: toggleSequence,
    getActiveSequencesCount: getActiveSequencesCount,
    getSequenceTasksForQuote: getSequenceTasksForQuote,
    SEQUENCES: SEQUENCES
  };

  console.log('[MESSAGE-SEQUENCES] Initialized');
})();
