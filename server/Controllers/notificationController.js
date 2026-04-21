const Notification = require('../Model/Notification');

async function getNotifications(req, res) {
    try {
        const userId = req.user._id;
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean(),
            Notification.countDocuments({ userId, read: false }),
        ]);
        return res.json({ success: true, data: notifications, unreadCount });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function markRead(req, res) {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        await Notification.updateOne({ _id: id, userId }, { $set: { read: true } });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function markAllRead(req, res) {
    try {
        const userId = req.user._id;
        await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

async function clearRead(req, res) {
    try {
        const userId = req.user._id;
        await Notification.deleteMany({ userId, read: true });
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getNotifications, markRead, markAllRead, clearRead };
