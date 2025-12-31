const controller = require("../../../src/controllers/users.controller");
const service = require("../../../src/services/users.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../src/services/users.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

describe("UsersController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return 200", async () => {
      service.getAll.mockResolvedValue([]);
      await controller.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([]);
    });
    it("should handle error", async () => {
      service.getAll.mockRejectedValue(new Error("Err"));
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should return 200", async () => {
      req.params.id = 1;
      service.getById.mockResolvedValue({});
      await controller.getById(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.getById.mockRejectedValue(new Error("Err"));
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should return 201", async () => {
      req.body = { name: "User" };
      service.create.mockResolvedValue({ id: 1 });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("should handle error", async () => {
      service.create.mockRejectedValue(new Error("Err"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should return 200", async () => {
      req.params.id = 1;
      service.update.mockResolvedValue({});
      await controller.update(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.update.mockRejectedValue(new Error("Err"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("should return 204", async () => {
      req.params.id = 1;
      service.delete.mockResolvedValue({});
      await controller.delete(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
    });
    it("should handle error", async () => {
      service.delete.mockRejectedValue(new Error("Err"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("inactivate", () => {
    it("should return 204", async () => {
      req.params.id = 1;
      service.update.mockResolvedValue({});
      await controller.inactivate(req, res, next);
      expect(service.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(res.status).toHaveBeenCalledWith(204);
    });
    it("should handle error", async () => {
      service.update.mockRejectedValue(new Error("Err"));
      await controller.inactivate(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
