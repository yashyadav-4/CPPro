const express= require('express');
require('dotenv').config();
const {connectToMongoDb}= require('./connection')
const cookieParser= require('cookie-parser')
const cors= require('cors');

const userRoute= require('./Routes/User')
const codeTemplateRoutes= require('./Routes/CodeTemplate')
const postRoutes = require('./Routes/Post');
const commentRoutes= require('./Routes/Comment');

// connection to mongo
connectToMongoDb(process.env.MongoUrl)
.then(()=> console.log('MongoDb is connected to server'))
.catch(err=> console.log('Error ' , err));


const app= express();
const port= process.env.port ? parseInt(process.env.port) : 5000;


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

// test
app.get('/api/test' , (req, res)=>{
    res.json({ message :"backend is working"});
})


app.listen(port , ()=>{
    console.log('Server is live at : ' , port);
})