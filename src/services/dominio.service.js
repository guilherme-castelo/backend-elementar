const prisma = require("../utils/prisma");

class DominioService {
  /**
   * Helper to pad numbers/strings with zeros to the left
   */
  padLeft(value, length) {
    if (value === null || value === undefined) return "0".repeat(length);
    return String(value).trim().padStart(length, "0");
  }

  /**
   * Get integration config for a company
   */
  async getConfig(companyId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { dominioRubric: true, dominioCode: true },
    });
    return company || { dominioRubric: "297", dominioCode: "" };
  }

  /**
   * Update integration config
   */
  async updateConfig(companyId, data) {
    // Basic validation
    if (data.dominioRubric && data.dominioRubric.length > 9) {
      throw new Error("Código da Rubrica deve ter no máximo 9 caracteres");
    }
    if (data.dominioCode && data.dominioCode.length > 10) {
      throw new Error("Código da Empresa deve ter no máximo 10 caracteres");
    }

    return prisma.company.update({
      where: { id: companyId },
      data: {
        dominioRubric: data.dominioRubric,
        dominioCode: data.dominioCode,
      },
    });
  }

  /**
   * Generate Export File
   * @param {number} companyId
   * @param {number} month (1-12)
   * @param {number} year (YYYY)
   */
  async generateExport(companyId, month, year) {
    const config = await this.getConfig(companyId);

    if (!config.dominioCode) {
      throw new Error(
        "Código da Empresa (Domínio) não configurado. Acesse as configurações de integração."
      );
    }

    // Calculate dates
    // Calculate dates (Rule: 26th of previous month to 25th of current month)
    // month is 1-based index (1=Jan, 12=Dec)
    // Javascript Date month is 0-based index (0=Jan, 11=Dec)

    // Start: 26th of previous month
    // month - 1 (to 0-index) - 1 (previous month) = month - 2
    const startDate = new Date(year, month - 2, 26, 0, 0, 0, 0);

    // End: 25th of current month
    // month - 1 (to 0-index)
    const endDate = new Date(year, month - 1, 25, 23, 59, 59, 999);

    const competentceStr = `${year}${String(month).padStart(2, "0")}`;

    // Fetch Meals in period
    // Grouped by Employee? Prisma groupBy doesn't allow returning relations easily.
    // Better to findMany with include Employee, then reduce in JS.
    const meals = await prisma.meal.findMany({
      where: {
        companyId: Number(companyId),
        date: {
          gte: startDate,
          lte: endDate,
        },
        ignoredInExport: false,
      },
      include: {
        employee: true,
      },
    });

    if (!meals.length) {
      return null;
    }

    // Group by Employee ID (or Matricula)
    // Key: matricula, Value: count
    const totals = {};

    meals.forEach((meal) => {
      if (!meal.employee) return;
      const mat = meal.employee.matricula;
      if (!totals[mat]) totals[mat] = 0;
      totals[mat]++;
    });

    // Generate Lines
    // Layout:
    // 1. Tipo: "10" (2)
    // 2. Matricula: (10, zero-left)
    // 3. Competencia: AAAAMM (6)
    // 4. Rubrica: (9, zero-left) - default 297
    // 5. Tipo Lanc: "11" (2)
    // 6. Valor: (9, zero-left) - Qtd * 100 ?? Example: 3 -> "000000300" => Yes, implied 2 decimals.
    // 7. Cod Empresa: (10, zero-left)

    const lines = Object.keys(totals).map((matricula) => {
      const count = totals[matricula];

      // Fields
      const field1_Type = "10";
      const field2_Matricula = this.padLeft(matricula, 10);
      const field3_Comp = competentceStr;
      const field4_Rubrica = this.padLeft(config.dominioRubric, 9);
      const field5_TipoLanc = "11";

      // Value: 3 meals -> 300
      const valueInt = count * 100;
      const field6_Value = this.padLeft(valueInt, 9);

      const field7_Empresa = this.padLeft(config.dominioCode, 10);

      const line = `${field1_Type}${field2_Matricula}${field3_Comp}${field4_Rubrica}${field5_TipoLanc}${field6_Value}${field7_Empresa}`;

      // Validation of length (Optional debug)
      // 2+10+6+9+2+9+10 = 48
      if (line.length !== 48) {
        console.warn(
          `[DominioExport] Line length mismatch: ${line.length} !== 48. Line: ${line}`
        );
      }

      return line;
    });

    return lines.join("\r\n");
  }
}

module.exports = new DominioService();
