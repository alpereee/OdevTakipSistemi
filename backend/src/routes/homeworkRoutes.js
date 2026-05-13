const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const homeworkController = require('../controllers/homeworkController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Multer Ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Benzersiz dosya adı
  }
})
const upload = multer({ storage: storage })

// Ödevleri listele (Tüm yetkili kullanıcılar, sadece okuma yapabilir, gerekirse rollere göre filtrelenebilir)
router.get('/class/:sinif_id', verifyToken, homeworkController.getHomeworksByClass);

// Yeni ödev ekle (Sadece Öğretmen ve Yönetici)
router.post('/', verifyToken, checkRole([1, 2]), upload.single('dosya'), homeworkController.createHomework);

// Ödev teslimlerini listele (Sadece Öğretmen ve Yönetici)
router.get('/:odev_id/submissions', verifyToken, checkRole([1, 2]), homeworkController.getSubmissionsByHomework);

// Ödevi notlandır (Sadece Öğretmen ve Yönetici)
router.put('/submissions/:teslim_id/grade', verifyToken, checkRole([1, 2]), homeworkController.gradeSubmission);

// Öğrencinin kendi ödevlerini ve notlarını listele (Öğrenci ve Veli)
router.get('/student/:ogrenci_id', verifyToken, checkRole([3, 4]), homeworkController.getHomeworksByStudent);

module.exports = router;
