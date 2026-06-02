const crypto = require('crypto');

const HASH_ALGORITHM = 'sha512';
const KEY_LENGTH = 64;
const DEFAULT_ITERATIONS = 210000;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto
    .pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, KEY_LENGTH, HASH_ALGORITHM)
    .toString('base64url');

  return `pbkdf2$${DEFAULT_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) {
    return false;
  }

  const [scheme, iterationsRaw, salt, originalHash] = storedHash.split('$');

  if (scheme !== 'pbkdf2' || !iterationsRaw || !salt || !originalHash) {
    return false;
  }

  const iterations = Number.parseInt(iterationsRaw, 10);
  const hash = crypto
    .pbkdf2Sync(password, salt, iterations, KEY_LENGTH, HASH_ALGORITHM)
    .toString('base64url');

  const hashBuffer = Buffer.from(hash);
  const originalHashBuffer = Buffer.from(originalHash);

  if (hashBuffer.length !== originalHashBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, originalHashBuffer);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
