/**
 * Tests for network quality and size-based caching decisions
 */

const {
  getEffectiveNetworkQuality,
  shouldSkipBySize,
  isHighPriority,
} = require("../src/priority.cjs");

describe("Network Quality Detection", () => {
  describe("getEffectiveNetworkQuality", () => {
    test('returns "fast" for 4g connections in auto mode', () => {
      expect(getEffectiveNetworkQuality("4g", "auto")).toBe("fast");
    });

    test('returns "slow" for 2g connections in auto mode', () => {
      expect(getEffectiveNetworkQuality("2g", "auto")).toBe("slow");
      expect(getEffectiveNetworkQuality("slow-2g", "auto")).toBe("slow");
    });

    test('returns "slow" for 3g connections in auto mode', () => {
      expect(getEffectiveNetworkQuality("3g", "auto")).toBe("slow");
    });

    test("manual override takes precedence over auto detection", () => {
      // Even on 2g, if developer says "fast", use fast
      expect(getEffectiveNetworkQuality("2g", "fast")).toBe("fast");

      // Even on 4g, if developer says "slow", use slow
      expect(getEffectiveNetworkQuality("4g", "slow")).toBe("slow");
    });

    test('returns "fast" when connection type unknown in auto mode', () => {
      expect(getEffectiveNetworkQuality(null, "auto")).toBe("fast");
      expect(getEffectiveNetworkQuality(undefined, "auto")).toBe("fast");
    });
  });
});

describe("Resource Size Limits", () => {
  describe("shouldSkipBySize", () => {
    test("skips resources larger than maxResourceSize", () => {
      const config = { maxResourceSize: 1024 * 1024 }; // 1MB

      expect(shouldSkipBySize(2 * 1024 * 1024, config)).toBe(true); // 2MB - skip
      expect(shouldSkipBySize(512 * 1024, config)).toBe(false); // 512KB - cache
    });

    test("does not skip when size equals limit", () => {
      const config = { maxResourceSize: 1000 };
      expect(shouldSkipBySize(1000, config)).toBe(false);
    });

    test("does not skip when size is unknown (0 or null)", () => {
      const config = { maxResourceSize: 1000 };
      expect(shouldSkipBySize(0, config)).toBe(false);
      expect(shouldSkipBySize(null, config)).toBe(false);
    });

    test("uses Infinity as default when maxResourceSize not set", () => {
      const config = {};
      expect(shouldSkipBySize(999999999, config)).toBe(false);
    });
  });
});

describe("Combined Caching Decisions", () => {
  test("slow network + low priority = should skip caching", () => {
    const networkQuality = getEffectiveNetworkQuality("2g", "auto");
    const usage = { url: "/data", count: 1, lastAccessed: 0 };
    const config = { frequencyThreshold: 5, recencyThreshold: 1000 };

    const isSlowNetwork = networkQuality === "slow";
    const highPriority = isHighPriority(usage, "/data", config);

    expect(isSlowNetwork).toBe(true);
    expect(highPriority).toBe(false);

    // Logic: On slow network, skip caching if not high priority
    const shouldSkip = isSlowNetwork && !highPriority;
    expect(shouldSkip).toBe(true);
  });

  test("slow network + high priority = should cache", () => {
    const networkQuality = getEffectiveNetworkQuality("2g", "auto");
    const config = {
      frequencyThreshold: 5,
      significance: { "/critical": "high" },
    };

    const isSlowNetwork = networkQuality === "slow";
    const highPriority = isHighPriority(null, "/critical/api", config);

    expect(isSlowNetwork).toBe(true);
    expect(highPriority).toBe(true);

    const shouldSkip = isSlowNetwork && !highPriority;
    expect(shouldSkip).toBe(false);
  });

  test("fast network + low priority = should cache", () => {
    const networkQuality = getEffectiveNetworkQuality("4g", "auto");
    const usage = { url: "/data", count: 1, lastAccessed: 0 };
    const config = { frequencyThreshold: 5, recencyThreshold: 1000 };

    const isSlowNetwork = networkQuality === "slow";
    const highPriority = isHighPriority(usage, "/data", config);

    expect(isSlowNetwork).toBe(false);
    expect(highPriority).toBe(false);

    // On fast network, cache everything regardless of priority
    const shouldSkip = isSlowNetwork && !highPriority;
    expect(shouldSkip).toBe(false);
  });
});
