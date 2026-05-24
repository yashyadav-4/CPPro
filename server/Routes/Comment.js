const express= require('express');
const router = express.Router();
const {verifyToken, optionalAuth}=require('../Middlewares/auth')

const {handleAddComment , handleDeleteComment , handleGetComments}= require('../Controllers/Comment');

// Public: anyone can read comments
router.get('/:postId' , optionalAuth, handleGetComments);

// Protected: only authenticated users can write/delete comments
router.post('/:postId' , verifyToken, handleAddComment);
router.delete('/:commentId' , verifyToken, handleDeleteComment);

module.exports=router;