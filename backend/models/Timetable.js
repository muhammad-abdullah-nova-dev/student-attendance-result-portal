const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Timetable = sequelize.define('timetable', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'courses',  // Fixed: matches SQL schema
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    teacher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'teachers',  // Fixed: matches SQL schema
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    day_of_week: {  // Fixed: was 'day', now matches SQL
        type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'),
        allowNull: false
    },
    time_from: {
        type: DataTypes.TIME,
        allowNull: false
    },
    time_to: {
        type: DataTypes.TIME,
        allowNull: false
    },
    room_number: {  // Fixed: was 'room_no', now matches SQL
        type: DataTypes.STRING(20),
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true
});

module.exports = Timetable;

