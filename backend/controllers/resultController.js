const { Result, Student, Course, Teacher } = require('../models');
const { Op } = require('sequelize');

// Helper function to calculate grade
function calculateGrade(marksObtained, totalMarks) {
    const percentage = (marksObtained / totalMarks) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'B-';
    if (percentage >= 60) return 'C+';
    if (percentage >= 55) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
}

// @desc    Get student results with CGPA
// @route   GET /api/results/student/:id
// @access  Private
exports.getStudentResults = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get all results for this student
        const results = await Result.findAll({
            where: { student_id: id },
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'course_title', 'course_code', 'credit_hours']
                },
                {
                    model: Teacher,
                    as: 'uploader',
                    attributes: ['id', 'name']
                }
            ],
            order: [['created_at', 'DESC']]
        });

        // Calculate CGPA
        let totalWeightedGradePoints = 0;
        let totalCredits = 0;

        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0,
            'D': 1.0, 'F': 0.0
        };

        results.forEach(result => {
            const creditHours = result.course.credit_hours || 3;
            const gp = gradePoints[result.grade] || 0;
            totalWeightedGradePoints += gp * creditHours;
            totalCredits += creditHours;
        });

        const cgpa = totalCredits > 0 ? (totalWeightedGradePoints / totalCredits).toFixed(2) : 0.0;

        res.json({
            success: true,
            data: {
                student_id: parseInt(id),
                cgpa: parseFloat(cgpa),
                total_credits: totalCredits,
                results: results
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create/Update single result
// @route   POST /api/results
// @access  Private (Teacher/Admin)
exports.createResult = async (req, res, next) => {
    try {
        const { student_id, course_id, assessment_type, assessment_name, marks_obtained, total_marks, remarks } = req.body;

        if (!student_id || !course_id || !assessment_type || marks_obtained === undefined || total_marks === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const uploaded_by = req.user.id;

        // Calculate grade automatically
        const grade = calculateGrade(marks_obtained, total_marks);

        const result = await Result.create({
            student_id,
            course_id,
            assessment_type,
            assessment_name,
            marks_obtained,
            total_marks,
            grade,
            uploaded_by,
            remarks
        });

        res.status(201).json({
            success: true,
            message: 'Result created successfully',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload assessments (Bulk)
// @route   POST /api/results/assessments
// @access  Private (Teacher/Admin)
exports.uploadAssessments = async (req, res, next) => {
    try {
        const { course_id, assessment_type, assessment_name, total_marks, results_data } = req.body;

        if (!course_id || !assessment_type || !total_marks || !Array.isArray(results_data)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide course_id, assessment_type, total_marks, and results_data array'
            });
        }

        const uploaded_by = req.user.id;
        const created = [];
        const updated = [];

        for (const data of results_data) {
            const { student_id, marks_obtained } = data;

            // Calculate grade
            const grade = calculateGrade(marks_obtained, total_marks);

            // Check if result already exists for this student/course/assessment
            const existing = await Result.findOne({
                where: {
                    student_id,
                    course_id,
                    assessment_type,
                    assessment_name: assessment_name || null
                }
            });

            if (existing) {
                // Update existing
                await existing.update({
                    marks_obtained,
                    total_marks,
                    grade,
                    uploaded_by
                });
                updated.push(existing);
            } else {
                // Create new
                const newResult = await Result.create({
                    student_id,
                    course_id,
                    assessment_type,
                    assessment_name,
                    marks_obtained,
                    total_marks,
                    grade,
                    uploaded_by
                });
                created.push(newResult);
            }
        }

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            const student_ids = results_data.map(r => r.student_id);

            // Notify all affected students
            student_ids.forEach(sid => {
                io.to(`user-${sid}`).emit('results:updated', {
                    course_id,
                    assessment_type,
                    message: 'New results uploaded'
                });
            });

            // Notify admins
            io.to('admin').emit('results:uploaded', {
                course_id,
                assessment_type,
                student_count: student_ids.length,
                uploaded_by: req.user.name
            });
        }

        res.json({
            success: true,
            message: `Uploaded ${created.length + updated.length} results`,
            data: {
                created: created.length,
                updated: updated.length,
                total: created.length + updated.length
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get performance analysis
// @route   GET /api/results/performance-analysis
// @access  Private (Admin)
exports.getPerformanceAnalysis = async (req, res, next) => {
    try {
        const allResults = await Result.findAll({
            include: [
                {
                    model: Student,
                    as: 'student',
                    attributes: ['id', 'name']
                }
            ]
        });

        const total_results = allResults.length;
        const passed = allResults.filter(r => r.grade !== 'F').length;
        const failed = allResults.filter(r => r.grade === 'F').length;

        // Grade distribution
        const gradeDistribution = {};
        const gradePoints = {
            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
            'C+': 2.3, 'C': 2.0,
            'D': 1.0, 'F': 0.0
        };

        allResults.forEach(r => {
            gradeDistribution[r.grade] = (gradeDistribution[r.grade] || 0) + 1;
        });

        // Calculate average GPA
        let totalGP = 0;
        allResults.forEach(r => {
            totalGP += gradePoints[r.grade] || 0;
        });
        const average_gpa = total_results > 0 ? (totalGP / total_results).toFixed(2) : 0.0;

        res.json({
            success: true,
            data: {
                total_results,
                passed,
                failed,
                pass_rate: total_results > 0 ? Math.round((passed / total_results) * 100) : 0,
                average_gpa: parseFloat(average_gpa),
                grade_distribution: gradeDistribution
            }
        });
    } catch (error) {
        next(error);
    }
};
