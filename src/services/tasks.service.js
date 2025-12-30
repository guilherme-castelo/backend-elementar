const prisma = require("../utils/prisma");

class TasksService {
  async getAll(query, user) {
    const { _sort, _order, title, status, ownerUserId } = query;
    // Basic filtering implementation matching JSON-Server capability mostly
    const where = {};
    if (title) where.title = { contains: title };
    if (status) where.status = status;
    if (ownerUserId) where.ownerUserId = parseInt(ownerUserId);

    // Access Control: Public OR Owned OR Collaborator
    // Since backend logic should enforce visibility.
    // If Admin (user.roles has admin), maybe see all?
    // User request: "Respect Permissions" -> "Public Tasks" (isPublic=true) OR (owner=me) OR (collaborators has me).

    // If specific filter is passed, we check if user is allowed to see it?
    // Let's implement global visibility filter + query filters.

    const visibilityFilter = {
      OR: [
        { isPublic: true },
        { ownerUserId: user.id },
        { collaborators: { some: { id: user.id } } },
      ],
    };

    const tasks = await prisma.task.findMany({
      where: {
        AND: [where, visibilityFilter],
      },
      include: {
        collaborators: {
          select: { id: true, name: true, email: true }, // Return basic user info
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
        },
        owner: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return tasks.map((task) => ({
      ...task,
      collaboratorUserIds: task.collaborators.map((c) => c.id),
    }));
  }

  async getById(id) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        collaborators: true,
        comments: {
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!task) return null;

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

    const newTask = await prisma.task.create({
      data: payload,
      include: { collaborators: true },
    });

    return {
      ...newTask,
      collaboratorUserIds: newTask.collaborators.map((c) => c.id),
    };
  }

  async update(id, data) {
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
    } = data; // Comments handled separately usually

    const payload = { ...rest };

    // Update collaborators if provided
    if (collaboratorUserIds && Array.isArray(collaboratorUserIds)) {
      payload.collaborators = {
        set: collaboratorUserIds.map((uid) => ({ id: uid })),
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: payload,
      include: { collaborators: true, comments: true },
    });

    return {
      ...updatedTask,
      collaboratorUserIds: updatedTask.collaborators.map((c) => c.id),
    };
  }

  async delete(id) {
    return prisma.task.delete({ where: { id } });
  }

  async getComments(taskId) {
    return prisma.taskComment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async addComment(taskId, data) {
    // data: { authorId, content, ... }
    return prisma.taskComment.create({
      data: {
        content: data.content,
        taskId: taskId,
        authorId: data.authorId,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}

module.exports = new TasksService();
