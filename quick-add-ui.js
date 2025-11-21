// quick-add-ui.js
// Quick-add quantity buttons for mobile-optimized quote entry
// Large touch targets (60x60px) with visual feedback
// ES5 compatible

(function() {
  'use strict';

  var quantityButtonPrototype = null;
  var addButtonPrototype = null;

  function getQuantityButtonPrototype() {
    if (!quantityButtonPrototype) {
      quantityButtonPrototype = document.createElement('button');
      quantityButtonPrototype.type = 'button';
      quantityButtonPrototype.className = 'quick-add-btn';
    }
    return quantityButtonPrototype;
  }

  function getAddButtonPrototype() {
    if (!addButtonPrototype) {
      addButtonPrototype = document.createElement('button');
      addButtonPrototype.type = 'button';
      addButtonPrototype.className = 'quick-add-submit';
      addButtonPrototype.textContent = '+';
    }
    return addButtonPrototype;
  }

  function attachPressListeners(btn) {
    btn.addEventListener('pointerdown', function() {
      btn.classList.add('is-pressed');
    });

    btn.addEventListener('pointerup', function() {
      btn.classList.remove('is-pressed');
    });

    btn.addEventListener('pointercancel', function() {
      btn.classList.remove('is-pressed');
    });

    btn.addEventListener('pointerleave', function() {
      btn.classList.remove('is-pressed');
    });
  }

  function animateActivation(btn) {
    btn.classList.add('is-activated');
    setTimeout(function() {
      btn.classList.remove('is-activated');
    }, 200);
  }

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
      container.className = 'quick-add-quantity';

      // Create quantity buttons
      var buttonFragment = document.createDocumentFragment();
      for (var i = 0; i < quantities.length; i++) {
        var qty = quantities[i];
        var btn = this.createQuantityButton(qty, function(amount) {
          currentQty += amount;
          updateDisplay(currentQty);
          onChange(currentQty);
        });
        buttonFragment.appendChild(btn);
      }

      container.appendChild(buttonFragment);

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
      resetBtn.className = 'btn btn-ghost btn-small quick-add-reset';
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
      var btn = getQuantityButtonPrototype().cloneNode(true);
      btn.textContent = '+' + quantity;
      btn.setAttribute('data-qty', quantity);

      attachPressListeners(btn);

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        onClick(quantity);
        animateActivation(btn);
      });

      return btn;
    },

    // Create custom quantity input
    createCustomInput: function(onSubmit) {
      var wrapper = document.createElement('div');
      wrapper.className = 'quick-add-custom';

      var input = document.createElement('input');
      input.type = 'number';
      input.placeholder = 'Custom';
      input.min = '1';
      input.max = '999';
      input.className = 'quick-add-input';

      var addBtn = getAddButtonPrototype().cloneNode(true);
      attachPressListeners(addBtn);

      addBtn.addEventListener('click', function() {
        var val = parseInt(input.value, 10);
        if (!isNaN(val) && val > 0 && val <= 999) {
          onSubmit(val);
          input.value = '';
          animateActivation(addBtn);
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

      var selections = {};

      // Create UI for each window type
      for (var i = 0; i < windowTypes.length; i++) {
        var wt = windowTypes[i];
        if (!wt.category || wt.category === 'custom') continue;

        var typeRow = this.createBulkTypeRow(wt, function(typeId, quantity) {
          selections[typeId] = quantity;
        });

        container.appendChild(typeRow);
      }

      // Summary section
      var summary = document.createElement('div');
      summary.className = 'bulk-add-sticky-summary';

      var summaryText = document.createElement('div');
      summaryText.className = 'bulk-add-summary-text';
      summaryText.textContent = 'Selected: 0 windows';
      summary.appendChild(summaryText);

      var submitBtn = document.createElement('button');
      submitBtn.type = 'button';
      submitBtn.className = 'btn bulk-add-submit';
      submitBtn.textContent = 'Add All to Quote';
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
      row.className = 'bulk-add-type-row';

      var header = document.createElement('div');
      header.className = 'bulk-add-header';

      var title = document.createElement('div');
      title.className = 'bulk-add-title';
      title.textContent = windowType.name || windowType.label;

      var price = document.createElement('div');
      price.className = 'bulk-add-price';
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
