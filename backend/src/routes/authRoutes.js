const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Kullanıcı girişi
router.post('/login', authController.login);

// Şifre sıfırlama (Simüle edilmiş, normalde e-posta token'ı gerekir)
router.post('/reset-password', authController.resetPassword);

module.exports = router;
