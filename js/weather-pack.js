const PACK_KEY = "wolkenlotse-weather-pack-v1";
const WARNING_KEY = "wolkenlotse-cap-warnings-v1";
export const WEATHER_PACK_SCHEMA = 1;

const WEATHER_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const MARINE_ENDPOINT = "https://marine-api.open-meteo.com/v1/marine";

const WEATHER_FIELDS = [
  "temperature_2m",
  "surface_pressure",
  "cloud_cover",
  "precipitation",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
  "cape",
  "visibility",
];

const MARINE_FIELDS = [
  "wave_height",
  "wave_direction",
  "wave_period",
  "wind_wave_height",
  "swell_wave_height",
  "swell_wave_direction",
  "swell_wave_period",
  "sea_surface_temperature",
];

function parseForecastTime(value) {
  if (!value) return Number.NaN;
  return Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
}

function finiteOrNull(value) {
  return Number.isFinite(value) ? value : null;
}

function valueAt(hourly, field, index) {
  return finiteOrNull(hourly?.[field]?.[index]);
}

export function mergeForecastData(weather, marine, { latitude, longitude, days = 3 } = {}) {
  if (!weather?.hourly?.time?.length) throw new Error("Wettermodell enthält keine Stundenwerte.");
  const marineByTime = new Map(
    (marine?.hourly?.time || []).map((time, index) => [time, index]),
  );
  const limit = Math.min(weather.hourly.time.length, Math.max(1, days) * 24);
  const hours = [];

  for (let index = 0; index < limit; index += 1) {
    const time = weather.hourly.time[index];
    const marineIndex = marineByTime.get(time);
    hours.push({
      time,
      temperature: valueAt(weather.hourly, "temperature_2m", index),
      pressure: valueAt(weather.hourly, "surface_pressure", index),
      cloudCover: valueAt(weather.hourly, "cloud_cover", index),
      precipitation: valueAt(weather.hourly, "precipitation", index),
      precipitationProbability: valueAt(
        weather.hourly,
        "precipitation_probability",
        index,
      ),
      weatherCode: valueAt(weather.hourly, "weather_code", index),
      windSpeed: valueAt(weather.hourly, "wind_speed_10m", index),
      windGusts: valueAt(weather.hourly, "wind_gusts_10m", index),
      windDirection: valueAt(weather.hourly, "wind_direction_10m", index),
      cape: valueAt(weather.hourly, "cape", index),
      visibility: valueAt(weather.hourly, "visibility", index),
      waveHeight:
        marineIndex == null ? null : valueAt(marine.hourly, "wave_height", marineIndex),
      waveDirection:
        marineIndex == null ? null : valueAt(marine.hourly, "wave_direction", marineIndex),
      wavePeriod:
        marineIndex == null ? null : valueAt(marine.hourly, "wave_period", marineIndex),
      windWaveHeight:
        marineIndex == null ? null : valueAt(marine.hourly, "wind_wave_height", marineIndex),
      swellHeight:
        marineIndex == null ? null : valueAt(marine.hourly, "swell_wave_height", marineIndex),
      swellDirection:
        marineIndex == null
          ? null
          : valueAt(marine.hourly, "swell_wave_direction", marineIndex),
      swellPeriod:
        marineIndex == null ? null : valueAt(marine.hourly, "swell_wave_period", marineIndex),
      seaTemperature:
        marineIndex == null
          ? null
          : valueAt(marine.hourly, "sea_surface_temperature", marineIndex),
    });
  }

  const createdAt = Date.now();
  return {
    schema: WEATHER_PACK_SCHEMA,
    id: `pack-${createdAt}`,
    createdAt,
    location: {
      latitude: finiteOrNull(Number(latitude)),
      longitude: finiteOrNull(Number(longitude)),
    },
    timezone: "UTC",
    validFrom: hours[0].time,
    validUntil: hours.at(-1).time,
    hours,
    sources: [
      {
        id: "open-meteo-weather",
        label: "Open-Meteo Wettermodell",
        type: "model",
        officialWarning: false,
      },
      ...(marine
        ? [
            {
              id: "open-meteo-marine",
              label: "Open-Meteo Marine-Modell",
              type: "model",
              officialWarning: false,
            },
          ]
        : []),
    ],
  };
}

function maxFinite(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? Math.max(...finite) : null;
}

function minFinite(values) {
  const finite = values.filter(Number.isFinite);
  return finite.length ? Math.min(...finite) : null;
}

