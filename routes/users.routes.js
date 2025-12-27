const express = require("express");
const router = express.Router();
const controller = require("../controllers/users.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("user:read"), controller.getAll);
router.get("/:id", checkPermission("user:read"), controller.getById);
router.post("/", checkPermission("user:create"), controller.create);
router.put("/:id", checkPermission("user:update"), controller.update);
router.delete("/:id", checkPermission("user:delete"), controller.delete);

// Inactivate Route
router.patch(
  "/:id/inactivate",
  checkPermission("user:inactivate"),
  controller.inactivate
);

module.exports = router;
