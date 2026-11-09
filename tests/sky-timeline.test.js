import test from "node:test";
import assert from "node:assert/strict";

import { calculateSkyTrend, formatTrendRate } from "../js/sky-timeline.js";

function observation(timestamp, overrides = {}) {
  return {
    timestamp,
    cloudId: "cumulus",
    heading: 220,
    metrics: {
      coverage: 0.3,
      edgeDensity: 0.35,
      variance: 0.4,
      darkness: 0.08,
      meanLuminance: 0.65,
      ...overrides,
    },
  };
}

test("requires at least two timeline observations", () => {
  const now = Date.now();
  const trend = calculateSkyTrend([observation(now)], now);
  assert.equal(trend.status, "insufficient");
});

test("detects rapid sky development over time", () => {
  const now = Date.now();
  const trend = calculateSkyTrend(
    [
      observation(now - 15 * 60_000, { coverage: 0.18, meanLuminance: 0.72 }),
      observation(now, {
        coverage: 0.52,
        edgeDensity: 0.72,
        variance: 0.68,
        darkness: 0.24,
        meanLuminance: 0.48,
      }),
    ],
    now,
  );

  assert.equal(trend.status, "rapid");
  assert.ok(trend.coverageRate > 1);
  assert.equal(trend.comparable, true);
});

test("marks observations in different directions as uncertain", () => {
  const now = Date.now();
  const first = observation(now - 15 * 60_000);
  const latest = observation(now, { coverage: 0.45 });
  latest.heading = 40;

  const trend = calculateSkyTrend([first, latest], now);
  assert.equal(trend.status, "uncertain");
  assert.equal(trend.comparable, false);
});

test("formats normalized trend rates for the interface", () => {
  assert.equal(formatTrendRate(0.126), "+13 %/h");
  assert.equal(formatTrendRate(-0.08), "-8 %/h");
});
