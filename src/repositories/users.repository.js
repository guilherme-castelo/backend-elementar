const prisma = require('../utils/prisma');

class UsersRepository {
  async getAll() {
    return prisma.user.findMany({
      include: { role: { include: { permissions: true } } }
    });
  }

  async getById(id) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: { include: { permissions: true } } }
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: { include: { permissions: true } } }
    });
  }

  async create(data) {
    return prisma.user.create({
      data,
      include: { role: { include: { permissions: true } } }
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data,
      include: { role: { include: { permissions: true } } }
    });
  }

  async delete(id) {
    return prisma.user.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new UsersRepository();

