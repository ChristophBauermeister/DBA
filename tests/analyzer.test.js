import test from "node:test";
import assert from "node:assert/strict";

import { classifyMetrics, extractImageMetrics } from "../js/analyzer.js";

function solidImage(red, green, blue, width = 12, height = 12) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < data.length; index += 4) {
    data[index] = red;
    data[index + 1] = green;
    data[index + 2] = blue;
    data[index + 3] = 255;
  }
  return { data, width, height };
}

test("extracts a clear blue sky as mostly blue with little cloud cover", () => {
  const metrics = extractImageMetrics(solidImage(72, 145, 210));

  assert.ok(metrics.blueRatio > 0.9);
  assert.equal(metrics.coverage, 0);
  assert.ok(metrics.quality > 0.9);
});

test("classifies a uniform grey layer as stratus", () => {
  const result = classifyMetrics({
    coverage: 1,
    edgeDensity: 0.03,
    variance: 0.04,
    darkness: 0.03,
    brightness: 0.05,
    blueRatio: 0,
    greyRatio: 0.96,
    meanLuminance: 0.58,
    quality: 0.9,
  });

  assert.equal(result.cloudId, "stratus");
  assert.ok(result.confidence >= 60);
});

test("classifies a bright structured cloud field as cumulus", () => {
  const result = classifyMetrics({
    coverage: 0.42,
    edgeDensity: 0.74,
    variance: 0.64,
    darkness: 0.02,
    brightness: 0.46,
    blueRatio: 0.41,
    greyRatio: 0.5,
    meanLuminance: 0.63,
    quality: 0.95,
  });

  assert.equal(result.cloudId, "cumulus");
});

test("classifies dark high-contrast cloud mass as cumulonimbus", () => {
  const result = classifyMetrics(
    {
      coverage: 0.72,
      edgeDensity: 0.84,
      variance: 0.82,
      darkness: 0.39,
      brightness: 0.16,
      blueRatio: 0.12,
      greyRatio: 0.72,
      meanLuminance: 0.36,
      quality: 0.88,
    },
    { windTrend: "rising", darkHorizon: true },
  );

  assert.equal(result.cloudId, "cumulonimbus");
});

test("uses falling pressure as supporting evidence, not a replacement for pixels", () => {
  const metrics = {
    coverage: 0.5,
    edgeDensity: 0.2,
    variance: 0.2,
    darkness: 0.12,
    brightness: 0.3,
    blueRatio: 0.26,
    greyRatio: 0.68,
    meanLuminance: 0.56,
    quality: 0.8,
  };
  const baseline = classifyMetrics(metrics);
  const falling = classifyMetrics(metrics, { pressureTrend: "falling" });

  assert.equal(
    falling.scores.cirrostratus - baseline.scores.cirrostratus,
    0.2,
  );
  assert.ok(falling.confidence >= 38 && falling.confidence <= 92);
});
