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

async function createTodoCategory(categoryName, categorySort = 0, tag = null) {
  const result = await db.query(
    `INSERT INTO todo_categories (category_name, category_sort, tag, sync_dt)
     VALUES ($1, $2, $3, current_timestamp) RETURNING *`,
    [categoryName, categorySort, tag]
  );
  return toCamelCase(result.rows[0]);
}

async function getAllTodoCategories() {
  const result = await db.query('SELECT * FROM todo_categories ORDER BY category_sort ASC');
  return toCamelCase(result.rows);
}

async function getTodoCategoryById(id) {
  const result = await db.query('SELECT * FROM todo_categories WHERE id = $1', [id]);
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function updateTodoCategory(id, data) {
  const result = await db.query(
    `UPDATE todo_categories SET
       category_name = COALESCE($1, category_name),
       category_sort = COALESCE($2, category_sort),
       tag = $3,
       sync_dt = current_timestamp
     WHERE id = $4
     RETURNING *`,
    [data.categoryName, data.categorySort, data.tag, id]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function deleteTodoCategory(id) {
  const result = await db.query('DELETE FROM todo_categories WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

module.exports = {
  createTodoCategory,
  getAllTodoCategories,
  getTodoCategoryById,
  updateTodoCategory,
  deleteTodoCategory
};