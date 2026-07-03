const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// @desc    Get all users (from all three tables)
// @route   GET /api/users
// @access  Private (Admin/Teacher)
exports.getAllUsers = async (req, res, next) => {
    try {
        const { role, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let users = [];

        // Fetch based on role filter
        if (!role || role === 'admin') {
            const admins = await Admin.findAll();
            users = [...users, ...admins.map(a => a.toJSON())];
        }

        if (!role || role === 'teacher') {
            const teachers = await Teacher.findAll();
            users = [...users, ...teachers.map(t => t.toJSON())];
        }

        if (!role || role === 'student') {
            const students = await Student.findAll();
            users = [...users, ...students.map(s => s.toJSON())];
        }

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            users = users.filter(u =>
                u.name.toLowerCase().includes(searchLower) ||
                u.email.toLowerCase().includes(searchLower)
            );
        }

        // Apply pagination
        const totalUsers = users.length;
        const paginatedUsers = users.slice(offset, offset + parseInt(limit));

        res.json({
            success: true,
            data: paginatedUsers,
            pagination: {
                total: totalUsers,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalUsers / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get single user by ID and role
// @route   GET /api/users/:role/:id
// @access  Private
exports.getUserById = async (req, res, next) => {
    try {
        const { role, id } = req.params;
        let user = null;

        if (role === 'admin') {
            user = await Admin.findByPk(id);
        } else if (role === 'teacher') {
            user = await Teacher.findByPk(id);
        } else if (role === 'student') {
            user = await Student.findByPk(id);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
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

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin only)
exports.createUser = async (req, res, next) => {
    try {
        let { role, ...userData } = req.body;
        role = role.toLowerCase();

        // Add creator ID
        userData.created_by = req.user.id;

        let user = null;

        if (role === 'admin') {
            user = await Admin.create(userData);
        } else if (role === 'teacher') {
            user = await Teacher.create(userData);
        } else if (role === 'student') {
            // Auto-generate roll number if missing
            if (!userData.roll_number) {
                const count = await Student.count();
                const year = new Date().getFullYear();
                userData.roll_number = `STU-${year}-${(count + 1).toString().padStart(4, '0')}`;
            }
            user = await Student.create(userData);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be admin, teacher, or student'
            });
        }

        res.status(201).json({
            success: true,
            data: user.toJSON()
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Update user
// @route   PUT /api/users/:role/:id
// @access  Private (Admin/Self)
exports.updateUser = async (req, res, next) => {
    try {
        const { role, id } = req.params;
        const updateData = req.body;

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

        await user.update(updateData);

        res.json({
            success: true,
            data: user.toJSON()
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:role/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
    try {
        const { role, id } = req.params;
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

        await user.destroy();

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        next(error);
    }
};
