const { buildConfig } = require('../src/config');

describe('buildConfig', () => {
  test('defaults are set', () => {
    const cfg = buildConfig();
    expect(cfg.pages).toEqual([]);
    expect(cfg.apis).toEqual([]);
    expect(cfg.debug).toBe(false);
    expect(cfg.frequencyThreshold).toBe(3);
    expect(cfg.recencyThreshold).toBe(24 * 60 * 60 * 1000);
    expect(cfg.maxResourceSize).toBe(Infinity);
    expect(cfg.networkQuality).toBe('auto');
    expect(cfg.significance).toEqual({});
  });

  test('overrides applied', () => {
    const input = {
      pages: ['/x'],
      apis: ['/api/'],
      debug: true,
      frequencyThreshold: 10,
      recencyThreshold: 500,
      maxResourceSize: 1024,
      networkQuality: 'slow',
      significance: { '/a': 'high' },
    };
    const cfg = buildConfig(input);
    expect(cfg.pages).toEqual(['/x']);
    expect(cfg.apis).toEqual(['/api/']);
    expect(cfg.debug).toBe(true);
    expect(cfg.frequencyThreshold).toBe(10);
    expect(cfg.recencyThreshold).toBe(500);
    expect(cfg.maxResourceSize).toBe(1024);
    expect(cfg.networkQuality).toBe('slow');
    expect(cfg.significance).toEqual({ '/a': 'high' });
  });
});
