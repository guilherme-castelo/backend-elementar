const controller = require("../../../controllers/permissions.controller");
const service = require("../../../services/permissions.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../services/permissions.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

describe("PermissionsController", () => {
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

  it("getAll should return 200", async () => {
    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });
});
