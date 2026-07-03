const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('attendances', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'teachers',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
        defaultValue: 'present',
        allowNull: false
    },
    session_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'Lecture'
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    marked_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    tableName: 'attendances',
    indexes: [
        {
            fields: ['student_id']
        },
        {
            fields: ['course_id']
        },
        {
            fields: ['teacher_id']
        },
        {
            fields: ['date']
        },
        {
            // Unique constraint: one attendance record per student per course per date
            unique: true,
            fields: ['student_id', 'course_id', 'date']
        }
    ]
});

module.exports = Attendance;
