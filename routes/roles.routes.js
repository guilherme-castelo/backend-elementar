const express = require("express");
const router = express.Router();
const controller = require("../controllers/roles.controller");
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("role:manage"), controller.getAll);
router.get("/:id", checkPermission("role:manage"), controller.getById);
router.post("/", checkPermission("role:manage"), controller.create);
router.put("/:id", checkPermission("role:manage"), controller.update);
router.delete("/:id", checkPermission("role:manage"), controller.delete);

module.exports = router;
