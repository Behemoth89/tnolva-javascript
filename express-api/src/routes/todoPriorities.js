const express = require('express');
const router = express.Router();
const todoPrioritiesController = require('../controllers/todoPrioritiesController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/v1/TodoPriorities:
 *   get:
 *     tags:
 *       - TodoPriorities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoPriority'
 *   post:
 *     tags:
 *       - TodoPriorities
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priorityName:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 128
 *               prioritySort:
 *                 type: integer
 *                 format: int32
 *               syncDt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoPriority'
 */
router.get('/', authenticateToken, todoPrioritiesController.getAll);
router.post('/', authenticateToken, todoPrioritiesController.create);

/**
 * @swagger
 * /api/v1/TodoPriorities/{id}:
 *   get:
 *     tags:
 *       - TodoPriorities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoPriority'
 *   put:
 *     tags:
 *       - TodoPriorities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               priorityName:
 *                 type: string
 *                 nullable: true
 *               prioritySort:
 *                 type: integer
 *                 format: int32
 *               syncDt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags:
 *       - TodoPriorities
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/:id', authenticateToken, todoPrioritiesController.getById);
router.put('/:id', authenticateToken, todoPrioritiesController.update);
router.delete('/:id', authenticateToken, todoPrioritiesController.remove);

module.exports = router;