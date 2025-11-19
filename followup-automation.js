// followup-automation.js - Follow-up Automation Module
// Dependencies: task-manager.js, followup-config.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Calculate next business day, skipping weekends if requested
   * @param {Date} date - Starting date
   * @param {boolean} [skipWeekends=true] - Whether to skip weekends (Saturday/Sunday)
   * @returns {Date} Next business day
   */
  function getNextBusinessDay(date, skipWeekends) {
    if (skipWeekends === undefined) skipWeekends = true;

    var nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    if (skipWeekends) {
      var dayOfWeek = nextDay.getDay();
      if (dayOfWeek === 0) { // Sunday
        nextDay.setDate(nextDay.getDate() + 1);
      } else if (dayOfWeek === 6) { // Saturday
        nextDay.setDate(nextDay.getDate() + 2);
      }
    }

    return nextDay;
  }

  /**
   * Calculate optimal contact time respecting business hours and DND rules
   * @param {Date} baseDate - Base date/time to start from
   * @param {string} [preferredTime='morning'] - Preferred time slot: 'morning', 'afternoon', 'evening'
   * @returns {Date} Optimized contact time respecting configuration rules
   *
   * Rules applied:
   * - Uses weekday/weekend contact time windows from config
   * - Avoids Do Not Disturb (DND) hours
   * - Optionally skips Sundays
   * - Sets time to middle of preferred time slot
   */
  function getOptimalContactTime(baseDate, preferredTime) {
    var config = window.FollowupConfig.get();
    var contactDate = new Date(baseDate);
    var dayOfWeek = contactDate.getDay();
    var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

    var timeSlots = isWeekend ?
      config.contactTimes.weekend :
      config.contactTimes.weekday;

    // Default to morning if no preference
    var timeSlot = timeSlots[preferredTime || 'morning'];

    // Set to middle of time slot
    var targetHour = timeSlot.start + Math.floor((timeSlot.end - timeSlot.start) / 2);
    contactDate.setHours(targetHour, 0, 0, 0);

    // Check DND times
    var dndTimes = config.dndTimes;
    var currentHour = contactDate.getHours();

    // Skip if in DND period
    if (currentHour >= dndTimes.daily.start || currentHour < dndTimes.daily.end) {
      // Move to next morning
      contactDate = getNextBusinessDay(contactDate);
      contactDate.setHours(timeSlots.morning.start, 0, 0, 0);
    }

    // Skip Sundays if configured
    if (dndTimes.sunday && contactDate.getDay() === 0) {
      contactDate.setDate(contactDate.getDate() + 1);
    }

    return contactDate;
  }

  /**
   * Format currency for display
   */
  function formatCurrency(amount) {
    if (typeof amount !== 'number') return '0.00';
    return amount.toFixed(2);
  }

  /**
   * Replace template variables with quote-specific data
   * @param {string} template - Message template with {variable} placeholders
   * @param {Object} quote - Quote object with data to substitute
   * @returns {string} Message with variables replaced
   *
   * Supported variables:
   * - {clientName} - Client first name (or "there" if missing)
   * - {serviceType} - "window cleaning", "pressure cleaning", or "our services"
   * - {quoteTotal} - Formatted quote total with $ symbol
   * - {companyName} - Company name (925 Pressure Glass)
   */
  function replaceMessageVariables(template, quote) {
    var message = template;

    // Client name
    var clientName = quote.clientName || 'there';
    if (clientName.indexOf(' ') > -1) {
      clientName = clientName.split(' ')[0]; // First name only
    }
    message = message.replace(/{clientName}/g, clientName);

    // Service type
    var serviceType = 'our services';
    if (quote.windowLines && quote.windowLines.length > 0) {
      serviceType = 'window cleaning';
    } else if (quote.pressureLines && quote.pressureLines.length > 0) {
      serviceType = 'pressure cleaning';
    }
    message = message.replace(/{serviceType}/g, serviceType);

    // Quote total
    var total = quote.totalIncGst ? '$' + formatCurrency(quote.totalIncGst) : 'your quote';
    message = message.replace(/{quoteTotal}/g, total);

    // Company name
    message = message.replace(/{companyName}/g, '925 Pressure Glass');

    return message;
  }

  /**
   * Determine appropriate follow-up sequence based on quote characteristics
   * @param {Object} quote - Quote object to analyze
   * @returns {Array} Follow-up sequence steps from config
   *
   * Selection criteria (in priority order):
   * 1. High-value quotes (>= threshold) → highValue sequence
   * 2. Referral source → referral sequence
   * 3. Quote status → status-based sequence (sent, viewed, accepted, declined)
   * 4. Default → sent sequence
   */
  function getFollowupSequence(quote) {
    var config = window.FollowupConfig.get();

    // High-value quotes get priority
    var total = quote.totalIncGst || 0;
    if (total >= config.highValue.threshold) {
      console.log('[FOLLOWUP-AUTO] Using high-value sequence for $' + total);
      return config.highValue.sequence;
    }

    // Repeat clients get special treatment
    // (Would check client database for repeat status)
    // if (quote.client && quote.client.isRepeat) {
    //   return config.repeatClient.sequence;
    // }

    // Referrals get priority
    if (quote.clientSource === 'referral') {
      console.log('[FOLLOWUP-AUTO] Using referral sequence');
      return config.referral.sequence;
    }

    // Default to status-based sequence
    var status = quote.status || 'sent';
    var sequence = config.sequences[status] || config.sequences.sent;

    console.log('[FOLLOWUP-AUTO] Using ' + status + ' sequence');
    return sequence;
  }

  /**
   * Create automated follow-up task sequence for a quote
   * @param {Object} quote - Quote object requiring follow-ups
   * @param {string} quote.id - Quote ID
   * @param {string} [quote.clientId] - Associated client ID
   * @param {string} [quote.clientName] - Client name for personalization
   * @param {number} [quote.totalIncGst] - Quote total (determines if high-value)
   * @param {string} [quote.clientSource] - Source: 'referral', etc.
   * @param {string} [quote.status] - Quote status: 'sent', 'viewed', 'accepted', 'declined'
   * @param {Date|string} [quote.dateSent] - When quote was sent (used as base time)
   * @returns {Array<Object>} Array of created task objects
   *
   * Process:
   * 1. Determines appropriate sequence based on quote characteristics
   * 2. Creates tasks with delays from base time (dateSent or now)
   * 3. Adjusts due dates to optimal contact times
   * 4. Personalizes messages with quote data
   * 5. Returns created tasks for tracking
   */
  function createFollowupTasks(quote) {
    if (!quote || !quote.id) {
      console.error('[FOLLOWUP-AUTO] Invalid quote for follow-up');
      return [];
    }

    if (!window.TaskManager) {
      console.error('[FOLLOWUP-AUTO] TaskManager not available');
      return [];
    }

    var sequence = getFollowupSequence(quote);
    var createdTasks = [];

    // Base time is when quote was sent (or now if not sent)
    var baseTime = quote.dateSent ? new Date(quote.dateSent) : new Date();

    console.log('[FOLLOWUP-AUTO] Creating ' + sequence.length + ' follow-up tasks for quote ' + quote.id);

    for (var i = 0; i < sequence.length; i++) {
      var step = sequence[i];

      // Calculate due date
      var dueDate = new Date(baseTime);
      dueDate.setHours(dueDate.getHours() + step.delay);

      // Adjust to optimal contact time
      dueDate = getOptimalContactTime(dueDate, 'morning');

      // Prepare message
      var message = replaceMessageVariables(step.message, quote);

      // Create task
      var task = window.TaskManager.createTask({
        quoteId: quote.id,
        clientId: quote.clientId || null,
        type: 'follow-up',
        followUpType: step.type,
        priority: step.priority,
        title: 'Follow up: ' + (quote.clientName || 'Quote #' + quote.id),
        description: message,
        followUpMessage: message,
        dueDate: dueDate.toISOString(),
        scheduledDate: dueDate.toISOString()
      });

      if (task) {
        createdTasks.push(task);
        console.log('[FOLLOWUP-AUTO] Task created: ' + step.type + ' due ' + dueDate.toLocaleString());
      }
    }

    return createdTasks;
  }

  /**
   * Cancel follow-up tasks for quote
   */
  function cancelFollowupTasks(quoteId, reason) {
    if (!window.TaskManager) {
      console.error('[FOLLOWUP-AUTO] TaskManager not available');
      return 0;
    }

    var tasks = window.TaskManager.getTasksForQuote(quoteId);
    var cancelled = 0;

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      // Only cancel pending/in-progress tasks
      if (task.status === 'pending' || task.status === 'in-progress') {
        window.TaskManager.cancelTask(task.id, reason);
        cancelled++;
      }
    }

    console.log('[FOLLOWUP-AUTO] Cancelled ' + cancelled + ' tasks for quote ' + quoteId);
    return cancelled;
  }

  /**
   * Create post-acceptance tasks
   */
  function createPostAcceptanceTasks(quote) {
    if (!window.TaskManager) {
      console.error('[FOLLOWUP-AUTO] TaskManager not available');
      return [];
    }

    var tasks = [];

    console.log('[FOLLOWUP-AUTO] Creating post-acceptance tasks for quote ' + quote.id);

    // Task 1: Send contract/booking link
    var contractTask = window.TaskManager.createTask({
      quoteId: quote.id,
      clientId: quote.clientId || null,
      type: 'email',
      priority: 'urgent',
      title: 'Send contract and booking link',
      description: 'Email contract and online booking link to ' + (quote.clientName || 'client'),
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
    });
    if (contractTask) tasks.push(contractTask);

    // Task 2: Confirm booking
    var confirmTask = window.TaskManager.createTask({
      quoteId: quote.id,
      clientId: quote.clientId || null,
      type: 'phone-call',
      priority: 'high',
      title: 'Confirm booking details',
      description: 'Call to confirm date, time, and any special requirements',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day
    });
    if (confirmTask) tasks.push(confirmTask);

    // Task 3: Pre-job reminder
    var reminderTask = window.TaskManager.createTask({
      quoteId: quote.id,
      clientId: quote.clientId || null,
      type: 'sms',
      priority: 'normal',
      title: 'Send pre-job reminder',
      description: 'SMS reminder 24 hours before scheduled job',
      dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days
    });
    if (reminderTask) tasks.push(reminderTask);

    console.log('[FOLLOWUP-AUTO] Created ' + tasks.length + ' post-acceptance tasks');
    return tasks;
  }

  /**
   * Create nurture sequence for declined quotes
   */
  function createNurtureSequence(quote) {
    if (!window.TaskManager) {
      console.error('[FOLLOWUP-AUTO] TaskManager not available');
      return [];
    }

    var config = window.FollowupConfig.get();
    var sequence = config.sequences.declined;
    var tasks = [];

    console.log('[FOLLOWUP-AUTO] Creating nurture sequence for quote ' + quote.id);

    for (var i = 0; i < sequence.length; i++) {
      var step = sequence[i];

      var dueDate = new Date();
      dueDate.setHours(dueDate.getHours() + step.delay);
      dueDate = getOptimalContactTime(dueDate, 'afternoon');

      var message = replaceMessageVariables(step.message, quote);

      var task = window.TaskManager.createTask({
        quoteId: quote.id,
        clientId: quote.clientId || null,
        type: 'nurture',
        followUpType: step.type,
        priority: step.priority,
        title: 'Nurture: ' + (quote.clientName || 'Client'),
        description: message,
        followUpMessage: message,
        dueDate: dueDate.toISOString()
      });

      if (task) tasks.push(task);
    }

    console.log('[FOLLOWUP-AUTO] Created ' + tasks.length + ' nurture tasks');
    return tasks;
  }

  /**
   * Update follow-up tasks when quote status changes
   */
  function updateFollowupTasks(quote, oldStatus, newStatus) {
    console.log('[FOLLOWUP-AUTO] Quote status changed from ' + oldStatus + ' to ' + newStatus);

    // If quote accepted, cancel remaining follow-ups
    if (newStatus === 'accepted') {
      cancelFollowupTasks(quote.id, 'Quote accepted');
      createPostAcceptanceTasks(quote);
      return;
    }

    // If quote declined, cancel follow-ups and create nurture sequence
    if (newStatus === 'declined') {
      cancelFollowupTasks(quote.id, 'Quote declined');
      createNurtureSequence(quote);
      return;
    }

    // If quote moved to follow-up status, adjust task priorities
    if (newStatus === 'follow-up') {
      var tasks = window.TaskManager.getTasksForQuote(quote.id);
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (task.status === 'pending' && task.priority === 'normal') {
          task.priority = 'high';
          window.TaskManager.updateTask(task);
        }
      }
    }
  }

  /**
   * Handle quote event
   */
  function handleQuoteEvent(eventType, quote, oldData) {
    console.log('[FOLLOWUP-AUTO] Event triggered: ' + eventType);

    switch (eventType) {
      case 'quote-created':
        // Don't create tasks yet - wait until sent
        console.log('[FOLLOWUP-AUTO] Quote created - waiting for send');
        break;

      case 'quote-sent':
        createFollowupTasks(quote);
        break;

      case 'quote-status-changed':
        var oldStatus = oldData ? oldData.status : null;
        updateFollowupTasks(quote, oldStatus, quote.status);
        break;

      case 'quote-viewed':
        // Upgrade priority if quote was viewed
        if (window.TaskManager) {
          var tasks = window.TaskManager.getTasksForQuote(quote.id);
          for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            if (task.status === 'pending' && task.priority === 'normal') {
              task.priority = 'high';
              window.TaskManager.addTaskNote(task.id, 'Client viewed quote - increased priority', 'system');
              window.TaskManager.updateTask(task);
            }
          }
        }
        break;

      case 'quote-deleted':
        cancelFollowupTasks(quote.id, 'Quote deleted');
        break;

      default:
        console.log('[FOLLOWUP-AUTO] Unhandled event: ' + eventType);
    }
  }

  /**
   * Get next task for quote
   */
  function getNextTask(quoteId) {
    if (!window.TaskManager) return null;

    var tasks = window.TaskManager.getTasksForQuote(quoteId);
    var pending = tasks.filter(function(t) {
      return t.status === 'pending' || t.status === 'in-progress';
    });

    if (pending.length === 0) return null;

    // Sort by due date
    pending.sort(function(a, b) {
      var dateA = new Date(a.dueDate || a.scheduledDate);
      var dateB = new Date(b.dueDate || b.scheduledDate);
      return dateA - dateB;
    });

    return pending[0];
  }

  /**
   * Get task summary for dashboard
   */
  function getTaskSummary() {
    if (!window.TaskManager) {
      return {
        total: 0,
        pending: 0,
        overdue: 0,
        today: 0,
        urgent: 0,
        completed: 0,
        byType: {},
        byPriority: {}
      };
    }

    var allTasks = window.TaskManager.getAllTasks();

    var summary = {
      total: allTasks.length,
      pending: 0,
      overdue: 0,
      today: 0,
      urgent: 0,
      completed: 0,
      byType: {},
      byPriority: {}
    };

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (var i = 0; i < allTasks.length; i++) {
      var task = allTasks[i];

      // Count by status
      if (task.status === 'pending' || task.status === 'in-progress') {
        summary.pending++;
      }
      if (task.status === 'completed') {
        summary.completed++;
      }
      if (task.status === 'overdue') {
        summary.overdue++;
      }

      // Count urgent
      if (task.priority === 'urgent' &&
          (task.status === 'pending' || task.status === 'in-progress')) {
        summary.urgent++;
      }

      // Count today
      if (task.dueDate) {
        var dueDate = new Date(task.dueDate);
        if (dueDate >= today && dueDate < tomorrow) {
          summary.today++;
        }
      }

      // Count by type
      var type = task.followUpType || task.type || 'other';
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      // Count by priority
      summary.byPriority[task.priority] = (summary.byPriority[task.priority] || 0) + 1;
    }

    return summary;
  }

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('followupAutomation', {
      createFollowupTasks: createFollowupTasks,
      cancelFollowupTasks: cancelFollowupTasks,
      updateFollowupTasks: updateFollowupTasks,
      handleQuoteEvent: handleQuoteEvent,
      getNextTask: getNextTask,
      getTaskSummary: getTaskSummary
    });
  }

  // Global API
  window.FollowupAutomation = {
    createFollowupTasks: createFollowupTasks,
    cancelFollowupTasks: cancelFollowupTasks,
    updateFollowupTasks: updateFollowupTasks,
    handleQuoteEvent: handleQuoteEvent,
    getNextTask: getNextTask,
    getTaskSummary: getTaskSummary
  };

  console.log('[FOLLOWUP-AUTO] Initialized');
})();
