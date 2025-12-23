const prisma = require('../utils/prisma');

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
        lte: endOfDay
      };
    }

    const meals = await prisma.meal.findMany({
      where,
      include: { employee: true },
      orderBy: { date: 'desc' }
    });

    // Flatten response for Frontend Interface (IMeal) compatibility
    return meals.map(meal => ({
      ...meal,
      // Priority: Snapshot -> Employee Relationship -> Fallback
      // Frontend expects: sector, employeeName, employeeMatricula at root
      sector: meal.employeeSectorSnapshot || (meal.employee ? meal.employee.setor : ''),
      employeeName: meal.employeeNameSnapshot || (meal.employee ? `${meal.employee.firstName} ${meal.employee.lastName}` : ''),
      employeeMatricula: meal.employee ? meal.employee.matricula : '',
      // Ensure date is string if needed, but Prisma returns Date objects usually.
      // Serialization handles it, but let's be safe if needed.
    }));
  }

  async create(data) {
    const { employeeId, date, companyId } = data;

    // Fetch employee for snapshots
    const employee = await prisma.employee.findUnique({ where: { id: parseInt(employeeId) } });
    if (!employee) throw new Error('Employee not found');

    const dateObj = new Date(date);

    // Check if dismissed
    if (employee.dataDemissao) {
      const demissao = new Date(employee.dataDemissao);
      demissao.setHours(0, 0, 0, 0); // Normalize comparison
      const mealDate = new Date(dateObj);
      mealDate.setHours(0, 0, 0, 0);

      if (demissao <= mealDate) {
        throw new Error('Cannot register meal: Employee is dismissed prior to or on this date.');
      }
    }

    // Check Duplicate (One per day)
    const startOfDay = new Date(dateObj); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj); endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.meal.findFirst({
      where: {
        employeeId: parseInt(employeeId),
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existing) {
      throw new Error('Meal already exists for this employee on this date.');
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
        employeeSectorSnapshot: employee.setor || 'N/A'
      }
    });
  }

  async delete(id) {
    return prisma.meal.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new MealsService();
