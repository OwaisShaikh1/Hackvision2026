const { isHighPriority, getEffectiveNetworkQuality, shouldSkipBySize } = require('../src/priority.cjs');

describe('priority utilities', () => {
  test('isHighPriority returns false when no usage', () => {
    const config = { frequencyThreshold: 2 };
    expect(isHighPriority(null, '/api/x', config)).toBe(false);
  });

  test('isHighPriority respects frequency threshold', () => {
    const usage = { url: '/a', count: 5, lastAccessed: Date.now() - 1000 };
    const config = { frequencyThreshold: 4 };
    expect(isHighPriority(usage, '/a', config)).toBe(true);
  });

  test('isHighPriority respects recency threshold', () => {
    const usage = { url: '/a', count: 1, lastAccessed: Date.now() - (1 * 60 * 60 * 1000) }; // 1h ago
    const config = { recencyThreshold: 2 * 60 * 60 * 1000 }; // 2h
    expect(isHighPriority(usage, '/a', config)).toBe(true);
  });

  test('significance overrides high', () => {
    const usage = { url: '/api/critical', count: 0, lastAccessed: 0 };
    const config = { significance: { '/api/critical': 'high' } };
    expect(isHighPriority(usage, '/api/critical', config)).toBe(true);
  });

  test('significance overrides low', () => {
    const usage = { url: '/api/analytics', count: 1000, lastAccessed: 0 };
    const config = { significance: { '/api/analytics': 'low' }, frequencyThreshold: 1 };
    // low should short-circuit to false even if frequent
    expect(isHighPriority(usage, '/api/analytics', config)).toBe(false);
  });

  test('getEffectiveNetworkQuality manual override', () => {
    expect(getEffectiveNetworkQuality('3g', 'fast')).toBe('fast');
  });

  test('getEffectiveNetworkQuality maps 3g->slow when auto', () => {
    expect(getEffectiveNetworkQuality('3g', 'auto')).toBe('slow');
    expect(getEffectiveNetworkQuality('4g', 'auto')).toBe('fast');
  });

  test('shouldSkipBySize returns true when size > max', () => {
    const config = { maxResourceSize: 100 };
    expect(shouldSkipBySize(200, config)).toBe(true);
    expect(shouldSkipBySize(50, config)).toBe(false);
  });
});
