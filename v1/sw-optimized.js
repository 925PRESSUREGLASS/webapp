// sw-optimized.js - Optimized Service Worker for TicTacStick
// Features: Versioning, selective caching, stale-while-revalidate, cache limits
// iOS Safari compatible - no ES6+ features

// ===================================
// CONFIGURATION
// ===================================

// VERSION - Increment to force cache update
var VERSION = 'v2.0.0';
var CACHE_NAME = 'tictacstick-' + VERSION;

// Cache names for different strategies
var CACHE_STATIC = CACHE_NAME + '-static';      // Core app files (never change)
var CACHE_DYNAMIC = CACHE_NAME + '-dynamic';    // User-loaded modules
var CACHE_IMAGES = CACHE_NAME + '-images';      // Photos, icons
var CACHE_RUNTIME = CACHE_NAME + '-runtime';    // API calls, external resources

var ALL_CACHES = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES, CACHE_RUNTIME];

// Cache size limits (number of entries)
var CACHE_LIMITS = {
  images: 50,        // Max 50 images
  runtime: 100,      // Max 100 runtime requests
  dynamic: 30        // Max 30 dynamic modules
};

// ===================================
// STATIC ASSETS (Pre-cache)
// ===================================

// Critical files needed for offline functionality
var STATIC_ASSETS = [
  // Core HTML/CSS
  '/',
  '/index.html',
  '/app.css',
  '/toast.css',
  '/loading.css',
  '/theme-light.css',

  // Critical JavaScript (bootstrap, core modules)
  '/bootstrap.js',
  '/debug.js',
  '/data.js',
  '/storage.js',
  '/calc.js',
  '/app.js',
  '/ui.js',
  '/wizard.js',

  // Essential utilities
  '/error-handler.js',
  '/accessibility.js',
  '/theme.js',

  // Manifest and icons
  '/manifest.json',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Dynamic modules (loaded on-demand, not pre-cached)
var DYNAMIC_MODULES = [
  '/analytics.js',
  '/charts.js',
  '/invoice.js',
  '/import-export.js',
  '/export.js',
  '/photo-modal.js',
  '/templates.js',
  '/client-database.js',
  '/quote-workflow.js',
  '/photos.js'
];

// ===================================
// INSTALL EVENT
// ===================================

self.addEventListener('install', function(event) {
  console.log('[SW] Installing version:', VERSION);

  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(function(cache) {
        console.log('[SW] Caching static assets');

        // Cache static assets one by one to avoid failure
        return Promise.all(
          STATIC_ASSETS.map(function(url) {
            return cache.add(url).catch(function(error) {
              console.error('[SW] Failed to cache:', url, error);
              // Don't fail the whole install if one asset fails
              return Promise.resolve();
            });
          })
        );
      })
      .then(function() {
        console.log('[SW] Static assets cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.error('[SW] Install failed:', error);
      })
  );
});

// ===================================
// ACTIVATE EVENT
// ===================================

self.addEventListener('activate', function(event) {
  console.log('[SW] Activating version:', VERSION);

  event.waitUntil(
    // Clean up old caches
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            // Delete caches from old versions
            if (cacheName.indexOf('tictacstick-') === 0 && ALL_CACHES.indexOf(cacheName) === -1) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(function() {
        console.log('[SW] Old caches cleaned up');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// ===================================
// FETCH EVENT - ROUTING STRATEGY
// ===================================

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Route to appropriate strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
  } else if (isDynamicModule(url)) {
    event.respondWith(cacheFirst(request, CACHE_DYNAMIC));
  } else if (isImage(url)) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
  } else if (isExternalResource(url)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_RUNTIME));
  } else {
    event.respondWith(networkFirst(request, CACHE_RUNTIME));
  }
});

// ===================================
// CACHING STRATEGIES
// ===================================

/**
 * Cache First - Best for static assets that rarely change
 * 1. Check cache
 * 2. Return from cache if found
 * 3. Fetch from network if not in cache
 * 4. Cache the network response
 */
