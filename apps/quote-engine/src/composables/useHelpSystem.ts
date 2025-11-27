/**
 * Help System Composable
 * Provides contextual help, tooltips, and documentation
 */

import { ref, computed } from 'vue';

export interface HelpTopic {
  id: string;
  title: string;
  content: string;
  tip?: string;
  example?: string;
  icon?: string;
  video?: string;
  link?: string;
  formula?: string;
}

// Help content database
const helpTopics: Record<string, HelpTopic> = {
  // Quote Related
  'new-quote': {
    id: 'new-quote',
    title: 'Create New Quote',
    content:
      'Start a new quote with our guided wizard. We will help you calculate pricing automatically based on industry standards.',
    tip: 'Pro tip: Use the wizard for fastest and most accurate quotes!',
    icon: '📝',
  },
  'quote-wizard': {
    id: 'quote-wizard',
    title: 'Quote Wizard',
    content:
      'Answer these simple questions to automatically calculate pricing. All factors like difficulty, access, and conditions are considered in the final price.',
    tip: 'Be accurate with measurements for better pricing!',
    example: 'Count all window panes carefully, including hard-to-see skylights.',
  },
  'window-types': {
    id: 'window-types',
    title: 'Window Types',
    content:
      'Select the type of window to get accurate pricing. Different window types have different cleaning times and difficulty levels.',
    example:
      'Standard windows are typical residential windows. French windows have multiple panes. Skylights require special access.',
  },
  'pressure-surfaces': {
    id: 'pressure-surfaces',
    title: 'Pressure Cleaning Surfaces',
    content:
      'Choose the surface type for accurate pressure cleaning quotes. Different surfaces require different cleaning approaches and times.',
    example:
      'Concrete driveways, timber decks, and pavers all have different cleaning requirements.',
  },
  'conditions': {
    id: 'conditions',
    title: 'Surface Conditions',
    content:
      'Adjust pricing based on how dirty the surface is. Heavier soiling takes more time and effort.',
    example: 'Light = regular maintenance, Heavy = years of buildup, Extreme = requires special treatment',
  },
  'access-modifiers': {
    id: 'access-modifiers',
    title: 'Access Difficulty',
    content:
      'Factor in how easy or hard it is to reach the work area. Difficult access means more time and equipment.',
    example: 'Easy = ground level, Normal = standard access, Difficult = obstacles, Restricted = tight spaces',
  },
  'high-reach': {
    id: 'high-reach',
    title: 'High Reach Work',
    content:
      'Additional charge for windows requiring ladders, scaffolding, or special equipment. Compensates for extra time, difficulty, and safety risk.',
    example: 'Typical modifier: 40-80% extra',
    tip: 'Always assess safety requirements before quoting',
  },

  // Pricing Related
  'gst-calculation': {
    id: 'gst-calculation',
    title: 'GST (Goods & Services Tax)',
    content:
      'GST (10%) is automatically calculated and shown separately on quotes and invoices. This is required for tax compliance in Australia.',
    formula: 'Total = Subtotal + (Subtotal × 0.10)',
    link: 'https://www.ato.gov.au/Business/GST/',
  },
  'base-fee': {
    id: 'base-fee',
    title: 'Base Callout Fee',
    content:
      'A fixed charge covering travel time, fuel, and initial setup. This fee is applied once per job regardless of job size.',
    example: 'Typical range: $100-$150',
    tip: 'Factor in your average travel distance and vehicle costs',
  },
  'hourly-rate': {
    id: 'hourly-rate',
    title: 'Hourly Rate',
    content: 'Your labour charge per hour. This converts estimated time into dollar amounts for the quote.',
    formula: 'Labour Cost = Hours × Hourly Rate',
    tip: 'Consider your skill level, equipment costs, and market rates',
  },
  'minimum-job': {
    id: 'minimum-job',
    title: 'Minimum Job Charge',
    content: 'The lowest amount you will accept for any job. Prevents unprofitable small jobs.',
    example: 'Common minimum: $150-$250',
    tip: 'Should cover your base fee plus at least 30 minutes of labour',
  },

  // Client Related
  'client-source': {
    id: 'client-source',
    title: 'Client Source',
    content:
      'Track where clients come from to measure marketing effectiveness. This helps you know which channels work best for your business.',
    example: 'Examples: Website, Google, Facebook, Referral, Repeat Client',
  },
  'client-vip': {
    id: 'client-vip',
    title: 'VIP Clients',
    content:
      'Mark your best clients as VIP for priority treatment. VIP clients get loyalty discounts, priority scheduling, and personalized service.',
    tip: 'Your top 20% of clients often generate 80% of revenue!',
    icon: '⭐',
  },

  // Invoice Related
  'invoice-payment-terms': {
    id: 'invoice-payment-terms',
    title: 'Payment Terms',
    content:
      'Set clear payment expectations: when payment is due and accepted methods. Standard terms are 7-14 days from invoice date.',
    example: 'Common terms: Due on receipt, Net 7, Net 14, Net 30',
    tip: 'Faster payment terms = better cash flow!',
  },
  'invoice-status': {
    id: 'invoice-status',
    title: 'Invoice Status',
    content:
      'Track the lifecycle of your invoices from draft to paid. Overdue invoices are highlighted for follow-up.',
    example: 'Draft → Sent → Viewed → Paid (or Overdue)',
  },
  'quote-expiry': {
    id: 'quote-expiry',
    title: 'Quote Expiry Date',
    content:
      'Quotes are valid for a limited time (default 30 days). This creates urgency and protects you from price changes.',
    tip: 'Use expiry as a gentle closing tool in follow-ups',
  },

  // Analytics Related
  'conversion-rate': {
    id: 'conversion-rate',
    title: 'Conversion Rate',
    content:
      'Percentage of sent quotes that get accepted. Industry average is 30-40%. Higher is better!',
    formula: '(Accepted Quotes ÷ Sent Quotes) × 100%',
    tip: 'Improve conversion with quick follow-ups and professional presentation',
    icon: '📈',
  },
  'analytics': {
    id: 'analytics',
    title: 'Analytics Dashboard',
    content:
      'Track key business metrics: revenue trends, quote conversion rates, top clients, and seasonal patterns.',
    icon: '📊',
    tip: 'Review analytics weekly to spot trends and opportunities',
  },

  // System Related
  'offline-mode': {
    id: 'offline-mode',
    title: 'Offline Mode',
    content:
      'TicTacStick works completely offline! Create quotes without internet. Everything syncs automatically when you are back online.',
    icon: '✈️',
    tip: 'Perfect for field work where internet is unreliable!',
  },
  'keyboard-shortcuts': {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: 'Power users can use keyboard shortcuts for faster navigation and actions.',
    tip: 'Press Shift+? to see all available shortcuts',
    icon: '⌨️',
  },
  'data-backup': {
    id: 'data-backup',
    title: 'Data Backup',
    content:
      'Your data is stored locally and can be exported for backup. Regular exports protect against data loss.',
    tip: 'Export your data weekly to a safe location',
    icon: '💾',
  },
};

