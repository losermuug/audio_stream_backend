import crypto from 'node:crypto';

const HASH_ALGORITHM = 'sha512';
const KEY_LENGTH = 64;
const DEFAULT_ITERATIONS = 210000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto
    .pbkdf2Sync(password, salt, DEFAULT_ITERATIONS, KEY_LENGTH, HASH_ALGORITHM)
    .toString('base64url');

  return `pbkdf2$${DEFAULT_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;

  const [scheme, iterationsRaw, salt, originalHash] = storedHash.split('$');

  if (scheme !== 'pbkdf2' || !iterationsRaw || !salt || !originalHash) return false;

  const hash = crypto
    .pbkdf2Sync(password, salt, Number.parseInt(iterationsRaw, 10), KEY_LENGTH, HASH_ALGORITHM)
    .toString('base64url');
  const hashBuffer = Buffer.from(hash);
  const originalHashBuffer = Buffer.from(originalHash);

  return hashBuffer.length === originalHashBuffer.length && crypto.timingSafeEqual(hashBuffer, originalHashBuffer);
}
