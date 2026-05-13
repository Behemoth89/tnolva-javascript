const {
  getAllTodoPriorities,
  getTodoPriorityById,
  createTodoPriority,
  updateTodoPriority,
  deleteTodoPriority
} = require('../models/TodoPriority');

async function getAll(req, res) {
  try {
    const priorities = await getAllTodoPriorities();
    res.status(200).json(priorities);
  } catch (error) {
    console.error('Get priorities error:', error);
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
    const priority = await getTodoPriorityById(id);

    if (!priority) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'TodoPriority not found',
        instance: req.originalUrl
      });
    }

    res.status(200).json(priority);
  } catch (error) {
    console.error('Get priority error:', error);
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
    const { priorityName, prioritySort } = req.body;

    const priority = await createTodoPriority(priorityName, prioritySort);

    res.status(200).json(priority);
  } catch (error) {
    console.error('Create priority error:', error);
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
    const { priorityName, prioritySort } = req.body;

    const existing = await getTodoPriorityById(id);
    if (!existing) {
      return res.status(400).json({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'TodoPriority not found',
        instance: req.originalUrl
      });
    }

    const updated = await updateTodoPriority(id, { priorityName, prioritySort });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update priority error:', error);
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
    const priority = await getTodoPriorityById(id);

    if (!priority) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'TodoPriority not found',
        instance: req.originalUrl
      });
    }

    await deleteTodoPriority(id);

    res.status(200).send();
  } catch (error) {
    console.error('Delete priority error:', error);
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