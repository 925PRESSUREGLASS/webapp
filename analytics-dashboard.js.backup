/**
 * Analytics Dashboard Controller
 * Manages analytics UI updates and user interactions
 *
 * Dependencies: analytics-engine.js, analytics-config.js, Chart.js
 * iOS Safari 12+ compatible (ES5 syntax)
 */

(function() {
    'use strict';

    var _currentDashboardData = null;
    var _revenueTrendChart = null;
    var _funnelChart = null;
    var _serviceChart = null;

    /**
     * Initialize dashboard
     */
    function init() {
        console.log('[ANALYTICS-DASHBOARD] Initializing...');

        // Set up event listeners
        setupEventListeners();

        // Load initial dashboard
        var rangeSelector = document.getElementById('analytics-date-range-selector');
        var rangeId = rangeSelector ? rangeSelector.value : 'last_30_days';
        updateDashboard(rangeId);
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Date range selector
        var rangeSelector = document.getElementById('analytics-date-range-selector');
        if (rangeSelector) {
            rangeSelector.addEventListener('change', function() {
                updateDashboard(this.value);
            });
        }

        // Revenue chart grouping
        var chartGrouping = document.getElementById('revenue-chart-grouping');
        if (chartGrouping) {
            chartGrouping.addEventListener('change', function() {
                if (_currentDashboardData) {
                    var groupBy = this.value;
                    var trend = window.AnalyticsEngine.getRevenueTrend(
                        _currentDashboardData.dateRange,
                        groupBy
                    );
                    updateRevenueTrendChart(trend);
                }
            });
        }
    }

    /**
     * Update dashboard with new data
     */
    function updateDashboard(rangeId) {
        rangeId = rangeId || 'last_30_days';

        console.log('[ANALYTICS-DASHBOARD] Updating dashboard for range:', rangeId);

        try {
            // Generate dashboard data
            _currentDashboardData = window.AnalyticsEngine.generateDashboardData(rangeId);

            // Update all sections
            updateKPICards(_currentDashboardData);
            updateRevenueTrendChart(_currentDashboardData.revenueTrend);
            updateConversionFunnelChart(_currentDashboardData.conversionFunnel);
            updateServiceBreakdownChart(_currentDashboardData.serviceBreakdown);
            updateDetailedMetrics(_currentDashboardData);

            console.log('[ANALYTICS-DASHBOARD] Dashboard updated successfully');
        } catch (e) {
            console.error('[ANALYTICS-DASHBOARD] Failed to update dashboard:', e);
            showError('Failed to update analytics dashboard');
        }
    }

    /**
     * Update KPI cards
     */
    function updateKPICards(data) {
        var config = window.AnalyticsConfig.config;

        // Revenue
        var revenue = data.revenue.paidRevenue;
        updateKPICard('revenue', revenue, config.kpis.revenue.target, 'currency');

        // Quotes
        var quotes = data.sales.quotesGenerated;
        updateKPICard('quotes', quotes, config.kpis.quotesGenerated.target, 'number');

        // Conversion Rate
        var conversionRate = data.sales.conversionRate;
        updateKPICard('conversion', conversionRate, config.kpis.conversionRate.target, 'percentage');

        // Average Quote Value
        var avgValue = data.revenue.averageQuoteValue;
        updateKPICard('avg-value', avgValue, config.kpis.averageQuoteValue.target, 'currency');
    }

    /**
     * Update individual KPI card
     */
    function updateKPICard(kpiId, value, target, format) {
        var valueEl = document.getElementById('kpi-' + kpiId);
        var progressEl = document.getElementById(kpiId + '-progress');

        if (!valueEl || !progressEl) return;

        // Format value
        var formattedValue = formatValue(value, format);
        valueEl.textContent = formattedValue;

        // Calculate progress
        var progress = target > 0 ? (value / target) * 100 : 0;
        progressEl.style.width = Math.min(progress, 100) + '%';

        // Update progress bar color based on performance
        if (progress >= 100) {
            progressEl.style.backgroundColor = '#10b981'; // Success green
        } else if (progress >= 75) {
            progressEl.style.backgroundColor = '#2563eb'; // Primary blue
        } else if (progress >= 50) {
            progressEl.style.backgroundColor = '#f59e0b'; // Warning orange
        } else {
            progressEl.style.backgroundColor = '#ef4444'; // Danger red
        }
    }

    /**
     * Format value based on type
     */
    function formatValue(value, format) {
        if (typeof value !== 'number') return '0';

        switch (format) {
            case 'currency':
                return '$' + formatNumber(value, 2);
            case 'percentage':
                return formatNumber(value, 1) + '%';
            case 'number':
                return Math.round(value).toString();
            default:
                return value.toString();
        }
    }

    /**
     * Format number with commas
     */
    function formatNumber(num, decimals) {
        if (typeof num !== 'number') return '0';

        decimals = decimals !== undefined ? decimals : 2;

        var fixed = num.toFixed(decimals);
        var parts = fixed.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return parts.join('.');
    }

    /**
     * Update revenue trend chart
     */
    function updateRevenueTrendChart(trendData) {
        var ctx = document.getElementById('revenue-trend-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (_revenueTrendChart) {
            _revenueTrendChart.destroy();
        }

        // Prepare data
        var labels = [];
        var revenueData = [];
        var paidData = [];

        for (var i = 0; i < trendData.length; i++) {
            labels.push(trendData[i].period);
            revenueData.push(trendData[i].revenue);
            paidData.push(trendData[i].paid);
        }

        var config = window.AnalyticsConfig.config;

        // Create chart
        _revenueTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Revenue',
                        data: revenueData,
                        borderColor: config.charts.colors.primary,
                        backgroundColor: config.charts.colors.primary + '20',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Paid',
                        data: paidData,
                        borderColor: config.charts.colors.success,
                        backgroundColor: config.charts.colors.success + '20',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + formatNumber(context.parsed.y, 2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + formatNumber(value, 0);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update conversion funnel chart
     */
    function updateConversionFunnelChart(funnelData) {
        var ctx = document.getElementById('conversion-funnel-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (_funnelChart) {
            _funnelChart.destroy();
        }

        // Prepare data
        var labels = [];
        var counts = [];
        var percentages = [];

        for (var i = 0; i < funnelData.stages.length; i++) {
            labels.push(funnelData.stages[i].name);
            counts.push(funnelData.stages[i].count);
            percentages.push(funnelData.stages[i].percentage);
        }

        var config = window.AnalyticsConfig.config;

        // Create chart
        _funnelChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Count',
                    data: counts,
                    backgroundColor: config.charts.colors.primary
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var index = context.dataIndex;
                                return context.parsed.x + ' (' + percentages[index].toFixed(1) + '%)';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Update service breakdown chart
     */
    function updateServiceBreakdownChart(breakdown) {
        var ctx = document.getElementById('service-breakdown-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (_serviceChart) {
            _serviceChart.destroy();
        }

        // Prepare data
        var labels = [];
        var values = [];

        var config = window.AnalyticsConfig.config;

        var colors = [
            config.charts.colors.primary,
            config.charts.colors.success,
            config.charts.colors.warning,
            config.charts.colors.danger,
            config.charts.colors.neutral
        ];

        var services = Object.keys(breakdown.byService);
        for (var i = 0; i < services.length; i++) {
            if (breakdown.byService[services[i]].value > 0) {
                labels.push(services[i]);
                values.push(breakdown.byService[services[i]].value);
            }
        }

        // Create chart
        _serviceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var total = context.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                                var percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return context.label + ': $' + formatNumber(context.parsed, 2) + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update detailed metrics tables
     */
    function updateDetailedMetrics(data) {
        var config = window.AnalyticsConfig.config;

        // Financial metrics
        var financialRows = [
            { name: 'Total Revenue', value: '$' + formatNumber(data.revenue.totalRevenue, 2), target: '$' + formatNumber(config.kpis.revenue.target, 0) },
            { name: 'Paid Revenue', value: '$' + formatNumber(data.revenue.paidRevenue, 2), target: '-' },
            { name: 'Outstanding', value: '$' + formatNumber(data.revenue.outstandingRevenue, 2), target: '-' },
            { name: 'Avg Quote Value', value: '$' + formatNumber(data.revenue.averageQuoteValue, 2), target: '$' + formatNumber(config.kpis.averageQuoteValue.target, 0) },
            { name: 'Collection Rate', value: data.revenue.collectionRate.toFixed(1) + '%', target: config.kpis.collectionRate.target + '%' }
        ];

        renderMetricsTable('financial-metrics-body', financialRows);

        // Sales metrics
        var salesRows = [
            { name: 'Quotes Generated', value: data.sales.quotesGenerated, target: config.kpis.quotesGenerated.target },
            { name: 'Quotes Sent', value: data.sales.quotesSent, target: '-' },
            { name: 'Quotes Accepted', value: data.sales.quotesAccepted, target: '-' },
            { name: 'Conversion Rate', value: data.sales.conversionRate.toFixed(1) + '%', target: config.kpis.conversionRate.target + '%' },
            { name: 'Win Rate', value: data.sales.winRate.toFixed(1) + '%', target: config.kpis.winRate.target + '%' },
            { name: 'Avg Time to Close', value: data.sales.averageTimeToClose.toFixed(1) + ' days', target: '-' }
        ];

        renderMetricsTable('sales-metrics-body', salesRows);

        // Operations metrics
        var operationsRows = [
            { name: 'Total Tasks', value: data.operations.totalTasks, target: '-' },
            { name: 'Completed Tasks', value: data.operations.completedTasks, target: '-' },
            { name: 'Completion Rate', value: data.operations.completionRate.toFixed(1) + '%', target: config.kpis.followUpCompletion.target + '%' },
            { name: 'Avg Response Time', value: data.operations.averageResponseTime.toFixed(1) + ' hrs', target: config.kpis.averageResponseTime.target + ' hrs' }
        ];

        renderMetricsTable('operations-metrics-body', operationsRows);

        // Customer metrics
        var customerRows = [
            { name: 'Total Customers', value: data.customers.totalCustomers, target: '-' },
            { name: 'New Customers', value: data.customers.newCustomers, target: '-' },
            { name: 'Repeat Customers', value: data.customers.repeatCustomers, target: '-' },
            { name: 'Repeat Rate', value: data.customers.repeatCustomerRate.toFixed(1) + '%', target: config.kpis.repeatCustomerRate.target + '%' },
            { name: 'Avg Customer Value', value: '$' + formatNumber(data.customers.averageCustomerValue, 2), target: '-' }
        ];

        renderMetricsTable('customers-metrics-body', customerRows);
    }

    /**
     * Render metrics table
     */
    function renderMetricsTable(tableBodyId, rows) {
        var tbody = document.getElementById(tableBodyId);
        if (!tbody) return;

        tbody.innerHTML = '';

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var tr = document.createElement('tr');

            tr.innerHTML = '<td>' + row.name + '</td>' +
                          '<td>' + row.value + '</td>' +
                          '<td>' + row.target + '</td>' +
                          '<td><span class="metric-change">-</span></td>';

            tbody.appendChild(tr);
        }
    }

    /**
     * Show metrics tab
     */
    function showMetricsTab(tabId) {
        // Hide all tabs
        var tabs = document.querySelectorAll('.metrics-tab-content');
        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.remove('active');
        }

        // Remove active from all buttons
        var buttons = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.remove('active');
        }

        // Show selected tab
        var selectedTab = document.getElementById('metrics-' + tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Activate corresponding button
        var buttons = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < buttons.length; i++) {
            var btnText = buttons[i].textContent.toLowerCase();
            if (btnText.indexOf(tabId.toLowerCase()) > -1) {
                buttons[i].classList.add('active');
                break;
            }
        }
    }

    /**
     * Export dashboard
     */
    function exportDashboard() {
        if (!_currentDashboardData) {
            showError('No data to export');
            return;
        }

        try {
            // Generate CSV report
            var csv = generateCSVReport(_currentDashboardData);
            var filename = 'analytics-report-' + new Date().toISOString().split('T')[0] + '.csv';
            downloadCSV(csv, filename);

            showSuccess('Report exported successfully');
        } catch (e) {
            console.error('[ANALYTICS-DASHBOARD] Export failed:', e);
            showError('Failed to export report');
        }
    }

    /**
     * Generate CSV report
     */
    function generateCSVReport(data) {
        var csv = 'TicTacStick Analytics Report\n';
        csv += 'Generated: ' + new Date().toLocaleString() + '\n';
        csv += 'Period: ' + data.dateRange.rangeName + '\n\n';

        // Revenue metrics
        csv += 'Revenue Metrics\n';
        csv += 'Metric,Value\n';
        csv += 'Total Revenue,$' + data.revenue.totalRevenue.toFixed(2) + '\n';
        csv += 'Paid Revenue,$' + data.revenue.paidRevenue.toFixed(2) + '\n';
        csv += 'Outstanding,$' + data.revenue.outstandingRevenue.toFixed(2) + '\n';
        csv += 'Avg Quote Value,$' + data.revenue.averageQuoteValue.toFixed(2) + '\n';
        csv += 'Collection Rate,' + data.revenue.collectionRate.toFixed(1) + '%\n\n';

        // Sales metrics
        csv += 'Sales Metrics\n';
        csv += 'Metric,Value\n';
        csv += 'Quotes Generated,' + data.sales.quotesGenerated + '\n';
        csv += 'Quotes Sent,' + data.sales.quotesSent + '\n';
        csv += 'Quotes Accepted,' + data.sales.quotesAccepted + '\n';
        csv += 'Conversion Rate,' + data.sales.conversionRate.toFixed(1) + '%\n';
        csv += 'Win Rate,' + data.sales.winRate.toFixed(1) + '%\n\n';

        // Customer metrics
        csv += 'Customer Metrics\n';
        csv += 'Metric,Value\n';
        csv += 'Total Customers,' + data.customers.totalCustomers + '\n';
        csv += 'New Customers,' + data.customers.newCustomers + '\n';
        csv += 'Repeat Customers,' + data.customers.repeatCustomers + '\n';
        csv += 'Repeat Rate,' + data.customers.repeatCustomerRate.toFixed(1) + '%\n\n';

        // Service breakdown
        csv += 'Service Breakdown\n';
        csv += 'Service,Count,Value\n';
        Object.keys(data.serviceBreakdown.byService).forEach(function(service) {
            var item = data.serviceBreakdown.byService[service];
            csv += service + ',' + item.count + ',$' + item.value.toFixed(2) + '\n';
        });

        return csv;
    }

    /**
     * Download CSV file
     */
    function downloadCSV(csv, filename) {
        var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    /**
     * Show success message
     */
    function showSuccess(message) {
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast(message, 'success');
        } else if (window.showToast) {
            window.showToast(message, 'success');
        } else {
            alert(message);
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        if (window.UIComponents && window.UIComponents.showToast) {
            window.UIComponents.showToast(message, 'error');
        } else if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Public API
    var AnalyticsDashboard = {
        init: init,
        updateDashboard: updateDashboard,
        showMetricsTab: showMetricsTab,
        exportDashboard: exportDashboard
    };

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('analyticsDashboard', AnalyticsDashboard);
    }

    // Expose globally
    window.AnalyticsDashboard = AnalyticsDashboard;

    // Global functions for UI event handlers
    window.updateAnalyticsDashboard = function() {
        AnalyticsDashboard.updateDashboard();
    };

    window.showAnalyticsMetricsTab = function(tabId) {
        AnalyticsDashboard.showMetricsTab(tabId);
    };

    window.exportAnalyticsDashboard = function() {
        AnalyticsDashboard.exportDashboard();
    };

    console.log('[ANALYTICS-DASHBOARD] Initialized');

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Wait a bit for other modules to initialize
            setTimeout(function() {
                if (document.getElementById('analytics-date-range-selector')) {
                    init();
                }
            }, 500);
        });
    } else {
        // DOM already loaded
        setTimeout(function() {
            if (document.getElementById('analytics-date-range-selector')) {
                init();
            }
        }, 500);
    }

})();
