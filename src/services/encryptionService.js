import CryptoJS from 'crypto-js';

/**
 * Encryption Service - Edge Computing
 * Encrypts sensitive telemetry locally before transmission
 * Uses CryptoJS for AES-256 encryption
 */

// Encryption key derivation from participant ID
const deriveEncryptionKey = (participantId) => {
  // Use SHA256 to derive a consistent key from participant ID
  const seed = `krumm-telemetry-${participantId}`;
  return CryptoJS.SHA256(seed).toString();
};

/**
 * Encrypts telemetry data client-side (edge computing)
 * Uses AES-256 encryption via CryptoJS
 * @param {Object} telemetryData - The data to encrypt
 * @param {string} participantId - Participant identifier for key derivation
 * @returns {Object} Encrypted payload with metadata
 */
export const encryptTelemetry = (telemetryData, participantId) => {
  try {
    const key = deriveEncryptionKey(participantId);
    
    // Serialize the data
    const plaintext = JSON.stringify(telemetryData);
    
    // Encrypt using AES-256
    const encrypted = CryptoJS.AES.encrypt(plaintext, key).toString();
    
    return {
      type: 'encrypted_telemetry_v1',
      ciphertext: encrypted,
      participantIdHash: CryptoJS.SHA256(participantId).toString().substring(0, 16),
      encryptedAt: new Date().toISOString(),
      algorithm: 'AES-256-CBC'
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt telemetry data');
  }
};

/**
 * Decrypts telemetry data (server-side only)
 * @param {Object} encryptedPayload - The encrypted payload
 * @param {string} participantId - Participant identifier for key derivation
 * @returns {Object} Decrypted telemetry data
 */
export const decryptTelemetry = (encryptedPayload, participantId) => {
  try {
    if (encryptedPayload.type !== 'encrypted_telemetry_v1') {
      throw new Error('Invalid encrypted payload format');
    }

    const key = deriveEncryptionKey(participantId);
    const decrypted = CryptoJS.AES.decrypt(encryptedPayload.ciphertext, key).toString(CryptoJS.enc.Utf8);
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt telemetry data');
  }
};

/**
 * Creates a hash of sensitive data for comparison without storing raw data
 * @param {*} data - Data to hash
 * @returns {string} SHA256 hash
 */
export const hashSensitiveData = (data) => {
  const serialized = JSON.stringify(data);
  return CryptoJS.SHA256(serialized).toString();
};

/**
 * Anonymizes participant ID for analytics (one-way hash)
 * @param {string} participantId - Original participant ID
 * @returns {string} Hashed participant ID (safe for analytics)
 */
export const anonymizeParticipantId = (participantId) => {
  return CryptoJS.SHA256(participantId).toString().substring(0, 16);
};
