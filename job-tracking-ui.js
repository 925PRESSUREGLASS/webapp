// job-tracking-ui.js - Job Tracking UI Controller
// Dependencies: job-manager.js, ui-components.js
// iOS Safari 12+ compatible (ES5 only - no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    var _currentJobId = null;
    var _timerInterval = null;
    var _timerStartTime = null;
    var _timerPausedTime = 0;
    var _selectedRating = 0;

    /**
     * Initialize job tracking UI
     */
    function init() {
        console.log('[JOB-TRACKING-UI] Initialized');
    }

    /**
     * Open active job screen
     */
    function openJob(jobId) {
        _currentJobId = jobId;
        var job = window.JobManager.getJob(jobId);

        if (!job) {
            alert('Job not found');
            return;
        }

        // Show page
        if (window.navigateTo) {
            window.navigateTo('active-job');
        }

        // Update header
        var titleEl = document.getElementById('job-title');
        if (titleEl) {
            titleEl.textContent = 'Job #' + job.jobNumber;
        }

        // Load job data
        loadJobData(job);

        // Initialize timer if job is in progress
        if (job.status === 'in-progress') {
            initializeTimer(job);
        }

        console.log('[JOB-TRACKING-UI] Opened job:', job.jobNumber);
    }

    /**
     * Load job data into UI
     */
    function loadJobData(job) {
        renderWorkItems(job);
        renderPhotos(job);
        renderIssuesAndNotes(job);
        updatePricingDisplay(job);
        updateButtonStates(job);
    }

    /**
     * Render work items
     */
    function renderWorkItems(job) {
        var container = document.getElementById('work-items-list');
        if (!container) return;

        container.setAttribute('role', 'grid');
        container.setAttribute('aria-label', 'Work item comparison table');

        var html = '';

        // Initialize actual items if needed
        if (job.actual.items.length === 0 && job.estimate.items.length > 0) {
            job.actual.items = JSON.parse(JSON.stringify(job.estimate.items));
            window.JobManager.saveJob(job);
        }

        // Render each item
        for (var i = 0; i < job.actual.items.length; i++) {
            var item = job.actual.items[i];
            var estimate = job.estimate.items[i];

            html += '<div class="work-item" data-index="' + i + '" tabindex="0" role="row" aria-label="Work item ' + (item.description || 'item ' + (i + 1)) + '">';

            // Item header
            html += '<div class="work-item-header">';
            html += '<h4>' + (item.description || '') + '</h4>';
            html += '<button class="btn btn-sm" onclick="JobTrackingUI.editWorkItem(' + i + ')" aria-label="Edit ' + (item.description || 'work item') + '">Edit</button>';
            html += '</div>';

            // Estimated vs Actual
            html += '<div class="work-item-comparison">';

            html += '<div class="comparison-col">';
            html += '<div class="comparison-label">Estimated</div>';
            html += '<div class="comparison-value">';
            html += '<div>Time: ' + (estimate.estimatedTime || 0) + ' min</div>';
            html += '<div>Difficulty: ' + (estimate.difficulty || 'normal') + '</div>';
            html += '<div>Price: $' + (estimate.total || 0).toFixed(2) + '</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="comparison-col">';
            html += '<div class="comparison-label">Actual</div>';
            html += '<div class="comparison-value">';
            html += '<div>Time: ' + (item.actualTime ? item.actualTime + ' min' : '-') + '</div>';
            html += '<div>Difficulty: ' + (item.actualDifficulty || '-') + '</div>';
            html += '<div>Price: $' + (item.total || 0).toFixed(2) + '</div>';
            html += '</div>';
            html += '</div>';

            html += '</div>';

            // Issues for this item
            if (item.issues && item.issues.length > 0) {
                html += '<div class="work-item-issues">';
                html += '<strong>Issues:</strong> ';
                html += item.issues.join(', ');
                html += '</div>';
            }

            // Variance indicator
            if (item.actualTime && estimate.estimatedTime) {
                var variance = ((item.actualTime - estimate.estimatedTime) / estimate.estimatedTime) * 100;
                var varianceClass = variance > 20 ? 'negative' : variance < -20 ? 'positive' : 'neutral';

                html += '<div class="variance-indicator ' + varianceClass + '">';
                if (variance > 0) {
                    html += '⚠️ ' + Math.round(variance) + '% over estimate';
                } else if (variance < 0) {
                    html += '✓ ' + Math.abs(Math.round(variance)) + '% under estimate';
                } else {
                    html += '✓ On target';
                }
                html += '</div>';
            }

            html += '</div>';
        }

        // Additional work items
        if (job.actual.additionalWork.length > 0) {
            html += '<div class="additional-work-section">';
            html += '<h4>Additional Work</h4>';

            for (var i = 0; i < job.actual.additionalWork.length; i++) {
                var work = job.actual.additionalWork[i];

                html += '<div class="additional-work-item">';
                html += '<div class="work-item-header">';
                html += '<span>' + work.description + '</span>';
                html += '<span class="badge ' + (work.approved ? 'badge-success' : 'badge-warning') + '">';
                html += work.approved ? 'Approved' : 'Pending';
                html += '</span>';
                html += '</div>';
                html += '<div>$' + work.total.toFixed(2) + ' (' + work.time + ' min)</div>';
                html += '</div>';
            }

            html += '</div>';
        }

        container.innerHTML = html || '<p class="text-muted">No work items</p>';

        if (window.EventHandlers && window.EventHandlers.enableKeyboardTableNavigation) {
            window.EventHandlers.enableKeyboardTableNavigation(container, '.work-item', function(rowEl) {
                var index = parseInt(rowEl.getAttribute('data-index'), 10);
                if (!isNaN(index)) {
                    JobTrackingUI.editWorkItem(index);
                }
            });
        }
    }

    /**
     * Edit work item
     */
    function editWorkItem(index) {
        var job = window.JobManager.getJob(_currentJobId);
        if (!job) return;

        var item = job.actual.items[index];
        if (!item) return;

        var actualTime = prompt('Actual time spent (minutes):', item.actualTime || '');
        if (actualTime === null) return;
        actualTime = parseInt(actualTime) || 0;

        var difficulty = prompt('Actual difficulty (easy/normal/hard/very-hard):', item.actualDifficulty || 'normal');

        var issuesStr = prompt('Any issues encountered? (comma separated):',
            item.issues ? item.issues.join(', ') : '');
        var issues = [];
        if (issuesStr) {
            var parts = issuesStr.split(',');
            for (var i = 0; i < parts.length; i++) {
                issues.push(parts[i].trim());
            }
        }

        window.JobManager.updateItemActual(_currentJobId, index, {
            actualTime: actualTime,
            actualDifficulty: difficulty.toLowerCase(),
            issues: issues,
            quantityCompleted: item.quantity
        });

        job = window.JobManager.getJob(_currentJobId);
        loadJobData(job);

        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Work item updated', 'success');
        }
    }

    /**
     * Render photos
     */
    function renderPhotos(job) {
        var container = document.getElementById('photos-grid');
        if (!container) return;

        var category = 'before'; // Default
        var activeTab = document.querySelector('.photo-tab.active');
        if (activeTab) {
            category = activeTab.textContent.toLowerCase().trim();
        }

        var photos = job.photos[category] || [];

        // Update photo count
        var totalPhotos = (job.photos.before || []).length +
                         (job.photos.after || []).length +
                         (job.photos.issues || []).length;
        var badge = document.getElementById('photo-count');
        if (badge) badge.textContent = totalPhotos;

        if (photos.length === 0) {
            container.innerHTML = '<p class="text-muted">No ' + category + ' photos yet</p>';
            return;
        }

        var html = '<div class="photos-grid">';

        for (var i = 0; i < photos.length; i++) {
            var photo = photos[i];

            html += '<div class="photo-card">';
            html += '<img src="' + (photo.thumbnail || photo.image) + '" ';
            html += 'onclick="JobTrackingUI.viewPhoto(\'' + photo.id + '\')" ';
            html += 'class="photo-thumbnail">';
            html += '<div class="photo-info">';
            html += '<div class="photo-location">' + (photo.location || 'Location') + '</div>';
            html += '<div class="photo-time">' + formatTime(photo.timestamp) + '</div>';
            if (photo.notes) {
                html += '<div class="photo-notes">' + photo.notes + '</div>';
            }
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * View photo in full screen
     */
    function viewPhoto(photoId) {
        var job = window.JobManager.getJob(_currentJobId);
        if (!job) return;

        // Find photo
        var photo = null;
        var categories = ['before', 'after', 'during', 'issues'];

        for (var i = 0; i < categories.length; i++) {
            var cat = categories[i];
            var photos = job.photos[cat] || [];

            for (var j = 0; j < photos.length; j++) {
                if (photos[j].id === photoId) {
                    photo = photos[j];
                    break;
                }
            }
            if (photo) break;
        }

        if (!photo) return;

        // Show in modal
        var modal = document.createElement('div');
        modal.className = 'photo-viewer-modal';
        modal.innerHTML =
            '<div class="photo-viewer-content">' +
            '<button class="photo-viewer-close" onclick="this.parentElement.parentElement.remove()">&times;</button>' +
            '<img src="' + photo.image + '" class="photo-viewer-image">' +
            '<div class="photo-viewer-info">' +
            '<div><strong>Location:</strong> ' + (photo.location || 'N/A') + '</div>' +
            '<div><strong>Time:</strong> ' + new Date(photo.timestamp).toLocaleString() + '</div>' +
            '<div><strong>Notes:</strong> ' + (photo.notes || 'N/A') + '</div>' +
            '</div>' +
            '</div>';

        document.body.appendChild(modal);
    }

    /**
     * Show photo category
     */
    function showPhotoCategory(category) {
        // Update active tab
        var tabs = document.querySelectorAll('.photo-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
            if (tabs[i].textContent.toLowerCase().trim() === category.toLowerCase()) {
                tabs[i].classList.add('active');
            }
        }

        // Reload photos
        var job = window.JobManager.getJob(_currentJobId);
        if (job) renderPhotos(job);
    }

    /**
     * Render issues and notes
     */
    function renderIssuesAndNotes(job) {
        var container = document.getElementById('issues-notes-list');
        if (!container) return;

        var html = '';

        // Render issues
        if (job.issues && job.issues.length > 0) {
            html += '<div class="issues-section">';
            html += '<h4>Issues</h4>';

            for (var i = 0; i < job.issues.length; i++) {
                var issue = job.issues[i];
                var severityClass = 'severity-' + issue.severity;

                html += '<div class="issue-card ' + severityClass + '">';
                html += '<div class="issue-header">';
                html += '<span class="issue-type">' + issue.type + '</span>';
                html += '<span class="issue-severity">' + issue.severity + '</span>';
                html += '</div>';
                html += '<div class="issue-description">' + issue.description + '</div>';
                if (issue.impact) {
                    html += '<div class="issue-impact"><strong>Impact:</strong> ' + issue.impact + '</div>';
                }
                if (issue.resolution) {
                    html += '<div class="issue-resolution"><strong>Resolution:</strong> ' + issue.resolution + '</div>';
                }
                html += '<div class="issue-time">' + formatTime(issue.timestamp) + '</div>';
                html += '</div>';
            }

            html += '</div>';
        }

        // Render notes
        if (job.notes && job.notes.length > 0) {
            html += '<div class="notes-section">';
            html += '<h4>Notes</h4>';

            for (var i = 0; i < job.notes.length; i++) {
                var note = job.notes[i];

                html += '<div class="note-card">';
                html += '<div class="note-type">' + note.type + '</div>';
                html += '<div class="note-text">' + note.note + '</div>';
                html += '<div class="note-time">' + formatTime(note.timestamp) + '</div>';
                html += '</div>';
            }

            html += '</div>';
        }

        if (!html) {
            html = '<p class="text-muted">No issues or notes recorded</p>';
        }

        container.innerHTML = html;
    }

    /**
     * Update pricing display
     */
    function updatePricingDisplay(job) {
        var originalTotal = document.getElementById('original-total');
        var actualTotal = document.getElementById('actual-total');
        var difference = document.getElementById('price-difference');

        if (originalTotal) {
            originalTotal.textContent = '$' + job.adjustments.originalTotal.toFixed(2);
        }

        if (actualTotal) {
            actualTotal.textContent = '$' + job.actual.total.toFixed(2);
        }

        if (difference) {
            var diff = job.actual.total - job.adjustments.originalTotal;
            difference.textContent = (diff >= 0 ? '+' : '') + '$' + diff.toFixed(2);

            if (diff > 0) {
                difference.className = 'pricing-value text-success';
            } else if (diff < 0) {
                difference.className = 'pricing-value text-danger';
            } else {
                difference.className = 'pricing-value';
            }
        }
    }

    /**
     * Update button states
     */
    function updateButtonStates(job) {
        var startBtn = document.getElementById('start-job-btn');
        var pauseBtn = document.getElementById('pause-job-btn');
        var completeBtn = document.getElementById('complete-job-btn');

        if (job.status === 'scheduled') {
            if (startBtn) startBtn.classList.remove('hidden');
            if (pauseBtn) pauseBtn.classList.add('hidden');
        } else if (job.status === 'in-progress') {
            if (startBtn) startBtn.classList.add('hidden');
            if (pauseBtn) pauseBtn.classList.remove('hidden');
        } else if (job.status === 'completed') {
            if (completeBtn) completeBtn.disabled = true;
            if (completeBtn) completeBtn.textContent = '✓ Completed';
        }
    }

    /**
     * Initialize timer
     */
    function initializeTimer(job) {
        if (!job.schedule.startTime) return;

        _timerStartTime = new Date(job.schedule.startTime).getTime();
        startTimerDisplay();
    }

    /**
     * Start timer display
     */
    function startTimerDisplay() {
        if (_timerInterval) {
            clearInterval(_timerInterval);
        }

        _timerInterval = setInterval(function() {
            var now = Date.now();
            var elapsed = now - _timerStartTime - _timerPausedTime;

            var hours = Math.floor(elapsed / 3600000);
            var minutes = Math.floor((elapsed % 3600000) / 60000);
            var seconds = Math.floor((elapsed % 60000) / 1000);

            var display =
                String(hours).padStart(2, '0') + ':' +
                String(minutes).padStart(2, '0') + ':' +
                String(seconds).padStart(2, '0');

            var timerEl = document.getElementById('job-timer');
            if (timerEl) timerEl.textContent = display;
        }, 1000);
    }

    /**
     * Format time for display
     */
    function formatTime(timestamp) {
        var date = new Date(timestamp);
        return date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Start job tracking
     */
    function startJobTracking() {
        if (!_currentJobId) return;

        var success = window.JobManager.startJob(_currentJobId);

        if (success) {
            var job = window.JobManager.getJob(_currentJobId);

            _timerStartTime = new Date(job.schedule.startTime).getTime();
            _timerPausedTime = 0;

            startTimerDisplay();
            updateButtonStates(job);

            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Job started', 'success');
            }
        }
    }

    /**
     * Pause job tracking
     */
    function pauseJobTracking() {
        if (_timerInterval) {
            clearInterval(_timerInterval);
            _timerInterval = null;
        }

        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Timer paused', 'info');
        }
    }

    /**
     * Show complete job dialog
     */
    function showCompleteJobDialog() {
        var modal = document.getElementById('complete-job-modal');
        if (modal) modal.style.display = 'flex';

        _selectedRating = 0;
        updateRatingStars(0);
    }

    /**
     * Close complete job dialog
     */
    function closeCompleteJobDialog() {
        var modal = document.getElementById('complete-job-modal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * Set rating
     */
    function setRating(rating) {
        _selectedRating = rating;
        updateRatingStars(rating);
    }

    /**
     * Update rating stars
     */
    function updateRatingStars(rating) {
        var stars = document.querySelectorAll('#client-rating .star');

        for (var i = 0; i < stars.length; i++) {
            var starRating = parseInt(stars[i].getAttribute('data-rating'));
            if (starRating <= rating) {
                stars[i].textContent = '★';
                stars[i].classList.add('active');
            } else {
                stars[i].textContent = '☆';
                stars[i].classList.remove('active');
            }
        }
    }

    /**
     * Finalize job completion
     */
    function finalizeJobCompletion() {
        if (!_currentJobId) return;

        var feedbackEl = document.getElementById('client-feedback');
        var photosShownEl = document.getElementById('photos-shown');
        var warrantyEl = document.getElementById('warranty-issued');
        var followUpEl = document.getElementById('followup-required');

        var completionData = {
            clientRating: _selectedRating,
            clientFeedback: feedbackEl ? feedbackEl.value : '',
            photosShownToClient: photosShownEl ? photosShownEl.checked : false,
            warrantyIssued: warrantyEl ? warrantyEl.checked : false,
            followUpRequired: followUpEl ? followUpEl.checked : false
        };

        var success = window.JobManager.completeJob(_currentJobId, completionData);

        if (success) {
            if (_timerInterval) {
                clearInterval(_timerInterval);
                _timerInterval = null;
            }

            closeCompleteJobDialog();
            showCompletionSummary(_currentJobId);
        }
    }

    /**
     * Show completion summary
     */
    function showCompletionSummary(jobId) {
        var job = window.JobManager.getJob(jobId);
        if (!job) return;

        var metrics = job.learningMetrics;

        var summary = 'Job Completed!\n\n';
        summary += 'Job #' + job.jobNumber + '\n';
        summary += 'Client: ' + job.client.name + '\n\n';

        summary += 'Time: ' + job.schedule.actualDuration + ' minutes\n';
        summary += 'Original Quote: $' + job.adjustments.originalTotal.toFixed(2) + '\n';
        summary += 'Final Amount: $' + job.actual.total.toFixed(2) + '\n';

        if (job.actual.total !== job.adjustments.originalTotal) {
            var diff = job.actual.total - job.adjustments.originalTotal;
            summary += 'Adjustment: ' + (diff > 0 ? '+' : '') + '$' + diff.toFixed(2) + '\n';
        }

        summary += '\nLearning Insights:\n';
        if (metrics && metrics.improvements) {
            for (var i = 0; i < metrics.improvements.length; i++) {
                summary += '• ' + metrics.improvements[i] + '\n';
            }
        }

        summary += '\nGenerate invoice now?';

        if (confirm(summary)) {
            generateJobInvoice(jobId);
        } else {
            if (window.navigateTo) {
                window.navigateTo('jobs');
            }
        }
    }

    /**
     * Generate invoice from job
     */
    function generateJobInvoice(jobId) {
        var invoice = window.JobManager.generateInvoice(jobId);

        if (invoice) {
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Invoice generated!', 'success');
            }

            setTimeout(function() {
                if (window.navigateTo) {
                    window.navigateTo('invoices');
                }
            }, 1000);
        } else {
            alert('Failed to generate invoice');
        }
    }

    /**
     * Take before photo - global function for quick action button
     */
    function takeBeforePhoto() {
        if (!_currentJobId) {
            alert('No active job');
            return;
        }

        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';

        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                var photo = window.JobManager.addPhoto(
                    _currentJobId,
                    'before',
                    event.target.result,
                    '',
                    'Before photo'
                );

                if (photo) {
                    if (window.UIComponents && window.UIComponents.showToast) {
                        window.UIComponents.showToast('Before photo added', 'success');
                    }
                    var job = window.JobManager.getJob(_currentJobId);
                    if (job) {
                        renderPhotos(job);
                    }
                }
            };
            reader.readAsDataURL(file);
        });

        input.click();
    }

    /**
     * Take after photo - global function for quick action button
     */
    function takeAfterPhoto() {
        if (!_currentJobId) {
            alert('No active job');
            return;
        }

        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';

        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                var photo = window.JobManager.addPhoto(
                    _currentJobId,
                    'after',
                    event.target.result,
                    '',
                    'After photo'
                );

                if (photo) {
                    if (window.UIComponents && window.UIComponents.showToast) {
                        window.UIComponents.showToast('After photo added', 'success');
                    }
                    var job = window.JobManager.getJob(_currentJobId);
                    if (job) {
                        renderPhotos(job);
                    }
                }
            };
            reader.readAsDataURL(file);
        });

        input.click();
    }

    /**
     * Record job issue - global function for quick action button
     */
    function recordJobIssue() {
        if (!_currentJobId) {
            alert('No active job');
            return;
        }

        var description = prompt('Describe the issue:');
        if (!description) return;

        var severityInput = prompt('Severity (low, medium, high):');
        var severity = severityInput || 'medium';

        var issue = window.JobManager.recordIssue(_currentJobId, {
            type: 'other',
            severity: severity,
            description: description,
            impact: '',
            resolution: ''
        });

        if (issue) {
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Issue recorded', 'info');
            }
            var job = window.JobManager.getJob(_currentJobId);
            if (job) {
                renderIssuesAndNotes(job);
            }
        }
    }

    /**
     * Add job note - global function for quick action button
     */
    function addJobNote() {
        if (!_currentJobId) {
            alert('No active job');
            return;
        }

        var noteText = prompt('Enter note:');
        if (!noteText) return;

        var note = window.JobManager.addNote(_currentJobId, noteText, 'general');

        if (note) {
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Note added', 'success');
            }
            var job = window.JobManager.getJob(_currentJobId);
            if (job) {
                renderIssuesAndNotes(job);
            }
        }
    }

    /**
     * Add scope change (extra work) - global function for quick action button
     */
    function addScopeChange() {
        if (!_currentJobId) {
            alert('No active job');
            return;
        }

        var description = prompt('Describe additional work:');
        if (!description) return;

        var priceInput = prompt('Additional price ($):');
        var price = parseFloat(priceInput) || 0;

        var timeInput = prompt('Additional time (minutes):');
        var time = parseInt(timeInput) || 0;

        var workItem = window.JobManager.addAdditionalWork(_currentJobId, {
            description: description,
            price: price,
            estimatedTime: time
        });

        if (workItem) {
            if (window.UIComponents && window.UIComponents.showToast) {
                window.UIComponents.showToast('Extra work added: +$' + price.toFixed(2), 'success');
            }
            var job = window.JobManager.getJob(_currentJobId);
            if (job) {
                renderWorkItems(job);
                updatePricingDisplay(job);
            }
        }
    }

    /**
     * Update difficulty rating - global function for quick action button
     */
    function updateDifficulty() {
        if (!_currentJobId) {
            alert('No active job');
            return;
        }

        var difficultyInput = prompt('Rate job difficulty (easy, normal, hard, very_hard):');
        if (!difficultyInput) return;

        var difficulty = difficultyInput.toLowerCase();
        var validDifficulties = ['easy', 'normal', 'hard', 'very_hard'];

        if (validDifficulties.indexOf(difficulty) === -1) {
            alert('Invalid difficulty. Please use: easy, normal, hard, or very_hard');
            return;
        }

        var job = window.JobManager.getJob(_currentJobId);
        if (!job) return;

        // Update all work items with new difficulty
        for (var i = 0; i < job.actual.items.length; i++) {
            job.actual.items[i].actualDifficulty = difficulty;
        }

        window.JobManager.saveJob(job);

        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Difficulty updated to: ' + difficulty, 'success');
        }

        renderWorkItems(job);
    }

    /**
     * Render jobs list page
     */
    function renderJobsList(filterStatus) {
        var container = document.getElementById('jobs-list-container');
        if (!container) return;

        var jobs = window.JobManager.getAllJobs();

        // Filter if specified
        if (filterStatus && filterStatus !== 'all') {
            var filtered = [];
            for (var i = 0; i < jobs.length; i++) {
                if (jobs[i].status === filterStatus) {
                    filtered.push(jobs[i]);
                }
            }
            jobs = filtered;
        }

        // Sort by created date (newest first)
        jobs.sort(function(a, b) {
            return new Date(b.createdDate) - new Date(a.createdDate);
        });

        if (jobs.length === 0) {
            container.innerHTML = '<p class="text-muted">No jobs found.</p>';
            return;
        }

        var html = '<div class="jobs-list">';

        for (var i = 0; i < jobs.length; i++) {
            var job = jobs[i];
            var statusClass = 'status-' + job.status;

            html += '<div class="job-card" onclick="JobTrackingUI.openJob(\'' + job.id + '\')">';

            // Job header
            html += '<div class="job-card-header">';
            html += '<div class="job-number">' + job.jobNumber + '</div>';
            html += '<span class="badge ' + statusClass + '">' + formatStatusLabel(job.status) + '</span>';
            html += '</div>';

            // Job info
            html += '<div class="job-card-body">';
            html += '<div class="job-client">';
            html += '<strong>' + (job.client.name || 'Unnamed Client') + '</strong>';
            html += '</div>';
            html += '<div class="job-address">' + (job.client.address || 'No address') + '</div>';

            // Job details
            html += '<div class="job-details">';
            if (job.schedule.scheduledDate) {
                var schedDate = new Date(job.schedule.scheduledDate);
                html += '<div class="job-detail">';
                html += '<span class="detail-label">Scheduled:</span> ';
                html += schedDate.toLocaleDateString() + ' ' + schedDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                html += '</div>';
            }
            if (job.schedule.actualDuration) {
                html += '<div class="job-detail">';
                html += '<span class="detail-label">Duration:</span> ' + job.schedule.actualDuration + ' min';
                html += '</div>';
            }
            html += '<div class="job-detail">';
            html += '<span class="detail-label">Value:</span> $' + (job.actual.total || job.estimate.total || 0).toFixed(2);
            html += '</div>';
            html += '</div>';

            html += '</div>';

            // Job actions
            html += '<div class="job-card-footer">';
            if (job.status === 'scheduled') {
                html += '<button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); JobTrackingUI.openJob(\'' + job.id + '\')">Start Job</button>';
            } else if (job.status === 'in-progress') {
                html += '<button class="btn btn-sm btn-success" onclick="event.stopPropagation(); JobTrackingUI.openJob(\'' + job.id + '\')">Continue</button>';
            } else if (job.status === 'completed' && !job.invoiceGenerated) {
                html += '<button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); generateJobInvoiceFromList(\'' + job.id + '\')">Generate Invoice</button>';
            }
            html += '</div>';

            html += '</div>';
        }

        html += '</div>';

        container.innerHTML = html;

        // Update summary cards
        updateJobsSummary();
    }

    /**
     * Update jobs summary cards
     */
    function updateJobsSummary() {
        var jobs = window.JobManager.getAllJobs();

        var scheduledCount = 0;
        var inProgressCount = 0;
        var completedCount = 0;
        var totalRevenue = 0;

        for (var i = 0; i < jobs.length; i++) {
            var job = jobs[i];

            if (job.status === 'scheduled') scheduledCount++;
            if (job.status === 'in-progress') inProgressCount++;
            if (job.status === 'completed' || job.status === 'invoiced') {
                completedCount++;
                totalRevenue += job.actual.total || 0;
            }
        }

        var scheduledEl = document.getElementById('jobs-count-scheduled');
        var inProgressEl = document.getElementById('jobs-count-in-progress');
        var completedEl = document.getElementById('jobs-count-completed');
        var revenueEl = document.getElementById('jobs-total-revenue');

        if (scheduledEl) scheduledEl.textContent = scheduledCount;
        if (inProgressEl) inProgressEl.textContent = inProgressCount;
        if (completedEl) completedEl.textContent = completedCount;
        if (revenueEl) revenueEl.textContent = '$' + totalRevenue.toFixed(2);
    }

    /**
     * Filter jobs by status
     */
    function filterJobs(status) {
        // Update active tab
        var tabs = document.querySelectorAll('.filter-tab');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
            var tabText = tabs[i].textContent.toLowerCase().trim();
            var statusMatch = (status === 'all' && tabText === 'all') ||
                            (status === 'scheduled' && tabText === 'scheduled') ||
                            (status === 'in-progress' && tabText === 'in progress') ||
                            (status === 'completed' && tabText === 'completed') ||
                            (status === 'invoiced' && tabText === 'invoiced');
            if (statusMatch) {
                tabs[i].classList.add('active');
            }
        }

        renderJobsList(status);
    }

    /**
     * Format status label for display
     */
    function formatStatusLabel(status) {
        if (status === 'in-progress') return 'In Progress';
        if (status === 'scheduled') return 'Scheduled';
        if (status === 'completed') return 'Completed';
        if (status === 'invoiced') return 'Invoiced';
        return status;
    }

    /**
     * Initialize jobs page
     */
    function initJobsPage() {
        renderJobsList('all');
        updateJobsSummary();
    }

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('jobTrackingUI', {
            init: init,
            openJob: openJob,
            editWorkItem: editWorkItem,
            viewPhoto: viewPhoto,
            showPhotoCategory: showPhotoCategory,
            renderJobsList: renderJobsList,
            filterJobs: filterJobs,
            initJobsPage: initJobsPage
        });
    }

    // Global API
    window.JobTrackingUI = {
        init: init,
        openJob: openJob,
        editWorkItem: editWorkItem,
        viewPhoto: viewPhoto,
        showPhotoCategory: showPhotoCategory,
        startJobTracking: startJobTracking,
        pauseJobTracking: pauseJobTracking,
        showCompleteJobDialog: showCompleteJobDialog,
        closeCompleteJobDialog: closeCompleteJobDialog,
        setRating: setRating,
        finalizeJobCompletion: finalizeJobCompletion,
        renderJobsList: renderJobsList,
        filterJobs: filterJobs,
        initJobsPage: initJobsPage,
        _currentJobId: _currentJobId
    };

    // Export job function buttons globally for HTML onclick handlers
    window.takeBeforePhoto = takeBeforePhoto;
    window.takeAfterPhoto = takeAfterPhoto;
    window.recordJobIssue = recordJobIssue;
    window.addJobNote = addJobNote;
    window.addScopeChange = addScopeChange;
    window.updateDifficulty = updateDifficulty;

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[JOB-TRACKING-UI] Module initialized');
})();
