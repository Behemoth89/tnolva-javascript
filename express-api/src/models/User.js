const db = require('../config/db');

function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

async function createUser(email, password, firstName, lastName) {
  const result = await db.query(
    `INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, password, firstName || null, lastName || null]
  );
  return toCamelCase(result.rows[0]);
}

async function findUserByEmail(email) {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function findUserById(id) {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function updateUserRefreshToken(id, refreshToken) {
  const result = await db.query(
    `UPDATE users SET refresh_token = $1 WHERE id = $2 RETURNING *`,
    [refreshToken, id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function getAllUsers() {
  const result = await db.query('SELECT * FROM users');
  return toCamelCase(result.rows);
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserRefreshToken,
  getAllUsers
};