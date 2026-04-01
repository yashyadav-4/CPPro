const express= require('express');
const router= express.Router();
const {verifyToken}= require('../Middlewares/auth')
const {handleManualRefresh, handleLcManualRefresh}= require('../Controllers/syncController');

router.use(verifyToken);
router.post('/refresh', handleManualRefresh);
router.post('/refresh-lc', handleLcManualRefresh);
module.exports=router;