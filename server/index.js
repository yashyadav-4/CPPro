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
const dashboardRoutes = require('./Routes/dashboardRoutes');
const leaderboardRoutes= require('./Routes/leaderboardRoutes');
const {startContinuousSync}= require('./Workers/autoSyncWorker');

// connection to mongo
connectToMongoDb(process.env.MongoUrl)
.then(()=> console.log('MongoDb is connected to server'))
.catch(err=> console.log('Error ' , err));


const app= express();
const port= process.env.PORT ? parseInt(process.env.PORT) : 5000;


// cors is not in use currently
app.use(cors({
    origin:'http://localhost:5173',
    credentials:true
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

//auto continous sync
startContinuousSync();

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