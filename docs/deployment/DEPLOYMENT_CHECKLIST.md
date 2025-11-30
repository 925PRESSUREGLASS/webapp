# TicTacStick Deployment Checklist

Use this checklist for each deployment to production.

---

## Pre-Deployment Checks

### Code Quality
- [ ] All tests passing (`npm test`)
- [ ] No console errors in browser DevTools
- [ ] No ESLint/syntax errors
- [ ] Code reviewed and approved
- [ ] Version number updated in:
  - [ ] `package.json`
  - [ ] `manifest.json`
  - [ ] `sw.js` (CACHE_VERSION)
  - [ ] `CLAUDE.md`

### ES5 Compliance (Critical for iOS Safari)
- [ ] No `const` or `let` keywords (`grep -r "const " *.js`)
- [ ] No arrow functions (`grep -r "=>" *.js`)
- [ ] No template literals (`` ` ``) (`grep -r "\`" *.js`)
- [ ] No destructuring
- [ ] No spread operator
- [ ] No async/await

### Security Checks
- [ ] XSS prevention enabled
- [ ] Input validation active
- [ ] Content Security Policy configured
- [ ] No sensitive data in code (API keys, secrets)
- [ ] HTTPS enforced
- [ ] Sanitization working on all inputs

### PWA Requirements
- [ ] `manifest.json` complete and valid
- [ ] Service worker registered and working
- [ ] All icon sizes present (72, 96, 128, 144, 152, 192, 384, 512)
- [ ] Maskable icons present (192, 512)
- [ ] Offline mode functional
- [ ] Add to Home Screen works
- [ ] Splash screen displays correctly

### Service Worker
- [ ] Cache list updated with all files
- [ ] CACHE_VERSION bumped
- [ ] Offline fallback working
- [ ] Cache clearing on old versions

### Git & Version Control
- [ ] All changes committed
- [ ] Commit messages descriptive
- [ ] Branch up to date with main
- [ ] No merge conflicts
- [ ] `.gitignore` configured properly

---

## Cloudflare Pages Deployment

### Repository Setup
- [ ] Code pushed to GitHub
- [ ] Branch specified for deployment
- [ ] Repository connected to Cloudflare Pages
- [ ] Build settings configured:
  - [ ] Build command: (empty)
  - [ ] Build output: `/`
  - [ ] Root directory: `/`

### Deployment
- [ ] Deployment triggered
- [ ] Build logs reviewed
- [ ] No build errors
- [ ] Deployment successful
- [ ] Preview URL accessible

### Initial Testing
- [ ] App loads on `.pages.dev` URL
- [ ] No 404 errors
- [ ] Static assets load correctly
- [ ] Service worker registers
- [ ] PWA manifest loads

---

## Custom Domain (If Applicable)

### DNS Configuration
- [ ] Domain purchased
- [ ] DNS records configured:
  - [ ] `@` CNAME to `.pages.dev`
  - [ ] `www` CNAME to `.pages.dev`
- [ ] DNS propagation verified (https://dnschecker.org)
- [ ] TTL set appropriately

### SSL/TLS
- [ ] SSL certificate provisioned
- [ ] HTTPS redirect working
- [ ] Mixed content warnings resolved
- [ ] Certificate valid and trusted

### Domain Testing
- [ ] Root domain accessible (`example.com`)
- [ ] www subdomain accessible (`www.example.com`)
- [ ] Both redirect to HTTPS
- [ ] Custom domain shows in browser

---

## Webhook Backend (If Applicable)

### Worker Deployment
- [ ] Wrangler CLI installed
- [ ] `wrangler.toml` configured
- [ ] Worker deployed (`wrangler deploy`)
- [ ] Worker accessible at workers.dev URL

### Environment Variables
- [ ] `WEBHOOK_SECRET` set
- [ ] `ALLOWED_ORIGINS` configured
- [ ] Environment variables verified

### Custom Domain for Worker
- [ ] Custom route configured (e.g., `webhooks.example.com`)
- [ ] DNS record added
- [ ] Worker responds at custom domain

### Webhook Testing
- [ ] Health endpoint responds (`/health`)
- [ ] CORS headers present
- [ ] GoHighLevel webhook URL updated
- [ ] Test webhook received and processed

---

## Functional Testing

### Core Features
- [ ] Create new quote
- [ ] Add window line items
- [ ] Add pressure cleaning line items
- [ ] Calculations accurate
- [ ] Quote total correct
- [ ] GST calculated properly
- [ ] Minimum job enforced

### Invoice System
- [ ] Convert quote to invoice
- [ ] Invoice saved correctly
- [ ] Invoice status updates
- [ ] Payment recording works
- [ ] Invoice PDF generates
- [ ] Invoice number unique

### Client Database
- [ ] Add new client
- [ ] Edit client
- [ ] Delete client
- [ ] Search clients
- [ ] View client history

### Task Management
- [ ] Create task
- [ ] Edit task
- [ ] Complete task
- [ ] Task reminders work
- [ ] Task sync to GHL (if enabled)

### Analytics
- [ ] Analytics dashboard loads
- [ ] Charts display correctly
- [ ] Data accurate
- [ ] Export to CSV works

### Photos
- [ ] Upload photo
- [ ] Photo compression works
- [ ] Photo displays in quote
- [ ] Photo prints correctly

### PDF Generation
- [ ] Generate PDF quote
- [ ] PDF formatting correct
- [ ] PDF downloads
- [ ] PDF prints properly

### Import/Export
- [ ] Export backup works
- [ ] Backup file downloads
- [ ] Import backup works
- [ ] Data restored correctly

---

## Mobile Testing

### iOS Safari (Primary Target)
- [ ] App loads on iPhone
- [ ] App loads on iPad
- [ ] Touch targets adequate (44px min)
- [ ] Viewport correct
- [ ] No zoom on input focus
- [ ] Add to Home Screen works
- [ ] PWA runs standalone
- [ ] Offline mode works
- [ ] LocalStorage persists

### Android Chrome
- [ ] App loads correctly
- [ ] Add to Home Screen works
- [ ] PWA installable
- [ ] Offline mode works

### Responsive Design
- [ ] Mobile layout (< 768px)
- [ ] Tablet layout (768-1024px)
- [ ] Desktop layout (> 1024px)
- [ ] No horizontal scroll
- [ ] Elements not cut off

---

## Performance Testing

### Page Load
- [ ] First contentful paint < 2s
- [ ] Time to interactive < 3s
- [ ] No layout shift
- [ ] Images optimized
- [ ] Fonts loaded

### Runtime Performance
- [ ] No lag on input
- [ ] Smooth scrolling
- [ ] Quick calculations
- [ ] Instant navigation
- [ ] No memory leaks

### Lighthouse Audit
- [ ] Performance score > 90
- [ ] Accessibility score > 95
- [ ] Best Practices score > 95
- [ ] SEO score > 90
- [ ] PWA checks passing

---

## Monitoring & Analytics

### Analytics Setup
- [ ] Cloudflare Analytics active
- [ ] Google Analytics installed (if using)
- [ ] Events tracking correctly
- [ ] Conversion tracking (if applicable)

### Error Tracking
- [ ] Error handler installed
- [ ] Errors logged
- [ ] Sentry configured (if using)
- [ ] Error notifications set up

### Uptime Monitoring
- [ ] UptimeRobot monitor created
- [ ] Monitoring interval: 5 minutes
- [ ] Alert contacts configured
- [ ] Status page accessible

### Health Checks
- [ ] HealthCheck module running
- [ ] Health score > 80
- [ ] No critical issues
- [ ] Monitoring interval set

---

## Data & Backup

### Backup System
- [ ] Backup functionality tested
- [ ] Manual backup works
- [ ] Auto-backup enabled
- [ ] Restore tested
- [ ] Backup schedule set (weekly reminder)

### Data Migration
- [ ] Migration scripts tested
- [ ] Data schema verified
- [ ] Legacy data compatible

### LocalStorage
- [ ] Data persists across sessions
- [ ] No quota exceeded errors
- [ ] Storage usage acceptable (< 5MB)
- [ ] Sensitive data encrypted (if applicable)

---

## Security Verification

### Security Audit
- [ ] XSS test cases passing
- [ ] SQL injection not applicable (client-side only)
- [ ] Input sanitization working
- [ ] Content Security Policy enforced
- [ ] CORS configured correctly

### Authentication (If Applicable)
- [ ] Login works
- [ ] Logout works
- [ ] Session handling secure
- [ ] Password hashing (if applicable)

### Data Protection
- [ ] No sensitive data in logs
- [ ] API keys not exposed
- [ ] Webhook signatures verified
- [ ] HTTPS enforced

---

## Integration Testing

### GoHighLevel (If Enabled)
- [ ] OAuth connection works
- [ ] Contacts sync
- [ ] Opportunities create
- [ ] Tasks sync
- [ ] Webhooks receive events

### Payment Processing (If Enabled)
- [ ] Stripe connection works
- [ ] Test payment processes
- [ ] Payment webhook received
- [ ] Invoice marked paid

### Communication (If Enabled)
- [ ] SMS sends correctly
- [ ] Email sends correctly
- [ ] Templates render properly
- [ ] Delivery confirmed

---

## Documentation

### User Documentation
- [ ] README.md updated
- [ ] QUICK_START.md updated
- [ ] Feature list current
- [ ] Screenshots updated

### Developer Documentation
- [ ] CLAUDE.md updated
- [ ] DEPLOYMENT_GUIDE.md reviewed
- [ ] Changelog updated
- [ ] API docs current (if applicable)

### Version Control
- [ ] CHANGELOG.md entry added
- [ ] Version tagged in Git
- [ ] Release notes prepared

---

## Rollback Plan

### Preparation
- [ ] Previous deployment identified
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging

### Rollback Execution (If Needed)
- [ ] Cloudflare dashboard → Deployments
- [ ] Select previous working deployment
- [ ] Click "Rollback"
- [ ] OR: `git revert` + push

---

## Post-Deployment

### Immediate (0-1 hour)
- [ ] Monitor error rates
- [ ] Check analytics for traffic
- [ ] Verify uptime monitor
- [ ] Test critical user flows
- [ ] Watch for error spikes

### First 24 Hours
- [ ] Monitor performance metrics
- [ ] Check for user-reported issues
- [ ] Review error logs
- [ ] Verify backup ran successfully
- [ ] Monitor server resources

### First Week
- [ ] Gather user feedback
- [ ] Review analytics trends
- [ ] Check for performance degradation
- [ ] Monitor storage usage
- [ ] Plan next iteration

---

## Team Communication

### Before Deployment
- [ ] Notify team of deployment window
- [ ] Communicate expected downtime (if any)
- [ ] Share release notes

### After Deployment
- [ ] Announce deployment complete
- [ ] Share new feature list
- [ ] Provide training (if needed)
- [ ] Update bookmarks/links
- [ ] Celebrate success! 🎉

---

## Sign-Off

**Deployed by:** _________________________

**Date:** _________________________

**Deployment URL:** _________________________

**Git Commit:** _________________________

**Notes:**
```
(Any special notes about this deployment)
```

---

## Quick Reference

### Rollback Command
```bash
# Via Git
git revert <commit-hash>
git push origin main

# Via Cloudflare Dashboard
Dashboard → Project → Deployments → Previous Version → Rollback
```

### Clear Service Worker Cache
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for (var registration of registrations) {
    registration.unregister();
  }
});
```

### Force Refresh (Users)
1. Hard reload: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear cache: Browser settings → Clear browsing data
3. Unregister SW: DevTools → Application → Service Workers → Unregister

---

**Deployment Status:**

- [ ] **READY TO DEPLOY** - All checks passed
- [ ] **DEPLOYED** - Live in production
- [ ] **VERIFIED** - Post-deployment checks complete

---

*Last Updated: 2025-11-18*
*Version: 1.8.0*
