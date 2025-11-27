// image-compression.js - Advanced Image Compression for TicTacStick
// Reduces base64 photo size by 80% (1MB → 200KB target)
// NO external libraries - pure Canvas API - works in iOS Safari 12+

(function() {
  'use strict';

  // ===================================
  // COMPRESSION SETTINGS
  // ===================================

  var COMPRESSION_PROFILES = {
    // Ultra compression for field photos (recommended)
    ultra: {
      maxDimension: 1200,      // Reduced from 1920
      quality: 0.75,            // Reduced from 0.85
      format: 'image/jpeg'
    },

    // High compression (good balance)
    high: {
      maxDimension: 1600,
      quality: 0.80,
      format: 'image/jpeg'
    },

    // Medium compression (better quality)
    medium: {
      maxDimension: 1920,
      quality: 0.85,
      format: 'image/jpeg'
    },

    // Thumbnail for gallery previews
    thumbnail: {
      maxDimension: 400,
      quality: 0.70,
      format: 'image/jpeg'
    }
  };

  // Default profile for field use
  var DEFAULT_PROFILE = 'ultra';

  // ===================================
  // CORE COMPRESSION FUNCTIONS
  // ===================================

  /**
   * Compress image with multiple optimization techniques
   *
   * @param {String} dataUrl - Base64 data URL of image
   * @param {Object} options - Compression options
   * @param {Function} callback - function(compressedDataUrl, compressionStats)
   */
  function compressImage(dataUrl, options, callback) {
    // Merge options with profile defaults
    var profile = options.profile || DEFAULT_PROFILE;
    var settings = COMPRESSION_PROFILES[profile] || COMPRESSION_PROFILES[DEFAULT_PROFILE];

    var config = {
      maxDimension: options.maxDimension || settings.maxDimension,
      quality: options.quality || settings.quality,
      format: options.format || settings.format
    };

    // Load image
    var img = new Image();

    img.onload = function() {
      try {
        var result = processImage(img, config, dataUrl);
        callback(result.dataUrl, result.stats);
      } catch (error) {
        console.error('Compression failed:', error);
        callback(dataUrl, { error: error.message });
      }
    };

    img.onerror = function() {
      console.error('Failed to load image for compression');
      callback(dataUrl, { error: 'Image load failed' });
    };

    img.src = dataUrl;
  }

  /**
   * Process image with canvas
   * @private
   */
  function processImage(img, config, originalDataUrl) {
    var startTime = performance.now();
    var originalSize = originalDataUrl.length;

    // Create canvas
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    // Calculate new dimensions
    var dimensions = calculateDimensions(img.width, img.height, config.maxDimension);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw image with antialiasing
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    // Convert to compressed format
    var compressedDataUrl = canvas.toDataURL(config.format, config.quality);
    var compressedSize = compressedDataUrl.length;

    var endTime = performance.now();

    // Calculate statistics
    var stats = {
      originalSize: formatBytes(originalSize),
      compressedSize: formatBytes(compressedSize),
      originalSizeBytes: originalSize,
      compressedSizeBytes: compressedSize,
      savings: formatBytes(originalSize - compressedSize),
      savingsPercent: (((originalSize - compressedSize) / originalSize) * 100).toFixed(1),
      compressionRatio: (originalSize / compressedSize).toFixed(2),
      originalDimensions: img.width + 'x' + img.height,
      compressedDimensions: dimensions.width + 'x' + dimensions.height,
      compressionTime: (endTime - startTime).toFixed(2) + 'ms',
      quality: config.quality,
      format: config.format
    };

    return {
      dataUrl: compressedDataUrl,
      stats: stats
    };
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   * @private
   */
  function calculateDimensions(width, height, maxDimension) {
    // If image is already smaller, don't upscale
    if (width <= maxDimension && height <= maxDimension) {
      return { width: width, height: height };
    }

    var ratio = width / height;

    if (width > height) {
      // Landscape
      return {
        width: maxDimension,
        height: Math.round(maxDimension / ratio)
      };
    } else {
      // Portrait
      return {
        width: Math.round(maxDimension * ratio),
        height: maxDimension
      };
    }
  }

  /**
   * Format bytes to human readable
   * @private
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
  }

  // ===================================
  // BATCH COMPRESSION
  // ===================================

  /**
   * Compress multiple images in sequence
   *
   * @param {Array} dataUrls - Array of base64 data URLs
   * @param {Object} options - Compression options
   * @param {Function} progressCallback - function(index, total, stats)
   * @param {Function} completeCallback - function(results)
   */
  function compressMultiple(dataUrls, options, progressCallback, completeCallback) {
    var results = [];
    var index = 0;

    function processNext() {
      if (index >= dataUrls.length) {
        // All done
        completeCallback(results);
        return;
      }

      var currentUrl = dataUrls[index];

      compressImage(currentUrl, options, function(compressedUrl, stats) {
        results.push({
          original: currentUrl,
          compressed: compressedUrl,
          stats: stats
        });

        if (progressCallback) {
          progressCallback(index + 1, dataUrls.length, stats);
        }

        index++;
        processNext();
      });
    }

    processNext();
  }

  // ===================================
  // PROGRESSIVE COMPRESSION
  // ===================================

  /**
   * Try multiple quality levels to hit target size
   *
   * @param {String} dataUrl - Base64 data URL
   * @param {Number} targetSizeKB - Target size in KB (e.g., 200)
   * @param {Function} callback - function(compressedDataUrl, stats)
   */
  function compressToTargetSize(dataUrl, targetSizeKB, callback) {
    var targetBytes = targetSizeKB * 1024;
    var qualityLevels = [0.75, 0.70, 0.65, 0.60, 0.55, 0.50];
    var index = 0;

    function tryQuality() {
      if (index >= qualityLevels.length) {
        // Couldn't hit target, return best attempt
        callback(lastResult.dataUrl, lastResult.stats);
        return;
      }

      var quality = qualityLevels[index];

      compressImage(dataUrl, { quality: quality, profile: 'ultra' }, function(compressed, stats) {
        lastResult = { dataUrl: compressed, stats: stats };

        if (stats.compressedSizeBytes <= targetBytes) {
          // Hit target!
          callback(compressed, stats);
        } else {
          // Try lower quality
          index++;
          tryQuality();
        }
      });
    }

    var lastResult = null;
    tryQuality();
  }

  // ===================================
  // FILE INPUT HANDLER
  // ===================================

  /**
   * Handle file input and compress before adding to state
   *
   * @param {FileList} files - Files from input element
   * @param {Object} options - Compression options
   * @param {Function} callback - function(compressedImages, totalStats)
   */
  function handleFileInput(files, options, callback) {
    if (!files || files.length === 0) {
      callback([], null);
      return;
    }

    var dataUrls = [];
    var filesArray = Array.prototype.slice.call(files);
    var loaded = 0;

    // Read all files first
    filesArray.forEach(function(file, index) {
      if (!file.type.match('image.*')) {
        console.warn('Skipping non-image file:', file.name);
        loaded++;
        if (loaded === filesArray.length) {
          startCompression();
        }
        return;
      }

      var reader = new FileReader();

      reader.onload = function(e) {
        dataUrls[index] = {
          dataUrl: e.target.result,
          filename: file.name,
          originalSize: file.size
        };

        loaded++;
        if (loaded === filesArray.length) {
          startCompression();
        }
      };

      reader.onerror = function() {
        console.error('Failed to read file:', file.name);
        loaded++;
        if (loaded === filesArray.length) {
          startCompression();
        }
      };

      reader.readAsDataURL(file);
    });

    function startCompression() {
      // Filter out failed reads
      var validUrls = dataUrls.filter(function(item) { return item && item.dataUrl; });

      if (validUrls.length === 0) {
        callback([], null);
        return;
      }

      var compressed = [];
      var totalOriginalSize = 0;
      var totalCompressedSize = 0;

      compressMultiple(
        validUrls.map(function(item) { return item.dataUrl; }),
        options,
        function(index, total, stats) {
          // Progress callback
          console.log('Compressed ' + index + '/' + total + ': ' + stats.savingsPercent + '% savings');
        },
        function(results) {
          // Complete callback
          results.forEach(function(result, index) {
            var original = validUrls[index];

            compressed.push({
              dataUrl: result.compressed,
              filename: original.filename,
              stats: result.stats
            });

            totalOriginalSize += result.stats.originalSizeBytes;
            totalCompressedSize += result.stats.compressedSizeBytes;
          });

          var totalStats = {
            count: results.length,
            totalOriginalSize: formatBytes(totalOriginalSize),
            totalCompressedSize: formatBytes(totalCompressedSize),
            totalSavings: formatBytes(totalOriginalSize - totalCompressedSize),
            totalSavingsPercent: (((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100).toFixed(1)
          };

          callback(compressed, totalStats);
        }
      );
    }
  }

  // ===================================
  // UTILITY FUNCTIONS
  // ===================================

  /**
   * Get estimated localStorage impact
   */
  function estimateStorageImpact(dataUrl) {
    var sizeBytes = dataUrl.length;
    var sizeKB = sizeBytes / 1024;
    var sizeMB = sizeKB / 1024;

    // LocalStorage limit is typically 5-10MB
    var storageLimit = 5 * 1024 * 1024; // 5MB
    var percentOfLimit = ((sizeBytes / storageLimit) * 100).toFixed(2);

    return {
      sizeBytes: sizeBytes,
      sizeKB: sizeKB.toFixed(2),
      sizeMB: sizeMB.toFixed(2),
      percentOfLimit: percentOfLimit,
      warning: percentOfLimit > 10 ? 'Image is large, consider further compression' : null
    };
  }

  /**
   * Compare compression profiles
   */
  function compareProfiles(dataUrl, callback) {
    var profiles = Object.keys(COMPRESSION_PROFILES);
    var results = {};
    var completed = 0;

    profiles.forEach(function(profile) {
      compressImage(dataUrl, { profile: profile }, function(compressed, stats) {
        results[profile] = stats;
        completed++;

        if (completed === profiles.length) {
          callback(results);
        }
      });
    });
  }

  // ===================================
  // PUBLIC API
  // ===================================

  window.ImageCompression = {
    // Main compression function
    compress: compressImage,

    // Batch operations
    compressMultiple: compressMultiple,
    compressToTargetSize: compressToTargetSize,

    // File handling
    handleFileInput: handleFileInput,

    // Utilities
    estimateStorageImpact: estimateStorageImpact,
    compareProfiles: compareProfiles,

    // Profiles
    profiles: COMPRESSION_PROFILES,
    setDefaultProfile: function(profile) {
      if (COMPRESSION_PROFILES[profile]) {
        DEFAULT_PROFILE = profile;
      }
    }
  };

  console.log('✓ ImageCompression loaded (ultra, high, medium, thumbnail profiles available)');

})();

// ===================================
// USAGE EXAMPLES FOR TICTACSTICK
// ===================================

/*

// ========================================
// Example 1: Compress single image (simple)
// ========================================

ImageCompression.compress(
  base64DataUrl,
  { profile: 'ultra' }, // 1200px max, 75% quality
  function(compressedUrl, stats) {
    console.log('Original:', stats.originalSize);
    console.log('Compressed:', stats.compressedSize);
    console.log('Savings:', stats.savingsPercent + '%');

    // Use compressed image
    localStorage.setItem('photo-1', compressedUrl);
  }
);


// ========================================
// Example 2: Compress to target size
// ========================================

// Ensure image is under 200KB
ImageCompression.compressToTargetSize(
  base64DataUrl,
  200, // Target: 200KB
  function(compressedUrl, stats) {
    console.log('Final size:', stats.compressedSize);
    console.log('Quality used:', stats.quality);

    // Store compressed version
    currentPhotos.push(compressedUrl);
  }
);


// ========================================
// Example 3: Handle file input (RECOMMENDED)
// ========================================

// In photos.js, replace handleFileSelect:

function handleFileSelect(event) {
  var files = event.target.files;

  // Show loading
  if (window.LoadingState) {
    window.LoadingState.show('Compressing images...');
  }

  ImageCompression.handleFileInput(
    files,
    { profile: 'ultra' },
    function(compressedImages, totalStats) {
      // Hide loading
      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      if (compressedImages.length === 0) {
        showError('No valid images to compress');
        return;
      }

      // Show compression results
      console.log('Compressed ' + totalStats.count + ' images');
      console.log('Total savings: ' + totalStats.totalSavingsPercent + '%');
      console.log('Size reduced from ' + totalStats.totalOriginalSize + ' to ' + totalStats.totalCompressedSize);

      // Add to current photos
      compressedImages.forEach(function(img) {
        currentPhotos.push({
          id: generatePhotoId(),
          dataUrl: img.dataUrl,
          filename: img.filename,
          timestamp: Date.now(),
          stats: img.stats
        });
      });

      // Update UI
      renderPhotoGallery();

      // Save to state
      scheduleAutosave();

      showSuccess(totalStats.count + ' photo(s) added and compressed (' + totalStats.totalSavingsPercent + '% smaller)');
    }
  );
}


// ========================================
// Example 4: Create thumbnail + full size
// ========================================

// Store both thumbnail for gallery and full size for viewing

var originalDataUrl = 'data:image/jpeg;base64,...';

// Compress full size
ImageCompression.compress(
  originalDataUrl,
  { profile: 'high' },
  function(fullSize, fullStats) {

    // Create thumbnail
    ImageCompression.compress(
      originalDataUrl,
      { profile: 'thumbnail' },
      function(thumbnail, thumbStats) {

        var photo = {
          id: generatePhotoId(),
          thumbnail: thumbnail,    // Small for gallery
          fullSize: fullSize,      // Larger for modal
          stats: {
            thumbnail: thumbStats,
            fullSize: fullStats
          }
        };

        currentPhotos.push(photo);
        renderPhotoGallery();
      }
    );
  }
);


// ========================================
// Example 5: Compare profiles before choosing
// ========================================

ImageCompression.compareProfiles(base64DataUrl, function(results) {
  console.table(results);
  // Shows size and quality for ultra, high, medium, thumbnail

  // Choose best profile for your needs
  var bestProfile = results.ultra.compressedSizeBytes < 200 * 1024 ? 'ultra' : 'high';

  // Use chosen profile
  ImageCompression.compress(base64DataUrl, { profile: bestProfile }, function(compressed, stats) {
    localStorage.setItem('photo', compressed);
  });
});


// ========================================
// Example 6: Check storage impact
// ========================================

var impact = ImageCompression.estimateStorageImpact(compressedDataUrl);
console.log('Size:', impact.sizeMB, 'MB');
console.log('Uses', impact.percentOfLimit, '% of localStorage limit');

if (impact.warning) {
  console.warn(impact.warning);
}


// ========================================
// INTEGRATION WITH EXISTING photos.js
// ========================================

// Replace the compressAndStore function in photos.js:

function compressAndStore(img, filename) {
  // Convert image to data URL first
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  var originalDataUrl = canvas.toDataURL('image/jpeg', 1.0);

  // Use ImageCompression for better results
  ImageCompression.compress(
    originalDataUrl,
    {
      profile: 'ultra',           // or 'high' for better quality
      maxDimension: 1200,         // Override profile default
      quality: 0.75               // Override profile default
    },
    function(compressedDataUrl, stats) {
      // Hide loading
      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      // Log compression results
      console.log('Image compressed:');
      console.log('  Original:', stats.originalSize, stats.originalDimensions);
      console.log('  Compressed:', stats.compressedSize, stats.compressedDimensions);
      console.log('  Savings:', stats.savingsPercent + '%');
      console.log('  Time:', stats.compressionTime);

      // Add to photos array
      var photo = {
        id: generatePhotoId(),
        dataUrl: compressedDataUrl,
        filename: filename,
        timestamp: Date.now(),
        compressionStats: stats
      };

      currentPhotos.push(photo);
      renderPhotoGallery();
      scheduleAutosave();

      showSuccess('Photo added (' + stats.savingsPercent + '% compressed)');
    }
  );
}


// ========================================
// EXPECTED RESULTS
// ========================================

Profile Comparison (typical 4000x3000 iPhone photo):

Original Size: 2.4 MB (2,400 KB)

BEFORE (current photos.js):
- MAX_DIMENSION: 1920
- QUALITY: 0.85
- Result: ~800 KB (67% savings)

AFTER (ultra profile):
- MAX_DIMENSION: 1200
- QUALITY: 0.75
- Result: ~180 KB (93% savings)

AFTER (high profile):
- MAX_DIMENSION: 1600
- QUALITY: 0.80
- Result: ~320 KB (87% savings)

AFTER (medium profile):
- MAX_DIMENSION: 1920
- QUALITY: 0.85
- Result: ~800 KB (67% savings - same as current)

AFTER (thumbnail profile):
- MAX_DIMENSION: 400
- QUALITY: 0.70
- Result: ~25 KB (99% savings)


Real-world scenario:
- 5 photos at current settings: 4 MB localStorage
- 5 photos with ultra profile: 0.9 MB localStorage
- 5 photos with high profile: 1.6 MB localStorage

RECOMMENDED: Use 'ultra' profile for field technicians (mobile data, limited storage)
ALTERNATIVE: Use 'high' profile if quality is critical

*/
