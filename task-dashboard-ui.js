// task-dashboard-ui.js - Task Dashboard UI Controller
// Dependencies: task-manager.js, followup-automation.js, ui-components.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  var _currentFilter = {
    status: 'all',
    priority: 'all',
    type: 'all'
  };

  /**
   * Initialize dashboard
   */
  function init() {
    console.log('[TASK-DASHBOARD] Initializing...');

    // Set up event listeners
    setupEventListeners();

    // Load dashboard
    loadTaskDashboard();

    // Refresh every minute
    setInterval(function() {
      loadTaskDashboard();
    }, 60000);

    console.log('[TASK-DASHBOARD] Initialized');
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    var statusFilter = document.getElementById('task-status-filter');
    var priorityFilter = document.getElementById('task-priority-filter');
    var typeFilter = document.getElementById('task-type-filter');

    if (statusFilter) {
      statusFilter.addEventListener('change', applyTaskFilters);
    }

    if (priorityFilter) {
      priorityFilter.addEventListener('change', applyTaskFilters);
    }

    if (typeFilter) {
      typeFilter.addEventListener('change', applyTaskFilters);
    }
  }

  /**
   * Load task dashboard
   */
  function loadTaskDashboard() {
    // Update summary cards
    updateSummaryCards();

    // Render task list
    renderTaskList();
  }

  /**
   * Update summary cards
   */
  function updateSummaryCards() {
    if (!window.FollowupAutomation) return;

    var summary = window.FollowupAutomation.getTaskSummary();

    // Update card values
    var todayEl = document.getElementById('tasks-today');
    var overdueEl = document.getElementById('tasks-overdue');
    var urgentEl = document.getElementById('tasks-urgent');
    var pendingEl = document.getElementById('tasks-pending');

    if (todayEl) todayEl.textContent = summary.today;
    if (overdueEl) overdueEl.textContent = summary.overdue;
    if (urgentEl) urgentEl.textContent = summary.urgent;
    if (pendingEl) pendingEl.textContent = summary.pending;
  }

  /**
   * Render task list
   */
  function renderTaskList() {
    if (!window.TaskManager) {
      console.error('[TASK-DASHBOARD] TaskManager not available');
      return;
    }

    var listContainer = document.getElementById('task-list');
    var emptyState = document.getElementById('tasks-empty-state');

    if (!listContainer) {
      console.error('[TASK-DASHBOARD] Task list container not found');
      return;
    }

    listContainer.setAttribute('role', 'grid');
    listContainer.setAttribute('aria-label', 'Task list');

    // Get filters
    var statusFilter = document.getElementById('task-status-filter');
    var priorityFilter = document.getElementById('task-priority-filter');
    var typeFilter = document.getElementById('task-type-filter');

    _currentFilter.status = statusFilter ? statusFilter.value : 'all';
    _currentFilter.priority = priorityFilter ? priorityFilter.value : 'all';
    _currentFilter.type = typeFilter ? typeFilter.value : 'all';

    // Get all tasks
    var tasks = window.TaskManager.getAllTasks();

    // Apply filters
    tasks = tasks.filter(function(task) {
      if (_currentFilter.status !== 'all' && task.status !== _currentFilter.status) return false;
      if (_currentFilter.priority !== 'all' && task.priority !== _currentFilter.priority) return false;
      if (_currentFilter.type !== 'all' && task.followUpType !== _currentFilter.type) return false;
      return true;
    });

    // Sort by due date (soonest first)
    tasks.sort(function(a, b) {
      var dateA = new Date(a.dueDate || a.scheduledDate || a.createdDate);
      var dateB = new Date(b.dueDate || b.scheduledDate || b.createdDate);
      return dateA - dateB;
    });

    // Show empty state if no tasks
    if (tasks.length === 0) {
      listContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    // Hide empty state and render tasks
    listContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
    listContainer.innerHTML = '';

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      var taskCard = createTaskCard(task);
      listContainer.appendChild(taskCard);
    }

    if (window.EventHandlers && window.EventHandlers.enableKeyboardTableNavigation) {
      window.EventHandlers.enableKeyboardTableNavigation(listContainer, '.task-card', function(cardEl) {
        var taskId = cardEl.getAttribute('data-task-id');
        if (taskId) {
          viewTask(taskId);
        }
      });
    }
  }

  /**
   * Create task card element
   */
  function createTaskCard(task) {
    var card = document.createElement('div');
    card.className = 'card task-card task-priority-' + task.priority;
    card.setAttribute('data-task-id', task.id);
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'row');
    card.setAttribute('aria-label', 'Task ' + task.title + ', ' + task.priority + ' priority');

    // Create priority badge
    var priorityBadge = document.createElement('span');
    priorityBadge.className = 'badge badge-' + task.priority;
    priorityBadge.textContent = task.priority.toUpperCase();

    // Create status badge
    var statusBadge = document.createElement('span');
    statusBadge.className = 'badge badge-neutral';
    statusBadge.textContent = task.status;

    // Format due date
    var dueDate = 'No due date';
    var isOverdue = false;
    if (task.dueDate) {
      var dueDateObj = new Date(task.dueDate);
      dueDate = dueDateObj.toLocaleString();
      isOverdue = task.status === 'overdue' || dueDateObj < new Date();
    }

    // Create card body
    var cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    // Task header
    var header = document.createElement('div');
    header.className = 'task-header';

    var titleRow = document.createElement('div');
    titleRow.className = 'task-title-row';

    var title = document.createElement('h3');
    title.className = 'task-title';
    title.textContent = task.title;

    var badgeContainer = document.createElement('div');
    badgeContainer.className = 'task-badges';
    badgeContainer.appendChild(priorityBadge);
    badgeContainer.appendChild(statusBadge);

    titleRow.appendChild(title);
    titleRow.appendChild(badgeContainer);

    var meta = document.createElement('div');
    meta.className = 'task-meta';

    var typeSpan = document.createElement('span');
    typeSpan.className = 'task-type';
    typeSpan.textContent = task.followUpType || task.type;

    var dueSpan = document.createElement('span');
    dueSpan.className = 'task-due' + (isOverdue ? ' task-due-overdue' : '');
    dueSpan.textContent = 'Due: ' + dueDate;

    meta.appendChild(typeSpan);
    meta.appendChild(dueSpan);

    header.appendChild(titleRow);
    header.appendChild(meta);

    // Task description
    var description = document.createElement('div');
    description.className = 'task-description';
    description.textContent = task.description;

    // Task actions
    var actions = document.createElement('div');
    actions.className = 'task-actions';

    var viewBtn = document.createElement('button');
    viewBtn.className = 'btn btn-secondary btn-sm';
    viewBtn.textContent = 'View';
    viewBtn.setAttribute('aria-label', 'View details for ' + task.title);
    viewBtn.onclick = function() { viewTask(task.id); };

    var completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-primary btn-sm';
    completeBtn.textContent = 'Complete';
    completeBtn.setAttribute('aria-label', 'Complete task ' + task.title);
    completeBtn.onclick = function() { completeTaskWithConfirm(task.id); };

    actions.appendChild(viewBtn);
    actions.appendChild(completeBtn);

    // Assemble card
    cardBody.appendChild(header);
    cardBody.appendChild(description);
    cardBody.appendChild(actions);
    card.appendChild(cardBody);

    return card;
  }

  /**
   * Apply task filters
   */
  function applyTaskFilters() {
    renderTaskList();
  }

  /**
   * Filter tasks by preset
   */
  function filterTasks(filterType) {
    var statusFilter = document.getElementById('task-status-filter');
    var priorityFilter = document.getElementById('task-priority-filter');
    var typeFilter = document.getElementById('task-type-filter');

    if (!statusFilter || !priorityFilter || !typeFilter) return;

    // Reset filters
    statusFilter.value = 'all';
    priorityFilter.value = 'all';
    typeFilter.value = 'all';

    switch (filterType) {
      case 'today':
        // Would need custom implementation for "today" filter
        statusFilter.value = 'pending';
        break;
      case 'overdue':
        statusFilter.value = 'overdue';
        break;
      case 'urgent':
        priorityFilter.value = 'urgent';
        statusFilter.value = 'pending';
        break;
      case 'pending':
        statusFilter.value = 'pending';
        break;
    }

    applyTaskFilters();
  }

  /**
   * View task details
   */
  function viewTask(taskId) {
    var task = window.TaskManager.getTask(taskId);
    if (!task) {
      console.error('[TASK-DASHBOARD] Task not found:', taskId);
      return;
    }

    // Create modal content
    var content = '<div class="task-detail-modal">' +
      '<h2>' + task.title + '</h2>' +
      '<div class="task-detail-section">' +
      '<strong>Status:</strong> ' + task.status +
      '</div>' +
      '<div class="task-detail-section">' +
      '<strong>Priority:</strong> ' + task.priority +
      '</div>' +
      '<div class="task-detail-section">' +
      '<strong>Type:</strong> ' + (task.followUpType || task.type) +
      '</div>';

    if (task.dueDate) {
      content += '<div class="task-detail-section">' +
        '<strong>Due Date:</strong> ' + new Date(task.dueDate).toLocaleString() +
        '</div>';
    }

    content += '<div class="task-detail-section">' +
      '<strong>Description:</strong><br>' + task.description +
      '</div>';

    if (task.notes && task.notes.length > 0) {
      content += '<div class="task-detail-section">' +
        '<strong>Notes:</strong><ul>';
      for (var i = 0; i < task.notes.length; i++) {
        var note = task.notes[i];
        content += '<li>' + note.text + ' <em>(' + new Date(note.date).toLocaleString() + ')</em></li>';
      }
      content += '</ul></div>';
    }

    content += '</div>';

    // Show modal (using UI components if available)
    if (window.UIComponents && window.UIComponents.showAlert) {
      window.UIComponents.showAlert({
        title: 'Task Details',
        message: content,
        buttonText: 'Close'
      });
    } else {
      alert('Task: ' + task.title + '\n\n' + task.description);
    }
  }

  /**
   * Complete task with confirmation
   */
  function completeTaskWithConfirm(taskId) {
    var task = window.TaskManager.getTask(taskId);
    if (!task) return;

    var confirmMsg = 'Mark this task as completed?\n\n' + task.title;

    if (window.UIComponents && window.UIComponents.showConfirm) {
      window.UIComponents.showConfirm({
        title: 'Complete Task?',
        message: 'Mark "' + task.title + '" as completed?',
        confirmText: 'Complete',
        onConfirm: function() {
          completeTaskAction(taskId);
        }
      });
    } else {
      if (confirm(confirmMsg)) {
        completeTaskAction(taskId);
      }
    }
  }

  /**
   * Complete task action
   */
  function completeTaskAction(taskId) {
    if (window.TaskManager.completeTask(taskId)) {
      // Show success message
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Task completed successfully', 'success');
      }

      // Reload dashboard
      loadTaskDashboard();
    } else {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Failed to complete task', 'error');
      }
    }
  }

  /**
   * Show new task modal
   */
  function showNewTaskModal() {
    console.log('[TASK-DASHBOARD] Show new task modal');

    // Create modal HTML
    var modalHTML = '<div class="modal-overlay" id="new-task-modal-overlay">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="new-task-title">' +
      '  <div class="modal-header">' +
      '    <h3 class="modal-title" id="new-task-title">Create New Task</h3>' +
      '    <button class="modal-close" id="close-new-task-modal" aria-label="Close">&times;</button>' +
      '  </div>' +
      '  <div class="modal-body">' +
      '    <form id="new-task-form">' +
      '      <div class="form-group">' +
      '        <label for="task-title" class="form-label form-label-required">Task Title</label>' +
      '        <input type="text" id="task-title" class="form-input" required aria-required="true">' +
      '      </div>' +
      '      <div class="form-group">' +
      '        <label for="task-type" class="form-label">Task Type</label>' +
      '        <select id="task-type" class="form-select">' +
      '          <option value="follow-up">Follow-up</option>' +
      '          <option value="phone-call">Phone Call</option>' +
      '          <option value="email">Email</option>' +
      '          <option value="sms">SMS</option>' +
      '          <option value="meeting">Meeting</option>' +
      '        </select>' +
      '      </div>' +
      '      <div class="form-group">' +
      '        <label for="task-priority" class="form-label">Priority</label>' +
      '        <select id="task-priority" class="form-select">' +
      '          <option value="normal">Normal</option>' +
      '          <option value="high">High</option>' +
      '          <option value="urgent">Urgent</option>' +
      '          <option value="low">Low</option>' +
      '        </select>' +
      '      </div>' +
      '      <div class="form-group">' +
      '        <label for="task-due-date" class="form-label">Due Date</label>' +
      '        <input type="datetime-local" id="task-due-date" class="form-input">' +
      '        <span class="form-hint">Optional - set a deadline for this task</span>' +
      '      </div>' +
      '      <div class="form-group">' +
      '        <label for="task-description" class="form-label">Description</label>' +
      '        <textarea id="task-description" class="form-textarea" rows="3"></textarea>' +
      '      </div>' +
      '      <div class="form-group">' +
      '        <label for="task-message" class="form-label">Follow-up Message</label>' +
      '        <textarea id="task-message" class="form-textarea" rows="2"></textarea>' +
      '        <span class="form-hint">Optional - message template for follow-ups</span>' +
      '      </div>' +
      '    </form>' +
      '  </div>' +
      '  <div class="modal-footer">' +
      '    <button type="button" class="btn btn-secondary" id="cancel-new-task">Cancel</button>' +
      '    <button type="button" class="btn btn-primary" id="save-new-task">Create Task</button>' +
      '  </div>' +
      '</div>' +
      '</div>';

    // Add to body
    var modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstChild);

    // Prevent background scroll
    document.body.classList.add('modal-open');

    // Set up event listeners
    document.getElementById('close-new-task-modal').addEventListener('click', closeNewTaskModal);
    document.getElementById('cancel-new-task').addEventListener('click', closeNewTaskModal);
    document.getElementById('save-new-task').addEventListener('click', saveNewTask);

    if (window.EventHandlers && window.EventHandlers.setupModalNavigation) {
      window.EventHandlers.setupModalNavigation(document.getElementById('new-task-modal-overlay'), {
        onClose: closeNewTaskModal,
        onSubmit: saveNewTask,
        initialFocusSelector: '#task-title',
        labelledBy: 'new-task-title'
      });
    }

    // Focus on title input
    setTimeout(function() {
      var titleInput = document.getElementById('task-title');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  }

  /**
   * Close new task modal
   */
  function closeNewTaskModal() {
    var overlay = document.getElementById('new-task-modal-overlay');
    if (overlay) {
      overlay.remove();
    }
    document.body.classList.remove('modal-open');
  }

  /**
   * Save new task
   */
  function saveNewTask() {
    var title = document.getElementById('task-title').value.trim();
    var type = document.getElementById('task-type').value;
    var priority = document.getElementById('task-priority').value;
    var dueDateInput = document.getElementById('task-due-date').value;
    var description = document.getElementById('task-description').value.trim();
    var message = document.getElementById('task-message').value.trim();

    // Validate
    if (!title) {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Please enter a task title', 'error');
      } else {
        alert('Please enter a task title');
      }
      return;
    }

    // Parse due date
    var dueDate = null;
    if (dueDateInput) {
      dueDate = new Date(dueDateInput).toISOString();
    }

    // Create task
    if (window.TaskManager && window.TaskManager.createTask) {
      var taskConfig = {
        title: title,
        type: type,
        priority: priority,
        description: description,
        dueDate: dueDate,
        followUpMessage: message,
        createdBy: 'user'
      };

      var task = window.TaskManager.createTask(taskConfig);

      if (task) {
        console.log('[TASK-DASHBOARD] Task created:', task.id);

        // Show success message
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Task created successfully', 'success');
        } else {
          alert('Task created successfully');
        }

        // Close modal
        closeNewTaskModal();

        // Refresh dashboard
        loadTaskDashboard();
      } else {
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Failed to create task', 'error');
        } else {
          alert('Failed to create task');
        }
      }
    } else {
      console.error('[TASK-DASHBOARD] TaskManager not available');
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Task system not available', 'error');
      } else {
        alert('Task system not available');
      }
    }
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (document.getElementById('page-tasks')) {
        init();
      }
    });
  } else {
    if (document.getElementById('page-tasks')) {
      init();
    }
  }

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('taskDashboard', {
      init: init,
      renderTaskList: renderTaskList,
      applyTaskFilters: applyTaskFilters,
      filterTasks: filterTasks,
      viewTask: viewTask,
      completeTask: completeTaskWithConfirm,
      showNewTaskModal: showNewTaskModal
    });
  }

  // Global API
  window.TaskDashboard = {
    init: init,
    renderTaskList: renderTaskList,
    applyTaskFilters: applyTaskFilters,
    filterTasks: filterTasks
  };

  // Global functions for HTML onclick handlers
  window.viewTask = viewTask;
  window.completeTask = completeTaskWithConfirm;
  window.showNewTaskModal = showNewTaskModal;
  window.filterTasks = filterTasks;

  console.log('[TASK-DASHBOARD] Module loaded');
})();
