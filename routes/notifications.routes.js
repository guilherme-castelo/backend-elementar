const express = require('express');
const router = express.Router();
const controller = require('../controllers/notifications.controller');
const authGuard = require('../middlewares/auth');

router.use(authGuard);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.patch('/:id/read', controller.markAsRead);
router.patch('/:id/archive', controller.archive);

module.exports = router;
