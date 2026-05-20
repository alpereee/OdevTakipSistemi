const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Ödevleri listele (Tüm yetkili kullanıcılar, sadece okuma yapabilir, gerekirse rollere göre filtrelenebilir)
router.get('/class/:sinif_id', verifyToken, homeworkController.getHomeworksByClass);

// Yeni ödev ekle (Sadece Öğretmen ve Yönetici)
router.post('/', verifyToken, checkRole([1, 2]), homeworkController.createHomework);

// Ödev teslimlerini listele (Sadece Öğretmen ve Yönetici)
router.get('/:odev_id/submissions', verifyToken, checkRole([1, 2]), homeworkController.getSubmissionsByHomework);

// Ödevi notlandır (Sadece Öğretmen ve Yönetici)
router.put('/submissions/:teslim_id/grade', verifyToken, checkRole([1, 2]), homeworkController.gradeSubmission);

// Öğrencinin kendi ödevlerini ve notlarını listele (Öğrenci ve Veli)
router.get('/student/:ogrenci_id', verifyToken, checkRole([3, 4]), homeworkController.getHomeworksByStudent);

// Öğrencinin ödev teslim etmesi (metin yanıtı)
router.post('/:odev_id/submit', verifyToken, checkRole([3]), homeworkController.submitHomework);

module.exports = router;
