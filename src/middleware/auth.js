const { getBearerToken, verifyToken } = require('../utils/token');

function readAccessToken(req) {
  const token = getBearerToken(req);

  if (!token) {
    return null;
  }

  return verifyToken(token, process.env.JWT_ACCESS_SECRET);
}

function optionalUser(req, _res, next) {
  try {
    const payload = readAccessToken(req);

    if (payload?.sub) {
      req.user = {
        id: payload.sub,
        role: payload.role,
        email: payload.email,
      };
    }
  } catch (_error) {
    req.user = null;
  }

  next();
}

function requireUser(req, res, next) {
  try {
    const payload = readAccessToken(req);

    if (!payload?.sub) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: error.message === 'Token expired' ? 'Access token expired' : 'Unauthorized',
    });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

module.exports = {
  optionalUser,
  requireRole,
  requireUser,
};
