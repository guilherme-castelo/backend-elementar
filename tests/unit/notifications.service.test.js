const service = require("../../services/notifications.service");
const prisma = require("../../utils/prisma");
const { mockReset } = require("jest-mock-extended");

jest.mock("../../utils/prisma");

describe("NotificationsService", () => {
  beforeEach(() => mockReset(prisma));

  it("getAll should list", async () => {
    prisma.notification.findMany.mockResolvedValue([]);
    await service.getAll(1);
    expect(prisma.notification.findMany).toHaveBeenCalled();
  });

  it("create should insert", async () => {
    prisma.notification.create.mockResolvedValue({ id: 1 });
    await service.create({ userId: 1, content: "Hi" });
    expect(prisma.notification.create).toHaveBeenCalled();
  });
});
