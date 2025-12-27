const controller = require("../../../controllers/notifications.controller");
const service = require("../../../services/notifications.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../services/notifications.service");

describe("NotificationsController", () => {
  let req, res, next;
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
  });

  it("getAll should return 200", async () => {
    req.user = { id: 1 };
    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);
    expect(res.json).toHaveBeenCalled();
  });
});
