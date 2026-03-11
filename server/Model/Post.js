const mongoose= require('mongoose');

const postSchema= new mongoose.Schema({
    authorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    authorName:{
        type:String ,
        required:true,
    },
    authorPic:{
        type:String,
    },
    title: { 
        type: String,
        required: [true, "Post title is required"],
        trim: true,
        maxLength: 150
    },
    types:{
        type:String,
        enum:['blog' , 'discussion' , 'help'],
        default:'discussion',
    },
    content:{
        type:String,
        required:true,
    },
    tags:[{type:String}],

    upVotes:[{type:mongoose.Schema.Types.ObjectId  , ref:'User'}],
    downVotes:[{type:mongoose.Schema.Types.ObjectId  , ref:'User'}],

    commentCount:{
        type:Number , 
        default:0,
    },
    isPinned:{
        type:Boolean , 
        default:false,
    }
} , {timestamps: true});

postSchema.index({title:'text' , content:'text'});
postSchema.index({authorId:1 , created:-1});
postSchema.index({tags:1});


const Post=mongoose.model('Post' ,postSchema);
module.exports= Post;