const request = require("supertest");
const jwt = require("jsonwebtoken");
const prismaMock = require("../../utils/prisma");
const app = require("../../app");

jest.mock("../../utils/prisma");

describe("Integration: Employees Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = jwt.sign({ id: 1 }, "test-secret");

  const adminUser = {
    id: 1,
    isActive: true,
    role: {
      permissions: [
        { slug: "employee:read" },
        { slug: "employee:create" },
        { slug: "employee:update" },
        { slug: "employee:delete" },
      ],
    },
  };

  describe("GET /employees", () => {
    it("should list employees", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.employee.findMany.mockResolvedValue([{ id: 1, name: "John" }]);
      prismaMock.employee.count.mockResolvedValue(1);

      await request(app)
        .get("/employees")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
    });
  });

  describe("POST /employees", () => {
    it("should create employee", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.employee.findFirst.mockResolvedValue(null); // Unique check
      prismaMock.employee.create.mockResolvedValue({ id: 2, name: "New" });

      await request(app)
        .post("/employees")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New",
          matricula: "123",
          companyId: 1,
          dataAdmissao: new Date().toISOString(),
        })
        .expect(201);
    });

    it("should handle service errors (validation/prisma)", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.employee.create.mockRejectedValue(new Error("DB Error"));

      // Expect 500 because the controller passes error to global handler
      // and we haven't implemented specific validation middleware yet.
      await request(app)
        .post("/employees")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "" })
        .expect(500);
    });
  });
});
