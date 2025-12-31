const chatController = require("../../../src/controllers/chat.controller");
const chatService = require("../../../src/services/chat.service");

jest.mock("../../../src/services/chat.service");

describe("ChatController", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 1 },
      params: {},
      query: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("getConversations", () => {
    it("should return 200 with list", async () => {
      chatService.getConversations.mockResolvedValue([]);
      await chatController.getConversations(req, res, next);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.getConversations.mockRejectedValue(error);
      await chatController.getConversations(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getMessages", () => {
    it("should return 200 with messages", async () => {
      req.query.conversationId = 10;
      chatService.getMessages.mockResolvedValue([]);
      await chatController.getMessages(req, res, next);
      expect(chatService.getMessages).toHaveBeenCalledWith(10, 1);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.getMessages.mockRejectedValue(error);
      await chatController.getMessages(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("sendMessage", () => {
    it("should return 201 with message", async () => {
      req.body = { content: "Hi" };
      chatService.sendMessage.mockResolvedValue({ id: 1 });
      await chatController.sendMessage(req, res, next);
      expect(chatService.sendMessage).toHaveBeenCalledWith(1, {
        content: "Hi",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.sendMessage.mockRejectedValue(error);
      await chatController.sendMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("createConversation", () => {
    it("should return 201 with conversation", async () => {
      req.body = { recipientId: 2 };
      chatService.createConversation.mockResolvedValue({ id: 10 });
      await chatController.createConversation(req, res, next);
      expect(chatService.createConversation).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 10 });
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.createConversation.mockRejectedValue(error);
      await chatController.createConversation(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("markAsRead", () => {
    it("should return 204", async () => {
      req.params.conversationId = 10;
      await chatController.markAsRead(req, res, next);
      expect(chatService.markMessagesAsRead).toHaveBeenCalledWith(10, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.markMessagesAsRead.mockRejectedValue(error);
      await chatController.markAsRead(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("markAsDelivered", () => {
    it("should return 204", async () => {
      req.params.conversationId = 10;
      await chatController.markAsDelivered(req, res, next);
      expect(chatService.markAsDelivered).toHaveBeenCalledWith(10, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.markAsDelivered.mockRejectedValue(error);
      await chatController.markAsDelivered(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("getUnreadCount", () => {
    it("should return 200 with count", async () => {
      chatService.getUnreadCount.mockResolvedValue(5);
      await chatController.getUnreadCount(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.getUnreadCount.mockRejectedValue(error);
      await chatController.getUnreadCount(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteMessage", () => {
    it("should return 204", async () => {
      req.params.messageId = 100;
      await chatController.deleteMessage(req, res, next);
      expect(chatService.deleteMessage).toHaveBeenCalledWith(100, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.deleteMessage.mockRejectedValue(error);
      await chatController.deleteMessage(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteConversation", () => {
    it("should return 204", async () => {
      req.params.conversationId = 55;
      await chatController.deleteConversation(req, res, next);
      expect(chatService.deleteConversation).toHaveBeenCalledWith(55, 1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it("should handle error", async () => {
      const error = new Error("Test");
      chatService.deleteConversation.mockRejectedValue(error);
      await chatController.deleteConversation(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
