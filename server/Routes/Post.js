const express= require('express');
const router = express.Router();
const {verifyToken}=require('../Middlewares/auth')


const {handleCreatePost , handleDeletePost , handleDownVote , handleUpvotes ,handleGetPosts, handleTogglePin }= require('../Controllers/Post');

router.use(verifyToken); // for all routes

router.get('/' , handleGetPosts);
router.post('/',handleCreatePost);
router.delete('/:id' , handleDeletePost);
router.patch('/:id/upvote' , handleUpvotes);
router.patch('/:id/downvote' , handleDownVote);
router.patch('/:id/pin', handleTogglePin);

module.exports=router;
