// bug-tracker.js - Bug Reporting and Tracking System
// Report bugs: BugTracker.report('title', 'description', 'severity')
// iOS Safari 12+ compatible (no ES6)

(function() {
'use strict';

if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[BUG-TRACKER] Skipped in test mode');
    return;
}

var STORAGE_KEY = 'tts_bug_reports';

/**
 * Severity levels
 */
var SEVERITY = {
    CRITICAL: 'critical',   // App broken, data loss
    HIGH: 'high',          // Major feature broken
    MEDIUM: 'medium',      // Minor feature broken
    LOW: 'low'             // Cosmetic issue
};

/**
 * Status values
 */
var STATUS = {
    OPEN: 'open',
    IN_PROGRESS: 'in-progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
    WONT_FIX: 'wont-fix'
};

/**
 * Load all bug reports from storage
 */
function loadBugReports() {
    try {
        var data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (e) {
        console.error('Error loading bug reports:', e);
        return [];
    }
}

/**
 * Save bug reports to storage
 */
function saveBugReports(bugs) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bugs));
        return true;
    } catch (e) {
        console.error('Error saving bug reports:', e);
        return false;
    }
}

/**
 * Report a new bug
 */
function report(title, description, severity, stepsToReproduce) {
    if (!title || !description) {
        console.error('Title and description are required');
        return null;
    }

    severity = severity || SEVERITY.MEDIUM;
    stepsToReproduce = stepsToReproduce || [];

    var bug = {
        id: 'BUG-' + Date.now(),
        title: title,
        description: description,
        severity: severity,
        status: STATUS.OPEN,
        stepsToReproduce: stepsToReproduce,
        reportedDate: new Date().toISOString(),
        reporter: 'User', // Could be customized
        device: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        },
        appVersion: (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.version : 'unknown',
        screenshot: null,
        notes: []
    };

    // Add to storage
    var bugs = loadBugReports();
    bugs.push(bug);
    saveBugReports(bugs);

    // Log to console
    console.log('\n🐛 BUG REPORTED: ' + bug.id);
    console.log('Title: ' + bug.title);
    console.log('Severity: ' + bug.severity);
    console.log('Description: ' + bug.description);
    console.log('\nBug saved! View all bugs: BugTracker.listAll()');

    return bug;
}

/**
 * List all bug reports
 */
function listAll(filterStatus) {
    var bugs = loadBugReports();

    // Filter by status if provided
    if (filterStatus) {
        bugs = bugs.filter(function(bug) {
            return bug.status === filterStatus;
        });
    }

    console.log('\n========================================');
    console.log('  BUG REPORT LIST');
    console.log('========================================');

    if (bugs.length === 0) {
        console.log('\nNo bugs reported! 🎉');
        return [];
    }

    // Sort by severity and date
    bugs.sort(function(a, b) {
        var severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        var aSeverity = severityOrder[a.severity] || 99;
        var bSeverity = severityOrder[b.severity] || 99;

        if (aSeverity !== bSeverity) {
            return aSeverity - bSeverity;
        }

        return new Date(b.reportedDate) - new Date(a.reportedDate);
    });

    console.log('\nTotal: ' + bugs.length + ' bug(s)');
    if (filterStatus) {
        console.log('Filtered by: ' + filterStatus);
    }
    console.log('');

    for (var i = 0; i < bugs.length; i++) {
        var bug = bugs[i];
        var severityIcon = bug.severity === 'critical' ? '🔴' :
                           bug.severity === 'high' ? '🟠' :
                           bug.severity === 'medium' ? '🟡' : '🟢';

        console.log(severityIcon + ' ' + bug.id + ' - ' + bug.title);
        console.log('  Severity: ' + bug.severity.toUpperCase());
        console.log('  Status: ' + bug.status);
        console.log('  Reported: ' + new Date(bug.reportedDate).toLocaleDateString());
        console.log('');
    }

    return bugs;
}

/**
 * Get bug by ID
 */
function getBug(bugId) {
    var bugs = loadBugReports();

    for (var i = 0; i < bugs.length; i++) {
        if (bugs[i].id === bugId) {
            return bugs[i];
        }
    }

    return null;
}

/**
 * Update bug status
 */
function updateStatus(bugId, newStatus, note) {
    var bugs = loadBugReports();
    var found = false;

    for (var i = 0; i < bugs.length; i++) {
        if (bugs[i].id === bugId) {
            var oldStatus = bugs[i].status;
            bugs[i].status = newStatus;
            bugs[i].updatedDate = new Date().toISOString();

            if (note) {
                bugs[i].notes.push({
                    date: new Date().toISOString(),
                    text: 'Status changed from ' + oldStatus + ' to ' + newStatus + ': ' + note
                });
            }

            found = true;
            console.log('✓ Bug ' + bugId + ' status updated: ' + oldStatus + ' → ' + newStatus);
            break;
        }
    }

    if (!found) {
        console.error('✗ Bug not found: ' + bugId);
        return false;
    }

    saveBugReports(bugs);
    return true;
}

/**
 * Add note to bug
 */
