const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authGuard = require('../middlewares/auth');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.get('/me', authGuard, authController.me);

module.exports = router;
