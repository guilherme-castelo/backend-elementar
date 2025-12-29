const express = require("express");
const router = express.Router();
const dominioService = require("../services/dominio.service");
const requireAuth = require("../middlewares/auth");
const requirePermission = require("../middlewares/permission");

// Config Routes
router.get(
  "/dominio/config",
  requireAuth,
  requirePermission("integration:dominio"),
  async (req, res) => {
    try {
      const config = await dominioService.getConfig(req.user.companyId);
      res.json(config);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erro ao buscar configurações" });
    }
  }
);

router.put(
  "/dominio/config",
  requireAuth,
  requirePermission("integration:dominio"),
  async (req, res) => {
    try {
      const config = await dominioService.updateConfig(
        req.user.companyId,
        req.body
      );
      res.json(config);
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Export Route
router.get(
  "/dominio/export",
  requireAuth,
  requirePermission("integration:dominio"),
  async (req, res) => {
    try {
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ message: "Mês e Ano são obrigatórios" });
      }

      const fileContent = await dominioService.generateExport(
        req.user.companyId,
        Number(month),
        Number(year)
      );

      if (!fileContent) {
        return res
          .status(404)
          .json({ message: "Nenhum registro encontrado para o período." });
      }

      const fileName = `dominio_refeicoes_${year}_${String(month).padStart(
        2,
        "0"
      )}.txt`;

      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.send(fileContent);
    } catch (error) {
      console.error("Export Error:", error);
      res.status(400).json({ message: error.message || "Erro na exportação" });
    }
  }
);

module.exports = router;
