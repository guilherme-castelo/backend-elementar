const { mockReset } = require("jest-mock-extended");
const tasksService = require("../../src/services/tasks.service");
const tasksRepository = require("../../src/repositories/tasks.repository");

jest.mock("../../src/repositories/tasks.repository");

describe("TasksService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should apply visibility filters correctly", async () => {
      tasksRepository.getAll.mockResolvedValue([]);

      const user = { id: 10 };
      const query = { status: "todo" };

      await tasksService.getAll(query, user);

      expect(tasksRepository.getAll).toHaveBeenCalledWith(expect.objectContaining({
        AND: [
          expect.objectContaining({ status: "todo" }),
          expect.objectContaining({
            OR: [
              { isPublic: true },
              { ownerUserId: 10 },
              { collaborators: { some: { id: 10 } } }
            ]
          })
        ]
      }));
    });
  });

  describe("create", () => {
    it("should connect collaborators", async () => {
      const data = { title: "Test", collaboratorUserIds: [2, 3] };
      tasksRepository.create.mockResolvedValue({ id: 1, ...data, collaborators: [{ id: 2 }, { id: 3 }] });

      const result = await tasksService.create(data);

      expect(tasksRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        collaborators: { connect: [{ id: 2 }, { id: 3 }] }
      }));
      expect(result.collaboratorUserIds).toEqual([2, 3]);
    });
  });

  describe("update", () => {
    it("should update collaborators set", async () => {
      tasksRepository.update.mockResolvedValue({ id: 1, collaborators: [] });

      await tasksService.update(1, { collaboratorUserIds: [5] });

      expect(tasksRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        collaborators: { set: [{ id: 5 }] }
      }));
    });
  });

  describe("getById", () => {
    it("should return null if repo returns null", async () => {
      tasksRepository.getById.mockResolvedValue(null);
      await expect(tasksService.getById(99)).rejects.toThrow("Task not found");
    });
  });
});

