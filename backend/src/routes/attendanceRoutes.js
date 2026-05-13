const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/student/:ogrenci_id', verifyToken, checkRole([1, 2, 3, 4]), attendanceController.getAttendanceByStudent);

module.exports = router;
