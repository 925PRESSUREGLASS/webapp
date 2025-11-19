// analytics.js - Quote history tracking and business analytics
// iOS Safari compatible - no ES6+ features

(function() {
  'use strict';

  var HISTORY_KEY = 'quote-history';
  var MAX_HISTORY = 100; // Keep last 100 quotes

  // Quote status types
  var QUOTE_STATUS = {
    DRAFT: 'draft',
    SENT: 'sent',
    ACCEPTED: 'accepted',
    DECLINED: 'declined',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
  };

  var QUOTE_STATUS_LABELS = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    declined: 'Declined',
    expired: 'Expired',
    cancelled: 'Cancelled'
  };

  // Helper: Determine service types from quote state
  function determineServiceTypes(state) {
    var types = [];
    if (state.windowLines && state.windowLines.length > 0) {
      types.push('window-cleaning');
    }
    if (state.pressureLines && state.pressureLines.length > 0) {
      types.push('pressure-washing');
    }
    return types;
  }

  // Helper: Determine primary service
  function determinePrimaryService(state) {
    if (!state.windowLines || state.windowLines.length === 0) {
      return 'pressure-washing';
    }
    if (!state.pressureLines || state.pressureLines.length === 0) {
      return 'window-cleaning';
    }
    // If both, determine by line count or value
    return state.windowLines.length >= state.pressureLines.length ? 'window-cleaning' : 'pressure-washing';
  }

  // Save quote to history
  function saveQuoteToHistory() {
    try {
      if (!window.APP || !window.APP.getState) {
        return false;
      }

      var state = window.APP.getState();

      // Don't save if quote has no line items
      var hasItems = (state.windowLines && state.windowLines.length > 0) ||
                     (state.pressureLines && state.pressureLines.length > 0);

      if (!hasItems) {
        return false;
      }

      var history = loadHistory();

      // Get totals from DOM
      var totalText = document.getElementById('totalIncGstDisplay');
      var total = totalText ? parseFloat(totalText.textContent.replace(/[$,]/g, '')) : 0;

      var timeText = document.getElementById('timeEstimateDisplay');
      var timeMatch = timeText ? timeText.textContent.match(/([\d.]+)\s*hrs/) : null;
      var timeHours = timeMatch ? parseFloat(timeMatch[1]) : 0;

      // Create history entry with enhanced analytics fields
      var entry = {
        id: 'quote_' + Date.now(),
        timestamp: Date.now(),
        date: new Date().toISOString(),
        quoteTitle: state.quoteTitle || 'Untitled Quote',
        clientName: state.clientName || '',
        clientLocation: state.clientLocation || '',
        jobType: state.jobType || '',
        total: total,
        timeEstimate: timeHours,
        windowLineCount: state.windowLines ? state.windowLines.length : 0,
        pressureLineCount: state.pressureLines ? state.pressureLines.length : 0,
        gst: Money.extractGST(total), // Extract GST component from total
        subtotal: Money.extractSubtotal(total),

        // Analytics tracking fields
        status: state.status || QUOTE_STATUS.DRAFT,
        statusHistory: state.statusHistory || [{
          status: QUOTE_STATUS.DRAFT,
          date: new Date().toISOString()
        }],

        // Dates
        dateCreated: state.dateCreated || new Date().toISOString(),
        dateSent: state.dateSent || null,
        dateAccepted: state.dateAccepted || null,
        dateDeclined: state.dateDeclined || null,

        // Client info
        clientType: state.clientType || 'residential', // residential, commercial
        clientSource: state.clientSource || 'other', // referral, website, social, repeat, other
        clientEmail: state.clientEmail || '',
        clientPhone: state.clientPhone || '',

        // Service info
        serviceTypes: determineServiceTypes(state),
        primaryService: determinePrimaryService(state),

        // Financial
        discountApplied: state.discountApplied || false,
        discountAmount: state.discountAmount || 0,
        discountReason: state.discountReason || '',

        // Follow-up tracking
        followUps: state.followUps || [],

        // Loss tracking
        declineReason: state.declineReason || null,
        declineNotes: state.declineNotes || '',

        // Tags
        tags: state.tags || []
      };

      // Add to beginning of array
      history.unshift(entry);

      // Limit to MAX_HISTORY
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }

      // Save
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

      if (window.ErrorHandler) {
        window.ErrorHandler.showSuccess('Quote saved to history');
      }

      return true;
    } catch (error) {
      console.error('Failed to save quote to history:', error);
      return false;
    }
  }

  // Load history
  function loadHistory() {
    try {
      return window.Security.safeJSONParse(
        localStorage.getItem(HISTORY_KEY),
        null,
        []
      );
    } catch (e) {
      console.error('Failed to load history:', e);
      return [];
    }
  }

  // Get analytics data with comprehensive metrics
  function getAnalytics(timeframe, filters) {
    var history = loadHistory();
    var now = Date.now();
    var cutoff;

    // Determine cutoff time
    switch (timeframe) {
      case 'week':
        cutoff = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoff = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoff = now - (365 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoff = 0; // all time
    }

    // Filter by timeframe
    var filtered = history.filter(function(entry) {
      if (entry.timestamp < cutoff) return false;

      // Apply additional filters if provided
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          if (filters.status.indexOf(entry.status) === -1) return false;
        }
        if (filters.clientType && entry.clientType !== filters.clientType) return false;
        if (filters.serviceType && (!entry.serviceTypes || entry.serviceTypes.indexOf(filters.serviceType) === -1)) {
          return false;
        }
      }

      return true;
    });

    if (filtered.length === 0) {
      return getEmptyAnalytics();
    }

    // Calculate comprehensive metrics
    return {
      // Basic metrics (backward compatible)
      totalQuotes: filtered.length,
      totalRevenue: calculateTotalRevenue(filtered),
      averageQuote: calculateAverageQuote(filtered),
      totalHours: calculateTotalHours(filtered),
      averageHours: calculateAverageHours(filtered),
      windowQuotes: countWindowQuotes(filtered),
      pressureQuotes: countPressureQuotes(filtered),
      mixedQuotes: countMixedQuotes(filtered),
      byJobType: calculateByJobType(filtered),
      revenueByMonth: calculateRevenueByMonth(filtered),
      topClients: calculateTopClients(filtered),

      // Enhanced metrics
      revenue: calculateRevenueMetrics(filtered),
      quotes: calculateQuoteMetrics(filtered),
      services: calculateServiceMetrics(filtered),
      clients: calculateClientMetrics(filtered),
      trends: calculateTrendMetrics(filtered),
      operations: calculateOperationalMetrics(filtered)
    };
  }

  // Return empty analytics structure
  function getEmptyAnalytics() {
    return {
      totalQuotes: 0,
      totalRevenue: 0,
      averageQuote: 0,
      totalHours: 0,
      averageHours: 0,
      windowQuotes: 0,
      pressureQuotes: 0,
      mixedQuotes: 0,
      byJobType: {},
      revenueByMonth: {},
      topClients: [],
      revenue: {
        totalQuoted: 0,
        totalWon: 0,
        totalLost: 0,
        averageQuote: 0,
        averageWon: 0,
        conversionRate: 0,
        byServiceType: {},
        byClientType: {},
        byMonth: []
      },
      quotes: {
        total: 0,
        byStatus: {},
        winRate: 0,
        averageCloseTime: 0,
        valueDistribution: {
          small: 0,
          medium: 0,
          large: 0,
          xlarge: 0
        },
        byMonth: []
      },
      services: {
        popularServices: [],
        averagePriceByService: {},
        serviceMix: {},
        upsellRate: 0,
        discountFrequency: 0,
        averageDiscount: 0
      },
      clients: {
        totalClients: 0,
        newClientsPerMonth: [],
        repeatClientRate: 0,
        clientLifetimeValue: 0,
        topClients: [],
        bySource: {}
      },
      trends: {
        revenueByMonth: [],
        quotesByMonth: [],
        averageQuoteByMonth: [],
        conversionByMonth: [],
        growthRate: 0
      },
      operations: {
        quotesPerDay: 0,
        quotesPerWeek: 0,
        quotesPerMonth: 0,
        averageLineItems: 0,
        peakQuoteDays: [],
        averageResponseTime: 0,
        followUpRate: 0,
        lostReasons: {}
      }
    };
  }

  // Basic metric calculations (backward compatible)
  function calculateTotalRevenue(quotes) {
    return quotes.reduce(function(sum, q) { return sum + (q.total || 0); }, 0);
  }

  function calculateAverageQuote(quotes) {
    return quotes.length > 0 ? calculateTotalRevenue(quotes) / quotes.length : 0;
  }

  function calculateTotalHours(quotes) {
    return quotes.reduce(function(sum, q) { return sum + (q.timeEstimate || 0); }, 0);
  }

  function calculateAverageHours(quotes) {
    return quotes.length > 0 ? calculateTotalHours(quotes) / quotes.length : 0;
  }

  function countWindowQuotes(quotes) {
    return quotes.filter(function(q) {
      return q.windowLineCount > 0 && q.pressureLineCount === 0;
    }).length;
  }

  function countPressureQuotes(quotes) {
    return quotes.filter(function(q) {
      return q.pressureLineCount > 0 && q.windowLineCount === 0;
    }).length;
  }

  function countMixedQuotes(quotes) {
    return quotes.filter(function(q) {
      return q.windowLineCount > 0 && q.pressureLineCount > 0;
    }).length;
  }

  function calculateByJobType(quotes) {
    var byJobType = {};
    quotes.forEach(function(q) {
      if (q.jobType) {
        byJobType[q.jobType] = (byJobType[q.jobType] || 0) + 1;
      }
    });
    return byJobType;
  }

  function calculateRevenueByMonth(quotes) {
    var revenueByMonth = {};
    quotes.forEach(function(q) {
      var date = new Date(q.timestamp);
      var monthKey = date.getFullYear() + '-' + padZero(date.getMonth() + 1);
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + (q.total || 0);
    });
    return revenueByMonth;
  }

  function calculateTopClients(quotes) {
    var clientRevenue = {};
    quotes.forEach(function(q) {
      if (q.clientName) {
        if (!clientRevenue[q.clientName]) {
          clientRevenue[q.clientName] = { name: q.clientName, revenue: 0, count: 0 };
        }
        clientRevenue[q.clientName].revenue += (q.total || 0);
        clientRevenue[q.clientName].count++;
      }
    });

    return Object.keys(clientRevenue).map(function(name) {
      return clientRevenue[name];
    }).sort(function(a, b) {
      return b.revenue - a.revenue;
    }).slice(0, 10);
  }

  // Calculate revenue metrics
  function calculateRevenueMetrics(quotes) {
    var totalQuoted = 0;
    var totalWon = 0;
    var totalLost = 0;
    var wonQuotes = [];
    var lostQuotes = [];
    var byServiceType = {};
    var byClientType = {};
    var byMonth = {};

    quotes.forEach(function(q) {
      var total = q.total || 0;
      totalQuoted += total;

      if (q.status === QUOTE_STATUS.ACCEPTED) {
        totalWon += total;
        wonQuotes.push(q);
      } else if (q.status === QUOTE_STATUS.DECLINED) {
        totalLost += total;
        lostQuotes.push(q);
      }

      // By service type
      var serviceType = q.primaryService || 'other';
      if (!byServiceType[serviceType]) {
        byServiceType[serviceType] = { quoted: 0, won: 0, count: 0 };
      }
      byServiceType[serviceType].quoted += total;
      byServiceType[serviceType].count++;
      if (q.status === QUOTE_STATUS.ACCEPTED) {
        byServiceType[serviceType].won += total;
      }

      // By client type
      var clientType = q.clientType || 'unknown';
      if (!byClientType[clientType]) {
        byClientType[clientType] = { quoted: 0, won: 0, count: 0 };
      }
      byClientType[clientType].quoted += total;
      byClientType[clientType].count++;
      if (q.status === QUOTE_STATUS.ACCEPTED) {
        byClientType[clientType].won += total;
      }

      // By month
      if (q.dateCreated) {
        var date = new Date(q.dateCreated);
        var monthKey = date.getFullYear() + '-' + padZero(date.getMonth() + 1);
        if (!byMonth[monthKey]) {
          byMonth[monthKey] = { quoted: 0, won: 0, count: 0 };
        }
        byMonth[monthKey].quoted += total;
        byMonth[monthKey].count++;
        if (q.status === QUOTE_STATUS.ACCEPTED) {
          byMonth[monthKey].won += total;
        }
      }
    });

    var averageQuote = quotes.length > 0 ? totalQuoted / quotes.length : 0;
    var averageWon = wonQuotes.length > 0 ? totalWon / wonQuotes.length : 0;
    var decidedQuotes = wonQuotes.length + lostQuotes.length;
    var conversionRate = decidedQuotes > 0 ? (wonQuotes.length / decidedQuotes) * 100 : 0;

    // Format byMonth as array
    var monthKeys = Object.keys(byMonth).sort();
    var byMonthArray = monthKeys.map(function(key) {
      return {
        month: key,
        quoted: byMonth[key].quoted,
        won: byMonth[key].won,
        count: byMonth[key].count
      };
    });

    return {
      totalQuoted: totalQuoted,
      totalWon: totalWon,
      totalLost: totalLost,
      averageQuote: averageQuote,
      averageWon: averageWon,
      conversionRate: conversionRate,
      byServiceType: byServiceType,
      byClientType: byClientType,
      byMonth: byMonthArray
    };
  }

  // Calculate quote metrics
  function calculateQuoteMetrics(quotes) {
    var byStatus = {};
    var closeTimes = [];
    var valueDistribution = { small: 0, medium: 0, large: 0, xlarge: 0 };
    var byMonth = {};

    quotes.forEach(function(q) {
      // Count by status
      var status = q.status || QUOTE_STATUS.DRAFT;
      byStatus[status] = (byStatus[status] || 0) + 1;

      // Calculate close time
      if (q.dateCreated && (q.dateAccepted || q.dateDeclined)) {
        var created = new Date(q.dateCreated);
        var closed = new Date(q.dateAccepted || q.dateDeclined);
        var days = Math.floor((closed - created) / (1000 * 60 * 60 * 24));
        if (days >= 0) closeTimes.push(days);
      }

      // Value distribution
      var total = q.total || 0;
      if (total < 500) {
        valueDistribution.small++;
      } else if (total < 2000) {
        valueDistribution.medium++;
      } else if (total < 5000) {
        valueDistribution.large++;
      } else {
        valueDistribution.xlarge++;
      }

      // By month
      if (q.dateCreated) {
        var date = new Date(q.dateCreated);
        var monthKey = date.getFullYear() + '-' + padZero(date.getMonth() + 1);
        byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
      }
    });

    var won = byStatus[QUOTE_STATUS.ACCEPTED] || 0;
    var lost = byStatus[QUOTE_STATUS.DECLINED] || 0;
    var decided = won + lost;
    var winRate = decided > 0 ? (won / decided) * 100 : 0;

    var averageCloseTime = 0;
    if (closeTimes.length > 0) {
      var sum = closeTimes.reduce(function(a, b) { return a + b; }, 0);
      averageCloseTime = sum / closeTimes.length;
    }

    // Format byMonth as array
    var monthKeys = Object.keys(byMonth).sort();
    var byMonthArray = monthKeys.map(function(key) {
      return { month: key, count: byMonth[key] };
    });

    return {
      total: quotes.length,
      byStatus: byStatus,
      winRate: winRate,
      averageCloseTime: averageCloseTime,
      valueDistribution: valueDistribution,
      byMonth: byMonthArray
    };
  }

  // Calculate service metrics
  function calculateServiceMetrics(quotes) {
    var serviceCounts = {};
    var serviceTotals = {};
    var multiServiceQuotes = 0;
    var quotesWithDiscount = 0;
    var totalDiscount = 0;

    quotes.forEach(function(q) {
      // Count services
      if (q.serviceTypes && q.serviceTypes.length > 0) {
        if (q.serviceTypes.length > 1) {
          multiServiceQuotes++;
        }

        for (var i = 0; i < q.serviceTypes.length; i++) {
          var service = q.serviceTypes[i];
          serviceCounts[service] = (serviceCounts[service] || 0) + 1;
          serviceTotals[service] = (serviceTotals[service] || 0) + (q.total || 0);
        }
      }

      // Track discounts
      if (q.discountApplied && q.discountAmount > 0) {
        quotesWithDiscount++;
        totalDiscount += q.discountAmount;
      }
    });

    // Popular services
    var serviceArray = Object.keys(serviceCounts).map(function(service) {
      return {
        service: service,
        count: serviceCounts[service],
        percentage: quotes.length > 0 ? (serviceCounts[service] / quotes.length) * 100 : 0
      };
    });
    serviceArray.sort(function(a, b) { return b.count - a.count; });

    // Average price by service
    var averagePriceByService = {};
    Object.keys(serviceTotals).forEach(function(service) {
      averagePriceByService[service] = serviceTotals[service] / serviceCounts[service];
    });

    var upsellRate = quotes.length > 0 ? (multiServiceQuotes / quotes.length) * 100 : 0;
    var discountFrequency = quotes.length > 0 ? (quotesWithDiscount / quotes.length) * 100 : 0;
    var averageDiscount = quotesWithDiscount > 0 ? totalDiscount / quotesWithDiscount : 0;

    return {
      popularServices: serviceArray,
      averagePriceByService: averagePriceByService,
      serviceMix: serviceCounts,
      upsellRate: upsellRate,
      discountFrequency: discountFrequency,
      averageDiscount: averageDiscount
    };
  }

  // Calculate client metrics
  function calculateClientMetrics(quotes) {
    var clientMap = {};
    var clientMonthMap = {};
    var sourceCounts = {};

    quotes.forEach(function(q) {
      var clientId = q.clientEmail || q.clientName;
      if (!clientId) return;

      // Track client
      if (!clientMap[clientId]) {
        clientMap[clientId] = {
          id: clientId,
          name: q.clientName || 'Unknown',
          quoteCount: 0,
          totalRevenue: 0,
          wonRevenue: 0,
          firstQuote: q.dateCreated
        };
      }

      clientMap[clientId].quoteCount++;
      clientMap[clientId].totalRevenue += (q.total || 0);

      if (q.status === QUOTE_STATUS.ACCEPTED) {
        clientMap[clientId].wonRevenue += (q.total || 0);
      }

      // Track by month
      if (q.dateCreated) {
        var date = new Date(q.dateCreated);
        var monthKey = date.getFullYear() + '-' + padZero(date.getMonth() + 1);

        if (!clientMonthMap[monthKey]) {
          clientMonthMap[monthKey] = [];
        }

        if (clientMonthMap[monthKey].indexOf(clientId) === -1) {
          clientMonthMap[monthKey].push(clientId);
        }
      }

      // Track by source
      var source = q.clientSource || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    // Total unique clients
    var clientArray = Object.keys(clientMap).map(function(id) {
      return clientMap[id];
    });
    var totalClients = clientArray.length;

    // Repeat client rate
    var repeatClients = clientArray.filter(function(c) {
      return c.quoteCount > 1;
    }).length;

    var repeatClientRate = totalClients > 0 ? (repeatClients / totalClients) * 100 : 0;

    // Average client lifetime value
    var clientLifetimeValue = 0;
    if (totalClients > 0) {
      var totalWonRevenue = clientArray.reduce(function(sum, c) {
        return sum + c.wonRevenue;
      }, 0);
      clientLifetimeValue = totalWonRevenue / totalClients;
    }

    // Top clients by revenue
    clientArray.sort(function(a, b) {
      return b.wonRevenue - a.wonRevenue;
    });
    var topClients = clientArray.slice(0, 10);

    // New clients per month
    var monthKeys = Object.keys(clientMonthMap).sort();
    var newClientsPerMonth = monthKeys.map(function(key) {
      return {
        month: key,
        count: clientMonthMap[key].length
      };
    });

    return {
      totalClients: totalClients,
      newClientsPerMonth: newClientsPerMonth,
      repeatClientRate: repeatClientRate,
      clientLifetimeValue: clientLifetimeValue,
      topClients: topClients,
      bySource: sourceCounts
    };
  }

  // Calculate trend metrics
  function calculateTrendMetrics(quotes) {
    var monthlyData = {};

    quotes.forEach(function(q) {
      if (!q.dateCreated) return;

      var date = new Date(q.dateCreated);
      var monthKey = date.getFullYear() + '-' + padZero(date.getMonth() + 1);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          revenue: 0,
          wonRevenue: 0,
          count: 0,
          won: 0,
          lost: 0
        };
      }

      monthlyData[monthKey].revenue += (q.total || 0);
      monthlyData[monthKey].count++;

      if (q.status === QUOTE_STATUS.ACCEPTED) {
        monthlyData[monthKey].wonRevenue += (q.total || 0);
        monthlyData[monthKey].won++;
      } else if (q.status === QUOTE_STATUS.DECLINED) {
        monthlyData[monthKey].lost++;
      }
    });

    // Format data
    var monthKeys = Object.keys(monthlyData).sort();

    var revenueByMonth = monthKeys.map(function(key) {
      return {
        month: key,
        revenue: monthlyData[key].revenue,
        wonRevenue: monthlyData[key].wonRevenue
      };
    });

    var quotesByMonth = monthKeys.map(function(key) {
      return {
        month: key,
        count: monthlyData[key].count
      };
    });

    var averageQuoteByMonth = monthKeys.map(function(key) {
      var data = monthlyData[key];
      return {
        month: key,
        average: data.count > 0 ? data.revenue / data.count : 0
      };
    });

    var conversionByMonth = monthKeys.map(function(key) {
      var data = monthlyData[key];
      var decided = data.won + data.lost;
      return {
        month: key,
        rate: decided > 0 ? (data.won / decided) * 100 : 0
      };
    });

    // Calculate growth rate (last month vs previous month)
    var growthRate = 0;
    if (monthKeys.length >= 2) {
      var lastMonth = monthlyData[monthKeys[monthKeys.length - 1]];
      var prevMonth = monthlyData[monthKeys[monthKeys.length - 2]];

      if (prevMonth.wonRevenue > 0) {
        growthRate = ((lastMonth.wonRevenue - prevMonth.wonRevenue) / prevMonth.wonRevenue) * 100;
      }
    }

    return {
      revenueByMonth: revenueByMonth,
      quotesByMonth: quotesByMonth,
      averageQuoteByMonth: averageQuoteByMonth,
      conversionByMonth: conversionByMonth,
      growthRate: growthRate
    };
  }

  // Calculate operational metrics
  function calculateOperationalMetrics(quotes) {
    var lineItemCounts = [];
    var responseTimes = [];
    var dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    var quotesWithFollowUp = 0;
    var lostReasons = {};

    quotes.forEach(function(q) {
      // Line items per quote
      var lineItemCount = (q.windowLineCount || 0) + (q.pressureLineCount || 0);
      if (lineItemCount > 0) {
        lineItemCounts.push(lineItemCount);
      }

      // Response time (created to sent)
      if (q.dateCreated && q.dateSent) {
        var created = new Date(q.dateCreated);
        var sent = new Date(q.dateSent);
        var hours = (sent - created) / (1000 * 60 * 60);
        if (hours >= 0) responseTimes.push(hours);
      }

      // Day of week
      if (q.dateCreated) {
        var date = new Date(q.dateCreated);
        dayOfWeekCounts[date.getDay()]++;
      }

      // Follow-up tracking
      if (q.followUps && q.followUps.length > 0) {
        quotesWithFollowUp++;
      }

      // Lost reasons
      if (q.status === QUOTE_STATUS.DECLINED && q.declineReason) {
        lostReasons[q.declineReason] = (lostReasons[q.declineReason] || 0) + 1;
      }
    });

    // Calculate averages
    var quotesPerDay = 0;
    var quotesPerWeek = 0;
    var quotesPerMonth = 0;

    if (quotes.length > 0) {
      // Find date range
      var firstDate = quotes.reduce(function(min, q) {
        if (!q.dateCreated) return min;
        var d = new Date(q.dateCreated);
        return d < min ? d : min;
      }, new Date());

      var lastDate = quotes.reduce(function(max, q) {
        if (!q.dateCreated) return max;
        var d = new Date(q.dateCreated);
        return d > max ? d : max;
      }, new Date(0));

      var daySpan = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));

      quotesPerDay = quotes.length / daySpan;
      quotesPerWeek = (quotes.length / daySpan) * 7;
      quotesPerMonth = (quotes.length / daySpan) * 30;
    }

    // Average line items
    var averageLineItems = 0;
    if (lineItemCounts.length > 0) {
      var sum = lineItemCounts.reduce(function(a, b) { return a + b; }, 0);
      averageLineItems = sum / lineItemCounts.length;
    }

    // Peak quote days
    var daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var peakDays = dayOfWeekCounts.map(function(count, index) {
      return { day: daysOfWeek[index], count: count };
    });
    peakDays.sort(function(a, b) { return b.count - a.count; });

    // Average response time
    var averageResponseTime = 0;
    if (responseTimes.length > 0) {
      var sum = responseTimes.reduce(function(a, b) { return a + b; }, 0);
      averageResponseTime = sum / responseTimes.length;
    }

    // Follow-up rate
    var followUpRate = quotes.length > 0 ? (quotesWithFollowUp / quotes.length) * 100 : 0;

    return {
      quotesPerDay: quotesPerDay,
      quotesPerWeek: quotesPerWeek,
      quotesPerMonth: quotesPerMonth,
      averageLineItems: averageLineItems,
      peakQuoteDays: peakDays,
      averageResponseTime: averageResponseTime,
      followUpRate: followUpRate,
      lostReasons: lostReasons
    };
  }

  // Format currency
  function formatCurrency(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Pad zero
  function padZero(num) {
    return num < 10 ? '0' + num : num;
  }

  // Render analytics dashboard
  function renderAnalyticsDashboard(timeframe) {
    var container = document.getElementById('analyticsContainer');
    if (!container) return;

    // Show loading state
    if (window.LoadingState) {
      window.LoadingState.showElement('analyticsContainer', 'Loading analytics...');
    }

    // Small delay to allow loading UI to render
    setTimeout(function() {
      var analytics = getAnalytics(timeframe || 'all');
      renderAnalyticsContent(container, analytics);
    }, 10);
  }

  // Render analytics content
  function renderAnalyticsContent(container, analytics) {

    var html = '<div class="analytics-dashboard">';

    // Summary cards
    html += '<div class="analytics-summary">';
    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Total Quotes</div>';
    html += '<div class="analytics-card-value">' + analytics.totalQuotes + '</div>';
    html += '</div>';

    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Total Revenue</div>';
    html += '<div class="analytics-card-value">' + formatCurrency(analytics.totalRevenue) + '</div>';
    html += '</div>';

    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Average Quote</div>';
    html += '<div class="analytics-card-value">' + formatCurrency(analytics.averageQuote) + '</div>';
    html += '</div>';

    html += '<div class="analytics-card">';
    html += '<div class="analytics-card-label">Total Hours</div>';
    html += '<div class="analytics-card-value">' + analytics.totalHours.toFixed(1) + ' hrs</div>';
    html += '</div>';
    html += '</div>';

    // Revenue trend chart
    if (Object.keys(analytics.revenueByMonth).length > 0) {
      html += '<div class="analytics-chart">';
      html += '<h3>Revenue Trend</h3>';
      html += '<canvas id="revenueTrendChart" style="max-height: 250px;"></canvas>';
      html += '</div>';
    }

    // Quote type chart
    if (analytics.totalQuotes > 0) {
      html += '<div class="analytics-chart-row">';
      html += '<div class="analytics-chart analytics-chart-half">';
      html += '<h3>Quote Types</h3>';
      html += '<canvas id="quoteTypeChart" style="max-height: 220px;"></canvas>';
      html += '</div>';

      // Top clients chart
      if (analytics.topClients.length > 0) {
        html += '<div class="analytics-chart analytics-chart-half">';
        html += '<h3>Top 5 Clients</h3>';
        html += '<canvas id="topClientsChart" style="max-height: 220px;"></canvas>';
        html += '</div>';
      }

      html += '</div>';
    }

    // Quote breakdown
    html += '<div class="analytics-breakdown">';
    html += '<h3>Quote Breakdown</h3>';
    html += '<ul>';
    html += '<li><span>Windows Only:</span> <strong>' + analytics.windowQuotes + '</strong></li>';
    html += '<li><span>Pressure Only:</span> <strong>' + analytics.pressureQuotes + '</strong></li>';
    html += '<li><span>Combined:</span> <strong>' + analytics.mixedQuotes + '</strong></li>';
    html += '</ul>';
    html += '</div>';

    // Top clients
    if (analytics.topClients.length > 0) {
      html += '<div class="analytics-clients">';
      html += '<h3>Top Clients</h3>';
      html += '<ul>';
      analytics.topClients.forEach(function(client) {
        html += '<li><span>' + window.Security.escapeHTML(client.name) + '</span> <strong>' + formatCurrency(client.revenue) + '</strong></li>';
      });
      html += '</ul>';
      html += '</div>';
    }

    html += '</div>';

    container.innerHTML = html;

    // Render charts
    if (window.AnalyticsCharts) {
      setTimeout(function() {
        window.AnalyticsCharts.renderAll(analytics);
      }, 50);
    }

    // Hide loading state
    if (window.LoadingState) {
      window.LoadingState.hideElement('analyticsContainer');
    }
  }

  // Clear history (with confirmation)
  function clearHistory() {
    if (confirm('This will delete all quote history. This cannot be undone. Continue?')) {
      try {
        localStorage.removeItem(HISTORY_KEY);
        if (window.ErrorHandler) {
          window.ErrorHandler.showSuccess('History cleared');
        }
        renderAnalyticsDashboard();
        return true;
      } catch (e) {
        if (window.ErrorHandler) {
          window.ErrorHandler.showError('Failed to clear history');
        }
        return false;
      }
    }
    return false;
  }

  // Export history to CSV
  function exportHistory() {
    var history = loadHistory();
    if (history.length === 0) {
      if (window.ErrorHandler) {
        window.ErrorHandler.showWarning('No history to export');
      }
      return;
    }

    var csv = 'Date,Quote Title,Client Name,Location,Job Type,Total,GST,Subtotal,Hours,Window Lines,Pressure Lines\n';

    history.forEach(function(entry) {
      var date = new Date(entry.timestamp).toLocaleDateString();
      var row = [
        date,
        csvEscape(entry.quoteTitle),
        csvEscape(entry.clientName),
        csvEscape(entry.clientLocation),
        csvEscape(entry.jobType),
        entry.total.toFixed(2),
        entry.gst.toFixed(2),
        entry.subtotal.toFixed(2),
        entry.timeEstimate.toFixed(2),
        entry.windowLineCount,
        entry.pressureLineCount
      ];
      csv += row.join(',') + '\n';
    });

    // Download
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'quote-history_' + Date.now() + '.csv';
    link.click();

    if (window.ErrorHandler) {
      window.ErrorHandler.showSuccess('History exported');
    }
  }

  function csvEscape(value) {
    if (!value) return '';
    var str = String(value);
    if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  // Initialize
  function init() {
    // Add Save to History button to export section
    var notesFooter = document.querySelector('.notes-footer');
    if (notesFooter) {
      var historyBtn = document.createElement('button');
      historyBtn.id = 'saveToHistoryBtn';
      historyBtn.type = 'button';
      historyBtn.className = 'btn btn-secondary';
      historyBtn.textContent = 'Save to History';
      historyBtn.onclick = saveQuoteToHistory;
      notesFooter.appendChild(historyBtn);
    }

    DEBUG.log('[ANALYTICS] Analytics initialized');
  }

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export public API
  window.QuoteAnalytics = {
    save: saveQuoteToHistory,
    getHistory: loadHistory,
    getAnalytics: getAnalytics,
    renderDashboard: renderAnalyticsDashboard,
    exportHistory: exportHistory,
    clearHistory: clearHistory,
    // Export constants
    QUOTE_STATUS: QUOTE_STATUS,
    QUOTE_STATUS_LABELS: QUOTE_STATUS_LABELS
  };

})();
