const {
  getAllTodoCategories,
  getTodoCategoryById,
  createTodoCategory,
  updateTodoCategory,
  deleteTodoCategory
} = require('../models/TodoCategory');

async function getAll(req, res) {
  try {
    const categories = await getAllTodoCategories();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
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
    const category = await getTodoCategoryById(id);

    if (!category) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'TodoCategory not found',
        instance: req.originalUrl
      });
    }

    res.status(200).json(category);
  } catch (error) {
    console.error('Get category error:', error);
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
    const { categoryName, categorySort, tag } = req.body;

    const category = await createTodoCategory(categoryName, categorySort, tag);

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
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
    const { categoryName, categorySort, tag } = req.body;

    const existing = await getTodoCategoryById(id);
    if (!existing) {
      return res.status(400).json({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'TodoCategory not found',
        instance: req.originalUrl
      });
    }

    const updated = await updateTodoCategory(id, { categoryName, categorySort, tag });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Update category error:', error);
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
    const category = await getTodoCategoryById(id);

    if (!category) {
      return res.status(404).json({
        type: 'about:blank',
        title: 'Not Found',
        status: 404,
        detail: 'TodoCategory not found',
        instance: req.originalUrl
      });
    }

    await deleteTodoCategory(id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
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