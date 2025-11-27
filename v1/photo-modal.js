// photo-modal.js - Photo preview modal with navigation
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var modal = null;
  var currentIndex = 0;
  var imageCache = {};
  var objectUrlCache = {};
  var activeImageKey = null;

  // Create modal HTML
  function createModal() {
    if (modal) return modal;

    var modalEl = document.createElement('div');
    modalEl.className = 'photo-modal';
    modalEl.innerHTML =
      '<div class="photo-modal-content">' +
        '<button type="button" class="photo-modal-close" aria-label="Close">&times;</button>' +
        '<button type="button" class="photo-modal-nav photo-modal-prev" aria-label="Previous">&lt;</button>' +
        '<button type="button" class="photo-modal-nav photo-modal-next" aria-label="Next">&gt;</button>' +
        '<div class="photo-modal-hint">← → to navigate • ESC to close</div>' +
        '<img src="" alt="" class="photo-modal-image" />' +
        '<div class="photo-modal-info">' +
          '<div class="photo-modal-filename"></div>' +
          '<div class="photo-modal-dimensions"></div>' +
        '</div>' +
        '<div class="photo-modal-counter"></div>' +
      '</div>';

    document.body.appendChild(modalEl);

    // Event listeners
    modalEl.querySelector('.photo-modal-close').onclick = hide;
    modalEl.querySelector('.photo-modal-prev').onclick = showPrevious;
    modalEl.querySelector('.photo-modal-next').onclick = showNext;
    modalEl.onclick = function(e) {
      if (e.target === modalEl) {
        hide();
      }
    };

    modal = modalEl;
    return modal;
  }

  // Show modal with photo at index
  function show(index) {
    if (!window.PhotoManager) return;

    var photos = window.PhotoManager.getAll();
    if (!photos || photos.length === 0) return;

    currentIndex = index;
    var photo = photos[currentIndex];
    if (!photo) return;

    var modalEl = createModal();
    var img = modalEl.querySelector('.photo-modal-image');
    var filename = modalEl.querySelector('.photo-modal-filename');
    var dimensions = modalEl.querySelector('.photo-modal-dimensions');
    var counter = modalEl.querySelector('.photo-modal-counter');
    var prevBtn = modalEl.querySelector('.photo-modal-prev');
    var nextBtn = modalEl.querySelector('.photo-modal-next');

    // Set image and info
    img.removeAttribute('src');
    activeImageKey = getCacheKey(photo);
    loadOptimizedImage(photo, function(objectUrl) {
      if (!objectUrl) return;

      if (activeImageKey !== getCacheKey(photo)) {
        if (objectUrl.indexOf('blob:') === 0) {
          URL.revokeObjectURL(objectUrl);
        }
        return;
      }

      img.src = objectUrl;
    });
    img.alt = photo.filename;
    filename.textContent = photo.filename;
    dimensions.textContent = photo.width + ' × ' + photo.height + ' px • ' + formatFileSize(photo.size);
    counter.textContent = (currentIndex + 1) + ' / ' + photos.length;

    // Update navigation buttons
    if (currentIndex === 0) {
      prevBtn.classList.add('disabled');
    } else {
      prevBtn.classList.remove('disabled');
    }

    if (currentIndex === photos.length - 1) {
      nextBtn.classList.add('disabled');
    } else {
      nextBtn.classList.remove('disabled');
    }

    // Show modal
    modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Add keyboard listener
    document.removeEventListener('keydown', handleKeydown);
    document.addEventListener('keydown', handleKeydown);
  }

  // Hide modal
  function hide() {
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeydown);

    cleanupActiveImage();
    cleanupObjectUrls();
  }

  // Show previous photo
  function showPrevious() {
    if (!window.PhotoManager) return;

    var photos = window.PhotoManager.getAll();
    if (currentIndex > 0) {
      show(currentIndex - 1);
    }
  }

  // Show next photo
  function showNext() {
    if (!window.PhotoManager) return;

    var photos = window.PhotoManager.getAll();
    if (currentIndex < photos.length - 1) {
      show(currentIndex + 1);
    }
  }

  // Handle keyboard navigation
  function handleKeydown(e) {
    switch (e.key) {
      case 'Escape':
        hide();
        break;
      case 'ArrowLeft':
        showPrevious();
        break;
      case 'ArrowRight':
        showNext();
        break;
    }
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function getCacheKey(photo) {
    if (!photo) return 'unknown';
    return photo.id || photo.filename || String(photo.base64).substr(0, 50);
  }

  function loadOptimizedImage(photo, callback) {
    var cacheKey = getCacheKey(photo);

    if (objectUrlCache[cacheKey]) {
      callback(objectUrlCache[cacheKey]);
      return;
    }

    var source = photo.base64 || photo.image || '';
    if (!source) {
      callback('');
      return;
    }

    function finalize(dataUrl) {
      try {
        var blob = dataUrlToBlob(dataUrl);
        var objectUrl = blob ? URL.createObjectURL(blob) : dataUrl;
        objectUrlCache[cacheKey] = objectUrl;
        callback(objectUrl);
      } catch (error) {
        console.error('[PHOTO-MODAL] Failed to cache image', error);
        callback(dataUrl);
      }
    }

    if (window.ImageCompression && window.ImageCompression.compress) {
      ImageCompression.compress(source, { profile: 'high', maxDimension: 1400 }, function(compressed) {
        imageCache[cacheKey] = compressed;
        finalize(compressed || source);
      });
    } else {
      finalize(source);
    }
  }

  function dataUrlToBlob(dataUrl) {
    var parts = dataUrl.split(',');
    if (parts.length < 2) return null;

    var mimeMatch = parts[0].match(/:(.*?);/);
    var mime = mimeMatch && mimeMatch[1] ? mimeMatch[1] : 'image/jpeg';
    var binary = atob(parts[1]);
    var length = binary.length;
    var array = new Uint8Array(length);

    for (var i = 0; i < length; i++) {
      array[i] = binary.charCodeAt(i);
    }

    return new Blob([array], { type: mime });
  }

  function cleanupActiveImage() {
    if (!modal) return;
    var img = modal.querySelector('.photo-modal-image');
    if (img) {
      img.removeAttribute('src');
    }
    activeImageKey = null;
  }

  function cleanupObjectUrls() {
    var keys = Object.keys(objectUrlCache);
    for (var i = 0; i < keys.length; i++) {
      try {
        URL.revokeObjectURL(objectUrlCache[keys[i]]);
      } catch (error) {
        console.warn('[PHOTO-MODAL] Failed to revoke URL', error);
      }
    }
    objectUrlCache = {};
    imageCache = {};
  }

  // Initialize
  function init() {
    DEBUG.log('[PHOTO-MODAL] Photo modal initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.PhotoModal = {
    show: show,
    hide: hide,
    next: showNext,
    previous: showPrevious
  };

})();
