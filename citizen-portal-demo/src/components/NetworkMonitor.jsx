import React, { useState, useEffect } from 'react';
import { getNetworkPerformance, clearCache } from '../utils/api';
import './NetworkMonitor.css';

const NetworkMonitor = () => {
  const [performance, setPerformance] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkPerformance();
    const interval = setInterval(checkPerformance, 10000); // Check every 10 seconds
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
        <button onClick={checkPerformance} className="refresh-btn-small" title="Refresh">
          🔄
        </button>
      </div>

      {performance && (
        <div className="performance-info">
          <div className="perf-row">
            <span className="perf-label">Connection:</span>
            <span 
              className="perf-value" 
              style={{ color: getQualityColor(performance.quality) }}
            >
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

      <button 
        onClick={handleClearCache} 
        className="clear-cache-btn"
        disabled={refreshing}
      >
        {refreshing ? '♻️ Refreshing...' : '🗑️ Clear Cache & Reload'}
      </button>
    </div>
  );
};

export default NetworkMonitor;
