const request = require("supertest");
const jwt = require("jsonwebtoken");
const prismaMock = require("../../src/utils/prisma");
const app = require("../../src/app");

jest.mock("../../src/utils/prisma");

describe("Integration: Integrations Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = jwt.sign({ id: 1 }, "test-secret");

  const adminUser = {
    id: 1,
    isActive: true,
    role: {
      permissions: [{ slug: "integration:dominio" }],
    },
    companyId: 1,
  };

  const userWithoutPermission = {
    id: 2,
    isActive: true,
    role: {
      permissions: [],
    },
    companyId: 1,
  };
  const tokenNoPerms = jwt.sign({ id: 2 }, "test-secret");

  describe("GET /integrations/dominio/config", () => {
    it("should return config for authorized user", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.company.findUnique.mockResolvedValue({
        dominioRubric: "111",
        dominioCode: "222",
      });

      const res = await request(app)
        .get("/integrations/dominio/config")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body.dominioRubric).toBe("111");
    });

    it("should deny access if missing permission", async () => {
      prismaMock.user.findUnique.mockResolvedValue(userWithoutPermission);

      await request(app)
        .get("/integrations/dominio/config")
        .set("Authorization", `Bearer ${tokenNoPerms}`)
        .expect(403);
    });
  });

  describe("PUT /integrations/dominio/config", () => {
    it("should update config successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.company.update.mockResolvedValue({ dominioRubric: "999" });

      const res = await request(app)
        .put("/integrations/dominio/config")
        .set("Authorization", `Bearer ${token}`)
        .send({ dominioRubric: "999", dominioCode: "888" })
        .expect(200);

      expect(prismaMock.company.update).toHaveBeenCalled();
    });

    it("should return 400 for validation error", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);

      const res = await request(app)
        .put("/integrations/dominio/config")
        .set("Authorization", `Bearer ${token}`)
        .send({ dominioRubric: "1234567890" }) // Too long
        .expect(400);

      expect(res.body.message).toContain("máximo 9");
    });
  });

  describe("GET /integrations/dominio/export", () => {
    it("should return 400 if config missing", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.company.findUnique.mockResolvedValue({ dominioCode: "" }); // Missing code

      const res = await request(app)
        .get("/integrations/dominio/export")
        .query({ month: 1, year: 2026 })
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(res.body.message).toContain("não configurado");
    });

    it("should return 404 if no records found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.company.findUnique.mockResolvedValue({ dominioCode: "123" });
      prismaMock.meal.findMany.mockResolvedValue([]);

      await request(app)
        .get("/integrations/dominio/export")
        .query({ month: 1, year: 2026 })
        .set("Authorization", `Bearer ${token}`)
        .expect(404);
    });

    it("should return text file content if successful", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.company.findUnique.mockResolvedValue({
        dominioCode: "123",
        dominioRubric: "297",
      });
      prismaMock.meal.findMany.mockResolvedValue([
        { employee: { matricula: "1" } },
      ]);

      const res = await request(app)
        .get("/integrations/dominio/export")
        .query({ month: 1, year: 2026 })
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.text).toBeDefined();
      expect(res.headers["content-type"]).toContain("text/plain");
      expect(res.headers["content-disposition"]).toContain("attachment");
    });
  });
});
