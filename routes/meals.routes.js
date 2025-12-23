const express = require('express');
const router = express.Router();
const controller = require('../controllers/meals.controller');
const authGuard = require('../middlewares/auth');

router.use(authGuard);

router.get('/', controller.getAll);
router.post('/', controller.register);
router.delete('/:id', controller.delete);

module.exports = router;
