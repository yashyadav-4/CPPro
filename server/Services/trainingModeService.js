/**
 * trainingModeService.js
 *
 * Computes a user's "training level" for each platform based on the weighted
 * percentile of their actual AC submission history, not their contest rating.
 *
 * Recency weighting:
 *   < 3 months  → 3.0×   (most representative of current skill)
 *   3–6 months  → 2.0×
 *   6–12 months → 1.0×   (baseline)
 *   1–2 years   → 0.4×
 *   > 2 years   → 0.1×   (near-irrelevant)
 *
 * Minimum data gate: if totalWeightedScore < 15, return null (caller falls back
 * to Rating Mode).
 */

const Submission = require('../Model/Submissions');
const CFProblem  = require('../Model/CFProblem');
const LCProblem  = require('../Model/LCProblem');
const CCProblem  = require('../Model/CCProblem');

// ── Recency weight ────────────────────────────────────────────────────────────

function recencyWeight(submittedAt) {
    const ageMs = Date.now() - new Date(submittedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays < 90)  return 3.0;
    if (ageDays < 180) return 2.0;
    if (ageDays < 365) return 1.0;
    if (ageDays < 730) return 0.4;
    return 0.1;
}

// AC verdict: 'AC' (LC, CC) OR 'OK' (Codeforces — the CF API uses 'OK' for accepted).
// Both are treated as correct solutions throughout this service.
const AC_VERDICTS  = new Set(['AC', 'OK']);
const FAIL_VERDICTS = new Set(['WA', 'TLE', 'MLE', 'RE']);

function isAC(verdict)   { return AC_VERDICTS.has(verdict); }
function isFail(verdict) { return FAIL_VERDICTS.has(verdict); }

// ── Weighted percentile ───────────────────────────────────────────────────────
// Given an array of { value, weight } pairs, returns the P-th percentile (0–100).

function weightedPercentile(items, p) {
    if (!items.length) return null;
    items.sort((a, b) => a.value - b.value);
    const totalWeight = items.reduce((s, i) => s + i.weight, 0);
    const target = (p / 100) * totalWeight;
    let cumulative = 0;
    for (const item of items) {
        cumulative += item.weight;
        if (cumulative >= target) return item.value;
    }
    return items[items.length - 1].value;
}

// ── Fail rate at a difficulty band ───────────────────────────────────────────

function computeFailRate(allSubs, diffMin, diffMax) {
    const inBand = allSubs.filter(s => {
        const d = Number(s.difficulty);
        return !isNaN(d) && d >= diffMin && d <= diffMax;
    });
    if (inBand.length < 5) return null; // not enough data for meaningful rate
    const failed = inBand.filter(s => isFail(s.verdict)).length;
    return failed / inBand.length;
}

// ── CF training level ─────────────────────────────────────────────────────────
// Uses the most recent CF AC submissions to reflect current skill.
// Tries last 90 days first, expands to 180 days, then all-time as fallback.

function pickRecentSubs(acSubs, days) {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return acSubs.filter(s => new Date(s.submittedAt).getTime() >= cutoff);
}

function computeCFTrainingLevel(acSubs, allSubs) {
    // Sort by most recent first
    const sorted = [...acSubs].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Try windows: 90d → 180d → 365d → all-time, need at least 5 valid
    let pool = null;
    for (const days of [90, 180, 365, Infinity]) {
        const window = days === Infinity ? sorted : pickRecentSubs(sorted, days);
        const valid  = window.filter(s => { const d = Number(s.difficulty); return !isNaN(d) && d > 0; });
        if (valid.length >= 5) { pool = valid; break; }
    }
    if (!pool || pool.length < 3) return null;

    // Take the most recent 30 — median = workout level, 75th percentile = challenger
    const recent30   = pool.slice(0, 30);
    const diffs      = recent30.map(s => Number(s.difficulty)).sort((a, b) => a - b);
    const mid        = Math.floor(diffs.length / 2);
    const p50        = diffs.length % 2 ? diffs[mid] : (diffs[mid - 1] + diffs[mid]) / 2;
    const p75idx     = Math.floor(diffs.length * 0.75);
    const p75        = diffs[Math.min(p75idx, diffs.length - 1)];

    let workoutLevel    = Math.round(p50 / 100) * 100;
    let challengerLevel = Math.round(p75 / 100) * 100;

    workoutLevel    = Math.max(800,  Math.min(3500, workoutLevel));
    challengerLevel = Math.max(800,  Math.min(3500, challengerLevel));
    if (challengerLevel <= workoutLevel) challengerLevel = workoutLevel + 100;

    return {
        workoutLevel,
        challengerLevel,
        workoutMin:    workoutLevel - 100,
        workoutMax:    workoutLevel + 100,
        challengerMin: challengerLevel - 50,
        challengerMax: challengerLevel + 200,
    };
}


