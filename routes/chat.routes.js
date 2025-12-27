const express = require("express");
const router = express.Router();
const controller = require("../controllers/chat.controller");
const authGuard = require("../middlewares/auth");

router.use(authGuard);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat and messaging
 */

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get all conversations
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 *   post:
 *     summary: Create a new conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantIds
 *             properties:
 *               participantIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Conversation created
 */
router.get("/conversations", controller.getConversations);

/**
 * @swagger
 * /chat/messages:
 *   get:
 *     summary: Get messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of messages
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - conversationId
 *               - content
 *             properties:
 *               conversationId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 */
router.get("/messages", controller.getMessages);
router.post("/messages", controller.sendMessage);

router.post("/conversations", controller.createConversation);

/**
 * @swagger
 * /chat/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark conversation as read
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.post("/conversations/:conversationId/read", controller.markAsRead);

/**
 * @swagger
 * /chat/conversations/{conversationId}/delivered:
 *   post:
 *     summary: Mark conversation as delivered
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as delivered
 */
router.post(
  "/conversations/:conversationId/delivered",
  controller.markAsDelivered
);

/**
 * @swagger
 * /chat/unread-count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get("/unread-count", controller.getUnreadCount);

module.exports = router;
