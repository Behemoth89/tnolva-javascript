const db = require('../config/db');

function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      let value = obj[key];
      if (value instanceof Date) {
        value = value.toISOString();
      } else if (value && typeof value === 'object') {
        value = toCamelCase(value);
      }
      acc[camelKey] = value;
      return acc;
    }, {});
  }
  return obj;
}

function toISOString(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function toISODate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && Object.keys(value).length === 0) return null;
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

async function createTodoTask(data) {
  const dueDt = toISODate(data.dueDt);
  const createdDt = toISODate(data.createdDt) || new Date().toISOString();
  
  const result = await db.query(
    `INSERT INTO todo_tasks (task_name, task_sort, created_dt, due_dt, is_completed, is_archived, todo_category_id, todo_priority_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.taskName || null,
      data.taskSort || 0,
      createdDt,
      dueDt,
      data.isCompleted || false,
      data.isArchived || false,
      data.todoCategoryId || null,
      data.todoPriorityId || null
    ]
  );
  return toCamelCase(result.rows[0]);
}

async function getAllTodoTasks() {
  const result = await db.query('SELECT * FROM todo_tasks ORDER BY task_sort ASC');
  return toCamelCase(result.rows);
}

async function getTodoTaskById(id) {
  const result = await db.query('SELECT * FROM todo_tasks WHERE id = $1', [id]);
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function updateTodoTask(id, data) {
  const dueDt = data.dueDt === undefined ? null : toISODate(data.dueDt);
  const createdDt = toISODate(data.createdDt);
  
  const result = await db.query(
    `UPDATE todo_tasks SET
       task_name = COALESCE($1, task_name),
       task_sort = COALESCE($2, task_sort),
       created_dt = COALESCE($3, created_dt),
       due_dt = $4,
       is_completed = COALESCE($5, is_completed),
       is_archived = COALESCE($6, is_archived),
       todo_category_id = $7,
       todo_priority_id = $8,
       sync_dt = current_timestamp
     WHERE id = $9
     RETURNING *`,
    [
      data.taskName,
      data.taskSort,
      createdDt,
      dueDt,
      data.isCompleted,
      data.isArchived,
      data.todoCategoryId,
      data.todoPriorityId,
      id
    ]
  );
  return result.rows[0] ? toCamelCase(result.rows[0]) : null;
}

async function deleteTodoTask(id) {
  const result = await db.query('DELETE FROM todo_tasks WHERE id = $1 RETURNING id', [id]);
  return result.rows.length > 0;
}

module.exports = {
  createTodoTask,
  getAllTodoTasks,
  getTodoTaskById,
  updateTodoTask,
  deleteTodoTask
};