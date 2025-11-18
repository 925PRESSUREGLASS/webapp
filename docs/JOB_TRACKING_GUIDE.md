# Job Tracking & Pricing Intelligence System

**Version:** 1.13.0
**Status:** Production Ready
**Last Updated:** 2025-11-18

---

## Overview

The Job Tracking & Pricing Intelligence System transforms your quotes into real-world learning opportunities. Track actual time, difficulty, and costs during jobs, then use that data to continuously improve your pricing accuracy.

### The Problem

**Before Job Tracking:**
- Quote: $770 for 20 windows, estimated 2 hours
- Reality: Takes 3.5 hours, encounters access issues, client requests extra work
- Result: Underquoted by 28%, lost $220 in labor

**With Job Tracking:**
- System records actual time (3.5 hours vs 2 hours estimated)
- Logs issues (difficult access, extra dirty windows)
- Captures additional work ($200 screen cleaning)
- Learns for next time: "Similar jobs take 1.5x longer, add access buffer"

---

## Key Features

### 1. Real-Time Job Tracking
- ⏱️ **Timer** - Track exact time from start to finish
- 📷 **Photo Documentation** - Before/after photos prove value
- ⚠️ **Issue Logging** - Record problems as they happen
- 📝 **Notes** - Capture client preferences and observations
- 💰 **Scope Changes** - Track additional work with client approval

### 2. Before/After Photo Comparison
- 📸 Side-by-side comparisons for invoices
- 📍 Location tagging for each photo
- 💬 Notes and timestamps
- 🖼️ Full-screen viewer

### 3. Pricing Intelligence
- 📊 **Accuracy Analysis** - See how accurate your quotes are
- 💡 **Smart Suggestions** - Get better estimates based on history
- 📈 **Performance Metrics** - Average time per window/sqm
- 🎯 **Recommendations** - Actionable insights to improve pricing

### 4. Automatic Learning
- 🧠 Learns from every completed job
- 📉 Tracks time and price variances
- 🔄 Updates difficulty multipliers
- 💹 Suggests pricing adjustments

---

## Usage Guide

### Creating a Job from Quote

1. **Create and save a quote** as normal
2. **Navigate to Jobs** (use navigation function)
3. **Click "Create Job from Quote"**
4. **Select the quote** from the list
5. **Set scheduled date** (optional)
6. **Job is created!**

Or programmatically:

```javascript
// Create job from saved quote
var job = JobManager.createFromQuote('quote_xyz', '2025-12-15T09:00:00');
console.log('Job created:', job.jobNumber);  // "JOB-0001"
```

### Starting a Job

1. **Open the job** from jobs list
2. **Click "Start Job"** button
3. **Timer starts automatically**
4. **Quick actions become available:**
   - Take Before Photo
   - Take After Photo
   - Report Issue
   - Add Note
   - Extra Work
   - Update Difficulty

### Taking Photos

**Before Photos (at start of job):**
1. Click "Before Photo" button
2. Select photo from camera/files
3. Enter location: "Front windows", "Side entrance", etc.
4. Add notes: "Before cleaning - heavily soiled"

**After Photos (when complete):**
1. Click "After Photo" button
2. Select photo from camera/files
3. Use **same location** as before photo for comparison
4. Add notes: "After cleaning - spotless"

**Best Practices:**
- Match locations between before/after for comparisons
- Take photos from same angle
- Ensure good lighting
- Include context (e.g., whole house, not just window)

### Recording Issues

When you encounter problems:

1. Click "Report Issue"
2. Select type:
   - `access` - Difficult to reach areas
   - `equipment` - Equipment problems
   - `weather` - Weather delays
   - `damage` - Existing damage found
   - `other` - Anything else
3. Describe issue: "Ladder too short for 2nd story"
4. Severity: low/medium/high
5. Impact: "Added 30 minutes"
6. Resolution: "Used extension ladder from truck"

**Why Record Issues:**
- Learn common problems for similar jobs
- Justify price adjustments
- Improve future quotes

### Adding Notes

Capture important information:

1. Click "Add Note"
2. Enter note text
3. Select type:
   - `client-preference` - Special requests
   - `observation` - Things you noticed
   - `reminder` - Follow-up needed
   - `other` - General notes

**Examples:**
- "Client very particular about window tracks"
- "Found damaged screen on window #5 - client aware"
- "Dog on property - ask client to secure before arrival"

### Tracking Additional Work

When client requests extra work:

1. Click "Extra Work"
2. Describe work: "Clean window screens"
3. Quantity: 20
4. Unit price: $10
5. Time spent: 30 minutes
6. Get client approval: Yes/No

**Automatic price calculation:**
- Adds to job total
- Shows on invoice
- Marked as "Additional" on invoice

### Updating Difficulty

If a job is harder/easier than estimated:

1. Click "Difficulty"
2. Select work item (0, 1, 2...)
3. Update difficulty:
   - `easy` - 0.8x price
   - `normal` - 1.0x price
   - `hard` - 1.3x price
   - `very-hard` - 1.6x price

