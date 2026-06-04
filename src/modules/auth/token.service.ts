import crypto from 'node:crypto';

type JwtPayload = Record<string, any>;

export function parseDuration(value: string): number {
  const match = String(value).match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid token duration: ${value}`);
  }

  const amount = Number.parseInt(match[1], 10);
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 };

  return amount * multipliers[match[2]];
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeJson(value: string): JwtPayload {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

export function signToken(payload: JwtPayload, secret: string | undefined, expiresIn: string): string {
  if (!secret) throw new Error('JWT secret is missing');

  const now = Math.floor(Date.now() / 1000);
  const encodedHeader = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const encodedPayload = encodeJson({ ...payload, iat: now, exp: now + parseDuration(expiresIn) });
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string, secret: string | undefined): JwtPayload {
  if (!secret) throw new Error('JWT secret is missing');

  const [encodedHeader, encodedPayload, signature] = String(token).split('.');

  if (!encodedHeader || !encodedPayload || !signature) throw new Error('Invalid token');

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

  const payload = decodeJson(encodedPayload);

  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }

  return payload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function readBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization') || '';
  const [scheme, token] = authorization.split(' ');

  return scheme === 'Bearer' && token ? token : null;
}

export function getAccessTokenUser(request: Request): { id: string; email?: string; role: string } | null {
  const token = readBearerToken(request);

  if (!token) return null;

  const payload = verifyToken(token, process.env.JWT_ACCESS_SECRET);

  if (payload.type !== 'access' || !payload.sub) return null;

  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}

export function getRefreshExpiry() {
  return new Date(Date.now() + parseDuration(process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') * 1000);
}