function cacheFirst(request, cacheName) {
  return caches.open(cacheName)
    .then(function(cache) {
      return cache.match(request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Not in cache, fetch from network
          return fetch(request)
            .then(function(networkResponse) {
              // Cache successful responses
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(function(error) {
              console.error('[SW] Cache-first fetch failed:', request.url, error);

              // Return offline page for navigation requests
              if (request.mode === 'navigate') {
                return cache.match('/index.html');
              }

              throw error;
            });
        });
    });
}

/**
 * Network First - Best for dynamic data
 * 1. Try network first
 * 2. Cache the response
 * 3. Fall back to cache if network fails
 */
function networkFirst(request, cacheName) {
  return caches.open(cacheName)
    .then(function(cache) {
      return fetch(request)
        .then(function(networkResponse) {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(function(error) {
          console.log('[SW] Network failed, trying cache:', request.url);

          // Network failed, try cache
          return cache.match(request)
            .then(function(cachedResponse) {
              if (cachedResponse) {
                return cachedResponse;
              }

              // No cache, return offline page for navigation
              if (request.mode === 'navigate') {
                return cache.match('/index.html');
              }

              throw error;
            });
        });
    });
}

/**
 * Stale While Revalidate - Best for external resources
 * 1. Return cached version immediately
 * 2. Fetch fresh version in background
 * 3. Update cache with fresh version
 */
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName)
    .then(function(cache) {
      return cache.match(request)
        .then(function(cachedResponse) {
          // Fetch fresh version in background
          var fetchPromise = fetch(request)
            .then(function(networkResponse) {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(function(error) {
              console.log('[SW] Background fetch failed:', request.url);
              return null;
            });

          // Return cached version immediately, or wait for network
          return cachedResponse || fetchPromise;
        });
    });
}

// ===================================
// URL CLASSIFICATION
// ===================================

function isStaticAsset(url) {
  var pathname = url.pathname;

  // Check if in static assets list
  for (var i = 0; i < STATIC_ASSETS.length; i++) {
    if (pathname === STATIC_ASSETS[i] || pathname === STATIC_ASSETS[i] + '/') {
      return true;
    }
  }

  // Check file extensions
  var staticExtensions = ['.css', '.html', '.json'];
  for (var j = 0; j < staticExtensions.length; j++) {
    if (pathname.endsWith(staticExtensions[j])) {
      return true;
    }
  }

  return false;
}

function isDynamicModule(url) {
  var pathname = url.pathname;

  for (var i = 0; i < DYNAMIC_MODULES.length; i++) {
    if (pathname === DYNAMIC_MODULES[i]) {
      return true;
    }
  }

  return false;
}

function isImage(url) {
  var pathname = url.pathname;
  var imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

  for (var i = 0; i < imageExtensions.length; i++) {
    if (pathname.endsWith(imageExtensions[i])) {
      return true;
    }
  }

  return false;
}

function isExternalResource(url) {
  // External CDN resources (Chart.js, etc.)
  return url.origin !== self.location.origin;
}

// ===================================
// CACHE MANAGEMENT
// ===================================

/**
 * Limit cache size by removing oldest entries
 */
function limitCacheSize(cacheName, maxItems) {
  return caches.open(cacheName)
    .then(function(cache) {
      return cache.keys()
        .then(function(keys) {
          if (keys.length > maxItems) {
            var toDelete = keys.length - maxItems;
            console.log('[SW] Trimming cache', cacheName, '- removing', toDelete, 'items');

            // Delete oldest items (first in array)
            var deletePromises = [];
            for (var i = 0; i < toDelete; i++) {
              deletePromises.push(cache.delete(keys[i]));
            }

            return Promise.all(deletePromises);
          }
        });
    });
}

// Periodically clean up caches
self.addEventListener('message', function(event) {
  if (event.data && event.data.action === 'trimCaches') {
    console.log('[SW] Trimming caches on request');

    Promise.all([
      limitCacheSize(CACHE_IMAGES, CACHE_LIMITS.images),
      limitCacheSize(CACHE_RUNTIME, CACHE_LIMITS.runtime),
      limitCacheSize(CACHE_DYNAMIC, CACHE_LIMITS.dynamic)
    ]).then(function() {
      console.log('[SW] Cache trimming complete');
    });
  }

  // Clear all caches (for debugging)
  if (event.data && event.data.action === 'clearCaches') {
    console.log('[SW] Clearing all caches');

    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      })
      .then(function() {
        console.log('[SW] All caches cleared');
      });
  }

  // Get cache statistics
  if (event.data && event.data.action === 'getCacheStats') {
    getCacheStats().then(function(stats) {
      event.ports[0].postMessage(stats);
    });
  }
});

/**
 * Get statistics about current caches
 */
function getCacheStats() {
  return caches.keys()
    .then(function(cacheNames) {
      var promises = cacheNames.map(function(cacheName) {
        return caches.open(cacheName)
          .then(function(cache) {
            return cache.keys()
              .then(function(keys) {
                return {
                  name: cacheName,
                  count: keys.length
                };
              });
          });
      });

      return Promise.all(promises);
    })
    .then(function(stats) {
      return {
        version: VERSION,
        caches: stats,
        timestamp: Date.now()
      };
    });
}

// ===================================
// BACKGROUND SYNC (if supported)
// ===================================

// Handle background sync for offline quote saves
if (self.registration.sync) {
  self.addEventListener('sync', function(event) {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-quotes') {
      event.waitUntil(syncQuotes());
    }
  });
}

