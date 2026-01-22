# 🎯 SDK Integration Guide - How @soham20/smart-offline-sdk Works

## ⚠️ CRITICAL UNDERSTANDING

The **Smart Offline SDK** works fundamentally differently than manual caching. Here's what you need to know:

### How It Actually Works

```
┌──────────────────────────────────────────────────────────────┐
│                     Your React Application                    │
│              (Fetches data normally with fetch())             │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         │ Every fetch() call goes through...
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               🔧 Service Worker (Interceptor)                 │
│         Running in background (separate thread)               │
│                                                               │
│  1. Intercepts ALL network requests                          │
│  2. Checks SDK configuration (which APIs to cache)           │
│  3. Makes caching decisions based on:                        │
│     - Frequency of access (frequencyThreshold)               │
│     - Recency of access (recencyThreshold)                   │
│     - Resource size (maxResourceSize)                        │
│     - Network quality (fast/slow/auto)                       │
│     - Manual priority (significance)                         │
│  4. Returns cached data OR fetches from network              │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                   Network / Cache Storage                     │
│  - CacheStorage API (not localStorage!)                      │
│  - Managed by Service Worker                                 │
│  - Persistent across page reloads                            │
└──────────────────────────────────────────────────────────────┘
```

## 🚨 Why Our Current Implementation is WRONG

### What We Did (INCORRECT):
```javascript
// api.js - Manual caching with localStorage
const cache = {
  get: (key) => {
    return localStorage.getItem(key); // ❌ Manual cache
  }
};

const apiRequest = async (endpoint) => {
  const cached = cache.get(endpoint);  // ❌ We decide
  if (cached) return cached.data;
  
  const response = await fetch(url);
  cache.set(endpoint, data);  // ❌ We cache manually
  return data;
};
```

**Problem:** We're bypassing the SDK completely! The SDK can't make smart decisions if we're caching manually.

### What We SHOULD Do (CORRECT):
```javascript
// api.js - Let SDK handle caching
export const fetchDashboardStats = async () => {
  // Just use fetch() - SDK intercepts automatically
  const response = await fetch('https://jsonplaceholder.typicode.com/users');
  const data = await response.json();
  return data;
};
```

**Why This Works:**
1. Service Worker intercepts the `fetch()` call
2. SDK checks if `/users` is in the configured `apis` list
3. SDK applies frequency/recency analysis
4. SDK decides to cache or not
5. You get the data (from cache or network)

---

## 📋 How the SDK Works - Step by Step

### Step 1: Initialization (main.jsx)

```javascript
import { SmartOffline } from '@soham20/smart-offline-sdk';

SmartOffline.init({
  pages: ['/dashboard', '/services', '/benefits', '/documents'],
  apis: [
    '/api/dashboard-stats',
    '/api/user-profile',
    '/api/benefits',
    '/api/applications'
  ],
  debug: true,
  frequencyThreshold: 2,  // Cache after 2 accesses
  recencyThreshold: 30 * 60 * 1000,  // 30 minutes
  maxResourceSize: 5 * 1024 * 1024,  // 5MB max
  networkQuality: 'auto',  // Auto-detect network speed
  significance: {
    '/api/user-profile': 'high',  // Force high priority
    '/api/real-time-news': 'low'  // Force low priority (don't cache)
  }
});
```

**What Happens:**
1. SDK registers Service Worker (`smart-offline-sw.js`)
2. Sends configuration to Service Worker
3. Service Worker starts intercepting fetch requests
4. Your app continues working normally

### Step 2: Service Worker Intercepts Requests

When your code does:
```javascript
const response = await fetch('https://jsonplaceholder.typicode.com/users');
```

The Service Worker:
1. **Sees** the fetch request before it goes to network
2. **Checks** if URL matches configured `apis` list
3. **Analyzes** access patterns (frequency, recency)
4. **Decides** whether to:
   - Return cached version (if available and fresh)
   - Fetch from network and cache result
   - Fetch from network without caching

### Step 3: Smart Caching Decisions

The SDK uses multiple factors:

#### Frequency Analysis
```javascript
frequencyThreshold: 2  // Cache after 2 accesses
```
- **First access**: Fetches from network, records access
- **Second access**: Fetches from network, records access
- **Third+ access**: NOW caches (reached threshold)

**Why?** Avoids caching one-time requests that waste space.

#### Recency Analysis
```javascript
recencyThreshold: 30 * 60 * 1000  // 30 minutes
```
- Tracks time between accesses
- If accessed within 30 min → "recent access" → cache it
- If > 30 min gap → "stale pattern" → don't cache

