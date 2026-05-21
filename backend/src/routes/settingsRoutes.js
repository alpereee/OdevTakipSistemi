const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/', settingsController.getSettings);
router.post('/', verifyToken, checkRole([1]), settingsController.updateSettings);

module.exports = router;
