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

      const query = {
        companyId: "1",
        employeeId: "2",
        date: "2023-10-01",
        date_gte: "2023-10-01",
        date_lte: "2023-10-31" // Simple date string
      };

      await mealsService.getAll(query);

      expect(mealsRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({
        companyId: 1,
        employeeId: 2,
        date: expect.objectContaining({
          gte: expect.any(Date),
          lte: expect.any(Date)
        })
      }));
    });

    it("should handle ISO date_lte correctly", async () => {
      mealsRepository.getAll.mockResolvedValue([]);
      // Sending ISO with Time
      await mealsService.getAll({ date_lte: "2023-10-01T12:00:00.000Z" });

      expect(mealsRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({
        date: expect.objectContaining({ lte: new Date("2023-10-01T12:00:00.000Z") })
      }));
    });
  });

  describe("create", () => {
    const mockEmployee = {
      id: 1,
      companyId: 1,
      firstName: "John",
      lastName: "Doe",
      setor: "IT",
      dataDemissao: null
    };

    it("should create meal successfully", async () => {
      employeesRepository.getById.mockResolvedValue(mockEmployee);
      mealsRepository.findByEmployeeAndDate.mockResolvedValue(null);
      mealsRepository.create.mockResolvedValue({ id: 1 });

      const data = { employeeId: 1, date: new Date(), companyId: 1 };
      await mealsService.create(data);

      expect(mealsRepository.create).toHaveBeenCalled();
    });

    it("should throw if employee not found", async () => {
      employeesRepository.getById.mockResolvedValue(null);
      await expect(mealsService.create({ employeeId: 99 })).rejects.toThrow(NotFoundError);
    });

    it("should throw if employee dismissed", async () => {
      const dismissedIdx = { ...mockEmployee, dataDemissao: new Date("2020-01-01") };
      employeesRepository.getById.mockResolvedValue(dismissedIdx);
      await expect(mealsService.create({ employeeId: 1, date: new Date("2023-01-01") }))
        .rejects.toThrow(ConflictError);
    });

    it("should throw if meal duplicate", async () => {
      employeesRepository.getById.mockResolvedValue(mockEmployee);
      mealsRepository.findByEmployeeAndDate.mockResolvedValue({ id: 5 });
      await expect(mealsService.create({ employeeId: 1, date: new Date() }))
        .rejects.toThrow(ConflictError);
    });
  });

  describe("importBulk", () => {
    it("should import valid records and link them", async () => {
      employeesRepository.getAll.mockResolvedValue([{ id: 1, matricula: "123", firstName: "A", lastName: "B" }]);
      mealsRepository.create.mockResolvedValue({});

      const records = [{ matricula: "123", date: "2023-10-01" }];
      const res = await mealsService.importBulk(records, 1);

      expect(res[0].success).toBe(true);
      expect(mealsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ status: "LINKED" }));
    });

    it("should handle failures gracefull", async () => {
      employeesRepository.getAll.mockResolvedValue([]);
      mealsRepository.create.mockRejectedValue(new Error("DB Error"));

      const records = [{ matricula: "999", date: "2023-10-01" }];
      const res = await mealsService.importBulk(records, 1);

      expect(res[0].success).toBe(false);
      expect(res[0].error).toBe("DB Error");
    });
  });
});