**Why?** Resources accessed close together are likely needed again soon.

#### Size Limits
```javascript
maxResourceSize: 5 * 1024 * 1024  // 5MB
```
- Measures response size
- If > 5MB → skip caching
- Prevents cache bloat

**Why?** Large files can fill up limited cache storage.

#### Network Quality
```javascript
networkQuality: 'auto'  // or 'fast' / 'slow'
```
- **auto**: Detects connection speed
- **fast**: Less aggressive caching
- **slow**: More aggressive caching

**Why?** On slow networks, cache more to reduce waiting.

#### Manual Overrides
```javascript
significance: {
  '/api/user-profile': 'high',  // Always cache
  '/api/weather': 'low'  // Never cache
}
```
- **high**: Cache immediately, keep fresh
- **normal**: Follow frequency/recency rules
- **low**: Don't cache even if frequent

---

## 🔧 Correct Implementation

### Updated api.js (SDK-Friendly)

```javascript
// No manual caching logic needed!
// SDK handles everything through Service Worker

const API_BASE = 'https://jsonplaceholder.typicode.com';

// Simple fetch wrapper with error handling
const apiRequest = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    throw error;
  }
};

// Dashboard API - SDK will cache based on frequency
export const fetchDashboardStats = async () => {
  const [users, posts] = await Promise.all([
    apiRequest('/users'),  // SDK intercepts
    apiRequest('/posts')   // SDK intercepts
  ]);
  
  return {
    totalServices: users.length * 15,
    activeApplications: Math.floor(posts.length / 10)
  };
};

// Profile API - SDK caches (marked as 'high' significance)
export const fetchUserProfile = async (userId = 1) => {
  const user = await apiRequest(`/users/${userId}`);
  return {
    id: `GOV-${String(user.id).padStart(8, '0')}`,
    name: user.name,
    email: user.email
  };
};

// Weather API - SDK won't cache (marked as 'low' significance)
export const fetchWeather = async () => {
  const response = await fetch('https://api.open-meteo.com/v1/forecast?...');
  return await response.json();
};
```

### How Caching Happens

```
User visits dashboard (1st time)
         ↓
fetchDashboardStats() called
         ↓
fetch('/users') → Service Worker intercepts
         ↓
Service Worker: "This is access #1 for /users"
         ↓
Service Worker: "frequencyThreshold = 2, not reached yet"
         ↓
Service Worker: "Fetch from network, don't cache"
         ↓
Network returns data → User sees dashboard

─────────────────────────────────────────

User visits dashboard (2nd time within 30min)
         ↓
fetch('/users') → Service Worker intercepts
         ↓
Service Worker: "This is access #2 for /users"
         ↓
Service Worker: "Threshold reached! Cache this."
         ↓
Network returns data → Service Worker caches → User sees dashboard

─────────────────────────────────────────

User visits dashboard (3rd time)
         ↓
fetch('/users') → Service Worker intercepts
         ↓
Service Worker: "I have cached version!"
         ↓
Service Worker: "Is it fresh? Check recency..."
         ↓
Service Worker: "Return cached data (instant!)"
         ↓
User sees dashboard immediately (< 10ms)
```

---

## 🎯 Priority System Explained

### How SDK Prioritizes

```javascript
SmartOffline.init({
  frequencyThreshold: 2,
  recencyThreshold: 30 * 60 * 1000,
  significance: {
    '/api/user-profile': 'high',
    '/api/dashboard-stats': 'normal',
    '/api/weather': 'low'
  }
});
```

#### High Priority (`high`)
- **Caches immediately** (ignores frequencyThreshold)
- **Keeps fresh** (periodic background updates)
- **Never evicts** (keeps even under storage pressure)
- **Use for**: User profiles, authentication, critical data

**Example:**
```javascript
// First access to /api/user-profile
Service Worker sees 'high' significance
→ Fetches from network
→ Caches immediately (no frequency check)
→ User sees data

// Second access
→ Returns cached instantly
→ Optionally fetches fresh copy in background
```

#### Normal Priority (`normal`)
- **Caches after threshold** (waits for frequencyThreshold)
- **Respects recency** (needs recent access pattern)
- **Standard eviction** (removed if not accessed)
- **Use for**: Regular app data, listings, content

**Example:**
```javascript
// First access to /api/dashboard-stats
Service Worker: Access #1, no cache yet

// Second access (within 30min)
Service Worker: Access #2, threshold reached, cache now

// Third access
Service Worker: Return cached data
```

#### Low Priority (`low`)
- **Never caches** (even if frequently accessed)
- **Always network** (live data only)
- **No storage used**
- **Use for**: Real-time data, weather, news feeds

