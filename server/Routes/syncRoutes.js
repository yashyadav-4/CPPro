const express= require('express');
const router= express.Router();
const {verifyToken}= require('../Middlewares/auth')
const {handleManualRefresh}= require('../Controllers/syncController');

router.use(verifyToken);
router.post('/refresh' ,handleManualRefresh);
module.exports=router;