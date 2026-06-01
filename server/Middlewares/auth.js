const { getUser } = require("../Services/auth");
const User = require("../Model/User");

// In-memory throttle: track last DB write per userId (once per 60s)
const lastSeenWritten = new Map();
const LAST_SEEN_THROTTLE_MS = 60 * 1000; // 1 minute

function updateLastSeen(userId) {
    const now = Date.now();
    const last = lastSeenWritten.get(String(userId));
    if (last && now - last < LAST_SEEN_THROTTLE_MS) return; // skip — too soon
    lastSeenWritten.set(String(userId), now);
    // Fire-and-forget — don't block the request
    User.findByIdAndUpdate(userId, { lastSeen: new Date(now) }).catch(() => {});
}

function verifyToken(req , res , next){
    const userToken=req.cookies?.token;
    if(!userToken) return res.status(401).json({message:"Login First"});
    const user=getUser(userToken);
    if(!user) return res.status(401).json({message:"Invalid Token"});
    req.user=user;
    // Update lastSeen in the background (throttled)
    updateLastSeen(user._id);
    next();
}

async function optionalAuth(req, res, next){
    const token = req.cookies?.token;
    if(!token) return next();
    const payload = getUser(token);
    if(!payload) return next();
    try{
        const user = await User.findById(payload._id).select('-password');
        if(user) req.user = user;
    }catch(e){ /* treat as guest */ }
    next();
}

module.exports={
    verifyToken,
    optionalAuth,
}