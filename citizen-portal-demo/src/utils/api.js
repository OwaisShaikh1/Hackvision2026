// Real API client - SDK handles all caching via Service Worker
// No manual caching - just use fetch() and SDK intercepts automatically

const API_BASE = 'https://jsonplaceholder.typicode.com';

// Simple fetch wrapper - SDK Service Worker intercepts all fetch() calls
const apiRequest = async (endpoint) => {
  try {
    const startTime = performance.now();
    const response = await fetch(`${API_BASE}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const duration = Math.round(performance.now() - startTime);
    
    console.log(`✓ API: ${endpoint} (${duration}ms)`);
    return data;
  } catch (error) {
    console.error(`❌ API ERROR: ${endpoint}`, error.message);
    throw error;
  }
};

// === GOVERNMENT PORTAL APIs ===
// SDK decides what to cache based on frequency/recency analysis

// Dashboard statistics - SDK will cache after frequency threshold
export const fetchDashboardStats = async () => {
  const [users, posts] = await Promise.all([
    apiRequest('/users'),
    apiRequest('/posts')
  ]);
  
  return {
    totalServices: users.length * 15,
    activeApplications: Math.floor(posts.length / 10),
    pendingActions: Math.floor(users.length / 3),
    completedThisMonth: Math.floor(posts.length / 12),
    lastUpdated: new Date().toLocaleString()
  };
};

// User profile - Marked as 'high' priority in SDK config, caches immediately
export const fetchUserProfile = async (userId = 1) => {
  const user = await apiRequest(`/users/${userId}`);
  
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

// User benefits - SDK caches based on access patterns
export const fetchBenefits = async (userId = 1) => {
  const albums = await apiRequest(`/users/${userId}/albums`);
  
  const benefitTypes = [
    { name: 'Healthcare Coverage', icon: '🏥', category: 'Health', monthly: true },
    { name: 'Education Grant', icon: '🎓', category: 'Education', monthly: false },
    { name: 'Housing Assistance', icon: '🏠', category: 'Housing', monthly: true },
    { name: 'Child Care Support', icon: '👶', category: 'Family', monthly: true },
    { name: 'Transportation Subsidy', icon: '🚌', category: 'Transport', monthly: true },
    { name: 'Food Assistance', icon: '🍞', category: 'Food', monthly: true },
    { name: 'Unemployment Benefits', icon: '💼', category: 'Employment', monthly: true }
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

// User applications - SDK caches based on access patterns
export const fetchApplications = async (userId = 1) => {
  const todos = await apiRequest(`/users/${userId}/todos`);
  
  const appTypes = [
    { type: 'Driver License Renewal', icon: '🚗', dept: 'DMV' },
    { type: 'Building Permit', icon: '🏗️', dept: 'Planning' },
    { type: 'Business License', icon: '💼', dept: 'Commerce' },
    { type: 'Passport Renewal', icon: '✈️', dept: 'State' },
    { type: 'Marriage Certificate', icon: '💍', dept: 'Vital Records' },
    { type: 'Property Tax Appeal', icon: '🏛️', dept: 'Treasury' },
    { type: 'Zoning Variance', icon: '📐', dept: 'Planning' },
    { type: 'Pet License', icon: '🐕', dept: 'Animal Control' }
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

// Available services - SDK caches based on access patterns
export const fetchServices = async () => {
  const users = await apiRequest('/users');
  
  const serviceCategories = [
    { name: 'Transportation', icon: '🚗', services: ['Driver License', 'Vehicle Registration', 'Transit Pass'] },
    { name: 'Health', icon: '🏥', services: ['Health Insurance', 'Vaccination Records', 'Medical Assistance'] },
    { name: 'Business', icon: '💼', services: ['Business License', 'Tax ID', 'Permits'] },
    { name: 'Housing', icon: '🏠', services: ['Housing Assistance', 'Property Records', 'Zoning'] },
    { name: 'Education', icon: '🎓', services: ['School Enrollment', 'Scholarships', 'Student Aid'] },
    { name: 'Family', icon: '👶', services: ['Birth Certificate', 'Marriage License', 'Child Care'] }
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

// User documents - SDK caches based on access patterns
export const fetchDocuments = async (userId = 1) => {
  const photos = await apiRequest(`/users/${userId}/photos?_limit=8`);
  
  const docTypes = [
    { name: 'National ID Card', icon: '🆔', type: 'PDF', category: 'Identity' },
    { name: 'Driver License', icon: '🚗', type: 'PDF', category: 'Identity' },
    { name: 'Tax Return 2023', icon: '📊', type: 'PDF', category: 'Tax' },
    { name: 'Health Insurance Card', icon: '🏥', type: 'PDF', category: 'Health' },
    { name: 'Birth Certificate', icon: '📜', type: 'PDF', category: 'Vital Records' },
    { name: 'Property Deed', icon: '🏠', type: 'PDF', category: 'Property' },
    { name: 'Passport', icon: '✈️', type: 'PDF', category: 'Travel' },
    { name: 'Business License', icon: '💼', type: 'PDF', category: 'Business' }
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

// Real-time news - Marked as 'low' priority in SDK config, NOT cached
export const fetchRealTimeNews = async () => {
  const offset = Math.floor(Math.random() * 95);
  const posts = await apiRequest(`/posts?_start=${offset}&_limit=4`);
  
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

// Real weather - NOT cached (always fetch fresh)
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

// Network performance measurement
export const getNetworkPerformance = async () => {
  const startTime = performance.now();
  try {
    await fetch(`${API_BASE}/posts/1`);
    const latency = performance.now() - startTime;
    
    let quality;
    if (latency < 100) quality = 'Excellent';
    else if (latency < 300) quality = 'Good';
    else if (latency < 800) quality = 'Fair';
    else quality = 'Slow';
    
    return {
      latency: Math.round(latency),
      quality,
      timestamp: new Date().toLocaleString()
    };
  } catch {
    return {
      latency: null,
      quality: 'Offline',
      timestamp: new Date().toLocaleString()
    };
  }
};

// Clear Service Worker cache (for testing)
export const clearCache = async () => {
  try {
    // Clear CacheStorage (used by Service Worker)
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    
    // Also clear localStorage for good measure
    localStorage.clear();
    
    console.log('🗑️ All caches cleared (CacheStorage + localStorage)');
    
    // Notify Service Worker to reset tracking
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      });
    }
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
};
