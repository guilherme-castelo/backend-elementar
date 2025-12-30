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
      // If dataAdmissao is provided, use it, otherwise valid date (now)
      dataAdmissao: data.dataAdmissao
        ? new Date(data.dataAdmissao)
        : new Date(),
      dataDemissao: data.dataDemissao ? new Date(data.dataDemissao) : null,
      // If cpf is empty string or null, set to null to avoid unique constraint violation on ""
      cpf: data.cpf ? data.cpf : null,
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

    // Remove non-schema fields
    delete payload.mealsAction;
    // companyId cannot be updated directly in this Prisma configuration (use connect if needed, but form doesn't allow change)
    delete payload.companyId;

    // Use transaction to ensure employee update and meal actions are atomic
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Employee
      const emp = await tx.employee.update({
        where: { id: parseInt(id) },
        data: payload,
      });

      // 2. Handle Meals Action (if provided)
      const { mealsAction } = data;
      // mealsAction: 'DELETE' | 'UNLINK' | 'UNLINK_IGNORE'

      if (mealsAction && payload.dataDemissao) {
        if (mealsAction === "DELETE") {
          await tx.meal.deleteMany({
            where: { employeeId: parseInt(id) },
          });
        } else if (mealsAction === "UNLINK") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              // matriculaSnapshot keeps the old one, allowing re-link or manual fix
            },
          });
        } else if (mealsAction === "UNLINK_IGNORE") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              ignoredInExport: true,
            },
          });
        }
      }

      return emp;
    });

    // Auto-link pending meals (only if NOT dismissing or if logic allows)
    // If we just unlinked, we probably don't want to re-link immediately if the matricula matches?
    // But dataDemissao is set.
    // Logic in "linkEmployeeMeals" should check if employee is dismissed?
    // Let's check logic in mealsService.linkEmployeeMeals.
    // It finds by matriculaSnapshot.
    // If employee is dismissed, we should arguably NOT link.
    // But let's leave as is for now, assuming "linkEmployeeMeals" might need check.
    // ACTUALLY: if we Unlink, we set employeeId=null. `linkEmployeeMeals` searches for `matriculaSnapshot`.
    // If we run `linkEmployeeMeals` now, it finds the employee (updated).
    // If the employee is dismissed, `linkEmployeeMeals` might re-link them if it doesn't check dismissal.
    // We should probably NOT run linkEmployeeMeals if we just did a dismissal action.

    if (!payload.dataDemissao) {
      await mealsService.linkEmployeeMeals(updated);
    }

    return updated;
  }

  async delete(id, mealsAction) {
    // Transactional Delete
    return prisma.$transaction(async (tx) => {
      // 1. Handle Meals Action
      // mealsAction: 'DELETE' | 'UNLINK' | 'UNLINK_IGNORE'

      if (mealsAction) {
        if (mealsAction === "DELETE") {
          await tx.meal.deleteMany({
            where: { employeeId: parseInt(id) },
          });
        } else if (mealsAction === "UNLINK") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
            },
          });
        } else if (mealsAction === "UNLINK_IGNORE") {
          await tx.meal.updateMany({
            where: { employeeId: parseInt(id) },
            data: {
              employeeId: null,
              status: "PENDING_LINK",
              ignoredInExport: true,
            },
          });
        }
      }

      // 2. Delete Employee
      // Note: If mealsAction was not provided but meals exist, key constraint might fail if we don't handle them.
      // But typically valid logic implies we handled them if we are here.
      // Or cascade delete is configured at DB level? Users usually prefer explicit logic.
      // If we don't have cascade delete in Schema (we don't see onDelete: Cascade in Meal->Employee relation),
      // then this delete will fail if meals exist and we didn't delete/unlink them.
      return tx.employee.delete({ where: { id: parseInt(id) } });
    });
  }
}

module.exports = new EmployeesService();
