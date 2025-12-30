const prisma = require('../utils/prisma');

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

  async findMany(args) {
    return prisma.meal.findMany(args);
  }

  async updateMany(where, data) {
    return prisma.meal.updateMany({ where, data });
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

  // Single date collision check (legacy support if needed)
  async findCollisions(date, companyId) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.meal.findMany({
      where: {
        companyId: parseInt(companyId),
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });
  }

  // Range collision check
  async findCollisionsInRange(start, end, companyId) {
    return prisma.meal.findMany({
      where: {
        companyId: parseInt(companyId),
        date: {
          gte: start,
          lte: end
        }
      }
    });
  }
}

module.exports = new MealsRepository();
