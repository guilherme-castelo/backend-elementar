const express = require('express');
const router = express.Router();
const controller = require('../controllers/chat.controller');
const authGuard = require('../middlewares/auth');

router.use(authGuard);

router.get('/conversations', controller.getConversations);
router.get('/messages', controller.getMessages);
router.post('/messages', controller.sendMessage);

router.post('/conversations', controller.createConversation);
router.post('/conversations/:conversationId/read', controller.markAsRead);
router.post('/conversations/:conversationId/delivered', controller.markAsDelivered);
router.get('/unread-count', controller.getUnreadCount);

module.exports = router;
