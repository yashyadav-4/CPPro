/**
 * Shared dashboard data merge utilities.
 * Used by both Dashboard.jsx (owner view) and PublicProfile.jsx (public view).
 */

//merge day arrays into combined last-7-days
export function mergeLast7Days(cfDays, lcDays, ccDays, gfgDays) {
  const result = [];
  const len = Math.max(cfDays?.length || 0, lcDays?.length || 0, ccDays?.length || 0, gfgDays?.length || 0, 7);
  for (let i = 0; i < len; i++) {
    const cfDay = cfDays?.[i] || { date: '', solved: false };
    const lcDay = lcDays?.[i] || { date: '', solved: false };
    const ccDay = ccDays?.[i] || { date: '', solved: false };
    const gfgDay = gfgDays?.[i] || { date: '', solved: false };
    result.push({
      date: cfDay.date || lcDay.date || ccDay.date || gfgDay.date,
      solved: cfDay.solved || lcDay.solved || ccDay.solved || gfgDay.solved,
    });
  }
  return result;
}

//merge heatmap arrays (CF + LC + CC + GFG calendar)
export function mergeHeatmaps(...heatmaps) {
  const map = {};
  heatmaps.forEach(hm => {
    (hm || []).forEach(d => {
      if (d && d.date) {
        map[d.date] = (map[d.date] || 0) + (d.count || 1);
      }
    });
  });
  return Object.entries(map).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
}

//merge topic arrays and take top 8
export function mergeTopics(cfTopics, lcTopics) {
  const map = {};
  (cfTopics || []).forEach(t => { map[t.name] = (map[t.name] || 0) + t.count; });
  (lcTopics || []).forEach(t => { map[t.name] = (map[t.name] || 0) + t.count; });
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

//merge recent contests from all platforms
export function mergeContests(cfContests, lcContests, ccContests) {
  return [...(cfContests || []), ...(lcContests || []), ...(ccContests || [])]
    .filter(c => c.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 15);
}
