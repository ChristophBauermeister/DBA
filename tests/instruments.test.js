import test from "node:test";
import assert from "node:assert/strict";

import {
  assessCrosswind,
  calculatePressureTrend,
  classifyPressureChange,
  lightningDistance,
  signedAngleDifference,
} from "../js/instruments.js";

test("normalizes pressure changes to a three-hour trend", () => {
  const start = Date.UTC(2026, 6, 17, 12);
  const trend = calculatePressureTrend([
    { timestamp: start, pressure: 1015.2 },
    { timestamp: start + 2 * 3_600_000, pressure: 1013.2 },
  ]);

  assert.equal(trend.pressure, 1013.2);
  assert.equal(trend.change3h, -3);
  assert.equal(classifyPressureChange(trend.change3h).trend, "falling");
});

test("requires enough elapsed time for a pressure tendency", () => {
  const now = Date.now();
  assert.equal(
    calculatePressureTrend([
      { timestamp: now, pressure: 1012 },
      { timestamp: now + 5 * 60_000, pressure: 1011.9 },
    ]),
    null,
  );
});

test("converts flash-to-thunder seconds into distance", () => {
  assert.ok(Math.abs(lightningDistance(3) - 1.029) < 0.0001);
});

test("handles compass angles across north", () => {
  assert.equal(signedAngleDifference(355, 5), 10);
  assert.equal(signedAngleDifference(5, 355), -10);
});

test("mirrors the crosswind rule between hemispheres", () => {
  const north = assessCrosswind(270, 0, "north");
  const south = assessCrosswind(270, 0, "south");

  assert.equal(north.level, "caution");
  assert.equal(south.level, "safe");
});
