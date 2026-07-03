const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');

// Generate JWT Token with role
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },  // Include role in token payload
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user based on role from token
            let user = null;
            if (decoded.role === 'admin') {
                user = await Admin.findByPk(decoded.id);
            } else if (decoded.role === 'teacher') {
                user = await Teacher.findByPk(decoded.id);
            } else if (decoded.role === 'student') {
                user = await Student.findByPk(decoded.id);
            }

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Attach user with role to request
            req.user = { ...user.toJSON(), id: decoded.id, role: decoded.role };
            next();

        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, no token'
        });
    }
};

// Authorize specific roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user?.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = {
    generateToken,
    protect,
    authorize
};