**System learns:**
- Difficulty variance tracked
- Future quotes adjusted
- Multipliers refined

### Completing a Job

1. **Click "Complete Job"** button
2. **Rate client experience** (1-5 stars)
3. **Enter client feedback** (optional)
4. **Mark if you:**
   - Showed before/after photos to client
   - Issued service warranty
   - Need follow-up
5. **Click "Complete Job"**

**System calculates:**
- Time variance (actual vs estimated)
- Price variance (actual vs quoted)
- Difficulty variance (actual vs expected)
- Improvement suggestions

**Automatic metrics update:**
- Average time per window
- Average time per sqm
- Difficulty multipliers
- Common issues

### Generating Invoice from Job

After completing a job:

1. **Confirm job completion summary**
2. **Click "Generate Invoice"** when prompted
3. **Invoice created automatically** with:
   - Actual amounts (not estimated)
   - Additional work included
   - Before/after photos attached
   - Price adjustment notes
   - Client feedback

Or manually:

```javascript
var invoice = JobManager.generateInvoice('job_0001');
// Invoice created with job data
```

---

## Pricing Intelligence

### Viewing Insights

**Navigate to Pricing Insights page:**

Shows:
- **Pricing Accuracy** - Overall accuracy percentage
- **Jobs Analyzed** - Number of completed jobs
- **Underquotes** - How many times you charged too little
- **Overquotes** - How many times you charged too much
- **Average Variance** - Typical difference between quote and reality

### Performance Metrics

Displays:
- **Avg Time Per Window** - Based on actual completed jobs
- **Avg Time Per SQM** - For pressure cleaning
- **Avg Job Duration** - Overall job length
- **Avg Job Value** - Typical job worth

### Common Issues

Shows issues encountered across all jobs:
- Type (access, equipment, weather, etc.)
- Frequency
- Percentage of jobs affected

### Recommendations

Get actionable insights:
- "You're underquoting 5 out of 8 jobs - increase base rates by 10-15%"
- "Time estimates are off by 35% on average - use historical data"
- "Add 10% contingency buffer for unexpected issues"

### Getting Suggestions for New Quotes

**Automatic suggestions when creating quotes:**

```javascript
var suggestions = PricingIntelligence.getSuggestionsForQuote({
  serviceType: 'windows',
  quantity: 20,
  estimatedTime: 120,
  difficulty: 'normal',
  price: 770,
  total: 770
});

// Returns array of suggestions:
// [
//   {
//     type: 'time-estimate',
//     current: 120,
//     suggested: 180,
//     reason: 'Based on 5 completed jobs, suggest 180 minutes instead of 120',
//     confidence: 'high'
//   }
// ]
```

---

## Data Structure

### Job Object

```javascript
{
  id: 'job_1234567890',
  jobNumber: 'JOB-0001',
  quoteId: 'quote_xyz',

  client: {
    name: 'John Smith',
    phone: '0400000000',
    email: 'john@example.com',
    address: '123 Main St'
  },

  status: 'scheduled',  // scheduled, in-progress, completed, invoiced

  schedule: {
    scheduledDate: '2025-12-15T09:00:00',
    startTime: '2025-12-15T09:00:00',
    endTime: '2025-12-15T12:30:00',
    estimatedDuration: 120,  // minutes
    actualDuration: 210      // minutes
  },

  estimate: {
    items: [
      {
        description: 'Window cleaning - 20 windows',
        quantity: 20,
        unitPrice: 35,
        estimatedTime: 120,
        difficulty: 'normal',
        total: 700
      }
    ],
    total: 770
  },

  actual: {
    items: [
      {
        description: 'Window cleaning - 20 windows',
        quantity: 20,
        actualTime: 180,          // 50% longer
        actualDifficulty: 'hard', // Was harder
        issues: ['Difficult access'],
        total: 700
      }
    ],
    additionalWork: [
      {
        description: 'Clean screens',
        quantity: 20,
        unitPrice: 10,
        approved: true,
        total: 200
      }
    ],
    total: 970
  },

  photos: {
    before: [ /* photo objects */ ],
    after: [ /* photo objects */ ],
    issues: [ /* photo objects */ ]
  },

  issues: [ /* issue objects */ ],
  notes: [ /* note objects */ ],

  learningMetrics: {
    estimateAccuracy: {
      timeVariance: 50,      // 50% longer
      priceVariance: 25.9,   // 25.9% more
      difficultyVariance: 1  // 1 level harder
    },
    improvements: [
      'Job took 50% longer than estimated',
      'Access difficulty underestimated',
      'Should quote 2.5 hours for similar jobs'
    ],
    futureAdjustments: {
      baseTimeMultiplier: 1.5,
      difficultyUpgrade: true,
      scopeBuffer: 200
    }
  }
}
```

---

## Technical Details

### Modules

**job-manager.js** (core functionality)
- Create jobs from quotes
- Track time and status
- Record photos, issues, notes
- Calculate learning metrics
- Generate invoices

