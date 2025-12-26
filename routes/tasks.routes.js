const express = require("express");
const router = express.Router();
const controller = require("../controllers/tasks.controller");
const authGuard = require("../middlewares/auth");

router.use(authGuard);

router.get("/", controller.getAll);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.patch("/:id", controller.update); // JSON Server uses PATCH for partial updates usually
router.delete("/:id", controller.delete);

router.get("/:id/comments", controller.getComments);
router.post("/:id/comments", controller.addComment);

module.exports = router;
