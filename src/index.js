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