**pricing-intelligence.js** (learning system)
- Analyze pricing accuracy
- Generate suggestions
- Performance metrics
- Recommendations

**photo-comparison.js** (before/after)
- Create side-by-side comparisons
- Canvas-based image generation
- PDF attachment support

**job-tracking-ui.js** (user interface)
- Active job screen
- Photo gallery
- Issue/note display
- Pricing comparison
- Timer display

### Storage

**LocalStorage Keys:**
- `tts_jobs` - All job data
- `tts_job_metrics` - Learning metrics database
- `tts_last_job_number` - Job number sequence

### API Examples

**Create job:**
```javascript
var job = JobManager.createFromQuote('quote_123', '2025-12-15T09:00:00');
```

**Start job:**
```javascript
JobManager.startJob('job_001');
```

**Add photo:**
```javascript
JobManager.addPhoto('job_001', 'before', photoDataUrl, 'Front windows', 'Before cleaning');
```

**Record issue:**
```javascript
JobManager.recordIssue('job_001', {
  type: 'access',
  description: 'Ladder too short',
  severity: 'medium',
  impact: 'Added 30 minutes',
  resolution: 'Used extension ladder'
});
```

**Complete job:**
```javascript
JobManager.completeJob('job_001', {
  clientRating: 5,
  clientFeedback: 'Excellent work!',
  photosShownToClient: true,
  warrantyIssued: true
});
```

**Generate invoice:**
```javascript
var invoice = JobManager.generateInvoice('job_001');
```

**Get pricing suggestions:**
```javascript
var suggestions = PricingIntelligence.getSuggestionsForQuote(quoteData);
```

**Analyze accuracy:**
```javascript
var analysis = PricingIntelligence.analyzePricingAccuracy();
console.log('Accuracy:', analysis.accuracy + '%');
```

---

## Best Practices

### 1. Consistent Photo Locations

**Good:**
- Before: "Front windows"
- After: "Front windows"
→ Creates perfect comparison

**Bad:**
- Before: "Front"
- After: "Windows at front of house"
→ Won't match for comparison

### 2. Record Issues Immediately

Don't wait until end of job - record issues as they happen:
- You'll remember details
- Can adjust time estimates in real-time
- Shows professionalism if client asks

### 3. Get Client Approval for Extra Work

**Always:**
1. Explain the additional work
2. Quote the price
3. Get verbal approval
4. Mark as "approved" in system
5. Show on invoice as "Additional"

**Never:**
- Add extra work without approval
- Surprise client with charges
- Assume they'll be okay with it

### 4. Use Difficulty Levels Consistently

**Easy:** Straightforward, no issues, quick access
**Normal:** Standard job, some challenges
**Hard:** Significant challenges, extra time/equipment
**Very Hard:** Extreme difficulty, specialized equipment

### 5. Complete Jobs Promptly

Complete and invoice jobs within 24 hours:
- Better recall of details
- Faster payment
- More accurate learning data
- Professional impression

### 6. Review Insights Monthly

Check pricing insights every month:
- Identify patterns (always underquoting 2-story?)
- Adjust base rates if needed
- Update difficulty multipliers
- Improve accuracy over time

---

## Troubleshooting

### "Job not found" Error

**Cause:** Job ID invalid or job doesn't exist

**Solution:**
```javascript
var jobs = JobManager.getAllJobs();
console.log('All jobs:', jobs);
```

### Photos Not Appearing

**Cause:** Location mismatch or photos not saved

**Solution:**
1. Check job photos: `job.photos.before`, `job.photos.after`
2. Ensure location strings match exactly
3. Verify photo data URL saved correctly

### Timer Not Starting

**Cause:** Job status not "in-progress"

**Solution:**
```javascript
JobManager.startJob('job_001');
// Changes status to 'in-progress'
```

### Invoice Generation Fails

**Cause:** Job not completed or InvoiceSystem not available

**Solution:**
1. Ensure job status is "completed"
2. Check `JobManager.completeJob()` was called
3. Verify InvoiceSystem loaded: `window.InvoiceSystem`

### Learning Metrics Not Updating

**Cause:** Job not completed properly

**Solution:**
- Complete job through UI (Complete Job button)
- Or call `JobManager.completeJob()` with completion data
- Metrics calculated automatically on completion

---

## Future Enhancements

Potential future additions:

1. **GPS Integration** - Auto-detect job location
2. **Voice Notes** - Record audio notes during job
3. **Client Signature** - Digital signature on completion
4. **Team Assignments** - Assign jobs to team members
5. **Route Optimization** - Plan most efficient route for multiple jobs
6. **Weather Integration** - Factor in weather conditions
7. **Equipment Tracking** - Track which equipment used
8. **Advanced Analytics** - Predictive pricing models

---

## Support

For issues or questions:
- Check console for error messages
- Review this guide
- Check MODULE_REFERENCE in CLAUDE.md
- Test with sample job first

---

**Last Updated:** 2025-11-18
**Version:** 1.13.0
**Author:** TicTacStick Development Team
