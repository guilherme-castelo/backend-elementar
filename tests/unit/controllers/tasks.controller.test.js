const controller = require("../../../src/controllers/tasks.controller");
const service = require("../../../src/services/tasks.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../src/services/tasks.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  addComment: jest.fn(),
  getComments: jest.fn(),
}));

describe("TasksController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    req.user = { id: 1, companyId: 1 };
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return data", async () => {
      service.getAll.mockResolvedValue([]);
      await controller.getAll(req, res, next);
      expect(service.getAll).toHaveBeenCalledWith(req.query, req.user);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.getAll.mockRejectedValue(new Error("Err"));
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("getOne", () => {
    it("should return data", async () => {
      req.params.id = 1;
      service.getById.mockResolvedValue({});
      await controller.getOne(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.getById.mockRejectedValue(new Error("Err"));
      await controller.getOne(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should return 201", async () => {
      req.body = { title: "T" };
      service.create.mockResolvedValue({});
      await controller.create(req, res, next);
      // Check override
      expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 1 }));
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("should not override ownerUserId if present", async () => {
      req.body = { title: "T", ownerUserId: 99 };
      service.create.mockResolvedValue({});
      await controller.create(req, res, next);
      expect(service.create).toHaveBeenCalledWith(expect.objectContaining({ ownerUserId: 99 }));
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

  describe("getComments", () => {
    it("should return comments", async () => {
      req.params.id = 1;
      service.getComments.mockResolvedValue([]);
      await controller.getComments(req, res, next);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.getComments.mockRejectedValue(new Error("Err"));
      await controller.getComments(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("addComment", () => {
    it("should return 201", async () => {
      req.params.id = 1;
      req.body = { text: "Hi" };
      service.addComment.mockResolvedValue({});
      await controller.addComment(req, res, next);
      expect(service.addComment).toHaveBeenCalledWith(1, { text: "Hi" });
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("should handle error", async () => {
      service.addComment.mockRejectedValue(new Error("Err"));
      await controller.addComment(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
