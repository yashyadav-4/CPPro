// if account is private than only the owner can access data or admin not anyone else (middleware for that)
const User = require('../Model/User');

async function checkPublicProfile(req, res, next) {
    const { userId } = req.params;

    if (req.user && req.user._id && req.user._id.toString() === userId) {
        return next();
    }

    if (req.user && req.user.role === 'admin') {
        return next();
    }

    try {
        const targetUser = await User.findById(userId).select('preferences').lean();
        if (!targetUser) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }
        if (!targetUser.preferences?.public) {
            return res.status(403).json({ error: 'PROFILE_PRIVATE' });
        }
        next();
    } catch (err) {
        console.error('checkPublicProfile error:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
}

module.exports = { checkPublicProfile };
