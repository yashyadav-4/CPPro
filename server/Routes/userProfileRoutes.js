const express = require('express');
const router = express.Router();

const { optionalAuth } = require('../Middlewares/auth');
const { getUserPublicProfile } = require('../Controllers/publicProfileController');

// optionalAuth so admins / owners are identified for bypass
router.get('/:username/profile', optionalAuth, getUserPublicProfile);

module.exports = router;
