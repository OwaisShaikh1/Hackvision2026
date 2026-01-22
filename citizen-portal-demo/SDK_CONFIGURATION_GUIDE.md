# SDK Configuration Guide

## ✅ Yes, Your SDK is NOW Being Used!

After the refactor, your application now **properly uses the SDK**:
- ✅ Service Worker intercepts all `fetch()` calls
- ✅ SDK analyzes access patterns automatically
- ✅ Smart caching decisions based on frequency/recency
- ✅ Priority system working (high/normal/low)

## 🔍 Viewing Cache Decision Logs

### Where to See the Logs

**Open Browser DevTools Console (F12)**

You'll see detailed logs like:

```
[SDK Intercept] 🌐 https://jsonplaceholder.typicode.com/users/1

[SDK Cache Decision] URL: https://jsonplaceholder.typicode.com/users/1
  ├─ Matched pattern: "/users/1"
  ├─ Significance: high
  └─ Decision: ✅ HIGH PRIORITY (cache immediately)

[SDK Cache] ✅ Stored in cache: https://jsonplaceholder.typicode.com/users/1
  └─ Type: API
```

### Types of Logs You'll See

#### 1. **Intercept Logs** (Every request)
```
[SDK Intercept] 🌐 https://jsonplaceholder.typicode.com/users
```

#### 2. **Cache Decision Logs** (When SDK decides)
```
[SDK Cache Decision] URL: https://jsonplaceholder.typicode.com/users
  ├─ Access count: 2 (threshold: 2)
  ├─ Last accessed: 1 min ago (threshold: 30 min)
  ├─ Frequent enough? ✅ YES
  ├─ Recent enough? ✅ YES
  └─ Decision: ✅ HIGH PRIORITY (cache it!)
```

#### 3. **Cache Storage Logs** (When data is cached)
```
[SDK Cache] ✅ Stored in cache: https://jsonplaceholder.typicode.com/users
  └─ Type: API
```

#### 4. **Rejection Logs** (When SDK decides NOT to cache)
```
[SDK Cache Decision] ❌ REJECTED: https://jsonplaceholder.typicode.com/posts?_start=42
  └─ Reason: Size 52480 bytes > max 1048576 bytes
```

OR

```
[SDK Cache Decision] URL: https://jsonplaceholder.typicode.com/posts
  ├─ Matched pattern: "/posts"
  ├─ Significance: low
  └─ Decision: ❌ LOW PRIORITY (skip caching)
```

#### 5. **Offline Mode Logs** (When network fails)
```
[SDK Offline Mode] 🔌 Network failed for: https://jsonplaceholder.typicode.com/users/1
  └─ Attempting to serve from cache...
[SDK Offline Mode] ✅ Served from cache: https://jsonplaceholder.typicode.com/users/1
```

## ⚙️ Where to Adjust Variables

### Configuration Location: `src/main.jsx`

```javascript
SmartOffline.init({
  // 📍 ADJUST THESE VARIABLES:
  
  debug: true,              // ⬅️ Set to true to see logs
  
  frequencyThreshold: 2,    // ⬅️ Cache after N accesses
                            //    Lower = cache sooner
                            //    Higher = wait for more accesses
  
  recencyThreshold: 30 * 60 * 1000,  // ⬅️ Time window (milliseconds)
                                      //    30 min = 30 * 60 * 1000
                                      //    1 hour = 60 * 60 * 1000
                                      //    24 hours = 24 * 60 * 60 * 1000
  
  maxResourceSize: 1024 * 1024,  // ⬅️ Max file size to cache (bytes)
                                  //    1 MB = 1024 * 1024
                                  //    5 MB = 5 * 1024 * 1024
  
  networkQuality: 'auto',    // ⬅️ 'auto' | 'fast' | 'slow'
                             //    'auto' = detect automatically
                             //    'slow' = skip low priority on slow networks
  
  significance: {            // ⬅️ Priority overrides
    '/users/1': 'high',      // Cache immediately (bypass frequency check)
    '/users': 'normal',      // Use frequency/recency analysis
    '/posts': 'low'          // Never cache (or cache very rarely)
  },
  
  apis: [                    // ⬅️ Which API endpoints to monitor
    '/users',
    '/posts',
    '/users/1',
    '/users/1/albums',
    // Add more endpoints here
  ],
  
  pages: [                   // ⬅️ Which page routes to cache
    '/dashboard',
    '/services',
    '/benefits',
    // Add more routes here
  ]
});
```

## 📊 Configuration Examples

