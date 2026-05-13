const {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserRefreshToken
} = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  removeRefreshToken,
  comparePassword,
  hashPassword
} = require('../services/authService');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(404).json({
        messages: ['Email and password are required']
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        messages: ['Invalid email or password']
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(404).json({
        messages: ['Invalid email or password']
      });
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateUserRefreshToken(user.id, refreshToken);

    res.status(200).json({
      token,
      refreshToken,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      messages: ['Internal server error']
    });
  }
}

async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        messages: ['Email and password are required']
      });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        messages: ['User with this email already exists']
      });
    }

    const hashedPassword = await hashPassword(password);
    const user = await createUser(email, hashedPassword, firstName || null, lastName || null);

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await updateUserRefreshToken(user.id, refreshToken);

    res.status(200).json({
      token,
      refreshToken,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      messages: ['Internal server error']
    });
  }
}

async function refreshToken(req, res) {
  try {
    const { jwt, refreshToken } = req.body;

    if (!jwt || !refreshToken) {
      return res.status(400).json({
        messages: ['JWT and refresh token are required']
      });
    }

    const tokenData = verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return res.status(400).json({
        messages: ['Invalid refresh token']
      });
    }

    const user = await findUserById(tokenData.userId);
    if (!user) {
      return res.status(400).json({
        messages: ['User not found']
      });
    }

    removeRefreshToken(refreshToken);

    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await updateUserRefreshToken(user.id, newRefreshToken);

    res.status(200).json({
      token: newToken,
      refreshToken: newRefreshToken,
      firstName: user.firstName,
      lastName: user.lastName
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      messages: ['Internal server error']
    });
  }
}

module.exports = {
  login,
  register,
  refreshToken
};