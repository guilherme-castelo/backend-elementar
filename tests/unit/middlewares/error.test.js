const errorHandler = require("../../../src/middlewares/error");
const { AppError, NotFoundError } = require("../../../src/errors/AppError");

describe("Error Middleware", () => {
  let req, res, next;
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should handle AppError", () => {
    const error = new NotFoundError("Not Found");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Not Found" })
    );
  });

  it("should handle generic Error as 500", () => {
    const error = new Error("Boom");
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Internal Server Error" })
    );
  });

  it("should handle Prisma Unique Constraint (P2002)", () => {
    const error = { code: "P2002", meta: { target: ["email"] } };
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unique constraint violation" })
    );
  });

  it("should handle Prisma Not Found (P2025)", () => {
    const error = { code: "P2025" };
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Record not found" })
    );
  });

  it("should handle ValidationError by name", () => {
    const error = { name: "ValidationError", message: "Invalid email" };
    errorHandler(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid email" })
    );
  });

  it("should log error if not test env", () => {
    process.env.NODE_ENV = "development";
    const error = new Error("Log me");
    errorHandler(error, req, res, next);
    expect(console.error).toHaveBeenCalledWith(error);
    process.env.NODE_ENV = originalEnv;
  });
});
