/**
 * Analytics Configuration
 * Defines metrics, KPIs, and reporting settings for TicTacStick
 *
 * Dependencies: None (configuration only)
 * iOS Safari 12+ compatible (ES5 syntax)
 */

(function() {
    'use strict';

    /**
     * Analytics Configuration
     * Defines metrics, KPIs, and reporting settings
     */
    var ANALYTICS_CONFIG = {
        // Key Performance Indicators
        kpis: {
            // Financial KPIs
            revenue: {
                id: 'revenue',
                name: 'Total Revenue',
                category: 'financial',
                format: 'currency',
                target: 20000, // Monthly target
                enabled: true
            },

            averageQuoteValue: {
                id: 'avg_quote_value',
                name: 'Average Quote Value',
                category: 'financial',
                format: 'currency',
                target: 850,
                enabled: true
            },

            collectionRate: {
                id: 'collection_rate',
                name: 'Payment Collection Rate',
                category: 'financial',
                format: 'percentage',
                target: 95,
                enabled: true
            },

            // Sales KPIs
            quotesGenerated: {
                id: 'quotes_generated',
                name: 'Quotes Generated',
                category: 'sales',
                format: 'number',
                target: 30,
                enabled: true
            },

            conversionRate: {
                id: 'conversion_rate',
                name: 'Quote-to-Sale Conversion',
                category: 'sales',
                format: 'percentage',
                target: 35,
                enabled: true
            },

            winRate: {
                id: 'win_rate',
                name: 'Win Rate',
                category: 'sales',
                format: 'percentage',
                target: 40,
                enabled: true
            },

            // Operational KPIs
            averageResponseTime: {
                id: 'avg_response_time',
                name: 'Average Response Time',
                category: 'operations',
                format: 'hours',
                target: 4,
                enabled: true
            },

            followUpCompletion: {
                id: 'followup_completion',
                name: 'Follow-up Task Completion',
                category: 'operations',
                format: 'percentage',
                target: 90,
                enabled: true
            },

            // Customer KPIs
            customerSatisfaction: {
                id: 'csat',
                name: 'Customer Satisfaction',
                category: 'customer',
                format: 'percentage',
                target: 95,
                enabled: false // Requires review integration
            },

            repeatCustomerRate: {
                id: 'repeat_rate',
                name: 'Repeat Customer Rate',
                category: 'customer',
                format: 'percentage',
                target: 25,
                enabled: true
            }
        },

        // Report types
        reports: {
            salesSummary: {
                id: 'sales_summary',
                name: 'Sales Summary Report',
                enabled: true,
                schedule: 'weekly'
            },

            financialReport: {
                id: 'financial',
                name: 'Financial Report',
                enabled: true,
                schedule: 'monthly'
            },

            conversionFunnel: {
                id: 'conversion_funnel',
                name: 'Conversion Funnel Analysis',
                enabled: true,
                schedule: 'monthly'
            },

            serviceBreakdown: {
                id: 'service_breakdown',
                name: 'Service Performance Breakdown',
                enabled: true,
                schedule: 'monthly'
            },

            customerAnalysis: {
                id: 'customer_analysis',
                name: 'Customer Analysis',
                enabled: true,
                schedule: 'quarterly'
            }
        },

        // Date ranges for analysis
        dateRanges: {
            default: 'last_30_days',
            available: [
                { id: 'today', name: 'Today', days: 1 },
                { id: 'yesterday', name: 'Yesterday', days: 1, offset: 1 },
                { id: 'last_7_days', name: 'Last 7 Days', days: 7 },
                { id: 'last_30_days', name: 'Last 30 Days', days: 30 },
                { id: 'last_90_days', name: 'Last 90 Days', days: 90 },
                { id: 'this_month', name: 'This Month', type: 'month' },
                { id: 'last_month', name: 'Last Month', type: 'month', offset: 1 },
                { id: 'this_quarter', name: 'This Quarter', type: 'quarter' },
                { id: 'this_year', name: 'This Year', type: 'year' },
                { id: 'custom', name: 'Custom Range', type: 'custom' }
            ]
        },

        // Chart settings
        charts: {
            defaultType: 'line',
            colors: {
                primary: '#2563eb',
                success: '#10b981',
                warning: '#f59e0b',
                danger: '#ef4444',
                neutral: '#6b7280'
            },

            animation: {
                enabled: true,
                duration: 400
            }
        },

        // Export settings
        export: {
            formats: ['csv', 'pdf'],
            includeCharts: true,
            dateFormat: 'YYYY-MM-DD'
        }
    };

    /**
     * Save analytics config to localStorage
     */
    function saveAnalyticsConfig() {
        try {
            localStorage.setItem('tts_analytics_config', JSON.stringify(ANALYTICS_CONFIG));
            console.log('[ANALYTICS-CONFIG] Configuration saved');
        } catch (e) {
            console.error('[ANALYTICS-CONFIG] Failed to save config:', e);
        }
    }

    /**
     * Load analytics config from localStorage
     */
    function loadAnalyticsConfig() {
        try {
            var saved = localStorage.getItem('tts_analytics_config');
            if (saved) {
                var config = JSON.parse(saved);

                // Merge with defaults
                Object.keys(config).forEach(function(key) {
                    if (typeof config[key] === 'object' && !Array.isArray(config[key])) {
                        ANALYTICS_CONFIG[key] = Object.assign({}, ANALYTICS_CONFIG[key], config[key]);
                    } else {
                        ANALYTICS_CONFIG[key] = config[key];
                    }
                });

                console.log('[ANALYTICS-CONFIG] Configuration loaded');
            }
        } catch (e) {
            console.error('[ANALYTICS-CONFIG] Failed to load config:', e);
        }
    }

    /**
     * Get KPI configuration
     */
    function getKPI(kpiId) {
        return ANALYTICS_CONFIG.kpis[kpiId] || null;
    }

    /**
     * Update KPI target
     */
    function updateKPITarget(kpiId, newTarget) {
        if (ANALYTICS_CONFIG.kpis[kpiId]) {
            ANALYTICS_CONFIG.kpis[kpiId].target = newTarget;
            saveAnalyticsConfig();
            console.log('[ANALYTICS-CONFIG] Updated KPI target:', kpiId, newTarget);
        }
    }

    /**
     * Get date range configuration
     */
    function getDateRangeConfig(rangeId) {
        for (var i = 0; i < ANALYTICS_CONFIG.dateRanges.available.length; i++) {
            if (ANALYTICS_CONFIG.dateRanges.available[i].id === rangeId) {
                return ANALYTICS_CONFIG.dateRanges.available[i];
            }
        }
        return null;
    }

    // Expose global API
    window.AnalyticsConfig = {
        config: ANALYTICS_CONFIG,
        save: saveAnalyticsConfig,
        load: loadAnalyticsConfig,
        getKPI: getKPI,
        updateKPITarget: updateKPITarget,
        getDateRangeConfig: getDateRangeConfig
    };

    // Auto-load on initialization
    loadAnalyticsConfig();

    console.log('[ANALYTICS-CONFIG] Initialized');

})();
