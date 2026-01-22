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
      if (sig === "high") return true;
      if (sig === "low") return false;
      // 'normal' falls through to dynamic logic
    }
  }

  if (!usage) return false;

  const frequent = usage.count >= SDK_CONFIG.frequencyThreshold;
  const recent = Date.now() - usage.lastAccessed <= SDK_CONFIG.recencyThreshold;

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
    console.log("[SW] Intercepted:", request.url);
  }

  event.respondWith(
    fetch(request)
      .then(async (response) => {
        // Network success
        trackUsage(request.url);

        // Check resource size limit
        const contentLength = response.headers.get("content-length");
        const size = contentLength ? parseInt(contentLength, 10) : 0;
        if (size > SDK_CONFIG.maxResourceSize) {
          if (SDK_CONFIG.debug) {
            console.log(
              `[SmartOffline] Skipped caching (size ${size} > ${SDK_CONFIG.maxResourceSize}):`,
              request.url
            );
          }
          return response;
        }

        // Network quality aware caching
        const netQuality = getEffectiveNetworkQuality();
        if (netQuality === "slow" && !isHighPriority(null, request.url)) {
          // On slow network, skip caching low priority resources proactively
          if (SDK_CONFIG.debug) {
            console.log(
              `[SmartOffline] Skipped caching (slow network, not high priority):`,
              request.url
            );
          }
          return response;
        }

        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request.url, clone);
        });

        if (SDK_CONFIG.debug) {
          console.log(
            `[SmartOffline] Cached ${isAPI ? "API" : "PAGE"}:`,
            request.url
          );
        }

        return response;
      })
      .catch(() => {
        // Offline / network failure
        trackUsage(request.url);

        return getUsage(request.url).then((usage) => {
          const highPriority = isHighPriority(usage, request.url);

          if (SDK_CONFIG.debug) {
            console.log(
              `[SmartOffline] ${
                highPriority ? "HIGH" : "NORMAL"
              } priority:`,
              request.url
            );
          }

          // v1 behavior: both return cache, but priority is decided & logged
          return caches.match(request.url);
        });
      })
  );
});
