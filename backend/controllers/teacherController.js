const { Teacher, Course, Timetable, Attendance, Result, Student, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get teacher's dashboard statistics
// @route   GET /api/teachers/:id/stats
// @access  Private (Teacher)
exports.getTeacherStats = async (req, res, next) => {
    try {
        const teacherId = req.params.id;

        // Get teacher's courses
        const courses = await Course.findAll({
            where: { teacher_id: teacherId }
        });

        const courseIds = courses.map(c => c.id);

        // Get today's classes from timetable
        const today = new Date().toLocaleString('en-US', { weekday: 'long' });
        const todaysClasses = await Timetable.findAll({
            where: {
                course_id: courseIds,
                day_of_week: today
            },
            include: [{
                model: Course,
                as: 'course',
                attributes: ['course_title', 'course_code']
            }]
        });

        // Calculate pending tasks
        const pendingTasks = [];

        // Check for courses without recent attendance
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        for (const course of courses) {
            const recentAttendance = await Attendance.findOne({
                where: {
                    course_id: course.id,
                    teacher_id: teacherId,
                    date: { [Op.gte]: threeDaysAgo }
                }
            });

            if (!recentAttendance) {
                pendingTasks.push({
                    type: 'attendance',
                    course: course.course_title,
                    message: 'Attendance not marked in last 3 days'
                });
            }
        }

        // Calculate overall attendance percentage
        const totalAttendance = await Attendance.count({
            where: {
                course_id: courseIds,
                teacher_id: teacherId
            }
        });

        const presentCount = await Attendance.count({
            where: {
                course_id: courseIds,
                teacher_id: teacherId,
                status: 'present'
            }
        });

        const attendancePercentage = totalAttendance > 0
            ? Math.round((presentCount / totalAttendance) * 100)
            : 0;

        res.json({
            success: true,
            data: {
                totalCourses: courses.length,
                todaysClasses: todaysClasses.length,
                pendingTasks: pendingTasks.length,
                attendancePercentage: `${attendancePercentage}%`,
                todaysSchedule: todaysClasses.map(t => ({
                    course: t.course.course_title,
                    code: t.course.course_code,
                    time: `${t.start_time} - ${t.end_time}`,
                    room: t.room_number
                })),
                tasks: pendingTasks
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get teacher's courses with student count
// @route   GET /api/teachers/:id/courses
// @access  Private (Teacher)
exports.getTeacherCourses = async (req, res, next) => {
    try {
        const teacherId = req.params.id;

        const courses = await Course.findAll({
            where: { teacher_id: teacherId },
            include: [{
                model: Student,
                as: 'enrolledStudents',
                through: { attributes: [] },
                attributes: ['id']
            }]
        });

        const coursesWithCount = courses.map(course => ({
            id: course.id,
            course_title: course.course_title,
            course_code: course.course_code,
            credits: course.credits,
            studentCount: course.enrolledStudents ? course.enrolledStudents.length : 0
        }));

        res.json({
            success: true,
            data: coursesWithCount
        });

    } catch (error) {
        next(error);
    }
};
