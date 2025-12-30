const request = require("supertest");
const jwt = require("jsonwebtoken");
const prismaMock = require("../../src/utils/prisma");
const app = require("../../src/app");

jest.mock("../../src/utils/prisma");

describe("Integration: Tasks Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const token = jwt.sign({ id: 1 }, "test-secret");
  const adminUser = {
    id: 1,
    companyId: 1,
    isActive: true,
    role: { permissions: [{ slug: "task:read" }, { slug: "task:create" }, { slug: "task:update" }, { slug: "task:delete" }] },
  };

  describe("GET /tasks", () => {
    it("should list tasks", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      // Mock needs collaborators array for map()
      prismaMock.task.findMany.mockResolvedValue([
        { id: 1, title: "Test Task", collaborators: [] }
      ]);

      const res = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe("POST /tasks", () => {
    it("should create a task", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      // Mock needs collaborators array for map()
      prismaMock.task.create.mockResolvedValue({
        id: 2,
        title: "New Task",
        collaborators: []
      });

      const res = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "New Task", assigneeId: 2 })
        .expect(201);

      expect(res.body.title).toEqual("New Task");
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("should delete task", async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser);
      prismaMock.task.findUnique.mockResolvedValue({ id: 1, companyId: 1 }); // Auth check inside ownership?
      prismaMock.task.delete.mockResolvedValue({ id: 1 });

      await request(app)
        .delete("/tasks/1")
        .set("Authorization", `Bearer ${token}`)
        .expect(204);
    });
  });
});
