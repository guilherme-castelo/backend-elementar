const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');

class UsersService {
  async getAll() {
    return prisma.user.findMany();
  }

  async getById(id) {
    return prisma.user.findUnique({ where: { id: parseInt(id) } });
  }

  async create(data) {
    const payload = { ...data };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.companyId) {
      payload.companyId = parseInt(payload.companyId);
    }
    // Preferences/Address might need stringifying if passed as objects
    if (typeof payload.preferences === 'object') payload.preferences = JSON.stringify(payload.preferences);
    if (typeof payload.address === 'object') payload.address = JSON.stringify(payload.address);
    if (Array.isArray(payload.roles)) payload.roles = payload.roles.join(','); // or keep as string

    return prisma.user.create({ data: payload });
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    if (payload.companyId) payload.companyId = parseInt(payload.companyId);

    if (typeof payload.preferences === 'object') payload.preferences = JSON.stringify(payload.preferences);
    if (typeof payload.address === 'object') payload.address = JSON.stringify(payload.address);
    if (Array.isArray(payload.roles)) payload.roles = payload.roles.join(',');

    // Remove immutable or sensitive if not intended (like email if unique constraint)
    // But allowing update for now.

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: payload
    });

    // Remove password from return
    const { password, ...rest } = user;
    return rest;
  }

  async delete(id) {
    return prisma.user.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new UsersService();
