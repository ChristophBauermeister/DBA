import test from "node:test";
import assert from "node:assert/strict";

import { buildSafetyAssessment } from "../js/safety-engine.js";

test("never labels a quiet image as an all-clear", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "cumulus",
    imageConfidence: 82,
    context: { windTrend: "steady", pressureTrend: "unknown" },
  });

  assert.equal(assessment.level, "observe");
  assert.match(assessment.summary, /keine Entwarnung/i);
  assert.ok(assessment.actions.some((action) => action.includes("Seewetterbericht")));
});

test("nearby lightning overrides a harmless-looking image", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "cumulus",
    imageConfidence: 88,
    instruments: { lightningDistance: 3.7 },
  });

  assert.equal(assessment.level, "action");
  assert.ok(assessment.score >= 96);
  assert.ok(assessment.contradictions.some((item) => item.includes("Vorrang")));
});

test("standing storm-cell bearing escalates to immediate action", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "altocumulus",
    imageConfidence: 74,
    instruments: { bearingThreat: true },
  });

  assert.equal(assessment.level, "action");
  assert.ok(assessment.evidence.some((item) => item.source === "Peilung"));
});

test("falling pressure supports a frontal cloud diagnosis", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "cirrostratus",
    imageConfidence: 79,
    instruments: { pressureTrend: "falling", pressureChange3h: -3.4 },
  });

  assert.equal(assessment.level, "prepare");
  assert.ok(assessment.sources.includes("Barometer"));
});

test("rapid sky development adds independent trend evidence", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "cumulus",
    imageConfidence: 72,
    skyTrend: { status: "rapid" },
  });

  assert.ok(assessment.evidence.some((item) => item.source === "Zeitverlauf"));
  assert.ok(assessment.sources.includes("Himmel-Timeline"));
});

test("uses a fresh model package as supporting, not sole emergency evidence", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "cumulus",
    imageConfidence: 80,
    forecast: {
      freshness: { status: "fresh" },
      summary: { level: "action", reasons: ["Böen bis 38 kn"] },
    },
  });

  assert.equal(assessment.level, "prepare");
  assert.ok(assessment.sources.includes("Törn-Modellpaket"));
});

test("escalates an active verified severe DWD warning", () => {
  const assessment = buildSafetyAssessment({
    cloudId: "cumulus",
    imageConfidence: 80,
    officialWarnings: [
      {
        officialDwd: true,
        severity: "Severe",
        expires: new Date(Date.now() + 3_600_000).toISOString(),
      },
    ],
  });

  assert.equal(assessment.level, "action");
  assert.ok(assessment.sources.includes("Amtliche Warnung"));
});
