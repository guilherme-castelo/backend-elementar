const prisma = require("../utils/prisma");

class RolesService {
  async getAll() {
    return prisma.role.findMany({
      include: { permissions: true, companies: true },
    });
  }

  async getById(id) {
    return prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: { permissions: true, companies: true },
    });
  }

  async create(data) {
    const { permissionIds, companyIds, permissions, ...rest } = data;
    const payload = { ...rest };
    if (permissions && Array.isArray(permissions)) {
      // If slugs are passed, we need to map them to connect by slug
      payload.permissions = {
        connect: permissions.map((slug) => ({ slug })),
      };
    } else if (permissionIds && Array.isArray(permissionIds)) {
      payload.permissions = {
        connect: permissionIds.map((id) => ({ id })),
      };
    }

    if (companyIds && Array.isArray(companyIds)) {
      payload.companies = {
        connect: companyIds.map((id) => ({ id: parseInt(id) })),
      };
    }

    return prisma.role.create({
      data: payload,
      include: { permissions: true, companies: true },
    });
  }

  async update(id, data) {
    const { permissionIds, companyIds, permissions, ...rest } = data;
    const payload = { ...rest };
    // Strip 'permissions' and 'companies' to avoid partial object issues if frontend sends it back
    if (permissions && Array.isArray(permissions)) {
      payload.permissions = {
        set: permissions.map((slug) => ({ slug })),
      };
    } else if (permissionIds && Array.isArray(permissionIds)) {
      payload.permissions = {
        set: permissionIds.map((id) => ({ id: parseInt(id) })), // Replaces all existing relations
      };
    }

    if (companyIds && Array.isArray(companyIds)) {
      payload.companies = {
        set: companyIds.map((id) => ({ id: parseInt(id) })),
      };
    }

    return prisma.role.update({
      where: { id: parseInt(id) },
      data: payload,
      include: { permissions: true, companies: true },
    });
  }

  async delete(id) {
    return prisma.role.delete({ where: { id: parseInt(id) } });
  }

  async validateScope(roleId, companyId) {
    const role = await prisma.role.findUnique({
      where: { id: parseInt(roleId) },
      include: { companies: true },
    });

    if (!role) return false;

    // If global (no companies linked), allow it?
    // Or strictly enforce? User requested "control", implying restriction.
    // Let's assume: If role has companies, it's restricted. If empty, it's global.
    if (!role.companies || role.companies.length === 0) return true;

    return role.companies.some((c) => c.id === parseInt(companyId));
  }
}

module.exports = new RolesService();
