const controller = require("../../../controllers/companies.controller");
const service = require("../../../services/companies.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../services/companies.service", () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  getById: jest.fn(),
  delete: jest.fn(),
}));

describe("CompaniesController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return companies", async () => {
      service.getAll.mockResolvedValue([]);
      await controller.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("create", () => {
    it("should create company", async () => {
      req.body = { name: "Comp" };
      service.create.mockResolvedValue({ id: 1 });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("inactivate", () => {
    it("should inactivate company", async () => {
      req.params.id = 1;
      await controller.inactivate(req, res, next);
      expect(service.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
