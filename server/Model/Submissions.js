const mongoose= require('mongoose');

const submissionSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    // problem details
    problemId:{
        type:String ,
        required:true,
    },
    problemTitle:{
        type:String,
        required:true,
    },
    platform:{
        type:String,
        enum:['codeforces' , 'leetcode' , 'codechef'],
        required:true,
    },
    problemUrl:{
        type:String,
    },
    //submission stats
    verdict:{
        type:String,
        required:true,
        enum:['AC' , 'WA', 'TLE', 'MLE', 'RE', 'CE', 'OTHER']
    },
    difficulty:{
        type:String,
        default:'0',
    },
    tags:[{type:String}],
    submittedAt:{
        type:Date,
        required:true,
    },
    //will help in user analytics
    isUpSolved:{
        type:Boolean ,
        default:false,
    },
    attemptCount:{
        type:Number,
        default:1,
    },
},{timestamps : true});

submissionSchema.index({userId:1 , submittedAt:-1}); // for recent problems solved by user
submissionSchema.index({userId:1 , problemId:1 , submittedAt :1} , {unique:true}); //to avoid duplicate sumissions like if user refetch to or 3 times day it may see same submissions and increment submission but we want it to have original single copy of submission only
submissionSchema.index({tags:1}); // for indexing in tags

const Submission = mongoose.model('Submission' , submissionSchema);


module.exports= Submission;