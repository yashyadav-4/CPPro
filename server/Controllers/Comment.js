const Comment = require('../Model/Comment');
const Post = require('../Model/Post');

async function handleAddComment(req , res){
    try{
        const {content , parentId} = req.body;
        const {postId}= req.params;

        const newComment= await Comment.create({
            postId,
            authorId:req.user._id,
            parentId: parentId || null,
            content
        })

        await Post.findByIdAndUpdate(postId ,{$inc: {commentCount:1}});
        res.status(201).json(newComment);
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

async function handleDeleteComment(req , res){
    try{
        const {commentId}= req.params;
        const comment= await Comment.findById(commentId);
        if(!comment){
            return res.status(404).json({message: "comment not found to delete"});
        }
        if(comment.authorId.toString()!== req.user._id.toString() ){
            return res.status(403).json({message: "you are unauthorized to delete this comment"});
        }
        const postId= comment.postId;
        const deletedReplies= await Comment.countDocuments({parentId:commentId});

        await Comment.deleteMany({parentId:commentId});
        await Comment.findByIdAndDelete(commentId);
        
        await Post.findByIdAndUpdate(postId , {$inc :{commentCount:- (deletedReplies +1)}});
        return res.status(200).json({message: "succesfully deleted comment"});
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

async function handleGetComments(req , res){
    try{
        const comments= await Comment.find({postId:req.params.postId})
            .sort({createdAt:1})
            .lean()

        res.json(comments);
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

module.exports={
    handleAddComment,
    handleDeleteComment,
    handleGetComments,

}