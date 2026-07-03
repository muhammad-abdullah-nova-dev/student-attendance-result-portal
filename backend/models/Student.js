const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('students', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    roll_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    semester: {
        type: DataTypes.STRING(20),
        defaultValue: 'Fall 2025'
    },
    department: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (student) => {
            // Password hashing removed as per user request
        },
        beforeUpdate: async (student) => {
            // Password hashing removed as per user request
        }
    }
});

// Instance method to validate password
Student.prototype.validatePassword = async function (password) {
    return password === this.password;
};

// Instance method to get public profile
Student.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return { ...values, role: 'student' }; // Add role for consistency
};

module.exports = Student;
