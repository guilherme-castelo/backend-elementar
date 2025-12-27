const controller = require("../../../controllers/tasks.controller");
const service = require("../../../services/tasks.service");
const {
  mockRequest,
  mockResponse,
  mockNext,
} = require("../../utils/httpMocks");

jest.mock("../../../services/tasks.service", () => ({
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
  });

  it("create should return 201", async () => {
    service.create.mockResolvedValue({});
    req.user = { id: 1, companyId: 1 };
    req.body = { title: "T" };

    await controller.create(req, res, next);
    expect(service.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("getAll should call service", async () => {
    req.user = { id: 1 };
    service.getAll.mockResolvedValue([]);
    await controller.getAll(req, res, next);
    expect(service.getAll).toHaveBeenCalled();
  });
});