function addNote(bugId, noteText) {
    var bugs = loadBugReports();
    var found = false;

    for (var i = 0; i < bugs.length; i++) {
        if (bugs[i].id === bugId) {
            bugs[i].notes.push({
                date: new Date().toISOString(),
                text: noteText
            });
            found = true;
            console.log('✓ Note added to bug ' + bugId);
            break;
        }
    }

    if (!found) {
        console.error('✗ Bug not found: ' + bugId);
        return false;
    }

    saveBugReports(bugs);
    return true;
}

/**
 * Delete bug
 */
function deleteBug(bugId) {
    var bugs = loadBugReports();
    var newBugs = [];

    for (var i = 0; i < bugs.length; i++) {
        if (bugs[i].id !== bugId) {
            newBugs.push(bugs[i]);
        }
    }

    if (newBugs.length === bugs.length) {
        console.error('✗ Bug not found: ' + bugId);
        return false;
    }

    saveBugReports(newBugs);
    console.log('✓ Bug ' + bugId + ' deleted');
    return true;
}

/**
 * Get bug statistics
 */
function getStatistics() {
    var bugs = loadBugReports();

    var stats = {
        total: bugs.length,
        bySeverity: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        },
        byStatus: {
            open: 0,
            'in-progress': 0,
            resolved: 0,
            closed: 0,
            'wont-fix': 0
        }
    };

    for (var i = 0; i < bugs.length; i++) {
        var bug = bugs[i];

        // Count by severity
        if (stats.bySeverity[bug.severity] !== undefined) {
            stats.bySeverity[bug.severity]++;
        }

        // Count by status
        if (stats.byStatus[bug.status] !== undefined) {
            stats.byStatus[bug.status]++;
        }
    }

    console.log('\n========================================');
    console.log('  BUG STATISTICS');
    console.log('========================================');
    console.log('\nTotal Bugs: ' + stats.total);
    console.log('\nBy Severity:');
    console.log('  Critical: ' + stats.bySeverity.critical);
    console.log('  High: ' + stats.bySeverity.high);
    console.log('  Medium: ' + stats.bySeverity.medium);
    console.log('  Low: ' + stats.bySeverity.low);
    console.log('\nBy Status:');
    console.log('  Open: ' + stats.byStatus.open);
    console.log('  In Progress: ' + stats.byStatus['in-progress']);
    console.log('  Resolved: ' + stats.byStatus.resolved);
    console.log('  Closed: ' + stats.byStatus.closed);
    console.log('  Won\'t Fix: ' + stats.byStatus['wont-fix']);

    return stats;
}

/**
 * Export bugs as CSV
 */
function exportToCSV() {
    var bugs = loadBugReports();

    if (bugs.length === 0) {
        console.warn('No bugs to export');
        return;
    }

    var csv = 'Bug ID,Title,Severity,Status,Reported Date,Description,Steps to Reproduce\n';

    for (var i = 0; i < bugs.length; i++) {
        var bug = bugs[i];
        var steps = bug.stepsToReproduce.join('; ');

        csv += '"' + bug.id + '","' +
               bug.title + '","' +
               bug.severity + '","' +
               bug.status + '","' +
               new Date(bug.reportedDate).toLocaleDateString() + '","' +
               bug.description.replace(/"/g, '""') + '","' +
               steps.replace(/"/g, '""') + '"\n';
    }

    // Download CSV
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'bug-report-' + Date.now() + '.csv';
    a.click();
    URL.revokeObjectURL(url);

    console.log('✓ Bugs exported to CSV');
}

/**
 * Clear all bug reports (use with caution!)
 */
function clearAll() {
    var confirmed = confirm('⚠️ WARNING: This will delete ALL bug reports!\n\nAre you sure?');

    if (!confirmed) {
        console.log('Clear cancelled');
        return false;
    }

    localStorage.removeItem(STORAGE_KEY);
    console.log('✓ All bug reports cleared');
    return true;
}

/**
 * Quick report function with prompts
 */
function quickReport() {
    console.log('\n--- Quick Bug Report ---');

    var title = prompt('Bug Title:');
    if (!title) {
        console.log('Cancelled');
        return null;
    }

    var description = prompt('Description:');
    if (!description) {
        console.log('Cancelled');
        return null;
    }

    var severityInput = prompt('Severity (critical/high/medium/low):', 'medium');
    var severity = severityInput || 'medium';

    var stepsInput = prompt('Steps to reproduce (comma-separated):', '');
    var steps = stepsInput ? stepsInput.split(',').map(function(s) { return s.trim(); }) : [];

    return report(title, description, severity, steps);
}

// Public API
window.BugTracker = {
    report: report,
    quickReport: quickReport,
    listAll: listAll,
    getBug: getBug,
    updateStatus: updateStatus,
    addNote: addNote,
    deleteBug: deleteBug,
    getStatistics: getStatistics,
    exportToCSV: exportToCSV,
    clearAll: clearAll,
    SEVERITY: SEVERITY,
    STATUS: STATUS
};

console.log('[BUG-TRACKER] Ready. Report bugs: BugTracker.report() or BugTracker.quickReport()');

// Example usage in console:
// BugTracker.report('PDF generation fails', 'When quote has >20 line items, PDF throws error', BugTracker.SEVERITY.HIGH, ['Create quote with 25 items', 'Click Generate PDF', 'Error appears']);
// BugTracker.listAll();
// BugTracker.updateStatus('BUG-1234567890', BugTracker.STATUS.RESOLVED, 'Fixed in v1.9.1');

})();
