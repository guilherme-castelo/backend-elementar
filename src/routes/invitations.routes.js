const express = require("express");
const router = express.Router();
const controller = require("../controllers/invitations.controller");
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const checkUsage = require("../middlewares/usage");

// Public Routes (Accepting Invite)
/**
 * @swagger
 * tags:
 *   name: Invitations
 *   description: Invitation management
 */

/**
 * @swagger
 * /invitations/validate/{token}:
 *   get:
 *     summary: Validate invitation token
 *     tags: [Invitations]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Invitation Token
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 */
router.get("/validate/:token", controller.validate);

/**
 * @swagger
 * /invitations/accept:
 *   post:
 *     summary: Accept invitation
 *     tags: [Invitations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - name
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation accepted, user created
 *       400:
 *         description: Bad request
 */
router.post("/accept", controller.accept);

// Protected Routes (Sending Invite)
/**
 * @swagger
 * /invitations:
 *   post:
 *     summary: Send invitation
 *     tags: [Invitations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - roleId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               roleId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invitation sent
 *       403:
 *         description: Plan limit reached
 */
router.post(
  "/",
  authGuard,
  checkPermission("user:create"),
  checkUsage("users"), // Inviting counts against usage limit!
  controller.invite
);

module.exports = router;
