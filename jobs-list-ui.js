// jobs-list-ui.js - Jobs List UI Controller
// Dependencies: job-manager.js, ui-components.js
// iOS Safari 12+ compatible (ES5 only - no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    var _currentFilter = 'all';

    /**
     * Initialize jobs list UI
     */
    function init() {
        // Set up event listeners
        var statusFilter = document.getElementById('job-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                filterJobs(this.value);
            });
        }

        console.log('[JOBS-LIST-UI] Initialized');
    }

    /**
     * Show jobs page
     */
    function showJobsPage() {
        // Hide all pages
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].style.display = 'none';
        }

        // Hide main app
        var app = document.querySelector('.app');
        if (app) app.style.display = 'none';

        // Show jobs page
        var jobsPage = document.getElementById('page-jobs');
        if (jobsPage) {
            jobsPage.style.display = 'block';
            updateJobsSummary();
            renderJobsList('all');
        }
    }

    /**
     * Update jobs summary cards
     */
    function updateJobsSummary() {
        var jobs = window.JobManager.getAllJobs();

        var scheduled = 0;
        var inProgress = 0;
        var completed = 0;

        for (var i = 0; i < jobs.length; i++) {
            if (jobs[i].status === 'scheduled') scheduled++;
            else if (jobs[i].status === 'in-progress') inProgress++;
            else if (jobs[i].status === 'completed' || jobs[i].status === 'invoiced') completed++;
        }

        var scheduledEl = document.getElementById('jobs-scheduled');
        var inProgressEl = document.getElementById('jobs-in-progress');
        var completedEl = document.getElementById('jobs-completed');
        var totalEl = document.getElementById('jobs-total');

        if (scheduledEl) scheduledEl.textContent = scheduled;
        if (inProgressEl) inProgressEl.textContent = inProgress;
        if (completedEl) completedEl.textContent = completed;
        if (totalEl) totalEl.textContent = jobs.length;
    }

    /**
     * Render jobs list
     */
    function renderJobsList(filter) {
        _currentFilter = filter || 'all';

        var jobs = window.JobManager.getAllJobs();
        var container = document.getElementById('jobs-list');
        if (!container) return;

        // Filter jobs
        var filteredJobs = [];
        for (var i = 0; i < jobs.length; i++) {
            if (filter === 'all' || jobs[i].status === filter) {
                filteredJobs.push(jobs[i]);
            }
        }

        // Sort by most recent first
        filteredJobs.sort(function(a, b) {
            return new Date(b.createdDate) - new Date(a.createdDate);
        });

        if (filteredJobs.length === 0) {
            container.innerHTML = '<p class="text-muted">No jobs found. Create a job from a quote to get started.</p>';
            return;
        }

        var html = '<div class="jobs-grid">';

        for (var i = 0; i < filteredJobs.length; i++) {
            var job = filteredJobs[i];
            html += renderJobCard(job);
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * Render individual job card
     */
    function renderJobCard(job) {
        var statusClass = 'job-status-' + job.status;
        var statusBadge = getStatusBadge(job.status);

        var html = '<div class="job-card ' + statusClass + '" onclick="openJob(\'' + job.id + '\')">';

        // Header
        html += '<div class="job-card-header">';
        html += '<div class="job-card-number">' + job.jobNumber + '</div>';
        html += statusBadge;
        html += '</div>';

        // Client info
        html += '<div class="job-card-client">';
        html += '<strong>' + (job.client.name || 'No Name') + '</strong>';
        if (job.client.address) {
            html += '<div class="job-card-location">📍 ' + job.client.address + '</div>';
        }
        html += '</div>';

        // Schedule info
        html += '<div class="job-card-schedule">';
        if (job.schedule.scheduledDate) {
            var date = new Date(job.schedule.scheduledDate);
            html += '<div>📅 ' + date.toLocaleDateString('en-AU') + '</div>';
        }
        if (job.schedule.actualDuration) {
            html += '<div>⏱️ ' + job.schedule.actualDuration + ' minutes</div>';
        } else if (job.schedule.estimatedDuration) {
            html += '<div>⏱️ ~' + job.schedule.estimatedDuration + ' minutes</div>';
        }
        html += '</div>';

        // Price info
        html += '<div class="job-card-price">';
        html += '<div class="job-price-label">Total</div>';
        if (job.status === 'completed' || job.status === 'invoiced') {
            html += '<div class="job-price-value">$' + job.actual.total.toFixed(2) + '</div>';
            if (job.actual.total !== job.estimate.total) {
                var diff = job.actual.total - job.estimate.total;
                html += '<div class="job-price-diff ' + (diff > 0 ? 'text-success' : 'text-danger') + '">';
                html += (diff > 0 ? '+' : '') + '$' + diff.toFixed(2);
                html += '</div>';
            }
        } else {
            html += '<div class="job-price-value">$' + job.estimate.total.toFixed(2) + '</div>';
            html += '<div class="job-price-estimate">Estimated</div>';
        }
        html += '</div>';

        // Photos count
        if (job.photos) {
            var photoCount = (job.photos.before || []).length + (job.photos.after || []).length;
            if (photoCount > 0) {
                html += '<div class="job-card-photos">📷 ' + photoCount + ' photos</div>';
            }
        }

        html += '</div>';

        return html;
    }

    /**
     * Get status badge
     */
    function getStatusBadge(status) {
        var badges = {
            'scheduled': '<span class="badge badge-info">Scheduled</span>',
            'in-progress': '<span class="badge badge-warning">In Progress</span>',
            'completed': '<span class="badge badge-success">Completed</span>',
            'invoiced': '<span class="badge badge-primary">Invoiced</span>',
            'cancelled': '<span class="badge badge-danger">Cancelled</span>'
        };

        return badges[status] || '<span class="badge">' + status + '</span>';
    }

    /**
     * Open job details
     */
    function openJob(jobId) {
        if (window.JobTrackingUI && window.JobTrackingUI.openJob) {
            window.JobTrackingUI.openJob(jobId);
        }
    }

    /**
     * Show create job modal
     */
    function showCreateJobModal() {
        var modal = document.getElementById('create-job-modal');
        if (!modal) return;

        // Load saved quotes
        var savedQuotes = window.Storage.get('tictacstick_saved_quotes_v1') || [];
        var select = document.getElementById('job-quote-select');

        if (select) {
            select.innerHTML = '<option value="">-- Select a Quote --</option>';

            for (var i = 0; i < savedQuotes.length; i++) {
                var quote = savedQuotes[i];
                var option = document.createElement('option');
                option.value = quote.id;
                option.textContent = (quote.quoteTitle || 'Untitled') + ' - $' + (quote.total || 0).toFixed(2);
                select.appendChild(option);
            }

            // Add change listener
            select.onchange = function() {
                previewQuote(this.value);
            };
        }

        // Set default scheduled date to tomorrow 9am
        var scheduledInput = document.getElementById('job-scheduled-date');
        if (scheduledInput) {
            var tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);

            // Format for datetime-local input
            var year = tomorrow.getFullYear();
            var month = String(tomorrow.getMonth() + 1).padStart(2, '0');
            var day = String(tomorrow.getDate()).padStart(2, '0');
            var hours = String(tomorrow.getHours()).padStart(2, '0');
            var minutes = String(tomorrow.getMinutes()).padStart(2, '0');

            scheduledInput.value = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
        }

        modal.style.display = 'flex';
    }

    /**
     * Close create job modal
     */
    function closeCreateJobModal() {
        var modal = document.getElementById('create-job-modal');
        if (modal) {
            modal.style.display = 'none';
        }

        // Clear preview
        var preview = document.getElementById('job-quote-preview');
        if (preview) {
            preview.style.display = 'none';
        }
    }

    /**
     * Preview selected quote
     */
    function previewQuote(quoteId) {
        if (!quoteId) {
            var preview = document.getElementById('job-quote-preview');
            if (preview) preview.style.display = 'none';
            return;
        }

        var savedQuotes = window.Storage.get('tictacstick_saved_quotes_v1') || [];
        var quote = null;

        for (var i = 0; i < savedQuotes.length; i++) {
            if (savedQuotes[i].id === quoteId) {
                quote = savedQuotes[i];
                break;
            }
        }

        if (!quote) return;

        var preview = document.getElementById('job-quote-preview');
        var details = document.getElementById('job-quote-details');

        if (!preview || !details) return;

        var html = '';
        html += '<p><strong>Client:</strong> ' + (quote.clientName || 'No name') + '</p>';
        if (quote.clientLocation) {
            html += '<p><strong>Location:</strong> ' + quote.clientLocation + '</p>';
        }
        html += '<p><strong>Total:</strong> $' + (quote.total || 0).toFixed(2) + ' (inc GST)</p>';

        if (quote.windowLines && quote.windowLines.length > 0) {
            html += '<p><strong>Windows:</strong> ' + quote.windowLines.length + ' items</p>';
        }

        if (quote.pressureLines && quote.pressureLines.length > 0) {
            html += '<p><strong>Pressure:</strong> ' + quote.pressureLines.length + ' items</p>';
        }

        details.innerHTML = html;
        preview.style.display = 'block';
    }

    /**
     * Create job from selected quote
     */
    function createJobFromQuote() {
        var quoteSelect = document.getElementById('job-quote-select');
        var scheduledInput = document.getElementById('job-scheduled-date');

        if (!quoteSelect || !scheduledInput) return;

        var quoteId = quoteSelect.value;
        var scheduledDate = scheduledInput.value;

        if (!quoteId) {
            alert('Please select a quote');
            return;
        }

        if (!scheduledDate) {
            alert('Please select a scheduled date');
            return;
        }

        // Create job
        var job = window.JobManager.createFromQuote(quoteId, scheduledDate);

        if (job) {
            closeCreateJobModal();

            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Job created: ' + job.jobNumber, 'success');
            }

            // Refresh list
            updateJobsSummary();
            renderJobsList(_currentFilter);

            // Ask if want to open job
            if (confirm('Job created! Open job now?')) {
                openJob(job.id);
            }
        } else {
            alert('Failed to create job');
        }
    }

    /**
     * Filter jobs
     */
    function filterJobs(filter) {
        renderJobsList(filter);

        // Update dropdown
        var select = document.getElementById('job-status-filter');
        if (select) {
            select.value = filter;
        }
    }

    /**
     * Refresh jobs list
     */
    function refreshJobsList() {
        updateJobsSummary();
        renderJobsList(_currentFilter);

        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Jobs refreshed', 'info');
        }
    }

    /**
     * View pricing insights
     */
    function viewPricingInsights() {
        // Navigate to pricing insights page
        var pages = document.querySelectorAll('.page');
        for (var i = 0; i < pages.length; i++) {
            pages[i].style.display = 'none';
        }

        var insightsPage = document.getElementById('page-pricing-insights');
        if (insightsPage) {
            insightsPage.style.display = 'block';

            // Load insights
            if (window.loadPricingInsights) {
                window.loadPricingInsights();
            }
        }
    }

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('jobsListUI', {
            init: init,
            showJobsPage: showJobsPage,
            showCreateJobModal: showCreateJobModal,
            closeCreateJobModal: closeCreateJobModal,
            createJobFromQuote: createJobFromQuote,
            filterJobs: filterJobs,
            refreshJobsList: refreshJobsList,
            viewPricingInsights: viewPricingInsights
        });
    }

    // Global API
    window.JobsListUI = {
        init: init,
        showJobsPage: showJobsPage,
        showCreateJobModal: showCreateJobModal,
        closeCreateJobModal: closeCreateJobModal,
        createJobFromQuote: createJobFromQuote,
        filterJobs: filterJobs,
        refreshJobsList: refreshJobsList,
        viewPricingInsights: viewPricingInsights
    };

    // Global helper functions
    window.showJobsPage = showJobsPage;
    window.showCreateJobModal = showCreateJobModal;
    window.closeCreateJobModal = closeCreateJobModal;
    window.createJobFromQuote = createJobFromQuote;
    window.filterJobs = filterJobs;
    window.refreshJobsList = refreshJobsList;
    window.viewPricingInsights = viewPricingInsights;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[JOBS-LIST-UI] Module initialized');
})();
