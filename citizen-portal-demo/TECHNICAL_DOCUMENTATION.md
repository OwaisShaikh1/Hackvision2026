# 🏛️ Government Citizen Services Portal - Complete Technical Documentation

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [API Integration & Data Flow](#api-integration--data-flow)
3. [Caching Strategy & Implementation](#caching-strategy--implementation)
4. [File Structure & Purpose](#file-structure--purpose)
5. [Component Breakdown](#component-breakdown)
6. [State Management & Data Flow](#state-management--data-flow)
7. [Network Performance Monitoring](#network-performance-monitoring)
8. [Building From Scratch Guide](#building-from-scratch-guide)
9. [Advanced Concepts](#advanced-concepts)

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Services   │  │   Benefits   │ ...  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                           ▼                                  │
│              ┌─────────────────────────┐                     │
│              │   API Layer (api.js)    │                     │
│              └────────────┬────────────┘                     │
│                           │                                  │
│         ┌─────────────────┴─────────────────┐               │
│         ▼                                   ▼               │
│  ┌──────────────┐                  ┌──────────────┐        │
│  │   Cache      │                  │   Network    │        │
│  │ (localStorage)│                  │   Request    │        │
│  └──────────────┘                  └──────┬───────┘        │
└────────────────────────────────────────────┼────────────────┘
                                             ▼
                        ┌────────────────────────────────┐
                        │     External APIs              │
                        │  - JSONPlaceholder (Database)  │
                        │  - Open-Meteo (Weather)        │
                        └────────────────────────────────┘
```

### Technology Stack Rationale

| Technology | Version | Purpose | Why This Choice |
|------------|---------|---------|-----------------|
| React | 18.2.0 | UI Framework | Component-based, hooks for state management, industry standard |
| Vite | 5.0.8 | Build Tool | Fast HMR, minimal config, modern ES modules support |
| React Router | 6.20.0 | Routing | Declarative routing, nested routes support |
| Recharts | 2.10.3 | Charts | React-native, responsive, easy to customize |
| localStorage | Native | Cache Storage | Synchronous, persistent, simulates service worker cache |

---

## 🔌 API Integration & Data Flow

### API Layer Architecture (`src/utils/api.js`)

The API layer is the heart of the application, handling all data fetching, caching, and network operations.

#### Core Constants

```javascript
const API_BASE = 'https://jsonplaceholder.typicode.com';
```

**Why JSONPlaceholder?**
- Free REST API with real database
- No authentication required
- CORS enabled
- Consistent data structure
- 100 users, posts, albums, todos, photos
- Simulates a real government database

#### Cache Management System

```javascript
const cache = {
  get: (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    return { data, timestamp, age: Date.now() - timestamp };
  },
  
  set: (key, data) => {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  },
  
  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
};
```

**How This Works:**
1. **`get(key)`**: Retrieves cached data with metadata
   - Returns `null` if not found
   - Calculates age: `Date.now() - timestamp`
   - Includes original data and timestamp
   
2. **`set(key, data)`**: Stores data with timestamp
   - Wraps data in object with `timestamp`
   - JSON.stringify for storage
   - Key format: `api_${endpoint}`
   
3. **`clear()`**: Removes all API cache
   - Filters by key prefix
   - Preserves other localStorage data
   - Used by "Clear Cache" button

#### Network Performance Measurement

```javascript
const measureNetworkSpeed = async () => {
  const startTime = performance.now();
  try {
    await fetch(`${API_BASE}/posts/1`);
    const endTime = performance.now();
    return endTime - startTime;
  } catch {
    return null;
  }
};
```

**Purpose:**
- **Real latency measurement**: Not simulated!
- Uses lightweight endpoint (`/posts/1`)
- `performance.now()` provides microsecond precision
- Returns `null` on network failure
- Used by NetworkMonitor for quality calculation

**Network Quality Thresholds:**
- **Excellent** (< 100ms): Fast broadband/fiber
- **Good** (100-300ms): Average broadband
- **Fair** (300-800ms): Slow broadband/4G
- **Slow** (> 800ms): 3G or congested network

#### Core Request Function

```javascript
const apiRequest = async (endpoint, options = {}) => {
  const { useCache = true, method = 'GET' } = options;
  const cacheKey = `api_${endpoint}`;
  
  // Check cache if enabled
  if (useCache && method === 'GET') {
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`⚡ CACHE HIT: ${endpoint} (${cached.age}ms old)`);
      return cached.data;
    }
  }
  
  // Real network request
  const startTime = performance.now();
  console.log(`🌐 API REQUEST: ${endpoint}`);
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const duration = Math.round(performance.now() - startTime);
    
    console.log(`✓ API RESPONSE: ${endpoint} (${duration}ms)`);
    
    // Cache if enabled
    if (useCache && method === 'GET') {
      cache.set(cacheKey, data);
      console.log(`💾 CACHED: ${endpoint}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ API ERROR: ${endpoint}`, error.message);
    
    // Fallback to cache on network error
    const cached = cache.get(cacheKey);
    if (cached) {
      console.warn(`⚠️ Network failed, using cached data for ${endpoint}`);
      return cached.data;
    }
    
    throw error;
  }
};
```

**Flow Diagram:**

```
User Request
     │
     ▼
  useCache?  ──No──> Network Request
     │                     │
    Yes                    ▼
     │              Response OK?
     ▼                     │
Cache Exists? ──Yes──> ├─Yes: Parse JSON
     │                 └─No: Throw Error
     No                    │
     │                     ▼
     └──────────> Save to Cache
                           │
                           ▼
                    Return Data
```

**Key Features:**
1. **Cache-first strategy**: Checks localStorage before network
2. **Performance logging**: Every request logged with timing
3. **Error resilience**: Falls back to cache on network failure
4. **Configurable caching**: `useCache` option per request
5. **HTTP error handling**: Throws on non-2xx status codes

---

## 📊 Detailed API Breakdown

### 1. Dashboard Statistics API

```javascript
export const fetchDashboardStats = async () => {
  const [users, posts] = await Promise.all([
    apiRequest('/users', { useCache: true }),
    apiRequest('/posts', { useCache: true })
  ]);
  
  return {
    totalServices: users.length * 15,
    activeApplications: Math.floor(posts.length / 10),
    pendingActions: Math.floor(users.length / 3),
    completedThisMonth: Math.floor(posts.length / 12),
    lastUpdated: new Date().toLocaleString()
  };
};
```

**What It Does:**
- Fetches user and post data from JSONPlaceholder
- Transforms data into government service statistics
- Calculates metrics based on database records

**Why It's Cached:**
- Statistics change infrequently (daily/hourly updates)
- Data computation is deterministic
- Reduces server load
- Instant dashboard loading on revisit

**Data Transformation:**
```
users.length (10) * 15 = 150 services
posts.length (100) / 10 = 10 active applications
users.length (10) / 3 = 3 pending actions
posts.length (100) / 12 = 8 completed this month
```

**Real-World Analogy:**
Government statistics like "Total Services Available" don't change every minute. Caching this data makes sense because:
- Users check dashboards multiple times per day
- Data freshness requirement: 1-24 hours
- Network savings: ~500ms per page load

---

### 2. User Profile API

```javascript
export const fetchUserProfile = async (userId = 1) => {
  const user = await apiRequest(`/users/${userId}`, { useCache: true });
  
  return {
    id: `GOV-${String(user.id).padStart(8, '0')}`,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: `${user.address.street}, ${user.address.suite}, ${user.address.city}, ${user.address.zipcode}`,
    city: user.address.city,
    zipcode: user.address.zipcode,
    company: user.company.name,
    website: user.website,
    memberSince: new Date(2020, 2, 15).toLocaleDateString(),
    verified: true
  };
};
```

**What It Does:**
- Fetches single user record by ID
- Formats data for government ID display
- Flattens nested address object
- Adds government-specific fields (ID format, verification status)

**Why It's Cached:**
- User profile rarely changes
- Contains personal information (PII)
- Frequently accessed across pages
- Offline access important for user experience

**Data Transformation:**
```javascript
// API Response:
{
  id: 1,
  name: "Leanne Graham",
  address: { street: "Kulas Light", city: "Gwenborough", ... }
}

// Transformed to:
{
  id: "GOV-00000001",
  address: "Kulas Light, Apt. 556, Gwenborough, 92998-3874",
  verified: true
}
```

**Cache Strategy:**
- **TTL (Time To Live)**: Could be 30 days
- **Invalidation**: On profile edit
- **Offline Priority**: HIGH - users need profile access

---

### 3. Benefits API

```javascript
export const fetchBenefits = async (userId = 1) => {
  const albums = await apiRequest(`/users/${userId}/albums`, { useCache: true });
  
  const benefitTypes = [
    { name: 'Healthcare Coverage', icon: '🏥', category: 'Health', monthly: true },
    { name: 'Education Grant', icon: '🎓', category: 'Education', monthly: false },
    // ... more types
  ];
  
  const benefits = albums.slice(0, 5).map((album, idx) => {
    const type = benefitTypes[idx % benefitTypes.length];
    const baseAmount = type.monthly ? [450, 200, 800, 600, 120, 350, 900][idx] : 2400;
    const amount = baseAmount + (album.id * 10);
    const status = album.id % 3 === 0 ? 'Pending' : 'Active';
    
    return {
      id: album.id,
      name: type.name,
      category: type.category,
      status: status,
      amount: `$${amount.toLocaleString()}/${type.monthly ? 'month' : 'year'}`,
      icon: type.icon,
      startDate: new Date(2023, album.id % 12, 1).toLocaleDateString(),
      nextPayment: status === 'Active' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : null
    };
  });
  
  const totalMonthly = benefits
    .filter(b => b.status === 'Active' && b.amount.includes('month'))
    .reduce((sum, b) => sum + parseInt(b.amount.replace(/[^0-9]/g, '')), 0);
  
  return { benefits, totalMonthly };
};
```

**What It Does:**
- Uses albums API as data source (10 albums per user)
- Maps each album to a government benefit type
- Calculates benefit amounts using album ID
- Determines status (Active/Pending) algorithmically
- Computes total monthly benefits

**Why It's Cached:**
- Benefits don't change frequently (monthly payment cycles)
- Contains financial information users check repeatedly
- Computation-heavy (transforming albums to benefits)
- Critical offline functionality

**Algorithm Explained:**

```javascript
// For album.id = 5:
const type = benefitTypes[5 % 7] = benefitTypes[5] = 'Transportation Subsidy'
const baseAmount = 120 (from monthly array at index 5)
const amount = 120 + (5 * 10) = 120 + 50 = $170/month
const status = 5 % 3 === 0 ? 'Pending' : 'Active' = 'Active' (5%3=2, not 0)
```

**Real-World Use Case:**
Citizens check their benefit status multiple times:
- Before payment dates
- After applying for new benefits
- When verifying eligibility
- Offline during commutes

**Cache Strategy:**
- **Freshness**: 24 hours acceptable
- **Priority**: HIGH - financial information
- **Invalidation**: On benefit status change

---

### 4. Applications API

```javascript
export const fetchApplications = async (userId = 1) => {
  const todos = await apiRequest(`/users/${userId}/todos`, { useCache: true });
  
  const appTypes = [
    { type: 'Driver License Renewal', icon: '🚗', dept: 'DMV' },
    { type: 'Building Permit', icon: '🏗️', dept: 'Planning' },
    // ... more types
  ];
  
  const statuses = [
    { name: 'Approved', color: 'green' },
    { name: 'In Review', color: 'blue' },
    { name: 'Pending Payment', color: 'orange' },
    { name: 'Submitted', color: 'purple' },
    { name: 'Additional Info Required', color: 'red' }
  ];
  
  const applications = todos.slice(0, 6).map((todo, idx) => {
    const type = appTypes[idx % appTypes.length];
    const daysAgo = (idx + 1) * 5;
    const submittedDate = new Date();
    submittedDate.setDate(submittedDate.getDate() - daysAgo);
    
    const status = todo.completed 
      ? statuses[0] 
      : statuses[(idx + 1) % statuses.length];
    
    return {
      id: `APP-${String(todo.id).padStart(6, '0')}`,
      type: type.type,
      department: type.dept,
      status: status.name,
      statusColor: status.color,
      submittedDate: submittedDate.toLocaleDateString(),
      icon: type.icon,
      progress: todo.completed ? 100 : Math.min(90, 20 + idx * 15),
      estimatedCompletion: new Date(Date.now() + (todo.completed ? 0 : (15 - idx) * 24 * 60 * 60 * 1000)).toLocaleDateString()
    };
  });
  
  return { applications };
};
```

**What It Does:**
- Uses todos API (20 todos per user)
- Maps each todo to a government application type
- Generates realistic submission dates (5 days apart)
- Sets status based on todo completion
- Calculates progress percentage
- Estimates completion dates

**Why It's Cached:**
- Application status updates hourly (not real-time)
- Users track multiple applications simultaneously
- Complex data transformation
- Offline tracking important for user planning

**Status Logic:**

```javascript
// For todo.completed = true:
status = 'Approved' (always statuses[0])

// For todo.completed = false and idx = 2:
status = statuses[(2 + 1) % 5] = statuses[3] = 'Submitted'
```

**Progress Calculation:**

```javascript
// For idx = 4, todo.completed = false:
progress = Math.min(90, 20 + 4 * 15)
         = Math.min(90, 20 + 60)
         = Math.min(90, 80)
         = 80%
```

**Date Calculations:**

```javascript
// Submitted Date (idx = 2):
daysAgo = (2 + 1) * 5 = 15 days
submittedDate = Today - 15 days

// Estimated Completion (idx = 2, not completed):
estimatedDays = (15 - 2) * 24 hours = 13 days
estimatedCompletion = Today + 13 days
```

**Real-World Scenario:**
- User submits Building Permit application
- Checks status daily for updates
- Sees progress: 20% → 40% → 60%
- Cached data shows last known status instantly
- Fresh fetch happens in background

---

### 5. Services API

```javascript
export const fetchServices = async () => {
  const users = await apiRequest('/users', { useCache: true });
  
  const serviceCategories = [
    { name: 'Transportation', icon: '🚗', services: ['Driver License', 'Vehicle Registration', 'Transit Pass'] },
    { name: 'Health', icon: '🏥', services: ['Health Insurance', 'Vaccination Records', 'Medical Assistance'] },
    // ... more categories
  ];
  
  const services = serviceCategories.map((cat, idx) => ({
    id: idx + 1,
    category: cat.name,
    icon: cat.icon,
    services: cat.services,
    activeUsers: users.length * (idx + 1) * 100,
    avgProcessingTime: `${3 + idx * 2} days`
  }));
  
  return { services };
};
```

**What It Does:**
- Fetches all users (10 in JSONPlaceholder)
- Creates service categories with usage statistics
- Calculates active users per service
- Generates processing time estimates

**Why It's Cached:**
- Service catalog changes rarely (new services added monthly)
- Static content doesn't need real-time updates
- Reduces load on service discovery page
- Essential for offline browsing

**Metrics Calculation:**

```javascript
// For Transportation (idx = 0):
activeUsers = 10 * (0 + 1) * 100 = 1,000 users
avgProcessingTime = 3 + (0 * 2) = 3 days

// For Health (idx = 1):
activeUsers = 10 * (1 + 1) * 100 = 2,000 users
avgProcessingTime = 3 + (1 * 2) = 5 days
```

---

### 6. Documents API

```javascript
export const fetchDocuments = async (userId = 1) => {
  const photos = await apiRequest(`/users/${userId}/photos?_limit=8`, { useCache: true });
  
  const docTypes = [
    { name: 'National ID Card', icon: '🆔', type: 'PDF', category: 'Identity' },
    { name: 'Driver License', icon: '🚗', type: 'PDF', category: 'Identity' },
    // ... more types
  ];
  
  const documents = photos.map((photo, idx) => {
    const docType = docTypes[idx % docTypes.length];
    const sizeKB = 1000 + (photo.id * 100);
    const daysOld = idx * 10 + photo.id;
    const uploadDate = new Date();
    uploadDate.setDate(uploadDate.getDate() - daysOld);
    
    return {
      id: `DOC-${String(photo.id).padStart(6, '0')}`,
      name: docType.name,
      type: docType.type,
      category: docType.category,
      size: `${(sizeKB / 1024).toFixed(1)} MB`,
      uploadDate: uploadDate.toLocaleDateString(),
      icon: docType.icon,
      verified: photo.id % 3 !== 0,
      downloadUrl: photo.url
    };
  });
  
  return { documents };
};
```

**What It Does:**
- Uses photos API (50 photos per user, limited to 8)
- Maps each photo to a government document
- Calculates file sizes based on photo ID
- Generates realistic upload dates
- Sets verification status algorithmically

**Why It's Cached:**
- Documents don't change (immutable once uploaded)
- Large file metadata benefits from caching
- Critical for offline document access
- Frequently accessed by users

**Size Calculation:**

```javascript
// For photo.id = 15:
sizeKB = 1000 + (15 * 100) = 2,500 KB
sizeMB = 2500 / 1024 = 2.4 MB
```

**Verification Logic:**

```javascript
// For photo.id = 12:
verified = 12 % 3 !== 0
         = 0 !== 0
         = false (not verified, needs review)

// For photo.id = 13:
verified = 13 % 3 !== 0
         = 1 !== 0
         = true (verified)
```

---

### 7. Real-Time News API (NOT CACHED)

```javascript
export const fetchRealTimeNews = async () => {
  // Always fresh data - NOT cached
  const offset = Math.floor(Math.random() * 95);
  const posts = await apiRequest(`/posts?_start=${offset}&_limit=4`, { useCache: false });
  
  const categories = [
    'Government Policy', 'Public Health', 'Transportation', 
    'Community Events', 'Emergency Alerts', 'Tax & Finance'
  ];
  
  const news = posts.map((post, idx) => {
    const minutesAgo = idx * 5 + Math.floor(Math.random() * 10);
    const timeStr = minutesAgo === 0 ? 'Just now' : 
                    minutesAgo < 60 ? `${minutesAgo} minutes ago` : 
                    `${Math.floor(minutesAgo / 60)} hours ago`;
    
    return {
      id: post.id,
      title: post.title.charAt(0).toUpperCase() + post.title.slice(1),
      category: categories[post.userId % categories.length],
      time: timeStr,
      urgent: post.id % 10 === 0,
      source: 'Government Official'
    };
  });
  
  return {
    news,
    timestamp: new Date().toLocaleString(),
    sourceAPI: 'Real-time Feed'
  };
};
```

**What It Does:**
- Fetches 4 random posts from JSONPlaceholder (offset 0-95)
- Maps posts to government news items
- Generates realistic "time ago" strings
- Marks some news as urgent
- Returns fresh timestamp

**Why It's NOT Cached:**
- Breaking news must be current
- Emergency alerts require real-time delivery
- Stale news is misleading/dangerous
- Users expect fresh content on refresh

**Randomization:**

```javascript
// Random offset ensures different news each time:
offset = Math.floor(Math.random() * 95)
// Range: 0-94, allows fetching posts 0-98 (4 at a time)

// Example:
offset = 47
API call: /posts?_start=47&_limit=4
Returns: posts 47, 48, 49, 50
```

**Time Calculation:**

```javascript
// For idx = 2:
minutesAgo = 2 * 5 + Math.floor(Math.random() * 10)
           = 10 + (0-9)
           = 10-19 minutes

// Time string logic:
0 minutes: "Just now"
1-59 minutes: "X minutes ago"
60+ minutes: "X hours ago"
```

**Urgency Flag:**

```javascript
// For post.id = 20:
urgent = 20 % 10 === 0 = true (urgent news)

// For post.id = 23:
urgent = 23 % 10 === 0 = false (regular news)
```

**Real-World Analogy:**
- Emergency weather alerts
- Government policy announcements
- Public safety notifications
- Event cancellations

**Why No Cache:**
- **Freshness Critical**: Outdated emergency alerts dangerous
- **User Expectation**: News feed should update on refresh
- **Legal Requirement**: Government agencies must provide timely information
- **UX Design**: Visual refresh indicator shows new content

---

### 8. Weather API (NOT CACHED)

```javascript
export const fetchWeather = async () => {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius';
    
    const response = await fetch(url);
    const data = await response.json();
    
    const weatherCodes = {
      0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 61: 'Light Rain',
      63: 'Moderate Rain', 65: 'Heavy Rain', 80: 'Rain Showers', 95: 'Thunderstorm'
    };
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      condition: weatherCodes[data.current.weather_code] || 'Partly Cloudy',
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      location: 'New York, USA',
      timestamp: new Date().toLocaleString(),
      sourceAPI: 'Open-Meteo Weather'
    };
  } catch (error) {
    console.error('Weather API failed:', error);
    throw error;
  }
};
```

**What It Does:**
- Calls Open-Meteo free weather API
- Gets real-time weather for New York City
- Coordinates: 40.7128°N, 74.0060°W
- Returns current temperature, humidity, wind speed
- Maps weather codes to readable conditions

**Why It's NOT Cached:**
- Weather changes hourly
- Accuracy critical for public safety
- Users expect real-time data
- Stale weather data misleading

**Weather Code Mapping:**

```javascript
// API returns weather_code: 61
condition = weatherCodes[61] = 'Light Rain'

// Unknown code:
weatherCodes[99] = undefined
condition = weatherCodes[99] || 'Partly Cloudy' = 'Partly Cloudy'
```

**API Parameters:**
- `latitude=40.7128`: NYC latitude
- `longitude=-74.0060`: NYC longitude
- `current=temperature_2m`: Temperature at 2 meters
- `current=relative_humidity_2m`: Humidity percentage
- `current=wind_speed_10m`: Wind speed at 10 meters
- `current=weather_code`: WMO weather code
- `temperature_unit=celsius`: Metric system

**Real-World Use Case:**
- Citizens check weather before commuting
- Emergency services monitor conditions
- Event organizers plan activities
- Public safety alerts trigger on extreme weather

---

## 🎯 Caching Strategy & Decision Matrix

### Caching Decision Framework

```
┌─────────────────────────────────────────────────────────┐
│           SHOULD THIS API BE CACHED?                    │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
    Data Update           YES         Does data change
    Frequency?                        in real-time?
          │                                │
    ┌─────┴─────┐                    ┌─────┴─────┐
    ▼           ▼                    ▼           ▼
 Hourly+    Minutes                YES          NO
    │           │                    │           │
    ▼           ▼                    ▼           ▼
  CACHE    DON'T CACHE          DON'T CACHE   CACHE
```

### Caching Decision Table

| API | Update Frequency | Real-Time? | User Tolerance | Cache? | Reason |
|-----|------------------|------------|----------------|--------|--------|
| Dashboard Stats | Daily | No | 24 hours | ✅ YES | Statistics aggregate slowly |
| User Profile | Rarely | No | 30 days | ✅ YES | Profile changes infrequent |
| Benefits | Monthly | No | 24 hours | ✅ YES | Payment cycles monthly |
| Applications | Hourly | No | 1 hour | ✅ YES | Status updates batched |
| Services | Monthly | No | 7 days | ✅ YES | Catalog changes rare |
| Documents | Never* | No | Permanent | ✅ YES | Immutable documents |
| News Feed | Seconds | Yes | 0 minutes | ❌ NO | Breaking news critical |
| Weather | Minutes | Yes | 0 minutes | ❌ NO | Conditions change fast |

*Documents never change once uploaded

### Priority Levels Explained

#### HIGH Priority Cache (Instant Load Required)
- **User Profile**: Identity verification, personal info
- **Benefits**: Financial data, payment info
- **Applications**: Tracking status, deadlines

**Rationale:**
- Users access frequently (multiple times per day)
- Data size medium (10-50KB)
- Offline access critical
- Update tolerance: hours to days

#### NORMAL Priority Cache (Fast Load Preferred)
- **Dashboard Stats**: Overview metrics
- **Services**: Catalog browsing
- **Documents**: File management

**Rationale:**
- Users access regularly (daily)
- Data size small to large (5KB-500KB)
- Offline nice-to-have
- Update tolerance: days to weeks

#### NO CACHE (Fresh Data Required)
- **News Feed**: Breaking announcements
- **Weather**: Current conditions

**Rationale:**
- Users expect fresh data
- Data size tiny (< 5KB)
- Offline not useful (stale data worse than no data)
- Update tolerance: minutes

---

## 📁 File Structure & Purpose

```
citizen-portal-demo/
├── public/
│   └── smart-offline-sw.js          # Service Worker (future integration)
├── src/
│   ├── main.jsx                     # Application entry point
│   ├── index.css                    # Global styles
│   ├── App.jsx                      # Root component with routing
│   ├── App.css                      # App-level styles
│   ├── utils/
│   │   └── api.js                   # API integration layer ⭐ CORE
│   ├── components/
│   │   ├── NetworkMonitor.jsx      # Network performance display
│   │   ├── NetworkMonitor.css      # Monitor styles
│   │   ├── CacheIndicator.jsx      # Cache status display
│   │   └── CacheIndicator.css      # Indicator styles
│   └── pages/
│       ├── Dashboard.jsx            # Dashboard page with charts
│       ├── Dashboard.css            # Dashboard styles
│       ├── Services.jsx             # Services & applications page
│       ├── Services.css             # Services styles
│       ├── Benefits.jsx             # Benefits management page
│       ├── Benefits.css             # Benefits styles
│       ├── Documents.jsx            # Documents & profile page
│       └── Documents.css            # Documents styles
├── index.html                       # HTML entry point
├── vite.config.js                   # Vite configuration
├── package.json                     # Dependencies & scripts
└── README.md                        # User documentation
```

### Core Files Deep Dive

#### `main.jsx` - Application Bootstrap

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Purpose:**
- Entry point for React application
- Creates root React element
- Mounts App component to DOM
- Enables StrictMode for development warnings

**StrictMode Benefits:**
- Detects side effects in render
- Warns about deprecated APIs
- Helps identify potential problems

---

#### `App.jsx` - Routing & Layout

```javascript
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Benefits from './pages/Benefits';
import Documents from './pages/Documents';
import NetworkMonitor from './components/NetworkMonitor';
import CacheIndicator from './components/CacheIndicator';
import './App.css';

function AppContent() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🏛️ Government Citizen Services Portal</h1>
          <div className="status-indicator">
            <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <nav className="app-nav">
          <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
            📊 Dashboard
          </Link>
          <Link to="/services" className={location.pathname === '/services' ? 'active' : ''}>
            🎯 Services
          </Link>
          <Link to="/benefits" className={location.pathname === '/benefits' ? 'active' : ''}>
            💰 Benefits
          </Link>
          <Link to="/documents" className={location.pathname === '/documents' ? 'active' : ''}>
            📄 Documents
          </Link>
        </nav>
      </header>

      <div className="app-body">
        <aside className="sidebar">
          <NetworkMonitor />
          <CacheIndicator />
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/services" element={<Services />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/documents" element={<Documents />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
```

**Architecture:**
1. **Router Wrapping**: `<Router>` enables routing
2. **AppContent Component**: Contains app logic
3. **Online/Offline Detection**: Uses `navigator.onLine` API
4. **Layout Structure**:
   - Header: Title, status, navigation
   - Sidebar: Monitoring components
   - Main: Page content (routed)

**Online/Offline Detection:**

```javascript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

**How This Works:**
1. `navigator.onLine`: Browser API for network status
2. Event listeners: `online`, `offline` events
3. State updates: Sets `isOnline` true/false
4. Visual indicator: Shows connection status in header
5. Cleanup: Removes listeners on unmount

**Navigation Active State:**

```javascript
<Link to="/dashboard" className={location.pathname === '/dashboard' ? 'active' : ''}>
  📊 Dashboard
</Link>
```

- Uses `useLocation()` hook to get current path
- Compares `location.pathname` with link path
- Applies `active` class if match
- Provides visual feedback to user

---

#### `NetworkMonitor.jsx` - Real Network Performance

```javascript
import React, { useState, useEffect } from 'react';
import { getNetworkPerformance, clearCache } from '../utils/api';
import './NetworkMonitor.css';

const NetworkMonitor = () => {
  const [performance, setPerformance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkPerformance();
    const interval = setInterval(checkPerformance, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const checkPerformance = async () => {
    try {
      const perf = await getNetworkPerformance();
      setPerformance(perf);
    } catch (error) {
      console.error('Failed to check network performance:', error);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return '#10b981';
      case 'Good': return '#3b82f6';
      case 'Fair': return '#f59e0b';
      case 'Slow': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="network-monitor">
      <div className="monitor-header">
        <h3>📡 Network Monitor</h3>
        <button onClick={checkPerformance} className="refresh-btn-small">🔄</button>
      </div>

      {performance && (
        <div className="performance-info">
          <div className="perf-row">
            <span className="perf-label">Connection:</span>
            <span className="perf-value" style={{ color: getQualityColor(performance.quality) }}>
              {performance.quality}
            </span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Latency:</span>
            <span className="perf-value">
              {performance.latency ? `${Math.round(performance.latency)}ms` : 'Measuring...'}
            </span>
          </div>
          <div className="perf-row">
            <span className="perf-label">Last Check:</span>
            <span className="perf-value-small">{performance.timestamp}</span>
          </div>
        </div>
      )}

      <div className="monitor-info">
        <strong>ℹ️ Real Network Performance</strong>
        <ul>
          <li>Measures actual connection speed</li>
          <li>SDK decides what to cache automatically</li>
          <li>First load: fetches from APIs</li>
          <li>Repeat loads: instant from cache</li>
        </ul>
      </div>

      <button onClick={handleClearCache} className="clear-cache-btn" disabled={refreshing}>
        {refreshing ? '♻️ Refreshing...' : '🗑️ Clear Cache & Reload'}
      </button>
    </div>
  );
};

export default NetworkMonitor;
```

**Features:**
1. **Real-time Performance**: Measures actual network latency every 10 seconds
2. **Quality Indicator**: Color-coded connection quality
3. **Cache Management**: Clear cache button with reload
4. **Educational Info**: Explains caching behavior

**Performance Check Flow:**

```
checkPerformance() called
         ↓
getNetworkPerformance() from api.js
         ↓
Fetches /posts/1 (lightweight)
         ↓
Measures response time
         ↓
Calculates quality:
  < 100ms: Excellent (green)
  100-300ms: Good (blue)
  300-800ms: Fair (orange)
  > 800ms: Slow (red)
         ↓
Updates UI with results
```

**Auto-refresh Logic:**

```javascript
useEffect(() => {
  checkPerformance();                              // Immediate check
  const interval = setInterval(checkPerformance, 10000);  // Every 10s
  return () => clearInterval(interval);            // Cleanup
}, []);
```

**Clear Cache Flow:**

```
User clicks "Clear Cache & Reload"
         ↓
handleClearCache() called
         ↓
clearCache() - Removes all localStorage items
         ↓
setRefreshing(true) - Disables button
         ↓
setTimeout(() => window.location.reload(), 500)
         ↓
500ms delay (visual feedback)
         ↓
Page reloads - Fresh API fetches
```

---

#### `CacheIndicator.jsx` - Cache Status Monitor

```javascript
import React, { useState, useEffect } from 'react';
import './CacheIndicator.css';

const CacheIndicator = () => {
  const [cacheStats, setCacheStats] = useState({
    cachedAPIs: 6,
    nonCachedAPIs: 2,
    totalRequests: 0
  });

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateStats = () => {
    const cachedItems = Object.keys(localStorage).filter(key => key.startsWith('api_')).length;
    setCacheStats(prev => ({
      ...prev,
      totalRequests: cachedItems
    }));
  };

  const cachedAPIs = [
    { name: 'Dashboard Stats', icon: '📊', priority: 'high' },
    { name: 'User Profile', icon: '👤', priority: 'high' },
    { name: 'Benefits', icon: '💰', priority: 'normal' },
    { name: 'Applications', icon: '📝', priority: 'normal' },
    { name: 'Services', icon: '🎯', priority: 'normal' },
    { name: 'Documents', icon: '📄', priority: 'normal' }
  ];

  const nonCachedAPIs = [
    { name: 'Real-time News', icon: '📰', reason: 'Breaking news' },
    { name: 'Weather', icon: '🌤️', reason: 'Live updates' }
  ];

  return (
    <div className="cache-indicator">
      <div className="indicator-header">
        <h3>💾 Cache Status</h3>
      </div>

      <div className="cache-summary">
        <div className="summary-item">
          <span className="summary-value">{cacheStats.cachedAPIs}</span>
          <span className="summary-label">Cached APIs</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{cacheStats.nonCachedAPIs}</span>
          <span className="summary-label">Live APIs</span>
        </div>
        <div className="summary-item">
          <span className="summary-value">{cacheStats.totalRequests}</span>
          <span className="summary-label">Cached Items</span>
        </div>
      </div>

      <div className="api-list">
        <h4>✅ Cached (Offline Available)</h4>
        {cachedAPIs.map((api, idx) => (
          <div key={idx} className="api-item cached">
            <span className="api-icon">{api.icon}</span>
            <span className="api-name">{api.name}</span>
            <span className={`api-priority ${api.priority}`}>
              {api.priority === 'high' ? '⚡' : '📌'}
            </span>
          </div>
        ))}
      </div>

      <div className="api-list">
        <h4>🔄 Live Data (Internet Required)</h4>
        {nonCachedAPIs.map((api, idx) => (
          <div key={idx} className="api-item live">
            <span className="api-icon">{api.icon}</span>
            <span className="api-name">{api.name}</span>
            <span className="api-reason">{api.reason}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CacheIndicator;
```

**Purpose:**
- Visual representation of caching strategy
- Shows which APIs are cached vs live
- Displays cache statistics
- Educational tool for understanding offline capability

**localStorage Monitoring:**

```javascript
const updateStats = () => {
  // Count all keys starting with 'api_'
  const cachedItems = Object.keys(localStorage)
    .filter(key => key.startsWith('api_'))
    .length;
  
  setCacheStats(prev => ({
    ...prev,
    totalRequests: cachedItems
  }));
};
```

**How It Works:**
1. `Object.keys(localStorage)`: Gets all localStorage keys
2. `.filter(key => key.startsWith('api_'))`: Finds API cache keys
3. `.length`: Counts cached items
4. Updates stats every 5 seconds
5. Displays in UI

**Priority Indicators:**
- **⚡ High Priority**: Critical for offline (Profile, Benefits)
- **📌 Normal Priority**: Nice-to-have offline (Services, Documents)

---

## 🎨 Component Breakdown

### Dashboard Page (`Dashboard.jsx`)

**Purpose:** Analytics overview with cached statistics and live data

**Data Sources:**
1. **Cached**: Dashboard stats (users, posts)
2. **Live**: Real-time news, weather

**State Management:**

```javascript
const [stats, setStats] = useState(null);
const [news, setNews] = useState(null);
const [weather, setWeather] = useState(null);
const [loading, setLoading] = useState(true);
const [loadTimes, setLoadTimes] = useState({ stats: 0, news: 0, weather: 0 });
const [sources, setSources] = useState({ stats: '', news: '', weather: '' });
```

**Data Flow:**

```
Component Mount
      ↓
loadAllData() called
      ↓
Promise.all([
  fetchDashboardStats(),  → Check cache → Network if miss
  fetchRealTimeNews(),    → Always network (no cache)
  fetchWeather()          → Always network (no cache)
])
      ↓
Measure load times
      ↓
Determine source (cache vs network)
      ↓
Update state with data + metadata
      ↓
Render charts and metrics
```

**Load Time Calculation:**

```javascript
const loadAllData = async () => {
  setLoading(true);
  
  const startTimes = {
    stats: Date.now(),
    news: Date.now(),
    weather: Date.now()
  };
  
  try {
    const [statsData, newsData, weatherData] = await Promise.all([
      fetchDashboardStats(),
      fetchRealTimeNews(),
      fetchWeather()
    ]);
    
    const endTime = Date.now();
    
    setLoadTimes({
      stats: endTime - startTimes.stats,
      news: endTime - startTimes.news,
      weather: endTime - startTimes.weather
    });
    
    setSources({
      stats: (endTime - startTimes.stats) < 200 ? 'cache' : 'network',
      news: 'network',
      weather: 'network'
    });
    
    setStats(statsData);
    setNews(newsData);
    setWeather(weatherData);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    setLoading(false);
  }
};
```

**Source Detection Logic:**
- **< 200ms**: Likely from cache (instant)
- **≥ 200ms**: Likely from network (API roundtrip)
- News/Weather: Always network (forced)

**Chart Integration (Recharts):**

```javascript
<BarChart width={600} height={300} data={chartData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="value" fill="#667eea" />
</BarChart>
```

**Chart Data Transformation:**

```javascript
const chartData = [
  { name: 'Total Services', value: stats.totalServices },
  { name: 'Active Apps', value: stats.activeApplications },
  { name: 'Pending Actions', value: stats.pendingActions },
  { name: 'Completed', value: stats.completedThisMonth }
];
```

---

### Services Page (`Services.jsx`)

**Purpose:** Application tracking and service catalog

**Features:**
1. View application status
2. Browse available services
3. Track progress
4. See processing times

**Data Loading:**

```javascript
const loadData = async () => {
  setLoading(true);
  const startTime = Date.now();

  try {
    const [appsData, servicesData] = await Promise.all([
      fetchApplications(),
      fetchServices()
    ]);
    
    const endTime = Date.now();
    const time = endTime - startTime;
    
    setApplications(appsData);
    setServices(servicesData.services);
    setLoadTime(time);
    setSource(time < 200 ? 'cache' : 'network');
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    setLoading(false);
  }
};
```

**Parallel Loading Benefits:**
- Both APIs fetched simultaneously
- Total time = MAX(apps, services), not SUM
- Improves perceived performance

**Application Display:**

```javascript
<div className="application-card">
  <div className="app-icon">{app.icon}</div>
  <div className="app-content">
    <h4>{app.type}</h4>
    <div className="app-meta">
      <span style={{ color: app.statusColor }}>
        ● {app.status}
      </span>
      <span>{app.department}</span>
    </div>
    <div className="app-details">
      <span>Submitted: {app.submittedDate}</span>
      <span>{app.progress}% Complete</span>
    </div>
  </div>
  <button className="btn-view">View Details</button>
</div>
```

**Progress Visualization:**
- Status color from API data
- Progress percentage shows completion
- Submitted date for tracking

---

### Benefits Page (`Benefits.jsx`)

**Purpose:** Financial benefits management and tracking

**Data Display:**

```javascript
{benefits.map(benefit => (
  <div key={benefit.id} className="benefit-card">
    <div className="benefit-icon">{benefit.icon}</div>
    <div className="benefit-content">
      <h4>{benefit.name}</h4>
      <div className="benefit-category">{benefit.category}</div>
      <div className="benefit-amount">{benefit.amount}</div>
      <div className="benefit-status">{benefit.status}</div>
      {benefit.nextPayment && (
        <div className="benefit-payment">
          Next Payment: {benefit.nextPayment}
        </div>
      )}
    </div>
  </div>
))}
```

**Total Monthly Calculation Display:**

```javascript
<div className="total-benefits">
  <h3>💰 Total Monthly Benefits</h3>
  <div className="total-amount">
    ${totalMonthly.toLocaleString()}/month
  </div>
</div>
```

---

### Documents Page (`Documents.jsx`)

**Purpose:** Document management and profile viewing

**Profile Display:**

```javascript
<div className="profile-card">
  <div className="profile-avatar">👤</div>
  <div className="profile-details">
    <h3>{profile.name}</h3>
    <div className="profile-info">
      <div className="info-item">
        <span className="info-label">Citizen ID:</span>
        <span className="info-value">{profile.id}</span>
      </div>
      // ... more fields
    </div>
  </div>
</div>
```

**Document Grid:**

```javascript
<div className="documents-grid">
  {documents.map(doc => (
    <div key={doc.id} className="document-card">
      <div className="doc-icon">{doc.icon}</div>
      <div className="doc-info">
        <h4>{doc.name}</h4>
        <div className="doc-meta">
          <span className="doc-type">{doc.type}</span>
          <span className="doc-size">{doc.size}</span>
          <span className="doc-category">{doc.category}</span>
        </div>
        <div className="doc-date">Uploaded: {doc.uploadDate}</div>
        {doc.verified && <span className="doc-verified">✓ Verified</span>}
      </div>
      <div className="doc-actions">
        <button className="btn-icon">⬇️</button>
        <button className="btn-icon">📤</button>
        <button className="btn-icon">🗑️</button>
      </div>
    </div>
  ))}
</div>
```

---

## 🔄 State Management & Data Flow

### Global State Strategy

This application uses **Component-Level State** (no Redux/Context):

**Rationale:**
- Pages are independent
- No shared mutable state
- Cache managed by api.js
- Simpler architecture
- Easier to understand

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                      │
│  (Page Load / Button Click / Navigation)                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Component Event Handler                     │
│  (loadData() / handleRefresh() / etc.)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                 API Function Call                        │
│  (fetchDashboardStats / fetchWeather / etc.)            │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│  Cache Check     │    │  Network Request │
│  (localStorage)  │    │  (fetch API)     │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         │  Cache Miss           │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Response Processing                         │
│  (Transform data / Calculate metrics / etc.)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Cache Storage                               │
│  (Save to localStorage with timestamp)                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Component State Update                      │
│  (setState() triggers re-render)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  UI Re-render                            │
│  (Display new data to user)                             │
└─────────────────────────────────────────────────────────┘
```

### Async Operation Pattern

All pages follow this pattern:

```javascript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [loadTime, setLoadTime] = useState(0);
const [source, setSource] = useState('');

const loadData = async () => {
  setLoading(true);
  const startTime = Date.now();

  try {
    const result = await fetchAPIFunction();
    const endTime = Date.now();
    
    setData(result);
    setLoadTime(endTime - startTime);
    setSource((endTime - startTime) < 200 ? 'cache' : 'network');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadData();
}, []);
```

**Lifecycle:**
1. **Mount**: Component mounts, `useEffect` runs
2. **Loading**: Set loading state, show spinner
3. **Fetch**: Call API function (async)
4. **Success**: Update state with data
5. **Timing**: Record load time and source
6. **Render**: Display data in UI
7. **Cleanup**: Set loading false

---

## 🏗️ Building From Scratch Guide

### Step 1: Project Setup

```bash
# Create Vite project
npm create vite@latest citizen-portal-demo -- --template react

# Navigate to directory
cd citizen-portal-demo

# Install dependencies
npm install react-router-dom recharts

# Start development server
npm run dev
```

### Step 2: Create File Structure

```bash
mkdir -p src/utils src/components src/pages
```

### Step 3: Build API Layer (`src/utils/api.js`)

**Start with cache management:**

```javascript
const cache = {
  get: (key) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, timestamp } = JSON.parse(item);
    return { data, timestamp, age: Date.now() - timestamp };
  },
  set: (key, data) => {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  },
  clear: () => {
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith('cache_')) localStorage.removeItem(key);
    });
  }
};
```

**Add core request function:**

```javascript
const apiRequest = async (endpoint, options = {}) => {
  const { useCache = true } = options;
  const cacheKey = `api_${endpoint}`;
  
  if (useCache) {
    const cached = cache.get(cacheKey);
    if (cached) return cached.data;
  }
  
  const response = await fetch(`https://jsonplaceholder.typicode.com${endpoint}`);
  const data = await response.json();
  
  if (useCache) cache.set(cacheKey, data);
  
  return data;
};
```

**Add specific API functions:**

```javascript
export const fetchDashboardStats = async () => {
  const [users, posts] = await Promise.all([
    apiRequest('/users', { useCache: true }),
    apiRequest('/posts', { useCache: true })
  ]);
  return {
    totalServices: users.length * 15,
    activeApplications: Math.floor(posts.length / 10),
    // ... more stats
  };
};

