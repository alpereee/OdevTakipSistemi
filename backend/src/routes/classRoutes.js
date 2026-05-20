const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, checkRole([2]), classController.getClasses);
router.post('/', verifyToken, checkRole([2]), classController.createClass);

module.exports = router;
