const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.controller');
const authGuard = require('../middlewares/auth');

router.use(authGuard);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
