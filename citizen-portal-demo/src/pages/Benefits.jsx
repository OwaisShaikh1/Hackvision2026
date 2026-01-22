import React, { useState, useEffect } from 'react';
import { fetchBenefits } from '../utils/api';
import './Benefits.css';

const Benefits = () => {
  const [benefitsData, setBenefitsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadTime, setLoadTime] = useState(0);
  const [source, setSource] = useState('');

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const data = await fetchBenefits();
      const endTime = Date.now();
      const time = endTime - startTime;
      
      setBenefitsData(data);
      setLoadTime(time);
      setSource(time < 200 ? 'cache' : 'network');
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading benefits...</div>;
  }

  return (
    <div className="benefits-page">
      <div className="page-header">
        <div>
          <h2>💰 My Benefits</h2>
          <p className="page-subtitle">Your active government benefits and assistance programs</p>
        </div>
        <div className="header-info">
          <span className={`cache-badge ${source}`}>
            {source === 'cache' ? `⚡ Cached (${loadTime}ms)` : `🌐 Network (${loadTime}ms)`}
          </span>
          <button onClick={loadBenefits} className="refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      <div className="benefits-summary">
        <div className="summary-card">
          <div className="summary-icon">💵</div>
          <div className="summary-content">
            <div className="summary-label">Total Monthly Benefits</div>
            <div className="summary-value">${benefitsData?.totalMonthly.toLocaleString()}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📋</div>
          <div className="summary-content">
            <div className="summary-label">Active Programs</div>
            <div className="summary-value">{benefitsData?.benefits.filter(b => b.status === 'Active').length}</div>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <div className="summary-label">Pending Applications</div>
            <div className="summary-value">{benefitsData?.benefits.filter(b => b.status === 'Pending').length}</div>
          </div>
        </div>
      </div>

      <div className="cache-info-banner">
        <strong>✅ This data is CACHED</strong> - Even without internet, you can view your benefits information instantly!
        <br/>Load time: <strong>{loadTime}ms</strong> {source === 'cache' ? '(from cache)' : '(from network)'}
      </div>

      <div className="benefits-list">
        {benefitsData?.benefits.map(benefit => (
          <div key={benefit.id} className="benefit-card">
            <div className="benefit-icon">{benefit.icon}</div>
            <div className="benefit-content">
              <div className="benefit-header">
                <h3>{benefit.name}</h3>
                <span className={`status-badge ${benefit.status.toLowerCase().replace(' ', '-')}`}>
                  {benefit.status}
                </span>
              </div>
              <div className="benefit-amount">{benefit.amount}</div>
              <div className="benefit-actions">
                <button className="btn-secondary">View Details</button>
                <button className="btn-primary">Manage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Benefits;
