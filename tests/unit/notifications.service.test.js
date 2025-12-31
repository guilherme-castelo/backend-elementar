const service = require("../../src/services/notifications.service");
const prisma = require("../../src/utils/prisma");
const { mockReset } = require("jest-mock-extended");

jest.mock("../../src/utils/prisma");

describe("NotificationsService", () => {
  beforeEach(() => mockReset(prisma));

  describe("getAll", () => {
    it("should list notifications for user", async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      await service.getAll(1);
      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe("create", () => {
    it("should insert notification", async () => {
      const data = { userId: 1, content: "Hi" };
      prisma.notification.create.mockResolvedValue({ id: 1, ...data });
      await service.create(data);
      expect(prisma.notification.create).toHaveBeenCalledWith({ data });
    });
  });

  describe("markAsRead", () => {
    it("should mark as read", async () => {
      prisma.notification.update.mockResolvedValue({ id: 1, read: true });
      await service.markAsRead(1);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { read: true }
      });
    });
  });

  describe("archive", () => {
    it("should archive notification", async () => {
      prisma.notification.update.mockResolvedValue({ id: 1, archived: true });
      await service.archive(1);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { archived: true }
      });
    });
  });
});
