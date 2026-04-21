const { getUser } = require('../Services/auth');
const User = require('../Model/User');

// Must be logged in AND role === 'admin'
async function verifyAdmin(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: 'Login first' });

    const payload = getUser(token);
    if (!payload) return res.status(401).json({ success: false, message: 'Invalid token' });

    try {
        const user = await User.findById(payload._id).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });
        if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });

        req.user = user;
        next();
    } catch (err) {
        console.error('Admin auth error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { verifyAdmin };
