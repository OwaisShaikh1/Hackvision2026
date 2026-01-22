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
    // Count cached items in localStorage
    const cachedItems = Object.keys(localStorage).filter(key => key.startsWith('api_')).length;
    setCacheStats(prev => ({
      ...prev,
      totalRequests: cachedItems
    }));
  };

  const cachedAPIs = [
    { name: 'Dashboard Stats', icon: '📊', priority: 'high', endpoint: '/users, /posts' },
    { name: 'User Profile', icon: '👤', priority: 'high', endpoint: '/users/1' },
    { name: 'Benefits', icon: '💰', priority: 'normal', endpoint: '/albums' },
    { name: 'Applications', icon: '📝', priority: 'normal', endpoint: '/todos' },
    { name: 'Services', icon: '🎯', priority: 'normal', endpoint: '/users' },
    { name: 'Documents', icon: '📄', priority: 'normal', endpoint: '/photos' }
  ];

  const nonCachedAPIs = [
    { name: 'Real-Time News', icon: '📰', reason: 'Breaking updates', endpoint: '/posts (random)' },
    { name: 'Live Weather', icon: '🌤️', reason: 'Current conditions', endpoint: 'Open-Meteo API' }
  ];

  return (
    <div className="cache-indicator">
      <div className="indicator-header">
        <h3>💾 Cache Status</h3>
        <span className="cache-count">{cacheStats.totalRequests} items</span>
      </div>

      <div className="cache-overview">
        <div className="overview-stat">
          <div className="stat-number cached">{cacheStats.cachedAPIs}</div>
          <div className="stat-text">Cached APIs</div>
        </div>
        <div className="overview-stat">
          <div className="stat-number non-cached">{cacheStats.nonCachedAPIs}</div>
          <div className="stat-text">Non-Cached</div>
        </div>
      </div>

      <div className="api-section">
        <h4>✅ Cached APIs (Instant Load)</h4>
        <div className="api-list">
          {cachedAPIs.map(api => (
            <div key={api.name} className="api-item cached">
              <span className="api-icon">{api.icon}</span>
              <div className="api-details">
                <div className="api-name">{api.name}</div>
                <span className="api-endpoint">{api.endpoint}</span>
              </div>
              <span className="cache-check">⚡</span>
            </div>
          ))}
        </div>
      </div>

      <div className="api-section">
        <h4>🚫 Non-Cached (Always Fresh)</h4>
        <div className="api-list">
          {nonCachedAPIs.map(api => (
            <div key={api.name} className="api-item non-cached">
              <span className="api-icon">{api.icon}</span>
              <div className="api-details">
                <div className="api-name">{api.name}</div>
                <span className="reason-badge">{api.reason}</span>
              </div>
              <span className="cache-check">🌐</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sdk-info">
        <strong>📦 Smart Offline SDK v0.1.4</strong>
        <p>Real APIs with intelligent caching</p>
      </div>
    </div>
  );
};

export default CacheIndicator;
