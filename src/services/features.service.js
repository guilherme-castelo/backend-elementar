const prisma = require("../utils/prisma");

class FeaturesService {
  async getAll() {
    return prisma.feature.findMany({
      include: { permissions: true },
    });
  }

  async getById(id) {
    return prisma.feature.findUnique({
      where: { id: parseInt(id) },
      include: { permissions: true },
    });
  }

  async create(data) {
    return prisma.feature.create({ data });
  }

  async update(id, data) {
    return prisma.feature.update({
      where: { id: parseInt(id) },
      data,
    });
  }

  async delete(id) {
    return prisma.feature.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new FeaturesService();
