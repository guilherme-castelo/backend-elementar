const request = require("supertest");
const jwt = require("jsonwebtoken");
jest.mock("../../src/utils/prisma"); // Manual mock

const prismaMock = require("../../src/utils/prisma");
const app = require("../../src/app");

describe("Integration: Permission Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const generateToken = (payload) => jwt.sign(payload, "test-secret");

  describe("GET /features", () => {
    it("should return 401", async () => {
      await request(app).get("/features").expect(401);
    });

    it("should return 403", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        role: { permissions: [] },
        companyId: 1,
      });
      const token = generateToken({ id: 1 });
      await request(app)
        .get("/features")
        .set("Authorization", `Bearer ${token}`)
        .expect(403);
    });

    it("should return 200", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        isActive: true,
        role: { permissions: [{ slug: "feature:manage" }] },
        companyId: 1,
      });
      prismaMock.feature.findMany.mockResolvedValue([]);

      const token = generateToken({ id: 1 });
      await request(app)
        .get("/features")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });
});
