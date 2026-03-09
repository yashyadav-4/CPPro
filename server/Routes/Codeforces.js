const express= require('express');
const {handleUserCfVerification}= require('../Controllers/Codeforces')
const {verifyToken}=require('../Middlewares/auth');

const router= express.Router();

router.get('/handleVerification/:handle'  , verifyToken  , handleUserCfVerification );


module.exports= router;