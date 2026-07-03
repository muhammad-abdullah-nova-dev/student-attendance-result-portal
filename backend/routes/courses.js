const express = require('express');
const router = express.Router();
const {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseEnrollments
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
    .get(protect, getCourses)
    .post(protect, authorize('admin'), createCourse);

router.route('/:id')
    .get(protect, getCourse)
    .put(protect, authorize('admin'), updateCourse)
    .delete(protect, authorize('admin'), deleteCourse);

router.get('/:id/enrollments', protect, getCourseEnrollments);

module.exports = router;
