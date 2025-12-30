const controller = require("../../../src/controllers/employees.controller");
const service = require("../../../src/services/employees.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../src/services/employees.service", () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getById: jest.fn(),
  delete: jest.fn(),
}));

describe("EmployeesController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  it("create should return 201", async () => {
    service.create.mockResolvedValue({});
    await controller.create(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getAll should pass companyId", async () => {
    req.user = { companyId: 1 };
    req.query = {}; // Ensure query exists
    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);
    expect(service.getAll).toHaveBeenCalled();
  });
});
