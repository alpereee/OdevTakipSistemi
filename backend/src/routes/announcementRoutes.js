const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Herkes görebilir
router.get('/', verifyToken, announcementController.getAnnouncements);

// Sadece yönetici ekleyip silebilir
router.post('/', verifyToken, checkRole([1]), announcementController.createAnnouncement);
router.delete('/:id', verifyToken, checkRole([1]), announcementController.deleteAnnouncement);

module.exports = router;
