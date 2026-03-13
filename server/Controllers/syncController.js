const User= require('../Model/User');
const Platform= require('../Model/Platform');
const syncservice = require('../Services/syncService');

async function handleManualRefresh(req , res){
    try{

        const userId= req.user._id;
        const user= await User.findById(userId);

        if(!user || !user.linkedAccounts || !user.linkedAccounts.codeforces){
            return res.status(400).json({success:false , message:"no codeforces account linked"})
        }
        const handle=user.linkedAccounts.codeforces;


        const platformDoc= await Platform.findOne({userId:userId, platform:'codeforces'});
        if(platformDoc && platformDoc.lastSyncedAt){
            const THIRTY_MINUTES= 5*1000; // set to 30*60*1000 for 30 minn later after testing
            const now = new Date();
            const timeSinceLastSync = now - platformDoc.lastSyncedAt;

            if(timeSinceLastSync < THIRTY_MINUTES){
                const minutesLeft= Math.ceil((THIRTY_MINUTES - timeSinceLastSync)/60000);
                return res.status(429).json({
                    success:false,
                    message:`you can only manually fresh after every 30 minutes , please refresh after : ${minutesLeft}`
                });
            }
        }

        await syncservice.syncCodeforcesProfile(userId , handle);
        return  res.status(200).json({
            success:true,
            message:"Profile updated successfully"
        })
    }
    catch(error){
        console.error("manual sync error:" , error);
        if(error.status===429){
            return res.status(429).json({success: false , message:"codeforces is rate limiting us T-T , will try to improve you please try again later"})  
        }
        return res.status(500).json({success: false,message: "internal server  error duriing sync"});
    }
}

module.exports= {handleManualRefresh};
