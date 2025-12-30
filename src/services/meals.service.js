const mealsRepository = require("../repositories/meals.repository");
const prisma = require("../utils/prisma"); // Keeping for other lookups if needed (e.g. Employee) or move Employee lookup to EmployeeRepo later.
// Ideally we should use EmployeeRepository for employee lookups too, but focused on Meals for now.

class MealsService {
  // Helper for period logic (keeping same range logic 26th-25th)
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

    // Period Filtering (Exact or Range)
    if (periodStart) where.periodStart = { gte: new Date(periodStart) };
    if (periodEnd) where.periodEnd = { lte: new Date(periodEnd) };

    // Date Filtering (Specific Day)
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    // Date Range Filtering (Custom)
    if (query.date_gte || query.date_lte) {
      // Only init where.date if not already set (precedence to exact date matching above, or merge?)
      // If both provided, merge? Let's assume 'date' param takes precedence or handled separately.
      // Usually they are mutually exclusive usage in this app.
      if (!where.date) where.date = {};

      if (query.date_gte) {
        where.date.gte = new Date(query.date_gte);
      }

      if (query.date_lte) {
        // Identify if it is simple Date string or ISO
        // Frontend sends YYYY-MM-DD. We want end of that day.
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

    // Fetch employee for snapshots - Ideally move to EmployeeRepository
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(employeeId) },
    });
    if (!employee) throw new Error("Employee not found");

    const dateObj = new Date(date);

    // Check if dismissed
    if (employee.dataDemissao) {
      const demissao = new Date(employee.dataDemissao);
      demissao.setHours(0, 0, 0, 0); // Normalize comparison
      const mealDate = new Date(dateObj);
      mealDate.setHours(0, 0, 0, 0);

      if (demissao <= mealDate) {
        throw new Error(
          "Cannot register meal: Employee is dismissed prior to or on this date."
        );
      }
    }

    // Check Duplicate (One per day)
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
      throw new Error("Meal already exists for this employee on this date.");
    }

    const { periodStart, periodEnd } = this._getPeriod(dateObj);

    return mealsRepository.create({
      employeeId: parseInt(employeeId),
      companyId: parseInt(companyId) || employee.companyId,
      date: dateObj,
      price: 3.0, // Hardcoded in old controller? Should be dynamic probably later.
      periodStart,
      periodEnd,
      employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
      employeeSectorSnapshot: employee.setor || "N/A",
    });
  }

  async delete(id) {
    return mealsRepository.delete(id);
  }

  async countPending(companyId) {
    return mealsRepository.count({
      companyId: parseInt(companyId),
      status: "PENDING_LINK",
    });
  }

  async getPendingMeals(companyId) {
    return mealsRepository.findMany({
      where: {
        companyId: parseInt(companyId),
        status: "PENDING_LINK",
      },
      orderBy: {
        date: "desc",
      },
    });
  }

  /**
   * Links pending meals to a newly created/updated employee based on matricula.
   */
  async linkEmployeeMeals(employee) {
    const { id, matricula, firstName, lastName } = employee;

    // Update all pending meals with this matricula
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
    // 1. Fetch available employees for lookup
    const employees = await prisma.employee.findMany({
      where: { companyId: parseInt(companyId) },
      select: {
        id: true,
        matricula: true,
        firstName: true,
        lastName: true,
        setor: true,
        dataDemissao: true,
      },
    });

    const employeeMap = new Map(employees.map((e) => [e.matricula, e]));
    const valid = [];
    const invalid = [];
    const missingEmployee = [];

    // Pre-process dates to find range for bulk duplicate check
    let minDate = null;
    let maxDate = null;

    // Simplified loop to extract dates first? Or parse in main loop?
    // Let's stick to main loop but add a preliminary pass or handle logic differently.
    // Actually, to fix N+1 we need to query BEFORE the main logic loop.
    // BUT we need parsed dates.

    // Let's parse all rows first.
    const parsedRows = [];
    const datesToQuery = [];

    for (const row of data) {
      const matricula = row.matricula ? row.matricula.toString().trim() : "";
      const dateStr = row.date || row.dataRefeicao;
      let dateObj = null;
      const errors = [];

      // Basic validation
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
        // If dateStr existed but parsing failed
        errors.push("Data inválida. Use DD/MM/YYYY ou YYYY-MM-DD");
      }

      parsedRows.push({ row, matricula, dateObj, errors });
    }

    // Bulk Query
    let mealMap = new Set();
    if (datesToQuery.length > 0) {
      // Calculate Min/Max
      datesToQuery.sort((a, b) => a - b);
      minDate = datesToQuery[0];
      maxDate = datesToQuery[datesToQuery.length - 1];

      // Adjust to start/end of days
      const queryStart = new Date(minDate);
      queryStart.setHours(0, 0, 0, 0);
      const queryEnd = new Date(maxDate);
      queryEnd.setHours(23, 59, 59, 999);

      const collisions = await mealsRepository.findCollisionsInRange(
        queryStart,
        queryEnd,
        parseInt(companyId)
      );

      // Build Map: "${employeeId}_${dateYYYYMMDD}"
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

    // 2. Process each row
    for (const parsed of parsedRows) {
      const { row, matricula, dateObj, errors } = parsed;

      if (errors.length > 0) {
        invalid.push({ row, reason: errors.join(", ") });
        continue;
      }

      // Check Employee
      const employee = employeeMap.get(matricula);

      // Check Dismissal (if employee exists)
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

      // Check Duplicate (Memory Map)
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

      // Categorize
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

    const employees = await prisma.employee.findMany({
      where: { companyId: parseInt(companyId) },
      select: {
        id: true,
        matricula: true,
        firstName: true,
        lastName: true,
        setor: true,
      },
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

          // Linkage Logic
          employeeId: employee ? employee.id : null,
          status: employee ? "LINKED" : "PENDING_LINK",

          // Snapshots
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
