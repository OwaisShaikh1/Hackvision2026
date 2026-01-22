const CACHE_NAME = "smart-offline-cache-v1";

/**
 * SDK configuration received from SmartOffline.init()
 * Includes priority tuning knobs.
 */
let SDK_CONFIG = {
  pages: [],
  apis: [],
  debug: false,

  // Priority tuning defaults
  frequencyThreshold: 3,
  recencyThreshold: 24 * 60 * 60 * 1000, // 24h
  maxResourceSize: Infinity,
  networkQuality: "auto", // 'auto' | 'fast' | 'slow'
  significance: {}, // { urlPattern: 'high' | 'normal' | 'low' }
};

/**
 * Receive config from SDK
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "INIT_CONFIG") {
    SDK_CONFIG = event.data.payload;

    if (SDK_CONFIG.debug) {
      console.log("[SmartOffline] Config received:", SDK_CONFIG);
    }
  }
});

/**
 * -------- Usage Tracking (IndexedDB) --------
 * Tracks frequency + recency per URL
 */
function trackUsage(url) {
  const request = indexedDB.open("smart-offline-usage", 1);

  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains("usage")) {
      db.createObjectStore("usage", { keyPath: "url" });
    }
  };

  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction("usage", "readwrite");
    const store = tx.objectStore("usage");

    const getReq = store.get(url);
    getReq.onsuccess = () => {
      const data = getReq.result || {
        url,
        count: 0,
        lastAccessed: 0,
      };

      data.count += 1;
      data.lastAccessed = Date.now();
      store.put(data);
    };
  };
}

/**
 * Read usage info
 */
function getUsage(url) {
  return new Promise((resolve) => {
    const request = indexedDB.open("smart-offline-usage", 1);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("usage", "readonly");
      const store = tx.objectStore("usage");

      const getReq = store.get(url);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => resolve(null);
    };

    request.onerror = () => resolve(null);
  });
}

/**
 * Decide priority based on real usage and developer-tuned config
 */
function isHighPriority(usage, url) {
  // Manual significance override
  for (const pattern in SDK_CONFIG.significance) {
    if (url.includes(pattern)) {
      const sig = SDK_CONFIG.significance[pattern];
      if (SDK_CONFIG.debug) {
        console.log(`[SDK Cache Decision] URL: ${url}`);
        console.log(`  ├─ Matched pattern: "${pattern}"`);
        console.log(`  ├─ Significance: ${sig}`);
        console.log(`  └─ Decision: ${sig === 'high' ? '✅ HIGH PRIORITY (cache immediately)' : sig === 'low' ? '❌ LOW PRIORITY (skip caching)' : '⚠️ NORMAL PRIORITY (analyze usage)'}`);
      }
      if (sig === "high") return true;
      if (sig === "low") return false;
      // 'normal' falls through to dynamic logic
    }
  }

  if (!usage) {
    if (SDK_CONFIG.debug) {
      console.log(`[SDK Cache Decision] URL: ${url}`);
      console.log(`  ├─ No usage data yet (first access)`);
      console.log(`  └─ Decision: ❌ Don't cache (waiting for frequency analysis)`);
    }
    return false;
  }

  const frequent = usage.count >= SDK_CONFIG.frequencyThreshold;
  const recent = Date.now() - usage.lastAccessed <= SDK_CONFIG.recencyThreshold;
  const recencyMinutes = Math.round((Date.now() - usage.lastAccessed) / 60000);

  if (SDK_CONFIG.debug) {
    console.log(`[SDK Cache Decision] URL: ${url}`);
    console.log(`  ├─ Access count: ${usage.count} (threshold: ${SDK_CONFIG.frequencyThreshold})`);
    console.log(`  ├─ Last accessed: ${recencyMinutes} min ago (threshold: ${SDK_CONFIG.recencyThreshold / 60000} min)`);
    console.log(`  ├─ Frequent enough? ${frequent ? '✅ YES' : '❌ NO'}`);
    console.log(`  ├─ Recent enough? ${recent ? '✅ YES' : '❌ NO'}`);
    console.log(`  └─ Decision: ${(frequent || recent) ? '✅ HIGH PRIORITY (cache it!)' : '❌ LOW PRIORITY (skip caching)'}`);
  }

  return frequent || recent;
}

