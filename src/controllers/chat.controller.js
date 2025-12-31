const chatService = require("../services/chat.service");

exports.getConversations = async (req, res, next) => {
  try {
    const data = await chatService.getConversations(req.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const data = await chatService.getMessages(
      req.query.conversationId,
      req.user.id
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const data = await chatService.sendMessage(req.user.id, req.body);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.createConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const data = await chatService.createConversation(req.user.id, recipientId);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await chatService.markMessagesAsRead(conversationId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.markAsDelivered = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await chatService.markAsDelivered(conversationId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await chatService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    await chatService.deleteMessage(messageId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await chatService.deleteConversation(conversationId, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
