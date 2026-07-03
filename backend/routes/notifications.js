const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    createNotification,
    deleteNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// Get user's notifications
router.get('/', protect, getNotifications);

// Mark notifications as read
router.put('/mark-read', protect, markAsRead);

// Create notification (Admin only)
router.post('/', protect, authorize('admin'), createNotification);

// Delete notification
router.delete('/:id', protect, deleteNotification);

module.exports = router;
