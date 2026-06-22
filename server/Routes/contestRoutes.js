// Routes/contestRoutes.js
// Read-only route — serves contests directly from MongoDB.
// The contestSyncWorker populates and refreshes the DB every 6 hours.
const express = require('express');
const Contest = require('../Model/Contest');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');
const LeetCodeData = require('../Model/LeetCodeData');
const { optionalAuth, verifyToken } = require('../Middlewares/auth');
const { getCache, setCache } = require('../Utils/redisClient');

const router  = express.Router();

const WINDOW_BACK_MS    = 180 * 24 * 3600 * 1000; // 180 days back (6 months)
const WINDOW_FORWARD_MS = 30 * 24 * 3600 * 1000; // 30 days forward

router.get('/', optionalAuth, async (req, res) => {
    try {
        const now  = new Date();
        const from = new Date(now.getTime() - WINDOW_BACK_MS);
        const to   = new Date(now.getTime() + WINDOW_FORWARD_MS);

        let contests = await getCache('contests:list');
        
        if (!contests) {
            contests = await Contest
                .find({ startTime: { $gte: from, $lte: to }, creatorId: null })
                .sort({ startTime: 1 })
                .select('-__v -createdAt -updatedAt')
                .lean();

            // Deduplicate contests with the same URL
            const uniqueContests = [];
            const seenUrls = new Set();
            for (const c of contests) {
                if (c.url && seenUrls.has(c.url)) continue;
                if (c.url) seenUrls.add(c.url);
                uniqueContests.push(c);
            }
            contests = uniqueContests;

            // Filter out AtCoder contests with Japanese/Chinese/CJK characters in name
            const CJK_RE = /[\u3000-\u9fff\uac00-\ud7af\uf900-\ufaff]/;
            contests = contests.filter(c => c.platform !== 'atcoder' || !CJK_RE.test(c.name));

            // Deduplicate AtCoder division contests (Div.1/Div.2/Div.3 etc. same start time)
            const AC_DIV_RE = /[\s\-–]*(div(ision)?\.?\s*\d+)$/i;
            const acSeen = new Map();
            const nonAc = contests.filter(c => c.platform !== 'atcoder');
            const acOnly = contests.filter(c => c.platform === 'atcoder');
            for (const c of acOnly) {
                const dateStr = new Date(c.startTime).toISOString().substring(0, 10);
                const baseKey = c.name.replace(AC_DIV_RE, '').trim().toLowerCase() + '::' + dateStr;
                if (!acSeen.has(baseKey)) {
                    acSeen.set(baseKey, c);
                } else {
                    const existing = acSeen.get(baseKey);
                    const cIsMain  = !AC_DIV_RE.test(c.name);
                    const cIsDiv1  = /div(ision)?\.?\s*1$/i.test(c.name);
                    const exIsMain = !AC_DIV_RE.test(existing.name);
                    if (!exIsMain && (cIsMain || cIsDiv1)) acSeen.set(baseKey, c);
                }
            }
            contests = [...nonAc, ...Array.from(acSeen.values())]
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            
            await setCache('contests:list', contests, 6 * 3600); // 6 hours
        } else {
            // Restore Date objects from JSON stringified cache
            contests.forEach(c => {
                c.startTime = new Date(c.startTime);
                c.endTime = new Date(c.endTime);
            });
        }


        // ── Personalized Analytics (In-Memory Aggregate) ────────────────────
        if (req.user) {
            const userId = req.user._id;

            // Fetch the user's private custom contests and append them
            const customContests = await Contest.find({
                creatorId: userId,
                startTime: { $gte: from, $lte: to }
            }).select('-__v -createdAt -updatedAt').lean();

            if (customContests.length > 0) {
                contests = [...contests, ...customContests].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            }

            // 1. O(1) query for Platform ratedHistory
            const platforms = await Platform.find({ userId }).select('platform ratedHistory').lean();
            const lcData = await LeetCodeData.findOne({ userId }).select('contestHistory').lean();
            
            // Map: platform -> contestName -> { rank, solvedCount }
            const attemptMap = { codeforces: {}, leetcode: {} };

            // Codeforces
            platforms.forEach(p => {
                const platKey = p.platform;
                if (!attemptMap[platKey]) attemptMap[platKey] = {};
                if (p.ratedHistory) {
                    p.ratedHistory.forEach(h => {
                        if (h.contestName) {
                            attemptMap[platKey][h.contestName.trim().toLowerCase()] = { rank: h.rank || null };
                        }
                        if (h.contestCode) {
                            attemptMap[platKey][h.contestCode.trim().toLowerCase()] = { rank: h.rank || null };
                        }
                    });
                }
            });

            // LeetCode
            if (lcData && lcData.contestHistory) {
                lcData.contestHistory.forEach(h => {
                    if (h.contestTitle) {
                        attemptMap.leetcode[h.contestTitle.trim().toLowerCase()] = {
                            rank: h.ranking || null,
                            solvedCount: h.problemsSolved || 0
                        };
                    }
                });
            }

            // 2. Fetch all AC submissions in window for Codeforces & CodeChef (LC gives solved natively)
            const submissions = await Submission.find({
                userId,
                platform: { $in: ['codeforces', 'codechef'] },
                verdict: 'AC',
                submittedAt: { $gte: from, $lte: to }
            }).select('platform submittedAt contestId').lean();

            const subsByPlatform = { codeforces: [], codechef: [] };
            submissions.forEach(sub => {
                if (subsByPlatform[sub.platform]) {
                    subsByPlatform[sub.platform].push({
                        time: sub.submittedAt.getTime(),
                        contestId: sub.contestId
                    });
                }
            });

            // 3. Map memory records to global contests strictly
            contests = contests.map(c => {
                const platMaps = attemptMap[c.platform] || {};
                const nameKey = (c.name || '').trim().toLowerCase();
                let attemptInfo = platMaps[nameKey];

                // CodeChef fallback: match by contestCode from URL
                if (!attemptInfo && c.platform === 'codechef' && c.url) {
                    const codeMatch = c.url.match(/codechef\.com\/(.+)$/i);
                    if (codeMatch && codeMatch[1]) {
                        const baseCode = codeMatch[1].trim().toLowerCase();
                        // CodeChef adds division letters (A/B/C/D) to user attempts (e.g. START241B vs START241)
                        const matchedKey = Object.keys(platMaps).find(k => 
                            k === baseCode || (k.startsWith(baseCode) && k.length === baseCode.length + 1) || baseCode.startsWith(k)
                        );
                        if (matchedKey) {
                            attemptInfo = platMaps[matchedKey];
                        }
                    }
                }
                
                attemptInfo = attemptInfo || {};

                const rank = attemptInfo.rank;
                let solvedCount = attemptInfo.solvedCount || 0; // Pre-filled for LC

                // Fallback to manual Submission check
                if (c.platform === 'codechef' && subsByPlatform.codechef.length > 0) {
                    const codeMatch = c.url ? c.url.match(/codechef\.com\/(.+)$/i) : null;
                    const baseCode = codeMatch && codeMatch[1] ? codeMatch[1].trim().toLowerCase() : null;
                    if (baseCode) {
                        solvedCount = subsByPlatform.codechef.filter(s => {
                            if (!s.contestId) return false;
                            const sId = s.contestId.toLowerCase();
                            return sId === baseCode || (sId.startsWith(baseCode) && sId.length === baseCode.length + 1) || baseCode.startsWith(sId);
                        }).length;
                    }
                } else if (c.platform === 'codeforces' && subsByPlatform.codeforces.length > 0) {
                    const cStart = c.startTime.getTime();
                    const cEnd = c.endTime.getTime();
                    solvedCount = subsByPlatform.codeforces.filter(s => s.time >= cStart && s.time <= cEnd).length;
                }

                if (rank > 0 || solvedCount > 0) {
                    c.attempted = { rank, solvedCount };
                }
                return c;
            });
        }

        return res.json(contests);
    } catch (err) {
        console.error('[contestRoutes] DB read failed:', err.message);
        return res.status(500).json({ error: 'Failed to load contests', message: err.message });
    }
});

