// Service Worker for Tic-Tac-Stick Quote Engine
// Provides offline functionality and caching
// iOS Safari compatible - no ES6+ features
// SECURITY HARDENED - Version 1.3

var CACHE_VERSION = '1.8.0';
var CACHE_NAME = 'quote-engine-v' + CACHE_VERSION;

// SECURITY: Explicit whitelist of allowed files to cache
// Only cache files from our own origin - prevents cache poisoning
var urlsToCache = [
  // HTML
  '/index.html',

  // Core CSS
  '/app.css',
  '/css/design-system.css',
  '/toast.css',
  '/loading.css',
  '/validation.css',
  '/theme-light.css',
  '/mobile.css',
  '/print.css',

  // Feature CSS
  '/photo-modal.css',
  '/photos.css',
  '/client-database.css',
  '/quote-workflow.css',
  '/import-export.css',
  '/invoice.css',
  '/invoice-print.css',
  '/letterhead.css',
  '/photo-print-layout.css',
  '/theme-customizer.css',
  '/analytics.css',
  '/css/analytics-dashboard.css',
  '/css/tasks.css',
  '/shortcuts.css',
  '/quote-pdf.css',

  // Core JS
  '/bootstrap.js',
  '/app.js',
  '/calc.js',
  '/data.js',
  '/storage.js',
  '/ui.js',
  '/wizard.js',
  '/security.js',
  '/validation.js',
  '/ui-components.js',
  '/debug.js',
  '/error-handler.js',
  '/accessibility.js',
  '/loading.js',

  // Extended Data
  '/window-types-extended.js',
  '/conditions-modifiers.js',
  '/pressure-surfaces-extended.js',
  '/quote-migration.js',

  // Feature JS
  '/client-database.js',
  '/quote-workflow.js',
  '/import-export.js',
  '/invoice.js',
  '/theme.js',
  '/theme-customizer.js',
  '/analytics.js',
  '/analytics-engine.js',
  '/analytics-config.js',
  '/analytics-dashboard.js',
  '/charts.js',
  '/photos.js',
  '/photo-modal.js',
  '/image-compression.js',
  '/shortcuts.js',
  '/export.js',
  '/templates.js',

  // Mobile & Business Intelligence
  '/quick-add-ui.js',
  '/custom-window-calculator.js',
  '/travel-calculator.js',
  '/profitability-analyzer.js',
  '/job-presets.js',

  // PDF Generation
  '/pdf-config.js',
  '/pdf-components.js',
  '/quote-pdf.js',
  '/quote-pdf-ui.js',

  // Task Management
  '/task-manager.js',
  '/task-dashboard-ui.js',

  // GoHighLevel Integration
  '/ghl-webhook-setup.js',
  '/ghl-task-sync.js',
  '/webhook-processor.js',
  '/webhook-settings.js',
  '/webhook-debug.js',
  '/followup-automation.js',
  '/followup-config.js',

  // Production Tools
  '/deployment-helper.js',
  '/health-check.js',
  '/bug-tracker.js',
  '/backup-manager.js',

  // Lazy Loading
  '/lazy-loader.js',
  '/lazy-loader-init.js',

  // Performance
  '/performance-monitor.js',
  '/performance-utils.js',

  // PWA
  '/manifest.json',
  '/favicon.png',
  '/icon.svg',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png'
];

// SECURITY: Allowed path patterns for dynamic caching
var ALLOWED_PATHS = [
  /^\/$/,
  /^\/index\.html$/,
  /^\/.*\.js$/,
  /^\/.*\.css$/,
  /^\/.*\.png$/,
  /^\/.*\.svg$/,
  /^\/.*\.json$/
];

/**
 * SECURITY: Validate if a URL is safe to cache
 * Prevents cache poisoning attacks by only caching same-origin resources
 */
function isSafeToCacheUrl(url) {
  try {
    var urlObj = new URL(url);

    // SECURITY CHECK 1: Must be same origin
    if (urlObj.origin !== location.origin) {
      console.warn('[SW Security] Blocked cross-origin cache:', url);
      return false;
    }

    // SECURITY CHECK 2: Must match allowed path patterns
    var pathname = urlObj.pathname;
    var isAllowed = ALLOWED_PATHS.some(function(pattern) {
      return pattern.test(pathname);
    });

    if (!isAllowed) {
      console.warn('[SW Security] Blocked unauthorized path:', pathname);
      return false;
    }

    return true;
  } catch (e) {
    console.error('[SW Security] Invalid URL:', url, e);
    return false;
  }
}

// Install event - cache files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
// SECURITY HARDENED
self.addEventListener('fetch', function(event) {
  var requestUrl = event.request.url;

  // SECURITY: Only intercept same-origin requests
  try {
    var url = new URL(requestUrl);

    // Let browser handle external requests (CDNs, APIs, etc.)
    if (url.origin !== location.origin) {
      return; // Don't intercept, use default browser fetch
    }
  } catch (e) {
    console.error('[SW Security] Invalid request URL:', requestUrl);
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(function(response) {
          // SECURITY: Validate response before caching
          if (!response) {
            return response;
          }

          // SECURITY CHECK 1: Only cache successful responses
          if (response.status !== 200) {
            console.warn('[SW Security] Not caching non-200 response:', requestUrl, response.status);
            return response;
          }

          // SECURITY CHECK 2: Only cache basic or cors responses
          if (response.type !== 'basic' && response.type !== 'cors') {
            console.warn('[SW Security] Not caching response type:', response.type);
            return response;
          }

          // SECURITY CHECK 3: Validate URL is safe to cache
          if (!isSafeToCacheUrl(requestUrl)) {
            return response;
          }

          // Clone and cache the response
          var responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            })
            .catch(function(error) {
              console.error('[SW] Cache put failed:', error);
            });

          return response;
        }).catch(function(error) {
          console.log('[SW] Fetch failed, serving offline fallback', error);
          // Return cached index.html as offline fallback
          return caches.match('/index.html');
        });
      })
  );
});

// Activate event - clean up old caches
// SECURITY: Force update to take control immediately
self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      // SECURITY: Take control of all pages immediately
      // Ensures new security updates apply without waiting
      return self.clients.claim();
    })
  );
});

// SECURITY: Message handler for manual cache clearing
self.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('[SW] Manually clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded - Version ' + CACHE_VERSION);
