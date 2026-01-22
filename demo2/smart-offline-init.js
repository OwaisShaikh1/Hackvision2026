/**
 * Smart Offline SDK Integration Script
 * Can be disabled by adding ?disableSDK=true to the URL
 * Or by setting window.DISABLE_SMART_OFFLINE = true before page load
 */

(function() {
  // Check if SDK should be disabled
  const urlParams = new URLSearchParams(window.location.search);
  const isDisabled = urlParams.get('disableSDK') === 'true' || window.DISABLE_SMART_OFFLINE === true;
  
  if (isDisabled) {
    console.log('⚠️ Smart Offline SDK is DISABLED for testing');
    window.SmartOfflineManager = {
      enabled: false,
      getData: async () => null,
      setData: async () => null,
    };
    return;
  }

  console.log('✓ Smart Offline SDK is ENABLED');

  let sdk = null;

  // Try to initialize SDK
  try {
    const SmartOfflineSDK = require('@soham20/smart-offline-sdk');
    sdk = new SmartOfflineSDK();
    console.log('✓ Smart Offline SDK initialized successfully');
  } catch (error) {
    console.warn('⚠️ Smart Offline SDK not available:', error.message);
    console.log('💡 Continuing with network-only mode');
    sdk = null;
  }

  // Public API for managing offline data
  window.SmartOfflineManager = {
    enabled: sdk !== null,
    
    async getData(key) {
      if (!sdk) {
        console.warn(`getData("${key}") - SDK not initialized, returning null`);
        return null;
      }
      try {
        const data = await sdk.getData(key);
        console.log(`✓ Retrieved from cache: ${key}`);
        return data;
      } catch (error) {
        console.error(`Error getting data from SDK (${key}):`, error);
        return null;
      }
    },
    
    async setData(key, value) {
      if (!sdk) {
        console.warn(`setData("${key}") - SDK not initialized, skipping cache`);
        return;
      }
      try {
        await sdk.setData(key, value);
        console.log(`✓ Cached data: ${key}`);
      } catch (error) {
        console.error(`Error setting data in SDK (${key}):`, error);
      }
    },
  };

  // Update network status
  window.updateNetworkStatus = function() {
    const statusEl = document.getElementById('network-status');
    const cacheEl = document.getElementById('cache-indicator');
    
    if (!statusEl) return;
    
    if (navigator.onLine) {
      statusEl.textContent = 'Network: Online';
      statusEl.style.color = '#27ae60';
      if (cacheEl) cacheEl.style.display = 'none';
    } else {
      statusEl.textContent = 'Network: Offline';
      statusEl.style.color = '#e74c3c';
      if (cacheEl) cacheEl.style.display = 'block';
    }
  };

  // Load lessons from lessons.json
  window.loadLessons = async function() {
    const container = document.getElementById('lessons-container');
    if (!container) {
      console.error('lessons-container not found');
      return;
    }

    try {
      window.updateNetworkStatus();
      
      // Try to fetch from network
      const response = await fetch('lessons.json');
      const lessons = await response.json();
      
      // Cache the data if SDK is enabled
      if (window.SmartOfflineManager.enabled) {
        await window.SmartOfflineManager.setData('lessons', lessons);
      }
      
      renderLessons(lessons);
      console.log('✓ Lessons loaded from network');
    } catch (error) {
      console.error('Error loading lessons from network:', error);
      
      // Try to get from cache if SDK is enabled
      if (window.SmartOfflineManager.enabled) {
        try {
          const cachedLessons = await window.SmartOfflineManager.getData('lessons');
          if (cachedLessons) {
            console.log('✓ Using cached lessons');
            renderLessons(cachedLessons);
            return;
          }
        } catch (cacheError) {
          console.error('Cache error:', cacheError);
        }
      }
      
      // Fallback: show error
      container.innerHTML = '<p style="color: red;">Failed to load lessons. Please check your connection.</p>';
    }
  };

  // Render lessons to the page
  window.renderLessons = function(lessons) {
    const container = document.getElementById('lessons-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!Array.isArray(lessons) || lessons.length === 0) {
      container.innerHTML = '<p>No lessons available.</p>';
      return;
    }
    
    lessons.forEach(lesson => {
      const articleEl = document.createElement('article');
      articleEl.style.marginBottom = '20px';
      articleEl.innerHTML = `
        <h2>${lesson.title}</h2>
        ${lesson.image ? `<img src="${lesson.image}" alt="${lesson.title}" style="max-width: 100%; height: auto;">` : ''}
        <p>${lesson.content.replace(/\n/g, '<br>')}</p>
        <p style="color: #666; font-size: 0.9em;">Significance: <strong>${lesson.significance}</strong></p>
      `;
      container.appendChild(articleEl);
    });
  };

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', window.loadLessons);
  
  // Update network status on online/offline events
  window.addEventListener('online', window.updateNetworkStatus);
  window.addEventListener('offline', window.updateNetworkStatus);
  
  // Initial status update
  window.updateNetworkStatus();

})();
