const User = require('../Model/User');

/**
 * GET /api/users/:username/profile
 * Public — no auth required (uses optionalAuth).
 * Resolves a username to a userId + safe public fields.
 * Admins bypass the privacy check.
 */
async function getUserPublicProfile(req, res) {
    try {
        const { username } = req.params;

        //case-insensitive exact match
        const user = await User.findOne({
            username: new RegExp(`^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        })
            .select('username name profilePic linkedAccounts college location preferences')
            .lean();

        if (!user) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }

        const isAdmin = req.user && req.user.role === 'admin';
        const isOwner = req.user && req.user._id && req.user._id.toString() === user._id.toString();

        if (!user.preferences?.public && !isAdmin && !isOwner) {
            return res.status(403).json({ error: 'PROFILE_PRIVATE' });
        }

        return res.status(200).json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                name: user.name,
                profilePic: user.profilePic || '',
                linkedAccounts: {
                    codeforces: user.linkedAccounts?.codeforces || '',
                    leetcode: user.linkedAccounts?.leetcode || '',
                    codechef: user.linkedAccounts?.codechef || '',
                },
                college: user.college || '',
                location: user.location || {},
                preferences: { public: !!user.preferences?.public },
            },
        });
    } catch (err) {
        console.error('getUserPublicProfile error:', err);
        return res.status(500).json({ error: 'INTERNAL_ERROR' });
    }
}

module.exports = { getUserPublicProfile };