// Repeat for other APIs...
```

### Step 4: Create Components

**NetworkMonitor.jsx:**

```javascript
import React, { useState, useEffect } from 'react';
import { getNetworkPerformance, clearCache } from '../utils/api';

const NetworkMonitor = () => {
  const [performance, setPerformance] = useState(null);
  
  useEffect(() => {
    const check = async () => {
      const perf = await getNetworkPerformance();
      setPerformance(perf);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="network-monitor">
      {/* Display performance */}
    </div>
  );
};

export default NetworkMonitor;
```

**CacheIndicator.jsx:**

```javascript
import React from 'react';

const CacheIndicator = () => {
  const cachedAPIs = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Profile', icon: '👤' },
    // ... more
  ];
  
  return (
    <div className="cache-indicator">
      <h3>💾 Cache Status</h3>
      {cachedAPIs.map(api => (
        <div key={api.name}>{api.icon} {api.name}</div>
      ))}
    </div>
  );
};

export default CacheIndicator;
```

### Step 5: Create Pages

**Dashboard.jsx:**

```javascript
import React, { useState, useEffect } from 'react';
import { fetchDashboardStats, fetchRealTimeNews, fetchWeather } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      const data = await fetchDashboardStats();
      setStats(data);
      setLoading(false);
    };
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <BarChart width={600} height={300} data={[
        { name: 'Services', value: stats.totalServices }
      ]}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#667eea" />
      </BarChart>
    </div>
  );
};

