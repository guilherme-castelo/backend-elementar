const tasksRepository = require("../repositories/tasks.repository");
const { NotFoundError } = require("../errors/AppError");

class TasksService {
  async getAll(query, user) {
    const { _sort, _order, title, status, ownerUserId } = query;
    const where = {};
    if (title) where.title = { contains: title };
    if (status) where.status = status;
    if (ownerUserId) where.ownerUserId = parseInt(ownerUserId);

    // Access Control Logic
    const visibilityFilter = {
      OR: [
        { isPublic: true },
        { ownerUserId: user.id },
        { collaborators: { some: { id: user.id } } },
      ],
    };

    const finalWhere = {
      AND: [where, visibilityFilter],
    };

    // Sorting not fully implemented in Repo generic? 
    // Repo uses default orderBy. We can pass it if needed.
    // For now keeping default.

    // Using generic getAll
    const tasks = await tasksRepository.getAll(finalWhere);

    return tasks.map((task) => ({
      ...task,
      collaboratorUserIds: task.collaborators.map((c) => c.id),
    }));
  }

  async getById(id) {
    const task = await tasksRepository.getById(id);

    if (!task) throw new NotFoundError("Task not found");

    return {
      ...task,
      collaboratorUserIds: task.collaborators.map((c) => c.id),
    };
  }

  async create(data) {
    const { collaboratorUserIds, comments, ...rest } = data;

    const payload = { ...rest };

    // Connect collaborators
    if (collaboratorUserIds && Array.isArray(collaboratorUserIds)) {
      payload.collaborators = {
        connect: collaboratorUserIds.map((uid) => ({ id: uid })),
      };
    }

    if (!payload.status) payload.status = "todo";

    const newTask = await tasksRepository.create(payload);

    return {
      ...newTask,
      collaboratorUserIds: newTask.collaborators.map((c) => c.id),
    };
  }

  async update(id, data) {
    // Check existence
    // We could do this.getById(id) but standardizing.
    // Repo update throws if not found? Prisma throws P2025. AppError middleware catches it.

    const {
      collaboratorUserIds,
      comments,
      id: _id,
      createdAt,
      updatedAt,
      owner,
      collaborators,
      ownerUserId,
      ...rest
    } = data;

    const payload = { ...rest };

    if (collaboratorUserIds && Array.isArray(collaboratorUserIds)) {
      payload.collaborators = {
        set: collaboratorUserIds.map((uid) => ({ id: uid })),
      };
    }

    const updatedTask = await tasksRepository.update(id, payload);

    return {
      ...updatedTask,
      collaboratorUserIds: updatedTask.collaborators.map((c) => c.id),
    };
  }

  async delete(id) {
    // Prisma throws if not found or we silent?
    // Let's try delete. If P2025 comes, middleware handles 404.
    return tasksRepository.delete(id);
  }

  async getComments(taskId) {
    return tasksRepository.getComments(taskId);
  }

  async addComment(taskId, data) {
    return tasksRepository.addComment({
      content: data.content,
      taskId: taskId,
      authorId: data.authorId,
    });
  }
}

module.exports = new TasksService();

