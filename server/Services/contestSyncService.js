// Services/contestSyncService.js
// Fetches contests from official CF + LC APIs, upserts into MongoDB,
// and deletes any contest that ended more than 1 day ago.
const axios   = require('axios');
const Contest = require('../Model/Contest');
const ErrorLog = require('../Model/ErrorLog');

// ── Shared axios instance ─────────────────────────────────────────────────────
const http = axios.create({
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CPPro/1.0)',
        'Accept':     'application/json',
    },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function makeId(platform, name, startTime) {
    // startTime is a Date
    return `${platform}::${slugify(name)}::${startTime.getTime()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Codeforces — contest.list (all non-gym contests)
// Keep: started within last 30 days  OR  starts within next 30 days
// ─────────────────────────────────────────────────────────────────────────────
async function fetchCF() {
    const { data } = await http.get('https://codeforces.com/api/contest.list?gym=false');
    if (data.status !== 'OK') throw new Error('CF API non-OK');

    const now    = Date.now();
    const BACK    = 180 * 24 * 3600 * 1000; // 180 days back (6 months)
    const FORWARD = 30 * 24 * 3600 * 1000; // 30 days forward

    return data.result
        .filter(c => {
            const start = c.startTimeSeconds * 1000;
            return start >= now - BACK && start <= now + FORWARD;
        })
        .map(c => {
            const startTime = new Date(c.startTimeSeconds * 1000);
            const endTime   = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
            return {
                contestId: makeId('codeforces', c.name, startTime),
                platform:  'codeforces',
                name:      c.name,
                startTime,
                endTime,
                duration:  Math.round(c.durationSeconds / 60),
                url:       `https://codeforces.com/contest/${c.id}`,
                status:    c.phase === 'BEFORE' ? 'BEFORE' : c.phase,
            };
        });
}

