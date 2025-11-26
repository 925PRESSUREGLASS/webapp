// camera-helper.js - Native Camera Integration
// Provides camera access for job photo documentation
// Dependencies: Capacitor Core, Capacitor Camera Plugin, native-features.js
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.APP_TEST_MODE) {
    console.log('[CAMERA-HELPER] Skipped in test mode');
    return;
  }

  // ============================================
  // PHOTO QUALITY CONSTANTS
  // ============================================
  var DEFAULT_PHOTO_QUALITY = 90;     // JPEG quality (0-100), 90 = high quality
  var DEFAULT_PHOTO_WIDTH = 1920;     // Max width in pixels (Full HD)
  var DEFAULT_PHOTO_HEIGHT = 1080;    // Max height in pixels (Full HD)

  // ============================================
  // AVAILABILITY CHECK
  // ============================================

  /**
   * Check if camera is available
   * @returns {boolean}
   */
  function isAvailable() {
    return typeof window.Capacitor !== 'undefined' &&
           window.Capacitor.Plugins &&
           window.Capacitor.Plugins.Camera;
  }

  // ============================================
  // PHOTO CAPTURE
  // ============================================

  /**
   * Take photo with camera
   * @param {Object} options - Camera options
   * @param {number} options.quality - Image quality 0-100 (default: DEFAULT_PHOTO_QUALITY)
   * @param {boolean} options.allowEditing - Allow editing (default: true)
   * @param {string} options.resultType - 'base64', 'uri', or 'dataUrl' (default: 'base64')
   * @param {boolean} options.saveToGallery - Save to photo gallery (default: true)
   * @param {number} options.width - Max width (default: DEFAULT_PHOTO_WIDTH)
   * @param {number} options.height - Max height (default: DEFAULT_PHOTO_HEIGHT)
   * @returns {Promise<Object>} Photo data
   */
  function takePhoto(options) {
    if (!isAvailable()) {
      alert('Camera not available in this environment');
      return Promise.reject(new Error('Camera not available'));
    }

    // Default options
    var defaultOptions = {
      quality: DEFAULT_PHOTO_QUALITY,
      allowEditing: true,
      resultType: 'base64',
      source: 'camera',
      saveToGallery: true,
      width: DEFAULT_PHOTO_WIDTH,
      height: DEFAULT_PHOTO_HEIGHT,
      correctOrientation: true
    };

    // Merge with provided options
    var finalOptions = Object.assign({}, defaultOptions, options || {});

    // Convert resultType to Capacitor format
    if (finalOptions.resultType === 'base64') {
      finalOptions.resultType = window.Capacitor.Plugins.Camera.CameraResultType.Base64;
    } else if (finalOptions.resultType === 'uri') {
      finalOptions.resultType = window.Capacitor.Plugins.Camera.CameraResultType.Uri;
    } else if (finalOptions.resultType === 'dataUrl') {
      finalOptions.resultType = window.Capacitor.Plugins.Camera.CameraResultType.DataUrl;
    }

    // Convert source to Capacitor format
    if (finalOptions.source === 'camera') {
      finalOptions.source = window.Capacitor.Plugins.Camera.CameraSource.Camera;
    } else if (finalOptions.source === 'photos') {
      finalOptions.source = window.Capacitor.Plugins.Camera.CameraSource.Photos;
    }

    return window.Capacitor.Plugins.Camera.getPhoto(finalOptions)
      .then(function(image) {
        console.log('[CAMERA] Photo captured successfully');

        // Provide haptic feedback
        if (window.NativeFeatures && window.NativeFeatures.hapticMedium) {
          window.NativeFeatures.hapticMedium();
        }

        return {
          base64String: image.base64String,
          dataUrl: image.dataUrl || ('data:image/jpeg;base64,' + image.base64String),
          format: image.format,
          saved: image.saved,
          path: image.path,
          webPath: image.webPath
        };
      })
      .catch(function(error) {
        console.error('[CAMERA] Photo capture error:', error);

        // Check if user cancelled
        if (error && error.message && error.message.toLowerCase().indexOf('cancel') !== -1) {
          console.log('[CAMERA] User cancelled');
          return null;
        }

        alert('Failed to take photo: ' + error.message);
        throw error;
      });
  }

  /**
   * Pick photo from gallery
   * @param {Object} options - Camera options
   * @returns {Promise<Object>} Photo data
   */
  function pickFromGallery(options) {
    if (!isAvailable()) {
      alert('Photo gallery not available in this environment');
      return Promise.reject(new Error('Camera not available'));
    }

    var galleryOptions = Object.assign({}, options || {}, {
      source: 'photos'
    });

    return takePhoto(galleryOptions);
  }

  // ============================================
  // QUOTE PHOTO ATTACHMENT
  // ============================================

  /**
   * Attach photo to current quote
   * @param {string} quoteId - Quote ID (optional, uses current quote if not provided)
   * @param {Object} options - Camera options
   * @returns {Promise<Object>} Photo data
   */
  function attachToQuote(quoteId, options) {
    return takePhoto(options)
      .then(function(photo) {
        if (!photo) {
          // User cancelled
          return null;
        }

        // Get current state if quoteId not provided
        var currentQuoteId = quoteId;
        if (!currentQuoteId && window.APP && window.APP.getState) {
          var state = window.APP.getState();
          currentQuoteId = state.currentQuoteId || 'current';
        }

        // Add photo to photos array using existing photos module
        if (window.Photos && window.Photos.addPhoto) {
          var photoData = {
            id: 'photo_' + Date.now(),
            dataUrl: photo.dataUrl,
            timestamp: new Date().toISOString(),
            description: '',
            quoteId: currentQuoteId
          };

          window.Photos.addPhoto(photoData);

          // Show success message
          if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Photo attached to quote', 'success');
          }

          return photo;
        }

        // Fallback: add to state directly
        if (window.APP && window.APP.addPhoto) {
          window.APP.addPhoto({
            id: 'photo_' + Date.now(),
            dataUrl: photo.dataUrl,
            timestamp: new Date().toISOString()
          });

          if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast('Photo attached', 'success');
          }

          return photo;
        }

        console.warn('[CAMERA] Photos module not available');
        return photo;
      })
      .catch(function(error) {
        console.error('[CAMERA] Attach to quote error:', error);
        throw error;
      });
  }

  /**
   * Take multiple photos for job documentation
   * @param {number} count - Number of photos to take (default: 3)
   * @param {Object} options - Camera options
   * @returns {Promise<Array>} Array of photo data
   */
  function takeMultiplePhotos(count, options) {
    var photoCount = count || 3;
    var photos = [];
    var photoIndex = 0;

    function takeNext() {
      if (photoIndex >= photoCount) {
        return Promise.resolve(photos);
      }

      return takePhoto(options)
        .then(function(photo) {
          if (photo) {
            photos.push(photo);
          }

          photoIndex++;

          // Ask if user wants to take more
          if (photoIndex < photoCount) {
            var more = confirm('Photo ' + photoIndex + ' of ' + photoCount + ' captured. Take another?');
            if (more) {
              return takeNext();
            }
          } else if (photoIndex === photoCount) {
            // Last photo
            return photos;
          }

          return photos;
        })
        .catch(function(error) {
          console.error('[CAMERA] Multiple photos error:', error);
          return photos;
        });
    }

    return takeNext();
  }

  // ============================================
  // BEFORE/AFTER PHOTOS
  // ============================================

  /**
   * Take before/after photo pair
   * @param {string} quoteId - Quote ID
   * @returns {Promise<Object>} Before and after photos
   */
  function takeBeforeAfterPhotos(quoteId) {
    var beforePhoto = null;
    var afterPhoto = null;

    // Take before photo
    return takePhoto({ quality: DEFAULT_PHOTO_QUALITY })
      .then(function(photo) {
        if (!photo) {
          throw new Error('Before photo cancelled');
        }

        beforePhoto = photo;

        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Before photo captured. Now take AFTER photo.', 'info');
        } else {
          alert('Before photo captured. Now take AFTER photo.');
        }

        // Take after photo
        return takePhoto({ quality: DEFAULT_PHOTO_QUALITY });
      })
      .then(function(photo) {
        if (!photo) {
          throw new Error('After photo cancelled');
        }

        afterPhoto = photo;

        // Add both photos with descriptions
        if (window.Photos && window.Photos.addPhoto) {
          window.Photos.addPhoto({
            id: 'photo_before_' + Date.now(),
            dataUrl: beforePhoto.dataUrl,
            timestamp: new Date().toISOString(),
            description: 'Before',
            quoteId: quoteId,
            type: 'before'
          });

          window.Photos.addPhoto({
            id: 'photo_after_' + Date.now(),
            dataUrl: afterPhoto.dataUrl,
            timestamp: new Date().toISOString(),
            description: 'After',
            quoteId: quoteId,
            type: 'after'
          });
        }

        if (window.UIComponents && window.UIComponents.showToast) {
          window.UIComponents.showToast('Before/After photos saved', 'success');
        }

        return {
          before: beforePhoto,
          after: afterPhoto
        };
      })
      .catch(function(error) {
        console.error('[CAMERA] Before/After photos error:', error);
        throw error;
      });
  }

  // ============================================
  // PERMISSION HANDLING
  // ============================================

  /**
   * Check camera permissions
   * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'prompt'
   */
  function checkPermissions() {
    if (!isAvailable()) {
      return Promise.resolve('denied');
    }

    return window.Capacitor.Plugins.Camera.checkPermissions()
      .then(function(result) {
        return result.camera;
      })
      .catch(function(error) {
        console.error('[CAMERA] Check permissions error:', error);
        return 'denied';
      });
  }

  /**
   * Request camera permissions
   * @returns {Promise<string>} Permission status
   */
  function requestPermissions() {
    if (!isAvailable()) {
      return Promise.resolve('denied');
    }

    return window.Capacitor.Plugins.Camera.requestPermissions()
      .then(function(result) {
        console.log('[CAMERA] Permissions:', result.camera);
        return result.camera;
      })
      .catch(function(error) {
        console.error('[CAMERA] Request permissions error:', error);
        return 'denied';
      });
  }

  // ============================================
  // UI INTEGRATION
  // ============================================

  /**
   * Add camera button to page
   * @param {string} containerId - Container element ID
   * @param {Function} callback - Callback function(photo)
   */
  function addCameraButton(containerId, callback) {
    var container = document.getElementById(containerId);
    if (!container) {
      console.warn('[CAMERA] Container not found:', containerId);
      return;
    }

    var button = document.createElement('button');
    button.className = 'btn btn-secondary';
    button.innerHTML = '📷 Take Photo';
    button.setAttribute('aria-label', 'Take photo with camera');

    button.addEventListener('click', function() {
      takePhoto()
        .then(function(photo) {
          if (photo && callback) {
            callback(photo);
          }
        })
        .catch(function(error) {
          console.error('[CAMERA] Button action error:', error);
        });
    });

    container.appendChild(button);
  }

  // ============================================
  // MODULE REGISTRATION
  // ============================================

  // Register with APP namespace
  if (window.APP && window.APP.registerModule) {
    window.APP.registerModule('cameraHelper', {
      isAvailable: isAvailable,
      takePhoto: takePhoto,
      pickFromGallery: pickFromGallery,
      attachToQuote: attachToQuote,
      takeMultiplePhotos: takeMultiplePhotos,
      checkPermissions: checkPermissions,
      requestPermissions: requestPermissions
    });
  }

  // Global API
  window.CameraHelper = {
    isAvailable: isAvailable,
    takePhoto: takePhoto,
    pickFromGallery: pickFromGallery,
    attachToQuote: attachToQuote,
    takeMultiplePhotos: takeMultiplePhotos,
    takeBeforeAfterPhotos: takeBeforeAfterPhotos,
    checkPermissions: checkPermissions,
    requestPermissions: requestPermissions,
    addCameraButton: addCameraButton
  };

  console.log('[CAMERA-HELPER] Module loaded');
})();
