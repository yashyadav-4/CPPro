const axios      = require('axios');
const User       = require('../Model/User');
const GFGData    = require('../Model/GFGData');
const Submission = require('../Model/Submissions');
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
// syncGfgProfile — fetch, deduplicate, cumulate, and upsert GFG data
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
        const errMsg = err.response?.data?.message || err.message;
        if (code === 'USER_NOT_FOUND') {
            await GFGData.findOneAndUpdate(
                { userId },
                { $set: { lastError: `User not found on GeeksforGeeks: ${handle}`, lastErrorAt: new Date() } }
            ).catch(() => {});
            throw new Error('invalid geeksforgeeks handle');
        }
        await ErrorLog.create({
            source: 'GFG-Sync-Service',
            level:  'error',
            message: `[GFG_FETCH_FAILED] handle=${handle} | userId=${userId} | reason=${errMsg}`,
        }).catch(() => {});
        await GFGData.findOneAndUpdate(
            { userId },
            { $set: { lastError: errMsg, lastErrorAt: new Date() } }
        ).catch(() => {});
        throw new Error(`GFG relay failed: ${errMsg}`);
    }

    // ── 1. Fetch existing doc to preserve & cumulate historical data ────────
    const existing = await GFGData.findOne({ userId }).lean();

    // ── 2. Deduplicate and cumulate solved problems ─────────────────────────
    const problemMap = new Map();

    // Seed with existing stored problems
    if (existing?.problems && Array.isArray(existing.problems)) {
        for (const p of existing.problems) {
            const key = String(p.slug || p.id || p.title || '').trim();
            if (key) problemMap.set(key, { ...p });
        }
    }

    // Cumulate new problems from relayData (preserves older submissions if relay only returns a window)
    if (relayData.problems && Array.isArray(relayData.problems)) {
        for (const p of relayData.problems) {
            const key = String(p.slug || p.id || p.title || '').trim();
            if (!key) continue;
            if (problemMap.has(key)) {
                const prev = problemMap.get(key);
                problemMap.set(key, {
                    ...prev,
                    ...p,
                    submittedAt: p.submittedAt || prev.submittedAt || '',
                });
            } else {
                problemMap.set(key, { ...p });
            }
        }
    }

    // Sort descending by submission time
    const mergedProblems = Array.from(problemMap.values()).sort((a, b) => {
        const tA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return tB - tA;
    });

    // ── 3. Deduplicate and cumulate activity heatmap ─────────────────────────
    const heatmapDateMap = new Map();

    if (existing?.heatmap && Array.isArray(existing.heatmap)) {
        for (const h of existing.heatmap) {
            if (h?.date) {
                heatmapDateMap.set(h.date, Math.max(heatmapDateMap.get(h.date) || 0, h.count || 0));
            }
        }
    }

    if (relayData.heatmap && Array.isArray(relayData.heatmap)) {
        for (const h of relayData.heatmap) {
            if (h?.date) {
                heatmapDateMap.set(h.date, Math.max(heatmapDateMap.get(h.date) || 0, h.count || 0));
            }
        }
    }

    // Ensure all merged problems' dates are tracked in heatmap
    for (const p of mergedProblems) {
        if (!p.submittedAt) continue;
        const dStr = String(p.submittedAt).split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            heatmapDateMap.set(dStr, Math.max(heatmapDateMap.get(dStr) || 0, 1));
        }
    }

    const mergedHeatmap = Array.from(heatmapDateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // ── 4. Recompute cumulative difficulty distribution ──────────────────────
    const computedDiff = { school: 0, basic: 0, easy: 0, medium: 0, hard: 0 };
    for (const p of mergedProblems) {
        const diff = (p.difficulty || '').toLowerCase();
        if (computedDiff[diff] !== undefined) computedDiff[diff]++;
    }

    const solvedByDifficulty = {
        school: Math.max(computedDiff.school, relayData.solvedByDifficulty?.school ?? 0, existing?.solvedByDifficulty?.school ?? 0),
        basic:  Math.max(computedDiff.basic,  relayData.solvedByDifficulty?.basic  ?? 0, existing?.solvedByDifficulty?.basic  ?? 0),
        easy:   Math.max(computedDiff.easy,   relayData.solvedByDifficulty?.easy   ?? 0, existing?.solvedByDifficulty?.easy   ?? 0),
        medium: Math.max(computedDiff.medium, relayData.solvedByDifficulty?.medium ?? 0, existing?.solvedByDifficulty?.medium ?? 0),
        hard:   Math.max(computedDiff.hard,   relayData.solvedByDifficulty?.hard   ?? 0, existing?.solvedByDifficulty?.hard   ?? 0),
    };

    // ── 5. Derived cumulative stats ──────────────────────────────────────────
    const sumDiff = solvedByDifficulty.school + solvedByDifficulty.basic + solvedByDifficulty.easy + solvedByDifficulty.medium + solvedByDifficulty.hard;
    const totalSolved = Math.max(
        mergedProblems.length,
        relayData.totalSolved ?? 0,
        existing?.totalSolved ?? 0,
        sumDiff
    );

    const activeDays = Math.max(mergedHeatmap.length, relayData.activeDays ?? 0, existing?.activeDays ?? 0);

    // Compute solved this month from deduplicated problems
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    let computedSolvedThisMonth = 0;
    for (const p of mergedProblems) {
        if (p.submittedAt && String(p.submittedAt).startsWith(currentMonthPrefix)) {
            computedSolvedThisMonth++;
        }
    }
    const solvedThisMonth = Math.max(computedSolvedThisMonth, relayData.solvedThisMonth ?? 0);

    const codingScore   = Math.max(relayData.codingScore ?? 0, existing?.codingScore ?? 0);
    const monthlyScore  = relayData.monthlyScore ?? existing?.monthlyScore ?? 0;
    const currentStreak = relayData.currentStreak ?? existing?.currentStreak ?? 0;
    const bestStreak    = Math.max(relayData.bestStreak ?? 0, existing?.bestStreak ?? 0, currentStreak);

    // Cumulative language distribution
    const languageDistribution = {};
    for (const p of mergedProblems) {
        const lang = p.lang || 'Unknown';
        languageDistribution[lang] = (languageDistribution[lang] || 0) + 1;
    }

    const recentSubmissions = mergedProblems.slice(0, 25);

    // ── 6. Upsert into GFGData collection ────────────────────────────────────
    await GFGData.findOneAndUpdate(
        { userId },
        {
            $set: {
                gfgHandle:          handle,
                name:               relayData.name          || existing?.name || '',
                profilePicture:     relayData.profilePicture || existing?.profilePicture || '',
                codingScore,
                monthlyScore,
                totalSolved,
                instituteRank:      relayData.instituteRank ?? existing?.instituteRank ?? 0,
                institution:        relayData.institution   || existing?.institution || '',
                solvedByDifficulty,
                heatmap:            mergedHeatmap,
                activeDays,
                currentStreak,
                bestStreak,
                solvedThisMonth,
                problems:           mergedProblems,
                recentSubmissions,
                languageDistribution,
                lastSyncedAt:       new Date(),
                lastError:          null,
                lastErrorAt:        null,
            },
        },
        { upsert: true, new: true }
    );

    // ── 7. Deduplicated persistence into global Submission collection ─────────
    try {
        const subOps = mergedProblems.map(p => {
            const problemId = String(p.slug || p.id || p.title);
            const submittedAt = p.submittedAt ? new Date(p.submittedAt) : new Date();
            return {
                updateOne: {
                    filter: {
                        userId,
                        problemId,
                        platform: 'geeksforgeeks',
                    },
                    update: {
                        $setOnInsert: {
                            userId,
                            problemId,
                            problemTitle: p.title || p.slug || 'Problem',
                            platform: 'geeksforgeeks',
                            problemUrl: p.slug ? `https://www.geeksforgeeks.org/problems/${p.slug}/1` : '',
                            verdict: 'AC',
                            difficulty: p.difficulty || 'Medium',
                            language: p.lang || '',
                            submittedAt,
                            attemptCount: 1,
                        },
                    },
                    upsert: true,
                },
            };
        });

        if (subOps.length > 0) {
            await Submission.bulkWrite(subOps, { ordered: false });
        }
    } catch (subErr) {
        console.warn('[GFG-SYNC] Submission bulkWrite warning:', subErr.message);
    }

    await User.findByIdAndUpdate(userId, { $set: { lastGfgUpdate: new Date() } });
    console.log(`[GFG-SYNC] >> ${handle} | sync done ✓ (${mergedProblems.length} cumulative problems deduped)`);
    return { success: true };
};

module.exports = { fetchGfgData, syncGfgProfile };
