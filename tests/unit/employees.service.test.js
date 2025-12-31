const employeesService = require("../../src/services/employees.service");
const employeesRepository = require("../../src/repositories/employees.repository");
const mealsService = require("../../src/services/meals.service");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
} = require("../../src/errors/AppError");

jest.mock("../../src/repositories/employees.repository");
jest.mock("../../src/services/meals.service");
jest.mock("../../src/utils/prisma", () => ({
  $transaction: jest.fn((callback) =>
    callback({
      meal: { deleteMany: jest.fn(), updateMany: jest.fn() },
    })
  ),
}));
const prisma = require("../../src/utils/prisma");

describe("EmployeesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      await expect(employeesService.getById(1)).rejects.toThrow(NotFoundError);
    });
  });

  describe("create", () => {
    it("should create employee successfully", async () => {
      employeesRepository.findDuplicate.mockResolvedValue(null);
      employeesRepository.create.mockResolvedValue({ id: 1 });

      await employeesService.create({ matricula: "123", companyId: 1 });

      expect(employeesRepository.create).toHaveBeenCalled();
      expect(mealsService.linkEmployeeMeals).toHaveBeenCalled();
    });

    it("should validade companyId", async () => {
      employeesRepository.findDuplicate.mockResolvedValue(null);
      await expect(
        employeesService.create({ matricula: "123" })
      ).rejects.toThrow(ValidationError);
    });

    it("should throw ConflictError if matricula exists", async () => {
      employeesRepository.findDuplicate.mockResolvedValue({ matricula: "123" });
      await expect(
        employeesService.create({ matricula: "123", companyId: 1 })
      ).rejects.toThrow(ConflictError);
    });

    it("should throw ConflictError if cpf exists", async () => {
      employeesRepository.findDuplicate.mockResolvedValue({ cpf: "111" });
      await expect(
        employeesService.create({ matricula: "123", cpf: "111", companyId: 1 })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("update", () => {
    it("should update employee", async () => {
      employeesRepository.update.mockResolvedValue({ id: 1 });
      await employeesService.update(1, {
        firstName: "Test",
        companyId: 1,
        dataAdmissao: "2023-01-01",
      });
      expect(employeesRepository.update).toHaveBeenCalled();
    });

    it("should handle mealsAction DELETE", async () => {
      const tx = { meal: { deleteMany: jest.fn(), updateMany: jest.fn() } };
      prisma.$transaction.mockImplementation((cb) => cb(tx));
      employeesRepository.update.mockResolvedValue({ id: 1 });

      await employeesService.update(1, {
        mealsAction: "DELETE",
        dataDemissao: "2023-01-01",
      });

      expect(tx.meal.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: 1 } })
      );
    });

    it("should handle mealsAction UNLINK", async () => {
      const tx = { meal: { deleteMany: jest.fn(), updateMany: jest.fn() } };
      prisma.$transaction.mockImplementation((cb) => cb(tx));
      employeesRepository.update.mockResolvedValue({ id: 1 });

      await employeesService.update(1, {
        mealsAction: "UNLINK",
        dataDemissao: "2023-01-01",
      });

      expect(tx.meal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: 1 },
          data: expect.objectContaining({ status: "PENDING_LINK" }),
        })
      );
    });

    it("should handle mealsAction UNLINK_IGNORE", async () => {
      const tx = { meal: { deleteMany: jest.fn(), updateMany: jest.fn() } };
      prisma.$transaction.mockImplementation((cb) => cb(tx));
      employeesRepository.update.mockResolvedValue({ id: 1 });

      await employeesService.update(1, {
        mealsAction: "UNLINK_IGNORE",
        dataDemissao: "2023-01-01",
      });

      expect(tx.meal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: 1 },
          data: expect.objectContaining({ ignoredInExport: true }),
        })
      );
    });
  });

  describe("delete", () => {
    it("should delete employee using transaction", async () => {
      employeesRepository.delete.mockResolvedValue({ id: 1 });
      await employeesService.delete(1);
      expect(employeesRepository.delete).toHaveBeenCalled();
    });

    it("should handle DELETE meals action", async () => {
      const tx = { meal: { deleteMany: jest.fn(), updateMany: jest.fn() } };
      prisma.$transaction.mockImplementation((cb) => cb(tx));

      await employeesService.delete(1, "DELETE");
      expect(tx.meal.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: 1 } })
      );
    });

    it("should handle UNLINK meals action", async () => {
      const tx = { meal: { deleteMany: jest.fn(), updateMany: jest.fn() } };
      prisma.$transaction.mockImplementation((cb) => cb(tx));

      await employeesService.delete(1, "UNLINK");
      expect(tx.meal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: 1 },
          data: expect.not.objectContaining({ ignoredInExport: true }),
        })
      );
    });

    it("should handle UNLINK_IGNORE meals action", async () => {
      const tx = { meal: { deleteMany: jest.fn(), updateMany: jest.fn() } };
      prisma.$transaction.mockImplementation((cb) => cb(tx));

      await employeesService.delete(1, "UNLINK_IGNORE");
      expect(tx.meal.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: 1 },
          data: expect.objectContaining({ ignoredInExport: true }),
        })
      );
    });
  });
});
