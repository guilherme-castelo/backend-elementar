const express = require("express");
const router = express.Router();
const controller = require("../controllers/companies.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/roles", controller.getRoles);
router.get("/permissions", controller.getPermissions);

router.get("/", checkPermission("company:read"), controller.getAll);
router.get("/:id", checkPermission("company:read"), controller.getById);
router.post("/", checkPermission("company:create"), controller.create);
router.put("/:id", checkPermission("company:update"), controller.update);
router.delete("/:id", checkPermission("company:delete"), controller.delete);

// New Inactivate Route
router.patch(
  "/:id/inactivate",
  checkPermission("company:inactivate"),
  controller.inactivate
);

module.exports = router;
