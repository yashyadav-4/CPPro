const { getUser } = require("../Services/auth");
const User = require("../Model/User");

function verifyToken(req , res , next){
    const userToken=req.cookies?.token;
    if(!userToken) return res.status(401).json({message:"Login First"});
    const user=getUser(userToken);
    if(!user) return res.status(401).json({message:"Invalid Token"});
    req.user=user;
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