export default Dashboard;
```

**Repeat for Services, Benefits, Documents pages...**

### Step 6: Setup Routing

**App.jsx:**

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Benefits from './pages/Benefits';
import Documents from './pages/Documents';

function App() {
  return (
    <Router>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/services">Services</Link>
        <Link to="/benefits">Benefits</Link>
        <Link to="/documents">Documents</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/services" element={<Services />} />
        <Route path="/benefits" element={<Benefits />} />
        <Route path="/documents" element={<Documents />} />
      </Routes>
    </Router>
  );
}

export default App;
```

### Step 7: Add Styling

Create CSS files for each component with responsive design:

```css
/* App.css */
.app {
  display: grid;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
}

.app-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
  padding: 2rem;
}

@media (max-width: 768px) {
  .app-body {
    grid-template-columns: 1fr;
  }
}
```

### Step 8: Testing

**Test Cache Behavior:**

```javascript
// Open browser console
// First load:
fetchDashboardStats(); // 500ms from network

// Second load:
fetchDashboardStats(); // 5ms from cache

// Clear cache:
clearCache();

// Third load:
fetchDashboardStats(); // 500ms from network again
```

**Test Offline:**

1. Load page (cache populated)
2. Open DevTools → Network tab
3. Set "Offline" mode
4. Navigate to cached pages (work!)
5. Try news/weather (fail)

