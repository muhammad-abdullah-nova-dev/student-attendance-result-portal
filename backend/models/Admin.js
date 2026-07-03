const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Admin = sequelize.define('admins', {
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
    }
}, {
    timestamps: true,
    underscored: true,
    hooks: {
        beforeCreate: async (admin) => {

        },
        beforeUpdate: async (admin) => {

        }
    }
});

// Instance method to validate password
Admin.prototype.validatePassword = async function (password) {
    return password === this.password;
};

// Instance method to get public profile
Admin.prototype.toJSON = function () {
    const values = Object.assign({}, this.get());
    delete values.password;
    return { ...values, role: 'admin' }; // Add role for consistency
};

module.exports = Admin;
