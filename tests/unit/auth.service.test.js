const { mockReset } = require("jest-mock-extended");
// Use manual mock
jest.mock("../../src/utils/prisma");

// Explicit mocks for deps
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const prisma = require("../../src/utils/prisma");
const authService = require("../../src/services/auth.service");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

describe("AuthService", () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashedpassword",
        isActive: true,
        companyId: 1,
        name: "Test User",
        role: { name: "User", permissions: [{ slug: "test:read" }] },
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock-token");

      const result = await authService.login("test@example.com", "password");

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
        include: { role: { include: { permissions: true } } },
      });
      expect(result).toHaveProperty("token", "mock-token");
      expect(result.permissions).toContain("test:read");
    });

    it("should throw error if user not active", async () => {
      const mockUser = { id: 1, isActive: false };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.login("test@example.com", "password")
      ).rejects.toThrow("User is inactive");
    });

    it("should throw error if password invalid", async () => {
      const mockUser = { id: 1, isActive: true, password: "hashed" };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login("test@example.com", "wrong")
      ).rejects.toThrow("Invalid credentials");
    });
  });
});
