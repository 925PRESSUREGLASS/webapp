# Analytics & Reporting Dashboard

## Overview

The Analytics & Reporting Dashboard provides comprehensive business intelligence and data-driven insights for the TicTacStick Quote Engine. This system tracks key performance indicators (KPIs), revenue trends, conversion funnels, and customer behavior to help optimize business performance.

## Features

### 1. **Real-time KPI Tracking**

Track critical business metrics with visual progress indicators:

- **Total Revenue** - Track paid revenue against monthly targets
- **Quotes Generated** - Monitor quote volume
- **Conversion Rate** - Quote-to-sale conversion percentage
- **Average Quote Value** - Track average deal size

Each KPI card shows:
- Current value
- Target value
- Progress bar (color-coded by performance)
- Trend indicator (up/down/flat)

### 2. **Revenue Trend Analysis**

Visual line chart showing revenue over time with:
- Total revenue tracking
- Paid revenue vs outstanding
- Configurable grouping (daily, weekly, monthly)
- Date range filtering

### 3. **Conversion Funnel**

Track customer journey through sales stages:
- Quotes Created
- Quotes Sent
- Quotes Accepted
- Invoices Created
- Invoices Paid

Shows drop-off rates and percentages at each stage.

### 4. **Service Breakdown**

Doughnut chart showing revenue distribution by service type:
- Window Cleaning
- Pressure Cleaning
- Combined Services

### 5. **Detailed Metrics Tables**

Four comprehensive metric categories:

**Financial Metrics:**
- Total Revenue
- Paid Revenue
- Outstanding Revenue
- Average Quote Value
- Collection Rate

**Sales Metrics:**
- Quotes Generated
- Quotes Sent
- Quotes Accepted
- Conversion Rate
- Win Rate
- Average Time to Close

**Operations Metrics:**
- Total Tasks
- Completed Tasks
- Completion Rate
- Average Response Time

**Customer Metrics:**
- Total Customers
- New Customers
- Repeat Customers
- Repeat Rate
- Average Customer Value

### 6. **Date Range Filtering**

Flexible date range options:
- Today
- Yesterday
- Last 7 Days
- Last 30 Days
- Last 90 Days
- This Month
- Last Month
- This Year

### 7. **Export Capabilities**

Export analytics data to CSV format including:
- Revenue metrics
- Sales metrics
- Customer metrics
- Service breakdown
- Timestamped reports

## Architecture

### Files

1. **analytics-config.js** (408 lines)
   - KPI definitions and targets
   - Report configurations
   - Date range settings
   - Chart settings
   - Export configurations

2. **analytics-engine.js** (644 lines)
   - Metric calculation engine
   - Data aggregation
   - Trend analysis
   - Funnel calculations
   - Date range filtering

3. **analytics-dashboard.js** (645 lines)
   - UI controller
   - Chart rendering (Chart.js)
   - KPI card updates
   - Table population
   - Export functionality

4. **css/analytics-dashboard.css** (486 lines)
   - Professional dashboard styling
   - Responsive grid layouts
   - KPI card design
   - Chart containers
   - Dark mode support

### Dependencies

- **Chart.js** - Required for chart visualizations (already included via CDN)
- **analytics.js** - Existing quote history tracking
- **invoice.js** - Invoice data for revenue metrics
- **Storage API** - LocalStorage for data persistence

## Usage

### Initialize Dashboard

The dashboard auto-initializes when the page loads. No manual setup required.

### View Analytics

1. Navigate to the "Quote History & Analytics" section
2. Dashboard loads automatically with Last 30 Days data
3. Use date range selector to change time period
4. Explore different metric categories using tabs

### Change Date Range

```javascript
// JavaScript API
window.AnalyticsDashboard.updateDashboard('last_90_days');
```

Or use the UI dropdown selector.

### Export Report

Click "Export Report" button to download CSV file with:
- All KPI metrics
- Service breakdown
- Timestamp and period information

JavaScript API:
```javascript
window.AnalyticsDashboard.exportDashboard();
```

### Show Metrics Tab

Switch between metric categories:

```javascript
window.showAnalyticsMetricsTab('financial');  // Financial metrics
window.showAnalyticsMetricsTab('sales');      // Sales metrics
window.showAnalyticsMetricsTab('operations'); // Operations metrics
window.showAnalyticsMetricsTab('customers');  // Customer metrics
```

## Configuration

### KPI Targets

Modify targets in `analytics-config.js`:

```javascript
var ANALYTICS_CONFIG = {
    kpis: {
        revenue: {
            target: 20000  // $20,000 monthly target
        },
        quotesGenerated: {
            target: 30  // 30 quotes per month
        },
        conversionRate: {
            target: 35  // 35% conversion rate
        }
        // ... more KPIs
    }
};
```

Or update dynamically:

```javascript
window.AnalyticsConfig.updateKPITarget('revenue', 25000);
```

### Chart Colors

Customize chart colors in `analytics-config.js`:

```javascript
charts: {
    colors: {
        primary: '#2563eb',   // Blue
        success: '#10b981',   // Green
        warning: '#f59e0b',   // Orange
        danger: '#ef4444',    // Red
        neutral: '#6b7280'    // Gray
    }
}
```

### Date Ranges

Add custom date ranges:

```javascript
dateRanges: {
    available: [
        { id: 'custom_range', name: 'My Custom Range', days: 45 }
    ]
}
```

## Data Sources

### Quote History

Data comes from `quote-history` LocalStorage key:
- Quote metadata
- Timestamps
- Client information
- Line items
- Totals and GST

