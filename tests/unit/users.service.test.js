const { mockReset } = require("jest-mock-extended");
jest.mock("../../src/utils/prisma");
jest.mock("bcryptjs"); // Keep local mock for bcrypt

const prisma = require("../../src/utils/prisma");
const usersService = require("../../src/services/users.service");
const bcrypt = require("bcryptjs");

describe("UsersService", () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return users", async () => {
      prisma.user.findMany.mockResolvedValue([]);
      await usersService.getAll();
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create user", async () => {
      bcrypt.hash.mockResolvedValue("hash");
      prisma.user.create.mockResolvedValue({ id: 1, password: "hash" });
      await usersService.create({ name: "User", password: "123" });
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
