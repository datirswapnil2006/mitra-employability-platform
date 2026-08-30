const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mitra_super_secret_jwt_key_2026_employability';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token: 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Refresh token lifetime: 7 days
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity timeout

const generateAccessToken = (user) => {
  const payload = {
    id: user._id || user.id,
    role: user.role
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: REFRESH_TOKEN_EXPIRY_MS
  };
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, getCookieOptions());
};

const clearRefreshTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  });
};

module.exports = {
  JWT_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
  REFRESH_TOKEN_EXPIRY_MS,
  INACTIVITY_TIMEOUT_MS,
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getCookieOptions,
  setRefreshTokenCookie,
  clearRefreshTokenCookie
};
