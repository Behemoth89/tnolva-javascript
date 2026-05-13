const express = require('express');
const router = express.Router();
const todoCategoriesController = require('../controllers/todoCategoriesController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/v1/TodoCategories:
 *   get:
 *     tags:
 *       - TodoCategories
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
 *                 $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoCategory'
 *   post:
 *     tags:
 *       - TodoCategories
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 128
 *               categorySort:
 *                 type: integer
 *                 format: int32
 *               tag:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoCategory'
 */
router.get('/', authenticateToken, todoCategoriesController.getAll);
router.post('/', authenticateToken, todoCategoriesController.create);

/**
 * @swagger
 * /api/v1/TodoCategories/{id}:
 *   get:
 *     tags:
 *       - TodoCategories
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
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoCategory'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Microsoft.AspNetCore.Mvc.ProblemDetails'
 *   put:
 *     tags:
 *       - TodoCategories
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
 *               categoryName:
 *                 type: string
 *                 nullable: true
 *               categorySort:
 *                 type: integer
 *                 format: int32
 *               syncDt:
 *                 type: string
 *                 format: date-time
 *               tag:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Todo.TodoCategory'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Microsoft.AspNetCore.Mvc.ProblemDetails'
 *   delete:
 *     tags:
 *       - TodoCategories
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
 *       204:
 *         description: No Content
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Microsoft.AspNetCore.Mvc.ProblemDetails'
 */
router.get('/:id', authenticateToken, todoCategoriesController.getById);
router.put('/:id', authenticateToken, todoCategoriesController.update);
router.delete('/:id', authenticateToken, todoCategoriesController.remove);

module.exports = router;