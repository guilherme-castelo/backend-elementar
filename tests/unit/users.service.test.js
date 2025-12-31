const usersService = require("../../src/services/users.service");
const usersRepository = require("../../src/repositories/users.repository");
const bcrypt = require("bcryptjs");
const { NotFoundError, ConflictError } = require("../../src/errors/AppError");

jest.mock("../../src/repositories/users.repository");
jest.mock("bcryptjs");

describe("UsersService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return users formatted", async () => {
      const users = [{ id: 1, name: "U1", password: "hash" }];
      usersRepository.getAll.mockResolvedValue(users);

      const result = await usersService.getAll();

      expect(usersRepository.getAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty("password");
      expect(result[0].name).toBe("U1");
    });
  });

  describe("getById", () => {
    it("should return user if found", async () => {
      const user = { id: 1, name: "U1", password: "hash" };
      usersRepository.getById.mockResolvedValue(user);

      const result = await usersService.getById(1);

      expect(result).not.toHaveProperty("password");
      expect(result.id).toBe(1);
    });

    it("should throw NotFoundError if request fails", async () => {
      usersRepository.getById.mockResolvedValue(null);
      await expect(usersService.getById(99)).rejects.toThrow(NotFoundError);
    });
  });

  describe("findByEmail", () => {
    it("should return user", async () => {
      const user = { id: 1, email: "u@t.com" };
      usersRepository.findByEmail.mockResolvedValue(user);
      const res = await usersService.findByEmail("u@t.com");
      expect(res).toEqual(user);
    });

    it("should return null if not found", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const res = await usersService.findByEmail("inv@t.com");
      expect(res).toBeNull();
    });
  });

  describe("create", () => {
    const data = {
      name: "John",
      email: "j@d.com",
      password: "123",
      roles: ["ADMIN"],
      address: { city: "New York" }
    };

    it("should create user successfully with hashing and defaults", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue("hashed_123");
      usersRepository.create.mockResolvedValue({
        id: 1,
        ...data,
        password: "hashed_123",
        roles: "ADMIN",
        address: '{"city":"New York"}'
      });

      const result = await usersService.create(data);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(data.email);
      expect(bcrypt.hash).toHaveBeenCalledWith("123", 10);
      expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        password: "hashed_123",
        roles: "ADMIN",
        address: JSON.stringify(data.address),
        preferences: expect.stringContaining("Portuguese (Brazil)") // Checks default prefs
      }));
      expect(result).not.toHaveProperty("password");
    });

    it("should throw ConflictError if email exists", async () => {
      usersRepository.findByEmail.mockResolvedValue({ id: 2 });
      await expect(usersService.create(data)).rejects.toThrow(ConflictError);
    });

    it("should handle already serialized preferences", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      const input = { ...data, preferences: { theme: 'dark' } };
      usersRepository.create.mockResolvedValue({ id: 1, ...input, preferences: '{"theme":"dark"}' });

      await usersService.create(input);

      expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        preferences: '{"theme":"dark"}'
      }));
    });
  });

  describe("update", () => {
    const updateData = { name: "Jane", password: "456", preferences: { lang: "en" } };

    it("should update user with full data", async () => {
      // Mock existence check (getById calls repo)
      usersRepository.getById.mockResolvedValue({ id: 1 });
      bcrypt.hash.mockResolvedValue("hashed_456");
      usersRepository.update.mockResolvedValue({ id: 1, ...updateData, password: "hashed_456" });

      const result = await usersService.update(1, updateData);

      expect(usersRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        password: "hashed_456",
        preferences: '{"lang":"en"}'
      }));
      expect(result).not.toHaveProperty("password");
    });

    it("should update user without password or complex fields", async () => {
      usersRepository.getById.mockResolvedValue({ id: 1 });
      usersRepository.update.mockResolvedValue({ id: 1, name: "Simple" });

      await usersService.update(1, { name: "Simple" });

      expect(usersRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Simple" }));
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("should handle array roles and object address in update", async () => {
      usersRepository.getById.mockResolvedValue({ id: 1 });
      usersRepository.update.mockResolvedValue({ id: 1 });

      const data = {
        roles: ["USER", "ADMIN"],
        address: { street: "Main" },
        companyId: "5"
      };

      await usersService.update(1, data);

      expect(usersRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        roles: "USER,ADMIN",
        address: '{"street":"Main"}',
        companyId: 5
      }));
    });

    it("should throw NotFound if user doesn't exist", async () => {
      usersRepository.getById.mockResolvedValue(null);
      await expect(usersService.update(99, updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe("delete", () => {
    it("should delete user", async () => {
      usersRepository.getById.mockResolvedValue({ id: 1 });
      usersRepository.delete.mockResolvedValue({ id: 1 });

      await usersService.delete(1);

      expect(usersRepository.delete).toHaveBeenCalledWith(1);
    });

    it("should throw NotFound if user doesn't exist", async () => {
      usersRepository.getById.mockResolvedValue(null);
      await expect(usersService.delete(99)).rejects.toThrow(NotFoundError);
    });
  });
});
