const controller = require("../../../src/controllers/meals.controller");
const service = require("../../../src/services/meals.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../src/services/meals.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  delete: jest.fn(),
  countPending: jest.fn(),
  countByEmployee: jest.fn(),
  getPendingMeals: jest.fn(),
  deletePendingByMatricula: jest.fn(),
  toggleIgnorePendingByMatricula: jest.fn(),
  analyzeBatch: jest.fn(),
  importBulk: jest.fn(),
}));

describe("MealsController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    req.user = { companyId: 1 };
    next = mockNext();
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return data", async () => {
      service.getAll.mockResolvedValue([]);
      await controller.getAll(req, res, next);
      expect(service.getAll).toHaveBeenCalledWith(req.query);
      expect(res.json).toHaveBeenCalledWith([]);
    });
    it("should handle error", async () => {
      service.getAll.mockRejectedValue(new Error("Err"));
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should return 201", async () => {
      service.create.mockResolvedValue({});
      await controller.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("should return 400 on error", async () => {
      service.create.mockRejectedValue(new Error("Err"));
      await controller.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("delete", () => {
    it("should return 204", async () => {
      req.params.id = 1;
      await controller.delete(req, res, next);
      expect(service.delete).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
    });
    it("should handle error", async () => {
      req.params.id = 1;
      service.delete.mockRejectedValue(new Error("Err"));
      await controller.delete(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getPendingCount", () => {
    it("should return count", async () => {
      service.countPending.mockResolvedValue(5);
      await controller.getPendingCount(req, res, next);
      expect(service.countPending).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith({ count: 5 });
    });
    it("should use default companyId if user missing", async () => {
      req.user = undefined;
      service.countPending.mockResolvedValue(6);
      await controller.getPendingCount(req, res, next);
      expect(service.countPending).toHaveBeenCalledWith(1);
    });
    it("should handle error", async () => {
      service.countPending.mockRejectedValue(new Error("Err"));
      await controller.getPendingCount(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("countByEmployee", () => {
    it("should return count", async () => {
      req.params.employeeId = 2;
      service.countByEmployee.mockResolvedValue(3);
      await controller.countByEmployee(req, res, next);
      expect(service.countByEmployee).toHaveBeenCalledWith(2);
      expect(res.json).toHaveBeenCalledWith({ count: 3 });
    });
    it("should handle error", async () => {
      service.countByEmployee.mockRejectedValue(new Error("Err"));
      await controller.countByEmployee(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getPending", () => {
    it("should return pending meals", async () => {
      service.getPendingMeals.mockResolvedValue([]);
      await controller.getPending(req, res, next);
      expect(service.getPendingMeals).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalled();
    });
    it("should use default companyId", async () => {
      req.user = undefined;
      service.getPendingMeals.mockResolvedValue([]);
      await controller.getPending(req, res, next);
      expect(service.getPendingMeals).toHaveBeenCalledWith(1);
    });
    it("should handle error", async () => {
      service.getPendingMeals.mockRejectedValue(new Error("Err"));
      await controller.getPending(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("deletePendingByMatricula", () => {
    it("should return 204", async () => {
      req.params.matricula = "123";
      await controller.deletePendingByMatricula(req, res, next);
      expect(service.deletePendingByMatricula).toHaveBeenCalledWith("123", 1);
      expect(res.status).toHaveBeenCalledWith(204);
    });
    it("should use default companyId", async () => {
      req.params.matricula = "123";
      req.user = undefined;
      await controller.deletePendingByMatricula(req, res, next);
      expect(service.deletePendingByMatricula).toHaveBeenCalledWith("123", 1);
    });
    it("should handle error", async () => {
      service.deletePendingByMatricula.mockRejectedValue(new Error("Err"));
      await controller.deletePendingByMatricula(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("toggleIgnorePending", () => {
    it("should return 200", async () => {
      req.params.matricula = "123";
      req.body.ignore = true;
      await controller.toggleIgnorePending(req, res, next);
      expect(service.toggleIgnorePendingByMatricula).toHaveBeenCalledWith("123", 1, true);
      expect(res.status).toHaveBeenCalledWith(200);
    });
    it("should use default companyId", async () => {
      req.params.matricula = "123";
      req.body.ignore = true;
      req.user = undefined;
      await controller.toggleIgnorePending(req, res, next);
      expect(service.toggleIgnorePendingByMatricula).toHaveBeenCalledWith("123", 1, true);
    });
    it("should handle error", async () => {
      service.toggleIgnorePendingByMatricula.mockRejectedValue(new Error("Err"));
      await controller.toggleIgnorePending(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("analyzeImport", () => {
    it("should return result", async () => {
      req.body = { file: "data" };
      service.analyzeBatch.mockResolvedValue({});
      await controller.analyzeImport(req, res, next);
      expect(service.analyzeBatch).toHaveBeenCalledWith({ file: "data" }, 1);
      expect(res.json).toHaveBeenCalled();
    });
    it("should use default companyId", async () => {
      req.body = { file: "data" };
      req.user = undefined;
      service.analyzeBatch.mockResolvedValue({});
      await controller.analyzeImport(req, res, next);
      expect(service.analyzeBatch).toHaveBeenCalledWith({ file: "data" }, 1);
    });
    it("should handle error", async () => {
      service.analyzeBatch.mockRejectedValue(new Error("Err"));
      await controller.analyzeImport(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("importBulk", () => {
    it("should return 201", async () => {
      req.body.records = [];
      service.importBulk.mockResolvedValue({});
      await controller.importBulk(req, res, next);
      expect(service.importBulk).toHaveBeenCalledWith([], 1);
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("should use default companyId", async () => {
      req.body.records = [];
      req.user = undefined;
      service.importBulk.mockResolvedValue({});
      await controller.importBulk(req, res, next);
      expect(service.importBulk).toHaveBeenCalledWith([], 1);
    });
    it("should handle error", async () => {
      service.importBulk.mockRejectedValue(new Error("Err"));
      await controller.importBulk(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
