const User= require('../Model/User');
const {setUser, getUser}= require('../Services/auth')
const bcrypt = require('bcryptjs');


function handleVerifyAuth(req , res){
    const token=req.cookies?.token;
    if(!token) return res.json({authenticated:false});
    const user= getUser(token);
    return res.json({authenticated: !!user});
}

async function handleUserSignup(req , res){
    const { name , email , password }= req.body;
    try{
        const user= await User.findOne({email});
        if(user) return res.status(400).json({message : "Account already exists"});
        
        // using bcrypt for password hashing
        const hashedPassword= await bcrypt.hash(password , 10);
        await User.create({
            name ,
            email ,
            password:hashedPassword,
        })
        return res.status(201).json({message:" Account created successfully "})
    }catch(err){
        console.log("Error " , err);
        return res.status(500).json({ message: "Something went wrong" });
    }
}

async function handleUserLogin(req , res){
    try{
        const {email , password}=req.body;
        if(!email || !password) {
            return res.status(400).json({Error: "invalid Credentials"});
        }
        const user=await User.findOne({email});
        if(!user) return res.status(401).json({message:"invalid Credentials"})
        
        // bcrypt confirmation
        const isMatch= await bcrypt.compare(password , user.password);
        if(!isMatch){
            return res.status(401).json({message:"Invalid Credentials"});
        }

        const token=setUser(user);

        res.cookie('token' , token , {
            httpOnly:true,
            path:'/',
            // secure: process.env.NODE_ENV==='production' ,
            sameSite:'strict',
            maxAge:7* 24 *60 *60 *1000 // means 7 days
        });
        res.status(200).json({message:"Login Successful "});
    }catch(err){
        console.error("Login error :" ,err);
        res.status(500).json({message: "Something went wrong"});
    }
}

function handleLogOut(req , res){
    res.clearCookie('token' , {path:'/'});
    return res.json({message: "logged out succesfully"});
}

async function handlePasswordChange(req , res){
    try{
        const {email , oldPassword , newPassword}= req.body;
        if(!email || !oldPassword || !newPassword ) return res.status(401).json({Error:"invalid Credentials"});
        const user= await User.findOne({email});
        if(!user) return res.status(401).json({message:"Invalid credentials"});

        const correctPass=await bcrypt.compare(oldPassword , user.password);
        if(!correctPass){
            return res.status(401).json({message:"invalid credentials"});
        }

        const hashedPassword= await bcrypt.hash(newPassword , 10);
        user.password=hashedPassword;
        await user.save();

        return res.status(200).json({message:"Password updated successfully"})

    }catch(err){
        console.log(err);
        res.status(500).json({message:"something went wrong"});
    }
}

module.exports={
    handleUserSignup,
    handleUserLogin,
    handleVerifyAuth,
    handleLogOut,
    handlePasswordChange,

}