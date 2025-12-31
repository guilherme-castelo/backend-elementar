const controller = require("../../../src/controllers/notifications.controller");
const service = require("../../../src/services/notifications.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../src/services/notifications.service", () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  markAsRead: jest.fn(),
  archive: jest.fn(),
}));

describe("NotificationsController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    req.user = { id: 1 };
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should return 200", async () => {
      service.getAll.mockResolvedValue([]);
      await controller.getAll(req, res, next);
      expect(service.getAll).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalledWith([]);
    });
    it("should handle error", async () => {
      service.getAll.mockRejectedValue(new Error("Err"));
      await controller.getAll(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should return 201", async () => {
      req.body = { msg: "hi" };
      service.create.mockResolvedValue({});
      await controller.create(req, res, next);
      expect(service.create).toHaveBeenCalledWith({ msg: "hi" });
      expect(res.status).toHaveBeenCalledWith(201);
    });
    it("should handle error", async () => {
      service.create.mockRejectedValue(new Error("Err"));
      await controller.create(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("markAsRead", () => {
    it("should return 200", async () => {
      req.params.id = 1;
      service.markAsRead.mockResolvedValue({});
      await controller.markAsRead(req, res, next);
      expect(service.markAsRead).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.markAsRead.mockRejectedValue(new Error("Err"));
      await controller.markAsRead(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("archive", () => {
    it("should return 200", async () => {
      req.params.id = 1;
      service.archive.mockResolvedValue({});
      await controller.archive(req, res, next);
      expect(service.archive).toHaveBeenCalledWith(1);
      expect(res.json).toHaveBeenCalled();
    });
    it("should handle error", async () => {
      service.archive.mockRejectedValue(new Error("Err"));
      await controller.archive(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
