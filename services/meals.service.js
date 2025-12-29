const prisma = require("../utils/prisma");

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
      // Create UTC range for the provided date string (YYYY-MM-DD)
      // Assuming 'date' comes as 'YYYY-MM-DD' from frontend.
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return prisma.meal.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            setor: true,
            matricula: true,
            companyId: true, // Minimal fields
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async create(data) {
    const { employeeId, date, companyId } = data;

    // Fetch employee for snapshots
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

    const existing = await prisma.meal.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      throw new Error("Meal already exists for this employee on this date.");
    }

    const { periodStart, periodEnd } = this._getPeriod(dateObj);

    return prisma.meal.create({
      data: {
        employeeId: parseInt(employeeId),
        companyId: parseInt(companyId) || employee.companyId,
        date: dateObj,
        price: 3.0, // Hardcoded in old controller? Should be dynamic probably later.
        periodStart,
        periodEnd,
        employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
        employeeSectorSnapshot: employee.setor || "N/A",
      },
    });
  }

  async delete(id) {
    return prisma.meal.delete({ where: { id: parseInt(id) } });
  }

  async countPending(companyId) {
    return prisma.meal.count({
      where: {
        companyId: parseInt(companyId),
        status: "PENDING_LINK",
      },
    });
  }

  async getPendingMeals(companyId) {
    return prisma.meal.findMany({
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
    const result = await prisma.meal.updateMany({
      where: {
        matriculaSnapshot: matricula,
        status: "PENDING_LINK",
      },
      data: {
        employeeId: id,
        status: "LINKED",
        employeeNameSnapshot: `${firstName} ${lastName}`.trim(),
        employeeSectorSnapshot: employee.setor,
      },
    });

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

    // 2. Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const matricula = row.matricula ? row.matricula.toString().trim() : "";
      const dateStr = row.date || row.dataRefeicao; // Support both keys
      const errors = [];

      // Basic Validation
      if (!matricula) errors.push("Matrícula obrigatória");
      if (!dateStr) errors.push("Data obrigatória");

      // Robust Date Parsing
      let dateObj;
      // Regex for DD/MM/YYYY or DD-MM-YYYY
      const brDateRegex = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/;
      const match = dateStr ? dateStr.toString().match(brDateRegex) : null;

      if (match) {
        // Parse as DD/MM/YYYY => YYYY-MM-DD for constructor
        // Month is 0-indexed in Date(y, m, d) but we want string for ISO parsing or constructor.
        // Actually, just new Date(y, m-1, d) is safest.
        dateObj = new Date(
          parseInt(match[3]),
          parseInt(match[2]) - 1,
          parseInt(match[1])
        );
      } else {
        // Fallback to standard ISO Date (YYYY-MM-DD)
        dateObj = new Date(dateStr);
      }

      if (!dateObj || isNaN(dateObj.getTime())) {
        errors.push("Data inválida. Use DD/MM/YYYY ou YYYY-MM-DD");
      }

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

      // Check Duplicate (Database) - Performance warning for loop, but OK for MVP < 500 rows
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);

      // We check DB duplicates regardless of employee existence (by matriculaSnapshot if needed, but currently schema doesn't strict check unique for missing employees easily without complex query)
      // For now, check duplicate only if Linked. If Orphan, we might risk dupes or need specific check.
      // Let's rely on EmployeeId check for linked, and skip for orphan for simplicity unless criticial.
      if (employee) {
        const existing = await prisma.meal.findFirst({
          where: {
            employeeId: employee.id,
            date: { gte: startOfDay, lte: endOfDay },
          },
        });
        if (existing) {
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
        price: row.price || row.valor || 3.0, // Default or from file
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

    // Optimizing fetching again might be safer to ensure state hasn't changed,
    // or rely on frontend passing reliable data.
    // We will do a fresh lookup for safety.
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

        await prisma.meal.create({
          data: {
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
          },
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
