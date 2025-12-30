const usersController = require("../../../src/controllers/users.controller");
const usersService = require("../../../src/services/users.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../src/services/users.service");

describe("UsersController", () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should return 201", async () => {
      req.body = { name: "User" };
      usersService.create.mockResolvedValue({ id: 1 });
      await usersController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should handle error", async () => {
      usersService.create.mockRejectedValue(new Error("Fail"));
      await usersController.create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getAll", () => {
    it("should return 200", async () => {
      usersService.getAll.mockResolvedValue([]);
      await usersController.getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe("inactivate", () => {
    it("should return 204", async () => {
      req.params.id = 1;
      await usersController.inactivate(req, res, next);
      expect(usersService.update).toHaveBeenCalledWith(1, { isActive: false });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});
