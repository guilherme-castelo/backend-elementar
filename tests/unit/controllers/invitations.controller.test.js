const controller = require("../../../src/controllers/invitations.controller");
const service = require("../../../src/services/invitations.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../src/services/invitations.service", () => ({
  create: jest.fn(),
  validateToken: jest.fn(),
  accept: jest.fn(),
}));

describe("InvitationsController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  describe("invite", () => {
    it("should return token on success", async () => {
      req.user = { companyId: 1 };
      req.body = { email: "a@a.com", roleId: 2 };
      service.create.mockResolvedValue({ token: "abc" });

      await controller.invite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: "abc" })
      );
    });

    it("should handle error", async () => {
      service.create.mockRejectedValue(new Error("Err"));
      await controller.invite(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("validate", () => {
    it("should return valid if token checks out", async () => {
      req.params.token = "t";
      service.validateToken.mockResolvedValue({ email: "e@m.com" });
      await controller.validate(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ email: "e@m.com", isValid: true });
    });

    it("should return 400 if token invalid", async () => {
      req.params.token = "t";
      service.validateToken.mockRejectedValue(new Error("Invalid"));
      await controller.validate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid", isValid: false });
    });
  });

  describe("accept", () => {
    it("should create user", async () => {
      req.body = { token: "t", name: "N", password: "p" };
      await controller.accept(req, res, next);
      expect(service.accept).toHaveBeenCalledWith("t", {
        name: "N",
        password: "p",
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should handle error", async () => {
      service.accept.mockRejectedValue(new Error("Err"));
      await controller.accept(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
