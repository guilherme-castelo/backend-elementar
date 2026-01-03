// Mock repositories BEFORE requiring the service
const mockMealsRepo = {
  getAll: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  findMany: jest.fn(),
  countByEmployeeId: jest.fn(),
  deleteMany: jest.fn(),
  updateMany: jest.fn(),
  findCollisionsInRange: jest.fn(),
};

const mockEmployeesRepo = {
  getById: jest.fn(),
  getAll: jest.fn(),
};

jest.mock("../../src/repositories/meals.repository", () => mockMealsRepo);
jest.mock(
  "../../src/repositories/employees.repository",
  () => mockEmployeesRepo
);

const MealsService = require("../../src/services/meals.service");

describe("MealsService Report Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate correct period for January 2026", () => {
    // Reference date: Jan 10, 2026
    const date = new Date(2026, 0, 10); // Jan 10
    const period = MealsService._getPeriod(date);

    // Expected: Dec 26, 2025 - Jan 25, 2026
    // Note: use local time construction for expected values to match service
    const expectedStart = new Date(2025, 11, 26);
    const expectedEnd = new Date(2026, 0, 25);

    expect(period.periodStart.getTime()).toBe(expectedStart.getTime());
    expect(period.periodEnd.getTime()).toBe(expectedEnd.getTime());
  });

  it("should calculate correct period for Late January 2026", () => {
    // Reference date: Jan 26, 2026
    const date = new Date(2026, 0, 26);
    const period = MealsService._getPeriod(date);

    // Expected: Jan 26, 2026 - Feb 25, 2026
    const expectedStart = new Date(2026, 0, 26);
    const expectedEnd = new Date(2026, 1, 25);

    expect(period.periodStart.getTime()).toBe(expectedStart.getTime());
    expect(period.periodEnd.getTime()).toBe(expectedEnd.getTime());
  });

  it("should verify Date parsing from string", () => {
    // If we pass "2025-12-26", it should be UTC midnight
    // This confirms that if a client sends a date string "YYYY-MM-DD",
    // the backend sees it as UTC Midnight.
    const input = "2025-12-26";
    const parsed = new Date(input);
    // In Node, new Date('YYYY-MM-DD') is UTC midnight.
    // We rely on this behavior for the proposed frontend fix.
    expect(parsed.toISOString()).toMatch(/2025-12-26T00:00:00.000Z/);
  });
});
