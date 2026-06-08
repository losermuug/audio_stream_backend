import { getRefreshExpiry, hashToken, signToken, verifyToken } from './token.service.js';
import type { PrismaClient } from '@prisma/client';

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

type AuthMeta = {
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type UserLike = {
  id: string;
  email: string;
  role: string;
  userName?: string;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

type SessionLike = {
  id: string;
};

function sanitizeUser(user: UserLike): Record<string, unknown> {
  return {
    ...user,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

export function normalizeRole(role?: string | null): 'artist' | 'listener' {
  return role === 'artist' ? 'artist' : 'listener';
}

export function createAccessToken(user: UserLike): string {
  return signToken(
    { sub: user.id, email: user.email, role: user.role, type: 'access' },
    process.env.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_EXPIRES_IN
  );
}

export function createRefreshToken(user: UserLike, sessionId: string): string {
  return signToken(
    { sub: user.id, sid: sessionId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_EXPIRES_IN
  );
}

export function authPayload(user: UserLike, session: SessionLike, refreshToken: string) {
  return {
    accessToken: createAccessToken(user),
    refreshToken,
    sessionId: session.id,
    user: sanitizeUser(user),
  };
}

export async function issueTokens(prisma: PrismaClient, user: UserLike, meta: AuthMeta = {}) {
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: 'pending',
      expiresAt: getRefreshExpiry(),
      deviceId: meta.deviceId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
  const refreshToken = createRefreshToken(user, session.id);
  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashToken(refreshToken) },
  });

  return authPayload(user, updatedSession, refreshToken);
}

export async function rotateRefreshToken(prisma: PrismaClient, refreshToken: string, meta: AuthMeta = {}) {
  let payload;

  try {
    payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (_error) {
    throw new Error('Invalid refresh token');
  }

  const [session, user] = await Promise.all([
    prisma.session.findFirst({
      where: {
        id: payload.sid,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    }),
    prisma.user.findUnique({ where: { id: payload.sub } }),
  ]);

  if (!session || !user || !user.isActive || session.refreshTokenHash !== hashToken(refreshToken)) {
    throw new Error('Invalid refresh token');
  }

  const nextRefreshToken = createRefreshToken(user, session.id);
  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: hashToken(nextRefreshToken),
      expiresAt: getRefreshExpiry(),
      deviceId: meta.deviceId || session.deviceId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  return authPayload(user, updatedSession, nextRefreshToken);
}

export async function revokeRefreshToken(prisma: PrismaClient, refreshToken?: string | null): Promise<boolean> {
  if (!refreshToken) return true;

  try {
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (payload.sid) {
      await prisma.session.update({
        where: { id: payload.sid },
        data: { revokedAt: new Date() },
      });
    }
  } catch (_error) {
    return true;
  }

  return true;
}
