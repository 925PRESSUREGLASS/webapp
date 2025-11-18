// settings-modern.js - Modern Settings UI Controller
// Dependencies: app.js (for state management)
// iOS Safari 12+ compatible (no arrow functions, template literals, or let/const)

(function() {
	'use strict';

	// Module state
	var sliders = {};
	var quickValueButtons = {};

	/**
	 * Initialize modern settings UI
	 */
	function init() {
		console.log('[SETTINGS-MODERN] Initializing...');

		// Wait for DOM to be ready
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function() {
				setupSliders();
				setupQuickValueButtons();
			});
		} else {
			setupSliders();
			setupQuickValueButtons();
		}
	}

	/**
	 * Setup all range sliders with value badges
	 */
	function setupSliders() {
		// Get all sliders
		var sliderElements = document.querySelectorAll('.setting-slider');

		for (var i = 0; i < sliderElements.length; i++) {
			var slider = sliderElements[i];
			var sliderId = slider.id;

			// Store slider reference
			sliders[sliderId] = slider;

			// Add input event listener
			addSliderListener(slider);

			// Initialize value badge
			updateValueBadge(slider);

			// Update slider fill effect
			updateSliderFill(slider);
		}

		console.log('[SETTINGS-MODERN] Configured ' + sliderElements.length + ' sliders');
	}

	/**
	 * Add event listener to slider (ES5 compatible)
	 * @param {HTMLElement} slider
	 */
	function addSliderListener(slider) {
		slider.addEventListener('input', function() {
			updateValueBadge(slider);
			updateSliderFill(slider);
			highlightActiveQuickButton(slider);
		});

		slider.addEventListener('change', function() {
			// Trigger the original input's change event for app.js to pick up
			var event;
			if (typeof Event === 'function') {
				event = new Event('input', { bubbles: true });
			} else {
				// IE11 fallback
				event = document.createEvent('Event');
				event.initEvent('input', true, true);
			}
			slider.dispatchEvent(event);
		});
	}

	/**
	 * Update value badge display
	 * @param {HTMLElement} slider
	 */
	function updateValueBadge(slider) {
		var sliderId = slider.id;
		var value = parseFloat(slider.value);

		// Find corresponding value badge
		var badgeId = sliderId.replace('Input', 'Value');
		var badge = document.getElementById(badgeId);

		if (badge) {
			// Format value based on badge type
			var formattedValue = formatBadgeValue(value, badge);
			badge.textContent = formattedValue;

			// Update status indicator color based on value
			updateStatusIndicator(slider, value);
		}
	}

	/**
	 * Format badge value based on its CSS classes
	 * @param {number} value
	 * @param {HTMLElement} badge
	 * @returns {string}
	 */
	function formatBadgeValue(value, badge) {
		var classes = badge.className;

		// Currency values
		if (classes.indexOf('currency') !== -1) {
			return Math.round(value).toString();
		}

		// Percentage values
		if (classes.indexOf('percentage') !== -1) {
			return Math.round(value).toString();
		}

		// Minutes values
		if (classes.indexOf('minutes') !== -1) {
			return Math.round(value).toString();
		}

		// Multiplier values (1.0x format)
		if (classes.indexOf('hours') === -1 && value < 10) {
			return value.toFixed(1) + 'x';
		}

		return value.toString();
	}

	/**
	 * Update status indicator color based on value
	 * @param {HTMLElement} slider
	 * @param {number} value
	 */
	function updateStatusIndicator(slider, value) {
		var settingItem = slider.closest('.setting-item');
		if (!settingItem) return;

		var indicator = settingItem.querySelector('.setting-status-indicator');
		if (!indicator) return;

		// Get slider range
		var min = parseFloat(slider.getAttribute('min')) || 0;
		var max = parseFloat(slider.getAttribute('max')) || 100;
		var range = max - min;
		var percent = ((value - min) / range) * 100;

		// Remove existing classes
		indicator.className = 'setting-status-indicator';

		// Set color based on value position
		// Optimal: middle 40-60% of range
		// Warning: outer ranges but not extreme
		// Danger: extreme values
		if (percent >= 40 && percent <= 60) {
			indicator.classList.add('optimal');
		} else if (percent < 20 || percent > 80) {
			indicator.classList.add('danger');
		} else {
			indicator.classList.add('warning');
		}
	}

	/**
	 * Update slider visual fill effect
	 * @param {HTMLElement} slider
	 */
	function updateSliderFill(slider) {
		var min = parseFloat(slider.getAttribute('min')) || 0;
		var max = parseFloat(slider.getAttribute('max')) || 100;
		var value = parseFloat(slider.value);

		// Calculate percentage
		var percent = ((value - min) / (max - min)) * 100;

		// Update CSS variable for fill effect
		slider.style.setProperty('--slider-value', percent + '%');
	}

	/**
	 * Setup quick value buttons
	 */
	function setupQuickValueButtons() {
		var buttons = document.querySelectorAll('.quick-value-btn');

		for (var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			addQuickButtonListener(button);
		}

		console.log('[SETTINGS-MODERN] Configured ' + buttons.length + ' quick value buttons');
	}

	/**
	 * Add event listener to quick value button
	 * @param {HTMLElement} button
	 */
	function addQuickButtonListener(button) {
		button.addEventListener('click', function(e) {
			e.preventDefault();

			var value = button.getAttribute('data-value');
			var targetId = button.getAttribute('data-target');

			if (!value || !targetId) return;

			var slider = document.getElementById(targetId);
			if (!slider) return;

			// Set slider value
			slider.value = value;

			// Update UI
			updateValueBadge(slider);
			updateSliderFill(slider);
			highlightActiveQuickButton(slider);

			// Trigger change event for app.js
			var event;
			if (typeof Event === 'function') {
				event = new Event('input', { bubbles: true });
			} else {
				event = document.createEvent('Event');
				event.initEvent('input', true, true);
			}
			slider.dispatchEvent(event);
		});
	}

	/**
	 * Highlight active quick value button
	 * @param {HTMLElement} slider
	 */
	function highlightActiveQuickButton(slider) {
		var sliderId = slider.id;
		var currentValue = parseFloat(slider.value);

		// Find all quick buttons for this slider
		var buttons = document.querySelectorAll('.quick-value-btn[data-target="' + sliderId + '"]');

		for (var i = 0; i < buttons.length; i++) {
			var button = buttons[i];
			var buttonValue = parseFloat(button.getAttribute('data-value'));

			// Highlight if value matches (with small tolerance for decimals)
			if (Math.abs(currentValue - buttonValue) < 0.01) {
				button.classList.add('active');
			} else {
				button.classList.remove('active');
			}
		}
	}

	/**
	 * Get current settings from sliders
	 * @returns {Object}
	 */
	function getCurrentSettings() {
		return {
			baseFee: parseFloat(document.getElementById('baseFeeInput').value) || 120,
			hourlyRate: parseFloat(document.getElementById('hourlyRateInput').value) || 95,
			minimumJob: parseFloat(document.getElementById('minimumJobInput').value) || 180,
			highReachModifier: parseFloat(document.getElementById('highReachModifierInput').value) || 60,
			insideMultiplier: parseFloat(document.getElementById('insideMultiplierInput').value) || 1.0,
			outsideMultiplier: parseFloat(document.getElementById('outsideMultiplierInput').value) || 1.0,
			pressureHourlyRate: parseFloat(document.getElementById('pressureHourlyRateInput').value) || 120,
			setupBufferMinutes: parseFloat(document.getElementById('setupBufferMinutesInput').value) || 15
		};
	}

	/**
	 * Apply settings to sliders
	 * @param {Object} settings
	 */
	function applySettings(settings) {
		if (!settings) return;

		var sliderIds = [
			'baseFeeInput',
			'hourlyRateInput',
			'minimumJobInput',
			'highReachModifierInput',
			'insideMultiplierInput',
			'outsideMultiplierInput',
			'pressureHourlyRateInput',
			'setupBufferMinutesInput'
		];

		for (var i = 0; i < sliderIds.length; i++) {
			var sliderId = sliderIds[i];
			var slider = document.getElementById(sliderId);

			if (slider && settings[sliderId.replace('Input', '')]) {
				var value = settings[sliderId.replace('Input', '')];
				slider.value = value;
				updateValueBadge(slider);
				updateSliderFill(slider);
				highlightActiveQuickButton(slider);
			}
		}
	}

	/**
	 * Reset all settings to defaults
	 */
	function resetToDefaults() {
		applySettings({
			baseFee: 120,
			hourlyRate: 95,
			minimumJob: 180,
			highReachModifier: 60,
			insideMultiplier: 1.0,
			outsideMultiplier: 1.0,
			pressureHourlyRate: 120,
			setupBufferMinutes: 15
		});
	}

	// Module registration
	if (window.APP && window.APP.registerModule) {
		window.APP.registerModule('settingsModern', {
			init: init,
			getCurrentSettings: getCurrentSettings,
			applySettings: applySettings,
			resetToDefaults: resetToDefaults
		});
	}

	// Global API
	window.SettingsModern = {
		init: init,
		getCurrentSettings: getCurrentSettings,
		applySettings: applySettings,
		resetToDefaults: resetToDefaults
	};

	// Auto-initialize
	init();

	console.log('[SETTINGS-MODERN] Module loaded');
})();