### Example 1: Aggressive Caching (Cache everything quickly)
```javascript
SmartOffline.init({
  debug: true,
  frequencyThreshold: 1,        // Cache after just 1 access!
  recencyThreshold: 60 * 60 * 1000,  // Keep in cache for 1 hour
  maxResourceSize: 10 * 1024 * 1024, // Allow up to 10MB files
  significance: {
    '/users': 'high',          // Everything is high priority
    '/posts': 'high',
    '/albums': 'high'
  }
});
```

### Example 2: Conservative Caching (Only cache frequently used)
```javascript
SmartOffline.init({
  debug: true,
  frequencyThreshold: 5,        // Cache only after 5 accesses
  recencyThreshold: 10 * 60 * 1000,  // Short window: 10 minutes
  maxResourceSize: 500 * 1024,   // Only small files: 500KB
  significance: {
    '/users/1': 'high',        // Only user profile is high priority
    '/posts': 'low',           // Everything else is low priority
    '/albums': 'low'
  }
});
```

### Example 3: Real-time Data (Minimal caching)
```javascript
SmartOffline.init({
  debug: true,
  frequencyThreshold: 10,       // Requires many accesses
  recencyThreshold: 5 * 60 * 1000,   // Very short window: 5 minutes
  significance: {
    '/news': 'low',            // Real-time content: don't cache
    '/weather': 'low',         // Fresh data: don't cache
    '/users/1': 'normal'       // Only static user data gets cached
  }
});
```

## 🧪 Testing Configuration Changes

### Step 1: Modify `src/main.jsx`
Change any configuration value (e.g., `frequencyThreshold: 1`)

### Step 2: Restart Dev Server
```bash
Ctrl+C  (stop current server)
npm run dev  (restart)
```

### Step 3: Clear Cache & Service Worker
In browser DevTools:
1. **Application → Service Workers** → Click "Unregister"
2. **Application → Clear storage** → Click "Clear site data"
3. **Refresh page** (Ctrl+Shift+R)

### Step 4: Watch Console Logs
Navigate to pages and watch the SDK logs:
```
[SDK Cache Decision] URL: ...
  ├─ Access count: 1 (threshold: 1)  ⬅️ Your new threshold!
  └─ Decision: ✅ HIGH PRIORITY (cache it!)
```

## 🎯 Recommended Settings by Use Case

### Government Portal (Your Case)
```javascript
{
  frequencyThreshold: 2,         // Cache after 2 visits
  recencyThreshold: 30 * 60 * 1000,  // 30 minutes
  significance: {
    '/users/1': 'high',          // User profile: cache immediately
    '/users/1/todos': 'normal',  // Applications: normal priority
    '/posts': 'low'              // News: real-time, don't cache
  }
}
```

### E-commerce Site
```javascript
{
  frequencyThreshold: 3,
  recencyThreshold: 60 * 60 * 1000,  // 1 hour
  significance: {
    '/products': 'high',         // Product catalog: always cache
    '/cart': 'low',              // Cart: real-time, don't cache
    '/orders': 'normal'          // Order history: normal priority
  }
}
```

### Social Media App
```javascript
{
  frequencyThreshold: 1,         // Cache quickly for fast UX
  recencyThreshold: 15 * 60 * 1000,  // 15 minutes
  significance: {
    '/profile': 'high',          // User profiles: high priority
    '/feed': 'low',              // Feed: real-time content
    '/messages': 'low'           // Messages: always fresh
  }
}
```

## 🛠️ Debug Commands

### In Browser Console

#### Check current configuration
```javascript
// View Service Worker config
navigator.serviceWorker.ready.then(reg => 
  reg.active.postMessage({ type: 'GET_CONFIG' })
);
```

#### View cached URLs
```javascript
caches.open('smart-offline-cache-v1').then(cache => 
  cache.keys().then(keys => 
    console.log('Cached URLs:', keys.map(k => k.url))
  )
);
```

#### Check usage tracking
```javascript
indexedDB.open('smart-offline-usage', 1).onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('usage', 'readonly');
  tx.objectStore('usage').getAll().onsuccess = (e) => {
    console.table(e.target.result);
  };
};
```

#### Clear everything and start fresh
```javascript
// Clear caches
caches.keys().then(names => 
  Promise.all(names.map(name => caches.delete(name)))
);

// Clear usage tracking
indexedDB.deleteDatabase('smart-offline-usage');

// Unregister Service Worker
navigator.serviceWorker.getRegistrations().then(regs => 
  Promise.all(regs.map(reg => reg.unregister()))
);
```

---

**Your SDK is now fully operational with detailed logging!** 🚀

Open DevTools Console and navigate through your app to see the cache decision logic in action.
