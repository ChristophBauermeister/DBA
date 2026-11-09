import { analyzeImageData, describeMetrics } from "./analyzer.js";
import { CLOUD_LIST, CLOUDS, RISK_LABELS } from "./cloud-data.js";
import { initGribArchive } from "./grib-archive.js";
import { initInstruments } from "./instruments.js";
import { buildSafetyAssessment } from "./safety-engine.js";
import {
  addSkyObservation,
  calculateSkyTrend,
  clearSkyTimeline,
  formatTrendRate,
  loadSkyTimeline,
} from "./sky-timeline.js";
import {
  initWeatherPack,
  summarizeForecast,
  weatherPackFreshness,
} from "./weather-pack.js";
import { initWizard } from "./wizard.js";

const STORAGE_KEY = "wolkenlotse-logbook-v1";
const REMINDER_KEY = "wolkenlotse-timeline-reminder-v1";
const MAX_LOG_ENTRIES = 25;

const state = {
  imageUrl: null,
  imageFile: null,
  result: null,
  thumbnail: null,
  installPrompt: null,
  gps: null,
  analysisTimestamp: null,
  timelineSaved: false,
  reminderDue: null,
  reminderTimer: null,
};

let instrumentController = null;
let weatherPackController = null;

const elements = {
  cameraInput: document.querySelector("#camera-input"),
  fileInput: document.querySelector("#file-input"),
  captureIdle: document.querySelector("#capture-idle"),
  capturePreview: document.querySelector("#capture-preview"),
  photoPreview: document.querySelector("#photo-preview"),
  replacePhoto: document.querySelector("#replace-photo"),
  analyseButton: document.querySelector("#analyse-button"),
  scanLine: document.querySelector("#scan-line"),
  canvas: document.querySelector("#analysis-canvas"),
  resultPanel: document.querySelector("#result-panel"),
  resultContent: document.querySelector("#result-content"),
  timelineCount: document.querySelector("#timeline-count"),
  timelineSummary: document.querySelector("#timeline-summary"),
  timelineList: document.querySelector("#timeline-list"),
  clearTimeline: document.querySelector("#clear-timeline"),
  timelineInterval: document.querySelector("#timeline-interval"),
  timelineReminderButton: document.querySelector("#timeline-reminder-button"),
  reminderStatus: document.querySelector("#reminder-status"),
  windTrend: document.querySelector("#wind-trend"),
  pressureTrend: document.querySelector("#pressure-trend"),
  darkHorizon: document.querySelector("#dark-horizon"),
  capturePosition: document.querySelector("#capture-position"),
  positionOutput: document.querySelector("#position-output"),
  cloudLibrary: document.querySelector("#cloud-library"),
  cloudFilters: document.querySelector("#cloud-filters"),
  knowledgeTabs: document.querySelector(".knowledge-tabs"),
  knowledgeAtlas: document.querySelector("#knowledge-atlas"),
  knowledgeWarnings: document.querySelector("#knowledge-warnings"),
  cloudDialog: document.querySelector("#cloud-dialog"),
  cloudDialogContent: document.querySelector("#cloud-dialog-content"),
  logbookList: document.querySelector("#logbook-list"),
  logCount: document.querySelector("#log-count"),
  clearLog: document.querySelector("#clear-log"),
  connectionPill: document.querySelector("#connection-pill"),
  connectionLabel: document.querySelector("#connection-label"),
  installButton: document.querySelector("#install-button"),
  toast: document.querySelector("#toast"),
};

function showView(viewName) {
  document.querySelectorAll(".view").forEach((view) => {
    const isActive = view.dataset.view === viewName;
    view.classList.toggle("active", isActive);
    view.hidden = !isActive;
  });
  document.querySelectorAll("[data-view-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.viewLink === viewName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view-link]").forEach((link) => {
  link.addEventListener("click", () => showView(link.dataset.viewLink));
});

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function loadImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Bitte wähle eine Bilddatei aus.");
    return;
  }
  if (file.size > 24 * 1024 * 1024) {
    showToast("Das Foto ist größer als 24 MB. Bitte wähle ein kleineres Bild.");
    return;
  }

  if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = URL.createObjectURL(file);
  state.imageFile = file;
  state.result = null;
  state.thumbnail = null;
  state.analysisTimestamp = null;
  state.timelineSaved = false;
  elements.photoPreview.src = state.imageUrl;
  elements.captureIdle.hidden = true;
  elements.capturePreview.hidden = false;
  elements.resultPanel.hidden = true;
}

