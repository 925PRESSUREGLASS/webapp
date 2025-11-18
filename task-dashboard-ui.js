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
  }

  /**
   * Create task card element
   */
  function createTaskCard(task) {
    var card = document.createElement('div');
    card.className = 'card task-card task-priority-' + task.priority;
    card.setAttribute('data-task-id', task.id);

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
    viewBtn.onclick = function() { viewTask(task.id); };

    var completeBtn = document.createElement('button');
    completeBtn.className = 'btn btn-primary btn-sm';
    completeBtn.textContent = 'Complete';
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
    console.log('[TASK-DASHBOARD] Opening new task modal');

    // Create modal HTML
    var html = '<div class="modal-overlay" id="newTaskModal">';
    html += '  <div class="modal-content" style="max-width: 600px;">';
    html += '    <div class="modal-header">';
    html += '      <h3 class="modal-title">Create New Task</h3>';
    html += '      <button class="modal-close" id="closeNewTaskModal" aria-label="Close">&times;</button>';
    html += '    </div>';
    html += '    <div class="modal-body">';
    html += '      <form id="newTaskForm">';

    // Title field
    html += '        <div class="form-group">';
    html += '          <label class="form-label form-label-required" for="taskTitle">Task Title</label>';
    html += '          <input type="text" id="taskTitle" class="form-input" required placeholder="e.g., Follow up with John about quote">';
    html += '        </div>';

    // Description field
    html += '        <div class="form-group">';
    html += '          <label class="form-label" for="taskDescription">Description</label>';
    html += '          <textarea id="taskDescription" class="form-textarea" rows="3" placeholder="Optional task details..."></textarea>';
    html += '        </div>';

    // Type field
    html += '        <div class="form-group">';
    html += '          <label class="form-label form-label-required" for="taskType">Task Type</label>';
    html += '          <select id="taskType" class="form-select" required>';
    html += '            <option value="follow-up">Follow-up</option>';
    html += '            <option value="phone-call">Phone Call</option>';
    html += '            <option value="email">Email</option>';
    html += '            <option value="sms">SMS</option>';
    html += '            <option value="meeting">Meeting</option>';
    html += '          </select>';
    html += '        </div>';

    // Priority field
    html += '        <div class="form-group">';
    html += '          <label class="form-label form-label-required" for="taskPriority">Priority</label>';
    html += '          <select id="taskPriority" class="form-select" required>';
    html += '            <option value="normal">Normal</option>';
    html += '            <option value="low">Low</option>';
    html += '            <option value="high">High</option>';
    html += '            <option value="urgent">Urgent</option>';
    html += '          </select>';
    html += '        </div>';

    // Due Date field
    html += '        <div class="form-group">';
    html += '          <label class="form-label" for="taskDueDate">Due Date</label>';
    html += '          <input type="datetime-local" id="taskDueDate" class="form-input">';
    html += '          <span class="form-hint">Optional - leave blank for no due date</span>';
    html += '        </div>';

    // Client selection (optional)
    html += '        <div class="form-group">';
    html += '          <label class="form-label" for="taskClientName">Client Name</label>';
    html += '          <input type="text" id="taskClientName" class="form-input" placeholder="Optional - client this task relates to">';
    html += '        </div>';

    html += '      </form>';
    html += '    </div>';
    html += '    <div class="modal-footer">';
    html += '      <button type="button" class="btn btn-tertiary" id="cancelNewTask">Cancel</button>';
    html += '      <button type="button" class="btn btn-primary" id="saveNewTask">Create Task</button>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    // Add modal to DOM
    var modalContainer = document.createElement('div');
    modalContainer.innerHTML = html;
    document.body.appendChild(modalContainer.firstChild);

    // Set default due date to tomorrow at 9 AM
    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    var dateInput = document.getElementById('taskDueDate');
    if (dateInput) {
      // Format for datetime-local input: YYYY-MM-DDTHH:MM
      var year = tomorrow.getFullYear();
      var month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      var day = String(tomorrow.getDate()).padStart(2, '0');
      var hours = String(tomorrow.getHours()).padStart(2, '0');
      var minutes = String(tomorrow.getMinutes()).padStart(2, '0');
      dateInput.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
    }

    // Wire up event handlers
    document.getElementById('closeNewTaskModal').addEventListener('click', closeNewTaskModal);
    document.getElementById('cancelNewTask').addEventListener('click', closeNewTaskModal);
    document.getElementById('saveNewTask').addEventListener('click', handleSaveNewTask);

    // Close on overlay click
    document.getElementById('newTaskModal').addEventListener('click', function(e) {
      if (e.target.id === 'newTaskModal') {
        closeNewTaskModal();
      }
    });

    // Focus on title field
    var titleInput = document.getElementById('taskTitle');
    if (titleInput) {
      titleInput.focus();
    }

    console.log('[TASK-DASHBOARD] New task modal opened');
  }

  /**
   * Close new task modal
   */
  function closeNewTaskModal() {
    var modal = document.getElementById('newTaskModal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Handle save new task
   */
  function handleSaveNewTask() {
    console.log('[TASK-DASHBOARD] Saving new task');

    // Get form values
    var title = document.getElementById('taskTitle').value.trim();
    var description = document.getElementById('taskDescription').value.trim();
    var type = document.getElementById('taskType').value;
    var priority = document.getElementById('taskPriority').value;
    var dueDateStr = document.getElementById('taskDueDate').value;
    var clientName = document.getElementById('taskClientName').value.trim();

    // Validate required fields
    if (!title) {
      if (window.UIComponents && window.UIComponents.showToast) {
        window.UIComponents.showToast('Task title is required', 'error');
      } else if (window.showToast) {
        window.showToast('Task title is required', 'error');
      } else {
        alert('Task title is required');
      }
      return;
    }

    // Parse due date
    var dueDate = dueDateStr ? new Date(dueDateStr).toISOString() : null;

    // Create task config
    var taskConfig = {
      title: title,
      description: description,
      type: type,
      priority: priority,
      dueDate: dueDate,
      assignedTo: 'Gerry'
    };

    // Add client name if provided
    if (clientName) {
      taskConfig.clientName = clientName;
    }

    // Create task via TaskManager
    if (window.TaskManager && window.TaskManager.createTask) {
      var newTask = window.TaskManager.createTask(taskConfig);

      if (newTask) {
        console.log('[TASK-DASHBOARD] Task created successfully:', newTask.id);

        // Close modal
        closeNewTaskModal();

        // Refresh task list
        render();

        // Show success message
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Task created successfully!', 'success');
        } else if (window.showToast) {
          window.showToast('Task created successfully!', 'success');
        }
      } else {
        console.error('[TASK-DASHBOARD] Failed to create task');
        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Failed to create task', 'error');
        } else if (window.showToast) {
          window.showToast('Failed to create task', 'error');
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
