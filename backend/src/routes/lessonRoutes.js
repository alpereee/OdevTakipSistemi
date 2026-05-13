const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, lessonController.getAllLessons);

// Sadece yönetici yeni ders ekleyebilir
router.post('/', verifyToken, checkRole([1]), lessonController.createLesson);

module.exports = router;
