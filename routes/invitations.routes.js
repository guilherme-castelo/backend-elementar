const express = require("express");
const router = express.Router();
const controller = require("../controllers/invitations.controller");
const authGuard = require("../middlewares/auth");
const checkPermission = require("../middlewares/permission");
const checkUsage = require("../middlewares/usage");

// Public Routes (Accepting Invite)
router.get("/validate/:token", controller.validate);
router.post("/accept", controller.accept);

// Protected Routes (Sending Invite)
router.post(
  "/",
  authGuard,
  checkPermission("user:create"),
  checkUsage("users"), // Inviting counts against usage limit!
  controller.invite
);

module.exports = router;
