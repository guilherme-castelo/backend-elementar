const request = require("supertest");
const jwt = require("jsonwebtoken");
const prismaMock = require("../../src/utils/prisma");
const app = require("../../src/app");

jest.mock("../../src/utils/prisma");

describe("Integration: Meals Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = jwt.sign({ id: 1 }, "test-secret");

  const permissionRegister = { slug: "meal:create" };
  const permissionReport = { slug: "meal:read" };

  const adminUser = {
    id: 1,
    isActive: true,
    role: {
      permissions: [permissionRegister, permissionReport],
    },
  };

  describe("POST /meals", () => {
    it("should register a meal successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);

      // Service Flow:
      // 1. Employee check
      prismaMock.employee.findUnique.mockResolvedValue({
        id: 10,
        firstName: "John",
        lastName: "Doe",
        setor: "IT",
        companyId: 1,
      });
      // 2. Duplicate check
      prismaMock.meal.findFirst.mockResolvedValue(null);
      // 3. Create
      prismaMock.meal.create.mockResolvedValue({ id: 1 });

      await request(app)
        .post("/meals")
        .set("Authorization", `Bearer ${token}`)
        .send({ employeeId: 10, date: new Date().toISOString(), companyId: 1 })
        .expect(201);
    });

    it("should return 400 if duplicate", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);

      prismaMock.employee.findUnique.mockResolvedValue({ id: 10 });
      prismaMock.meal.findFirst.mockResolvedValue({ id: 99 }); // Exists

      await request(app)
        .post("/meals")
        .set("Authorization", `Bearer ${token}`)
        .send({ employeeId: 10, date: new Date().toISOString(), companyId: 1 })
        .expect(400);
    });

    it("should return 400 for invalid data", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);

      await request(app)
        .post("/meals")
        .set("Authorization", `Bearer ${token}`)
        .send({}) // Empty
        .expect(400);
    });
  });

  describe("GET /meals?periodStart&periodEnd", () => {
    it("should return meals filtered by period for reports", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.meal.findMany.mockResolvedValue([
        { id: 1, date: new Date(), employee: { firstName: "Test" } },
      ]);

      await request(app)
        .get("/meals")
        .query({ periodStart: "2026-01-01", periodEnd: "2026-01-07" })
        .set("Authorization", `Bearer ${token}`)
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
});
