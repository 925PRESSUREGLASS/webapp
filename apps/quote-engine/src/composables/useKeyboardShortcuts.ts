/**
 * Keyboard Shortcuts Composable
 * Provides global keyboard shortcuts for power users
 * Mac Cmd / Windows Ctrl compatible
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuoteStore } from '../stores/quote';
import { useQuasar } from 'quasar';

export interface Shortcut {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  category: 'navigation' | 'quote' | 'general';
  action: () => void;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const quoteStore = useQuoteStore();
  const $q = useQuasar();

  const isEnabled = ref(true);
  const showHelp = ref(false);

  // Define all shortcuts
  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      id: 'newQuote',
      key: 'n',
      ctrl: true,
      description: 'Create new quote',
      category: 'navigation',
      action: () => {
        quoteStore.resetQuote();
        router.push('/');
      },
    },
    {
      id: 'savedQuotes',
      key: 'q',
      ctrl: true,
      description: 'Open saved quotes',
      category: 'navigation',
      action: () => router.push('/quotes'),
    },
    {
      id: 'invoices',
      key: 'i',
      ctrl: true,
      description: 'Open invoices',
      category: 'navigation',
      action: () => router.push('/invoices'),
    },
    {
      id: 'clients',
      key: 'd',
      ctrl: true,
      description: 'Open clients',
      category: 'navigation',
      action: () => router.push('/clients'),
    },
    {
      id: 'analytics',
      key: 'a',
      ctrl: true,
      shift: true,
      description: 'Open analytics',
      category: 'navigation',
      action: () => router.push('/analytics'),
    },
    {
      id: 'settings',
      key: ',',
      ctrl: true,
      description: 'Open settings',
      category: 'navigation',
      action: () => router.push('/settings'),
    },

    // Quote shortcuts
    {
      id: 'addWindow',
      key: 'w',
      ctrl: true,
      description: 'Add window line',
      category: 'quote',
      action: () => {
        if (router.currentRoute.value.path === '/') {
          quoteStore.addWindowLine({
            windowType: 'standard',
            panes: 1,
            condition: 'normal',
            access: 'normal',
            highReach: false,
          });
          $q.notify({
            type: 'positive',
            message: 'Window line added',
            position: 'bottom',
            timeout: 1000,
          });
        }
      },
    },
    {
      id: 'addPressure',
      key: 'p',
      ctrl: true,
      description: 'Add pressure line',
      category: 'quote',
      action: () => {
        if (router.currentRoute.value.path === '/') {
          quoteStore.addPressureLine({
            surfaceType: 'driveway_concrete',
            area: 10,
            condition: 'normal',
          });
          $q.notify({
            type: 'positive',
            message: 'Pressure line added',
            position: 'bottom',
            timeout: 1000,
          });
        }
      },
    },
    {
      id: 'saveQuote',
      key: 's',
      ctrl: true,
      description: 'Save current quote',
      category: 'quote',
      action: () => {
        if (router.currentRoute.value.path === '/') {
          // Trigger save via event
          window.dispatchEvent(new CustomEvent('tts:save-quote'));
          $q.notify({
            type: 'positive',
            message: 'Quote saved',
            position: 'bottom',
            timeout: 1000,
          });
        }
      },
    },
    {
      id: 'undo',
      key: 'z',
      ctrl: true,
      description: 'Undo last action',
      category: 'quote',
      action: () => {
        if (quoteStore.canUndo) {
          quoteStore.undo();
          $q.notify({
            type: 'info',
            message: 'Undone',
            position: 'bottom',
            timeout: 1000,
          });
        }
      },
    },
    {
      id: 'redo',
      key: 'z',
      ctrl: true,
      shift: true,
      description: 'Redo last action',
      category: 'quote',
      action: () => {
        if (quoteStore.canRedo) {
          quoteStore.redo();
          $q.notify({
            type: 'info',
            message: 'Redone',
            position: 'bottom',
            timeout: 1000,
          });
        }
      },
    },
    {
      id: 'redoAlt',
      key: 'y',
      ctrl: true,
      description: 'Redo last action (alt)',
      category: 'quote',
      action: () => {
        if (quoteStore.canRedo) {
          quoteStore.redo();
          $q.notify({
            type: 'info',
            message: 'Redone',
            position: 'bottom',
            timeout: 1000,
          });
        }
      },
    },

    // General shortcuts
    {
      id: 'help',
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: () => {
        showHelp.value = true;
      },
    },
    {
      id: 'escape',
      key: 'Escape',
      description: 'Close dialogs / Cancel',
      category: 'general',
      action: () => {
        showHelp.value = false;
        // Close any open dialogs
        window.dispatchEvent(new CustomEvent('tts:escape'));
      },
    },
  ];

  // Check if element is an input
  function isInputElement(element: Element | null): boolean {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      (element as HTMLElement).isContentEditable
    );
  }

  // Handle keydown
  function handleKeydown(event: KeyboardEvent): void {
    if (!isEnabled.value) return;

    const key = event.key.toLowerCase();
    const ctrl = event.ctrlKey || event.metaKey; // metaKey for Mac Cmd
    const shift = event.shiftKey;
    const alt = event.altKey;

    // Allow Escape to always work
    if (key === 'escape') {
      const shortcut = shortcuts.find((s) => s.key === 'Escape');
      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
      return;
    }

    // Don't intercept shortcuts when typing in inputs (except for special combos)
    if (isInputElement(document.activeElement)) {
      // Allow Ctrl+S to save even in inputs
      if (ctrl && key === 's') {
        event.preventDefault();
        const shortcut = shortcuts.find((s) => s.id === 'saveQuote');
        if (shortcut) shortcut.action();
      }
      return;
    }

    // Find matching shortcut
    for (const shortcut of shortcuts) {
      const matchKey = shortcut.key.toLowerCase() === key;
      const matchCtrl = !!shortcut.ctrl === ctrl;
      const matchShift = !!shortcut.shift === shift;
      const matchAlt = !!shortcut.alt === alt;

      if (matchKey && matchCtrl && matchShift && matchAlt) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  // Get shortcuts grouped by category
  function getShortcutsByCategory(): Record<string, Shortcut[]> {
    const categories: Record<string, Shortcut[]> = {
      navigation: [],
      quote: [],
      general: [],
    };

    for (const shortcut of shortcuts) {
      if (shortcut.id !== 'escape' && shortcut.id !== 'redoAlt') {
        categories[shortcut.category].push(shortcut);
      }
    }

    return categories;
  }

  // Format shortcut for display
  function formatShortcut(shortcut: Shortcut): string {
    const parts: string[] = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
    if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
    if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');

    // Format key
    let keyDisplay = shortcut.key.toUpperCase();
    if (shortcut.key === 'Escape') keyDisplay = 'Esc';
    if (shortcut.key === ',') keyDisplay = ',';
    if (shortcut.key === '?') keyDisplay = '?';

    parts.push(keyDisplay);

    return parts.join(isMac ? '' : '+');
  }

  // Enable/disable shortcuts
  function enable(): void {
    isEnabled.value = true;
  }

  function disable(): void {
    isEnabled.value = false;
  }

  // Setup and cleanup
  onMounted(() => {
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown);
  });

  return {
    shortcuts,
    isEnabled,
    showHelp,
    getShortcutsByCategory,
    formatShortcut,
    enable,
    disable,
  };
}