// ── Custom Contests ─────────────────────────────────────────────────────────

router.post('/custom', verifyToken, async (req, res) => {
    try {
        const { name, platform, url, startTime, duration } = req.body;
        if (!name || !platform || !startTime) {
            return res.status(400).json({ error: 'Name, platform, and startTime are required.' });
        }

        const newContest = new Contest({
            contestId: `custom_${Date.now()}_${req.user._id}`,
            platform,
            name,
            url: url || null,
            startTime: new Date(startTime),
            endTime: duration ? new Date(new Date(startTime).getTime() + duration * 60000) : null,
            duration: duration || null,
            creatorId: req.user._id,
            status: 'BEFORE'
        });

        await newContest.save();
        res.status(201).json(newContest);
    } catch (err) {
        console.error('[contestRoutes POST /custom] Error:', err.message);
        res.status(500).json({ error: 'Failed to create custom contest', message: err.message });
    }
});

router.delete('/custom/:id', verifyToken, async (req, res) => {
    try {
        const contestId = req.params.id;
        const contest = await Contest.findOne({ _id: contestId, creatorId: req.user._id });
        
        if (!contest) {
            return res.status(404).json({ error: 'Custom contest not found or unauthorized' });
        }

        await Contest.deleteOne({ _id: contestId });
        res.json({ message: 'Custom contest deleted successfully' });
    } catch (err) {
        console.error('[contestRoutes DELETE /custom/:id] Error:', err.message);
        res.status(500).json({ error: 'Failed to delete custom contest', message: err.message });
    }
});

module.exports = router;