// ── LC training level ─────────────────────────────────────────────────────────
// LC only has 3 difficulty strings. We convert to ordinal (1/2/3), compute
// weighted percentile, then map back.

const LC_ORD = { Easy: 1, Medium: 2, Hard: 3 };
const LC_ORD_INV = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };

function computeLCTrainingLevel(acSubs, allSubs) {
    // Sort by recency, try 90d → 180d → all-time, need ≥ 5 AC subs
    const sorted = [...acSubs].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    let pool = null;
    for (const days of [90, 180, 365, Infinity]) {
        const window = days === Infinity ? sorted : pickRecentSubs(sorted, days);
        const valid  = window.filter(s => LC_ORD[s.difficulty]);
        if (valid.length >= 5) { pool = valid; break; }
    }
    if (!pool || pool.length < 3) return null;

    const recent30 = pool.slice(0, 30);
    const counts   = { Easy: 0, Medium: 0, Hard: 0 };
    for (const s of recent30) if (counts[s.difficulty] !== undefined) counts[s.difficulty]++;

    // Workout = the difficulty they solve most recently; challenger = one tier up
    const workoutDiff = counts.Hard >= counts.Medium && counts.Hard >= counts.Easy ? 'Hard'
                      : counts.Medium >= counts.Easy ? 'Medium'
                      : 'Easy';
    const tierOrder       = ['Easy', 'Medium', 'Hard'];
    const challengerDiff  = tierOrder[Math.min(tierOrder.indexOf(workoutDiff) + 1, 2)];

    return { workoutDiff, challengerDiff };
}


// ── CC training level ─────────────────────────────────────────────────────────
// CC uses numeric difficulty (0–10000+). Same approach as CF but different rounding.

function computeCCTrainingLevel(acSubs, allSubs) {
    const sorted = [...acSubs].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    let pool = null;
    for (const days of [90, 180, 365, Infinity]) {
        const window = days === Infinity ? sorted : pickRecentSubs(sorted, days);
        const valid  = window.filter(s => { const d = Number(s.difficulty); return !isNaN(d) && d > 0; });
        if (valid.length >= 5) { pool = valid; break; }
    }
    if (!pool || pool.length < 3) return null;

    const recent30   = pool.slice(0, 30);
    const diffs      = recent30.map(s => Number(s.difficulty)).sort((a, b) => a - b);
    const mid        = Math.floor(diffs.length / 2);
    const p50        = diffs.length % 2 ? diffs[mid] : (diffs[mid - 1] + diffs[mid]) / 2;
    const p75idx     = Math.floor(diffs.length * 0.75);
    const p75        = diffs[Math.min(p75idx, diffs.length - 1)];

    let workoutLevel    = Math.round(p50 / 200) * 200;
    let challengerLevel = Math.round(p75 / 200) * 200;

    workoutLevel    = Math.max(0,   workoutLevel);
    challengerLevel = Math.max(200, challengerLevel);
    if (challengerLevel <= workoutLevel) challengerLevel = workoutLevel + 200;

    return {
        workoutLevel,
        challengerLevel,
        workoutMin:    Math.max(0, workoutLevel - 200),
        workoutMax:    workoutLevel + 200,
        challengerMin: challengerLevel - 100,
        challengerMax: challengerLevel + 500,
    };
}


// ── Public API ────────────────────────────────────────────────────────────────

