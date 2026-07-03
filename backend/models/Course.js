const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('courses', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    course_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    course_title: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    credit_hours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'teachers',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Course;