[elements.cameraInput, elements.fileInput].forEach((input) => {
  input.addEventListener("change", () => loadImageFile(input.files?.[0]));
});

elements.replacePhoto.addEventListener("click", () => {
  elements.fileInput.value = "";
  elements.fileInput.click();
});

elements.capturePosition.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showToast("Dieses Gerät stellt keine Position bereit.");
    return;
  }
  elements.capturePosition.disabled = true;
  elements.positionOutput.textContent = "Suche GPS-Signal …";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      state.gps = { latitude, longitude, accuracy };
      const latitudeLabel = `${Math.abs(latitude).toFixed(4)}° ${latitude >= 0 ? "N" : "S"}`;
      const longitudeLabel = `${Math.abs(longitude).toFixed(4)}° ${longitude >= 0 ? "E" : "W"}`;
      elements.positionOutput.textContent = `${latitudeLabel} · ${longitudeLabel} · ±${Math.round(
        accuracy,
      )} m`;
      elements.capturePosition.textContent = "Aktualisieren";
      elements.capturePosition.disabled = false;
      instrumentController?.setLatitude(latitude);
    },
    (error) => {
      elements.positionOutput.textContent = "Position nicht verfügbar";
      elements.capturePosition.disabled = false;
      showToast(`GPS konnte nicht erfasst werden: ${error.message}`);
    },
    { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
  );
});

function getContext() {
  const instrumentContext = instrumentController?.getContext() || {};
  return {
    windTrend: elements.windTrend.value,
    pressureTrend:
      elements.pressureTrend.value === "unknown"
        ? instrumentContext.pressureTrend || "unknown"
        : elements.pressureTrend.value,
    darkHorizon: elements.darkHorizon.checked,
    lightningDistance: instrumentContext.lightningDistance ?? null,
  };
}

