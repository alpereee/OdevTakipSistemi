const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, schoolController.getSchools);
router.post('/', verifyToken, checkRole([1]), schoolController.createSchool);

module.exports = router;
