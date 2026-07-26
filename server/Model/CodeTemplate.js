const mongoose= require('mongoose');


const codeTemplateSchema= new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    title:{
        type:String,
        required:[true , "please provide a Title"],
        trim:true,
        maxLength:100,
    },
    description:{
        type:String,
        maxLength:500,
        default:"",
    },
    language:{
        type:String,
        required:true,
        default:'cpp',
        enum:['cpp' , 'python' , 'java' , 'javascript'], 
    },
    code:{
        type:String,
        required:[true , "Code cannot be empty"],
    },
    tags:[{
        type:String,
        trim:true,
    }],
    isPublic:{
        type:Boolean,
        default:false,
    },
},{timestamps:true})

codeTemplateSchema.index({userId:1 , createdAt:-1});

const CodeTemplate= mongoose.model('CodeTemplate',codeTemplateSchema);

module.exports=CodeTemplate;