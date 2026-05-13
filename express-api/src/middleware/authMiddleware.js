const { verifyAccessToken } = require('../services/authService');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Access token is required',
      instance: req.originalUrl
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(401).json({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Invalid or expired token',
      instance: req.originalUrl
    });
  }

  req.user = decoded;
  next();
}

module.exports = { authenticateToken };