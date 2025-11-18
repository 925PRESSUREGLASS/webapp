// photo-comparison.js - Before/After Photo Comparison Tool
// Dependencies: job-manager.js
// iOS Safari 12+ compatible (ES5 only - no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    /**
     * Create comparison image for job
     */
    function createComparisonImage(jobId, location) {
        var job = window.JobManager.getJob(jobId);
        if (!job) return null;

        // Find matching before/after photos
        var beforePhoto = findPhotoByLocation(job.photos.before, location);
        var afterPhoto = findPhotoByLocation(job.photos.after, location);

        if (!beforePhoto || !afterPhoto) {
            console.error('[PHOTO-COMPARISON] Missing before or after photo for location:', location);
            return null;
        }

        // Create canvas for side-by-side comparison
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        // Set canvas size (2 photos side by side)
        canvas.width = 1200;
        canvas.height = 600;

        // Load images
        var beforeImg = new Image();
        var afterImg = new Image();

        return new Promise(function(resolve, reject) {
            var imagesLoaded = 0;

            function checkBothLoaded() {
                imagesLoaded++;
                if (imagesLoaded === 2) {
                    drawComparison();
                }
            }

            function drawComparison() {
                // White background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw before image (left side)
                ctx.drawImage(beforeImg, 0, 80, 580, 435);

                // Draw after image (right side)
                ctx.drawImage(afterImg, 620, 80, 580, 435);

                // Add labels
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'center';

                ctx.fillText('BEFORE', 290, 50);
                ctx.fillText('AFTER', 910, 50);

                // Add location label
                ctx.font = '24px Arial';
                ctx.fillText(location || 'Job Photos', 600, 580);

                // Add border
                ctx.strokeStyle = '#e5e7eb';
                ctx.lineWidth = 2;
                ctx.strokeRect(0, 0, canvas.width, canvas.height);

                // Convert to data URL
                var dataUrl = canvas.toDataURL('image/jpeg', 0.9);

                resolve({
                    dataUrl: dataUrl,
                    location: location,
                    beforePhoto: beforePhoto,
                    afterPhoto: afterPhoto
                });
            }

            beforeImg.onload = checkBothLoaded;
            beforeImg.onerror = function() {
                reject(new Error('Failed to load before image'));
            };
            beforeImg.src = beforePhoto.image;

            afterImg.onload = checkBothLoaded;
            afterImg.onerror = function() {
                reject(new Error('Failed to load after image'));
            };
            afterImg.src = afterPhoto.image;
        });
    }

    /**
     * Find photo by location
     */
    function findPhotoByLocation(photos, location) {
        if (!photos || photos.length === 0) return null;

        // Try exact match first
        for (var i = 0; i < photos.length; i++) {
            if (photos[i].location === location) {
                return photos[i];
            }
        }

        // Try partial match
        for (var i = 0; i < photos.length; i++) {
            if (photos[i].location.toLowerCase().indexOf(location.toLowerCase()) > -1) {
                return photos[i];
            }
        }

        // Return first photo if no match
        return photos[0];
    }

    /**
     * Create all comparison images for job
     */
    function createAllComparisons(jobId) {
        var job = window.JobManager.getJob(jobId);
        if (!job) return Promise.resolve([]);

        // Get unique locations from before photos
        var locations = [];
        var beforePhotos = job.photos.before || [];

        for (var i = 0; i < beforePhotos.length; i++) {
            var location = beforePhotos[i].location;
            if (locations.indexOf(location) === -1) {
                locations.push(location);
            }
        }

        // Create comparison for each location
        var promises = [];
        for (var i = 0; i < locations.length; i++) {
            promises.push(createComparisonImage(jobId, locations[i]));
        }

        return Promise.all(promises);
    }

    /**
     * Add comparisons to invoice PDF (jsPDF)
     */
    function addComparisonsToInvoicePDF(pdf, comparisons, startY) {
        var y = startY || 50;

        for (var i = 0; i < comparisons.length; i++) {
            var comparison = comparisons[i];

            if (i > 0) {
                pdf.addPage();
                y = 50;
            }

            // Add title
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Before & After Comparison', 105, y, { align: 'center' });

            y += 10;

            // Add comparison image
            pdf.addImage(comparison.dataUrl, 'JPEG', 5, y, 200, 100);

            y += 110;

            // Add caption
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text(comparison.location, 105, y, { align: 'center' });
        }

        return pdf;
    }

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('photoComparison', {
            createComparisonImage: createComparisonImage,
            createAllComparisons: createAllComparisons,
            addComparisonsToInvoicePDF: addComparisonsToInvoicePDF
        });
    }

    // Global API
    window.PhotoComparison = {
        createComparisonImage: createComparisonImage,
        createAllComparisons: createAllComparisons,
        addComparisonsToInvoicePDF: addComparisonsToInvoicePDF
    };

    console.log('[PHOTO-COMPARISON] Module initialized');
})();
