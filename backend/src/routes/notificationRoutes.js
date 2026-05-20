const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/my', verifyToken, notificationController.getMyNotifications);
router.post('/read', verifyToken, notificationController.markAsRead);

module.exports = router;