### Step 9: Production Build

```bash
npm run build
# Output in dist/ folder
```

---

## 🎓 Advanced Concepts

### 1. Cache Invalidation Strategy

**Time-based Invalidation:**

```javascript
const cache = {
  get: (key, maxAge = Infinity) => {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const { data, timestamp } = JSON.parse(item);
    const age = Date.now() - timestamp;
    
    if (age > maxAge) {
      localStorage.removeItem(key);
      return null;
    }
    
    return { data, timestamp, age };
  }
};

// Usage:
const data = cache.get('api_/users', 24 * 60 * 60 * 1000); // 24 hours
```

**Dependency-based Invalidation:**

```javascript
// When user updates profile:
const updateProfile = async (newData) => {
  await apiRequest('/users/1', { method: 'PUT', body: newData });
  
  // Invalidate dependent caches:
  localStorage.removeItem('api_/users/1');
  localStorage.removeItem('api_/dashboard-stats');
};
```

### 2. Network-Aware Caching

```javascript
const isSlow Network = () => {
  const connection = navigator.connection;
  return connection && 
         (connection.effectiveType === 'slow-2g' || 
          connection.effectiveType === '2g');
};

const apiRequest = async (endpoint, options = {}) => {
  const useCache = options.useCache !== false;
  
  // Prefer cache on slow networks
  if (isSlowNetwork() && useCache) {
    const cached = cache.get(cacheKey);
    if (cached) return cached.data;
  }
  
  // ... rest of implementation
};
```

