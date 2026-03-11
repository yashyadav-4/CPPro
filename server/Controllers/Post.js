const Post = require('../Model/Post');

const User = require('../Model/User');

async function handleCreatePost(req , res){
    try{
        const {title , content , types , tags}=req.body;
        const fullUser = await User.findById(req.user._id);
        if (!fullUser) return res.status(404).json({ message:"user not found in database."});

        const newPost= await Post.create({
            authorId: req.user._id,
            authorName: fullUser.username || "Anonymous",
            authorPic: fullUser.profilePic || "",
            title,
            content,
            types,
            tags
        });
        res.status(201).json(newPost);
    }catch(error){
        res.status(500).json({message:error.message});
    }
}

async function handleGetPosts(req , res){
    try{
        const {search , tag , page=1}= req.query;
        const pageNumber = parseInt(page, 10) || 1;
        const limit=10;
        const query={};

        if(search){
            query.$text= {$search:search};
        }
        if(tag){
            query.tags=tag;
        }
        const posts= await Post.find(query)
            .sort(search ? {score:{$meta:"textScore"}}: {createdAt:-1})
            .skip((pageNumber-1)*limit)
            .limit(limit)
            .lean()

        res.json(posts);
    }catch(error){
        res.status(500).json({message: error.message});
    }
}


async function handleDeletePost(req , res){
    try{   
        const post =await Post.findById(req.params.id);
        if(!post) return res.status(404).json({message: "post not found"});
        
        if(post.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin'){
            return res.status(403).json({message:" you are not authorized to delete this post" });
        }
        
        await Post.findByIdAndDelete(req.params.id);
        
        res.json({message: "Post deleted successfully"});
        
    }catch(error){
        res.status(500).json({message : error.message});
    }
}

async function handleUpvotes(req , res){
    try{
        const post =await Post.findById(req.params.id);
        const userId= req.user._id;

        const hasUpvoted = post.upVotes.some(id => id.toString() === userId.toString());

        if(hasUpvoted){//togelling
            await Post.findByIdAndUpdate(req.params.id , {$pull :{upVotes:userId}});
        }else{
            await Post.findByIdAndUpdate(req.params.id , {
                $addToSet :{upVotes:userId},
                $pull : {downVotes:userId}
            });
        }
        res.json({message: "Vote updated"});
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

async function handleDownVote(req , res){
    try{
        const post= await Post.findById(req.params.id);
        const userId= req.user._id;

        const hasDownvoted = post.downVotes.some(id => id.toString() === userId.toString());

        if(hasDownvoted){
            await Post.findByIdAndUpdate(req.params.id , {$pull : {downVotes:userId}});
        }else{
            await Post.findByIdAndUpdate(req.params.id , {
                $addToSet :{downVotes:userId},
                $pull : {upVotes:userId}
            });
        }
        res.json({message:"vote updated"})
    }catch(error){
        res.status(500).json({message: error.message});
    }
}

module.exports={
    handleCreatePost,
    handleGetPosts,
    handleUpvotes,
    handleDeletePost,
    handleDownVote,
}