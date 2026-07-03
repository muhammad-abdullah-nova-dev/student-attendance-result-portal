const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Get all users (merged from all tables)
router.get('/', protect, authorize('admin', 'teacher'), getAllUsers);

// Create new user
router.post('/', protect, authorize('admin'), createUser);

// Get user by role and ID
router.get('/:role/:id', protect, getUserById);

// Update user by role and ID
router.put('/:role/:id', protect, updateUser);

// Delete user by role and ID
router.delete('/:role/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
