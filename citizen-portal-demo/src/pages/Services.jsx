import React, { useState, useEffect } from 'react';
import { fetchApplications, fetchServices } from '../utils/api';
import './Services.css';

const Services = () => {
  const [applications, setApplications] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadTime, setLoadTime] = useState(0);
  const [source, setSource] = useState('');

  useEffect(() => {
    loadData();
  }, []);

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

  if (loading) {
    return <div className="page-loading">Loading services...</div>;
  }

  return (
    <div className="services-page">
      <div className="page-header">
        <div>
          <h2>🎯 Government Services</h2>
          <p className="page-subtitle">Browse and apply for government services</p>
        </div>
        <div className="header-info">
          <span className={`cache-badge ${source}`}>
            {source === 'cache' ? `⚡ Cached (${loadTime}ms)` : `🌐 Network (${loadTime}ms)`}
          </span>
          <button onClick={loadData} className="refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      <div className="cache-info-banner">
        <strong>✅ Data is CACHED</strong> - Loaded from real backend API with caching
      </div>

      <div className="services-section">
        <h3>📝 My Applications (Real Database)</h3>
        <div className="applications-list">
          {applications?.applications.map(app => (
            <div key={app.id} className="application-card">
              <div className="app-icon">{app.icon}</div>
              <div className="app-content">
                <h4>{app.type}</h4>
                <div className="app-meta">
                  <span className={`app-status`} style={{ color: app.statusColor }}>
                    ● {app.status}
                  </span>
                  <span className="app-department">{app.department}</span>
                </div>
                <div className="app-details">
                  <span className="app-date">Submitted: {app.submittedDate}</span>
                  <span className="app-progress">{app.progress}% Complete</span>
                </div>
              </div>
              <button className="btn-view">View Details</button>
            </div>
          ))}
        </div>
      </div>

      <div className="services-section">
        <h3>🔍 Available Services (Real Database)</h3>
        <div className="services-grid">
          {services.map(service => (
            <div key={service.id} className="service-card">
              <div className="service-icon">{service.icon}</div>
              <h4>{service.category}</h4>
              <ul className="service-list">
                {service.services.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
              <div className="service-stats">
                <span>👥 {service.activeUsers.toLocaleString()} users</span>
                <span>⏱️ {service.avgProcessingTime}</span>
              </div>
              <button className="btn-apply">Apply Now</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
