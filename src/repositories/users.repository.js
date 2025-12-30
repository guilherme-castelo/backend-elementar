const prisma = require('../utils/prisma');

class UsersRepository {
  async getAll() {
    return prisma.user.findMany();
  }

  async getById(id) {
    return prisma.user.findUnique({ where: { id: parseInt(id) } });
  }

  async create(data) {
    return prisma.user.create({ data });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new UsersRepository();