### 3. Background Sync Pattern

```javascript
// Simulate background refresh
const prefetchData = async () => {
  await Promise.all([
    fetchDashboardStats(),
    fetchUserProfile(),
    fetchBenefits(),
    fetchApplications()
  ]);
};

// Run on idle
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    prefetchData();
  });
}
```

### 4. Service Worker Integration (Future)

```javascript
// smart-offline-sw.js
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open('api-cache').then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
  }
});
```

### 5. Error Resilience Patterns

**Retry with Exponential Backoff:**

```javascript
const fetchWithRetry = async (url, retries = 3, delay = 1000) => {
  try {
    return await fetch(url);
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, retries - 1, delay * 2);
  }
};
```

**Circuit Breaker:**

```javascript
class CircuitBreaker {
  constructor() {
    this.failures = 0;
    this.threshold = 5;
    this.isOpen = false;
  }
  
  async call(fn) {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await fn();
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      if (this.failures >= this.threshold) {
        this.isOpen = true;
        setTimeout(() => { this.isOpen = false; }, 60000);
      }
      throw error;
    }
  }
}
```

---

## 📊 Performance Optimization

### Bundle Size Optimization

**Code Splitting:**

```javascript
// Instead of:
import Dashboard from './pages/Dashboard';

// Use lazy loading:
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

// Wrap in Suspense:
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### Memory Management

```javascript
// Clean up listeners
useEffect(() => {
  const interval = setInterval(checkPerformance, 10000);
  return () => clearInterval(interval);  // Cleanup!
}, []);

