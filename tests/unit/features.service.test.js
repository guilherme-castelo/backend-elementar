const featuresService = require("../../src/services/features.service");
const prisma = require("../../src/utils/prisma");
const { mockReset } = require("jest-mock-extended");

jest.mock("../../src/utils/prisma");

describe("FeaturesService", () => {
  beforeEach(() => {
    mockReset(prisma);
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return all features", async () => {
      prisma.feature.findMany.mockResolvedValue([{ id: 1 }]);
      await featuresService.getAll();
      expect(prisma.feature.findMany).toHaveBeenCalledWith({ include: { permissions: true } });
    });
  });

  describe("getById", () => {
    it("should return feature by id", async () => {
      prisma.feature.findUnique.mockResolvedValue({ id: 1 });
      const res = await featuresService.getById(1);
      expect(prisma.feature.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { permissions: true }
      });
      expect(res).toEqual({ id: 1 });
    });
  });

  describe("create", () => {
    it("should create feature", async () => {
      const data = { name: "F", slug: "f" };
      prisma.feature.create.mockResolvedValue({ id: 1, ...data });
      await featuresService.create(data);
      expect(prisma.feature.create).toHaveBeenCalledWith({ data });
    });
  });

  describe("update", () => {
    it("should update feature", async () => {
      const data = { name: "Updated" };
      prisma.feature.update.mockResolvedValue({ id: 1, ...data });
      await featuresService.update(1, data);
      expect(prisma.feature.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data
      });
    });
  });

  describe("delete", () => {
    it("should delete feature", async () => {
      prisma.feature.delete.mockResolvedValue({ id: 1 });
      await featuresService.delete(1);
      expect(prisma.feature.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
