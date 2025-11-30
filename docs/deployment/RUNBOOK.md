# Operations Runbook

Quick reference for common TicTacStick operations.

---

## Table of Contents

1. [Local Development](#local-development)
2. [Testing](#testing)
3. [Deployment](#deployment)
4. [Rollback](#rollback)
5. [Debugging](#debugging)
6. [Database Operations](#database-operations)
7. [Monitoring](#monitoring)

---

## Local Development

### Quick Start

```bash
# One-command setup
npm install && npm test && python3 -m http.server 8080
```

### Start Development Servers

```bash
# PWA only (no backend)
python3 -m http.server 8080

# Full stack (API + Dashboard)
npm run dev

# API only
npm run dev:api

# Dashboard only
npm run dev:dashboard
```

### Environment Setup

```bash
# Copy environment files
cp apps/meta-api/.env.example apps/meta-api/.env
cp apps/meta-dashboard/.env.example apps/meta-dashboard/.env

# Edit with your values
code apps/meta-api/.env
```

---

## Testing

### Run Tests

```bash
# Full test suite
npm test

# Headed mode (see browser)
npm run test:headed

# Interactive UI
npm run test:ui

# Debug mode
npm run test:debug

# Single test file
npx playwright test tests/analytics.spec.js

# Single browser
npx playwright test --project=chromium
```

### Test Validation

```bash
# Validate config for secrets
npm run validate:config

# Verify Capacitor assets
npm run cap:verify

# Run npm audit
npm audit --omit=dev
```

---

## Deployment

### Pre-Deployment Checklist

1. [ ] All tests pass: `npm test`
2. [ ] Config validated: `npm run validate:config`
3. [ ] Version bumped in `package.json`
4. [ ] `CHANGELOG.md` updated
5. [ ] Capacitor synced: `npm run cap:verify`

### Deploy to Production

```bash
# 1. Create release branch
git checkout main
git pull origin main
git checkout -b release/v1.X.X

# 2. Run final checks
npm run validate:config
npm test

# 3. Tag and push
git tag -a v1.X.X -m "Release v1.X.X"
git push origin release/v1.X.X --tags

# 4. Deploy (platform-specific)
# For Cloudflare Pages: auto-deploys on push
# For Vercel: auto-deploys on push
# For manual: copy files to hosting
```

### Deploy Mobile Apps

```bash
# Sync web assets
npm run cap:sync

# Open in Xcode (iOS)
npm run cap:open:ios

# Open in Android Studio
npm run cap:open:android
```

---

## Rollback

### Quick Rollback

```bash
# Find previous version
git tag --list

# Checkout previous version
git checkout v1.X.X

# Redeploy
npm run cap:sync
```

### Cloudflare Cache Purge

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Service Worker Reset

Users may need to clear SW cache manually:
1. Open DevTools > Application > Service Workers
2. Click "Unregister"
3. Clear site data
4. Refresh page

---

## Debugging

### Browser Console

```javascript
// Check APP state
console.log(APP);

// Check storage usage
APP.storageQuotaManager.calculateUsage();

// Get performance report
APP.performanceMonitor.getReport();

// Check initialized modules
Object.keys(APP);
```

### iOS Safari Debugging

1. Connect device to Mac
2. Open Safari > Develop > [Device Name]
3. Select the app page
4. Use Web Inspector

### Common Issues

| Issue | Solution |
|-------|----------|
| SW hanging in tests | Add `?testMode=1` to URL |
| LocalStorage errors | Check quota with `APP.storageQuotaManager` |
| Camera not working | Requires HTTPS in production |
| GPS not working | Check permissions, use Capacitor plugin |

---

## Database Operations

### Prisma Commands

```bash
# Generate client
npm run prisma:generate --prefix apps/meta-api

# Run migrations
npm run prisma:deploy --prefix apps/meta-api

# Open Prisma Studio
npx prisma studio --schema=prisma/schema.prisma

# Create migration
npx prisma migrate dev --name description
```

### Backup LocalStorage

```javascript
// Export all data
APP.backupManager.createBackup();

// Restore from backup
APP.backupManager.restoreBackup(backupData);
```

---

## Monitoring

### Performance Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Page load | >2000ms | >5000ms |
| Calculation | >100ms | >500ms |
| Storage quota | >75% | >90% |

### Health Check

```bash
# API health
curl http://localhost:3000/health

# Smoke tests
npm run smoke
```

### Lighthouse Scores

| Category | Target |
|----------|--------|
| Performance | ≥70 |
| Accessibility | ≥90 |
| Best Practices | ≥80 |
| SEO | ≥80 |
| PWA | ≥60 |

---

## Emergency Contacts

- **Repository:** https://github.com/925PRESSUREGLASS/webapp
- **Issues:** https://github.com/925PRESSUREGLASS/webapp/issues
- **Security:** security@925pressureglass.com

---

**Last Updated:** 2025-11-26