// Abort pending requests
useEffect(() => {
  const controller = new AbortController();
  
  fetch(url, { signal: controller.signal })
    .then(/* ... */);
  
  return () => controller.abort();  // Cancel on unmount
}, []);
```

---

## 🔐 Security Considerations

### Input Validation

```javascript
const validateUserId = (id) => {
  const userId = parseInt(id, 10);
  if (isNaN(userId) || userId < 1) {
    throw new Error('Invalid user ID');
  }
  return userId;
};
```

### XSS Prevention

```javascript
// React escapes by default:
<div>{user.name}</div>  // Safe

// Be careful with dangerouslySetInnerHTML:
<div dangerouslySetInnerHTML={{ __html: sanitize(html) }} />  // Sanitize first!
```

---

## 📝 Summary

This portal demonstrates:

1. **Real API Integration**: JSONPlaceholder, Open-Meteo
2. **Smart Caching**: Cache frequently accessed, fetch fresh for real-time
3. **Network Awareness**: Measure actual performance
4. **Offline Capability**: Cached data available without internet
5. **User Experience**: Fast loads, visual feedback, clear status
6. **Scalable Architecture**: Component-based, separation of concerns
7. **Educational Value**: Learn caching strategies, React patterns

**Key Takeaways:**
- Cache static/semi-static data
- Fetch real-time data fresh
- Measure and display performance
- Handle errors gracefully
- Provide offline fallbacks
- Test in various network conditions

---

**Built for learning, designed for production-readiness.**
