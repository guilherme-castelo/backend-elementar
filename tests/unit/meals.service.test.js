const mealsService = require("../../src/services/meals.service");
const mealsRepository = require("../../src/repositories/meals.repository");
const employeesRepository = require("../../src/repositories/employees.repository");
const { ConflictError, NotFoundError } = require("../../src/errors/AppError");

jest.mock("../../src/repositories/meals.repository");
jest.mock("../../src/repositories/employees.repository");

describe("MealsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should call repository with correct filters", async () => {
      mealsRepository.getAll.mockResolvedValue([]);
      await mealsService.getAll({
        companyId: 1,
        employeeId: 2,
        periodStart: "2023-01-01",
      });
      expect(mealsRepository.getAll).toHaveBeenCalled();
    });

    it("should handle date filter", async () => {
      mealsRepository.getAll.mockResolvedValue([]);
      await mealsService.getAll({ date: "2023-01-01" });
      expect(mealsRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          date: expect.any(Object),
        })
      );
    });

    it("should handle date_lte and date_gte", async () => {
      mealsRepository.getAll.mockResolvedValue([]);
      await mealsService.getAll({
        date_lte: "2023-01-01",
        date_gte: "2023-01-02",
      });
      expect(mealsRepository.getAll).toHaveBeenCalled();
    });

    it("should handle date_lte with time", async () => {
      mealsRepository.getAll.mockResolvedValue([]);
      await mealsService.getAll({ date_lte: "2023-01-01T10:00:00" }); // Has T
      expect(mealsRepository.getAll).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create meal successfully", async () => {
      employeesRepository.getById.mockResolvedValue({ id: 1, companyId: 1 });
      mealsRepository.findByEmployeeAndDate.mockResolvedValue(null);
      mealsRepository.create.mockResolvedValue({ id: 1 });

      await mealsService.create({
        employeeId: 1,
        date: "2023-05-26",
        companyId: 1,
      });
      expect(mealsRepository.create).toHaveBeenCalled();
    });

    it("should create meal with period logic (day < 26)", async () => {
      employeesRepository.getById.mockResolvedValue({ id: 1, companyId: 1 });
      mealsRepository.findByEmployeeAndDate.mockResolvedValue(null);
      mealsRepository.create.mockResolvedValue({ id: 1 });

      await mealsService.create({
        employeeId: 1,
        date: "2023-05-10",
        companyId: 1,
      }); // Before 26th
      expect(mealsRepository.create).toHaveBeenCalled();
    });

    it("should throw if employee not found", async () => {
      employeesRepository.getById.mockResolvedValue(null);
      await expect(mealsService.create({ employeeId: 1 })).rejects.toThrow(
        NotFoundError
      );
    });

    it("should throw if employee dismissed", async () => {
      employeesRepository.getById.mockResolvedValue({
        id: 1,
        dataDemissao: "2023-01-01",
      });
      await expect(
        mealsService.create({ employeeId: 1, date: "2023-02-01" })
      ).rejects.toThrow(ConflictError);
    });

    it("should throw if meal duplicate", async () => {
      employeesRepository.getById.mockResolvedValue({ id: 1 });
      mealsRepository.findByEmployeeAndDate.mockResolvedValue({ id: 10 });
      await expect(
        mealsService.create({ employeeId: 1, date: "2023-01-01" })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe("importBulk", () => {
    it("should import valid records and link them", async () => {
      employeesRepository.getAll.mockResolvedValue([
        { matricula: "123", id: 1 },
      ]);
      mealsRepository.create.mockResolvedValue({ id: 1 });

      const res = await mealsService.importBulk(
        [{ matricula: "123", date: "2023-01-01" }],
        1
      );
      expect(res[0].success).toBe(true);
    });

    it("should handle failure gracefully", async () => {
      employeesRepository.getAll.mockResolvedValue([]);
      mealsRepository.create.mockRejectedValue(new Error("Fail"));

      const res = await mealsService.importBulk(
        [{ matricula: "999", date: "2023-01-01" }],
        1
      );
      expect(res[0].success).toBe(false);
    });
  });

  describe("analyzeBatch", () => {
    it("should analyze batch", async () => {
      employeesRepository.getAll.mockResolvedValue([
        { matricula: "123", id: 1 },
      ]);
      mealsRepository.findCollisionsInRange.mockResolvedValue([]);

      const data = [
        { matricula: "123", date: "2023-01-01" },
        { matricula: "", date: "" }, // Invalid
        { matricula: "999", date: "invalid" }, // Invalid Date
      ];

      const res = await mealsService.analyzeBatch(data, 1);
      expect(res.valid.length).toBe(1);
      expect(res.invalid.length).toBe(2);
    });

    it("should detect collisions", async () => {
      employeesRepository.getAll.mockResolvedValue([
        { matricula: "123", id: 1 },
      ]);
      mealsRepository.findCollisionsInRange.mockResolvedValue([
        { employeeId: 1, date: new Date("2023-01-01") },
      ]);

      const data = [{ matricula: "123", date: "2023-01-01" }];
      const res = await mealsService.analyzeBatch(data, 1);

      expect(res.invalid.length).toBe(1);
    });

    it("should detect dismissed employees", async () => {
      employeesRepository.getAll.mockResolvedValue([
        { matricula: "123", id: 1, dataDemissao: new Date("2022-01-01") },
      ]);
      mealsRepository.findCollisionsInRange.mockResolvedValue([]);

      const data = [{ matricula: "123", date: "2023-01-01" }];
      const res = await mealsService.analyzeBatch(data, 1);

      expect(res.invalid.length).toBe(1);
    });
  });

  describe("Other methods", () => {
    it("should proxy delete", async () => {
      await mealsService.delete(1);
      expect(mealsRepository.delete).toHaveBeenCalledWith(1);
    });
    it("should proxy countPending", async () => {
      await mealsService.countPending(1);
      expect(mealsRepository.count).toHaveBeenCalled();
    });
    it("should proxy getPendingMeals", async () => {
      await mealsService.getPendingMeals(1);
      expect(mealsRepository.findMany).toHaveBeenCalled();
    });
    it("should proxy deletePendingByMatricula", async () => {
      await mealsService.deletePendingByMatricula(1, 1);
      expect(mealsRepository.deleteMany).toHaveBeenCalled();
    });
    it("should proxy toggleIgnorePendingByMatricula", async () => {
      await mealsService.toggleIgnorePendingByMatricula(1, 1, true);
      expect(mealsRepository.updateMany).toHaveBeenCalled();
    });
    it("should countByEmployee", async () => {
      await mealsService.countByEmployee(1);
      expect(mealsRepository.countByEmployeeId).toHaveBeenCalled();
    });
  });
});