function imageDataFromPreview() {
  const sourceWidth = elements.photoPreview.naturalWidth;
  const sourceHeight = elements.photoPreview.naturalHeight;
  if (!sourceWidth || !sourceHeight) throw new Error("Bild ist noch nicht geladen.");

  const maxDimension = 320;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  elements.canvas.width = width;
  elements.canvas.height = height;
  const context = elements.canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(elements.photoPreview, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

function createThumbnail() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = 176;
  const height = 140;
  const imageRatio = elements.photoPreview.naturalWidth / elements.photoPreview.naturalHeight;
  const targetRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sourceWidth = elements.photoPreview.naturalWidth;
  let sourceHeight = elements.photoPreview.naturalHeight;

  if (imageRatio > targetRatio) {
    sourceWidth = sourceHeight * targetRatio;
    sx = (elements.photoPreview.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = sourceWidth / targetRatio;
    sy = (elements.photoPreview.naturalHeight - sourceHeight) / 2;
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(
    elements.photoPreview,
    sx,
    sy,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
  return canvas.toDataURL("image/jpeg", 0.56);
}

function resolveRisk(cloud, context) {
  if (context.lightningDistance != null && context.lightningDistance < 5) {
    return { level: "danger", label: "Gewitter in unmittelbarer Nähe" };
  }
  if (cloud.risk === "danger") return { level: "danger", label: RISK_LABELS.danger };
  if (
    cloud.risk === "caution" ||
    (context.lightningDistance != null && context.lightningDistance < 10) ||
    (context.darkHorizon && context.windTrend === "rising") ||
    (cloud.id === "cumulus" && context.windTrend === "rising")
  ) {
    return { level: "caution", label: RISK_LABELS.caution };
  }
  return {
    level: "safe",
    label: cloud.risk === "watch" ? RISK_LABELS.watch : RISK_LABELS.low,
  };
}

function contextualAdvice(cloud, context) {
  const additions = [];
  if (context.windTrend === "rising") additions.push("Der zunehmende Wind erhöht die Aufmerksamkeit.");
  if (context.pressureTrend === "falling")
    additions.push("Fallender Luftdruck stützt die Möglichkeit eines Wetterwechsels.");
  if (context.darkHorizon)
    additions.push("Die dunkle Horizontzone kann auf Niederschlag oder stärkere Böen hindeuten.");
  if (context.lightningDistance != null)
    additions.push(
      `Die letzte Blitzmessung liegt bei ${context.lightningDistance.toFixed(
        1,
      )} km – diese direkte Beobachtung hat Vorrang vor der Bilderkennung.`,
    );
  return [cloud.advice, ...additions].join(" ");
}

function currentSkyObservation() {
  if (!state.result || !state.analysisTimestamp) return null;
  const instrumentContext = instrumentController?.getContext() || {};
  return {
    id: `sky-${state.analysisTimestamp}`,
    timestamp: state.analysisTimestamp,
    cloudId: state.result.cloudId,
    confidence: state.result.confidence,
    metrics: {
      coverage: state.result.metrics.coverage,
      edgeDensity: state.result.metrics.edgeDensity,
      variance: state.result.metrics.variance,
      darkness: state.result.metrics.darkness,
      meanLuminance: state.result.metrics.meanLuminance,
    },
    heading: Number.isFinite(instrumentContext.currentHeading)
      ? instrumentContext.currentHeading
      : null,
    position: state.gps
      ? { latitude: state.gps.latitude, longitude: state.gps.longitude }
      : null,
    thumbnail: state.thumbnail,
  };
}

function renderSafetyAssessment(assessment) {
  return `
    <section class="fusion-card ${assessment.level}" aria-label="Zusammengeführte Sicherheitsbewertung">
      <div class="fusion-head">
        <div>
          <span class="result-kicker">Signal-Fusion · ${assessment.sourceCount} Quellen</span>
          <h3>${assessment.title}</h3>
        </div>
        <span class="fusion-level">${assessment.level === "action" ? "Handeln" : assessment.level === "prepare" ? "Vorbereiten" : "Beobachten"}</span>
      </div>
      <p class="fusion-summary">${assessment.summary}</p>
      <div class="evidence-list">
        ${assessment.evidence
          .map(
            (item) => `
              <div class="evidence ${item.severity}">
                <span>${item.source}</span>
                <p>${item.message}</p>
              </div>
            `,
          )
          .join("")}
      </div>
      ${
        assessment.contradictions.length
          ? `<div class="contradiction-box">
              <strong>Unsicherheit oder Widerspruch</strong>
              ${assessment.contradictions.map((item) => `<p>${item}</p>`).join("")}
            </div>`
          : ""
      }
      <div class="fusion-actions">
        <strong>Nächste Schritte</strong>
        <ol>${assessment.actions.map((action) => `<li>${action}</li>`).join("")}</ol>
      </div>
    </section>
  `;
}

function renderResult(result) {
  const cloud = CLOUDS[result.cloudId];
  const context = getContext();
  const risk = resolveRisk(cloud, context);
  const metrics = describeMetrics(result.metrics);
  const instrumentContext = instrumentController?.getContext() || {};
  const weatherPack = weatherPackController?.getCurrentPack() || null;
  const forecast =
    weatherPack && weatherPackFreshness(weatherPack).status !== "expired"
      ? {
          summary: summarizeForecast(weatherPack),
          freshness: weatherPackFreshness(weatherPack),
        }
      : null;
  const currentObservation = currentSkyObservation();
  const timelineForAssessment = currentObservation
    ? [...loadSkyTimeline(), currentObservation]
    : loadSkyTimeline();
  const skyTrend = calculateSkyTrend(timelineForAssessment);
  const assessment = buildSafetyAssessment({
    cloudId: result.cloudId,
    imageConfidence: result.confidence,
    context,
    instruments: instrumentContext,
    skyTrend,
    forecast,
    officialWarnings: weatherPackController?.getWarnings() || [],
  });
  const warning = result.qualityWarning
    ? `<div class="safety-note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Zm0 5v6m0 3v.5"/></svg><p>${result.qualityWarning}</p></div>`
    : "";

  elements.resultContent.innerHTML = `
    <article class="result-card ${risk.level}">
      <div class="result-main">
        <div class="result-classification">
          <div>
            <span class="result-kicker">${risk.label}</span>
            <h2 class="result-name">${cloud.name}</h2>
            <span class="result-latin">${cloud.latin}</span>
          </div>
          <div class="confidence-ring" style="--confidence: ${result.confidence}" 
               aria-label="${result.confidence} Prozent Übereinstimmung">
            <span>${result.confidence}%</span>
          </div>
        </div>
        <p class="result-summary">${cloud.summary}</p>
        <div class="metric-row" aria-label="Bildmerkmale">
          <div class="metric"><strong>${metrics.coverage}</strong><span>Wolkendecke</span></div>
          <div class="metric"><strong>${metrics.texture}</strong><span>Struktur</span></div>
          <div class="metric"><strong>${metrics.light}</strong><span>Helligkeit</span></div>
        </div>
      </div>
      <div class="sailing-advice">
        <div class="advice-heading">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18m0-3c-4 0-7-3-7-7m7 7c4 0 7-3 7-7M8 7a4 4 0 0 0 8 0"/></svg>
          Empfehlung für den Törn
        </div>
        <p>${contextualAdvice(cloud, context)}</p>
      </div>
    </article>
    ${renderSafetyAssessment(assessment)}
    ${warning}
    <div class="result-actions">
      <button class="button button-primary" id="save-result" type="button">Im Logbuch speichern</button>
      <button class="button button-primary timeline-save" id="save-timeline" type="button" ${
        state.timelineSaved ? "disabled" : ""
      }>${state.timelineSaved ? "In Timeline gespeichert" : "Zur Timeline hinzufügen"}</button>
      <button class="button button-secondary" id="open-cloud-info" type="button">Steckbrief öffnen</button>
      <button class="button button-secondary" id="refine-result" type="button">Mit Fragen verfeinern</button>
    </div>
  `;

  elements.resultPanel.hidden = false;
  document.querySelector("#save-result").addEventListener("click", saveCurrentResult);
  document.querySelector("#save-timeline").addEventListener("click", saveCurrentTimeline);
  document.querySelector("#open-cloud-info").addEventListener("click", () => openCloudDialog(cloud.id));
  document.querySelector("#refine-result").addEventListener("click", () => showView("bestimmen"));
  window.setTimeout(
    () => elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" }),
    120,
  );
}

elements.analyseButton.addEventListener("click", () => {
  elements.analyseButton.disabled = true;
  elements.analyseButton.textContent = "Analysiere …";
  elements.scanLine.classList.add("scanning");

  window.setTimeout(() => {
    try {
      state.result = analyzeImageData(imageDataFromPreview(), getContext());
      state.thumbnail = createThumbnail();
      state.analysisTimestamp = Date.now();
      state.timelineSaved = false;
      renderResult(state.result);
    } catch (error) {
      console.error(error);
      showToast("Das Foto konnte nicht ausgewertet werden. Bitte versuche ein anderes.");
    } finally {
      elements.analyseButton.disabled = false;
      elements.analyseButton.textContent = "Lokal analysieren";
      elements.scanLine.classList.remove("scanning");
    }
  }, 650);
});

function saveCurrentTimeline() {
  if (state.timelineSaved) return;
  const observation = currentSkyObservation();
  if (!observation) return;
  if (!addSkyObservation(observation)) {
    showToast("Die Timeline konnte nicht gespeichert werden. Gerätespeicher prüfen.");
    return;
  }
  state.timelineSaved = true;
  const button = document.querySelector("#save-timeline");
  if (button) {
    button.textContent = "In Timeline gespeichert";
    button.disabled = true;
  }
  renderSkyTimeline();
  showToast("Himmelsbeobachtung gespeichert. Für den Trend denselben Ausschnitt erneut aufnehmen.");
}

function formatTimelineTime(timestamp) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function renderSkyTimeline() {
  const entries = loadSkyTimeline();
  const trend = calculateSkyTrend(entries);
  elements.timelineCount.textContent = `${entries.length} / 12`;
  elements.clearTimeline.hidden = entries.length === 0;
  elements.timelineSummary.className = `timeline-summary ${trend.status}`;
  elements.timelineSummary.innerHTML =
    trend.status === "insufficient"
      ? `<strong>Noch kein belastbarer Trend</strong><span>${trend.message}</span>`
      : `<strong>${trend.message}</strong>
         <span>${Math.round(trend.durationMinutes)} min · Wolkendecke ${formatTrendRate(
           trend.coverageRate,
         )} · Verdunklung ${formatTrendRate(trend.darkeningRate)}</span>`;

  if (!entries.length) {
    elements.timelineList.innerHTML = `
      <div class="timeline-empty">
        <span aria-hidden="true">◷</span>
        <p>Nach der Fotoanalyse „Zur Timeline hinzufügen“ wählen.</p>
      </div>
    `;
    return;
  }

  elements.timelineList.innerHTML = [...entries]
    .reverse()
    .map((entry, index) => {
      const cloud = CLOUDS[entry.cloudId] || CLOUDS.cumulus;
      return `
        <article class="timeline-entry ${index === 0 ? "latest" : ""}">
          ${
            entry.thumbnail
              ? `<img src="${entry.thumbnail}" alt="" />`
              : '<span class="timeline-placeholder" aria-hidden="true">☁</span>'
          }
          <div>
            <span>${formatTimelineTime(entry.timestamp)}${
              Number.isFinite(entry.heading) ? ` · ${Math.round(entry.heading)}°` : ""
            }</span>
            <strong>${cloud.name}</strong>
            <small>${Math.round(entry.metrics.coverage * 100)} % Wolkendecke · ${
              entry.confidence
            } % Bildübereinstimmung</small>
          </div>
        </article>
      `;
    })
    .join("");
}

elements.clearTimeline.addEventListener("click", () => {
  if (!window.confirm("Alle Beobachtungen der Himmel-Timeline löschen?")) return;
  clearSkyTimeline();
  state.timelineSaved = false;
  renderSkyTimeline();
  showToast("Himmel-Timeline gelöscht.");
});

function stopReminder() {
  if (state.reminderTimer) window.clearInterval(state.reminderTimer);
  state.reminderTimer = null;
  state.reminderDue = null;
  localStorage.removeItem(REMINDER_KEY);
  elements.timelineReminderButton.textContent = "Erinnerung starten";
  elements.reminderStatus.textContent =
    "Erinnerungen funktionieren sicher, solange die App geöffnet ist; beim nächsten Öffnen wird eine überfällige Aufnahme angezeigt.";
}

async function notifyTimelineDue() {
  showToast("Zeit für die nächste Aufnahme desselben Himmelsausschnitts.");
  if (globalThis.Notification?.permission === "granted" && document.hidden) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("Wolkenlotse · Himmel-Timeline", {
        body: "Jetzt denselben Himmelsausschnitt erneut fotografieren.",
        icon: "./icons/icon.svg",
        tag: "sky-timeline",
      });
    } catch {
      // The in-app reminder already remains visible.
    }
  }
}

function updateReminder() {
  if (!state.reminderDue) return;
  const remaining = state.reminderDue - Date.now();
  if (remaining <= 0) {
    if (state.reminderTimer) window.clearInterval(state.reminderTimer);
    state.reminderTimer = null;
    localStorage.removeItem(REMINDER_KEY);
    state.reminderDue = null;
    elements.timelineReminderButton.textContent = "Erneut erinnern";
    elements.reminderStatus.textContent =
      "Aufnahme ist fällig: möglichst denselben Ausschnitt und dieselbe Blickrichtung verwenden.";
    notifyTimelineDue();
    return;
  }
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);
  elements.reminderStatus.textContent = `Nächste Aufnahme in ${minutes}:${String(seconds).padStart(
    2,
    "0",
  )} min.`;
}

function startReminder(dueTimestamp) {
  if (state.reminderTimer) window.clearInterval(state.reminderTimer);
  state.reminderDue = dueTimestamp;
  localStorage.setItem(REMINDER_KEY, String(dueTimestamp));
  elements.timelineReminderButton.textContent = "Erinnerung stoppen";
  state.reminderTimer = window.setInterval(updateReminder, 1000);
  updateReminder();
}

elements.timelineReminderButton.addEventListener("click", async () => {
  if (state.reminderDue) {
    stopReminder();
    return;
  }
  const intervalMinutes = Number(elements.timelineInterval.value);
  if (globalThis.Notification?.permission === "default") {
    try {
      await globalThis.Notification.requestPermission();
    } catch {
      // Permission is optional; the in-app countdown still works.
    }
  }
  startReminder(Date.now() + intervalMinutes * 60_000);
});

function getLogbook() {
  try {
    const entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function setLogbook(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES)));
    return true;
  } catch {
    showToast("Der Gerätespeicher ist voll. Lösche alte Logbucheinträge.");
    return false;
  }
}

