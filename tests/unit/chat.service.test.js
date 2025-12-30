const { mockReset } = require("jest-mock-extended");

// Inline mock to be absolutely sure
jest.mock("../../utils/socket", () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  }),
}));

jest.mock("../../utils/prisma");

const prisma = require("../../utils/prisma");
const service = require("../../services/chat.service");
const { getIO } = require("../../utils/socket");

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

  describe("sendMessage", () => {
    it("should create message and emit socket event", async () => {
      const mockMsg = {
        id: 1,
        content: "Hi",
        conversationId: 55,
        senderId: 1,
        createdAt: new Date(),
        sender: { id: 1, name: "Me" }
      };

      const mockConversation = {
        id: 55,
        participants: [{ id: 1 }, { id: 2 }]
      };

      // Mock sequence for sendMessage
      prisma.message.create.mockResolvedValue(mockMsg);
      prisma.conversation.update.mockResolvedValue({});
      prisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const data = { conversationId: 55, recipientId: 2, content: "Hi" };
      await service.sendMessage(1, data);

      expect(prisma.message.create).toHaveBeenCalled();

      // Verify Socket Emission
      const io = getIO();
      // Expect emission to recipient (id: 2)
      expect(io.to).toHaveBeenCalledWith("2");
      expect(io.emit).toHaveBeenCalledWith("new_message", mockMsg);
    });
  });
});
