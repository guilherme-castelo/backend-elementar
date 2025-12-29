const prisma = require("../utils/prisma");
const mealsService = require("./meals.service");

class EmployeesService {
  async getAll(filters) {
    const where = {};
    if (filters.companyId) {
      where.companyId = parseInt(filters.companyId);
    }
    return prisma.employee.findMany({ where });
  }

  async getById(id) {
    return prisma.employee.findUnique({ where: { id: parseInt(id) } });
  }

  async create(data) {
    // Unique Check
    // If cpf is provided, check it. valid logic: (cpf matches OR matricula matches)
    const checks = [{ matricula: data.matricula }];
    if (data.cpf) checks.push({ cpf: data.cpf });

    const existing = await prisma.employee.findFirst({
      where: {
        OR: checks,
      },
    });

    if (existing) {
      if (existing.matricula === data.matricula)
        throw new Error(
          `Employee with matricula ${data.matricula} already exists.`
        );
      if (data.cpf && existing.cpf === data.cpf)
        throw new Error(`Employee with CPF ${data.cpf} already exists.`);
    }

    // Ensure dates are Dates
    const payload = {
      ...data,
      companyId: parseInt(data.companyId),
      dataAdmissao: new Date(data.dataAdmissao),
      dataDemissao: data.dataDemissao ? new Date(data.dataDemissao) : null,
    };
    const created = await prisma.employee.create({ data: payload });
    
    // Auto-link pending meals
    await mealsService.linkEmployeeMeals(created);

    return created;
  }

  async update(id, data) {
    const payload = { ...data };
    if (payload.companyId) payload.companyId = parseInt(payload.companyId);
    if (payload.dataAdmissao)
      payload.dataAdmissao = new Date(payload.dataAdmissao);
    if (payload.dataDemissao)
      payload.dataDemissao = new Date(payload.dataDemissao);

    const updated = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: payload
    });

    // Auto-link pending meals (in case matricula changed or was fixed)
    await mealsService.linkEmployeeMeals(updated);

    return updated;
  }

  async delete(id) {
    return prisma.employee.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new EmployeesService();
