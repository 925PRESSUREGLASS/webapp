// quick-add-ui.js
// Quick-add quantity buttons for mobile-optimized quote entry
// Large touch targets (60x60px) with visual feedback
// ES5 compatible

(function() {
  'use strict';

  // Quick-add UI component for wizard
  var QuickAddUI = {

    // Create quantity button interface
    createQuantityButtons: function(config) {
      config = config || {};
      var defaultQuantities = [1, 5, 10, 20, 50];
      var quantities = config.quantities || defaultQuantities;
      var currentQty = 0;
      var onChange = config.onChange || function() {};

      var container = document.createElement('div');
      container.className = 'quick-add-quantity-container';

      // Create quantity buttons
      for (var i = 0; i < quantities.length; i++) {
        var qty = quantities[i];
        var btn = this.createQuantityButton(qty, function(amount) {
          currentQty += amount;
          updateDisplay(currentQty);
          onChange(currentQty);
        });
        container.appendChild(btn);
      }

      // Add custom input button
      var customBtn = this.createCustomInput(function(amount) {
        if (amount > 0) {
          currentQty += amount;
          updateDisplay(currentQty);
          onChange(currentQty);
        }
      });
      container.appendChild(customBtn);

      // Create display area
      var display = document.createElement('div');
      display.className = 'quick-add-display';
      display.textContent = 'Quantity: 0';
      container.appendChild(display);

      // Create reset button
      var resetBtn = document.createElement('button');
      resetBtn.type = 'button';
      resetBtn.className = 'btn btn-tertiary btn-sm';
      resetBtn.textContent = 'Reset';
      resetBtn.addEventListener('click', function() {
        currentQty = 0;
        updateDisplay(0);
        onChange(0);
      });
      container.appendChild(resetBtn);

      function updateDisplay(qty) {
        display.textContent = 'Quantity: ' + qty;
      }

      // Expose getter
      container.getQuantity = function() {
        return currentQty;
      };

      container.setQuantity = function(qty) {
        currentQty = qty || 0;
        updateDisplay(currentQty);
      };

      return container;
    },

    // Create individual quantity button
    createQuantityButton: function(quantity, onClick) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-add-btn';
      btn.textContent = '+' + quantity;
      btn.setAttribute('data-qty', quantity);
      btn.setAttribute('aria-label', 'Add ' + quantity + ' to quantity');

      // Click handler with visual feedback
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        onClick(quantity);

        // Brief visual feedback for successful action
        btn.classList.add('quick-add-btn-success');
        setTimeout(function() {
          btn.classList.remove('quick-add-btn-success');
        }, 200);
      });

      return btn;
    },

    // Create custom quantity input
    createCustomInput: function(onSubmit) {
      var wrapper = document.createElement('div');
      wrapper.className = 'quick-add-custom-wrapper';

      var input = document.createElement('input');
      input.type = 'number';
      input.className = 'quick-add-custom-input';
      input.placeholder = 'Custom';
      input.min = '1';
      input.max = '999';
      input.setAttribute('aria-label', 'Enter custom quantity');

      var addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'quick-add-custom-btn';
      addBtn.textContent = '+';
      addBtn.setAttribute('aria-label', 'Add custom quantity');

      addBtn.addEventListener('click', function() {
        var val = parseInt(input.value, 10);
        if (!isNaN(val) && val > 0 && val <= 999) {
          onSubmit(val);
          input.value = '';

          // Visual feedback
          addBtn.classList.add('quick-add-custom-btn-success');
          setTimeout(function() {
            addBtn.classList.remove('quick-add-custom-btn-success');
          }, 200);
        }
      });

      // Enter key support
      input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addBtn.click();
        }
      });

      wrapper.appendChild(input);
      wrapper.appendChild(addBtn);

      return wrapper;
    },

    // Create bulk-add interface for multiple window types
    createBulkAddInterface: function(windowTypes, onComplete) {
      var container = document.createElement('div');
      container.className = 'bulk-add-container';
      container.style.cssText = 'max-height: 500px; overflow-y: auto; padding: 4px;';

      var selections = {};

      // Create UI for each window type
      for (var i = 0; i < windowTypes.length; i++) {
        var wt = windowTypes[i];
        if (!wt.category || wt.category === 'custom') continue; // Skip custom

        var typeRow = this.createBulkTypeRow(wt, function(typeId, quantity) {
          selections[typeId] = quantity;
        });

        container.appendChild(typeRow);
      }

      // Summary section
      var summary = document.createElement('div');
      summary.style.cssText = 'position: sticky; bottom: 0; background: white; border-top: 2px solid #e2e8f0; padding: 16px; margin-top: 16px;';

      var summaryText = document.createElement('div');
      summaryText.style.cssText = 'font-size: 16px; font-weight: 600; margin-bottom: 12px;';
      summaryText.textContent = 'Selected: 0 windows';
      summary.appendChild(summaryText);

      var submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'btn';
      submitBtn.textContent = 'Add All to Quote';
      submitBtn.style.cssText = 'width: 100%; min-height: 50px; font-size: 16px;';
      submitBtn.addEventListener('click', function() {
        if (onComplete) {
          onComplete(selections);
        }
      });
      summary.appendChild(submitBtn);

      container.appendChild(summary);

      // Update summary when selections change
      container.updateSummary = function() {
        var total = 0;
        var totalPrice = 0;

        for (var id in selections) {
          if (selections[id] > 0) {
            total += selections[id];
            var type = findWindowType(id, windowTypes);
            if (type && type.basePrice) {
              totalPrice += selections[id] * type.basePrice;
            }
          }
        }

        summaryText.textContent = 'Selected: ' + total + ' windows ($' + totalPrice.toFixed(2) + ')';
        submitBtn.disabled = total === 0;
      };

      function findWindowType(id, types) {
        for (var i = 0; i < types.length; i++) {
          if (types[i].id === id) return types[i];
        }
        return null;
      }

      return container;
    },

    // Create row for bulk add interface
    createBulkTypeRow: function(windowType, onChange) {
      var row = document.createElement('div');
      row.style.cssText = 'border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 8px; background: white;';

      var header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';

      var title = document.createElement('div');
      title.style.cssText = 'font-weight: 600; font-size: 14px;';
      title.textContent = windowType.name || windowType.label;

      var price = document.createElement('div');
      price.style.cssText = 'color: #10b981; font-weight: 600;';
      price.textContent = windowType.basePrice ? '$' + windowType.basePrice.toFixed(0) : '';

      header.appendChild(title);
      header.appendChild(price);
      row.appendChild(header);

      // Quantity buttons
      var qtyButtons = this.createQuantityButtons({
        quantities: [1, 5, 10, 20],
        onChange: function(qty) {
          onChange(windowType.id, qty);
          row.parentNode.updateSummary && row.parentNode.updateSummary();
        }
      });

      row.appendChild(qtyButtons);

      return row;
    }
  };

  // Export globally
  window.QuickAddUI = QuickAddUI;

})();
