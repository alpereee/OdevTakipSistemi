const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, messageController.getMessages);
router.post('/send', verifyToken, messageController.sendMessage);

module.exports = router;
