const crypto = require('crypto');

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function parseDuration(value) {
  const match = String(value).match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid token duration: ${value}`);
  }

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
}

function signToken(payload, secret, expiresIn) {
  if (!secret) {
    throw new Error('JWT secret is missing');
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + parseDuration(expiresIn),
  };
  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(body);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token, secret) {
  if (!secret) {
    throw new Error('JWT secret is missing');
  }

  const [encodedHeader, encodedPayload, signature] = String(token).split('.');

  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error('Invalid token');
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    throw new Error('Invalid token signature');
  }

  const payload = base64UrlDecode(encodedPayload);
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp <= now) {
    throw new Error('Token expired');
  }

  return payload;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getBearerToken(req) {
  const authorization = req.header('Authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

module.exports = {
  getBearerToken,
  hashToken,
  parseDuration,
  signToken,
  verifyToken,
};
