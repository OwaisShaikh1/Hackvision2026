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

    
  };

  navigator.serviceWorker.register("/smart-offline-sw.js").then(() => {
    console.log("Smart Offline Service Worker registered");

    navigator.serviceWorker.ready.then(() => {
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

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "INIT_CONFIG",
          payload: sdkConfig,
        });

        if (sdkConfig.debug) {
          console.log(
            "[SmartOffline] Config sent after controllerchange:",
            sdkConfig
          );
        }
      }
    });
  });
}

const SmartOffline = { init };

export { SmartOffline };       // ✅ named export
export default SmartOffline;  // ✅ default export