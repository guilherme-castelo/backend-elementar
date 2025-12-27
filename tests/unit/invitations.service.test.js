const { mockReset } = require("jest-mock-extended");
jest.mock("../../utils/prisma");
const prisma = require("../../utils/prisma");
const service = require("../../services/invitations.service");
const bcrypt = require("bcryptjs");

// Mock bcrypt locally
jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

describe("InvitationsService", () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create invitation", async () => {
      const data = { email: "new@test.com", roleId: 2 };
      prisma.user.findUnique.mockResolvedValue(null); // User distinct check
      prisma.invitation.create.mockResolvedValue({
        id: "uuid",
        token: "abc",
        email: "new@test.com",
      });

      const result = await service.create(1, data);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "new@test.com" },
      });
      expect(prisma.invitation.create).toHaveBeenCalled();
      expect(result).toHaveProperty("token");
    });

    it("should fail if user exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      await expect(
        service.create(1, { email: "exists@test.com" })
      ).rejects.toThrow("User with this email already exists");
    });
  });

  describe("validateToken", () => {
    it("should return invite if valid", async () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);
      prisma.invitation.findUnique.mockResolvedValue({
        expiresAt: future,
      });

      const res = await service.validateToken("valid-token");
      expect(res).toBeDefined();
    });

    it("should fail if expired", async () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      prisma.invitation.findUnique.mockResolvedValue({
        expiresAt: past,
      });

      await expect(service.validateToken("expired")).rejects.toThrow(
        "Token expired"
      );
    });
  });

  describe("accept", () => {
    it("should create user and delete invite", async () => {
      const mockInvite = {
        id: "inv1",
        email: "a@a.com",
        companyId: 1,
        roleId: 2,
        expiresAt: new Date(Date.now() + 10000),
      };

      // Setup Prisma Transaction Mock
      prisma.invitation.findUnique.mockResolvedValue(mockInvite);
      bcrypt.hash.mockResolvedValue("hashed");

      // Mock $transaction execution
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma); // Pass main mock as tx mock
      });

      prisma.user.create.mockResolvedValue({ id: 10, email: "a@a.com" });

      await service.accept("token", { name: "New User", password: "123" });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.invitation.delete).toHaveBeenCalledWith({
        where: { id: "inv1" },
      });
    });
  });
});
