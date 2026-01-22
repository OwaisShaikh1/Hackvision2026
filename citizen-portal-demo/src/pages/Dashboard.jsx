import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchDashboardStats, fetchRealTimeNews, fetchWeather } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [news, setNews] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsSource, setStatsSource] = useState('');
  const [newsSource, setNewsSource] = useState('');
  const [weatherSource, setWeatherSource] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      // CACHED API calls
      const statsData = await fetchDashboardStats();
      const statsTime = Date.now() - startTime;
      setStats(statsData);
      setStatsSource(statsTime < 200 ? 'cache' : 'network');

      // NOT CACHED API calls (intentionally)
      const newsStart = Date.now();
      const newsData = await fetchRealTimeNews();
      const newsTime = Date.now() - newsStart;
      setNews(newsData);
      setNewsSource(newsTime < 200 ? 'cache' : 'network');

      const weatherStart = Date.now();
      const weatherData = await fetchWeather();
      const weatherTime = Date.now() - weatherStart;
      setWeather(weatherData);
      setWeatherSource(weatherTime < 200 ? 'cache' : 'network');

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample chart data
  const monthlyData = [
    { month: 'Jul', applications: 12 },
    { month: 'Aug', applications: 19 },
    { month: 'Sep', applications: 15 },
    { month: 'Oct', applications: 22 },
    { month: 'Nov', applications: 28 },
    { month: 'Dec', applications: 18 },
    { month: 'Jan', applications: 25 }
  ];

  const serviceUsage = [
    { name: 'Healthcare', value: 35, color: '#8b5cf6' },
    { name: 'Education', value: 25, color: '#3b82f6' },
    { name: 'Housing', value: 20, color: '#10b981' },
    { name: 'Transportation', value: 15, color: '#f59e0b' },
    { name: 'Other', value: 5, color: '#ef4444' }
  ];

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <button onClick={loadData} className="refresh-btn">🔄 Refresh Data</button>
      </div>

      {/* Stats Cards - CACHED */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📋</span>
            <span className={`cache-badge ${statsSource}`}>
              {statsSource === 'cache' ? '⚡ Cached' : '🌐 Network'}
            </span>
          </div>
          <div className="stat-value">{stats?.totalServices || 0}</div>
          <div className="stat-label">Available Services</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📝</span>
            <span className={`cache-badge ${statsSource}`}>
              {statsSource === 'cache' ? '⚡ Cached' : '🌐 Network'}
            </span>
          </div>
          <div className="stat-value">{stats?.activeApplications || 0}</div>
          <div className="stat-label">Active Applications</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">⏰</span>
            <span className={`cache-badge ${statsSource}`}>
              {statsSource === 'cache' ? '⚡ Cached' : '🌐 Network'}
            </span>
          </div>
          <div className="stat-value">{stats?.pendingActions || 0}</div>
          <div className="stat-label">Pending Actions</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">✅</span>
            <span className={`cache-badge ${statsSource}`}>
              {statsSource === 'cache' ? '⚡ Cached' : '🌐 Network'}
            </span>
          </div>
          <div className="stat-value">{stats?.completedThisMonth || 0}</div>
          <div className="stat-label">Completed This Month</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Real-time News - NOT CACHED */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🔴 Real-Time News</h3>
            <span className={`cache-badge ${newsSource}`}>
              {newsSource === 'cache' ? '⚡ Cached' : '🌐 Live Data'}
            </span>
          </div>
          <p className="cache-note">
            ℹ️ This data is NOT cached - requires internet for fresh news updates
          </p>
          {news?.news.map(item => (
            <div key={item.id} className="news-item">
              <div className="news-content">
                <div className="news-title">{item.title}</div>
                <div className="news-meta">
                  <span className="news-category">{item.category}</span>
                  <span className="news-time">{item.time}</span>
                </div>
              </div>
            </div>
          ))}
          <div className="timestamp">Last updated: {news?.timestamp}</div>
          {news?.source && <div className="api-source">{news.source}</div>}
        </div>

        {/* Weather - NOT CACHED */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>🌤️ Current Weather</h3>
            <span className={`cache-badge ${weatherSource}`}>
              {weatherSource === 'cache' ? '⚡ Cached' : '🌐 Live Data'}
            </span>
          </div>
          <p className="cache-note">
            ℹ️ Weather data is NOT cached - requires internet for real-time conditions
          </p>
          <div className="weather-display">
            <div className="weather-temp">{weather?.temperature}°C</div>
            <div className="weather-condition">{weather?.condition}</div>
            <div className="weather-details">
              <div className="weather-humidity">💧 Humidity: {weather?.humidity}%</div>
              <div className="weather-wind">💨 Wind: {weather?.windSpeed} km/h</div>
            </div>
            {weather?.location && (
              <div className="weather-location">📍 {weather.location}</div>
            )}
          </div>
          <div className="timestamp">Last updated: {weather?.timestamp}</div>
          {weather?.source && <div className="api-source">{weather.source}</div>}
        </div>

        {/* Monthly Applications Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>📊 Application Trends (Cached)</h3>
            <span className="cache-badge cache">⚡ Cached</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#667eea" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Service Usage Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>🎯 Service Usage (Cached)</h3>
            <span className="cache-badge cache">⚡ Cached</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={serviceUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {serviceUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
