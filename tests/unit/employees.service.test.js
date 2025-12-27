const { mockReset } = require("jest-mock-extended");
jest.mock("../../utils/prisma"); // Manual mock

const prisma = require("../../utils/prisma");
const employeesService = require("../../services/employees.service");

describe("EmployeesService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("getAll", () => {
    it("should return employees", async () => {
      prisma.employee.findMany.mockResolvedValue([]);
      await employeesService.getAll(1);
      expect(prisma.employee.findMany).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create employee", async () => {
      const data = {
        name: "E",
        matricula: "123",
        cpf: "000",
        admissionDate: "2023-01-01",
      };
      prisma.employee.findFirst.mockResolvedValue(null);
      prisma.employee.create.mockResolvedValue({ id: 1, ...data });

      await employeesService.create(data);
      expect(prisma.employee.create).toHaveBeenCalled();
    });
  });
});
