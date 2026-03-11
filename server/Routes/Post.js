const express= require('express');
const router = express.Router();
const {verifyToken}=require('../Middlewares/auth')


const {handleCreatePost , handleDeletePost , handleDownVote , handleUpvotes ,handleGetPosts }= require('../Controllers/Post');

router.use(verifyToken); // for all routes

router.post('/',handleCreatePost);
router.delete('/:id' , handleDeletePost);
router.patch('/:id/upvote' , handleUpvotes);
router.patch('/:id/downvote' , handleDownVote);

module.exports=router;
