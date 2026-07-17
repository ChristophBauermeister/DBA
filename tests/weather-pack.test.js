import test from "node:test";
import assert from "node:assert/strict";

import {
  mergeForecastData,
  summarizeForecast,
  validateWeatherPack,
  weatherPackFreshness,
} from "../js/weather-pack.js";

function hourlyTimes(start, count) {
  return Array.from({ length: count }, (_, index) =>
    new Date(start + index * 3_600_000).toISOString().slice(0, 16),
  );
}

function repeated(value, count) {
  return Array.from({ length: count }, () => value);
}

test("merges weather and marine hours into a portable package", () => {
  const start = Date.UTC(2026, 6, 18);
  const time = hourlyTimes(start, 48);
  const weather = {
    hourly: {
      time,
      wind_speed_10m: repeated(14, 48),
      wind_gusts_10m: repeated(21, 48),
      wind_direction_10m: repeated(270, 48),
      cloud_cover: repeated(65, 48),
    },
  };
  const marine = {
    hourly: {
      time,
      wave_height: repeated(1.4, 48),
      wave_direction: repeated(300, 48),
      wave_period: repeated(6, 48),
    },
  };

  const pack = mergeForecastData(weather, marine, {
    latitude: 54.5,
    longitude: 10.2,
    days: 1,
  });

  assert.equal(pack.hours.length, 24);
  assert.equal(pack.hours[0].waveHeight, 1.4);
  assert.equal(pack.hours[0].windSpeed, 14);
  assert.equal(validateWeatherPack(pack), true);
});

test("raises the model summary level for strong gusts and waves", () => {
  const now = Date.UTC(2026, 6, 18);
  const pack = {
    hours: hourlyTimes(now, 24).map((time, index) => ({
      time,
      windSpeed: 22,
      windGusts: index === 4 ? 38 : 26,
      waveHeight: index === 8 ? 4.2 : 2.4,
      precipitation: 0,
      visibility: 10_000,
      cape: 200,
    })),
  };

  const summary = summarizeForecast(pack, now);
  assert.equal(summary.level, "action");
  assert.equal(summary.maxGust, 38);
  assert.equal(summary.maxWave, 4.2);
});

test("makes model age explicit", () => {
  const now = Date.now();
  const pack = {
    createdAt: now - 7 * 3_600_000,
    validUntil: new Date(now + 24 * 3_600_000).toISOString(),
  };

  assert.equal(weatherPackFreshness(pack, now).status, "aging");
});

test("rejects malformed imported packages", () => {
  assert.equal(validateWeatherPack({ schema: 1, hours: [] }), false);
});
