// Utility functions for priority decisions used by the service worker

function matchesSignificance(url, significance) {
  for (const pattern in significance) {
    if (Object.prototype.hasOwnProperty.call(significance, pattern)) {
      if (url.includes(pattern)) return significance[pattern];
    }
  }
  return null;
}

function isHighPriority(usage, url, config = {}) {
  // Manual significance override
  if (config.significance) {
    const sig = matchesSignificance(url, config.significance);
    if (sig === 'high') return true;
    if (sig === 'low') return false;
  }

  if (!usage) return false;

  const freqThreshold = config.frequencyThreshold ?? 3;
  const recencyThreshold = config.recencyThreshold ?? 24 * 60 * 60 * 1000;

  const frequent = usage.count >= freqThreshold;
  const recent = Date.now() - usage.lastAccessed <= recencyThreshold;

  return frequent || recent;
}

function getEffectiveNetworkQuality(effectiveType, configNetwork = 'auto') {
  if (configNetwork !== 'auto') return configNetwork;
  if (!effectiveType) return 'fast';
  const slowTypes = ['slow-2g', '2g', '3g'];
  return slowTypes.includes(effectiveType) ? 'slow' : 'fast';
}

function shouldSkipBySize(size, config = {}) {
  const max = config.maxResourceSize ?? Infinity;
  if (!size) return false; // unknown size -> don't skip
  return size > max;
}

module.exports = { isHighPriority, getEffectiveNetworkQuality, shouldSkipBySize };
