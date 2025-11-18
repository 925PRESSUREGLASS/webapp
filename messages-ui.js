// messages-ui.js - Messages Dashboard UI Controller
// Dependencies: communication-manager.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  /**
   * Initialize messages dashboard
   */
  function init() {
    console.log('[MESSAGES-UI] Initializing...');

    // Update unread count on load
    updateUnreadBanner();

    // Check if messages container exists
    var messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      // Initialize but don't load until toggled
      console.log('[MESSAGES-UI] Messages panel ready');
    }

    // Check if on messages page (for future multi-page support)
    if (document.getElementById('page-messages')) {
      loadMessages();
    }

    console.log('[MESSAGES-UI] Initialized');
  }

  /**
   * Toggle messages view visibility
   */
  function toggleMessagesView() {
    var container = document.getElementById('messagesContainer');
    var btn = document.getElementById('viewMessagesBtn');

    if (!container || !btn) {
      return;
    }

    if (container.style.display === 'none') {
      // Show and load messages
      container.style.display = 'block';
      btn.textContent = 'Hide Messages';
      loadMessages();
    } else {
      // Hide
      container.style.display = 'none';
      btn.textContent = 'View Messages';
    }
  }

  /**
   * Load and display messages
   */
  function loadMessages() {
    if (!window.CommunicationManager) {
      console.error('[MESSAGES-UI] CommunicationManager not available');
      return;
    }

    var messages = window.CommunicationManager.getRecentMessages(100);

    // Apply filters
    messages = applyFilters(messages);

    renderMessageList(messages);
    updateUnreadBanner();
  }

  /**
   * Apply filters to message list
   */
  function applyFilters(messages) {
    var typeFilterEl = document.getElementById('message-type-filter');
    var directionFilterEl = document.getElementById('message-direction-filter');
    var searchEl = document.getElementById('message-search');

    if (!typeFilterEl || !directionFilterEl || !searchEl) {
      return messages;
    }

    var typeFilter = typeFilterEl.value;
    var directionFilter = directionFilterEl.value;
    var searchQuery = searchEl.value.toLowerCase();

    var filtered = [];

    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];

      // Type filter
      if (typeFilter !== 'all' && msg.type !== typeFilter) {
        continue;
      }

      // Direction filter
      if (directionFilter !== 'all' && msg.direction !== directionFilter) {
        continue;
      }

      // Search filter
      if (searchQuery) {
        var searchableText = (msg.message || '').toLowerCase() +
                            (msg.subject || '').toLowerCase();
        if (searchableText.indexOf(searchQuery) === -1) {
          continue;
        }
      }

      filtered.push(msg);
    }

    return filtered;
  }

  /**
   * Render message list
   */
  function renderMessageList(messages) {
    var listContainer = document.getElementById('message-list');
    var emptyState = document.getElementById('messages-empty-state');

    if (!listContainer || !emptyState) {
      return;
    }

    if (messages.length === 0) {
      listContainer.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    listContainer.style.display = 'block';
    emptyState.style.display = 'none';
    listContainer.innerHTML = '';

    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      var messageCard = createMessageCard(message);
      listContainer.appendChild(messageCard);
    }
  }

  /**
   * Create message card element
   */
  function createMessageCard(message) {
    var card = document.createElement('div');
    card.className = 'card message-card';

    if (message.direction === 'inbound' && !message.read) {
      card.className += ' message-unread';
    }

    var directionIcon = message.direction === 'inbound' ? '←' : '→';
    var directionClass = message.direction === 'inbound' ? 'message-inbound' : 'message-outbound';
    var typeIcon = message.type === 'sms' ? '💬' : '📧';

    var timestamp = new Date(message.timestamp).toLocaleString();

    var content = message.message || '';
    if (content.length > 200) {
      content = content.substring(0, 200) + '...';
    }

    // Sanitize content for display
    if (window.Security && window.Security.escapeHTML) {
      content = window.Security.escapeHTML(content);
    }

    var cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Message header
    var header = document.createElement('div');
    header.className = 'message-header';

    var meta = document.createElement('div');
    meta.className = 'message-meta';

    var typeIconSpan = document.createElement('span');
    typeIconSpan.className = 'message-type-icon';
    typeIconSpan.textContent = typeIcon;

    var directionSpan = document.createElement('span');
    directionSpan.className = 'message-direction ' + directionClass;
    directionSpan.textContent = directionIcon;

    var typeSpan = document.createElement('span');
    typeSpan.className = 'message-type';
    typeSpan.textContent = message.type.toUpperCase();

    meta.appendChild(typeIconSpan);
    meta.appendChild(directionSpan);
    meta.appendChild(typeSpan);

    var timestampDiv = document.createElement('div');
    timestampDiv.className = 'message-timestamp';
    timestampDiv.textContent = timestamp;

    header.appendChild(meta);
    header.appendChild(timestampDiv);

    cardBody.appendChild(header);

    // Subject (if email)
    if (message.subject) {
      var subjectDiv = document.createElement('div');
      subjectDiv.className = 'message-subject';
      if (window.Security && window.Security.escapeHTML) {
        subjectDiv.textContent = message.subject;
      } else {
        subjectDiv.textContent = message.subject;
      }
      cardBody.appendChild(subjectDiv);
    }

    // Content
    var contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;
    cardBody.appendChild(contentDiv);

    // Actions
    var actions = document.createElement('div');
    actions.className = 'message-actions';

    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-tertiary btn-sm';
    viewBtn.textContent = 'View Details';
    viewBtn.onclick = function() {
      viewMessage(message.ghlMessageId || message.timestamp);
    };
    actions.appendChild(viewBtn);

    if (message.direction === 'inbound' && !message.read) {
      var readBtn = document.createElement('button');
      readBtn.className = 'btn btn-secondary btn-sm';
      readBtn.textContent = 'Mark Read';
      readBtn.onclick = function() {
        markMessageAsRead(message.ghlMessageId);
      };
      actions.appendChild(readBtn);
    }

    cardBody.appendChild(actions);
    card.appendChild(cardBody);

    return card;
  }

  /**
   * Update unread banner
   */
  function updateUnreadBanner() {
    if (!window.CommunicationManager) {
      return;
    }

    var unreadCount = window.CommunicationManager.getUnreadCount();
    var banner = document.getElementById('unread-banner');
    var countEl = document.getElementById('unread-count');

    if (!banner || !countEl) {
      return;
    }

    if (unreadCount > 0) {
      banner.style.display = 'block';
      countEl.textContent = unreadCount;
    } else {
      banner.style.display = 'none';
    }
  }

  /**
   * View message details (modal)
   */
  function viewMessage(messageId) {
    console.log('[MESSAGES-UI] View message:', messageId);

    // Get message from history
    if (!window.CommunicationManager) {
      return;
    }

    var history = window.CommunicationManager.getMessageHistory();
    var message = null;

    for (var i = 0; i < history.length; i++) {
      if (history[i].ghlMessageId === messageId || history[i].timestamp === messageId) {
        message = history[i];
        break;
      }
    }

    if (!message) {
      console.error('[MESSAGES-UI] Message not found:', messageId);
      return;
    }

    // Show in modal
    showMessageModal(message);
  }

  /**
   * Show message in modal
   */
  function showMessageModal(message) {
    // Create modal
    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';

    var modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.maxWidth = '800px';

    // Header
    var header = document.createElement('div');
    header.className = 'modal-header';

    var title = document.createElement('h3');
    title.textContent = 'Message Details';
    header.appendChild(title);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = function() {
      document.body.removeChild(modal);
    };
    header.appendChild(closeBtn);

    modalContent.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'modal-body';

    // Message details
    var details = document.createElement('div');
    details.style.marginBottom = '1rem';

    var typeIcon = message.type === 'sms' ? '💬' : '📧';
    var directionIcon = message.direction === 'inbound' ? '←' : '→';

    details.innerHTML = '<p><strong>Type:</strong> ' + typeIcon + ' ' + message.type.toUpperCase() + '</p>' +
                       '<p><strong>Direction:</strong> ' + directionIcon + ' ' + message.direction + '</p>' +
                       '<p><strong>Timestamp:</strong> ' + new Date(message.timestamp).toLocaleString() + '</p>' +
                       '<p><strong>Status:</strong> ' + (message.status || 'unknown') + '</p>';

    if (message.subject) {
      details.innerHTML += '<p><strong>Subject:</strong> ' + (window.Security ? window.Security.escapeHTML(message.subject) : message.subject) + '</p>';
    }

    body.appendChild(details);

    // Message content
    var contentDiv = document.createElement('div');
    contentDiv.style.background = '#f9fafb';
    contentDiv.style.padding = '1rem';
    contentDiv.style.borderRadius = '8px';
    contentDiv.style.whiteSpace = 'pre-wrap';
    contentDiv.style.wordWrap = 'break-word';

    if (message.type === 'email' && message.message && message.message.indexOf('<html') !== -1) {
      // Render HTML email
      contentDiv.innerHTML = message.message;
    } else {
      contentDiv.textContent = message.message || 'No content';
    }

    body.appendChild(contentDiv);

    modalContent.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'modal-footer';

    var closeFooterBtn = document.createElement('button');
    closeFooterBtn.className = 'btn btn-secondary';
    closeFooterBtn.textContent = 'Close';
    closeFooterBtn.onclick = function() {
      document.body.removeChild(modal);
    };
    footer.appendChild(closeFooterBtn);

    modalContent.appendChild(footer);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  }

  /**
   * Mark message as read
   */
  function markMessageAsRead(messageId) {
    if (!window.CommunicationManager) {
      return;
    }

    window.CommunicationManager.markAsRead(messageId);
    loadMessages();

    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast('Message marked as read', 'success');
    } else if (window.showToast) {
      window.showToast('Message marked as read', 'success');
    }
  }

  /**
   * Mark all as read
   */
  function markAllAsRead() {
    if (!window.CommunicationManager) {
      return;
    }

    var messages = window.CommunicationManager.getMessageHistory();

    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      if (msg.direction === 'inbound' && msg.ghlMessageId && !msg.read) {
        window.CommunicationManager.markAsRead(msg.ghlMessageId);
      }
    }

    loadMessages();

    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast('All messages marked as read', 'success');
    } else if (window.showToast) {
      window.showToast('All messages marked as read', 'success');
    }
  }

  /**
   * Show new message modal
   */
  function showNewMessageModal() {
    console.log('[MESSAGES-UI] New message modal');

    // Would show modal to compose new message
    // For now, just show a toast
    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast('New message feature coming soon', 'info');
    } else if (window.showToast) {
      window.showToast('New message feature coming soon', 'info');
    }
  }

  /**
   * Filter messages
   */
  function filterMessages() {
    loadMessages();
  }

  /**
   * Export message history
   */
  function exportMessages() {
    if (!window.CommunicationManager) {
      return;
    }

    window.CommunicationManager.exportHistory();

    if (window.UIComponents && window.UIComponents.showToast) {
      window.UIComponents.showToast('Message history exported', 'success');
    } else if (window.showToast) {
      window.showToast('Message history exported', 'success');
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Module registration
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('messagesUI', {
      init: init,
      loadMessages: loadMessages,
      toggleMessagesView: toggleMessagesView,
      viewMessage: viewMessage,
      markMessageAsRead: markMessageAsRead,
      markAllAsRead: markAllAsRead,
      showNewMessageModal: showNewMessageModal,
      filterMessages: filterMessages,
      exportMessages: exportMessages
    });
  }

  // Global API
  window.MessagesDashboard = {
    init: init,
    loadMessages: loadMessages,
    toggleMessagesView: toggleMessagesView,
    viewMessage: viewMessage,
    markMessageAsRead: markMessageAsRead,
    markAllAsRead: markAllAsRead,
    showNewMessageModal: showNewMessageModal,
    filterMessages: filterMessages,
    exportMessages: exportMessages
  };

  // Make functions globally available for onclick handlers
  window.viewMessage = viewMessage;
  window.markMessageAsRead = markMessageAsRead;
  window.markAllAsRead = markAllAsRead;
  window.showNewMessageModal = showNewMessageModal;
  window.filterMessages = filterMessages;
  window.exportMessages = exportMessages;
  window.toggleMessagesView = toggleMessagesView;

  console.log('[MESSAGES-UI] Module loaded');
})();
