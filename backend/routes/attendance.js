const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getAttendance,
    getAttendanceReport,
    getMonthlyStats,
    getAttendanceAlerts
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('teacher', 'admin'), markAttendance);
router.get('/', protect, getAttendance);
router.get('/monthly-stats', protect, getMonthlyStats);
router.get('/alerts', protect, authorize('admin', 'teacher'), getAttendanceAlerts);
router.get('/report/:student_id', protect, getAttendanceReport);

module.exports = router;
