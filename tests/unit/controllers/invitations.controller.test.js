const controller = require("../../../controllers/invitations.controller");
const service = require("../../../services/invitations.service");
const { mockRequest, mockResponse, mockNext } = require("../../utils/httpMocks");

jest.mock("../../../services/invitations.service", () => ({
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
  });
});
