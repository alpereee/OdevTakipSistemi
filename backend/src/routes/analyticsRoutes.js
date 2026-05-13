const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Öğretmenler ve Yöneticiler ödev yükü analitiğini görebilir
router.get('/homework-load', verifyToken, checkRole([1, 2]), analyticsController.getHomeworkLoad);

module.exports = router;
