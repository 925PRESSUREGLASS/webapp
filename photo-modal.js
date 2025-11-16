// photo-modal.js - Photo preview modal with navigation
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var modal = null;
  var currentIndex = 0;

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
    img.src = photo.base64;
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
    document.addEventListener('keydown', handleKeydown);
  }

  // Hide modal
  function hide() {
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    // Remove keyboard listener
    document.removeEventListener('keydown', handleKeydown);
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

  // Initialize
  function init() {
    console.log('Photo modal initialized');
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
