// pricing-intelligence.js - Pricing Learning & Suggestions System
// Dependencies: job-manager.js
// iOS Safari 12+ compatible (ES5 only - no arrow functions, template literals, or let/const)

(function() {
    'use strict';

    /**
     * Analyze pricing accuracy from completed jobs
     */
    function analyzePricingAccuracy() {
        var jobs = window.JobManager.getAllJobs();
        var completedJobs = [];

        for (var i = 0; i < jobs.length; i++) {
            if (jobs[i].status === 'completed' && jobs[i].learningMetrics) {
                completedJobs.push(jobs[i]);
            }
        }

        if (completedJobs.length === 0) {
            return {
                message: 'No completed jobs yet to analyze',
                accuracy: null,
                jobsAnalyzed: 0
            };
        }

        var totalPriceVariance = 0;
        var totalTimeVariance = 0;
        var underquotes = 0;
        var overquotes = 0;

        for (var i = 0; i < completedJobs.length; i++) {
            var job = completedJobs[i];
            var metrics = job.learningMetrics.estimateAccuracy;

            if (metrics.priceVariance !== undefined) {
                totalPriceVariance += Math.abs(metrics.priceVariance);

                if (metrics.priceVariance > 0) {
                    underquotes++;
                } else if (metrics.priceVariance < 0) {
                    overquotes++;
                }
            }

            if (metrics.timeVariance !== undefined) {
                totalTimeVariance += Math.abs(metrics.timeVariance);
            }
        }

        var avgPriceVariance = totalPriceVariance / completedJobs.length;
        var avgTimeVariance = totalTimeVariance / completedJobs.length;

        var accuracy = 100 - avgPriceVariance;
        if (accuracy < 0) accuracy = 0;

        return {
            jobsAnalyzed: completedJobs.length,
            accuracy: Math.round(accuracy),
            avgPriceVariance: Math.round(avgPriceVariance * 10) / 10,
            avgTimeVariance: Math.round(avgTimeVariance),
            underquotes: underquotes,
            overquotes: overquotes,
            trend: underquotes > overquotes ? 'underpricing' :
                   overquotes > underquotes ? 'overpricing' : 'balanced'
        };
    }

    /**
     * Get pricing suggestions for new quote
     */
    function getSuggestionsForQuote(quoteData) {
        var metrics = window.JobManager.loadJobMetrics();
        var suggestions = [];

        // Service type specific suggestions
        if (quoteData.serviceType === 'windows') {
            if (metrics.avgTimePerWindow && metrics.byServiceType && metrics.byServiceType.windows) {
                var suggestedTime = quoteData.quantity * metrics.avgTimePerWindow;
                var currentTime = quoteData.estimatedTime || 0;

                if (Math.abs(suggestedTime - currentTime) > 15) {
                    suggestions.push({
                        type: 'time-estimate',
                        field: 'duration',
                        current: currentTime,
                        suggested: suggestedTime,
                        reason: 'Based on ' + metrics.byServiceType.windows.count + ' completed window jobs',
                        confidence: metrics.byServiceType.windows.count >= 10 ? 'high' : 'medium'
                    });
                }
            }
        }

        // Difficulty multiplier suggestions
        if (quoteData.difficulty && metrics.difficultyMultipliers) {
            var multiplier = metrics.difficultyMultipliers[quoteData.difficulty];
            if (multiplier) {
                var basePrice = quoteData.basePrice || quoteData.price || 0;
                var suggestedPrice = basePrice * multiplier;

                if (Math.abs(suggestedPrice - quoteData.price) > 10) {
                    suggestions.push({
                        type: 'difficulty-adjustment',
                        field: 'price',
                        current: quoteData.price,
                        suggested: suggestedPrice,
                        reason: 'Difficulty "' + quoteData.difficulty + '" typically requires ' +
                               Math.round((multiplier - 1) * 100) + '% adjustment',
                        confidence: 'high'
                    });
                }
            }
        }

        // Buffer suggestions
        var analysis = analyzePricingAccuracy();
        if (analysis.trend === 'underpricing' && analysis.underquotes >= 3) {
            var bufferAmount = quoteData.total * 0.1; // 10% buffer

            suggestions.push({
                type: 'risk-buffer',
                field: 'total',
                current: quoteData.total,
                suggested: quoteData.total + bufferAmount,
                reason: 'You\'ve underquoted on ' + analysis.underquotes + ' recent jobs. ' +
                       'Consider adding 10% buffer for unknowns',
                confidence: 'medium'
            });
        }

        return suggestions;
    }

    /**
     * Format value for display
     */
    function formatValue(value, type) {
        if (type.indexOf('time') > -1) {
            return Math.round(value) + ' min';
        } else if (type.indexOf('price') > -1 || type.indexOf('total') > -1) {
            return '$' + value.toFixed(2);
        }
        return value;
    }

    /**
     * Generate pricing insights report
     */
    function generateInsightsReport() {
        var analysis = analyzePricingAccuracy();
        var metrics = window.JobManager.loadJobMetrics();
        var jobs = window.JobManager.getAllJobs();

        var completedJobs = [];
        for (var i = 0; i < jobs.length; i++) {
            if (jobs[i].status === 'completed') {
                completedJobs.push(jobs[i]);
            }
        }

        var report = {
            summary: {
                totalJobs: completedJobs.length,
                pricingAccuracy: analysis.accuracy,
                trend: analysis.trend
            },

            performance: {
                avgTimePerWindow: metrics.avgTimePerWindow || 0,
                avgTimePerSqm: metrics.avgTimePerSqm || 0,
                avgJobDuration: metrics.avgJobDuration || 0,
                avgJobValue: metrics.avgJobValue || 0
            },

            issues: extractCommonIssues(completedJobs),

            recommendations: generateRecommendations(analysis, metrics, completedJobs)
        };

        return report;
    }

    /**
     * Extract common issues from jobs
     */
    function extractCommonIssues(jobs) {
        var issueTypes = {};

        for (var i = 0; i < jobs.length; i++) {
            var job = jobs[i];
            if (job.issues) {
                for (var j = 0; j < job.issues.length; j++) {
                    var type = job.issues[j].type;
                    issueTypes[type] = (issueTypes[type] || 0) + 1;
                }
            }
        }

        // Convert to sorted array
        var issues = [];
        for (var type in issueTypes) {
            if (issueTypes.hasOwnProperty(type)) {
                issues.push({
                    type: type,
                    count: issueTypes[type],
                    percentage: jobs.length > 0 ? Math.round((issueTypes[type] / jobs.length) * 100) : 0
                });
            }
        }

        issues.sort(function(a, b) { return b.count - a.count; });

        return issues;
    }

    /**
     * Generate recommendations
     */
    function generateRecommendations(analysis, metrics, jobs) {
        var recommendations = [];

        // Pricing recommendations
        if (analysis.trend === 'underpricing' && analysis.underquotes >= 3) {
            recommendations.push({
                category: 'pricing',
                priority: 'high',
                message: 'You\'re underquoting ' + analysis.underquotes + ' out of ' +
                        analysis.jobsAnalyzed + ' jobs. Consider increasing base rates by 10-15%.',
                action: 'Increase base rates'
            });
        }

        // Time estimation recommendations
        if (analysis.avgTimeVariance > 30) {
            recommendations.push({
                category: 'time-estimation',
                priority: 'medium',
                message: 'Time estimates are off by ' + analysis.avgTimeVariance + '% on average. ' +
                        'Use historical data for better estimates.',
                action: 'Apply time multipliers from completed jobs'
            });
        }

        // Buffer recommendations
        if (analysis.underquotes >= 3) {
            recommendations.push({
                category: 'risk-management',
                priority: 'medium',
                message: 'Add 10% contingency buffer for unexpected issues.',
                action: 'Include scope buffer in quotes'
            });
        }

        return recommendations;
    }

    // Register module
    if (window.APP && window.APP.registerModule) {
        window.APP.registerModule('pricingIntelligence', {
            analyzePricingAccuracy: analyzePricingAccuracy,
            getSuggestionsForQuote: getSuggestionsForQuote,
            generateInsightsReport: generateInsightsReport
        });
    }

    // Global API
    window.PricingIntelligence = {
        analyzePricingAccuracy: analyzePricingAccuracy,
        getSuggestionsForQuote: getSuggestionsForQuote,
        formatValue: formatValue,
        generateInsightsReport: generateInsightsReport
    };

    console.log('[PRICING-INTELLIGENCE] Module initialized');
})();
