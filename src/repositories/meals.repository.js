const prisma = require("../utils/prisma");

class MealsRepository {
  async getAll(where) {
    return prisma.meal.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            setor: true,
            matricula: true,
            companyId: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async create(data) {
    return prisma.meal.create({ data });
  }

  async delete(id) {
    return prisma.meal.delete({ where: { id: parseInt(id) } });
  }

  async count(where) {
    return prisma.meal.count({ where });
  }

  async countByEmployeeId(employeeId) {
    return prisma.meal.count({
      where: { employeeId: parseInt(employeeId) },
    });
  }

  async findMany(args) {
    return prisma.meal.findMany(args);
  }

  async updateMany(where, data) {
    return prisma.meal.updateMany({ where, data });
  }

  async deleteMany(where) {
    return prisma.meal.deleteMany({ where });
  }

  async findByEmployeeAndDate(employeeId, startOfDay, endOfDay) {
    return prisma.meal.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  async findCollisionsInRange(start, end, companyId) {
    return prisma.meal.findMany({
      where: {
        companyId: parseInt(companyId),
        date: {
          gte: start,
          lte: end,
        },
      },
    });
  }
}

module.exports = new MealsRepository();

