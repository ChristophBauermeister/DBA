const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const bell = (value, center, width) => clamp(1 - Math.abs(value - center) / width);

/**
 * Extracts deliberately simple visual signals from a reduced image. The routine
 * runs in the browser and never sends pixel data anywhere.
 */
export function extractImageMetrics(imageData) {
  const { data, width, height } = imageData;
  const luminances = new Float32Array(width * height);
  let considered = 0;
  let luminanceSum = 0;
  let luminanceSquaredSum = 0;
  let cloudPixels = 0;
  let bluePixels = 0;
  let greyPixels = 0;
  let darkPixels = 0;
  let brightPixels = 0;

  // The lowest part often contains water, land or deck hardware.
  const analysisHeight = Math.max(1, Math.floor(height * 0.88));

  for (let y = 0; y < analysisHeight; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = y * width + x;
      const index = pixelIndex * 4;
      const red = data[index] / 255;
      const green = data[index + 1] / 255;
      const blue = data[index + 2] / 255;
      const alpha = data[index + 3] / 255;

      if (alpha < 0.5) continue;

      const maxChannel = Math.max(red, green, blue);
      const minChannel = Math.min(red, green, blue);
      const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;
      const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      const looksBlue =
        blue > red * 1.04 && blue > green * 0.94 && blue - red > 0.045 && saturation > 0.11;
      const looksNeutral = saturation < 0.29;
      const looksCloud = looksNeutral && luminance > 0.2;

      luminances[pixelIndex] = luminance;
      considered += 1;
      luminanceSum += luminance;
      luminanceSquaredSum += luminance * luminance;
      if (looksBlue) bluePixels += 1;
      if (looksNeutral) greyPixels += 1;
      if (looksCloud) cloudPixels += 1;
      if (luminance < 0.31) darkPixels += 1;
      if (luminance > 0.73) brightPixels += 1;
    }
  }

  if (!considered) {
    return {
      coverage: 0,
      edgeDensity: 0,
      variance: 0,
      darkness: 0,
      brightness: 0,
      blueRatio: 0,
      greyRatio: 0,
      meanLuminance: 0,
      quality: 0,
    };
  }

  let edgeCount = 0;
  let edgeSamples = 0;
  for (let y = 1; y < analysisHeight - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const current = luminances[y * width + x];
      const horizontal = Math.abs(current - luminances[y * width + x + 1]);
      const vertical = Math.abs(current - luminances[(y + 1) * width + x]);
      if (horizontal + vertical > 0.115) edgeCount += 1;
      edgeSamples += 1;
    }
  }

  const meanLuminance = luminanceSum / considered;
  const standardDeviation = Math.sqrt(
    Math.max(0, luminanceSquaredSum / considered - meanLuminance * meanLuminance),
  );
  const blueRatio = bluePixels / considered;
  const greyRatio = greyPixels / considered;
  const skyAndCloudRatio = clamp(blueRatio + greyRatio);

  return {
    coverage: clamp(cloudPixels / Math.max(1, cloudPixels + bluePixels)),
    edgeDensity: clamp((edgeCount / Math.max(1, edgeSamples)) * 2.3),
    variance: clamp(standardDeviation / 0.25),
    darkness: darkPixels / considered,
    brightness: brightPixels / considered,
    blueRatio,
    greyRatio,
    meanLuminance,
    quality: clamp((skyAndCloudRatio - 0.12) / 0.62),
  };
}

export function classifyMetrics(metrics, context = {}) {
  const {
    coverage,
    edgeDensity: edge,
    variance,
    darkness,
    brightness,
    blueRatio,
    greyRatio,
    quality = 1,
  } = metrics;

  const scores = {
    cirrus:
      bell(coverage, 0.18, 0.33) * 0.82 +
      blueRatio * 0.56 +
      brightness * 0.3 +
      edge * 0.2 +
      (1 - darkness) * 0.12,
    cirrostratus:
      bell(coverage, 0.58, 0.5) * 0.72 +
      (1 - edge) * 0.38 +
      brightness * 0.42 +
      greyRatio * 0.18,
    altocumulus:
      bell(coverage, 0.5, 0.42) * 0.72 +
      edge * 0.8 +
      bell(variance, 0.48, 0.45) * 0.46 +
      brightness * 0.12,
    stratus:
      coverage * 0.82 +
      (1 - edge) * 0.52 +
      (1 - variance) * 0.35 +
      greyRatio * 0.25 -
      darkness * 0.2,
    nimbostratus:
      coverage * 0.76 +
      darkness * 1.18 +
      (1 - edge) * 0.25 +
      greyRatio * 0.28 +
      variance * 0.15,
    cumulus:
      bell(coverage, 0.42, 0.48) * 0.86 +
      edge * 0.86 +
      variance * 0.7 +
      brightness * 0.28 -
      darkness * 0.2,
    cumulonimbus:
      bell(coverage, 0.65, 0.58) * 0.35 +
      darkness * 1.46 +
      edge * 0.7 +
      variance * 0.76 +
      (context.darkHorizon ? 0.5 : 0),
  };

  if (context.pressureTrend === "falling") {
    scores.cirrostratus += 0.2;
    scores.nimbostratus += 0.17;
    scores.cumulonimbus += 0.12;
  }
  if (context.windTrend === "rising") {
    scores.cumulonimbus += 0.27;
    scores.nimbostratus += 0.1;
  }
  if (context.pressureTrend === "rising") {
    scores.cumulus += 0.08;
    scores.stratus += 0.06;
  }

  const ranking = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [winner, runnerUp] = ranking;
  const scoreGap = winner[1] - runnerUp[1];
  const visualCertainty = clamp(0.48 + scoreGap * 0.9 + quality * 0.25);
  const confidence = Math.round(clamp(visualCertainty, 0.38, 0.92) * 100);

  return {
    cloudId: winner[0],
    confidence,
    quality,
    alternatives: ranking.slice(1, 3).map(([cloudId, score]) => ({
      cloudId,
      relativeScore: Math.round((score / Math.max(winner[1], 0.01)) * 100),
    })),
    scores,
  };
}

export function analyzeImageData(imageData, context = {}) {
  const metrics = extractImageMetrics(imageData);
  const classification = classifyMetrics(metrics, context);
  const qualityWarning =
    metrics.quality < 0.32
      ? "Im Bild wurde wenig eindeutig erkennbarer Himmel gefunden. Ergebnis besonders kritisch prüfen."
      : null;

  return {
    ...classification,
    metrics,
    qualityWarning,
  };
}

export function describeMetrics(metrics) {
  const texture =
    metrics.edgeDensity > 0.6 ? "markant" : metrics.edgeDensity > 0.3 ? "strukturiert" : "gleichmäßig";
  const light =
    metrics.meanLuminance > 0.7 ? "hell" : metrics.meanLuminance > 0.43 ? "mittel" : "dunkel";

  return {
    coverage: `${Math.round(metrics.coverage * 100)} %`,
    texture,
    light,
  };
}
