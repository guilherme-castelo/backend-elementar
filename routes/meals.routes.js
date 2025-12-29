const express = require("express");
const router = express.Router();
const controller = require("../controllers/meals.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal management
 */

/**
 * @swagger
 * /meals:
 *   get:
 *     summary: Get all meals
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meals
 *   post:
 *     summary: Register a meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - calories
 *             properties:
 *               name:
 *                 type: string
 *               calories:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Meal registered
 */
router.get("/", checkPermission("meal:read"), controller.getAll);
router.post("/", checkPermission("meal:create"), controller.register);
router.post(
  "/analyze",
  checkPermission("meal:create"),
  controller.analyzeImport
);
router.post("/import", checkPermission("meal:create"), controller.importBulk);
router.get(
  "/pending-count",
  checkPermission("meal:read"),
  controller.getPendingCount
);
router.get("/pending", checkPermission("meal:read"), controller.getPending);

/**
 * @swagger
 * /meals/{id}:
 *   delete:
 *     summary: Delete meal
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Meal deleted
 */
router.delete("/:id", checkPermission("meal:delete"), controller.delete);

module.exports = router;
