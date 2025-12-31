const request = require("supertest");
const jwt = require("jsonwebtoken");
const prismaMock = require("../../src/utils/prisma");
const app = require("../../src/app");
const bcrypt = require("bcryptjs");
const config = require("../../src/config/config");

jest.mock("../../src/utils/prisma", () => ({
  user: { findUnique: jest.fn(), create: jest.fn() },
  role: { findUnique: jest.fn() },
  userMembership: { findMany: jest.fn() },
}));

// Explicit mocks for deps
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe("Integration: Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 1,
    email: "test@example.com",
    password: "hashedpassword",
    name: "Test User",
    roleId: 2,
    role: { name: "USER", permissions: [{ slug: "test:read" }] },
    isActive: true,
    companyId: 1,
  };

  describe("POST /auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      // Mock findUnique to return user
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.userMembership.findMany.mockResolvedValue([]);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue("mock-token");

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password",
      });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toHaveProperty("email", mockUser.email);
    });

    it("should return 401 for invalid email", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const res = await request(app).post("/auth/login").send({
        email: "wrong@example.com",
        password: "password123",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    it("should return 401 for invalid password", async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

      const res = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });
  });

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null); // No existing user
      prismaMock.role.findUnique.mockResolvedValue({ id: 2, name: "User" }); // Default role
      prismaMock.userMembership.findMany.mockResolvedValue([]); // Mock memberships
      prismaMock.user.create.mockResolvedValue({
        id: 2,
        email: "new@example.com",
        name: "New User",
        role: { name: "User", permissions: [] },
        companyId: 1, // Fix: needed for legacy token payload
      });

      const res = await request(app).post("/auth/register").send({
        email: "new@example.com",
        password: "password123",
        name: "New User",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty("token");
    });

    it("should fail if email already exists", async () => {
      // Use Once to avoid affecting other tests if they run in parallel (though jest runs unittests sequentially by default in same file)
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 99,
        email: "test@example.com",
      });

      const res = await request(app).post("/auth/register").send({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/exist/i);
    });
  });

  describe("GET /auth/me", () => {
    it("should return current user data if authorized", async () => {
      // Spy on verify to return expected payload, bypassing secret issues
      // mocking verify to return a decoded object
      const verifySpy = jest.spyOn(jwt, "verify").mockReturnValue({ id: 1 });
      const token = "mock-token-xyz"; // Content immaterial due to mock

      const fullUser = {
        ...mockUser,
        role: {
          name: "USER",
          permissions: [],
        },
      };

      prismaMock.user.findUnique.mockResolvedValue(fullUser);

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${token}`);

      if (res.statusCode !== 200) {
        throw new Error(
          `Expected 200, got ${res.statusCode}. Body: ${JSON.stringify(
            res.body
          )}`
        );
      }
      expect(res.statusCode).toEqual(200);
      expect(res.body.user.email).toEqual(mockUser.email);

      verifySpy.mockRestore();
    });

    it("should return 401 if no token provided", async () => {
      const res = await request(app).get("/auth/me");
      expect(res.statusCode).toEqual(401);
    });
  });
});
