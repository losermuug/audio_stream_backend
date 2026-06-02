const mongoose = require('mongoose');
const Session = require('../models/Session');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { hashToken, parseDuration, signToken, verifyToken } = require('../utils/token');

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';

function sanitizeUser(user) {
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function getSessionMeta(req) {
  return {
    deviceId: req.body.deviceId,
    ipAddress: req.ip,
    userAgent: req.header('User-Agent'),
  };
}

function getRefreshExpiry() {
  return new Date(Date.now() + parseDuration(REFRESH_TOKEN_EXPIRES_IN) * 1000);
}

function createAccessToken(user) {
  return signToken(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    },
    process.env.JWT_ACCESS_SECRET,
    ACCESS_TOKEN_EXPIRES_IN
  );
}

function createRefreshToken(user, sessionId) {
  return signToken(
    {
      sub: user.id,
      sid: sessionId.toString(),
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    REFRESH_TOKEN_EXPIRES_IN
  );
}

async function issueTokens(user, req) {
  const sessionId = new mongoose.Types.ObjectId();
  const refreshToken = createRefreshToken(user, sessionId);
  const session = await Session.create({
    _id: sessionId,
    user: user.id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: getRefreshExpiry(),
    ...getSessionMeta(req),
  });

  return {
    accessToken: createAccessToken(user),
    refreshToken,
    sessionId: session.id,
    user: sanitizeUser(user),
  };
}

async function register(req, res) {
  const { displayName, email, password, avatarUrl } = req.body;
  const role = req.body.role === 'artist' ? 'artist' : 'listener';

  if (!displayName || !email || !password) {
    return res.status(400).json({ message: 'displayName, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const user = await User.create({
    displayName,
    email,
    avatarUrl,
    role,
    passwordHash: hashPassword(password),
  });

  res.status(201).json(await issueTokens(user, req));
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true }).select('+passwordHash');

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json(await issueTokens(user, req));
}

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'refreshToken is required' });
  }

  let payload;

  try {
    payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  if (payload.type !== 'refresh' || !payload.sub || !payload.sid) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const [session, user] = await Promise.all([
    Session.findOne({
      _id: payload.sid,
      user: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }),
    User.findById(payload.sub),
  ]);

  if (!session || !user || !user.isActive || session.refreshTokenHash !== hashToken(refreshToken)) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }

  const nextRefreshToken = createRefreshToken(user, session.id);
  session.refreshTokenHash = hashToken(nextRefreshToken);
  session.expiresAt = getRefreshExpiry();
  session.deviceId = req.body.deviceId || session.deviceId;
  session.ipAddress = req.ip;
  session.userAgent = req.header('User-Agent');
  await session.save();

  res.json({
    accessToken: createAccessToken(user),
    refreshToken: nextRefreshToken,
    sessionId: session.id,
    user: sanitizeUser(user),
  });
}

async function logout(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(204).send();
  }

  try {
    const payload = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (payload.sid) {
      await Session.findByIdAndUpdate(payload.sid, { revokedAt: new Date() });
    }
  } catch (_error) {
    // Logout stays idempotent even if the client sends a stale token.
  }

  res.status(204).send();
}

module.exports = {
  login,
  logout,
  refresh,
  register,
};
