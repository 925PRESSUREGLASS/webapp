// push-notifications.js - Push Notifications Manager
// Handle push notifications for tasks, payments, and alerts
// Dependencies: Capacitor Core, Capacitor Push Notifications Plugin
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Storage key for push token
  var PUSH_TOKEN_KEY = 'tts_push_token';
  var BACKEND_ENDPOINT_KEY = 'tts_backend_endpoint';
  var initialized = false;

  // ============================================
  // BACKEND INTEGRATION HELPERS
  // ============================================

  /**
   * Send push token to backend server (for future implementation)
   * This function prepares the infrastructure for backend integration
   * @param {string} token - Push notification token
   * @returns {Promise<void>}
   */
  function sendTokenToBackend(token) {
    return new Promise(function(resolve, reject) {
      // Check if backend endpoint is configured
      var endpoint = null;
      try {
        endpoint = localStorage.getItem(BACKEND_ENDPOINT_KEY);
      } catch (e) {
        console.warn('[PUSH] Could not access localStorage for backend endpoint');
      }

      if (!endpoint) {
        console.log('[PUSH] Backend endpoint not configured. Token stored locally only.');
        resolve();
        return;
      }

      // Prepare payload
      var payload = {
        token: token,
        platform: getPlatform(),
        timestamp: new Date().toISOString(),
        appVersion: getAppVersion()
      };

      console.log('[PUSH] Sending token to backend:', endpoint);

      // Send to backend (using XHR for ES5 compatibility)
      var xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint + '/api/push-tokens', true);
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('[PUSH] Token sent to backend successfully');
          resolve();
        } else {
          console.error('[PUSH] Backend returned error:', xhr.status, xhr.responseText);
          reject(new Error('Backend error: ' + xhr.status));
        }
      };

      xhr.onerror = function() {
        console.error('[PUSH] Network error sending token to backend');
        reject(new Error('Network error'));
      };

      xhr.ontimeout = function() {
        console.error('[PUSH] Timeout sending token to backend');
        reject(new Error('Request timeout'));
      };

      xhr.timeout = 10000; // 10 second timeout

      try {
        xhr.send(JSON.stringify(payload));
      } catch (e) {
        console.error('[PUSH] Error sending request:', e);
        reject(e);
      }
    });
  }

  /**
   * Get platform identifier
   * @returns {string}
   */
  function getPlatform() {
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.getPlatform) {
      return window.Capacitor.getPlatform();
    }
    return 'web';
  }

  /**
   * Get app version
   * @returns {string}
   */
  function getAppVersion() {
    if (window.APP && window.APP.version) {
      return window.APP.version;
    }
    return '1.11.0'; // Default version
  }

  /**
   * Configure backend endpoint for push token registration
   * @param {string} endpoint - Backend URL (e.g., 'https://api.example.com')
   */
  function configureBackendEndpoint(endpoint) {
    try {
      if (endpoint) {
        localStorage.setItem(BACKEND_ENDPOINT_KEY, endpoint);
        console.log('[PUSH] Backend endpoint configured:', endpoint);
      } else {
        localStorage.removeItem(BACKEND_ENDPOINT_KEY);
        console.log('[PUSH] Backend endpoint removed');
      }
    } catch (e) {
      console.error('[PUSH] Error saving backend endpoint:', e);
    }
  }

  /**
   * Get configured backend endpoint
   * @returns {string|null}
   */
  function getBackendEndpoint() {
    try {
      return localStorage.getItem(BACKEND_ENDPOINT_KEY);
    } catch (e) {
      console.error('[PUSH] Error reading backend endpoint:', e);
      return null;
    }
  }

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

      // Send token to backend server (if endpoint configured)
      sendTokenToBackend(token.value).catch(function(error) {
        console.warn('[PUSH] Could not send token to backend:', error.message);
        // Don't fail registration if backend sync fails
      });
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

    // Home page - main quote form
    if (page === 'home') {
      // Scroll to top and ensure main app is visible
      window.scrollTo(0, 0);

      // Close any open modals
      if (window.closeAllModals) {
        window.closeAllModals();
      }

      // Hide any open pages (tasks, etc.)
      var taskPage = document.getElementById('page-tasks');
      if (taskPage) {
        taskPage.style.display = 'none';
      }

      console.log('[PUSH] Navigated to home');
      return;
    }

    // Show task dashboard
    if (page === 'tasks') {
      if (window.TaskDashboardUI && window.TaskDashboardUI.show) {
        window.TaskDashboardUI.show();
        console.log('[PUSH] Navigated to tasks');
        return;
      }
    }

    // Show analytics dashboard
    if (page === 'analytics') {
      if (window.QuoteAnalytics && window.QuoteAnalytics.renderDashboard) {
        window.QuoteAnalytics.renderDashboard('all');
        console.log('[PUSH] Navigated to analytics');
        return;
      } else if (window.LazyLoader && window.LazyLoader.load) {
        // Try lazy loading analytics if not loaded yet
        window.LazyLoader.load('analytics').then(function() {
          if (window.QuoteAnalytics && window.QuoteAnalytics.renderDashboard) {
            window.QuoteAnalytics.renderDashboard('all');
            console.log('[PUSH] Navigated to analytics (lazy loaded)');
          }
        });
        return;
      }
    }

    // Show client database/list
    if (page === 'clients') {
      if (window.ClientDatabase && window.ClientDatabase.showList) {
        window.ClientDatabase.showList();
        console.log('[PUSH] Navigated to client list');
        return;
      }
    }

    // Show specific client detail
    if (page === 'client-detail' && params && params.id) {
      if (window.ClientDatabase && window.ClientDatabase.viewClient) {
        window.ClientDatabase.viewClient(params.id);
        console.log('[PUSH] Navigated to client detail:', params.id);
        return;
      }
    }

    // Show invoices list
    if (page === 'invoices') {
      if (window.InvoiceSystem && window.InvoiceSystem.showInvoiceList) {
        window.InvoiceSystem.showInvoiceList();
        console.log('[PUSH] Navigated to invoices');
        return;
      }
    }

    // Show specific invoice detail
    if (page === 'invoice-detail' && params && params.id) {
      if (window.InvoiceSystem && window.InvoiceSystem.editInvoice) {
        window.InvoiceSystem.editInvoice(params.id);
        console.log('[PUSH] Navigated to invoice detail:', params.id);
        return;
      }
    }

    // Show specific quote
    if (page === 'quote-detail' && params && params.id) {
      if (window.QuoteManager && window.QuoteManager.showQuote) {
        window.QuoteManager.showQuote(params.id);
        console.log('[PUSH] Navigated to quote detail:', params.id);
        return;
      }
    }

    // Show help/keyboard shortcuts
    if (page === 'help') {
      if (window.HelpSystem && window.HelpSystem.open) {
        window.HelpSystem.open();
        console.log('[PUSH] Navigated to help system');
        return;
      } else {
        // Fallback to keyboard shortcuts if available
        var helpBtn = document.getElementById('keyboardShortcutsBtn');
        if (helpBtn) {
          helpBtn.click();
          console.log('[PUSH] Navigated to keyboard shortcuts');
          return;
        }
      }
    }

    // Show webhook/sync settings
    if (page === 'settings' || page === 'webhook-settings') {
      if (window.openWebhookSettings) {
        window.openWebhookSettings();
        console.log('[PUSH] Navigated to webhook settings');
        return;
      }
    }

    // Show contracts page
    if (page === 'contracts') {
      var contractsPage = document.getElementById('page-contracts');
      if (contractsPage) {
        contractsPage.style.display = 'block';
        console.log('[PUSH] Navigated to contracts');
        return;
      }
    }

    // Fallback: log to console
    console.warn('[PUSH] Navigation not implemented for page:', page);
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
      getPushToken: getPushToken,
      configureBackendEndpoint: configureBackendEndpoint,
      getBackendEndpoint: getBackendEndpoint
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
    getPushToken: getPushToken,
    configureBackendEndpoint: configureBackendEndpoint,
    getBackendEndpoint: getBackendEndpoint,
    sendTokenToBackend: sendTokenToBackend
  };

  console.log('[PUSH-NOTIFICATIONS] Module loaded');
})();
