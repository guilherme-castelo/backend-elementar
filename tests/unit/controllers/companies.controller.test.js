const controller = require("../../../src/controllers/companies.controller");
const service = require("../../../src/services/companies.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../src/services/companies.service", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
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
    it("should return 200 with list", async () => {
      service.getAll.mockResolvedValue([]);
      await controller.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle error", async () => {
      const err = new Error("Err");
      service.getAll.mockRejectedValue(err);
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("getById", () => {
    it("should return 200 with company", async () => {
      req.params.id = 1;
      service.getById.mockResolvedValue({ id: 1 });
      await controller.getById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should handle error", async () => {
      req.params.id = 1;
      const err = new Error("Err");
      service.getById.mockRejectedValue(err);
      await controller.getById(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe("create", () => {
    it("should return 201 with created company", async () => {
      req.body = { name: "New" };
      service.create.mockResolvedValue({ id: 1 });
      await controller.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should handle error", async () => {
      service.create.mockRejectedValue(new Error("Err"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("update", () => {
    it("should return 200 with updated company", async () => {
      req.params.id = 1;
      req.body = { name: "Upd" };
      service.update.mockResolvedValue({ id: 1 });
      await controller.update(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should handle error", async () => {
      req.params.id = 1;
      service.update.mockRejectedValue(new Error("Err"));
      await controller.update(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
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
      req.params.id = 1;
      service.delete.mockRejectedValue(new Error("Err"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("getRoles", () => {
    it("should return static roles", async () => {
      await controller.getRoles(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([{ id: "admin", name: "Admin" }]));
    });
  });

  describe("getPermissions", () => {
    it("should return static permissions", async () => {
      await controller.getPermissions(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining(["users:read"]));
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
      req.params.id = 1;
      service.update.mockRejectedValue(new Error("Err"));
      await controller.inactivate(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
