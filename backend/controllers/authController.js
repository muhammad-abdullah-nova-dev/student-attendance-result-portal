const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const { generateToken } = require('../middleware/auth');

// @desc    Login user (checks all three tables)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        let user = null;
        let role = null;

        // Check in admins table
        user = await Admin.findOne({ where: { email } });
        if (user) {
            role = 'admin';
        }

        // If not found, check teachers table
        if (!user) {
            user = await Teacher.findOne({ where: { email } });
            if (user) {
                role = 'teacher';
            }
        }

        // If not found, check students table
        if (!user) {
            user = await Student.findOne({ where: { email } });
            if (user) {
                role = 'student';
            }
        }

        // If still not found
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Validate password
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id, role);

        // Return user with role attached
        const userData = user.toJSON();

        res.json({
            success: true,
            data: {
                token,
                user: userData
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const { role, id } = req.user;
        let user = null;

        if (role === 'admin') {
            user = await Admin.findByPk(id);
        } else if (role === 'teacher') {
            user = await Teacher.findByPk(id);
        } else if (role === 'student') {
            user = await Student.findByPk(id);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.toJSON()
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password
// @access  Private
exports.resetPassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const { role, id } = req.user;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        let user = null;
        if (role === 'admin') {
            user = await Admin.findByPk(id);
        } else if (role === 'teacher') {
            user = await Teacher.findByPk(id);
        } else if (role === 'student') {
            user = await Student.findByPk(id);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validate current password
        const isValid = await user.validatePassword(currentPassword);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully'
        });

    } catch (error) {
        next(error);
    }
};
