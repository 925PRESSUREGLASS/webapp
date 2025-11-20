// tests/task-automation.spec.js - Task Automation Tests
// Tests for Task Manager, Follow-up Automation, and GHL sync

const { test, expect } = require('@playwright/test');
const { gotoApp } = require('./fixtures/app-url');

test.describe('Task Management System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await gotoApp(page);

    // Wait for app to be ready
    await page.waitForSelector('.app');
    await page.waitForFunction(() => window.APP && window.TaskManager);

    // Clear any existing tasks
    await page.evaluate(() => {
      localStorage.removeItem('tts_tasks');
    });
  });

  test('should load TaskManager module', async ({ page }) => {
    const taskManagerExists = await page.evaluate(() => {
      return window.TaskManager && typeof window.TaskManager.createTask === 'function';
    });

    expect(taskManagerExists).toBe(true);
  });

  test('should create a new task', async ({ page }) => {
    const task = await page.evaluate(() => {
      return window.TaskManager.createTask({
        quoteId: 'test-quote-1',
        clientId: 'test-client-1',
        type: 'follow-up',
        priority: 'normal',
        title: 'Test Follow-up Task',
        description: 'This is a test task',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });
    });

    expect(task).toBeTruthy();
    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Test Follow-up Task');
    expect(task.status).toBe('pending');
    expect(task.priority).toBe('normal');
  });

  test('should retrieve task by ID', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.createTask({
        title: 'Retrieve Test',
        description: 'Test retrieval'
      });

      var retrieved = window.TaskManager.getTask(task.id);
      return {
        created: task,
        retrieved: retrieved,
        match: task.id === retrieved.id
      };
    });

    expect(result.match).toBe(true);
    expect(result.retrieved.title).toBe('Retrieve Test');
  });

  test('should update task', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.createTask({
        title: 'Original Title',
        priority: 'normal'
      });

      task.title = 'Updated Title';
      task.priority = 'high';

      var updated = window.TaskManager.updateTask(task);
      var retrieved = window.TaskManager.getTask(task.id);

      return {
        updated: updated,
        title: retrieved.title,
        priority: retrieved.priority
      };
    });

    expect(result.updated).toBe(true);
    expect(result.title).toBe('Updated Title');
    expect(result.priority).toBe('high');
  });

  test('should complete task', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.createTask({
        title: 'Task to Complete',
        status: 'pending'
      });

      var completed = window.TaskManager.completeTask(task.id, 'Completed successfully');
      var retrieved = window.TaskManager.getTask(task.id);

      return {
        completed: completed,
        status: retrieved.status,
        hasCompletionDate: !!retrieved.completedDate,
        hasNote: retrieved.notes.length > 0
      };
    });

    expect(result.completed).toBe(true);
    expect(result.status).toBe('completed');
    expect(result.hasCompletionDate).toBe(true);
    expect(result.hasNote).toBe(true);
  });

  test('should cancel task with reason', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.createTask({
        title: 'Task to Cancel'
      });

      var cancelled = window.TaskManager.cancelTask(task.id, 'Quote declined');
      var retrieved = window.TaskManager.getTask(task.id);

      return {
        cancelled: cancelled,
        status: retrieved.status,
        notes: retrieved.notes
      };
    });

    expect(result.cancelled).toBe(true);
    expect(result.status).toBe('cancelled');
    expect(result.notes.length).toBeGreaterThan(0);
    expect(result.notes[0].text).toContain('Quote declined');
  });

  test('should delete task', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.createTask({
        title: 'Task to Delete'
      });

      var taskId = task.id;
      var deleted = window.TaskManager.deleteTask(taskId);
      var retrieved = window.TaskManager.getTask(taskId);

      return {
        deleted: deleted,
        retrieved: retrieved
      };
    });

    expect(result.deleted).toBe(true);
    expect(result.retrieved).toBeNull();
  });

  test('should get pending tasks', async ({ page }) => {
    const pendingCount = await page.evaluate(() => {
      // Create mix of tasks
      window.TaskManager.createTask({ title: 'Pending 1', status: 'pending' });
      window.TaskManager.createTask({ title: 'Pending 2', status: 'pending' });

      var completed = window.TaskManager.createTask({ title: 'Completed 1' });
      window.TaskManager.completeTask(completed.id);

      var pending = window.TaskManager.getPendingTasks();
      return pending.length;
    });

    expect(pendingCount).toBe(2);
  });

  test('should detect overdue tasks', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Create task with past due date
      var yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      var task = window.TaskManager.createTask({
        title: 'Overdue Task',
        dueDate: yesterday.toISOString(),
        status: 'pending'
      });

      // Check for overdue tasks
      var updated = window.TaskManager.checkOverdueTasks();

      // Get the task again to check status
      var retrievedTask = window.TaskManager.getTask(task.id);

      // Get overdue tasks
      var overdue = window.TaskManager.getOverdueTasks();

      return {
        taskCreated: !!task,
        taskId: task.id,
        checkRanUpdates: updated,
        taskStatus: retrievedTask ? retrievedTask.status : null,
        overdueCount: overdue.length,
        taskInOverdue: overdue.some(function(t) { return t.id === task.id; })
      };
    });

    expect(result.taskCreated).toBe(true);
    expect(result.checkRanUpdates).toBe(true);
    expect(result.overdueCount).toBeGreaterThan(0);
    expect(result.taskInOverdue).toBe(true);
  });

  test('should add notes to task', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.createTask({
        title: 'Task with Notes'
      });

      window.TaskManager.addTaskNote(task.id, 'First note', 'general');
      window.TaskManager.addTaskNote(task.id, 'Second note', 'system');

      var retrieved = window.TaskManager.getTask(task.id);
      return {
        noteCount: retrieved.notes.length,
        firstNote: retrieved.notes[0].text,
        secondNote: retrieved.notes[1].text
      };
    });

    expect(result.noteCount).toBe(2);
    expect(result.firstNote).toBe('First note');
    expect(result.secondNote).toBe('Second note');
  });

  test('should get task statistics', async ({ page }) => {
    const stats = await page.evaluate(() => {
      // Create various tasks
      window.TaskManager.createTask({ priority: 'urgent', status: 'pending' });
      window.TaskManager.createTask({ priority: 'high', status: 'pending' });
      window.TaskManager.createTask({ priority: 'normal', status: 'pending' });

      var completed = window.TaskManager.createTask({ priority: 'low' });
      window.TaskManager.completeTask(completed.id);

      return window.TaskManager.getTaskStats();
    });

    expect(stats.total).toBe(4);
    expect(stats.pending).toBe(3);
    expect(stats.completed).toBe(1);
    expect(stats.byPriority.urgent).toBe(1);
    expect(stats.byPriority.high).toBe(1);
    expect(stats.byPriority.normal).toBe(1);
    expect(stats.byPriority.low).toBe(1);
  });
});

