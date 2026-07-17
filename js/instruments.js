const BAROMETER_KEY = "wolkenlotse-barometer-v1";
const STRIKE_KEY = "wolkenlotse-strikes-v1";
const BEARING_KEY = "wolkenlotse-bearings-v1";

function loadEntries(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveEntries(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Instruments remain usable for the current session if storage is unavailable.
  }
}

export function calculatePressureTrend(entries) {
  if (!Array.isArray(entries) || entries.length < 2) return null;
  const ordered = [...entries].sort((a, b) => a.timestamp - b.timestamp);
  const latest = ordered.at(-1);
  let reference = null;
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const entry of ordered.slice(0, -1)) {
    const hours = (latest.timestamp - entry.timestamp) / 3_600_000;
    if (hours < 0.25 || hours > 6) continue;
    const distance = Math.abs(hours - 3);
    if (distance < smallestDistance) {
      reference = entry;
      smallestDistance = distance;
    }
  }

  if (!reference) return null;
  const elapsedHours = (latest.timestamp - reference.timestamp) / 3_600_000;
  return {
    pressure: latest.pressure,
    change3h: ((latest.pressure - reference.pressure) / elapsedHours) * 3,
    elapsedHours,
  };
}

export function classifyPressureChange(change3h) {
  if (change3h <= -6)
    return { level: "danger", trend: "falling", label: "Drucksturz – Sturmgefahr" };
  if (change3h <= -3)
    return { level: "danger", trend: "falling", label: "Stark fallend – Front oder Starkwind" };
  if (change3h <= -1)
    return { level: "caution", trend: "falling", label: "Fallend – Wetterwechsel möglich" };
  if (change3h < 1) return { level: "safe", trend: "steady", label: "Nahezu stabil" };
  if (change3h < 3)
    return { level: "safe", trend: "rising", label: "Steigend – eher Besserung" };
  return { level: "caution", trend: "rising", label: "Stark steigend – ruppige Rückseite möglich" };
}

export function lightningDistance(seconds) {
  return Math.max(0, seconds * 0.343);
}

export function signedAngleDifference(from, to) {
  return ((to - from + 540) % 360) - 180;
}

