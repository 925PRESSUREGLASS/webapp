/**
 * Analytics Engine Module
 * Calculates metrics and generates business intelligence insights
 *
 * Dependencies: analytics-config.js, client-database.js (optional)
 * iOS Safari 12+ compatible (ES5 syntax)
 */

(function() {
    'use strict';

    /**
     * Get date range from configuration
     */
    function getDateRange(rangeId) {
        var config = window.AnalyticsConfig.getDateRangeConfig(rangeId);

        if (!config) {
            // Default to last 30 days
            config = window.AnalyticsConfig.getDateRangeConfig('last_30_days');
        }

        var now = new Date();
        var startDate, endDate;

        if (config.type === 'month') {
            var offset = config.offset || 0;
            startDate = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            endDate = new Date(now.getFullYear(), now.getMonth() - offset + 1, 0);
        } else if (config.type === 'quarter') {
            var quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        } else if (config.type === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        } else {
            // Days-based range
            endDate = new Date();
            startDate = new Date();
            startDate.setDate(startDate.getDate() - (config.days - 1));

            if (config.offset) {
                startDate.setDate(startDate.getDate() - config.offset);
                endDate.setDate(endDate.getDate() - config.offset);
            }
        }

        // Set to start/end of day
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return {
            startDate: startDate,
            endDate: endDate,
            rangeId: config.id,
            rangeName: config.name
        };
    }

    /**
     * Filter data by date range
     */
    function filterByDateRange(items, dateField, dateRange) {
        if (!items || !Array.isArray(items)) return [];

        return items.filter(function(item) {
            if (!item || !item[dateField]) return false;

            var itemDate = new Date(item[dateField]);
            return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
        });
    }

    /**
     * Get all quotes from localStorage
     */
    function getAllQuotes() {
        try {
            var history = localStorage.getItem('quote-history');
            if (!history) return [];

            var data = JSON.parse(history);
            return data.quotes || [];
        } catch (e) {
            console.error('[ANALYTICS] Failed to load quotes:', e);
            return [];
        }
    }

    /**
     * Get all invoices from localStorage
     */
    function getAllInvoices() {
        try {
            var invoices = localStorage.getItem('invoice-database');
            if (!invoices) return [];

            var data = JSON.parse(invoices);
            return data.invoices || [];
        } catch (e) {
            console.error('[ANALYTICS] Failed to load invoices:', e);
            return [];
        }
    }

    /**
     * Calculate revenue metrics
     */
    function calculateRevenueMetrics(dateRange) {
        var quotes = getAllQuotes();
        var invoices = getAllInvoices();

        // Filter by date range
        quotes = filterByDateRange(quotes, 'timestamp', dateRange);
        invoices = filterByDateRange(invoices, 'dateIssued', dateRange);

        var metrics = {
            totalRevenue: 0,
            paidRevenue: 0,
            outstandingRevenue: 0,
            averageQuoteValue: 0,
            averageInvoiceValue: 0,
            totalQuoteValue: 0,
            invoiceCount: 0
        };

        // Calculate from quotes
        for (var i = 0; i < quotes.length; i++) {
            var quoteTotal = quotes[i].totalIncGst || 0;
            metrics.totalQuoteValue += quoteTotal;
        }

        if (quotes.length > 0) {
            metrics.averageQuoteValue = metrics.totalQuoteValue / quotes.length;
        }

        // Calculate from invoices
        for (var i = 0; i < invoices.length; i++) {
            var invoice = invoices[i];

            if (invoice.status !== 'draft' && invoice.status !== 'cancelled') {
                metrics.totalRevenue += invoice.totalAmount || 0;
                metrics.paidRevenue += invoice.amountPaid || 0;
                metrics.outstandingRevenue += (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
                metrics.invoiceCount++;
            }
        }

        if (metrics.invoiceCount > 0) {
            metrics.averageInvoiceValue = metrics.totalRevenue / metrics.invoiceCount;
        }

        // Collection rate
        if (metrics.totalRevenue > 0) {
            metrics.collectionRate = (metrics.paidRevenue / metrics.totalRevenue) * 100;
        } else {
            metrics.collectionRate = 0;
        }

        return metrics;
    }

    /**
     * Calculate sales metrics
     */
    function calculateSalesMetrics(dateRange) {
        var history = getAllQuotes();

        // Filter by date range
        var quotes = filterByDateRange(history, 'timestamp', dateRange);

        var metrics = {
            quotesGenerated: quotes.length,
            quotesSent: 0,
            quotesAccepted: 0,
            quotesDeclined: 0,
            conversionRate: 0,
            winRate: 0,
            averageTimeToClose: 0
        };

        var closeTimes = [];

        for (var i = 0; i < quotes.length; i++) {
            var quote = quotes[i];

            // For now, assume all quotes are "sent"
            metrics.quotesSent = quotes.length;

            // Check if converted to invoice (accepted)
            var invoices = getAllInvoices();
            var hasInvoice = false;

            for (var j = 0; j < invoices.length; j++) {
                if (invoices[j].quoteReference === quote.quoteTitle) {
                    hasInvoice = true;
                    metrics.quotesAccepted++;

                    // Calculate time to close
                    if (quote.timestamp && invoices[j].dateCreated) {
                        var quoteDate = new Date(quote.timestamp);
                        var invoiceDate = new Date(invoices[j].dateCreated);
                        var days = (invoiceDate - quoteDate) / (1000 * 60 * 60 * 24);
                        if (days >= 0) {
                            closeTimes.push(days);
                        }
                    }
                    break;
                }
            }
        }

        // Calculate rates
        if (metrics.quotesSent > 0) {
            metrics.conversionRate = (metrics.quotesAccepted / metrics.quotesSent) * 100;
        }

        var totalClosed = metrics.quotesAccepted + metrics.quotesDeclined;
        if (totalClosed > 0) {
            metrics.winRate = (metrics.quotesAccepted / totalClosed) * 100;
        } else {
            metrics.winRate = metrics.conversionRate; // If no declined quotes, win rate = conversion rate
        }

        // Calculate average time to close
        if (closeTimes.length > 0) {
            var totalTime = closeTimes.reduce(function(sum, time) { return sum + time; }, 0);
            metrics.averageTimeToClose = totalTime / closeTimes.length;
        }

        return metrics;
    }

    /**
     * Calculate operational metrics
     */
    function calculateOperationalMetrics(dateRange) {
        // Placeholder - would integrate with task management if available
        var metrics = {
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            completionRate: 0,
            averageCompletionTime: 0,
            averageResponseTime: 0
        };

        // Try to get quotes as proxy for response time
        var quotes = getAllQuotes();
        quotes = filterByDateRange(quotes, 'timestamp', dateRange);

        metrics.totalTasks = quotes.length;
        metrics.completedTasks = quotes.length; // Assume all quotes are completed
        metrics.completionRate = 100;
        metrics.averageResponseTime = 2; // Placeholder

        return metrics;
    }

    /**
     * Calculate customer metrics
     */
    function calculateCustomerMetrics(dateRange) {
        var quotes = getAllQuotes();

        // Filter quotes by date range
        quotes = filterByDateRange(quotes, 'timestamp', dateRange);

        var metrics = {
            totalCustomers: 0,
            newCustomers: 0,
            repeatCustomers: 0,
            repeatCustomerRate: 0,
            averageCustomerValue: 0,
            customerLifetimeValue: 0
        };

        var customerMap = {};
        var customerValues = {};

        // Count quotes per customer
        for (var i = 0; i < quotes.length; i++) {
            var quote = quotes[i];
            var clientName = quote.clientName || 'Unknown';

            if (!customerMap[clientName]) {
                customerMap[clientName] = 0;
                customerValues[clientName] = 0;
            }

            customerMap[clientName]++;
            customerValues[clientName] += quote.totalIncGst || 0;
        }

        // Calculate metrics
        var totalValue = 0;
        var customerCount = 0;

        Object.keys(customerMap).forEach(function(clientName) {
            customerCount++;

            if (customerMap[clientName] === 1) {
                metrics.newCustomers++;
            } else {
                metrics.repeatCustomers++;
            }

            totalValue += customerValues[clientName];
        });

        metrics.totalCustomers = customerCount;

        if (customerCount > 0) {
            metrics.repeatCustomerRate = (metrics.repeatCustomers / customerCount) * 100;
            metrics.averageCustomerValue = totalValue / customerCount;
        }

        return metrics;
    }

    /**
     * Calculate service breakdown
     */
    function calculateServiceBreakdown(dateRange) {
        var quotes = getAllQuotes();

        // Filter by date range
        quotes = filterByDateRange(quotes, 'timestamp', dateRange);

        var breakdown = {
            byService: {
                'Window Cleaning': { count: 0, value: 0, accepted: 0 },
                'Pressure Cleaning': { count: 0, value: 0, accepted: 0 },
                'Combined Service': { count: 0, value: 0, accepted: 0 }
            },
            byClientType: {},
            bySource: {}
        };

        for (var i = 0; i < quotes.length; i++) {
            var quote = quotes[i];

            // Determine service type
            var hasWindows = quote.windowLines && quote.windowLines.length > 0;
            var hasPressure = quote.pressureLines && quote.pressureLines.length > 0;

            var service = 'Combined Service';
            if (hasWindows && !hasPressure) {
                service = 'Window Cleaning';
            } else if (hasPressure && !hasWindows) {
                service = 'Pressure Cleaning';
            }

            breakdown.byService[service].count++;
            breakdown.byService[service].value += quote.totalIncGst || 0;

            // Check if converted to invoice
            var invoices = getAllInvoices();
            for (var j = 0; j < invoices.length; j++) {
                if (invoices[j].quoteReference === quote.quoteTitle) {
                    breakdown.byService[service].accepted++;
                    break;
                }
            }
        }

        return breakdown;
    }

    /**
     * Calculate conversion funnel
     */
    function calculateConversionFunnel(dateRange) {
        var quotes = getAllQuotes();
        var invoices = getAllInvoices();

        // Filter by date range
        quotes = filterByDateRange(quotes, 'timestamp', dateRange);

        var funnel = {
            stages: [
                { name: 'Quotes Created', count: 0, percentage: 100 },
                { name: 'Quotes Sent', count: 0, percentage: 0 },
                { name: 'Quotes Accepted', count: 0, percentage: 0 },
                { name: 'Invoices Created', count: 0, percentage: 0 },
                { name: 'Invoices Paid', count: 0, percentage: 0 }
            ],
            dropoff: {}
        };

        funnel.stages[0].count = quotes.length;
        funnel.stages[1].count = quotes.length; // Assume all sent

        // Check for invoices
        var paidCount = 0;
        var invoiceCount = 0;

        for (var i = 0; i < quotes.length; i++) {
            var quote = quotes[i];

            for (var j = 0; j < invoices.length; j++) {
                if (invoices[j].quoteReference === quote.quoteTitle) {
                    funnel.stages[2].count++; // Accepted
                    funnel.stages[3].count++; // Invoice created
                    invoiceCount++;

                    if (invoices[j].status === 'paid') {
                        paidCount++;
                    }
                    break;
                }
            }
        }

        funnel.stages[4].count = paidCount;

        // Calculate percentages
        var baseCount = funnel.stages[0].count;
        if (baseCount > 0) {
            for (var i = 1; i < funnel.stages.length; i++) {
                funnel.stages[i].percentage = (funnel.stages[i].count / baseCount) * 100;
            }
        }

        // Calculate drop-off rates
        for (var i = 1; i < funnel.stages.length; i++) {
            var previousCount = funnel.stages[i - 1].count;
            var currentCount = funnel.stages[i].count;
            var dropoffCount = previousCount - currentCount;
            var dropoffRate = previousCount > 0 ? (dropoffCount / previousCount) * 100 : 0;

            funnel.dropoff[funnel.stages[i].name] = {
                count: dropoffCount,
                rate: dropoffRate
            };
        }

        return funnel;
    }

    /**
     * Get revenue trend data
     */
    function getRevenueTrend(dateRange, groupBy) {
        groupBy = groupBy || 'day'; // day, week, month

        var invoices = getAllInvoices();

        // Filter by date range
        invoices = filterByDateRange(invoices, 'dateIssued', dateRange);

        var trendData = {};

        // Group invoices by period
        for (var i = 0; i < invoices.length; i++) {
            var invoice = invoices[i];
            if (invoice.status === 'draft' || invoice.status === 'cancelled') continue;

            var date = new Date(invoice.dateIssued || invoice.dateCreated);
            var period = formatPeriod(date, groupBy);

            if (!trendData[period]) {
                trendData[period] = {
                    period: period,
                    revenue: 0,
                    paid: 0,
                    outstanding: 0,
                    invoiceCount: 0
                };
            }

            trendData[period].revenue += invoice.totalAmount || 0;
            trendData[period].paid += invoice.amountPaid || 0;
            trendData[period].outstanding += (invoice.totalAmount || 0) - (invoice.amountPaid || 0);
            trendData[period].invoiceCount++;
        }

        // Convert to array and sort
        var trendArray = Object.keys(trendData).map(function(key) {
            return trendData[key];
        });

        trendArray.sort(function(a, b) {
            return a.period.localeCompare(b.period);
        });

        return trendArray;
    }

    /**
     * Format period for grouping
     */
    function formatPeriod(date, groupBy) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1);
        if (month.length === 1) month = '0' + month;
        var day = String(date.getDate());
        if (day.length === 1) day = '0' + day;

        if (groupBy === 'month') {
            return year + '-' + month;
        } else if (groupBy === 'week') {
            var week = getWeekNumber(date);
            var weekStr = String(week);
            if (weekStr.length === 1) weekStr = '0' + weekStr;
            return year + '-W' + weekStr;
        } else {
            return year + '-' + month + '-' + day;
        }
    }

    /**
     * Get week number
     */
    function getWeekNumber(date) {
        var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        var dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    /**
     * Get comparison data
     */
    function getComparisonData(currentRange, comparisonRange) {
        var currentMetrics = {
            revenue: calculateRevenueMetrics(currentRange),
            sales: calculateSalesMetrics(currentRange),
            operations: calculateOperationalMetrics(currentRange),
            customers: calculateCustomerMetrics(currentRange)
        };

        var comparisonMetrics = {
            revenue: calculateRevenueMetrics(comparisonRange),
            sales: calculateSalesMetrics(comparisonRange),
            operations: calculateOperationalMetrics(comparisonRange),
            customers: calculateCustomerMetrics(comparisonRange)
        };

        var comparison = {
            current: currentMetrics,
            previous: comparisonMetrics,
            changes: {}
        };

        // Calculate changes
        Object.keys(currentMetrics).forEach(function(category) {
            comparison.changes[category] = {};

            Object.keys(currentMetrics[category]).forEach(function(metric) {
                var current = currentMetrics[category][metric];
                var previous = comparisonMetrics[category][metric];

                var change = 0;
                var percentChange = 0;

                if (typeof current === 'number' && typeof previous === 'number') {
                    change = current - previous;
                    if (previous !== 0) {
                        percentChange = (change / previous) * 100;
                    }
                }

                comparison.changes[category][metric] = {
                    change: change,
                    percentChange: percentChange,
                    trend: change > 0 ? 'up' : (change < 0 ? 'down' : 'flat')
                };
            });
        });

        return comparison;
    }

    /**
     * Generate comprehensive dashboard data
     */
    function generateDashboardData(dateRangeId) {
        var dateRange = getDateRange(dateRangeId);

        console.log('[ANALYTICS] Generating dashboard for:', dateRange.rangeName);

        var dashboard = {
            dateRange: dateRange,
            revenue: calculateRevenueMetrics(dateRange),
            sales: calculateSalesMetrics(dateRange),
            operations: calculateOperationalMetrics(dateRange),
            customers: calculateCustomerMetrics(dateRange),
            serviceBreakdown: calculateServiceBreakdown(dateRange),
            conversionFunnel: calculateConversionFunnel(dateRange),
            revenueTrend: getRevenueTrend(dateRange, 'day'),
            generatedAt: new Date().toISOString()
        };

        return dashboard;
    }

    // Public API
    var AnalyticsEngine = {
        getDateRange: getDateRange,
        calculateRevenueMetrics: calculateRevenueMetrics,
        calculateSalesMetrics: calculateSalesMetrics,
        calculateOperationalMetrics: calculateOperationalMetrics,
        calculateCustomerMetrics: calculateCustomerMetrics,
        calculateServiceBreakdown: calculateServiceBreakdown,
        calculateConversionFunnel: calculateConversionFunnel,
        getRevenueTrend: getRevenueTrend,
        getComparisonData: getComparisonData,
        generateDashboardData: generateDashboardData
    };

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('analyticsEngine', AnalyticsEngine);
    }

    // Expose globally
    window.AnalyticsEngine = AnalyticsEngine;

    console.log('[ANALYTICS-ENGINE] Initialized');

})();
