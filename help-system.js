// help-system.js - In-App Help System
// Dependencies: None
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    // Help content database
    var helpContent = {
        'new-quote-button': {
            title: 'Create New Quote',
            content: 'Start a new quote with our guided wizard. We will help you calculate pricing automatically based on industry standards.',
            video: 'getting-started',
            tip: 'Pro tip: Use the wizard for fastest and most accurate quotes!'
        },

        'quote-wizard': {
            title: 'Quote Wizard',
            content: 'Answer these simple questions to automatically calculate pricing. All factors like difficulty, access, and conditions are considered in the final price.',
            tip: 'Be accurate with measurements for better pricing!',
            example: 'Count all window panes carefully, including hard-to-see skylights.'
        },

        'client-source': {
            title: 'Client Source',
            content: 'Track where clients come from to measure marketing effectiveness. This helps you know which channels work best for your business.',
            example: 'Examples: Website, Google, Facebook, Referral, Repeat Client'
        },

        'gst-calculation': {
            title: 'GST (Goods & Services Tax)',
            content: 'GST (10%) is automatically calculated and shown separately on quotes and invoices. This is required for tax compliance in Australia.',
            formula: 'Total = Subtotal + (Subtotal × 0.10)',
            link: 'https://www.ato.gov.au/Business/GST/'
        },

        'offline-mode': {
            title: 'Offline Mode',
            content: 'TicTacStick works completely offline! Create quotes without internet. Everything syncs automatically when you are back online.',
            icon: '✈️',
            tip: 'Perfect for field work where internet is unreliable!'
        },

        'task-automation': {
            title: 'Automatic Follow-ups',
            content: 'When you mark a quote as "Sent", follow-up tasks are created automatically. Check your tasks daily to stay on top of opportunities.',
            schedule: '24 hours: SMS check-in\n3 days: Phone call\n7 days: Final reminder',
            tip: 'Customize timing in Settings → Automation'
        },

        'conversion-rate': {
            title: 'Conversion Rate',
            content: 'Percentage of sent quotes that get accepted. Industry average is 30-40%. Higher is better!',
            formula: '(Accepted Quotes ÷ Sent Quotes) × 100%',
            tip: 'Improve conversion with quick follow-ups and professional presentation'
        },

        'invoice-payment-terms': {
            title: 'Payment Terms',
            content: 'Set clear payment expectations: when payment is due and accepted methods. Standard terms are 7-14 days from invoice date.',
            example: 'Common terms: Due on receipt, Net 7, Net 14, Net 30',
            tip: 'Faster payment terms = better cash flow!'
        },

        'client-vip-status': {
            title: 'VIP Clients',
            content: 'Mark your best clients as VIP for priority treatment. VIP clients get loyalty discounts, priority scheduling, and personalized service.',
            tip: 'Your top 20% of clients often generate 80% of revenue!'
        },

        'quote-expiry': {
            title: 'Quote Expiry Date',
            content: 'Quotes are valid for a limited time (default 30 days). This creates urgency and protects you from price changes.',
            tip: 'Use expiry as a gentle closing tool in follow-ups'
        },

        'base-fee': {
            title: 'Base Callout Fee',
            content: 'A fixed charge covering travel time, fuel, and initial setup. This fee is applied once per job regardless of job size.',
            example: 'Typical range: $100-$150',
            tip: 'Factor in your average travel distance and vehicle costs'
        },

        'hourly-rate': {
            title: 'Hourly Rate',
            content: 'Your labour charge per hour. This converts estimated time into dollar amounts for the quote.',
            formula: 'Labour Cost = Hours × Hourly Rate',
            tip: 'Consider your skill level, equipment costs, and market rates'
        },

        'minimum-job': {
            title: 'Minimum Job Charge',
            content: 'The lowest amount you will accept for any job. Prevents unprofitable small jobs.',
            example: 'Common minimum: $150-$250',
            tip: 'Should cover your base fee plus at least 30 minutes of labour'
        },

        'high-reach': {
            title: 'High Reach Work',
            content: 'Additional charge for windows requiring ladders, scaffolding, or special equipment. Compensates for extra time, difficulty, and safety risk.',
            example: 'Typical modifier: 40-80% extra',
            tip: 'Always assess safety requirements before quoting'
        },

        'contracts': {
            title: 'Recurring Contracts',
            content: 'Set up regular cleaning schedules for repeat clients. Automatic task creation, invoicing, and discounts for commitment.',
            icon: '📝',
            tip: 'Offer discounts for longer commitments (e.g. 10% for annual contracts)'
        },

        'analytics': {
            title: 'Analytics Dashboard',
            content: 'Track key business metrics: revenue trends, quote conversion rates, top clients, and seasonal patterns.',
            icon: '📊',
            tip: 'Review analytics weekly to spot trends and opportunities'
        },

        'jobs-tracking': {
            title: 'Job Tracking',
            content: 'Manage active jobs from quote acceptance through to completion and invoicing. Track time, status, and notes.',
            tip: 'Update job status regularly to stay organized'
        },

        'tasks': {
            title: 'Tasks & Follow-ups',
            content: 'Manage all follow-up calls, emails, and SMS. Tasks are created automatically based on quote status.',
            icon: '✓',
            tip: 'Process your task list every morning for best results'
        },

        'customers': {
            title: 'Customer Directory',
            content: 'Central database of all clients. Track contact details, job history, and VIP status.',
            tip: 'Keep client info updated for better service and communication'
        },

        'wizard-mode': {
            title: 'Wizard Mode',
            content: 'Guided step-by-step quote creation. Answer simple questions and let the system calculate pricing.',
            tip: 'Fastest way to create accurate quotes on-site!'
        },

        'accordion-mode': {
            title: 'Accordion Mode',
            content: 'Manual quote building with collapsible sections. More control for complex or custom quotes.',
            tip: 'Use when you need to fine-tune pricing or add special items'
        }
    };

    /**
     * Show tooltip for a help item
     * @param {string} helpId - ID of help content
     * @param {HTMLElement} element - Element to attach tooltip to
     */
    function showTooltip(helpId, element) {
        var help = helpContent[helpId];
        if (!help) {
            console.warn('[HELP] No help content for ID:', helpId);
            return;
        }

        // Remove any existing tooltips first
        hideAllTooltips();

        var tooltip = createTooltip(help);
        positionTooltip(tooltip, element);

        document.body.appendChild(tooltip);

        // Fade in animation
        setTimeout(function() {
            tooltip.classList.add('help-tooltip-visible');
        }, 10);

        // Auto-hide after 15 seconds
        setTimeout(function() {
            hideTooltip(tooltip);
        }, 15000);

        // Track that help was viewed
        trackHelpView(helpId);
    }

    /**
     * Create tooltip DOM element
     * @param {Object} help - Help content object
     * @returns {HTMLElement} Tooltip element
     */
    function createTooltip(help) {
        var div = document.createElement('div');
        div.className = 'help-tooltip';

        var content = '<div class="help-tooltip-content">';

        // Icon (if provided)
        if (help.icon) {
            content += '<div class="help-icon">' + help.icon + '</div>';
        }

        // Title
        content += '<h4 class="help-title">' + window.Security.escapeHTML(help.title) + '</h4>';

        // Main content
        content += '<p class="help-text">' + window.Security.escapeHTML(help.content) + '</p>';

        // Tip (if provided)
        if (help.tip) {
            content += '<div class="help-tip">💡 ' + window.Security.escapeHTML(help.tip) + '</div>';
        }

        // Example (if provided)
        if (help.example) {
            content += '<div class="help-example"><strong>Example:</strong> ' + window.Security.escapeHTML(help.example) + '</div>';
        }

        // Formula (if provided)
        if (help.formula) {
            content += '<div class="help-formula"><code>' + window.Security.escapeHTML(help.formula) + '</code></div>';
        }

        // Schedule (if provided)
        if (help.schedule) {
            content += '<div class="help-schedule"><pre>' + window.Security.escapeHTML(help.schedule) + '</pre></div>';
        }

        // Video link (if provided)
        if (help.video) {
            content += '<a href="#" class="help-video-link" data-video="' + help.video + '">▶️ Watch Video Tutorial</a>';
        }

        // External link (if provided)
        if (help.link) {
            content += '<a href="' + help.link + '" class="help-external-link" target="_blank" rel="noopener">📖 Learn More</a>';
        }

        // Close button
        content += '<button class="help-close" aria-label="Close help tooltip">×</button>';

        content += '</div>';

        div.innerHTML = content;

        // Attach event listeners
        var closeBtn = div.querySelector('.help-close');
        if (closeBtn) {
            closeBtn.onclick = function() {
                hideTooltip(div);
            };
        }

        // Video link handler
        var videoLink = div.querySelector('.help-video-link');
        if (videoLink) {
            videoLink.onclick = function(e) {
                e.preventDefault();
                var videoId = this.getAttribute('data-video');
                playHelpVideo(videoId);
            };
        }

        return div;
    }

    /**
     * Position tooltip relative to target element
     * @param {HTMLElement} tooltip - Tooltip element
     * @param {HTMLElement} element - Target element
     */
    function positionTooltip(tooltip, element) {
        var rect = element.getBoundingClientRect();

        // Default position: below element
        var top = rect.bottom + 10;
        var left = rect.left;

        // Add temporary to body to get dimensions
        tooltip.style.visibility = 'hidden';
        tooltip.style.position = 'fixed';
        document.body.appendChild(tooltip);

        var tooltipRect = tooltip.getBoundingClientRect();

        // Adjust if would go off right edge
        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 20;
        }

        // Adjust if would go off left edge
        if (left < 10) {
            left = 10;
        }

        // If would go off bottom, show above instead
        if (top + tooltipRect.height > window.innerHeight) {
            top = rect.top - tooltipRect.height - 10;
        }

        // If would go off top, show on right side
        if (top < 10) {
            top = rect.top;
            left = rect.right + 10;

            // If still doesn't fit, force bottom position with scroll
            if (left + tooltipRect.width > window.innerWidth) {
                top = rect.bottom + 10;
                left = Math.max(10, window.innerWidth - tooltipRect.width - 20);
            }
        }

        tooltip.style.visibility = 'visible';
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    /**
     * Hide a specific tooltip
     * @param {HTMLElement} tooltip - Tooltip to hide
     */
    function hideTooltip(tooltip) {
        if (!tooltip || !tooltip.parentElement) {
            return;
        }

        tooltip.classList.remove('help-tooltip-visible');
        tooltip.classList.add('help-tooltip-fade-out');

        setTimeout(function() {
            if (tooltip.parentElement) {
                tooltip.parentElement.removeChild(tooltip);
            }
        }, 300);
    }

    /**
     * Hide all visible tooltips
     */
    function hideAllTooltips() {
        var tooltips = document.querySelectorAll('.help-tooltip');
        for (var i = 0; i < tooltips.length; i++) {
            hideTooltip(tooltips[i]);
        }
    }

    /**
     * Add help icons to elements with data-help attribute
     */
    function addHelpIcons() {
        var elements = document.querySelectorAll('[data-help]');

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var helpId = element.getAttribute('data-help');

            // Check if help icon already added
            if (element.querySelector('.help-icon-inline')) {
                continue;
            }

            var helpIcon = document.createElement('span');
            helpIcon.className = 'help-icon-inline';
            helpIcon.innerHTML = '❓';
            helpIcon.setAttribute('role', 'button');
            helpIcon.setAttribute('aria-label', 'Show help');
            helpIcon.setAttribute('tabindex', '0');

            // Create closure to capture helpId and element
            (function(id, el, icon) {
                icon.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    showTooltip(id, el);
                };

                // Keyboard support
                icon.onkeydown = function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        showTooltip(id, el);
                    }
                };
            })(helpId, element, helpIcon);

            element.appendChild(helpIcon);
        }
    }

    /**
     * Add global help button to header
     */
    function addHelpButton() {
        var header = document.querySelector('.page-header');
        if (!header) {
            console.warn('[HELP] No .page-header found, skipping help button');
            return;
        }

        // Check if button already exists
        if (header.querySelector('.btn-help')) {
            return;
        }

        var helpButton = document.createElement('button');
        helpButton.className = 'btn btn-tertiary btn-help';
        helpButton.innerHTML = '❓ Help';
        helpButton.setAttribute('aria-label', 'Open help center');
        helpButton.onclick = function() {
            showHelpCenter();
        };

        header.appendChild(helpButton);
    }

    /**
     * Show help center modal
     */
    function showHelpCenter() {
        var modal = createHelpCenterModal();
        document.body.appendChild(modal);

        // Show modal with animation
        setTimeout(function() {
            modal.classList.add('modal-visible');
        }, 10);
    }

    /**
     * Create help center modal
     * @returns {HTMLElement} Modal element
     */
    function createHelpCenterModal() {
        var modal = document.createElement('div');
        modal.className = 'modal help-center-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'help-center-title');
        modal.setAttribute('aria-modal', 'true');

        var content = '<div class="modal-overlay"></div>';
        content += '<div class="modal-content">';
        content += '<div class="modal-header">';
        content += '<h2 id="help-center-title">Help Center</h2>';
        content += '<button class="modal-close" aria-label="Close help center">×</button>';
        content += '</div>';
        content += '<div class="modal-body">';

        // Quick Start section
        content += '<div class="help-section">';
        content += '<h3>📱 Quick Start</h3>';
        content += '<ul>';
        content += '<li><a href="docs/user-guide/QUICK_START_GUIDE.md" target="_blank">Quick Start Guide</a> - Get started in 5 minutes</li>';
        content += '<li><a href="docs/user-guide/VIDEO_TUTORIALS.md" target="_blank">Video Tutorials</a> - Watch step-by-step guides</li>';
        content += '</ul>';
        content += '</div>';

        // Documentation section
        content += '<div class="help-section">';
        content += '<h3>📖 Documentation</h3>';
        content += '<ul>';
        content += '<li><a href="docs/user-guide/FAQ.md" target="_blank">FAQ</a> - Common questions answered</li>';
        content += '<li><a href="docs/user-guide/BEST_PRACTICES.md" target="_blank">Best Practices</a> - Pro tips and workflows</li>';
        content += '<li><a href="docs/user-guide/TRAINING_CHECKLIST.md" target="_blank">Training Checklist</a> - 6-week learning path</li>';
        content += '</ul>';
        content += '</div>';

        // Support section
        content += '<div class="help-section">';
        content += '<h3>💬 Support</h3>';
        content += '<p>Need help? Contact us:</p>';
        content += '<ul>';
        content += '<li>Email: <a href="mailto:support@tictacstick.com.au">support@tictacstick.com.au</a></li>';

        // Get phone number from company config or invoice settings
        var supportPhone = '0400 000 000'; // Default placeholder

        // Try to get from invoice settings first (user-configured)
        try {
            var invoiceSettings = localStorage.getItem('invoice-settings');
            if (invoiceSettings) {
                var settings = JSON.parse(invoiceSettings);
                if (settings && settings.phone) {
                    supportPhone = settings.phone;
                }
            }
        } catch (e) {
            // Silently fail, use default
        }

        // Fall back to company config if available and invoice settings don't have it
        if (supportPhone === '0400 000 000' && typeof window.PDF_CONFIG !== 'undefined' &&
            window.PDF_CONFIG.COMPANY_CONFIG && window.PDF_CONFIG.COMPANY_CONFIG.phone) {
            supportPhone = window.PDF_CONFIG.COMPANY_CONFIG.phone;
        }

        content += '<li>Phone: ' + supportPhone + '</li>';
        content += '<li>Response time: 24-48 hours</li>';
        content += '</ul>';
        content += '<p class="help-note"><small>💡 Update contact details in Settings → Invoice Settings</small></p>';
        content += '</div>';

        // Keyboard shortcuts section
        content += '<div class="help-section">';
        content += '<h3>⌨️ Keyboard Shortcuts</h3>';
        content += '<ul>';
        content += '<li><kbd>Ctrl+N</kbd> - New Quote</li>';
        content += '<li><kbd>Ctrl+S</kbd> - Save Quote</li>';
        content += '<li><kbd>Ctrl+P</kbd> - Generate PDF</li>';
        content += '<li><kbd>Ctrl+F</kbd> - Search</li>';
        content += '<li><kbd>Ctrl+/</kbd> - Show Help</li>';
        content += '</ul>';
        content += '</div>';

        content += '</div>'; // modal-body
        content += '<div class="modal-footer">';
        content += '<button class="btn btn-primary modal-close-btn">Close</button>';
        content += '</div>';
        content += '</div>'; // modal-content

        modal.innerHTML = content;

        // Close handlers
        var closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn, .modal-overlay');
        for (var i = 0; i < closeButtons.length; i++) {
            closeButtons[i].onclick = function() {
                closeHelpCenter(modal);
            };
        }

        // ESC key handler
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                closeHelpCenter(modal);
                document.removeEventListener('keydown', escHandler);
            }
        });

        return modal;
    }

    /**
     * Close help center modal
     * @param {HTMLElement} modal - Modal to close
     */
    function closeHelpCenter(modal) {
        modal.classList.remove('modal-visible');

        setTimeout(function() {
            if (modal.parentElement) {
                modal.parentElement.removeChild(modal);
            }
        }, 300);
    }

    /**
     * Play a help video
     * @param {string} videoId - Video identifier
     */
    function playHelpVideo(videoId) {
        // In a real implementation, this would open a video player
        // For now, just alert (would be replaced with actual video modal)
        console.log('[HELP] Playing video:', videoId);

        if (window.UIComponents && window.UIComponents.showAlert) {
            window.UIComponents.showAlert({
                title: 'Video Tutorial',
                message: 'Video tutorials are coming soon! For now, check the written documentation.',
                buttonText: 'OK'
            });
        } else {
            alert('Video tutorials are coming soon!\n\nFor now, please check the written documentation in the Help Center.');
        }
    }

    /**
     * Track help view for analytics
     * @param {string} helpId - Help item ID
     */
    function trackHelpView(helpId) {
        try {
            var viewedHelp = JSON.parse(localStorage.getItem('help-views') || '{}');
            viewedHelp[helpId] = (viewedHelp[helpId] || 0) + 1;
            localStorage.setItem('help-views', JSON.stringify(viewedHelp));
        } catch (e) {
            console.warn('[HELP] Failed to track view:', e);
        }
    }

    /**
     * Initialize help system
     */
    function init() {
        console.log('[HELP-SYSTEM] Initializing...');

        // Add help icons to elements with data-help
        addHelpIcons();

        // Add global help button
        addHelpButton();

        // Close tooltips when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.help-tooltip') && !e.target.closest('.help-icon-inline')) {
                hideAllTooltips();
            }
        });

        // Keyboard shortcut: Ctrl+/ for help center
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                showHelpCenter();
            }
        });

        console.log('[HELP-SYSTEM] Initialized successfully');
    }

    /**
     * Re-scan for new help elements (call after dynamic content loads)
     */
    function refresh() {
        addHelpIcons();
    }

    // Module registration
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('helpSystem', {
            init: init,
            refresh: refresh,
            showTooltip: showTooltip,
            showHelpCenter: showHelpCenter,
            hideAllTooltips: hideAllTooltips
        });
    }

    // Global API
    window.HelpSystem = {
        init: init,
        refresh: refresh,
        showTooltip: showTooltip,
        showHelpCenter: showHelpCenter,
        hideAllTooltips: hideAllTooltips
    };

    // Auto-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[HELP-SYSTEM] Module loaded');
})();
