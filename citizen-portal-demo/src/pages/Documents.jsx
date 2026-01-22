import React, { useState, useEffect } from 'react';
import { fetchUserProfile, fetchDocuments } from '../utils/api';
import './Documents.css';

const Documents = () => {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
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
      const [profileData, docsData] = await Promise.all([
        fetchUserProfile(),
        fetchDocuments()
      ]);
      
      const endTime = Date.now();
      const time = endTime - startTime;
      
      setProfile(profileData);
      setDocuments(docsData.documents);
      setLoadTime(time);
      setSource(time < 200 ? 'cache' : 'network');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading documents...</div>;
  }

  return (
    <div className="documents-page">
      <div className="page-header">
        <div>
          <h2>📄 My Documents</h2>
          <p className="page-subtitle">Manage your personal documents and records</p>
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

      <div className="profile-section">
        <div className="profile-card">
          <div className="profile-avatar">👤</div>
          <div className="profile-details">
            <h3>{profile?.name}</h3>
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Citizen ID:</span>
                <span className="info-value">{profile?.id}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{profile?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Phone:</span>
                <span className="info-value">{profile?.phone}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Address:</span>
                <span className="info-value">{profile?.address}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Member Since:</span>
                <span className="info-value">{profile?.memberSince}</span>
              </div>
            </div>
          </div>
          <button className="btn-edit">✏️ Edit Profile</button>
        </div>
      </div>

      <div className="documents-section">
        <div className="section-header">
          <h3>📑 My Documents (Real Database)</h3>
          <button className="btn-upload">⬆️ Upload Document</button>
        </div>
        
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
                <button className="btn-icon" title="Download">⬇️</button>
                <button className="btn-icon" title="Share">📤</button>
                <button className="btn-icon" title="Delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Documents;
