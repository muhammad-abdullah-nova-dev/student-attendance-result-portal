const { Course, Teacher } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res, next) => {
    try {
        const { status, teacher_id, page = 1, limit = 50 } = req.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (teacher_id) {
            where.teacher_id = teacher_id;
        }

        // If user is teacher, only show their courses
        if (req.user.role === 'teacher') {
            where.teacher_id = req.user.id;
        }

        const offset = (page - 1) * limit;

        const { count, rows: courses } = await Course.findAndCountAll({
            where,
            include: [
                {
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['id', 'name', 'email', 'department']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: courses,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [
                {
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['id', 'name', 'email', 'department']
                }
            ]
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res, next) => {
    try {
        const { course_code, course_title, credit_hours, teacher_id, description } = req.body;

        // Check if course code exists
        const existingCourse = await Course.findOne({ where: { course_code } });

        if (existingCourse) {
            return res.status(400).json({
                success: false,
                message: 'Course code already exists'
            });
        }

        const course = await Course.create({
            course_code,
            course_title,
            credit_hours,
            teacher_id,
            course_title,
            credit_hours,
            teacher_id,
            description,
            created_by: req.user.id
        });

        res.status(201).json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const { course_code, course_title, credit_hours, teacher_id, description, status } = req.body;

        if (course_code) course.course_code = course_code;
        if (course_title) course.course_title = course_title;
        if (credit_hours) course.credit_hours = credit_hours;
        if (teacher_id !== undefined) course.teacher_id = teacher_id;
        if (description) course.description = description;
        if (status) course.status = status;

        await course.save();

        res.json({
            success: true,
            data: course
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        await course.destroy();

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get course enrollments (SIMPLIFIED - no enrollments table yet)
// @route   GET /api/courses/:id/enrollments
// @access  Private
exports.getCourseEnrollments = async (req, res, next) => {
    try {
        const course = await Course.findByPk(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Simplified: return empty array since enrollments table not in SQL schema
        res.json({
            success: true,
            data: [],
            message: 'Enrollment tracking not yet implemented'
        });
    } catch (error) {
        next(error);
    }
};
