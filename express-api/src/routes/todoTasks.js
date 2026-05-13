const express = require('express');
const router = express.Router();
const todoTasksController = require('../controllers/todoTasksController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/v1/TodoTasks:
 *   get:
 *     tags:
 *       - TodoTasks
 *     security:
 *       - Bearer: []
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoTask'
 *   post:
 *     tags:
 *       - TodoTasks
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskName:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 128
 *               taskSort:
 *                 type: integer
 *                 format: int32
 *               createdDt:
 *                 type: string
 *                 format: date-time
 *               dueDt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               isCompleted:
 *                 type: boolean
 *               isArchived:
 *                 type: boolean
 *               todoCategoryId:
 *                 type: string
 *                 format: uuid
 *               todoPriorityId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoTask'
 */
router.get('/', authenticateToken, todoTasksController.getAll);
router.post('/', authenticateToken, todoTasksController.create);

/**
 * @swagger
 * /api/v1/TodoTasks/{id}:
 *   get:
 *     tags:
 *       - TodoTasks
 *     security:
 *       - Bearer: []
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
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoTask'
 *   put:
 *     tags:
 *       - TodoTasks
 *     security:
 *       - Bearer: []
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
 *               taskName:
 *                 type: string
 *                 nullable: true
 *               taskSort:
 *                 type: integer
 *                 format: int32
 *               createdDt:
 *                 type: string
 *                 format: date-time
 *               dueDt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *               isCompleted:
 *                 type: boolean
 *               isArchived:
 *                 type: boolean
 *               todoCategoryId:
 *                 type: string
 *                 format: uuid
 *               todoPriorityId:
 *                 type: string
 *                 format: uuid
 *               syncDt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoTask'
 *   delete:
 *     tags:
 *       - TodoTasks
 *     security:
 *       - Bearer: []
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
router.get('/:id', authenticateToken, todoTasksController.getById);
router.put('/:id', authenticateToken, todoTasksController.update);
router.delete('/:id', authenticateToken, todoTasksController.remove);

module.exports = router;