// push-notifications.js - Push Notifications Manager
// Handle push notifications for tasks, payments, and alerts
// Dependencies: Capacitor Core, Capacitor Push Notifications Plugin
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Storage key for push token
  var PUSH_TOKEN_KEY = 'tts_push_token';
  var initialized = false;

  // ============================================
  // AVAILABILITY CHECK
  // ============================================

  /**
   * Check if push notifications are available
   * @returns {boolean}
   */
  function isAvailable() {
    return typeof window.Capacitor !== 'undefined' &&
           window.Capacitor.Plugins &&
           window.Capacitor.Plugins.PushNotifications;
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize push notifications
   * @returns {Promise<void>}
   */
  function init() {
    if (!isAvailable()) {
      console.log('[PUSH] Push notifications not available');
      return Promise.resolve();
    }

    if (initialized) {
      console.log('[PUSH] Already initialized');
      return Promise.resolve();
    }

    console.log('[PUSH] Initializing...');

    // Request permission
    return window.Capacitor.Plugins.PushNotifications.requestPermissions()
      .then(function(permStatus) {
        if (permStatus.receive === 'granted') {
          console.log('[PUSH] Permission granted');

          // Register with FCM/APNs
          return window.Capacitor.Plugins.PushNotifications.register();
        } else {
          console.log('[PUSH] Permission denied');
          return Promise.reject(new Error('Push permission denied'));
        }
      })
      .then(function() {
        // Add listeners
        addListeners();
        initialized = true;
        console.log('[PUSH] Initialized successfully');
      })
      .catch(function(error) {
        console.error('[PUSH] Initialization error:', error);
        throw error;
      });
  }

  /**
   * Add event listeners
   */
  function addListeners() {
    if (!isAvailable()) {
      return;
    }

    // Registration success
    window.Capacitor.Plugins.PushNotifications.addListener('registration', function(token) {
      console.log('[PUSH] Registration success, token:', token.value);

      // Save token to localStorage
      try {
        localStorage.setItem(PUSH_TOKEN_KEY, token.value);
      } catch (e) {
        console.error('[PUSH] Failed to save token:', e);
      }

      // TODO: Send token to backend server when implemented
      // sendTokenToServer(token.value);
    });

    // Registration error
    window.Capacitor.Plugins.PushNotifications.addListener('registrationError', function(error) {
      console.error('[PUSH] Registration error:', error);
    });

    // Notification received (app in foreground)
    window.Capacitor.Plugins.PushNotifications.addListener('pushNotificationReceived', function(notification) {
      console.log('[PUSH] Notification received:', notification);

      // Show in-app notification
      showInAppNotification(notification);

      // Provide haptic feedback
      if (window.NativeFeatures && window.NativeFeatures.hapticLight) {
        window.NativeFeatures.hapticLight();
      }
    });

    // Notification tapped (app opened from notification)
    window.Capacitor.Plugins.PushNotifications.addListener('pushNotificationActionPerformed', function(action) {
      console.log('[PUSH] Notification action:', action);

      var data = action.notification.data;

      // Handle notification tap
      handleNotificationTap(data);
    });
  }

  // ============================================
  // NOTIFICATION HANDLING
  // ============================================

  /**
   * Show in-app notification
   * @param {Object} notification - Notification data
   */
  function showInAppNotification(notification) {
    var message = notification.body || notification.title || 'New notification';

    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast(message, 'info', 5000);
    } else if (window.showToast) {
      window.showToast(message, 'info');
    } else {
      // Fallback to alert
      console.log('[PUSH] Notification:', message);
    }
  }

  /**
   * Handle notification tap
   * @param {Object} data - Notification data payload
   */
  function handleNotificationTap(data) {
    console.log('[PUSH] Handling notification tap:', data);

    // Navigate based on notification type
    var type = data.type;

    if (type === 'task') {
      // Navigate to tasks page
      navigateTo('tasks', data);
    } else if (type === 'quote') {
      // Navigate to quote detail
      navigateTo('quote-detail', { id: data.quoteId });
    } else if (type === 'payment' || type === 'invoice') {
      // Navigate to invoices
      navigateTo('invoices', data);
    } else if (type === 'contract') {
      // Navigate to contract detail
      navigateTo('contract-detail', { id: data.contractId });
    } else if (type === 'client') {
      // Navigate to client detail
      navigateTo('client-detail', { id: data.clientId });
    } else {
      // Default: go to home
      navigateTo('home', data);
    }
  }

  /**
   * Navigate to page (helper function)
   * @param {string} page - Page identifier
   * @param {Object} params - Navigation parameters
   */
  function navigateTo(page, params) {
    console.log('[PUSH] Navigate to:', page, params);
    params = params || {};

    var navigated = false;

    // Show task dashboard
    if (page === 'tasks') {
      if (window.TaskDashboardUI && window.TaskDashboardUI.show) {
        window.TaskDashboardUI.show();
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Opening tasks...', 'info');
        }
        navigated = true;
      }
    }

    // Show specific quote
    if (page === 'quote-detail' && params.id) {
      if (window.QuoteManager && window.QuoteManager.showQuote) {
        window.QuoteManager.showQuote(params.id);
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Loading quote...', 'info');
        }
        navigated = true;
      }
    }

    // Show invoices list
    if (page === 'invoices') {
      if (window.InvoiceSystem && window.InvoiceSystem.showInvoiceList) {
        window.InvoiceSystem.showInvoiceList();
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Opening invoices...', 'info');
        }
        navigated = true;
      }
    }

    // Show specific invoice
    if (page === 'invoice-detail' && params.id) {
      if (window.InvoiceSystem && window.InvoiceSystem.viewInvoice) {
        window.InvoiceSystem.viewInvoice(params.id);
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Loading invoice...', 'info');
        }
        navigated = true;
      }
    }

    // Show client database
    if (page === 'clients') {
      if (window.ClientDatabase && window.ClientDatabase.showList) {
        window.ClientDatabase.showList();
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Opening client database...', 'info');
        }
        navigated = true;
      }
    }

    // Show specific client
    if (page === 'client-detail' && params.id) {
      if (window.ClientDatabase && window.ClientDatabase.viewClient) {
        window.ClientDatabase.viewClient(params.id);
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Loading client...', 'info');
        }
        navigated = true;
      } else if (window.ClientDatabase && window.ClientDatabase.showList) {
        // Fallback to showing list if viewClient doesn't exist
        window.ClientDatabase.showList();
        navigated = true;
      }
    }

    // Show analytics dashboard
    if (page === 'analytics') {
      if (window.QuoteAnalytics && window.QuoteAnalytics.renderDashboard) {
        var timeframe = params.timeframe || 'all';
        window.QuoteAnalytics.renderDashboard(timeframe);
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Loading analytics...', 'info');
        }
        navigated = true;
      }
    }

    // Show home/main quote screen
    if (page === 'home' || page === 'quote') {
      // Scroll to top of page
      window.scrollTo(0, 0);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Returning to quote screen...', 'info');
      }
      navigated = true;
    }

    // Show error if navigation failed
    if (!navigated) {
      console.warn('[PUSH] Navigation not available for:', page);
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Unable to navigate to: ' + page, 'error');
      }
    }
  }

  // ============================================
  // LOCAL NOTIFICATIONS
  // ============================================

  /**
   * Check if local notifications are available
   * @returns {boolean}
   */
  function areLocalNotificationsAvailable() {
    return typeof window.Capacitor !== 'undefined' &&
           window.Capacitor.Plugins &&
           window.Capacitor.Plugins.LocalNotifications;
  }

  /**
   * Schedule local notification
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {Date|number} options.scheduleTime - When to show (Date or timestamp)
   * @param {Object} options.data - Additional data payload
   * @param {number} options.id - Notification ID (optional)
   * @returns {Promise<void>}
   */
  function scheduleLocalNotification(options) {
    if (!areLocalNotificationsAvailable()) {
      console.warn('[PUSH] Local notifications not available');
      return Promise.resolve();
    }

    var notificationId = options.id || Date.now();
    var scheduleTime = options.scheduleTime;

    // Convert to Date if timestamp
    if (typeof scheduleTime === 'number') {
      scheduleTime = new Date(scheduleTime);
    }

    var notification = {
      title: options.title || 'TicTacStick',
      body: options.body || '',
      id: notificationId,
      schedule: {
        at: scheduleTime
      },
      extra: options.data || {}
    };

    return window.Capacitor.Plugins.LocalNotifications.schedule({
      notifications: [notification]
    })
      .then(function() {
        console.log('[PUSH] Local notification scheduled:', notificationId);
      })
      .catch(function(error) {
        console.error('[PUSH] Schedule notification error:', error);
        throw error;
      });
  }

  /**
   * Cancel local notification
   * @param {number} id - Notification ID
   * @returns {Promise<void>}
   */
  function cancelLocalNotification(id) {
    if (!areLocalNotificationsAvailable()) {
      return Promise.resolve();
    }

    return window.Capacitor.Plugins.LocalNotifications.cancel({
      notifications: [{ id: id }]
    })
      .then(function() {
        console.log('[PUSH] Cancelled notification:', id);
      })
      .catch(function(error) {
        console.error('[PUSH] Cancel notification error:', error);
        throw error;
      });
  }

  /**
   * Get pending local notifications
   * @returns {Promise<Array>}
   */
  function getPendingNotifications() {
    if (!areLocalNotificationsAvailable()) {
      return Promise.resolve([]);
    }

    return window.Capacitor.Plugins.LocalNotifications.getPending()
      .then(function(result) {
        return result.notifications || [];
      })
      .catch(function(error) {
        console.error('[PUSH] Get pending notifications error:', error);
        return [];
      });
  }

  // ============================================
  // TASK REMINDERS
  // ============================================

  /**
   * Schedule task reminder notification
   * @param {Object} task - Task object
   * @returns {Promise<void>}
   */
  function scheduleTaskReminder(task) {
    if (!task || !task.dueDate) {
      return Promise.resolve();
    }

    var dueDate = new Date(task.dueDate);
    var reminderTime = new Date(dueDate.getTime() - (60 * 60 * 1000)); // 1 hour before

    // Don't schedule if in the past
    if (reminderTime < new Date()) {
      return Promise.resolve();
    }

    return scheduleLocalNotification({
      id: parseInt('1' + task.id.replace(/\D/g, '').slice(0, 8), 10),
      title: 'Task Reminder',
      body: task.title || 'Task due soon',
      scheduleTime: reminderTime,
      data: {
        type: 'task',
        taskId: task.id
      }
    });
  }

  /**
   * Schedule follow-up reminder
   * @param {Object} quote - Quote object
   * @param {number} hoursDelay - Hours until reminder
   * @returns {Promise<void>}
   */
  function scheduleFollowUpReminder(quote, hoursDelay) {
    var reminderTime = new Date(Date.now() + (hoursDelay * 60 * 60 * 1000));

    return scheduleLocalNotification({
      id: parseInt('2' + quote.id.replace(/\D/g, '').slice(0, 8), 10),
      title: 'Follow-up Reminder',
      body: 'Follow up with ' + quote.clientName + ' about quote',
      scheduleTime: reminderTime,
      data: {
        type: 'quote',
        quoteId: quote.id
      }
    });
  }

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================

  /**
   * Check notification permissions
   * @returns {Promise<string>} Permission status
   */
  function checkPermissions() {
    if (!isAvailable()) {
      return Promise.resolve('denied');
    }

    return window.Capacitor.Plugins.PushNotifications.checkPermissions()
      .then(function(result) {
        return result.receive;
      })
      .catch(function(error) {
        console.error('[PUSH] Check permissions error:', error);
        return 'denied';
      });
  }

  /**
   * Request notification permissions
   * @returns {Promise<string>} Permission status
   */
  function requestPermissions() {
    if (!isAvailable()) {
      return Promise.resolve('denied');
    }

    return window.Capacitor.Plugins.PushNotifications.requestPermissions()
      .then(function(result) {
        console.log('[PUSH] Permission result:', result.receive);
        return result.receive;
      })
      .catch(function(error) {
        console.error('[PUSH] Request permissions error:', error);
        return 'denied';
      });
  }

  /**
   * Get push token
   * @returns {string|null} Push token
   */
  function getPushToken() {
    try {
      return localStorage.getItem(PUSH_TOKEN_KEY);
    } catch (e) {
      console.error('[PUSH] Failed to get token:', e);
      return null;
    }
  }

  // ============================================
  // MODULE REGISTRATION
  // ============================================

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('pushNotifications', {
      isAvailable: isAvailable,
      init: init,
      scheduleLocalNotification: scheduleLocalNotification,
      scheduleTaskReminder: scheduleTaskReminder,
      scheduleFollowUpReminder: scheduleFollowUpReminder,
      checkPermissions: checkPermissions,
      requestPermissions: requestPermissions,
      getPushToken: getPushToken
    });
  }

  // Global API
  window.PushNotificationsManager = {
    isAvailable: isAvailable,
    init: init,
    scheduleLocalNotification: scheduleLocalNotification,
    cancelLocalNotification: cancelLocalNotification,
    getPendingNotifications: getPendingNotifications,
    scheduleTaskReminder: scheduleTaskReminder,
    scheduleFollowUpReminder: scheduleFollowUpReminder,
    checkPermissions: checkPermissions,
    requestPermissions: requestPermissions,
    getPushToken: getPushToken
  };

  console.log('[PUSH-NOTIFICATIONS] Module loaded');
})();
