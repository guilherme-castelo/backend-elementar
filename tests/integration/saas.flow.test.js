const request = require("supertest");
const app = require("../../app");
const jwt = require("jsonwebtoken");
const { mockReset } = require("jest-mock-extended");
jest.mock("../../utils/prisma"); // Manual Mock
const prismaMock = require("../../utils/prisma");

describe("SaaS Integration Flow", () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  const generateToken = (id, companyId, role) =>
    jwt.sign({ id, companyId, role }, "test-secret");

  describe("Feature: Usage Limits", () => {
    it("should block user creation if plan limit exceeded", async () => {
      // Mock Company Plan
      const companyId = 1;
      prismaMock.user.findUnique.mockResolvedValue({
        id: 1,
        companyId,
        isActive: true,
        role: { permissions: [{ slug: "user:create" }] },
      });

      prismaMock.company.findUnique.mockResolvedValue({
        id: companyId,
        plan: { maxUsers: 2 },
      });
      prismaMock.user.count.mockResolvedValue(2); // Limit reached

      const token = generateToken(1, companyId, "Admin");

      await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${token}`)
        .send({ name: "New" })
        .expect(403); // Forbidden by UsageGuard
    });
  });

  describe("Feature: Invitations", () => {
    it("should send invitation", async () => {
      // 1. Auth Lookup (Admin)
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        companyId: 1,
        isActive: true,
        role: { permissions: [{ slug: "user:create" }] },
      });

      // 2. Company Lookup (Usage Guard logic)
      prismaMock.company.findUnique.mockResolvedValueOnce({
        id: 1,
        plan: { maxUsers: 100 },
      });

      // 3. Usage Count (Usage Guard logic)
      prismaMock.user.count.mockResolvedValueOnce(1); // Below limit

      // 4. Invitation Service: Check if user exists (Should be null)
      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      prismaMock.invitation.create.mockResolvedValue({ token: "abc" });

      const token = generateToken(1, 1, "Admin");
      const res = await request(app)
        .post("/invitations")
        .set("Authorization", `Bearer ${token}`)
        .send({ email: "invite@test.com", roleId: 2 })
        .expect(201);

      expect(res.body.token).toBe("abc");
    });
  });
});
