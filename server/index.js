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
const { startContestSyncWorker } = require('./Workers/contestSyncWorker');

connectToMongoDb(process.env.MongoUrl)
.then(() => {
    console.log('MongoDb is connected to server');
    //start the 6-hour contest sync worker once the DB is ready
    startContestSyncWorker();
})
.catch(err => console.log('Error ' , err));


const app= express();
const port= process.env.PORT ? parseInt(process.env.PORT) : 5000;


app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
    credentials: true,
}))

// prebuilt middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // for forms
app.use(cookieParser());


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

app.listen(port , ()=>{
    console.log('Server is live at : ' , port);
})