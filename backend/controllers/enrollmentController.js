const { Enrollment, Student, Course } = require('../models');
const { Op } = require('sequelize');

// @desc    Get student's enrolled courses
// @route   GET /api/enrollments/student/:student_id
// @access  Private
exports.getStudentEnrollments = async (req, res, next) => {
    try {
        const { student_id } = req.params;

        const enrollments = await Enrollment.findAll({
            where: { student_id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'course_code', 'course_title', 'credit_hours', 'teacher_id']
                }
            ],
            order: [['enrolled_at', 'DESC']]
        });

        res.json({
            success: true,
            data: enrollments
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get course's enrolled students
// @route   GET /api/enrollments/course/:course_id
// @access  Private (Teacher/Admin)
exports.getCourseEnrollments = async (req, res, next) => {
    try {
        const { course_id } = req.params;

        const enrollments = await Enrollment.findAll({
            where: { course_id },
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'name', 'email', 'roll_number', 'department']
                }
            ],
            order: [[{ model: Student, as: 'student' }, 'name', 'ASC']]
        });

        res.json({
            success: true,
            data: enrollments,
            count: enrollments.length
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Enroll student in course
// @route   POST /api/enrollments
// @access  Private (Admin)
exports.createEnrollment = async (req, res, next) => {
    try {
        const { student_id, course_id } = req.body;

        if (!student_id || !course_id) {
            return res.status(400).json({
                success: false,
                message: 'student_id and course_id are required'
            });
        }

        // Check if already enrolled
        const existing = await Enrollment.findOne({
            where: { student_id, course_id }
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Student is already enrolled in this course'
            });
        }

        const enrollment = await Enrollment.create({
            student_id,
            course_id,
            status: 'active'
        });

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${student_id}`).emit('enrollment:created', {
                course_id,
                message: 'You have been enrolled in a new course'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Student enrolled successfully',
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update enrollment status
// @route   PUT /api/enrollments/:id
// @access  Private (Admin)
exports.updateEnrollment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const enrollment = await Enrollment.findByPk(id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        await enrollment.update({ status });

        res.json({
            success: true,
            message: 'Enrollment updated successfully',
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Admin)
exports.deleteEnrollment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const enrollment = await Enrollment.findByPk(id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Enrollment not found'
            });
        }

        await enrollment.destroy();

        res.json({
            success: true,
            message: 'Enrollment deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = exports;
