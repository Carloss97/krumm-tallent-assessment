import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const FORBIDDEN_SESSION_PAYLOAD_KEYS = new Set([
  'imageData',
  'imageBytes',
  'pixelData',
  'pixels',
  'canvas',
  'canvasData',
  'canvasBlob',
  'base64',
  'blob',
  'blobs',
  'frame',
  'frames',
  'frameData',
  'rawFrame',
  'rawFrames',
  'videoFrame',
  'videoFrames',
  'webcamFrame',
  'webcamFrames',
  'cameraFrame',
  'cameraFrames',
  'rawVideo',
  'rawVideos',
  'videoData',
  'videoBlob',
  'srcObject',
  'faceLandmarks',
  'facialLandmarks',
  'normalizedLandmarks',
  'rawLandmarks',
  'landmarks',
].map((key) => key.toLowerCase()));

const MEDIA_LIKE_VALUE_PATTERN = /data:(image|video|application\/octet-stream)[^,]*,|base64,/i;

const findForbiddenRawMedia = (value, path = '$') => {
  if (typeof value === 'string') {
    return MEDIA_LIKE_VALUE_PATTERN.test(value)
      ? { path, reason: 'forbidden raw media value' }
      : null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenRawMedia(value[index], `${path}[${index}]`);
      if (found) return found;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_SESSION_PAYLOAD_KEYS.has(String(key).toLowerCase())) {
      return { path: childPath, reason: 'forbidden raw media key' };
    }
    const found = findForbiddenRawMedia(child, childPath);
    if (found) return found;
  }

  return null;
};

const sessionSchema = {
  type: 'object',
  properties: {
    participant: {
      type: 'object',
      properties: {
        participantId: { type: 'string', minLength: 3 },
        email: { type: 'string', format: 'email' },
        fullName: { type: 'string' }
      },
      required: ['participantId'],
      additionalProperties: false
    },
      sessionData: {
        type: 'object',
        properties: {
          startedAt: { type: 'string', format: 'date-time' },
          events: { type: 'array' }
        },
        required: ['startedAt'],
        additionalProperties: true
      }
  },
  required: ['participant', 'sessionData'],
  additionalProperties: true
};

const validateSessionShape = ajv.compile(sessionSchema);

export const validateSession = (payload) => {
  const shapeValid = validateSessionShape(payload);
  if (!shapeValid) {
    validateSession.errors = validateSessionShape.errors;
    return false;
  }

  const forbidden = findForbiddenRawMedia(payload);
  if (forbidden) {
    validateSession.errors = [{
      instancePath: forbidden.path,
      schemaPath: '#/privacy/noRawMedia',
      keyword: 'privacySafeTelemetry',
      params: { reason: forbidden.reason },
      message: `${forbidden.reason}: ${forbidden.path}`,
    }];
    return false;
  }

  validateSession.errors = null;
  return true;
};

validateSession.errors = null;
export default validateSession;
