const prisma = require('../utils/prisma');

class CompanyService {
  async getAll() {
    return prisma.company.findMany();
  }

  async getById(id) {
    return prisma.company.findUnique({ where: { id: parseInt(id) } });
  }

  async create(data) {
    return prisma.company.create({ data });
  }

  async update(id, data) {
    return prisma.company.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id) {
    return prisma.company.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new CompanyService();
