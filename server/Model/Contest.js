// all contests collection
const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    contestId: { // platform + slugified name + start time
        type: String,
        required:true,
        unique:true,
        index:true,
    },
    platform: {
        type: String,
        enum:['codeforces', 'leetcode', 'codechef', 'custom'],
        required: true,
        index:    true,
    },
    name: {
        type: String,
        required :true,
        trim : true,
    },
    startTime: {
        type: Date,
        required:true,
        index: true,
    },
    endTime: {
        type: Date,
        default: null,
    },
    duration: {
        type: Number,     
        default: null,
    },
    url: {
        type: String,
        default: null,
    },
    status: {
        type:String,     
        default: null,
    },
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
}, { timestamps: true });

contestSchema.index(
    { endTime: 1 },
    { expireAfterSeconds: 180 * 24 * 3600 } 
);

const Contest = mongoose.model('Contest', contestSchema);
module.exports = Contest;
