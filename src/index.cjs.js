/**
 * SmartOffline SDK (CommonJS version)
 */
function init(config = {}) {
  if (typeof navigator === 'undefined' || !("serviceWorker" in navigator)) {
    console.warn("Service Workers not supported");
    return;
  }

  const sdkConfig = {
    pages: config.pages || [],
    apis: config.apis || [],
    debug: config.debug || false,
    frequencyThreshold: config.frequencyThreshold ?? 3,
    recencyThreshold: config.recencyThreshold ?? 24 * 60 * 60 * 1000,
    maxResourceSize: config.maxResourceSize ?? Infinity,
    networkQuality: config.networkQuality ?? "auto",
    significance: config.significance ?? {},
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
          console.log("[SmartOffline] Config sent after controllerchange:", sdkConfig);
        }
      }
    });
  });
}

const SmartOffline = { init };

module.exports = { SmartOffline };
module.exports.default = SmartOffline;
