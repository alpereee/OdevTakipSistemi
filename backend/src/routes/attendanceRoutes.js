const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, isTeacherOrAdmin } = require('../middlewares/authMiddleware');

router.get('/student/:student_id', verifyToken, attendanceController.getAttendanceByStudent);
router.post('/', verifyToken, isTeacherOrAdmin, attendanceController.addAttendance);

module.exports = router;
