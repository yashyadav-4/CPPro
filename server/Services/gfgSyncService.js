const axios      = require('axios');
const User       = require('../Model/User');
const GFGData    = require('../Model/GFGData');
const ErrorLog   = require('../Model/ErrorLog');

const GFG_RELAY_URL    = (process.env.GFG_RELAY_URL    || '').replace(/\/$/, '');
const GFG_RELAY_SECRET = process.env.GFG_RELAY_SECRET  || '';

// ══════════════════════════════════════════════════════════════════════════
// fetchGfgData — pull raw stats from the GFG relay (synchronous HTTP call)
// ══════════════════════════════════════════════════════════════════════════
const fetchGfgData = async (handle) => {
    if (!GFG_RELAY_URL || !GFG_RELAY_SECRET) {
        throw new Error('GFG_RELAY_URL / GFG_RELAY_SECRET not configured');
    }
    const res = await axios.get(`${GFG_RELAY_URL}/api/gfg`, {
        params:  { handle },
        headers: { 'x-api-key': GFG_RELAY_SECRET },
        timeout: 15_000,
    });
    return res.data;
};

// ══════════════════════════════════════════════════════════════════════════
// syncGfgProfile — fetch + upsert GFGData document for a user
// ══════════════════════════════════════════════════════════════════════════
const syncGfgProfile = async (userId, handle) => {
    if (!GFG_RELAY_URL || !GFG_RELAY_SECRET) {
        throw new Error('GFG_RELAY_URL / GFG_RELAY_SECRET not configured');
    }

    let relayData;
    try {
        const res = await fetchGfgData(handle);
        if (!res.success || !res.data) throw new Error('GFG relay returned no data');
        relayData = res.data;
    } catch (err) {
        const code = err.response?.data?.error;
        if (code === 'USER_NOT_FOUND') {
            throw new Error('invalid geeksforgeeks handle');
        }
        ErrorLog.create({
            source: 'GFG-Sync-Service',
            level:  'error',
            message: `[GFG_FETCH_FAILED] handle=${handle} | userId=${userId} | reason=${err.message}`,
        }).catch(() => {});
        throw new Error(`GFG relay failed: ${err.message}`);
    }

    // Upsert into gfgdatas collection
    await GFGData.findOneAndUpdate(
        { userId },
        {
            $set: {
                gfgHandle:          handle,
                codingScore:        relayData.codingScore   ?? 0,
                monthlyScore:       relayData.monthlyScore  ?? 0,
                totalSolved:        relayData.totalSolved   ?? 0,
                instituteRank:      relayData.instituteRank ?? 0,
                institution:        relayData.institution   ?? '',
                solvedByDifficulty: {
                    school: relayData.solvedByDifficulty?.school ?? 0,
                    basic:  relayData.solvedByDifficulty?.basic  ?? 0,
                    easy:   relayData.solvedByDifficulty?.easy   ?? 0,
                    medium: relayData.solvedByDifficulty?.medium ?? 0,
                    hard:   relayData.solvedByDifficulty?.hard   ?? 0,
                },
                lastSyncedAt: new Date(),
            },
        },
        { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(userId, { $set: { lastGfgUpdate: new Date() } });
    console.log(`[GFG-SYNC] >> ${handle} | sync done ✓`);
    return { success: true };
};

module.exports = { fetchGfgData, syncGfgProfile };
