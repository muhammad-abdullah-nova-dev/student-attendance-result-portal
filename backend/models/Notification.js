const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('notifications', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Student/Teacher/Admin ID'
    },
    user_role: {
        type: DataTypes.ENUM('student', 'teacher', 'admin'),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('result', 'attendance', 'announcement', 'alert', 'system'),
        allowNull: false,
        defaultValue: 'system'
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    link: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Optional link to related page'
    },
    is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    read_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Notification;
