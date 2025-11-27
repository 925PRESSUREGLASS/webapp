// ghl-task-sync.js - GoHighLevel Task Sync Module
// Dependencies: task-manager.js, ghl-client.js (from Prompt #28)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[GHL-TASK-SYNC] Skipped in test mode');
    return;
  }

  /**
   * Check if GHL integration is available
   */
  function isGHLAvailable() {
    return window.GHLClient && typeof window.GHLClient.makeRequest === 'function';
  }

  /**
   * Check if task sync is enabled
   */
  function isTaskSyncEnabled() {
    if (!isGHLAvailable()) return false;

    // Check if GHL_CONFIG exists and task sync is enabled
    if (window.GHL_CONFIG && window.GHL_CONFIG.features) {
      return window.GHL_CONFIG.features.taskSync === true;
    }

    return false;
  }

  /**
   * Map TicTacStick task to GHL task format
   */
  function mapTaskToGHL(task) {
    var ghlTask = {
      title: task.title || 'Follow-up Task',
      body: task.description || '',
      contactId: task.clientId || null,
      dueDate: task.dueDate || null,
      completed: task.status === 'completed',
      assignedTo: task.assignedTo || null
    };

    return ghlTask;
  }

  /**
   * Create task in GHL
   */
  function createTask(task, callback) {
    if (!isTaskSyncEnabled()) {
      console.log('[GHL-TASK-SYNC] Task sync disabled');
      if (callback) callback(new Error('Task sync disabled'));
      return;
    }

    // Need contact ID to create task in GHL
    if (!task.clientId) {
      console.warn('[GHL-TASK-SYNC] Task has no client ID, cannot sync to GHL');
      if (callback) callback(new Error('No client ID'));
      return;
    }

    var taskData = mapTaskToGHL(task);

    console.log('[GHL-TASK-SYNC] Creating task in GHL:', task.id);

    window.GHLClient.makeRequest('POST', '/tasks/', taskData, function(error, response) {
      if (error) {
        console.error('[GHL-TASK-SYNC] Failed to create GHL task:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-TASK-SYNC] Task created in GHL:', response.task.id);

      // Update local task with GHL ID
      if (window.TaskManager && response.task && response.task.id) {
        var localTask = window.TaskManager.getTask(task.id);
        if (localTask) {
          localTask.ghlTaskId = response.task.id;
          localTask.syncStatus = 'synced';
          localTask.lastSync = new Date().toISOString();
          window.TaskManager.updateTask(localTask);
        }
      }

      if (callback) callback(null, response.task);
    });
  }

  /**
   * Update task in GHL
   */
  function updateTask(task, callback) {
    if (!isTaskSyncEnabled()) {
      if (callback) callback(new Error('Task sync disabled'));
      return;
    }

    if (!task.ghlTaskId) {
      console.error('[GHL-TASK-SYNC] Task has no GHL ID, cannot update');
      if (callback) callback(new Error('No GHL task ID'));
      return;
    }

    var taskData = mapTaskToGHL(task);
    var endpoint = '/tasks/' + task.ghlTaskId;

    console.log('[GHL-TASK-SYNC] Updating task in GHL:', task.ghlTaskId);

    window.GHLClient.makeRequest('PUT', endpoint, taskData, function(error, response) {
      if (error) {
        console.error('[GHL-TASK-SYNC] Failed to update GHL task:', error);

        // Mark sync as failed
        if (window.TaskManager) {
          task.syncStatus = 'failed';
          window.TaskManager.updateTask(task);
        }

        if (callback) callback(error);
        return;
      }

      console.log('[GHL-TASK-SYNC] Task updated in GHL:', task.ghlTaskId);

      // Update sync status
      if (window.TaskManager) {
        task.syncStatus = 'synced';
        task.lastSync = new Date().toISOString();
        window.TaskManager.updateTask(task);
      }

      if (callback) callback(null, response.task);
    });
  }

  /**
   * Complete task in GHL
   */
  function completeTask(task, callback) {
    if (!isTaskSyncEnabled()) {
      if (callback) callback(new Error('Task sync disabled'));
      return;
    }

    if (!task.ghlTaskId) {
      if (callback) callback(new Error('No GHL task ID'));
      return;
    }

    var taskData = {
      completed: true
    };

    var endpoint = '/tasks/' + task.ghlTaskId;

    console.log('[GHL-TASK-SYNC] Completing task in GHL:', task.ghlTaskId);

    window.GHLClient.makeRequest('PUT', endpoint, taskData, function(error, response) {
      if (error) {
        console.error('[GHL-TASK-SYNC] Failed to complete GHL task:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-TASK-SYNC] Task completed in GHL:', task.ghlTaskId);

      if (callback) callback(null, response.task);
    });
  }

  /**
   * Delete task in GHL
   */
  function deleteTask(task, callback) {
    if (!isTaskSyncEnabled()) {
      if (callback) callback(new Error('Task sync disabled'));
      return;
    }

    if (!task.ghlTaskId) {
      if (callback) callback(new Error('No GHL task ID'));
      return;
    }

    var endpoint = '/tasks/' + task.ghlTaskId;

    console.log('[GHL-TASK-SYNC] Deleting task in GHL:', task.ghlTaskId);

    window.GHLClient.makeRequest('DELETE', endpoint, null, function(error, response) {
      if (error) {
        console.error('[GHL-TASK-SYNC] Failed to delete GHL task:', error);
        if (callback) callback(error);
        return;
      }

      console.log('[GHL-TASK-SYNC] Task deleted in GHL:', task.ghlTaskId);

      if (callback) callback(null, response);
    });
  }

  /**
   * Sync pending tasks (batch sync for offline recovery)
   */
  function syncPendingTasks(callback) {
    if (!isTaskSyncEnabled()) {
      if (callback) callback(new Error('Task sync disabled'));
      return;
    }

    if (!window.TaskManager) {
      if (callback) callback(new Error('TaskManager not available'));
      return;
    }

    console.log('[GHL-TASK-SYNC] Syncing pending tasks...');

    var allTasks = window.TaskManager.getAllTasks();
    var pendingSync = allTasks.filter(function(t) {
      return t.syncStatus === 'pending' || t.syncStatus === 'failed';
    });

    if (pendingSync.length === 0) {
      console.log('[GHL-TASK-SYNC] No pending tasks to sync');
      if (callback) callback(null, { synced: 0 });
      return;
    }

    console.log('[GHL-TASK-SYNC] Found ' + pendingSync.length + ' tasks to sync');

    var synced = 0;
    var failed = 0;

    function syncNext(index) {
      if (index >= pendingSync.length) {
        console.log('[GHL-TASK-SYNC] Batch sync complete:', synced, 'synced,', failed, 'failed');
        if (callback) callback(null, { synced: synced, failed: failed });
        return;
      }

      var task = pendingSync[index];

      if (task.ghlTaskId) {
        // Update existing
        updateTask(task, function(error) {
          if (error) {
            failed++;
          } else {
            synced++;
          }
          syncNext(index + 1);
        });
      } else {
        // Create new
        createTask(task, function(error) {
          if (error) {
            failed++;
          } else {
            synced++;
          }
          syncNext(index + 1);
        });
      }
    }

    syncNext(0);
  }

  /**
   * Handle task events for auto-sync
   */
  function handleTaskEvent(eventType, task) {
    if (!isTaskSyncEnabled()) return;

    console.log('[GHL-TASK-SYNC] Task event:', eventType);

    switch (eventType) {
      case 'task-created':
        // Auto-create in GHL if client ID exists
        if (task.clientId) {
          createTask(task, function(error) {
            if (error) {
              console.error('[GHL-TASK-SYNC] Auto-sync failed:', error);
            }
          });
        }
        break;

      case 'task-updated':
        // Auto-update in GHL if synced
        if (task.ghlTaskId) {
          updateTask(task, function(error) {
            if (error) {
              console.error('[GHL-TASK-SYNC] Auto-sync failed:', error);
            }
          });
        }
        break;

      case 'task-deleted':
        // Auto-delete in GHL if synced
        if (task.ghlTaskId) {
          deleteTask(task, function(error) {
            if (error) {
              console.error('[GHL-TASK-SYNC] Auto-sync failed:', error);
            }
          });
        }
        break;
    }
  }

  /**
   * Initialize sync event listeners
   */
  function init() {
    if (!isGHLAvailable()) {
      console.log('[GHL-TASK-SYNC] GHL client not available - sync disabled');
      return;
    }

    console.log('[GHL-TASK-SYNC] Initializing task sync...');

    // Listen for APP events if available
    if (window.APP && window.APP.on) {
      window.APP.on('task-created', function(task) {
        handleTaskEvent('task-created', task);
      });

      window.APP.on('task-updated', function(task) {
        handleTaskEvent('task-updated', task);
      });

      window.APP.on('task-deleted', function(data) {
        if (data.task) {
          handleTaskEvent('task-deleted', data.task);
        }
      });
    }

    // Sync pending tasks on startup
    if (navigator.onLine) {
      setTimeout(function() {
        syncPendingTasks(function(error, result) {
          if (error) {
            console.error('[GHL-TASK-SYNC] Startup sync failed:', error);
          } else {
            console.log('[GHL-TASK-SYNC] Startup sync complete:', result);
          }
        });
      }, 2000); // Wait 2 seconds for everything to initialize
    }

    console.log('[GHL-TASK-SYNC] Initialized');
  }

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Register module with APP
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('ghlTaskSync', {
      createTask: createTask,
      updateTask: updateTask,
      completeTask: completeTask,
      deleteTask: deleteTask,
      syncPendingTasks: syncPendingTasks,
      isEnabled: isTaskSyncEnabled
    });
  }

  // Global API
  window.GHLTaskSync = {
    createTask: createTask,
    updateTask: updateTask,
    completeTask: completeTask,
    deleteTask: deleteTask,
    syncPendingTasks: syncPendingTasks,
    isEnabled: isTaskSyncEnabled
  };

  console.log('[GHL-TASK-SYNC] Module loaded');
})();