// ─────────────────────────────────────────────────────────────────────────────
// LeetCode — upcomingContests + pastContests GraphQL query
// ─────────────────────────────────────────────────────────────────────────────
async function fetchLC() {
    const query = `
        query getContests($pageNo: Int!) {
            upcomingContests {
                title
                titleSlug
                startTime
                duration
            }
            pastContests(pageNo: $pageNo, numPerPage: 10) {
                data {
                    title
                    titleSlug
                    startTime
                    duration
                }
            }
        }`;

    // Leetcode gives max 10 past contests per page natively.
    // 6 months is ~40 contests (weekly + biweekly), so we query pages 1 through 4.
    const pageNumbers = [1, 2, 3, 4];
    
    const requests = pageNumbers.map(pageNo => 
        http.post(
            'https://leetcode.com/graphql',
            { query, variables: { pageNo } },
            { headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' } }
        )
    );

    const responses = await Promise.allSettled(requests);
    
    let upcoming = [];
    let past = [];

    responses.forEach(res => {
        if (res.status === 'fulfilled' && res.value.data?.data) {
            // upcoming is identical in every response; just grab the first one we find
            if (upcoming.length === 0) upcoming = res.value.data.data.upcomingContests || [];
            
            const pastData = res.value.data.data.pastContests?.data || [];
            past = past.concat(pastData);
        }
    });

    const all = [...upcoming, ...past];

    return all.map(c => {
        const startTime = new Date(c.startTime * 1000);
        const endTime   = new Date((c.startTime + c.duration) * 1000);
        return {
            contestId: makeId('leetcode', c.title, startTime),
            platform:  'leetcode',
            name:      c.title,
            startTime,
            endTime,
            duration:  Math.round(c.duration / 60),
            url:       `https://leetcode.com/contest/${c.titleSlug}`,
            status:    'BEFORE',
        };
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// AtCoder — via CLIST.by public API (resource=atcoder.jp)
// Falls back gracefully if the CLIST_API_KEY env var is missing.
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAC() {
    const apiKey = process.env.CLIST_API_KEY;
    if (!apiKey) {
        console.warn('[contestSync] CLIST_API_KEY not set — skipping AtCoder sync.');
        return [];
    }

    const now    = Date.now();
    const BACK    = 180 * 24 * 3600 * 1000;
    const FORWARD = 30 * 24 * 3600 * 1000;

    const from = new Date(now - BACK).toISOString();
    const to   = new Date(now + FORWARD).toISOString();

    const url = `https://clist.by/api/v4/contest/?resource=atcoder.jp&start__gte=${from}&start__lte=${to}&order_by=start&limit=100&format=json`;

    const { data } = await http.get(url, {
        headers: { Authorization: `ApiKey ${apiKey}` }
    });

    if (!data || !Array.isArray(data.objects)) throw new Error('CLIST API unexpected response for AtCoder');

    const raw = data.objects.map(c => {
        const startTime = new Date(c.start);
        const endTime   = new Date(c.end);
        const durSec    = Math.max(0, (endTime - startTime) / 1000);
        return {
            contestId: makeId('atcoder', c.event, startTime),
            platform:  'atcoder',
            name:      c.event,
            startTime,
            endTime,
            duration:  Math.round(durSec / 60),
            url:       c.href || `https://atcoder.jp/contests/${c.id}`,
            status:    'BEFORE',
        };
    });

    // Deduplicate AtCoder division contests:
    // AtCoder splits events into Div.1 / Div.2 / Div.3 etc. with the same start time.
    // Strip the division suffix to get a base key, then keep only the first (Div.1 / highest tier).
    const DIV_SUFFIX = /[\s\-–]*(div(ision)?\.?\s*\d+|grand\s*final|final)$/i;
    const seen = new Map(); // key -> first contest

    for (const c of raw) {
        const baseKey = c.name.replace(DIV_SUFFIX, '').trim().toLowerCase()
            + '::' + c.startTime.getTime();
        if (!seen.has(baseKey)) {
            seen.set(baseKey, c);
        } else {
            // Prefer the entry whose name ends with Div.1 or has no division suffix (main round)
            const existing = seen.get(baseKey);
            const isMainRound = !DIV_SUFFIX.test(c.name);
            const isDiv1 = /div(ision)?\.?\s*1/i.test(c.name);
            const existingIsMain = !DIV_SUFFIX.test(existing.name);
            if (!existingIsMain && (isMainRound || isDiv1)) {
                seen.set(baseKey, c);
            }
        }
    }

    return Array.from(seen.values());
}
async function fetchCC() {
    // CodeChef's public contest list endpoint
    const { data } = await http.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all');
    if (!data || !data.present_contests) throw new Error('CC contest API unexpected response');

    const now    = Date.now();
    const BACK    = 180 * 24 * 3600 * 1000;
    const FORWARD = 30 * 24 * 3600 * 1000;

    const all = [
        ...(data.present_contests || []),
        ...(data.future_contests || []),
        ...(data.past_contests || []),
    ];

    return all
        .filter(c => {
            const start = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
            return start >= now - BACK && start <= now + FORWARD;
        })
        .map(c => {
            const startTime = new Date(c.contest_start_date_iso || c.contest_start_date);
            const endTime   = new Date(c.contest_end_date_iso || c.contest_end_date);
            const durSec    = Math.max(0, (endTime - startTime) / 1000);
            return {
                contestId: makeId('codechef', c.contest_name, startTime),
                platform:  'codechef',
                name:      c.contest_name,
                startTime,
                endTime,
                duration:  Math.round(durSec / 60),
                url:       `https://www.codechef.com/${c.contest_code}`,
                status:    'BEFORE',
            };
        });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main sync function — called by the cron worker
// ─────────────────────────────────────────────────────────────────────────────
async function syncContests() {
    console.log('[contestSync] Starting sync…');

    // 1. Fetch from all APIs in parallel (partial failure is OK)
    const [cfRes, lcRes, ccRes, acRes] = await Promise.allSettled([fetchCF(), fetchLC(), fetchCC(), fetchAC()]);

    const logFailure = (platform, res) => {
        if (res.status === 'rejected') {
            const reason = res.reason?.message || 'Unknown error';
            console.error(`[contestSync] ${platform} failed:`, reason);
            ErrorLog.create({
                source: 'contestSyncService',
                level: 'error',
                message: `[CONTEST_SYNC_FAILED] platform=${platform} | reason=${reason}`
            }).catch(() => {});
        }
    };

    logFailure('codeforces', cfRes);
    logFailure('leetcode', lcRes);
    logFailure('codechef', ccRes);
    logFailure('atcoder', acRes);

    const contests = [
        ...(cfRes.status === 'fulfilled' ? cfRes.value : []),
        ...(lcRes.status === 'fulfilled' ? lcRes.value : []),
        ...(ccRes.status === 'fulfilled' ? ccRes.value : []),
        ...(acRes.status === 'fulfilled' ? acRes.value : []),
    ];

    console.log(`[contestSync] Fetched ${contests.length} contests (CF + LC + CC + AC)`);

    // 2. Upsert all contests — update fields if the contest already exists
    if (contests.length > 0) {
        const ops = contests.map(c => ({
            updateOne: {
                filter: { contestId: c.contestId },
                update: { $set: c },
                upsert: true,
            },
        }));
        const result = await Contest.bulkWrite(ops, { ordered: false });
        console.log(`[contestSync] Upserted: ${result.upsertedCount} new, ${result.modifiedCount} updated`);
    }

    // 3. Delete stale contests: endTime older than 180 days (6 months)
    const cutoff = new Date(Date.now() - 180 * 24 * 3600 * 1000);
    const deleted = await Contest.deleteMany({ endTime: { $lt: cutoff } });
    if (deleted.deletedCount > 0) {
        console.log(`[contestSync] Cleaned up ${deleted.deletedCount} contests older than 180 days`);
    }

    console.log('[contestSync] Sync complete.');
    return contests.length;
}

module.exports = { syncContests };