/**
 * Detect effective network quality (uses Navigator.connection if available)
 */
function getEffectiveNetworkQuality() {
  if (SDK_CONFIG.networkQuality !== "auto") {
    return SDK_CONFIG.networkQuality; // developer override
  }
  // Use Network Information API if available
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    const dominated = ["slow-2g", "2g", "3g"];
    if (dominated.includes(conn.effectiveType)) return "slow";
  }
  return "fast";
}

/**
 * Install event
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});

/**
 * Activate event
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        )
      ),
    ])
  );
});

/**
 * Fetch event — SMART + PRIORITY logic
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const isPage = SDK_CONFIG.pages.some((p) =>
    request.url.includes(p)
  );
  const isAPI = SDK_CONFIG.apis.some((a) =>
    request.url.includes(a)
  );

  if (!isPage && !isAPI) return;

  if (SDK_CONFIG.debug) {
    console.log(`[SDK Intercept] 🌐 ${request.url}`);
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        // Network success
        trackUsage(request.url);

        // Check resource size limit
        const contentLength = response.headers.get("content-length");
        const size = contentLength ? parseInt(contentLength, 10) : 0;
        if (size > SDK_CONFIG.maxResourceSize) {
          if (SDK_CONFIG.debug) {
            console.log(`[SDK Cache Decision] ❌ REJECTED: ${request.url}`);
            console.log(`  └─ Reason: Size ${size} bytes > max ${SDK_CONFIG.maxResourceSize} bytes`);
          }
          return response;
        }

        // Analyze whether we should cache this request
        const usage = await getUsage(request.url);
        const shouldCache = isHighPriority(usage, request.url);
        
        // Network quality aware caching
        const netQuality = getEffectiveNetworkQuality();
        if (netQuality === "slow" && !shouldCache) {
          if (SDK_CONFIG.debug) {
            console.log(`[SDK Cache Decision] ❌ REJECTED: ${request.url}`);
            console.log(`  └─ Reason: Slow network + resource doesn't meet cache criteria`);
          }
          return response;
        }

        // Only cache if it meets frequency/recency/priority criteria
        if (shouldCache) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request.url, clone);
            
            if (SDK_CONFIG.debug) {
              console.log(`[SDK Cache] ✅ Stored in cache: ${request.url}`);
              console.log(`  └─ Type: ${isAPI ? "API" : "PAGE"}`);
            }
          });
        } else if (SDK_CONFIG.debug) {
          console.log(`[SDK Cache] ⏭️ Not caching yet: ${request.url}`);
          console.log(`  └─ Waiting for frequency/recency threshold`);
        }

        return response;
      } catch (error) {
        // Offline / network failure
        trackUsage(request.url);

        return getUsage(request.url).then((usage) => {
          const highPriority = isHighPriority(usage, request.url);

          if (SDK_CONFIG.debug) {
            console.log(`[SDK Offline Mode] 🔌 Network failed for: ${request.url}`);
            console.log(`  └─ Attempting to serve from cache...`);
          }

          // Try to serve from cache
          return caches.match(request.url).then(cachedResponse => {
            if (cachedResponse) {
              if (SDK_CONFIG.debug) {
                console.log(`[SDK Offline Mode] ✅ Served from cache: ${request.url}`);
              }
              return cachedResponse;
            } else {
              if (SDK_CONFIG.debug) {
                console.log(`[SDK Offline Mode] ❌ Not in cache: ${request.url}`);
              }
              // Return a proper error response instead of undefined
              return new Response(
                JSON.stringify({ error: 'Offline and not cached' }),
                { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
              );
            }
          });
        });
      }
    })()
  );
});