function saveCurrentResult() {
  if (!state.result) return;
  const cloud = CLOUDS[state.result.cloudId];
  const context = getContext();
  const risk = resolveRisk(cloud, context);
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    cloudId: cloud.id,
    confidence: state.result.confidence,
    coverage: Math.round(state.result.metrics.coverage * 100),
    riskLevel: risk.level,
    riskLabel: risk.label,
    thumbnail: state.thumbnail,
    position: state.gps
      ? { latitude: state.gps.latitude, longitude: state.gps.longitude }
      : null,
  };
  const entries = [entry, ...getLogbook()];
  if (!setLogbook(entries)) return;
  renderLogbook();
  const button = document.querySelector("#save-result");
  button.textContent = "Gespeichert";
  button.disabled = true;
  showToast("Analyse wurde lokal im Bordlogbuch gespeichert.");
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function renderLogbook() {
  const entries = getLogbook();
  elements.logCount.textContent = `${entries.length} ${entries.length === 1 ? "Eintrag" : "Einträge"}`;
  elements.clearLog.hidden = entries.length === 0;

  if (!entries.length) {
    elements.logbookList.innerHTML = `
      <div class="empty-log">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <path d="M15 8h34v48H15zM23 18h18M23 27h18M23 36h12"/>
          <path d="M10 13v48h34"/>
        </svg>
        <h2>Noch keine Sichtung</h2>
        <p>Analysiere dein erstes Wolkenfoto und sichere das Ergebnis für spätere Vergleiche.</p>
        <button class="button button-secondary" data-empty-analyse type="button">Zur Analyse</button>
      </div>
    `;
    elements.logbookList
      .querySelector("[data-empty-analyse]")
      .addEventListener("click", () => showView("analyse"));
    return;
  }

  elements.logbookList.innerHTML = entries
    .map((entry) => {
      const cloud = CLOUDS[entry.cloudId] || CLOUDS.cumulus;
      return `
        <article class="log-entry">
          <img class="log-thumb" src="${entry.thumbnail}" alt="" />
          <div class="log-entry-body">
            <div class="log-meta">
              <span>${formatDate(entry.timestamp)}</span>
              <span><i class="risk-dot ${entry.riskLevel}"></i>${entry.riskLabel}</span>
            </div>
            <h2>${cloud.name}</h2>
            <p>${entry.confidence}% Übereinstimmung · ${entry.coverage}% Wolkendecke${
              entry.position
                ? ` · ${Math.abs(entry.position.latitude).toFixed(2)}° ${
                    entry.position.latitude >= 0 ? "N" : "S"
                  }`
                : ""
            }</p>
            <button class="text-button" data-delete-entry="${entry.id}" type="button">Eintrag löschen</button>
          </div>
        </article>
      `;
    })
    .join("");
}

