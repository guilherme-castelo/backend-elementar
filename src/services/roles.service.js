const prisma = require("../utils/prisma");

class RolesService {
  async getAll() {
    return prisma.role.findMany({
      include: { permissions: true },
    });
  }

  async getById(id) {
    return prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: { permissions: true },
    });
  }

  async create(data) {
    const { permissionIds, ...rest } = data;
    const payload = { ...rest };

    if (permissionIds && Array.isArray(permissionIds)) {
      payload.permissions = {
        connect: permissionIds.map((id) => ({ id })),
      };
    }

    return prisma.role.create({
      data: payload,
      include: { permissions: true },
    });
  }

  async update(id, data) {
    // Strip 'permissions' to avoid partial object issues if frontend sends it back
    const { permissionIds, permissions, ...rest } = data;
    const payload = { ...rest };

    if (permissionIds && Array.isArray(permissionIds)) {
      payload.permissions = {
        set: permissionIds.map((id) => ({ id: parseInt(id) })), // Replaces all existing relations
      };
    }

    return prisma.role.update({
      where: { id: parseInt(id) },
      data: payload,
      include: { permissions: true },
    });
  }

  async delete(id) {
    return prisma.role.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new RolesService();
