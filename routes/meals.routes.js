const express = require("express");
const router = express.Router();
const controller = require("../controllers/meals.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("meal:read"), controller.getAll);
router.post("/", checkPermission("meal:create"), controller.register);
router.delete("/:id", checkPermission("meal:delete"), controller.delete);

module.exports = router;
