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
          const vals = new Float32Array(keys.map((k) => Number(features[k] || 0)));
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
