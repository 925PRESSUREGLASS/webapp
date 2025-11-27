/**
 * Notifications Composable
 * Provides unified notification system for web and mobile (Capacitor)
 * 
 * Features:
 * - Browser Notification API support
 * - In-app toast notifications via Quasar
 * - Capacitor Push Notifications (when available)
 * - Notification history/queue management
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';

// ============================================
// Types
// ============================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    route?: string;
    callback?: () => void;
  };
}

export interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  message: string;
  timeout?: number;
  action?: AppNotification['action'];
  playSound?: boolean;
  browserNotification?: boolean;
}

// ============================================
// Constants
// ============================================

const NOTIFICATION_STORAGE_KEY = 'tts-notifications-v2';
const MAX_NOTIFICATIONS = 50;
const DEFAULT_TIMEOUT = 5000;

// ============================================
// Composable
// ============================================

export function useNotifications() {
  const $q = useQuasar();
  
  // State
  const notifications = ref<AppNotification[]>([]);
  const browserPermission = ref<NotificationPermission>('default');
  const isCapacitorAvailable = ref(false);

  // ============================================
  // Browser Notifications
  // ============================================

  /**
   * Check if browser notifications are supported
   */
  function isBrowserNotificationsSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Request browser notification permission
   */
  async function requestBrowserPermission(): Promise<boolean> {
    if (!isBrowserNotificationsSupported()) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      browserPermission.value = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to request permission:', error);
      return false;
    }
  }

  /**
   * Show browser notification
   */
  function showBrowserNotification(title: string, message: string, options?: NotificationOptions): void {
    if (!isBrowserNotificationsSupported() || browserPermission.value !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/icons/icon-128x128.png',
        badge: '/icons/icon-72x72.png',
        tag: 'tictacstick',
        renotify: true,
      });

      // Auto close after timeout
      setTimeout(() => notification.close(), options?.timeout || DEFAULT_TIMEOUT);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options?.action?.callback) {
          options.action.callback();
        }
      };
    } catch (error) {
      console.error('[NOTIFICATIONS] Failed to show browser notification:', error);
    }
  }

  // ============================================
  // In-App Notifications
  // ============================================

  /**
   * Show toast notification
   */
  function showToast(options: NotificationOptions): void {
    const colorMap: Record<NotificationType, string> = {
      info: 'info',
      success: 'positive',
      warning: 'warning',
      error: 'negative',
    };

    $q.notify({
      type: colorMap[options.type || 'info'],
      message: options.message,
      caption: options.title,
      position: 'bottom-right',
      timeout: options.timeout || DEFAULT_TIMEOUT,
      actions: options.action ? [
        {
          label: options.action.label,
          color: 'white',
          handler: options.action.callback,
        },
      ] : undefined,
    });
  }

  /**
   * Add notification to history
   */
  function addToHistory(options: NotificationOptions): AppNotification {
    const notification: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: options.type || 'info',
      title: options.title || '',
      message: options.message,
      timestamp: new Date().toISOString(),
      read: false,
      action: options.action,
    };

    notifications.value.unshift(notification);

    // Limit notifications
    if (notifications.value.length > MAX_NOTIFICATIONS) {
      notifications.value = notifications.value.slice(0, MAX_NOTIFICATIONS);
    }

    saveNotifications();
    return notification;
  }

  // ============================================
  // Main API
  // ============================================

  /**
   * Send notification (both in-app and browser if enabled)
   */
  function notify(options: NotificationOptions): AppNotification {
    // Show toast
    showToast(options);

    // Show browser notification if requested
    if (options.browserNotification && browserPermission.value === 'granted') {
      showBrowserNotification(options.title || 'TicTacStick', options.message, options);
    }

    // Add to history
    return addToHistory(options);
  }

  /**
   * Send success notification
   */
  function success(message: string, title?: string): AppNotification {
    return notify({ type: 'success', message, title });
  }

  /**
   * Send error notification
   */
  function error(message: string, title?: string): AppNotification {
    return notify({ type: 'error', message, title, timeout: 8000 });
  }

  /**
   * Send warning notification
   */
  function warning(message: string, title?: string): AppNotification {
    return notify({ type: 'warning', message, title });
  }

  /**
   * Send info notification
   */
  function info(message: string, title?: string): AppNotification {
    return notify({ type: 'info', message, title });
  }

  // ============================================
  // History Management
  // ============================================

  /**
   * Mark notification as read
   */
  function markAsRead(id: string): void {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      saveNotifications();
    }
  }

  /**
   * Mark all notifications as read
   */
  function markAllAsRead(): void {
    notifications.value.forEach(n => n.read = true);
    saveNotifications();
  }

  /**
   * Remove notification from history
   */
  function remove(id: string): void {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
      saveNotifications();
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll(): void {
    notifications.value = [];
    saveNotifications();
  }

  // ============================================
  // Persistence
  // ============================================

  function saveNotifications(): void {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications.value));
    } catch (e) {
      console.error('[NOTIFICATIONS] Failed to save:', e);
    }
  }

  function loadNotifications(): void {
    try {
      const saved = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (saved) {
        notifications.value = JSON.parse(saved);
      }
    } catch (e) {
      console.error('[NOTIFICATIONS] Failed to load:', e);
    }
  }

  // ============================================
  // Capacitor Integration (stub for future)
  // ============================================

  function checkCapacitor(): void {
    // Check if Capacitor is available
    isCapacitorAvailable.value = typeof (window as any).Capacitor !== 'undefined' &&
      (window as any).Capacitor.Plugins?.PushNotifications;
  }

  // ============================================
  // Scheduled Notifications
  // ============================================

  /**
   * Schedule a notification (for reminders, follow-ups)
   */
  function scheduleNotification(options: NotificationOptions, delayMs: number): number {
    const timerId = window.setTimeout(() => {
      notify({ ...options, browserNotification: true });
    }, delayMs);

    return timerId;
  }

  /**
   * Cancel a scheduled notification
   */
  function cancelScheduledNotification(timerId: number): void {
    window.clearTimeout(timerId);
  }

  // ============================================
  // Computed Properties
  // ============================================

  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  );

  const hasUnread = computed(() => unreadCount.value > 0);

  const recentNotifications = computed(() => 
    notifications.value.slice(0, 10)
  );

  // ============================================
  // Lifecycle
  // ============================================

  function initialize(): void {
    loadNotifications();
    checkCapacitor();

    // Check browser permission
    if (isBrowserNotificationsSupported()) {
      browserPermission.value = Notification.permission;
    }
  }

  // ============================================
  // Return
  // ============================================

  return {
    // State
    notifications: computed(() => notifications.value),
    unreadCount,
    hasUnread,
    recentNotifications,
    browserPermission: computed(() => browserPermission.value),
    isCapacitorAvailable: computed(() => isCapacitorAvailable.value),

    // Browser permissions
    isBrowserNotificationsSupported,
    requestBrowserPermission,

    // Main notification methods
    notify,
    success,
    error,
    warning,
    info,

    // History management
    markAsRead,
    markAllAsRead,
    remove,
    clearAll,

    // Scheduling
    scheduleNotification,
    cancelScheduledNotification,

    // Initialization
    initialize,
  };
}