elements.logbookList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-entry]");
  if (!button) return;
  setLogbook(getLogbook().filter((entry) => entry.id !== button.dataset.deleteEntry));
  renderLogbook();
  showToast("Eintrag gelöscht.");
});

elements.clearLog.addEventListener("click", () => {
  if (!window.confirm("Alle lokalen Logbucheinträge unwiderruflich löschen?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderLogbook();
  showToast("Bordlogbuch geleert.");
});

elements.knowledgeTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-knowledge-tab]");
  if (!button) return;
  const showAtlas = button.dataset.knowledgeTab === "atlas";
  elements.knowledgeTabs
    .querySelectorAll("[data-knowledge-tab]")
    .forEach((tab) => {
      const active = tab === button;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
  elements.knowledgeAtlas.hidden = !showAtlas;
  elements.knowledgeWarnings.hidden = showAtlas;
});

function renderCloudLibrary(filter = "all") {
  const clouds = CLOUD_LIST.filter((cloud) => filter === "all" || cloud.category === filter);
  elements.cloudLibrary.innerHTML = clouds
    .map(
      (cloud) => `
        <button class="cloud-card" data-cloud="${cloud.id}" type="button">
          <span class="cloud-art" aria-hidden="true"></span>
          <span class="cloud-card-overlay">
            <span class="cloud-height">${cloud.category} · ${cloud.height}</span>
            <h2>${cloud.name}</h2>
            <p>${cloud.latin} · ${cloud.weather}</p>
          </span>
        </button>
      `,
    )
    .join("");
}

elements.cloudFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  elements.cloudFilters
    .querySelectorAll(".filter-chip")
    .forEach((chip) => chip.classList.toggle("active", chip === button));
  renderCloudLibrary(button.dataset.filter);
});