### Invoice Data

Data comes from `invoice-database` LocalStorage key:
- Invoice totals
- Payment records
- Status tracking
- Date issued
- Quote references

### Calculations

All metrics calculated client-side from LocalStorage data:
- No backend required
- Real-time updates
- Instant filtering
- Privacy-focused (data never leaves device)

## Performance

### Optimization

- Lazy-loaded Chart.js library
- Efficient data aggregation
- Debounced chart updates
- Progressive rendering
- Mobile-optimized

### Caching

Dashboard data cached in memory:
- Reduces recalculation overhead
- Faster date range switching
- Improved responsiveness

## Mobile Support

Fully responsive design:
- Mobile-first grid layouts
- Touch-friendly controls
- Compact tables on small screens
- Collapsible sections
- Optimized chart sizes

## Accessibility

WCAG AA compliant:
- ARIA labels on all interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast modes
- Focus indicators

## Browser Compatibility

### Supported Browsers

- ✅ Chrome 60+
- ✅ Firefox 60+
- ✅ Safari 12+ (iOS)
- ✅ Edge 79+

### Required Features

- LocalStorage API
- Canvas API (for charts)
- ES5 JavaScript support
- CSS Grid Layout

## Troubleshooting

### Charts Not Rendering

**Issue:** Charts appear blank or don't load

**Solutions:**
1. Check Chart.js CDN is loaded:
   ```javascript
   console.log(typeof Chart);  // Should be 'function'
   ```

2. Verify canvas elements exist:
   ```javascript
   document.getElementById('revenue-trend-chart')
   ```

3. Check browser console for errors

### No Data Showing

**Issue:** Dashboard shows zeros or empty state

**Causes:**
- No quotes in history
- No invoices created
- Date range excludes all data

**Solutions:**
1. Create some quotes and save to history
2. Create invoices from quotes
3. Adjust date range to include data

### Performance Issues

**Issue:** Dashboard loads slowly or freezes

**Solutions:**
1. Clear old quote history (keep last 100)
2. Export and archive historical data
3. Use shorter date ranges (30 days vs 1 year)
4. Close other browser tabs

### Export Not Working

**Issue:** CSV export fails or doesn't download

**Solutions:**
1. Check browser allows downloads
2. Disable popup blockers
3. Try different browser
4. Check console for errors

## API Reference

### AnalyticsEngine

```javascript
// Get date range object
var range = AnalyticsEngine.getDateRange('last_30_days');

// Calculate revenue metrics
var revenue = AnalyticsEngine.calculateRevenueMetrics(range);

// Calculate sales metrics
var sales = AnalyticsEngine.calculateSalesMetrics(range);

// Generate full dashboard
var dashboard = AnalyticsEngine.generateDashboardData('last_30_days');
```

### AnalyticsDashboard

```javascript
// Initialize dashboard
AnalyticsDashboard.init();

// Update with new date range
AnalyticsDashboard.updateDashboard('last_90_days');

// Switch metric tabs
AnalyticsDashboard.showMetricsTab('financial');

// Export report
AnalyticsDashboard.exportDashboard();
```

### AnalyticsConfig

```javascript
// Get KPI configuration
var kpi = AnalyticsConfig.getKPI('revenue');

// Update KPI target
AnalyticsConfig.updateKPITarget('conversionRate', 40);

// Save configuration
AnalyticsConfig.save();
```

## Future Enhancements

### Planned Features

1. **Comparison Views**
   - Period-over-period comparisons
   - Year-over-year analysis
   - Target vs actual visualizations

2. **Advanced Filters**
   - Filter by service type
   - Filter by client type
   - Filter by location/area

3. **Predictive Analytics**
   - Revenue forecasting
   - Trend projections
   - Seasonal patterns

4. **Custom Reports**
   - Report builder
   - Scheduled reports
   - Email delivery

5. **Dashboard Customization**
   - Drag-and-drop widgets
   - Custom KPI cards
   - Personalized layouts

6. **Export Enhancements**
   - PDF reports with charts
   - Excel format
   - Google Sheets integration

## Best Practices

### Data Quality

1. **Consistent Quote Entry**
   - Always fill in client name
   - Use standard job types
   - Add location information

2. **Invoice Creation**
   - Convert accepted quotes to invoices
   - Record payments promptly
   - Update invoice statuses

3. **Regular Monitoring**
   - Review dashboard weekly
   - Track KPI progress monthly
   - Export reports for records

### Performance Tips

1. **Data Maintenance**
   - Archive old quotes (>1 year)
   - Keep history under 100 items
   - Clear test/demo data

2. **Browser Optimization**
   - Use modern browsers
   - Clear cache periodically
   - Close unused tabs

3. **Dashboard Usage**
   - Use appropriate date ranges
   - Export large datasets
   - Refresh when needed

## Support

For issues or questions:

1. Check this documentation
2. Review CLAUDE.md
3. Check browser console
4. Report bugs via GitHub

## License

MIT License - 925 Pressure Glass

## Version History

- **v1.0.0** (2025-11-18)
  - Initial analytics dashboard implementation
  - KPI tracking
  - Revenue trend charts
  - Conversion funnel
  - Service breakdown
  - Detailed metrics tables
  - CSV export
  - Responsive design
  - Dark mode support

---

**Last Updated:** 2025-11-18
**Author:** Claude (Anthropic AI)
**Project:** TicTacStick Quote Engine for 925 Pressure Glass
