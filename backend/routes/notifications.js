const express = require('express');
const { authenticate } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unread === 'true';

    const query = { userId: req.user._id };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications'
    });
  }
});

/**
 * @route   PUT /api/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read'
    });
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', authenticate, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all notifications as read'
    });
  }
});

/**
 * @route   DELETE /api/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:notificationId', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      userId: req.user._id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification'
    });
  }
});

module.exports = router;
