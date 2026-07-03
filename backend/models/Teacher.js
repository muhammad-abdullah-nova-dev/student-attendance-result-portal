const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Teacher = sequelize.define('teachers', {
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
    department: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    designation: {
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
        beforeCreate: async (teacher) => {
            // Password hashing removed as per user request
        },
        beforeUpdate: async (teacher) => {
            // Password hashing removed as per user request
        }
    }
});

// Instance method to validate password
Teacher.prototype.validatePassword = async function (password) {
    return password === this.password;
};

// Instance method to get public profile
Teacher.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return { ...values, role: 'teacher' }; // Add role for consistency
};

module.exports = Teacher;