function syncQuotes() {
  // Future: sync quotes to backend when online
  console.log('[SW] Syncing quotes (placeholder for future backend integration)');
  return Promise.resolve();
}

// ===================================
// PERIODIC BACKGROUND SYNC (if supported)
// ===================================

// Automatically clean up caches periodically
if (self.registration.periodicSync) {
  self.addEventListener('periodicsync', function(event) {
    if (event.tag === 'cache-cleanup') {
      event.waitUntil(
        Promise.all([
          limitCacheSize(CACHE_IMAGES, CACHE_LIMITS.images),
          limitCacheSize(CACHE_RUNTIME, CACHE_LIMITS.runtime),
          limitCacheSize(CACHE_DYNAMIC, CACHE_LIMITS.dynamic)
        ])
      );
    }
  });
}

console.log('[SW] Service Worker script loaded, version:', VERSION);

// ===================================
// USAGE FROM MAIN APP
// ===================================

/*

// In index.html or app.js:

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw-optimized.js')
      .then(function(registration) {
        console.log('ServiceWorker registered:', registration.scope);

        // Trim caches on startup
        setTimeout(function() {
          registration.active.postMessage({ action: 'trimCaches' });
        }, 5000);

        // Optional: Register periodic cache cleanup (if supported)
        if (registration.periodicSync) {
          registration.periodicSync.register('cache-cleanup', {
            minInterval: 24 * 60 * 60 * 1000 // Once per day
          }).catch(function(error) {
            console.log('Periodic sync not available:', error);
          });
        }

        // Listen for updates
        registration.addEventListener('updatefound', function() {
          var newWorker = registration.installing;

          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('New version available! Refresh to update.');

              // Optionally show update notification
              if (window.showInfo) {
                window.showInfo('New version available! Refresh to update.');
              }
            }
          });
        });
      })
      .catch(function(error) {
        console.log('ServiceWorker registration failed:', error);
      });
  });

  // Get cache statistics
  function getCacheInfo() {
    if (navigator.serviceWorker.controller) {
      var messageChannel = new MessageChannel();

      messageChannel.port1.onmessage = function(event) {
        console.log('Cache stats:', event.data);
        console.table(event.data.caches);
      };

      navigator.serviceWorker.controller.postMessage(
        { action: 'getCacheStats' },
        [messageChannel.port2]
      );
    }
  }

  // Clear all caches (for debugging)
  function clearAllCaches() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ action: 'clearCaches' });
    }
  }
}

*/
