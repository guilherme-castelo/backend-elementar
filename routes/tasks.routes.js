const express = require("express");
const router = express.Router();
const controller = require("../controllers/tasks.controller");
const authGuard = require("../middlewares/auth");

const checkPermission = require("../middlewares/permission");

router.use(authGuard);

router.get("/", checkPermission("task:read"), controller.getAll);
router.get("/:id", checkPermission("task:read"), controller.getOne);
router.post("/", checkPermission("task:create"), controller.create);
router.put("/:id", checkPermission("task:update"), controller.update);
router.patch("/:id", checkPermission("task:update"), controller.update);
router.delete("/:id", checkPermission("task:delete"), controller.delete);

router.get("/:id/comments", controller.getComments);
router.post("/:id/comments", controller.addComment);

module.exports = router;
