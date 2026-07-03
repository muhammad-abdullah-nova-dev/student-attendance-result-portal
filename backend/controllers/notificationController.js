const Notification = require('../models/Notification');
const { Op } = require('sequelize');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res, next) => {
    try {
        const { limit = 20, page = 1, type, is_read } = req.query;
        const offset = (page - 1) * limit;

        const where = {
            user_id: req.user.id,
            user_role: req.user.role
        };

        if (type) where.type = type;
        if (is_read !== undefined) where.is_read = is_read === 'true';

        const notifications = await Notification.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['created_at', 'DESC']]
        });

        // Count unread
        const unreadCount = await Notification.count({
            where: {
                user_id: req.user.id,
                user_role: req.user.role,
                is_read: false
            }
        });

        res.json({
            success: true,
            data: {
                notifications: notifications.rows,
                unread_count: unreadCount,
                total: notifications.count,
                page: parseInt(page),
                pages: Math.ceil(notifications.count / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark notification(s) as read
// @route   PUT /api/notifications/mark-read
// @access  Private
exports.markAsRead = async (req, res, next) => {
    try {
        const { notification_ids } = req.body; // Array of IDs or 'all'

        if (notification_ids === 'all') {
            // Mark all user's notifications as read
            await Notification.update(
                { is_read: true, read_at: new Date() },
                {
                    where: {
                        user_id: req.user.id,
                        user_role: req.user.role,
                        is_read: false
                    }
                }
            );

            return res.json({
                success: true,
                message: 'All notifications marked as read'
            });
        }

        if (!Array.isArray(notification_ids)) {
            return res.status(400).json({
                success: false,
                message: 'notification_ids must be an array or "all"'
            });
        }

        // Mark specific notifications as read
        await Notification.update(
            { is_read: true, read_at: new Date() },
            {
                where: {
                    id: { [Op.in]: notification_ids },
                    user_id: req.user.id,
                    user_role: req.user.role
                }
            }
        );

        res.json({
            success: true,
            message: `${notification_ids.length} notifications marked as read`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create notification (System use)
// @route   POST /api/notifications
// @access  Private (Admin)
exports.createNotification = async (req, res, next) => {
    try {
        const { user_id, user_role, type, title, message, link } = req.body;

        if (!user_id || !user_role || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const notification = await Notification.create({
            user_id,
            user_role,
            type: type || 'system',
            title,
            message,
            link
        });

        // Emit Socket.IO event
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${user_id}`).emit('notification:new', notification);
        }

        res.status(201).json({
            success: true,
            message: 'Notification created',
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            where: {
                id,
                user_id: req.user.id,
                user_role: req.user.role
            }
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.destroy();

        res.json({
            success: true,
            message: 'Notification deleted'
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to create bulk notifications
exports.createBulkNotifications = async (users, type, title, message, link = null) => {
    const notifications = users.map(user => ({
        user_id: user.id,
        user_role: user.role,
        type,
        title,
        message,
        link
    }));

    return await Notification.bulkCreate(notifications);
};

module.exports = exports;
