const contextMiddleware = require("../../../src/middlewares/context");
const contextUtils = require("../../../src/utils/context");

jest.mock("../../../src/utils/context");

describe("Context Middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: 1, companyId: 10 } };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should run with context populated from req.user", () => {
    contextUtils.runWithContext.mockImplementation((store, cb) => cb());

    contextMiddleware(req, res, next);

    expect(contextUtils.runWithContext).toHaveBeenCalledWith(
      { userId: 1, companyId: 10 },
      expect.any(Function)
    );
    expect(next).toHaveBeenCalled();
  });

  it("should run with null context if no user", () => {
    req.user = undefined;
    contextUtils.runWithContext.mockImplementation((store, cb) => cb());

    contextMiddleware(req, res, next);

    expect(contextUtils.runWithContext).toHaveBeenCalledWith(
      { userId: null, companyId: null },
      expect.any(Function)
    );
    expect(next).toHaveBeenCalled();
  });
});
