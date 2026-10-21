import { Notification } from '../models/Notification.js';

export async function getNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;
    const query = { organization: req.organizationId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      organization: req.organizationId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationAsRead(req, res, next) {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      organization: req.organizationId,
    });
    if (!notification) {
      return res.status(404).json({ success: false, error: { message: 'Notification not found.' } });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { organization: req.organizationId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
}
