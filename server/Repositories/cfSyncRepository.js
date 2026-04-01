
const Submission = require('../Model/Submissions');

const verdictMap={
    'OK': 'AC',
    'WRONG_ANSWER': 'WA',
    'TIME_LIMIT_EXCEEDED': 'TLE',
    'MEMORY_LIMIT_EXCEEDED': 'MLE',
    'RUNTIME_ERROR': 'RE',
    'COMPILATION_ERROR': 'CE',
    'OUTPUT_LIMIT_EXCEEDED': 'OTHER', 
    'IDLENESS_LIMIT_EXCEEDED': 'OTHER',
    'CHALLENGED': 'OTHER',
    'SKIPPED': 'OTHER',
    'TESTING': 'OTHER'
}

const processAndSaveSubmissions = async (userId , rawSubmissions)=>{
    if(!rawSubmissions || rawSubmissions.length===0 ) return {upsertedCount:0 , modifiedCount:0};

    const bulkOps= rawSubmissions.map(sub=>{

        const problemId= `${sub.problem.contestId || ''}${sub.problem.index}`;
        const finalVerdict= verdictMap[sub.verdict] || 'OTHER';
        const difficulty= sub.problem.rating ? sub.problem.rating.toString():'0';
        const contestId = sub.problem.contestId ? sub.problem.contestId.toString() : null;
        const submittedDate = new Date(sub.creationTimeSeconds *1000);

        return {
            updateOne:{
                filter:{
                    userId: userId,
                    problemId: problemId,
                    submittedAt: submittedDate
                },

                update:{
                    $set:{
                        userId:userId,
                        problemId:problemId,
                        problemTitle: sub.problem.name,
                        platform:'codeforces',
                        verdict: finalVerdict,
                        difficulty : difficulty,
                        tags: sub.problem.tags || [],
                        language:sub.programmingLanguage || '',
                        contestId : contestId,
                        submittedAt : submittedDate
                    }
                },
                upsert:true // if submission doesnt exist then create else ignore
            }
        };
    });

    const result= await Submission.bulkWrite(bulkOps , {unordered:true});
    return result;
};

module.exports={
    processAndSaveSubmissions,
}
