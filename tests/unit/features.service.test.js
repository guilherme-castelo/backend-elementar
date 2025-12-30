const { mockReset } = require("jest-mock-extended");
jest.mock("../../src/utils/prisma"); // Manual mock

const prisma = require("../../src/utils/prisma");
const featuresService = require("../../src/services/features.service");

describe("FeaturesService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("getAll", () => {
    it("should return all features", async () => {
      prisma.feature.findMany.mockResolvedValue([{ id: 1 }]);
      await featuresService.getAll();
      expect(prisma.feature.findMany).toHaveBeenCalled();
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
});
