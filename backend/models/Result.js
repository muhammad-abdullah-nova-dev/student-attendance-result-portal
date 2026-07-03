const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Result = sequelize.define('results', {
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
    assessment_type: {
        type: DataTypes.ENUM('Midterm', 'Final', 'Quiz', 'Assignment', 'Project', 'Lab'),
        allowNull: false
    },
    assessment_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    marks_obtained: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    total_marks: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    percentage: {
        type: DataTypes.VIRTUAL,
        get() {
            const obtained = parseFloat(this.getDataValue('marks_obtained'));
            const total = parseFloat(this.getDataValue('total_marks'));
            return total > 0 ? Math.round((obtained / total) * 100 * 100) / 100 : 0;
        }
    },
    grade: {
        type: DataTypes.STRING(5),
        allowNull: true
    },
    uploaded_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'teachers',
            key: 'id'
        }
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'results',
    indexes: [
        {
            fields: ['student_id']
        },
        {
            fields: ['course_id']
        },
        {
            fields: ['assessment_type']
        }
    ],
    hooks: {
        beforeSave: (result) => {
            // Auto-calculate grade based on percentage
            const percentage = result.percentage;

            if (percentage >= 90) result.grade = 'A+';
            else if (percentage >= 85) result.grade = 'A';
            else if (percentage >= 80) result.grade = 'A-';
            else if (percentage >= 75) result.grade = 'B+';
            else if (percentage >= 70) result.grade = 'B';
            else if (percentage >= 65) result.grade = 'B-';
            else if (percentage >= 60) result.grade = 'C+';
            else if (percentage >= 55) result.grade = 'C';
            else if (percentage >= 50) result.grade = 'D';
            else result.grade = 'F';
        }
    }
});

module.exports = Result;
