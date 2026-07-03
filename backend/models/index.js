const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Teacher = require('./Teacher');
const Student = require('./Student');
const Course = require('./Course');
const Timetable = require('./Timetable');
const Attendance = require('./Attendance');
const Result = require('./Result');
const Notification = require('./Notification');
const Enrollment = require('./Enrollment');

// Course-Teacher Association
Teacher.hasMany(Course, { foreignKey: 'teacher_id', as: 'courses' });
Course.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// Timetable Associations
Course.hasMany(Timetable, { foreignKey: 'course_id', as: 'schedule' });
Timetable.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Teacher.hasMany(Timetable, { foreignKey: 'teacher_id', as: 'schedule' });
Timetable.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// Attendance Associations
Student.hasMany(Attendance, { foreignKey: 'student_id', as: 'attendance' });
Attendance.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Course.hasMany(Attendance, { foreignKey: 'course_id', as: 'attendance' });
Attendance.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Teacher.hasMany(Attendance, { foreignKey: 'teacher_id', as: 'marked_attendance' });
Attendance.belongsTo(Teacher, { foreignKey: 'teacher_id', as: 'teacher' });

// Result Associations
Student.hasMany(Result, { foreignKey: 'student_id', as: 'results' });
Result.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Course.hasMany(Result, { foreignKey: 'course_id', as: 'results' });
Result.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

Teacher.hasMany(Result, { foreignKey: 'uploaded_by', as: 'uploaded_results' });
Result.belongsTo(Teacher, { foreignKey: 'uploaded_by', as: 'uploader' });

// Admin Associations (Created By)
Admin.hasMany(Teacher, { foreignKey: 'created_by', as: 'created_teachers' });
Teacher.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

Admin.hasMany(Student, { foreignKey: 'created_by', as: 'created_students' });
Student.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

Admin.hasMany(Course, { foreignKey: 'created_by', as: 'created_courses' });
Course.belongsTo(Admin, { foreignKey: 'created_by', as: 'creator' });

// Enrollment Associations (Many-to-Many: Student <-> Course)
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'student_id', as: 'enrolledCourses' });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'course_id', as: 'enrolledStudents' });

Student.hasMany(Enrollment, { foreignKey: 'student_id', as: 'enrollments' });
Enrollment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

Course.hasMany(Enrollment, { foreignKey: 'course_id', as: 'enrollments' });
Enrollment.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

module.exports = {
    sequelize,
    Admin,
    Teacher,
    Student,
    Course,
    Timetable,
    Attendance,
    Result,
    Notification,
    Enrollment
};
