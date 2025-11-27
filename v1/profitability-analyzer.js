// profitability-analyzer.js
// Real-time profitability tracking for quotes
// Target rate monitoring and job value assessment
// ES5 compatible

(function() {
  'use strict';

  var ProfitabilityAnalyzer = {

    // Default target rate
    targetRate: 150.00, // Per hour

    // Analyze quote profitability
    analyze: function(quote, config) {
      config = config || {};
      var targetRate = config.targetRate || this.targetRate;

      // Extract times
      var workTimeMinutes = quote.totalMinutes || 0;
      var travelTimeMinutes = quote.travelTime || 0;
      var setupTimeMinutes = quote.setupTime || 0;

      var totalTimeMinutes = workTimeMinutes + travelTimeMinutes + setupTimeMinutes;
      var totalTimeHours = totalTimeMinutes / 60;

      // Extract revenue
      var total = quote.total || 0;

      // Calculate actual hourly rate
      var actualHourlyRate = totalTimeHours > 0 ? (total / totalTimeHours) : 0;

      // Calculate variance
      var variance = actualHourlyRate - targetRate;
      var percentOfTarget = targetRate > 0 ? (actualHourlyRate / targetRate) * 100 : 0;

      // Determine status
      var status = this.getStatus(percentOfTarget);

      // Calculate recommendations
      var recommendation = this.getRecommendation(percentOfTarget, variance, total, totalTimeHours, targetRate);

      return {
        workTimeHours: workTimeMinutes / 60,
        travelTimeHours: travelTimeMinutes / 60,
        setupTimeHours: setupTimeMinutes / 60,
        totalTimeHours: totalTimeHours,
        totalRevenue: total,
        targetRate: targetRate,
        actualHourlyRate: actualHourlyRate,
        variance: variance,
        percentOfTarget: percentOfTarget,
        status: status,
        recommendation: recommendation,
        suggestedPrice: this.calculateSuggestedPrice(totalTimeHours, targetRate),
        profitMargin: this.calculateProfitMargin(total, totalTimeHours, targetRate)
      };
    },

    // Get status based on percentage of target
    getStatus: function(percentOfTarget) {
      if (percentOfTarget >= 120) {
        return {
          level: 'excellent',
          label: 'EXCELLENT',
          color: '#10b981',
          icon: '🟢',
          description: 'Well above target - take this job!'
        };
      } else if (percentOfTarget >= 100) {
        return {
          level: 'good',
          label: 'GOOD',
          color: '#3b82f6',
          icon: '✅',
          description: 'Meets target rate'
        };
      } else if (percentOfTarget >= 80) {
        return {
          level: 'caution',
          label: 'CAUTION',
          color: '#f59e0b',
          icon: '⚠️',
          description: 'Below target but acceptable'
        };
      } else if (percentOfTarget >= 60) {
        return {
          level: 'warning',
          label: 'WARNING',
          color: '#ef4444',
          icon: '🔴',
          description: 'Significantly below target'
        };
      } else {
        return {
          level: 'reject',
          label: 'REJECT',
          color: '#991b1b',
          icon: '❌',
          description: 'Too low - not worth taking'
        };
      }
    },

    // Get recommendation
    getRecommendation: function(percentOfTarget, variance, total, totalHours, targetRate) {
      var messages = [];

      if (percentOfTarget >= 120) {
        messages.push('✅ Excellent profitability - prioritize this job');
        messages.push('💰 You\'re earning $' + variance.toFixed(2) + '/hr above target');
      } else if (percentOfTarget >= 100) {
        messages.push('✅ Good job - meets your target rate');
        messages.push('📊 Right on target at $' + targetRate.toFixed(2) + '/hr');
      } else if (percentOfTarget >= 80) {
        messages.push('⚠️ Below target but may be acceptable');
        messages.push('💡 Consider: Increase price by $' + (variance * -1 * totalHours).toFixed(2) + ' to meet target');
        messages.push('💡 Or: Reduce scope/time to improve efficiency');
      } else if (percentOfTarget >= 60) {
        messages.push('🔴 Warning: Significantly below target');
        messages.push('❗ You\'re losing $' + (variance * -1).toFixed(2) + '/hr');
        messages.push('💡 Suggest: Increase to $' + (targetRate * totalHours).toFixed(2) + ' minimum');
        messages.push('🤔 Question: Is this job worth your time?');
      } else {
        messages.push('❌ REJECT: This job is not profitable');
        messages.push('💸 You\'re losing $' + (variance * -1).toFixed(2) + '/hr!');
        messages.push('🚫 Recommend declining unless strategic reasons exist');
        messages.push('📈 Need to charge $' + (targetRate * totalHours).toFixed(2) + ' minimum');
      }

      return messages;
    },

    // Calculate suggested price
    calculateSuggestedPrice: function(totalHours, targetRate) {
      return totalHours * targetRate;
    },

    // Calculate profit margin
    calculateProfitMargin: function(revenue, totalHours, targetRate) {
      var targetRevenue = totalHours * targetRate;
      var margin = revenue - targetRevenue;
      var marginPercent = targetRevenue > 0 ? (margin / targetRevenue) * 100 : 0;

      return {
        amount: margin,
        percent: marginPercent
      };
    },

    // Create profitability display UI
    createProfitabilityUI: function(analysis) {
      var container = document.createElement('div');
      container.className = 'profitability-display';
      container.style.cssText =
        'padding: 20px; ' +
        'background: ' + analysis.status.color + '15; ' +
        'border: 3px solid ' + analysis.status.color + '; ' +
        'border-radius: 12px; ' +
        'margin: 16px 0;';

      // Header
      var header = document.createElement('div');
      header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';

      var statusLabel = document.createElement('div');
      statusLabel.style.cssText = 'font-size: 24px; font-weight: 700; color: ' + analysis.status.color + ';';
      statusLabel.textContent = analysis.status.icon + ' ' + analysis.status.label;

      var rateDisplay = document.createElement('div');
      rateDisplay.style.cssText = 'font-size: 32px; font-weight: 700; color: ' + analysis.status.color + ';';
      rateDisplay.textContent = '$' + analysis.actualHourlyRate.toFixed(0) + '/hr';

      header.appendChild(statusLabel);
      header.appendChild(rateDisplay);
      container.appendChild(header);

      // Description
      var description = document.createElement('div');
      description.style.cssText = 'font-size: 14px; color: #475569; margin-bottom: 16px; font-weight: 500;';
      description.textContent = analysis.status.description;
      container.appendChild(description);

      // Metrics grid
      var metrics = document.createElement('div');
      metrics.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;';

      var metricsData = [
        { label: 'Target Rate', value: '$' + analysis.targetRate.toFixed(0) + '/hr' },
        { label: 'Actual Rate', value: '$' + analysis.actualHourlyRate.toFixed(0) + '/hr' },
        { label: 'Variance', value: (analysis.variance >= 0 ? '+' : '') + '$' + analysis.variance.toFixed(0) + '/hr' },
        { label: 'Total Time', value: analysis.totalTimeHours.toFixed(1) + ' hrs' },
        { label: 'Total Revenue', value: '$' + analysis.totalRevenue.toFixed(2) },
        { label: 'Target %', value: analysis.percentOfTarget.toFixed(0) + '%' }
      ];

      for (var i = 0; i < metricsData.length; i++) {
        var metric = metricsData[i];
        var metricBox = document.createElement('div');
        metricBox.style.cssText = 'background: white; padding: 12px; border-radius: 6px; text-align: center;';

        var metricLabel = document.createElement('div');
        metricLabel.style.cssText = 'font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px;';
        metricLabel.textContent = metric.label;

        var metricValue = document.createElement('div');
        metricValue.style.cssText = 'font-size: 16px; font-weight: 700; color: #1e293b;';
        metricValue.textContent = metric.value;

        metricBox.appendChild(metricLabel);
        metricBox.appendChild(metricValue);
        metrics.appendChild(metricBox);
      }

      container.appendChild(metrics);

      // Recommendations
      if (analysis.recommendation && analysis.recommendation.length > 0) {
        var recommendations = document.createElement('div');
        recommendations.style.cssText = 'background: white; padding: 16px; border-radius: 8px;';

        var recTitle = document.createElement('div');
        recTitle.style.cssText = 'font-weight: 600; margin-bottom: 8px; font-size: 14px;';
        recTitle.textContent = '💡 Recommendations:';
        recommendations.appendChild(recTitle);

        var recList = document.createElement('ul');
        recList.style.cssText = 'margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;';

        for (var j = 0; j < analysis.recommendation.length; j++) {
          var recItem = document.createElement('li');
          recItem.textContent = analysis.recommendation[j];
          recList.appendChild(recItem);
        }

        recommendations.appendChild(recList);
        container.appendChild(recommendations);
      }

      return container;
    }
  };

  // Export globally
  window.ProfitabilityAnalyzer = ProfitabilityAnalyzer;

})();
