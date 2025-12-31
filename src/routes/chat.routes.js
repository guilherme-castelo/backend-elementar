const express = require("express");
const router = express.Router();
const controller = require("../controllers/chat.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get(
  "/conversations",
  checkPermission("chat:read"),
  controller.getConversations
);

router.get("/messages", checkPermission("chat:read"), controller.getMessages);
router.post("/messages", checkPermission("chat:write"), controller.sendMessage);
router.delete(
  "/messages/:messageId",
  checkPermission("chat:delete"),
  controller.deleteMessage
);

router.post(
  "/conversations",
  checkPermission("chat:write"),
  controller.createConversation
);

router.post(
  "/conversations/:conversationId/read",
  checkPermission("chat:read"),
  controller.markAsRead
);

router.post(
  "/conversations/:conversationId/delivered",
  checkPermission("chat:read"),
  controller.markAsDelivered
);

router.delete(
  "/conversations/:conversationId",
  checkPermission("chat:delete"),
  controller.deleteConversation
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
router.get(
  "/unread-count",
  checkPermission("chat:read"),
  controller.getUnreadCount
);

module.exports = router;
