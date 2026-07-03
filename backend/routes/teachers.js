const express = require('express');
const router = express.Router();
const {
    getTeacherStats,
    getTeacherCourses
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

// Get teacher dashboard statistics
router.get('/:id/stats', protect, authorize('teacher', 'admin'), getTeacherStats);

// Get teacher's courses with student counts
router.get('/:id/courses', protect, authorize('teacher', 'admin'), getTeacherCourses);

module.exports = router;
