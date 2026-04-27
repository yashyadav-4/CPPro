// Returns up to `limit` weakest topic slugs for each platform.

function getCFWeakTopics(cfPlatform, limit = 3) {
    const map = cfPlatform?.solvedByTopics;
    if (!map || typeof map !== 'object') return [];
    const entries = Object.entries(map instanceof Map ? Object.fromEntries(map) : map);
    return entries
        .filter(([, count]) => typeof count === 'number')
        .sort(([, a], [, b]) => a - b)
        .slice(0, limit)
        .map(([tag]) => tag);
}

function getCCWeakTopics(ccPlatform, limit = 3) {
    const map = ccPlatform?.solvedByTopics;
    if (!map || typeof map !== 'object') return [];
    const entries = Object.entries(map instanceof Map ? Object.fromEntries(map) : map);
    return entries
        .filter(([, count]) => typeof count === 'number')
        .sort(([, a], [, b]) => a - b)
        .slice(0, limit)
        .map(([tag]) => tag);
}

function getLCWeakTags(lcData, limit = 5) {
    const { fundamental = [], intermediate = [], advanced = [] } = lcData?.skillStats || {};
    const all = [...fundamental, ...intermediate, ...advanced];
    return all
        .filter(t => typeof t.problemsSolved === 'number')
        .sort((a, b) => a.problemsSolved - b.problemsSolved)
        .slice(0, limit)
        .map(t => t.tagSlug);
}

module.exports = { getCFWeakTopics, getCCWeakTopics, getLCWeakTags };