test.describe('Follow-up Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForFunction(() => window.FollowupConfig);
  });

  test('should load followup config', async ({ page }) => {
    const configExists = await page.evaluate(() => {
      var config = window.FollowupConfig.get();
      return {
        exists: !!config,
        hasSequences: !!config.sequences,
        hasHighValue: !!config.highValue,
        hasEscalation: !!config.escalation
      };
    });

    expect(configExists.exists).toBe(true);
    expect(configExists.hasSequences).toBe(true);
    expect(configExists.hasHighValue).toBe(true);
    expect(configExists.hasEscalation).toBe(true);
  });

  test('should have sent sequence configured', async ({ page }) => {
    const sentSequence = await page.evaluate(() => {
      var config = window.FollowupConfig.get();
      return config.sequences.sent;
    });

    expect(sentSequence).toBeTruthy();
    expect(sentSequence.length).toBeGreaterThan(0);
    expect(sentSequence[0].type).toBeTruthy();
    expect(sentSequence[0].delay).toBeTruthy();
  });

  test('should have high-value sequence configured', async ({ page }) => {
    const highValue = await page.evaluate(() => {
      var config = window.FollowupConfig.get();
      return {
        threshold: config.highValue.threshold,
        sequenceLength: config.highValue.sequence.length
      };
    });

    expect(highValue.threshold).toBeGreaterThan(0);
    expect(highValue.sequenceLength).toBeGreaterThan(0);
  });

  test('should save and load custom config', async ({ page }) => {
    const result = await page.evaluate(() => {
      var config = window.FollowupConfig.get();
      config.highValue.threshold = 5000;

      window.FollowupConfig.update({ highValue: config.highValue });
      window.FollowupConfig.save();

      // Reload
      var reloaded = window.FollowupConfig.get();
      return reloaded.highValue.threshold;
    });

    expect(result).toBe(5000);
  });
});

