const express = require('express');
const { handleUserSignup, handleUserLogin , handleVerifyAuth , handleLogOut , handlePasswordChange, handleGoogleAuth} = require('../Controllers/User')


const router = express.Router();

router.post('/login', handleUserLogin);
router.post('/signup', handleUserSignup);
router.post('/google', handleGoogleAuth);
router.get('/verify' , handleVerifyAuth);
router.post('/logout' , handleLogOut);

router.post('/change-password' , handlePasswordChange);

module.exports = router;