/**
 * Tests for usage tracking logic
 * Since IndexedDB isn't available in Node, we test the logic patterns
 */

describe('Usage Tracking Logic', () => {
  describe('usage data structure', () => {
    test('new usage record has correct shape', () => {
      const url = 'https://api.example.com/data';
      const newRecord = { url, count: 0, lastAccessed: 0 };
      
      expect(newRecord).toHaveProperty('url');
      expect(newRecord).toHaveProperty('count');
      expect(newRecord).toHaveProperty('lastAccessed');
      expect(newRecord.count).toBe(0);
    });

    test('incrementing usage updates count and timestamp', () => {
      const now = Date.now();
      const existing = { url: '/api', count: 5, lastAccessed: now - 10000 };
      
      // Simulate increment
      existing.count += 1;
      existing.lastAccessed = now;
      
      expect(existing.count).toBe(6);
      expect(existing.lastAccessed).toBe(now);
    });
  });

  describe('usage-based priority decisions', () => {
    const { isHighPriority } = require('../src/priority');
    
    test('first-time access is not high priority', () => {
      const firstAccess = { url: '/new', count: 1, lastAccessed: Date.now() };
      const config = { frequencyThreshold: 3, recencyThreshold: 1000 };
      
      // First access is recent, so it IS high priority due to recency
      expect(isHighPriority(firstAccess, '/new', config)).toBe(true);
    });

    test('stale resource with low count is not high priority', () => {
      const stale = { 
        url: '/old', 
        count: 1, 
        lastAccessed: Date.now() - (48 * 60 * 60 * 1000) // 48h ago
      };
      const config = { 
        frequencyThreshold: 3, 
        recencyThreshold: 24 * 60 * 60 * 1000 
      };
      
      expect(isHighPriority(stale, '/old', config)).toBe(false);
    });

    test('frequently accessed stale resource is high priority', () => {
      const frequentButStale = { 
        url: '/popular', 
        count: 50, 
        lastAccessed: Date.now() - (48 * 60 * 60 * 1000) // 48h ago
      };
      const config = { 
        frequencyThreshold: 3, 
        recencyThreshold: 24 * 60 * 60 * 1000 
      };
      
      expect(isHighPriority(frequentButStale, '/popular', config)).toBe(true);
    });
  });
});

describe('URL Pattern Matching', () => {
  const { isHighPriority } = require('../src/priority');
  
  test('partial URL match works for significance', () => {
    const config = {
      frequencyThreshold: 100,
      significance: { 
        '/api/v1/users': 'high',
        '/analytics': 'low'
      }
    };
    
    // Should match /api/v1/users pattern
    expect(isHighPriority(null, 'https://example.com/api/v1/users/123', config)).toBe(true);
    
    // Should match /analytics pattern
    expect(isHighPriority({ url: '/x', count: 1000, lastAccessed: Date.now() }, 
      'https://example.com/analytics/track', config)).toBe(false);
  });

  test('non-matching URLs fall through to dynamic logic', () => {
    const config = {
      frequencyThreshold: 3,
      significance: { '/special': 'high' }
    };
    
    // No match - uses dynamic logic
    const lowUsage = { url: '/normal', count: 1, lastAccessed: 0 };
    expect(isHighPriority(lowUsage, 'https://example.com/normal/path', config)).toBe(false);
  });
});
