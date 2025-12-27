const express = require("express");
const router = express.Router();
const controller = require("../controllers/permissions.controller");
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("permission:manage"), controller.getAll);
router.get("/:id", checkPermission("permission:manage"), controller.getById);
router.post("/", checkPermission("permission:manage"), controller.create);
router.put("/:id", checkPermission("permission:manage"), controller.update);
router.delete("/:id", checkPermission("permission:manage"), controller.delete);

module.exports = router;
