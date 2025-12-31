const controller = require("../../../src/controllers/employees.controller");
const service = require("../../../src/services/employees.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

// Important: Mock the method signatures explicitly
jest.mock("../../../src/services/employees.service", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

describe("EmployeesController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return 200 with list", async () => {
      service.getAll.mockResolvedValue([]);
      req.query = { companyId: "1" };

      await controller.getAll(req, res, next);

      expect(service.getAll).toHaveBeenCalledWith({ companyId: "1" });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle error", async () => {
      const err = new Error("DB");
      service.getAll.mockRejectedValue(err);
      req.query = {};

      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getById", () => {
    it("should return 200 with employee", async () => {
      req.params.id = 1;
      service.getById.mockResolvedValue({ id: 1 });

      await controller.getById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should propagate error", async () => {
      req.params.id = 1;
      const err = new Error("Err");
      service.getById.mockRejectedValue(err);
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("create", () => {
    it("should return 201", async () => {
      req.body = { firstName: "John" };
      service.create.mockResolvedValue({ id: 1 });

      // Controller sends req.body directly
      await controller.create(req, res, next);

      expect(service.create).toHaveBeenCalledWith({ firstName: "John" });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should propagate error", async () => {
      req.body = {};
      const err = new Error("Validation");
      service.create.mockRejectedValue(err);

      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("update", () => {
    it("should return 200", async () => {
      req.params.id = 1;
      req.body = { firstName: "Jane" };
      service.update.mockResolvedValue({ id: 1 });

      await controller.update(req, res, next);

      expect(service.update).toHaveBeenCalledWith(1, req.body);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should propagate error", async () => {
      req.params.id = 1;
      const err = new Error("Err");
      service.update.mockRejectedValue(err);
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("delete", () => {
    it("should return 204", async () => {
      req.params.id = 1;
      req.query = { mealsAction: "DELETE" };
      service.delete.mockResolvedValue({});

      await controller.delete(req, res, next);

      expect(service.delete).toHaveBeenCalledWith(1, "DELETE");
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it("should propagate error", async () => {
      req.params.id = 1;
      const err = new Error("Err");
      service.delete.mockRejectedValue(err);
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
