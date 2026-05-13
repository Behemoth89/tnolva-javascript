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

async function createTodoPriority(priorityName, prioritySort = 0) {
  const result = await db.query(
    `INSERT INTO todo_priorities (priority_name, priority_sort) VALUES ($1, $2) RETURNING *`,
    [priorityName, prioritySort]
  );
  return toCamelCase(result.rows[0]);
}

async function getAllTodoPriorities() {
  const result = await db.query('SELECT * FROM todo_priorities ORDER BY priority_sort ASC');
  return toCamelCase(result.rows);
}

async function getTodoPriorityById(id) {
  const result = await db.query('SELECT * FROM todo_priorities WHERE id = $1', [id]);
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function updateTodoPriority(id, data) {
  const result = await db.query(
    `UPDATE todo_priorities SET
       priority_name = COALESCE($1, priority_name),
       priority_sort = COALESCE($2, priority_sort),
       sync_dt = current_timestamp
     WHERE id = $3
     RETURNING *`,
    [data.priorityName, data.prioritySort, id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function deleteTodoPriority(id) {
  const result = await db.query('DELETE FROM todo_priorities WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

module.exports = {
  createTodoPriority,
  getAllTodoPriorities,
  getTodoPriorityById,
  updateTodoPriority,
  deleteTodoPriority
};