test.describe('Follow-up Automation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForFunction(() => window.FollowupAutomation && window.TaskManager);

    // Clear tasks
    await page.evaluate(() => {
      localStorage.removeItem('tts_tasks');
    });
  });

  test('should load followup automation module', async ({ page }) => {
    const exists = await page.evaluate(() => {
      return window.FollowupAutomation &&
             typeof window.FollowupAutomation.createFollowupTasks === 'function';
    });

    expect(exists).toBe(true);
  });

  test('should create follow-up tasks for quote', async ({ page }) => {
    const result = await page.evaluate(() => {
      var quote = {
        id: 'test-quote-1',
        clientName: 'John Doe',
        totalIncGst: 500,
        status: 'sent',
        dateSent: new Date().toISOString()
      };

      var tasks = window.FollowupAutomation.createFollowupTasks(quote);

      return {
        taskCount: tasks.length,
        firstTask: tasks[0] ? tasks[0].title : null,
        allHaveQuoteId: tasks.every(function(t) { return t.quoteId === quote.id; })
      };
    });

    expect(result.taskCount).toBeGreaterThan(0);
    expect(result.firstTask).toBeTruthy();
    expect(result.allHaveQuoteId).toBe(true);
  });

  test('should create high-value sequence for expensive quotes', async ({ page }) => {
    const result = await page.evaluate(() => {
      var quote = {
        id: 'high-value-quote',
        clientName: 'Big Client',
        totalIncGst: 3000, // Above high-value threshold
        status: 'sent',
        dateSent: new Date().toISOString()
      };

      var tasks = window.FollowupAutomation.createFollowupTasks(quote);

      return {
        taskCount: tasks.length,
        hasUrgentTask: tasks.some(function(t) { return t.priority === 'urgent'; })
      };
    });

    expect(result.taskCount).toBeGreaterThan(0);
    expect(result.hasUrgentTask).toBe(true);
  });

  test('should cancel follow-up tasks', async ({ page }) => {
    const result = await page.evaluate(() => {
      var quote = {
        id: 'cancel-test-quote',
        clientName: 'Test Client',
        totalIncGst: 400,
        status: 'sent',
        dateSent: new Date().toISOString()
      };

      // Create tasks
      window.FollowupAutomation.createFollowupTasks(quote);

      // Cancel them
      var cancelled = window.FollowupAutomation.cancelFollowupTasks(quote.id, 'Testing cancellation');

      // Check if tasks are cancelled
      var tasks = window.TaskManager.getTasksForQuote(quote.id);
      var allCancelled = tasks.every(function(t) { return t.status === 'cancelled'; });

      return {
        cancelled: cancelled,
        allCancelled: allCancelled
      };
    });

    expect(result.cancelled).toBeGreaterThan(0);
    expect(result.allCancelled).toBe(true);
  });

  test('should get task summary', async ({ page }) => {
    const summary = await page.evaluate(() => {
      // Create some tasks
      window.TaskManager.createTask({
        title: 'Today Task',
        dueDate: new Date().toISOString(),
        priority: 'urgent'
      });

      window.TaskManager.createTask({
        title: 'Pending Task',
        status: 'pending'
      });

      var completed = window.TaskManager.createTask({ title: 'Completed' });
      window.TaskManager.completeTask(completed.id);

      return window.FollowupAutomation.getTaskSummary();
    });

    expect(summary.total).toBeGreaterThan(0);
    expect(summary.pending).toBeGreaterThan(0);
    expect(summary.completed).toBeGreaterThan(0);
    expect(summary.urgent).toBeGreaterThan(0);
  });

  test('should handle quote events', async ({ page }) => {
    const result = await page.evaluate(() => {
      var quote = {
        id: 'event-test-quote',
        clientName: 'Event Test',
        totalIncGst: 350,
        status: 'sent',
        dateSent: new Date().toISOString()
      };

      // Trigger quote sent event
      window.FollowupAutomation.handleQuoteEvent('quote-sent', quote);

      // Check that tasks were created
      var tasks = window.TaskManager.getTasksForQuote(quote.id);

      return {
        taskCount: tasks.length,
        hasFollowupTasks: tasks.length > 0
      };
    });

    expect(result.hasFollowupTasks).toBe(true);
    expect(result.taskCount).toBeGreaterThan(0);
  });
});

