const prisma = require('../utils/prisma');

class EmployeesRepository {
  async getAll(where = {}) {
    return prisma.employee.findMany({ where });
  }

  async getById(id) {
    return prisma.employee.findUnique({ where: { id: parseInt(id) } });
  }

  async findDuplicate(matricula, cpf) {
    const checks = [{ matricula }];
    // Only check CPF if provided and not empty/null
    if (cpf) checks.push({ cpf });

    return prisma.employee.findFirst({
      where: { OR: checks },
    });
  }

  async create(data) {
    return prisma.employee.create({ data });
  }

  async update(id, data, tx = prisma) {
    // Allows passing a transaction client
    return tx.employee.update({
      where: { id: parseInt(id) },
      data
    });
  }

  async delete(id, tx = prisma) {
    return tx.employee.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new EmployeesRepository();
