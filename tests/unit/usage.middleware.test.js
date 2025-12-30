const { mockReset } = require("jest-mock-extended");
jest.mock("../../src/utils/prisma");
const prisma = require("../../src/utils/prisma");
const checkUsage = require("../../src/middlewares/usage");
const { mockRequest, mockResponse, mockNext } = require("../utils/httpMocks");

describe("Usage Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    mockReset(prisma);
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    req.user = { companyId: 1 };
  });

  it("should allow if below limit", async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 1,
      plan: { maxUsers: 10 },
    });
    prisma.user.count.mockResolvedValue(5);

    const middleware = checkUsage("users");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should block if limit reached", async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 1,
      plan: { maxUsers: 10 },
    });
    prisma.user.count.mockResolvedValue(10); // Limit reached

    const middleware = checkUsage("users");
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("limit reached"),
      })
    );
  });

  it("should allow if no plan (defensive)", async () => {
    prisma.company.findUnique.mockResolvedValue({
      id: 1,
      plan: null, // Legacy company
    });

    const middleware = checkUsage("users");
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
