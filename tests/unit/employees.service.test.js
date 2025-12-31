const employeesService = require("../../src/services/employees.service");
const employeesRepository = require("../../src/repositories/employees.repository");
const mealsService = require("../../src/services/meals.service");
const prisma = require("../../src/utils/prisma");
const { ConflictError, NotFoundError } = require("../../src/errors/AppError");

jest.mock("../../src/repositories/employees.repository");
jest.mock("../../src/services/meals.service");

// Mocking Prisma Transaction
const mockTx = {
  meal: {
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  }
};

jest.mock("../../src/utils/prisma", () => ({
  $transaction: jest.fn(async (callback) => callback(mockTx)),
}));

describe("EmployeesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mockTx spies manually if needed or rely on jest.clearAllMocks()
    // But since mockTx is external constant, clear methods:
    mockTx.meal.deleteMany.mockClear();
    mockTx.meal.updateMany.mockClear();
  });

  describe("getAll", () => {
    it("should return employees from repository", async () => {
      employeesRepository.getAll.mockResolvedValue([]);
      await employeesService.getAll({ companyId: 1 });
      expect(employeesRepository.getAll).toHaveBeenCalledWith({ companyId: 1 });
    });
  });

  describe("getById", () => {
    it("should return employee if found", async () => {
      employeesRepository.getById.mockResolvedValue({ id: 1 });
      const res = await employeesService.getById(1);
      expect(res).toEqual({ id: 1 });
    });

    it("should throw NotFoundError if not found", async () => {
      employeesRepository.getById.mockResolvedValue(null);
      await expect(employeesService.getById(99)).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    const data = {
      firstName: "John",
      lastName: "Doe",
      matricula: "123",
      cpf: "000",
      admissionDate: "2023-01-01",
      companyId: 1
    };

    it("should create employee successfully", async () => {
      employeesRepository.findDuplicate.mockResolvedValue(null);
      employeesRepository.create.mockResolvedValue({ id: 1, ...data });
      mealsService.linkEmployeeMeals.mockResolvedValue();

      const res = await employeesService.create(data);

      expect(employeesRepository.create).toHaveBeenCalled();
      expect(mealsService.linkEmployeeMeals).toHaveBeenCalled();
      expect(res.id).toBe(1);
    });

    it("should throw ConflictError if matricula exists", async () => {
      // Mock findDuplicate returning conflicting matricula
      employeesRepository.findDuplicate.mockResolvedValue({ matricula: "123" });
      await expect(employeesService.create(data)).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError if cpf exists", async () => {
      // Mock findDuplicate returning conflicting cpf
      employeesRepository.findDuplicate.mockResolvedValue({ cpf: "000" });
      await expect(employeesService.create(data)).rejects.toThrow(ConflictError);
    });
  });

  describe("update", () => {
    const updateData = { firstName: "Jane" };

    it("should update employee", async () => {
      employeesRepository.update.mockResolvedValue({ id: 1, ...updateData });
      mealsService.linkEmployeeMeals.mockResolvedValue();

      await employeesService.update(1, updateData);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(employeesRepository.update).toHaveBeenCalledWith(1, expect.anything(), mockTx);
    });

    it("should handle mealsAction UNLINK_IGNORE", async () => {
      employeesRepository.update.mockResolvedValue({ id: 1, dataDemissao: new Date() });
      const data = { mealsAction: "UNLINK_IGNORE", dataDemissao: "2023-01-01" };

      await employeesService.update(1, data);

      expect(mockTx.meal.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ ignoredInExport: true })
      }));
    });
  });

  describe("delete", () => {
    it("should delete employee using transaction", async () => {
      employeesRepository.delete.mockResolvedValue({ id: 1 });

      await employeesService.delete(1);

      expect(employeesRepository.delete).toHaveBeenCalledWith(1, mockTx);
    });

    it("should handle DELETE meals action", async () => {
      employeesRepository.delete.mockResolvedValue({ id: 1 });
      await employeesService.delete(1, "DELETE");
      expect(mockTx.meal.deleteMany).toHaveBeenCalled();
    });
  });
});
