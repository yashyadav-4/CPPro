const mongoose = require('mongoose');
const dashboardService= require('../Services/cfDashboardService');
const cfAggRepo = require('../Repositories/cfAggregateRepository');
const Platform = require('../Model/Platform');
const Submission = require('../Model/Submissions');

function getMicroBracket(rating) {
  const bracketStart = Math.floor(rating / 50) * 50;
  const bracketEnd = bracketStart + 49;
  const nextMilestone = bracketStart + 50;
  const pointsNeeded = nextMilestone - rating;
  const progressPercent = Math.round(((rating - bracketStart) / 50) * 100);
  return { bracketStart, bracketEnd, nextMilestone, pointsNeeded, progressPercent };
}

function getRankFromRating(rating) {
    if (rating < 1200) return 'Newbie';
    if (rating < 1400) return 'Pupil';
    if (rating < 1600) return 'Specialist';
    if (rating < 1900) return 'Expert';
    if (rating < 2100) return 'Candidate Master';
    if (rating < 2300) return 'Master';
    if (rating < 2400) return 'International Master';
    return 'Grandmaster';
}

const microBracketTopics = {
  800:  ['implementation', 'brute force', 'math'],
  850:  ['implementation', 'sortings', 'brute force'],
  900:  ['greedy', 'math', 'strings'],
  950:  ['greedy', 'brute force', 'math'],
  1000: ['greedy', 'sortings', 'two pointers'],
  1050: ['constructive algorithms', 'greedy', 'math'],
  1100: ['constructive algorithms', 'binary search', 'greedy'],
  1150: ['binary search', 'two pointers', 'constructive algorithms'],
  1200: ['binary search', 'sortings', 'two pointers'],
  1250: ['two pointers', 'data structures', 'greedy'],
  1300: ['dp', 'bitmasks', 'binary search'],
  1350: ['dp', 'greedy', 'number theory'],
  1400: ['dp', 'dfs and similar', 'number theory'],
  1450: ['dfs and similar', 'graphs', 'dsu'],
  1500: ['graphs', 'dp', 'shortest paths'],
  1550: ['shortest paths', 'trees', 'dfs and similar'],
  1600: ['trees', 'dp', 'number theory'],
  1650: ['trees', 'number theory', 'combinatorics'],
  1700: ['combinatorics', 'data structures', 'binary search'],
  1750: ['data structures', 'graphs', 'strings'],
  1800: ['data structures', 'divide and conquer', 'hashing'],
  1850: ['hashing', 'strings', 'divide and conquer'],
  1900: ['bitmasks', 'probabilities', 'dp'],
  1950: ['flows', 'graph matchings', 'bitmasks'],
  2000: ['dp', 'interactive', 'flows'],
  2050: ['data structures', 'trees', 'dp'],
  2100: ['trees', 'graphs', 'divide and conquer'],
  2150: ['geometry', 'fft', 'trees'],
  2200: ['fft', 'geometry', 'string suffix structures'],
  2250: ['string suffix structures', 'geometry', 'math'],
  2300: ['geometry', 'string suffix structures', 'trees'],
  2350: ['fft', 'matrices', 'probabilities'],
  2400: ['combinatorics', 'probabilities', 'math'],
};

