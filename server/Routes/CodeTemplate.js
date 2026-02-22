const express= require('express');
const { handleFetchAllTemplate, handleTemplateAdd, handleTemplateDelete, handleTemplateUpdate }= require('../Controllers/CodeTemplate')

const {verifyToken} = require('../Middlewares/auth');
const router= express.Router();

router.get('/' ,verifyToken ,handleFetchAllTemplate);
router.post('/' ,verifyToken , handleTemplateAdd);
router.delete('/:id' ,verifyToken , handleTemplateDelete);
router.patch('/:id' ,verifyToken , handleTemplateUpdate);

module.exports=router;