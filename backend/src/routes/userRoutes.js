const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Rol ID'leri: 1: Yönetici, 2: Öğretmen, 3: Öğrenci, 4: Veli

// Sadece Yönetici erişebilir
router.get('/admin', verifyToken, checkRole([1]), userController.getAdminDashboard);

// Sadece Öğretmen erişebilir
router.get('/teacher', verifyToken, checkRole([2]), userController.getTeacherDashboard);

// Sadece Öğrenci erişebilir
router.get('/student', verifyToken, checkRole([3]), userController.getStudentDashboard);

// Sadece Veli erişebilir
router.get('/parent', verifyToken, checkRole([4]), userController.getParentDashboard);

// Yönetici ve Öğretmen erişebilir
router.get('/staff-only', verifyToken, checkRole([1, 2]), userController.getCommonData);

// --- KULLANICI YÖNETİMİ ROTALARI (Sadece Yönetici) ---
router.get('/', verifyToken, checkRole([1]), userController.getAllUsers);
router.post('/', verifyToken, checkRole([1]), userController.createUser);
router.delete('/:id', verifyToken, checkRole([1]), userController.deleteUser);
router.put('/:id/role', verifyToken, checkRole([1]), userController.updateUserRole);

module.exports = router;
