const { mockReset } = require("jest-mock-extended");
jest.mock("../../utils/prisma");

const prisma = require("../../utils/prisma");
const mealsService = require("../../services/meals.service");

describe("MealsService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("create", () => {
    it("should register meal", async () => {
      const employee = {
        id: 1,
        firstName: "John",
        lastName: "Doe",
        dataDemissao: null,
        company: { name: "Comp" },
        setor: "IT",
        companyId: 1,
      };

      prisma.employee.findUnique.mockResolvedValue(employee);
      prisma.meal.findFirst.mockResolvedValue(null);
      prisma.meal.create.mockResolvedValue({ id: 1 });

      await mealsService.create({
        employeeId: 1,
        date: "2023-01-01",
        companyId: 1,
      });

      expect(prisma.meal.create).toHaveBeenCalled();
    });
  });
});