export function summarizeForecast(pack, now = Date.now(), horizonHours = 24) {
  const end = now + horizonHours * 3_600_000;
  const hours = (pack?.hours || []).filter((hour) => {
    const timestamp = parseForecastTime(hour.time);
    return timestamp >= now - 3_600_000 && timestamp <= end;
  });
  const sourceHours = hours.length ? hours : (pack?.hours || []).slice(0, horizonHours);
  const maxWind = maxFinite(sourceHours.map((hour) => hour.windSpeed));
  const maxGust = maxFinite(sourceHours.map((hour) => hour.windGusts));
  const maxWave = maxFinite(sourceHours.map((hour) => hour.waveHeight));
  const maxPrecipitation = maxFinite(sourceHours.map((hour) => hour.precipitation));
  const minVisibility = minFinite(sourceHours.map((hour) => hour.visibility));
  const maxCape = maxFinite(sourceHours.map((hour) => hour.cape));

  let level = "observe";
  const reasons = [];
  if ((maxGust ?? 0) >= 34 || (maxWave ?? 0) >= 4) level = "action";
  else if (
    (maxGust ?? 0) >= 25 ||
    (maxWave ?? 0) >= 2.5 ||
    (maxCape ?? 0) >= 1000 ||
    (minVisibility ?? Number.POSITIVE_INFINITY) < 2000
  )
    level = "prepare";

  if ((maxGust ?? 0) >= 25) reasons.push(`Böen bis ${Math.round(maxGust)} kn`);
  if ((maxWave ?? 0) >= 2.5) reasons.push(`Wellen bis ${maxWave.toFixed(1)} m`);
  if ((maxCape ?? 0) >= 1000) reasons.push("erhöhte konvektive Energie");
  if ((minVisibility ?? Number.POSITIVE_INFINITY) < 2000)
    reasons.push("Modellsicht unter 2 km");

  return {
    level,
    maxWind,
    maxGust,
    maxWave,
    maxPrecipitation,
    minVisibility,
    maxCape,
    reasons,
    hourCount: sourceHours.length,
  };
}

export function weatherPackFreshness(pack, now = Date.now()) {
  if (!pack?.createdAt) return { status: "missing", ageHours: null, label: "Keine Daten" };
  const ageHours = Math.max(0, (now - pack.createdAt) / 3_600_000);
  const validUntil = parseForecastTime(pack.validUntil);
  if (Number.isFinite(validUntil) && now > validUntil)
    return { status: "expired", ageHours, label: "Gültigkeit abgelaufen" };
  if (ageHours > 12) return { status: "stale", ageHours, label: "Älter als 12 Stunden" };
  if (ageHours > 6) return { status: "aging", ageHours, label: "Aktualisierung empfohlen" };
  return { status: "fresh", ageHours, label: "Frisch geladen" };
}

export function validateWeatherPack(value) {
  return Boolean(
    value &&
      value.schema === WEATHER_PACK_SCHEMA &&
      value.location &&
      Number.isFinite(value.location.latitude) &&
      Number.isFinite(value.location.longitude) &&
      Array.isArray(value.hours) &&
      value.hours.length &&
      value.hours.every((hour) => typeof hour.time === "string"),
  );
}

export function loadWeatherPack() {
  try {
    const pack = JSON.parse(localStorage.getItem(PACK_KEY) || "null");
    return validateWeatherPack(pack) ? pack : null;
  } catch {
    return null;
  }
}

export function saveWeatherPack(pack) {
  if (!validateWeatherPack(pack)) return false;
  try {
    localStorage.setItem(PACK_KEY, JSON.stringify(pack));
    return true;
  } catch {
    return false;
  }
}

function nodeText(parent, localName) {
  const node = [...parent.getElementsByTagNameNS("*", localName)][0];
  return node?.textContent?.trim() || "";
}

function bounded(value, maximum = 4000) {
  return String(value || "").slice(0, maximum);
}

