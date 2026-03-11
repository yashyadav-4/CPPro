const { getUser } = require("../Services/auth");

function verifyToken(req , res , next){
    const userToken=req.cookies?.token;
    if(!userToken) return res.status(401).json({message:"Login First"});
    const user=getUser(userToken);
    if(!user) return res.status(401).json({message:"Invalid Token"});
    req.user=user;
    next();
}

module.exports={
    verifyToken,
}