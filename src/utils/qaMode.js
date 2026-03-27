const QA_MODE_KEY = 'krumm-qa-mode';

const parseQaValue = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'on' || normalized === 'qa';
};

export const getQaMode = () => {
  try {
    if (typeof window === 'undefined') return false;

    const urlQa = new URLSearchParams(window.location.search).get('qa');
    if (parseQaValue(urlQa)) {
      window.localStorage.setItem(QA_MODE_KEY, 'true');
      return true;
    }

    return window.localStorage.getItem(QA_MODE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setQaMode = (enabled) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(QA_MODE_KEY, enabled ? 'true' : 'false');
  } catch {
    // no-op
  }
};

export const qaModeLabel = (language = 'es') => (
  language === 'en' ? 'QA mode' : 'Modo QA'
);
