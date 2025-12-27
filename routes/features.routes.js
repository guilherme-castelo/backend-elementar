const express = require("express");
const router = express.Router();
const controller = require("../controllers/features.controller");
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

router.use(authGuard);

/**
 * @swagger
 * tags:
 *   name: Features
 *   description: Feature management
 */

/**
 * @swagger
 * /features:
 *   get:
 *     summary: Get all features
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of features
 *   post:
 *     summary: Create a new feature
 *     tags: [Features]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature created
 */
router.get("/", checkPermission("feature:manage"), controller.getAll);
router.post("/", checkPermission("feature:manage"), controller.create);

/**
 * @swagger
 * /features/{id}:
 *   get:
 *     summary: Get feature by ID
 *     tags: [Features]
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
 *         description: Feature details
 *       404:
 *         description: Feature not found
 *   put:
 *     summary: Update feature
 *     tags: [Features]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feature updated
 *   delete:
 *     summary: Delete feature
 *     tags: [Features]
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
 *         description: Feature deleted
 */
router.get("/:id", checkPermission("feature:manage"), controller.getById);
router.put("/:id", checkPermission("feature:manage"), controller.update);
router.delete("/:id", checkPermission("feature:manage"), controller.delete);

module.exports = router;
