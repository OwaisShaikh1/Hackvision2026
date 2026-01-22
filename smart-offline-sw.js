const CACHE_NAME = "smart-offline-cache-v1";

/**
 * SDK configuration received from SmartOffline.init()
 */
let SDK_CONFIG = {
  pages: [],
  apis: [],
  debug: false,
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
 * Install event
 */
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 🔥 REQUIRED
  event.waitUntil(caches.open(CACHE_NAME));
});

/**
 * Activate event
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // 🔥 REQUIRED
      caches.keys().then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          }),
        ),
      ),
    ]),
  );
});


/**
 * Fetch event – SMART logic
 */
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  console.log("[SW] Intercepted:", request.url);

  const isPage = SDK_CONFIG.pages.some((p) =>
    request.url.includes(p)
  );

  const isAPI = SDK_CONFIG.apis.some((a) =>
    request.url.includes(a)
  );

  if (!isPage && !isAPI) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        const cacheKey = request.url;

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(cacheKey, clone);
        });

        if (SDK_CONFIG.debug) {
          console.log(
            `[SmartOffline] Cached ${isAPI ? "API" : "PAGE"}:`,
            cacheKey
          );
        }

        return response;
      })
      .catch(() => {
        if (SDK_CONFIG.debug) {
          console.log(
            `[SmartOffline] Served from cache ${isAPI ? "API" : "PAGE"}:`,
            request.url
          );
        }
        return caches.match(request.url);
      }),
  );
});

