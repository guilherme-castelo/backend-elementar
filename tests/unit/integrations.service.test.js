const { mockReset } = require("jest-mock-extended");
const prisma = require("../../utils/prisma");
const dominioService = require("../../services/dominio.service");

jest.mock("../../utils/prisma");

describe("DominioService", () => {
  beforeEach(() => {
    mockReset(prisma);
  });

  describe("padLeft", () => {
    it("should pad numbers with zeros", () => {
      expect(dominioService.padLeft(123, 5)).toBe("00123");
    });
    it("should pad strings with zeros", () => {
      expect(dominioService.padLeft("abc", 5)).toBe("00abc");
    });
    it("should handle null/undefined", () => {
      expect(dominioService.padLeft(null, 3)).toBe("000");
      expect(dominioService.padLeft(undefined, 3)).toBe("000");
    });
    it("should trim whitespace", () => {
      expect(dominioService.padLeft(" 1 ", 3)).toBe("001");
    });
  });

  describe("getConfig", () => {
    it("should return default config if none exists", async () => {
      prisma.company.findUnique.mockResolvedValue(null);
      const config = await dominioService.getConfig(1);
      expect(config).toEqual({ dominioRubric: "297", dominioCode: "" });
    });

    it("should return existing config", async () => {
      const mockConfig = { dominioRubric: "100", dominioCode: "555" };
      prisma.company.findUnique.mockResolvedValue(mockConfig);
      const config = await dominioService.getConfig(1);
      expect(config).toEqual(mockConfig);
    });
  });

  describe("updateConfig", () => {
    it("should throw validation error for long rubric", async () => {
      await expect(
        dominioService.updateConfig(1, { dominioRubric: "1234567890" })
      ).rejects.toThrow("Código da Rubrica deve ter no máximo 9 caracteres");
    });

    it("should throw validation error for long company code", async () => {
      await expect(
        dominioService.updateConfig(1, { dominioCode: "12345678901" })
      ).rejects.toThrow("Código da Empresa deve ter no máximo 10 caracteres");
    });

    it("should update config successfully", async () => {
      const data = { dominioRubric: "123", dominioCode: "456" };
      prisma.company.update.mockResolvedValue(data);
      await dominioService.updateConfig(1, data);
      expect(prisma.company.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: data,
      });
    });
  });

  describe("generateExport", () => {
    const mockConfig = { dominioRubric: "297", dominioCode: "1000" };

    beforeEach(() => {
      prisma.company.findUnique.mockResolvedValue(mockConfig);
    });

    it("should throw error if company code is missing", async () => {
      prisma.company.findUnique.mockResolvedValue({
        ...mockConfig,
        dominioCode: "",
      });
      await expect(dominioService.generateExport(1, 1, 2026)).rejects.toThrow(
        "Código da Empresa (Domínio) não configurado"
      );
    });

    it("should return null if no meals found", async () => {
      prisma.meal.findMany.mockResolvedValue([]);
      const result = await dominioService.generateExport(1, 1, 2026);
      expect(result).toBeNull();
    });

    it("should query correct date range (26th prev month to 25th current month)", async () => {
      prisma.meal.findMany.mockResolvedValue([]);

      // Test Case: January 2026
      // Should range: Dec 26, 2025 to Jan 25, 2026
      await dominioService.generateExport(1, 1, 2026);

      const callArgs = prisma.meal.findMany.mock.calls[0][0];
      const dateFilter = callArgs.where.date;

      // Check Start Date
      const startDate = dateFilter.gte;
      expect(startDate.getFullYear()).toBe(2025);
      expect(startDate.getMonth()).toBe(11); // Dec is 11
      expect(startDate.getDate()).toBe(26);
      expect(startDate.getHours()).toBe(0);

      // Check End Date
      const endDate = dateFilter.lte;
      expect(endDate.getFullYear()).toBe(2026);
      expect(endDate.getMonth()).toBe(0); // Jan is 0
      expect(endDate.getDate()).toBe(25);
      expect(endDate.getHours()).toBe(23);
    });

    it("should generate correct file layout", async () => {
      /*
        Layout:
        1. Type: "10" (2)
        2. Matricula: (10)
        3. Competencia: YYYYMM (6)
        4. Rubrica: (9)
        5. Tipo: "11" (2)
        6. Valor: Quantity * 100 (9)
        7. Code: (10)
        Total: 48 chars
       */

      const meals = [
        { employee: { matricula: "123" } },
        { employee: { matricula: "123" } }, // 2 meals for 123
        { employee: { matricula: "999" } }, // 1 meal for 999
      ];

      prisma.meal.findMany.mockResolvedValue(meals);

      const content = await dominioService.generateExport(1, 1, 2026);
      const lines = content.split("\r\n");

      expect(lines.length).toBe(2);

      // Verify Line 1 (Mat 123, Count 2 -> Value 200)
      // Expect: 10 + 0000000123 + 202601 + 000000297 + 11 + 000000200 + 0000001000
      const line1 = lines.find((l) => l.includes("0000000123"));
      expect(line1).toBeDefined();
      expect(line1.length).toBe(48);
      expect(line1.substring(0, 2)).toBe("10"); // Type
      expect(line1.substring(2, 12)).toBe("0000000123"); // Matricula
      expect(line1.substring(12, 18)).toBe("202601"); // Competencia
      expect(line1.substring(18, 27)).toBe("000000297"); // Rubrica
      expect(line1.substring(27, 29)).toBe("11"); // Tipo Lanc
      expect(line1.substring(29, 38)).toBe("000000200"); // Value (2 * 100)
      expect(line1.substring(38, 48)).toBe("0000001000"); // Company Code
    });
  });
});
