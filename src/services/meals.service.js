const mealsRepository = require("../repositories/meals.repository");
const employeesRepository = require("../repositories/employees.repository");
const { ConflictError, NotFoundError } = require("../errors/AppError");

class MealsService {
  _getPeriod(dateObj) {
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    let start, end;

    if (day >= 26) {
      start = new Date(year, month, 26);
      end = new Date(year, month + 1, 25);
    } else {
      start = new Date(year, month - 1, 26);
      end = new Date(year, month, 25);
    }
    return { periodStart: start, periodEnd: end };
  }

  async getAll(query) {
    const { employeeId, periodStart, periodEnd, companyId, date } = query;
    const where = {};
    if (companyId) where.companyId = parseInt(companyId);
    if (employeeId) where.employeeId = parseInt(employeeId);

    if (periodStart) where.periodStart = { gte: new Date(periodStart) };
    if (periodEnd) where.periodEnd = { lte: new Date(periodEnd) };

    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);
      where.date = { gte: startOfDay, lte: endOfDay };
    }

    if (query.date_gte || query.date_lte) {
      if (!where.date) where.date = {};
      if (query.date_gte) where.date.gte = new Date(query.date_gte);
      if (query.date_lte) {
        const d = new Date(query.date_lte);
        if (query.date_lte.indexOf("T") === -1) {
          d.setUTCHours(23, 59, 59, 999);
        }
        where.date.lte = d;
      }
    }

    return mealsRepository.getAll(where);
  }

  async create(data) {
    const { employeeId, date, companyId } = data;

    const employee = await employeesRepository.getById(employeeId);
    if (!employee) throw new NotFoundError("Employee not found");

    const dateObj = new Date(date);

    if (employee.dataDemissao) {
      const demissao = new Date(employee.dataDemissao);
      demissao.setHours(0, 0, 0, 0);
      const mealDate = new Date(dateObj);
      mealDate.setHours(0, 0, 0, 0);

      if (demissao <= mealDate) {
        throw new ConflictError(
          "Cannot register meal: Employee is dismissed prior to or on this date."
        );
      }
    }

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await mealsRepository.findByEmployeeAndDate(
      employeeId,
      startOfDay,
      endOfDay
    );
    if (existing) {
      throw new ConflictError(
        "Meal already exists for this employee on this date."
      );
    }

    const { periodStart, periodEnd } = this._getPeriod(dateObj);

    return mealsRepository.create({
      employeeId: parseInt(employeeId),
      companyId: parseInt(companyId) || employee.companyId,
      date: dateObj,
      price: 3.0,
      periodStart,
      periodEnd,
      employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
      employeeSectorSnapshot: employee.setor || "N/A",
      matriculaSnapshot: employee.matricula,
    });
  }

  async delete(id) {
    return mealsRepository.delete(id);
  }

  async countPending(companyId, month, year) {
    let referenceDate = new Date();
    if (month && year) {
      // If month/year provided, we target the billing period associated with that month.
      // E.g. Month=01 (Jan), Year=2026.
      // We pick a safe date in that month (e.g. 1st) to determine the period logic.
      // Period logic:
      // Jan 1st -> Day=1 < 26 -> Start=Dec 26, End=Jan 25.
      // Matches "Reference Month: January".
      referenceDate = new Date(year, month - 1, 1);
    }
    const { periodStart, periodEnd } = this._getPeriod(referenceDate);

    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    return mealsRepository.count({
      companyId: parseInt(companyId),
      status: "PENDING_LINK",
      date: {
        gte: start,
        lte: end,
      },
    });
  }

  async getPendingMeals(companyId, month, year) {
    let referenceDate = new Date();
    if (month && year) {
      referenceDate = new Date(year, month - 1, 1);
    }
    const { periodStart, periodEnd } = this._getPeriod(referenceDate);

    // Ensure strict comparison including time for the end date if needed,
    // but _getPeriod returns Date objects.
    // periodEnd is usually day 25 at 00:00:00 by default in _getPeriod logic?
    // Let's check _getPeriod.
    // It returns: end = new Date(year, month, 25); -> defaults to 00:00:00.
    // If we want to include the whole day of 25th, we should set end of day.
    // Or check if _getPeriod is used elsewhere for strict equality.

    // Let's improve the query to cover the range.
    const start = new Date(periodStart);
    start.setHours(0, 0, 0, 0);

    const end = new Date(periodEnd);
    end.setHours(23, 59, 59, 999);

    return mealsRepository.findMany({
      where: {
        companyId: parseInt(companyId),
        status: "PENDING_LINK",
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async countByEmployee(employeeId) {
    return mealsRepository.countByEmployeeId(employeeId);
  }

  async deletePendingByMatricula(matricula, companyId) {
    return mealsRepository.deleteMany({
      companyId: parseInt(companyId),
      matriculaSnapshot: matricula,
      status: "PENDING_LINK",
    });
  }

  async toggleIgnorePendingByMatricula(matricula, companyId, shouldIgnore) {
    return mealsRepository.updateMany(
      {
        companyId: parseInt(companyId),
        matriculaSnapshot: matricula,
        status: "PENDING_LINK",
      },
      { ignoredInExport: shouldIgnore }
    );
  }

  async linkEmployeeMeals(employee) {
    const { id, matricula, firstName, lastName } = employee;

    const result = await mealsRepository.updateMany(
      {
        matriculaSnapshot: matricula,
        status: "PENDING_LINK",
      },
      {
        employeeId: id,
        status: "LINKED",
        employeeNameSnapshot: `${firstName} ${lastName}`.trim(),
        employeeSectorSnapshot: employee.setor,
      }
    );

    return result.count;
  }

  async analyzeBatch(data, companyId) {
    const employees = await employeesRepository.getAll({
      companyId: parseInt(companyId),
    });

    const employeeMap = new Map(employees.map((e) => [e.matricula, e]));
    const valid = [];
    const invalid = [];
    const missingEmployee = [];

    const parsedRows = [];
    const datesToQuery = [];

    for (const row of data) {
      const matricula = row.matricula ? row.matricula.toString().trim() : "";
      const dateStr = row.date || row.dataRefeicao;
      let dateObj = null;
      const errors = [];

      if (!matricula) errors.push("Matrícula obrigatória");
      if (!dateStr) errors.push("Data obrigatória");

      if (dateStr) {
        const brDateRegex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
        const match = dateStr.toString().match(brDateRegex);
        if (match) {
          dateObj = new Date(
            parseInt(match[3]),
            parseInt(match[2]) - 1,
            parseInt(match[1])
          );
        } else {
          dateObj = new Date(dateStr);
        }
      }

      if (dateObj && !isNaN(dateObj.getTime())) {
        datesToQuery.push(dateObj);
      } else if (dateStr) {
        errors.push("Data inválida. Use DD/MM/YYYY ou YYYY-MM-DD");
      }

      parsedRows.push({ row, matricula, dateObj, errors });
    }

    let mealMap = new Set();
    if (datesToQuery.length > 0) {
      datesToQuery.sort((a, b) => a - b);
      const minDate = datesToQuery[0];
      const maxDate = datesToQuery[datesToQuery.length - 1];

      const queryStart = new Date(minDate);
      queryStart.setHours(0, 0, 0, 0);
      const queryEnd = new Date(maxDate);
      queryEnd.setHours(23, 59, 59, 999);

      const collisions = await mealsRepository.findCollisionsInRange(
        queryStart,
        queryEnd,
        parseInt(companyId)
      );

      collisions.forEach((m) => {
        if (m.employeeId) {
          const d = new Date(m.date);
          const k = `${
            m.employeeId
          }_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
          mealMap.add(k);
        }
      });
    }

    for (const parsed of parsedRows) {
      const { row, matricula, dateObj, errors } = parsed;

      if (errors.length > 0) {
        invalid.push({ row, reason: errors.join(", ") });
        continue;
      }

      const employee = employeeMap.get(matricula);

      if (employee && employee.dataDemissao) {
        const demissao = new Date(employee.dataDemissao);
        demissao.setHours(0, 0, 0, 0);
        const mealDate = new Date(dateObj);
        mealDate.setHours(0, 0, 0, 0);
        if (demissao <= mealDate) {
          invalid.push({ row, reason: "Funcionário demitido nesta data" });
          continue;
        }
      }

      if (employee) {
        const d = new Date(dateObj);
        const k = `${
          employee.id
        }_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
        if (mealMap.has(k)) {
          invalid.push({
            row,
            reason: "Refeição já registrada para este funcionário nesta data",
          });
          continue;
        }
      }

      const cleanRow = {
        matricula,
        date: dateObj,
        price: row.price || row.valor || 3.0,
      };

      if (employee) {
        valid.push({
          ...cleanRow,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          linkStatus: "LINKED",
        });
      } else {
        missingEmployee.push({ ...cleanRow, linkStatus: "PENDING_LINK" });
      }
    }

    return {
      summary: {
        total: data.length,
        valid: valid.length,
        missingEmployee: missingEmployee.length,
        invalid: invalid.length,
      },
      valid,
      missingEmployee,
      invalid,
    };
  }

  async importBulk(records, companyId) {
    const results = [];

    const employees = await employeesRepository.getAll({
      companyId: parseInt(companyId),
    });
    const employeeMap = new Map(employees.map((e) => [e.matricula, e]));

    for (const record of records) {
      try {
        const employee = employeeMap.get(record.matricula);
        const dateObj = new Date(record.date);
        const { periodStart, periodEnd } = this._getPeriod(dateObj);

        await mealsRepository.create({
          companyId: parseInt(companyId),
          date: dateObj,
          price: record.price || 3.0,
          periodStart,
          periodEnd,
          employeeId: employee ? employee.id : null,
          status: employee ? "LINKED" : "PENDING_LINK",
          matriculaSnapshot: record.matricula,
          employeeNameSnapshot: employee
            ? `${employee.firstName} ${employee.lastName}`
            : record.employeeNameSnapshot || "Desconhecido",
          employeeSectorSnapshot: employee ? employee.setor : "N/A",
        });
        results.push({ success: true, matricula: record.matricula });
      } catch (err) {
        results.push({
          success: false,
          matricula: record.matricula,
          error: err.message,
        });
      }
    }
    return results;
  }
}

module.exports = new MealsService();
