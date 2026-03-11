const mongoose= require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null 
    },
    content: {
        type: String,
        required: true
    }
}, { timestamps: true });


commentSchema.index({ postId: 1, createdAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);
module.exports=Comment;