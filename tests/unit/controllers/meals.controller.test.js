const controller = require("../../../controllers/meals.controller");
const service = require("../../../services/meals.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../services/meals.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  delete: jest.fn(),
  getReport: jest.fn(),
}));

describe("MealsController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  it("register should return 201", async () => {
    service.create.mockResolvedValue({});
    await controller.register(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getAll should parse query", async () => {
    req.query = { date: "2023-01-01" };
    req.user = { companyId: 1 };

    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);

    expect(service.getAll).toHaveBeenCalled();
  });
});
