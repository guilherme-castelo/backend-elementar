const { mockReset } = require("jest-mock-extended");

// Inline mock to be absolutely sure
jest.mock("../../src/utils/socket", () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  }),
}));

jest.mock("../../src/utils/prisma");

const prisma = require("../../src/utils/prisma");
const service = require("../../src/services/chat.service");
const { getIO } = require("../../src/utils/socket");
const {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} = require("../../src/errors/AppError");

describe("ChatService", () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe("getConversations", () => {
    it("should list conversations", async () => {
      const mockConversations = [
        {
          id: 1,
          participants: [{ id: 1 }],
          messages: [{ senderId: 2, status: "sent" }],
        },
      ];
      prisma.conversation.findMany.mockResolvedValue(mockConversations);

      const result = await service.getConversations(1);
      expect(result).toHaveLength(1);
      expect(result[0].participantIds).toEqual([1]);
    });
  });

  describe("getMessages", () => {
    it("should return messages if authorized", async () => {
      prisma.conversation.findFirst.mockResolvedValue({ id: 1 });
      prisma.message.findMany.mockResolvedValue([
        { id: 100, content: "Hello" },
      ]);

      const result = await service.getMessages(1, 1);
      expect(result).toHaveLength(1);
    });

    it("should throw NotFoundError if access denied", async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);
      await expect(service.getMessages(1, 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe("sendMessage", () => {
    it("should throw ValidationError if content missing", async () => {
      await expect(service.sendMessage(1, {})).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError if no recipient or convId", async () => {
      await expect(service.sendMessage(1, { content: "Hi" })).rejects.toThrow(
        ValidationError
      );
    });

    it("should send to existing conversation", async () => {
      const mockConv = { id: 55, participants: [{ id: 1 }, { id: 2 }] };
      prisma.conversation.findFirst.mockResolvedValue(mockConv);
      prisma.message.create.mockResolvedValue({
        id: 100,
        content: "Hi",
        createdAt: new Date(),
      });
      prisma.conversation.update.mockResolvedValue({});
      prisma.conversation.findUnique.mockResolvedValue(mockConv);

      await service.sendMessage(1, { conversationId: 55, content: "Hi" });

      const io = getIO();
      expect(io.to).toHaveBeenCalledWith("2");
      expect(io.emit).toHaveBeenCalledWith("new_message", expect.anything());
    });

    it("should throw NotFound if conversation not found", async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);
      await expect(
        service.sendMessage(1, { conversationId: 99, content: "Hi" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should create new conversation via recipientId (New Context)", async () => {
      // Shared Context Mock
      prisma.userMembership.findMany
        .mockResolvedValueOnce([{ companyId: 1 }]) // Sender
        .mockResolvedValueOnce([{ companyId: 1 }]); // Recipient

      // No existing conversation
      prisma.conversation.findMany.mockResolvedValue([]);

      const newConv = { id: 60, participants: [{ id: 1 }, { id: 2 }] };
      prisma.conversation.create.mockResolvedValue(newConv);
      prisma.message.create.mockResolvedValue({
        id: 101,
        content: "New",
        createdAt: new Date(),
      });
      prisma.conversation.update.mockResolvedValue({});
      prisma.conversation.findUnique.mockResolvedValue(newConv);

      await service.sendMessage(1, { recipientId: 2, content: "New" });

      expect(prisma.conversation.create).toHaveBeenCalled();
    });

    it("should reuse existing conversation via recipientId", async () => {
      // Shared Context Mock
      prisma.userMembership.findMany.mockResolvedValue([{ companyId: 1 }]);

      // Match found
      const existing = {
        id: 70,
        participants: [{ id: 1 }, { id: 2 }],
      };
      prisma.conversation.findMany.mockResolvedValue([existing]);

      prisma.message.create.mockResolvedValue({
        id: 102,
        content: "Again",
        createdAt: new Date(),
      });
      prisma.conversation.findUnique.mockResolvedValue(existing);

      await service.sendMessage(1, { recipientId: 2, content: "Again" });

      expect(prisma.conversation.create).not.toHaveBeenCalled();
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ conversationId: 70 }),
        })
      );
    });

    it("should throw ForbiddenError if no shared context", async () => {
      prisma.userMembership.findMany
        .mockResolvedValueOnce([{ companyId: 1 }]) // Sender
        .mockResolvedValueOnce([{ companyId: 2 }]); // Recipient (Different)

      await expect(
        service.sendMessage(1, { recipientId: 2, content: "Fail" })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("createConversation", () => {
    it("should throw ValidationError if recipient missing", async () => {
      await expect(service.createConversation(1, null)).rejects.toThrow(
        ValidationError
      );
    });

    it("should return existing conversation", async () => {
      prisma.userMembership.findMany.mockResolvedValue([{ companyId: 1 }]);
      const existing = { id: 10, participants: [{ id: 1 }, { id: 2 }] };
      prisma.conversation.findMany.mockResolvedValue([existing]);

      const result = await service.createConversation(1, 2);
      expect(result.id).toBe(10);
    });

    it("should create new if not exists", async () => {
      prisma.userMembership.findMany.mockResolvedValue([{ companyId: 1 }]);
      prisma.conversation.findMany.mockResolvedValue([]);
      const newConv = { id: 11, participants: [{ id: 1 }, { id: 2 }] };
      prisma.conversation.create.mockResolvedValue(newConv);

      const result = await service.createConversation(1, 2);
      expect(result.id).toBe(11);
      const io = getIO();
      expect(io.to).toHaveBeenCalledWith("2");
    });
  });

  describe("markMessagesAsRead", () => {
    it("should update and emit if records changed", async () => {
      prisma.message.updateMany.mockResolvedValue({ count: 5 });
      prisma.conversation.findUnique.mockResolvedValue({
        participants: [{ id: 1 }, { id: 2 }],
      });

      await service.markMessagesAsRead(10, 1);
      const io = getIO();
      expect(io.emit).toHaveBeenCalledWith(
        "message_status_update",
        expect.objectContaining({ status: "read" })
      );
    });

    it("should not emit if no records changed", async () => {
      prisma.message.updateMany.mockResolvedValue({ count: 0 });
      await service.markMessagesAsRead(10, 1);
      const io = getIO();
      expect(io.emit).not.toHaveBeenCalled();
    });
  });

  describe("markAsDelivered", () => {
    it("should update and emit if records changed", async () => {
      prisma.message.updateMany.mockResolvedValue({ count: 3 });
      prisma.conversation.findUnique.mockResolvedValue({
        participants: [{ id: 1 }, { id: 2 }],
      });

      await service.markAsDelivered(10, 1);
      const io = getIO();
      expect(io.emit).toHaveBeenCalledWith(
        "message_status_update",
        expect.objectContaining({ status: "delivered" })
      );
    });
  });

  describe("getUnreadCount", () => {
    it("should return count", async () => {
      prisma.message.count.mockResolvedValue(7);
      const count = await service.getUnreadCount(1);
      expect(count).toBe(7);
    });
  });

  describe("deleteMessage", () => {
    it("should delete and emit", async () => {
      prisma.message.findUnique.mockResolvedValue({
        id: 100,
        senderId: 1,
        conversationId: 10,
      });
      prisma.conversation.findUnique.mockResolvedValue({
        participants: [{ id: 1 }, { id: 2 }],
      });

      await service.deleteMessage(100, 1);

      expect(prisma.message.delete).toHaveBeenCalledWith({
        where: { id: 100 },
      });
      const io = getIO();
      expect(io.emit).toHaveBeenCalledWith("message_deleted", {
        messageId: 100,
        conversationId: 10,
      });
    });

    it("should throw NotFound if message missing", async () => {
      prisma.message.findUnique.mockResolvedValue(null);
      await expect(service.deleteMessage(999, 1)).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw Forbidden if not sender", async () => {
      prisma.message.findUnique.mockResolvedValue({ id: 100, senderId: 99 });
      await expect(service.deleteMessage(100, 1)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe("deleteConversation", () => {
    it("should delete and emit", async () => {
      const mockConv = { id: 10, participants: [{ id: 1 }, { id: 2 }] };
      prisma.conversation.findFirst.mockResolvedValue(mockConv);

      await service.deleteConversation(10, 1);

      expect(prisma.conversation.delete).toHaveBeenCalledWith({
        where: { id: 10 },
      });
      const io = getIO();
      expect(io.to).toHaveBeenCalledWith("2"); // Notify other
      expect(io.emit).toHaveBeenCalledWith("conversation_deleted", { id: 10 });
    });

    it("should throw NotFound if conversation missing", async () => {
      prisma.conversation.findFirst.mockResolvedValue(null);
      await expect(service.deleteConversation(999, 1)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
