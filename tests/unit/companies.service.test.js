const { mockReset } = require("jest-mock-extended");
jest.mock("../../src/utils/prisma");

const prisma = require("../../src/utils/prisma");
const companiesService = require("../../src/services/companies.service");

describe("CompaniesService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("getAll", () => {
    it("should return companies", async () => {
      prisma.company.findMany.mockResolvedValue([]);
      await companiesService.getAll();
      expect(prisma.company.findMany).toHaveBeenCalled();
    });
  });
});
