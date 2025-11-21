// ui-components.js - UI Component Helpers
// Dependencies: None (standalone utilities)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    /**
     * UI Components Module
     * Provides reusable UI components: toast notifications, loading overlays, confirmation modals
     */
    var UIComponents = (function() {

        /**
         * Show toast notification
         * @param {string} message - Message to display
         * @param {string} type - 'success', 'error', 'warning', 'info'
         * @param {number} duration - Duration in ms (default 3000)
         */
        var toastQueue = [];
        var toastTimer = null;
        var toastPool = [];
        var TOAST_BATCH_DELAY = 140;

        function showToast(message, type, duration) {
            type = type || 'info';
            duration = duration || 3000;

            // Sanitize message early for reuse
            var sanitizedMessage = message;
            if (window.Security && window.Security.escapeHTML) {
                sanitizedMessage = window.Security.escapeHTML(message);
            }

            toastQueue.push({
                message: sanitizedMessage,
                type: type,
                duration: duration
            });

            scheduleToastDrain();
        }

        function scheduleToastDrain() {
            if (toastTimer) {
                return;
            }
            toastTimer = setTimeout(function() {
                toastTimer = null;
                drainToastQueue();
            }, TOAST_BATCH_DELAY);
        }

        function drainToastQueue() {
            if (!toastQueue.length) {
                return;
            }

            var nextToast = toastQueue.shift();
            renderToast(nextToast.message, nextToast.type, nextToast.duration);

            if (toastQueue.length) {
                scheduleToastDrain();
            }
        }

        function getToastContainer() {
            var container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'toast-container';
                container.setAttribute('role', 'region');
                container.setAttribute('aria-live', 'polite');
                container.setAttribute('aria-label', 'Notifications');
                document.body.appendChild(container);
            }
            return container;
        }

        function buildToastElement() {
            var toast = document.createElement('div');
            toast.className = 'toast';
            toast.setAttribute('aria-atomic', 'true');

            var iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            iconSvg.setAttribute('class', 'toast-icon');
            iconSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            iconSvg.setAttribute('fill', 'none');
            iconSvg.setAttribute('viewBox', '0 0 24 24');
            iconSvg.setAttribute('stroke-width', '2');
            var iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            iconPath.setAttribute('stroke-linecap', 'round');
            iconPath.setAttribute('stroke-linejoin', 'round');
            iconSvg.appendChild(iconPath);

            var content = document.createElement('div');
            content.className = 'toast-content';

            var messageEl = document.createElement('div');
            messageEl.className = 'toast-message';
            messageEl.setAttribute('role', 'text');
            content.appendChild(messageEl);

            var closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.setAttribute('type', 'button');
            closeBtn.setAttribute('aria-label', 'Close notification');
            closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

            closeBtn.addEventListener('click', function() {
                removeToast(toast);
            });

            toast.appendChild(iconSvg);
            toast.appendChild(content);
            toast.appendChild(closeBtn);

            toast._icon = iconSvg;
            toast._iconPath = iconPath;
            toast._message = messageEl;
            toast._closeBtn = closeBtn;

            return toast;
        }

        function acquireToast() {
            if (toastPool.length) {
                return toastPool.pop();
            }
            return buildToastElement();
        }

        function renderToast(message, type, duration) {
            var container = getToastContainer();
            var toast = acquireToast();

            var iconPath = '';
            var iconColor = '';
            switch (type) {
                case 'success':
                    iconPath = 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
                    iconColor = '#10b981';
                    break;
                case 'error':
                    iconPath = 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
                    iconColor = '#ef4444';
                    break;
                case 'warning':
                    iconPath = 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
                    iconColor = '#f59e0b';
                    break;
                default:
                    iconPath = 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
                    iconColor = '#3b82f6';
            }

            var role = (type === 'error' || type === 'warning') ? 'alert' : 'status';
            toast.className = 'toast toast-' + type;
            toast.setAttribute('role', role);
            toast.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite');
            toast._icon.setAttribute('stroke', iconColor);
            toast._iconPath.setAttribute('d', iconPath);
            toast._message.textContent = message;

            if (toast._removeTimer) {
                clearTimeout(toast._removeTimer);
            }

            container.appendChild(toast);

            // Ensure the toast becomes keyboard reachable
            toast.setAttribute('tabindex', '-1');

            if (window.requestAnimationFrame) {
                window.requestAnimationFrame(function() {
                    toast.classList.add('toast-show');
                });
            } else {
                toast.classList.add('toast-show');
            }

            toast._removeTimer = setTimeout(function() {
                removeToast(toast);
            }, duration);

            console.log('[UI-COMPONENTS] Toast shown:', type, message);
        }

        /**
         * Remove toast with animation
         * @param {HTMLElement} toast - Toast element to remove
         */
        function removeToast(toast) {
            if (!toast || !toast.parentNode) {
                return;
            }

            if (toast._removeTimer) {
                clearTimeout(toast._removeTimer);
                toast._removeTimer = null;
            }

            var prefersReduceMotion = false;
            if (window.matchMedia && typeof window.matchMedia === 'function') {
                prefersReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            }

            var cleanup = function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                toast.className = 'toast';
                toast.removeAttribute('tabindex');
                toast._removeTimer = null;
                toastPool.push(toast);
            };

            if (prefersReduceMotion) {
                cleanup();
                return;
            }

            toast.classList.remove('toast-show');

            var handled = false;
            var onTransitionEnd = function() {
                if (handled) {
                    return;
                }
                handled = true;
                toast.removeEventListener('transitionend', onTransitionEnd);
                cleanup();
            };

            toast.addEventListener('transitionend', onTransitionEnd);

            setTimeout(function() {
                onTransitionEnd();
            }, 400);
        }

        /**
         * Show loading overlay
         * @param {string} message - Optional loading message
         * @returns {HTMLElement} The loading overlay element
         */
        function showLoading(message) {
            message = message || 'Loading...';

            // Remove existing overlay if present
            hideLoading();

            var overlay = document.createElement('div');
            overlay.id = 'loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.setAttribute('role', 'status');
            overlay.setAttribute('aria-live', 'polite');

            // Sanitize message
            var sanitizedMessage = message;
            if (window.Security && window.Security.escapeHTML) {
                sanitizedMessage = window.Security.escapeHTML(message);
            }

            overlay.innerHTML = '<div class="spinner" aria-hidden="true"></div><div class="loading-text">' + sanitizedMessage + '</div>';

            document.body.appendChild(overlay);
            console.log('[UI-COMPONENTS] Loading overlay shown:', message);

            return overlay;
        }

        /**
         * Hide loading overlay
         */
        function hideLoading() {
            var overlay = document.getElementById('loading-overlay');
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
                console.log('[UI-COMPONENTS] Loading overlay hidden');
            }
        }

        /**
         * Show confirmation modal
         * @param {object} options - { title, message, confirmText, cancelText, onConfirm, onCancel, danger }
         */
        function showConfirm(options) {
            var title = options.title || 'Confirm';
            var message = options.message || 'Are you sure?';
            var confirmText = options.confirmText || 'Confirm';
            var cancelText = options.cancelText || 'Cancel';
            var onConfirm = options.onConfirm || function() {};
            var onCancel = options.onCancel || function() {};
            var danger = options.danger || false;

            // Sanitize inputs
            if (window.Security && window.Security.escapeHTML) {
                title = window.Security.escapeHTML(title);
                message = window.Security.escapeHTML(message);
                confirmText = window.Security.escapeHTML(confirmText);
                cancelText = window.Security.escapeHTML(cancelText);
            }

            // Create modal overlay
            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');

            var messageId = 'confirm-modal-message-' + new Date().getTime();
            overlay.setAttribute('aria-labelledby', 'confirm-modal-title');
            overlay.setAttribute('aria-describedby', messageId);

            // Create modal
            var modal = document.createElement('div');
            modal.className = 'modal';

            // Build modal HTML
            var confirmBtnClass = danger ? 'btn btn-danger' : 'btn btn-primary';

            modal.innerHTML = '<div class="modal-header"><h3 class="modal-title" id="confirm-modal-title">' + title + '</h3></div>' +
                '<div class="modal-body"><p id="' + messageId + '">' + message + '</p></div>' +
                '<div class="modal-footer">' +
                '<button class="btn btn-secondary" data-action="cancel">' + cancelText + '</button>' +
                '<button class="' + confirmBtnClass + '" data-action="confirm">' + confirmText + '</button>' +
                '</div>';

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Prevent body scroll
            document.body.classList.add('modal-open');

            var previousFocus = document.activeElement;

            // Handle overlay click (close on backdrop)
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    close();
                }
            });

            // Cancel button
            var cancelBtn = modal.querySelector('[data-action="cancel"]');
            cancelBtn.addEventListener('click', function() {
                onCancel();
                close();
            });

            // Confirm button
            var confirmBtn = modal.querySelector('[data-action="confirm"]');
            confirmBtn.addEventListener('click', function() {
                onConfirm();
                close();
            });

            // Focus first interactive element and trap focus within modal
            var focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            var firstFocusable = focusableElements[0];
            var lastFocusable = focusableElements[focusableElements.length - 1];

            setTimeout(function() {
                if (firstFocusable && firstFocusable.focus) {
                    firstFocusable.focus();
                }
            }, 50);

            var handleTab = function(e) {
                if (e.key !== 'Tab' && e.keyCode !== 9) {
                    return;
                }
                if (!firstFocusable || !lastFocusable) {
                    return;
                }
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            };

            overlay.addEventListener('keydown', handleTab);

            // Close function
            function close() {
                document.body.classList.remove('modal-open');
                overlay.removeEventListener('keydown', handleTab);
                document.removeEventListener('keydown', handleEscape);
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                if (previousFocus && previousFocus.focus) {
                    previousFocus.focus();
                }
            }

            // Handle Escape key
            function handleEscape(e) {
                if (e.key === 'Escape' || e.keyCode === 27) {
                    onCancel();
                    close();
                    document.removeEventListener('keydown', handleEscape);
                }
            }
            document.addEventListener('keydown', handleEscape);

            console.log('[UI-COMPONENTS] Confirmation modal shown:', title);
        }

        /**
         * Show alert modal (informational only, single button)
         * @param {object} options - { title, message, buttonText, onClose }
         */
        function showAlert(options) {
            var title = options.title || 'Alert';
            var message = options.message || '';
            var buttonText = options.buttonText || 'OK';
            var onClose = options.onClose || function() {};

            // Sanitize inputs
            if (window.Security && window.Security.escapeHTML) {
                title = window.Security.escapeHTML(title);
                message = window.Security.escapeHTML(message);
                buttonText = window.Security.escapeHTML(buttonText);
            }

            // Create modal overlay
            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.setAttribute('role', 'alertdialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.setAttribute('aria-labelledby', 'alert-modal-title');

            // Create modal
            var modal = document.createElement('div');
            modal.className = 'modal';

            modal.innerHTML = '<div class="modal-header"><h3 class="modal-title" id="alert-modal-title">' + title + '</h3></div>' +
                '<div class="modal-body"><p>' + message + '</p></div>' +
                '<div class="modal-footer">' +
                '<button class="btn btn-primary btn-block" data-action="close">' + buttonText + '</button>' +
                '</div>';

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Prevent body scroll
            document.body.classList.add('modal-open');

            // Handle overlay click
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    close();
                }
            });

            // Close button
            var closeBtn = modal.querySelector('[data-action="close"]');
            closeBtn.addEventListener('click', function() {
                close();
            });

            // Focus close button
            setTimeout(function() {
                closeBtn.focus();
            }, 100);

            // Close function
            function close() {
                document.body.classList.remove('modal-open');
                document.removeEventListener('keydown', handleEscape);
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                onClose();
            }

            // Handle Escape key
            function handleEscape(e) {
                if (e.key === 'Escape' || e.keyCode === 27) {
                    close();
                    document.removeEventListener('keydown', handleEscape);
                }
            }
            document.addEventListener('keydown', handleEscape);

            console.log('[UI-COMPONENTS] Alert modal shown:', title);
        }

        /**
         * Set iOS viewport height variable
         * Fixes iOS Safari address bar height issue
         */
        function setVhVariable() {
            var vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', vh + 'px');
        }

        /**
         * Initialize UI components
         * Sets up viewport height fix for iOS
         */
        function init() {
            // Set initial viewport height
            setVhVariable();

            // Update on resize and orientation change
            window.addEventListener('resize', setVhVariable);
            window.addEventListener('orientationchange', setVhVariable);

            console.log('[UI-COMPONENTS] Initialized');
        }

        // Public API
        return {
            showToast: showToast,
            showLoading: showLoading,
            hideLoading: hideLoading,
            showConfirm: showConfirm,
            showAlert: showAlert,
            setVhVariable: setVhVariable,
            init: init
        };
    })();

    // Make globally available
    window.UIComponents = UIComponents;

    // Register with APP if available
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('uiComponents', {
            showToast: UIComponents.showToast,
            showLoading: UIComponents.showLoading,
            hideLoading: UIComponents.hideLoading,
            showConfirm: UIComponents.showConfirm,
            showAlert: UIComponents.showAlert,
            init: UIComponents.init
        });
    }

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', UIComponents.init);
    } else {
        UIComponents.init();
    }

    console.log('[UI-COMPONENTS] Module loaded');
})();
