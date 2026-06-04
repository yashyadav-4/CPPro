const { getUser } = require("../Services/auth");
const User = require("../Model/User");

// ── lastLogin throttle: at most 1 DB write per minute per user ───────────────
const lastSeenWritten = new Map();
const THROTTLE_MS = 60 * 1000;

function updateLastLogin(userId) {
    const now = Date.now();
    const last = lastSeenWritten.get(String(userId));
    if (last && now - last < THROTTLE_MS) return;
    lastSeenWritten.set(String(userId), now);
    User.findByIdAndUpdate(userId, { lastLogin: new Date(now) }).catch(() => {});
}

function verifyToken(req, res, next) {
    const userToken = req.cookies?.token;
    if (!userToken) return res.status(401).json({ message: "Login First" });
    const user = getUser(userToken);
    if (!user) return res.status(401).json({ message: "Invalid Token" });
    req.user = user;
    // Keep lastLogin fresh on every authenticated request (throttled to 1/min)
    // lastLogin is used for: online detection, Last 24h panel, retention stats
    updateLastLogin(user._id);
    next();
}

async function optionalAuth(req, res, next) {
    const token = req.cookies?.token;
    if (!token) return next();
    const payload = getUser(token);
    if (!payload) return next();
    try {
        const user = await User.findById(payload._id).select('-password');
        if (user) req.user = user;
    } catch (e) { /* treat as guest */ }
    next();
}

module.exports = { verifyToken, optionalAuth };