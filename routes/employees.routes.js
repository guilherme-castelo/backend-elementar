const express = require("express");
const router = express.Router();
const controller = require("../controllers/employees.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("employee:read"), controller.getAll);
router.get("/:id", checkPermission("employee:read"), controller.getById);
router.post("/", checkPermission("employee:create"), controller.create);
router.put("/:id", checkPermission("employee:update"), controller.update);
router.delete("/:id", checkPermission("employee:delete"), controller.delete);

module.exports = router;
