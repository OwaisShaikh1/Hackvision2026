/**
 * SmartOffline SDK
 *
 * Priority config options:
 * - frequencyThreshold: number of accesses before resource is considered "frequent" (default 3)
 * - recencyThreshold: milliseconds within which resource is considered "recent" (default 24h)
 * - maxResourceSize: max bytes to cache per resource; larger resources skipped (default Infinity)
 * - networkQuality: 'auto' | 'fast' | 'slow' — affects caching aggressiveness (default 'auto')
 * - significance: { [urlPattern]: 'high' | 'normal' | 'low' } — manual priority overrides
 */
function init(config = {}) {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers not supported");
    return;
  }

  const sdkConfig = {
    pages: config.pages || [],
    apis: config.apis || [],
    debug: config.debug || false,

    // Priority tuning
    frequencyThreshold: config.frequencyThreshold ?? 3,
    recencyThreshold: config.recencyThreshold ?? 24 * 60 * 60 * 1000, // 24h default
    maxResourceSize: config.maxResourceSize ?? Infinity,
    networkQuality: config.networkQuality ?? "auto", // 'auto' | 'fast' | 'slow'
    significance: config.significance ?? {}, // { urlPattern: 'high' | 'normal' | 'low' }
  };

  navigator.serviceWorker.register("/smart-offline-sw.js").then((registration) => {
    console.log("Smart Offline Service Worker registered");

    // Wait for SW to be ready before sending config
    navigator.serviceWorker.ready.then(() => {
      // Send config to active service worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "INIT_CONFIG",
          payload: sdkConfig,
        });

        if (sdkConfig.debug) {
          console.log("[SmartOffline] Config sent to SW:", sdkConfig);
        }
      }
    });

    // Handle new SW taking control (on first install)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "INIT_CONFIG",
          payload: sdkConfig,
        });

        if (sdkConfig.debug) {
          console.log("[SmartOffline] Config sent after controllerchange:", sdkConfig);
        }
      }
    });
  });
}

export const SmartOffline = { init };