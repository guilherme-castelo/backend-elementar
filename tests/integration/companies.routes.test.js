const request = require("supertest");
const jwt = require("jsonwebtoken");
jest.mock("../../utils/prisma");

const prismaMock = require("../../utils/prisma");
const app = require("../../app");

describe("Integration: Companies Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const token = jwt.sign({ id: 1 }, "test-secret");

  const adminUser = {
    id: 1,
    isActive: true,
    role: {
      permissions: [{ slug: "company:read" }, { slug: "company:inactivate" }],
    },
  };

  it("should list companies", async () => {
    prismaMock.user.findUnique.mockResolvedValue(adminUser);
    prismaMock.company.findMany.mockResolvedValue([]);
    await request(app)
      .get("/companies")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("should inactivate company", async () => {
    prismaMock.user.findUnique.mockResolvedValue(adminUser);
    prismaMock.company.update.mockResolvedValue({});
    await request(app)
      .patch("/companies/1/inactivate")
      .set("Authorization", `Bearer ${token}`)
      .expect(204);
  });
});
