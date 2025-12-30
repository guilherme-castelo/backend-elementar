const controller = require("../../../src/controllers/roles.controller");
const service = require("../../../src/services/roles.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../src/services/roles.service");

describe("RolesController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  it("create should call service", async () => {
    service.create.mockResolvedValue({});
    await controller.create(req, res, next);
    expect(service.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getAll should call service", async () => {
    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);
    expect(service.getAll).toHaveBeenCalled();
  });

  it("update should call service", async () => {
    req.params.id = 1;
    await controller.update(req, res, next);
    expect(service.update).toHaveBeenCalled();
  });
});
