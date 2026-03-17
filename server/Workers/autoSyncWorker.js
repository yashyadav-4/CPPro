const User=require('../Model/User');
const Platform = require('../Model/Platform')
const syncService= require('../Services/syncService');

const delay = (ms)=> new Promise(resolve=> setTimeout(resolve , ms));

const startContinuousSync= async()=>{
    console.log("[WORKER] continuous low-priority background sync started");
    while (true) {
        try {
            const users = await User.find({ 
                "linkedAccounts.codeforces": { $exists: true, $ne: "" } 
            });

            if (users.length === 0) {
                await delay(60000); 
                continue;
            }

            for (let user of users) {
                const handle = user.linkedAccounts.codeforces.trim();

                const platformDoc = await Platform.findOne({ userId: user._id, platform: 'codeforces' });

                if (platformDoc && platformDoc.lastSyncedAt) {
                    const TWO_HOURS = 2 * 60 * 60 * 1000;
                    const timeSinceLastSync = new Date() - platformDoc.lastSyncedAt;
                    if (timeSinceLastSync < TWO_HOURS) {
                        continue; 
                    }
                }

                try {
                    await syncService.syncCodeforcesProfile(user._id, handle, 'low');
                } catch (err) {
                    console.error(`[WORKER] failed to sync ${handle}: `, err.message);
                }

                await delay(2100); 
            }
            console.log("[WORKER] finished checking all users , sleeping for 5 minutes...");
            await delay(5 * 60 * 1000); 
        } catch (error) {
            console.error("[WORKER] fatal error in auto-sync loop:", error);
            await delay(10000);
        }
    }
}

module.exports={startContinuousSync};