const { mockReset } = require("jest-mock-extended");
jest.mock("../../src/utils/prisma");

const prisma = require("../../src/utils/prisma");
const tasksService = require("../../src/services/tasks.service");

describe("TasksService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("getAll", () => {
    it("should return tasks for user", async () => {
      // Mock needs to return array with collaborators for the map function in service
      const mockTasks = [
        {
          id: 1,
          title: "Task",
          collaborators: [{ id: 2 }],
        },
      ];
      prisma.task.findMany.mockResolvedValue(mockTasks);

      // Pass user object { id: 1 } as second arg
      const result = await tasksService.getAll({ userId: 1 }, { id: 1 });

      expect(prisma.task.findMany).toHaveBeenCalled();
      expect(result[0].collaboratorUserIds).toEqual([2]);
    });
  });

  describe("create", () => {
    it("should create task", async () => {
      const data = { title: "T", description: "D", companyId: 1, creatorId: 1 };

      // Mock create return MUST include collaborators array
      prisma.task.create.mockResolvedValue({
        id: 1,
        ...data,
        collaborators: [],
      });

      await tasksService.create(data);
      expect(prisma.task.create).toHaveBeenCalled();
    });
  });

  describe("Other Methods", () => {
    it("getById should return task", async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 1, collaborators: [] });
      await tasksService.getById(1);
      expect(prisma.task.findUnique).toHaveBeenCalled();
    });

    it("update should update task", async () => {
      prisma.task.update.mockResolvedValue({ id: 1, collaborators: [] });
      await tasksService.update(1, { title: "New" });
      expect(prisma.task.update).toHaveBeenCalled();
    });

    it("delete should delete task", async () => {
      await tasksService.delete(1);
      expect(prisma.task.delete).toHaveBeenCalled();
    });
  });
});
