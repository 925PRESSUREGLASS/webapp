// native-features.js - Native Features Manager
// Centralized access to all native Capacitor capabilities
// Dependencies: Capacitor Core (loaded via CDN in index.html)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // ============================================
  // PLATFORM DETECTION
  // ============================================

  /**
   * Check if running in native app environment
   * @returns {boolean}
   */
  function isNative() {
    return typeof window.Capacitor !== 'undefined' &&
           window.Capacitor.isNativePlatform &&
           window.Capacitor.isNativePlatform();
  }

  /**
   * Get current platform
   * @returns {string} 'web', 'ios', or 'android'
   */
  function getPlatform() {
    if (!isNative()) {
      return 'web';
    }
    return window.Capacitor.getPlatform();
  }

  /**
   * Check if running on iOS
   * @returns {boolean}
   */
  function isIOS() {
    return getPlatform() === 'ios';
  }

  /**
   * Check if running on Android
   * @returns {boolean}
   */
  function isAndroid() {
    return getPlatform() === 'android';
  }

  // ============================================
  // INITIALIZATION
  // ============================================

  /**
   * Initialize all native features
   */
  function init() {
    if (!isNative()) {
      console.log('[NATIVE] Running in web mode');
      return;
    }

    console.log('[NATIVE] Running on: ' + getPlatform());

    // Setup status bar
    setupStatusBar();

    // Setup keyboard
    setupKeyboard();

    // Initialize push notifications (if module loaded)
    if (window.PushNotificationsManager && window.PushNotificationsManager.init) {
      window.PushNotificationsManager.init();
    }

    console.log('[NATIVE] Initialized successfully');
  }

  /**
   * Setup status bar appearance
   */
  function setupStatusBar() {
    if (!window.Capacitor.Plugins.StatusBar) {
      return;
    }

    try {
      // Set style to dark (light text)
      window.Capacitor.Plugins.StatusBar.setStyle({ style: 'DARK' });

      // Set background color to match app theme
      window.Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#2563eb' });

      console.log('[NATIVE] Status bar configured');
    } catch (error) {
      console.error('[NATIVE] Status bar setup error:', error);
    }
  }

  /**
   * Setup keyboard behavior
   */
  function setupKeyboard() {
    if (!window.Capacitor.Plugins.Keyboard) {
      return;
    }

    try {
      // Show accessory bar with prev/next/done buttons
      window.Capacitor.Plugins.Keyboard.setAccessoryBarVisible({ isVisible: true });

      console.log('[NATIVE] Keyboard configured');
    } catch (error) {
      console.error('[NATIVE] Keyboard setup error:', error);
    }
  }

  // ============================================
  // SHARING
  // ============================================

  /**
   * Share content via native share sheet
   * @param {Object} options - Share options
   * @param {string} options.title - Share title
   * @param {string} options.text - Share text
   * @param {string} options.url - Share URL
   * @param {string} options.dialogTitle - Dialog title
   */
  function share(options) {
    if (!window.Capacitor.Plugins.Share) {
      alert('Sharing not available in this environment');
      return Promise.reject(new Error('Share plugin not available'));
    }

    var shareOptions = {
      title: options.title || 'Share',
      text: options.text || '',
      url: options.url || '',
      dialogTitle: options.dialogTitle || 'Share via'
    };

    return window.Capacitor.Plugins.Share.share(shareOptions)
      .then(function(result) {
        console.log('[NATIVE] Share successful');
        return result;
      })
      .catch(function(error) {
        console.error('[NATIVE] Share error:', error);
        throw error;
      });
  }

  /**
   * Share quote as text
   * @param {Object} quoteData - Quote data to share
   */
  function shareQuote(quoteData) {
    var text = 'Quote for ' + quoteData.clientName + '\n';
    text += 'Total: $' + (quoteData.totalIncGst || 0).toFixed(2) + '\n\n';
    text += 'Generated with TicTacStick';

    return share({
      title: 'Quote - ' + quoteData.quoteTitle,
      text: text,
      dialogTitle: 'Share Quote'
    });
  }

  // ============================================
  // BROWSER / EXTERNAL LINKS
  // ============================================

  /**
   * Open external URL in system browser
   * @param {string} url - URL to open
   */
  function openURL(url) {
    if (!window.Capacitor.Plugins.Browser) {
      // Fallback to regular window.open
      window.open(url, '_blank');
      return Promise.resolve();
    }

    return window.Capacitor.Plugins.Browser.open({ url: url })
      .then(function() {
        console.log('[NATIVE] Opened URL:', url);
      })
      .catch(function(error) {
        console.error('[NATIVE] Open URL error:', error);
        // Fallback
        window.open(url, '_blank');
      });
  }

  // ============================================
  // HAPTICS (VIBRATION FEEDBACK)
  // ============================================

  /**
   * Provide haptic feedback
   * @param {string} type - Type of haptic: 'light', 'medium', 'heavy'
   */
  function haptic(type) {
    if (!window.Capacitor.Plugins.Haptics) {
      return;
    }

    var style = type || 'medium';

    try {
      window.Capacitor.Plugins.Haptics.impact({ style: style });
    } catch (error) {
      console.error('[NATIVE] Haptic error:', error);
    }
  }

  /**
   * Haptic feedback for button tap
   */
  function hapticLight() {
    haptic('light');
  }

  /**
   * Haptic feedback for success
   */
  function hapticMedium() {
    haptic('medium');
  }

  /**
   * Haptic feedback for error
   */
  function hapticHeavy() {
    haptic('heavy');
  }

  /**
   * Haptic notification
   * @param {string} type - 'success', 'warning', or 'error'
   */
  function hapticNotification(type) {
    if (!window.Capacitor.Plugins.Haptics) {
      return;
    }

    var notificationType = type || 'success';

    try {
      window.Capacitor.Plugins.Haptics.notification({ type: notificationType });
    } catch (error) {
      console.error('[NATIVE] Haptic notification error:', error);
    }
  }

  // ============================================
  // APP INFORMATION
  // ============================================

  /**
   * Get app information
   * @returns {Promise<Object>} App info object
   */
  function getAppInfo() {
    if (!window.Capacitor.Plugins.App) {
      return Promise.resolve({
        name: 'TicTacStick',
        version: '1.8.0',
        build: '1',
        platform: 'web'
      });
    }

    return window.Capacitor.Plugins.App.getInfo()
      .then(function(info) {
        return {
          name: info.name,
          version: info.version,
          build: info.build,
          platform: getPlatform()
        };
      })
      .catch(function(error) {
        console.error('[NATIVE] Get app info error:', error);
        return {
          name: 'TicTacStick',
          version: 'unknown',
          build: 'unknown',
          platform: getPlatform()
        };
      });
  }

  // ============================================
  // ACTION SHEET (NATIVE MENUS)
  // ============================================

  /**
   * Show native action sheet
   * @param {Object} options - Action sheet options
   * @param {string} options.title - Sheet title
   * @param {string} options.message - Sheet message
   * @param {Array<string>} options.options - Array of option labels
   * @returns {Promise<number>} Index of selected option
   */
  function showActionSheet(options) {
    if (!window.Capacitor.Plugins.ActionSheet) {
      // Fallback to confirm dialog
      var choice = confirm(options.title + '\n' + options.message);
      return Promise.resolve(choice ? 0 : -1);
    }

    return window.Capacitor.Plugins.ActionSheet.showActions({
      title: options.title || '',
      message: options.message || '',
      options: options.options || []
    })
      .then(function(result) {
        return result.index;
      })
      .catch(function(error) {
        console.error('[NATIVE] Action sheet error:', error);
        return -1;
      });
  }

  // ============================================
  // NETWORK STATUS
  // ============================================

  /**
   * Get network status
   * @returns {Promise<Object>} Network status object
   */
  function getNetworkStatus() {
    if (!window.Capacitor.Plugins.Network) {
      return Promise.resolve({
        connected: navigator.onLine,
        connectionType: 'unknown'
      });
    }

    return window.Capacitor.Plugins.Network.getStatus()
      .then(function(status) {
        return {
          connected: status.connected,
          connectionType: status.connectionType
        };
      })
      .catch(function(error) {
        console.error('[NATIVE] Get network status error:', error);
        return {
          connected: navigator.onLine,
          connectionType: 'unknown'
        };
      });
  }

  /**
   * Add network change listener
   * @param {Function} callback - Callback function(status)
   */
  function addNetworkListener(callback) {
    if (!window.Capacitor.Plugins.Network) {
      // Fallback to online/offline events
      window.addEventListener('online', function() {
        callback({ connected: true, connectionType: 'unknown' });
      });
      window.addEventListener('offline', function() {
        callback({ connected: false, connectionType: 'none' });
      });
      return;
    }

    window.Capacitor.Plugins.Network.addListener('networkStatusChange', callback);
  }

  // ============================================
  // MODULE REGISTRATION
  // ============================================

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('nativeFeatures', {
      isNative: isNative,
      getPlatform: getPlatform,
      init: init,
      share: share,
      shareQuote: shareQuote,
      openURL: openURL,
      haptic: haptic,
      getAppInfo: getAppInfo,
      showActionSheet: showActionSheet,
      getNetworkStatus: getNetworkStatus
    });
  }

  // Global API
  window.NativeFeatures = {
    isNative: isNative,
    getPlatform: getPlatform,
    isIOS: isIOS,
    isAndroid: isAndroid,
    init: init,
    share: share,
    shareQuote: shareQuote,
    openURL: openURL,
    haptic: haptic,
    hapticLight: hapticLight,
    hapticMedium: hapticMedium,
    hapticHeavy: hapticHeavy,
    hapticNotification: hapticNotification,
    getAppInfo: getAppInfo,
    showActionSheet: showActionSheet,
    getNetworkStatus: getNetworkStatus,
    addNetworkListener: addNetworkListener
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('[NATIVE-FEATURES] Module loaded');
})();
