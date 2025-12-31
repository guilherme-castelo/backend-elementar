const mealsService = require("../../../src/services/meals.service");
const mealsRepository = require("../../../src/repositories/meals.repository");
const employeesRepository = require("../../../src/repositories/employees.repository");

jest.mock("../../../src/repositories/meals.repository");
jest.mock("../../../src/repositories/employees.repository");

describe("MealsService - analyzeBatch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const companyId = 1;
  const mockEmployees = [
    {
      id: 1,
      matricula: "123",
      firstName: "John",
      lastName: "Doe",
      setor: "IT",
      dataDemissao: null
    },
    {
      id: 2,
      matricula: "456",
      firstName: "Jane",
      lastName: "Doe",
      setor: "HR",
      // Dismissed yesterday
      dataDemissao: new Date(Date.now() - 86400000)
    }
  ];

  it("should process valid records correctly", async () => {
    employeesRepository.getAll.mockResolvedValue(mockEmployees);
    mealsRepository.findCollisionsInRange.mockResolvedValue([]);

    const data = [
      { matricula: "123", date: "2023-10-01", price: 5.0 }
    ];

    const result = await mealsService.analyzeBatch(data, companyId);

    expect(result.summary.valid).toBe(1);
    expect(result.summary.invalid).toBe(0);
    expect(result.valid[0].employeeName).toBe("John Doe");
    expect(result.valid[0].linkStatus).toBe("LINKED");
  });

  it("should detect invalid data format", async () => {
    employeesRepository.getAll.mockResolvedValue(mockEmployees);
    mealsRepository.findCollisionsInRange.mockResolvedValue([]);

    const data = [
      { matricula: "", date: "" } // Missing fields
    ];

    const result = await mealsService.analyzeBatch(data, companyId);

    expect(result.summary.invalid).toBe(1);
    expect(result.invalid[0].reason).toContain("Matrícula obrigatória");
  });

  it("should detect dismissed employees", async () => {
    employeesRepository.getAll.mockResolvedValue(mockEmployees);
    mealsRepository.findCollisionsInRange.mockResolvedValue([]);

    const data = [
      // Jane is dismissed
      { matricula: "456", date: new Date().toISOString().split('T')[0] }
    ];

    const result = await mealsService.analyzeBatch(data, companyId);

    expect(result.summary.invalid).toBe(1);
    expect(result.invalid[0].reason).toContain("Funcionário demitido");
  });

  it("should detect duplicates in database", async () => {
    employeesRepository.getAll.mockResolvedValue(mockEmployees);
    // Mock collision for employee 1 on 2023-10-01
    const collisionDate = new Date("2023-10-01T12:00:00Z");
    mealsRepository.findCollisionsInRange.mockResolvedValue([
      { employeeId: 1, date: collisionDate }
    ]);

    const data = [
      { matricula: "123", date: "01/10/2023" } // BR format
    ];

    const result = await mealsService.analyzeBatch(data, companyId);

    expect(result.summary.invalid).toBe(1);
    expect(result.invalid[0].reason).toContain("já registrada");
  });

  it("should handle missing employees (PENDING_LINK)", async () => {
    employeesRepository.getAll.mockResolvedValue(mockEmployees);
    mealsRepository.findCollisionsInRange.mockResolvedValue([]);

    const data = [
      { matricula: "999", date: "2023-10-01" }
    ];

    const result = await mealsService.analyzeBatch(data, companyId);

    expect(result.summary.missingEmployee).toBe(1);
    expect(result.missingEmployee[0].matricula).toBe("999");
    expect(result.missingEmployee[0].linkStatus).toBe("PENDING_LINK");
  });
});
