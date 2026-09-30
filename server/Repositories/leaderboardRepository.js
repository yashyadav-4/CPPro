const mongoose = require('mongoose');
const User = require('../Model/User');

//map category query param to the sort field
const SORT_FIELD_MAP = {
    cpscore: 'cpScore',
    totalQuestions: 'totalSolved',
    leetcodeRating: 'lcRating',
    codeforcesRating: 'cfRating',
    codechefRating: 'ccRating',
};

/**
 * builds the shared aggregation stages that compute all stats.
 * used by both getLeaderboardData and getUserRank so the score
 */
function buildCorePipeline(scope, scopeValue) {
    const stages = [];

    // Scope filter (before $lookup to shrink working set)
    const matchStage = {};
    if (scope === 'country' && scopeValue) {
        matchStage["location.country"] = scopeValue;
    } else if (scope === 'college' && scopeValue) {
        matchStage.college = scopeValue;
    }
    if (Object.keys(matchStage).length > 0) {
        stages.push({ $match: matchStage });
    }

    //lookups
    stages.push(
        {
            $lookup: {
                from: 'platforms',
                localField: '_id',
                foreignField: 'userId',
                as: 'platformStats'
            }
        },
        {
            $lookup: {
                from: 'leetcodedatas',
                localField: '_id',
                foreignField: 'userId',
                as: 'lcStats'
            }
        },
        {
            $lookup: {
                from: 'gfgdatas',
                localField: '_id',
                foreignField: 'userId',
                as: 'gfgStats'
            }
        }
    );

    //extract CF, LC & CC docs
    stages.push({
        $addFields: {
            codeforcesDoc: {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: "$platformStats",
                            as: 'p',
                            cond: { $eq: ["$$p.platform", "codeforces"] }
                        }
                    },
                    0
                ]
            },
            codechefDoc: {
                $arrayElemAt: [
                    {
                        $filter: {
                            input: "$platformStats",
                            as: 'p',
                            cond: { $eq: ["$$p.platform", "codechef"] }
                        }
                    },
                    0
                ]
            },
            lcDoc: { $arrayElemAt: ["$lcStats", 0] },
            gfgDoc: { $arrayElemAt: ["$gfgStats", 0] }
        }
    });

    //extract LC latest contest rating
    stages.push({
        $addFields: {
            lcLatestRating: {
                $let: {
                    vars: {
                        attended: {
                            $filter: {
                                input: { $ifNull: ["$lcDoc.contestHistory", []] },
                                as: "c",
                                cond: { $eq: ["$$c.attended", true] }
                            }
                        }
                    },
                    in: {
                        $ifNull: [
                            {
                                $arrayElemAt: [
                                    {
                                        $map: {
                                            input: { $slice: ["$$attended", -1] },
                                            as: "last",
                                            in: "$$last.rating"
                                        }
                                    },
                                    0
                                ]
                            },
                            0
                        ]
                    }
                }
            },
            lcTotalSolved: { $ifNull: ["$lcDoc.profile.totalSolved", 0] }
        }
    });

    //flatten stats + compute totalSolved early (needed for sort)
    stages.push({
        $addFields: {
            cfRating:   { $ifNull: ["$codeforcesDoc.currentRating", 0] },
            cfSolved:   { $ifNull: ["$codeforcesDoc.totalSolved", 0] },
            lcRating:   { $floor: { $ifNull: ["$lcLatestRating", 0] } },
            ccRating:   { $ifNull: ["$codechefDoc.currentRating", 0] },
            ccSolved:   { $ifNull: ["$codechefDoc.totalSolved", 0] },
            cfStreak:   { $ifNull: ["$codeforcesDoc.currentStreak", 0] },
            lcStreak:   { $ifNull: ["$lcDoc.calendar.streak", 0] },
            cfContests: { $ifNull: ["$codeforcesDoc.contestsParticipated", 0] },
            lcContests: { $ifNull: ["$lcDoc.contestCount", 0] },
            ccContests: { $ifNull: ["$codechefDoc.contestsParticipated", 0] },
            cfMaxRating: { $ifNull: ["$codeforcesDoc.maxRating", 0] },
            totalSolved: {
                $add: [
                    { $ifNull: ["$codeforcesDoc.totalSolved", 0] },
                    { $ifNull: ["$lcDoc.profile.totalSolved", 0] },
                    { $ifNull: ["$codechefDoc.totalSolved", 0] },
                    { $ifNull: ["$gfgDoc.totalSolved", 0] }
                ]
            }
        }
    });

    //compute cpScore
    stages.push({
        $addFields: {
            cpScore: {
                $floor: {
                    $add: [
                        { $multiply: ["$cfRating", 1.5] },
                        { $multiply: ["$lcRating", 1.2] },
                        { $multiply: ["$ccRating", 1.1] },

                        //problem difficulty weighting
                        { $multiply: [{ $ifNull: ["$codeforcesDoc.hardSolved", 0] }, 15] },
                        { $multiply: [{ $ifNull: ["$codeforcesDoc.mediumSolved", 0] }, 8] },
                        { $multiply: [{ $ifNull: ["$codeforcesDoc.easySolved", 0] }, 2] },
                        { $multiply: [{ $ifNull: ["$lcDoc.profile.hardSolved", 0] }, 20] },
                        { $multiply: [{ $ifNull: ["$lcDoc.profile.mediumSolved", 0] }, 8] },
                        { $multiply: [{ $ifNull: ["$lcDoc.profile.easySolved", 0] }, 2] },

                        //codeChef solved problems bonus (2 pts each)
                        { $multiply: ["$ccSolved", 2] },

                        // Overall solved questions bonus (1 pt per problem across all platforms)
                        { $multiply: ["$totalSolved", 1] },
                        { $multiply: [{ $add: ["$cfContests", "$lcContests", "$ccContests"] }, 10] },
                        { $max: [0, { $multiply: [{ $subtract: ["$cfMaxRating", "$cfRating"] }, 0.5] }] },
                        {
                            $min: [
                                { $multiply: [{ $max: ["$cfStreak", "$lcStreak"] }, 2] },
                                200
                            ]
                        },

                        // GFG contribution: codingScore×0.4 + hard×15 + medium×6 + easy×2
                        { $multiply: [{ $ifNull: ["$gfgDoc.codingScore", 0] }, 0.4] },
                        { $multiply: [{ $ifNull: ["$gfgDoc.solvedByDifficulty.hard", 0] }, 15] },
                        { $multiply: [{ $ifNull: ["$gfgDoc.solvedByDifficulty.medium", 0] }, 6] },
                        { $multiply: [{ $ifNull: ["$gfgDoc.solvedByDifficulty.easy", 0] }, 2] }
                    ]
                }
            }
        }
    });

    return stages;
}

