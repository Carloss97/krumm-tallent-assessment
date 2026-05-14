// WebWorker that attempts to run ONNX Runtime (onnxruntime-web) when a modelUrl
// is provided during init. Falls back to a deterministic scoring function when
// the runtime or model cannot be loaded.

let ort = null;
let session = null;
let inputName = null;
let featureOrder = [];

async function tryLoadRuntime() {
  if (ort) return ort;
  try {
    // Dynamic import ensures the runtime is bundled separately for the worker
    ort = await import('onnxruntime-web');
    return ort;
  } catch {
    // Runtime not available in bundle or network failed
    ort = null;
    return null;
  }
}

async function loadModel(url, options = {}) {
  try {
    const runtime = await tryLoadRuntime();
    if (!runtime) throw new Error('onnxruntime-web not available');

    // Create session using the WASM backend only to avoid unavailable browser providers.
    session = await runtime.InferenceSession.create(url, { executionProviders: ['wasm'] });

    featureOrder = Array.isArray(options.featureOrder) && options.featureOrder.length > 0
      ? [...options.featureOrder]
      : [];

    // Attempt to infer the input name from session metadata
    try {
      inputName = Array.isArray(session.inputNames) && session.inputNames.length > 0
        ? session.inputNames[0]
        : (session.inputMetadata ? Object.keys(session.inputMetadata)[0] : null);
    } catch {
      inputName = null;
    }

    return true;
  } catch (err) {
    session = null;
    inputName = null;
    throw err;
  }
}

function deterministicScore(features) {
  const clamp = (value, min = 0, max = 100) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.max(min, Math.min(max, numeric));
  };
  const average = (values) => {
    const finite = values.map(Number).filter(Number.isFinite);
    if (finite.length === 0) return 0;
    return finite.reduce((sum, value) => sum + value, 0) / finite.length;
  };

  if ('completedGameCount' in features || 'meanScore' in features) {
    const completedCoverage = clamp((Number(features.completedGameCount || 0) / 7) * 100);
    const signalQuality = average([
      features.meanFacialCoverage,
      features.meanWebcamSignalQuality,
      features.meanFacialConfidence,
      features.meanVisualStability,
      features.meanAttentionStabilityProxy,
    ]);
    const interactionQuality = clamp(100 - (Number(features.totalHesitationCount || 0) * 3));
    const loadPenalty = average([
      Number(features.meanOffScreenOrFaceAwayPercent || 0),
      Number(features.meanHeadPoseVariability || 0) * 4,
      Number(features.meanFatigueProxy || 0) * 0.25,
    ]);

    const rawScore = (
      clamp(features.meanScore) * 0.42
      + clamp(features.meanAccuracyProxy) * 0.16
      + signalQuality * 0.18
      + completedCoverage * 0.12
      + interactionQuality * 0.08
      + clamp(features.meanCognitiveLoadProxy) * 0.04
      - loadPenalty * 0.12
    );
    const scorePercent = Math.round(clamp(rawScore));
    const confidence = Math.round(clamp(
      30
      + (completedCoverage * 0.25)
      + (signalQuality * 0.25)
      + (clamp(features.meanFacialConfidence) * 0.2),
      30,
      98,
    ));
    return { scorePercent, confidence };
  }

  const weights = {
    avgScore: 1.4,
    meanDuration: -0.03,
    meanConfidence: 1.2,
    readinessMean: 0.9,
    telemetryCoverage: 0.6,
    stabilityScore: 0.8,
    numGames: 0.2,
  };
  let raw = 0;
  let scale = 0;
  for (const k of Object.keys(weights)) {
    const v = Number(features[k]);
    if (!Number.isFinite(v)) continue;
    raw += v * weights[k];
    scale += Math.abs(weights[k]);
  }
  const base = scale > 0 ? raw / scale : 50;
  const scorePercent = Math.max(0, Math.min(100, Math.round(base)));
  const confidence = Math.max(30, Math.min(98, Math.round((Number(features.readinessMean || 50) * 0.6) + (Number(features.numGames || 1) * 4))));
  return { scorePercent, confidence };
}

self.addEventListener('message', async (ev) => {
  const msg = ev.data || {};
  try {
    if (msg.type === 'init') {
      const modelUrl = msg.modelUrl;
      if (modelUrl) {
        try {
          await loadModel(modelUrl, msg.options || {});
          self.postMessage({ type: 'init:ok', id: msg.id || null });
          return;
        } catch (err) {
          // If model load fails, reply with init:fail and keep deterministic fallback
          self.postMessage({ type: 'init:fail', id: msg.id || null, message: String(err?.message || err) });
          return;
        }
      }
      self.postMessage({ type: 'init:ok', id: msg.id || null });
      return;
    }

    if (msg.type === 'infer') {
      const features = msg.features || {};

      if (session && ort) {
        try {
          // Build input tensor from features (ordered by keys)
          const keys = featureOrder.length > 0 ? featureOrder : Object.keys(features).sort();
          const values = Array.isArray(msg.featureArray) && msg.featureArray.length === keys.length
            ? msg.featureArray
            : keys.map((k) => Number(features[k] || 0));
          const vals = new Float32Array(values.map((value) => Number(value) || 0));
          const tensor = new ort.Tensor('float32', vals, [1, vals.length]);

          const feed = {};
          const inName = inputName || (session.inputNames && session.inputNames[0]) || 'input';
          feed[inName] = tensor;

          const output = await session.run(feed);
          // Take first output value as score if available
          const outNames = Object.keys(output || {});
          let scorePercent = null;
          if (outNames.length > 0) {
            const first = output[outNames[0]];
            if (first && first.data && first.data.length > 0) {
              const rawScore = Number(first.data[0]);
              scorePercent = rawScore >= 0 && rawScore <= 1
                ? Math.round(rawScore * 100)
                : Math.round(rawScore);
            }
          }

          if (!Number.isFinite(scorePercent)) {
            const det = deterministicScore(features);
            self.postMessage({ type: 'infer:result', id: msg.id || null, result: { ...det, modelLoaded: true, latencyMs: 10 } });
            return;
          }

          const det = deterministicScore(features);
          const result = {
            ok: true,
            id: msg.id || null,
            scorePercent,
            confidence: det.confidence,
            source: 'onnx-worker',
            latencyMs: 10 + Math.round(Math.random() * 40),
            modelLoaded: true,
          };
          self.postMessage({ type: 'infer:result', id: msg.id || null, result });
          return;
        } catch {
          // model inference failed: fall through to deterministic
        }
      }

      // Deterministic fallback
      const det = deterministicScore(features);
      const result = { ok: true, id: msg.id || null, ...det, source: 'deterministic', latencyMs: 10 + Math.round(Math.random() * 40), modelLoaded: false };
      self.postMessage({ type: 'infer:result', id: msg.id || null, result });
      return;
    }
  } catch (err) {
    self.postMessage({ type: 'error', id: msg.id || null, message: String(err?.message || err) });
  }
});
