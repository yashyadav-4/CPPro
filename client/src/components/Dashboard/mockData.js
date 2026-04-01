// Seeded pseudo-random for consistent heatmap data across renders
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateHeatmapData() {
  const data = [];
  const rand = seededRandom(42);
  const end = new Date('2026-03-31');
  const current = new Date('2025-10-01');

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const dow = current.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const chance = isWeekend ? 0.35 : 0.65;
    const hasActivity = rand() < chance;
    const count = hasActivity ? Math.floor(rand() * 14) + 1 : 0;
    data.push({ date: dateStr, count });
    current.setDate(current.getDate() + 1);
  }
  return data;
}

export const mockCombinedDashboardData = {
  aggregateTopStats: {
    totalCombinedSolved: 1303,
    totalCombinedActiveDays: 403,
    totalCombinedSubmissions: 961,
  },
  combinedHeatmap: generateHeatmapData(),
  combinedProblemsBreakdown: {
    total: 770,
    easyCount: 269,
    mediumCount: 443,
    hardCount: 58,
  },
  platformsSolvedCounts: {
    leetcode: 16,
    codeforces: 16,
    codechef: 26,
  },
  dualRatingHistory: {
    dates: [
      "2025-06-15","2025-07-20","2025-08-10","2025-09-05",
      "2025-10-12","2025-11-08","2025-12-14",
      "2026-01-01","2026-02-01","2026-03-01",
    ],
    codeforcesRatings: [980,1020,1050,1080,1100,1120,1080,1100,1150,1287],
    leetcodeRatings:   [1400,1420,1480,1500,1520,1550,1580,1550,1600,1828],
    contestNames: [
      { date:"2025-06-15", name:"CF Round 950", rank:15200 },
      { date:"2025-08-10", name:"CF Round 960", rank:12100 },
      { date:"2025-10-12", name:"Weekly Contest 410", rank:10500 },
      { date:"2025-12-14", name:"CF Round 985", rank:8900 },
      { date:"2026-02-01", name:"Biweekly Contest 150", rank:11200 },
      { date:"2026-03-01", name:"Biweekly Contest 177", rank:9119 },
    ],
  },
  platformProfiles: {
    codeforces: { currentRating:1287, maxRating:1290, rankName:"Pupil" },
    leetcode:   { currentRating:1828, maxRating:1846, rankName:"Guardian" },
    codechef:   { currentRating:1658, maxRating:1658, starCount:3 },
  },
  combinedAwards: [
    { id:'lc_streak',    type:'gold',   platform:'leetcode',   title:'Daily Streak' },
    { id:'lc_100days',   type:'silver', platform:'leetcode',   title:'100 Days Badge' },
    { id:'cf_div2',      type:'gold',   platform:'codeforces', title:'Div 2 Winner' },
    { id:'cf_contrib',   type:'bronze', platform:'codeforces', title:'Contribution' },
    { id:'lc_problem',   type:'bronze', platform:'leetcode',   title:'Problem Setter' },
    { id:'cc_star',      type:'silver', platform:'codechef',   title:'Rising Star' },
    { id:'lc_guardian',  type:'gold',   platform:'leetcode',   title:'Guardian Badge' },
    { id:'cf_specialist',type:'silver', platform:'codeforces', title:'Specialist Goal' },
  ],
  combinedTopicAnalysis: [
    { topic:"Arrays",              count:406 },
    { topic:"Strings",             count:133 },
    { topic:"Dynamic Programming", count:98 },
    { topic:"Trees",               count:87 },
    { topic:"Graphs",              count:76 },
    { topic:"Math",                count:68 },
    { topic:"Binary Search",       count:54 },
    { topic:"Greedy",              count:47 },
    { topic:"Hash Table",          count:42 },
    { topic:"Stack",               count:35 },
    { topic:"Two Pointers",        count:31 },
    { topic:"Sorting",             count:28 },
  ],
};
