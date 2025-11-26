# Release Freeze Checklist

Use this checklist before cutting a release branch or deploying to production.

## Pre-Release Verification

### Code Quality

- [ ] All Playwright tests pass (`npm test`)
- [ ] No console errors in browser DevTools
- [ ] Config validation passes (`npm run validate:config`)
- [ ] No TODO/FIXME comments in release scope

### Version & Changelog

- [ ] Version bumped in `package.json`
- [ ] `CHANGELOG.md` updated with release notes
- [ ] Git tag created matching version

### PWA & Service Worker

- [ ] Service Worker version incremented (if SW changed)
- [ ] Cache bust strategy verified
- [ ] Offline functionality tested
- [ ] `manifest.json` icons and metadata correct

### Native (Capacitor)

- [ ] `npm run cap:verify` passes
- [ ] iOS build tested on simulator
- [ ] Android build tested on emulator
- [ ] Native plugin versions locked

### Configuration

- [ ] `config-production.js` has correct endpoints
- [ ] No development/debug flags enabled
- [ ] API keys use production values (via env vars)
- [ ] CORS origins configured for production domain

## Deployment Steps

### 1. Create Release Branch

```bash
git checkout main
git pull origin main
git checkout -b release/v1.X.X
```

### 2. Final Verification

```bash
npm run validate:config
npm test
npm run cap:verify
```

### 3. Tag Release

```bash
git tag -a v1.X.X -m "Release v1.X.X"
git push origin release/v1.X.X --tags
```

### 4. Deploy

- [ ] Deploy to staging environment
- [ ] Smoke test staging
- [ ] Deploy to production
- [ ] Verify production health

### 5. Post-Deploy

- [ ] Monitor error rates for 30 minutes
- [ ] Verify Service Worker update propagates
- [ ] Check Cloudflare cache status
- [ ] Announce release in team channel

## Freeze Rules

### During Freeze (24h before release)

- **No new features** - Only critical bug fixes
- **No dependency updates** - Unless security-critical
- **No config changes** - Lock environment settings
- **All PRs require 2 approvals** - Extra review during freeze

### Emergency Hotfix Process

1. Create branch from release tag: `git checkout -b hotfix/issue-XXX v1.X.X`
2. Apply minimal fix
3. Run full test suite
4. Fast-track review (1 approval minimum)
5. Deploy and tag as `v1.X.1`

## Rollback Plan

If critical issues detected post-deploy:

```bash
# Revert to previous version
git checkout v1.X.X-1
npm run cap:sync
# Redeploy
```

### Cloudflare Cache Purge

```bash
# Purge all cached assets
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

---

**Last Updated:** 2025-11-26
