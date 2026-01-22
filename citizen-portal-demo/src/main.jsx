import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { SmartOffline } from '@soham20/smart-offline-sdk'

// Initialize Smart Offline SDK with selective caching
// SDK's Service Worker intercepts ALL fetch() calls and makes smart caching decisions
SmartOffline.init({
  pages: [],  // Don't cache page routes - React Router handles client-side routing
  apis: [
    'jsonplaceholder.typicode.com/users',           // Dashboard stats (cached after 2 accesses)
    'jsonplaceholder.typicode.com/posts',           // Dashboard stats & News
    'jsonplaceholder.typicode.com/users/1',         // User profile (high priority)
    'jsonplaceholder.typicode.com/users/1/albums',  // Benefits data
    'jsonplaceholder.typicode.com/users/1/todos',   // Applications data
    'jsonplaceholder.typicode.com/users/1/photos'   // Documents data
  ],
  debug: true,
  frequencyThreshold: 2,    // Cache after 2 accesses
  recencyThreshold: 30 * 60 * 1000, // 30 minutes
  maxResourceSize: 1024 * 1024, // 1MB
  networkQuality: 'auto',
  significance: {
    'users/1/': 'high',       // User profile - cache immediately (note: will match users/1/todos too)
    'users/1/albums': 'high', // Benefits - high priority
    'users': 'normal',        // Users list for dashboard
    'posts': 'low'            // News feed - don't cache (random offset)
  }
});

console.log('✅ SmartOffline SDK initialized - Service Worker intercepts all fetch() calls');
console.log('📦 SDK will cache based on access frequency and recency');
console.log('🎯 High Priority: users/1/* (user profile + data) | Normal: users | Low: posts (random)');
console.log('💡 Open DevTools Console to see detailed cache decision logs!');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
