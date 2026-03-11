const express= require('express');
const router = express.Router();
const {verifyToken}=require('../Middlewares/auth')

const {handleAddComment , handleDeleteComment , handleGetComments}= require('../Controllers/Comment');

router.use(verifyToken); // for all routes

router.get('/:postId' , handleGetComments);
router.post('/:postId' , handleAddComment);
router.delete('/:commentId' , handleDeleteComment);

module.exports=router;