const TIMELINE_KEY = "wolkenlotse-sky-timeline-v1";
export const MAX_TIMELINE_ENTRIES = 12;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function timestampOf(entry) {
  const value = typeof entry.timestamp === "number" ? entry.timestamp : Date.parse(entry.timestamp);
  return Number.isFinite(value) ? value : 0;
}

function normalize(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(
      (entry) =>
        entry &&
        typeof entry.cloudId === "string" &&
        entry.metrics &&
        Number.isFinite(entry.metrics.coverage) &&
        timestampOf(entry) > 0,
    )
    .sort((a, b) => timestampOf(a) - timestampOf(b))
    .slice(-MAX_TIMELINE_ENTRIES);
}

export function loadSkyTimeline() {
  try {
    return normalize(JSON.parse(localStorage.getItem(TIMELINE_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function saveSkyTimeline(entries) {
  const normalized = normalize(entries);
  try {
    localStorage.setItem(TIMELINE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function addSkyObservation(observation) {
  const entries = [...loadSkyTimeline(), observation];
  return saveSkyTimeline(entries);
}

export function clearSkyTimeline() {
  try {
    localStorage.removeItem(TIMELINE_KEY);
  } catch {
    // The current session remains usable if storage is blocked.
  }
}

function headingDifference(first, last) {
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  return Math.abs(((last - first + 540) % 360) - 180);
}

function convectiveSignal(metrics = {}) {
  return (
    clamp(metrics.darkness || 0, 0, 1) * 0.42 +
    clamp(metrics.edgeDensity || 0, 0, 1) * 0.29 +
    clamp(metrics.variance || 0, 0, 1) * 0.29
  );
}

/**
 * Compares the oldest and newest useful observations. Rates are normalized to
 * one hour but must be interpreted together with duration and camera direction.
 */
export function calculateSkyTrend(entries, now = Date.now()) {
  const usable = normalize(entries).filter(
    (entry) => now - timestampOf(entry) <= 3 * 3_600_000,
  );
  if (usable.length < 2) {
    return {
      status: "insufficient",
      sampleCount: usable.length,
      message: "Mindestens zwei Aufnahmen sind für einen Trend erforderlich.",
    };
  }

  const first = usable[0];
  const latest = usable.at(-1);
  const elapsedHours = (timestampOf(latest) - timestampOf(first)) / 3_600_000;
  if (elapsedHours < 2 / 60) {
    return {
      status: "insufficient",
      sampleCount: usable.length,
      durationMinutes: elapsedHours * 60,
      message: "Die Aufnahmen liegen zu dicht zusammen. In einigen Minuten erneut fotografieren.",
    };
  }

  const directionDifference = headingDifference(first.heading, latest.heading);
  const comparable = directionDifference == null || directionDifference <= 35;
  const coverageRate = (latest.metrics.coverage - first.metrics.coverage) / elapsedHours;
  const darkeningRate =
    ((first.metrics.meanLuminance || 0) - (latest.metrics.meanLuminance || 0)) / elapsedHours;
  const convectionRate =
    (convectiveSignal(latest.metrics) - convectiveSignal(first.metrics)) / elapsedHours;

  let status = "stable";
  if (coverageRate > 0.35 || darkeningRate > 0.28 || convectionRate > 0.32) status = "rapid";
  else if (coverageRate > 0.12 || darkeningRate > 0.1 || convectionRate > 0.13)
    status = "evolving";
  else if (coverageRate < -0.15 && darkeningRate < 0.05) status = "clearing";

  if (!comparable) status = "uncertain";

  const messages = {
    stable: "Keine schnelle Veränderung erkannt – weiter regelmäßig beobachten.",
    evolving: "Die Wolkenlage entwickelt sich erkennbar.",
    rapid: "Schnelle Verdichtung, Verdunklung oder Strukturzunahme erkannt.",
    clearing: "Die gemessene Wolkendecke nimmt ab – das ist keine pauschale Entwarnung.",
    uncertain: "Aufnahmen zeigen in deutlich verschiedene Richtungen und sind nur begrenzt vergleichbar.",
  };

  return {
    status,
    sampleCount: usable.length,
    durationMinutes: elapsedHours * 60,
    coverageChange: latest.metrics.coverage - first.metrics.coverage,
    coverageRate,
    darkeningRate,
    convectionRate,
    directionDifference,
    comparable,
    message: messages[status],
  };
}

export function formatTrendRate(rate) {
  if (!Number.isFinite(rate)) return "—";
  return `${rate >= 0 ? "+" : ""}${Math.round(rate * 100)} %/h`;
}
