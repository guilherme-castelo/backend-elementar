const usersService = require("../../src/services/users.service");
const usersRepository = require("../../src/repositories/users.repository");
const { NotFoundError, ConflictError } = require("../../src/errors/AppError");
const rolesService = require("../../src/services/roles.service");
const bcrypt = require("bcryptjs");

jest.mock("../../src/repositories/users.repository");
jest.mock("../../src/services/roles.service");
jest.mock("bcryptjs");
jest.mock("../../src/utils/prisma", () => ({
  userMembership: { create: jest.fn() },
}));
const prisma = require("../../src/utils/prisma");

describe("UsersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue("hashed");
  });

  describe("getAll", () => {
    it("should return users formatted", async () => {
      usersRepository.getAll.mockResolvedValue([{ id: 1, password: "hash" }]);
      const res = await usersService.getAll();
      expect(res[0]).not.toHaveProperty("password");
    });
  });

  describe("getById", () => {
    it("should return user if found", async () => {
      usersRepository.getById.mockResolvedValue({ id: 1, password: "hash" });
      const res = await usersService.getById(1);
      expect(res).not.toHaveProperty("password");
    });

    it("should throw NotFoundError if request fails", async () => {
      usersRepository.getById.mockResolvedValue(null);
      await expect(usersService.getById(1)).rejects.toThrow(NotFoundError);
    });
  });

  describe("findByEmail", () => {
    it("should return user", async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: 1 });
      const res = await usersService.findByEmail("test");
      expect(res).toBeDefined();
    });

    it("should return null if not found", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const res = await usersService.findByEmail("test");
      expect(res).toBeNull();
    });
  });

  describe("create", () => {
    it("should create user successfully with hashing and defaults", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({ id: 1, password: "hash" });

      await usersService.create({ email: "test", password: "123" });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: expect.stringContaining("language"),
        })
      );
    });

    it("should handle already serialized preferences", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({ id: 1 });

      await usersService.create({
        email: "test",
        preferences: { theme: "dark" },
        address: { street: "Road" },
      });

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          preferences: '{"theme":"dark"}',
          address: '{"street":"Road"}',
        })
      );
    });

    it("should handle array roles", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({ id: 1 });

      await usersService.create({
        email: "test",
        roles: ["admin"],
      });

      expect(usersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: "admin",
        })
      );
    });

    it("should throw ConflictError if email exists", async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: 1 });
      await expect(usersService.create({ email: "test" })).rejects.toThrow(
        ConflictError
      );
    });

    it("should handle membership creation and validation success", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({ id: 1 });
      rolesService.validateScope.mockResolvedValue(true);

      await usersService.create({ email: "test", companyId: 10, roleId: 5 });

      expect(prisma.userMembership.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ companyId: 10, roleId: 5 }),
        })
      );
    });

    it("should rollback user creation if role scope invalid", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue({ id: 1 });
      rolesService.validateScope.mockResolvedValue(false);

      await expect(
        usersService.create({ email: "test", companyId: 10, roleId: 5 })
      ).rejects.toThrow("valid for this company");

      expect(usersRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe("update", () => {
    it("should update user with full data", async () => {
      usersRepository.getById.mockResolvedValue({ id: 1 });
      usersRepository.update.mockResolvedValue({ id: 1 });

      await usersService.update(1, {
        password: "new",
        preferences: {},
        address: {},
        roles: [],
      });

      expect(bcrypt.hash).toHaveBeenCalled();
      expect(usersRepository.update).toHaveBeenCalled();
    });

    it("should throw NotFound if user doesn't exist", async () => {
      usersRepository.getById.mockResolvedValue(null);
      await expect(usersService.update(1, {})).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      usersRepository.getById.mockResolvedValue({ id: 1 });
      await usersService.delete(1);
      expect(usersRepository.delete).toHaveBeenCalledWith(1);
    });

    it("should throw NotFound if user doesn't exist", async () => {
      usersRepository.getById.mockResolvedValue(null);
      await expect(usersService.delete(1)).rejects.toThrow(NotFoundError);
    });
  });
});
