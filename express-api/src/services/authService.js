const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-change-in-production';

const refreshTokens = new Map();

function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function generateRefreshToken(user) {
  const refreshToken = uuidv4();
  refreshTokens.set(refreshToken, {
    userId: user.id,
    createdAt: new Date().toISOString()
  });
  return refreshToken;
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function verifyRefreshToken(token) {
  return refreshTokens.has(token) ? refreshTokens.get(token) : null;
}

function removeRefreshToken(token) {
  return refreshTokens.delete(token);
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  removeRefreshToken,
  hashPassword,
  comparePassword,
  JWT_SECRET,
  REFRESH_TOKEN_SECRET
};