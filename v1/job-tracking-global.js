// job-tracking-global.js - Global functions for job tracking
// Dependencies: job-manager.js, job-tracking-ui.js
// iOS Safari 12+ compatible (ES5 only - no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
        console.log('[JOB-TRACKING-GLOBAL] Skipped in test mode');
        return;
    }

    /**
     * Show create job dialog
     */
    function showCreateJobDialog() {
        var modal = document.getElementById('create-job-modal');
        if (!modal) {
            console.error('[JOB-TRACKING-GLOBAL] Create job modal not found');
            return;
        }

        // Populate quote dropdown
        populateQuoteDropdown();

        // Set default scheduled date to today
        var dateInput = document.getElementById('create-job-scheduled-date');
        if (dateInput) {
            var today = new Date();
            var yyyy = today.getFullYear();
            var mm = String(today.getMonth() + 1).padStart(2, '0');
            var dd = String(today.getDate()).padStart(2, '0');
            dateInput.value = yyyy + '-' + mm + '-' + dd;
        }

        // Show modal
        modal.style.display = 'flex';

        console.log('[JOB-TRACKING-GLOBAL] Create job dialog opened');
    }

    /**
     * Close create job dialog
     */
    function closeCreateJobDialog() {
        var modal = document.getElementById('create-job-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Populate quote dropdown
     */
    function populateQuoteDropdown() {
        var select = document.getElementById('create-job-quote-select');
        if (!select) return;

        // Get saved quotes
        var savedQuotes = [];
        try {
            var data = localStorage.getItem('tictacstick_saved_quotes_v1');
            savedQuotes = data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('[JOB-TRACKING-GLOBAL] Failed to load quotes:', e);
            return;
        }

        // Filter out quotes that already have jobs
        var existingJobs = window.JobManager ? window.JobManager.getAllJobs() : [];
        var jobQuoteIds = [];
        for (var i = 0; i < existingJobs.length; i++) {
            if (existingJobs[i].quoteId) {
                jobQuoteIds.push(existingJobs[i].quoteId);
            }
        }

        var availableQuotes = [];
        for (var i = 0; i < savedQuotes.length; i++) {
            if (jobQuoteIds.indexOf(savedQuotes[i].id) === -1) {
                availableQuotes.push(savedQuotes[i]);
            }
        }

        // Sort by date (newest first)
        availableQuotes.sort(function(a, b) {
            var dateA = new Date(a.savedAt || 0);
            var dateB = new Date(b.savedAt || 0);
            return dateB - dateA;
        });

        // Clear existing options
        select.innerHTML = '<option value="">-- Select a quote --</option>';

        // Add quote options
        for (var i = 0; i < availableQuotes.length; i++) {
            var quote = availableQuotes[i];
            var option = document.createElement('option');
            option.value = quote.id;

            var label = quote.quoteTitle || 'Untitled Quote';
            if (quote.clientName) {
                label += ' - ' + quote.clientName;
            }
            if (quote.total) {
                label += ' ($' + quote.total.toFixed(2) + ')';
            }

            option.textContent = label;
            select.appendChild(option);
        }

        if (availableQuotes.length === 0) {
            var option = document.createElement('option');
            option.value = '';
            option.textContent = 'No quotes available';
            option.disabled = true;
            select.appendChild(option);
        }
    }

    /**
     * Create job from quote
     */
    function createJobFromQuote() {
        var quoteSelect = document.getElementById('create-job-quote-select');
        var dateInput = document.getElementById('create-job-scheduled-date');
        var timeInput = document.getElementById('create-job-scheduled-time');

        if (!quoteSelect || !dateInput) {
            alert('Required fields are missing');
            return;
        }

        var quoteId = quoteSelect.value;
        if (!quoteId) {
            alert('Please select a quote');
            quoteSelect.focus();
            return;
        }

        var scheduledDate = dateInput.value;
        if (!scheduledDate) {
            alert('Please select a scheduled date');
            dateInput.focus();
            return;
        }

        // Combine date and time
        var scheduledTime = timeInput ? timeInput.value : '09:00';
        var scheduledDateTime = new Date(scheduledDate + 'T' + scheduledTime + ':00').toISOString();

        // Create job
        if (!window.JobManager) {
            alert('Job Manager not initialized');
            return;
        }

        var job = window.JobManager.createFromQuote(quoteId, scheduledDateTime);

        if (job) {
            closeCreateJobDialog();

            // Show success message
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Job created: ' + job.jobNumber, 'success');
            } else {
                alert('Job created: ' + job.jobNumber);
            }

            // Refresh jobs list if on jobs page
            if (window.JobTrackingUI && window.JobTrackingUI.initJobsPage) {
                window.JobTrackingUI.initJobsPage();
            }

            console.log('[JOB-TRACKING-GLOBAL] Job created:', job.jobNumber);
        } else {
            alert('Failed to create job. Please try again.');
        }
    }

    /**
     * Generate invoice from jobs list
     */
    function generateJobInvoiceFromList(jobId) {
        if (!window.JobManager) {
            alert('Job Manager not initialized');
            return;
        }

        var job = window.JobManager.getJob(jobId);
        if (!job) {
            alert('Job not found');
            return;
        }

        if (job.status !== 'completed') {
            alert('Job must be completed before generating invoice');
            return;
        }

        var invoice = window.JobManager.generateInvoice(jobId);

        if (invoice) {
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Invoice generated!', 'success');
            } else {
                alert('Invoice generated!');
            }

            // Refresh jobs list
            if (window.JobTrackingUI && window.JobTrackingUI.initJobsPage) {
                window.JobTrackingUI.initJobsPage();
            }
        } else {
            alert('Failed to generate invoice');
        }
    }

    /**
     * Initialize jobs page when navigated to
     */
    function initJobsPageOnNavigate() {
        if (window.JobTrackingUI && window.JobTrackingUI.initJobsPage) {
            window.JobTrackingUI.initJobsPage();
        }
    }

    // Expose global functions
    window.showCreateJobDialog = showCreateJobDialog;
    window.closeCreateJobDialog = closeCreateJobDialog;
    window.createJobFromQuote = createJobFromQuote;
    window.generateJobInvoiceFromList = generateJobInvoiceFromList;
    window.initJobsPageOnNavigate = initJobsPageOnNavigate;

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('jobTrackingGlobal', {
            showCreateJobDialog: showCreateJobDialog,
            closeCreateJobDialog: closeCreateJobDialog,
            createJobFromQuote: createJobFromQuote,
            generateJobInvoiceFromList: generateJobInvoiceFromList,
            initJobsPageOnNavigate: initJobsPageOnNavigate
        });
    }

    console.log('[JOB-TRACKING-GLOBAL] Module initialized');
})();