**Example:**
```javascript
// Every access to /api/weather
Service Worker sees 'low' significance
→ Always fetch from network
→ Never cache
→ Return live data
```

---

## 📊 Real-World Example

### Scenario: User Profile Page

**Setup:**
```javascript
SmartOffline.init({
  apis: ['/api/user-profile'],
  frequencyThreshold: 2,
  recencyThreshold: 30 * 60 * 1000,
  significance: {
    '/api/user-profile': 'high'  // Critical data
  }
});
```

**Timeline:**

| Time | Action | SDK Decision | Result |
|------|--------|--------------|--------|
| 0:00 | User logs in, visits profile | "High priority, cache immediately" | Network fetch + cache |
| 0:05 | User refreshes profile | "Cached! Return immediately" | Instant load (5ms) |
| 0:10 | User navigates away then back | "Still cached and fresh" | Instant load (3ms) |
| 0:35 | User returns after 35 min | "Cache is stale (> 30min)" | Network fetch + update cache |
| 1:00 | User offline, checks profile | "Cached available, network unavailable" | Offline data shown |

---

## 🔍 Debugging SDK Behavior

### Enable Debug Mode

```javascript
SmartOffline.init({
  debug: true,  // Shows all SDK decisions in console
  // ... other config
});
```

### Console Output

```
[SmartOffline] Service Worker registered
[SmartOffline] Config sent to SW: {apis: [...], frequencyThreshold: 2}

[SmartOffline] FETCH INTERCEPTED: /users
[SmartOffline] Checking cache for: /users
[SmartOffline] Cache MISS - Access count: 1/2
[SmartOffline] Fetching from network...
[SmartOffline] Response size: 1.2KB (under limit)
[SmartOffline] NOT caching (threshold not reached)

[SmartOffline] FETCH INTERCEPTED: /users
[SmartOffline] Checking cache for: /users
[SmartOffline] Cache MISS - Access count: 2/2
[SmartOffline] Fetching from network...
[SmartOffline] Response size: 1.2KB
[SmartOffline] CACHING response (threshold reached)

[SmartOffline] FETCH INTERCEPTED: /users
[SmartOffline] Cache HIT! Age: 5234ms
[SmartOffline] Returning cached response
```

---

## ⚡ Performance Impact

### Without SDK (No Caching)
```
First load:  500ms (network)
Second load: 500ms (network)
Third load:  500ms (network)
Offline:     ❌ Fails
```

### With SDK (Smart Caching)
```
First load:  500ms (network, no cache yet)
Second load: 450ms (network, caching enabled)
Third load:  5ms   (cached, instant)
Offline:     5ms   (cached data available)
```

**Savings:** 99% faster on repeat loads

---

## 🎓 Key Takeaways

### Do's ✅
1. **Use fetch() normally** - SDK intercepts automatically
2. **Configure APIs list** - Tell SDK what to cache
3. **Set thresholds** - Fine-tune caching behavior
4. **Mark priorities** - high/normal/low significance
5. **Enable debug** - See what SDK is doing

### Don'ts ❌
1. **Don't manually cache** - Let SDK handle it
2. **Don't use localStorage** - SDK uses CacheStorage
3. **Don't check cache yourself** - SDK decides
4. **Don't bypass Service Worker** - Breaks SDK
5. **Don't over-configure** - Smart defaults work well

---

## 🔧 Migration from Manual Cache

### Before (Manual localStorage):
```javascript
const cache = {
  get: (key) => localStorage.getItem(key),
  set: (key, data) => localStorage.setItem(key, data)
};

const apiRequest = async (endpoint) => {
  const cached = cache.get(endpoint);
  if (cached) return JSON.parse(cached);
  
  const response = await fetch(url);
  const data = await response.json();
  cache.set(endpoint, JSON.stringify(data));
  return data;
};
```

### After (SDK-Powered):
```javascript
// Just use fetch - SDK handles everything!
const apiRequest = async (endpoint) => {
  const response = await fetch(url);
  return await response.json();
};
```

**Result:** Less code, smarter caching, better performance!

---

## 📝 Summary

The **Smart Offline SDK** is a **Service Worker-based** caching solution that:

1. **Intercepts** all fetch() requests automatically
2. **Analyzes** access patterns (frequency, recency, size)
3. **Decides** what to cache based on intelligent heuristics
4. **Caches** using CacheStorage API (not localStorage)
5. **Returns** cached data when available (offline support)

**You don't manage cache** - The SDK does it for you based on real usage patterns!

---

**Next Steps:** Update api.js to remove manual caching and let SDK handle everything.
