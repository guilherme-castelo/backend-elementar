const authController = require("../../../src/controllers/auth.controller");
const authService = require("../../../src/services/auth.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../src/services/auth.service");

describe("AuthController", () => {
  describe("login", () => {
    it("should return 200 and token on success", async () => {
      const req = mockRequest({ email: "test@example.com", password: "123" });
      const res = mockResponse();
      const next = mockNext();

      authService.login.mockResolvedValue({ token: "abc", user: { id: 1 } });

      await authController.login(req, res, next);

      expect(res.status).not.toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ token: "abc", user: { id: 1 } });
    });

    it("should return 401 on failure", async () => {
      const req = mockRequest({ email: "test@example.com", password: "123" });
      const res = mockResponse();
      const next = mockNext();

      authService.login.mockRejectedValue(new Error("Invalid credentials"));

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Invalid credentials" })
      );
    });
  });

  describe("register", () => {
    it("should return 201", async () => {
      const req = mockRequest({ email: "new@ex.com" });
      const res = mockResponse();
      const next = mockNext();

      authService.register.mockResolvedValue({ id: 1 });
      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it("should return 400 on error", async () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = mockNext();
      authService.register.mockRejectedValue(new Error("Fail"));
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("me", () => {
    it("should return user data", async () => {
      const req = mockRequest({}, {}, {}, { id: 1 }); // req.user set by middleware
      const res = mockResponse();
      const next = mockNext();

      authService.me.mockResolvedValue({ id: 1, name: "Test" });

      await authController.me(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ id: 1, name: "Test" });
    });

    it("should return 404 on errors", async () => {
      const req = mockRequest({}, {}, {}, { id: 1 });
      const res = mockResponse();
      const next = mockNext();

      authService.me.mockRejectedValue(new Error("Fail"));

      await authController.me(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
