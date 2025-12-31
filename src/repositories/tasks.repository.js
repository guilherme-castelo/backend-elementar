const prisma = require("../utils/prisma");

class TasksRepository {
  async getAll(where, orderBy = { updatedAt: "desc" }) {
    return prisma.task.findMany({
      where,
      include: {
        collaborators: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          include: { author: { select: { id: true, name: true } } },
        },
        owner: {
          select: { id: true, name: true },
        },
      },
      orderBy,
    });
  }

  async getById(id) {
    return prisma.task.findUnique({
      where: { id },
      include: {
        collaborators: true,
        comments: {
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async create(data) {
    return prisma.task.create({
      data,
      include: { collaborators: true },
    });
  }

  async update(id, data) {
    return prisma.task.update({
      where: { id },
      data,
      include: { collaborators: true, comments: true },
    });
  }

  async delete(id) {
    return prisma.task.delete({ where: { id } });
  }

  // Comment sub-resources
  async getComments(taskId) {
    return prisma.taskComment.findMany({
      where: { taskId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async addComment(data) {
    return prisma.taskComment.create({
      data,
      include: { author: { select: { id: true, name: true } } },
    });
  }
}

module.exports = new TasksRepository();
