// AES-256-GCM symmetric encryption for sensitive user data (e.g. LC session tokens).
// ENCRYPTION_KEY must be a 64-character hex string (32 bytes) in the environment.
// If the key is absent the feature is gracefully disabled — callers check isEnabled().
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_HEX   = process.env.ENCRYPTION_KEY || '';

function getKey() {
    if (KEY_HEX.length !== 64) return null;
    try { return Buffer.from(KEY_HEX, 'hex'); }
    catch { return null; }
}

/** Returns true when the encryption key is properly configured. */
function isEnabled() { return !!getKey(); }

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {{ iv: string, encryptedToken: string, authTag: string }} all hex-encoded
 */
function encrypt(plaintext) {
    const key = getKey();
    if (!key) throw new Error('ENCRYPTION_KEY is not configured (must be 64 hex chars)');
    const iv = crypto.randomBytes(12);                                         // 96-bit nonce
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return {
        iv:             iv.toString('hex'),
        encryptedToken: enc.toString('hex'),
        authTag:        cipher.getAuthTag().toString('hex'),
    };
}

/**
 * Decrypt a previously encrypted payload.
 * @param {{ iv: string, encryptedToken: string, authTag: string }} payload
 * @returns {string} plaintext
 */
function decrypt({ iv, encryptedToken, authTag }) {
    const key = getKey();
    if (!key) throw new Error('ENCRYPTION_KEY is not configured');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedToken, 'hex')),
        decipher.final(),
    ]).toString('utf8');
}

module.exports = { encrypt, decrypt, isEnabled };
