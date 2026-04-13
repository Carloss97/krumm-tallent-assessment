import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

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
      required: ['participantId', 'email'],
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

export const validateSession = ajv.compile(sessionSchema);
export default validateSession;
