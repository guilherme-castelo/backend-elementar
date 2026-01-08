const employeesRepository = require("../repositories/employees.repository");
// We still need raw prisma for transaction orchestration unfortunately, or we abstract transactions.
// Ideally, Service handles orchestration. Repo handles Atomic DB ops.
// We'll import prisma just for $transaction
const prisma = require("../utils/prisma");
const mealsService = require("./meals.service");
const {
  ConflictError,
  NotFoundError,
  ValidationError,
} = require("../errors/AppError");

class EmployeesService {
  async getAll(filters) {
    const where = {};
    if (filters.companyId) {
      where.companyId = parseInt(filters.companyId);
    }
    return employeesRepository.getAll(where);
  }

  async getById(id) {
    const emp = await employeesRepository.getById(id);
    if (!emp) throw new NotFoundError("Employee not found");
    return emp;
  }

  async create(data) {
    // Unique Check
    const existing = await employeesRepository.findDuplicate(
      data.matricula,
      data.cpf
    );

    if (existing) {
      if (existing.matricula === data.matricula)
        throw new ConflictError(
          `Employee with matricula ${data.matricula} already exists.`
        );
      if (data.cpf && existing.cpf === data.cpf)
        throw new ConflictError(
          `Employee with CPF ${data.cpf} already exists.`
        );
    }

    // Ensure dates are Dates
    const companyId = parseInt(data.companyId);
    if (isNaN(companyId)) {
      throw new ValidationError("Company ID is required.");
    }

    const payload = {
      ...data,
      companyId,
      dataAdmissao: data.dataAdmissao
        ? new Date(data.dataAdmissao)
        : new Date(),
      dataDemissao: data.dataDemissao ? new Date(data.dataDemissao) : null,
      cpf: data.cpf ? data.cpf : null,
    };

    delete payload.mealsAction;

    // We can move meal linking to an event or keep it here. Keeping it here for now.
    const created = await employeesRepository.create(payload);

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

    // Remove non-schema fields
    delete payload.mealsAction;
    delete payload.companyId;

    // Use transaction to ensure employee update and meal actions are atomic
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Employee
      // We pass 'tx' to repo method
      const emp = await employeesRepository.update(id, payload, tx);

      // 2. Handle Meals Action (if provided)
      const { mealsAction } = data;
      // mealsAction: 'DELETE' | 'UNLINK' | 'UNLINK_IGNORE'

      if (mealsAction && payload.dataDemissao) {
        // We delegate meal actions to MealsService?
        // Ideally MealsService should accept a transaction/client to perform ops?
        // Or we use raw queries here since MealsService assumes default prisma client?
        // Refactoring MealsService to accept TX is good practice.
        // For now, I'll allow "mealsService" methods to handle this,
        // BUT standard service methods don't take TX.
        // This is where "God Service" breaks down. logic should be in proper domains.

        // I will act directly on Meal table here via prisma tx OR
        // I should have a MealsRepository method that accepts TX.
        // As I haven't refactored MealsRepo yet, I will execute raw queries here using TX
        // mirroring the old logic, but cleaner.

        if (mealsAction === "DELETE") {
          await tx.meal.deleteMany({ where: { employeeId: parseInt(id) } });
        } else if (mealsAction === "UNLINK") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              matriculaSnapshot: emp.matricula,
            },
          });
        } else if (mealsAction === "UNLINK_IGNORE") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              ignoredInExport: true,
              matriculaSnapshot: emp.matricula,
            },
          });
        }
      }

      return emp;
    });

    if (!payload.dataDemissao) {
      // Attempt to link meals again if not dismissed
      await mealsService.linkEmployeeMeals(updated);
    }

    return updated;
  }

  async delete(id, mealsAction) {
    // Transactional Delete
    return prisma.$transaction(async (tx) => {
      if (mealsAction) {
        let matricula = "";
        if (mealsAction.startsWith("UNLINK")) {
          const current = await tx.employee.findUnique({
            where: { id: parseInt(id) },
          });
          if (current) matricula = current.matricula;
        }

        if (mealsAction === "DELETE") {
          await tx.meal.deleteMany({ where: { employeeId: parseInt(id) } });
        } else if (mealsAction === "UNLINK") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              matriculaSnapshot: matricula,
            },
          });
        } else if (mealsAction === "UNLINK_IGNORE") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              ignoredInExport: true,
              matriculaSnapshot: matricula,
            },
          });
        }
      }

      return employeesRepository.delete(id, tx);
    });
  }
}

module.exports = new EmployeesService();