test.describe('Task Dashboard UI', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForFunction(() => window.TaskDashboard);
  });

  test('should load task dashboard module', async ({ page }) => {
    const exists = await page.evaluate(() => {
      return window.TaskDashboard && typeof window.TaskDashboard.init === 'function';
    });

    expect(exists).toBe(true);
  });

  test('should have task dashboard page in DOM', async ({ page }) => {
    const pageExists = await page.evaluate(() => {
      var taskPage = document.getElementById('page-tasks');
      return {
        exists: !!taskPage,
        hasFilters: !!document.getElementById('task-status-filter'),
        hasSummaryCards: !!document.getElementById('tasks-today')
      };
    });

    expect(pageExists.exists).toBe(true);
    expect(pageExists.hasFilters).toBe(true);
    expect(pageExists.hasSummaryCards).toBe(true);
  });
});

test.describe('LocalStorage Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForFunction(() => window.TaskManager);

    // Clear storage
    await page.evaluate(() => {
      localStorage.removeItem('tts_tasks');
    });
  });

  test('should persist tasks to localStorage', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.TaskManager.createTask({
        title: 'Persistence Test',
        description: 'Testing storage'
      });

      var stored = localStorage.getItem('tts_tasks');
      var parsed = JSON.parse(stored);

      return {
        stored: !!stored,
        isArray: Array.isArray(parsed),
        count: parsed.length,
        hasTask: parsed.some(function(t) { return t.title === 'Persistence Test'; })
      };
    });

    expect(result.stored).toBe(true);
    expect(result.isArray).toBe(true);
    expect(result.count).toBe(1);
    expect(result.hasTask).toBe(true);
  });

  test('should reload tasks from localStorage', async ({ page }) => {
    // Create task
    await page.evaluate(() => {
      window.TaskManager.createTask({
        title: 'Reload Test',
        description: 'Testing reload'
      });
    });

    // Reload page
    await page.reload();
    await page.waitForFunction(() => window.TaskManager);

    // Check if task still exists
    const exists = await page.evaluate(() => {
      var tasks = window.TaskManager.getAllTasks();
      return tasks.some(function(t) { return t.title === 'Reload Test'; });
    });

    expect(exists).toBe(true);
  });
});

test.describe('Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page);
    await page.waitForFunction(() => window.TaskManager);
  });

  test('should handle invalid task ID gracefully', async ({ page }) => {
    const result = await page.evaluate(() => {
      var task = window.TaskManager.getTask('non-existent-id');
      return task;
    });

    expect(result).toBeNull();
  });

  test('should handle invalid quote for follow-up', async ({ page }) => {
    const result = await page.evaluate(() => {
      var tasks = window.FollowupAutomation.createFollowupTasks(null);
      return tasks;
    });

    expect(result).toEqual([]);
  });

  test('should handle update of non-existent task', async ({ page }) => {
    const result = await page.evaluate(() => {
      var fakeTask = {
        id: 'non-existent',
        title: 'Fake Task'
      };

      return window.TaskManager.updateTask(fakeTask);
    });

    expect(result).toBe(false);
  });
});
