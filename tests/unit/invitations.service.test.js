const { mockReset } = require("jest-mock-extended");
const prisma = require("../../src/utils/prisma");
const service = require("../../src/services/invitations.service");
const bcrypt = require("bcryptjs");
const rolesService = require("../../src/services/roles.service");

// Mock Deps
jest.mock("../../src/utils/prisma");
jest.mock("bcryptjs", () => ({ hash: jest.fn() }));
jest.mock("../../src/services/roles.service");

describe("InvitationsService", () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create invitation", async () => {
      const data = { email: "new@test.com", roleId: 2 };
      prisma.user.findUnique.mockResolvedValue(null); // User distinct check

      // Mock Scope Validation
      rolesService.validateScope.mockResolvedValue(true);

      prisma.invitation.create.mockResolvedValue({
        id: "uuid",
        token: "abc",
        email: "new@test.com",
      });

      const result = await service.create(1, data);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "new@test.com" },
      });
      expect(rolesService.validateScope).toHaveBeenCalledWith(2, 1);
      expect(prisma.invitation.create).toHaveBeenCalled();
      expect(result).toHaveProperty("token");
    });

    it("should fail if user exists", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });
      await expect(
        service.create(1, { email: "exists@test.com" })
      ).rejects.toThrow("User with this email already exists");
    });

    it("should fail if scope invalid", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      rolesService.validateScope.mockResolvedValue(false);

      await expect(
        service.create(1, { email: "test@test.com", roleId: 2 })
      ).rejects.toThrow("Role is not valid");
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
    it("should create user, membership and delete invite", async () => {
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
      // We pass the main prisma mock OR a specialized mock object as `tx`
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });

      prisma.user.create.mockResolvedValue({ id: 10, email: "a@a.com" });
      prisma.userMembership.create.mockResolvedValue({});
      prisma.invitation.delete.mockResolvedValue({});

      await service.accept("token", { name: "New User", password: "123" });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.userMembership.create).toHaveBeenCalledWith({
        data: {
          userId: 10,
          companyId: 1,
          roleId: 2,
          isActive: true,
        },
      });
      expect(prisma.invitation.delete).toHaveBeenCalledWith({
        where: { id: "inv1" },
      });
    });
  });
});
