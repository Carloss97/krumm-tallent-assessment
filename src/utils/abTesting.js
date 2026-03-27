const DEFAULT_VARIANTS = ['control', 'variant'];
const STORAGE_PREFIX = 'ab:';

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function assignVariant(experimentKey, identitySeed = 'anonymous', variants = DEFAULT_VARIANTS) {
  if (!experimentKey || !Array.isArray(variants) || variants.length === 0) {
    return 'control';
  }

  const storageKey = `${STORAGE_PREFIX}${experimentKey}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing && variants.includes(existing)) {
      return existing;
    }
  } catch {
    // Ignore storage read errors and fallback to deterministic hash.
  }

  const bucket = hashString(`${experimentKey}:${identitySeed}`) % variants.length;
  const selected = variants[bucket];

  try {
    sessionStorage.setItem(storageKey, selected);
  } catch {
    // Ignore storage write errors.
  }

  return selected;
}

export function getExperimentConfig(experimentKey, identitySeed) {
  const variant = assignVariant(experimentKey, identitySeed, ['control', 'insight-panel']);
  return {
    variant,
    showTelemetryInsightPanel: variant === 'insight-panel',
  };
}