elements.cloudLibrary.addEventListener("click", (event) => {
  const card = event.target.closest("[data-cloud]");
  if (card) openCloudDialog(card.dataset.cloud);
});

function openCloudDialog(cloudId) {
  const cloud = CLOUDS[cloudId];
  if (!cloud) return;
  elements.cloudDialogContent.innerHTML = `
    <div class="dialog-hero">
      <div class="dialog-hero-text">
        <span class="result-kicker">${cloud.category} · ${cloud.height}</span>
        <h2>${cloud.name}</h2>
        <span class="result-latin">${cloud.latin}</span>
      </div>
    </div>
    <div class="dialog-body">
      <p>${cloud.summary}</p>
      ${
        cloud.recognition
          ? `<div class="dialog-recognition"><strong>Erkennen</strong>${cloud.recognition}</div>`
          : ""
      }
      <div class="fact-grid">
        <div class="fact"><span>Höhenlage</span><strong>${cloud.height}</strong></div>
        <div class="fact"><span>Wettersignal</span><strong>${cloud.weather}</strong></div>
      </div>
      <div class="dialog-advice">
        <strong>Für Segler</strong>
        ${cloud.advice}
      </div>
    </div>
  `;
  elements.cloudDialog.showModal();
}

elements.cloudDialog.querySelector(".dialog-close").addEventListener("click", () => {
  elements.cloudDialog.close();
});
elements.cloudDialog.addEventListener("click", (event) => {
  if (event.target === elements.cloudDialog) elements.cloudDialog.close();
});

