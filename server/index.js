const express= require('express');
require('dotenv').config();
const {connectToMongoDb}= require('./connection')
const cookieParser= require('cookie-parser')
const cors= require('cors');
const mongoose = require('mongoose');

const userRoute= require('./Routes/User')
const codeTemplateRoutes= require('./Routes/CodeTemplate')
const postRoutes = require('./Routes/Post');
const commentRoutes= require('./Routes/Comment');
const syncRoutes = require('./Routes/syncRoutes');
const dashboardRoutes = require('./Routes/cfDashboardRoutes');
const leaderboardRoutes= require('./Routes/leaderboardRoutes');
const settingsRoutes=require('./Routes/settingsRoutes');
const lcDashboardRoutes= require('./Routes/lcDashboardRoutes');
const ccDashboardRoutes = require('./Routes/ccDashboardRoutes');
const learningRoutes = require('./Routes/learningRoutes');
const publicStatsRoute = require('./Routes/publicStats');
const contestRoutes    = require('./Routes/contestRoutes');
const notificationRoutes = require('./Routes/notificationRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const dailyRoutes = require('./Routes/dailyRoutes');
const userProfileRoutes = require('./Routes/userProfileRoutes');
const levelUpRoutes = require('./Routes/levelUpRoutes');
const { startContestSyncWorker } = require('./Workers/contestSyncWorker');
const { startLeaderboardSyncWorker } = require('./Workers/leaderboardSyncWorker');
const { dailyWarmup } = require('./Middlewares/dailyWarmup');

connectToMongoDb(process.env.MongoUrl)
.then(() => {
    console.log('MongoDb is connected to server');
    startContestSyncWorker();
    startLeaderboardSyncWorker();
})
.catch(err => console.log('Error ' , err));


const app= express();
const port= process.env.PORT ? parseInt(process.env.PORT) : 5000;

const compression = require('compression');
app.use(compression());

const helmet = require('helmet');
// Security headers — helmet sets X-Content-Type-Options, X-Frame-Options,
// Referrer-Policy, etc. CSP is off to avoid breaking external fonts/scripts.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}))

// prebuilt middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // for forms
app.use(cookieParser());

// Daily warmup — triggers background generation on first request of the day
// Runs BEFORE routes. It reads the auth cookie to check if user is logged in.
// Since verifyToken hasn't run yet, we need to inject a lightweight user check.
const { getUser } = require('./Services/auth');
app.use((req, res, next) => {
    // Lightweight: just decode the JWT cookie to get user._id
    const token = req.cookies?.token;
    if (token) {
        const payload = getUser(token);
        if (payload && payload._id) {
            req.user = payload; // { _id, email, role }
            return dailyWarmup(req, res, next);
        }
    }
    next();
});


// public Routes
app.use('/api/auth' , userRoute);


// auth routes
app.use('/api/codeTemplate' , codeTemplateRoutes );
app.use('/api/posts' , postRoutes);
app.use('/api/comments' , commentRoutes);
app.use('/api/sync' , syncRoutes);
app.use('/api/dashboard' , dashboardRoutes);
app.use('/api/leaderboard' , leaderboardRoutes);
app.use('/api/settings' , settingsRoutes);
app.use('/api/lc-dashboard', lcDashboardRoutes);
app.use('/api/cc-dashboard', ccDashboardRoutes);
app.use('/api/learning/progress', learningRoutes);
app.use('/api/stats', publicStatsRoute);
app.use('/api/contests', contestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/users', userProfileRoutes);
app.use('/api/levelup', levelUpRoutes);

// test
app.get('/api/test', (req, res)=>{
    res.json({message :"backend is working"});
})

//health test for cron-jobs for keeping server active
app.get('/api/health',(req, res)=> {
    const dbState =mongoose.connection.readyState;
    const dbStatusMap= {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };

    const isHealthy =dbState=== 1;

    res.status(isHealthy?200 : 503).json({
        success: isHealthy,
        server: 'online',
        database: dbStatusMap[dbState] || 'unknown',
        uptime: `${Math.floor(process.uptime() / 60)} minutes`,
        timestamp: new Date()
    });
});

// global error handler to catch unhandled errors and return JSON instead of HTML stack trace
app.use((err, req, res, next) => {
    console.error("[Express] unhandled error:", err.message);
    res.status(500).json({ success: false, message: "Internal server error" });
});

app.listen(port , ()=>{
    console.log('Server is live at : ' , port);
})