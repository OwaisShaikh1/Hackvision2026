// Build sdk config object with defaults. Used by tests to validate defaults.
function buildConfig(input = {}) {
  return {
    pages: input.pages || [],
    apis: input.apis || [],
    debug: input.debug || false,

    frequencyThreshold: input.frequencyThreshold ?? 3,
    recencyThreshold: input.recencyThreshold ?? 24 * 60 * 60 * 1000,
    maxResourceSize: input.maxResourceSize ?? Infinity,
    networkQuality: input.networkQuality ?? 'auto',
    significance: input.significance || {},
  };
}

module.exports = { buildConfig };
