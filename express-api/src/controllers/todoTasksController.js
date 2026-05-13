const {
  getAllTodoTasks,
  getTodoTaskById,
  createTodoTask,
  updateTodoTask,
  deleteTodoTask
} = require('../models/TodoTask');

async function getAll(req, res) {
  try {
    const tasks = await getAllTodoTasks();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
      instance: req.originalUrl
    });
  }
}

async function getById(req, res) {
  try {
    const { id } = req.params;
    const task = await getTodoTaskById(id);

    if (!task) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'TodoTask not found',
        instance: req.originalUrl
      });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
      instance: req.originalUrl
    });
  }
}

async function create(req, res) {
  try {
    const {
      taskName,
      taskSort,
      createdDt,
      dueDt,
      isCompleted,
      isArchived,
      todoCategoryId,
      todoPriorityId
    } = req.body;

    const task = await createTodoTask({
      taskName,
      taskSort,
      createdDt,
      dueDt,
      isCompleted,
      isArchived,
      todoCategoryId,
      todoPriorityId
    });

    res.status(200).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
      instance: req.originalUrl
    });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const {
      taskName,
      taskSort,
      createdDt,
      dueDt,
      isCompleted,
      isArchived,
      todoCategoryId,
      todoPriorityId
    } = req.body;

    const existing = await getTodoTaskById(id);
    if (!existing) {
      return res.status(400).json({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'TodoTask not found',
        instance: req.originalUrl
      });
    }

    const updated = await updateTodoTask(id, {
      taskName,
      taskSort,
      createdDt,
      dueDt,
      isCompleted,
      isArchived,
      todoCategoryId,
      todoPriorityId
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
      instance: req.originalUrl
    });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const task = await getTodoTaskById(id);

    if (!task) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'TodoTask not found',
        instance: req.originalUrl
      });
    }

    await deleteTodoTask(id);

    res.status(200).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: error.message,
      instance: req.originalUrl
    });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove
};