const permissionsService = require("../../src/services/permissions.service");
const prisma = require("../../src/utils/prisma");

// Mock entire prisma wrapper correctly
jest.mock("../../src/utils/prisma", () => ({
  permission: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("PermissionsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all permissions", async () => {
      prisma.permission.findMany.mockResolvedValue([]);
      const result = await permissionsService.getAll();
      expect(result).toEqual([]);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({ include: { feature: true } });
    });
  });

  describe("getById", () => {
    it("should return permission by id", async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: 1 });
      const res = await permissionsService.getById(1);
      expect(res).toEqual({ id: 1 });
      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { feature: true }
      });
    });
  });

  describe("create", () => {
    it("should create permission and parse featureId", async () => {
      prisma.permission.create.mockResolvedValue({ id: 1, slug: 'test' });

      const data = { slug: 'test', featureId: "10" };
      await permissionsService.create(data);

      expect(prisma.permission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'test',
          featureId: 10 // Int check
        })
      });
    });

    it("should create without featureId", async () => {
      prisma.permission.create.mockResolvedValue({ id: 1 });
      await permissionsService.create({ name: "P" });
      expect(prisma.permission.create).toHaveBeenCalledWith({ data: { name: "P" } });
    });
  });

  describe("update", () => {
    it("should update permission", async () => {
      prisma.permission.update.mockResolvedValue({ id: 1 });

      await permissionsService.update(1, { featureId: "5", name: "New" });

      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ featureId: 5, name: "New" })
      });
    });

    it("should update permission without featureId", async () => {
      prisma.permission.update.mockResolvedValue({ id: 1 });
      await permissionsService.update(1, { name: "NoFeature" });
      expect(prisma.permission.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.not.objectContaining({ featureId: expect.anything() })
      });
    });
  });

  describe("delete", () => {
    it("should delete permission", async () => {
      prisma.permission.delete.mockResolvedValue({ id: 1 });
      await permissionsService.delete(1);
      expect(prisma.permission.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
