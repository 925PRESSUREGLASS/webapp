// job-manager.js - Job Tracking & Management System
// Dependencies: storage.js, app.js
// iOS Safari 12+ compatible (ES5 only - no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    var STORAGE_KEY = 'tts_jobs';
    var METRICS_KEY = 'tts_job_metrics';
    var JOB_NUMBER_KEY = 'tts_last_job_number';

    /**
     * Create job from quote
     */
    function createFromQuote(quoteId, scheduledDate) {
        // Load quote from storage
        var savedQuotes = Storage.get('tictacstick_saved_quotes_v1') || [];
        var quote = null;

        for (var i = 0; i < savedQuotes.length; i++) {
            if (savedQuotes[i].id === quoteId) {
                quote = savedQuotes[i];
                break;
            }
        }

        if (!quote) {
            console.error('[JOB-MANAGER] Quote not found:', quoteId);
            return null;
        }

        var estimatedDuration = estimateJobDuration(quote);

        var job = {
            id: generateId('job'),
            jobNumber: generateJobNumber(),
            quoteId: quoteId,
            contractId: quote.contractId || null,

            client: {
                id: quote.clientId || null,
                name: quote.clientName || '',
                phone: quote.clientPhone || '',
                email: quote.clientEmail || '',
                address: quote.clientLocation || ''
            },

            status: 'scheduled',

            schedule: {
                scheduledDate: scheduledDate || new Date().toISOString(),
                startTime: null,
                endTime: null,
                technician: getCurrentUser(),
                estimatedDuration: estimatedDuration,
                actualDuration: null
            },

            estimate: {
                items: buildEstimateItems(quote),
                subtotal: quote.subtotal || 0,
                gst: quote.gst || 0,
                total: quote.total || 0
            },

            actual: {
                items: [],
                additionalWork: [],
                subtotal: 0,
                gst: 0,
                total: 0
            },

            timeLog: [],

            photos: {
                before: [],
                during: [],
                after: [],
                issues: []
            },

            issues: [],
            notes: [],

            completion: {
                completedDate: null,
                clientSignature: null,
                clientRating: null,
                clientFeedback: '',
                photosShownToClient: false,
                warrantyIssued: false,
                followUpRequired: false
            },

            adjustments: {
                reason: '',
                originalTotal: quote.total || 0,
                adjustedTotal: 0,
                difference: 0,
                approved: false,
                approvedBy: null,
                approvalMethod: null,
                approvalTimestamp: null
            },

            learningMetrics: null,

            invoiceId: null,
            invoiceGenerated: false,
            invoiceSent: false,

            createdDate: new Date().toISOString(),
            createdBy: getCurrentUser(),
            modifiedDate: new Date().toISOString(),
            modifiedBy: getCurrentUser()
        };

        saveJob(job);

        console.log('[JOB-MANAGER] Job created:', job.jobNumber);
        return job;
    }

    /**
     * Build estimate items from quote
     */
    function buildEstimateItems(quote) {
        var items = [];

        // Add window lines
        if (quote.windowLines && quote.windowLines.length > 0) {
            for (var i = 0; i < quote.windowLines.length; i++) {
                var line = quote.windowLines[i];
                items.push({
                    description: 'Window cleaning - ' + line.type + ' (' + line.quantity + ' windows)',
                    quantity: line.quantity || 1,
                    unitPrice: (line.subtotal || 0) / (line.quantity || 1),
                    estimatedTime: line.totalMinutes || 0,
                    difficulty: 'normal',
                    total: line.subtotal || 0,
                    serviceType: 'windows'
                });
            }
        }

        // Add pressure lines
        if (quote.pressureLines && quote.pressureLines.length > 0) {
            for (var i = 0; i < quote.pressureLines.length; i++) {
                var line = quote.pressureLines[i];
                items.push({
                    description: 'Pressure cleaning - ' + line.surface + ' (' + line.area + ' sqm)',
                    quantity: line.area || 1,
                    unitPrice: (line.subtotal || 0) / (line.area || 1),
                    estimatedTime: line.totalMinutes || 0,
                    difficulty: 'normal',
                    total: line.subtotal || 0,
                    serviceType: 'pressure'
                });
            }
        }

        return items;
    }

    /**
     * Estimate job duration based on quote
     */
    function estimateJobDuration(quote) {
        var totalMinutes = 0;

        if (quote.windowLines) {
            for (var i = 0; i < quote.windowLines.length; i++) {
                totalMinutes += quote.windowLines[i].totalMinutes || 0;
            }
        }

        if (quote.pressureLines) {
            for (var i = 0; i < quote.pressureLines.length; i++) {
                totalMinutes += quote.pressureLines[i].totalMinutes || 0;
            }
        }

        return totalMinutes || 60; // Minimum 60 minutes
    }

    /**
     * Start job
     */
    function startJob(jobId) {
        var job = getJob(jobId);
        if (!job) return false;

        var now = new Date().toISOString();

        job.status = 'in-progress';
        job.schedule.startTime = now;

        addTimeLog(job, 'job-started', 'Job started on site');

        saveJob(job);

        console.log('[JOB-MANAGER] Job started:', job.jobNumber);
        return true;
    }

    /**
     * Add time log entry
     */
    function addTimeLog(job, event, note, data) {
        job.timeLog.push({
            timestamp: new Date().toISOString(),
            event: event,
            note: note || '',
            data: data || {}
        });

        job.modifiedDate = new Date().toISOString();
    }

    /**
     * Add photo to job
     */
    function addPhoto(jobId, photoType, photoData, location, notes) {
        var job = getJob(jobId);
        if (!job) return false;

        var photo = {
            id: generateId('photo'),
            timestamp: new Date().toISOString(),
            location: location || '',
            image: photoData,
            thumbnail: photoData, // In production, create actual thumbnail
            notes: notes || ''
        };

        if (photoType === 'before') {
            job.photos.before.push(photo);
        } else if (photoType === 'after') {
            job.photos.after.push(photo);
        } else if (photoType === 'during') {
            job.photos.during.push(photo);
        } else if (photoType === 'issue') {
            job.photos.issues.push(photo);
        }

        addTimeLog(job, 'photo-added', 'Photo added: ' + photoType);

        saveJob(job);

        console.log('[JOB-MANAGER] Photo added:', photoType);
        return photo;
    }

    /**
     * Record issue during job
     */
    function recordIssue(jobId, issueData) {
        var job = getJob(jobId);
        if (!job) return false;

        var issue = {
            id: generateId('issue'),
            type: issueData.type || 'other',
            severity: issueData.severity || 'medium',
            description: issueData.description || '',
            impact: issueData.impact || '',
            resolution: issueData.resolution || '',
            timestamp: new Date().toISOString()
        };

        job.issues.push(issue);

        addTimeLog(job, 'issue-found', issue.description, issue);

        saveJob(job);

        console.log('[JOB-MANAGER] Issue recorded:', issue.description);
        return issue;
    }

    /**
     * Add note to job
     */
    function addNote(jobId, noteText, noteType) {
        var job = getJob(jobId);
        if (!job) return false;

        var note = {
            timestamp: new Date().toISOString(),
            note: noteText,
            type: noteType || 'general'
        };

        job.notes.push(note);
        saveJob(job);

        return note;
    }

    /**
     * Add additional work
     */
    function addAdditionalWork(jobId, workItem, clientApproved) {
        var job = getJob(jobId);
        if (!job) return false;

        var item = {
            id: generateId('work'),
            description: workItem.description,
            quantity: workItem.quantity || 1,
            unitPrice: workItem.unitPrice || 0,
            time: workItem.time || 0,
            approved: clientApproved || false,
            approvalTimestamp: clientApproved ? new Date().toISOString() : null,
            total: (workItem.quantity || 1) * (workItem.unitPrice || 0)
        };

        job.actual.additionalWork.push(item);

        recalculateJobTotals(job);

        addTimeLog(job, 'scope-change', 'Additional work: ' + item.description, item);

        saveJob(job);

        console.log('[JOB-MANAGER] Additional work added:', item.description);
        return item;
    }

    /**
     * Update item actual data
     */
    function updateItemActual(jobId, itemIndex, actualData) {
        var job = getJob(jobId);
        if (!job) return false;

        // Initialize actual items if needed
        if (job.actual.items.length === 0) {
            job.actual.items = JSON.parse(JSON.stringify(job.estimate.items));
        }

        var item = job.actual.items[itemIndex];
        if (!item) return false;

        // Update actual data
        if (actualData.actualTime !== undefined) {
            item.actualTime = actualData.actualTime;
        }

        if (actualData.actualDifficulty !== undefined) {
            item.actualDifficulty = actualData.actualDifficulty;
        }

        if (actualData.issues !== undefined) {
            item.issues = actualData.issues;
        }

        if (actualData.quantityCompleted !== undefined) {
            item.quantityCompleted = actualData.quantityCompleted;
        }

        if (actualData.adjustedPrice !== undefined) {
            item.adjustedPrice = actualData.adjustedPrice;
            item.total = (item.quantityCompleted || item.quantity) * item.adjustedPrice;
        }

        recalculateJobTotals(job);

        saveJob(job);

        return item;
    }

    /**
     * Recalculate job totals
     */
    function recalculateJobTotals(job) {
        var subtotal = 0;

        // Add actual items
        for (var i = 0; i < job.actual.items.length; i++) {
            subtotal += job.actual.items[i].total || 0;
        }

        // Add additional work (only approved)
        for (var i = 0; i < job.actual.additionalWork.length; i++) {
            if (job.actual.additionalWork[i].approved) {
                subtotal += job.actual.additionalWork[i].total || 0;
            }
        }

        var gst = subtotal * 0.1;
        var total = subtotal + gst;

        job.actual.subtotal = Math.round(subtotal * 100) / 100;
        job.actual.gst = Math.round(gst * 100) / 100;
        job.actual.total = Math.round(total * 100) / 100;

        job.adjustments.adjustedTotal = job.actual.total;
        job.adjustments.difference = job.actual.total - job.adjustments.originalTotal;

        return job.actual;
    }

    /**
     * Complete job
     */
    function completeJob(jobId, completionData) {
        var job = getJob(jobId);
        if (!job) return false;

        var now = new Date().toISOString();

        job.status = 'completed';
        job.schedule.endTime = now;

        // Calculate actual duration
        if (job.schedule.startTime) {
            var start = new Date(job.schedule.startTime);
            var end = new Date(now);
            job.schedule.actualDuration = Math.round((end - start) / 1000 / 60); // minutes
        }

        // Save completion details
        job.completion.completedDate = now;

        if (completionData) {
            if (completionData.clientRating) {
                job.completion.clientRating = completionData.clientRating;
            }
            if (completionData.clientFeedback) {
                job.completion.clientFeedback = completionData.clientFeedback;
            }
            if (completionData.clientSignature) {
                job.completion.clientSignature = completionData.clientSignature;
            }
            job.completion.photosShownToClient = completionData.photosShownToClient || false;
            job.completion.warrantyIssued = completionData.warrantyIssued || false;
            job.completion.followUpRequired = completionData.followUpRequired || false;
        }

        // Calculate learning metrics
        calculateLearningMetrics(job);

        addTimeLog(job, 'job-completed', 'Job completed');

        saveJob(job);

        // Update job metrics database
        updateJobMetrics(job);

        console.log('[JOB-MANAGER] Job completed:', job.jobNumber);
        return true;
    }

    /**
     * Calculate learning metrics
     */
    function calculateLearningMetrics(job) {
        var metrics = {
            estimateAccuracy: {},
            improvements: [],
            futureAdjustments: {}
        };

        // Time variance
        if (job.schedule.estimatedDuration && job.schedule.actualDuration) {
            var timeVariance = ((job.schedule.actualDuration - job.schedule.estimatedDuration) /
                               job.schedule.estimatedDuration) * 100;
            metrics.estimateAccuracy.timeVariance = Math.round(timeVariance);

            if (Math.abs(timeVariance) > 20) {
                if (timeVariance > 0) {
                    metrics.improvements.push('Job took ' + Math.abs(Math.round(timeVariance)) + '% longer than estimated');
                    metrics.futureAdjustments.baseTimeMultiplier = 1 + (timeVariance / 100);
                } else {
                    metrics.improvements.push('Job completed ' + Math.abs(Math.round(timeVariance)) + '% faster than estimated');
                }
            }
        }

        // Price variance
        if (job.adjustments.originalTotal && job.adjustments.adjustedTotal) {
            var priceVariance = ((job.adjustments.adjustedTotal - job.adjustments.originalTotal) /
                                job.adjustments.originalTotal) * 100;
            metrics.estimateAccuracy.priceVariance = Math.round(priceVariance * 10) / 10;

            if (Math.abs(priceVariance) > 10) {
                if (priceVariance > 0) {
                    metrics.improvements.push('Actual cost ' + Math.abs(Math.round(priceVariance)) + '% higher than quoted');
                    metrics.futureAdjustments.scopeBuffer = Math.round(job.adjustments.difference);
                }
            }
        }

        // Difficulty variance
        var difficultyVariances = 0;
        var itemCount = 0;
        var diffLevels = { easy: 1, normal: 2, hard: 3, 'very-hard': 4 };

        for (var i = 0; i < job.actual.items.length; i++) {
            var actualItem = job.actual.items[i];
            var estimateItem = job.estimate.items[i];

            if (actualItem.actualDifficulty && estimateItem.difficulty) {
                var variance = diffLevels[actualItem.actualDifficulty] - diffLevels[estimateItem.difficulty];
                difficultyVariances += variance;
                itemCount++;
            }
        }

        if (itemCount > 0) {
            var avgDifficultyVariance = difficultyVariances / itemCount;
            metrics.estimateAccuracy.difficultyVariance = Math.round(avgDifficultyVariance * 10) / 10;

            if (avgDifficultyVariance > 0.5) {
                metrics.improvements.push('Work was significantly harder than estimated');
                metrics.futureAdjustments.difficultyUpgrade = true;
            }
        }

        // Issues analysis
        if (job.issues.length > 0) {
            var issueTypes = {};
            for (var i = 0; i < job.issues.length; i++) {
                var type = job.issues[i].type;
                issueTypes[type] = (issueTypes[type] || 0) + 1;
            }

            for (var type in issueTypes) {
                if (issueTypes.hasOwnProperty(type)) {
                    metrics.improvements.push('Encountered ' + issueTypes[type] + ' ' + type + ' issue(s)');
                }
            }
        }

        job.learningMetrics = metrics;
    }

    /**
     * Update job metrics database
     */
    function updateJobMetrics(job) {
        var metrics = loadJobMetrics();

        if (!metrics.jobCount) metrics.jobCount = 0;
        if (!metrics.totalTime) metrics.totalTime = 0;
        if (!metrics.totalRevenue) metrics.totalRevenue = 0;

        metrics.jobCount++;
        metrics.totalTime += job.schedule.actualDuration || 0;
        metrics.totalRevenue += job.actual.total || 0;

        metrics.avgJobDuration = Math.round(metrics.totalTime / metrics.jobCount);
        metrics.avgJobValue = Math.round(metrics.totalRevenue / metrics.jobCount);

        // Track by service type
        if (!metrics.byServiceType) metrics.byServiceType = {};

        for (var i = 0; i < job.actual.items.length; i++) {
            var item = job.actual.items[i];
            var serviceType = item.serviceType ||
                             (item.description.toLowerCase().indexOf('window') > -1 ? 'windows' : 'pressure');

            if (!metrics.byServiceType[serviceType]) {
                metrics.byServiceType[serviceType] = {
                    count: 0,
                    totalTime: 0,
                    totalQuantity: 0
                };
            }

            metrics.byServiceType[serviceType].count++;
            metrics.byServiceType[serviceType].totalTime += item.actualTime || 0;
            metrics.byServiceType[serviceType].totalQuantity += item.quantityCompleted || item.quantity || 0;
        }

        // Calculate per-unit averages
        if (metrics.byServiceType.windows && metrics.byServiceType.windows.totalQuantity > 0) {
            metrics.avgTimePerWindow = Math.round(
                metrics.byServiceType.windows.totalTime /
                metrics.byServiceType.windows.totalQuantity
            );
        }

        if (metrics.byServiceType.pressure && metrics.byServiceType.pressure.totalQuantity > 0) {
            metrics.avgTimePerSqm = Math.round(
                metrics.byServiceType.pressure.totalTime /
                metrics.byServiceType.pressure.totalQuantity * 10
            ) / 10;
        }

        // Track difficulty multipliers
        if (!metrics.difficultyMultipliers) {
            metrics.difficultyMultipliers = {
                easy: 0.8,
                normal: 1.0,
                hard: 1.3,
                'very-hard': 1.6
            };
        }

        saveJobMetrics(metrics);

        console.log('[JOB-MANAGER] Metrics updated');
    }

    /**
     * Generate invoice from completed job
     */
    function generateInvoice(jobId) {
        var job = getJob(jobId);
        if (!job) {
            console.error('[JOB-MANAGER] Job not found for invoice generation');
            return null;
        }

        if (job.status !== 'completed') {
            console.error('[JOB-MANAGER] Job must be completed before generating invoice');
            return null;
        }

        // Check if InvoiceSystem is available
        if (!window.InvoiceSystem || !window.InvoiceSystem.createInvoice) {
            console.error('[JOB-MANAGER] InvoiceSystem not available');
            return null;
        }

        // Build invoice data
        var invoiceData = {
            clientName: job.client.name,
            clientEmail: job.client.email,
            clientPhone: job.client.phone,
            clientAddress: job.client.address,
            items: [],
            notes: '',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
            jobId: job.id,
            jobNumber: job.jobNumber
        };

        // Add actual items
        for (var i = 0; i < job.actual.items.length; i++) {
            var item = job.actual.items[i];
            invoiceData.items.push({
                description: item.description,
                quantity: item.quantityCompleted || item.quantity,
                unitPrice: item.adjustedPrice || item.unitPrice,
                total: item.total
            });
        }

        // Add additional work
        for (var i = 0; i < job.actual.additionalWork.length; i++) {
            var work = job.actual.additionalWork[i];
            if (work.approved) {
                invoiceData.items.push({
                    description: work.description + ' (Additional)',
                    quantity: work.quantity,
                    unitPrice: work.unitPrice,
                    total: work.total
                });
            }
        }

        // Add notes
        if (job.adjustments.difference !== 0) {
            invoiceData.notes = 'Note: Final amount adjusted from original quote ($' +
                               job.adjustments.originalTotal.toFixed(2) + ') based on actual work completed.\n\n';
        }

        if (job.completion.clientFeedback) {
            invoiceData.notes += 'Client feedback: ' + job.completion.clientFeedback;
        }

        // Create invoice
        var invoice = window.InvoiceSystem.createInvoice(invoiceData);

        if (invoice) {
            // Link invoice to job
            job.invoiceId = invoice.id;
            job.invoiceGenerated = true;
            job.status = 'invoiced';

            saveJob(job);

            console.log('[JOB-MANAGER] Invoice generated:', invoice.invoiceNumber);
        }

        return invoice;
    }

    /**
     * Save job
     */
    function saveJob(job) {
        try {
            job.modifiedDate = new Date().toISOString();

            var jobs = getAllJobs();
            var found = false;

            for (var i = 0; i < jobs.length; i++) {
                if (jobs[i].id === job.id) {
                    jobs[i] = job;
                    found = true;
                    break;
                }
            }

            if (!found) {
                jobs.push(job);
            }

            localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
            return true;
        } catch (e) {
            console.error('[JOB-MANAGER] Failed to save job:', e);
            return false;
        }
    }

    /**
     * Get job by ID
     */
    function getJob(jobId) {
        var jobs = getAllJobs();
        for (var i = 0; i < jobs.length; i++) {
            if (jobs[i].id === jobId) {
                return jobs[i];
            }
        }
        return null;
    }

    /**
     * Get all jobs
     */
    function getAllJobs() {
        try {
            var data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('[JOB-MANAGER] Failed to load jobs:', e);
            return [];
        }
    }

    /**
     * Get jobs by status
     */
    function getJobsByStatus(status) {
        var jobs = getAllJobs();
        var filtered = [];
        for (var i = 0; i < jobs.length; i++) {
            if (jobs[i].status === status) {
                filtered.push(jobs[i]);
            }
        }
        return filtered;
    }

    /**
     * Load job metrics
     */
    function loadJobMetrics() {
        try {
            var data = localStorage.getItem(METRICS_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('[JOB-MANAGER] Failed to load metrics:', e);
            return {};
        }
    }

    /**
     * Save job metrics
     */
    function saveJobMetrics(metrics) {
        try {
            localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
            return true;
        } catch (e) {
            console.error('[JOB-MANAGER] Failed to save metrics:', e);
            return false;
        }
    }

    /**
     * Generate job number
     */
    function generateJobNumber() {
        var lastNumber = parseInt(localStorage.getItem(JOB_NUMBER_KEY) || '0');
        var nextNumber = lastNumber + 1;
        localStorage.setItem(JOB_NUMBER_KEY, String(nextNumber));
        return 'JOB-' + String(nextNumber).padStart(4, '0');
    }

    /**
     * Generate ID
     */
    function generateId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current user
     */
    function getCurrentUser() {
        // Try to get from global config
        if (window.COMPANY_CONFIG && window.COMPANY_CONFIG.ownerName) {
            return window.COMPANY_CONFIG.ownerName;
        }
        return 'User';
    }

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('jobManager', {
            createFromQuote: createFromQuote,
            startJob: startJob,
            completeJob: completeJob,
            addPhoto: addPhoto,
            recordIssue: recordIssue,
            addNote: addNote,
            addAdditionalWork: addAdditionalWork,
            updateItemActual: updateItemActual,
            generateInvoice: generateInvoice,
            getJob: getJob,
            getAllJobs: getAllJobs,
            getJobsByStatus: getJobsByStatus,
            saveJob: saveJob,
            loadJobMetrics: loadJobMetrics
        });
    }

    // Global API
    window.JobManager = {
        createFromQuote: createFromQuote,
        startJob: startJob,
        completeJob: completeJob,
        addPhoto: addPhoto,
        recordIssue: recordIssue,
        addNote: addNote,
        addAdditionalWork: addAdditionalWork,
        updateItemActual: updateItemActual,
        generateInvoice: generateInvoice,
        getJob: getJob,
        getAllJobs: getAllJobs,
        getJobsByStatus: getJobsByStatus,
        saveJob: saveJob,
        loadJobMetrics: loadJobMetrics
    };

    console.log('[JOB-MANAGER] Module initialized');
})();
