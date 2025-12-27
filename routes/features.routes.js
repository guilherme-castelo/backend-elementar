const express = require("express");
const router = express.Router();
const controller = require("../controllers/features.controller");
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("feature:manage"), controller.getAll);
router.get("/:id", checkPermission("feature:manage"), controller.getById);
router.post("/", checkPermission("feature:manage"), controller.create);
router.put("/:id", checkPermission("feature:manage"), controller.update);
router.delete("/:id", checkPermission("feature:manage"), controller.delete);

module.exports = router;
