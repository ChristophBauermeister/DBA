import { CLOUDS } from "./cloud-data.js";

const BASE_RISK = {
  low: 8,
  watch: 18,
  caution: 36,
  danger: 72,
};

const FRONT_CLOUDS = new Set(["cirrus", "cirrostratus", "altostratus", "nimbostratus"]);

function addEvidence(evidence, severity, source, message) {
  evidence.push({ severity, source, message });
}

function unique(values) {
  return [...new Set(values)];
}

export function buildSafetyAssessment({
  cloudId,
  imageConfidence = 0,
  context = {},
  instruments = {},
  skyTrend = null,
} = {}) {
  const cloud = CLOUDS[cloudId] || CLOUDS.cumulus;
  let score = BASE_RISK[cloud.risk] ?? BASE_RISK.watch;
  const evidence = [];
  const contradictions = [];
  const actions = [];
  const sources = new Set(["Foto"]);

  addEvidence(
    evidence,
    cloud.risk === "danger" ? "danger" : cloud.risk === "caution" ? "caution" : "info",
    "Wolkenbild",
    `${cloud.name} mit ${Math.round(imageConfidence)} % visueller Übereinstimmung.`,
  );

  if (imageConfidence < 52) {
    contradictions.push(
      "Die visuelle Zuordnung ist unsicher. Ergebnis mit manueller Bestimmung und Außenbeobachtung prüfen.",
    );
  }

  if (context.darkHorizon) {
    score += 13;
    sources.add("Beobachtung");
    addEvidence(
      evidence,
      "caution",
      "Horizont",
      "Dunkle Wolken am Horizont können Niederschlag oder stärkere Böen markieren.",
    );
  }

  if (context.windTrend === "rising") {
    score += 11;
    sources.add("Beobachtung");
    addEvidence(evidence, "caution", "Wind", "Der Wind nimmt nach eigener Beobachtung zu.");
  }

  const pressureTrend = instruments.pressureTrend || context.pressureTrend;
  const pressureChange = instruments.pressureChange3h;
  if (pressureTrend && pressureTrend !== "unknown") {
    sources.add("Barometer");
    if (pressureTrend === "falling") {
      const stronglyFalling = Number.isFinite(pressureChange) && pressureChange <= -3;
      score += stronglyFalling ? 22 : 11;
      addEvidence(
        evidence,
        stronglyFalling ? "danger" : "caution",
        "Barometer",
        Number.isFinite(pressureChange)
          ? `Der Luftdruck fällt mit ${pressureChange.toFixed(1)} hPa in drei Stunden.`
          : "Der Luftdruck fällt.",
      );
    } else if (pressureTrend === "rising") {
      addEvidence(evidence, "info", "Barometer", "Der Luftdruck steigt.");
      if (FRONT_CLOUDS.has(cloud.id)) {
        contradictions.push(
          "Das fronttypische Wolkenbild und der steigende Luftdruck passen nicht eindeutig zusammen.",
        );
      }
    } else {
      addEvidence(evidence, "info", "Barometer", "Der Luftdruck ist annähernd stabil.");
    }
  }

  const lightningDistance = instruments.lightningDistance ?? context.lightningDistance;
  if (Number.isFinite(lightningDistance)) {
    sources.add("Blitzmessung");
    if (lightningDistance < 5) {
      score = Math.max(score + 30, 96);
      addEvidence(
        evidence,
        "danger",
        "Blitzmessung",
        `Blitz und Donner ergeben nur etwa ${lightningDistance.toFixed(1)} km Abstand.`,
      );
      actions.push(
        "Crew aus exponierten Bereichen nehmen und Kontakt zu Wanten, Stagen und Reling vermeiden.",
      );
    } else if (lightningDistance < 10) {
      score = Math.max(score + 24, 82);
      addEvidence(
        evidence,
        "danger",
        "Blitzmessung",
        `Das Gewitter liegt mit etwa ${lightningDistance.toFixed(1)} km gefährlich nah.`,
      );
    } else if (lightningDistance < 20) {
      score = Math.max(score + 14, 58);
      addEvidence(
        evidence,
        "caution",
        "Blitzmessung",
        `Gewitteraktivität wurde in etwa ${lightningDistance.toFixed(1)} km Entfernung gemessen.`,
      );
    }
    if (cloud.risk === "low" || cloud.risk === "watch") {
      contradictions.push(
        "Die Blitzmessung hat Vorrang vor dem scheinbar harmlosen Bildausschnitt – die Gewitterzelle kann außerhalb des Fotos liegen.",
      );
    }
  }

  if (instruments.bearingThreat === true) {
    score = Math.max(score + 25, 88);
    sources.add("Zellenpeilung");
    addEvidence(
      evidence,
      "danger",
      "Peilung",
      "Die Gewitterzelle zeigt über mehrere Minuten eine nahezu stehende Peilung.",
    );
    actions.push("Kurs und Abstand zur Zelle sofort neu beurteilen; stehende Peilung bedeutet Kollisionskurs.");
  }

  if (skyTrend && skyTrend.status !== "insufficient") {
    sources.add("Himmel-Timeline");
    if (skyTrend.status === "rapid") {
      score += 22;
      addEvidence(
        evidence,
        "danger",
        "Zeitverlauf",
        "Die Aufnahmen zeigen eine schnelle Verdichtung, Verdunklung oder Strukturzunahme.",
      );
    } else if (skyTrend.status === "evolving") {
      score += 11;
      addEvidence(
        evidence,
        "caution",
        "Zeitverlauf",
        "Die Wolkenlage entwickelt sich zwischen den Aufnahmen erkennbar.",
      );
    } else if (skyTrend.status === "uncertain") {
      contradictions.push(
        "Die Timeline-Aufnahmen zeigen in unterschiedliche Richtungen und sind nur begrenzt vergleichbar.",
      );
    } else {
      addEvidence(
        evidence,
        "info",
        "Zeitverlauf",
        skyTrend.status === "clearing"
          ? "Die gemessene Wolkendecke nimmt ab; andere Gefahrenquellen bleiben dennoch relevant."
          : "Im beobachteten Zeitraum wurde keine schnelle Bildveränderung erkannt.",
      );
    }
  }

  score = Math.min(100, Math.max(0, score));
  let level = "observe";
  if (score >= 70) level = "action";
  else if (score >= 38) level = "prepare";

  if (level === "action") {
    actions.push(
      "Segelfläche frühzeitig reduzieren oder bergen, Crew einpicken und Luken schließen.",
      "Abstand, Ausweichkurs und geschützten Bereich jetzt festlegen – nicht erst beim Eintreffen der Böe.",
    );
  } else if (level === "prepare") {
    actions.push(
      "Reffablauf, Ausweichkurs und Aufgabenverteilung vorbereiten.",
      "Entwicklung in kurzen Intervallen erneut fotografieren und Barometer kontrollieren.",
    );
  } else {
    actions.push(
      "Weiter beobachten und mindestens alle 15 Minuten neu bewerten.",
      "Amtlichen Seewetterbericht und lokale Warnungen als führende Quelle verwenden.",
    );
  }

  if (level !== "observe") {
    actions.push("Amtliche Warnungen und Seewetterbericht sofort gegenprüfen.");
  }

  const labels = {
    observe: {
      title: "Weiter beobachten",
      summary: "Keine akute Eskalation aus den vorhandenen Signalen – ausdrücklich keine Entwarnung.",
    },
    prepare: {
      title: "Vorbereiten",
      summary: "Mehrere Signale sprechen für erhöhte Aufmerksamkeit und konkrete Vorbereitung.",
    },
    action: {
      title: "Jetzt handeln",
      summary: "Mindestens ein starkes Gefahrensignal verlangt unmittelbare seemännische Maßnahmen.",
    },
  };

  return {
    level,
    score,
    title: labels[level].title,
    summary: labels[level].summary,
    evidence,
    contradictions,
    actions: unique(actions),
    sourceCount: sources.size,
    sources: [...sources],
  };
}
