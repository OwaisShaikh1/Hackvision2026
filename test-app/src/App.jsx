import { useState, useEffect } from 'react'
import { SmartOffline } from '@soham20/smart-offline-sdk'

function App() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [sdkInitialized, setSdkInitialized] = useState(false)
  const [cacheInfo, setCacheInfo] = useState(null)

  // Initialize SDK on mount
  useEffect(() => {
    try {
      SmartOffline.init({
        pages: ['/'],
        apis: ['https://jsonplaceholder.typicode.com/'],
        debug: true,
        frequencyThreshold: 2,
        recencyThreshold: 60 * 60 * 1000, // 1 hour
        maxResourceSize: 5 * 1024 * 1024, // 5MB
        networkQuality: 'auto'
      })
      setSdkInitialized(true)
      console.log('✅ SmartOffline SDK initialized')
    } catch (err) {
      console.error('Failed to initialize SDK:', err)
      setError('SDK initialization failed')
    }
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchPosts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setPosts(data)
      console.log('✅ Data fetched:', isOnline ? 'from network' : 'from cache')
    } catch (err) {
      setError(err.message)
      console.error('❌ Fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users?_limit=3')
      const data = await response.json()
      
      // Convert to posts format for display
      setPosts(data.map(user => ({
        id: user.id,
        title: user.name,
        body: `${user.email} - ${user.company.name}`
      })))
      console.log('✅ Users fetched:', isOnline ? 'from network' : 'from cache')
    } catch (err) {
      setError(err.message)
      console.error('❌ Fetch failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearData = () => {
    setPosts([])
    setError(null)
  }

  const testOffline = () => {
    alert(
      '🧪 To test offline mode:\n\n' +
      '1. Click "Fetch Posts" to cache data\n' +
      '2. Open DevTools (F12)\n' +
      '3. Go to Network tab\n' +
      '4. Change "Online" to "Offline"\n' +
      '5. Click "Fetch Posts" again\n' +
      '6. Data should load from cache!'
    )
  }

  const checkCache = async () => {
    try {
      const cacheNames = await window.caches.keys()
      const smartOfflineCache = cacheNames.find(name => name.includes('smart-offline'))
      
      if (smartOfflineCache) {
        const cache = await window.caches.open(smartOfflineCache)
        const keys = await cache.keys()
        setCacheInfo({
          cacheName: smartOfflineCache,
          entries: keys.length,
          urls: keys.map(req => req.url)
        })
      } else {
        setCacheInfo({ cacheName: 'None', entries: 0, urls: [] })
      }
    } catch (err) {
      console.error('Failed to check cache:', err)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🚀 SmartOffline SDK Test App</h1>
        <p>Test offline-first caching with intelligent priority management</p>
      </div>

      <div className="status-card">
        <h3>Status</h3>
        <span className={`status-badge ${isOnline ? 'status-online' : 'status-offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
        {sdkInitialized && (
          <span className="status-badge status-online" style={{ marginLeft: '10px' }}>
            ✅ SDK Ready
          </span>
        )}
      </div>

      <div className="controls">
        <h3>Actions</h3>
        <div className="button-group">
          <button className="btn-primary" onClick={fetchPosts} disabled={loading}>
            {loading ? '⏳ Loading...' : '📝 Fetch Posts'}
          </button>
          <button className="btn-success" onClick={fetchUsers} disabled={loading}>
            👥 Fetch Users
          </button>
          <button className="btn-warning" onClick={checkCache}>
            💾 Check Cache
          </button>
          <button className="btn-danger" onClick={clearData}>
            🗑️ Clear Display
          </button>
        </div>
        
        <div className="instructions">
          <strong>🧪 How to Test Offline Mode:</strong>
          <ol>
            <li>Click "Fetch Posts" to load and cache data</li>
            <li>Open DevTools (F12) → Network tab</li>
            <li>Change "Online" dropdown to "Offline"</li>
            <li>Click "Fetch Posts" again - data loads from cache!</li>
            <li>Check browser console for debug logs</li>
          </ol>
        </div>
      </div>

      {error && (
        <div className="data-card">
          <div className="error">
            <strong>❌ Error:</strong> {error}
            {!isOnline && <p style={{ marginTop: '10px' }}>You're offline. Try clicking the fetch button again to load cached data.</p>}
          </div>
        </div>
      )}

      {cacheInfo && (
        <div className="data-card">
          <h3>💾 Cache Info</h3>
          <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
            <p><strong>Cache Name:</strong> {cacheInfo.cacheName}</p>
            <p><strong>Cached Entries:</strong> {cacheInfo.entries}</p>
            {cacheInfo.urls.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#667eea' }}>Show cached URLs</summary>
                <ul style={{ marginTop: '10px', fontSize: '12px' }}>
                  {cacheInfo.urls.map((url, i) => (
                    <li key={i} style={{ wordBreak: 'break-all', marginBottom: '5px' }}>{url}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        </div>
      )}

      {loading && <div className="loading">⏳ Loading data...</div>}

      {posts.length > 0 && !loading && (
        <div className="data-card">
          <h3>📊 Data ({isOnline ? 'Live from API' : 'From Cache'})</h3>
          {posts.map(post => (
            <div key={post.id} className="data-item">
              <h4>{post.title}</h4>
              <p>{post.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
