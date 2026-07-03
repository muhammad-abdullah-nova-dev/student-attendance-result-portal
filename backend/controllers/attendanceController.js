const { Attendance, Student, Course, Teacher, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Mark attendance (Bulk insert/update)
// @route   POST /api/attendance
// @access  Private (Teacher/Admin)
exports.markAttendance = async (req, res, next) => {
    try {
        const { course_id, date, session_type, attendance_records } = req.body;

        // Validate input
        if (!course_id || !date || !Array.isArray(attendance_records)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide course_id, date, and attendance_records array'
            });
        }

        const teacher_id = req.user.id;
        const results = [];

        // Process each attendance record
        for (const record of attendance_records) {
            const { student_id, status } = record;

            // Upsert: Update if exists, create if doesn't
            const [attendance, created] = await Attendance.findOrCreate({
                where: {
                    student_id,
                    course_id,
                    date
                },
                defaults: {
                    teacher_id,
                    status,
                    session_type: session_type || 'Lecture',
                    marked_at: new Date()
                }
            });

            // If record already existed, update it
            if (!created) {
                await attendance.update({
                    status,
                    session_type: session_type || 'Lecture',
                    marked_at: new Date()
                });
            }

            results.push({
                student_id,
                status: created ? 'created' : 'updated'
            });
        }

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            const student_ids = attendance_records.map(r => r.student_id);

            // Notify all affected students
            student_ids.forEach(sid => {
                io.to(`user-${sid}`).emit('attendance:updated', {
                    course_id,
                    date,
                    message: 'New attendance record marked'
                });
            });

            // Notify teachers and admins
            io.to('teacher').to('admin').emit('attendance:marked', {
                course_id,
                date,
                student_count: student_ids.length,
                marked_by: req.user.name
            });
        }

        res.json({
            success: true,
            message: `Attendance marked for ${results.length} students`,
            data: {
                course_id,
                date,
                processed: results.length,
                results
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance records with filters
// @route   GET /api/attendance?course_id=1&date=2025-01-01&student_id=1
// @access  Private
exports.getAttendance = async (req, res, next) => {
    try {
        const { course_id, date, student_id, status, limit = 50, page = 1 } = req.query;

        const where = {};

        if (course_id) where.course_id = course_id;
        if (date) where.date = date;
        if (student_id) where.student_id = student_id;
        if (status) where.status = status;

        const offset = (page - 1) * limit;

        const { count, rows } = await Attendance.findAndCountAll({
            where,
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'name', 'email', 'roll_number']
                },
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'course_title', 'course_code']
                },
                {
                    model: Teacher,
                    as: 'teacher',
                    attributes: ['id', 'name']
                }
            ],
            limit: parseInt(limit),
            offset,
            order: [['date', 'DESC'], ['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance report for student
// @route   GET /api/attendance/report/:student_id
// @access  Private
exports.getAttendanceReport = async (req, res, next) => {
    try {
        const { student_id } = req.params;

        // Get all attendance records for this student
        const attendanceRecords = await Attendance.findAll({
            where: { student_id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'course_title', 'course_code', 'credit_hours']
                }
            ],
            order: [['date', 'DESC']]
        });

        // Calculate overall stats
        const total_classes = attendanceRecords.length;
        const attended = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const overall_percentage = total_classes > 0 ? Math.round((attended / total_classes) * 100) : 0;

        // Group by course
        const courseMap = {};
        attendanceRecords.forEach(record => {
            const courseId = record.course_id;
            if (!courseMap[courseId]) {
                courseMap[courseId] = {
                    course_id: courseId,
                    course_title: record.course.course_title,
                    course_code: record.course.course_code,
                    credit_hours: record.course.credit_hours,
                    total_classes: 0,
                    attended: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    percentage: 0
                };
            }

            courseMap[courseId].total_classes++;
            if (record.status === 'present') courseMap[courseId].attended++;
            else if (record.status === 'absent') courseMap[courseId].absent++;
            else if (record.status === 'late') {
                courseMap[courseId].attended++;
                courseMap[courseId].late++;
            }
            else if (record.status === 'excused') courseMap[courseId].excused++;
        });

        // Calculate percentages for each course
        const courses = Object.values(courseMap).map(course => {
            course.percentage = course.total_classes > 0
                ? Math.round((course.attended / course.total_classes) * 100)
                : 0;
            return course;
        });

        res.json({
            success: true,
            data: {
                student_id: parseInt(student_id),
                overall_percentage,
                total_classes,
                attended,
                absent: attendanceRecords.filter(r => r.status === 'absent').length,
                courses
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get monthly attendance stats (for charts)
// @route   GET /api/attendance/monthly-stats
// @access  Private (Admin/Teacher)
exports.getMonthlyStats = async (req, res, next) => {
    try {
        const { year = new Date().getFullYear() } = req.query;

        // Get total records per month
        const totalStats = await Attendance.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('date')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'total']
            ],
            where: sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), year),
            group: [sequelize.fn('MONTH', sequelize.col('date'))]
        });

        // Get present records per month
        const presentStats = await Attendance.findAll({
            attributes: [
                [sequelize.fn('MONTH', sequelize.col('date')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'present']
            ],
            where: {
                [Op.and]: [
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), year),
                    { status: 'present' }
                ]
            },
            group: [sequelize.fn('MONTH', sequelize.col('date'))]
        });

        // Map to 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedData = months.map((monthName, index) => {
            const monthNum = index + 1;

            const totalRecord = totalStats.find(s => s.get('month') === monthNum);
            const presentRecord = presentStats.find(s => s.get('month') === monthNum);

            const total = totalRecord ? parseInt(totalRecord.get('total')) : 0;
            const present = presentRecord ? parseInt(presentRecord.get('present')) : 0;

            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            return {
                month: monthName,
                percentage: percentage
            };
        });

        res.json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get attendance alerts (low attendance warnings)
// @route   GET /api/attendance/alerts
// @access  Private (Admin)
exports.getAttendanceAlerts = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find students with low attendance in last 30 days
        const lowAttendanceStudents = await sequelize.query(`
            SELECT 
                s.id,
                s.name,
                s.roll_number,
                COUNT(*) as total_sessions,
                SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present_count,
                ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as attendance_percentage
            FROM students s
            INNER JOIN attendance a ON s.id = a.student_id
            WHERE a.date >= :thirtyDaysAgo
            GROUP BY s.id, s.name, s.roll_number
            HAVING attendance_percentage < 75
            ORDER BY attendance_percentage ASC
            LIMIT 10
        `, {
            replacements: { thirtyDaysAgo },
            type: sequelize.QueryTypes.SELECT
        });

        const alerts = lowAttendanceStudents.map(student => ({
            severity: student.attendance_percentage < 50 ? 'critical' : 'warning',
            title: `Low Attendance Alert`,
            message: `${student.name} (${student.roll_number}) has ${student.attendance_percentage}% attendance`,
            timeAgo: 'Recent',
            studentId: student.id
        }));

        res.json({
            success: true,
            data: alerts
        });

    } catch (error) {
        next(error);
    }
};
