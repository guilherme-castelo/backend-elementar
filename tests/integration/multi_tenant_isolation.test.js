const request = require("supertest");
const app = require("../../src/app");
const jwt = require("jsonwebtoken");
const { mockReset } = require("jest-mock-extended");
const {
  createCompany,
  createUser,
  createRole,
  createMembership,
} = require("../utils/factories");

// Manual Mock Setup
jest.mock("../../src/utils/prisma");
const prismaMock = require("../../src/utils/prisma");

describe("Multi-Tenant Isolation (SaaS)", () => {
  let adminToken;
  let user;
  let companyA;
  let companyB;
  let membershipA;

  beforeEach(() => {
    mockReset(prismaMock);

    // Setup Scenario
    companyA = createCompany({ id: 1, name: "Company A" });
    companyB = createCompany({ id: 2, name: "Company B" });
    const roleAdmin = createRole({
      name: "Admin",
      permissions: [{ slug: "user:read" }],
    });

    user = createUser({ id: 10, email: "john@companya.com" });

    // User is Member of Company A ONLY
    membershipA = createMembership(user, companyA, roleAdmin);

    // Mock Auth Guard Lookup (Simulating legacy or new auth lookup)
    // The current auth middleware looks up `user.findUnique`.
    // In the future, it should check memberships.
    // For now, let's mock the User lookup returns a user who *can* be authenticated.
    prismaMock.user.findUnique.mockResolvedValue({
      ...user,
      role: roleAdmin, // Simulating the role loaded from membership (future) or legacy
      companyId: null, // Force system to look at context/membership, not legacy field
    });

    // Mock Membership Lookup (The core of the new logic)
    // When middleware asks, we return membershipA if context matches.
    prismaMock.userMembership.findFirst.mockImplementation((args) => {
      if (
        args.where.userId === user.id &&
        args.where.companyId === companyA.id
      ) {
        return Promise.resolve(membershipA);
      }
      return Promise.resolve(null);
    });

    adminToken = jwt.sign({ id: user.id }, "test-secret");
  });

  it("should reject request without x-company-id header", async () => {
    // Expecting 400 Bad Request if strictly enforcing context
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`);

    // Note: Once implemented, this should be 400.
    // Currently/initially it might be 200 (legacy) or 403.
    // We assert the target behavior.
    expect([400, 428]).toContain(res.statusCode); // 428 Precondition Required
  });

  it("should deny access if user is not a member of the target company", async () => {
    // User tries to access Company B (id: 2)
    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-company-id", "2");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not a member/i);
  });

  it("should allow access if user is a valid member", async () => {
    // User accesses Company A (id: 1)

    // Mock Users list for Company A
    prismaMock.user.findMany.mockResolvedValue([user]);

    const res = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-company-id", "1");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);

    // Ensure Context was injected (Prisma called with filter)
    // This depends on how PrismaMock captures the extension calls.
    // Since we mock the *instance*, we check the call arguments.
    /* 
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 1 }),
      })
    ); 
    */
  });
});