/**
 * computeTrainingLevel(userId, platform, ratingHint?)
 *
 * Returns a platform-specific training level object, or null when there is
 * insufficient submission data (the caller should fall back to Rating Mode).
 *
 * Key design decisions:
 *  - CF:  difficulty is stored correctly by the CF worker; verdicts are 'OK'.
 *  - LC:  difficulty is stored as '0' by the sync service, so we enrich from
 *         the LCProblem catalog ('Easy'|'Medium'|'Hard').
 *  - CC:  difficulty may be '0'; we enrich from the CCProblem catalog (Number).
 *  - ratingHint: the user's contest rating on that platform, used as a floor
 *    so Training Mode never gives problems easier than Rating Mode would.
 */
async function computeTrainingLevel(userId, platform, ratingHint) {
    // --- Codeforces: enrich from CFProblem catalog (same as LC/CC) ---
    // The CF worker may store difficulty='0' or as a string — the CFProblem
    // catalog is the single source of truth for numeric CF ratings.
    if (platform === 'codeforces') {
        const subs = await Submission.find(
            { userId, platform: 'codeforces' },
            { problemId: 1, difficulty: 1, verdict: 1, submittedAt: 1, _id: 0 }
        ).lean();
        if (!subs.length) return null;

        // Enrich difficulties from catalog for any sub with missing/zero difficulty
        const needsEnrichment = subs.some(s => !s.difficulty || s.difficulty === '0' || Number(s.difficulty) === 0);
        let enriched = subs;
        if (needsEnrichment) {
            const problemIds = [...new Set(subs.map(s => s.problemId))];
            const catalog = await CFProblem.find(
                { problemId: { $in: problemIds } },
                { problemId: 1, difficulty: 1, _id: 0 }
            ).lean();
            const diffMap = new Map(catalog.map(p => [p.problemId, p.difficulty]));
            enriched = subs.map(s => {
                const stored = Number(s.difficulty);
                const fromCatalog = diffMap.get(s.problemId);
                return {
                    ...s,
                    difficulty: (stored > 0) ? String(stored) : String(fromCatalog ?? '0'),
                };
            });
        }

        // Accept both 'OK' (CF API) and 'AC' (normalized)
        const acSubs = enriched.filter(s => isAC(s.verdict));
        return computeCFTrainingLevel(acSubs, enriched);
    }

    // --- LeetCode: difficulty='0' in Submissions — enrich from LCProblem catalog ---
    if (platform === 'leetcode') {
        const subs = await Submission.find(
            { userId, platform: 'leetcode' },
            { problemId: 1, verdict: 1, submittedAt: 1, _id: 0 }
        ).lean();
        if (!subs.length) return null;

        // Build a lookup from the problem catalog
        const problemIds = [...new Set(subs.map(s => s.problemId))];
        const catalog = await LCProblem.find(
            { problemId: { $in: problemIds } },
            { problemId: 1, difficulty: 1, _id: 0 }
        ).lean();
        const diffMap = new Map(catalog.map(p => [p.problemId, p.difficulty]));

        // Enrich submissions
        const enriched = subs.map(s => ({ ...s, difficulty: diffMap.get(s.problemId) || '0' }));
        const acSubs   = enriched.filter(s => isAC(s.verdict));
        return computeLCTrainingLevel(acSubs, enriched);
    }

    // --- CodeChef: enrich from CCProblem catalog ---
    if (platform === 'codechef') {
        const subs = await Submission.find(
            { userId, platform: 'codechef' },
            { problemId: 1, verdict: 1, submittedAt: 1, difficulty: 1, _id: 0 }
        ).lean();
        if (!subs.length) return null;

        // Only look up catalog if difficulties are missing
        const needsEnrichment = subs.some(s => !s.difficulty || s.difficulty === '0');
        let enriched = subs;
        if (needsEnrichment) {
            const problemIds = [...new Set(subs.map(s => s.problemId))];
            const catalog = await CCProblem.find(
                { problemId: { $in: problemIds } },
                { problemId: 1, difficulty: 1, _id: 0 }
            ).lean();
            const diffMap = new Map(catalog.map(p => [p.problemId, p.difficulty]));
            enriched = subs.map(s => ({
                ...s,
                difficulty: (s.difficulty && s.difficulty !== '0')
                    ? s.difficulty
                    : String(diffMap.get(s.problemId) ?? '0'),
            }));
        }

        const acSubs = enriched.filter(s => isAC(s.verdict));
        return computeCCTrainingLevel(acSubs, enriched);
    }

    return null;
}

module.exports = { computeTrainingLevel };
