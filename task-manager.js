// task-manager.js - Task Management Module
// Dependencies: None (standalone task CRUD)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  // Task storage key
  var STORAGE_KEY = 'tts_tasks';

  /**
   * Create task object structure
   */
  function createTaskObject(config) {
    return {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      quoteId: config.quoteId || null,
      clientId: config.clientId || null,
      type: config.type || 'follow-up', // follow-up, phone-call, email, sms, meeting
      priority: config.priority || 'normal', // urgent, high, normal, low
      status: 'pending', // pending, in-progress, completed, cancelled, overdue
      title: config.title || '',
      description: config.description || '',
      dueDate: config.dueDate || null,
      scheduledDate: config.scheduledDate || null,
      completedDate: null,
      assignedTo: config.assignedTo || 'Gerry',

      // Follow-up specific
      followUpType: config.followUpType || null, // sms, email, phone-call
      followUpMessage: config.followUpMessage || '',
      followUpAttempts: 0,

      // Metadata
      createdDate: new Date().toISOString(),
      createdBy: 'system',
      lastModified: new Date().toISOString(),

      // GHL integration
      ghlTaskId: null,
      syncStatus: 'pending', // pending, synced, failed
      lastSync: null,

      // Reminders
      reminders: [],

      // Notes
      notes: []
    };
  }

  /**
   * Get all tasks from LocalStorage
   */
  function getAllTasks() {
    try {
      var tasks = localStorage.getItem(STORAGE_KEY);
      return tasks ? JSON.parse(tasks) : [];
    } catch (e) {
      console.error('[TASK-MANAGER] Failed to load tasks:', e);
      return [];
    }
  }

  /**
   * Save all tasks to LocalStorage
   */
  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (e) {
      console.error('[TASK-MANAGER] Failed to save tasks:', e);
      if (window.showToast) {
        window.showToast('Failed to save tasks. Storage may be full.', 'error');
      }
      return false;
    }
  }

  /**
   * Get task by ID
   */
  function getTask(taskId) {
    var tasks = getAllTasks();
    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === taskId) {
        return tasks[i];
      }
    }
    return null;
  }

  /**
   * Create new task
   */
  function createTask(config) {
    var task = createTaskObject(config);
    var tasks = getAllTasks();
    tasks.push(task);

    if (saveTasks(tasks)) {
      console.log('[TASK-MANAGER] Task created:', task.id);

      // Trigger event for GHL sync
      if (window.APP && window.APP.triggerEvent) {
        window.APP.triggerEvent('task-created', task);
      }

      return task;
    }

    return null;
  }

  /**
   * Update existing task
   */
  function updateTask(updatedTask) {
    var tasks = getAllTasks();
    var updated = false;

    for (var i = 0; i < tasks.length; i++) {
      if (tasks[i].id === updatedTask.id) {
        updatedTask.lastModified = new Date().toISOString();
        tasks[i] = updatedTask;
        updated = true;
        break;
      }
    }

    if (updated && saveTasks(tasks)) {
      console.log('[TASK-MANAGER] Task updated:', updatedTask.id);

      // Trigger event for GHL sync
      if (window.APP && window.APP.triggerEvent) {
        window.APP.triggerEvent('task-updated', updatedTask);
      }

      return true;
    }

    return false;
  }

  /**
   * Complete task
   */
  function completeTask(taskId, notes) {
    var task = getTask(taskId);
    if (!task) {
      console.error('[TASK-MANAGER] Task not found:', taskId);
      return false;
    }

    task.status = 'completed';
    task.completedDate = new Date().toISOString();

    if (notes) {
      task.notes.push({
        text: notes,
        date: new Date().toISOString(),
        type: 'completion'
      });
    }

    if (updateTask(task)) {
      console.log('[TASK-MANAGER] Task completed:', taskId);
      return true;
    }

    return false;
  }

  /**
   * Cancel task
   */
  function cancelTask(taskId, reason) {
    var task = getTask(taskId);
    if (!task) {
      console.error('[TASK-MANAGER] Task not found:', taskId);
      return false;
    }

    task.status = 'cancelled';

    if (reason) {
      task.notes.push({
        text: 'Cancelled: ' + reason,
        date: new Date().toISOString(),
        type: 'cancellation'
      });
    }

    if (updateTask(task)) {
      console.log('[TASK-MANAGER] Task cancelled:', taskId);
      return true;
    }

    return false;
  }

  /**
   * Delete task
   */
  function deleteTask(taskId) {
    var tasks = getAllTasks();
    var filtered = tasks.filter(function(t) { return t.id !== taskId; });

    if (filtered.length < tasks.length) {
      if (saveTasks(filtered)) {
        console.log('[TASK-MANAGER] Task deleted:', taskId);

        // Trigger event
        if (window.APP && window.APP.triggerEvent) {
          window.APP.triggerEvent('task-deleted', { taskId: taskId });
        }

        return true;
      }
    }

    return false;
  }

  /**
   * Get tasks for specific quote
   */
  function getTasksForQuote(quoteId) {
    var tasks = getAllTasks();
    return tasks.filter(function(t) {
      return t.quoteId === quoteId;
    });
  }

  /**
   * Get pending tasks
   */
  function getPendingTasks() {
    var tasks = getAllTasks();
    return tasks.filter(function(t) {
      return t.status === 'pending' || t.status === 'in-progress';
    });
  }

  /**
   * Get overdue tasks
   */
  function getOverdueTasks() {
    var tasks = getAllTasks();
    var now = new Date();

    return tasks.filter(function(t) {
      // Include tasks marked as overdue OR pending/in-progress with past due date
      if (t.status === 'overdue') {
        return true;
      }

      if (t.status !== 'pending' && t.status !== 'in-progress') {
        return false;
      }

      if (!t.dueDate) {
        return false;
      }

      var dueDate = new Date(t.dueDate);
      return dueDate < now;
    });
  }

  /**
   * Get today's tasks
   */
  function getTodaysTasks() {
    var tasks = getAllTasks();
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks.filter(function(t) {
      if (t.status !== 'pending' && t.status !== 'in-progress') {
        return false;
      }

      if (!t.dueDate) {
        return false;
      }

      var dueDate = new Date(t.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  /**
   * Get urgent tasks
   */
  function getUrgentTasks() {
    var tasks = getAllTasks();
    return tasks.filter(function(t) {
      return (t.status === 'pending' || t.status === 'in-progress') &&
             t.priority === 'urgent';
    });
  }

  /**
   * Add note to task
   */
  function addTaskNote(taskId, noteText, noteType) {
    var task = getTask(taskId);
    if (!task) {
      console.error('[TASK-MANAGER] Task not found:', taskId);
      return false;
    }

    task.notes.push({
      text: noteText,
      date: new Date().toISOString(),
      type: noteType || 'general'
    });

    return updateTask(task);
  }

  /**
   * Update task status
   */
  function updateTaskStatus(taskId, newStatus) {
    var task = getTask(taskId);
    if (!task) {
      console.error('[TASK-MANAGER] Task not found:', taskId);
      return false;
    }

    var oldStatus = task.status;
    task.status = newStatus;

    // Add note about status change
    task.notes.push({
      text: 'Status changed from ' + oldStatus + ' to ' + newStatus,
      date: new Date().toISOString(),
      type: 'status-change'
    });

    // Mark completion date if completed
    if (newStatus === 'completed' && !task.completedDate) {
      task.completedDate = new Date().toISOString();
    }

    return updateTask(task);
  }

  /**
   * Check for overdue tasks and update status
   */
  function checkOverdueTasks() {
    var tasks = getAllTasks();
    var now = new Date();
    var updated = false;

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      if ((task.status === 'pending' || task.status === 'in-progress') &&
          task.dueDate) {

        var dueDate = new Date(task.dueDate);

        if (dueDate < now && task.status !== 'overdue') {
          task.status = 'overdue';
          task.notes.push({
            text: 'Task became overdue',
            date: new Date().toISOString(),
            type: 'system'
          });
          updated = true;

          console.log('[TASK-MANAGER] Task overdue:', task.id);
        }
      }
    }

    if (updated) {
      saveTasks(tasks);
    }

    return updated;
  }

  /**
   * Clean up old completed tasks
   */
  function cleanupOldTasks(daysOld) {
    daysOld = daysOld || 90; // Default 90 days

    var tasks = getAllTasks();
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    var filtered = tasks.filter(function(t) {
      if (t.status !== 'completed' && t.status !== 'cancelled') {
        return true; // Keep non-completed tasks
      }

      var completedDate = new Date(t.completedDate || t.lastModified);
      return completedDate >= cutoffDate;
    });

    var removed = tasks.length - filtered.length;

    if (removed > 0) {
      saveTasks(filtered);
      console.log('[TASK-MANAGER] Cleaned up', removed, 'old tasks');
    }

    return removed;
  }

  /**
   * Get task statistics
   */
  function getTaskStats() {
    var tasks = getAllTasks();
    var stats = {
      total: tasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      byPriority: {
        urgent: 0,
        high: 0,
        normal: 0,
        low: 0
      },
      byType: {}
    };

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      // Count by status
      if (task.status === 'pending') stats.pending++;
      else if (task.status === 'in-progress') stats.inProgress++;
      else if (task.status === 'completed') stats.completed++;
      else if (task.status === 'cancelled') stats.cancelled++;
      else if (task.status === 'overdue') stats.overdue++;

      // Count by priority
      if (stats.byPriority[task.priority] !== undefined) {
        stats.byPriority[task.priority]++;
      }

      // Count by type
      var type = task.followUpType || task.type || 'other';
      stats.byType[type] = (stats.byType[type] || 0) + 1;
    }

    return stats;
  }

  // Schedule periodic overdue check (every minute)
  setInterval(function() {
    checkOverdueTasks();
  }, 60000);

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('taskManager', {
      createTask: createTask,
      getTask: getTask,
      getAllTasks: getAllTasks,
      updateTask: updateTask,
      completeTask: completeTask,
      cancelTask: cancelTask,
      deleteTask: deleteTask,
      getTasksForQuote: getTasksForQuote,
      getPendingTasks: getPendingTasks,
      getOverdueTasks: getOverdueTasks,
      getTodaysTasks: getTodaysTasks,
      getUrgentTasks: getUrgentTasks,
      addTaskNote: addTaskNote,
      updateTaskStatus: updateTaskStatus,
      checkOverdueTasks: checkOverdueTasks,
      cleanupOldTasks: cleanupOldTasks,
      getTaskStats: getTaskStats
    });
  }

  // Global API
  window.TaskManager = {
    createTask: createTask,
    getTask: getTask,
    getAllTasks: getAllTasks,
    updateTask: updateTask,
    completeTask: completeTask,
    cancelTask: cancelTask,
    deleteTask: deleteTask,
    getTasksForQuote: getTasksForQuote,
    getPendingTasks: getPendingTasks,
    getOverdueTasks: getOverdueTasks,
    getTodaysTasks: getTodaysTasks,
    getUrgentTasks: getUrgentTasks,
    addTaskNote: addTaskNote,
    updateTaskStatus: updateTaskStatus,
    checkOverdueTasks: checkOverdueTasks,
    cleanupOldTasks: cleanupOldTasks,
    getTaskStats: getTaskStats
  };

  console.log('[TASK-MANAGER] Initialized');
})();
