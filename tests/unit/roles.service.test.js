const rolesService = require("../../src/services/roles.service");
const { mockReset } = require("jest-mock-extended");

jest.mock("../../src/utils/prisma", () => ({
  role: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));
const prisma = require("../../src/utils/prisma");

describe("RolesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      const res = await rolesService.getById(1);
      expect(res).toEqual({ id: 1 });
    });
  });

  describe("create", () => {
    it("should create with permissions slugs", async () => {
      const data = { name: "Role", permissions: ["p1"] };
      prisma.role.create.mockResolvedValue(data);
      await rolesService.create(data);

      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permissions: { connect: [{ slug: "p1" }] },
          }),
        })
      );
    });

    it("should create with permissionIds", async () => {
      const data = { name: "Role", permissionIds: [1] };
      prisma.role.create.mockResolvedValue(data);
      await rolesService.create(data);

      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permissions: { connect: [{ id: 1 }] },
          }),
        })
      );
    });

    it("should create with companyIds", async () => {
      const data = { name: "Role", companyIds: [10] };
      prisma.role.create.mockResolvedValue(data);
      await rolesService.create(data);
      expect(prisma.role.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companies: { connect: [{ id: 10 }] },
          }),
        })
      );
    });
  });

  describe("update", () => {
    it("should update permissions via set (slugs)", async () => {
      const data = { permissions: ["p2"] };
      prisma.role.update.mockResolvedValue({});
      await rolesService.update(1, data);
      expect(prisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permissions: { set: [{ slug: "p2" }] },
          }),
        })
      );
    });

    it("should update permissions via set (ids)", async () => {
      const data = { permissionIds: [2] };
      prisma.role.update.mockResolvedValue({});
      await rolesService.update(1, data);
      expect(prisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            permissions: { set: [{ id: 2 }] },
          }),
        })
      );
    });

    it("should update companies", async () => {
      const data = { companyIds: [20] };
      prisma.role.update.mockResolvedValue({});
      await rolesService.update(1, data);
      expect(prisma.role.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companies: { set: [{ id: 20 }] },
          }),
        })
      );
    });
  });

  describe("delete", () => {
    it("should delete role", async () => {
      prisma.role.delete.mockResolvedValue({});
      await rolesService.delete(1);
      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe("validateScope", () => {
    it("should return false if role not found", async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      const res = await rolesService.validateScope(1, 1);
      expect(res).toBe(false);
    });

    it("should return true if global role (no companies)", async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, companies: [] });
      const res = await rolesService.validateScope(1, 99);
      expect(res).toBe(true);
    });

    it("should return true if company linked", async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 1,
        companies: [{ id: 10 }],
      });
      const res = await rolesService.validateScope(1, 10);
      expect(res).toBe(true);
    });

    it("should return false if restricted and not linked", async () => {
      prisma.role.findUnique.mockResolvedValue({
        id: 1,
        companies: [{ id: 10 }],
      });
      const res = await rolesService.validateScope(1, 99);
      expect(res).toBe(false);
    });
  });
});
