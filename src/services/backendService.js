const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : '';

// Token management for JWT
let participantToken = null;
let tokenExpiresAt = null;

const getStoredToken = () => {
  try {
    const stored = sessionStorage.getItem('participantToken');
    const expiresAt = sessionStorage.getItem('tokenExpiresAt');
    if (stored && expiresAt && Date.now() < parseInt(expiresAt, 10)) {
      participantToken = stored;
      tokenExpiresAt = parseInt(expiresAt, 10);
      return stored;
    }
    sessionStorage.removeItem('participantToken');
    sessionStorage.removeItem('tokenExpiresAt');
    participantToken = null;
    tokenExpiresAt = null;
    return null;
  } catch (err) {
    console.warn('Error reading stored token:', err);
    return null;
  }
};

const storeToken = (token, expiresIn) => {
  try {
    participantToken = token;
    tokenExpiresAt = Date.now() + (expiresIn * 1000);
    sessionStorage.setItem('participantToken', token);
    sessionStorage.setItem('tokenExpiresAt', tokenExpiresAt.toString());
  } catch (err) {
    console.error('Error storing token:', err);
  }
};

const apiFetch = async (path, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  // Add JWT token if available
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options
  });

  const body = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Token invalid or expired, clear it
      sessionStorage.removeItem('participantToken');
      sessionStorage.removeItem('tokenExpiresAt');
      participantToken = null;
      tokenExpiresAt = null;
    }
    throw new Error(body.error || body.message || 'Backend request failed');
  }

  return body;
};

export const authenticateParticipant = async (credentials) => {
  const response = await apiFetch('/api/auth/participant', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  // Store JWT token if provided
  if (response.participantToken) {
    storeToken(response.participantToken, response.expiresIn || 86400);
  }

  return response;
};

export const authenticateRecruiter = async (credentials) => {
  const response = await apiFetch('/api/auth/recruiter', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

  if (response.recruiterToken) {
    storeToken(response.recruiterToken, response.expiresIn || 604800);
  }

  return response;
};

export const saveSessionToBackend = async (sessionData) => {
  try {
    return await apiFetch('/api/session', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  } catch (error) {
    console.error('Failed to save session to backend', error);
    throw error;
  }
};

export const getRecruiterSessions = async () => {
  return apiFetch('/api/recruiter/sessions', {
    method: 'GET'
  });
};

export const getCurrentToken = () => {
  return getStoredToken();
};

export const clearToken = () => {
  try {
    sessionStorage.removeItem('participantToken');
    sessionStorage.removeItem('tokenExpiresAt');
    participantToken = null;
    tokenExpiresAt = null;
  } catch (err) {
    console.warn('Error clearing token:', err);
  }
};