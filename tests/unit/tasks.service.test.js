const tasksService = require("../../src/services/tasks.service");
const tasksRepository = require("../../src/repositories/tasks.repository");
const { NotFoundError } = require("../../src/errors/AppError");

jest.mock("../../src/repositories/tasks.repository");

describe("TasksService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should apply visibility filters correctly", async () => {
      tasksRepository.getAll.mockResolvedValue([]);
      const query = {};
      const user = { id: 1 };

      await tasksService.getAll(query, user);

      expect(tasksRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: expect.arrayContaining([{ ownerUserId: 1 }]),
            }),
          ]),
        })
      );
    });

    it("should apply search filters", async () => {
      tasksRepository.getAll.mockResolvedValue([]);
      const query = { title: "Test", status: "todo", ownerUserId: 2 };
      const user = { id: 1 };

      await tasksService.getAll(query, user);

      expect(tasksRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              title: { contains: "Test" },
              status: "todo",
              ownerUserId: 2,
            }),
          ]),
        })
      );
    });
  });

  describe("create", () => {
    it("should connect collaborators", async () => {
      const data = { title: "T", collaboratorUserIds: [2] };
      tasksRepository.create.mockResolvedValue({
        id: 1,
        collaborators: [{ id: 2 }],
      });

      await tasksService.create(data);

      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collaborators: { connect: [{ id: 2 }] },
        })
      );
    });

    it("should default status to todo", async () => {
      const data = { title: "T" };
      tasksRepository.create.mockResolvedValue({ id: 1, collaborators: [] });
      await tasksService.create(data);
      expect(tasksRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: "todo" })
      );
    });
  });

  describe("update", () => {
    it("should update collaborators set", async () => {
      const data = { collaboratorUserIds: [3] };
      tasksRepository.update.mockResolvedValue({
        id: 1,
        collaborators: [{ id: 3 }],
      });

      await tasksService.update(1, data);

      expect(tasksRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          collaborators: { set: [{ id: 3 }] },
        })
      );
    });
  });

  describe("getById", () => {
    it("should return null if repo returns null", async () => {
      tasksRepository.getById.mockResolvedValue(null);
      await expect(tasksService.getById(1)).rejects.toThrow(NotFoundError);
    });

    it("should return task ", async () => {
      tasksRepository.getById.mockResolvedValue({ id: 1, collaborators: [] });
      const res = await tasksService.getById(1);
      expect(res.id).toBe(1);
    });
  });

  describe("delete", () => {
    it("should delete", async () => {
      await tasksService.delete(1);
      expect(tasksRepository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe("comments", () => {
    it("should get comments", async () => {
      await tasksService.getComments(1);
      expect(tasksRepository.getComments).toHaveBeenCalledWith(1);
    });

    it("should add comment", async () => {
      await tasksService.addComment(1, { content: "C", authorId: 2 });
      expect(tasksRepository.addComment).toHaveBeenCalled();
    });
  });
});