export function parseCapDocument(xmlText) {
  if (typeof DOMParser !== "function") throw new Error("XML-Parser ist nicht verfügbar.");
  const documentNode = new DOMParser().parseFromString(xmlText, "application/xml");
  if (documentNode.querySelector("parsererror")) throw new Error("CAP-Datei ist kein gültiges XML.");
  const alerts = [...documentNode.getElementsByTagNameNS("*", "alert")];
  if (documentNode.documentElement?.localName === "alert" && !alerts.includes(documentNode.documentElement)) {
    alerts.unshift(documentNode.documentElement);
  }

  return alerts.flatMap((alert, alertIndex) => {
    const infos = [...alert.getElementsByTagNameNS("*", "info")];
    const selected =
      infos.find((info) => /^de/i.test(nodeText(info, "language"))) || infos[0];
    if (!selected) return [];
    const areas = [...selected.getElementsByTagNameNS("*", "area")];
    const sender = nodeText(alert, "sender");
    const senderName = nodeText(selected, "senderName");
    const identifier = nodeText(alert, "identifier") || `cap-${Date.now()}-${alertIndex}`;
    return [
      {
        id: bounded(identifier, 300),
        importedAt: Date.now(),
        sender: bounded(sender, 300),
        senderName: bounded(senderName, 300),
        officialDwd: /dwd\.de|deutscher wetterdienst/i.test(`${sender} ${senderName}`),
        status: bounded(nodeText(alert, "status"), 50),
        messageType: bounded(nodeText(alert, "msgType"), 50),
        event: bounded(nodeText(selected, "event"), 300),
        headline: bounded(nodeText(selected, "headline"), 600),
        severity: bounded(nodeText(selected, "severity"), 50),
        urgency: bounded(nodeText(selected, "urgency"), 50),
        certainty: bounded(nodeText(selected, "certainty"), 50),
        effective: bounded(nodeText(selected, "effective"), 100),
        onset: bounded(nodeText(selected, "onset"), 100),
        expires: bounded(nodeText(selected, "expires"), 100),
        description: bounded(nodeText(selected, "description")),
        instruction: bounded(nodeText(selected, "instruction")),
        areas: areas.map((area) => bounded(nodeText(area, "areaDesc"), 500)).filter(Boolean),
      },
    ];
  });
}

export function loadCapWarnings() {
  try {
    const warnings = JSON.parse(localStorage.getItem(WARNING_KEY) || "[]");
    return Array.isArray(warnings) ? warnings : [];
  } catch {
    return [];
  }
}

export function saveCapWarnings(warnings) {
  try {
    localStorage.setItem(WARNING_KEY, JSON.stringify(warnings.slice(-100)));
    return true;
  } catch {
    return false;
  }
}

export async function downloadWeatherPack({ latitude, longitude, days = 3 }) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    throw new Error("Ungültiger Breitengrad.");
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    throw new Error("Ungültiger Längengrad.");
  const safeDays = Math.min(8, Math.max(1, Number(days) || 3));
  const common = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    forecast_days: String(safeDays),
    timezone: "GMT",
  });
  const weatherParameters = new URLSearchParams(common);
  weatherParameters.set("hourly", WEATHER_FIELDS.join(","));
  weatherParameters.set("wind_speed_unit", "kn");
  const marineParameters = new URLSearchParams(common);
  marineParameters.set("hourly", MARINE_FIELDS.join(","));

  const [weatherResult, marineResult] = await Promise.allSettled([
    fetch(`${WEATHER_ENDPOINT}?${weatherParameters}`),
    fetch(`${MARINE_ENDPOINT}?${marineParameters}`),
  ]);
  if (weatherResult.status !== "fulfilled" || !weatherResult.value.ok)
    throw new Error("Wettermodell konnte nicht geladen werden.");
  const weather = await weatherResult.value.json();
  const marine =
    marineResult.status === "fulfilled" && marineResult.value.ok
      ? await marineResult.value.json()
      : null;
  return mergeForecastData(weather, marine, { latitude, longitude, days: safeDays });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatUtc(time, options = {}) {
  const timestamp = parseForecastTime(time);
  if (!Number.isFinite(timestamp)) return "—";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }).format(new Date(timestamp));
}

function directionLabel(degrees) {
  if (!Number.isFinite(degrees)) return "—";
  const names = ["N", "NO", "O", "SO", "S", "SW", "W", "NW"];
  return names[Math.round(degrees / 45) % 8];
}

function weatherCodeLabel(code) {
  if (code == null) return "Unbekannt";
  if ([95, 96, 99].includes(code)) return "Gewitter";
  if (code >= 80) return "Schauer";
  if (code >= 71) return "Schnee";
  if (code >= 51) return "Regen";
  if (code >= 45) return "Nebel";
  if (code >= 3) return "Bedeckt";
  if (code >= 1) return "Wolkig";
  return "Klar";
}

