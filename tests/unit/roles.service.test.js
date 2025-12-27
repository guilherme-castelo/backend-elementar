const { mockReset } = require("jest-mock-extended");
jest.mock("../../utils/prisma");

const prisma = require("../../utils/prisma");
const rolesService = require("../../services/roles.service");

describe("RolesService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("create", () => {
    it("should create role", async () => {
      const data = { name: "Role" };
      prisma.role.create.mockResolvedValue({ id: 1, ...data });
      await rolesService.create(data);
      expect(prisma.role.create).toHaveBeenCalled();
    });
  });
});
