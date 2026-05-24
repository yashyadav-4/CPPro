const express= require('express');
const router = express.Router();
const {verifyToken, optionalAuth}=require('../Middlewares/auth')


const {handleCreatePost , handleDeletePost , handleDownVote , handleUpvotes ,handleGetPosts, handleTogglePin }= require('../Controllers/Post');

// Public: anyone (including guests) can browse posts
router.get('/' , optionalAuth, handleGetPosts);

// Protected: only authenticated users can write
router.post('/', verifyToken, handleCreatePost);
router.delete('/:id' , verifyToken, handleDeletePost);
router.patch('/:id/upvote' , verifyToken, handleUpvotes);
router.patch('/:id/downvote' , verifyToken, handleDownVote);
router.patch('/:id/pin', verifyToken, handleTogglePin);

module.exports=router;
