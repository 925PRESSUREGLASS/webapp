// photos.js - Photo upload with compression and base64 storage
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  var MAX_DIMENSION = 1920; // Max width/height
  var COMPRESSION_QUALITY = 0.85; // JPEG quality

  var currentPhotos = []; // Photos for current quote

  // Handle file selection
  function handleFileSelect(event) {
    var files = event.target.files;
    if (!files || files.length === 0) return;

    for (var i = 0; i < files.length; i++) {
      processFile(files[i]);
    }
  }

  // Process and compress image file
  function processFile(file) {
    // Validate file type
    if (!file.type.match('image.*')) {
      showError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      showError('Image too large. Maximum size is 5MB');
      return;
    }

    // Show loading state
    if (window.LoadingState) {
      window.LoadingState.show('Processing image...');
    } else {
      showInfo('Processing image...');
    }

    var reader = new FileReader();

    reader.onload = function(e) {
      var img = new Image();

      img.onload = function() {
        compressAndStore(img, file.name);
      };

      img.onerror = function() {
        if (window.LoadingState) {
          window.LoadingState.hide();
        }
        showError('Failed to load image');
      };

      img.src = e.target.result;
    };

    reader.onerror = function() {
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      showError('Failed to read file');
    };

    reader.readAsDataURL(file);
  }

  // Compress image and store as base64
  function compressAndStore(img, filename) {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');

      // Calculate new dimensions
      var width = img.width;
      var height = img.height;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 JPEG
      var base64 = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);

      // Create photo object
      var photo = {
        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        filename: filename,
        base64: base64,
        width: width,
        height: height,
        size: Math.round(base64.length * 0.75), // Approximate size in bytes
        timestamp: Date.now()
      };

      // Add to current photos
      currentPhotos.push(photo);

      // Render photo gallery
      renderPhotoGallery();

      // Hide loading state
      if (window.LoadingState) {
        window.LoadingState.hide();
      }

      showSuccess('Photo added (' + formatFileSize(photo.size) + ')');

    } catch (error) {
      console.error('Compression error:', error);
      if (window.LoadingState) {
        window.LoadingState.hide();
      }
      showError('Failed to process image');
    }
  }

  // Render photo gallery
  function renderPhotoGallery() {
    var container = document.getElementById('photoGallery');
    if (!container) return;

    if (currentPhotos.length === 0) {
      container.innerHTML = '<p class="photo-gallery-empty">No photos attached</p>';
      return;
    }

    var html = '<div class="photo-grid">';

    currentPhotos.forEach(function(photo, index) {
      html += '<div class="photo-item" data-photo-id="' + photo.id + '">';
      html += '<img src="' + photo.base64 + '" alt="' + photo.filename + '" class="photo-thumbnail" onclick="window.PhotoModal.show(' + index + ')" style="cursor: pointer;" />';
      html += '<div class="photo-info">';
      html += '<div class="photo-filename">' + truncateFilename(photo.filename) + '</div>';
      html += '<div class="photo-size">' + formatFileSize(photo.size) + '</div>';
      html += '</div>';
      html += '<button type="button" class="photo-remove-btn" onclick="window.PhotoManager.remove(\'' + photo.id + '\')">×</button>';
      html += '</div>';
    });

    html += '</div>';

    container.innerHTML = html;
  }

  // Remove photo
  function removePhoto(photoId) {
    currentPhotos = currentPhotos.filter(function(photo) {
      return photo.id !== photoId;
    });

    renderPhotoGallery();
    showSuccess('Photo removed');
  }

  // Clear all photos
  function clearAllPhotos() {
    if (currentPhotos.length === 0) return;

    if (confirm('Remove all photos?')) {
      currentPhotos = [];
      renderPhotoGallery();
      showSuccess('All photos removed');
    }
  }

  // Get photos for export
  function getPhotos() {
    return currentPhotos.slice(0); // Return copy
  }

  // Load photos from state
  function loadPhotos(photos) {
    if (!photos || !Array.isArray(photos)) {
      currentPhotos = [];
    } else {
      currentPhotos = photos;
    }
    renderPhotoGallery();
  }

  // Format file size
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Truncate filename
  function truncateFilename(filename) {
    if (filename.length <= 20) return filename;
    var ext = filename.split('.').pop();
    return filename.substr(0, 15) + '...' + ext;
  }

  // Helper functions
  function showError(message) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showError(message);
    } else {
      alert('Error: ' + message);
    }
  }

  function showSuccess(message) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess(message);
    }
  }

  function showInfo(message) {
    if (window.ErrorHandler) {
      window.ErrorHandler.showInfo(message);
    }
  }

  // Initialize
  function init() {
    // Add file input if not exists
    var photoSection = document.getElementById('photosSection');
    if (photoSection) {
      // File input
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'photoFileInput';
      fileInput.accept = 'image/*';
      fileInput.multiple = true;
      fileInput.style.display = 'none';
      fileInput.onchange = handleFileSelect;

      // Add button
      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'btn btn-secondary btn-sm';
      addBtn.textContent = '📷 Add Photos';
      addBtn.onclick = function() {
        fileInput.click();
      };

      // Clear button
      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'btn btn-tertiary btn-sm';
      clearBtn.textContent = 'Clear All';
      clearBtn.onclick = clearAllPhotos;

      var controls = document.createElement('div');
      controls.className = 'photo-controls';
      controls.appendChild(addBtn);
      controls.appendChild(clearBtn);
      controls.appendChild(fileInput);

      var sectionBody = photoSection.querySelector('.sec-b');
      if (sectionBody) {
        sectionBody.insertBefore(controls, sectionBody.firstChild);
      }
    }

    DEBUG.log('[PHOTOS] Photo manager initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.PhotoManager = {
    add: processFile,
    remove: removePhoto,
    clear: clearAllPhotos,
    getAll: getPhotos,
    load: loadPhotos,
    count: function() { return currentPhotos.length; }
  };

})();
