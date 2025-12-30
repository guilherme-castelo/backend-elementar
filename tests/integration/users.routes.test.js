const request = require("supertest");
const jwt = require("jsonwebtoken");
jest.mock("../../src/utils/prisma");

const prismaMock = require("../../src/utils/prisma");
const app = require("../../src/app");

describe("Integration: Users Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const token = jwt.sign({ id: 1 }, "test-secret");

  const adminUser = {
    id: 1,
    isActive: true,
    role: { permissions: [{ slug: "user:read" }, { slug: "user:create" }] },
  };

  it("should list users", async () => {
    prismaMock.user.findUnique.mockResolvedValue(adminUser);
    prismaMock.user.findMany.mockResolvedValue([]);
    await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });
});