export function useHelpSystem() {
  const currentTopic = ref<HelpTopic | null>(null);
  const isVisible = ref(false);
  const searchQuery = ref('');

  // Get all topics as array
  const allTopics = computed(() => Object.values(helpTopics));

  // Search topics
  const searchResults = computed(() => {
    if (!searchQuery.value.trim()) {
      return allTopics.value;
    }

    const query = searchQuery.value.toLowerCase();
    return allTopics.value.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query) ||
        (topic.tip && topic.tip.toLowerCase().includes(query)) ||
        (topic.example && topic.example.toLowerCase().includes(query))
    );
  });

  // Get topic by ID
  function getTopic(id: string): HelpTopic | null {
    return helpTopics[id] || null;
  }

  // Show help for a specific topic
  function showTopic(id: string): void {
    const topic = getTopic(id);
    if (topic) {
      currentTopic.value = topic;
      isVisible.value = true;
    }
  }

  // Show help modal
  function show(): void {
    isVisible.value = true;
  }

  // Hide help modal
  function hide(): void {
    isVisible.value = false;
    currentTopic.value = null;
  }

  // Get topics by category
  function getTopicsByCategory(): Record<string, HelpTopic[]> {
    return {
      quote: allTopics.value.filter((t) =>
        ['new-quote', 'quote-wizard', 'window-types', 'pressure-surfaces', 'conditions', 'access-modifiers', 'high-reach'].includes(t.id)
      ),
      pricing: allTopics.value.filter((t) =>
        ['gst-calculation', 'base-fee', 'hourly-rate', 'minimum-job'].includes(t.id)
      ),
      client: allTopics.value.filter((t) => ['client-source', 'client-vip'].includes(t.id)),
      invoice: allTopics.value.filter((t) =>
        ['invoice-payment-terms', 'invoice-status', 'quote-expiry'].includes(t.id)
      ),
      analytics: allTopics.value.filter((t) => ['conversion-rate', 'analytics'].includes(t.id)),
      system: allTopics.value.filter((t) =>
        ['offline-mode', 'keyboard-shortcuts', 'data-backup'].includes(t.id)
      ),
    };
  }

  // Generate tooltip content for a topic
  function getTooltip(id: string): string {
    const topic = getTopic(id);
    if (!topic) return '';

    let tooltip = topic.content;
    if (topic.tip) {
      tooltip += `\n\n💡 ${topic.tip}`;
    }
    return tooltip;
  }

  return {
    currentTopic,
    isVisible,
    searchQuery,
    allTopics,
    searchResults,
    getTopic,
    showTopic,
    show,
    hide,
    getTopicsByCategory,
    getTooltip,
  };
}

// Export topics for use in components
export { helpTopics };
export type { HelpTopic };
