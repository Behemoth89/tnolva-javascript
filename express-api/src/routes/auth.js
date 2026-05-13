const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * @swagger
 * /api/v1/Account/Login:
 *   post:
 *     tags:
 *       - Account
 *     parameters:
 *       - name: expiresInSeconds
 *         in: query
 *         schema:
 *           type: integer
 *           format: int32
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 nullable: true
 *               password:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Message'
 */
router.post('/Login', authController.login);

/**
 * @swagger
 * /api/v1/Account/Register:
 *   post:
 *     tags:
 *       - Account
 *     parameters:
 *       - name: expiresInSeconds
 *         in: query
 *         schema:
 *           type: integer
 *           format: int32
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 nullable: true
 *               password:
 *                 type: string
 *                 nullable: true
 *               firstName:
 *                 type: string
 *                 nullable: true
 *               lastName:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Identity.JwtResponse'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Message'
 */
router.post('/Register', authController.register);

/**
 * @swagger
 * /api/v1/Account/RefreshToken:
 *   post:
 *     tags:
 *       - Account
 *     parameters:
 *       - name: expiresInSeconds
 *         in: query
 *         schema:
 *           type: integer
 *           format: int32
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               jwt:
 *                 type: string
 *                 nullable: true
 *               refreshToken:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Identity.JwtResponse'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicApi.DTO.v1.Message'
 */
router.post('/RefreshToken', authController.refreshToken);

module.exports = router;