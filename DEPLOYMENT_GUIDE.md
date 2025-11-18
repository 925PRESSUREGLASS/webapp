# TicTacStick Deployment Guide

Complete guide to deploying TicTacStick to Cloudflare Pages (100% FREE hosting).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Deployment Steps](#detailed-deployment-steps)
4. [Custom Domain Setup](#custom-domain-setup)
5. [Webhook Backend Deployment](#webhook-backend-deployment)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub account (free)
- [x] Cloudflare account (free) - Sign up at https://dash.cloudflare.com/sign-up
- [x] Git installed on your computer
- [x] Code pushed to GitHub repository
- [ ] (Optional) Custom domain name (~$12/year)

---

## Quick Start

**Deploy in 5 minutes:**

1. Push code to GitHub
2. Sign up for Cloudflare Pages
3. Connect GitHub repository
4. Click "Deploy"
5. Done! Your app is live at `https://tictacstick.pages.dev`

---

## Detailed Deployment Steps

### Step 1: Prepare Your Repository

```bash
# Navigate to project directory
cd /path/to/webapp

# Check git status
git status

# Add all files (if not already done)
git add .

# Commit changes
git commit -m "feat: prepare for Cloudflare Pages deployment"

# Push to GitHub
git push origin claude/deploy-cloudflare-pages-01CT5HrsDQDJ9hLArTLWGepG
```

### Step 2: Sign Up for Cloudflare Pages

1. Go to https://pages.cloudflare.com
2. Click "Sign up" (or "Log in" if you have an account)
3. Verify your email address
4. Complete account setup

### Step 3: Create Pages Project

1. **In Cloudflare Dashboard:**
   - Click "Workers & Pages" in sidebar
   - Click "Create application"
   - Select "Pages" tab
   - Click "Connect to Git"

2. **Connect GitHub:**
   - Click "GitHub" button
   - Authorize Cloudflare Pages
   - Select your repository: `925PRESSUREGLASS/webapp`

3. **Configure Build Settings:**
   ```
   Project name: tictacstick
   Production branch: main (or your branch name)
   Build command: (leave empty)
   Build output directory: /
   Root directory: /
   ```

4. **Environment Variables:**
   - None required for basic deployment
   - (Optional) Add later for advanced features

5. **Click "Save and Deploy"**

### Step 4: Wait for Deployment

- **First deployment:** ~2-3 minutes
- **Subsequent deployments:** ~30-60 seconds

**Monitor progress:**
- Watch build logs in Cloudflare dashboard
- Look for "Success! Your deployment is live!"

### Step 5: Test Your Deployment

1. **Get your URL:**
   - Cloudflare assigns: `https://tictacstick.pages.dev`
   - Click the URL to open your app

2. **Test functionality:**
   - [ ] App loads correctly
   - [ ] Can create quotes
   - [ ] Can add line items
   - [ ] Calculations work
   - [ ] LocalStorage saves data
   - [ ] Offline mode works (disconnect WiFi, reload)
   - [ ] Invoice system works
   - [ ] Photos upload

3. **Test on mobile:**
   - Open URL on iPhone/iPad
   - Add to Home Screen (PWA install)
   - Test offline mode

---

## Custom Domain Setup

### Option 1: Using Cloudflare Registrar (Recommended)

**Register domain with Cloudflare (~$10/year):**

1. In Cloudflare dashboard
2. Go to "Domain Registration"
3. Search for domain: `tictacstick.com.au`
4. Purchase domain
5. Domain auto-configures with Pages project

**Connect to Pages:**

1. Go to your Pages project
2. Click "Custom domains" tab
3. Click "Set up a custom domain"
4. Enter domain: `tictacstick.com.au`
5. Click "Activate domain"
6. Done! (DNS configures automatically)

### Option 2: Using External Registrar (Namecheap, etc.)

**If you already own a domain:**

1. **In Cloudflare Pages:**
   - Go to project → "Custom domains"
   - Click "Set up a custom domain"
   - Enter: `tictacstick.com.au`
   - Cloudflare provides DNS records

2. **In your domain registrar:**
   - Add CNAME record:
     ```
     Name: @
     Type: CNAME
     Value: tictacstick.pages.dev
     TTL: Auto
     ```
   - Add CNAME for www:
     ```
     Name: www
     Type: CNAME
     Value: tictacstick.pages.dev
     TTL: Auto
     ```

3. **Wait for DNS propagation:**
   - Usually 5-15 minutes
   - Can take up to 24 hours
   - Check status: https://dnschecker.org

4. **Verify SSL certificate:**
   - Cloudflare auto-provisions SSL
   - Look for padlock icon in browser
   - Your site is now HTTPS

**Recommended domains for Australia:**
- `tictacstick.com.au` ($12-15/year)
- `925quotes.com.au` ($12-15/year)
- `pressureglass.com.au` ($12-15/year)
- `tictacstick.com` ($10-12/year)

---

## Webhook Backend Deployment

Deploy Cloudflare Worker for GoHighLevel webhooks.

### Step 1: Install Wrangler CLI

```bash
# Install Wrangler (Cloudflare CLI)
npm install -g wrangler

# Verify installation
wrangler --version

# Login to Cloudflare
wrangler login
```

### Step 2: Configure Worker

The `wrangler.toml` file is already configured. Review and update if needed:

```toml
name = "tictacstick-webhooks"
main = "cloudflare/worker.js"
compatibility_date = "2025-01-01"
```

### Step 3: Set Environment Variables

```bash
# Set webhook secret
wrangler secret put WEBHOOK_SECRET
# Enter your GHL webhook secret when prompted

# Set allowed origins
wrangler secret put ALLOWED_ORIGINS
# Enter: https://tictacstick.com.au,https://tictacstick.pages.dev
```

### Step 4: Deploy Worker

```bash
# Deploy to production
wrangler deploy

# Worker will be live at:
# https://tictacstick-webhooks.your-subdomain.workers.dev
```

### Step 5: Configure Custom Domain (Optional)

1. **In Cloudflare Dashboard:**
   - Workers & Pages → Your worker
   - "Triggers" tab
   - "Custom Domains" section
   - Add: `webhooks.tictacstick.com.au`

2. **DNS configures automatically** (if domain in Cloudflare)

3. **Update webhook URL in GHL:**
   - GoHighLevel → Settings → Integrations
   - Update webhook URL: `https://webhooks.tictacstick.com.au/webhook`

### Step 6: Test Webhook

```bash
# Test health endpoint
curl https://webhooks.tictacstick.com.au/health

# Should return:
# {"status":"ok","timestamp":"2025-11-18T...","version":"1.0.0"}
```

---

## Post-Deployment

### Enable Automatic Deployments

Cloudflare Pages auto-deploys when you push to GitHub:

```bash
# Make code changes
vim app.js

# Commit
git add .
git commit -m "feat: improved calculation logic"

# Push
git push origin main

# Cloudflare automatically:
# 1. Detects push
# 2. Builds (if needed)
# 3. Deploys to production
# 4. Updates live site
#
# Takes 30-60 seconds
```

### Preview Deployments

Every branch gets a preview URL:

```bash
# Create feature branch
git checkout -b feature/new-pricing

# Make changes
vim pricing-calculator.js

# Push
git push origin feature/new-pricing

# Cloudflare creates preview:
# https://abc123.tictacstick.pages.dev
#
# Test before merging!
```

### Configure Analytics

**Built-in Cloudflare Analytics (FREE):**

1. Cloudflare Dashboard → Analytics
2. View:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Geographic distribution
   - Performance metrics

**Optional: Google Analytics:**

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Set Up Uptime Monitoring

**UptimeRobot (FREE for 50 monitors):**

1. Sign up: https://uptimerobot.com
2. Add monitor:
   - Type: HTTPS
   - URL: `https://tictacstick.com.au`
   - Interval: 5 minutes
   - Alert contacts: your email
3. Get notifications if site goes down

### Enable Backup System

TicTacStick includes built-in backup functionality:

1. **Manual backup:**
   - Settings → Backup & Restore
   - Click "Download Backup"
   - Saves JSON file with all data

2. **Automatic backup:**
   - Runs daily (if app is open)
   - Prompts to download backup
   - Stores locally

3. **Schedule regular backups:**
   - Set calendar reminder (weekly)
   - Download and store in cloud (Dropbox, Google Drive)

---

## Troubleshooting

### Issue: Deployment fails

**Possible causes:**
- Invalid configuration
- Missing files
- Build errors

**Solution:**
1. Check build logs in Cloudflare dashboard
2. Ensure all files committed to Git
3. Verify `wrangler.toml` syntax
4. Try manual deploy: `wrangler deploy`

### Issue: App loads but doesn't work

**Possible causes:**
- Service worker not registering
- JavaScript errors
- LocalStorage blocked

**Solution:**
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Application → Service Workers
4. Verify LocalStorage enabled
5. Try in Incognito mode

### Issue: Custom domain not working

**Possible causes:**
- DNS not propagated
- SSL not provisioned
- Incorrect DNS records

**Solution:**
1. Check DNS propagation: https://dnschecker.org
2. Wait 15-30 minutes for SSL provisioning
3. Verify CNAME records point to `.pages.dev`
4. Check Cloudflare dashboard for SSL status

### Issue: Webhook not receiving events

**Possible causes:**
- Worker not deployed
- Wrong URL in GHL
- CORS issues
- Signature verification failing

**Solution:**
1. Test health endpoint: `curl https://webhooks.../health`
2. Check worker logs in Cloudflare dashboard
3. Verify webhook URL in GHL settings
4. Check ALLOWED_ORIGINS includes your domain
5. Temporarily disable signature verification for testing

### Issue: Data not persisting

**Possible causes:**
- LocalStorage blocked
- Incognito mode
- Private browsing
- Browser extension blocking

**Solution:**
1. Check browser settings allow LocalStorage
2. Disable incognito/private mode
3. Check browser extensions
4. Try different browser
5. Check LocalStorage quota (5-10MB limit)

### Issue: PWA not installable

**Possible causes:**
- Missing manifest
- Missing service worker
- Not HTTPS
- Missing icons

**Solution:**
1. Verify `manifest.json` exists and loads
2. Check service worker registered
3. Ensure site is HTTPS (Cloudflare auto-provides)
4. Verify all icon sizes present
5. Check browser DevTools → Application → Manifest

---

## Performance Optimization

### Enable Caching

Cloudflare Pages automatically caches static assets. For custom caching:

1. **In Cloudflare Dashboard:**
   - Caching → Configuration
   - Browser Cache TTL: 4 hours
   - Always Online: Enabled

### Enable Compression

Cloudflare automatically compresses:
- Gzip for older browsers
- Brotli for modern browsers

### Enable HTTP/3

1. Network tab in Cloudflare
2. HTTP/3 (with QUIC): Enabled
3. 0-RTT Connection Resumption: Enabled

### Minify Assets (Optional)

1. Speed → Optimization
2. Auto Minify:
   - JavaScript: On
   - CSS: On
   - HTML: On

---

## Security Best Practices

### HTTPS Enforcement

Cloudflare Pages enforces HTTPS automatically.

### Content Security Policy

Already configured in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  ...
">
```

### Rate Limiting (Pro Plan)

For additional security:
1. Security → WAF
2. Rate Limiting Rules
3. Add rule: Max 100 requests/minute per IP

### DDoS Protection

Cloudflare provides automatic DDoS protection (free tier included).

---

## Cost Breakdown

**Total Monthly Cost: $0** 🎉

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month | Hosting | **$0** |
| Cloudflare Workers | 100,000 requests/day | Webhooks | **$0** |
| SSL Certificate | Included | HTTPS | **$0** |
| DDoS Protection | Included | Security | **$0** |
| CDN | Included | Global delivery | **$0** |
| **TOTAL** | | | **$0/month** |

**One-time costs:**
- Domain name: ~$12/year (optional)

**Paid plan upgrades (optional):**
- Cloudflare Pages Pro: $20/month (advanced analytics, faster builds)
- Cloudflare Workers Paid: $5/month (unlimited requests, longer execution)

---

## Deployment Checklist

Copy this checklist for each deployment:

```markdown
## Pre-Deployment
- [ ] All tests passing locally
- [ ] No console errors
- [ ] Code pushed to GitHub
- [ ] Service worker cache updated
- [ ] Version number bumped

## Cloudflare Pages
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Initial deployment successful
- [ ] App tested on .pages.dev URL
- [ ] Offline mode works

## Custom Domain (if applicable)
- [ ] Domain purchased/configured
- [ ] DNS records added
- [ ] SSL certificate active
- [ ] www redirect working

## Webhook Backend (if applicable)
- [ ] Worker deployed
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] Health endpoint responding

## Testing
- [ ] All pages load
- [ ] Quote creation works
- [ ] Invoice generation works
- [ ] Photos upload
- [ ] Calculations correct
- [ ] Mobile responsive
- [ ] PWA installable
- [ ] Offline mode functional

## Monitoring
- [ ] Analytics configured
- [ ] Uptime monitor active
- [ ] Error tracking setup

## Backup
- [ ] Backup system tested
- [ ] Restore verified

## Go Live
- [ ] Update bookmarks
- [ ] Notify team
- [ ] Monitor for 24 hours
```

---

## Next Steps

After deployment:

1. **Share URL** with team
2. **Install PWA** on iPhone/iPad (Add to Home Screen)
3. **Create first quote** in production
4. **Test invoice generation**
5. **Set up GoHighLevel** integration
6. **Enable automatic backups**
7. **Monitor analytics**

---

## Support

**Cloudflare Support:**
- Community: https://community.cloudflare.com
- Docs: https://developers.cloudflare.com/pages
- Status: https://www.cloudflarestatus.com

**TicTacStick Issues:**
- GitHub Issues: https://github.com/925PRESSUREGLASS/webapp/issues
- Documentation: See `README.md`, `CLAUDE.md`

---

## Frequently Asked Questions

### Can I deploy to multiple environments?

Yes! Use branches:
- `main` → Production (`tictacstick.pages.dev`)
- `staging` → Staging (`staging.tictacstick.pages.dev`)
- Feature branches → Preview URLs

### How do I rollback a deployment?

1. Cloudflare Dashboard → Your project
2. "Deployments" tab
3. Find working deployment
4. Click "..." → "Rollback to this deployment"

OR via Git:

```bash
git revert <commit-hash>
git push origin main
```

### Can I use my own backend?

Yes! TicTacStick is designed to work with:
- Cloudflare Workers (current setup)
- Any REST API backend
- Serverless functions (AWS Lambda, Netlify Functions)

Update API endpoints in configuration files.

### What about data migration?

TicTacStick stores all data in LocalStorage (client-side). To migrate:

1. Export backup from old device
2. Import backup on new device
3. Or use GoHighLevel as source of truth

### Is my data secure?

Yes:
- All data stays on your device (LocalStorage)
- HTTPS encryption in transit
- No server-side storage (unless you add GHL sync)
- XSS protection built-in
- CSP headers configured

### Can I self-host instead?

Yes! TicTacStick is a static PWA. Host anywhere:
- Cloudflare Pages (recommended, free)
- Netlify
- Vercel
- GitHub Pages
- Your own server (Apache, Nginx)

Just serve the files over HTTPS.

---

**You're now ready to deploy TicTacStick to production!** 🚀

For detailed customization and advanced features, see `CLAUDE.md`.
