const { mockReset } = require("jest-mock-extended");
jest.mock("../../src/utils/prisma");

const prisma = require("../../src/utils/prisma");
const rolesService = require("../../src/services/roles.service");

describe("RolesService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("getAll", () => {
    it("should return all roles", async () => {
      prisma.role.findMany.mockResolvedValue([]);
      await rolesService.getAll();
      expect(prisma.role.findMany).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return role by id", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1 });
      await rolesService.getById(1);
      expect(prisma.role.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 1 } }));
    });
  });

  describe("create", () => {
    it("should create role with permissions", async () => {
      const data = { name: "Role", permissionIds: [1, 2] };
      prisma.role.create.mockResolvedValue({ id: 1, name: "Role" });

      await rolesService.create(data);

      expect(prisma.role.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          permissions: { connect: [{ id: 1 }, { id: 2 }] }
        })
      }));
    });

    it("should create role without permissions", async () => {
      prisma.role.create.mockResolvedValue({ id: 1 });
      await rolesService.create({ name: "R" });
      expect(prisma.role.create).toHaveBeenCalledWith(expect.objectContaining({
        data: { name: "R" }
      }));
    });
  });

  describe("update", () => {
    it("should update role and set permissions", async () => {
      const data = { name: "New Name", permissionIds: [3] };
      prisma.role.update.mockResolvedValue({ id: 1 });

      await rolesService.update(1, data);

      expect(prisma.role.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          permissions: { set: [{ id: 3 }] }
        })
      }));
    });

    it("should update role without permissions", async () => {
      prisma.role.update.mockResolvedValue({ id: 1 });
      await rolesService.update(1, { name: "N" });
      expect(prisma.role.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1 },
        data: expect.not.objectContaining({ permissions: expect.anything() })
      }));
    });
  });

  describe("delete", () => {
    it("should delete role", async () => {
      prisma.role.delete.mockResolvedValue({ id: 1 });
      await rolesService.delete(1);
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