function updateConnectionStatus() {
  const online = navigator.onLine;
  elements.connectionPill.classList.toggle("online", online);
  elements.connectionLabel.textContent = online ? "Online · offline bereit" : "Offline bereit";
}

window.addEventListener("online", updateConnectionStatus);
window.addEventListener("offline", updateConnectionStatus);

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  elements.installButton.hidden = false;
});

elements.installButton.addEventListener("click", async () => {
  if (!state.installPrompt) return;
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  elements.installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  elements.installButton.hidden = true;
  showToast("Wolkenlotse wurde installiert.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Offline-Modus konnte nicht aktiviert werden:", error);
    });
  });
}

updateConnectionStatus();
renderCloudLibrary();
renderLogbook();
renderSkyTimeline();
initWizard(document.querySelector("#wizard"), { onOpenCloud: openCloudDialog });
weatherPackController = initWeatherPack({
  getPosition: () => state.gps,
  onToast: showToast,
  onPackChange: () => {
    if (state.result) renderResult(state.result);
  },
});
initGribArchive({ onToast: showToast });
instrumentController = initInstruments({
  onToast: showToast,
  onPressureChange: (trend) => {
    elements.pressureTrend.options[0].textContent =
      trend === "unknown"
        ? "Nicht bekannt"
        : `Vom Bordlog: ${
            trend === "falling" ? "fallend" : trend === "rising" ? "steigend" : "stabil"
          }`;
  },
});

const savedReminder = Number(localStorage.getItem(REMINDER_KEY));
if (Number.isFinite(savedReminder) && savedReminder > 0) {
  if (savedReminder <= Date.now()) {
    state.reminderDue = savedReminder;
    updateReminder();
  } else {
    startReminder(savedReminder);
  }
}