async function getProfileSummary(req, res) {
    try {
        const { userId } = req.params;

        const summary = await dashboardService.getProfileSummary(userId);        

        res.status(200).json({success:true , data :summary});
    }catch(error){
        console.error('error in getProfileSummary: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getHeatmap(req , res){
    try{
        const  {userId}= req.params;

        const heatmapData= await dashboardService.getHeatmap(userId);

        res.status(200).json({success:true , data :heatmapData});
    }catch(error){
        console.error('error in getHeatmap: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getRatingAnalysis(req , res){
    try{
        const  {userId}= req.params;

        const ratingData=await dashboardService.getRatingAnalysis(userId,'codeforces');

        res.status(200).json({success:true , data :ratingData});
    }catch(error){
        console.error('error in getRatingAnalysis: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getTopicBreakdown(req , res){
    try{
        const  {userId}= req.params;

        const topics = await dashboardService.getTopicBreakdown(userId);

        res.status(200).json({success:true , data :topics});
    }catch(error){
        console.error('error in getTopicBreakdown: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

async function getDifficultyBreakdown(req , res){
    try{
        const  {userId}= req.params;

        const difficulty = await dashboardService.getDifficultyBreakdown(userId);

        res.status(200).json({success:true , data :difficulty});
    }catch(error){
        console.error('error in getDifficultyBreakdown: ', error);
        return res.status(500).json({success: false,message: error.message});
    }
}

// ── New consolidated aggregate endpoint ──────────────────────────────────────
async function getAggregateDashboard(req, res) {
    try {
        const { userId } = req.params;

        const [cfStats, cfDiffBands, cfHeatmap, cfTopics, cfRatingInfo, recentCfContests, upsolveQueue, skillGaps, cfLast7Days, recentCfSubmissions] = await Promise.all([
            cfAggRepo.getCfStats(userId),
            cfAggRepo.getCfDiffBands(userId),
            cfAggRepo.getCfHeatmap(userId),
            cfAggRepo.getCfTopics(userId),
            cfAggRepo.getCfRatingHistory(userId),
            cfAggRepo.getRecentCfContests(userId),
            cfAggRepo.getUpsolveQueue(userId),
            cfAggRepo.getSkillGaps(userId),
            cfAggRepo.getCfLast7Days(userId),
            cfAggRepo.getRecentCfSubmissions(userId),
        ]);

        // Compute streak from CF day set only (LC days will be merged in the lc-aggregate endpoint for unified streak)
        const cfStreak = cfAggRepo.computeCfStreak(cfStats.cfDaySet);

        // Strip the raw Set before sending (not serialisable)
        const { cfDaySet: _, ...cfStatsClean } = cfStats;

        res.status(200).json({
            success: true,
            data: {
                ...cfStatsClean,
                cfCurrentStreak: cfStreak.currentStreak,
                cfBestStreak: cfStreak.bestStreak,
                cfDiffBands,
                cfHeatmap,
                cfTopics,
                cfLast7Days,
                recentCfContests,
                recentCfSubmissions,
                upsolveQueue,
                skillGaps,
                ...cfRatingInfo,
            }
        });
    } catch (error) {
        console.error('error in getAggregateDashboard:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// ── Next Target micro-bracket endpoint ──────────────────────────────────
async function getNextTarget(req, res) {
    try {
        const { userId } = req.params;
        const platform = await Platform.findOne({ userId, platform: 'codeforces' }).lean();
        if (!platform || !platform.currentRating) {
            return res.status(200).json({ success: true, data: null });
        }

        const currentRating = platform.currentRating;
        const currentRank = getRankFromRating(currentRating);
        
        if (currentRating >= 2400) {
            return res.status(200).json({
                success: true,
                data: {
                    isPeak: true,
                    currentRating,
                    currentRank
                }
            });
        }

        const microParams = getMicroBracket(currentRating);
        const nextRank = getRankFromRating(microParams.nextMilestone);
        const rankBoundaryChange = currentRank !== nextRank;

        // Get nearest topics based on brackets
        let topicsKeys = Object.keys(microBracketTopics).map(Number).sort((a,b)=>a-b);
        let selectedBracket = 800;
        for (let key of topicsKeys) {
            if (key <= microParams.bracketStart) {
                selectedBracket = key;
            } else {
                break;
            }
        }
        // Compute 3-tier topics
        const topicTiers = {
            master: microBracketTopics[selectedBracket - 50] || [],
            current: microBracketTopics[selectedBracket] || [],
            stretch: microBracketTopics[selectedBracket + 50] || []
        };
        const allTopicsSet = new Set([...topicTiers.master, ...topicTiers.current, ...topicTiers.stretch]);
        const allTopics = Array.from(allTopicsSet);

        // Gather user's topic strengths for these topics
        const topicStats = await Submission.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId), platform: 'codeforces', verdict: 'AC' } },
            { $unwind: "$tags" },
            { $match: { tags: { $in: allTopics } } },
            { $group: { _id: "$tags", solvedCount: { $sum: 1 } } }
        ]);

        const statsMap = {};
        topicStats.forEach(t => { statsMap[t._id] = t.solvedCount; });

        const formatTopics = (topics) => topics.map(topic => {
            const solvedCount = statsMap[topic] || 0;
            let status = 'weak';
            if (solvedCount >= 15) status = 'strong';
            else if (solvedCount >= 5) status = 'fair';
            return { topic, solvedCount, status };
        });

        const topicTiersWithStats = {
            master: formatTopics(topicTiers.master),
            current: formatTopics(topicTiers.current),
            stretch: formatTopics(topicTiers.stretch)
        };

        // Compute momentum
        const history = platform.ratedHistory || [];
        // sorted descending by date
        const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let recentContestDeltas = [];
        for (let i = 0; i < sortedHistory.length - 1 && recentContestDeltas.length < 10; i++) {
            const h = sortedHistory[i];
            const prev = sortedHistory[i+1];
            recentContestDeltas.push(h.rating - prev.rating);
        }

        let avgDeltaLast10 = 0;
        if (recentContestDeltas.length > 0) {
            avgDeltaLast10 = Math.round(recentContestDeltas.reduce((a,b)=>a+b, 0) / recentContestDeltas.length);
        }

        let avgDeltaLast3 = 0;
        const last3 = recentContestDeltas.slice(0, 3);
        if (last3.length > 0) {
            avgDeltaLast3 = Math.round(last3.reduce((a,b)=>a+b, 0) / last3.length);
        }

        const estimatedContests = Math.min(99, Math.ceil(microParams.pointsNeeded / Math.max(avgDeltaLast10, 1)));
        
        let momentum = 'stable';
        if (avgDeltaLast3 > 0) momentum = 'rising';
        else if (avgDeltaLast3 < 0) momentum = 'falling';

        return res.status(200).json({
            success: true,
            data: {
                currentRating,
                currentRank,
                nextRank,
                rankBoundaryChange,
                ...microParams,
                topicTiers: topicTiersWithStats,
                recentContestDeltas: last3, // Send only last 3 for UI
                avgDeltaLast10,
                avgDeltaLast3,
                estimatedContests,
                momentum
            }
        });
    } catch (error) {
        console.error('error in getNextTarget:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

module.exports={
    getProfileSummary,
    getHeatmap,
    getRatingAnalysis,
    getTopicBreakdown,
    getDifficultyBreakdown,
    getAggregateDashboard,
    getNextTarget
}
