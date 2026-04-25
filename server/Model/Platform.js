const mongoose= require('mongoose')

const platformSchema= new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    platform:{
        type:String,
        enum:['codeforces', 'codechef', 'leetcode'],
        required:true,
    },
    platformUsername:{
        type:String,
        required:true,
        trim:true,
    },
    currentRating:{
        type:Number,
        default:0,
    },
    maxRating:{
        type:Number,
        default:0,
    },
    currentRank:{
        type:String,
        default:'unrated',
    },
    maxRank:{
        type:String,
        default:'unrated',
    },
    contribution:{
        type:Number,
        default:0,
    },
    ratedHistory:[{
        rating:{type:Number},
        date:{type:Date},
        contestName:{type:String},
        rank:{type:Number},
    }],
    totalSolved:{
        type:Number,
        default:0,
    },
    solvedByTopics:{
        type:Map,
        of:Number,
        default:{},
    },
    solvedByRating:{
        type:Map,
        of:Number,
        default:{},
    },
    lastSyncedAt:{
        type:Date,
        default:null
    },
    //CPScore analytics summary fields
    easySolved:{ type:Number, default:0 },
    mediumSolved:{ type:Number, default:0 },
    hardSolved:{ type:Number, default:0 },
    currentStreak:{ type:Number, default:0 },
    contestsParticipated:{ type:Number, default:0 },
    // CodeChef-specific (unused by CF/LC, default 0)
    globalRank:{ type:Number, default:0 },
    countryRank:{ type:Number, default:0 }
} , {timestamps:true});

platformSchema.index({ userId:1 , platform:1 });
platformSchema.index({platformUsername :1});

const Platform= mongoose.model('Platform' , platformSchema);

module.exports= Platform ;
