const mongoose= require('mongoose');

const cfSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    cfUsername:{
        type:String ,
        required:true,
    },
    maxRating:{
        type:Number,
    },
    currRating:{
        type:Number,
    },
    currRank:{
        type:String,
    },
    maxRank:{
        type:String,
    },
    
})

const CfData=mongoose.model('CfData' , cfSchema);

module.exports= CfData;