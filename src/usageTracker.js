const DB_NAME = "smart-offline-usage";
const STORE_NAME = "usage";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "url" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function trackUsage(url) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  const existing = await new Promise(resolve => {
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  const data = existing || { url, count: 0, lastAccessed: 0 };
  data.count += 1;
  data.lastAccessed = Date.now();

  store.put(data);
}
