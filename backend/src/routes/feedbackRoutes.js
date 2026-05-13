const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Sadece Veliler (rol 4) geri bildirim gönderebilir
router.post('/', verifyToken, checkRole([4]), feedbackController.createFeedback);

module.exports = router;
