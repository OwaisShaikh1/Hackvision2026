/**
 * Integration-style tests for SDK initialization logic
 * Tests the config building and validation without browser APIs
 */

const { buildConfig } = require("../src/config.cjs");

describe("SDK Configuration", () => {
  describe("pages and apis configuration", () => {
    test("accepts array of page patterns", () => {
      const config = buildConfig({
        pages: ["/index.html", "/about.html", "/dashboard/"],
      });

      expect(config.pages).toHaveLength(3);
      expect(config.pages).toContain("/index.html");
      expect(config.pages).toContain("/dashboard/");
    });

    test("accepts array of API patterns", () => {
      const config = buildConfig({
        apis: ["https://api.example.com/", "/api/v1/", "/graphql"],
      });

      expect(config.apis).toHaveLength(3);
      expect(config.apis).toContain("/api/v1/");
    });

    test("pages and apis can be used together", () => {
      const config = buildConfig({
        pages: ["/app.html"],
        apis: ["/api/"],
      });

      expect(config.pages).toEqual(["/app.html"]);
      expect(config.apis).toEqual(["/api/"]);
    });
  });

  describe("priority tuning options", () => {
    test("frequencyThreshold controls access count threshold", () => {
      const lowThreshold = buildConfig({ frequencyThreshold: 2 });
      const highThreshold = buildConfig({ frequencyThreshold: 100 });

      expect(lowThreshold.frequencyThreshold).toBe(2);
      expect(highThreshold.frequencyThreshold).toBe(100);
    });

    test("recencyThreshold accepts milliseconds", () => {
      const oneHour = 60 * 60 * 1000;
      const config = buildConfig({ recencyThreshold: oneHour });

      expect(config.recencyThreshold).toBe(oneHour);
    });

    test("maxResourceSize limits cached resource size", () => {
      const oneMB = 1024 * 1024;
      const config = buildConfig({ maxResourceSize: oneMB });

      expect(config.maxResourceSize).toBe(oneMB);
    });

    test("networkQuality accepts valid options", () => {
      expect(buildConfig({ networkQuality: "auto" }).networkQuality).toBe(
        "auto",
      );
      expect(buildConfig({ networkQuality: "fast" }).networkQuality).toBe(
        "fast",
      );
      expect(buildConfig({ networkQuality: "slow" }).networkQuality).toBe(
        "slow",
      );
    });

    test("significance allows URL pattern overrides", () => {
      const config = buildConfig({
        significance: {
          "/api/critical": "high",
          "/analytics": "low",
          "/normal": "normal",
        },
      });

      expect(config.significance["/api/critical"]).toBe("high");
      expect(config.significance["/analytics"]).toBe("low");
      expect(config.significance["/normal"]).toBe("normal");
    });
  });

  describe("debug mode", () => {
    test("debug defaults to false", () => {
      const config = buildConfig({});
      expect(config.debug).toBe(false);
    });

    test("debug can be enabled", () => {
      const config = buildConfig({ debug: true });
      expect(config.debug).toBe(true);
    });
  });

  describe("edge cases", () => {
    test("empty config uses all defaults", () => {
      const config = buildConfig();

      expect(config.pages).toEqual([]);
      expect(config.apis).toEqual([]);
      expect(config.debug).toBe(false);
      expect(config.frequencyThreshold).toBe(3);
      expect(config.recencyThreshold).toBe(24 * 60 * 60 * 1000);
      expect(config.maxResourceSize).toBe(Infinity);
      expect(config.networkQuality).toBe("auto");
      expect(config.significance).toEqual({});
    });

    test("partial config merges with defaults", () => {
      const config = buildConfig({
        pages: ["/app"],
        frequencyThreshold: 10,
      });

      expect(config.pages).toEqual(["/app"]);
      expect(config.frequencyThreshold).toBe(10);
      // Defaults preserved
      expect(config.apis).toEqual([]);
      expect(config.recencyThreshold).toBe(24 * 60 * 60 * 1000);
    });

    test("zero values are preserved (not replaced with defaults)", () => {
      const config = buildConfig({
        frequencyThreshold: 0,
        recencyThreshold: 0,
        maxResourceSize: 0,
      });

      // 0 is falsy but should be preserved via nullish coalescing
      expect(config.frequencyThreshold).toBe(0);
      expect(config.recencyThreshold).toBe(0);
      expect(config.maxResourceSize).toBe(0);
    });
  });
});

describe("URL Pattern Matching Simulation", () => {
  // Simulate how the SW matches URLs against configured patterns
  function urlMatches(url, patterns) {
    return patterns.some((pattern) => url.includes(pattern));
  }

  test("exact path matching", () => {
    const pages = ["/index.html", "/about.html"];

    expect(urlMatches("https://example.com/index.html", pages)).toBe(true);
    expect(urlMatches("https://example.com/contact.html", pages)).toBe(false);
  });

  test("partial path matching", () => {
    const apis = ["/api/v1/"];

    expect(urlMatches("https://example.com/api/v1/users", apis)).toBe(true);
    expect(urlMatches("https://example.com/api/v1/posts/123", apis)).toBe(true);
    expect(urlMatches("https://example.com/api/v2/users", apis)).toBe(false);
  });

  test("external API matching", () => {
    const apis = ["https://jsonplaceholder.typicode.com/"];

    expect(urlMatches("https://jsonplaceholder.typicode.com/posts", apis)).toBe(
      true,
    );
    expect(urlMatches("https://other-api.com/posts", apis)).toBe(false);
  });
});
