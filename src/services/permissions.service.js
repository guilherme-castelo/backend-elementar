const prisma = require("../utils/prisma");

class PermissionsService {
  async getAll() {
    return prisma.permission.findMany({
      include: { feature: true },
    });
  }

  async getById(id) {
    return prisma.permission.findUnique({
      where: { id: parseInt(id) },
      include: { feature: true },
    });
  }

  async create(data) {
    const { featureId, ...rest } = data;
    const payload = { ...rest };
    if (featureId) payload.featureId = parseInt(featureId);

    return prisma.permission.create({ data: payload });
  }

  async update(id, data) {
    const { featureId, ...rest } = data;
    const payload = { ...rest };
    if (featureId) payload.featureId = parseInt(featureId);

    return prisma.permission.update({
      where: { id: parseInt(id) },
      data: payload,
    });
  }

  async delete(id) {
    return prisma.permission.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new PermissionsService();
