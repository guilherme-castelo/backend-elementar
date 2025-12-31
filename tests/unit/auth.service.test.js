const authService = require("../../src/services/auth.service");
const usersService = require("../../src/services/users.service");
const bcrypt = require("bcryptjs");
const { UnauthorizedError } = require("../../src/errors/AppError");

jest.mock("../../src/services/users.service");
jest.mock("bcryptjs");
jest.mock("../../src/utils/prisma", () => ({
  userMembership: { findMany: jest.fn() },
  role: { findUnique: jest.fn() },
}));
const prisma = require("../../src/utils/prisma");

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.compare.mockResolvedValue(true);
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 1,
        password: "hash",
        isActive: true,
        role: { name: "Admin" },
      });
      prisma.userMembership.findMany.mockResolvedValue([]);

      const res = await authService.login("email", "pass");

      expect(res).toHaveProperty("token");
      expect(res.user.role).toEqual({ id: undefined, name: "Admin" }); // Mock role had no id
    });

    it("should throw error if user not active", async () => {
      usersService.findByEmail.mockResolvedValue({ isActive: false });
      await expect(authService.login("e", "p")).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw error if password invalid", async () => {
      usersService.findByEmail.mockResolvedValue({
        isActive: true,
        password: "h",
      });
      bcrypt.compare.mockResolvedValue(false);
      await expect(authService.login("e", "p")).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("should throw error if user not found", async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(authService.login("e", "p")).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("register", () => {
    it("should register", async () => {
      usersService.create.mockResolvedValue({ id: 1, role: {} });
      prisma.userMembership.findMany.mockResolvedValue([]);
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: "Admin" });

      const res = await authService.register({ email: "test" });
      expect(res).toHaveProperty("token");
    });
  });

  describe("me", () => {
    it("should return user data", async () => {
      usersService.getById.mockResolvedValue({
        id: 1,
        role: { permissions: [{ slug: "p1" }] },
      });

      const res = await authService.me(1);

      expect(res.permissions).toEqual(["p1"]);
    });

    it("should handle empty permissions", async () => {
      usersService.getById.mockResolvedValue({ id: 1 });
      const res = await authService.me(1);
      expect(res.permissions).toEqual([]);
    });
  });
});
