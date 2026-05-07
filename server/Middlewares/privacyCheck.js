const User = require('../Model/User');

/**
 * Middleware: allow the request if the caller is the data owner,
 * or if the target user's profile is public.
 * Expects `req.params.userId` and (optionally) `req.user` from optionalAuth.
 */
async function checkPublicProfile(req, res, next) {
    const { userId } = req.params;

    //owner can always see their own data
    if (req.user && req.user._id && req.user._id.toString() === userId) {
        return next();
    }

    // admins can always access any profile
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
