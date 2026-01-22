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
        <div className="header-top">
          <div className="logo-section">
            <h1 className="logo">🏛️ CitizenConnect</h1>
            <p className="tagline">Government Services Portal</p>
          </div>
          <div className="header-right">
            <div className={`network-badge ${isOnline ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <div className="user-info">
              <span>👤 John Citizen</span>
            </div>
          </div>
        </div>
        <nav className="nav">
          <Link to="/dashboard" className={location.pathname === '/dashboard' || location.pathname === '/' ? 'active' : ''}>
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
