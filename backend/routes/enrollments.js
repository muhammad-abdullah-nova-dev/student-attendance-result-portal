const express = require('express');
const router = express.Router();
const {
    getStudentEnrollments,
    getCourseEnrollments,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

// Get student's enrollments
router.get('/student/:student_id', protect, getStudentEnrollments);

// Get course's enrollments (Teacher/Admin only)
router.get('/course/:course_id', protect, authorize('teacher', 'admin'), getCourseEnrollments);

// Create enrollment (Admin only)
router.post('/', protect, authorize('admin'), createEnrollment);

// Update enrollment (Admin only)
router.put('/:id', protect, authorize('admin'), updateEnrollment);

// Delete enrollment (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteEnrollment);

module.exports = router;