/**
 * main leaderboard query — returns top 100 users
 */
const getLeaderboardData = async (scope, scopeValue, category, isAdmin = false) => {
    const sortField = SORT_FIELD_MAP[category] || 'cpScore';
    const stages = buildCorePipeline(scope, scopeValue);

    // only show users with value > 0 in the chosen metric
    stages.push({ $match: { [sortField]: { $gt: 0 } } });

    // sort by chosen category
    stages.push({ $sort: { [sortField]: -1 } });

    // limit to top 100
    stages.push({ $limit: 100 });

    // clean output + anonymity
    const projectStage = {
        _id: 1,
        username: {
            $cond: [
                { $ifNull: ["$preferences.public", true] },
                "$username",
                "Anonymous"
            ]
        },
        name: {
            $cond: [
                { $ifNull: ["$preferences.public", true] },
                "$name",
                "Anonymous"
            ]
        },
        profilePic: {
            $cond: [
                { $ifNull: ["$preferences.public", true] },
                "$profilePic",
                ""
            ]
        },
        cpScore: 1,
        cfRating: 1,
        cfSolved: 1,
        lcRating: 1,
        lcSolved: "$lcTotalSolved",
        ccRating: 1,
        ccSolved: 1,
        gfgSolved: { $ifNull: ["$gfgDoc.totalSolved", 0] },
        totalSolved: 1,
        isPublic: { $ifNull: ["$preferences.public", true] }
    };

    //addmin gets the real username/name for anonymous users
    if (isAdmin) {
        projectStage.realUsername = "$username";
        projectStage.realName = "$name";
    }

    stages.push({ $project: projectStage });

    return await User.aggregate(stages);
};

/**
 * gets a specific users rank and stats for a given scope or category
 * counts how many users have a higher value in the sort field
 */
const getUserRank = async (userId, scope, scopeValue, category) => {
    const sortField = SORT_FIELD_MAP[category] || 'cpScore';
    const stages = buildCorePipeline(scope, scopeValue);

    // only users with value > 0
    stages.push({ $match: { [sortField]: { $gt: 0 } } });

    // find the target user's score first
    const userStages = [...stages, { $match: { _id: new mongoose.Types.ObjectId(userId) } }];
    userStages.push({
        $project: {
            _id: 1,
            username: 1,
            name: 1,
            profilePic: 1,
            cpScore: 1,
            cfRating: 1,
            cfSolved: 1,
            lcRating: 1,
            lcSolved: "$lcTotalSolved",
            ccRating: 1,
            ccSolved: 1,
            totalSolved: 1,
            isPublic: { $ifNull: ["$preferences.public", true] }
        }
    });

    const userResults = await User.aggregate(userStages);
    if (userResults.length === 0) return null;

    const userDoc = userResults[0];
    const userScore = userDoc[sortField] || 0;

    if (userScore <= 0) return null;

    // count how many users have a strictly higher score
    const countStages = [...stages];
    countStages.push({ $match: { [sortField]: { $gt: userScore } } });
    countStages.push({ $count: "above" });

    const countResult = await User.aggregate(countStages);
    const above = countResult.length > 0 ? countResult[0].above : 0;

    return {
        rank: above + 1,
        ...userDoc
    };
};

module.exports = {
    getLeaderboardData,
    getUserRank,
};