export function assessCrosswind(groundWind, highClouds, hemisphere = "north") {
  if (!Number.isFinite(groundWind) || !Number.isFinite(highClouds)) return null;
  let difference = (highClouds - groundWind + 360) % 360;
  if (hemisphere === "south") difference = (360 - difference) % 360;

  if (difference > 45 && difference < 135) {
    return {
      level: "caution",
      difference,
      title: "Verschlechterung wahrscheinlicher",
      text: "Hohe Wolken kommen – mit dem Rücken zum Bodenwind – von links. Das spricht für Warmluftadvektion.",
    };
  }
  if (difference > 225 && difference < 315) {
    return {
      level: "safe",
      difference,
      title: "Besserung wahrscheinlicher",
      text: "Hohe Wolken kommen von rechts. Das spricht eher für Kaltluftadvektion und nachfolgende Besserung.",
    };
  }
  return {
    level: "safe",
    difference,
    title: "Keine klare Luftmassenänderung",
    text: "Wolkenzug und Bodenwind sind annähernd parallel. Die aktuelle Wetterlage hält eher an.",
  };
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function initInstruments({ onToast = () => {}, onPressureChange = () => {} } = {}) {
  const elements = {
    pressureInput: document.querySelector("#pressure-input"),
    pressureAdd: document.querySelector("#pressure-add"),
    pressureOutput: document.querySelector("#pressure-output"),
    flash: document.querySelector("#flash-button"),
    thunder: document.querySelector("#thunder-button"),
    strikeOutput: document.querySelector("#strike-output"),
    groundWind: document.querySelector("#ground-wind"),
    highClouds: document.querySelector("#high-clouds"),
    hemisphere: document.querySelector("#hemisphere-button"),
    crosswindOutput: document.querySelector("#crosswind-output"),
    bearingStart: document.querySelector("#bearing-start"),
    bearingLive: document.querySelector("#bearing-live"),
    bearingSave: document.querySelector("#bearing-save"),
    bearingOutput: document.querySelector("#bearing-output"),
  };

  let barometer = loadEntries(BAROMETER_KEY).filter(
    (entry) => Date.now() - entry.timestamp < 48 * 3_600_000,
  );
  let strikes = loadEntries(STRIKE_KEY).filter(
    (entry) => Date.now() - entry.timestamp < 3 * 3_600_000,
  );
  let bearings = loadEntries(BEARING_KEY).filter(
    (entry) => Date.now() - entry.timestamp < 2 * 3_600_000,
  );
  let flashTimestamp = null;
  let hemisphere = "north";
  let currentHeading = null;
  let compassActive = false;

  function renderPressure() {
    const trend = calculatePressureTrend(barometer);
    const status = trend ? classifyPressureChange(trend.change3h) : null;
    const recent = barometer.slice(-5).reverse();
    elements.pressureOutput.innerHTML = `
      ${
        status
          ? `<div class="instrument-status ${status.level}">
              <strong>${trend.change3h >= 0 ? "+" : ""}${trend.change3h.toFixed(1)} hPa / 3 h</strong>
              <span>${status.label}</span>
            </div>`
          : `<p class="instrument-empty">${
              recent.length
                ? "Erster Wert gespeichert. Für eine Tendenz nach mindestens 15 Minuten erneut messen."
                : "Noch keine Messung gespeichert."
            }</p>`
      }
      <div class="measurement-list">
        ${recent
          .map(
            (entry) =>
              `<div><span>${formatTime(entry.timestamp)}</span><strong>${entry.pressure.toFixed(
                1,
              )} hPa</strong></div>`,
          )
          .join("")}
      </div>
    `;
    onPressureChange(status?.trend || "unknown");
  }

  elements.pressureAdd?.addEventListener("click", () => {
    const pressure = Number.parseFloat(elements.pressureInput.value);
    if (!Number.isFinite(pressure) || pressure < 920 || pressure > 1080) {
      onToast("Bitte einen plausiblen Wert zwischen 920 und 1080 hPa eingeben.");
      return;
    }
    barometer.push({ timestamp: Date.now(), pressure });
    barometer = barometer.slice(-30);
    saveEntries(BAROMETER_KEY, barometer);
    elements.pressureInput.value = "";
    renderPressure();
  });

  function renderStrikes() {
    const latest = strikes.at(-1);
    if (!latest) {
      elements.strikeOutput.innerHTML =
        '<p class="instrument-empty">Noch keine Blitzmessung in dieser Sitzung.</p>';
      return;
    }
    const previous = strikes.at(-2);
    const trend = previous
      ? latest.distance < previous.distance - 0.3
        ? " · kommt näher"
        : latest.distance > previous.distance + 0.3
          ? " · zieht ab"
          : " · Abstand stabil"
      : "";
    const level = latest.distance < 5 ? "danger" : latest.distance < 10 ? "caution" : "safe";
    elements.strikeOutput.innerHTML = `
      <div class="instrument-status ${level}">
        <strong>${latest.distance.toFixed(1)} km · ${(latest.distance / 1.852).toFixed(1)} sm</strong>
        <span>Letzte Messung${trend}</span>
      </div>
      ${
        latest.distance < 5
          ? '<div class="instrument-alert">Gewitter in unmittelbarer Reichweite: Kontakt zu Wanten, Stagen und Reling vermeiden; Position zusätzlich analog sichern.</div>'
          : ""
      }
    `;
  }

  elements.flash?.addEventListener("click", () => {
    flashTimestamp = performance.now();
    elements.flash.disabled = true;
    elements.thunder.disabled = false;
    elements.thunder.textContent = "Donner gehört";
    onToast("Timer läuft – beim Donner sofort stoppen.");
    window.setTimeout(() => {
      if (!flashTimestamp) return;
      flashTimestamp = null;
      elements.flash.disabled = false;
      elements.thunder.disabled = true;
      elements.thunder.textContent = "Auf Donner warten …";
    }, 60_000);
  });

  elements.thunder?.addEventListener("click", () => {
    if (!flashTimestamp) return;
    const seconds = (performance.now() - flashTimestamp) / 1000;
    strikes.push({ timestamp: Date.now(), distance: lightningDistance(seconds) });
    strikes = strikes.slice(-12);
    saveEntries(STRIKE_KEY, strikes);
    flashTimestamp = null;
    elements.flash.disabled = false;
    elements.thunder.disabled = true;
    elements.thunder.textContent = "Auf Donner warten …";
    renderStrikes();
  });

  function renderCrosswind() {
    const ground = elements.groundWind?.value === "" ? Number.NaN : Number(elements.groundWind.value);
    const clouds = elements.highClouds?.value === "" ? Number.NaN : Number(elements.highClouds.value);
    const result = assessCrosswind(ground, clouds, hemisphere);
    elements.hemisphere.textContent = hemisphere === "north" ? "Nordhalbkugel" : "Südhalbkugel";
    elements.crosswindOutput.innerHTML = result
      ? `<div class="instrument-status ${result.level}">
          <strong>${result.title}</strong><span>${result.text}</span>
        </div>
        <p class="instrument-footnote">Faustregel – immer mit Barometer, Wolkenbild und Seewetterbericht abgleichen.</p>`
      : '<p class="instrument-empty">Beide Richtungen wählen, um den Kreuzwind zu beurteilen.</p>';
  }

  elements.groundWind?.addEventListener("change", renderCrosswind);
  elements.highClouds?.addEventListener("change", renderCrosswind);
  elements.hemisphere?.addEventListener("click", () => {
    hemisphere = hemisphere === "north" ? "south" : "north";
    renderCrosswind();
  });

  function renderBearings() {
    if (!bearings.length) {
      elements.bearingOutput.innerHTML =
        '<p class="instrument-empty">Noch keine Peilung gespeichert.</p>';
      return;
    }
    const first = bearings[0];
    const latest = bearings.at(-1);
    const minutes = (latest.timestamp - first.timestamp) / 60_000;
    const drift = signedAngleDifference(first.heading, latest.heading);
    const assessment =
      bearings.length >= 2 && minutes >= 2
        ? Math.abs(drift) < 8
          ? `<div class="instrument-status danger"><strong>Stehende Peilung</strong><span>Zelle hält wahrscheinlich auf euch zu.</span></div>`
          : `<div class="instrument-status caution"><strong>Peilung wandert ${
              drift > 0 ? "nach rechts" : "nach links"
            }</strong><span>${Math.abs(drift).toFixed(0)}° Änderung in ${Math.round(
              minutes,
            )} Minuten.</span></div>`
        : '<p class="instrument-empty">In 3–5 Minuten dieselbe Zelle erneut peilen.</p>';
    elements.bearingOutput.innerHTML = `${assessment}
      <div class="measurement-list">${bearings
        .slice(-4)
        .reverse()
        .map(
          (entry) =>
            `<div><span>${formatTime(entry.timestamp)}</span><strong>${String(
              Math.round(entry.heading),
            ).padStart(3, "0")}°</strong></div>`,
        )
        .join("")}</div>`;
  }

  function handleOrientation(event) {
    if (event.webkitCompassHeading != null) currentHeading = event.webkitCompassHeading;
    else if (event.alpha != null) currentHeading = (360 - event.alpha) % 360;
    if (currentHeading == null) return;
    elements.bearingLive.textContent = `${String(Math.round(currentHeading)).padStart(3, "0")}°`;
    elements.bearingSave.disabled = false;
  }

  elements.bearingStart?.addEventListener("click", async () => {
    try {
      if (globalThis.DeviceOrientationEvent?.requestPermission) {
        const permission = await globalThis.DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") throw new Error("not granted");
      }
      if (!globalThis.DeviceOrientationEvent) throw new Error("not supported");
      compassActive = true;
      window.addEventListener("deviceorientationabsolute", handleOrientation);
      window.addEventListener("deviceorientation", handleOrientation);
      elements.bearingStart.textContent = "Kompass aktiv";
      elements.bearingStart.disabled = true;
      window.setTimeout(() => {
        if (compassActive && currentHeading == null) {
          elements.bearingLive.textContent = "Kein Sensorwert";
        }
      }, 3000);
    } catch {
      onToast("Auf diesem Gerät ist kein freigegebener Kompass verfügbar.");
    }
  });

  elements.bearingSave?.addEventListener("click", () => {
    if (currentHeading == null) return;
    bearings.push({ timestamp: Date.now(), heading: currentHeading });
    bearings = bearings.slice(-12);
    saveEntries(BEARING_KEY, bearings);
    renderBearings();
    onToast("Peilung gespeichert.");
  });

  renderPressure();
  renderStrikes();
  renderCrosswind();
  renderBearings();

  return {
    getContext() {
      const trend = calculatePressureTrend(barometer);
      const status = trend ? classifyPressureChange(trend.change3h) : null;
      const latestStrike = strikes.at(-1);
      const firstBearing = bearings[0];
      const latestBearing = bearings.at(-1);
      const bearingMinutes =
        firstBearing && latestBearing
          ? (latestBearing.timestamp - firstBearing.timestamp) / 60_000
          : 0;
      const bearingThreat =
        bearings.length >= 2 &&
        bearingMinutes >= 2 &&
        Math.abs(signedAngleDifference(firstBearing.heading, latestBearing.heading)) < 8;
      return {
        pressureTrend: status?.trend || "unknown",
        pressureChange3h: trend?.change3h ?? null,
        pressureObservedAt: barometer.at(-1)?.timestamp ?? null,
        lightningDistance:
          latestStrike && Date.now() - latestStrike.timestamp < 90 * 60_000
            ? latestStrike.distance
            : null,
        lightningObservedAt: latestStrike?.timestamp ?? null,
        bearingThreat,
        currentHeading,
      };
    },
    setLatitude(latitude) {
      hemisphere = latitude < 0 ? "south" : "north";
      renderCrosswind();
    },
  };
}