export function initWeatherPack({
  getPosition = () => null,
  onToast = () => {},
  onPackChange = () => {},
} = {}) {
  const elements = {
    latitude: document.querySelector("#weather-latitude"),
    longitude: document.querySelector("#weather-longitude"),
    days: document.querySelector("#weather-days"),
    useGps: document.querySelector("#weather-use-gps"),
    download: document.querySelector("#weather-download"),
    importInput: document.querySelector("#weather-import"),
    exportButton: document.querySelector("#weather-export"),
    clearButton: document.querySelector("#weather-clear"),
    status: document.querySelector("#weather-pack-status"),
    content: document.querySelector("#weather-pack-content"),
    warnings: document.querySelector("#official-warning-list"),
  };

  function renderWarnings() {
    const warnings = loadCapWarnings();
    if (!warnings.length) {
      elements.warnings.innerHTML = `
        <div class="official-empty">
          <strong>Keine amtliche CAP-Datei importiert</strong>
          <span>Das bedeutet nicht, dass keine Warnung besteht. Vor Abfahrt DWD und BSH prüfen.</span>
        </div>
      `;
      return;
    }
    elements.warnings.innerHTML = warnings
      .map((warning) => {
        const expired = warning.expires && Date.parse(warning.expires) < Date.now();
        const severity = /extreme|severe/i.test(warning.severity)
          ? "danger"
          : /moderate/i.test(warning.severity)
            ? "caution"
            : "observe";
        return `
          <details class="official-warning ${severity} ${expired ? "expired" : ""}">
            <summary>
              <span>
                <small>${warning.officialDwd ? "DWD · amtliche CAP-Meldung" : "Importierte CAP-Meldung"}${
                  expired ? " · abgelaufen" : ""
                }</small>
                <strong>${escapeHtml(warning.headline || warning.event || "Warnmeldung")}</strong>
              </span>
              <span aria-hidden="true">+</span>
            </summary>
            <div>
              <p>${escapeHtml(warning.description || "Keine Beschreibung enthalten.")}</p>
              ${
                warning.instruction
                  ? `<div class="official-instruction"><strong>Empfehlung der Quelle</strong>${escapeHtml(
                      warning.instruction,
                    )}</div>`
                  : ""
              }
              <dl>
                <div><dt>Gebiet</dt><dd>${escapeHtml(
                  (Array.isArray(warning.areas) ? warning.areas : []).join(", ") ||
                    "Nicht angegeben",
                )}</dd></div>
                <div><dt>Gültig bis</dt><dd>${escapeHtml(
                  warning.expires ? new Date(warning.expires).toLocaleString("de-DE") : "Nicht angegeben",
                )}</dd></div>
                <div><dt>Absender</dt><dd>${escapeHtml(
                  warning.senderName || warning.sender || "Nicht angegeben",
                )}</dd></div>
              </dl>
            </div>
          </details>
        `;
      })
      .join("");
  }

  function render() {
    const pack = loadWeatherPack();
    renderWarnings();
    elements.exportButton.hidden = !pack;
    elements.clearButton.hidden = !pack;
    if (!pack) {
      elements.status.innerHTML =
        '<span class="pack-state missing">Kein Paket</span><span>Vor dem Törn mit Netz laden.</span>';
      elements.content.innerHTML = `
        <div class="weather-pack-empty">
          <span aria-hidden="true">↓</span>
          <strong>Noch keine Offline-Vorhersage</strong>
          <p>Position und Zeitraum wählen. Das Paket bleibt danach ohne Empfang verfügbar.</p>
        </div>
      `;
      onPackChange(null);
      return;
    }

    const freshness = weatherPackFreshness(pack);
    const summary = summarizeForecast(pack);
    const samples = pack.hours.filter((_, index) => index % 6 === 0).slice(0, 12);
    elements.status.innerHTML = `
      <span class="pack-state ${freshness.status}">${freshness.label}</span>
      <span>${freshness.ageHours.toFixed(1)} h alt · gültig bis ${formatUtc(pack.validUntil)} UTC</span>
    `;
    elements.content.innerHTML = `
      <div class="weather-summary ${summary.level}">
        <div><span>Wind</span><strong>${summary.maxWind == null ? "—" : `${Math.round(summary.maxWind)} kn`}</strong></div>
        <div><span>Böen</span><strong>${summary.maxGust == null ? "—" : `${Math.round(summary.maxGust)} kn`}</strong></div>
        <div><span>Welle</span><strong>${summary.maxWave == null ? "—" : `${summary.maxWave.toFixed(1)} m`}</strong></div>
        <div><span>Sicht min.</span><strong>${summary.minVisibility == null ? "—" : `${(summary.minVisibility / 1000).toFixed(1)} km`}</strong></div>
      </div>
      ${
        summary.reasons.length
          ? `<div class="pack-signal ${summary.level}"><strong>Modellsignale der nächsten 24 h</strong>${escapeHtml(
              summary.reasons.join(" · "),
            )}</div>`
          : '<div class="pack-signal observe"><strong>Modelltrend</strong>Keine Schwellenüberschreitung erkannt – keine Entwarnung.</div>'
      }
      <div class="forecast-strip">
        ${samples
          .map(
            (hour) => `
              <article>
                <time>${formatUtc(hour.time)} UTC</time>
                <strong>${weatherCodeLabel(hour.weatherCode)}</strong>
                <span>Wind ${hour.windSpeed == null ? "—" : Math.round(hour.windSpeed)} kn · ${
                  directionLabel(hour.windDirection)
                }</span>
                <span>Böen ${hour.windGusts == null ? "—" : Math.round(hour.windGusts)} kn</span>
                <span>Welle ${hour.waveHeight == null ? "—" : hour.waveHeight.toFixed(1)} m · ${
                  directionLabel(hour.waveDirection)
                }</span>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="model-disclaimer">
        <strong>Ergänzende Modellvorhersage</strong>
        Open-Meteo bündelt Wetter- und Wellenmodelle. Diese Daten sind nicht amtlich und enthalten
        keine Gewähr für lokale Böen, Gewitter oder Küsteneffekte.
      </div>
    `;
    onPackChange(pack);
  }

  async function useCurrentPosition() {
    let position = getPosition();
    if (!position && navigator.geolocation) {
      position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          reject,
          { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
        );
      });
    }
    if (!position) throw new Error("Keine Position verfügbar.");
    elements.latitude.value = Number(position.latitude).toFixed(4);
    elements.longitude.value = Number(position.longitude).toFixed(4);
  }

  elements.useGps.addEventListener("click", async () => {
    try {
      await useCurrentPosition();
      onToast("Position für das Törn-Paket übernommen.");
    } catch (error) {
      onToast(`Position nicht verfügbar: ${error.message}`);
    }
  });

  elements.download.addEventListener("click", async () => {
    if (!navigator.onLine) {
      onToast("Für ein neues Paket wird kurz eine Verbindung benötigt.");
      return;
    }
    const latitude = Number.parseFloat(elements.latitude.value);
    const longitude = Number.parseFloat(elements.longitude.value);
    elements.download.disabled = true;
    elements.download.textContent = "Modelldaten werden geladen …";
    try {
      const pack = await downloadWeatherPack({
        latitude,
        longitude,
        days: Number(elements.days.value),
      });
      if (!saveWeatherPack(pack)) throw new Error("Gerätespeicher ist voll.");
      render();
      onToast("Törn-Wetterpaket ist jetzt offline verfügbar.");
    } catch (error) {
      onToast(error.message);
    } finally {
      elements.download.disabled = false;
      elements.download.textContent = "Törn-Paket laden";
    }
  });

  elements.importInput.addEventListener("change", async () => {
    const file = elements.importInput.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      if (/\.xml$|\.cap$/i.test(file.name) || text.trim().startsWith("<")) {
        const imported = parseCapDocument(text);
        if (!imported.length) throw new Error("Keine CAP-Warnmeldung in der Datei gefunden.");
        const byId = new Map(loadCapWarnings().map((warning) => [warning.id, warning]));
        imported.forEach((warning) => byId.set(warning.id, warning));
        if (!saveCapWarnings([...byId.values()])) throw new Error("Gerätespeicher ist voll.");
        onToast(`${imported.length} CAP-Warnmeldung(en) importiert.`);
      } else {
        const portable = JSON.parse(text);
        const pack = portable.pack || portable;
        if (!validateWeatherPack(pack)) throw new Error("Datei ist kein gültiges Wolkenlotse-Paket.");
        if (!saveWeatherPack(pack)) throw new Error("Gerätespeicher ist voll.");
        if (Array.isArray(portable.warnings)) saveCapWarnings(portable.warnings);
        onToast("Törn-Paket importiert.");
      }
      render();
    } catch (error) {
      onToast(`Import fehlgeschlagen: ${error.message}`);
    } finally {
      elements.importInput.value = "";
    }
  });

  elements.exportButton.addEventListener("click", () => {
    const pack = loadWeatherPack();
    if (!pack) return;
    const payload = JSON.stringify(
      { format: "wolkenlotse-weather-pack", version: 1, pack, warnings: loadCapWarnings() },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([payload], { type: "application/json;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wolkenlotse-${pack.location.latitude.toFixed(
      2,
    )}-${pack.location.longitude.toFixed(2)}.wlp.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  });

  elements.clearButton.addEventListener("click", () => {
    if (!window.confirm("Gespeichertes Modellpaket löschen? Importierte CAP-Warnungen bleiben erhalten."))
      return;
    localStorage.removeItem(PACK_KEY);
    render();
    onToast("Modellpaket gelöscht.");
  });

  render();
  return {
    getCurrentPack: loadWeatherPack,
    getWarnings: loadCapWarnings,
    refresh: render,
  };
}
